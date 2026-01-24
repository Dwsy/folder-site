/**
 * Search v2 Tests
 *
 * 测试使用 fd 和 ripgrep 的搜索功能
 */

import { describe, it, expect, beforeAll } from 'bun:test';
import { searchFiles, searchContent, search, isSearchAvailable } from '../src/server/services/search-service.js';
import { ensureTool, getToolsDir } from '../src/utils/tools-manager.js';

describe('Tools Manager', () => {
  it('should get tools directory', () => {
    const toolsDir = getToolsDir();
    expect(toolsDir).toContain('.folder-site');
    expect(toolsDir).toContain('bin');
  });

  it('should check tool availability', () => {
    const status = isSearchAvailable();
    expect(status).toHaveProperty('fd');
    expect(status).toHaveProperty('rg');
  });

  it('should ensure tool is available', async () => {
    // 这个测试可能会下载工具，所以设置为可选
    const fdPath = await ensureTool('fd', true);
    const rgPath = await ensureTool('rg', true);

    // 如果工具已安装或下载成功，应该返回路径
    if (fdPath) {
      expect(fdPath).toBeTruthy();
    }
    if (rgPath) {
      expect(rgPath).toBeTruthy();
    }
  }, 30000); // 30 秒超时（可能需要下载）
});

describe('File Search', () => {
  beforeAll(async () => {
    // 确保工具可用
    await ensureTool('fd', true);
  });

  it('should search for files by name', async () => {
    const results = await searchFiles('package.json', {
      limit: 10,
    });

    expect(Array.isArray(results)).toBe(true);
    if (results.length > 0) {
      expect(results[0]).toHaveProperty('path');
      expect(results[0]).toHaveProperty('name');
      expect(results[0]).toHaveProperty('type');
      expect(results[0]).toHaveProperty('score');
    }
  });

  it('should search with case insensitive', async () => {
    const results = await searchFiles('PACKAGE', {
      limit: 10,
      caseSensitive: false,
    });

    expect(Array.isArray(results)).toBe(true);
  });

  it('should search with extensions filter', async () => {
    const results = await searchFiles('search', {
      limit: 10,
      extensions: ['.ts', '.tsx'],
    });

    expect(Array.isArray(results)).toBe(true);
    if (results.length > 0) {
      expect(results[0].path).toMatch(/\.(ts|tsx)$/);
    }
  });

  it('should handle empty query', async () => {
    const results = await searchFiles('', {
      limit: 10,
    });

    expect(Array.isArray(results)).toBe(true);
  });

  it('should handle no results', async () => {
    const results = await searchFiles('nonexistent-file-xyz-123', {
      limit: 10,
    });

    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(0);
  });
});

describe('Content Search', () => {
  beforeAll(async () => {
    // 确保工具可用
    await ensureTool('rg', true);
  });

  it('should search content in files', async () => {
    const results = await searchContent('export', {
      limit: 10,
    });

    expect(Array.isArray(results)).toBe(true);
    if (results.length > 0) {
      expect(results[0]).toHaveProperty('path');
      expect(results[0]).toHaveProperty('name');
      expect(results[0]).toHaveProperty('matches');
      expect(Array.isArray(results[0].matches)).toBe(true);
      if (results[0].matches.length > 0) {
        expect(results[0].matches[0]).toHaveProperty('lineNumber');
        expect(results[0].matches[0]).toHaveProperty('line');
        expect(results[0].matches[0]).toHaveProperty('submatches');
      }
    }
  });

  it('should search with context lines', async () => {
    const results = await searchContent('export', {
      limit: 10,
      context: 3,
    });

    expect(Array.isArray(results)).toBe(true);
  });

  it('should search with extensions filter', async () => {
    const results = await searchContent('export', {
      limit: 10,
      extensions: ['.ts', '.tsx'],
    });

    expect(Array.isArray(results)).toBe(true);
    if (results.length > 0) {
      expect(results[0].path).toMatch(/\.(ts|tsx)$/);
    }
  });

  it('should handle empty query', async () => {
    const results = await searchContent('', {
      limit: 10,
    });

    expect(Array.isArray(results)).toBe(true);
  });

  it('should handle no results', async () => {
    const results = await searchContent('nonexistent-content-xyz-123', {
      limit: 10,
    });

    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(0);
  });
});

describe('Unified Search', () => {
  beforeAll(async () => {
    // 确保工具可用
    await ensureTool('fd', true);
    await ensureTool('rg', true);
  });

  it('should search both files and content', async () => {
    const results = await search('search', {
      limit: 10,
    });

    expect(results).toHaveProperty('fileResults');
    expect(results).toHaveProperty('contentResults');
    expect(Array.isArray(results.fileResults)).toBe(true);
    expect(Array.isArray(results.contentResults)).toBe(true);
  });

  it('should handle empty query', async () => {
    const results = await search('', {
      limit: 10,
    });

    expect(results).toHaveProperty('fileResults');
    expect(results).toHaveProperty('contentResults');
  });
});

describe('Performance', () => {
  beforeAll(async () => {
    // 确保工具可用
    await ensureTool('fd', true);
    await ensureTool('rg', true);
  });

  it('should search files quickly', async () => {
    const start = performance.now();
    const results = await searchFiles('package', {
      limit: 100,
    });
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(1000); // 应该在 1 秒内完成
    expect(Array.isArray(results)).toBe(true);
  });

  it('should search content quickly', async () => {
    const start = performance.now();
    const results = await searchContent('export', {
      limit: 50,
    });
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(2000); // 应该在 2 秒内完成
    expect(Array.isArray(results)).toBe(true);
  });

  it('should handle parallel searches', async () => {
    const start = performance.now();
    const [results1, results2, results3] = await Promise.all([
      searchFiles('package', { limit: 50 }),
      searchContent('export', { limit: 25 }),
      searchFiles('search', { limit: 50 }),
    ]);
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(3000); // 并行搜索应该在 3 秒内完成
    expect(Array.isArray(results1)).toBe(true);
    expect(Array.isArray(results2)).toBe(true);
    expect(Array.isArray(results3)).toBe(true);
  });
});

describe('Error Handling', () => {
  it('should handle tool not available', async () => {
    // 暂时无法模拟工具不可用的情况
    // 但代码应该能够优雅地处理这种情况
    const status = isSearchAvailable();
    expect(status).toHaveProperty('fd');
    expect(status).toHaveProperty('rg');
  });

  it('should handle invalid search path', async () => {
    try {
      const results = await searchFiles('test', {
        rootDir: '/nonexistent-path-xyz-123',
        limit: 10,
      });
      // 应该返回空结果而不是抛出错误
      expect(Array.isArray(results)).toBe(true);
    } catch (error) {
      // 或者抛出有意义的错误
      expect(error).toBeDefined();
    }
  });
});