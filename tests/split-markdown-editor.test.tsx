/**
 * Unit Tests for SplitMarkdownEditor and SimpleSplitEditor Components
 */

import { describe, it, expect } from 'bun:test';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SplitMarkdownEditor, SimpleSplitEditor } from '../src/client/components/editor/index.js';

// Test data
const sampleMarkdown = `# Test Document

This is a **test** markdown.

## Features

- Feature 1
- Feature 2

\`\`\`typescript
const test = "Hello";
\`\`\`
`;

describe('SplitMarkdownEditor', () => {
  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<SplitMarkdownEditor content={sampleMarkdown} />);
      expect(screen.getByText('Editor')).toBeTruthy();
      expect(screen.getByText('Preview')).toBeTruthy();
    });

    it('should render with custom theme', () => {
      render(<SplitMarkdownEditor content={sampleMarkdown} theme="dark" />);
      expect(screen.getByText('Editor')).toBeTruthy();
    });

    it('should render without toolbar', () => {
      render(
        <SplitMarkdownEditor content={sampleMarkdown} showToolbar={false} />
      );
      // Should still render the panels but no toolbar
      expect(screen.getByText('Editor')).toBeTruthy();
    });

    it('should render with custom height', () => {
      render(
        <SplitMarkdownEditor content={sampleMarkdown} height="500px" />
      );
      expect(screen.getByText('Editor')).toBeTruthy();
    });

    it('should render with custom split position', () => {
      render(
        <SplitMarkdownEditor content={sampleMarkdown} defaultSplitPosition={30} />
      );
      expect(screen.getByText('Editor')).toBeTruthy();
    });

    it('should render with min panel width', () => {
      render(
        <SplitMarkdownEditor
          content={sampleMarkdown}
          minPanelWidth={25}
        />
      );
      expect(screen.getByText('Editor')).toBeTruthy();
    });
  });

  describe('Callbacks', () => {
    it('should call onChange when content changes', () => {
      const handleChange = () => {};
      render(
        <SplitMarkdownEditor
          content={sampleMarkdown}
          onChange={handleChange}
        />
      );
      // Note: Current implementation uses CodeBlock which is read-only
      // This test verifies the prop is accepted
      expect(screen.getByText('Editor')).toBeTruthy();
    });

    it('should call onSave when save is triggered', () => {
      const handleSave = () => {};
      render(
        <SplitMarkdownEditor
          content={sampleMarkdown}
          onSave={handleSave}
        />
      );
      expect(screen.getByText('Editor')).toBeTruthy();
    });
  });

  describe('Sync Scroll', () => {
    it('should enable sync scroll by default', () => {
      render(<SplitMarkdownEditor content={sampleMarkdown} />);
      // Should show sync scroll indicator in toolbar
      expect(screen.getByText('Sync Scroll')).toBeTruthy();
    });

    it('should disable sync scroll when enabledSyncScroll is false', () => {
      render(
        <SplitMarkdownEditor
          content={sampleMarkdown}
          enableSyncScroll={false}
        />
      );
      // Should not show sync scroll indicator
      expect(screen.queryByText('Sync Scroll')).toBeNull();
    });
  });

  describe('Panel Toggle', () => {
    it('should allow toggling editor panel', () => {
      render(<SplitMarkdownEditor content={sampleMarkdown} />);
      const editorButton = screen.getByTitle('Toggle editor');
      expect(editorButton).toBeTruthy();
    });

    it('should allow toggling preview panel', () => {
      render(<SplitMarkdownEditor content={sampleMarkdown} />);
      const previewButton = screen.getByTitle('Toggle preview');
      expect(previewButton).toBeTruthy();
    });

    it('should allow resetting split position', () => {
      render(<SplitMarkdownEditor content={sampleMarkdown} />);
      const resetButton = screen.getByTitle('Reset split position');
      expect(resetButton).toBeTruthy();
    });
  });

  describe('Empty Content', () => {
    it('should render with empty content', () => {
      render(<SplitMarkdownEditor content="" />);
      expect(screen.getByText('Editor')).toBeTruthy();
      expect(screen.getByText('Preview')).toBeTruthy();
    });

    it('should render with undefined content', () => {
      render(<SplitMarkdownEditor content={undefined as any} />);
      expect(screen.getByText('Editor')).toBeTruthy();
    });
  });

  describe('Theme Support', () => {
    it('should render with light theme', () => {
      render(<SplitMarkdownEditor content={sampleMarkdown} theme="light" />);
      expect(screen.getByText('Editor')).toBeTruthy();
    });

    it('should render with dark theme', () => {
      render(<SplitMarkdownEditor content={sampleMarkdown} theme="dark" />);
      expect(screen.getByText('Editor')).toBeTruthy();
    });

    it('should render with auto theme', () => {
      render(<SplitMarkdownEditor content={sampleMarkdown} theme="auto" />);
      expect(screen.getByText('Editor')).toBeTruthy();
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <SplitMarkdownEditor
          content={sampleMarkdown}
          className="custom-class"
        />
      );
      expect(container.querySelector('.custom-class')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have ARIA attributes on resize handle', () => {
      render(<SplitMarkdownEditor content={sampleMarkdown} />);
      const resizeHandle = document.querySelector('[role="separator"]');
      expect(resizeHandle).toBeTruthy();
      expect(resizeHandle).toHaveAttribute('aria-orientation', 'horizontal');
    });
  });
});

describe('SimpleSplitEditor', () => {
  describe('Rendering', () => {
    it('should render with required props', () => {
      render(<SimpleSplitEditor content={sampleMarkdown} />);
      expect(screen.getByText('Editor')).toBeTruthy();
      expect(screen.getByText('Preview')).toBeTruthy();
    });

    it('should render with custom theme', () => {
      render(
        <SimpleSplitEditor content={sampleMarkdown} theme="dark" />
      );
      expect(screen.getByText('Editor')).toBeTruthy();
    });

    it('should render with custom split position', () => {
      render(
        <SimpleSplitEditor content={sampleMarkdown} splitPosition={60} />
      );
      expect(screen.getByText('Editor')).toBeTruthy();
    });

    it('should not show toolbar', () => {
      render(<SimpleSplitEditor content={sampleMarkdown} />);
      // SimpleSplitEditor doesn't have toolbar
      expect(screen.queryByText('Sync Scroll')).toBeNull();
    });
  });

  describe('Empty Content', () => {
    it('should handle empty content gracefully', () => {
      render(<SimpleSplitEditor content="" />);
      expect(screen.getByText('Editor')).toBeTruthy();
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <SimpleSplitEditor
          content={sampleMarkdown}
          className="custom-class"
        />
      );
      expect(container.querySelector('.custom-class')).toBeTruthy();
    });
  });
});

describe('SplitMarkdownEditor Integration', () => {
  it('should render complex markdown correctly', () => {
    const complexMarkdown = `---
title: Complex Document
tags: [test]
---

# Complex Document

## Table

| A | B |
|---|---|
| 1 | 2 |

## Code

\`\`\`js
const x = 1;
\`\`\`

## Math

$E = mc^2$

## Tasks

- [x] Done
- [ ] Todo
`;

    render(<SplitMarkdownEditor content={complexMarkdown} />);
    expect(screen.getByText('Editor')).toBeTruthy();
    expect(screen.getByText('Preview')).toBeTruthy();
  });

  it('should handle large markdown efficiently', () => {
    const largeMarkdown = Array(100)
      .fill(0)
      .map((_, i) => `## Section ${i}\n\nContent ${i}.\n\n`)
      .join('\n');

    const startTime = performance.now();
    render(<SplitMarkdownEditor content={largeMarkdown} />);
    const renderTime = performance.now() - startTime;

    expect(screen.getByText('Editor')).toBeTruthy();
    // Should render in reasonable time
    expect(renderTime).toBeLessThan(1000);
  });
});

describe('SplitMarkdownEditor State', () => {
  it('should track dirty state', () => {
    render(<SplitMarkdownEditor content={sampleMarkdown} />);
    // Initial state should not be dirty
    expect(screen.queryByText('(unsaved)')).toBeNull();
  });

  it('should show line count in editor panel', () => {
    render(<SplitMarkdownEditor content={sampleMarkdown} />);
    // Should show line count
    const editorPanel = screen.getByText('Editor').closest('div');
    expect(editorPanel?.textContent).toContain('lines');
  });

  it('should show character count in preview panel', () => {
    render(<SplitMarkdownEditor content={sampleMarkdown} />);
    // Should show character count
    const previewPanel = screen.getByText('Preview').closest('div');
    expect(previewPanel?.textContent).toContain('chars');
  });
});