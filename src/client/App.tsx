import { useState, useEffect, useCallback } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { ThemeProvider, useTheme } from './providers/ThemeProvider.js';
import { ErrorBoundary } from './components/ErrorBoundary.js';
import { SearchModal, type SearchResultItem } from './components/search/index.js';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts.js';
import { TOCProvider } from './contexts/TOCContext.js';

// 导入布局和页面
import { MainLayout } from './layouts/MainLayout.js';
import { Home } from './pages/Home.js';
import { Docs } from './pages/Docs.js';
import { Workhub } from './pages/Workhub.js';
import { FileView } from './pages/FileView.js';
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
  const [files, setFiles] = useState<SearchResultItem[]>([]);

  // 全局键盘快捷键
  useKeyboardShortcuts([
    { key: 'Cmd+K', callback: () => setSearchOpen(true) },
    { key: 'Cmd+P', callback: () => setSearchOpen(true) },
    { key: 'Cmd+D', callback: () => toggleTheme() },
    { key: 'Escape', callback: () => searchOpen && setSearchOpen(false) },
  ]);

  // 从 API 获取文件列表
  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const response = await fetch('/api/files/tree/list');

        if (!response.ok) {
          console.error('Failed to fetch files:', response.statusText);
          return;
        }

        const result = await response.json();

        if (result.success && result.data) {
          const flatFiles = flattenTree(result.data.tree);
          setFiles(flatFiles);
        }
      } catch (err) {
        console.error('Error fetching files:', err);
      }
    };

    fetchFiles();
  }, []);

  // 扁平化文件树
  const flattenTree = useCallback((node: any): SearchResultItem[] => {
    const items: SearchResultItem[] = [];

    const traverse = (n: any) => {
      if (!n.isDirectory) {
        items.push({
          name: n.name,
          path: n.relativePath || n.path,
          type: 'file',
          extension: n.name.split('.').pop(),
        });
      }

      if (n.children) {
        n.children.forEach(traverse);
      }
    };

    traverse(node);
    return items;
  }, []);

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
        files={files}
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
          { path: 'workhub', element: <Workhub /> },
          { path: 'file/*', element: <FileView /> },
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
        <TOCProvider>
          <RouterProvider router={router} />
        </TOCProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;