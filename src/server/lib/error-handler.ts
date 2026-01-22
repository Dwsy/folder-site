/**
 * 增强的错误处理系统
 * 提供全局错误捕获、分类、响应格式化和敏感信息过滤
 */

import type { Context, Next } from 'hono';
import type { ApiError } from '../../types/api.js';

// ===== 自定义错误类 =====

/**
 * 基础应用错误类
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details: any;
  public readonly isOperational: boolean;
  public readonly requestId: string;

  constructor(
    code: string,
    message: string,
    statusCode: number = 500,
    details: any = undefined,
    isOperational: boolean = true,
    requestId: string = ''
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = isOperational;
    this.requestId = requestId;

    // 保持正确的原型链
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * HTTP 错误类
 */
export class HttpError extends AppError {
  constructor(
    statusCode: number,
    message: string,
    details: any = undefined,
    requestId: string = ''
  ) {
    const code = `HTTP_${statusCode}`;
    super(code, message, statusCode, details, true, requestId);
    this.name = 'HttpError';
    Object.setPrototypeOf(this, HttpError.prototype);
  }
}

/**
 * 404 Not Found 错误
 */
export class NotFoundError extends HttpError {
  constructor(message: string = 'Resource not found', details: any = undefined, requestId: string = '') {
    super(404, message, details, requestId);
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * 400 Bad Request 错误
 */
export class BadRequestError extends HttpError {
  constructor(message: string = 'Bad request', details: any = undefined, requestId: string = '') {
    super(400, message, details, requestId);
    this.name = 'BadRequestError';
    Object.setPrototypeOf(this, BadRequestError.prototype);
  }
}

/**
 * 401 Unauthorized 错误
 */
export class UnauthorizedError extends HttpError {
  constructor(message: string = 'Unauthorized', details: any = undefined, requestId: string = '') {
    super(401, message, details, requestId);
    this.name = 'UnauthorizedError';
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

/**
 * 403 Forbidden 错误
 */
export class ForbiddenError extends HttpError {
  constructor(message: string = 'Forbidden', details: any = undefined, requestId: string = '') {
    super(403, message, details, requestId);
    this.name = 'ForbiddenError';
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

/**
 * 409 Conflict 错误
 */
export class ConflictError extends HttpError {
  constructor(message: string = 'Resource conflict', details: any = undefined, requestId: string = '') {
    super(409, message, details, requestId);
    this.name = 'ConflictError';
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

/**
 * 422 Unprocessable Entity 错误
 */
export class ValidationError extends HttpError {
  constructor(message: string = 'Validation failed', details: any = undefined, requestId: string = '') {
    super(422, message, details, requestId);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * 429 Too Many Requests 错误
 */
export class RateLimitError extends HttpError {
  constructor(message: string = 'Too many requests', details: any = undefined, requestId: string = '') {
    super(429, message, details, requestId);
    this.name = 'RateLimitError';
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

/**
 * 500 Internal Server Error
 */
export class InternalServerError extends HttpError {
  constructor(message: string = 'Internal server error', details: any = undefined, requestId: string = '') {
    super(500, message, details, requestId);
    this.name = 'InternalServerError';
    Object.setPrototypeOf(this, InternalServerError.prototype);
  }
}

/**
 * 503 Service Unavailable 错误
 */
export class ServiceUnavailableError extends HttpError {
  constructor(message: string = 'Service unavailable', details: any = undefined, requestId: string = '') {
    super(503, message, details, requestId);
    this.name = 'ServiceUnavailableError';
    Object.setPrototypeOf(this, ServiceUnavailableError.prototype);
  }
}

// ===== 错误分类和类型 =====

/**
 * 错误类型枚举
 */
export enum ErrorType {
  CLIENT_ERROR = 'CLIENT_ERROR',      // 4xx 客户端错误
  SERVER_ERROR = 'SERVER_ERROR',      // 5xx 服务器错误
  BUSINESS_ERROR = 'BUSINESS_ERROR',  // 业务逻辑错误
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',    // 未知错误
}

/**
 * 根据状态码分类错误类型
 */
export function classifyError(statusCode: number): ErrorType {
  if (statusCode >= 400 && statusCode < 500) {
    return ErrorType.CLIENT_ERROR;
  } else if (statusCode >= 500) {
    return ErrorType.SERVER_ERROR;
  } else {
    return ErrorType.BUSINESS_ERROR;
  }
}

/**
 * 检查是否为已知错误类实例
 */
export function isAppError(error: any): error is AppError {
  return error instanceof AppError;
}

// ===== 敏感信息过滤 =====

/**
 * 敏感字段列表（用于过滤）
 */
const SENSITIVE_FIELDS = [
  'password',
  'passwd',
  'secret',
  'token',
  'apikey',
  'api_key',
  'apikey',
  'authorization',
  'cookie',
  'session',
  'private_key',
  'privateKey',
  'access_token',
  'accessToken',
  'refresh_token',
  'refreshToken',
];

/**
 * 递归过滤对象中的敏感信息
 */
export function filterSensitiveData(data: any, depth: number = 0): any {
  if (depth > 5) return '[Filtered]'; // 防止无限递归

  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'string') {
    // 过滤可能包含敏感信息的字符串
    const lowerKey = data.toLowerCase();
    if (SENSITIVE_FIELDS.some(field => lowerKey.includes(field))) {
      return '[FILTERED]';
    }
    // 过滤看起来像 token 的字符串（长度 > 32 且包含字母数字）
    if (data.length > 32 && /^[a-zA-Z0-9_-]+$/.test(data)) {
      return '[FILTERED]';
    }
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => filterSensitiveData(item, depth + 1));
  }

  if (typeof data === 'object') {
    const filtered: any = {};
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();

      // 检查是否为敏感字段
      if (SENSITIVE_FIELDS.some(field => lowerKey.includes(field))) {
        filtered[key] = '[FILTERED]';
      } else {
        filtered[key] = filterSensitiveData(value, depth + 1);
      }
    }
    return filtered;
  }

  return data;
}

// ===== 错误响应格式化 =====

/**
 * 错误响应接口
 */
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  requestId: string;
  timestamp: number;
  path: string;
  method: string;
}

/**
 * 创建 JSON 错误响应
 */
export function createErrorResponse(
  error: AppError | Error,
  c: Context,
  requestId: string
): ErrorResponse {
  const isProduction = process.env.NODE_ENV === 'production';
  const appError = error as AppError;

  const baseResponse: ErrorResponse = {
    success: false,
    error: {
      code: appError.code || 'INTERNAL_ERROR',
      message: isProduction && !appError.isOperational
        ? 'An unexpected error occurred'
        : error.message,
    },
    requestId,
    timestamp: Date.now(),
    path: c.req.path,
    method: c.req.method,
  };

  // 添加 details（仅开发环境或 operational 错误）
  if (appError.details && (!isProduction || appError.isOperational)) {
    baseResponse.error.details = filterSensitiveData(appError.details);
  }

  // 开发环境添加堆栈跟踪
  if (!isProduction && error.stack) {
    baseResponse.error.details = {
      ...baseResponse.error.details,
      stack: error.stack,
    };
  }

  return baseResponse;
}

/**
 * 创建 HTML 错误响应
 */
export function createHtmlErrorResponse(
  error: AppError | Error,
  c: Context,
  requestId: string
): string {
  const isProduction = process.env.NODE_ENV === 'production';
  const appError = error as AppError;
  const statusCode = appError.statusCode || 500;
  const title = `${statusCode} ${getHttpStatusText(statusCode)}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      background: #1a1a2e;
      color: #eaeaea;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .error-container {
      text-align: center;
      max-width: 600px;
      width: 100%;
    }
    .error-code {
      font-size: 120px;
      font-weight: 700;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      line-height: 1;
      margin-bottom: 20px;
    }
    .error-title {
      font-size: 28px;
      margin-bottom: 15px;
      color: #eaeaea;
    }
    .error-message {
      font-size: 16px;
      color: #a0a0a0;
      margin-bottom: 30px;
      line-height: 1.6;
    }
    .error-details {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 30px;
      text-align: left;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 14px;
    }
    .error-detail-row {
      display: flex;
      margin-bottom: 10px;
    }
    .error-detail-label {
      color: #667eea;
      min-width: 100px;
      font-weight: 600;
    }
    .error-detail-value {
      color: #a0a0a0;
      word-break: break-all;
    }
    .error-stack {
      margin-top: 15px;
      padding-top: 15px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      color: #764ba2;
      overflow-x: auto;
    }
    .btn-home {
      display: inline-block;
      padding: 12px 30px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .btn-home:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
    }
  </style>
</head>
<body>
  <div class="error-container">
    <div class="error-code">${statusCode}</div>
    <h1 class="error-title">${title}</h1>
    <p class="error-message">${error.message}</p>

    <div class="error-details">
      <div class="error-detail-row">
        <span class="error-detail-label">Request ID:</span>
        <span class="error-detail-value">${requestId}</span>
      </div>
      <div class="error-detail-row">
        <span class="error-detail-label">Path:</span>
        <span class="error-detail-value">${c.req.method} ${c.req.path}</span>
      </div>
      <div class="error-detail-row">
        <span class="error-detail-label">Time:</span>
        <span class="error-detail-value">${new Date().toISOString()}</span>
      </div>
      ${!isProduction && error.stack ? `
      <div class="error-stack">
        <pre style="white-space: pre-wrap; word-wrap: break-word;">${escapeHtml(error.stack)}</pre>
      </div>
      ` : ''}
    </div>

    <a href="/" class="btn-home">Back to Home</a>
  </div>

  <script>
    // 自动刷新（仅开发环境）
    ${!isProduction ? `
    // 开发环境下可以显示更多调试信息
    console.error('Error:', ${JSON.stringify({ message: error.message, code: (appError.code || 'UNKNOWN'), requestId })});
    ` : ''}
  </script>
</body>
</html>`;
}

/**
 * 获取 HTTP 状态码文本
 */
function getHttpStatusText(statusCode: number): string {
  const statusTexts: Record<number, string> = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    422: 'Unprocessable Entity',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    503: 'Service Unavailable',
  };
  return statusTexts[statusCode] || 'Error';
}

/**
 * HTML 转义
 */
function escapeHtml(text: string): string {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => htmlEscapes[char]);
}

// ===== 错误监控钩子 =====

/**
 * 错误监控钩子函数类型
 */
export type ErrorMonitoringHook = (error: AppError | Error, context: Context, requestId: string) => void;

/**
 * 监控钩子数组
 */
let monitoringHooks: ErrorMonitoringHook[] = [];

/**
 * 添加监控钩子
 */
export function addMonitoringHook(hook: ErrorMonitoringHook): void {
  monitoringHooks.push(hook);
}

/**
 * 移除监控钩子
 */
export function removeMonitoringHook(hook: ErrorMonitoringHook): void {
  monitoringHooks = monitoringHooks.filter(h => h !== hook);
}

/**
 * 触发监控钩子
 */
export function triggerMonitoringHooks(
  error: AppError | Error,
  context: Context,
  requestId: string
): void {
  for (const hook of monitoringHooks) {
    try {
      hook(error, context, requestId);
    } catch (err) {
      console.error('[Error Handler] Monitoring hook error:', err);
    }
  }
}

/**
 * 默认监控钩子（日志记录）
 */
export function defaultMonitoringHook(error: AppError | Error, context: Context, requestId: string): void {
  const appError = error as AppError;
  const level = (appError.statusCode || 500) >= 500 ? 'error' : 'warn';

  console[level](`[${level.toUpperCase()}] ${appError.code || 'UNKNOWN'}: ${error.message}`, {
    requestId,
    path: context.req.path,
    method: context.req.method,
    statusCode: appError.statusCode,
    isOperational: appError.isOperational,
  });
}

// 添加默认监控钩子
addMonitoringHook(defaultMonitoringHook);

// ===== 导出所有错误类 =====
export {
  AppError,
  HttpError,
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  ValidationError,
  RateLimitError,
  InternalServerError,
  ServiceUnavailableError,
};
