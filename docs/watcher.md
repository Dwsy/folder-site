# 文件监听器服务 (File Watcher Service)

## 概述

文件监听器服务基于 `chokidar` 库实现，用于监听文件系统的变化并发出事件。支持文件类型过滤、防抖机制和自定义事件处理。

## 功能特性

- ✅ 支持 5 种文件事件：`add`、`change`、`unlink`、`addDir`、`unlinkDir`
- ✅ 文件类型过滤（默认支持：.md, .mmd, .txt, .json, .yml, .yaml）
- ✅ 防抖机制（默认 300ms）避免频繁触发
- ✅ 自动排除常见目录（node_modules, .git, dist 等）
- ✅ 动态添加/移除监听路径
- ✅ 完整的事件系统（EventEmitter）
- ✅ TypeScript 类型安全

## 快速开始

### 基本使用

```typescript
import { createWatcherDefault } from './src/server/services/watcher.js';

// 创建并启动监听器
const watcher = createWatcherDefault('./docs');

// 监听变更事件
watcher.on('change', (event) => {
  console.log(`File ${event.type}: ${event.relativePath}`);
});

// 停止监听
await watcher.stop();
```

### 自定义配置

```typescript
import { createWatcher } from './src/server/services/watcher.js';

const watcher = createWatcher({
  rootDir: './docs',
  extensions: ['.md', '.json'],  // 自定义文件扩展名
  excludeDirs: ['node_modules', 'dist'],  // 排除目录
  debounceDelay: 500,  // 防抖延迟（毫秒）
  usePolling: false,  // 是否使用轮询
});

watcher.on('change', (event) => {
  console.log('File changed:', event);
});
```

## API 文档

### FileWatcher 类

#### 事件

- `ready`: 监听器准备就绪
- `change`: 任何文件变更事件
- `event:add`: 文件添加事件
- `event:change`: 文件修改事件
- `event:unlink`: 文件删除事件
- `event:addDir`: 目录添加事件
- `event:unlinkDir`: 目录删除事件
- `error`: 错误事件
- `warning`: 警告事件
- `stopped`: 监听器停止事件

#### 方法

- `start()`: 启动监听
- `stop()`: 停止监听
- `addPath(path: string)`: 添加监听路径
- `unwatchPath(path: string)`: 移除监听路径
- `getStatus()`: 获取监听状态

### WatcherChangeEvent

```typescript
interface WatcherChangeEvent {
  type: 'add' | 'change' | 'unlink' | 'addDir' | 'unlinkDir';
  path: string;          // 文件/目录的绝对路径
  relativePath: string;  // 相对于监听根目录的路径
  isDirectory: boolean;  // 是否为目录
  extension?: string;    // 文件扩展名
  timestamp: number;     // 事件时间戳
}
```

## 集成示例

### 与服务器集成

```typescript
import { FileWatcher } from './src/server/services/watcher.js';

const watcher = new FileWatcher({
  rootDir: process.cwd(),
  debounceDelay: 300,
});

watcher.on('change', (event) => {
  // 触发重新扫描
  // 更新文件索引
  // 通过 WebSocket 通知客户端
});

watcher.start();
```

### 与 WebSocket 集成

```typescript
import { WebSocket } from 'ws';
import { createWatcherDefault } from './src/server/services/watcher.js';

const wss = new WebSocket.Server({ port: 8080 });
const watcher = createWatcherDefault('./docs');

watcher.on('change', (event) => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'file:change',
        data: event,
      }));
    }
  });
});
```

## 配置选项

### WatcherOptions

```typescript
interface WatcherOptions {
  rootDir: string;              // 监听根目录（必需）
  extensions?: string[];        // 支持的文件扩展名
  excludeDirs?: string[];       // 排除的目录名称
  ignoreInitial?: boolean;      // 是否忽略初始扫描
  debounceDelay?: number;       // 防抖延迟（毫秒）
  usePolling?: boolean;         // 是否使用轮询
  pollInterval?: number;        // 轮询间隔（毫秒）
  ignored?: string | RegExp | ((path: string) => boolean);  // 自定义忽略模式
}
```

### 默认配置

```typescript
{
  extensions: ['.md', '.mmd', '.txt', '.json', '.yml', '.yaml'],
  excludeDirs: [
    'node_modules',
    '.git',
    'dist',
    'build',
    'coverage',
    '.next',
    '.nuxt',
    'target',
    '__pycache__',
    'venv',
    'env',
    '.env',
  ],
  ignoreInitial: true,
  debounceDelay: 300,
  usePolling: false,
  pollInterval: 100,
}
```

## 注意事项

1. **防抖机制**: 默认 300ms 的防抖延迟可以防止短时间内多次触发事件
2. **文件过滤**: 只会监听配置的文件扩展名，其他文件变更会被忽略
3. **性能考虑**: 对于大型项目，建议使用 `ignoreInitial: true` 跳过初始扫描
4. **资源清理**: 使用完毕后记得调用 `stop()` 方法释放资源
5. **错误处理**: 始终监听 `error` 事件以处理可能的异常

## 测试

运行测试脚本：

```bash
bun run test-watcher.ts /path/to/watch
```

测试脚本会监听指定目录并输出文件变更事件。按 Ctrl+C 停止监听。

## 相关文件

- `src/server/services/watcher.ts`: 监听器实现
- `src/types/files.ts`: 类型定义
- `test-watcher.ts`: 测试脚本
- `src/server/services/watcher.integration.example.ts`: 集成示例
