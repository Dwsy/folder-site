import { useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaChevronRight, FaChevronDown } from 'react-icons/fa';
import { FolderIcon, DefaultFolderOpenedIcon, FileIcon } from '@react-symbols/icons/utils';
import { cn } from '../../utils/cn.js';

/**
 * 文件节点类型
 */
export type FileNodeType = 'file' | 'directory';

/**
 * 文件树节点接口
 */
export interface FileTreeNodeData {
  /** 节点名称 */
  name: string;
  /** 完整路径 */
  path: string;
  /** 相对路径 */
  relativePath?: string;
  /** 节点类型 */
  type: FileNodeType;
  /** 子节点（仅目录） */
  children?: FileTreeNodeData[];
  /** 是否折叠（仅目录） */
  collapsed?: boolean;
  /** 文件扩展名 */
  extension?: string;
}

/**
 * FileTreeNode 组件属性
 */
export interface FileTreeNodeProps {
  /** 节点数据 */
  node: FileTreeNodeData;
  /** 缩进层级 */
  level?: number;
  /** 文件点击回调 */
  onFileClick?: (path: string) => void;
  /** 文件夹点击回调 */
  onFolderClick?: (path: string) => void;
  /** 折叠状态变化回调 */
  onToggle?: (path: string, collapsed: boolean) => void;
  /** 是否显示文件图标 */
  showIcons?: boolean;
  /** 是否允许键盘导航 */
  keyboardNavigable?: boolean;
  /** 自定义类名 */
  className?: string;
}

/**
 * 文件树节点组件
 *
 * 递归渲染文件树结构，支持：
 * - 文件和文件夹的展开/折叠
 * - 文件类型图标显示
 * - 活动文件高亮
 * - 键盘导航
 * - 可访问性支持
 */
export function FileTreeNode({
  node,
  level = 0,
  onFileClick,
  onFolderClick,
  onToggle,
  showIcons = true,
  keyboardNavigable = true,
  className,
}: FileTreeNodeProps) {
  const [collapsed, setCollapsed] = useState(node.collapsed ?? false);
  const location = useLocation();

  // 判断当前节点是否为活动文件
  const isActive = location.pathname === `/file/${node.path}`;

  // 处理文件夹点击
  const handleFolderClick = useCallback(() => {
    const newCollapsed = !collapsed;
    setCollapsed(newCollapsed);
    onToggle?.(node.path, newCollapsed);
    onFolderClick?.(node.path);
  }, [collapsed, node.path, onToggle, onFolderClick]);

  // 处理文件点击
  const handleFileClick = useCallback(() => {
    onFileClick?.(node.path);
  }, [node.path, onFileClick]);

  // 处理键盘事件
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!keyboardNavigable) return;

      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (node.type === 'directory') {
          handleFolderClick();
        } else {
          handleFileClick();
        }
      } else if (e.key === 'ArrowRight' && collapsed && node.type === 'directory') {
        e.preventDefault();
        handleFolderClick();
      } else if (e.key === 'ArrowLeft' && !collapsed && node.type === 'directory') {
        e.preventDefault();
        handleFolderClick();
      }
    },
    [collapsed, node.type, handleFolderClick, handleFileClick, keyboardNavigable]
  );

  // 渲染文件夹节点
  if (node.type === 'directory') {
    const paddingLeft = level * 12 + 8;
    const originX = paddingLeft + 20; // 箭头图标的位置

    return (
      <div className={cn('select-none', className)}>
        <button
          type="button"
          onClick={handleFolderClick}
          onKeyDown={handleKeyDown}
          className={cn(
            'flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-sm transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            'hover:bg-muted active:bg-accent'
          )}
          style={{ paddingLeft: `${paddingLeft}px` }}
          aria-expanded={!collapsed}
          aria-controls={`folder-${node.path.replace(/\//g, '-')}`}
          tabIndex={keyboardNavigable ? 0 : -1}
        >
          {/* 展开/折叠图标 */}
          <span
            className={cn(
              'flex h-3.5 w-3.5 shrink-0 items-center justify-center',
              'transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
              !collapsed ? 'rotate-90' : 'rotate-0'
            )}
            aria-hidden="true"
          >
            {collapsed ? (
              <FaChevronRight className="h-3 w-3 text-muted-foreground" />
            ) : (
              <FaChevronDown className="h-3 w-3 text-muted-foreground" />
            )}
          </span>

          {/* 文件夹图标 */}
          {showIcons && (
            <span className="shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]" aria-hidden="true">
              {collapsed ? (
                <FolderIcon folderName={node.name} width={16} height={16} />
              ) : (
                <DefaultFolderOpenedIcon width={16} height={16} />
              )}
            </span>
          )}

          {/* 文件夹名称 */}
          <span className="flex-1 truncate text-left">{node.name}</span>
        </button>

        {/* 子节点 - 缩放展开动画 */}
        {node.children && node.children.length > 0 && (
          <div
            className={cn(
              'overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
              !collapsed ? 'opacity-100 max-h-[5000px]' : 'opacity-0 max-h-0'
            )}
            style={{
              transformOrigin: `${originX}px 0px`,
              transform: !collapsed ? 'scale(1)' : 'scale(0.85)',
            }}
          >
            <div
              className={cn(
                'transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
                'origin-top',
                !collapsed ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
              )}
              id={`folder-${node.path.replace(/\//g, '-')}`}
              role="group"
            >
              {node.children.map((child, index) => (
                <FileTreeNode
                  key={`${child.path}-${index}`}
                  node={child}
                  level={level + 1}
                  onFileClick={onFileClick}
                  onFolderClick={onFolderClick}
                  onToggle={onToggle}
                  showIcons={showIcons}
                  keyboardNavigable={keyboardNavigable}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // 渲染文件节点
  const paddingLeft = level * 12 + 28;

  return (
    <Link
      to={`/file/${node.path}`}
      onClick={handleFileClick}
      onKeyDown={handleKeyDown}
      className={cn(
        'flex items-center gap-1.5 rounded px-2 py-1.5 text-sm transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'hover:bg-muted',
        isActive && 'bg-accent text-accent-foreground font-medium'
      )}
      style={{ paddingLeft: `${paddingLeft}px` }}
      aria-current={isActive ? 'page' : undefined}
      tabIndex={keyboardNavigable ? 0 : -1}
    >
      {/* 文件图标 */}
      {showIcons && (
        <span className="shrink-0" aria-hidden="true">
          <FileIcon fileName={node.name} width={16} height={16} />
        </span>
      )}

      {/* 文件名称 */}
      <span className="flex-1 truncate">{node.name}</span>
    </Link>
  );
}