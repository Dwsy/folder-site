/**
 * SearchModal V2 Component
 *
 * 增强版搜索模态框，支持文件名和内容搜索
 *
 * 新功能：
 * - 搜索模式切换（文件名/内容/自动）
 * - 使用 fd 和 ripgrep 进行高性能搜索
 * - 结果分组显示
 * - 内容搜索高亮
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTimes, FaKeyboard, FaSearch, FaFileAlt, FaCode, FaHistory } from 'react-icons/fa';
import * as Dialog from '@radix-ui/react-dialog';
import { cn } from '../../utils/cn.js';
import { SearchInput } from './SearchInput.js';
import { SearchResults, type SearchResultItem } from './SearchResults.js';
import { useFileAccessHistory } from '../../hooks/useFileAccessHistory.js';

/**
 * 搜索模式
 */
export type SearchMode = 'filename' | 'content' | 'auto';

/**
 * 搜索结果类型
 */
interface SearchResponse {
  fileResults: Array<{
    path: string;
    name: string;
    type: 'file' | 'folder';
    score: number;
  }>;
  contentResults: Array<{
    path: string;
    name: string;
    matches: Array<{
      lineNumber: number;
      line: string;
      submatches: Array<{
        match: string;
        start: number;
        end: number;
      }>;
    }>;
  }>;
  total: number;
  duration: number;
  query: string;
  mode: SearchMode;
}

/**
 * 搜索模态框属性
 */
export interface SearchModalV2Props {
  /** 是否打开 */
  open: boolean;
  /** 打开状态变化回调 */
  onOpenChange: (open: boolean) => void;
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
  altModifier: {
    mac: '⌥',
    windows: 'Alt',
  },
};

/**
 * 搜索模态框组件
 */
export function SearchModalV2({
  open,
  onOpenChange,
  className,
  maxResults = 10,
  debounceDelay = 300,
  activePath,
  onSelect,
}: SearchModalV2Props) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [searchMode, setSearchMode] = useState<SearchMode>('auto');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 访问历史 hook
  const { getRecentFiles } = useFileAccessHistory();

  // 防抖处理
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceDelay);

    return () => clearTimeout(timer);
  }, [query, debounceDelay]);

  // 执行搜索
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults(null);
      setError(null);
      return;
    }

    const performSearch = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/search/v2?q=${encodeURIComponent(debouncedQuery)}&mode=${searchMode}&limit=${maxResults}`
        );

        if (!response.ok) {
          throw new Error(`Search failed: ${response.statusText}`);
        }

        const data = await response.json();
        setResults(data.data);
        setSelectedIndex(0);
      } catch (err) {
        console.error('Search error:', err);
        setError(err instanceof Error ? err.message : 'Search failed');
        setResults(null);
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [debouncedQuery, searchMode, maxResults]);

  // 处理结果点击
  const handleResultClick = useCallback(
    (item: SearchResultItem, index: number) => {
      setSelectedIndex(index);
      onSelect?.(item);

      // 记录访问历史
      const { recordAccess } = useFileAccessHistory.getState();
      recordAccess(item.path, item.name);

      // 跳转到文件页面
      navigate(`/file/${item.path}`);
      onOpenChange(false);
    },
    [navigate, onOpenChange, onSelect]
  );

  // 获取所有结果（文件名 + 内容）
  const getAllResults = useCallback((response: SearchResponse): SearchResultItem[] => {
    const fileResults = response.fileResults.map(r => ({
      path: r.path,
      name: r.name,
      type: r.type,
      score: r.score,
    }));

    const contentResults = response.contentResults.map(r => ({
      path: r.path,
      name: r.name,
      type: 'file' as const,
      score: 0.5, // 内容搜索默认分数
      matches: r.matches,
    }));

    return [...fileResults, ...contentResults];
  }, []);

  // 处理键盘导航
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!results) return;

      const allResults = getAllResults(results);
      if (allResults.length === 0) return;

      // Ctrl/Cmd + QWERTY 快速跳转（对应 1-8）
      const quickJumpKeys: Record<string, number> = { q: 0, w: 1, e: 2, r: 3, t: 4, y: 5, u: 6, i: 7 };
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() in quickJumpKeys) {
        e.preventDefault();
        const targetIndex = quickJumpKeys[e.key.toLowerCase()];
        if (targetIndex < allResults.length) {
          setSelectedIndex(targetIndex);
          handleResultClick(allResults[targetIndex], targetIndex);
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % allResults.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(
            (prev) => (prev - 1 + allResults.length) % allResults.length
          );
          break;
        case 'Enter':
          e.preventDefault();
          const selectedItem = allResults[selectedIndex];
          if (selectedItem) {
            handleResultClick(selectedItem, selectedIndex);
          }
          break;
        case 'Tab':
          e.preventDefault();
          setSearchMode((prev) => {
            if (prev === 'filename') return 'content';
            if (prev === 'content') return 'auto';
            return 'filename';
          });
          break;
        case 'Escape':
          e.preventDefault();
          onOpenChange(false);
          break;
      }
    },
    [results, selectedIndex, onOpenChange, handleResultClick, getAllResults]
  );

  // 处理查询变化
  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
  }, []);

  // 处理清除查询
  const handleClearQuery = useCallback(() => {
    setQuery('');
  }, []);

  // 获取当前选中的结果
  const getSelectedResult = useCallback((): SearchResultItem | null => {
    if (!results) return null;
    const allResults = getAllResults(results);
    return allResults[selectedIndex] || null;
  }, [results, selectedIndex, getAllResults]);

  // 判断是否为 Mac
  const isMac = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return /Mac|iPod|iPhone|iPad/.test(window.navigator.platform);
  }, []);

  const modifier = isMac ? SHORTCUT_KEY.modifier.mac : SHORTCUT_KEY.modifier.windows;
  const altModifier = isMac ? SHORTCUT_KEY.altModifier.mac : SHORTCUT_KEY.altModifier.windows;

  // 打开时清空查询
  useEffect(() => {
    if (open) {
      setQuery('');
      setDebouncedQuery('');
      setResults(null);
      setError(null);
      setSelectedIndex(0);
    }
  }, [open]);

  // 显示空状态（最近访问的文件）
  const recentFiles = useMemo(() => {
    if (query || results || isLoading) return null;
    return getRecentFiles(maxResults);
  }, [query, results, isLoading, maxResults, getRecentFiles]);

  const allResults = results ? getAllResults(results) : [];
  const selectedResult = getSelectedResult();

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
            'fixed left-[50%] top-[15%] z-50 w-full max-w-3xl -translate-x-1/2',
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
            onOpenChange(false);
          }}
        >
          <Dialog.Title className="sr-only">Quick Search</Dialog.Title>

          <div
            ref={containerRef}
            className="flex flex-col max-h-[70vh]"
            onKeyDown={handleKeyDown}
            role="dialog"
            aria-modal="true"
            aria-labelledby="search-modal-title"
          >
            {/* 头部 */}
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="flex items-center gap-2">
                <FaKeyboard className="h-4 w-4 text-muted-foreground" />
                <h2 id="search-modal-title" className="text-sm font-semibold">
                  Quick Search
                </h2>
              </div>

              {/* 搜索模式切换 */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
                  <button
                    type="button"
                    onClick={() => setSearchMode('filename')}
                    className={cn(
                      'px-3 py-1 text-xs font-medium rounded-md transition-colors',
                      searchMode === 'filename'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <FaFileAlt className="inline mr-1" />
                    Files
                  </button>
                  <button
                    type="button"
                    onClick={() => setSearchMode('content')}
                    className={cn(
                      'px-3 py-1 text-xs font-medium rounded-md transition-colors',
                      searchMode === 'content'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <FaCode className="inline mr-1" />
                    Content
                  </button>
                  <button
                    type="button"
                    onClick={() => setSearchMode('auto')}
                    className={cn(
                      'px-3 py-1 text-xs font-medium rounded-md transition-colors',
                      searchMode === 'auto'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    Auto
                  </button>
                </div>

                {/* 快捷键提示 */}
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
                placeholder={`Search ${searchMode === 'content' ? 'content' : 'files'}... (Tab to switch mode)`}
                autoFocus
              />
            </div>

            {/* 搜索结果 */}
            <div className="flex-1 overflow-hidden">
              {isLoading && (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-3 text-sm">Searching...</span>
                </div>
              )}

              {error && (
                <div className="flex items-center justify-center py-12 text-destructive">
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {!isLoading && !error && !results && !query && recentFiles && (
                <div className="px-4 py-3">
                  <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
                    <FaHistory className="h-3 w-3" />
                    <span>Recent Files</span>
                  </div>
                  <SearchResults
                    results={recentFiles.map(f => ({
                      ...f,
                      type: 'file' as const,
                      score: 1,
                    }))}
                    selectedIndex={-1}
                    onSelectIndex={() => {}}
                    onResultClick={handleResultClick}
                    query=""
                    maxVisible={maxResults}
                    activePath={activePath}
                    className="max-h-[400px]"
                    showLetterShortcuts
                  />
                </div>
              )}

              {!isLoading && !error && results && (
                <div className="flex flex-col">
                  {/* 文件名搜索结果 */}
                  {results.fileResults.length > 0 && (
                    <div className="px-4 py-2">
                      <div className="flex items-center gap-2 mb-2 text-xs font-medium text-muted-foreground">
                        <FaFileAlt className="h-3 w-3" />
                        <span>Files</span>
                        <span className="text-muted-foreground/70">({results.fileResults.length})</span>
                      </div>
                      <SearchResults
                        results={results.fileResults.map(r => ({
                          ...r,
                          score: r.score,
                        }))}
                        selectedIndex={selectedIndex}
                        onSelectIndex={setSelectedIndex}
                        onResultClick={handleResultClick}
                        query={query}
                        maxVisible={maxResults}
                        activePath={activePath}
                        className="max-h-[200px] overflow-y-auto"
                        showLetterShortcuts
                      />
                    </div>
                  )}

                  {/* 内容搜索结果 */}
                  {results.contentResults.length > 0 && (
                    <div className="px-4 py-2">
                      <div className="flex items-center gap-2 mb-2 text-xs font-medium text-muted-foreground">
                        <FaCode className="h-3 w-3" />
                        <span>Content</span>
                        <span className="text-muted-foreground/70">({results.contentResults.length})</span>
                      </div>
                      <ContentSearchResults
                        results={results.contentResults}
                        selectedIndex={selectedIndex - results.fileResults.length}
                        onSelectIndex={(idx) => setSelectedIndex(results.fileResults.length + idx)}
                        onResultClick={handleResultClick}
                        query={query}
                        maxVisible={maxResults}
                        activePath={activePath}
                        className="max-h-[300px] overflow-y-auto"
                        fileResultsLength={results.fileResults.length}
                        showLetterShortcuts
                      />
                    </div>
                  )}

                  {/* 无结果 */}
                  {!isLoading && results.fileResults.length === 0 && results.contentResults.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        <FaSearch className="h-6 w-6" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        No results for "{query}"
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground/70">
                        Try different keywords or switch search mode
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 底部提示 */}
            <div className="flex items-center justify-between border-t px-4 py-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">
                    {modifier}
                  </kbd>
                  <span>+</span>
                  <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">
                    Q-I
                  </kbd>
                  <span>Jump</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">
                    ↑↓
                  </kbd>
                  <span>Navigate</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">
                    Tab
                  </kbd>
                  <span>Switch mode</span>
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
              {results && (
                <div className="flex items-center gap-3">
                  {results.fileResults.length > 0 && (
                    <span>
                      {results.fileResults.length} file{results.fileResults.length !== 1 ? 's' : ''}
                    </span>
                  )}
                  {results.contentResults.length > 0 && (
                    <span>
                      {results.contentResults.length} match{results.contentResults.length !== 1 ? 'es' : ''}
                    </span>
                  )}
                  {results.duration && (
                    <span className="text-muted-foreground/70">
                      {results.duration}ms
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/**
 * 内容搜索结果组件
 */
interface ContentSearchResultsProps {
  results: Array<{
    path: string;
    name: string;
    matches: Array<{
      lineNumber: number;
      line: string;
      submatches: Array<{
        match: string;
        start: number;
        end: number;
      }>;
    }>;
  }>;
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  onResultClick: (item: SearchResultItem, index: number) => void;
  query: string;
  maxVisible?: number;
  activePath?: string;
  className?: string;
  fileResultsLength?: number;
  showLetterShortcuts?: boolean;
}

function ContentSearchResults({
  results,
  selectedIndex,
  onSelectIndex,
  onResultClick,
  query,
  maxVisible = 10,
  activePath,
  className,
  fileResultsLength = 0,
  showLetterShortcuts = false,
}: ContentSearchResultsProps) {
  const visibleResults = results.slice(0, maxVisible);

  const handleResultClick = useCallback(
    (item: any, index: number) => {
      onResultClick(
        {
          path: item.path,
          name: item.name,
          type: 'file' as const,
          score: 0.5,
          matches: item.matches,
        },
        index
      );
    },
    [onResultClick]
  );

  return (
    <div className={cn('flex flex-col', className)}>
      {visibleResults.map((result, index) => {
        const isSelected = index === selectedIndex;
        const isActive = activePath === result.path;
        const firstMatch = result.matches[0];
        const globalIndex = fileResultsLength + index;

        return (
          <div
            key={`${result.path}-${index}`}
            onClick={() => handleResultClick(result, index)}
            onMouseEnter={() => onSelectIndex(index)}
            className={cn(
              'px-3 py-2 text-sm transition-colors cursor-pointer',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              'group',
              isSelected && 'bg-accent text-accent-foreground',
              !isSelected && 'hover:bg-muted',
              isActive && 'border-l-2 border-primary bg-accent/50'
            )}
            role="option"
            aria-selected={isSelected}
            tabIndex={isSelected ? 0 : -1}
          >
            <div className="flex items-start gap-2">
              {/* 文件名 */}
              <div className="flex-1">
                <div className="font-medium mb-1">{result.name}</div>

                {/* 匹配行 */}
                {firstMatch && (
                  <div className="text-xs text-muted-foreground">
                    <span className="inline-block w-8 text-right mr-2 select-none">
                      {firstMatch.lineNumber}
                    </span>
                    <HighlightLine line={firstMatch.line} query={query} />
                  </div>
                )}

                {/* 更多匹配提示 */}
                {result.matches.length > 1 && (
                  <div className="text-xs text-muted-foreground/70 mt-1">
                    +{result.matches.length - 1} more match{result.matches.length !== 2 ? 'es' : ''}
                  </div>
                )}
              </div>

              {/* 数字快捷键提示 */}
              {showLetterShortcuts && globalIndex < 8 && (
                <kbd className="hidden rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] sm:inline text-muted-foreground">
                  {globalIndex + 1}
                </kbd>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * 高亮匹配行
 */
function HighlightLine({ line, query }: { line: string; query: string }) {
  if (!query.trim()) {
    return <span>{line}</span>;
  }

  const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
  const parts = line.split(regex);

  return (
    <span>
      {parts.map((part, index) => {
        if (part.toLowerCase() === query.toLowerCase()) {
          return (
            <mark
              key={index}
              className="bg-yellow-200 text-foreground dark:bg-yellow-900 dark:text-foreground rounded px-0.5"
            >
              {part}
            </mark>
          );
        }
        return part;
      })}
    </span>
  );
}

/**
 * 转义正则表达式特殊字符
 */
function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * SearchModalV2 触发器组件
 */
export interface SearchTriggerV2Props {
  /** 点击回调 */
  onClick?: () => void;
  /** 自定义样式类名 */
  className?: string;
  /** 是否显示快捷键提示 */
  showShortcut?: boolean;
}

export function SearchTriggerV2({
  onClick,
  className,
  showShortcut = true,
}: SearchTriggerV2Props) {
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
      <span className="flex-1 text-left">Search files & content...</span>
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