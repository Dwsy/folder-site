/**
 * 文件格式服务
 *
 * 从插件中动态获取支持的文件格式
 */

import type { Plugin, PluginCapability, PluginManifest } from '../../types/plugin.js';

/**
 * 文件格式服务类
 */
export class FileFormatService {
  private static instance: FileFormatService | null = null;
  private supportedExtensions: Set<string> = new Set();
  private formatCache: string[] | null = null;

  private constructor() {
    // 添加基础支持的格式
    this.addBaseFormats();
  }

  /**
   * 获取单例实例
   */
  static getInstance(): FileFormatService {
    if (!FileFormatService.instance) {
      FileFormatService.instance = new FileFormatService();
    }
    return FileFormatService.instance;
  }

  /**
   * 重置单例实例（用于测试和热重载）
   */
  static reset(): void {
    FileFormatService.instance = null;
  }

  /**
   * 添加基础支持的格式（不依赖插件）
   */
  private addBaseFormats(): void {
    const baseFormats = [
      // 文本和配置
      '.md', '.mmd', '.txt', '.json', '.yml', '.yaml',
      // 代码文件
      '.ts', '.tsx', '.js', '.jsx',
      // 图表和图形
      '.svg', '.png', '.jpg', '.jpeg', '.gif', '.webp',
      '.dot', '.gv',
    ];

    baseFormats.forEach(ext => this.supportedExtensions.add(ext));
  }

  /**
   * 从插件中提取支持的文件格式
   */
  extractFromPlugins(plugins: Array<Plugin | { manifest: PluginManifest }>): void {
    for (const item of plugins) {
      const manifest = 'manifest' in item ? item.manifest : (item as Plugin).manifest;

      if (!manifest?.capabilities) {
        continue;
      }

      for (const capability of manifest.capabilities) {
        const formats = this.getFormatsFromCapability(capability);
        formats.forEach(ext => {
          this.supportedExtensions.add(ext);
        });
      }
    }

    // 清除缓存
    this.formatCache = null;
  }

  /**
   * 从能力中提取支持的格式
   */
  private getFormatsFromCapability(capability: PluginCapability): string[] {
    const formats: string[] = [];

    if (!capability.constraints) {
      return formats;
    }

    const supportedFormats = capability.constraints.supportedFormats as string[] | string | undefined;

    if (!supportedFormats) {
      return formats;
    }

    const formatArray = Array.isArray(supportedFormats) ? supportedFormats : [supportedFormats];

    for (const format of formatArray) {
      if (!this.isValidExtension(format)) {
        console.warn(`[FileFormatService] Invalid extension format: "${format}"`);
        continue;
      }

      const ext = format.startsWith('.') ? format.toLowerCase() : `.${format.toLowerCase()}`;

      // 检查重复
      if (this.supportedExtensions.has(ext)) {
        console.debug(`[FileFormatService] Duplicate format: "${ext}"`);
      }

      formats.push(ext);
    }

    return formats;
  }

  /**
   * 验证扩展名格式是否合法
   */
  private isValidExtension(ext: string): boolean {
    // 必须是字符串
    if (typeof ext !== 'string') return false;

    // 不能为空
    if (!ext || ext.length === 0) return false;

    // 不能是 . 或 ..
    if (ext === '.' || ext === '..') return false;

    // 不能包含路径分隔符
    if (ext.includes('/') || ext.includes('\\')) return false;

    // 必须至少有一个字符（点号后至少一个字符）
    const normalized = ext.startsWith('.') ? ext : `.${ext}`;
    if (normalized.length < 2) return false;

    // 只包含字母、数字、点号
    return /^[a-z0-9.]+$/i.test(normalized);
  }

  /**
   * 获取所有支持的文件扩展名
   */
  getSupportedExtensions(): string[] {
    if (this.formatCache === null) {
      this.formatCache = Array.from(this.supportedExtensions).sort();
    }
    return this.formatCache;
  }

  /**
   * 获取支持的格式数量
   */
  getSupportedCount(): number {
    return this.supportedExtensions.size;
  }

  /**
   * 检查是否支持某个文件扩展名
   */
  isSupported(extension: string): boolean {
    if (typeof extension !== 'string' || !extension) return false;

    const ext = extension.startsWith('.') ? extension.toLowerCase() : `.${extension.toLowerCase()}`;
    return this.supportedExtensions.has(ext);
  }

  /**
   * 重置为仅包含基础格式
   */
  reset(): void {
    this.supportedExtensions.clear();
    this.formatCache = null;
    this.addBaseFormats();
  }
}

/**
 * 获取文件格式服务实例
 */
export function getFileFormatService(): FileFormatService {
  return FileFormatService.getInstance();
}