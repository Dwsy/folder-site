/**
 * XSS 防护模块
 * 
 * 功能：
 * - 使用 DOMPurify 清理 HTML 内容
 * - 可配置的允许标签和属性
 * - 支持自定义清理规则
 */

import DOMPurify from 'isomorphic-dompurify';
import type { SanitizeOptions, SanitizeResult } from './types.js';

/**
 * 默认的允许标签（Office 文档渲染所需的标签）
 */
const DEFAULT_ALLOWED_TAGS = [
  // 文档结构
  'div', 'span', 'p', 'br', 'hr',
  
  // 标题
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  
  // 列表
  'ul', 'ol', 'li',
  
  // 表格
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col',
  
  // 文本格式
  'strong', 'b', 'em', 'i', 'u', 's', 'sub', 'sup',
  
  // 链接（可选，默认禁用）
  // 'a',
  
  // 图片（可选，默认禁用）
  // 'img',
  
  // 代码
  'pre', 'code',
  
  // 引用
  'blockquote',
  
  // 分隔符
  'wbr',
  
  // 段落格式
  'address', 'article', 'aside', 'footer', 'header', 'main', 'section',
  
  // 元数据
  'time',
];

/**
 * 默认的允许属性
 */
const DEFAULT_ALLOWED_ATTRIBUTES = {
  // 表格相关
  '*': ['class', 'style', 'data-*'],
  'table': ['border', 'cellpadding', 'cellspacing', 'width', 'height', 'data-theme', 'data-show-grid'],
  'th': ['colspan', 'rowspan', 'scope', 'align', 'valign', 'width', 'height'],
  'td': ['colspan', 'rowspan', 'align', 'valign', 'width', 'height'],
  'col': ['span', 'width', 'align'],
  'colgroup': ['span'],
  
  // 通用属性
  'div': ['data-sheet', 'data-theme'],
  'button': ['data-sheet', 'type'],
  'span': ['data-*'],
  
  // 图片（如果启用）
  'img': ['src', 'alt', 'width', 'height', 'loading', 'data-*'],
  
  // 链接（如果启用）
  'a': ['href', 'target', 'rel', 'title'],
  
  // 时间
  'time': ['datetime'],
};

/**
 * 危险的协议（不允许的 URL 协议）
 */
const DANGEROUS_PROTOCOLS = [
  'javascript:',
  'data:',
  'vbscript:',
  'file:',
  'about:',
  'chrome:',
  'chrome-extension:',
  'ms-appx:',
  'ms-appx-web:',
];

/**
 * XSS 清理器
 */
export class XSSSanitizer {
  /** DOMPurify 配置 */
  private config: DOMPurify.Config;

  /** 是否启用严格模式 */
  private strictMode: boolean;

  /** 清理统计 */
  private stats: {
    totalCleaned: number;
    totalModified: number;
    totalErrors: number;
  };

  /**
   * 创建 XSS 清理器
   *
   * @param options - 清理选项
   */
  constructor(options?: SanitizeOptions) {
    this.strictMode = options?.strictMode ?? true;
    this.stats = {
      totalCleaned: 0,
      totalModified: 0,
      totalErrors: 0,
    };

    // 构建 DOMPurify 配置
    this.config = this.buildConfig(options);
  }

  /**
   * 清理 HTML 内容
   *
   * @param html - 待清理的 HTML
   * @returns 清理结果
   */
  sanitize(html: string): SanitizeResult {
    try {
      const originalLength = html.length;
      
      // 使用 DOMPurify 清理
      const cleanHtml = DOMPurify.sanitize(html, this.config);
      
      const cleanLength = cleanHtml.length;
      const wasModified = originalLength !== cleanLength;

      // 更新统计
      this.stats.totalCleaned++;
      if (wasModified) {
        this.stats.totalModified++;
      }

      return {
        clean: cleanHtml,
        wasModified,
        originalLength,
        cleanLength,
        removedLength: originalLength - cleanLength,
      };
    } catch (error) {
      this.stats.totalErrors++;

      // 严格模式下抛出错误，否则返回空字符串
      if (this.strictMode) {
        throw new Error(`XSS sanitization failed: ${error instanceof Error ? error.message : String(error)}`);
      }

      return {
        clean: '',
        wasModified: true,
        originalLength: html.length,
        cleanLength: 0,
        removedLength: html.length,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * 清理并返回 HTML 字符串（简化版）
   *
   * @param html - 待清理的 HTML
   * @returns 清理后的 HTML
   */
  sanitizeToString(html: string): string {
    return this.sanitize(html).clean;
  }

  /**
   * 批量清理 HTML
   *
   * @param htmlList - HTML 列表
   * @returns 清理结果列表
   */
  sanitizeMany(htmlList: string[]): SanitizeResult[] {
    return htmlList.map((html) => this.sanitize(html));
  }

  /**
   * 构建 DOMPurify 配置
   *
   * @param options - 清理选项
   * @returns DOMPurify 配置
   */
  private buildConfig(options?: SanitizeOptions): DOMPurify.Config {
    const config: DOMPurify.Config = {
      // 允许的标签
      ALLOWED_TAGS: options?.allowedTags ?? DEFAULT_ALLOWED_TAGS,
      
      // 允许的属性
      ALLOWED_ATTR: this.buildAllowedAttributes(options?.allowedAttributes),
      
      // 是否移除注释
      ALLOW_COMMENTS: options?.allowComments ?? false,
      
      // 是否保留空白
      KEEP_CONTENT: options?.keepContent ?? true,
      
      // 是否返回 DOM
      RETURN_DOM: false,
      
      // 是否返回 DOM 片段
      RETURN_DOM_FRAGMENT: false,
      
      // 是否返回导入节点
      RETURN_DOM_IMPORT: false,
      
      // 是否使用 DOM 文档
      USE_PROFILES: options?.useProfile,
      
      // 是否强制安全
      FORCE_BODY: options?.forceBody ?? false,
      
      // 是否允许未知协议
      ALLOW_UNKNOWN_PROTOCOLS: options?.allowUnknownProtocols ?? false,
    };

    // 添加可选的自定义钩子
    if (options?.addAttr) {
      config.ADD_ATTR = options.addAttr;
    }
    if (options?.addTags) {
      config.ADD_TAGS = options.addTags;
    }
    if (options?.forbidAttr) {
      config.FORBID_ATTR = options.forbidAttr;
    }
    if (options?.forbidTags) {
      config.FORBID_TAGS = options.forbidTags;
    }

    return config;
  }

  /**
   * 构建允许的属性列表
   *
   * @param customAttributes - 自定义属性配置
   * @returns 属性数组
   */
  private buildAllowedAttributes(
    customAttributes?: Record<string, string[]>
  ): string[] {
    const attributes: string[] = [];

    // 合并默认和自定义属性
    const mergedAttributes = {
      ...DEFAULT_ALLOWED_ATTRIBUTES,
      ...customAttributes,
    };

    // 转换为 DOMPurify 格式
    for (const [tag, attrs] of Object.entries(mergedAttributes)) {
      if (!attrs) continue;
      
      for (const attr of attrs) {
        if (attr === '*') {
          // 通配符属性
          if (tag === '*') {
            attributes.push(attr);
          } else {
            attributes.push(`${tag}.${attr}`);
          }
        } else if (attr.includes('*')) {
          // 正则表达式属性（转换为字符串形式）
          attributes.push(attr);
        } else {
          // 普通属性
          attributes.push(attr);
        }
      }
    }

    return attributes;
  }

  /**
   * 构建允许的 URI 正则表达式
   *
   * @param customProtocols - 自定义协议列表
   * @returns 正则表达式
   */
  private buildAllowedUriRegex(customProtocols?: string[]): RegExp {
    // 默认允许的协议
    const allowedProtocols = [
      'http://',
      'https://',
      'ftp://',
      'mailto:',
      'tel:',
      ...customProtocols || [],
    ];

    // 构建正则表达式
    const pattern = `^(?:(?:${allowedProtocols.map((p) => p.replace(/[:/]/g, '\\$&')).join('|')})|[^a-z]|[a-z+.-]+(?:[^a-z+.:]|$))`;

    return new RegExp(pattern, 'i');
  }

  /**
   * 检查 URL 是否安全
   *
   * @param url - URL 字符串
   * @returns 是否安全
   */
  isUrlSafe(url: string): boolean {
    const lowerUrl = url.toLowerCase();
    
    // 检查是否包含危险协议
    for (const protocol of DANGEROUS_PROTOCOLS) {
      if (lowerUrl.startsWith(protocol)) {
        return false;
      }
    }

    return true;
  }

  /**
   * 添加自定义标签
   *
   * @param tags - 标签列表
   */
  addAllowedTags(...tags: string[]): void {
    if (!this.config.ALLOWED_TAGS) {
      this.config.ALLOWED_TAGS = [];
    }
    this.config.ALLOWED_TAGS.push(...tags);
  }

  /**
   * 添加自定义属性
   *
   * @param attributes - 属性列表
   */
  addAllowedAttributes(...attributes: string[]): void {
    if (!this.config.ALLOWED_ATTR) {
      this.config.ALLOWED_ATTR = [];
    }
    this.config.ALLOWED_ATTR.push(...attributes);
  }

  /**
   * 添加禁止的标签
   *
   * @param tags - 标签列表
   */
  addForbiddenTags(...tags: string[]): void {
    if (!this.config.FORBID_TAGS) {
      this.config.FORBID_TAGS = [];
    }
    this.config.FORBID_TAGS.push(...tags);
  }

  /**
   * 添加禁止的属性
   *
   * @param attributes - 属性列表
   */
  addForbiddenAttributes(...attributes: string[]): void {
    if (!this.config.FORBID_ATTR) {
      this.config.FORBID_ATTR = [];
    }
    this.config.FORBID_ATTR.push(...attributes);
  }

  /**
   * 重置统计
   */
  resetStats(): void {
    this.stats = {
      totalCleaned: 0,
      totalModified: 0,
      totalErrors: 0,
    };
  }

  /**
   * 获取统计信息
   *
   * @returns 统计信息
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * 设置严格模式
   *
   * @param strict - 是否启用严格模式
   */
  setStrictMode(strict: boolean): void {
    this.strictMode = strict;
  }
}

/**
 * 创建默认的 XSS 清理器
 *
 * @param options - 清理选项
 * @returns XSS 清理器实例
 */
export function createXSSSanitizer(options?: SanitizeOptions): XSSSanitizer {
  return new XSSSanitizer(options);
}

/**
 * 默认的 XSS 清理器实例
 */
export const defaultXSSSanitizer = new XSSSanitizer({
  strictMode: true,
  keepContent: true,
});

/**
 * 便捷函数：清理 HTML 字符串
 *
 * @param html - 待清理的 HTML
 * @param options - 清理选项
 * @returns 清理后的 HTML
 */
export function sanitizeHtml(html: string, options?: SanitizeOptions): string {
  const sanitizer = new XSSSanitizer(options);
  return sanitizer.sanitizeToString(html);
}

/**
 * 便捷函数：批量清理 HTML 字符串
 *
 * @param htmlList - HTML 列表
 * @param options - 清理选项
 * @returns 清理后的 HTML 列表
 */
export function sanitizeHtmlMany(htmlList: string[], options?: SanitizeOptions): string[] {
  const sanitizer = new XSSSanitizer(options);
  return htmlList.map((html) => sanitizer.sanitizeToString(html));
}