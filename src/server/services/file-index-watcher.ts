/**
 * 文件索引和监视服务
 *
 * 集成文件索引、增量更新和文件监视功能
 * - 自动扫描并索引文件
 * - 监听文件系统变化，自动更新索引
 * - 支持索引持久化
 * - 支持高性能搜索
 */

import { join, normalize } from 'node:path';
import { FileIndexService, createFileIndexService } from './file-index.js';
import { IncrementalIndexer, createIncrementalIndexer } from './incremental-indexer.js';
import { FileWatcher, type WatcherOptions, type WatcherChangeEvent } from './watcher.js';
import { scanDirectory, type ScanOptions, type ScanResult } from './scanner.js';
import type { FileIndexEntry, FileIndexSearchOptions, FileIndexSearchResult } from '../../types/indexing.js';
import { getEventBus } from './event-bus.js';
import type { FileEventData, DirectoryEventData, IndexUpdatedEventData } from '../../types/events.js';

/**
 * 文件索引和监视服务配置
 */
export interface FileIndexWatcherOptions {
  /** 扫描根目录（绝对路径） */
  rootDir: string;
  /** 索引文件路径（可选） */
  indexPath?: string;
  /** 扫描选项 */
  scanOptions?: ScanOptions;
  /** 监视选项 */
  watcherOptions?: Partial<WatcherOptions>;
  /** 是否启用监视 */
  enableWatcher?: boolean;
  /** 是否启用日志 */
  enableLogging?: boolean;
}

/**
 * 文件索引和监视服务类
 */
export class FileIndexWatcherService {
  private indexService: FileIndexService;
  private indexer: IncrementalIndexer;
  private watcher: FileWatcher | null = null;
  private options: Required<FileIndexWatcherOptions>;
  private rootDir: string;
  private isInitialized: boolean = false;

  constructor(options: FileIndexWatcherOptions) {
    this.rootDir = normalize(options.rootDir);
    this.options = {
      rootDir: this.rootDir,
      indexPath: options.indexPath || join(this.rootDir, '.folder-site', 'index.json'),
      scanOptions: options.scanOptions || { rootDir: this.rootDir },
      watcherOptions: options.watcherOptions || {},
      enableWatcher: options.enableWatcher ?? true,
      enableLogging: options.enableLogging ?? true,
    };

    // 创建索引服务
    this.indexService = createFileIndexService({
      caseSensitive: false,
      includeDirectories: true,
      defaultSearchLimit: 20,
    });

    // 创建增量索引更新器
    this.indexer = createIncrementalIndexer({
      indexService: this.indexService,
      rootPath: this.rootDir,
      debounceDelay: 300,
      batchDelay: 1000,
      enableLogging: this.options.enableLogging,
    });
  }

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      this.log('Service already initialized');
      return;
    }

    this.log('Initializing FileIndexWatcherService...');

    try {
      // 初始化索引服务
      await this.indexService.initialize(this.rootDir, this.options.indexPath);

      // 初始扫描（如果索引为空）
      if (this.indexService.getSize() === 0) {
        this.log('Index is empty, performing initial scan...');
        await this.performInitialScan();
      }

      // 启动文件监视器
      if (this.options.enableWatcher) {
        await this.startWatcher();
      }

      this.isInitialized = true;
      this.log('Initialization complete');
    } catch (error) {
      this.log('Initialization failed:', error);
      throw error;
    }
  }

  /**
   * 执行初始扫描
   */
  private async performInitialScan(): Promise<ScanResult> {
    const scanOptions: ScanOptions = {
      rootDir: this.rootDir,
      extensions: this.options.scanOptions.extensions,
      excludeDirs: this.options.scanOptions.excludeDirs,
      maxDepth: this.options.scanOptions.maxDepth,
      includeHidden: this.options.scanOptions.includeHidden,
      includeDotFiles: this.options.scanOptions.includeDotFiles,
      followSymlinks: this.options.scanOptions.followSymlinks,
      strategy: this.options.scanOptions.strategy,
      useGitignore: this.options.scanOptions.useGitignore,
      whitelist: this.options.scanOptions.whitelist,
    };

    const result: ScanResult = await scanDirectory(scanOptions);

    this.log(`Scanned ${result.files.length} files and ${result.directories.length} directories`);

    // 添加到索引
    const allItems = [...result.files, ...result.directories];
    await this.indexService.addOrUpdateBatch(allItems);

    return result;
  }

  /**
   * 启动文件监视器
   */
  private async startWatcher(): Promise<void> {
    this.log('Starting watcher...');

    const watcherOptions: WatcherOptions = {
      rootDir: this.rootDir,
      extensions: this.options.scanOptions.extensions,
      excludeDirs: this.options.scanOptions.excludeDirs,
      debounceDelay: 300,
      ignoreInitial: true,
      ...this.options.watcherOptions,
    };

    this.log(`Watcher options:`, {
      rootDir: watcherOptions.rootDir,
      extensions: watcherOptions.extensions,
      excludeDirs: watcherOptions.excludeDirs,
    });

    this.watcher = new FileWatcher(watcherOptions);

    // 监听文件变化事件
    this.watcher.on('change', async (event: WatcherChangeEvent) => {
      this.log(`File changed: ${event.relativePath}`);
      await this.indexer.handleChange('change', event.path);
      this.broadcastFileChange(event);
    });

    this.watcher.on('add', async (event: WatcherChangeEvent) => {
      this.log(`File added: ${event.relativePath}`);
      await this.indexer.handleChange('add', event.path);
      this.broadcastFileAdd(event);
    });

    this.watcher.on('unlink', async (event: WatcherChangeEvent) => {
      this.log(`File removed: ${event.relativePath}`);
      await this.indexer.handleChange('unlink', event.path);
      this.broadcastFileRemove(event);
    });

    this.watcher.on('addDir', async (event: WatcherChangeEvent) => {
      this.log(`Directory added: ${event.relativePath}`);
      await this.indexer.handleDirectoryChange('addDir', event.path);
      this.broadcastDirectoryAdd(event);
    });

    this.watcher.on('unlinkDir', async (event: WatcherChangeEvent) => {
      this.log(`Directory removed: ${event.relativePath}`);
      await this.indexer.handleDirectoryChange('unlinkDir', event.path);
      this.broadcastDirectoryRemove(event);
    });

    // 监听 watcher 事件
    this.watcher.on('ready', () => {
      this.log('Watcher is ready');
    });

    this.watcher.on('error', (error) => {
      this.log('Watcher error:', error);
    });

    // 启动监视器
    this.watcher.start();

    this.log('Watcher started');
  }

  /**
   * 搜索文件
   */
  search(query: string, options?: FileIndexSearchOptions): FileIndexSearchResult[] {
    return this.indexService.search(query, options);
  }

  /**
   * 获取所有索引条目
   */
  getAllEntries(): FileIndexEntry[] {
    return this.indexService.getAllEntries();
  }

  /**
   * 获取索引统计
   */
  getStats() {
    return this.indexService.getStats();
  }

  /**
   * 获取索引大小
   */
  getSize(): number {
    return this.indexService.getSize();
  }

  /**
   * 手动触发扫描
   */
  async scan(): Promise<ScanResult> {
    this.log('Performing manual scan...');
    const result = await this.performInitialScan();
    return result;
  }

  /**
   * 刷新索引（重新扫描）
   */
  async refresh(): Promise<void> {
    this.log('Refreshing index...');

    // 清空现有索引
    this.indexService.clear();

    // 重新扫描
    await this.performInitialScan();
  }

  /**
   * 刷新特定文件
   */
  async refreshFile(path: string): Promise<void> {
    this.log(`Refreshing file: ${path}`);

    try {
      const { stat } = await import('node:fs/promises');
      const stats = await stat(path);
      const fileInfo = {
        name: path.split('/').pop() || '',
        path,
        relativePath: path.replace(this.rootDir + '/', ''),
        extension: path.split('.').pop() || '',
        size: stats.size,
        modifiedAt: stats.mtime,
        createdAt: stats.ctime,
        isDirectory: stats.isDirectory(),
        isFile: stats.isFile(),
        isSymbolicLink: stats.isSymbolicLink(),
      };

      await this.indexService.addOrUpdate(fileInfo);
    } catch (error) {
      this.log(`Failed to refresh file ${path}:`, error);
      await this.indexService.remove(path);
    }
  }

  /**
   * 添加变更监听器
   */
  addChangeListener(listener: (changes: any[]) => void): void {
    this.indexService.addListener(listener);
  }

  /**
   * 移除变更监听器
   */
  removeChangeListener(listener: (changes: any[]) => void): void {
    this.indexService.removeListener(listener);
  }

  /**
   * 广播文件添加事件
   */
  private broadcastFileAdd(event: WatcherChangeEvent): void {
    try {
      const eventBus = getEventBus();
      const data: FileEventData = {
        name: event.relativePath.split('/').pop() || '',
        path: event.path,
        relativePath: event.relativePath,
        extension: event.extension || '',
        size: 0,
        isDirectory: false,
      };
      eventBus.publish({
        id: `evt_${Date.now()}`,
        type: 'file.added',
        timestamp: Date.now(),
        data,
        source: 'file-index-watcher',
      });
    } catch (error) {
      // 事件总线可能未启动，忽略错误
    }
  }

  /**
   * 广播文件变化事件
   */
  private broadcastFileChange(event: WatcherChangeEvent): void {
    try {
      const eventBus = getEventBus();
      const data: FileEventData = {
        name: event.relativePath.split('/').pop() || '',
        path: event.path,
        relativePath: event.relativePath,
        extension: event.extension || '',
        size: 0,
        isDirectory: false,
      };
      eventBus.publish({
        id: `evt_${Date.now()}`,
        type: 'file.changed',
        timestamp: Date.now(),
        data,
        source: 'file-index-watcher',
      });
    } catch (error) {
      // 事件总线可能未启动，忽略错误
    }
  }

  /**
   * 广播文件删除事件
   */
  private broadcastFileRemove(event: WatcherChangeEvent): void {
    try {
      const eventBus = getEventBus();
      const data: FileEventData = {
        name: event.relativePath.split('/').pop() || '',
        path: event.path,
        relativePath: event.relativePath,
        extension: event.extension || '',
        size: 0,
        isDirectory: false,
      };
      eventBus.publish({
        id: `evt_${Date.now()}`,
        type: 'file.removed',
        timestamp: Date.now(),
        data,
        source: 'file-index-watcher',
      });
    } catch (error) {
      // 事件总线可能未启动，忽略错误
    }
  }

  /**
   * 广播目录添加事件
   */
  private broadcastDirectoryAdd(event: WatcherChangeEvent): void {
    try {
      const eventBus = getEventBus();
      const data: DirectoryEventData = {
        path: event.path,
        relativePath: event.relativePath,
        name: event.relativePath.split('/').pop() || '',
      };
      eventBus.publish({
        id: `evt_${Date.now()}`,
        type: 'directory.added',
        timestamp: Date.now(),
        data,
        source: 'file-index-watcher',
      });
    } catch (error) {
      // 事件总线可能未启动，忽略错误
    }
  }

  /**
   * 广播目录删除事件
   */
  private broadcastDirectoryRemove(event: WatcherChangeEvent): void {
    try {
      const eventBus = getEventBus();
      const data: DirectoryEventData = {
        path: event.path,
        relativePath: event.relativePath,
        name: event.relativePath.split('/').pop() || '',
      };
      eventBus.publish({
        id: `evt_${Date.now()}`,
        type: 'directory.removed',
        timestamp: Date.now(),
        data,
        source: 'file-index-watcher',
      });
    } catch (error) {
      // 事件总线可能未启动，忽略错误
    }
  }

  /**
   * 日志输出
   */
  private log(...args: any[]): void {
    if (this.options.enableLogging) {
      console.log('[FileIndexWatcherService]', ...args);
    }
  }

  /**
   * 销毁服务
   */
  async destroy(): Promise<void> {
    this.log('Destroying service...');

    try {
      // 停止监视器
      if (this.watcher) {
        await this.watcher.stop();
        this.watcher = null;
      }

      // 销毁增量索引更新器
      await this.indexer.destroy();

      // 销毁索引服务
      await this.indexService.destroy();

      this.isInitialized = false;
      this.log('Service destroyed');
    } catch (error) {
      this.log('Error destroying service:', error);
    }
  }
}

/**
 * 创建文件索引和监视服务实例
 */
export function createFileIndexWatcherService(options: FileIndexWatcherOptions): FileIndexWatcherService {
  return new FileIndexWatcherService(options);
}