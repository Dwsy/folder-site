/**
 * useMarkdownTheme Hook
 * 
 * 管理 Markdown 主题模式，支持与系统主题独立设置
 */

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { MarkdownThemeMode } from '../../types/theme.js';
import { MarkdownThemeMode as MDM } from '../../types/theme.js';

/**
 * Markdown 主题上下文值
 */
interface MarkdownThemeContextValue {
  /** Markdown 主题模式 */
  markdownTheme: MarkdownThemeMode;
  /** 有效 Markdown 主题 */
  effectiveMarkdownTheme: 'light' | 'dark';
  /** 设置 Markdown 主题 */
  setMarkdownTheme: (mode: MarkdownThemeMode) => void;
}

/**
 * Markdown 主题上下文
 */
const MarkdownThemeContext = createContext<MarkdownThemeContextValue | undefined>(undefined);

/**
 * Markdown 主题提供者属性
 */
interface MarkdownThemeProviderProps {
  /** 子组件 */
  children: ReactNode;
  /** localStorage 键名 */
  storageKey?: string;
}

/**
 * 从 localStorage 安全读取 Markdown 主题
 */
function safeGetMarkdownTheme(key: string, fallback: MarkdownThemeMode): MarkdownThemeMode {
  if (typeof window === 'undefined') {
    return fallback;
  }

  try {
    const stored = localStorage.getItem(key);
    if (!stored) {
      return fallback;
    }

    const parsed = JSON.parse(stored);
    if (['auto', 'light', 'dark'].includes(parsed)) {
      return parsed as MarkdownThemeMode;
    }

    return fallback;
  } catch (error) {
    console.warn('Failed to load markdown theme from localStorage:', error);
    return fallback;
  }
}

/**
 * MarkdownThemeProvider 组件
 */
export function MarkdownThemeProvider({
  children,
  storageKey = 'folder-site-markdown-theme',
}: MarkdownThemeProviderProps) {
  const [markdownTheme, setMarkdownThemeState] = useState<MarkdownThemeMode>(() => {
    return safeGetMarkdownTheme(storageKey, MDM.Auto);
  });

  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') {
      return 'light';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // 计算有效 Markdown 主题
  const effectiveMarkdownTheme: 'light' | 'dark' =
    markdownTheme === 'auto' ? systemTheme : markdownTheme;

  // 设置 Markdown 主题
  const setMarkdownTheme = useCallback((mode: MarkdownThemeMode) => {
    setMarkdownThemeState(mode);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(storageKey, JSON.stringify(mode));
      } catch (error) {
        console.warn('Failed to save markdown theme to localStorage:', error);
      }
    }
  }, [storageKey]);

  // 监听系统主题变化
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  const value: MarkdownThemeContextValue = {
    markdownTheme,
    effectiveMarkdownTheme,
    setMarkdownTheme,
  };

  return <MarkdownThemeContext.Provider value={value}>{children}</MarkdownThemeContext.Provider>;
}

/**
 * useMarkdownTheme Hook
 */
export function useMarkdownTheme(): MarkdownThemeContextValue {
  const context = useContext(MarkdownThemeContext);

  if (context === undefined) {
    throw new Error('useMarkdownTheme must be used within a MarkdownThemeProvider');
  }

  return context;
}