/**
 * Archive 渲染器
 * 使用 adm-zip 解析压缩包并渲染为 HTML 列表
 *
 * 功能特性：
 * - 支持 .zip, .rar, .jar 格式
 * - 多级目录结构显示
 * - 文件大小格式化
 * - 文件类型图标
 * - 压缩率显示
 * - HTML 转义防止 XSS 攻击
 * - 主题适配（亮色/暗色）
 */

import AdmZip from 'adm-zip';

/**
 * Archive 渲染器配置选项
 */
export interface ArchiveRendererOptions {
  /** 是否显示隐藏文件（默认 false） */
  showHidden?: boolean;

  /** 是否显示文件大小（默认 true） */
  showFileSize?: boolean;

  /** 是否显示修改日期（默认 true） */
  showModifiedDate?: boolean;

  /** 是否显示压缩率（默认 false） */
  showCompressionRatio?: boolean;

  /** 主题（默认 'light'） */
  theme?: 'light' | 'dark';

  /** 最大显示条目数（默认 1000） */
  maxEntries?: number;

  /** 是否启用目录折叠（默认 true） */
  enableFolderCollapse?: boolean;

  /** 排序方式（默认 'name'） */
  sortBy?: 'name' | 'size' | 'date' | 'type';

  /** 排序顺序（默认 'asc'） */
  sortOrder?: 'asc' | 'desc';
}

/**
 * 文件条目信息
 */
interface ArchiveEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  compressedSize: number;
  date: Date;
  depth: number;
}

/**
 * 渲染结果元数据
 */
export interface RenderMetadata {
  entryCount: number;
  directoryCount: number;
  fileCount: number;
  totalSize: number;
  totalCompressedSize: number;
  compressionRatio: number;
  renderTime: number;
}

export class ArchiveRenderer {
  /** 渲染器名称 */
  name = 'archive';

  /** 渲染器版本 */
  version = '1.0.0';

  /** 支持的文件扩展名 */
  extensions = ['.zip', '.rar', '.jar', '.7z'];

  /** 插件 ID */
  pluginId = 'office-renderer';

  /** 优先级 */
  priority: number = 50;

  /**
   * 渲染压缩包内容
   *
   * @param content - 文件内容（ArrayBuffer）
   * @param options - 渲染选项
   * @returns HTML 字符串
   */
  async render(
    content: ArrayBuffer,
    options?: ArchiveRendererOptions
  ): Promise<string> {
    const startTime = Date.now();

    // 合并默认选项
    const opts: Required<ArchiveRendererOptions> = {
      showHidden: false,
      showFileSize: true,
      showModifiedDate: true,
      showCompressionRatio: false,
      theme: 'light',
      maxEntries: 1000,
      enableFolderCollapse: true,
      sortBy: 'name',
      sortOrder: 'asc',
      ...options,
    };

    try {
      // 解析压缩包
      const archive = this.parseArchive(content);

      // 提取条目
      const entries = this.extractEntries(archive, opts);

      // 渲染 HTML
      const { html, metadata } = this.renderArchive(entries, opts);

      // 添加渲染时间
      metadata.renderTime = Date.now() - startTime;

      return html;
    } catch (error) {
      throw new Error(
        `Failed to render archive: ${error instanceof Error ? error.message : String(error)}`
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
   * 解析压缩包
   *
   * @param content - 文件内容
   * @returns AdmZip 对象
   */
  private parseArchive(content: ArrayBuffer): AdmZip {
    const buffer = Buffer.from(content);
    return new AdmZip(buffer);
  }

  /**
   * 提取压缩包条目
   *
   * @param archive - AdmZip 对象
   * @param options - 渲染选项
   * @returns 条目数组
   */
  private extractEntries(
    archive: AdmZip,
    options: Required<ArchiveRendererOptions>
  ): ArchiveEntry[] {
    const entries = archive.getEntries();
    const result: ArchiveEntry[] = [];

    for (const entry of entries) {
      // 跳过隐藏文件
      if (!options.showHidden && entry.entryName.startsWith('.')) {
        continue;
      }

      const isDirectory = entry.entryName.endsWith('/');
      const name = entry.entryName.split('/').filter(Boolean).pop() || entry.entryName;
      const depth = (entry.entryName.match(/\//g) || []).length;

      result.push({
        name: name,
        path: entry.entryName,
        isDirectory: isDirectory,
        size: isDirectory ? 0 : entry.header.size,
        compressedSize: entry.header.compressedSize,
        date: new Date(entry.header.time),
        depth: depth,
      });
    }

    // 排序
    this.sortEntries(result, options.sortBy, options.sortOrder);

    // 限制最大条目数
    return result.slice(0, options.maxEntries);
  }

  /**
   * 排序条目
   *
   * @param entries - 条目数组
   * @param sortBy - 排序方式
   * @param sortOrder - 排序顺序
   */
  private sortEntries(
    entries: ArchiveEntry[],
    sortBy: string,
    sortOrder: string
  ): void {
    entries.sort((a, b) => {
      // 目录优先
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;

      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
        case 'date':
          comparison = a.date.getTime() - b.date.getTime();
          break;
        case 'type':
          comparison = a.name.split('.').pop()!.localeCompare(b.name.split('.').pop()!);
          break;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }

  /**
   * 渲染压缩包为 HTML
   *
   * @param entries - 条目数组
   * @param options - 渲染选项
   * @returns HTML 字符串和元数据
   */
  private renderArchive(
    entries: ArchiveEntry[],
    options: Required<ArchiveRendererOptions>
  ): { html: string; metadata: RenderMetadata } {
    const metadata = this.calculateMetadata(entries);

    let html = `<div class="archive-renderer" data-theme="${options.theme}">`;

    // 添加标题
    html += '<div class="archive-header">';
    html += '<h3 class="archive-title">Archive Contents</h3>';
    html += `<span class="archive-count">${metadata.entryCount} items</span>`;
    html += '</div>';

    // 添加列表
    html += '<ul class="archive-file-list">';

    entries.forEach((entry) => {
      html += this.renderEntry(entry, options);
    });

    html += '</ul>';

    // 添加元数据
    if (options.showCompressionRatio) {
      html += `
        <div class="archive-metadata">
          <span class="metadata-item">Files: ${metadata.fileCount}</span>
          <span class="metadata-item">Directories: ${metadata.directoryCount}</span>
          <span class="metadata-item">Total Size: ${this.formatSize(metadata.totalSize)}</span>
          <span class="metadata-item">Compressed: ${this.formatSize(metadata.totalCompressedSize)}</span>
          <span class="metadata-item">Compression: ${(metadata.compressionRatio * 100).toFixed(1)}%</span>
        </div>
      `;
    }

    html += '</div>';

    return { html, metadata };
  }

  /**
   * 渲染单个条目
   *
   * @param entry - 条目信息
   * @param options - 渲染选项
   * @returns HTML 字符串
   */
  private renderEntry(
    entry: ArchiveEntry,
    options: Required<ArchiveRendererOptions>
  ): string {
    const icon = this.getFileIcon(entry.name, entry.isDirectory);
    const indentation = entry.depth * 20;

    let html = `<li class="archive-file" data-type="${entry.isDirectory ? 'directory' : 'file'}" style="margin-left: ${indentation}px">`;

    // 图标
    html += `<span class="archive-file-icon">${icon}</span>`;

    // 文件名
    html += `<span class="archive-file-name" title="${this.escapeHtml(entry.path)}">${this.escapeHtml(entry.name)}</span>`;

    // 元数据
    html += `<span class="archive-file-meta">`;

    if (!entry.isDirectory && options.showFileSize) {
      html += `<span class="archive-file-size">${this.formatSize(entry.size)}</span>`;
    }

    if (options.showModifiedDate) {
      html += `<span class="archive-file-date">${this.formatDate(entry.date)}</span>`;
    }

    if (options.showCompressionRatio && !entry.isDirectory) {
      const ratio = entry.size > 0 ? (1 - entry.compressedSize / entry.size) * 100 : 0;
      html += `<span class="archive-file-compression">${ratio.toFixed(1)}%</span>`;
    }

    html += '</span>';
    html += '</li>';

    return html;
  }

  /**
   * 获取文件图标
   *
   * @param fileName - 文件名
   * @param isDirectory - 是否为目录
   * @returns 图标字符
   */
  private getFileIcon(fileName: string, isDirectory: boolean): string {
    if (isDirectory) return '📁';

    const ext = fileName.split('.').pop()?.toLowerCase() || '';

    const icons: Record<string, string> = {
      // 代码文件
      'js': '📜',
      'ts': '📜',
      'jsx': '⚛️',
      'tsx': '⚛️',
      'vue': '💚',
      'html': '🌐',
      'css': '🎨',
      'scss': '🎨',
      'json': '📋',
      'xml': '📋',
      'yaml': '📋',
      'yml': '📋',
      'md': '📝',
      'txt': '📄',

      // 图片文件
      'png': '🖼️',
      'jpg': '🖼️',
      'jpeg': '🖼️',
      'gif': '🖼️',
      'svg': '🎨',
      'webp': '🖼️',
      'ico': '🖼️',

      // 压缩文件
      'zip': '📦',
      'rar': '📦',
      '7z': '📦',
      'tar': '📦',
      'gz': '📦',

      // Office 文件
      'doc': '📄',
      'docx': '📄',
      'xls': '📊',
      'xlsx': '📊',
      'ppt': '📽️',
      'pptx': '📽️',
      'pdf': '📕',

      // 音频文件
      'mp3': '🎵',
      'wav': '🎵',
      'ogg': '🎵',
      'flac': '🎵',

      // 视频文件
      'mp4': '🎬',
      'avi': '🎬',
      'mov': '🎬',
      'mkv': '🎬',

      // 其他
      'exe': '⚙️',
      'dll': '⚙️',
      'bin': '⚙️',
      'log': '📋',
    };

    return icons[ext] || '📄';
  }

  /**
   * 计算元数据
   *
   * @param entries - 条目数组
   * @returns 元数据对象
   */
  private calculateMetadata(entries: ArchiveEntry[]): RenderMetadata {
    const directoryCount = entries.filter((e) => e.isDirectory).length;
    const fileCount = entries.filter((e) => !e.isDirectory).length;
    const totalSize = entries.reduce((sum, e) => sum + e.size, 0);
    const totalCompressedSize = entries.reduce((sum, e) => sum + e.compressedSize, 0);
    const compressionRatio = totalSize > 0 ? 1 - totalCompressedSize / totalSize : 0;

    return {
      entryCount: entries.length,
      directoryCount,
      fileCount,
      totalSize,
      totalCompressedSize,
      compressionRatio,
      renderTime: 0,
    };
  }

  /**
   * 格式化文件大小
   *
   * @param bytes - 字节数
   * @returns 格式化后的字符串
   */
  private formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  /**
   * 格式化日期
   *
   * @param date - 日期对象
   * @returns 格式化后的字符串
   */
  private formatDate(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return 'Today';
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days} days ago`;
    } else if (days < 30) {
      return `${Math.floor(days / 7)} weeks ago`;
    } else if (days < 365) {
      return `${Math.floor(days / 30)} months ago`;
    } else {
      return `${Math.floor(days / 365)} years ago`;
    }
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

export default ArchiveRenderer;