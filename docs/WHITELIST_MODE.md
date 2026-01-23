# 白名单模式

Folder-Site 支持白名单模式，允许你指定只显示特定的文件夹和文件，而排除其他所有内容。

## 使用场景

白名单模式适合以下场景：

- 只想展示特定目录的文档（如 `docs/` 和 `examples/`）
- 大型项目中只关注特定模块
- 敏感项目需要严格控制可见范围
- 多租户场景下需要隔离不同用户的内容

## 配置方式

### 1. 配置文件方式

在项目根目录创建 `.folder-siterc.json` 文件：

```json
{
  "build": {
    "whitelist": [
      "docs/**/*",
      "examples/*.md",
      "README.md"
    ]
  }
}
```

### 2. CLI 参数方式

使用 `--whitelist` 参数：

```bash
folder-site --whitelist "docs/**/*,examples/*.md,README.md"
```

## Glob 模式语法

白名单支持标准的 glob 模式：

| 模式 | 说明 | 示例 |
|------|------|------|
| `**/*` | 匹配所有文件和目录 | `docs/**/*` |
| `*.md` | 匹配当前目录下所有 .md 文件 | `*.md` |
| `**/*.md` | 递归匹配所有 .md 文件 | `**/*.md` |
| `dir/*.md` | 匹配特定目录下的 .md 文件 | `docs/*.md` |
| `README.md` | 精确匹配文件 | `README.md` |

## 配置优先级

CLI 参数优先于配置文件：

1. 如果使用了 `--whitelist` CLI 参数，将使用 CLI 的配置
2. 否则使用配置文件中的 `whitelist` 配置
3. 如果都没有配置，使用默认的黑名单模式

## 示例

### 示例 1：只显示文档目录

```json
{
  "build": {
    "whitelist": ["docs/**/*"]
  }
}
```

### 示例 2：显示多个目录和文件

```json
{
  "build": {
    "whitelist": [
      "docs/**/*",
      "examples/**/*",
      "README.md",
      "CHANGELOG.md"
    ]
  }
}
```

### 示例 3：只显示 Markdown 文件

```json
{
  "build": {
    "whitelist": ["**/*.md"]
  }
}
```

### 示例 4：混合模式

```json
{
  "build": {
    "whitelist": [
      "docs/**/*.md",
      "examples/*.md",
      "README.md",
      "api/**/*.json"
    ]
  }
}
```

## 注意事项

1. **白名单优先于黑名单**：当同时配置了白名单和黑名单时，白名单模式生效
2. **空数组**：如果 `whitelist` 配置为空数组 `[]`，将使用默认的黑名单模式
3. **路径分隔符**：使用 `/` 作为路径分隔符，即使在 Windows 系统上
4. **相对路径**：所有路径都是相对于项目根目录的相对路径

## 与黑名单模式的对比

| 特性 | 黑名单模式（默认） | 白名单模式 |
|------|------------------|-----------|
| 配置方式 | `excludeDirs` | `whitelist` |
| 扫描范围 | 排除指定目录 | 只包含指定内容 |
| 适用场景 | 大多数项目 | 敏感项目、多租户 |
| 灵活性 | 中等 | 高 |
| 安全性 | 中等 | 高 |

## 故障排查

### 问题：配置了白名单但看不到任何文件

**解决方案**：
- 检查 glob 模式是否正确
- 确认文件路径是否相对于项目根目录
- 查看服务器启动日志，确认白名单已生效

### 问题：白名单不生效

**解决方案**：
- 确认配置文件名为 `.folder-siterc.json` 或 `folder-site.config.json`
- 检查 JSON 格式是否正确
- 如果使用 CLI 参数，确认参数格式正确

## 高级用法

### 动态白名单

可以通过环境变量动态设置白名单：

```bash
WHITELIST="docs/**/*,examples/*.md" folder-site
```

### 编程方式

在代码中使用：

```typescript
import { FileScanner } from './server/services/scanner';

const scanner = new FileScanner({
  rootDir: process.cwd(),
  whitelist: ['docs/**/*', 'README.md'],
});

const result = await scanner.scan();
```

## 相关文档

- [文件扫描器](./file-scanner.md)
- [配置指南](./SETTINGS_GUIDE.md)
- [使用指南](./USAGE.md)