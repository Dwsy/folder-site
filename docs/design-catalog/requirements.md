# Requirements - Folder-Site CLI

## Overview

A CLI tool that converts the current directory into a browsable website with one command, designed for local documentation preview, knowledge base display, and Workhub integration.

## Business Goals

1. **Instant Local Preview** - Transform any directory into a browsable website instantly
2. **Knowledge Base Integration** - Seamlessly integrate with Workhub for docs/ management
3. **Developer Experience** - VS Code-like interface with familiar shortcuts and navigation
4. **Extensibility** - Plugin architecture supporting custom renderers and features

## Primary Actors

| Actor | Description | Goals |
|-------|-------------|-------|
| **Developer** | Uses CLI to preview local docs | Quick access to README, technical docs |
| **Knowledge Worker** | Manages knowledge base in docs/ | Organize and browse project documentation |
| **Plugin Developer** | Extends functionality | Add custom renderers, file type support |

## Secondary Actors

| Actor | Description |
|-------|-------------|
| **File System** | Local directory structure |
| **Workhub** | Documentation management system |

## Functional Requirements

### Core Features

- **FR1**: Single command execution (`folder-site`) starts local server
- **FR2**: Directory tree navigation (VS Code sidebar style)
- **FR3**: Markdown rendering with syntax highlighting
- **FR4**: Real-time preview (auto-refresh on file changes)
- **FR5**: Quick file search (Cmd+P style)
- **FR6**: Plugin system for extensibility
- **FR7**: Dark/Light theme切换

### Supported File Types

- **FR8**: `.md` - Markdown documents
- **FR9**: `.mmd` - Mermaid diagrams
- **FR10**: `.txt` - Plain text
- **FR11**: `.json` - JSON files (formatted display)
- **FR12**: `.yml` / `.yaml` - YAML files (formatted display)

### Advanced Features

- **FR13**: Chart rendering (Mermaid, Graphviz, Vega, etc.)
- **FR14**: Image preview and gallery
- **FR15**: Export to PDF/HTML
- **FR16**: Workhub integration for `docs/` directory

## Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| **Performance** | Search response < 100ms, page load < 500ms |
| **Usability** | VS Code-like familiarity, Cmd+P shortcuts |
| **Reliability** | 99% uptime locally, no data loss |
| **Portability** | Pure local execution, no network dependency |
| **Extensibility** | Plugin API for custom renderers |
| **Compatibility** | macOS, Linux, Windows |

## Constraints

| Constraint | Description |
|------------|-------------|
| **Network** | Pure local execution, no external requests |
| **Dependencies** | Bun runtime preferred |
| **Bundle Size** | Keep initial bundle < 5MB |
| **Startup Time** | < 2 seconds from command to ready |

## Integration Points

1. **Workhub** - Read `docs/` structure, display ADRs, Issues, PRs
2. **File System** - Watch for changes using native file watchers
3. **Plugin System** - Load custom renderers at runtime

## Success Criteria

- ✅ Single command starts server in < 2 seconds
- ✅ VS Code-like navigation feels familiar
- ✅ Plugin system allows adding new file types
- ✅ Workhub displays docs/ content correctly
- ✅ Search finds files in < 100ms
- ✅ No network requests made

## Open Questions (Hotspots)

- **HQ1**: Should Workhub integration be bidirectional (read/write)?
- **HQ2**: Plugin distribution model (npm packages vs local modules)?
- **HQ3**: Search indexing strategy (in-memory vs disk-based)?
- **HQ4**: Export functionality implementation (client-side vs server-side)?