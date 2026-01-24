# Code Inspector 集成文档

## 概述

本项目已集成 [code-inspector](https://github.com/zh-lx/code-inspector)，这是一个强大的开发工具，可以在浏览器中点击元素时自动打开编辑器并定位到源代码。

## 功能特性

- ✅ 点击页面元素自动跳转到源代码
- ✅ 支持多种编辑器（VS Code、WebStorm 等）
- ✅ 开发环境自动启用
- ✅ 生产环境自动禁用
- ✅ 支持 Vite 构建工具

## 安装

```bash
bun add -D code-inspector-plugin
```

## 配置

已在 `vite.config.ts` 中配置：

```typescript
import { codeInspectorPlugin } from "code-inspector-plugin";

export default defineConfig({
  plugins: [
    // 注意：code-inspector-plugin 必须放在 react 插件之前
    codeInspectorPlugin({
      bundler: "vite",
    }),
    react({
      fastRefresh: true,
      babel: {},
    }),
  ],
});
```

## 使用方法

### 1. 启动开发服务器

```bash
bun run dev:client
```

### 2. 在浏览器中打开应用

访问 http://localhost:3010

### 3. 使用快捷键激活检查器

**macOS:** `Option + Shift`
**Windows/Linux:** `Alt + Shift`

### 4. 检查元素

1. 按下快捷键组合
2. 鼠标移动到页面元素上（会显示遮罩层）
3. 点击元素
4. 编辑器会自动打开并定位到对应的源代码

## 浏览器控制台提示

启动应用后，浏览器控制台会输出相关提示信息：

```
[Code Inspector] Press Option + Shift to inspect elements
```

## 支持的编辑器

code-inspector 支持以下编辑器：

- **VS Code** - 首选
- **VS Codium**
- **WebStorm**
- **PhpStorm**
- **PyCharm**
- **GoLand**
- **RubyMine**
- **CLion**
- **AppCode**
- **DataGrip**
- **Rider**
- **Android Studio**
- **IntelliJ IDEA**
- **Cursor**
- **Zed**
- **Neovim**
- **Sublime Text**

完整列表请参考：[launch-ide](https://github.com/zh-lx/launch-ide)

## 配置选项

### 基础配置

```typescript
codeInspectorPlugin({
  bundler: "vite",
})
```

### 高级配置

如需自定义配置，可以添加以下选项：

```typescript
codeInspectorPlugin({
  bundler: "vite",
  // 自定义快捷键（可选）
  hotKeys: ["option", "shift"], // macOS
  // hotKeys: ["alt", "shift"],  // Windows/Linux
})
```

## 注意事项

1. **插件顺序:** `codeInspectorPlugin` 必须放在 `@vitejs/plugin-react` 之前，否则会报错

2. **开发环境:** 该插件仅在开发环境启用，生产构建时会自动禁用

3. **编辑器配置:** 确保你的编辑器已关联到系统，否则无法自动打开

4. **端口冲突:** 如果 3010 端口被占用，Vite 会自动选择其他端口

## 常见问题

### 问题 1: 插件警告

```
[WARNING] You need to put code-inspector-plugin before @vitejs/plugin-react
```

**解决方案:** 确保 `codeInspectorPlugin` 在 `react()` 之前

### 问题 2: 点击元素后没有反应

**可能原因:**
- 编辑器未正确安装或配置
- 端口被占用
- 浏览器扩展干扰

**解决方案:**
- 检查编辑器是否正确安装
- 检查浏览器控制台的错误信息
- 禁用可能干扰的浏览器扩展

### 问题 3: 生产环境启用

**说明:** code-inspector 仅用于开发环境，生产环境会自动禁用以确保性能和安全。

## 相关资源

- [code-inspector GitHub](https://github.com/zh-lx/code-inspector)
- [官方文档](https://inspector.fe-dev.cn)
- [在线演示](https://stackblitz.com/edit/vitejs-vite-svtwrr?file=vite.config.ts)

## 版本信息

- **code-inspector-plugin:** 1.4.0
- **集成日期:** 2025-01-24