# CLI 使用指南

Folder-Site CLI 提供了简单易用的命令行界面，用于快速启动本地文档网站。

## 安装

```bash
bun install
```

## 基本用法

### 启动开发服务器

```bash
bun run start
# 或
bun run dev
```

默认将在 `http://localhost:3000` 启动服务器。

## 命令行选项

### `--port` / `-p`

指定服务器端口号。

```bash
bun run start --port 8080
# 或
bun run start -p 8080
```

**默认值**: `3000`

**有效范围**: `1-65535`

**注意事项**:
- 端口号必须是有效的数字
- 系统保留端口（如 80, 443, 8080 等）会显示警告提示
- 如果端口已被占用，服务器将无法启动

### `--help` / `-h`

显示帮助信息。

```bash
bun run start --help
# 或
bun run start -h
```

### `--version` / `-v`

显示版本信息。

```bash
bun run start --version
# 或
bun run start -v
```

## 示例

### 使用默认端口启动

```bash
bun run start
```

输出：
```
🚀 Folder-Site CLI v0.1.0
🌐 Running at http://localhost:3000
📁 Serving directory: /path/to/your/project

Press Ctrl+C to stop
```

### 使用自定义端口启动

```bash
bun run start --port 4000
```

输出：
```
🚀 Folder-Site CLI v0.1.0
🌐 Running at http://localhost:4000
📁 Serving directory: /path/to/your/project

Press Ctrl+C to stop
```

### 使用系统保留端口（会显示警告）

```bash
bun run start --port 8080
```

输出：
```
⚠️  警告: 端口 8080 是系统保留端口，可能需要管理员权限
🚀 Folder-Site CLI v0.1.0
🌐 Running at http://localhost:8080
📁 Serving directory: /path/to/your/project

Press Ctrl+C to stop
```

### 无效端口号示例

```bash
bun run start --port abc
```

输出：
```
❌ 参数解析错误: 端口号必须是数字: NaN

使用 --help 查看帮助信息
```

```bash
bun run start --port 70000
```

输出：
```
❌ 参数解析错误: 端口号必须在 1-65535 范围内: 70000

使用 --help 查看帮助信息
```

## 系统保留端口列表

以下端口是系统保留端口，使用时会显示警告提示：

- 20 (FTP Data)
- 21 (FTP Control)
- 22 (SSH)
- 23 (Telnet)
- 25 (SMTP)
- 53 (DNS)
- 80 (HTTP)
- 110 (POP3)
- 143 (IMAP)
- 443 (HTTPS)
- 445 (SMB)
- 993 (IMAPS)
- 995 (POP3S)
- 1433 (MSSQL)
- 1521 (Oracle DB)
- 3306 (MySQL)
- 3389 (RDP)
- 5432 (PostgreSQL)
- 5900 (VNC)
- 6379 (Redis)
- 8080 (HTTP Alternate)
- 8443 (HTTPS Alternate)
- 27017 (MongoDB)

## 环境变量

除了命令行选项，你也可以通过环境变量配置：

### `PORT`

指定端口号（与 `--port` 选项功能相同）。

```bash
PORT=4000 bun run start
```

## 停止服务器

按 `Ctrl+C` 停止服务器。

## 故障排除

### 端口已被占用

如果遇到 "EADDRINUSE" 错误，表示端口已被占用。尝试：

1. 使用不同的端口：
   ```bash
   bun run start --port 4000
   ```

2. 或停止占用端口的进程：
   ```bash
   # macOS/Linux
   lsof -ti:3000 | xargs kill -9
   ```

### 权限问题

如果使用系统保留端口（低于 1024）遇到权限错误，可以：

1. 使用非保留端口（推荐）
2. 或使用 `sudo` 运行（不推荐）

## 更多信息

- [项目主页](https://github.com/yourusername/folder-site)
- [API 文档](./api.md)
- [开发指南](./development.md)