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
 * - 防抖搜索输入
 * - LRU 缓存优化性能
 * - 搜索历史记录
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTimes, FaKeyboard, FaSearch, FaHistory } from 'react-icons/fa';
import * as Dialog from '@radix-ui/react-dialog';
import Fuse from 'fuse.js';
import { cn } from '../../utils/cn.js';
import { SearchInput } from './SearchInput.js';
import { SearchResults, type SearchResultItem } from './SearchResults.js';

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
  debounceDelay = 150,
  activePath,
  onSelect,
}: SearchModalProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

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

  // 搜索缓存
  const searchCache = useRef<Map<string, SearchResultItem[]>>(new Map());

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

  // 模糊搜索（使用 Fuse.js + 缓存）
  const searchResults = useMemo(() => {
    if (!debouncedQuery.trim()) {
      // 如果没有查询，显示默认推荐
      return files.slice(0, maxResults).map((file) => ({
        ...file,
        score: 1,
      }));
    }

    // 检查缓存
    const cacheKey = debouncedQuery.toLowerCase();
    if (searchCache.current.has(cacheKey)) {
      return searchCache.current.get(cacheKey)!;
    }

    // 使用 Fuse.js 搜索
    const fuseResults = fuse.search(debouncedQuery);

    // 转换为搜索结果格式
    const results: SearchResultItem[] = fuseResults
      .slice(0, maxResults)
      .map((result) => ({
        ...result.item,
        score: 1 - (result.score || 0), // Fuse.js 返回的是距离分数，需要转换
        matchedIndices: result.matches?.[0]?.indices || [],
      }));

    // 缓存结果
    searchCache.current.set(cacheKey, results);

    // 限制缓存大小
    if (searchCache.current.size > 100) {
      const firstKey = searchCache.current.keys().next().value;
      searchCache.current.delete(firstKey);
    }

    return results;
  }, [files, debouncedQuery, maxResults, searchHistory, fuse]);

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
      navigate(item.path);
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
                placeholder="Search files and folders..."
                autoFocus
              />
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