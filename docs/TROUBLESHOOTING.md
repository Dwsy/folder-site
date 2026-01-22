# 故障排查指南

本指南帮助你诊断和解决 Folder-Site CLI 使用过程中遇到的常见问题。

## 目录

- [常见错误](#常见错误)
- [启动问题](#启动问题)
- [性能问题](#性能问题)
- [文件监听问题](#文件监听问题)
- [搜索问题](#搜索问题)
- [导出问题](#导出问题)
- [浏览器问题](#浏览器问题)
- [获取帮助](#获取帮助)

---

## 常见错误

### 错误 1: Port already in use

**错误信息**:
```
Error: listen EADDRINUSE: address already in use :::3000
```

**原因**: 端口 3000 已被其他进程占用。

**解决方案**:

```bash
# 方案一：使用其他端口
folder-site --port 3001

# 方案二：查找并终止占用端口的进程
# macOS/Linux
lsof -ti:3000 | xargs kill -9

# Windows (PowerShell)
netstat -ano | findstr :3000
taskkill /PID <进程ID> /F

# 方案三：终止所有 node/bun 进程
pkill -f "node|bun"
```

---

### 错误 2: Command not found

**错误信息**:
```
command not found: folder-site
```

**原因**: Folder-Site CLI 未正确安装或未添加到 PATH。

**解决方案**:

```bash
# 检查是否已安装
which folder-site  # macOS/Linux
where folder-site  # Windows

# 如果未安装，重新安装
bun install -g folder-site

# 检查 PATH
echo $PATH  # macOS/Linux
echo %PATH%  # Windows

# 手动添加到 PATH（如果需要）
export PATH="$HOME/.bun/bin:$PATH"
echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.bashrc
```

---

### 错误 3: Permission denied

**错误信息**:
```
Error: EACCES: permission denied
```

**原因**: 缺少文件或目录的读写权限。

**解决方案**:

```bash
# 方案一：修改文件权限
chmod +x dist/cli/index.js

# 方案二：使用 sudo（不推荐）
sudo folder-site

# 方案三：修复 npm 全局目录权限
mkdir -p ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH
```

---

### 错误 4: Module not found

**错误信息**:
```
Error: Cannot find module 'xxx'
```

**原因**: 依赖未正确安装或 node_modules 损坏。

**解决方案**:

```bash
# 清理并重新安装依赖
rm -rf node_modules bun.lockb package-lock.json
bun install

# 或使用 npm
rm -rf node_modules package-lock.json
npm install

# 清理缓存
bun pm cache rm
# 或
npm cache clean --force
```

---

### 错误 5: File not found

**错误信息**:
```
Error: ENOENT: no such file or directory
```

**原因**: 指定的文件或目录不存在。

**解决方案**:

```bash
# 检查文件是否存在
ls -la /path/to/file

# 检查当前工作目录
pwd

# 使用正确的路径
folder-site /correct/path/to/docs

# 检查文件权限
ls -l /path/to/file
```

---

## 启动问题

### 问题 1: 服务启动失败

**症状**: 执行 `folder-site` 后服务未启动。

**诊断步骤**:

```bash
# 1. 检查版本
folder-site --version

# 2. 检查 Bun 版本
bun --version

# 3. 检查端口占用
lsof -i:3000

# 4. 查看详细错误
folder-site --verbose
```

**解决方案**:

```bash
# 尝试重新安装
bun remove -g folder-site
bun install -g folder-site

# 或从源码重新构建
cd folder-site
rm -rf dist node_modules
bun install
bun run build
bun link
```

---

### 问题 2: 服务启动缓慢

**症状**: 启动时间超过 10 秒。

**原因**:
- 文件数量过多
- 文件监听初始化慢
- 缓存未启用

**解决方案**:

```bash
# 1. 启用缓存
cat > .folder-siterc.json << 'EOF'
{
  "cache": {
    "enabled": true,
    "ttl": 3600000
  }
}
EOF

# 2. 忽略不必要的目录
cat > .folder-siterc.json << 'EOF'
{
  "watcher": {
    "enabled": true,
    "ignore": [
      "node_modules",
      ".git",
      "dist",
      "build",
      ".next"
    ]
  }
}
EOF

# 3. 减少初始加载的文件
folder-site --port 3000
```

---

### 问题 3: 服务自动停止

**症状**: 服务启动后自动停止。

**诊断步骤**:

```bash
# 1. 检查错误日志
folder-site 2>&1 | tee error.log

# 2. 检查系统资源
top  # macOS/Linux
tasklist  # Windows

# 3. 检查端口冲突
lsof -i:3000
```

**解决方案**:

```bash
# 增加文件监听限制
ulimit -n 65536

# 使用 nohup 在后台运行
nohup folder-site > server.log 2>&1 &

# 使用 pm2 管理
pm2 start "folder-site" --name folder-site
```

---

## 性能问题

### 问题 1: 页面加载缓慢

**症状**: 打开文件或切换页面需要很长时间。

**原因**:
- 文件过大
- 渲染耗时
- 未启用缓存

**解决方案**:

```bash
# 1. 启用缓存
cat > .folder-siterc.json << 'EOF'
{
  "cache": {
    "enabled": true,
    "ttl": 3600000
  }
}
EOF

# 2. 限制文件大小
# 避免打开超过 10MB 的文件

# 3. 优化 Markdown 文件
# 减少图片数量和大小
# 使用外部链接引用大文件
```

---

### 问题 2: 搜索响应慢

**症状**: 搜索结果返回需要超过 1 秒。

**原因**:
- 文件数量过多
- 搜索范围过大
- 未使用索引

**解决方案**:

```bash
# 1. 限制搜索范围
cat > .folder-siterc.json << 'EOF'
{
  "search": {
    "debounce": 100,
    "maxResults": 20,
    "caseSensitive": false
  }
}
EOF

# 2. 忽略不必要的目录
cat > .folder-siterc.json << 'EOF'
{
  "watcher": {
    "ignore": ["node_modules", ".git", "dist"]
  }
}
EOF

# 3. 使用文件类型过滤
curl "http://localhost:3000/api/search?q=关键词&fileType=md"
```

---

### 问题 3: 内存占用过高

**症状**: 进程内存占用超过 1GB。

**原因**:
- 缓存未清理
- 文件监听过多
- 内存泄漏

**解决方案**:

```bash
# 1. 设置缓存 TTL
cat > .folder-siterc.json << 'EOF'
{
  "cache": {
    "enabled": true,
    "ttl": 1800000
  }
}
EOF

# 2. 减少监听的文件
cat > .folder-siterc.json << 'EOF'
{
  "watcher": {
    "ignore": [
      "node_modules",
      ".git",
      "dist",
      "build",
      "*.log"
    ]
  }
}
EOF

# 3. 定期重启服务
# 使用 cron 或 systemd 定时重启
```

---

## 文件监听问题

### 问题 1: 文件修改后页面不刷新

**症状**: 修改文件后，浏览器页面没有自动刷新。

**诊断步骤**:

```bash
# 1. 检查文件监听是否启用
cat .folder-siterc.json | grep watcher

# 2. 检查文件是否在忽略列表中
cat .folder-siterc.json | grep ignore

# 3. 检查文件权限
ls -l /path/to/file
```

**解决方案**:

```bash
# 1. 启用文件监听
cat > .folder-siterc.json << 'EOF'
{
  "watcher": {
    "enabled": true
  }
}
EOF

# 2. 确保文件不在忽略列表中
cat > .folder-siterc.json << 'EOF'
{
  "watcher": {
    "enabled": true,
    "ignore": ["node_modules", ".git"]
  }
}
EOF

# 3. 手动刷新浏览器
# 按 F5 或 Cmd+R / Ctrl+R
```

---

### 问题 2: 文件监听延迟

**症状**: 文件修改后需要几秒钟才能看到变化。

**原因**:
- 防抖延迟设置过高
- 文件系统性能问题

**解决方案**:

```bash
# 1. 减少防抖延迟
cat > .folder-siterc.json << 'EOF'
{
  "watcher": {
    "enabled": true,
    "debounce": 100
  }
}
EOF

# 2. 检查文件系统性能
# 如果使用网络文件系统，考虑使用本地文件

# 3. 增加文件监听限制
ulimit -n 65536
```

---

### 问题 3: 新增文件未显示

**症状**: 新创建的文件没有出现在文件树中。

**诊断步骤**:

```bash
# 1. 检查文件是否创建成功
ls -la /path/to/newfile.md

# 2. 检查文件权限
ls -l /path/to/newfile.md

# 3. 手动刷新浏览器
```

**解决方案**:

```bash
# 1. 重启服务
# 按 Ctrl+C 停止，然后重新启动

# 2. 检查文件监听配置
cat > .folder-siterc.json << 'EOF'
{
  "watcher": {
    "enabled": true,
    "ignore": ["node_modules", ".git"]
  }
}
EOF

# 3. 使用绝对路径
# 确保文件在服务的工作目录下
```

---

## 搜索问题

### 问题 1: 搜索无结果

**症状**: 搜索关键词后没有返回任何结果。

**诊断步骤**:

```bash
# 1. 检查关键词是否正确
# 尝试使用更简单的关键词

# 2. 检查搜索范围
curl "http://localhost:3000/api/search?q=test&scope=all"

# 3. 检查文件是否存在
ls -la /path/to/file.md
```

**解决方案**:

```bash
# 1. 尝试不同的搜索范围
curl "http://localhost:3000/api/search?q=关键词&scope=titles"
curl "http://localhost:3000/api/search?q=关键词&scope=content"

# 2. 检查文件是否在忽略列表中
cat .folder-siterc.json | grep ignore

# 3. 使用文件类型过滤
curl "http://localhost:3000/api/search?q=关键词&fileType=md"
```

---

### 问题 2: 搜索结果不准确

**症状**: 搜索结果与关键词不相关。

**原因**:
- 模糊匹配过于宽松
- 未使用索引
- 搜索范围设置不当

**解决方案**:

```bash
# 1. 调整搜索配置
cat > .folder-siterc.json << 'EOF'
{
  "search": {
    "caseSensitive": false,
    "maxResults": 20,
    "debounce": 50
  }
}
EOF

# 2. 使用更精确的关键词
# 使用完整的单词或短语

# 3. 限制搜索范围
curl "http://localhost:3000/api/search?q=关键词&scope=titles"
```

---

### 问题 3: 搜索输入框无响应

**症状**: 打开搜索框后无法输入或响应缓慢。

**诊断步骤**:

```bash
# 1. 检查浏览器控制台错误
# 按 F12 打开开发者工具

# 2. 检查网络请求
# 在 Network 标签页查看 API 请求

# 3. 检查 CPU 和内存使用
# 使用任务管理器或 Activity Monitor
```

**解决方案**:

```bash
# 1. 增加搜索防抖延迟
cat > .folder-siterc.json << 'EOF'
{
  "search": {
    "debounce": 200,
    "maxResults": 10
  }
}
EOF

# 2. 清除浏览器缓存
# Chrome: Cmd+Shift+Delete / Ctrl+Shift+Delete

# 3. 重启浏览器
```

---

## 导出问题

### 问题 1: 导出失败

**错误信息**:
```
Error: Export failed: xxx
```

**原因**:
- 文件路径错误
- 文件过大
- 格式不支持

**解决方案**:

```bash
# 1. 检查文件路径
curl "http://localhost:3000/api/files/docs/README.md"

# 2. 减少导出文件数量
curl -X POST http://localhost:3000/api/export \
  -H "Content-Type: application/json" \
  -d '{"format":"pdf","paths":["docs/README.md"]}'

# 3. 检查文件大小
ls -lh /path/to/file.md
# 避免导出超过 50MB 的文件
```

---

### 问题 2: 导出文件损坏

**症状**: 导出的 PDF 或 HTML 文件无法打开。

**原因**:
- 文件包含特殊字符
- 图片路径错误
- Markdown 格式错误

**解决方案**:

```bash
# 1. 检查 Markdown 格式
# 使用 Markdown 验证工具

# 2. 检查图片路径
# 确保使用相对路径

# 3. 尝试导出单个文件
curl -X POST http://localhost:3000/api/export \
  -H "Content-Type: application/json" \
  -d '{"format":"html","paths":["docs/README.md"]}'
```

---

### 问题 3: 导出速度慢

**症状**: 导出大文件需要很长时间。

**解决方案**:

```bash
# 1. 分批导出
# 每次导出少量文件

# 2. 禁用目录和封面
curl -X POST http://localhost:3000/api/export \
  -H "Content-Type: application/json" \
  -d '{
    "format":"pdf",
    "paths":["docs/README.md"],
    "options": {
      "includeToc": false,
      "includeCover": false
    }
  }'

# 3. 优化文件内容
# 减少图片数量和大小
# 简化 Markdown 格式
```

---

## 浏览器问题

### 问题 1: 页面显示异常

**症状**: 页面布局错乱、样式丢失。

**解决方案**:

```bash
# 1. 清除浏览器缓存
# Chrome: Cmd+Shift+Delete / Ctrl+Shift+Delete

# 2. 禁用浏览器扩展
# 尝试使用隐私模式

# 3. 更新浏览器
# 确保使用最新版本的浏览器
```

---

### 问题 2: 快捷键不工作

**症状**: 键盘快捷键无法触发功能。

**解决方案**:

```bash
# 1. 检查浏览器兼容性
# 推荐使用 Chrome、Firefox、Edge

# 2. 检查焦点
# 确保页面已获得焦点

# 3. 检查冲突
# 某些快捷键可能与浏览器或系统快捷键冲突
```

---

### 问题 3: WebSocket 连接失败

**症状**: 文件监听功能不工作，显示连接错误。

**诊断步骤**:

```bash
# 1. 检查浏览器控制台
# 按 F12 打开开发者工具

# 2. 检查网络连接
# 确保 WebSocket 连接未被防火墙阻止

# 3. 检查服务状态
curl http://localhost:3000/api/health
```

**解决方案**:

```bash
# 1. 重启服务
# 按 Ctrl+C 停止，然后重新启动

# 2. 检查防火墙设置
# 确保 WebSocket 连接被允许

# 3. 使用 HTTP 轮询
# 如果 WebSocket 不可用，系统会自动降级
```

---

## 获取帮助

如果以上方法都无法解决你的问题：

### 1. 收集诊断信息

```bash
# 收集系统信息
echo "=== OS ===" && uname -a
echo "=== Bun ===" && bun --version
echo "=== Folder-Site ===" && folder-site --version
echo "=== Port ===" && lsof -i:3000
echo "=== Config ===" && cat .folder-siterc.json 2>/dev/null || echo "No config file"
```

### 2. 查看日志

```bash
# 查看详细日志
folder-site 2>&1 | tee debug.log

# 或使用环境变量
LOG_LEVEL=debug folder-site
```

### 3. 提交 Issue

在提交 Issue 时，请包含以下信息：

- **环境信息**：操作系统、Bun 版本、Folder-Site 版本
- **问题描述**：详细的错误信息和复现步骤
- **配置文件**：`.folder-siterc.json` 内容（去除敏感信息）
- **日志输出**：完整的错误日志
- **预期行为**：你期望发生什么
- **实际行为**：实际发生了什么

### 4. 获取帮助的渠道

- 📖 **文档**: [README.md](../README.md) | [使用指南](./USAGE.md) | [API 文档](./API.md)
- 🐛 **GitHub Issues**: [提交问题](https://github.com/yourusername/folder-site/issues)
- 💬 **GitHub Discussions**: [社区讨论](https://github.com/yourusername/folder-site/discussions)
- 📧 **Email**: your.email@example.com

---

## 常用诊断命令

```bash
# 检查服务状态
curl http://localhost:3000/api/health

# 检查端口占用
lsof -i:3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# 检查文件权限
ls -la /path/to/file

# 检查磁盘空间
df -h  # macOS/Linux
Get-PSDrive  # Windows

# 检查内存使用
top  # macOS/Linux
tasklist  # Windows

# 清理缓存
bun pm cache rm
npm cache clean --force

# 重新安装依赖
rm -rf node_modules bun.lockb package-lock.json
bun install

# 查看进程
ps aux | grep folder-site  # macOS/Linux
tasklist | findstr folder-site  # Windows
```

---

## 预防措施

### 1. 定期备份

```bash
# 备份配置文件
cp .folder-siterc.json .folder-siterc.json.backup

# 备份文档
tar -czf docs-backup-$(date +%Y%m%d).tar.gz docs/
```

### 2. 使用版本控制

```bash
# 初始化 Git 仓库
git init

# 添加文件
git add .

# 提交
git commit -m "Initial commit"
```

### 3. 监控资源使用

```bash
# 监控内存使用
watch -n 5 'ps aux | grep folder-site'

# 监控磁盘使用
watch -n 5 'df -h'
```

---

## 下一步

- [安装指南](./INSTALLATION.md) - 安装和配置
- [使用指南](./USAGE.md) - 了解如何使用
- [API 文档](./API.md) - 了解 API 接口
- [项目概述](./PROJECT_OVERVIEW.md) - 深入了解项目架构