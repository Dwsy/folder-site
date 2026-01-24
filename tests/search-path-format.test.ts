/**
 * 路径格式测试
 */

import { describe, test, expect } from 'bun:test';

describe('Search Path Format', () => {
  const API_BASE = 'http://localhost:3008';

  test('file search should return relative paths', async () => {
    const response = await fetch(`${API_BASE}/api/search/v2/files?q=package&limit=5`);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.data.results.length).toBeGreaterThan(0);

    // 检查路径格式
    for (const result of data.data.results) {
      // 路径不应该以 / 开头（绝对路径）
      expect(result.path).not.toMatch(/^\//);
      
      // 路径不应该包含 Users/dengwenyu 等绝对路径标识
      expect(result.path).not.toMatch(/Users\/dengwenyu/);
      expect(result.path).not.toMatch(/^\/Users\//);
      expect(result.path).not.toMatch(/^C:\\/);
      
      // 路径应该是相对路径（如 docs/file.md 或 src/index.ts）
      expect(result.path).toMatch(/^[a-zA-Z0-9_.-]+/);
    }
  });

  test('content search should return relative paths', async () => {
    const response = await fetch(`${API_BASE}/api/search/v2/content?q=export&limit=5`);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.data.results.length).toBeGreaterThan(0);

    // 检查路径格式
    for (const result of data.data.results) {
      // 路径不应该以 / 开头（绝对路径）
      expect(result.path).not.toMatch(/^\//);
      
      // 路径不应该包含绝对路径标识
      expect(result.path).not.toMatch(/Users\/dengwenyu/);
      expect(result.path).not.toMatch(/^\/Users\//);
      expect(result.path).not.toMatch(/^C:\\/);
      
      // 路径应该是相对路径
      expect(result.path).toMatch(/^[a-zA-Z0-9_.-]+/);
    }
  });

  test('unified search should return relative paths', async () => {
    const response = await fetch(`${API_BASE}/api/search/v2?q=search&mode=auto&limit=5`);
    const data = await response.json();

    expect(data.success).toBe(true);

    // 检查文件搜索结果
    for (const result of data.data.fileResults) {
      expect(result.path).not.toMatch(/^\//);
      expect(result.path).not.toMatch(/Users\/dengwenyu/);
    }

    // 检查内容搜索结果
    for (const result of data.data.contentResults) {
      expect(result.path).not.toMatch(/^\//);
      expect(result.path).not.toMatch(/Users\/dengwenyu/);
    }
  });

  test('paths should be valid for frontend routing', async () => {
    const response = await fetch(`${API_BASE}/api/search/v2/files?q=README&limit=5`);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.data.results.length).toBeGreaterThan(0);

    // 检查路径可以用于前端路由
    for (const result of data.data.results) {
      const frontendUrl = `/file/${result.path}`;
      
      // URL 不应该包含双斜杠
      expect(frontendUrl).not.toMatch(/\/\//);
      
      // URL 应该以 /file/ 开头
      expect(frontendUrl).toMatch(/^\/file\//);
      
      // URL 不应该包含绝对路径
      expect(frontendUrl).not.toMatch(/\/file\/\//);
      expect(frontendUrl).not.toMatch(/\/file\/Users\//);
    }
  });
});
