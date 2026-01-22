/**
 * Workhub Layout Component
 *
 * Provides a specialized layout for the Workhub page with:
 * - Sidebar navigation for ADRs, Issues, PRs
 * - Breadcrumb navigation
 * - Responsive design
 * - Quick action buttons
 */

import { ReactNode, useState, useEffect, useCallback } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../../utils/cn.js';
import {
  FiFileText,
  FiAlertCircle,
  FiGitPullRequest,
  FiHome,
  FiSettings,
  FiRefreshCw,
  FiPlus,
  FiX,
  FiMenu,
  FiChevronRight,
} from 'react-icons/fi';

export type WorkhubTab = 'overview' | 'adrs' | 'issues' | 'prs';

interface WorkhubLayoutProps {
  children?: ReactNode;
  className?: string;
  onRefresh?: () => void;
  loading?: boolean;
}

interface TabConfig {
  id: WorkhubTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const tabs: TabConfig[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: FiHome,
    description: 'Dashboard and statistics',
  },
  {
    id: 'adrs',
    label: 'ADRs',
    icon: FiFileText,
    description: 'Architecture Decision Records',
  },
  {
    id: 'issues',
    label: 'Issues',
    icon: FiAlertCircle,
    description: 'Task and issue tracking',
  },
  {
    id: 'prs',
    label: 'PRs',
    icon: FiGitPullRequest,
    description: 'Pull requests and code changes',
  },
];

/**
 * Breadcrumb component
 */
function Breadcrumb({ items }: { items: { label: string; path?: string }[] }) {
  const navigate = useNavigate();

  return (
    <nav className="flex items-center gap-2 text-sm text-muted-foreground" aria-label="Breadcrumb">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          {index > 0 && <FiChevronRight className="h-4 w-4" />}
          {item.path ? (
            <button
              onClick={() => item.path && navigate(item.path)}
              className="hover:text-foreground transition-colors"
            >
              {item.label}
            </button>
          ) : (
            <span className="font-medium text-foreground">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}

/**
 * Sidebar navigation component
 */
function Sidebar({
  activeTab,
  onTabChange,
  collapsed,
  onToggleCollapse,
  isMobile,
  onClose,
}: {
  activeTab: WorkhubTab;
  onTabChange: (tab: WorkhubTab) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  isMobile: boolean;
  onClose: () => void;
}) {
  return (
    <aside
      className={cn(
        'flex flex-col border-r border-border bg-background',
        collapsed ? 'w-16' : 'w-64',
        isMobile ? 'fixed inset-y-0 left-0 z-50 h-full shadow-xl' : 'h-full'
      )}
      role="navigation"
      aria-label="Workhub navigation"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-4">
        {!collapsed && (
          <div>
            <h2 className="text-lg font-semibold text-foreground">Workhub</h2>
            <p className="text-xs text-muted-foreground">Documentation Hub</p>
          </div>
        )}
        <button
          onClick={isMobile ? onClose : onToggleCollapse}
          className={cn(
            'rounded-md p-1.5 transition-colors hover:bg-accent',
            collapsed && !isMobile && 'mx-auto'
          )}
          aria-label={isMobile ? 'Close sidebar' : collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isMobile ? <FiX className="h-5 w-5" /> : collapsed ? <FiMenu className="h-5 w-5" /> : <FiMenu className="h-5 w-5" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2" role="menu">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              onTabChange(tab.id);
              if (isMobile) onClose();
            }}
            className={cn(
              'flex w-full items-center gap-3 rounded-md px-3 py-2.5 transition-colors',
              activeTab === tab.id
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              collapsed && 'justify-center'
            )}
            role="menuitem"
            aria-current={activeTab === tab.id ? 'page' : undefined}
            title={collapsed ? `${tab.label} - ${tab.description}` : undefined}
          >
            <tab.icon className={cn('h-5 w-5 flex-shrink-0', activeTab === tab.id && 'text-primary')} />
            {!collapsed && (
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium">{tab.label}</span>
                {!collapsed && (
                  <span className="text-xs text-muted-foreground">{tab.description}</span>
                )}
              </div>
            )}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-2">
        <button
          className={cn(
            'flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
            collapsed && 'justify-center'
          )}
          aria-label="Settings"
        >
          <FiSettings className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span>Settings</span>}
        </button>
      </div>
    </aside>
  );
}

/**
 * Main Workhub Layout Component
 */
export function WorkhubLayout({
  children,
  className,
  onRefresh,
  loading = false,
}: WorkhubLayoutProps) {
  const [activeTab, setActiveTab] = useState<WorkhubTab>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const location = useLocation();

  // Handle responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      setSidebarCollapsed(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Sync active tab with URL query param
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab') as WorkhubTab | null;
    if (tabParam && tabs.some((t) => t.id === tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  // Handle tab change
  const handleTabChange = useCallback(
    (tab: WorkhubTab) => {
      setActiveTab(tab);
      // Update URL without full navigation
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      window.history.replaceState({}, '', url.toString());
    },
    []
  );

  // Generate breadcrumb items
  const breadcrumbItems = [
    { label: 'Workhub', path: '/workhub?tab=overview' },
    { label: tabs.find((t) => t.id === activeTab)?.label || '' },
  ];

  return (
    <div className={cn('flex h-screen flex-col bg-background text-foreground', className)}>
      {/* Mobile sidebar overlay */}
      {isMobile && isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        isMobile={isMobile}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-border bg-background px-6 py-4">
          <div className="flex items-center gap-4">
            {isMobile && (
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label="Open navigation"
              >
                <FiMenu className="h-5 w-5" />
              </button>
            )}
            <Breadcrumb items={breadcrumbItems} />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              disabled={loading}
              className={cn(
                'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                loading
                  ? 'text-muted-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              )}
              aria-label="Refresh"
            >
              <FiRefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              className="flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              aria-label="Create new"
            >
              <FiPlus className="h-4 w-4" />
              <span className="hidden sm:inline">New</span>
            </button>
          </div>
        </header>

        {/* Content area */}
        <main className="flex-1 overflow-auto">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}

/**
 * Workhub Tab Content Wrapper
 */
export function WorkhubTabContent({
  tab,
  children,
  className,
}: {
  tab: WorkhubTab;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="h-full">
      {/* Tab header */}
      <div className="border-b border-border bg-background px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {tabs.find((t) => t.id === tab)?.label}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {tabs.find((t) => t.id === tab)?.description}
            </p>
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className={cn('p-6', className)}>
        {children}
      </div>
    </div>
  );
}

/**
 * Use Workhub Tab Hook
 *
 * Helper hook to access current tab in child components
 */
export function useWorkhubTab() {
  const location = useLocation();
  const tab = (new URLSearchParams(location.search).get('tab') as WorkhubTab) || 'overview';

  return {
    tab,
    setTab: (newTab: WorkhubTab) => {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', newTab);
      window.history.replaceState({}, '', url.toString());
    },
  };
}