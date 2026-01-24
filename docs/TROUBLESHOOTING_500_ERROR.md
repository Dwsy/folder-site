# 🔧 修复 500 错误指南

## 问题描述

浏览器显示以下错误：
```
GET http://localhost:3010/api/files/tree/list net::ERR_ABORTED 500 (Internal Server Error)
```

## 问题原因

浏览器正在尝试访问 **3010 端口**，但服务器实际运行在 **3008 端口**。

## 解决方案

### 方案 1：清除浏览器缓存（推荐）

1. **Chrome/Edge**:
   - 按 `Cmd+Shift+Delete` (Mac) 或 `Ctrl+Shift+Delete` (Windows/Linux)
   - 选择"缓存的图片和文件"
   - 点击"清除数据"

2. **Firefox**:
   - 按 `Cmd+Shift+Delete` (Mac) 或 `Ctrl+Shift+Delete` (Windows/Linux)
   - 选择"缓存"
   - 点击"立即清除"

3. **Safari**:
   - 按 `Cmd+Option+E`
   - 或者 Safari > 偏好设置 > 高级 > 显示开发菜单
   - 开发 > 清空缓存

### 方案 2：使用无痕模式

1. **Chrome/Edge**: `Cmd+Shift+N` (Mac) 或 `Ctrl+Shift+N` (Windows/Linux)
2. **Firefox**: `Cmd+Shift+P` (Mac) 或 `Ctrl+Shift+P` (Windows/Linux)
3. **Safari**: `Cmd+Shift+N`

然后访问 `http://localhost:3008`

### 方案 3：直接访问正确的端口

在浏览器地址栏输入：
```
http://localhost:3008
```

**不要使用** `http://localhost:3010`

### 方案 4：重启服务器

1. 停止所有旧的服务器：
   ```bash
   bun ~/.pi/agent/skills/tmux/lib.ts cleanup 1
   ```

2. 启动新的服务器：
   ```bash
   bun run dev
   ```

3. 访问 `http://localhost:3008`

## 验证修复

打开浏览器开发者工具（F12），查看 Network 标签：

✅ **正确**：请求应该发送到 `http://localhost:3008/api/...`  
❌ **错误**：请求发送到 `http://localhost:3010/api/...`

## 开发模式

如果你需要同时开发前端和后端：

### 终端 1：启动后端
```bash
bun run dev
```
服务器将在 `http://localhost:3008` 运行

### 终端 2：启动前端开发服务器（可选）
```bash
bun run dev:client
```
前端开发服务器将在 `http://localhost:3011` 运行，并自动代理 API 请求到 3008 端口

然后访问 `http://localhost:3011`（前端开发服务器）

## 生产模式

如果只需要使用应用（不开发）：

```bash
bun run dev
```

然后访问 `http://localhost:3008`

## 诊断工具

运行诊断脚本检查系统状态：

```bash
bash scripts/diagnose.sh
```

这将显示：
- 端口占用情况
- tmux 会话状态
- API 健康状态
- 文件树 API 状态

## 常见问题

### Q: 为什么浏览器访问 3010 端口？

A: 可能的原因：
1. 浏览器缓存了旧的配置
2. 你之前在 3010 端口运行过服务器
3. 浏览器书签或历史记录中保存了 3010 端口

**解决方法**：清除浏览器缓存或使用无痕模式

### Q: 如何确认服务器正在运行？

A: 运行以下命令：
```bash
curl http://localhost:3008/api/health
```

应该返回：
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": 1769231605674
  }
}
```

### Q: 如何查看服务器日志？

A: 如果使用 tmux 启动的服务器：
```bash
bun ~/.pi/agent/skills/tmux/lib.ts list
bun ~/.pi/agent/skills/tmux/lib.ts capture <session-id>
```

或者直接在终端运行：
```bash
bun run dev
```

### Q: 端口被占用怎么办？

A: 查找占用端口的进程：
```bash
lsof -i :3008
```

杀死进程：
```bash
kill -9 <PID>
```

或者使用不同的端口：
```bash
PORT=3009 bun run dev
```

## 需要帮助？

如果问题仍然存在，请提供以下信息：

1. 运行诊断脚本的输出：
   ```bash
   bash scripts/diagnose.sh > diagnosis.txt
   ```

2. 浏览器控制台的完整错误信息（F12 > Console）

3. 服务器日志

4. 操作系统和浏览器版本
