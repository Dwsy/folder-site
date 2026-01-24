/**
 * 事件类型定义
 *
 * 统一的事件类型系统
 */

import type { FileInfo } from './files.js';

export type EventType =
  // 文件系统事件
  | 'file.added'
  | 'file.changed'
  | 'file.removed'
  | 'directory.added'
  | 'directory.removed'
  // 索引事件
  | 'index.updated'
  | 'index.rebuilding'
  // 系统事件
  | 'system.status'
  | 'system.error'
  // WebSocket 事件
  | 'ws.client.connected'
  | 'ws.client.disconnected'
  // 插件事件（命名空间）
  | `plugin.${string}`;

// 文件事件数据
export interface FileEventData {
  path: string;
  relativePath: string;
  extension: string;
  size: number;
  isDirectory: boolean;
  name: string;
}

// 目录事件数据
export interface DirectoryEventData {
  path: string;
  relativePath: string;
  name: string;
}

// 索引更新事件数据
export interface IndexUpdatedEventData {
  totalFiles: number;
  totalDirectories: number;
  totalSize: number;
  changed: number;
}

// 系统状态事件数据
export interface SystemStatusEventData {
  status: 'ok' | 'error' | 'restarting';
  message: string;
  uptime?: number;
}

// 系统错误事件数据
export interface SystemErrorEventData {
  message: string;
  code?: string;
  stack?: string;
}

// WebSocket 客户端连接事件数据
export interface WSClientConnectedEventData {
  clientId: string;
  userAgent?: string;
  connectedAt: number;
}

// WebSocket 客户端断开事件数据
export interface WSClientDisconnectedEventData {
  clientId: string;
  connectedAt: number;
  disconnectedAt: number;
  duration: number;
}