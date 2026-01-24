# 修复 JSON Canvas 和 LaTeX 渲染问题

## 问题分析

### 1. LaTeX 渲染失败
**错误**: `Language 'math' is not included in this bundle`

**原因**: Shiki 试图高亮 `math` 语言的代码块，但这个语言不在 bundle 中。

**根本原因**: `remark-math` 插件会创建 `math` 和 `inlineMath` 节点，这些节点在转换为 HTML 时可能被 Shiki 误认为是代码块。

### 2. JSON Canvas 渲染失败
**现象**: 渲染器已注册，但没有找到代码块

**原因**: 
1. remark 插件将节点转换为 HTML 字符串，内容被转义
2. 渲染器无法从转义的 HTML 中获取原始 JSON
3. CSS 类名没有正确应用到生成的 HTML 元素上

**根本原因**: 错误的插件实现方式 - 不应该直接转换为 HTML，而应该使用 `hProperties` 让 rehype 处理。

## DeepWiki 关键发现

根据 `xicilion/markdown-viewer-extension` 的实现经验：

### 1. 插件顺序很重要
- HTML 插件必须最先处理
- 防止其他插件生成的占位符被错误处理

### 2. 内容保存方式
- 应该使用 `data` 属性保存原始内容
- 不应该直接转换为 HTML 字符串
- 让 rehype 处理 `hProperties`

### 3. KaTeX 配置
- 需要特殊的 CSS 重置
- `remark-math` 创建的节点不应该被 Shiki 处理

## 解决方案

### 1. 修复 LaTeX - 添加到 Shiki 跳过列表

**文件**: `src/parsers/rehype-shiki.ts`

```typescript
const DEFAULT_SKIP_LANGUAGES = [
  'mermaid', 'mmd',
  'vega', 'vega-lite', 'vl',
  'dot', 'graphviz',
  'infographic',
  'svg',
  'html',
  'json-canvas', 'canvas',
  'math', 'latex', 'tex',  // 🆕 添加数学语言
];
```

### 2. 修复 JSON Canvas - 使用 data 属性

**文件**: `src/parsers/remark-json-canvas.ts`

**修改前**:
```typescript
// ❌ 错误：直接转换为 HTML，内容被转义
(node as any).type = 'html';
node.value = `<pre class="${className}"><code>${escapeHtml(node.value)}</code></pre>`;
```

**修改后**:
```typescript
// ✅ 正确：使用 hProperties，保存原始内容
const hProperties = {
  className: [className],
  'data-json-canvas': 'true',
  'data-content': node.value,  // 保存原始内容
  ...(autoRender && { 'data-auto-render': 'true' }),
};
data.hProperties = hProperties;
// 不转换为 HTML，保持为 code 节点
```

**文件**: `src/client/components/editor/renderers/json-canvas-renderer.ts`

**修改前**:
```typescript
// ❌ 错误：从 textContent 读取（已被转义）
const code = block.textContent || '';
```

**修改后**:
```typescript
// ✅ 正确：从 data-content 属性读取原始内容
const code = (block as HTMLElement).getAttribute('data-content') || block.textContent || '';
```

**选择器修改**:
```typescript
// ❌ 错误：查找 pre.json-canvas
const canvasBlocks = container.querySelectorAll('pre.json-canvas code');

// ✅ 正确：查找带有 data 属性的 code 元素
const canvasBlocks = container.querySelectorAll('code[data-json-canvas="true"]');
```

### 3. 修复 SVG - 同样的方式

**文件**: `src/parsers/remark-svg.ts`

```typescript
// 使用 hProperties，保存原始内容
const hProperties = {
  className: [className],
  'data-svg': 'true',
  'data-content': node.value,  // 保存原始内容
  ...(autoRender && { 'data-auto-render': 'true' }),
};
data.hProperties = hProperties;
```

**文件**: `src/client/components/editor/renderers/svg-renderer.ts`

```typescript
// 从 data-content 属性读取
const code = (block as HTMLElement).getAttribute('data-content') || block.textContent || '';
```

## 架构改进

### 原理

1. **remark 插件阶段**:
   - 识别特殊代码块（json-canvas, svg）
   - 设置 `hProperties`，包括 `data-content` 属性
   - **不转换为 HTML**，保持为 `code` 节点

2. **rehype 处理阶段**:
   - rehype 将 `hProperties` 应用到生成的 HTML 元素
   - `data-content` 属性包含原始内容
   - CSS 类名正确应用

3. **客户端渲染阶段**:
   - 使用 `querySelectorAll('code[data-xxx="true"]')` 查找
   - 从 `data-content` 属性读取原始内容
   - 渲染为最终输出

### 优势

- ✅ 内容不被转义
- ✅ 原始数据完整保留
- ✅ 选择器更可靠
- ✅ 符合 unified 生态的最佳实践

## 测试

### LaTeX
```bash
# 应该不再报错
# test-latex.md 中的所有公式都应该正常渲染
```

### JSON Canvas
```bash
# 应该能找到代码块并渲染
# 控制台应该显示：
# [JSON Canvas] Found blocks: 2
# [JSON Canvas] Processing block, content length: xxx
```

### SVG
```bash
# SVG 应该直接显示
# 不应该有转义的 HTML 实体
```

## 文件变更

### 修改的文件
- `src/parsers/rehype-shiki.ts` - 添加 math/latex/tex 到跳过列表
- `src/parsers/remark-json-canvas.ts` - 使用 hProperties 和 data-content
- `src/parsers/remark-svg.ts` - 使用 hProperties 和 data-content
- `src/client/components/editor/renderers/json-canvas-renderer.ts` - 从 data 属性读取
- `src/client/components/editor/renderers/svg-renderer.ts` - 新建，从 data 属性读取
- `src/client/components/editor/renderers/index.ts` - 导出 SVG 渲染器
- `src/client/components/editor/MarkdownRenderer.tsx` - 注册 SVG 渲染器

## 经验教训

### 1. 不要直接转换为 HTML
- ❌ `(node as any).type = 'html'`
- ✅ 使用 `data.hProperties`

### 2. 使用 data 属性保存内容
- ❌ 依赖 `textContent`（可能被转义）
- ✅ 使用 `data-content` 属性

### 3. 选择器要匹配实际 HTML 结构
- ❌ `pre.json-canvas code`（类名可能不在 pre 上）
- ✅ `code[data-json-canvas="true"]`（data 属性更可靠）

### 4. Shiki 跳过列表要完整
- 所有特殊语言都要添加
- 包括 math/latex/tex

## 参考

- [xicilion/markdown-viewer-extension - Plugin System](https://deepwiki.com/wiki/xicilion/markdown-viewer-extension#4)
- [xicilion/markdown-viewer-extension - Code Architecture Patterns](https://deepwiki.com/wiki/xicilion/markdown-viewer-extension#11.2)
