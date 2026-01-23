import AdmZip from 'adm-zip';

export default class ArchiveRenderer {
  private supportedFormats = ['zip', 'rar'];

  /**
   * 渲染压缩包内容为 HTML 格式
   * @param file - 文件对象
   * @returns Promise<HTML string>
   */
  async render(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const zip = new AdmZip(Buffer.from(buffer));
    const entries = zip.getEntries();

    let html = '<div class="archive-renderer">';
    html += '<h3 class="archive-title">Archive Contents</h3>';
    html += '<ul class="archive-file-list">';

    entries.forEach(entry => {
      const isDirectory = entry.entryName.endsWith('/');
      const size = isDirectory ? '' : this.formatSize(entry.header.size);
      const date = new Date(entry.header.time).toLocaleString();

      html += `<li class="archive-file" data-type="${isDirectory ? 'directory' : 'file'}">`;
      html += `<span class="archive-file-name">${entry.entryName}</span>`;
      html += `<span class="archive-file-meta">`;
      html += `${size ? `<span class="archive-file-size">${size}</span>` : ''}`;
      html += `<span class="archive-file-date">${date}</span>`;
      html += '</span>';
      html += '</li>';
    });

    html += '</ul>';
    html += '</div>';
    return html;
  }

  /**
   * 格式化文件大小
   */
  private formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  /**
   * 检查文件格式是否支持
   */
  supports(format: string): boolean {
    return this.supportedFormats.includes(format.toLowerCase());
  }
}
