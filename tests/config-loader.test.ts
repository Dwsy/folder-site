/**
 * 配置加载器测试
 */

import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import {
  findConfigFile,
  readConfigFile,
  loadConfig,
  getBuildConfig,
  mergeWhitelist,
} from "../src/server/lib/config-loader";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("config-loader", () => {
  let testDir: string;

  beforeAll(async () => {
    // 创建临时测试目录
    testDir = join(tmpdir(), `folder-site-config-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
  });

  afterAll(async () => {
    // 清理临时目录
    await rm(testDir, { recursive: true, force: true });
  });

  describe("findConfigFile", () => {
    it("应该找到 .folder-siterc.json 配置文件", async () => {
      const configPath = join(testDir, ".folder-siterc.json");
      await writeFile(configPath, '{"build": {"whitelist": ["docs/**/*"]}}');

      const found = findConfigFile(testDir);
      expect(found).toBe(configPath);

      // 清理
      await rm(configPath);
    });

    it("应该找到 folder-site.config.json 配置文件", async () => {
      const configPath = join(testDir, "folder-site.config.json");
      await writeFile(configPath, '{"build": {"whitelist": ["examples/**/*"]}}');

      const found = findConfigFile(testDir);
      expect(found).toBe(configPath);

      // 清理
      await rm(configPath);
    });

    it("应该优先返回 .folder-siterc.json", async () => {
      const config1Path = join(testDir, ".folder-siterc.json");
      const config2Path = join(testDir, "folder-site.config.json");
      await writeFile(config1Path, '{"build": {"whitelist": ["docs/**/*"]}}');
      await writeFile(config2Path, '{"build": {"whitelist": ["examples/**/*"]}}');

      const found = findConfigFile(testDir);
      expect(found).toBe(config1Path);

      // 清理
      await rm(config1Path);
      await rm(config2Path);
    });

    it("找不到配置文件时应该返回 null", () => {
      const emptyDir = join(tmpdir(), `folder-site-empty-${Date.now()}`);
      const found = findConfigFile(emptyDir);
      expect(found).toBeNull();
    });
  });

  describe("readConfigFile", () => {
    it("应该正确读取配置文件", async () => {
      const configPath = join(testDir, ".folder-siterc.json");
      const configContent = {
        version: "1.0.0",
        build: {
          whitelist: ["docs/**/*", "examples/*.md"],
        },
      };
      await writeFile(configPath, JSON.stringify(configContent));

      const config = readConfigFile(configPath);
      expect(config).toEqual(configContent);
    });

    it("应该处理无效的 JSON", async () => {
      const configPath = join(testDir, "invalid.json");
      await writeFile(configPath, "{ invalid json }");

      const config = readConfigFile(configPath);
      expect(config).toEqual({});
    });

    it("应该处理不存在的文件", () => {
      const config = readConfigFile(join(testDir, "nonexistent.json"));
      expect(config).toEqual({});
    });
  });

  describe("loadConfig", () => {
    it("应该加载配置文件", async () => {
      const configPath = join(testDir, ".folder-siterc.json");
      const configContent = {
        build: {
          whitelist: ["docs/**/*"],
        },
      };
      await writeFile(configPath, JSON.stringify(configContent));

      const config = loadConfig(testDir);
      expect(config).toEqual(configContent);
    });

    it("没有配置文件时应该返回空对象", () => {
      const emptyDir = join(tmpdir(), `folder-site-empty-${Date.now()}`);
      const config = loadConfig(emptyDir);
      expect(config).toEqual({});
    });
  });

  describe("getBuildConfig", () => {
    it("应该返回构建配置", async () => {
      const configPath = join(testDir, ".folder-siterc.json");
      const configContent = {
        build: {
          whitelist: ["docs/**/*"],
          outDir: "dist",
        },
      };
      await writeFile(configPath, JSON.stringify(configContent));

      const buildConfig = getBuildConfig(testDir);
      expect(buildConfig).toEqual(configContent.build);
    });

    it("没有构建配置时应该返回空对象", async () => {
      const configPath = join(testDir, ".folder-siterc.json");
      await writeFile(configPath, '{"version": "1.0.0"}');

      const buildConfig = getBuildConfig(testDir);
      expect(buildConfig).toEqual({});
    });
  });

  describe("mergeWhitelist", () => {
    it("应该优先使用 CLI 配置", () => {
      const result = mergeWhitelist("docs/**/*,examples/*.md", ["README.md"]);
      expect(result).toEqual(["docs/**/*", "examples/*.md"]);
    });

    it("CLI 配置为空时应该使用文件配置", () => {
      const result = mergeWhitelist(undefined, ["docs/**/*", "README.md"]);
      expect(result).toEqual(["docs/**/*", "README.md"]);
    });

    it("都没有配置时应该返回空数组", () => {
      const result = mergeWhitelist(undefined, undefined);
      expect(result).toEqual([]);
    });

    it("应该正确解析逗号分隔的 CLI 配置", () => {
      const result = mergeWhitelist("docs/**/*, examples/*.md , README.md", undefined);
      expect(result).toEqual(["docs/**/*", "examples/*.md", "README.md"]);
    });

    it("应该过滤空字符串", () => {
      const result = mergeWhitelist("docs/**/*, , README.md", undefined);
      expect(result).toEqual(["docs/**/*", "README.md"]);
    });

    it("应该处理文件配置中的空数组", () => {
      const result = mergeWhitelist(undefined, []);
      expect(result).toEqual([]);
    });
  });
});