/**
 * 构建系统类型定义
 */

/**
 * 构建配置
 */
export interface BuildConfig {
  /** 源目录 */
  srcDir: string;
  /** 输出目录 */
  outDir: string;
  /** 公共资源目录 */
  publicDir?: string;
  /** 是否生成 source map */
  sourceMap?: boolean;
  /** 是否压缩 */
  minify?: boolean;
  /** 环境变量 */
  env?: Record<string, string>;
  /** 构建模式 */
  mode?: BuildMode;
}

/**
 * 构建模式
 */
export type BuildMode = 'development' | 'production' | 'test';

/**
 * 构建结果
 */
export interface BuildResult {
  /** 是否成功 */
  success: boolean;
  /** 构建耗时（毫秒） */
  duration: number;
  /** 构建文件列表 */
  files: BuildFile[];
  /** 警告信息 */
  warnings: BuildMessage[];
  /** 错误信息 */
  errors: BuildMessage[];
  /** 输出目录 */
  outputDir: string;
}

/**
 * 构建文件
 */
export interface BuildFile {
  /** 输入文件路径 */
  input: string;
  /** 输出文件路径 */
  output: string;
  /** 文件大小（字节） */
  size: number;
  /** 文件类型 */
  type: 'html' | 'css' | 'js' | 'asset' | 'other';
}

/**
 * 构建消息
 */
export interface BuildMessage {
  /** 消息级别 */
  level: 'error' | 'warning' | 'info';
  /** 消息内容 */
  message: string;
  /** 文件路径 */
  file?: string;
  /** 行号 */
  line?: number;
  /** 列号 */
  column?: number;
}

/**
 * 构建钩子
 */
export interface BuildHooks {
  /** 构建开始前 */
  onBeforeBuild?: (config: BuildConfig) => void | Promise<void>;
  /** 构建开始 */
  onBuildStart?: (config: BuildConfig) => void | Promise<void>;
  /** 文件处理前 */
  onBeforeProcessFile?: (file: string) => void | Promise<void>;
  /** 文件处理 */
  onProcessFile?: (file: string, content: string) => string | Promise<string>;
  /** 文件处理后 */
  onAfterProcessFile?: (file: string, result: ProcessedFile) => void | Promise<void>;
  /** 构建完成 */
  onBuildEnd?: (result: BuildResult) => void | Promise<void>;
  /** 构建错误 */
  onBuildError?: (error: Error) => void | Promise<void>;
}

/**
 * 处理后的文件
 */
export interface ProcessedFile {
  /** 原始内容 */
  raw: string;
  /** 处理后的内容 */
  content: string;
  /** 元数据 */
  meta: Record<string, any>;
  /** 依赖文件 */
  dependencies?: string[];
}

/**
 * 资源处理器
 */
export interface AssetProcessor {
  /** 文件匹配模式 */
  test: RegExp | string[];
  /** 处理函数 */
  process: (content: string, file: string) => string | Promise<string>;
  /** 输出文件名模板 */
  outputName?: string;
}

/**
 * 插件配置
 */
export interface PluginConfig {
  /** 插件名称 */
  name: string;
  /** 插件选项 */
  options?: Record<string, any>;
  /** 是否启用 */
  enabled?: boolean;
}

/**
 * 开发服务器配置
 */
export interface DevServerConfig {
  /** 端口号 */
  port: number;
  /** 主机地址 */
  host: string;
  /** 是否启用热重载 */
  hotReload: boolean;
  /** 是否打开浏览器 */
  open: boolean;
  /** 是否启用 HTTPS */
  https?: boolean;
  /** 代理配置 */
  proxy?: Record<string, string>;
}

/**
 * 开发服务器状态
 */
export interface DevServerStatus {
  /** 是否运行中 */
  running: boolean;
  /** 访问 URL */
  url: string;
  /** 端口号 */
  port: number;
  /** 主机地址 */
  host: string;
  /** 启动时间 */
  startTime: Date;
}