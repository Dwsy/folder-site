/**
 * Table of Contents (TOC) Component
 *
 * Displays a hierarchical table of contents for markdown documents
 * with scroll tracking and smooth scrolling
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { cn } from '../../utils/cn.js';
import { FiList, FiChevronRight, FiChevronDown } from 'react-icons/fi';
import type { ThemeMode } from '../../../types/theme.js';

export interface TOCItem {
  id: string;
  text: string;
  level: number;
  children?: TOCItem[];
}

export interface TOCProps {
  /** Table of contents items */
  items: TOCItem[];
  /** Current theme mode */
  theme?: ThemeMode;
  /** Current active section */
  activeId?: string | null;
  /** Maximum heading level to include (1-6) */
  maxLevel?: number;
  /** Show/hide TOC */
  show?: boolean;
  /** On section click callback */
  onSectionClick?: (id: string) => void;
  /** Custom className */
  className?: string;
}

/**
 * TOC Item Component (recursive)
 */
function TOCItemComponent({
  item,
  activeId,
  onSectionClick,
  depth = 0,
}: {
  item: TOCItem;
  activeId?: string | null;
  onSectionClick?: (id: string) => void;
  depth?: number;
}) {
  const [expanded, setExpanded] = useState(depth < 1);
  const hasChildren = item.children && item.children.length > 0;
  const isActive = activeId === item.id;

  const handleClick = () => {
    if (onSectionClick) {
      onSectionClick(item.id);
    }
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  return (
    <div className="toc-item">
      <div
        className={cn(
          'flex items-center gap-2 py-1.5 pr-2 text-sm transition-colors cursor-pointer rounded-md',
          'hover:bg-accent',
          isActive && 'bg-primary/10 text-primary font-medium',
          !isActive && 'text-muted-foreground hover:text-foreground'
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={handleClick}
      >
        {hasChildren && (
          <button
            onClick={handleToggle}
            className="shrink-0 w-4 h-4 flex items-center justify-center transition-transform hover:text-foreground"
            style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
            aria-expanded={expanded}
          >
            <FiChevronRight className="h-3 w-3" />
          </button>
        )}
        <span className="flex-1 truncate">{item.text}</span>
      </div>

      {hasChildren && expanded && (
        <div className="toc-children">
          {item.children!.map((child) => (
            <TOCItemComponent
              key={child.id}
              item={child}
              activeId={activeId}
              onSectionClick={onSectionClick}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Table of Contents Component
 */
export function TOC({
  items,
  activeId,
  maxLevel = 3,
  show = true,
  onSectionClick,
  className,
}: TOCProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Filter items by max level
  const filteredItems = useMemo(() => {
    const filterByLevel = (item: TOCItem): TOCItem | null => {
      if (item.level > maxLevel) return null;

      const filtered: TOCItem = {
        id: item.id,
        text: item.text,
        level: item.level,
      };

      if (item.children) {
        filtered.children = item.children
          .map(filterByLevel)
          .filter((child): child is TOCItem => child !== null);
      }

      return filtered;
    };

    return items
      .map(filterByLevel)
      .filter((item): item is TOCItem => item !== null);
  }, [items, maxLevel]);

  // Ensure unique keys in filtered items
  const uniqueItems = useMemo(() => {
    const seenIds = new Map<string, number>(); // 使用 Map 跟踪原始 ID 的出现次数

    const ensureUnique = (item: TOCItem): TOCItem => {
      const originalId = item.id;
      const count = (seenIds.get(originalId) || 0);
      
      let uniqueId = originalId;
      if (count > 0) {
        uniqueId = `${originalId}-${count + 1}`;
      }
      
      seenIds.set(originalId, count + 1);
      
      console.log('[TOC] ensureUnique:', 'original:', originalId, 'count:', count, 'unique:', uniqueId);
      
      const uniqueItem: TOCItem = {
        ...item,
        id: uniqueId,
      };

      if (item.children) {
        uniqueItem.children = item.children.map(ensureUnique);
      }

      return uniqueItem;
    };

    return filteredItems.map(ensureUnique);
  }, [filteredItems]);

  // Handle section click
  const handleSectionClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (onSectionClick) {
        onSectionClick(id);
      }
    }
    setIsMobileOpen(false);
  };

  if (!show || filteredItems.length === 0) {
    return null;
  }

  return (
    <>
      {/* Desktop: Fixed right sidebar */}
      <aside
        className={cn(
          'hidden lg:block fixed right-0 top-14 bottom-0 w-64 bg-card border-l p-4 overflow-y-auto z-10',
          className
        )}
        aria-label="Table of contents"
      >
        <div className="flex items-center gap-2 mb-4 pb-3 border-b">
          <FiList className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">目录</h2>
        </div>

        <nav className="space-y-0.5">
          {uniqueItems.map((item) => (
            <TOCItemComponent
              key={item.id}
              item={item}
              activeId={activeId}
              onSectionClick={handleSectionClick}
            />
          ))}
        </nav>
      </aside>

      {/* Mobile: Floating button */}
      <div className="lg:hidden fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className={cn(
            'flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg',
            'transition-transform hover:scale-110 active:scale-95'
          )}
          aria-label="Toggle table of contents"
          aria-expanded={isMobileOpen}
        >
          <FiList className="h-5 w-5" />
        </button>

        {/* Mobile TOC panel */}
        {isMobileOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setIsMobileOpen(false)}
              aria-hidden="true"
            />

            {/* TOC Panel */}
            <div className="fixed bottom-20 right-6 w-72 max-h-[60vh] bg-card border rounded-lg shadow-xl p-4 z-50 overflow-y-auto">
              <div className="flex items-center justify-between mb-3 pb-3 border-b">
                <div className="flex items-center gap-2">
                  <FiList className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-sm font-semibold">目录</h2>
                </div>
                <button
                  onClick={() => setIsMobileOpen(false)}
                  className="p-1 rounded hover:bg-accent"
                  aria-label="Close"
                >
                  <FiChevronDown className="h-4 w-4" />
                </button>
              </div>

              <nav className="space-y-0.5">
                {uniqueItems.map((item) => (
                  <TOCItemComponent
                    key={item.id}
                    item={item}
                    activeId={activeId}
                    onSectionClick={handleSectionClick}
                  />
                ))}
              </nav>
            </div>
          </>
        )}
      </div>
    </>
  );
}

/**
 * Generate a unique ID from heading text
 */
function generateHeadingId(text: string, index: number, idMap: Map<string, number>): string {
  // Generate ID from text - preserve Chinese characters
  let id = text
    .toLowerCase()
    .replace(/<[^>]*>/g, '') // Remove any HTML tags
    .replace(/[^a-z0-9\u4e00-\u9fa5\s-]/g, '') // Keep Chinese characters
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, ''); // Trim leading/trailing hyphens

  // If ID is empty or invalid, use index
  if (!id || id === '') {
    id = `heading-${index}`;
  }

  // Handle duplicate IDs
  const count = idMap.get(id) || 0;
  if (count > 0) {
    id = `${id}-${count}`;
  }
  idMap.set(id, count + 1);

  return id;
}

/**
 * Extract headings from HTML content
 */
export function extractHeadings(html: string): TOCItem[] {
  const headingRegex = /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi;
  const items: TOCItem[] = [];
  const stack: { level: number; item: TOCItem; parent: TOCItem | null | undefined }[] = [];
  const idMap = new Map<string, number>();
  let matchIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = headingRegex.exec(html)) !== null) {
    matchIndex++;
    const level = parseInt(match[1], 10);
    const text = match[2]?.replace(/<[^>]*>/g, '').trim() || ''; // Remove inner HTML tags
    const id = generateHeadingId(text, matchIndex, idMap);

    const item: TOCItem = { id, text, level, children: [] };

    // Find parent (pop until we find a smaller level)
    while (stack.length > 0 && stack[stack.length - 1]!.level >= level) {
      stack.pop();
    }

    const parent = stack.length > 0 ? stack[stack.length - 1]?.item : null;
    if (parent) {
      parent.children = parent.children || [];
      parent.children.push(item);
    } else {
      items.push(item);
    }

    stack.push({ level, item, parent });
  }

  return items;
}

/**
 * Add IDs to headings in HTML and return the mapping
 */
export function addHeadingIdsWithItems(html: string, items: TOCItem[]): { html: string; itemsWithIds: TOCItem[] } {
  // Flatten items for easier indexing
  const flattenedItems: TOCItem[] = [];
  const flatten = (item: TOCItem) => {
    flattenedItems.push({ ...item, children: undefined });
    if (item.children) {
      item.children.forEach(flatten);
    }
  };
  items.forEach(flatten);

  let index = 0;
  const htmlWithIds = html.replace(/<h([1-6])([^>]*)>([\s\S]*?)<\/h\1>/gi, (match, level, attrs, text) => {
    const item = flattenedItems[index];
    index++;

    if (item) {
      const hasId = attrs.includes('id=');
      if (!hasId) {
        return `<h${level} id="${item.id}"${attrs}>${text}</h${level}>`;
      }
    }
    return match;
  });

  return { html: htmlWithIds, itemsWithIds: flattenedItems };
}

/**
 * Hook to track active heading with IntersectionObserver
 */
export function useActiveHeading(items: TOCItem[], containerSelector = 'main') {
  const [activeId, setActiveId] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const container = document.querySelector(containerSelector);
    if (!container || items.length === 0) return;

    // Find all heading elements in the container
    const findHeadingElements = (): HTMLElement[] => {
      const headings: HTMLElement[] = [];
      items.forEach((item) => {
        const el = document.getElementById(item.id);
        if (el) headings.push(el);
      });
      return headings;
    };

    // Initial check - find the first visible heading
    const initialCheck = () => {
      const headings = findHeadingElements();
      if (headings.length === 0) return;

      // Find the heading closest to the top of viewport
      let closestHeading = headings[0];
      let closestTop = Infinity;

      for (const heading of headings) {
        const rect = heading.getBoundingClientRect();
        if (rect.top < closestTop) {
          closestTop = rect.top;
          closestHeading = heading;
        }
      }

      // If closest heading is below offset, set it as active
      if (closestHeading) {
        setActiveId(closestHeading.id);
      }
    };

    // Setup IntersectionObserver
    const headings = findHeadingElements();
    if (headings.length > 0) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          // Filter to entries in viewport
          const inViewport = entries.filter(
            (e) => e.isIntersecting || e.boundingClientRect.top <= 200
          );
          if (inViewport.length > 0) {
            // Find the one with smallest top value (closest to top)
            const top = Math.min(...inViewport.map((e) => e.boundingClientRect.top));
            const active = inViewport.find((e) => e.boundingClientRect.top === top);
            if (active) {
              setActiveId(active.target.id);
            }
          }
        },
        {
          root: container,
          rootMargin: '-80px 0px -70% 0px', // Top 80px offset, show heading in top 30%
          threshold: 0,
        }
      );

      headings.forEach((heading) => observerRef.current!.observe(heading));
      initialCheck();
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [items, containerSelector]);

  return activeId;
}

export default TOC;