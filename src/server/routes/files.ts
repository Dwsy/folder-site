/**
 * 文件路由
 */

import { Hono } from 'hono';
import { readFile } from 'node:fs/promises';
import { join, relative, normalize } from 'node:path';
import { FileIndexService } from '../services/index.js';
import { mergeWhitelist } from '../lib/config-loader.js';
import type { ApiResponse, FileListResponse, FileContentResponse, DirectoryTreeResponse } from '../../types/api.js';

const files = new Hono();

// 创建文件索引服务实例
const fileIndexService = new FileIndexService({
  includeDirectories: true,
});

// 初始化文件索引
async function initFileIndex() {
  const { FileScanner } = await import('../services/scanner.js');
  type ScanOptions = import('../services/scanner.js').ScanOptions;

  // 从环境变量和配置文件合并 whitelist
  const cliWhitelist = process.env.WHITELIST;
  const fileWhitelist = process.env.FILE_WHITELIST ? JSON.parse(process.env.FILE_WHITELIST) : undefined;
  const whitelist = mergeWhitelist(cliWhitelist, fileWhitelist);

  const scannerOptions: ScanOptions = {
    rootDir: process.cwd(),
    extensions: ['.md', '.mmd', '.txt', '.json', '.yml', '.yaml', '.ts', '.tsx', '.js', '.jsx'],
    useGitignore: true,
  };

  // 如果有白名单配置，添加到扫描选项
  if (whitelist.length > 0) {
    scannerOptions.whitelist = whitelist;
  }

  const scanner = new FileScanner(scannerOptions);
  const result = await scanner.scan();
  await fileIndexService.addOrUpdateBatch(result.files.map(f => ({
    path: f.path,
    name: f.name,
    size: f.size,
    mtime: f.mtime,
    isDirectory: f.isDirectory,
  })));
}

// 初始化索引（异步）
initFileIndex().catch(console.error);

/**
 * 获取文件列表
 */
files.get('/', async (c) => {
  const entries = fileIndexService.getAllEntries();
  const response: FileListResponse = {
    files: entries.map(e => ({
      name: e.name,
      path: e.relativePath,
      type: e.isDirectory ? 'folder' : 'file',
      extension: e.extension,
      size: e.size,
      modifiedAt: e.modifiedAt,
    })),
    total: entries.length,
  };

  return c.json<ApiResponse<FileListResponse>>({
    success: true,
    data: response,
    timestamp: Date.now(),
  });
});

/**
 * 获取目录树（深度限制，防止内存溢出）
 * 注意：这个路由必须在通配符路由之前定义
 */
files.get('/tree/list', async (c) => {
  const depth = parseInt(c.req.query('depth') || '10', 10);
  const entries = fileIndexService.getAllEntries();

  // 按路径构建 Map（扁平化存储所有节点）
  const pathMap = new Map<string, any[]>();

  // 分组到父路径
  for (const entry of entries) {
    const parts = entry.relativePath.split('/');
    const parentPath = parts.length > 1 ? parts.slice(0, -1).join('/') : '';

    if (parts.length > depth) {
      continue;
    }

    const node = {
      name: entry.name,
      path: entry.relativePath,
      relativePath: entry.relativePath,
      isDirectory: entry.isDirectory,
      extension: entry.extension,
      size: entry.size,
      hasChildren: false,
    };

    if (!pathMap.has(parentPath)) {
      pathMap.set(parentPath, []);
    }
    pathMap.get(parentPath)!.push(node);
  }

  // 标记有子节点的目录
  for (const [parentPath, children] of pathMap) {
    for (const child of children) {
      if (child.isDirectory && pathMap.has(child.relativePath)) {
        child.hasChildren = true;
      }
    }
  }

  // 递归构建树结构
  function buildTree(parentPath: string, currentDepth: number): any[] {
    if (currentDepth >= depth) return [];

    const children = pathMap.get(parentPath) || [];
    return children.map(child => {
      if (child.isDirectory && child.hasChildren) {
        return {
          ...child,
          children: buildTree(child.relativePath, currentDepth + 1),
        };
      }
      return child;
    });
  }

  const rootChildren = buildTree('', 0);

  const response: DirectoryTreeResponse = {
    root: process.cwd(),
    tree: {
      name: 'root',
      path: process.cwd(),
      relativePath: '',
      isDirectory: true,
      children: rootChildren,
    },
    totalNodes: entries.length,
  };

  return c.json<ApiResponse<DirectoryTreeResponse>>({
    success: true,
    data: response,
    timestamp: Date.now(),
  });
});

/**
 * 获取文件内容
 */
files.get('/content', async (c) => {
  const path = c.req.query('path');

  if (!path) {
    return c.json<ApiResponse<null>>({
      success: false,
      data: null,
      error: { code: 'MISSING_PATH', message: 'Path parameter is required' },
      timestamp: Date.now(),
    }, 400);
  }

  try {
    const fullPath = join(process.cwd(), path);
    const content = await readFile(fullPath, 'utf-8');
    const stats = await import('node:fs/promises').then(fs => fs.stat(fullPath));

    const response: FileContentResponse = {
      info: {
        name: path.split('/').pop() || '',
        path: fullPath,
        relativePath: path,
        extension: path.split('.').pop() || '',
        size: stats.size,
        modifiedAt: stats.mtime,
        createdAt: stats.ctime,
        isDirectory: stats.isDirectory(),
        isFile: stats.isFile(),
        isSymbolicLink: stats.isSymbolicLink(),
      },
      content,
      meta: {
        title: '',
        description: '',
        tags: [],
        updated: stats.mtime.toISOString(),
      },
    };

    return c.json<ApiResponse<FileContentResponse>>({
      success: true,
      data: response,
      timestamp: Date.now(),
    });
  } catch (error) {
    return c.json<ApiResponse<null>>({
      success: false,
      data: null,
      error: { code: 'FILE_READ_ERROR', message: error instanceof Error ? error.message : 'Failed to read file' },
      timestamp: Date.now(),
    }, 404);
  }
});

/**
 * 获取目录的子节点（懒加载）
 */
files.get('/tree/children', async (c) => {
  const path = c.req.query('path') || '';
  const depth = parseInt(c.req.query('depth') || '1', 10);
  const entries = fileIndexService.getAllEntries();

  // 筛选指定路径下的直接子节点
  const children = entries.filter(entry => {
    const entryPath = entry.relativePath;
    if (path === '') {
      // 根目录下的直接子节点
      return !entryPath.includes('/');
    } else {
      // 指定路径下的直接子节点
      return entryPath.startsWith(path + '/') &&
             entryPath.substring(path.length + 1).split('/').length <= depth;
    }
  });

  // 构建节点列表
  const nodes = children.map(entry => ({
    name: entry.name,
    path: entry.relativePath,
    relativePath: entry.relativePath,
    isDirectory: entry.isDirectory,
    extension: entry.extension,
    size: entry.size,
  }));

  return c.json<ApiResponse<{ children: any[] }>>({
    success: true,
    data: { children: nodes },
    timestamp: Date.now(),
  });
});

export default files;