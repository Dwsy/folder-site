/**
 * SearchResults Component
 * 
 * 搜索结果展示组件，支持键盘导航和高亮匹配文本
 */

import { useMemo, useCallback, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileIcon, FolderIcon } from '@react-symbols/icons/utils';
import { cn } from '../../utils/cn.js';

/**
 * 搜索结果项类型
 */
export interface SearchResultItem {
  /** 文件名 */
  name: string;
  /** 完整路径 */
  path: string;
  /** 文件类型 */
  type: 'file' | 'folder';
  /** 匹配分数（用于排序） */
  score?: number;
  /** 匹配的索引位置 */
  matchedIndices?: number[];
  /** 文件扩展名 */
  extension?: string;
}

/**
 * 搜索结果属性
 */
export interface SearchResultsProps {
  /** 搜索结果列表 */
  results: SearchResultItem[];
  /** 当前选中的索引 */
  selectedIndex: number;
  /** 选中索引变化回调 */
  onSelectIndex: (index: number) => void;
  /** 结果项点击回调 */
  onResultClick?: (item: SearchResultItem, index: number) => void;
  /** 自定义样式类名 */
  className?: string;
  /** 最大显示数量 */
  maxVisible?: number;
  /** 是否显示匹配高亮 */
  showHighlight?: boolean;
  /** 查询字符串（用于高亮） */
  query?: string;
  /** 无结果时显示的文本 */
  noResultsText?: string;
  /** 键盘导航事件回调 */
  onKeyDown?: (e: React.KeyboardEvent, item: SearchResultItem) => void;
  /** 当前活动文件路径 */
  activePath?: string;
}

/**
 * 高亮匹配文本
 */
function highlightText(text: string, query: string): React.ReactNode {
  if (!query.trim()) {
    return text;
  }

  const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, index) => {
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
  });
}

/**
 * 转义正则表达式特殊字符
 */
function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 截断路径以显示更简洁的路径
 */
function truncatePath(path: string, maxLength: number = 50): string {
  if (path.length <= maxLength) {
    return path;
  }

  const parts = path.split('/');
  const filename = parts.pop() || '';
  const remainingLength = maxLength - filename.length - 4; // 4 for ".../"

  if (remainingLength <= 0) {
    return `.../${filename}`;
  }

  const truncatedPath = parts.slice(-2).join('/');
  return `.../${truncatedPath}/${filename}`;
}

/**
 * 搜索结果组件
 */
export function SearchResults({
  results,
  selectedIndex,
  onSelectIndex,
  onResultClick,
  className,
  maxVisible = 8,
  showHighlight = true,
  query = '',
  noResultsText = 'No results found',
  onKeyDown,
  activePath,
}: SearchResultsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // 限制显示数量
  const visibleResults = useMemo(() => {
    return results.slice(0, maxVisible);
  }, [results, maxVisible]);

  // 自动滚动到选中项
  useEffect(() => {
    if (selectedIndex >= 0 && selectedIndex < visibleResults.length) {
      const selectedItem = itemRefs.current[selectedIndex];
      if (selectedItem && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const itemRect = selectedItem.getBoundingClientRect();

        // 如果选中项在视口外，滚动到视口
        if (itemRect.top < containerRect.top) {
          selectedItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        } else if (itemRect.bottom > containerRect.bottom) {
          selectedItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
      }
    }
  }, [selectedIndex, visibleResults.length]);

  // 处理键盘事件
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, item: SearchResultItem, index: number) => {
      onKeyDown?.(e, item);
    },
    [onKeyDown]
  );

  // 处理结果点击
  const handleClick = useCallback(
    (item: SearchResultItem, index: number) => {
      onSelectIndex(index);
      onResultClick?.(item, index);
    },
    [onSelectIndex, onResultClick]
  );

  // 处理鼠标悬停
  const handleMouseEnter = useCallback(
    (index: number) => {
      onSelectIndex(index);
    },
    [onSelectIndex]
  );

  // 空状态
  if (results.length === 0) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center py-12 text-center',
          className
        )}
      >
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <p className="text-sm text-muted-foreground">{noResultsText}</p>
        {query && (
          <p className="mt-1 text-xs text-muted-foreground/70">
            Try different keywords or check spelling
          </p>
        )}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn('flex flex-col overflow-y-auto', className)}
      role="listbox"
      aria-label="Search results"
    >
      {/* 结果数量提示 */}
      {results.length > maxVisible && (
        <div className="px-3 py-2 text-xs text-muted-foreground border-b border-border">
          Showing {maxVisible} of {results.length} results
        </div>
      )}

      {/* 结果列表 */}
      <div className="flex flex-col">
        {visibleResults.map((item, index) => {
          const isSelected = index === selectedIndex;
          const isActive = activePath === item.path;

          return (
            <div
              key={`${item.path}-${index}`}
              ref={(el) => (itemRefs.current[index] = el)}
              onClick={() => {
                handleClick(item, index);
                // Navigate to the item path
                window.location.href = item.path;
              }}
              onMouseEnter={() => handleMouseEnter(index)}
              onKeyDown={(e) => handleKeyDown(e, item, index)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 text-sm transition-colors cursor-pointer',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                'group',
                isSelected && 'bg-accent text-accent-foreground',
                !isSelected && 'hover:bg-muted',
                isActive && 'border-l-2 border-primary bg-accent/50'
              )}
              role="option"
              aria-selected={isSelected}
              aria-current={isActive ? 'page' : undefined}
              tabIndex={isSelected ? 0 : -1}
            >
              {/* 文件图标 */}
              <div className="flex h-5 w-5 shrink-0 items-center justify-center">
                {item.type === 'folder' ? (
                  <FolderIcon folderName={item.name} width={20} height={20} />
                ) : (
                  <FileIcon fileName={item.name} width={20} height={20} />
                )}
              </div>

              {/* 文件信息 */}
              <div className="flex min-w-0 flex-1 flex-col">
                {/* 文件名 */}
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium">
                    {showHighlight ? highlightText(item.name, query) : item.name}
                  </span>
                  {item.score !== undefined && (
                    <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100">
                      {Math.round(item.score * 100)}%
                    </span>
                  )}
                </div>

                {/* 路径 */}
                <span className="truncate text-xs text-muted-foreground">
                  {truncatePath(item.path)}
                </span>
              </div>

              {/* 快捷键提示 */}
              {isSelected && (
                <span className="text-xs text-muted-foreground">
                  <kbd className="hidden rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] sm:inline">
                    Enter
                  </kbd>
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* 更多结果提示 */}
      {results.length > maxVisible && (
        <div className="px-3 py-2 text-xs text-muted-foreground border-t border-border text-center">
          Type more to narrow results
        </div>
      )}
    </div>
  );
}

/**
 * 搜索结果分组属性
 */
export interface SearchResultsGroupProps {
  /** 分组标题 */
  title: string;
  /** 分组结果 */
  results: SearchResultItem[];
  /** 当前选中的索引（全局） */
  selectedIndex: number;
  /** 分组起始索引 */
  startIndex: number;
  /** 选中索引变化回调 */
  onSelectIndex: (index: number) => void;
  /** 结果项点击回调 */
  onResultClick?: (item: SearchResultItem, index: number) => void;
  /** 查询字符串 */
  query?: string;
  /** 当前活动文件路径 */
  activePath?: string;
}

/**
 * 搜索结果分组组件
 */
export function SearchResultsGroup({
  title,
  results,
  selectedIndex,
  startIndex,
  onSelectIndex,
  onResultClick,
  query,
  activePath,
}: SearchResultsGroupProps) {
  if (results.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col">
      {/* 分组标题 */}
      <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground bg-muted/50">
        {title} ({results.length})
      </div>

      {/* 分组结果 */}
      <SearchResults
        results={results}
        selectedIndex={selectedIndex - startIndex}
        onSelectIndex={(index) => onSelectIndex(startIndex + index)}
        onResultClick={onResultClick}
        query={query}
        activePath={activePath}
        showHighlight
      />
    </div>
  );
}