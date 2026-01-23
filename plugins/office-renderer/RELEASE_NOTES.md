# Office Document Renderer Plugin v1.0.0 Release Notes

**Released:** January 23, 2026

---

## 🎉 Introducing Office Document Renderer

Office Document Renderer is a powerful plugin for Folder-Site CLI that enables rendering of Microsoft Office documents, PDFs, and archive files directly in the browser.

### 🚀 What is Office Document Renderer?

This plugin extends Folder-Site's capabilities to display Office documents, PDFs, and archive files with a VS Code-like browsing experience. Perfect for documentation sites that include technical specifications, reports, and archived resources.

---

## ✨ Key Features

### Supported Document Types

#### Excel Spreadsheets
- **Formats**: xlsx, xlsm, xls, csv, ods
- **Features**:
  - Full spreadsheet rendering with formatting
  - Cell styling preservation (colors, fonts, borders)
  - Formula evaluation support
  - Multiple sheet navigation
  - Max file size: 10MB

#### Word Documents
- **Formats**: docx, dotx
- **Features**:
  - Rich text rendering
  - Paragraph and heading formatting
  - Image support
  - Table rendering
  - Max file size: 10MB

#### PDF Documents
- **Formats**: pdf
- **Features**:
  - Page-by-page rendering
  - Text selection support
  - Zoom controls
  - Navigation between pages
  - Max file size: 50MB

#### Archive Files
- **Formats**: zip, rar, jar
- **Features**:
  - Archive content browsing
  - File tree navigation
  - File extraction preview
  - Max file size: 100MB

### Advanced Features

- **File Type Validation**: Magic number verification for security
- **XSS Protection**: Sanitized HTML output
- **Performance Caching**: LRU cache for rendered content (max 10MB)
- **Theme Support**: Light and dark themes with CSS variables
- **Error Handling**: Comprehensive error messages and logging
- **Plugin Integration**: Seamless integration with Folder-Site's plugin system

---

## 📦 Installation

### Prerequisites

- **Folder-Site CLI** >= 1.0.0
- **Node.js** >= 18.0.0
- **Bun** >= 1.0.0 (recommended for development)

### Installation

The plugin is included in the Folder-Site CLI project. No separate installation required.

If you're using Folder-Site, the Office Document Renderer is automatically available when you place Office files in your documentation directory.

---

## 🚀 Usage

### Basic Usage

Simply place your Office files in your Folder-Site directory and start the server:

```bash
cd /path/to/your/docs
folder-site
```

Office files will be automatically detected and rendered when you click on them.

### Supported File Extensions

| Extension | Type | Renderer |
|-----------|------|----------|
| `.xlsx` | Excel Spreadsheet | ExcelRenderer |
| `.xlsm` | Excel Macro-Enabled Workbook | ExcelRenderer |
| `.xls` | Excel 97-2003 Workbook | ExcelRenderer |
| `.csv` | Comma-Separated Values | ExcelRenderer |
| `.ods` | OpenDocument Spreadsheet | ExcelRenderer |
| `.docx` | Word Document | WordRenderer |
| `.dotx` | Word Template | WordRenderer |
| `.pdf` | Portable Document Format | PDFRenderer |
| `.zip` | ZIP Archive | ArchiveRenderer |
| `.rar` | RAR Archive | ArchiveRenderer |
| `.jar` | Java Archive | ArchiveRenderer |

### Example Directory Structure

```
your-docs/
├── README.md
├── docs/
│   ├── spec.xlsx
│   ├── report.docx
│   ├── manual.pdf
│   └── archives.zip
└── folder-site
```

---

## 🔧 Configuration

### Plugin Configuration

The plugin can be configured via Folder-Site's configuration file:

```json
{
  "plugins": {
    "office-renderer": {
      "cache": {
        "enabled": true,
        "maxSize": 10485760
      },
      "theme": "auto",
      "security": {
        "validateFileTypes": true,
        "sanitizeHtml": true,
        "maxFileSize": {
          "excel": 10485760,
          "word": 10485760,
          "pdf": 52428800,
          "archive": 104857600
        }
      }
    }
  }
}
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `cache.enabled` | `boolean` | `true` | Enable rendering cache |
| `cache.maxSize` | `number` | `10485760` | Maximum cache size in bytes (10MB) |
| `theme` | `'light' \| 'dark' \| 'auto'` | `'auto'` | Theme mode |
| `security.validateFileTypes` | `boolean` | `true` | Validate file types using magic numbers |
| `security.sanitizeHtml` | `boolean` | `true` | Sanitize HTML output for XSS protection |
| `security.maxFileSize.excel` | `number` | `10485760` | Max Excel file size (10MB) |
| `security.maxFileSize.word` | `number` | `10485760` | Max Word file size (10MB) |
| `security.maxFileSize.pdf` | `number` | `52428800` | Max PDF file size (50MB) |
| `security.maxFileSize.archive` | `number` | `104857600` | Max archive file size (100MB) |

---

## 🏗️ Technical Details

### Renderer Architecture

The plugin implements a renderer-based architecture with four main components:

```
OfficeRendererPlugin
├── ExcelRenderer (SheetJS)
├── WordRenderer (docx-preview)
├── PDFRenderer (PDF.js)
└── ArchiveRenderer (adm-zip)
```

### Dependencies

| Renderer | Library | License |
|----------|---------|---------|
| Excel | [SheetJS (xlsx)](https://github.com/SheetJS/sheetjs) | Apache-2.0 |
| Word | [docx-preview](https://github.com/mwilliamson/java-mammoth) | MIT |
| PDF | [PDF.js](https://github.com/mozilla/pdf.js) | Apache-2.0 |
| Archive | [adm-zip](https://github.com/cthackers/adm-zip) | MIT |

### Security Features

1. **File Type Validation**
   - Magic number verification
   - Extension validation
   - MIME type checking

2. **XSS Protection**
   - HTML sanitization
   - Content Security Policy
   - Safe rendering of user content

3. **File Size Limits**
   - Configurable limits per file type
   - Prevents memory exhaustion
   - Blocks potential DoS attacks

---

## 📚 Documentation

For detailed guides and API documentation:

- [Folder-Site Documentation](../../docs/)
- [Plugin Development Guide](../../docs/plugin-development.md)
- [API Reference](../../docs/api.md)

---

## 🧪 Testing

The plugin includes comprehensive tests for all renderers:

```bash
# Run all tests
bun test

# Run specific renderer tests
bun test tests/office-renderer.test.ts
```

---

## 🐛 Known Issues

Currently no known issues. Found something? Please [report it](https://github.com/yourusername/folder-site/issues).

---

## 🗺️ Roadmap

Future enhancements planned for v1.1.0:

- [ ] IndexedDB persistent caching
- [ ] Virtual scrolling for large Excel tables
- [ ] Web Worker optimization for PDF rendering
- [ ] PowerPoint support (.pptx, .pptm)
- [ ] Outlook message support (.msg, .eml)
- [ ] Editing capabilities for supported formats
- [ ] Export to PDF/HTML
- [ ] Advanced search within documents

---

## 📄 License

MIT License - See [LICENSE](../../LICENSE) file for details.

---

## 🙏 Acknowledgments

We extend our gratitude to:

- **SheetJS team** - For the excellent Excel parsing library
- **docx-preview** - For Word document rendering
- **Mozilla PDF.js** - For PDF rendering capabilities
- **adm-zip** - For archive handling
- **Folder-Site Team** - For the plugin system architecture

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/folder-site/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/folder-site/discussions)
- **Email**: team@folderr-site.com

---

## 🎊 Getting Started

Ready to view Office documents in Folder-Site?

```bash
cd /path/to/your/docs
folder-site
```

Open http://localhost:3000 and browse your Office files!

**Happy Document Viewing!** 📄✨

---

*Office Document Renderer v1.0.0 - Your Office files, beautifully rendered.*