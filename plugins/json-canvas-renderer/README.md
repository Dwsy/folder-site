# JSON Canvas Renderer Plugin

A Folder-Site plugin that renders [JSON Canvas](https://jsoncanvas.org/) format to visual diagrams.

## ✨ Features

- **Multiple Node Types** - text, file, link, group
- **Edge Support** - Bezier curves with arrows and labels
- **Theme Support** - light, dark, custom
- **Auto Layout** - Automatic canvas bounds calculation
- **Text Wrapping** - Intelligent text line breaking
- **Built-in Caching** - 5-minute TTL for performance
- **Pure SVG Output** - No external dependencies

## 📦 Installation

This plugin is included in Folder-Site. No additional dependencies required.

## 🚀 Usage

### Basic Example

```typescript
import { JSONCanvasRenderer } from './plugins/json-canvas-renderer/JSONCanvasRenderer';

// Create renderer
const renderer = new JSONCanvasRenderer();

// JSON Canvas specification
const canvas = JSON.stringify({
  nodes: [
    {
      id: "1",
      type: "text",
      x: 0,
      y: 0,
      width: 150,
      height: 80,
      text: "Start"
    },
    {
      id: "2",
      type: "text",
      x: 300,
      y: 0,
      width: 150,
      height: 80,
      text: "End"
    }
  ],
  edges: [
    {
      id: "e1",
      fromNode: "1",
      toNode: "2",
      label: "connects to"
    }
  ]
});

// Render to SVG
const svg = await renderer.render(canvas, { theme: 'light' });
```

### With Options

```typescript
const svg = await renderer.render(canvas, {
  theme: 'dark',           // 'light' | 'dark' | 'custom'
  format: 'svg',           // 'svg' only (PNG not supported)
  cache: true,             // Enable caching
  colors: {                // Custom colors
    background: '#1e1e1e',
    text: '#ffffff',
    border: '#444444',
    edge: '#888888'
  }
});
```

## 🎨 Node Types

### Text Node

```typescript
{
  id: "text-1",
  type: "text",
  x: 0,
  y: 0,
  width: 200,
  height: 100,
  text: "This is a text node\nwith multiple lines",
  color: "#ffffff"  // Optional background color
}
```

### File Node

```typescript
{
  id: "file-1",
  type: "file",
  x: 250,
  y: 0,
  width: 200,
  height: 100,
  file: "path/to/document.pdf"
}
```

### Link Node

```typescript
{
  id: "link-1",
  type: "link",
  x: 500,
  y: 0,
  width: 200,
  height: 100,
  url: "https://example.com"
}
```

### Group Node

```typescript
{
  id: "group-1",
  type: "group",
  x: 0,
  y: 150,
  width: 400,
  height: 300,
  label: "Group Label"
}
```

## 🔗 Edges

### Basic Edge

```typescript
{
  id: "edge-1",
  fromNode: "node-1",
  toNode: "node-2"
}
```

### Edge with Label

```typescript
{
  id: "edge-2",
  fromNode: "node-1",
  toNode: "node-2",
  label: "connects to"
}
```

### Edge with Sides

```typescript
{
  id: "edge-3",
  fromNode: "node-1",
  fromSide: "right",    // 'top' | 'right' | 'bottom' | 'left'
  toNode: "node-2",
  toSide: "left"
}
```

## 🎨 Themes

### Built-in Themes

#### Light Theme (Default)

```typescript
{
  background: '#ffffff',
  text: '#000000',
  border: '#cccccc',
  edge: '#666666',
  groupBorder: '#999999',
  groupBackground: '#f5f5f5'
}
```

#### Dark Theme

```typescript
{
  background: '#1e1e1e',
  text: '#ffffff',
  border: '#444444',
  edge: '#888888',
  groupBorder: '#666666',
  groupBackground: '#2a2a2a'
}
```

### Custom Theme

```typescript
const svg = await renderer.render(canvas, {
  theme: 'custom',
  colors: {
    background: '#0d1117',
    text: '#c9d1d9',
    border: '#30363d',
    edge: '#8b949e',
    groupBorder: '#21262d',
    groupBackground: '#161b22'
  }
});
```

## 📊 Complete Example

```typescript
const canvas = {
  nodes: [
    // Text nodes
    {
      id: "start",
      type: "text",
      x: 0,
      y: 0,
      width: 150,
      height: 80,
      text: "Start Process",
      color: "#e3f2fd"
    },
    {
      id: "process",
      type: "text",
      x: 200,
      y: 0,
      width: 150,
      height: 80,
      text: "Process Data",
      color: "#fff3e0"
    },
    {
      id: "end",
      type: "text",
      x: 400,
      y: 0,
      width: 150,
      height: 80,
      text: "End Process",
      color: "#f3e5f5"
    },
    
    // File node
    {
      id: "doc",
      type: "file",
      x: 200,
      y: 120,
      width: 150,
      height: 60,
      file: "output.json"
    },
    
    // Group
    {
      id: "group",
      type: "group",
      x: -20,
      y: -20,
      width: 590,
      height: 220,
      label: "Workflow"
    }
  ],
  edges: [
    {
      id: "e1",
      fromNode: "start",
      toNode: "process",
      label: "input"
    },
    {
      id: "e2",
      fromNode: "process",
      toNode: "end",
      label: "output"
    },
    {
      id: "e3",
      fromNode: "process",
      toNode: "doc",
      label: "save"
    }
  ]
};

const renderer = new JSONCanvasRenderer();
const svg = await renderer.render(JSON.stringify(canvas), { theme: 'light' });
```

## ⚙️ Configuration

### Default Options

```typescript
{
  theme: 'light',
  format: 'svg',
  cache: true,
  colors: undefined  // Use theme defaults
}
```

### Cache Management

```typescript
// Clear cache manually
renderer.clearCache();

// Cache TTL: 5 minutes (automatic)
```

## 🔧 Technical Details

### Auto Layout

The renderer automatically calculates canvas bounds:

```typescript
// Automatic padding: 20px
// Automatic bounds calculation based on node positions
```

### Text Wrapping

Text is automatically wrapped to fit node width:

```typescript
// Max line width: node.width - 20px (10px padding each side)
// Line height: 20px
```

### Edge Rendering

Edges use Bezier curves for smooth connections:

```typescript
// Control point offset: 50px
// Arrow size: 8px
// Label offset: 5px above edge
```

## 📈 Performance

- **Render time**: <1ms (pure string operations)
- **Cache hit rate**: 100% for identical specs
- **Memory usage**: Minimal (no DOM manipulation)

## ⚠️ Known Limitations

1. **PNG Export**
   - Not supported (SVG only)
   - Convert SVG to PNG using external tools if needed

2. **Complex Layouts**
   - No automatic node positioning
   - Manual layout required

3. **Text Overflow**
   - Long words may overflow node bounds
   - Use `\n` for manual line breaks

## 🐛 Troubleshooting

### Error: "Invalid JSON"

**Solution**: Ensure canvas is valid JSON:

```typescript
const canvas = JSON.stringify({ nodes: [], edges: [] });
```

### Nodes Not Visible

**Solution**: Check node coordinates and canvas bounds:

```typescript
// Ensure nodes are within positive coordinates
{ x: 0, y: 0, width: 100, height: 100 }
```

### Edges Not Connecting

**Solution**: Verify node IDs match:

```typescript
{
  fromNode: "node-1",  // Must match a node.id
  toNode: "node-2"     // Must match a node.id
}
```

## 📚 Resources

- [JSON Canvas Specification](https://jsoncanvas.org/)
- [Obsidian Canvas](https://obsidian.md/canvas) - Popular implementation

## 📄 License

MIT
