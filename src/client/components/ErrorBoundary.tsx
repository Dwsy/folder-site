import { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorFallback } from './ErrorFallback.js';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
  enableLogging?: boolean;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

interface Props extends ErrorBoundaryProps {}

interface State extends ErrorBoundaryState {}

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
    const enableLogging = this.props.enableLogging !== false; // 默认启用日志

    if (enableLogging) {
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
    }

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

  handleCopyError = () => {
    const { error, errorInfo, errorId } = this.state;
    const errorText = `Error ID: ${errorId}\n\nError: ${error?.message || 'Unknown error'}\n\nStack:\n${error?.stack || 'No stack available'}\n\nComponent Stack:\n${errorInfo?.componentStack || 'No component stack available'}\n\nURL: ${window.location.href}\nTime: ${new Date().toISOString()}`;

    navigator.clipboard.writeText(errorText).catch((err) => {
      console.error('Failed to copy error:', err);
    });
  };

  override render(): ReactNode {
    if (this.state.hasError) {
      // 使用自定义 fallback
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorInfo, errorId } = this.state;
      const showDetails = this.props.showDetails !== false; // 默认显示详情

      return (
        <ErrorFallback
          error={error}
          errorInfo={errorInfo}
          errorId={errorId}
          showDetails={showDetails}
          onReset={this.handleReset}
          onReload={this.handleReload}
          onGoHome={this.handleGoHome}
          onCopyError={this.handleCopyError}
        />
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
