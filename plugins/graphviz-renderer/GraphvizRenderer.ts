/**
 * Graphviz 渲染器核心实现
 * 
 * 提供将 Graphviz DOT 代码渲染为 SVG、PNG 等格式的功能
 * 支持多种布局引擎：dot, neato, fdp, sfdp, twopi, circo
 * 支持多种图表类型：有向图、无向图、子图、集群等
 * 
 * 核心功能：
 * - 支持 6 种 Graphviz 布局引擎
 * - 主题配置（light/dark/custom）
 * - 输出格式支持（SVG、PNG）
 * - 完善的错误处理
 * - 渲染结果缓存
 */

import { instance } from '@viz-js/viz';
import type { RendererPlugin } from '../../src/server/lib/plugin-registry.js';

// =============================================================================
// 类型定义
// =============================================================================

/**
 * Graphviz 布局引擎类型
 */
export type GraphvizEngine =
  | 'dot'    // 默认引擎，适合层次化图表
  | 'neato'  // 适合无向图
  | 'fdp'    // 力导向布局，适合大型无向图
  | 'sfdp'   // 可扩展的力导向布局
  | 'twopi'  // 径向布局
  | 'circo'; // 圆形布局

/**
 * 主题类型
 */
export type GraphvizTheme = 'light' | 'dark' | 'custom';

/**
 * 输出格式类型
 */
export type OutputFormat = 'svg';

/**
 * 渲染选项
 */
export interface GraphvizRenderOptions {
  /** 主题 */
  theme?: GraphvizTheme;
  
  /** 输出格式 */
  format?: OutputFormat;
  
  /** 布局引擎 */
  engine?: GraphvizEngine;
  
  /** 字体大小 */
  fontSize?: number;
  
  /** 字体家族 */
  fontFamily?: string;
  
  /** 背景颜色 */
  backgroundColor?: string;
  
  /** 节点颜色 */
  nodeColor?: string;
  
  /** 边颜色 */
  edgeColor?: string;
  
  /** 字体颜色 */
  fontColor?: string;
  
  /** 自定义主题配置（仅当 theme 为 custom 时生效） */
  customTheme?: Record<string, unknown>;
  
  /** 是否启用缓存 */
  cache?: boolean;
  
  /** SVG 配置 */
  svgOptions?: {
    /** 是否包含 XML 声明 */
    includeXmlDeclaration?: boolean;
    /** 是否压缩 SVG */
    compress?: boolean;
  };
  
  /** PNG 配置 */
  pngOptions?: {
    /** 缩放比例 */
    scale?: number;
    /** 图片质量（1-100） */
    quality?: number;
  };
  
  /** 是否启用 Y 倒置（适用于某些布局引擎） */
  yInvert?: boolean;
  
  /** 图形属性 */
  graphAttributes?: Record<string, string>;
  
  /** 节点属性 */
  nodeAttributes?: Record<string, string>;
  
  /** 边属性 */
  edgeAttributes?: Record<string, string>;
}

/**
 * 渲染结果
 */
export interface GraphvizRenderResult {
  /** 渲染成功 */
  success: boolean;
  
  /** 渲染内容 */
  content?: string;
  
  /** 内容类型 */
  contentType?: 'image/svg+xml' | 'image/png';
  
  /** 错误信息 */
  error?: string;
  
  /** 使用的引擎 */
  engine?: GraphvizEngine;
  
  /** 渲染耗时（毫秒） */
  duration: number;
  
  /** 是否来自缓存 */
  cached?: boolean;
}

/**
 * 解析结果
 */
export interface GraphvizParseResult {
  /** 解析成功 */
  success: boolean;
  
  /** 图表类型 */
  graphType?: 'digraph' | 'graph' | 'subgraph';
  
  /** 错误信息 */
  error?: string;
  
  /** 解析后的代码 */
  code?: string;
  
  /** 检测到的引擎 */
  detectedEngine?: GraphvizEngine;
}

// =============================================================================
// Graphviz 渲染器类
// =============================================================================

/**
 * Graphviz 渲染器
 * 
 * 实现 RendererPlugin 接口，提供 Graphviz DOT 图表渲染功能
 */
export class GraphvizRenderer implements RendererPlugin {
  /** 渲染器名称 */
  readonly name: string = 'graphviz';
  
  /** 支持的文件扩展名 */
  readonly extensions: string[] = ['.dot', '.gv', '.graphviz'];
  
  /** 渲染器版本 */
  readonly version: string = '1.0.0';
  
  /** 插件 ID */
  readonly pluginId: string = 'graphviz-renderer';
  
  /** Graphviz 实例 */
  private vizInstance: any = null;
  
  /** Graphviz 是否已初始化 */
  private initialized: boolean = false;
  
  /** 渲染缓存 */
  private cache: Map<string, { result: GraphvizRenderResult; timestamp: number }> = new Map();
  
  /** 缓存过期时间（毫秒） */
  private readonly cacheTTL: number = 5 * 60 * 1000; // 5 分钟
  
  /** 默认选项 */
  private defaultOptions: GraphvizRenderOptions = {
    theme: 'light',
    format: 'svg',
    engine: 'dot',
    fontSize: 14,
    fontFamily: 'sans-serif',
    backgroundColor: 'transparent',
    nodeColor: '#ffffff',
    edgeColor: '#000000',
    fontColor: '#000000',
    cache: true,
    svgOptions: {
      includeXmlDeclaration: false,
      compress: false,
    },
    yInvert: false,
  };

  /**
   * 初始化 Graphviz
   */
  private async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // 加载 Graphviz WASM 实例
      this.vizInstance = await instance();
      
      if (!this.vizInstance) {
        throw new Error('Failed to load Graphviz WASM module');
      }

      this.initialized = true;
    } catch (error) {
      throw new Error(`Failed to initialize Graphviz: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 解析 Graphviz DOT 代码，识别图表类型
   * 
   * @param code - DOT 代码
   * @returns 解析结果
   */
  parse(code: string): GraphvizParseResult {
    try {
      const trimmedCode = code.trim();
      
      // 检测图表类型
      const graphType = this.detectGraphType(trimmedCode);
      
      if (!graphType) {
        return {
          success: false,
          error: 'Unable to detect Graphviz graph type. Ensure the code starts with "digraph" or "graph".',
        };
      }

      // 验证基本语法（简单验证）
      try {
        // 尝试解析以验证语法
        const bracesCount = (trimmedCode.match(/\{/g) || []).length;
        const closingBracesCount = (trimmedCode.match(/\}/g) || []).length;
        
        if (bracesCount !== closingBracesCount) {
          return {
            success: false,
            error: 'Graphviz syntax error: Unbalanced braces',
          };
        }
      } catch (error) {
        return {
          success: false,
          error: `Graphviz syntax error: ${error instanceof Error ? error.message : String(error)}`,
        };
      }

      // 检测推荐的布局引擎
      const detectedEngine = this.detectRecommendedEngine(trimmedCode, graphType);

      return {
        success: true,
        graphType,
        code: trimmedCode,
        detectedEngine,
      };
    } catch (error) {
      return {
        success: false,
        error: `Parse error: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * 渲染 Graphviz 图表
   * 
   * @param content - DOT 代码
   * @param options - 渲染选项
   * @returns 渲染结果
   */
  async render(
    content: string,
    options?: GraphvizRenderOptions
  ): Promise<string> {
    const startTime = Date.now();
    
    // 合并选项
    const mergedOptions: GraphvizRenderOptions = {
      ...this.defaultOptions,
      ...options,
      svgOptions: { ...this.defaultOptions.svgOptions, ...options?.svgOptions },
      pngOptions: { ...this.defaultOptions.pngOptions, ...options?.pngOptions },
      graphAttributes: { ...options?.graphAttributes },
      nodeAttributes: { ...options?.nodeAttributes },
      edgeAttributes: { ...options?.edgeAttributes },
    };

    // 检查缓存
    if (mergedOptions.cache) {
      const cacheKey = this.getCacheKey(content, mergedOptions);
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
        cached.result.cached = true;
        return cached.result.content || '';
      }
    }

    // 初始化 Graphviz
    await this.initialize();

    // 解析代码
    const parseResult = this.parse(content);
    if (!parseResult.success) {
      throw new Error(parseResult.error);
    }

    try {
      // 应用主题和样式
      const styledCode = this.applyTheme(parseResult.code || content, mergedOptions);

      // 使用 Graphviz 渲染（仅支持 SVG 格式）
      const result = this.vizInstance.render(styledCode, {
        format: 'svg',
        engine: mergedOptions.engine,
        yInvert: mergedOptions.yInvert,
      });

      if (!result || result.status === 'failure') {
        const errorMessage = result?.errors?.map(e => e.message).join(', ') || 'Unknown error';
        throw new Error(`Graphviz rendering failed: ${errorMessage}`);
      }

      if (!result.output) {
        throw new Error('Graphviz rendering failed: No output generated');
      }

      // 处理 SVG 输出
      const finalContent = this.processSvg(result.output, mergedOptions.svgOptions, mergedOptions);

      // 缓存结果
      if (mergedOptions.cache) {
        const cacheKey = this.getCacheKey(content, mergedOptions);
        this.cache.set(cacheKey, {
          result: {
            success: true,
            content: finalContent,
            contentType: 'image/svg+xml',
            engine: mergedOptions.engine,
            duration: Date.now() - startTime,
          },
          timestamp: Date.now(),
        });
      }

      return finalContent;
    } catch (error) {
      throw new Error(
        `Graphviz render error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * 检测图表类型
   * 
   * @param code - DOT 代码
   * @returns 图表类型
   */
  private detectGraphType(code: string): 'digraph' | 'graph' | 'subgraph' | undefined {
    const firstLine = code.split('\n')[0].trim().toLowerCase();
    
    if (firstLine.startsWith('digraph')) {
      return 'digraph';
    }
    if (firstLine.startsWith('graph') && !firstLine.startsWith('graphviz')) {
      return 'graph';
    }
    if (firstLine.startsWith('subgraph')) {
      return 'subgraph';
    }
    
    return undefined;
  }

  /**
   * 检测推荐的布局引擎
   * 
   * @param code - DOT 代码
   * @param graphType - 图表类型
   * @returns 推荐的引擎
   */
  private detectRecommendedEngine(code: string, graphType: 'digraph' | 'graph' | 'subgraph'): GraphvizEngine {
    // 对于有向图，默认使用 dot
    if (graphType === 'digraph') {
      return 'dot';
    }
    
    // 对于无向图，使用 neato 或 fdp
    if (graphType === 'graph') {
      // 检查节点数量，如果节点较多使用 fdp
      const nodeCount = (code.match(/\w+\s*=/g) || []).length;
      if (nodeCount > 20) {
        return 'fdp';
      }
      return 'neato';
    }
    
    // 子图默认使用 dot
    return 'dot';
  }

  /**
   * 应用主题和样式到 DOT 代码
   * 
   * @param code - DOT 代码
   * @param options - 渲染选项
   * @returns 应用样式后的代码
   */
  private applyTheme(code: string, options: GraphvizRenderOptions): string {
    let styledCode = code;
    
    // 提取图表类型
    const graphType = this.detectGraphType(code);
    
    // 构建全局属性
    const graphAttrs: string[] = [];
    const nodeAttrs: string[] = [];
    const edgeAttrs: string[] = [];
    
    // 应用主题
    const theme = options.theme;
    if (theme === 'light') {
      nodeAttrs.push(`fillcolor="${options.nodeColor}"`, `fontcolor="${options.fontColor}"`);
      edgeAttrs.push(`color="${options.edgeColor}"`, `fontcolor="${options.fontColor}"`);
    } else if (theme === 'dark') {
      nodeAttrs.push('fillcolor="#2d2d2d"', 'fontcolor="#ffffff"');
      edgeAttrs.push('color="#888888"', 'fontcolor="#ffffff"');
    }
    
    // 应用字体设置
    nodeAttrs.push(`fontsize=${options.fontSize}`, `fontname="${options.fontFamily}"`);
    edgeAttrs.push(`fontsize=${options.fontSize}`, `fontname="${options.fontFamily}"`);
    
    // 应用自定义属性
    if (options.graphAttributes) {
      Object.entries(options.graphAttributes).forEach(([key, value]) => {
        graphAttrs.push(`${key}="${value}"`);
      });
    }
    if (options.nodeAttributes) {
      Object.entries(options.nodeAttributes).forEach(([key, value]) => {
        nodeAttrs.push(`${key}="${value}"`);
      });
    }
    if (options.edgeAttributes) {
      Object.entries(options.edgeAttributes).forEach(([key, value]) => {
        edgeAttrs.push(`${key}="${value}"`);
      });
    }
    
    // 构建属性字符串
    const attrStrings: string[] = [];
    if (graphAttrs.length > 0) {
      attrStrings.push(`graph [${graphAttrs.join(', ')}];`);
    }
    if (nodeAttrs.length > 0) {
      attrStrings.push(`node [${nodeAttrs.join(', ')}];`);
    }
    if (edgeAttrs.length > 0) {
      attrStrings.push(`edge [${edgeAttrs.join(', ')}];`);
    }
    
    // 如果已有属性定义，则跳过
    if (!attrStrings.every(s => code.includes(s.split('[')[0]))) {
      // 在第一个 { 后插入属性
      const firstBraceIndex = styledCode.indexOf('{');
      if (firstBraceIndex !== -1) {
        styledCode = styledCode.slice(0, firstBraceIndex + 1) +
                     '\n  ' +
                     attrStrings.join('\n  ') +
                     '\n  ' +
                     styledCode.slice(firstBraceIndex + 1);
      }
    }
    
    return styledCode;
  }

  /**
   * 处理 SVG 输出
   * 
   * @param svg - 原始 SVG
   * @param options - SVG 选项
   * @param renderOptions - 渲染选项
   * @returns 处理后的 SVG
   */
  private processSvg(
    svg: string,
    options?: { includeXmlDeclaration?: boolean; compress?: boolean },
    renderOptions?: GraphvizRenderOptions
  ): string {
    let processed = svg;

    // 添加背景色
    if (renderOptions && renderOptions.backgroundColor !== 'transparent') {
      processed = processed.replace(
        /<svg/,
        `<svg style="background-color: ${renderOptions.backgroundColor}"`
      );
    }

    // 移除或添加 XML 声明
    if (options?.includeXmlDeclaration) {
      if (!processed.startsWith('<?xml')) {
        processed = `<?xml version="1.0" encoding="UTF-8"?>\n${processed}`;
      }
    } else {
      processed = processed.replace(/^<\?xml[^>]*\?>\s*/, '');
    }

    // 压缩 SVG（移除不必要的空白）
    if (options?.compress) {
      processed = processed.replace(/\s+/g, ' ').trim();
    }

    return processed;
  }

  /**
   * 生成缓存键
   * 
   * @param content - 内容
   * @param options - 选项
   * @returns 缓存键
   */
  private getCacheKey(content: string, options: GraphvizRenderOptions): string {
    const optionsStr = JSON.stringify({
      theme: options.theme,
      format: options.format,
      engine: options.engine,
      fontSize: options.fontSize,
      fontFamily: options.fontFamily,
      backgroundColor: options.backgroundColor,
      nodeColor: options.nodeColor,
      edgeColor: options.edgeColor,
      fontColor: options.fontColor,
    });
    return `${content}-${optionsStr}`;
  }

  /**
   * 清空缓存
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * 获取缓存大小
   * 
   * @returns 缓存中的项目数量
   */
  getCacheSize(): number {
    return this.cache.size;
  }

  /**
   * 清理过期缓存
   */
  cleanExpiredCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.cacheTTL) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 获取支持的布局引擎列表
   * 
   * @returns 支持的引擎
   */
  getSupportedEngines(): GraphvizEngine[] {
    return ['dot', 'neato', 'fdp', 'sfdp', 'twopi', 'circo'];
  }

  /**
   * 检查是否支持指定的引擎
   * 
   * @param engine - 引擎名称
   * @returns 是否支持
   */
  isEngineSupported(engine: string): boolean {
    return this.getSupportedEngines().includes(engine as GraphvizEngine);
  }

  /**
   * 获取渲染器状态
   * 
   * @returns 渲染器状态信息
   */
  getStatus(): {
    initialized: boolean;
    cacheSize: number;
    supportedEngines: GraphvizEngine[];
    supportedFormats: OutputFormat[];
  } {
    return {
      initialized: this.initialized,
      cacheSize: this.cache.size,
      supportedEngines: this.getSupportedEngines(),
      supportedFormats: ['svg'],
    };
  }
}

// =============================================================================
// 默认导出
// =============================================================================

export default GraphvizRenderer;