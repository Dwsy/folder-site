/**
 * 文件索引服务测试
 */

import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { FileScanner } from "../src/server/services/scanner";
import { FileIndexService } from "../src/server/services/index";
import { mkdir, rm, writeFile, unlink } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

const createIndex = async (rootDir: string) => {
  const scanner = new FileScanner({
    rootDir,
    extensions: [".md", ".txt"],
  });
  const scanResult = await scanner.scan();
  const index = new FileIndexService();
  index.buildFromScanResult(scanResult);

  return { index, scanResult, scanner };
};

describe("FileIndexService", () => {
  let testDir: string;

  beforeAll(async () => {
    testDir = join(tmpdir(), `folder-site-index-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });

    await mkdir(join(testDir, "docs"), { recursive: true });
    await mkdir(join(testDir, "docs", "nested"), { recursive: true });

    await writeFile(join(testDir, "README.md"), "# README\n\nIndex test file.");
    await writeFile(join(testDir, "notes.txt"), "Some notes");
    await writeFile(join(testDir, "docs", "guide.md"), "# Guide\n\nDocs");
    await writeFile(join(testDir, "docs", "nested", "detail.md"), "# Detail");
    await writeFile(join(testDir, "script.js"), "console.log('ignore');");
  });

  afterAll(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it("应该构建索引并提供统计信息", async () => {
    const { index, scanResult } = await createIndex(testDir);
    const stats = index.getStats();

    expect(stats.totalFiles).toBe(scanResult.files.length);
    expect(index.getByPath(join(testDir, "README.md"))).toBeDefined();
  });

  it("应该支持按名称与路径搜索", async () => {
    const { index } = await createIndex(testDir);

    const exactName = index.searchByName("README.md", { fuzzy: false });
    expect(exactName.length).toBe(1);
    expect(exactName[0].item.name).toBe("README.md");

    const fuzzyName = index.searchByName("readm", { fuzzy: true });
    expect(fuzzyName.some((result) => result.item.name === "README.md")).toBe(true);

    const exactPath = index.searchByPath("docs/guide.md", { fuzzy: false });
    expect(exactPath.length).toBe(1);
    expect(exactPath[0].item.relativePath).toBe("docs/guide.md");

    const fuzzyPath = index.searchByPath("docs/gui", { fuzzy: true });
    expect(fuzzyPath.some((result) => result.item.relativePath === "docs/guide.md")).toBe(true);
  });

  it("应该支持按扩展名搜索", async () => {
    const { index } = await createIndex(testDir);

    const mdResults = index.searchByExtension(".md");
    expect(mdResults.length).toBeGreaterThan(0);
    expect(mdResults.every((result) => result.item.extension === ".md")).toBe(true);
  });

  it("应该支持增量更新", async () => {
    const { index, scanner } = await createIndex(testDir);
    const newFilePath = join(testDir, "docs", "new.md");

    await writeFile(newFilePath, "# New File");
    const scanResult = await scanner.scan();
    const newFileInfo = scanResult.files.find((file) => file.path === newFilePath);

    expect(newFileInfo).toBeDefined();

    const addSummary = index.applyChanges([
      { type: "add", path: newFilePath, fileInfo: newFileInfo! },
    ]);

    expect(addSummary.added).toBe(1);
    expect(index.getByPath(newFilePath)).toBeDefined();

    await writeFile(newFilePath, "# New File\n\nUpdated");
    const updatedScan = await scanner.scan();
    const updatedFileInfo = updatedScan.files.find((file) => file.path === newFilePath);

    expect(updatedFileInfo).toBeDefined();

    const updateSummary = index.applyChanges([
      { type: "change", path: newFilePath, fileInfo: updatedFileInfo! },
    ]);

    expect(updateSummary.updated).toBe(1);
    expect(index.getByPath(newFilePath)?.size).toBe(updatedFileInfo?.size);

    await unlink(newFilePath);

    const removeSummary = index.applyChanges([
      { type: "unlink", path: newFilePath },
    ]);

    expect(removeSummary.removed).toBe(1);
    expect(index.getByPath(newFilePath)).toBeUndefined();
  });
});
