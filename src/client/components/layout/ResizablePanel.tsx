import {
  useState,
  useRef,
  useEffect,
  useCallback,
  ReactNode,
  MouseEvent,
  TouchEvent,
} from 'react';
import { cn } from '../../utils/cn';

interface ResizablePanelProps {
  children: ReactNode;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  className?: string;
  onResize?: (width: number) => void;
  collapsed?: boolean;
  collapsedWidth?: number;
}

export function ResizablePanel({
  children,
  defaultWidth = 256,
  minWidth = 200,
  maxWidth = 500,
  className,
  onResize,
  collapsed = false,
  collapsedWidth = 64,
}: ResizablePanelProps) {
  const [width, setWidth] = useState(defaultWidth);
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  // Update width when collapsed state changes
  useEffect(() => {
    if (collapsed) {
      setWidth(collapsedWidth);
    } else {
      setWidth(defaultWidth);
    }
  }, [collapsed, defaultWidth, collapsedWidth]);

  // Handle resize start
  const handleMouseDown = useCallback((e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = width;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [width]);

  const handleTouchStart = useCallback((e: TouchEvent<HTMLDivElement>) => {
    setIsResizing(true);
    startXRef.current = e.touches[0].clientX;
    startWidthRef.current = width;
  }, [width]);

  // Handle resize move
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const diff = e.clientX - startXRef.current;
      const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidthRef.current + diff));
      setWidth(newWidth);
      onResize?.(newWidth);
    };

    const handleTouchMove = (e: TouchEvent) => {
      const diff = e.touches[0].clientX - startXRef.current;
      const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidthRef.current + diff));
      setWidth(newWidth);
      onResize?.(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove as EventListener);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove as EventListener);
    document.addEventListener('touchend', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove as EventListener);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove as EventListener);
      document.removeEventListener('touchend', handleMouseUp);
    };
  }, [isResizing, minWidth, maxWidth, onResize]);

  // Store width in localStorage for persistence
  useEffect(() => {
    if (!collapsed) {
      localStorage.setItem('sidebar-width', width.toString());
    }
  }, [width, collapsed]);

  return (
    <div
      ref={panelRef}
      className={cn('flex shrink-0 overflow-hidden', className)}
      style={{ width: `${width}px` }}
    >
      {children}

      {/* Resize handle */}
      {!collapsed && (
        <div
          className={cn(
            'absolute right-0 top-0 h-full w-1 cursor-col-resize bg-transparent hover:bg-primary/50 active:bg-primary transition-colors',
            isResizing && 'bg-primary'
          )}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          role="separator"
          aria-orientation="vertical"
          aria-valuenow={width}
          aria-valuemin={minWidth}
          aria-valuemax={maxWidth}
          aria-label="Resize sidebar"
        />
      )}
    </div>
  );
}