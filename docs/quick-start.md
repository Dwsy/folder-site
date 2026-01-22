# Quick Start Guide

Get Folder-Site CLI up and running in 5 minutes.

## Prerequisites

- **Bun** - Fast JavaScript runtime
  ```bash
  curl -fsSL https://bun.sh/install | bash
  ```

## Installation

### Option 1: Initialize New Project

```bash
# Clone or create your project directory
mkdir my-docs-site
cd my-docs-site

# Run the initialization script
bun run ../folder-site/scripts/init-project.sh

# Or if folder-site is installed globally
folder-site init
```

### Option 2: Manual Setup

```bash
# Create project structure
mkdir -p src/{cli,server,client}
cd src

# Initialize with Bun
bun init -y

# Install dependencies
bun add hono react react-dom @react-symbols/icons @radix-ui/react-dialog
bun add -d typescript @types/react @types/react-dom vite @vitejs/plugin-react
```

## Running the CLI

### Development Mode

```bash
# Start development server
bun run dev
```

The server will start at `http://localhost:3000`

### Production Mode

```bash
# Build the project
bun run build

# Start production server
bun run start
```

## Usage

### Start in Current Directory

```bash
folder-site
```

### Start in Specific Directory

```bash
folder-site /path/to/docs
```

### Custom Port

```bash
folder-site --port 8080
```

## Project Structure

```
folder-site/
├── src/
│   ├── cli/              # CLI entry point
│   │   └── index.ts
│   ├── server/           # Hono server
│   │   ├── routes/       # API routes
│   │   ├── middleware/   # Server middleware
│   │   └── services/     # Business logic
│   ├── client/           # React frontend
│   │   ├── components/   # React components
│   │   │   ├── sidebar/  # File tree sidebar
│   │   │   ├── search/   # Search modal
│   │   │   ├── editor/   # Content editor
│   │   │   └── theme/    # Theme toggle
│   │   ├── layouts/      # Page layouts
│   │   ├── pages/        # Page components
│   │   └── styles/       # Global styles
│   ├── hooks/            # Custom React hooks
│   ├── utils/            # Utility functions
│   └── types/            # TypeScript types
├── public/               # Static assets
├── docs/                 # Documentation
│   ├── design-catalog/   # System design
│   └── component-examples.md
├── scripts/              # Build/setup scripts
└── tests/                # Test files
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+P` / `Ctrl+P` | Open quick search |
| `Esc` | Close modal |
| `↑` / `↓` | Navigate results |
| `Enter` | Open selected file |
| `Cmd+K` / `Ctrl+K` | Toggle command palette |
| `Cmd+D` / `Ctrl+D` | Toggle dark/light theme |

## Supported File Types

| Extension | Type | Renderer |
|-----------|------|----------|
| `.md` | Markdown | Built-in |
| `.mmd` | Mermaid | Plugin |
| `.txt` | Plain Text | Built-in |
| `.json` | JSON | Built-in |
| `.yml` / `.yaml` | YAML | Built-in |

## Configuration

### Config File (`.folder-siterc.json`)

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
  }
}
```

### Environment Variables

```bash
# Server port
PORT=3000

# Theme (light/dark)
THEME=dark

# Cache TTL (ms)
CACHE_TTL=3600000
```

## Development Workflow

### 1. Add New Component

```bash
# Create component file
touch src/client/components/MyComponent.tsx
```

```tsx
// src/client/components/MyComponent.tsx
export function MyComponent() {
  return <div>Hello World</div>;
}
```

### 2. Add New Route

```tsx
// src/server/routes/my-route.ts
import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => {
  return c.json({ message: "Hello" });
});

export default app;
```

```tsx
// src/cli/index.ts
import myRoutes from "../server/routes/my-route";

app.route("/api/my-route", myRoutes);
```

### 3. Add New Plugin

```tsx
// src/server/plugins/my-plugin.ts
import type { Plugin } from "../types/plugin";

export const myPlugin: Plugin = {
  name: "my-plugin",
  version: "1.0.0",
  type: "renderer",
  render: async (content: string) => {
    // Custom rendering logic
    return `<div class="custom">${content}</div>`;
  },
};
```

## Troubleshooting

### Port Already in Use

```bash
# Use a different port
folder-site --port 3001

# Or kill the process using the port
lsof -ti:3000 | xargs kill -9
```

### Build Errors

```bash
# Clear cache and reinstall
rm -rf node_modules bun.lockb
bun install

# Rebuild
bun run build
```

### File Not Found

- Check file permissions
- Verify the directory path
- Ensure the file exists on disk

## Next Steps

1. **Explore Design** - Read `docs/design-catalog/README.md`
2. **Component Examples** - See `docs/component-examples.md`
3. **Customize** - Modify components in `src/client/components/`
4. **Add Plugins** - Create custom renderers in `src/server/plugins/`
5. **Deploy** - Build and run production server

## Getting Help

- 📖 Documentation: `docs/`
- 💡 Examples: `docs/component-examples.md`
- 🐛 Issues: Report bugs via GitHub Issues
- 💬 Discussion: Join our community chat

## License

MIT