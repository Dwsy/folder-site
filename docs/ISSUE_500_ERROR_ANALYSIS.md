# 500 错误问题分析和解决方案

## 问题分析

### 错误信息
```
GET http://localhost:3010/api/files/tree/list net::ERR_ABORTED 500 (Internal Server Error)
```

### 根本原因

**浏览器正在访问错误的端口（3010），而服务器实际运行在 3008 端口。**

### 诊断结果

运行 `bash scripts/diagnose.sh` 显示：

- ✅ 后端服务器在 **3008 端口**正常运行
- ❌ **3010 端口**没有服务器
- ✅ API 在 3008 端口正常响应
- ❌ API 在 3010 端口无响应

### 可能的原因

1. **浏览器缓存**：浏览器缓存了旧的配置，记住了 3010 端口
2. **书签/历史记录**：浏览器书签或历史记录中保存了 3010 端口的 URL
3. **旧的标签页**：浏览器中打开了一个旧的标签页，仍然指向 3010 端口
4. **Service Worker**：如果应用使用了 Service Worker，可能缓存了旧的配置

---

## 解决方案

### 🚀 快速修复（推荐）

运行快速修复脚本：

```bash
bash scripts/quick-fix.sh
```

这将自动：
1. 清理旧的 tmux 会话
2. 检查并释放端口
3. 启动新的服务器
4. 测试 API

然后：
1. **清除浏览器缓存**（重要！）
2. 访问 `http://localhost:3008`

---

### 📋 手动修复步骤

#### 步骤 1：清理旧会话

```bash
bun ~/.pi/agent/skills/tmux/lib.ts cleanup 1
```

#### 步骤 2：启动服务器

```bash
bun run dev
```

服务器将在 `http://localhost:3008` 启动

#### 步骤 3：清除浏览器缓存

**Chrome/Edge**:
- 按 `Cmd+Shift+Delete` (Mac) 或 `Ctrl+Shift+Delete` (Windows/Linux)
- 选择"缓存的图片和文件"
- 点击"清除数据"

**或者使用无痕模式**:
- `Cmd+Shift+N` (Mac) 或 `Ctrl+Shift+N` (Windows/Linux)

#### 步骤 4：访问正确的 URL

在浏览器中访问：
```
http://localhost:3008
```

**不要访问** `http://localhost:3010`

---

### 🔍 验证修复

打开浏览器开发者工具（F12），查看 Network 标签：

✅ **正确**：
```
GET http://localhost:3008/api/files/tree/list
Status: 200 OK
```

❌ **错误**：
```
GET http://localhost:3010/api/files/tree/list
Status: 500 Internal Server Error
```

---

## 预防措施

### 1. 使用正确的端口

始终访问 `http://localhost:3008`，不要使用其他端口。

### 2. 清除旧的书签

如果你有指向 3010 端口的书签，请删除或更新它们。

### 3. 定期清理 tmux 会话

```bash
bun ~/.pi/agent/skills/tmux/lib.ts cleanup 1
```

### 4. 使用诊断工具

定期运行诊断脚本检查系统状态：

```bash
bash scripts/diagnose.sh
```

---

## 开发模式说明

### 仅后端开发

```bash
bun run dev
```

访问 `http://localhost:3008`

### 前端 + 后端开发

**终端 1**（后端）:
```bash
bun run dev
```

**终端 2**（前端）:
```bash
bun run dev:client
```

访问 `http://localhost:3011`（前端开发服务器会自动代理 API 请求到 3008）

---

## 端口说明

| 端口 | 用途 | 何时使用 |
|------|------|---------|
| 3008 | 后端服务器 | 生产模式，或仅后端开发 |
| 3011 | 前端开发服务器 | 前端开发（带热重载） |
| 3010 | ❌ 不使用 | 旧配置，应该避免 |

---

## 故障排除

### 问题：清除缓存后仍然访问 3010

**解决方法**：
1. 完全关闭浏览器（不只是关闭标签页）
2. 重新打开浏览器
3. 使用无痕模式
4. 尝试不同的浏览器

### 问题：端口 3008 被占用

**解决方法**：
```bash
# 查找占用端口的进程
lsof -i :3008

# 杀死进程
kill -9 <PID>

# 或者使用不同的端口
PORT=3009 bun run dev
```

### 问题：API 返回 500 错误（在正确的端口）

**解决方法**：
1. 查看服务器日志
2. 检查文件权限
3. 确保所有依赖已安装：`bun install`
4. 重新构建：`bun run build:client`

---

## 相关文档

- [故障排除指南](./TROUBLESHOOTING_500_ERROR.md)
- [搜索系统 v2 文档](./SEARCH_V2.md)
- [快速参考](./SEARCH_V2_QUICKREF.md)

---

## 需要帮助？

如果问题仍然存在，请提供：

1. 诊断脚本输出：
   ```bash
   bash scripts/diagnose.sh > diagnosis.txt
   ```

2. 浏览器控制台错误（F12 > Console）

3. 服务器日志

4. 操作系统和浏览器版本

---

**最后更新**: 2025-01-24  
**状态**: ✅ 已解决