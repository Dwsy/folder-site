# 搜索路径修复

## 问题描述

### 错误现象

点击搜索结果后，浏览器跳转到错误的 URL：

```
❌ 错误：http://localhost:3008/file/Users/dengwenyu/Dev/AI/folder-site/docs/reports/PROJECT_COMPLETION_REPORT_FINAL.md
```

应该是：

```
✅ 正确：http://localhost:3008/file/docs/reports/PROJECT_COMPLETION_REPORT_FINAL.md
```

### 根本原因

搜索服务（`search-service.ts`）返回的路径是**绝对路径**，而不是相对于项目根目录的**相对路径**。

---

## 修复内容

### 1. 文件名搜索路径修复

**修改文件**: `src/server/services/search-service.ts`

**修改前**:
```typescript
return lines.map((path) => {
  const relativePath = path.replace(rootDir + '/', '');
  const name = path.split('/').pop() || path;

  return {
    path: relativePath,
    name,
    type: 'file',
    score: calculateScore(query, name),
  };
});
```

**修改后**:
```typescript
return lines.map((absolutePath) => {
  // 转换为相对路径
  const relativePath = absolutePath.startsWith(rootDir)
    ? absolutePath.slice(rootDir.length + 1)
    : absolutePath;
  const name = relativePath.split('/').pop() || relativePath;

  return {
    path: relativePath,
    name,
    type: 'file',
    score: calculateScore(query, name),
  };
});
```

**改进点**:
- 使用 `startsWith()` 检查路径是否以 rootDir 开头
- 使用 `slice()` 而不是 `replace()` 来移除前缀
- 更健壮的路径处理

---

### 2. 内容搜索路径修复

**修改文件**: `src/server/services/search-service.ts`

**修改前**:
```typescript
function parseRipgrepOutput(lines: string[]): ContentSearchResult[] {
  const results: Map<string, ContentSearchResult> = new Map();

  for (const line of lines) {
    try {
      const data = JSON.parse(line);

      if (data.type === 'begin') {
        const path = data.data.path.text;
        results.set(path, {
          path,
          name: path.split('/').pop() || path,
          matches: [],
        });
      }
      // ...
    }
  }

  return Array.from(results.values());
}
```

**修改后**:
```typescript
function parseRipgrepOutput(lines: string[], rootDir: string = process.cwd()): ContentSearchResult[] {
  const results: Map<string, ContentSearchResult> = new Map();

  for (const line of lines) {
    try {
      const data = JSON.parse(line);

      if (data.type === 'begin') {
        const absolutePath = data.data.path.text;
        // 转换为相对路径
        const relativePath = absolutePath.startsWith(rootDir)
          ? absolutePath.slice(rootDir.length + 1)
          : absolutePath;
        
        results.set(absolutePath, {
          path: relativePath,
          name: relativePath.split('/').pop() || relativePath,
          matches: [],
        });
      }
      // ...
    }
  }

  return Array.from(results.values());
}
```

**改进点**:
- 添加 `rootDir` 参数
- 将绝对路径转换为相对路径
- 保持内部 Map 使用绝对路径作为键（避免冲突）
- 返回结果使用相对路径

---

## 测试验证

### 测试文件

创建了新的测试文件：`tests/search-path-format.test.ts`

### 测试用例

1. **文件搜索路径格式测试**
   - 验证路径不以 `/` 开头
   - 验证路径不包含绝对路径标识（如 `/Users/`）
   - 验证路径是相对路径格式

2. **内容搜索路径格式测试**
   - 验证路径不以 `/` 开头
   - 验证路径不包含绝对路径标识
   - 验证路径是相对路径格式

3. **统一搜索路径格式测试**
   - 验证文件搜索结果路径格式
   - 验证内容搜索结果路径格式

4. **前端路由兼容性测试**
   - 验证路径可以正确构建前端 URL
   - 验证 URL 不包含双斜杠
   - 验证 URL 格式正确

### 测试结果

```bash
bun test tests/search-path-format.test.ts
```

```
✅ 4 pass
❌ 0 fail
1539 expect() calls
```

---

## API 响应示例

### 文件搜索

**请求**:
```bash
curl "http://localhost:3008/api/search/v2/files?q=PROJECT&limit=3"
```

**响应**:
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "path": "docs/reports/PROJECT_COMPLETION_REPORT_FINAL.md",
        "name": "PROJECT_COMPLETION_REPORT_FINAL.md",
        "type": "file",
        "score": 0.8
      }
    ]
  }
}
```

✅ 路径是相对路径：`docs/reports/PROJECT_COMPLETION_REPORT_FINAL.md`

---

### 内容搜索

**请求**:
```bash
curl "http://localhost:3008/api/search/v2/content?q=export&limit=3"
```

**响应**:
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "path": "src/client/router/RouteGuard.tsx",
        "name": "RouteGuard.tsx",
        "matches": [...]
      }
    ]
  }
}
```

✅ 路径是相对路径：`src/client/router/RouteGuard.tsx`

---

## 前端路由

### 正确的 URL 格式

```typescript
// SearchModalV2.tsx
navigate(`/file/${item.path}`);
```

**示例**:
- 输入路径：`docs/reports/PROJECT_COMPLETION_REPORT_FINAL.md`
- 生成 URL：`/file/docs/reports/PROJECT_COMPLETION_REPORT_FINAL.md`
- 完整 URL：`http://localhost:3008/file/docs/reports/PROJECT_COMPLETION_REPORT_FINAL.md`

✅ 正确！

---

## 影响范围

### 修改的文件

1. `src/server/services/search-service.ts` - 搜索服务
2. `tests/search-path-format.test.ts` - 新增测试

### 影响的功能

- ✅ 文件名搜索
- ✅ 内容搜索
- ✅ 统一搜索
- ✅ 前端路由跳转

### 向后兼容性

✅ **完全兼容** - 只是修复了路径格式，不影响现有功能

---

## 部署步骤

1. **重新构建前端**:
   ```bash
   bun run build:client
   ```

2. **重启服务器**:
   ```bash
   bun run dev
   ```

3. **清除浏览器缓存**（重要！）

4. **测试搜索功能**:
   - 打开搜索（⌘K / Ctrl+K）
   - 搜索任意内容
   - 点击结果
   - 验证 URL 格式正确

---

## 验证清单

- [x] 文件搜索返回相对路径
- [x] 内容搜索返回相对路径
- [x] 统一搜索返回相对路径
- [x] 前端路由跳转正确
- [x] URL 格式正确
- [x] 测试全部通过
- [x] 向后兼容

---

## 相关文档

- [搜索系统 v2 文档](./SEARCH_V2.md)
- [快速参考](./SEARCH_V2_QUICKREF.md)
- [测试报告](./SEARCH_V2_TEST_REPORT.md)

---

**修复日期**: 2025-01-24  
**状态**: ✅ 已修复并测试通过