/**
 * SearchModal Component
 *
 * 快速搜索模态框组件
 *
 * 功能特性：
 * - Cmd+P (Mac) 或 Ctrl+P (Windows/Linux) 快捷键触发
 * - 模糊搜索文件和文件夹（使用 Fuse.js）
 * - 键盘导航：上下箭头选择、回车确认、ESC 关闭
 * - 高亮匹配文本
 * - 显示文件图标
 * - 防抖搜索输入（300ms）
 * - LRU 缓存优化性能
 * - 搜索历史记录
 * - 性能指标追踪
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTimes, FaKeyboard, FaSearch, FaHistory } from 'react-icons/fa';
import * as Dialog from '@radix-ui/react-dialog';
import Fuse from 'fuse.js';
import { cn } from '../../utils/cn.js';
import { SearchInput } from './SearchInput.js';
import { SearchResults, type SearchResultItem } from './SearchResults.js';
import { LRUSearchCache } from '../../../utils/searchCache.js';
import { SearchPerformanceTracker } from '../../../utils/searchPerformance.js';
import { useFileAccessHistory } from '../../hooks/useFileAccessHistory.js';
import { parseSearchQuery, evaluateQuery } from '../../../utils/searchQueryParser.js';

/**
 * 搜索模态框属性
 */
export interface SearchModalProps {
  /** 是否打开 */
  open: boolean;
  /** 打开状态变化回调 */
  onOpenChange: (open: boolean) => void;
  /** 文件列表（用于搜索） */
  files?: Array<{
    name: string;
    path: string;
    type: 'file' | 'folder';
    extension?: string;
  }>;
  /** 自定义样式类名 */
  className?: string;
  /** 最大显示结果数量 */
  maxResults?: number;
  /** 防抖延迟（毫秒） */
  debounceDelay?: number;
  /** 当前活动文件路径 */
  activePath?: string;
  /** 结果选择回调 */
  onSelect?: (item: SearchResultItem) => void;
  /** 是否启用性能追踪 */
  enablePerformanceTracking?: boolean;
}

/**
 * 快捷键映射
 */
const SHORTCUT_KEY = {
  mac: 'k',
  windows: 'k',
  modifier: {
    mac: '⌘',
    windows: 'Ctrl',
  },
};

/**
 * 搜索模态框组件
 */
export function SearchModal({
  open,
  onOpenChange,
  files = [],
  className,
  maxResults = 8,
  debounceDelay = 300,
  activePath,
  onSelect,
  enablePerformanceTracking = process.env.NODE_ENV === 'development',
}: SearchModalProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // 访问历史 hook
  const { getRecentFiles } = useFileAccessHistory();

  // 搜索历史
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('folder-site-search-history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 增强的 LRU 搜索缓存
  const searchCache = useRef<LRUSearchCache<SearchResultItem[]>>(
    new LRUSearchCache<SearchResultItem[]>({
      maxSize: 100,
      ttl: 5000,
      enableStats: true,
      cleanupInterval: 10000,
    })
  );

  // 性能追踪器
  const perfTracker = useRef<SearchPerformanceTracker | null>(
    enablePerformanceTracking ? new SearchPerformanceTracker() : null
  );

  // Fuse.js 实例
  const fuse = useMemo(() => {
    return new Fuse(files, {
      keys: [
        { name: 'name', weight: 0.7 },
        { name: 'path', weight: 0.3 }
      ],
      threshold: 0.3,
      includeScore: true,
      includeMatches: true,
      minMatchCharLength: 1
    });
  }, [files]);

  // 防抖处理
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceDelay);

    return () => clearTimeout(timer);
  }, [query, debounceDelay]);

  // 模糊搜索（支持逻辑查询 + Fuse.js + LRU 缓存 + 性能追踪）
  const searchResults = useMemo(() => {
    if (!debouncedQuery.trim()) {
      // 如果没有查询，按访问次数排序显示
      const recentFiles = getRecentFiles(maxResults);

      return files
        .map((file) => ({
          ...file,
          score: 1,
        }))
        .sort((a, b) => {
          const aIndex = recentFiles.findIndex(f => f.path === a.path);
          const bIndex = recentFiles.findIndex(f => f.path === b.path);

          // 两个都在历史记录中，按访问次数和最近访问时间排序
          if (aIndex !== -1 && bIndex !== -1) {
            return (recentFiles[aIndex].visitCount - recentFiles[bIndex].visitCount) ||
                   (recentFiles[bIndex].lastAccessed - recentFiles[aIndex].lastAccessed);
          }

          // 只有 a 在历史记录中
          if (aIndex !== -1) return -1;

          // 只有 b 在历史记录中
          if (bIndex !== -1) return 1;

          // 都不在历史记录中，保持原顺序
          return 0;
        })
        .slice(0, maxResults);
    }

    const tracker = perfTracker.current;
    const measureId = tracker?.startMeasure('modal-search-execution');

    // 检查缓存
    const cacheKey = debouncedQuery.toLowerCase();
    const cached = searchCache.current.get(cacheKey);

    if (cached) {
      tracker?.recordCacheHit(true);
      tracker?.endMeasure(measureId ?? '');
      return cached;
    }

    tracker?.recordCacheHit(false);

    // 解析查询
    const parsed = parseSearchQuery(debouncedQuery);

    let results: SearchResultItem[] = [];

    // 如果是逻辑查询，使用逻辑评估
    if (parsed.isLogicalQuery && parsed.ast) {
      // 创建模糊匹配函数
      const fuzzyMatcher = (term: string, item: any, exact?: boolean): boolean => {
        const searchText = `${item.name} ${item.path}`.toLowerCase();
        const termLower = term.toLowerCase();

        if (exact) {
          // 精确匹配
          return searchText.includes(termLower);
        }

        // 使用 Fuse.js 进行模糊匹配
        const termFuse = new Fuse([item], {
          keys: ['name', 'path'],
          threshold: 0.3,
        });
        const termResults = termFuse.search(term);
        return termResults.length > 0;
      };

      // 过滤文件
      const filteredFiles = files.filter(file => 
        evaluateQuery(parsed.ast!, file, fuzzyMatcher)
      );

      // 对结果进行评分和排序
      results = filteredFiles.map(file => {
        // 计算每个搜索词的匹配分数
        let totalScore = 0;
        let matchCount = 0;

        for (const term of parsed.terms) {
          const termFuse = new Fuse([file], {
            keys: [
              { name: 'name', weight: 0.7 },
              { name: 'path', weight: 0.3 }
            ],
            threshold: 0.3,
            includeScore: true,
          });
          const termResults = termFuse.search(term);
          if (termResults.length > 0 && termResults[0].score !== undefined) {
            totalScore += (1 - termResults[0].score);
            matchCount++;
          }
        }

        const avgScore = matchCount > 0 ? totalScore / matchCount : 0;

        return {
          ...file,
          score: avgScore,
          matchedIndices: [] as number[],
        };
      }).sort((a, b) => b.score - a.score).slice(0, maxResults);
    } else {
      // 使用 Fuse.js 模糊搜索
      const fuseResults = fuse.search(debouncedQuery);

      // 转换为搜索结果格式
      results = fuseResults
        .slice(0, maxResults)
        .map((result) => {
          const indices = result.matches?.[0]?.indices || [];
          return {
            ...result.item,
            score: 1 - (result.score || 0), // Fuse.js 返回的是距离分数，需要转换
            matchedIndices: indices.flat() as number[],
          };
        });
    }

    // 缓存结果
    searchCache.current.set(cacheKey, results);

    tracker?.recordSearchResultCount(results.length);
    tracker?.endMeasure(measureId ?? '');

    return results;
  }, [files, debouncedQuery, maxResults, fuse, getRecentFiles]);

  // 保存搜索历史
  useEffect(() => {
    if (debouncedQuery && debouncedQuery.trim() && !searchHistory.includes(debouncedQuery)) {
      const newHistory = [debouncedQuery, ...searchHistory].slice(0, 10);
      setSearchHistory(newHistory);
      if (typeof window !== 'undefined') {
        localStorage.setItem('folder-site-search-history', JSON.stringify(newHistory));
      }
    }
  }, [debouncedQuery, searchHistory]);

  // 清除缓存当文件列表变化时
  useEffect(() => {
    searchCache.current.clear();
    perfTracker.current?.reset();
  }, [files]);

  // 重置选中索引
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // 打开时清空查询并聚焦
  useEffect(() => {
    if (open) {
      setQuery('');
      setDebouncedQuery('');
      setSelectedIndex(0);
    }
  }, [open]);

  // 关闭模态框
  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  // 处理键盘导航
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (searchResults.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % searchResults.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(
            (prev) => (prev - 1 + searchResults.length) % searchResults.length
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (searchResults[selectedIndex]) {
            handleResultClick(searchResults[selectedIndex], selectedIndex);
          }
          break;
        case 'Escape':
          e.preventDefault();
          handleClose();
          break;
      }
    },
    [searchResults, selectedIndex, handleClose]
  );

  // 处理结果点击
  const handleResultClick = useCallback(
    (item: SearchResultItem, index: number) => {
      setSelectedIndex(index);
      onSelect?.(item);

      // 记录访问历史
      const { recordAccess } = useFileAccessHistory.getState();
      recordAccess(item.path, item.name);

      // 跳转到文件页面，添加 /file/ 前缀
      navigate(`/file/${item.path}`);
      handleClose();
    },
    [navigate, handleClose, onSelect]
  );

  // 处理查询变化
  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
  }, []);

  // 处理清除查询
  const handleClearQuery = useCallback(() => {
    setQuery('');
  }, []);

  // 判断是否为 Mac
  const isMac = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return /Mac|iPod|iPhone|iPad/.test(window.navigator.platform);
  }, []);

  const modifier = isMac ? SHORTCUT_KEY.modifier.mac : SHORTCUT_KEY.modifier.windows;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            'fixed inset-0 z-50 bg-background/80 backdrop-blur-sm',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0'
          )}
        />

        <Dialog.Content
          className={cn(
            'fixed left-[50%] top-[20%] z-50 w-full max-w-2xl -translate-x-1/2',
            'rounded-lg border bg-background shadow-lg',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]',
            'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
            className
          )}
          onPointerDownOutside={(e: any) => e.preventDefault()}
          onInteractOutside={(e: any) => e.preventDefault()}
          onEscapeKeyDown={(e: any) => {
            e.preventDefault();
            handleClose();
          }}
        >
          <Dialog.Title className="sr-only">
            Quick Search
          </Dialog.Title>

          <div
            ref={containerRef}
            className="flex flex-col max-h-[60vh]"
            onKeyDown={handleKeyDown}
            role="dialog"
            aria-modal="true"
            aria-labelledby="search-modal-title"
          >
            {/* 头部 */}
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="flex items-center gap-2">
                <FaKeyboard className="h-4 w-4 text-muted-foreground" />
                <h2
                  id="search-modal-title"
                  className="text-sm font-semibold"
                >
                  Quick Search
                </h2>
              </div>

              {/* 快捷键提示 */}
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
                  <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono">
                    {modifier}
                  </kbd>
                  <span>+</span>
                  <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono">
                    K
                  </kbd>
                </div>

                {/* 关闭按钮 */}
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className={cn(
                      'rounded-md p-2 text-muted-foreground',
                      'hover:bg-muted hover:text-foreground',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                      'transition-colors'
                    )}
                    aria-label="Close search"
                  >
                    <FaTimes className="h-4 w-4" />
                  </button>
                </Dialog.Close>
              </div>
            </div>

            {/* 搜索输入框 */}
            <div className="border-b px-4 py-3">
              <SearchInput
                value={query}
                onChange={handleQueryChange}
                onClear={handleClearQuery}
                placeholder="Search files and folders... (try: react AND tutorial)"
                autoFocus
              />
              
              {/* 搜索语法提示 */}
              {!query && (
                <div className="mt-2 text-xs text-muted-foreground">
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    <span>
                      <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">
                        term1 AND term2
                      </kbd>
                      {' '}Both terms
                    </span>
                    <span>
                      <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">
                        term1 OR term2
                      </kbd>
                      {' '}Either term
                    </span>
                    <span>
                      <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">
                        term1 AND NOT term2
                      </kbd>
                      {' '}Exclude
                    </span>
                    <span>
                      <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">
                        "exact match"
                      </kbd>
                      {' '}Exact
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 搜索结果 */}
            <div className="flex-1 overflow-hidden">
              <SearchResults
                results={searchResults}
                selectedIndex={selectedIndex}
                onSelectIndex={setSelectedIndex}
                onResultClick={handleResultClick}
                query={query}
                maxVisible={maxResults}
                activePath={activePath}
                className="max-h-[400px]"
                noResultsText={
                  query
                    ? `No results for "${query}"`
                    : 'Type to search...'
                }
              />
            </div>

            {/* 底部提示 */}
            <div className="flex items-center justify-between border-t px-4 py-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">
                    ↑↓
                  </kbd>
                  <span>Navigate</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">
                    Enter
                  </kbd>
                  <span>Select</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">
                    Esc
                  </kbd>
                  <span>Close</span>
                </span>
              </div>

              {/* 结果统计 */}
              {searchResults.length > 0 && (
                <span>
                  {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/**
 * SearchModal 触发器组件
 * 用于在应用中显示搜索触发按钮
 */
export interface SearchTriggerProps {
  /** 点击回调 */
  onClick?: () => void;
  /** 自定义样式类名 */
  className?: string;
  /** 是否显示快捷键提示 */
  showShortcut?: boolean;
}

/**
 * 搜索触发器按钮
 */
export function SearchTrigger({
  onClick,
  className,
  showShortcut = true,
}: SearchTriggerProps) {
  const isMac = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return /Mac|iPod|iPhone|iPad/.test(window.navigator.platform);
  }, []);

  const modifier = isMac ? SHORTCUT_KEY.modifier.mac : SHORTCUT_KEY.modifier.windows;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5',
        'text-sm text-muted-foreground',
        'hover:bg-muted hover:text-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'transition-colors',
        'w-full max-w-sm',
        className
      )}
    >
      <FaSearch className="h-4 w-4 flex-shrink-0" />
      <span className="flex-1 text-left">Search...</span>
      {showShortcut && (
        <span className="flex items-center gap-1 text-xs">
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono">
            {modifier}
          </kbd>
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono">
            K
          </kbd>
        </span>
      )}
    </button>
  );
}