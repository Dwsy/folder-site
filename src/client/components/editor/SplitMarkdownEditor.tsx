/**
 * Split Markdown Editor Component
 *
 * Side-by-side markdown editor with live preview:
 * - Left panel: Code editor with syntax highlighting
 * - Right panel: Live markdown preview
 * - Resizable divider between panels
 * - Synchronized scrolling
 * - Theme support
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { CodeBlock } from './CodeBlock.js';
import { MarkdownPreview } from './MarkdownPreview.js';
import { cn } from '../../utils/cn.js';
import { FiSettings, FiMonitor, FiColumns, FiRefreshCw } from 'react-icons/fi';
import type { ThemeMode } from '../../../types/theme.js';

export interface SplitMarkdownEditorProps {
  /** Initial markdown content */
  content?: string;
  /** Theme mode */
  theme?: ThemeMode;
  /** Initial split position (percentage, 0-100) */
  defaultSplitPosition?: number;
  /** Minimum panel width (percentage) */
  minPanelWidth?: number;
  /** Enable synchronized scrolling */
  enableSyncScroll?: boolean;
  /** Show toolbar */
  showToolbar?: boolean;
  /** On content change callback */
  onChange?: (content: string) => void;
  /** On save callback */
  onSave?: (content: string) => void;
  /** Custom CSS class names */
  className?: string;
  /** Editor height */
  height?: string | number;
}

export interface SplitMarkdownEditorState {
  content: string;
  splitPosition: number;
  isResizing: boolean;
  activePanel: 'editor' | 'preview' | 'both';
  isDirty: boolean;
}

/**
 * Split Markdown Editor Component
 */
export function SplitMarkdownEditor({
  content = '',
  theme = 'auto',
  defaultSplitPosition = 50,
  minPanelWidth = 20,
  enableSyncScroll = true,
  showToolbar = true,
  onChange,
  onSave,
  className,
  height = '100%',
}: SplitMarkdownEditorProps) {
  const [state, setState] = useState<SplitMarkdownEditorState>({
    content,
    splitPosition: defaultSplitPosition,
    isResizing: false,
    activePanel: 'both',
    isDirty: false,
  });

  const editorRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const startSplitPositionRef = useRef(0);
  const startXRef = useRef(0);

  // Update content when prop changes
  useEffect(() => {
    setState(prev => ({ ...prev, content }));
  }, [content]);

  // Handle resize start
  const handleResizeStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setState(prev => ({ ...prev, isResizing: true }));
    startSplitPositionRef.current = state.splitPosition;
    startXRef.current = clientX;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [state.splitPosition]);

  // Handle resize move
  useEffect(() => {
    if (!state.isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const containerWidth = containerRef.current.offsetWidth;
      const diff = e.clientX - startXRef.current;
      const newPosition = startSplitPositionRef.current + (diff / containerWidth) * 100;

      // Clamp between minPanelWidth and (100 - minPanelWidth)
      const clampedPosition = Math.max(
        minPanelWidth,
        Math.min(100 - minPanelWidth, newPosition)
      );

      setState(prev => ({ ...prev, splitPosition: clampedPosition }));
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!containerRef.current) return;

      const containerWidth = containerRef.current.offsetWidth;
      const diff = e.touches[0].clientX - startXRef.current;
      const newPosition = startSplitPositionRef.current + (diff / containerWidth) * 100;

      const clampedPosition = Math.max(
        minPanelWidth,
        Math.min(100 - minPanelWidth, newPosition)
      );

      setState(prev => ({ ...prev, splitPosition: clampedPosition }));
    };

    const handleMouseUp = () => {
      setState(prev => ({ ...prev, isResizing: false }));
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleMouseUp);
    };
  }, [state.isResizing, minPanelWidth]);

  // Synchronized scrolling
  useEffect(() => {
    if (!enableSyncScroll) return;

    const editor = editorRef.current;
    const preview = previewRef.current;

    if (!editor || !preview) return;

    const editorScrollElement = editor.querySelector('[class*="overflow-auto"]');
    const previewScrollElement = preview.querySelector('[class*="overflow-auto"]');

    if (!editorScrollElement || !previewScrollElement) return;

    let isScrolling = false;

    const handleEditorScroll = () => {
      if (isScrolling) return;
      isScrolling = true;

      const scrollRatio =
        editorScrollElement.scrollTop /
        (editorScrollElement.scrollHeight - editorScrollElement.clientHeight);

      previewScrollElement.scrollTop =
        scrollRatio * (previewScrollElement.scrollHeight - previewScrollElement.clientHeight);

      setTimeout(() => {
        isScrolling = false;
      }, 50);
    };

    const handlePreviewScroll = () => {
      if (isScrolling) return;
      isScrolling = true;

      const scrollRatio =
        previewScrollElement.scrollTop /
        (previewScrollElement.scrollHeight - previewScrollElement.clientHeight);

      editorScrollElement.scrollTop =
        scrollRatio * (editorScrollElement.scrollHeight - editorScrollElement.clientHeight);

      setTimeout(() => {
        isScrolling = false;
      }, 50);
    };

    editorScrollElement.addEventListener('scroll', handleEditorScroll);
    previewScrollElement.addEventListener('scroll', handlePreviewScroll);

    return () => {
      editorScrollElement.removeEventListener('scroll', handleEditorScroll);
      previewScrollElement.removeEventListener('scroll', handlePreviewScroll);
    };
  }, [enableSyncScroll, state.content]);

  // Handle content change (simulated - CodeBlock doesn't support editing)
  const handleContentChange = (newContent: string) => {
    setState(prev => ({ ...prev, content: newContent, isDirty: true }));
    onChange?.(newContent);
  };

  // Handle save
  const handleSave = () => {
    onSave?.(state.content);
    setState(prev => ({ ...prev, isDirty: false }));
  };

  // Toggle panel visibility
  const togglePanel = (panel: 'editor' | 'preview') => {
    setState(prev => {
      if (prev.activePanel === 'both') {
        return { ...prev, activePanel: panel === 'editor' ? 'preview' : 'editor' };
      } else if (prev.activePanel === panel) {
        return { ...prev, activePanel: 'both' };
      } else {
        return { ...prev, activePanel: 'both' };
      }
    });
  };

  // Reset split position
  const resetSplitPosition = () => {
    setState(prev => ({ ...prev, splitPosition: defaultSplitPosition }));
  };

  // Calculate panel widths
  const editorWidth = state.activePanel === 'preview' ? 0 :
    state.activePanel === 'editor' ? 100 : state.splitPosition;
  const previewWidth = state.activePanel === 'editor' ? 0 :
    state.activePanel === 'preview' ? 100 : 100 - state.splitPosition;

  return (
    <div
      ref={containerRef}
      className={cn('flex h-full flex-col overflow-hidden bg-background', className)}
      style={{ height: typeof height === 'number' ? `${height}px` : height }}
    >
      {/* Toolbar */}
      {showToolbar && (
        <div className="flex items-center justify-between border-b px-4 py-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Markdown Editor</span>
            {state.isDirty && (
              <span className="text-xs text-muted-foreground">(unsaved)</span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* View mode buttons */}
            <div className="flex items-center gap-1 rounded-md bg-muted p-1">
              <button
                onClick={() => togglePanel('editor')}
                className={cn(
                  'flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors',
                  state.activePanel === 'preview'
                    ? 'text-muted-foreground hover:text-foreground'
                    : 'bg-background text-foreground shadow-sm'
                )}
                title="Toggle editor"
              >
                <FiColumns className="h-3.5 w-3.5" />
                <span>Editor</span>
              </button>
              <button
                onClick={() => togglePanel('preview')}
                className={cn(
                  'flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors',
                  state.activePanel === 'editor'
                    ? 'text-muted-foreground hover:text-foreground'
                    : 'bg-background text-foreground shadow-sm'
                )}
                title="Toggle preview"
              >
                <FiMonitor className="h-3.5 w-3.5" />
                <span>Preview</span>
              </button>
            </div>

            {/* Reset split button */}
            {state.activePanel === 'both' && (
              <button
                onClick={resetSplitPosition}
                className="flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors hover:bg-accent"
                title="Reset split position"
              >
                <FiRefreshCw className="h-3.5 w-3.5" />
              </button>
            )}

            {/* Sync scroll indicator */}
            {enableSyncScroll && (
              <div className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span>Sync Scroll</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor panel */}
        {editorWidth > 0 && (
          <div
            ref={editorRef}
            className="flex flex-col overflow-hidden border-r"
            style={{ width: `${editorWidth}%` }}
          >
            <div className="flex items-center justify-between border-b px-3 py-1.5 bg-muted/50">
              <span className="text-xs font-medium text-muted-foreground">
                Editor
              </span>
              <span className="text-xs text-muted-foreground">
                {state.content.split('\n').length} lines
              </span>
            </div>
            <div className="flex-1 overflow-auto">
              <CodeBlock
                code={state.content}
                language="markdown"
                showLineNumbers={true}
                showCopyButton={false}
                wrapLines={false}
                theme={theme === 'dark' ? 'github-dark' : 'github'}
                className="border-0 rounded-none h-full"
              />
            </div>
          </div>
        )}

        {/* Resize handle */}
        {state.activePanel === 'both' && (
          <div
            ref={resizeHandleRef}
            className={cn(
              'relative flex-shrink-0 w-1 bg-transparent hover:bg-primary/50 active:bg-primary cursor-col-resize transition-colors',
              state.isResizing && 'bg-primary'
            )}
            onMouseDown={handleResizeStart}
            onTouchStart={handleResizeStart}
            role="separator"
            aria-orientation="horizontal"
            aria-valuenow={state.splitPosition}
            aria-valuemin={minPanelWidth}
            aria-valuemax={100 - minPanelWidth}
            aria-label="Resize panels"
          >
            {/* Visual indicator */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={cn(
                'w-0.5 h-8 rounded-full bg-muted-foreground/30 transition-colors',
                'hover:bg-primary/50',
                state.isResizing && 'bg-primary'
              )} />
            </div>
          </div>
        )}

        {/* Preview panel */}
        {previewWidth > 0 && (
          <div
            ref={previewRef}
            className="flex flex-col overflow-hidden"
            style={{ width: `${previewWidth}%` }}
          >
            <div className="flex items-center justify-between border-b px-3 py-1.5 bg-muted/50">
              <span className="text-xs font-medium text-muted-foreground">
                Preview
              </span>
              <span className="text-xs text-muted-foreground">
                {state.content.length} chars
              </span>
            </div>
            <div className="flex-1 overflow-auto">
              <MarkdownPreview
                content={state.content}
                theme={theme}
                showCopyButton={false}
                showFrontmatter={false}
                showTOC={true}
                enableMath={true}
                enableGfm={true}
                className="border-0 rounded-none h-full"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Lightweight split editor without toolbar
 */
export interface SimpleSplitEditorProps {
  content: string;
  theme?: ThemeMode;
  splitPosition?: number;
  className?: string;
}

export function SimpleSplitEditor({
  content,
  theme = 'auto',
  splitPosition = 50,
  className,
}: SimpleSplitEditorProps) {
  return (
    <SplitMarkdownEditor
      content={content}
      theme={theme}
      defaultSplitPosition={splitPosition}
      showToolbar={false}
      enableSyncScroll={true}
      className={className}
    />
  );
}

export default SplitMarkdownEditor;