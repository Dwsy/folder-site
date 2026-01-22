/**
 * 插件注册系统
 * 
 * 提供插件注册、注销、冲突检测、优先级管理等核心功能
 * 支持渲染器（renderer）和转换器（transformer）的注册
 * 
 * 核心功能：
 * - 插件注册与注销
 * - 渲染器和转换器注册
 * - 冲突检测机制
 * - 优先级系统
 * - 生命周期钩子
 */

import type {
  Plugin,
  PluginCapabilityType,
  PluginStatus,
} from '../../types/plugin.js';
import {
  PluginCapabilityType as CapabilityType,
  PluginError,
  PluginErrorType as ErrorType,
} from '../../types/plugin.js';

// =============================================================================
// 优先级相关类型
// =============================================================================

/**
 * 插件优先级类型
 */
export type PluginPriority =
  | 'high'    // 高优先级
  | 'normal'  // 正常优先级（默认）
  | 'low'     // 低优先级
  | number;   // 自定义优先级（数值越大优先级越高）

/**
 * 优先级数值映射
 */
const PRIORITY_VALUES: Record<string, number> = {
  high: 100,
  normal: 50,
  low: 10,
};

/**
 * 解析优先级为数值
 * 
 * @param priority - 优先级
 * @returns 数值优先级
 */
export function parsePriority(priority: PluginPriority): number {
  if (typeof priority === 'number') {
    return Math.max(0, Math.min(1000, priority));
  }
  const value = PRIORITY_VALUES[priority as keyof typeof PRIORITY_VALUES];
  return (value ?? PRIORITY_VALUES.normal) as number;
}

/**
 * 比较优先级
 * 
 * @param a - 优先级 a
 * @param b - 优先级 b
 * @returns 比较结果（a > b 返回 1，a < b 返回 -1，相等返回 0）
 */
export function comparePriority(a: PluginPriority, b: PluginPriority): number {
  const valueA = parsePriority(a);
  const valueB = parsePriority(b);
  return valueA - valueB;
}

// =============================================================================
// 冲突检测相关类型
// =============================================================================

/**
 * 冲突类型
 */
export type PluginConflictType =
  | 'duplicate_id'         // 重复的插件ID
  | 'duplicate_capability' // 重复的能力名称
  | 'dependency_mismatch'  // 依赖不匹配
  | 'version_conflict'     // 版本冲突
  | 'incompatible_plugin'; // 不兼容的插件

/**
 * 冲突解决策略
 */
export type ConflictResolutionStrategy =
  | 'error'    // 报错并拒绝注册
  | 'override' // 覆盖已存在的插件
  | 'merge'    // 合并插件（如果可能）
  | 'ignore';  // 忽略冲突

/**
 * 插件冲突信息
 */
export interface PluginConflict {
  /** 冲突类型 */
  type: PluginConflictType;
  
  /** 冲突的插件 ID */
  pluginId: string;
  
  /** 冲突描述 */
  message: string;
  
  /** 相关的其他插件 ID（如果有） */
  relatedPluginId?: string;
  
  /** 是否可以解决 */
  resolvable: boolean;
  
  /** 建议的解决方案 */
  suggestion?: string;
}

/**
 * 冲突检测结果
 */
export interface ConflictDetectionResult {
  /** 是否存在冲突 */
  hasConflicts: boolean;
  
  /** 冲突列表 */
  conflicts: PluginConflict[];
  
  /** 是否可以安全注册 */
  canRegister: boolean;
}

// =============================================================================
// 渲染器注册相关类型
// =============================================================================

/**
 * 渲染器接口
 */
export interface RendererPlugin {
  /** 渲染器名称 */
  name: string;
  
  /** 支持的文件类型/扩展名 */
  extensions: string[];
  
  /** 渲染函数 */
  render: (content: string, options?: Record<string, unknown>) => Promise<string> | string;
  
  /** 渲染器版本 */
  version?: string;
  
  /** 优先级 */
  priority?: PluginPriority;
  
  /** 插件 ID */
  pluginId: string;
}

/**
 * 渲染器注册项
 */
export interface RendererRegistration {
  /** 渲染器 */
  renderer: RendererPlugin;
  
  /** 注册时间 */
  registeredAt: Date;
  
  /** 是否启用 */
  enabled: boolean;
  
  /** 生命周期钩子 */
  hooks?: {
    onRegister?: () => void | Promise<void>;
    onUnregister?: () => void | Promise<void>;
  };
}

// =============================================================================
// 转换器注册相关类型
// =============================================================================

/**
 * 转换器接口
 */
export interface TransformerPlugin {
  /** 转换器名称 */
  name: string;
  
  /** 输入类型 */
  inputType: string;
  
  /** 输出类型 */
  outputType: string;
  
  /** 转换函数 */
  transform: (
    content: unknown,
    options?: Record<string, unknown>
  ) => Promise<unknown> | unknown;
  
  /** 转换器版本 */
  version?: string;
  
  /** 优先级 */
  priority?: PluginPriority;
  
  /** 插件 ID */
  pluginId: string;
}

/**
 * 转换器注册项
 */
export interface TransformerRegistration {
  /** 转换器 */
  transformer: TransformerPlugin;
  
  /** 注册时间 */
  registeredAt: Date;
  
  /** 是否启用 */
  enabled: boolean;
  
  /** 生命周期钩子 */
  hooks?: {
    onRegister?: () => void | Promise<void>;
    onUnregister?: () => void | Promise<void>;
  };
}

// =============================================================================
// 插件注册项
// =============================================================================

/**
 * 插件注册项
 */
export interface PluginRegistration {
  /** 插件实例 */
  plugin: Plugin;
  
  /** 注册时间 */
  registeredAt: Date;
  
  /** 优先级 */
  priority: number;
  
  /** 是否启用 */
  enabled: boolean;
  
  /** 注册的渲染器列表 */
  renderers: RendererRegistration[];
  
  /** 注册的转换器列表 */
  transformers: TransformerRegistration[];
  
  /** 生命周期钩子 */
  hooks?: {
    onRegister?: () => void | Promise<void>;
    onUnregister?: () => void | Promise<void>;
  };
}

// =============================================================================
// 注册配置
// =============================================================================

/**
 * 插件注册配置
 */
export interface PluginRegistryConfig {
  /** 冲突解决策略 */
  conflictResolution?: ConflictResolutionStrategy;
  
  /** 默认优先级 */
  defaultPriority?: PluginPriority;
  
  /** 是否自动检测冲突 */
  autoDetectConflicts?: boolean;
  
  /** 是否启用插件 */
  enablePlugins?: boolean;
  
  /** 最大插件数量 */
  maxPlugins?: number;
  
  /** 是否允许覆盖已注册的能力 */
  allowOverride?: boolean;
}

/**
 * 默认注册配置
 */
const DEFAULT_REGISTRY_CONFIG: Required<PluginRegistryConfig> = {
  conflictResolution: 'error',
  defaultPriority: 'normal',
  autoDetectConflicts: true,
  enablePlugins: true,
  maxPlugins: 100,
  allowOverride: false,
};

// =============================================================================
// 插件注册系统
// =============================================================================

/**
 * 插件注册系统
 * 
 * 管理插件的注册、注销、冲突检测和优先级排序
 */
export class PluginRegistry {
  private config: Required<PluginRegistryConfig>;
  private plugins: Map<string, PluginRegistration> = new Map();
  private renderers: Map<string, RendererRegistration[]> = new Map(); // 按扩展名分组
  private transformers: Map<string, TransformerRegistration[]> = new Map(); // 按输入类型分组
  private rendererByName: Map<string, RendererRegistration> = new Map();
  private transformerByName: Map<string, TransformerRegistration> = new Map();

  constructor(config?: Partial<PluginRegistryConfig>) {
    this.config = {
      ...DEFAULT_REGISTRY_CONFIG,
      ...config,
    };
  }

  // ==========================================================================
  // 插件注册与注销
  // ==========================================================================

  /**
   * 注册插件
   * 
   * @param plugin - 插件实例
   * @param options - 注册选项
   * @returns 注册结果
   */
  async register(
    plugin: Plugin,
    options?: {
      priority?: PluginPriority;
      enabled?: boolean;
    }
  ): Promise<{ success: boolean; conflict?: PluginConflict }> {
    const pluginId = plugin.id;

    // 检查是否超过最大插件数量
    if (this.plugins.size >= this.config.maxPlugins) {
      throw new PluginError(
        `Maximum plugin limit (${this.config.maxPlugins}) reached`,
        pluginId,
        plugin.version,
        ErrorType.Runtime
      );
    }

    // 获取优先级
    const priority = parsePriority(
      options?.priority ?? this.config.defaultPriority
    );
    const enabled = options?.enabled ?? this.config.enablePlugins;

    // 自动检测冲突
    if (this.config.autoDetectConflicts) {
      const conflictResult = this.detectConflicts(plugin);
      if (conflictResult.hasConflicts) {
        const primaryConflict = conflictResult.conflicts[0];

        // 根据配置的冲突解决策略处理
        switch (this.config.conflictResolution) {
          case 'error':
            // 报错并拒绝注册
            return {
              success: false,
              conflict: primaryConflict,
            };

          case 'override':
            // 覆盖已存在的插件
            this.unregister(pluginId, { silent: true });
            break;

          case 'merge':
            // 尝试合并（对于重复ID，覆盖）
            this.unregister(pluginId, { silent: true });
            break;

          case 'ignore':
            // 忽略冲突，继续注册
            break;
        }
      }
    }

    // 调用注册钩子
    if ((plugin as any).onRegister) {
      try {
        await (plugin as any).onRegister();
      } catch (error) {
        console.warn(`Plugin ${pluginId} onRegister hook failed:`, error);
      }
    }

    // 创建注册项
    const registration: PluginRegistration = {
      plugin,
      registeredAt: new Date(),
      priority,
      enabled,
      renderers: [],
      transformers: [],
      hooks: {
        onRegister: (plugin as any).onRegister,
        onUnregister: (plugin as any).onUnregister,
      },
    };

    // 注册到插件映射
    this.plugins.set(pluginId, registration);

    return { success: true };
  }

  /**
   * 注销插件
   * 
   * @param pluginId - 插件 ID
   * @param options - 注销选项
   * @returns 是否成功
   */
  async unregister(
    pluginId: string,
    options?: {
      silent?: boolean; // 是否静默注销（不触发钩子）
    }
  ): Promise<boolean> {
    const registration = this.plugins.get(pluginId);
    if (!registration) {
      return false;
    }

    // 调用注销钩子
    if (!options?.silent && registration.hooks?.onUnregister) {
      try {
        await registration.hooks.onUnregister();
      } catch (error) {
        console.warn(`Plugin ${pluginId} onUnregister hook failed:`, error);
      }
    }

    // 注销所有关联的渲染器
    for (const rendererReg of registration.renderers) {
      this.unregisterRenderer(rendererReg.renderer.name, { silent: true });
    }

    // 注销所有关联的转换器
    for (const transformerReg of registration.transformers) {
      this.unregisterTransformer(transformerReg.transformer.name, { silent: true });
    }

    // 从插件映射移除
    this.plugins.delete(pluginId);

    return true;
  }

  /**
   * 检测插件冲突
   * 
   * @param plugin - 插件实例
   * @returns 冲突检测结果
   */
  detectConflicts(plugin: Plugin): ConflictDetectionResult {
    const conflicts: PluginConflict[] = [];

    // 1. 检测重复的插件 ID
    if (this.plugins.has(plugin.id)) {
      conflicts.push({
        type: 'duplicate_id',
        pluginId: plugin.id,
        message: `Plugin with ID '${plugin.id}' is already registered`,
        relatedPluginId: plugin.id,
        resolvable: true,
        suggestion: this.config.allowOverride
          ? `Use conflict resolution strategy 'override' to replace the existing plugin`
          : `Unregister the existing plugin before registering this one`,
      });
    }

    // 2. 检测能力冲突
    for (const capability of plugin.manifest.capabilities) {
      // 检查渲染器冲突
      if (capability.type === CapabilityType.Renderer) {
        const existingRenderer = this.rendererByName.get(capability.name);
        if (existingRenderer) {
          conflicts.push({
            type: 'duplicate_capability',
            pluginId: plugin.id,
            message: `Renderer '${capability.name}' is already registered by plugin '${existingRenderer.renderer.pluginId}'`,
            relatedPluginId: existingRenderer.renderer.pluginId,
            resolvable: true,
            suggestion: `Use a unique renderer name or override the existing renderer`,
          });
        }
      }

      // 检查转换器冲突
      if (capability.type === CapabilityType.Transformer) {
        const existingTransformer = this.transformerByName.get(capability.name);
        if (existingTransformer) {
          conflicts.push({
            type: 'duplicate_capability',
            pluginId: plugin.id,
            message: `Transformer '${capability.name}' is already registered by plugin '${existingTransformer.transformer.pluginId}'`,
            relatedPluginId: existingTransformer.transformer.pluginId,
            resolvable: true,
            suggestion: `Use a unique transformer name or override the existing transformer`,
          });
        }
      }
    }

    // 3. 检测依赖冲突
    if (plugin.manifest.dependencies) {
      for (const [depName, depVersion] of Object.entries(plugin.manifest.dependencies)) {
        const depPlugin = this.plugins.get(depName);
        if (depPlugin) {
          // 检查版本兼容性
          const installedVersion = depPlugin.plugin.version;
          if (!this.isVersionCompatible(installedVersion, depVersion)) {
            conflicts.push({
              type: 'version_conflict',
              pluginId: plugin.id,
              message: `Dependency '${depName}' version '${depVersion}' is not compatible with installed version '${installedVersion}'`,
              relatedPluginId: depName,
              resolvable: false,
              suggestion: `Upgrade the installed plugin to a compatible version`,
            });
          }
        }
      }
    }

    // 4. 检测不兼容的插件
    if (plugin.manifest.peerDependencies) {
      for (const [peerName, peerVersion] of Object.entries(plugin.manifest.peerDependencies)) {
        const peerPlugin = this.plugins.get(peerName);
        if (peerPlugin) {
          const installedVersion = peerPlugin.plugin.version;
          if (!this.isVersionCompatible(installedVersion, peerVersion)) {
            conflicts.push({
              type: 'incompatible_plugin',
              pluginId: plugin.id,
              message: `Peer dependency '${peerName}' version '${peerVersion}' is not compatible with installed version '${installedVersion}'`,
              relatedPluginId: peerName,
              resolvable: false,
              suggestion: `Install a compatible version of '${peerName}'`,
            });
          }
        }
      }
    }

    return {
      hasConflicts: conflicts.length > 0,
      conflicts,
      canRegister: conflicts.every((c) => c.resolvable),
    };
  }

  // ==========================================================================
  // 渲染器注册与注销
  // ==========================================================================

  /**
   * 注册渲染器
   * 
   * @param renderer - 渲染器
   * @param pluginId - 所属插件 ID
   * @returns 注册结果
   */
  async registerRenderer(
    renderer: RendererPlugin,
    pluginId: string
  ): Promise<{ success: boolean; conflict?: PluginConflict }> {
    // 验证插件已注册
    const registration = this.plugins.get(pluginId);
    if (!registration) {
      throw new PluginError(
        `Cannot register renderer: Plugin '${pluginId}' is not registered`,
        pluginId,
        renderer.version || 'unknown',
        ErrorType.Runtime
      );
    }

    // 检测同名渲染器冲突
    if (this.rendererByName.has(renderer.name)) {
      const existing = this.rendererByName.get(renderer.name)!;
      if (!this.config.allowOverride) {
        return {
          success: false,
          conflict: {
            type: 'duplicate_capability',
            pluginId,
            message: `Renderer '${renderer.name}' is already registered by plugin '${existing.renderer.pluginId}'`,
            relatedPluginId: existing.renderer.pluginId,
            resolvable: true,
            suggestion: `Use allowOverride: true to replace the existing renderer`,
          },
        };
      }

      // 注销已存在的渲染器
      this.unregisterRenderer(renderer.name, { silent: true });
    }

    // 创建渲染器注册项
    const rendererReg: RendererRegistration = {
      renderer,
      registeredAt: new Date(),
      enabled: registration.enabled,
      hooks: {
        onRegister: renderer as any,
        onUnregister: renderer as any,
      },
    };

    // 按名称注册
    this.rendererByName.set(renderer.name, rendererReg);

    // 按扩展名分组注册
    for (const ext of renderer.extensions) {
      const normalizedExt = ext.startsWith('.') ? ext : `.${ext}`;
      const renderers = this.renderers.get(normalizedExt) || [];
      renderers.push(rendererReg);
      // 按优先级排序
      renderers.sort((a, b) => {
        const priorityA = parsePriority(a.renderer.priority || 'normal');
        const priorityB = parsePriority(b.renderer.priority || 'normal');
        return priorityB - priorityA; // 降序
      });
      this.renderers.set(normalizedExt, renderers);
    }

    // 添加到插件注册项
    registration.renderers.push(rendererReg);

    // 调用注册钩子
    if ((renderer as any).onRegister) {
      try {
        await (renderer as any).onRegister();
      } catch (error) {
        console.warn(`Renderer '${renderer.name}' onRegister hook failed:`, error);
      }
    }

    return { success: true };
  }

  /**
   * 注销渲染器
   * 
   * @param rendererName - 渲染器名称
   * @param options - 注销选项
   * @returns 是否成功
   */
  async unregisterRenderer(
    rendererName: string,
    options?: { silent?: boolean }
  ): Promise<boolean> {
    const rendererReg = this.rendererByName.get(rendererName);
    if (!rendererReg) {
      return false;
    }

    // 调用注销钩子
    if (!options?.silent && (rendererReg.renderer as any).onUnregister) {
      try {
        await (rendererReg.renderer as any).onUnregister();
      } catch (error) {
        console.warn(`Renderer '${rendererName}' onUnregister hook failed:`, error);
      }
    }

    // 从名称映射移除
    this.rendererByName.delete(rendererName);

    // 从扩展名映射移除
    for (const ext of rendererReg.renderer.extensions) {
      const normalizedExt = ext.startsWith('.') ? ext : `.${ext}`;
      const renderers = this.renderers.get(normalizedExt);
      if (renderers) {
        const index = renderers.findIndex((r) => r.renderer.name === rendererName);
        if (index !== -1) {
          renderers.splice(index, 1);
          if (renderers.length === 0) {
            this.renderers.delete(normalizedExt);
          } else {
            this.renderers.set(normalizedExt, renderers);
          }
        }
      }
    }

    // 从插件注册项移除
    const pluginId = rendererReg.renderer.pluginId;
    const pluginReg = this.plugins.get(pluginId);
    if (pluginReg) {
      const index = pluginReg.renderers.findIndex(
        (r) => r.renderer.name === rendererName
      );
      if (index !== -1) {
        pluginReg.renderers.splice(index, 1);
      }
    }

    return true;
  }

  /**
   * 获取渲染器
   * 
   * @param name - 渲染器名称或文件扩展名
   * @returns 渲染器
   */
  getRenderer(name: string): RendererPlugin | undefined {
    // 按名称查找
    if (this.rendererByName.has(name)) {
      const reg = this.rendererByName.get(name)!;
      if (reg.enabled) {
        return reg.renderer;
      }
    }

    // 按扩展名查找（返回优先级最高的）
    const normalizedExt = name.startsWith('.') ? name : `.${name}`;
    const renderers = this.renderers.get(normalizedExt);
    if (renderers && renderers.length > 0) {
      const enabled = renderers.find((r) => r.enabled);
      return enabled?.renderer;
    }

    return undefined;
  }

  /**
   * 获取所有渲染器
   * 
   * @returns 渲染器列表
   */
  getAllRenderers(): RendererPlugin[] {
    return Array.from(this.rendererByName.values())
      .filter((r) => r.enabled)
      .map((r) => r.renderer)
      .sort((a, b) => {
        const priorityA = parsePriority(a.priority || 'normal');
        const priorityB = parsePriority(b.priority || 'normal');
        return priorityB - priorityA;
      });
  }

  /**
   * 获取指定扩展名的所有渲染器
   * 
   * @param extension - 文件扩展名
   * @returns 渲染器列表（按优先级排序）
   */
  getRenderersByExtension(extension: string): RendererPlugin[] {
    const normalizedExt = extension.startsWith('.') ? extension : `.${extension}`;
    const renderers = this.renderers.get(normalizedExt) || [];
    return renderers
      .filter((r) => r.enabled)
      .map((r) => r.renderer);
  }

  // ==========================================================================
  // 转换器注册与注销
  // ==========================================================================

  /**
   * 注册转换器
   * 
   * @param transformer - 转换器
   * @param pluginId - 所属插件 ID
   * @returns 注册结果
   */
  async registerTransformer(
    transformer: TransformerPlugin,
    pluginId: string
  ): Promise<{ success: boolean; conflict?: PluginConflict }> {
    // 验证插件已注册
    const registration = this.plugins.get(pluginId);
    if (!registration) {
      throw new PluginError(
        `Cannot register transformer: Plugin '${pluginId}' is not registered`,
        pluginId,
        transformer.version || 'unknown',
        ErrorType.Runtime
      );
    }

    // 检测同名转换器冲突
    if (this.transformerByName.has(transformer.name)) {
      const existing = this.transformerByName.get(transformer.name)!;
      
      if (!this.config.allowOverride) {
        return {
          success: false,
          conflict: {
            type: 'duplicate_capability',
            pluginId,
            message: `Transformer '${transformer.name}' is already registered by plugin '${existing.transformer.pluginId}'`,
            relatedPluginId: existing.transformer.pluginId,
            resolvable: true,
            suggestion: `Use allowOverride: true to replace the existing transformer`,
          },
        };
      }

      // 注销已存在的转换器
      this.unregisterTransformer(transformer.name, { silent: true });
    }

    // 创建转换器注册项
    const transformerReg: TransformerRegistration = {
      transformer,
      registeredAt: new Date(),
      enabled: registration.enabled,
      hooks: {
        onRegister: transformer as any,
        onUnregister: transformer as any,
      },
    };

    // 按名称注册
    this.transformerByName.set(transformer.name, transformerReg);

    // 按输入类型分组注册
    const transformers = this.transformers.get(transformer.inputType) || [];
    transformers.push(transformerReg);
    // 按优先级排序
    transformers.sort((a, b) => {
      const priorityA = parsePriority(a.transformer.priority || 'normal');
      const priorityB = parsePriority(b.transformer.priority || 'normal');
      return priorityB - priorityA; // 降序
    });
    this.transformers.set(transformer.inputType, transformers);

    // 添加到插件注册项
    registration.transformers.push(transformerReg);

    // 调用注册钩子
    if ((transformer as any).onRegister) {
      try {
        await (transformer as any).onRegister();
      } catch (error) {
        console.warn(`Transformer '${transformer.name}' onRegister hook failed:`, error);
      }
    }

    return { success: true };
  }

  /**
   * 注销转换器
   * 
   * @param transformerName - 转换器名称
   * @param options - 注销选项
   * @returns 是否成功
   */
  async unregisterTransformer(
    transformerName: string,
    options?: { silent?: boolean }
  ): Promise<boolean> {
    const transformerReg = this.transformerByName.get(transformerName);
    if (!transformerReg) {
      return false;
    }

    // 调用注销钩子
    if (!options?.silent && (transformerReg.transformer as any).onUnregister) {
      try {
        await (transformerReg.transformer as any).onUnregister();
      } catch (error) {
        console.warn(`Transformer '${transformerName}' onUnregister hook failed:`, error);
      }
    }

    // 从名称映射移除
    this.transformerByName.delete(transformerName);

    // 从输入类型映射移除
    const inputType = transformerReg.transformer.inputType;
    const transformers = this.transformers.get(inputType);
    if (transformers) {
      const index = transformers.findIndex((t) => t.transformer.name === transformerName);
      if (index !== -1) {
        transformers.splice(index, 1);
        if (transformers.length === 0) {
          this.transformers.delete(inputType);
        } else {
          this.transformers.set(inputType, transformers);
        }
      }
    }

    // 从插件注册项移除
    const pluginId = transformerReg.transformer.pluginId;
    const pluginReg = this.plugins.get(pluginId);
    if (pluginReg) {
      const index = pluginReg.transformers.findIndex(
        (t) => t.transformer.name === transformerName
      );
      if (index !== -1) {
        pluginReg.transformers.splice(index, 1);
      }
    }

    return true;
  }

  /**
   * 获取转换器
   * 
   * @param name - 转换器名称
   * @returns 转换器
   */
  getTransformer(name: string): TransformerPlugin | undefined {
    const reg = this.transformerByName.get(name);
    if (reg && reg.enabled) {
      return reg.transformer;
    }
    return undefined;
  }

  /**
   * 获取所有转换器
   * 
   * @returns 转换器列表
   */
  getAllTransformers(): TransformerPlugin[] {
    return Array.from(this.transformerByName.values())
      .filter((t) => t.enabled)
      .map((t) => t.transformer)
      .sort((a, b) => {
        const priorityA = parsePriority(a.priority || 'normal');
        const priorityB = parsePriority(b.priority || 'normal');
        return priorityB - priorityA;
      });
  }

  /**
   * 获取指定输入类型的所有转换器
   * 
   * @param inputType - 输入类型
   * @returns 转换器列表（按优先级排序）
   */
  getTransformersByInputType(inputType: string): TransformerPlugin[] {
    const transformers = this.transformers.get(inputType) || [];
    return transformers
      .filter((t) => t.enabled)
      .map((t) => t.transformer);
  }

  // ==========================================================================
  // 插件查询
  // ==========================================================================

  /**
   * 获取插件
   * 
   * @param id - 插件 ID
   * @returns 插件实例
   */
  getPlugin(id: string): Plugin | undefined {
    const registration = this.plugins.get(id);
    return registration?.plugin;
  }

  /**
   * 获取所有插件
   * 
   * @returns 插件列表
   */
  getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values())
      .filter((r) => r.enabled)
      .sort((a, b) => {
        // 同优先级按注册顺序，不同优先级按优先级排序
        if (a.priority !== b.priority) {
          return b.priority - a.priority;
        }
        return a.registeredAt.getTime() - b.registeredAt.getTime();
      })
      .map((r) => r.plugin);
  }

  /**
   * 根据状态获取插件
   * 
   * @param status - 插件状态
   * @returns 插件列表
   */
  getPluginsByStatus(status: PluginStatus): Plugin[] {
    return Array.from(this.plugins.values())
      .filter((r) => r.plugin.status === status && r.enabled)
      .map((r) => r.plugin);
  }

  /**
   * 根据能力类型获取插件
   * 
   * @param capabilityType - 能力类型
   * @returns 插件列表
   */
  getPluginsByCapability(capabilityType: PluginCapabilityType): Plugin[] {
    return Array.from(this.plugins.values())
      .filter((r) => 
        r.enabled &&
        r.plugin.manifest.capabilities.some((c) => c.type === capabilityType)
      )
      .map((r) => r.plugin);
  }

  /**
   * 检查插件是否已注册
   * 
   * @param id - 插件 ID
   * @returns 是否已注册
   */
  hasPlugin(id: string): boolean {
    return this.plugins.has(id);
  }

  /**
   * 检查渲染器是否已注册
   * 
   * @param name - 渲染器名称
   * @returns 是否已注册
   */
  hasRenderer(name: string): boolean {
    return this.rendererByName.has(name);
  }

  /**
   * 检查转换器是否已注册
   * 
   * @param name - 转换器名称
   * @returns 是否已注册
   */
  hasTransformer(name: string): boolean {
    return this.transformerByName.has(name);
  }

  // ==========================================================================
  // 插件启用/禁用
  // ==========================================================================

  /**
   * 启用插件
   * 
   * @param id - 插件 ID
   * @returns 是否成功
   */
  enablePlugin(id: string): boolean {
    const registration = this.plugins.get(id);
    if (!registration) {
      return false;
    }

    registration.enabled = true;

    // 启用所有关联的渲染器
    for (const renderer of registration.renderers) {
      renderer.enabled = true;
    }

    // 启用所有关联的转换器
    for (const transformer of registration.transformers) {
      transformer.enabled = true;
    }

    return true;
  }

  /**
   * 禁用插件
   * 
   * @param id - 插件 ID
   * @returns 是否成功
   */
  disablePlugin(id: string): boolean {
    const registration = this.plugins.get(id);
    if (!registration) {
      return false;
    }

    registration.enabled = false;

    // 禁用所有关联的渲染器
    for (const renderer of registration.renderers) {
      renderer.enabled = false;
    }

    // 禁用所有关联的转换器
    for (const transformer of registration.transformers) {
      transformer.enabled = false;
    }

    return true;
  }

  /**
   * 检查插件是否已启用
   * 
   * @param id - 插件 ID
   * @returns 是否已启用
   */
  isPluginEnabled(id: string): boolean {
    const registration = this.plugins.get(id);
    return registration?.enabled ?? false;
  }

  // ==========================================================================
  // 优先级管理
  // ==========================================================================

  /**
   * 设置插件优先级
   * 
   * @param id - 插件 ID
   * @param priority - 优先级
   * @returns 是否成功
   */
  setPluginPriority(id: string, priority: PluginPriority): boolean {
    const registration = this.plugins.get(id);
    if (!registration) {
      return false;
    }

    registration.priority = parsePriority(priority);
    return true;
  }

  /**
   * 获取插件优先级
   * 
   * @param id - 插件 ID
   * @returns 优先级
   */
  getPluginPriority(id: string): number | undefined {
    const registration = this.plugins.get(id);
    return registration?.priority;
  }

  /**
   * 获取按优先级排序的插件列表
   * 
   * @returns 插件列表（按优先级降序）
   */
  getPluginsByPriority(): Plugin[] {
    return this.getAllPlugins(); // getAllPlugins 已经按优先级排序
  }

  // ==========================================================================
  // 统计信息
  // ==========================================================================

  /**
   * 获取插件数量
   * 
   * @returns 插件数量
   */
  get pluginCount(): number {
    return this.plugins.size;
  }

  /**
   * 获取渲染器数量
   * 
   * @returns 渲染器数量
   */
  get rendererCount(): number {
    return this.rendererByName.size;
  }

  /**
   * 获取转换器数量
   * 
   * @returns 转换器数量
   */
  get transformerCount(): number {
    return this.transformerByName.size;
  }

  /**
   * 获取启用的插件数量
   * 
   * @returns 启用的插件数量
   */
  get enabledPluginCount(): number {
    return Array.from(this.plugins.values()).filter((r) => r.enabled).length;
  }

  // ==========================================================================
  // 清空
  // ==========================================================================

  /**
   * 清空注册表
   */
  async clear(): Promise<void> {
    // 注销所有插件
    const pluginIds = Array.from(this.plugins.keys());
    for (const id of pluginIds) {
      await this.unregister(id, { silent: true });
    }

    // 清空所有映射
    this.plugins.clear();
    this.renderers.clear();
    this.transformers.clear();
    this.rendererByName.clear();
    this.transformerByName.clear();
  }

  /**
   * 获取注册配置
   * 
   * @returns 注册配置
   */
  getConfig(): Required<PluginRegistryConfig> {
    return { ...this.config };
  }

  // ==========================================================================
  // 私有辅助方法
  // ==========================================================================

  /**
   * 检查版本兼容性
   * 
   * @param _installedVersion - 已安装版本
   * @param _requiredVersion - 要求的版本
   * @returns 是否兼容
   */
  private isVersionCompatible(
    _installedVersion: string,
    _requiredVersion: string
  ): boolean {
    // 简化版本：假设所有版本都兼容
    // 实际实现应该使用 semver 库进行版本比较
    return true;
  }
}

// =============================================================================
// 工具函数
// =============================================================================

/**
 * 创建插件注册系统实例
 * 
 * @param config - 注册配置
 * @returns 插件注册系统实例
 */
export function createPluginRegistry(
  config?: Partial<PluginRegistryConfig>
): PluginRegistry {
  return new PluginRegistry(config);
}

/**
 * 解析优先级为数值
 * 
 * @param priority - 优先级
 * @returns 数值优先级
 */
export function getPriorityValue(priority: PluginPriority): number {
  return parsePriority(priority);
}

/**
 * 比较优先级
 * 
 * @param a - 优先级 a
 * @param b - 优先级 b
 * @returns 比较结果
 */
export function comparePluginPriority(a: PluginPriority, b: PluginPriority): number {
  return comparePriority(a, b);
}

// =============================================================================
// 默认导出
// =============================================================================

export default PluginRegistry;