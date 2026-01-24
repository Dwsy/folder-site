# Folder-Site

> 一键式本地网站生成器，专为文档和知识库打造

[![版本](https://img.shields.io/npm/v/folder-site)](https://www.npmjs.com/package/folder-site)
[![许可证](https://img.shields.io/npm/l/folder-site)](LICENSE)
[![Node](https://img.shields.io/node/v/folder-site)](https://nodejs.org)

## ✨ 特性

Folder-Site CLI 是一个强大的命令行工具，可以将任何目录转换为可浏览的网站，提供类似 VS Code 的体验，适用于本地文档、知识库和 Workhub 集成。

### 核心功能

- 🚀 **一键启动** - 单条命令即可启动本地服务器
- 📁 **文件树导航** - 可展开/折叠的目录树
- 📝 **Markdown 渲染** - 完整的 GFM 支持，包含语法高亮
- 🔍 **快速搜索** - Cmd+P 模糊文件搜索（< 100ms）
- 🔄 **实时预览** - 文件变更自动刷新
- 🌓 **深色/浅色主题** - 主题切换并持久化
- 🔌 **插件系统** - 可扩展的渲染器架构

### 高级功能

- 📊 **图表渲染** - 支持 Mermaid、Graphviz、Vega
- 🎨 **代码高亮** - 100+ 种语言（Shiki）
- 📄 **导出功能** - 客户端 PDF/HTML 导出
- 🏢 **Workhub 集成** - 支持 docs/ 目录结构
- 👀 **文件监控** - 通过 chokidar 高效监控
- ⚡ **渲染缓存** - LRU 缓存提升性能
- ⌨️ **键盘快捷键** - 完整的键盘导航
- 😊 **Emoji 支持** - 自动转换 Emoji 短代码
- 📐 **LaTeX 公式** - KaTeX 数学公式渲染
- 🖼️ **JSON Canvas** - Obsidian 画布格式支持
- 🎨 **SVG 代码块** - 直接渲染 SVG 图形

## 🚀 快速开始

### 前置要求

- **Node.js** >= 18.0.0
- **Bun** >= 1.0.0（推荐）

### 安装

```bash
# 使用 npm
npm install -g folder-site

# 使用 yarn
yarn global add folder-site

# 使用 pnpm
pnpm add -g folder-site

# 使用 bun
bun install -g folder-site
```

**当前版本**: [v1.1.0](https://www.npmjs.com/package/folder-site)

### 基本用法

```bash
# 在当前目录启动
folder-site

# 在指定目录启动
folder-site /path/to/docs

# 指定端口
folder-site --port 8080

# 使用白名单模式（仅显示特定文件）
folder-site --whitelist "docs/**/*,README.md"

# 显示版本
folder-site --version

# 显示帮助
folder-site --help
```

服务器启动后，在浏览器中打开 `http://localhost:3000`。

## 📖 文档

- [安装指南](./docs/INSTALLATION.md) - 详细安装说明
- [使用指南](./docs/USAGE.md) - 完整使用文档
- [白名单模式](./docs/WHITELIST_MODE.md) - 白名单配置指南
- [API 文档](./docs/API.md) - API 接口文档
- [故障排查](./docs/TROUBLESHOOTING.md) - 常见问题和解决方案

设计文档位于 [docs/](./docs/) 目录。

## 📊 支持的渲染类型

### 图表和可视化

| 类型 | 代码块语言 | 说明 | 依赖库 |
|------|-----------|------|--------|
| **Mermaid** | `mermaid`, `mmd` | 流程图、序列图、甘特图等 | mermaid |
| **Vega/Vega-Lite** | `vega`, `vega-lite`, `vl` | 数据可视化 | vega-embed |
| **Graphviz** | `dot`, `graphviz` | DOT 图形 | @viz-js/viz |
| **Infographic** | `infographic` | AntV 信息图 | @antv/infographic |
| **JSON Canvas** | `canvas`, `json-canvas` | Obsidian 画布格式 | 内置 SVG |
| **SVG** | `svg` | 直接渲染 SVG | 浏览器原生 |

### 文本和格式

| 类型 | 代码块语言 | 说明 |
|------|-----------|------|
| **Markdown** | `.md` | 完整 GFM 支持 |
| **代码高亮** | 100+ 语言 | Shiki 语法高亮 |
| **LaTeX** | `$...$`, `$$...$$` | KaTeX 数学公式 |
| **Emoji** | `:smile:` | remark-emoji 自动转换 |
| **HTML** | `html` | 原生 HTML 支持 |

### 文件类型

| 扩展名 | 类型 | 渲染器 |
|--------|------|--------|
| `.md` | Markdown | 内置 |
| `.txt` | 纯文本 | 内置 |
| `.json` | JSON | 内置 |
| `.yml` / `.yaml` | YAML | 内置 |
| `.pdf` | PDF 文档 | pdfjs-dist |
| `.docx` | Word 文档 | docx-preview |
| `.xlsx` | Excel 表格 | xlsx |

## 🎯 插件系统

Folder-Site 提供强大的插件系统，支持自定义渲染器：

### 内置渲染器

```typescript
// Mermaid 渲染器（带完整工具栏）
createMermaidRenderer(theme: 'light' | 'dark')

// Vega/Vega-Lite 渲染器
createVegaRenderer()

// Graphviz 渲染器
createGraphvizRenderer()

// Infographic 渲染器
createInfographicRenderer()

// JSON Canvas 渲染器
createJsonCanvasRenderer()

// SVG 渲染器
createSvgRenderer()
```

### 自定义渲染器

```typescript
import { usePluginRenderer } from './hooks/usePluginRenderer';

const customRenderers = useMemo(() => ({
  'my-custom': async (container, theme) => {
    // 自定义渲染逻辑
  },
}), []);

const containerRef = usePluginRenderer(html, theme, customRenderers);
```

详见 [插件开发文档](./docs/guides/plugin-development.md)。

## ⌨️ 键盘快捷键

| 快捷键 | 操作 |
|--------|------|
| `Cmd+P` / `Ctrl+P` | 快速文件搜索（支持高级语法） |
| `Esc` | 关闭弹窗 |
| `↑` / `↓` | 导航结果 |
| `Enter` | 打开选中文件 |
| `Cmd+K` / `Ctrl+K` | 切换命令面板 |
| `Cmd+D` / `Ctrl+D` | 切换深色/浅色主题 |

### 高级搜索语法

快速搜索现在支持强大的逻辑运算符：

```
# 基础搜索
markdown

# 精确匹配
"README.md"

# 逻辑运算符
react AND tutorial          # 同时包含两个词
vue OR react               # 包含任一词
code AND NOT test          # 排除某个词

# 分组
(react OR vue) AND tutorial
markdown AND (guide OR tutorial) AND NOT draft
```

详见 [搜索语法指南](./docs/guides/search-syntax.md)。

## 🏗️ 项目结构

```
folder-site/
├── src/
│   ├── cli/              # CLI 入口
│   ├── server/           # Hono 服务器
│   │   ├── routes/       # API 路由
│   │   ├── middleware/   # 中间件
│   │   ├── services/     # 业务逻辑
│   │   └── lib/          # 核心库
│   ├── client/           # React 前端
│   │   ├── components/   # React 组件
│   │   │   ├── editor/   # 编辑器组件
│   │   │   │   ├── MarkdownRenderer.tsx
│   │   │   │   └── renderers/ # 渲染器模块
│   │   │   ├── layout/   # 布局组件
│   │   │   └── ui/       # UI 组件
│   │   ├── pages/        # 页面组件
│   │   ├── hooks/        # 自定义 Hooks
│   │   └── lib/          # 客户端库
│   ├── parsers/          # 文件解析器
│   │   ├── markdown.ts   # Markdown 处理器
│   │   ├── remark-*.ts   # Remark 插件
│   │   └── rehype-*.ts   # Rehype 插件
│   ├── types/            # TypeScript 类型
│   └── utils/            # 工具函数
├── plugins/              # 插件目录
│   ├── mermaid-renderer/ # Mermaid 插件
│   ├── vega-renderer/    # Vega 插件
│   ├── graphviz-renderer/# Graphviz 插件
│   └── infographic-renderer/ # Infographic 插件
├── public/               # 静态资源
├── docs/                 # 文档
├── examples/             # 示例文件
├── tests/                # 测试文件
└── package.json
```

## 🛠️ 技术栈

### 后端

| 技术 | 用途 |
|------|------|
| **Bun** | 快速 JavaScript 运行时 |
| **Hono** | 轻量级 Web 框架 |
| **unified** | Markdown 处理管道 |
| **remark** | Markdown 解析器 |
| **rehype** | HTML 转换器 |
| **chokidar** | 文件监控 |
| **lru-cache** | 缓存实现 |
| **fuse.js** | 模糊搜索 |

### 前端

| 技术 | 用途 |
|------|------|
| **React** | UI 库 |
| **Vite** | 构建工具 |
| **Tailwind CSS** | 样式框架 |
| **Radix UI** | 无障碍组件 |
| **Shiki** | 语法高亮 |
| **jsPDF** | PDF 生成 |

### 渲染引擎

| 技术 | 用途 |
|------|------|
| **mermaid** | Mermaid 图表 |
| **vega-embed** | Vega/Vega-Lite |
| **@viz-js/viz** | Graphviz DOT |
| **@antv/infographic** | AntV 信息图 |
| **rehype-katex** | LaTeX 公式 |
| **remark-emoji** | Emoji 短代码 |

## 🔧 配置

### 配置文件 (`.folder-siterc.json`)

```json
{
  "port": 3000,
  "theme": "dark",
  "sidebar": {
    "width": 280,
    "collapsed": false
  },
  "search": {
    "debounce": 50,
    "maxResults": 10
  },
  "cache": {
    "enabled": true,
    "ttl": 3600000
  },
  "build": {
    "whitelist": [
      "docs/**/*",
      "examples/*.md",
      "README.md"
    ]
  }
}
```

### 白名单模式

白名单模式允许你指定只显示某些文件夹和文件：

```bash
# 使用白名单模式
folder-site --whitelist "docs/**/*,examples/*.md,README.md"
```

详见 [白名单模式文档](./docs/WHITELIST_MODE.md)。

### 环境变量

```bash
# 服务器端口
PORT=3000

# 白名单模式（逗号分隔的 glob 模式）
WHITELIST="docs/**/*,examples/*.md"
```

## 📝 Markdown 功能

### 代码块

\`\`\`javascript
function hello() {
  console.log('Hello, World!');
}
\`\`\`

### 数学公式

行内公式：$E = mc^2$

块级公式：
$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$

### Emoji

`:smile:` → 😄  
`:rocket:` → 🚀  
`:fire:` → 🔥

### Mermaid 图表

\`\`\`mermaid
graph LR
  A[开始] --> B[处理]
  B --> C[结束]
\`\`\`

### Vega/Vega-Lite

\`\`\`vega-lite
{
  "mark": "bar",
  "data": {"values": [1, 2, 3]},
  "encoding": {
    "x": {"field": "data"}
  }
}
\`\`\`

### JSON Canvas

\`\`\`canvas
{
  "nodes": [
    {"id": "1", "type": "text", "text": "Hello", "x": 0, "y": 0},
    {"id": "2", "type": "text", "text": "World", "x": 100, "y": 0}
  ],
  "edges": [{"fromNode": "1", "toNode": "2"}]
}
\`\`\`

## 🧪 测试

### 运行测试

```bash
# 运行所有测试
bun test

# 监听模式
bun test --watch

# 覆盖率
bun test --coverage
```

### 类型检查

```bash
bun run typecheck
```

### 代码检查

```bash
bun run lint
```

## 🚀 开发

### 启动开发服务器

```bash
# 启动后端开发服务器
bun run dev

# 启动前端开发服务器
bun run dev:client
```

### 构建生产版本

```bash
# 构建后端
bun run build

# 构建前端
bun run build:client
```

## 🤝 贡献

欢迎贡献！请遵循以下步骤：

1. 阅读 [设计文档](./docs/design-catalog/)
2. 检查现有的 Issues
3. 创建功能分支
4. 提交 Pull Request

## 📄 许可证

MIT License - 详见 [LICENSE](./LICENSE) 文件

## 🙏 致谢

- **markdown-viewer-extension** - Markdown 渲染灵感来源
- **Radix UI** - 无障碍组件
- **shadcn/ui** - 精美组件示例
- **@react-symbols/icons** - 文件/文件夹图标
- **RemixIcon** - 通用图标
- **Vercel** - 设计灵感

## 📞 联系方式

- **Issues**: [GitHub Issues](https://github.com/yourusername/folder-site/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/folder-site/discussions)
- **Email**: your.email@example.com

## 📚 相关资源

- [项目文档](./docs/)
- [API 参考](./docs/API.md)
- [设计文档](./docs/design-catalog/)
- [更新日志](./docs/CHANGELOG.md)

---

**准备好开始了吗？** → [快速开始指南](./docs/INSTALLATION.md) 🚀