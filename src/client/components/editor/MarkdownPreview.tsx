/**
 * Markdown Preview Component
 *
 * Displays rendered Markdown content with GFM support:
 * - Tables
 * - Task lists
 * - Strikethrough
 * - Autolinks
 * - Code blocks with syntax highlighting
 * - Math formulas (LaTeX)
 * - Frontmatter extraction
 */

import { useState, useEffect } from 'react';
import { cn } from '../../utils/cn.js';
import { markdownToHTML, type ParseResult } from '../../../parsers/index.js';
import {
  FiAlertCircle,
  FiRefreshCw,
  FiEye,
  FiFile,
} from 'react-icons/fi';
import type { ThemeMode } from '../../../types/theme.js';

export interface MarkdownPreviewProps {
  /** Markdown content to render */
  content: string;
  /** Theme mode (light/dark/auto) */
  theme?: ThemeMode;
  /** Show frontmatter if present */
  showFrontmatter?: boolean;
  /** Show copy button */
  showCopyButton?: boolean;
  /** Maximum height */
  maxHeight?: string | number;
  /** Enable math rendering */
  enableMath?: boolean;
  /** Enable GFM features */
  enableGfm?: boolean;
  /** Custom CSS class names */
  className?: string;
  /** On error callback */
  onError?: (error: Error) => void;
  /** On retry callback */
  onRetry?: () => void;
}

export interface MarkdownPreviewState {
  loading: boolean;
  error: Error | null;
  html: string;
  frontmatter?: Record<string, any>;
  metadata?: ParseResult['metadata'];
}

/**
 * Markdown Preview Component
 */
export function MarkdownPreview({
  content,
  showFrontmatter = false,
  showCopyButton = true,
  maxHeight,
  enableMath = true,
  enableGfm = true,
  className,
  onError,
  onRetry,
}: MarkdownPreviewProps) {
  const [state, setState] = useState<MarkdownPreviewState>({
    loading: true,
    error: null,
    html: '',
    frontmatter: undefined,
    metadata: undefined,
  });
  const [copied, setCopied] = useState(false);

  // Render markdown
  useEffect(() => {
    const renderMarkdown = async () => {
      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const html = markdownToHTML(content, {
          gfm: enableGfm,
          frontmatter: true,
          highlight: true,
          math: enableMath,
        });

        // Extract frontmatter from content (simple extraction)
        const frontmatter = extractFrontmatter(content);

        setState({
          loading: false,
          error: null,
          html,
          frontmatter,
          metadata: {
            codeBlocks: (content.match(/```[\s\S]*?```/g) || []).length,
            mathExpressions: (content.match(/\$\$[\s\S]*?\$\$|\$[^$\n]+?\$/g) || []).length,
            tables: (content.match(/\|.*\|/g) || []).length,
            taskListItems: (content.match(/- \[[ x]\]/g) || []).length,
            links: (content.match(/\[.*?\]\(.*?\)/g) || []).length,
            images: (content.match(/!\[.*?\]\(.*?\)/g) || []).length,
            parseTime: 0,
            hasFrontmatter: !!frontmatter,
          },
        });
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to render markdown');
        setState(prev => ({ ...prev, loading: false, error }));
        if (onError) {
          onError(error);
        }
      }
    };

    renderMarkdown();
  }, [content, enableMath, enableGfm, onError]);

  // Handle copy
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Render loading state
  if (state.loading) {
    return (
      <div className={cn('flex items-center justify-center py-12', className)}>
        <div className="flex flex-col items-center gap-3">
          <FiRefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Rendering markdown...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (state.error) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
        <FiAlertCircle className="mb-4 h-12 w-12 text-destructive" />
        <h2 className="mb-2 text-lg font-semibold">Rendering Error</h2>
        <p className="mb-4 max-w-md text-sm text-muted-foreground">
          {state.error.message}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <FiRefreshCw className="h-4 w-4" />
            Retry
          </button>
        )}
      </div>
    );
  }

  // Render empty state
  if (!content) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
        <FiFile className="mb-4 h-12 w-12 text-muted-foreground/50" />
        <h2 className="mb-2 text-lg font-semibold text-muted-foreground">
          No Content
        </h2>
        <p className="text-sm text-muted-foreground">
          This file appears to be empty.
        </p>
      </div>
    );
  }

  return (
    <div className={cn('markdown-preview', className)}>
      {/* Toolbar */}
      <div className="mb-4 flex items-center justify-between border-b pb-3">
        <div className="flex items-center gap-2">
          <FiEye className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Preview</span>
          {state.metadata && (
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {state.metadata.codeBlocks > 0 && (
                <span>{state.metadata.codeBlocks} code blocks</span>
              )}
              {state.metadata.tables > 0 && (
                <span>{state.metadata.tables} tables</span>
              )}
              {state.metadata.taskListItems > 0 && (
                <span>{state.metadata.taskListItems} tasks</span>
              )}
            </div>
          )}
        </div>
        {showCopyButton && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className={cn(
                'flex items-center gap-1.5 rounded px-2 py-1 text-xs transition-colors',
                'hover:bg-accent'
              )}
              title={copied ? 'Copied!' : 'Copy markdown source'}
            >
              {copied ? (
                <>
                  <span className="text-green-500">✓</span>
                  <span className="text-green-500">Copied!</span>
                </>
              ) : (
                <>
                  <span>Copy Source</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Frontmatter display */}
      {showFrontmatter && state.frontmatter && Object.keys(state.frontmatter).length > 0 && (
        <div className="mb-4 rounded-lg border bg-muted/50 p-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Frontmatter
          </h3>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            {Object.entries(state.frontmatter).map(([key, value]) => (
              <div key={key} className="flex">
                <dt className="font-medium text-muted-foreground after:mx-2 after:content-[':']">
                  {key}
                </dt>
                <dd className="text-foreground">
                  {Array.isArray(value) ? value.join(', ') : String(value)}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {/* Rendered markdown */}
      <div
        className={cn(
          'prose prose-sm dark:prose-invert max-w-none',
          'prose-headings:font-bold prose-headings:tracking-tight',
          'prose-h1:text-2xl prose-h1:mb-4',
          'prose-h2:text-xl prose-h2:mb-3',
          'prose-h3:text-lg prose-h3:mb-2',
          'prose-p:mb-3 prose-p:leading-relaxed',
          'prose-a:text-primary prose-a:underline prose-a:no-underline hover:prose-a:underline',
          'prose-strong:font-semibold',
          'prose-code:rounded prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:text-sm prose-code:font-mono',
          'prose-pre:bg-muted prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto',
          'prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic',
          'prose-ul:list-disc prose-ul:pl-6 prose-ul:mb-3',
          'prose-ol:list-decimal prose-ol:pl-6 prose-ol:mb-3',
          'prose-li:mb-1',
          'prose-table:my-3 prose-table:w-full prose-table:border-collapse',
          'prose-thead:border-b prose-thead:bg-muted/50',
          'prose-th:border prose-th:border-border prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:font-semibold',
          'prose-td:border prose-td:border-border prose-td:px-3 prose-td:py-2',
          'prose-img:rounded-lg prose-img:shadow-md',
          'prose-hr:my-4 prose-hr:border-border',
          // GFM task lists
          'prose-ul:prose-task-list',
          'prose-li:prose-task-item',
          '[&_.prose-task-item]:flex [&_.prose-task-item]:items-start [&_.prose-task-item]:gap-2',
          '[&_.prose-task-item>input]:mt-1 [&_.prose-task-item>input]:h-4 [&_.prose-task-item>input]:w-4',
          // Table styles
          'prose-table:text-sm',
          'hover:prose-tr:bg-muted/30',
          // Math formulas
          '[&_katex-display]:my-4 [&_katex-display]:overflow-x-auto',
          '[&_katex]:px-1',
        )}
        style={{
          maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight,
        }}
        dangerouslySetInnerHTML={{ __html: state.html }}
      />

      {/* Metadata footer */}
      {state.metadata && (
        <div className="mt-4 border-t pt-3 text-xs text-muted-foreground">
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {state.metadata.codeBlocks > 0 && (
              <span>Code blocks: {state.metadata.codeBlocks}</span>
            )}
            {state.metadata.links > 0 && (
              <span>Links: {state.metadata.links}</span>
            )}
            {state.metadata.images > 0 && (
              <span>Images: {state.metadata.images}</span>
            )}
            {state.metadata.tables > 0 && (
              <span>Tables: {state.metadata.tables}</span>
            )}
            {state.metadata.taskListItems > 0 && (
              <span>Tasks: {state.metadata.taskListItems}</span>
            )}
            {state.metadata.mathExpressions > 0 && (
              <span>Math expressions: {state.metadata.mathExpressions}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Simple frontmatter extractor
 * Extracts YAML frontmatter from markdown content
 */
function extractFrontmatter(content: string): Record<string, any> | undefined {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return undefined;
  }

  const yaml = match[1];
  if (!yaml) {
    return undefined;
  }

  const data: Record<string, any> = {};

  try {
    const lines = yaml.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const colonIndex = trimmed.indexOf(':');
      if (colonIndex === -1) continue;

      const key = trimmed.slice(0, colonIndex).trim();
      const rawValue = trimmed.slice(colonIndex + 1).trim();

      // Parse value
      let parsedValue: any = rawValue;

      if (rawValue.startsWith('[') && rawValue.endsWith(']')) {
        // Array
        parsedValue = rawValue.slice(1, -1).split(',').map(v => v.trim().replace(/^['"]|['"]$/g, ''));
      } else if (rawValue === 'true') {
        parsedValue = true;
      } else if (rawValue === 'false') {
        parsedValue = false;
      } else if (!isNaN(Number(rawValue))) {
        parsedValue = Number(rawValue);
      } else if (rawValue.startsWith('"') && rawValue.endsWith('"')) {
        parsedValue = rawValue.slice(1, -1);
      } else if (rawValue.startsWith("'") && rawValue.endsWith("'")) {
        parsedValue = rawValue.slice(1, -1);
      }

      data[key] = parsedValue;
    }

    return Object.keys(data).length > 0 ? data : undefined;
  } catch (err) {
    console.warn('Failed to extract frontmatter:', err);
    return undefined;
  }
}

export default MarkdownPreview;