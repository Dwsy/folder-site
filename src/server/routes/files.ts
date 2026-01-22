/**
 * 文件路由
 */

import { Hono } from 'hono';
import type { ApiResponse, FileListResponse, FileContentResponse, DirectoryTreeResponse } from '../../types/api.js';

const files = new Hono();

/**
 * 获取文件列表
 */
files.get('/', (c) => {
  // TODO: 实现文件列表逻辑
  const response: FileListResponse = {
    files: [],
    total: 0,
  };

  return c.json<ApiResponse<FileListResponse>>({
    success: true,
    data: response,
    timestamp: Date.now(),
  });
});

/**
 * 获取目录树
 * 注意：这个路由必须在通配符路由之前定义
 */
files.get('/tree/list', (c) => {
  // TODO: 实现目录树逻辑
  const response: DirectoryTreeResponse = {
    root: process.cwd(),
    tree: {
      name: 'root',
      path: process.cwd(),
      relativePath: '',
      isDirectory: true,
      children: [],
    },
    totalNodes: 0,
  };

  return c.json<ApiResponse<DirectoryTreeResponse>>({
    success: true,
    data: response,
    timestamp: Date.now(),
  });
});

/**
 * 获取文件内容
 * 注意：这个路由必须在最后，因为它使用通配符匹配
 */
files.get('/:path{.+}', (c) => {
  const path = c.req.param('path');

  // TODO: 实现文件内容读取逻辑
  const response: FileContentResponse = {
    info: {
      name: '',
      path: path || '',
      relativePath: path || '',
      extension: '',
      size: 0,
      modifiedAt: new Date(),
      createdAt: new Date(),
      isDirectory: false,
      isFile: true,
      isSymbolicLink: false,
    },
    content: '',
    meta: {
      title: '',
      description: '',
      tags: [],
      updated: new Date().toISOString(),
    },
  };

  return c.json<ApiResponse<FileContentResponse>>({
    success: true,
    data: response,
    timestamp: Date.now(),
  });
});

export default files;