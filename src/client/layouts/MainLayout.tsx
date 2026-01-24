import { ReactNode, useState, useEffect, useCallback, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/sidebar/Sidebar.js';
import { Header } from '../components/header/Header.js';
import { SettingsPanel, SettingsButton } from '../components/settings/index.js';
import { MobileBottomNav } from '../components/mobile/MobileBottomNav.js';
import { SearchModal } from '../components/search/SearchModal.js';
import { cn } from '../utils/cn.js';
import { useTOC } from '../contexts/TOCContext.js';

interface MainLayoutProps {
  children?: ReactNode;
}

// 触摸滑动阈值（屏幕宽度的百分比）
const SWIPE_THRESHOLD = 0.3;
// 侧边栏移动的最大距离
const MAX_SIDEBAR_OFFSET = 85;

export function MainLayout({ children }: MainLayoutProps) {
  const location = useLocation();
  const { hasTOC, setHasTOC } = useTOC();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(256);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [fileTree, setFileTree] = useState<any[]>([]);

  // 触摸手势状态
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const sidebarTranslateX = useRef<number>(0);
  const isDraggingSidebar = useRef<boolean>(false);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = window.innerWidth < 1024;
      setIsMobile(isMobileDevice);
      // 只在首次加载时自动折叠侧边栏
      if (!initialized) {
        setSidebarCollapsed(isMobileDevice);
        setInitialized(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [initialized]);

  // Load saved sidebar width from localStorage
  useEffect(() => {
    const savedWidth = localStorage.getItem('sidebar-width');
    if (savedWidth && !sidebarCollapsed) {
      setSidebarWidth(parseInt(savedWidth, 10));
    }
  }, [sidebarCollapsed]);

  // 获取文件树用于搜索
  useEffect(() => {
    const fetchFileTree = async () => {
      try {
        const response = await fetch('/api/files/tree/list');
        const data = await response.json();
        if (data.success) {
          setFileTree([data.data.tree]);
        }
      } catch (error) {
        console.error('Failed to fetch file tree:', error);
      }
    };

    fetchFileTree();
  }, []);

  // 路由变化时重置 TOC 状态
  useEffect(() => {
    setHasTOC(false);
  }, [location.pathname, setHasTOC]);

  // 收集所有文件用于搜索
  const collectAllFiles = useCallback((nodes: any[]): any[] => {
    const files: any[] = [];
    const traverse = (node: any, currentPrefix: string = '') => {
      const nodePath = currentPrefix ? `${currentPrefix}/${node.path}` : node.path;

      if (node.type === 'file') {
        const extension = node.name.split('.').pop();
        files.push({
          name: node.name,
          path: `/file/${nodePath}`,
          type: 'file',
          extension,
        });
      } else if (node.isDirectory || node.type === 'folder') {
        files.push({
          name: node.name,
          path: `/file/${nodePath}`,
          type: 'folder',
        });
        if (node.children) {
          node.children.forEach((child: any) => traverse(child, nodePath));
        }
      }
    };
    nodes.forEach((node: any) => traverse(node));
    return files;
  }, []);

  // 打开搜索模态框
  const handleOpenSearch = useCallback(() => {
    setSearchOpen(true);
  }, []);

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

  // ========== 触摸手势处理 ==========
  // 从屏幕左边缘滑动打开侧边栏
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!isMobile || isMobileSidebarOpen) return;

    const touch = e.touches[0];
    const screenWidth = window.innerWidth;

    // 检测是否从左边缘开始触摸（30px 边缘区域）
    const isLeftEdge = touch.clientX <= 30;
    // 如果已经在侧边栏打开状态，检查是否在侧边栏内进行关闭滑动
    const sidebar = document.querySelector('[data-sidebar]');
    const isInSidebar = sidebar?.contains(e.target as Node);

    if (isLeftEdge && !isMobileSidebarOpen) {
      // 从左边缘开始，准备滑动打开侧边栏
      touchStartX.current = touch.clientX;
      touchStartY.current = touch.clientY;
      e.preventDefault();
    } else if (isInSidebar && isMobileSidebarOpen) {
      // 在侧边栏内，准备滑动关闭
      touchStartX.current = touch.clientX;
      touchStartY.current = touch.clientY;
      isDraggingSidebar.current = true;
    }
  }, [isMobile, isMobileSidebarOpen]);

  // 触摸移动 - 侧边栏跟随手指
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isMobile) return;

    const touch = e.touches[0];
    const screenWidth = window.innerWidth;

    // 处理从左边缘滑动打开侧边栏
    if (touchStartX.current !== null && !isMobileSidebarOpen) {
      const deltaX = touch.clientX - touchStartX.current;

      // 确保是向右滑动，且在合理范围内
      if (deltaX > 0 && deltaX <= screenWidth * 0.8) {
        // 计算侧边栏显示比例
        const progress = deltaX / (screenWidth * SWIPE_THRESHOLD);
        sidebarTranslateX.current = Math.min(deltaX, screenWidth * 0.85);

        // 应用平移效果到侧边栏
        const sidebar = document.querySelector('[data-sidebar]') as HTMLElement | null;
        if (sidebar) {
          sidebar.style.transform = `translateX(${Math.max(0, sidebarTranslateX.current - screenWidth * 0.85)}px)`;
        }

        // 更新遮罩层透明度
        const overlay = document.querySelector('[data-sidebar-overlay]') as HTMLElement | null;
        if (overlay) {
          overlay.setAttribute('data-opacity', String(Math.min(progress, 1)));
        }
      }
    }

    // 处理侧边栏内滑动关闭
    if (touchStartX.current !== null && isMobileSidebarOpen && isDraggingSidebar.current) {
      const deltaX = touch.clientX - touchStartX.current;

      // 从右向左滑动（负值）
      if (deltaX < 0) {
        const translateX = Math.max(deltaX, -screenWidth * 0.85);
        sidebarTranslateX.current = translateX;

        const sidebar = document.querySelector('[data-sidebar]') as HTMLElement | null;
        if (sidebar) {
          sidebar.style.transform = `translateX(${translateX}px)`;
        }
      }
    }
  }, [isMobile, isMobileSidebarOpen]);

  // 触摸结束 - 完成滑动或取消
  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!isMobile) return;

    const screenWidth = window.innerWidth;
    const threshold = screenWidth * SWIPE_THRESHOLD;

    // 处理从左边缘滑动打开侧边栏
    if (touchStartX.current !== null && !isMobileSidebarOpen) {
      const deltaX = (e.changedTouches[0].clientX) - touchStartX.current;

      // 如果滑动距离超过阈值，打开侧边栏
      if (deltaX > threshold) {
        setIsMobileSidebarOpen(true);
      }

      // 重置状态
      touchStartX.current = null;
      touchStartY.current = null;
      sidebarTranslateX.current = 0;

      // 重置侧边栏位置
      const sidebar = document.querySelector('[data-sidebar]') as HTMLElement | null;
      if (sidebar) {
        sidebar.style.transform = '';
      }
    }

    // 处理侧边栏内滑动关闭
    if (touchStartX.current !== null && isMobileSidebarOpen && isDraggingSidebar.current) {
      const deltaX = (e.changedTouches[0].clientX) - touchStartX.current;

      // 如果向左滑动超过阈值，关闭侧边栏
      if (deltaX < -threshold) {
        setIsMobileSidebarOpen(false);
      }

      // 重置状态
      touchStartX.current = null;
      touchStartY.current = null;
      isDraggingSidebar.current = false;
      sidebarTranslateX.current = 0;

      // 重置侧边栏位置
      const sidebar = document.querySelector('[data-sidebar]') as HTMLElement | null;
      if (sidebar) {
        sidebar.style.transform = '';
      }
    }
  }, [isMobile, isMobileSidebarOpen]);

  // 绑定触摸事件
  useEffect(() => {
    const container = document.querySelector('[data-main-layout]');
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      {/* Header */}
      <Header
        onSidebarToggle={handleMobileSidebarOpen}
        showSidebarToggle={isMobile}
        showMobileSearch={isMobile}
        onSearchClick={handleOpenSearch}
      />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Mobile sidebar overlay */}
        {isMobile && isMobileSidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={handleMobileSidebarClose}
            aria-hidden="true"
          />
        )}

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
            activePath={location.pathname}
            width={sidebarWidth}
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

                // 保存侧边栏宽度
                localStorage.setItem('sidebar-width', String(sidebarWidth));
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
            isMobile && 'w-full',
            hasTOC && 'lg:mr-64' // Add right margin for desktop TOC only when TOC exists
          )}
        >
          {children || <Outlet />}
        </main>
      </div>

      {/* Footer Bar */}
      <footer className="flex items-center justify-between border-t bg-card px-4 py-2 lg:hidden">
        <div className="text-xs text-muted-foreground">
          {isMobile ? 'Folder-Site' : 'Folder-Site CLI - One-command local website generator'}
        </div>
        <SettingsButton onClick={() => setIsSettingsOpen(true)} />
      </footer>

      {/* Desktop Footer Bar */}
      <footer className="hidden lg:flex items-center justify-between border-t bg-card px-4 py-2">
        <div className="text-xs text-muted-foreground">
          Folder-Site CLI - One-command local website generator
        </div>
        <SettingsButton onClick={() => setIsSettingsOpen(true)} />
      </footer>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        onMenuClick={() => setIsMobileSidebarOpen(true)}
      />

      {/* Search Modal */}
      <SearchModal
        open={searchOpen}
        onOpenChange={setSearchOpen}
        files={collectAllFiles(fileTree)}
        activePath={location.pathname}
      />

      {/* Settings Panel */}
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}