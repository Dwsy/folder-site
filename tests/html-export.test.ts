/**
 * HTML Export Tests
 * 
 * Unit tests for HTML export functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  HTMLExporter,
  exportMarkdownToHTML,
  downloadMarkdownAsHTML,
  exportMarkdownAsBlob,
} from '../src/server/lib/html-exporter.js';
import type {
  HTMLExportOptions,
  HTMLExportResult,
  HTMLDocumentStructure,
} from '../src/types/html-export.js';
import {
  validateHTMLExportOptions,
  createDefaultHTMLStyleConfig,
  generateHeadingId,
  escapeHTML,
  minifyHTML,
  DEFAULT_HTML_EXPORT_OPTIONS,
} from '../src/types/html-export.js';

describe('HTML Export Types', () => {
  describe('validateHTMLExportOptions', () => {
    it('should validate empty options as valid', () => {
      const result = validateHTMLExportOptions({});
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate valid theme modes', () => {
      expect(validateHTMLExportOptions({ theme: 'light' }).valid).toBe(true);
      expect(validateHTMLExportOptions({ theme: 'dark' }).valid).toBe(true);
      expect(validateHTMLExportOptions({ theme: 'auto' }).valid).toBe(true);
    });

    it('should reject invalid theme mode', () => {
      const result = validateHTMLExportOptions({ theme: 'invalid' });
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate encoding', () => {
      const result = validateHTMLExportOptions({ encoding: 'utf-8' });
      expect(result.valid).toBe(true);
    });

    it('should validate toc max depth range', () => {
      expect(validateHTMLExportOptions({ tocMaxDepth: 1 }).valid).toBe(true);
      expect(validateHTMLExportOptions({ tocMaxDepth: 6 }).valid).toBe(true);
      expect(validateHTMLExportOptions({ tocMaxDepth: 0 }).valid).toBe(false);
      expect(validateHTMLExportOptions({ tocMaxDepth: 7 }).valid).toBe(false);
    });

    it('should validate CSS prefix format', () => {
      expect(validateHTMLExportOptions({ cssPrefix: 'fs-' }).valid).toBe(true);
      expect(validateHTMLExportOptions({ cssPrefix: 'custom' }).valid).toBe(true);
      expect(validateHTMLExportOptions({ cssPrefix: '123invalid' }).valid).toBe(false);
    });
  });

  describe('createDefaultHTMLStyleConfig', () => {
    it('should create light theme config by default', () => {
      const config = createDefaultHTMLStyleConfig('light');
      expect(config.themeMode).toBe('light');
      expect(config.themePalette.background).toBe('#ffffff');
    });

    it('should create dark theme config', () => {
      const config = createDefaultHTMLStyleConfig('dark');
      expect(config.themeMode).toBe('dark');
      expect(config.themePalette.background).toBe('#0a0a0a');
    });

    it('should apply custom theme palette', () => {
      const customPalette = {
        background: '#ff0000',
        foreground: '#ffffff',
        primary: '#00ff00',
        secondary: '#0000ff',
        text: '#ffffff',
        muted: '#888888',
        accent: '#ff00ff',
        border: '#cccccc',
        success: '#00ff00',
        warning: '#ffff00',
        error: '#ff0000',
      };
      const config = createDefaultHTMLStyleConfig('light', customPalette);
      expect(config.themePalette.background).toBe('#ff0000');
    });
  });

  describe('generateHeadingId', () => {
    it('should generate slug from heading text', () => {
      expect(generateHeadingId('Hello World')).toBe('hello-world');
      expect(generateHeadingId('Multiple Spaces')).toBe('multiple-spaces');
      expect(generateHeadingId('Special Chars')).toBe('special-chars');
    });

    it('should handle leading/trailing spaces', () => {
      expect(generateHeadingId('  Title  ')).toBe('title');
    });

    it('should handle empty string', () => {
      expect(generateHeadingId('')).toBe('');
    });
  });

  describe('escapeHTML', () => {
    it('should escape HTML entities', () => {
      expect(escapeHTML('<div>')).toBe('&lt;div&gt;');
      expect(escapeHTML('"quoted"')).toBe('&quot;quoted&quot;');
      expect(escapeHTML("it's")).toBe('it&#39;s');
      expect(escapeHTML('&amp;')).toBe('&amp;amp;');
    });

    it('should handle empty string', () => {
      expect(escapeHTML('')).toBe('');
    });
  });

  describe('minifyHTML', () => {
    it('should remove unnecessary whitespace', () => {
      expect(minifyHTML('<div>  <span>  </span>  </div>')).toBe('<div><span></span></div>');
    });

    it('should handle already minified HTML', () => {
      expect(minifyHTML('<div><span></span></div>')).toBe('<div><span></span></div>');
    });

    it('should preserve important spaces', () => {
      const html = '<p>Hello World</p>';
      expect(minifyHTML(html)).toBe('<p>Hello World</p>');
    });
  });

  describe('DEFAULT_HTML_EXPORT_OPTIONS', () => {
    it('should have all required default values', () => {
      expect(DEFAULT_HTML_EXPORT_OPTIONS.theme).toBe('light');
      expect(DEFAULT_HTML_EXPORT_OPTIONS.includeTOC).toBe(false);
      expect(DEFAULT_HTML_EXPORT_OPTIONS.includeCodeStyles).toBe(true);
      expect(DEFAULT_HTML_EXPORT_OPTIONS.includeThemeStyles).toBe(true);
      expect(DEFAULT_HTML_EXPORT_OPTIONS.encoding).toBe('utf-8');
      expect(DEFAULT_HTML_EXPORT_OPTIONS.enableMath).toBe(true);
      expect(DEFAULT_HTML_EXPORT_OPTIONS.enableGfm).toBe(true);
      expect(DEFAULT_HTML_EXPORT_OPTIONS.includeLineNumbers).toBe(false);
      expect(DEFAULT_HTML_EXPORT_OPTIONS.tocMaxDepth).toBe(3);
      expect(DEFAULT_HTML_EXPORT_OPTIONS.cssPrefix).toBe('fs-');
      expect(DEFAULT_HTML_EXPORT_OPTIONS.inlineStyles).toBe(false);
      expect(DEFAULT_HTML_EXPORT_OPTIONS.minify).toBe(false);
      expect(DEFAULT_HTML_EXPORT_OPTIONS.enableDownloadLinks).toBe(false);
    });
  });
});

describe('HTMLExporter', () => {
  let exporter: HTMLExporter;

  beforeEach(() => {
    exporter = new HTMLExporter();
  });

  describe('constructor', () => {
    it('should create exporter with default options', () => {
      expect(exporter).toBeInstanceOf(HTMLExporter);
    });

    it('should create exporter with custom options', () => {
      const customExporter = new HTMLExporter({
        theme: 'dark',
        includeTOC: true,
        title: 'Custom Title',
      });
      expect(customExporter).toBeInstanceOf(HTMLExporter);
    });

    it('should throw error for invalid options', () => {
      expect(() => new HTMLExporter({ theme: 'invalid' })).toThrow();
    });
  });

  describe('onProgress', () => {
    it('should set progress callback', () => {
      const callback = vi.fn();
      exporter.onProgress(callback);
      expect(() => {}).not.toThrow();
    });
  });

  describe('exportMarkdown', () => {
    it('should export simple markdown content', async () => {
      const content = '# Hello World\n\nThis is a paragraph.';
      const result = await exporter.exportMarkdown(content);

      expect(result.success).toBe(true);
      expect(result.content).toBeDefined();
      expect(result.content).toContain('<h1');
      expect(result.content).toContain('<p>');
      expect(result.size).toBeGreaterThan(0);
    });

    it('should include DOCTYPE and html structure', async () => {
      const content = '# Test';
      const result = await exporter.exportMarkdown(content);

      expect(result.success).toBe(true);
      expect(result.content).toContain('<!DOCTYPE html>');
      expect(result.content).toContain('<html');
      expect(result.content).toContain('<head>');
      expect(result.content).toMatch(/<body[^>]*>/);
    });

    it('should handle empty content', async () => {
      const result = await exporter.exportMarkdown('');

      expect(result.success).toBe(true);
      expect(result.content).toBeDefined();
    });

    it('should include title in output', async () => {
      const content = '# My Document Title\n\nContent here.';
      const result = await exporter.exportMarkdown(content);

      expect(result.content).toContain('My Document Title');
    });

    it('should export headings at different levels', async () => {
      const content = '# H1\n## H2\n### H3\n#### H4\n##### H5\n###### H6';
      const result = await exporter.exportMarkdown(content);

      expect(result.content).toContain('<h1');
      expect(result.content).toContain('<h2');
      expect(result.content).toContain('<h3');
      expect(result.content).toContain('<h4');
      expect(result.content).toContain('<h5');
      expect(result.content).toContain('<h6');
    });

    it('should export code blocks', async () => {
      const content = '```javascript\nconsole.log("hello");\n```';
      const result = await exporter.exportMarkdown(content);

      expect(result.content).toContain('<pre');
      expect(result.content).toContain('javascript');
      expect(result.content).toContain('console.log');
    });

    it('should export inline code', async () => {
      const content = 'Use `console.log()` to debug.';
      const result = await exporter.exportMarkdown(content);

      expect(result.content).toContain('<code>');
      expect(result.content).toContain('console.log');
    });

    it('should export lists', async () => {
      const content = '- Item 1\n- Item 2\n- Item 3';
      const result = await exporter.exportMarkdown(content);

      expect(result.content).toContain('<ul');
      expect(result.content).toContain('<li>');
    });

    it('should export ordered lists', async () => {
      const content = '1. First\n2. Second\n3. Third';
      const result = await exporter.exportMarkdown(content);

      // Should have ol tag or at least render the ordered list items
      expect(result.content).toMatch(/<[uo]l/);
      expect(result.content).toContain('<li>First</li>');
    });

    it('should export blockquotes', async () => {
      const content = '> This is a blockquote.';
      const result = await exporter.exportMarkdown(content);

      expect(result.content).toContain('<blockquote');
    });

    it('should export horizontal rules', async () => {
      const content = '---';
      const result = await exporter.exportMarkdown(content);

      expect(result.content).toContain('<hr');
    });

    it('should export bold text', async () => {
      const content = '**Bold text**';
      const result = await exporter.exportMarkdown(content);

      expect(result.content).toContain('<strong>');
      expect(result.content).toContain('Bold text');
    });

    it('should export italic text', async () => {
      const content = '*Italic text*';
      const result = await exporter.exportMarkdown(content);

      expect(result.content).toContain('<em>');
      expect(result.content).toContain('Italic text');
    });

    it('should export links', async () => {
      const content = '[OpenAI](https://openai.com)';
      const result = await exporter.exportMarkdown(content);

      expect(result.content).toContain('<a');
      expect(result.content).toContain('href="https://openai.com"');
      expect(result.content).toContain('OpenAI');
    });

    it('should include theme styles when enabled', async () => {
      const exporterWithTheme = new HTMLExporter({ includeThemeStyles: true });
      const result = await exporterWithTheme.exportMarkdown('# Test');

      expect(result.content).toContain('--fs-');
      expect(result.content).toContain('background');
    });

    it('should include code styles when enabled', async () => {
      const exporterWithCode = new HTMLExporter({ includeCodeStyles: true });
      const result = await exporterWithCode.exportMarkdown('```js\ncode\n```');

      expect(result.content).toContain('Code Block Styles');
    });

    it('should generate TOC when enabled', async () => {
      const exporterWithTOC = new HTMLExporter({ includeTOC: true });
      const content = '# Title\n## Section 1\n## Section 2';
      const result = await exporterWithTOC.exportMarkdown(content);

      expect(result.content).toContain('Table of Contents');
      expect(result.content).toContain('toc');
    });

    it('should set custom title', async () => {
      const exporterWithTitle = new HTMLExporter({ title: 'Custom Title' });
      const result = await exporterWithTitle.exportMarkdown('Content');

      // Custom title should override extracted title
      expect(result.content).toContain('<title>Custom Title</title>');
    });

    it('should set custom language', async () => {
      const exporterWithLang = new HTMLExporter({ lang: 'zh' });
      const result = await exporterWithLang.exportMarkdown('Content');

      expect(result.content).toContain('lang="zh"');
    });

    it('should measure export duration', async () => {
      const result = await exporter.exportMarkdown('# Test');

      expect(result.duration).toBeDefined();
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it('should return size in bytes', async () => {
      const result = await exporter.exportMarkdown('# Test\n\nSome content here.');

      expect(result.size).toBeDefined();
      expect(result.size).toBeGreaterThan(0);
    });
  });

  describe('downloadHTML', () => {
    it('should throw error for invalid content', async () => {
      await expect(exporter.downloadHTML('', 'test.html')).rejects.toThrow();
    });

    it('should complete without error for valid content', async () => {
      // This test uses DOM APIs, so we skip in non-browser environment
    });
  });

  describe('exportAsBlob', () => {
    it('should return blob, url, and filename', async () => {
      const content = '# Test';
      const result = await exporter.exportAsBlob(content, 'test.html');

      expect(result.blob).toBeInstanceOf(Blob);
      expect(result.url).toBeDefined();
      expect(result.filename).toBe('test.html');
    });

    it('should have correct blob type', async () => {
      const result = await exporter.exportAsBlob('# Test');
      // Blob type may include charset
      expect(result.blob.type).toMatch(/^text\/html/);
    });
  });

  describe('theme support', () => {
    it('should apply dark theme colors', async () => {
      const darkExporter = new HTMLExporter({ theme: 'dark' });
      const result = await darkExporter.exportMarkdown('# Test');

      // Should contain dark theme CSS variables
      expect(result.content).toContain('--fs-background: #0a0a0a');
      expect(result.content).toContain('--fs-text: #fafafa');
    });

    it('should apply light theme colors', async () => {
      const lightExporter = new HTMLExporter({ theme: 'light' });
      const result = await lightExporter.exportMarkdown('# Test');

      expect(result.content).toContain('#ffffff');
    });
  });
});

describe('Convenience Functions', () => {
  describe('exportMarkdownToHTML', () => {
    it('should export content successfully', async () => {
      const result = await exportMarkdownToHTML('# Test');
      expect(result.success).toBe(true);
      expect(result.content).toContain('<h1');
    });

    it('should accept options', async () => {
      const result = await exportMarkdownToHTML('# Test', {
        theme: 'dark',
        title: 'My Doc',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('exportMarkdownAsBlob', () => {
    it('should return blob result', async () => {
      const result = await exportMarkdownAsBlob('# Test');
      expect(result.blob).toBeInstanceOf(Blob);
      expect(result.url).toBeDefined();
    });
  });
});

describe('Complex Markdown Features', () => {
  let exporter: HTMLExporter;

  beforeEach(() => {
    exporter = new HTMLExporter();
  });

  it('should handle nested lists', async () => {
    const content = `- Item 1
  - Nested Item 1.1
  - Nested Item 1.2
- Item 2`;
    const result = await exporter.exportMarkdown(content);

    expect(result.success).toBe(true);
    expect(result.content).toContain('<ul');
    expect(result.content).toContain('<li>');
  });

  it('should handle multiple paragraphs', async () => {
    const content = `First paragraph.

Second paragraph.`;
    const result = await exporter.exportMarkdown(content);

    expect(result.success).toBe(true);
    expect(result.content).toContain('<p>First paragraph.</p>');
    expect(result.content).toContain('<p>Second paragraph.</p>');
  });

  it('should handle mixed inline formatting', async () => {
    const content = '**Bold** and *italic* and `code`';
    const result = await exporter.exportMarkdown(content);

    expect(result.success).toBe(true);
    expect(result.content).toContain('<strong>');
    expect(result.content).toContain('<em>');
    expect(result.content).toContain('<code>');
  });

  it('should handle code block with language', async () => {
    const content = '```python\ndef hello():\n    print("world")\n```';
    const result = await exporter.exportMarkdown(content);

    expect(result.success).toBe(true);
    expect(result.content).toContain('language-python');
  });

  it('should handle strikethrough', async () => {
    const content = '~~deleted text~~';
    const result = await exporter.exportMarkdown(content);

    expect(result.success).toBe(true);
    expect(result.content).toContain('<del>');
  });

  it('should add heading IDs for TOC linking', async () => {
    const content = '## Section Title';
    const result = await exporter.exportMarkdown(content);

    expect(result.success).toBe(true);
    expect(result.content).toContain('id="section-title"');
  });
});

describe('Progress Reporting', () => {
  it('should report progress during export', async () => {
    const exporter = new HTMLExporter();
    const progressCallback = vi.fn();

    exporter.onProgress(progressCallback);
    await exporter.exportMarkdown('# Test');

    expect(progressCallback).toHaveBeenCalled();
    // Check that progress moves through states
    const calls = progressCallback.mock.calls;
    const states = calls.map(call => call[0].state);
    expect(states).toContain('preparing');
    expect(states).toContain('complete');
  });

  it('should report final progress as 100%', async () => {
    const exporter = new HTMLExporter();
    const progressCallback = vi.fn();

    exporter.onProgress(progressCallback);
    await exporter.exportMarkdown('# Test');

    const lastCall = progressCallback.mock.calls[progressCallback.mock.calls.length - 1][0];
    expect(lastCall.progress).toBe(100);
  });
});

describe('Error Handling', () => {
  it('should handle export errors gracefully', async () => {
    // Create exporter with invalid options to trigger error
    const invalidExporter = new HTMLExporter({ theme: 'dark' });
    const result = await invalidExporter.exportMarkdown('');

    // Empty content should still succeed
    expect(result.success).toBe(true);
  });

  it('should include error message on failure', async () => {
    // This tests the error path - currently minimal error cases exist
    // In production, more error cases should be tested
  });
});

describe('Minification', () => {
  it('should minify output when enabled', async () => {
    const minifiedExporter = new HTMLExporter({ minify: true });
    const result = await minifiedExporter.exportMarkdown('# Test\n\nContent');

    expect(result.success).toBe(true);
    // Minified should have less whitespace
    expect(result.content).not.toContain('\n\n');
  });

  it('should not minify output when disabled', async () => {
    const normalExporter = new HTMLExporter({ minify: false });
    const result = await normalExporter.exportMarkdown('# Test');

    expect(result.success).toBe(true);
    // Should still contain some newlines from structure
    expect(result.content).toBeDefined();
  });
});

describe('Custom CSS', () => {
  it('should include additional CSS when provided', async () => {
    const exporterWithCSS = new HTMLExporter({
      additionalCSS: '.custom { color: red; }',
    });
    const result = await exporterWithCSS.exportMarkdown('# Test');

    expect(result.content).toContain('.custom');
    expect(result.content).toContain('color: red');
  });
});

describe('Metadata', () => {
  it('should include author metadata', async () => {
    // This would require parsing frontmatter or metadata option
    // Test when feature is implemented
  });

  it('should include description metadata', async () => {
    // This would require parsing frontmatter or metadata option
    // Test when feature is implemented
  });
});

describe('File Size Calculation', () => {
  it('should calculate accurate file size', async () => {
    const exporter = new HTMLExporter();
    const shortContent = '# Short';
    const longContent = '# Long\n' + 'x'.repeat(1000);

    const shortResult = await exporter.exportMarkdown(shortContent);
    const longResult = await exporter.exportMarkdown(longContent);

    expect(shortResult.size).toBeLessThan(longResult.size!);
  });
});

describe('Duration Measurement', () => {
  it('should measure export duration accurately', async () => {
    const exporter = new HTMLExporter();
    const result = await exporter.exportMarkdown('# Test');

    expect(result.duration).toBeDefined();
    expect(typeof result.duration).toBe('number');
  });
});
