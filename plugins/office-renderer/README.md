# Office Renderer Plugin

A powerful plugin for Folder-Site CLI that renders Microsoft Office documents and archive files directly in the browser.

## Features

### Excel Renderer (.xlsx, .xls, .csv, .ods, .xlsm)

- **Full spreadsheet support** with SheetJS
- **Multiple sheets** rendered as tabs
- **Rich cell formatting** including:
  - Numbers, dates, booleans
  - Cell colors and borders
  - Merged cells
  - Formulas and calculations
- **Responsive tables** with scroll support
- **Large file optimization** with virtual scrolling
- **Theme adaptation** for light/dark modes
- **Max file size**: 10MB

### Word Renderer (.docx, .dotx)

- **Document rendering** with docx-preview
- **Rich text support** including:
  - Headings and paragraphs
  - Lists (ordered/unordered)
  - Tables and images
  - Bold, italic, underline
  - Hyperlinks
- **Page layout preservation**
- **Theme-aware styling**
- **Max file size**: 10MB

### PDF Renderer (.pdf)

- **Multi-page PDF rendering** with PDF.js
- **Page navigation** (previous/next)
- **Zoom controls** (scale up/down)
- **Text selection and copy**
- **Responsive layout**
- **Performance optimized** with page caching
- **Max file size**: 50MB

### Archive Renderer (.zip, .rar, .jar)

- **Archive browsing** with adm-zip
- **File tree navigation**
- **File extraction and preview**
- **Archive metadata display**
- **Max file size**: 100MB

## Installation

This plugin is included in the Folder-Site CLI project. It is automatically loaded when Folder-Site starts.

## Usage

### Automatic Rendering

The plugin automatically renders supported file types when they are opened in Folder-Site:

```bash
# Start Folder-Site
folder-site /path/to/your/documents

# Open a file in the browser
# Supported formats will be rendered automatically
```

### Manual Usage (API)

```typescript
import { OfficeRendererPlugin } from './plugins/office-renderer';

const plugin = new OfficeRendererPlugin();
await plugin.initialize(context);
await plugin.activate();

// Get specific renderer
const excelRenderer = plugin.getRenderer('excel');
const wordRenderer = plugin.getRenderer('word');
const pdfRenderer = plugin.getRenderer('pdf');
const archiveRenderer = plugin.getRenderer('archive');

// Render a file
const result = await excelRenderer.render('/path/to/file.xlsx', {
  theme: 'light',
  sheetIndex: 0,
});
```

## Configuration

### Excel Renderer Options

```typescript
interface ExcelRenderOptions {
  theme: 'light' | 'dark';
  sheetIndex?: number;           // Sheet to display (0-based)
  showHeaders?: boolean;         // Show row/column headers
  maxRows?: number;              // Max rows to render (default: 1000)
  maxCols?: number;              // Max columns to render (default: 50)
  virtualScroll?: boolean;       // Enable virtual scrolling
}
```

### Word Renderer Options

```typescript
interface WordRenderOptions {
  theme: 'light' | 'dark';
  width?: number;                // Container width (px)
  height?: number;               // Container height (px)
}
```

### PDF Renderer Options

```typescript
interface PDFRenderOptions {
  theme: 'light' | 'dark';
  pageScale?: number;            // Zoom level (0.5 - 3.0)
  currentPage?: number;          // Starting page (1-based)
  enableTextSelection?: boolean; // Allow text selection
  cachePages?: boolean;          // Cache rendered pages
}
```

### Archive Renderer Options

```typescript
interface ArchiveRenderOptions {
  theme: 'light' | 'dark';
  maxDepth?: number;             // Max directory depth (default: 10)
  showHidden?: boolean;          // Show hidden files
  sortBy?: 'name' | 'size' | 'type';
}
```

## Plugin Integration

The plugin integrates with Folder-Site's plugin system:

```typescript
import { OfficeRendererPlugin } from './plugins/office-renderer';
import type { PluginContext } from '../types/plugin';

const plugin = new OfficeRendererPlugin();
const context: PluginContext = {
  app: { version: '1.0.0', environment: 'production', rootPath: '/path', configPath: '/path/config' },
  services: {},
  events: { on: () => ({ dispose: () => {} }), emit: () => {} },
  logger: { debug: () => {}, info: () => {}, warn: () => {}, error: () => {} },
  storage: { get: () => undefined, set: () => {} },
  utils: {},
  config: { get: () => undefined, set: () => {} },
};

await plugin.initialize(context);
await plugin.activate();

// Get all renderers
const renderers = plugin.getRenderers();
console.log('Available renderers:', Object.keys(renderers));

// Use a specific renderer
const excelRenderer = plugin.getRenderer('excel');
const html = await excelRenderer.render(fileBuffer, options);
```

## Supported File Extensions

| Renderer | Extensions | Max Size |
|----------|-----------|----------|
| **Excel** | `.xlsx`, `.xlsm`, `.xls`, `.csv`, `.ods` | 10MB |
| **Word** | `.docx`, `.dotx` | 10MB |
| **PDF** | `.pdf` | 50MB |
| **Archive** | `.zip`, `.rar`, `.jar` | 100MB |

## Security Features

- **File type validation** with magic number checking
- **File size limits** to prevent DoS attacks
- **XSS protection** with DOMPurify sanitization
- **Secure file handling** in sandboxed environment
- **Input validation** for all user inputs

## Performance Optimizations

- **LRU caching** for rendered content
- **Lazy loading** of renderers
- **Virtual scrolling** for large Excel files
- **Page caching** for PDF documents
- **Efficient memory management** with cleanup

## Browser Compatibility

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Opera: ✅ Full support

## Dependencies

The plugin uses the following libraries:

- **xlsx** (SheetJS) - Excel file parsing
- **docx-preview** - Word document rendering
- **pdfjs-dist** - PDF rendering
- **adm-zip** - Archive handling
- **dompurify** - XSS protection

## Troubleshooting

### Excel files not rendering

- Ensure file size is under 10MB
- Check file format is supported (.xlsx, .xls, .csv, .ods)
- Verify file is not corrupted

### PDF rendering issues

- Ensure file size is under 50MB
- Check PDF is not password protected
- Try reloading the page

### Archive files not opening

- Ensure file size is under 100MB
- Verify archive format is supported (.zip, .rar, .jar)
- Check archive is not corrupted

## Roadmap

Future enhancements:

- [ ] PowerPoint (.pptx) support
- [ ] Excel editing capabilities
- [ ] PDF annotation tools
- [ ] More archive formats (.7z, .tar, .gz)
- [ ] Export to other formats
- [ ] Collaborative editing
- [ ] Advanced Excel features (charts, pivot tables)

## License

MIT

## Author

Folder-Site Team

## Related Plugins

- [Mermaid Renderer](../mermaid-renderer/) - Diagram rendering
- [Graphviz Renderer](../graphviz-renderer/) - Graph visualization
- [Vega Renderer](../vega-renderer/) - Data visualization

---

**Version**: 1.0.0  
**Last Updated**: 2026-01-23