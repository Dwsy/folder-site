/**
 * AST Transformer - Markdown AST 到 HTML 的转换器
 * 
 * 功能特性：
 * - 将 MDAST 转换为 HTML
 * - 支持代码块语法高亮（使用 Shiki）
 * - 处理表格、列表、链接、图片等所有 Markdown 元素
 * - 插件系统支持自定义转换行为
 * - 访问者模式遍历 AST
 * - 类型安全的转换逻辑
 */

import type { Root, Content, PhrasingContent } from 'mdast';
import {
  getHighlighter,
  type Highlighter,
  type BundledLanguage,
  type BundledTheme,
} from 'shiki';

import type {
  TransformerOptions,
  TransformerResult,
  TransformerPlugin,
  TransformerPluginContext,
  NodeTransformer,
  TransformerStats,
  CodeHighlightOptions,
} from '../../types/transformer.js';

/**
 * 默认转换器配置选项
 */
const DEFAULT_OPTIONS: Required<TransformerOptions> = {
  highlight: true,
  highlightTheme: 'github',
  semantic: true,
  classPrefix: '',
  sanitize: false,
  pretty: false,
  plugins: [],
};

/**
 * AST Transformer 类
 *
 * 提供将 Markdown AST 转换为 HTML 的功能
 *
 * @example
 * ```typescript
 * const transformer = new ASTTransformer();
 * const result = transformer.transform(ast);
 * console.log(result.html); // 转换后的 HTML
 * ```
 */
export class ASTTransformer {
  private options: Required<TransformerOptions>;
  private highlighter: Highlighter | null = null;
  private plugins: TransformerPlugin[] = [];
  private stats: TransformerStats;

  /**
   * 构造函数
   * 
   * @param options - 转换器配置选项
   */
  constructor(options?: TransformerOptions) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.plugins = [...(this.options.plugins || [])];
    this.stats = {
      nodesProcessed: 0,
      nodesTransformed: 0,
      codeBlocksHighlighted: 0,
      transformationTime: 0,
    };
  }

  /**
   * 初始化语法高亮器
   */
  private async initHighlighter(): Promise<void> {
    if (!this.options.highlight || this.highlighter) {
      return;
    }

    try {
      this.highlighter = await getHighlighter({
        themes: [this.options.highlightTheme as BundledTheme],
        langs: ['javascript', 'typescript', 'python', 'java', 'cpp', 'go', 'rust', 'bash', 'json', 'yaml', 'markdown'],
      });
    } catch (error) {
      console.warn('Failed to initialize highlighter:', error);
      this.highlighter = null;
    }
  }

  /**
   * 转换 AST 为 HTML（同步）
   * 
   * @param ast - MDAST 根节点
   * @returns 转换结果
   * 
   * @example
   * ```typescript
   * const result = transformer.transform(ast);
   * console.log(result.html);
   * ```
   */
  transform(ast: Root): TransformerResult {
    const startTime = performance.now();
    
    // 重置统计信息
    this.stats = {
      nodesProcessed: 0,
      nodesTransformed: 0,
      codeBlocksHighlighted: 0,
      transformationTime: 0,
    };

    try {
      // 转换根节点
      const html = this.transformRoot(ast);
      
      // 格式化 HTML（如果启用）
      const finalHtml = this.options.pretty ? this.prettifyHTML(html) : html;

      this.stats.transformationTime = performance.now() - startTime;

      return {
        html: finalHtml,
        stats: { ...this.stats },
      };
    } catch (error) {
      throw new Error(
        `Failed to transform AST: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * 转换 AST 为 HTML（异步）
   * 
   * @param ast - MDAST 根节点
   * @returns Promise<TransformerResult>
   * 
   * @example
   * ```typescript
   * const result = await transformer.transformAsync(ast);
   * ```
   */
  async transformAsync(ast: Root): Promise<TransformerResult> {
    // 初始化语法高亮器
    await this.initHighlighter();

    return this.transform(ast);
  }

  /**
   * 转换根节点
   */
  private transformRoot(node: Root): string {
    this.stats.nodesProcessed++;
    
    const context: TransformerPluginContext = {
      options: this.options,
      stats: this.stats,
      highlighter: this.highlighter,
    };

    // 应用根节点前置插件
    let children = node.children;
    for (const plugin of this.plugins) {
      if (plugin.beforeRoot) {
        children = plugin.beforeRoot(children, context) || children;
      }
    }

    // 转换子节点
    const content = children.map(child => this.transformNode(child)).join('\n');

    // 应用根节点后置插件
    let html = `<div class="${this.prefixClass('markdown')}">${content}</div>`;
    for (const plugin of this.plugins) {
      if (plugin.afterRoot) {
        html = plugin.afterRoot(html, context) || html;
      }
    }

    this.stats.nodesTransformed++;
    return html;
  }

  /**
   * 转换节点（分发到具体转换器）
   */
  private transformNode(node: Content): string {
    this.stats.nodesProcessed++;

    // 应用节点前置插件
    let transformedNode = node;
    for (const plugin of this.plugins) {
      if (plugin.beforeNode) {
        transformedNode = plugin.beforeNode(transformedNode) || transformedNode;
      }
    }

    // 根据节点类型分发
    let html = '';
    switch (node.type) {
      case 'paragraph':
        html = this.transformParagraph(node);
        break;
      case 'heading':
        html = this.transformHeading(node);
        break;
      case 'text':
        html = this.transformText(node);
        break;
      case 'emphasis':
        html = this.transformEmphasis(node);
        break;
      case 'strong':
        html = this.transformStrong(node);
        break;
      case 'delete':
        html = this.transformDelete(node);
        break;
      case 'inlineCode':
        html = this.transformInlineCode(node);
        break;
      case 'code':
        html = this.transformCode(node);
        break;
      case 'link':
        html = this.transformLink(node);
        break;
      case 'image':
        html = this.transformImage(node);
        break;
      case 'list':
        html = this.transformList(node);
        break;
      case 'listItem':
        html = this.transformListItem(node);
        break;
      case 'blockquote':
        html = this.transformBlockquote(node);
        break;
      case 'thematicBreak':
        html = this.transformThematicBreak(node);
        break;
      case 'table':
        html = this.transformTable(node);
        break;
      case 'tableRow':
        html = this.transformTableRow(node);
        break;
      case 'tableCell':
        html = this.transformTableCell(node);
        break;
      case 'html':
        html = this.transformHTML(node);
        break;
      case 'break':
        html = this.transformBreak(node);
        break;
      case 'definition':
        html = ''; // 定义节点不生成 HTML
        break;
      case 'yaml':
        html = ''; // YAML 节点不生成 HTML
        break;
      case 'toml':
        html = ''; // TOML 节点不生成 HTML
        break;
      default:
        html = '';
    }

    // 应用节点后置插件
    for (const plugin of this.plugins) {
      if (plugin.afterNode) {
        html = plugin.afterNode(html, node) || html;
      }
    }

    this.stats.nodesTransformed++;
    return html;
  }

  /**
   * 转换段落
   */
  private transformParagraph(node: any): string {
    const content = this.transformPhrasingContent(node.children);
    return `<p>${content}</p>`;
  }

  /**
   * 转换标题
   */
  private transformHeading(node: any): string {
    const level = node.depth || 1;
    const content = this.transformPhrasingContent(node.children);
    const tag = this.options.semantic ? `h${level}` : 'div';
    return `<${tag} class="${this.prefixClass(`heading-${level}`)}">${content}</${tag}>`;
  }

  /**
   * 转换文本
   */
  private transformText(node: any): string {
    return this.escapeHTML(node.value || '');
  }

  /**
   * 转换斜体
   */
  private transformEmphasis(node: any): string {
    const content = this.transformPhrasingContent(node.children);
    return `<em>${content}</em>`;
  }

  /**
   * 转换粗体
   */
  private transformStrong(node: any): string {
    const content = this.transformPhrasingContent(node.children);
    return `<strong>${content}</strong>`;
  }

  /**
   * 转换删除线
   */
  private transformDelete(node: any): string {
    const content = this.transformPhrasingContent(node.children);
    return `<del>${content}</del>`;
  }

  /**
   * 转换行内代码
   */
  private transformInlineCode(node: any): string {
    const code = this.escapeHTML(node.value || '');
    return `<code class="${this.prefixClass('inline-code')}">${code}</code>`;
  }

  /**
   * 转换代码块
   */
  private transformCode(node: any): string {
    const code = node.value || '';
    const lang = node.lang || 'text';
    const meta = node.meta || '';

    // 如果启用了语法高亮且有高亮器
    if (this.options.highlight && this.highlighter) {
      try {
        const highlighted = this.highlighter.codeToHtml(code, {
          lang: lang as BundledLanguage,
          theme: this.options.highlightTheme as BundledTheme,
        });
        this.stats.codeBlocksHighlighted++;
        return `<div class="${this.prefixClass('code-block')}">${highlighted}</div>`;
      } catch (error) {
        console.warn(`Failed to highlight code for language: ${lang}`, error);
      }
    }

    // 降级到普通代码块
    const escapedCode = this.escapeHTML(code);
    const langClass = lang ? ` language-${lang}` : '';
    return `<pre class="${this.prefixClass('code-block')}${langClass}"><code>${escapedCode}</code></pre>`;
  }

  /**
   * 转换链接
   */
  private transformLink(node: any): string {
    const content = this.transformPhrasingContent(node.children);
    const href = this.escapeHTML(node.url || '');
    const title = node.title ? ` title="${this.escapeHTML(node.title)}"` : '';
    return `<a href="${href}"${title} class="${this.prefixClass('link')}">${content}</a>`;
  }

  /**
   * 转换图片
   */
  private transformImage(node: any): string {
    const alt = this.escapeHTML(node.alt || '');
    const src = this.escapeHTML(node.url || '');
    const title = node.title ? ` title="${this.escapeHTML(node.title)}"` : '';
    return `<img src="${src}" alt="${alt}"${title} class="${this.prefixClass('image')}" />`;
  }

  /**
   * 转换列表
   */
  private transformList(node: any): string {
    const ordered = node.ordered || false;
    const start = node.start || 1;
    const content = node.children.map((child: any) => this.transformNode(child)).join('\n');
    const tag = ordered ? 'ol' : 'ul';
    const startAttr = ordered && start !== 1 ? ` start="${start}"` : '';
    const className = this.prefixClass(ordered ? 'ordered-list' : 'unordered-list');
    return `<${tag}${startAttr} class="${className}">${content}</${tag}>`;
  }

  /**
   * 转换列表项
   */
  private transformListItem(node: any): string {
    const content = node.children.map((child: any) => this.transformNode(child)).join('');
    const checked = node.checked;
    const checkedAttr = checked !== undefined ? ` data-checked="${checked}"` : '';
    return `<li${checkedAttr} class="${this.prefixClass('list-item')}">${content}</li>`;
  }

  /**
   * 转换引用块
   */
  private transformBlockquote(node: any): string {
    const content = node.children.map((child: any) => this.transformNode(child)).join('\n');
    return `<blockquote class="${this.prefixClass('blockquote')}">${content}</blockquote>`;
  }

  /**
   * 转换分隔线
   */
  private transformThematicBreak(node: any): string {
    return `<hr class="${this.prefixClass('hr')}" />`;
  }

  /**
   * 转换表格
   */
  private transformTable(node: any): string {
    const content = node.children.map((child: any) => this.transformNode(child)).join('\n');
    return `<table class="${this.prefixClass('table')}">\n${content}\n</table>`;
  }

  /**
   * 转换表格行
   */
  private transformTableRow(node: any): string {
    const content = node.children.map((child: any) => this.transformNode(child)).join('');
    return `<tr class="${this.prefixClass('table-row')}">${content}</tr>`;
  }

  /**
   * 转换单元格
   */
  private transformTableCell(node: any): string {
    const content = this.transformPhrasingContent(node.children);
    // 判断是否是表头单元格
    const isHeader = node.type === 'tableCell' && 
                     (node as any).tagName === 'th';
    const tag = isHeader ? 'th' : 'td';
    const align = (node as any).align ? ` style="text-align: ${(node as any).align}"` : '';
    return `<${tag}${align} class="${this.prefixClass(`table-cell ${tag}`)}">${content}</${tag}>`;
  }

  /**
   * 转换 HTML 内容
   */
  private transformHTML(node: any): string {
    if (this.options.sanitize) {
      // 如果启用净化，则跳过 HTML 节点
      return '';
    }
    return node.value || '';
  }

  /**
   * 转换换行
   */
  private transformBreak(node: any): string {
    return '<br />';
  }

  /**
   * 转换短语内容（行内元素）
   */
  private transformPhrasingContent(children: PhrasingContent[]): string {
    return children.map(child => this.transformNode(child)).join('');
  }

  /**
   * 添加 CSS 类名前缀
   */
  private prefixClass(className: string): string {
    if (!this.options.classPrefix) {
      return className;
    }
    return `${this.options.classPrefix}-${className}`;
  }

  /**
   * 转义 HTML 特殊字符
   */
  private escapeHTML(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return text.replace(/[&<>"']/g, char => map[char]);
  }

  /**
   * 美化 HTML（简单格式化）
   */
  private prettifyHTML(html: string): string {
    return html
      .replace(/><(?!\/)/g, '>\n<')
      .replace(/(<\/\w+>)</g, '$1\n<')
      .replace(/^\n+|\n+$/g, '');
  }

  /**
   * 注册插件
   * 
   * @param plugin - 插件对象
   */
  registerPlugin(plugin: TransformerPlugin): void {
    this.plugins.push(plugin);
  }

  /**
   * 注销插件
   * 
   * @param plugin - 插件对象或名称
   */
  unregisterPlugin(plugin: TransformerPlugin | string): void {
    if (typeof plugin === 'string') {
      this.plugins = this.plugins.filter(p => p.name !== plugin);
    } else {
      this.plugins = this.plugins.filter(p => p !== plugin);
    }
  }

  /**
   * 更新转换器选项
   * 
   * @param options - 新的配置选项
   */
  updateOptions(options: Partial<TransformerOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * 获取当前配置选项
   * 
   * @returns 当前配置选项的副本
   */
  getOptions(): Readonly<Required<TransformerOptions>> {
    return { ...this.options };
  }

  /**
   * 获取统计信息
   * 
   * @returns 统计信息
   */
  getStats(): Readonly<TransformerStats> {
    return { ...this.stats };
  }

  /**
   * 重置统计信息
   */
  resetStats(): void {
    this.stats = {
      nodesProcessed: 0,
      nodesTransformed: 0,
      codeBlocksHighlighted: 0,
      transformationTime: 0,
    };
  }
}

/**
 * 创建带默认配置的 AST 转换器实例
 * 
 * @param options - 可选的配置选项
 * @returns ASTTransformer 实例
 * 
 * @example
 * ```typescript
 * const transformer = createASTTransformer({
 *   highlight: true,
 *   highlightTheme: 'github-dark',
 * });
 * ```
 */
export function createASTTransformer(options?: TransformerOptions): ASTTransformer {
  return new ASTTransformer(options);
}

/**
 * 默认的 AST 转换器实例
 * 启用所有功能：语法高亮、语义化标签
 */
export const defaultASTTransformer = new ASTTransformer({
  highlight: true,
  highlightTheme: 'github',
  semantic: true,
});

/**
 * 快捷函数：转换 AST 为 HTML（同步）
 * 
 * @param ast - MDAST 根节点
 * @param options - 可选的配置选项
 * @returns HTML 字符串
 * 
 * @example
 * ```typescript
 * const html = transformAST(ast);
 * ```
 */
export function transformAST(ast: Root, options?: TransformerOptions): string {
  const transformer = new ASTTransformer(options);
  const result = transformer.transform(ast);
  return result.html;
}

/**
 * 快捷函数：转换 AST 为 HTML（异步）
 * 
 * @param ast - MDAST 根节点
 * @param options - 可选的配置选项
 * @returns Promise<string>
 * 
 * @example
 * ```typescript
 * const html = await transformASTAsync(ast);
 * ```
 */
export async function transformASTAsync(ast: Root, options?: TransformerOptions): Promise<string> {
  const transformer = new ASTTransformer(options);
  const result = await transformer.transformAsync(ast);
  return result.html;
}

/**
 * 内置插件：添加 ID 到标题
 */
export function headingIdPlugin(): TransformerPlugin {
  return {
    name: 'heading-id',
    beforeNode(node) {
      if (node.type === 'heading') {
        const text = (node as any).children
          .map((c: any) => c.value || '')
          .join('')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
        (node as any).id = text;
      }
      return node;
    },
    afterNode(html, node) {
      if (node.type === 'heading' && (node as any).id) {
        const tag = `h${(node as any).depth}`;
        const id = (node as any).id;
        // 简单地修改 HTML 添加 id
        return html.replace(new RegExp(`^<${tag}`), `<${tag} id="${id}"`);
      }
      return html;
    },
  };
}

/**
 * 内置插件：任务列表支持
 */
export function taskListPlugin(): TransformerPlugin {
  return {
    name: 'task-list',
    afterNode(html, node) {
      if (node.type === 'listItem' && (node as any).checked !== undefined) {
        const checked = (node as any).checked;
        const checkbox = `<input type="checkbox" ${checked ? 'checked' : ''} disabled />`;
        return html.replace(/^<li/, `<li class="task-list-item ${checked ? 'checked' : ''}">${checkbox}`);
      }
      return html;
    },
  };
}

/**
 * 内置插件：外部链接添加 target="_blank"
 */
export function externalLinkPlugin(): TransformerPlugin {
  return {
    name: 'external-link',
    afterNode(html, node) {
      if (node.type === 'link') {
        const url = (node as any).url || '';
        if (url.startsWith('http://') || url.startsWith('https://')) {
          return html.replace(
            /^<a /,
            '<a target="_blank" rel="noopener noreferrer" '
          );
        }
      }
      return html;
    },
  };
}

// 导出类型
export type {
  TransformerOptions,
  TransformerResult,
  TransformerPlugin,
  TransformerPluginContext,
  NodeTransformer,
  TransformerStats,
  CodeHighlightOptions,
} from '../../types/transformer.js';