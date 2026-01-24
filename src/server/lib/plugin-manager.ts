/**
 * 插件管理器
 *
 * 提供插件发现、加载、激活、停用、卸载的完整生命周期管理功能
 */

import type {
  Plugin,
  PluginClass,
  PluginManifest,
  PluginContext,
  PluginStatus,
  PluginRegistry,
  PluginEventEmitter,
  PluginStorage,
  PluginLogger,
  PluginServices,
  PluginConfig,
  PluginDiscoveryConfig,
  PluginDiscoveryResult,
  PluginValidationResult,
  PluginCapabilityType,
  PluginSandboxConfig,
  PluginManagerConfig,
  PluginErrorType,
  Disposable,
} from '../../types/plugin.js';
import {
  validatePluginManifest,
  DEFAULT_PLUGIN_MANAGER_CONFIG,
  PluginStatus as Status,
  PluginError,
} from '../../types/plugin.js';
import { SandboxManager } from './plugin-sandbox.js';

// =============================================================================
// 简单事件发射器实现
// =============================================================================

/**
 * 事件处理器存储
 */
type EventHandler = {
  handler: (data: unknown) => void;
  once: boolean;
};

/**
 * 简单事件发射器
 */
class SimpleEventEmitter implements PluginEventEmitter {
  private eventHandlers: Map<string, EventHandler[]> = new Map();
  private anyHandlers: EventHandler[] = [];

  on<T = unknown>(event: string, handler: (data: T) => void): Disposable {
    return this.addHandler(event, handler, false);
  }

  once<T = unknown>(event: string, handler: (data: T) => void): Disposable {
    return this.addHandler(event, handler, true);
  }

  emit<T = unknown>(event: string, data: T): void {
    // 调用通用处理器
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((h) => {
        try {
          (h.handler as (data: T) => void)(data);
        } catch (error) {
          console.error(`Error in event handler for "${event}":`, error);
        }
      });
      // 清理一次性处理器
      this.eventHandlers.set(
        event,
        handlers.filter((h) => !h.once)
      );
    }

    // 调用通配符处理器
    this.anyHandlers.forEach((h) => {
      try {
        (h.handler as (event: string, data: unknown) => void)(event, data);
      } catch (error) {
        console.error(`Error in any handler:`, error);
      }
    });
  }

  off(event: string, handler: (data: unknown) => void): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.findIndex((h) => h.handler === handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
  }

  onAny(handler: (event: string, data: unknown) => void): Disposable {
    return this.addAnyHandler(handler, false);
  }

  private addHandler<T>(
    event: string,
    handler: (data: T) => void,
    once: boolean
  ): Disposable {
    const handlers = this.eventHandlers.get(event) || [];
    handlers.push({ handler: handler as (data: unknown) => void, once });
    this.eventHandlers.set(event, handlers);

    return {
      dispose: () => {
        const currentHandlers = this.eventHandlers.get(event);
        if (currentHandlers) {
          const index = currentHandlers.findIndex(
            (h) => h.handler === handler
          );
          if (index !== -1) {
            currentHandlers.splice(index, 1);
          }
        }
      },
    };
  }

  private addAnyHandler(
    handler: (event: string, data: unknown) => void,
    once: boolean
  ): Disposable {
    this.anyHandlers.push({ handler: handler as (data: unknown) => void, once });

    return {
      dispose: () => {
        const index = this.anyHandlers.findIndex((h) => h.handler === handler);
        if (index !== -1) {
          this.anyHandlers.splice(index, 1);
        }
      },
    };
  }
}

// =============================================================================
// 插件存储实现
// =============================================================================

/**
 * 插件存储实现
 */
class PluginStorageImpl implements PluginStorage {
  private storage: Map<string, unknown> = new Map();

  get<T = unknown>(key: string, defaultValue?: T): T | undefined {
    const value = this.storage.get(key);
    return value as T ?? defaultValue;
  }

  set<T = unknown>(key: string, value: T): void {
    this.storage.set(key, value);
  }

  remove(key: string): void {
    this.storage.delete(key);
  }

  clear(): void {
    this.storage.clear();
  }

  has(key: string): boolean {
    return this.storage.has(key);
  }

  keys(): string[] {
    return Array.from(this.storage.keys());
  }

  get size(): number {
    return this.storage.size;
  }
}

// =============================================================================
// 插件日志实现
// =============================================================================

/**
 * 插件日志实现
 */
class PluginLoggerImpl implements PluginLogger {
  private pluginId: string;

  constructor(pluginId: string) {
    this.pluginId = pluginId;
  }

  private formatMessage(message: string): string {
    return `[${this.pluginId}] ${message}`;
  }

  debug(message: string, ...args: unknown[]): void {
    console.debug(this.formatMessage(message), ...args);
  }

  info(message: string, ...args: unknown[]): void {
    console.info(this.formatMessage(message), ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    console.warn(this.formatMessage(message), ...args);
  }

  error(message: string, ...args: unknown[]): void {
    console.error(this.formatMessage(message), ...args);
  }
}

// =============================================================================
// 插件注册表实现
// =============================================================================

/**
 * 插件注册表实现（简化版）
 * 
 * 这是一个简化的实现，仅提供基本的插件注册功能。
 * 完整的实现请参考 src/server/lib/plugin-registry.ts
 */
class PluginRegistryImpl implements PluginRegistry {
  private plugins: Map<string, Plugin> = new Map();
  private priorities: Map<string, number> = new Map();
  private enabledPlugins: Set<string> = new Set();

  getAll(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  get(id: string): Plugin | undefined {
    return this.plugins.get(id);
  }

  getByStatus(status: PluginStatus): Plugin[] {
    return this.getAll().filter((p) => p.status === status);
  }

  getByCapability(type: PluginCapabilityType): Plugin[] {
    return this.getAll().filter((p) =>
      p.manifest.capabilities.some((c) => c.type === type)
    );
  }

  register(plugin: Plugin): void {
    this.plugins.set(plugin.id, plugin);
    this.enabledPlugins.add(plugin.id);
    this.priorities.set(plugin.id, 50); // 默认优先级
  }

  registerWithOptions(plugin: Plugin, options: any): any {
    this.register(plugin);
    if (options.priority !== undefined) {
      this.setPriority(plugin.id, options.priority);
    }
    if (options.enabled === false) {
      this.disable(plugin.id);
    }
    return { success: true, pluginId: plugin.id };
  }

  unregister(id: string): boolean {
    this.priorities.delete(id);
    this.enabledPlugins.delete(id);
    return this.plugins.delete(id);
  }

  unregisterWithResult(id: string): any {
    const success = this.unregister(id);
    return { success, pluginId: id };
  }

  has(id: string): boolean {
    return this.plugins.has(id);
  }

  get size(): number {
    return this.plugins.size;
  }

  // 渲染器相关方法（简化实现）
  getRenderers(): any[] {
    return [];
  }

  getRenderer(_name: string): any {
    return undefined;
  }

  getRenderersByPlugin(_pluginId: string): any[] {
    return [];
  }

  getRenderersByCapability(_capability: string): any[] {
    return [];
  }

  registerRenderer(_registration: any): void {
    // 简化实现：不做任何操作
  }

  unregisterRenderer(_name: string, _pluginId?: string): boolean {
    return false;
  }

  // 转换器相关方法（简化实现）
  getTransformers(): any[] {
    return [];
  }

  getTransformer(_name: string): any {
    return undefined;
  }

  getTransformersByPlugin(_pluginId: string): any[] {
    return [];
  }

  getTransformersByType(_inputType: string, _outputType: string): any[] {
    return [];
  }

  registerTransformer(_registration: any): void {
    // 简化实现：不做任何操作
  }

  unregisterTransformer(_name: string, _pluginId?: string): boolean {
    return false;
  }

  // 冲突检测相关方法（简化实现）
  detectConflicts(_plugin: Plugin, _options?: any): any[] {
    return [];
  }

  resolveConflicts(_conflicts: any[], _strategy: any): boolean {
    return true;
  }

  // 优先级相关方法
  getPriority(pluginId: string): number | undefined {
    return this.priorities.get(pluginId);
  }

  setPriority(pluginId: string, priority: any): boolean {
    if (!this.has(pluginId)) {
      return false;
    }
    const numericPriority = typeof priority === 'number' ? priority : 
                           priority === 'high' ? 100 : 
                           priority === 'low' ? 10 : 50;
    this.priorities.set(pluginId, numericPriority);
    return true;
  }

  getSortedByPriority(): Plugin[] {
    return this.getAll().sort((a, b) => {
      const priorityA = this.priorities.get(a.id) || 50;
      const priorityB = this.priorities.get(b.id) || 50;
      return priorityB - priorityA;
    });
  }

  // 启用/禁用相关方法
  enable(pluginId: string): boolean {
    if (!this.has(pluginId)) {
      return false;
    }
    this.enabledPlugins.add(pluginId);
    return true;
  }

  disable(pluginId: string): boolean {
    if (!this.has(pluginId)) {
      return false;
    }
    this.enabledPlugins.delete(pluginId);
    return true;
  }

  isEnabled(pluginId: string): boolean {
    return this.enabledPlugins.has(pluginId);
  }

  clear(): void {
    this.plugins.clear();
    this.priorities.clear();
    this.enabledPlugins.clear();
  }
}

// =============================================================================
// 插件上下文工厂
// =============================================================================

/**
 * 创建插件上下文
 */
function createPluginContext(
  manifest: PluginManifest,
  app: PluginContext['app'],
  services: PluginServices,
  eventEmitter: PluginEventEmitter
): PluginContext {
  const storage = new PluginStorageImpl();
  const logger = new PluginLoggerImpl(manifest.id);
  const config = new PluginConfigImpl(manifest.id);

  const utils: PluginContext['utils'] = {
    loadScript: async (url: string) => {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
        document.head.appendChild(script);
      });
    },
    loadStyles: (href: string) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
    },
    deepClone: (obj: unknown) => JSON.parse(JSON.stringify(obj)),
    merge: <T, U>(target: T, source: U): T & U => ({ ...(target as object), ...(source as object) }) as T & U,
    debounce: <T extends (...args: unknown[]) => unknown>(
      fn: T,
      delay: number
    ) => {
      let timeoutId: ReturnType<typeof setTimeout>;
      return (...args: Parameters<T>) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
      };
    },
    throttle: <T extends (...args: unknown[]) => unknown>(
      fn: T,
      limit: number
    ) => {
      let inThrottle = false;
      return (...args: Parameters<T>) => {
        if (!inThrottle) {
          fn(...args);
          inThrottle = true;
          setTimeout(() => (inThrottle = false), limit);
        }
      };
    },
  };

  return {
    app,
    services,
    events: eventEmitter,
    logger,
    storage,
    utils,
    config,
  };
}

// =============================================================================
// 插件配置实现
// =============================================================================

/**
 * 插件配置实现
 */
class PluginConfigImpl implements PluginConfig {
  private config: Map<string, unknown> = new Map();
  private changeHandlers: Map<string, ((value: unknown) => void)[]> = new Map();

  constructor(pluginId: string) {
    // 加载默认配置
    this.config.set('enabled', true);
    this.config.set('pluginId', pluginId);
  }

  get<T = unknown>(key: string, defaultValue?: T): T | undefined {
    const value = this.config.get(key);
    return value as T ?? defaultValue;
  }

  set<T = unknown>(key: string, value: T): void {
    const oldValue = this.config.get(key);
    this.config.set(key, value);

    // 通知配置变化
    const handlers = this.changeHandlers.get(key);
    if (handlers) {
      handlers.forEach((handler) => handler(value));
    }
  }

  getAll(): Record<string, unknown> {
    return Object.fromEntries(this.config);
  }

  onChange(key: string, handler: (value: unknown) => void): Disposable {
    const handlers = this.changeHandlers.get(key) || [];
    handlers.push(handler);
    this.changeHandlers.set(key, handlers);

    return {
      dispose: () => {
        const currentHandlers = this.changeHandlers.get(key);
        if (currentHandlers) {
          const index = currentHandlers.indexOf(handler);
          if (index !== -1) {
            currentHandlers.splice(index, 1);
          }
        }
      },
    };
  }
}

// =============================================================================
// 基础插件类
// =============================================================================

/**
 * 基础插件实现
 */
export abstract class BasePlugin implements Plugin {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly manifest: PluginManifest;
  
  private _status: PluginStatus = Status.Discovered;
  private _error?: Error;
  protected context?: PluginContext;

  constructor(manifest: PluginManifest) {
    this.id = manifest.id;
    this.name = manifest.name;
    this.version = manifest.version;
    this.manifest = manifest;
  }

  get status(): PluginStatus {
    return this._status;
  }

  get error(): Error | undefined {
    return this._error;
  }

  protected setStatus(status: PluginStatus): void {
    this._status = status;
  }

  protected setError(error: Error): void {
    this._error = error;
    this._status = Status.Error;
  }

  async initialize(context: PluginContext): Promise<void> {
    this.context = context;
    this._status = Status.Validated;
  }

  abstract activate(): Promise<void>;
  abstract deactivate(): Promise<void>;
  async dispose(): Promise<void> {
    if (this._status === Status.Active) {
      await this.deactivate();
    }
    this._status = Status.Discovered;
    this.context = undefined;
  }
}

// =============================================================================
// 插件管理器实现
// =============================================================================

/**
 * 插件管理器
 * 
 * 管理插件的完整生命周期，包括发现、验证、加载、激活、停用和卸载
 */
export class PluginManager {
  private config: PluginManagerConfig;
  private registry: PluginRegistry;
  private eventEmitter: PluginEventEmitter;
  private app: PluginContext['app'];
  private services: PluginServices;
  private sandboxConfig: PluginSandboxConfig;
  private sandboxManager: SandboxManager;
  private pluginContexts: Map<string, PluginContext> = new Map();

  constructor(
    config?: Partial<PluginManagerConfig>,
    services?: PluginServices
  ) {
    this.config = { ...DEFAULT_PLUGIN_MANAGER_CONFIG, ...config };
    this.registry = new PluginRegistryImpl();
    this.eventEmitter = new SimpleEventEmitter();
    this.services = services || this.createDefaultServices();
    this.app = this.createAppInfo();
    this.sandboxConfig = {
      enabled: true,
      timeout: 30000,
      memoryLimit: 128,
      allowNetwork: false,
      allowFileSystem: false,
      allowedPaths: [],
      allowedModules: [],
      ...this.config.sandbox,
    };
    this.sandboxManager = new SandboxManager(this.sandboxConfig);
  }

  /**
   * 初始化插件管理器
   */
  async initialize(): Promise<void> {
    this.emit('plugin:manager:initialized', {
      config: this.config,
      pluginCount: this.registry.size,
    });

    // 如果启用自动激活，则加载并激活所有插件
    if (this.config.autoActivate) {
      await this.loadAll();
      await this.activateAll();
    }
  }

  /**
   * 发现插件
   */
  async discover(config?: Partial<PluginDiscoveryConfig>): Promise<PluginDiscoveryResult> {
    const discoveryConfig: PluginDiscoveryConfig = {
      paths: this.config.pluginPaths,
      manifestFile: 'plugin.json',
      maxDepth: 2,
      recursive: true,
      excludePatterns: ['node_modules', '.git', 'dist', 'build'],
      ...config,
    };

    const pluginPaths: string[] = [];
    const manifests: Array<{ path: string; manifest: PluginManifest }> = [];
    const errors: Array<{ path: string; error: Error }> = [];

    // 扫描插件目录
    for (const basePath of discoveryConfig.paths) {
      try {
        const result = await this.scanDirectory(
          basePath,
          discoveryConfig,
          0
        );
        pluginPaths.push(...result.paths);
        manifests.push(...result.manifests);
        errors.push(...result.errors);
      } catch (error) {
        errors.push({
          path: basePath,
          error: error as Error,
        });
      }
    }

    this.emit('plugin:discovered', { pluginPaths, manifests, errors });

    return { pluginPaths, manifests, errors };
  }

  /**
   * 扫描目录查找插件
   */
  private async scanDirectory(
    basePath: string,
    config: PluginDiscoveryConfig,
    currentDepth: number
  ): Promise<{
    paths: string[];
    manifests: Array<{ path: string; manifest: PluginManifest }>;
    errors: Array<{ path: string; error: Error }>;
  }> {
    const result = {
      paths: [] as string[],
      manifests: [] as Array<{ path: string; manifest: PluginManifest }>,
      errors: [] as Array<{ path: string; error: Error }>,
    };

    // 跳过超出深度限制的目录
    if (currentDepth > (config.maxDepth || 2)) {
      return result;
    }

    try {
      // 检查目录是否存在
      const pathExists = await this.pathExists(basePath);
      if (!pathExists) {
        return result;
      }

      // 读取目录内容
      const entries = await this.readDir(basePath);

      for (const entry of entries) {
        const fullPath = `${basePath}/${entry.name}`;
        const relativePath = fullPath;

        // 检查是否应该排除
        if (this.shouldExclude(entry.name, config.excludePatterns || [])) {
          continue;
        }

        // 检查是否为目录
        if (entry.isDirectory) {
          // 检查是否为插件目录（包含 plugin.json）
          const manifestPath = `${fullPath}/${config.manifestFile}`;
          const manifestExists = await this.pathExists(manifestPath);

          if (manifestExists) {
            try {
              const manifest = await this.loadManifest(manifestPath);
              result.paths.push(fullPath);
              result.manifests.push({ path: fullPath, manifest });
            } catch (error) {
              result.errors.push({
                path: fullPath,
                error: error as Error,
              });
            }
          } else if (config.recursive) {
            // 递归扫描子目录
            const subResult = await this.scanDirectory(
              fullPath,
              config,
              currentDepth + 1
            );
            result.paths.push(...subResult.paths);
            result.manifests.push(...subResult.manifests);
            result.errors.push(...subResult.errors);
          }
        }
      }
    } catch (error) {
      result.errors.push({
        path: basePath,
        error: error as Error,
      });
    }

    return result;
  }

  /**
   * 检查路径是否应该排除
   */
  private shouldExclude(name: string, patterns: string[]): boolean {
    return patterns.some((pattern) => {
      if (pattern.startsWith('*')) {
        return name.endsWith(pattern.slice(1));
      }
      return name === pattern;
    });
  }

  /**
   * 加载插件清单
   */
  private async loadManifest(path: string): Promise<PluginManifest> {
    try {
      const content = await this.readFile(path);
      const manifest = JSON.parse(content) as PluginManifest;

      // 验证清单
      const validation = validatePluginManifest(manifest);
      if (!validation.valid) {
        throw new Error(`Invalid manifest: ${validation.errors.join(', ')}`);
      }

      return manifest;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Failed to parse manifest: ${error}`);
    }
  }

  /**
   * 验证插件
   */
  validatePlugin(manifest: Partial<PluginManifest>): PluginValidationResult {
    return validatePluginManifest(manifest);
  }

  /**
   * 加载插件
   */
  async loadPlugin(
    manifest: PluginManifest,
    entryPath?: string
  ): Promise<Plugin> {
    const pluginId = manifest.id;

    // 检查是否已加载
    if (this.registry.has(pluginId)) {
      throw new Error(`Plugin ${pluginId} is already loaded`);
    }

    // 验证插件清单
    const validation = this.validatePlugin(manifest);
    if (!validation.valid) {
      throw new Error(`Plugin validation failed: ${validation.errors.join(', ')}`);
    }

    // 创建插件实例
    const plugin = await this.createPluginInstance(manifest, entryPath);

    // 设置插件状态为已加载
    if (plugin instanceof BasePlugin) {
      // 通过 initialize 方法设置状态
      const context = createPluginContext(manifest, this.app, this.services, this.eventEmitter);
      await plugin.initialize(context);
    }

    // 注册插件
    this.registry.register(plugin);

    this.emit('plugin:loaded', { plugin });

    return plugin;
  }

  /**
   * 创建插件实例
   */
  private async createPluginInstance(
    manifest: PluginManifest,
    entryPath?: string
  ): Promise<Plugin> {
    // 创建基础插件类
    const pluginId = manifest.id;
    const basePath = manifest.id; // 从 manifest 获取

    // 创建上下文
    const context = createPluginContext(
      manifest,
      this.app,
      this.services,
      this.eventEmitter
    );

    // 创建插件沙箱（如果启用）
    if (this.sandboxConfig.enabled) {
      const sandbox = await this.sandboxManager.createSandbox(
        manifest,
        context,
        this.sandboxConfig
      );
      this.pluginContexts.set(pluginId, context);
      this.emit('plugin:sandbox:created', { pluginId, sandbox });
    }

    // 如果提供了入口路径，尝试动态加载
    if (entryPath) {
      try {
        const module = await this.dynamicImport(entryPath);
        const PluginClass = module.default || module.Plugin;

        if (PluginClass) {
          const plugin = new PluginClass(manifest);
          await plugin.initialize(context);
          return plugin;
        }
      } catch (error) {
        console.warn(`Failed to load plugin module dynamically: ${entryPath}`, error);
      }
    }

    // 返回包装插件
    const wrapperPlugin = new WrappedPlugin(manifest, context);
    await wrapperPlugin.initialize(context);
    return wrapperPlugin;
  }

  /**
   * 动态导入模块
   */
  private async dynamicImport(path: string): Promise<{
    default?: PluginClass;
    Plugin?: PluginClass;
    manifest?: PluginManifest;
  }> {
    // 在浏览器环境中使用 dynamic import
    if (typeof window !== 'undefined') {
      return import(path);
    }
    // 在 Node 环境中
    const module = await import(path);
    return module;
  }

  /**
   * 激活插件
   */
  async activatePlugin(pluginId: string): Promise<void> {
    const plugin = this.registry.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    if (plugin.status === Status.Active) {
      console.warn(`Plugin ${pluginId} is already active`);
      return;
    }

    try {
      this.emit('plugin:activating', { plugin });

      await plugin.activate();

      this.registry.register(plugin);
      this.emit('plugin:activated', { plugin });
    } catch (error) {
      this.emit('plugin:error', {
        plugin,
        error: error as Error,
      });
      throw error;
    }
  }

  /**
   * 停用插件
   */
  async deactivatePlugin(pluginId: string): Promise<void> {
    const plugin = this.registry.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    if (plugin.status !== Status.Active) {
      console.warn(`Plugin ${pluginId} is not active`);
      return;
    }

    try {
      this.emit('plugin:deactivating', { plugin });

      await plugin.deactivate();

      this.emit('plugin:deactivated', { plugin });
    } catch (error) {
      this.emit('plugin:error', {
        plugin,
        error: error as Error,
      });
      throw error;
    }
  }

  /**
   * 卸载插件
   */
  async unloadPlugin(pluginId: string): Promise<void> {
    const plugin = this.registry.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    // 如果插件处于激活状态，先停用
    if (plugin.status === Status.Active) {
      await this.deactivatePlugin(pluginId);
    }

    // 销毁插件
    await plugin.dispose();

    // 销毁插件沙箱
    if (this.sandboxManager.hasSandbox(pluginId)) {
      await this.sandboxManager.destroySandbox(pluginId);
      this.emit('plugin:sandbox:destroyed', { pluginId });
    }

    // 从注册表移除
    this.registry.unregister(pluginId);

    // 清理上下文
    this.pluginContexts.delete(pluginId);

    this.emit('plugin:unloaded', { pluginId });
  }

  /**
   * 加载所有插件
   */
  async loadAll(): Promise<void> {
    const discovery = await this.discover();

    for (const { manifest } of discovery.manifests) {
      try {
        await this.loadPlugin(manifest);
      } catch (error) {
        console.error(`Failed to load plugin ${manifest.id}:`, error);
      }
    }
  }

  /**
   * 激活所有插件
   */
  async activateAll(): Promise<void> {
    const plugins = this.registry.getByStatus(Status.Loaded);

    for (const plugin of plugins) {
      try {
        await this.activatePlugin(plugin.id);
      } catch (error) {
        console.error(`Failed to activate plugin ${plugin.id}:`, error);
      }
    }
  }

  /**
   * 停用所有插件
   */
  async deactivateAll(): Promise<void> {
    const plugins = this.registry.getByStatus(Status.Active);

    for (const plugin of plugins) {
      try {
        await this.deactivatePlugin(plugin.id);
      } catch (error) {
        console.error(`Failed to deactivate plugin ${plugin.id}:`, error);
      }
    }
  }

  /**
   * 卸载所有插件
   */
  async unloadAll(): Promise<void> {
    await this.deactivateAll();

    const plugins = this.registry.getAll();

    for (const plugin of plugins) {
      try {
        await this.unloadPlugin(plugin.id);
      } catch (error) {
        console.error(`Failed to unload plugin ${plugin.id}:`, error);
      }
    }
  }

  /**
   * 获取所有插件
   */
  getPlugins(): Plugin[] {
    return this.registry.getAll();
  }

  /**
   * 根据 ID 获取插件
   */
  getPlugin(id: string): Plugin | undefined {
    return this.registry.get(id);
  }

  /**
   * 根据状态获取插件
   */
  getPluginsByStatus(status: PluginStatus): Plugin[] {
    return this.registry.getByStatus(status);
  }

  /**
   * 根据能力类型获取插件
   */
  getPluginsByCapability(type: PluginCapabilityType): Plugin[] {
    return this.registry.getByCapability(type);
  }

  /**
   * 订阅事件
   */
  on<T = unknown>(
    event: string,
    handler: (data: T) => void
  ): Disposable {
    return this.eventEmitter.on(event, handler);
  }

  /**
   * 发布事件
   */
  emit<T = unknown>(event: string, data: T): void {
    this.eventEmitter.emit(event, data);
  }

  /**
   * 获取插件数量
   */
  get pluginCount(): number {
    return this.registry.size;
  }

  /**
   * 获取配置
   */
  getConfig(): PluginManagerConfig {
    return { ...this.config };
  }

  /**
   * 获取插件沙箱
   */
  getPluginSandbox(pluginId: string) {
    return this.sandboxManager.getSandbox(pluginId);
  }

  /**
   * 检查插件是否有沙箱
   */
  hasPluginSandbox(pluginId: string): boolean {
    return this.sandboxManager.hasSandbox(pluginId);
  }

  /**
   * 获取全局安全事件
   */
  getGlobalSecurityEvents() {
    return this.sandboxManager.getGlobalSecurityEvents();
  }

  /**
   * 获取全局安全统计
   */
  getGlobalSecurityStats() {
    return this.sandboxManager.getGlobalSecurityStats();
  }

  /**
   * 销毁插件管理器
   */
  async dispose(): Promise<void> {
    await this.unloadAll();
    await this.sandboxManager.destroyAll();
    this.eventEmitter.emit('plugin:manager:disposed', {});
  }

  // =============================================================================
  // 辅助方法
  // =============================================================================

  /**
   * 创建默认服务
   */
  private createDefaultServices(): PluginServices {
    return {
      fileService: null,
      indexService: null,
      transformService: null,
      renderService: null,
      exportService: null,
    };
  }

  /**
   * 创建应用信息
   */
  private createAppInfo(): PluginContext['app'] {
    return {
      version: '0.1.0',
      environment: 'development',
      rootPath: process.cwd(),
      configPath: './folder-site.config.json',
    };
  }

  /**
   * 检查路径是否存在
   */
  private async pathExists(path: string): Promise<boolean> {
    try {
      // 在浏览器环境中
      if (typeof window !== 'undefined') {
        // 假设路径存在（因为我们无法在浏览器中检查）
        return true;
      }
      // 在 Node 环境中
      const fs = await import('fs/promises');
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 读取目录
   */
  private async readDir(
    path: string
  ): Promise<Array<{ name: string; isDirectory: boolean }>> {
    // 在浏览器环境中
    if (typeof window !== 'undefined') {
      return [];
    }
    // 在 Node 环境中
    const fs = await import('fs/promises');
    const entries = await fs.readdir(path, { withFileTypes: true });
    return entries.map((entry) => ({
      name: entry.name,
      isDirectory: entry.isDirectory(),
    }));
  }

  /**
   * 读取文件
   */
  private async readFile(path: string): Promise<string> {
    // 在浏览器环境中
    if (typeof window !== 'undefined') {
      throw new Error('File reading not supported in browser');
    }
    // 在 Node 环境中
    const fs = await import('fs/promises');
    return fs.readFile(path, 'utf-8');
  }
}

// =============================================================================
// 包装插件实现
// =============================================================================

/**
 * 包装插件类
 * 
 * 用于在无法动态加载模块时提供基本的插件功能
 */
class WrappedPlugin extends BasePlugin {
  constructor(manifest: PluginManifest, context: PluginContext) {
    super(manifest);
    this.context = context;
  }

  async activate(): Promise<void> {
    this.setStatus(Status.Activating);

    // 触发激活钩子
    if (this.manifest.hooks?.onActivate && this.context) {
      const hook = this.context.utils.deepClone(this.manifest.hooks.onActivate);
      // 执行激活逻辑
    }

    this.setStatus(Status.Active);
  }

  async deactivate(): Promise<void> {
    // 触发停用钩子
    if (this.manifest.hooks?.onDeactivate && this.context) {
      const hook = this.context.utils.deepClone(this.manifest.hooks.onDeactivate);
      // 执行停用逻辑
    }

    this.setStatus(Status.Inactive);
  }
}

// =============================================================================
// 工具函数
// =============================================================================

/**
 * 创建插件错误
 */
export function createPluginError(
  message: string,
  pluginId: string,
  pluginVersion: string,
  type: PluginErrorType,
  cause?: Error
): PluginError {
  return new PluginError(message, pluginId, pluginVersion, type, cause);
}

/**
 * 插件工具集合
 */
export const pluginUtils = {
  /**
   * 解析插件入口路径
   */
  resolveEntryPath(pluginPath: string, manifest: PluginManifest): string {
    return `${pluginPath}/${manifest.entry}`;
  },

  /**
   * 检查插件是否兼容
   */
  isCompatible(
    manifest: PluginManifest,
    appVersion: string,
    nodeVersion: string
  ): { compatible: boolean; reasons: string[] } {
    const reasons: string[] = [];

    // 检查 Folder-Site 版本
    if (manifest.engines?.folderSite) {
      const required = manifest.engines.folderSite;
      // Parse the requirement (e.g., ">=0.1.0")
      const match = required.match(/^(>=|<=|>|<)?(.+)$/);
      if (match) {
        const [, operator, version] = match;
        const op = (operator || '>=') as '>=' | '<=' | '>' | '<';
        if (!this.compareVersions(appVersion, version, op)) {
          reasons.push(`Requires Folder-Site ${required}, but current version is ${appVersion}`);
        }
      }
    }

    // 检查 Node.js 版本
    if (manifest.engines?.node) {
      const required = manifest.engines.node;
      // Parse the requirement (e.g., ">=18.0.0")
      const match = required.match(/^(>=|<=|>|<)?(.+)$/);
      if (match) {
        const [, operator, version] = match;
        const op = (operator || '>=') as '>=' | '<=' | '>' | '<';
        if (!this.compareVersions(nodeVersion, version, op)) {
          reasons.push(`Requires Node.js ${required}, but current version is ${nodeVersion}`);
        }
      }
    }

    return {
      compatible: reasons.length === 0,
      reasons,
    };
  },

  /**
   * 比较版本号
   */
  compareVersions(
    current: string,
    required: string,
    operator: '>=' | '<=' | '>' | '<'
  ): boolean {
    const currentParts = current.split('.').map(Number);
    const requiredParts = required.split('.').map(Number);

    for (let i = 0; i < Math.max(currentParts.length, requiredParts.length); i++) {
      const currentPart = currentParts[i] || 0;
      const requiredPart = requiredParts[i] || 0;

      if (currentPart !== requiredPart) {
        if (operator === '>=') {
          return currentPart >= requiredPart;
        } else if (operator === '<=') {
          return currentPart <= requiredPart;
        } else if (operator === '>') {
          return currentPart > requiredPart;
        } else if (operator === '<') {
          return currentPart < requiredPart;
        }
      }
    }

    // Versions are equal
    if (operator === '>=') {
      return true;
    } else if (operator === '<=') {
      return true;
    } else if (operator === '>') {
      return false;
    } else if (operator === '<') {
      return false;
    }

    return true;
  },
};

// ============================================================================
// Export Helper Functions
// ============================================================================

/**
 * Validate a plugin manifest against the schema
 */
export function validateManifest(manifest: Partial<PluginManifest>): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  return validatePluginManifest(manifest);
}

/**
 * Get the JSON schema for plugin manifest validation
 */
export function getManifestSchema() {
  return {
    type: 'object',
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      version: { type: 'string' },
      description: { type: 'string' },
      capabilities: { type: 'array' },
    },
    required: ['id', 'name', 'version'],
  };
}
