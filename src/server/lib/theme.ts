/**
 * Theme Application Logic
 * 
 * 提供主题应用功能，包括：
 * - 主题配置解析
 * - CSS 变量生成
 * - HTML 主题注入
 * - 主题颜色映射
 * - ThemeManager 类
 */

import type { ThemeMode, ThemeConfig, ThemePalette } from '../../types/theme.js';
import { DEFAULT_LIGHT_THEME, DEFAULT_DARK_THEME } from '../../types/theme.js';

/**
 * 默认浅色主题颜色
 */
const LIGHT_THEME: ThemePalette = {
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
 * 默认深色主题颜色
 */
const DARK_THEME: ThemePalette = {
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
 * ThemeManager 类
 * 
 * 管理主题状态、切换和应用的中心类
 */
export class ThemeManager {
  private mode: ThemeMode;
  private customTheme: ThemePalette | null;
  private systemThemeListener: ((e: MediaQueryListEvent) => void) | null;
  private mediaQuery: MediaQueryList | null;

  constructor() {
    this.mode = 'light';
    this.customTheme = null;
    this.systemThemeListener = null;
    this.mediaQuery = null;
  }

  /**
   * 获取当前主题模式
   */
  getMode(): ThemeMode {
    return this.mode;
  }

  /**
   * 设置主题模式
   */
  setMode(mode: ThemeMode): void {
    this.mode = mode;
  }

  /**
   * 切换主题模式
   */
  toggleMode(): void {
    this.mode = this.mode === 'light' ? 'dark' : 'light';
  }

  /**
   * 获取当前主题颜色
   */
  getThemeColors(): ThemePalette {
    if (this.customTheme) {
      return this.customTheme;
    }

    const effectiveMode = this.getEffectiveMode();
    return effectiveMode === 'dark' ? DARK_THEME : LIGHT_THEME;
  }

  /**
   * 设置自定义主题
   */
  setCustomTheme(theme: ThemePalette): void {
    this.customTheme = theme;
  }

  /**
   * 清除自定义主题
   */
  clearCustomTheme(): void {
    this.customTheme = null;
  }

  /**
   * 获取有效的主题模式（解析 auto 模式）
   */
  private getEffectiveMode(): 'light' | 'dark' {
    if (this.mode === 'auto') {
      return this.mediaQuery?.matches ? 'dark' : 'light';
    }
    return this.mode;
  }

  /**
   * 应用主题到 DOM
   */
  applyToDOM(document: Document): void {
    const root = document.documentElement;
    const effectiveMode = this.getEffectiveMode();

    // 添加主题类名
    root.classList.remove('theme-light', 'theme-dark', 'theme-auto');
    root.classList.add(`theme-${effectiveMode}`);

    // 设置数据属性
    root.setAttribute('data-theme', effectiveMode);

    // 注入 CSS 变量
    const colors = this.getThemeColors();
    const css = generateThemeCSS(colors);

    // 检查是否已存在主题样式标签
    let styleTag = document.getElementById && document.getElementById('folder-site-theme-styles');
    if (!styleTag && document.createElement && document.head) {
      styleTag = document.createElement('style');
      styleTag.id = 'folder-site-theme-styles';
      document.head.appendChild(styleTag);
    }
    if (styleTag && typeof styleTag === 'object') {
      (styleTag as any).textContent = css;
    }
  }

  /**
   * 监听系统主题变化
   */
  listenSystemTheme(mediaQuery: MediaQueryList): void {
    this.mediaQuery = mediaQuery;
    
    this.systemThemeListener = (e) => {
      if (this.mode === 'auto') {
        this.applyToDOM(document);
      }
    };

    mediaQuery.addEventListener('change', this.systemThemeListener);
  }

  /**
   * 停止监听系统主题
   */
  stopSystemThemeListener(): void {
    if (this.mediaQuery && this.systemThemeListener) {
      this.mediaQuery.removeEventListener('change', this.systemThemeListener);
      this.systemThemeListener = null;
    }
  }

  /**
   * 销毁主题管理器，清理资源
   */
  destroy(): void {
    this.stopSystemThemeListener();
    this.customTheme = null;
  }
}

/**
 * 生成主题 CSS 变量
 * 
 * @param palette - 主题调色板
 * @param prefix - CSS 变量前缀（默认为 --theme-）
 * @returns CSS 变量字符串
 */
export function generateThemeCSS(
  palette: ThemePalette,
  prefix: string = '--theme-'
): string {
  const cssVariables: string[] = [];

  // 确保前缀以 -- 开头
  const cssPrefix = prefix.startsWith('--') ? prefix : `--${prefix}-`;

  for (const [key, value] of Object.entries(palette)) {
    cssVariables.push(`  ${cssPrefix}${key}: ${value};`);
  }

  return `:root {\n${cssVariables.join('\n')}\n}`;
}

/**
 * 将主题应用到 HTML
 * 
 * @param html - 原始 HTML 字符串
 * @param palette - 主题调色板
 * @returns 应用主题后的 HTML
 */
export function applyThemeToHTML(html: string, palette: ThemePalette): string {
  // 生成主题 CSS
  const css = generateThemeCSS(palette);

  // 创建样式标签
  const styleTag = `<style id="folder-site-theme-styles">\n${css}\n</style>`;

  // 将样式注入到 head 中
  const headEndIndex = html.indexOf('</head>');
  if (headEndIndex !== -1) {
    return html.slice(0, headEndIndex) + styleTag + html.slice(headEndIndex);
  }

  // 如果没有 head 标签，在 html 标签后添加
  const htmlTagIndex = html.indexOf('>');
  if (htmlTagIndex !== -1) {
    return html.slice(0, htmlTagIndex + 1) + styleTag + html.slice(htmlTagIndex + 1);
  }

  // 如果都没有，直接在开头添加
  return styleTag + html;
}

/**
 * 获取主题类名
 * 
 * @param mode - 主题模式
 * @returns 主题类名
 */
export function getThemeClass(mode: ThemeMode): string {
  return `theme-${mode}`;
}

/**
 * 获取主题数据属性
 * 
 * @param mode - 主题模式
 * @returns 数据属性字符串
 */
export function getThemeDataAttributes(mode: ThemeMode): string {
  return `data-theme="${mode}"`;
}

/**
 * 解析主题配置
 * 
 * @param config - 主题配置对象
 * @returns 解析后的主题配置
 */
export function parseThemeConfig(config: any): ThemeConfig {
  return {
    mode: config.mode || 'light',
    colors: config.colors || {},
    fontFamily: config.fontFamily,
    customCss: config.customCss || [],
    transitions: config.transitions !== false,
    transitionDuration: config.transitionDuration || 200,
  };
}

/**
 * 验证主题配置
 * 
 * @param config - 主题配置对象
 * @returns 验证结果
 */
export function validateThemeConfig(config: any): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 验证主题模式
  if (config.mode && !['light', 'dark', 'auto'].includes(config.mode)) {
    errors.push(`Invalid theme mode: ${config.mode}. Must be one of: light, dark, auto`);
  }

  // 验证颜色格式
  if (config.colors) {
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    for (const [key, value] of Object.entries(config.colors)) {
      if (typeof value === 'string' && value !== '' && !hexColorRegex.test(value)) {
        errors.push(`Invalid color value for ${key}: ${value}. Must be a valid hex color code`);
      }
    }
  }

  // 验证过渡动画持续时间
  if (config.transitionDuration !== undefined) {
    if (typeof config.transitionDuration !== 'number' || config.transitionDuration < 0) {
      errors.push('Invalid transitionDuration. Must be a non-negative number');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * 创建自定义主题
 * 
 * @param base - 基础主题调色板
 * @param overrides - 颜色覆盖
 * @returns 自定义主题调色板
 */
export function createCustomTheme(
  base: ThemePalette,
  overrides: Partial<ThemePalette>
): ThemePalette {
  return {
    ...base,
    ...overrides,
  };
}

/**
 * 获取默认浅色主题
 */
export function getDefaultLightTheme(): ThemePalette {
  return { ...LIGHT_THEME };
}

/**
 * 获取默认深色主题
 */
export function getDefaultDarkTheme(): ThemePalette {
  return { ...DARK_THEME };
}

/**
 * 根据主题模式获取默认主题
 */
export function getDefaultTheme(mode: ThemeMode): ThemePalette {
  return mode === 'dark' ? getDefaultDarkTheme() : getDefaultLightTheme();
}

/**
 * 主题工具集合
 */
export const themeUtils = {
  generateThemeCSS,
  applyThemeToHTML,
  getThemeClass,
  getThemeDataAttributes,
  parseThemeConfig,
  validateThemeConfig,
  createCustomTheme,
  getDefaultLightTheme,
  getDefaultDarkTheme,
  getDefaultTheme,
};