/**
 * Unit Tests for MarkdownRenderer and MarkdownPreview
 *
 * Tests the integration of the Markdown parser and renderer components
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MarkdownRenderer } from '../src/client/components/editor/MarkdownRenderer.js';
import { MarkdownPreview } from '../src/client/components/editor/MarkdownPreview.js';

// Mock the parsers module
const mockParseResult = {
  ast: { type: 'root', children: [] },
  frontmatter: { title: 'Test Document' },
  html: '<h1>Hello World</h1><p>This is <strong>test</strong> content.</p>',
  content: '# Hello World\n\nThis is **test** content.',
  metadata: {
    codeBlocks: 0,
    mathExpressions: 0,
    tables: 0,
    taskListItems: 0,
    links: 0,
    images: 0,
    parseTime: 10,
    hasFrontmatter: true,
  },
};

// Test data
const simpleMarkdown = '# Hello World\n\nThis is **bold** and *italic* text.';

const markdownWithGfm = `
| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
| Cell 3   | Cell 4   |

- [x] Task 1 (completed)
- [ ] Task 2 (pending)

~~Strikethrough text~~
`;

const markdownWithCode = `
\`\`\`typescript
const greeting: string = "Hello, World!";
console.log(greeting);
\`\`\`

Inline \`code\` example.
`;

const markdownWithFrontmatter = `---
title: Test Document
description: A test markdown file
tags: [test, markdown]
---

# Content

This is the content.
`;

const markdownWithMath = `
Inline math: $E = mc^2$

Block math:
$$
\\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}
$$
`;

const emptyMarkdown = '';

const invalidMarkdown = `
# Invalid markdown
[Broken link](incomplete
`;

describe('MarkdownRenderer', () => {
  describe('Rendering', () => {
    it('should render simple markdown', () => {
      const { container } = render(
        <MarkdownRenderer content={simpleMarkdown} />
      );

      expect(container.innerHTML).toContain('Hello World');
      expect(container.innerHTML).toContain('bold');
      expect(container.innerHTML).toContain('italic');
    });

    it('should render markdown with GFM features', () => {
      const { container } = render(
        <MarkdownRenderer content={markdownWithGfm} />
      );

      // Check for table
      expect(container.innerHTML).toContain('table');
      expect(container.innerHTML).toContain('Header 1');
      expect(container.innerHTML).toContain('Cell 1');

      // Check for task list
      expect(container.innerHTML).toContain('Task 1');
      expect(container.innerHTML).toContain('Task 2');

      // Check for strikethrough
      expect(container.innerHTML).toContain('Strikethrough text');
    });

    it('should render markdown with code blocks', () => {
      const { container } = render(
        <MarkdownRenderer content={markdownWithCode} />
      );

      expect(container.innerHTML).toContain('typescript');
      expect(container.innerHTML).toContain('const greeting');
      expect(container.innerHTML).toContain('console.log');
    });

    it('should render markdown with frontmatter', () => {
      const { container } = render(
        <MarkdownRenderer content={markdownWithFrontmatter} showFrontmatter />
      );

      expect(container.innerHTML).toContain('Test Document');
      expect(container.innerHTML).toContain('A test markdown file');
      expect(container.innerHTML).toContain('test');
      expect(container.innerHTML).toContain('markdown');
    });

    it('should render markdown with math formulas', () => {
      const { container } = render(
        <MarkdownRenderer content={markdownWithMath} enableMath />
      );

      expect(container.innerHTML).toContain('E = mc^2');
    });

    it('should render empty markdown', () => {
      const { container } = render(
        <MarkdownRenderer content={emptyMarkdown} />
      );

      expect(container.innerHTML).toContain('No Content');
    });

    it('should handle invalid markdown gracefully', () => {
      const { container } = render(
        <MarkdownRenderer content={invalidMarkdown} />
      );

      // Should not throw an error
      expect(container).toBeTruthy();
    });
  });

  describe('Theme Support', () => {
    it('should apply light theme', () => {
      const { container } = render(
        <MarkdownRenderer content={simpleMarkdown} theme="light" />
      );

      expect(container.querySelector('.markdown-preview')).toBeTruthy();
    });

    it('should apply dark theme', () => {
      const { container } = render(
        <MarkdownRenderer content={simpleMarkdown} theme="dark" />
      );

      expect(container.querySelector('.markdown-preview')).toBeTruthy();
    });

    it('should apply auto theme', () => {
      const { container } = render(
        <MarkdownRenderer content={simpleMarkdown} theme="auto" />
      );

      expect(container.querySelector('.markdown-preview')).toBeTruthy();
    });
  });

  describe('GFM Features', () => {
    it('should render tables', () => {
      const { container } = render(
        <MarkdownRenderer content={markdownWithGfm} enableGfm />
      );

      const table = container.querySelector('table');
      expect(table).toBeTruthy();
      expect(table?.querySelectorAll('th')).toHaveLength(2);
      expect(table?.querySelectorAll('td')).toHaveLength(4);
    });

    it('should render task lists', () => {
      const { container } = render(
        <MarkdownRenderer content={markdownWithGfm} enableGfm />
      );

      // Check for task list items
      const checkboxes = container.querySelectorAll('input[type="checkbox"]');
      expect(checkboxes.length).toBeGreaterThan(0);
    });

    it('should render strikethrough', () => {
      const { container } = render(
        <MarkdownRenderer content={markdownWithGfm} enableGfm />
      );

      expect(container.innerHTML).toContain('Strikethrough text');
    });
  });

  describe('Copy Functionality', () => {
    it('should show copy button when enabled', () => {
      const { container } = render(
        <MarkdownRenderer content={simpleMarkdown} showCopyButton />
      );

      const copyButton = container.querySelector('button[title*="Copy"]');
      expect(copyButton).toBeTruthy();
    });

    it('should not show copy button when disabled', () => {
      const { container } = render(
        <MarkdownRenderer content={simpleMarkdown} showCopyButton={false} />
      );

      const copyButton = container.querySelector('button[title*="Copy"]');
      expect(copyButton).toBeFalsy();
    });
  });

  describe('Error Handling', () => {
    it('should call onError callback when rendering fails', async () => {
      const onError = jest.fn();

      // Mock a scenario that causes an error
      render(
        <MarkdownRenderer
          content={null as any}
          onError={onError}
        />
      );

      await waitFor(() => {
        expect(onError).toHaveBeenCalled();
      });
    });

    it('should show error state when rendering fails', async () => {
      const { container } = render(
        <MarkdownRenderer content={null as any} />
      );

      await waitFor(() => {
        expect(container.innerHTML).toContain('Error');
      });
    });

    it('should call onRetry callback when retry button is clicked', async () => {
      const onRetry = jest.fn();

      const { container } = render(
        <MarkdownRenderer
          content={null as any}
          onRetry={onRetry}
        />
      );

      await waitFor(() => {
        expect(container.innerHTML).toContain('Error');
      });

      const retryButton = container.querySelector('button');
      if (retryButton) {
        retryButton.click();
        expect(onRetry).toHaveBeenCalled();
      }
    });
  });

  describe('Loading State', () => {
    it('should show loading state initially', () => {
      const { container } = render(
        <MarkdownRenderer content={simpleMarkdown} />
      );

      // Initially shows loading state
      expect(container.innerHTML).toContain('Rendering');
    });

    it('should show rendered content after loading', async () => {
      const { container } = render(
        <MarkdownRenderer content={simpleMarkdown} />
      );

      await waitFor(() => {
        expect(container.innerHTML).toContain('Hello World');
      });
    });
  });

  describe('Metadata Display', () => {
    it('should show metadata when enabled', async () => {
      const { container } = render(
        <MarkdownRenderer content={markdownWithGfm} showMetadata />
      );

      await waitFor(() => {
        expect(container.innerHTML).toContain('tables');
        expect(container.innerHTML).toContain('tasks');
      });
    });

    it('should not show metadata when disabled', async () => {
      const { container } = render(
        <MarkdownRenderer content={markdownWithGfm} showMetadata={false} />
      );

      await waitFor(() => {
        // Should not have metadata footer
        const metadataFooter = container.querySelector('.text-xs.text-muted-foreground');
        expect(metadataFooter).toBeFalsy();
      });
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <MarkdownRenderer content={simpleMarkdown} className="custom-class" />
      );

      expect(container.querySelector('.custom-class')).toBeTruthy();
    });

    it('should apply custom maxHeight', () => {
      const { container } = render(
        <MarkdownRenderer content={simpleMarkdown} maxHeight="500px" />
      );

      const preview = container.querySelector('.markdown-preview');
      expect(preview?.getAttribute('style')).toContain('max-height: 500px');
    });
  });
});

describe('MarkdownPreview', () => {
  describe('Rendering', () => {
    it('should render markdown content', async () => {
      const { container } = render(
        <MarkdownPreview content={simpleMarkdown} />
      );

      await waitFor(() => {
        expect(container.innerHTML).toContain('Hello World');
      });
    });

    it('should render markdown with frontmatter', async () => {
      const { container } = render(
        <MarkdownPreview
          content={markdownWithFrontmatter}
          showFrontmatter
        />
      );

      await waitFor(() => {
        expect(container.innerHTML).toContain('Frontmatter');
        expect(container.innerHTML).toContain('Test Document');
      });
    });

    it('should render markdown with GFM features', async () => {
      const { container } = render(
        <MarkdownPreview content={markdownWithGfm} enableGfm />
      );

      await waitFor(() => {
        expect(container.innerHTML).toContain('table');
        expect(container.innerHTML).toContain('Task 1');
      });
    });

    it('should render markdown with math', async () => {
      const { container } = render(
        <MarkdownPreview content={markdownWithMath} enableMath />
      );

      await waitFor(() => {
        expect(container.innerHTML).toContain('E = mc^2');
      });
    });

    it('should render empty markdown', async () => {
      const { container } = render(
        <MarkdownPreview content={emptyMarkdown} />
      );

      await waitFor(() => {
        expect(container.innerHTML).toContain('No Content');
      });
    });
  });

  describe('Theme Support', () => {
    it('should apply light theme', async () => {
      const { container } = render(
        <MarkdownPreview content={simpleMarkdown} theme="light" />
      );

      await waitFor(() => {
        expect(container.innerHTML).toContain('Hello World');
      });
    });

    it('should apply dark theme', async () => {
      const { container } = render(
        <MarkdownPreview content={simpleMarkdown} theme="dark" />
      );

      await waitFor(() => {
        expect(container.innerHTML).toContain('Hello World');
      });
    });

    it('should apply auto theme', async () => {
      const { container } = render(
        <MarkdownPreview content={simpleMarkdown} theme="auto" />
      );

      await waitFor(() => {
        expect(container.innerHTML).toContain('Hello World');
      });
    });
  });

  describe('Copy Functionality', () => {
    it('should show copy button when enabled', async () => {
      const { container } = render(
        <MarkdownPreview content={simpleMarkdown} showCopyButton />
      );

      await waitFor(() => {
        const copyButton = container.querySelector('button[title*="Copy"]');
        expect(copyButton).toBeTruthy();
      });
    });

    it('should not show copy button when disabled', async () => {
      const { container } = render(
        <MarkdownPreview content={simpleMarkdown} showCopyButton={false} />
      );

      await waitFor(() => {
        const copyButton = container.querySelector('button[title*="Copy"]');
        expect(copyButton).toBeFalsy();
      });
    });
  });

  describe('Error Handling', () => {
    it('should call onError callback when rendering fails', async () => {
      const onError = jest.fn();

      render(
        <MarkdownPreview content={null as any} onError={onError} />
      );

      await waitFor(() => {
        expect(onError).toHaveBeenCalled();
      });
    });

    it('should show error state', async () => {
      const { container } = render(
        <MarkdownPreview content={null as any} />
      );

      await waitFor(() => {
        expect(container.innerHTML).toContain('Rendering Error');
      });
    });

    it('should call onRetry callback', async () => {
      const onRetry = jest.fn();

      const { container } = render(
        <MarkdownPreview content={null as any} onRetry={onRetry} />
      );

      await waitFor(() => {
        expect(container.innerHTML).toContain('Rendering Error');
      });

      const retryButton = container.querySelector('button');
      if (retryButton) {
        retryButton.click();
        expect(onRetry).toHaveBeenCalled();
      }
    });
  });

  describe('Loading State', () => {
    it('should show loading state', () => {
      const { container } = render(
        <MarkdownPreview content={simpleMarkdown} />
      );

      expect(container.innerHTML).toContain('Rendering');
    });

    it('should show rendered content after loading', async () => {
      const { container } = render(
        <MarkdownPreview content={simpleMarkdown} />
      );

      await waitFor(() => {
        expect(container.innerHTML).toContain('Hello World');
      });
    });
  });

  describe('Metadata Display', () => {
    it('should show metadata', async () => {
      const { container } = render(
        <MarkdownPreview content={markdownWithGfm} />
      );

      await waitFor(() => {
        expect(container.innerHTML).toContain('code blocks');
        expect(container.innerHTML).toContain('tables');
        expect(container.innerHTML).toContain('tasks');
      });
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className', async () => {
      const { container } = render(
        <MarkdownPreview content={simpleMarkdown} className="custom-class" />
      );

      await waitFor(() => {
        expect(container.querySelector('.custom-class')).toBeTruthy();
      });
    });

    it('should apply custom maxHeight', async () => {
      const { container } = render(
        <MarkdownPreview content={simpleMarkdown} maxHeight="500px" />
      );

      await waitFor(() => {
        const preview = container.querySelector('.markdown-preview');
        expect(preview?.getAttribute('style')).toContain('max-height: 500px');
      });
    });
  });
});

describe('MarkdownRenderer Integration', () => {
  it('should integrate with markdown parser', async () => {
    const { container } = render(
      <MarkdownRenderer content={markdownWithFrontmatter} />
    );

    await waitFor(() => {
      expect(container.innerHTML).toContain('Content');
    });
  });

  it('should handle complex markdown with all features', async () => {
    const complexMarkdown = `
---
title: Complex Document
tags: [test, complex]
---

# Complex Document

## Table of Contents

| Feature | Status |
|---------|--------|
| Tables  | ✓      |
| Tasks   | ✓      |
| Code    | ✓      |

## Tasks

- [x] Create component
- [ ] Write tests
- [ ] Add documentation

## Code

\`\`\`typescript
const data: Record<string, any> = {
  title: "Test",
  value: 42
};
\`\`\`

## Math

$E = mc^2$

## Links

[Example](https://example.com)

## Images

![Alt text](image.png)
`;

    const { container } = render(
      <MarkdownRenderer content={complexMarkdown} showFrontmatter />
    );

    await waitFor(() => {
      expect(container.innerHTML).toContain('Complex Document');
      expect(container.innerHTML).toContain('table');
      expect(container.innerHTML).toContain('Create component');
      expect(container.innerHTML).toContain('const data');
      expect(container.innerHTML).toContain('E = mc^2');
      expect(container.innerHTML).toContain('Example');
    });
  });
});

describe('Performance', () => {
  it('should render large markdown efficiently', async () => {
    const largeMarkdown = Array(100)
      .fill(0)
      .map((_, i) => `## Section ${i}\n\nContent for section ${i}.\n\n`)
      .join('\n');

    const startTime = performance.now();
    const { container } = render(<MarkdownRenderer content={largeMarkdown} />);

    await waitFor(() => {
      expect(container.innerHTML).toContain('Section 0');
      expect(container.innerHTML).toContain('Section 99');
    });

    const renderTime = performance.now() - startTime;
    expect(renderTime).toBeLessThan(1000); // Should render in under 1 second
  });
});