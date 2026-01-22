/**
 * Markdown Theme Provider
 *
 * Provides GitHub Markdown CSS theme support with dynamic theming
 */

import { useEffect } from 'react';
import type { ThemeMode } from '../../../types/theme.js';

interface MarkdownThemeProps {
  /** Current theme mode */
  theme: ThemeMode;
  /** Enable/disable markdown theming */
  enabled?: boolean;
}

/**
 * Markdown Theme Component
 *
 * Dynamically loads GitHub Markdown CSS based on theme mode
 * Note: Code highlighting uses Shiki, which includes its own themes
 */
export function MarkdownTheme({ theme, enabled = true }: MarkdownThemeProps) {
  useEffect(() => {
    if (!enabled) return;

    const loadTheme = async () => {
      // Remove existing theme links
      const existingLinks = document.querySelectorAll('link[data-markdown-theme]');
      existingLinks.forEach(link => link.remove());

      // Determine theme to use
      const isDark = theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      const themeName = isDark ? 'github-markdown-dark' : 'github-markdown';

      // Create and append GitHub Markdown theme link
      const markdownLink = document.createElement('link');
      markdownLink.rel = 'stylesheet';
      markdownLink.href = `https://cdn.jsdelivr.net/npm/github-markdown-css@5.8.1/github-markdown${isDark ? '-dark' : ''}.css`;
      markdownLink.dataset.markdownTheme = themeName;
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
  }, [theme, enabled]);

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