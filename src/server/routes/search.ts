/**
 * 搜索路由
 */

import { Hono } from 'hono';
import type { ApiResponse, SearchResponse, SearchRequest } from '../../types/api.js';

const search = new Hono();

/**
 * 执行搜索
 */
search.get('/', (c) => {
  const query = c.req.query('q');
  // TODO: 实现搜索参数使用
  const scope = c.req.query('scope') as SearchRequest['scope'] || 'all';
  const limit = parseInt(c.req.query('limit') || '20', 10);
  const offset = parseInt(c.req.query('offset') || '0', 10);

  // 消除未使用变量警告
  void scope;
  void limit;
  void offset;

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

  // TODO: 实现搜索逻辑
  const response: SearchResponse = {
    results: [],
    total: 0,
    duration: 0,
    query,
  };

  return c.json<ApiResponse<SearchResponse>>({
    success: true,
    data: response,
    timestamp: Date.now(),
  });
});

/**
 * POST 搜索（支持更复杂的查询）
 */
search.post('/', async (c) => {
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

  // TODO: 实现搜索逻辑
  const response: SearchResponse = {
    results: [],
    total: 0,
    duration: 0,
    query: body.query,
  };

  return c.json<ApiResponse<SearchResponse>>({
    success: true,
    data: response,
    timestamp: Date.now(),
  });
});

export default search;