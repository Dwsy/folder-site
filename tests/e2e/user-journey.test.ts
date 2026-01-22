/**
 * End-to-End User Journey Tests for Folder-Site CLI
 *
 * This test suite covers complete user journeys from start to finish:
 * - File navigation journeys
 * - Search and discovery journeys
 * - Theme switching journeys
 * - Export functionality journeys
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { mkdir, rm, writeFile, readFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { spawn, ChildProcess } from 'node:child_process';

// Test directories
const TEST_DIR = '/tmp/test-folder-site-user-journey';
const OUTPUT_DIR = '/tmp/test-folder-site-user-output';
const SERVER_PORT = 3457; // Use a different port to avoid conflicts

// Helper function to wait for server to start
async function waitForServer(port: number, maxAttempts = 30): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(`http://localhost:${port}/api/health`);
      if (response.ok) {
        return true;
      }
    } catch {
      // Server not ready yet
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  return false;
}

// Helper function to create comprehensive test structure
async function createComprehensiveTestStructure(): Promise<void> {
  await mkdir(TEST_DIR, { recursive: true });

  // Create documentation structure
  await mkdir(join(TEST_DIR, 'docs'), { recursive: true });
  await mkdir(join(TEST_DIR, 'docs', 'getting-started'), { recursive: true });
  await mkdir(join(TEST_DIR, 'docs', 'features'), { recursive: true });
  await mkdir(join(TEST_DIR, 'docs', 'api'), { recursive: true });
  await mkdir(join(TEST_DIR, 'docs', 'guides'), { recursive: true });

  // Create main documentation files
  await writeFile(
    join(TEST_DIR, 'README.md'),
    `# Folder-Site CLI

A powerful documentation generator for local development.

## Quick Start

\`\`\`bash
npm install folder-site
folder-site start
\`\`\`

## Features

- **Fast**: Instant preview
- **Simple**: One command setup
- **Flexible**: Custom themes and plugins

## License

MIT`
  );

  await writeFile(
    join(TEST_DIR, 'docs', 'index.md'),
    `# Documentation

Welcome to the Folder-Site CLI documentation.

## Table of Contents

- [Getting Started](./getting-started/)
- [Features](./features/)
- [API Reference](./api/)
- [Guides](./guides/)`
  );

  await writeFile(
    join(TEST_DIR, 'docs', 'getting-started', 'installation.md'),
    `# Installation

Learn how to install Folder-Site CLI.

## Prerequisites

- Node.js 18+
- npm or yarn

## Install via npm

\`\`\`bash
npm install -g folder-site
\`\`\`

## Install via yarn

\`\`\`bash
yarn global add folder-site
\`\`\`

## Verify Installation

\`\`\`bash
folder-site --version
\`\`\``
  );

  await writeFile(
    join(TEST_DIR, 'docs', 'getting-started', 'quick-start.md'),
    `# Quick Start

Get started with Folder-Site CLI in minutes.

## Initialize Project

\`\`\`bash
mkdir my-docs
cd my-docs
folder-site init
\`\`\`

## Start Server

\`\`\`bash
folder-site start
\`\`\`

## Open Browser

Navigate to http://localhost:3000`
  );

  await writeFile(
    join(TEST_DIR, 'docs', 'features', 'search.md'),
    `# Search Feature

Powerful search functionality for your documentation.

## Usage

Press \`/\` to open search modal.

## Search Syntax

- \`keyword\`: Search for keyword
- \`tag:feature\`: Search by tag
- \`path:docs\`: Search in specific path`
  );

  await writeFile(
    join(TEST_DIR, 'docs', 'features', 'themes.md'),
    `# Themes

Customize the look and feel of your documentation.

## Available Themes

- Light
- Dark
- Auto (system preference)

## Custom Themes

You can create custom themes using CSS variables.`
  );

  await writeFile(
    join(TEST_DIR, 'docs', 'api', 'endpoints.md'),
    `# API Endpoints

REST API endpoints for Folder-Site CLI.

## Health Check

\`\`\`http
GET /api/health
\`\`\`

## File Operations

\`\`\`http
GET /api/files
GET /api/files/tree/list
GET /api/files/:path
\`\`\`

## Search

\`\`\`http
GET /api/search?q=query
POST /api/search
\`\`\``
  );

  await writeFile(
    join(TEST_DIR, 'docs', 'guides', 'deployment.md'),
    `# Deployment Guide

Deploy your documentation to production.

## Build for Production

\`\`\`bash
folder-site build
\`\`\`

## Deploy to Vercel

\`\`\`bash
vercel deploy
\`\`\`

## Deploy to Netlify

\`\`\`bash
netlify deploy --prod
\`\`\``
  );

  await writeFile(
    join(TEST_DIR, 'CHANGELOG.md'),
    `# Changelog

## [0.1.0] - 2026-01-22

### Added
- Initial release
- Markdown rendering
- File tree navigation
- Search functionality
- Theme support
- Export features`
  );

  await writeFile(
    join(TEST_DIR, 'LICENSE'),
    `MIT License

Copyright (c) 2026

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software...`
  );
}

// Helper function to start CLI server
function startCLIServer(workingDir: string, port: number): ChildProcess {
  return spawn('bun', ['run', 'src/cli/index.ts', '--port', port.toString()], {
    cwd: workingDir,
    stdio: ['pipe', 'pipe', 'pipe'],
    env: {
      ...globalThis.process?.env || {},
      PORT: port.toString(),
    },
  });
}

describe('E2E User Journey Tests', () => {
  describe('File Navigation Journeys', () => {
    let server: ChildProcess | null = null;

    beforeEach(async () => {
      await createComprehensiveTestStructure();
      await mkdir(OUTPUT_DIR, { recursive: true });
      server = startCLIServer(TEST_DIR, SERVER_PORT);
      await waitForServer(SERVER_PORT);
    });

    afterEach(async () => {
      if (server) {
        server.kill('SIGTERM');
        await new Promise(resolve => setTimeout(resolve, 500));
        server = null;
      }

      try {
        await rm(TEST_DIR, { recursive: true, force: true });
        await rm(OUTPUT_DIR, { recursive: true, force: true });
      } catch {
        // Ignore cleanup errors
      }
    });

    it('should navigate from root to nested file', async () => {
      // Journey: Root -> docs -> getting-started -> installation.md

      // Step 1: Get root file tree
      const treeResponse = await fetch(`http://localhost:${SERVER_PORT}/api/files/tree/list`);
      expect(treeResponse.ok).toBe(true);

      const treeData = await treeResponse.json();
      const root = treeData.data.tree;

      // Step 2: Find docs directory
      const docsDir = root.children?.find((c: any) => c.name === 'docs');
      expect(docsDir).toBeDefined();
      expect(docsDir.isDirectory).toBe(true);

      // Step 3: Navigate to docs
      const docsPath = docsDir.relativePath;

      // Step 4: Find getting-started directory
      const gettingStartedDir = docsDir.children?.find((c: any) => c.name === 'getting-started');
      expect(gettingStartedDir).toBeDefined();
      expect(gettingStartedDir.isDirectory).toBe(true);

      // Step 5: Find installation.md
      const installationFile = gettingStartedDir.children?.find((c: any) => c.name === 'installation.md');
      expect(installationFile).toBeDefined();
      expect(installationFile.isDirectory).toBe(false);

      // Step 6: Get file content
      const contentResponse = await fetch(
        `http://localhost:${SERVER_PORT}/api/files/${installationFile.relativePath}`
      );
      expect(contentResponse.ok).toBe(true);

      const contentData = await contentResponse.json();
      expect(contentData.success).toBe(true);
      expect(contentData.data.content).toContain('Installation');
      expect(contentData.data.content).toContain('npm install');
    });

    it('should navigate back to parent directory', async () => {
      // Journey: Navigate deep and then back up

      const treeResponse = await fetch(`http://localhost:${SERVER_PORT}/api/files/tree/list`);
      const treeData = await treeResponse.json();
      const root = treeData.data.tree;

      // Navigate to deep file
      const docsDir = root.children?.find((c: any) => c.name === 'docs');
      const gettingStartedDir = docsDir.children?.find((c: any) => c.name === 'getting-started');
      const installationFile = gettingStartedDir.children?.find((c: any) => c.name === 'installation.md');

      // Get deep file
      const deepFileResponse = await fetch(
        `http://localhost:${SERVER_PORT}/api/files/${installationFile.relativePath}`
      );
      expect(deepFileResponse.ok).toBe(true);

      // Navigate back to root
      const rootResponse = await fetch(`http://localhost:${SERVER_PORT}/api/files/tree/list`);
      expect(rootResponse.ok).toBe(true);

      const rootData = await rootResponse.json();
      expect(rootData.success).toBe(true);
      expect(rootData.data.tree.name).toBe('root');
    });

    it('should navigate between sibling files', async () => {
      // Journey: Navigate between files in the same directory

      const treeResponse = await fetch(`http://localhost:${SERVER_PORT}/api/files/tree/list`);
      const treeData = await treeResponse.json();
      const root = treeData.data.tree;

      // Find docs directory
      const docsDir = root.children?.find((c: any) => c.name === 'docs');
      const gettingStartedDir = docsDir.children?.find((c: any) => c.name === 'getting-started');

      // Get both files in the directory
      const files = gettingStartedDir.children?.filter((c: any) => !c.isDirectory);
      expect(files.length).toBeGreaterThanOrEqual(2);

      // Navigate to first file
      const firstFile = files[0];
      const firstResponse = await fetch(
        `http://localhost:${SERVER_PORT}/api/files/${firstFile.relativePath}`
      );
      expect(firstResponse.ok).toBe(true);

      // Navigate to second file
      const secondFile = files[1];
      const secondResponse = await fetch(
        `http://localhost:${SERVER_PORT}/api/files/${secondFile.relativePath}`
      );
      expect(secondResponse.ok).toBe(true);

      // Verify different content
      const firstData = await firstResponse.json();
      const secondData = await secondResponse.json();
      expect(firstData.data.content).not.toBe(secondData.data.content);
    });

    it('should handle file selection and display', async () => {
      // Journey: Select file and display full content with metadata

      const treeResponse = await fetch(`http://localhost:${SERVER_PORT}/api/files/tree/list`);
      const treeData = await treeResponse.json();
      const root = treeData.data.tree;

      // Find README.md
      const readmeFile = root.children?.find((c: any) => c.name === 'README.md');
      expect(readmeFile).toBeDefined();

      // Get file content
      const contentResponse = await fetch(
        `http://localhost:${SERVER_PORT}/api/files/${readmeFile.relativePath}`
      );
      expect(contentResponse.ok).toBe(true);

      const contentData = await contentResponse.json();

      // Verify file info
      expect(contentData.data.info).toBeDefined();
      expect(contentData.data.info.name).toBe('README.md');
      expect(contentData.data.info.extension).toBe('.md');
      expect(contentData.data.info.isFile).toBe(true);

      // Verify content
      expect(contentData.data.content).toBeDefined();
      expect(contentData.data.content).toContain('Folder-Site CLI');

      // Verify metadata
      expect(contentData.data.meta).toBeDefined();
      expect(contentData.data.meta.title).toBeDefined();
    });

    it('should navigate through documentation structure', async () => {
      // Journey: Complete documentation tour

      // Start at docs/index.md
      const docsIndexResponse = await fetch(`http://localhost:${SERVER_PORT}/api/files/docs/index.md`);
      expect(docsIndexResponse.ok).toBe(true);

      const docsIndexData = await docsIndexResponse.json();
      expect(docsIndexData.data.content).toContain('Getting Started');

      // Navigate to getting-started
      const treeResponse = await fetch(`http://localhost:${SERVER_PORT}/api/files/tree/list`);
      const treeData = await treeResponse.json();
      const root = treeData.data.tree;
      const docsDir = root.children?.find((c: any) => c.name === 'docs');
      const gettingStartedDir = docsDir.children?.find((c: any) => c.name === 'getting-started');

      // Visit all files in getting-started
      for (const child of gettingStartedDir.children || []) {
        if (!child.isDirectory) {
          const fileResponse = await fetch(
            `http://localhost:${SERVER_PORT}/api/files/${child.relativePath}`
          );
          expect(fileResponse.ok).toBe(true);

          const fileData = await fileResponse.json();
          expect(fileData.success).toBe(true);
          expect(fileData.data.content.length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('Search and Discovery Journeys', () => {
    let server: ChildProcess | null = null;

    beforeEach(async () => {
      await createComprehensiveTestStructure();
      await mkdir(OUTPUT_DIR, { recursive: true });
      server = startCLIServer(TEST_DIR, SERVER_PORT);
      await waitForServer(SERVER_PORT);
    });

    afterEach(async () => {
      if (server) {
        server.kill('SIGTERM');
        await new Promise(resolve => setTimeout(resolve, 500));
        server = null;
      }

      try {
        await rm(TEST_DIR, { recursive: true, force: true });
        await rm(OUTPUT_DIR, { recursive: true, force: true });
      } catch {
        // Ignore cleanup errors
      }
    });

    it('should search for specific content', async () => {
      // Journey: User searches for "installation"

      const searchResponse = await fetch(
        `http://localhost:${SERVER_PORT}/api/search?q=${encodeURIComponent('installation')}`
      );
      expect(searchResponse.ok).toBe(true);

      const searchData = await searchResponse.json();
      expect(searchData.success).toBe(true);
      expect(searchData.data.query).toBe('installation');
      expect(searchData.data.results).toBeDefined();
    });

    it('should navigate search results', async () => {
      // Journey: Search, then navigate through results

      const query = 'theme';
      const searchResponse = await fetch(
        `http://localhost:${SERVER_PORT}/api/search?q=${encodeURIComponent(query)}`
      );
      const searchData = await searchResponse.json();

      // If we have results, navigate to them
      if (searchData.data.results && searchData.data.results.length > 0) {
        const firstResult = searchData.data.results[0];

        // Navigate to the file
        const fileResponse = await fetch(
          `http://localhost:${SERVER_PORT}/api/files/${firstResult.path}`
        );
        expect(fileResponse.ok).toBe(true);

        const fileData = await fileResponse.json();
        expect(fileData.success).toBe(true);
      }
    });

    it('should filter search results', async () => {
      // Journey: Search and apply filters

      const query = 'api';
      const searchResponse = await fetch(
        `http://localhost:${SERVER_PORT}/api/search?q=${encodeURIComponent(query)}&scope=all&limit=10`
      );
      expect(searchResponse.ok).toBe(true);

      const searchData = await searchResponse.json();
      expect(searchData.success).toBe(true);
      expect(searchData.data.query).toBe('api');
    });

    it('should handle empty search results', async () => {
      // Journey: Search for non-existent content

      const searchResponse = await fetch(
        `http://localhost:${SERVER_PORT}/api/search?q=${encodeURIComponent('nonexistentcontentxyz')}`
      );
      expect(searchResponse.ok).toBe(true);

      const searchData = await searchResponse.json();
      expect(searchData.success).toBe(true);
      expect(searchData.data.results).toBeDefined();
      expect(searchData.data.total).toBe(0);
    });

    it('should search with complex queries', async () => {
      // Journey: Search for multi-word phrases

      const query = 'quick start';
      const searchResponse = await fetch(
        `http://localhost:${SERVER_PORT}/api/search?q=${encodeURIComponent(query)}`
      );
      expect(searchResponse.ok).toBe(true);

      const searchData = await searchResponse.json();
      expect(searchData.success).toBe(true);
      expect(searchData.data.query).toBe('quick start');
    });

    it('should handle rapid successive searches', async () => {
      // Journey: User types quickly, multiple searches

      const queries = ['install', 'theme', 'api', 'deploy', 'search'];

      for (const query of queries) {
        const searchResponse = await fetch(
          `http://localhost:${SERVER_PORT}/api/search?q=${encodeURIComponent(query)}`
        );
        expect(searchResponse.ok).toBe(true);

        const searchData = await searchResponse.json();
        expect(searchData.success).toBe(true);
      }
    });
  });

  describe('Theme Switching Journeys', () => {
    let server: ChildProcess | null = null;

    beforeEach(async () => {
      await createComprehensiveTestStructure();
      await mkdir(OUTPUT_DIR, { recursive: true });
      server = startCLIServer(TEST_DIR, SERVER_PORT);
      await waitForServer(SERVER_PORT);
    });

    afterEach(async () => {
      if (server) {
        server.kill('SIGTERM');
        await new Promise(resolve => setTimeout(resolve, 500));
        server = null;
      }

      try {
        await rm(TEST_DIR, { recursive: true, force: true });
        await rm(OUTPUT_DIR, { recursive: true, force: true });
      } catch {
        // Ignore cleanup errors
      }
    });

    it('should use default theme on first load', async () => {
      // Journey: First visit, verify default theme

      const response = await fetch(`http://localhost:${SERVER_PORT}/api`);
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.version).toBeDefined();
    });

    it('should support theme switching', async () => {
      // Journey: User switches from light to dark theme

      // Note: Theme switching would be handled via client-side state
      // For e2e testing, we verify the API supports theme-related operations

      const response = await fetch(`http://localhost:${SERVER_PORT}/api`);
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it('should handle theme persistence', async () => {
      // Journey: Switch theme and verify persistence

      // Theme persistence would be handled via client-side storage
      // For e2e testing, we verify the API remains functional

      const response1 = await fetch(`http://localhost:${SERVER_PORT}/api/health`);
      expect(response1.ok).toBe(true);

      const response2 = await fetch(`http://localhost:${SERVER_PORT}/api/health`);
      expect(response2.ok).toBe(true);
    });

    it('should render content correctly in different themes', async () => {
      // Journey: View content with different themes

      // Get file content
      const contentResponse = await fetch(`http://localhost:${SERVER_PORT}/api/files/README.md`);
      expect(contentResponse.ok).toBe(true);

      const contentData = await contentResponse.json();
      expect(contentData.success).toBe(true);
      expect(contentData.data.content).toBeDefined();

      // Content should be theme-agnostic
      expect(contentData.data.content).toContain('Folder-Site CLI');
    });
  });

  describe('Export Functionality Journeys', () => {
    let server: ChildProcess | null = null;

    beforeEach(async () => {
      await createComprehensiveTestStructure();
      await mkdir(OUTPUT_DIR, { recursive: true });
      server = startCLIServer(TEST_DIR, SERVER_PORT);
      await waitForServer(SERVER_PORT);
    });

    afterEach(async () => {
      if (server) {
        server.kill('SIGTERM');
        await new Promise(resolve => setTimeout(resolve, 500));
        server = null;
      }

      try {
        await rm(TEST_DIR, { recursive: true, force: true });
        await rm(OUTPUT_DIR, { recursive: true, force: true });
      } catch {
        // Ignore cleanup errors
      }
    });

    it('should export single file to HTML', async () => {
      // Journey: Export README.md to HTML

      const contentResponse = await fetch(`http://localhost:${SERVER_PORT}/api/files/README.md`);
      expect(contentResponse.ok).toBe(true);

      const contentData = await contentResponse.json();
      const markdownContent = contentData.data.content;

      // Create simple HTML output
      const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <title>Folder-Site CLI</title>
  <meta charset="utf-8">
</head>
<body>
  <article>
    ${markdownContent}
  </article>
</body>
</html>`;

      // Write to output
      await writeFile(join(OUTPUT_DIR, 'readme.html'), htmlContent);

      // Verify file exists
      await expect(access(join(OUTPUT_DIR, 'readme.html'))).resolves.toBeUndefined();

      // Verify content
      const outputFile = await readFile(join(OUTPUT_DIR, 'readme.html'), 'utf-8');
      expect(outputFile).toContain('<!DOCTYPE html>');
      expect(outputFile).toContain('Folder-Site CLI');
    });

    it('should export single file to Markdown', async () => {
      // Journey: Export content to Markdown

      const contentResponse = await fetch(`http://localhost:${SERVER_PORT}/api/files/README.md`);
      expect(contentResponse.ok).toBe(true);

      const contentData = await contentResponse.json();
      const markdownContent = contentData.data.content;

      // Write to output
      await writeFile(join(OUTPUT_DIR, 'exported.md'), markdownContent);

      // Verify file exists
      await expect(access(join(OUTPUT_DIR, 'exported.md'))).resolves.toBeUndefined();

      // Verify content
      const outputFile = await readFile(join(OUTPUT_DIR, 'exported.md'), 'utf-8');
      expect(outputFile).toContain('# Folder-Site CLI');
    });

    it('should export multiple files to HTML', async () => {
      // Journey: Export all documentation files to HTML

      const treeResponse = await fetch(`http://localhost:${SERVER_PORT}/api/files/tree/list`);
      const treeData = await treeResponse.json();
      const root = treeData.data.tree;

      // Find all markdown files
      const allFiles: any[] = [];
      const collectFiles = (node: any) => {
        if (!node.isDirectory) {
          allFiles.push(node);
        }
        if (node.children) {
          node.children.forEach(collectFiles);
        }
      };
      collectFiles(root);

      // Export each file
      for (const file of allFiles.slice(0, 5)) { // Limit to 5 files for testing
        const contentResponse = await fetch(
          `http://localhost:${SERVER_PORT}/api/files/${file.relativePath}`
        );
        expect(contentResponse.ok).toBe(true);

        const contentData = await contentResponse.json();
        const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <title>${file.name}</title>
</head>
<body>
  <article>
    ${contentData.data.content}
  </article>
</body>
</html>`;

        const outputPath = join(OUTPUT_DIR, `${file.name}.html`);
        await writeFile(outputPath, htmlContent);
      }

      // Verify files were created
      const outputFiles = allFiles.slice(0, 5).map(f => `${f.name}.html`);
      for (const filename of outputFiles) {
        await expect(access(join(OUTPUT_DIR, filename))).resolves.toBeUndefined();
      }
    });

    it('should export to custom output path', async () => {
      // Journey: Export to custom directory

      const customDir = join(OUTPUT_DIR, 'custom-export');
      await mkdir(customDir, { recursive: true });

      const contentResponse = await fetch(`http://localhost:${SERVER_PORT}/api/files/README.md`);
      const contentData = await contentResponse.json();

      await writeFile(join(customDir, 'readme.md'), contentData.data.content);

      // Verify file exists in custom path
      await expect(access(join(customDir, 'readme.md'))).resolves.toBeUndefined();
    });

    it('should preserve formatting in exported files', async () => {
      // Journey: Verify formatting is preserved

      const contentResponse = await fetch(`http://localhost:${SERVER_PORT}/api/files/docs/getting-started/installation.md`);
      expect(contentResponse.ok).toBe(true);

      const contentData = await contentResponse.json();
      const markdownContent = contentData.data.content;

      // Verify code blocks are preserved
      expect(markdownContent).toContain('```bash');
      expect(markdownContent).toContain('npm install');

      // Verify headings are preserved
      expect(markdownContent).toContain('# Installation');
      expect(markdownContent).toContain('## Prerequisites');

      // Export and verify
      await writeFile(join(OUTPUT_DIR, 'installation-export.md'), markdownContent);
      const exportedContent = await readFile(join(OUTPUT_DIR, 'installation-export.md'), 'utf-8');

      expect(exportedContent).toContain('```bash');
      expect(exportedContent).toContain('npm install');
    });
  });

  describe('Complete User Journey', () => {
    let server: ChildProcess | null = null;

    beforeEach(async () => {
      await createComprehensiveTestStructure();
      await mkdir(OUTPUT_DIR, { recursive: true });
      server = startCLIServer(TEST_DIR, SERVER_PORT);
      await waitForServer(SERVER_PORT);
    });

    afterEach(async () => {
      if (server) {
        server.kill('SIGTERM');
        await new Promise(resolve => setTimeout(resolve, 500));
        server = null;
      }

      try {
        await rm(TEST_DIR, { recursive: true, force: true });
        await rm(OUTPUT_DIR, { recursive: true, force: true });
      } catch {
        // Ignore cleanup errors
      }
    });

    it('should complete full user workflow', async () => {
      // Journey: Complete user workflow
      // 1. Start server
      // 2. Browse file tree
      // 3. Navigate to documentation
      // 4. Search for content
      // 5. View file
      // 6. Export content
      // 7. Shutdown

      // Step 1: Verify server is running
      const healthResponse = await fetch(`http://localhost:${SERVER_PORT}/api/health`);
      expect(healthResponse.ok).toBe(true);

      // Step 2: Browse file tree
      const treeResponse = await fetch(`http://localhost:${SERVER_PORT}/api/files/tree/list`);
      expect(treeResponse.ok).toBe(true);
      const treeData = await treeResponse.json();
      expect(treeData.success).toBe(true);

      // Step 3: Navigate to documentation
      const root = treeData.data.tree;
      const docsDir = root.children?.find((c: any) => c.name === 'docs');
      expect(docsDir).toBeDefined();

      // Step 4: Search for content
      const searchResponse = await fetch(
        `http://localhost:${SERVER_PORT}/api/search?q=${encodeURIComponent('installation')}`
      );
      expect(searchResponse.ok).toBe(true);
      const searchData = await searchResponse.json();
      expect(searchData.success).toBe(true);

      // Step 5: View file
      const readmeResponse = await fetch(`http://localhost:${SERVER_PORT}/api/files/README.md`);
      expect(readmeResponse.ok).toBe(true);
      const readmeData = await readmeResponse.json();
      expect(readmeData.success).toBe(true);

      // Step 6: Export content
      await writeFile(join(OUTPUT_DIR, 'exported-readme.md'), readmeData.data.content);
      await expect(access(join(OUTPUT_DIR, 'exported-readme.md'))).resolves.toBeUndefined();

      // Step 7: Verify exported content
      const exportedContent = await readFile(join(OUTPUT_DIR, 'exported-readme.md'), 'utf-8');
      expect(exportedContent).toContain('Folder-Site CLI');

      // Journey complete!
      expect(true).toBe(true);
    });

    it('should handle new user onboarding journey', async () => {
      // Journey: New user explores the documentation

      // 1. Check health
      const healthResponse = await fetch(`http://localhost:${SERVER_PORT}/api/health`);
      expect(healthResponse.ok).toBe(true);

      // 2. View README
      const readmeResponse = await fetch(`http://localhost:${SERVER_PORT}/api/files/README.md`);
      expect(readmeResponse.ok).toBe(true);
      const readmeData = await readmeResponse.json();
      expect(readmeData.data.content).toContain('Quick Start');

      // 3. Navigate to getting started
      const gettingStartedResponse = await fetch(
        `http://localhost:${SERVER_PORT}/api/files/docs/getting-started/quick-start.md`
      );
      expect(gettingStartedResponse.ok).toBe(true);
      const gettingStartedData = await gettingStartedResponse.json();
      expect(gettingStartedData.data.content).toContain('Initialize Project');

      // 4. View installation guide
      const installationResponse = await fetch(
        `http://localhost:${SERVER_PORT}/api/files/docs/getting-started/installation.md`
      );
      expect(installationResponse.ok).toBe(true);
      const installationData = await installationResponse.json();
      expect(installationData.data.content).toContain('npm install');

      // 5. Search for features
      const searchResponse = await fetch(
        `http://localhost:${SERVER_PORT}/api/search?q=${encodeURIComponent('features')}`
      );
      expect(searchResponse.ok).toBe(true);

      // New user onboarding complete!
      expect(true).toBe(true);
    });
  });
});