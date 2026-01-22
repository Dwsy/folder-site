import { describe, it, expect, beforeEach } from 'bun:test';
import {
  RenderCache,
  defaultRenderCache,
  createRenderCache,
  CacheWrapper,
  defaultCacheWrapper,
  type CacheEntry,
  type CacheConfig,
  DEFAULT_CACHE_CONFIG,
} from '../src/server/lib/render-cache';

describe('RenderCache', () => {
  let cache: RenderCache<string, CacheEntry>;

  beforeEach(() => {
    cache = new RenderCache<string, CacheEntry>(3);
  });

  describe('constructor', () => {
    it('should create a cache with default capacity', () => {
      const defaultCache = new RenderCache<string, CacheEntry>();
      expect(defaultCache.size()).toBe(0);
    });

    it('should create a cache with custom capacity', () => {
      const customCache = new RenderCache<string, CacheEntry>(10);
      expect(customCache.size()).toBe(0);
    });
  });

  describe('generateKey', () => {
    it('should generate consistent keys for same input', () => {
      const key1 = RenderCache.generateKey('/path/to/file.md', { gfm: true });
      const key2 = RenderCache.generateKey('/path/to/file.md', { gfm: true });
      expect(key1).toBe(key2);
    });

    it('should generate different keys for different file paths', () => {
      const key1 = RenderCache.generateKey('/path/to/file1.md', {});
      const key2 = RenderCache.generateKey('/path/to/file2.md', {});
      expect(key1).not.toBe(key2);
    });

    it('should generate different keys for different options', () => {
      const key1 = RenderCache.generateKey('/path/to/file.md', { gfm: true });
      const key2 = RenderCache.generateKey('/path/to/file.md', { gfm: false });
      expect(key1).not.toBe(key2);
    });

    it('should generate different keys for different option values', () => {
      const key1 = RenderCache.generateKey('/path/to/file.md', { theme: 'dark' });
      const key2 = RenderCache.generateKey('/path/to/file.md', { theme: 'light' });
      expect(key1).not.toBe(key2);
    });
  });

  describe('get and set', () => {
    it('should set and get values', () => {
      const key = 'test-key';
      const entry: CacheEntry = {
        html: '<h1>Test</h1>',
        metadata: {
          codeBlocks: 0,
          mathExpressions: 0,
          processingTime: 10,
        },
        cachedAt: Date.now(),
      };

      cache.set(key, entry, '/path/to/file.md', 1234567890);
      const result = cache.get(key);

      expect(result).toEqual(entry);
    });

    it('should return undefined for non-existent keys', () => {
      const result = cache.get('non-existent');
      expect(result).toBeUndefined();
    });

    it('should update existing keys', () => {
      const key = 'test-key';
      const entry1: CacheEntry = {
        html: '<h1>Test 1</h1>',
        metadata: {
          codeBlocks: 1,
          mathExpressions: 0,
          processingTime: 10,
        },
        cachedAt: Date.now(),
      };

      const entry2: CacheEntry = {
        html: '<h1>Test 2</h1>',
        metadata: {
          codeBlocks: 2,
          mathExpressions: 1,
          processingTime: 20,
        },
        cachedAt: Date.now(),
      };

      cache.set(key, entry1, '/path/to/file.md', 1234567890);
      cache.set(key, entry2, '/path/to/file.md', 1234567891);

      const result = cache.get(key);
      expect(result).toEqual(entry2);
      expect(cache.size()).toBe(1);
    });

    it('should track hits and misses', () => {
      const key = 'test-key';
      const entry: CacheEntry = {
        html: '<h1>Test</h1>',
        metadata: {
          codeBlocks: 0,
          mathExpressions: 0,
          processingTime: 10,
        },
        cachedAt: Date.now(),
      };

      cache.set(key, entry, '/path/to/file.md', 1234567890);

      // Miss
      cache.get('non-existent');
      let stats = cache.getStatistics();
      expect(stats.misses).toBe(1);
      expect(stats.hits).toBe(0);

      // Hit
      cache.get(key);
      stats = cache.getStatistics();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);

      // Another hit
      cache.get(key);
      stats = cache.getStatistics();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
    });
  });

  describe('LRU eviction', () => {
    it('should evict least recently used items when capacity is exceeded', () => {
      const entry: CacheEntry = {
        html: '<h1>Test</h1>',
        metadata: {
          codeBlocks: 0,
          mathExpressions: 0,
          processingTime: 10,
        },
        cachedAt: Date.now(),
      };

      // Fill cache to capacity
      cache.set('key1', entry, '/file1.md', 1);
      cache.set('key2', entry, '/file2.md', 2);
      cache.set('key3', entry, '/file3.md', 3);

      expect(cache.size()).toBe(3);

      // Add one more item, should evict key1 (least recently used)
      cache.set('key4', entry, '/file4.md', 4);

      expect(cache.size()).toBe(3);
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBeDefined();
      expect(cache.get('key3')).toBeDefined();
      expect(cache.get('key4')).toBeDefined();
    });

    it('should update LRU order on access', () => {
      const entry: CacheEntry = {
        html: '<h1>Test</h1>',
        metadata: {
          codeBlocks: 0,
          mathExpressions: 0,
          processingTime: 10,
        },
        cachedAt: Date.now(),
      };

      cache.set('key1', entry, '/file1.md', 1);
      cache.set('key2', entry, '/file2.md', 2);
      cache.set('key3', entry, '/file3.md', 3);

      // Access key1 to make it recently used
      cache.get('key1');

      // Add new item, should evict key2 (now least recently used)
      cache.set('key4', entry, '/file4.md', 4);

      expect(cache.get('key1')).toBeDefined();
      expect(cache.get('key2')).toBeUndefined();
      expect(cache.get('key3')).toBeDefined();
      expect(cache.get('key4')).toBeDefined();
    });

    it('should track eviction count', () => {
      const entry: CacheEntry = {
        html: '<h1>Test</h1>',
        metadata: {
          codeBlocks: 0,
          mathExpressions: 0,
          processingTime: 10,
        },
        cachedAt: Date.now(),
      };

      cache.set('key1', entry, '/file1.md', 1);
      cache.set('key2', entry, '/file2.md', 2);
      cache.set('key3', entry, '/file3.md', 3);
      cache.set('key4', entry, '/file4.md', 4);

      const stats = cache.getStatistics();
      expect(stats.evictions).toBe(1);
    });
  });

  describe('delete', () => {
    it('should delete existing keys', () => {
      const key = 'test-key';
      const entry: CacheEntry = {
        html: '<h1>Test</h1>',
        metadata: {
          codeBlocks: 0,
          mathExpressions: 0,
          processingTime: 10,
        },
        cachedAt: Date.now(),
      };

      cache.set(key, entry, '/path/to/file.md', 1234567890);
      expect(cache.size()).toBe(1);

      const result = cache.delete(key);
      expect(result).toBe(true);
      expect(cache.size()).toBe(0);
      expect(cache.get(key)).toBeUndefined();
    });

    it('should return false for non-existent keys', () => {
      const result = cache.delete('non-existent');
      expect(result).toBe(false);
    });

    it('should track invalidations', () => {
      const key = 'test-key';
      const entry: CacheEntry = {
        html: '<h1>Test</h1>',
        metadata: {
          codeBlocks: 0,
          mathExpressions: 0,
          processingTime: 10,
        },
        cachedAt: Date.now(),
      };

      cache.set(key, entry, '/path/to/file.md', 1234567890);
      cache.delete(key);

      const stats = cache.getStatistics();
      expect(stats.invalidations).toBe(1);
    });
  });

  describe('invalidateByFile', () => {
    it('should invalidate cache entries by file path', () => {
      const entry: CacheEntry = {
        html: '<h1>Test</h1>',
        metadata: {
          codeBlocks: 0,
          mathExpressions: 0,
          processingTime: 10,
        },
        cachedAt: Date.now(),
      };

      cache.set('key1', entry, '/path/to/file1.md', 1);
      cache.set('key2', entry, '/path/to/file2.md', 2);
      cache.set('key3', entry, '/path/to/file1.md', 3, { gfm: true }); // Different options, same file

      expect(cache.size()).toBe(3);

      const count = cache.invalidateByFile('/path/to/file1.md');

      expect(count).toBe(2);
      expect(cache.size()).toBe(1);
      expect(cache.get('key2')).toBeDefined();
    });

    it('should not invalidate if file modification time matches', () => {
      const entry: CacheEntry = {
        html: '<h1>Test</h1>',
        metadata: {
          codeBlocks: 0,
          mathExpressions: 0,
          processingTime: 10,
        },
        cachedAt: Date.now(),
      };

      cache.set('key1', entry, '/path/to/file.md', 1234567890);

      // Invalidate with same mtime, should not delete
      const count = cache.invalidateByFile('/path/to/file.md', 1234567890);

      expect(count).toBe(0);
      expect(cache.size()).toBe(1);
    });

    it('should return 0 for non-existent file', () => {
      const count = cache.invalidateByFile('/non/existent/file.md');
      expect(count).toBe(0);
    });
  });

  describe('invalidateByAge', () => {
    it('should invalidate cache entries older than max age', () => {
      const entry: CacheEntry = {
        html: '<h1>Test</h1>',
        metadata: {
          codeBlocks: 0,
          mathExpressions: 0,
          processingTime: 10,
        },
        cachedAt: Date.now() - 2000, // 2 seconds ago
      };

      cache.set('key1', entry, '/file1.md', 1);

      // Add a fresh entry
      const freshEntry: CacheEntry = {
        ...entry,
        cachedAt: Date.now(),
      };
      cache.set('key2', freshEntry, '/file2.md', 2);

      // Invalidate entries older than 1 second
      const count = cache.invalidateByAge(1000);

      expect(count).toBe(1);
      expect(cache.size()).toBe(1);
      expect(cache.get('key2')).toBeDefined();
    });

    it('should invalidate all entries if max age is 0', () => {
      const entry: CacheEntry = {
        html: '<h1>Test</h1>',
        metadata: {
          codeBlocks: 0,
          mathExpressions: 0,
          processingTime: 10,
        },
        cachedAt: Date.now() - 1, // 1ms ago to ensure it's > 0
      };

      cache.set('key1', entry, '/file1.md', 1);
      cache.set('key2', entry, '/file2.md', 2);

      const count = cache.invalidateByAge(0);

      expect(count).toBe(2);
      expect(cache.size()).toBe(0);
    });
  });

  describe('clear', () => {
    it('should clear all cache entries', () => {
      const entry: CacheEntry = {
        html: '<h1>Test</h1>',
        metadata: {
          codeBlocks: 0,
          mathExpressions: 0,
          processingTime: 10,
        },
        cachedAt: Date.now(),
      };

      cache.set('key1', entry, '/file1.md', 1);
      cache.set('key2', entry, '/file2.md', 2);
      cache.set('key3', entry, '/file3.md', 3);

      expect(cache.size()).toBe(3);

      cache.clear();

      expect(cache.size()).toBe(0);
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBeUndefined();
      expect(cache.get('key3')).toBeUndefined();
    });

    it('should reset current size in statistics', () => {
      const entry: CacheEntry = {
        html: '<h1>Test</h1>',
        metadata: {
          codeBlocks: 0,
          mathExpressions: 0,
          processingTime: 10,
        },
        cachedAt: Date.now(),
      };

      cache.set('key1', entry, '/file1.md', 1);
      cache.set('key2', entry, '/file2.md', 2);

      cache.clear();

      const stats = cache.getStatistics();
      expect(stats.currentSize).toBe(0);
    });
  });

  describe('statistics', () => {
    it('should provide accurate statistics', () => {
      const entry: CacheEntry = {
        html: '<h1>Test</h1>',
        metadata: {
          codeBlocks: 0,
          mathExpressions: 0,
          processingTime: 10,
        },
        cachedAt: Date.now(),
      };

      cache.set('key1', entry, '/file1.md', 1);
      cache.set('key2', entry, '/file2.md', 2);

      cache.get('key1'); // hit
      cache.get('key3'); // miss
      cache.get('key1'); // hit

      const stats = cache.getStatistics();

      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
      expect(stats.currentSize).toBe(2);
      expect(stats.totalSize).toBe(2);
      expect(stats.hitRate).toBe(2 / 3);
    });

    it('should calculate hit rate correctly', () => {
      const entry: CacheEntry = {
        html: '<h1>Test</h1>',
        metadata: {
          codeBlocks: 0,
          mathExpressions: 0,
          processingTime: 10,
        },
        cachedAt: Date.now(),
      };

      cache.set('key1', entry, '/file1.md', 1);

      cache.get('key1'); // hit
      cache.get('key2'); // miss
      cache.get('key1'); // hit
      cache.get('key3'); // miss

      const stats = cache.getStatistics();
      expect(stats.hitRate).toBe(0.5);
    });

    it('should return 0 hit rate when no hits', () => {
      cache.get('non-existent');

      const stats = cache.getStatistics();
      expect(stats.hitRate).toBe(0);
    });

    it('should return 1 hit rate when no misses', () => {
      const entry: CacheEntry = {
        html: '<h1>Test</h1>',
        metadata: {
          codeBlocks: 0,
          mathExpressions: 0,
          processingTime: 10,
        },
        cachedAt: Date.now(),
      };

      cache.set('key1', entry, '/file1.md', 1);
      cache.get('key1');

      const stats = cache.getStatistics();
      expect(stats.hitRate).toBe(1);
    });

    it('should reset statistics', () => {
      const entry: CacheEntry = {
        html: '<h1>Test</h1>',
        metadata: {
          codeBlocks: 0,
          mathExpressions: 0,
          processingTime: 10,
        },
        cachedAt: Date.now(),
      };

      cache.set('key1', entry, '/file1.md', 1);
      cache.get('key1');
      cache.get('key2');

      cache.resetStatistics();

      const stats = cache.getStatistics();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.evictions).toBe(0);
      expect(stats.invalidations).toBe(0);
      expect(stats.currentSize).toBe(1); // Should preserve current size
    });
  });

  describe('has', () => {
    it('should return true for existing keys', () => {
      const key = 'test-key';
      const entry: CacheEntry = {
        html: '<h1>Test</h1>',
        metadata: {
          codeBlocks: 0,
          mathExpressions: 0,
          processingTime: 10,
        },
        cachedAt: Date.now(),
      };

      cache.set(key, entry, '/path/to/file.md', 1234567890);
      expect(cache.has(key)).toBe(true);
    });

    it('should return false for non-existent keys', () => {
      expect(cache.has('non-existent')).toBe(false);
    });
  });

  describe('keys and values', () => {
    it('should return all keys', () => {
      const entry: CacheEntry = {
        html: '<h1>Test</h1>',
        metadata: {
          codeBlocks: 0,
          mathExpressions: 0,
          processingTime: 10,
        },
        cachedAt: Date.now(),
      };

      cache.set('key1', entry, '/file1.md', 1);
      cache.set('key2', entry, '/file2.md', 2);
      cache.set('key3', entry, '/file3.md', 3);

      const keys = cache.keys();
      expect(keys).toHaveLength(3);
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
      expect(keys).toContain('key3');
    });

    it('should return all values', () => {
      const entry1: CacheEntry = {
        html: '<h1>Test 1</h1>',
        metadata: {
          codeBlocks: 1,
          mathExpressions: 0,
          processingTime: 10,
        },
        cachedAt: Date.now(),
      };

      const entry2: CacheEntry = {
        html: '<h1>Test 2</h1>',
        metadata: {
          codeBlocks: 2,
          mathExpressions: 1,
          processingTime: 20,
        },
        cachedAt: Date.now(),
      };

      cache.set('key1', entry1, '/file1.md', 1);
      cache.set('key2', entry2, '/file2.md', 2);

      const values = cache.values();
      expect(values).toHaveLength(2);
      expect(values).toContainEqual(entry1);
      expect(values).toContainEqual(entry2);
    });
  });
});

describe('CacheWrapper', () => {
  let cache: RenderCache<string, CacheEntry>;
  let wrapper: CacheWrapper;

  beforeEach(() => {
    cache = new RenderCache<string, CacheEntry>(10);
    wrapper = new CacheWrapper(cache, {
      enabled: true,
      maxAge: 1000, // 1 second
    });
  });

  describe('get and set', () => {
    it('should get and set cache entries', () => {
      const filePath = '/path/to/file.md';
      const options = { gfm: true };

      wrapper.set(
        filePath,
        '<h1>Test</h1>',
        {
          codeBlocks: 0,
          mathExpressions: 0,
          processingTime: 10,
        },
        1234567890,
        options
      );

      const entry = wrapper.get(filePath, options);

      expect(entry).toBeDefined();
      expect(entry?.html).toBe('<h1>Test</h1>');
    });

    it('should return undefined when caching is disabled', () => {
      const disabledWrapper = new CacheWrapper(cache, { enabled: false });

      const entry = disabledWrapper.get('/path/to/file.md', {});

      expect(entry).toBeUndefined();
    });

    it('should not set when caching is disabled', () => {
      const disabledWrapper = new CacheWrapper(cache, { enabled: false });

      disabledWrapper.set(
        '/path/to/file.md',
        '<h1>Test</h1>',
        {
          codeBlocks: 0,
          mathExpressions: 0,
          processingTime: 10,
        },
        1234567890
      );

      expect(cache.size()).toBe(0);
    });

    it('should return undefined for expired entries', async () => {
      const filePath = '/path/to/file.md';

      wrapper.set(
        filePath,
        '<h1>Test</h1>',
        {
          codeBlocks: 0,
          mathExpressions: 0,
          processingTime: 10,
        },
        1234567890
      );

      // Wait for entry to expire
      await new Promise(resolve => setTimeout(resolve, 1100));

      const entry = wrapper.get(filePath);
      expect(entry).toBeUndefined();
      expect(cache.size()).toBe(0);
    });
  });

  describe('invalidate', () => {
    it('should invalidate cache for a specific file', () => {
      const entry: CacheEntry = {
        html: '<h1>Test</h1>',
        metadata: {
          codeBlocks: 0,
          mathExpressions: 0,
          processingTime: 10,
        },
        cachedAt: Date.now(),
      };

      cache.set(RenderCache.generateKey('/file1.md', {}), entry, '/file1.md', 1);
      cache.set(RenderCache.generateKey('/file2.md', {}), entry, '/file2.md', 2);

      expect(cache.size()).toBe(2);

      const count = wrapper.invalidate('/file1.md');

      expect(count).toBe(1);
      expect(cache.size()).toBe(1);
    });

    it('should respect file modification time', () => {
      const entry: CacheEntry = {
        html: '<h1>Test</h1>',
        metadata: {
          codeBlocks: 0,
          mathExpressions: 0,
          processingTime: 10,
        },
        cachedAt: Date.now(),
      };

      cache.set(RenderCache.generateKey('/file.md', {}), entry, '/file.md', 1234567890);

      const count = wrapper.invalidate('/file.md', 1234567890);

      expect(count).toBe(0);
      expect(cache.size()).toBe(1);
    });
  });

  describe('invalidateExpired', () => {
    it('should invalidate expired entries', () => {
      const entry: CacheEntry = {
        html: '<h1>Test</h1>',
        metadata: {
          codeBlocks: 0,
          mathExpressions: 0,
          processingTime: 10,
        },
        cachedAt: Date.now() - 2000,
      };

      cache.set(RenderCache.generateKey('/file1.md', {}), entry, '/file1.md', 1);

      const freshEntry: CacheEntry = {
        ...entry,
        cachedAt: Date.now(),
      };
      cache.set(RenderCache.generateKey('/file2.md', {}), freshEntry, '/file2.md', 2);

      const count = wrapper.invalidateExpired();

      expect(count).toBe(1);
      expect(cache.size()).toBe(1);
    });
  });

  describe('clear', () => {
    it('should clear all cache', () => {
      const entry: CacheEntry = {
        html: '<h1>Test</h1>',
        metadata: {
          codeBlocks: 0,
          mathExpressions: 0,
          processingTime: 10,
        },
        cachedAt: Date.now(),
      };

      cache.set(RenderCache.generateKey('/file1.md', {}), entry, '/file1.md', 1);
      cache.set(RenderCache.generateKey('/file2.md', {}), entry, '/file2.md', 2);

      wrapper.clear();

      expect(cache.size()).toBe(0);
    });
  });

  describe('getStatistics', () => {
    it('should return cache statistics', () => {
      const entry: CacheEntry = {
        html: '<h1>Test</h1>',
        metadata: {
          codeBlocks: 0,
          mathExpressions: 0,
          processingTime: 10,
        },
        cachedAt: Date.now(),
      };

      cache.set(RenderCache.generateKey('/file.md', {}), entry, '/file.md', 1);
      cache.get(RenderCache.generateKey('/file.md', {}));

      const stats = wrapper.getStatistics();

      expect(stats.hits).toBe(1);
      expect(stats.currentSize).toBe(1);
    });
  });

  describe('resetStatistics', () => {
    it('should reset statistics', () => {
      const entry: CacheEntry = {
        html: '<h1>Test</h1>',
        metadata: {
          codeBlocks: 0,
          mathExpressions: 0,
          processingTime: 10,
        },
        cachedAt: Date.now(),
      };

      cache.set(RenderCache.generateKey('/file.md', {}), entry, '/file.md', 1);
      cache.get(RenderCache.generateKey('/file.md', {}));

      wrapper.resetStatistics();

      const stats = wrapper.getStatistics();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
    });
  });

  describe('size', () => {
    it('should return cache size', () => {
      expect(wrapper.size()).toBe(0);

      const entry: CacheEntry = {
        html: '<h1>Test</h1>',
        metadata: {
          codeBlocks: 0,
          mathExpressions: 0,
          processingTime: 10,
        },
        cachedAt: Date.now(),
      };

      cache.set(RenderCache.generateKey('/file.md', {}), entry, '/file.md', 1);

      expect(wrapper.size()).toBe(1);
    });
  });
});

describe('createRenderCache', () => {
  it('should create cache with default config', () => {
    const cache = createRenderCache();
    expect(cache.size()).toBe(0);
  });

  it('should create cache with custom config', () => {
    const config: CacheConfig = {
      capacity: 50,
      enabled: true,
      maxAge: 60000,
    };
    const cache = createRenderCache(config);
    expect(cache.size()).toBe(0);
  });

  it('should create disabled cache when enabled is false', () => {
    const config: CacheConfig = {
      enabled: false,
    };
    const cache = createRenderCache(config);
    expect(cache.size()).toBe(0);
  });
});

describe('DEFAULT_CACHE_CONFIG', () => {
  it('should have correct default values', () => {
    expect(DEFAULT_CACHE_CONFIG.capacity).toBe(100);
    expect(DEFAULT_CACHE_CONFIG.enabled).toBe(true);
    expect(DEFAULT_CACHE_CONFIG.maxAge).toBe(30 * 60 * 1000); // 30 minutes
    expect(DEFAULT_CACHE_CONFIG.enableStatistics).toBe(true);
  });
});

describe('defaultRenderCache', () => {
  it('should be a valid RenderCache instance', () => {
    expect(defaultRenderCache).toBeInstanceOf(RenderCache);
    expect(defaultRenderCache.size()).toBe(0);
  });

  it('should support basic operations', () => {
    const entry: CacheEntry = {
      html: '<h1>Test</h1>',
      metadata: {
        codeBlocks: 0,
        mathExpressions: 0,
        processingTime: 10,
      },
      cachedAt: Date.now(),
    };

    defaultRenderCache.set('test-key', entry, '/test.md', 1234567890);
    const result = defaultRenderCache.get('test-key');

    expect(result).toEqual(entry);

    // Clean up
    defaultRenderCache.clear();
  });
});

describe('defaultCacheWrapper', () => {
  it('should be a valid CacheWrapper instance', () => {
    expect(defaultCacheWrapper).toBeInstanceOf(CacheWrapper);
    expect(defaultCacheWrapper.size()).toBe(0);
  });

  it('should support basic operations', () => {
    defaultCacheWrapper.set(
      '/test.md',
      '<h1>Test</h1>',
      {
        codeBlocks: 0,
        mathExpressions: 0,
        processingTime: 10,
      },
      1234567890
    );

    const entry = defaultCacheWrapper.get('/test.md');
    expect(entry).toBeDefined();
    expect(entry?.html).toBe('<h1>Test</h1>');

    // Clean up
    defaultCacheWrapper.clear();
  });
});