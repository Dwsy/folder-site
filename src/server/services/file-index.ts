/**
 * 文件索引服务
 *
 * 提供增量文件索引功能，优化文件搜索性能
 * - 支持增量更新（只更新变化的文件）
 * - 支持索引持久化（避免每次启动重建）
 * - 支持 LRU 缓存优化
 * - 支持 Fuse.js 模糊搜索
 */

import Fuse from 'fuse.js';
import { readFile, stat, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import type {
  FileInfo,
  FileIndexEntry,
  FileIndexStats,
  FileIndexServiceOptions,
  FileIndexSearchOptions,
  FileIndexSearchResult,
  FileIndexChangeType,
  FileIndexChange,
  FileIndexUpdateSummary,
} from '../../types/indexing.js';

/**
 * 索引持久化数据
 */
interface IndexData {
  /** 索引条目 */
  entries: FileIndexEntry[];
  /** 索引统计 */
  stats: FileIndexStats;
  /** 索引版本 */
  version: number;
  /** 最后更新时间 */
  lastUpdated: number;
}

/**
 * 文件索引变更监听器
 */
export type FileIndexChangeListener = (changes: FileIndexChange[]) => void;

/**
 * 文件索引服务类
 */
export class FileIndexService {
  private entries: Map<string, FileIndexEntry> = new Map();
  private fuse: Fuse<FileIndexEntry> | null = null;
  private listeners: Set<FileIndexChangeListener> = new Set();
  private options: Required<FileIndexServiceOptions>;
  private stats: FileIndexStats;
  private version: number = 1;
  private indexFilePath: string | null = null;
  private isDirty: boolean = false;

  constructor(options: FileIndexServiceOptions = {}) {
    this.options = {
      caseSensitive: options.caseSensitive ?? false,
      includeDirectories: options.includeDirectories ?? true,
      defaultSearchLimit: options.defaultSearchLimit ?? 20,
      fuseOptions: options.fuseOptions ?? {
        keys: ['name', 'relativePath'],
        threshold: 0.3,
        ignoreLocation: true,
        minMatchCharLength: 1,
        includeScore: true,
        includeMatches: true,
        shouldSort: true,
        sortBy: (a, b) => (a.score || 0) - (b.score || 0),
      },
    };

    this.stats = {
      totalFiles: 0,
      totalDirectories: 0,
      totalSize: 0,
      lastUpdated: 0,
    };
  }

  /**
   * 初始化索引服务
   */
  async initialize(rootPath: string, indexFilePath?: string): Promise<void> {
    this.indexFilePath = indexFilePath || join(rootPath, '.folder-site', 'index.json');

    // 尝试从磁盘加载索引
    try {
      await this.loadFromDisk();
      console.log(`[FileIndexService] Loaded ${this.entries.size} entries from disk`);
    } catch (error) {
      console.log('[FileIndexService] No existing index found, will build from scratch');
    }
  }

  /**
   * 从磁盘加载索引
   */
  private async loadFromDisk(): Promise<void> {
    if (!this.indexFilePath) return;

    try {
      const data = await readFile(this.indexFilePath, 'utf-8');
      const indexData: IndexData = JSON.parse(data);

      // 恢复索引条目
      this.entries.clear();
      for (const entry of indexData.entries) {
        this.entries.set(entry.path, {
          ...entry,
          modifiedAt: new Date(entry.modifiedAt),
          createdAt: new Date(entry.createdAt),
        });
      }

      // 恢复统计信息
      this.stats = indexData.stats;
      this.version = indexData.version;

      // 重建 Fuse 索引
      this.rebuildFuseIndex();
    } catch (error) {
      throw new Error(`Failed to load index: ${error}`);
    }
  }

  /**
   * 保存索引到磁盘
   */
  private async saveToDisk(): Promise<void> {
    if (!this.indexFilePath || !this.isDirty) return;

    try {
      // 确保目录存在
      await mkdir(dirname(this.indexFilePath), { recursive: true });

      // 准备索引数据
      const indexData: IndexData = {
        entries: Array.from(this.entries.values()),
        stats: this.stats,
        version: this.version,
        lastUpdated: this.stats.lastUpdated,
      };

      // 保存到磁盘
      await writeFile(this.indexFilePath, JSON.stringify(indexData, null, 2), 'utf-8');

      this.isDirty = false;
      console.log(`[FileIndexService] Saved ${this.entries.size} entries to disk`);
    } catch (error) {
      console.error('[FileIndexService] Failed to save index:', error);
    }
  }

  /**
   * 重建 Fuse 索引
   */
  private rebuildFuseIndex(): void {
    const entries = Array.from(this.entries.values());
    this.fuse = new Fuse(entries, this.options.fuseOptions);
  }

  /**
   * 添加或更新文件索引条目
   */
  async addOrUpdate(fileInfo: FileInfo): Promise<void> {
    const entry: FileIndexEntry = {
      ...fileInfo,
      type: fileInfo.isDirectory ? 'directory' : fileInfo.isFile ? 'file' : 'symlink',
    };

    const existingEntry = this.entries.get(fileInfo.path);
    const isUpdate = !!existingEntry;

    // 更新索引
    this.entries.set(fileInfo.path, entry);
    this.isDirty = true;

    // 更新统计
    if (!isUpdate) {
      if (entry.isDirectory) {
        this.stats.totalDirectories++;
      } else {
        this.stats.totalFiles++;
        this.stats.totalSize += fileInfo.size;
      }
    } else if (existingEntry && !existingEntry.isDirectory && entry.isDirectory) {
      // 文件变为目录
      this.stats.totalFiles--;
      this.stats.totalDirectories++;
    }

    // 重建 Fuse 索引
    if (this.fuse) {
      this.fuse.add([entry]);
    } else {
      this.rebuildFuseIndex();
    }

    // 通知监听器
    this.notifyListeners([{
      type: isUpdate ? 'change' : 'add',
      path: fileInfo.path,
      fileInfo,
    }]);
  }

  /**
   * 批量添加或更新文件索引条目
   */
  async addOrUpdateBatch(fileInfos: FileInfo[]): Promise<FileIndexUpdateSummary> {
    const summary: FileIndexUpdateSummary = {
      added: 0,
      updated: 0,
      removed: 0,
      unchanged: 0,
    };

    const changes: FileIndexChange[] = [];

    for (const fileInfo of fileInfos) {
      const existingEntry = this.entries.get(fileInfo.path);
      const isUpdate = !!existingEntry;

      await this.addOrUpdate(fileInfo);

      if (isUpdate) {
        summary.updated++;
      } else {
        summary.added++;
      }

      changes.push({
        type: isUpdate ? 'change' : 'add',
        path: fileInfo.path,
        fileInfo,
      });
    }

    // 更新统计
    this.stats.lastUpdated = Date.now();
    this.version++;

    // 通知监听器
    this.notifyListeners(changes);

    // 保存到磁盘
    await this.saveToDisk();

    return summary;
  }

  /**
   * 删除文件索引条目
   */
  async remove(path: string): Promise<void> {
    const entry = this.entries.get(path);
    if (!entry) return;

    // 从索引中删除
    this.entries.delete(path);
    this.isDirty = true;

    // 更新统计
    if (entry.isDirectory) {
      this.stats.totalDirectories--;
    } else {
      this.stats.totalFiles--;
      this.stats.totalSize -= entry.size;
    }

    // 重建 Fuse 索引
    if (this.fuse) {
      this.fuse.remove(doc => doc.path === path);
    }

    // 通知监听器
    this.notifyListeners([{
      type: entry.isDirectory ? 'unlinkDir' : 'unlink',
      path,
    }]);

    // 保存到磁盘
    await this.saveToDisk();
  }

  /**
   * 搜索文件
   */
  search(query: string, options: FileIndexSearchOptions = {}): FileIndexSearchResult[] {
    if (!query.trim()) {
      return [];
    }

    const {
      fuzzy = true,
      exact = false,
      limit = this.options.defaultSearchLimit,
    } = options;

    // 精确匹配
    if (exact && !fuzzy) {
      const exactResults: FileIndexSearchResult[] = [];
      const lowerQuery = query.toLowerCase();

      for (const entry of this.entries.values()) {
        const lowerName = entry.name.toLowerCase();
        const lowerPath = entry.relativePath.toLowerCase();

        if (lowerName === lowerQuery || lowerPath.includes(lowerQuery)) {
          exactResults.push({
            item: entry,
            score: 0,
          });

          if (exactResults.length >= limit) {
            break;
          }
        }
      }

      return exactResults;
    }

    // 模糊搜索
    if (!this.fuse) {
      this.rebuildFuseIndex();
    }

    if (!this.fuse) {
      return [];
    }

    const results = this.fuse.search(query, { limit });
    return results.map(result => ({
      item: result.item,
      score: result.score,
      matches: result.matches,
    }));
  }

  /**
   * 获取所有索引条目
   */
  getAllEntries(): FileIndexEntry[] {
    return Array.from(this.entries.values());
  }

  /**
   * 获取索引统计
   */
  getStats(): FileIndexStats {
    return { ...this.stats };
  }

  /**
   * 获取索引大小
   */
  getSize(): number {
    return this.entries.size;
  }

  /**
   * 清空索引
   */
  clear(): void {
    this.entries.clear();
    this.fuse = null;
    this.stats = {
      totalFiles: 0,
      totalDirectories: 0,
      totalSize: 0,
      lastUpdated: 0,
    };
    this.version++;
    this.isDirty = true;
  }

  /**
   * 添加变更监听器
   */
  addListener(listener: FileIndexChangeListener): void {
    this.listeners.add(listener);
  }

  /**
   * 移除变更监听器
   */
  removeListener(listener: FileIndexChangeListener): void {
    this.listeners.delete(listener);
  }

  /**
   * 通知监听器
   */
  private notifyListeners(changes: FileIndexChange[]): void {
    for (const listener of this.listeners) {
      try {
        listener(changes);
      } catch (error) {
        console.error('[FileIndexService] Listener error:', error);
      }
    }
  }

  /**
   * 销毁索引服务
   */
  async destroy(): Promise<void> {
    // 保存索引到磁盘
    await this.saveToDisk();

    // 清空监听器
    this.listeners.clear();

    // 清空索引
    this.clear();
  }
}

/**
 * 创建文件索引服务实例
 */
export function createFileIndexService(options?: FileIndexServiceOptions): FileIndexService {
  return new FileIndexService(options);
}