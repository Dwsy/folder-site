/**
 * 错误处理中间件
 */

import type { Context, Next } from 'hono';
import type { ApiResponse, ApiError } from '../../types/api.js';

/**
 * 自定义错误类
 */
export class ApiErrorClass extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: any,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * HTTP 错误类
 */
export class HttpError extends ApiErrorClass {
  constructor(statusCode: number, message: string, details?: any) {
    const code = `HTTP_${statusCode}`;
    super(code, message, details, statusCode);
    this.name = 'HttpError';
  }
}

/**
 * 404 错误
 */
export class NotFoundError extends HttpError {
  constructor(message: string = 'Resource not found', details?: any) {
    super(404, message, details);
    this.name = 'NotFoundError';
  }
}

/**
 * 400 错误
 */
export class BadRequestError extends HttpError {
  constructor(message: string = 'Bad request', details?: any) {
    super(400, message, details);
    this.name = 'BadRequestError';
  }
}

/**
 * 401 错误
 */
export class UnauthorizedError extends HttpError {
  constructor(message: string = 'Unauthorized', details?: any) {
    super(401, message, details);
    this.name = 'UnauthorizedError';
  }
}

/**
 * 403 错误
 */
export class ForbiddenError extends HttpError {
  constructor(message: string = 'Forbidden', details?: any) {
    super(403, message, details);
    this.name = 'ForbiddenError';
  }
}

/**
 * 500 错误
 */
export class InternalServerError extends HttpError {
  constructor(message: string = 'Internal server error', details?: any) {
    super(500, message, details);
    this.name = 'InternalServerError';
  }
}

/**
 * 创建 API 错误响应
 */
function createErrorResponse(error: ApiError): ApiResponse {
  return {
    success: false,
    error,
    timestamp: Date.now(),
  };
}

/**
 * 错误处理中间件
 */
export async function errorHandler(c: Context, next: Next): Promise<void | Response> {
  try {
    await next();
  } catch (error) {
    console.error('[Error Handler]', error);

    // 处理自定义 API 错误
    if (error instanceof ApiErrorClass) {
      const apiError: ApiError = {
        code: error.code,
        message: error.message,
        details: error.details,
      };

      return c.json(createErrorResponse(apiError), error.statusCode as any);
    }

    // 处理标准 HTTP 错误
    if (error instanceof Error) {
      const apiError: ApiError = {
        code: 'INTERNAL_ERROR',
        message: process.env.NODE_ENV === 'production'
          ? 'An unexpected error occurred'
          : error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      };

      return c.json(createErrorResponse(apiError), 500);
    }

    // 处理未知错误
    const apiError: ApiError = {
      code: 'UNKNOWN_ERROR',
      message: 'An unknown error occurred',
    };

    return c.json(createErrorResponse(apiError), 500);
  }
}

/**
 * 404 处理器
 */
export function notFoundHandler(c: Context) {
  const apiError: ApiError = {
    code: 'NOT_FOUND',
    message: `Route ${c.req.method} ${c.req.path} not found`,
  };

  return c.json(createErrorResponse(apiError), 404);
}