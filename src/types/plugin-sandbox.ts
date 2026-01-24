/**
 * 插件沙箱类型定义
 * 
 * 定义了插件沙箱的配置、权限策略、资源限制、执行结果和安全事件等类型
 */

// =============================================================================
// 沙箱配置 (Sandbox Configuration)
// =============================================================================

/**
 * 插件沙箱配置
 */
export interface PluginSandboxConfig {
  /** 是否启用沙箱 */
  enabled: boolean;
  
  /** 最大执行时间（毫秒，默认 30000） */
  timeout?: number;
  
  /** 内存限制（MB，默认 128） */
  memoryLimit?: number;
  
  /** CPU 时间限制（毫秒，默认 10000） */
  cpuLimit?: number;
  
  /** 是否允许网络请求 */
  allowNetwork?: boolean;
  
  /** 是否允许访问文件系统 */
  allowFileSystem?: boolean;
  
  /** 是否允许子进程创建 */
  allowChildProcess?: boolean;
  
  /** 是否允许访问环境变量 */
  allowEnv?: boolean;
  
  /** 允许访问的目录列表（相对路径或绝对路径） */
  allowedPaths?: string[];
  
  /** 禁止访问的目录列表（相对路径或绝对路径） */
  deniedPaths?: string[];
  
  /** 允许的模块列表（白名单） */
  allowedModules?: string[];
  
  /** 禁止的模块列表（黑名单） */
  deniedModules?: string[];
  
  /** 允许的域名列表（用于网络请求） */
  allowedDomains?: string[];
  
  /** 禁止的域名列表（用于网络请求） */
  deniedDomains?: string[];
  
  /** 是否启用代码安全扫描 */
  enableCodeScanning?: boolean;
  
  /** 是否启用资源监控 */
  enableResourceMonitoring?: boolean;
  
  /** 是否启用执行日志 */
  enableExecutionLogging?: boolean;
  
  /** 安全级别 */
  securityLevel?: 'strict' | 'moderate' | 'lenient';
  
  /** 资源限制配置 */
  resourceLimits?: {
    maxExecutionTime: number;
    maxMemory: number;
    maxCpuUsage: number;
  };
  
  /** 权限策略配置 */
  permissionPolicy?: {
    defaultAllow: boolean;
    allowedPermissions: string[];
    deniedPermissions: string[];
  };

  /** 沙箱隔离级别 */
  isolationLevel?: SandboxIsolationLevel;

  /** 沙箱实现方式 */
  implementation?: SandboxImplementation;
}

/**
 * 沙箱隔离级别
 */
export enum SandboxIsolationLevel {
  /** 无隔离 - 直接执行（仅用于信任的插件） */
  None = 'none',
  
  /** 轻度隔离 - 使用 vm 模块隔离 */
  Low = 'low',
  
  /** 中度隔离 - 使用 Worker 线程隔离 */
  Medium = 'medium',
  
  /** 高度隔离 - 使用独立的进程隔离 */
  High = 'high',
  
  /** 严格隔离 - 使用容器或虚拟机隔离 */
  Strict = 'strict',
}

/**
 * 沙箱实现方式
 */
export enum SandboxImplementation {
  /** Node.js vm 模块 */
  VM = 'vm',
  
  /** Worker 线程 */
  Worker = 'worker',
  
  /** 独立进程 */
  Process = 'process',
  
  /** vm2 库（需要额外依赖） */
  VM2 = 'vm2',
  
  /** 自定义实现 */
  Custom = 'custom',
}

/**
 * 默认沙箱配置
 */
export const DEFAULT_SANDBOX_CONFIG: Required<PluginSandboxConfig> = {
  enabled: true,
  timeout: 30000,
  memoryLimit: 128,
  cpuLimit: 10000,
  allowNetwork: false,
  allowFileSystem: false,
  allowChildProcess: false,
  allowEnv: false,
  allowedPaths: [],
  deniedPaths: [],
  allowedModules: [],
  deniedModules: ['child_process', 'fs', 'net', 'http', 'https', 'dgram', 'cluster'],
  allowedDomains: [],
  deniedDomains: [],
  enableCodeScanning: true,
  enableResourceMonitoring: true,
  enableExecutionLogging: true,
  isolationLevel: SandboxIsolationLevel.Medium,
  implementation: SandboxImplementation.Worker,
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

// =============================================================================
// 权限策略 (Permission Policy)
// =============================================================================

/**
 * 权限类型
 */
export enum PermissionType {
  /** 文件系统读取 */
  FileSystemRead = 'fs:read',
  
  /** 文件系统写入 */
  FileSystemWrite = 'fs:write',
  
  /** 网络请求 */
  Network = 'network',
  
  /** 子进程创建 */
  ChildProcess = 'child_process',
  
  /** 环境变量访问 */
  Environment = 'env',
  
  /** 模块导入 */
  ModuleImport = 'module:import',
  
  /** CPU 使用 */
  CPU = 'cpu',
  
  /** 内存使用 */
  Memory = 'memory',
}

/**
 * 权限策略
 */
export interface PermissionPolicy {
  /** 权限类型 */
  type: PermissionType;
  
  /** 是否允许 */
  allow: boolean;
  
  /** 权限范围 */
  scope?: string[];
  
  /** 限制条件 */
  constraints?: PermissionConstraint[];
}

/**
 * 权限约束
 */
export interface PermissionConstraint {
  /** 约束名称 */
  name: string;
  
  /** 约束值 */
  value: unknown;
  
  /** 约束操作符 */
  operator?: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'matches';
}

/**
 * 权限检查结果
 */
export interface PermissionCheckResult {
  /** 权限类型 */
  type: PermissionType;
  
  /** 是否允许 */
  allowed: boolean;
  
  /** 拒绝原因 */
  reason?: string;
  
  /** 检查时间戳 */
  timestamp: number;
}

// =============================================================================
// 资源限制 (Resource Limits)
// =============================================================================

/**
 * 资源限制配置
 */
export interface ResourceLimits {
  /** 内存限制（MB） */
  memory: number;
  
  /** CPU 时间限制（毫秒） */
  cpuTime: number;
  
  /** 最大执行时间（毫秒） */
  timeout: number;
  
  /** 最大文件描述符数量 */
  maxFiles?: number;
  
  /** 最大创建的子进程数量 */
  maxChildProcesses?: number;
  
  /** 最大并发网络连接数 */
  maxConnections?: number;
  
  /** 最大堆大小（MB） */
  maxHeapSize?: number;
  
  /** 最大栈大小（MB） */
  maxStackSize?: number;
}

/**
 * 资源使用情况
 */
export interface ResourceUsage {
  /** 已使用内存（MB） */
  memory: number;
  
  /** 已使用 CPU 时间（毫秒） */
  cpuTime: number;
  
  /** 已执行时间（毫秒） */
  elapsed: number;
  
  /** 打开的文件描述符数量 */
  openFiles?: number;
  
  /** 创建的子进程数量 */
  childProcesses?: number;
  
  /** 活跃的网络连接数 */
  activeConnections?: number;
  
  /** 堆大小（MB） */
  heapSize?: number;
  
  /** 栈大小（MB） */
  stackSize?: number;
}

/**
 * 资源使用统计
 */
export interface ResourceStats {
  /** 最小值 */
  min: ResourceUsage;
  
  /** 最大值 */
  max: ResourceUsage;
  
  /** 平均值 */
  avg: ResourceUsage;
  
  /** 采样次数 */
  samples: number;
}

// =============================================================================
// 沙箱执行结果 (Sandbox Execution Result)
// =============================================================================

/**
 * 沙箱执行结果
 */
export interface SandboxExecutionResult<T = unknown> {
  /** 执行结果 */
  result?: T;
  
  /** 执行错误 */
  error?: SandboxError;
  
  /** 执行耗时（毫秒） */
  duration: number;
  
  /** 是否超时 */
  timedOut: boolean;
  
  /** 是否超出内存限制 */
  outOfMemory: boolean;
  
  /** 是否超出 CPU 限制 */
  cpuExceeded: boolean;
  
  /** 资源使用情况 */
  resourceUsage?: ResourceUsage;
  
  /** 执行日志 */
  logs?: SandboxLog[];
  
  /** 安全事件 */
  securityEvents?: SecurityEvent[];
}

/**
 * 沙箱状态
 */
export enum SandboxStatus {
  /** 未初始化 */
  Uninitialized = 'uninitialized',
  
  /** 初始化中 */
  Initializing = 'initializing',
  
  /** 已就绪 */
  Ready = 'ready',
  
  /** 执行中 */
  Running = 'running',
  
  /** 已暂停 */
  Paused = 'paused',
  
  /** 已停止 */
  Stopped = 'stopped',
  
  /** 已销毁 */
  Destroyed = 'destroyed',
  
  /** 错误状态 */
  Error = 'error',
}

/**
 * 沙箱错误类型
 */
export enum SandboxErrorType {
  /** 执行超时 */
  Timeout = 'timeout',
  
  /** 内存不足 */
  OutOfMemory = 'out_of_memory',
  
  /** CPU 超限 */
  CPUExceeded = 'cpu_exceeded',
  
  /** 权限拒绝 */
  PermissionDenied = 'permission_denied',
  
  /** 代码语法错误 */
  SyntaxError = 'syntax_error',
  
  /** 运行时错误 */
  RuntimeError = 'runtime_error',
  
  /** 沙箱初始化错误 */
  InitializationError = 'initialization_error',
  
  /** 代码扫描失败 */
  CodeScanFailed = 'code_scan_failed',
  
  /** 资源限制错误 */
  ResourceLimitError = 'resource_limit_error',
  
  /** 未知错误 */
  Unknown = 'unknown',
}

/**
 * 沙箱错误
 */
export interface SandboxError {
  /** 错误类型 */
  type: SandboxErrorType;
  
  /** 错误消息 */
  message: string;
  
  /** 错误堆栈 */
  stack?: string;
  
  /** 原始错误 */
  cause?: Error;
  
  /** 错误发生时间 */
  timestamp: number;
}

/**
 * 沙箱日志
 */
export interface SandboxLog {
  /** 日志级别 */
  level: 'debug' | 'info' | 'warn' | 'error';
  
  /** 日志消息 */
  message: string;
  
  /** 日志时间戳 */
  timestamp: number;
  
  /** 附加数据 */
  data?: Record<string, unknown>;
}

// =============================================================================
// 安全事件 (Security Events)
// =============================================================================

/**
 * 安全事件类型
 */
export enum SecurityEventType {
  /** 权限违规 */
  PermissionViolation = 'permission_violation',
  
  /** 危险操作检测 */
  DangerousOperation = 'dangerous_operation',
  
  /** 代码注入尝试 */
  CodeInjection = 'code_injection',
  
  /** 恶意代码检测 */
  MaliciousCode = 'malicious_code',
  
  /** 资源滥用 */
  ResourceAbuse = 'resource_abuse',
  
  /** 网络访问尝试 */
  NetworkAccess = 'network_access',
  
  /** 文件系统访问尝试 */
  FileSystemAccess = 'file_system_access',
  
  /** 子进程创建尝试 */
  ChildProcessAttempt = 'child_process_attempt',
  
  /** 敏感信息访问 */
  SensitiveAccess = 'sensitive_access',
}

/**
 * 安全事件严重程度
 */
export enum SecurityEventSeverity {
  /** 低 */
  Low = 'low',
  
  /** 中 */
  Medium = 'medium',
  
  /** 高 */
  High = 'high',
  
  /** 严重 */
  Critical = 'critical',
}

/**
 * 安全事件
 */
export interface SecurityEvent {
  /** 事件类型 */
  type: SecurityEventType;
  
  /** 事件严重程度 */
  severity: SecurityEventSeverity;
  
  /** 事件描述 */
  description: string;
  
  /** 事件时间戳 */
  timestamp: number;
  
  /** 插件 ID */
  pluginId: string;
  
  /** 事件详情 */
  details?: Record<string, unknown>;
  
  /** 是否已处理 */
  handled: boolean;
  
  /** 处理动作 */
  action?: SecurityEventAction;
}

/**
 * 安全事件动作
 */
export enum SecurityEventAction {
  /** 忽略 */
  Ignore = 'ignore',
  
  /** 记录日志 */
  Log = 'log',
  
  /** 警告 */
  Warn = 'warn',
  
  /** 暂停执行 */
  Pause = 'pause',
  
  /** 停止执行 */
  Stop = 'stop',
  
  /** 终止沙箱 */
  Terminate = 'terminate',
}

/**
 * 安全检查结果
 */
export interface SecurityCheck {
  /** 是否通过检查 */
  passed: boolean;
  
  /** 违规项列表 */
  violations: string[];
  
  /** 警告列表 */
  warnings?: string[];
  
  /** 检查时间戳 */
  timestamp?: number;
  
  /** 检查详情 */
  details?: Record<string, unknown>;
}

// =============================================================================
// 代码扫描 (Code Scanning)
// =============================================================================

/**
 * 代码扫描结果
 */
export interface CodeScanResult {
  /** 是否通过扫描 */
  passed: boolean;
  
  /** 发现的问题 */
  issues: CodeIssue[];
  
  /** 扫描耗时（毫秒） */
  duration: number;
}

/**
 * 代码问题
 */
export interface CodeIssue {
  /** 问题类型 */
  type: CodeIssueType;
  
  /** 严重程度 */
  severity: SecurityEventSeverity;
  
  /** 问题描述 */
  message: string;
  
  /** 问题位置 */
  location?: CodeLocation;
  
  /** 修复建议 */
  suggestion?: string;
}

/**
 * 代码问题类型
 */
export enum CodeIssueType {
  /** 危险函数调用 */
  DangerousFunction = 'dangerous_function',
  
  /** 模块导入 */
  ModuleImport = 'module_import',
  
  /** 代码注入模式 */
  InjectionPattern = 'injection_pattern',
  
  /** 恶意代码模式 */
  MaliciousPattern = 'malicious_pattern',
  
  /** 敏感信息访问 */
  SensitiveAccess = 'sensitive_access',
  
  /** 无限循环 */
  InfiniteLoop = 'infinite_loop',
  
  /** 递归调用 */
  RecursiveCall = 'recursive_call',
}

/**
 * 代码位置
 */
export interface CodeLocation {
  /** 文件路径 */
  file?: string;
  
  /** 行号 */
  line?: number;
  
  /** 列号 */
  column?: number;
  
  /** 代码片段 */
  snippet?: string;
}

// =============================================================================
// 沙箱实例 (Sandbox Instance)
// =============================================================================

/**
 * 沙箱实例信息
 */
export interface SandboxInstance {
  /** 沙箱 ID */
  id: string;
  
  /** 关联的插件 ID */
  pluginId: string;
  
  /** 沙箱状态 */
  status: SandboxStatus;
  
  /** 沙箱配置 */
  config: PluginSandboxConfig;
  
  /** 创建时间 */
  createdAt: number;
  
  /** 最后活动时间 */
  lastActivity: number;
  
  /** 执行次数 */
  executionCount: number;
  
  /** 总执行时间（毫秒） */
  totalExecutionTime: number;
  
  /** 错误次数 */
  errorCount: number;
  
  /** 安全事件数量 */
  securityEventCount: number;
}

/**
 * 沙箱统计信息
 */
export interface SandboxStats {
  /** 总执行次数 */
  totalExecutions: number;
  
  /** 成功次数 */
  successCount: number;
  
  /** 失败次数 */
  failureCount: number;
  
  /** 超时次数 */
  timeoutCount: number;
  
  /** 平均执行时间（毫秒） */
  avgExecutionTime: number;
  
  /** 总执行时间（毫秒） */
  totalExecutionTime: number;
  
  /** 安全事件数量 */
  securityEventCount: number;
  
  /** 按类型分类的执行次数 */
  executionsByType: Map<string, number>;
}

// =============================================================================
// 沙箱选项 (Sandbox Options)
// =============================================================================

/**
 * 沙箱执行选项
 */
export interface SandboxExecutionOptions {
  /** 执行超时（毫秒） */
  timeout?: number;
  
  /** 是否启用资源监控 */
  enableResourceMonitoring?: boolean;
  
  /** 是否启用执行日志 */
  enableLogging?: boolean;
  
  /** 是否启用安全检查 */
  enableSecurityCheck?: boolean;
  
  /** 上下文数据 */
  context?: Record<string, unknown>;
  
  /** 传递给代码的参数 */
  args?: unknown[];
  
  /** 环境变量（如果允许） */
  env?: Record<string, string>;
}

// =============================================================================
// 工具函数
// =============================================================================

/**
 * 创建默认沙箱配置
 */
export function createDefaultSandboxConfig(
  overrides?: Partial<PluginSandboxConfig>
): PluginSandboxConfig {
  return {
    ...DEFAULT_SANDBOX_CONFIG,
    ...overrides,
  };
}

/**
 * 创建资源限制配置
 */
export function createResourceLimits(
  overrides?: Partial<ResourceLimits>
): ResourceLimits {
  return {
    memory: 128,
    cpuTime: 10000,
    timeout: 30000,
    maxFiles: 100,
    maxChildProcesses: 0,
    maxConnections: 10,
    maxHeapSize: 64,
    maxStackSize: 8,
    ...overrides,
  };
}

/**
 * 检查权限策略是否允许
 */
export function checkPermission(
  policy: PermissionPolicy,
  resource: string
): PermissionCheckResult {
  if (!policy.allow) {
    return {
      type: policy.type,
      allowed: false,
      reason: `Permission denied for ${policy.type}`,
      timestamp: Date.now(),
    };
  }

  if (policy.scope && policy.scope.length > 0) {
    const allowed = policy.scope.some((scope) => {
      if (policy.constraints) {
        return policy.constraints.every((constraint) => {
          const value = constraint.value;
          const target = resource;
          
          switch (constraint.operator) {
            case 'contains':
              return String(target).includes(String(value));
            case 'matches':
              return new RegExp(String(value)).test(target);
            default:
              return target === value;
          }
        });
      }
      return resource.startsWith(scope);
    });

    return {
      type: policy.type,
      allowed,
      reason: allowed ? undefined : `Resource not in allowed scope: ${resource}`,
      timestamp: Date.now(),
    };
  }

  return {
    type: policy.type,
    allowed: true,
    timestamp: Date.now(),
  };
}

/**
 * 合并资源使用情况
 */
export function mergeResourceUsage(
  current: ResourceUsage,
  update: Partial<ResourceUsage>
): ResourceUsage {
  return {
    ...current,
    ...update,
  };
}

/**
 * 计算资源使用平均值
 */
export function calculateAverageResourceUsage(
  usages: ResourceUsage[]
): ResourceUsage {
  if (usages.length === 0) {
    return {
      memory: 0,
      cpuTime: 0,
      elapsed: 0,
    };
  }

  const sum = usages.reduce(
    (acc, usage) => ({
      memory: acc.memory + usage.memory,
      cpuTime: acc.cpuTime + usage.cpuTime,
      elapsed: acc.elapsed + usage.elapsed,
      openFiles: (acc.openFiles || 0) + (usage.openFiles || 0),
      childProcesses: (acc.childProcesses || 0) + (usage.childProcesses || 0),
      activeConnections: (acc.activeConnections || 0) + (usage.activeConnections || 0),
      heapSize: (acc.heapSize || 0) + (usage.heapSize || 0),
      stackSize: (acc.stackSize || 0) + (usage.stackSize || 0),
    }),
    {
      memory: 0,
      cpuTime: 0,
      elapsed: 0,
      openFiles: 0,
      childProcesses: 0,
      activeConnections: 0,
      heapSize: 0,
      stackSize: 0,
    }
  );

  const count = usages.length;

  return {
    memory: sum.memory / count,
    cpuTime: sum.cpuTime / count,
    elapsed: sum.elapsed / count,
    openFiles: sum.openFiles! / count,
    childProcesses: sum.childProcesses! / count,
    activeConnections: sum.activeConnections! / count,
    heapSize: sum.heapSize! / count,
    stackSize: sum.stackSize! / count,
  };
}