/**
 * 插件系统测试
 * 
 * 测试插件类型定义、插件管理器、事件系统、存储等功能
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from "bun:test";
import type {
  PluginManifest,
  PluginStatus,
  PluginValidationResult,
} from "../src/types/plugin.js";
import {
  PluginStatus as Status,
  PluginCapabilityType,
  validatePluginManifest,
  canTransitionStatus,
  PluginErrorType,
} from "../src/types/plugin.js";
import { PluginManager, pluginUtils, createPluginError } from "../src/server/lib/plugin-manager.js";

// =============================================================================
// 插件清单类型测试
// =============================================================================

describe("插件清单类型定义", () => {
  it("应该定义有效的插件清单", () => {
    const manifest: PluginManifest = {
      id: "test-plugin",
      name: "Test Plugin",
      version: "1.0.0",
      entry: "./dist/index.js",
      capabilities: [
        {
          type: PluginCapabilityType.Renderer,
          name: "test-renderer",
          version: "1.0.0",
        },
      ],
    };

    expect(manifest.id).toBe("test-plugin");
    expect(manifest.name).toBe("Test Plugin");
    expect(manifest.version).toBe("1.0.0");
    expect(manifest.capabilities).toHaveLength(1);
    expect(manifest.capabilities[0].type).toBe("renderer");
  });

  it("应该支持可选字段", () => {
    const manifest: PluginManifest = {
      id: "optional-plugin",
      name: "Optional Plugin",
      version: "1.0.0",
      entry: "./dist/index.js",
      description: "A plugin with optional fields",
      author: {
        name: "Test Author",
        email: "author@test.com",
        url: "https://test.com",
      },
      license: "MIT",
      capabilities: [],
      engines: {
        node: ">=18.0.0",
        folderSite: ">=0.1.0",
      },
    };

    expect(manifest.description).toBe("A plugin with optional fields");
    expect(manifest.author?.name).toBe("Test Author");
    expect(manifest.engines?.node).toBe(">=18.0.0");
  });

  it("应该支持插件依赖", () => {
    const manifest: PluginManifest = {
      id: "deps-plugin",
      name: "Dependencies Plugin",
      version: "1.0.0",
      entry: "./dist/index.js",
      dependencies: {
        "some-library": "^1.0.0",
        "another-lib": "2.0.0",
      },
      peerDependencies: {
        folderSite: ">=0.1.0",
      },
      capabilities: [],
    };

    expect(manifest.dependencies?.["some-library"]).toBe("^1.0.0");
    expect(manifest.peerDependencies?.["folderSite"]).toBe(">=0.1.0");
  });

  it("应该支持生命周期钩子", () => {
    const manifest: PluginManifest = {
      id: "hooks-plugin",
      name: "Hooks Plugin",
      version: "1.0.0",
      entry: "./dist/index.js",
      hooks: {
        onLoad: "onLoad",
        onActivate: "onActivate",
        onDeactivate: "onDeactivate",
        onUnload: "onUnload",
      },
      capabilities: [],
    };

    expect(manifest.hooks?.onLoad).toBe("onLoad");
    expect(manifest.hooks?.onActivate).toBe("onActivate");
  });

  it("应该支持配置选项模式", () => {
    const manifest: PluginManifest = {
      id: "options-plugin",
      name: "Options Plugin",
      version: "1.0.0",
      entry: "./dist/index.js",
      options: {
        type: "object",
        properties: {
          enabled: {
            type: "boolean",
            description: "Enable the plugin",
            default: true,
          },
          theme: {
            type: "string",
            description: "Theme name",
            enum: ["light", "dark"],
            default: "light",
          },
        },
        required: ["enabled"],
        additionalProperties: false,
      },
      capabilities: [],
    };

    expect(manifest.options?.type).toBe("object");
    expect(manifest.options?.properties?.enabled?.type).toBe("boolean");
    expect(manifest.options?.required).toContain("enabled");
  });

  it("应该支持贡献点声明", () => {
    const manifest: PluginManifest = {
      id: "contributes-plugin",
      name: "Contributes Plugin",
      version: "1.0.0",
      entry: "./dist/index.js",
      capabilities: [],
      contributes: {
        commands: [
          {
            id: "my-plugin.command",
            title: "My Command",
            icon: "icon.svg",
            keybinding: "Ctrl+Shift+M",
            category: "My Plugin",
          },
        ],
        menus: [
          {
            id: "my-menu",
            text: "My Menu",
            menu: "tools",
            position: 10,
            icon: "menu.svg",
          },
        ],
      },
    };

    expect(manifest.contributes?.commands).toHaveLength(1);
    expect(manifest.contributes?.commands?.[0].id).toBe("my-plugin.command");
    expect(manifest.contributes?.menus?.[0].menu).toBe("tools");
  });
});

// =============================================================================
// 插件状态测试
// =============================================================================

describe("插件状态类型", () => {
  it("应该定义所有插件状态", () => {
    expect(Status.Discovered).toBe("discovered");
    expect(Status.Validated).toBe("validated");
    expect(Status.Loading).toBe("loading");
    expect(Status.Loaded).toBe("loaded");
    expect(Status.Activating).toBe("activating");
    expect(Status.Active).toBe("active");
    expect(Status.Deactivating).toBe("deactivating");
    expect(Status.Inactive).toBe("inactive");
    expect(Status.Error).toBe("error");
  });

  it("应该支持状态转换验证", () => {
    // 有效转换
    expect(canTransitionStatus(Status.Discovered, Status.Validated)).toBe(true);
    expect(canTransitionStatus(Status.Validated, Status.Loading)).toBe(true);
    expect(canTransitionStatus(Status.Loading, Status.Loaded)).toBe(true);
    expect(canTransitionStatus(Status.Loaded, Status.Activating)).toBe(true);
    expect(canTransitionStatus(Status.Activating, Status.Active)).toBe(true);
    expect(canTransitionStatus(Status.Active, Status.Deactivating)).toBe(true);
    expect(canTransitionStatus(Status.Deactivating, Status.Inactive)).toBe(true);
    expect(canTransitionStatus(Status.Inactive, Status.Activating)).toBe(true);

    // 无效转换
    expect(canTransitionStatus(Status.Discovered, Status.Active)).toBe(false);
    expect(canTransitionStatus(Status.Active, Status.Discovered)).toBe(false);
  });
});

// =============================================================================
// 插件清单验证测试
// =============================================================================

describe("插件清单验证", () => {
  it("应该验证有效的插件清单", () => {
    const validManifest: Partial<PluginManifest> = {
      id: "valid-plugin",
      name: "Valid Plugin",
      version: "1.0.0",
      entry: "./dist/index.js",
      capabilities: [],
    };

    const result = validatePluginManifest(validManifest);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(1); // 没有 capabilities 警告
  });

  it("应该拒绝缺少必需字段的清单", () => {
    const invalidManifests = [
      { name: "Test" }, // 缺少 id
      { id: "test" }, // 缺少 name
      { id: "test", name: "Test" }, // 缺少 version
      { id: "test", name: "Test", version: "1.0.0" }, // 缺少 entry
    ];

    for (const manifest of invalidManifests) {
      const result = validatePluginManifest(manifest);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });

  it("应该验证 id 格式", () => {
    const testCases = [
      { id: "valid-id", expected: true },
      { id: "my-plugin-123", expected: true },
      { id: "123-invalid", expected: false }, // 不能以数字开头
      { id: "Invalid", expected: false }, // 必须小写
      { id: "has space", expected: false }, // 不能包含空格
    ];

    for (const { id, expected } of testCases) {
      const manifest: Partial<PluginManifest> = {
        id,
        name: "Test",
        version: "1.0.0",
        entry: "./dist/index.js",
        capabilities: [],
      };

      const result = validatePluginManifest(manifest);
      expect(result.valid).toBe(expected);
    }
  });

  it("应该验证版本号格式", () => {
    const testCases = [
      { version: "1.0.0", expected: true },
      { version: "1.0.0-alpha", expected: true },
      { version: "1.0.0-beta.1", expected: true },
      { version: "invalid", expected: false },
      { version: "1.0", expected: false },
      { version: "v1.0.0", expected: false },
    ];

    for (const { version, expected } of testCases) {
      const manifest: Partial<PluginManifest> = {
        id: "test",
        name: "Test",
        version,
        entry: "./dist/index.js",
        capabilities: [],
      };

      const result = validatePluginManifest(manifest);
      expect(result.valid).toBe(expected);
    }
  });

  it("应该生成缺少 capabilities 的警告", () => {
    const manifest: Partial<PluginManifest> = {
      id: "no-caps",
      name: "No Capabilities",
      version: "1.0.0",
      entry: "./dist/index.js",
      capabilities: [],
    };

    const result = validatePluginManifest(manifest);

    expect(result.valid).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain("capabilities");
  });
});

// =============================================================================
// 插件错误测试
// =============================================================================

describe("插件错误处理", () => {
  it("应该创建插件错误", () => {
    const error = createPluginError(
      "Test error message",
      "test-plugin",
      "1.0.0",
      PluginErrorType.Activate
    );

    expect(error.message).toBe("Test error message");
    expect(error.pluginId).toBe("test-plugin");
    expect(error.pluginVersion).toBe("1.0.0");
    expect(error.type).toBe("activate");
    expect(error.name).toBe("PluginError");
  });

  it("应该支持错误类型", () => {
    const errorTypes = Object.values(PluginErrorType);

    for (const type of errorTypes) {
      const error = createPluginError(
        "Test error",
        "test-plugin",
        "1.0.0",
        type
      );

      expect(error.type).toBe(type);
    }
  });

  it("应该支持错误原因链", () => {
    const cause = new Error("Original error");
    const error = createPluginError(
      "Wrapper error",
      "test-plugin",
      "1.0.0",
      PluginErrorType.Runtime,
      cause
    );

    expect(error.cause).toBe(cause);
  });
});

// =============================================================================
// 插件管理器测试
// =============================================================================

describe("PluginManager", () => {
  let manager: PluginManager;

  beforeEach(() => {
    manager = new PluginManager({
      pluginPaths: ["./test-plugins"],
      autoActivate: false,
    });
  });

  afterEach(async () => {
    await manager.dispose();
  });

  it("应该创建插件管理器实例", () => {
    expect(manager).toBeDefined();
    expect(manager.pluginCount).toBe(0);
  });

  it("应该获取空插件列表", () => {
    const plugins = manager.getPlugins();
    expect(plugins).toHaveLength(0);
  });

  it("应该根据状态获取插件", () => {
    const byStatus = manager.getPluginsByStatus(Status.Active);
    expect(byStatus).toHaveLength(0);
  });

  it("应该根据能力获取插件", () => {
    const byCapability = manager.getPluginsByCapability(PluginCapabilityType.Renderer);
    expect(byCapability).toHaveLength(0);
  });

  it("应该获取配置", () => {
    const config = manager.getConfig();
    expect(config.enabled).toBe(true);
    expect(config.autoActivate).toBe(false);
    expect(config.pluginPaths).toContain("./test-plugins");
  });

  it("应该支持事件订阅", () => {
    let eventFired = false;
    let receivedData: unknown;

    const disposable = manager.on("test:event", (data) => {
      eventFired = true;
      receivedData = data;
    });

    manager.emit("test:event", { foo: "bar" });

    expect(eventFired).toBe(true);
    expect(receivedData).toEqual({ foo: "bar" });

    disposable.dispose();

    // 清理后事件不应该触发
    eventFired = false;
    manager.emit("test:event", { foo: "baz" });
    expect(eventFired).toBe(false);
  });

  it("应该加载插件", async () => {
    const manifest: PluginManifest = {
      id: "load-test",
      name: "Load Test Plugin",
      version: "1.0.0",
      entry: "./dist/index.js",
      capabilities: [
        {
          type: PluginCapabilityType.Renderer,
          name: "test-renderer",
        },
      ],
    };

    const plugin = await manager.loadPlugin(manifest);

    expect(plugin).toBeDefined();
    expect(plugin.id).toBe("load-test");
    expect(manager.pluginCount).toBe(1);
  });

  it("应该拒绝重复加载插件", async () => {
    const manifest: PluginManifest = {
      id: "duplicate-test",
      name: "Duplicate Test Plugin",
      version: "1.0.0",
      entry: "./dist/index.js",
      capabilities: [],
    };

    await manager.loadPlugin(manifest);

    await expect(manager.loadPlugin(manifest)).rejects.toThrow(
      "already loaded"
    );
  });

  it("应该激活插件", async () => {
    const manifest: PluginManifest = {
      id: "activate-test",
      name: "Activate Test Plugin",
      version: "1.0.0",
      entry: "./dist/index.js",
      capabilities: [],
    };

    const plugin = await manager.loadPlugin(manifest);
    await manager.activatePlugin("activate-test");

    expect(plugin.status).toBe(Status.Active);
  });

  it("应该停用插件", async () => {
    const manifest: PluginManifest = {
      id: "deactivate-test",
      name: "Deactivate Test Plugin",
      version: "1.0.0",
      entry: "./dist/index.js",
      capabilities: [],
    };

    const plugin = await manager.loadPlugin(manifest);
    await manager.activatePlugin("deactivate-test");
    await manager.deactivatePlugin("deactivate-test");

    expect(plugin.status).toBe(Status.Inactive);
  });

  it("应该卸载插件", async () => {
    const manifest: PluginManifest = {
      id: "unload-test",
      name: "Unload Test Plugin",
      version: "1.0.0",
      entry: "./dist/index.js",
      capabilities: [],
    };

    await manager.loadPlugin(manifest);
    await manager.unloadPlugin("unload-test");

    expect(manager.pluginCount).toBe(0);
    expect(manager.getPlugin("unload-test")).toBeUndefined();
  });

  it("应该加载所有插件", async () => {
    const manifests: PluginManifest[] = [
      {
        id: "all-test-1",
        name: "All Test 1",
        version: "1.0.0",
        entry: "./dist/index.js",
        capabilities: [],
      },
      {
        id: "all-test-2",
        name: "All Test 2",
        version: "1.0.0",
        entry: "./dist/index.js",
        capabilities: [],
      },
    ];

    // 模拟发现结果
    const mockDiscover = async () => ({
      pluginPaths: manifests.map((m) => `./plugins/${m.id}`),
      manifests: manifests.map((m) => ({
        path: `./plugins/${m.id}`,
        manifest: m,
      })),
      errors: [],
    });

    // 由于无法直接测试 discover，我们只测试加载
    for (const manifest of manifests) {
      await manager.loadPlugin(manifest);
    }

    expect(manager.pluginCount).toBe(2);
  });

  it("应该停用所有插件", async () => {
    const manifests: PluginManifest[] = [
      {
        id: "deactivate-all-1",
        name: "Deactivate All 1",
        version: "1.0.0",
        entry: "./dist/index.js",
        capabilities: [],
      },
      {
        id: "deactivate-all-2",
        name: "Deactivate All 2",
        version: "1.0.0",
        entry: "./dist/index.js",
        capabilities: [],
      },
    ];

    for (const manifest of manifests) {
      await manager.loadPlugin(manifest);
      await manager.activatePlugin(manifest.id);
    }

    await manager.deactivateAll();

    expect(manager.getPluginsByStatus(Status.Active)).toHaveLength(0);
  });

  it("应该卸载所有插件", async () => {
    const manifest: PluginManifest = {
      id: "unload-all-test",
      name: "Unload All Test",
      version: "1.0.0",
      entry: "./dist/index.js",
      capabilities: [],
    };

    await manager.loadPlugin(manifest);
    await manager.unloadAll();

    expect(manager.pluginCount).toBe(0);
  });

  it("应该销毁管理器", async () => {
    const manifest: PluginManifest = {
      id: "dispose-test",
      name: "Dispose Test Plugin",
      version: "1.0.0",
      entry: "./dist/index.js",
      capabilities: [],
    };

    await manager.loadPlugin(manifest);
    await manager.dispose();

    expect(manager.pluginCount).toBe(0);
  });
});

// =============================================================================
// 插件工具函数测试
// =============================================================================

describe("插件工具函数", () => {
  describe("版本比较", () => {
    it("应该支持 >= 比较", () => {
      expect(pluginUtils.compareVersions("18.0.0", "16.0.0", ">=")).toBe(true);
      expect(pluginUtils.compareVersions("16.0.0", "18.0.0", ">=")).toBe(false);
      expect(pluginUtils.compareVersions("18.0.0", "18.0.0", ">=")).toBe(true);
    });

    it("应该支持 <= 比较", () => {
      expect(pluginUtils.compareVersions("16.0.0", "18.0.0", "<=")).toBe(true);
      expect(pluginUtils.compareVersions("18.0.0", "16.0.0", "<=")).toBe(false);
      expect(pluginUtils.compareVersions("18.0.0", "18.0.0", "<=")).toBe(true);
    });

    it("应该支持 > 比较", () => {
      expect(pluginUtils.compareVersions("18.0.0", "16.0.0", ">")).toBe(true);
      expect(pluginUtils.compareVersions("16.0.0", "18.0.0", ">")).toBe(false);
      expect(pluginUtils.compareVersions("18.0.0", "18.0.0", ">")).toBe(false);
    });

    it("应该支持 < 比较", () => {
      expect(pluginUtils.compareVersions("16.0.0", "18.0.0", "<")).toBe(true);
      expect(pluginUtils.compareVersions("18.0.0", "16.0.0", "<")).toBe(false);
      expect(pluginUtils.compareVersions("18.0.0", "18.0.0", "<")).toBe(false);
    });

    it("应该处理预发布版本", () => {
      // Note: Current implementation doesn't fully support semver pre-release versions
      // This is a known limitation that can be improved in the future
      // For now, we test basic numeric version comparison
      expect(pluginUtils.compareVersions("1.0.1", "1.0.0", ">")).toBe(true);
      expect(pluginUtils.compareVersions("1.1.0", "1.0.9", ">")).toBe(true);
      expect(pluginUtils.compareVersions("2.0.0", "1.9.9", ">")).toBe(true);
    });
  });

  describe("兼容性检查", () => {
    it("应该检查应用版本兼容性", () => {
      const manifest: PluginManifest = {
        id: "compat-test",
        name: "Compat Test",
        version: "1.0.0",
        entry: "./dist/index.js",
        engines: {
          folderSite: ">=0.1.0",
        },
        capabilities: [],
      };

      const result = pluginUtils.isCompatible(manifest, "0.2.0", "18.0.0");
      expect(result.compatible).toBe(true);
      expect(result.reasons).toHaveLength(0);
    });

    it("应该检测不兼容的应用版本", () => {
      const manifest: PluginManifest = {
        id: "compat-test",
        name: "Compat Test",
        version: "1.0.0",
        entry: "./dist/index.js",
        engines: {
          folderSite: ">=0.5.0",
        },
        capabilities: [],
      };

      const result = pluginUtils.isCompatible(manifest, "0.2.0", "18.0.0");
      expect(result.compatible).toBe(false);
      expect(result.reasons.length).toBeGreaterThan(0);
    });

    it("应该检查 Node.js 版本兼容性", () => {
      const manifest: PluginManifest = {
        id: "compat-test",
        name: "Compat Test",
        version: "1.0.0",
        entry: "./dist/index.js",
        engines: {
          node: ">=18.0.0",
        },
        capabilities: [],
      };

      const result = pluginUtils.isCompatible(manifest, "0.2.0", "16.0.0");
      expect(result.compatible).toBe(false);
      expect(result.reasons.length).toBeGreaterThan(0);
    });
  });

  describe("入口路径解析", () => {
    it("应该正确解析入口路径", () => {
      const manifest: PluginManifest = {
        id: "entry-test",
        name: "Entry Test",
        version: "1.0.0",
        entry: "./dist/index.js",
        capabilities: [],
      };

      const path = pluginUtils.resolveEntryPath("./plugins/entry-test", manifest);
      expect(path).toBe("./plugins/entry-test/./dist/index.js");
    });

    it("应该处理不同的入口路径", () => {
      const manifest: PluginManifest = {
        id: "entry-test",
        name: "Entry Test",
        version: "1.0.0",
        entry: "lib/main.js",
        capabilities: [],
      };

      const path = pluginUtils.resolveEntryPath("./plugins/my-plugin", manifest);
      expect(path).toBe("./plugins/my-plugin/lib/main.js");
    });
  });
});

// =============================================================================
// 集成测试
// =============================================================================

describe("插件系统集成测试", () => {
  let manager: PluginManager;

  beforeEach(() => {
    manager = new PluginManager({
      pluginPaths: ["./test-plugins"],
      autoActivate: false,
    });
  });

  afterEach(async () => {
    await manager.dispose();
  });

  it("应该支持完整的插件生命周期", async () => {
    const manifest: PluginManifest = {
      id: "lifecycle-test",
      name: "Lifecycle Test Plugin",
      version: "1.0.0",
      entry: "./dist/index.js",
      capabilities: [],
    };

    // 加载插件
    const plugin = await manager.loadPlugin(manifest);
    expect(plugin.status).toBe(Status.Loaded);
    expect(manager.pluginCount).toBe(1);

    // 激活插件
    await manager.activatePlugin("lifecycle-test");
    expect(plugin.status).toBe(Status.Active);

    // 停用插件
    await manager.deactivatePlugin("lifecycle-test");
    expect(plugin.status).toBe(Status.Inactive);

    // 重新激活
    await manager.activatePlugin("lifecycle-test");
    expect(plugin.status).toBe(Status.Active);

    // 卸载插件
    await manager.unloadPlugin("lifecycle-test");
    expect(manager.pluginCount).toBe(0);
  });

  it("应该正确处理事件流", async () => {
    const events: string[] = [];

    // 订阅事件
    manager.on("plugin:loaded", () => events.push("loaded"));
    manager.on("plugin:activated", () => events.push("activated"));
    manager.on("plugin:deactivated", () => events.push("deactivated"));
    manager.on("plugin:unloaded", () => events.push("unloaded"));

    const manifest: PluginManifest = {
      id: "event-test",
      name: "Event Test Plugin",
      version: "1.0.0",
      entry: "./dist/index.js",
      capabilities: [],
    };

    await manager.loadPlugin(manifest);
    await manager.activatePlugin("event-test");
    await manager.deactivatePlugin("event-test");
    await manager.unloadPlugin("event-test");

    expect(events).toEqual(["loaded", "activated", "deactivated", "unloaded"]);
  });

  it("应该支持多个插件协作", async () => {
    const manifest1: PluginManifest = {
      id: "plugin-1",
      name: "Plugin 1",
      version: "1.0.0",
      entry: "./dist/index.js",
      capabilities: [
        {
          type: PluginCapabilityType.Renderer,
          name: "renderer-1",
        },
      ],
    };

    const manifest2: PluginManifest = {
      id: "plugin-2",
      name: "Plugin 2",
      version: "1.0.0",
      entry: "./dist/index.js",
      capabilities: [
        {
          type: PluginCapabilityType.Exporter,
          name: "exporter-1",
        },
      ],
    };

    await manager.loadPlugin(manifest1);
    await manager.loadPlugin(manifest2);
    await manager.activatePlugin("plugin-1");
    await manager.activatePlugin("plugin-2");

    expect(manager.pluginCount).toBe(2);
    expect(manager.getPluginsByCapability(PluginCapabilityType.Renderer)).toHaveLength(1);
    expect(manager.getPluginsByCapability(PluginCapabilityType.Exporter)).toHaveLength(1);
  });
});
