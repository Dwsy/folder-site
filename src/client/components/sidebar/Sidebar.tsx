import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FaHome,
  FaChevronDown,
  FaChevronRight,
  FaBars,
  FaTimes,
  FaSync,
  FaExpandAlt,
  FaCompressAlt,
  FaCrosshairs,
  FaSearch,
} from 'react-icons/fa';
import {
  FileIcon,
  FolderIcon,
  DefaultFolderOpenedIcon,
} from '@react-symbols/icons/utils';
import { cn } from '../../utils/cn.js';
import { SearchModal } from '../search/SearchModal.js';
import { FilePreviewModal } from '../file-preview/FilePreviewModal.js';
import { useFileAccessHistory } from '../../hooks/useFileAccessHistory.js';
import { useTabs } from '../../contexts/TabsContext.js';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  collapsed?: boolean;
}

interface DirectoryTreeNode {
  name: string;
  path: string;
  relativePath: string;
  isDirectory: boolean;
  children?: DirectoryTreeNode[];
}

interface TreeResponse {
  success: boolean;
  data: {
    root: string;
    tree: DirectoryTreeNode;
    totalNodes: number;
  };
  timestamp: number;
  error?: string;
}

function getFileIcon(filename: string) {
  return <FileIcon fileName={filename} width={16} height={16} />;
}

interface FileTreeNodeProps {
  node: FileNode;
  level?: number;
  onFileClick?: (path: string, name: string) => void;
  onFileAltClick?: (path: string, name: string, e: React.MouseEvent) => void;
  activePath?: string;
  onToggleCollapse?: (path: string) => void;
  expandedPaths?: Set<string>;
}

function FileTreeNode({ node, level = 0, onFileClick, onFileAltClick, activePath, onToggleCollapse, expandedPaths }: FileTreeNodeProps) {
  const isExpanded = expandedPaths?.has(node.path);
  const isActive = activePath === `/file/${node.path}`;

  const handleFolderClick = useCallback(() => {
    onToggleCollapse?.(node.path);
  }, [node.path, onToggleCollapse]);

  const handleFileClick = useCallback((e: React.MouseEvent) => {
    // Alt+点击打开文件预览模态框
    if (e.altKey && onFileAltClick) {
      e.preventDefault();
      e.stopPropagation();
      onFileAltClick(node.path, node.name, e);
      return;
    }
    onFileClick?.(node.path, node.name);
  }, [node.path, node.name, onFileClick, onFileAltClick]);

  if (node.type === 'folder') {
    const paddingLeft = level * 12 + 8;
    const originX = paddingLeft + 10; // 箭头图标的位置

    return (
      <div role="treeitem" aria-expanded={isExpanded}>
        <button
          onClick={handleFolderClick}
          className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors hover:bg-muted"
          style={{ paddingLeft: `${paddingLeft}px` }}
          aria-label={isExpanded ? `Collapse ${node.name}` : `Expand ${node.name}`}
        >
          <span
            className={cn(
              'flex h-3 w-3 items-center justify-center',
              'transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
              isExpanded ? 'rotate-90' : 'rotate-0'
            )}
          >
            {isExpanded ? (
              <FaChevronDown className="h-3 w-3 text-muted-foreground" />
            ) : (
              <FaChevronRight className="h-3 w-3 text-muted-foreground" />
            )}
          </span>
          <span className="shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]">
            {isExpanded ? (
              <DefaultFolderOpenedIcon width={16} height={16} />
            ) : (
              <FolderIcon folderName={node.name} width={16} height={16} />
            )}
          </span>
          <span className="flex-1 text-left">{node.name}</span>
        </button>
        {node.children && (
          <div
            className={cn(
              'overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
              isExpanded ? 'opacity-100 max-h-[5000px]' : 'opacity-0 max-h-0'
            )}
            style={{
              transformOrigin: `${originX}px 0px`,
              transform: isExpanded ? 'scale(1)' : 'scale(0.85)',
            }}
          >
            <div
              className={cn(
                'transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
                'origin-top',
                isExpanded ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
              )}
            >
              {node.children.map((child, index) => (
                <FileTreeNode
                  key={index}
                  node={child}
                  level={level + 1}
                  onFileClick={onFileClick}
                  onFileAltClick={onFileAltClick}
                  activePath={activePath}
                  onToggleCollapse={onToggleCollapse}
                  expandedPaths={expandedPaths}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      to={`/file/${node.path}`}
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
  width?: number;
}

export function Sidebar({
  className,
  collapsed = false,
  onToggleCollapse,
  isMobile = false,
  onMobileClose,
  fileTree: externalFileTree,
  activePath,
  width = 256,
}: SidebarProps) {
  const [fileTree, setFileTree] = useState<FileNode[]>(externalFileTree || []);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const [previewOpen, setPreviewOpen] = useState<boolean>(false);
  const [previewFilePath, setPreviewFilePath] = useState<string>('');

  // 访问历史 hook
  useFileAccessHistory();

  // 判断是否为 Mac
  const isMac = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return /Mac|iPod|iPhone|iPad/.test(window.navigator.platform);
  }, []);

  // 快捷键提示
  const shortcutKey = isMac ? '⌘' : 'Ctrl';

  // Fetch file tree from API
  useEffect(() => {
    const fetchFileTree = async () => {
      if (externalFileTree) {
        setFileTree(externalFileTree);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/files/tree/list');

        if (!response.ok) {
          throw new Error(`Failed to fetch file tree: ${response.statusText}`);
        }

        const result: TreeResponse = await response.json();

        if (result.success && result.data) {
          const convertedTree = convertToTreeNodes(result.data.tree.children || []);
          setFileTree(convertedTree);
        } else {
          throw new Error(result.error || 'Failed to parse file tree');
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load file tree'));
        console.error('Error fetching file tree:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFileTree();
  }, [externalFileTree]);

  // Convert DirectoryTreeNode to FileNode
  const convertToTreeNodes = useCallback((nodes: DirectoryTreeNode[]): FileNode[] => {
    return nodes.map((node) => ({
      name: node.name,
      path: node.relativePath || node.path,
      type: node.isDirectory ? 'folder' : 'file',
      collapsed: !node.isDirectory,
      children: node.children ? convertToTreeNodes(node.children) : undefined,
    }));
  }, []);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setError(null);
    setLoading(true);
    window.location.reload();
  }, []);

  // Collect all folder paths
  const collectFolderPaths = useCallback((nodes: FileNode[]): string[] => {
    const paths: string[] = [];
    const traverse = (node: FileNode) => {
      if (node.type === 'folder') {
        paths.push(node.path);
        if (node.children) {
          node.children.forEach(traverse);
        }
      }
    };
    nodes.forEach(traverse);
    return paths;
  }, []);

  // Handle expand all
  const handleExpandAll = useCallback(() => {
    const allPaths = collectFolderPaths(fileTree);
    setExpandedPaths(new Set(allPaths));
  }, [fileTree, collectFolderPaths]);

  // Handle collapse all
  const handleCollapseAll = useCallback(() => {
    setExpandedPaths(new Set());
  }, []);

  // Locate current file - expand all parent folders
  const handleLocateCurrent = useCallback(() => {
    if (!activePath) return;

    const filePath = activePath.replace('/file/', '');
    const pathsToExpand: string[] = [];

    const findParentPaths = (nodes: FileNode[], targetPath: string, currentPrefix: string = ''): boolean => {
      for (const node of nodes) {
        const nodePath = currentPrefix ? `${currentPrefix}/${node.path}` : node.path;
        
        if (nodePath === filePath) {
          return true;
        }
        
        if (node.type === 'folder' && node.children) {
          if (findParentPaths(node.children, targetPath, nodePath)) {
            pathsToExpand.push(nodePath);
            return true;
          }
        }
      }
      return false;
    };

    findParentPaths(fileTree, filePath);
    setExpandedPaths(new Set(pathsToExpand));
  }, [fileTree, activePath]);

  // Toggle folder collapse
  const handleToggleCollapse = useCallback((path: string) => {
    setExpandedPaths(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  // Collect all files for search
  const collectAllFiles = useCallback((nodes: FileNode[]): Array<{ name: string; path: string; type: 'file' | 'folder'; extension?: string }> => {
    const files: Array<{ name: string; path: string; type: 'file' | 'folder'; extension?: string }> = [];
    const traverse = (node: FileNode, currentPrefix: string = '') => {
      const nodePath = currentPrefix ? `${currentPrefix}/${node.path}` : node.path;
      
      if (node.type === 'file') {
        const extension = node.name.split('.').pop();
        files.push({
          name: node.name,
          path: `/file/${nodePath}`,
          type: 'file',
          extension,
        });
      } else if (node.type === 'folder') {
        files.push({
          name: node.name,
          path: `/file/${nodePath}`,
          type: 'folder',
        });
        if (node.children) {
          node.children.forEach(child => traverse(child, nodePath));
        }
      }
    };
    nodes.forEach(node => traverse(node));
    return files;
  }, []);

  // Handle open search
  const handleOpenSearch = useCallback(() => {
    setSearchOpen(true);
  }, []);

  // Handle file alt+click to open preview modal
  const handleFileAltClick = useCallback((path: string, name: string, e: React.MouseEvent) => {
    setPreviewFilePath(path);
    setPreviewOpen(true);
  }, []);

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

  const { openTab } = useTabs();

  const handleFileClick = useCallback((path: string, name: string) => {
    // 记录访问历史
    const { recordAccess } = useFileAccessHistory.getState();
    recordAccess(path, name);

    // 打开标签页
    const extension = name.split('.').pop();
    openTab(path, name, extension);

    if (isMobile) {
      onMobileClose?.();
    }
  }, [isMobile, onMobileClose, openTab]);

  return (
    <>
      {/* Sidebar */}
      <aside
        className={cn(
          'flex h-full flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out',
          collapsed ? 'w-16' : '',
          isMobile && 'fixed inset-y-0 left-0 z-50 shadow-xl lg:static lg:shadow-none',
          className
        )}
        style={!collapsed && !isMobile ? { width: `${width}px` } : undefined}
        aria-label="File navigation sidebar"
        role="navigation"
      >
        {/* Sidebar Header */}
        <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold">Files</h2>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleExpandAll}
                  className="rounded-md p-1 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  aria-label="Expand all folders"
                  title="Expand all"
                >
                  <FaExpandAlt className="h-3 w-3" />
                </button>
                <button
                  onClick={handleCollapseAll}
                  className="rounded-md p-1 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  aria-label="Collapse all folders"
                  title="Collapse all"
                >
                  <FaCompressAlt className="h-3 w-3" />
                </button>
                <button
                  onClick={handleLocateCurrent}
                  className="rounded-md p-1 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  aria-label="Locate current file"
                  title="Locate current"
                >
                  <FaCrosshairs className="h-3 w-3" />
                </button>
                <button
                  onClick={handleOpenSearch}
                  className="rounded-md p-1 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  aria-label="Search files"
                  title={`Search (${shortcutKey}+K)`}
                >
                  <FaSearch className="h-3 w-3" />
                </button>
              </div>
            </div>
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
            <div className="mb-2 flex items-center justify-between px-2">
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                Files
              </p>
              {error && (
                <button
                  onClick={handleRefresh}
                  className="rounded p-1 text-muted-foreground hover:text-foreground"
                  aria-label="Refresh file tree"
                  title="Retry loading"
                >
                  <FaSync className="h-3 w-3" />
                </button>
              )}
            </div>
          )}

          <div role="tree">
            {loading && !collapsed && (
              <div className="flex items-center justify-center py-8">
                <FaSync className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}

            {error && !collapsed && (
              <div className="px-2 py-4 text-center text-xs text-destructive">
                Failed to load files
              </div>
            )}

            {!loading && fileTree.map((node, index) => (
              <FileTreeNode
                key={index}
                node={node}
                level={0}
                onFileClick={handleFileClick}
                onFileAltClick={handleFileAltClick}
                activePath={activePath}
                onToggleCollapse={handleToggleCollapse}
                expandedPaths={expandedPaths}
              />
            ))}

            {!loading && fileTree.length === 0 && !collapsed && (
              <div className="px-2 py-4 text-center text-xs text-muted-foreground">
                No files found
              </div>
            )}
          </div>
        </nav>

        {/* Footer */}
        {!collapsed && (
          <div className="border-t border-sidebar-border p-3">
          </div>
        )}
      </aside>

      {/* Search Modal */}
      <SearchModal
        open={searchOpen}
        onOpenChange={setSearchOpen}
        files={collectAllFiles(fileTree)}
        activePath={activePath}
      />

      {/* File Preview Modal */}
      <FilePreviewModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        filePath={previewFilePath}
      />
    </>
  );
}