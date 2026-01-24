/**
 * Search Types
 */

/**
 * 搜索选项
 */
export interface SearchOptions {
  /** 搜索根目录 */
  rootDir?: string;
  /** 最大结果数量 */
  limit?: number;
  /** 是否包含隐藏文件 */
  hidden?: boolean;
  /** 是否区分大小写 */
  caseSensitive?: boolean;
  /** 上下文行数（内容搜索） */
  context?: number;
  /** 文件扩展名过滤 */
  extensions?: string[];
  /** 排除目录 */
  excludeDirs?: string[];
}

/**
 * 搜索结果（文件名搜索）
 */
export interface SearchResult {
  /** 文件路径 */
  path: string;
  /** 文件名 */
  name: string;
  /** 文件类型 */
  type: 'file' | 'directory';
  /** 相关性得分 */
  score: number;
}

/**
 * 内容匹配
 */
export interface ContentMatch {
  /** 行号 */
  lineNumber: number;
  /** 行内容 */
  line: string;
  /** 子匹配 */
  submatches: SubMatch[];
}

/**
 * 子匹配
 */
export interface SubMatch {
  /** 匹配文本 */
  match: string;
  /** 开始位置 */
  start: number;
  /** 结束位置 */
  end: number;
}

/**
 * 搜索结果（内容搜索）
 */
export interface ContentSearchResult {
  /** 文件路径 */
  path: string;
  /** 文件名 */
  name: string;
  /** 匹配列表 */
  matches: ContentMatch[];
}

/**
 * 统一搜索结果
 */
export interface UnifiedSearchResult {
  /** 结果类型 */
  type: 'file' | 'content';
  /** 文件路径 */
  path: string;
  /** 文件名 */
  name: string;
  /** 相关性得分 */
  score: number;
  /** 匹配（仅内容搜索） */
  matches?: ContentMatch[];
}

/**
 * 搜索模式
 */
export type SearchMode = 'filename' | 'content' | 'auto';

/**
 * 搜索请求
 */
export interface SearchRequest {
  /** 查询字符串 */
  query: string;
  /** 搜索模式 */
  mode?: SearchMode;
  /** 搜索选项 */
  options?: SearchOptions;
}

/**
 * 搜索响应
 */
export interface SearchResponse {
  /** 文件名搜索结果 */
  fileResults: SearchResult[];
  /** 内容搜索结果 */
  contentResults: ContentSearchResult[];
  /** 总结果数 */
  total: number;
  /** 搜索耗时（毫秒） */
  duration: number;
  /** 查询字符串 */
  query: string;
  /** 搜索模式 */
  mode: SearchMode;
}