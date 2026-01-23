/**
 * Code Highlighter using Shiki
 *
 * Provides syntax highlighting for 100+ programming languages
 * using the Shiki library with VS Code themes
 */

import {
  createHighlighter,
  type Highlighter as ShikiHighlighter,
  type BundledLanguage,
  type BundledTheme,
} from 'shiki';
import type {
  HighlighterOptions,
  CodeHighlightOptions,
  HighlightedCode,
  IHighlighter,
  HighlighterLanguage,
} from '../../types/highlighter.js';

/**
 * Default languages to load
 */
const DEFAULT_LANGUAGES: BundledLanguage[] = [
  'javascript',
  'typescript',
  'python',
  'java',
  'c',
  'cpp',
  'csharp',
  'go',
  'rust',
  'php',
  'ruby',
  'swift',
  'kotlin',
  'scala',
  'html',
  'css',
  'scss',
  'json',
  'yaml',
  'xml',
  'markdown',
  'sql',
  'bash',
  'shell',
  'powershell',
  'dockerfile',
  'graphql',
  'tsx',
  'jsx',
];

/**
 * Default themes to load
 */
const DEFAULT_THEMES: BundledTheme[] = [
  // GitHub Series (3)
  'github-dark',
  'github-dark-dimmed',
  'github-light',

  // Material Series (4)
  'material-theme',
  'material-theme-darker',
  'material-theme-ocean',
  'material-theme-palenight',

  // Catppuccin Series (4)
  'catppuccin-mocha',
  'catppuccin-macchiato',
  'catppuccin-frappe',
  'catppuccin-latte',

  // Classic Themes (8)
  'one-dark-pro',
  'dracula',
  'nord',
  'tokyo-night',
  'night-owl',
  'monokai',
  'solarized-dark',
  'solarized-light',

  // Modern Themes (8)
  'one-light',
  'min-light',
  'rose-pine',
  'rose-pine-moon',
  'rose-pine-dawn',
  'ayu-dark',
  'everforest-dark',
  'vitesse-dark',
];

/**
 * Highlighter class
 */
export class Highlighter implements IHighlighter {
  private shiki: ShikiHighlighter | null = null;
  private initPromise: Promise<void> | null = null;
  private loadedLanguages: Set<string> = new Set();
  private loadedThemes: Set<string> = new Set();

  constructor(private options: HighlighterOptions = {}) {}

  /**
   * Initialize the highlighter
   */
  private async init(): Promise<void> {
    if (this.shiki) {
      return;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      try {
        const langs = this.options.loadAllLangs
          ? undefined
          : this.options.langs || DEFAULT_LANGUAGES;

        this.shiki = await createHighlighter({
          themes: DEFAULT_THEMES,
          langs: langs as BundledLanguage[],
        });

        // Track loaded languages and themes
        if (langs) {
          langs.forEach((lang) => this.loadedLanguages.add(lang));
        }
        DEFAULT_THEMES.forEach((theme) => this.loadedThemes.add(theme));
      } catch (error) {
        console.error('Failed to initialize highlighter:', error);
        throw error;
      }
    })();

    return this.initPromise;
  }

  /**
   * Ensure highlighter is initialized
   */
  private async ensureInitialized(): Promise<ShikiHighlighter> {
    await this.init();
    if (!this.shiki) {
      throw new Error('Highlighter failed to initialize');
    }
    return this.shiki;
  }

  /**
   * Normalize language name
   */
  private normalizeLanguage(lang: string): BundledLanguage {
    const normalized = lang.toLowerCase().trim();

    // Handle common aliases
    const aliases: Record<string, BundledLanguage> = {
      js: 'javascript',
      ts: 'typescript',
      py: 'python',
      rb: 'ruby',
      sh: 'bash',
      yml: 'yaml',
      md: 'markdown',
      cs: 'csharp',
      'c++': 'cpp',
      'c#': 'csharp',
      dockerfile: 'dockerfile',
      text: 'plaintext',
    };

    return (aliases[normalized] as BundledLanguage) || (normalized as BundledLanguage);
  }

  /**
   * Normalize theme name
   */
  private normalizeTheme(theme?: string): BundledTheme {
    if (!theme || theme === 'auto') {
      // Default to github-dark
      return 'github-dark';
    }
    
    // Handle theme aliases
    const themeAliases: Record<string, BundledTheme> = {
      github: 'github-dark',
      'github-dark': 'github-dark',
      'github-light': 'github-light',
      light: 'github-light',
      dark: 'github-dark',
    };
    
    const normalized = theme.toLowerCase();
    return (themeAliases[normalized] as BundledTheme) || (normalized as BundledTheme);
  }

  /**
   * Highlight code to HTML
   */
  async codeToHtml(code: string, options: CodeHighlightOptions): Promise<string> {
    const highlighter = await this.ensureInitialized();
    const lang = this.normalizeLanguage(options.lang);
    const theme = this.normalizeTheme(options.theme);

    try {
      // Load language if not already loaded
      if (!this.loadedLanguages.has(lang)) {
        await this.loadLanguages([lang]);
      }

      const html = highlighter.codeToHtml(code, {
        lang,
        theme,
      });

      return html;
    } catch (error) {
      console.error(`Failed to highlight code (lang: ${lang}):`, error);
      // Fallback to plaintext
      return highlighter.codeToHtml(code, {
        lang: 'plaintext',
        theme,
      });
    }
  }

  /**
   * Highlight code and return detailed result
   */
  async highlight(code: string, options: CodeHighlightOptions): Promise<HighlightedCode> {
    const lang = this.normalizeLanguage(options.lang);
    const theme = this.normalizeTheme(options.theme);
    const html = await this.codeToHtml(code, options);
    const lineCount = code.split('\n').length;

    return {
      html,
      language: lang,
      theme,
      lineCount,
    };
  }

  /**
   * Get list of loaded languages
   */
  getLoadedLanguages(): string[] {
    return Array.from(this.loadedLanguages);
  }

  /**
   * Get list of loaded themes
   */
  getLoadedThemes(): string[] {
    return Array.from(this.loadedThemes);
  }

  /**
   * Load additional languages
   */
  async loadLanguages(langs: HighlighterLanguage[]): Promise<void> {
    const highlighter = await this.ensureInitialized();

    const langsToLoad = langs
      .map((lang) => this.normalizeLanguage(lang))
      .filter((lang) => !this.loadedLanguages.has(lang));

    if (langsToLoad.length === 0) {
      return;
    }

    try {
      await highlighter.loadLanguage(...(langsToLoad as BundledLanguage[]));
      langsToLoad.forEach((lang) => this.loadedLanguages.add(lang));
    } catch (error) {
      console.error('Failed to load languages:', langsToLoad, error);
    }
  }

  /**
   * Check if a language is supported
   */
  isLanguageSupported(lang: string): boolean {
    const normalized = this.normalizeLanguage(lang);
    return this.loadedLanguages.has(normalized);
  }
}

/**
 * Singleton instance
 */
let highlighterInstance: Highlighter | null = null;

/**
 * Get or create the highlighter instance
 */
export function getHighlighter(options?: HighlighterOptions): Highlighter {
  if (!highlighterInstance) {
    highlighterInstance = new Highlighter(options);
  }
  return highlighterInstance;
}

/**
 * Reset the highlighter instance (useful for testing)
 */
export function resetHighlighter(): void {
  highlighterInstance = null;
}

/**
 * Convenience function to highlight code
 */
export async function highlightCode(
  code: string,
  options: CodeHighlightOptions
): Promise<string> {
  const highlighter = getHighlighter();
  return highlighter.codeToHtml(code, options);
}
