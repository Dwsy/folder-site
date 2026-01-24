/**
 * FilePreviewModal Component
 *
 * 文件预览模态框组件
 *
 * 功能特性：
 * - Alt+点击文件节点触发
 * - 显示文件元数据（大小、创建时间、修改时间等）
 * - 流畅的弹出动画（缩放+淡入+滑动）
 * - 文件图标预览
 * - 快捷键支持（ESC 关闭）
 */

import { useState, useEffect, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { FaTimes, FaFile, FaFolder, FaCalendar, FaClock, FaDatabase, FaTag } from 'react-icons/fa';
import { FileIcon } from '@react-symbols/icons/utils';
import { cn } from '../../utils/cn.js';
import type { FileInfo } from '../../../types/files.js';

export interface FilePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filePath?: string;
  className?: string;
}

/**
 * 格式化文件大小
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * 格式化日期
 */
function formatDate(date: Date): string {
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * 格式化相对时间
 */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;
  if (hours < 24) return `${hours} 小时前`;
  if (days < 7) return `${days} 天前`;
  if (days < 30) return `${Math.floor(days / 7)} 周前`;
  if (days < 365) return `${Math.floor(days / 30)} 个月前`;
  return `${Math.floor(days / 365)} 年前`;
}

/**
 * 文件元数据项组件
 */
function MetadataItem({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: any;
  label: string;
  value: string | number;
  className?: string;
}) {
  return (
    <div className={cn('flex items-start gap-3 py-2', className)}>
      <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
      <div className="flex-1 min-w-0">
        <div className="text-xs text-muted-foreground mb-0.5">{label}</div>
        <div className="text-sm font-medium truncate">{value}</div>
      </div>
    </div>
  );
}

/**
 * 文件预览模态框组件
 */
export function FilePreviewModal({
  open,
  onOpenChange,
  filePath,
  className,
}: FilePreviewModalProps) {
  const [metadata, setMetadata] = useState<FileInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 加载文件元数据
  useEffect(() => {
    if (!open || !filePath) {
      setMetadata(null);
      setError(null);
      return;
    }

    const fetchMetadata = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/files/content?path=${encodeURIComponent(filePath)}`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch file: ${response.statusText}`);
        }

        const result = await response.json();

        if (result.success && result.data?.info) {
          setMetadata({
            ...result.data.info,
            modifiedAt: new Date(result.data.info.modifiedAt),
            createdAt: new Date(result.data.info.createdAt),
          });
        } else {
          throw new Error(result.error?.message || 'Failed to load file metadata');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load file metadata';
        setError(errorMessage);
        console.error('Error fetching file metadata:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMetadata();
  }, [open, filePath]);

  // 处理关闭
  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const Icon = metadata?.isDirectory ? FaFolder : FaFile;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        {/* 背景遮罩 - 淡入动画 */}
        <Dialog.Overlay
          className={cn(
            'fixed inset-0 z-50 bg-background/80 backdrop-blur-sm',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'transition-all',
            'style-[animation-duration:var(--animation-duration-normal)]'
          )}
        />

        {/* 模态框内容 - 缩放+淡入+滑动动画 */}
        <Dialog.Content
          className={cn(
            'fixed left-[50%] top-[50%] z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2',
            'rounded-lg border bg-background shadow-2xl',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]',
            'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
            'overflow-hidden',
            className
          )}
        >
          <Dialog.Title className="sr-only">
            File Preview
          </Dialog.Title>

          {loading && (
            <div className="flex items-center justify-center p-8">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <p className="text-sm text-muted-foreground">Loading file info...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <div className="mb-3 rounded-full bg-destructive/10 p-3">
                <FaTimes className="h-6 w-6 text-destructive" />
              </div>
              <p className="text-sm text-destructive font-medium">Failed to load file</p>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
            </div>
          )}

          {metadata && !loading && !error && (
            <div className="flex flex-col">
              {/* 头部 - 文件图标和名称 */}
              <div className="flex items-center gap-4 border-b px-6 py-5 bg-muted/30">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <FileIcon fileName={metadata.name} width={32} height={32} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold truncate">{metadata.name}</h3>
                  <p className="text-sm text-muted-foreground truncate">{metadata.relativePath}</p>
                </div>
              </div>

              {/* 文件类型标签 */}
              <div className="flex items-center gap-2 px-6 py-3 border-b bg-muted/20">
                <FaTag className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Type:</span>
                <span className="text-sm font-medium capitalize">
                  {metadata.isDirectory ? 'Folder' : metadata.extension || 'File'}
                </span>
                {metadata.isSymbolicLink && (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    Symlink
                  </span>
                )}
              </div>

              {/* 元数据列表 */}
              <div className="px-6 py-4 space-y-1 max-h-[60vh] overflow-y-auto">
                <MetadataItem
                  icon={FaDatabase}
                  label="文件大小"
                  value={formatFileSize(metadata.size)}
                />
                <MetadataItem
                  icon={FaCalendar}
                  label="创建时间"
                  value={formatDate(metadata.createdAt)}
                />
                <div className="text-xs text-muted-foreground text-right -mt-1 mb-1">
                  {formatRelativeTime(metadata.createdAt)}
                </div>
                <MetadataItem
                  icon={FaClock}
                  label="修改时间"
                  value={formatDate(metadata.modifiedAt)}
                />
                <div className="text-xs text-muted-foreground text-right -mt-1 mb-1">
                  {formatRelativeTime(metadata.modifiedAt)}
                </div>
              </div>

              {/* 底部操作栏 */}
              <div className="flex items-center justify-between border-t px-6 py-3 bg-muted/20">
                <div className="text-xs text-muted-foreground">
                  Press <kbd className="px-1.5 py-0.5 rounded bg-background border text-[10px]">Esc</kbd> to close
                </div>
                <Dialog.Close asChild>
                  <button
                    type="button"
                    aria-label="Close file preview"
                    className={cn(
                      'rounded-md px-4 py-2 text-sm font-medium',
                      'hover:bg-muted',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                      'transition-colors'
                    )}
                  >
                    Close
                  </button>
                </Dialog.Close>
              </div>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}