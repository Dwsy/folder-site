# 搜索系统 v2 快速参考

## API 端点

### 工具状态

```bash
GET /api/search/v2/status
```

检查 fd 和 ripgrep 是否可用。

**响应**:
```json
{
  "success": true,
  "data": {
    "available": true,
    "tools": { "fd": true, "rg": true },
    "message": "All tools available"
  }
}
```

---

### 文件名搜索

```bash
GET /api/search/v2/files?q=<query>&limit=<n>&caseSensitive=<bool>&extensions=<ext1,ext2>&exclude=<dir1,dir2>
```

**参数**:
- `q`: 搜索查询（必需）
- `limit`: 最大结果数（默认 100）
- `caseSensitive`: 是否区分大小写（默认 false）
- `extensions`: 文件扩展名过滤（逗号分隔）
- `exclude`: 排除目录（逗号分隔，默认 node_modules,.git,dist,build）

**示例**:
```bash
# 搜索包含 "test" 的文件
curl "http://localhost:3008/api/search/v2/files?q=test"

# 搜索 TypeScript 文件
curl "http://localhost:3008/api/search/v2/files?q=search&extensions=.ts,.tsx"

# 搜索并限制结果数量
curl "http://localhost:3008/api/search/v2/files?q=package&limit=10"
```

---

### 内容搜索

```bash
GET /api/search/v2/content?q=<query>&limit=<n>&context=<n>&caseSensitive=<bool>&extensions=<ext1,ext2>&exclude=<dir1,dir2>
```

**参数**:
- `q`: 搜索查询（必需）
- `limit`: 最大结果数（默认 50）
- `context`: 上下文行数（默认 2）
- `caseSensitive`: 是否区分大小写（默认 false）
- `extensions`: 文件扩展名过滤（逗号分隔）
- `exclude`: 排除目录（逗号分隔，默认 node_modules,.git,dist,build）

**示例**:
```bash
# 搜索包含 "export" 的内容
curl "http://localhost:3008/api/search/v2/content?q=export"

# 搜索并显示上下文
curl "http://localhost:3008/api/search/v2/content?q=function&context=5"

# 搜索 TypeScript 文件
curl "http://localhost:3008/api/search/v2/content?q=interface&extensions=.ts,.tsx"
```

---

### 统一搜索

```bash
GET /api/search/v2?q=<query>&mode=<mode>&limit=<n>&context=<n>&caseSensitive=<bool>&extensions=<ext1,ext2>&exclude=<dir1,dir2>
```

**参数**:
- `q`: 搜索查询（必需）
- `mode`: 搜索模式（filename/content/auto，默认 auto）
- 其他参数同文件名搜索和内容搜索

**示例**:
```bash
# 自动模式（同时搜索文件名和内容）
curl "http://localhost:3008/api/search/v2?q=search&mode=auto"

# 仅搜索文件名
curl "http://localhost:3008/api/search/v2?q=search&mode=filename"

# 仅搜索内容
curl "http://localhost:3008/api/search/v2?q=search&mode=content"
```

---

### POST 搜索

```bash
POST /api/search/v2
Content-Type: application/json

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

**示例**:
```bash
curl -X POST "http://localhost:3008/api/search/v2" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "test",
    "mode": "content",
    "options": {
      "limit": 10,
      "extensions": [".ts", ".tsx"]
    }
  }'
```

---

### 缓存管理

#### 获取缓存统计

```bash
GET /api/search/v2/cache/stats
```

**响应**:
```json
{
  "success": true,
  "data": {
    "size": 5,
    "maxSize": 200,
    "ttl": 60000,
    "calculatedSize": 0
  }
}
```

#### 清空缓存

```bash
POST /api/search/v2/cache/clear
```

**响应**:
```json
{
  "success": true,
  "data": {
    "message": "Cache cleared successfully"
  }
}
```

---

## 前端组件

### SearchModalV2

```tsx
import { SearchModalV2, SearchTriggerV2 } from './components/search/index.js';

function App() {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <SearchTriggerV2 onClick={() => setSearchOpen(true)} />

      <SearchModalV2
        open={searchOpen}
        onOpenChange={setSearchOpen}
        activePath={location.pathname}
        onSelect={(item) => {
          // 处理结果选择
          navigate(`/file/${item.path}`);
        }}
      />
    </>
  );
}
```

### 快捷键

| 快捷键 | 功能 |
|--------|------|
| ⌘K / Ctrl+K | 打开搜索 |
| ↑↓ | 导航结果 |
| Enter | 选择结果 |
| Tab | 切换搜索模式 |
| Esc | 关闭搜索 |

---

## 常见用例

### 搜索特定文件类型

```bash
# 搜索 Markdown 文件
curl "http://localhost:3008/api/search/v2?q=README&extensions=.md,.markdown"

# 搜索 TypeScript 文件
curl "http://localhost:3008/api/search/v2?q=interface&extensions=.ts,.tsx"

# 搜索配置文件
curl "http://localhost:3008/api/search/v2?q=config&extensions=.json,.yaml,.yml"
```

### 搜索代码内容

```bash
# 搜索函数定义
curl "http://localhost:3008/api/search/v2/content?q=export function"

# 搜索类定义
curl "http://localhost:3008/api/search/v2/content?q=class.*extends"

# 搜索注释
curl "http://localhost:3008/api/search/v2/content?q=TODO|FIXME"
```

### 排除特定目录

```bash
# 排除测试目录
curl "http://localhost:3008/api/search/v2?q=test&exclude=tests,__tests__,test"

# 排除构建目录
curl "http://localhost:3008/api/search/v2?q=build&exclude=dist,build,out"
```

---

## 性能优化建议

### 1. 使用缓存

相同查询会自动缓存 60 秒，重复查询速度提升 4-6x。

### 2. 限制结果数量

```bash
# 限制结果数量以减少响应时间
curl "http://localhost:3008/api/search/v2?q=test&limit=20"
```

### 3. 使用文件扩展名过滤

```bash
# 只搜索特定类型的文件
curl "http://localhost:3008/api/search/v2?q=search&extensions=.ts,.tsx"
```

### 4. 选择合适的搜索模式

- **filename**: 只搜索文件名（最快）
- **content**: 只搜索内容（较慢）
- **auto**: 同时搜索两者（中等）

---

## 故障排查

### 问题：工具不可用

**症状**:
```json
{
  "available": false,
  "tools": { "fd": false, "rg": false }
}
```

**解决方法**:
1. 工具会自动下载，等待几秒后重试
2. 或手动安装：
   ```bash
   # macOS
   brew install fd ripgrep

   # Linux
   sudo apt install fd-find ripgrep
   ```

### 问题：搜索速度慢

**解决方法**:
1. 减小 `limit` 参数
2. 使用 `extensions` 参数缩小搜索范围
3. 使用 `exclude` 参数排除不需要的目录
4. 优先使用 `filename` 模式

### 问题：找不到文件

**解决方法**:
1. 检查是否被 `.gitignore` 排除
2. 使用 `hidden=true` 包含隐藏文件
3. 检查 `excludeDirs` 配置

---

## 响应格式

### 成功响应

```json
{
  "success": true,
  "data": {
    "fileResults": [...],
    "contentResults": [...],
    "total": 100,
    "duration": 42,
    "query": "search",
    "mode": "auto"
  },
  "timestamp": 1769230803108
}
```

### 错误响应

```json
{
  "success": false,
  "error": {
    "code": "SEARCH_ERROR",
    "message": "Search failed: ..."
  },
  "timestamp": 1769230803108
}
```

---

## 相关文档

- [搜索系统 v2 文档](./SEARCH_V2.md)
- [搜索系统升级总结](./SEARCH_UPGRADE_SUMMARY.md)
- [测试报告](./SEARCH_V2_TEST_REPORT.md)