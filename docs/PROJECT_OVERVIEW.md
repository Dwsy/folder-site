# Folder-Site CLI - Project Overview

> One-command local website generator for documentation and knowledge bases

## 🎯 Project Vision

Transform any directory into a browsable website with a single command, providing a VS Code-like experience for local documentation, knowledge bases, and Workhub integration.

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Documentation](#documentation)
- [Getting Started](#getting-started)
- [Development](#development)
- [Roadmap](#roadmap)

---

## ✨ Features

### Core Features

- ✅ **Single Command Execution** - `folder-site` starts local server instantly
- ✅ **VS Code-like Interface** - Familiar sidebar + editor layout
- ✅ **File Tree Navigation** - Expandable/collapsible directory tree
- ✅ **Markdown Rendering** - Full GFM support with syntax highlighting
- ✅ **Quick Search** - Cmd+P fuzzy file search (< 100ms)
- ✅ **Real-time Preview** - Auto-refresh on file changes
- ✅ **Dark/Light Theme** - Toggle with persistence
- ✅ **Plugin System** - Extensible renderer architecture

### Advanced Features

- ✅ **Chart Rendering** - Mermaid, Graphviz, Vega support
- ✅ **Code Highlighting** - 100+ languages with Shiki
- ✅ **Export to PDF/HTML** - Client-side export options
- ✅ **Workhub Integration** - docs/ structure support
- ✅ **File Watching** - Efficient chokidar-based watcher
- ✅ **Render Caching** - LRU cache for performance
- ✅ **Keyboard Shortcuts** - Full keyboard navigation

---

## 🛠️ Tech Stack

### Backend

| Technology | Purpose |
|------------|---------|
| **Bun** | Fast JavaScript runtime |
| **Hono** | Lightweight web framework |
| **unified** | Markdown processing pipeline |
| **remark** | Markdown parser |
| **rehype** | HTML transformer |
| **chokidar** | File watcher |
| **lru-cache** | Cache implementation |
| **fuse.js** | Fuzzy search |

### Frontend

| Technology | Purpose |
|------------|---------|
| **React** | UI library |
| **Vite** | Build tool |
| **Tailwind CSS** | Styling |
| **Radix UI** | Accessible primitives |
| **shadcn/ui** | Styled components |
| **@react-symbols/icons** | File/folder icons |
| **RemixIcon** | General icons |
| **Shiki** | Syntax highlighting |
| **jsPDF** | PDF generation |

### Design System

- **Style**: Minimalism & Swiss Style
- **Colors**: Blue primary (#3B82F6) + Orange CTA (#F97316)
- **Fonts**: JetBrains Mono (headings) + IBM Plex Sans (body)
- **Layout**: VS Code-inspired

---

## 🏗️ Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│                   CLI Entry Point                    │
│                  (Bun Runtime)                       │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────┴──────────────────────────────────┐
│                  Hono Server                         │
│  ┌──────────┬──────────┬──────────┬──────────┐     │
│  │  API     │  Files   │  Search  │  Static  │     │
│  │ Routes   │ Routes   │ Routes   │  Serve   │     │
│  └──────────┴──────────┴──────────┴──────────┘     │
└──────────────────┬──────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
┌───────▼────────┐   ┌────────▼────────┐
│   Renderer     │   │  Plugin System  │
│   Engine       │   │                 │
│  - Markdown    │   │  - Mermaid      │
│  - AST         │   │  - Graphviz     │
│  - Theme       │   │  - Custom       │
└────────────────┘   └─────────────────┘
        │
┌───────▼────────┐
│  React Client  │
│  ┌──────────┐  │
│  │ Sidebar  │  │
│  │ Editor   │  │
│  │ Search   │  │
│  │ Theme    │  │
│  └──────────┘  │
└────────────────┘
```

### Key Components

#### 1. CLI Entry Point
- Parse command-line arguments
- Initialize server
- Handle graceful shutdown

#### 2. Hono Server
- API routes (files, search, config)
- Static file serving
- SPA fallback

#### 3. Renderer Engine
- Unified processing pipeline
- AST transformation
- Theme application
- Plugin integration

#### 4. Plugin System
- Manifest validation
- Renderer registration
- Sandbox execution
- Lifecycle management

#### 5. React Client
- File tree sidebar
- Content editor
- Search modal
- Theme toggle

#### 6. Services
- File indexing
- Search engine
- Cache management
- File watching

---

## 📚 Documentation

### Design Documents

| Document | Description |
|----------|-------------|
| [design-catalog/README.md](./design-catalog/README.md) | Complete system design with EventStorming |
| [design-catalog/requirements.md](./design-catalog/requirements.md) | Business and technical requirements |
| [design-catalog/design-system.md](./design-catalog/design-system.md) | UI/UX design system |
| [design-catalog/tech-stack.md](./design-catalog/tech-stack.md) | Complete technology stack selection |
| [design-catalog/big-picture.mmd](./design-catalog/big-picture.mmd) | EventStorming big picture |
| [design-catalog/processes/](./design-catalog/processes/) | Process flow diagrams |
| [design-catalog/data/](./design-catalog/data/) | Data models and state charts |
| [design-catalog/flows/](./design-catalog/flows/) | Sequence diagrams |

### Guides

| Document | Description |
|----------|-------------|
| [quick-start.md](./quick-start.md) | Get started in 5 minutes |
| [component-examples.md](./component-examples.md) | Component usage examples |

---

## 🚀 Getting Started

### Prerequisites

```bash
# Install Bun
curl -fsSL https://bun.sh/install | bash
```

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/folder-site.git
cd folder-site

# Run initialization script
bun run scripts/init-project.sh

# Install dependencies
bun install
```

### Running

```bash
# Development
bun run dev

# Production
bun run build
bun run start
```

### Usage

```bash
# Start in current directory
folder-site

# Start in specific directory
folder-site /path/to/docs

# Custom port
folder-site --port 8080
```

---

## 💻 Development

### Project Structure

```
folder-site/
├── src/
│   ├── cli/              # CLI entry point
│   ├── server/           # Hono server
│   │   ├── routes/       # API routes
│   │   ├── middleware/   # Server middleware
│   │   └── services/     # Business logic
│   ├── client/           # React frontend
│   │   ├── components/   # React components
│   │   ├── layouts/      # Page layouts
│   │   └── styles/       # Global styles
│   ├── hooks/            # Custom React hooks
│   ├── utils/            # Utility functions
│   └── types/            # TypeScript types
├── public/               # Static assets
├── docs/                 # Documentation
├── scripts/              # Build/setup scripts
└── tests/                # Test files
```

### Development Workflow

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make Changes**
   - Edit components in `src/client/components/`
   - Add routes in `src/server/routes/`
   - Update types in `src/types/`

3. **Test**
   ```bash
   bun run dev
   bun test
   ```

4. **Commit**
   ```bash
   git add .
   git commit -m "feat: add my feature"
   ```

5. **Push**
   ```bash
   git push origin feature/my-feature
   ```

---

## 🗺️ Roadmap

### Phase 1: Core MVP (Week 1-2) - ✅ Designed
- [ ] CLI entry point
- [ ] File system scanning
- [ ] Basic Markdown rendering
- [ ] File tree sidebar
- [ ] Dark/Light theme

### Phase 2: Advanced Features (Week 3-4) - ✅ Designed
- [ ] Quick search (Cmd+P)
- [ ] Render caching
- [ ] File watching
- [ ] Code highlighting

### Phase 3: Plugin System (Week 5-6) - ✅ Designed
- [ ] Plugin architecture
- [ ] Built-in renderers (Mermaid, Graphviz)
- [ ] Plugin manifest schema
- [ ] Security sandboxing

### Phase 4: Workhub Integration (Week 7-8) - ✅ Designed
- [ ] docs/ structure parsing
- [ ] ADR/Issue/PR display
- [ ] Workhub-specific UI

### Phase 5: Polish & Export (Week 9-10) - ✅ Designed
- [ ] Export to PDF/HTML
- [ ] Performance optimization
- [ ] Error handling
- [ ] Documentation

### Future Enhancements

- [ ] Multi-language support
- [ ] Collaborative editing
- [ ] Version history
- [ ] Advanced search filters
- [ ] Mobile app (using the same design)
- [ ] Cloud sync option
- [ ] Custom theme editor

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Read the [design documentation](./design-catalog/)
2. Check existing issues
3. Create a feature branch
4. Submit a pull request

---

## 📄 License

MIT License - see LICENSE file for details

---

## 🙏 Acknowledgments

- **markdown-viewer-extension** - Markdown rendering inspiration
- **Radix UI** - Accessible component primitives
- **shadcn/ui** - Beautiful component examples
- **@react-symbols/icons** - File/folder icons
- **RemixIcon** - General purpose icons
- **Vercel** - Design inspiration

---

## 📞 Contact

- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Email**: your.email@example.com

---

**Ready to start building?** → [Quick Start Guide](./quick-start.md) 🚀