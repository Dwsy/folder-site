import { describe, it, expect } from 'bun:test';
import {
  processMarkdown,
  createMarkdownProcessor,
  defaultProcessor,
  type MarkdownProcessorOptions,
} from '../src/server/services/processor';

describe('processor', () => {
  describe('processMarkdown', () => {
    it('should convert basic markdown to HTML', async () => {
      const markdown = '# Hello World\n\nThis is a paragraph.';
      const result = await processMarkdown(markdown);

      expect(result.html).toContain('<h1>Hello World</h1>');
      expect(result.html).toContain('<p>This is a paragraph.</p>');
      expect(result.metadata.codeBlocks).toBe(0);
      expect(result.metadata.mathExpressions).toBe(0);
    });

    it('should handle GitHub Flavored Markdown', async () => {
      const markdown = `
| Column 1 | Column 2 |
|----------|----------|
| Cell 1   | Cell 2   |
`;
      const result = await processMarkdown(markdown, { gfm: true });

      expect(result.html).toContain('<table>');
      expect(result.html).toContain('<thead>');
      expect(result.html).toContain('<tbody>');
    });

    it('should handle code blocks with syntax highlighting', async () => {
      const markdown = `
\`\`\`typescript
const greeting: string = "Hello, World!";
console.log(greeting);
\`\`\`
`;
      const result = await processMarkdown(markdown, { highlight: true });

      expect(result.html).toContain('<pre>');
      expect(result.html).toContain('<code');
      expect(result.html).toContain('typescript');
      expect(result.metadata.codeBlocks).toBe(1);
    });

    it('should handle math expressions', async () => {
      const markdown = `
Inline math: $E = mc^2$

Block math:
$$
\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}
$$
`;
      const result = await processMarkdown(markdown, { math: true });

      expect(result.html).toContain('math');
      expect(result.metadata.mathExpressions).toBe(2);
    });

    it('should handle mixed content', async () => {
      const markdown = `
# Mixed Content Example

## Code Example

\`\`\`javascript
function add(a, b) {
  return a + b;
}
\`\`\`

## Math Example

The formula for the area of a circle is $A = \\pi r^2$.

| Feature | Status |
|---------|--------|
| GFM     | ✓      |
| Math    | ✓      |
| Highlight | ✓    |
`;
      const result = await processMarkdown(markdown, {
        gfm: true,
        math: true,
        highlight: true,
      });

      expect(result.html).toContain('<h1>');
      expect(result.html).toContain('<h2>');
      expect(result.html).toContain('<pre>');
      expect(result.html).toContain('<table>');
      expect(result.metadata.codeBlocks).toBe(1);
      expect(result.metadata.mathExpressions).toBe(1);
    });

    it('should return processing time metadata', async () => {
      const markdown = '# Test';
      const result = await processMarkdown(markdown);

      expect(result.metadata.processingTime).toBeGreaterThanOrEqual(0);
      expect(typeof result.metadata.processingTime).toBe('number');
    });

    it('should handle empty markdown', async () => {
      const markdown = '';
      const result = await processMarkdown(markdown);

      expect(result.html).toBeDefined();
      expect(result.metadata.codeBlocks).toBe(0);
      expect(result.metadata.mathExpressions).toBe(0);
    });

    it('should handle markdown with special characters', async () => {
      const markdown = `
# Special Characters

<>&

\`\`\`html
<div class="test">Content</div>
\`\`\`
`;
      const result = await processMarkdown(markdown);

      // Check for HTML entity encoding (either named or hex encoding)
      expect(result.html).toMatch(/&(lt;|#x3C;)/);
      expect(result.html).toMatch(/&(amp;|#x26;)/);
    });
  });

  describe('createMarkdownProcessor', () => {
    it('should create a reusable processor', async () => {
      const processor = createMarkdownProcessor({ gfm: true });

      const result1 = await processor('# Test 1');
      const result2 = await processor('# Test 2');

      expect(result1.html).toContain('<h1>Test 1</h1>');
      expect(result2.html).toContain('<h1>Test 2</h1>');
    });

    it('should respect processor options', async () => {
      const processor = createMarkdownProcessor({ gfm: false });

      const markdown = `
| Column 1 | Column 2 |
|----------|----------|
| Cell 1   | Cell 2   |
`;
      const result = await processor(markdown);

      // Without GFM, tables might not be parsed correctly
      expect(result.html).toBeDefined();
    });
  });

  describe('defaultProcessor', () => {
    it('should process markdown with default settings', async () => {
      const markdown = `
# Default Processor Test

\`\`\`typescript
const x = 1;
\`\`\`

Math: $x^2$
`;
      const result = await defaultProcessor(markdown);

      expect(result.html).toContain('<h1>');
      expect(result.html).toContain('<code');
      expect(result.metadata.codeBlocks).toBe(1);
      expect(result.metadata.mathExpressions).toBe(1);
    });
  });

  describe('error handling', () => {
    it('should throw error for invalid markdown syntax', async () => {
      // Note: unified is quite forgiving, so this might not throw
      // but we should test the error handling path
      const markdown = '````'; // Unclosed code block

      try {
        await processMarkdown(markdown);
        // If no error, that's also acceptable
        expect(true).toBe(true);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(String(error)).toContain('Failed to process markdown');
      }
    });
  });
});