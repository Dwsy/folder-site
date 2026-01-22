# API 文档

本文档介绍 Folder-Site CLI 的 API 接口、请求/响应格式和使用示例。

## 目录

- [API 概览](#api-概览)
- [通用响应格式](#通用响应格式)
- [端点说明](#端点说明)
- [类型定义](#类型定义)
- [代码示例](#代码示例)
- [错误处理](#错误处理)

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
| `/api/files/:path` | GET | 获取文件内容 |
| `/api/search` | GET | 执行搜索 |
| `/api/search` | POST | 执行复杂搜索 |
| `/api/workhub` | GET | 获取 Workhub 数据 |
| `/api/export` | POST | 导出文件 |

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

**端点**: `GET /api/files/:path`

**路径参数**:

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `path` | string | 是 | 文件相对路径 |

**查询参数**:

| 参数 | 类型 | 必需 | 默认值 | 说明 |
|------|------|------|--------|------|
| `render` | boolean | 否 | true | 是否渲染为 HTML |

**请求示例**:

```bash
curl "http://localhost:3000/api/files/docs/README.md?render=true"
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

获取 Workhub 结构的文档数据。

**端点**: `GET /api/workhub`

**查询参数**:

| 参数 | 类型 | 必需 | 默认值 | 说明 |
|------|------|------|--------|------|
| `type` | string | 否 | all | 类型：all / adr / issues / pr |

**请求示例**:

```bash
curl "http://localhost:3000/api/workhub?type=adr"
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
        "path": "docs/adr/001-use-bun-as-runtime.md"
      }
    ],
    "issues": [],
    "pr": []
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

## 下一步

- [使用指南](./USAGE.md) - 了解如何使用 CLI
- [故障排查](./TROUBLESHOOTING.md) - 解决常见问题
- [项目概述](./PROJECT_OVERVIEW.md) - 深入了解项目架构