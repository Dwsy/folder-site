import { useRef, useCallback, useEffect } from 'react';

interface UseSwipeGestureOptions {
  /** 滑动阈值（像素），超过此值触发滑动 */
  threshold?: number;
  /** 是否启用边缘滑动打开侧边栏 */
  enableEdgeSwipe?: boolean;
  /** 边缘滑动区域宽度（像素） */
  edgeWidth?: number;
  /** 侧边栏是否打开 */
  isOpen?: boolean;
  /** 侧边栏打开回调 */
  onOpen?: () => void;
  /** 侧边栏关闭回调 */
  onClose?: () => void;
}

interface SwipeGestureState {
  isSwiping: boolean;
  startX: number;
  startY: number;
  currentX: number;
  direction: 'left' | 'right' | null;
}

/**
 * 触摸手势 Hook
 * 支持边缘滑动打开侧边栏和侧边栏内滑动关闭
 */
export function useSwipeGesture({
  threshold = 50,
  enableEdgeSwipe = true,
  edgeWidth = 30,
  isOpen = false,
  onOpen,
  onClose,
}: UseSwipeGestureOptions = {}) {
  const stateRef = useRef<SwipeGestureState>({
    isSwiping: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    direction: null,
  });

  // 处理触摸开始
  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    const { clientX, clientY } = touch;

    // 记录起始位置
    stateRef.current = {
      isSwiping: true,
      startX: clientX,
      startY: clientY,
      currentX: clientX,
      direction: null,
    };
  }, []);

  // 处理触摸移动
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!stateRef.current.isSwiping) return;

    const touch = e.touches[0];
    const { clientX, clientY } = touch;
    const deltaX = clientX - stateRef.current.startX;
    const deltaY = clientY - stateRef.current.startY;

    // 判断滑动方向（水平滑动优先）
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      stateRef.current.direction = deltaX > 0 ? 'right' : 'left';
    }

    stateRef.current.currentX = clientX;

    // 如果侧边栏已打开，可以拖动侧边栏
    if (isOpen && deltaX < 0) {
      // 向左滑动关闭侧边栏
      const progress = Math.min(Math.abs(deltaX) / window.innerWidth, 1);
      const sidebar = document.querySelector('[data-sidebar]');
      if (sidebar) {
        sidebar.style.transform = `translateX(-${progress * 100}%)`;
      }
    }

    // 如果侧边栏未关闭且启用边缘滑动
    if (!isOpen && enableEdgeSwipe && deltaX > 0) {
      // 从左边缘向右滑动打开侧边栏
      const progress = Math.min(deltaX / window.innerWidth, 1);
      const sidebar = document.querySelector('[data-sidebar]');
      if (sidebar) {
        sidebar.style.transform = `translateX(-${(1 - progress) * 100}%)`;
      }
    }
  }, [isOpen, enableEdgeSwipe]);

  // 处理触摸结束
  const handleTouchEnd = useCallback(() => {
    if (!stateRef.current.isSwiping) return;

    const { startX, currentX, direction } = stateRef.current;
    const deltaX = currentX - startX;
    const isHorizontalSwipe = direction === 'left' || direction === 'right';

    // 判断是否触发滑动
    if (isHorizontalSwipe && Math.abs(deltaX) >= threshold) {
      // 侧边栏已打开，向左滑动关闭
      if (isOpen && direction === 'left') {
        onClose?.();
      }
      // 侧边栏未打开，从左边缘向右滑动打开
      else if (!isOpen && direction === 'right' && startX < edgeWidth && enableEdgeSwipe) {
        onOpen?.();
      }
    }

    // 重置状态
    stateRef.current = {
      isSwiping: false,
      startX: 0,
      startY: 0,
      currentX: 0,
      direction: null,
    };

    // 恢复侧边栏样式
    const sidebar = document.querySelector('[data-sidebar]');
    if (sidebar) {
      sidebar.style.transform = '';
    }
  }, [isOpen, threshold, edgeWidth, enableEdgeSwipe, onOpen, onClose]);

  // 注册触摸事件监听器
  useEffect(() => {
    const target = document.body;

    target.addEventListener('touchstart', handleTouchStart, { passive: true });
    target.addEventListener('touchmove', handleTouchMove, { passive: true });
    target.addEventListener('touchend', handleTouchEnd, { passive: true });
    target.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      target.removeEventListener('touchstart', handleTouchStart);
      target.removeEventListener('touchmove', handleTouchMove);
      target.removeEventListener('touchend', handleTouchEnd);
      target.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    isSwiping: stateRef.current.isSwiping,
    direction: stateRef.current.direction,
  };
}