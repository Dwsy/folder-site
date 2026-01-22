# Technology Stack - Folder-Site CLI

> **Principle: Don't reinvent the wheel - use proven libraries**

---

## Core Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Runtime** | Bun | Latest | Fast JavaScript runtime |
| **Server** | Hono | Latest | Lightweight web server |
| **Frontend** | React | 18+ | UI framework |
| **Styling** | Tailwind CSS | 3.x | Utility-first CSS |
| **Build** | Vite | 5.x | Fast bundler |

---

## UI Component Library

### Radix UI (Headless Components)

**Why Radix UI?**
- ✅ Accessible by default (WCAG compliant)
- ✅ Unstyled, fully customizable
- ✅ TypeScript support
- ✅ Keyboard navigation
- ✅ Focus management

**Components to Use:**

| Component | Usage |
|-----------|-------|
| `Dialog` | Search modal (Cmd+P) |
| `DropdownMenu` | Theme toggle, settings |
| `ScrollArea` | Sidebar, content area |
| `Separator` | Visual dividers |
| `Tooltip` | File/folder info |
| `Toast` | Notifications |
| `Tabs` | Settings panels |
| `Switch` | Toggle preferences |
| `Select` | Plugin selection |
| `ContextMenu` | Right-click menu |

**Installation:**
```bash
bun add @radix-ui/react-dialog
bun add @radix-ui/react-dropdown-menu
bun add @radix-ui/react-scroll-area
bun add @radix-ui/react-separator
bun add @radix-ui/react-tooltip
bun add @radix-ui/react-toast
bun add @radix-ui/react-tabs
bun add @radix-ui/react-switch
bun add @radix-ui/react-select
bun add @radix-ui/react-context-menu
```

---

## Icons

### 1. File & Folder Icons: `@react-symbols/icons`

**Why?**
- ✅ VS Code-like file icons
- ✅ Auto-detect by extension
- ✅ Customizable mappings
- ✅ TypeScript support

**Usage Examples:**

```typescript
import { FileIcon, FolderIcon } from "@react-symbols/icons/utils";

// File icon by extension
<FileIcon fileName="example.ts" />
<FileIcon fileName="README.md" />
<FileIcon fileName="package.json" autoAssign={true} />

// Folder icon by name
<FolderIcon folderName="src" />
<FolderIcon folderName="node_modules" />
<FolderIcon folderName="docs" />
```

**Installation:**
```bash
bun add @react-symbols/icons
```

### 2. UI Icons: Remixicon

**Why?**
- ✅ 2500+ icons
- ✅ Neutral design (fits minimalism)
- ✅ Multiple styles (line, fill)
- ✅ Easy to use

**Icons to Use:**

| Category | Icons |
|----------|-------|
| **Navigation** | `ri-arrow-left`, `ri-arrow-right`, `ri-home-line` |
| **Search** | `ri-search-line`, `ri-search-2-line` |
| **Actions** | `ri-refresh-line`, `ri-download-line`, `ri-file-copy-line` |
| **Theme** | `ri-sun-line`, `ri-moon-line` |
| **UI** | `ri-menu-line`, `ri-close-line`, `ri-more-2-fill` |
| **Status** | `ri-check-line`, `ri-error-warning-line`, `ri-loader-4-line` |

**Installation:**
```bash
bun add remixicon
```

**Usage:**
```typescript
import 'remixicon/fonts/remixicon.css';

// In JSX
<i className="ri-search-line"></i>
<i className="ri-moon-line"></i>
<i className="ri-file-copy-line"></i>
```

---

## Markdown Rendering

### Unified + Remark + Rehype Ecosystem

**Why?**
- ✅ Plugin-based architecture
- ✅ Extensible
- ✅ Industry standard
- ✅ TypeScript support

**Core Packages:**

| Package | Purpose |
|---------|---------|
| `unified` | Processing pipeline |
| `remark-parse` | Parse Markdown to AST |
| `remark-gfm` | GitHub Flavored Markdown |
| `remark-math` | LaTeX math support |
| `remark-rehype` | Convert to HTML AST |
| `rehype-stringify` | Convert to HTML |
| `rehype-highlight` | Code highlighting |
| `rehype-katex` | Math rendering |

**Installation:**
```bash
bun add unified remark-parse remark-gfm remark-math remark-rehype
bun add rehype-stringify rehype-highlight rehype-katex
```

### Syntax Highlighting: Shiki

**Why?**
- ✅ TextMate grammars (VS Code quality)
- ✅ Fast (WASM-based)
- ✅ Multiple themes
- ✅ TypeScript support

**Installation:**
```bash
bun add shiki
```

---

## Chart & Diagram Rendering

### Based on markdown-viewer-extension

**Why?**
- ✅ Proven rendering engine
- ✅ Plugin architecture
- ✅ Local processing
- ✅ Multiple diagram types

**Renderers to Port:**

| Renderer | File Types | Description |
|----------|-----------|-------------|
| **Mermaid** | `.mmd`, `.mermaid` | Flowcharts, sequence diagrams |
| **Graphviz** | `.gv`, `.dot` | DOT graphs |
| **Vega** | `.vega`, `.vl` | Data visualization |
| **Infographic** | `.infographic` | AntV infographics |

**Dependencies:**
```bash
bun add mermaid @viz-js/viz vega vega-lite vega-embed @antv/infographic
```

---

## File Watching

### Chokidar

**Why?**
- ✅ Cross-platform
- ✅ Efficient
- ✅ Reliable
- ✅ TypeScript support

**Installation:**
```bash
bun add chokidar
```

---

## State Management

### Zustand

**Why?**
- ✅ Simple API
- ✅ No boilerplate
- ✅ TypeScript support
- ✅ Small bundle size

**State Stores:**

```typescript
// stores/file-store.ts
import { create } from 'zustand';

interface FileState {
  currentFile: string | null;
  files: File[];
  setCurrentFile: (path: string) => void;
  setFiles: (files: File[]) => void;
}

export const useFileStore = create<FileState>((set) => ({
  currentFile: null,
  files: [],
  setCurrentFile: (path) => set({ currentFile: path }),
  setFiles: (files) => set({ files }),
}));

// stores/theme-store.ts
interface ThemeState {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: 'light',
  toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
}));
```

**Installation:**
```bash
bun add zustand
```

---

## Search

### Fuse.js

**Why?**
- ✅ Fuzzy search
- ✅ Fast
- ✅ Configurable scoring
- ✅ TypeScript support

**Installation:**
```bash
bun add fuse.js
```

---

## Export

### Client-side: jsPDF

**Why?**
- ✅ Pure client-side
- ✅ No server dependency
- ✅ TypeScript support

**Installation:**
```bash
bun add jspdf
```

### Server-side (Optional): Puppeteer

**Why?**
- ✅ Full rendering
- ✅ PDF generation
- ✅ Screenshot capability

**Installation:**
```bash
bun add puppeteer
```

---

## Styling

### Tailwind CSS + Tailwindwind Animate

**Why?**
- ✅ Utility-first
- ✅ Dark mode support
- ✅ Responsive
- ✅ Custom themes

**Installation:**
```bash
bun add -D tailwindcss postcss autoprefixer
bun add tailwindcss-animate
```

**Tailwind Config:**

```javascript
// tailwind.config.js
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
        },
        background: {
          light: '#f8fafc',
          dark: '#0f172a',
        },
      },
      fontFamily: {
        sans: ['IBM Plex Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
  ],
};
```

---

## Development Tools

| Tool | Purpose |
|------|---------|
| **TypeScript** | Type safety |
| **ESLint** | Linting |
| **Prettier** | Code formatting |
| **Vitest** | Testing |

**Installation:**
```bash
bun add -D typescript @types/react @types/node
bun add -D eslint eslint-plugin-react-hooks prettier
bun add -D vitest @vitest/ui
```

---

## Final Dependencies Summary

```json
{
  "dependencies": {
    "bun": "latest",
    "hono": "latest",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "tailwindcss": "^3.4.0",
    "tailwindcss-animate": "^1.0.7",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-scroll-area": "^1.0.5",
    "@radix-ui/react-separator": "^1.0.3",
    "@radix-ui/react-tooltip": "^1.0.7",
    "@radix-ui/react-toast": "^1.1.5",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-switch": "^1.0.3",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-context-menu": "^2.1.5",
    "@react-symbols/icons": "^1.0.0",
    "remixicon": "^4.2.0",
    "unified": "^11.0.5",
    "remark-parse": "^11.0.0",
    "remark-gfm": "^4.0.0",
    "remark-math": "^6.0.0",
    "remark-rehype": "^11.1.2",
    "rehype-stringify": "^10.0.1",
    "rehype-highlight": "^7.0.2",
    "rehype-katex": "^7.0.1",
    "shiki": "^1.0.0",
    "mermaid": "^11.12.2",
    "@viz-js/viz": "^3.24.0",
    "vega": "^6.2.0",
    "vega-lite": "^6.4.1",
    "vega-embed": "^7.1.0",
    "@antv/infographic": "^0.2.7",
    "chokidar": "^3.6.0",
    "zustand": "^4.5.0",
    "fuse.js": "^7.0.0",
    "jspdf": "^2.5.1"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/react": "^18.2.0",
    "@types/node": "^20.10.0",
    "eslint": "^8.55.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "prettier": "^3.1.0",
    "vitest": "^1.0.0",
    "@vitest/ui": "^1.0.0",
    "vite": "^5.0.0"
  }
}
```

---

## Bundle Size Estimate

| Category | Size (gzipped) |
|----------|----------------|
| React + ReactDOM | ~45 KB |
| Radix UI (10 components) | ~30 KB |
| @react-symbols/icons | ~20 KB |
| Remixicon (subset) | ~10 KB |
| Unified + Remark + Rehype | ~25 KB |
| Shiki | ~50 KB |
| Mermaid | ~150 KB (lazy) |
| Other | ~30 KB |
| **Total** | **~360 KB** (with lazy loading) |

---

## Performance Considerations

### Code Splitting

```typescript
// Lazy load heavy renderers
const MermaidRenderer = lazy(() => import('./renderers/MermaidRenderer'));
const VegaRenderer = lazy(() => import('./renderers/VegaRenderer'));
```

### Tree Shaking

```typescript
// Import only needed icons from Remixicon
import 'remixicon/fonts/remixicon.css'; // Full set (~200KB)
// OR use tree-shakeable SVG icons
```

### Caching Strategy

- Service Worker for static assets
- IndexedDB for render cache
- LocalStorage for user preferences

---

## Next Steps

1. **Initialize project** with Bun + Vite
2. **Install dependencies** from summary above
3. **Set up Radix UI** components
4. **Configure Tailwind** with design system
5. **Implement file icon** display with @react-symbols/icons
6. **Build Markdown renderer** with Unified ecosystem
7. **Add search** with Fuse.js
8. **Implement plugin system** based on markdown-viewer-extension