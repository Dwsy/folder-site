/**
 * Markdown Theme Provider
 *
 * Provides Markdown CSS theme support with dynamic theming
 */

import { useEffect, useState } from 'react';
import type { ThemeMode } from '../../../types/theme.js';

interface MarkdownThemeProps {
  /** Current theme mode */
  theme: ThemeMode;
  /** Enable/disable markdown theming */
  enabled?: boolean;
}

type MarkdownStyleTheme = 'github' | 'vitesse' | 'nord' | 'dracula' | 'one-dark' | 'catppuccin';

/**
 * Get markdown theme from localStorage
 */
function getStoredMarkdownTheme(): MarkdownStyleTheme {
  if (typeof window === 'undefined') return 'github';

  try {
    const stored = localStorage.getItem('folder-site-markdown-theme-style');
    if (stored && ['github', 'vitesse', 'nord', 'dracula', 'one-dark', 'catppuccin'].includes(stored)) {
      return stored as MarkdownStyleTheme;
    }
  } catch (error) {
    console.warn('Failed to read markdown theme from localStorage:', error);
  }

  return 'github';
}

/**
 * Get theme CSS URL based on theme and light/dark mode
 */
function getThemeCssUrl(theme: MarkdownStyleTheme, isDark: boolean): string {
  switch (theme) {
    case 'github':
      return `/styles/github-markdown${isDark ? '-dark' : '-light'}.css`;
    case 'vitesse':
      return `/styles/vitesse${isDark ? '-dark' : '-light'}.css`;
    case 'nord':
      return `/styles/nord.css`;
    case 'dracula':
      return `/styles/dracula.css`;
    case 'one-dark':
      return `/styles/one-dark.css`;
    case 'catppuccin':
      return `/styles/catppuccin.css`;
    default:
      return `/styles/github-markdown${isDark ? '-dark' : '-light'}.css`;
  }
}

/**
 * Markdown Theme Component
 *
 * Dynamically loads Markdown CSS based on theme mode
 */
export function MarkdownTheme({ theme, enabled = true }: MarkdownThemeProps) {
  const [storedMarkdownTheme, setStoredMarkdownTheme] = useState<MarkdownStyleTheme>(() =>
    getStoredMarkdownTheme()
  );

  useEffect(() => {
    if (!enabled) return;

    const loadTheme = async () => {
      // Remove existing theme links
      const existingLinks = document.querySelectorAll('link[data-markdown-theme]');
      existingLinks.forEach(link => link.remove());

      // Determine light/dark mode
      const isDark = theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);

      const cssUrl = getThemeCssUrl(storedMarkdownTheme, isDark);

      // Create and append Markdown theme link
      const markdownLink = document.createElement('link');
      markdownLink.rel = 'stylesheet';
      markdownLink.href = cssUrl;
      markdownLink.dataset.markdownTheme = storedMarkdownTheme;
      markdownLink.id = 'markdown-theme-css';
      document.head.appendChild(markdownLink);
    };

    loadTheme();

    // Listen for system theme changes when in auto mode
    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => loadTheme();
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }

    // Listen for markdown theme changes from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'folder-site-markdown-theme-style' && e.newValue) {
        if (['github', 'vitesse', 'nord', 'dracula', 'one-dark', 'catppuccin'].includes(e.newValue)) {
          setStoredMarkdownTheme(e.newValue as MarkdownStyleTheme);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [theme, enabled, storedMarkdownTheme]);

  return null;
}

/**
 * Get markdown body class name based on theme
 */
export function getMarkdownBodyClass(theme: ThemeMode): string {
  const isDark = theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  return `markdown-body ${isDark ? 'color-scheme-dark' : ''}`;
}

/**
 * Get markdown theme-specific styles
 */
export function getMarkdownThemeStyles(theme: ThemeMode): React.CSSProperties {
  const isDark = theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  return {
    // Custom enhancements to GitHub Markdown
    '--color-canvas-default': isDark ? '#0d1117' : '#ffffff',
    '--color-canvas-subtle': isDark ? '#161b22' : '#f6f8fa',
    '--color-border-default': isDark ? '#30363d' : '#d0d7de',
    '--color-border-muted': isDark ? '#21262d' : '#d8dee4',
    '--color-fg-default': isDark ? '#c9d1d9' : '#24292f',
    '--color-fg-muted': isDark ? '#8b949e' : '#57606a',
    '--color-accent-fg': isDark ? '#58a6ff' : '#0969da',
    '--color-success-fg': isDark ? '#3fb950' : '#1a7f37',
    '--color-attention-fg': isDark ? '#d29922' : '#9a6700',
    '--color-danger-fg': isDark ? '#f85149' : '#cf222e',
  } as React.CSSProperties;
}

export default MarkdownTheme;