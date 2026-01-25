/**
 * Virtual Scrolled Markdown Renderer Component
 *
 * Renders large Markdown documents with virtual scrolling for optimal performance.
 * Only renders visible blocks, reducing DOM nodes and improving render performance.
 */

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { cn } from '../../utils/cn.js';
import { markdownToHTMLAsync, markdownToHTML } from '../../../parsers/index.js';
import { useVirtualScroll } from '../../hooks/useVirtualScroll.js';
import type { ParseResult } from '../../../types/parser.js';
import { MarkdownSkeleton } from './DelayedSpinner.js';

export interface MarkdownBlock {
  id: string;
  type: 'heading' | 'paragraph' | 'list' | 'code' | 'quote' | 'table' | 'divider' | 'mermaid' | 'html';
  content: string;
  html?: string;
  level?: number; // For headings
  language?: string; // For code blocks
  index: number;
  offset?: number; // Vertical offset in pixels
  estimatedHeight: number;
  isRendered: boolean;
}

export interface VirtualMarkdownRendererProps {
  /** Markdown content to render */
  content: string;
  /** Whether to enable virtual scrolling */
  enableVirtualScroll?: boolean;
  /** Estimated height per block (in pixels) */
  estimatedBlockHeight?: number;
  /** Overscan buffer (number of blocks to render outside viewport) */
  overscan?: number;
  /** Container height (in pixels or 'auto') */
  height?: number | string;
  /** Enable GFM features */
  enableGFM?: boolean;
  /** Enable frontmatter parsing */
  enableFrontmatter?: boolean;
  /** Enable code highlighting */
  enableHighlighting?: boolean;
  /** Enable math formulas */
  enableMath?: boolean;
  /** Syntax highlighting theme */
  highlightTheme?: string;
  /** Theme mode for mermaid diagrams */
  theme?: 'light' | 'dark' | 'auto';
  /** Additional CSS classes */
  className?: string;
  /** Callback when parsing completes */
  onParseComplete?: (result: ParseResult) => void;
  /** Callback when parsing fails */
  onParseError?: (error: Error) => void;
}

/**
 * Parse markdown into blocks
 */
function parseMarkdownToBlocks(content: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];
  const lines = content.split('\n');
  let currentBlock: Partial<MarkdownBlock> | null = null;
  let inCodeBlock = false;
  let codeBlockLanguage = '';
  let codeBlockContent: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Handle code blocks
    if (line.startsWith('```')) {
      if (!inCodeBlock) {
        // Start code block
        inCodeBlock = true;
        codeBlockLanguage = line.slice(3).trim() || 'text';
        codeBlockContent = [];
      } else {
        // End code block
        inCodeBlock = false;
        const codeContent = codeBlockContent.join('\n');
        blocks.push({
          id: `block-${blocks.length}`,
          type: 'code',
          content: codeContent,
          language: codeBlockLanguage,
          index: blocks.length,
          estimatedHeight: 200 + Math.min(codeContent.length * 0.5, 500), // Estimate based on content length
          isRendered: false,
        });
        codeBlockContent = [];
      }
      continue;
    }

    // Inside code block
    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    // Handle headings
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      if (currentBlock) {
        blocks.push(finishBlock(currentBlock, blocks.length));
      }
      const level = headingMatch[1].length;
      blocks.push({
        id: `block-${blocks.length}`,
        type: 'heading',
        content: headingMatch[2],
        level,
        index: blocks.length,
        estimatedHeight: 40 + level * 5,
        isRendered: false,
      });
      currentBlock = null;
      continue;
    }

    // Handle horizontal rules
    if (line.match(/^[-*_]{3,}\s*$/)) {
      if (currentBlock) {
        blocks.push(finishBlock(currentBlock, blocks.length));
      }
      blocks.push({
        id: `block-${blocks.length}`,
        type: 'divider',
        content: '',
        index: blocks.length,
        estimatedHeight: 20,
        isRendered: false,
      });
      currentBlock = null;
      continue;
    }

    // Handle blockquotes
    if (line.startsWith('>')) {
      if (currentBlock && currentBlock.type !== 'quote') {
        blocks.push(finishBlock(currentBlock, blocks.length));
      }
      if (!currentBlock || currentBlock.type !== 'quote') {
        currentBlock = {
          id: `block-${blocks.length}`,
          type: 'quote',
          content: '',
          index: blocks.length,
          estimatedHeight: 80,
          isRendered: false,
        };
      }
      currentBlock.content += line.slice(1).trim() + '\n';
      continue;
    }

    // Handle lists
    if (line.match(/^(\s*[-*+]|\s*\d+\.)\s+/)) {
      if (currentBlock && currentBlock.type !== 'list') {
        blocks.push(finishBlock(currentBlock, blocks.length));
      }
      if (!currentBlock || currentBlock.type !== 'list') {
        currentBlock = {
          id: `block-${blocks.length}`,
          type: 'list',
          content: '',
          index: blocks.length,
          estimatedHeight: 40,
          isRendered: false,
        };
      }
      currentBlock.content += line + '\n';
      continue;
    }

    // Handle tables
    if (line.includes('|')) {
      if (currentBlock && currentBlock.type !== 'table') {
        blocks.push(finishBlock(currentBlock, blocks.length));
      }
      if (!currentBlock || currentBlock.type !== 'table') {
        currentBlock = {
          id: `block-${blocks.length}`,
          type: 'table',
          content: '',
          index: blocks.length,
          estimatedHeight: 150,
          isRendered: false,
        };
      }
      currentBlock.content += line + '\n';
      continue;
    }

    // Handle mermaid diagrams
    if (line.trim().startsWith('```mermaid')) {
      if (currentBlock) {
        blocks.push(finishBlock(currentBlock, blocks.length));
      }
      blocks.push({
        id: `block-${blocks.length}`,
        type: 'mermaid',
        content: '',
        index: blocks.length,
        estimatedHeight: 300,
        isRendered: false,
      });
      currentBlock = {
        id: `block-${blocks.length}`,
        type: 'mermaid',
        content: '',
        index: blocks.length,
        estimatedHeight: 300,
        isRendered: false,
      };
      continue;
    }

    // Handle empty lines
    if (line.trim() === '') {
      if (currentBlock) {
        blocks.push(finishBlock(currentBlock, blocks.length));
        currentBlock = null;
      }
      continue;
    }

    // Handle paragraphs
    if (!currentBlock || currentBlock.type !== 'paragraph') {
      if (currentBlock) {
        blocks.push(finishBlock(currentBlock, blocks.length));
      }
      currentBlock = {
        id: `block-${blocks.length}`,
        type: 'paragraph',
        content: '',
        index: blocks.length,
        estimatedHeight: 30,
        isRendered: false,
      };
    }
    currentBlock.content += line + '\n';
  }

  // Finish last block
  if (currentBlock) {
    blocks.push(finishBlock(currentBlock, blocks.length));
  }

  return blocks;
}

/**
 * Finish a block and calculate its estimated height
 */
function finishBlock(block: Partial<MarkdownBlock>, index: number): MarkdownBlock {
  const contentLength = (block.content || '').length;
  let estimatedHeight = block.estimatedHeight || 30;

  // Adjust height based on content
  if (block.type === 'paragraph') {
    estimatedHeight = Math.max(30, Math.min(contentLength * 0.3, 200));
  } else if (block.type === 'code') {
    estimatedHeight = Math.max(100, Math.min(contentLength * 0.5, 800));
  } else if (block.type === 'quote') {
    estimatedHeight = Math.max(60, Math.min(contentLength * 0.4, 300));
  } else if (block.type === 'list') {
    const lines = block.content.split('\n').filter(l => l.trim());
    estimatedHeight = Math.max(40, lines.length * 30);
  } else if (block.type === 'table') {
    estimatedHeight = Math.max(100, contentLength * 0.5);
  }

  return {
    id: block.id || `block-${index}`,
    type: block.type || 'paragraph',
    content: block.content || '',
    level: block.level,
    language: block.language,
    index,
    estimatedHeight: Math.round(estimatedHeight),
    isRendered: false,
  };
}

/**
 * Virtual Markdown Renderer Component
 *
 * Renders large Markdown documents with virtual scrolling for optimal performance.
 *
 * @example
 * ```tsx
 * <VirtualMarkdownRenderer
 *   content={largeMarkdownContent}
 *   enableVirtualScroll={true}
 *   height={600}
 * />
 * ```
 */
export function VirtualMarkdownRenderer({
  content,
  enableVirtualScroll = true,
  estimatedBlockHeight = 50,
  overscan = 5,
  height = 'auto',
  enableGFM = true,
  enableFrontmatter = true,
  enableHighlighting = true,
  enableMath = true,
  highlightTheme = 'github',
  theme = 'auto',
  className,
  onParseComplete,
  onParseError,
}: VirtualMarkdownRendererProps) {
  const [blocks, setBlocks] = useState<MarkdownBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLoading, setShowLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [renderedBlocks, setRenderedBlocks] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const loadingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 延迟显示加载动画（300ms）
  useEffect(() => {
    if (loading) {
      loadingTimerRef.current = setTimeout(() => {
        setShowLoading(true);
      }, 300);
    } else {
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
        loadingTimerRef.current = null;
      }
      setShowLoading(false);
    }

    return () => {
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
      }
    };
  }, [loading]);

  // Parse markdown into blocks
  useEffect(() => {
    if (!content) {
      setBlocks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const parsedBlocks = parseMarkdownToBlocks(content);
      setBlocks(parsedBlocks);
      setLoading(false);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setLoading(false);
    }
  }, [content]);

  // Calculate total height
  const totalHeight = useMemo(() => {
    return blocks.reduce((sum, block) => sum + block.estimatedHeight, 0);
  }, [blocks]);

  // Virtual scroll hook
  const { visibleRange, scrollToItem, innerHeight } = useVirtualScroll({
    itemCount: blocks.length,
    estimatedItemHeight: estimatedBlockHeight,
    containerHeight: typeof height === 'number' ? height : 600,
    overscan,
    enabled: enableVirtualScroll && blocks.length > 20,
  });

  // Render a specific block
  const renderBlock = useCallback(async (block: MarkdownBlock) => {
    if (renderedBlocks.has(block.id)) return;

    try {
      let html = '';
      
      // Render block with markdown parser
      if (block.type === 'code') {
        html = `<pre><code class="language-${block.language || 'text'}">${escapeHtml(block.content)}</code></pre>`;
      } else if (block.type === 'heading') {
        const tag = `h${block.level || 1}`;
        html = `<${tag}>${block.content}</${tag}>`;
      } else if (block.type === 'quote') {
        html = `<blockquote>${block.content}</blockquote>`;
      } else if (block.type === 'list') {
        html = block.content;
      } else if (block.type === 'table') {
        html = block.content;
      } else if (block.type === 'divider') {
        html = '<hr />';
      } else if (block.type === 'paragraph') {
        html = `<p>${block.content}</p>`;
      } else {
        html = block.content;
      }

      setRenderedBlocks(prev => new Set(prev).add(block.id));
      
      // Update block HTML
      setBlocks(prev => prev.map(b => 
        b.id === block.id ? { ...b, html, isRendered: true } : b
      ));
    } catch (err) {
      console.error('Failed to render block:', err);
    }
  }, [renderedBlocks]);

  // Render visible blocks
  useEffect(() => {
    if (!enableVirtualScroll || blocks.length <= 20) return;

    const startIndex = visibleRange.start;
    const endIndex = visibleRange.end;

    blocks.slice(startIndex, endIndex).forEach(block => {
      renderBlock(block);
    });
  }, [visibleRange, blocks, enableVirtualScroll, renderBlock]);

  // Render all blocks when virtual scroll is disabled
  useEffect(() => {
    if (!enableVirtualScroll || blocks.length <= 20) {
      blocks.forEach(block => renderBlock(block));
    }
  }, [blocks, enableVirtualScroll, renderBlock]);

  // Calculate offset for each block
  const getBlockOffset = useCallback((index: number) => {
    let offset = 0;
    for (let i = 0; i < index; i++) {
      offset += blocks[i]?.estimatedHeight || 0;
    }
    return offset;
  }, [blocks]);

  // Get blocks to render
  const blocksToRender = useMemo(() => {
    if (!enableVirtualScroll || blocks.length <= 20) {
      return blocks;
    }

    const startIndex = Math.max(0, visibleRange.start);
    const endIndex = Math.min(blocks.length, visibleRange.end);
    
    return blocks.slice(startIndex, endIndex).map((block, i) => ({
      ...block,
      offset: getBlockOffset(startIndex + i),
    }));
  }, [blocks, enableVirtualScroll, visibleRange, getBlockOffset]);

  // Render loading state - 只在延迟后显示
  if (loading && showLoading) {
    return <MarkdownSkeleton className={className} />;
  }

  // 加载中但未到延迟时间，返回空占位
  if (loading) {
    return <div className={cn('min-h-[100px]', className)} />;
  }

  // Render error state
  if (error) {
    return (
      <div className={cn('flex flex-col items-center justify-center p-8 text-center', className)}>
        <div className="mb-4 rounded-full bg-destructive/10 p-3">
          <svg className="h-6 w-6 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="mb-2 font-semibold">Failed to Parse Markdown</h3>
        <p className="mb-4 max-w-md text-sm text-muted-foreground">{error.message}</p>
      </div>
    );
  }

  // Render empty state
  if (blocks.length === 0) {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        <p className="text-sm text-muted-foreground">No content to display</p>
      </div>
    );
  }

  // Render with virtual scroll
  if (enableVirtualScroll && blocks.length > 20) {
    return (
      <div
        ref={containerRef}
        className={cn('relative overflow-auto', className)}
        style={{ height: typeof height === 'number' ? `${height}px` : height }}
      >
        <div
          style={{
            height: totalHeight,
            position: 'relative',
          }}
        >
          {blocksToRender.map((block) => (
            <div
              key={block.id}
              style={{
                position: 'absolute',
                top: block.offset,
                left: 0,
                right: 0,
                minHeight: block.estimatedHeight,
              }}
              data-block-id={block.id}
              data-block-type={block.type}
            >
              {block.html ? (
                <div
                  className="markdown-block"
                  dangerouslySetInnerHTML={{ __html: block.html }}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                  Loading...
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Render without virtual scroll
  return (
    <div className={cn('markdown-content', className)}>
      {blocks.map((block) => (
        <div
          key={block.id}
          data-block-id={block.id}
          data-block-type={block.type}
          className="markdown-block"
        >
          {block.html ? (
            <div dangerouslySetInnerHTML={{ __html: block.html }} />
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              Loading...
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * Escape HTML entities
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}