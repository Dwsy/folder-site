/**
 * TabBar 组件 - 标签页栏
 * 
 * 功能：
 * - 渲染所有标签页
 * - 横向滚动
 * - 右键菜单（关闭、固定、批量操作）
 * - 拖拽排序支持
 * - 响应式设计
 */

import { memo, useCallback, useState, useRef, MouseEvent, useEffect } from 'react';
import { useTabs } from '../../contexts/TabsContext.js';
import { Tab } from './Tab.js';
import { cn } from '../../utils/cn.js';
import {
  RiCloseLine,
  RiPushpinLine,
  RiPushpinFill,
  RiArrowLeftSLine,
  RiArrowRightSLine,
} from 'react-icons/ri';

/**
 * 右键菜单项
 */
interface ContextMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  separator?: boolean;
}

/**
 * TabBar 组件属性
 */
export interface TabBarProps {
  /** 自定义类名 */
  className?: string;
  /** 是否显示滚动按钮 */
  showScrollButtons?: boolean;
}

/**
 * TabBar 组件
 */
export const TabBar = memo(function TabBar({
  className,
  showScrollButtons = true,
}: TabBarProps) {
  const {
    tabs,
    activeTabId,
    switchTab,
    closeTab,
    closeAllTabs,
    closeOtherTabs,
    closeRightTabs,
    closeLeftTabs,
    pinTab,
    unpinTab,
    moveTab,
  } = useTabs();

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    tabId: string;
  } | null>(null);

  // 拖拽状态
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // 检查是否需要显示滚动按钮
  const checkScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setShowLeftScroll(scrollLeft > 0);
    setShowRightScroll(scrollLeft + clientWidth < scrollWidth - 1);
  }, []);

  // 监听滚动和窗口大小变化
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    checkScroll();

    container.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);

    return () => {
      container.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll, tabs.length]);

  // 滚动到指定位置
  const scrollTo = useCallback((direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = 200;
    const newScrollLeft = direction === 'left'
      ? container.scrollLeft - scrollAmount
      : container.scrollLeft + scrollAmount;

    container.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth',
    });
  }, []);

  // 处理标签页点击
  const handleTabClick = useCallback((tabId: string) => {
    switchTab(tabId);
  }, [switchTab]);

  // 处理标签页关闭
  const handleTabClose = useCallback((tabId: string) => (e: MouseEvent) => {
    e.stopPropagation();
    closeTab(tabId);
  }, [closeTab]);

  // 处理固定/取消固定
  const handleTogglePin = useCallback((tabId: string) => (e: MouseEvent) => {
    e.stopPropagation();
    const tab = tabs.find(t => t.id === tabId);
    if (tab?.isPinned) {
      unpinTab(tabId);
    } else {
      pinTab(tabId);
    }
  }, [tabs, pinTab, unpinTab]);

  // 处理右键菜单
  const handleContextMenu = useCallback((tabId: string) => (e: MouseEvent) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      tabId,
    });
  }, []);

  // 关闭右键菜单
  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  // 点击页面其他地方关闭菜单
  useEffect(() => {
    if (contextMenu) {
      document.addEventListener('click', closeContextMenu);
      return () => document.removeEventListener('click', closeContextMenu);
    }
  }, [contextMenu, closeContextMenu]);

  // 拖拽开始
  const handleDragStart = useCallback((index: number) => (e: React.DragEvent) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  // 拖拽经过
  const handleDragOver = useCallback((index: number) => (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverIndex(index);
  }, []);

  // 拖拽结束
  const handleDrop = useCallback((index: number) => (e: React.DragEvent) => {
    e.preventDefault();
    
    if (draggedIndex !== null && draggedIndex !== index) {
      moveTab(draggedIndex, index);
    }
    
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, [draggedIndex, moveTab]);

  // 拖拽离开
  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, []);

  // 生成右键菜单项
  const getContextMenuItems = useCallback((tabId: string): ContextMenuItem[] => {
    const tab = tabs.find(t => t.id === tabId);
    if (!tab) return [];

    const tabIndex = tabs.findIndex(t => t.id === tabId);

    return [
      {
        label: tab.isPinned ? '取消固定' : '固定标签页',
        icon: tab.isPinned ? <RiPushpinFill /> : <RiPushpinLine />,
        onClick: () => {
          if (tab.isPinned) {
            unpinTab(tabId);
          } else {
            pinTab(tabId);
          }
          closeContextMenu();
        },
      },
      {
        label: '关闭',
        icon: <RiCloseLine />,
        onClick: () => {
          closeTab(tabId);
          closeContextMenu();
        },
        disabled: tab.isPinned,
      },
      {
        label: '关闭其他标签页',
        onClick: () => {
          closeOtherTabs(tabId);
          closeContextMenu();
        },
        disabled: tabs.length === 1,
        separator: true,
      },
      {
        label: '关闭右侧标签页',
        onClick: () => {
          closeRightTabs(tabId);
          closeContextMenu();
        },
        disabled: tabIndex === tabs.length - 1,
      },
      {
        label: '关闭左侧标签页',
        onClick: () => {
          closeLeftTabs(tabId);
          closeContextMenu();
        },
        disabled: tabIndex === 0,
      },
      {
        label: '关闭所有标签页',
        onClick: () => {
          closeAllTabs();
          closeContextMenu();
        },
        separator: true,
      },
    ];
  }, [tabs, closeTab, closeOtherTabs, closeRightTabs, closeLeftTabs, closeAllTabs, pinTab, unpinTab, closeContextMenu]);

  if (tabs.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'relative flex items-center bg-muted/20 border-b border-border',
        className
      )}
    >
      {/* 左滚动按钮 */}
      {showScrollButtons && showLeftScroll && (
        <button
          onClick={() => scrollTo('left')}
          className={cn(
            'absolute left-0 z-10 h-full px-2',
            'bg-gradient-to-r from-muted/90 to-transparent',
            'hover:from-muted',
            'transition-colors'
          )}
          aria-label="Scroll left"
        >
          <RiArrowLeftSLine className="w-5 h-5" />
        </button>
      )}

      {/* 标签页容器 */}
      <div
        ref={scrollContainerRef}
        className="flex-1 flex items-center overflow-x-auto scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {tabs.map((tab, index) => (
          <div
            key={tab.id}
            draggable
            onDragStart={handleDragStart(index)}
            onDragOver={handleDragOver(index)}
            onDrop={handleDrop(index)}
            onDragEnd={handleDragEnd}
            className={cn(
              'transition-opacity',
              draggedIndex === index && 'opacity-50',
              dragOverIndex === index && 'border-l-2 border-l-primary'
            )}
          >
            <Tab
              tab={tab}
              isActive={tab.id === activeTabId}
              onClick={() => handleTabClick(tab.id)}
              onClose={handleTabClose(tab.id)}
              onTogglePin={handleTogglePin(tab.id)}
              onContextMenu={handleContextMenu(tab.id)}
            />
          </div>
        ))}
      </div>

      {/* 右滚动按钮 */}
      {showScrollButtons && showRightScroll && (
        <button
          onClick={() => scrollTo('right')}
          className={cn(
            'absolute right-0 z-10 h-full px-2',
            'bg-gradient-to-l from-muted/90 to-transparent',
            'hover:from-muted',
            'transition-colors'
          )}
          aria-label="Scroll right"
        >
          <RiArrowRightSLine className="w-5 h-5" />
        </button>
      )}

      {/* 右键菜单 */}
      {contextMenu && (
        <div
          className={cn(
            'fixed z-50 min-w-[200px]',
            'bg-popover border border-border rounded-md shadow-lg',
            'py-1'
          )}
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
        >
          {getContextMenuItems(contextMenu.tabId).map((item, index) => (
            <div key={index}>
              {item.separator && <div className="h-px bg-border my-1" />}
              <button
                onClick={item.onClick}
                disabled={item.disabled}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-sm',
                  'hover:bg-accent hover:text-accent-foreground',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'transition-colors'
                )}
              >
                {item.icon && <span className="w-4 h-4">{item.icon}</span>}
                <span>{item.label}</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
