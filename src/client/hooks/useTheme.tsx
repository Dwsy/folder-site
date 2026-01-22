/**
 * useTheme Hook
 * 
 * React 主题 Hook，支持客户端主题切换和持久化
 * 
 * 功能特性：
 * - 支持三种主题模式：light（浅色）、dark（深色）、auto（自动）
 * - 主题配置持久化到 localStorage
 * - 跨标签页主题同步
 * - 主题数据迁移支持
 * - 监听系统主题变化
 * - 提供主题切换 API
 * - 支持自定义主题颜色
 * - TypeScript 类型安全
 */

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import type { ThemeMode, ThemeConfig, ThemePalette } from '../../types/theme.js';
import { DEFAULT_THEME_CONFIG } from '../../types/theme.js';

/**
 * 主题数据迁移
 * 
 * 处理旧版本的主题数据格式，确保向后兼容
 * 
 * @param stored - 存储的主题数据
 * @returns 迁移后的主题模式
 */
function migrateThemeData(stored: string): ThemeMode | null {
  try {
    // 尝试解析 JSON 格式
    const parsed = JSON.parse(stored);
    
    // 新格式: { mode: 'light' | 'dark' | 'auto' }
    if (parsed.mode && ['light', 'dark', 'auto'].includes(parsed.mode)) {
      return parsed.mode;
    }
    
    // 旧格式1: { theme: 'light' | 'dark' }
    if (parsed.theme && ['light', 'dark'].includes(parsed.theme)) {
      return parsed.theme;
    }
    
    // 旧格式2: 直接存储字符串 "light" | "dark"
    if (typeof parsed === 'string' && ['light', 'dark', 'auto'].includes(parsed)) {
      return parsed;
    }
    
    return null;
  } catch (error) {
    // 如果不是 JSON，尝试直接作为字符串解析
    if (typeof stored === 'string' && ['light', 'dark', 'auto'].includes(stored)) {
      return stored as ThemeMode;
    }
    
    return null;
  }
}

/**
 * 安全地从 localStorage 读取主题
 * 
 * @param key - 存储键名
 * @param fallback - 默认值
 * @returns 主题模式
 */
function safeGetTheme(key: string, fallback: ThemeMode): ThemeMode {
  if (typeof window === 'undefined') {
    return fallback;
  }
  
  try {
    const stored = localStorage.getItem(key);
    if (!stored) {
      return fallback;
    }
    
    const migrated = migrateThemeData(stored);
    if (migrated) {
      // 如果是旧格式，迁移到新格式
      if (stored !== JSON.stringify({ mode: migrated })) {
        localStorage.setItem(key, JSON.stringify({ mode: migrated }));
      }
      return migrated;
    }
    
    return fallback;
  } catch (error) {
    console.warn('Failed to load theme from localStorage:', error);
    return fallback;
  }
}

/**
 * 安全地从 localStorage 读取颜色配置
 * 
 * @param key - 存储键名
 * @returns 颜色配置
 */
function safeGetColors(key: string): Partial<ThemePalette> {
  if (typeof window === 'undefined') {
    return {};
  }
  
  try {
    const stored = localStorage.getItem(key);
    if (!stored) {
      return {};
    }
    
    const parsed = JSON.parse(stored);
    
    // 验证颜色格式
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed;
    }
    
    return {};
  } catch (error) {
    console.warn('Failed to load theme colors from localStorage:', error);
    return {};
  }
}

/**
 * 主题上下文值
 */
interface ThemeContextValue {
  /** 当前主题模式 */
  theme: ThemeMode;
  /** 有效主题（auto 模式下解析为 light 或 dark） */
  effectiveTheme: 'light' | 'dark';
  /** 当前主题颜色 */
  colors: ThemePalette;
  /** 主题配置 */
  config: ThemeConfig;
  /** 设置主题模式 */
  setTheme: (mode: ThemeMode) => void;
  /** 切换主题模式 */
  toggleTheme: () => void;
  /** 设置主题颜色 */
  setColors: (colors: Partial<ThemePalette>) => void;
  /** 重置主题 */
  resetTheme: () => void;
}

/**
 * 主题上下文
 */
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/**
 * 主题提供者属性
 */
interface ThemeProviderProps {
  /** 子组件 */
  children: ReactNode;
  /** 初始主题配置 */
  initialConfig?: Partial<ThemeConfig>;
  /** localStorage 键名 */
  storageKey?: string;
}

/**
 * 默认浅色主题
 */
const DEFAULT_PALETTE_LIGHT: ThemePalette = {
  background: '#ffffff',
  foreground: '#0a0a0a',
  primary: '#0066cc',
  secondary: '#6b7280',
  text: '#0a0a0a',
  muted: '#737373',
  accent: '#8b5cf6',
  border: '#d4d4d4',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
};

/**
 * 默认深色主题
 */
const DEFAULT_PALETTE_DARK: ThemePalette = {
  background: '#0a0a0a',
  foreground: '#fafafa',
  primary: '#3b82f6',
  secondary: '#737373',
  text: '#fafafa',
  muted: '#a3a3a3',
  accent: '#8b5cf6',
  border: '#404040',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
};

/**
 * ThemeProvider 组件
 * 
 * 提供主题上下文，管理主题状态和持久化
 * 
 * @example
 * ```tsx
 * <ThemeProvider>
 *   <App />
 * </ThemeProvider>
 * ```
 */
export function ThemeProvider({
  children,
  initialConfig = {},
  storageKey = 'folder-site-theme',
}: ThemeProviderProps) {
  // 合并初始配置
  const config: ThemeConfig = {
    ...DEFAULT_THEME_CONFIG,
    ...initialConfig,
  };

  // 初始化主题状态
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    return safeGetTheme(storageKey, config.mode);
  });

  // 系统主题偏好
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') {
      return 'light';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // 自定义颜色
  const [customColors, setCustomColors] = useState<Partial<ThemePalette>>(() => {
    return safeGetColors(`${storageKey}-colors`);
  });

  // 计算有效主题
  const effectiveTheme: 'light' | 'dark' = theme === 'auto' ? systemTheme : theme;

  // 获取当前主题颜色
  const colors: ThemePalette = {
    ...(effectiveTheme === 'dark' ? DEFAULT_PALETTE_DARK : DEFAULT_PALETTE_LIGHT),
    ...customColors,
  };

  // 保存主题到 localStorage
  const saveTheme = useCallback((mode: ThemeMode) => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(storageKey, JSON.stringify({ mode }));
    } catch (error) {
      console.warn('Failed to save theme to localStorage:', error);
    }
  }, [storageKey]);

  // 保存颜色到 localStorage
  const saveColors = useCallback((colorsToSave: Partial<ThemePalette>) => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(`${storageKey}-colors`, JSON.stringify(colorsToSave));
    } catch (error) {
      console.warn('Failed to save theme colors to localStorage:', error);
    }
  }, [storageKey]);

  // 设置主题模式
  const setTheme = useCallback((mode: ThemeMode) => {
    setThemeState(mode);
    saveTheme(mode);
  }, [saveTheme]);

  // 切换主题模式（在 light、dark、auto 之间循环切换）
  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      let next: ThemeMode;
      if (prev === 'light') {
        next = 'dark';
      } else if (prev === 'dark') {
        next = 'auto';
      } else {
        next = 'light';
      }
      saveTheme(next);
      return next;
    });
  }, [saveTheme]);

  // 设置主题颜色
  const setColors = useCallback((newColors: Partial<ThemePalette>) => {
    setCustomColors((prev) => {
      const updated = { ...prev, ...newColors };
      saveColors(updated);
      return updated;
    });
  }, [saveColors]);

  // 重置主题
  const resetTheme = useCallback(() => {
    setThemeState(config.mode);
    setCustomColors({});
    saveTheme(config.mode);
    
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(`${storageKey}-colors`);
      } catch (error) {
        console.warn('Failed to remove theme colors from localStorage:', error);
      }
    }
  }, [config.mode, storageKey, saveTheme]);

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

  // 跨标签页同步主题
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageChange = (e: StorageEvent) => {
      // 只处理主题相关的存储变化
      if (e.key === storageKey && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed.mode && parsed.mode !== theme) {
            setThemeState(parsed.mode);
          }
        } catch (error) {
          console.warn('Failed to parse theme from storage event:', error);
        }
      }

      // 处理自定义颜色的同步
      if (e.key === `${storageKey}-colors` && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setCustomColors(parsed);
        } catch (error) {
          console.warn('Failed to parse theme colors from storage event:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [storageKey, theme]);

  // 应用主题到 DOM
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;

    // 添加主题类名
    root.classList.remove('theme-light', 'theme-dark');
    root.classList.add(`theme-${effectiveTheme}`);

    // Tailwind dark mode: 添加/移除 dark 类
    if (effectiveTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // 设置数据属性
    root.setAttribute('data-theme', effectiveTheme);

    // 注入 CSS 变量
    const styleId = 'folder-site-theme-styles';
    let styleTag = document.getElementById(styleId) as HTMLStyleElement | null;

    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = styleId;
      document.head.appendChild(styleTag);
    }

    // 生成 CSS 变量
    const cssVariables = Object.entries(colors)
      .map(([key, value]) => `  --theme-${key}: ${value};`)
      .join('\n');

    styleTag.textContent = `:root {\n${cssVariables}\n}`;
  }, [effectiveTheme, colors]);

  const value: ThemeContextValue = {
    theme,
    effectiveTheme,
    colors,
    config,
    setTheme,
    toggleTheme,
    setColors,
    resetTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * useTheme Hook
 * 
 * 提供主题相关的状态和操作函数
 * 
 * @returns 主题上下文值
 * 
 * @example
 * ```tsx
 * const { theme, setTheme, toggleTheme, effectiveTheme } = useTheme();
 * ```
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
}

/**
 * useEffectiveTheme Hook
 * 
 * 获取当前有效的主题（解析 auto 模式）
 * 
 * @returns 有效主题（light 或 dark）
 * 
 * @example
 * ```tsx
 * const effectiveTheme = useEffectiveTheme();
 * const bgColor = effectiveTheme === 'dark' ? 'bg-gray-900' : 'bg-white';
 * ```
 */
export function useEffectiveTheme(): 'light' | 'dark' {
  const { effectiveTheme } = useTheme();
  return effectiveTheme;
}

/**
 * useIsDark Hook
 * 
 * 检查当前是否为深色模式
 * 
 * @returns 是否为深色模式
 * 
 * @example
 * ```tsx
 * const isDark = useIsDark();
 * const textColor = isDark ? 'text-white' : 'text-gray-900';
 * ```
 */
export function useIsDark(): boolean {
  const effectiveTheme = useEffectiveTheme();
  return effectiveTheme === 'dark';
}

/**
 * useIsLight Hook
 * 
 * 检查当前是否为浅色模式
 * 
 * @returns 是否为浅色模式
 * 
 * @example
 * ```tsx
 * const isLight = useIsLight();
 * const bgColor = isLight ? 'bg-white' : 'bg-gray-900';
 * ```
 */
export function useIsLight(): boolean {
  const effectiveTheme = useEffectiveTheme();
  return effectiveTheme === 'light';
}