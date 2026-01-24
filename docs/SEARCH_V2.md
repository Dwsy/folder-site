# 搜索系统 v2 - 使用 fd 和 ripgrep

## 概述

搜索系统 v2 使用 `fd` 和 `ripgrep (rg)` 进行高性能的文件和内容搜索。这些工具会自动下载和管理，无需手动安装。

## 工具管理

### 自动下载

当首次使用搜索功能时，系统会自动检查并下载必要的工具：

- **fd**: 用于文件名搜索
- **ripgrep (rg)**: 用于内容搜索

工具会被下载到 `~/.folder-site/bin/` 目录。

### 检查工具状态

```bash
curl http://localhost:3000/api/search/v2/status
```

响应示例：
```json
{
  "success": true,
  "data": {
    "available": true,
    "tools": {
      "fd": true,
      "rg": true
    },
    "message": "All tools available"
  },
  "timestamp": 1706123456789
}
```

## API 端点

### 1. 文件名搜索

**端点:** `GET /api/search/v2/files`

**参数:**
- `q` (必需): 搜索查询
- `limit` (可选): 最大结果数，默认 100
- `hidden` (可选): 是否包含隐藏文件，默认 false
- `caseSensitive` (可选): 是否区分大小写，默认 false
- `extensions` (可选): 文件扩展名过滤，逗号分隔
- `exclude` (可选): 排除目录，逗号分隔，默认 "node_modules,.git,dist,build"

**示例:**
```bash
# 搜索包含 "test" 的文件
curl "http://localhost:3000/api/search/v2/files?q=test"

# 搜索 TypeScript 文件
curl "http://localhost:3000/api/search/v2/files?q=test&extensions=.ts,.tsx"

# 搜索包含 "test" 的文件，不区分大小写
curl "http://localhost:3000/api/search/v2/files?q=test&caseSensitive=false"

# 搜索包含隐藏文件
curl "http://localhost:3000/api/search/v2/files?q=test&hidden=true"
```

**响应示例:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "path": "src/utils/test.ts",
        "name": "test.ts",
        "type": "file",
        "score": 0.8
      }
    ],
    "total": 1,
    "duration": 45
  },
  "timestamp": 1706123456789
}
```

---

### 2. 内容搜索

**端点:** `GET /api/search/v2/content`

**参数:**
- `q` (必需): 搜索查询
- `limit` (可选): 最大结果数，默认 50
- `hidden` (可选): 是否包含隐藏文件，默认 false
- `caseSensitive` (可选): 是否区分大小写，默认 false
- `context` (可选): 上下文行数，默认 2
- `extensions` (可选): 文件扩展名过滤，逗号分隔
- `exclude` (可选): 排除目录，逗号分隔，默认 "node_modules,.git,dist,build"

**示例:**
```bash
# 搜索包含 "function" 的内容
curl "http://localhost:3000/api/search/v2/content?q=function"

# 搜索 TypeScript 文件中的 "function"
curl "http://localhost:3000/api/search/v2/content?q=function&extensions=.ts,.tsx"

# 搜索包含 5 行上下文
curl "http://localhost:3000/api/search/v2/content?q=function&context=5"

# 搜索区分大小写
curl "http://localhost:3000/api/search/v2/content?q=Function&caseSensitive=true"
```

**响应示例:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "path": "src/utils/helper.ts",
        "name": "helper.ts",
        "matches": [
          {
            "lineNumber": 10,
            "line": "export function helper() {",
            "submatches": [
              {
                "match": "function",
                "start": 7,
                "end": 15
              }
            ]
          }
        ]
      }
    ],
    "total": 1,
    "duration": 123
  },
  "timestamp": 1706123456789
}
```

---

### 3. 统一搜索

**端点:** `GET /api/search/v2`

**参数:**
- `q` (必需): 搜索查询
- `mode` (可选): 搜索模式，可选值 `filename`、`content`、`auto`（默认）
- 其他参数同文件名搜索和内容搜索

**示例:**
```bash
# 自动模式（同时搜索文件名和内容）
curl "http://localhost:3000/api/search/v2?q=test"

# 仅搜索文件名
curl "http://localhost:3000/api/search/v2?q=test&mode=filename"

# 仅搜索内容
curl "http://localhost:3000/api/search/v2?q=test&mode=content"
```

**响应示例:**
```json
{
  "success": true,
  "data": {
    "fileResults": [
      {
        "path": "test.ts",
        "name": "test.ts",
        "type": "file",
        "score": 1.0
      }
    ],
    "contentResults": [
      {
        "path": "src/utils/helper.ts",
        "name": "helper.ts",
        "matches": [
          {
            "lineNumber": 10,
            "line": "export function test() {",
            "submatches": [
              {
                "match": "test",
                "start": 16,
                "end": 20
              }
            ]
          }
        ]
      }
    ],
    "total": 2,
    "duration": 168,
    "query": "test",
    "mode": "auto"
  },
  "timestamp": 1706123456789
}
```

---

### 4. POST 搜索

**端点:** `POST /api/search/v2`

**请求体:**
```json
{
  "query": "test",
  "mode": "auto",
  "options": {
    "limit": 50,
    "hidden": false,
    "caseSensitive": false,
    "context": 2,
    "extensions": [".ts", ".tsx"],
    "excludeDirs": ["node_modules", ".git"]
  }
}
```

**示例:**
```bash
curl -X POST "http://localhost:3000/api/search/v2" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "test",
    "mode": "auto",
    "options": {
      "limit": 50,
      "extensions": [".ts", ".tsx"]
    }
  }'
```

---

## 性能优化

### 缓存

内容搜索结果会被缓存，重复查询会更快返回。

### 并行搜索

在 `auto` 模式下，文件名搜索和内容搜索会并行执行。

### 结果限制

默认限制：
- 文件名搜索：100 条
- 内容搜索：50 条

可以通过 `limit` 参数调整。

---

## 与 v1 的区别

| 特性 | v1 (Fuse.js) | v2 (fd + rg) |
|------|-------------|-------------|
| 文件名搜索 | ✅ | ✅ |
| 内容搜索 | ❌ | ✅ |
| 性能 | 中等 | 高 |
| 索引构建 | 需要 | 不需要 |
| 外部依赖 | 无 | fd + rg |
| 实时性 | 需要刷新索引 | 实时 |

---

## 故障排查

### 工具下载失败

如果工具下载失败，可以手动安装：

```bash
# macOS
brew install fd ripgrep

# Linux (Ubuntu/Debian)
sudo apt install fd-find ripgrepgrep

# Windows
# 使用 Scoop 或 Chocolatey 安装
scoop install fd ripgrep
```

### 搜索速度慢

1. 减小搜索范围（使用 `extensions` 和 `exclude` 参数）
2. 减小结果数量（使用 `limit` 参数）
3. 使用 `filename` 模式而不是 `auto` 模式

### 找不到文件

1. 检查是否被 `.gitignore` 排除
2. 使用 `hidden=true` 包含隐藏文件
3. 检查 `excludeDirs` 配置

---

## 未来改进

- [ ] 添加搜索历史记录
- [ ] 支持正则表达式搜索
- [ ] 添加搜索建议
- [ ] 支持模糊搜索
- [ ] 添加搜索结果高亮
- [ ] 支持搜索结果导出

---

## 参考

- [fd GitHub](https://github.com/sharkdp/fd)
- [ripgrep GitHub](https://github.com/BurntSushi/ripgrep)
- [pi-mono tools-manager](https://github.com/badlogic/pi-mono)