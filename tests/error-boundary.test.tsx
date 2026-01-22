/**
 * ErrorBoundary 组件测试
 *
 * 测试错误边界组件的功能,包括:
 * - 捕获子组件错误
 * - 显示错误回退 UI
 * - 错误日志记录
 * - 恢复功能
 * - 自定义 fallback
 * - 错误详情展开/折叠
 * - 复制错误信息
 * - 边界情况（null 错误、undefined 错误等）
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "bun:test";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { ErrorBoundary } from "../src/client/components/ErrorBoundary";
import { ErrorFallback } from "../src/client/components/ErrorFallback";
import React from 'react';

// 设置 DOM 环境
import { Window } from 'happy-dom';
const window = new Window();
global.window = window as any;
global.document = window.document;
global.HTMLElement = window.HTMLElement;
global.HTMLButtonElement = window.HTMLButtonElement;
global.HTMLAnchorElement = window.HTMLAnchorElement;
global.HTMLDivElement = window.HTMLDivElement;
global.navigator = window.navigator;

// 模拟 clipboard API
const mockClipboard = {
  writeText: vi.fn().mockResolvedValue(undefined),
};

Object.defineProperty(global.navigator, 'clipboard', {
  value: mockClipboard,
  writable: true,
});

// 模拟 import.meta.env
global.import = { meta: { env: { DEV: true } } } as any;

// 模拟 console.error
const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

// 清理函数
afterEach(() => {
  consoleErrorSpy.mockClear();
  mockClipboard.writeText.mockClear();
});

/**
 * 抛出错误的测试组件
 */
const ThrowError: React.FC<{ shouldThrow?: boolean }> = ({ shouldThrow = true }) => {
  if (shouldThrow) {
    throw new Error("Test error message");
  }
  return <div>No error</div>;
};

/**
 * 抛出 null 错误的测试组件
 */
const ThrowNullError: React.FC = () => {
  throw null;
};

/**
 * 抛出 undefined 错误的测试组件
 */
const ThrowUndefinedError: React.FC = () => {
  throw undefined;
};

/**
 * 抛出自定义错误的测试组件
 */
const ThrowCustomError: React.FC = () => {
  throw new Error("Custom error with special chars: <>&\"'");
};

describe("ErrorBoundary", () => {
  beforeEach(() => {
    consoleErrorSpy.mockClear();
  });

  describe("基本功能", () => {
    it("应该正常渲染子组件，当没有错误时", () => {
      render(
        <ErrorBoundary>
          <div>Normal content</div>
        </ErrorBoundary>
      );

      expect(screen.getByText("Normal content")).toBeTruthy();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it("应该捕获子组件错误并显示错误 UI", () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Something went wrong/i)).toBeTruthy();
      expect(screen.getByText(/Test error message/i)).toBeTruthy();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it("应该生成唯一的错误 ID", () => {
      const { unmount } = render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      const errorIdText = screen.getByText(/Error ID:/i).textContent;
      expect(errorIdText).toMatch(/ERR-\d+-[a-z0-9]+/i);

      unmount();

      // 第二次渲染应该生成不同的 ID
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      const errorIdText2 = screen.getByText(/Error ID:/i).textContent;
      expect(errorIdText2).toMatch(/ERR-\d+-[a-z0-9]+/i);
      expect(errorIdText2).not.toBe(errorIdText);
    });
  });

  describe("错误处理", () => {
    it("应该处理 null 错误", () => {
      render(
        <ErrorBoundary>
          <ThrowNullError />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Something went wrong/i)).toBeTruthy();
    });

    it("应该处理 undefined 错误", () => {
      render(
        <ErrorBoundary>
          <ThrowUndefinedError />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Something went wrong/i)).toBeTruthy();
    });

    it("应该正确处理错误消息中的特殊字符", () => {
      render(
        <ErrorBoundary>
          <ThrowCustomError />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Custom error with special chars/i)).toBeTruthy();
    });
  });

  describe("错误日志", () => {
    it("应该记录错误到控制台", () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'ErrorBoundary caught an error:',
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String),
        })
      );
    });

    it("应该记录详细的错误信息", () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error details:',
        expect.objectContaining({
          errorId: expect.any(String),
          message: expect.any(String),
          stack: expect.any(String),
          componentStack: expect.any(String),
          timestamp: expect.any(String),
          userAgent: expect.any(String),
          url: expect.any(String),
        })
      );
    });

    it("应该支持禁用日志记录", () => {
      render(
        <ErrorBoundary enableLogging={false}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it("应该调用自定义 onError 回调", () => {
      const onError = vi.fn();

      render(
        <ErrorBoundary onError={onError}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(onError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String),
        })
      );
    });
  });

  describe("恢复功能", () => {
    it("应该支持重试功能", () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      // 触发错误
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Something went wrong/i)).toBeTruthy();

      // 点击重试
      const retryButton = screen.getByText(/Try again/i);
      fireEvent.click(retryButton);

      // 重新渲染正常内容
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText("No error")).toBeTruthy();
    });

    it("应该支持刷新页面功能", () => {
      const reloadSpy = vi.spyOn(global.window.location, 'reload').mockImplementation(() => {});

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      const reloadButton = screen.getByText(/Reload page/i);
      fireEvent.click(reloadButton);

      expect(reloadSpy).toHaveBeenCalled();

      reloadSpy.mockRestore();
    });

    it("应该支持返回首页功能", () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      const homeButton = screen.getByText(/Go Home/i);
      expect(homeButton.closest('a')).toHaveAttribute('href', '/');
    });
  });

  describe("错误详情", () => {
    it("默认应该显示错误详情", () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Error details/i)).toBeTruthy();
    });

    it("应该支持隐藏错误详情", () => {
      render(
        <ErrorBoundary showDetails={false}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.queryByText(/Error details/i)).toBeFalsy();
    });

    it("应该支持展开/折叠错误详情", () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      const detailsSummary = screen.getByText(/Error details/i);
      const detailsElement = detailsSummary.closest('details');

      expect(detailsElement).toBeTruthy();

      // 默认应该是折叠的
      expect(detailsElement?.hasAttribute('open')).toBeFalsy();

      // 点击展开
      fireEvent.click(detailsSummary);
      expect(detailsElement?.hasAttribute('open')).toBeTruthy();

      // 点击折叠
      fireEvent.click(detailsSummary);
      expect(detailsElement?.hasAttribute('open')).toBeFalsy();
    });

    it("展开后应该显示错误堆栈", () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      const detailsSummary = screen.getByText(/Error details/i);
      fireEvent.click(detailsSummary);

      expect(screen.getByText(/Stack Trace/i)).toBeTruthy();
      expect(screen.getByText(/Component Stack/i)).toBeTruthy();
    });
  });

  describe("复制错误信息", () => {
    it("应该支持复制错误信息", () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      const copyButton = screen.getByTitle(/Copy error/i);
      fireEvent.click(copyButton);

      expect(mockClipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining('Error ID:')
      );
      expect(mockClipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining('Error:')
      );
      expect(mockClipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining('Stack:')
      );
    });

    it("应该处理复制失败的情况", async () => {
      mockClipboard.writeText.mockRejectedValue(new Error('Copy failed'));

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      const copyButton = screen.getByTitle(/Copy error/i);
      await act(async () => {
        fireEvent.click(copyButton);
      });

      // 应该记录错误但不影响 UI
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to copy error:', expect.any(Error));
    });
  });

  describe("自定义 Fallback", () => {
    it("应该支持自定义 fallback", () => {
      const CustomFallback = () => (
        <div>Custom error UI</div>
      );

      render(
        <ErrorBoundary fallback={<CustomFallback />}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText("Custom error UI")).toBeTruthy();
      expect(screen.queryByText(/Something went wrong/i)).toBeFalsy();
    });

    it("应该支持自定义 fallback 组件", () => {
      const CustomFallback = () => (
        <div>Custom component error UI</div>
      );

      render(
        <ErrorBoundary fallback={<CustomFallback />}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText("Custom component error UI")).toBeTruthy();
    });
  });

  describe("嵌套错误边界", () => {
    it("应该支持嵌套错误边界", () => {
      const InnerErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <ErrorBoundary fallback={<div>Inner error</div>}>
          {children}
        </ErrorBoundary>
      );

      render(
        <ErrorBoundary fallback={<div>Outer error</div>}>
          <InnerErrorBoundary>
            <ThrowError />
          </InnerErrorBoundary>
        </ErrorBoundary>
      );

      // 内部错误边界应该捕获错误
      expect(screen.getByText("Inner error")).toBeTruthy();
      expect(screen.queryByText("Outer error")).toBeFalsy();
    });
  });

  describe("状态管理", () => {
    it("应该在重置后清除错误状态", () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      // 触发错误
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Something went wrong/i)).toBeTruthy();

      // 重置
      const retryButton = screen.getByText(/Try again/i);
      fireEvent.click(retryButton);

      // 重新渲染正常内容
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText("No error")).toBeTruthy();
    });
  });

  describe("无障碍性", () => {
    it("应该有适当的语义化标记", () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      // 检查标题
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeTruthy();

      // 检查按钮
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it("按钮应该有适当的文本或 aria-label", () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      const retryButton = screen.getByRole('button', { name: /Try again/i });
      const reloadButton = screen.getByRole('button', { name: /Reload page/i });
      const homeButton = screen.getByRole('link', { name: /Go Home/i });

      expect(retryButton).toBeTruthy();
      expect(reloadButton).toBeTruthy();
      expect(homeButton).toBeTruthy();
    });
  });
});

describe("ErrorFallback", () => {
  it("应该渲染错误回退 UI", () => {
    const error = new Error("Test error");
    const errorInfo = {
      componentStack: "at TestComponent\n  at App",
    };

    render(
      <ErrorFallback
        error={error}
        errorInfo={errorInfo as any}
        errorId="ERR-12345"
        showDetails={true}
        onReset={() => {}}
        onReload={() => {}}
        onGoHome={() => {}}
        onCopyError={() => {}}
      />
    );

    expect(screen.getByText(/Something went wrong/i)).toBeTruthy();
    expect(screen.getByText("ERR-12345")).toBeTruthy();
    expect(screen.getByText("Test error")).toBeTruthy();
  });

  it("应该处理 null 错误", () => {
    render(
      <ErrorFallback
        error={null}
        errorInfo={null}
        errorId="ERR-null"
        showDetails={true}
        onReset={() => {}}
        onReload={() => {}}
        onGoHome={() => {}}
        onCopyError={() => {}}
      />
    );

    expect(screen.getByText(/Something went wrong/i)).toBeTruthy();
  });

  it("应该调用回调函数", () => {
    const onReset = vi.fn();
    const onReload = vi.fn();
    const onGoHome = vi.fn();
    const onCopyError = vi.fn();

    render(
      <ErrorFallback
        error={new Error("Test")}
        errorInfo={null}
        errorId="ERR-test"
        showDetails={true}
        onReset={onReset}
        onReload={onReload}
        onGoHome={onGoHome}
        onCopyError={onCopyError}
      />
    );

    fireEvent.click(screen.getByText(/Try again/i));
    expect(onReset).toHaveBeenCalled();

    fireEvent.click(screen.getByText(/Reload page/i));
    expect(onReload).toHaveBeenCalled();

    fireEvent.click(screen.getByText(/Go Home/i));
    expect(onGoHome).toHaveBeenCalled();

    fireEvent.click(screen.getByTitle(/Copy error/i));
    expect(onCopyError).toHaveBeenCalled();
  });
});