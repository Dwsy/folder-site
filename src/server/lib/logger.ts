/**
 * 结构化日志模块
 * 提供统一的日志记录功能，支持不同日志级别和环境配置
 */

import { randomUUID } from 'crypto';

/**
 * 日志级别枚举
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

/**
 * 日志级别名称映射
 */
const LOG_LEVEL_NAMES: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR',
  [LogLevel.FATAL]: 'FATAL',
};

/**
 * 日志级别颜色映射（开发环境）
 */
const LOG_LEVEL_COLORS: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: '\x1b[36m', // Cyan
  [LogLevel.INFO]: '\x1b[32m',  // Green
  [LogLevel.WARN]: '\x1b[33m',  // Yellow
  [LogLevel.ERROR]: '\x1b[31m', // Red
  [LogLevel.FATAL]: '\x1b[35m', // Magenta
};

/**
 * 日志上下文接口
 */
export interface LogContext {
  requestId?: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  duration?: number;
  [key: string]: any;
}

/**
 * 日志条目接口
 */
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  levelName: string;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
  [key: string]: any;
}

/**
 * 错误监控指标接口
 */
export interface ErrorMetrics {
  timestamp: number;
  level: LogLevel;
  errorType: string;
  statusCode?: number;
  path?: string;
  method?: string;
  requestId: string;
}

/**
 * 监控钩子接口
 */
export interface MonitoringHook {
  (metrics: ErrorMetrics): void;
}

/**
 * 日志配置接口
 */
export interface LoggerConfig {
  minLevel: LogLevel;
  enableColors: boolean;
  enableStructuredLogs: boolean;
  enableMetrics: boolean;
  environment: 'development' | 'production' | 'test';
}

/**
 * 默认配置
 */
const defaultConfig: LoggerConfig = {
  minLevel: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
  enableColors: process.env.NODE_ENV !== 'production',
  enableStructuredLogs: false,
  enableMetrics: true,
  environment: (process.env.NODE_ENV as any) || 'development',
};

/**
 * 日志器类
 */
export class Logger {
  private config: LoggerConfig;
  private metricsCallback: MonitoringHook | null = null;
  private metricsBuffer: ErrorMetrics[] = [];
  private readonly MAX_METRICS_BUFFER = 100;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * 设置监控回调
   */
  setMonitoringHook(callback: MonitoringHook): void {
    this.metricsCallback = callback;
  }

  /**
   * 获取错误指标缓冲区
   */
  getMetricsBuffer(): ErrorMetrics[] {
    return [...this.metricsBuffer];
  }

  /**
   * 清空指标缓冲区
   */
  clearMetricsBuffer(): void {
    this.metricsBuffer = [];
  }

  /**
   * 记录日志
   */
  private log(entry: LogEntry): void {
    const message = this.formatLog(entry);

    if (this.config.enableStructuredLogs) {
      console.log(JSON.stringify(entry));
    } else if (this.config.enableColors) {
      const color = LOG_LEVEL_COLORS[entry.level];
      const reset = '\x1b[0m';
      console.log(`${color}${message}${reset}`);
    } else {
      console.log(message);
    }
  }

  /**
   * 格式化日志消息
   */
  private formatLog(entry: LogEntry): string {
    const { timestamp, levelName, message, context } = entry;

    let logMessage = `[${timestamp}] ${levelName}: ${message}`;

    if (context) {
      const parts: string[] = [];
      if (context.requestId) parts.push(`req=${context.requestId}`);
      if (context.method && context.path) parts.push(`[${context.method} ${context.path}]`);
      if (context.statusCode) parts.push(`status=${context.statusCode}`);
      if (context.duration) parts.push(`${context.duration}ms`);
      if (context.ip && context.ip !== 'unknown') parts.push(`from=${context.ip}`);

      if (parts.length > 0) {
        logMessage += ` ${parts.join(' ')}`;
      }
    }

    if (entry.error) {
      logMessage += ` - ${entry.error.name}: ${entry.error.message}`;
      if (this.config.environment === 'development' && entry.error.stack) {
        logMessage += `\n${entry.error.stack}`;
      }
    }

    return logMessage;
  }

  /**
   * 记录错误指标
   */
  private recordMetrics(entry: LogEntry): void {
    if (!this.config.enableMetrics || entry.level < LogLevel.ERROR) {
      return;
    }

    const metrics: ErrorMetrics = {
      timestamp: Date.now(),
      level: entry.level,
      errorType: entry.error?.name || 'Unknown',
      statusCode: entry.context?.statusCode,
      path: entry.context?.path,
      method: entry.context?.method,
      requestId: entry.context?.requestId || 'unknown',
    };

    // 添加到缓冲区
    this.metricsBuffer.push(metrics);
    if (this.metricsBuffer.length > this.MAX_METRICS_BUFFER) {
      this.metricsBuffer.shift();
    }

    // 调用监控回调
    if (this.metricsCallback) {
      try {
        this.metricsCallback(metrics);
      } catch (error) {
        console.error('[Logger] Monitoring hook error:', error);
      }
    }
  }

  /**
   * 创建日志条目
   */
  private createEntry(level: LogLevel, message: string, context?: LogContext, error?: Error): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      levelName: LOG_LEVEL_NAMES[level],
      message,
      context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: (error as any).code,
      } : undefined,
    };
  }

  /**
   * DEBUG 级别日志
   */
  debug(message: string, context?: LogContext, error?: Error): void {
    if (level < this.config.minLevel) return;
    const entry = this.createEntry(LogLevel.DEBUG, message, context, error);
    this.log(entry);
  }

  /**
   * INFO 级别日志
   */
  info(message: string, context?: LogContext, error?: Error): void {
    if (LogLevel.INFO < this.config.minLevel) return;
    const entry = this.createEntry(LogLevel.INFO, message, context, error);
    this.log(entry);
  }

  /**
   * WARN 级别日志
   */
  warn(message: string, context?: LogContext, error?: Error): void {
    if (LogLevel.WARN < this.config.minLevel) return;
    const entry = this.createEntry(LogLevel.WARN, message, context, error);
    this.log(entry);
  }

  /**
   * ERROR 级别日志
   */
  error(message: string, context?: LogContext, error?: Error): void {
    if (LogLevel.ERROR < this.config.minLevel) return;
    const entry = this.createEntry(LogLevel.ERROR, message, context, error);
    this.log(entry);
    this.recordMetrics(entry);
  }

  /**
   * FATAL 级别日志
   */
  fatal(message: string, context?: LogContext, error?: Error): void {
    if (LogLevel.FATAL < this.config.minLevel) return;
    const entry = this.createEntry(LogLevel.FATAL, message, context, error);
    this.log(entry);
    this.recordMetrics(entry);
  }

  /**
   * 生成请求唯一标识
   */
  generateRequestId(): string {
    return randomUUID().slice(0, 8);
  }

  /**
   * 获取配置
   */
  getConfig(): LoggerConfig {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

/**
 * 默认日志器实例
 */
export const logger = new Logger();

/**
 * 导出日志级别
 */
export { LogLevel };
