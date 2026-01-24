/**
 * Tools Manager
 *
 * 自动下载和管理外部工具（fd 和 rg）
 * 参考 pi-mono 的实现
 */

import { existsSync, mkdirSync, chmodSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';
import { arch, platform } from 'node:process';
import { createGunzip } from 'node:zlib';
import { createReadStream, createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { extract } from 'tar';
import { TOOLS, type ToolName, type ToolConfig } from './tools-config.js';

/**
 * 获取工具目录
 */
export function getToolsDir(): string {
  return join(homedir(), '.folder-site', 'bin');
}

/**
 * 获取工具路径
 */
export function getToolPath(tool: ToolName): string | null {
  // 1. 检查系统 PATH
  const systemPath = which(tool);
  if (systemPath) {
    return systemPath;
  }

  // 2. 检查本地工具目录
  const localPath = join(getToolsDir(), tool);
  if (existsSync(localPath)) {
    return localPath;
  }

  return null;
}

/**
 * 使用 which 命令检查工具是否存在
 */
function which(tool: string): string | null {
  try {
    const { spawnSync } = require('node:child_process');
    const result = spawnSync('which', [tool], { encoding: 'utf-8' });
    if (result.status === 0 && result.stdout.trim()) {
      return result.stdout.trim();
    }
  } catch {
    // 忽略错误
  }
  return null;
}

/**
 * 下载工具
 */
export async function downloadTool(tool: ToolName): Promise<string> {
  const config = TOOLS[tool];
  if (!config) {
    throw new Error(`Unknown tool: ${tool}`);
  }

  console.log(`Downloading ${config.name}...`);

  // 1. 获取最新版本
  const version = await fetchLatestVersion(config);
  console.log(`Latest version: ${version}`);

  // 2. 获取下载 URL
  const assetName = config.getAssetName(version, platform(), arch());
  if (!assetName) {
    throw new Error(`Unsupported platform: ${platform()} ${arch()}`);
  }

  const downloadUrl = `https://github.com/${config.repo}/releases/download/${config.tagPrefix}${version}/${assetName}`;
  console.log(`Download URL: ${downloadUrl}`);

  // 3. 下载文件
  const tempDir = join(homedir(), '.folder-site', 'tmp');
  const tempFile = join(tempDir, assetName);

  await mkdir(dirname(tempFile), { recursive: true });
  await downloadFile(downloadUrl, tempFile);

  // 4. 解压文件
  const toolsDir = getToolsDir();
  await mkdir(toolsDir, { recursive: true });

  await extractArchive(tempFile, tempDir, toolsDir, config.binaryName);

  // 5. 设置可执行权限
  const toolPath = join(toolsDir, config.binaryName);
  if (existsSync(toolPath)) {
    chmodSync(toolPath, 0o755);
    console.log(`Installed ${config.name} to ${toolPath}`);
  } else {
    throw new Error(`Failed to extract ${config.binaryName}`);
  }

  // 6. 清理临时文件
  try {
    const { unlink } = await import('node:fs/promises');
    await unlink(tempFile);
  } catch {
    // 忽略清理错误
  }

  return toolPath;
}

/**
 * 获取最新版本
 */
async function fetchLatestVersion(config: ToolConfig): Promise<string> {
  const url = `https://api.github.com/repos/${config.repo}/releases/latest`;

  const response = await fetch(url, {
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'folder-site',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch latest version: ${response.statusText}`);
  }

  const data = await response.json();
  const tagName = data.tag_name;

  // 移除版本前缀
  if (config.tagPrefix && tagName.startsWith(config.tagPrefix)) {
    return tagName.slice(config.tagPrefix.length);
  }

  return tagName;
}

/**
 * 下载文件
 */
async function downloadFile(url: string, destPath: string): Promise<void> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to download: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { writeFile } = await import('node:fs/promises');
  await writeFile(destPath, buffer);
}

/**
 * 解压归档文件
 */
async function extractArchive(
  archivePath: string,
  tempDir: string,
  toolsDir: string,
  binaryName: string
): Promise<void> {
  const { readdir, stat, copyFile } = await import('node:fs/promises');

  const isZip = archivePath.endsWith('.zip');
  const isTarGz = archivePath.endsWith('.tar.gz');

  if (isTarGz) {
    // 解压 tar.gz
    await pipeline(
      createReadStream(archivePath),
      createGunzip(),
      extract({ cwd: tempDir, strip: 1 })
    );

    console.log(`Extracted to ${tempDir}`);

    // 查找二进制文件
    const files = await readdir(tempDir);
    console.log(`Files in temp dir: ${files.join(', ')}`);

    for (const file of files) {
      if (file === binaryName || file.startsWith(binaryName)) {
        const srcPath = join(tempDir, file);
        const destPath = join(toolsDir, binaryName);
        await copyFile(srcPath, destPath);
        console.log(`Copied ${file} to ${destPath}`);
        return;
      }
    }

    // 如果没找到，尝试递归查找
    for (const file of files) {
      const filePath = join(tempDir, file);
      try {
        const stats = await stat(filePath);
        if (stats.isDirectory()) {
          const subFiles = await readdir(filePath);
          for (const subFile of subFiles) {
            if (subFile === binaryName) {
              const srcPath = join(filePath, subFile);
              const destPath = join(toolsDir, binaryName);
              await copyFile(srcPath, destPath);
              console.log(`Copied ${subFile} to ${destPath}`);
              return;
            }
          }
        }
      } catch {
        // 忽略错误
      }
    }

    throw new Error(`Could not find ${binaryName} in extracted files`);
  } else if (isZip) {
    // 解压 zip（需要额外依赖）
    throw new Error('ZIP extraction not implemented yet. Please install manually.');
  } else {
    throw new Error(`Unsupported archive format: ${archivePath}`);
  }
}

/**
 * 确保工具可用（如果不存在则下载）
 */
export async function ensureTool(tool: ToolName, silent: boolean = false): Promise<string | null> {
  // 1. 检查是否已存在
  const existingPath = getToolPath(tool);
  if (existingPath) {
    if (!silent) {
      console.log(`${tool} found at ${existingPath}`);
    }
    return existingPath;
  }

  const config = TOOLS[tool];
  if (!config) {
    return null;
  }

  // 2. 工具不存在，尝试下载
  if (!silent) {
    console.log(`${config.name} not found. Downloading...`);
  }

  try {
    const path = await downloadTool(tool);
    if (!silent) {
      console.log(`${config.name} installed to ${path}`);
    }
    return path;
  } catch (error) {
    if (!silent) {
      console.error(`Failed to download ${config.name}:`, error instanceof Error ? error.message : error);
    }
    return null;
  }
}

/**
 * 检查工具是否可用
 */
export function isToolAvailable(tool: ToolName): boolean {
  return getToolPath(tool) !== null;
}

/**
 * 获取所有工具的状态
 */
export function getToolsStatus(): Record<ToolName, boolean> {
  return {
    fd: isToolAvailable('fd'),
    rg: isToolAvailable('rg'),
  };
}