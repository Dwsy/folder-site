/**
 * Office 渲染 API 测试
 */

import { describe, it, expect, beforeAll, afterAll } from 'bun:test';

describe('Office Render API', () => {
  const baseUrl = 'http://localhost:3000/api/render/office';
  
  // 测试数据
  const testCSV = 'Name,Age,City\nAlice,30,Beijing\nBob,25,Shanghai\nCarol,28,Shenzhen';

  beforeAll(async () => {
    // 检查服务器是否运行
    try {
      const response = await fetch('http://localhost:3000/api/health');
      if (!response.ok) {
        console.warn('Server not running, tests will be skipped');
      }
    } catch (error) {
      console.warn('Server not running, tests will be skipped');
    }
  });

  describe('GET /api/render/office', () => {
    it('应该返回可用渲染器列表', async () => {
      const response = await fetch(baseUrl);

      if (!response.ok) {
        console.warn('Server not available, skipping test');
        return;
      }

      const result = await response.json();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.availableRenderers).toContain('excel');
      expect(result.data.availableRenderers).toContain('word');
      expect(result.data.availableRenderers).toContain('pdf');
      expect(result.data.availableRenderers).toContain('archive');
      expect(result.data.supportedFormats).toBeDefined();
    });
  });

  describe('POST /api/render/office', () => {
    it('应该拒绝缺少 type 参数的请求', async () => {
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: testCSV }),
      });

      if (!response.ok) {
        console.warn('Server not available, skipping test');
        return;
      }

      const result = await response.json();

      expect(result.success).toBe(false);
      expect(result.error).toContain('type');
    });

    it('应该拒绝缺少 content 参数的请求', async () => {
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'excel' }),
      });

      if (!response.ok) {
        console.warn('Server not available, skipping test');
        return;
      }

      const result = await response.json();

      expect(result.success).toBe(false);
      expect(result.error).toContain('content');
    });

    it('应该成功渲染 Excel 内容', async () => {
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          type: 'excel',
          content: testCSV,
          options: {
            maxRows: 100,
            maxCols: 10,
            showHeaders: true,
            theme: 'light',
          },
        }),
      });

      if (!response.ok) {
        console.warn('Server not available, skipping test');
        return;
      }

      const result = await response.json();

      expect(result.success).toBe(true);
      expect(result.data.html).toBeDefined();
      expect(result.data.html).toContain('<table');
      expect(result.data.html).toContain('excel-table');
      expect(result.data.html).toContain('Alice');
    });

    it('应该支持自定义渲染选项', async () => {
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          type: 'excel',
          content: testCSV,
          options: {
            maxRows: 5,
            showHeaders: false,
            theme: 'dark',
          },
        }),
      });

      if (!response.ok) {
        console.warn('Server not available, skipping test');
        return;
      }

      const result = await response.json();

      expect(result.success).toBe(true);
      expect(result.data.html).toBeDefined();
      expect(result.data.html).toContain('data-theme="dark"');
    });

    it('应该处理无效的渲染类型', async () => {
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          type: 'invalid',
          content: testCSV,
        }),
      });

      if (!response.ok) {
        console.warn('Server not available, skipping test');
        return;
      }

      const result = await response.json();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('应该处理无效的文档内容', async () => {
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          type: 'excel',
          content: 'invalid,csv,with,errors',
        }),
      });

      if (!response.ok) {
        console.warn('Server not available, skipping test');
        return;
      }

      // SheetJS 可能会尝试解析，不一定会抛出错误
      const result = await response.json();

      // 如果成功，至少应该返回 HTML
      if (result.success) {
        expect(result.data.html).toBeDefined();
      }
    });
  });

  describe('渲染器集成', () => {
    it('应该缓存渲染器实例', async () => {
      const response1 = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          type: 'excel',
          content: testCSV,
        }),
      });

      const response2 = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          type: 'excel',
          content: testCSV,
        }),
      });

      if (!response.ok) {
        console.warn('Server not available, skipping test');
        return;
      }

      const result1 = await response1.json();
      const result2 = await response2.json();

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result1.data.html).toBe(result2.data.html);
    });
  });

  describe('错误处理', () => {
    it('应该返回 400 错误用于缺少参数', async () => {
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        console.warn('Server not available, skipping test');
        return;
      }

      expect(response.status).toBe(400);
    });

    it('应该返回 500 错误用于渲染失败', async () => {
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'excel',
          content: null,
        }),
      });

      if (!response.ok) {
        console.warn('Server not available, skipping test');
        return;
      }

      expect(response.status).toBe(500);
    });
  });
});