/**
 * Office 文档渲染 API
 * 提供统一的 Office 文档渲染端点
 */

import { Hono } from 'hono';
import { ExcelRenderer } from '../../plugins/office-renderer/ExcelRenderer.js';
import WordRenderer from '../../plugins/office-renderer/WordRenderer.js';
import PDFRenderer from '../../plugins/office-renderer/PDFRenderer.js';
import ArchiveRenderer from '../../plugins/office-renderer/ArchiveRenderer.js';

const renderApi = new Hono();

// 渲染器实例缓存
const renderers: Map<string, any> = new Map();

/**
 * 获取渲染器实例
 */
function getRenderer(type: string) {
  if (!renderers.has(type)) {
    switch (type) {
      case 'excel':
        renderers.set('excel', new ExcelRenderer());
        break;
      case 'word':
        renderers.set('word', new WordRenderer());
        break;
      case 'pdf':
        renderers.set('pdf', new PDFRenderer());
        break;
      case 'archive':
        renderers.set('archive', new ArchiveRenderer());
        break;
      default:
        throw new Error(`Unknown renderer type: ${type}`);
    }
  }
  return renderers.get(type);
}

/**
 * POST /api/render/office
 * 渲染 Office 文档为 HTML
 */
renderApi.post('/office', async (c) => {
  try {
    const { type, content, options } = await c.req.json();

    if (!type) {
      return c.json(
        {
          success: false,
          error: 'Missing required parameter: type',
        },
        { status: 400 }
      );
    }

    if (!content) {
      return c.json(
        {
          success: false,
          error: 'Missing required parameter: content',
        },
        { status: 400 }
      );
    }

    // 获取渲染器
    const renderer = getRenderer(type);

    // 将 Base64 字符串转换为 ArrayBuffer
    let buffer: ArrayBuffer;
    if (typeof content === 'string') {
      buffer = new TextEncoder().encode(content).buffer;
    } else if (content instanceof Uint8Array) {
      buffer = content.buffer;
    } else if (content instanceof ArrayBuffer) {
      buffer = content;
    } else {
      buffer = new TextEncoder().encode(String(content)).buffer;
    }

    // 渲染文档
    const html = await renderer.render(buffer, options);

    return c.json({
      success: true,
      data: { html },
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Render error:', error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to render document',
      },
      { status: 500 }
    );
  }
});

/**
 * GET /api/render/office
 * 获取渲染器信息
 */
renderApi.get('/office', (c) => {
  return c.json({
    success: true,
    data: {
      availableRenderers: ['excel', 'word', 'pdf', 'archive'],
      supportedFormats: {
        excel: ['xlsx', 'xlsm', 'xls', 'csv', 'ods'],
        word: ['docx', 'dotx'],
        pdf: ['pdf'],
        archive: ['zip', 'rar', 'jar', '7z'],
      },
    },
    timestamp: Date.now(),
  });
});

export default renderApi;