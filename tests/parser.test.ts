/**
 * Markdown Parser 单元测试
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import {
  MarkdownParser,
  createMarkdownParser,
  parseMarkdown,
  parseMarkdownAsync,
  markdownToHTML,
  markdownToHTMLAsync,
  defaultMarkdownParser,
} from '../src/parsers/index.js';

describe('MarkdownParser', () => {
  let parser: MarkdownParser;

  beforeEach(() => {
    parser = new MarkdownParser();
  });

  describe('constructor', () => {
    it('should create parser with default options', () => {
      const parser = new MarkdownParser();
      const options = parser.getOptions();
      
      expect(options.gfm).toBe(true);
      expect(options.frontmatter).toBe(true);
      expect(options.highlight).toBe(true);
      expect(options.math).toBe(true);
      expect(options.highlightTheme).toBe('github');
    });

    it('should create parser with custom options', () => {
      const parser = new MarkdownParser({
        gfm: false,
        highlightTheme: 'monokai',
      });
      const options = parser.getOptions();
      
      expect(options.gfm).toBe(false);
      expect(options.highlightTheme).toBe('monokai');
    });
  });

  describe('parse', () => {
    it('should parse basic markdown', () => {
      const markdown = '# Hello\n\nThis is **bold** text.';
      const result = parser.parse(markdown);
      
      expect(result.content).toBe(markdown);
      expect(result.html).toContain('<h1>Hello</h1>');
      expect(result.html).toContain('<strong>bold</strong>');
      expect(result.metadata.codeBlocks).toBe(0);
    });

    it('should parse markdown with code blocks', () => {
      const markdown = '```javascript\nconst x = 1;\n```';
      const result = parser.parse(markdown);
      
      expect(result.metadata.codeBlocks).toBe(1);
      expect(result.html).toContain('<pre>');
      expect(result.html).toContain('<code');
    });

    it('should parse markdown with frontmatter', () => {
      const markdown = `---
title: My Document
description: A test document
---

# Hello`;
      
      const result = parser.parse(markdown);
      
      expect(result.frontmatter).toBeDefined();
      expect(result.frontmatter?.title).toBe('My Document');
      expect(result.frontmatter?.description).toBe('A test document');
    });

    it('should parse markdown without frontmatter', () => {
      const markdown = '# Hello';
      const result = parser.parse(markdown);
      
      expect(result.frontmatter).toBeUndefined();
    });

    it('should throw error for empty string', () => {
      expect(() => parser.parse('')).toThrow('Markdown content must be a non-empty string');
    });

    it('should throw error for non-string input', () => {
      expect(() => parser.parse(null as any)).toThrow('Markdown content must be a non-empty string');
    });
  });

  describe('parseAsync', () => {
    it('should parse markdown asynchronously', async () => {
      const markdown = '# Hello\n\nThis is **bold** text.';
      const result = await parser.parseAsync(markdown);
      
      expect(result.content).toBe(markdown);
      expect(result.html).toContain('<h1>Hello</h1>');
      expect(result.html).toContain('<strong>bold</strong>');
    });

    it('should parse markdown with frontmatter asynchronously', async () => {
      const markdown = `---
title: Test
---

# Content`;
      
      const result = await parser.parseAsync(markdown);
      
      expect(result.frontmatter?.title).toBe('Test');
    });
  });

  describe('parseToAST', () => {
    it('should parse markdown to MDAST', () => {
      const markdown = '# Hello';
      const ast = parser.parseToAST(markdown);
      
      expect(ast.type).toBe('root');
      expect(ast.children).toBeDefined();
      expect(ast.children.length).toBeGreaterThan(0);
    });

    it('should include frontmatter in AST', () => {
      const markdown = `---
title: Test
---

# Content`;
      
      const ast = parser.parseToAST(markdown);
      const yamlNode = ast.children.find((node: any) => node.type === 'yaml');
      
      expect(yamlNode).toBeDefined();
    });
  });

  describe('parseToHTML', () => {
    it('should convert markdown to HTML', () => {
      const markdown = '# Hello\n\nThis is **bold**.';
      const html = parser.parseToHTML(markdown);
      
      expect(html).toContain('<h1>Hello</h1>');
      expect(html).toContain('<strong>bold</strong>');
    });

    it('should handle code blocks', () => {
      const markdown = '```javascript\nconst x = 1;\n```';
      const html = parser.parseToHTML(markdown);
      
      expect(html).toContain('<pre>');
      expect(html).toContain('<code');
    });

    it('should handle lists', () => {
      const markdown = '- Item 1\n- Item 2';
      const html = parser.parseToHTML(markdown);
      
      expect(html).toContain('<ul>');
      expect(html).toContain('<li>Item 1</li>');
    });
  });

  describe('parseToHTMLAsync', () => {
    it('should convert markdown to HTML asynchronously', async () => {
      const markdown = '# Hello';
      const html = await parser.parseToHTMLAsync(markdown);
      
      expect(html).toContain('<h1>Hello</h1>');
    });
  });

  describe('GFM support', () => {
    it('should parse tables', () => {
      const markdown = `| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |`;
      
      const result = parser.parse(markdown);
      expect(result.html).toContain('<table>');
      expect(result.html).toContain('<th>Header 1</th>');
      expect(result.html).toContain('<td>Cell 1</td>');
    });

    it('should parse task lists', () => {
      const markdown = `- [x] Completed task\n- [ ] Pending task`;
      const result = parser.parse(markdown);
      
      expect(result.html).toContain('<input');
    });

    it('should parse strikethrough', () => {
      const markdown = '~~deleted text~~';
      const result = parser.parse(markdown);
      
      expect(result.html).toContain('<del>deleted text</del>');
    });

    it('should not parse GFM when disabled', () => {
      const parser = new MarkdownParser({ gfm: false });
      const markdown = '~~deleted text~~';
      const result = parser.parse(markdown);
      
      // When GFM is disabled, strikethrough won't be parsed
      expect(result.html).toContain('~~');
    });
  });

  describe('Math support', () => {
    it('should parse inline math', () => {
      const markdown = 'The formula is $E = mc^2$.';
      const result = parser.parse(markdown);
      
      expect(result.metadata.mathExpressions).toBe(1);
      expect(result.html).toContain('E = mc^2');
    });

    it('should parse block math', () => {
      const markdown = '$$\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}$$';
      const result = parser.parse(markdown);
      
      expect(result.metadata.mathExpressions).toBe(1);
    });

    it('should count multiple math expressions', () => {
      const markdown = '$x$ and $y$ and $$z$$';
      const result = parser.parse(markdown);
      
      expect(result.metadata.mathExpressions).toBe(3);
    });
  });

  describe('updateOptions', () => {
    it('should update parser options', () => {
      parser.updateOptions({ gfm: false });
      const options = parser.getOptions();
      
      expect(options.gfm).toBe(false);
    });

    it('should rebuild processor after options update', () => {
      const markdown = '~~text~~';
      
      parser.updateOptions({ gfm: false });
      let result = parser.parse(markdown);
      expect(result.html).toContain('~~');
      
      parser.updateOptions({ gfm: true });
      result = parser.parse(markdown);
      expect(result.html).toContain('<del>');
    });
  });

  describe('getOptions', () => {
    it('should return readonly options', () => {
      const options = parser.getOptions();
      
      expect(options.gfm).toBe(true);
      expect(options.frontmatter).toBe(true);
      expect(options.highlight).toBe(true);
      expect(options.math).toBe(true);
    });
  });
});

describe('createMarkdownParser', () => {
  it('should create parser with default options', () => {
    const parser = createMarkdownParser();
    const options = parser.getOptions();
    
    expect(options.gfm).toBe(true);
    expect(options.frontmatter).toBe(true);
  });

  it('should create parser with custom options', () => {
    const parser = createMarkdownParser({ gfm: false });
    const options = parser.getOptions();
    
    expect(options.gfm).toBe(false);
  });
});

describe('defaultMarkdownParser', () => {
  it('should parse markdown with default settings', () => {
    const markdown = '# Hello\n\n**bold**';
    const result = defaultMarkdownParser.parse(markdown);
    
    expect(result.html).toContain('<h1>Hello</h1>');
    expect(result.html).toContain('<strong>bold</strong>');
  });
});

describe('parseMarkdown', () => {
  it('should parse markdown content', () => {
    const markdown = '# Test';
    const result = parseMarkdown(markdown);
    
    expect(result.html).toContain('<h1>Test</h1>');
    expect(result.content).toBe(markdown);
  });

  it('should accept custom options', () => {
    const markdown = '~~text~~';
    const result = parseMarkdown(markdown, { gfm: false });
    
    expect(result.html).toContain('~~');
  });
});

describe('parseMarkdownAsync', () => {
  it('should parse markdown content asynchronously', async () => {
    const markdown = '# Test';
    const result = await parseMarkdownAsync(markdown);
    
    expect(result.html).toContain('<h1>Test</h1>');
  });
});

describe('markdownToHTML', () => {
  it('should convert markdown to HTML', () => {
    const markdown = '# Hello';
    const html = markdownToHTML(markdown);
    
    expect(html).toContain('<h1>Hello</h1>');
  });

  it('should accept custom options', () => {
    const markdown = '~~text~~';
    const html = markdownToHTML(markdown, { gfm: false });
    
    expect(html).toContain('~~');
  });
});

describe('markdownToHTMLAsync', () => {
  it('should convert markdown to HTML asynchronously', async () => {
    const markdown = '# Hello';
    const html = await markdownToHTMLAsync(markdown);
    
    expect(html).toContain('<h1>Hello</h1>');
  });
});

describe('metadata', () => {
  it('should track processing time', () => {
    const markdown = '# Test\n\nSome content.';
    const result = parseMarkdown(markdown);

    expect(result.metadata.parseTime).toBeGreaterThanOrEqual(0);
  });

  it('should count code blocks correctly', () => {
    const markdown = '```js\nconst x = 1;\n```\n\n```python\ny = 2\n```';
    const result = parseMarkdown(markdown);
    
    expect(result.metadata.codeBlocks).toBe(2);
  });

  it('should count mixed code and math', () => {
    const markdown = '```js\nx = 1\n``` and $y = 2$';
    const result = parseMarkdown(markdown);
    
    expect(result.metadata.codeBlocks).toBe(1);
    expect(result.metadata.mathExpressions).toBe(1);
  });
});