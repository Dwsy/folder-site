/**
 * Enhanced Search Cache with LRU and Performance Tracking
 *
 * Features:
 * - LRU (Least Recently Used) cache eviction
 * - Performance metrics tracking
 * - TTL (Time To Live) support
 * - Cache hit rate statistics
 * - Automatic cleanup
 */

/**
 * Cache entry with metadata
 */
export interface CacheEntry<T> {
  /** Cached value */
  value: T;
  /** Timestamp when cached */
  timestamp: number;
  /** Last access timestamp */
  lastAccess: number;
  /** Access count */
  accessCount: number;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  /** Total cache hits */
  hits: number;
  /** Total cache misses */
  misses: number;
  /** Cache hit rate (0-1) */
  hitRate: number;
  /** Current cache size */
  size: number;
  /** Maximum cache size */
  maxSize: number;
  /** Total evictions */
  evictions: number;
  /** Average access count */
  avgAccessCount: number;
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  /** Maximum cache size */
  maxSize?: number;
  /** TTL in milliseconds (0 = no expiration) */
  ttl?: number;
  /** Enable statistics tracking */
  enableStats?: boolean;
  /** Cleanup interval in milliseconds */
  cleanupInterval?: number;
}

/**
 * LRU Search Cache
 */
export class LRUSearchCache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private maxSize: number;
  private ttl: number;
  private enableStats: boolean;
  private cleanupTimer?: NodeJS.Timeout;

  // Statistics
  private hits: number = 0;
  private misses: number = 0;
  private evictions: number = 0;

  constructor(config: CacheConfig = {}) {
    this.maxSize = config.maxSize ?? 100;
    this.ttl = config.ttl ?? 5000; // 5 seconds default
    this.enableStats = config.enableStats ?? true;

    // Start cleanup timer if TTL is enabled
    if (this.ttl > 0 && config.cleanupInterval) {
      this.startCleanup(config.cleanupInterval);
    }
  }

  /**
   * Get value from cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      if (this.enableStats) {
        this.misses++;
      }
      return null;
    }

    // Check TTL
    if (this.ttl > 0 && Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      if (this.enableStats) {
        this.misses++;
      }
      return null;
    }

    // Update access metadata (LRU)
    entry.lastAccess = Date.now();
    entry.accessCount++;

    if (this.enableStats) {
      this.hits++;
    }

    return entry.value;
  }

  /**
   * Set value in cache
   */
  set(key: string, value: T): void {
    // Check if we need to evict
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      lastAccess: Date.now(),
      accessCount: 0,
    });
  }

  /**
   * Check if key exists
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Check TTL
    if (this.ttl > 0 && Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete key from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    if (this.enableStats) {
      this.hits = 0;
      this.misses = 0;
      this.evictions = 0;
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const totalRequests = this.hits + this.misses;
    const hitRate = totalRequests > 0 ? this.hits / totalRequests : 0;

    let avgAccessCount = 0;
    if (this.cache.size > 0) {
      const totalAccessCount = Array.from(this.cache.values())
        .reduce((sum, entry) => sum + entry.accessCount, 0);
      avgAccessCount = totalAccessCount / this.cache.size;
    }

    return {
      hits: this.hits,
      misses: this.misses,
      hitRate,
      size: this.cache.size,
      maxSize: this.maxSize,
      evictions: this.evictions,
      avgAccessCount,
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
  }

  /**
   * Get current cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Clean up expired entries
   */
  cleanup(): number {
    if (this.ttl <= 0) return 0;

    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let lruKey: string | null = null;
    let lruTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccess < lruTime) {
        lruTime = entry.lastAccess;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
      if (this.enableStats) {
        this.evictions++;
      }
    }
  }

  /**
   * Start periodic cleanup
   */
  private startCleanup(interval: number): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, interval);
  }

  /**
   * Stop periodic cleanup
   */
  stopCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }

  /**
   * Destroy cache and cleanup resources
   */
  destroy(): void {
    this.stopCleanup();
    this.clear();
  }
}

/**
 * Performance-optimized search cache factory
 */
export function createSearchCache<T>(config?: CacheConfig): LRUSearchCache<T> {
  return new LRUSearchCache<T>({
    maxSize: 100,
    ttl: 5000,
    enableStats: true,
    cleanupInterval: 10000,
    ...config,
  });
}