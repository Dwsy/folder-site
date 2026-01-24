import { Link } from 'react-router-dom';
import { FaBook, FaCode, FaGithub, FaRocket } from 'react-icons/fa';
import { cn } from '../utils/cn.js';
import { useTOC } from '../contexts/TOCContext.js';

export function Home() {
  const { hasTOC } = useTOC();

  return (
    <div className={cn('mx-auto p-6', hasTOC ? 'max-w-4xl' : 'max-w-full')}>
      <div className="mb-8">
        <h1 className="mb-4 text-4xl font-bold">Welcome to Folder-Site CLI</h1>
        <p className="text-lg text-muted-foreground">
          One-command local website generator for documentation and knowledge bases
        </p>
      </div>

      <div className="mb-12 grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <FaRocket className="h-6 w-6 text-primary" />
          </div>
          <h2 className="mb-2 text-xl font-semibold">Quick Start</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Get started with Folder-Site CLI in minutes. Simply point it to your documentation folder.
          </p>
          <Link
            to="/docs"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            Get Started <FaBook className="h-4 w-4" />
          </Link>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <FaCode className="h-6 w-6 text-primary" />
          </div>
          <h2 className="mb-2 text-xl font-semibold">Features</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            File tree navigation, search, code highlighting, PDF export, and more.
          </p>
          <Link
            to="/features"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            Learn More <FaBook className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">Installation</h2>
          <pre className="mb-4 overflow-auto rounded-md bg-muted p-4">
            <code className="text-sm">bun add folder-site</code>
          </pre>
        <p className="text-sm text-muted-foreground">
          Or clone the repository and run{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 text-sm">bun install</code> to get started.
        </p>
      </div>

      <div className="mt-8 flex items-center justify-center gap-4 text-sm text-muted-foreground">
        <a
          href="https://github.com/Dwsy/folder-site"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 hover:text-foreground"
        >
          <FaGithub className="h-4 w-4" />
          GitHub
        </a>
        <span>•</span>
        <Link to="/docs" className="hover:text-foreground">
          Documentation
        </Link>
        <span>•</span>
        <Link to="/about" className="hover:text-foreground">
          About
        </Link>
      </div>
    </div>
  );
}
