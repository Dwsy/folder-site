import { useState } from 'react';
import { FaExclamationTriangle, FaSync, FaBug, FaHome, FaCopy, FaCheck } from 'react-icons/fa';
import { Link } from 'react-router-dom';

export interface ErrorFallbackProps {
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorId: string;
  onReset?: () => void;
  onReload?: () => void;
  onGoHome?: () => void;
  onCopyError?: () => void;
  showDetails?: boolean;
}

/**
 * 错误回退 UI 组件
 * 遵循 Vercel 设计指南：
 * - 清晰的错误消息
 * - 以行动为导向的语言
 * - 良好的无障碍性
 */
export function ErrorFallback({
  error,
  errorInfo,
  errorId,
  onReset,
  showDetails = true,
}: ErrorFallbackProps) {
  const [copied, setCopied] = useState(false);
  const isDevelopment = import.meta.env.DEV;

  // 复制错误信息到剪贴板
  const handleCopyError = async () => {
    const errorText = `Error ID: ${errorId}
Time: ${new Date().toISOString()}
URL: ${window.location.href}

Error: ${error?.toString() || 'Unknown error'}

Component Stack:
${errorInfo?.componentStack || 'N/A'}

Stack Trace:
${error?.stack || 'N/A'}`;

    try {
      await navigator.clipboard.writeText(errorText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy error:', err);
    }
  };

  // 刷新页面
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-background p-4"
      role="alert"
      aria-live="assertive"
    >
      <div className="max-w-2xl w-full rounded-lg border border-border bg-card p-8 shadow-lg">
        {/* 错误图标和标题 */}
        <div className="mb-6 flex items-center gap-4">
          <div className="rounded-full bg-destructive/10 p-4" aria-hidden="true">
            <FaExclamationTriangle className="h-8 w-8 text-destructive" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Something went wrong</h1>
            <p className="text-sm text-muted-foreground">Error ID: {errorId}</p>
          </div>
        </div>

        {/* 错误消息 */}
        <div className="mb-6 rounded-md bg-muted/50 p-4">
          <p className="text-sm text-foreground">
            {error?.message || 'An unexpected error occurred. Please try refreshing the page.'}
          </p>
        </div>

        {/* 错误详情（开发环境或手动启用） */}
        {showDetails && (isDevelopment || error) && (
          <details className="mb-6 group">
            <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground hover:text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded">
              <FaBug className="h-4 w-4" aria-hidden="true" />
              Error details
            </summary>

            <div className="mt-4 space-y-4">
              {/* 错误对象 */}
              {error && (
                <div>
                  <h3 className="mb-2 text-xs font-semibold text-muted-foreground uppercase">
                    Error
                  </h3>
                  <pre
                    className="overflow-auto rounded-md bg-muted p-3 text-xs"
                    role="region"
                    aria-label="Error details"
                  >
                    <code className="text-destructive">{error.toString()}</code>
                  </pre>
                </div>
              )}

              {/* 组件堆栈 */}
              {errorInfo?.componentStack && (
                <div>
                  <h3 className="mb-2 text-xs font-semibold text-muted-foreground uppercase">
                    Component Stack
                  </h3>
                  <pre
                    className="overflow-auto rounded-md bg-muted p-3 text-xs"
                    role="region"
                    aria-label="Component stack"
                  >
                    <code className="text-muted-foreground">{errorInfo.componentStack}</code>
                  </pre>
                </div>
              )}

              {/* 错误堆栈 */}
              {error?.stack && isDevelopment && (
                <div>
                  <h3 className="mb-2 text-xs font-semibold text-muted-foreground uppercase">
                    Stack Trace
                  </h3>
                  <pre
                    className="overflow-auto rounded-md bg-muted p-3 text-xs"
                    role="region"
                    aria-label="Stack trace"
                  >
                    <code className="text-muted-foreground">{error.stack}</code>
                  </pre>
                </div>
              )}

              {/* 诊断信息 */}
              <div className="rounded-md bg-muted/50 p-3">
                <h3 className="mb-2 text-xs font-semibold text-muted-foreground uppercase">
                  Diagnostic Info
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">URL:</span>{' '}
                    <span className="text-foreground break-all">{window.location.href}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Time:</span>{' '}
                    <span className="text-foreground">{new Date().toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">User Agent:</span>{' '}
                    <span className="text-foreground break-all">{navigator.userAgent}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Environment:</span>{' '}
                    <span className="text-foreground">{isDevelopment ? 'Development' : 'Production'}</span>
                  </div>
                </div>
              </div>

              {/* 复制错误按钮 */}
              <button
                onClick={handleCopyError}
                className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label="Copy error information to clipboard"
              >
                {copied ? (
                  <>
                    <FaCheck className="h-3 w-3 text-green-500" aria-hidden="true" />
                    Copied!
                  </>
                ) : (
                  <>
                    <FaCopy className="h-3 w-3" aria-hidden="true" />
                    Copy error details
                  </>
                )}
              </button>
            </div>
          </details>
        )}

        {/* 操作按钮 */}
        <div className="flex flex-col gap-3 sm:flex-row">
          {onReset && (
            <button
              onClick={onReset}
              className="flex flex-1 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <FaSync className="h-4 w-4" aria-hidden="true" />
              Try again
            </button>
          )}

          <button
            onClick={handleReload}
            className="flex flex-1 items-center justify-center gap-2 rounded-md border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <FaSync className="h-4 w-4" aria-hidden="true" />
            Reload page
          </button>

          <Link
            to="/"
            className="flex flex-1 items-center justify-center gap-2 rounded-md border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <FaHome className="h-4 w-4" aria-hidden="true" />
            Go Home
          </Link>
        </div>

        {/* 帮助文本 */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          If this problem persists, please contact support with the Error ID above.
        </p>
      </div>
    </div>
  );
}