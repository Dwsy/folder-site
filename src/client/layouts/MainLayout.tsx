import { ReactNode, useState, useEffect, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/sidebar/Sidebar.js';
import { Header } from '../components/header/Header.js';
import { cn } from '../utils/cn';

interface MainLayoutProps {
  children?: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(256);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      // Auto-collapse sidebar on mobile
      if (window.innerWidth < 1024) {
        setSidebarCollapsed(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load saved sidebar width from localStorage
  useEffect(() => {
    const savedWidth = localStorage.getItem('sidebar-width');
    if (savedWidth && !sidebarCollapsed) {
      setSidebarWidth(parseInt(savedWidth, 10));
    }
  }, [sidebarCollapsed]);

  // Handle sidebar toggle
  const handleSidebarToggle = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  // Handle mobile sidebar open/close
  const handleMobileSidebarOpen = useCallback(() => {
    setIsMobileSidebarOpen(true);
  }, []);

  const handleMobileSidebarClose = useCallback(() => {
    setIsMobileSidebarOpen(false);
  }, []);

  // Close mobile sidebar when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const sidebar = document.querySelector('[data-sidebar]');
      const toggleButton = document.querySelector('[data-sidebar-toggle]');
      if (
        isMobileSidebarOpen &&
        sidebar &&
        !sidebar.contains(e.target as Node) &&
        !toggleButton?.contains(e.target as Node)
      ) {
        setIsMobileSidebarOpen(false);
      }
    };

    if (isMobileSidebarOpen) {
      document.addEventListener('click', handleOutsideClick);
      return () => document.removeEventListener('click', handleOutsideClick);
    }
  }, [isMobileSidebarOpen]);

  // Close mobile sidebar on route change
  useEffect(() => {
    const handleRouteChange = () => {
      if (isMobile) {
        setIsMobileSidebarOpen(false);
      }
    };

    window.addEventListener('popstate', handleRouteChange);
    return () => window.removeEventListener('popstate', handleRouteChange);
  }, [isMobile]);

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      {/* Header */}
      <Header
        onMobileMenuClick={handleMobileSidebarOpen}
        showMobileMenuButton={isMobile}
      />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div
          data-sidebar
          className={cn(
            'transition-all duration-300 ease-in-out',
            sidebarCollapsed ? 'w-16' : 'w-[256px]',
            isMobile && 'fixed inset-y-0 left-0 z-50 h-full shadow-xl lg:static lg:shadow-none',
            isMobile && !isMobileSidebarOpen && '-translate-x-full lg:translate-x-0'
          )}
          style={
            !sidebarCollapsed && !isMobile
              ? { width: `${sidebarWidth}px` }
              : undefined
          }
        >
          <Sidebar
            collapsed={sidebarCollapsed}
            onToggleCollapse={handleSidebarToggle}
            isMobile={isMobile}
            onMobileClose={handleMobileSidebarClose}
          />
        </div>

        {/* Resize handle for desktop */}
        {!sidebarCollapsed && !isMobile && (
          <div
            className="relative w-1 cursor-col-resize bg-border hover:bg-primary/50 active:bg-primary transition-colors"
            onMouseDown={(e) => {
              e.preventDefault();
              const startX = e.clientX;
              const startWidth = sidebarWidth;

              const handleMouseMove = (e: MouseEvent) => {
                const diff = e.clientX - startX;
                const newWidth = Math.max(200, Math.min(500, startWidth + diff));
                setSidebarWidth(newWidth);
              };

              const handleMouseUp = () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
              };

              document.addEventListener('mousemove', handleMouseMove);
              document.addEventListener('mouseup', handleMouseUp);
              document.body.style.cursor = 'col-resize';
              document.body.style.userSelect = 'none';
            }}
            role="separator"
            aria-orientation="vertical"
            aria-valuenow={sidebarWidth}
            aria-valuemin={200}
            aria-valuemax={500}
            aria-label="Resize sidebar"
          />
        )}

        {/* Content Area */}
        <main
          className={cn(
            'flex-1 overflow-auto',
            isMobile && 'w-full'
          )}
        >
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}