/**
 * 增量索引更新器
 *
 * 监听文件系统变化，自动更新文件索引
 * - 支持文件添加、修改、删除
 * - 支持目录添加、删除
 * - 支持防抖和批量更新
 * - 支持错误处理和重试
 */

import { stat } from 'node:fs/promises';
import type { FileIndexService } from './file-index.js';
import type { FileInfo } from '../../types/indexing.js';

/**
 * 增量索引更新器配置
 */
export interface IncrementalIndexerOptions {
  /** 文件索引服务 */
  indexService: FileIndexService;
  /** 扫描根目录 */
  rootPath: string;
  /** 防抖延迟（毫秒） */
  debounceDelay?: number;
  /** 批量更新延迟（毫秒） */
  batchDelay?: number;
  /** 是否启用日志 */
  enableLogging?: boolean;
  /** 最大重试次数 */
  maxRetries?: number;
}

/**
 * 待处理的变更
 */
interface PendingChange {
  type: 'add' | 'change' | 'unlink' | 'addDir' | 'unlinkDir';
  path: string;
  fileInfo?: FileInfo;
  retryCount?: number;
}

/**
 * 增量索引更新器类
 */
export class IncrementalIndexer {
  private indexService: FileIndexService;
  private rootPath: string;
  private options: Required<IncrementalIndexerOptions>;
  private pendingChanges: Map<string, PendingChange> = new Map();
  private debounceTimer: NodeJS.Timeout | null = null;
  private batchTimer: NodeJS.Timeout | null = null;
  private isProcessing: boolean = false;

  constructor(options: IncrementalIndexerOptions) {
    this.indexService = options.indexService;
    this.rootPath = options.rootPath;
    this.options = {
      indexService: options.indexService,
      rootPath: options.rootPath,
      debounceDelay: options.debounceDelay ?? 300,
      batchDelay: options.batchDelay ?? 1000,
      enableLogging: options.enableLogging ?? true,
      maxRetries: options.maxRetries ?? 3,
    };
  }

  /**
   * 处理文件变化
   */
  async handleChange(type: 'add' | 'change' | 'unlink', path: string): Promise<void> {
    this.log(`[${type.toUpperCase()}] ${path}`);

    // 获取文件信息
    let fileInfo: FileInfo | undefined;
    if (type !== 'unlink') {
      try {
        const stats = await stat(path);
        fileInfo = {
          name: path.split('/').pop() || '',
          path,
          relativePath: path.replace(this.rootPath + '/', ''),
          extension: path.split('.').pop() || '',
          size: stats.size,
          modifiedAt: stats.mtime,
          createdAt: stats.ctime,
          isDirectory: stats.isDirectory(),
          isFile: stats.isFile(),
          isSymbolicLink: stats.isSymbolicLink(),
        };
      } catch (error) {
        this.log(`Failed to get file info for ${path}:`, error);
        return;
      }
    }

    // 添加到待处理变更
    this.pendingChanges.set(path, {
      type,
      path,
      fileInfo,
    });

    // 防抖处理
    this.scheduleDebouncedUpdate();
  }

  /**
   * 处理目录变化
   */
  async handleDirectoryChange(type: 'addDir' | 'unlinkDir', path: string): Promise<void> {
    this.log(`[${type.toUpperCase()}] ${path}`);

    // 添加到待处理变更
    this.pendingChanges.set(path, {
      type,
      path,
    });

    // 防抖处理
    this.scheduleDebouncedUpdate();
  }

  /**
   * 调度防抖更新
   */
  private scheduleDebouncedUpdate(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.scheduleBatchUpdate();
    }, this.options.debounceDelay);
  }

  /**
   * 调度批量更新
   */
  private scheduleBatchUpdate(): void {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }

    this.batchTimer = setTimeout(() => {
      this.processPendingChanges();
    }, this.options.batchDelay);
  }

  /**
   * 处理待处理的变更
   */
  private async processPendingChanges(): Promise<void> {
    if (this.isProcessing || this.pendingChanges.size === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      const changes = Array.from(this.pendingChanges.values());
      this.pendingChanges.clear();

      // 分类变更
      const adds: FileInfo[] = [];
      const removes: string[] = [];

      for (const change of changes) {
        if (change.type === 'unlink' || change.type === 'unlinkDir') {
          removes.push(change.path);
        } else if (change.fileInfo) {
          adds.push(change.fileInfo);
        }
      }

      // 批量添加或更新
      if (adds.length > 0) {
        this.log(`Adding/updating ${adds.length} entries`);
        await this.indexService.addOrUpdateBatch(adds);
      }

      // 批量删除
      for (const path of removes) {
        this.log(`Removing ${path}`);
        await this.indexService.remove(path);
      }

      this.log(`Processed ${changes.length} changes`);
    } catch (error) {
      this.log('Error processing changes:', error);

      // 重试失败的变更
      for (const change of Array.from(this.pendingChanges.values())) {
        const retryCount = (change.retryCount || 0) + 1;
        if (retryCount <= this.options.maxRetries) {
          change.retryCount = retryCount;
          this.pendingChanges.set(change.path, change);
        }
      }

      // 重新调度更新
      if (this.pendingChanges.size > 0) {
        this.scheduleBatchUpdate();
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * 立即处理所有待处理的变更
   */
  async flush(): Promise<void> {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    await this.processPendingChanges();
  }

  /**
   * 获取待处理的变更数量
   */
  getPendingCount(): number {
    return this.pendingChanges.size;
  }

  /**
   * 日志输出
   */
  private log(...args: any[]): void {
    if (this.options.enableLogging) {
      console.log('[IncrementalIndexer]', ...args);
    }
  }

  /**
   * 销毁更新器
   */
  async destroy(): Promise<void> {
    // 清空定时器
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    // 处理剩余的变更
    await this.flush();

    // 清空待处理变更
    this.pendingChanges.clear();
  }
}

/**
 * 创建增量索引更新器实例
 */
export function createIncrementalIndexer(options: IncrementalIndexerOptions): IncrementalIndexer {
  return new IncrementalIndexer(options);
}