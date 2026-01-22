import { useState } from 'react';
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
} from 'react-icons/fa';

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

function FileTreeNode({ node, level = 0 }: { node: FileNode; level?: number }) {
  const [collapsed, setCollapsed] = useState(node.collapsed ?? false);
  const location = useLocation();

  const isActive = location.pathname === node.path;

  if (node.type === 'folder') {
    return (
      <div>
        <button
          onClick={() => setCollapsed(!collapsed)}
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
              <FileTreeNode key={index} node={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      to={node.path}
      className={`flex items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors hover:bg-muted ${
        isActive ? 'bg-accent text-accent-foreground' : ''
      }`}
      style={{ paddingLeft: `${level * 12 + 28}px` }}
    >
      {getFileIcon(node.name)}
      <span className="flex-1 truncate">{node.name}</span>
    </Link>
  );
}

export function Sidebar() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <aside className="w-64 border-r bg-card">
      <div className="flex h-full flex-col">
        {/* Search */}
        <div className="border-b p-3">
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-auto p-2">
          <div className="mb-2">
            <Link
              to="/"
              className="flex items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors hover:bg-muted"
            >
              <FaHome className="h-4 w-4" />
              <span>Home</span>
            </Link>
          </div>

          <div className="mb-2 px-2">
            <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Files</p>
          </div>

          <div>
            {mockFileTree.map((node, index) => (
              <FileTreeNode key={index} node={node} />
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t p-3">
          <p className="text-xs text-muted-foreground">
            Folder-Site CLI v0.1.0
          </p>
        </div>
      </div>
    </aside>
  );
}
