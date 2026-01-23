/**
 * CLI 配置类型定义
 * 导出 CLI 参数解析相关的类型
 */

/**
 * CLI 配置接口
 * 定义所有支持的命令行参数
 */
export interface CliConfig {
  /** 要服务的目录路径 (默认: 当前目录) */
  dir: string;
  /** 端口号 (默认: 3000) */
  port: number;
  /** 是否显示帮助信息 */
  help: boolean;
  /** 是否显示版本信息 */
  version: boolean;
  /** 白名单模式：只显示指定的文件夹和文件（glob 模式，逗号分隔） */
  whitelist?: string;
}

/**
 * CLI 解析选项
 */
export interface ParseOptions {
  /** 是否允许未知选项 */
  allowUnknown?: boolean;
  /** 是否严格模式 */
  strict?: boolean;
}

/**
 * 配置验证结果
 */
export interface ValidationResult {
  /** 是否验证通过 */
  valid: boolean;
  /** 错误信息列表 */
  errors: string[];
}

/**
 * 端口范围
 */
export const PORT_RANGE = {
  MIN: 1,
  MAX: 65535,
} as const;

/**
 * 常用保留端口
 */
export const RESERVED_PORTS: readonly number[] = [
  20, 21, 22, 23, 25, 53, 80, 110, 143, 443, 445, 993, 995, 1433, 1521,
  3306, 3389, 5432, 5900, 6379, 8080, 8443, 27017,
] as const;

/**
 * 默认配置
 */
export const DEFAULT_CONFIG: CliConfig = {
  dir: process.cwd(),
  port: 3000,
  help: false,
  version: false,
} as const;