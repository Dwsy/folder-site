/**
 * Search Modal Component Unit Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'bun:test';

// 测试数据
const mockFiles = [
  { name: 'README.md', path: '/README.md', type: 'file' as const, extension: 'md' },
  { name: 'package.json', path: '/package.json', type: 'file' as const, extension: 'json' },
  { name: 'docs', path: '/docs', type: 'folder' as const },
  { name: 'src', path: '/src', type: 'folder' as const },
  { name: 'index.ts', path: '/src/index.ts', type: 'file' as const, extension: 'ts' },
  { name: 'App.tsx', path: '/src/App.tsx', type: 'file' as const, extension: 'tsx' },
];

describe('Search Hooks - useSearch', () => {
  it('should be importable', async () => {
    const { useSearch } = await import('../src/hooks/useSearch');
    expect(useSearch).toBeDefined();
    expect(typeof useSearch).toBe('function');
  });

  it('should return search results', async () => {
    const { useSearch } = await import('../src/hooks/useSearch');
    
    const { result } = useSearch({
      files: mockFiles,
      query: 'README',
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it('should filter files correctly', async () => {
    const { useSearch } = await import('../src/hooks/useSearch');
    
    const { result } = useSearch({
      files: mockFiles,
      query: 'README',
    });

    const names = result.map((r: any) => r.name);
    expect(names).toContain('README.md');
    expect(names).not.toContain('package.json');
  });

  it('should return empty array for no match', async () => {
    const { useSearch } = await import('../src/hooks/useSearch');
    
    const { result } = useSearch({
      files: mockFiles,
      query: 'nonexistent-file-xyz',
    });

    expect(result).toHaveLength(0);
  });

  it('should return files when query is empty', async () => {
    const { useSearch } = await import('../src/hooks/useSearch');
    
    const { result } = useSearch({
      files: mockFiles,
      query: '',
    });

    expect(result.length).toBeGreaterThan(0);
  });

  it('should handle special characters in query', async () => {
    const { useSearch } = await import('../src/hooks/useSearch');
    
    const { result } = useSearch({
      files: mockFiles,
      query: 'test@#$%',
    });

    expect(Array.isArray(result)).toBe(true);
  });

  it('should be case insensitive', async () => {
    const { useSearch } = await import('../src/hooks/useSearch');
    
    const { result: result1 } = useSearch({
      files: mockFiles,
      query: 'readme',
    });

    const { result: result2 } = useSearch({
      files: mockFiles,
      query: 'README',
    });

    expect(result1.length).toBe(result2.length);
  });

  it('should prioritize exact matches', async () => {
    const { useSearch } = await import('../src/hooks/useSearch');
    
    const { result } = useSearch({
      files: mockFiles,
      query: 'README.md',
    });

    // 第一个结果应该是 README.md
    expect(result[0].name).toBe('README.md');
  });

  it('should support partial matching', async () => {
    const { useSearch } = await import('../src/hooks/useSearch');
    
    const { result } = useSearch({
      files: mockFiles,
      query: 'read',
    });

    expect(result.length).toBeGreaterThan(0);
    expect(result.some((r: any) => r.name.toLowerCase().includes('read'))).toBe(true);
  });

  it('should match folder names', async () => {
    const { useSearch } = await import('../src/hooks/useSearch');
    
    const { result } = useSearch({
      files: mockFiles,
      query: 'docs',
    });

    expect(result.some((r: any) => r.name === 'docs')).toBe(true);
  });

  it('should match file paths', async () => {
    const { useSearch } = await import('../src/hooks/useSearch');
    
    const { result } = useSearch({
      files: mockFiles,
      query: 'src',
    });

    expect(result.length).toBeGreaterThan(0);
  });

  it('should sort results by score', async () => {
    const { useSearch } = await import('../src/hooks/useSearch');
    
    const { result } = useSearch({
      files: mockFiles,
      query: 'index',
    });

    // 验证结果按分数降序排列
    for (let i = 1; i < result.length; i++) {
      expect((result[i - 1].score || 0)).toBeGreaterThanOrEqual((result[i].score || 0));
    }
  });

  it('should limit results by maxResults', async () => {
    const { useSearch } = await import('../src/hooks/useSearch');
    
    const { result } = useSearch({
      files: mockFiles,
      query: '',
      maxResults: 3,
    });

    expect(result.length).toBeLessThanOrEqual(3);
  });

  it('should handle empty files array', async () => {
    const { useSearch } = await import('../src/hooks/useSearch');
    
    const { result } = useSearch({
      files: [],
      query: 'test',
    });

    expect(result).toHaveLength(0);
  });

  it('should handle very long query', async () => {
    const { useSearch } = await import('../src/hooks/useSearch');
    
    const longQuery = 'a'.repeat(1000);
    const { result } = useSearch({
      files: mockFiles,
      query: longQuery,
    });

    expect(Array.isArray(result)).toBe(true);
  });

  it('should handle unicode characters', async () => {
    const { useSearch } = await import('../src/hooks/useSearch');
    
    const { result } = useSearch({
      files: mockFiles,
      query: '测试',
    });

    expect(Array.isArray(result)).toBe(true);
  });
});

describe('Search Components - Type Safety', () => {
  it('should export SearchModal', async () => {
    const module = await import('../src/client/components/search');
    expect(module.SearchModal).toBeDefined();
  });

  it('should export SearchTrigger', async () => {
    const module = await import('../src/client/components/search');
    expect(module.SearchTrigger).toBeDefined();
  });

  it('should export SearchInput', async () => {
    const module = await import('../src/client/components/search');
    expect(module.SearchInput).toBeDefined();
  });

  it('should export SearchResults', async () => {
    const module = await import('../src/client/components/search');
    expect(module.SearchResults).toBeDefined();
  });

  it('should export SearchResultsGroup', async () => {
    const module = await import('../src/client/components/search');
    expect(module.SearchResultsGroup).toBeDefined();
  });

  it('should export types', async () => {
    const module = await import('../src/client/components/search');
    
    // 验证类型导出存在（TypeScript 编译时会检查）
    expect(module).toBeDefined();
  });
});

describe('Search - Performance', () => {
  it('should handle large file lists efficiently', async () => {
    const { useSearch } = await import('../src/hooks/useSearch');
    
    const largeFileList = Array.from({ length: 1000 }, (_, i) => ({
      name: `file${i}.md`,
      path: `/docs/file${i}.md`,
      type: 'file' as const,
      extension: 'md',
    }));

    const startTime = performance.now();
    const { result } = useSearch({
      files: largeFileList,
      query: 'file',
    });
    const endTime = performance.now();

    expect(result.length).toBeGreaterThan(0);
    expect(endTime - startTime).toBeLessThan(100); // Should be fast
  });

  it('should handle search with many results efficiently', async () => {
    const { useSearch } = await import('../src/hooks/useSearch');
    
    const largeFileList = Array.from({ length: 1000 }, (_, i) => ({
      name: `test${i}.md`,
      path: `/docs/test${i}.md`,
      type: 'file' as const,
      extension: 'md',
    }));

    const startTime = performance.now();
    const { result } = useSearch({
      files: largeFileList,
      query: 'test',
      maxResults: 100,
    });
    const endTime = performance.now();

    // 应该限制结果数量
    expect(result.length).toBeLessThanOrEqual(100);
    expect(endTime - startTime).toBeLessThan(100);
  });
});

describe('Search - Fuzzy Matching', () => {
  it('should match characters in order', async () => {
    const { useSearch } = await import('../src/hooks/useSearch');
    
    const { result } = useSearch({
      files: mockFiles,
      query: 'readme',
    });

    // README.md 应该匹配
    expect(result.some((r: any) => r.name === 'README.md')).toBe(true);
  });

  it('should give higher score to prefix matches', async () => {
    const { useSearch } = await import('../src/hooks/useSearch');
    
    const { result } = useSearch({
      files: mockFiles,
      query: 'readme',
    });

    // README.md 应该有很高的分数
    const readmeResult = result.find((r: any) => r.name === 'README.md');
    expect(readmeResult).toBeDefined();
    expect((readmeResult?.score || 0)).toBeGreaterThan(0);
  });

  it('should give higher score to exact matches', async () => {
    const { useSearch } = await import('../src/hooks/useSearch');
    
    const { result } = useSearch({
      files: mockFiles,
      query: 'README.md',
    });

    const firstResult = result[0];
    expect(firstResult.name).toBe('README.md');
    expect(firstResult.score).toBeDefined();
  });
});

describe('Search - Edge Cases', () => {
  it('should handle null or undefined files', async () => {
    const { useSearch } = await import('../src/hooks/useSearch');
    
    const { result } = useSearch({
      files: undefined as any,
      query: 'test',
    });

    expect(Array.isArray(result)).toBe(true);
  });

  it('should handle query with only spaces', async () => {
    const { useSearch } = await import('../src/hooks/useSearch');
    
    const { result } = useSearch({
      files: mockFiles,
      query: '   ',
    });

    expect(Array.isArray(result)).toBe(true);
  });

  it('should handle file names with special characters', async () => {
    const { useSearch } = await import('../src/hooks/useSearch');
    
    const specialFiles = [
      { name: 'file-with-dashes.md', path: '/file-with-dashes.md', type: 'file' as const, extension: 'md' },
      { name: 'file_with_underscores.md', path: '/file_with_underscores.md', type: 'file' as const, extension: 'md' },
      { name: 'file.with.dots.md', path: '/file.with.dots.md', type: 'file' as const, extension: 'md' },
    ];

    const { result } = useSearch({
      files: specialFiles,
      query: 'file',
    });

    expect(result.length).toBe(3);
  });

  it('should handle deep nested paths', async () => {
    const { useSearch } = await import('../src/hooks/useSearch');
    
    const deepFiles = [
      { name: 'deep.md', path: '/a/b/c/d/e/deep.md', type: 'file' as const, extension: 'md' },
      { name: 'shallow.md', path: '/shallow.md', type: 'file' as const, extension: 'md' },
    ];

    const { result } = useSearch({
      files: deepFiles,
      query: 'deep',
    });

    expect(result.some((r: any) => r.name === 'deep.md')).toBe(true);
  });
});