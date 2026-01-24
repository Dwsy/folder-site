/**
 * 文件路由
 */

import { Hono } from 'hono';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { FileIndexWatcherService } from '../services/file-index-watcher.js';
import { getFileFormatService } from '../services/file-format-service.js';
import { mergeWhitelist } from '../lib/config-loader.js';
import type { ApiResponse, FileListResponse, FileContentResponse, DirectoryTreeResponse } from '../../types/api.js';

const files = new Hono();

// 创建文件索引和监视服务实例
let fileIndexWatcherService: FileIndexWatcherService | null = null;
let isInitialized = false;
let initPromise: Promise<void> | null = null;

// 日志工具
const logger = {
  debug: process.env.NODE_ENV === 'development' ? console.log : () => {},
  info: console.log,
  warn: console.warn,
  error: console.error,
};

// 初始化文件索引和监视
async function initFileIndex() {
  try {
    // 从环境变量和配置文件合并 whitelist
    const cliWhitelist = process.env.WHITELIST;
    const fileWhitelist = process.env.FILE_WHITELIST ? JSON.parse(process.env.FILE_WHITELIST) : undefined;
    const whitelist = mergeWhitelist(cliWhitelist, fileWhitelist);

    // 从插件中提取支持的文件格式
    const formatService = getFileFormatService();

    // 尝试从插件管理器获取插件
    try {
      const { PluginManager } = await import('../lib/plugin-manager.js');
      const pluginManager = new PluginManager({
        pluginPaths: [join(process.cwd(), 'plugins')],
      });

      // 只需要发现插件，不需要加载完整代码
      const discovery = await pluginManager.discover({
        manifestFile: 'manifest.json',
      });

      logger.info(`[Files Route] Discovered ${discovery.manifests.length} plugin manifests`);

      // 直接从 discovery.manifests 中提取支持的格式
      for (const { manifest } of discovery.manifests) {
        logger.debug(`[Files Route] Processing plugin: ${manifest.id} with ${manifest.capabilities?.length || 0} capabilities`);
        formatService.extractFromPlugins([{ manifest }]);
      }

      logger.info(`[Files Route] Loaded ${formatService.getSupportedCount()} file formats`);
    } catch (error) {
      logger.warn('[Files Route] Failed to load plugins, using base formats only:', error);
    }

    const scanOptions = {
      rootDir: process.cwd(),
      extensions: formatService.getSupportedExtensions(),
      useGitignore: true,
      whitelist: whitelist.length > 0 ? whitelist : undefined,
    };

    // 创建并初始化文件索引和监视服务
    fileIndexWatcherService = new FileIndexWatcherService({
      rootDir: process.cwd(),
      scanOptions,
      enableWatcher: true,
      enableLogging: true,
    });

    await fileIndexWatcherService.initialize();

    isInitialized = true;
    logger.info('[Files Route] File index watcher initialized successfully');
  } catch (error) {
    isInitialized = false;
    logger.error('[Files Route] Failed to initialize file index watcher:', error);
    throw error;
  }
}

// 初始化索引和监视器（异步）
initPromise = initFileIndex().catch(console.error);

/**
 * 等待初始化完成
 */
async function waitForInitialization(): Promise<void> {
  if (isInitialized) return;
  if (initPromise) {
    await initPromise;
  }
  if (!isInitialized) {
    throw new Error('File index watcher service not initialized');
  }
}

/**
 * 重新扫描文件系统并更新索引
 */
files.post('/refresh', async (c) => {
  console.log('[Files API] Refreshing file index...');

  try {
    if (!fileIndexWatcherService) {
      throw new Error('File index watcher service not initialized');
    }

    // 重新扫描
    await fileIndexWatcherService.refresh();

    const entries = fileIndexWatcherService.getAllEntries();
    const stats = fileIndexWatcherService.getStats();

    return c.json<ApiResponse<{ message: string; stats: any; total: number }>>({
      success: true,
      data: {
        message: 'File index refreshed successfully',
        stats,
        total: entries.length,
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('[Files API] Failed to refresh index:', error);
    return c.json<ApiResponse<null>>({
      success: false,
      data: null,
      error: {
        code: 'REFRESH_FAILED',
        message: error instanceof Error ? error.message : 'Failed to refresh file index',
      },
      timestamp: Date.now(),
    }, 500);
  }
});

/**
 * 获取文件列表
 */
files.get('/', async (c) => {
  try {
    await waitForInitialization();

    if (!fileIndexWatcherService) {
      return c.json<ApiResponse<null>>({
        success: false,
        data: null,
        error: { code: 'NOT_INITIALIZED', message: 'File index watcher not initialized' },
        timestamp: Date.now(),
      }, 503);
    }

    const entries = fileIndexWatcherService.getAllEntries();
    const response: FileListResponse = {
      files: entries,
      total: entries.length,
    };

    return c.json<ApiResponse<FileListResponse>>({
      success: true,
      data: response,
      timestamp: Date.now(),
    });
  } catch (error) {
    return c.json<ApiResponse<null>>({
      success: false,
      data: null,
      error: { code: 'SERVICE_ERROR', message: error instanceof Error ? error.message : 'Service error' },
      timestamp: Date.now(),
    }, 503);
  }
});

/**
 * 获取目录树（深度限制，防止内存溢出）
 * 注意：这个路由必须在通配符路由之前定义
 */
files.get('/tree/list', async (c) => {
  try {
    await waitForInitialization();

    if (!fileIndexWatcherService) {
      return c.json<ApiResponse<null>>({
        success: false,
        data: null,
        error: { code: 'NOT_INITIALIZED', message: 'File index watcher not initialized' },
        timestamp: Date.now(),
      }, 503);
    }

    const depth = parseInt(c.req.query('depth') || '10', 10);
    const entries = fileIndexWatcherService.getAllEntries();

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

    // 排序：目录在前，文件在后，按名称字母顺序
    const sortedChildren = children.sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) {
        return a.isDirectory ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

    return sortedChildren.map(child => {
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
  } catch (error) {
    return c.json<ApiResponse<null>>({
      success: false,
      data: null,
      error: { code: 'SERVICE_ERROR', message: error instanceof Error ? error.message : 'Service error' },
      timestamp: Date.now(),
    }, 503);
  }
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
  try {
    await waitForInitialization();

    if (!fileIndexWatcherService) {
      return c.json<ApiResponse<null>>({
        success: false,
        data: null,
        error: { code: 'NOT_INITIALIZED', message: 'File index watcher not initialized' },
        timestamp: Date.now(),
      }, 503);
    }

    const path = c.req.query('path') || '';
    const depth = parseInt(c.req.query('depth') || '1', 10);
    const entries = fileIndexWatcherService.getAllEntries();

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
  } catch (error) {
    return c.json<ApiResponse<null>>({
      success: false,
      data: null,
      error: { code: 'SERVICE_ERROR', message: error instanceof Error ? error.message : 'Service error' },
      timestamp: Date.now(),
    }, 503);
  }
});

export default files;