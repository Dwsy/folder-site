import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { FaSearch } from 'react-icons/fa';
import { SearchModal, SearchResults, type SearchResultItem } from '../components/search/index.js';

/**
 * 搜索页面组件
 */
export function Search() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

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

  // 执行搜索
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);

    // 模拟搜索延迟
    await new Promise((resolve) => setTimeout(resolve, 300));

    // 简单的搜索过滤
    const results = mockFiles.filter((file) => {
      const lowerQuery = searchQuery.toLowerCase();
      return (
        file.name.toLowerCase().includes(lowerQuery) ||
        file.path.toLowerCase().includes(lowerQuery)
      );
    });

    // 计算匹配分数
    const scoredResults = results.map((file) => {
      const score = calculateMatchScore(file, searchQuery);
      return {
        ...file,
        score,
      };
    }).sort((a, b) => (b.score || 0) - (a.score || 0));

    setSearchResults(scoredResults);
    setIsLoading(false);
  }, [mockFiles]);

  // 计算匹配分数（与 SearchModal 中的算法保持一致）
  function calculateMatchScore(
    file: { name: string; path: string; type: 'file' | 'folder' },
    query: string
  ): number {
    const lowerQuery = query.toLowerCase();
    const lowerName = file.name.toLowerCase();
    const lowerPath = file.path.toLowerCase();

    let score = 0;

    if (lowerName === lowerQuery) {
      score += 100;
    } else if (lowerName.startsWith(lowerQuery)) {
      score += 80;
    } else if (lowerName.includes(lowerQuery)) {
      score += 60;
    }

    if (lowerPath.includes(lowerQuery)) {
      score += 40;
    }

    // 字符匹配
    let matchCount = 0;
    let queryIndex = 0;
    for (const char of lowerName) {
      if (char === lowerQuery[queryIndex]) {
        matchCount++;
        queryIndex++;
        if (queryIndex >= lowerQuery.length) break;
      }
    }

    if (matchCount === lowerQuery.length) {
      score += 50 + (matchCount / lowerName.length) * 20;
    }

    if (file.type === 'folder') {
      score += 10;
    }

    const depth = file.path.split('/').length;
    score += Math.max(0, 10 - depth);

    return score;
  }

  // 初始搜索
  useEffect(() => {
    if (query) {
      performSearch(query);
    }
  }, []);

  // 更新 URL 查询参数
  useEffect(() => {
    if (query) {
      setSearchParams({ q: query });
    } else {
      setSearchParams({});
    }
  }, [query, setSearchParams]);

  // 处理查询输入变化（防抖）
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, performSearch]);

  // 处理结果点击
  const handleResultClick = useCallback(
    (item: SearchResultItem, index: number) => {
      navigate(item.path);
    },
    [navigate]
  );

  // 处理查询提交
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      performSearch(query);
    },
    [query, performSearch]
  );

  // 清空搜索
  const handleClear = useCallback(() => {
    setQuery('');
    setSearchResults([]);
  }, []);

  return (
    <div className="mx-auto max-w-4xl p-6">
      {/* 页面标题 */}
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold">Search</h1>
        <p className="text-muted-foreground">
          Search through files and folders in your project.
        </p>
      </div>

      {/* 搜索表单 */}
      <div className="mb-6">
        <form onSubmit={handleSubmit} className="relative">
          <FaSearch className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search files and folders..."
            className="w-full rounded-lg border border-input bg-background pl-12 pr-12 py-3 text-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            autoComplete="off"
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-4 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Clear search"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </form>

        {/* 搜索选项 */}
        <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <kbd className="rounded border border-border bg-muted px-2 py-1 text-xs font-mono">
              ⌘ K
            </kbd>
            <span>Quick search</span>
          </div>
        </div>
      </div>

      {/* 搜索结果或空状态 */}
      <div className="rounded-lg border bg-card">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="mb-3 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
              <p className="text-sm text-muted-foreground">Searching...</p>
            </div>
          </div>
        ) : query && searchResults.length > 0 ? (
          <>
            {/* 结果统计 */}
            <div className="border-b px-6 py-3 text-sm text-muted-foreground">
              Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "
              {query}"
            </div>

            {/* 结果列表 */}
            <SearchResults
              results={searchResults}
              selectedIndex={selectedIndex}
              onSelectIndex={setSelectedIndex}
              onResultClick={handleResultClick}
              query={query}
              maxVisible={20}
              className="max-h-[600px]"
            />
          </>
        ) : query ? (
          /* 无结果状态 */
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <FaSearch className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">No results found</h3>
            <p className="mb-4 text-sm text-muted-foreground max-w-md">
              We couldn't find any files matching "{query}". Try different keywords or check your spelling.
            </p>
            <button
              type="button"
              onClick={handleClear}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Clear search
            </button>
          </div>
        ) : (
          /* 初始状态 */
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <FaSearch className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">Start searching</h3>
            <p className="mb-6 text-sm text-muted-foreground max-w-md">
              Type in the search box above or use the keyboard shortcut to quickly find files and folders.
            </p>
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <FaSearch className="h-4 w-4" />
              Open quick search
            </button>
          </div>
        )}
      </div>

      {/* 快速搜索模态框 */}
      <SearchModal
        open={searchOpen}
        onOpenChange={setSearchOpen}
        files={mockFiles}
        activePath={location.pathname}
      />
    </div>
  );
}