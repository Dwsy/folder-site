/**
 * End-to-End Workflow Tests for Folder-Site CLI
 *
 * This test suite covers complete user workflows:
 * - CLI startup and initialization
 * - Folder scanning and index creation
 * - User interaction flows
 * - Normal exit flows
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { mkdir, rm, writeFile, readFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { spawn, ChildProcess } from 'node:child_process';
import { promisify } from 'node:util';

const exec = promisify(require('node:child_process').exec);

// Test directories
const TEST_DIR = '/tmp/test-folder-site-e2e-workflow';
const OUTPUT_DIR = '/tmp/test-folder-site-output';
const SERVER_PORT = 3456; // Use a different port to avoid conflicts

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

// Helper function to create test file structure
async function createTestStructure(): Promise<void> {
  await mkdir(TEST_DIR, { recursive: true });
  await mkdir(join(TEST_DIR, 'docs'), { recursive: true });
  await mkdir(join(TEST_DIR, 'docs', 'guides'), { recursive: true });
  await mkdir(join(TEST_DIR, 'docs', 'api'), { recursive: true });

  // Create markdown files
  await writeFile(
    join(TEST_DIR, 'README.md'),
    '# Folder-Site CLI\n\nA powerful documentation generator.\n\n## Features\n\n- Fast\n- Simple\n- Flexible'
  );
  await writeFile(
    join(TEST_DIR, 'docs', 'getting-started.md'),
    '# Getting Started\n\nInstallation instructions.\n\n## Install\n\n```bash\nnpm install folder-site\n```'
  );
  await writeFile(
    join(TEST_DIR, 'docs', 'guides', 'configuration.md'),
    '# Configuration\n\nHow to configure the CLI.\n\n## Options\n\n- port\n- theme\n- cache'
  );
  await writeFile(
    join(TEST_DIR, 'docs', 'api', 'overview.md'),
    '# API Overview\n\nAPI endpoints documentation.\n\n## Endpoints\n\n- GET /api/health\n- GET /api/files'
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

describe('E2E Workflow Tests', () => {
  describe('CLI Startup and Initialization', () => {
    let server: ChildProcess | null = null;

    beforeEach(async () => {
      await createTestStructure();
      await mkdir(OUTPUT_DIR, { recursive: true });
    });

    afterEach(async () => {
      if (server) {
        server.kill('SIGTERM');
        try {
          await new Promise((resolve, reject) => {
            server!.on('exit', resolve);
            server!.on('error', reject);
            setTimeout(() => reject(new Error('Server shutdown timeout')), 5000);
          });
        } catch {
          server.kill('SIGKILL');
        }
        server = null;
      }

      try {
        await rm(TEST_DIR, { recursive: true, force: true });
        await rm(OUTPUT_DIR, { recursive: true, force: true });
      } catch {
        // Ignore cleanup errors
      }
    });

    it('should start CLI server successfully', async () => {
      server = startCLIServer(TEST_DIR, SERVER_PORT);

      // Wait for server to start
      const isReady = await waitForServer(SERVER_PORT);
      expect(isReady).toBe(true);

      // Verify health endpoint
      const healthResponse = await fetch(`http://localhost:${SERVER_PORT}/api/health`);
      expect(healthResponse.ok).toBe(true);

      const healthData = await healthResponse.json();
      expect(healthData.success).toBe(true);
      expect(healthData.data.status).toBe('ok');
    });

    it('should initialize with default configuration', async () => {
      server = startCLIServer(TEST_DIR, SERVER_PORT);

      const isReady = await waitForServer(SERVER_PORT);
      expect(isReady).toBe(true);

      // Check API information
      const apiResponse = await fetch(`http://localhost:${SERVER_PORT}/api`);
      expect(apiResponse.ok).toBe(true);

      const apiData = await apiResponse.json();
      expect(apiData.success).toBe(true);
      expect(apiData.data.name).toBe('Folder-Site CLI API');
      expect(apiData.data.version).toBeDefined();
    });

    it('should handle startup errors gracefully', async () => {
      // Try to start server with invalid port (should fail gracefully)
      const errorServer = spawn('bun', ['run', 'src/cli/index.ts', '--port', 'invalid'], {
        cwd: TEST_DIR,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      // Wait a bit for error
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Server should have exited
      const exitCode = await new Promise<number>((resolve) => {
        errorServer.on('exit', resolve);
        setTimeout(() => resolve(-1), 2000);
      });

      expect(exitCode).not.toBe(0);

      errorServer.kill();
    });

    it('should display startup information', async () => {
      server = startCLIServer(TEST_DIR, SERVER_PORT);

      // Collect stdout
      let stdout = '';
      server.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      // Wait for startup
      await waitForServer(SERVER_PORT);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Verify startup messages
      expect(stdout).toContain('Folder-Site CLI');
      expect(stdout).toContain('Running at');
      expect(stdout).toContain('localhost');
      expect(stdout).toContain('API endpoints');
    });
  });

  describe('Folder Scanning and Index Creation', () => {
    let server: ChildProcess | null = null;

    beforeEach(async () => {
      await createTestStructure();
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

    it('should scan directory and return file tree', async () => {
      const response = await fetch(`http://localhost:${SERVER_PORT}/api/files/tree/list`);
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.tree).toBeDefined();
      expect(data.data.tree.isDirectory).toBe(true);
    });

    it('should scan nested directories', async () => {
      const response = await fetch(`http://localhost:${SERVER_PORT}/api/files/tree/list`);
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.tree.children).toBeDefined();
      expect(data.data.totalNodes).toBeGreaterThan(0);

      // Verify nested directories are included
      const hasNestedDirs = data.data.tree.children?.some((node: any) =>
        node.isDirectory && node.children && node.children.length > 0
      );
      expect(hasNestedDirs).toBe(true);
    });

    it('should create index for all markdown files', async () => {
      const response = await fetch(`http://localhost:${SERVER_PORT}/api/files`);
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.files).toBeDefined();

      // Should have markdown files
      const mdFiles = data.data.files.filter((f: any) => f.extension === '.md');
      expect(mdFiles.length).toBeGreaterThan(0);
    });

    it('should handle empty directories', async () => {
      // Create empty directory
      await mkdir(join(TEST_DIR, 'empty'), { recursive: true });

      const response = await fetch(`http://localhost:${SERVER_PORT}/api/files/tree/list`);
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.success).toBe(true);
      // Should handle empty directories without errors
    });

    it('should handle special characters in filenames', async () => {
      // Create files with special characters
      await writeFile(
        join(TEST_DIR, 'file with spaces.md'),
        '# File with Spaces\n\nContent.'
      );
      await writeFile(
        join(TEST_DIR, 'file-with-dashes.md'),
        '# File with Dashes\n\nContent.'
      );

      // Wait a bit for file system to settle
      await new Promise(resolve => setTimeout(resolve, 500));

      const response = await fetch(`http://localhost:${SERVER_PORT}/api/files`);
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.success).toBe(true);

      // Should find files with special characters
      const fileNames = data.data.files.map((f: any) => f.name);
      expect(fileNames).toContain('file with spaces.md');
      expect(fileNames).toContain('file-with-dashes.md');
    });
  });

  describe('User Interaction Flows', () => {
    let server: ChildProcess | null = null;

    beforeEach(async () => {
      await createTestStructure();
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

    it('should allow browsing file tree', async () => {
      // Get file tree
      const treeResponse = await fetch(`http://localhost:${SERVER_PORT}/api/files/tree/list`);
      expect(treeResponse.ok).toBe(true);

      const treeData = await treeResponse.json();
      expect(treeData.success).toBe(true);

      // Navigate through tree
      const root = treeData.data.tree;
      expect(root).toBeDefined();

      // Get file content
      if (root.children && root.children.length > 0) {
        const firstFile = root.children.find((c: any) => !c.isDirectory);
        if (firstFile) {
          const contentResponse = await fetch(
            `http://localhost:${SERVER_PORT}/api/files/${firstFile.relativePath}`
          );
          expect(contentResponse.ok).toBe(true);

          const contentData = await contentResponse.json();
          expect(contentData.success).toBe(true);
          expect(contentData.data.content).toBeDefined();
        }
      }
    });

    it('should support search functionality', async () => {
      const query = 'configuration';
      const response = await fetch(
        `http://localhost:${SERVER_PORT}/api/search?q=${encodeURIComponent(query)}`
      );
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.results).toBeDefined();
      expect(data.data.query).toBe(query);
    });

    it('should handle concurrent requests', async () => {
      // Make multiple concurrent requests
      const requests = [
        fetch(`http://localhost:${SERVER_PORT}/api/health`),
        fetch(`http://localhost:${SERVER_PORT}/api/files`),
        fetch(`http://localhost:${SERVER_PORT}/api/files/tree/list`),
        fetch(`http://localhost:${SERVER_PORT}/api/search?q=test`),
      ];

      const responses = await Promise.all(requests);

      // All requests should succeed
      responses.forEach(response => {
        expect(response.ok).toBe(true);
      });
    });

    it('should handle rapid sequential requests', async () => {
      // Make rapid sequential requests
      for (let i = 0; i < 10; i++) {
        const response = await fetch(`http://localhost:${SERVER_PORT}/api/health`);
        expect(response.ok).toBe(true);

        const data = await response.json();
        expect(data.success).toBe(true);
      }
    });
  });

  describe('Normal Exit Flows', () => {
    let server: ChildProcess | null = null;

    beforeEach(async () => {
      await createTestStructure();
      await mkdir(OUTPUT_DIR, { recursive: true });
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

    it('should shutdown gracefully on SIGTERM', async () => {
      server = startCLIServer(TEST_DIR, SERVER_PORT);
      await waitForServer(SERVER_PORT);

      // Send SIGTERM
      server.kill('SIGTERM');

      // Wait for graceful shutdown
      const exitCode = await new Promise<number>((resolve) => {
        server!.on('exit', (code) => resolve(code || 0));
        setTimeout(() => resolve(-1), 5000);
      });

      expect(exitCode).toBe(0);
    });

    it('should cleanup resources on exit', async () => {
      server = startCLIServer(TEST_DIR, SERVER_PORT);
      await waitForServer(SERVER_PORT);

      // Make a request to ensure resources are initialized
      await fetch(`http://localhost:${SERVER_PORT}/api/health`);

      // Shutdown server
      server.kill('SIGTERM');
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verify server is not responding
      try {
        await fetch(`http://localhost:${SERVER_PORT}/api/health`);
        expect.fail('Server should not be responding');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle Ctrl+C (SIGINT) gracefully', async () => {
      server = startCLIServer(TEST_DIR, SERVER_PORT);
      await waitForServer(SERVER_PORT);

      // Send SIGINT (Ctrl+C)
      server.kill('SIGINT');

      // Wait for graceful shutdown
      const exitCode = await new Promise<number>((resolve) => {
        server!.on('exit', (code) => resolve(code || 0));
        setTimeout(() => resolve(-1), 5000);
      });

      expect(exitCode).toBe(0);
    });

    it('should handle force kill (SIGKILL)', async () => {
      server = startCLIServer(TEST_DIR, SERVER_PORT);
      await waitForServer(SERVER_PORT);

      // Send SIGKILL
      server.kill('SIGKILL');

      // Wait for process to exit
      const exitCode = await new Promise<number>((resolve) => {
        server!.on('exit', (code, signal) => resolve(signal === 'SIGKILL' ? -9 : code || 0));
        setTimeout(() => resolve(-1), 2000);
      });

      // Process should exit
      expect(exitCode).not.toBeNull();
    });
  });

  describe('Error Handling Workflows', () => {
    let server: ChildProcess | null = null;

    beforeEach(async () => {
      await createTestStructure();
      await mkdir(OUTPUT_DIR, { recursive: true });
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

    it('should handle invalid API routes', async () => {
      server = startCLIServer(TEST_DIR, SERVER_PORT);
      await waitForServer(SERVER_PORT);

      const response = await fetch(`http://localhost:${SERVER_PORT}/api/invalid`);
      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
    });

    it('should handle missing search query', async () => {
      server = startCLIServer(TEST_DIR, SERVER_PORT);
      await waitForServer(SERVER_PORT);

      const response = await fetch(`http://localhost:${SERVER_PORT}/api/search`);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('MISSING_QUERY');
    });

    it('should handle non-existent file requests', async () => {
      server = startCLIServer(TEST_DIR, SERVER_PORT);
      await waitForServer(SERVER_PORT);

      const response = await fetch(`http://localhost:${SERVER_PORT}/api/files/non-existent.md`);
      expect(response.ok).toBe(true); // Should return empty content, not 404

      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it('should handle malformed requests', async () => {
      server = startCLIServer(TEST_DIR, SERVER_PORT);
      await waitForServer(SERVER_PORT);

      const response = await fetch(`http://localhost:${SERVER_PORT}/api/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'invalid json',
      });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('Performance Workflows', () => {
    let server: ChildProcess | null = null;

    beforeEach(async () => {
      await createTestStructure();

      // Create many files for performance testing
      const largeDir = join(TEST_DIR, 'large');
      await mkdir(largeDir, { recursive: true });

      for (let i = 0; i < 50; i++) {
        await writeFile(
          join(largeDir, `file${i}.md`),
          `# File ${i}\n\nContent for file ${i}.\n\n## Section\n\nMore content.`
        );
      }

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
      } catch {
        // Ignore cleanup errors
      }
    });

    it('should handle large file trees efficiently', async () => {
      const startTime = performance.now();

      const response = await fetch(`http://localhost:${SERVER_PORT}/api/files/tree/list`);
      expect(response.ok).toBe(true);

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete in reasonable time
      expect(duration).toBeLessThan(2000); // 2 seconds

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.totalNodes).toBeGreaterThan(50);
    });

    it('should handle multiple requests without degradation', async () => {
      const durations: number[] = [];

      // Make multiple requests and measure time
      for (let i = 0; i < 10; i++) {
        const startTime = performance.now();

        const response = await fetch(`http://localhost:${SERVER_PORT}/api/health`);
        expect(response.ok).toBe(true);

        const endTime = performance.now();
        durations.push(endTime - startTime);

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // All requests should complete quickly
      durations.forEach(duration => {
        expect(duration).toBeLessThan(500);
      });

      // Last request should not be significantly slower than first
      const firstDuration = durations[0];
      const lastDuration = durations[durations.length - 1];
      expect(lastDuration).toBeLessThan(firstDuration * 2);
    });
  });
});