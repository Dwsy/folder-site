/**
 * Content Display Component
 *
 * Main component for displaying file content with support for:
 * - Syntax highlighting (code mode)
 * - Markdown rendering (preview mode)
 * - Plain text display (raw mode)
 * - Loading, error, and empty states
 */

import { useState, useMemo, memo } from 'react';
import { CodeBlock } from './CodeBlock.js';
import { MarkdownPreview } from './MarkdownPreview.js';
import { PDFExportButtonCompact } from './PDFExportButton.js';
import { HTMLExportButtonCompact } from './HTMLExportButton.js';
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
import type { ThemeMode } from '../../../types/theme.js';
import { DelayedSpinner, Skeleton } from './DelayedSpinner.js';

/**
 * Loading Spinner Component - 使用延迟显示
 */
function LoadingSpinner({ message }: { message?: string }) {
  return (
    <DelayedSpinner
      delay={300}
      message={message || 'Loading content...'}
      useSkeleton={true}
      skeletonLines={5}
    />
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
export const ContentDisplay = React.memo(function ContentDisplay({
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
  // Determine theme mode from theme name
  const themeMode: ThemeMode = theme === 'dark' ? 'dark' : theme === 'light' ? 'light' : 'auto';
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
          {/* PDF Export Button - only show for markdown content */}
          {language === 'markdown' && (
            <PDFExportButtonCompact
              content={content}
              filename={filename ? filename.replace(/\.[^/.]+$/, '.pdf') : 'document.pdf'}
              theme={themeMode}
              options={{
                title: filename,
              }}
            />
          )}
          {/* HTML Export Button - only show for markdown content */}
          {language === 'markdown' && (
            <HTMLExportButtonCompact
              content={content}
              filename={filename ? filename.replace(/\.[^/.]+$/, '.html') : 'document.html'}
              theme={themeMode}
              options={{
                title: filename,
              }}
            />
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
          maxHeight && 'overflow-auto',
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
            <MarkdownPreview
              content={content}
              theme={themeMode}
              showCopyButton={false}
              showFrontmatter={false}
              enableMath={true}
              enableGfm={true}
              className="border-0 p-0"
            />
          </div>
        )}
      </div>
    </div>
  );
});

