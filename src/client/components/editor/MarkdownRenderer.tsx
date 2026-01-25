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

import { useState, useEffect, useMemo, useRef, memo } from 'react';
import { cn } from '../../utils/cn.js';
import { markdownToHTMLAsync, markdownToHTML } from '../../../parsers/index.js';
import type { ParseResult } from '../../../types/parser.js';
import { usePluginRenderer } from '../../hooks/usePluginRenderer.js';
import {
  createMermaidRenderer,
  createInfographicRenderer,
  createVegaRenderer,
  createGraphvizRenderer,
  createJsonCanvasRenderer,
  createSvgRenderer,
} from './renderers/index.js';
import { initCodeLanguageIcons, observeCodeBlocks } from '../../lib/code-language-icons.js';
import { MarkdownSkeleton } from './DelayedSpinner.js';

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
  showLoading: boolean; // 是否显示加载动画
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
    showLoading: false,
  });

  // 延迟显示加载动画（300ms）
  const loadingTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (state.loading) {
      // 开始加载时，设置延迟显示加载动画
      loadingTimerRef.current = setTimeout(() => {
        setState(prev => ({ ...prev, showLoading: true }));
      }, 300);
    } else {
      // 加载完成时，清除定时器并隐藏加载动画
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
        loadingTimerRef.current = null;
      }
      setState(prev => ({ ...prev, showLoading: false }));
    }

    return () => {
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
      }
    };
  }, [state.loading]);

  // 使用插件渲染系统
  const isDark = theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const mermaidTheme = isDark ? 'dark' : 'default';

  const customRenderers = useMemo(() => ({
    'mermaid': createMermaidRenderer(mermaidTheme),
    'infographic': createInfographicRenderer(),
    'vega': createVegaRenderer(),
    'vega-lite': createVegaRenderer(),
    'graphviz': createGraphvizRenderer(),
    'json-canvas': createJsonCanvasRenderer(),
    'svg': createSvgRenderer(),
  }), [mermaidTheme]);

  const containerRef = usePluginRenderer(state.html, theme, customRenderers);

  // Initialize code language icons when HTML changes
  useEffect(() => {
    if (state.html && containerRef.current) {
      // 延迟执行，确保 DOM 已更新
      setTimeout(() => {
        initCodeLanguageIcons();
      }, 0);
    }
  }, [state.html]);

  // Observe code blocks for dynamic content
  useEffect(() => {
    observeCodeBlocks();
  }, []);

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
        showLoading: false,
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
          showLoading: false,
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
          showLoading: false,
        });

        if (onParseError) {
          onParseError(err);
        }
      }
    };

    parseMarkdown();
  }, [content, parserOptions, asyncRender, onParseComplete, onParseError]);

  // Render loading state - 只在延迟后显示
  if (state.loading && state.showLoading) {
    return <MarkdownSkeleton className={className} />;
  }

  // 加载中但未到延迟时间，返回空占位
  if (state.loading) {
    return <div className={cn('min-h-[100px]', className)} />;
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
      ref={containerRef}
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