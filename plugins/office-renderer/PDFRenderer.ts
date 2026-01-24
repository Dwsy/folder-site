/**
 * PDF 渲染器
 * 使用 pdf.js 解析 PDF 文档并渲染为 HTML
 *
 * 功能特性：
 * - 支持 .pdf 格式
 * - 分页渲染（支持页码导航）
 * - 缩放控制
 * - 文本提取（用于搜索）
 * - 支持页面范围选择
 * - 主题适配（亮色/暗色）
 */

import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createCanvas } from 'canvas';

/**
 * PDF 渲染器配置选项
 */
export interface PDFRendererOptions {
  /** 缩放比例（默认 1.5） */
  scale?: number;

  /** 要渲染的页面范围 [start, end]，默认渲染所有页面 */
  pageRange?: [number, number];

  /** 是否显示页码（默认 true） */
  showPageNumbers?: boolean;

  /** 主题（默认 'light'） */
  theme?: 'light' | 'dark';

  /** 是否启用文本提取（默认 false） */
  enableTextExtraction?: boolean;

  /** 图片质量（默认 0.92） */
  imageQuality?: number;

  /** 最大页面数限制（默认 100） */
  maxPages?: number;
}

/**
 * 页面信息
 */
interface PageInfo {
  pageNumber: number;
  width: number;
  height: number;
  text?: string;
}

/**
 * 渲染结果元数据
 */
export interface RenderMetadata {
  pageCount: number;
  pages: PageInfo[];
  totalSize: number;
  renderTime: number;
}

export class PDFRenderer {
  /** 渲染器名称 */
  name = 'pdf';

  /** 渲染器版本 */
  version = '1.0.0';

  /** 支持的文件扩展名 */
  extensions = ['.pdf'];

  /** 插件 ID */
  pluginId = 'office-renderer';

  /** 优先级 */
  priority: number = 50;

  /**
   * 渲染 PDF 文件内容
   *
   * @param content - 文件内容（ArrayBuffer）
   * @param options - 渲染选项
   * @returns HTML 字符串
   */
  async render(
    content: ArrayBuffer,
    options?: PDFRendererOptions
  ): Promise<string> {
    const startTime = Date.now();

    // 合并默认选项
    const opts: Required<PDFRendererOptions> = {
      scale: 1.5,
      pageRange: [1, Number.MAX_SAFE_INTEGER],
      showPageNumbers: true,
      theme: 'light',
      enableTextExtraction: false,
      imageQuality: 0.92,
      maxPages: 100,
      ...options,
    };

    try {
      // 加载 PDF 文档
      const pdf = await this.loadPDF(content);

      // 渲染 PDF
      const { html, metadata } = await this.renderPDF(pdf, opts);

      // 添加渲染时间
      metadata.renderTime = Date.now() - startTime;

      return html;
    } catch (error) {
      throw new Error(
        `Failed to render PDF file: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * 检查文件格式是否支持
   *
   * @param format - 文件格式（扩展名，支持带点和不带点）
   * @returns 是否支持
   */
  supports(format: string): boolean {
    const normalizedFormat = format.toLowerCase();
    const formatWithDot = normalizedFormat.startsWith('.') ? normalizedFormat : `.${normalizedFormat}`;
    return this.extensions.some((ext) => ext === formatWithDot);
  }

  /**
   * 加载 PDF 文档
   *
   * @param content - 文件内容
   * @returns PDF 文档对象
   */
  private async loadPDF(content: ArrayBuffer): Promise<pdfjsLib.PDFDocumentProxy> {
    // 设置 worker
    if (typeof window !== 'undefined') {
      // 浏览器环境
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.js',
        import.meta.url
      ).toString();
    }
    // Node.js 环境：使用 fake worker（无需额外配置）

    // 加载 PDF
    const loadingTask = pdfjsLib.getDocument({ data: content });
    return await loadingTask.promise;
  }

  /**
   * 渲染 PDF 为 HTML
   *
   * @param pdf - PDF 文档对象
   * @param options - 渲染选项
   * @returns HTML 字符串和元数据
   */
  private async renderPDF(
    pdf: pdfjsLib.PDFDocumentProxy,
    options: Required<PDFRendererOptions>
  ): Promise<{ html: string; metadata: RenderMetadata }> {
    const totalPages = pdf.numPages;
    const startPage = Math.max(1, options.pageRange[0]);
    const endPage = Math.min(totalPages, options.pageRange[1]);

    const metadata: RenderMetadata = {
      pageCount: totalPages,
      pages: [],
      totalSize: 0,
      renderTime: 0,
    };

    let html = `<div class="pdf-renderer" data-theme="${options.theme}">`;

    // 添加页面导航
    if (totalPages > 1) {
      html += '<div class="pdf-navigation">';
      html += `<button class="pdf-nav-btn" data-action="first">⏮</button>`;
      html += `<button class="pdf-nav-btn" data-action="prev">◀</button>`;
      html += `<span class="pdf-page-indicator">Page <span id="pdf-current-page">1</span> / ${totalPages}</span>`;
      html += `<button class="pdf-nav-btn" data-action="next">▶</button>`;
      html += `<button class="pdf-nav-btn" data-action="last">⏭</button>`;
      html += '</div>';
    }

    // 添加缩放控制
    html += '<div class="pdf-controls">';
    html += `<button class="pdf-zoom-btn" data-action="zoom-out">−</button>`;
    html += `<span class="pdf-zoom-indicator"><span id="pdf-current-zoom">${Math.round(options.scale * 100)}</span>%</span>`;
    html += `<button class="pdf-zoom-btn" data-action="zoom-in">+</button>`;
    html += '</div>';

    // 渲染页面
    html += '<div class="pdf-pages">';

    for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
      // 限制最大页面数
      if (pageNum - startPage >= options.maxPages) {
        break;
      }

      const { pageHtml, pageInfo } = await this.renderPage(
        pdf,
        pageNum,
        options
      );

      html += pageHtml;
      metadata.pages.push(pageInfo);
      metadata.totalSize += pageInfo.width * pageInfo.height;
    }

    html += '</div>';

    // 添加元数据
    html += `
      <div class="pdf-metadata">
        <span class="metadata-item">Total Pages: ${totalPages}</span>
        <span class="metadata-item">Rendered: ${metadata.pages.length}</span>
        <span class="metadata-item">Scale: ${options.scale}x</span>
      </div>
    `;

    html += '</div>';

    return { html, metadata };
  }

  /**
   * 渲染单个页面
   *
   * @param pdf - PDF 文档对象
   * @param pageNum - 页码
   * @param options - 渲染选项
   * @returns HTML 字符串和页面信息
   */
  private async renderPage(
    pdf: pdfjsLib.PDFDocumentProxy,
    pageNum: number,
    options: Required<PDFRendererOptions>
  ): Promise<{ pageHtml: string; pageInfo: PageInfo }> {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: options.scale });

    // 创建 canvas（支持 Node.js 和浏览器环境）
    let canvas: any;

    if (typeof window === 'undefined') {
      // Node.js 环境：使用 node-canvas
      canvas = createCanvas(viewport.width, viewport.height);
    } else {
      // 浏览器环境
      canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
    }

    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Failed to get 2D context');
    }

    // 渲染页面到 canvas
    await page.render({
      canvas: canvas,  // 添加 canvas 属性
      canvasContext: context,
      viewport: viewport,
    } as any).promise;

    // 转换为 base64 图片
    const imageData = canvas.toDataURL('image/jpeg', options.imageQuality);

    // 提取文本（如果启用）
    let text = '';
    if (options.enableTextExtraction) {
      text = await this.extractText(page);
    }

    const pageInfo: PageInfo = {
      pageNumber: pageNum,
      width: viewport.width,
      height: viewport.height,
      text: text || undefined,
    };

    // 生成 HTML
    let html = `<div class="pdf-page" data-page="${pageNum}" data-visible="${pageNum === 1}">`;

    if (options.showPageNumbers) {
      html += `<div class="pdf-page-number">Page ${pageNum}</div>`;
    }

    html += `<img src="${imageData}" alt="PDF Page ${pageNum}" class="pdf-page-image" />`;

    // 添加文本层（用于搜索和可访问性）
    if (text) {
      html += `<div class="pdf-text-layer" style="display:none">${this.escapeHtml(text)}</div>`;
    }

    html += '</div>';

    return { pageHtml: html, pageInfo };
  }

  /**
   * 提取页面文本
   *
   * @param page - PDF 页面对象
   * @returns 提取的文本
   */
  private async extractText(page: pdfjsLib.PDFPageProxy): Promise<string> {
    const textContent = await page.getTextContent();
    return textContent.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ');
  }

  /**
   * 转义 HTML 特殊字符
   *
   * @param text - 待转义的文本
   * @returns 转义后的文本
   */
  private escapeHtml(text: string): string {
    const htmlEntities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };

    return text.replace(/[&<>"']/g, (char) => htmlEntities[char]);
  }
}

export default PDFRenderer;