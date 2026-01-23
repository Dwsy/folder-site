/**
 * 文件扫描服务测试
 */

import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { FileScanner, ScanOptions, FileMetadata } from "../src/server/services/scanner";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("FileScanner", () => {
  let testDir: string;

  beforeAll(async () => {
    // 创建临时测试目录
    testDir = join(tmpdir(), `folder-site-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });

    // 创建测试文件结构
    await mkdir(join(testDir, "docs"), { recursive: true });
    await mkdir(join(testDir, "docs", "nested"), { recursive: true });
    await mkdir(join(testDir, "node_modules"), { recursive: true });
    await mkdir(join(testDir, ".git"), { recursive: true });

    // 创建测试文件
    await writeFile(join(testDir, "README.md"), "# README\n\nThis is a test file.");
    await writeFile(join(testDir, "config.json"), '{"name": "test"}');
    await writeFile(join(testDir, ".env"), "API_KEY=test");
    await writeFile(join(testDir, "docs", "guide.md"), "# Guide\n\nDocumentation.");
    await writeFile(join(testDir, "docs", "nested", "detail.md"), "# Detail\n\nMore info.");
    await writeFile(join(testDir, "docs", "diagram.mmd"), "graph TD; A-->B;");
    await writeFile(join(testDir, "ignore.txt"), "Should be ignored");
    await writeFile(join(testDir, "node_modules", "package.json"), '{"name": "dep"}');
    await writeFile(join(testDir, ".git", "config"), "[core]");
  });

  afterAll(async () => {
    // 清理临时目录
    await rm(testDir, { recursive: true, force: true });
  });

  describe("基本扫描功能", () => {
    it("应该扫描目录并返回文件列表", async () => {
      const scanner = new FileScanner({ rootDir: testDir });
      const result = await scanner.scan();

      expect(result.files.length).toBeGreaterThan(0);
      expect(result.rootPath).toBe(testDir);
    });

    it("应该按扩展名过滤文件", async () => {
      const scanner = new FileScanner({
        rootDir: testDir,
        extensions: [".md"],
      });
      const result = await scanner.scan();

      result.files.forEach((file) => {
        expect([".md", ".mmd"]).toContain(file.extension);
      });
    });

    it("应该包含正确的文件元数据", async () => {
      const scanner = new FileScanner({
        rootDir: testDir,
        extensions: [".md"],
      });
      const result = await scanner.scan();
      const readmeFile = result.files.find((f) => f.name === "README.md");

      expect(readmeFile).toBeDefined();
      expect(readmeFile?.name).toBe("README.md");
      expect(readmeFile?.extension).toBe(".md");
      expect(readmeFile?.size).toBeGreaterThan(0);
      expect(readmeFile?.isDirectory).toBe(false);
      expect(readmeFile?.relativePath).toBe("README.md");
    });
  });

  describe("递归扫描", () => {
    it("应该递归扫描子目录", async () => {
      const scanner = new FileScanner({
        rootDir: testDir,
        extensions: [".md", ".mmd"],
      });
      const result = await scanner.scan();

      // 应该包含嵌套目录中的文件
      const nestedFile = result.files.find((f) => f.relativePath === "docs/nested/detail.md");
      expect(nestedFile).toBeDefined();

      // 应该包含 .mmd 文件
      const mmdFile = result.files.find((f) => f.name === "diagram.mmd");
      expect(mmdFile).toBeDefined();
    });

    it("应该支持限制扫描深度", async () => {
      const scanner = new FileScanner({
        rootDir: testDir,
        extensions: [".md"],
        maxDepth: 1,
      });
      const result = await scanner.scan();

      // 不应该包含深度大于1的文件
      const deepFile = result.files.find((f) => f.relativePath.includes("nested/"));
      expect(deepFile).toBeUndefined();
    });
  });

  describe("排除目录", () => {
    it("应该排除指定的目录", async () => {
      const scanner = new FileScanner({
        rootDir: testDir,
        extensions: [".json"],
        excludeDirs: ["node_modules", ".git"],
      });
      const result = await scanner.scan();

      // 不应该包含 node_modules 中的文件
      const nodeModulesFile = result.files.find((f) => f.relativePath.includes("node_modules"));
      expect(nodeModulesFile).toBeUndefined();

      // 不应该包含 .git 中的文件
      const gitFile = result.files.find((f) => f.relativePath.includes(".git"));
      expect(gitFile).toBeUndefined();
    });

    it("应该默认排除 node_modules 和 .git", async () => {
      const scanner = new FileScanner({
        rootDir: testDir,
        extensions: [".json"],
      });
      const result = await scanner.scan();

      const nodeModulesFile = result.files.find((f) => f.relativePath.includes("node_modules"));
      const gitFile = result.files.find((f) => f.relativePath.includes(".git"));

      expect(nodeModulesFile).toBeUndefined();
      expect(gitFile).toBeUndefined();
    });
  });

  describe("扫描策略", () => {
    it("应该支持深度优先扫描", async () => {
      const scanner = new FileScanner({
        rootDir: testDir,
        extensions: [".md"],
        strategy: "depth-first",
      });
      const result = await scanner.scan();
      expect(result.files.length).toBeGreaterThan(0);
    });

    it("应该支持广度优先扫描", async () => {
      const scanner = new FileScanner({
        rootDir: testDir,
        extensions: [".md"],
        strategy: "breadth-first",
      });
      const result = await scanner.scan();
      expect(result.files.length).toBeGreaterThan(0);
    });
  });

  describe("错误处理", () => {
    it("应该处理不存在的目录", async () => {
      const scanner = new FileScanner({
        rootDir: "/nonexistent/directory",
        extensions: [".md"],
      });

      await expect(scanner.scan()).rejects.toThrow();
    });

    it("应该处理非目录路径", async () => {
      const scanner = new FileScanner({
        rootDir: join(testDir, "README.md"),
        extensions: [".md"],
      });

      await expect(scanner.scan()).rejects.toThrow();
    });
  });

  describe("文件路径", () => {
    it("应该提供相对路径和绝对路径", async () => {
      const scanner = new FileScanner({
        rootDir: testDir,
        extensions: [".md"],
      });
      const result = await scanner.scan();
      const readmeFile = result.files.find((f) => f.name === "README.md");

      expect(readmeFile?.path).toBe(join(testDir, "README.md"));
      expect(readmeFile?.relativePath).toBe("README.md");
    });

    it("应该正确计算嵌套文件的相对路径", async () => {
      const scanner = new FileScanner({
        rootDir: testDir,
        extensions: [".md"],
      });
      const result = await scanner.scan();
      const nestedFile = result.files.find((f) => f.relativePath === "docs/nested/detail.md");

      expect(nestedFile?.path).toBe(join(testDir, "docs", "nested", "detail.md"));
      expect(nestedFile?.relativePath).toBe("docs/nested/detail.md");
    });
  });

  describe("白名单模式", () => {
    it("应该只扫描白名单中的文件", async () => {
      const scanner = new FileScanner({
        rootDir: testDir,
        whitelist: ["docs/**/*"],
      });
      const result = await scanner.scan();

      // 应该只包含 docs 目录中的文件
      result.files.forEach((file) => {
        expect(file.relativePath).toMatch(/^docs\//);
      });

      // 不应该包含根目录的文件
      const readmeFile = result.files.find((f) => f.name === "README.md");
      expect(readmeFile).toBeUndefined();
    });

    it("应该支持多个白名单模式", async () => {
      const scanner = new FileScanner({
        rootDir: testDir,
        whitelist: ["README.md", "docs/**/*.md"],
      });
      const result = await scanner.scan();

      // 应该包含 README.md
      const readmeFile = result.files.find((f) => f.name === "README.md");
      expect(readmeFile).toBeDefined();

      // 应该包含 docs 目录中的 .md 文件
      const docsFile = result.files.find((f) => f.relativePath === "docs/guide.md");
      expect(docsFile).toBeDefined();

      // 不应该包含 .mmd 文件
      const mmdFile = result.files.find((f) => f.name === "diagram.mmd");
      expect(mmdFile).toBeUndefined();
    });

    it("应该支持通配符模式", async () => {
      const scanner = new FileScanner({
        rootDir: testDir,
        whitelist: ["**/*.md"],
      });
      const result = await scanner.scan();

      // 应该只包含 .md 文件
      result.files.forEach((file) => {
        expect(file.extension).toBe(".md");
      });

      // 不应该包含 .mmd 或 .json 文件
      const mmdFile = result.files.find((f) => f.extension === ".mmd");
      const jsonFile = result.files.find((f) => f.extension === ".json");
      expect(mmdFile).toBeUndefined();
      expect(jsonFile).toBeUndefined();
    });

    it("空白名单数组应该使用默认黑名单模式", async () => {
      const scanner = new FileScanner({
        rootDir: testDir,
        whitelist: [],
      });
      const result = await scanner.scan();

      // 应该包含所有支持的文件类型
      expect(result.files.length).toBeGreaterThan(0);

      // 不应该包含 node_modules 中的文件（默认排除）
      const nodeModulesFile = result.files.find((f) => f.relativePath.includes("node_modules"));
      expect(nodeModulesFile).toBeUndefined();
    });

    it("白名单应该优先于黑名单", async () => {
      const scanner = new FileScanner({
        rootDir: testDir,
        whitelist: ["docs/**/*"],
        excludeDirs: ["node_modules"],
      });
      const result = await scanner.scan();

      // 白名单模式，应该只包含 docs 目录中的文件
      result.files.forEach((file) => {
        expect(file.relativePath).toMatch(/^docs\//);
      });
    });

    it("应该支持精确文件路径", async () => {
      const scanner = new FileScanner({
        rootDir: testDir,
        whitelist: ["README.md", "config.json"],
      });
      const result = await scanner.scan();

      // 应该只包含指定的文件
      expect(result.files.length).toBe(2);

      const readmeFile = result.files.find((f) => f.name === "README.md");
      const configFile = result.files.find((f) => f.name === "config.json");

      expect(readmeFile).toBeDefined();
      expect(configFile).toBeDefined();
    });
  });
});