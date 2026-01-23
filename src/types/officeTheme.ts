/**
 * Office 文档主题类型定义
 * 
 * 定义了 Office 文档主题模式、颜色配置、CSS 变量相关的所有类型
 */

/**
 * Office 主题模式枚举
 */
export const OfficeThemeMode = {
  Light: 'light',
  Dark: 'dark',
} as const;

/**
 * Office 主题模式类型
 */
export type OfficeThemeMode = typeof OfficeThemeMode[keyof typeof OfficeThemeMode];

/**
 * Office 主题颜色配置
 * 
 * 定义了 Office 文档使用的所有主题颜色
 */
export interface OfficeThemeColors {
  /** 主色调 - 用于按钮、链接、强调元素 */
  primaryColor: string;
  /** 次要色调 - 用于次要元素 */
  secondaryColor: string;
  /** 成功色 - 用于成功状态 */
  successColor: string;
  /** 警告色 - 用于警告状态 */
  warningColor: string;
  /** 错误色 - 用于错误状态 */
  errorColor: string;
  /** 信息色 - 用于信息提示 */
  infoColor: string;
  /** 背景色 - Excel 表格背景 */
  backgroundColor: string;
  /** 前景色 - 文字颜色 */
  foregroundColor: string;
  /** 边框色 - 表格边框 */
  borderColor: string;
  /** 表头背景色 - Excel 表头 */
  headerBackgroundColor: string;
  /** 表头文字色 - Excel 表头文字 */
  headerTextColor: string;
  /** 单元格背景色 - Excel 单元格 */
  cellBackgroundColor: string;
  /** 单元格文字色 - Excel 单元格文字 */
  cellTextColor: string;
  /** 悬停背景色 - 鼠标悬停 */
  hoverBackgroundColor: string;
  /** 悬停文字色 - 悬停时文字 */
  hoverTextColor: string;
  /** 选中背景色 - 选中状态 */
  selectedBackgroundColor: string;
  /** 选中文字色 - 选中时文字 */
  selectedTextColor: string;
  /** 网格线颜色 - Excel 网格线 */
  gridLineColor: string;
  /** 工具栏背景色 - PDF 工具栏 */
  toolbarBackgroundColor: string;
  /** 工具栏边框色 */
  toolbarBorderColor: string;
  /** 滚动条轨道色 */
  scrollbarTrackColor: string;
  /** 滚动条滑块色 */
  scrollbarThumbColor: string;
  /** 文件夹图标色 - Archive 文件夹 */
  folderIconColor: string;
  /** 文件图标色 - Archive 文件 */
  fileIconColor: string;
  /** 展开指示器色 - Archive 展开/折叠 */
  expandIndicatorColor: string;
  /** 字体系列 */
  fontFamily: string;
  /** 圆角大小 */
  borderRadius: string;
  /** 阴影 */
  shadow: string;
  /** 过渡动画时长（毫秒） */
  transitionDuration: number;
}

/**
 * 默认 Office 主题颜色（浅色）
 */
export const DEFAULT_OFFICE_THEME_COLORS: OfficeThemeColors = {
  primaryColor: '#0066cc',
  secondaryColor: '#6b7280',
  successColor: '#10b981',
  warningColor: '#f59e0b',
  errorColor: '#ef4444',
  infoColor: '#3b82f6',
  backgroundColor: '#ffffff',
  foregroundColor: '#0a0a0a',
  borderColor: '#d4d4d4',
  headerBackgroundColor: '#f3f4f6',
  headerTextColor: '#0a0a0a',
  cellBackgroundColor: '#ffffff',
  cellTextColor: '#0a0a0a',
  hoverBackgroundColor: '#e0f2fe',
  hoverTextColor: '#0a0a0a',
  selectedBackgroundColor: '#0066cc',
  selectedTextColor: '#ffffff',
  gridLineColor: '#e5e7eb',
  toolbarBackgroundColor: '#ffffff',
  toolbarBorderColor: '#d4d4d4',
  scrollbarTrackColor: '#f3f4f6',
  scrollbarThumbColor: 'rgba(107, 114, 128, 0.3)',
  folderIconColor: '#0066cc',
  fileIconColor: '#6b7280',
  expandIndicatorColor: '#6b7280',
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  borderRadius: '6px',
  shadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  transitionDuration: 200,
};

/**
 * Office 深色主题颜色
 */
export const DARK_OFFICE_THEME_COLORS: OfficeThemeColors = {
  ...DEFAULT_OFFICE_THEME_COLORS,
  primaryColor: '#3b82f6',
  secondaryColor: '#9ca3af',
  successColor: '#22c55e',
  warningColor: '#fbbf24',
  errorColor: '#f87171',
  infoColor: '#60a5fa',
  backgroundColor: '#1f2937',
  foregroundColor: '#f3f4f6',
  borderColor: '#374151',
  headerBackgroundColor: '#374151',
  headerTextColor: '#f3f4f6',
  cellBackgroundColor: '#1f2937',
  cellTextColor: '#f3f4f6',
  hoverBackgroundColor: '#374151',
  hoverTextColor: '#f3f4f6',
  selectedBackgroundColor: '#3b82f6',
  selectedTextColor: '#ffffff',
  gridLineColor: '#4b5563',
  toolbarBackgroundColor: '#1f2937',
  toolbarBorderColor: '#374151',
  scrollbarTrackColor: '#374151',
  scrollbarThumbColor: 'rgba(156, 163, 175, 0.3)',
  folderIconColor: '#3b82f6',
  fileIconColor: '#9ca3af',
  expandIndicatorColor: '#9ca3af',
  shadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
};

/**
 * Office 主题配置
 */
export interface OfficeThemeConfig {
  /** 默认主题模式 */
  defaultMode: OfficeThemeMode;
  /** 是否启用过渡动画 */
  transitions: boolean;
  /** 过渡动画持续时间（毫秒） */
  transitionDuration: number;
  /** 是否启用响应式 */
  responsive: boolean;
  /** 自定义 CSS 变量前缀 */
  cssVariablePrefix: string;
  /** 是否自动提取文档主题 */
  autoExtract: boolean;
  /** 是否启用持久化 */
  persistence: boolean;
}

/**
 * 默认 Office 主题配置
 */
export const DEFAULT_OFFICE_THEME_CONFIG: OfficeThemeConfig = {
  defaultMode: 'light',
  transitions: true,
  transitionDuration: 200,
  responsive: true,
  cssVariablePrefix: '--office-',
  autoExtract: true,
  persistence: true,
};

/**
 * Office CSS 变量映射
 * 
 * 将 Office 主题颜色映射到 CSS 变量名
 */
export interface OfficeCSSVariableMapping {
  [colorKey: string]: string;
}

/**
 * 默认 CSS 变量映射
 */
export const DEFAULT_CSS_VARIABLE_MAPPING: OfficeCSSVariableMapping = {
  primaryColor: '--office-primary-color',
  secondaryColor: '--office-secondary-color',
  successColor: '--office-success-color',
  warningColor: '--office-warning-color',
  errorColor: '--office-error-color',
  infoColor: '--office-info-color',
  backgroundColor: '--office-bg',
  foregroundColor: '--office-text',
  borderColor: '--office-border',
  headerBackgroundColor: '--office-header-bg',
  headerTextColor: '--office-header-text',
  cellBackgroundColor: '--office-cell-bg',
  cellTextColor: '--office-cell-text',
  hoverBackgroundColor: '--office-hover-bg',
  hoverTextColor: '--office-hover-text',
  selectedBackgroundColor: '--office-selected-bg',
  selectedTextColor: '--office-selected-text',
  gridLineColor: '--office-grid-line',
  toolbarBackgroundColor: '--office-toolbar-bg',
  toolbarBorderColor: '--office-toolbar-border',
  scrollbarTrackColor: '--office-scrollbar-track',
  scrollbarThumbColor: '--office-scrollbar-thumb',
  folderIconColor: '--office-folder-color',
  fileIconColor: '--office-file-color',
  expandIndicatorColor: '--office-expand-color',
  fontFamily: '--office-font-family',
  borderRadius: '--office-border-radius',
  shadow: '--office-shadow',
  transitionDuration: '--office-transition',
};

/**
 * Office 变量更新选项
 */
export interface OfficeVariableUpdateOptions {
  /** 是否启用过渡动画 */
  transition?: boolean;
  /** 过渡持续时间（毫秒） */
  transitionDuration?: number;
  /** 是否立即应用 */
  immediate?: boolean;
  /** 是否触发回调 */
  triggerCallback?: boolean;
}

/**
 * Office 主题注入选项
 */
export interface OfficeThemeInjectOptions {
  /** 主题颜色 */
  colors?: Partial<OfficeThemeColors>;
  /** 主题模式 */
  mode?: OfficeThemeMode;
  /** 是否启用过渡动画 */
  transitions?: boolean;
  /** 过渡动画持续时间（毫秒） */
  transitionDuration?: number;
  /** CSS 变量前缀 */
  cssPrefix?: string;
  /** 是否覆盖现有变量 */
  override?: boolean;
}

/**
 * Office 主题提取结果
 */
export interface OfficeThemeExtractResult {
  /** 提取的颜色 */
  colors: Partial<OfficeThemeColors>;
  /** 提取来源 */
  source: 'computed' | 'inline' | 'class' | 'default';
  /** 提取的变量数量 */
  extractedCount: number;
  /** 是否成功 */
  success: boolean;
  /** 错误信息 */
  error?: string;
}

/**
 * Office 主题验证结果
 */
export interface OfficeThemeValidationResult {
  /** 是否有效 */
  valid: boolean;
  /** 错误信息 */
  errors: string[];
  /** 警告信息 */
  warnings: string[];
}

/**
 * Office 主题切换结果
 */
export interface OfficeThemeSwitchResult {
  /** 切换前的主题 */
  previousTheme: OfficeThemeMode;
  /** 切换后的主题 */
  currentTheme: OfficeThemeMode;
  /** 是否成功切换 */
  success: boolean;
  /** 错误信息（如果失败） */
  error?: string;
}

/**
 * Office 主题导出选项
 */
export interface OfficeThemeExportOptions {
  /** 导出格式 */
  format: 'json' | 'css' | 'css-variables' | 'tailwind';
  /** 是否包含默认值 */
  includeDefaults?: boolean;
  /** CSS 变量前缀 */
  cssPrefix?: string;
  /** 是否压缩 */
  minify?: boolean;
}

/**
 * Office 主题导出结果
 */
export interface OfficeThemeExportResult {
  /** 导出内容 */
  content: string;
  /** 格式 */
  format: string;
  /** 大小（字节） */
  size: number;
  /** 变量数量 */
  variableCount: number;
}

/**
 * Office 主题持久化配置
 */
export interface OfficeThemePersistenceConfig {
  /** 存储键名 */
  storageKey: string;
  /** 是否启用持久化 */
  enabled: boolean;
  /** 持久化方式 */
  storage: 'localStorage' | 'sessionStorage' | 'cookie';
  /** 过期时间（毫秒） */
  expiration?: number;
}

/**
 * 默认持久化配置
 */
export const DEFAULT_PERSISTENCE_CONFIG: OfficeThemePersistenceConfig = {
  storageKey: 'folder-site-office-theme',
  enabled: true,
  storage: 'localStorage',
};

/**
 * Office 文档类型
 */
export type OfficeDocumentType = 'excel' | 'word' | 'pdf' | 'archive';

/**
 * Office 文档主题预设
 */
export interface OfficeThemePreset {
  /** 预设名称 */
  name: string;
  /** 预设描述 */
  description: string;
  /** 主题模式 */
  mode: OfficeThemeMode;
  /** 主题颜色 */
  colors: OfficeThemeColors;
  /** 适用文档类型 */
  documentTypes: OfficeDocumentType[];
}

/**
 * Office 主题事件类型
 */
export type OfficeThemeEventType =
  | 'themeChange'
  | 'colorChange'
  | 'modeChange'
  | 'variableUpdate'
  | 'themeReset'
  | 'themeLoad';

/**
 * Office 主题事件
 */
export interface OfficeThemeEvent {
  /** 事件类型 */
  type: OfficeThemeEventType;
  /** 事件数据 */
  data: {
    mode?: OfficeThemeMode;
    colors?: Partial<OfficeThemeColors>;
    variableName?: string;
    variableValue?: string;
    timestamp: number;
  };
}

/**
 * Office 主题事件监听器
 */
export type OfficeThemeEventListener = (event: OfficeThemeEvent) => void;

/**
 * 验证 Office 主题颜色
 * 
 * @param colors - 主题颜色
 * @returns 是否有效
 */
export function validateOfficeThemeColors(colors: Partial<OfficeThemeColors>): boolean {
  if (!colors || typeof colors !== 'object') {
    return false;
  }

  // 检查颜色格式（十六进制、rgb、hsl）
  const colorRegex = /^(#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})|rgb\([^)]+\)|hsl\([^)]+\)|rgba\([^)]+\)|hsla\([^)]+\))$/;

  for (const [key, value] of Object.entries(colors)) {
    if (key === 'transitionDuration') {
      // 过渡时间必须是数字
      if (typeof value !== 'number' || value < 0) {
        return false;
      }
    } else if (typeof value === 'string' && value !== '') {
      // 颜色必须是有效的颜色格式
      if (!colorRegex.test(value)) {
        return false;
      }
    }
  }

  return true;
}

/**
 * 合并 Office 主题颜色
 * 
 * @param baseColors - 基础颜色
 * @param overrideColors - 覆盖颜色
 * @returns 合并后的颜色
 */
export function mergeOfficeThemeColors(
  baseColors: OfficeThemeColors,
  overrideColors: Partial<OfficeThemeColors>
): OfficeThemeColors {
  return {
    ...baseColors,
    ...overrideColors,
  };
}

/**
 * 获取 Office 主题（根据模式）
 * 
 * @param mode - 主题模式
 * @returns 主题颜色
 */
export function getOfficeThemeByMode(mode: OfficeThemeMode): OfficeThemeColors {
  return mode === 'dark' ? DARK_OFFICE_THEME_COLORS : DEFAULT_OFFICE_THEME_COLORS;
}

/**
 * 获取有效的 Office 主题模式
 * 
 * @param mode - 主题模式
 * @returns 有效主题模式
 */
export function getEffectiveOfficeThemeMode(mode: OfficeThemeMode): OfficeThemeMode {
  if (['light', 'dark'].includes(mode)) {
    return mode;
  }
  return 'light';
}