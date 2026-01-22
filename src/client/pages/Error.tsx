import { useRouteError } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { FaHome, FaExclamationTriangle, FaBug, FaShieldAlt, FaServer, FaSync } from 'react-icons/fa';

interface ErrorPageProps {
  statusCode?: number;
  title?: string;
  message?: string;
  showDetails?: boolean;
}

/**
 * 通用错误页面组件
 * 可以独立使用，也可以作为路由的 errorElement
 */
export function ErrorPage({
  statusCode,
  title,
  message,
  showDetails = false,
}: ErrorPageProps) {
  const routeError = useRouteError() as any;
  const error = routeError || {};

  // 从错误或 props 中提取信息
  const displayStatusCode = statusCode || error.status || 500;
  const displayTitle = title || getErrorTitle(displayStatusCode);
  const displayMessage = message || error.message || 'An unexpected error occurred';
  const errorStack = error.stack;
  const errorName = error.name || 'Error';

  // 获取错误图标
  const ErrorIcon = getErrorIcon(displayStatusCode);

  return (
    <div className="flex h-full min-h-screen items-center justify-center bg-background p-6">
      <div className="max-w-2xl w-full">
        {/* 错误卡片 */}
        <div className="rounded-lg border border-border bg-card shadow-lg overflow-hidden">
          {/* 头部 */}
          <div className="bg-gradient-to-r from-destructive/10 to-destructive/5 p-6 border-b border-border">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-destructive/10 p-4">
                <ErrorIcon className="h-8 w-8 text-destructive" />
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Error {displayStatusCode}
                </div>
                <h1 className="text-2xl font-bold text-foreground">
                  {displayTitle}
                </h1>
              </div>
            </div>
          </div>

          {/* 内容 */}
          <div className="p-6 space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              {displayMessage}
            </p>

            {/* 错误详情（仅开发环境或明确要求显示） */}
            {(showDetails || process.env.NODE_ENV === 'development') && errorStack && (
              <details className="group">
                <summary className="cursor-pointer text-sm font-medium text-foreground hover:text-muted-foreground flex items-center gap-2">
                  <FaBug className="h-4 w-4" />
                  Error Details
                </summary>
                <div className="mt-4 space-y-3">
                  <div className="rounded-md bg-muted p-4">
                    <div className="text-xs font-semibold text-muted-foreground mb-2">
                      {errorName}
                    </div>
                    <pre className="text-xs text-foreground overflow-x-auto whitespace-pre-wrap break-all">
                      {errorStack}
                    </pre>
                  </div>
                </div>
              </details>
            )}

            {/* 建议操作 */}
            <div className="rounded-md bg-muted/50 p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <FaShieldAlt className="h-4 w-4 text-muted-foreground" />
                What you can try:
              </div>
              <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                <li>Refresh the page and try again</li>
                <li>Check your internet connection</li>
                <li>Clear your browser cache</li>
                <li>Contact support if the problem persists</li>
              </ul>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="p-6 border-t border-border bg-muted/30 flex flex-wrap gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <FaHome className="h-4 w-4" />
              Go Home
            </Link>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <FaSync className="h-4 w-4" />
              Refresh
            </button>
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Go Back
            </button>
          </div>
        </div>

        {/* 请求 ID 和时间戳（开发环境） */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 text-center text-xs text-muted-foreground">
            <div>Request ID: {generateRequestId()}</div>
            <div>Timestamp: {new Date().toISOString()}</div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 根据状态码获取错误标题
 */
function getErrorTitle(statusCode: number): string {
  const titles: Record<number, string> = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Page Not Found',
    409: 'Conflict',
    422: 'Validation Error',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Timeout',
  };
  return titles[statusCode] || 'Something Went Wrong';
}

/**
 * 根据状态码获取错误图标
 */
function getErrorIcon(statusCode: number) {
  if (statusCode >= 500) return FaServer;
  if (statusCode === 404) return FaExclamationTriangle;
  return FaBug;
}

/**
 * 生成请求 ID
 */
function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 10);
}

/**
 * 导出带有特定状态码的便捷组件
 */
export const Error400 = () => (
  <ErrorPage statusCode={400} title="Bad Request" message="The request could not be understood by the server." />
);

export const Error401 = () => (
  <ErrorPage statusCode={401} title="Unauthorized" message="You need to log in to access this resource." />
);

export const Error403 = () => (
  <ErrorPage statusCode={403} title="Forbidden" message="You don't have permission to access this resource." />
);

export const Error404 = () => (
  <ErrorPage statusCode={404} title="Page Not Found" message="The page you're looking for doesn't exist." />
);

export const Error422 = () => (
  <ErrorPage statusCode={422} title="Validation Error" message="The request contains invalid data." />
);

export const Error500 = () => (
  <ErrorPage statusCode={500} title="Internal Server Error" message="Something went wrong on our end. Please try again later." />
);

export const Error503 = () => (
  <ErrorPage statusCode={503} title="Service Unavailable" message="The service is temporarily unavailable. Please try again later." />
);

// 默认导出
export default ErrorPage;