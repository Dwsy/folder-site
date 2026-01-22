/**
 * 服务器中间件导出
 */

// 错误处理（新版本）
export {
  globalErrorHandler,
  onErrorHandler,
  notFoundHandler as newNotFoundHandler,
  requestIdMiddleware,
  AppError,
  HttpError,
  NotFoundError,
  BadRequestError,
  ValidationError,
  InternalServerError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  RateLimitError,
  ServiceUnavailableError,
  classifyError,
  isAppError,
  addMonitoringHook,
  removeMonitoringHook,
  triggerMonitoringHooks,
  throwNotFound,
  throwBadRequest,
  throwValidationError,
  throwUnauthorized,
  throwForbidden,
  throwInternalServerError,
} from './error-handler.js';

// 错误处理（旧版本，保持兼容）
export { errorHandler as legacyErrorHandler, notFoundHandler, ApiErrorClass } from './error.js';

// 日志（新版本）
export { logger, Logger, LogLevel, type LogContext, type ErrorMetrics, type MonitoringHook } from '../lib/logger.js';

// 日志（旧版本，保持兼容）
export { requestLogger, errorLogger as legacyErrorLogger, debugLog } from './logger.js';

export { cors, type CorsOptions } from './cors.js';
export { bodyParser, type BodyParserOptions } from './body-parser.js';