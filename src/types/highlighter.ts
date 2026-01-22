/**
 * Code Highlighter Types
 *
 * Type definitions for the Shiki-based syntax highlighter
 */

import type { BundledLanguage, BundledTheme } from 'shiki';

/**
 * Supported themes
 */
export type HighlighterTheme = BundledTheme | 'auto';

/**
 * Supported languages
 */
export type HighlighterLanguage = BundledLanguage | 'text' | 'plaintext';

/**
 * Highlighter options
 */
export interface HighlighterOptions {
  /**
   * Theme to use for highlighting
   * @default 'github-dark'
   */
  theme?: HighlighterTheme;

  /**
   * Languages to load
   * @default ['javascript', 'typescript', 'python', 'json', 'markdown']
   */
  langs?: HighlighterLanguage[];

  /**
   * Whether to load all languages
   * @default false
   */
  loadAllLangs?: boolean;
}

/**
 * Code highlighting options
 */
export interface CodeHighlightOptions {
  /**
   * Programming language
   */
  lang: HighlighterLanguage;

  /**
   * Theme to use
   * @default 'github-dark'
   */
  theme?: HighlighterTheme;

  /**
   * Whether to include line numbers in the output
   * @default false
   */
  lineNumbers?: boolean;

  /**
   * Starting line number
   * @default 1
   */
  startLineNumber?: number;

  /**
   * Lines to highlight (1-indexed)
   */
  highlightLines?: number[];

  /**
   * Custom CSS classes to add
   */
  className?: string;
}

/**
 * Highlighted code result
 */
export interface HighlightedCode {
  /**
   * HTML string with syntax highlighting
   */
  html: string;

  /**
   * Language used for highlighting
   */
  language: string;

  /**
   * Theme used for highlighting
   */
  theme: string;

  /**
   * Number of lines in the code
   */
  lineCount: number;
}

/**
 * Highlighter instance interface
 */
export interface IHighlighter {
  /**
   * Highlight code to HTML
   */
  codeToHtml(code: string, options: CodeHighlightOptions): Promise<string>;

  /**
   * Highlight code and return detailed result
   */
  highlight(code: string, options: CodeHighlightOptions): Promise<HighlightedCode>;

  /**
   * Get list of loaded languages
   */
  getLoadedLanguages(): string[];

  /**
   * Get list of loaded themes
   */
  getLoadedThemes(): string[];

  /**
   * Load additional languages
   */
  loadLanguages(langs: HighlighterLanguage[]): Promise<void>;

  /**
   * Check if a language is supported
   */
  isLanguageSupported(lang: string): boolean;
}
