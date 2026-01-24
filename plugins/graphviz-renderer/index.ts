/**
 * Graphviz 渲染器插件入口
 * 
 * 导出插件接口，用于插件系统加载和注册
 */

import type { Plugin, PluginManifest, PluginContext } from '../../src/types/plugin.js';
import { GraphvizRenderer } from './GraphvizRenderer.js';

// =============================================================================
// 插件清单
// =============================================================================

/**
 * 插件清单
 */
export const manifest: PluginManifest = {
  id: 'graphviz-renderer',
  name: 'Graphviz Renderer',
  version: '1.0.0',
  description: 'A plugin that renders Graphviz DOT diagrams to SVG and other formats',
  author: {
    name: 'Folder-Site Team',
  },
  license: 'MIT',
  entry: 'index.ts',
  capabilities: [
    {
      type: 'renderer',
      name: 'graphviz',
      version: '1.0.0',
      constraints: {
        supportedFormats: ['svg'],
        supportedThemes: ['light', 'dark', 'custom'],
      },
    },
  ],
  options: {
    type: 'object',
    properties: {
      theme: {
        type: 'string',
        description: 'Default theme for Graphviz diagrams',
        enum: ['light', 'dark', 'custom'],
        default: 'light',
      },
      outputFormat: {
        type: 'string',
        description: 'Default output format for rendered diagrams',
        enum: ['svg', 'png'],
        default: 'svg',
      },
      engine: {
        type: 'string',
        description: 'Graphviz layout engine',
        enum: ['dot', 'neato', 'fdp', 'sfdp', 'twopi', 'circo'],
        default: 'dot',
      },
      fontSize: {
        type: 'number',
        description: 'Default font size for diagrams',
        default: 14,
        minimum: 8,
        maximum: 48,
      },
      fontFamily: {
        type: 'string',
        description: 'Default font family for diagrams',
        default: 'sans-serif',
      },
      backgroundColor: {
        type: 'string',
        description: 'Background color for diagrams (hex or transparent)',
        default: 'transparent',
      },
      nodeColor: {
        type: 'string',
        description: 'Default node color (hex)',
        default: '#ffffff',
      },
      edgeColor: {
        type: 'string',
        description: 'Default edge color (hex)',
        default: '#000000',
      },
      fontColor: {
        type: 'string',
        description: 'Default font color (hex)',
        default: '#000000',
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
 * Graphviz 渲染器插件类
 * 
 * 实现 Plugin 接口，提供 Graphviz DOT 图表渲染功能
 */
export class GraphvizRendererPlugin implements Plugin {
  /** 插件 ID */
  readonly id: string = 'graphviz-renderer';
  
  /** 插件名称 */
  readonly name: string = 'Graphviz Renderer';
  
  /** 插件版本 */
  readonly version: string = '1.0.0';
  
  /** 插件清单 */
  readonly manifest: PluginManifest = manifest;
  
  /** 插件状态 */
  status: 'discovered' | 'validated' | 'loading' | 'loaded' | 'activating' | 'active' | 'deactivating' | 'inactive' | 'error' = 'discovered';
  
  /** 插件错误 */
  error?: Error;
  
  /** 渲染器实例 */
  private renderer?: GraphvizRenderer;
  
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
      this.renderer = new GraphvizRenderer();

      // 记录日志
      context.logger.info('Graphviz Renderer plugin initialized');

      this.status = 'loaded';
    } catch (error) {
      this.status = 'error';
      this.error = error instanceof Error ? error : new Error(String(error));
      context.logger.error('Failed to initialize Graphviz Renderer plugin', error);
      throw this.error;
    }
  }

  /**
   * 激活插件
   */
  async activate(): Promise<void> {
    this.status = 'activating';

    try {
      if (!this.renderer) {
        throw new Error('Renderer not initialized');
      }

      // 注册渲染器到插件系统
      // 注意：这里需要通过 PluginRegistry 注册渲染器
      // 实际注册逻辑由插件系统在调用 activate 后处理

      if (this.context) {
        this.context.logger.info('Graphviz Renderer plugin activated');
      }

      this.status = 'active';
    } catch (error) {
      this.status = 'error';
      this.error = error instanceof Error ? error : new Error(String(error));
      if (this.context) {
        this.context.logger.error('Failed to activate Graphviz Renderer plugin', error);
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
      if (this.renderer) {
        this.renderer.clearCache();
      }

      if (this.context) {
        this.context.logger.info('Graphviz Renderer plugin deactivated');
      }

      this.status = 'inactive';
    } catch (error) {
      this.status = 'error';
      this.error = error instanceof Error ? error : new Error(String(error));
      if (this.context) {
        this.context.logger.error('Failed to deactivate Graphviz Renderer plugin', error);
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
      if (this.renderer) {
        this.renderer.clearCache();
        this.renderer = undefined;
      }

      if (this.context) {
        this.context.logger.info('Graphviz Renderer plugin disposed');
      }

      this.status = 'inactive';
      this.error = undefined;
      this.context = undefined;
    } catch (error) {
      if (this.context) {
        this.context.logger.error('Failed to dispose Graphviz Renderer plugin', error);
      }
    }
  }

  /**
   * 获取渲染器实例
   * 
   * @returns 渲染器实例
   */
  getRenderer(): GraphvizRenderer | undefined {
    return this.renderer;
  }

  /**
   * 注册钩子（可选）
   * 
   * 在插件注册时调用
   */
  async onRegister(): Promise<void> {
    if (this.context) {
      this.context.logger.debug('Graphviz Renderer plugin registered');
    }
  }

  /**
   * 注销钩子（可选）
   * 
   * 在插件注销时调用
   */
  async onUnregister(): Promise<void> {
    if (this.context) {
      this.context.logger.debug('Graphviz Renderer plugin unregistered');
    }
  }
}

// =============================================================================
// 默认导出
// =============================================================================

export default GraphvizRendererPlugin;