/**
 * API 类型定义
 */

import type { FileInfo, FileMeta, DirectoryTreeNode } from './files.js';

/**
 * API 响应基础接口
 */
export interface ApiResponse<T = any> {
  /** 是否成功 */
  success: boolean;
  /** 响应数据 */
  data?: T;
  /** 错误信息 */
  error?: ApiError;
  /** 时间戳 */
  timestamp: number;
}

/**
 * API 错误
 */
export interface ApiError {
  /** 错误代码 */
  code: string;
  /** 错误消息 */
  message: string;
  /** 错误详情 */
  details?: any;
}

/**
 * 健康检查响应
 */
export interface HealthCheckResponse {
  /** 状态 */
  status: 'ok' | 'error';
  /** 消息 */
  message: string;
  /** 版本 */
  version?: string;
  /** 运行时间（秒） */
  uptime?: number;
}

/**
 * 文件列表响应
 */
export interface FileListResponse {
  /** 文件列表 */
  files: FileInfo[];
  /** 总数 */
  total: number;
  /** 当前页 */
  page?: number;
  /** 每页数量 */
  pageSize?: number;
}

/**
 * 文件内容响应
 */
export interface FileContentResponse {
  /** 文件信息 */
  info: FileInfo;
  /** 内容 */
  content: string;
  /** 元数据 */
  meta: FileMeta;
  /** HTML 内容（已渲染） */
  html?: string;
}

/**
 * 目录树响应
 */
export interface DirectoryTreeResponse {
  /** 根路径 */
  root: string;
  /** 目录树 */
  tree: DirectoryTreeNode;
  /** 总节点数 */
  totalNodes: number;
}

/**
 * 搜索请求
 */
export interface SearchRequest {
  /** 搜索关键词 */
  query: string;
  /** 搜索范围 */
  scope?: 'all' | 'titles' | 'content' | 'files';
  /** 文件类型过滤 */
  fileType?: string[];
  /** 结果数量限制 */
  limit?: number;
  /** 偏移量 */
  offset?: number;
}

/**
 * 搜索结果项
 */
export interface SearchResultItem {
  /** 文件路径 */
  path: string;
  /** 文件名 */
  name: string;
  /** 标题 */
  title?: string;
  /** 摘要 */
  excerpt?: string;
  /** 匹配分数 */
  score?: number;
  /** 文件类型 */
  type: string;
  /** 相关数据 */
  meta?: FileMeta;
}

/**
 * 搜索响应
 */
export interface SearchResponse {
  /** 搜索结果 */
  results: SearchResultItem[];
  /** 结果数量 */
  total: number;
  /** 搜索耗时（毫秒） */
  duration: number;
  /** 搜索关键词 */
  query: string;
}

/**
 * 导出请求
 */
export interface ExportRequest {
  /** 导出格式 */
  format: 'pdf' | 'html' | 'markdown';
  /** 文件路径 */
  paths?: string[];
  /** 是否包含子目录 */
  recursive?: boolean;
  /** 导出选项 */
  options?: ExportOptions;
}

/**
 * 导出选项
 */
export interface ExportOptions {
  /** 文件名 */
  filename?: string;
  /** 是否包含目录 */
  includeToc?: boolean;
  /** 是否包含封面 */
  includeCover?: boolean;
  /** 自定义样式 */
  customCss?: string;
}

/**
 * 导出响应
 */
export interface ExportResponse {
  /** 导出文件 URL */
  downloadUrl: string;
  /** 文件大小 */
  size: number;
  /** 文件类型 */
  mimeType: string;
  /** 导出耗时（毫秒） */
  duration: number;
}

/**
 * WebSocket 消息类型
 */
export type WSMessageType = 'file:change' | 'file:add' | 'file:delete' | 'reload' | 'ping' | 'pong';

/**
 * WebSocket 消息
 */
export interface WSMessage<T = any> {
  /** 消息类型 */
  type: WSMessageType;
  /** 消息数据 */
  data?: T;
  /** 时间戳 */
  timestamp: number;
}

/**
 * 文件变更事件
 */
export interface FileChangeEvent {
  /** 事件类型 */
  type: 'add' | 'change' | 'unlink';
  /** 文件路径 */
  path: string;
  /** 相对路径 */
  relativePath: string;
}