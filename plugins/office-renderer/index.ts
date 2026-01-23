/**
 * Office Document Renderers 插件入口
 * 
 * 导出插件接口，用于插件系统加载和注册
 * 支持 Excel、Word、PDF、Archive 等多种 Office 文档格式渲染
 */

import type { Plugin, PluginManifest, PluginContext } from '../../types/plugin.js';
import { ExcelRenderer } from './ExcelRenderer.js';
import WordRenderer from './WordRenderer.js';
import PDFRenderer from './PDFRenderer.js';
import ArchiveRenderer from './ArchiveRenderer.js';

// =============================================================================
// 插件清单
// =============================================================================

/**
 * 插件清单
 */
export const manifest: PluginManifest = {
  id: 'office-renderer',
  name: 'Office Document Renderer',
  version: '1.0.0',
  description: 'Render Excel, Word, PDF, and archive documents in Folder-Site',
  author: {
    name: 'Folder-Site Team',
  },
  license: 'MIT',
  entry: 'index.ts',
  capabilities: [
    {
      type: 'renderer',
      name: 'excel',
      version: '1.0.0',
      constraints: {
        supportedFormats: ['xlsx', 'xlsm', 'xls', 'csv', 'ods'],
        supportsEditing: false,
        maxFileSize: 10485760, // 10MB
      },
    },
    {
      type: 'renderer',
      name: 'word',
      version: '1.0.0',
      constraints: {
        supportedFormats: ['docx', 'dotx'],
        supportsEditing: false,
        maxFileSize: 10485760, // 10MB
      },
    },
    {
      type: 'renderer',
      name: 'pdf',
      version: '1.0.0',
      constraints: {
        supportedFormats: ['pdf'],
        supportsEditing: false,
        maxFileSize: 52428800, // 50MB
        supportsPagination: true,
      },
    },
    {
      type: 'renderer',
      name: 'archive',
      version: '1.0.0',
      constraints: {
        supportedFormats: ['zip', 'rar', 'jar', '7z'],
        supportsEditing: false,
        maxFileSize: 104857600, // 100MB
      },
    },
  ],
  options: {
    type: 'object',
    properties: {
      excel: {
        type: 'object',
        description: 'Excel 渲染器选项',
        properties: {
          maxRows: {
            type: 'number',
            description: '最大行数',
            default: 1000,
            minimum: 1,
          },
          maxCols: {
            type: 'number',
            description: '最大列数',
            default: 50,
            minimum: 1,
          },
          showGridLines: {
            type: 'boolean',
            description: '显示网格线',
            default: true,
          },
          showHeaders: {
            type: 'boolean',
            description: '显示表头',
            default: true,
          },
          theme: {
            type: 'string',
            description: '主题',
            enum: ['light', 'dark'],
            default: 'light',
          },
        },
      },
      pdf: {
        type: 'object',
        description: 'PDF 渲染器选项',
        properties: {
          scale: {
            type: 'number',
            description: '缩放比例',
            default: 1.5,
            minimum: 0.5,
            maximum: 3.0,
          },
          showPageNumbers: {
            type: 'boolean',
            description: '显示页码',
            default: true,
          },
          theme: {
            type: 'string',
            description: '主题',
            enum: ['light', 'dark'],
            default: 'light',
          },
          enableTextExtraction: {
            type: 'boolean',
            description: '启用文本提取',
            default: false,
          },
          maxPages: {
            type: 'number',
            description: '最大页面数',
            default: 100,
            minimum: 1,
          },
        },
      },
      archive: {
        type: 'object',
        description: 'Archive 渲染器选项',
        properties: {
          showHidden: {
            type: 'boolean',
            description: '显示隐藏文件',
            default: false,
          },
          showFileSize: {
            type: 'boolean',
            description: '显示文件大小',
            default: true,
          },
          showModifiedDate: {
            type: 'boolean',
            description: '显示修改日期',
            default: true,
          },
          showCompressionRatio: {
            type: 'boolean',
            description: '显示压缩率',
            default: false,
          },
          theme: {
            type: 'string',
            description: '主题',
            enum: ['light', 'dark'],
            default: 'light',
          },
          maxEntries: {
            type: 'number',
            description: '最大条目数',
            default: 1000,
            minimum: 1,
          },
          sortBy: {
            type: 'string',
            description: '排序方式',
            enum: ['name', 'size', 'date', 'type'],
            default: 'name',
          },
          sortOrder: {
            type: 'string',
            description: '排序顺序',
            enum: ['asc', 'desc'],
            default: 'asc',
          },
        },
      },
    },
    required: [],
  },
  engines: {
    node: '>=18.0.0',
    folderSite: '>=0.1.0',
  },
};

// =============================================================================
// 插件类
// =============================================================================

/**
 * Office Document Renderers 插件类
 * 
 * 实现 Plugin 接口，提供 Office 文档渲染功能
 */
export class OfficeRendererPlugin implements Plugin {
  /** 插件 ID */
  readonly id: string = 'office-renderer';
  
  /** 插件名称 */
  readonly name: string = 'Office Document Renderer';
  
  /** 插件版本 */
  readonly version: string = '1.0.0';
  
  /** 插件清单 */
  readonly manifest: PluginManifest = manifest;
  
  /** 插件状态 */
  status: 'discovered' | 'validated' | 'loading' | 'loaded' | 'activating' | 'active' | 'deactivating' | 'inactive' | 'error' = 'discovered';
  
  /** 插件错误 */
  error?: Error;
  
  /** 渲染器实例映射 */
  private renderers: Map<string, ExcelRenderer | WordRenderer | PDFRenderer | ArchiveRenderer> = new Map();
  
  /** 插件上下文 */
  private context?: PluginContext;

  /**
   * 初始化插件
   * 
   * @param context - 插件上下文
   */
  async initialize(context: PluginContext): Promise<void> {
    this.status = 'loading';
    this.context = context;

    try {
      // 创建渲染器实例
      this.renderers.set('excel', new ExcelRenderer());
      this.renderers.set('word', new WordRenderer());
      this.renderers.set('pdf', new PDFRenderer());
      this.renderers.set('archive', new ArchiveRenderer());

      // 记录日志
      context.logger.info('Office Document Renderer plugin initialized');
      context.logger.debug(`Renderers registered: ${Array.from(this.renderers.keys()).join(', ')}`);

      this.status = 'loaded';
    } catch (error) {
      this.status = 'error';
      this.error = error instanceof Error ? error : new Error(String(error));
      context.logger.error('Failed to initialize Office Document Renderer plugin', error);
      throw this.error;
    }
  }

  /**
   * 激活插件
   */
  async activate(): Promise<void> {
    this.status = 'activating';

    try {
      // 注册渲染器到插件系统
      // 注意：这里需要通过 PluginRegistry 注册渲染器
      // 实际注册逻辑由插件系统在调用 activate 后处理

      if (this.context) {
        this.context.logger.info('Office Document Renderer plugin activated');
        this.context.logger.debug('All renderers are ready for use');
      }

      this.status = 'active';
    } catch (error) {
      this.status = 'error';
      this.error = error instanceof Error ? error : new Error(String(error));
      if (this.context) {
        this.context.logger.error('Failed to activate Office Document Renderer plugin', error);
      }
      throw this.error;
    }
  }

  /**
   * 停用插件
   */
  async deactivate(): Promise<void> {
    this.status = 'deactivating';

    try {
      // 清理资源
      this.renderers.clear();

      if (this.context) {
        this.context.logger.info('Office Document Renderer plugin deactivated');
      }

      this.status = 'inactive';
    } catch (error) {
      this.status = 'error';
      this.error = error instanceof Error ? error : new Error(String(error));
      if (this.context) {
        this.context.logger.error('Failed to deactivate Office Document Renderer plugin', error);
      }
      throw this.error;
    }
  }

  /**
   * 销毁插件
   */
  async dispose(): Promise<void> {
    try {
      // 清理资源
      this.renderers.clear();
      this.status = 'inactive';
      this.error = undefined;
      this.context = undefined;

      if (this.context) {
        this.context.logger.info('Office Document Renderer plugin disposed');
      }
    } catch (error) {
      if (this.context) {
        this.context.logger.error('Failed to dispose Office Document Renderer plugin', error);
      }
    }
  }

  /**
   * 获取渲染器实例
   * 
   * @param name - 渲染器名称
   * @returns 渲染器实例
   */
  getRenderer<T extends ExcelRenderer | WordRenderer | PDFRenderer | ArchiveRenderer>(
    name: string
  ): T | undefined {
    return this.renderers.get(name) as T | undefined;
  }

  /**
   * 获取所有渲染器实例
   * 
   * @returns 渲染器映射
   */
  getAllRenderers(): Map<string, ExcelRenderer | WordRenderer | PDFRenderer | ArchiveRenderer> {
    return new Map(this.renderers);
  }

  /**
   * 检查是否支持指定格式
   * 
   * @param format - 文件格式
   * @returns 是否支持
   */
  supportsFormat(format: string): boolean {
    for (const renderer of this.renderers.values()) {
      if (renderer.supports(format)) {
        return true;
      }
    }
    return false;
  }

  /**
   * 根据文件扩展名获取渲染器
   * 
   * @param extension - 文件扩展名
   * @returns 渲染器实例
   */
  getRendererByExtension(extension: string): ExcelRenderer | WordRenderer | PDFRenderer | ArchiveRenderer | undefined {
    for (const renderer of this.renderers.values()) {
      if (renderer.supports(extension)) {
        return renderer;
      }
    }
    return undefined;
  }

  /**
   * 注册钩子（可选）
   * 
   * 在插件注册时调用
   */
  async onRegister(): Promise<void> {
    if (this.context) {
      this.context.logger.debug('Office Document Renderer plugin registered');
    }
  }

  /**
   * 注销钩子（可选）
   * 
   * 在插件注销时调用
   */
  async onUnregister(): Promise<void> {
    if (this.context) {
      this.context.logger.debug('Office Document Renderer plugin unregistered');
    }
  }
}

// =============================================================================
// 默认导出
// =============================================================================

export default OfficeRendererPlugin;

// =============================================================================
// 命名导出（用于向后兼容）
// =============================================================================

export { ExcelRenderer, WordRenderer, PDFRenderer, ArchiveRenderer };
export type { ExcelRendererOptions, RenderMetadata as ExcelRenderMetadata } from './ExcelRenderer.js';
export type { WordRendererOptions, RenderMetadata as WordRenderMetadata } from './WordRenderer.js';
export type { PDFRendererOptions, RenderMetadata as PDFRenderMetadata } from './PDFRenderer.js';
export type { ArchiveRendererOptions, RenderMetadata as ArchiveRenderMetadata } from './ArchiveRenderer.js';