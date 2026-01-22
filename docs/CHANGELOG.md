# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-01-22

### Added

- Initial stable release of Folder-Site CLI
- One-command local website generator for documentation and knowledge bases
- VS Code-like file tree navigation with expandable/collapsible directories
- Full GFM Markdown rendering with syntax highlighting
- Fast fuzzy file search (Cmd+P) with < 100ms response time
- Real-time preview with auto-refresh on file changes
- Dark/light theme switching with persistence
- Plugin system with extensible renderer architecture
- Chart rendering support: Mermaid, Graphviz, Vega
- Code syntax highlighting for 100+ languages (Shiki)
- Client-side PDF/HTML export functionality
- Workhub integration for docs/ structure
- File watching based on chokidar
- LRU cache for performance optimization
- Complete keyboard navigation system
- Support for .md, .mmd, .txt, .json, .yml, .yaml file types
- Configurable server options via .folder-siterc.json
- Environment variable configuration support
- Command-line interface with --port, --version, --help options
- RESTful API for file operations and search
- Built-in documentation viewer

### Changed

- Optimized rendering pipeline with unified processing
- Enhanced search algorithm with fuse.js
- Improved cache performance with LRU strategy
- Streamlined build process with Vite

### Deprecated

- None

### Removed

- None

### Fixed

- File watching reliability issues
- Theme persistence across sessions
- Search result ordering
- PDF export formatting

### Security

- Content sanitization with DOMPurify
- Secure file path handling
- Input validation for all API endpoints

## [Unreleased]

### Added
- Future features will be listed here

[1.0.0]: https://github.com/yourusername/folder-site/releases/tag/v1.0.0