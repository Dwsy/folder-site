# 插件加载器实现总结

> 任务034: 实现插件加载器 - 完成报告

## 概述

插件加载器（PluginLoader）是 Folder-Site CLI 插件系统的核心组件，负责从不同来源（npm 包、本地文件）加载插件，并提供完整的插件加载生命周期管理。

## 实现内容

### 1. 插件加载器实现 (`src/server/lib/plugin-loader.ts`)

#### 核心功能

- **npm 包加载** - 支持从 npm 注册表加载插件
  - 支持带版本的包名（如 `@scope/package@1.0.0`）
  - 支持不带版本的包名（默认使用 latest）
  - 自动解析包路径和依赖

- **本地文件加载** - 支持从本地文件系统加载插件
  - 支持相对路径和绝对路径
  - 自动验证路径存在性
  - 支持自定义入口文件

- **清单验证** - 验证插件清单的完整性和正确性
  - 必需字段检查（id, name, version, entry）
  - 格式验证（插件ID格式、版本号格式）
  - 能力类型验证（renderer, transformer, exporter, storage, ui, custom）
  - 选项属性类型验证

- **依赖解析** - 解析和处理插件依赖
  - dependencies 解析
  - peerDependencies 解析
  - 版本兼容性检查
  - 依赖冲突检测
  - 缓存支持

- **错误处理** - 完善的错误处理和日志记录
  - 清单解析错误
  - 清单验证错误
  - 入口加载错误
  - 初始化错误
  - 依赖解析错误
  - 详细的错误信息（包括插件ID、版本、类型等）

- **缓存机制** - 支持插件缓存以提高性能
  - 可配置的缓存目录
  - 可配置的缓存过期时间
  - 支持缓存清除

- **超时控制** - 支持加载超时控制
  - 可配置的加载超时时间
  - 防止长时间挂起的加载操作

#### 主要方法

```typescript
class PluginLoader {
  // 从 npm 包加载插件
  async loadFromNpm(packageName: string, version?: string): Promise<PluginLoadResult>

  // 从本地路径加载插件
  async loadFromPath(pluginPath: string, manifest: PluginManifest): Promise<PluginLoadResult>

  // 验证插件清单
  validateManifest(manifest: Partial<PluginManifest>): PluginValidationResult

  // 解析插件依赖
  async resolveDependencies(manifest: PluginManifest): Promise<PluginDependencyResolution>

  // 清除缓存
  async clearCache(): Promise<void>
}
```

### 2. 类型定义增强 (`src/types/plugin.ts`)

新增了以下类型定义：

- **PluginLoadResult** - 插件加载结果
  ```typescript
  interface PluginLoadResult {
    success: boolean;
    plugin?: Plugin;
    error?: PluginLoadError;
    duration: number;
    cached?: boolean;
  }
  ```

- **PluginLoadError** - 插件加载错误
  ```typescript
  interface PluginLoadError {
    type: PluginErrorType;
    message: string;
    pluginId: string;
    pluginVersion: string;
    cause?: Error;
    timestamp: number;
  }
  ```

- **PluginDependencyResolution** - 插件依赖解析结果
  ```typescript
  interface PluginDependencyResolution {
    resolved: boolean;
    dependencies: Record<string, string>;
    peerDependencies?: Record<string, string>;
    errors: string[];
    warnings: string[];
    duration: number;
  }
  ```

- **PluginCacheItem** - 插件缓存项
  ```typescript
  interface PluginCacheItem {
    plugin: Plugin;
    timestamp: number;
    size: number;
    key: string;
    source: string;
  }
  ```

### 3. 单元测试 (`tests/plugin-loader.test.ts`)

编写了 49 个全面的单元测试，覆盖以下方面：

#### 测试分类

1. **插件加载器实例化测试** (3 个)
   - 创建插件加载器实例
   - 支持自定义配置
   - 支持自定义日志器

2. **插件清单验证测试** (10 个)
   - 验证有效的清单
   - 拒绝缺少必需字段的清单
   - 拒绝无效的插件ID格式
   - 拒绝无效的版本号格式
   - 接受有效的 semver 版本号
   - 接受以小写字母开头的插件ID
   - 警告没有能力的插件
   - 验证能力类型
   - 验证选项模式
   - 拒绝无效的选项属性类型

3. **依赖解析测试** (6 个)
   - 解析插件依赖
   - 处理没有依赖的插件
   - 处理对等依赖
   - 检测版本冲突
   - 处理依赖解析失败
   - 缓存依赖解析结果

4. **本地文件加载测试** (6 个)
   - 从本地路径加载插件
   - 处理不存在的插件路径
   - 处理无效的入口文件
   - 验证清单后加载插件
   - 支持相对路径
   - 支持绝对路径

5. **npm 包加载测试** (6 个)
   - 从 npm 包名加载插件
   - 支持带版本的 npm 包名
   - 处理不存在的 npm 包
   - 验证 npm 包的清单
   - 处理 npm 包依赖
   - 缓存已加载的 npm 包

6. **错误处理测试** (6 个)
   - 捕获清单解析错误
   - 捕获模块加载错误
   - 捕获初始化错误
   - 提供详细的错误信息
   - 支持错误重试
   - 处理加载超时

7. **插件缓存测试** (4 个)
   - 缓存已加载的插件
   - 支持清除缓存
   - 处理缓存过期
   - 支持禁用缓存

8. **生命周期钩子测试** (4 个)
   - 调用 onLoad 钩子
   - 调用 onActivate 钩子
   - 调用 onDeactivate 钩子
   - 调用 onUnload 钩子

9. **工具函数测试** (1 个)
   - 检查路径是否存在

10. **集成测试** (3 个)
    - 完整加载本地插件
    - 处理多个插件加载
    - 处理插件依赖链

#### 测试结果

```
49 pass
0 fail
84 expect() calls
Ran 49 tests across 1 file. [168.00ms]
```

## 技术特点

### 1. 类型安全

- 使用 TypeScript 编写，确保类型安全
- 完整的类型定义覆盖所有接口和方法
- 使用泛型提供灵活的类型推断

### 2. 错误处理

- 统一的错误类型（PluginError）
- 详细的错误信息（包括插件ID、版本、类型等）
- 错误堆栈保留，方便调试

### 3. 性能优化

- 插件缓存机制
- 依赖解析缓存
- 防止重复加载
- 超时控制

### 4. 可扩展性

- 支持自定义配置
- 支持自定义日志器
- 支持自定义缓存策略
- 模块化设计，易于扩展

### 5. 跨平台兼容性

- 使用 path.join 替代硬编码路径分隔符
- 统一的路径处理逻辑
- 支持 Windows、macOS、Linux

## 使用示例

### 从 npm 包加载插件

```typescript
import { PluginLoader } from './src/server/lib/plugin-loader.js';

const loader = new PluginLoader({
  cacheEnabled: true,
  cacheDirectory: '.cache/plugins',
  loadTimeout: 30000,
});

// 加载插件
const result = await loader.loadFromNpm('@folder-site/sample-plugin', '1.0.0');

if (result.success) {
  const plugin = result.plugin;
  await plugin.activate();
  console.log('Plugin activated:', plugin.id);
} else {
  console.error('Failed to load plugin:', result.error);
}
```

### 从本地文件加载插件

```typescript
import { PluginLoader } from './src/server/lib/plugin-loader.js';

const loader = new PluginLoader();

const manifest = {
  id: 'my-plugin',
  name: 'My Plugin',
  version: '1.0.0',
  entry: './dist/index.js',
  capabilities: [
    {
      type: 'renderer',
      name: 'my-renderer',
      version: '1.0.0',
    },
  ],
};

const result = await loader.loadFromPath('./plugins/my-plugin', manifest);

if (result.success) {
  const plugin = result.plugin;
  await plugin.activate();
} else {
  console.error('Failed to load plugin:', result.error);
}
```

### 验证插件清单

```typescript
import { PluginLoader } from './src/server/lib/plugin-loader.js';

const loader = new PluginLoader();

const manifest = {
  id: 'test-plugin',
  name: 'Test Plugin',
  version: '1.0.0',
  entry: './dist/index.js',
  capabilities: [],
};

const validation = loader.validateManifest(manifest);

if (validation.valid) {
  console.log('Manifest is valid');
} else {
  console.error('Manifest validation failed:', validation.errors);
  console.warn('Warnings:', validation.warnings);
}
```

### 解析插件依赖

```typescript
import { PluginLoader } from './src/server/lib/plugin-loader.js';

const loader = new PluginLoader();

const manifest = {
  id: 'test-plugin',
  name: 'Test Plugin',
  version: '1.0.0',
  entry: './dist/index.js',
  capabilities: [],
  dependencies: {
    'some-library': '^1.0.0',
    'another-lib': '2.0.0',
  },
  peerDependencies: {
    folderSite: '>=0.1.0',
  },
};

const resolution = await loader.resolveDependencies(manifest);

if (resolution.resolved) {
  console.log('Dependencies resolved:', resolution.dependencies);
  console.log('Peer dependencies:', resolution.peerDependencies);
} else {
  console.error('Dependency resolution failed:', resolution.errors);
}
```

## 后续工作

插件加载器是实现插件系统的基础，后续可以基于此实现：

1. **插件注册系统** (任务035) - 管理已加载插件的注册和注销
2. **插件沙箱** (任务038) - 提供安全的插件运行环境
3. **Mermaid 渲染器** (任务036) - 实现第一个示例插件
4. **Graphviz 渲染器** (任务037) - 实现另一个示例插件

## 总结

插件加载器的实现为 Folder-Site CLI 提供了完整的插件加载能力，支持从 npm 包和本地文件加载插件，并提供了完善的清单验证、依赖解析和错误处理机制。所有 49 个单元测试全部通过，确保了代码的质量和稳定性。

---

**任务完成时间**: 2026-01-22 16:02:00
**实际耗时**: 约 20 分钟
**测试覆盖率**: 49/49 测试通过 (100%)