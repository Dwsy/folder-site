# API 文档

本文档介绍 Folder-Site CLI 的 API 接口、请求/响应格式和使用示例。

## 目录

- [API 概览](#api-概览)
- [通用响应格式](#通用响应格式)
- [认证](#认证)
- [速率限制](#速率限制)
- [端点说明](#端点说明)
- [类型定义](#类型定义)
- [代码示例](#代码示例)
- [错误处理](#错误处理)
- [最佳实践](#最佳实践)

---

## API 概览

### 基础信息

- **Base URL**: `http://localhost:3000/api`
- **协议**: HTTP/HTTPS
- **数据格式**: JSON
- **字符编码**: UTF-8

### 端点列表

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/health` | GET | 健康检查 |
| `/api` | GET | API 信息 |
| `/api/files` | GET | 获取文件列表 |
| `/api/files/tree/list` | GET | 获取目录树 |
| `/api/files/content` | GET | 获取文件内容 |
| `/api/files/tree/children` | GET | 获取目录子节点（懒加载） |
| `/api/search` | GET | 执行搜索 |
| `/api/search` | POST | 执行复杂搜索 |
| `/api/workhub` | GET | 获取所有 Workhub 数据 |
| `/api/workhub/adrs` | GET | 获取所有 ADR |
| `/api/workhub/adrs/:id` | GET | 获取指定 ADR |
| `/api/workhub/issues` | GET | 获取所有 Issues |
| `/api/workhub/issues/:id` | GET | 获取指定 Issue |
| `/api/workhub/prs` | GET | 获取所有 PRs |
| `/api/workhub/prs/:id` | GET | 获取指定 PR |

---

## 通用响应格式

### 成功响应

```json
{
  "success": true,
  "data": {
    // 响应数据
  },
  "timestamp": 1705867200000
}
```

### 错误响应

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述",
    "details": {}
  },
  "timestamp": 1705867200000
}
```

### 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `success` | boolean | 请求是否成功 |
| `data` | any | 响应数据（成功时） |
| `error` | ApiError | 错误信息（失败时） |
| `timestamp` | number | Unix 时间戳（毫秒） |

---

## 认证

当前版本 API 不需要认证，所有端点都是公开的。

未来版本可能支持以下认证方式：

- **API Key**: 通过 `Authorization: Bearer <api-key>` 头传递
- **JWT Token**: 通过 `Authorization: Bearer <jwt-token>` 头传递

### 认证头格式

```http
Authorization: Bearer your-api-key-here
```

### 请求示例（未来版本）

```bash
curl -H "Authorization: Bearer your-api-key" \
  http://localhost:3000/api/files
```

### 认证错误响应（未来版本）

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or missing authentication credentials",
    "details": {}
  },
  "timestamp": 1705867200000
}
```

---

## 速率限制

当前版本 API 没有强制速率限制，但建议客户端合理控制请求频率。

### 推荐请求频率

| 操作类型 | 建议频率 |
|---------|---------|
| 健康检查 | 每分钟最多 60 次 |
| 文件列表 | 每分钟最多 30 次 |
| 搜索 | 每分钟最多 20 次 |
| 文件内容获取 | 每分钟最多 60 次 |
| Workhub 数据 | 每分钟最多 10 次 |

### 未来速率限制策略

未来版本可能实施以下限制：

| 限制类型 | 默认值 | 说明 |
|---------|--------|------|
| 每分钟请求数 | 100 | 每分钟最多 100 个请求 |
| 每小时请求数 | 1000 | 每小时最多 1000 个请求 |
| 并发连接数 | 10 | 同时最多 10 个并发连接 |

### 速率限制响应头（未来）

| 响应头 | 说明 |
|--------|------|
| `X-RateLimit-Limit` | 请求配额 |
| `X-RateLimit-Remaining` | 剩余配额 |
| `X-RateLimit-Reset` | 配额重置时间（Unix 时间戳） |

### 速率限制错误响应（未来）

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "details": {
      "limit": 100,
      "remaining": 0,
      "resetAt": 1705867260000
    }
  },
  "timestamp": 1705867200000
}
```

### 实现客户端请求节流

```typescript
class RateLimitedClient {
  private lastRequestTime = 0;
  private minInterval = 1000; // 1 秒间隔

  async request(url: string, options?: RequestInit) {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;

    if (elapsed < this.minInterval) {
      await new Promise(resolve =>
        setTimeout(resolve, this.minInterval - elapsed)
      );
    }

    this.lastRequestTime = Date.now();
    return fetch(url, options);
  }
}
```

---

## 端点说明

### 1. 健康检查

检查服务运行状态。

**端点**: `GET /api/health`

**请求示例**:

```bash
curl http://localhost:3000/api/health
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "message": "Folder-Site CLI is running",
    "version": "0.1.0",
    "uptime": 3600
  },
  "timestamp": 1705867200000
}
```

**字段说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| `status` | string | 服务状态：ok / error |
| `message` | string | 状态消息 |
| `version` | string | 服务版本号 |
| `uptime` | number | 运行时间（秒） |

---

### 2. API 信息

获取 API 端点列表和信息。

**端点**: `GET /api`

**请求示例**:

```bash
curl http://localhost:3000/api
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "name": "Folder-Site CLI API",
    "version": "0.1.0",
    "endpoints": {
      "health": "/api/health",
      "files": "/api/files",
      "search": "/api/search",
      "workhub": "/api/workhub",
      "export": "/api/export"
    }
  },
  "timestamp": 1705867200000
}
```

---

### 3. 获取文件列表

获取指定目录的文件列表。

**端点**: `GET /api/files`

**查询参数**:

| 参数 | 类型 | 必需 | 默认值 | 说明 |
|------|------|------|--------|------|
| `path` | string | 否 | . | 目录路径 |
| `limit` | number | 否 | 100 | 返回数量限制 |
| `offset` | number | 否 | 0 | 偏移量 |

**请求示例**:

```bash
curl "http://localhost:3000/api/files?path=docs&limit=20"
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "files": [
      {
        "name": "README.md",
        "path": "/Users/user/docs/README.md",
        "relativePath": "docs/README.md",
        "extension": "md",
        "size": 1024,
        "modifiedAt": "2024-01-22T10:00:00.000Z",
        "createdAt": "2024-01-20T10:00:00.000Z",
        "isDirectory": false,
        "isFile": true,
        "isSymbolicLink": false
      }
    ],
    "total": 1,
    "page": 1,
    "pageSize": 20
  },
  "timestamp": 1705867200000
}
```

**FileInfo 字段说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| `name` | string | 文件名 |
| `path` | string | 绝对路径 |
| `relativePath` | string | 相对路径 |
| `extension` | string | 文件扩展名 |
| `size` | number | 文件大小（字节） |
| `modifiedAt` | Date | 修改时间 |
| `createdAt` | Date | 创建时间 |
| `isDirectory` | boolean | 是否为目录 |
| `isFile` | boolean | 是否为文件 |
| `isSymbolicLink` | boolean | 是否为符号链接 |

---

### 4. 获取目录树

获取完整的目录树结构。

**端点**: `GET /api/files/tree/list`

**查询参数**:

| 参数 | 类型 | 必需 | 默认值 | 说明 |
|------|------|------|--------|------|
| `path` | string | 否 | . | 根目录路径 |
| `depth` | number | 否 | -1 | 深度限制（-1 表示无限制） |

**请求示例**:

```bash
curl "http://localhost:3000/api/files/tree/list?path=docs&depth=3"
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "root": "/Users/user/docs",
    "tree": {
      "name": "docs",
      "path": "/Users/user/docs",
      "relativePath": "docs",
      "isDirectory": true,
      "children": [
        {
          "name": "README.md",
          "path": "/Users/user/docs/README.md",
          "relativePath": "docs/README.md",
          "extension": "md",
          "isDirectory": false,
          "children": []
        }
      ]
    },
    "totalNodes": 2
  },
  "timestamp": 1705867200000
}
```

**DirectoryTreeNode 字段说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| `name` | string | 节点名称 |
| `path` | string | 绝对路径 |
| `relativePath` | string | 相对路径 |
| `extension` | string | 文件扩展名（仅文件） |
| `isDirectory` | boolean | 是否为目录 |
| `children` | DirectoryTreeNode[] | 子节点（仅目录） |

---

### 5. 获取文件内容

获取指定文件的内容。

**端点**: `GET /api/files/content`

**查询参数**:

| 参数 | 类型 | 必需 | 默认值 | 说明 |
|------|------|------|--------|------|
| `path` | string | 是 | - | 文件相对路径 |

**请求示例**:

```bash
curl "http://localhost:3000/api/files/content?path=docs/README.md"
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "info": {
      "name": "README.md",
      "path": "/Users/user/docs/README.md",
      "relativePath": "docs/README.md",
      "extension": "md",
      "size": 1024,
      "modifiedAt": "2024-01-22T10:00:00.000Z",
      "createdAt": "2024-01-20T10:00:00.000Z",
      "isDirectory": false,
      "isFile": true,
      "isSymbolicLink": false
    },
    "content": "# Hello World\n\nThis is a markdown file.",
    "meta": {
      "title": "Hello World",
      "description": "This is a markdown file",
      "tags": [],
      "updated": "2024-01-22T10:00:00.000Z"
    },
    "html": "<h1>Hello World</h1>\n<p>This is a markdown file.</p>"
  },
  "timestamp": 1705867200000
}
```

**字段说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| `info` | FileInfo | 文件信息 |
| `content` | string | 原始内容 |
| `meta` | FileMeta | 文件元数据 |
| `html` | string | 渲染后的 HTML（render=true 时） |

---

### 5.1 获取目录子节点（懒加载）

获取指定路径下的直接子节点，支持懒加载。

**端点**: `GET /api/files/tree/children`

**查询参数**:

| 参数 | 类型 | 必需 | 默认值 | 说明 |
|------|------|------|--------|------|
| `path` | string | 否 | "" | 父目录路径（空字符串表示根目录） |
| `depth` | number | 否 | 1 | 子节点深度 |

**请求示例**:

```bash
curl "http://localhost:3000/api/files/tree/children?path=docs&depth=1"
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "children": [
      {
        "name": "README.md",
        "path": "docs/README.md",
        "relativePath": "docs/README.md",
        "isDirectory": false,
        "extension": "md",
        "size": 1024
      },
      {
        "name": "guides",
        "path": "docs/guides",
        "relativePath": "docs/guides",
        "isDirectory": true,
        "extension": "",
        "size": 0
      }
    ]
  },
  "timestamp": 1705867200000
}
```

**字段说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| `name` | string | 节点名称 |
| `path` | string | 相对路径 |
| `relativePath` | string | 相对路径 |
| `isDirectory` | boolean | 是否为目录 |
| `extension` | string | 文件扩展名（仅文件） |
| `size` | number | 文件大小（字节） |

---

### 6. 搜索（GET）

执行简单的搜索查询。

**端点**: `GET /api/search`

**查询参数**:

| 参数 | 类型 | 必需 | 默认值 | 说明 |
|------|------|------|--------|------|
| `q` | string | 是 | - | 搜索关键词 |
| `scope` | string | 否 | all | 搜索范围：all / titles / content / files |
| `limit` | number | 否 | 20 | 结果数量限制 |
| `offset` | number | 否 | 0 | 偏移量 |

**请求示例**:

```bash
curl "http://localhost:3000/api/search?q=folder-site&scope=content&limit=10"
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "results": [
      {
        "path": "/Users/user/docs/README.md",
        "name": "README.md",
        "title": "Folder-Site CLI",
        "excerpt": "Folder-Site CLI is a one-command local website generator...",
        "score": 0.95,
        "type": "markdown",
        "meta": {
          "title": "Folder-Site CLI",
          "description": "One-command local website generator",
          "tags": ["cli", "website"],
          "updated": "2024-01-22T10:00:00.000Z"
        }
      }
    ],
    "total": 1,
    "duration": 15,
    "query": "folder-site"
  },
  "timestamp": 1705867200000
}
```

**SearchResultItem 字段说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| `path` | string | 文件路径 |
| `name` | string | 文件名 |
| `title` | string | 标题 |
| `excerpt` | string | 内容摘要 |
| `score` | number | 匹配分数（0-1） |
| `type` | string | 文件类型 |
| `meta` | FileMeta | 文件元数据 |

---

### 7. 搜索（POST）

执行复杂的搜索查询。

**端点**: `POST /api/search`

**请求体**:

```json
{
  "query": "folder-site",
  "scope": "content",
  "fileType": ["md", "txt"],
  "limit": 20,
  "offset": 0
}
```

**字段说明**:

| 字段 | 类型 | 必需 | 默认值 | 说明 |
|------|------|------|--------|------|
| `query` | string | 是 | - | 搜索关键词 |
| `scope` | string | 否 | all | 搜索范围 |
| `fileType` | string[] | 否 | [] | 文件类型过滤 |
| `limit` | number | 否 | 20 | 结果数量限制 |
| `offset` | number | 否 | 0 | 偏移量 |

**请求示例**:

```bash
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "folder-site",
    "scope": "content",
    "fileType": ["md"],
    "limit": 10
  }'
```

**响应**: 与 GET 搜索相同

---

### 8. 获取 Workhub 数据

获取 Workhub 结构的文档数据（ADR、Issues、PRs）。

**端点**: `GET /api/workhub`

**请求示例**:

```bash
curl http://localhost:3000/api/workhub
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "adr": [
      {
        "id": "001",
        "title": "Use Bun as Runtime",
        "status": "accepted",
        "date": "2024-01-20",
        "path": "docs/adr/001-use-bun-as-runtime.md",
        "content": "# Status\n\nAccepted\n\n## Context\n\n..."
      }
    ],
    "issues": [
      {
        "id": "001",
        "title": "Add dark mode support",
        "status": "open",
        "priority": "high",
        "assignee": "john",
        "path": "docs/issues/001-dark-mode.md",
        "content": "## Description\n\nAdd dark mode support..."
      }
    ],
    "pr": [
      {
        "id": "001",
        "title": "Fix search performance",
        "status": "merged",
        "author": "jane",
        "path": "docs/pr/001-fix-search.md",
        "content": "## Changes\n\nOptimized search algorithm..."
      }
    ],
    "stats": {
      "totalADRs": 1,
      "totalIssues": 1,
      "totalPRs": 1,
      "parseTime": 15
    }
  },
  "timestamp": 1705867200000
}
```

---

### 8.1 获取所有 ADR

获取所有架构决策记录（ADR）。

**端点**: `GET /api/workhub/adrs`

**请求示例**:

```bash
curl http://localhost:3000/api/workhub/adrs
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "adrs": [
      {
        "id": "001",
        "title": "Use Bun as Runtime",
        "status": "accepted",
        "date": "2024-01-20",
        "path": "docs/adr/001-use-bun-as-runtime.md",
        "content": "# Status\n\nAccepted\n\n## Context\n\n..."
      }
    ],
    "stats": {
      "totalADRs": 1,
      "parseTime": 5
    }
  },
  "timestamp": 1705867200000
}
```

---

### 8.2 获取指定 ADR

根据 ID 获取单个架构决策记录。

**端点**: `GET /api/workhub/adrs/:id`

**路径参数**:

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `id` | string | 是 | ADR ID（如 "001"）或路径（如 "adr/001-use-bun"） |

**请求示例**:

```bash
curl http://localhost:3000/api/workhub/adrs/001
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "id": "001",
    "title": "Use Bun as Runtime",
    "status": "accepted",
    "date": "2024-01-20",
    "path": "docs/adr/001-use-bun-as-runtime.md",
    "content": "# Status\n\nAccepted\n\n## Context\n\nWe need to choose a runtime for the application...",
    "metadata": {
      "author": "John Doe",
      "created": "2024-01-20",
      "updated": "2024-01-21"
    }
  },
  "timestamp": 1705867200000
}
```

**错误响应（未找到）**:

```json
{
  "success": false,
  "error": "ADR not found",
  "timestamp": 1705867200000
}
```

---

### 8.3 获取所有 Issues

获取所有 Issue。

**端点**: `GET /api/workhub/issues`

**请求示例**:

```bash
curl http://localhost:3000/api/workhub/issues
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "issues": [
      {
        "id": "001",
        "title": "Add dark mode support",
        "status": "open",
        "priority": "high",
        "assignee": "john",
        "labels": ["feature", "ui"],
        "path": "docs/issues/001-dark-mode.md",
        "content": "## Description\n\nAdd dark mode support..."
      }
    ],
    "stats": {
      "totalIssues": 1,
      "parseTime": 5
    }
  },
  "timestamp": 1705867200000
}
```

---

### 8.4 获取指定 Issue

根据 ID 获取单个 Issue。

**端点**: `GET /api/workhub/issues/:id`

**路径参数**:

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `id` | string | 是 | Issue ID（如 "001"）或路径（如 "issues/001"） |

**请求示例**:

```bash
curl http://localhost:3000/api/workhub/issues/001
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "id": "001",
    "title": "Add dark mode support",
    "status": "open",
    "priority": "high",
    "assignee": "john",
    "labels": ["feature", "ui"],
    "path": "docs/issues/001-dark-mode.md",
    "content": "## Description\n\nAdd dark mode support for better user experience...",
    "metadata": {
      "author": "Jane Doe",
      "created": "2024-01-22",
      "updated": "2024-01-22"
    }
  },
  "timestamp": 1705867200000
}
```

---

### 8.5 获取所有 PRs

获取所有 Pull Request。

**端点**: `GET /api/workhub/prs`

**请求示例**:

```bash
curl http://localhost:3000/api/workhub/prs
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "prs": [
      {
        "id": "001",
        "title": "Fix search performance",
        "status": "merged",
        "author": "jane",
        "reviewers": ["john"],
        "path": "docs/pr/001-fix-search.md",
        "content": "## Changes\n\nOptimized search algorithm to improve performance..."
      }
    ],
    "stats": {
      "totalPRs": 1,
      "parseTime": 5
    }
  },
  "timestamp": 1705867200000
}
```

---

### 8.6 获取指定 PR

根据 ID 获取单个 Pull Request。

**端点**: `GET /api/workhub/prs/:id`

**路径参数**:

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `id` | string | 是 | PR ID（如 "001"）或路径（如 "pr/001"） |

**请求示例**:

```bash
curl http://localhost:3000/api/workhub/prs/001
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "id": "001",
    "title": "Fix search performance",
    "status": "merged",
    "author": "jane",
    "reviewers": ["john"],
    "path": "docs/pr/001-fix-search.md",
    "content": "## Changes\n\nOptimized search algorithm to improve performance...",
    "metadata": {
      "created": "2024-01-21",
      "merged": "2024-01-22",
      "updated": "2024-01-22"
    }
  },
  "timestamp": 1705867200000
}
```

---

### 9. 导出文件

导出文件为指定格式。

**端点**: `POST /api/export`

**请求体**:

```json
{
  "format": "pdf",
  "paths": ["docs/README.md"],
  "recursive": false,
  "options": {
    "filename": "export.pdf",
    "includeToc": true,
    "includeCover": true,
    "customCss": ""
  }
}
```

**字段说明**:

| 字段 | 类型 | 必需 | 默认值 | 说明 |
|------|------|------|--------|------|
| `format` | string | 是 | - | 导出格式：pdf / html / markdown |
| `paths` | string[] | 是 | [] | 要导出的文件路径 |
| `recursive` | boolean | 否 | false | 是否包含子目录 |
| `options` | ExportOptions | 否 | - | 导出选项 |

**ExportOptions 字段说明**:

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `filename` | string | export | 文件名 |
| `includeToc` | boolean | true | 是否包含目录 |
| `includeCover` | boolean | true | 是否包含封面 |
| `customCss` | string | "" | 自定义 CSS |

**请求示例**:

```bash
curl -X POST http://localhost:3000/api/export \
  -H "Content-Type: application/json" \
  -d '{
    "format": "pdf",
    "paths": ["docs/README.md"],
    "options": {
      "filename": "my-docs.pdf",
      "includeToc": true
    }
  }'
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "downloadUrl": "/downloads/my-docs.pdf",
    "size": 102400,
    "mimeType": "application/pdf",
    "duration": 1500
  },
  "timestamp": 1705867200000
}
```

---

## 类型定义

### ApiError

```typescript
interface ApiError {
  code: string;      // 错误代码
  message: string;   // 错误消息
  details?: any;     // 错误详情
}
```

### ApiResponse

```typescript
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  timestamp: number;
}
```

### FileInfo

```typescript
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
```

### DirectoryTreeNode

```typescript
interface DirectoryTreeNode {
  name: string;
  path: string;
  relativePath: string;
  extension?: string;
  isDirectory: boolean;
  children?: DirectoryTreeNode[];
}
```

### FileMeta

```typescript
interface FileMeta {
  title: string;
  description?: string;
  tags?: string[];
  updated: string;
}
```

### SearchRequest

```typescript
interface SearchRequest {
  query: string;
  scope?: 'all' | 'titles' | 'content' | 'files';
  fileType?: string[];
  limit?: number;
  offset?: number;
}
```

### ExportRequest

```typescript
interface ExportRequest {
  format: 'pdf' | 'html' | 'markdown';
  paths?: string[];
  recursive?: boolean;
  options?: ExportOptions;
}

interface ExportOptions {
  filename?: string;
  includeToc?: boolean;
  includeCover?: boolean;
  customCss?: string;
}
```

---

## 错误处理

### 错误代码

| 代码 | 说明 |
|------|------|
| `INVALID_PARAMS` | 请求参数无效 |
| `FILE_NOT_FOUND` | 文件未找到 |
| `DIRECTORY_NOT_FOUND` | 目录未找到 |
| `MISSING_QUERY` | 缺少搜索关键词 |
| `INVALID_FORMAT` | 不支持的导出格式 |
| `INTERNAL_ERROR` | 内部服务器错误 |

### 错误响应示例

```json
{
  "success": false,
  "error": {
    "code": "FILE_NOT_FOUND",
    "message": "File not found: docs/nonexistent.md",
    "details": {
      "path": "docs/nonexistent.md"
    }
  },
  "timestamp": 1705867200000
}
```

---

## 代码示例

### JavaScript / TypeScript

```typescript
// 健康检查
async function healthCheck() {
  const response = await fetch('http://localhost:3000/api/health');
  const data = await response.json();
  console.log(data);
}

// 搜索文件
async function searchFiles(query: string) {
  const response = await fetch(`http://localhost:3000/api/search?q=${encodeURIComponent(query)}`);
  const data = await response.json();
  console.log(data.data.results);
}

// 获取文件内容
async function getFileContent(path: string) {
  const response = await fetch(`http://localhost:3000/api/files/${encodeURIComponent(path)}`);
  const data = await response.json();
  console.log(data.data.content);
}

// 导出文件
async function exportFiles(format: 'pdf' | 'html', paths: string[]) {
  const response = await fetch('http://localhost:3000/api/export', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ format, paths })
  });
  const data = await response.json();
  console.log(data.data.downloadUrl);
}
```

### Python

```python
import requests

BASE_URL = "http://localhost:3000/api"

# 健康检查
def health_check():
    response = requests.get(f"{BASE_URL}/health")
    return response.json()

# 搜索文件
def search_files(query):
    response = requests.get(f"{BASE_URL}/search", params={"q": query})
    return response.json()

# 获取文件内容
def get_file_content(path):
    response = requests.get(f"{BASE_URL}/files/{path}")
    return response.json()

# 导出文件
def export_files(format, paths):
    response = requests.post(f"{BASE_URL}/export", json={
        "format": format,
        "paths": paths
    })
    return response.json()
```

### curl

```bash
# 健康检查
curl http://localhost:3000/api/health

# 搜索
curl "http://localhost:3000/api/search?q=folder-site"

# 获取文件
curl "http://localhost:3000/api/files/docs/README.md"

# 导出
curl -X POST http://localhost:3000/api/export \
  -H "Content-Type: application/json" \
  -d '{"format":"pdf","paths":["docs/README.md"]}'
```

---

## 最佳实践

### 1. 错误处理

始终检查 `success` 字段，并妥善处理错误：

```typescript
async function safeApiRequest<T>(url: string, options?: RequestInit): Promise<T | null> {
  try {
    const response = await fetch(url, options);
    const result = await response.json();

    if (!result.success) {
      console.error('API Error:', result.error);
      return null;
    }

    return result.data as T;
  } catch (error) {
    console.error('Network Error:', error);
    return null;
  }
}
```

### 2. 请求节流

避免短时间内发送大量请求：

```typescript
class ApiClient {
  private queue: Array<() => Promise<any>> = [];
  private running = 0;
  private maxConcurrent = 5;

  async request(url: string, options?: RequestInit) {
    return new Promise((resolve, reject) => {
      const execute = async () => {
        this.running++;
        try {
          const result = await fetch(url, options);
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.running--;
          this.processQueue();
        }
      };

      this.queue.push(execute);
      this.processQueue();
    });
  }

  private processQueue() {
    if (this.running < this.maxConcurrent && this.queue.length > 0) {
      const next = this.queue.shift();
      if (next) next();
    }
  }
}
```

### 3. 缓存响应

缓存不经常变化的数据：

```typescript
class CachedApiClient {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private ttl = 60000; // 1 分钟

  async get(url: string) {
    const cached = this.cache.get(url);
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      return cached.data;
    }

    const response = await fetch(url);
    const result = await response.json();

    this.cache.set(url, { data: result, timestamp: Date.now() });
    return result;
  }
}
```

### 4. 分页处理

正确处理分页请求：

```typescript
async function getAllFiles(path: string, limit = 100) {
  const allFiles: any[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(
      `/api/files?path=${path}&limit=${limit}&offset=${offset}`
    );
    const result = await response.json();

    if (result.success && result.data.files.length > 0) {
      allFiles.push(...result.data.files);
      offset += limit;
      hasMore = result.data.files.length === limit;
    } else {
      hasMore = false;
    }
  }

  return allFiles;
}
```

### 5. 重试策略

为失败的请求实现指数退避重试：

```typescript
async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  maxRetries = 3,
  baseDelay = 1000
) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) {
        return response;
      }

      // 如果是客户端错误（4xx），不重试
      if (response.status >= 400 && response.status < 500) {
        throw new Error(`Client error: ${response.status}`);
      }
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;

      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new Error('Max retries exceeded');
}
```

### 6. 类型安全

使用 TypeScript 类型确保类型安全：

```typescript
import type {
  ApiResponse,
  FileInfo,
  SearchRequest,
  SearchResponse,
  FileContentResponse,
} from '../types/api';

async function searchFiles(query: string): Promise<SearchResponse> {
  const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
  const result = await response.json() as ApiResponse<SearchResponse>;

  if (!result.success) {
    throw new Error(result.error?.message || 'Search failed');
  }

  return result.data;
}
```

### 7. 请求超时

为请求设置超时：

```typescript
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout = 5000
) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}
```

### 8. 监控和日志

记录 API 调用用于监控：

```typescript
class MonitoredApiClient {
  async request(url: string, options?: RequestInit) {
    const startTime = Date.now();
    const requestId = crypto.randomUUID();

    console.log(`[${requestId}] Request: ${options?.method || 'GET'} ${url}`);

    try {
      const response = await fetch(url, options);
      const duration = Date.now() - startTime;

      console.log(`[${requestId}] Response: ${response.status} (${duration}ms)`);

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[${requestId}] Error: ${error} (${duration}ms)`);
      throw error;
    }
  }
}
```

---

## 下一步

- [使用指南](./USAGE.md) - 了解如何使用 CLI
- [故障排查](./TROUBLESHOOTING.md) - 解决常见问题
- [项目概述](./PROJECT_OVERVIEW.md) - 深入了解项目架构