/**
 * 渲染缓存类型定义
 * 
 * 定义了渲染缓存系统相关的所有类型，包括缓存键、缓存项、缓存统计等
 */

/**
 * 缓存键类型
 */
export type CacheKey = string;

/**
 * 缓存值类型
 */
export type CacheValue = string;

/**
 * 缓存项
 */
export interface CacheItem<T = CacheValue> {
  /** 缓存值 */
  value: T;
  /** 缓存键 */
  key: CacheKey;
  /** 创建时间戳 */
  createdAt: number;
  /** 最后访问时间戳 */
  lastAccessedAt: number;
  /** 访问次数 */
  accessCount: number;
  /** 文件路径（用于基于文件的失效） */
  filePath?: string;
  /** 文件修改时间（用于检测文件变更） */
  fileMtime?: number;
}

/**
 * 缓存统计信息
 */
export interface CacheStatistics {
  /** 缓存命中次数 */
  hits: number;
  /** 缓存未命中次数 */
  misses: number;
  /** 总访问次数 */
  totalAccess: number;
  /** 命中率（0-1） */
  hitRate: number;
  /** 当前缓存项数量 */
  size: number;
  /** 最大缓存项数量 */
  maxSize: number;
  /** 缓存大小（字节） */
  byteSize: number;
  /** 最大缓存大小（字节） */
  maxByteSize: number;
  /** 淘汰次数 */
  evictions: number;
  /** 缓存创建时间 */
  createdAt: number;
  /** 最后更新时间 */
  lastUpdatedAt: number;
}

/**
 * 缓存配置选项
 */
export interface RenderCacheOptions {
  /** 最大缓存项数量 */
  maxSize?: number;
  /** 最大缓存大小（字节） */
  maxByteSize?: number;
  /** 缓存过期时间（毫秒） */
  ttl?: number;
  /** 是否启用基于文件的失效 */
  enableFileBasedInvalidation?: boolean;
  /** 是否启用统计 */
  enableStatistics?: boolean;
}

/**
 * 默认缓存配置
 */
export const DEFAULT_CACHE_OPTIONS: Required<RenderCacheOptions> = {
  maxSize: 1000,
  maxByteSize: 10 * 1024 * 1024, // 10MB
  ttl: 30 * 60 * 1000, // 30分钟
  enableFileBasedInvalidation: true,
  enableStatistics: true,
};

/**
 * 缓存失效原因
 */
export enum CacheInvalidationReason {
  /** 手动失效 */
  Manual = 'manual',
  /** 文件变更 */
  FileChanged = 'file_changed',
  /** 缓存过期 */
  Expired = 'expired',
  /** 容量限制 */
  CapacityLimit = 'capacity_limit',
  /** 批量失效 */
  Batch = 'batch',
}

/**
 * 缓存失效事件
 */
export interface CacheInvalidationEvent {
  /** 失效的缓存键 */
  key: CacheKey;
  /** 失效原因 */
  reason: CacheInvalidationReason;
  /** 失效时间戳 */
  timestamp: number;
  /** 失效的缓存项 */
  item?: CacheItem;
}

/**
 * 缓存事件监听器
 */
export type CacheEventListener = (event: CacheInvalidationEvent) => void;

/**
 * 缓存查询结果
 */
export interface CacheQueryResult<T = CacheValue> {
  /** 是否找到缓存 */
  found: boolean;
  /** 缓存值（如果找到） */
  value?: T;
  /** 缓存项（如果找到） */
  item?: CacheItem<T>;
  /** 是否命中 */
  hit: boolean;
}

/**
 * 缓存清理结果
 */
export interface CacheClearResult {
  /** 清理前的大小 */
  beforeSize: number;
  /** 清理前的大小（字节） */
  beforeByteSize: number;
  /** 清理后的大小 */
  afterSize: number;
  /** 清理后的大小（字节） */
  afterByteSize: number;
  /** 清理项数量 */
  clearedCount: number;
  /** 清理原因 */
  reason: string;
}

/**
 * 缓存预热结果
 */
export interface CacheWarmupResult {
  /** 预热的键数量 */
  keysCount: number;
  /** 成功数量 */
  successCount: number;
  /** 失败数量 */
  failureCount: number;
  /** 总耗时（毫秒） */
  duration: number;
}

/**
 * 缓存健康状态
 */
export interface CacheHealthStatus {
  /** 是否健康 */
  healthy: boolean;
  /** 错误信息 */
  errors: string[];
  /** 警告信息 */
  warnings: string[];
  /** 缓存利用率（0-1） */
  utilization: number;
  /** 内存利用率（0-1） */
  memoryUtilization: number;
  /** 命中率（0-1） */
  hitRate: number;
}

/**
 * 生成缓存键的参数
 */
export interface CacheKeyParams {
  /** 源内容（如 markdown） */
  source: string;
  /** 文件路径（可选） */
  filePath?: string;
  /** 渲染选项（可选） */
  options?: Record<string, unknown>;
  /** 主题配置（可选） */
  theme?: string;
  /** 其他元数据（可选） */
  metadata?: Record<string, unknown>;
}

/**
 * 缓存项元数据
 */
export interface CacheItemMetadata {
  /** 缓存键 */
  key: CacheKey;
  /** 文件路径 */
  filePath?: string;
  /** 创建时间 */
  createdAt: Date;
  /** 最后访问时间 */
  lastAccessedAt: Date;
  /** 访问次数 */
  accessCount: number;
  /** 项大小（字节） */
  size: number;
  /** 是否过期 */
  expired: boolean;
  /** 剩余 TTL（毫秒） */
  remainingTtl?: number;
}

/**
 * 批量操作结果
 */
export interface BatchOperationResult {
  /** 成功数量 */
  successCount: number;
  /** 失败数量 */
  failureCount: number;
  /** 失败的键 */
  failedKeys: CacheKey[];
  /** 总耗时（毫秒） */
  duration: number;
}