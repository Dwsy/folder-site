# Infographic 支持实现总结

## 问题分析

### 原始错误
```
Failed to load languages: ['infographic'] 
ShikiError: Language `infographic` is not included in this bundle.
```

### 根本原因
Shiki（代码高亮库）试图高亮所有代码块，包括 `infographic`，但它不认识这个语言。

## 解决方案

### 1. 修改 rehype-shiki.ts ✅
添加跳过列表，让 Shiki 忽略特殊的代码块：

```typescript
const DEFAULT_SKIP_LANGUAGES = [
  'mermaid',
  'mmd',
  'vega',
  'vega-lite',
  'vl',
  'dot',
  'graphviz',
  'infographic',  // ← 新增
  'svg',
  'html',
];
```

### 2. 创建 remark-infographic.ts ✅
处理 `infographic` 代码块，转换为 HTML 结构：

```typescript
// 将 ```infographic 转换为
<pre class="infographic"><code>...</code></pre>
```

### 3. 注册插件到 markdown.ts ✅
```typescript
import { remarkInfographic } from './remark-infographic.js';
processor = processor.use(remarkInfographic);
```

### 4. 创建前端渲染器 ✅
在 MarkdownRenderer.tsx 中添加 `createInfographicRenderer()`：

```typescript
function createInfographicRenderer() {
  return async (container: HTMLElement, theme: 'light' | 'dark') => {
    const { Chart } = await import('@antv/g2');
    // 渲染逻辑...
  };
}
```

### 5. 注册到插件系统 ✅
```typescript
const customRenderers = useMemo(() => ({
  'mermaid': createMermaidRenderer(mermaidTheme),
  'infographic': createInfographicRenderer(),  // ← 新增
}), [mermaidTheme]);
```

### 6. 创建插件清单 ✅
`plugins/infographic-renderer/manifest.json`

### 7. 安装依赖 ✅
```bash
bun add @antv/g2
```

## 插件处理优先级

按照用户提供的优先级表：

| 优先级 | 插件 | 处理目标 | 状态 |
|:---:|------|---------|------|
| 1 | HtmlPlugin | 原生 HTML 块 | ⏳ 待实现 |
| 2 | MermaidPlugin | ` ```mermaid ` | ✅ 已实现 |
| 3 | VegaLitePlugin | ` ```vega-lite ` | ⏳ 待实现 |
| 4 | VegaPlugin | ` ```vega ` | ⏳ 待实现 |
| 5 | SvgPlugin | ` ```svg ` | ⏳ 待实现 |
| 6 | DotPlugin | ` ```dot ` | ⏳ 待实现 |
| 7 | InfographicPlugin | ` ```infographic ` | ✅ 已实现 |

**注意**：Shiki 跳过列表已包含所有这些语言，确保它们不会被错误地高亮。

## 测试

### 1. 创建测试文件
```bash
cat test-infographic.md
```

### 2. 访问页面
打开包含 infographic 代码块的页面

### 3. 检查控制台
应该看到：
```
[rehype-shiki] Skipping language: infographic (handled by plugin)
[PluginRenderer] Processing plugin: infographic
[PluginRenderer] Using custom renderer for infographic
```

### 4. 验证渲染
- 图表应该显示为交互式 G2 图表
- 支持亮色/暗色主题
- 自动适应容器大小

## 文件清单

### 修改的文件
- ✅ `src/parsers/rehype-shiki.ts` - 添加跳过列表
- ✅ `src/parsers/remark-infographic.ts` - 新建
- ✅ `src/parsers/markdown.ts` - 注册插件
- ✅ `src/client/components/editor/MarkdownRenderer.tsx` - 添加渲染器
- ✅ `plugins/infographic-renderer/manifest.json` - 新建
- ✅ `package.json` - 添加 @antv/g2 依赖

### 测试文件
- ✅ `test-infographic.md` - 测试用例

## G2 图表示例

### 柱状图
```json
{
  "type": "interval",
  "data": [...],
  "encode": { "x": "genre", "y": "sold", "color": "genre" }
}
```

### 折线图
```json
{
  "type": "line",
  "data": [...],
  "encode": { "x": "year", "y": "value" },
  "style": { "stroke": "#5B8FF9", "lineWidth": 2 }
}
```

### 饼图
```json
{
  "type": "interval",
  "coordinate": { "type": "theta" },
  "transform": [{ "type": "stackY" }],
  "data": [...],
  "encode": { "y": "value", "color": "category" }
}
```

更多示例：https://g2.antv.antgroup.com/examples

## 下一步

1. **测试 Infographic 渲染**
   - 打开 test-infographic.md
   - 验证图表显示
   - 测试主题切换

2. **实现其他插件**
   - Vega/Vega-Lite
   - Graphviz/DOT
   - SVG

3. **优化**
   - 添加工具栏（类似 Mermaid）
   - 支持导出图片
   - 添加交互功能
