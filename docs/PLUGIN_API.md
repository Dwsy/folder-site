# 插件 API 文档

本文档介绍 Folder-Site CLI 的插件系统 API，包括插件接口、生命周期、事件系统和可用服务。

## 目录

- [插件系统概览](#插件系统概览)
- [插件清单](#插件清单)
- [插件接口](#插件接口)
- [插件上下文](#插件上下文)
- [生命周期](#生命周期)
- [事件系统](#事件系统)
- [可用服务](#可用服务)
- [能力类型](#能力类型)
- [类型定义](#类型定义)
- [示例插件](#示例插件)

---

## 插件系统概览

Folder-Site CLI 提供了一个强大的插件系统，允许开发者扩展功能而无需修改核心代码。

### 核心特性

- **类型安全**: 完整的 TypeScript 类型定义
- **沙箱隔离**: 可选的插件沙箱执行环境
- **热加载**: 支持运行时加载/卸载插件
- **依赖管理**: 自动解析和管理插件依赖
- **事件驱动**: 基于事件的插件通信
- **优先级控制**: 灵活的插件加载顺序控制

### 插件能力类型

| 能力类型 | 描述 | 示例 |
|---------|------|------|
| `renderer` | 内容渲染器 | Mermaid 图表渲染 |
| `transformer` | 内容转换器 | Markdown 到 HTML 转换 |
| `exporter` | 导出器 | PDF 导出 |
| `storage` | 存储提供者 | 本地存储、远程存储 |
| `ui` | UI 组件 | 自定义面板、模态框 |
| `custom` | 自定义能力 | 任意扩展 |

---

## 插件清单

插件清单 (`plugin.json`) 定义插件的元数据和配置。

### 清单结构

```json
{
  "id": "com.example.my-plugin",
  "name": "My Plugin",
  "version": "1.0.0",
  "description": "A sample plugin",
  "author": {
    "name": "John Doe",
    "email": "john@example.com",
    "url": "https://example.com"
  },
  "license": "MIT",
  "entry": "dist/index.js",
  "capabilities": [
    {
      "type": "renderer",
      "name": "mermaid",
      "version": "1.0.0"
    }
  ],
  "hooks": {
    "onLoad": "./hooks/onLoad.js",
    "onUnload": "./hooks/onUnload.js"
  },
  "options": {
    "type": "object",
    "properties": {
      "theme": {
        "type": "string",
        "default": "default",
        "description": "Theme to use"
      }
    }
  },
  "engines": {
    "folderSite": ">=1.0.0"
  },
  "contributes": {
    "ui": [
      {
        "id": "my-panel",
        "type": "panel",
        "name": "MyPanel",
        "position": "right"
      }
    ]
  }
}
```

### 字段说明

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 插件唯一标识符（推荐反向域名格式） |
| `name` | string | 是 | 插件显示名称 |
| `version` | string | 是 | 语义化版本号 |
| `description` | string | 否 | 插件描述 |
| `author` | object | 否 | 作者信息 |
| `license` | string | 否 | 许可证（SPDX 标识符） |
| `entry` | string | 是 | 插件入口文件路径 |
| `capabilities` | array | 是 | 插件能力声明 |
| `hooks` | object | 否 | 生命周期钩子配置 |
| `options` | object | 否 | 插件配置项模式 |
| `engines` | object | 否 | 兼容性要求 |
| `contributes` | object | 否 | 贡献点声明 |

---

## 插件接口

所有插件必须实现 `Plugin` 接口。

### Plugin 接口

```typescript
interface Plugin {
  // 只读属性
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly manifest: PluginManifest;
  readonly status: PluginStatus;
  readonly error?: Error;

  // 生命周期方法
  initialize(context: PluginContext): Promise<void>;
  activate(): Promise<void>;
  deactivate(): Promise<void>;
  dispose(): Promise<void>;
}
```

### 插件类示例

```typescript
import type { Plugin, PluginManifest, PluginContext } from '@folder-site/plugin-api';

export default class MyPlugin implements Plugin {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly manifest: PluginManifest;
  readonly status: PluginStatus = 'loaded';
  private context?: PluginContext;

  constructor(manifest: PluginManifest) {
    this.id = manifest.id;
    this.name = manifest.name;
    this.version = manifest.version;
    this.manifest = manifest;
  }

  async initialize(context: PluginContext): Promise<void> {
    this.context = context;
    context.logger.info(`Initializing ${this.name} v${this.version}`);
    // 初始化插件逻辑
  }

  async activate(): Promise<void> {
    this.context?.logger.info('Activating plugin');
    // 激活插件逻辑
  }

  async deactivate(): Promise<void> {
    this.context?.logger.info('Deactivating plugin');
    // 停用插件逻辑
  }

  async dispose(): Promise<void> {
    this.context?.logger.info('Disposing plugin');
    // 清理资源
  }
}
```

---

## 插件上下文

插件上下文 (`PluginContext`) 提供对宿主环境的访问。

### 上下文结构

```typescript
interface PluginContext {
  // 宿主环境信息
  readonly app: {
    readonly version: string;
    readonly environment: 'development' | 'production';
    readonly rootPath: string;
    readonly configPath: string;
  };

  // 服务访问
  readonly services: PluginServices;

  // 事件系统
  readonly events: PluginEventEmitter;

  // 日志系统
  readonly logger: PluginLogger;

  // 插件存储
  readonly storage: PluginStorage;

  // 工具函数
  readonly utils: PluginUtils;

  // 配置
  readonly config: PluginConfig;
}
```

### 使用示例

```typescript
async function initialize(context: PluginContext): Promise<void> {
  // 获取应用信息
  console.log('Folder-Site version:', context.app.version);
  console.log('Environment:', context.app.environment);

  // 使用服务
  const fileService = context.services.fileService;
  const files = await fileService.listFiles('./docs');

  // 订阅事件
  context.events.on('file:changed', (data) => {
    context.logger.info('File changed:', data.path);
  });

  // 使用存储
  context.storage.set('lastRun', Date.now());

  // 使用配置
  const theme = context.config.get('theme', 'default');
}
```

---

## 生命周期

插件的生命周期包含以下状态和事件：

### 状态图

```
discovered → validated → loading → loaded
                                      ↓
                                   activating → active
                                      ↓
                                   deactivating → inactive
                                      ↓
                                    error / unload
```

### 状态说明

| 状态 | 说明 |
|------|------|
| `discovered` | 插件已被扫描但未验证 |
| `validated` | 插件清单已验证通过 |
| `loading` | 正在加载插件代码 |
| `loaded` | 插件代码已加载 |
| `activating` | 正在激活插件 |
| `active` | 插件已激活并运行 |
| `deactivating` | 正在停用插件 |
| `inactive` | 插件已停用但仍加载 |
| `error` | 插件发生错误 |

### 生命周期事件

| 事件 | 触发时机 |
|------|---------|
| `plugin:discover` | 发现插件 |
| `plugin:validate` | 验证插件清单 |
| `plugin:load` | 加载插件 |
| `plugin:unload` | 卸载插件 |
| `plugin:activate` | 激活插件 |
| `plugin:deactivate` | 停用插件 |
| `plugin:error` | 插件发生错误 |

### 生命周期钩子

```typescript
// hooks/onLoad.js
export default async function onLoad(context: PluginContext) {
  context.logger.info('Plugin loaded');
  // 初始化逻辑
}

// hooks/onUnload.js
export default async function onUnload(context: PluginContext) {
  context.logger.info('Plugin unloaded');
  // 清理逻辑
}
```

---

## 事件系统

插件可以通过事件系统与其他插件和宿主环境通信。

### 事件发射器

```typescript
interface PluginEventEmitter {
  // 订阅事件
  on<T>(event: string, handler: (data: T) => void): Disposable;

  // 订阅事件（一次性）
  once<T>(event: string, handler: (data: T) => void): Disposable;

  // 发布事件
  emit<T>(event: string, data: T): void;

  // 取消订阅
  off(event: string, handler: (data: unknown) => void): void;

  // 订阅所有事件
  onAny(handler: (event: string, data: unknown) => void): Disposable;
}
```

### 使用示例

```typescript
async function initialize(context: PluginContext): Promise<void> {
  // 订阅事件
  const disposable = context.events.on('file:changed', (data) => {
    context.logger.info('File changed:', data.path);
    // 处理文件变化
  });

  // 发布事件
  context.events.emit('my-plugin:ready', {
    version: '1.0.0',
    capabilities: ['renderer']
  });

  // 取消订阅
  disposable.dispose();
}
```

### 系统事件

| 事件名称 | 数据类型 | 说明 |
|---------|---------|------|
| `file:changed` | `{ path: string, type: 'created' | 'updated' | 'deleted' }` | 文件变化 |
| `search:started` | `{ query: string, scope: string }` | 搜索开始 |
| `search:completed` | `{ query: string, results: number, duration: number }` | 搜索完成 |
| `render:started` | `{ path: string, format: string }` | 渲染开始 |
| `render:completed` | `{ path: string, duration: number }` | 渲染完成 |

---

## 可用服务

插件可以通过 `context.services` 访问以下服务：

### 文件服务

```typescript
interface FileService {
  listFiles(path: string): Promise<FileInfo[]>;
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  deleteFile(path: string): Promise<void>;
  watch(path: string, callback: (event: FileEvent) => void): Disposable;
}
```

### 索引服务

```typescript
interface IndexService {
  index(files: FileInfo[]): Promise<void>;
  search(query: string, options?: SearchOptions): Promise<SearchResult[]>;
  update(path: string): Promise<void>;
  remove(path: string): Promise<void>;
}
```

### 转换服务

```typescript
interface TransformService {
  transform(content: string, from: string, to: string): Promise<string>;
  registerTransformer(name: string, transformer: Transformer): void;
  getTransformer(name: string): Transformer | undefined;
}
```

### 渲染服务

```typescript
interface RenderService {
  render(content: string, format: string, options?: RenderOptions): Promise<string>;
  registerRenderer(name: string, renderer: Renderer): void;
  getRenderer(name: string): Renderer | undefined;
}
```

### 导出服务

```typescript
interface ExportService {
  export(paths: string[], format: string, options?: ExportOptions): Promise<ExportResult>;
  registerExporter(name: string, exporter: Exporter): void;
  getExporter(name: string): Exporter | undefined;
}
```

---

## 能力类型

### 渲染器能力

```typescript
interface Renderer {
  name: string;
  version: string;

  canRender(content: string): boolean;

  render(content: string, options?: RenderOptions): Promise<string>;
}

// 示例：Mermaid 渲染器
class MermaidRenderer implements Renderer {
  name = 'mermaid';
  version = '1.0.0';

  canRender(content: string): boolean {
    return content.includes('```mermaid');
  }

  async render(content: string, options?: RenderOptions): Promise<string> {
    // 渲染 Mermaid 图表逻辑
    return '<div class="mermaid-chart">...</div>';
  }
}
```

### 转换器能力

```typescript
interface Transformer {
  name: string;
  inputType: string;
  outputType: string;

  transform(content: string, options?: TransformOptions): Promise<string>;
}

// 示例：Markdown 到 HTML 转换器
class MarkdownTransformer implements Transformer {
  name = 'markdown-to-html';
  inputType = 'markdown';
  outputType = 'html';

  async transform(content: string, options?: TransformOptions): Promise<string> {
    // 转换逻辑
    return htmlContent;
  }
}
```

### 导出器能力

```typescript
interface Exporter {
  name: string;
  supportedFormats: string[];

  export(content: string, format: string, options?: ExportOptions): Promise<ExportResult>;
}

// 示例：PDF 导出器
class PDFExporter implements Exporter {
  name = 'pdf';
  supportedFormats = ['pdf'];

  async export(content: string, format: string, options?: ExportOptions): Promise<ExportResult> {
    // 导出逻辑
    return {
      path: '/downloads/document.pdf',
      size: 102400,
      format: 'pdf'
    };
  }
}
```

---

## 类型定义

### 核心类型

```typescript
// 插件状态
type PluginStatus =
  | 'discovered'
  | 'validated'
  | 'loading'
  | 'loaded'
  | 'activating'
  | 'active'
  | 'deactivating'
  | 'inactive'
  | 'error';

// 插件能力类型
type PluginCapabilityType =
  | 'renderer'
  | 'transformer'
  | 'exporter'
  | 'storage'
  | 'ui'
  | 'custom';

// 插件错误类型
type PluginErrorType =
  | 'manifest_parse'
  | 'manifest_validation'
  | 'entry_load'
  | 'initialize'
  | 'activate'
  | 'deactivate'
  | 'dependency_resolve'
  | 'permission'
  | 'runtime';
```

### 服务类型

```typescript
// 文件信息
interface FileInfo {
  name: string;
  path: string;
  relativePath: string;
  extension: string;
  size: number;
  modifiedAt: Date;
  createdAt: Date;
  isDirectory: boolean;
  isFile: boolean;
  isSymbolicLink: boolean;
}

// 搜索选项
interface SearchOptions {
  scope?: 'all' | 'titles' | 'content' | 'files';
  limit?: number;
  offset?: number;
  fileType?: string[];
}

// 搜索结果
interface SearchResult {
  path: string;
  name: string;
  title: string;
  excerpt: string;
  score: number;
  type: string;
  meta?: Record<string, unknown>;
}

// 渲染选项
interface RenderOptions {
  theme?: string;
  highlight?: boolean;
  lineNumber?: boolean;
}

// 导出选项
interface ExportOptions {
  filename?: string;
  includeToc?: boolean;
  includeCover?: boolean;
  customCss?: string;
}

// 导出结果
interface ExportResult {
  path: string;
  size: number;
  format: string;
  mimeType: string;
}
```

---

## 示例插件

### 完整的渲染器插件

```typescript
// plugin.json
{
  "id": "com.example.mermaid-renderer",
  "name": "Mermaid Renderer",
  "version": "1.0.0",
  "description": "Renders Mermaid diagrams",
  "entry": "dist/index.js",
  "capabilities": [
    {
      "type": "renderer",
      "name": "mermaid",
      "version": "1.0.0"
    }
  ],
  "options": {
    "type": "object",
    "properties": {
      "theme": {
        "type": "string",
        "default": "default",
        "enum": ["default", "dark", "forest", "neutral"]
      }
    }
  }
}
```

```typescript
// src/index.ts
import type { Plugin, PluginManifest, PluginContext } from '@folder-site/plugin-api';

export default class MermaidPlugin implements Plugin {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly manifest: PluginManifest;
  readonly status: PluginStatus = 'loaded';
  private context?: PluginContext;

  constructor(manifest: PluginManifest) {
    this.id = manifest.id;
    this.name = manifest.name;
    this.version = manifest.version;
    this.manifest = manifest;
  }

  async initialize(context: PluginContext): Promise<void> {
    this.context = context;
    context.logger.info('Initializing Mermaid Renderer');

    // 注册渲染器
    context.services.renderService.registerRenderer('mermaid', new MermaidRenderer(context));
  }

  async activate(): Promise<void> {
    this.context?.logger.info('Mermaid Renderer activated');
  }

  async deactivate(): Promise<void> {
    this.context?.logger.info('Mermaid Renderer deactivated');
  }

  async dispose(): Promise<void> {
    this.context?.logger.info('Mermaid Renderer disposed');
  }
}

class MermaidRenderer {
  name = 'mermaid';
  version = '1.0.0';

  constructor(private context: PluginContext) {}

  canRender(content: string): boolean {
    return /```mermaid\n([\s\S]*?)\n```/.test(content);
  }

  async render(content: string, options?: RenderOptions): Promise<string> {
    const theme = this.context?.config.get('theme', 'default') || 'default';

    // 提取 Mermaid 代码块
    const mermaidCode = this.extractMermaidCode(content);

    // 渲染为 SVG
    const svg = await this.renderToSvg(mermaidCode, theme);

    return `<div class="mermaid-chart">${svg}</div>`;
  }

  private extractMermaidCode(content: string): string {
    const match = content.match(/```mermaid\n([\s\S]*?)\n```/);
    return match ? match[1] : '';
  }

  private async renderToSvg(code: string, theme: string): Promise<string> {
    // 实际渲染逻辑
    return `<svg>...</svg>`;
  }
}
```

---

## 下一步

- [插件开发指南](./PLUGIN_DEVELOPMENT.md) - 深入了解插件开发
- [插件架构](./plugin-architecture.md) - 了解插件系统架构
- [插件示例](../examples/plugins/) - 查看更多插件示例