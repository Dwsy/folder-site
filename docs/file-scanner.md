# 文件扫描服务

## 概述

文件扫描服务 (`FileScanner`) 是 Folder-Site CLI 项目的核心组件之一，负责递归扫描目录、按扩展名过滤文件，并生成文件元数据。

## 功能特性

- ✅ 递归目录扫描（深度优先或广度优先）
- ✅ 按文件扩展名过滤
- ✅ 支持排除指定目录
- ✅ 可配置最大扫描深度
- ✅ 支持隐藏文件和点文件
- ✅ 支持符号链接（可选）
- ✅ 生成完整的文件元数据
- ✅ 错误处理和日志记录

## 支持的文件扩展名

默认支持以下文件扩展名：
- `.md` - Markdown 文件
- `.mmd` - Mermaid 图表文件
- `.txt` - 纯文本文件
- `.json` - JSON 配置文件
- `.yml` - YAML 配置文件
- `.yaml` - YAML 配置文件

## 默认排除的目录

默认排除以下目录：
- `node_modules`
- `.git`
- `dist`
- `build`
- `coverage`
- `.next`
- `.nuxt`
- `target`
- `__pycache__`
- `venv`
- `env`
- `.env`

## 使用方法

### 方法 1: 使用默认配置

```typescript
import { scanDirectoryDefault } from '@server/services/scanner';

const result = await scanDirectoryDefault(process.cwd());

console.log(`找到 ${result.stats.matchedFiles} 个文件`);
result.files.forEach(file => {
  console.log(`- ${file.relativePath}`);
});
```

### 方法 2: 自定义扫描选项

```typescript
import { scanDirectory } from '@server/services/scanner';

const result = await scanDirectory({
  rootDir: process.cwd(),
  extensions: ['.md', '.mmd'],
  excludeDirs: ['node_modules', '.git'],
  maxDepth: 3,
  strategy: 'depth',
});

console.log(`扫描耗时: ${result.duration}ms`);
```

### 方法 3: 使用 FileScanner 类

```typescript
import { FileScanner } from '@server/services/scanner';

const scanner = new FileScanner({
  rootDir: process.cwd(),
  extensions: ['.ts', '.tsx'],
  maxDepth: 2,
});

const result = await scanner.scan();

// 获取文件列表
result.files.filter(f => !f.isDirectory).forEach(file => {
  console.log(`${file.name} (${file.size} bytes)`);
});

// 获取错误信息
const errors = scanner.getErrors();
if (errors.length > 0) {
  console.error(`遇到 ${errors.length} 个错误`);
}
```

### 方法 4: 只获取文件列表

```typescript
import { scanFiles } from '@server/services/scanner';

const files = await scanFiles({
  rootDir: process.cwd(),
  extensions: ['.md'],
});

files.forEach(file => {
  console.log(file.relativePath);
});
```

## API 文档

### ScanOptions

扫描选项配置：

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `rootDir` | `string` | - | 扫描根目录（绝对路径） |
| `extensions` | `string[]` | `SUPPORTED_EXTENSIONS` | 包含的文件扩展名 |
| `excludeDirs` | `string[]` | `DEFAULT_EXCLUDE_DIRS` | 排除的目录名称 |
| `maxDepth` | `number` | `0` | 最大递归深度（0 表示不限制） |
| `includeHidden` | `boolean` | `false` | 是否包含隐藏文件 |
| `includeDotFiles` | `boolean` | `false` | 是否包含点文件 |
| `followSymlinks` | `boolean` | `false` | 是否跟随符号链接 |
| `strategy` | `'depth' \| 'breadth'` | `'depth'` | 扫描策略 |

### ScanResult

扫描结果：

| 属性 | 类型 | 描述 |
|------|------|------|
| `rootPath` | `string` | 扫描根目录 |
| `files` | `FileInfo[]` | 扫描的文件和目录列表 |
| `directories` | `FileInfo[]` | 扫描的目录列表 |
| `stats` | `ScanStats` | 扫描统计信息 |
| `duration` | `number` | 扫描耗时（毫秒） |

### FileInfo

文件信息：

| 属性 | 类型 | 描述 |
|------|------|------|
| `name` | `string` | 文件名 |
| `path` | `string` | 绝对路径 |
| `relativePath` | `string` | 相对路径 |
| `extension` | `string` | 文件扩展名 |
| `size` | `number` | 文件大小（字节） |
| `modifiedAt` | `Date` | 修改时间 |
| `createdAt` | `Date` | 创建时间 |
| `isDirectory` | `boolean` | 是否为目录 |
| `isFile` | `boolean` | 是否为文件 |
| `isSymbolicLink` | `boolean` | 是否为符号链接 |

### ScanStats

扫描统计：

| 属性 | 类型 | 描述 |
|------|------|------|
| `totalFiles` | `number` | 扫描的文件总数 |
| `totalDirectories` | `number` | 扫描的目录总数 |
| `matchedFiles` | `number` | 匹配的文件数 |
| `skippedFiles` | `number` | 跳过的文件数 |
| `errors` | `number` | 错误数量 |
| `totalSize` | `number` | 总文件大小（字节） |

## 扫描策略

### 深度优先 (Depth-First)

深度优先扫描会先深入到每个子目录的最深处，然后再返回处理其他分支。适合需要完整遍历文件树的场景。

```typescript
const scanner = new FileScanner({
  rootDir: process.cwd(),
  strategy: 'depth',
});
```

### 广度优先 (Breadth-First)

广度优先扫描会先处理当前目录的所有内容，然后再进入子目录。适合需要按层级顺序处理文件的场景。

```typescript
const scanner = new FileScanner({
  rootDir: process.cwd(),
  strategy: 'breadth',
});
```

## 错误处理

文件扫描服务会捕获并记录扫描过程中遇到的错误，但不会中断扫描：

```typescript
const scanner = new FileScanner({
  rootDir: process.cwd(),
});

const result = await scanner.scan();

// 检查是否有错误
if (result.stats.errors > 0) {
  const errors = scanner.getErrors();
  errors.forEach(error => {
    console.error(`错误: ${error.message}`);
  });
}
```

## 性能优化建议

1. **限制扫描深度**：如果不需要扫描深层目录，设置 `maxDepth` 可以显著提高性能
2. **排除不必要的目录**：使用 `excludeDirs` 排除不需要的目录
3. **精确的扩展名过滤**：只指定需要的文件扩展名
4. **选择合适的扫描策略**：根据使用场景选择深度优先或广度优先

## 示例

完整的示例代码请参考 `examples/scanner-example.ts`。

## 测试

运行测试：

```bash
bun test tests/scanner.test.ts
```

## 相关任务

- 任务010: 实现文件扫描服务 ✅
- 任务011: 实现文件监听器
- 任务012: 实现文件索引
- 任务039: 解析 docs/ 目录结构