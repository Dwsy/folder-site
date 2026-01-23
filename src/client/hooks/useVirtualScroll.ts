import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

interface VirtualScrollOptions {
  /** 可视区域高度 */
  containerHeight: number;
  /** 每个项目的预估高度 */
  estimatedItemHeight: number;
  /** 滚动缓冲区（可视区域外额外渲染的项目数） */
  overscan?: number;
  /** 是否启用虚拟滚动 */
  enabled?: boolean;
  /** 项目总数 */
  itemCount: number;
}

interface VirtualScrollResult {
  /** 虚拟滚动容器 ref */
  containerRef: React.RefObject<HTMLDivElement>;
  /** 可视区域内的项目索引范围 */
  visibleRange: { start: number; end: number };
  /** 滚动偏移量 */
  offsetY: number;
  /** 内部容器高度 */
  innerHeight: number;
  /** 滚动到指定项目 */
  scrollToItem: (index: number) => void;
  /** 滚动到顶部 */
  scrollToTop: () => void;
  /** 滚动到底部 */
  scrollToBottom: () => void;
  /** 项目高度映射 */
  itemHeights: Map<number, number>;
  /** 更新项目高度 */
  updateItemHeight: (index: number, height: number) => void;
}

/**
 * 虚拟滚动 Hook
 *
 * 用于优化长列表的渲染性能，只渲染可视区域内的项目
 *
 * @example
 * ```tsx
 * const { containerRef, visibleRange, offsetY, innerHeight } = useVirtualScroll({
 *   containerHeight: 600,
 *   estimatedItemHeight: 50,
 *   itemCount: 1000,
 * });
 *
 * return (
 *   <div ref={containerRef} style={{ height: containerHeight, overflow: 'auto' }}>
 *     <div style={{ height: innerHeight, transform: `translateY(${offsetY}px)` }}>
 *       {items.slice(visibleRange.start, visibleRange.end).map((item, i) => (
 *         <Item key={visibleRange.start + i} data={item} />
 *       ))}
 *     </div>
 *   </div>
 * );
 * ```
 */
export function useVirtualScroll({
  containerHeight,
  estimatedItemHeight,
  overscan = 3,
  enabled = true,
  itemCount,
}: VirtualScrollOptions): VirtualScrollResult {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<number>();

  // 存储实际的项目高度
  const itemHeightsRef = useRef<Map<number, number>>(new Map());
  const [itemHeights, setItemHeights] = useState<Map<number, number>>(new Map());

  // 计算可视区域内的项目索引范围
  const visibleRange = useMemo(() => {
    if (!enabled) {
      return { start: 0, end: itemCount };
    }

    // 计算所有项目的总高度
    let totalHeight = 0;
    let startIndex = 0;

    // 向上查找起始索引
    for (let i = 0; i < itemCount; i++) {
      const height = itemHeightsRef.current.get(i) ?? estimatedItemHeight;
      totalHeight += height;

      if (totalHeight > scrollTop) {
        startIndex = i;
        break;
      }
    }

    // 计算结束索引
    let endIndex = startIndex;
    let visibleHeight = 0;

    for (let i = startIndex; i < itemCount; i++) {
      const height = itemHeightsRef.current.get(i) ?? estimatedItemHeight;
      visibleHeight += height;

      if (visibleHeight > containerHeight + overscan * estimatedItemHeight) {
        endIndex = i + 1;
        break;
      }
      endIndex = i + 1;
    }

    // 添加缓冲区
    const start = Math.max(0, startIndex - overscan);
    const end = Math.min(itemCount, endIndex + overscan);

    return { start, end };
  }, [enabled, itemCount, containerHeight, estimatedItemHeight, overscan, scrollTop, itemHeights]);

  // 计算滚动偏移量
  const offsetY = useMemo(() => {
    if (!enabled) return 0;

    let offset = 0;
    for (let i = 0; i < visibleRange.start; i++) {
      offset += itemHeightsRef.current.get(i) ?? estimatedItemHeight;
    }

    return offset;
  }, [enabled, visibleRange.start, estimatedItemHeight, itemHeights]);

  // 计算内部容器高度
  const innerHeight = useMemo(() => {
    if (!enabled) return containerHeight;

    let height = 0;
    for (let i = 0; i < itemCount; i++) {
      height += itemHeightsRef.current.get(i) ?? estimatedItemHeight;
    }

    return height;
  }, [enabled, itemCount, estimatedItemHeight]);

  // 处理滚动事件
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (!enabled) return;

    const target = e.target as HTMLDivElement;
    setScrollTop(target.scrollTop);
    setIsScrolling(true);

    // 清除之前的超时
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // 设置新的超时来停止滚动状态
    scrollTimeoutRef.current = window.setTimeout(() => {
      setIsScrolling(false);
    }, 150);
  }, [enabled]);

  // 滚动到指定项目
  const scrollToItem = useCallback((index: number) => {
    if (!containerRef.current) return;

    let offset = 0;
    for (let i = 0; i < index; i++) {
      offset += itemHeightsRef.current.get(i) ?? estimatedItemHeight;
    }

    containerRef.current.scrollTo({
      top: offset,
      behavior: 'smooth',
    });
  }, [estimatedItemHeight]);

  // 滚动到顶部
  const scrollToTop = useCallback(() => {
    if (!containerRef.current) return;

    containerRef.current.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }, []);

  // 滚动到底部
  const scrollToBottom = useCallback(() => {
    if (!containerRef.current) return;

    containerRef.current.scrollTo({
      top: containerRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, []);

  // 更新项目高度
  const updateItemHeight = useCallback((index: number, height: number) => {
    if (!enabled) return;

    itemHeightsRef.current.set(index, height);
    setItemHeights(new Map(itemHeightsRef.current));
  }, [enabled]);

  // 绑定滚动事件
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll as EventListener, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll as EventListener);
    };
  }, [handleScroll]);

  // 清理超时
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return {
    containerRef,
    visibleRange,
    offsetY,
    innerHeight,
    scrollToItem,
    scrollToTop,
    scrollToBottom,
    itemHeights,
    updateItemHeight,
  };
}

/**
 * 简化版的虚拟滚动 Hook（适用于固定高度项目）
 */
export function useVirtualScrollFixed({
  containerHeight,
  itemHeight,
  overscan = 3,
  enabled = true,
  itemCount,
}: {
  containerHeight: number;
  itemHeight: number;
  overscan?: number;
  enabled?: boolean;
  itemCount: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  // 计算可视区域内的项目索引范围
  const visibleRange = useMemo(() => {
    if (!enabled) {
      return { start: 0, end: itemCount };
    }

    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const end = Math.min(
      itemCount,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    return { start, end };
  }, [enabled, itemCount, containerHeight, itemHeight, overscan, scrollTop]);

  // 计算滚动偏移量
  const offsetY = useMemo(() => {
    if (!enabled) return 0;
    return visibleRange.start * itemHeight;
  }, [enabled, visibleRange.start, itemHeight]);

  // 计算内部容器高度
  const innerHeight = useMemo(() => {
    if (!enabled) return containerHeight;
    return itemCount * itemHeight;
  }, [enabled, itemCount, itemHeight, containerHeight]);

  // 处理滚动事件
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (!enabled) return;
    setScrollTop((e.target as HTMLDivElement).scrollTop);
  }, [enabled]);

  // 滚动到指定项目
  const scrollToItem = useCallback((index: number) => {
    if (!containerRef.current) return;

    containerRef.current.scrollTo({
      top: index * itemHeight,
      behavior: 'smooth',
    });
  }, [itemHeight]);

  // 滚动到顶部
  const scrollToTop = useCallback(() => {
    if (!containerRef.current) return;

    containerRef.current.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }, []);

  // 滚动到底部
  const scrollToBottom = useCallback(() => {
    if (!containerRef.current) return;

    containerRef.current.scrollTo({
      top: innerHeight,
      behavior: 'smooth',
    });
  }, [innerHeight]);

  // 绑定滚动事件
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll as EventListener, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll as EventListener);
    };
  }, [handleScroll]);

  return {
    containerRef,
    visibleRange,
    offsetY,
    innerHeight,
    scrollToItem,
    scrollToTop,
    scrollToBottom,
  };
}