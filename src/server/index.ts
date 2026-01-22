/**
 * Hono 服务器主入口
 * 创建并配置 Hono 应用实例
 */

import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import { errorHandler, notFoundHandler, requestLogger, cors, bodyParser, debugLog } from './middleware/index.js';
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

  // 全局中间件
  app.use('*', cors());
  app.use('*', bodyParser());
  app.use('*', errorHandler);
  app.use('*', requestLogger);

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
      debugLog(`Static file not found: ${path}`);
    },
  }));

  // SPA fallback - 必须在所有其他路由之后
  // 对于非 API 路径且找不到静态文件的情况，返回 index.html
  app.get('*', (c) => {
    // 如果是 API 路径但未匹配，返回 404
    if (c.req.path.startsWith('/api')) {
      return notFoundHandler(c);
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

  // 404 处理
  app.notFound(notFoundHandler);

  debugLog('Server initialized successfully');

  return app;
}