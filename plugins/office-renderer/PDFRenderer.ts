import * as pdfjsLib from 'pdfjs-dist';

// 设置 worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url
).toString();

export default class PDFRenderer {
  private supportedFormats = ['pdf'];

  /**
   * 渲染 PDF 文件为 HTML 格式
   * @param file - 文件对象
   * @returns Promise<HTML string>
   */
  async render(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: buffer });
    const pdf = await loadingTask.promise;

    let html = '<div class="pdf-renderer">';

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.5 });

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;

      html += `<div class="pdf-page" data-page="${pageNum}">`;
      html += `<h4 class="pdf-page-number">Page ${pageNum}</h4>`;
      html += `<img src="${canvas.toDataURL()}" alt="PDF Page ${pageNum}" />`;
      html += '</div>';
    }

    html += '</div>';
    return html;
  }

  /**
   * 检查文件格式是否支持
   */
  supports(format: string): boolean {
    return this.supportedFormats.includes(format.toLowerCase());
  }
}
