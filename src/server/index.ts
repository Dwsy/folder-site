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

  // API 路由
  app.route('/api', apiRoutes);
  app.route('/api/files', filesRoutes);
  app.route('/api/search', searchRoutes);

  // 静态文件服务
  app.get('/assets/*', serveStatic({ root: './dist/client' }));
  app.get('/favicon.ico', serveStatic({ path: './dist/client/favicon.ico' }));

  // SPA fallback（对于非 API 路径）
  app.get('*', async (c, next) => {
    // 如果是 API 路径但未匹配，返回 404
    if (c.req.path.startsWith('/api')) {
      return notFoundHandler(c);
    }
    // 否则返回 index.html
    return serveStatic({ path: './dist/client/index.html' })(c, next);
  });

  // 404 处理
  app.notFound(notFoundHandler);

  debugLog('Server initialized successfully');

  return app;
}