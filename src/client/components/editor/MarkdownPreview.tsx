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
 * - Table of contents (TOC)
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
import { MarkdownTheme, getMarkdownBodyClass, getMarkdownThemeStyles } from './MarkdownTheme.js';
import { TOC, extractHeadings, addHeadingIdsWithItems, useActiveHeading, type TOCItem } from './TOC.js';
import { MarkdownRenderer } from './MarkdownRenderer.js';
import { useTOC } from '../../contexts/TOCContext.js';

export interface MarkdownPreviewProps {
  /** Markdown content to render */
  content: string;
  /** Theme mode (light/dark/auto) */
  theme?: ThemeMode;
  /** Show frontmatter if present */
  showFrontmatter?: boolean;
  /** Show copy button */
  showCopyButton?: boolean;
  /** Show table of contents */
  showTOC?: boolean;
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
  tocItems?: TOCItem[];
}

/**
 * Markdown Preview Component
 */
export function MarkdownPreview({
  content,
  theme,
  showFrontmatter = false,
  showCopyButton = true,
  showTOC = true,
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
  const { setHasTOC } = useTOC();

  // Track active heading - use tocItems directly (with IDs already added)
  const activeHeadingId = useActiveHeading(state.tocItems || [], 'main');

  // Update TOC visibility state
  useEffect(() => {
    const hasTOCItems = showTOC && state.tocItems && state.tocItems.length > 0;
    setHasTOC(hasTOCItems);
  }, [showTOC, state.tocItems, setHasTOC]);

  // Render markdown
  useEffect(() => {
    const renderMarkdown = async () => {
      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        // Determine theme for Shiki
        const isDark = theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        const shikiTheme = isDark ? 'github-dark' : 'github-light';

        console.log('[MarkdownPreview] Rendering markdown, length:', content.length);
        console.log('[MarkdownPreview] Theme:', theme, 'Shiki theme:', shikiTheme);

        const html = await markdownToHTML(content, {
          gfm: enableGfm,
          frontmatter: true,
          highlight: true,
          math: enableMath,
          mermaid: true,
          highlightTheme: shikiTheme,
        });

        console.log('[MarkdownPreview] HTML generated, length:', html.length);

        // Extract headings from HTML
        const tocItems = extractHeadings(html);
        console.log('[MarkdownPreview] Extracted TOC items:', tocItems);

        // Filter items by max level
        const filterByLevel = (item: TOCItem): TOCItem | null => {
          if (item.level > 3) return null;

          const filtered: TOCItem = {
            id: item.id,
            text: item.text,
            level: item.level,
          };

          if (item.children) {
            filtered.children = item.children
              .map(filterByLevel)
              .filter((child): child is TOCItem => child !== null);
          }

          return filtered;
        };

        const filteredItems = tocItems
          .map(filterByLevel)
          .filter((item): item is TOCItem => item !== null);

        console.log('[MarkdownPreview] Filtered items:', filteredItems);

        // Add IDs to headings and get items with IDs
        const { html: htmlWithIds, itemsWithIds } = addHeadingIdsWithItems(html, filteredItems);
        console.log('[MarkdownPreview] HTML with IDs generated, length:', htmlWithIds.length);
        console.log('[MarkdownPreview] Items with IDs count:', itemsWithIds.length);

        // Extract frontmatter from content (simple extraction)
        const frontmatter = extractFrontmatter(content);

        setState({
          loading: false,
          error: null,
          html: htmlWithIds,
          frontmatter,
          tocItems: itemsWithIds,
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
  }, [content, enableMath, enableGfm, onError, theme]);

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
      {/* Markdown Theme Provider */}
      <MarkdownTheme theme={theme || 'auto'} enabled={true} />

      {/* Table of Contents */}
      {showTOC && state.tocItems && state.tocItems.length > 0 && (
        <TOC
          items={state.tocItems}
          theme={theme || 'auto'}
          activeId={activeHeadingId}
          maxLevel={3}
          show={true}
          onSectionClick={(id) => {
            // Try to find element immediately
            let element = document.getElementById(id);
            // If not found, try again after a short delay (DOM might not be ready)
            if (!element) {
              setTimeout(() => {
                element = document.getElementById(id);
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                } else {
                  console.warn('[TOC] Element not found for id:', id);
                }
              }, 50);
            } else {
              element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }}
        />
      )}

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
      <MarkdownRenderer
        content={content}
        enableGFM={enableGfm}
        enableHighlighting={true}
        enableMath={enableMath}
        highlightTheme={theme === 'dark' ? 'github-dark' : 'github'}
        theme={theme || 'auto'}
        className={cn(
          getMarkdownBodyClass(theme || 'auto'),
          'p-6',
          // Custom enhancements
          'text-sm',
          // Code block styling - let Shiki handle the colors
          '[&_pre]:!m-0 [&_pre]:!rounded-lg [&_pre]:!border [&_pre]:!overflow-x-auto',
          '[&_code]:!m-0 [&_code]:!p-0 [&_code]:!bg-transparent',
          // Shiki wrapper styling
          '[&_.shiki-wrapper]:!m-0 [&&_.shiki-wrapper]:!my-4 [&&_.shiki-wrapper]:!rounded-lg [&&_.shiki-wrapper]:!overflow-x-auto [&&_.shiki-wrapper]:!border',
          '[&_.shiki-wrapper_pre]:!m-0 [&&_.shiki-wrapper_pre]:!p-4 [&&_.shiki-wrapper_pre]:!rounded-lg [&&_.shiki-wrapper_pre]:!overflow-x-auto',
          // Ensure Shiki colors are visible in light mode
          '[&_.shiki-wrapper]:[style*="background-color"]]',
          // Link styling
          '[&_a]:!text-primary [&_a]:!no-underline hover:[&_a]:!underline',
          // Image styling
          '[&_img]:!rounded-lg [&_img]:!shadow-md',
          // Blockquote styling
          '[&_blockquote]:!border-l-4 [&_blockquote]:!border-primary [&_blockquote]:!pl-4 [&_blockquote]:!italic',
          // Table styling enhancements
          '[&_table]:!my-4',
          // Task list styling
          '[&_.task-list-item]:!flex [&&_.task-list-item]:!items-start [&&_.task-list-item]:!gap-2',
          '[&_.task-list-item>input]:!mt-1 [&&_.task-list-item>input]:!h-4 [&&_.task-list-item>input]:!w-4',
        )}
        style={{
          maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight,
          ...getMarkdownThemeStyles(theme || 'auto'),
        }}
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

// Export TOC components for external use
export { TOC, extractHeadings, useActiveHeading };
export type { TOCItem };

export default MarkdownPreview;