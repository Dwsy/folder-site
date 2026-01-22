/**
 * Markdown Renderer Component
 *
 * Renders Markdown content using the unified processing pipeline with support for:
 * - GFM (GitHub Flavored Markdown) - tables, task lists, strikethrough, autolinks
 * - Frontmatter (YAML metadata)
 * - Code syntax highlighting
 * - LaTeX math formulas (KaTeX)
 * - Mermaid diagrams
 * - Theme-aware styling
 * - Custom plugins support
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { cn } from '../../utils/cn.js';
import { markdownToHTMLAsync, markdownToHTML } from '../../../parsers/index.js';
import type { ParseResult } from '../../../types/parser.js';

// 动态导入 mermaid（仅在客户端）
let mermaidInstance: any = null;
let currentMermaidTheme: string = 'default';

async function initMermaid(theme: string = 'default') {
  if (typeof window === 'undefined') return;
  if (mermaidInstance && currentMermaidTheme === theme) return mermaidInstance;

  try {
    const mermaid = (await import('mermaid')).default;
    mermaid.initialize({
      startOnLoad: false,
      theme: theme,
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
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mermaid Chart</title>
  <style>
    body {
      margin: 0;
      padding: 20px;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: #f5f5f5;
    }
    svg {
      max-width: 100%;
      height: auto;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    @media (prefers-color-scheme: dark) {
      body {
        background: #1a1a1a;
      }
      svg {
        background: #2a2a2a;
      }
    }
  </style>
</head>
<body>
  ${svg}
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
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
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }

    const img = new Image();
    const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      // 获取 SVG 尺寸
      const parser = new DOMParser();
      const doc = parser.parseFromString(svg, 'image/svg+xml');
      const svgElement = doc.querySelector('svg');
      const width = svgElement?.getAttribute('width') || img.width;
      const height = svgElement?.getAttribute('height') || img.height;

      // 设置画布大小
      canvas.width = parseInt(width as string) || img.width;
      canvas.height = parseInt(height as string) || img.height;

      // 绘制白色背景
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 绘制 SVG
      ctx.drawImage(img, 0, 0);

      // 转换为 PNG
      const png = canvas.toDataURL('image/png');
      URL.revokeObjectURL(url);
      resolve(png);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load SVG'));
    };

    img.src = url;
  });
}

export interface MarkdownRendererProps {
  /** Markdown content to render */
  content: string;
  /** Whether to enable GFM features */
  enableGFM?: boolean;
  /** Whether to parse frontmatter */
  enableFrontmatter?: boolean;
  /** Whether to enable code highlighting */
  enableHighlighting?: boolean;
  /** Whether to enable math formulas */
  enableMath?: boolean;
  /** Syntax highlighting theme */
  highlightTheme?: string;
  /** Theme mode for mermaid diagrams */
  theme?: 'light' | 'dark' | 'auto';
  /** Additional CSS classes */
  className?: string;
  /** Custom HTML class prefix */
  classPrefix?: string;
  /** Callback when parsing completes */
  onParseComplete?: (result: ParseResult) => void;
  /** Callback when parsing fails */
  onParseError?: (error: Error) => void;
  /** Whether to render asynchronously */
  async?: boolean;
}

export interface MarkdownRendererState {
  html: string | null;
  loading: boolean;
  error: Error | null;
  parseTime: number;
}

/**
 * Markdown Renderer Component
 *
 * @example
 * ```tsx
 * <MarkdownRenderer
 *   content="# Hello World\n\nThis is **bold** text."
 *   enableGFM={true}
 *   enableHighlighting={true}
 *   className="prose dark:prose-invert"
 * />
 * ```
 */
export function MarkdownRenderer({
  content,
  enableGFM = true,
  enableFrontmatter = true,
  enableHighlighting = true,
  enableMath = true,
  highlightTheme = 'github',
  theme = 'auto',
  className,
  classPrefix = '',
  onParseComplete,
  onParseError,
  async: asyncRender = true,
}: MarkdownRendererProps) {
  const [state, setState] = useState<MarkdownRendererState>({
    html: null,
    loading: true,
    error: null,
    parseTime: 0,
  });

  const mermaidRef = useRef<HTMLDivElement>(null);

  // 渲染 Mermaid 图表
  useEffect(() => {
    if (!state.html || !mermaidRef.current) return;

    // 确定当前主题
    const isDark = theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    const mermaidTheme = isDark ? 'dark' : 'default';

    const renderMermaidDiagrams = async () => {
      const mermaid = await initMermaid(mermaidTheme);
      if (!mermaid) return;

      const container = mermaidRef.current;
      if (!container) return;

      // 查找所有 mermaid 代码块
      const mermaidBlocks = container.querySelectorAll('pre.mermaid code');

      for (const block of Array.from(mermaidBlocks)) {
        const code = block.textContent || '';
        if (!code.trim()) continue;

        // 生成唯一 ID
        const id = `mermaid-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

        try {
          // 渲染图表
          const { svg } = await mermaid.render(id, code);

          // 替换原始代码块为 SVG
          const preElement = block.closest('pre');
          if (preElement && preElement.parentNode) {
            const wrapper = document.createElement('div');
            wrapper.className = 'mermaid-wrapper group';

            // 创建 SVG 容器
            const svgContainer = document.createElement('div');
            svgContainer.className = 'mermaid-svg';
            svgContainer.innerHTML = svg;

            // 创建操作栏
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

            // 添加事件监听
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
          // 显示错误信息
          const preElement = block.closest('pre');
          if (preElement) {
            preElement.classList.add('mermaid-error');
            preElement.title = `Mermaid rendering error: ${error instanceof Error ? error.message : String(error)}`;
          }
        }
      }
    };

    renderMermaidDiagrams();
  }, [state.html, theme]);

  // Memoize the parser options
  const parserOptions = useMemo(
    () => ({
      gfm: enableGFM,
      frontmatter: enableFrontmatter,
      highlight: enableHighlighting,
      math: enableMath,
      mermaid: true,
      highlightTheme,
      preserveContent: true,
      generateHTML: true,
    }),
    [
      enableGFM,
      enableFrontmatter,
      enableHighlighting,
      enableMath,
      highlightTheme,
    ]
  );

  // Parse markdown content
  useEffect(() => {
    if (!content || typeof content !== 'string') {
      setState({
        html: '',
        loading: false,
        error: null,
        parseTime: 0,
      });
      return;
    }

    const parseMarkdown = async () => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const startTime = performance.now();

      try {
        let html: string;

        if (asyncRender) {
          html = await markdownToHTMLAsync(content, parserOptions);
        } else {
          html = await markdownToHTML(content, parserOptions);
        }

        const parseTime = performance.now() - startTime;

        setState({
          html,
          loading: false,
          error: null,
          parseTime,
        });

        // Notify callback if available
        if (onParseComplete) {
          onParseComplete({
            ast: {} as any, // Not exposing AST in renderer
            html,
            content,
            metadata: {
              codeBlocks: (content.match(/```[\s\S]*?```/g) || []).length,
              mathExpressions: (content.match(/\$\$[\s\S]*?\$\$|\$[^$\n]+?\$/g) || []).length,
              tables: (content.match(/\|.*\|/g) || []).length,
              taskListItems: (content.match(/- \[[ x]\]/g) || []).length,
              links: (content.match(/\[.*?\]\(.*?\)/g) || []).length,
              images: (content.match(/!\[.*?\]\(.*?\)/g) || []).length,
              parseTime,
              hasFrontmatter: content.startsWith('---'),
            },
          });
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error('Markdown parsing error:', err);
        setState({
          html: null,
          loading: false,
          error: err,
          parseTime: performance.now() - startTime,
        });

        if (onParseError) {
          onParseError(err);
        }
      }
    };

    parseMarkdown();
  }, [content, parserOptions, asyncRender, onParseComplete, onParseError]);

  // Render loading state
  if (state.loading) {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Rendering Markdown...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (state.error) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center p-8 text-center',
          className
        )}
      >
        <div className="mb-4 rounded-full bg-destructive/10 p-3">
          <svg
            className="h-6 w-6 text-destructive"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="mb-2 font-semibold">Failed to Render Markdown</h3>
        <p className="mb-4 max-w-md text-sm text-muted-foreground">
          {state.error.message}
        </p>
        <details className="text-left">
          <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
            Show raw content
          </summary>
          <pre className="mt-2 overflow-auto rounded-md bg-muted p-4 text-xs">
            {content}
          </pre>
        </details>
      </div>
    );
  }

  // Render empty state
  if (!state.html) {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        <p className="text-sm text-muted-foreground">No content to display</p>
      </div>
    );
  }

  // Render markdown HTML
  return (
    <div
      className={cn(
        'markdown-content',
        className
      )}
      style={{ '--class-prefix': classPrefix } as React.CSSProperties}
      dangerouslySetInnerHTML={{ __html: state.html }}
      ref={mermaidRef}
    />
  );
}

/**
 * Props for the inline markdown renderer (lightweight version)
 */
export interface MarkdownInlineProps {
  /** Inline markdown content */
  children: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Inline Markdown Renderer
 *
 * Lightweight renderer for inline markdown content (no async, minimal features)
 *
 * @example
 * ```tsx
 * <MarkdownInline>This is **bold** and *italic* text.</MarkdownInline>
 * ```
 */
export function MarkdownInline({
  children,
  className,
}: MarkdownInlineProps) {
  const html = useMemo(() => {
    return renderInlineMarkdown(children);
  }, [children]);

  return (
    <span
      className={cn('markdown-inline', className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/**
 * Render inline markdown (lightweight, synchronous)
 */
function renderInlineMarkdown(text: string): string {
  let html = text;

  // Escape HTML first
  html = escapeHtml(html);

  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');

  // Italic
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.+?)_/g, '<em>$1</em>');

  // Strikethrough
  html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm">$1</code>');

  // Links
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" class="text-primary hover:underline" target="_blank" rel="noopener noreferrer">$1</a>'
  );

  return html;
}

/**
 * Escape HTML entities
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Get default CSS for markdown content
 */
export function getMarkdownCSS(): string {
  return `
    .markdown-content {
      line-height: 1.7;
      word-wrap: break-word;
    }

    .markdown-content h1,
    .markdown-content h2,
    .markdown-content h3,
    .markdown-content h4,
    .markdown-content h5,
    .markdown-content h6 {
      margin-top: 1.5em;
      margin-bottom: 0.5em;
      font-weight: 600;
      line-height: 1.25;
    }

    .markdown-content h1 { font-size: 2em; border-bottom: 1px solid currentColor; padding-bottom: 0.3em; }
    .markdown-content h2 { font-size: 1.5em; border-bottom: 1px solid currentColor; padding-bottom: 0.3em; }
    .markdown-content h3 { font-size: 1.25em; }
    .markdown-content h4 { font-size: 1em; }

    .markdown-content p { margin: 1em 0; }

    .markdown-content a {
      color: currentColor;
      text-decoration: underline;
      text-decoration-color: rgba(128, 128, 128, 0.4);
      text-underline-offset: 2px;
    }

    .markdown-content a:hover {
      text-decoration-color: currentColor;
    }

    .markdown-content ul, .markdown-content ol { margin: 1em 0; padding-left: 2em; }
    .markdown-content li { margin: 0.5em 0; }

    .markdown-content ul li::marker { color: currentColor; }

    .markdown-content input[type="checkbox"] {
      margin-right: 0.5em;
      vertical-align: middle;
    }

    .markdown-content blockquote {
      margin: 1em 0;
      padding: 0.5em 1em;
      border-left: 4px solid currentColor;
      background: rgba(128, 128, 128, 0.1);
    }

    .markdown-content pre {
      margin: 1em 0;
      padding: 1em;
      overflow-x: auto;
      background: rgba(128, 128, 128, 0.1);
      border-radius: 0.5em;
    }

    .markdown-content code {
      font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
      font-size: 0.9em;
    }

    .markdown-content pre code {
      padding: 0;
      background: none;
    }

    .markdown-content :not(pre) > code {
      padding: 0.2em 0.4em;
      background: rgba(128, 128, 128, 0.1);
      border-radius: 0.25em;
    }

    .markdown-content table {
      width: 100%;
      margin: 1em 0;
      border-collapse: collapse;
    }

    .markdown-content th,
    .markdown-content td {
      padding: 0.5em 1em;
      border: 1px solid rgba(128, 128, 128, 0.3);
      text-align: left;
    }

    .markdown-content th {
      font-weight: 600;
      background: rgba(128, 128, 128, 0.1);
    }

    .markdown-content img {
      max-width: 100%;
      height: auto;
      margin: 1em 0;
    }

    .markdown-content hr {
      margin: 2em 0;
      border: none;
      border-top: 1px solid rgba(128, 128, 128, 0.3);
    }

    .markdown-content del {
      text-decoration: line-through;
      opacity: 0.7;
    }

    .markdown-content .mermaid-wrapper {
      margin: 1em 0;
      position: relative;
      display: inline-block;
      text-align: center;
    }

    .markdown-content .mermaid-svg {
      display: inline-block;
    }

    .markdown-content .mermaid-wrapper svg {
      max-width: 100%;
      height: auto;
    }

    .markdown-content .mermaid-toolbar {
      position: absolute;
      top: 8px;
      right: 8px;
      display: flex;
      gap: 4px;
      padding: 4px;
      background: rgba(0, 0, 0, 0.75);
      border-radius: 8px;
      backdrop-filter: blur(4px);
      z-index: 10;
      pointer-events: auto;
    }

    .markdown-content .mermaid-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      padding: 0;
      background: transparent;
      border: none;
      border-radius: 6px;
      color: #ffffff;
      cursor: pointer;
      transition: background-color 0.2s;
      pointer-events: auto;
    }

    .markdown-content .mermaid-btn:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    .markdown-content .mermaid-btn:active {
      background: rgba(255, 255, 255, 0.3);
      transform: scale(0.95);
    }

    .markdown-content .mermaid-btn svg {
      width: 18px;
      height: 18px;
      pointer-events: none;
    }

    .markdown-content .mermaid-error {
      border: 1px solid #ef4444;
      background: rgba(239, 68, 68, 0.1);
    }

    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      .markdown-content blockquote,
      .markdown-content pre,
      .markdown-content :not(pre) > code {
        background: rgba(255, 255, 255, 0.1);
      }

      .markdown-content th {
        background: rgba(255, 255, 255, 0.1);
      }

      .markdown-content th,
      .markdown-content td {
        border-color: rgba(255, 255, 255, 0.2);
      }

      .markdown-content hr {
        border-color: rgba(255, 255, 255, 0.2);
      }
    }
  `;
}