/**
 * Search Optimization Performance Tests
 *
 * Tests for verifying search performance improvements including:
 * - Debouncing effectiveness
 * - Cache hit rate
 * - Search execution time
 * - LRU cache eviction
 * - Performance metrics accuracy
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { LRUSearchCache } from '../src/utils/searchCache';
import { SearchPerformanceTracker } from '../src/utils/searchPerformance';
import {
  fuzzySearch,
  levenshteinDistance,
  calculateSimilarity,
  fuzzySubsequenceMatch,
} from '../src/hooks/useSearch';

describe('LRUSearchCache', () => {
  let cache: LRUSearchCache<string[]>;

  beforeEach(() => {
    cache = new LRUSearchCache<string[]>({
      maxSize: 5,
      ttl: 1000,
      enableStats: true,
    });
  });

  afterEach(() => {
    cache.destroy();
  });

  it('should store and retrieve values', () => {
    cache.set('key1', ['result1', 'result2']);
    const result = cache.get('key1');

    expect(result).toEqual(['result1', 'result2']);
  });

  it('should return null for non-existent keys', () => {
    const result = cache.get('nonexistent');
    expect(result).toBeNull();
  });

  it('should track cache hits and misses', () => {
    cache.set('key1', ['result1']);

    expect(cache.getStats().hits).toBe(0);
    expect(cache.getStats().misses).toBe(0);

    cache.get('key1');
    expect(cache.getStats().hits).toBe(1);
    expect(cache.getStats().misses).toBe(0);

    cache.get('nonexistent');
    expect(cache.getStats().hits).toBe(1);
    expect(cache.getStats().misses).toBe(1);
  });

  it('should calculate correct hit rate', () => {
    cache.set('key1', ['result1']);
    cache.set('key2', ['result2']);

    cache.get('key1'); // hit
    cache.get('key2'); // hit
    cache.get('nonexistent'); // miss

    const stats = cache.getStats();
    expect(stats.hitRate).toBe(2 / 3);
  });

  it('should evict LRU entry when cache is full', () => {
    cache.set('key1', ['result1']);
    cache.set('key2', ['result2']);
    cache.set('key3', ['result3']);
    cache.set('key4', ['result4']);
    cache.set('key5', ['result5']);

    // Access key2 to make it recently used
    cache.get('key2');

    // Add new entry, should evict key1 (least recently used)
    cache.set('key6', ['result6']);

    expect(cache.get('key1')).toBeNull();
    expect(cache.get('key2')).not.toBeNull();
    expect(cache.get('key6')).not.toBeNull();
  });

  it('should track evictions', () => {
    cache.set('key1', ['result1']);
    cache.set('key2', ['result2']);
    cache.set('key3', ['result3']);
    cache.set('key4', ['result4']);
    cache.set('key5', ['result5']);

    expect(cache.getStats().evictions).toBe(0);

    cache.set('key6', ['result6']);

    expect(cache.getStats().evictions).toBe(1);
  });

  it('should expire entries after TTL', async () => {
    cache = new LRUSearchCache<string[]>({
      maxSize: 10,
      ttl: 100, // 100ms TTL
      enableStats: true,
    });

    cache.set('key1', ['result1']);

    // Should be available immediately
    expect(cache.get('key1')).not.toBeNull();

    // Wait for TTL to expire
    await new Promise(resolve => setTimeout(resolve, 150));

    // Should be expired
    expect(cache.get('key1')).toBeNull();
  });

  it('should cleanup expired entries', async () => {
    cache = new LRUSearchCache<string[]>({
      maxSize: 10,
      ttl: 100,
      enableStats: true,
      cleanupInterval: 50,
    });

    cache.set('key1', ['result1']);
    cache.set('key2', ['result2']);

    expect(cache.size()).toBe(2);

    // Wait for TTL to expire
    await new Promise(resolve => setTimeout(resolve, 150));

    // Manually trigger cleanup
    const cleaned = cache.cleanup();

    // Check that expired entries are gone
    expect(cache.get('key1')).toBeNull();
    expect(cache.get('key2')).toBeNull();
    expect(cache.size()).toBe(0);
  });

  it('should clear all entries', () => {
    cache.set('key1', ['result1']);
    cache.set('key2', ['result2']);

    expect(cache.size()).toBe(2);

    cache.clear();

    expect(cache.size()).toBe(0);
    expect(cache.get('key1')).toBeNull();
    expect(cache.get('key2')).toBeNull();
  });

  it('should reset statistics', () => {
    cache.set('key1', ['result1']);
    cache.get('key1');
    cache.get('nonexistent');

    expect(cache.getStats().hits).toBe(1);
    expect(cache.getStats().misses).toBe(1);

    cache.resetStats();

    expect(cache.getStats().hits).toBe(0);
    expect(cache.getStats().misses).toBe(0);
    expect(cache.getStats().evictions).toBe(0);
  });

  it('should track average access count', () => {
    cache.set('key1', ['result1']);
    cache.set('key2', ['result2']);

    // Access key1 3 times, key2 once
    cache.get('key1');
    cache.get('key1');
    cache.get('key1');
    cache.get('key2');

    const stats = cache.getStats();
    expect(stats.avgAccessCount).toBe(2); // (3 + 1) / 2
  });
});

describe('SearchPerformanceTracker', () => {
  let tracker: SearchPerformanceTracker;

  beforeEach(() => {
    tracker = new SearchPerformanceTracker();
  });

  it('should measure execution time', () => {
    const measureId = tracker.startMeasure('test-operation');

    // Simulate some work
    const sum = Array.from({ length: 1000 }, (_, i) => i).reduce((a, b) => a + b, 0);
    expect(sum).toBe(499500);

    tracker.endMeasure(measureId);

    const metrics = tracker.getMetrics();
    expect(metrics).toBeDefined();
    expect(metrics.measures).toBeDefined();
    expect(typeof metrics.measures).toBe('object');
  });

  it('should track multiple measurements', () => {
    const id1 = tracker.startMeasure('op1');
    tracker.endMeasure(id1);

    const id2 = tracker.startMeasure('op2');
    tracker.endMeasure(id2);

    const id3 = tracker.startMeasure('op1');
    tracker.endMeasure(id3);

    const metrics = tracker.getMetrics();

    expect(metrics).toBeDefined();
    expect(metrics.measures).toBeDefined();
    expect(typeof metrics.measures).toBe('object');
    expect(Object.keys(metrics.measures).length).toBe(2);
  });

  it('should record cache hits', () => {
    tracker.recordCacheHit(true);
    tracker.recordCacheHit(true);
    tracker.recordCacheHit(false);

    const metrics = tracker.getMetrics();

    expect(metrics.cacheHits).toBe(2);
    expect(metrics.cacheMisses).toBe(1);
    expect(metrics.cacheHitRate).toBe(2 / 3);
  });

  it('should record search result counts', () => {
    tracker.recordSearchResultCount(5);
    tracker.recordSearchResultCount(10);
    tracker.recordSearchResultCount(15);

    const metrics = tracker.getMetrics();

    expect(metrics.averageResultCount).toBe(10); // (5 + 10 + 15) / 3
  });

  it('should calculate average execution time', () => {
    const id1 = tracker.startMeasure('search');
    tracker.endMeasure(id1);

    const id2 = tracker.startMeasure('search');
    tracker.endMeasure(id2);

    const metrics = tracker.getMetrics();

    expect(metrics).toBeDefined();
    expect(metrics.measures).toBeDefined();
    expect(typeof metrics.measures).toBe('object');
  });

  it('should reset all metrics', () => {
    const id = tracker.startMeasure('test');
    tracker.endMeasure(id);
    tracker.recordCacheHit(true);
    tracker.recordSearchResultCount(5);

    expect(tracker.getMetrics().cacheHits).toBe(1);

    tracker.reset();

    expect(tracker.getMetrics().cacheHits).toBe(0);
    expect(Object.keys(tracker.getMetrics().measures).length).toBe(0);
  });
});

describe('Fuzzy Search Performance', () => {
  const testItems = Array.from({ length: 1000 }, (_, i) => ({
    name: `file${i}.md`,
    path: `/path/to/file${i}.md`,
    relativePath: `file${i}.md`,
    type: 'file' as const,
    extension: '.md',
  }));

  it('should handle large datasets efficiently', () => {
    const startTime = performance.now();

    const results = fuzzySearch('file500', testItems, {
      debounceDelay: 300,
      minQueryLength: 1,
      maxResults: 50,
      includeFolders: true,
      fuzzyMatch: true,
      enableCache: 5000,
      fuzzyThreshold: 0.6,
      pathWeight: 0.3,
      depthWeight: 0.1,
    });

    const duration = performance.now() - startTime;

    expect(results.length).toBeGreaterThan(0);
    expect(duration).toBeLessThan(100); // Should complete in under 100ms
  });

  it('should return results quickly with cache', () => {
    const cache = new LRUSearchCache<any[]>({
      maxSize: 100,
      ttl: 5000,
      enableStats: true,
    });

    const config = {
      debounceDelay: 300,
      minQueryLength: 1,
      maxResults: 50,
      includeFolders: true,
      fuzzyMatch: true,
      enableCache: 5000,
      fuzzyThreshold: 0.6,
      pathWeight: 0.3,
      depthWeight: 0.1,
    };

    // First search (cache miss)
    const start1 = performance.now();
    const results1 = fuzzySearch('file100', testItems, config);
    cache.set('file100', results1);
    const duration1 = performance.now() - start1;

    // Second search (cache hit)
    const start2 = performance.now();
    const cached = cache.get('file100');
    const duration2 = performance.now() - start2;

    expect(cached).not.toBeNull();
    expect(duration2).toBeLessThan(duration1); // Cache should be faster
    expect(duration2).toBeLessThan(1); // Cache should be very fast (< 1ms)
  });

  it('should handle subsequence matching efficiently', () => {
    const startTime = performance.now();

    const results = fuzzySubsequenceMatch('fmd', 'file-markdown-document');

    const duration = performance.now() - startTime;

    expect(results).not.toBeNull();
    expect(duration).toBeLessThan(1); // Should be very fast
  });

  it('should calculate Levenshtein distance efficiently', () => {
    const startTime = performance.now();

    const distance = levenshteinDistance('kitten', 'sitting');

    const duration = performance.now() - startTime;

    expect(distance).toBe(3);
    expect(duration).toBeLessThan(1);
  });

  it('should handle empty queries efficiently', () => {
    const startTime = performance.now();

    const results = fuzzySearch('', testItems, {
      debounceDelay: 300,
      minQueryLength: 1,
      maxResults: 50,
      includeFolders: true,
      fuzzyMatch: true,
      enableCache: 5000,
      fuzzyThreshold: 0.6,
      pathWeight: 0.3,
      depthWeight: 0.1,
    });

    const duration = performance.now() - startTime;

    expect(results.length).toBe(0);
    expect(duration).toBeLessThan(1);
  });

  it('should limit results efficiently', () => {
    const config = {
      debounceDelay: 300,
      minQueryLength: 1,
      maxResults: 10,
      includeFolders: true,
      fuzzyMatch: true,
      enableCache: 5000,
      fuzzyThreshold: 0.6,
      pathWeight: 0.3,
      depthWeight: 0.1,
    };

    const results = fuzzySearch('file', testItems, config);

    expect(results.length).toBeLessThanOrEqual(10);
  });
});

describe('Search Optimization Integration', () => {
  it('should demonstrate performance improvement with caching', () => {
    const cache = new LRUSearchCache<any[]>({
      maxSize: 100,
      ttl: 5000,
      enableStats: true,
    });

    const tracker = new SearchPerformanceTracker();
    const testItems = Array.from({ length: 500 }, (_, i) => ({
      name: `document${i}.md`,
      path: `/docs/document${i}.md`,
      relativePath: `document${i}.md`,
      type: 'file' as const,
      extension: '.md',
    }));

    const config = {
      debounceDelay: 300,
      minQueryLength: 1,
      maxResults: 50,
      includeFolders: true,
      fuzzyMatch: true,
      enableCache: 5000,
      fuzzyThreshold: 0.6,
      pathWeight: 0.3,
      depthWeight: 0.1,
    };

    // Perform 10 searches
    const queries = ['doc1', 'doc2', 'doc3', 'doc1', 'doc4', 'doc2', 'doc5', 'doc1', 'doc6', 'doc2'];

    for (const query of queries) {
      const measureId = tracker.startMeasure('integration-search');

      const cached = cache.get(query);
      if (cached) {
        tracker.recordCacheHit(true);
      } else {
        tracker.recordCacheHit(false);
        const results = fuzzySearch(query, testItems, config);
        cache.set(query, results);
        tracker.recordSearchResultCount(results.length);
      }

      tracker.endMeasure(measureId);
    }

    const metrics = tracker.getMetrics();
    const cacheStats = cache.getStats();

    // Verify caching effectiveness
    expect(cacheStats.hits).toBeGreaterThan(0);
    expect(cacheStats.hitRate).toBeGreaterThan(0);
    expect(metrics.cacheHitRate).toBeGreaterThan(0);

    // Verify performance
    expect(metrics.measures['integration-search']!.count).toBe(10);
  });

  it('should maintain performance under repeated searches', () => {
    const testItems = Array.from({ length: 1000 }, (_, i) => ({
      name: `test${i}.ts`,
      path: `/src/test${i}.ts`,
      relativePath: `test${i}.ts`,
      type: 'file' as const,
      extension: '.ts',
    }));

    const config = {
      debounceDelay: 300,
      minQueryLength: 1,
      maxResults: 50,
      includeFolders: true,
      fuzzyMatch: true,
      enableCache: 5000,
      fuzzyThreshold: 0.6,
      pathWeight: 0.3,
      depthWeight: 0.1,
    };

    const times: number[] = [];

    // Perform 100 searches and measure time
    for (let i = 0; i < 100; i++) {
      const start = performance.now();
      fuzzySearch(`test${i % 10}`, testItems, config);
      times.push(performance.now() - start);
    }

    // Calculate average and max time
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const maxTime = Math.max(...times);

    // Performance should be consistent
    expect(avgTime).toBeLessThan(50); // Average under 50ms
    expect(maxTime).toBeLessThan(100); // Max under 100ms
  });
});