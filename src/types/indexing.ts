/**
 * 文件索引相关类型定义
 */

import type { IFuseOptions, FuseResultMatch } from 'fuse.js';
import type { FileInfo } from './files.js';

/**
 * 索引条目类型
 */
export type FileIndexEntryType = 'file' | 'directory' | 'symlink';

/**
 * 文件索引条目
 */
export interface FileIndexEntry extends FileInfo {
  /** 文件类型 */
  type: FileIndexEntryType;
}

/**
 * 索引统计信息
 */
export interface FileIndexStats {
  /** 文件数量 */
  totalFiles: number;
  /** 目录数量 */
  totalDirectories: number;
  /** 总大小（字节） */
  totalSize: number;
  /** 最近更新时间戳 */
  lastUpdated: number;
}

/**
 * 索引服务配置
 */
export interface FileIndexServiceOptions {
  /** 是否区分大小写 */
  caseSensitive?: boolean;
  /** 是否包含目录 */
  includeDirectories?: boolean;
  /** 默认搜索结果限制 */
  defaultSearchLimit?: number;
  /** Fuse.js 配置 */
  fuseOptions?: IFuseOptions<FileIndexEntry>;
}

/**
 * 搜索选项
 */
export interface FileIndexSearchOptions {
  /** 是否启用模糊搜索 */
  fuzzy?: boolean;
  /** 是否执行精确匹配 */
  exact?: boolean;
  /** 结果数量限制 */
  limit?: number;
}

/**
 * 搜索结果
 */
export interface FileIndexSearchResult {
  /** 索引条目 */
  item: FileIndexEntry;
  /** 匹配分数 */
  score?: number;
  /** 匹配详情 */
  matches?: ReadonlyArray<FuseResultMatch>;
}

/**
 * 索引变更类型
 */
export type FileIndexChangeType = 'add' | 'change' | 'unlink' | 'addDir' | 'unlinkDir';

/**
 * 索引变更事件
 */
export interface FileIndexChange {
  /** 变更类型 */
  type: FileIndexChangeType;
  /** 文件路径 */
  path: string;
  /** 文件信息（add/change 事件必需） */
  fileInfo?: FileInfo;
}

/**
 * 索引更新统计
 */
export interface FileIndexUpdateSummary {
  /** 新增数量 */
  added: number;
  /** 更新数量 */
  updated: number;
  /** 删除数量 */
  removed: number;
  /** 无变化数量 */
  unchanged: number;
}
