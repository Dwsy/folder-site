import { useState, useCallback, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FileIcon, FolderIcon, DefaultFolderOpenedIcon } from '@react-symbols/icons/utils';
import { cn } from '../../utils/cn.js';

/**
 * 文件树节点类型
 */
export interface FileTreeNode {
  /** 节点名称 */
  name: string;
  /** 完整路径 */
  path: string;
  /** 相对路径 */
  relativePath?: string;
  /** 节点类型 */
  type: 'file' | 'directory';
  /** 子节点（仅目录） */
  children?: FileTreeNode[];
  /** 是否折叠 */
  collapsed?: boolean;
  /** 文件扩展名 */
  extension?: string;
  /** 是否隐藏 */
  hidden?: boolean;
}

/**
 * 文件树组件属性
 */
export interface FileTreeProps {
  /** 文件树数据 */
  tree: FileTreeNode[];
  /** 搜索查询 */
  searchQuery?: string;
  /** 文件点击回调 */
  onFileClick?: (path: string, node: FileTreeNode) => void;
  /** 文件夹点击回调 */
  onFolderClick?: (path: string, node: FileTreeNode) => void;
  /** 自定义样式类名 */
  className?: string;
  /** 是否显示隐藏文件 */
  showHidden?: boolean;
  /** 最大展开深度 */
  maxDepth?: number;
  /** 当前活动文件路径 */
  activePath?: string;
}

/**
 * 文件树节点组件属性
 */
interface FileTreeNodeProps {
  /** 节点数据 */
  node: FileTreeNode;
  /** 当前层级深度 */
  level: number;
  /** 是否匹配搜索 */
  isMatch?: boolean;
  /** 文件点击回调 */
  onFileClick?: (path: string, node: FileTreeNode) => void;
  /** 文件夹点击回调 */
  onFolderClick?: (path: string, node: FileTreeNode) => void;
  /** 活动路径 */
  activePath?: string;
  /** 最大展开深度 */
  maxDepth?: number;
}

/**
 * 文件树节点组件
 */
function FileTreeNodeComponent({
  node,
  level,
  isMatch = false,
  onFileClick,
  onFolderClick,
  activePath,
  maxDepth,
}: FileTreeNodeProps) {
  const [collapsed, setCollapsed] = useState(node.collapsed ?? true);
  const location = useLocation();

  // 判断是否为活动节点
  const isActive = activePath
    ? node.path === activePath
    : location.pathname === node.path;

  // 判断是否应该展开（搜索匹配时自动展开）
  const shouldExpand = isMatch || !collapsed;

  // 处理文件夹点击
  const handleFolderClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setCollapsed(!collapsed);
      onFolderClick?.(node.path, node);
    },
    [collapsed, node.path, node, onFolderClick]
  );

  // 处理文件点击
  const handleFileClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onFileClick?.(node.path, node);
    },
    [node.path, node, onFileClick]
  );

  // 处理键盘事件
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (node.type === 'directory') {
          handleFolderClick(e as any);
        } else {
          handleFileClick(e as any);
        }
      }
    },
    [node.type, handleFolderClick, handleFileClick]
  );

  // 计算缩进
  const paddingLeft = `${level * 16 + 8}px`;

  // 渲染文件夹节点
  if (node.type === 'directory') {
    return (
      <div className="select-none">
        <button
          type="button"
          onClick={handleFolderClick}
          onKeyDown={handleKeyDown}
          className={cn(
            'flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors',
            'hover:bg-muted focus:outline-none focus:ring-1 focus:ring-primary',
            'group'
          )}
          style={{ paddingLeft }}
          aria-expanded={!collapsed}
          aria-label={`Toggle ${node.name} folder`}
        >
          {/* 展开/折叠箭头 */}
          <span
            className={cn(
              'flex h-4 w-4 items-center justify-center transition-transform duration-200',
              collapsed ? 'rotate-0' : 'rotate-90'
            )}
          >
            <svg
              className="h-3 w-3 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </span>

          {/* 文件夹图标 */}
          <span className="flex h-5 w-5 shrink-0 items-center justify-center">
            {collapsed ? (
              <FolderIcon
                folderName={node.name}
                width={20}
                height={20}
                className="text-yellow-500"
              />
            ) : (
              <DefaultFolderOpenedIcon
                width={20}
                height={20}
                className="text-yellow-500"
              />
            )}
          </span>

          {/* 文件夹名称 */}
          <span className="flex-1 truncate text-left">{node.name}</span>

          {/* 子节点数量提示 */}
          {node.children && node.children.length > 0 && (
            <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100">
              {node.children.length}
            </span>
          )}
        </button>

        {/* 渲染子节点 */}
        {shouldExpand && node.children && node.children.length > 0 && (
          <div className="overflow-hidden">
            {node.children.map((child, index) => (
              <FileTreeNodeComponent
                key={`${child.path}-${index}`}
                node={child}
                level={level + 1}
                isMatch={isMatch}
                onFileClick={onFileClick}
                onFolderClick={onFolderClick}
                activePath={activePath}
                maxDepth={maxDepth}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // 渲染文件节点
  return (
    <Link
      to={node.path}
      onClick={handleFileClick}
      onKeyDown={handleKeyDown}
      className={cn(
        'flex items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors',
        'hover:bg-muted focus:outline-none focus:ring-1 focus:ring-primary',
        isActive && 'bg-accent text-accent-foreground font-medium',
        'group'
      )}
      style={{ paddingLeft }}
      aria-current={isActive ? 'page' : undefined}
    >
      {/* 文件图标 */}
      <span className="flex h-5 w-5 shrink-0 items-center justify-center">
        <FileIcon fileName={node.name} width={20} height={20} />
      </span>

      {/* 文件名 */}
      <span className="flex-1 truncate">{node.name}</span>
    </Link>
  );
}

/**
 * 文件树组件
 */
export function FileTree({
  tree,
  searchQuery = '',
  onFileClick,
  onFolderClick,
  className,
  showHidden = false,
  maxDepth,
  activePath,
}: FileTreeProps) {
  // 过滤文件树
  const filteredTree = useMemo(() => {
    // 如果没有搜索查询，返回原始树（过滤隐藏文件）
    if (!searchQuery.trim()) {
      const filterHidden = (nodes: FileTreeNode[]): FileTreeNode[] => {
        return nodes
          .filter((node) => showHidden || !node.hidden)
          .map((node) => {
            if (node.type === 'directory' && node.children) {
              const filteredChildren = filterHidden(node.children);
              return {
                ...node,
                children: filteredChildren,
              };
            }
            return node;
          });
      };
      return filterHidden(tree);
    }

    // 搜索过滤
    const query = searchQuery.toLowerCase();

    const filterBySearch = (nodes: FileTreeNode[]): FileTreeNode[] => {
      return nodes
        .filter((node) => showHidden || !node.hidden)
        .map((node) => {
          if (node.type === 'file') {
            // 文件匹配
            return node.name.toLowerCase().includes(query) ? node : null;
          } else {
            // 目录：检查目录名或子节点是否匹配
            const filteredChildren = filterBySearch(node.children || []);

            // 目录名匹配或子节点匹配
            if (
              node.name.toLowerCase().includes(query) ||
              filteredChildren.length > 0
            ) {
              return {
                ...node,
                children: filteredChildren,
                collapsed: false, // 搜索时自动展开
              };
            }
            return null;
          }
        })
        .filter((node): node is FileTreeNode => node !== null);
    };

    return filterBySearch(tree);
  }, [tree, searchQuery, showHidden]);

  // 空状态
  if (filteredTree.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-8', className)}>
        <svg
          className="h-12 w-12 text-muted-foreground/50"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
          />
        </svg>
        <p className="mt-2 text-sm text-muted-foreground">
          {searchQuery ? 'No files found' : 'No files'}
        </p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-0.5', className)}>
      {filteredTree.map((node, index) => (
        <FileTreeNodeComponent
          key={`${node.path}-${index}`}
          node={node}
          level={0}
          isMatch={!!searchQuery.trim()}
          onFileClick={onFileClick}
          onFolderClick={onFolderClick}
          activePath={activePath}
          maxDepth={maxDepth}
        />
      ))}
    </div>
  );
}

/**
 * 将文件索引转换为文件树结构
 */
export function convertIndexToTree(
  entries: Array<{
    name: string;
    path: string;
    relativePath: string;
    isDirectory: boolean;
    extension?: string;
    hidden?: boolean;
  }>
): FileTreeNode[] {
  const nodeMap = new Map<string, FileTreeNode>();
  const rootNodes: FileTreeNode[] = [];

  // 创建所有节点
  entries.forEach((entry) => {
    const node: FileTreeNode = {
      name: entry.name,
      path: entry.path,
      relativePath: entry.relativePath,
      type: entry.isDirectory ? 'directory' : 'file',
      extension: entry.extension,
      hidden: entry.hidden,
      collapsed: true,
      children: entry.isDirectory ? [] : undefined,
    };
    nodeMap.set(entry.path, node);
  });

  // 构建树结构
  entries.forEach((entry) => {
    const node = nodeMap.get(entry.path);
    if (!node) return;

    const parentPath = entry.path.split('/').slice(0, -1).join('/');
    const parentNode = parentPath ? nodeMap.get(parentPath) : null;

    if (parentNode && parentNode.type === 'directory') {
      parentNode.children!.push(node);
    } else {
      rootNodes.push(node);
    }
  });

  // 按名称排序（文件夹优先）
  const sortNodes = (nodes: FileTreeNode[]) => {
    nodes.sort((a, b) => {
      // 文件夹优先
      if (a.type === 'directory' && b.type === 'file') return -1;
      if (a.type === 'file' && b.type === 'directory') return 1;
      // 相同类型按名称排序
      return a.name.localeCompare(b.name);
    });
    nodes.forEach((node) => {
      if (node.children) {
        sortNodes(node.children);
      }
    });
  };

  sortNodes(rootNodes);

  return rootNodes;
}