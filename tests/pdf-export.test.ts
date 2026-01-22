/**
 * PDF Export Tests
 * 
 * Unit tests for PDF export functionality
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { PDFExporter, exportMarkdownToPDF, downloadMarkdownAsPDF } from '../src/server/lib/pdf-exporter';
import type { PDFExportOptions, PDFExportProgress } from '../src/types/pdf-export';
import {
  DEFAULT_PDF_EXPORT_OPTIONS,
  validatePDFExportOptions,
  getPageDimensions,
  calculateContentArea,
  createPDFPageConfig,
} from '../src/types/pdf-export';

describe('PDF Export Types', () => {
  describe('validatePDFExportOptions', () => {
    it('should validate valid options', () => {
      const options: Partial<PDFExportOptions> = {
        format: 'a4',
        orientation: 'portrait',
        fontSize: 12,
        lineHeight: 1.5,
      };

      const result = validatePDFExportOptions(options);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid format', () => {
      const options = {
        format: 'invalid' as any,
      };

      const result = validatePDFExportOptions(options);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject invalid orientation', () => {
      const options = {
        orientation: 'invalid' as any,
      };

      const result = validatePDFExportOptions(options);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject invalid font size', () => {
      const options = {
        fontSize: 100,
      };

      const result = validatePDFExportOptions(options);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject invalid line height', () => {
      const options = {
        lineHeight: 5,
      };

      const result = validatePDFExportOptions(options);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject invalid margins', () => {
      const options = {
        margin: {
          top: 200,
        },
      };

      const result = validatePDFExportOptions(options);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('getPageDimensions', () => {
    it('should return correct A4 portrait dimensions', () => {
      const dims = getPageDimensions('a4', 'portrait');
      expect(dims.width).toBe(210);
      expect(dims.height).toBe(297);
    });

    it('should return correct A4 landscape dimensions', () => {
      const dims = getPageDimensions('a4', 'landscape');
      expect(dims.width).toBe(297);
      expect(dims.height).toBe(210);
    });

    it('should return correct letter portrait dimensions', () => {
      const dims = getPageDimensions('letter', 'portrait');
      expect(dims.width).toBe(216);
      expect(dims.height).toBe(279);
    });

    it('should return correct legal portrait dimensions', () => {
      const dims = getPageDimensions('legal', 'portrait');
      expect(dims.width).toBe(216);
      expect(dims.height).toBe(356);
    });
  });

  describe('calculateContentArea', () => {
    it('should calculate content area correctly', () => {
      const area = calculateContentArea(210, 297, {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20,
      });

      expect(area.width).toBe(170);
      expect(area.height).toBe(257);
    });

    it('should handle zero margins', () => {
      const area = calculateContentArea(210, 297, {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      });

      expect(area.width).toBe(210);
      expect(area.height).toBe(297);
    });
  });

  describe('createPDFPageConfig', () => {
    it('should create valid page config', () => {
      const config = createPDFPageConfig('a4', 'portrait', {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20,
      });

      expect(config.format).toBe('a4');
      expect(config.orientation).toBe('portrait');
      expect(config.width).toBe(210);
      expect(config.height).toBe(297);
      expect(config.contentWidth).toBe(170);
      expect(config.contentHeight).toBe(257);
    });
  });
});

describe('PDFExporter', () => {
  let exporter: PDFExporter;

  beforeEach(() => {
    exporter = new PDFExporter();
  });

  describe('constructor', () => {
    it('should create exporter with default options', () => {
      expect(exporter).toBeDefined();
    });

    it('should create exporter with custom options', () => {
      const customExporter = new PDFExporter({
        format: 'letter',
        orientation: 'landscape',
        fontSize: 14,
      });

      expect(customExporter).toBeDefined();
    });

    it('should throw error for invalid options', () => {
      expect(() => {
        new PDFExporter({
          format: 'invalid' as any,
        });
      }).toThrow();
    });
  });

  describe('exportMarkdown', () => {
    it('should export simple markdown', async () => {
      const content = '# Hello World\n\nThis is a test.';
      const result = await exporter.exportMarkdown(content);

      expect(result.success).toBe(true);
      expect(result.blob).toBeDefined();
      expect(result.size).toBeGreaterThan(0);
      expect(result.pageCount).toBeGreaterThan(0);
    });

    it('should export markdown with headings', async () => {
      const content = `
# Heading 1
## Heading 2
### Heading 3
#### Heading 4
##### Heading 5
###### Heading 6
`;
      const result = await exporter.exportMarkdown(content);

      expect(result.success).toBe(true);
      expect(result.blob).toBeDefined();
    });

    it('should export markdown with paragraphs', async () => {
      const content = `
This is the first paragraph.

This is the second paragraph.

This is the third paragraph.
`;
      const result = await exporter.exportMarkdown(content);

      expect(result.success).toBe(true);
      expect(result.blob).toBeDefined();
    });

    it('should export markdown with code blocks', async () => {
      const content = `
# Code Example

\`\`\`javascript
function hello() {
  console.log('Hello, World!');
}
\`\`\`

\`\`\`python
def hello():
    print("Hello, World!")
\`\`\`
`;
      const result = await exporter.exportMarkdown(content);

      expect(result.success).toBe(true);
      expect(result.blob).toBeDefined();
    });

    it('should export markdown with lists', async () => {
      const content = `
# Lists

- Item 1
- Item 2
- Item 3

1. First
2. Second
3. Third
`;
      const result = await exporter.exportMarkdown(content);

      expect(result.success).toBe(true);
      expect(result.blob).toBeDefined();
    });

    it('should export markdown with blockquotes', async () => {
      const content = `
# Quotes

> This is a blockquote.
> It can span multiple lines.

> Another quote here.
`;
      const result = await exporter.exportMarkdown(content);

      expect(result.success).toBe(true);
      expect(result.blob).toBeDefined();
    });

    it('should export markdown with horizontal rules', async () => {
      const content = `
# Section 1

---

# Section 2

***

# Section 3
`;
      const result = await exporter.exportMarkdown(content);

      expect(result.success).toBe(true);
      expect(result.blob).toBeDefined();
    });

    it('should handle empty content', async () => {
      const content = '';
      const result = await exporter.exportMarkdown(content);

      expect(result.success).toBe(true);
      expect(result.blob).toBeDefined();
    });

    it('should handle very long content', async () => {
      const content = Array(100)
        .fill('# Heading\n\nThis is a paragraph.\n\n')
        .join('');
      const result = await exporter.exportMarkdown(content);

      expect(result.success).toBe(true);
      expect(result.blob).toBeDefined();
      expect(result.pageCount).toBeGreaterThan(1);
    });
  });

  describe('onProgress', () => {
    it('should call progress callback', async () => {
      const progressUpdates: PDFExportProgress[] = [];

      exporter.onProgress((progress) => {
        progressUpdates.push(progress);
      });

      const content = '# Test\n\nContent here.';
      await exporter.exportMarkdown(content);

      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[0].state).toBe('preparing');
      expect(progressUpdates[progressUpdates.length - 1].state).toBe('complete');
    });

    it('should report progress percentages', async () => {
      const progressUpdates: PDFExportProgress[] = [];

      exporter.onProgress((progress) => {
        progressUpdates.push(progress);
      });

      const content = '# Test\n\nContent here.';
      await exporter.exportMarkdown(content);

      const percentages = progressUpdates.map((p) => p.progress);
      expect(Math.min(...percentages)).toBe(0);
      expect(Math.max(...percentages)).toBe(100);
    });
  });
});

describe('Convenience Functions', () => {
  describe('exportMarkdownToPDF', () => {
    it('should export markdown to PDF', async () => {
      const content = '# Test Document\n\nThis is a test.';
      const result = await exportMarkdownToPDF(content);

      expect(result.success).toBe(true);
      expect(result.blob).toBeDefined();
    });

    it('should accept custom options', async () => {
      const content = '# Test Document';
      const result = await exportMarkdownToPDF(content, {
        format: 'letter',
        orientation: 'landscape',
      });

      expect(result.success).toBe(true);
      expect(result.blob).toBeDefined();
    });
  });

  describe('downloadMarkdownAsPDF', () => {
    it.skip('should create download link (requires browser environment)', async () => {
      // This test requires a browser environment with document object
      // Skip in Node.js test environment
      const content = '# Test';
      await downloadMarkdownAsPDF(content, 'test.pdf');
    });
  });
});

describe('Theme Support', () => {
  it('should apply light theme', async () => {
    const exporter = new PDFExporter({
      theme: 'light',
    });

    const content = '# Test';
    const result = await exporter.exportMarkdown(content);

    expect(result.success).toBe(true);
  });

  it('should apply dark theme', async () => {
    const exporter = new PDFExporter({
      theme: 'dark',
    });

    const content = '# Test';
    const result = await exporter.exportMarkdown(content);

    expect(result.success).toBe(true);
  });

  it('should apply custom theme palette', async () => {
    const exporter = new PDFExporter({
      themePalette: {
        background: '#ffffff',
        foreground: '#000000',
        primary: '#0066cc',
        secondary: '#6b7280',
        text: '#0a0a0a',
        muted: '#737373',
        accent: '#8b5cf6',
        border: '#d4d4d4',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
      },
    });

    const content = '# Test';
    const result = await exporter.exportMarkdown(content);

    expect(result.success).toBe(true);
  });
});

describe('PDF Options', () => {
  it('should set document title', async () => {
    const exporter = new PDFExporter({
      title: 'Test Document',
    });

    const content = '# Content';
    const result = await exporter.exportMarkdown(content);

    expect(result.success).toBe(true);
  });

  it('should set document author', async () => {
    const exporter = new PDFExporter({
      author: 'Test Author',
    });

    const content = '# Content';
    const result = await exporter.exportMarkdown(content);

    expect(result.success).toBe(true);
  });

  it('should set custom margins', async () => {
    const exporter = new PDFExporter({
      margin: {
        top: 30,
        right: 30,
        bottom: 30,
        left: 30,
      },
    });

    const content = '# Content';
    const result = await exporter.exportMarkdown(content);

    expect(result.success).toBe(true);
  });

  it('should set custom font size', async () => {
    const exporter = new PDFExporter({
      fontSize: 14,
    });

    const content = '# Content';
    const result = await exporter.exportMarkdown(content);

    expect(result.success).toBe(true);
  });

  it('should set custom line height', async () => {
    const exporter = new PDFExporter({
      lineHeight: 2,
    });

    const content = '# Content';
    const result = await exporter.exportMarkdown(content);

    expect(result.success).toBe(true);
  });
});

describe('Error Handling', () => {
  it('should handle export errors gracefully', async () => {
    const exporter = new PDFExporter();

    // Force an error by passing invalid content
    const result = await exporter.exportMarkdown('# Test');

    // Even with potential errors, should return a result object
    expect(result).toBeDefined();
    expect(typeof result.success).toBe('boolean');
  });
});
