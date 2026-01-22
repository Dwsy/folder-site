import { useState, useEffect, useCallback } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { ThemeProvider, useTheme } from './providers/ThemeProvider.js';
import { ErrorBoundary } from './components/ErrorBoundary.js';
import { SearchModal, type SearchResultItem } from './components/search/index.js';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts.js';

// 导入布局和页面
import { MainLayout } from './layouts/MainLayout.js';
import { Home } from './pages/Home.js';
import { Docs } from './pages/Docs.js';
import { Search as SearchPage } from './pages/Search.js';
import { Help } from './pages/Help.js';
import { NotFound } from './pages/NotFound.js';

/**
 * 根布局组件，包含全局状态和搜索模态框
 */
function RootLayout() {
  const location = useLocation();
  const { toggleTheme } = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);

  // 全局键盘快捷键
  useKeyboardShortcuts([
    { key: 'Cmd+K', callback: () => setSearchOpen(true) },
    { key: 'Cmd+P', callback: () => setSearchOpen(true) },
    { key: 'Cmd+D', callback: () => toggleTheme() },
    { key: 'Escape', callback: () => searchOpen && setSearchOpen(false) },
  ]);

  // 模拟文件列表数据
  // TODO: 从 API 获取真实的文件列表
  const mockFiles = [
    { name: 'README.md', path: '/README.md', type: 'file' as const, extension: 'md' },
    { name: 'package.json', path: '/package.json', type: 'file' as const, extension: 'json' },
    { name: 'tsconfig.json', path: '/tsconfig.json', type: 'file' as const, extension: 'json' },
    { name: 'docs', path: '/docs', type: 'folder' as const },
    { name: 'getting-started.md', path: '/docs/getting-started.md', type: 'file' as const, extension: 'md' },
    { name: 'architecture.md', path: '/docs/architecture.md', type: 'file' as const, extension: 'md' },
    { name: 'src', path: '/src', type: 'folder' as const },
    { name: 'index.ts', path: '/src/index.ts', type: 'file' as const, extension: 'ts' },
    { name: 'main.tsx', path: '/src/main.tsx', type: 'file' as const, extension: 'tsx' },
    { name: 'components', path: '/src/components', type: 'folder' as const },
    { name: 'Button.tsx', path: '/src/components/Button.tsx', type: 'file' as const, extension: 'tsx' },
    { name: 'Card.tsx', path: '/src/components/Card.tsx', type: 'file' as const, extension: 'tsx' },
  ];

  // 处理搜索结果选择
  const handleSearchSelect = useCallback((item: SearchResultItem) => {
    console.log('Selected:', item);
  }, []);

  // 关闭搜索模态框当路由变化时
  useEffect(() => {
    // 不自动关闭搜索框，让用户通过 ESC 关闭或选择结果后导航
  }, [location.pathname, location.hash, searchOpen]);

  return (
    <>
      <Outlet />
      
      {/* 搜索模态框 */}
      <SearchModal
        open={searchOpen}
        onOpenChange={setSearchOpen}
        files={mockFiles}
        activePath={location.pathname}
        onSelect={handleSearchSelect}
      />
    </>
  );
}

// 创建路由
const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        element: <MainLayout />,
        children: [
          { index: true, element: <Home /> },
          { path: 'docs', element: <Docs /> },
          { path: 'features', element: <Home /> },
          { path: 'about', element: <Home /> },
          { path: 'search', element: <SearchPage /> },
          { path: 'help', element: <Help /> },
          { path: '*', element: <NotFound /> },
        ],
      },
    ],
  },
]);

/**
 * 主应用组件
 */
function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;