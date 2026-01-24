/**
 * Folder-Site 配置文件类型定义
 */

/**
 * 站点配置
 */
export interface SiteConfig {
  /** 站点标题 */
  title: string;
  /** 站点描述 */
  description?: string;
  /** 站点 URL */
  url?: string;
  /** 站点图标 */
  favicon?: string;
  /** 站点 Logo */
  logo?: string;
  /** 站点语言 */
  language?: string;
  /** 站点作者 */
  author?: string;
  /** 主题配置 */
  theme?: ThemeConfig;
  /** 导航配置 */
  navigation?: NavigationConfig;
  /** 搜索配置 */
  search?: SearchConfig;
  /** 导出配置 */
  export?: ExportConfig;
  /** 是否显示 GitHub 按钮 */
  showGitHubLink?: boolean;
}

/**
 * 主题配置
 */
export interface ThemeConfig {
  /** 主题模式 */
  mode?: 'light' | 'dark' | 'auto';
  /** Markdown 主题模式 */
  markdownTheme?: 'light' | 'dark' | 'auto';
  /** 主题颜色 */
  primaryColor?: string;
  /** 主题字体 */
  fontFamily?: string;
  /** 自定义 CSS */
  customCss?: string[];
}

/**
 * 导航配置
 */
export interface NavigationConfig {
  /** 侧边栏分组 */
  groups?: NavGroup[];
  /** 是否显示侧边栏 */
  showSidebar?: boolean;
  /** 默认展开的分组 */
  expandedGroups?: string[];
}

/**
 * 导航分组
 */
export interface NavGroup {
  /** 分组标题 */
  title: string;
  /** 分组项 */
  items: NavItem[];
  /** 是否折叠 */
  collapsed?: boolean;
}

/**
 * 导航项
 */
export interface NavItem {
  /** 显示标题 */
  title: string;
  /** 文件路径或 URL */
  path: string;
  /** 图标 */
  icon?: string;
  /** 外部链接 */
  external?: boolean;
  /** 子项 */
  items?: NavItem[];
}

/**
 * 搜索配置
 */
export interface SearchConfig {
  /** 是否启用搜索 */
  enabled?: boolean;
  /** 搜索索引路径 */
  indexPath?: string;
  /** 搜索快捷键 */
  hotkey?: string;
  /** 搜索选项 */
  options?: SearchOptions;
}

/**
 * 搜索选项
 */
export interface SearchOptions {
  /** 最小搜索字符数 */
  minMatchCharLength?: number;
  /** 是否区分大小写 */
  caseSensitive?: boolean;
  /** 是否包含标题 */
  includeTitle?: boolean;
  /** 是否包含内容 */
  includeContent?: boolean;
  /** 搜索结果数量限制 */
  limit?: number;
}

/**
 * 导出配置
 */
export interface ExportConfig {
  /** PDF 导出配置 */
  pdf?: PdfExportConfig;
  /** HTML 导出配置 */
  html?: HtmlExportConfig;
}

/**
 * PDF 导出配置
 */
export interface PdfExportConfig {
  /** 是否启用 PDF 导出 */
  enabled?: boolean;
  /** 页面格式 */
  format?: 'a4' | 'letter';
  /** 页边距 */
  margin?: number;
  /** 是否包含目录 */
  includeToc?: boolean;
  /** 文件名 */
  filename?: string;
}

/**
 * HTML 导出配置
 */
export interface HtmlExportConfig {
  /** 是否启用 HTML 导出 */
  enabled?: boolean;
  /** 是否内联 CSS */
  inlineCss?: boolean;
  /** 是否内联图片 */
  inlineImages?: boolean;
  /** 文件名 */
  filename?: string;
}

/**
 * 配置文件类型
 */
export type ConfigFile = {
  /** 配置版本 */
  version?: string;
  /** 站点配置 */
  site?: SiteConfig;
  /** 构建配置 */
  build?: BuildConfig;
};

/**
 * 构建配置
 */
export interface BuildConfig {
  /** 输出目录 */
  outDir?: string;
  /** 源目录 */
  srcDir?: string;
  /** 公共资源目录 */
  publicDir?: string;
  /** 是否生成 source map */
  sourceMap?: boolean;
  /** 是否压缩 */
  minify?: boolean;
  /** 环境变量 */
  env?: Record<string, string>;
  /** 白名单模式：只显示指定的文件夹和文件（glob 模式） */
  whitelist?: string[];
}