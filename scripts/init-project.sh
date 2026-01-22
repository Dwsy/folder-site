#!/bin/bash

# Folder-Site CLI - Project Initialization Script
# This script sets up the project structure with all dependencies

set -e

echo "🚀 Initializing Folder-Site CLI project..."

# Create directory structure
echo "📁 Creating directory structure..."
mkdir -p src/{cli,server,client,hooks,utils,types}
mkdir -p src/server/{routes,middleware,services}
mkdir -p src/client/{components,layouts,pages,styles}
mkdir -p src/client/components/{sidebar,search,editor,theme}
mkdir -p public
mkdir -p tests/{unit,integration,e2e}

# Initialize package.json
echo "📦 Initializing package.json..."
cat > package.json << 'EOF'
{
  "name": "folder-site",
  "version": "0.1.0",
  "description": "One-command local website generator for documentation and knowledge bases",
  "type": "module",
  "scripts": {
    "dev": "bun run --watch src/cli/index.ts",
    "build": "bun run src/cli/build.ts",
    "start": "bun run src/cli/index.ts",
    "test": "bun test",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src --ext .ts,.tsx"
  },
  "bin": {
    "folder-site": "./dist/cli/index.js"
  },
  "dependencies": {
    "@react-symbols/icons": "^1.0.0",
    "@radix-ui/react-dialog": "^1.1.2",
    "@radix-ui/react-dropdown-menu": "^2.1.2",
    "@radix-ui/react-scroll-area": "^1.1.0",
    "@radix-ui/react-separator": "^1.1.0",
    "@radix-ui/react-switch": "^1.1.1",
    "@radix-ui/react-tooltip": "^1.1.3",
    "@radix-ui/react-command": "^1.1.1",
    "@radix-ui/react-resizable": "^1.1.0",
    "hono": "^4.6.3",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-icons": "^5.3.0",
    "unified": "^11.0.5",
    "remark-parse": "^11.0.0",
    "remark-rehype": "^11.1.2",
    "rehype-stringify": "^10.0.1",
    "rehype-highlight": "^7.0.2",
    "shiki": "^1.22.0",
    "chokidar": "^4.0.1",
    "lru-cache": "^11.0.2",
    "fuse.js": "^7.0.0",
    "jspdf": "^2.5.2",
    "html-to-pdfmake": "^2.5.12",
    "pdfmake": "^0.2.18",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.4"
  },
  "devDependencies": {
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "typescript": "^5.6.3",
    "tailwindcss": "^3.4.14",
    "postcss": "^8.4.47",
    "autoprefixer": "^10.4.20",
    "vite": "^5.4.10",
    "@vitejs/plugin-react": "^4.3.3",
    "eslint": "^9.13.0",
    "eslint-plugin-react": "^7.37.2",
    "eslint-plugin-react-hooks": "^5.0.0",
    "@typescript-eslint/eslint-plugin": "^8.11.0",
    "@typescript-eslint/parser": "^8.11.0"
  }
}
EOF

# Initialize TypeScript config
echo "🔧 Initializing TypeScript config..."
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "noEmit": true,
    "isolatedModules": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

# Initialize Tailwind CSS config
echo "🎨 Initializing Tailwind CSS config..."
cat > tailwind.config.ts << 'EOF'
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/client/**/*.{js,ts,jsx,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#3B82F6",
          light: "#60A5FA",
          dark: "#2563EB",
        },
        background: {
          light: "#F8FAFC",
          dark: "#0F172A",
        },
        sidebar: {
          light: "#FFFFFF",
          dark: "#1E293B",
        },
        border: {
          light: "#E2E8F0",
          dark: "#334155",
        },
      },
      fontFamily: {
        sans: ["IBM Plex Sans", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      zIndex: {
        base: 0,
        sidebar: 10,
        header: 20,
        search: 50,
        toast: 60,
      },
    },
  },
  plugins: [],
};

export default config;
EOF

# Initialize PostCSS config
cat > postcss.config.js << 'EOF'
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
EOF

# Initialize Vite config
echo "⚡ Initializing Vite config..."
cat > vite.config.ts << 'EOF'
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    host: true,
  },
  build: {
    outDir: "dist/client",
    emptyOutDir: true,
  },
});
EOF

# Create .gitignore
echo "📝 Creating .gitignore..."
cat > .gitignore << 'EOF'
# Dependencies
node_modules/

# Build outputs
dist/
build/

# Cache
.cache/
*.log

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Environment
.env
.env.local
.env.*.local

# Testing
coverage/

# Bun
bun.lockb
EOF

# Create README
echo "📖 Creating README.md..."
cat > README.md << 'EOF'
# Folder-Site CLI

> One-command local website generator for documentation and knowledge bases

## Features

- ✅ Single command execution (`folder-site`)
- ✅ VS Code-like interface with sidebar
- ✅ Markdown rendering with syntax highlighting
- ✅ Quick search (Cmd+P style)
- ✅ Real-time preview (auto-refresh)
- ✅ Dark/Light theme toggle
- ✅ Plugin system
- ✅ Workhub integration

## Quick Start

\`\`\`bash
# Install dependencies
bun install

# Start development
bun run dev

# Build for production
bun run build

# Start production server
bun run start
\`\`\`

## Usage

\`\`\`bash
# Start in current directory
folder-site

# Start in specific directory
folder-site /path/to/docs

# Start with custom port
folder-site --port 8080
\`\`\`

## Tech Stack

- **Runtime:** Bun
- **Server:** Hono
- **Frontend:** React + Vite
- **Styling:** Tailwind CSS
- **UI Components:** Radix UI + shadcn/ui
- **File Icons:** @react-symbols/icons
- **Icons:** RemixIcon

## Documentation

See `docs/design-catalog/` for system design documentation.

## License

MIT
EOF

# Create basic CLI entry point
echo "🔨 Creating CLI entry point..."
cat > src/cli/index.ts << 'EOF'
#!/usr/bin/env bun

import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { fileRoutes } from "../server/routes/files";
import { searchRoutes } from "../server/routes/search";
import { apiRoutes } from "../server/routes/api";

const app = new Hono();

// API routes
app.route("/api/files", fileRoutes);
app.route("/api/search", searchRoutes);
app.route("/api", apiRoutes);

// Serve static files
app.use("/*", serveStatic({ root: "./dist/client" }));

// SPA fallback
app.get("*", serveStatic({ path: "./dist/client/index.html" }));

const port = parseInt(process.env.PORT || "3000");

console.log(`🚀 Folder-Site CLI running at http://localhost:${port}`);
console.log(`📁 Serving directory: ${process.cwd()}`);

export default {
  port,
  fetch: app.fetch,
};
EOF

# Create placeholder files
echo "📄 Creating placeholder files..."
touch src/server/routes/files.ts
touch src/server/routes/search.ts
touch src/server/routes/api.ts
touch src/client/components/sidebar/Sidebar.tsx
touch src/client/components/search/SearchModal.tsx
touch src/client/components/editor/Editor.tsx
touch src/client/components/theme/ThemeToggle.tsx

# Install dependencies
echo "📦 Installing dependencies..."
bun install

echo ""
echo "✅ Project initialized successfully!"
echo ""
echo "Next steps:"
echo "  1. Review the structure in src/"
echo "  2. Run 'bun run dev' to start development"
echo "  3. Open http://localhost:3000 in your browser"
echo ""
echo "📚 See docs/design-catalog/ for system design documentation"
EOF
</think><tool_call>bash<arg_key>command</arg_key><arg_value>chmod +x /Users/dengwenyu/Dev/AI/folder-site/scripts/init-project.sh