# Mermaid Renderer Plugin

A plugin for Folder-Site CLI that renders Mermaid diagrams to SVG and other formats.

## Features

- Supports 13+ Mermaid diagram types:
  - Flowchart (流程图)
  - Sequence Diagram (时序图)
  - Class Diagram (类图)
  - State Diagram (状态图)
  - Gantt Chart (甘特图)
  - Entity Relationship Diagram (实体关系图)
  - Pie Chart (饼图)
  - Mindmap (思维导图)
  - Git Graph (Git 图)
  - Journey Diagram (用户旅程图)
  - Timeline (时间线)
  - Graph (通用图)
  - C4 Architecture Diagram (C4 架构图)

- Theme support: light, dark, custom
- Output formats: SVG, PNG
- Configurable options: font size, font family, background color
- Built-in caching for performance
- Comprehensive error handling

## Installation

This plugin is included in the Folder-Site CLI project.

## Usage

### Basic Usage

```typescript
import { MermaidRenderer } from './MermaidRenderer';

const renderer = new MermaidRenderer();

const mermaidCode = `
flowchart TD
  A[开始] --> B{条件}
  B -->|是| C[执行]
  B -->|否| D[跳过]
  C --> E[结束]
  D --> E
`;

const svg = await renderer.render(mermaidCode, {
  theme: 'light',
  format: 'svg',
});
```

### With Custom Options

```typescript
const svg = await renderer.render(mermaidCode, {
  theme: 'dark',
  format: 'svg',
  fontSize: 20,
  fontFamily: 'Arial',
  backgroundColor: '#ffffff',
  svgOptions: {
    includeXmlDeclaration: true,
    compress: false,
  },
});
```

### Parse and Validate

```typescript
const result = renderer.parse(mermaidCode);
if (result.success) {
  console.log('Diagram type:', result.diagramType);
} else {
  console.error('Parse error:', result.error);
}
```

## Plugin Integration

The plugin integrates with Folder-Site's plugin system:

```typescript
import { MermaidRendererPlugin } from './index';
import type { PluginContext } from '../../types/plugin';

const plugin = new MermaidRendererPlugin();
const context: PluginContext = {
  app: { version: '0.1.0', environment: 'production', rootPath: '/path', configPath: '/path/config' },
  services: {},
  events: { on: () => ({ dispose: () => {} }), emit: () => {} },
  logger: { debug: () => {}, info: () => {}, warn: () => {}, error: () => {} },
  storage: { get: () => undefined, set: () => {} },
  utils: {},
  config: { get: () => undefined, set: () => {} },
};

await plugin.initialize(context);
await plugin.activate();

const renderer = plugin.getRenderer();
const svg = await renderer.render(mermaidCode);
```

## Configuration

The plugin supports the following configuration options:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `theme` | `'light' \| 'dark' \| 'custom'` | `'light'` | Diagram theme |
| `format` | `'svg' \| 'png'` | `'svg'` | Output format |
| `fontSize` | `number` | `16` | Font size (10-32) |
| `fontFamily` | `string` | `'sans-serif'` | Font family |
| `backgroundColor` | `string` | `'transparent'` | Background color |
| `cache` | `boolean` | `true` | Enable caching |

## Supported File Extensions

- `.mmd`
- `.mermaid`
- `.md` (for embedded Mermaid blocks)

## Testing

Run the tests:

```bash
bun test tests/mermaid-renderer.test.ts
```

**Note**: Some tests are skipped because Mermaid.js requires a full browser DOM environment. These tests will work correctly in actual browser usage.

## Browser Environment

This plugin requires a browser environment for rendering. When used in Node.js (e.g., for testing), it uses JSDOM to provide a simulated DOM.

## License

MIT

## Author

Folder-Site Team