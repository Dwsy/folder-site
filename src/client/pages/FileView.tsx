import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ContentDisplay } from '../components/editor/ContentDisplay.js';
import { MarkdownPreview } from '../components/editor/MarkdownPreview.js';
import { cn } from '../utils/cn.js';
import { FiFileText, FiRefreshCw, FiCode, FiEye } from 'react-icons/fi';
import { useTheme } from '../hooks/useTheme.js';

interface FileViewProps {
  className?: string;
}

export function FileView({ className }: FileViewProps) {
  const params = useParams();
  const filePath = params['*'] || '';

  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [language, setLanguage] = useState<string>('text');
  const [viewMode, setViewMode] = useState<'code' | 'preview'>('code');
  const { theme } = useTheme();

  // Reset scroll position when file path changes
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [filePath]);

  // Detect language from file extension and set default view mode
  useEffect(() => {
    if (!filePath) return;

    const extension = filePath.split('.').pop()?.toLowerCase() || '';
    const languageMap: Record<string, string> = {
      ts: 'typescript',
      tsx: 'typescript',
      js: 'javascript',
      jsx: 'javascript',
      py: 'python',
      rs: 'rust',
      go: 'go',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      cs: 'csharp',
      php: 'php',
      rb: 'ruby',
      swift: 'swift',
      kt: 'kotlin',
      scala: 'scala',
      sh: 'bash',
      bash: 'bash',
      zsh: 'bash',
      fish: 'bash',
      ps1: 'powershell',
      json: 'json',
      yaml: 'yaml',
      yml: 'yaml',
      xml: 'xml',
      html: 'html',
      htm: 'html',
      css: 'css',
      scss: 'scss',
      sass: 'sass',
      less: 'less',
      md: 'markdown',
      markdown: 'markdown',
      txt: 'text',
      sql: 'sql',
      graphql: 'graphql',
      dockerfile: 'dockerfile',
      makefile: 'makefile',
    };

    setLanguage(languageMap[extension] || 'text');

    // Set default view mode for markdown files
    if (extension === 'md' || extension === 'markdown') {
      setViewMode('preview');
    } else {
      setViewMode('code');
    }
  }, [filePath]);

  // Fetch file content
  useEffect(() => {
    if (!filePath) {
      setLoading(false);
      return;
    }

    const fetchFileContent = async () => {
      setLoading(true);
      setError(null);

      console.log('FileView - Fetching file:', filePath);
      console.log('FileView - API URL:', `/api/files/content?path=${encodeURIComponent(filePath)}`);

      try {
        const response = await fetch(`/api/files/content?path=${encodeURIComponent(filePath)}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch file: ${response.statusText}`);
        }

        const result = await response.json();
        
        if (result.success && result.data) {
          setContent(result.data.content || '');
        } else {
          throw new Error(result.error || 'Failed to parse file content');
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load file'));
        console.error('Error fetching file content:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFileContent();
  }, [filePath]);

  // Handle retry
  const handleRetry = () => {
    setError(null);
    setLoading(true);
    // The useEffect will re-trigger when error changes
  };

  // Get filename from path
  const filename = filePath.split('/').pop() || 'Unknown';

  return (
    <div className={cn('mx-auto max-w-7xl p-6', className)}>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-3">
          <FiFileText className="h-6 w-6 text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-bold">{filename}</h1>
            <p className="text-sm text-muted-foreground">{filePath}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* View mode toggle for markdown files */}
          {language === 'markdown' && (
            <div className="flex items-center gap-1 rounded-md bg-muted p-1">
              <button
                onClick={() => setViewMode('code')}
                className={cn(
                  'flex items-center gap-1.5 rounded px-3 py-1.5 text-sm transition-colors',
                  viewMode === 'code'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                title="Code view"
              >
                <FiCode className="h-4 w-4" />
                <span>Code</span>
              </button>
              <button
                onClick={() => setViewMode('preview')}
                className={cn(
                  'flex items-center gap-1.5 rounded px-3 py-1.5 text-sm transition-colors',
                  viewMode === 'preview'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                title="Preview view"
              >
                <FiEye className="h-4 w-4" />
                <span>Preview</span>
              </button>
            </div>
          )}
          {error && (
            <button
              onClick={handleRetry}
              className="flex items-center gap-2 rounded-md bg-secondary px-3 py-1.5 text-sm font-medium transition-colors hover:bg-secondary/80"
              aria-label="Retry loading file"
            >
              <FiRefreshCw className="h-4 w-4" />
              Retry
            </button>
          )}
        </div>
      </div>

      {/* Content Display */}
      {language === 'markdown' && viewMode === 'preview' ? (
        <MarkdownPreview
          content={content}
          theme={theme}
          showCopyButton={true}
          showFrontmatter={true}
          showTOC={true}
          enableMath={true}
          enableGfm={true}
          className="rounded-lg border bg-card p-6"
          onError={setError}
          onRetry={handleRetry}
        />
      ) : (
        <ContentDisplay
          content={content}
          language={language}
          filename={filename}
          loading={loading}
          error={error}
          displayMode={viewMode}
          onRetry={handleRetry}
          showLineNumbers={true}
          wrapLines={false}
          className="rounded-lg border"
        />
      )}

      {/* Footer Info */}
      {!loading && !error && content && (
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>Language: <span className="font-medium">{language}</span></span>
            <span>Lines: <span className="font-medium">{content.split('\n').length}</span></span>
            <span>Size: <span className="font-medium">{new Blob([content]).size} bytes</span></span>
          </div>
          <span className="text-xs">Read-only view</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && !content && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FiFileText className="mb-4 h-16 w-16 text-muted-foreground/50" />
          <h2 className="mb-2 text-xl font-semibold">No Content</h2>
          <p className="text-muted-foreground">
            This file appears to be empty or could not be loaded.
          </p>
        </div>
      )}
    </div>
  );
}
