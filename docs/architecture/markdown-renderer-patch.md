# MarkdownRenderer.tsx 迁移补丁

## 第一步：添加导入

在文件顶部添加：

```typescript
import { usePluginRenderer } from '../../hooks/usePluginRenderer.js';
```

## 第二步：提取 Mermaid 渲染器

在组件外部添加这个函数（保留所有现有代码）：

```typescript
/**
 * 创建 Mermaid 渲染器
 * 保留所有现有功能：工具栏、全屏、下载等
 */
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

        const preElement = block.closest('pre');
        if (preElement && preElement.parentNode) {
          const wrapper = document.createElement('div');
          wrapper.className = 'mermaid-wrapper group';

          const svgContainer = document.createElement('div');
          svgContainer.className = 'mermaid-svg';
          svgContainer.innerHTML = svg;

          const toolbar = document.createElement('div');
          toolbar.className = 'mermaid-toolbar opacity-0 group-hover:opacity-100 transition-opacity';
          toolbar.innerHTML = `
            <button type="button" class="mermaid-btn" data-action="copy" title="复制代码">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </button>
            <button type="button" class="mermaid-btn" data-action="fullscreen" title="全屏查看">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
              </svg>
            </button>
            <button type="button" class="mermaid-btn" data-action="open-new" title="在新标签页打开">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
            </button>
            <button type="button" class="mermaid-btn" data-action="download-svg" title="下载 SVG">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
            </button>
            <button type="button" class="mermaid-btn" data-action="download-png" title="下载 PNG">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
            </button>
          `;

          toolbar.querySelectorAll('.mermaid-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
              e.preventDefault();
              e.stopPropagation();
              const action = (btn as HTMLElement).dataset.action;
              handleMermaidAction(action, code, svg, id, wrapper);
            });
          });

          wrapper.appendChild(svgContainer);
          wrapper.appendChild(toolbar);
          preElement.parentNode.replaceChild(wrapper, preElement);
        }
      } catch (error) {
        console.error('Failed to render Mermaid diagram:', error);
        const preElement = block.closest('pre');
        if (preElement) {
          preElement.classList.add('mermaid-error');
          preElement.title = `Mermaid rendering error: ${error instanceof Error ? error.message : String(error)}`;
        }
      }
    }
  };
}
```

## 第三步：修改组件内部

### 3.1 替换 mermaidRef

```typescript
// 删除：
const mermaidRef = useRef<HTMLDivElement>(null);

// 添加：
const isDark = theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
const mermaidTheme = isDark ? 'dark' : 'default';

const customRenderers = useMemo(() => ({
  'mermaid': createMermaidRenderer(mermaidTheme),
}), [mermaidTheme]);

const containerRef = usePluginRenderer(state.html, theme, customRenderers);
```

### 3.2 删除手动的 useEffect

```typescript
// 删除整个 useEffect：
useEffect(() => {
  if (!state.html || !mermaidRef.current) return;
  
  const isDark = theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const mermaidTheme = isDark ? 'dark' : 'default';

  const renderMermaidDiagrams = async () => {
    // ... 所有渲染逻辑 ...
  };

  renderMermaidDiagrams();
}, [state.html, theme]);
```

### 3.3 更新 JSX 中的 ref

```typescript
// 替换：
<div ref={mermaidRef} dangerouslySetInnerHTML={{ __html: state.html }} />

// 为：
<div ref={containerRef} dangerouslySetInnerHTML={{ __html: state.html }} />
```

## 完成！

现在 Mermaid 渲染会自动通过插件系统调用，所有功能保持不变。

## 测试清单

- [ ] Mermaid 图表正常渲染
- [ ] 工具栏显示正常
- [ ] 复制代码功能正常
- [ ] 全屏功能正常
- [ ] 在新标签页打开功能正常
- [ ] 下载 SVG 功能正常
- [ ] 下载 PNG 功能正常
- [ ] 主题切换正常
- [ ] 错误处理正常
