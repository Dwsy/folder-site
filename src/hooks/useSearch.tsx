/**
 * useSearch Hook
 *
 * 搜索功能 Hook，提供模糊搜索、键盘导航等功能
 *
 * 功能特性：
 * - 模糊搜索算法（支持文件名、路径匹配）
 * - 防抖搜索输入
 * - 键盘导航支持
 * - 搜索结果高亮
 * - TypeScript 类型安全
 */

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';

/**
 * 搜索结果项
 */
export interface SearchResult {
  /** 文件名 */
  name: string;
  /** 完整路径 */
  path: string;
  /** 相对路径 */
  relativePath: string;
  /** 文件类型 */
  type: 'file' | 'directory';
  /** 文件扩展名 */
  extension?: string;
  /** 匹配分数（用于排序） */
  score: number;
  /** 匹配的索引位置 */
  matches: number[];
}

/**
 * 搜索配置
 */
export interface SearchConfig {
  /** 防抖延迟（毫秒） */
  debounceDelay?: number;
  /** 最小搜索长度 */
  minQueryLength?: number;
  /** 最大结果显示数 */
  maxResults?: number;
  /** 是否搜索文件夹 */
  includeFolders?: boolean;
  /** 是否使用模糊匹配 */
  fuzzyMatch?: boolean;
}

/**
 * 搜索 Hook 返回值
 */
export interface UseSearchReturn {
  /** 搜索查询 */
  query: string;
  /** 设置搜索查询 */
  setQuery: (query: string) => void;
  /** 搜索结果 */
  results: SearchResult[];
  /** 是否正在搜索 */
  isSearching: boolean;
  /** 清空搜索 */
  clearSearch: () => void;
  /** 选中的结果索引 */
  selectedIndex: number;
  /** 设置选中的结果索引 */
  setSelectedIndex: (index: number) => void;
  /** 选择上一个结果 */
  selectPrevious: () => void;
  /** 选择下一个结果 */
  selectNext: () => void;
  /** 获取当前选中的结果 */
  getSelectedResult: () => SearchResult | null;
}

/**
 * 默认搜索配置
 */
const DEFAULT_SEARCH_CONFIG: Required<SearchConfig> = {
  debounceDelay: 150,
  minQueryLength: 1,
  maxResults: 50,
  includeFolders: true,
  fuzzyMatch: true,
};

/**
 * 计算字符串相似度分数（基于 Levenshtein 距离）
 *
 * @param str1 - 第一个字符串
 * @param str2 - 第二个字符串
 * @returns 相似度分数（0-1，1表示完全匹配）
 */
function calculateSimilarity(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;

  if (len1 === 0) return 0;
  if (len2 === 0) return 0;

  // 简单的字符匹配分数
  let matches = 0;
  const str2Lower = str2.toLowerCase();
  const str1Lower = str1.toLowerCase();

  for (let i = 0; i < len1; i++) {
    const char = str1Lower[i];
    if (str2Lower.includes(char)) {
      matches++;
    }
  }

  return matches / len1;
}

/**
 * 模糊搜索算法
 *
 * @param query - 搜索查询
 * @param items - 搜索项目列表
 * @param config - 搜索配置
 * @returns 搜索结果列表
 */
function fuzzySearch(
  query: string,
  items: Array<{
    name: string;
    path: string;
    relativePath: string;
    type: 'file' | 'directory';
    extension?: string;
  }>,
  config: Required<SearchConfig>
): SearchResult[] {
  if (!query || query.length < config.minQueryLength) {
    return [];
  }

  const queryLower = query.toLowerCase();
  const results: SearchResult[] = [];

  for (const item of items) {
    // 跳过文件夹（如果配置不包含文件夹）
    if (item.type === 'directory' && !config.includeFolders) {
      continue;
    }

    const nameLower = item.name.toLowerCase();
    const pathLower = item.path.toLowerCase();
    const relativePathLower = item.relativePath.toLowerCase();

    let score = 0;
    const matches: number[] = [];

    // 完全匹配（文件名）
    if (nameLower === queryLower) {
      score = 1.0;
      matches.push(0);
    }
    // 前缀匹配（文件名）
    else if (nameLower.startsWith(queryLower)) {
      score = 0.9;
      for (let i = 0; i < queryLower.length; i++) {
        matches.push(i);
      }
    }
    // 包含匹配（文件名）
    else if (nameLower.includes(queryLower)) {
      score = 0.8;
      const index = nameLower.indexOf(queryLower);
      for (let i = 0; i < queryLower.length; i++) {
        matches.push(index + i);
      }
    }
    // 路径匹配
    else if (relativePathLower.includes(queryLower)) {
      score = 0.7;
      const index = relativePathLower.indexOf(queryLower);
      for (let i = 0; i < queryLower.length; i++) {
        matches.push(index + i);
      }
    }
    // 模糊匹配
    else if (config.fuzzyMatch) {
      const similarity = calculateSimilarity(queryLower, nameLower);
      if (similarity > 0.5) {
        score = similarity * 0.6;
      }
    }

    // 如果有匹配分数，添加到结果
    if (score > 0) {
      results.push({
        ...item,
        score,
        matches,
      });
    }
  }

  // 按分数排序（降序），然后按名称排序
  results.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.name.localeCompare(b.name);
  });

  // 限制结果数量
  return results.slice(0, config.maxResults);
}

/**
 * useSearch Hook
 *
 * 提供搜索功能，包括模糊搜索、键盘导航等
 *
 * @param items - 搜索项目列表
 * @param config - 搜索配置
 * @returns 搜索相关的状态和操作函数
 *
 * @example
 * ```tsx
 * const items = [
 *   { name: 'README.md', path: '/README.md', relativePath: 'README.md', type: 'file' },
 *   { name: 'docs', path: '/docs', relativePath: 'docs', type: 'directory' },
 * ];
 *
 * const {
 *   query,
 *   setQuery,
 *   results,
 *   isSearching,
 *   clearSearch,
 *   selectedIndex,
 *   selectNext,
 *   selectPrevious,
 *   getSelectedResult,
 * } = useSearch(items, {
 *   debounceDelay: 150,
 *   maxResults: 50,
 * });
 * ```
 */
export function useSearch(
  items: Array<{
    name: string;
    path: string;
    relativePath: string;
    type: 'file' | 'directory';
    extension?: string;
  }>,
  config: SearchConfig = {}
): UseSearchReturn {
  const finalConfig = { ...DEFAULT_SEARCH_CONFIG, ...config };

  const [query, setQueryState] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchResultsRef = useRef<SearchResult[]>([]);
  const debounceTimerRef = useRef<NodeJS.Timeout>();

  // 防抖处理搜索查询
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    setIsSearching(true);

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedQuery(query);
      setIsSearching(false);
    }, finalConfig.debounceDelay);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, finalConfig.debounceDelay]);

  // 执行搜索
  const results = useMemo(() => {
    const searchResults = fuzzySearch(debouncedQuery, items, finalConfig);
    searchResultsRef.current = searchResults;
    return searchResults;
  }, [debouncedQuery, items, finalConfig]);

  // 重置选中索引当结果变化时
  useEffect(() => {
    setSelectedIndex(0);
  }, [results.length]);

  // 设置搜索查询
  const setQuery = useCallback((newQuery: string) => {
    setQueryState(newQuery);
  }, []);

  // 清空搜索
  const clearSearch = useCallback(() => {
    setQueryState('');
    setDebouncedQuery('');
    setSelectedIndex(0);
  }, []);

  // 选择上一个结果
  const selectPrevious = useCallback(() => {
    setSelectedIndex((prev) => {
      if (results.length === 0) return 0;
      return prev > 0 ? prev - 1 : results.length - 1;
    });
  }, [results.length]);

  // 选择下一个结果
  const selectNext = useCallback(() => {
    setSelectedIndex((prev) => {
      if (results.length === 0) return 0;
      return prev < results.length - 1 ? prev + 1 : 0;
    });
  }, [results.length]);

  // 获取当前选中的结果
  const getSelectedResult = useCallback((): SearchResult | null => {
    return results[selectedIndex] || null;
  }, [results, selectedIndex]);

  return {
    query,
    setQuery,
    results,
    isSearching,
    clearSearch,
    selectedIndex,
    setSelectedIndex,
    selectPrevious,
    selectNext,
    getSelectedResult,
  };
}

/**
 * 高亮匹配文本
 *
 * @param text - 原始文本
 * @param query - 搜索查询
 * @returns 高亮的 HTML 字符串
 */
export function highlightMatches(text: string, query: string): string {
  if (!query) return text;

  const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
  return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800 text-current px-0.5 rounded">$1</mark>');
}

/**
 * 转义正则表达式特殊字符
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}