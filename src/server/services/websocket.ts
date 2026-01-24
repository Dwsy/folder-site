/**
 * WebSocket 服务
 *
 * 提供实时通信功能，用于向前端推送各种事件
 * - 连接管理
 * - 消息收发
 * - 事件订阅
 * - 事件广播
 */

import type { EventType } from '../types/events.js';
import type { EventMessage } from './event-bus.js';
import { getEventBus } from './event-bus.js';

export interface WSClient {
  id: string;
  ws: WebSocket;
  subscriptions: Set<EventType>;
  connectedAt: number;
  lastPing: number;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export interface WSMessage {
  type: 'event' | 'pong' | 'error';
  data?: any;
  timestamp: number;
}

export interface SubscribeRequest {
  types: EventType[];
}

export interface UnsubscribeRequest {
  types: EventType[];
}

export interface PublishOptions<T = any> {
  type: EventType;
  data: T;
  source?: string;
  metadata?: Record<string, any>;
  filter?: (client: WSClient) => boolean;
}

export interface WSStats {
  totalClients: number;
  totalSubscriptions: number;
  subscriptionsByType: Record<EventType, number>;
}

/**
 * WebSocket 服务类
 */
export class WebSocketService {
  private clients: Map<string, WSClient> = new Map();
  private eventBus: ReturnType<typeof getEventBus>;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private clientIdCounter = 0;

  constructor() {
    this.eventBus = getEventBus();
    this.startHeartbeat();
    this.setupEventBusIntegration();
  }

  /**
   * 启动心跳检测
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      const timeout = 30000; // 30秒超时

      for (const [id, client] of this.clients) {
        if (now - client.lastPing > timeout) {
          console.log(`[WebSocket] Client ${id} timeout, disconnecting`);
          this.disconnect(id, 'timeout');
        }
      }
    }, 5000);
  }

  /**
   * 设置事件总线集成
   */
  private setupEventBusIntegration(): void {
    // 订阅所有已知的事件类型并广播给订阅的客户端
    const eventTypes: EventType[] = [
      'file.added',
      'file.changed',
      'file.removed',
      'directory.added',
      'directory.removed',
      'index.updated',
      'index.rebuilding',
      'system.status',
      'system.error',
      'ws.client.connected',
      'ws.client.disconnected',
    ];

    for (const type of eventTypes) {
      this.eventBus.subscribe(type, (event: EventMessage) => {
        this.broadcast({
          type: event.type,
          data: event.data,
          source: event.source,
          metadata: event.metadata,
        });
      });
    }
  }

  /**
   * 生成客户端 ID
   */
  private generateClientId(): string {
    return `ws_${Date.now()}_${++this.clientIdCounter}`;
  }

  /**
   * 连接客户端
   */
  connect(ws: WebSocket, userAgent?: string): string {
    const clientId = this.generateClientId();

    const client: WSClient = {
      id: clientId,
      ws,
      subscriptions: new Set(),
      connectedAt: Date.now(),
      lastPing: Date.now(),
      userAgent,
    };

    // Bun WebSocket 事件处理器在 websocket-server 中处理
    // 这里只存储客户端信息

    this.clients.set(clientId, client);

    // 发布客户端连接事件
    this.eventBus.publish({
      id: `evt_${Date.now()}`,
      type: 'ws.client.connected',
      timestamp: Date.now(),
      data: {
        clientId,
        userAgent,
        connectedAt: client.connectedAt,
      },
      source: 'websocket-service',
    });

    // 发送连接成功消息
    this.sendToClient(clientId, {
      type: 'event',
      data: {
        id: `evt_${Date.now()}`,
        type: 'system.status',
        timestamp: Date.now(),
        data: {
          status: 'connected',
          clientId,
        },
      },
      timestamp: Date.now(),
    });

    console.log(`[WebSocket] Client connected: ${clientId}, total: ${this.clients.size}`);

    return clientId;
  }

  /**
   * 断开客户端
   */
  disconnect(clientId: string, reason: string = 'unknown'): void {
    const client = this.clients.get(clientId);
    if (client) {
      const duration = Date.now() - client.connectedAt;

      // 发布客户端断开事件
      this.eventBus.publish({
        id: `evt_${Date.now()}`,
        type: 'ws.client.disconnected',
        timestamp: Date.now(),
        data: {
          clientId,
          connectedAt: client.connectedAt,
          disconnectedAt: Date.now(),
          duration,
        },
        source: 'websocket-service',
      });

      client.ws.close();
      this.clients.delete(clientId);
      console.log(`[WebSocket] Client disconnected: ${clientId} (${reason}), total: ${this.clients.size}`);
    }
  }

  /**
   * 处理客户端消息
   */
  private handleMessage(clientId: string, data: string | Buffer): void {
    try {
      const message = JSON.parse(data.toString()) as {
        type: 'ping' | 'subscribe' | 'unsubscribe';
        data?: any;
      };

      if (message.type === 'ping') {
        const client = this.clients.get(clientId);
        if (client) {
          client.lastPing = Date.now();
          this.sendToClient(clientId, {
            type: 'pong',
            timestamp: Date.now(),
          });
        }
      } else if (message.type === 'subscribe') {
        this.subscribe(clientId, message.data?.types || []);
      } else if (message.type === 'unsubscribe') {
        this.unsubscribe(clientId, message.data?.types || []);
      }
    } catch (error) {
      console.error(`[WebSocket] Failed to handle message from ${clientId}:`, error);
    }
  }

  /**
   * 订阅事件类型
   */
  subscribe(clientId: string, types: EventType[]): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    types.forEach((type) => {
      client.subscriptions.add(type);
    });

    console.log(`[WebSocket] Client ${clientId} subscribed to:`, types);
  }

  /**
   * 取消订阅事件类型
   */
  unsubscribe(clientId: string, types: EventType[]): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    types.forEach((type) => {
      client.subscriptions.delete(type);
    });

    console.log(`[WebSocket] Client ${clientId} unsubscribed from:`, types);
  }

  /**
   * 发送消息给客户端
   */
  sendToClient(clientId: string, message: WSMessage): boolean {
    const client = this.clients.get(clientId);
    if (!client || client.ws.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      client.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error(`[WebSocket] Failed to send message to ${clientId}:`, error);
      this.disconnect(clientId, 'send_error');
      return false;
    }
  }

  /**
   * 广播消息给所有客户端
   */
  broadcast<T>(options: PublishOptions<T>): void {
    let successCount = 0;

    for (const [clientId, client] of this.clients) {
      // 检查订阅
      if (client.subscriptions.size > 0 && !client.subscriptions.has(options.type)) {
        continue;
      }

      // 检查过滤器
      if (options.filter && !options.filter(client)) {
        continue;
      }

      // 发送消息
      const message: WSMessage = {
        type: 'event',
        data: {
          id: `evt_${Date.now()}`,
          type: options.type,
          timestamp: Date.now(),
          data: options.data,
          source: options.source,
          metadata: options.metadata,
        },
        timestamp: Date.now(),
      };

      if (this.sendToClient(clientId, message)) {
        successCount++;
      }
    }

    console.log(`[WebSocket] Broadcast ${options.type}: ${successCount}/${this.clients.size} clients`);
  }

  /**
   * 获取连接的客户端数量
   */
  getClientCount(): number {
    return this.clients.size;
  }

  /**
   * 获取所有客户端 ID
   */
  getClientIds(): string[] {
    return Array.from(this.clients.keys());
  }

  /**
   * 获取客户端
   */
  getClient(clientId: string): WSClient | undefined {
    return this.clients.get(clientId);
  }

  /**
   * 获取所有客户端
   */
  getAllClients(): WSClient[] {
    return Array.from(this.clients.values());
  }

  /**
   * 获取统计信息
   */
  getStats(): WSStats {
    const subscriptionsByType: Record<EventType, number> = {};

    for (const client of this.clients.values()) {
      for (const type of client.subscriptions) {
        subscriptionsByType[type] = (subscriptionsByType[type] || 0) + 1;
      }
    }

    const totalSubscriptions = Object.values(subscriptionsByType).reduce(
      (sum, count) => sum + count,
      0
    );

    return {
      totalClients: this.clients.size,
      totalSubscriptions,
      subscriptionsByType,
    };
  }

  /**
   * 销毁服务
   */
  destroy(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    for (const [clientId] of this.clients) {
      this.disconnect(clientId, 'destroy');
    }

    this.clients.clear();
    console.log('[WebSocket] Service destroyed');
  }
}

let wsServiceInstance: WebSocketService | null = null;

export function getWebSocketService(): WebSocketService {
  if (!wsServiceInstance) {
    wsServiceInstance = new WebSocketService();
  }
  return wsServiceInstance;
}

export function createWebSocketService(): WebSocketService {
  return new WebSocketService();
}