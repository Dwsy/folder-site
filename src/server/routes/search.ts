/**
 * 搜索路由
 *
 * 集成文件索引服务，提供高性能的模糊搜索
 */

import { Hono } from 'hono';
import { join } from 'node:path';
import type { ApiResponse, SearchResponse, SearchRequest } from '../../types/api.js';
import { createFileIndexWatcherService } from '../services/file-index-watcher.js';

const search = new Hono();

// 全局文件索引服务实例
let indexService: any = null;

/**
 * 获取或初始化文件索引服务
 */
async function getIndexService() {
  if (!indexService) {
    const rootDir = process.cwd();
    indexService = createFileIndexWatcherService({
      rootDir,
      indexPath: join(rootDir, '.folder-site', 'index.json'),
      enableWatcher: true,
      enableLogging: process.env.NODE_ENV === 'development',
    });

    await indexService.initialize();
  }

  return indexService;
}

/**
 * 执行搜索
 */
search.get('/', async (c) => {
  const startTime = performance.now();

  const query = c.req.query('q');
  const scope = c.req.query('scope') as SearchRequest['scope'] || 'all';
  const limit = parseInt(c.req.query('limit') || '20', 10);
  const offset = parseInt(c.req.query('offset') || '0', 10);

  if (!query) {
    return c.json<ApiResponse>({
      success: false,
      error: {
        code: 'MISSING_QUERY',
        message: 'Search query is required',
      },
      timestamp: Date.now(),
    }, 400);
  }

  try {
    const service = await getIndexService();
    const results = service.search(query, { limit });

    const duration = performance.now() - startTime;

    const response: SearchResponse = {
      results: results.map(r => ({
        path: r.item.relativePath,
        name: r.item.name,
        type: r.item.type,
        score: r.score,
      })),
      total: results.length,
      duration: Math.round(duration),
      query,
      stats: service.getStats(),
    };

    return c.json<ApiResponse<SearchResponse>>({
      success: true,
      data: response,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Search error:', error);
    return c.json<ApiResponse>({
      success: false,
      error: {
        code: 'SEARCH_ERROR',
        message: error instanceof Error ? error.message : 'Search failed',
      },
      timestamp: Date.now(),
    }, 500);
  }
});

/**
 * POST 搜索（支持更复杂的查询）
 */
search.post('/', async (c) => {
  const startTime = performance.now();

  const body = await c.req.json<SearchRequest>();

  if (!body.query) {
    return c.json<ApiResponse>({
      success: false,
      error: {
        code: 'MISSING_QUERY',
        message: 'Search query is required',
      },
      timestamp: Date.now(),
    }, 400);
  }

  try {
    const service = await getIndexService();
    const results = service.search(body.query, {
      fuzzy: body.fuzzy ?? true,
      exact: body.exact ?? false,
      limit: body.limit ?? 20,
    });

    const duration = performance.now() - startTime;

    const response: SearchResponse = {
      results: results.map(r => ({
        path: r.item.relativePath,
        name: r.item.name,
        type: r.item.type,
        score: r.score,
      })),
      total: results.length,
      duration: Math.round(duration),
      query: body.query,
      stats: service.getStats(),
    };

    return c.json<ApiResponse<SearchResponse>>({
      success: true,
      data: response,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Search error:', error);
    return c.json<ApiResponse>({
      success: false,
      error: {
        code: 'SEARCH_ERROR',
        message: error instanceof Error ? error.message : 'Search failed',
      },
      timestamp: Date.now(),
    }, 500);
  }
});

/**
 * 获取索引统计
 */
search.get('/stats', async (c) => {
  try {
    const service = await getIndexService();
    const stats = service.getStats();

    return c.json<ApiResponse>({
      success: true,
      data: stats,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return c.json<ApiResponse>({
      success: false,
      error: {
        code: 'STATS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get stats',
      },
      timestamp: Date.now(),
    }, 500);
  }
});

/**
 * 刷新索引
 */
search.post('/refresh', async (c) => {
  try {
    const service = await getIndexService();
    await service.refresh();

    return c.json<ApiResponse>({
      success: true,
      data: {
        message: 'Index refreshed successfully',
        stats: service.getStats(),
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Refresh error:', error);
    return c.json<ApiResponse>({
      success: false,
      error: {
        code: 'REFRESH_ERROR',
        message: error instanceof Error ? error.message : 'Failed to refresh index',
      },
      timestamp: Date.now(),
    }, 500);
  }
});

export default search;