/**
 * useSearch Hook
 *
 * 搜索功能 Hook，提供模糊搜索、键盘导航等功能
 *
 * 功能特性：
 * - 模糊搜索算法（支持文件名、路径匹配）
 * - Levenshtein 距离计算
 * - 子序列匹配（支持字符跳过，如 "fs" 匹配 "FolderSite"）
 * - 智能评分系统（考虑匹配位置、类型、路径深度等）
 * - 路径感知搜索
 * - 搜索结果缓存
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
  /** 匹配分数（用于排序，0-1） */
  score: number;
  /** 匹配的索引位置 */
  matches: number[];
  /** 匹配类型 */
  matchType: 'exact' | 'prefix' | 'substring' | 'subsequence' | 'path' | 'fuzzy';
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
  /** 是否启用缓存 */
  enableCache?: number; // 缓存过期时间（毫秒）
  /** 模糊匹配阈值（0-1） */
  fuzzyThreshold?: number;
  /** 路径权重（0-1，越高表示路径越重要） */
  pathWeight?: number;
  /** 目录深度权重（越浅的目录权重越高） */
  depthWeight?: number;
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
  /** 清除缓存 */
  clearCache: () => void;
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
  enableCache: 5000, // 5秒缓存
  fuzzyThreshold: 0.6,
  pathWeight: 0.3,
  depthWeight: 0.1,
};

/**
 * 缓存条目
 */
interface CacheEntry {
  results: SearchResult[];
  timestamp: number;
}

/**
 * 搜索缓存
 */
class SearchCache {
  private cache: Map<string, CacheEntry> = new Map();
  private maxSize: number;
  private ttl: number;

  constructor(maxSize: number = 100, ttl: number = 5000) {
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  get(key: string): SearchResult[] | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.results;
  }

  set(key: string, results: SearchResult[]): void {
    if (this.cache.size >= this.maxSize) {
      // 删除最旧的条目
      const sortedEntries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      if (sortedEntries.length > 0) {
        const oldestKey = sortedEntries[0]![0];
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      results,
      timestamp: Date.now(),
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

/**
 * 计算 Levenshtein 编辑距离
 *
 * @param str1 - 第一个字符串
 * @param str2 - 第二个字符串
 * @returns 编辑距离
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;

  if (len1 === 0) return len2;
  if (len2 === 0) return len1;

  // 使用一维数组优化空间复杂度
  const dp = new Array(len2 + 1);

  for (let j = 0; j <= len2; j++) {
    dp[j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    let prev = dp[0];
    dp[0] = i;

    for (let j = 1; j <= len2; j++) {
      const temp = dp[j];
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      dp[j] = Math.min(
        dp[j] + 1, // 删除
        dp[j - 1] + 1, // 插入
        prev + cost // 替换
      );
      prev = temp;
    }
  }

  return dp[len2];
}

/**
 * 计算字符串相似度分数（基于 Levenshtein 距离）
 *
 * @param str1 - 第一个字符串
 * @param str2 - 第二个字符串
 * @returns 相似度分数（0-1，1表示完全匹配）
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;

  if (len1 === 0) return 0;
  if (len2 === 0) return 0;

  const distance = levenshteinDistance(str1, str2);
  const maxLen = Math.max(len1, len2);

  // 转换为相似度分数（0-1）
  return 1 - distance / maxLen;
}

/**
 * 子序列模糊匹配（支持字符跳过）
 * 例如 "fs" 可以匹配 "FolderSite"（匹配 F 和 S）
 *
 * @param pattern - 搜索模式
 * @param text - 目标文本
 * @returns 匹配的索引数组，如果不匹配返回 null
 */
export function fuzzySubsequenceMatch(pattern: string, text: string): number[] | null {
  const patternLower = pattern.toLowerCase();
  const textLower = text.toLowerCase();
  const matches: number[] = [];

  let patternIndex = 0;
  for (let i = 0; i < textLower.length && patternIndex < patternLower.length; i++) {
    if (textLower[i] === patternLower[patternIndex]) {
      matches.push(i);
      patternIndex++;
    }
  }

  // 如果所有字符都匹配到了
  if (patternIndex === patternLower.length) {
    return matches;
  }

  return null;
}

/**
 * 计算路径深度（目录层级数）
 */
export function calculatePathDepth(path: string): number {
  return path.split(/[\/\\]/).filter(p => p !== '').length;
}

/**
 * 计算匹配得分
 *
 * @param matchType - 匹配类型
 * @param matchIndex - 匹配起始位置
 * @param queryLength - 查询长度
 * @param pathDepth - 路径深度
 * @param maxPathDepth - 最大路径深度
 * @param config - 搜索配置
 * @returns 得分（0-1）
 */
export function calculateScore(
  matchType: SearchResult['matchType'],
  matchIndex: number,
  pathDepth: number,
  maxPathDepth: number,
  config: Required<SearchConfig>
): number {
  // 基础分数（基于匹配类型）
  const baseScores: Record<SearchResult['matchType'], number> = {
    exact: 1.0,
    prefix: 0.95,
    subsequence: 0.85,
    substring: 0.75,
    path: 0.65,
    fuzzy: 0.5,
  };

  let score = baseScores[matchType];

  // 位置加成：匹配越靠前，分数越高
  const positionBonus = Math.max(0, 1 - matchIndex / 10) * 0.1;
  score += positionBonus;

  // 深度加成：越浅的目录，分数越高
  if (maxPathDepth > 0) {
    const depthScore = 1 - (pathDepth / maxPathDepth) * config.depthWeight;
    score = score * depthScore + (1 - depthScore) * score * (1 - config.depthWeight);
  }

  return Math.min(1, Math.max(0, score));
}

/**
 * 模糊搜索算法
 *
 * @param query - 搜索查询
 * @param items - 搜索项目列表
 * @param config - 搜索配置
 * @returns 搜索结果列表
 */
export function fuzzySearch(
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

  // 计算最大路径深度用于归一化
  const pathDepths = items.map(item => calculatePathDepth(item.relativePath));
  const maxPathDepth = Math.max(...pathDepths, 1);

  for (const item of items) {
    // 跳过文件夹（如果配置不包含文件夹）
    if (item.type === 'directory' && !config.includeFolders) {
      continue;
    }

    const nameLower = item.name.toLowerCase();
    const relativePathLower = item.relativePath.toLowerCase();
    const pathDepth = calculatePathDepth(item.relativePath);

    let matchType: SearchResult['matchType'] | null = null;
    let score = 0;
    const matches: number[] = [];
    let matchIndex = 0;

    // 1. 完全匹配（文件名）
    if (nameLower === queryLower) {
      matchType = 'exact';
      score = 1.0;
      matches.push(0);
      matchIndex = 0;
    }
    // 2. 前缀匹配（文件名）
    else if (nameLower.startsWith(queryLower)) {
      matchType = 'prefix';
      for (let i = 0; i < queryLower.length; i++) {
        matches.push(i);
      }
      matchIndex = 0;
    }
    // 3. 子序列匹配（文件名）- 支持字符跳过
    else if (config.fuzzyMatch) {
      const subsequenceMatches = fuzzySubsequenceMatch(queryLower, nameLower);
      if (subsequenceMatches && subsequenceMatches.length > 0) {
        matchType = 'subsequence';
        matches.push(...subsequenceMatches);
        matchIndex = subsequenceMatches[0]!;
      }
    }
    // 4. 包含匹配（文件名）
    if (!matchType && nameLower.includes(queryLower)) {
      matchType = 'substring';
      const index = nameLower.indexOf(queryLower);
      for (let i = 0; i < queryLower.length; i++) {
        matches.push(index + i);
      }
      matchIndex = index;
    }
    // 5. 路径匹配
    if (!matchType && relativePathLower.includes(queryLower)) {
      matchType = 'path';
      const index = relativePathLower.indexOf(queryLower);
      for (let i = 0; i < queryLower.length; i++) {
        matches.push(index + i);
      }
      matchIndex = index;
    }
    // 6. 模糊匹配（基于编辑距离）
    if (!matchType && config.fuzzyMatch) {
      const similarity = calculateSimilarity(queryLower, nameLower);
      if (similarity >= config.fuzzyThreshold) {
        matchType = 'fuzzy';
        score = similarity;
      }
    }

    // 如果有匹配，计算得分并添加到结果
    if (matchType) {
      // 如果没有通过相似度计算得分，则使用评分函数
      if (score === 0) {
        score = calculateScore(
          matchType,
          matchIndex,
          pathDepth,
          maxPathDepth,
          config
        );
      }

      results.push({
        ...item,
        score,
        matches,
        matchType,
      });
    }
  }

  // 按分数排序（降序），分数相同时按名称排序
  results.sort((a, b) => {
    if (Math.abs(b.score - a.score) > 0.001) {
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
  const cacheRef = useRef<SearchCache>(
    new SearchCache(100, finalConfig.enableCache)
  );

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
    if (!debouncedQuery || debouncedQuery.length < finalConfig.minQueryLength) {
      return [];
    }

    // 检查缓存
    const cacheKey = `${debouncedQuery}:${items.length}`;
    if (finalConfig.enableCache > 0) {
      const cached = cacheRef.current.get(cacheKey);
      if (cached) {
        searchResultsRef.current = cached;
        return cached;
      }
    }

    // 执行搜索
    const searchResults = fuzzySearch(debouncedQuery, items, finalConfig);
    searchResultsRef.current = searchResults;

    // 缓存结果
    if (finalConfig.enableCache > 0) {
      cacheRef.current.set(cacheKey, searchResults);
    }

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

  // 清除缓存
  const clearCache = useCallback(() => {
    cacheRef.current.clear();
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
    clearCache,
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
 * 高亮匹配文本（基于匹配索引）
 *
 * @param text - 原始文本
 * @param matches - 匹配的索引数组
 * @returns 高亮的 HTML 字符串
 */
export function highlightMatchesByIndex(text: string, matches: number[]): string {
  if (!matches || matches.length === 0) return text;

  // 按索引排序并去重
  const sortedMatches = [...new Set(matches)].sort((a, b) => a - b);

  let result = '';
  let lastIndex = 0;

  for (const index of sortedMatches) {
    if (index < text.length) {
      result += text.slice(lastIndex, index);
      result += `<mark class="bg-yellow-200 dark:bg-yellow-800 text-current px-0.5 rounded">${text[index]}</mark>`;
      lastIndex = index + 1;
    }
  }

  result += text.slice(lastIndex);
  return result;
}

/**
 * 转义正则表达式特殊字符
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}