#!/usr/bin/env bun
/**
 * 文件监听器测试脚本
 *
 * 用于测试文件监听器的基本功能
 */

import { createWatcherDefault } from './src/server/services/watcher.js';

const rootDir = process.argv[2] || process.cwd();

console.log(`🔍 Starting file watcher for: ${rootDir}`);

const watcher = createWatcherDefault(rootDir);

// 监听就绪事件
watcher.on('ready', () => {
  console.log('✅ Watcher is ready');
  const status = watcher.getStatus();
  console.log(`📂 Watching ${status.watchedPaths.length} path(s)`);
});

// 监听变更事件
watcher.on('change', (event) => {
  console.log(`📝 File ${event.type}: ${event.relativePath}`);
});

// 监听特定类型的事件
watcher.on('event:add', (event) => {
  console.log(`➕ Added: ${event.relativePath}`);
});

watcher.on('event:change', (event) => {
  console.log(`✏️  Changed: ${event.relativePath}`);
});

watcher.on('event:unlink', (event) => {
  console.log(`🗑️  Deleted: ${event.relativePath}`);
});

// 监听错误
watcher.on('error', (error) => {
  console.error(`❌ Error:`, error);
});

// 监听警告
watcher.on('warning', (warning) => {
  console.warn(`⚠️  Warning:`, warning);
});

// 监听停止事件
watcher.on('stopped', () => {
  console.log('🛑 Watcher stopped');
  process.exit(0);
});

// 处理进程退出
process.on('SIGINT', async () => {
  console.log('\n👋 Stopping watcher...');
  await watcher.stop();
});

process.on('SIGTERM', async () => {
  console.log('\n👋 Stopping watcher...');
  await watcher.stop();
});

console.log('Press Ctrl+C to stop');
