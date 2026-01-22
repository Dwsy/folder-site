/**
 * 文件监听器集成示例
 *
 * 展示如何在服务器中集成文件监听器
 */

import { FileWatcher, createWatcherDefault } from './watcher.js';
import type { WatcherChangeEvent } from './watcher.js';

/**
 * 示例：在服务器中集成文件监听器
 */
export class WatcherIntegration {
  private watcher?: FileWatcher;
  private rootDir: string;

  constructor(rootDir: string) {
    this.rootDir = rootDir;
  }

  /**
   * 启动监听器并集成到服务器
   */
  start(): void {
    // 创建监听器
    this.watcher = createWatcherDefault(this.rootDir);

    // 监听文件变更，触发客户端重新加载
    this.watcher.on('change', (event: WatcherChangeEvent) => {
      this.handleFileChange(event);
    });

    // 监听错误
    this.watcher.on('error', (error: Error) => {
      console.error('[Watcher] Error:', error);
    });

    // 监听就绪状态
    this.watcher.on('ready', () => {
      console.log('[Watcher] Ready and watching');
    });
  }

  /**
   * 停止监听器
   */
  async stop(): Promise<void> {
    if (this.watcher) {
      await this.watcher.stop();
      this.watcher = undefined;
    }
  }

  /**
   * 处理文件变更
   */
  private handleFileChange(event: WatcherChangeEvent): void {
    // 在实际应用中，这里可以：
    // 1. 通过 WebSocket 发送变更事件到客户端
    // 2. 触发重新扫描文件
    // 3. 更新文件索引
    // 4. 触发重新渲染

    console.log(`[Watcher] File ${event.type}: ${event.relativePath}`);

    // 示例：通过 WebSocket 发送变更事件
    // this.broadcastChange(event);

    // 示例：触发重新扫描
    // this.rescanFile(event.path);
  }

  /**
   * 获取监听器状态
   */
  getStatus() {
    return this.watcher?.getStatus() || {
      isWatching: false,
      watchedPaths: [],
    };
  }
}

/**
 * 使用示例
 */
export function setupWatcher(rootDir: string): WatcherIntegration {
  const integration = new WatcherIntegration(rootDir);
  integration.start();
  return integration;
}

/**
 * WebSocket 集成示例（伪代码）
 *
 * 在实际应用中，你可以这样集成 WebSocket：
 *
 * ```typescript
 * import { WebSocket } from 'ws';
 * import { FileWatcher } from './services/watcher.js';
 *
 * const wss = new WebSocket.Server({ port: 8080 });
 * const watcher = createWatcherDefault('./docs');
 *
 * watcher.on('change', (event) => {
 *   // 广播变更到所有连接的客户端
 *   wss.clients.forEach((client) => {
 *     if (client.readyState === WebSocket.OPEN) {
 *       client.send(JSON.stringify({
 *         type: 'file:change',
 *         data: event,
 *       }));
 *     }
 *   });
 * });
 * ```
 */
