#!/usr/bin/env bun

import { Command } from 'commander';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { CliConfig, DEFAULT_CONFIG, PORT_RANGE, RESERVED_PORTS } from './config.js';

// 重新导出 CliConfig 类型，方便其他模块导入
export type { CliConfig } from './config.js';

/**
 * CLI 解析器模块
 * 负责解析命令行参数并提供友好的错误提示
 */

// 获取 package.json 中的版本信息
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packagePath = join(__dirname, '../../package.json');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));

/**
 * 验证端口号
 * @param port - 要验证的端口号
 * @returns 验证后的端口号
 * @throws 如果端口号无效则抛出错误
 */
function validatePort(port: number): number {
  if (isNaN(port)) {
    throw new Error(`端口号必须是数字: ${port}`);
  }

  if (port < PORT_RANGE.MIN || port > PORT_RANGE.MAX) {
    throw new Error(`端口号必须在 ${PORT_RANGE.MIN}-${PORT_RANGE.MAX} 范围内: ${port}`);
  }

  // 保留端口警告
  if (RESERVED_PORTS.includes(port)) {
    console.warn(`⚠️  警告: 端口 ${port} 是系统保留端口，可能需要管理员权限`);
  }

  return port;
}

/**
 * 创建 CLI 命令实例
 * @returns 配置好的 commander.Command 实例
 */
function createCommand(): Command {
  const program = new Command();

  program
    .name('folder-site')
    .description('One-command local website generator for documentation and knowledge bases')
    .version(packageJson.version, '-v, --version', '显示版本信息')
    .helpOption('-h, --help', '显示帮助信息')
    .option('-d, --dir <path>', '指定要服务的目录路径 (默认: 当前目录)', process.cwd())
    .option('-p, --port <number>', '指定端口号 (默认: 3000)', process.env.PORT || '3000')
    .option('-w, --whitelist <patterns>', '白名单模式：只显示指定的文件夹和文件（glob 模式，逗号分隔，如：docs/**/*,README.md）')
    .allowUnknownOption(false); // 不允许未知选项

  return program;
}

/**
 * 解析命令行参数
 * @param args - 命令行参数数组（默认为 process.argv）
 * @returns 解析后的 CLI 配置
 * @throws 如果参数解析失败则抛出错误
 */
export function parseArgs(args: string[] = process.argv): CliConfig {
  const program = createCommand();
  program.parse(args);

  const options = program.opts();

  // 验证并转换端口号
  const port = validatePort(parseInt(options.port, 10));

  return {
    dir: options.dir || process.cwd(),
    port,
    help: false, // commander 会自动处理 --help，这里设为 false
    version: false, // commander 会自动处理 --version，这里设为 false
    whitelist: options.whitelist,
  };
}

/**
 * 解析命令行参数（用于 CLI 主入口）
 * 在发生错误时显示帮助信息并退出
 * @param args - 命令行参数数组（默认为 process.argv）
 * @returns 解析后的 CLI 配置
 */
export function parseArgsOrExit(args: string[] = process.argv): CliConfig {
  try {
    return parseArgs(args);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`❌ 参数解析错误: ${error.message}`);
      console.error('');
      console.error('使用 --help 查看帮助信息');
      process.exit(1);
    }
    throw error;
  }
}

/**
 * 显示帮助信息
 */
export function showHelp(): void {
  const program = createCommand();
  program.help();
}

/**
 * 显示版本信息
 */
export function showVersion(): void {
  console.log(`folder-site v${packageJson.version}`);
}

/**
 * 获取默认配置
 * @returns 默认的 CLI 配置
 */
export function getDefaultConfig(): CliConfig {
  return DEFAULT_CONFIG;
}

/**
 * 验证配置
 * @param config - 要验证的配置
 * @returns 验证结果
 */
export function validateConfig(config: CliConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (config.port !== undefined) {
    try {
      validatePort(config.port);
    } catch (error) {
      if (error instanceof Error) {
        errors.push(error.message);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}