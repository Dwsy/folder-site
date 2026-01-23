# Folder-Site v1.0.0 Release Notes

**Released:** January 23, 2026

---

## 🎉 Introducing Folder-Site CLI

Folder-Site is a powerful command-line tool that transforms any directory into a browsable, VS Code-like website in seconds. Perfect for documentation, knowledge bases, and local file exploration.

### 🚀 What is Folder-Site?

Folder-Site provides an instant, elegant web interface for any folder on your computer. Whether you're managing a documentation site, a knowledge base, or just want to browse your code beautifully, Folder-Site makes it effortless.

---

## ✨ Key Features

### Core Capabilities

- **One-Command Launch** - Start a full-featured web server with a single command
- **Intuitive File Browser** - Expandable, collapsible tree navigation with file type icons
- **Markdown Support** - Full GitHub Flavored Markdown (GFM) with syntax highlighting
- **Instant Search** - Lightning-fast fuzzy file search (Cmd+P) under 100ms
- **Live Preview** - Auto-refresh content as files change
- **Theme Support** - Dark and light themes with user preference persistence

### Advanced Features

- **Chart Rendering** - Built-in support for Mermaid diagrams, Graphviz graphs, and Vega visualizations
- **Code Highlighting** - 100+ programming languages with Shiki syntax highlighting
- **Export Options** - Client-side PDF and HTML export for documentation
- **Workhub Integration** - Native support for docs/ directory structure (ADRs, Issues, PRs)
- **Plugin System** - Extensible architecture for custom renderers
- **Performance Optimized** - LRU caching and efficient file monitoring
- **Keyboard Navigation** - Full keyboard shortcuts for power users
- **Office Document Rendering** - Support for Excel, Word, PDF, and archive files with theme adaptation

---

## 📦 Installation

### Prerequisites

- **Node.js** >= 18.0.0
- **Bun** >= 1.0.0 (recommended for development)

### Install via npm

```bash
npm install -g folder-site
```

### Install via yarn

```bash
yarn global add folder-site
```

### Install via pnpm

```bash
pnpm add -g folder-site
```

### Install via bun

```bash
bun install -g folder-site
```

---

## 🚀 Quick Start

### Basic Usage

```bash
# Start in current directory
folder-site

# Start in a specific directory
folder-site /path/to/docs

# Specify custom port
folder-site --port 8080

# Use whitelist mode (show only specific files)
folder-site --whitelist "docs/**/*,README.md"

# Show help
folder-site --help
```

### Access Your Site

Once started, open your browser and navigate to:

```
http://localhost:3000
```

---

## 🎯 Use Cases

### 1. Documentation Sites

Perfect for project documentation:

```bash
cd my-project
folder-site
```

### 2. Knowledge Bases

Organize your notes and research:

```bash
cd ~/knowledge-base
folder-site --port 8080
```

### 3. Code Review

Browse code with syntax highlighting:

```bash
cd my-repo
folder-site
```

### 4. Workhub Integration

For teams using structured docs:

```bash
cd my-workspace
folder-site
```

Folder-Site automatically recognizes and beautifully displays:
- Architecture Decision Records (ADRs)
- Issues
- Pull Requests

### 5. Office Document Viewing

For browsing Office documents:

```bash
cd my-docs
folder-site
```

Folder-Site provides beautiful rendering for:
- **Excel Spreadsheets** (xlsx, xlsm, xls, csv, ods) - Full table rendering with formatting
- **Word Documents** (docx, dotx) - Rich text display with images and tables
- **PDF Documents** - Page-by-page rendering with navigation
- **Archive Files** (zip, rar, jar, 7z) - Browse contents without extracting

---

## 📁 Supported File Types

| Extension | Type | Renderer |
|-----------|------|----------|
| `.md` | Markdown | Built-in (GFM) |
| `.mmd` | Mermaid Diagrams | Plugin |
| `.txt` | Plain Text | Built-in |
| `.json` | JSON | Built-in |
| `.yml` / `.yaml` | YAML | Built-in |
| `.xlsx`, `.xlsm`, `.xls`, `.csv`, `.ods` | Excel | Office Plugin |
| `.docx`, `.dotx` | Word | Office Plugin |
| `.pdf` | PDF | Office Plugin |
| `.zip`, `.rar`, `.jar`, `.7z` | Archive | Office Plugin |

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+P` / `Ctrl+P` | Quick file search |
| `Esc` | Close modal |
| `↑` / `↓` | Navigate search results |
| `Enter` | Open selected file |
| `Cmd+K` / `Ctrl+K` | Toggle command palette |
| `Cmd+D` / `Ctrl+D` | Toggle dark/light theme |

---

## 🔧 Configuration

### Config File

Create `.folder-siterc.json` in your project root:

```json
{
  "port": 3000,
  "theme": "dark",
  "sidebar": {
    "width": 280,
    "collapsed": false
  },
  "search": {
    "debounce": 50,
    "maxResults": 10
  },
  "cache": {
    "enabled": true,
    "ttl": 3600000
  },
  "build": {
    "whitelist": [
      "docs/**/*",
      "examples/*.md",
      "README.md"
    ]
  }
}
```

### Environment Variables

```bash
# Server port
PORT=3000

# Whitelist mode
WHITELIST="docs/**/*,examples/*.md"
```

---

## 🏗️ Technical Highlights

### Performance

- **LRU Cache** - Intelligent caching for rendered content
- **Efficient File Watching** - Powered by chokidar
- **Lazy Loading** - Content loaded on-demand
- **Fast Search** - Fuse.js fuzzy search under 100ms

### Architecture

- **Modular Design** - Clean separation of concerns
- **Plugin System** - Extensible renderer architecture
- **TypeScript** - Full type safety
- **React** - Modern, component-based UI

### Dependencies

- **Backend**: Bun, Hono, unified, remark, rehype
- **Frontend**: React, Vite, Tailwind CSS, Radix UI
- **Rendering**: Shiki, Mermaid, Graphviz, Vega

---

## 📚 Documentation

For detailed guides and API documentation:

- [Installation Guide](./docs/INSTALLATION.md)
- [Usage Guide](./docs/USAGE.md)
- [Whitelist Mode](./docs/WHITELIST_MODE.md)
- [API Documentation](./docs/API.md)
- [Troubleshooting](./docs/TROUBLESHOOTING.md)

---

## 🛠️ Development

### Setup

```bash
# Clone repository
git clone https://github.com/yourusername/folder-site.git
cd folder-site

# Install dependencies
bun install

# Run in development
bun run dev

# Build
bun run build

# Run tests
bun test
```

---

## 🤝 Contributing

We welcome contributions! Please:

1. Read our [design documents](./docs/design-catalog/)
2. Check existing [issues](https://github.com/yourusername/folder-site/issues)
3. Create a feature branch
4. Submit a pull request

---

## 🐛 Known Issues

Currently no known issues. Found something? Please [report it](https://github.com/yourusername/folder-site/issues).

---

## 🗺️ Roadmap

Future enhancements planned for v1.1.0:

- [ ] More file type renderers (Excel, PowerPoint)
- [ ] Collaborative editing
- [ ] Mobile app
- [ ] Cloud sync
- [ ] Advanced search filters
- [ ] Custom themes

---

## 📄 License

MIT License - See [LICENSE](./LICENSE) file for details.

---

## 🙏 Acknowledgments

We extend our gratitude to:

- **markdown-viewer-extension** - For Markdown rendering inspiration
- **Radix UI** - For accessible, beautiful components
- **shadcn/ui** - For stunning component examples
- **@react-symbols/icons** - For file and folder icons
- **RemixIcon** - For general UI icons
- **Vercel** - For design inspiration

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/folder-site/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/folder-site/discussions)
- **Email**: your.email@example.com

---

## 🎊 What's Next?

Ready to transform your folders into beautiful websites?

```bash
npm install -g folder-site
folder-site
```

Open http://localhost:3000 and explore!

**Happy Documenting!** 📝✨

---

*Folder-Site v1.0.0 - Your files, beautifully presented.*