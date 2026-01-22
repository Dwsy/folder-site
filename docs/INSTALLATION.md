# 安装指南

本指南介绍如何安装和配置 Folder-Site CLI。

## 目录

- [系统要求](#系统要求)
- [安装方法](#安装方法)
- [验证安装](#验证安装)
- [更新安装](#更新安装)
- [卸载](#卸载)
- [常见问题](#常见问题)

---

## 系统要求

### 必需环境

| 组件 | 最低版本 | 推荐版本 |
|------|---------|---------|
| **Bun** | 1.0.0+ | 最新稳定版 |
| **Node.js** | 18.0.0+ | 20.x LTS |
| **操作系统** | - | 任意支持 Bun 的系统 |

### 支持的操作系统

- ✅ macOS (Intel & Apple Silicon)
- ✅ Linux (Ubuntu, Debian, Fedora, Alpine 等)
- ✅ Windows (WSL2) - 需要 WSL2 环境

### 网络要求

- 安装依赖需要稳定的互联网连接
- 下载大小约 200-300 MB

---

## 安装方法

### 方法一：使用 Bun 全局安装（推荐）

这是最简单和推荐的方法，适用于大多数用户。

```bash
# 1. 安装 Bun（如果尚未安装）
curl -fsSL https://bun.sh/install | bash

# 2. 重新加载 shell 配置
source ~/.bashrc  # 或 source ~/.zshrc

# 3. 全局安装 Folder-Site CLI
bun install -g folder-site
```

### 方法二：使用 npm 全局安装

如果你习惯使用 npm，也可以用它来安装：

```bash
# 全局安装
npm install -g folder-site

# 或使用 yarn
yarn global add folder-site

# 或使用 pnpm
pnpm add -g folder-site
```

### 方法三：从源码安装

适合开发者或需要自定义构建的用户。

```bash
# 1. 克隆仓库
git clone https://github.com/yourusername/folder-site.git
cd folder-site

# 2. 安装依赖
bun install

# 3. 构建项目
bun run build

# 4. 创建全局链接
bun link
```

### 方法四：使用 Docker

适合容器化部署环境。

```bash
# 1. 拉取镜像
docker pull yourusername/folder-site:latest

# 2. 运行容器
docker run -d \
  --name folder-site \
  -p 3000:3000 \
  -v /path/to/docs:/docs \
  yourusername/folder-site:latest
```

---

## 验证安装

安装完成后，运行以下命令验证：

```bash
# 检查版本
folder-site --version

# 查看帮助信息
folder-site --help

# 检查安装路径
which folder-site
```

### 预期输出

```bash
$ folder-site --version
folder-site v0.1.0

$ folder-site --help
Usage: folder-site [options]

One-command local website generator for documentation and knowledge bases

Options:
  -v, --version     显示版本信息
  -h, --help        显示帮助信息
  -p, --port <number>  指定端口号 (默认: 3000)
```

---

## 更新安装

### 更新全局安装

```bash
# 使用 Bun
bun update -g folder-site

# 使用 npm
npm update -g folder-site

# 使用 yarn
yarn global upgrade folder-site

# 使用 pnpm
pnpm update -g folder-site
```

### 从源码更新

```bash
# 1. 进入项目目录
cd folder-site

# 2. 拉取最新代码
git pull origin main

# 3. 更新依赖
bun install

# 4. 重新构建
bun run build

# 5. 重新链接
bun link --force
```

---

## 卸载

### 卸载全局安装

```bash
# 使用 Bun
bun remove -g folder-site

# 使用 npm
npm uninstall -g folder-site

# 使用 yarn
yarn global remove folder-site

# 使用 pnpm
pnpm remove -g folder-site
```

### 清理缓存

```bash
# 清理 Bun 缓存
bun pm cache rm

# 清理 npm 缓存
npm cache clean --force
```

---

## 常见问题

### 问题 1: 端口已被占用

**症状**：启动时提示端口 3000 已被占用

**解决方案**：

```bash
# 方案一：使用其他端口
folder-site --port 3001

# 方案二：查找并终止占用端口的进程
# macOS/Linux
lsof -ti:3000 | xargs kill -9

# Windows (PowerShell)
netstat -ano | findstr :3000
taskkill /PID <进程ID> /F
```

### 问题 2: 权限拒绝

**症状**：安装时出现 EACCES 权限错误

**解决方案**：

```bash
# 方案一：使用 sudo（不推荐）
sudo bun install -g folder-site

# 方案二：修复 npm 全局目录权限
mkdir -p ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc

# 方案三：使用 nvm 管理 Node.js
nvm install node
nvm use node
```

### 问题 3: Bun 未找到

**症状**：提示 `command not found: bun`

**解决方案**：

```bash
# 重新安装 Bun
curl -fsSL https://bun.sh/install | bash

# 添加到 PATH（如果需要）
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"
echo 'export BUN_INSTALL="$HOME/.bun"' >> ~/.bashrc
echo 'export PATH="$BUN_INSTALL/bin:$PATH"' >> ~/.bashrc
```

### 问题 4: 依赖安装失败

**症状**：`bun install` 或 `npm install` 失败

**解决方案**：

```bash
# 清理并重新安装
rm -rf node_modules bun.lockb package-lock.json
bun install

# 或使用 npm
rm -rf node_modules package-lock.json
npm install

# 如果使用 npm 仍然失败，尝试清除缓存
npm cache clean --force
npm install
```

### 问题 5: Windows 上运行问题

**症状**：Windows 上无法正常运行

**解决方案**：

1. **使用 WSL2**（推荐）：
   ```bash
   # 安装 WSL2
   wsl --install

   # 在 WSL2 中安装 Bun 和 Folder-Site
   curl -fsSL https://bun.sh/install | bash
   bun install -g folder-site
   ```

2. **使用 Git Bash**：
   - 安装 Git for Windows
   - 使用 Git Bash 终端运行命令

3. **使用 PowerShell**：
   - 确保使用管理员权限
   - 可能需要调整执行策略：`Set-ExecutionPolicy RemoteSigned`

### 问题 6: 构建错误

**症状**：`bun run build` 失败

**解决方案**：

```bash
# 检查 TypeScript 版本
bun --version

# 清理构建产物
rm -rf dist

# 重新构建
bun run build

# 如果 TypeScript 错误，检查类型
bun run typecheck
```

### 问题 7: 文件监听不工作

**症状**：文件修改后页面不自动刷新

**解决方案**：

```bash
# 检查文件监听限制
# macOS/Linux
ulimit -n

# 如果限制太低，增加限制
ulimit -n 65536

# 或在启动时设置
ulimit -n 65536 && folder-site
```

---

## 获取帮助

如果以上方法都无法解决你的问题：

1. **查看文档**：[README.md](../README.md) | [使用指南](./USAGE.md)
2. **搜索问题**：[GitHub Issues](https://github.com/yourusername/folder-site/issues)
3. **提交 Issue**：提供详细的错误信息和环境信息
4. **社区讨论**：[GitHub Discussions](https://github.com/yourusername/folder-site/discussions)

---

## 下一步

安装完成后，查看以下文档开始使用：

- [使用指南](./USAGE.md) - 学习如何使用 Folder-Site CLI
- [API 文档](./API.md) - 了解 API 接口
- [故障排查](./TROUBLESHOOTING.md) - 解决常见问题