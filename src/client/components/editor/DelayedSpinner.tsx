/**
 * Delayed Spinner Component
 * 
 * 只在加载时间超过指定延迟后才显示加载动画，避免快速加载时的闪烁
 */

import { useState, useEffect } from 'react';
import { cn } from '../../utils/cn.js';

export interface DelayedSpinnerProps {
  /** 延迟显示时间（毫秒），默认 300ms */
  delay?: number;
  /** 加载消息 */
  message?: string;
  /** 是否显示消息 */
  showMessage?: boolean;
  /** 使用 Skeleton 占位符而不是旋转动画 */
  useSkeleton?: boolean;
  /** Skeleton 行数 */
  skeletonLines?: number;
  /** 额外的 CSS 类 */
  className?: string;
}

/**
 * 延迟显示的加载动画组件
 * 
 * @example
 * ```tsx
 * <DelayedSpinner delay={300} message="Loading..." />
 * <DelayedSpinner useSkeleton skeletonLines={5} />
 * ```
 */
export function DelayedSpinner({
  delay = 300,
  message = 'Loading...',
  showMessage = true,
  useSkeleton = false,
  skeletonLines = 3,
  className,
}: DelayedSpinnerProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  // 延迟时间内不显示任何内容
  if (!show) {
    return null;
  }

  // Skeleton 占位符模式
  if (useSkeleton) {
    return (
      <div className={cn('space-y-3 p-8', className)}>
        {Array.from({ length: skeletonLines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-4 animate-pulse rounded bg-muted',
              i === skeletonLines - 1 ? 'w-3/4' : 'w-full'
            )}
          />
        ))}
      </div>
    );
  }

  // 旋转动画模式
  return (
    <div className={cn('flex items-center justify-center p-8', className)}>
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        {showMessage && (
          <p className="text-sm text-muted-foreground">{message}</p>
        )}
      </div>
    </div>
  );
}

/**
 * Skeleton 占位符组件
 */
export interface SkeletonProps {
  /** 行数 */
  lines?: number;
  /** 额外的 CSS 类 */
  className?: string;
}

export function Skeleton({ lines = 3, className }: SkeletonProps) {
  return (
    <div className={cn('space-y-3 p-8', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-4 animate-pulse rounded bg-muted',
            i === lines - 1 ? 'w-3/4' : 'w-full'
          )}
        />
      ))}
    </div>
  );
}

/**
 * Markdown Skeleton 占位符
 * 模拟 Markdown 内容的结构
 */
export function MarkdownSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-4 p-8', className)}>
      {/* 标题 */}
      <div className="h-8 w-2/3 animate-pulse rounded bg-muted" />
      
      {/* 段落 */}
      <div className="space-y-2">
        <div className="h-4 w-full animate-pulse rounded bg-muted" />
        <div className="h-4 w-full animate-pulse rounded bg-muted" />
        <div className="h-4 w-4/5 animate-pulse rounded bg-muted" />
      </div>

      {/* 子标题 */}
      <div className="h-6 w-1/2 animate-pulse rounded bg-muted" />

      {/* 段落 */}
      <div className="space-y-2">
        <div className="h-4 w-full animate-pulse rounded bg-muted" />
        <div className="h-4 w-full animate-pulse rounded bg-muted" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
      </div>

      {/* 代码块 */}
      <div className="h-24 w-full animate-pulse rounded bg-muted" />
    </div>
  );
}
