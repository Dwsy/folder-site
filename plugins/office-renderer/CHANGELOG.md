# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-01-23

### Added

- Initial release of Office Document Renderer plugin
- Excel renderer with support for xlsx, xlsm, xls, csv, ods formats
- Word renderer with support for docx, dotx formats
- PDF renderer with pagination support
- Archive renderer with support for zip, rar, jar formats
- File type validation using magic numbers
- XSS protection for rendered content
- Memory-based LRU cache (max 10MB)
- Theme support (light/dark) with CSS variable injection
- Comprehensive error handling and logging
- Plugin system integration with Folder-Site

### Changed

- N/A (initial release)

### Deprecated

- None

### Fixed

- N/A (initial release)

### Security

- Implemented file type validation using magic numbers
- Added XSS protection for rendered HTML content
- Added file size limits for security

## [Unreleased]

### Planned
- IndexedDB persistent caching
- Virtual scrolling for large Excel tables
- Web Worker optimization for PDF rendering
- Additional Office formats (PowerPoint, Outlook)
- Editing capabilities for supported formats

[1.0.0]: https://github.com/yourusername/folder-site/releases/tag/office-renderer-v1.0.0