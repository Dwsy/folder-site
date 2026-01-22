/**
 * Code Block Component
 *
 * Displays code with syntax highlighting, line numbers, and interactive features
 */

import { useState, useEffect, useMemo } from 'react';
import { cn } from '../../utils/cn.js';
import { FiCopy, FiCheck } from 'react-icons/fi';

export interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  showLineNumbers?: boolean;
  showCopyButton?: boolean;
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
  maxHeight,
  wrapLines = false,
  startLineNumber = 1,
  className,
  onCopy,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [highlightedCode, setHighlightedCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Calculate lines
  const lines = useMemo(() => {
    return code.split('\n');
  }, [code]);

  // Simple syntax highlighting (placeholder)
  // In production, integrate with Shiki or Prism.js
  useEffect(() => {
    const highlightCode = async () => {
      setLoading(true);
      try {
        // For now, use simple highlighting
        // In production, integrate with Shiki
        const highlighted = applySimpleHighlighting(code, language);
        setHighlightedCode(highlighted);
      } catch (err) {
        console.error('Highlighting error:', err);
        setHighlightedCode(escapeHtml(code));
      } finally {
        setLoading(false);
      }
    };

    highlightCode();
  }, [code, language]);

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

  // Escape HTML
  const escapeHtml = (text: string) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  // Apply simple syntax highlighting
  const applySimpleHighlighting = (code: string, lang: string): string => {
    let html = escapeHtml(code);

    // Language-specific highlighting
    if (['javascript', 'typescript', 'js', 'ts'].includes(lang)) {
      // Keywords
      html = html.replace(
        /\b(const|let|var|function|return|if|else|for|while|class|import|export|from|async|await|try|catch|throw|new|this|typeof|instanceof)\b/g,
        '<span class="text-purple-500">$1</span>'
      );
      // Strings
      html = html.replace(
        /(['"`])((?:\\.|(?!\1)[^\\])*?)\1/g,
        '<span class="text-green-500">$1$2$1</span>'
      );
      // Comments
      html = html.replace(
        /(\/\/.*$)/gm,
        '<span class="text-gray-500">$1</span>'
      );
      html = html.replace(
        /(\/\*[\s\S]*?\*\/)/g,
        '<span class="text-gray-500">$1</span>'
      );
      // Numbers
      html = html.replace(
        /\b(\d+\.?\d*)\b/g,
        '<span class="text-blue-500">$1</span>'
      );
    } else if (['python', 'py'].includes(lang)) {
      // Keywords
      html = html.replace(
        /\b(def|class|if|else|elif|for|while|return|import|from|as|try|except|raise|with|lambda|yield|True|False|None|and|or|not|in|is)\b/g,
        '<span class="text-purple-500">$1</span>'
      );
      // Strings
      html = html.replace(
        /(['"])((?:\\.|(?!\1)[^\\])*?)\1/g,
        '<span class="text-green-500">$1$2$1</span>'
      );
      // Comments
      html = html.replace(
        /(#.*$)/gm,
        '<span class="text-gray-500">$1</span>'
      );
      // Numbers
      html = html.replace(
        /\b(\d+\.?\d*)\b/g,
        '<span class="text-blue-500">$1</span>'
      );
    } else if (['css', 'scss'].includes(lang)) {
      // Properties
      html = html.replace(
        /([a-z-]+)(\s*:)/g,
        '<span class="text-blue-500">$1</span>$2'
      );
      // Values
      html = html.replace(
        /:\s*([^;{]+)/g,
        ': <span class="text-green-500">$1</span>'
      );
      // Selectors
      html = html.replace(
        /^([.#]?[a-zA-Z][\w-]*)/gm,
        '<span class="text-purple-500">$1</span>'
      );
    } else if (['json'].includes(lang)) {
      // Keys
      html = html.replace(
        /"([^"]+)":/g,
        '<span class="text-blue-500">"$1"</span>:'
      );
      // String values
      html = html.replace(
        /:\s*"([^"]*)"/g,
        ': <span class="text-green-500">"$1"</span>'
      );
      // Numbers
      html = html.replace(
        /:\s*(\d+)/g,
        ': <span class="text-orange-500">$1</span>'
      );
      // Booleans
      html = html.replace(
        /:\s*(true|false|null)/g,
        ': <span class="text-purple-500">$1</span>'
      );
    }

    return html;
  };

  // Render loading state
  if (loading) {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative group',
        className
      )}
      role="region"
      aria-label={`Code block${filename ? ` for ${filename}` : ''}`}
    >
      {/* Copy button */}
      {showCopyButton && (
        <button
          onClick={handleCopy}
          className={cn(
            'absolute right-2 top-2 z-10 flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm transition-all',
            'bg-background/80 backdrop-blur-sm border shadow-sm',
            'opacity-0 group-hover:opacity-100',
            'hover:bg-background'
          )}
          title={copied ? 'Copied!' : 'Copy code'}
        >
          {copied ? (
            <>
              <FiCheck className="h-4 w-4 text-green-500" />
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

      {/* Code display */}
      <div
        className={cn(
          'relative font-mono text-sm',
          showLineNumbers && 'flex',
          wrapLines ? 'whitespace-pre-wrap' : 'whitespace-pre'
        )}
        style={{
          maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight,
        }}
      >
        {/* Line numbers */}
        {showLineNumbers && (
          <div className="sticky left-0 select-none border-r bg-muted/50 px-3 py-4 text-right text-muted-foreground">
            {lines.map((_, index) => (
              <div
                key={index}
                className="leading-6"
              >
                {startLineNumber + index}
              </div>
            ))}
          </div>
        )}

        {/* Code content */}
        <div className="flex-1 overflow-auto px-4 py-4">
          <pre className="m-0">
            <code
              dangerouslySetInnerHTML={{
                __html: highlightedCode || escapeHtml(code),
              }}
            />
          </pre>
        </div>
      </div>
    </div>
  );
}