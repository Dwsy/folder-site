# 静态文件服务说明

## 概述

Folder-Site 使用 Hono 的 `serveStatic` 中间件提供静态文件服务，支持 SPA（单页应用）路由回退。

## 目录结构

```
folder-site/
├── public/                 # 开发环境静态资源目录
│   ├── index.html         # 测试页面
│   ├── assets/            # 静态资源
│   ├── images/            # 图片资源
│   └── fonts/             # 字体文件
├── dist/client/           # 生产环境构建输出
│   ├── index.html         # 应用入口
│   ├── assets/            # 构建后的资源
│   │   ├── css/           # CSS 文件
│   │   └── js/            # JavaScript 文件
│   └── favicon.ico        # 网站图标
```

## MIME 类型支持

服务器已配置以下 MIME 类型：

- `.html` - `text/html; charset=utf-8`
- `.css` - `text/css; charset=utf-8`
- `.js` - `application/javascript; charset=utf-8`
- `.json` - `application/json; charset=utf-8`
- `.png` - `image/png`
- `.jpg/.jpeg` - `image/jpeg`
- `.gif` - `image/gif`
- `.svg` - `image/svg+xml`
- `.ico` - `image/x-icon`
- `.woff/.woff2` - `font/woff`
- `.ttf` - `font/ttf`
- `.pdf` - `application/pdf`
- `.webp` - `image/webp`
- `.avif` - `image/avif`

## 路由优先级

路由按以下顺序处理：

1. **API 路由** (`/api/*`) - 优先处理 API 请求
2. **静态文件** - 尝试从 `dist/client` 提供静态文件
3. **SPA 回退** - 对于非 API 路径，返回 `index.html` 让 React Router 处理

## SPA 路由回退

当用户访问前端路由（如 `/docs/about`）时：

1. 服务器首先检查是否为 API 路径
2. 然后尝试查找对应的静态文件
3. 如果都找不到，返回 `index.html`
4. React Router 在客户端接管路由渲染

## 测试

### 运行服务器

```bash
bun run dev
```

### 测试静态文件访问

访问以下 URL 验证功能：

- `http://localhost:3000/` - 主页
- `http://localhost:3000/test` - 测试 SPA 路由回退
- `http://localhost:3000/docs/about` - 测试多级路由
- `http://localhost:3000/api/health` - 测试 API 健康检查

### 构建生产版本

```bash
bun run build:client
bun run start
```

## 注意事项

1. **开发环境**：使用 Vite 开发服务器 (`bun run dev:client`)
2. **生产环境**：使用构建后的静态文件 (`bun run build:client`)
3. **API 路由**：始终以 `/api` 开头，避免与静态文件冲突
4. **缓存**：生产环境建议配置适当的缓存策略

## 相关文件

- `src/server/index.ts` - 服务器主入口
- `vite.config.ts` - Vite 构建配置
- `public/` - 开发环境静态资源
- `dist/client/` - 生产环境构建输出