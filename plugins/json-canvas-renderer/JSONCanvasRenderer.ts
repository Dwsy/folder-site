/**
 * JSON Canvas 渲染器核心实现
 *
 * 提供将 JSON Canvas 格式渲染为 SVG 的功能
 * 支持 JSON Canvas 规范：https://jsoncanvas.org/
 *
 * 核心功能：
 * - 支持 4 种节点类型（text, file, link, group）
 * - 支持边连接渲染
 * - 主题配置（light/dark/custom）
 * - SVG 输出格式
 * - 完善的错误处理
 * - 渲染结果缓存
 */

import type { RendererPlugin } from '../../src/server/lib/plugin-registry.js';

// =============================================================================
// 类型定义
// =============================================================================

/**
 * JSON Canvas 节点类型
 */
export type JSONCanvasNodeType = 'text' | 'file' | 'link' | 'group';

/**
 * 连接侧边类型
 */
export type Side = 'top' | 'right' | 'bottom' | 'left';

/**
 * 主题类型
 */
export type JSONCanvasTheme = 'light' | 'dark' | 'custom';

/**
 * JSON Canvas 节点数据
 */
export interface JSONCanvasNode {
  /** 节点唯一 ID */
  id: string;
  /** 节点类型 */
  type: JSONCanvasNodeType;
  /** X 坐标 */
  x: number;
  /** Y 坐标 */
  y: number;
  /** 宽度 */
  width: number;
  /** 高度 */
  height: number;
  /** 文本内容 */
  text?: string;
  /** 颜色 */
  color?: string;
  /** 颜色 ID */
  colorId?: string;
  /** 子节点 ID（用于 group 类型） */
  contains?: string[];
  /** 是否折叠 */
  collapsed?: boolean;
  /** 额外属性 */
  [key: string]: unknown;
}

/**
 * JSON Canvas 边数据
 */
export interface JSONCanvasEdge {
  /** 边唯一 ID */
  id: string;
  /** 起始节点 ID */
  fromNode: string;
  /** 起始连接侧边 */
  fromSide?: Side;
  /** 目标节点 ID */
  toNode: string;
  /** 目标连接侧边 */
  toSide?: Side;
  /** 边颜色 */
  color?: string;
  /** 边标签 */
  label?: string;
  /** 线条样式 */
  style?: 'solid' | 'dashed' | 'dotted';
  /** 线条宽度 */
  strokeWidth?: number;
  /** 额外属性 */
  [key: string]: unknown;
}

/**
 * JSON Canvas 数据结构
 */
export interface JSONCanvasData {
  /** 节点数组 */
  nodes?: JSONCanvasNode[];
  /** 边数组 */
  edges?: JSONCanvasEdge[];
  /** 版本 */
  version?: string;
  /** 额外属性 */
  [key: string]: unknown;
}

/**
 * 渲染选项
 */
export interface JSONCanvasRenderOptions {
  /** 主题 */
  theme?: JSONCanvasTheme;
  /** 背景颜色 */
  backgroundColor?: string;
  /** 字体大小 */
  fontSize?: number;
  /** 字体家族 */
  fontFamily?: string;
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
  /** 节点样式 */
  nodeStyles?: {
    /** 文本节点背景色 */
    textBackground?: string;
    /** 文本节点边框色 */
    textBorder?: string;
    /** 文本节点文字色 */
    textColor?: string;
    /** 文件节点背景色 */
    fileBackground?: string;
    /** 文件节点边框色 */
    fileBorder?: string;
    /** 链接节点背景色 */
    linkBackground?: string;
    /** 链接节点边框色 */
    linkBorder?: string;
    /** 组节点背景色 */
    groupBackground?: string;
    /** 组节点边框色 */
    groupBorder?: string;
    /** 边框圆角 */
    borderRadius?: number;
  };
  /** 边样式 */
  edgeStyles?: {
    /** 边颜色 */
    color?: string;
    /** 边宽度 */
    strokeWidth?: number;
    /** 箭头大小 */
    arrowSize?: number;
  };
}

/**
 * 渲染结果
 */
export interface JSONCanvasRenderResult {
  /** 渲染成功 */
  success: boolean;
  /** 渲染内容 */
  content?: string;
  /** 内容类型 */
  contentType?: 'image/svg+xml';
  /** 错误信息 */
  error?: string;
  /** 渲染耗时（毫秒） */
  duration: number;
  /** 是否来自缓存 */
  cached?: boolean;
  /** 节点数量 */
  nodeCount?: number;
  /** 边数量 */
  edgeCount?: number;
}

/**
 * 解析结果
 */
export interface JSONCanvasParseResult {
  /** 解析成功 */
  success: boolean;
  /** 错误信息 */
  error?: string;
  /** 解析后的数据 */
  data?: JSONCanvasData;
  /** 节点数量 */
  nodeCount?: number;
  /** 边数量 */
  edgeCount?: number;
}

// =============================================================================
// JSON Canvas 渲染器类
// =============================================================================

/**
 * JSON Canvas 渲染器
 *
 * 实现 RendererPlugin 接口，提供 JSON Canvas 渲染功能
 */
export class JSONCanvasRenderer implements RendererPlugin {
  /** 渲染器名称 */
  readonly name: string = 'json-canvas';

  /** 支持的文件扩展名 */
  readonly extensions: string[] = ['canvas', 'json'];

  /** 渲染器版本 */
  readonly version: string = '1.0.0';

  /** 插件 ID */
  readonly pluginId: string = 'json-canvas-renderer';

  /** 渲染缓存 */
  private cache: Map<string, { result: JSONCanvasRenderResult; timestamp: number }> = new Map();

  /** 缓存过期时间（毫秒） */
  private readonly cacheTTL: number = 5 * 60 * 1000; // 5 分钟

  /** 默认选项 */
  private defaultOptions: JSONCanvasRenderOptions = {
    theme: 'light',
    backgroundColor: 'transparent',
    fontSize: 14,
    fontFamily: 'sans-serif',
    cache: true,
    svgOptions: {
      includeXmlDeclaration: false,
      compress: false,
    },
    nodeStyles: {
      textBackground: '#ffffff',
      textBorder: '#e0e0e0',
      textColor: '#000000',
      fileBackground: '#f0f0f0',
      fileBorder: '#d0d0d0',
      linkBackground: '#e6f3ff',
      linkBorder: '#b3d9ff',
      groupBackground: '#fafafa',
      groupBorder: '#cccccc',
      borderRadius: 4,
    },
    edgeStyles: {
      color: '#999999',
      strokeWidth: 2,
      arrowSize: 8,
    },
  };

  /**
   * 解析 JSON Canvas 内容
   *
   * @param content - JSON Canvas 内容
   * @returns 解析结果
   */
  parse(content: string): JSONCanvasParseResult {
    try {
      // 解析 JSON
      let data: JSONCanvasData;
      try {
        data = JSON.parse(content);
      } catch (error) {
        return {
          success: false,
          error: `Invalid JSON format: ${error instanceof Error ? error.message : String(error)}`,
        };
      }

      // 验证基本结构
      if (typeof data !== 'object' || data === null) {
        return {
          success: false,
          error: 'JSON Canvas data must be an object',
        };
      }

      // 验证节点和边
      const nodes = data.nodes || [];
      const edges = data.edges || [];

      if (!Array.isArray(nodes)) {
        return {
          success: false,
          error: 'nodes must be an array',
        };
      }

      if (!Array.isArray(edges)) {
        return {
          success: false,
          error: 'edges must be an array',
        };
      }

      // 验证每个节点的必需字段
      for (const node of nodes) {
        if (!node.id) {
          return {
            success: false,
            error: 'Node missing required field: id',
          };
        }
        if (!node.type) {
          return {
            success: false,
            error: `Node "${node.id}" missing required field: type`,
          };
        }
        if (typeof node.x !== 'number' || typeof node.y !== 'number') {
          return {
            success: false,
            error: `Node "${node.id}" missing required fields: x, y`,
          };
        }
        if (typeof node.width !== 'number' || typeof node.height !== 'number') {
          return {
            success: false,
            error: `Node "${node.id}" missing required fields: width, height`,
          };
        }
      }

      // 验证每个边的必需字段
      for (const edge of edges) {
        if (!edge.id) {
          return {
            success: false,
            error: 'Edge missing required field: id',
          };
        }
        if (!edge.fromNode || !edge.toNode) {
          return {
            success: false,
            error: `Edge "${edge.id}" missing required fields: fromNode, toNode`,
          };
        }
      }

      return {
        success: true,
        data,
        nodeCount: nodes.length,
        edgeCount: edges.length,
      };
    } catch (error) {
      return {
        success: false,
        error: `Parse error: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * 渲染 JSON Canvas 为 SVG
   *
   * @param content - JSON Canvas 内容
   * @param options - 渲染选项
   * @returns SVG 内容
   */
  async render(content: string, options?: JSONCanvasRenderOptions): Promise<string> {
    const startTime = Date.now();

    // 合并选项
    const mergedOptions: JSONCanvasRenderOptions = {
      ...this.defaultOptions,
      ...options,
      svgOptions: { ...this.defaultOptions.svgOptions, ...options?.svgOptions },
      nodeStyles: { ...this.defaultOptions.nodeStyles, ...options?.nodeStyles },
      edgeStyles: { ...this.defaultOptions.edgeStyles, ...options?.edgeStyles },
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

    // 解析内容
    const parseResult = this.parse(content);
    if (!parseResult.success) {
      throw new Error(parseResult.error);
    }

    const data = parseResult.data!;
    const nodes = data.nodes || [];
    const edges = data.edges || [];

    try {
      // 计算画布边界
      const bounds = this.calculateBounds(nodes);

      // 生成 SVG
      const svg = this.generateSVG(nodes, edges, bounds, mergedOptions);

      // 处理 SVG 输出
      const finalContent = this.processSvg(svg, mergedOptions.svgOptions, mergedOptions);

      // 缓存结果
      if (mergedOptions.cache) {
        const cacheKey = this.getCacheKey(content, mergedOptions);
        this.cache.set(cacheKey, {
          result: {
            success: true,
            content: finalContent,
            contentType: 'image/svg+xml',
            duration: Date.now() - startTime,
            nodeCount: nodes.length,
            edgeCount: edges.length,
          },
          timestamp: Date.now(),
        });
      }

      return finalContent;
    } catch (error) {
      throw new Error(
        `JSON Canvas render error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * 计算画布边界
   *
   * @param nodes - 节点数组
   * @returns 边界 { minX, minY, maxX, maxY }
   */
  private calculateBounds(nodes: JSONCanvasNode[]): {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  } {
    if (nodes.length === 0) {
      return { minX: 0, minY: 0, maxX: 100, maxY: 100 };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const node of nodes) {
      minX = Math.min(minX, node.x);
      minY = Math.min(minY, node.y);
      maxX = Math.max(maxX, node.x + node.width);
      maxY = Math.max(maxY, node.y + node.height);
    }

    // 添加边距
    const padding = 50;
    return {
      minX: minX - padding,
      minY: minY - padding,
      maxX: maxX + padding,
      maxY: maxY + padding,
    };
  }

  /**
   * 生成 SVG
   *
   * @param nodes - 节点数组
   * @param edges - 边数组
   * @param bounds - 画布边界
   * @param options - 渲染选项
   * @returns SVG 字符串
   */
  private generateSVG(
    nodes: JSONCanvasNode[],
    edges: JSONCanvasEdge[],
    bounds: { minX: number; minY: number; maxX: number; maxY: number },
    options: JSONCanvasRenderOptions
  ): string {
    const width = bounds.maxX - bounds.minX;
    const height = bounds.maxY - bounds.minY;

    // 获取主题样式
    const themeStyles = this.getThemeStyles(options);

    // 构建 SVG
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${bounds.minX} ${bounds.minY} ${width} ${height}" style="background-color: ${options.backgroundColor}; font-family: ${options.fontFamily}; font-size: ${options.fontSize}px;">`;

    // 添加定义（箭头标记等）
    svg += this.generateDefinitions(themeStyles);

    // 先渲染边（在节点下方）
    for (const edge of edges) {
      svg += this.renderEdge(edge, nodes, themeStyles);
    }

    // 渲染节点
    // 先渲染 group 节点（在底层）
    const groupNodes = nodes.filter((n) => n.type === 'group');
    for (const node of groupNodes) {
      svg += this.renderNode(node, themeStyles);
    }

    // 然后渲染其他节点
    const otherNodes = nodes.filter((n) => n.type !== 'group');
    for (const node of otherNodes) {
      svg += this.renderNode(node, themeStyles);
    }

    svg += '</svg>';

    return svg;
  }

  /**
   * 生成 SVG 定义（箭头标记等）
   *
   * @param styles - 主题样式
   * @returns 定义字符串
   */
  private generateDefinitions(styles: {
    edgeColor: string;
    arrowSize: number;
  }): string {
    return `
    <defs>
      <marker id="arrowhead" markerWidth="${styles.arrowSize}" markerHeight="${styles.arrowSize}" refX="${styles.arrowSize}" refY="${styles.arrowSize / 2}" orient="auto">
        <polygon points="0 0, ${styles.arrowSize} ${styles.arrowSize / 2}, 0 ${styles.arrowSize}" fill="${styles.edgeColor}" />
      </marker>
      <marker id="arrowhead-start" markerWidth="${styles.arrowSize}" markerHeight="${styles.arrowSize}" refX="0" refY="${styles.arrowSize / 2}" orient="auto-start-reverse">
        <polygon points="${styles.arrowSize} 0, 0 ${styles.arrowSize / 2}, ${styles.arrowSize} ${styles.arrowSize}" fill="${styles.edgeColor}" />
      </marker>
    </defs>`;
  }

  /**
   * 渲染节点
   *
   * @param node - 节点数据
   * @param styles - 主题样式
   * @returns SVG 元素字符串
   */
  private renderNode(
    node: JSONCanvasNode,
    styles: {
      textBackground: string;
      textBorder: string;
      textColor: string;
      fileBackground: string;
      fileBorder: string;
      linkBackground: string;
      linkBorder: string;
      groupBackground: string;
      groupBorder: string;
      borderRadius: number;
    }
  ): string {
    let element = '';

    switch (node.type) {
      case 'text':
        element = this.renderTextNode(node, styles);
        break;
      case 'file':
        element = this.renderFileNode(node, styles);
        break;
      case 'link':
        element = this.renderLinkNode(node, styles);
        break;
      case 'group':
        element = this.renderGroupNode(node, styles);
        break;
      default:
        // 未知类型，使用 text 节点样式
        element = this.renderTextNode(node, styles);
    }

    return element;
  }

  /**
   * 渲染文本节点
   *
   * @param node - 节点数据
   * @param styles - 主题样式
   * @returns SVG 元素字符串
   */
  private renderTextNode(
    node: JSONCanvasNode,
    styles: {
      textBackground: string;
      textBorder: string;
      textColor: string;
      borderRadius: number;
    }
  ): string {
    const background = node.color || styles.textBackground;
    const borderColor = styles.textBorder;
    const textColor = styles.textColor;
    const borderRadius = styles.borderRadius;

    let svg = `<g transform="translate(${node.x}, ${node.y})">`;
    svg += `<rect x="0" y="0" width="${node.width}" height="${node.height}" fill="${background}" stroke="${borderColor}" stroke-width="1" rx="${borderRadius}" ry="${borderRadius}" />`;

    if (node.text) {
      svg += this.renderTextContent(node.text, node.width, node.height, textColor);
    }

    svg += '</g>';
    return svg;
  }

  /**
   * 渲染文件节点
   *
   * @param node - 节点数据
   * @param styles - 主题样式
   * @returns SVG 元素字符串
   */
  private renderFileNode(
    node: JSONCanvasNode,
    styles: {
      fileBackground: string;
      fileBorder: string;
      textColor: string;
      borderRadius: number;
    }
  ): string {
    const background = node.color || styles.fileBackground;
    const borderColor = styles.fileBorder;
    const textColor = styles.textColor;
    const borderRadius = styles.borderRadius;

    let svg = `<g transform="translate(${node.x}, ${node.y})">`;
    svg += `<rect x="0" y="0" width="${node.width}" height="${node.height}" fill="${background}" stroke="${borderColor}" stroke-width="1" rx="${borderRadius}" ry="${borderRadius}" />`;

    // 添加文件图标
    const iconSize = 16;
    svg += `<rect x="8" y="8" width="${iconSize}" height="${iconSize * 1.2}" fill="none" stroke="${borderColor}" stroke-width="1.5" rx="2" />`;
    svg += `<line x1="12" y1="14" x2="20" y2="14" stroke="${borderColor}" stroke-width="1.5" />`;
    svg += `<line x1="12" y1="18" x2="20" y2="18" stroke="${borderColor}" stroke-width="1.5" />`;
    svg += `<line x1="12" y1="22" x2="18" y2="22" stroke="${borderColor}" stroke-width="1.5" />`;

    if (node.text) {
      svg += this.renderTextContent(node.text, node.width, node.height, textColor, 32);
    }

    svg += '</g>';
    return svg;
  }

  /**
   * 渲染链接节点
   *
   * @param node - 节点数据
   * @param styles - 主题样式
   * @returns SVG 元素字符串
   */
  private renderLinkNode(
    node: JSONCanvasNode,
    styles: {
      linkBackground: string;
      linkBorder: string;
      textColor: string;
      borderRadius: number;
    }
  ): string {
    const background = node.color || styles.linkBackground;
    const borderColor = styles.linkBorder;
    const textColor = styles.textColor;
    const borderRadius = styles.borderRadius;

    let svg = `<g transform="translate(${node.x}, ${node.y})">`;
    svg += `<rect x="0" y="0" width="${node.width}" height="${node.height}" fill="${background}" stroke="${borderColor}" stroke-width="1" rx="${borderRadius}" ry="${borderRadius}" />`;

    // 添加链接图标
    const iconSize = 16;
    const centerX = node.width / 2;
    svg += `<line x1="${centerX - iconSize}" y1="16" x2="${centerX - 4}" y2="16" stroke="${borderColor}" stroke-width="1.5" />`;
    svg += `<line x1="${centerX + 4}" y1="16" x2="${centerX + iconSize}" y2="16" stroke="${borderColor}" stroke-width="1.5" />`;
    svg += `<circle cx="${centerX}" cy="16" r="3" fill="${borderColor}" />`;

    if (node.text) {
      svg += this.renderTextContent(node.text, node.width, node.height, textColor, 32);
    }

    svg += '</g>';
    return svg;
  }

  /**
   * 渲染组节点
   *
   * @param node - 节点数据
   * @param styles - 主题样式
   * @returns SVG 元素字符串
   */
  private renderGroupNode(
    node: JSONCanvasNode,
    styles: {
      groupBackground: string;
      groupBorder: string;
      textColor: string;
      borderRadius: number;
    }
  ): string {
    const background = node.color || styles.groupBackground;
    const borderColor = styles.groupBorder;
    const textColor = styles.textColor;
    const borderRadius = styles.borderRadius;

    let svg = `<g transform="translate(${node.x}, ${node.y})">`;

    // 组节点使用虚线边框
    svg += `<rect x="0" y="0" width="${node.width}" height="${node.height}" fill="${background}" stroke="${borderColor}" stroke-width="1" stroke-dasharray="5,5" rx="${borderRadius}" ry="${borderRadius}" />`;

    if (node.text) {
      svg += this.renderTextContent(node.text, node.width, node.height, textColor);
    }

    svg += '</g>';
    return svg;
  }

  /**
   * 渲染文本内容
   *
   * @param text - 文本内容
   * @param width - 容器宽度
   * @param height - 容器高度
   * @param color - 文本颜色
   * @param offsetY - Y 轴偏移
   * @returns SVG 文本元素字符串
   */
  private renderTextContent(text: string, width: number, height: number, color: string, offsetY: number = 0): string {
    // 简单的文本换行处理
    const lines = this.wrapText(text, width - 20); // 减去边距
    const lineHeight = 18;

    let svg = '';
    const startY = (height - lines.length * lineHeight) / 2 + lineHeight + offsetY;

    for (let i = 0; i < lines.length; i++) {
      svg += `<text x="${width / 2}" y="${startY + i * lineHeight}" text-anchor="middle" fill="${color}" dominant-baseline="middle">${this.escapeXml(lines[i])}</text>`;
    }

    return svg;
  }

  /**
   * 文本换行处理
   *
   * @param text - 原始文本
   * @param maxWidth - 最大宽度（字符数）
   * @returns 换行后的文本数组
   */
  private wrapText(text: string, maxWidth: number): string[] {
    const lines: string[] = [];
    const words = text.split(' ');
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (testLine.length > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  /**
   * 渲染边
   *
   * @param edge - 边数据
   * @param nodes - 节点数组（用于查找节点位置）
   * @param styles - 主题样式
   * @returns SVG 元素字符串
   */
  private renderEdge(
    edge: JSONCanvasEdge,
    nodes: JSONCanvasNode[],
    styles: {
      edgeColor: string;
      strokeWidth: number;
      arrowSize: number;
    }
  ): string {
    // 查找起始和目标节点
    const fromNode = nodes.find((n) => n.id === edge.fromNode);
    const toNode = nodes.find((n) => n.id === edge.toNode);

    if (!fromNode || !toNode) {
      // 无法找到节点，跳过渲染
      return '';
    }

    // 计算连接点
    const fromPoint = this.getConnectionPoint(fromNode, edge.fromSide, 'out');
    const toPoint = this.getConnectionPoint(toNode, edge.toSide, 'in');

    // 计算曲线路径
    const path = this.calculateBezierPath(fromPoint, toPoint, edge.fromSide, edge.toSide);

    const color = edge.color || styles.edgeColor;
    const strokeWidth = edge.strokeWidth || styles.strokeWidth;

    let svg = `<path d="${path}" stroke="${color}" stroke-width="${strokeWidth}" fill="none" marker-end="url(#arrowhead)"`;

    // 如果需要虚线样式
    if (edge.style === 'dashed') {
      svg += ' stroke-dasharray="8,4"';
    } else if (edge.style === 'dotted') {
      svg += ' stroke-dasharray="2,2"';
    }

    svg += ' />';

    // 渲染标签（如果有）
    if (edge.label) {
      const midX = (fromPoint.x + toPoint.x) / 2;
      const midY = (fromPoint.y + toPoint.y) / 2;
      svg += `<text x="${midX}" y="${midY}" text-anchor="middle" fill="${color}" font-size="12" dominant-baseline="middle">${this.escapeXml(edge.label)}</text>`;
    }

    return svg;
  }

  /**
   * 获取连接点
   *
   * @param node - 节点数据
   * @param side - 连接侧边
   * @param type - 连接类型
   * @returns 连接点坐标
   */
  private getConnectionPoint(
    node: JSONCanvasNode,
    side: Side | undefined,
    type: 'in' | 'out'
  ): { x: number; y: number } {
    const x = node.x;
    const y = node.y;
    const width = node.width;
    const height = node.height;

    switch (side) {
      case 'top':
        return { x: x + width / 2, y: y };
      case 'bottom':
        return { x: x + width / 2, y: y + height };
      case 'left':
        return { x: x, y: y + height / 2 };
      case 'right':
        return { x: x + width, y: y + height / 2 };
      default:
        // 根据相对位置自动选择侧边
        return { x: x + width / 2, y: y + height / 2 };
    }
  }

  /**
   * 计算贝塞尔曲线路径
   *
   * @param from - 起点
   * @param to - 终点
   * @param fromSide - 起始侧边
   * @param toSide - 目标侧边
   * @returns SVG 路径字符串
   */
  private calculateBezierPath(
    from: { x: number; y: number },
    to: { x: number; y: number },
    fromSide: Side | undefined,
    toSide: Side | undefined
  ): string {
    const dx = to.x - from.x;
    const dy = to.y - from.y;

    // 控制点偏移量
    const controlOffset = Math.abs(dx) * 0.5 + 50;

    // 根据连接侧边确定控制点
    let cp1x = from.x;
    let cp1y = from.y;
    let cp2x = to.x;
    let cp2y = to.y;

    if (fromSide === 'right' || (!fromSide && dx > 0)) {
      cp1x = from.x + controlOffset;
    } else if (fromSide === 'left' || (!fromSide && dx < 0)) {
      cp1x = from.x - controlOffset;
    } else if (fromSide === 'top') {
      cp1y = from.y - controlOffset;
    } else if (fromSide === 'bottom') {
      cp1y = from.y + controlOffset;
    }

    if (toSide === 'left' || (!toSide && dx > 0)) {
      cp2x = to.x - controlOffset;
    } else if (toSide === 'right' || (!toSide && dx < 0)) {
      cp2x = to.x + controlOffset;
    } else if (toSide === 'top') {
      cp2y = to.y - controlOffset;
    } else if (toSide === 'bottom') {
      cp2y = to.y + controlOffset;
    }

    return `M ${from.x} ${from.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${to.x} ${to.y}`;
  }

  /**
   * 获取主题样式
   *
   * @param options - 渲染选项
   * @returns 主题样式对象
   */
  private getThemeStyles(options: JSONCanvasRenderOptions): {
    textBackground: string;
    textBorder: string;
    textColor: string;
    fileBackground: string;
    fileBorder: string;
    linkBackground: string;
    linkBorder: string;
    groupBackground: string;
    groupBorder: string;
    borderRadius: number;
    edgeColor: string;
    strokeWidth: number;
    arrowSize: number;
  } {
    const theme = options.theme;

    if (theme === 'dark') {
      return {
        textBackground: '#2d2d2d',
        textBorder: '#555555',
        textColor: '#ffffff',
        fileBackground: '#3d3d3d',
        fileBorder: '#666666',
        linkBackground: '#1a3a5c',
        linkBorder: '#4a7ab0',
        groupBackground: '#252525',
        groupBorder: '#444444',
        borderRadius: options.nodeStyles?.borderRadius || 4,
        edgeColor: '#888888',
        strokeWidth: options.edgeStyles?.strokeWidth || 2,
        arrowSize: options.edgeStyles?.arrowSize || 8,
      };
    }

    if (theme === 'custom' && options.customTheme) {
      // 应用自定义主题
      return {
        textBackground: String(options.customTheme.textBackground || options.nodeStyles?.textBackground || '#ffffff'),
        textBorder: String(options.customTheme.textBorder || options.nodeStyles?.textBorder || '#e0e0e0'),
        textColor: String(options.customTheme.textColor || options.nodeStyles?.textColor || '#000000'),
        fileBackground: String(options.customTheme.fileBackground || options.nodeStyles?.fileBackground || '#f0f0f0'),
        fileBorder: String(options.customTheme.fileBorder || options.nodeStyles?.fileBorder || '#d0d0d0'),
        linkBackground: String(options.customTheme.linkBackground || options.nodeStyles?.linkBackground || '#e6f3ff'),
        linkBorder: String(options.customTheme.linkBorder || options.nodeStyles?.linkBorder || '#b3d9ff'),
        groupBackground: String(options.customTheme.groupBackground || options.nodeStyles?.groupBackground || '#fafafa'),
        groupBorder: String(options.customTheme.groupBorder || options.nodeStyles?.groupBorder || '#cccccc'),
        borderRadius: (options.customTheme.borderRadius as number) || options.nodeStyles?.borderRadius || 4,
        edgeColor: String(options.customTheme.edgeColor || options.edgeStyles?.color || '#999999'),
        strokeWidth: (options.customTheme.strokeWidth as number) || options.edgeStyles?.strokeWidth || 2,
        arrowSize: (options.customTheme.arrowSize as number) || options.edgeStyles?.arrowSize || 8,
      };
    }

    // 默认浅色主题
    return {
      textBackground: options.nodeStyles?.textBackground || '#ffffff',
      textBorder: options.nodeStyles?.textBorder || '#e0e0e0',
      textColor: options.nodeStyles?.textColor || '#000000',
      fileBackground: options.nodeStyles?.fileBackground || '#f0f0f0',
      fileBorder: options.nodeStyles?.fileBorder || '#d0d0d0',
      linkBackground: options.nodeStyles?.linkBackground || '#e6f3ff',
      linkBorder: options.nodeStyles?.linkBorder || '#b3d9ff',
      groupBackground: options.nodeStyles?.groupBackground || '#fafafa',
      groupBorder: options.nodeStyles?.groupBorder || '#cccccc',
      borderRadius: options.nodeStyles?.borderRadius || 4,
      edgeColor: options.edgeStyles?.color || '#999999',
      strokeWidth: options.edgeStyles?.strokeWidth || 2,
      arrowSize: options.edgeStyles?.arrowSize || 8,
    };
  }

  /**
   * 处理 SVG 输出
   *
   * @param svg - 原始 SVG
   * @param svgOptions - SVG 选项
   * @param renderOptions - 渲染选项
   * @returns 处理后的 SVG
   */
  private processSvg(
    svg: string,
    svgOptions?: { includeXmlDeclaration?: boolean; compress?: boolean },
    renderOptions?: JSONCanvasRenderOptions
  ): string {
    let processed = svg;

    // 移除或添加 XML 声明
    if (svgOptions?.includeXmlDeclaration) {
      if (!processed.startsWith('<?xml')) {
        processed = `<?xml version="1.0" encoding="UTF-8"?>\n${processed}`;
      }
    } else {
      processed = processed.replace(/^<\?xml[^>]*\?>\s*/, '');
    }

    // 压缩 SVG（移除不必要的空白）
    if (svgOptions?.compress) {
      processed = processed.replace(/\s+/g, ' ').trim();
    }

    return processed;
  }

  /**
   * XML 转义
   *
   * @param text - 原始文本
   * @returns 转义后的文本
   */
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * 生成缓存键
   *
   * @param content - 内容
   * @param options - 选项
   * @returns 缓存键
   */
  private getCacheKey(content: string, options: JSONCanvasRenderOptions): string {
    const optionsStr = JSON.stringify({
      theme: options.theme,
      backgroundColor: options.backgroundColor,
      fontSize: options.fontSize,
      fontFamily: options.fontFamily,
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
   * 获取支持的节点类型列表
   *
   * @returns 支持的节点类型
   */
  getSupportedNodeTypes(): JSONCanvasNodeType[] {
    return ['text', 'file', 'link', 'group'];
  }

  /**
   * 检查是否支持指定的节点类型
   *
   * @param type - 节点类型
   * @returns 是否支持
   */
  isNodeTypeSupported(type: string): boolean {
    return this.getSupportedNodeTypes().includes(type as JSONCanvasNodeType);
  }

  /**
   * 获取渲染器状态
   *
   * @returns 渲染器状态信息
   */
  getStatus(): {
    cacheSize: number;
    supportedNodeTypes: JSONCanvasNodeType[];
  } {
    return {
      cacheSize: this.cache.size,
      supportedNodeTypes: this.getSupportedNodeTypes(),
    };
  }
}

// =============================================================================
// 默认导出
// =============================================================================

export default JSONCanvasRenderer;