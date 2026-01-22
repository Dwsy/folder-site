import { Component, ErrorInfo, ReactNode } from 'react';
import { FaExclamationTriangle, FaSync, FaBug, FaHome } from 'react-icons/fa';
import { Link } from 'react-router-dom';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // 生成唯一的错误ID用于追踪
    const errorId = `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return {
      hasError: true,
      error,
      errorInfo: null,
      errorId,
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // 记录错误详情
    const errorDetails = {
      errorId: this.state.errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    console.error('Error details:', errorDetails);

    // 调用自定义错误处理器
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // 更新状态
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  override render(): ReactNode {
    if (this.state.hasError) {
      // 使用自定义 fallback
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorInfo, errorId } = this.state;
      const showDetails = this.props.showDetails !== false; // 默认显示详情
      const isDevelopment = process.env.NODE_ENV === 'development';

      return (
        <div className="flex h-screen items-center justify-center bg-background p-4">
          <div className="max-w-2xl w-full rounded-lg border border-border bg-card p-8 shadow-lg">
            {/* 错误图标和标题 */}
            <div className="mb-6 flex items-center gap-4">
              <div className="rounded-full bg-destructive/10 p-4">
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
              <details className="mb-6">
                <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground hover:text-muted-foreground">
                  <FaBug className="h-4 w-4" />
                  Error details
                </summary>

                <div className="mt-4 space-y-4">
                  {/* 错误对象 */}
                  {error && (
                    <div>
                      <h3 className="mb-2 text-xs font-semibold text-muted-foreground uppercase">Error</h3>
                      <pre className="overflow-auto rounded-md bg-muted p-3 text-xs">
                        <code className="text-destructive">{error.toString()}</code>
                      </pre>
                    </div>
                  )}

                  {/* 组件堆栈 */}
                  {errorInfo?.componentStack && (
                    <div>
                      <h3 className="mb-2 text-xs font-semibold text-muted-foreground uppercase">Component Stack</h3>
                      <pre className="overflow-auto rounded-md bg-muted p-3 text-xs">
                        <code className="text-muted-foreground">{errorInfo.componentStack}</code>
                      </pre>
                    </div>
                  )}

                  {/* 错误堆栈 */}
                  {error?.stack && isDevelopment && (
                    <div>
                      <h3 className="mb-2 text-xs font-semibold text-muted-foreground uppercase">Stack Trace</h3>
                      <pre className="overflow-auto rounded-md bg-muted p-3 text-xs">
                        <code className="text-muted-foreground">{error.stack}</code>
                      </pre>
                    </div>
                  )}

                  {/* 诊断信息 */}
                  <div className="rounded-md bg-muted/50 p-3">
                    <h3 className="mb-2 text-xs font-semibold text-muted-foreground uppercase">Diagnostic Info</h3>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">URL:</span>{' '}
                        <span className="text-foreground">{window.location.href}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Time:</span>{' '}
                        <span className="text-foreground">{new Date().toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </details>
            )}

            {/* 操作按钮 */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={this.handleReset}
                className="flex flex-1 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <FaSync className="h-4 w-4" />
                Try again
              </button>

              <button
                onClick={this.handleReload}
                className="flex flex-1 items-center justify-center gap-2 rounded-md border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                <FaSync className="h-4 w-4" />
                Reload page
              </button>

              <Link
                to="/"
                className="flex flex-1 items-center justify-center gap-2 rounded-md border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                <FaHome className="h-4 w-4" />
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

    return this.props.children;
  }
}

/**
 * 错误恢复 Hook - 用于在组件内部捕获错误
 */
export function useErrorHandler() {
  return (error: Error) => {
    throw error;
  };
}
