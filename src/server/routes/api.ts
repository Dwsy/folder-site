/**
 * API 路由
 */

import { Hono } from 'hono';
import type { HealthCheckResponse, ApiResponse } from '../../types/api.js';
import { loadConfig } from '../lib/config-loader.js';

const api = new Hono();

/**
 * 健康检查端点
 */
api.get('/health', (c) => {
  const uptime = process.uptime();
  const response: HealthCheckResponse = {
    status: 'ok',
    message: 'Folder-Site CLI is running',
    version: process.env.npm_package_version || '0.1.0',
    uptime: Math.floor(uptime),
  };

  return c.json<ApiResponse<HealthCheckResponse>>({
    success: true,
    data: response,
    timestamp: Date.now(),
  });
});

/**
 * API 信息端点
 */
api.get('/', (c) => {
  return c.json<ApiResponse>({
    success: true,
    data: {
      name: 'Folder-Site CLI API',
      version: process.env.npm_package_version || '0.1.0',
      endpoints: {
        health: '/api/health',
        files: '/api/files',
        search: '/api/search',
        workhub: '/api/workhub',
        export: '/api/export',
        config: '/api/config',
      },
    },
    timestamp: Date.now(),
  });
});

/**
 * 配置端点
 */
api.get('/config', (c) => {
  const rootDir = process.env.FOLDER_SITE_ROOT || process.cwd();
  const config = loadConfig(rootDir);

  return c.json<ApiResponse>({
    success: true,
    data: config,
    timestamp: Date.now(),
  });
});

export default api;