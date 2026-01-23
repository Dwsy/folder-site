/**
 * Office 文档主题注入器
 *
 * 负责从 Office 文档样式中提取主题色并注入为 CSS 变量
 * 支持动态更新和主题切换
 */

import type {
  OfficeThemeColors,
  OfficeThemeMode,
  OfficeThemeConfig,
  OfficeThemeInjectOptions,
} from '../../types/officeTheme.js';

/**
 * CSS 变量映射
 */
const CSS_VARIABLE_MAPPING: Record<keyof OfficeThemeColors, string> = {
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
 * 注入 Office 主题变量到容器
 *
 * @param container - 目标容器元素
 * @param options - 注入选项
 *
 * @example
 * ```tsx
 * const container = document.querySelector('.office-document');
 * injectOfficeThemeVariables(container, {
 *   colors: { primaryColor: '#ff0000' },
 *   mode: 'dark',
 * });
 * ```
 */
export function injectOfficeThemeVariables(
  container: HTMLElement,
  options: OfficeThemeInjectOptions = {}
): void {
  const {
    colors = {},
    mode = 'light',
    transitions = true,
    transitionDuration = 200,
    cssPrefix = '--office-',
    override = true,
  } = options;

  // 设置过渡动画
  if (transitions) {
    container.style.setProperty('--office-transition', `${String(transitionDuration)}ms`);
  }

  // 注入颜色变量
  for (const [colorKey, cssVarName] of Object.entries(CSS_VARIABLE_MAPPING)) {
    const value = colors[colorKey as keyof OfficeThemeColors];

    if (value !== undefined) {
      // 特殊处理 transitionDuration（number 类型）
      const valueToSet = typeof value === 'number' ? `${value}ms` : value;
      container.style.setProperty(cssVarName, valueToSet);
    } else if (override) {
      // 如果没有提供颜色值且设置了 override，则清除变量
      container.style.removeProperty(cssVarName);
    }
  }

  // 设置主题模式类
  container.classList.remove('theme-light', 'theme-dark');
  container.classList.add(`theme-${mode}`);
  container.setAttribute('data-office-theme', mode);
}

/**
 * 清除 Office 主题变量
 *
 * @param container - 目标容器元素
 *
 * @example
 * ```tsx
 * const container = document.querySelector('.office-document');
 * clearOfficeThemeVariables(container);
 * ```
 */
export function clearOfficeThemeVariables(container: HTMLElement): void {
  // 清除所有 CSS 变量
  for (const cssVarName of Object.values(CSS_VARIABLE_MAPPING)) {
    container.style.removeProperty(cssVarName);
  }

  // 移除主题类
  container.classList.remove('theme-light', 'theme-dark');
  container.removeAttribute('data-office-theme');
}

/**
 * 获取 Office 主题变量值
 *
 * @param container - 目标容器元素
 * @returns CSS 变量值映射
 *
 * @example
 * ```tsx
 * const container = document.querySelector('.office-document');
 * const variables = getOfficeThemeVariables(container);
 * console.log(variables['--office-primary-color']);
 * ```
 */
export function getOfficeThemeVariables(
  container: HTMLElement
): Record<string, string> {
  const variables: Record<string, string> = {};

  for (const cssVarName of Object.values(CSS_VARIABLE_MAPPING)) {
    const value = container.style.getPropertyValue(cssVarName);
    if (value) {
      variables[cssVarName] = value;
    }
  }

  return variables;
}

/**
 * 验证 CSS 变量名
 *
 * @param variableName - CSS 变量名
 * @returns 是否为有效的 Office CSS 变量
 */
export function isValidOfficeCSSVariable(variableName: string): boolean {
  return Object.values(CSS_VARIABLE_MAPPING).includes(variableName);
}

/**
 * 颜色转换工具 - RGB 转 HEX
 *
 * @param rgb - RGB 颜色字符串
 * @returns HEX 颜色字符串
 */
function rgbToHex(rgb: string): string {
  // 处理 rgb(r, g, b) 格式
  const rgbMatch = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  if (rgbMatch) {
    const [, r, g, b] = rgbMatch;
    return `#${parseInt(r).toString(16).padStart(2, '0')}${parseInt(g).toString(16).padStart(2, '0')}${parseInt(b).toString(16).padStart(2, '0')}`;
  }

  // 处理 rgba(r, g, b, a) 格式
  const rgbaMatch = rgb.match(/^rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)$/);
  if (rgbaMatch) {
    const [, r, g, b] = rgbaMatch;
    return `#${parseInt(r).toString(16).padStart(2, '0')}${parseInt(g).toString(16).padStart(2, '0')}${parseInt(b).toString(16).padStart(2, '0')}`;
  }

  return rgb;
}

/**
 * 从元素提取颜色值
 *
 * @param element - 目标元素
 * @param property - CSS 属性名
 * @returns 颜色值
 */
function extractColorValue(element: Element, property: string): string | null {
  const computedStyle = window.getComputedStyle(element);
  const value = computedStyle.getPropertyValue(property);

  if (!value || value === 'rgba(0, 0, 0, 0)' || value === 'transparent') {
    return null;
  }

  return rgbToHex(value);
}

/**
 * 从 Office 文档提取主题颜色
 *
 * @param document - Office 文档元素
 * @returns 提取的主题颜色
 *
 * @example
 * ```tsx
 * const excelWorkbook = document.querySelector('.excel-workbook');
 * const colors = extractOfficeThemeColors(excelWorkbook);
 * console.log(colors.primaryColor);
 * ```
 */
export function extractOfficeThemeColors(
  document: Document | Element
): Partial<OfficeThemeColors> {
  const colors: Partial<OfficeThemeColors> = {};

  const root = document instanceof Document ? document.documentElement : document;

  // 尝试从常见的选择器中提取颜色
  const selectors = [
    // Excel 选择器
    '.excel-table th',
    '.excel-header',
    '.excel-tab.active',
    // Word 选择器
    '.word-header',
    '.word-title',
    // PDF 选择器
    '.pdf-toolbar',
    // Archive 选择器
    '.archive-item[data-type="folder"]',
  ];

  for (const selector of selectors) {
    const element = root.querySelector(selector);
    if (element) {
      // 提取背景色
      const bgColor = extractColorValue(element, 'background-color');
      if (bgColor) {
        if (!colors.headerBackgroundColor) {
          colors.headerBackgroundColor = bgColor;
        }
      }

      // 提取文字颜色
      const textColor = extractColorValue(element, 'color');
      if (textColor) {
        if (!colors.headerTextColor) {
          colors.headerTextColor = textColor;
        }
        if (!colors.primaryColor) {
          colors.primaryColor = textColor;
        }
      }
    }
  }

  // 提取边框颜色
  const borderSelectors = ['.excel-table td', '.excel-table th'];
  for (const selector of borderSelectors) {
    const element = root.querySelector(selector);
    if (element) {
      const borderColor = extractColorValue(element, 'border-color');
      if (borderColor && !colors.borderColor) {
        colors.borderColor = borderColor;
        colors.gridLineColor = borderColor;
        break;
      }
    }
  }

  // 提取背景色
  const bgSelectors = ['.excel-workbook', '.excel-sheet', '.office-document', '.pdf-viewer'];
  for (const selector of bgSelectors) {
    const element = root.querySelector(selector);
    if (element) {
      const bgColor = extractColorValue(element, 'background-color');
      if (bgColor && !colors.backgroundColor) {
        colors.backgroundColor = bgColor;
        break;
      }
    }
  }

  // 提取文字颜色
  const textSelectors = ['.excel-table td', '.office-document'];
  for (const selector of textSelectors) {
    const element = root.querySelector(selector);
    if (element) {
      const textColor = extractColorValue(element, 'color');
      if (textColor && !colors.foregroundColor) {
        colors.foregroundColor = textColor;
        break;
      }
    }
  }

  return colors;
}

/**
 * 批量更新 CSS 变量
 *
 * @param container - 目标容器元素
 * @param variables - CSS 变量映射
 * @param options - 更新选项
 *
 * @example
 * ```tsx
 * const container = document.querySelector('.office-document');
 * updateCSSVariables(container, {
 *   '--office-primary-color': '#ff0000',
 *   '--office-bg': '#000000',
 * });
 * ```
 */
export function updateCSSVariables(
  container: HTMLElement,
  variables: Record<string, string>,
  options: { transition?: boolean; transitionDuration?: number } = {}
): void {
  const { transition = true, transitionDuration = 200 } = options;

  if (transition) {
    container.style.setProperty('--office-transition', `${transitionDuration}ms`);
  }

  for (const [variableName, value] of Object.entries(variables)) {
    container.style.setProperty(variableName, value);
  }
}

/**
 * 获取 CSS 变量值
 *
 * @param container - 目标容器元素
 * @param variableName - CSS 变量名
 * @returns 变量值
 *
 * @example
 * ```tsx
 * const container = document.querySelector('.office-document');
 * const primaryColor = getCSSVariableValue(container, '--office-primary-color');
 * ```
 */
export function getCSSVariableValue(
  container: HTMLElement,
  variableName: string
): string | null {
  return container.style.getPropertyValue(variableName) || null;
}

/**
 * 设置 CSS 变量值
 *
 * @param container - 目标容器元素
 * @param variableName - CSS 变量名
 * @param value - 变量值
 *
 * @example
 * ```tsx
 * const container = document.querySelector('.office-document');
 * setCSSVariableValue(container, '--office-primary-color', '#ff0000');
 * ```
 */
export function setCSSVariableValue(
  container: HTMLElement,
  variableName: string,
  value: string
): void {
  container.style.setProperty(variableName, value);
}

/**
 * 删除 CSS 变量
 *
 * @param container - 目标容器元素
 * @param variableName - CSS 变量名
 *
 * @example
 * ```tsx
 * const container = document.querySelector('.office-document');
 * removeCSSVariable(container, '--office-primary-color');
 * ```
 */
export function removeCSSVariable(
  container: HTMLElement,
  variableName: string
): void {
  container.style.removeProperty(variableName);
}

/**
 * 获取所有 Office CSS 变量名
 *
 * @returns CSS 变量名数组
 *
 * @example
 * ```tsx
 * const variableNames = getAllOfficeCSSVariableNames();
 * console.log(variableNames); // ['--office-primary-color', '--office-bg', ...]
 * ```
 */
export function getAllOfficeCSSVariableNames(): string[] {
  return Object.values(CSS_VARIABLE_MAPPING);
}

/**
 * 检查容器是否有 Office 主题变量
 *
 * @param container - 目标容器元素
 * @returns 是否有主题变量
 *
 * @example
 * ```tsx
 * const container = document.querySelector('.office-document');
 * const hasTheme = hasOfficeThemeVariables(container);
 * ```
 */
export function hasOfficeThemeVariables(container: HTMLElement): boolean {
  const variables = getOfficeThemeVariables(container);
  return Object.keys(variables).length > 0;
}

/**
 * 同步主题变量到子元素
 *
 * @param container - 父容器元素
 * @param selector - 子元素选择器
 *
 * @example
 * ```tsx
 * const container = document.querySelector('.office-document');
 * syncThemeVariablesToChildren(container, '.excel-table');
 * ```
 */
export function syncThemeVariablesToChildren(
  container: HTMLElement,
  selector: string = '*'
): void {
  const variables = getOfficeThemeVariables(container);
  const children = Array.from(container.querySelectorAll(selector));

  for (const child of children) {
    if (child instanceof HTMLElement) {
      for (const [variableName, value] of Object.entries(variables)) {
        child.style.setProperty(variableName, value);
      }
    }
  }
}

/**
 * 导出主题为 JSON
 *
 * @param container - 目标容器元素
 * @returns 主题 JSON 字符串
 *
 * @example
 * ```tsx
 * const container = document.querySelector('.office-document');
 * const themeJson = exportThemeAsJSON(container);
 * console.log(themeJson);
 * ```
 */
export function exportThemeAsJSON(container: HTMLElement): string {
  const variables = getOfficeThemeVariables(container);
  const themeClass = container.classList.contains('theme-dark') ? 'dark' : 'light';

  return JSON.stringify(
    {
      mode: themeClass,
      colors: variables,
    },
    null,
    2
  );
}

/**
 * 从 JSON 导入主题
 *
 * @param container - 目标容器元素
 * @param json - 主题 JSON 字符串
 *
 * @example
 * ```tsx
 * const container = document.querySelector('.office-document');
 * const themeJson = '{"mode":"dark","colors":{"--office-primary-color":"#ff0000"}}';
 * importThemeFromJSON(container, themeJson);
 * ```
 */
export function importThemeFromJSON(container: HTMLElement, json: string): void {
  try {
    const theme = JSON.parse(json);

    if (theme.mode) {
      container.classList.remove('theme-light', 'theme-dark');
      container.classList.add(`theme-${theme.mode}`);
    }

    if (theme.colors) {
      updateCSSVariables(container, theme.colors);
    }
  } catch (error) {
    console.error('Failed to import theme from JSON:', error);
  }
}