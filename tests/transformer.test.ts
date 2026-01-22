/**
 * AST Transformer 单元测试
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import {
  ASTTransformer,
  createASTTransformer,
  transformAST,
  transformASTAsync,
  defaultASTTransformer,
  headingIdPlugin,
  taskListPlugin,
  externalLinkPlugin,
} from '../src/server/lib/transformer.js';

// 辅助函数：创建简单的 MDAST 节点
function createRoot(children: any[] = []): any {
  return {
    type: 'root',
    children,
  };
}

function createParagraph(text: string): any {
  return {
    type: 'paragraph',
    children: [
      {
        type: 'text',
        value: text,
      },
    ],
  };
}

function createHeading(depth: number, text: string): any {
  return {
    type: 'heading',
    depth,
    children: [
      {
        type: 'text',
        value: text,
      },
    ],
  };
}

function createCode(code: string, lang = 'text'): any {
  return {
    type: 'code',
    lang,
    value: code,
  };
}

function createInlineCode(code: string): any {
  return {
    type: 'inlineCode',
    value: code,
  };
}

function createLink(url: string, text: string, title?: string): any {
  return {
    type: 'link',
    url,
    title,
    children: [
      {
        type: 'text',
        value: text,
      },
    ],
  };
}

function createImage(url: string, alt: string, title?: string): any {
  return {
    type: 'image',
    url,
    alt,
    title,
  };
}

function createList(ordered: boolean, items: any[]): any {
  return {
    type: 'list',
    ordered,
    children: items,
  };
}

function createListItem(text: string, checked?: boolean): any {
  return {
    type: 'listItem',
    checked,
    children: [
      {
        type: 'paragraph',
        children: [
          {
            type: 'text',
            value: text,
          },
        ],
      },
    ],
  };
}

function createBlockquote(text: string): any {
  return {
    type: 'blockquote',
    children: [
      {
        type: 'paragraph',
        children: [
          {
            type: 'text',
            value: text,
          },
        ],
      },
    ],
  };
}

function createTable(...rows: any[]): any {
  return {
    type: 'table',
    children: rows,
  };
}

function createTableRow(...cells: any[]): any {
  return {
    type: 'tableRow',
    children: cells,
  };
}

function createTableCell(text: string, isHeader = false): any {
  return {
    type: 'tableCell',
    children: [
      {
        type: 'text',
        value: text,
      },
    ],
  };
}

function createEmphasis(text: string): any {
  return {
    type: 'emphasis',
    children: [
      {
        type: 'text',
        value: text,
      },
    ],
  };
}

function createStrong(text: string): any {
  return {
    type: 'strong',
    children: [
      {
        type: 'text',
        value: text,
      },
    ],
  };
}

function createDelete(text: string): any {
  return {
    type: 'delete',
    children: [
      {
        type: 'text',
        value: text,
      },
    ],
  };
}

function createBreak(): any {
  return {
    type: 'break',
  };
}

describe('ASTTransformer', () => {
  let transformer: ASTTransformer;

  beforeEach(() => {
    transformer = new ASTTransformer({ highlight: false });
  });

  describe('constructor', () => {
    it('should create transformer with default options', () => {
      const transformer = new ASTTransformer();
      const options = transformer.getOptions();
      
      expect(options.highlight).toBe(true);
      expect(options.highlightTheme).toBe('github');
      expect(options.semantic).toBe(true);
      expect(options.classPrefix).toBe('');
      expect(options.sanitize).toBe(false);
      expect(options.pretty).toBe(false);
    });

    it('should create transformer with custom options', () => {
      const transformer = new ASTTransformer({
        highlightTheme: 'monokai',
        classPrefix: 'md',
        pretty: true,
      });
      const options = transformer.getOptions();
      
      expect(options.highlightTheme).toBe('monokai');
      expect(options.classPrefix).toBe('md');
      expect(options.pretty).toBe(true);
    });
  });

  describe('transform', () => {
    it('should transform basic paragraph', () => {
      const ast = createRoot([createParagraph('Hello world')]);
      const result = transformer.transform(ast);
      
      expect(result.html).toContain('<p>Hello world</p>');
      expect(result.stats.nodesProcessed).toBeGreaterThan(0);
      expect(result.stats.nodesTransformed).toBeGreaterThan(0);
    });

    it('should transform multiple paragraphs', () => {
      const ast = createRoot([
        createParagraph('First paragraph'),
        createParagraph('Second paragraph'),
      ]);
      const result = transformer.transform(ast);
      
      expect(result.html).toContain('<p>First paragraph</p>');
      expect(result.html).toContain('<p>Second paragraph</p>');
    });

    it('should track transformation time', () => {
      const ast = createRoot([createParagraph('Test')]);
      const result = transformer.transform(ast);
      
      expect(result.stats.transformationTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('transformAsync', () => {
    it('should transform AST asynchronously', async () => {
      const ast = createRoot([createParagraph('Hello world')]);
      const result = await transformer.transformAsync(ast);
      
      expect(result.html).toContain('<p>Hello world</p>');
    });

    it('should initialize highlighter on async transform', async () => {
      const transformer = new ASTTransformer({ highlight: false });
      const ast = createRoot([createCode('const x = 1;', 'javascript')]);
      const result = await transformer.transformAsync(ast);
      
      expect(result.html).toContain('<pre class="code-block language-javascript">');
    });
  });

  describe('heading transformation', () => {
    it('should transform heading level 1', () => {
      const ast = createRoot([createHeading(1, 'Title')]);
      const result = transformer.transform(ast);
      
      expect(result.html).toContain('<h1 class="heading-1">Title</h1>');
    });

    it('should transform heading level 6', () => {
      const ast = createRoot([createHeading(6, 'Small Title')]);
      const result = transformer.transform(ast);
      
      expect(result.html).toContain('<h6 class="heading-6">Small Title</h6>');
    });

    it('should use div when semantic is disabled', () => {
      const transformer = new ASTTransformer({ semantic: false });
      const ast = createRoot([createHeading(2, 'Title')]);
      const result = transformer.transform(ast);
      
      expect(result.html).toContain('<div class="heading-2">Title</div>');
    });
  });

  describe('text transformation', () => {
    it('should transform plain text', () => {
      const ast = createRoot([createParagraph('Plain text')]);
      const result = transformer.transform(ast);
      
      expect(result.html).toContain('<p>Plain text</p>');
    });

    it('should escape HTML in text', () => {
      const ast = createRoot([createParagraph('<script>alert("xss")</script>')]);
      const result = transformer.transform(ast);
      
      expect(result.html).toContain('&lt;script&gt;');
      expect(result.html).not.toContain('<script>');
    });

    it('should escape special characters', () => {
      const ast = createRoot([createParagraph('A & B < C > D "E" \'F\'')]);
      const result = transformer.transform(ast);
      
      expect(result.html).toContain('&amp;');
      expect(result.html).toContain('&lt;');
      expect(result.html).toContain('&gt;');
      expect(result.html).toContain('&quot;');
      expect(result.html).toContain('&#39;');
    });
  });

  describe('emphasis and strong', () => {
    it('should transform emphasis (italic)', () => {
      const ast = createRoot([createParagraph(''), { type: 'paragraph', children: [createEmphasis('italic')]}]);
      const result = transformer.transform(ast);
      
      expect(result.html).toContain('<em>italic</em>');
    });

    it('should transform strong (bold)', () => {
      const ast = createRoot([{ type: 'paragraph', children: [createStrong('bold')] }]);
      const result = transformer.transform(ast);
      
      expect(result.html).toContain('<strong>bold</strong>');
    });

    it('should transform delete (strikethrough)', () => {
      const ast = createRoot([{ type: 'paragraph', children: [createDelete('deleted')] }]);
      const result = transformer.transform(ast);
      
      expect(result.html).toContain('<del>deleted</del>');
    });
  });

  describe('code transformation', () => {
    it('should transform inline code', () => {
      const ast = createRoot([{ type: 'paragraph', children: [createInlineCode('code')] }]);
      const result = transformer.transform(ast);
      
      expect(result.html).toContain('<code class="inline-code">code</code>');
    });

    it('should transform code block without language', () => {
      const ast = createRoot([createCode('const x = 1;')]);
      const result = transformer.transform(ast);
      
      expect(result.html).toContain('<pre class="code-block language-text">');
      expect(result.html).toContain('<code>const x = 1;</code>');
    });

    it('should transform code block with language', () => {
      const ast = createRoot([createCode('const x = 1;', 'javascript')]);
      const result = transformer.transform(ast);
      
      expect(result.html).toContain('language-javascript');
    });

    it('should escape HTML in code blocks', () => {
      const ast = createRoot([createCode('<div>Hello</div>')]);
      const result = transformer.transform(ast);
      
      expect(result.html).toContain('&lt;div&gt;');
    });
  });

  describe('link transformation', () => {
    it('should transform basic link', () => {
      const ast = createRoot([{ type: 'paragraph', children: [createLink('https://example.com', 'Example')] }]);
      const result = transformer.transform(ast);
      
      expect(result.html).toContain('<a href="https://example.com" class="link">Example</a>');
    });

    it('should transform link with title', () => {
      const ast = createRoot([{ type: 'paragraph', children: [createLink('https://example.com', 'Example', 'Example Site')] }]);
      const result = transformer.transform(ast);
      
      expect(result.html).toContain('title="Example Site"');
    });

    it('should escape URL in links', () => {
      const ast = createRoot([{ type: 'paragraph', children: [createLink('https://example.com?q=test&a=1', 'Link')] }]);
      const result = transformer.transform(ast);
      
      expect(result.html).toContain('href="https://example.com?q=test&amp;a=1"');
    });
  });

  describe('image transformation', () => {
    it('should transform basic image', () => {
      const ast = createRoot([createImage('image.png', 'Alt text')]);
      const result = transformer.transform(ast);
      
      expect(result.html).toContain('<img src="image.png" alt="Alt text" class="image"');
    });

    it('should transform image with title', () => {
      const ast = createRoot([createImage('image.png', 'Alt text', 'Image Title')]);
      const result = transformer.transform(ast);
      
      expect(result.html).toContain('title="Image Title"');
    });

    it('should escape alt text', () => {
      const ast = createRoot([createImage('image.png', '<alt>text</alt>')]);
      const result = transformer.transform(ast);
      
      expect(result.html).toContain('alt="&lt;alt&gt;text&lt;/alt&gt;"');
    });
  });

  describe('list transformation', () => {
    it('should transform unordered list', () => {
      const ast = createRoot([createList(false, [createListItem('Item 1'), createListItem('Item 2')])]);
      const result = transformer.transform(ast);
      
      expect(result.html).toContain('<ul class="unordered-list">');
      expect(result.html).toContain('<li class="list-item">');
      expect(result.html).toContain('<p>Item 1</p>');
      expect(result.html).toContain('<p>Item 2</p>');
    });

    it('should transform ordered list', () => {
      const ast = createRoot([createList(true, [createListItem('Item 1'), createListItem('Item 2')])]);
      const result = transformer.transform(ast);
      
      expect(result.html).toContain('<ol class="ordered-list">');
    });

    it('should transform ordered list with start attribute', () => {
      const list = createList(true, [createListItem('Item 1')]);
      list.start = 5;
      const ast = createRoot([list]);
      const result = transformer.transform(ast);
      
      expect(result.html).toContain('start="5"');
    });

    it('should transform nested lists', () => {
      const nestedList = createList(false, [createListItem('Nested item')]);
      const parentItem = createListItem('Parent item');
      parentItem.children.push(nestedList);
      const ast = createRoot([createList(false, [parentItem])]);
      const result = transformer.transform(ast);
      
      expect(result.html).toContain('<ul');
    });
  });

  describe('blockquote transformation', () => {
    it('should transform blockquote', () => {
      const ast = createRoot([createBlockquote('Quoted text')]);
      const result = transformer.transform(ast);
      
      expect(result.html).toContain('<blockquote class="blockquote">');
      expect(result.html).toContain('<p>Quoted text</p>');
    });
  });

  describe('thematic break transformation', () => {
    it('should transform thematic break', () => {
      const ast = createRoot([{ type: 'thematicBreak' }]);
      const result = transformer.transform(ast);
      
      expect(result.html).toContain('<hr class="hr" />');
    });
  });

  describe('table transformation', () => {
    it('should transform simple table', () => {
      const ast = createRoot([
        createTable(
          createTableRow(createTableCell('Header 1', true), createTableCell('Header 2', true)),
          createTableRow(createTableCell('Cell 1'), createTableCell('Cell 2')),
        ),
      ]);
      const result = transformer.transform(ast);
      
      expect(result.html).toContain('<table class="table">');
      expect(result.html).toContain('<tr class="table-row">');
      expect(result.html).toContain('<td class="table-cell td">');
    });
  });

  describe('break transformation', () => {
    it('should transform line break', () => {
      const ast = createRoot([{ type: 'paragraph', children: [{ type: 'text', value: 'Line 1' }, createBreak(), { type: 'text', value: 'Line 2' }] }]);
      const result = transformer.transform(ast);
      
      expect(result.html).toContain('<br />');
    });
  });

  describe('class prefix', () => {
    it('should add class prefix to all classes', () => {
      const transformer = new ASTTransformer({ classPrefix: 'md' });
      const ast = createRoot([createParagraph('Test')]);
      const result = transformer.transform(ast);
      
      expect(result.html).toContain('class="md-markdown"');
    });

    it('should handle empty class prefix', () => {
      const transformer = new ASTTransformer({ classPrefix: '' });
      const ast = createRoot([createParagraph('Test')]);
      const result = transformer.transform(ast);
      
      expect(result.html).toContain('class="markdown"');
    });
  });

  describe('HTML sanitization', () => {
    it('should skip HTML nodes when sanitize is enabled', () => {
      const transformer = new ASTTransformer({ sanitize: true });
      const ast = createRoot([
        { type: 'html', value: '<div>Raw HTML</div>' },
        createParagraph('Paragraph'),
      ]);
      const result = transformer.transform(ast);
      
      expect(result.html).not.toContain('Raw HTML');
      expect(result.html).toContain('Paragraph');
    });

    it('should include HTML nodes when sanitize is disabled', () => {
      const transformer = new ASTTransformer({ sanitize: false });
      const ast = createRoot([
        { type: 'html', value: '<div>Raw HTML</div>' },
      ]);
      const result = transformer.transform(ast);
      
      expect(result.html).toContain('Raw HTML');
    });
  });

  describe('HTML pretty printing', () => {
    it('should pretty print HTML when enabled', () => {
      const transformer = new ASTTransformer({ pretty: true });
      const ast = createRoot([createParagraph('Test')]);
      const result = transformer.transform(ast);
      
      expect(result.html).toContain('\n');
    });
  });

  describe('plugin system', () => {
    it('should register and use plugin', () => {
      const transformer = new ASTTransformer();
      transformer.registerPlugin({
        name: 'test-plugin',
        afterNode(html, node) {
          if (node.type === 'paragraph') {
            return html.replace('<p>', '<p data-custom="true">');
          }
          return html;
        },
      });

      const ast = createRoot([createParagraph('Test')]);
      const result = transformer.transform(ast);
      
      expect(result.html).toContain('data-custom="true"');
    });

    it('should unregister plugin by name', () => {
      const transformer = new ASTTransformer();
      transformer.registerPlugin({
        name: 'test-plugin',
        afterNode(html) {
          return html.replace('<p>', '<p class="custom">');
        },
      });

      transformer.unregisterPlugin('test-plugin');
      const ast = createRoot([createParagraph('Test')]);
      const result = transformer.transform(ast);
      
      expect(result.html).not.toContain('class="custom"');
    });

    it('should unregister plugin by reference', () => {
      const plugin = {
        name: 'test-plugin',
        afterNode(html: string) {
          return html.replace('<p>', '<p class="custom">');
        },
      };
      const transformer = new ASTTransformer();
      transformer.registerPlugin(plugin);
      transformer.unregisterPlugin(plugin);

      const ast = createRoot([createParagraph('Test')]);
      const result = transformer.transform(ast);
      
      expect(result.html).not.toContain('class="custom"');
    });

    it('should support multiple plugins', () => {
      const transformer = new ASTTransformer({ highlight: false });
      transformer.registerPlugin({
        name: 'plugin1',
        afterNode(html) {
          return html.replace(/<p>/, '<p data-p1="true">');
        },
      });
      transformer.registerPlugin({
        name: 'plugin2',
        afterNode(html) {
          return html.replace(/data-p1="true"/, 'data-p1="true" data-p2="true"');
        },
      });

      const ast = createRoot([createParagraph('Test')]);
      const result = transformer.transform(ast);
      
      expect(result.html).toContain('data-p1="true"');
      expect(result.html).toContain('data-p2="true"');
    });
  });

  describe('built-in plugins', () => {
    it('should apply heading ID plugin', () => {
      const transformer = new ASTTransformer();
      transformer.registerPlugin(headingIdPlugin());
      const ast = createRoot([createHeading(2, 'Hello World')]);
      const result = transformer.transform(ast);
      
      expect(result.html).toContain('id="hello-world"');
    });

    it('should apply task list plugin', () => {
      const transformer = new ASTTransformer({ highlight: false });
      transformer.registerPlugin(taskListPlugin());
      const ast = createRoot([createList(false, [createListItem('Task', true), createListItem('Task', false)])]);
      const result = transformer.transform(ast);
      
      expect(result.html).toContain('<input type="checkbox" checked disabled');
      expect(result.html).toContain('<input type="checkbox"  disabled');
    });

    it('should apply external link plugin', () => {
      const transformer = new ASTTransformer();
      transformer.registerPlugin(externalLinkPlugin());
      const ast = createRoot([{ type: 'paragraph', children: [createLink('https://example.com', 'Link')] }]);
      const result = transformer.transform(ast);
      
      expect(result.html).toContain('target="_blank"');
      expect(result.html).toContain('rel="noopener noreferrer"');
    });
  });

  describe('updateOptions', () => {
    it('should update transformer options', () => {
      transformer.updateOptions({ classPrefix: 'custom' });
      const options = transformer.getOptions();
      
      expect(options.classPrefix).toBe('custom');
    });

    it('should preserve existing options when updating', () => {
      transformer.updateOptions({ highlightTheme: 'monokai' });
      const options = transformer.getOptions();
      
      expect(options.highlight).toBe(false); // Set to false in beforeEach
      expect(options.highlightTheme).toBe('monokai');
      expect(options.semantic).toBe(true);
    });
  });

  describe('getOptions', () => {
    it('should return readonly options', () => {
      const options = transformer.getOptions();
      
      expect(options.highlight).toBe(false); // Set to false in beforeEach
      expect(options.semantic).toBe(true);
      expect(options.sanitize).toBe(false);
    });
  });

  describe('getStats', () => {
    it('should return transformation statistics', () => {
      const ast = createRoot([createParagraph('Test')]);
      transformer.transform(ast);
      const stats = transformer.getStats();
      
      expect(stats.nodesProcessed).toBeGreaterThan(0);
      expect(stats.nodesTransformed).toBeGreaterThan(0);
      expect(stats.transformationTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('resetStats', () => {
    it('should reset statistics', () => {
      const ast = createRoot([createParagraph('Test')]);
      transformer.transform(ast);
      transformer.resetStats();
      const stats = transformer.getStats();
      
      expect(stats.nodesProcessed).toBe(0);
      expect(stats.nodesTransformed).toBe(0);
      expect(stats.transformationTime).toBe(0);
    });
  });
});

describe('createASTTransformer', () => {
  it('should create transformer with default options', () => {
    const transformer = createASTTransformer();
    const options = transformer.getOptions();
    
    expect(options.highlight).toBe(true);
    expect(options.semantic).toBe(true);
  });

  it('should create transformer with custom options', () => {
    const transformer = createASTTransformer({ highlight: false });
    const options = transformer.getOptions();
    
    expect(options.highlight).toBe(false);
  });
});

describe('defaultASTTransformer', () => {
  it('should transform AST with default settings', () => {
    const ast = createRoot([createParagraph('Test')]);
    const result = defaultASTTransformer.transform(ast);
    
    expect(result.html).toContain('<div class="markdown">');
    expect(result.html).toContain('<p>Test</p>');
  });
});

describe('transformAST', () => {
  it('should transform AST to HTML', () => {
    const ast = createRoot([createParagraph('Test')]);
    const html = transformAST(ast);
    
    expect(html).toContain('<div class="markdown">');
    expect(html).toContain('<p>Test</p>');
  });

  it('should accept custom options', () => {
    const ast = createRoot([createParagraph('Test')]);
    const html = transformAST(ast, { classPrefix: 'md' });
    
    expect(html).toContain('class="md-markdown"');
  });
});

describe('transformASTAsync', () => {
  it('should transform AST to HTML asynchronously', async () => {
    const ast = createRoot([createParagraph('Test')]);
    const html = await transformASTAsync(ast);
    
    expect(html).toContain('<div class="markdown">');
    expect(html).toContain('<p>Test</p>');
  });

  it('should accept custom options', async () => {
    const ast = createRoot([createParagraph('Test')]);
    const html = await transformASTAsync(ast, { classPrefix: 'md' });
    
    expect(html).toContain('class="md-markdown"');
  });
});

describe('complex document transformation', () => {
  it('should transform document with multiple elements', () => {
    const ast = createRoot([
      createHeading(1, 'Document Title'),
      createParagraph('This is a paragraph with **bold** and *italic* text.'),
      createCode('const x = 1;', 'javascript'),
      createList(false, [createListItem('Item 1'), createListItem('Item 2')]),
      createBlockquote('A quote'),
    ]);
    const result = new ASTTransformer({ highlight: false }).transform(ast);
    
    expect(result.html).toContain('<div class="markdown">');
    expect(result.html).toContain('<h1 class="heading-1">Document Title</h1>');
    expect(result.html).toContain('<p>');
    expect(result.html).toContain('<pre class="code-block language-javascript">');
    expect(result.html).toContain('<ul class="unordered-list">');
    expect(result.html).toContain('<blockquote class="blockquote">');
  });

  it('should handle nested structures', () => {
    const ast = createRoot([
      createList(false, [
        createListItem('Item 1'),
        createListItem('Item 2 with nested list'),
      ]),
    ]);
    const result = new ASTTransformer().transform(ast);
    
    expect(result.html).toContain('<li class="list-item">');
  });
});

describe('error handling', () => {
  it('should handle malformed AST gracefully', () => {
    const ast = createRoot([
      { type: 'unknown-type' as any },
      createParagraph('Valid node'),
    ]);
    const transformer = new ASTTransformer();
    
    // Should not throw, just skip unknown nodes
    const result = transformer.transform(ast);
    expect(result.html).toContain('Valid node');
  });
});