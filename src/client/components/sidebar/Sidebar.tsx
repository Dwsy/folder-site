import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FaHome,
  FaBook,
  FaFolder,
  FaFolderOpen,
  FaChevronDown,
  FaChevronRight,
  FaFile,
  FaFileCode,
  FaMarkdown,
  FaFilePdf,
  FaBars,
  FaTimes,
  FaSearch,
} from 'react-icons/fa';
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
  const ext = filename.split('.').pop()?.toLowerCase();

  if (filename === 'README.md') return <FaBook className="h-4 w-4 text-blue-500" />;
  if (ext === 'md') return <FaMarkdown className="h-4 w-4 text-blue-500" />;
  if (ext === 'pdf') return <FaFilePdf className="h-4 w-4 text-red-500" />;
  if (['ts', 'tsx', 'js', 'jsx', 'json'].includes(ext || '')) {
    return <FaFileCode className="h-4 w-4 text-yellow-500" />;
  }
  return <FaFile className="h-4 w-4 text-gray-500" />;
}

interface FileTreeNodeProps {
  node: FileNode;
  level?: number;
  onFileClick?: (path: string) => void;
}

function FileTreeNode({ node, level = 0, onFileClick }: FileTreeNodeProps) {
  const [collapsed, setCollapsed] = useState(node.collapsed ?? false);
  const location = useLocation();

  const isActive = location.pathname === node.path;

  const handleFolderClick = useCallback(() => {
    setCollapsed(!collapsed);
  }, [collapsed]);

  const handleFileClick = useCallback(() => {
    onFileClick?.(node.path);
  }, [node.path, onFileClick]);

  if (node.type === 'folder') {
    return (
      <div>
        <button
          onClick={handleFolderClick}
          className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors hover:bg-muted"
          style={{ paddingLeft: `${level * 12 + 8}px` }}
        >
          {collapsed ? (
            <FaChevronRight className="h-3 w-3 text-muted-foreground" />
          ) : (
            <FaChevronDown className="h-3 w-3 text-muted-foreground" />
          )}
          {collapsed ? (
            <FaFolder className="h-4 w-4 text-yellow-500" />
          ) : (
            <FaFolderOpen className="h-4 w-4 text-yellow-500" />
          )}
          <span className="flex-1 text-left">{node.name}</span>
        </button>
        {!collapsed && node.children && (
          <div>
            {node.children.map((child, index) => (
              <FileTreeNode key={index} node={child} level={level + 1} onFileClick={onFileClick} />
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
}

export function Sidebar({
  className,
  collapsed = false,
  onToggleCollapse,
  isMobile = false,
  onMobileClose,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');

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

  // Filter file tree based on search query
  const filteredFileTree = useMemo(() => {
    if (!searchQuery.trim()) {
      return mockFileTree;
    }

    const filterNodes = (nodes: FileNode[]): FileNode[] => {
      return nodes
        .map((node) => {
          if (node.type === 'file') {
            return node.name.toLowerCase().includes(searchQuery.toLowerCase()) ? node : null;
          } else {
            const filteredChildren = filterNodes(node.children || []);
            if (
              filteredChildren.length > 0 ||
              node.name.toLowerCase().includes(searchQuery.toLowerCase())
            ) {
              return {
                ...node,
                children: filteredChildren,
                collapsed: false, // Auto-expand when searching
              };
            }
            return null;
          }
        })
        .filter((node): node is FileNode => node !== null);
    };

    return filterNodes(mockFileTree);
  }, [searchQuery]);

  const handleFileClick = useCallback(() => {
    if (isMobile) {
      onMobileClose?.();
    }
  }, [isMobile, onMobileClose]);

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'flex h-full flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out',
          collapsed ? 'w-16' : 'w-64',
          isMobile && 'fixed inset-y-0 left-0 z-50 shadow-xl lg:static lg:shadow-none',
          className
        )}
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

        {/* Search */}
        {!collapsed && (
          <div className="border-b border-sidebar-border p-3">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-auto p-2">
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

          <div>
            {filteredFileTree.map((node, index) => (
              <FileTreeNode key={index} node={node} onFileClick={handleFileClick} />
            ))}
          </div>

          {/* Empty state when search has no results */}
          {searchQuery && filteredFileTree.length === 0 && (
            <div className="px-2 py-4 text-center text-sm text-muted-foreground">
              No files found
            </div>
          )}
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