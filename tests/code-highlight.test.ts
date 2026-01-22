/**
 * Unit Tests for Code Highlighter
 *
 * Tests the Shiki-based syntax highlighter functionality
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import {
  Highlighter,
  getHighlighter,
  resetHighlighter,
  highlightCode,
} from '../src/server/lib/highlighter.js';
import type { CodeHighlightOptions } from '../src/types/highlighter.js';

describe('Highlighter', () => {
  afterEach(() => {
    resetHighlighter();
  });

  describe('Initialization', () => {
    it('should create a highlighter instance', () => {
      const highlighter = new Highlighter();
      expect(highlighter).toBeDefined();
    });

    it('should return singleton instance from getHighlighter', () => {
      const highlighter1 = getHighlighter();
      const highlighter2 = getHighlighter();
      expect(highlighter1).toBe(highlighter2);
    });

    it('should reset highlighter instance', () => {
      const highlighter1 = getHighlighter();
      resetHighlighter();
      const highlighter2 = getHighlighter();
      expect(highlighter1).not.toBe(highlighter2);
    });
  });

  describe('Language Support', () => {
    it('should highlight JavaScript code', async () => {
      const code = 'const hello = "world";';
      const options: CodeHighlightOptions = {
        lang: 'javascript',
        theme: 'github-dark',
      };

      const highlighter = getHighlighter();
      const html = await highlighter.codeToHtml(code, options);

      expect(html).toContain('const');
      expect(html).toContain('hello');
      expect(html).toContain('world');
      expect(html).toContain('<pre'); // Should contain pre tag
    });

    it('should highlight TypeScript code', async () => {
      const code = 'interface User { name: string; }';
      const options: CodeHighlightOptions = {
        lang: 'typescript',
        theme: 'github-dark',
      };

      const highlighter = getHighlighter();
      const html = await highlighter.codeToHtml(code, options);

      expect(html).toContain('interface');
      expect(html).toContain('User');
      expect(html).toContain('name');
      expect(html).toContain('string');
    });

    it('should highlight Python code', async () => {
      const code = 'def hello():\n    print("world")';
      const options: CodeHighlightOptions = {
        lang: 'python',
        theme: 'github-dark',
      };

      const highlighter = getHighlighter();
      const html = await highlighter.codeToHtml(code, options);

      expect(html).toContain('def');
      expect(html).toContain('hello');
      expect(html).toContain('print');
    });

    it('should highlight JSON code', async () => {
      const code = '{"name": "test", "value": 123}';
      const options: CodeHighlightOptions = {
        lang: 'json',
        theme: 'github-dark',
      };

      const highlighter = getHighlighter();
      const html = await highlighter.codeToHtml(code, options);

      expect(html).toContain('name');
      expect(html).toContain('test');
      expect(html).toContain('value');
      expect(html).toContain('123');
    });

    it('should handle language aliases', async () => {
      const code = 'const x = 1;';
      const options: CodeHighlightOptions = {
        lang: 'js', // Alias for javascript
        theme: 'github-dark',
      };

      const highlighter = getHighlighter();
      const html = await highlighter.codeToHtml(code, options);

      expect(html).toContain('const');
      expect(html).toBeDefined();
    });

    it('should fallback to plaintext for unsupported languages', async () => {
      const code = 'some random text';
      const options: CodeHighlightOptions = {
        lang: 'unsupported-language' as any,
        theme: 'github-dark',
      };

      const highlighter = getHighlighter();
      const html = await highlighter.codeToHtml(code, options);

      expect(html).toContain('some random text');
      expect(html).toBeDefined();
    });
  });

  describe('Theme Support', () => {
    it('should use github-dark theme', async () => {
      const code = 'const x = 1;';
      const options: CodeHighlightOptions = {
        lang: 'javascript',
        theme: 'github-dark',
      };

      const highlighter = getHighlighter();
      const html = await highlighter.codeToHtml(code, options);

      expect(html).toBeDefined();
      expect(html).toContain('const');
    });

    it('should use github-light theme', async () => {
      const code = 'const x = 1;';
      const options: CodeHighlightOptions = {
        lang: 'javascript',
        theme: 'github-light',
      };

      const highlighter = getHighlighter();
      const html = await highlighter.codeToHtml(code, options);

      expect(html).toBeDefined();
      expect(html).toContain('const');
    });

    it('should default to github-dark when theme is auto', async () => {
      const code = 'const x = 1;';
      const options: CodeHighlightOptions = {
        lang: 'javascript',
        theme: 'auto',
      };

      const highlighter = getHighlighter();
      const html = await highlighter.codeToHtml(code, options);

      expect(html).toBeDefined();
      expect(html).toContain('const');
    });

    it('should default to github-dark when theme is undefined', async () => {
      const code = 'const x = 1;';
      const options: CodeHighlightOptions = {
        lang: 'javascript',
      };

      const highlighter = getHighlighter();
      const html = await highlighter.codeToHtml(code, options);

      expect(html).toBeDefined();
      expect(html).toContain('const');
    });
  });

  describe('Highlight Method', () => {
    it('should return detailed highlight result', async () => {
      const code = 'const x = 1;\nconst y = 2;';
      const options: CodeHighlightOptions = {
        lang: 'javascript',
        theme: 'github-dark',
      };

      const highlighter = getHighlighter();
      const result = await highlighter.highlight(code, options);

      expect(result).toBeDefined();
      expect(result.html).toContain('const');
      expect(result.language).toBe('javascript');
      expect(result.theme).toBe('github-dark');
      expect(result.lineCount).toBe(2);
    });

    it('should count lines correctly', async () => {
      const code = 'line1\nline2\nline3\nline4';
      const options: CodeHighlightOptions = {
        lang: 'text',
        theme: 'github-dark',
      };

      const highlighter = getHighlighter();
      const result = await highlighter.highlight(code, options);

      expect(result.lineCount).toBe(4);
    });
  });

  describe('Language Management', () => {
    it('should return list of loaded languages', async () => {
      const highlighter = getHighlighter();
      
      // Trigger initialization by highlighting some code
      await highlighter.codeToHtml('test', { lang: 'javascript' });
      
      const languages = highlighter.getLoadedLanguages();
      expect(languages).toBeDefined();
      expect(Array.isArray(languages)).toBe(true);
      expect(languages.length).toBeGreaterThan(0);
      expect(languages).toContain('javascript');
    });

    it('should return list of loaded themes', async () => {
      const highlighter = getHighlighter();
      
      // Trigger initialization
      await highlighter.codeToHtml('test', { lang: 'javascript' });
      
      const themes = highlighter.getLoadedThemes();
      expect(themes).toBeDefined();
      expect(Array.isArray(themes)).toBe(true);
      expect(themes.length).toBeGreaterThan(0);
      expect(themes).toContain('github-dark');
    });

    it('should load additional languages', async () => {
      const highlighter = getHighlighter();
      
      // Initialize first
      await highlighter.codeToHtml('test', { lang: 'javascript' });
      
      // Load additional language
      await highlighter.loadLanguages(['rust']);
      
      const languages = highlighter.getLoadedLanguages();
      expect(languages).toContain('rust');
    });

    it('should check if language is supported', async () => {
      const highlighter = getHighlighter();
      
      // Initialize and load javascript
      await highlighter.codeToHtml('test', { lang: 'javascript' });
      
      expect(highlighter.isLanguageSupported('javascript')).toBe(true);
      expect(highlighter.isLanguageSupported('js')).toBe(true); // Alias
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty code', async () => {
      const code = '';
      const options: CodeHighlightOptions = {
        lang: 'javascript',
        theme: 'github-dark',
      };

      const highlighter = getHighlighter();
      const html = await highlighter.codeToHtml(code, options);

      expect(html).toBeDefined();
    });

    it('should handle code with special characters', async () => {
      const code = 'const str = "<>&\\"\'";';
      const options: CodeHighlightOptions = {
        lang: 'javascript',
        theme: 'github-dark',
      };

      const highlighter = getHighlighter();
      const html = await highlighter.codeToHtml(code, options);

      expect(html).toBeDefined();
      expect(html).toContain('const');
    });

    it('should handle very long code', async () => {
      const code = 'const x = 1;\n'.repeat(1000);
      const options: CodeHighlightOptions = {
        lang: 'javascript',
        theme: 'github-dark',
      };

      const highlighter = getHighlighter();
      const html = await highlighter.codeToHtml(code, options);

      expect(html).toBeDefined();
      expect(html).toContain('const');
    });

    it('should handle code with unicode characters', async () => {
      const code = 'const emoji = "🚀 Hello 世界";';
      const options: CodeHighlightOptions = {
        lang: 'javascript',
        theme: 'github-dark',
      };

      const highlighter = getHighlighter();
      const html = await highlighter.codeToHtml(code, options);

      expect(html).toBeDefined();
      expect(html).toContain('const');
    });
  });

  describe('Convenience Functions', () => {
    it('should highlight code using convenience function', async () => {
      const code = 'const x = 1;';
      const options: CodeHighlightOptions = {
        lang: 'javascript',
        theme: 'github-dark',
      };

      const html = await highlightCode(code, options);

      expect(html).toBeDefined();
      expect(html).toContain('const');
    });
  });

  describe('Multiple Languages', () => {
    it('should highlight multiple languages in sequence', async () => {
      const highlighter = getHighlighter();

      const jsCode = 'const x = 1;';
      const jsHtml = await highlighter.codeToHtml(jsCode, {
        lang: 'javascript',
        theme: 'github-dark',
      });

      const pyCode = 'def hello(): pass';
      const pyHtml = await highlighter.codeToHtml(pyCode, {
        lang: 'python',
        theme: 'github-dark',
      });

      const tsCode = 'interface User {}';
      const tsHtml = await highlighter.codeToHtml(tsCode, {
        lang: 'typescript',
        theme: 'github-dark',
      });

      expect(jsHtml).toContain('const');
      expect(pyHtml).toContain('def');
      expect(tsHtml).toContain('interface');
    });
  });

  describe('Performance', () => {
    it('should cache highlighter instance', async () => {
      const highlighter = getHighlighter();
      
      const start = Date.now();
      await highlighter.codeToHtml('const x = 1;', {
        lang: 'javascript',
        theme: 'github-dark',
      });
      const firstTime = Date.now() - start;

      const start2 = Date.now();
      await highlighter.codeToHtml('const y = 2;', {
        lang: 'javascript',
        theme: 'github-dark',
      });
      const secondTime = Date.now() - start2;

      // Second call should be faster (cached)
      expect(secondTime).toBeLessThanOrEqual(firstTime);
    });
  });
});
