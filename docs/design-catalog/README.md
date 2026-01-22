# Folder-Site CLI - Design Catalog

> **System Design through EventStorming**
>
> A CLI tool that converts the current directory into a browsable website with one command, designed for local documentation preview, knowledge base display, and Workhub integration.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Requirements](#requirements)
- [Design System](#design-system)
- [Big Picture (EventStorming)](#big-picture-eventstorming)
- [Process Flows](#process-flows)
- [Data Model](#data-model)
- [Sequence Diagrams](#sequence-diagrams)
- [Hotspots & Decisions](#hotspots--decisions)
- [Next Steps](#next-steps)

---

## Overview

**Project:** Folder-Site CLI
**Goal:** One-command local website generator for documentation and knowledge bases
**Stack:** Bun + Hono + React + Tailwind CSS + Radix UI + shadcn/ui
**Pattern:** VS Code-like interface with plugin architecture

> 📦 **Tech Stack Details:** See [tech-stack.md](./tech-stack.md) for complete component library selection

### Key Features

- ✅ Single command execution (`folder-site`)
- ✅ Directory tree navigation (VS Code sidebar)
- ✅ Markdown rendering with syntax highlighting
- ✅ Real-time preview (auto-refresh)
- ✅ Quick search (Cmd+P style)
- ✅ Plugin system (VS Code Extensions-like)
- ✅ Dark/Light theme toggle
- ✅ Workhub integration

---

## Requirements

### Business Goals

1. **Instant Local Preview** - Transform any directory into a browsable website instantly
2. **Knowledge Base Integration** - Seamlessly integrate with Workhub for docs/ management
3. **Developer Experience** - VS Code-like interface with familiar shortcuts
4. **Extensibility** - Plugin architecture supporting custom renderers

### Supported File Types

| Extension | Type | Renderer |
|-----------|------|----------|
| `.md` | Markdown | Built-in |
| `.mmd` | Mermaid | Plugin |
| `.txt` | Plain Text | Built-in |
| `.json` | JSON | Built-in |
| `.yml` / `.yaml` | YAML | Built-in |

### Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| **Performance** | Search < 100ms, page load < 500ms |
| **Usability** | VS Code-like, Cmd+P shortcuts |
| **Reliability** | 99% uptime locally |
| **Portability** | Pure local, no network |
| **Startup Time** | < 2 seconds |

---

## Design System

### Pattern: FAQ/Documentation Landing

**Conversion Focus:**
- Reduce support tickets
- Track search analytics
- Show related articles
- Contact escalation path

### Style: Minimalism & Swiss Style

**Keywords:** Clean, simple, spacious, functional, white space, high contrast, geometric, sans-serif, grid-based, essential

### Colors

| Role | Hex | Tailwind |
|------|-----|----------|
| **Primary** | #3B82F6 | `blue-500` |
| **Secondary** | #60A5FA | `blue-400` |
| **CTA** | #F97316 | `orange-500` |
| **Background** | #F8FAFC | `slate-50` |
| **Text** | #1E293B | `slate-800` |

### Typography

- **Headings:** JetBrains Mono (400, 500, 600, 700)
- **Body:** IBM Plex Sans (300, 400, 500, 600, 700)
- **Code:** JetBrains Mono (400, 500)

### Layout Structure

```
┌─────────────────────────────────────────────────────┐
│ Header: Logo | Search (Cmd+P) | Theme Toggle |      │
├──────────┬──────────────────────────────────────────┤
│          │                                          │
│ Sidebar  │         Main Content Area               │
│          │                                          │
│ File     │  ┌────────────────────────────┐         │
│ Tree     │  │                            │         │
│          │  │   Markdown Content         │         │
│ 📁 docs  │  │                            │         │
│   📄 ADR │  │   # Heading                │         │
│   📄 ... │  │                            │         │
│   📄 ... │  │   Content...               │         │
│          │  │                            │         │
│ 📁 src   │  └────────────────────────────┘         │
│   📄 ... │                                          │
│          │                                          │
└──────────┴──────────────────────────────────────────┘
```

---

## Big Picture (EventStorming)

```mermaid
flowchart LR
    %% Style definitions
    classDef event fill:#FF9800,stroke:#E65100,color:#000,stroke-width:2px
    classDef command fill:#2196F3,stroke:#0D47A1,color:#fff,stroke-width:2px
    classDef actor fill:#FFEB3B,stroke:#F57F17,color:#000,stroke-width:2px
    classDef system fill:#9C27B0,stroke:#4A148C,color:#fff,stroke-width:2px
    classDef aggregate fill:#4CAF50,stroke:#1B5E20,color:#fff,stroke-width:2px
    classDef hotspot fill:#F44336,stroke:#B71C1C,color:#fff,stroke-width:2px,strokewidth:3px

    %% Actors
    User[Developer]:::actor
    PluginDev[Plugin Developer]:::actor

    %% Commands
    CmdStart[folder-site]:::command
    CmdNavigate[Navigate File Tree]:::command
    CmdSearch[Cmd+P Search]:::command
    CmdToggleTheme[Toggle Theme]:::command
    CmdExport[Export PDF/HTML]:::command
    CmdLoadPlugin[Load Plugin]:::command

    %% Events
    EvtServer[Server Started]:::event
    EvtIndexed[Directory Indexed]:::event
    EvtFileOpened[File Opened]:::event
    EvtSearched[Search Executed]:::event
    EvtTheme[Theme Changed]:::event
    EvtExported[Export Complete]:::event
    EvtPlugin[Plugin Loaded]:::event
    EvtChanged[File Changed]:::event
    EvtRendered[Content Rendered]:::event

    %% Aggregates
    AggConfig[Server Config]:::aggregate
    AggIndex[File Index]:::aggregate
    AggCache[Render Cache]:::aggregate
    AggTheme[Theme State]:::aggregate
    AggPlugins[Plugin Registry]:::aggregate

    %% Systems
    SysFS[File System]:::system
    SysWorkhub[Workhub]:::system
    SysRenderer[Markdown Renderer]:::system
    SysWatcher[File Watcher]:::system

    %% Hotspots
    HotPlugin[? Plugin distribution model? npm vs local?]:::hotspot
    HotSearch[? Search indexing: in-memory vs disk?]:::hotspot
    HotExport[? Export: client-side vs server-side?]:::hotspot
    HotWorkhub[? Workhub: read-only or bidirectional?]:::hotspot

    %% Main Flow
    User --> CmdStart
    CmdStart --> EvtServer
    EvtServer --> AggConfig

    EvtServer --> EvtIndexed
    EvtIndexed --> AggIndex
    AggIndex --> SysFS

    User --> CmdNavigate
    CmdNavigate --> EvtFileOpened
    EvtFileOpened --> SysRenderer
    SysRenderer --> EvtRendered
    EvtRendered --> AggCache

    SysWatcher --> EvtChanged
    EvtChanged --> EvtRendered

    User --> CmdSearch
    CmdSearch --> EvtSearched
    EvtSearched --> AggIndex
    EvtSearched -.question.- HotSearch

    User --> CmdToggleTheme
    CmdToggleTheme --> EvtTheme
    EvtTheme --> AggTheme

    User --> CmdExport
    CmdExport --> EvtExported
    EvtExported -.question.- HotExport

    PluginDev --> CmdLoadPlugin
    CmdLoadPlugin --> EvtPlugin
    EvtPlugin --> AggPlugins
    EvtPlugin -.question.- HotPlugin

    %% Workhub Integration
    AggIndex -.-> SysWorkhub
    SysWorkhub -.question.- HotWorkhub

    %% Styling
    linkStyle default stroke:#94A3B8,stroke-width:2px
```

### Legend

| Color | Element Type |
|-------|--------------|
| 🟠 Orange | **Events** - Something that happened |
| 🔵 Blue | **Commands** - User actions |
| 🟡 Yellow | **Actors** - Who initiates actions |
| 🟣 Purple | **Systems** - External integrations |
| 🟢 Green | **Aggregates** - Data entities |
| 🔴 Red | **Hotspots** - Questions/Decisions needed |

---

## Process Flows

### 1. File Rendering Pipeline

```mermaid
flowchart TD
    %% Style definitions
    classDef event fill:#FF9800,stroke:#E65100,color:#000,stroke-width:2px
    classDef command fill:#2196F3,stroke:#0D47A1,color:#fff,stroke-width:2px
    classDef actor fill:#FFEB3B,stroke:#F57F17,color:#000,stroke-width:2px
    classDef system fill:#9C27B0,stroke:#4A148C,color:#fff,stroke-width:2px
    classDef aggregate fill:#4CAF50,stroke:#1B5E20,color:#fff,stroke-width:2px
    classDef decision fill:#FF9800,stroke:#E65100,color:#000,stroke-dasharray:5 5

    %% Actors
    User[User]:::actor

    %% Commands
    CmdOpen[Open File]:::command
    CmdRender[Request Render]:::command

    %% Events
    EvtSelected[File Selected]:::event
    EvtDetected[File Type Detected]:::event
    EvtCached[Cache Hit]:::event
    EvtParsed[Content Parsed]:::event
    EvtProcessed[Blocks Processed]:::event
    EvtTransformed[AST Transformed]:::event
    EvtRendered[HTML Generated]:::event
    EvtDisplayed[Content Displayed]:::event

    %% Aggregates
    AggFile[File Metadata]:::aggregate
    AggCache[Render Cache]:::aggregate
    AggAST[AST Tree]:::aggregate
    AggBlocks[Block Array]:::aggregate
    AggHTML[Rendered HTML]:::aggregate

    %% Systems
    SysFS[File System]:::system
    SysParser[Markdown Parser]:::system
    SysPlugin[Plugin System]:::system
    SysTheme[Theme Engine]:::system

    %% Decisions
    DecCache{Cache Hit?}:::decision
    DecType{File Type?}:::decision

    %% Flow
    User --> CmdOpen
    CmdOpen --> EvtSelected
    EvtSelected --> AggFile
    AggFile --> SysFS

    EvtSelected --> EvtDetected
    EvtDetected --> DecType

    DecCache{Cache Hit?}
    EvtDetected --> DecCache
    DecCache -->|Yes| EvtCached
    EvtCached --> AggCache
    EvtCached --> EvtDisplayed

    DecCache -->|No| CmdRender
    CmdRender --> SysFS

    SysFS --> EvtParsed
    EvtParsed --> SysParser

    SysParser --> EvtProcessed
    EvtProcessed --> AggBlocks

    AggBlocks --> SysPlugin
    SysPlugin --> EvtTransformed
    EvtTransformed --> AggAST

    AggAST --> SysTheme
    SysTheme --> EvtRendered
    EvtRendered --> AggHTML

    AggHTML --> AggCache
    AggHTML --> EvtDisplayed

    EvtDisplayed --> User

    %% File Type Decision
    DecType -->|.md| SysParser
    DecType -->|.mmd| SysPlugin
    DecType -->|.json| SysFS
    DecType -->|.yml| SysFS

    %% Styling
    linkStyle default stroke:#94A3B8,stroke-width:2px
```

### 2. Quick Search (Cmd+P)

```mermaid
flowchart TD
    %% Style definitions
    classDef event fill:#FF9800,stroke:#E65100,color:#000,stroke-width:2px
    classDef command fill:#2196F3,stroke:#0D47A1,color:#fff,stroke-width:2px
    classDef actor fill:#FFEB3B,stroke:#F57F17,color:#000,stroke-width:2px
    classDef system fill:#9C27B0,stroke:#4A148C,color:#fff,stroke-width:2px
    classDef aggregate fill:#4CAF50,stroke:#1B5E20,color:#fff,stroke-width:2px
    classDef decision fill:#FF9800,stroke:#E65100,color:#000,stroke-dasharray:5 5

    %% Actors
    User[User]:::actor

    %% Commands
    CmdTrigger[Cmd+P Pressed]:::command
    CmdType[Type Query]:::command
    CmdSelect[Select Result]:::command
    CmdNavigate[Arrow Keys]:::command
    CmdClose[Esc Pressed]:::command

    %% Events
    EvtOpened[Search Modal Opened]:::event
    EvtInput[Query Input Received]:::event
    EvtFiltered[Results Filtered]:::event
    EvtHighlighted[Result Highlighted]:::event
    EvtSelected[File Selected]:::event
    EvtClosed[Modal Closed]:::event

    %% Aggregates
    AggIndex[File Index]:::aggregate
    AggQuery[Search Query]:::aggregate
    AggResults[Search Results]:::aggregate
    AggSelection[Selection Index]:::aggregate

    %% Systems
    SysSearch[Search Engine]:::system
    SysDebounce[Debounce Timer]:::system
    SysKeyboard[Keyboard Handler]:::system

    %% Decisions
    DecEmpty{Query Empty?}:::decision
    DecHasResults{Results Found?}:::decision

    %% Flow
    User --> CmdTrigger
    CmdTrigger --> EvtOpened
    EvtOpened --> AggQuery
    AggQuery --> User

    User --> CmdType
    CmdType --> EvtInput
    EvtInput --> SysDebounce

    SysDebounce --> SysSearch
    SysSearch --> AggIndex
    SysSearch --> EvtFiltered
    EvtFiltered --> AggResults

    EvtFiltered --> DecHasResults
    DecHasResults -->|Yes| AggResults
    DecHasResults -->|No| AggResults

    AggResults --> User

    User --> CmdNavigate
    CmdNavigate --> SysKeyboard
    SysKeyboard --> EvtHighlighted
    EvtHighlighted --> AggSelection

    AggSelection --> User

    User --> CmdSelect
    CmdSelect --> EvtSelected
    EvtSelected --> User

    User --> CmdClose
    CmdClose --> EvtClosed
    EvtClosed --> AggQuery

    %% Empty Query Check
    EvtInput --> DecEmpty
    DecEmpty -->|Yes| AggIndex
    DecEmpty -->|No| SysSearch

    %% Styling
    linkStyle default stroke:#94A3B8,stroke-width:2px
```

### 3. Plugin System Lifecycle

```mermaid
flowchart TD
    %% Style definitions
    classDef event fill:#FF9800,stroke:#E65100,color:#000,stroke-width:2px
    classDef command fill:#2196F3,stroke:#0D47A1,color:#fff,stroke-width:2px
    classDef actor fill:#FFEB3B,stroke:#F57F17,color:#000,stroke-width:2px
    classDef system fill:#9C27B0,stroke:#4A148C,color:#fff,stroke-width:2px
    classDef aggregate fill:#4CAF50,stroke:#1B5E20,color:#fff,stroke-width:2px
    classDef decision fill:#FF9800,stroke:#E65100,color:#000,stroke-dasharray:5 5

    %% Actors
    User[User]:::actor
    PluginDev[Plugin Developer]:::actor

    %% Commands
    CmdLoad[Load Plugin]:::command
    CmdRegister[Register Renderer]:::command
    CmdUse[Use Plugin]:::command
    CmdUnload[Unload Plugin]:::command

    %% Events
    EvtDiscovered[Plugin Discovered]:::event
    EvtValidated[Manifest Validated]:::event
    EvtLoaded[Plugin Code Loaded]:::event
    EvtRegistered[Renderer Registered]:::event
    EvtActivated[Plugin Activated]:::event
    EvtExecuted[Plugin Executed]:::event
    EvtDeactivated[Plugin Deactivated]:::event

    %% Aggregates
    AggRegistry[Plugin Registry]:::aggregate
    AggManifest[Plugin Manifest]:::aggregate
    AggRenderer[Renderer Instance]:::aggregate
    AggConfig[Plugin Config]:::aggregate

    %% Systems
    SysLoader[Plugin Loader]:::system
    SysValidator[Schema Validator]:::system
    SysSandbox[Plugin Sandbox]:::system
    SysHook[Hook System]:::system

    %% Decisions
    DecValid{Valid Manifest?}:::decision
    DecType{Plugin Type?}:::decision
    DecSafe{Safe to Load?}:::decision

    %% Flow
    PluginDev --> CmdLoad
    CmdLoad --> EvtDiscovered
    EvtDiscovered --> SysLoader

    SysLoader --> EvtValidated
    EvtValidated --> SysValidator
    SysValidator --> DecValid

    DecValid -->|No| EvtDeactivated
    DecValid -->|Yes| DecSafe

    DecSafe -->|No| EvtDeactivated
    DecSafe -->|Yes| EvtLoaded
    EvtLoaded --> AggManifest

    EvtLoaded --> DecType

    DecType -->|Renderer| CmdRegister
    DecType -->|Transformer| CmdRegister
    DecType -->|Hook| SysHook

    CmdRegister --> EvtRegistered
    EvtRegistered --> AggRenderer
    EvtRegistered --> AggRegistry

    EvtRegistered --> EvtActivated
    EvtActivated --> AggConfig

    User --> CmdUse
    CmdUse --> SysSandbox
    SysSandbox --> EvtExecuted
    EvtExecuted --> AggRenderer

    User --> CmdUnload
    CmdUnload --> EvtDeactivated
    EvtDeactivated --> AggRegistry

    %% Styling
    linkStyle default stroke:#94A3B8,stroke-width:2px
```

---

## Data Model

### Entity-Relationship Diagram

```mermaid
erDiagram
    %% Core Entities
    File {
        string path PK
        string name
        string extension
        number size
        timestamp modified
        string type
        string content_hash
    }

    Directory {
        string path PK
        string name
        string parent_path FK
        number depth
        boolean is_root
    }

    FileIndex {
        string file_path PK
        string tokens
        number relevance_score
        timestamp indexed_at
        boolean is_cached
    }

    RenderCache {
        string cache_key PK
        string file_path FK
        string html_content
        string theme
        timestamp created_at
        timestamp expires_at
        number size_bytes
    }

    Plugin {
        string id PK
        string name
        string version
        string type
        string entry_point
        boolean is_active
        json config
        timestamp installed_at
    }

    PluginManifest {
        string plugin_id PK
        string file_types
        json dependencies
        json permissions
        string author
    }

    Theme {
        string id PK
        string name
        string mode
        json colors
        json fonts
        boolean is_default
    }

    UserConfig {
        string key PK
        json value
        timestamp updated_at
    }

    SearchHistory {
        string id PK
        string query
        timestamp created_at
        number result_count
        string selected_path
    }

    WorkhubDocument {
        string path PK
        string type
        string status
        string category
        timestamp created_at
        timestamp updated_at
        json metadata
    }

    %% Relationships
    File ||--|| Directory : "belongs_to"
    File ||--o{ FileIndex : "indexed_by"
    File ||--o{ RenderCache : "cached_as"
    File ||--o{ SearchHistory : "selected_in"

    Directory ||--|| Directory : "parent_of"
    Directory ||--o{ File : "contains"

    Plugin ||--|| PluginManifest : "has_manifest"
    Plugin ||--o{ RenderCache : "generates"

    Theme ||--o{ RenderCache : "applied_to"
    UserConfig ||--|| Theme : "uses"

    WorkhubDocument ||--|| File : "represented_by"
```

### State Charts

#### File Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Unindexed

    Unindexed --> Indexing: Scan Directory
    Indexing --> Indexed: Index Complete
    Indexing --> Error: Index Failed

    Indexed --> Unopened: File Added
    Unopened --> Opening: User Clicks
    Opening --> Opened: Load Success
    Opening --> Error: Load Failed

    Opened --> Rendering: Content Changed
    Rendering --> Rendered: Render Success
    Rendering --> Error: Render Failed

    Rendered --> Cached: Cache Written
    Cached --> Opened: Cache Hit

    Opened --> Modified: User Edits
    Modified --> Rendering: Re-render

    Rendered --> Exporting: Export Requested
    Exporting --> Exported: Export Success
    Exporting --> Error: Export Failed

    Error --> [*]: Retry Failed
    Error --> Unindexed: Reset

    Exported --> [*]: Complete
    Opened --> [*]: File Closed
```

#### Plugin Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Discovered

    Discovered --> Validating: Load Manifest
    Validating --> Validated: Schema OK
    Validating --> Invalid: Schema Error

    Validated --> Checking: Safety Check
    Checking --> Available: Safe to Load
    Checking --> Blocked: Unsafe

    Available --> Loading: Load Code
    Loading --> Loaded: Code Loaded
    Loading --> Failed: Load Error

    Loaded --> Registering: Register Renderers
    Registering --> Registered: Registration OK
    Registering --> Failed: Registration Error

    Registered --> Activating: Activate Plugin
    Activating --> Active: Activation Complete
    Activating --> Failed: Activation Error

    Active --> Idle: Waiting for Requests
    Idle --> Executing: Render Request
    Executing --> Idle: Render Complete
    Executing --> Error: Render Failed

    Active --> Deactivating: Unload Request
    Deactivating --> Inactive: Cleanup Complete
    Deactivating --> Failed: Cleanup Error

    Error --> Idle: Recovery
    Failed --> [*]: Unloaded
    Invalid --> [*]: Skipped
    Blocked --> [*]: Blocked

    Inactive --> [*]: Unloaded
```

---

## Sequence Diagrams

### Open File Flow

```mermaid
sequenceDiagram
    actor User
    participant UI as Frontend UI
    participant Router as File Router
    participant Cache as Render Cache
    participant FS as File System
    participant Parser as Markdown Parser
    participant Plugin as Plugin System
    participant Theme as Theme Engine
    participant Index as File Index

    User->>UI: Click file in sidebar
    UI->>Router: GET /file/:path

    Router->>Cache: Check cache (path + hash)
    alt Cache Hit
        Cache-->>Router: Return cached HTML
        Router-->>UI: 200 OK + HTML
        UI->>User: Display content
    else Cache Miss
        Router->>FS: Read file content
        FS-->>Router: File content + metadata

        Router->>Parser: Parse markdown
        Parser->>Parser: Build AST
        Parser-->>Router: AST tree

        loop For each block
            Router->>Plugin: Check renderer for block type
            alt Plugin has renderer
                Plugin->>Plugin: Render block
                Plugin-->>Router: Rendered HTML
            else No renderer
                Router->>Router: Default render
            end
        end

        Router->>Theme: Apply theme
        Theme-->>Router: Styled HTML

        Router->>Cache: Store (path + hash + theme)
        Cache-->>Router: Cache stored

        Router->>Index: Update access time
        Index-->>Router: Updated

        Router-->>UI: 200 OK + HTML
        UI->>User: Display content
    end
```

### Quick Search Flow

```mermaid
sequenceDiagram
    actor User
    participant UI as Frontend UI
    participant Debounce as Debounce Timer
    participant Search as Search Engine
    participant Index as File Index
    participant Router as File Router
    participant Cache as Render Cache

    User->>UI: Press Cmd+P
    UI->>UI: Open search modal
    UI->>Index: Get recent files
    Index-->>UI: Recent files list
    UI->>User: Display recent files

    User->>UI: Type search query
    UI->>Debounce: Start 50ms timer

    alt User types more
        User->>UI: Type next character
        UI->>Debounce: Reset timer
    end

    Debounce->>Search: Execute search
    Search->>Index: Query file index
    Index-->>Search: Matching files

    Search->>Search: Calculate relevance scores
    Search->>Search: Sort by score + recency
    Search-->>UI: Search results

    UI->>User: Display results (top 10)

    User->>UI: Arrow key navigation
    UI->>UI: Update highlighted result
    UI->>User: Show preview

    alt User presses Enter
        User->>UI: Press Enter
        UI->>Router: Open selected file
        Router->>Cache: Check cache
        Cache-->>Router: Return HTML
        Router-->>UI: File content
        UI->>User: Display file
    else User presses Esc
        User->>UI: Press Esc
        UI->>UI: Close modal
    end
```

---

## Hotspots & Decisions

### 🔴 Hotspot 1: Plugin Distribution Model

**Question:** How should plugins be distributed?

| Option | Pros | Cons |
|--------|------|------|
| **npm Packages** | Easy discovery, version management | Network required, dependency issues |
| **Local Modules** | Offline capable, no conflicts | Manual installation |
| **Hybrid** | Best of both worlds | More complex |

**Recommendation:** Hybrid model - npm for public plugins, local for custom/private plugins.

---

### 🔴 Hotspot 2: Search Indexing Strategy

**Question:** Should search index be in-memory or disk-based?

| Option | Pros | Cons |
|--------|------|------|
| **In-Memory** | Fast, simple | Lost on restart |
| **Disk-Based** | Persistent | Slower |
| **Hybrid** | Fast + persistent | More complex |

**Recommendation:** Hybrid - In-memory index with periodic disk sync (every 5 min).

---

### 🔴 Hotspot 3: Export Implementation

**Question:** Should export be client-side or server-side?

| Option | Pros | Cons |
|--------|------|------|
| **Client-side** | No server load, pure local | Limited features |
| **Server-side** | Full features | More complex |
| **Hybrid** | Simple + advanced options | More complex |

**Recommendation:** Client-side for basic exports (jsPDF), server-side for advanced (Puppeteer).

---

### 🔴 Hotspot 4: Workhub Integration

**Question:** Should Workhub be read-only or bidirectional?

| Option | Pros | Cons |
|--------|------|------|
| **Read-only** | Simple, safe | Limited functionality |
| **Bidirectional** | Full control | Complex, risky |

**Recommendation:** Start with read-only, add write support with explicit user confirmation.

---

## Next Steps

### Immediate Actions

1. **Choose Hotspot Decisions** - Review and confirm the 4 hotspots above
2. **Technical Stack Validation** - Verify Bun + Hono + React + Tailwind CSS
3. **Prototype Development** - Build MVP with core features

### Implementation Phases

#### Phase 1: Core MVP (Week 1-2)
- ✅ CLI entry point
- ✅ File system scanning
- ✅ Basic Markdown rendering
- ✅ File tree sidebar
- ✅ Dark/Light theme

#### Phase 2: Advanced Features (Week 3-4)
- ✅ Quick search (Cmd+P)
- ✅ Render caching
- ✅ File watching
- ✅ Code highlighting

#### Phase 3: Plugin System (Week 5-6)
- ✅ Plugin architecture
- ✅ Built-in renderers (Mermaid, Graphviz)
- ✅ Plugin manifest schema
- ✅ Security sandboxing

#### Phase 4: Workhub Integration (Week 7-8)
- ✅ docs/ structure parsing
- ✅ ADR/Issue/PR display
- ✅ Workhub-specific UI

#### Phase 5: Polish & Export (Week 9-10)
- ✅ Export to PDF/HTML
- ✅ Performance optimization
- ✅ Error handling
- ✅ Documentation

---

## 🛠️ Tech Stack Quick Reference

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Runtime** | Bun | Fast JavaScript runtime |
| **Server** | Hono | Lightweight web framework |
| **Frontend** | React + Vite | Component library & bundler |
| **Styling** | Tailwind CSS | Utility-first CSS |
| **UI Components** | Radix UI + shadcn/ui | Accessible, styled components |
| **File Icons** | @react-symbols/icons | VS Code-style file/folder icons |
| **UI Icons** | RemixIcon | General-purpose icons |
| **Markdown** | unified + remark + rehype | Markdown processing |
| **Syntax Highlight** | rehype-highlight + Shiki | Code highlighting |
| **File Watching** | chokidar | Efficient file watcher |
| **Caching** | lru-cache | LRU cache implementation |
| **Search** | tiny-searcher | Fuzzy search algorithm |
| **PDF Export** | jsPDF | Client-side PDF generation |
| **HTML Export** | html-to-pdfmake | HTML to PDF conversion |

### Component Library Details

#### shadcn/ui Components (Used)
- `Dialog` - Cmd+P search modal
- `DropdownMenu` - Context menus
- `ScrollArea` - Custom scrollbars
- `Separator` - Visual dividers
- `Switch` - Theme toggle
- `Tooltip` - Hover tooltips
- `Command` - Command palette (alternative to Dialog)
- `Resizable` - Resizable sidebar

#### Radix UI Primitives (Underlying)
- `@radix-ui/react-dialog`
- `@radix-ui/react-dropdown-menu`
- `@radix-ui/react-scroll-area`
- `@radix-ui/react-separator`
- `@radix-ui/react-switch`
- `@radix-ui/react-tooltip`
- `@radix-ui/react-command`
- `@radix-ui/react-resizable`

### File & Folder Icons

```typescript
import { FileIcon, FolderIcon } from "@react-symbols/icons/utils";

// File icon
<FileIcon fileName="example.ts" width={16} height={16} />

// Folder icon
<FolderIcon folderName="src" width={16} height={16} />

// Auto-assign for special files
<FileIcon fileName="package.json" autoAssign={true} />
```

### General Icons (RemixIcon)

```typescript
import { RiSearchLine, RiFileTextLine, RiMoonLine } from "react-icons/ri";

// Search icon
<RiSearchLine size={20} />

// File icon
<RiFileTextLine size={20} />

// Theme icon
<RiMoonLine size={20} />
```

**📖 Complete details:**
- [tech-stack.md](./tech-stack.md) - Complete component library selection
- [../component-examples.md](../component-examples.md) - Component usage examples

---

## Design Validation Checklist

- [x] Requirements captured
- [x] EventStorming methodology followed
- [x] All diagrams in Mermaid format
- [x] Catalog structure created
- [x] Hotspots identified
- [x] Design system generated
- [x] Stayed at design level (no SQL, deployment)
- [x] Token-efficient (< 35K tokens)

---

**Ready to proceed with implementation planning?** 🚀