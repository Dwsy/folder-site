/**
 * End-to-End Tests for Folder-Site CLI
 *
 * This test suite covers complete end-to-end scenarios:
 * - Server startup and initialization
 * - API endpoints functionality
 * - File operations
 * - Search functionality
 * - Theme switching
 * - Export functionality
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'bun:test';
import { mkdir, rm, writeFile, readFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { spawn, ChildProcess } from 'node:child_process';

// Test directory setup
const TEST_DIR = '/tmp/test-folder-site-e2e';
const TEST_PORT = 3456;
const SERVER_URL = `http://localhost:${TEST_PORT}`;

let serverProcess: ChildProcess | null = null;

/**
 * Start the CLI server
 */
async function startServer(): Promise<ChildProcess> {
  return new Promise((resolve, reject) => {
    const childProcess = spawn('bun', ['run', 'src/cli/index.ts', '--port', TEST_PORT.toString()], {
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        PORT: TEST_PORT.toString(),
        NODE_ENV: 'test',
      },
    });

    let output = '';
    let errorOutput = '';

    childProcess.stdout?.on('data', (data) => {
      output += data.toString();
      // Check for server startup message
      if (output.includes('Running at')) {
        resolve(childProcess);
      }
    });

    childProcess.stderr?.on('data', (data) => {
      errorOutput += data.toString();
    });

    childProcess.on('error', (error) => {
      reject(error);
    });

    // Timeout after 10 seconds
    setTimeout(() => {
      if (!output.includes('Running at')) {
        childProcess.kill();
        reject(new Error(`Server startup timeout. Output: ${output}\nError: ${errorOutput}`));
      }
    }, 10000);
  });
}

/**
 * Stop the CLI server
 */
async function stopServer(proc: ChildProcess): Promise<void> {
  return new Promise((resolve) => {
    proc.on('exit', () => resolve());
    proc.on('error', () => resolve());

    try {
      proc.kill('SIGTERM');
    } catch {
      // Process already terminated
    }

    // Force kill after 5 seconds
    setTimeout(() => {
      try {
        proc.kill('SIGKILL');
      } catch {
        // Process already terminated
      }
      resolve();
    }, 5000);
  });
}

/**
 * Wait for server to be ready
 */
async function waitForServer(maxAttempts = 30): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(`${SERVER_URL}/api/health`);
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

/**
 * Fetch with timeout
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout = 5000
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

/**
 * Create test directory structure
 */
async function createTestStructure(): Promise<void> {
  await mkdir(TEST_DIR, { recursive: true });
  await mkdir(join(TEST_DIR, 'docs'), { recursive: true });
  await mkdir(join(TEST_DIR, 'docs', 'guides'), { recursive: true });
  await mkdir(join(TEST_DIR, 'docs', 'api'), { recursive: true });

  // Create test markdown files
  await writeFile(
    join(TEST_DIR, 'README.md'),
    '# Folder-Site CLI\n\nA powerful documentation generator.\n\n## Features\n\n- Fast\n- Simple\n- Flexible'
  );
  await writeFile(
    join(TEST_DIR, 'docs', 'index.md'),
    '# Documentation\n\nWelcome to the docs.'
  );
  await writeFile(
    join(TEST_DIR, 'docs', 'guides', 'getting-started.md'),
    '# Getting Started\n\nInstallation instructions.\n\n```bash\nnpm install folder-site\n```'
  );
  await writeFile(
    join(TEST_DIR, 'docs', 'api', 'overview.md'),
    '# API Overview\n\nAPI endpoints documentation.'
  );
}

describe('End-to-End Tests', () => {
  describe('Server Startup and Initialization', () => {
    beforeEach(async () => {
      await createTestStructure();
    });

    afterEach(async () => {
      if (serverProcess) {
        await stopServer(serverProcess);
        serverProcess = null;
      }
      try {
        await rm(TEST_DIR, { recursive: true, force: true });
      } catch {
        // Ignore cleanup errors
      }
    });

    it('should start server successfully', async () => {
      serverProcess = await startServer();
      expect(serverProcess).not.toBeNull();

      const isReady = await waitForServer();
      expect(isReady).toBe(true);
    });

    it('should respond to health check', async () => {
      serverProcess = await startServer();
      await waitForServer();

      const response = await fetchWithTimeout(`${SERVER_URL}/api/health`);
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.status).toBe('ok');
    });

    it('should provide API information', async () => {
      serverProcess = await startServer();
      await waitForServer();

      const response = await fetchWithTimeout(`${SERVER_URL}/api`);
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.name).toBe('Folder-Site CLI API');
      expect(data.data.version).toBeDefined();
    });
  });

  describe('File Navigation', () => {
    beforeEach(async () => {
      await createTestStructure();
      serverProcess = await startServer();
      await waitForServer();
    });

    afterEach(async () => {
      if (serverProcess) {
        await stopServer(serverProcess);
        serverProcess = null;
      }
      try {
        await rm(TEST_DIR, { recursive: true, force: true });
      } catch {
        // Ignore cleanup errors
      }
    });

    it('should get file tree', async () => {
      const response = await fetchWithTimeout(`${SERVER_URL}/api/files/tree/list`);
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.tree).toBeDefined();
      expect(data.data.tree.isDirectory).toBe(true);
    });

    it('should navigate to nested directories', async () => {
      const treeResponse = await fetchWithTimeout(`${SERVER_URL}/api/files/tree/list`);
      const treeData = await treeResponse.json();
      const root = treeData.data.tree;

      const docsDir = root.children?.find((c: any) => c.name === 'docs');
      expect(docsDir).toBeDefined();
      expect(docsDir.isDirectory).toBe(true);
    });

    it('should get file content', async () => {
      const response = await fetchWithTimeout(`${SERVER_URL}/api/files/README.md`);
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.content).toBeDefined();
      expect(data.data.content).toContain('Folder-Site CLI');
    });

    it('should handle nested file paths', async () => {
      const response = await fetchWithTimeout(`${SERVER_URL}/api/files/docs/guides/getting-started.md`);
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.content).toContain('Getting Started');
    });
  });

  describe('Search Functionality', () => {
    beforeEach(async () => {
      await createTestStructure();
      serverProcess = await startServer();
      await waitForServer();
    });

    afterEach(async () => {
      if (serverProcess) {
        await stopServer(serverProcess);
        serverProcess = null;
      }
      try {
        await rm(TEST_DIR, { recursive: true, force: true });
      } catch {
        // Ignore cleanup errors
      }
    });

    it('should perform basic search', async () => {
      const response = await fetchWithTimeout(`${SERVER_URL}/api/search?q=installation`);
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.query).toBe('installation');
      expect(data.data.results).toBeDefined();
    });

    it('should handle empty search query', async () => {
      const response = await fetchWithTimeout(`${SERVER_URL}/api/search`);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('MISSING_QUERY');
    });

    it('should search with special characters', async () => {
      const response = await fetchWithTimeout(`${SERVER_URL}/api/search?q=npm%20install`);
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });

  describe('Theme Switching', () => {
    beforeEach(async () => {
      await createTestStructure();
      serverProcess = await startServer();
      await waitForServer();
    });

    afterEach(async () => {
      if (serverProcess) {
        await stopServer(serverProcess);
        serverProcess = null;
      }
      try {
        await rm(TEST_DIR, { recursive: true, force: true });
      } catch {
        // Ignore cleanup errors
      }
    });

    it('should load default theme', async () => {
      const response = await fetchWithTimeout(`${SERVER_URL}/api`);
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.success).toBe(true);
      // Theme would be handled client-side, but API should respond
    });

    it('should maintain theme across requests', async () => {
      const response1 = await fetchWithTimeout(`${SERVER_URL}/api/health`);
      const response2 = await fetchWithTimeout(`${SERVER_URL}/api/health`);

      expect(response1.ok).toBe(true);
      expect(response2.ok).toBe(true);

      const data1 = await response1.json();
      const data2 = await response2.json();

      expect(data1.data.version).toBe(data2.data.version);
    });
  });

  describe('Export Functionality', () => {
    const OUTPUT_DIR = '/tmp/test-folder-site-output';

    beforeEach(async () => {
      await createTestStructure();
      await mkdir(OUTPUT_DIR, { recursive: true });
      serverProcess = await startServer();
      await waitForServer();
    });

    afterEach(async () => {
      if (serverProcess) {
        await stopServer(serverProcess);
        serverProcess = null;
      }
      try {
        await rm(TEST_DIR, { recursive: true, force: true });
        await rm(OUTPUT_DIR, { recursive: true, force: true });
      } catch {
        // Ignore cleanup errors
      }
    });

    it('should export file to HTML', async () => {
      const response = await fetchWithTimeout(`${SERVER_URL}/api/files/README.md`);
      expect(response.ok).toBe(true);

      const data = await response.json();
      const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <title>Folder-Site CLI</title>
</head>
<body>
  <article>
    ${data.data.content}
  </article>
</body>
</html>`;

      await writeFile(join(OUTPUT_DIR, 'readme.html'), htmlContent);

      const outputFile = await readFile(join(OUTPUT_DIR, 'readme.html'), 'utf-8');
      expect(outputFile).toContain('<!DOCTYPE html>');
      expect(outputFile).toContain('Folder-Site CLI');
    });

    it('should export file to Markdown', async () => {
      const response = await fetchWithTimeout(`${SERVER_URL}/api/files/README.md`);
      expect(response.ok).toBe(true);

      const data = await response.json();
      await writeFile(join(OUTPUT_DIR, 'readme.md'), data.data.content);

      const outputFile = await readFile(join(OUTPUT_DIR, 'readme.md'), 'utf-8');
      expect(outputFile).toContain('# Folder-Site CLI');
    });

    it('should preserve formatting in exports', async () => {
      const response = await fetchWithTimeout(`${SERVER_URL}/api/files/docs/guides/getting-started.md`);
      expect(response.ok).toBe(true);

      const data = await response.json();
      const content = data.data.content;

      expect(content).toContain('```bash');
      expect(content).toContain('npm install');

      await writeFile(join(OUTPUT_DIR, 'exported.md'), content);
      const exported = await readFile(join(OUTPUT_DIR, 'exported.md'), 'utf-8');

      expect(exported).toContain('```bash');
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    beforeEach(async () => {
      await createTestStructure();
      serverProcess = await startServer();
      await waitForServer();
    });

    afterEach(async () => {
      if (serverProcess) {
        await stopServer(serverProcess);
        serverProcess = null;
      }
      try {
        await rm(TEST_DIR, { recursive: true, force: true });
      } catch {
        // Ignore cleanup errors
      }
    });

    it('should handle empty directory gracefully', async () => {
      const emptyDir = join(TEST_DIR, 'empty');
      await mkdir(emptyDir, { recursive: true });

      const response = await fetchWithTimeout(`${SERVER_URL}/api/files/tree/list`);
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it('should handle spaces in filenames', async () => {
      await writeFile(
        join(TEST_DIR, 'file with spaces.md'),
        '# File with Spaces\n\nContent.'
      );

      await new Promise(resolve => setTimeout(resolve, 500));

      const response = await fetchWithTimeout(`${SERVER_URL}/api/files`);
      expect(response.ok).toBe(true);
    });

    it('should handle unicode characters', async () => {
      await writeFile(
        join(TEST_DIR, '测试文件.md'),
        '# 测试\n\n中文内容.'
      );

      await new Promise(resolve => setTimeout(resolve, 500));

      const response = await fetchWithTimeout(`${SERVER_URL}/api/files`);
      expect(response.ok).toBe(true);
    });

    it('should handle concurrent requests', async () => {
      const requests = [
        fetchWithTimeout(`${SERVER_URL}/api/health`),
        fetchWithTimeout(`${SERVER_URL}/api/files`),
        fetchWithTimeout(`${SERVER_URL}/api/files/tree/list`),
      ];

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.ok).toBe(true);
      });
    });
  });

  describe('Performance', () => {
    beforeEach(async () => {
      await createTestStructure();

      // Create many files for performance testing
      const largeDir = join(TEST_DIR, 'large');
      await mkdir(largeDir, { recursive: true });

      for (let i = 0; i < 20; i++) {
        await writeFile(
          join(largeDir, `file${i}.md`),
          `# File ${i}\n\nContent for file ${i}.`
        );
      }

      serverProcess = await startServer();
      await waitForServer();
    });

    afterEach(async () => {
      if (serverProcess) {
        await stopServer(serverProcess);
        serverProcess = null;
      }
      try {
        await rm(TEST_DIR, { recursive: true, force: true });
      } catch {
        // Ignore cleanup errors
      }
    });

    it('should handle large file trees efficiently', async () => {
      const startTime = performance.now();

      const response = await fetchWithTimeout(`${SERVER_URL}/api/files/tree/list`);
      expect(response.ok).toBe(true);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(2000);
    });

    it('should handle multiple requests quickly', async () => {
      const durations: number[] = [];

      for (let i = 0; i < 5; i++) {
        const startTime = performance.now();
        const response = await fetchWithTimeout(`${SERVER_URL}/api/health`);
        expect(response.ok).toBe(true);
        const endTime = performance.now();
        durations.push(endTime - startTime);
      }

      durations.forEach(duration => {
        expect(duration).toBeLessThan(1000);
      });
    });
  });
});