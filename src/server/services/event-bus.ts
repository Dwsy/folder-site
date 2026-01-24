/**
 * 事件总线
 *
 * 提供发布/订阅模式的事件系统
 * - 事件发布
 * - 事件订阅
 * - 一次性订阅
 * - 订阅者管理
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

export type EventType = string;

export interface EventMessage<T = any> {
  id: string;
  type: EventType;
  timestamp: number;
  data: T;
  source?: string;
  metadata?: Record<string, any>;
}

export type EventHandler<T = any> = (event: EventMessage<T>) => void;

export interface Subscription {
  id: string;
  eventType: EventType;
  handler: EventHandler;
  once: boolean;
}

/**
 * 事件总线类
 */
export class EventBus extends EventEmitter {
  private subscriptions: Map<string, Subscription> = new Map();
  private subscriptionIdCounter = 0;

  /**
   * 发布事件
   */
  publish<T>(event: EventMessage<T>): void {
    const { type } = event;

    // 获取所有订阅者
    const subscribers = this.subscriptions.values().filter(
      sub => sub.eventType === type
    );

    // 触发事件
    this.emit(type, event);

    // 调用订阅者处理器
    const toRemove: string[] = [];
    for (const sub of subscribers) {
      try {
        sub.handler(event);

        // 一次性订阅，触发后移除
        if (sub.once) {
          toRemove.push(sub.id);
        }
      } catch (error) {
        console.error(`[EventBus] Error in handler for ${type}:`, error);
      }
    }

    // 移除一次性订阅
    for (const subId of toRemove) {
      this.subscriptions.delete(subId);
    }
  }

  /**
   * 订阅事件
   */
  subscribe<T>(
    type: EventType,
    handler: EventHandler<T>,
    once: boolean = false
  ): () => void {
    const subscriptionId = `sub_${++this.subscriptionIdCounter}`;

    const subscription: Subscription = {
      id: subscriptionId,
      eventType: type,
      handler,
      once,
    };

    this.subscriptions.set(subscriptionId, subscription);

    // 返回取消订阅函数
    return () => {
      this.subscriptions.delete(subscriptionId);
      this.removeListener(type, handler as any);
    };
  }

  /**
   * 一次性订阅
   */
  once<T>(type: EventType, handler: EventHandler<T>): void {
    this.subscribe(type, handler, true);
  }

  /**
   * 取消订阅
   */
  unsubscribe(subscriptionId: string): boolean {
    return this.subscriptions.delete(subscriptionId);
  }

  /**
   * 取消某个类型的所有订阅
   */
  unsubscribeAll(type: EventType): void {
    const toRemove: string[] = [];
    for (const [id, sub] of this.subscriptions) {
      if (sub.eventType === type) {
        toRemove.push(id);
      }
    }
    for (const id of toRemove) {
      this.subscriptions.delete(id);
    }
  }

  /**
   * 获取订阅者数量
   */
  getSubscriberCount(type: EventType): number {
    let count = 0;
    for (const sub of this.subscriptions.values()) {
      if (sub.eventType === type) {
        count++;
      }
    }
    return count;
  }

  /**
   * 获取所有订阅
   */
  getSubscriptions(type?: EventType): Subscription[] {
    if (type) {
      return Array.from(this.subscriptions.values()).filter(
        sub => sub.eventType === type
      );
    }
    return Array.from(this.subscriptions.values());
  }

  /**
   * 清除所有订阅
   */
  clear(): void {
    this.subscriptions.clear();
    this.removeAllListeners();
  }

  /**
   * 获取统计信息
   */
  getStats() {
    const stats = new Map<EventType, number>();
    for (const sub of this.subscriptions.values()) {
      const count = stats.get(sub.eventType) || 0;
      stats.set(sub.eventType, count + 1);
    }
    return {
      totalSubscriptions: this.subscriptions.size,
      subscriptionsByType: Object.fromEntries(stats),
    };
  }
}

let eventBusInstance: EventBus | null = null;

export function getEventBus(): EventBus {
  if (!eventBusInstance) {
    eventBusInstance = new EventBus();
  }
  return eventBusInstance;
}

export function createEventBus(): EventBus {
  return new EventBus();
}