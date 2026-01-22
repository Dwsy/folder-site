import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FaHome,
  FaChevronDown,
  FaChevronRight,
  FaBars,
  FaTimes,
} from 'react-icons/fa';
import {
  FileIcon,
  FolderIcon,
  DefaultFolderOpenedIcon,
} from '@react-symbols/icons/utils';
import { cn } from '../../utils/cn.js';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  collapsed?: boolean;
}

// Mock file tree - will be replaced with actual data from the backend
const mockFileTree: FileNode[] = [
  {
    name: 'docs',
    path: '/docs',
    type: 'folder',
    collapsed: false,
    children: [
      {
        name: 'ADR',
        path: '/docs/ADR',
        type: 'folder',
        collapsed: true,
        children: [
          { name: '001-decision.md', path: '/docs/ADR/001-decision.md', type: 'file' },
          { name: '002-architecture.md', path: '/docs/ADR/002-architecture.md', type: 'file' },
        ],
      },
      {
        name: 'Issues',
        path: '/docs/Issues',
        type: 'folder',
        collapsed: true,
        children: [
          { name: '001-bug-fix.md', path: '/docs/Issues/001-bug-fix.md', type: 'file' },
        ],
      },
      {
        name: 'PRs',
        path: '/docs/PRs',
        type: 'folder',
        collapsed: true,
        children: [
          { name: '001-feature.md', path: '/docs/PRs/001-feature.md', type: 'file' },
        ],
      },
      { name: 'README.md', path: '/docs/README.md', type: 'file' },
      { name: 'getting-started.md', path: '/docs/getting-started.md', type: 'file' },
    ],
  },
  {
    name: 'examples',
    path: '/examples',
    type: 'folder',
    collapsed: true,
    children: [
      { name: 'demo.md', path: '/examples/demo.md', type: 'file' },
    ],
  },
];

function getFileIcon(filename: string) {
  return <FileIcon fileName={filename} width={16} height={16} />;
}

interface FileTreeNodeProps {
  node: FileNode;
  level?: number;
  onFileClick?: (path: string) => void;
  activePath?: string;
}

function FileTreeNode({ node, level = 0, onFileClick, activePath }: FileTreeNodeProps) {
  const [collapsed, setCollapsed] = useState(node.collapsed ?? false);

  const isActive = activePath === node.path;

  const handleFolderClick = useCallback(() => {
    setCollapsed(!collapsed);
  }, [collapsed]);

  const handleFileClick = useCallback(() => {
    onFileClick?.(node.path);
  }, [node.path, onFileClick]);

  if (node.type === 'folder') {
    return (
      <div role="treeitem" aria-expanded={!collapsed}>
        <button
          onClick={handleFolderClick}
          className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors hover:bg-muted"
          style={{ paddingLeft: `${level * 12 + 8}px` }}
          aria-label={collapsed ? `Expand ${node.name}` : `Collapse ${node.name}`}
        >
          {collapsed ? (
            <FaChevronRight className="h-3 w-3 text-muted-foreground" />
          ) : (
            <FaChevronDown className="h-3 w-3 text-muted-foreground" />
          )}
          {collapsed ? (
            <FolderIcon folderName={node.name} width={16} height={16} />
          ) : (
            <DefaultFolderOpenedIcon width={16} height={16} />
          )}
          <span className="flex-1 text-left">{node.name}</span>
        </button>
        {!collapsed && node.children && (
          <div>
            {node.children.map((child, index) => (
              <FileTreeNode
                key={index}
                node={child}
                level={level + 1}
                onFileClick={onFileClick}
                activePath={activePath}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      to={node.path}
      onClick={handleFileClick}
      className={cn(
        'flex items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors hover:bg-muted',
        isActive && 'bg-accent text-accent-foreground'
      )}
      style={{ paddingLeft: `${level * 12 + 28}px` }}
      role="treeitem"
      aria-current={isActive ? 'page' : undefined}
      aria-label={node.name}
    >
      {getFileIcon(node.name)}
      <span className="flex-1 truncate">{node.name}</span>
    </Link>
  );
}

interface SidebarProps {
  className?: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  isMobile?: boolean;
  onMobileClose?: () => void;
  fileTree?: FileNode[];
  activePath?: string;
}

export function Sidebar({
  className,
  collapsed = false,
  onToggleCollapse,
  isMobile = false,
  onMobileClose,
  fileTree = mockFileTree,
  activePath,
}: SidebarProps) {

  // Handle escape key to close mobile sidebar
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobile) {
        onMobileClose?.();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMobile, onMobileClose]);

  const handleFileClick = useCallback(() => {
    if (isMobile) {
      onMobileClose?.();
    }
  }, [isMobile, onMobileClose]);

  return (
    <>
      {/* Sidebar */}
      <aside
        className={cn(
          'flex h-full flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out',
          collapsed ? 'w-16' : 'w-64',
          isMobile && 'fixed inset-y-0 left-0 z-50 shadow-xl lg:static lg:shadow-none',
          className
        )}
        aria-label="File navigation sidebar"
        role="navigation"
      >
        {/* Sidebar Header */}
        <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4">
          {!collapsed && (
            <h2 className="text-sm font-semibold">Files</h2>
          )}
          {onToggleCollapse && !isMobile && (
            <button
              onClick={onToggleCollapse}
              className="rounded-md p-1.5 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? (
                <FaBars className="h-4 w-4" />
              ) : (
                <FaTimes className="h-4 w-4" />
              )}
            </button>
          )}
          {isMobile && (
            <button
              onClick={onMobileClose}
              className="rounded-md p-1.5 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              aria-label="Close sidebar"
            >
              <FaTimes className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-auto p-2" aria-label="File navigation">
          <div className="mb-2">
            <Link
              to="/"
              className={cn(
                'flex items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors hover:bg-muted',
                collapsed ? 'justify-center' : ''
              )}
            >
              <FaHome className="h-4 w-4 shrink-0" />
              {!collapsed && <span>Home</span>}
            </Link>
          </div>

          {!collapsed && (
            <div className="mb-2 px-2">
              <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                Files
              </p>
            </div>
          )}

          <div role="tree">
            {fileTree.map((node, index) => (
              <FileTreeNode
                key={index}
                node={node}
                level={0}
                onFileClick={handleFileClick}
                activePath={activePath}
              />
            ))}
          </div>
        </nav>

        {/* Footer */}
        {!collapsed && (
          <div className="border-t border-sidebar-border p-3">
            <p className="text-xs text-muted-foreground">
              Folder-Site CLI v0.1.0
            </p>
          </div>
        )}
      </aside>
    </>
  );
}