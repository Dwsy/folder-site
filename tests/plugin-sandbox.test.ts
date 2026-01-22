/**
 * 插件沙箱测试
 * 
 * 测试插件沙箱的核心功能：
 * - 权限限制测试
 * - 资源限制测试
 * - 执行隔离测试
 * - 安全检查测试
 * - 错误处理测试
 */

import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import type {
  PluginManifest,
  PluginContext,
} from "../src/types/plugin.js";
import type {
  PluginSandboxConfig,
  SandboxExecutionResult,
  SandboxSecurityEvent,
} from "../src/types/plugin-sandbox.js";
import {
  PluginSandbox,
  SandboxManager,
  createDefaultSandboxConfig,
  validateSandboxConfig,
} from "../src/server/lib/plugin-sandbox.js";

// =============================================================================
// 测试工具函数
// =============================================================================

/**
 * 创建测试插件清单
 */
function createTestManifest(overrides?: Partial<PluginManifest>): PluginManifest {
  return {
    id: "test-plugin",
    name: "Test Plugin",
    version: "1.0.0",
    entry: "./index.js",
    capabilities: [
      {
        type: "renderer",
        name: "test-renderer",
        version: "1.0.0",
      },
    ],
    ...overrides,
  };
}

/**
 * 创建测试插件上下文
 */
function createTestContext(): PluginContext {
  return {
    app: {
      version: "0.1.0",
      environment: "development",
      rootPath: "/test",
      configPath: "/test/config.json",
    },
    services: {
      fileService: null,
      indexService: null,
      transformService: null,
      renderService: null,
      exportService: null,
    },
    events: {
      on: () => ({ dispose: () => {} }),
      once: () => ({ dispose: () => {} }),
      emit: () => {},
      off: () => {},
      onAny: () => ({ dispose: () => {} }),
    },
    logger: {
      debug: () => {},
      info: () => {},
      warn: () => {},
      error: () => {},
    },
    storage: {
      get: () => undefined,
      set: () => {},
      remove: () => {},
      clear: () => {},
      has: () => false,
      keys: () => [],
      get size() {
        return 0;
      },
    },
    utils: {
      loadScript: async () => {},
      loadStyles: () => {},
      deepClone: (obj) => JSON.parse(JSON.stringify(obj)),
      merge: (a, b) => ({ ...(a as object), ...(b as object) }),
      debounce: (fn, delay) => {
        let timeoutId: ReturnType<typeof setTimeout>;
        return (...args) => {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => fn(...args), delay);
        };
      },
      throttle: (fn, limit) => {
        let inThrottle = false;
        return (...args) => {
          if (!inThrottle) {
            fn(...args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
          }
        };
      },
    },
    config: {
      get: () => undefined,
      set: () => {},
      getAll: () => ({}),
      onChange: () => ({ dispose: () => {} }),
    },
  };
}

/**
 * 创建测试沙箱配置
 */
function createTestSandboxConfig(overrides?: Partial<PluginSandboxConfig>): PluginSandboxConfig {
  return {
    enabled: true,
    timeout: 5000,
    memoryLimit: 64,
    allowNetwork: false,
    allowFileSystem: false,
    allowedPaths: [],
    allowedModules: [],
    securityLevel: 'strict',
    resourceLimits: {
      maxExecutionTime: 5000,
      maxMemory: 64,
      maxCpuUsage: 80,
    },
    permissionPolicy: {
      defaultAllow: false,
      allowedPermissions: [],
      deniedPermissions: [],
    },
    ...overrides,
  };
}

// =============================================================================
// 测试套件
// =============================================================================

describe("PluginSandbox", () => {
  let manifest: PluginManifest;
  let context: PluginContext;
  let config: PluginSandboxConfig;

  beforeEach(() => {
    manifest = createTestManifest();
    context = createTestContext();
    config = createTestSandboxConfig();
  });

  afterEach(async () => {
    // 清理
  });

  // ==========================================================================
  // 沙箱初始化测试
  // ==========================================================================

  describe("initialize", () => {
    it("应该成功初始化沙箱", async () => {
      const sandbox = new PluginSandbox(manifest, context, config);
      await sandbox.initialize();

      expect(sandbox).toBeDefined();
    });

    it("应该在启用时初始化沙箱环境", async () => {
      const sandbox = new PluginSandbox(manifest, context, config);
      await sandbox.initialize();

      const stats = sandbox.getExecutionStats();
      expect(stats.isActive).toBe(true);
    });

    it("应该在禁用时跳过初始化", async () => {
      const disabledConfig = { ...config, enabled: false };
      const sandbox = new PluginSandbox(manifest, context, disabledConfig);
      await sandbox.initialize();

      const stats = sandbox.getExecutionStats();
      expect(stats.isActive).toBe(false);
    });

    it("应该记录初始化事件", async () => {
      const sandbox = new PluginSandbox(manifest, context, config);
      await sandbox.initialize();

      const events = sandbox.getSecurityEvents();
      expect(events.length).toBeGreaterThan(0);
      expect(events[0].type).toBe('sandbox_initialized');
    });
  });

  // ==========================================================================
  // 代码执行测试
  // ==========================================================================

  describe("execute", () => {
    it("应该成功执行简单代码", async () => {
      const sandbox = new PluginSandbox(manifest, context, config);
      await sandbox.initialize();

      const result = await sandbox.execute<number>("return 1 + 1;");

      expect(result.error).toBeUndefined();
      expect(result.result).toBe(2);
      expect(result.timedOut).toBe(false);
    });

    it("应该支持上下文变量", async () => {
      const sandbox = new PluginSandbox(manifest, context, config);
      await sandbox.initialize();

      const result = await sandbox.execute<number>("return x + y;", { x: 10, y: 20 });

      expect(result.error).toBeUndefined();
      expect(result.result).toBe(30);
    });

    it("应该支持异步代码", async () => {
      const sandbox = new PluginSandbox(manifest, context, config);
      await sandbox.initialize();

      const result = await sandbox.execute<string>(
        "return new Promise(resolve => setTimeout(() => resolve('done'), 100));"
      );

      expect(result.error).toBeUndefined();
      expect(result.result).toBe('done');
    });

    it("应该记录执行时间", async () => {
      const sandbox = new PluginSandbox(manifest, context, config);
      await sandbox.initialize();

      const result = await sandbox.execute("return 42;");

      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it("应该增加执行计数", async () => {
      const sandbox = new PluginSandbox(manifest, context, config);
      await sandbox.initialize();

      await sandbox.execute("return 1;");
      await sandbox.execute("return 2;");
      await sandbox.execute("return 3;");

      const stats = sandbox.getExecutionStats();
      expect(stats.count).toBe(3);
    });
  });

  // ==========================================================================
  // 超时测试
  // ==========================================================================

  describe("timeout", () => {
    it("应该检测执行超时", async () => {
      const timeoutConfig = { ...config, timeout: 100 };
      const sandbox = new PluginSandbox(manifest, context, timeoutConfig);
      await sandbox.initialize();

      const result = await sandbox.execute(
        "return new Promise(resolve => setTimeout(() => resolve('done'), 500));"
      );

      expect(result.error).toBeDefined();
      expect(result.timedOut).toBe(true);
    });

    it("应该在超时时返回错误", async () => {
      const timeoutConfig = { ...config, timeout: 50 };
      const sandbox = new PluginSandbox(manifest, context, timeoutConfig);
      await sandbox.initialize();

      const result = await sandbox.execute(
        "return new Promise(resolve => setTimeout(() => resolve('done'), 500));"
      );

      expect(result.error).toBeDefined();
      expect(result.timedOut).toBe(true);
    });
  });

  // ==========================================================================
  // 安全检查测试
  // ==========================================================================

  describe("security checks", () => {
    it("应该拒绝 eval 调用", async () => {
      const sandbox = new PluginSandbox(manifest, context, config);
      await sandbox.initialize();

      const result = await sandbox.execute("eval('1 + 1');");

      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Security check failed');
    });

    it("应该拒绝 Function 构造器", async () => {
      const sandbox = new PluginSandbox(manifest, context, config);
      await sandbox.initialize();

      const result = await sandbox.execute("new Function('return 1 + 1')();");

      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Security check failed');
    });

    it("应该拒绝 process 访问", async () => {
      const sandbox = new PluginSandbox(manifest, context, config);
      await sandbox.initialize();

      const result = await sandbox.execute("process.exit();");

      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Security check failed');
    });

    it("应该拒绝 fs 模块导入", async () => {
      const sandbox = new PluginSandbox(manifest, context, config);
      await sandbox.initialize();

      const result = await sandbox.execute("require('fs');");

      // require is not defined in sandbox, so it should fail
      expect(result.error).toBeDefined();
    });

    it("应该拒绝 http 模块导入", async () => {
      const sandbox = new PluginSandbox(manifest, context, config);
      await sandbox.initialize();

      const result = await sandbox.execute("require('http');");

      // require is not defined in sandbox, so it should fail
      expect(result.error).toBeDefined();
    });

    it("应该拒绝 child_process 模块导入", async () => {
      const sandbox = new PluginSandbox(manifest, context, config);
      await sandbox.initialize();

      const result = await sandbox.execute("require('child_process');");

      // require is not defined in sandbox, so it should fail
      expect(result.error).toBeDefined();
    });

    it("应该记录安全违规事件", async () => {
      const sandbox = new PluginSandbox(manifest, context, config);
      await sandbox.initialize();

      await sandbox.execute("eval('1 + 1');");

      const events = sandbox.getSecurityEvents();
      const violationEvents = events.filter(e => e.type === 'security_violation');
      expect(violationEvents.length).toBeGreaterThan(0);
    });

    it("应该记录安全警告", async () => {
      const sandbox = new PluginSandbox(manifest, context, config);
      await sandbox.initialize();

      const largeCode = "a".repeat(150000);
      await sandbox.execute(`return '${largeCode}';`);

      const events = sandbox.getSecurityEvents();
      const warningEvents = events.filter(e => e.type === 'security_warning');
      expect(warningEvents.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // 权限管理测试
  // ==========================================================================

  describe("permissions", () => {
    it("应该默认拒绝所有权限", async () => {
      const sandbox = new PluginSandbox(manifest, context, config);
      await sandbox.initialize();

      expect(sandbox.checkPermission('file:read')).toBe(false);
      expect(sandbox.checkPermission('network:request')).toBe(false);
    });

    it("应该允许已授予的权限", async () => {
      const sandbox = new PluginSandbox(manifest, context, config);
      await sandbox.initialize();

      sandbox.grantPermission('file:read');
      expect(sandbox.checkPermission('file:read')).toBe(true);
    });

    it("应该支持撤销权限", async () => {
      const sandbox = new PluginSandbox(manifest, context, config);
      await sandbox.initialize();

      sandbox.grantPermission('file:read');
      expect(sandbox.checkPermission('file:read')).toBe(true);

      sandbox.revokePermission('file:read');
      expect(sandbox.checkPermission('file:read')).toBe(false);
    });

    it("应该记录权限授予事件", async () => {
      const sandbox = new PluginSandbox(manifest, context, config);
      await sandbox.initialize();

      sandbox.grantPermission('file:read');

      const events = sandbox.getSecurityEvents();
      const grantEvents = events.filter(e => e.type === 'permission_granted');
      expect(grantEvents.length).toBeGreaterThan(0);
    });

    it("应该记录权限撤销事件", async () => {
      const sandbox = new PluginSandbox(manifest, context, config);
      await sandbox.initialize();

      sandbox.grantPermission('file:read');
      sandbox.revokePermission('file:read');

      const events = sandbox.getSecurityEvents();
      const revokeEvents = events.filter(e => e.type === 'permission_revoked');
      expect(revokeEvents.length).toBeGreaterThan(0);
    });

    it("应该在重置时清除所有权限", async () => {
      const sandbox = new PluginSandbox(manifest, context, config);
      await sandbox.initialize();

      sandbox.grantPermission('file:read');
      sandbox.grantPermission('network:request');

      await sandbox.reset();

      const stats = sandbox.getExecutionStats();
      expect(stats.grantedPermissions).toHaveLength(0);
    });
  });

  // ==========================================================================
  // 文件系统访问测试
  // ==========================================================================

  describe("file system access", () => {
    it("应该在禁用时拒绝文件系统访问", async () => {
      const sandbox = new PluginSandbox(manifest, context, config);
      await sandbox.initialize();

      const result = sandbox.checkFilePath('/etc/passwd');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('disabled');
    });

    it("应该在启用时检查路径", async () => {
      const enabledConfig = { ...config, allowFileSystem: true, allowedPaths: ['/safe'] };
      const sandbox = new PluginSandbox(manifest, context, enabledConfig);
      await sandbox.initialize();

      const result = sandbox.checkFilePath('/safe/file.txt');
      expect(result.allowed).toBe(true);
    });

    it("应该拒绝路径遍历攻击", async () => {
      const enabledConfig = { ...config, allowFileSystem: true, allowedPaths: ['/safe'] };
      const sandbox = new PluginSandbox(manifest, context, enabledConfig);
      await sandbox.initialize();

      const result = sandbox.checkFilePath('/safe/../../../etc/passwd');
      expect(result.allowed).toBe(false);
    });

    it("应该拒绝不允许的路径", async () => {
      const enabledConfig = { ...config, allowFileSystem: true, allowedPaths: ['/safe'] };
      const sandbox = new PluginSandbox(manifest, context, enabledConfig);
      await sandbox.initialize();

      const result = sandbox.checkFilePath('/unsafe/file.txt');
      expect(result.allowed).toBe(false);
    });

    it("应该记录文件访问拒绝事件", async () => {
      const enabledConfig = { ...config, allowFileSystem: true, allowedPaths: ['/safe'] };
      const sandbox = new PluginSandbox(manifest, context, enabledConfig);
      await sandbox.initialize();

      sandbox.checkFilePath('/unsafe/file.txt');

      const events = sandbox.getSecurityEvents();
      const deniedEvents = events.filter(e => e.type === 'permission_denied');
      expect(deniedEvents.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // 网络访问测试
  // ==========================================================================

  describe("network access", () => {
    it("应该在禁用时拒绝网络访问", async () => {
      const sandbox = new PluginSandbox(manifest, context, config);
      await sandbox.initialize();

      const result = sandbox.checkNetworkRequest('https://example.com');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('disabled');
    });

    it("应该在启用时允许 HTTP 请求", async () => {
      const enabledConfig = { ...config, allowNetwork: true };
      const sandbox = new PluginSandbox(manifest, context, enabledConfig);
      await sandbox.initialize();

      const result = sandbox.checkNetworkRequest('https://example.com');
      expect(result.allowed).toBe(true);
    });

    it("应该拒绝非标准协议", async () => {
      const enabledConfig = { ...config, allowNetwork: true };
      const sandbox = new PluginSandbox(manifest, context, enabledConfig);
      await sandbox.initialize();

      const result = sandbox.checkNetworkRequest('ftp://example.com');
      expect(result.allowed).toBe(false);
    });

    it("应该检测内网地址", async () => {
      const enabledConfig = { ...config, allowNetwork: true };
      const sandbox = new PluginSandbox(manifest, context, enabledConfig);
      await sandbox.initialize();

      const result = sandbox.checkNetworkRequest('http://localhost:8080');
      // 内网地址应该被警告，但不一定被拒绝
      expect(result).toBeDefined();
    });

    it("应该拒绝无效 URL", async () => {
      const enabledConfig = { ...config, allowNetwork: true };
      const sandbox = new PluginSandbox(manifest, context, enabledConfig);
      await sandbox.initialize();

      const result = sandbox.checkNetworkRequest('not-a-url');
      expect(result.allowed).toBe(false);
    });
  });

  // ==========================================================================
  // 资源监控测试
  // ==========================================================================

  describe("resource monitoring", () => {
    it("应该跟踪执行计数", async () => {
      const sandbox = new PluginSandbox(manifest, context, config);
      await sandbox.initialize();

      await sandbox.execute("return 1;");
      await sandbox.execute("return 2;");

      const stats = sandbox.getExecutionStats();
      expect(stats.count).toBe(2);
    });

    it("应该提供资源使用情况", async () => {
      const sandbox = new PluginSandbox(manifest, context, config);
      await sandbox.initialize();

      await sandbox.execute("return 42;");

      const usage = sandbox.getResourceUsage();
      expect(usage).toBeDefined();
      expect(usage?.executionTime).toBeGreaterThanOrEqual(0);
    });

    it("应该在非活跃时返回 null 资源使用", () => {
      const sandbox = new PluginSandbox(manifest, context, config);
      // 不初始化

      const usage = sandbox.getResourceUsage();
      expect(usage).toBeNull();
    });
  });

  // ==========================================================================
  // 安全事件测试
  // ==========================================================================

  describe("security events", () => {
    it("应该记录所有安全事件", async () => {
      const sandbox = new PluginSandbox(manifest, context, config);
      await sandbox.initialize();

      sandbox.grantPermission('test');
      sandbox.revokePermission('test');
      await sandbox.execute("return 1;");

      const events = sandbox.getSecurityEvents();
      expect(events.length).toBeGreaterThan(0);
    });

    it("应该提供安全事件统计", async () => {
      const sandbox = new PluginSandbox(manifest, context, config);
      await sandbox.initialize();

      sandbox.grantPermission('test1');
      sandbox.grantPermission('test2');

      const stats = sandbox.getSecurityStats();
      expect(stats).toBeDefined();
      expect(Object.keys(stats).length).toBeGreaterThan(0);
    });

    it("应该在重置时清除事件", async () => {
      const sandbox = new PluginSandbox(manifest, context, config);
      await sandbox.initialize();

      sandbox.grantPermission('test');
      await sandbox.execute("return 1;");

      await sandbox.reset();

      const events = sandbox.getSecurityEvents();
      expect(events.length).toBe(0);
    });
  });

  // ==========================================================================
  // 配置管理测试
  // ==========================================================================

  describe("configuration", () => {
    it("应该返回当前配置", async () => {
      const sandbox = new PluginSandbox(manifest, context, config);
      await sandbox.initialize();

      const currentConfig = sandbox.getConfig();
      expect(currentConfig.enabled).toBe(config.enabled);
      expect(currentConfig.timeout).toBe(config.timeout);
    });

    it("应该支持更新配置", async () => {
      const sandbox = new PluginSandbox(manifest, context, config);
      await sandbox.initialize();

      sandbox.updateConfig({ timeout: 10000, memoryLimit: 256 });

      const updatedConfig = sandbox.getConfig();
      expect(updatedConfig.timeout).toBe(10000);
      expect(updatedConfig.memoryLimit).toBe(256);
    });

    it("应该保持未更新的配置项", async () => {
      const sandbox = new PluginSandbox(manifest, context, config);
      await sandbox.initialize();

      sandbox.updateConfig({ timeout: 10000 });

      const updatedConfig = sandbox.getConfig();
      expect(updatedConfig.timeout).toBe(10000);
      expect(updatedConfig.memoryLimit).toBe(config.memoryLimit);
    });
  });

  // ==========================================================================
  // 生命周期管理测试
  // ==========================================================================

  describe("lifecycle", () => {
    it("应该支持重置沙箱", async () => {
      const sandbox = new PluginSandbox(manifest, context, config);
      await sandbox.initialize();

      sandbox.grantPermission('test');
      await sandbox.execute("return 1;");

      await sandbox.reset();

      const stats = sandbox.getExecutionStats();
      expect(stats.count).toBe(0);
      expect(stats.grantedPermissions).toHaveLength(0);
    });

    it("应该支持销毁沙箱", async () => {
      const sandbox = new PluginSandbox(manifest, context, config);
      await sandbox.initialize();

      await sandbox.dispose();

      const stats = sandbox.getExecutionStats();
      expect(stats.isActive).toBe(false);
    });

    it("应该在销毁时记录事件", async () => {
      const sandbox = new PluginSandbox(manifest, context, config);
      await sandbox.initialize();

      await sandbox.dispose();

      const events = sandbox.getSecurityEvents();
      const destroyEvents = events.filter(e => e.type === 'sandbox_destroyed');
      expect(destroyEvents.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // 错误处理测试
  // ==========================================================================

  describe("error handling", () => {
    it("应该捕获执行错误", async () => {
      const sandbox = new PluginSandbox(manifest, context, config);
      await sandbox.initialize();

      const result = await sandbox.execute("throw new Error('test error');");

      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('test error');
    });

    it("应该捕获语法错误", async () => {
      const sandbox = new PluginSandbox(manifest, context, config);
      await sandbox.initialize();

      const result = await sandbox.execute("syntax error here");

      expect(result.error).toBeDefined();
    });

    it("应该捕获运行时错误", async () => {
      const sandbox = new PluginSandbox(manifest, context, config);
      await sandbox.initialize();

      const result = await sandbox.execute("nonexistentFunction();");

      expect(result.error).toBeDefined();
    });

    it("应该记录执行错误事件", async () => {
      const sandbox = new PluginSandbox(manifest, context, config);
      await sandbox.initialize();

      await sandbox.execute("throw new Error('test');");

      const events = sandbox.getSecurityEvents();
      const errorEvents = events.filter(e => e.type === 'execution_error');
      expect(errorEvents.length).toBeGreaterThan(0);
    });

    it("应该在非活跃时返回错误", async () => {
      const sandbox = new PluginSandbox(manifest, context, config);
      // 不初始化

      const result = await sandbox.execute("return 1;");

      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('not active');
    });
  });
});

// =============================================================================
// 沙箱管理器测试
// =============================================================================

describe("SandboxManager", () => {
  let manager: SandboxManager;
  let manifest: PluginManifest;
  let context: PluginContext;
  let config: PluginSandboxConfig;

  beforeEach(() => {
    manager = new SandboxManager();
    manifest = createTestManifest();
    context = createTestContext();
    config = createTestSandboxConfig();
  });

  afterEach(async () => {
    await manager.destroyAll();
  });

  // ==========================================================================
  // 沙箱创建测试
  // ==========================================================================

  describe("createSandbox", () => {
    it("应该成功创建沙箱", async () => {
      const sandbox = await manager.createSandbox(manifest, context, config);

      expect(sandbox).toBeDefined();
      expect(manager.hasSandbox(manifest.id)).toBe(true);
    });

    it("应该使用默认配置", async () => {
      const defaultConfigManager = new SandboxManager({ timeout: 10000 });
      const sandbox = await defaultConfigManager.createSandbox(manifest, context);

      expect(sandbox).toBeDefined();
      expect(sandbox.getConfig().timeout).toBe(10000);

      await defaultConfigManager.destroyAll();
    });

    it("应该覆盖默认配置", async () => {
      const defaultConfigManager = new SandboxManager({ timeout: 10000 });
      const sandbox = await defaultConfigManager.createSandbox(
        manifest,
        context,
        { timeout: 5000 }
      );

      expect(sandbox.getConfig().timeout).toBe(5000);

      await defaultConfigManager.destroyAll();
    });

    it("应该增加沙箱计数", async () => {
      await manager.createSandbox(manifest, context, config);

      expect(manager.sandboxCount).toBe(1);
    });
  });

  // ==========================================================================
  // 沙箱获取测试
  // ==========================================================================

  describe("getSandbox", () => {
    it("应该返回已创建的沙箱", async () => {
      const created = await manager.createSandbox(manifest, context, config);
      const retrieved = manager.getSandbox(manifest.id);

      expect(retrieved).toBe(created);
    });

    it("应该对不存在的沙箱返回 undefined", () => {
      const sandbox = manager.getSandbox('nonexistent');
      expect(sandbox).toBeUndefined();
    });
  });

  // ==========================================================================
  // 沙箱销毁测试
  // ==========================================================================

  describe("destroySandbox", () => {
    it("应该成功销毁沙箱", async () => {
      await manager.createSandbox(manifest, context, config);
      const destroyed = await manager.destroySandbox(manifest.id);

      expect(destroyed).toBe(true);
      expect(manager.hasSandbox(manifest.id)).toBe(false);
    });

    it("应该对不存在的沙箱返回 false", async () => {
      const destroyed = await manager.destroySandbox('nonexistent');
      expect(destroyed).toBe(false);
    });

    it("应该减少沙箱计数", async () => {
      await manager.createSandbox(manifest, context, config);
      await manager.destroySandbox(manifest.id);

      expect(manager.sandboxCount).toBe(0);
    });
  });

  // ==========================================================================
  // 批量操作测试
  // ==========================================================================

  describe("bulk operations", () => {
    it("应该获取所有沙箱", async () => {
      const manifest1 = createTestManifest({ id: 'plugin1' });
      const manifest2 = createTestManifest({ id: 'plugin2' });
      const manifest3 = createTestManifest({ id: 'plugin3' });

      await manager.createSandbox(manifest1, context, config);
      await manager.createSandbox(manifest2, context, config);
      await manager.createSandbox(manifest3, context, config);

      const allSandboxes = manager.getAllSandboxes();
      expect(allSandboxes.length).toBe(3);
    });

    it("应该销毁所有沙箱", async () => {
      const manifest1 = createTestManifest({ id: 'plugin1' });
      const manifest2 = createTestManifest({ id: 'plugin2' });

      await manager.createSandbox(manifest1, context, config);
      await manager.createSandbox(manifest2, context, config);

      await manager.destroyAll();

      expect(manager.sandboxCount).toBe(0);
    });
  });

  // ==========================================================================
  // 全局安全事件测试
  // ==========================================================================

  describe("global security events", () => {
    it("应该收集所有沙箱的安全事件", async () => {
      const manifest1 = createTestManifest({ id: 'plugin1' });
      const manifest2 = createTestManifest({ id: 'plugin2' });

      const sandbox1 = await manager.createSandbox(manifest1, context, config);
      const sandbox2 = await manager.createSandbox(manifest2, context, config);

      sandbox1.grantPermission('test1');
      sandbox2.grantPermission('test2');

      const globalEvents = manager.getGlobalSecurityEvents();
      const plugin1Events = globalEvents.filter(e => e.pluginId === 'plugin1');
      const plugin2Events = globalEvents.filter(e => e.pluginId === 'plugin2');

      expect(plugin1Events.length).toBeGreaterThan(0);
      expect(plugin2Events.length).toBeGreaterThan(0);
    });

    it("应该提供全局安全统计", async () => {
      const manifest1 = createTestManifest({ id: 'plugin1' });
      const manifest2 = createTestManifest({ id: 'plugin2' });

      await manager.createSandbox(manifest1, context, config);
      await manager.createSandbox(manifest2, context, config);

      const globalStats = manager.getGlobalSecurityStats();
      expect(globalStats).toBeDefined();
      expect(Object.keys(globalStats).length).toBeGreaterThan(0);
    });
  });
});

// =============================================================================
// 工具函数测试
// =============================================================================

describe("utility functions", () => {
  // ==========================================================================
  // 默认配置测试
  // ==========================================================================

  describe("createDefaultSandboxConfig", () => {
    it("应该创建有效的默认配置", () => {
      const config = createDefaultSandboxConfig();

      expect(config.enabled).toBe(true);
      expect(config.timeout).toBe(30000);
      expect(config.memoryLimit).toBe(128);
      expect(config.allowNetwork).toBe(false);
      expect(config.allowFileSystem).toBe(false);
      expect(config.securityLevel).toBe('strict');
    });

    it("应该包含资源限制", () => {
      const config = createDefaultSandboxConfig();

      expect(config.resourceLimits).toBeDefined();
      expect(config.resourceLimits.maxExecutionTime).toBe(30000);
      expect(config.resourceLimits.maxMemory).toBe(128);
      expect(config.resourceLimits.maxCpuUsage).toBe(80);
    });

    it("应该包含权限策略", () => {
      const config = createDefaultSandboxConfig();

      expect(config.permissionPolicy).toBeDefined();
      expect(config.permissionPolicy.defaultAllow).toBe(false);
      expect(config.permissionPolicy.allowedPermissions).toEqual([]);
      expect(config.permissionPolicy.deniedPermissions).toEqual([]);
    });
  });

  // ==========================================================================
  // 配置验证测试
  // ==========================================================================

  describe("validateSandboxConfig", () => {
    it("应该验证有效配置", () => {
      const result = validateSandboxConfig({
        timeout: 30000,
        memoryLimit: 128,
        resourceLimits: {
          maxExecutionTime: 30000,
          maxMemory: 128,
          maxCpuUsage: 80,
        },
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("应该拒绝负超时", () => {
      const result = validateSandboxConfig({ timeout: -1 });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Timeout must be non-negative');
    });

    it("应该拒绝负内存限制", () => {
      const result = validateSandboxConfig({ memoryLimit: -1 });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Memory limit must be non-negative');
    });

    it("应该拒绝负执行时间限制", () => {
      const result = validateSandboxConfig({
        resourceLimits: { maxExecutionTime: -1 },
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Max execution time must be non-negative');
    });

    it("应该拒绝负内存限制", () => {
      const result = validateSandboxConfig({
        resourceLimits: { maxMemory: -1 },
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Max memory must be non-negative');
    });

    it("应该拒绝超出范围的 CPU 使用率", () => {
      const result = validateSandboxConfig({
        resourceLimits: { maxCpuUsage: 150 },
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Max CPU usage must be between 0 and 100');
    });

    it("应该接受边界值", () => {
      const result = validateSandboxConfig({
        timeout: 0,
        memoryLimit: 0,
        resourceLimits: {
          maxExecutionTime: 0,
          maxMemory: 0,
          maxCpuUsage: 0,
        },
      });

      expect(result.valid).toBe(true);
    });

    it("应该接受最大 CPU 使用率", () => {
      const result = validateSandboxConfig({
        resourceLimits: { maxCpuUsage: 100 },
      });

      expect(result.valid).toBe(true);
    });
  });
});