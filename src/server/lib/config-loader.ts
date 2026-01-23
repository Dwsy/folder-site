/**
 * 配置文件加载器
 * 支持 .folder-siterc.json 配置文件
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { ConfigFile, BuildConfig } from '../../types/config.js';

/**
 * 配置文件路径候选列表
 */
const CONFIG_FILE_NAMES = [
  '.folder-siterc.json',
  'folder-site.config.json',
] as const;

/**
 * 查找配置文件
 * @param rootDir - 根目录
 * @returns 配置文件路径，如果未找到则返回 null
 */
export function findConfigFile(rootDir: string): string | null {
  for (const fileName of CONFIG_FILE_NAMES) {
    const configPath = join(rootDir, fileName);
    if (existsSync(configPath)) {
      return configPath;
    }
  }
  return null;
}

/**
 * 读取配置文件
 * @param configPath - 配置文件路径
 * @returns 配置对象
 */
export function readConfigFile(configPath: string): ConfigFile {
  try {
    const content = readFileSync(configPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === 'ENOENT') {
      console.error(`Config file not found: ${configPath}`);
    } else if (err instanceof SyntaxError) {
      console.error(`Invalid JSON in config file: ${configPath}`);
    } else {
      console.error(`Failed to read config file ${configPath}:`, err.message);
    }
    return {};
  }
}

/**
 * 加载配置
 * @param rootDir - 根目录
 * @returns 配置对象
 */
export function loadConfig(rootDir: string): ConfigFile {
  const configPath = findConfigFile(rootDir);
  if (!configPath) {
    return {};
  }
  return readConfigFile(configPath);
}

/**
 * 获取构建配置（特别是 whitelist）
 * @param rootDir - 根目录
 * @returns 构建配置
 */
export function getBuildConfig(rootDir: string): BuildConfig {
  const config = loadConfig(rootDir);
  return config.build || {};
}

/**
 * 合并配置
 * @param cliConfig - CLI 配置（whitelist 字符串）
 * @param fileConfig - 文件配置（whitelist 数组）
 * @returns 合并后的 whitelist 数组
 */
export function mergeWhitelist(cliConfig?: string, fileConfig?: string[]): string[] {
  // CLI 参数优先
  if (cliConfig) {
    return cliConfig.split(',').map(s => s.trim()).filter(Boolean);
  }

  // 否则使用配置文件
  if (fileConfig && fileConfig.length > 0) {
    return fileConfig;
  }

  // 都没有则返回空数组（使用默认黑名单模式）
  return [];
}