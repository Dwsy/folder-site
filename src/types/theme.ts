/**
 * 主题系统类型定义
 * 
 * 定义了主题模式、颜色配置、主题系统相关的所有类型
 */

/**
 * 主题模式枚举
 */
export const ThemeMode = {
  Light: 'light',
  Dark: 'dark',
  Auto: 'auto',
} as const;

/**
 * 主题模式类型
 */
export type ThemeMode = typeof ThemeMode[keyof typeof ThemeMode];

/**
 * 主题颜色配置（完整版）
 */
export interface ThemeColors {
  /** 背景色 */
  background: string;
  /** 前景色 */
  foreground: string;
  /** 主色调 */
  primary: string;
  /** 次要色调 */
  secondary: string;
  /** 文本颜色 */
  text: string;
  /** 静音色 */
  muted: string;
  /** 强调色 */
  accent: string;
  /** 边框色 */
  border: string;
  /** 成功色 */
  success: string;
  /** 警告色 */
  warning: string;
  /** 错误色 */
  error: string;
}

/**
 * 主题调色板（用于自定义主题）
 */
export interface ThemePalette {
  /** 背景色 */
  background: string;
  /** 前景色 */
  foreground: string;
  /** 主色调 */
  primary: string;
  /** 次要色调 */
  secondary: string;
  /** 文本颜色 */
  text: string;
  /** 静音色 */
  muted: string;
  /** 强调色 */
  accent: string;
  /** 边框色 */
  border: string;
  /** 成功色 */
  success: string;
  /** 警告色 */
  warning: string;
  /** 错误色 */
  error: string;
}

/**
 * 默认浅色主题
 */
export const DEFAULT_LIGHT_THEME: ThemeColors = {
  background: '#ffffff',
  foreground: '#f5f5f5',
  primary: '#0066cc',
  secondary: '#6b7280',
  text: '#0a0a0a',
  muted: '#a3a3a3',
  accent: '#8b5cf6',
  border: '#d4d4d4',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
};

/**
 * 默认深色主题
 */
export const DEFAULT_DARK_THEME: ThemeColors = {
  background: '#0a0a0a',
  foreground: '#171717',
  primary: '#3b82f6',
  secondary: '#737373',
  text: '#fafafa',
  muted: '#525252',
  accent: '#a78bfa',
  border: '#404040',
  success: '#22c55e',
  warning: '#fbbf24',
  error: '#f87171',
};

/**
 * 主题配置
 */
export interface ThemeConfig {
  /** 主题模式 */
  mode: ThemeMode;
  /** 主色调 */
  primaryColor?: string;
  /** 主题颜色 */
  colors?: Partial<ThemeColors>;
  /** 主题字体 */
  fontFamily?: string;
  /** 自定义 CSS */
  customCss?: string[];
  /** 是否启用过渡动画 */
  transitions?: boolean;
  /** 过渡动画持续时间（毫秒） */
  transitionDuration?: number;
}

/**
 * 默认主题配置
 */
export const DEFAULT_THEME_CONFIG: ThemeConfig = {
  mode: 'auto',
  colors: undefined,
  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  customCss: [],
  transitions: true,
  transitionDuration: 200,
};

/**
 * 主题应用选项
 */
export interface ThemeApplyOptions {
  /** 是否注入 CSS 变量 */
  injectCssVariables?: boolean;
  /** 是否添加主题 class */
  addThemeClass?: boolean;
  /** 是否启用过渡动画 */
  enableTransitions?: boolean;
  /** HTML 元素（默认为 document.documentElement） */
  htmlElement?: HTMLElement;
}

/**
 * 主题切换结果
 */
export interface ThemeSwitchResult {
  /** 切换前的主题 */
  previousTheme: ThemeMode;
  /** 切换后的主题 */
  currentTheme: ThemeMode;
  /** 实际应用的主题（auto 模式下会解析为 light 或 dark） */
  effectiveTheme: 'light' | 'dark';
  /** 是否成功切换 */
  success: boolean;
  /** 错误信息（如果失败） */
  error?: string;
}

/**
 * 主题持久化配置
 */
export interface ThemePersistenceConfig {
  /** 存储键名 */
  storageKey: string;
  /** 是否启用持久化 */
  enabled: boolean;
  /** 持久化方式 */
  storage: 'localStorage' | 'sessionStorage' | 'cookie';
}

/**
 * 默认持久化配置
 */
export const DEFAULT_PERSISTENCE_CONFIG: ThemePersistenceConfig = {
  storageKey: 'folder-site-theme',
  enabled: true,
  storage: 'localStorage',
};

/**
 * 主题 CSS 变量前缀
 */
export const THEME_CSS_PREFIX = '--theme-';

/**
 * 主题 class 名称
 */
export const THEME_CLASS_NAMES = {
  light: 'theme-light',
  dark: 'theme-dark',
  auto: 'theme-auto',
} as const;

/**
 * 系统主题偏好
 */
export interface SystemThemePreference {
  /** 是否支持深色模式 */
  supportsDarkMode: boolean;
  /** 当前系统主题 */
  currentTheme: 'light' | 'dark';
  /** 媒体查询对象 */
  mediaQuery: MediaQueryList;
}

/**
 * 主题验证结果
 */
export interface ThemeValidationResult {
  /** 是否有效 */
  valid: boolean;
  /** 错误信息 */
  errors: string[];
  /** 警告信息 */
  warnings: string[];
}

/**
 * 主题导出选项
 */
export interface ThemeExportOptions {
  /** 导出格式 */
  format: 'json' | 'css' | 'css-variables';
  /** 是否包含默认值 */
  includeDefaults?: boolean;
  /** CSS 变量前缀 */
  cssPrefix?: string;
}

/**
 * 主题导出结果
 */
export interface ThemeExportResult {
  /** 导出内容 */
  content: string;
  /** 格式 */
  format: string;
  /** 大小（字节） */
  size: number;
}

/**
 * 获取有效的主题模式
 * 
 * @param mode - 主题模式
 * @param systemTheme - 系统主题（可选）
 * @returns 有效主题模式（light 或 dark）
 * 
 * @example
 * ```typescript
 * const effective = getEffectiveTheme(ThemeMode.Auto, 'dark'); // 'dark'
 * const effective2 = getEffectiveTheme(ThemeMode.Light); // 'light'
 * ```
 */
export function getEffectiveTheme(
  mode: ThemeMode,
  systemTheme?: 'light' | 'dark'
): 'light' | 'dark' {
  if (mode === 'auto') {
    // 如果没有提供系统主题，默认使用 light
    return systemTheme || 'light';
  }
  return mode;
}

/**
 * 合并主题配置
 * 
 * 将用户配置与默认配置合并，用户配置优先
 * 
 * @param baseConfig - 基础主题配置
 * @param userConfig - 用户主题配置
 * @returns 合并后的主题配置
 * 
 * @example
 * ```typescript
 * const merged = mergeThemeConfig(
 *   DEFAULT_THEME_CONFIG,
 *   { mode: ThemeMode.Dark, primaryColor: '#ff0000' }
 * );
 * ```
 */
export function mergeThemeConfig(
  baseConfig: ThemeConfig,
  userConfig: Partial<ThemeConfig>
): ThemeConfig {
  return {
    mode: userConfig.mode ?? baseConfig.mode,
    primaryColor: userConfig.primaryColor ?? baseConfig.primaryColor,
    colors: userConfig.colors ? { ...(baseConfig.colors || {}), ...userConfig.colors } : baseConfig.colors,
    fontFamily: userConfig.fontFamily ?? baseConfig.fontFamily,
    customCss: userConfig.customCss ?? baseConfig.customCss,
    transitions: userConfig.transitions ?? baseConfig.transitions,
    transitionDuration: userConfig.transitionDuration ?? baseConfig.transitionDuration,
  };
}

/**
 * 验证主题颜色
 * 
 * @param colors - 主题颜色
 * @returns 是否有效
 */
export function isValidThemeColor(colors: Partial<ThemeColors>): boolean {
  if (!colors || typeof colors !== 'object') {
    return false;
  }

  // 检查颜色格式（十六进制）
  const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  
  for (const [, value] of Object.entries(colors)) {
    if (typeof value === 'string' && value !== '') {
      if (!hexColorRegex.test(value)) {
        return false;
      }
    }
  }

  return true;
}

/**
 * 验证主题配置
 * 
 * @param config - 主题配置
 * @returns 验证结果
 */
export function validateThemeConfig(config: Partial<ThemeConfig>): ThemeValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 验证主题模式
  if (config.mode && !['light', 'dark', 'auto'].includes(config.mode)) {
    errors.push(`Invalid theme mode: ${config.mode}. Must be one of: light, dark, auto`);
  }

  // 验证颜色配置
  if (config.colors) {
    if (!isValidThemeColor(config.colors)) {
      errors.push('Invalid theme colors. Colors must be valid hex color codes (e.g., #ffffff)');
    }
  }

  // 验证过渡动画持续时间
  if (config.transitionDuration !== undefined) {
    if (typeof config.transitionDuration !== 'number' || config.transitionDuration < 0) {
      errors.push('Invalid transitionDuration. Must be a non-negative number');
    }
  }

  // 验证自定义 CSS
  if (config.customCss) {
    if (!Array.isArray(config.customCss)) {
      errors.push('Invalid customCss. Must be an array of strings');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * 导出主题配置
 * 
 * @param config - 主题配置
 * @param options - 导出选项
 * @returns 导出结果
 */
export function exportTheme(
  config: ThemeConfig,
  options: ThemeExportOptions = { format: 'json' }
): ThemeExportResult {
  let content: string;

  switch (options.format) {
    case 'json':
      content = JSON.stringify(config, null, 2);
      break;
    case 'css':
      content = generateThemeCSSText(config);
      break;
    case 'css-variables':
      content = generateCSSVariablesText(config, options.cssPrefix || THEME_CSS_PREFIX);
      break;
    default:
      content = JSON.stringify(config, null, 2);
  }

  return {
    content,
    format: options.format,
    size: new Blob([content]).size,
  };
}

/**
 * 生成主题 CSS 文本
 * 
 * @param config - 主题配置
 * @returns CSS 文本
 */
function generateThemeCSSText(config: ThemeConfig): string {
  const colors = config.colors || {};
  const lines: string[] = [];

  lines.push('/* Theme CSS */');
  lines.push(`:root {`);

  // 添加颜色变量
  for (const [key, value] of Object.entries(colors)) {
    lines.push(`  --color-${key}: ${value};`);
  }

  // 添加字体
  if (config.fontFamily) {
    lines.push(`  --font-family: ${config.fontFamily};`);
  }

  lines.push('}');

  return lines.join('\n');
}

/**
 * 生成 CSS 变量文本
 * 
 * @param config - 主题配置
 * @param prefix - CSS 变量前缀
 * @returns CSS 变量文本
 */
function generateCSSVariablesText(config: ThemeConfig, prefix: string): string {
  const colors = config.colors || {};
  const lines: string[] = [];

  for (const [key, value] of Object.entries(colors)) {
    lines.push(`${prefix}${key}: ${value};`);
  }

  return lines.join('\n');
}