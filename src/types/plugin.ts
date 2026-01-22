/**
 * 插件系统类型定义
 * 
 * 定义了插件清单、插件接口、生命周期类型、事件类型等所有插件相关的类型
 */

// =============================================================================
// 插件清单 (Plugin Manifest)
// =============================================================================

/**
 * 插件清单接口
 * 
 * 定义插件的元数据、入口、能力和配置信息
 */
export interface PluginManifest {
  /** 插件唯一标识符（必须全局唯一，推荐使用反向域名格式） */
  id: string;
  
  /** 插件显示名称 */
  name: string;
  
  /** 语义化版本号（遵循 semver 规范） */
  version: string;
  
  /** 插件描述（可选） */
  description?: string;
  
  /** 作者信息（可选） */
  author?: PluginAuthor;
  
  /** 许可证（可选，推荐使用 SPDX 标识符） */
  license?: string;
  
  /** 插件入口文件路径（相对于插件根目录） */
  entry: string;
  
  /** 主模块路径（可选，用于兼容旧版本） */
  main?: string;
  
  /** 插件依赖（可选） */
  dependencies?: PluginDependencies;
  
  /** 对宿主环境的依赖（可选） */
  peerDependencies?: PeerDependencies;
  
  /** 插件能力声明（必须至少声明一个能力） */
  capabilities: PluginCapability[];
  
  /** 生命周期钩子配置（可选） */
  hooks?: PluginHooksConfig;
  
  /** 插件配置项模式（可选） */
  options?: PluginOptionsSchema;
  
  /** 兼容性要求（可选） */
  engines?: PluginEngines;
  
  /** 插件贡献点声明（可选） */
  contributes?: PluginContributes;
}

/**
 * 插件作者信息
 */
export interface PluginAuthor {
  /** 作者名称 */
  name: string;
  
  /** 作者邮箱（可选） */
  email?: string;
  
  /** 作者主页（可选） */
  url?: string;
}

/**
 * 插件依赖类型
 */
export type PluginDependencies = Record<string, string>;

/**
 * 宿主环境依赖类型
 */
export type PeerDependencies = Record<string, string>;

/**
 * 插件能力类型枚举
 */
export const PluginCapabilityType = {
  /** 渲染器能力 - 提供内容渲染功能 */
  Renderer: 'renderer' as const,
  /** 转换器能力 - 提供内容转换功能 */
  Transformer: 'transformer' as const,
  /** 导出器能力 - 提供内容导出功能 */
  Exporter: 'exporter' as const,
  /** 存储能力 - 提供数据存储功能 */
  Storage: 'storage' as const,
  /** UI 能力 - 提供 UI 组件或扩展 */
  UI: 'ui' as const,
  /** 自定义能力 - 自定义扩展能力 */
  Custom: 'custom' as const,
};

/**
 * 插件能力类型
 */
export type PluginCapabilityType = typeof PluginCapabilityType[keyof typeof PluginCapabilityType];

/**
 * 插件能力声明
 */
export interface PluginCapability {
  /** 能力类型 */
  type: PluginCapabilityType;
  
  /** 能力名称 */
  name: string;
  
  /** 能力版本（可选） */
  version?: string;
  
  /** 约束条件（可选） */
  constraints?: Record<string, unknown>;
}

/**
 * 插件生命周期钩子配置
 */
export interface PluginHooksConfig {
  /** 插件加载时执行（可选） */
  onLoad?: string;
  
  /** 插件卸载时执行（可选） */
  onUnload?: string;
  
  /** 插件激活时执行（可选） */
  onActivate?: string;
  
  /** 插件停用时执行（可选） */
  onDeactivate?: string;
}

/**
 * 插件配置项模式
 */
export interface PluginOptionsSchema {
  /** 配置类型（固定为 object） */
  type: 'object';
  
  /** 配置属性定义 */
  properties: Record<string, PluginOptionProperty>;
  
  /** 必需的属性列表（可选） */
  required?: string[];
  
  /** 是否允许额外属性（可选） */
  additionalProperties?: boolean;
}

/**
 * 配置项属性
 */
export interface PluginOptionProperty {
  /** 配置项类型 */
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  
  /** 配置项描述 */
  description?: string;
  
  /** 默认值（可选） */
  default?: unknown;
  
  /** 枚举值列表（可选） */
  enum?: unknown[];
  
  /** 最小值（可选，用于数字类型） */
  minimum?: number;
  
  /** 最大值（可选，用于数字类型） */
  maximum?: number;
  
  /** 最小长度（可选，用于字符串或数组） */
  minLength?: number;
  
  /** 最大长度（可选，用于字符串或数组） */
  maxLength?: number;
}

/**
 * 插件引擎兼容性要求
 */
export interface PluginEngines {
  /** 最低 Node.js 版本要求（可选） */
  node?: string;
  
  /** 最低 Folder-Site 版本要求（可选） */
  folderSite?: string;
}

/**
 * 插件贡献点声明
 */
export interface PluginContributes {
  /** UI 贡献点（可选） */
  ui?: PluginUIContribution[];
  
  /** 命令贡献点（可选） */
  commands?: PluginCommandContribution[];
  
  /** 菜单贡献点（可选） */
  menus?: PluginMenuContribution[];
  
  /** 主题贡献点（可选） */
  themes?: PluginThemeContribution[];
}

/**
 * UI 贡献点
 */
export interface PluginUIContribution {
  /** 贡献点 ID */
  id: string;
  
  /** 贡献点类型 */
  type: 'component' | 'panel' | 'widget' | 'modal';
  
  /** 组件名称或路径 */
  name: string;
  
  /** 显示位置（可选） */
  position?: 'left' | 'right' | 'top' | 'bottom' | 'center' | 'overlay';
  
  /** 优先级（可选，数值越大优先级越高） */
  priority?: number;
}

/**
 * 命令贡献点
 */
export interface PluginCommandContribution {
  /** 命令 ID */
  id: string;
  
  /** 命令标题 */
  title: string;
  
  /** 命令图标（可选） */
  icon?: string;
  
  /** 快捷键（可选） */
  keybinding?: string;
  
  /** 命令分类（可选） */
  category?: string;
}

/**
 * 菜单贡献点
 */
export interface PluginMenuContribution {
  /** 菜单 ID */
  id: string;
  
  /** 菜单项文本 */
  text: string;
  
  /** 所属菜单 */
  menu: 'file' | 'edit' | 'view' | 'tools' | 'help' | 'context';
  
  /** 位置（可选） */
  position?: number;
  
  /** 图标（可选） */
  icon?: string;
  
  /** 父菜单 ID（可选，用于子菜单） */
  parent?: string;
}

/**
 * 主题贡献点
 */
export interface PluginThemeContribution {
  /** 主题 ID */
  id: string;
  
  /** 主题名称 */
  name: string;
  
  /** 主题类型 */
  type: 'light' | 'dark' | 'auto';
  
  /** 主题文件路径 */
  path: string;
}

// =============================================================================
// 插件生命周期 (Plugin Lifecycle)
// =============================================================================

/**
 * 插件状态类型
 */
export const PluginStatus = {
  /** 已发现 - 插件已被扫描但未验证 */
  Discovered: 'discovered' as const,
  
  /** 已验证 - 插件清单已验证通过 */
  Validated: 'validated' as const,
  
  /** 加载中 - 正在加载插件代码 */
  Loading: 'loading' as const,
  
  /** 已加载 - 插件代码已加载 */
  Loaded: 'loaded' as const,
  
  /** 激活中 - 正在激活插件 */
  Activating: 'activating' as const,
  
  /** 已激活 - 插件已激活并运行 */
  Active: 'active' as const,
  
  /** 停用中 - 正在停用插件 */
  Deactivating: 'deactivating' as const,
  
  /** 已停用 - 插件已停用但仍加载 */
  Inactive: 'inactive' as const,
  
  /** 错误 - 插件发生错误 */
  Error: 'error' as const,
};

/**
 * 插件状态类型
 */
export type PluginStatus = typeof PluginStatus[keyof typeof PluginStatus];

/**
 * 插件生命周期事件类型
 */
export const PluginLifecycleEvent = {
  /** 发现插件 */
  Discover: 'plugin:discover' as const,
  
  /** 验证插件 */
  Validate: 'plugin:validate' as const,
  
  /** 加载插件 */
  Load: 'plugin:load' as const,
  
  /** 卸载插件 */
  Unload: 'plugin:unload' as const,
  
  /** 激活插件 */
  Activate: 'plugin:activate' as const,
  
  /** 停用插件 */
  Deactivate: 'plugin:deactivate' as const,
  
  /** 插件错误 */
  Error: 'plugin:error' as const,
};

/**
 * 插件生命周期事件类型
 */
export type PluginLifecycleEvent = typeof PluginLifecycleEvent[keyof typeof PluginLifecycleEvent];

// =============================================================================
// 插件接口 (Plugin Interface)
// =============================================================================

/**
 * 核心插件接口
 * 
 * 所有插件必须实现此接口
 */
export interface Plugin {
  /** 插件唯一标识符（只读） */
  readonly id: string;
  
  /** 插件名称（只读） */
  readonly name: string;
  
  /** 插件版本（只读） */
  readonly version: string;
  
  /** 插件清单（只读） */
  readonly manifest: PluginManifest;
  
  /** 插件状态（只读） */
  readonly status: PluginStatus;
  
  /** 插件错误（只读，可选） */
  readonly error?: Error;
  
  /** 初始化插件（宿主环境调用） */
  initialize(context: PluginContext): Promise<void>;
  
  /** 激活插件 */
  activate(): Promise<void>;
  
  /** 停用插件 */
  deactivate(): Promise<void>;
  
  /** 销毁插件（清理资源） */
  dispose(): Promise<void>;
}

/**
 * 插件类工厂接口
 * 
 * 插件入口模块必须导出一个符合此接口的类
 */
export interface PluginClass {
  /** 创建插件实例 */
  new (manifest: PluginManifest): Plugin;
}

/**
 * 插件模块导出接口
 */
export interface PluginModule {
  /** 默认导出：插件类 */
  default?: PluginClass;
  
  /** 命名导出：插件类 */
  Plugin?: PluginClass;
  
  /** 插件清单（可选，用于动态加载） */
  manifest?: PluginManifest;
}

// =============================================================================
// 插件上下文 (Plugin Context)
// =============================================================================

/**
 * 插件上下文接口
 * 
 * 宿主环境传递给插件的上下文对象
 */
export interface PluginContext {
  /** 宿主环境信息 */
  readonly app: {
    /** Folder-Site 版本 */
    readonly version: string;
    
    /** 运行环境 */
    readonly environment: 'development' | 'production';
    
    /** 项目根路径 */
    readonly rootPath: string;
    
    /** 配置文件路径 */
    readonly configPath: string;
  };
  
  /** 服务访问 */
  readonly services: PluginServices;
  
  /** 事件系统 */
  readonly events: PluginEventEmitter;
  
  /** 日志系统 */
  readonly logger: PluginLogger;
  
  /** 插件存储 */
  readonly storage: PluginStorage;
  
  /** 工具函数 */
  readonly utils: PluginUtils;
  
  /** 配置 */
  readonly config: PluginConfig;
}

/**
 * 插件可访问的服务接口
 */
export interface PluginServices {
  /** 文件服务 */
  readonly fileService: unknown;
  
  /** 索引服务 */
  readonly indexService: unknown;
  
  /** 转换服务 */
  readonly transformService: unknown;
  
  /** 渲染服务 */
  readonly renderService: unknown;
  
  /** 导出服务 */
  readonly exportService: unknown;
}

/**
 * 插件事件发射器接口
 */
export interface PluginEventEmitter {
  /** 订阅事件 */
  on<T = unknown>(event: string, handler: (data: T) => void): Disposable;
  
  /** 订阅事件（一次性） */
  once<T = unknown>(event: string, handler: (data: T) => void): Disposable;
  
  /** 发布事件 */
  emit<T = unknown>(event: string, data: T): void;
  
  /** 取消订阅 */
  off(event: string, handler: (data: unknown) => void): void;
  
  /** 订阅所有事件 */
  onAny(handler: (event: string, data: unknown) => void): Disposable;
}

/**
 * 可清理资源接口
 */
export interface Disposable {
  /** 清理资源 */
  dispose(): void;
}

/**
 * 插件日志接口
 */
export interface PluginLogger {
  /** 调试日志 */
  debug(message: string, ...args: unknown[]): void;
  
  /** 信息日志 */
  info(message: string, ...args: unknown[]): void;
  
  /** 警告日志 */
  warn(message: string, ...args: unknown[]): void;
  
  /** 错误日志 */
  error(message: string, ...args: unknown[]): void;
}

/**
 * 插件存储接口
 * 
 * 提供插件私有的本地存储功能
 */
export interface PluginStorage {
  /** 获取存储值 */
  get<T = unknown>(key: string, defaultValue?: T): T | undefined;
  
  /** 设置存储值 */
  set<T = unknown>(key: string, value: T): void;
  
  /** 删除存储值 */
  remove(key: string): void;
  
  /** 清空存储 */
  clear(): void;
  
  /** 检查键是否存在 */
  has(key: string): boolean;
  
  /** 获取所有键 */
  keys(): string[];
  
  /** 获取存储大小 */
  readonly size: number;
}

/**
 * 插件工具函数接口
 */
export interface PluginUtils {
  /** 加载脚本 */
  loadScript(url: string): Promise<void>;
  
  /** 加载样式 */
  loadStyles(href: string): void;
  
  /** 深拷贝对象 */
  deepClone<T>(obj: T): T;
  
  /** 合并对象 */
  merge<T, U>(target: T, source: U): T & U;
  
  /** 防抖函数 */
  debounce<T extends (...args: unknown[]) => unknown>(
    fn: T,
    delay: number
  ): (...args: Parameters<T>) => void;
  
  /** 节流函数 */
  throttle<T extends (...args: unknown[]) => unknown>(
    fn: T,
    limit: number
  ): (...args: Parameters<T>) => void;
}

/**
 * 插件配置接口
 */
export interface PluginConfig {
  /** 获取配置值 */
  get<T = unknown>(key: string, defaultValue?: T): T | undefined;
  
  /** 设置配置值 */
  set<T = unknown>(key: string, value: T): void;
  
  /** 获取所有配置 */
  getAll(): Record<string, unknown>;
  
  /** 监听配置变化 */
  onChange(key: string, handler: (value: unknown) => void): Disposable;
}

// =============================================================================
// 插件注册表 (Plugin Registry)
// =============================================================================

/**
 * 插件注册表接口
 */
export interface PluginRegistry {
  /** 获取所有已注册的插件 */
  getAll(): Plugin[];
  
  /** 根据 ID 获取插件 */
  get(id: string): Plugin | undefined;
  
  /** 根据状态获取插件 */
  getByStatus(status: PluginStatus): Plugin[];
  
  /** 根据能力类型获取插件 */
  getByCapability(type: PluginCapabilityType): Plugin[];
  
  /** 注册插件 */
  register(plugin: Plugin): void;
  
  /** 注销插件 */
  unregister(id: string): boolean;
  
  /** 检查插件是否已注册 */
  has(id: string): boolean;
  
  /** 获取插件数量 */
  readonly size: number;
}

// =============================================================================
// 插件发现配置 (Plugin Discovery)
// =============================================================================

/**
 * 插件发现配置
 */
export interface PluginDiscoveryConfig {
  /** 插件搜索目录列表 */
  paths: string[];
  
  /** 插件清单文件名 */
  manifestFile: string;
  
  /** 扫描深度（默认 2） */
  maxDepth?: number;
  
  /** 排除的目录模式 */
  excludePatterns?: string[];
  
  /** 是否递归扫描子目录 */
  recursive?: boolean;
}

/**
 * 插件发现结果
 */
export interface PluginDiscoveryResult {
  /** 发现的插件路径列表 */
  pluginPaths: string[];
  
  /** 发现的插件清单列表 */
  manifests: Array<{ path: string; manifest: PluginManifest }>;
  
  /** 发现过程中的错误 */
  errors: Array<{ path: string; error: Error }>;
}

/**
 * 插件验证结果
 */
export interface PluginValidationResult {
  /** 是否有效 */
  valid: boolean;
  
  /** 插件清单 */
  manifest?: PluginManifest;
  
  /** 错误信息列表 */
  errors: string[];
  
  /** 警告信息列表 */
  warnings: string[];
}

// =============================================================================
// 插件沙箱 (Plugin Sandbox)
// =============================================================================

/**
 * 插件沙箱配置
 */
export interface PluginSandboxConfig {
  /** 是否启用沙箱 */
  enabled: boolean;
  
  /** 最大执行时间（毫秒） */
  timeout?: number;
  
  /** 内存限制（MB） */
  memoryLimit?: number;
  
  /** 是否允许网络请求 */
  allowNetwork?: boolean;
  
  /** 是否允许访问文件系统 */
  allowFileSystem?: boolean;
  
  /** 允许访问的目录列表 */
  allowedPaths?: string[];
  
  /** 允许的模块列表 */
  allowedModules?: string[];
}

/**
 * 沙箱执行结果
 */
export interface SandboxExecutionResult<T = unknown> {
  /** 执行结果 */
  result?: T;
  
  /** 执行错误 */
  error?: Error;
  
  /** 执行耗时（毫秒） */
  duration: number;
  
  /** 是否超时 */
  timedOut: boolean;
}

// =============================================================================
// 插件错误类型 (Plugin Error Types)
// =============================================================================

/**
 * 插件错误基类
 */
export class PluginError extends Error {
  /** 插件 ID */
  readonly pluginId: string;
  
  /** 插件版本 */
  readonly pluginVersion: string;
  
  /** 错误类型 */
  readonly type: PluginErrorType;
  
  constructor(
    message: string,
    pluginId: string,
    pluginVersion: string,
    type: PluginErrorType,
    cause?: Error
  ) {
    super(message, { cause });
    this.name = 'PluginError';
    this.pluginId = pluginId;
    this.pluginVersion = pluginVersion;
    this.type = type;
  }
}

/**
 * 插件错误类型枚举
 */
export const PluginErrorType = {
  /** 清单解析错误 */
  ManifestParse: 'manifest_parse' as const,
  
  /** 清单验证错误 */
  ManifestValidation: 'manifest_validation' as const,
  
  /** 入口加载错误 */
  EntryLoad: 'entry_load' as const,
  
  /** 初始化错误 */
  Initialize: 'initialize' as const,
  
  /** 激活错误 */
  Activate: 'activate' as const,
  
  /** 停用错误 */
  Deactivate: 'deactivate' as const,
  
  /** 依赖解析错误 */
  DependencyResolve: 'dependency_resolve' as const,
  
  /** 权限错误 */
  Permission: 'permission' as const,
  
  /** 运行时错误 */
  Runtime: 'runtime' as const,
};

/**
 * 插件错误类型
 */
export type PluginErrorType = typeof PluginErrorType[keyof typeof PluginErrorType];

// =============================================================================
// 插件管理器配置 (Plugin Manager Config)
// =============================================================================

/**
 * 插件管理器配置
 */
export interface PluginManagerConfig {
  /** 插件目录列表 */
  pluginPaths: string[];
  
  /** 是否启用插件 */
  enabled: boolean;
  
  /** 是否自动激活插件 */
  autoActivate: boolean;
  
  /** 沙箱配置 */
  sandbox?: Partial<PluginSandboxConfig>;
  
  /** 日志级别 */
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  
  /** 缓存配置 */
  cache?: {
    /** 是否启用缓存 */
    enabled: boolean;
    /** 缓存目录 */
    directory: string;
    /** 缓存过期时间（毫秒） */
    ttl: number;
  };
}

/**
 * 插件管理器默认配置
 */
export const DEFAULT_PLUGIN_MANAGER_CONFIG: PluginManagerConfig = {
  pluginPaths: ['./plugins'],
  enabled: true,
  autoActivate: true,
  sandbox: {
    enabled: true,
    timeout: 30000,
    memoryLimit: 128,
    allowNetwork: false,
    allowFileSystem: false,
    allowedPaths: [],
    allowedModules: [],
  },
  logLevel: 'info',
  cache: {
    enabled: true,
    directory: '.folder-site/plugins-cache',
    ttl: 86400000, // 24 hours
  },
};

// =============================================================================
// 工具函数和辅助类型
// =============================================================================

/**
 * 检查插件状态是否允许状态转换
 * 
 * @param currentStatus - 当前状态
 * @param targetStatus - 目标状态
 * @returns 是否允许转换
 */
export function canTransitionStatus(
  currentStatus: PluginStatus,
  targetStatus: PluginStatus
): boolean {
  const allowedTransitions: Record<PluginStatus, PluginStatus[]> = {
    discovered: ['validated', 'error'],
    validated: ['loading', 'error'],
    loading: ['loaded', 'error'],
    loaded: ['activating', 'inactive', 'error'],
    activating: ['active', 'error'],
    active: ['deactivating', 'error'],
    deactivating: ['inactive', 'error'],
    inactive: ['activating', 'unload', 'error'],
    error: ['validated', 'unload'],
  };

  return allowedTransitions[currentStatus]?.includes(targetStatus) ?? false;
}

/**
 * 验证插件清单必需字段
 * 
 * @param manifest - 插件清单
 * @returns 验证结果
 */
export function validatePluginManifest(manifest: Partial<PluginManifest>): PluginValidationResult {
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

  return {
    valid: errors.length === 0,
    manifest: manifest as PluginManifest,
    errors,
    warnings,
  };
}
