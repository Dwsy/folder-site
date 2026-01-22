/**
 * CORS 中间件
 */

import type { Context, Next } from 'hono';

/**
 * CORS 配置选项
 */
export interface CorsOptions {
  /** 允许的源，* 表示允许所有 */
  origin?: string | string[] | ((origin: string) => boolean);
  /** 允许的 HTTP 方法 */
  methods?: string[];
  /** 允许的请求头 */
  allowedHeaders?: string[];
  /** 暴露的响应头 */
  exposedHeaders?: string[];
  /** 是否允许携带凭证 */
  credentials?: boolean;
  /** 预检请求缓存时间（秒） */
  maxAge?: number;
}

/**
 * 默认 CORS 配置
 */
const defaultCorsOptions: CorsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: [],
  credentials: false,
  maxAge: 86400, // 24 小时
};

/**
 * 检查源是否允许
 */
function isOriginAllowed(
  origin: string | undefined,
  allowed: CorsOptions['origin']
): boolean {
  if (!origin) {
    return false;
  }

  if (allowed === '*') {
    return true;
  }

  if (typeof allowed === 'string') {
    return origin === allowed;
  }

  if (Array.isArray(allowed)) {
    return allowed.includes(origin);
  }

  if (typeof allowed === 'function') {
    return allowed(origin);
  }

  return false;
}

/**
 * 获取允许的源
 */
function getAllowedOrigin(
  origin: string | undefined,
  options: CorsOptions
): string {
  if (options.origin === '*') {
    return '*';
  }

  if (isOriginAllowed(origin, options.origin)) {
    return origin || '*';
  }

  return '';
}

/**
 * CORS 中间件
 */
export function cors(options: CorsOptions = {}) {
  const opts = { ...defaultCorsOptions, ...options };

  return async (c: Context, next: Next): Promise<void | Response> => {
    const origin = c.req.header('origin');

    // 设置响应头
    if (origin) {
      const allowedOrigin = getAllowedOrigin(origin, opts);
      if (allowedOrigin) {
        c.res.headers.set('Access-Control-Allow-Origin', allowedOrigin);
      }
    }

    c.res.headers.set(
      'Access-Control-Allow-Methods',
      opts.methods?.join(', ') || 'GET, POST, PUT, DELETE, PATCH, OPTIONS'
    );

    c.res.headers.set(
      'Access-Control-Allow-Headers',
      opts.allowedHeaders?.join(', ') || 'Content-Type, Authorization, X-Requested-With'
    );

    if (opts.exposedHeaders && opts.exposedHeaders.length > 0) {
      c.res.headers.set(
        'Access-Control-Expose-Headers',
        opts.exposedHeaders.join(', ')
      );
    }

    if (opts.credentials) {
      c.res.headers.set('Access-Control-Allow-Credentials', 'true');
    }

    if (opts.maxAge) {
      c.res.headers.set('Access-Control-Max-Age', opts.maxAge.toString());
    }

    // 处理预检请求
    if (c.req.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: c.res.headers,
      });
    }

    await next();
  };
}