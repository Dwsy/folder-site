/**
 * 插件沙箱
 * 
 * 提供安全的插件执行环境，包括：
 * - 权限限制机制
 * - 执行隔离
 * - 资源限制
 * - 安全检查
 * - 沙箱生命周期管理
 */

import type {
  PluginManifest,
  PluginContext,
} from '../../types/plugin.js';
import type {
  PluginSandboxConfig,
  SandboxExecutionResult,
  PermissionPolicy,
  ResourceLimits,
  SecurityEvent,
} from '../../types/plugin-sandbox.js';

// =============================================================================
// 安全事件记录器
// =============================================================================

/**
 * 安全事件记录
 */
interface SecurityEventRecord {
  event: SecurityEventType;
  timestamp: number;
  pluginId: string;
  details?: Record<string, unknown>;
}

/**
 * 安全事件记录器
 */
class SecurityEventLogger {
  private events: SecurityEventRecord[] = [];
  private maxEvents: number = 1000;

  /**
   * 记录安全事件
   */
  log(event: SecurityEventType, pluginId: string, details?: Record<string, unknown>): void {
    const record: SecurityEventRecord = {
      event,
      timestamp: Date.now(),
      pluginId,
      details,
    };

    this.events.push(record);

    // 限制事件数量
    if (this.events.length > this.maxEvents) {
      this.events.shift();
    }
  }

  /**
   * 获取所有事件
   */
  getEvents(): SecurityEventRecord[] {
    return [...this.events];
  }

  /**
   * 获取指定插件的事件
   */
  getEventsByPlugin(pluginId: string): SecurityEventRecord[] {
    return this.events.filter((e) => e.pluginId === pluginId);
  }

  /**
   * 清空事件记录
   */
  clear(): void {
    this.events = [];
  }

  /**
   * 获取事件统计
   */
  getStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    for (const event of this.events) {
      const key = event.event.type;
      stats[key] = (stats[key] || 0) + 1;
    }
    return stats;
  }
}

// =============================================================================
// 安全检查器
// =============================================================================

/**
 * 危险操作模式
 */
const DANGEROUS_PATTERNS = [
  // 进程相关
  /\beval\s*\(/gi,
  /\bFunction\s*\(/gi,
  /\bprocess\./gi,
  /\bchild_process\./gi,
  /\bspawn\s*\(/gi,
  /\bexec\s*\(/gi,
  /\bfork\s*\(/gi,
  
  // 文件系统相关
  /\bfs\./gi,
  /\brequire\s*\(\s*['"]fs['"]\s*\)/gi,
  /\bimport\s*\(\s*['"]fs['"]\s*\)/gi,
  
  // 网络相关
  /\bhttp\./gi,
  /\bhttps\./gi,
  /\bnet\./gi,
  /\bdns\./gi,
  /\bfetch\s*\(/gi,
  /\bXMLHttpRequest/gi,
  
  // 操作系统相关
  /\bos\./gi,
  /\bpath\./gi,
  /\b__dirname/gi,
  /\b__filename/gi,
  
  // 全局对象
  /\bglobal\./gi,
  /\bwindow\./gi,
  /\bdocument\./gi,
  /\bnavigator\./gi,
  
  // 危险属性
  /\bprototype\s*\[/gi,
  /\b__proto__/gi,
];

/**
 * 安全检查器
 */
class SecurityChecker {
  /**
   * 检查代码是否包含危险操作
   */
  static checkCode(code: string): SecurityCheck {
    const violations: string[] = [];
    const warnings: string[] = [];

    // 检查危险模式
    for (const pattern of DANGEROUS_PATTERNS) {
      const matches = code.match(pattern);
      if (matches) {
        violations.push(`Detected dangerous pattern: ${pattern.source}`);
      }
    }

    // 检查代码长度
    if (code.length > 100000) {
      warnings.push('Code is very large (>100KB), may impact performance');
    }

    // 检查嵌套深度
    const maxDepth = this.checkNestingDepth(code);
    if (maxDepth > 20) {
      warnings.push(`Deep nesting detected (${maxDepth} levels), may cause stack overflow`);
    }

    return {
      passed: violations.length === 0,
      violations,
      warnings,
      timestamp: Date.now(),
    };
  }

  /**
   * 检查嵌套深度
   */
  private static checkNestingDepth(code: string): number {
    let depth = 0;
    let maxDepth = 0;

    for (const char of code) {
      if (char === '{' || char === '(' || char === '[') {
        depth++;
        maxDepth = Math.max(maxDepth, depth);
      } else if (char === '}' || char === ')' || char === ']') {
        depth--;
      }
    }

    return maxDepth;
  }

  /**
   * 检查模块导入
   */
  static checkModuleImport(
    moduleName: string,
    allowedModules: string[]
  ): SecurityCheck {
    const violations: string[] = [];
    const warnings: string[] = [];

    // 检查是否在允许列表中
    if (allowedModules.length > 0 && !allowedModules.includes(moduleName)) {
      violations.push(`Module "${moduleName}" is not in the allowed list`);
    }

    // 检查是否为危险模块
    const dangerousModules = [
      'fs', 'child_process', 'os', 'net', 'dns', 'http', 'https',
      'vm', 'cluster', 'worker_threads', 'repl', 'readline', 'util',
    ];
    if (dangerousModules.includes(moduleName)) {
      violations.push(`Module "${moduleName}" is considered dangerous`);
    }

    return {
      passed: violations.length === 0,
      violations,
      warnings,
      timestamp: Date.now(),
    };
  }

  /**
   * 检查文件路径
   */
  static checkFilePath(
    path: string,
    allowedPaths: string[]
  ): SecurityCheck {
    const violations: string[] = [];
    const warnings: string[] = [];

    // 规范化路径
    const normalizedPath = path.replace(/\\/g, '/');

    // 检查路径遍历攻击
    if (normalizedPath.includes('../') || normalizedPath.includes('..\\')) {
      violations.push(`Path traversal detected: "${path}"`);
    }

    // 检查绝对路径
    if (normalizedPath.startsWith('/') || /^[A-Za-z]:/.test(normalizedPath)) {
      warnings.push(`Absolute path detected: "${path}"`);
    }

    // 检查是否在允许列表中
    if (allowedPaths.length > 0) {
      const isAllowed = allowedPaths.some((allowed) => {
        const normalizedAllowed = allowed.replace(/\\/g, '/');
        return normalizedPath.startsWith(normalizedAllowed);
      });
      if (!isAllowed) {
        violations.push(`Path "${path}" is not in the allowed directories`);
      }
    }

    return {
      passed: violations.length === 0,
      violations,
      warnings,
      timestamp: Date.now(),
    };
  }

  /**
   * 检查网络请求
   */
  static checkNetworkRequest(url: string): SecurityCheck {
    const violations: string[] = [];
    const warnings: string[] = [];

    try {
      const parsedUrl = new URL(url);

      // 检查协议
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        violations.push(`Unsupported protocol: ${parsedUrl.protocol}`);
      }

      // 检查内网地址
      const hostname = parsedUrl.hostname;
      if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '::1' ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.startsWith('172.')
      ) {
        warnings.push(`Request to internal network: ${hostname}`);
      }

      // 检查非标准端口
      if (parsedUrl.port && ![80, 443].includes(parseInt(parsedUrl.port, 10))) {
        warnings.push(`Non-standard port: ${parsedUrl.port}`);
      }
    } catch (error) {
      violations.push(`Invalid URL: ${url}`);
    }

    return {
      passed: violations.length === 0,
      violations,
      warnings,
      timestamp: Date.now(),
    };
  }
}

// =============================================================================
// 资源监控器
// =============================================================================

/**
 * 资源使用情况
 */
interface ResourceUsage {
  /** 内存使用（字节） */
  memoryUsage: number;
  /** 执行时间（毫秒） */
  executionTime: number;
  /** CPU 使用率（百分比） */
  cpuUsage: number;
}

/**
 * 资源监控器
 */
class ResourceMonitor {
  private startTime: number = 0;
  private initialMemory: number = 0;
  private limits: ResourceLimits;
  private violations: string[] = [];

  constructor(limits: ResourceLimits) {
    this.limits = limits;
  }

  /**
   * 开始监控
   */
  start(): void {
    this.startTime = Date.now();
    this.initialMemory = this.getCurrentMemoryUsage();
    this.violations = [];
  }

  /**
   * 检查资源使用
   */
  check(): { passed: boolean; usage: ResourceUsage; violations: string[] } {
    const currentTime = Date.now();
    const currentMemory = this.getCurrentMemoryUsage();

    const executionTime = currentTime - this.startTime;
    const memoryUsage = currentMemory - this.initialMemory;

    // 检查执行时间
    if (this.limits.maxExecutionTime && executionTime > this.limits.maxExecutionTime) {
      this.violations.push(`Execution time exceeded: ${executionTime}ms > ${this.limits.maxExecutionTime}ms`);
    }

    // 检查内存使用
    if (this.limits.maxMemory && memoryUsage > this.limits.maxMemory * 1024 * 1024) {
      this.violations.push(`Memory usage exceeded: ${Math.round(memoryUsage / 1024 / 1024)}MB > ${this.limits.maxMemory}MB`);
    }

    const usage: ResourceUsage = {
      memoryUsage,
      executionTime,
      cpuUsage: this.estimateCpuUsage(executionTime),
    };

    return {
      passed: this.violations.length === 0,
      usage,
      violations: [...this.violations],
    };
  }

  /**
   * 获取当前内存使用
   */
  private getCurrentMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed;
    }
    return 0;
  }

  /**
   * 估算 CPU 使用率
   */
  private estimateCpuUsage(executionTime: number): number {
    // 简化估算，实际实现可能需要更精确的方法
    return Math.min(100, (executionTime / 1000) * 10);
  }
}

// =============================================================================
// 权限管理器
// =============================================================================

/**
 * 权限管理器
 */
class PermissionManager {
  private policy: PermissionPolicy;
  private grantedPermissions: Set<string> = new Set();

  constructor(policy: PermissionPolicy) {
    this.policy = policy;
  }

  /**
   * 检查权限
   */
  checkPermission(permission: string): boolean {
    // 检查是否已授予
    if (this.grantedPermissions.has(permission)) {
      return true;
    }

    // 检查策略
    if (this.policy.defaultAllow) {
      // 默认允许，检查拒绝列表
      return !this.policy.deniedPermissions.includes(permission);
    } else {
      // 默认拒绝，检查允许列表
      return this.policy.allowedPermissions.includes(permission);
    }
  }

  /**
   * 授予权限
   */
  grantPermission(permission: string): void {
    this.grantedPermissions.add(permission);
  }

  /**
   * 撤销权限
   */
  revokePermission(permission: string): void {
    this.grantedPermissions.delete(permission);
  }

  /**
   * 获取所有已授予的权限
   */
  getGrantedPermissions(): string[] {
    return [...this.grantedPermissions];
  }

  /**
   * 重置权限
   */
  reset(): void {
    this.grantedPermissions.clear();
  }
}

// =============================================================================
// 沙箱环境
// =============================================================================

/**
 * 沙箱环境
 */
class SandboxEnvironment {
  private context: PluginContext;
  private allowedModules: string[];
  private moduleCache: Map<string, unknown> = new Map();

  constructor(context: PluginContext, allowedModules: string[]) {
    this.context = context;
    this.allowedModules = allowedModules;
  }

  /**
   * 创建受限的全局对象
   */
  createRestrictedGlobal(): Record<string, unknown> {
    const global: Record<string, unknown> = {
      // 基本对象
      Object,
      Array,
      String,
      Number,
      Boolean,
      Date,
      Math,
      JSON,
      
      // 错误对象
      Error,
      TypeError,
      ReferenceError,
      SyntaxError,
      
      // 工具函数
      setTimeout,
      clearTimeout,
      setInterval,
      clearInterval,
      Promise,
      console: this.createSafeConsole(),
      
      // 插件上下文
      __pluginContext__: this.context,
    };

    return global;
  }

  /**
   * 创建安全的控制台
   */
  private createSafeConsole(): Console {
    const originalConsole = console;
    const pluginLogger = this.context.logger;

    return {
      debug: (...args: unknown[]) => {
        pluginLogger.debug(args.join(' '));
        originalConsole.debug(...args);
      },
      info: (...args: unknown[]) => {
        pluginLogger.info(args.join(' '));
        originalConsole.info(...args);
      },
      warn: (...args: unknown[]) => {
        pluginLogger.warn(args.join(' '));
        originalConsole.warn(...args);
      },
      error: (...args: unknown[]) => {
        pluginLogger.error(args.join(' '));
        originalConsole.error(...args);
      },
      log: (...args: unknown[]) => {
        pluginLogger.info(args.join(' '));
        originalConsole.log(...args);
      },
    } as Console;
  }

  /**
   * 安全的 require 函数
   */
  safeRequire(moduleName: string): unknown {
    // 检查模块安全性
    const check = SecurityChecker.checkModuleImport(moduleName, this.allowedModules);
    if (!check.passed) {
      throw new Error(`Module import denied: ${check.violations.join(', ')}`);
    }

    // 检查缓存
    if (this.moduleCache.has(moduleName)) {
      return this.moduleCache.get(moduleName);
    }

    // 加载模块
    try {
      const module = require(moduleName);
      this.moduleCache.set(moduleName, module);
      return module;
    } catch (error) {
      throw new Error(`Failed to load module "${moduleName}": ${error}`);
    }
  }

  /**
   * 清理资源
   */
  dispose(): void {
    this.moduleCache.clear();
  }
}

// =============================================================================
// 插件沙箱
// =============================================================================

/**
 * 插件沙箱
 * 
 * 提供安全的插件执行环境
 */
export class PluginSandbox {
  private manifest: PluginManifest;
  private config: Required<PluginSandboxConfig>;
  private context: PluginContext;
  private securityLogger: SecurityEventLogger;
  private permissionManager: PermissionManager;
  private resourceMonitor: ResourceMonitor;
  private sandboxEnvironment: SandboxEnvironment | null = null;
  private isActive: boolean = false;
  private executionCount: number = 0;

  constructor(
    manifest: PluginManifest,
    context: PluginContext,
    config?: Partial<PluginSandboxConfig>
  ) {
    this.manifest = manifest;
    this.context = context;
    this.config = {
      enabled: true,
      timeout: 30000,
      memoryLimit: 128,
      allowNetwork: false,
      allowFileSystem: false,
      allowedPaths: [],
      allowedModules: [],
      securityLevel: 'strict',
      resourceLimits: {
        maxExecutionTime: 30000,
        maxMemory: 128,
        maxCpuUsage: 80,
      },
      permissionPolicy: {
        defaultAllow: false,
        allowedPermissions: [],
        deniedPermissions: [],
      },
      ...config,
    };

    this.securityLogger = new SecurityEventLogger();
    this.permissionManager = new PermissionManager(this.config.permissionPolicy);
    this.resourceMonitor = new ResourceMonitor(this.config.resourceLimits);
  }

  /**
   * 初始化沙箱
   */
  async initialize(): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    this.sandboxEnvironment = new SandboxEnvironment(
      this.context,
      this.config.allowedModules
    );

    this.isActive = true;
    this.securityLogger.log(
      {
        type: 'sandbox_initialized',
        severity: 'info',
        message: 'Sandbox initialized',
      },
      this.manifest.id
    );
  }

  /**
   * 执行代码
   */
  async execute<T = unknown>(
    code: string,
    context?: Record<string, unknown>
  ): Promise<SandboxExecutionResult<T>> {
    if (!this.isActive) {
      return {
        error: new Error('Sandbox is not active'),
        duration: 0,
        timedOut: false,
      };
    }

    const startTime = Date.now();
    this.executionCount++;

    // 安全检查
    const securityCheck = SecurityChecker.checkCode(code);
    if (!securityCheck.passed) {
      this.securityLogger.log(
        {
          type: 'security_violation',
          severity: 'error',
          message: `Code security check failed: ${securityCheck.violations.join(', ')}`,
        },
        this.manifest.id,
        { violations: securityCheck.violations }
      );
      return {
        error: new Error(`Security check failed: ${securityCheck.violations.join(', ')}`),
        duration: Date.now() - startTime,
        timedOut: false,
      };
    }

    // 记录警告
    if (securityCheck.warnings.length > 0) {
      this.securityLogger.log(
        {
          type: 'security_warning',
          severity: 'warning',
          message: `Code security warnings: ${securityCheck.warnings.join(', ')}`,
        },
        this.manifest.id,
        { warnings: securityCheck.warnings }
      );
    }

    // 开始资源监控
    this.resourceMonitor.start();

    try {
      // 执行代码（带超时）
      const result = await this.executeWithTimeout<T>(code, context, this.config.timeout);

      // 检查资源使用
      const resourceCheck = this.resourceMonitor.check();
      if (!resourceCheck.passed) {
        this.securityLogger.log(
          {
            type: 'resource_violation',
            severity: 'error',
            message: `Resource limit exceeded: ${resourceCheck.violations.join(', ')}`,
          },
          this.manifest.id,
          { violations: resourceCheck.violations, usage: resourceCheck.usage }
        );
      }

      const duration = Date.now() - startTime;
      const timedOut = duration >= this.config.timeout;

      return {
        result,
        duration,
        timedOut,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const timedOut = error instanceof Error && error.message.includes('timeout');

      this.securityLogger.log(
        {
          type: 'execution_error',
          severity: 'error',
          message: `Execution failed: ${error}`,
        },
        this.manifest.id,
        { error: String(error) }
      );

      return {
        error: error as Error,
        duration,
        timedOut,
      };
    }
  }

  /**
   * 带超时的执行
   */
  private async executeWithTimeout<T>(
    code: string,
    context?: Record<string, unknown>,
    timeout?: number
  ): Promise<T> {
    if (!this.sandboxEnvironment) {
      throw new Error('Sandbox environment not initialized');
    }

    return new Promise<T>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Execution timeout after ${timeout}ms`));
      }, timeout);

      try {
        // 创建执行上下文
        const global = this.sandboxEnvironment.createRestrictedGlobal();
        const executionContext = {
          ...global,
          ...context,
        };

        // 使用 Function 构造器执行代码
        const fn = new Function(...Object.keys(executionContext), code);
        const result = fn(...Object.values(executionContext));

        // 处理 Promise 结果
        if (result instanceof Promise) {
          result
            .then((value) => {
              clearTimeout(timeoutId);
              resolve(value);
            })
            .catch((error) => {
              clearTimeout(timeoutId);
              reject(error);
            });
        } else {
          clearTimeout(timeoutId);
          resolve(result);
        }
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  /**
   * 检查权限
   */
  checkPermission(permission: string): boolean {
    return this.permissionManager.checkPermission(permission);
  }

  /**
   * 授予权限
   */
  grantPermission(permission: string): void {
    this.permissionManager.grantPermission(permission);
    this.securityLogger.log(
      {
        type: 'permission_granted',
        severity: 'info',
        message: `Permission granted: ${permission}`,
      },
      this.manifest.id,
      { permission }
    );
  }

  /**
   * 撤销权限
   */
  revokePermission(permission: string): void {
    this.permissionManager.revokePermission(permission);
    this.securityLogger.log(
      {
        type: 'permission_revoked',
        severity: 'info',
        message: `Permission revoked: ${permission}`,
      },
      this.manifest.id,
      { permission }
    );
  }

  /**
   * 检查文件路径
   */
  checkFilePath(path: string): { allowed: boolean; reason?: string } {
    if (!this.config.allowFileSystem) {
      return { allowed: false, reason: 'File system access is disabled' };
    }

    const check = SecurityChecker.checkFilePath(path, this.config.allowedPaths);
    if (!check.passed) {
      this.securityLogger.log(
        {
          type: 'permission_denied',
          severity: 'error',
          message: `File access denied: ${check.violations.join(', ')}`,
        },
        this.manifest.id,
        { path, violations: check.violations }
      );
      return { allowed: false, reason: check.violations.join(', ') };
    }

    return { allowed: true };
  }

  /**
   * 检查网络请求
   */
  checkNetworkRequest(url: string): { allowed: boolean; reason?: string } {
    if (!this.config.allowNetwork) {
      return { allowed: false, reason: 'Network access is disabled' };
    }

    const check = SecurityChecker.checkNetworkRequest(url);
    if (!check.passed) {
      this.securityLogger.log(
        {
          type: 'permission_denied',
          severity: 'error',
          message: `Network request denied: ${check.violations.join(', ')}`,
        },
        this.manifest.id,
        { url, violations: check.violations }
      );
      return { allowed: false, reason: check.violations.join(', ') };
    }

    return { allowed: true };
  }

  /**
   * 获取安全事件
   */
  getSecurityEvents(): SecurityEventType[] {
    return this.securityLogger.getEvents().map((r) => r.event);
  }

  /**
   * 获取安全事件统计
   */
  getSecurityStats(): Record<string, number> {
    return this.securityLogger.getStats();
  }

  /**
   * 获取资源使用情况
   */
  getResourceUsage(): ResourceUsage | null {
    if (!this.isActive) {
      return null;
    }
    const check = this.resourceMonitor.check();
    return check.usage;
  }

  /**
   * 获取执行统计
   */
  getExecutionStats(): {
    count: number;
    isActive: boolean;
    grantedPermissions: string[];
  } {
    return {
      count: this.executionCount,
      isActive: this.isActive,
      grantedPermissions: this.permissionManager.getGrantedPermissions(),
    };
  }

  /**
   * 重置沙箱
   */
  async reset(): Promise<void> {
    this.permissionManager.reset();
    this.executionCount = 0;
    this.securityLogger.clear();
  }

  /**
   * 销毁沙箱
   */
  async dispose(): Promise<void> {
    this.isActive = false;
    this.permissionManager.reset();
    this.securityLogger.clear();

    if (this.sandboxEnvironment) {
      this.sandboxEnvironment.dispose();
      this.sandboxEnvironment = null;
    }

    this.securityLogger.log(
      {
        type: 'sandbox_destroyed',
        severity: 'info',
        message: 'Sandbox destroyed',
      },
      this.manifest.id
    );
  }

  /**
   * 获取配置
   */
  getConfig(): Required<PluginSandboxConfig> {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<PluginSandboxConfig>): void {
    this.config = {
      ...this.config,
      ...config,
      resourceLimits: {
        ...this.config.resourceLimits,
        ...config.resourceLimits,
      },
      permissionPolicy: {
        ...this.config.permissionPolicy,
        ...config.permissionPolicy,
      },
    };
  }
}

// =============================================================================
// 沙箱管理器
// =============================================================================

/**
 * 沙箱管理器
 * 
 * 管理所有插件沙箱的生命周期
 */
export class SandboxManager {
  private sandboxes: Map<string, PluginSandbox> = new Map();
  private defaultConfig: Partial<PluginSandboxConfig>;

  constructor(defaultConfig?: Partial<PluginSandboxConfig>) {
    this.defaultConfig = defaultConfig || {};
  }

  /**
   * 创建沙箱
   */
  async createSandbox(
    manifest: PluginManifest,
    context: PluginContext,
    config?: Partial<PluginSandboxConfig>
  ): Promise<PluginSandbox> {
    const sandbox = new PluginSandbox(
      manifest,
      context,
      { ...this.defaultConfig, ...config }
    );

    await sandbox.initialize();
    this.sandboxes.set(manifest.id, sandbox);

    return sandbox;
  }

  /**
   * 获取沙箱
   */
  getSandbox(pluginId: string): PluginSandbox | undefined {
    return this.sandboxes.get(pluginId);
  }

  /**
   * 检查沙箱是否存在
   */
  hasSandbox(pluginId: string): boolean {
    return this.sandboxes.has(pluginId);
  }

  /**
   * 销毁沙箱
   */
  async destroySandbox(pluginId: string): Promise<boolean> {
    const sandbox = this.sandboxes.get(pluginId);
    if (!sandbox) {
      return false;
    }

    await sandbox.dispose();
    return this.sandboxes.delete(pluginId);
  }

  /**
   * 销毁所有沙箱
   */
  async destroyAll(): Promise<void> {
    const promises = Array.from(this.sandboxes.keys()).map((id) =>
      this.destroySandbox(id)
    );
    await Promise.all(promises);
  }

  /**
   * 获取所有沙箱
   */
  getAllSandboxes(): PluginSandbox[] {
    return Array.from(this.sandboxes.values());
  }

  /**
   * 获取沙箱数量
   */
  get sandboxCount(): number {
    return this.sandboxes.size;
  }

  /**
   * 获取全局安全事件
   */
  getGlobalSecurityEvents(): Array<{
    pluginId: string;
    event: SecurityEventType;
  }> {
    const events: Array<{ pluginId: string; event: SecurityEventType }> = [];

    for (const [pluginId, sandbox] of this.sandboxes) {
      const sandboxEvents = sandbox.getSecurityEvents();
      events.push(
        ...sandboxEvents.map((event) => ({ pluginId, event }))
      );
    }

    return events;
  }

  /**
   * 获取全局安全统计
   */
  getGlobalSecurityStats(): Record<string, number> {
    const stats: Record<string, number> = {};

    for (const sandbox of this.sandboxes.values()) {
      const sandboxStats = sandbox.getSecurityStats();
      for (const [key, value] of Object.entries(sandboxStats)) {
        stats[key] = (stats[key] || 0) + value;
      }
    }

    return stats;
  }
}

// =============================================================================
// 导出工具函数
// =============================================================================

/**
 * 创建默认沙箱配置
 */
export function createDefaultSandboxConfig(): Required<PluginSandboxConfig> {
  return {
    enabled: true,
    timeout: 30000,
    memoryLimit: 128,
    allowNetwork: false,
    allowFileSystem: false,
    allowedPaths: [],
    allowedModules: [],
    securityLevel: 'strict',
    resourceLimits: {
      maxExecutionTime: 30000,
      maxMemory: 128,
      maxCpuUsage: 80,
    },
    permissionPolicy: {
      defaultAllow: false,
      allowedPermissions: [],
      deniedPermissions: [],
    },
  };
}

/**
 * 验证沙箱配置
 */
export function validateSandboxConfig(
  config: Partial<PluginSandboxConfig>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (config.timeout !== undefined && config.timeout < 0) {
    errors.push('Timeout must be non-negative');
  }

  if (config.memoryLimit !== undefined && config.memoryLimit < 0) {
    errors.push('Memory limit must be non-negative');
  }

  if (config.resourceLimits?.maxExecutionTime !== undefined && config.resourceLimits.maxExecutionTime < 0) {
    errors.push('Max execution time must be non-negative');
  }

  if (config.resourceLimits?.maxMemory !== undefined && config.resourceLimits.maxMemory < 0) {
    errors.push('Max memory must be non-negative');
  }

  if (config.resourceLimits?.maxCpuUsage !== undefined && (config.resourceLimits.maxCpuUsage < 0 || config.resourceLimits.maxCpuUsage > 100)) {
    errors.push('Max CPU usage must be between 0 and 100');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}