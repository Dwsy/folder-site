import { useState, useEffect, useCallback } from 'react';
import { RouterProvider, useLocation } from 'react-router-dom';
import { ThemeProvider, useTheme } from './providers/ThemeProvider.js';
import { ErrorBoundary } from './components/ErrorBoundary.js';
import { SearchModal } from './components/search/index.js';
import { router } from './router/index.js';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts.js';

/**
 * App 内部组件，负责处理全局状态和搜索模态框
 */
function AppContent() {
  const location = useLocation();
  const { toggleTheme } = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);

  // 全局键盘快捷键
  useKeyboardShortcuts(
    {
      'mod+k': () => setSearchOpen(true),
      'mod+d': () => toggleTheme(),
      'Escape': () => searchOpen && setSearchOpen(false),
    },
    [searchOpen, toggleTheme]
  );

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
  const handleSearchSelect = useCallback((item: any) => {
    console.log('Selected:', item);
  }, []);

  // 关闭搜索模态框当路由变化时
  useEffect(() => {
    if (searchOpen) {
      setSearchOpen(false);
    }
  }, [location.pathname, searchOpen]);

  return (
    <>
      <RouterProvider router={router} />
      
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

/**
 * 主应用组件
 */
function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;