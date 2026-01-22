/**
 * Code Block Component
 *
 * Displays code with syntax highlighting, line numbers, and interactive features
 * Uses Shiki for syntax highlighting with support for 100+ languages
 */

import { useState, useEffect, useMemo } from 'react';
import { cn } from '../../utils/cn.js';
import { FiCopy, FiCheck } from 'react-icons/fi';
import { MdWrapText } from 'react-icons/md';
import { getHighlighter } from '../../../server/lib/highlighter.js';
import type { CodeHighlightOptions } from '../../../types/highlighter.js';

export interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  showLineNumbers?: boolean;
  showCopyButton?: boolean;
  showWrapToggle?: boolean;
  maxHeight?: string | number;
  wrapLines?: boolean;
  startLineNumber?: number;
  theme?: string;
  className?: string;
  onCopy?: (code: string) => void;
}

/**
 * Code Block Component
 */
export function CodeBlock({
  code,
  language = 'text',
  filename,
  showLineNumbers = true,
  showCopyButton = true,
  showWrapToggle = true,
  maxHeight,
  wrapLines: initialWrapLines = false,
  startLineNumber = 1,
  theme = 'github-dark',
  className,
  onCopy,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [wrapLines, setWrapLines] = useState(initialWrapLines);
  const [highlightedCode, setHighlightedCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate lines
  const lines = useMemo(() => {
    return code.split('\n');
  }, [code]);

  // Highlight code using Shiki
  useEffect(() => {
    const highlightCode = async () => {
      setLoading(true);
      setError(null);
      try {
        const highlighter = getHighlighter();
        const options: CodeHighlightOptions = {
          lang: language as any, // Language is validated by Shiki
          theme: theme as any, // Theme is validated by Shiki
          lineNumbers: false, // We handle line numbers separately
          startLineNumber,
        };

        const html = await highlighter.codeToHtml(code, options);
        setHighlightedCode(html);
      } catch (err) {
        console.error('Highlighting error:', err);
        setError('Failed to highlight code');
        // Fallback to escaped HTML
        setHighlightedCode(`<pre><code>${escapeHtml(code)}</code></pre>`);
      } finally {
        setLoading(false);
      }
    };

    highlightCode();
  }, [code, language, theme, startLineNumber]);

  // Handle copy
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      if (onCopy) {
        onCopy(code);
      }
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Toggle word wrap
  const handleToggleWrap = () => {
    setWrapLines((prev) => !prev);
  };

  // Escape HTML
  const escapeHtml = (text: string) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  // Render loading state
  if (loading) {
    return (
      <div className={cn('flex items-center justify-center p-8 bg-muted/30 rounded-lg', className)}>
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className={cn('p-4 bg-destructive/10 border border-destructive/20 rounded-lg', className)}>
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative group rounded-lg overflow-hidden border bg-muted/30',
        className
      )}
      role="region"
      aria-label={`Code block${filename ? ` for ${filename}` : ''}`}
    >
      {/* Header with filename and controls */}
      {(filename || showCopyButton || showWrapToggle) && (
        <div className="flex items-center justify-between gap-2 px-4 py-2 border-b bg-muted/50">
          {/* Filename */}
          {filename && (
            <div className="flex-1 text-sm font-medium text-muted-foreground truncate">
              {filename}
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center gap-1">
            {/* Word wrap toggle */}
            {showWrapToggle && (
              <button
                onClick={handleToggleWrap}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm transition-all',
                  'hover:bg-background border',
                  wrapLines && 'bg-primary/10 text-primary border-primary/20'
                )}
                title={wrapLines ? 'Disable word wrap' : 'Enable word wrap'}
                aria-label={wrapLines ? 'Disable word wrap' : 'Enable word wrap'}
                aria-pressed={wrapLines}
              >
                <MdWrapText className="h-4 w-4" />
                <span className="hidden sm:inline">Wrap</span>
              </button>
            )}

            {/* Copy button */}
            {showCopyButton && (
              <button
                onClick={handleCopy}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm transition-all',
                  'hover:bg-background border',
                  copied && 'bg-green-500/10 text-green-500 border-green-500/20'
                )}
                title={copied ? 'Copied!' : 'Copy code'}
                aria-label={copied ? 'Copied!' : 'Copy code'}
              >
                {copied ? (
                  <>
                    <FiCheck className="h-4 w-4" />
                    <span className="hidden sm:inline">Copied!</span>
                  </>
                ) : (
                  <>
                    <FiCopy className="h-4 w-4" />
                    <span className="hidden sm:inline">Copy</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Code display */}
      <div
        className={cn(
          'relative overflow-auto',
          showLineNumbers && 'flex'
        )}
        style={{
          maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight,
        }}
      >
        {/* Line numbers */}
        {showLineNumbers && (
          <div className="sticky left-0 select-none border-r bg-muted/50 px-3 py-4 text-right text-muted-foreground font-mono text-sm">
            {lines.map((_, index) => (
              <div
                key={index}
                className="leading-6"
                aria-hidden="true"
              >
                {startLineNumber + index}
              </div>
            ))}
          </div>
        )}

        {/* Code content */}
        <div
          className={cn(
            'flex-1 overflow-auto',
            wrapLines ? 'whitespace-pre-wrap break-words' : 'whitespace-pre'
          )}
        >
          <div
            className="shiki-wrapper"
            dangerouslySetInnerHTML={{
              __html: highlightedCode || '',
            }}
          />
        </div>
      </div>
    </div>
  );
}