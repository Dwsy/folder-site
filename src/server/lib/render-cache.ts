/**
 * 渲染缓存实现
 * 
 * 使用 LRU (Least Recently Used) 策略缓存渲染结果
 * 支持基于文件变更的自动失效和时间的手动失效
 */

import { createHash } from 'crypto';

/**
 * 缓存节点
 */
interface CacheNode<K, V> {
  /** 缓存键 */
  key: K;
  /** 缓存值 */
  value: V;
  /** 文件路径 */
  filePath: string;
  /** 文件修改时间 */
  fileMtime: number;
  /** 缓存时间戳 */
  timestamp: number;
  /** 前一个节点 */
  prev: CacheNode<K, V> | null;
  /** 后一个节点 */
  next: CacheNode<K, V> | null;
}

/**
 * LRU 缓存类
 */
export class RenderCache<K, V> {
  /** 缓存容量 */
  private capacity: number;
  /** 缓存映射 */
  private cache: Map<K, CacheNode<K, V>>;
  /** 缓存头节点（最近使用） */
  private head: CacheNode<K, V> | null;
  /** 缓存尾节点（最久未使用） */
  private tail: CacheNode<K, V> | null;
  /** 缓存统计 */
  private stats: CacheStatistics;

  /**
   * 构造函数
   * 
   * @param capacity - 缓存容量
   */
  constructor(capacity: number = 100) {
    this.capacity = capacity;
    this.cache = new Map();
    this.head = null;
    this.tail = null;
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      invalidations: 0,
      currentSize: 0,
      totalSize: 0,
    };
  }

  /**
   * 生成缓存键
   * 
   * @param filePath - 文件路径
   * @param options - 渲染选项
   * @returns 缓存键
   */
  static generateKey(filePath: string, options: Record<string, unknown> = {}): string {
    const data = JSON.stringify({ filePath, options });
    return createHash('sha256').update(data).digest('hex');
  }

  /**
   * 获取缓存值
   * 
   * @param key - 缓存键
   * @returns 缓存值或 undefined
   */
  get(key: K): V | undefined {
    const node = this.cache.get(key);

    if (!node) {
      this.stats.misses++;
      return undefined;
    }

    // 移动到头部（最近使用）
    this.moveToHead(node);
    this.stats.hits++;

    return node.value;
  }

  /**
   * 设置缓存值
   * 
   * @param key - 缓存键
   * @param value - 缓存值
   * @param filePath - 文件路径
   * @param fileMtime - 文件修改时间
   */
  set(key: K, value: V, filePath: string, fileMtime: number): void {
    const existingNode = this.cache.get(key);

    if (existingNode) {
      // 更新现有节点
      existingNode.value = value;
      existingNode.filePath = filePath;
      existingNode.fileMtime = fileMtime;
      existingNode.timestamp = Date.now();
      this.moveToHead(existingNode);
    } else {
      // 创建新节点
      const newNode: CacheNode<K, V> = {
        key,
        value,
        filePath,
        fileMtime,
        timestamp: Date.now(),
        prev: null,
        next: null,
      };

      this.cache.set(key, newNode);
      this.addToHead(newNode);
      this.stats.currentSize++;
      this.stats.totalSize++;

      // 检查是否超过容量
      if (this.cache.size > this.capacity) {
        this.removeTail();
      }
    }
  }

  /**
   * 删除缓存值
   * 
   * @param key - 缓存键
   * @returns 是否删除成功
   */
  delete(key: K): boolean {
    const node = this.cache.get(key);

    if (!node) {
      return false;
    }

    this.removeNode(node);
    this.cache.delete(key);
    this.stats.currentSize--;
    this.stats.invalidations++;

    return true;
  }

  /**
   * 基于文件路径失效缓存
   * 
   * @param filePath - 文件路径
   * @param currentMtime - 当前文件修改时间
   * @returns 失效的缓存数量
   */
  invalidateByFile(filePath: string, currentMtime?: number): number {
    let count = 0;

    for (const [key, node] of this.cache) {
      if (node.filePath === filePath) {
        // 如果提供了当前修改时间，检查是否需要失效
        if (currentMtime !== undefined && node.fileMtime === currentMtime) {
          continue;
        }

        this.removeNode(node);
        this.cache.delete(key);
        count++;
        this.stats.currentSize--;
      }
    }

    if (count > 0) {
      this.stats.invalidations += count;
    }

    return count;
  }

  /**
   * 基于时间失效缓存
   * 
   * @param maxAge - 最大缓存时间（毫秒）
   * @returns 失效的缓存数量
   */
  invalidateByAge(maxAge: number): number {
    const now = Date.now();
    const keysToRemove: K[] = [];

    for (const [key, node] of this.cache) {
      // 检查是否过期，优先使用 CacheEntry 中的 cachedAt
      const cacheTime = (node.value as any).cachedAt || node.timestamp;
      if (now - cacheTime > maxAge) {
        keysToRemove.push(key);
      }
    }

    for (const key of keysToRemove) {
      this.delete(key);
    }

    return keysToRemove.length;
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear();
    this.head = null;
    this.tail = null;
    this.stats.currentSize = 0;
    this.stats.invalidations += this.stats.currentSize;
  }

  /**
   * 获取缓存统计信息
   * 
   * @returns 缓存统计信息
   */
  getStatistics(): CacheStatistics {
    return {
      ...this.stats,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0,
    };
  }

  /**
   * 获取缓存大小
   * 
   * @returns 当前缓存大小
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * 检查缓存中是否存在键
   * 
   * @param key - 缓存键
   * @returns 是否存在
   */
  has(key: K): boolean {
    return this.cache.has(key);
  }

  /**
   * 获取所有缓存键
   * 
   * @returns 缓存键数组
   */
  keys(): K[] {
    return Array.from(this.cache.keys());
  }

  /**
   * 获取所有缓存值
   * 
   * @returns 缓存值数组
   */
  values(): V[] {
    return Array.from(this.cache.values()).map(node => node.value);
  }

  /**
   * 重置统计信息
   */
  resetStatistics(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      invalidations: 0,
      currentSize: this.stats.currentSize,
      totalSize: this.stats.totalSize,
    };
  }

  /**
   * 添加节点到头部
   * 
   * @param node - 缓存节点
   */
  private addToHead(node: CacheNode<K, V>): void {
    node.prev = null;
    node.next = this.head;

    if (this.head) {
      this.head.prev = node;
    }

    this.head = node;

    if (!this.tail) {
      this.tail = node;
    }
  }

  /**
   * 移动节点到头部
   * 
   * @param node - 缓存节点
   */
  private moveToHead(node: CacheNode<K, V>): void {
    this.removeNode(node);
    this.addToHead(node);
  }

  /**
   * 移除节点
   * 
   * @param node - 缓存节点
   */
  private removeNode(node: CacheNode<K, V>): void {
    if (node.prev) {
      node.prev.next = node.next;
    } else {
      this.head = node.next;
    }

    if (node.next) {
      node.next.prev = node.prev;
    } else {
      this.tail = node.prev;
    }
  }

  /**
   * 移除尾部节点（最久未使用）
   */
  private removeTail(): void {
    if (!this.tail) {
      return;
    }

    this.cache.delete(this.tail.key);
    this.removeNode(this.tail);
    this.stats.currentSize--;
    this.stats.evictions++;
  }
}

/**
 * 缓存统计信息
 */
export interface CacheStatistics {
  /** 命中次数 */
  hits: number;
  /** 未命中次数 */
  misses: number;
  /** 驱逐次数 */
  evictions: number;
  /** 失效次数 */
  invalidations: number;
  /** 当前缓存大小 */
  currentSize: number;
  /** 总缓存大小（历史） */
  totalSize: number;
  /** 命中率 */
  hitRate?: number;
}

/**
 * 默认缓存实例
 */
export const defaultRenderCache = new RenderCache<string, CacheEntry>(100);

/**
 * 缓存条目
 */
export interface CacheEntry {
  /** 渲染的 HTML */
  html: string;
  /** 渲染元数据 */
  metadata: {
    /** 代码块数量 */
    codeBlocks: number;
    /** 数学表达式数量 */
    mathExpressions: number;
    /** 处理时间（毫秒） */
    processingTime: number;
  };
  /** 缓存时间戳 */
  cachedAt: number;
}

/**
 * 缓存配置
 */
export interface CacheConfig {
  /** 缓存容量 */
  capacity?: number;
  /** 是否启用缓存 */
  enabled?: boolean;
  /** 最大缓存时间（毫秒） */
  maxAge?: number;
  /** 是否启用统计 */
  enableStatistics?: boolean;
}

/**
 * 默认缓存配置
 */
export const DEFAULT_CACHE_CONFIG: CacheConfig = {
  capacity: 100,
  enabled: true,
  maxAge: 30 * 60 * 1000, // 30 分钟
  enableStatistics: true,
};

/**
 * 创建渲染缓存
 * 
 * @param config - 缓存配置
 * @returns 渲染缓存实例
 */
export function createRenderCache(config: CacheConfig = {}): RenderCache<string, CacheEntry> {
  const finalConfig = { ...DEFAULT_CACHE_CONFIG, ...config };

  if (!finalConfig.enabled) {
    // 返回一个禁用的缓存（容量为 0）
    return new RenderCache(0);
  }

  return new RenderCache(finalConfig.capacity);
}

/**
 * 缓存包装器 - 提供便捷的缓存操作
 */
export class CacheWrapper {
  /** 缓存实例 */
  private cache: RenderCache<string, CacheEntry>;
  /** 是否启用 */
  private enabled: boolean;
  /** 最大缓存时间 */
  private maxAge: number;

  /**
   * 构造函数
   * 
   * @param cache - 缓存实例
   * @param config - 缓存配置
   */
  constructor(
    cache: RenderCache<string, CacheEntry>,
    config: CacheConfig = {}
  ) {
    this.cache = cache;
    this.enabled = config.enabled ?? true;
    this.maxAge = config.maxAge ?? DEFAULT_CACHE_CONFIG.maxAge!;
  }

  /**
   * 获取缓存
   * 
   * @param filePath - 文件路径
   * @param options - 渲染选项
   * @returns 缓存条目或 undefined
   */
  get(filePath: string, options: Record<string, unknown> = {}): CacheEntry | undefined {
    if (!this.enabled) {
      return undefined;
    }

    const key = RenderCache.generateKey(filePath, options);
    const entry = this.cache.get(key);

    // 检查是否过期
    if (entry && Date.now() - entry.cachedAt > this.maxAge) {
      this.cache.delete(key);
      return undefined;
    }

    return entry;
  }

  /**
   * 设置缓存
   * 
   * @param filePath - 文件路径
   * @param html - 渲染的 HTML
   * @param metadata - 渲染元数据
   * @param fileMtime - 文件修改时间
   * @param options - 渲染选项
   */
  set(
    filePath: string,
    html: string,
    metadata: CacheEntry['metadata'],
    fileMtime: number,
    options: Record<string, unknown> = {}
  ): void {
    if (!this.enabled) {
      return;
    }

    const key = RenderCache.generateKey(filePath, options);
    const entry: CacheEntry = {
      html,
      metadata,
      cachedAt: Date.now(),
    };

    this.cache.set(key, entry, filePath, fileMtime);
  }

  /**
   * 失效文件缓存
   * 
   * @param filePath - 文件路径
   * @param currentMtime - 当前文件修改时间
   * @returns 失效的缓存数量
   */
  invalidate(filePath: string, currentMtime?: number): number {
    return this.cache.invalidateByFile(filePath, currentMtime);
  }

  /**
   * 失效过期缓存
   * 
   * @returns 失效的缓存数量
   */
  invalidateExpired(): number {
    return this.cache.invalidateByAge(this.maxAge);
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 获取统计信息
   * 
   * @returns 缓存统计信息
   */
  getStatistics(): CacheStatistics {
    return this.cache.getStatistics();
  }

  /**
   * 重置统计信息
   */
  resetStatistics(): void {
    this.cache.resetStatistics();
  }

  /**
   * 获取缓存大小
   * 
   * @returns 缓存大小
   */
  size(): number {
    return this.cache.size();
  }
}

/**
 * 默认缓存包装器
 */
export const defaultCacheWrapper = new CacheWrapper(defaultRenderCache, DEFAULT_CACHE_CONFIG);