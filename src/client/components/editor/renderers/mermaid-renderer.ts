/**
 * Mermaid 渲染器
 * 处理 Mermaid 图表的渲染、工具栏、下载等功能
 */

// 动态导入 mermaid（仅在客户端）
let mermaidInstance: any = null;
let currentMermaidTheme: string = 'default';

async function initMermaid(theme: 'default' | 'dark' | 'base' | 'forest' | 'neutral' | 'null' = 'default') {
  if (typeof window === 'undefined') return;
  if (mermaidInstance && currentMermaidTheme === theme) return mermaidInstance;

  try {
    const mermaid = (await import('mermaid')).default;
    mermaid.initialize({
      startOnLoad: false,
      theme: theme as any,
      securityLevel: 'loose',
      fontFamily: 'sans-serif',
      fontSize: 16,
    });
    mermaidInstance = mermaid;
    currentMermaidTheme = theme;
    return mermaid;
  } catch (error) {
    console.error('Failed to initialize Mermaid:', error);
    return null;
  }
}

/**
 * 处理 Mermaid 操作栏点击
 */
function handleMermaidAction(action: string | undefined, code: string, svg: string, id: string, wrapper?: HTMLElement) {
  if (!action) return;

  switch (action) {
    case 'copy':
      navigator.clipboard.writeText(code).then(() => {
        console.log('Mermaid code copied to clipboard');
      }).catch(err => {
        console.error('Failed to copy Mermaid code:', err);
      });
      break;

    case 'fullscreen':
      if (wrapper) {
        openFullscreen(wrapper);
      }
      break;

    case 'open-new':
      openMermaidInNewTab(svg);
      break;

    case 'download-svg':
      downloadFile(svg, `${id}.svg`, 'image/svg+xml');
      break;

    case 'download-png':
      svgToPng(svg).then(png => {
        downloadFile(png, `${id}.png`, 'image/png');
      }).catch(err => {
        console.error('Failed to convert SVG to PNG:', err);
      });
      break;

    default:
      console.warn('Unknown Mermaid action:', action);
  }
}

/**
 * 全屏显示 Mermaid 图表
 */
function openFullscreen(element: HTMLElement) {
  if (element.requestFullscreen) {
    element.requestFullscreen();
  } else if ((element as any).webkitRequestFullscreen) {
    (element as any).webkitRequestFullscreen();
  } else if ((element as any).mozRequestFullScreen) {
    (element as any).mozRequestFullScreen();
  } else if ((element as any).msRequestFullscreen) {
    (element as any).msRequestFullscreen();
  }
}

/**
 * 在新标签页打开 Mermaid 图表
 */
function openMermaidInNewTab(svg: string) {
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}

/**
 * 下载文件
 */
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * 将 SVG 转换为 PNG
 */
async function svgToPng(svg: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = () => {
      reject(new Error('Failed to load SVG image'));
    };

    const blob = new Blob([svg], { type: 'image/svg+xml' });
    img.src = URL.createObjectURL(blob);
  });
}

/**
 * 创建 Mermaid 渲染器
 */
export function createMermaidRenderer(mermaidTheme: 'default' | 'dark' | 'base' | 'forest' | 'neutral' | 'null') {
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
