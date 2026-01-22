/**
 * Content Display Component Unit Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ContentDisplay } from '../src/client/components/editor/ContentDisplay';
import { CodeBlock } from '../src/client/components/editor/CodeBlock';

// Mock shiki for syntax highlighting
const mockShikiHighlighter = {
  codeToHtml: async (code: string, lang: string) => {
    return `<pre class="shiki"><code>${code}</code></pre>`;
  },
};

// Mock the dynamic import of shiki
vi.mock('shiki', async (importOriginal) => {
  const actual = await importOriginal<typeof import('shiki')>();
  return {
    ...actual,
    getHighlighter: async () => mockShikiHighlighter,
  };
});

describe('ContentDisplay', () => {
  const defaultProps = {
    content: 'Hello, World!',
    language: 'text',
    filename: 'test.txt',
  };

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup after each test
  });

  describe('Rendering', () => {
    it('should render text content correctly', () => {
      render(<ContentDisplay {...defaultProps} />);
      expect(screen.getByText('Hello, World!')).toBeInTheDocument();
    });

    it('should display filename', () => {
      render(<ContentDisplay {...defaultProps} filename="example.ts" />);
      expect(screen.getByText('example.ts')).toBeInTheDocument();
    });

    it('should render loading state', () => {
      render(<ContentDisplay {...defaultProps} loading={true} />);
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should render error state', () => {
      render(
        <ContentDisplay
          {...defaultProps}
          error={new Error('Failed to load content')}
        />
      );
      expect(screen.getByText(/error/i)).toBeInTheDocument();
      expect(screen.getByText(/failed to load content/i)).toBeInTheDocument();
    });

    it('should render empty state', () => {
      render(<ContentDisplay {...defaultProps} content="" />);
      expect(screen.getByText(/no content/i)).toBeInTheDocument();
    });
  });

  describe('Display Modes', () => {
    it('should render code mode for code languages', () => {
      render(
        <ContentDisplay
          {...defaultProps}
          content="const x = 1;"
          language="typescript"
          displayMode="code"
        />
      );
      expect(screen.getByText('const x = 1;')).toBeInTheDocument();
    });

    it('should render preview mode for markdown', () => {
      render(
        <ContentDisplay
          {...defaultProps}
          content="# Title\n\nContent"
          language="markdown"
          displayMode="preview"
        />
      );
      expect(screen.getByText('Title')).toBeInTheDocument();
    });

    it('should render raw mode as plain text', () => {
      render(
        <ContentDisplay
          {...defaultProps}
          content="const x = 1;"
          language="typescript"
          displayMode="raw"
        />
      );
      expect(screen.getByText('const x = 1;')).toBeInTheDocument();
    });
  });

  describe('Language Detection', () => {
    it('should detect TypeScript language', () => {
      render(
        <ContentDisplay
          {...defaultProps}
          filename="test.ts"
          content="const x: string = 'hello';"
        />
      );
      expect(screen.getByText(/typescript/i)).toBeInTheDocument();
    });

    it('should detect JavaScript language', () => {
      render(
        <ContentDisplay
          {...defaultProps}
          filename="test.js"
          content="const x = 'hello';"
        />
      );
      expect(screen.getByText(/javascript/i)).toBeInTheDocument();
    });

    it('should detect Python language', () => {
      render(
        <ContentDisplay
          {...defaultProps}
          filename="test.py"
          content="x = 'hello'"
        />
      );
      expect(screen.getByText(/python/i)).toBeInTheDocument();
    });

    it('should detect Markdown language', () => {
      render(
        <ContentDisplay
          {...defaultProps}
          filename="test.md"
          content="# Header"
        />
      );
      expect(screen.getByText(/markdown/i)).toBeInTheDocument();
    });

    it('should default to plain text for unknown languages', () => {
      render(
        <ContentDisplay
          {...defaultProps}
          filename="test.unknown"
          content="some content"
        />
      );
      expect(screen.getByText(/plain text/i)).toBeInTheDocument();
    });
  });

  describe('Interactive Features', () => {
    it('should toggle line numbers', async () => {
      render(
        <ContentDisplay
          {...defaultProps}
          content="line1\nline2\nline3"
          language="typescript"
          showLineNumbers={true}
        />
      );

      const lineNumbersToggle = screen.getByRole('button', {
        name: /toggle line numbers/i,
      });
      expect(lineNumbersToggle).toBeInTheDocument();

      fireEvent.click(lineNumbersToggle);
      await waitFor(() => {
        expect(screen.queryByText('1')).not.toBeInTheDocument();
      });
    });

    it('should toggle word wrap', async () => {
      render(
        <ContentDisplay
          {...defaultProps}
          content="const veryLongLine = 'this is a very long line of code that should wrap';"
          language="typescript"
          wrapLines={false}
        />
      );

      const wrapToggle = screen.getByRole('button', {
        name: /toggle word wrap/i,
      });
      expect(wrapToggle).toBeInTheDocument();

      fireEvent.click(wrapToggle);
      await waitFor(() => {
        expect(wrapToggle).toHaveAttribute('aria-pressed', 'true');
      });
    });

    it('should copy code to clipboard', async () => {
      const mockWriteText = vi.fn().mockResolvedValue(undefined);
      global.navigator.clipboard = {
        writeText: mockWriteText,
        readText: vi.fn(),
      } as any;

      render(
        <ContentDisplay
          {...defaultProps}
          content="const x = 1;"
          language="typescript"
        />
      );

      const copyButton = screen.getByRole('button', { name: /copy/i });
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(mockWriteText).toHaveBeenCalledWith('const x = 1;');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', () => {
      render(
        <ContentDisplay
          {...defaultProps}
          error={new Error('Network Error: Failed to fetch')}
        />
      );
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });

    it('should handle parsing errors', () => {
      render(
        <ContentDisplay
          {...defaultProps}
          error={new Error('Parse Error: Invalid syntax')}
        />
      );
      expect(screen.getByText(/parse error/i)).toBeInTheDocument();
    });

    it('should show retry button on error', () => {
      const mockOnRetry = vi.fn();
      render(
        <ContentDisplay
          {...defaultProps}
          error={new Error('Failed to load')}
          onRetry={mockOnRetry}
        />
      );

      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();

      fireEvent.click(retryButton);
      expect(mockOnRetry).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(
        <ContentDisplay
          {...defaultProps}
          filename="test.ts"
          language="typescript"
        />
      );

      const codeBlock = screen.getByRole('region', {
        name: /code content/i,
      });
      expect(codeBlock).toBeInTheDocument();
    });

    it('should announce loading state', () => {
      render(<ContentDisplay {...defaultProps} loading={true} />);
      const loading = screen.getByRole('status');
      expect(loading).toBeInTheDocument();
    });

    it('should announce error state', () => {
      render(
        <ContentDisplay
          {...defaultProps}
          error={new Error('Test error')}
        />
      );
      const error = screen.getByRole('alert');
      expect(error).toBeInTheDocument();
    });

    it('should be keyboard navigable', () => {
      render(
        <ContentDisplay
          {...defaultProps}
          content="line1\nline2"
          language="typescript"
        />
      );

      const copyButton = screen.getByRole('button', { name: /copy/i });
      copyButton.focus();
      expect(copyButton).toHaveFocus();
    });
  });

  describe('Performance', () => {
    it('should handle large files efficiently', () => {
      const largeContent = Array(1000)
        .fill('line of code')
        .join('\n');

      const startTime = performance.now();
      render(
        <ContentDisplay
          {...defaultProps}
          content={largeContent}
          language="typescript"
        />
      );
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should render in less than 1 second
    });

    it('should not re-render unnecessarily', () => {
      const { rerender } = render(
        <ContentDisplay
          {...defaultProps}
          content="const x = 1;"
          language="typescript"
        />
      );

      const initialRenderCount = screen.getAllByText('const x = 1;').length;
      rerender(
        <ContentDisplay
          {...defaultProps}
          content="const x = 1;"
          language="typescript"
        />
      );

      expect(screen.getAllByText('const x = 1;').length).toBe(initialRenderCount);
    });
  });

  describe('Customization', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <ContentDisplay
          {...defaultProps}
          className="custom-class"
        />
      );
      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });

    it('should apply custom theme', () => {
      render(
        <ContentDisplay
          {...defaultProps}
          theme="monokai"
          content="const x = 1;"
          language="typescript"
        />
      );
      const codeBlock = screen.getByRole('region');
      expect(codeBlock).toHaveClass(/monokai/i);
    });

    it('should respect maxLines prop', () => {
      render(
        <ContentDisplay
          {...defaultProps}
          content="line1\nline2\nline3\nline4\nline5"
          language="typescript"
          maxLines={3}
        />
      );
      // Should only show first 3 lines
      expect(screen.getByText(/showing first 3 lines/i)).toBeInTheDocument();
    });
  });
});

describe('CodeBlock', () => {
  const defaultProps = {
    code: 'const x = 1;',
    language: 'typescript',
    filename: 'test.ts',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Syntax Highlighting', () => {
    it('should highlight TypeScript code', async () => {
      render(<CodeBlock {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText('const x = 1;')).toBeInTheDocument();
      });
    });

    it('should highlight JavaScript code', async () => {
      render(
        <CodeBlock
          {...defaultProps}
          code="const x = 'hello';"
          language="javascript"
        />
      );
      await waitFor(() => {
        expect(screen.getByText("const x = 'hello';")).toBeInTheDocument();
      });
    });

    it('should highlight Python code', async () => {
      render(
        <CodeBlock
          {...defaultProps}
          code="def hello():\n    return 'world'"
          language="python"
        />
      );
      await waitFor(() => {
        expect(screen.getByText('def hello():')).toBeInTheDocument();
      });
    });

    it('should handle unsupported languages gracefully', async () => {
      render(
        <CodeBlock
          {...defaultProps}
          code="some code"
          language="unknown-language"
        />
      );
      await waitFor(() => {
        expect(screen.getByText('some code')).toBeInTheDocument();
      });
    });
  });

  describe('Line Numbers', () => {
    it('should show line numbers when enabled', async () => {
      render(
        <CodeBlock
          {...defaultProps}
          code="line1\nline2\nline3"
          showLineNumbers={true}
        />
      );
      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
      });
    });

    it('should not show line numbers when disabled', async () => {
      render(
        <CodeBlock
          {...defaultProps}
          code="line1\nline2\nline3"
          showLineNumbers={false}
        />
      );
      await waitFor(() => {
        expect(screen.queryByText('1')).not.toBeInTheDocument();
      });
    });

    it('should start from custom line number', async () => {
      render(
        <CodeBlock
          {...defaultProps}
          code="line1\nline2"
          showLineNumbers={true}
          startLineNumber={10}
        />
      );
      await waitFor(() => {
        expect(screen.getByText('10')).toBeInTheDocument();
        expect(screen.getByText('11')).toBeInTheDocument();
      });
    });
  });

  describe('Copy to Clipboard', () => {
    it('should copy code to clipboard', async () => {
      const mockWriteText = vi.fn().mockResolvedValue(undefined);
      global.navigator.clipboard = {
        writeText: mockWriteText,
        readText: vi.fn(),
      } as any;

      render(<CodeBlock {...defaultProps} />);

      const copyButton = screen.getByRole('button', { name: /copy/i });
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(mockWriteText).toHaveBeenCalledWith('const x = 1;');
      });
    });

    it('should show success message after copying', async () => {
      const mockWriteText = vi.fn().mockResolvedValue(undefined);
      global.navigator.clipboard = {
        writeText: mockWriteText,
        readText: vi.fn(),
      } as any;

      render(<CodeBlock {...defaultProps} />);

      const copyButton = screen.getByRole('button', { name: /copy/i });
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(screen.getByText(/copied/i)).toBeInTheDocument();
      });
    });
  });

  describe('Word Wrap', () => {
    it('should wrap long lines when enabled', async () => {
      render(
        <CodeBlock
          {...defaultProps}
          code="const veryLongLine = 'this is a very long line of code that should wrap when word wrap is enabled';"
          wrapLines={true}
        />
      );
      await waitFor(() => {
        const codeBlock = screen.getByRole('region');
        expect(codeBlock).toHaveClass(/whitespace-pre-wrap/i);
      });
    });

    it('should not wrap long lines when disabled', async () => {
      render(
        <CodeBlock
          {...defaultProps}
          code="const veryLongLine = 'this is a very long line of code that should wrap when word wrap is enabled';"
          wrapLines={false}
        />
      );
      await waitFor(() => {
        const codeBlock = screen.getByRole('region');
        expect(codeBlock).toHaveClass(/whitespace-pre/i);
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      render(<CodeBlock {...defaultProps} />);

      await waitFor(() => {
        const codeBlock = screen.getByRole('region');
        expect(codeBlock).toHaveAttribute('aria-label');
      });
    });

    it('should announce language to screen readers', async () => {
      render(<CodeBlock {...defaultProps} language="typescript" />);

      await waitFor(() => {
        expect(screen.getByText(/typescript/i)).toBeInTheDocument();
      });
    });
  });
});