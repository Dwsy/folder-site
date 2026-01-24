/**
 * Tab 组件 - 单个标签页
 * 
 * 功能：
 * - 显示文件图标和名称
 * - 激活状态样式
 * - 固定标签页图标
 * - 关闭按钮
 * - Tooltip 显示完整路径
 * - 右键菜单
 */

import { memo, useCallback, MouseEvent } from 'react';
import { FileIcon } from '@react-symbols/icons/utils';
import { RiCloseLine, RiPushpinLine, RiPushpinFill } from 'react-icons/ri';
import { cn } from '../../utils/cn.js';
import type { Tab as TabType } from '../../contexts/TabsContext.js';

/**
 * Tab 组件属性
 */
export interface TabProps {
  /** 标签页数据 */
  tab: TabType;
  /** 是否激活 */
  isActive: boolean;
  /** 点击标签页 */
  onClick: () => void;
  /** 关闭标签页 */
  onClose: (e: MouseEvent) => void;
  /** 固定/取消固定标签页 */
  onTogglePin: (e: MouseEvent) => void;
  /** 右键菜单 */
  onContextMenu?: (e: MouseEvent) => void;
  /** 自定义类名 */
  className?: string;
}

/**
 * Tab 组件
 */
export const Tab = memo(function Tab({
  tab,
  isActive,
  onClick,
  onClose,
  onTogglePin,
  onContextMenu,
  className,
}: TabProps) {
  // 阻止关闭按钮触发标签页点击
  const handleClose = useCallback((e: MouseEvent) => {
    e.stopPropagation();
    onClose(e);
  }, [onClose]);

  // 阻止固定按钮触发标签页点击
  const handleTogglePin = useCallback((e: MouseEvent) => {
    e.stopPropagation();
    onTogglePin(e);
  }, [onTogglePin]);

  return (
    <div
      role="tab"
      aria-selected={isActive}
      aria-label={`${tab.name} ${tab.isPinned ? '(pinned)' : ''}`}
      onClick={onClick}
      onContextMenu={onContextMenu}
      className={cn(
        'group relative flex items-center gap-1.5 px-3 py-2 min-w-0 max-w-[200px]',
        'border-r border-border/50',
        'cursor-pointer select-none',
        'transition-colors duration-150',
        // 激活状态
        isActive
          ? 'bg-background text-foreground'
          : 'bg-muted/30 text-muted-foreground hover:bg-muted/50',
        // 固定标签页样式
        tab.isPinned && 'border-l-2 border-l-primary',
        className
      )}
      title={tab.path}
    >
      {/* 文件图标 */}
      <span className="shrink-0 flex items-center justify-center w-4 h-4">
        <FileIcon fileName={tab.name} width={16} height={16} />
      </span>

      {/* 文件名 */}
      <span className="flex-1 truncate text-sm font-medium">
        {tab.name}
      </span>

      {/* 固定图标（仅在固定时显示） */}
      {tab.isPinned && (
        <button
          onClick={handleTogglePin}
          className={cn(
            'shrink-0 p-0.5 rounded',
            'text-primary',
            'hover:bg-primary/10',
            'transition-colors'
          )}
          aria-label="Unpin tab"
          title="取消固定"
        >
          <RiPushpinFill className="w-3.5 h-3.5" />
        </button>
      )}

      {/* 关闭按钮（hover 时显示，固定标签页始终显示固定图标） */}
      {!tab.isPinned && (
        <button
          onClick={handleClose}
          className={cn(
            'shrink-0 p-0.5 rounded',
            'opacity-0 group-hover:opacity-100',
            'hover:bg-destructive/10 hover:text-destructive',
            'transition-all',
            isActive && 'opacity-100'
          )}
          aria-label="Close tab"
          title="关闭"
        >
          <RiCloseLine className="w-4 h-4" />
        </button>
      )}

      {/* 激活指示器 */}
      {isActive && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
      )}
    </div>
  );
});
