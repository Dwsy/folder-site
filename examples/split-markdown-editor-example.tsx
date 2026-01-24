/**
 * Split Markdown Editor Usage Examples
 *
 * Examples demonstrating how to use the SplitMarkdownEditor component
 */

import { useState, useCallback } from 'react';
import { SplitMarkdownEditor, SimpleSplitEditor } from '../src/client/components/editor/index.js';
import type { ThemeMode } from '../src/types/theme.js';

// Example 1: Basic usage with controlled content
export function BasicSplitEditorExample() {
  const [content, setContent] = useState(`# Welcome to Split Markdown Editor

This is a **simple example** of the split markdown editor.

## Features

- Left panel: Code editor
- Right panel: Live preview
- Resizable divider
- Synchronized scrolling

\`\`\`typescript
const greeting = "Hello, World!";
console.log(greeting);
\`\`\`
`);

  const handleChange = useCallback((newContent: string) => {
    setContent(newContent);
    console.log('Content changed, length:', newContent.length);
  }, []);

  const handleSave = useCallback((savedContent: string) => {
    console.log('Saving content:', savedContent.length, 'characters');
    // Implement save logic here
  }, []);

  return (
    <div style={{ height: '600px' }}>
      <SplitMarkdownEditor
        content={content}
        theme="auto"
        defaultSplitPosition={50}
        enableSyncScroll={true}
        showToolbar={true}
        onChange={handleChange}
        onSave={handleSave}
      />
    </div>
  );
}

// Example 2: Dark theme with custom split position
export function DarkThemeExample() {
  const [content] = useState(`# Dark Theme Example

This editor uses the dark theme.

## Code Example

\`\`\`javascript
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}
\`\`\`

## Math Example

$$ f(x) = \\int_{-\\infty}^\\infty \\hat f(\\xi)\\,e^{2\\pi i \\xi x} \\,d\\xi $$
`);

  return (
    <div style={{ height: '500px' }}>
      <SplitMarkdownEditor
        content={content}
        theme="dark"
        defaultSplitPosition={40}
        minPanelWidth={25}
        enableSyncScroll={true}
        showToolbar={true}
      />
    </div>
  );
}

// Example 3: Light theme with wider editor panel
export function LightThemeExample() {
  const [content] = useState(`# Light Theme Example

This editor uses the light theme with a wider editor panel.

## Table Example

| Feature | Status | Priority |
|---------|--------|----------|
| Editing | ✅ | High |
| Preview | ✅ | High |
| Sync | ✅ | Medium |
| Export | 🚧 | Low |

## Task List

- [x] Create component
- [x] Add split functionality
- [x] Implement sync scroll
- [ ] Add export options
- [ ] Improve performance
`);

  return (
    <div style={{ height: '500px' }}>
      <SplitMarkdownEditor
        content={content}
        theme="light"
        defaultSplitPosition={60}
        minPanelWidth={20}
        enableSyncScroll={false}
        showToolbar={true}
      />
    </div>
  );
}

// Example 4: Simple usage (no toolbar)
export function SimpleEditorExample() {
  const [content] = useState(`# Simple Editor

This is a simple split editor without toolbar.

Just the editor and preview panels.
`);

  return (
    <div style={{ height: '400px' }}>
      <SimpleSplitEditor
        content={content}
        theme="auto"
        splitPosition={50}
      />
    </div>
  );
}

// Example 5: With theme switcher
export function ThemeSwitcherExample() {
  const [theme, setTheme] = useState<ThemeMode>('auto');
  const [content] = useState(`# Theme Switcher

Current theme: **{theme}**

Click the buttons above to switch themes.

## Preview

The preview will update to match the selected theme.
`);

  return (
    <div>
      <div style={{ marginBottom: '10px', display: 'flex', gap: '10px' }}>
        <button onClick={() => setTheme('light')}>Light</button>
        <button onClick={() => setTheme('dark')}>Dark</button>
        <button onClick={() => setTheme('auto')}>Auto</button>
      </div>
      <div style={{ height: '500px' }}>
        <SplitMarkdownEditor
          content={content.replace('{theme}', theme)}
          theme={theme}
          defaultSplitPosition={50}
          showToolbar={true}
        />
      </div>
    </div>
  );
}

// Example 6: Full-featured editor with all options
export function FullFeaturedExample() {
  const [content, setContent] = useState(`# Full-Featured Split Editor

This example demonstrates all available features.

## Features Enabled

- ✅ Synchronized scrolling
- ✅ Resizable panels
- ✅ Theme support
- ✅ Toolbar
- ✅ Change callback
- ✅ Save callback

## Complex Content

### Code Block with Language

\`\`\`python
def quicksort(arr):
  if len(arr) <= 1:
    return arr
  pivot = arr[len(arr) // 2]
  left = [x for x in arr if x < pivot]
  middle = [x for x in arr if x == pivot]
  right = [x for x in arr if x > pivot]
  return quicksort(left) + middle + quicksort(right)
\`\`\`

### Mathematical Equations

The Gaussian integral:

$$
\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
$$

### Nested Lists

1. First item
   - Subitem 1
   - Subitem 2
2. Second item
   - Subitem 3
3. Third item

### Blockquote

> "The best way to predict the future is to create it."
> — Peter Drucker

### Inline Code

Use \`const\` for constants, \`let\` for variables, and \`var\` for... well, don't use \`var\`.
`);

  const [isDirty, setIsDirty] = useState(false);

  const handleChange = useCallback((newContent: string) => {
    setContent(newContent);
    setIsDirty(newContent !== content);
  }, [content]);

  const handleSave = useCallback(() => {
    console.log('Saving content...');
    setIsDirty(false);
    // Implement save logic
  }, []);

  return (
    <div style={{ height: '700px' }}>
      <SplitMarkdownEditor
        content={content}
        theme="auto"
        defaultSplitPosition={50}
        minPanelWidth={20}
        enableSyncScroll={true}
        showToolbar={true}
        onChange={handleChange}
        onSave={handleSave}
        height="100%"
      />
      {isDirty && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          padding: '10px 20px',
          background: '#f59e0b',
          color: 'white',
          borderRadius: '6px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
        }}>
          Unsaved changes
        </div>
      )}
    </div>
  );
}

// Example 7: Mobile-friendly (small minPanelWidth)
export function MobileFriendlyExample() {
  const [content] = useState(`# Mobile-Friendly Editor

This editor is optimized for mobile devices.

- Smaller minimum panel width
- Touch-friendly resize handle
- Responsive layout
`);

  return (
    <div style={{ height: '100vh' }}>
      <SplitMarkdownEditor
        content={content}
        theme="auto"
        defaultSplitPosition={50}
        minPanelWidth={15}
        enableSyncScroll={true}
        showToolbar={true}
        height="100%"
      />
    </div>
  );
}

// Example 8: With custom height
export function CustomHeightExample() {
  const [content] = useState(`# Custom Height

This editor has a custom height of 400px.
`);

  return (
    <div style={{ height: '400px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <SplitMarkdownEditor
        content={content}
        theme="auto"
        defaultSplitPosition={50}
        showToolbar={true}
        height="100%"
      />
    </div>
  );
}

// Export all examples
export default {
  BasicSplitEditorExample,
  DarkThemeExample,
  LightThemeExample,
  SimpleEditorExample,
  ThemeSwitcherExample,
  FullFeaturedExample,
  MobileFriendlyExample,
  CustomHeightExample,
};