# WebSocket 系统设计文档

## 设计目标

为 Folder-Site 项目构建一个通用、可扩展的 WebSocket 系统，用于实时通信和事件广播。

## 设计原则

### 1. 事件驱动架构
- 与项目现有的 EventStorming 模型保持一致
- 使用统一的事件类型定义
- 支持事件的发布/订阅模式

### 2. 插件化集成
- 允许插件通过 manifest.json 声明事件订阅
- 插件可以发布自定义事件
- 插件间通过事件解耦

### 3. 通用性与扩展性
- 不限于文件系统事件
- 支持自定义事件类型
- 预留房间/频道、权限、协作等扩展点

### 4. 类型安全
- 完整的 TypeScript 类型定义
- 编译时类型检查
- 运行时类型验证（可选）

## 核心概念

### 事件系统

```typescript
// 事件类型（可扩展）
type EventType =
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
  // 插件事件（命名空间）
  | `plugin.${string}`;

// 事件消息
interface EventMessage<T = any> {
  id: string;              // 唯一事件 ID
  type: EventType;         // 事件类型
  timestamp: number;       // 时间戳
  data: T;                 // 事件数据
  source?: string;         // 事件来源（可选）
  metadata?: Record<string, any>; // 元数据（可选）
}
```

### 客户端管理

```typescript
// 客户端信息
interface WSClient {
  id: string;                    // 客户端 ID
  userAgent?: string;            // User-Agent
  connectedAt: number;           // 连接时间
  subscriptions: Set<EventType>; // 订阅的事件类型
  rooms: Set<string>;            // 加入的房间（预留）
  metadata?: Record<string, any>; // 客户端元数据
}

// 客户端连接
function connect(ws: WebSocket): string;

// 断开连接
function disconnect(clientId: string): void;

// 获取客户端
function getClient(clientId: string): WSClient | undefined;

// 获取所有客户端
function getAllClients(): WSClient[];
```

### 订阅/发布

```typescript
// 订阅事件
interface SubscribeRequest {
  types: EventType[];     // 要订阅的事件类型
  rooms?: string[];       // 要加入的房间（预留）
}

function subscribe(clientId: string, types: EventType[]): void;

// 取消订阅
function unsubscribe(clientId: string, types: EventType[]): void;

// 发布事件
interface PublishOptions {
  type: EventType;        // 事件类型
  data: any;              // 事件数据
  filter?: (client: WSClient) => boolean; // 客户端过滤
  rooms?: string[];       // 目标房间（预留）
}

function publish<T>(options: PublishOptions): void;
```

## 架构设计

### 模块结构

```
src/server/
├── services/
│   ├── event-bus.ts          # 事件总线（核心）
│   ├── event-registry.ts     # 事件注册表（类型注册）
│   └── websocket.ts          # WebSocket 服务（实现）
├── routes/
│   └── ws.ts                 # WebSocket 路由（入口）
└── types/
    └── events.ts             # 事件类型定义
```

### 组件职责

#### 1. EventBus（事件总线）

```typescript
class EventBus {
  // 发布事件
  publish<T>(event: EventMessage<T>): void;

  // 订阅事件（服务器内部）
  subscribe<T>(
    type: EventType,
    handler: (event: EventMessage<T>) => void
  ): () => void; // 返回取消订阅函数

  // 一次性订阅
  once<T>(
    type: EventType,
    handler: (event: EventMessage<T>) => void
  ): void;

  // 获取订阅者数量
  getSubscriberCount(type: EventType): number;
}
```

**职责：**
- 管理事件的发布/订阅
- 事件分发
- 订阅者管理

#### 2. EventRegistry（事件注册表）

```typescript
class EventRegistry {
  // 注册事件类型
  registerType<T>(type: EventType, schema?: z.ZodSchema<T>): void;

  // 获取事件类型
  getType(type: EventType): EventTypeDefinition | undefined;

  // 验证事件数据
  validate<T>(type: EventType, data: T): boolean;

  // 获取所有事件类型
  getAllTypes(): EventType[];
}

interface EventTypeDefinition<T = any> {
  type: EventType;
  schema?: z.ZodSchema<T>;
  description?: string;
}
```

**职责：**
- 事件类型注册
- 事件数据验证
- 事件元数据管理

#### 3. WebSocketService（WebSocket 服务）

```typescript
class WebSocketService {
  private eventBus: EventBus;
  private clients: Map<string, WSClient>;

  constructor(eventBus: EventBus);

  // 连接客户端
  connect(ws: WebSocket): string;

  // 断开连接
  disconnect(clientId: string): void;

  // 订阅事件
  subscribe(clientId: string, types: EventType[]): void;

  // 取消订阅
  unsubscribe(clientId: string, types: EventType[]): void;

  // 发送消息给客户端
  send(clientId: string, message: EventMessage): boolean;

  // 广播消息
  broadcast<T>(options: PublishOptions): void;

  // 获取统计信息
  getStats(): WSStats;
}
```

**职责：**
- WebSocket 连接管理
- 消息收发
- 客户端订阅管理
- 事件广播

## 与现有系统集成

### 1. 文件索引监视器集成

```typescript
// src/server/services/file-index-watcher.ts

import { getEventBus } from './event-bus.js';

class FileIndexWatcherService {
  private eventBus: EventBus;

  constructor(options: FileIndexWatcherOptions) {
    this.eventBus = getEventBus();
  }

  private startWatcher() {
    this.watcher.on('add', async (event) => {
      await this.indexer.handleChange('add', event.path);

      // 发布文件添加事件
      this.eventBus.publish({
        id: generateId(),
        type: 'file.added',
        timestamp: Date.now(),
        data: {
          path: event.path,
          relativePath: event.relativePath,
          extension: event.extension,
          size: 0, // 需要从索引获取
          isDirectory: false,
        },
        source: 'file-index-watcher',
      });
    });

    this.watcher.on('unlink', async (event) => {
      await this.indexer.handleChange('unlink', event.path);

      // 发布文件删除事件
      this.eventBus.publish({
        id: generateId(),
        type: 'file.removed',
        timestamp: Date.now(),
        data: {
          path: event.path,
          relativePath: event.relativePath,
          extension: event.extension,
          size: 0,
          isDirectory: false,
        },
        source: 'file-index-watcher',
      });
    });

    // ... 其他事件
  }
}
```

### 2. 插件系统集成

```typescript
// 插件 manifest.json 扩展

{
  "id": "mermaid-renderer",
  "capabilities": [{
    "type": "renderer",
    "name": "mermaid",
    "events": {
      "subscribe": ["file.changed"], // 订阅文件变化
      "publish": ["plugin.mermaid.rendered"] // 发布渲染完成事件
    }
  }]
}
```

```typescript
// 插件事件处理器

class PluginManager {
  private eventBus: EventBus;

  loadPlugin(manifest: PluginManifest) {
    // 根据 manifest 配置订阅事件
    if (manifest.events?.subscribe) {
      for (const eventType of manifest.events.subscribe) {
        this.eventBus.subscribe(eventType, (event) => {
          this.handlePluginEvent(manifest.id, event);
        });
      }
    }
  }

  handlePluginEvent(pluginId: string, event: EventMessage) {
    // 处理插件事件
    const plugin = this.plugins.get(pluginId);
    if (plugin?.onEvent) {
      plugin.onEvent(event);
    }
  }
}
```

## 未来扩展

### 1. 房间/频道系统

```typescript
// 加入房间
function joinRoom(clientId: string, roomId: string): void;

// 离开房间
function leaveRoom(clientId: string, roomId: string): void;

// 向房间广播
function broadcastToRoom<T>(roomId: string, event: EventMessage<T>): void;
```

**使用场景：**
- 多用户协作
- 项目隔离
- 权限控制

### 2. 权限系统

```typescript
interface Permission {
  read: boolean;
  write: boolean;
  admin: boolean;
}

interface WSClient {
  // ...
  permissions: Permission;
  userId?: string;
}

// 权限检查
function checkPermission(
  clientId: string,
  eventType: EventType
): boolean;
```

### 3. 事件持久化

```typescript
// 事件历史记录
interface EventHistory {
  events: EventMessage[];
  maxAge: number; // 最大保留时间
  maxSize: number; // 最大数量
}

// 获取历史事件
function getHistory(
  type?: EventType,
  since?: number,
  limit?: number
): EventMessage[];
```

**使用场景：**
- 新连接客户端同步状态
- 事件回放
- 调试

### 4. 事件重放

```typescript
// 重放事件
function replayEvents(
  clientId: string,
  events: EventMessage[]
): void;

// 从时间点重放
function replaySince(
  clientId: string,
  since: number
): void;
```

## 实现计划

### Phase 1: 核心 MVP
- [x] EventBus 实现
- [x] WebSocketService 实现
- [x] 基础事件类型定义
- [x] 文件索引事件集成

### Phase 2: 插件集成
- [ ] 插件事件订阅
- [ ] 插件事件发布
- [ ] manifest.json 扩展

### Phase 3: 高级功能
- [ ] 房间/频道系统
- [ ] 权限系统
- [ ] 事件持久化
- [ ] 事件重放

### Phase 4: 前端集成
- [ ] WebSocket 客户端封装
- [ ] React Hook
- [ ] 事件订阅组件
- [ ] 调试工具

## API 设计

### WebSocket 协议

#### 客户端 → 服务器

```json
// 订阅事件
{
  "type": "subscribe",
  "data": {
    "types": ["file.added", "file.removed", "index.updated"]
  }
}

// 取消订阅
{
  "type": "unsubscribe",
  "data": {
    "types": ["file.added"]
  }
}

// Ping
{
  "type": "ping"
}
```

#### 服务器 → 客户端

```json
// 事件消息
{
  "id": "evt_123456",
  "type": "file.removed",
  "timestamp": 1769238000000,
  "data": {
    "path": "/path/to/file.md",
    "relativePath": "file.md",
    "extension": "md",
    "size": 1024,
    "isDirectory": false
  },
  "source": "file-index-watcher"
}

// Pong
{
  "type": "pong",
  "timestamp": 1769238000000
}

// 错误消息
{
  "type": "error",
  "timestamp": 1769238000000,
  "data": {
    "message": "Invalid subscription",
    "code": "INVALID_SUBSCRIPTION"
  }
}
```

## 性能考虑

### 1. 连接管理
- 心跳检测（30秒超时）
- 自动重连（客户端）
- 连接池限制

### 2. 事件分发
- 批量处理
- 防抖/节流
- 优先级队列

### 3. 内存管理
- 客户端数量限制
- 事件历史限制
- 定期清理

## 安全考虑

### 1. 认证
- Token 验证（预留）
- Session 管理（预留）

### 2. 授权
- 事件类型权限
- 房间访问权限
- 操作权限

### 3. 数据验证
- 事件数据 schema 验证
- XSS 防护
- 速率限制

## 测试策略

### 单元测试
- EventBus 测试
- WebSocketService 测试
- EventRegistry 测试

### 集成测试
- 文件索引事件集成
- 插件事件集成
- 端到端测试

### 性能测试
- 并发连接测试
- 事件吞吐量测试
- 内存泄漏测试

## 文档

### API 文档
- WebSocket 协议
- 事件类型文档
- 插件开发指南

### 示例
- 客户端使用示例
- 插件事件示例
- 自定义事件示例

---

**状态：** 设计完成，待实现
**优先级：** Phase 1（核心 MVP）
**预计工作量：** 2-3 天