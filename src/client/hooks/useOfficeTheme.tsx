/**
 * useOfficeTheme Hook
 * 
 * Office 文档主题 Hook，提供 CSS 变量动态注入和主题切换功能
 * 
 * 功能特性：
 * - 自动从 Office 文档样式中提取主题色
 * - 动态注入 CSS 变量到文档容器
 * - 支持明暗主题切换
 * - 主题持久化（localStorage）
 * - 实时变量更新
 * - 平滑过渡动画
 * - TypeScript 类型安全
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  OfficeThemeColors,
  OfficeThemeMode,
  OfficeThemeConfig,
  OfficeVariableUpdateOptions,
} from '../../types/officeTheme.js';
import {
  injectOfficeThemeVariables,
  clearOfficeThemeVariables,
  extractOfficeThemeColors,
} from '../lib/officeThemeInjector.js';
import {
  DEFAULT_OFFICE_THEME_COLORS,
  DEFAULT_OFFICE_THEME_CONFIG,
  validateOfficeThemeColors,
} from '../../types/officeTheme.js';

/**
 * Office 主题上下文值
 */
interface OfficeThemeContextValue {
  /** 当前主题模式 */
  themeMode: OfficeThemeMode;
  /** 当前主题颜色 */
  themeColors: OfficeThemeColors;
  /** 主题配置 */
  config: OfficeThemeConfig;
  /** 是否正在更新 */
  isUpdating: boolean;
  /** 设置主题模式 */
  setThemeMode: (mode: OfficeThemeMode) => void;
  /** 切换主题模式 */
  toggleThemeMode: () => void;
  /** 设置主题颜色 */
  setThemeColors: (colors: Partial<OfficeThemeColors>) => void;
  /** 更新单个 CSS 变量 */
  updateVariable: (variableName: string, value: string, options?: OfficeVariableUpdateOptions) => void;
  /** 从 Office 文档提取主题 */
  extractThemeFromDocument: (document: Document | Element) => void;
  /** 重置主题 */
  resetTheme: () => void;
  /** 获取当前 CSS 变量值 */
  getVariableValue: (variableName: string) => string | null;
}

/**
 * Office 主题配置选项
 */
interface UseOfficeThemeOptions {
  /** 容器选择器 */
  containerSelector?: string;
  /** 是否启用自动提取 */
  enableAutoExtract?: boolean;
  /** 是否启用持久化 */
  enablePersistence?: boolean;
  /** localStorage 键名 */
  storageKey?: string;
  /** 初始主题配置 */
  initialConfig?: Partial<OfficeThemeConfig>;
  /** 主题变化回调 */
  onThemeChange?: (themeMode: OfficeThemeMode, colors: OfficeThemeColors) => void;
}

/**
 * 默认选项
 */
const DEFAULT_OPTIONS: Required<UseOfficeThemeOptions> = {
  containerSelector: '.office-document',
  enableAutoExtract: true,
  enablePersistence: true,
  storageKey: 'folder-site-office-theme',
  initialConfig: {},
  onThemeChange: () => {},
};

/**
 * 安全地从 localStorage 读取主题数据
 * 
 * @param key - 存储键名
 * @returns 主题数据
 */
function safeReadFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') {
    return defaultValue;
  }

  try {
    const stored = localStorage.getItem(key);
    if (!stored) {
      return defaultValue;
    }

    const parsed = JSON.parse(stored);
    return parsed;
  } catch (error) {
    console.warn(`Failed to read from localStorage (${key}):`, error);
    return defaultValue;
  }
}

/**
 * 安全地保存到 localStorage
 * 
 * @param key - 存储键名
 * @param value - 要保存的值
 */
function safeWriteToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Failed to write to localStorage (${key}):`, error);
  }
}

/**
 * useOfficeTheme Hook
 * 
 * 提供 Office 文档主题相关的状态和操作函数
 * 
 * @param options - 配置选项
 * @returns Office 主题上下文值
 * 
 * @example
 * ```tsx
 * const { themeMode, setThemeMode, themeColors, updateVariable } = useOfficeTheme({
 *   containerSelector: '#office-viewer',
 *   enablePersistence: true,
 * });
 * ```
 */
export function useOfficeTheme(options: UseOfficeThemeOptions = {}): OfficeThemeContextValue {
  // 合并选项
  const opts: Required<UseOfficeThemeOptions> = {
    ...DEFAULT_OPTIONS,
    ...options,
    initialConfig: {
      ...DEFAULT_OFFICE_THEME_CONFIG,
      ...options.initialConfig,
    } as OfficeThemeConfig,
  };

  // 容器引用
  const containerRef = useRef<HTMLElement | null>(null);

  // 初始化主题模式
  const [themeMode, setThemeModeState] = useState<OfficeThemeMode>(() => {
    if (!opts.enablePersistence) {
      return opts.initialConfig.defaultMode || 'light';
    }

    const stored = safeReadFromStorage<OfficeThemeMode>(
      `${opts.storageKey}-mode`,
      opts.initialConfig.defaultMode || 'light'
    );

    // 验证存储的值
    if (['light', 'dark'].includes(stored)) {
      return stored;
    }

    return opts.initialConfig.defaultMode || 'light';
  });

  // 初始化主题颜色
  const [themeColors, setThemeColorsState] = useState<OfficeThemeColors>(() => {
    if (!opts.enablePersistence) {
      return { ...DEFAULT_OFFICE_THEME_COLORS };
    }

    const stored = safeReadFromStorage<Partial<OfficeThemeColors>>(
      `${opts.storageKey}-colors`,
      {}
    );

    const colors: OfficeThemeColors = {
      ...DEFAULT_OFFICE_THEME_COLORS,
      ...stored,
    } as OfficeThemeColors;

    // 验证颜色
    if (!validateOfficeThemeColors(colors)) {
      console.warn('Invalid theme colors in storage, using defaults');
      return { ...DEFAULT_OFFICE_THEME_COLORS };
    }

    return colors;
  });

  // 更新状态
  const [isUpdating, setIsUpdating] = useState(false);

  // 获取容器元素
  const getContainer = useCallback((): HTMLElement | null => {
    if (containerRef.current) {
      return containerRef.current;
    }

    const container = document.querySelector(opts.containerSelector) as HTMLElement | null;
    if (container) {
      containerRef.current = container;
    }

    return container;
  }, [opts.containerSelector]);

  // 注入主题变量到 DOM
  const injectTheme = useCallback(() => {
    const container = getContainer();
    if (!container) {
      return;
    }

    injectOfficeThemeVariables(container, {
      colors: themeColors,
      mode: themeMode,
      transitions: opts.initialConfig.transitions ?? true,
      transitionDuration: opts.initialConfig.transitionDuration ?? 200,
    });
  }, [getContainer, themeColors, themeMode, opts]);

  // 设置主题模式
  const setThemeMode = useCallback((mode: OfficeThemeMode) => {
    setIsUpdating(true);

    setThemeModeState(mode);

    if (opts.enablePersistence) {
      safeWriteToStorage(`${opts.storageKey}-mode`, mode);
    }

    // 延迟重置更新状态
    setTimeout(() => {
      setIsUpdating(false);
    }, opts.initialConfig.transitionDuration ?? 200);
  }, [opts.enablePersistence, opts.storageKey, opts.initialConfig]);

  // 切换主题模式
  const toggleThemeMode = useCallback(() => {
    setThemeModeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  // 设置主题颜色
  const setThemeColors = useCallback((colors: Partial<OfficeThemeColors>) => {
    setIsUpdating(true);

    setThemeColorsState((prev) => {
      const updated = { ...prev, ...colors };

      // 验证颜色
      if (!validateOfficeThemeColors(updated)) {
        console.warn('Invalid theme colors provided, ignoring');
        return prev;
      }

      if (opts.enablePersistence) {
        safeWriteToStorage(`${opts.storageKey}-colors`, colors);
      }

      return updated;
    });

    // 延迟重置更新状态
    setTimeout(() => {
      setIsUpdating(false);
    }, opts.initialConfig.transitionDuration ?? 200);
  }, [opts.enablePersistence, opts.storageKey, opts.initialConfig]);

  // 更新单个 CSS 变量
  const updateVariable = useCallback((
    variableName: string,
    value: string,
    options?: OfficeVariableUpdateOptions
  ) => {
    const container = getContainer();
    if (!container) {
      return;
    }

    // 直接设置 CSS 变量
    container.style.setProperty(variableName, value);

    // 更新状态
    setThemeColorsState((prev) => {
      const colorKey = variableName.replace(/^--office-/, '');
      if (colorKey in prev) {
        return { ...prev, [colorKey]: value };
      }
      return prev;
    });
  }, [getContainer]);

  // 从 Office 文档提取主题
  const extractThemeFromDocument = useCallback((doc: Document | Element) => {
    const computedStyle = window.getComputedStyle(doc instanceof Document ? doc.documentElement : doc);

    // 提取简单的主题颜色
    const colors: Partial<OfficeThemeColors> = {};

    // 尝试提取背景色
    const bgColor = computedStyle.backgroundColor;
    if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)') {
      colors.backgroundColor = bgColor;
    }

    // 尝试提取文字颜色
    const textColor = computedStyle.color;
    if (textColor && textColor !== 'rgba(0, 0, 0, 0)') {
      colors.foregroundColor = textColor;
    }

    // 尝试提取边框颜色
    const borderColor = computedStyle.borderColor;
    if (borderColor && borderColor !== 'rgba(0, 0, 0, 0)') {
      colors.borderColor = borderColor;
    }

    setThemeColors(colors);
  }, [setThemeColors]);

  // 重置主题
  const resetTheme = useCallback(() => {
    setIsUpdating(true);

    setThemeModeState(opts.initialConfig.defaultMode || 'light');
    setThemeColorsState({ ...DEFAULT_OFFICE_THEME_COLORS });

    if (opts.enablePersistence) {
      safeWriteToStorage(`${opts.storageKey}-mode`, opts.initialConfig.defaultMode || 'light');
      try {
        localStorage.removeItem(`${opts.storageKey}-colors`);
      } catch (error) {
        console.warn('Failed to remove theme colors from localStorage:', error);
      }
    }

    const container = getContainer();
    if (container) {
      clearOfficeThemeVariables(container);
    }

    // 延迟重置更新状态
    setTimeout(() => {
      setIsUpdating(false);
    }, opts.initialConfig.transitionDuration ?? 200);
  }, [opts, getContainer]);

  // 获取当前 CSS 变量值
  const getVariableValue = useCallback((variableName: string): string | null => {
    const container = getContainer();
    if (!container) {
      return null;
    }

    return container.style.getPropertyValue(variableName) || null;
  }, [getContainer]);

  // 监听主题变化，调用回调
  useEffect(() => {
    opts.onThemeChange(themeMode, themeColors);
  }, [themeMode, themeColors, opts]);

  // 注入主题变量到 DOM
  useEffect(() => {
    injectTheme();
  }, [injectTheme]);

  // 监听容器变化（动态加载的情况）
  useEffect(() => {
    if (!opts.containerSelector) {
      return;
    }

    const observer = new MutationObserver(() => {
      const container = document.querySelector(opts.containerSelector) as HTMLElement | null;
      if (container && container !== containerRef.current) {
        containerRef.current = container;
        injectTheme();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
    };
  }, [opts.containerSelector, injectTheme]);

  // 清理函数（组件卸载时）
  useEffect(() => {
    return () => {
      if (containerRef.current) {
        // 可选：清理 CSS 变量
        // clearOfficeThemeVariables(containerRef.current);
      }
    };
  }, []);

  return {
    themeMode,
    themeColors,
    config: {
      ...DEFAULT_OFFICE_THEME_CONFIG,
      ...opts.initialConfig,
    },
    isUpdating,
    setThemeMode,
    toggleThemeMode,
    setThemeColors,
    updateVariable,
    extractThemeFromDocument,
    resetTheme,
    getVariableValue,
  };
}

/**
 * useOfficeThemeMode Hook
 * 
 * 获取当前 Office 主题模式
 * 
 * @returns 主题模式
 * 
 * @example
 * ```tsx
 * const themeMode = useOfficeThemeMode();
 * const isDark = themeMode === 'dark';
 * ```
 */
export function useOfficeThemeMode(): OfficeThemeMode {
  const { themeMode } = useOfficeTheme();
  return themeMode;
}

/**
 * useOfficeThemeColors Hook
 * 
 * 获取当前 Office 主题颜色
 * 
 * @returns 主题颜色
 * 
 * @example
 * ```tsx
 * const themeColors = useOfficeThemeColors();
 * const primaryColor = themeColors.primaryColor;
 * ```
 */
export function useOfficeThemeColors(): OfficeThemeColors {
  const { themeColors } = useOfficeTheme();
  return themeColors;
}

/**
 * useOfficeThemeUpdater Hook
 * 
 * 获取主题更新函数
 * 
 * @returns 主题更新函数
 * 
 * @example
 * ```tsx
 * const { setThemeMode, toggleThemeMode, updateVariable } = useOfficeThemeUpdater();
 * ```
 */
export function useOfficeThemeUpdater() {
  const { setThemeMode, toggleThemeMode, updateVariable, setThemeColors } = useOfficeTheme();

  return {
    setThemeMode,
    toggleThemeMode,
    updateVariable,
    setThemeColors,
  };
}

/**
 * useOfficeThemeExtractor Hook
 * 
 * 提供 Office 文档主题提取功能
 * 
 * @returns 主题提取函数
 * 
 * @example
 * ```tsx
 * const { extractThemeFromDocument, extractAndApply } = useOfficeThemeExtractor();
 * 
 * // 提取并应用主题
 * extractAndApply(document.querySelector('.excel-workbook'));
 * ```
 */
export function useOfficeThemeExtractor() {
  const { extractThemeFromDocument, setThemeColors } = useOfficeTheme();

  /**
   * 提取并应用主题
   */
  const extractAndApply = useCallback((element: Document | Element | null) => {
    if (!element) {
      return;
    }

    const colors = extractOfficeThemeColors(element);
    setThemeColors(colors);
  }, [setThemeColors]);

  return {
    extractThemeFromDocument,
    extractAndApply,
  };
}

/**
 * useOfficeThemeReset Hook
 * 
 * 提供主题重置功能
 * 
 * @returns 主题重置函数
 * 
 * @example
 * ```tsx
 * const { resetTheme, resetToDefault } = useOfficeThemeReset();
 * ```
 */
export function useOfficeThemeReset() {
  const { resetTheme } = useOfficeTheme();

  /**
   * 重置为默认主题
   */
  const resetToDefault = useCallback(() => {
    resetTheme();
  }, [resetTheme]);

  return {
    resetTheme,
    resetToDefault,
  };
}

/**
 * useOfficeThemePersistence Hook
 * 
 * 提供主题持久化功能
 * 
 * @param options - 持久化选项
 * @returns 持久化函数
 * 
 * @example
 * ```tsx
 * const { saveTheme, loadTheme, clearTheme } = useOfficeThemePersistence({
 *   storageKey: 'my-office-theme',
 * });
 * ```
 */
export function useOfficeThemePersistence(options: {
  storageKey?: string;
  enable?: boolean;
} = {}) {
  const { themeMode, themeColors, setThemeMode, setThemeColors } = useOfficeTheme();
  const storageKey = options.storageKey || 'folder-site-office-theme';
  const enabled = options.enable ?? true;

  /**
   * 保存主题到存储
   */
  const saveTheme = useCallback(() => {
    if (!enabled) {
      return;
    }

    safeWriteToStorage(`${storageKey}-mode`, themeMode);
    safeWriteToStorage(`${storageKey}-colors`, themeColors);
  }, [enabled, storageKey, themeMode, themeColors]);

  /**
   * 从存储加载主题
   */
  const loadTheme = useCallback(() => {
    if (!enabled) {
      return;
    }

    const storedMode = safeReadFromStorage<OfficeThemeMode>(
      `${storageKey}-mode`,
      'light'
    );
    const storedColors = safeReadFromStorage<Partial<OfficeThemeColors>>(
      `${storageKey}-colors`,
      {}
    );

    setThemeMode(storedMode);
    setThemeColors(storedColors);
  }, [enabled, storageKey, setThemeMode, setThemeColors]);

  /**
   * 清除存储的主题
   */
  const clearTheme = useCallback(() => {
    if (!enabled) {
      return;
    }

    try {
      localStorage.removeItem(`${storageKey}-mode`);
      localStorage.removeItem(`${storageKey}-colors`);
    } catch (error) {
      console.warn('Failed to clear theme from localStorage:', error);
    }
  }, [enabled, storageKey]);

  return {
    saveTheme,
    loadTheme,
    clearTheme,
  };
}