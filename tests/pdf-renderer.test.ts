/**
 * PDFRenderer 功能测试
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { PDFRenderer } from '../plugins/office-renderer/PDFRenderer.js';

describe('PDFRenderer', () => {
  let renderer: PDFRenderer;

  beforeEach(() => {
    renderer = new PDFRenderer();
  });

  describe('基础功能测试', () => {
    describe('supports() 方法', () => {
      it('应该支持 pdf 格式', () => {
        expect(renderer.supports('pdf')).toBe(true);
        expect(renderer.supports('.pdf')).toBe(true);
      });

      it('应该支持大写格式', () => {
        expect(renderer.supports('PDF')).toBe(true);
      });

      it('应该拒绝不支持的格式', () => {
        expect(renderer.supports('docx')).toBe(false);
        expect(renderer.supports('xlsx')).toBe(false);
        expect(renderer.supports('txt')).toBe(false);
      });
    });

    describe('render() 方法 - 基础渲染', () => {
      it('应该处理有效的 PDF 数据', async () => {
        // 创建一个最小的 PDF 文件
        const pdfData = createMinimalPDF();

        const html = await renderer.render(pdfData);

        expect(html).toContain('pdf-renderer');
        expect(html).toContain('pdf-pages');
      });

      it('应该包含页面导航（多页PDF）', async () => {
        const pdfData = createMultiPagePDF(3);

        const html = await renderer.render(pdfData);

        expect(html).toContain('pdf-navigation');
        expect(html).toContain('pdf-page-indicator');
      });

      it('应该包含缩放控制', async () => {
        const pdfData = createMinimalPDF();

        const html = await renderer.render(pdfData);

        expect(html).toContain('pdf-controls');
        expect(html).toContain('pdf-zoom-btn');
      });

      it('应该包含元数据', async () => {
        const pdfData = createMinimalPDF();

        const html = await renderer.render(pdfData);

        expect(html).toContain('pdf-metadata');
      });
    });

    describe('render() 方法 - 渲染选项', () => {
      it('应该应用 scale 选项', async () => {
        const pdfData = createMinimalPDF();

        const html = await renderer.render(pdfData, { scale: 2.0 });

        // HTML 格式: <span id="pdf-current-zoom">200</span>%
        expect(html).toContain('pdf-current-zoom">200</span>%');
      });

      it('应该应用 showPageNumbers 选项', async () => {
        const pdfData = createMinimalPDF();

        const html = await renderer.render(pdfData, { showPageNumbers: false });

        expect(html).not.toContain('pdf-page-number');
      });

      it('应该应用 theme 选项', async () => {
        const pdfData = createMinimalPDF();

        const html = await renderer.render(pdfData, { theme: 'dark' });

        expect(html).toContain('data-theme="dark"');
      });

      it('应该应用 maxPages 选项', async () => {
        const pdfData = createMultiPagePDF(10);

        const html = await renderer.render(pdfData, { maxPages: 1 });

        expect(html).toContain('Rendered: 1');
      });

      it('应该应用 imageQuality 选项', async () => {
        const pdfData = createMinimalPDF();

        const html = await renderer.render(pdfData, { imageQuality: 0.8 });

        expect(html).toContain('pdf-page-image');
      });
    });

    describe('单元格类型检测', () => {
      it('应该正确识别页面信息', async () => {
        const pdfData = createMinimalPDF();

        const html = await renderer.render(pdfData);

        expect(html).toContain('data-page="1"');
      });
    });

    describe('渲染器属性', () => {
      it('应该有正确的名称', () => {
        expect(renderer.name).toBe('pdf');
      });

      it('应该有正确的版本', () => {
        expect(renderer.version).toBe('1.0.0');
      });

      it('应该有正确的扩展名列表', () => {
        expect(renderer.extensions).toContain('.pdf');
      });

      it('应该有正确的插件 ID', () => {
        expect(renderer.pluginId).toBe('office-renderer');
      });

      it('应该有优先级属性', () => {
        expect(renderer.priority).toBeDefined();
      });
    });
  });

  describe('边界情况测试', () => {
    it('应该处理空 PDF 数据', async () => {
      const emptyData = new ArrayBuffer(0);

      await expect(renderer.render(emptyData)).rejects.toThrow();
    });

    it('应该处理无效的 PDF 数据', async () => {
      const invalidData = new Uint8Array([0xFF, 0xFF, 0xFF, 0xFF]).buffer;

      await expect(renderer.render(invalidData)).rejects.toThrow();
    });

    it('应该处理极小的 scale 值', async () => {
      const pdfData = createMinimalPDF();

      const html = await renderer.render(pdfData, { scale: 0.1 });

      expect(html).toBeDefined();
    });

    it('应该处理极大的 scale 值', async () => {
      const pdfData = createMinimalPDF();

      const html = await renderer.render(pdfData, { scale: 10.0 });

      expect(html).toBeDefined();
    });

    it('应该处理 pageRange 选项', async () => {
      const pdfData = createMinimalPDF();

      const html = await renderer.render(pdfData, { pageRange: [1, 1] });

      expect(html).toContain('Rendered: 1');
    });

    it('应该处理无效的 pageRange', async () => {
      const pdfData = createMinimalPDF();

      const html = await renderer.render(pdfData, { pageRange: [100, 200] });

      // 应该优雅处理
      expect(html).toBeDefined();
    });
  });

  describe('错误处理测试', () => {
    it('应该拒绝 null 输入', async () => {
      await expect(renderer.render(null as any)).rejects.toThrow();
    });

    it('应该拒绝 undefined 输入', async () => {
      await expect(renderer.render(undefined as any)).rejects.toThrow();
    });

    it('应该拒绝字符串输入', async () => {
      await expect(renderer.render('invalid' as any)).rejects.toThrow();
    });

    it('应该提供清晰的错误消息', async () => {
      try {
        await renderer.render(null as any);
        expect.unreachable();
      } catch (error) {
        expect((error as Error).message).toBeDefined();
        expect((error as Error).message).toContain('Failed to render PDF file');
      }
    });

    it('应该包含原始错误信息', async () => {
      try {
        await renderer.render(new ArrayBuffer(0));
        expect.unreachable();
      } catch (error) {
        const message = (error as Error).message;
        expect(message.length).toBeGreaterThan(0);
      }
    });
  });

  describe('性能测试', () => {
    it('应该在合理时间内渲染单页 PDF', async () => {
      const pdfData = createMinimalPDF();

      const start = performance.now();
      const html = await renderer.render(pdfData);
      const end = performance.now();

      expect(end - start).toBeLessThan(5000);
      expect(html).toContain('pdf-renderer');
    });

    it('应该支持文本提取选项', async () => {
      const pdfData = createMinimalPDF();

      const html = await renderer.render(pdfData, { enableTextExtraction: true });

      expect(html).toContain('pdf-text-layer');
    });
  });

  describe('集成测试', () => {
    it('应该正确渲染带默认选项的 PDF', async () => {
      const pdfData = createMinimalPDF();

      const html = await renderer.render(pdfData);

      expect(html).toContain('pdf-renderer');
      expect(html).toContain('pdf-controls');
      expect(html).toContain('pdf-pages');
      expect(html).toContain('pdf-metadata');
    });

    it('应该正确渲染带自定义选项的 PDF', async () => {
      const pdfData = createMultiPagePDF(5);

      const html = await renderer.render(pdfData, {
        scale: 2.0,
        showPageNumbers: true,
        theme: 'dark',
        maxPages: 1,
        imageQuality: 0.9,
      });

      expect(html).toContain('data-theme="dark"');
      expect(html).toContain('pdf-current-zoom">200</span>%');
      expect(html).toContain('Rendered: 1');
    });
  });

  describe('回归测试', () => {
    it('应该保持稳定的输出格式', async () => {
      const pdfData1 = createMinimalPDF();
      const pdfData2 = createMinimalPDF();

      const html1 = await renderer.render(pdfData1);
      const html2 = await renderer.render(pdfData2);

      // 每次渲染可能会有时间戳差异，所以检查关键部分
      expect(html1).toContain('pdf-renderer');
      expect(html2).toContain('pdf-renderer');
    });

    it('应该正确处理多次渲染', async () => {
      const pdfData1 = createMinimalPDF();
      const pdfData2 = createMinimalPDF();
      const pdfData3 = createMinimalPDF();

      const results = await Promise.all([
        renderer.render(pdfData1),
        renderer.render(pdfData2),
        renderer.render(pdfData3),
      ]);

      expect(results).toHaveLength(3);
      results.forEach((html) => {
        expect(html).toContain('pdf-renderer');
      });
    });
  });
});

/**
 * 创建一个最小的 PDF 文件用于测试
 * 返回一个包含有效 PDF 头的 ArrayBuffer
 */
function createMinimalPDF(): ArrayBuffer {
  // 这是一个最小的 PDF 文件结构
  const pdfHeader = '%PDF-1.4\n';
  const pdfContent = `
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Resources <<
/Font <<
/F1 4 0 R
>>
>>
/Contents 5 0 R
>>
endobj

4 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

5 0 obj
<<
/Length 44
>>
stream
BT
/F1 24 Tf
100 700 Td
(Hello PDF) Tj
ET
endstream
endobj

xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000262 00000 n
0000000337 00000 n
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
476
%%EOF
`;

  const pdfString = pdfHeader + pdfContent;
  return new TextEncoder().encode(pdfString).buffer;
}

/**
 * 创建一个多页 PDF 文件用于测试
 */
function createMultiPagePDF(pageCount: number): ArrayBuffer {
  const pages: string[] = [];
  let objects = '';
  let xref = '0 6\n0000000000 65535 f\n';
  let offset = 9;

  // 对象 1: Catalog
  objects += '1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n\n';
  xref += `${offset.toString().padStart(10, '0')} 00000 n\n`;
  offset += objects.slice(objects.lastIndexOf('1 0 obj')).length + 1;

  // 对象 2: Pages
  objects += '2 0 obj\n<<\n/Type /Pages\n/Kids [' + Array.from({ length: pageCount }, (_, i) => `${3 + i} 0 R`).join(' ') + ']\n/Count ' + pageCount + '\n>>\nendobj\n\n';
  xref += `${offset.toString().padStart(10, '0')} 00000 n\n`;
  offset += objects.slice(objects.lastIndexOf('2 0 obj')).length + 1;

  // 对象 3: Font
  objects += '3 0 obj\n<<\n/Type /Font\n/Subtype /Type1\n/BaseFont /Helvetica\n>>\nendobj\n\n';
  xref += `${offset.toString().padStart(10, '0')} 00000 n\n`;
  offset += objects.slice(objects.lastIndexOf('3 0 obj')).length + 1;

  // 对象 4+: Pages
  for (let i = 0; i < pageCount; i++) {
    const pageNum = 4 + i;
    objects += `${pageNum} 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n/Resources <<\n/Font <<\n/F1 3 0 R\n>>\n>>\n/Contents ${pageNum + pageCount} 0 R\n>>\nendobj\n\n`;
    xref += `${offset.toString().padStart(10, '0')} 00000 n\n`;
    offset += objects.slice(objects.lastIndexOf(`${pageNum} 0 obj`)).length + 1;
  }

  // Contents
  for (let i = 0; i < pageCount; i++) {
    const pageNum = 4 + pageCount + i;
    const content = `BT\n/F1 24 Tf\n100 ${700 - i * 100} Td\n(Page ${i + 1}) Tj\nET\n`;
    objects += `${pageNum} 0 obj\n<<\n/Length ${content.length}\n>>\nstream\n${content}\nendstream\nendobj\n\n`;
    xref += `${offset.toString().padStart(10, '0')} 00000 n\n`;
    offset += objects.slice(objects.lastIndexOf(`${pageNum} 0 obj`)).length + 1;
  }

  const trailer = `trailer\n<<\n/Size ${4 + pageCount * 2}\n/Root 1 0 R\n>>\nstartxref\n${offset}\n%%EOF\n`;

  const pdfString = '%PDF-1.4\n' + objects + xref + trailer;
  return new TextEncoder().encode(pdfString).buffer;
}