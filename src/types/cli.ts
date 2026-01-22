/**
 * CLI 命令类型定义
 */

/**
 * 支持的命令类型
 */
export type CliCommand = 'dev' | 'build' | 'preview' | 'serve' | 'help' | 'version';

/**
 * CLI 命令选项
 */
export interface CliOptions {
  /** 端口号 */
  port?: number;
  /** 监听的主机地址 */
  host?: string;
  /** 输出目录 */
  outDir?: string;
  /** 源目录 */
  srcDir?: string;
  /** 是否启用热重载 */
  hotReload?: boolean;
  /** 是否显示详细日志 */
  verbose?: boolean;
  /** 配置文件路径 */
  config?: string;
  /** 是否强制重建 */
  force?: boolean;
  /** 静态资源目录 */
  assetsDir?: string;
  /** 站点标题 */
  title?: string;
  /** 站点描述 */
  description?: string;
  /** 主题颜色 */
  themeColor?: string;
  /** 是否启用暗色模式 */
  darkMode?: boolean;
}

/**
 * CLI 命令参数
 */
export interface CliCommandArgs {
  /** 命令名称 */
  command: CliCommand;
  /** 命令选项 */
  options: CliOptions;
  /** 额外的位置参数 */
  positionalArgs?: string[];
}

/**
 * 命令执行结果
 */
export interface CommandResult {
  /** 是否成功 */
  success: boolean;
  /** 退出码 */
  exitCode: number;
  /** 错误信息 */
  error?: string;
  /** 执行耗时（毫秒） */
  duration?: number;
}

/**
 * CLI 上下文
 */
export interface CliContext {
  /** 命令参数 */
  args: CliCommandArgs;
  /** 项目根目录 */
  rootDir: string;
  /** 工作目录 */
  cwd: string;
  /** 环境变量 */
  env: NodeJS.ProcessEnv;
  /** 是否调试模式 */
  debug: boolean;
}