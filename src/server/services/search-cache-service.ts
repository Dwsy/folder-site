/**
 * Search Cache Service
 *
 * 为搜索 v2 提供缓存优化
 */

import { LRUCache } from 'lru-cache';

/**
 * 缓存条目
 */
interface CacheEntry {
  results: any;
  timestamp: number;
}

/**
 * 搜索缓存服务
 */
class SearchCacheService {
  private cache: LRUCache<string, CacheEntry>;
  private maxSize: number;
  private ttl: number;

  constructor(maxSize: number = 200, ttl: number = 60000) {
    this.maxSize = maxSize;
    this.ttl = ttl;
    this.cache = new LRUCache<string, CacheEntry>({
      max: maxSize,
      ttl: ttl,
    });
  }

  /**
   * 获取缓存结果
   */
  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // 检查是否过期
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.results;
  }

  /**
   * 设置缓存结果
   */
  set(key: string, results: any): void {
    this.cache.set(key, {
      results,
      timestamp: Date.now(),
    });
  }

  /**
   * 删除缓存条目
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 获取缓存统计
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      ttl: this.ttl,
      calculatedSize: this.cache.calculatedSize,
    };
  }

  /**
   * 按前缀删除缓存
   */
  deletePrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 清理过期条目
   */
  purge(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// 导出单例实例
export const searchCacheService = new SearchCacheService();
export default searchCacheService;