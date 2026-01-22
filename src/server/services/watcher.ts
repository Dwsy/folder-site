/**
 * 文件监听服务
 *
 * 使用 chokidar 监听文件系统变化，支持防抖和事件过滤
 */

import { EventEmitter } from 'node:events';
import { join, normalize, relative } from 'node:path';
import chokidar from 'chokidar';
import type { FSWatcher } from 'chokidar';

// 支持的文件扩展名（与 scanner 保持一致）
const SUPPORTED_EXTENSIONS = ['.md', '.mmd', '.txt', '.json', '.yml', '.yaml'];

// 默认排除的目录（与 scanner 保持一致）
const DEFAULT_EXCLUDE_DIRS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  '.next',
  '.nuxt',
  'target',
  '__pycache__',
  'venv',
  'env',
  '.env',
];

/**
 * 文件监听选项
 */
export interface WatcherOptions {
  /** 监听根目录（绝对路径） */
  rootDir: string;
  /** 包含的文件扩展名 */
  extensions?: string[];
  /** 排除的目录名称 */
  excludeDirs?: string[];
  /** 是否忽略初始扫描 */
  ignoreInitial?: boolean;
  /** 防抖延迟（毫秒） */
  debounceDelay?: number;
  /** 是否使用轮询 */
  usePolling?: boolean;
  /** 轮询间隔（毫秒） */
  pollInterval?: number;
  /** 自定义忽略模式 */
  ignored?: string | RegExp | ((path: string) => boolean);
}

/**
 * 文件变更事件
 */
export interface WatcherChangeEvent {
  /** 事件类型 */
  type: 'add' | 'change' | 'unlink' | 'addDir' | 'unlinkDir';
  /** 文件/目录路径 */
  path: string;
  /** 相对路径（相对于监听根目录） */
  relativePath: string;
  /** 是否为目录 */
  isDirectory: boolean;
  /** 文件扩展名 */
  extension?: string;
  /** 事件时间戳 */
  timestamp: number;
}

/**
 * 防抖事件队列项
 */
interface DebouncedEvent {
  type: WatcherChangeEvent['type'];
  path: string;
  timestamp: number;
}

/**
 * 文件监听器类
 */
export class FileWatcher extends EventEmitter {
  private options: Required<WatcherOptions>;
  private watcher?: FSWatcher;
  private isWatching: boolean = false;
  private watchedPaths: Set<string> = new Set();
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private eventQueue: Map<string, DebouncedEvent> = new Map();
  private rootDir: string;

  constructor(options: WatcherOptions) {
    super();
    this.rootDir = normalize(options.rootDir);
    this.options = {
      rootDir: this.rootDir,
      extensions: options.extensions || SUPPORTED_EXTENSIONS,
      excludeDirs: options.excludeDirs || DEFAULT_EXCLUDE_DIRS,
      ignoreInitial: options.ignoreInitial ?? true,
      debounceDelay: options.debounceDelay ?? 300,
      usePolling: options.usePolling ?? false,
      pollInterval: options.pollInterval ?? 100,
      ignored: options.ignored,
    };
  }

  /**
   * 启动监听
   */
  start(): void {
    if (this.isWatching) {
      this.emit('warning', 'Watcher is already running');
      return;
    }

    try {
      // 构建 chokidar 的忽略模式
      const ignoredPatterns = this.buildIgnoredPatterns();

      // 创建 chokidar 监听器
      this.watcher = chokidar.watch(this.rootDir, {
        ignored: ignoredPatterns,
        persistent: true,
        ignoreInitial: this.options.ignoreInitial,
        usePolling: this.options.usePolling,
        interval: this.options.pollInterval,
        awaitWriteFinish: {
          stabilityThreshold: 200,
          pollInterval: 100,
        },
      });

      // 设置事件监听器
      this.setupEventListeners(this.watcher);

      // 监听 ready 事件
      this.watcher.on('ready', () => {
        this.isWatching = true;
        this.watchedPaths.add(this.rootDir);
        this.emit('ready');
      });

      // 监听错误
      this.watcher.on('error', (error) => {
        this.emit('error', error);
      });

    } catch (error) {
      this.emit('error', new Error(`Failed to start watcher: ${error}`));
    }
  }

  /**
   * 停止监听
   */
  async stop(): Promise<void> {
    if (!this.isWatching || !this.watcher) {
      return;
    }

    // 清理所有防抖定时器
    this.debounceTimers.forEach((timer) => clearTimeout(timer));
    this.debounceTimers.clear();
    this.eventQueue.clear();

    // 停止监听
    await this.watcher.close();
    this.isWatching = false;
    this.watchedPaths.clear();
    this.watcher = undefined;

    this.emit('stopped');
  }

  /**
   * 添加监听路径
   */
  addPath(path: string): void {
    const normalizedPath = normalize(path);
    if (!this.watchedPaths.has(normalizedPath)) {
      this.watcher?.add(normalizedPath);
      this.watchedPaths.add(normalizedPath);
    }
  }

  /**
   * 移除监听路径
   */
  unwatchPath(path: string): void {
    const normalizedPath = normalize(path);
    if (this.watchedPaths.has(normalizedPath)) {
      this.watcher?.unwatch(normalizedPath);
      this.watchedPaths.delete(normalizedPath);
    }
  }

  /**
   * 获取监听状态
   */
  getStatus(): { isWatching: boolean; watchedPaths: string[] } {
    return {
      isWatching: this.isWatching,
      watchedPaths: Array.from(this.watchedPaths),
    };
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(watcher: FSWatcher): void {
    // 文件添加
    watcher.on('add', (path) => {
      this.handleFileEvent('add', path);
    });

    // 文件变更
    watcher.on('change', (path) => {
      this.handleFileEvent('change', path);
    });

    // 文件删除
    watcher.on('unlink', (path) => {
      this.handleFileEvent('unlink', path);
    });

    // 目录添加
    watcher.on('addDir', (path) => {
      this.handleFileEvent('addDir', path);
    });

    // 目录删除
    watcher.on('unlinkDir', (path) => {
      this.handleFileEvent('unlinkDir', path);
    });
  }

  /**
   * 处理文件事件（带防抖）
   */
  private handleFileEvent(type: WatcherChangeEvent['type'], path: string): void {
    // 检查文件扩展名（对于非目录事件）
    const extension = this.getExtension(path);
    const isDirectory = type === 'addDir' || type === 'unlinkDir';

    // 只监听支持的文件类型
    if (!isDirectory && !this.matchesExtension(extension)) {
      return;
    }

    // 创建事件对象
    const event: WatcherChangeEvent = {
      type,
      path: normalize(path),
      relativePath: relative(this.rootDir, path),
      isDirectory,
      extension,
      timestamp: Date.now(),
    };

    // 使用防抖处理事件
    this.debouncedEmit(path, event);
  }

  /**
   * 防抖发送事件
   */
  private debouncedEmit(path: string, event: WatcherChangeEvent): void {
    // 清除该路径的现有定时器
    const existingTimer = this.debounceTimers.get(path);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // 保存最新事件到队列
    this.eventQueue.set(path, {
      type: event.type,
      path: event.path,
      timestamp: event.timestamp,
    });

    // 设置新的防抖定时器
    const timer = setTimeout(() => {
      const queuedEvent = this.eventQueue.get(path);
      if (queuedEvent) {
        // 发出事件
        this.emit('change', event);
        this.emit(`event:${event.type}`, event);

        // 清理
        this.eventQueue.delete(path);
        this.debounceTimers.delete(path);
      }
    }, this.options.debounceDelay);

    this.debounceTimers.set(path, timer);
  }

  /**
   * 构建忽略模式
   */
  private buildIgnoredPatterns(): Array<(string | RegExp | ((path: string) => boolean))> {
    const patterns: Array<(string | RegExp | ((path: string) => boolean))> = [];

    // 添加排除目录模式
    for (const dir of this.options.excludeDirs) {
      patterns.push(new RegExp(`/${dir}/`));
      patterns.push(new RegExp(`^${dir}/`));
    }

    // 添加自定义忽略模式
    if (this.options.ignored) {
      patterns.push(this.options.ignored);
    }

    // 添加文件扩展名过滤（只监听支持的文件）
    patterns.push((path: string) => {
      // 检查是否为目录
      const isDir = path.endsWith('/') || path.endsWith('\\');
      if (isDir) {
        return false; // 不忽略目录（由排除目录模式处理）
      }

      // 检查文件扩展名
      const ext = this.getExtension(path);
      return !this.matchesExtension(ext);
    });

    return patterns;
  }

  /**
   * 检查文件扩展名是否匹配
   */
  private matchesExtension(extension: string): boolean {
    return this.options.extensions.includes(extension);
  }

  /**
   * 获取文件扩展名（包含点号）
   */
  private getExtension(path: string): string {
    const filename = path.split('/').pop() || path.split('\\').pop() || '';
    const ext = filename.split('.').pop();
    return ext ? `.${ext}` : '';
  }
}

/**
 * 便捷函数：创建并启动文件监听器
 */
export function createWatcher(options: WatcherOptions): FileWatcher {
  const watcher = new FileWatcher(options);
  watcher.start();
  return watcher;
}

/**
 * 便捷函数：使用默认配置创建文件监听器
 */
export function createWatcherDefault(rootDir: string): FileWatcher {
  return createWatcher({
    rootDir,
    extensions: SUPPORTED_EXTENSIONS,
    excludeDirs: DEFAULT_EXCLUDE_DIRS,
    debounceDelay: 300,
  });
}
