/**
 * 文件索引服务
 *
 * 使用内存 Map/Set 与 Fuse.js 组合实现快速搜索和增量更新
 */

import { normalize } from 'node:path';
import Fuse from 'fuse.js';
import type { IFuseOptions, FuseResult } from 'fuse.js';
import type { FileInfo, ScanResult } from './scanner.js';
import type {
  FileIndexEntry,
  FileIndexEntryType,
  FileIndexStats,
  FileIndexServiceOptions,
  FileIndexSearchOptions,
  FileIndexSearchResult,
  FileIndexUpdateSummary,
  FileIndexChange,
} from '../../types/indexing.js';

const DEFAULT_SEARCH_LIMIT = 50;

const DEFAULT_FUSE_OPTIONS: IFuseOptions<FileIndexEntry> = {
  includeScore: true,
  includeMatches: false,
  shouldSort: true,
  ignoreLocation: true,
  threshold: 0.35,
  minMatchCharLength: 2,
  keys: ['name', 'relativePath', 'path'],
};

/**
 * 文件索引服务
 */
export class FileIndexService {
  private entries: Map<string, FileIndexEntry> = new Map();
  private nameIndex: Map<string, Set<string>> = new Map();
  private extensionIndex: Map<string, Set<string>> = new Map();
  private pathIndex: Map<string, string> = new Map();
  private relativePathIndex: Map<string, string> = new Map();
  private stats: FileIndexStats = {
    totalFiles: 0,
    totalDirectories: 0,
    totalSize: 0,
    lastUpdated: 0,
  };
  private options: Required<FileIndexServiceOptions>;
  private fuseAll: Fuse<FileIndexEntry>;
  private fuseName: Fuse<FileIndexEntry>;
  private fusePath: Fuse<FileIndexEntry>;

  constructor(options: FileIndexServiceOptions = {}) {
    const baseFuseOptions = {
      ...DEFAULT_FUSE_OPTIONS,
      ...options.fuseOptions,
      isCaseSensitive: options.caseSensitive ?? DEFAULT_FUSE_OPTIONS.isCaseSensitive,
    } satisfies IFuseOptions<FileIndexEntry>;

    this.options = {
      caseSensitive: options.caseSensitive ?? false,
      includeDirectories: options.includeDirectories ?? false,
      defaultSearchLimit: options.defaultSearchLimit ?? DEFAULT_SEARCH_LIMIT,
      fuseOptions: baseFuseOptions,
    };

    this.fuseAll = new Fuse([], baseFuseOptions);
    this.fuseName = new Fuse([], {
      ...baseFuseOptions,
      keys: ['name'],
    });
    this.fusePath = new Fuse([], {
      ...baseFuseOptions,
      keys: ['relativePath', 'path'],
    });
  }

  /**
   * 使用扫描结果构建索引（全量重建）
   */
  buildFromScanResult(result: ScanResult): FileIndexStats {
    const items = this.collectIndexItems(result.files, result.directories);
    return this.buildIndex(items);
  }

  /**
   * 使用扫描结果增量同步索引
   */
  syncWithScanResult(result: ScanResult): FileIndexUpdateSummary {
    const items = this.collectIndexItems(result.files, result.directories);
    const nextMap = new Map(items.map((item) => [item.path, item]));
    const summary = this.createUpdateSummary();

    for (const path of Array.from(this.entries.keys())) {
      if (!nextMap.has(path)) {
        if (this.removeFile(path)) {
          summary.removed += 1;
        }
      }
    }

    for (const fileInfo of items) {
      const resultType = this.upsertFile(fileInfo);
      summary[resultType] += 1;
    }

    return summary;
  }

  /**
   * 批量构建索引（全量重建）
   */
  buildIndex(items: FileInfo[]): FileIndexStats {
    this.reset();

    const entries: FileIndexEntry[] = [];
    for (const item of items) {
      if (!this.shouldIndex(item)) {
        continue;
      }
      const entry = this.createEntry(item);
      entries.push(entry);
      this.entries.set(entry.path, entry);
      this.indexEntry(entry);
      this.updateStatsOnAdd(entry);
    }

    this.rebuildSearchIndices(entries);
    this.touch();

    return this.getStats();
  }

  /**
   * 增量更新单个文件
   */
  upsertFile(fileInfo: FileInfo): 'added' | 'updated' | 'unchanged' {
    if (!this.shouldIndex(fileInfo)) {
      return 'unchanged';
    }

    const entry = this.createEntry(fileInfo);
    const existing = this.entries.get(entry.path);

    if (!existing) {
      this.addEntry(entry);
      return 'added';
    }

    if (this.isEntryEqual(existing, entry)) {
      return 'unchanged';
    }

    this.updateEntry(existing, entry);
    return 'updated';
  }

  /**
   * 移除文件索引
   */
  removeFile(path: string): boolean {
    const key = this.normalizePathKey(path);
    const actualPath = this.pathIndex.get(key) || this.relativePathIndex.get(key);

    if (!actualPath) {
      return false;
    }

    const entry = this.entries.get(actualPath);
    if (!entry) {
      return false;
    }

    this.entries.delete(actualPath);
    this.removeEntryIndices(entry);
    this.removeFromFuses(entry.path);
    this.updateStatsOnRemove(entry);
    this.touch();

    return true;
  }

  /**
   * 批量应用变更事件
   */
  applyChanges(changes: FileIndexChange[]): FileIndexUpdateSummary {
    const summary = this.createUpdateSummary();

    for (const change of changes) {
      if (change.type === 'unlink' || change.type === 'unlinkDir') {
        if (this.removeFile(change.path)) {
          summary.removed += 1;
        }
        continue;
      }

      if (!change.fileInfo) {
        throw new Error(`Missing fileInfo for ${change.type} event: ${change.path}`);
      }

      const resultType = this.upsertFile(change.fileInfo);
      summary[resultType] += 1;
    }

    return summary;
  }

  /**
   * 按名称搜索
   */
  searchByName(query: string, options: FileIndexSearchOptions = {}): FileIndexSearchResult[] {
    if (options.exact || options.fuzzy === false) {
      return this.searchExactByName(query);
    }

    return this.runFuseSearch(this.fuseName, query, options.limit);
  }

  /**
   * 按路径搜索（支持绝对路径与相对路径）
   */
  searchByPath(query: string, options: FileIndexSearchOptions = {}): FileIndexSearchResult[] {
    if (options.exact || options.fuzzy === false) {
      return this.searchExactByPath(query);
    }

    return this.runFuseSearch(this.fusePath, query, options.limit);
  }

  /**
   * 按扩展名搜索（精确匹配）
   */
  searchByExtension(extension: string): FileIndexSearchResult[] {
    const normalized = this.normalizeExtension(extension);
    const paths = this.extensionIndex.get(normalized);

    if (!paths || paths.size === 0) {
      return [];
    }

    return this.buildExactResults(paths);
  }

  /**
   * 全局搜索（名称 + 路径）
   */
  search(query: string, options: FileIndexSearchOptions = {}): FileIndexSearchResult[] {
    if (options.exact || options.fuzzy === false) {
      const nameResults = this.searchExactByName(query);
      const pathResults = this.searchExactByPath(query);
      return this.mergeResults([...nameResults, ...pathResults]);
    }

    return this.runFuseSearch(this.fuseAll, query, options.limit);
  }

  /**
   * 获取指定路径的索引条目
   */
  getByPath(path: string): FileIndexEntry | undefined {
    const key = this.normalizePathKey(path);
    const actualPath = this.pathIndex.get(key) || this.relativePathIndex.get(key);
    if (!actualPath) {
      return undefined;
    }
    return this.entries.get(actualPath);
  }

  /**
   * 获取全部索引条目
   */
  list(): FileIndexEntry[] {
    return Array.from(this.entries.values());
  }

  /**
   * 获取统计信息
   */
  getStats(): FileIndexStats {
    return { ...this.stats };
  }

  /**
   * 重置索引
   */
  reset(): void {
    this.entries.clear();
    this.nameIndex.clear();
    this.extensionIndex.clear();
    this.pathIndex.clear();
    this.relativePathIndex.clear();
    this.stats = {
      totalFiles: 0,
      totalDirectories: 0,
      totalSize: 0,
      lastUpdated: 0,
    };
    this.rebuildSearchIndices([]);
  }

  private collectIndexItems(files: FileInfo[], directories: FileInfo[]): FileInfo[] {
    if (!this.options.includeDirectories) {
      return files;
    }

    return [...files, ...directories];
  }

  private shouldIndex(fileInfo: FileInfo): boolean {
    if (fileInfo.isDirectory && !this.options.includeDirectories) {
      return false;
    }

    return true;
  }

  private createEntry(fileInfo: FileInfo): FileIndexEntry {
    const type: FileIndexEntryType = fileInfo.isDirectory
      ? 'directory'
      : fileInfo.isSymbolicLink
        ? 'symlink'
        : 'file';

    return {
      ...fileInfo,
      extension: this.normalizeExtension(fileInfo.extension),
      type,
    };
  }

  private addEntry(entry: FileIndexEntry): void {
    this.entries.set(entry.path, entry);
    this.indexEntry(entry);
    this.addToFuses(entry);
    this.updateStatsOnAdd(entry);
    this.touch();
  }

  private updateEntry(existing: FileIndexEntry, entry: FileIndexEntry): void {
    this.entries.set(entry.path, entry);
    this.updateEntryIndices(existing, entry);
    this.removeFromFuses(existing.path);
    this.addToFuses(entry);
    this.updateStatsOnUpdate(existing, entry);
    this.touch();
  }

  private isEntryEqual(existing: FileIndexEntry, entry: FileIndexEntry): boolean {
    return (
      existing.name === entry.name &&
      existing.relativePath === entry.relativePath &&
      existing.extension === entry.extension &&
      existing.size === entry.size &&
      existing.modifiedAt.getTime() === entry.modifiedAt.getTime() &&
      existing.isDirectory === entry.isDirectory &&
      existing.isFile === entry.isFile &&
      existing.isSymbolicLink === entry.isSymbolicLink
    );
  }

  private rebuildSearchIndices(entries: FileIndexEntry[]): void {
    this.fuseAll.setCollection(entries);
    this.fuseName.setCollection(entries);
    this.fusePath.setCollection(entries);
  }

  private runFuseSearch(
    fuse: Fuse<FileIndexEntry>,
    query: string,
    limit?: number
  ): FileIndexSearchResult[] {
    const trimmed = query.trim();
    if (!trimmed) {
      return [];
    }

    const resolvedLimit = limit ?? this.options.defaultSearchLimit;
    const results = resolvedLimit > 0
      ? fuse.search(trimmed, { limit: resolvedLimit })
      : fuse.search(trimmed);

    return this.mapFuseResults(results);
  }

  private mapFuseResults(results: FuseResult<FileIndexEntry>[]): FileIndexSearchResult[] {
    return results.map((result) => ({
      item: result.item,
      score: result.score,
      matches: result.matches,
    }));
  }

  private searchExactByName(query: string): FileIndexSearchResult[] {
    const key = this.normalizeKey(query);
    const paths = this.nameIndex.get(key);
    if (!paths) {
      return [];
    }
    return this.buildExactResults(paths);
  }

  private searchExactByPath(query: string): FileIndexSearchResult[] {
    const key = this.normalizePathKey(query);
    const directPath = this.pathIndex.get(key);
    const relativePath = this.relativePathIndex.get(key);
    const paths = new Set<string>();

    if (directPath) {
      paths.add(directPath);
    }
    if (relativePath) {
      paths.add(relativePath);
    }

    if (paths.size === 0) {
      return [];
    }

    return this.buildExactResults(paths);
  }

  private buildExactResults(paths: Set<string>): FileIndexSearchResult[] {
    const results: FileIndexSearchResult[] = [];

    for (const path of paths) {
      const entry = this.entries.get(path);
      if (entry) {
        results.push({ item: entry, score: 0 });
      }
    }

    return results;
  }

  private mergeResults(results: FileIndexSearchResult[]): FileIndexSearchResult[] {
    const seen = new Set<string>();
    const merged: FileIndexSearchResult[] = [];

    for (const result of results) {
      if (seen.has(result.item.path)) {
        continue;
      }
      seen.add(result.item.path);
      merged.push(result);
    }

    return merged;
  }

  private indexEntry(entry: FileIndexEntry): void {
    this.addToIndex(this.nameIndex, entry.name, entry.path);
    this.addToIndex(this.extensionIndex, entry.extension, entry.path);
    this.pathIndex.set(this.normalizePathKey(entry.path), entry.path);
    this.relativePathIndex.set(this.normalizePathKey(entry.relativePath), entry.path);
  }

  private updateEntryIndices(existing: FileIndexEntry, entry: FileIndexEntry): void {
    this.removeFromIndex(this.nameIndex, existing.name, existing.path);
    this.removeFromIndex(this.extensionIndex, existing.extension, existing.path);
    this.pathIndex.delete(this.normalizePathKey(existing.path));
    this.relativePathIndex.delete(this.normalizePathKey(existing.relativePath));

    this.indexEntry(entry);
  }

  private removeEntryIndices(entry: FileIndexEntry): void {
    this.removeFromIndex(this.nameIndex, entry.name, entry.path);
    this.removeFromIndex(this.extensionIndex, entry.extension, entry.path);
    this.pathIndex.delete(this.normalizePathKey(entry.path));
    this.relativePathIndex.delete(this.normalizePathKey(entry.relativePath));
  }

  private addToIndex(index: Map<string, Set<string>>, key: string, path: string): void {
    const normalizedKey = this.normalizeKey(key);
    const entrySet = index.get(normalizedKey) ?? new Set<string>();
    entrySet.add(path);
    index.set(normalizedKey, entrySet);
  }

  private removeFromIndex(index: Map<string, Set<string>>, key: string, path: string): void {
    const normalizedKey = this.normalizeKey(key);
    const entrySet = index.get(normalizedKey);

    if (!entrySet) {
      return;
    }

    entrySet.delete(path);
    if (entrySet.size === 0) {
      index.delete(normalizedKey);
    }
  }

  private addToFuses(entry: FileIndexEntry): void {
    this.fuseAll.add(entry);
    this.fuseName.add(entry);
    this.fusePath.add(entry);
  }

  private removeFromFuses(path: string): void {
    this.fuseAll.remove((item) => item.path === path);
    this.fuseName.remove((item) => item.path === path);
    this.fusePath.remove((item) => item.path === path);
  }

  private updateStatsOnAdd(entry: FileIndexEntry): void {
    if (entry.isDirectory) {
      this.stats.totalDirectories += 1;
    } else {
      this.stats.totalFiles += 1;
    }
    this.stats.totalSize += entry.size;
  }

  private updateStatsOnRemove(entry: FileIndexEntry): void {
    if (entry.isDirectory) {
      this.stats.totalDirectories = Math.max(0, this.stats.totalDirectories - 1);
    } else {
      this.stats.totalFiles = Math.max(0, this.stats.totalFiles - 1);
    }
    this.stats.totalSize = Math.max(0, this.stats.totalSize - entry.size);
  }

  private updateStatsOnUpdate(existing: FileIndexEntry, entry: FileIndexEntry): void {
    if (existing.isDirectory !== entry.isDirectory) {
      if (existing.isDirectory) {
        this.stats.totalDirectories = Math.max(0, this.stats.totalDirectories - 1);
        this.stats.totalFiles += 1;
      } else {
        this.stats.totalFiles = Math.max(0, this.stats.totalFiles - 1);
        this.stats.totalDirectories += 1;
      }
    }

    this.stats.totalSize += entry.size - existing.size;
  }

  private normalizeKey(value: string): string {
    const normalized = value.trim();
    return this.options.caseSensitive ? normalized : normalized.toLowerCase();
  }

  private normalizePathKey(value: string): string {
    const normalizedPath = normalize(value);
    return this.normalizeKey(normalizedPath);
  }

  private normalizeExtension(extension: string): string {
    if (!extension) {
      return '';
    }

    const withDot = extension.startsWith('.') ? extension : `.${extension}`;
    return this.normalizeKey(withDot);
  }

  private touch(): void {
    this.stats.lastUpdated = Date.now();
  }

  private createUpdateSummary(): FileIndexUpdateSummary {
    return {
      added: 0,
      updated: 0,
      removed: 0,
      unchanged: 0,
    };
  }
}
