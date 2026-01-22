# 渲染缓存

渲染缓存模块为 Folder-Site CLI 提供了高效的 Markdown 渲染结果缓存功能，使用 LRU（最近最少使用）算法管理缓存。

## 功能特性

- **LRU 缓存策略**：自动管理缓存容量，淘汰最久未使用的条目
- **文件变更感知**：基于文件修改时间自动失效缓存
- **时间过期机制**：支持基于时间的缓存自动失效
- **缓存统计**：提供命中率、驱逐次数、失效次数等统计信息
- **透明集成**：可无缝集成到现有的渲染流程中

## 基本使用

### 1. 使用缓存处理器

```typescript
import { processMarkdownWithCache } from './src/server/services/processor';

// 启用缓存
const result = await processMarkdownWithCache(markdown, {
  enableCache: true,
  filePath: '/path/to/file.md',
  gfm: true,
  math: true,
  highlight: true,
});

// 检查结果是否来自缓存
if (result.metadata.cached) {
  console.log('结果来自缓存');
}
```

### 2. 管理缓存

```typescript
import {
  invalidateFileCache,
  invalidateExpiredCache,
  clearCache,
  getCacheStatistics,
} from './src/server/services/processor';

// 失效特定文件的缓存
const count = invalidateFileCache('/path/to/file.md');

// 失效所有过期的缓存
const expiredCount = invalidateExpiredCache();

// 清空所有缓存
clearCache();

// 获取缓存统计信息
const stats = getCacheStatistics();
console.log(`命中率: ${(stats.hitRate * 100).toFixed(2)}%`);
console.log(`缓存大小: ${stats.currentSize}`);
```

### 3. 使用自定义缓存配置

```typescript
import { createRenderCache, CacheWrapper } from './src/server/lib/render-cache';
import { setGlobalCacheWrapper } from './src/server/services/processor';

// 创建自定义缓存
const cache = createRenderCache({
  capacity: 200,          // 缓存容量
  enabled: true,          // 启用缓存
  maxAge: 60 * 60 * 1000, // 1小时过期
  enableStatistics: true, // 启用统计
});

// 创建缓存包装器
const wrapper = new CacheWrapper(cache, {
  enabled: true,
  maxAge: 60 * 60 * 1000,
});

// 设置为全局缓存
setGlobalCacheWrapper(wrapper);
```

## API 文档

### RenderCache 类

```typescript
class RenderCache<K, V> {
  // 构造函数
  constructor(capacity: number = 100);

  // 生成缓存键
  static generateKey(filePath: string, options: Record<string, unknown>): string;

  // 获取缓存值
  get(key: K): V | undefined;

  // 设置缓存值
  set(key: K, value: V, filePath: string, fileMtime: number): void;

  // 删除缓存值
  delete(key: K): boolean;

  // 基于文件路径失效缓存
  invalidateByFile(filePath: string, currentMtime?: number): number;

  // 基于时间失效缓存
  invalidateByAge(maxAge: number): number;

  // 清空所有缓存
  clear(): void;

  // 获取缓存统计信息
  getStatistics(): CacheStatistics;

  // 获取缓存大小
  size(): number;

  // 检查键是否存在
  has(key: K): boolean;

  // 获取所有键
  keys(): K[];

  // 获取所有值
  values(): V[];

  // 重置统计信息
  resetStatistics(): void;
}
```

### CacheWrapper 类

```typescript
class CacheWrapper {
  // 构造函数
  constructor(
    cache: RenderCache<string, CacheEntry>,
    config: CacheConfig = {}
  );

  // 获取缓存
  get(filePath: string, options?: Record<string, unknown>): CacheEntry | undefined;

  // 设置缓存
  set(
    filePath: string,
    html: string,
    metadata: CacheEntry['metadata'],
    fileMtime: number,
    options?: Record<string, unknown>
  ): void;

  // 失效文件缓存
  invalidate(filePath: string, currentMtime?: number): number;

  // 失效过期缓存
  invalidateExpired(): number;

  // 清空缓存
  clear(): void;

  // 获取统计信息
  getStatistics(): CacheStatistics;

  // 重置统计信息
  resetStatistics(): void;

  // 获取缓存大小
  size(): number;
}
```

### 类型定义

```typescript
// 缓存条目
interface CacheEntry {
  html: string;
  metadata: {
    codeBlocks: number;
    mathExpressions: number;
    processingTime: number;
  };
  cachedAt: number;
}

// 缓存统计信息
interface CacheStatistics {
  hits: number;           // 命中次数
  misses: number;         // 未命中次数
  evictions: number;      // 驱逐次数
  invalidations: number;  // 失效次数
  currentSize: number;    // 当前缓存大小
  totalSize: number;      // 总缓存大小（历史）
  hitRate?: number;       // 命中率 (0-1)
}

// 缓存配置
interface CacheConfig {
  capacity?: number;           // 缓存容量
  enabled?: boolean;           // 是否启用缓存
  maxAge?: number;             // 最大缓存时间（毫秒）
  enableStatistics?: boolean;  // 是否启用统计
}
```

## 配置选项

### 默认配置

```typescript
const DEFAULT_CACHE_CONFIG: CacheConfig = {
  capacity: 100,               // 默认缓存 100 个条目
  enabled: true,               // 默认启用
  maxAge: 30 * 60 * 1000,      // 30 分钟过期
  enableStatistics: true,      // 启用统计
};
```

### 缓存容量建议

- **小型项目**：50-100 个条目
- **中型项目**：100-200 个条目
- **大型项目**：200-500 个条目

### 缓存过期时间建议

- **开发环境**：5-10 分钟（频繁修改）
- **生产环境**：30-60 分钟（较少修改）
- **静态站点**：1-24 小时（极少修改）

## 性能优化

### 1. 缓存预热

在应用启动时预加载常用文件：

```typescript
import { processMarkdownWithCache } from './src/server/services/processor';

async function warmupCache(files: string[]) {
  for (const file of files) {
    const content = await readFile(file);
    await processMarkdownWithCache(content, {
      enableCache: true,
      filePath: file,
    });
  }
}
```

### 2. 定期清理过期缓存

```typescript
import { invalidateExpiredCache } from './src/server/services/processor';

// 每小时清理一次过期缓存
setInterval(() => {
  const count = invalidateExpiredCache();
  console.log(`清理了 ${count} 个过期缓存条目`);
}, 60 * 60 * 1000);
```

### 3. 监控缓存命中率

```typescript
import { getCacheStatistics } from './src/server/services/processor';

setInterval(() => {
  const stats = getCacheStatistics();
  const hitRate = (stats.hitRate || 0) * 100;

  if (hitRate < 50) {
    console.warn('缓存命中率较低，考虑增加缓存容量');
  }

  console.log(`缓存命中率: ${hitRate.toFixed(2)}%`);
  console.log(`缓存大小: ${stats.currentSize}/${stats.totalSize}`);
}, 5 * 60 * 1000);
```

## 注意事项

1. **文件路径**：使用绝对路径作为缓存键的一部分，确保唯一性
2. **内存使用**：缓存会占用内存，根据服务器配置调整容量
3. **并发安全**：当前实现不是线程安全的，如需并发访问请自行加锁
4. **缓存一致性**：文件修改后需要手动失效缓存，或等待过期
5. **统计精度**：命中率计算基于累计数据，重置后重新计算

## 故障排除

### 缓存不生效

1. 检查 `enableCache` 选项是否为 `true`
2. 确认提供了 `filePath` 参数
3. 检查缓存容量是否为 0

### 缓存未失效

1. 确认文件修改时间（mtime）已更新
2. 检查 `invalidateByFile` 是否正确调用
3. 手动调用 `clearCache()` 清空所有缓存

### 命中率过低

1. 增加缓存容量
2. 延长缓存过期时间
3. 检查是否有频繁的缓存失效操作

## 相关文件

- `src/types/render-cache.ts` - 类型定义
- `src/server/lib/render-cache.ts` - 缓存实现
- `src/server/services/processor.ts` - 处理器集成
- `tests/render-cache.test.ts` - 单元测试