/**
 * Markdown Parser - 基于 unified 生态的 Markdown 解析器
 * 
 * 功能特性：
 * - GFM 支持（表格、删除线、任务列表、自动链接等）
 * - Frontmatter 解析（YAML 元数据）
 * - 代码块语法高亮
 * - LaTeX 数学公式支持
 * - AST 输出（MDAST）
 * - HTML 渲染输出
 */

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkFrontmatter from 'remark-frontmatter';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import rehypeStringify from 'rehype-stringify';
import type { Root } from 'mdast';

import type {
  MarkdownParserOptions,
  ParseResult,
  FrontmatterData,
} from '../types/parser.js';

/**
 * 默认配置选项
 */
const DEFAULT_OPTIONS: Required<MarkdownParserOptions> = {
  gfm: true,
  frontmatter: true,
  highlight: true,
  math: true,
  highlightTheme: 'github',
  preserveContent: true,
  generateHTML: true,
};

/**
 * Markdown Parser 类
 *
 * 提供基于 unified 生态的 Markdown 解析功能
 *
 * @example
 * ```typescript
 * const parser = new MarkdownParser();
 * const result = parser.parse(markdown);
 * console.log(result.frontmatter); // YAML 元数据
 * console.log(result.html); // 渲染后的 HTML
 * ```
 */
export class MarkdownParser {
  private options: Required<MarkdownParserOptions>;
  private processor: any;

  /**
   * 构造函数
   * 
   * @param options - 解析器配置选项
   */
  constructor(options?: MarkdownParserOptions) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.buildProcessor();
  }

  /**
   * 构建 unified 处理器
   */
  private buildProcessor(): void {
    // @ts-ignore - TypeScript has issues with unified's type inference
    let processor = unified().use(remarkParse);

    // 启用 GFM
    if (this.options.gfm) {
      // @ts-ignore
      processor = processor.use(remarkGfm);
    }

    // 启用 frontmatter 解析
    if (this.options.frontmatter) {
      // @ts-ignore
      processor = processor.use(remarkFrontmatter, ['yaml']);
    }

    // 启用数学公式支持
    if (this.options.math) {
      // @ts-ignore
      processor = processor.use(remarkMath);
    }

    // 转换为 rehype AST
    // @ts-ignore
    processor = processor.use(remarkRehype, { allowDangerousHtml: true });

    // 启用代码高亮
    if (this.options.highlight) {
      // @ts-ignore
      processor = processor.use(rehypeHighlight);
    }

    // 启用 KaTeX 数学公式渲染
    if (this.options.math) {
      // @ts-ignore
      processor = processor.use(rehypeKatex, {
        throwOnError: false,
        strict: false,
      });
    }

    // 转换为 HTML 字符串
    // @ts-ignore
    processor = processor.use(rehypeStringify, { allowDangerousHtml: true });

    this.processor = processor;
  }

  /**
   * 解析 Markdown 内容（同步）
   * 
   * @param markdown - Markdown 内容
   * @returns 解析结果
   * 
   * @example
   * ```typescript
   * const result = parser.parse('# Hello\n\nThis is **bold**.');
   * console.log(result.html); // <h1>Hello</h1>\n<p>This is <strong>bold</strong>.</p>
   * ```
   */
  parse(markdown: string): ParseResult {
    if (!markdown || typeof markdown !== 'string') {
      throw new Error('Markdown content must be a non-empty string');
    }

    const startTime = performance.now();

    try {
      // 解析为 MDAST
      const ast = this.parseToAST(markdown);

      // 提取 frontmatter
      const frontmatter = this.extractFrontmatter(ast);

      // 渲染为 HTML
      const html = this.parseToHTML(markdown);

      const parseTime = performance.now() - startTime;

      return {
        ast,
        frontmatter,
        html,
        content: markdown,
        metadata: {
          codeBlocks: this.countCodeBlocks(markdown),
          mathExpressions: this.countMathExpressions(markdown),
          tables: this.countTables(markdown),
          taskListItems: this.countTaskListItems(markdown),
          links: this.countLinks(markdown),
          images: this.countImages(markdown),
          parseTime,
          hasFrontmatter: !!frontmatter,
        },
      };
    } catch (error) {
      throw new Error(
        `Failed to parse markdown: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * 解析 Markdown 内容（异步）
   * 
   * @param markdown - Markdown 内容
   * @returns Promise<ParseResult>
   * 
   * @example
   * ```typescript
   * const result = await parser.parseAsync(markdown);
   * ```
   */
  async parseAsync(markdown: string): Promise<ParseResult> {
    if (!markdown || typeof markdown !== 'string') {
      throw new Error('Markdown content must be a non-empty string');
    }

    const startTime = performance.now();

    try {
      // 解析为 MDAST
      const ast = await this.parseToASTAsync(markdown);

      // 提取 frontmatter
      const frontmatter = this.extractFrontmatter(ast);

      // 渲染为 HTML
      const html = await this.parseToHTMLAsync(markdown);

      const parseTime = performance.now() - startTime;

      return {
        ast,
        frontmatter,
        html,
        content: markdown,
        metadata: {
          codeBlocks: this.countCodeBlocks(markdown),
          mathExpressions: this.countMathExpressions(markdown),
          tables: this.countTables(markdown),
          taskListItems: this.countTaskListItems(markdown),
          links: this.countLinks(markdown),
          images: this.countImages(markdown),
          parseTime,
          hasFrontmatter: !!frontmatter,
        },
      };
    } catch (error) {
      throw new Error(
        `Failed to parse markdown: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * 将 Markdown 解析为 MDAST（同步）
   * 
   * @param markdown - Markdown 内容
   * @returns MDAST 根节点
   */
  parseToAST(markdown: string): Root {
    const processor = unified().use(remarkParse);

    if (this.options.frontmatter) {
      processor.use(remarkFrontmatter, ['yaml']);
    }

    if (this.options.gfm) {
      processor.use(remarkGfm);
    }

    if (this.options.math) {
      processor.use(remarkMath);
    }

    const result = processor.parse(markdown);
    return result as Root;
  }

  /**
   * 将 Markdown 解析为 MDAST（异步）
   * 
   * @param markdown - Markdown 内容
   * @returns Promise<Root>
   */
  async parseToASTAsync(markdown: string): Promise<Root> {
    return this.parseToAST(markdown);
  }

  /**
   * 将 Markdown 渲染为 HTML（同步）
   * 
   * @param markdown - Markdown 内容
   * @returns HTML 字符串
   * 
   * @example
   * ```typescript
   * const html = parser.parseToHTML('# Hello');
   * console.log(html); // <h1>Hello</h1>
   * ```
   */
  parseToHTML(markdown: string): string {
    if (!this.processor) {
      throw new Error('Processor not initialized');
    }

    const result = this.processor.processSync(markdown);
    return String(result);
  }

  /**
   * 将 Markdown 渲染为 HTML（异步）
   * 
   * @param markdown - Markdown 内容
   * @returns Promise<string>
   * 
   * @example
   * ```typescript
   * const html = await parser.parseToHTMLAsync(markdown);
   * ```
   */
  async parseToHTMLAsync(markdown: string): Promise<string> {
    if (!this.processor) {
      throw new Error('Processor not initialized');
    }

    const result = await this.processor.process(markdown);
    return String(result);
  }

  /**
   * 提取 frontmatter 数据
   * 
   * @param ast - MDAST 根节点
   * @returns Frontmatter 数据对象
   */
  private extractFrontmatter(ast: Root): FrontmatterData | undefined {
    if (!this.options.frontmatter) {
      return undefined;
    }

    const yamlNode = ast.children.find(
      (node): node is any => node.type === 'yaml'
    );

    if (!yamlNode || !yamlNode.value) {
      return undefined;
    }

    try {
      // 简单的 YAML 解析（实际项目中应使用 YAML 解析库）
      const yaml = yamlNode.value;
      const lines = yaml.split('\n');
      const data: FrontmatterData = {};

      for (const line of lines) {
        const match = line.match(/^(\w+(?:\.\w+)*):\s*(.+)$/);
        if (match) {
          const [, key, value] = match;
          // 尝试解析为 JSON 值
          try {
            data[key] = JSON.parse(value);
          } catch {
            data[key] = value.trim();
          }
        }
      }

      return Object.keys(data).length > 0 ? data : undefined;
    } catch (error) {
      console.warn('Failed to parse frontmatter:', error);
      return undefined;
    }
  }

  /**
   * 统计代码块数量
   * 
   * @param markdown - Markdown 内容
   * @returns 代码块数量
   */
  private countCodeBlocks(markdown: string): number {
    return (markdown.match(/```[\s\S]*?```/g) || []).length;
  }

  /**
   * 统计数学公式数量
   *
   * @param markdown - Markdown 内容
   * @returns 数学公式数量
   */
  private countMathExpressions(markdown: string): number {
    return (markdown.match(/\$\$[\s\S]*?\$\$|\$[^$\n]+?\$/g) || []).length;
  }

  /**
   * 统计表格数量
   *
   * @param markdown - Markdown 内容
   * @returns 表格数量
   */
  private countTables(markdown: string): number {
    return (markdown.match(/\|.*\|/g) || []).length;
  }

  /**
   * 统计任务列表项数量
   *
   * @param markdown - Markdown 内容
   * @returns 任务列表项数量
   */
  private countTaskListItems(markdown: string): number {
    return (markdown.match(/- \[[ x]\]/g) || []).length;
  }

  /**
   * 统计链接数量
   *
   * @param markdown - Markdown 内容
   * @returns 链接数量
   */
  private countLinks(markdown: string): number {
    return (markdown.match(/\[.*?\]\(.*?\)/g) || []).length;
  }

  /**
   * 统计图片数量
   *
   * @param markdown - Markdown 内容
   * @returns 图片数量
   */
  private countImages(markdown: string): number {
    return (markdown.match(/!\[.*?\]\(.*?\)/g) || []).length;
  }

  /**
   * 更新解析器选项
   * 
   * @param options - 新的配置选项
   */
  updateOptions(options: Partial<MarkdownParserOptions>): void {
    this.options = { ...this.options, ...options };
    this.buildProcessor();
  }

  /**
   * 获取当前配置选项
   * 
   * @returns 当前配置选项的副本
   */
  getOptions(): Readonly<Required<MarkdownParserOptions>> {
    return { ...this.options };
  }
}

/**
 * 创建带默认配置的 Markdown 解析器实例
 * 
 * @param options - 可选的配置选项
 * @returns MarkdownParser 实例
 * 
 * @example
 * ```typescript
 * const parser = createMarkdownParser({
 *   gfm: true,
 *   math: true,
 *   highlight: true,
 * });
 * ```
 */
export function createMarkdownParser(
  options?: MarkdownParserOptions
): MarkdownParser {
  return new MarkdownParser(options);
}

/**
 * 默认的 Markdown 解析器实例
 * 启用所有功能：GFM、frontmatter、代码高亮、数学公式
 */
export const defaultMarkdownParser = new MarkdownParser({
  gfm: true,
  frontmatter: true,
  highlight: true,
  math: true,
  highlightTheme: 'github',
});

/**
 * 快捷函数：解析 Markdown 内容
 * 
 * @param markdown - Markdown 内容
 * @param options - 可选的配置选项
 * @returns 解析结果
 * 
 * @example
 * ```typescript
 * const result = parseMarkdown(markdown);
 * console.log(result.html);
 * ```
 */
export function parseMarkdown(
  markdown: string,
  options?: MarkdownParserOptions
): ParseResult {
  const parser = new MarkdownParser(options);
  return parser.parse(markdown);
}

/**
 * 快捷函数：异步解析 Markdown 内容
 * 
 * @param markdown - Markdown 内容
 * @param options - 可选的配置选项
 * @returns Promise<ParseResult>
 * 
 * @example
 * ```typescript
 * const result = await parseMarkdownAsync(markdown);
 * ```
 */
export async function parseMarkdownAsync(
  markdown: string,
  options?: MarkdownParserOptions
): Promise<ParseResult> {
  const parser = new MarkdownParser(options);
  return parser.parseAsync(markdown);
}

/**
 * 快捷函数：将 Markdown 转换为 HTML
 * 
 * @param markdown - Markdown 内容
 * @param options - 可选的配置选项
 * @returns HTML 字符串
 * 
 * @example
 * ```typescript
 * const html = markdownToHTML(markdown);
 * ```
 */
export function markdownToHTML(
  markdown: string,
  options?: MarkdownParserOptions
): string {
  const parser = new MarkdownParser(options);
  return parser.parseToHTML(markdown);
}

/**
 * 快捷函数：异步将 Markdown 转换为 HTML
 * 
 * @param markdown - Markdown 内容
 * @param options - 可选的配置选项
 * @returns Promise<string>
 * 
 * @example
 * ```typescript
 * const html = await markdownToHTMLAsync(markdown);
 * ```
 */
export async function markdownToHTMLAsync(
  markdown: string,
  options?: MarkdownParserOptions
): Promise<string> {
  const parser = new MarkdownParser(options);
  return parser.parseToHTMLAsync(markdown);
}

// 导出类型
export type {
  MarkdownParserOptions,
  ParseResult,
  FrontmatterData,
  ParseMetadata,
} from '../types/parser.js';