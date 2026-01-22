# Folder-Site CLI

> One-command local website generator for documentation and knowledge bases

[![Version](https://img.shields.io/npm/v/folder-site)](https://www.npmjs.com/package/folder-site)
[![License](https://img.shields.io/npm/l/folder-site)](LICENSE)
[![Node](https://img.shields.io/node/v/folder-site)](https://nodejs.org)

## ✨ 特性

Folder-Site CLI 是一个强大的命令行工具，可以将任何目录转换为可浏览的网站，为本地文档、知识库和 Workhub 集成提供类似 VS Code 的体验。

### 核心功能

- 🚀 **一键启动** - 单个命令即可启动本地服务器
- 📁 **文件树导航** - 可展开/折叠的目录树
- 📝 **Markdown 渲染** - 完整的 GFM 支持，语法高亮
- 🔍 **快速搜索** - Cmd+P 模糊文件搜索（< 100ms）
- 🔄 **实时预览** - 文件变更自动刷新
- 🌓 **深色/浅色主题** - 主题切换与持久化
- 🔌 **插件系统** - 可扩展的渲染器架构

### 高级功能

- 📊 **图表渲染** - Mermaid、Graphviz、Vega 支持
- 🎨 **代码高亮** - 100+ 语言支持（Shiki）
- 📄 **导出功能** - 客户端导出 PDF/HTML
- 🏢 **Workhub 集成** - docs/ 结构支持
- 👀 **文件监视** - 基于 chokidar 的高效监视
- ⚡ **渲染缓存** - LRU 缓存提升性能
- ⌨️ **键盘快捷键** - 完整的键盘导航

## 🚀 快速开始

### 前置要求

- **Node.js** >= 18.0.0
- **Bun** >= 1.0.0（推荐）

### 安装

```bash
# 使用 npm 安装
npm install -g folder-site

# 使用 yarn 安装
yarn global add folder-site

# 使用 pnpm 安装
pnpm add -g folder-site

# 使用 bun 安装
bun install -g folder-site
```

### 基本使用

```bash
# 在当前目录启动
folder-site

# 在指定目录启动
folder-site /path/to/docs

# 指定端口
folder-site --port 8080

# 显示版本
folder-site --version

# 显示帮助
folder-site --help
```

服务器启动后，在浏览器中打开 `http://localhost:3000` 即可查看。

## 📖 文档

- [安装指南](./docs/INSTALLATION.md) - 详细的安装说明
- [使用指南](./docs/USAGE.md) - 完整的使用文档
- [API 文档](./docs/API.md) - API 接口说明
- [故障排查](./docs/TROUBLESHOOTING.md) - 常见问题解决

详细的设计文档请查看 [docs/](./docs/) 目录。

## 🛠️ 技术栈

### 后端

| 技术 | 用途 |
|------|------|
| **Bun** | 快速 JavaScript 运行时 |
| **Hono** | 轻量级 Web 框架 |
| **unified** | Markdown 处理流水线 |
| **remark** | Markdown 解析器 |
| **rehype** | HTML 转换器 |
| **chokidar** | 文件监视器 |
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

## 🏗️ 项目结构

```
folder-site/
├── src/
│   ├── cli/              # CLI 入口
│   ├── server/           # Hono 服务器
│   │   ├── routes/       # API 路由
│   │   ├── middleware/   # 中间件
│   │   └── services/     # 业务逻辑
│   ├── client/           # React 前端
│   │   ├── components/   # React 组件
│   │   ├── layouts/      # 页面布局
│   │   └── styles/       # 全局样式
│   ├── hooks/            # 自定义 Hooks
│   ├── parsers/          # 文件解析器
│   ├── utils/            # 工具函数
│   └── types/            # TypeScript 类型
├── public/               # 静态资源
├── docs/                 # 文档
├── tests/                # 测试文件
└── package.json
```

## ⌨️ 快捷键

| 快捷键 | 操作 |
|--------|------|
| `Cmd+P` / `Ctrl+P` | 打开快速搜索 |
| `Esc` | 关闭模态框 |
| `↑` / `↓` | 导航结果 |
| `Enter` | 打开选中文件 |
| `Cmd+K` / `Ctrl+K` | 切换命令面板 |
| `Cmd+D` / `Ctrl+D` | 切换深色/浅色主题 |

## 📁 支持的文件类型

| 扩展名 | 类型 | 渲染器 |
|--------|------|--------|
| `.md` | Markdown | 内置 |
| `.mmd` | Mermaid | 插件 |
| `.txt` | 纯文本 | 内置 |
| `.json` | JSON | 内置 |
| `.yml` / `.yaml` | YAML | 内置 |

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
  }
}
```

### 环境变量

```bash
# 服务器端口
PORT=3000

# 主题 (light/dark)
THEME=dark

# 缓存 TTL (毫秒)
CACHE_TTL=3600000
```

## 🤝 贡献

欢迎贡献！请：

1. 阅读 [设计文档](./docs/design-catalog/)
2. 检查现有 Issues
3. 创建功能分支
4. 提交 Pull Request

## 📄 许可证

MIT License - 详见 [LICENSE](./LICENSE) 文件

## 🙏 致谢

- **markdown-viewer-extension** - Markdown 渲染灵感
- **Radix UI** - 无障碍组件
- **shadcn/ui** - 美观组件示例
- **@react-symbols/icons** - 文件/文件夹图标
- **RemixIcon** - 通用图标
- **Vercel** - 设计灵感

## 📞 联系

- **Issues**: [GitHub Issues](https://github.com/yourusername/folder-site/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/folder-site/discussions)
- **Email**: your.email@example.com

---

**准备开始？** → [快速开始指南](./docs/INSTALLATION.md) 🚀