# 目录测试文档

这是一个用于测试目录（TOC）功能的文档。

## 第一章：简介

欢迎来到目录测试文档！本文档用于验证 TOC 功能是否正常工作。

### 1.1 功能介绍

TOC（Table of Contents）功能可以：

- 自动提取文档中的标题
- 生成嵌套的目录结构
- 支持点击跳转
- 随滚动高亮当前章节

## 第二章：安装

### 2.1 前置要求

在开始之前，请确保满足以下条件：

1. Node.js >= 18.0.0
2. Bun >= 1.0.0
3. 现代浏览器

### 2.2 安装步骤

```bash
# 使用 npm 安装
npm install -g folder-site

# 使用 bun 安装
bun install -g folder-site
```

## 第三章：使用指南

### 3.1 基本用法

```typescript
import { FolderSite } from 'folder-site';

const site = new FolderSite({
  port: 3000,
  theme: 'dark',
});

site.start();
```

### 3.2 高级配置

#### 3.2.1 自定义主题

```json
{
  "theme": {
    "primary": "#3b82f6",
    "background": "#ffffff"
  }
}
```

#### 3.2.2 插件配置

```json
{
  "plugins": [
    "markdown-renderer",
    "code-highlighter"
  ]
}
```

## 第四章：API 参考

### 4.1 核心接口

#### FolderSite

主要的 FolderSite 类。

**方法**：

- `start()` - 启动服务器
- `stop()` - 停止服务器
- `reload()` - 重新加载配置

### 4.2 插件接口

#### Plugin

插件基类。

**方法**：

- `init()` - 初始化插件
- `render()` - 渲染内容
- `dispose()` - 清理资源

## 第五章：最佳实践

### 5.1 性能优化

1. 使用缓存减少渲染时间
2. 优化图片大小
3. 启用代码分割

### 5.2 安全建议

1. 验证用户输入
2. 使用 HTTPS
3. 定期更新依赖

## 第六章：常见问题

### 6.1 安装问题

**Q**: 安装失败怎么办？

**A**: 检查网络连接，尝试使用镜像源。

### 6.2 运行问题

**Q**: 端口被占用怎么办？

**A**: 使用 `--port` 参数指定其他端口。

## 结论

本文档介绍了 Folder-Site CLI 的基本功能和用法。

希望这些信息对你有帮助！