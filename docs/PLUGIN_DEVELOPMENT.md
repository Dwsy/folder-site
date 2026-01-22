# 插件开发指南

本指南将帮助你从零开始创建 Folder-Site CLI 插件。

## 目录

- [快速开始](#快速开始)
- [项目结构](#项目结构)
- [开发环境](#开发环境)
- [创建插件](#创建插件)
- [插件清单](#插件清单)
- [实现插件](#实现插件)
- [测试插件](#测试插件)
- [发布插件](#发布插件)
- [最佳实践](#最佳实践)
- [故障排查](#故障排查)
- [示例项目](#示例项目)

---

## 快速开始

### 30 秒创建插件

使用插件生成器快速创建项目模板：

```bash
bun create folder-site-plugin my-plugin
cd my-plugin
bun install
bun dev
```

### 手动创建

如果你更喜欢手动创建项目，请继续阅读。

---

## 项目结构

一个标准的插件项目结构如下：

```
my-plugin/
├── plugin.json              # 插件清单
├── package.json             # npm 包配置
├── tsconfig.json            # TypeScript 配置
├── src/
│   ├── index.ts             # 插件主入口
│   ├── renderer.ts          # 渲染器（可选）
│   ├── transformer.ts       # 转换器（可选）
│   └── hooks/
│       ├── onLoad.ts        # 加载钩子
│       └── onUnload.ts      # 卸载钩子
├── tests/
│   └── plugin.test.ts       # 插件测试
├── dist/                    # 编译输出目录
└── README.md                # 插件文档
```

---

## 开发环境

### 系统要求

- Node.js >= 18
- Bun >= 1.0（推荐）或 npm >= 9
- TypeScript >= 5.0

### 安装依赖

```bash
# 创建项目目录
mkdir my-plugin
cd my-plugin

# 初始化 npm 项目
npm init -y

# 安装开发依赖
npm install --save-dev \
  typescript \
  @types/node

# 安装插件 API 类型
npm install --save-dev \
  @folder-site/plugin-api
```

### 配置 TypeScript

**tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

### 配置 package.json

**package.json**

```json
{
  "name": "my-awesome-plugin",
  "version": "1.0.0",
  "description": "My awesome Folder-Site plugin",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "test": "bun test",
    "prepublishOnly": "npm run build"
  },
  "keywords": ["folder-site", "plugin"],
  "author": "Your Name",
  "license": "MIT",
  "devDependencies": {
    "@folder-site/plugin-api": "^1.0.0",
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0"
  },
  "peerDependencies": {
    "@folder-site/plugin-api": "^1.0.0"
  }
}
```

---

## 创建插件

### 步骤 1: 创建插件清单

**plugin.json**

```json
{
  "id": "com.example.my-plugin",
  "name": "My Plugin",
  "version": "1.0.0",
  "description": "A sample plugin",
  "author": {
    "name": "Your Name",
    "email": "your@example.com"
  },
  "license": "MIT",
  "entry": "dist/index.js",
  "capabilities": [
    {
      "type": "renderer",
      "name": "my-renderer",
      "version": "1.0.0"
    }
  ],
  "engines": {
    "folderSite": ">=1.0.0"
  }
}
```

### 步骤 2: 实现插件类

**src/index.ts**

```typescript
import type {
  Plugin,
  PluginManifest,
  PluginContext,
  PluginStatus
} from '@folder-site/plugin-api';

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

    // 注册你的功能
    this.registerFeatures(context);
  }

  async activate(): Promise<void> {
    this.context?.logger.info('Plugin activated');
    // 激活逻辑
  }

  async deactivate(): Promise<void> {
    this.context?.logger.info('Plugin deactivated');
    // 停用逻辑
  }

  async dispose(): Promise<void> {
    this.context?.logger.info('Plugin disposed');
    // 清理资源
  }

  private registerFeatures(context: PluginContext): void {
    // 注册渲染器、转换器等
  }
}
```

### 步骤 3: 构建插件

```bash
npm run build
```

---

## 插件清单详解

### 必需字段

```json
{
  "id": "com.example.my-plugin",     // 唯一标识符
  "name": "My Plugin",                // 显示名称
  "version": "1.0.0",                 // 版本号（semver）
  "entry": "dist/index.js",           // 入口文件
  "capabilities": []                  // 能力声明
}
```

### 可选字段

```json
{
  "description": "Plugin description",
  "author": {
    "name": "Author Name",
    "email": "author@example.com",
    "url": "https://example.com"
  },
  "license": "MIT",
  "engines": {
    "folderSite": ">=1.0.0",
    "node": ">=18.0.0"
  },
  "hooks": {
    "onLoad": "dist/hooks/onLoad.js",
    "onUnload": "dist/hooks/onUnload.js"
  },
  "options": {
    "type": "object",
    "properties": {
      "apiKey": {
        "type": "string",
        "description": "API key for external service"
      }
    }
  }
}
```

### 能力声明

#### 渲染器能力

```json
{
  "capabilities": [
    {
      "type": "renderer",
      "name": "mermaid",
      "version": "1.0.0",
      "constraints": {
        "supportedFormats": ["svg", "png"]
      }
    }
  ]
}
```

#### 转换器能力

```json
{
  "capabilities": [
    {
      "type": "transformer",
      "name": "markdown-to-html",
      "version": "1.0.0",
      "constraints": {
        "inputType": "markdown",
        "outputType": "html"
      }
    }
  ]
}
```

#### 导出器能力

```json
{
  "capabilities": [
    {
      "type": "exporter",
      "name": "pdf-exporter",
      "version": "1.0.0",
      "constraints": {
        "supportedFormats": ["pdf"]
      }
    }
  ]
}
```

---

## 实现插件

### 类型 1: 渲染器插件

渲染器插件用于渲染特定格式的内容。

```typescript
// src/renderer.ts
import type { Renderer, PluginContext } from '@folder-site/plugin-api';

export class MyRenderer implements Renderer {
  name = 'my-renderer';
  version = '1.0.0';

  constructor(private context: PluginContext) {}

  canRender(content: string): boolean {
    // 判断是否可以渲染此内容
    return content.includes('```my-format');
  }

  async render(content: string, options?: Record<string, unknown>): Promise<string> {
    this.context.logger.info('Rendering content');

    // 提取内容
    const code = this.extractCode(content);

    // 渲染逻辑
    const rendered = await this.doRender(code, options);

    return rendered;
  }

  private extractCode(content: string): string {
    const match = content.match(/```my-format\n([\s\S]*?)\n```/);
    return match ? match[1] : '';
  }

  private async doRender(code: string, options?: Record<string, unknown>): Promise<string> {
    // 实际渲染实现
    return `<div class="my-renderer">${code}</div>`;
  }
}
```

### 类型 2: 转换器插件

转换器插件用于将内容从一种格式转换为另一种格式。

```typescript
// src/transformer.ts
import type { Transformer } from '@folder-site/plugin-api';

export class MyTransformer implements Transformer {
  name = 'my-transformer';
  inputType = 'markdown';
  outputType = 'html';

  async transform(content: string, options?: Record<string, unknown>): Promise<string> {
    // 转换逻辑
    return this.convertMarkdownToHtml(content, options);
  }

  private convertMarkdownToHtml(content: string, options?: Record<string, unknown>): string {
    // 实际转换实现
    return content
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>');
  }
}
```

### 类型 3: 导出器插件

导出器插件用于将内容导出为特定格式。

```typescript
// src/exporter.ts
import type { Exporter, ExportOptions, ExportResult } from '@folder-site/plugin-api';

export class MyExporter implements Exporter {
  name = 'my-exporter';
  supportedFormats = ['custom'];

  async export(
    content: string,
    format: string,
    options?: ExportOptions
  ): Promise<ExportResult> {
    if (format !== 'custom') {
      throw new Error(`Unsupported format: ${format}`);
    }

    // 导出逻辑
    const exported = this.convertToCustom(content, options);

    // 保存文件
    const path = options?.filename || 'export.custom';
    await this.saveFile(path, exported);

    return {
      path,
      size: Buffer.byteLength(exported),
      format,
      mimeType: 'application/custom'
    };
  }

  private convertToCustom(content: string, options?: ExportOptions): string {
    // 实际转换实现
    return content;
  }

  private async saveFile(path: string, content: string): Promise<void> {
    // 文件保存逻辑
    await Bun.write(path, content);
  }
}
```

### 类型 4: 事件监听插件

事件监听插件通过监听系统事件来扩展功能。

```typescript
// src/index.ts
import type { Plugin, PluginManifest, PluginContext } from '@folder-site/plugin-api';

export default class EventListenerPlugin implements Plugin {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly manifest: PluginManifest;
  private context?: PluginContext;
  private disposables: Array<() => void> = [];

  constructor(manifest: PluginManifest) {
    this.id = manifest.id;
    this.name = manifest.name;
    this.version = manifest.version;
    this.manifest = manifest;
  }

  async initialize(context: PluginContext): Promise<void> {
    this.context = context;

    // 监听文件变化事件
    const fileWatcher = context.events.on('file:changed', (data) => {
      this.handleFileChange(data);
    });
    this.disposables.push(() => fileWatcher.dispose());

    // 监听搜索事件
    const searchWatcher = context.events.on('search:completed', (data) => {
      this.handleSearchComplete(data);
    });
    this.disposables.push(() => searchWatcher.dispose());
  }

  async activate(): Promise<void> {
    this.context?.logger.info('Event listeners activated');
  }

  async deactivate(): Promise<void> {
    // 清理所有事件监听器
    this.disposables.forEach(dispose => dispose());
    this.disposables = [];
    this.context?.logger.info('Event listeners deactivated');
  }

  async dispose(): Promise<void> {
    await this.deactivate();
  }

  private handleFileChange(data: { path: string; type: string }): void {
    this.context?.logger.info(`File ${data.type}: ${data.path}`);
    // 处理文件变化
  }

  private handleSearchComplete(data: { query: string; results: number }): void {
    this.context?.logger.info(`Search completed: ${data.query} (${data.results} results)`);
    // 处理搜索完成
  }
}
```

---

## 测试插件

### 单元测试

**tests/plugin.test.ts**

```typescript
import { describe, it, expect, beforeEach } from 'bun:test';
import MyPlugin from '../src/index';
import type { PluginManifest } from '@folder-site/plugin-api';

describe('MyPlugin', () => {
  let plugin: MyPlugin;
  const mockManifest: PluginManifest = {
    id: 'com.example.my-plugin',
    name: 'My Plugin',
    version: '1.0.0',
    entry: 'dist/index.js',
    capabilities: []
  };

  beforeEach(() => {
    plugin = new MyPlugin(mockManifest);
  });

  it('should have correct metadata', () => {
    expect(plugin.id).toBe('com.example.my-plugin');
    expect(plugin.name).toBe('My Plugin');
    expect(plugin.version).toBe('1.0.0');
  });

  it('should initialize successfully', async () => {
    const mockContext = createMockContext();
    await plugin.initialize(mockContext);
    expect(plugin.status).toBe('loaded');
  });

  it('should activate successfully', async () => {
    const mockContext = createMockContext();
    await plugin.initialize(mockContext);
    await plugin.activate();
    expect(plugin.status).toBe('active');
  });
});

function createMockContext() {
  return {
    app: {
      version: '1.0.0',
      environment: 'development',
      rootPath: '/test',
      configPath: '/test/config'
    },
    services: {},
    events: {
      on: () => ({ dispose: () => {} }),
      emit: () => {},
      off: () => {}
    },
    logger: {
      info: () => {},
      debug: () => {},
      warn: () => {},
      error: () => {}
    },
    storage: {
      get: () => undefined,
      set: () => {},
      remove: () => {}
    },
    utils: {},
    config: {
      get: () => undefined,
      set: () => {}
    }
  };
}
```

### 运行测试

```bash
npm test
```

---

## 发布插件

### 准备发布

1. 更新版本号

```bash
npm version patch  # 或 minor, major
```

2. 构建插件

```bash
npm run build
```

3. 运行测试

```bash
npm test
```

### 发布到 npm

```bash
npm publish
```

### 发布到本地

如果你想在自己的项目中使用插件，可以将其发布到本地：

```bash
npm pack
```

然后在项目中安装：

```bash
npm install ./my-plugin-1.0.0.tgz
```

---

## 最佳实践

### 1. 错误处理

```typescript
async initialize(context: PluginContext): Promise<void> {
  try {
    // 初始化逻辑
  } catch (error) {
    context.logger.error('Failed to initialize:', error);
    throw error;
  }
}
```

### 2. 资源清理

```typescript
async dispose(): Promise<void> {
  // 清理事件监听器
  this.disposables.forEach(d => d.dispose());

  // 清理定时器
  if (this.timer) {
    clearInterval(this.timer);
  }

  // 清理文件句柄
  if (this.fileHandle) {
    await this.fileHandle.close();
  }
}
```

### 3. 配置管理

```typescript
async initialize(context: PluginContext): Promise<void> {
  // 获取配置值
  const apiKey = context.config.get('apiKey');

  if (!apiKey) {
    context.logger.warn('API key not configured');
    return;
  }

  // 使用配置
  await this.initializeWithApiKey(apiKey);
}
```

### 4. 日志记录

```typescript
async initialize(context: PluginContext): Promise<void> {
  context.logger.debug('Starting initialization...');
  context.logger.info('Plugin initialized');
  context.logger.warn('Feature not fully implemented');
  context.logger.error('Failed to initialize', error);
}
```

### 5. 类型安全

```typescript
import type {
  Plugin,
  PluginManifest,
  PluginContext,
  PluginStatus
} from '@folder-site/plugin-api';

// 使用类型注解
private context?: PluginContext;
private status: PluginStatus = 'loaded';

// 使用类型守卫
function isPlugin(obj: unknown): obj is Plugin {
  return typeof obj === 'object' &&
         obj !== null &&
         'id' in obj &&
         'name' in obj;
}
```

### 6. 性能优化

```typescript
// 使用缓存
private cache = new Map<string, string>();

async render(content: string): Promise<string> {
  const cacheKey = this.getCacheKey(content);

  if (this.cache.has(cacheKey)) {
    return this.cache.get(cacheKey)!;
  }

  const result = await this.doRender(content);
  this.cache.set(cacheKey, result);

  return result;
}

// 使用防抖
private debouncedUpdate = debounce((path: string) => {
  this.updateFile(path);
}, 300);
```

---

## 故障排查

### 常见问题

#### 插件无法加载

**问题**: 插件加载失败

**解决方案**:
1. 检查 `plugin.json` 格式是否正确
2. 确认 `entry` 路径指向编译后的文件
3. 查看控制台错误日志

#### 类型错误

**问题**: TypeScript 编译错误

**解决方案**:
1. 确保安装了正确的类型定义
2. 检查 `tsconfig.json` 配置
3. 使用 `tsc --noEmit` 检查类型

#### 事件未触发

**问题**: 事件监听器没有收到事件

**解决方案**:
1. 确认事件名称拼写正确
2. 检查是否正确注册了监听器
3. 使用 `context.events.emit` 测试事件

#### 内存泄漏

**问题**: 插件导致内存占用持续增长

**解决方案**:
1. 在 `dispose` 中清理所有资源
2. 取消所有事件订阅
3. 清空缓存

### 调试技巧

#### 启用调试日志

```typescript
async initialize(context: PluginContext): Promise<void> {
  context.logger.debug('Initializing plugin');
  context.logger.debug('Context:', JSON.stringify(context, null, 2));
}
```

#### 使用浏览器调试工具

```typescript
// 在开发环境下添加断点
if (context.app.environment === 'development') {
  debugger; // 浏览器会在此处暂停
}
```

#### 性能分析

```typescript
async initialize(context: PluginContext): Promise<void> {
  const start = performance.now();

  // 初始化逻辑

  const duration = performance.now() - start;
  context.logger.info(`Initialization took ${duration}ms`);
}
```

---

## 示例项目

### Mermaid 渲染器插件

完整的 Mermaid 图表渲染器插件示例。

查看: [examples/plugins/mermaid-renderer](../examples/plugins/mermaid-renderer)

### PDF 导出器插件

完整的 PDF 导出功能插件示例。

查看: [examples/plugins/pdf-exporter](../examples/plugins/pdf-exporter)

### 自定义主题插件

完整的主题自定义插件示例。

查看: [examples/plugins/custom-theme](../examples/plugins/custom-theme)

---

## 下一步

- [插件 API 文档](./PLUGIN_API.md) - 完整的 API 参考
- [插件架构](./plugin-architecture.md) - 深入了解插件系统架构
- [示例插件](../examples/plugins/) - 更多插件示例
- [贡献指南](./CONTRIBUTING.md) - 如何贡献插件