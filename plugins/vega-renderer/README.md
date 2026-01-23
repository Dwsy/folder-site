# Vega Renderer Plugin

A Folder-Site plugin that renders Vega and Vega-Lite data visualizations to SVG format.

## ✨ Features

- **Dual Specification Support** - Vega & Vega-Lite
- **Theme Support** - light, dark, custom
- **Output Formats** - SVG (recommended), PNG (limited)
- **High-Resolution Output** - Configurable scale factor
- **Built-in Caching** - 5-minute TTL for performance
- **Node.js Compatible** - Works in server-side environments

## 📦 Installation

This plugin is included in Folder-Site. Dependencies:

```json
{
  "vega": "^6.2.0",
  "vega-lite": "^6.4.2",
  "vega-embed": "^7.1.0",
  "jsdom": "^27.4.0"
}
```

## 🚀 Usage

### Basic Example

```typescript
import { VegaRenderer } from './plugins/vega-renderer/VegaRenderer';

// Create renderer
const renderer = new VegaRenderer('vega-lite');

// Vega-Lite specification
const spec = JSON.stringify({
  mark: 'bar',
  data: {
    values: [
      { category: 'A', value: 28 },
      { category: 'B', value: 55 },
      { category: 'C', value: 43 }
    ]
  },
  encoding: {
    x: { field: 'category', type: 'nominal' },
    y: { field: 'value', type: 'quantitative' }
  }
});

// Render to SVG
const svg = await renderer.render(spec, { theme: 'light' });
```

### With Options

```typescript
const svg = await renderer.render(spec, {
  theme: 'dark',           // 'light' | 'dark' | 'custom'
  format: 'svg',           // 'svg' | 'png'
  renderer: 'svg',         // 'svg' | 'canvas'
  scaleFactor: 2,          // Resolution multiplier
  cache: true,             // Enable caching
  config: {                // Custom Vega config
    background: '#1e1e1e'
  }
});
```

## 🎨 Themes

### Built-in Themes

- **light** - Default light theme
- **dark** - Dark theme with light text
- **custom** - Use custom config

### Custom Theme Example

```typescript
const svg = await renderer.render(spec, {
  theme: 'custom',
  config: {
    background: '#1e1e1e',
    axis: {
      labelColor: '#ffffff',
      titleColor: '#ffffff'
    },
    legend: {
      labelColor: '#ffffff',
      titleColor: '#ffffff'
    }
  }
});
```

## 📊 Supported Specifications

### Vega-Lite (Recommended)

```typescript
const renderer = new VegaRenderer('vega-lite');

const spec = {
  mark: 'point',
  data: { values: [{ x: 1, y: 2 }, { x: 2, y: 4 }] },
  encoding: {
    x: { field: 'x', type: 'quantitative' },
    y: { field: 'y', type: 'quantitative' }
  }
};
```

### Vega

```typescript
const renderer = new VegaRenderer('vega');

const spec = {
  $schema: 'https://vega.github.io/schema/vega/v5.json',
  width: 400,
  height: 200,
  // ... full Vega specification
};
```

## ⚙️ Configuration

### Default Options

```typescript
{
  theme: 'light',
  format: 'svg',
  renderer: 'svg',      // Changed from 'canvas' for Node.js compatibility
  scaleFactor: 2,
  cache: true,
  config: {}
}
```

### Cache Management

```typescript
// Clear cache manually
renderer.clearCache();

// Cache TTL: 5 minutes (automatic)
```

## 🔧 Technical Details

### Node.js Environment

This plugin uses JSDOM to simulate a browser DOM environment in Node.js:

```typescript
// Automatically initialized
if (typeof window === 'undefined') {
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'http://localhost',
    pretendToBeVisual: true,
  });
  // ... DOM globals setup
}
```

### Performance

- **First render**: ~8ms
- **Cached render**: ~0ms
- **Cache hit rate**: 100% for identical specs

## ⚠️ Known Limitations

1. **PNG Export**
   - Limited support in Node.js environment
   - Requires canvas support (not included by default)
   - **Recommendation**: Use SVG format

2. **JSDOM Performance**
   - DOM simulation has overhead
   - Mitigated by caching mechanism

3. **Empty Specifications**
   - Empty specs generate empty charts (no error)
   - Validate specs before rendering

## 🐛 Troubleshooting

### Error: "document is not defined"

**Solution**: Ensure JSDOM is installed and initialized (automatic in this plugin).

### Error: "Canvas not found"

**Solution**: Use SVG renderer instead of canvas:

```typescript
const svg = await renderer.render(spec, { renderer: 'svg' });
```

### Slow Rendering

**Solution**: Enable caching (enabled by default):

```typescript
const svg = await renderer.render(spec, { cache: true });
```

## 📚 Resources

- [Vega Documentation](https://vega.github.io/vega/)
- [Vega-Lite Documentation](https://vega.github.io/vega-lite/)
- [Vega Editor](https://vega.github.io/editor/)

## 📄 License

MIT
