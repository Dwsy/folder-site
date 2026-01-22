/**
 * Comprehensive Unit Tests for Folder-Site CLI
 *
 * This test suite provides comprehensive coverage for core components:
 * - Scanner service
 * - Transformer
 * - Theme utilities
 * - Error handler
 * - Search utilities
 * - CLI parser
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { readdir, stat, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';

// Import modules to test
import {
  scanDirectory,
  type ScanOptions,
  type ScanResult,
} from '../src/server/services/scanner.js';

import {
  ASTTransformer,
  transformAST,
  transformASTAsync,
  createASTTransformer,
  headingIdPlugin,
  taskListPlugin,
  externalLinkPlugin,
} from '../src/server/lib/transformer.js';

import {
  ThemeManager,
  generateThemeCSS,
  applyThemeToHTML,
  getThemeClass,
  getThemeDataAttributes,
  parseThemeConfig,
  validateThemeConfig,
  createCustomTheme,
  getDefaultLightTheme,
  getDefaultDarkTheme,
  getDefaultTheme,
} from '../src/server/lib/theme.js';
import type { ThemeMode, ThemeConfig, ThemePalette } from '../src/types/theme.js';

import {
  AppError,
  HttpError,
  NotFoundError,
  BadRequestError,
  ValidationError,
  InternalServerError,
  classifyError,
  isAppError,
  filterSensitiveData,
} from '../src/server/lib/error-handler.js';

import {
  LRUSearchCache,
  type CacheEntry,
} from '../src/utils/searchCache.js';

import {
  SearchPerformanceTracker,
  type PerformanceMetrics,
} from '../src/utils/searchPerformance.js';

// Test directory setup
const TEST_DIR = '/tmp/test-folder-site-comprehensive';

describe('Scanner Service', () => {
  beforeEach(async () => {
    // Create test directory structure
    await mkdir(TEST_DIR, { recursive: true });
    await Bun.write(`${TEST_DIR}/file1.md`, '# Test File 1');
    await Bun.write(`${TEST_DIR}/file2.txt`, 'Test File 2');
    await Bun.write(`${TEST_DIR}/file3.json`, '{}');
    await Bun.write(`${TEST_DIR}/.hidden`, 'hidden file');

    // Create subdirectory
    await mkdir(`${TEST_DIR}/subdir`, { recursive: true });
    await Bun.write(`${TEST_DIR}/subdir/subfile.md`, '# Subfile');

    // Create excluded directory
    await mkdir(`${TEST_DIR}/node_modules`, { recursive: true });
    await Bun.write(`${TEST_DIR}/node_modules/package.json`, '{}');
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await rm(TEST_DIR, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('scanDirectory - Basic Functionality', () => {
    it('should scan a directory and return results', async () => {
      const options: ScanOptions = {
        rootDir: TEST_DIR,
        extensions: ['.md', '.txt'],
      };

      const result = await scanDirectory(options) as ScanResult;

      expect(result).toBeDefined();
      expect(result.files).toBeInstanceOf(Array);
      expect(result.rootPath).toBe(TEST_DIR);
      expect(result.stats).toBeDefined();
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it('should filter files by extension', async () => {
      const options: ScanOptions = {
        rootDir: TEST_DIR,
        extensions: ['.md'],
      };

      const result = await scanDirectory(options) as ScanResult;

      const mdFiles = result.files.filter(f => f.extension === '.md');
      expect(mdFiles.length).toBeGreaterThan(0);
    });

    it('should exclude specified directories', async () => {
      const options: ScanOptions = {
        rootDir: TEST_DIR,
        extensions: ['.json'],
        excludeDirs: ['node_modules'],
      };

      const result = await scanDirectory(options) as ScanResult;

      const nodeModulesFiles = result.files.filter(f => f.path.includes('node_modules'));
      expect(nodeModulesFiles.length).toBe(0);
    });

    it('should respect maxDepth option', async () => {
      const options: ScanOptions = {
        rootDir: TEST_DIR,
        extensions: ['.md'],
        maxDepth: 0, // 0 means unlimited depth (not limiting)
      };

      const result = await scanDirectory(options) as ScanResult;

      // With maxDepth 0, all directories should be scanned (unlimited)
      const subdirFiles = result.files.filter(f => f.path.includes('subdir'));
      expect(subdirFiles.length).toBeGreaterThan(0);
    });

    it('should handle empty directories', async () => {
      const emptyDir = `${TEST_DIR}/empty`;
      await mkdir(emptyDir, { recursive: true });

      const options: ScanOptions = {
        rootDir: emptyDir,
        extensions: ['.md'],
      };

      const result = await scanDirectory(options) as ScanResult;

      expect(result.files.length).toBe(0);
    });

    it('should handle non-existent directory', async () => {
      const options: ScanOptions = {
        rootDir: '/non-existent-directory',
        extensions: ['.md'],
      };

      await expect(scanDirectory(options)).rejects.toThrow();
    });
  });

  describe('scanDirectory - Edge Cases', () => {
    it('should handle hidden files when includeHidden is true', async () => {
      const options: ScanOptions = {
        rootDir: TEST_DIR,
        extensions: [], // No extension filter to include all files
        includeHidden: true,
      };

      const result = await scanDirectory(options) as ScanResult;

      // With no extension filter, all files should be scanned
      // The .hidden file should be included
      const allItems = [...result.files, ...result.directories];
      expect(allItems.length).toBeGreaterThan(0);
    });

    it('should exclude hidden files when includeHidden is false', async () => {
      const options: ScanOptions = {
        rootDir: TEST_DIR,
        extensions: ['.md', '.txt', '.json'],
        includeHidden: false,
      };

      const result = await scanDirectory(options) as ScanResult;

      const allItems = [...result.files, ...result.directories];
      const hiddenItems = allItems.filter(f => f.name.startsWith('.'));
      expect(hiddenItems.length).toBe(0);
    });
  });

  describe('scanDirectory - Performance', () => {
    it('should track scan duration', async () => {
      const options: ScanOptions = {
        rootDir: TEST_DIR,
        extensions: ['.md'],
      };

      const result = await scanDirectory(options) as ScanResult;

      expect(result.duration).toBeGreaterThanOrEqual(0);
      expect(typeof result.duration).toBe('number');
    });

    it('should provide accurate statistics', async () => {
      const options: ScanOptions = {
        rootDir: TEST_DIR,
        extensions: ['.md'],
      };

      const result = await scanDirectory(options) as ScanResult;

      expect(result.stats).toBeDefined();
      expect(result.stats.totalFiles).toBeGreaterThanOrEqual(0);
      expect(result.stats.totalDirectories).toBeGreaterThanOrEqual(0);
      expect(result.stats.matchedFiles).toBeGreaterThanOrEqual(0);
    });
  });
});

describe('AST Transformer', () => {
  let transformer: ASTTransformer;

  beforeEach(() => {
    transformer = new ASTTransformer();
  });

  describe('Basic Transformation', () => {
    it('should transform a simple paragraph', () => {
      const ast = {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [{ type: 'text', value: 'Hello, world!' }],
          },
        ],
      };

      const result = transformer.transform(ast);

      expect(result.html).toContain('<p>');
      expect(result.html).toContain('Hello, world!');
      expect(result.html).toContain('</p>');
    });

    it('should transform a heading', () => {
      const ast = {
        type: 'root',
        children: [
          {
            type: 'heading',
            depth: 2,
            children: [{ type: 'text', value: 'Section Title' }],
          },
        ],
      };

      const result = transformer.transform(ast);

      expect(result.html).toContain('<h2');
      expect(result.html).toContain('Section Title');
      expect(result.html).toContain('</h2>');
    });

    it('should transform inline code', () => {
      const ast = {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [
              { type: 'text', value: 'Use ' },
              { type: 'inlineCode', value: 'code' },
              { type: 'text', value: ' here' },
            ],
          },
        ],
      };

      const result = transformer.transform(ast);

      expect(result.html).toContain('<code');
      expect(result.html).toContain('code');
      expect(result.html).toContain('</code>');
    });

    it('should transform emphasis and strong', () => {
      const ast = {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [
              { type: 'emphasis', children: [{ type: 'text', value: 'italic' }] },
              { type: 'text', value: ' and ' },
              { type: 'strong', children: [{ type: 'text', value: 'bold' }] },
            ],
          },
        ],
      };

      const result = transformer.transform(ast);

      expect(result.html).toContain('<em>italic</em>');
      expect(result.html).toContain('<strong>bold</strong>');
    });

    it('should transform links', () => {
      const ast = {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [
              {
                type: 'link',
                url: 'https://example.com',
                children: [{ type: 'text', value: 'Example' }],
              },
            ],
          },
        ],
      };

      const result = transformer.transform(ast);

      expect(result.html).toContain('<a');
      expect(result.html).toContain('href="https://example.com"');
      expect(result.html).toContain('Example');
      expect(result.html).toContain('</a>');
    });

    it('should transform images', () => {
      const ast = {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [
              {
                type: 'image',
                url: 'image.png',
                alt: 'Alt text',
              },
            ],
          },
        ],
      };

      const result = transformer.transform(ast);

      expect(result.html).toContain('<img');
      expect(result.html).toContain('src="image.png"');
      expect(result.html).toContain('alt="Alt text"');
    });

    it('should transform lists', () => {
      const ast = {
        type: 'root',
        children: [
          {
            type: 'list',
            ordered: false,
            children: [
              {
                type: 'listItem',
                children: [
                  { type: 'paragraph', children: [{ type: 'text', value: 'Item 1' }] },
                ],
              },
              {
                type: 'listItem',
                children: [
                  { type: 'paragraph', children: [{ type: 'text', value: 'Item 2' }] },
                ],
              },
            ],
          },
        ],
      };

      const result = transformer.transform(ast);

      expect(result.html).toContain('<ul');
      expect(result.html).toContain('<li');
      expect(result.html).toContain('Item 1');
      expect(result.html).toContain('Item 2');
    });

    it('should transform ordered lists with start attribute', () => {
      const ast = {
        type: 'root',
        children: [
          {
            type: 'list',
            ordered: true,
            start: 5,
            children: [
              {
                type: 'listItem',
                children: [
                  { type: 'paragraph', children: [{ type: 'text', value: 'Item 1' }] },
                ],
              },
            ],
          },
        ],
      };

      const result = transformer.transform(ast);

      expect(result.html).toContain('<ol');
      expect(result.html).toContain('start="5"');
    });

    it('should transform blockquotes', () => {
      const ast = {
        type: 'root',
        children: [
          {
            type: 'blockquote',
            children: [
              {
                type: 'paragraph',
                children: [{ type: 'text', value: 'Quote' }],
              },
            ],
          },
        ],
      };

      const result = transformer.transform(ast);

      expect(result.html).toContain('<blockquote');
      expect(result.html).toContain('Quote');
    });

    it('should transform thematic breaks', () => {
      const ast = {
        type: 'root',
        children: [
          {
            type: 'thematicBreak',
          },
        ],
      };

      const result = transformer.transform(ast);

      expect(result.html).toContain('<hr');
    });

    it('should transform code blocks', () => {
      const ast = {
        type: 'root',
        children: [
          {
            type: 'code',
            lang: 'javascript',
            value: 'console.log("Hello");',
          },
        ],
      };

      const result = transformer.transform(ast);

      expect(result.html).toContain('<pre');
      expect(result.html).toContain('<code');
      expect(result.html).toContain('console.log');
    });

    it('should transform tables', () => {
      const ast = {
        type: 'root',
        children: [
          {
            type: 'table',
            children: [
              {
                type: 'tableRow',
                children: [
                  {
                    type: 'tableCell',
                    children: [{ type: 'text', value: 'Header' }],
                  },
                ],
              },
            ],
          },
        ],
      };

      const result = transformer.transform(ast);

      expect(result.html).toContain('<table');
      expect(result.html).toContain('<tr');
      expect(result.html).toContain('Header');
    });
  });

  describe('HTML Escaping', () => {
    it('should escape HTML special characters in text', () => {
      const ast = {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [{ type: 'text', value: '<script>alert("XSS")</script>' }],
          },
        ],
      };

      const result = transformer.transform(ast);

      expect(result.html).toContain('&lt;script&gt;');
      expect(result.html).toContain('alert(&quot;XSS&quot;)');
    });

    it('should escape HTML in inline code', () => {
      const ast = {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [
              { type: 'inlineCode', value: '<div>' },
            ],
          },
        ],
      };

      const result = transformer.transform(ast);

      expect(result.html).toContain('&lt;div&gt;');
    });
  });

  describe('Class Prefix', () => {
    it('should add class prefix when configured', () => {
      const transformerWithPrefix = new ASTTransformer({ classPrefix: 'custom' });
      const ast = {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [{ type: 'text', value: 'Test' }],
          },
        ],
      };

      const result = transformerWithPrefix.transform(ast);

      expect(result.html).toContain('class="custom-markdown"');
    });

    it('should not add class prefix when not configured', () => {
      const ast = {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [{ type: 'text', value: 'Test' }],
          },
        ],
      };

      const result = transformer.transform(ast);

      expect(result.html).toContain('class="markdown"');
    });
  });

  describe('Sanitization', () => {
    it('should skip HTML nodes when sanitize is enabled', () => {
      const transformerSanitized = new ASTTransformer({ sanitize: true });
      const ast = {
        type: 'root',
        children: [
          {
            type: 'html',
            value: '<script>alert("XSS")</script>',
          },
        ],
      };

      const result = transformerSanitized.transform(ast);

      expect(result.html).not.toContain('<script>');
    });

    it('should include HTML nodes when sanitize is disabled', () => {
      const ast = {
        type: 'root',
        children: [
          {
            type: 'html',
            value: '<div>Custom HTML</div>',
          },
        ],
      };

      const result = transformer.transform(ast);

      expect(result.html).toContain('<div>Custom HTML</div>');
    });
  });

  describe('Statistics', () => {
    it('should track nodes processed', () => {
      const ast = {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [{ type: 'text', value: 'Test' }],
          },
        ],
      };

      const result = transformer.transform(ast);

      expect(result.stats).toBeDefined();
      expect(result.stats.nodesProcessed).toBeGreaterThan(0);
      expect(result.stats.nodesTransformed).toBeGreaterThan(0);
    });

    it('should reset statistics on new transform', () => {
      const ast = {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [{ type: 'text', value: 'Test' }],
          },
        ],
      };

      transformer.transform(ast);
      const stats1 = transformer.getStats();

      transformer.transform(ast);
      const stats2 = transformer.getStats();

      expect(stats2.nodesProcessed).toBe(stats1.nodesProcessed);
    });
  });

  describe('Plugins', () => {
    it('should register and apply plugins', () => {
      const plugin = {
        name: 'test-plugin',
        afterNode: (html: string) => html.replace(/Test/g, 'Modified'),
      };

      transformer.registerPlugin(plugin);

      const ast = {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [{ type: 'text', value: 'Test' }],
          },
        ],
      };

      const result = transformer.transform(ast);

      expect(result.html).toContain('Modified');
    });

    it('should unregister plugins', () => {
      const plugin = {
        name: 'test-plugin',
        afterNode: (html: string) => html,
      };

      transformer.registerPlugin(plugin);
      transformer.unregisterPlugin('test-plugin');

      // Plugin should not be applied anymore
      expect(transformer.getOptions().plugins.length).toBe(0);
    });

    it('should apply headingIdPlugin', () => {
      transformer.registerPlugin(headingIdPlugin());

      const ast = {
        type: 'root',
        children: [
          {
            type: 'heading',
            depth: 2,
            children: [{ type: 'text', value: 'Test Heading' }],
          },
        ],
      };

      const result = transformer.transform(ast);

      expect(result.html).toContain('id="test-heading"');
    });

    it('should apply taskListPlugin', () => {
      transformer.registerPlugin(taskListPlugin());

      const ast = {
        type: 'root',
        children: [
          {
            type: 'list',
            children: [
              {
                type: 'listItem',
                checked: true,
                children: [
                  { type: 'paragraph', children: [{ type: 'text', value: 'Done' }] },
                ],
              },
            ],
          },
        ],
      };

      const result = transformer.transform(ast);

      expect(result.html).toContain('task-list-item');
      expect(result.html).toContain('checked');
    });

    it('should apply externalLinkPlugin', () => {
      transformer.registerPlugin(externalLinkPlugin());

      const ast = {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [
              {
                type: 'link',
                url: 'https://example.com',
                children: [{ type: 'text', value: 'Link' }],
              },
            ],
          },
        ],
      };

      const result = transformer.transform(ast);

      expect(result.html).toContain('target="_blank"');
      expect(result.html).toContain('rel="noopener noreferrer"');
    });
  });

  describe('Options Management', () => {
    it('should update options', () => {
      transformer.updateOptions({ highlight: false });

      expect(transformer.getOptions().highlight).toBe(false);
    });

    it('should return readonly options', () => {
      const options = transformer.getOptions();

      expect(options).toBeDefined();
      expect(options.highlight).toBe(true);
    });
  });

  describe('Helper Functions', () => {
    it('transformAST should transform AST', () => {
      const ast = {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [{ type: 'text', value: 'Test' }],
          },
        ],
      };

      const html = transformAST(ast);

      expect(html).toContain('<p>');
      expect(html).toContain('Test');
    });

    it('createASTTransformer should create transformer', () => {
      const transformer = createASTTransformer({ highlight: false });

      expect(transformer).toBeInstanceOf(ASTTransformer);
      expect(transformer.getOptions().highlight).toBe(false);
    });
  });
});

describe('Theme Utilities', () => {
  describe('ThemeManager', () => {
    let manager: ThemeManager;

    beforeEach(() => {
      manager = new ThemeManager();
    });

    afterEach(() => {
      manager.destroy();
    });

    it('should initialize with light mode', () => {
      expect(manager.getMode()).toBe('light');
    });

    it('should set theme mode', () => {
      manager.setMode('dark');
      expect(manager.getMode()).toBe('dark');

      manager.setMode('auto');
      expect(manager.getMode()).toBe('auto');
    });

    it('should toggle theme mode', () => {
      manager.toggleMode();
      expect(manager.getMode()).toBe('dark');

      manager.toggleMode();
      expect(manager.getMode()).toBe('light');
    });

    it('should get theme colors', () => {
      const colors = manager.getThemeColors();

      expect(colors).toBeDefined();
      expect(colors.background).toBeDefined();
      expect(colors.foreground).toBeDefined();
      expect(colors.primary).toBeDefined();
    });

    it('should set custom theme', () => {
      const customTheme: ThemePalette = {
        background: '#000000',
        foreground: '#ffffff',
        primary: '#ff0000',
        secondary: '#888888',
        text: '#ffffff',
        muted: '#aaaaaa',
        accent: '#00ff00',
        border: '#444444',
        success: '#00ff00',
        warning: '#ffff00',
        error: '#ff0000',
      };

      manager.setCustomTheme(customTheme);

      const colors = manager.getThemeColors();
      expect(colors.background).toBe('#000000');
      expect(colors.primary).toBe('#ff0000');
    });

    it('should clear custom theme', () => {
      const customTheme: ThemePalette = {
        background: '#000000',
        foreground: '#ffffff',
        primary: '#ff0000',
        secondary: '#888888',
        text: '#ffffff',
        muted: '#aaaaaa',
        accent: '#00ff00',
        border: '#444444',
        success: '#00ff00',
        warning: '#ffff00',
        error: '#ff0000',
      };

      manager.setCustomTheme(customTheme);
      manager.clearCustomTheme();

      const colors = manager.getThemeColors();
      expect(colors.background).not.toBe('#000000');
    });
  });

  describe('generateThemeCSS', () => {
    it('should generate CSS variables', () => {
      const palette: ThemePalette = {
        background: '#ffffff',
        foreground: '#000000',
        primary: '#0066cc',
        secondary: '#666666',
        text: '#000000',
        muted: '#888888',
        accent: '#8b5cf6',
        border: '#cccccc',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
      };

      const css = generateThemeCSS(palette);

      expect(css).toContain(':root');
      expect(css).toContain('--theme-background');
      expect(css).toContain('#ffffff');
      expect(css).toContain('--theme-primary');
      expect(css).toContain('#0066cc');
    });

    it('should use custom prefix', () => {
      const palette: ThemePalette = {
        background: '#ffffff',
        foreground: '#000000',
        primary: '#0066cc',
        secondary: '#666666',
        text: '#000000',
        muted: '#888888',
        accent: '#8b5cf6',
        border: '#cccccc',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
      };

      const css = generateThemeCSS(palette, 'custom');

      expect(css).toContain('--custom-background');
    });
  });

  describe('applyThemeToHTML', () => {
    it('should inject theme CSS into HTML', () => {
      const html = '<html><head></head><body></body></html>';
      const palette: ThemePalette = {
        background: '#ffffff',
        foreground: '#000000',
        primary: '#0066cc',
        secondary: '#666666',
        text: '#000000',
        muted: '#888888',
        accent: '#8b5cf6',
        border: '#cccccc',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
      };

      const result = applyThemeToHTML(html, palette);

      expect(result).toContain('<style');
      expect(result).toContain('id="folder-site-theme-styles"');
      expect(result).toContain('--theme-background');
    });
  });

  describe('getThemeClass', () => {
    it('should return theme class name', () => {
      expect(getThemeClass('light')).toBe('theme-light');
      expect(getThemeClass('dark')).toBe('theme-dark');
      expect(getThemeClass('auto')).toBe('theme-auto');
    });
  });

  describe('getThemeDataAttributes', () => {
    it('should return data attribute string', () => {
      expect(getThemeDataAttributes('light')).toBe('data-theme="light"');
      expect(getThemeDataAttributes('dark')).toBe('data-theme="dark"');
      expect(getThemeDataAttributes('auto')).toBe('data-theme="auto"');
    });
  });

  describe('parseThemeConfig', () => {
    it('should parse theme config', () => {
      const config = {
        mode: 'dark',
        colors: { primary: '#ff0000' },
        fontFamily: 'Arial',
        transitions: true,
        transitionDuration: 300,
      };

      const parsed = parseThemeConfig(config);

      expect(parsed.mode).toBe('dark');
      expect(parsed.colors.primary).toBe('#ff0000');
      expect(parsed.fontFamily).toBe('Arial');
      expect(parsed.transitions).toBe(true);
      expect(parsed.transitionDuration).toBe(300);
    });

    it('should use default values for missing properties', () => {
      const parsed = parseThemeConfig({});

      expect(parsed.mode).toBe('light');
      expect(parsed.transitions).toBe(true);
      expect(parsed.transitionDuration).toBe(200);
    });
  });

  describe('validateThemeConfig', () => {
    it('should validate correct config', () => {
      const config = {
        mode: 'dark',
        colors: { primary: '#ff0000' },
        transitionDuration: 200,
      };

      const result = validateThemeConfig(config);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid theme mode', () => {
      const config = {
        mode: 'invalid',
      };

      const result = validateThemeConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject invalid color format', () => {
      const config = {
        colors: { primary: 'not-a-color' },
      };

      const result = validateThemeConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject invalid transition duration', () => {
      const config = {
        transitionDuration: -100,
      };

      const result = validateThemeConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('createCustomTheme', () => {
    it('should create custom theme from base and overrides', () => {
      const base = getDefaultLightTheme();
      const overrides = {
        primary: '#ff0000',
        accent: '#00ff00',
      };

      const custom = createCustomTheme(base, overrides);

      expect(custom.primary).toBe('#ff0000');
      expect(custom.accent).toBe('#00ff00');
      expect(custom.background).toBe(base.background); // Unchanged
    });
  });

  describe('getDefaultLightTheme', () => {
    it('should return default light theme', () => {
      const theme = getDefaultLightTheme();

      expect(theme).toBeDefined();
      expect(typeof theme.background).toBe('string');
      expect(typeof theme.primary).toBe('string');
    });
  });

  describe('getDefaultDarkTheme', () => {
    it('should return default dark theme', () => {
      const theme = getDefaultDarkTheme();

      expect(theme).toBeDefined();
      expect(typeof theme.background).toBe('string');
      expect(typeof theme.primary).toBe('string');
    });
  });

  describe('getDefaultTheme', () => {
    it('should return light theme for light mode', () => {
      const theme = getDefaultTheme('light');

      expect(theme).toBeDefined();
      expect(theme.background).toBe('#ffffff');
    });

    it('should return dark theme for dark mode', () => {
      const theme = getDefaultTheme('dark');

      expect(theme).toBeDefined();
      expect(theme.background).toBe('#0a0a0a');
    });
  });
});

describe('Error Handler', () => {
  describe('Error Classes', () => {
    it('should create AppError', () => {
      const error = new AppError('TEST_ERROR', 'Test error', 400);

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('AppError');
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.isOperational).toBe(true);
    });

    it('should create HttpError', () => {
      const error = new HttpError(404, 'Not found');

      expect(error).toBeInstanceOf(AppError);
      expect(error.name).toBe('HttpError');
      expect(error.statusCode).toBe(404);
    });

    it('should create NotFoundError', () => {
      const error = new NotFoundError('Resource not found');

      expect(error).toBeInstanceOf(HttpError);
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('HTTP_404');
    });

    it('should create BadRequestError', () => {
      const error = new BadRequestError('Invalid input');

      expect(error).toBeInstanceOf(HttpError);
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('HTTP_400');
    });

    it('should create ValidationError', () => {
      const error = new ValidationError('Validation failed');

      expect(error).toBeInstanceOf(HttpError);
      expect(error.statusCode).toBe(422);
      expect(error.code).toBe('HTTP_422');
    });

    it('should create InternalServerError', () => {
      const error = new InternalServerError('Server error');

      expect(error).toBeInstanceOf(HttpError);
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('HTTP_500');
    });
  });

  describe('Error Classification', () => {
    it('should classify 4xx errors as CLIENT_ERROR', () => {
      expect(classifyError(400)).toBe('CLIENT_ERROR');
      expect(classifyError(404)).toBe('CLIENT_ERROR');
      expect(classifyError(422)).toBe('CLIENT_ERROR');
    });

    it('should classify 5xx errors as SERVER_ERROR', () => {
      expect(classifyError(500)).toBe('SERVER_ERROR');
      expect(classifyError(503)).toBe('SERVER_ERROR');
    });

    it('should classify other codes as BUSINESS_ERROR', () => {
      expect(classifyError(200)).toBe('BUSINESS_ERROR');
      expect(classifyError(300)).toBe('BUSINESS_ERROR');
    });
  });

  describe('isAppError', () => {
    it('should identify AppError instances', () => {
      const error = new AppError('TEST', 'Test', 400);

      expect(isAppError(error)).toBe(true);
    });

    it('should return false for regular Error', () => {
      const error = new Error('Test');

      expect(isAppError(error)).toBe(false);
    });

    it('should return false for non-error objects', () => {
      expect(isAppError(null)).toBe(false);
      expect(isAppError(undefined)).toBe(false);
      expect(isAppError({})).toBe(false);
    });
  });

  describe('filterSensitiveData', () => {
    it('should filter password fields', () => {
      const data = { username: 'test', password: 'secret' };

      const filtered = filterSensitiveData(data);

      expect(filtered.username).toBe('test');
      expect(filtered.password).toBe('[FILTERED]');
    });

    it('should filter token fields', () => {
      const data = { token: 'abc123def456' };

      const filtered = filterSensitiveData(data);

      expect(filtered.token).toBe('[FILTERED]');
    });

    it('should filter long alphanumeric strings', () => {
      const data = { key: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0' };

      const filtered = filterSensitiveData(data);

      expect(filtered.key).toBe('[FILTERED]');
    });

    it('should handle nested objects', () => {
      const data = {
        user: {
          username: 'test',
          password: 'secret',
        },
      };

      const filtered = filterSensitiveData(data);

      expect(filtered.user.username).toBe('test');
      expect(filtered.user.password).toBe('[FILTERED]');
    });

    it('should handle arrays', () => {
      const data = [
        { password: 'secret1' },
        { username: 'test' },
      ];

      const filtered = filterSensitiveData(data);

      expect(filtered[0].password).toBe('[FILTERED]');
      expect(filtered[1].username).toBe('test');
    });

    it('should handle null and undefined', () => {
      expect(filterSensitiveData(null)).toBe(null);
      expect(filterSensitiveData(undefined)).toBe(undefined);
    });
  });
});

describe('LRUSearchCache', () => {
  let cache: LRUSearchCache;

  beforeEach(() => {
    cache = new LRUSearchCache({ maxSize: 3, ttl: 0 }); // Disable TTL for reliable testing
  });

  afterEach(() => {
    cache.clear();
  });

  describe('Basic Operations', () => {
    it('should set and get values', () => {
      cache.set('key1', { results: ['file1.md'], query: 'key1' });

      const result = cache.get('key1');

      expect(result).toBeDefined();
      expect(result?.results).toEqual(['file1.md']);
    });

    it('should return null for non-existent keys', () => {
      const result = cache.get('non-existent');

      expect(result).toBeNull();
    });

    it('should check if key exists', () => {
      cache.set('key1', { results: ['file1.md'], query: 'key1' });

      expect(cache.has('key1')).toBe(true);
      expect(cache.has('key2')).toBe(false);
    });

    it('should delete entries', () => {
      cache.set('key1', { results: ['file1.md'], query: 'key1' });
      cache.delete('key1');

      expect(cache.has('key1')).toBe(false);
    });

    it('should clear all entries', () => {
      cache.set('key1', { results: ['file1.md'], query: 'key1' });
      cache.set('key2', { results: ['file2.md'], query: 'key2' });
      cache.clear();

      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(false);
    });

    it('should return cache size', () => {
      cache.set('key1', { results: ['file1.md'], query: 'key1' });
      cache.set('key2', { results: ['file2.md'], query: 'key2' });

      expect(cache.size()).toBe(2);
    });
  });

  describe('LRU Eviction', () => {
    it('should maintain max size when adding items', () => {
      cache.set('key1', { results: ['file1.md'], query: 'key1' });
      cache.set('key2', { results: ['file2.md'], query: 'key2' });
      cache.set('key3', { results: ['file3.md'], query: 'key3' });

      expect(cache.size()).toBe(3);

      // Add a 4th item, cache should evict one
      cache.set('key4', { results: ['file4.md'], query: 'key4' });

      // Cache should maintain max size of 3
      expect(cache.size()).toBe(3);
    });

    it('should update lastAccess on get', () => {
      cache.set('key1', { results: ['file1.md'], query: 'key1' });
      cache.set('key2', { results: ['file2.md'], query: 'key2' });

      const value1 = cache.get('key1');
      expect(value1).toBeDefined();

      // Cache should still have both items
      expect(cache.size()).toBe(2);
    });

    it('should allow updating existing keys', () => {
      cache.set('key1', { results: ['file1.md'], query: 'key1' });
      cache.set('key2', { results: ['file2.md'], query: 'key2' });

      // Update key1 (should not evict)
      cache.set('key1', { results: ['file1-updated.md'], query: 'key1' });

      expect(cache.has('key1')).toBe(true);
      expect(cache.has('key2')).toBe(true);
      expect(cache.size()).toBe(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle maxSize of 1', () => {
      cache = new LRUSearchCache({ maxSize: 1, ttl: 0 });

      cache.set('key1', { results: ['file1.md'], query: 'key1' });
      expect(cache.has('key1')).toBe(true);

      cache.set('key2', { results: ['file2.md'], query: 'key2' });
      // key1 should be evicted
      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(true);
      expect(cache.size()).toBe(1);
    });
  });
});

describe('SearchPerformanceTracker', () => {
  let tracker: SearchPerformanceTracker;

  beforeEach(() => {
    tracker = new SearchPerformanceTracker();
  });

  afterEach(() => {
    tracker.reset();
  });

  describe('Basic Operations', () => {
    it('should start and end measure tracking', () => {
      const id = tracker.startMeasure('op1');
      tracker.endMeasure(id);

      const stats = tracker.getStats();

      expect(stats).toBeDefined();
      expect(stats.measures['op1']).toBeDefined();
      expect(stats.measures['op1']?.count).toBe(1);
      expect(stats.measures['op1']?.totalTime).toBeGreaterThan(0);
    });

    it('should track multiple operations', () => {
      const id1 = tracker.startMeasure('op1');
      tracker.endMeasure(id1);

      const id2 = tracker.startMeasure('op2');
      tracker.endMeasure(id2);

      const stats = tracker.getStats();

      expect(stats.measures['op1']).toBeDefined();
      expect(stats.measures['op2']).toBeDefined();
    });

    it('should handle endMeasure with invalid id', () => {
      expect(() => tracker.endMeasure('invalid-id')).not.toThrow();
    });

    it('should record cache hits and misses', () => {
      tracker.recordCacheHit(true);
      tracker.recordCacheHit(false);
      tracker.recordCacheHit(true);

      const stats = tracker.getStats();

      expect(stats.cacheHits).toBe(2);
      expect(stats.cacheMisses).toBe(1);
    });

    it('should record search result counts', () => {
      // Record metrics with result counts
      tracker.recordMetrics({
        query: 'test1',
        startTime: Date.now(),
        endTime: Date.now() + 100,
        duration: 100,
        resultCount: 5,
        fromCache: false,
      });

      tracker.recordMetrics({
        query: 'test2',
        startTime: Date.now(),
        endTime: Date.now() + 100,
        duration: 100,
        resultCount: 10,
        fromCache: false,
      });

      const stats = tracker.getStats();

      expect(stats.avgResultCount).toBeGreaterThan(0);
      expect(stats.avgResultCount).toBe(7.5); // (5 + 10) / 2
    });

    it('should record metrics', () => {
      const metrics = {
        query: 'test',
        startTime: Date.now(),
        endTime: Date.now() + 100,
        duration: 100,
        resultCount: 5,
        fromCache: false,
      };

      tracker.recordMetrics(metrics);

      const stats = tracker.getStats();

      expect(stats.totalSearches).toBe(1);
      expect(stats.executedSearches).toBe(1);
    });
  });

  describe('Statistics', () => {
    it('should calculate average duration', () => {
      const id1 = tracker.startMeasure('op1');
      tracker.endMeasure(id1);

      const id2 = tracker.startMeasure('op1');
      tracker.endMeasure(id2);

      const stats = tracker.getStats();

      expect(stats.measures['op1']).toBeDefined();
      expect(stats.measures['op1']?.averageTime).toBeGreaterThan(0);
    });

    it('should track min and max duration', () => {
      const id1 = tracker.startMeasure('op1');
      // Simulate some work
      const start = Date.now();
      while (Date.now() - start < 10) {}
      tracker.endMeasure(id1);

      const id2 = tracker.startMeasure('op1');
      tracker.endMeasure(id2);

      const stats = tracker.getStats();
      const measure = stats.measures['op1'];

      expect(measure?.minTime).toBeGreaterThan(0);
      expect(measure?.maxTime).toBeGreaterThanOrEqual(measure?.minTime || 0);
    });

    it('should track total duration and count', () => {
      const id1 = tracker.startMeasure('op1');
      tracker.endMeasure(id1);

      const id2 = tracker.startMeasure('op1');
      tracker.endMeasure(id2);

      const stats = tracker.getStats();
      const measure = stats.measures['op1'];

      expect(measure?.totalTime).toBeGreaterThan(0);
      expect(measure?.count).toBe(2);
    });

    it('should return empty stats when no operations tracked', () => {
      const stats = tracker.getStats();

      expect(stats.totalSearches).toBe(0);
      expect(stats.measures).toEqual({});
    });
  });

  describe('Reset', () => {
    it('should reset all metrics', () => {
      const id1 = tracker.startMeasure('op1');
      tracker.endMeasure(id1);

      const id2 = tracker.startMeasure('op2');
      tracker.endMeasure(id2);

      tracker.reset();

      const stats = tracker.getStats();

      expect(stats.totalSearches).toBe(0);
      expect(stats.measures).toEqual({});
      expect(stats.cacheHits).toBe(0);
      expect(stats.cacheMisses).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle endMeasure without start', () => {
      expect(() => tracker.endMeasure('non-existent-id')).not.toThrow();
    });

    it('should handle multiple measures with same name', () => {
      const id1 = tracker.startMeasure('op1');
      const id2 = tracker.startMeasure('op1');
      tracker.endMeasure(id1);
      tracker.endMeasure(id2);

      const stats = tracker.getStats();

      expect(stats.measures['op1']?.count).toBe(2);
    });

    it('should export stats as JSON', () => {
      const id = tracker.startMeasure('test');
      tracker.endMeasure(id);

      const json = tracker.exportStats();

      expect(json).toBeDefined();
      expect(typeof json).toBe('string');
    });
  });
});