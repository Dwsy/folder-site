/**
 * TabsContext - 标签页状态管理
 * 
 * 功能特性：
 * - 多文件标签页管理
 * - 标签页切换和关闭
 * - localStorage 持久化
 * - LRU 策略（最多10个标签页）
 * - 固定标签页功能
 * - 批量操作（关闭右侧、关闭其他等）
 * - 跨标签页同步
 */

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Tab 数据结构
 */
export interface Tab {
  /** 唯一标识（使用 path 作为 id） */
  id: string;
  /** 文件路径（相对路径） */
  path: string;
  /** 文件名 */
  name: string;
  /** 文件扩展名 */
  extension?: string;
  /** 是否为当前激活的 tab */
  isActive: boolean;
  /** 是否固定 */
  isPinned: boolean;
  /** 最后访问时间（用于 LRU） */
  lastAccessTime: number;
  /** 滚动位置 */
  scrollPosition: number;
}

/**
 * Tabs 配置
 */
export interface TabsConfig {
  /** 最大标签页数量 */
  maxTabs: number;
  /** localStorage 键名 */
  storageKey: string;
  /** 是否启用持久化 */
  enablePersistence: boolean;
  /** 是否启用滚动位置记忆 */
  enableScrollMemory: boolean;
}

/**
 * Tabs 上下文值
 */
interface TabsContextValue {
  /** 所有打开的标签页 */
  tabs: Tab[];
  /** 当前激活的标签页 ID */
  activeTabId: string | null;
  /** 最近关闭的标签页（用于重新打开） */
  recentlyClosed: Tab[];
  /** 配置 */
  config: TabsConfig;
  /** 打开标签页 */
  openTab: (path: string, name: string, extension?: string) => void;
  /** 关闭标签页 */
  closeTab: (id: string) => void;
  /** 切换到指定标签页 */
  switchTab: (id: string) => void;
  /** 关闭所有标签页 */
  closeAllTabs: () => void;
  /** 关闭其他标签页 */
  closeOtherTabs: (id: string) => void;
  /** 关闭右侧标签页 */
  closeRightTabs: (id: string) => void;
  /** 关闭左侧标签页 */
  closeLeftTabs: (id: string) => void;
  /** 重新打开最近关闭的标签页 */
  reopenClosedTab: () => void;
  /** 固定标签页 */
  pinTab: (id: string) => void;
  /** 取消固定标签页 */
  unpinTab: (id: string) => void;
  /** 移动标签页 */
  moveTab: (fromIndex: number, toIndex: number) => void;
  /** 保存当前tab的滚动位置 */
  saveScrollPosition: (id: string, position: number) => void;
  /** 获取tab的滚动位置 */
  getScrollPosition: (id: string) => number;
}

/**
 * Tabs 上下文
 */
const TabsContext = createContext<TabsContextValue | undefined>(undefined);

/**
 * 默认配置
 */
const DEFAULT_CONFIG: TabsConfig = {
  maxTabs: 10,
  storageKey: 'folder-site-tabs',
  enablePersistence: true,
  enableScrollMemory: true,
};

/**
 * 从 localStorage 加载标签页
 */
function loadTabs(storageKey: string): { tabs: Tab[], activeTabId: string | null, recentlyClosed: Tab[] } {
  if (typeof window === 'undefined') {
    return { tabs: [], activeTabId: null, recentlyClosed: [] };
  }

  try {
    const stored = localStorage.getItem(storageKey);
    if (!stored) {
      return { tabs: [], activeTabId: null, recentlyClosed: [] };
    }

    const parsed = JSON.parse(stored);

    // 为旧数据添加 scrollPosition 字段
    const tabsWithScroll = (parsed.tabs || []).map((tab: Tab) => ({
      ...tab,
      scrollPosition: tab.scrollPosition ?? 0,
    }));

    const recentlyClosedWithScroll = (parsed.recentlyClosed || []).map((tab: Tab) => ({
      ...tab,
      scrollPosition: tab.scrollPosition ?? 0,
    }));

    return {
      tabs: tabsWithScroll,
      activeTabId: parsed.activeTabId || null,
      recentlyClosed: recentlyClosedWithScroll,
    };
  } catch (error) {
    console.warn('Failed to load tabs from localStorage:', error);
    return { tabs: [], activeTabId: null, recentlyClosed: [] };
  }
}

/**
 * 保存标签页到 localStorage
 */
function saveTabs(
  storageKey: string,
  tabs: Tab[],
  activeTabId: string | null,
  recentlyClosed: Tab[]
) {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(storageKey, JSON.stringify({
      tabs,
      activeTabId,
      recentlyClosed,
    }));
  } catch (error) {
    console.warn('Failed to save tabs to localStorage:', error);
  }
}

/**
 * TabsProvider 属性
 */
interface TabsProviderProps {
  children: ReactNode;
  config?: Partial<TabsConfig>;
}

/**
 * TabsProvider 组件
 */
export function TabsProvider({ children, config: userConfig = {} }: TabsProviderProps) {
  const config: TabsConfig = { ...DEFAULT_CONFIG, ...userConfig };
  const navigate = useNavigate();
  const location = useLocation();

  // 初始化状态
  const [tabs, setTabs] = useState<Tab[]>(() => {
    if (!config.enablePersistence) return [];
    const loaded = loadTabs(config.storageKey);
    return loaded.tabs;
  });

  const [activeTabId, setActiveTabId] = useState<string | null>(() => {
    if (!config.enablePersistence) return null;
    const loaded = loadTabs(config.storageKey);
    return loaded.activeTabId;
  });

  const [recentlyClosed, setRecentlyClosed] = useState<Tab[]>(() => {
    if (!config.enablePersistence) return [];
    const loaded = loadTabs(config.storageKey);
    return loaded.recentlyClosed;
  });

  // 保存到 localStorage
  const persistTabs = useCallback(() => {
    if (!config.enablePersistence) return;
    saveTabs(config.storageKey, tabs, activeTabId, recentlyClosed);
  }, [tabs, activeTabId, recentlyClosed, config.storageKey, config.enablePersistence]);

  // 监听状态变化，自动持久化
  useEffect(() => {
    persistTabs();
  }, [persistTabs]);

  // 跨标签页同步
  useEffect(() => {
    if (typeof window === 'undefined' || !config.enablePersistence) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === config.storageKey && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setTabs(parsed.tabs || []);
          setActiveTabId(parsed.activeTabId || null);
          setRecentlyClosed(parsed.recentlyClosed || []);
        } catch (error) {
          console.warn('Failed to parse tabs from storage event:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [config.storageKey, config.enablePersistence]);

  // 打开标签页
  const openTab = useCallback((path: string, name: string, extension?: string) => {
    const id = path;
    const now = Date.now();

    setTabs((prevTabs) => {
      // 检查是否已存在
      const existingIndex = prevTabs.findIndex(tab => tab.id === id);
      
      if (existingIndex !== -1) {
        // 已存在，更新最后访问时间并激活
        const updated = prevTabs.map((tab, index) => ({
          ...tab,
          isActive: index === existingIndex,
          lastAccessTime: index === existingIndex ? now : tab.lastAccessTime,
        }));
        setActiveTabId(id);
        return updated;
      }

      // 新标签页
      const newTab: Tab = {
        id,
        path,
        name,
        extension,
        isActive: true,
        isPinned: false,
        lastAccessTime: now,
        scrollPosition: 0,
      };

      // 检查是否超过最大数量
      let updatedTabs = prevTabs.map(tab => ({ ...tab, isActive: false }));
      
      if (updatedTabs.length >= config.maxTabs) {
        // LRU 策略：移除最久未使用的非固定标签页
        const unpinnedTabs = updatedTabs.filter(tab => !tab.isPinned);
        
        if (unpinnedTabs.length > 0) {
          // 找到最久未使用的标签页
          const oldestTab = unpinnedTabs.reduce((oldest, current) => 
            current.lastAccessTime < oldest.lastAccessTime ? current : oldest
          );
          
          // 移除最久未使用的标签页
          updatedTabs = updatedTabs.filter(tab => tab.id !== oldestTab.id);
          
          // 添加到最近关闭列表
          setRecentlyClosed(prev => [oldestTab, ...prev].slice(0, 10));
        } else {
          // 所有标签页都被固定，无法添加新标签页
          console.warn('Cannot open new tab: all tabs are pinned');
          return prevTabs;
        }
      }

      setActiveTabId(id);
      return [...updatedTabs, newTab];
    });

    // 导航到该文件
    navigate(`/file/${path}`);
  }, [config.maxTabs, navigate]);

  // 关闭标签页
  const closeTab = useCallback((id: string) => {
    setTabs((prevTabs) => {
      const index = prevTabs.findIndex(tab => tab.id === id);
      if (index === -1) return prevTabs;

      const tabToClose = prevTabs[index];
      
      // 添加到最近关闭列表
      setRecentlyClosed(prev => [tabToClose, ...prev].slice(0, 10));

      // 移除标签页
      const updated = prevTabs.filter(tab => tab.id !== id);

      // 如果关闭的是当前激活的标签页，需要激活另一个
      if (tabToClose.isActive && updated.length > 0) {
        // 优先激活右侧标签页，否则激活左侧
        const nextIndex = index < updated.length ? index : updated.length - 1;
        updated[nextIndex].isActive = true;
        setActiveTabId(updated[nextIndex].id);
        navigate(`/file/${updated[nextIndex].path}`);
      } else if (updated.length === 0) {
        // 没有标签页了，导航到首页
        setActiveTabId(null);
        navigate('/');
      }

      return updated;
    });
  }, [navigate]);

  // 切换标签页
  const switchTab = useCallback((id: string) => {
    const now = Date.now();
    
    setTabs((prevTabs) => {
      const updated = prevTabs.map(tab => ({
        ...tab,
        isActive: tab.id === id,
        lastAccessTime: tab.id === id ? now : tab.lastAccessTime,
      }));
      
      const targetTab = updated.find(tab => tab.id === id);
      if (targetTab) {
        setActiveTabId(id);
        navigate(`/file/${targetTab.path}`);
      }
      
      return updated;
    });
  }, [navigate]);

  // 关闭所有标签页
  const closeAllTabs = useCallback(() => {
    setRecentlyClosed(prev => [...tabs, ...prev].slice(0, 10));
    setTabs([]);
    setActiveTabId(null);
    navigate('/');
  }, [tabs, navigate]);

  // 关闭其他标签页
  const closeOtherTabs = useCallback((id: string) => {
    setTabs((prevTabs) => {
      const targetTab = prevTabs.find(tab => tab.id === id);
      if (!targetTab) return prevTabs;

      const closedTabs = prevTabs.filter(tab => tab.id !== id && !tab.isPinned);
      setRecentlyClosed(prev => [...closedTabs, ...prev].slice(0, 10));

      const pinnedTabs = prevTabs.filter(tab => tab.isPinned && tab.id !== id);
      return [...pinnedTabs, { ...targetTab, isActive: true }];
    });
    
    setActiveTabId(id);
  }, []);

  // 关闭右侧标签页
  const closeRightTabs = useCallback((id: string) => {
    setTabs((prevTabs) => {
      const index = prevTabs.findIndex(tab => tab.id === id);
      if (index === -1) return prevTabs;

      const closedTabs = prevTabs.slice(index + 1).filter(tab => !tab.isPinned);
      setRecentlyClosed(prev => [...closedTabs, ...prev].slice(0, 10));

      const pinnedRight = prevTabs.slice(index + 1).filter(tab => tab.isPinned);
      return [...prevTabs.slice(0, index + 1), ...pinnedRight];
    });
  }, []);

  // 关闭左侧标签页
  const closeLeftTabs = useCallback((id: string) => {
    setTabs((prevTabs) => {
      const index = prevTabs.findIndex(tab => tab.id === id);
      if (index === -1) return prevTabs;

      const closedTabs = prevTabs.slice(0, index).filter(tab => !tab.isPinned);
      setRecentlyClosed(prev => [...closedTabs, ...prev].slice(0, 10));

      const pinnedLeft = prevTabs.slice(0, index).filter(tab => tab.isPinned);
      return [...pinnedLeft, ...prevTabs.slice(index)];
    });
  }, []);

  // 重新打开最近关闭的标签页
  const reopenClosedTab = useCallback(() => {
    if (recentlyClosed.length === 0) return;

    const [tabToReopen, ...rest] = recentlyClosed;
    setRecentlyClosed(rest);

    openTab(tabToReopen.path, tabToReopen.name, tabToReopen.extension);
  }, [recentlyClosed, openTab]);

  // 固定标签页
  const pinTab = useCallback((id: string) => {
    setTabs((prevTabs) => 
      prevTabs.map(tab => 
        tab.id === id ? { ...tab, isPinned: true } : tab
      )
    );
  }, []);

  // 取消固定标签页
  const unpinTab = useCallback((id: string) => {
    setTabs((prevTabs) => 
      prevTabs.map(tab => 
        tab.id === id ? { ...tab, isPinned: false } : tab
      )
    );
  }, []);

  // 移动标签页
  const moveTab = useCallback((fromIndex: number, toIndex: number) => {
    setTabs((prevTabs) => {
      const updated = [...prevTabs];
      const [movedTab] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, movedTab);
      return updated;
    });
  }, []);

  // 保存滚动位置
  const saveScrollPosition = useCallback((id: string, position: number) => {
    setTabs((prevTabs) =>
      prevTabs.map(tab =>
        tab.id === id ? { ...tab, scrollPosition: position } : tab
      )
    );
  }, []);

  // 获取滚动位置
  const getScrollPosition = useCallback((id: string): number => {
    return tabs.find(tab => tab.id === id)?.scrollPosition ?? 0;
  }, [tabs]);

  // 监听路由变化，自动添加到 tabs
  useEffect(() => {
    const match = location.pathname.match(/^\/file\/(.+)$/);
    if (match) {
      const path = match[1];
      const name = path.split('/').pop() || path;
      const extension = name.split('.').pop();
      
      // 检查是否已存在
      const exists = tabs.find(tab => tab.id === path);
      if (!exists) {
        openTab(path, name, extension);
      } else if (!exists.isActive) {
        switchTab(path);
      }
    }
  }, [location.pathname]); // 移除 tabs, openTab, switchTab 依赖，避免无限循环

  const value: TabsContextValue = {
    tabs,
    activeTabId,
    recentlyClosed,
    config,
    openTab,
    closeTab,
    switchTab,
    closeAllTabs,
    closeOtherTabs,
    closeRightTabs,
    closeLeftTabs,
    reopenClosedTab,
    pinTab,
    unpinTab,
    moveTab,
    saveScrollPosition,
    getScrollPosition,
  };

  return <TabsContext.Provider value={value}>{children}</TabsContext.Provider>;
}

/**
 * useTabs Hook
 */
export function useTabs(): TabsContextValue {
  const context = useContext(TabsContext);
  
  if (context === undefined) {
    throw new Error('useTabs must be used within a TabsProvider');
  }
  
  return context;
}
