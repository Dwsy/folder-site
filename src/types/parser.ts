/**
 * Parser 类型定义
 * 
 * 定义了 Markdown 解析器相关的类型和接口
 */

import type { Root } from 'mdast';

/**
 * Markdown 解析器配置选项
 */
export interface MarkdownParserOptions {
  /**
   * 是否启用 GFM (GitHub Flavored Markdown)
   * @default true
   */
  gfm?: boolean;

  /**
   * 是否解析 frontmatter
   * @default true
   */
  frontmatter?: boolean;

  /**
   * 是否启用代码高亮
   * @default true
   */
  highlight?: boolean;

  /**
   * 是否支持 LaTeX 公式
   * @default true
   */
  math?: boolean;

  /**
   * 是否支持 Mermaid 图表
   * @default true
   */
  mermaid?: boolean;

  /**
   * 代码高亮主题
   * @default 'github'
   */
  highlightTheme?: string;

  /**
   * 是否保留原始内容
   * @default true
   */
  preserveContent?: boolean;

  /**
   * 是否生成 HTML 输出
   * @default false
   */
  generateHTML?: boolean;
}

/**
 * 解析结果
 */
export interface ParseResult {
  /**
   * 解析后的 MDAST
   */
  ast: Root;

  /**
   * 提取的 frontmatter 数据
   */
  frontmatter?: Record<string, any>;

  /**
   * 渲染后的 HTML (可选)
   */
  html?: string;

  /**
   * 原始 Markdown 内容
   */
  content: string;

  /**
   * 解析元数据
   */
  metadata: ParseMetadata;
}

/**
 * 解析元数据
 */
export interface ParseMetadata {
  /**
   * 代码块数量
   */
  codeBlocks: number;

  /**
   * 数学公式数量
   */
  mathExpressions: number;

  /**
   * 表格数量
   */
  tables: number;

  /**
   * 任务列表项数量
   */
  taskListItems: number;

  /**
   * 链接数量
   */
  links: number;

  /**
   * 图片数量
   */
  images: number;

  /**
   * 解析时间（毫秒）
   */
  parseTime: number;

  /**
   * 是否包含 frontmatter
   */
  hasFrontmatter: boolean;
}

/**
 * Frontmatter 数据
 */
export interface FrontmatterData {
  /**
   * 标题
   */
  title?: string;

  /**
   * 描述
   */
  description?: string;

  /**
   * 作者
   */
  author?: string;

  /**
   * 创建日期
   */
  date?: string;

  /**
   * 标签
   */
  tags?: string[];

  /**
   * 分类
   */
  categories?: string[];

  /**
   * 草稿标记
   */
  draft?: boolean;

  /**
   * 自定义元数据
   */
  [key: string]: any;
}

/**
 * HTML 渲染选项
 */
export interface HTMLOptions {
  /**
   * 是否包含 CSS 样式
   * @default false
   */
  includeStyles?: boolean;

  /**
   * 是否使用语义化标签
   * @default true
   */
  semantic?: boolean;

  /**
   * 自定义 CSS 类名前缀
   * @default ''
   */
  classPrefix?: string;
}

/**
 * 解析错误
 */
export class ParseError extends Error {
  /**
   * 错误位置
   */
  public position?: { line: number; column: number };

  /**
   * 错误类型
   */
  public type: string;

  constructor(message: string, type: string = 'ParseError', position?: { line: number; column: number }) {
    super(message);
    this.name = 'ParseError';
    this.type = type;
    this.position = position;
  }
}

/**
 * 解析器状态
 */
export interface ParserState {
  /**
   * 是否已初始化
   */
  initialized: boolean;

  /**
   * 当前配置
   */
  options: MarkdownParserOptions;

  /**
   * 统计信息
   */
  stats: {
    /**
     * 总解析次数
     */
    totalParses: number;

    /**
     * 成功次数
     */
    successCount: number;

    /**
     * 失败次数
     */
    errorCount: number;

    /**
     * 平均解析时间（毫秒）
     */
    avgParseTime: number;
  };
}