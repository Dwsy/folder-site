/**
 * 插件加载器
 * 
 * 负责从不同来源（npm 包、本地文件）加载插件，包括：
 * - npm 包加载
 * - 本地文件加载
 * - 插件清单验证
 * - 插件依赖解析和处理
 * - 错误处理和日志记录
 */

import type {
  Plugin,
  PluginClass,
  PluginManifest,
  PluginContext,
  PluginModule,
  PluginValidationResult,
  PluginDependencies,
  PluginDependencyResolution,
} from '../../types/plugin.js';
import {
  validatePluginManifest,
  PluginErrorType as ErrorType,
  PluginError,
  PluginCapabilityType as CapabilityType,
} from '../../types/plugin.js';

// =============================================================================
// 加载配置
// =============================================================================

/**
 * 插件加载配置
 */
export interface PluginLoaderConfig {
  /** 插件缓存目录 */
  cacheDir?: string;
  
  /** 是否启用缓存 */
  enableCache?: boolean;
  
  /** 缓存过期时间（毫秒） */
  cacheTTL?: number;
  
  /** npm 注册表地址 */
  npmRegistry?: string;
  
  /** 是否自动安装依赖 */
  autoInstallDependencies?: boolean;
  
  /** 加载超时时间（毫秒） */
  loadTimeout?: number;
  
  /** 是否启用沙箱 */
  enableSandbox?: boolean;
  
  /** 沙箱允许的模块列表 */
  allowedModules?: string[];
}

/**
 * 插件加载结果
 */
export interface PluginLoadResult {
  /** 是否成功 */
  success: boolean;
  
  /** 加载的插件实例 */
  plugin?: Plugin;
  
  /** 插件模块 */
  module?: PluginModule;
  
  /** 插件清单 */
  manifest?: PluginManifest;
  
  /** 错误信息 */
  error?: Error;
  
  /** 加载耗时（毫秒） */
  duration: number;
}

/**
 * 插件依赖解析结果
 */
export interface DependencyResolutionResult {
  /** 是否成功 */
  success: boolean;
  
  /** 已解析的依赖列表 */
  resolved: Array<{
    name: string;
    version: string;
    path: string;
  }>;
  
  /** 缺失的依赖列表 */
  missing: Array<{
    name: string;
    required: string;
  }>;
  
  /** 冲突的依赖列表 */
  conflicts: Array<{
    name: string;
    required: string;
    installed: string;
  }>;
  
  /** 错误信息 */
  errors: Array<{
    name: string;
    error: Error;
  }>;
}

// =============================================================================
// 插件加载器类
// =============================================================================

/**
 * 插件加载器
 * 
 * 负责从不同来源加载插件
 */
export class PluginLoader {
  private config: Required<PluginLoaderConfig>;
  private cache: Map<string, { data: unknown; timestamp: number }> = new Map();
  private loadingPlugins: Map<string, Promise<PluginLoadResult>> = new Map();

  constructor(config?: PluginLoaderConfig) {
    this.config = {
      cacheDir: '.folder-site/plugins-cache',
      enableCache: true,
      cacheTTL: 86400000, // 24 小时
      npmRegistry: 'https://registry.npmjs.org',
      autoInstallDependencies: false,
      loadTimeout: 30000,
      enableSandbox: false,
      allowedModules: [],
      ...config,
    };
  }

  /**
   * 从 npm 包加载插件
   * 
   * @param packageName - npm 包名
   * @param version - 包版本（可选）
   * @returns 加载结果
   */
  async loadFromNpm(
    packageName: string,
    version?: string
  ): Promise<PluginLoadResult> {
    const startTime = Date.now();
    const packageId = version ? `${packageName}@${version}` : packageName;

    try {
      this.log('info', `Loading plugin from npm: ${packageId}`);

      // 检查是否正在加载
      const existingLoad = this.loadingPlugins.get(packageId);
      if (existingLoad) {
        this.log('debug', `Plugin ${packageId} is already loading, waiting...`);
        return existingLoad;
      }

      // 创建加载 Promise
      const loadPromise = this.doLoadFromNpm(packageName, version);
      this.loadingPlugins.set(packageId, loadPromise);

      // 添加超时
      const timeoutPromise = new Promise<PluginLoadResult>((_, reject) => {
        setTimeout(() => {
          reject(
            new PluginError(
              `Plugin loading timeout after ${this.config.loadTimeout}ms`,
              packageId,
              version || 'unknown',
              ErrorType.EntryLoad
            )
          );
        }, this.config.loadTimeout);
      });

      const result = await Promise.race([loadPromise, timeoutPromise]);

      this.loadingPlugins.delete(packageId);

      this.log('info', `Successfully loaded plugin from npm: ${packageId}`, {
        duration: Date.now() - startTime,
      });

      return result;
    } catch (error) {
      this.loadingPlugins.delete(packageId);

      const duration = Date.now() - startTime;
      this.log('error', `Failed to load plugin from npm: ${packageId}`, {
        error,
        duration,
      });

      return {
        success: false,
        error: error as Error,
        duration,
      };
    }
  }

  /**
   * 执行从 npm 加载插件
   */
  private async doLoadFromNpm(
    packageName: string,
    version?: string
  ): Promise<PluginLoadResult> {
    const startTime = Date.now();

    try {
      // 1. 检查缓存
      if (this.config.enableCache) {
        const cached = await this.loadFromCache(packageName, version);
        if (cached) {
          return cached;
        }
      }

      // 2. 解析包路径
      const packagePath = await this.resolveNpmPackage(packageName, version);

      // 3. 加载插件清单
      const manifest = await this.loadManifestFromPath(packagePath);

      // 4. 验证清单
      const validation = this.validateManifest(manifest);
      if (!validation.valid) {
        throw new PluginError(
          `Plugin manifest validation failed: ${validation.errors.join(', ')}`,
          manifest.id,
          manifest.version,
          ErrorType.ManifestValidation
        );
      }

      // 5. 解析依赖
      if (manifest.dependencies) {
        const depResult = await this.resolveDependencies(
          manifest.dependencies,
          packagePath
        );

        if (!depResult.success) {
          this.log('warn', `Dependency resolution failed for ${manifest.id}`, {
            missing: depResult.missing,
            conflicts: depResult.conflicts,
          });

          if (this.config.autoInstallDependencies) {
            this.log('info', `Auto-installing dependencies for ${manifest.id}`);
            await this.installDependencies(manifest.dependencies, packagePath);
          } else {
            throw new PluginError(
              `Missing dependencies: ${depResult.missing.map((d) => d.name).join(', ')}`,
              manifest.id,
              manifest.version,
              ErrorType.DependencyResolve
            );
          }
        }
      }

      // 6. 加载插件模块
      const entryPath = this.resolveEntryPath(packagePath, manifest);
      const module = await this.loadModule(entryPath);

      // 7. 验证模块导出
      const PluginClass = module.default || module.Plugin;
      if (!PluginClass) {
        throw new PluginError(
          'Plugin module must export a default Plugin class or named Plugin export',
          manifest.id,
          manifest.version,
          ErrorType.EntryLoad
        );
      }

      // 8. 创建插件实例（需要上下文，这里返回模块和清单）
      const result: PluginLoadResult = {
        success: true,
        module,
        manifest,
        duration: Date.now() - startTime,
      };

      // 9. 缓存结果
      if (this.config.enableCache) {
        await this.saveToCache(packageName, version, result);
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * 从本地文件路径加载插件
   * 
   * @param pluginPath - 插件目录路径
   * @returns 加载结果
   */
  async loadFromPath(pluginPath: string): Promise<PluginLoadResult> {
    const startTime = Date.now();

    try {
      this.log('info', `Loading plugin from path: ${pluginPath}`);

      // 1. 规范化路径
      const normalizedPath = this.normalizePath(pluginPath);

      // 2. 检查路径是否存在
      const exists = await this.pathExists(normalizedPath);
      if (!exists) {
        throw new PluginError(
          `Plugin path does not exist: ${normalizedPath}`,
          'unknown',
          'unknown',
          ErrorType.EntryLoad
        );
      }

      // 3. 加载插件清单
      const manifest = await this.loadManifestFromPath(normalizedPath);

      // 4. 验证清单
      const validation = this.validateManifest(manifest);
      if (!validation.valid) {
        throw new PluginError(
          `Plugin manifest validation failed: ${validation.errors.join(', ')}`,
          manifest.id,
          manifest.version,
          ErrorType.ManifestValidation
        );
      }

      // 5. 解析依赖
      if (manifest.dependencies) {
        const depResult = await this.resolveDependencies(
          manifest.dependencies,
          normalizedPath
        );

        if (!depResult.success && depResult.missing.length > 0) {
          this.log('warn', `Plugin ${manifest.id} has missing dependencies`, {
            missing: depResult.missing,
          });

          if (this.config.autoInstallDependencies) {
            this.log('info', `Installing dependencies for ${manifest.id}`);
            await this.installDependencies(manifest.dependencies, normalizedPath);
          }
        }
      }

      // 6. 加载插件模块
      const entryPath = this.resolveEntryPath(normalizedPath, manifest);
      const module = await this.loadModule(entryPath);

      // 7. 验证模块导出
      const PluginClass = module.default || module.Plugin;
      if (!PluginClass) {
        throw new PluginError(
          'Plugin module must export a default Plugin class or named Plugin export',
          manifest.id,
          manifest.version,
          ErrorType.EntryLoad
        );
      }

      this.log('info', `Successfully loaded plugin from path: ${manifest.id}`, {
        duration: Date.now() - startTime,
      });

      return {
        success: true,
        module,
        manifest,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.log('error', `Failed to load plugin from path: ${pluginPath}`, {
        error,
        duration,
      });

      return {
        success: false,
        error: error as Error,
        duration,
      };
    }
  }

  /**
   * 从清单对象加载插件
   * 
   * @param manifest - 插件清单
   * @param basePath - 基础路径（用于解析相对路径）
   * @returns 加载结果
   */
  async loadFromManifest(
    manifest: PluginManifest,
    basePath?: string
  ): Promise<PluginLoadResult> {
    const startTime = Date.now();

    try {
      this.log('info', `Loading plugin from manifest: ${manifest.id}`);

      // 1. 验证清单
      const validation = this.validateManifest(manifest);
      if (!validation.valid) {
        throw new PluginError(
          `Plugin manifest validation failed: ${validation.errors.join(', ')}`,
          manifest.id,
          manifest.version,
          ErrorType.ManifestValidation
        );
      }

      // 2. 确定基础路径
      const resolvedBasePath = basePath || process.cwd();

      // 3. 解析依赖
      if (manifest.dependencies) {
        const depResult = await this.resolveDependencies(
          manifest.dependencies,
          resolvedBasePath
        );

        if (!depResult.success && depResult.missing.length > 0) {
          this.log('warn', `Plugin ${manifest.id} has missing dependencies`, {
            missing: depResult.missing,
          });
        }
      }

      // 4. 加载插件模块
      const entryPath = this.resolveEntryPath(resolvedBasePath, manifest);
      const module = await this.loadModule(entryPath);

      // 5. 验证模块导出
      const PluginClass = module.default || module.Plugin;
      if (!PluginClass) {
        throw new PluginError(
          'Plugin module must export a default Plugin class or named Plugin export',
          manifest.id,
          manifest.version,
          ErrorType.EntryLoad
        );
      }

      this.log('info', `Successfully loaded plugin from manifest: ${manifest.id}`, {
        duration: Date.now() - startTime,
      });

      return {
        success: true,
        module,
        manifest,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.log('error', `Failed to load plugin from manifest: ${manifest.id}`, {
        error,
        duration,
      });

      return {
        success: false,
        error: error as Error,
        duration,
      };
    }
  }

  /**
   * 加载插件清单
   * 
   * @param pluginPath - 插件路径
   * @returns 插件清单
   */
  async loadManifestFromPath(pluginPath: string): Promise<PluginManifest> {
    const manifestPath = this.joinPath(pluginPath, 'plugin.json');

    const exists = await this.pathExists(manifestPath);
    if (!exists) {
      throw new PluginError(
        `Plugin manifest not found: ${manifestPath}`,
        'unknown',
        'unknown',
        ErrorType.ManifestParse
      );
    }

    try {
      const content = await this.readFile(manifestPath);
      const manifest = JSON.parse(content) as PluginManifest;
      return manifest;
    } catch (error) {
      throw new PluginError(
        `Failed to parse plugin manifest: ${(error as Error).message}`,
        'unknown',
        'unknown',
        ErrorType.ManifestParse,
        error as Error
      );
    }
  }

  /**
   * 验证插件清单
   * 
   * @param manifest - 插件清单
   * @returns 验证结果
   */
  validateManifest(manifest: Partial<PluginManifest>): PluginValidationResult {
    return this.validateManifestInternal(manifest);
  }

  /**
   * 内部清单验证方法
   * 
   * @param manifest - 插件清单
   * @returns 验证结果
   */
  private validateManifestInternal(manifest: Partial<PluginManifest>): PluginValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 必需字段检查
    if (!manifest.id) {
      errors.push('Missing required field: id');
    }
    if (!manifest.name) {
      errors.push('Missing required field: name');
    }
    if (!manifest.version) {
      errors.push('Missing required field: version');
    }
    if (!manifest.entry) {
      errors.push('Missing required field: entry');
    }

    // 格式验证
    if (manifest.id && !/^[a-z][a-z0-9-]*$/.test(manifest.id)) {
      errors.push('Invalid id format. Must start with lowercase letter and contain only lowercase letters, numbers, and hyphens');
    }

    if (manifest.version && !/^\d+\.\d+\.\d+(-[a-z0-9.-]+)?$/.test(manifest.version)) {
      errors.push('Invalid version format. Must be a valid semver string');
    }

    // 能力检查
    if (!manifest.capabilities || manifest.capabilities.length === 0) {
      warnings.push('No capabilities declared. The plugin may not have any effect');
    }

    // 能力类型验证
    if (manifest.capabilities) {
      const validTypes = [
        CapabilityType.Renderer,
        CapabilityType.Transformer,
        CapabilityType.Exporter,
        CapabilityType.Storage,
        CapabilityType.UI,
        CapabilityType.Custom,
      ];

      for (const capability of manifest.capabilities) {
        if (!validTypes.includes(capability.type)) {
          errors.push(`Invalid capability type: ${capability.type}. Must be one of: ${validTypes.join(', ')}`);
        }
      }
    }

    // 选项属性类型验证
    if (manifest.options && manifest.options.properties) {
      const validPropertyTypes = ['string', 'number', 'boolean', 'array', 'object'];
      for (const [name, property] of Object.entries(manifest.options.properties)) {
        const propertyType = property.type as string;
        if (!validPropertyTypes.includes(propertyType)) {
          errors.push(`Invalid option property type: ${propertyType} for "${name}". Must be one of: ${validPropertyTypes.join(', ')}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      manifest: manifest as PluginManifest,
      errors,
      warnings,
    };
  }

  /**
   * 解析插件依赖
   * 
   * @param dependencies - 依赖列表
   * @param basePath - 基础路径
   * @returns 解析结果
   */
  async resolveDependencies(
    dependencies: PluginDependencies,
    basePath: string
  ): Promise<DependencyResolutionResult> {
    const resolved: Array<{ name: string; version: string; path: string }> = [];
    const missing: Array<{ name: string; required: string }> = [];
    const conflicts: Array<{ name: string; required: string; installed: string }> = [];
    const errors: Array<{ name: string; error: Error }> = [];

    for (const [name, version] of Object.entries(dependencies)) {
      try {
        // 尝试在 node_modules 中解析包
        const modulePath = this.joinPath(basePath, 'node_modules', name);
        const exists = await this.pathExists(modulePath);

        if (exists) {
          // 读取已安装的版本
          const pkgPath = this.joinPath(modulePath, 'package.json');
          const pkgContent = await this.readFile(pkgPath);
          const pkg = JSON.parse(pkgContent);

          resolved.push({
            name,
            version: (pkg.version as string) || version,
            path: modulePath,
          });

          // TODO: 检查版本兼容性
        } else {
          missing.push({ name, required: version });
        }
      } catch (error) {
        errors.push({
          name,
          error: error as Error,
        });
      }
    }

    return {
      success: missing.length === 0 && conflicts.length === 0,
      resolved,
      missing,
      conflicts,
      errors,
    };
  }

  /**
   * 解析插件清单中的依赖（返回 PluginDependencyResolution 类型）
   *
   * @param manifest - 插件清单
   * @returns 依赖解析结果
   */
  async resolveManifestDependencies(manifest: PluginManifest): Promise<PluginDependencyResolution> {
    const startTime = Date.now();
    const dependencies: Record<string, string> = {};
    const peerDependencies: Record<string, string> = {};
    const errors: string[] = [];
    const warnings: string[] = [];

    // 解析 dependencies
    if (manifest.dependencies) {
      for (const [name, version] of Object.entries(manifest.dependencies)) {
        try {
          dependencies[name] = version;
        } catch (error) {
          errors.push(`Failed to resolve dependency ${name}: ${(error as Error).message}`);
        }
      }
    }

    // 解析 peerDependencies
    if (manifest.peerDependencies) {
      for (const [name, version] of Object.entries(manifest.peerDependencies)) {
        peerDependencies[name] = version;
      }
    }

    if (Object.keys(dependencies).length > 0) {
      this.log('debug', `Resolved dependencies for ${manifest.id}`, dependencies);
    }

    return {
      resolved: true,
      dependencies,
      peerDependencies,
      errors,
      warnings,
      duration: Date.now() - startTime,
    };
  }

  /**
   * 安装插件依赖
   * 
   * @param dependencies - 依赖列表
   * @param basePath - 基础路径
   */
  async installDependencies(
    dependencies: PluginDependencies,
    basePath: string
  ): Promise<void> {
    try {
      // 检查 package.json 是否存在
      const pkgPath = this.joinPath(basePath, 'package.json');
      const pkgExists = await this.pathExists(pkgPath);

      let pkg: Record<string, unknown> = {};

      if (pkgExists) {
        const content = await this.readFile(pkgPath);
        pkg = JSON.parse(content);
      }

      // 添加依赖
      const pkgDeps = (pkg.dependencies || {}) as Record<string, string>;
      pkg.dependencies = {
        ...pkgDeps,
        ...dependencies,
      };

      // 写回 package.json
      await this.writeFile(pkgPath, JSON.stringify(pkg, null, 2));

      // 运行 npm install
      this.log('info', 'Running npm install...');
      await this.runNpmInstall(basePath);
    } catch (error) {
      throw new PluginError(
        `Failed to install dependencies: ${(error as Error).message}`,
        'unknown',
        'unknown',
        ErrorType.DependencyResolve,
        error as Error
      );
    }
  }

  /**
   * 创建插件实例
   * 
   * @param manifest - 插件清单
   * @param context - 插件上下文
   * @param module - 插件模块（可选）
   * @returns 插件实例
   */
  async createPluginInstance(
    manifest: PluginManifest,
    context: PluginContext,
    module?: PluginModule
  ): Promise<Plugin> {
    try {
      let PluginClass: PluginClass | undefined;

      if (module) {
        PluginClass = module.default || module.Plugin;
      }

      if (!PluginClass) {
        // 尝试从入口路径加载
        const entryPath = this.resolveEntryPath(process.cwd(), manifest);
        const loadedModule = await this.loadModule(entryPath);
        PluginClass = loadedModule.default || loadedModule.Plugin;
      }

      if (!PluginClass) {
        throw new PluginError(
          'Plugin class not found in module',
          manifest.id,
          manifest.version,
          ErrorType.EntryLoad
        );
      }

      // 创建插件实例
      const plugin = new PluginClass(manifest);

      // 初始化插件
      await plugin.initialize(context);

      return plugin;
    } catch (error) {
      throw new PluginError(
        `Failed to create plugin instance: ${(error as Error).message}`,
        manifest.id,
        manifest.version,
        ErrorType.Initialize,
        error as Error
      );
    }
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear();
    this.log('info', 'Plugin loader cache cleared');
  }

  // =============================================================================
  // 私有辅助方法
  // =============================================================================

  /**
   * 解析 npm 包路径
   */
  private async resolveNpmPackage(
    packageName: string,
    version?: string
  ): Promise<string> {
    try {
      // 尝试直接导入以获取包路径
      const packageId = version ? `${packageName}@${version}` : packageName;
      const module = await import(packageId);
      
      // 获取包的路径
      const packagePath = this.dirname(this.fileURLToPath(module));
      return packagePath;
    } catch (error) {
      throw new PluginError(
        `Failed to resolve npm package: ${packageName}`,
        packageName,
        version || 'unknown',
        ErrorType.EntryLoad,
        error as Error
      );
    }
  }

  /**
   * 加载模块
   */
  private async loadModule(path: string): Promise<PluginModule> {
    try {
      // 确保路径是文件 URL 格式
      const modulePath = this.isFilePath(path) ? path : `file://${path}`;
      const module = await import(modulePath);
      return module as PluginModule;
    } catch (error) {
      throw new PluginError(
        `Failed to load module: ${path}`,
        'unknown',
        'unknown',
        ErrorType.EntryLoad,
        error as Error
      );
    }
  }

  /**
   * 解析入口路径
   */
  public resolveEntryPath(basePath: string, manifest: PluginManifest): string {
    return this.joinPath(basePath, manifest.entry);
  }

  /**
   * 从缓存加载
   */
  private async loadFromCache(
    packageName: string,
    version?: string
  ): Promise<PluginLoadResult | null> {
    const cacheKey = version ? `${packageName}@${version}` : packageName;
    const cached = this.cache.get(cacheKey);

    if (!cached) {
      return null;
    }

    // 检查缓存是否过期
    const isExpired = Date.now() - cached.timestamp > this.config.cacheTTL;
    if (isExpired) {
      this.cache.delete(cacheKey);
      return null;
    }

    this.log('debug', `Cache hit for plugin: ${cacheKey}`);
    return cached.data as PluginLoadResult;
  }

  /**
   * 保存到缓存
   */
  private async saveToCache(
    packageName: string,
    version: string | undefined,
    result: PluginLoadResult
  ): Promise<void> {
    const cacheKey = version ? `${packageName}@${version}` : packageName;
    this.cache.set(cacheKey, {
      data: result,
      timestamp: Date.now(),
    });
    this.log('debug', `Cached plugin: ${cacheKey}`);
  }

  /**
   * 运行 npm install
   */
  private async runNpmInstall(basePath: string): Promise<void> {
    const { spawn } = await import('child_process');
    
    return new Promise<void>((resolve, reject) => {
      const process = spawn('npm', ['install'], {
        cwd: basePath,
        stdio: 'inherit',
      });

      process.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`npm install failed with code ${code}`));
        }
      });

      process.on('error', reject);
    });
  }

  /**
   * 日志记录
   */
  private log(
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    meta?: Record<string, unknown>
  ): void {
    const prefix = '[PluginLoader]';
    const timestamp = new Date().toISOString();

    switch (level) {
      case 'debug':
        console.debug(prefix, timestamp, message, meta || '');
        break;
      case 'info':
        console.info(prefix, timestamp, message, meta || '');
        break;
      case 'warn':
        console.warn(prefix, timestamp, message, meta || '');
        break;
      case 'error':
        console.error(prefix, timestamp, message, meta || '');
        break;
    }
  }

  // =============================================================================
  // 路径工具方法（跨平台兼容）
  // =============================================================================

  private normalizePath(path: string): string {
    if (typeof window !== 'undefined') {
      // 浏览器环境
      return path.replace(/\\/g, '/');
    }
    // Node 环境
    const { normalize } = require('path');
    return normalize(path);
  }

  private joinPath(...parts: string[]): string {
    if (typeof window !== 'undefined') {
      // 浏览器环境
      return parts.join('/').replace(/\/+/g, '/');
    }
    // Node 环境
    const { join } = require('path');
    return join(...parts);
  }

  private dirname(path: string): string {
    if (typeof window !== 'undefined') {
      // 浏览器环境
      const parts = path.split('/');
      parts.pop();
      return parts.join('/');
    }
    // Node 环境
    const { dirname } = require('path');
    return dirname(path);
  }

  private isFilePath(path: string): boolean {
    return path.startsWith('/') || path.startsWith('./') || path.startsWith('../');
  }

  private fileURLToPath(module: unknown): string {
    if (typeof window !== 'undefined') {
      // 浏览器环境
      return (module as { url?: string })?.url || '';
    }
    // Node 环境
    const { fileURLToPath } = require('url');
    return fileURLToPath(module as { url: string });
  }

  // =============================================================================
  // 文件系统访问方法
  // =============================================================================

  private async pathExists(path: string): Promise<boolean> {
    try {
      if (typeof window !== 'undefined') {
        // 浏览器环境 - 假设路径存在
        return true;
      }
      // Node 环境
      const { access } = await import('fs/promises');
      await access(path);
      return true;
    } catch {
      return false;
    }
  }

  private async readFile(path: string): Promise<string> {
    if (typeof window !== 'undefined') {
      throw new Error('File reading not supported in browser environment');
    }
    const { readFile } = await import('fs/promises');
    return readFile(path, 'utf-8');
  }

  private async writeFile(path: string, content: string): Promise<void> {
    if (typeof window !== 'undefined') {
      throw new Error('File writing not supported in browser environment');
    }
    const { writeFile } = await import('fs/promises');
    return writeFile(path, content, 'utf-8');
  }
}

// =============================================================================
// 工具函数
// =============================================================================

/**
 * 创建插件加载器实例
 * 
 * @param config - 加载配置
 * @returns 插件加载器实例
 */
export function createPluginLoader(config?: PluginLoaderConfig): PluginLoader {
  return new PluginLoader(config);
}

/**
 * 验证插件清单
 * 
 * @param manifest - 插件清单
 * @returns 验证结果
 */
export function validatePluginManifestWrapper(
  manifest: Partial<PluginManifest>
): PluginValidationResult {
  return validatePluginManifest(manifest);
}

/**
 * 解析插件入口路径
 * 
 * @param basePath - 基础路径
 * @param manifest - 插件清单
 * @returns 入口路径
 */
export function resolvePluginEntryPath(
  basePath: string,
  manifest: PluginManifest
): string {
  return new PluginLoader().resolveEntryPath(basePath, manifest);
}

// =============================================================================
// 默认导出
// =============================================================================

export default PluginLoader;