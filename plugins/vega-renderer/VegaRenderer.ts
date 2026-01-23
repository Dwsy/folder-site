/**
 * Vega 渲染器核心实现
 * 
 * 提供将 Vega 和 Vega-Lite 规范渲染为 SVG、PNG 等格式的功能
 * 支持声明式数据可视化，基于图形语法理论
 * 
 * 核心功能：
 * - 支持 Vega 和 Vega-Lite 两种规范
 * - 主题配置（light/dark/custom）
 * - 输出格式支持（SVG、PNG）
 * - 完善的错误处理
 * - 渲染结果缓存
 */

import embed from 'vega-embed';
import type { RendererPlugin } from '../../types/plugin.js';
import { JSDOM } from 'jsdom';

// 在 Node.js 环境中设置 DOM（与 MermaidRenderer 保持一致）
if (typeof window === 'undefined') {
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'http://localhost',
    pretendToBeVisual: true,
  });
  (global as any).window = dom.window as any;
  (global as any).document = dom.window.document;
  (global as any).HTMLElement = dom.window.HTMLElement;
  (global as any).SVGElement = dom.window.SVGElement;
  (global as any).HTMLCanvasElement = dom.window.HTMLCanvasElement;
  (global as any).HTMLDivElement = dom.window.HTMLDivElement;
  (global as any).ShadowRoot = dom.window.ShadowRoot || class ShadowRoot {};
}

// =============================================================================
// 类型定义
// =============================================================================

/**
 * Vega 渲染器类型
 */
export type VegaRendererType = 'vega' | 'vega-lite';

/**
 * Vega 主题类型
 */
export type VegaTheme = 'light' | 'dark' | 'custom';

/**
 * Vega 输出格式
 */
export type VegaOutputFormat = 'svg' | 'png';

/**
 * Vega 渲染选项
 */
export interface VegaRenderOptions {
  /** 主题 */
  theme?: VegaTheme;
  /** 输出格式 */
  format?: VegaOutputFormat;
  /** 渲染器类型 */
  renderer?: 'canvas' | 'svg';
  /** 缩放因子（用于高分辨率输出） */
  scaleFactor?: number;
  /** 是否启用缓存 */
  cache?: boolean;
  /** 自定义配置 */
  config?: Record<string, unknown>;
}

/**
 * Vega 渲染器类
 * 
 * 实现 RendererPlugin 接口，提供 Vega/Vega-Lite 可视化渲染功能
 */
export class VegaRenderer implements RendererPlugin {
  readonly name: string;
  readonly version = '1.0.0';
  readonly extensions: string[];
  readonly pluginId = 'vega-renderer';
  
  private readonly type: VegaRendererType;
  private readonly defaultOptions: Required<VegaRenderOptions>;
  private readonly cache = new Map<string, { result: string; timestamp: number }>();
  private readonly cacheTTL = 5 * 60 * 1000;

  constructor(type: VegaRendererType = 'vega-lite') {
    this.type = type;
    this.name = type === 'vega' ? 'vega' : 'vega-lite';
    this.extensions = type === 'vega' ? ['vega', 'vg'] : ['vega-lite', 'vl'];
    
    this.defaultOptions = {
      theme: 'light',
      format: 'svg',
      renderer: 'svg', // 使用 SVG 渲染器（Node.js 环境兼容）
      scaleFactor: 2,
      cache: true,
      config: {},
    };
  }

  /**
   * 渲染 Vega/Vega-Lite 规范
   * 
   * @param content - Vega 或 Vega-Lite 规范（JSON 字符串）
   * @param options - 渲染选项
   * @returns 渲染结果（SVG 或 PNG 的 base64 编码字符串）
   */
  async render(content: string, options?: VegaRenderOptions): Promise<string> {
    const startTime = Date.now();
    
    // 合并选项
    const mergedOptions: Required<VegaRenderOptions> = {
      ...this.defaultOptions,
      ...options,
      config: { ...this.defaultOptions.config, ...options?.config },
    };

    // 检查缓存
    if (mergedOptions.cache) {
      const cacheKey = this.getCacheKey(content, mergedOptions);
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
        return cached.result;
      }
    }

    // 验证输入的 spec 格式
    let spec: Record<string, unknown>;
    try {
      spec = typeof content === 'string' ? JSON.parse(content) : content;
    } catch (error) {
      throw new Error(
        `Invalid Vega spec: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    try {
      // 创建 DOM 容器用于渲染
      const container = document.createElement('div');
      container.style.width = '100%';
      container.style.height = '100%';
      container.style.position = 'absolute';
      container.style.visibility = 'hidden';
      
      document.body.appendChild(container);

      // 配置 vega-embed 选项
      const embedOptions: Record<string, unknown> = {
        actions: false,
        renderer: mergedOptions.renderer,
        scaleFactor: mergedOptions.scaleFactor,
        theme: this.getThemeConfig(mergedOptions.theme),
        config: mergedOptions.config,
      };

      // 使用 vega-embed 渲染
      const result = await embed(container, spec, embedOptions);

      // 移除容器
      document.body.removeChild(container);

      if (!result) {
        throw new Error('Vega rendering failed: No result returned');
      }

      // 处理输出格式
      let finalContent: string;

      if (mergedOptions.format === 'png' && mergedOptions.renderer === 'canvas') {
        // 从 canvas 获取 PNG 数据
        const canvas = container.querySelector('canvas') as HTMLCanvasElement | null;
        if (!canvas) {
          throw new Error('Vega rendering failed: Canvas not found');
        }
        finalContent = canvas.toDataURL('image/png', 0.9);
      } else {
        // 获取 SVG 内容
        const svgElement = container.querySelector('svg') as SVGElement | null;
        if (!svgElement) {
          throw new Error('Vega rendering failed: SVG not found');
        }
        finalContent = svgElement.outerHTML;
      }

      // 缓存结果
      if (mergedOptions.cache) {
        const cacheKey = this.getCacheKey(content, mergedOptions);
        this.cache.set(cacheKey, {
          result: finalContent,
          timestamp: Date.now(),
        });
      }

      return finalContent;
    } catch (error) {
      // 清理可能残留的容器
      const container = document.querySelector('div[style*="visibility: hidden"]');
      if (container) {
        document.body.removeChild(container);
      }

      // 抛出格式化的错误信息
      throw new Error(
        `Vega render error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * 获取主题配置
   */
  private getThemeConfig(theme: VegaTheme): string | undefined {
    if (theme === 'custom') {
      return undefined;
    }
    return theme === 'dark' ? 'dark' : 'default';
  }

  /**
   * 生成缓存键
   */
  private getCacheKey(content: string, options: Required<VegaRenderOptions>): string {
    return `${this.type}:${content}:${options.theme}:${options.format}:${options.renderer}`;
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export default VegaRenderer;
