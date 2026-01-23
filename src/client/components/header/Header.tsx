import { ReactNode } from 'react';
import { FaBars, FaGithub, FaSearch } from 'react-icons/fa';
import { ThemeToggle } from '../theme/ThemeToggle.js';
import { cn } from '../../utils/cn.js';

export interface HeaderProps {
  /**
   * Title displayed in the header
   * @default "Folder-Site CLI"
   */
  title?: string;

  /**
   * Description displayed below the title
   */
  description?: string;

  /**
   * Show/hide the sidebar toggle button
   * @default true
   */
  showSidebarToggle?: boolean;

  /**
   * Callback when sidebar toggle is clicked
   */
  onSidebarToggle?: () => void;

  /**
   * Show/hide the theme toggle
   * @default true
   */
  showThemeToggle?: boolean;

  /**
   * Show/hide the GitHub link
   * @default true
   */
  showGitHubLink?: boolean;

  /**
   * GitHub repository URL
   * @default "https://github.com/yourusername/folder-site"
   */
  githubUrl?: string;

  /**
   * Show/hide the mobile search button
   * @default true
   */
  showMobileSearch?: boolean;

  /**
   * Callback when search button is clicked
   */
  onSearchClick?: () => void;

  /**
   * Additional actions to display on the right side
   */
  actions?: ReactNode;

  /**
   * Custom class name
   */
  className?: string;

  /**
   * Is sidebar collapsed?
   */
  sidebarCollapsed?: boolean;
}

export function Header({
  title = 'Folder-Site CLI',
  description = 'One-command local website generator',
  showSidebarToggle = true,
  onSidebarToggle,
  showThemeToggle = true,
  showGitHubLink = true,
  githubUrl = 'https://github.com/yourusername/folder-site',
  showMobileSearch = true,
  onSearchClick,
  actions,
  className,
  sidebarCollapsed,
}: HeaderProps) {
  return (
    <header
      className={cn(
        'flex h-14 items-center justify-between border-b bg-card px-4 transition-all duration-200',
        className
      )}
    >
      {/* Left side - Logo and title */}
      <div className="flex items-center gap-4">
        {showSidebarToggle && onSidebarToggle && (
          <button
            onClick={onSidebarToggle}
            className="rounded-md p-2 hover:bg-muted transition-colors"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <FaBars className="h-5 w-5" />
          </button>
        )}

        <img
          src="/logo.svg"
          alt="Folder-Site Logo"
          className="h-8 w-8"
        />
        <div className="flex flex-col">
          <h1 className="text-lg font-semibold leading-tight">{title}</h1>
          {description && (
            <p className="hidden text-xs text-muted-foreground sm:block">
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-2">
        {actions}

        {/* Mobile search button - 仅在移动端显示 */}
        {showMobileSearch && onSearchClick && (
          <button
            onClick={onSearchClick}
            className="relative rounded-md p-2 hover:bg-muted transition-all active:scale-95 lg:hidden"
            aria-label="Open search"
            title="Open search"
            style={{ minHeight: '44px', minWidth: '44px' }}
          >
            <FaSearch className="h-5 w-5" />
            {/* 搜索按钮点击波纹效果 */}
            <span className="absolute inset-0 rounded-md bg-primary/20 opacity-0 transition-opacity active:opacity-100" />
          </button>
        )}

        {showThemeToggle && <ThemeToggle />}

        {showGitHubLink && (
          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md p-2 hover:bg-muted transition-colors"
            aria-label="View on GitHub"
            title="View on GitHub"
            style={{ minHeight: '44px', minWidth: '44px' }}
          >
            <FaGithub className="h-5 w-5" />
          </a>
        )}
      </div>
    </header>
  );
}