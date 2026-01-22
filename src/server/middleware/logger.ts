/**
 * 日志中间件
 */

import type { Context, Next } from 'hono';

/**
 * 日志级别
 */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

/**
 * 日志格式
 */
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  method: string;
  path: string;
  status?: number;
  duration?: number;
  ip?: string;
  userAgent?: string;
  message?: string;
}

/**
 * 格式化时间戳
 */
function formatTimestamp(): string {
  return new Date().toISOString();
}

/**
 * 获取客户端 IP
 */
function getClientIp(c: Context): string {
  return c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
         c.req.header('x-real-ip') ||
         'unknown';
}

/**
 * 获取 User-Agent
 */
function getUserAgent(c: Context): string {
  return c.req.header('user-agent') || 'unknown';
}

/**
 * 格式化持续时间
 */
function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * 颜色化日志（开发环境）
 */
function colorizeLog(level: LogLevel, message: string): string {
  const colors: Record<LogLevel, string> = {
    [LogLevel.DEBUG]: '\x1b[36m', // Cyan
    [LogLevel.INFO]: '\x1b[32m',  // Green
    [LogLevel.WARN]: '\x1b[33m',  // Yellow
    [LogLevel.ERROR]: '\x1b[31m', // Red
  };
  const reset = '\x1b[0m';
  return `${colors[level]}${message}${reset}`;
}

/**
 * 输出日志
 */
function log(entry: LogEntry) {
  const { level, method, path, status, duration, ip, message } = entry;

  let logMessage = `[${entry.timestamp}] ${level} ${method} ${path}`;

  if (status !== undefined) {
    logMessage += ` ${status}`;
  }

  if (duration !== undefined) {
    logMessage += ` (${formatDuration(duration)})`;
  }

  if (ip !== 'unknown') {
    logMessage += ` from ${ip}`;
  }

  if (message) {
    logMessage += ` - ${message}`;
  }

  // 开发环境使用颜色
  if (process.env.NODE_ENV === 'development') {
    console.log(colorizeLog(level, logMessage));
  } else {
    console.log(logMessage);
  }
}

/**
 * 请求日志中间件
 */
export async function requestLogger(c: Context, next: Next) {
  const startTime = Date.now();
  const method = c.req.method;
  const path = c.req.path;
  const ip = getClientIp(c);
  const userAgent = getUserAgent(c);

  // 记录请求开始
  log({
    timestamp: formatTimestamp(),
    level: LogLevel.INFO,
    method,
    path,
    ip,
    userAgent,
    message: 'Request started',
  });

  await next();

  const duration = Date.now() - startTime;
  const status = c.res.status;

  // 根据状态码确定日志级别
  let level = LogLevel.INFO;
  if (status >= 500) {
    level = LogLevel.ERROR;
  } else if (status >= 400) {
    level = LogLevel.WARN;
  }

  // 记录响应
  log({
    timestamp: formatTimestamp(),
    level,
    method,
    path,
    status,
    duration,
    ip,
    userAgent,
    message: 'Request completed',
  });
}

/**
 * 错误日志中间件
 */
export function errorLogger(error: Error, c: Context) {
  log({
    timestamp: formatTimestamp(),
    level: LogLevel.ERROR,
    method: c.req.method,
    path: c.req.path,
    ip: getClientIp(c),
    userAgent: getUserAgent(c),
    message: error.message,
  });
}

/**
 * 调试日志函数
 */
export function debugLog(message: string, data?: any) {
  if (process.env.NODE_ENV === 'development') {
    log({
      timestamp: formatTimestamp(),
      level: LogLevel.DEBUG,
      method: 'DEBUG',
      path: '-',
      message,
    });

    if (data) {
      console.log(data);
    }
  }
}