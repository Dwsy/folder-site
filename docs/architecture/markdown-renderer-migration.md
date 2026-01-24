# 如何在 MarkdownRenderer 中集成自动化插件系统（保留所有功能）

## 核心思路

**不删除任何现有代码**，只是将渲染函数注册到插件系统，让它自动调用。

## 修改步骤

### 1. 导入 hook
```typescript
import { usePluginRenderer } from '../../hooks/usePluginRenderer.js';
```

### 2. 将现有的 renderMermaidDiagrams 提取为独立函数

```typescript
// 提取现有的 Mermaid 渲染逻辑为独立函数
const createMermaidRenderer = (mermaidTheme: string) => {
  return async (container: HTMLElement, theme: 'light' | 'dark') => {
    const mermaid = await initMermaid(mermaidTheme);
    if (!mermaid) return;

    const mermaidBlocks = container.querySelectorAll('pre.mermaid code');
    
    for (const block of Array.from(mermaidBlocks)) {
      // ... 保留所有现有的渲染逻辑 ...
      // 包括工具栏、全屏、下载等功能
    }
  };
};
```

### 3. 注册自定义渲染器

```typescript
export function MarkdownRenderer({ content, theme, ... }: MarkdownRendererProps) {
  const [state, setState] = useState<MarkdownRendererState>({ ... });
  
  // 确定 Mermaid 主题
  const isDark = theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const mermaidTheme = isDark ? 'dark' : 'default';

  // 注册自定义渲染器（保留所有现有功能）
  const customRenderers = useMemo(() => ({
    'mermaid': createMermaidRenderer(mermaidTheme),
    // 未来可以添加更多：
    // 'vega': createVegaRenderer(),
    // 'graphviz': createGraphvizRenderer(),
  }), [mermaidTheme]);

  // 使用插件渲染器（自动调用注册的渲染函数）
  const containerRef = usePluginRenderer(state.html, theme, customRenderers);

  // ... 其他逻辑保持不变 ...

  return (
    <div
      className={cn('markdown-content', className)}
      ref={containerRef}
      dangerouslySetInnerHTML={{ __html: state.html }}
    />
  );
}
```

### 4. 删除手动的 useEffect

```typescript
// 删除这部分（因为插件系统会自动调用）
useEffect(() => {
  renderMermaidDiagrams();
}, [state.html, theme]);
```

## 优势

1. **保留所有功能**：工具栏、全屏、下载等功能完全保留
2. **自动化**：新增插件只需注册渲染函数
3. **统一管理**：所有插件通过统一的系统管理
4. **渐进式迁移**：可以逐步将其他插件（Vega、Graphviz）迁移过来

## 完整示例

```typescript
export function MarkdownRenderer(props: MarkdownRendererProps) {
  const { content, theme = 'auto', ... } = props;
  const [state, setState] = useState<MarkdownRendererState>({ ... });
  
  // 1. 确定主题
  const isDark = theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const mermaidTheme = isDark ? 'dark' : 'default';

  // 2. 注册自定义渲染器（保留所有现有功能）
  const customRenderers = useMemo(() => ({
    'mermaid': createMermaidRenderer(mermaidTheme),
  }), [mermaidTheme]);

  // 3. 使用插件渲染器
  const containerRef = usePluginRenderer(state.html, theme, customRenderers);

  // 4. 解析 Markdown（保持不变）
  useEffect(() => {
    // ... 现有的解析逻辑 ...
  }, [content, ...]);

  // 5. 渲染（使用 containerRef 替代 mermaidRef）
  return (
    <div
      className={cn('markdown-content', className)}
      ref={containerRef}
      dangerouslySetInnerHTML={{ __html: state.html }}
    />
  );
}

// 提取的 Mermaid 渲染器（保留所有现有代码）
function createMermaidRenderer(mermaidTheme: string) {
  return async (container: HTMLElement, theme: 'light' | 'dark') => {
    const mermaid = await initMermaid(mermaidTheme);
    if (!mermaid) return;

    const mermaidBlocks = container.querySelectorAll('pre.mermaid code');

    for (const block of Array.from(mermaidBlocks)) {
      const code = block.textContent || '';
      if (!code.trim()) continue;

      const id = `mermaid-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      try {
        const { svg } = await mermaid.render(id, code);
        
        // ... 保留所有现有的 DOM 操作 ...
        // 包括创建 wrapper、toolbar、事件监听等
        
      } catch (error) {
        console.error('Failed to render Mermaid diagram:', error);
      }
    }
  };
}
```

## 迁移检查清单

- [ ] 导入 usePluginRenderer hook
- [ ] 提取 renderMermaidDiagrams 为 createMermaidRenderer
- [ ] 创建 customRenderers 对象
- [ ] 使用 usePluginRenderer 替代 mermaidRef
- [ ] 删除手动的 useEffect
- [ ] 测试所有功能（工具栏、全屏、下载等）
