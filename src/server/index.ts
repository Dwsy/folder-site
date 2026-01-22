/**
 * Hono 服务器主入口
 * 创建并配置 Hono 应用实例
 */

import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import {
  globalErrorHandler,
  onErrorHandler,
  requestIdMiddleware,
  notFoundHandler as newNotFoundHandler,
  logger as newLogger,
  requestLogger,
  cors,
  bodyParser,
} from './middleware/index.js';
import apiRoutes from './routes/api.js';
import filesRoutes from './routes/files.js';
import searchRoutes from './routes/search.js';

/**
 * MIME 类型映射配置
 * 确保各种静态文件类型正确返回
 */
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
};

/**
 * 创建 Hono 服务器实例
 * @returns 配置好的 Hono 应用
 */
export function createServer(): Hono {
  const app = new Hono();

  // 全局错误处理（使用 Hono 的 onError 钩子）
  // 这会捕获所有中间件和路由中抛出的错误
  app.onError(onErrorHandler);

  // 全局中间件顺序很重要
  // 1. CORS
  app.use('*', cors());

  // 2. Request ID 注入（必须在其他中间件之前）
  app.use('*', requestIdMiddleware);

  // 3. Body Parser
  app.use('*', bodyParser());

  // 4. 全局错误处理中间件（捕获 next() 中的错误）
  app.use('*', globalErrorHandler);

  // 5. 请求日志记录
  app.use('*', requestLogger);

  // 设置监控钩子（可选，用于集成外部监控服务）
  // addMonitoringHook((error, context, requestId) => {
  //   // 这里可以集成 Sentry, DataDog 等监控服务
  //   console.log('[Monitoring Hook]', requestId, error.message);
  // });

  // API 路由 - 必须在静态文件路由之前
  app.route('/api', apiRoutes);
  app.route('/api/files', filesRoutes);
  app.route('/api/search', searchRoutes);

  // 静态文件服务 - 从 dist/client 目录提供
  // 配置了 MIME 类型映射和缓存控制
  app.use('/*', serveStatic({
    root: './dist/client',
    // 启用 onNotFound 处理，用于 SPA fallback
    onNotFound: (path, c) => {
      newLogger.debug(`Static file not found: ${path}`);
    },
  }));

  // SPA fallback - 必须在所有其他路由之后
  // 对于非 API 路径且找不到静态文件的情况，返回 index.html
  app.get('*', (c) => {
    // 如果是 API 路径但未匹配，返回 404
    if (c.req.path.startsWith('/api')) {
      return newNotFoundHandler(c);
    }

    // 对于前端路由，返回 index.html
    // 这样 React Router 可以处理客户端路由
    return serveStatic({
      path: './dist/client/index.html',
      // 确保 index.html 返回正确的 MIME 类型
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    })(c);
  });

  // 404 处理 - 使用新的处理器
  app.notFound(newNotFoundHandler);

  newLogger.debug('Server initialized successfully with enhanced error handling');

  return app;
}