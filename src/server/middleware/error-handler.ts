/**
 * 全局错误处理中间件
 * 使用 Hono 的 onError 和 notFound 钩子实现统一的错误处理
 */

import type { Context, Next } from 'hono';
import {
  AppError,
  HttpError,
  NotFoundError,
  BadRequestError,
  ValidationError,
  InternalServerError,
  isAppError,
  createErrorResponse,
  createHtmlErrorResponse,
  triggerMonitoringHooks,
  addMonitoringHook,
  removeMonitoringHook,
  classifyError,
  LogLevel,
} from '../lib/error-handler.js';
import { logger, type LogContext } from '../lib/logger.js';

/**
 * 从 Context 中提取日志上下文
 */
function extractLogContext(c: Context, requestId: string): LogContext {
  return {
    requestId,
    method: c.req.method,
    path: c.req.path,
    ip: c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
        c.req.header('x-real-ip') ||
        'unknown',
    userAgent: c.req.header('user-agent') || 'unknown',
  };
}

/**
 * 生成或获取 Request ID
 */
function getRequestId(c: Context): string {
  // 尝试从 header 获取
  let requestId = c.req.header('x-request-id');

  // 如果没有，生成新的
  if (!requestId) {
    requestId = logger.generateRequestId();
  }

  // 存储到 context 中以便后续使用
  c.set('requestId', requestId);

  return requestId;
}

/**
 * 全局错误处理中间件
 */
export async function globalErrorHandler(c: Context, next: Next): Promise<Response | void> {
  const requestId = getRequestId(c);

  try {
    await next();
  } catch (error) {
    // 记录错误日志
    const logContext = extractLogContext(c, requestId);

    if (isAppError(error)) {
      logContext.statusCode = error.statusCode;

      // 操作性错误（预期内的业务错误）
      if (error.isOperational) {
        logger.warn(
          `Operational error occurred: ${error.code}`,
          logContext,
          error
        );
      } else {
        // 非操作性错误（系统错误）
        logger.error(
          `Non-operational error occurred: ${error.code}`,
          logContext,
          error
        );
      }
    } else if (error instanceof Error) {
      logger.error(
        'Unexpected error occurred',
        { ...logContext, errorType: error.constructor.name },
        error
      );
    } else {
      logger.error(
        'Unknown error occurred',
        { ...logContext, error: String(error) }
      );
    }

    // 触发监控钩子
    if (isAppError(error) || error instanceof Error) {
      triggerMonitoringHooks(error as AppError, c, requestId);
    }

    // 确定 HTTP 响应
    const acceptHeader = c.req.header('accept') || '';
    const wantsJson = acceptHeader.includes('application/json') ||
                      c.req.path.startsWith('/api');

    let statusCode = 500;
    let responseError: AppError | Error = error as Error;

    // 处理不同类型的错误
    if (isAppError(error)) {
      statusCode = error.statusCode;
      responseError = error;
    } else if (error instanceof Error) {
      statusCode = 500;
      responseError = new InternalServerError(
        process.env.NODE_ENV === 'production'
          ? 'An unexpected error occurred'
          : error.message,
        undefined,
        requestId
      );
    } else {
      statusCode = 500;
      responseError = new InternalServerError('An unknown error occurred', undefined, requestId);
    }

    // 返回响应
    if (wantsJson) {
      return c.json(
        createErrorResponse(responseError, c, requestId) as any,
        statusCode as any
      );
    } else {
      return c.html(
        createHtmlErrorResponse(responseError, c, requestId),
        statusCode as any
      );
    }
  }
}

/**
 * Hono onError 钩子处理器
 * 这个函数直接传递给 Hono 的 app.onError 方法
 */
export function onErrorHandler(err: Error, c: Context): Response {
  const requestId = c.get('requestId') || logger.generateRequestId();
  const logContext = extractLogContext(c, requestId);

  // 记录错误
  if (isAppError(err)) {
    logContext.statusCode = err.statusCode;
    logger.error(
      `Error caught by onError hook: ${err.code}`,
      logContext,
      err
    );
  } else {
    logger.error(
      'Error caught by onError hook',
      logContext,
      err
    );
  }

  // 触发监控钩子
  if (isAppError(err) || err instanceof Error) {
    triggerMonitoringHooks(err as AppError, c, requestId);
  }

  // 确定响应格式
  const acceptHeader = c.req.header('accept') || '';
  const wantsJson = acceptHeader.includes('application/json') ||
                    c.req.path.startsWith('/api');

  const appError = isAppError(err)
    ? err
    : new InternalServerError(
        process.env.NODE_ENV === 'production'
          ? 'An unexpected error occurred'
          : err.message,
        undefined,
        requestId
      );

  if (wantsJson) {
    return c.json(
      createErrorResponse(appError, c, requestId) as any,
      appError.statusCode as any
    );
  } else {
    return c.html(
      createHtmlErrorResponse(appError, c, requestId),
      appError.statusCode as any
    );
  }
}

/**
 * 404 Not Found 处理器
 */
export function notFoundHandler(c: Context): Response {
  const requestId = c.get('requestId') || logger.generateRequestId();

  const error = new NotFoundError(
    `Route ${c.req.method} ${c.req.path} not found`,
    undefined,
    requestId
  );

  const logContext = extractLogContext(c, requestId);
  logContext.statusCode = 404;

  logger.warn(
    'Resource not found',
    logContext,
    error
  );

  // 触发监控钩子
  triggerMonitoringHooks(error, c, requestId);

  // 返回响应
  const acceptHeader = c.req.header('accept') || '';
  const wantsJson = acceptHeader.includes('application/json') ||
                    c.req.path.startsWith('/api');

  if (wantsJson) {
    return c.json(
      createErrorResponse(error, c, requestId) as any,
      404 as any
    );
  } else {
    return c.html(
      createHtmlErrorResponse(error, c, requestId),
      404 as any
    );
  }
}

/**
 * 请求 ID 注入中间件
 * 为每个请求生成唯一的 request ID 并注入到 context 中
 */
export async function requestIdMiddleware(c: Context, next: Next): Promise<void> {
  const requestId = getRequestId(c);

  // 添加到响应头
  c.res.headers.set('X-Request-ID', requestId);

  await next();
}

// ===== 重新导出错误处理相关的函数（不从 lib 重新导出错误类） =====
export {
  classifyError,
  isAppError,
  addMonitoringHook,
  removeMonitoringHook,
  triggerMonitoringHooks,
};

// ===== 便捷函数：在路由中抛出错误 =====

/**
 * 抛出 404 错误
 */
export function throwNotFound(message?: string, details?: any): never {
  throw new NotFoundError(message, details);
}

/**
 * 抛出 400 错误
 */
export function throwBadRequest(message?: string, details?: any): never {
  throw new BadRequestError(message, details);
}

/**
 * 抛出验证错误
 */
export function throwValidationError(message?: string, details?: any): never {
  throw new ValidationError(message, details);
}

/**
 * 抛出未授权错误
 */
export function throwUnauthorized(message?: string, details?: any): never {
  const error = new (require('../lib/error-handler.js').UnauthorizedError)(message, details);
  throw error;
}

/**
 * 抛出禁止访问错误
 */
export function throwForbidden(message?: string, details?: any): never {
  const error = new (require('../lib/error-handler.js').ForbiddenError)(message, details);
  throw error;
}

/**
 * 抛出内部服务器错误
 */
export function throwInternalServerError(message?: string, details?: any): never {
  throw new InternalServerError(message, details);
}
