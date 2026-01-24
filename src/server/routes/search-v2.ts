/**
 * 搜索路由 v2
 *
 * 使用 fd 和 rg 进行文件和内容搜索
 */

import { Hono } from 'hono';
import type { ApiResponse } from '../../types/api.js';
import type {
  SearchRequest,
  SearchResponse as SearchResponseType,
  SearchOptions,
  SearchResult,
  ContentSearchResult,
} from '../../types/search.js';
import { searchFiles, searchContent, search, isSearchAvailable } from '../services/search-service.js';

const searchV2 = new Hono();

/**
 * 检查搜索工具是否可用
 */
searchV2.get('/status', async (c) => {
  const status = isSearchAvailable();

  return c.json<ApiResponse>({
    success: true,
    data: {
      available: status.fd && status.rg,
      tools: status,
      message: !status.fd ? 'fd not available' : !status.rg ? 'ripgrep not available' : 'All tools available',
    },
    timestamp: Date.now(),
  });
});

/**
 * 文件名搜索
 */
searchV2.get('/files', async (c) => {
  const startTime = performance.now();

  const query = c.req.query('q');
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

  const options: SearchOptions = {
    limit: parseInt(c.req.query('limit') || '100', 10),
    hidden: c.req.query('hidden') === 'true',
    caseSensitive: c.req.query('caseSensitive') === 'true',
    extensions: c.req.query('extensions')?.split(','),
    excludeDirs: c.req.query('exclude')?.split(',') || ['node_modules', '.git', 'dist', 'build'],
  };

  try {
    const results = await searchFiles(query, options);
    const duration = performance.now() - startTime;

    return c.json<ApiResponse<{ results: SearchResult[]; total: number; duration: number }>>({
      success: true,
      data: {
        results,
        total: results.length,
        duration: Math.round(duration),
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('File search error:', error);
    return c.json<ApiResponse>({
      success: false,
      error: {
        code: 'SEARCH_ERROR',
        message: error instanceof Error ? error.message : 'File search failed',
      },
      timestamp: Date.now(),
    }, 500);
  }
});

/**
 * 内容搜索
 */
searchV2.get('/content', async (c) => {
  const startTime = performance.now();

  const query = c.req.query('q');
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

  const options: SearchOptions = {
    limit: parseInt(c.req.query('limit') || '50', 10),
    hidden: c.req.query('hidden') === 'true',
    caseSensitive: c.req.query('caseSensitive') === 'true',
    context: parseInt(c.req.query('context') || '2', 10),
    extensions: c.req.query('extensions')?.split(','),
    excludeDirs: c.req.query('exclude')?.split(',') || ['node_modules', '.git', 'dist', 'build'],
  };

  try {
    const results = await searchContent(query, options);
    const duration = performance.now() - startTime;

    return c.json<ApiResponse<{ results: ContentSearchResult[]; total: number; duration: number }>>({
      success: true,
      data: {
        results,
        total: results.length,
        duration: Math.round(duration),
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Content search error:', error);
    return c.json<ApiResponse>({
      success: false,
      error: {
        code: 'SEARCH_ERROR',
        message: error instanceof Error ? error.message : 'Content search failed',
      },
      timestamp: Date.now(),
    }, 500);
  }
});

/**
 * 统一搜索（文件名 + 内容）
 */
searchV2.get('/', async (c) => {
  const startTime = performance.now();

  const query = c.req.query('q');
  const mode = (c.req.query('mode') || 'auto') as 'filename' | 'content' | 'auto';

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

  const options: SearchOptions = {
    limit: parseInt(c.req.query('limit') || '50', 10),
    hidden: c.req.query('hidden') === 'true',
    caseSensitive: c.req.query('caseSensitive') === 'true',
    context: parseInt(c.req.query('context') || '2', 10),
    extensions: c.req.query('extensions')?.split(','),
    excludeDirs: c.req.query('exclude')?.split(',') || ['node_modules', '.git', 'dist', 'build'],
  };

  try {
    let fileResults: SearchResult[] = [];
    let contentResults: ContentSearchResult[] = [];

    if (mode === 'filename') {
      fileResults = await searchFiles(query, options);
    } else if (mode === 'content') {
      contentResults = await searchContent(query, options);
    } else {
      // auto mode: search both
      const results = await search(query, options);
      fileResults = results.fileResults;
      contentResults = results.contentResults;
    }

    const duration = performance.now() - startTime;

    const response: SearchResponseType = {
      fileResults,
      contentResults,
      total: fileResults.length + contentResults.length,
      duration: Math.round(duration),
      query,
      mode,
    };

    return c.json<ApiResponse<SearchResponseType>>({
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
searchV2.post('/', async (c) => {
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

  const options: SearchOptions = {
    ...body.options,
    limit: body.options?.limit || 50,
  };

  try {
    let fileResults: SearchResult[] = [];
    let contentResults: ContentSearchResult[] = [];

    const mode = body.mode || 'auto';

    if (mode === 'filename') {
      fileResults = await searchFiles(body.query, options);
    } else if (mode === 'content') {
      contentResults = await searchContent(body.query, options);
    } else {
      // auto mode: search both
      const results = await search(body.query, options);
      fileResults = results.fileResults;
      contentResults = results.contentResults;
    }

    const duration = performance.now() - startTime;

    const response: SearchResponseType = {
      fileResults,
      contentResults,
      total: fileResults.length + contentResults.length,
      duration: Math.round(duration),
      query: body.query,
      mode,
    };

    return c.json<ApiResponse<SearchResponseType>>({
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

export default searchV2;