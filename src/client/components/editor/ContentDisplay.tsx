/**
 * Content Display Component
 *
 * Main component for displaying file content with support for:
 * - Syntax highlighting (code mode)
 * - Markdown rendering (preview mode)
 * - Plain text display (raw mode)
 * - Loading, error, and empty states
 */

import { useState, useMemo } from 'react';
import { CodeBlock } from './CodeBlock.js';
import { cn } from '../../utils/cn.js';
import {
  FiFileText,
  FiAlertCircle,
  FiRefreshCw,
  FiCopy,
  FiCode,
  FiEye,
  FiFile,
} from 'react-icons/fi';
import type {
  DisplayMode,
  ContentDisplaySimpleProps,
  ContentDisplayState,
} from '../../../types/editor.js';

/**
 * Loading Spinner Component
 */
function LoadingSpinner({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <FiRefreshCw className="mb-4 h-12 w-12 animate-spin text-primary" />
      <p className="text-muted-foreground">{message || 'Loading content...'}</p>
    </div>
  );
}

/**
 * Error State Component
 */
function ErrorState({
  error,
  onRetry,
}: {
  error: Error;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <FiAlertCircle className="mb-4 h-12 w-12 text-destructive" />
      <h2 className="mb-2 text-xl font-semibold">Error Loading Content</h2>
      <p className="mb-4 max-w-md text-muted-foreground">{error.message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <FiRefreshCw className="h-4 w-4" />
          Retry
        </button>
      )}
    </div>
  );
}

/**
 * Empty State Component
 */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <FiFileText className="mb-4 h-12 w-12 text-muted-foreground/50" />
      <h2 className="mb-2 text-xl font-semibold text-muted-foreground">
        No Content
      </h2>
      <p className="text-sm text-muted-foreground">
        This file appears to be empty.
      </p>
    </div>
  );
}

/**
 * File Metadata Component
 */
function FileMetadata({
  filename,
  language,
  lineCount,
  size,
}: {
  filename?: string;
  language?: string;
  lineCount?: number;
  size?: number;
}) {
  return (
    <div className="flex items-center gap-4 border-b px-4 py-2 text-sm">
      {filename && (
        <div className="flex items-center gap-2">
          <FiFile className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{filename}</span>
        </div>
      )}
      {language && (
        <div className="flex items-center gap-2">
          <FiCode className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">{language}</span>
        </div>
      )}
      {lineCount !== undefined && (
        <div className="text-muted-foreground">{lineCount} lines</div>
      )}
      {size !== undefined && (
        <div className="text-muted-foreground">{formatSize(size)} bytes</div>
      )}
    </div>
  );
}

/**
 * Format file size
 */
function formatSize(bytes: number): string {
  if (bytes === 0) return '0';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Main Content Display Component
 */
export function ContentDisplay({
  content = '',
  language = 'text',
  filename,
  loading = false,
  error = null,
  displayMode = 'code',
  showLineNumbers = true,
  showCopyButton = true,
  maxHeight,
  wrapLines = false,
  theme = 'github',
  onRetry,
  renderCustom,
  className,
}: ContentDisplaySimpleProps) {
  const [selectedMode, setSelectedMode] = useState<DisplayMode>(displayMode);
  const [copied, setCopied] = useState(false);

  // Determine current state
  const state: ContentDisplayState = loading
    ? 'loading'
    : error
    ? 'error'
    : !content
    ? 'empty'
    : 'loaded';

  // Calculate line count
  const lineCount = useMemo(() => {
    return content ? content.split('\n').length : 0;
  }, [content]);

  // Calculate content size
  const contentSize = useMemo(() => {
    return new Blob([content]).size;
  }, [content]);

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
  if (state === 'loading') {
    return (
      <div className={cn('rounded-lg border bg-card p-6', className)}>
        <LoadingSpinner />
      </div>
    );
  }

  // Render error state
  if (state === 'error') {
    return (
      <div className={cn('rounded-lg border bg-card p-6', className)}>
        <ErrorState error={error as Error} onRetry={onRetry} />
      </div>
    );
  }

  // Render empty state
  if (state === 'empty') {
    return (
      <div className={cn('rounded-lg border bg-card p-6', className)}>
        <EmptyState />
      </div>
    );
  }

  // Render custom content if provided
  if (renderCustom) {
    return (
      <div className={cn('rounded-lg border bg-card', className)}>
        {renderCustom(content)}
      </div>
    );
  }

  // Render content based on mode
  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg border bg-card',
        className
      )}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-2">
          {showCopyButton && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded px-2 py-1 text-sm transition-colors hover:bg-accent"
              title={copied ? 'Copied!' : 'Copy to clipboard'}
            >
              {copied ? (
                <>
                  <FiCopy className="h-4 w-4 text-green-500" />
                  <span className="text-green-500">Copied!</span>
                </>
              ) : (
                <>
                  <FiCopy className="h-4 w-4" />
                  <span>Copy</span>
                </>
              )}
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 rounded-md bg-muted p-1">
          <button
            onClick={() => setSelectedMode('code')}
            className={cn(
              'flex items-center gap-1.5 rounded px-2 py-1 text-sm transition-colors',
              selectedMode === 'code'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
            title="Code view"
          >
            <FiCode className="h-4 w-4" />
            <span>Code</span>
          </button>
          <button
            onClick={() => setSelectedMode('preview')}
            disabled={language !== 'markdown'}
            className={cn(
              'flex items-center gap-1.5 rounded px-2 py-1 text-sm transition-colors',
              selectedMode === 'preview'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
              language !== 'markdown' && 'cursor-not-allowed opacity-50'
            )}
            title="Preview view"
          >
            <FiEye className="h-4 w-4" />
            <span>Preview</span>
          </button>
          <button
            onClick={() => setSelectedMode('raw')}
            className={cn(
              'flex items-center gap-1.5 rounded px-2 py-1 text-sm transition-colors',
              selectedMode === 'raw'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
            title="Raw view"
          >
            <FiFile className="h-4 w-4" />
            <span>Raw</span>
          </button>
        </div>
      </div>

      {/* File metadata */}
      <FileMetadata
        filename={filename}
        language={language}
        lineCount={lineCount}
        size={contentSize}
      />

      {/* Content */}
      <div
        className={cn(
          'overflow-auto',
          maxHeight && `max-h-[${maxHeight}]`
        )}
        style={maxHeight ? { maxHeight } : undefined}
      >
        {selectedMode === 'code' || selectedMode === 'raw' ? (
          <CodeBlock
            code={content}
            language={language as any}
            filename={filename}
            showLineNumbers={showLineNumbers}
            showCopyButton={false}
            wrapLines={wrapLines}
            theme={theme}
          />
        ) : (
          <div className="p-6">
            <div
              className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{
                __html: renderMarkdownPreview(content),
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Simple markdown preview renderer
 * Note: This is a basic implementation. For full markdown support,
 * integrate with a markdown parser like remark/rehype.
 */
function renderMarkdownPreview(markdown: string): string {
  // Basic markdown to HTML conversion
  let html = markdown
    // Headers
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*)\*/gim, '<em>$1</em>')
    // Code blocks
    .replace(/```(\w+)?\n([\s\S]*?)```/gim, '<pre><code>$2</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/gim, '<code class="bg-muted px-1 py-0.5 rounded">$1</code>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" class="text-primary hover:underline">$1</a>')
    // Line breaks
    .replace(/\n/gim, '<br />');

  return html;
}