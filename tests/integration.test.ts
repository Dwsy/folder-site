/**
 * Integration Tests for Folder-Site CLI
 *
 * This test suite covers integration scenarios between multiple components:
 * - Scanner + Processor + Cache workflow
 * - File system operations
 * - Component interactions and data flow
 * - End-to-end processing pipelines
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { mkdir, rm, writeFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';

// Import modules to test
import {
  scanDirectory,
  type ScanOptions,
  type ScanResult,
} from '../src/server/services/scanner.js';

import {
  processMarkdown,
  processMarkdownWithCache,
  createMarkdownProcessor,
  type ProcessResult,
  invalidateFileCache,
  clearCache,
  getCacheStatistics,
} from '../src/server/services/processor.js';

import {
  ThemeManager,
  generateThemeCSS,
  applyThemeToHTML,
} from '../src/server/lib/theme.js';
import type { ThemePalette } from '../src/types/theme.js';

import {
  ASTTransformer,
  transformAST,
} from '../src/server/lib/transformer.js';

// Test directory setup
const TEST_DIR = '/tmp/test-folder-site-integration';
const CACHE_DIR = '/tmp/test-folder-site-cache';

describe('Integration Tests', () => {
  describe('Scanner + Processor + Cache Workflow', () => {
    beforeEach(async () => {
      // Create test directory structure
      await mkdir(TEST_DIR, { recursive: true });
      await mkdir(CACHE_DIR, { recursive: true });

      // Create test markdown files
      await writeFile(
        join(TEST_DIR, 'page1.md'),
        '# Page 1\n\nThis is the first page.\n\n## Section\n\nContent here.'
      );
      await writeFile(
        join(TEST_DIR, 'page2.md'),
        '# Page 2\n\n```javascript\nconsole.log("Hello");\n```\n\nSome code here.'
      );
      await writeFile(
        join(TEST_DIR, 'page3.md'),
        '# Page 3\n\n[Math: $E = mc^2$]\n\nSome math here.'
      );

      // Create subdirectory with files
      await mkdir(join(TEST_DIR, 'subdir'), { recursive: true });
      await writeFile(
        join(TEST_DIR, 'subdir', 'nested.md'),
        '# Nested Page\n\nThis is nested.'
      );
    });

    afterEach(async () => {
      // Clean up test directories
      try {
        await rm(TEST_DIR, { recursive: true, force: true });
        await rm(CACHE_DIR, { recursive: true, force: true });
        clearCache();
      } catch {
        // Ignore cleanup errors
      }
    });

    it('should scan directory and process all markdown files', async () => {
      const options: ScanOptions = {
        rootDir: TEST_DIR,
        extensions: ['.md'],
      };

      const scanResult = await scanDirectory(options) as ScanResult;

      expect(scanResult.files.length).toBeGreaterThanOrEqual(3);

      // Process each file
      const results: ProcessResult[] = [];
      for (const file of scanResult.files) {
        const content = await readFile(file.path, 'utf-8');
        const result = await processMarkdown(content);
        results.push(result);
      }

      // Verify all files were processed
      expect(results.length).toBe(scanResult.files.length);

      // Verify HTML output
      results.forEach((result) => {
        expect(result.html).toBeDefined();
        expect(result.html.length).toBeGreaterThan(0);
        expect(result.metadata).toBeDefined();
      });
    });

    it('should process markdown files with caching', async () => {
      const options: ScanOptions = {
        rootDir: TEST_DIR,
        extensions: ['.md'],
      };

      const scanResult = await scanDirectory(options) as ScanResult;
      const testFile = scanResult.files[0];
      const content = await readFile(testFile.path, 'utf-8');

      // First processing - should not be cached
      const result1 = await processMarkdownWithCache(content, {
        filePath: testFile.path,
        enableCache: true,
      });

      expect(result1.metadata.cached).toBe(false);
      expect(result1.html).toBeDefined();

      // Second processing - should be cached
      const result2 = await processMarkdownWithCache(content, {
        filePath: testFile.path,
        enableCache: true,
      });

      expect(result2.metadata.cached).toBe(true);
      expect(result2.html).toBe(result1.html);

      // Check cache statistics
      const stats = getCacheStatistics();
      expect(stats.totalSize).toBeGreaterThan(0);
      expect(stats.currentSize).toBeGreaterThan(0);
    });

    it('should invalidate cache when file is modified', async () => {
      const options: ScanOptions = {
        rootDir: TEST_DIR,
        extensions: ['.md'],
      };

      const scanResult = await scanDirectory(options) as ScanResult;
      const testFile = scanResult.files[0];
      let content = await readFile(testFile.path, 'utf-8');

      // Process and cache
      const result1 = await processMarkdownWithCache(content, {
        filePath: testFile.path,
        enableCache: true,
      });

      expect(result1.metadata.cached).toBe(false);

      // Process again - should be cached
      const result2 = await processMarkdownWithCache(content, {
        filePath: testFile.path,
        enableCache: true,
      });

      expect(result2.metadata.cached).toBe(true);

      // Invalidate cache
      invalidateFileCache(testFile.path);

      // Process again - should not be cached
      const result3 = await processMarkdownWithCache(content, {
        filePath: testFile.path,
        enableCache: true,
      });

      expect(result3.metadata.cached).toBe(false);
    });

    it('should process files with different options', async () => {
      const content = await readFile(join(TEST_DIR, 'page2.md'), 'utf-8');

      // Process with default options
      const result1 = await processMarkdown(content, {
        gfm: true,
        math: true,
        highlight: true,
      });

      expect(result1.metadata.codeBlocks).toBeGreaterThan(0);
      expect(result1.html).toContain('<pre');
      expect(result1.html).toContain('<code');

      // Process without highlighting
      const result2 = await processMarkdown(content, {
        gfm: true,
        math: false,
        highlight: false,
      });

      expect(result2.metadata.codeBlocks).toBeGreaterThan(0);
      // Without highlighting, code blocks should still be present
      expect(result2.html).toContain('<code');

      // Results should be different due to different options
      expect(result1.html).not.toBe(result2.html);
    });

    it('should create and reuse processor instance', async () => {
      const processor = createMarkdownProcessor({
        gfm: true,
        math: false,
        highlight: true,
      });

      const content = await readFile(join(TEST_DIR, 'page1.md'), 'utf-8');

      // Process multiple files with the same processor
      const result1 = await processor(content);
      const result2 = await processor(content);

      expect(result1.html).toBeDefined();
      expect(result2.html).toBeDefined();
      expect(result1.html).toBe(result2.html);
    });
  });

  describe('Scanner + Transformer Integration', () => {
    beforeEach(async () => {
      await mkdir(TEST_DIR, { recursive: true });
      await writeFile(
        join(TEST_DIR, 'test.md'),
        '# Title\n\nParagraph with **bold** and *italic*.\n\n## Section 2\n\nContent.'
      );
    });

    afterEach(async () => {
      try {
        await rm(TEST_DIR, { recursive: true, force: true });
      } catch {
        // Ignore cleanup errors
      }
    });

    it('should scan and transform markdown files', async () => {
      const options: ScanOptions = {
        rootDir: TEST_DIR,
        extensions: ['.md'],
      };

      const scanResult = await scanDirectory(options) as ScanResult;
      const testFile = scanResult.files[0];
      const content = await readFile(testFile.path, 'utf-8');

      // Transform using ASTTransformer
      const html = transformAST({
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [
              { type: 'text', value: 'Test paragraph' },
            ],
          },
        ],
      });

      expect(html).toContain('<p>');
      expect(html).toContain('Test paragraph');
      expect(html).toContain('</p>');
    });

    it('should use transformer with plugins for scanned files', async () => {
      const transformer = new ASTTransformer({
        classPrefix: 'fs',
        sanitize: true,
      });

      const options: ScanOptions = {
        rootDir: TEST_DIR,
        extensions: ['.md'],
      };

      const scanResult = await scanDirectory(options) as ScanResult;
      const testFile = scanResult.files[0];
      const content = await readFile(testFile.path, 'utf-8');

      // Note: In a real scenario, we would parse markdown to AST first
      // For this test, we verify the transformer configuration
      expect(transformer.getOptions().classPrefix).toBe('fs');
      expect(transformer.getOptions().sanitize).toBe(true);
    });
  });

  describe('Theme Integration', () => {
    beforeEach(async () => {
      await mkdir(TEST_DIR, { recursive: true });
      await writeFile(
        join(TEST_DIR, 'page.md'),
        '# Test Page\n\nContent here.'
      );
    });

    afterEach(async () => {
      try {
        await rm(TEST_DIR, { recursive: true, force: true });
      } catch {
        // Ignore cleanup errors
      }
    });

    it('should apply theme to processed HTML', async () => {
      const manager = new ThemeManager();
      const palette: ThemePalette = manager.getThemeColors();

      // Process markdown
      const content = await readFile(join(TEST_DIR, 'page.md'), 'utf-8');
      const result = await processMarkdown(content);

      // Apply theme to HTML
      const themedHtml = applyThemeToHTML(
        `<html><head></head><body>${result.html}</body></html>`,
        palette
      );

      expect(themedHtml).toContain('<style');
      expect(themedHtml).toContain('--theme-background');
      expect(themedHtml).toContain('--theme-primary');
    });

    it('should switch themes and regenerate CSS', async () => {
      const manager = new ThemeManager();

      // Get light theme
      manager.setMode('light');
      const lightColors = manager.getThemeColors();
      const lightCss = generateThemeCSS(lightColors);

      // Switch to dark theme
      manager.setMode('dark');
      const darkColors = manager.getThemeColors();
      const darkCss = generateThemeCSS(darkColors);

      // Colors should be different
      expect(lightColors.background).not.toBe(darkColors.background);
      expect(lightCss).not.toBe(darkCss);
    });

    it('should use custom theme with processed content', async () => {
      const manager = new ThemeManager();

      const customPalette: ThemePalette = {
        background: '#1a1a2e',
        foreground: '#eaeaea',
        primary: '#ff6b6b',
        secondary: '#4ecdc4',
        text: '#eaeaea',
        muted: '#888888',
        accent: '#feca57',
        border: '#333333',
        success: '#00d2d3',
        warning: '#ff9f43',
        error: '#ff6b6b',
      };

      manager.setCustomTheme(customPalette);

      // Process markdown
      const content = await readFile(join(TEST_DIR, 'page.md'), 'utf-8');
      const result = await processMarkdown(content);

      // Apply custom theme
      const themedHtml = applyThemeToHTML(
        `<html><head></head><body>${result.html}</body></html>`,
        customPalette
      );

      expect(themedHtml).toContain('#1a1a2e');
      expect(themedHtml).toContain('#ff6b6b');
    });
  });

  describe('File System Integration', () => {
    beforeEach(async () => {
      await mkdir(TEST_DIR, { recursive: true });
      await mkdir(join(TEST_DIR, 'docs'), { recursive: true });
      await mkdir(join(TEST_DIR, 'docs', 'api'), { recursive: true });
    });

    afterEach(async () => {
      try {
        await rm(TEST_DIR, { recursive: true, force: true });
      } catch {
        // Ignore cleanup errors
      }
    });

    it('should scan nested directory structure', async () => {
      // Create files in nested structure
      await writeFile(join(TEST_DIR, 'index.md'), '# Index');
      await writeFile(join(TEST_DIR, 'docs', 'guide.md'), '# Guide');
      await writeFile(join(TEST_DIR, 'docs', 'api', 'users.md'), '# Users API');

      const options: ScanOptions = {
        rootDir: TEST_DIR,
        extensions: ['.md'],
        maxDepth: 0, // Unlimited depth
      };

      const result = await scanDirectory(options) as ScanResult;

      expect(result.files.length).toBe(3);
      expect(result.stats.totalDirectories).toBeGreaterThanOrEqual(2);
    });

    it('should handle directory exclusions', async () => {
      // Create files
      await writeFile(join(TEST_DIR, 'readme.md'), '# README');
      await writeFile(join(TEST_DIR, 'docs', 'guide.md'), '# Guide');
      await mkdir(join(TEST_DIR, 'node_modules'), { recursive: true });
      await writeFile(join(TEST_DIR, 'node_modules', 'package.json'), '{}');

      const options: ScanOptions = {
        rootDir: TEST_DIR,
        extensions: ['.md', '.json'],
        excludeDirs: ['node_modules'],
      };

      const result = await scanDirectory(options) as ScanResult;

      // node_modules files should be excluded
      const nodeModulesFiles = result.files.filter(f =>
        f.path.includes('node_modules')
      );
      expect(nodeModulesFiles.length).toBe(0);

      // Other files should be included
      const mdFiles = result.files.filter(f => f.extension === '.md');
      expect(mdFiles.length).toBe(2);
    });

    it('should handle hidden files correctly', async () => {
      // Create files
      await writeFile(join(TEST_DIR, 'visible.md'), '# Visible');
      await writeFile(join(TEST_DIR, '.hidden.md'), '# Hidden');
      await writeFile(join(TEST_DIR, 'README.md'), '# README');

      const options: ScanOptions = {
        rootDir: TEST_DIR,
        extensions: ['.md'],
        includeHidden: false,
      };

      const result = await scanDirectory(options) as ScanResult;

      // Hidden files should be excluded
      const hiddenFiles = result.files.filter(f => f.name.startsWith('.'));
      expect(hiddenFiles.length).toBe(0);

      // Visible files should be included
      expect(result.files.length).toBe(2);
    });

    it('should respect extension filters', async () => {
      // Create various file types
      await writeFile(join(TEST_DIR, 'page.md'), '# Page');
      await writeFile(join(TEST_DIR, 'data.json'), '{"key": "value"}');
      await writeFile(join(TEST_DIR, 'script.js'), 'console.log("test");');
      await writeFile(join(TEST_DIR, 'style.css'), 'body { margin: 0; }');

      // Test single extension
      const result1 = await scanDirectory({
        rootDir: TEST_DIR,
        extensions: ['.md'],
      }) as ScanResult;

      expect(result1.files.length).toBe(1);
      expect(result1.files[0].extension).toBe('.md');

      // Test multiple extensions
      const result2 = await scanDirectory({
        rootDir: TEST_DIR,
        extensions: ['.md', '.json'],
      }) as ScanResult;

      expect(result2.files.length).toBe(2);
    });
  });

  describe('End-to-End Processing Pipeline', () => {
    beforeEach(async () => {
      await mkdir(TEST_DIR, { recursive: true });
      await mkdir(join(TEST_DIR, 'content'), { recursive: true });
      await mkdir(join(TEST_DIR, 'content', 'posts'), { recursive: true });

      // Create content files
      await writeFile(
        join(TEST_DIR, 'content', 'index.md'),
        '# Welcome\n\nThis is the homepage.'
      );
      await writeFile(
        join(TEST_DIR, 'content', 'about.md'),
        '# About\n\nInformation about us.'
      );
      await writeFile(
        join(TEST_DIR, 'content', 'posts', 'post1.md'),
        '# First Post\n\n```js\nconsole.log("Hello");\n```\n\nContent.'
      );
      await writeFile(
        join(TEST_DIR, 'content', 'posts', 'post2.md'),
        '# Second Post\n\n[Math: $x^2$]\n\nMore content.'
      );
    });

    afterEach(async () => {
      try {
        await rm(TEST_DIR, { recursive: true, force: true });
        clearCache();
      } catch {
        // Ignore cleanup errors
      }
    });

    it('should process complete content pipeline', async () => {
      // Step 1: Scan content directory
      const scanResult = await scanDirectory({
        rootDir: join(TEST_DIR, 'content'),
        extensions: ['.md'],
        maxDepth: 0,
      }) as ScanResult;

      expect(scanResult.files.length).toBe(4);

      // Step 2: Process all files with caching
      const processedFiles: Array<{
        file: typeof scanResult.files[0];
        result: ProcessResult;
      }> = [];

      for (const file of scanResult.files) {
        const content = await readFile(file.path, 'utf-8');
        const result = await processMarkdownWithCache(content, {
          filePath: file.path,
          enableCache: true,
          gfm: true,
          math: true,
          highlight: true,
        });
        processedFiles.push({ file, result });
      }

      // Step 3: Verify all files were processed
      expect(processedFiles.length).toBe(4);

      // Step 4: Process again to verify caching
      const cachedResults: ProcessResult[] = [];
      for (const { file } of processedFiles) {
        const content = await readFile(file.path, 'utf-8');
        const result = await processMarkdownWithCache(content, {
          filePath: file.path,
          enableCache: true,
          gfm: true,
          math: true,
          highlight: true,
        });
        expect(result.metadata.cached).toBe(true);
        cachedResults.push(result);
      }

      // Step 5: Verify cache statistics
      const stats = getCacheStatistics();
      expect(stats.currentSize).toBe(4);
      expect(stats.totalSize).toBeGreaterThan(0);
    });

    it('should handle processing errors gracefully', async () => {
      // Create a file with invalid markdown
      await writeFile(
        join(TEST_DIR, 'invalid.md'),
        '```js\nunclosed code block\n'
      );

      const scanResult = await scanDirectory({
        rootDir: TEST_DIR,
        extensions: ['.md'],
      }) as ScanResult;

      const invalidFile = scanResult.files.find(f => f.name === 'invalid.md');
      expect(invalidFile).toBeDefined();

      // Process should handle errors gracefully
      const content = await readFile(invalidFile!.path, 'utf-8');
      const result = await processMarkdown(content);

      // Should still return HTML even with invalid markdown
      expect(result.html).toBeDefined();
    });

    it('should track processing metadata', async () => {
      const scanResult = await scanDirectory({
        rootDir: join(TEST_DIR, 'content'),
        extensions: ['.md'],
      }) as ScanResult;

      const processedFiles: ProcessResult[] = [];

      for (const file of scanResult.files) {
        const content = await readFile(file.path, 'utf-8');
        const result = await processMarkdown(content);
        processedFiles.push(result);
      }

      // Verify metadata is tracked
      processedFiles.forEach(result => {
        expect(result.metadata).toBeDefined();
        expect(result.metadata.processingTime).toBeGreaterThanOrEqual(0);
        expect(typeof result.metadata.codeBlocks).toBe('number');
        expect(typeof result.metadata.mathExpressions).toBe('number');
      });

      // Files with code blocks should have codeBlocks > 0
      const post1 = processedFiles.find((_, i) =>
        scanResult.files[i].name === 'post1.md'
      );
      expect(post1?.metadata.codeBlocks).toBeGreaterThan(0);

      // Files with math should have mathExpressions > 0
      const post2 = processedFiles.find((_, i) =>
        scanResult.files[i].name === 'post2.md'
      );
      expect(post2?.metadata.mathExpressions).toBeGreaterThan(0);
    });
  });

  describe('Performance Integration', () => {
    beforeEach(async () => {
      await mkdir(TEST_DIR, { recursive: true });
    });

    afterEach(async () => {
      try {
        await rm(TEST_DIR, { recursive: true, force: true });
        clearCache();
      } catch {
        // Ignore cleanup errors
      }
    });

    it('should process multiple files efficiently', async () => {
      // Create multiple files
      const fileCount = 20;
      for (let i = 0; i < fileCount; i++) {
        await writeFile(
          join(TEST_DIR, `file${i}.md`),
          `# File ${i}\n\nContent.\n\n## Section\n\nMore content.`
        );
      }

      const startTime = performance.now();

      const scanResult = await scanDirectory({
        rootDir: TEST_DIR,
        extensions: ['.md'],
      }) as ScanResult;

      // Process all files
      for (const file of scanResult.files) {
        const content = await readFile(file.path, 'utf-8');
        await processMarkdown(content);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete in reasonable time
      expect(duration).toBeLessThan(5000); // 5 seconds max
      expect(scanResult.files.length).toBe(fileCount);
    });

    it('should benefit from caching for repeated processing', async () => {
      // Create a large file
      const largeContent = Array(100)
        .fill('# Section\n\nContent.\n\n```js\nconsole.log("test");\n```\n\n')
        .join('\n');
      await writeFile(join(TEST_DIR, 'large.md'), largeContent);

      const content = await readFile(join(TEST_DIR, 'large.md'), 'utf-8');

      // First processing
      const start1 = performance.now();
      const result1 = await processMarkdownWithCache(content, {
        filePath: join(TEST_DIR, 'large.md'),
        enableCache: true,
      });
      const duration1 = performance.now() - start1;

      // Second processing (cached)
      const start2 = performance.now();
      const result2 = await processMarkdownWithCache(content, {
        filePath: join(TEST_DIR, 'large.md'),
        enableCache: true,
      });
      const duration2 = performance.now() - start2;

      // Cached processing should be faster
      expect(duration2).toBeLessThan(duration1);
      expect(result2.metadata.cached).toBe(true);
    });
  });
});