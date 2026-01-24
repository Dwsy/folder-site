# Mermaid 无法显示 - 修复总结

## 已修复的问题

### 1. 竞态条件 ✅
**问题**：`loadPlugins()` 异步加载，但 `renderAll()` 可能在加载完成前调用。

**修复**：
- 添加 `pluginsLoaded` 状态
- 只有在插件加载完成后才调用 `renderAll()`

### 2. Hook 依赖问题 ✅
**问题**：`customRenderers` 作为依赖项，每次变化都会重新初始化渲染器。

**修复**：
- 分离初始化和注册逻辑
- 渲染器只初始化一次
- 自定义渲染器可以动态更新

### 3. 调试日志 ✅
添加了完整的调试日志，方便排查问题。

## 测试方法

### 方法 1：浏览器控制台
1. 打开包含 Mermaid 代码块的页面
2. 打开浏览器控制台（F12）
3. 查看日志输出

**预期日志**：
```
[usePluginRenderer] Initializing renderer...
[PluginRenderer] Loading plugins...
[PluginRenderer] Fetched manifests: 3
[PluginRenderer] Registering plugin: mermaid
[PluginRenderer] Loaded plugins: ['mermaid']
[usePluginRenderer] Registering custom renderers: ['mermaid']
[usePluginRenderer] Plugins loaded successfully
[usePluginRenderer] Rendering plugins...
[PluginRenderer] renderAll called, plugins: ['mermaid']
[PluginRenderer] Processing plugin: mermaid
[PluginRenderer] Using custom renderer for mermaid
```

### 方法 2：运行测试脚本
在浏览器控制台中运行：
```javascript
// 复制 public/test-plugin-system.js 的内容并粘贴
```

### 方法 3：手动检查
```javascript
// 检查 mermaid 代码块
document.querySelectorAll('pre.mermaid code').length

// 检查渲染结果
document.querySelectorAll('.mermaid-wrapper').length

// 手动测试 Mermaid
import('mermaid').then(async ({ default: m }) => {
  m.initialize({ startOnLoad: false, theme: 'default' });
  const { svg } = await m.render('test', 'graph TD\n  A-->B');
  console.log('SVG:', svg.substring(0, 100));
});
```

## 如果仍然不工作

### 检查清单

1. **服务器运行**
   ```bash
   curl http://localhost:3009/api/plugins/manifests | jq '.[0].id'
   ```
   应该返回 `"mermaid-renderer"`

2. **Markdown 解析**
   检查 HTML 源代码，应该看到：
   ```html
   <pre class="mermaid"><code>graph TD...</code></pre>
   ```

3. **插件加载**
   控制台应该显示：
   ```
   [PluginRenderer] Loaded plugins: ['mermaid']
   ```

4. **渲染器注册**
   控制台应该显示：
   ```
   [usePluginRenderer] Registering custom renderers: ['mermaid']
   ```

5. **渲染调用**
   控制台应该显示：
   ```
   [PluginRenderer] Using custom renderer for mermaid
   ```

### 常见问题

**Q: 控制台没有任何日志**
A: 检查 `usePluginRenderer` hook 是否被调用，确认 `containerRef` 是否正确传递给 DOM 元素。

**Q: 显示 "Loaded plugins: []"**
A: 检查 `manifest.json` 中 `frontend.enabled` 是否为 `true`。

**Q: 显示 "Using default renderer"**
A: 检查 `customRenderers` 对象的 key 是否与 `capability.name` 一致（都是 `'mermaid'`）。

**Q: Mermaid 库加载失败**
A: 检查 `package.json` 中是否安装了 `mermaid` 依赖。

## 文件清单

### 修改的文件
- ✅ `src/client/lib/plugin-renderer.ts` - 添加调试日志
- ✅ `src/client/hooks/usePluginRenderer.ts` - 修复竞态条件和依赖问题
- ✅ `src/client/components/editor/MarkdownRenderer.tsx` - 集成插件系统
- ✅ `plugins/*/manifest.json` - 添加 frontend 配置
- ✅ `src/server/routes/plugins.ts` - API 端点
- ✅ `src/server/index.ts` - 注册路由

### 测试文件
- ✅ `test-mermaid.md` - 测试 Markdown 文件
- ✅ `public/debug-plugins.html` - API 测试页面
- ✅ `public/test-plugin-system.js` - 浏览器测试脚本

### 文档
- ✅ `docs/troubleshooting/mermaid-not-rendering.md` - 排查指南
- ✅ `docs/architecture/markdown-renderer-migration.md` - 迁移指南
- ✅ `docs/testing/plugin-system-test.md` - 测试指南
