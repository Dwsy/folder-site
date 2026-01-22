/**
 * HTML Export Types
 * 
 * Type definitions for HTML export functionality
 */

import type { ThemeMode, ThemePalette } from './theme.js';

/**
 * HTML export options
 */
export interface HTMLExportOptions {
  /** Document title */
  title?: string;
  /** Document language attribute */
  lang?: string;
  /** Theme mode for styling */
  theme?: ThemeMode;
  /** Custom theme palette */
  themePalette?: ThemePalette;
  /** Include table of contents */
  includeTOC?: boolean;
  /** Include syntax highlighting styles */
  includeCodeStyles?: boolean;
  /** Include theme styles */
  includeThemeStyles?: boolean;
  /** CSS to include in addition to defaults */
  additionalCSS?: string;
  /** Template HTML to wrap content */
  template?: string;
  /** Character encoding (default: 'utf-8') */
  encoding?: string;
  /** Enable MathJax/KaTeX rendering */
  enableMath?: boolean;
  /** Enable GFM features */
  enableGfm?: boolean;
  /** Include line numbers for code blocks */
  includeLineNumbers?: boolean;
  /** Maximum heading depth for TOC (default: 3) */
  tocMaxDepth?: number;
  /** Custom CSS class prefix */
  cssPrefix?: string;
  /** Include inline styles instead of CSS classes */
  inlineStyles?: boolean;
  /** Minify output HTML */
  minify?: boolean;
  /** Add download attribute to anchor tags */
  enableDownloadLinks?: boolean;
  /** Base URL for relative links */
  baseURL?: string;
}

/**
 * Default HTML export options
 */
export const DEFAULT_HTML_EXPORT_OPTIONS: Required<Omit<HTMLExportOptions, 'title' | 'lang' | 'themePalette' | 'additionalCSS' | 'template' | 'baseURL'>> = {
  theme: 'light',
  includeTOC: false,
  includeCodeStyles: true,
  includeThemeStyles: true,
  encoding: 'utf-8',
  enableMath: true,
  enableGfm: true,
  includeLineNumbers: false,
  tocMaxDepth: 3,
  cssPrefix: 'fs-',
  inlineStyles: false,
  minify: false,
  enableDownloadLinks: false,
};

/**
 * HTML export result
 */
export interface HTMLExportResult {
  /** Success status */
  success: boolean;
  /** HTML content (if successful) */
  content?: string;
  /** HTML blob URL (if successful) */
  url?: string;
  /** File size in bytes */
  size?: number;
  /** Error message (if failed) */
  error?: string;
  /** Export duration in milliseconds */
  duration?: number;
}

/**
 * HTML export state
 */
export type HTMLExportState = 'idle' | 'preparing' | 'rendering' | 'generating' | 'complete' | 'error';

/**
 * HTML export progress
 */
export interface HTMLExportProgress {
  /** Current state */
  state: HTMLExportState;
  /** Progress percentage (0-100) */
  progress: number;
  /** Current step description */
  message?: string;
  /** Error (if any) */
  error?: Error;
}

/**
 * HTML content element types
 */
export type HTMLContentElementType = 
  | 'heading'
  | 'paragraph'
  | 'code'
  | 'list'
  | 'table'
  | 'image'
  | 'blockquote'
  | 'hr'
  | 'link'
  | 'math'
  | 'details'
  | 'inline-code';

/**
 * HTML content element
 */
export interface HTMLContentElement {
  /** Element type */
  type: HTMLContentElementType;
  /** Element content */
  content: string;
  /** Element level (for headings) */
  level?: number;
  /** Element language (for code blocks) */
  language?: string;
  /** Element attributes */
  attributes?: Record<string, string>;
  /** Child elements */
  children?: HTMLContentElement[];
  /** Element source position */
  position?: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
}

/**
 * HTML document structure
 */
export interface HTMLDocumentStructure {
  /** Document title */
  title?: string;
  /** Document language */
  lang?: string;
  /** Document metadata */
  metadata?: {
    author?: string;
    description?: string;
    keywords?: string[];
    creationDate?: Date;
    modifiedDate?: Date;
  };
  /** Table of contents */
  toc?: HTMLTOCEntry[];
  /** Content elements */
  content: HTMLContentElement[];
  /** Custom head content */
  headContent?: string;
  /** Custom body content */
  bodyContent?: string;
}

/**
 * HTML table of contents entry
 */
export interface HTMLTOCEntry {
  /** Entry title */
  title: string;
  /** Entry level (heading level) */
  level: number;
  /** Entry slug/id */
  id: string;
  /** Child entries */
  children?: HTMLTOCEntry[];
}

/**
 * HTML style configuration
 */
export interface HTMLStyleConfig {
  /** Theme palette */
  themePalette: ThemePalette;
  /** Theme mode */
  themeMode: ThemeMode;
  /** CSS prefix */
  cssPrefix: string;
  /** Code styles */
  codeStyles: {
    backgroundColor: string;
    textColor: string;
    fontFamily: string;
    fontSize: string;
    padding: string;
    borderRadius: string;
  };
  /** Heading styles */
  headingStyles: {
    h1: { fontSize: string; color: string; margin: string };
    h2: { fontSize: string; color: string; margin: string };
    h3: { fontSize: string; color: string; margin: string };
    h4: { fontSize: string; color: string; margin: string };
    h5: { fontSize: string; color: string; margin: string };
    h6: { fontSize: string; color: string; margin: string };
  };
  /** Body styles */
  bodyStyles: {
    fontFamily: string;
    fontSize: string;
    lineHeight: string;
    color: string;
    backgroundColor: string;
    margin: string;
    padding: string;
  };
  /** Table styles */
  tableStyles: {
    borderCollapse: string;
    width: string;
    margin: string;
  };
  /** List styles */
  listStyles: {
    paddingLeft: string;
  };
  /** Blockquote styles */
  blockquoteStyles: {
    borderLeft: string;
    paddingLeft: string;
    color: string;
    fontStyle: string;
  };
  /** Link styles */
  linkStyles: {
    color: string;
    textDecoration: string;
  };
}

/**
 * HTML template data
 */
export interface HTMLTemplateData {
  /** Document title */
  title: string;
  /** Document language */
  lang: string;
  /** Head content */
  head: string;
  /** Body content */
  body: string;
  /** Theme CSS */
  themeCSS: string;
  /** Custom CSS */
  customCSS: string;
  /** Metadata */
  metadata: Record<string, string>;
}

/**
 * HTML export error
 */
export interface HTMLExportError {
  /** Error code */
  code: string;
  /** Error message */
  message: string;
  /** Original error */
  originalError?: Error;
  /** Timestamp */
  timestamp: number;
}

/**
 * HTML export statistics
 */
export interface HTMLExportStatistics {
  /** Total elements */
  totalElements: number;
  /** Element counts by type */
  elementCounts: Record<HTMLContentElementType, number>;
  /** TOC entries count */
  tocEntriesCount: number;
  /** File size in bytes */
  fileSize: number;
  /** Content length */
  contentLength: number;
  /** Export duration in milliseconds */
  duration: number;
  /** Timestamp */
  timestamp: number;
}

/**
 * Validate HTML export options
 */
export function validateHTMLExportOptions(
  options: Partial<HTMLExportOptions>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate theme mode
  if (options.theme && !['light', 'dark', 'auto'].includes(options.theme)) {
    errors.push(`Invalid theme mode: ${options.theme}. Must be one of: light, dark, auto`);
  }

  // Validate encoding
  if (options.encoding && typeof options.encoding !== 'string') {
    errors.push('Invalid encoding. Must be a string');
  }

  // Validate toc max depth
  if (options.tocMaxDepth !== undefined && (options.tocMaxDepth < 1 || options.tocMaxDepth > 6)) {
    errors.push(`Invalid tocMaxDepth: ${options.tocMaxDepth}. Must be between 1 and 6`);
  }

  // Validate CSS prefix
  if (options.cssPrefix !== undefined && !/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(options.cssPrefix)) {
    errors.push(`Invalid CSS prefix: ${options.cssPrefix}. Must start with a letter and contain only alphanumeric characters, hyphens, and underscores`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Create default HTML style configuration
 */
export function createDefaultHTMLStyleConfig(
  themeMode: ThemeMode,
  themePalette?: ThemePalette
): HTMLStyleConfig {
  const palette = themePalette || (themeMode === 'dark' ? {
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
  } : {
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
  });

  return {
    themePalette: palette,
    themeMode,
    cssPrefix: 'fs-',
    codeStyles: {
      backgroundColor: palette.muted,
      textColor: palette.text,
      fontFamily: 'monospace',
      fontSize: '14px',
      padding: '1rem',
      borderRadius: '4px',
    },
    headingStyles: {
      h1: { fontSize: '2em', color: palette.primary, margin: '1em 0 0.5em' },
      h2: { fontSize: '1.5em', color: palette.primary, margin: '1em 0 0.5em' },
      h3: { fontSize: '1.25em', color: palette.text, margin: '1em 0 0.5em' },
      h4: { fontSize: '1.1em', color: palette.text, margin: '1em 0 0.5em' },
      h5: { fontSize: '1em', color: palette.text, margin: '1em 0 0.5em' },
      h6: { fontSize: '0.875em', color: palette.text, margin: '1em 0 0.5em' },
    },
    bodyStyles: {
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: '16px',
      lineHeight: '1.6',
      color: palette.text,
      backgroundColor: palette.background,
      margin: '0',
      padding: '2rem',
    },
    tableStyles: {
      borderCollapse: 'collapse',
      width: '100%',
      margin: '1em 0',
    },
    listStyles: {
      paddingLeft: '2rem',
    },
    blockquoteStyles: {
      borderLeft: `4px solid ${palette.primary}`,
      paddingLeft: '1rem',
      color: palette.secondary,
      fontStyle: 'italic',
    },
    linkStyles: {
      color: palette.primary,
      textDecoration: 'none',
    },
  };
}

/**
 * Generate heading ID from text
 */
export function generateHeadingId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .trim();
}

/**
 * Sanitize HTML content
 */
export function sanitizeHTML(content: string): string {
  return content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Escape HTML entities
 */
export function escapeHTML(text: string): string {
  return sanitizeHTML(text);
}

/**
 * Minify HTML content
 */
export function minifyHTML(html: string): string {
  return html
    .replace(/\s+/g, ' ')
    .replace(/>\s+</g, '><')
    .replace(/\s*\/>/g, '/>')
    .trim();
}
