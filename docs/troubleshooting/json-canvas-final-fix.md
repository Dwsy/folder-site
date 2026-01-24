# 修复 JSON Canvas 渲染问题 - 最终解决方案

## 问题描述

用户使用 ```canvas 代码块，但是被渲染成普通代码块，没有可视化效果。

## 根本原因

**`renderAll` 方法只遍历服务器加载的插件配置，不遍历自定义渲染器！**

```typescript
// ❌ 错误：只遍历 this.plugins
for (const [pluginName, config] of this.plugins) {
  const renderer = this.renderers.get(pluginName);
  if (renderer) {
    await renderer(container, theme);
  }
}
```

这导致：
- `mermaid`, `infographic`, `vega`, `graphviz` 有服务器插件配置 → 被调用 ✅
- `json-canvas`, `svg` 只有自定义渲染器 → **不被调用** ❌

## 解决方案

修改 `renderAll` 方法，遍历**所有**插件名称（插件配置 + 自定义渲染器）：

```typescript
// ✅ 正确：遍历所有插件名称
const allPluginNames = new Set([
  ...Array.from(this.plugins.keys()),
  ...Array.from(this.renderers.keys())
]);

for (const pluginName of allPluginNames) {
  const renderer = this.renderers.get(pluginName);
  if (renderer) {
    await renderer(container, theme);
  } else {
    const config = this.plugins.get(pluginName);
    if (config) {
      await this.renderPlugin(container, pluginName, config, theme);
    }
  }
}
```

## 修改的文件

### 1. `src/client/lib/plugin-renderer.ts`
- 修改 `renderAll` 方法
- 收集所有插件名称（插件配置 + 自定义渲染器）
- 优先使用自定义渲染器，否则使用默认渲染器

### 2. `src/parsers/remark-json-canvas.ts`
- 转换为 HTML 节点（像 Mermaid 一样）
- 使用 `data-content` 属性保存原始 JSON
- 使用 `escapeAttr` 正确转义属性值

### 3. `src/parsers/remark-svg.ts`
- 同样的修改

### 4. `src/client/components/editor/renderers/json-canvas-renderer.ts`
- 选择器改为 `pre[data-json-canvas="true"]`
- 从 `data-content` 属性读取原始 JSON

## 测试

### 命令行测试
```bash
cd /Users/dengwenyu/Dev/AI/folder-site
bun test-canvas-lang.ts
```

**预期输出**:
```
=== HTML Output ===
<pre class="json-canvas" data-json-canvas="true" data-content="..."><code>...</code></pre>

=== Checking ===
Has data-json-canvas: true
Has class json-canvas: true
```

### 浏览器测试
打开 `examples/demo/canvas-demo.md`

**预期日志**:
```
[PluginRenderer] All plugin names to render: ['mermaid', 'infographic', 'vega', 'vega-lite', 'graphviz', 'json-canvas', 'svg']
[PluginRenderer] Processing plugin: json-canvas
[PluginRenderer] Using custom renderer for json-canvas
[JSON Canvas] Starting render...
[JSON Canvas] Found blocks: 10
[JSON Canvas] Processing block, content length: xxx
[JSON Canvas] Rendered successfully
```

## 架构改进

### 之前的架构
```
renderAll() → 只遍历 this.plugins
              ↓
              mermaid, infographic, vega, graphviz ✅
              json-canvas, svg ❌ (不在 plugins 中)
```

### 现在的架构
```
renderAll() → 遍历 this.plugins + this.renderers
              ↓
              所有插件 ✅
              - 有自定义渲染器 → 使用自定义渲染器
              - 只有插件配置 → 使用默认渲染器
```

## 经验教训

### 1. 插件系统设计
- 自定义渲染器应该独立于服务器插件配置
- `renderAll` 应该遍历所有注册的渲染器
- 不应该假设所有渲染器都有服务器配置

### 2. 调试技巧
- 添加详细的日志
- 检查 HTML 输出
- 验证选择器是否匹配
- 确认渲染函数是否被调用

### 3. 测试覆盖
- 命令行测试（HTML 输出）
- 浏览器测试（实际渲染）
- 日志验证（执行流程）

## 相关文件

- `src/client/lib/plugin-renderer.ts` - 插件渲染器核心
- `src/client/hooks/usePluginRenderer.ts` - React Hook
- `src/parsers/remark-json-canvas.ts` - JSON Canvas 解析
- `src/parsers/remark-svg.ts` - SVG 解析
- `src/client/components/editor/renderers/json-canvas-renderer.ts` - JSON Canvas 渲染
- `src/client/components/editor/renderers/svg-renderer.ts` - SVG 渲染

## 总结

问题的根本原因是 `renderAll` 方法的逻辑缺陷，只遍历服务器插件配置，导致纯客户端的自定义渲染器不被调用。

修复后，所有注册的渲染器（无论是否有服务器配置）都会被正确调用。

现在 JSON Canvas 和 SVG 应该可以正常渲染了！🎉
