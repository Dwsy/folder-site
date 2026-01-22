/**
 * Layout component types
 */

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  collapsed?: boolean;
}

export interface SidebarProps {
  className?: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  isMobile?: boolean;
  onMobileClose?: () => void;
}

export interface ResizablePanelProps {
  children: React.ReactNode;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  className?: string;
  onResize?: (width: number) => void;
  collapsed?: boolean;
  collapsedWidth?: number;
}

export interface HeaderProps {
  className?: string;
  onMobileMenuClick?: () => void;
  showMobileMenuButton?: boolean;
}

export interface MainLayoutProps {
  children?: React.ReactNode;
}