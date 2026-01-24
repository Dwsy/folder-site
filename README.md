# Folder-Site

> One-command local website generator for documentation and knowledge bases

[![Version](https://img.shields.io/npm/v/folder-site)](https://www.npmjs.com/package/folder-site)
[![License](https://img.shields.io/npm/l/folder-site)](LICENSE)
[![Node](https://img.shields.io/node/v/folder-site)](https://nodejs.org)

**[English](README.md)** | **[中文文档](README.zh-CN.md)**

## ✨ Features

Folder-Site CLI is a powerful command-line tool that transforms any directory into a browsable website, providing a VS Code-like experience for local documentation, knowledge bases, and Workhub integration.

### Core Features

- 🚀 **One-command Launch** - Start a local server with a single command
- 📁 **File Tree Navigation** - Expandable/collapsible directory tree
- 📝 **Markdown Rendering** - Full GFM support with syntax highlighting
- 🔍 **Advanced Search** - File name & content search with ripgrep (< 50ms)
- 🔄 **Live Preview** - Auto-refresh on file changes
- 🌓 **Dark/Light Theme** - Theme switching with persistence
- 🔌 **Plugin System** - Extensible renderer architecture

### Advanced Features

- 📊 **Chart Rendering** - Mermaid, Graphviz, Vega support
- 🎨 **Code Highlighting** - 100+ languages (Shiki)
- 📄 **Export** - Client-side PDF/HTML export
- 🏢 **Workhub Integration** - docs/ structure support
- 👀 **File Watching** - Efficient monitoring via chokidar
- ⚡ **Render Caching** - LRU cache for performance
- ⌨️ **Keyboard Shortcuts** - Full keyboard navigation

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 18.0.0
- **Bun** >= 1.0.0 (recommended)

### Installation

```bash
# Using npm
npm install -g folder-site

# Using yarn
yarn global add folder-site

# Using pnpm
pnpm add -g folder-site

# Using bun
bun install -g folder-site
```

**Current Version**: [v1.0.0](https://www.npmjs.com/package/folder-site)

### Basic Usage

```bash
# Start in current directory
folder-site

# Start in specified directory
folder-site /path/to/docs

# Specify port
folder-site --port 8080

# Use whitelist mode (only show specific files)
folder-site --whitelist "docs/**/*,README.md"

# Show version
folder-site --version

# Show help
folder-site --help
```

Once the server starts, open `http://localhost:3000` in your browser.

## 📖 Documentation

- [Installation Guide](./docs/INSTALLATION.md) - Detailed installation instructions
- [Usage Guide](./docs/USAGE.md) - Complete usage documentation
- [Whitelist Mode](./docs/WHITELIST_MODE.md) - Whitelist configuration guide
- [API Documentation](./docs/API.md) - API interface documentation
- [Troubleshooting](./docs/TROUBLESHOOTING.md) - Common issues and solutions

Design documents are available in the [docs/](./docs/) directory.

## 🛠️ Tech Stack

### Backend

| Technology | Purpose |
|------------|---------|
| **Bun** | Fast JavaScript runtime |
| **Hono** | Lightweight web framework |
| **unified** | Markdown processing pipeline |
| **remark** | Markdown parser |
| **rehype** | HTML converter |
| **chokidar** | File watcher |
| **lru-cache** | Cache implementation |
| **fuse.js** | Fuzzy search |

### Frontend

| Technology | Purpose |
|------------|---------|
| **React** | UI library |
| **Vite** | Build tool |
| **Tailwind CSS** | Styling framework |
| **Radix UI** | Accessible components |
| **Shiki** | Syntax highlighting |
| **jsPDF** | PDF generation |

## 🏗️ Project Structure

```
folder-site/
├── src/
│   ├── cli/              # CLI entry point
│   ├── server/           # Hono server
│   │   ├── routes/       # API routes
│   │   ├── middleware/   # Middleware
│   │   ├── services/     # Business logic
│   │   └── lib/          # Core libraries
│   ├── client/           # React frontend
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   ├── hooks/        # Custom hooks
│   │   └── layouts/      # Layouts
│   ├── parsers/          # File parsers
│   ├── types/            # TypeScript types
│   └── utils/            # Utility functions
├── plugins/              # Plugin directory
│   ├── mermaid-renderer/ # Mermaid plugin
│   └── graphviz-renderer/# Graphviz plugin
├── public/               # Static assets
├── docs/                 # Documentation
├── tests/                # Test files
└── package.json
```

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+P` / `Ctrl+P` | Quick file search with advanced syntax |
| `Esc` | Close modal |
| `↑` / `↓` | Navigate results |
| `Enter` | Open selected file |
| `Cmd+K` / `Ctrl+K` | Toggle command palette |
| `Cmd+D` / `Ctrl+D` | Toggle dark/light theme |

### Advanced Search Syntax

Quick Search now supports powerful logical operators:

```
# Basic search
markdown

# Exact match
"README.md"

# Logical operators
react AND tutorial          # Both terms
vue OR react               # Either term
code AND NOT test          # Exclude term

# Grouping
(react OR vue) AND tutorial
markdown AND (guide OR tutorial) AND NOT draft
```

See [Search Syntax Guide](./docs/guides/search-syntax.md) for more details.

### Search v2 Features

The new search system provides enhanced capabilities:

**Search Modes:**
- **Files** - Search file names only (fastest)
- **Content** - Search file contents using ripgrep
- **Auto** - Search both files and content in parallel

**API Endpoints:**
```bash
# Check tool status
GET /api/search/v2/status

# File name search
GET /api/search/v2/files?q=package&limit=20

# Content search
GET /api/search/v2/content?q=export&limit=50

# Unified search
GET /api/search/v2?q=search&mode=auto

# Cache management
GET /api/search/v2/cache/stats
POST /api/search/v2/cache/clear
```

**Performance:**
- File name search: ~27ms
- Content search: ~34ms
- Cached results: ~5ms (4-6x faster)

See [Search v2 Documentation](./docs/SEARCH_V2.md) for details.

## 📁 Supported File Types

| Extension | Type | Renderer |
|-----------|------|----------|
| `.md` | Markdown | Built-in |
| `.mmd` | Mermaid | Plugin |
| `.txt` | Plain text | Built-in |
| `.json` | JSON | Built-in |
| `.yml` / `.yaml` | YAML | Built-in |

## 🔧 Configuration

### Config File (`.folder-siterc.json`)

```json
{
  "site": {
    "title": "My Documentation Site",
    "description": "A documentation site built with Folder-Site",
    "language": "zh-CN",
    "showGitHubLink": true
  },
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

#### Site Configuration Options

- `title` - Site title (displayed in header)
- `description` - Site description
- `language` - Site language code
- `showGitHubLink` - Show/hide GitHub button (default: `true`)

### Whitelist Mode

Whitelist mode allows you to specify only certain folders and files to display:

```bash
# Use whitelist mode
folder-site --whitelist "docs/**/*,examples/*.md,README.md"
```

See [Whitelist Mode Documentation](./docs/WHITELIST_MODE.md) for details.

### Environment Variables

```bash
# Server port
PORT=3000

# Whitelist mode (comma-separated glob patterns)
WHITELIST="docs/**/*,examples/*.md"
```

## 🤝 Contributing

Contributions are welcome! Please:

1. Read the [design documents](./docs/design-catalog/)
2. Check existing issues
3. Create a feature branch
4. Submit a pull request

## 📄 License

MIT License - See [LICENSE](./LICENSE) file

## 🙏 Acknowledgments

- **markdown-viewer-extension** - Markdown rendering inspiration
- **Radix UI** - Accessible components
- **shadcn/ui** - Beautiful component examples
- **@react-symbols/icons** - File/folder icons
- **RemixIcon** - General icons
- **Vercel** - Design inspiration

## 📞 Contact

- **Issues**: [GitHub Issues](https://github.com/yourusername/folder-site/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/folder-site/discussions)
- **Email**: your.email@example.com

---

**Ready to get started?** → [Quick Start Guide](./docs/INSTALLATION.md) 🚀

## 🔧 Troubleshooting

### Common Issues

#### 500 Internal Server Error

If you see errors like:
```
GET http://localhost:3010/api/files/tree/list net::ERR_ABORTED 500 (Internal Server Error)
```

**Quick Fix**:
```bash
bash scripts/quick-fix.sh
```

Then clear your browser cache and visit `http://localhost:3008`

**Detailed Guide**: See [docs/TROUBLESHOOTING_500_ERROR.md](./docs/TROUBLESHOOTING_500_ERROR.md)

#### Port Already in Use

```bash
# Find process using port 3008
lsof -i :3008

# Kill the process
kill -9 <PID>

# Or use a different port
PORT=3009 bun run dev
```

#### Diagnostic Tool

Run the diagnostic script to check system status:

```bash
bash scripts/diagnose.sh
```

This will show:
- Port usage
- tmux sessions
- API health status
- File tree API status

### Getting Help

If you encounter issues:

1. Run diagnostic script:
   ```bash
   bash scripts/diagnose.sh > diagnosis.txt
   ```

2. Check browser console (F12 > Console)

3. Check server logs

4. Open an issue with the above information

