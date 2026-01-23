/**
 * 搜索性能指标追踪工具
 *
 * 用于追踪和记录搜索操作的性能指标
 */

/**
 * 性能指标接口
 */
export interface SearchMetrics {
  /** 搜索查询 */
  query: string;
  /** 搜索开始时间戳 */
  startTime: number;
  /** 搜索结束时间戳 */
  endTime: number;
  /** 搜索耗时（毫秒） */
  duration: number;
  /** 结果数量 */
  resultCount: number;
  /** 是否使用缓存 */
  fromCache: boolean;
  /** 缓存命中时间（毫秒） */
  cacheLookupTime?: number;
  /** 搜索执行时间（毫秒） */
  searchExecutionTime?: number;
  /** 缓存保存时间（毫秒） */
  cacheSaveTime?: number;
}

/**
 * 缓存统计
 */
export interface CacheStats {
  /** 总请求数 */
  totalRequests: number;
  /** 缓存命中数 */
  hits: number;
  /** 缓存未命中数 */
  misses: number;
  /** 缓存命中率（0-1） */
  hitRate: number;
  /** 平均缓存查找时间（毫秒） */
  avgLookupTime: number;
  /** 当前缓存大小 */
  currentSize: number;
  /** 最大缓存大小 */
  maxSize: number;
}

/**
 * 搜索性能统计
 */
export interface SearchPerformanceStats {
  /** 总搜索次数 */
  totalSearches: number;
  /** 缓存命中搜索次数 */
  cachedSearches: number;
  /** 实际执行搜索次数 */
  executedSearches: number;
  /** 平均搜索耗时（毫秒） */
  avgDuration: number;
  /** 最小搜索耗时（毫秒） */
  minDuration: number;
  /** 最大搜索耗时（毫秒） */
  maxDuration: number;
  /** 平均结果数量 */
  avgResultCount: number;
  /** 缓存统计 */
  cacheStats: CacheStats;
  /** 搜索历史（最近100条） */
  searchHistory: SearchMetrics[];
  /** 缓存命中数（简化版） */
  cacheHits: number;
  /** 缓存未命中数（简化版） */
  cacheMisses: number;
  /** 缓存命中率（简化版） */
  cacheHitRate: number;
  /** 性能测量数据 */
  measures: Record<string, PerformanceMeasure>;
}

/**
 * 性能测量数据
 */
export interface PerformanceMeasure {
  /** 测量次数 */
  count: number;
  /** 总耗时（毫秒） */
  totalTime: number;
  /** 平均耗时（毫秒） */
  averageTime: number;
  /** 最小耗时（毫秒） */
  minTime: number;
  /** 最大耗时（毫秒） */
  maxTime: number;
}

/**
 * 性能计时器
 */
export class PerformanceTimer {
  private startTime: number;

  constructor() {
    this.startTime = performance.now();
  }

  /**
   * 获取经过的时间（毫秒）
   */
  elapsed(): number {
    return performance.now() - this.startTime;
  }

  /**
   * 重置计时器
   */
  reset(): void {
    this.startTime = performance.now();
  }
}

/**
 * 搜索性能追踪器
 */
export class SearchPerformanceTracker {
  private metrics: SearchMetrics[] = [];
  private cacheStats: CacheStats = {
    totalRequests: 0,
    hits: 0,
    misses: 0,
    hitRate: 0,
    avgLookupTime: 0,
    currentSize: 0,
    maxSize: 100,
  };
  private cacheLookupTimes: number[] = [];
  private measures: Map<string, PerformanceMeasure> = new Map();
  private activeMeasures: Map<string, { name: string; startTime: number }> = new Map();
  private cacheHits: number = 0;
  private cacheMisses: number = 0;
  private resultCounts: number[] = [];

  /**
   * 开始测量
   */
  startMeasure(name: string): string {
    const id = `${name}-${Date.now()}-${Math.random()}`;
    this.activeMeasures.set(id, { name, startTime: performance.now() });
    return id;
  }

  /**
   * 结束测量
   */
  endMeasure(id: string): void {
    const active = this.activeMeasures.get(id);
    if (!active) return;

    const duration = performance.now() - active.startTime;
    this.activeMeasures.delete(id);

    const existing = this.measures.get(active.name);
    if (existing) {
      existing.count++;
      existing.totalTime += duration;
      existing.minTime = Math.min(existing.minTime, duration);
      existing.maxTime = Math.max(existing.maxTime, duration);
      existing.averageTime = existing.totalTime / existing.count;
    } else {
      this.measures.set(active.name, {
        count: 1,
        totalTime: duration,
        averageTime: duration,
        minTime: duration,
        maxTime: duration,
      });
    }
  }

  /**
   * 记录缓存命中
   */
  recordCacheHit(hit: boolean): void {
    if (hit) {
      this.cacheHits++;
    } else {
      this.cacheMisses++;
    }
  }

  /**
   * 记录搜索结果数量
   */
  recordSearchResultCount(count: number): void {
    this.resultCounts.push(count);
    if (this.resultCounts.length > 100) {
      this.resultCounts.shift();
    }
  }

  /**
   * 获取性能指标
   */
  getMetrics(): SearchPerformanceStats {
    const durations = this.metrics.map((m) => m.duration);
    const resultCounts = this.metrics.map((m) => m.resultCount);

    const totalRequests = this.cacheHits + this.cacheMisses;
    const hitRate = totalRequests > 0 ? this.cacheHits / totalRequests : 0;

    return {
      totalSearches: this.metrics.length,
      cachedSearches: this.metrics.filter((m) => m.fromCache).length,
      executedSearches: this.metrics.filter((m) => !m.fromCache).length,
      avgDuration: durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
      minDuration: durations.length > 0 ? Math.min(...durations) : 0,
      maxDuration: durations.length > 0 ? Math.max(...durations) : 0,
      avgResultCount: resultCounts.length > 0 ? resultCounts.reduce((a, b) => a + b, 0) / resultCounts.length : 0,
      cacheStats: { ...this.cacheStats },
      searchHistory: [...this.metrics],
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses,
      cacheHitRate: hitRate,
      measures: Object.fromEntries(this.measures),
    };
  }

  /**
   * 记录搜索指标
   */
  recordMetrics(metrics: SearchMetrics): void {
    this.metrics.push(metrics);

    // 只保留最近100条记录
    if (this.metrics.length > 100) {
      this.metrics.shift();
    }

    // 更新缓存统计
    if (metrics.fromCache) {
      this.cacheStats.hits++;
      if (metrics.cacheLookupTime) {
        this.cacheLookupTimes.push(metrics.cacheLookupTime);
        if (this.cacheLookupTimes.length > 100) {
          this.cacheLookupTimes.shift();
        }
      }
    } else {
      this.cacheStats.misses++;
    }
    this.cacheStats.totalRequests++;
    this.cacheStats.hitRate = this.cacheStats.hits / this.cacheStats.totalRequests;
    this.cacheStats.avgLookupTime =
      this.cacheLookupTimes.reduce((sum, time) => sum + time, 0) / this.cacheLookupTimes.length;
  }

  /**
   * 更新缓存大小
   */
  updateCacheSize(size: number): void {
    this.cacheStats.currentSize = size;
  }

  /**
   * 获取性能统计
   */
  getStats(): SearchPerformanceStats {
    const durations = this.metrics.map((m) => m.duration);
    const resultCounts = this.metrics.map((m) => m.resultCount);

    return {
      totalSearches: this.metrics.length,
      cachedSearches: this.metrics.filter((m) => m.fromCache).length,
      executedSearches: this.metrics.filter((m) => !m.fromCache).length,
      avgDuration: durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
      minDuration: durations.length > 0 ? Math.min(...durations) : 0,
      maxDuration: durations.length > 0 ? Math.max(...durations) : 0,
      avgResultCount: resultCounts.length > 0 ? resultCounts.reduce((a, b) => a + b, 0) / resultCounts.length : 0,
      cacheStats: { ...this.cacheStats },
      searchHistory: [...this.metrics],
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses,
      cacheHitRate: (this.cacheHits + this.cacheMisses) > 0
        ? this.cacheHits / (this.cacheHits + this.cacheMisses)
        : 0,
      measures: Object.fromEntries(this.measures),
    };
  }

  /**
   * 重置统计
   */
  reset(): void {
    this.metrics = [];
    this.cacheStats = {
      totalRequests: 0,
      hits: 0,
      misses: 0,
      hitRate: 0,
      avgLookupTime: 0,
      currentSize: 0,
      maxSize: 100,
    };
    this.cacheLookupTimes = [];
    this.measures.clear();
    this.activeMeasures.clear();
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.resultCounts = [];
  }

  /**
   * 获取搜索历史
   */
  getHistory(): SearchMetrics[] {
    return [...this.metrics];
  }

  /**
   * 导出统计为 JSON
   */
  exportStats(): string {
    return JSON.stringify(this.getStats(), null, 2);
  }
}

/**
 * 全局性能追踪器实例
 */
export const globalPerformanceTracker = new SearchPerformanceTracker();

/**
 * 创建搜索指标记录器
 */
export function createMetricsRecorder(query: string) {
  const timer = new PerformanceTimer();
  const startTime = Date.now();

  return {
    timer,
    startTime,

    /**
     * 记录缓存命中
     */
    recordCacheHit(resultCount: number): SearchMetrics {
      const metrics: SearchMetrics = {
        query,
        startTime,
        endTime: Date.now(),
        duration: timer.elapsed(),
        resultCount,
        fromCache: true,
        cacheLookupTime: timer.elapsed(),
      };
      globalPerformanceTracker.recordMetrics(metrics);
      return metrics;
    },

    /**
     * 记录缓存未命中和搜索执行
     */
    recordSearchExecution(resultCount: number, searchTime?: number): SearchMetrics {
      const metrics: SearchMetrics = {
        query,
        startTime,
        endTime: Date.now(),
        duration: timer.elapsed(),
        resultCount,
        fromCache: false,
        searchExecutionTime: searchTime || timer.elapsed(),
      };
      globalPerformanceTracker.recordMetrics(metrics);
      return metrics;
    },

    /**
     * 记录缓存保存时间
     */
    recordCacheSave(metrics: SearchMetrics, cacheSaveTime: number): SearchMetrics {
      return {
        ...metrics,
        cacheSaveTime,
      };
    },
  };
}

/**
 * 获取性能统计摘要（用于显示）
 */
export function getPerformanceSummary(): string {
  const stats = globalPerformanceTracker.getStats();

  if (stats.totalSearches === 0) {
    return 'No search performance data available.';
  }

  const lines = [
    'Search Performance Summary:',
    `  Total Searches: ${stats.totalSearches}`,
    `  Cached Searches: ${stats.cachedSearches} (${((stats.cachedSearches / stats.totalSearches) * 100).toFixed(1)}%)`,
    `  Executed Searches: ${stats.executedSearches}`,
    `  Average Duration: ${stats.avgDuration.toFixed(2)}ms`,
    `  Min Duration: ${stats.minDuration.toFixed(2)}ms`,
    `  Max Duration: ${stats.maxDuration.toFixed(2)}ms`,
    `  Average Results: ${stats.avgResultCount.toFixed(1)}`,
    `  Cache Hit Rate: ${(stats.cacheStats.hitRate * 100).toFixed(1)}%`,
    `  Cache Size: ${stats.cacheStats.currentSize}/${stats.cacheStats.maxSize}`,
  ];

  return lines.join('\n');
}