# SplitMarkdownEditor 组件文档

并排显示的 Markdown 编辑器组件，支持实时预览、可调整面板大小、同步滚动等功能。

## 功能特性

- ✅ **并排显示**: 左侧代码编辑器，右侧实时预览
- ✅ **可调整面板**: 拖动分隔条调整左右面板大小
- ✅ **同步滚动**: 滚动一个面板自动滚动另一个
- ✅ **主题支持**: 支持 Light、Dark、Auto 主题
- ✅ **GFM 支持**: 支持 GitHub Flavored Markdown（表格、任务列表等）
- ✅ **语法高亮**: 代码块支持语法高亮
- ✅ **数学公式**: 支持 LaTeX 数学公式
- ✅ **工具栏**: 显示面板切换、重置、同步滚动状态等
- ✅ **TOC**: 目录导航

## 基本用法

```tsx
import { SplitMarkdownEditor } from './components/editor';

function App() {
  const [content, setContent] = useState('# Hello\n\nThis is **markdown**.');

  return (
    <div style={{ height: '600px' }}>
      <SplitMarkdownEditor
        content={content}
        theme="auto"
        onChange={setContent}
      />
    </div>
  );
}
```

## API

### SplitMarkdownEditor Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `content` | `string` | `''` | Markdown 内容 |
| `theme` | `'light' \| 'dark' \| 'auto'` | `'auto'` | 主题模式 |
| `defaultSplitPosition` | `number` | `50` | 初始分割位置（百分比 0-100） |
| `minPanelWidth` | `number` | `20` | 最小面板宽度（百分比） |
| `enableSyncScroll` | `boolean` | `true` | 启用同步滚动 |
| `showToolbar` | `boolean` | `true` | 显示工具栏 |
| `onChange` | `(content: string) => void` | - | 内容变化回调 |
| `onSave` | `(content: string) => void` | - | 保存回调 |
| `className` | `string` | - | 自定义 CSS 类名 |
| `height` | `string \| number` | `'100%'` | 编辑器高度 |

### SimpleSplitEditor Props

简化版本，不包含工具栏：

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `content` | `string` | - | Markdown 内容（必填） |
| `theme` | `'light' \| 'dark' \| 'auto'` | `'auto'` | 主题模式 |
| `splitPosition` | `number` | `50` | 分割位置（百分比） |
| `className` | `string` | - | 自定义 CSS 类名 |

## 使用示例

### 示例 1: 基本用法

```tsx
import { SplitMarkdownEditor } from './components/editor';

function BasicExample() {
  const [content, setContent] = useState('# Hello\n\nWorld!');

  return (
    <SplitMarkdownEditor
      content={content}
      theme="auto"
      onChange={setContent}
    />
  );
}
```

### 示例 2: 深色主题

```tsx
function DarkThemeExample() {
  return (
    <SplitMarkdownEditor
      content="# Dark Theme\n\nThis is dark mode."
      theme="dark"
      defaultSplitPosition={40}
    />
  );
}
```

### 示例 3: 禁用同步滚动

```tsx
function NoSyncExample() {
  return (
    <SplitMarkdownEditor
      content="# No Sync\n\nPanels scroll independently."
      enableSyncScroll={false}
    />
  );
}
```

### 示例 4: 简化版本（无工具栏）

```tsx
import { SimpleSplitEditor } from './components/editor';

function SimpleExample() {
  return (
    <SimpleSplitEditor
      content="# Simple\n\nNo toolbar."
      splitPosition={60}
    />
  );
}
```

### 示例 5: 完整功能

```tsx
function FullFeaturedExample() {
  const [content, setContent] = useState(initialContent);
  const [isDirty, setIsDirty] = useState(false);

  const handleChange = (newContent: string) => {
    setContent(newContent);
    setIsDirty(true);
  };

  const handleSave = (savedContent: string) => {
    console.log('Saving:', savedContent);
    setIsDirty(false);
  };

  return (
    <div>
      <SplitMarkdownEditor
        content={content}
        theme="auto"
        defaultSplitPosition={50}
        minPanelWidth={20}
        enableSyncScroll={true}
        showToolbar={true}
        onChange={handleChange}
        onSave={handleSave}
        height="600px"
      />
      {isDirty && <div>Unsaved changes</div>}
    </div>
  );
}
```

## 工具栏功能

工具栏包含以下功能：

1. **面板切换按钮**: 可以单独显示编辑器或预览面板
   - 点击 "Editor" 切换编辑器显示
   - 点击 "Preview" 切换预览显示
   - 两者都激活时显示并排视图

2. **重置按钮**: 重置分割位置到默认值（50%）

3. **同步滚动指示器**: 显示是否启用了同步滚动

## 样式定制

组件使用 Tailwind CSS 类名，可以通过 `className` 属性进行定制：

```tsx
<SplitMarkdownEditor
  content={content}
  className="my-custom-editor"
/>
```

自定义 CSS 示例：

```css
.my-custom-editor {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
```

## 注意事项

1. **CodeBlock 组件限制**: 当前实现使用 `CodeBlock` 组件显示代码，它是只读的。如需可编辑的代码编辑器，需要集成 Monaco Editor 或 CodeMirror。

2. **同步滚动性能**: 对于非常大的文档，同步滚动可能会有性能影响。可以通过 `enableSyncScroll={false}` 禁用。

3. **最小面板宽度**: `minPanelWidth` 应该在 10-40 之间，太小会导致面板无法正常显示。

4. **响应式布局**: 在移动设备上，建议使用较小的 `minPanelWidth` 值（如 15）。

## 相关组件

- `MarkdownPreview`: Markdown 预览组件
- `MarkdownRenderer`: Markdown 渲染组件
- `CodeBlock`: 代码块显示组件
- `TOC`: 目录导航组件

## 示例文件

- `examples/split-markdown-editor-example.tsx`: React 使用示例
- `examples/split-markdown-editor-demo.html`: HTML 演示页面

## 类型定义

```typescript
interface SplitMarkdownEditorProps {
  content?: string;
  theme?: 'light' | 'dark' | 'auto';
  defaultSplitPosition?: number;
  minPanelWidth?: number;
  enableSyncScroll?: boolean;
  showToolbar?: boolean;
  onChange?: (content: string) => void;
  onSave?: (content: string) => void;
  className?: string;
  height?: string | number;
}

interface SimpleSplitEditorProps {
  content: string;
  theme?: 'light' | 'dark' | 'auto';
  splitPosition?: number;
  className?: string;
}
```