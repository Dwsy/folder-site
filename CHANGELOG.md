# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-01-23

### Added

- Office 文档渲染插件系统
- Excel 文件渲染支持（xlsx, xlsm, xls, csv, ods 格式）
- Word 文档渲染支持（docx, dotx 格式）
- PDF 文档分页渲染支持
- 压缩包内容浏览支持（zip, rar, jar, 7z 格式）
- Office 文档主题适配（亮色/暗色主题切换）
- 安全验证模块（文件类型验证、魔数检查、XSS 防护）
- Office 渲染 API 端点（/api/render/office）
- Office 样式文件（office.css）
- 主题注入器（officeThemeInjector.ts）

### Changed

- 优化文件类型检测机制
- 改进渲染器注册系统
- 增强主题切换功能以支持 Office 文档

### Fixed

- Office 文档渲染时的 XSS 漏洞
- 大型 Excel 表格性能问题
- PDF 渲染内存泄漏

### Security

- 实现文件魔数验证防止类型欺骗
- 增强 DOMPurify XSS 防护
- 添加文件上传大小限制

## [1.0.0] - 2026-01-23

### Added

- Initial release of Folder-Site CLI
- One-command local website generator for documentation and knowledge bases
- File tree navigation with expandable/collapsible directories
- Markdown rendering with full GFM support
- Fast fuzzy file search (Cmd+P, < 100ms response time)
- Live preview with auto-refresh on file changes
- Dark/Light theme switching with persistence
- Plugin system with extensible renderer architecture
- Mermaid diagram rendering support
- Graphviz diagram rendering support
- Code syntax highlighting for 100+ languages (Shiki)
- Client-side PDF export functionality
- Client-side HTML export functionality
- Workhub integration for docs/ structure
- ADR (Architecture Decision Records) display component
- Issue display component
- PR (Pull Request) display component
- File watching with efficient monitoring (chokidar)
- Render caching with LRU cache implementation
- Full keyboard navigation support
- Comprehensive error handling and error boundaries
- Whitelist mode for selective file display
- Command-line interface with multiple options (port, whitelist, help, version)

### Changed

- Optimized search performance with Fuse.js
- Improved render caching strategy
- Enhanced theme application system

### Deprecated

- None

### Fixed

- File watching stability issues
- Search result navigation
- Theme persistence across sessions
- Error boundary coverage

### Security

- Implemented plugin sandbox for secure plugin execution

## [Unreleased]

### Planned
- Additional chart rendering plugins
- More export formats (EPUB, DOCX)
- Collaborative editing features
- Cloud deployment options
- Mobile app version

[1.0.0]: https://github.com/yourusername/folder-site/releases/tag/v1.0.0