/**
 * Transformer 类型定义
 * 
 * 定义了 AST 转换器相关的类型和接口
 */

import type { Root, Node, Parent } from 'mdast';
import type { Element, Root as HtmlRoot } from 'hast';

/**
 * 转换器配置选项
 */
export interface TransformerOptions {
  /**
   * 是否启用代码高亮
   * @default true
   */
  highlight?: boolean;

  /**
   * 代码高亮主题
   * @default 'github'
   */
  highlightTheme?: string;

  /**
   * 是否启用 LaTeX 数学公式
   * @default true
   */
  math?: boolean;

  /**
   * 是否使用语义化 HTML 标签
   * @default true
   */
  semantic?: boolean;

  /**
   * CSS 类名前缀
   * @default ''
   */
  classPrefix?: string;

  /**
   * 是否包含行号
   * @default false
   */
  lineNumbers?: boolean;

  /**
   * 是否启用自动链接
   * @default true
   */
  autolink?: boolean;

  /**
   * 是否启用任务列表
   * @default true
   */
  taskList?: boolean;

  /**
   * 表格样式配置
   */
  tableStyle?: TableStyle;

  /**
   * 图片处理配置
   */
  imageHandling?: ImageHandling;

  /**
   * 链接处理配置
   */
  linkHandling?: LinkHandling;

  /**
   * 自定义插件
   */
  plugins?: TransformerPlugin[];
}

/**
 * 表格样式配置
 */
export interface TableStyle {
  /**
   * 是否添加边框
   * @default true
   */
  bordered?: boolean;

  /**
   * 是否启用悬停效果
   * @default true
   */
  hoverable?: boolean;

  /**
   * 是否紧凑显示
   * @default false
   */
  compact?: boolean;

  /**
   * 表头背景色
   * @default 'bg-gray-100'
   */
  headerBg?: string;
}

/**
 * 图片处理配置
 */
export interface ImageHandling {
  /**
   * 是否启用懒加载
   * @default true
   */
  lazy?: boolean;

  /**
   * 是否添加加载占位符
   * @default false
   */
  placeholder?: boolean;

  /**
   * 是否启用图片缩放
   * @default false
   */
  zoomable?: boolean;

  /**
   * 最大宽度
   * @default '100%'
   */
  maxWidth?: string;
}

/**
 * 链接处理配置
 */
export interface LinkHandling {
  /**
   * 外部链接是否在新标签页打开
   * @default true
   */
  externalNewTab?: boolean;

  /**
   * 是否添加 nofollow 属性
   * @default false
   */
  nofollow?: boolean;

  /**
   * 是否显示外部链接图标
   * @default true
   */
  externalIcon?: boolean;
}

/**
 * 转换结果
 */
export interface TransformResult {
  /**
   * 转换后的 HTML
   */
  html: string;

  /**
   * 转换后的 HAST 树
   */
  hast: HtmlRoot;

  /**
   * 原始 MDAST
   */
  mdast: Root;

  /**
   * 转换元数据
   */
  metadata: TransformMetadata;
}

/**
 * 转换元数据
 */
export interface TransformMetadata {
  /**
   * 代码块数量
   */
  codeBlocks: number;

  /**
   * 图片数量
   */
  images: number;

  /**
   * 链接数量
   */
  links: number;

  /**
   * 表格数量
   */
  tables: number;

  /**
   * 任务列表项数量
   */
  taskListItems: number;

  /**
   * 转换时间（毫秒）
   */
  transformTime: number;

  /**
   * 使用的插件列表
   */
  pluginsUsed: string[];
}

/**
 * 转换器插件
 */
export interface TransformerPlugin {
  /**
   * 插件名称
   */
  name: string;

  /**
   * 插件版本
   */
  version?: string;

  /**
   * 插件优先级（数值越大越先执行）
   * @default 0
   */
  priority?: number;

  /**
   * 要处理的节点类型
   */
  nodeTypes?: string[];

  /**
   * 是否只处理特定节点类型（如果为 false 则处理所有节点）
   * @default true
   */
  filterByNodeType?: boolean;

  /**
   * 插件处理器函数
   */
  handler: PluginHandler;

  /**
   * 插件配置
   */
  options?: Record<string, any>;
}

/**
 * 插件处理器函数
 */
export type PluginHandler = (
  node: Node,
  context: TransformContext,
  next: () => void
) => Node | void | Promise<Node | void>;

/**
 * 转换上下文
 */
export interface TransformContext {
  /**
   * 转换器选项
   */
  options: Required<TransformerOptions>;

  /**
   * 当前节点路径
   */
  path: Node[];

  /**
   * 父节点
   */
  parent?: Parent;

  /**
   * 当前节点索引
   */
  index?: number;

  /**
   * 元数据收集器
   */
  metadata: TransformMetadata;

  /**
   * 自定义数据存储
   */
  data: Map<string, any>;
}

/**
 * 节点访问器
 */
export interface NodeVisitor {
  /**
   * 访问根节点
   */
  root?: (node: Root, context: TransformContext) => Element | void;

  /**
   * 访问段落
   */
  paragraph?: (node: any, context: TransformContext) => Element | void;

  /**
   * 访问标题
   */
  heading?: (node: any, context: TransformContext) => Element | void;

  /**
   * 访问文本
   */
  text?: (node: any, context: TransformContext) => Element | void;

  /**
   * 访问强调（斜体）
   */
  emphasis?: (node: any, context: TransformContext) => Element | void;

  /**
   * 访问加粗
   */
  strong?: (node: any, context: TransformContext) => Element | void;

  /**
   * 访问删除线
   */
  delete?: (node: any, context: TransformContext) => Element | void;

  /**
   * 访问代码（行内）
   */
  inlineCode?: (node: any, context: TransformContext) => Element | void;

  /**
   * 访问代码块
   */
  code?: (node: any, context: TransformContext) => Element | void;

  /**
   * 访问链接
   */
  link?: (node: any, context: TransformContext) => Element | void;

  /**
   * 访问图片
   */
  image?: (node: any, context: TransformContext) => Element | void;

  /**
   * 访问列表
   */
  list?: (node: any, context: TransformContext) => Element | void;

  /**
   * 访问列表项
   */
  listItem?: (node: any, context: TransformContext) => Element | void;

  /**
   * 访问引用块
   */
  blockquote?: (node: any, context: TransformContext) => Element | void;

  /**
   * 访问水平线
   */
  thematicBreak?: (node: any, context: TransformContext) => Element | void;

  /**
   * 访问表格
   */
  table?: (node: any, context: TransformContext) => Element | void;

  /**
   * 访问表格行
   */
  tableRow?: (node: any, context: TransformContext) => Element | void;

  /**
   * 访问表格单元格
   */
  tableCell?: (node: any, context: TransformContext) => Element | void;

  /**
   * 访问 HTML
   */
  html?: (node: any, context: TransformContext) => Element | void;

  /**
   * 访问换行
   */
  break?: (node: any, context: TransformContext) => Element | void;
}

/**
 * 转换错误
 */
export class TransformError extends Error {
  /**
   * 错误位置
   */
  public position?: { line: number; column: number };

  /**
   * 错误类型
   */
  public type: string;

  /**
   * 节点类型
   */
  public nodeType?: string;

  constructor(
    message: string,
    type: string = 'TransformError',
    position?: { line: number; column: number },
    nodeType?: string
  ) {
    super(message);
    this.name = 'TransformError';
    this.type = type;
    this.position = position;
    this.nodeType = nodeType;
  }
}

/**
 * 代码块信息
 */
export interface CodeBlockInfo {
  /**
   * 编程语言
   */
  language?: string;

  /**
   * 代码内容
   */
  code: string;

  /**
   * 包含行号
   */
  withLineNumbers: boolean;

  /**
   * 起始行号
   */
  startLine?: number;
}

/**
 * 语法高亮结果
 */
export interface HighlightResult {
  /**
   * 高亮后的 HTML
   */
  html: string;

  /**
   * 语言
   */
  language: string;

  /**
   * 是否成功高亮
   */
  highlighted: boolean;
}

/**
 * 转换器状态
 */
export interface TransformerState {
  /**
   * 是否已初始化
   */
  initialized: boolean;

  /**
   * 当前配置
   */
  options: Required<TransformerOptions>;

  /**
   * 已注册的插件
   */
  plugins: TransformerPlugin[];

  /**
   * 统计信息
   */
  stats: {
    /**
     * 总转换次数
     */
    totalTransforms: number;

    /**
     * 成功次数
     */
    successCount: number;

    /**
     * 失败次数
     */
    errorCount: number;

    /**
     * 平均转换时间（毫秒）
     */
    avgTransformTime: number;
  };
}