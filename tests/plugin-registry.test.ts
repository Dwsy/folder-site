/**
 * 插件注册系统单元测试
 * 
 * 测试插件注册系统的所有功能：
 * - 插件注册与注销
 * - 渲染器注册与注销
 * - 转换器注册与注销
 * - 冲突检测机制
 * - 优先级系统
 * - 插件启用/禁用
 * - 生命周期钩子
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import type { Plugin, PluginManifest } from '../src/types/plugin.js';
import { PluginRegistry } from '../src/server/lib/plugin-registry.js';
import {
  parsePriority,
  comparePriority,
  getPriorityValue,
  comparePluginPriority,
  createPluginRegistry,
  type PluginPriority,
  type RendererPlugin,
  type TransformerPlugin,
  type PluginConflict,
  type ConflictDetectionResult,
} from '../src/server/lib/plugin-registry.js';
import {
  PluginCapabilityType,
  PluginStatus as Status,
} from '../src/types/plugin.js';

// =============================================================================
// 测试辅助函数
// =============================================================================

/**
 * 创建模拟插件清单
 */
function createMockManifest(
  id: string,
  name: string,
  capabilities: Array<{ type: string; name: string }>
): PluginManifest {
  return {
    id,
    name,
    version: '1.0.0',
    entry: 'index.js',
    capabilities: capabilities as any,
  };
}

/**
 * 创建模拟插件
 */
function createMockPlugin(
  manifest: PluginManifest,
  status: Status = Status.Active
): Plugin {
  return {
    id: manifest.id,
    name: manifest.name,
    version: manifest.version,
    manifest,
    status,
    initialize: async () => {},
    activate: async () => {},
    deactivate: async () => {},
    dispose: async () => {},
  };
}

/**
 * 创建模拟渲染器
 */
function createMockRenderer(
  name: string,
  extensions: string[],
  pluginId: string,
  priority?: PluginPriority
): RendererPlugin {
  return {
    name,
    extensions,
    render: async () => 'rendered content',
    version: '1.0.0',
    priority,
    pluginId,
  };
}

/**
 * 创建模拟转换器
 */
function createMockTransformer(
  name: string,
  inputType: string,
  outputType: string,
  pluginId: string,
  priority?: PluginPriority
): TransformerPlugin {
  return {
    name,
    inputType,
    outputType,
    transform: async (content) => content,
    version: '1.0.0',
    priority,
    pluginId,
  };
}

// =============================================================================
// 优先级系统测试
// =============================================================================

describe('PluginRegistry - Priority System', () => {
  it('should parse string priorities correctly', () => {
    expect(parsePriority('high')).toBe(100);
    expect(parsePriority('normal')).toBe(50);
    expect(parsePriority('low')).toBe(10);
  });

  it('should parse numeric priorities correctly', () => {
    expect(parsePriority(0)).toBe(0);
    expect(parsePriority(50)).toBe(50);
    expect(parsePriority(100)).toBe(100);
    expect(parsePriority(500)).toBe(500);
  });

  it('should clamp numeric priorities to valid range', () => {
    expect(parsePriority(-10)).toBe(0);
    expect(parsePriority(1500)).toBe(1000);
  });

  it('should compare priorities correctly', () => {
    expect(comparePriority('high', 'normal')).toBe(50);
    expect(comparePriority('normal', 'low')).toBe(40);
    expect(comparePriority('high', 'low')).toBe(90);
    expect(comparePriority('normal', 'normal')).toBe(0);
  });

  it('should compare numeric priorities correctly', () => {
    expect(comparePriority(100, 50)).toBe(50);
    expect(comparePriority(50, 100)).toBe(-50);
    expect(comparePriority(75, 75)).toBe(0);
  });

  it('should compare mixed priorities correctly', () => {
    expect(comparePriority('high', 75)).toBe(25);
    expect(comparePriority(75, 'normal')).toBe(25);
  });
});

describe('getPriorityValue', () => {
  it('should return correct priority value', () => {
    expect(getPriorityValue('high')).toBe(100);
    expect(getPriorityValue(75)).toBe(75);
  });
});

describe('comparePluginPriority', () => {
  it('should compare plugin priorities correctly', () => {
    expect(comparePluginPriority('high', 'normal')).toBe(50);
    expect(comparePluginPriority('normal', 'high')).toBe(-50);
  });
});

// =============================================================================
// 插件注册与注销测试
// =============================================================================

describe('PluginRegistry - Plugin Registration', () => {
  let registry: PluginRegistry;

  beforeEach(() => {
    registry = new PluginRegistry();
  });

  afterEach(async () => {
    await registry.clear();
  });

  it('should register a plugin successfully', async () => {
    const manifest = createMockManifest('test-plugin', 'Test Plugin', [
      { type: PluginCapabilityType.Renderer, name: 'test-renderer' },
    ]);
    const plugin = createMockPlugin(manifest);

    const result = await registry.register(plugin);

    expect(result.success).toBe(true);
    expect(registry.hasPlugin('test-plugin')).toBe(true);
    expect(registry.getPlugin('test-plugin')).toBe(plugin);
  });

  it('should register multiple plugins', async () => {
    const plugin1 = createMockPlugin(
      createMockManifest('plugin-1', 'Plugin 1', [
        { type: PluginCapabilityType.Renderer, name: 'renderer-1' },
      ])
    );
    const plugin2 = createMockPlugin(
      createMockManifest('plugin-2', 'Plugin 2', [
        { type: PluginCapabilityType.Transformer, name: 'transformer-1' },
      ])
    );

    await registry.register(plugin1);
    await registry.register(plugin2);

    expect(registry.pluginCount).toBe(2);
    expect(registry.hasPlugin('plugin-1')).toBe(true);
    expect(registry.hasPlugin('plugin-2')).toBe(true);
  });

  it('should unregister a plugin successfully', async () => {
    const plugin = createMockPlugin(
      createMockManifest('test-plugin', 'Test Plugin', [])
    );

    await registry.register(plugin);
    expect(registry.hasPlugin('test-plugin')).toBe(true);

    const result = await registry.unregister('test-plugin');
    expect(result).toBe(true);
    expect(registry.hasPlugin('test-plugin')).toBe(false);
  });

  it('should return false when unregistering non-existent plugin', async () => {
    const result = await registry.unregister('non-existent');
    expect(result).toBe(false);
  });

  it('should get all plugins', async () => {
    const plugin1 = createMockPlugin(
      createMockManifest('plugin-1', 'Plugin 1', [])
    );
    const plugin2 = createMockPlugin(
      createMockManifest('plugin-2', 'Plugin 2', [])
    );

    await registry.register(plugin1);
    await registry.register(plugin2);

    const plugins = registry.getAllPlugins();
    expect(plugins).toHaveLength(2);
    expect(plugins.map((p) => p.id)).toContain('plugin-1');
    expect(plugins.map((p) => p.id)).toContain('plugin-2');
  });

  it('should get plugin by ID', async () => {
    const plugin = createMockPlugin(
      createMockManifest('test-plugin', 'Test Plugin', [])
    );

    await registry.register(plugin);

    const retrieved = registry.getPlugin('test-plugin');
    expect(retrieved).toBe(plugin);
  });

  it('should return undefined for non-existent plugin', () => {
    const retrieved = registry.getPlugin('non-existent');
    expect(retrieved).toBeUndefined();
  });

  it('should get plugins by status', async () => {
    const activePlugin = createMockPlugin(
      createMockManifest('active-plugin', 'Active Plugin', []),
      Status.Active
    );
    const inactivePlugin = createMockPlugin(
      createMockManifest('inactive-plugin', 'Inactive Plugin', []),
      Status.Inactive
    );

    await registry.register(activePlugin);
    await registry.register(inactivePlugin);

    const activePlugins = registry.getPluginsByStatus(Status.Active);
    expect(activePlugins).toHaveLength(1);
    expect(activePlugins[0].id).toBe('active-plugin');
  });

  it('should get plugins by capability', async () => {
    const rendererPlugin = createMockPlugin(
      createMockManifest('renderer-plugin', 'Renderer Plugin', [
        { type: PluginCapabilityType.Renderer, name: 'renderer' },
      ])
    );
    const transformerPlugin = createMockPlugin(
      createMockManifest('transformer-plugin', 'Transformer Plugin', [
        { type: PluginCapabilityType.Transformer, name: 'transformer' },
      ])
    );

    await registry.register(rendererPlugin);
    await registry.register(transformerPlugin);

    const rendererPlugins = registry.getPluginsByCapability(
      PluginCapabilityType.Renderer
    );
    expect(rendererPlugins).toHaveLength(1);
    expect(rendererPlugins[0].id).toBe('renderer-plugin');
  });

  it('should respect max plugin limit', async () => {
    const registry = new PluginRegistry({ maxPlugins: 2 });

    const plugin1 = createMockPlugin(
      createMockManifest('plugin-1', 'Plugin 1', [])
    );
    const plugin2 = createMockPlugin(
      createMockManifest('plugin-2', 'Plugin 2', [])
    );
    const plugin3 = createMockPlugin(
      createMockManifest('plugin-3', 'Plugin 3', [])
    );

    await registry.register(plugin1);
    await registry.register(plugin2);

    await expect(registry.register(plugin3)).rejects.toThrow();
  });
});

// =============================================================================
// 冲突检测测试
// =============================================================================

describe('PluginRegistry - Conflict Detection', () => {
  let registry: PluginRegistry;

  beforeEach(() => {
    registry = new PluginRegistry({ autoDetectConflicts: true });
  });

  afterEach(async () => {
    await registry.clear();
  });

  it('should detect duplicate plugin ID', async () => {
    const plugin1 = createMockPlugin(
      createMockManifest('duplicate-id', 'Plugin 1', [])
    );
    const plugin2 = createMockPlugin(
      createMockManifest('duplicate-id', 'Plugin 2', [])
    );

    await registry.register(plugin1);
    const result = await registry.register(plugin2);

    expect(result.success).toBe(false);
    expect(result.conflict).toBeDefined();
    expect(result.conflict?.type).toBe('duplicate_id');
  });

  it('should detect conflict using detectConflicts method', async () => {
    const existingPlugin = createMockPlugin(
      createMockManifest('existing', 'Existing Plugin', [
        { type: PluginCapabilityType.Renderer, name: 'shared-renderer' },
      ])
    );

    await registry.register(existingPlugin);

    const newPlugin = createMockPlugin(
      createMockManifest('new', 'New Plugin', [
        { type: PluginCapabilityType.Renderer, name: 'shared-renderer' },
      ])
    );

    // 注册渲染器到现有插件
    await registry.registerRenderer(
      createMockRenderer('shared-renderer', ['.md'], 'existing'),
      'existing'
    );

    const conflictResult = registry.detectConflicts(newPlugin);

    expect(conflictResult.hasConflicts).toBe(true);
    expect(conflictResult.conflicts.length).toBeGreaterThan(0);
    expect(conflictResult.conflicts[0].type).toBe('duplicate_capability');
  });

  it('should detect duplicate capability names', async () => {
    const plugin1 = createMockPlugin(
      createMockManifest('plugin-1', 'Plugin 1', [
        { type: PluginCapabilityType.Renderer, name: 'shared-name' },
      ])
    );
    const plugin2 = createMockPlugin(
      createMockManifest('plugin-2', 'Plugin 2', [
        { type: PluginCapabilityType.Renderer, name: 'shared-name' },
      ])
    );

    await registry.register(plugin1);

    // 注册渲染器
    await registry.registerRenderer(
      createMockRenderer('shared-name', ['.md'], 'plugin-1'),
      'plugin-1'
    );

    const result = await registry.register(plugin2);

    expect(result.success).toBe(false);
    expect(result.conflict?.type).toBe('duplicate_capability');
  });

  it('should allow override when configured', async () => {
    const registry = new PluginRegistry({
      conflictResolution: 'override',
      autoDetectConflicts: true,
    });

    const plugin1 = createMockPlugin(
      createMockManifest('override-test', 'Plugin 1', [])
    );
    const plugin2 = createMockPlugin(
      createMockManifest('override-test', 'Plugin 2', [])
    );

    await registry.register(plugin1);
    const result = await registry.register(plugin2);

    expect(result.success).toBe(true);
    expect(registry.getPlugin('override-test')).toBe(plugin2);
  });

  it('should return canRegister based on resolvable conflicts', async () => {
    const existingPlugin = createMockPlugin(
      createMockManifest('existing', 'Existing Plugin', [
        { type: PluginCapabilityType.Renderer, name: 'renderer' },
      ])
    );

    await registry.register(existingPlugin);

    const newPlugin = createMockPlugin(
      createMockManifest('new', 'New Plugin', [
        { type: PluginCapabilityType.Renderer, name: 'renderer' },
      ])
    );

    const conflictResult = registry.detectConflicts(newPlugin);

    expect(conflictResult.canRegister).toBe(true);
  });

  it('should include suggestion in conflict', async () => {
    const plugin1 = createMockPlugin(
      createMockManifest('conflict-test', 'Plugin 1', [])
    );
    const plugin2 = createMockPlugin(
      createMockManifest('conflict-test', 'Plugin 2', [])
    );

    await registry.register(plugin1);
    const result = await registry.register(plugin2);

    expect(result.conflict?.suggestion).toBeDefined();
    expect(typeof result.conflict?.suggestion).toBe('string');
  });
});

// =============================================================================
// 渲染器注册与注销测试
// =============================================================================

describe('PluginRegistry - Renderer Registration', () => {
  let registry: PluginRegistry;
  let plugin: Plugin;

  beforeEach(async () => {
    registry = new PluginRegistry();
    plugin = createMockPlugin(
      createMockManifest('test-plugin', 'Test Plugin', [])
    );
    await registry.register(plugin);
  });

  afterEach(async () => {
    await registry.clear();
  });

  it('should register a renderer successfully', async () => {
    const renderer = createMockRenderer('test-renderer', ['.md'], 'test-plugin');

    const result = await registry.registerRenderer(renderer, 'test-plugin');

    expect(result.success).toBe(true);
    expect(registry.hasRenderer('test-renderer')).toBe(true);
    expect(registry.getRenderer('test-renderer')).toBe(renderer);
  });

  it('should detect duplicate renderer name', async () => {
    const renderer1 = createMockRenderer('duplicate', ['.md'], 'test-plugin');
    const renderer2 = createMockRenderer('duplicate', ['.html'], 'test-plugin');

    await registry.registerRenderer(renderer1, 'test-plugin');
    const result = await registry.registerRenderer(renderer2, 'test-plugin');

    expect(result.success).toBe(false);
    expect(result.conflict?.type).toBe('duplicate_capability');
  });

  it('should get renderer by extension', async () => {
    const renderer = createMockRenderer('md-renderer', ['.md', '.markdown'], 'test-plugin');

    await registry.registerRenderer(renderer, 'test-plugin');

    const retrieved = registry.getRenderer('.md');
    expect(retrieved).toBe(renderer);
  });

  it('should get all renderers', async () => {
    const renderer1 = createMockRenderer('renderer-1', ['.md'], 'test-plugin');
    const renderer2 = createMockRenderer('renderer-2', ['.html'], 'test-plugin');

    await registry.registerRenderer(renderer1, 'test-plugin');
    await registry.registerRenderer(renderer2, 'test-plugin');

    const renderers = registry.getAllRenderers();
    expect(renderers).toHaveLength(2);
    expect(renderers.map((r) => r.name)).toContain('renderer-1');
    expect(renderers.map((r) => r.name)).toContain('renderer-2');
  });

  it('should get renderers by extension with priority order', async () => {
    const lowPriorityRenderer = createMockRenderer(
      'low-priority',
      ['.md'],
      'test-plugin',
      'low'
    );
    const highPriorityRenderer = createMockRenderer(
      'high-priority',
      ['.md'],
      'test-plugin',
      'high'
    );

    await registry.registerRenderer(lowPriorityRenderer, 'test-plugin');
    await registry.registerRenderer(highPriorityRenderer, 'test-plugin');

    const renderers = registry.getRenderersByExtension('.md');
    expect(renderers).toHaveLength(2);
    expect(renderers[0].name).toBe('high-priority'); // High priority first
    expect(renderers[1].name).toBe('low-priority');
  });

  it('should unregister a renderer successfully', async () => {
    const renderer = createMockRenderer('test-renderer', ['.md'], 'test-plugin');

    await registry.registerRenderer(renderer, 'test-plugin');
    expect(registry.hasRenderer('test-renderer')).toBe(true);

    const result = await registry.unregisterRenderer('test-renderer');
    expect(result).toBe(true);
    expect(registry.hasRenderer('test-renderer')).toBe(false);
  });

  it('should return false when unregistering non-existent renderer', async () => {
    const result = await registry.unregisterRenderer('non-existent');
    expect(result).toBe(false);
  });

  it('should fail to register renderer for non-existent plugin', async () => {
    const renderer = createMockRenderer('test-renderer', ['.md'], 'non-existent');

    await expect(
      registry.registerRenderer(renderer, 'non-existent')
    ).rejects.toThrow();
  });

  it('should normalize extension names', async () => {
    const renderer = createMockRenderer('test-renderer', ['md'], 'test-plugin');

    await registry.registerRenderer(renderer, 'test-plugin');

    expect(registry.getRenderer('.md')).toBeDefined();
    expect(registry.getRenderer('md')).toBeDefined();
  });
});

// =============================================================================
// 转换器注册与注销测试
// =============================================================================

describe('PluginRegistry - Transformer Registration', () => {
  let registry: PluginRegistry;
  let plugin: Plugin;

  beforeEach(async () => {
    registry = new PluginRegistry();
    plugin = createMockPlugin(
      createMockManifest('test-plugin', 'Test Plugin', [])
    );
    await registry.register(plugin);
  });

  afterEach(async () => {
    await registry.clear();
  });

  it('should register a transformer successfully', async () => {
    const transformer = createMockTransformer(
      'test-transformer',
      'markdown',
      'html',
      'test-plugin'
    );

    const result = await registry.registerTransformer(transformer, 'test-plugin');

    expect(result.success).toBe(true);
    expect(registry.hasTransformer('test-transformer')).toBe(true);
    expect(registry.getTransformer('test-transformer')).toBe(transformer);
  });

  it('should detect duplicate transformer name', async () => {
    const transformer1 = createMockTransformer(
      'duplicate',
      'markdown',
      'html',
      'test-plugin'
    );
    const transformer2 = createMockTransformer(
      'duplicate',
      'html',
      'markdown',
      'test-plugin'
    );

    await registry.registerTransformer(transformer1, 'test-plugin');
    const result = await registry.registerTransformer(transformer2, 'test-plugin');

    expect(result.success).toBe(false);
    expect(result.conflict?.type).toBe('duplicate_capability');
  });

  it('should get all transformers', async () => {
    const transformer1 = createMockTransformer(
      'transformer-1',
      'markdown',
      'html',
      'test-plugin'
    );
    const transformer2 = createMockTransformer(
      'transformer-2',
      'html',
      'markdown',
      'test-plugin'
    );

    await registry.registerTransformer(transformer1, 'test-plugin');
    await registry.registerTransformer(transformer2, 'test-plugin');

    const transformers = registry.getAllTransformers();
    expect(transformers).toHaveLength(2);
    expect(transformers.map((t) => t.name)).toContain('transformer-1');
    expect(transformers.map((t) => t.name)).toContain('transformer-2');
  });

  it('should get transformers by input type with priority order', async () => {
    const lowPriorityTransformer = createMockTransformer(
      'low-priority',
      'markdown',
      'html',
      'test-plugin',
      'low'
    );
    const highPriorityTransformer = createMockTransformer(
      'high-priority',
      'markdown',
      'html',
      'test-plugin',
      'high'
    );

    await registry.registerTransformer(lowPriorityTransformer, 'test-plugin');
    await registry.registerTransformer(highPriorityTransformer, 'test-plugin');

    const transformers = registry.getTransformersByInputType('markdown');
    expect(transformers).toHaveLength(2);
    expect(transformers[0].name).toBe('high-priority');
    expect(transformers[1].name).toBe('low-priority');
  });

  it('should unregister a transformer successfully', async () => {
    const transformer = createMockTransformer(
      'test-transformer',
      'markdown',
      'html',
      'test-plugin'
    );

    await registry.registerTransformer(transformer, 'test-plugin');
    expect(registry.hasTransformer('test-transformer')).toBe(true);

    const result = await registry.unregisterTransformer('test-transformer');
    expect(result).toBe(true);
    expect(registry.hasTransformer('test-transformer')).toBe(false);
  });

  it('should return false when unregistering non-existent transformer', async () => {
    const result = await registry.unregisterTransformer('non-existent');
    expect(result).toBe(false);
  });

  it('should fail to register transformer for non-existent plugin', async () => {
    const transformer = createMockTransformer(
      'test-transformer',
      'markdown',
      'html',
      'non-existent'
    );

    await expect(
      registry.registerTransformer(transformer, 'non-existent')
    ).rejects.toThrow();
  });
});

// =============================================================================
// 插件启用/禁用测试
// =============================================================================

describe('PluginRegistry - Enable/Disable Plugins', () => {
  let registry: PluginRegistry;

  beforeEach(async () => {
    registry = new PluginRegistry();
  });

  afterEach(async () => {
    await registry.clear();
  });

  it('should enable a plugin', async () => {
    const plugin = createMockPlugin(
      createMockManifest('test-plugin', 'Test Plugin', [])
    );

    await registry.register(plugin, { enabled: false });
    registry.disablePlugin('test-plugin');
    expect(registry.isPluginEnabled('test-plugin')).toBe(false);

    registry.enablePlugin('test-plugin');
    expect(registry.isPluginEnabled('test-plugin')).toBe(true);
  });

  it('should disable a plugin', async () => {
    const plugin = createMockPlugin(
      createMockManifest('test-plugin', 'Test Plugin', [])
    );

    await registry.register(plugin);
    expect(registry.isPluginEnabled('test-plugin')).toBe(true);

    const result = registry.disablePlugin('test-plugin');
    expect(result).toBe(true);
    expect(registry.isPluginEnabled('test-plugin')).toBe(false);
  });

  it('should return false when enabling non-existent plugin', () => {
    const result = registry.enablePlugin('non-existent');
    expect(result).toBe(false);
  });

  it('should return false when disabling non-existent plugin', () => {
    const result = registry.disablePlugin('non-existent');
    expect(result).toBe(false);
  });

  it('should disable associated renderers when disabling plugin', async () => {
    const plugin = createMockPlugin(
      createMockManifest('test-plugin', 'Test Plugin', [])
    );

    await registry.register(plugin);
    const renderer = createMockRenderer('test-renderer', ['.md'], 'test-plugin');
    await registry.registerRenderer(renderer, 'test-plugin');

    expect(registry.getRenderer('test-renderer')).toBeDefined();

    registry.disablePlugin('test-plugin');
    expect(registry.getRenderer('test-renderer')).toBeUndefined();
  });

  it('should disable associated transformers when disabling plugin', async () => {
    const plugin = createMockPlugin(
      createMockManifest('test-plugin', 'Test Plugin', [])
    );

    await registry.register(plugin);
    const transformer = createMockTransformer(
      'test-transformer',
      'markdown',
      'html',
      'test-plugin'
    );
    await registry.registerTransformer(transformer, 'test-plugin');

    expect(registry.getTransformer('test-transformer')).toBeDefined();

    registry.disablePlugin('test-plugin');
    expect(registry.getTransformer('test-transformer')).toBeUndefined();
  });

  it('should get enabled plugin count', async () => {
    const plugin1 = createMockPlugin(
      createMockManifest('plugin-1', 'Plugin 1', [])
    );
    const plugin2 = createMockPlugin(
      createMockManifest('plugin-2', 'Plugin 2', [])
    );

    await registry.register(plugin1);
    await registry.register(plugin2);

    expect(registry.enabledPluginCount).toBe(2);

    registry.disablePlugin('plugin-1');
    expect(registry.enabledPluginCount).toBe(1);
  });
});

// =============================================================================
// 优先级管理测试
// =============================================================================

describe('PluginRegistry - Priority Management', () => {
  let registry: PluginRegistry;

  beforeEach(async () => {
    registry = new PluginRegistry();
  });

  afterEach(async () => {
    await registry.clear();
  });

  it('should set plugin priority', async () => {
    const plugin = createMockPlugin(
      createMockManifest('test-plugin', 'Test Plugin', [])
    );

    await registry.register(plugin);

    const result = registry.setPluginPriority('test-plugin', 'high');
    expect(result).toBe(true);
    expect(registry.getPluginPriority('test-plugin')).toBe(100);
  });

  it('should get plugin priority', async () => {
    const plugin = createMockPlugin(
      createMockManifest('test-plugin', 'Test Plugin', [])
    );

    await registry.register(plugin, { priority: 'high' });

    const priority = registry.getPluginPriority('test-plugin');
    expect(priority).toBe(100);
  });

  it('should return undefined for non-existent plugin priority', () => {
    const priority = registry.getPluginPriority('non-existent');
    expect(priority).toBeUndefined();
  });

  it('should return false when setting priority for non-existent plugin', () => {
    const result = registry.setPluginPriority('non-existent', 'high');
    expect(result).toBe(false);
  });

  it('should get plugins sorted by priority', async () => {
    const lowPriorityPlugin = createMockPlugin(
      createMockManifest('low-priority', 'Low Priority Plugin', [])
    );
    const highPriorityPlugin = createMockPlugin(
      createMockManifest('high-priority', 'High Priority Plugin', [])
    );
    const normalPriorityPlugin = createMockPlugin(
      createMockManifest('normal-priority', 'Normal Priority Plugin', [])
    );

    await registry.register(lowPriorityPlugin, { priority: 'low' });
    await registry.register(normalPriorityPlugin, { priority: 'normal' });
    await registry.register(highPriorityPlugin, { priority: 'high' });

    const sortedPlugins = registry.getPluginsByPriority();
    expect(sortedPlugins[0].id).toBe('high-priority');
    expect(sortedPlugins[1].id).toBe('normal-priority');
    expect(sortedPlugins[2].id).toBe('low-priority');
  });

  it('should maintain registration order for same priority plugins', async () => {
    const plugin1 = createMockPlugin(
      createMockManifest('plugin-1', 'Plugin 1', [])
    );
    const plugin2 = createMockPlugin(
      createMockManifest('plugin-2', 'Plugin 2', [])
    );

    await registry.register(plugin1, { priority: 'normal' });
    await registry.register(plugin2, { priority: 'normal' });

    const sortedPlugins = registry.getPluginsByPriority();
    expect(sortedPlugins[0].id).toBe('plugin-1');
    expect(sortedPlugins[1].id).toBe('plugin-2');
  });
});

// =============================================================================
// 统计信息测试
// =============================================================================

describe('PluginRegistry - Statistics', () => {
  let registry: PluginRegistry;

  beforeEach(async () => {
    registry = new PluginRegistry();
  });

  afterEach(async () => {
    await registry.clear();
  });

  it('should return plugin count', async () => {
    const plugin1 = createMockPlugin(
      createMockManifest('plugin-1', 'Plugin 1', [])
    );
    const plugin2 = createMockPlugin(
      createMockManifest('plugin-2', 'Plugin 2', [])
    );

    await registry.register(plugin1);
    await registry.register(plugin2);

    expect(registry.pluginCount).toBe(2);
  });

  it('should return renderer count', async () => {
    const plugin = createMockPlugin(
      createMockManifest('test-plugin', 'Test Plugin', [])
    );

    await registry.register(plugin);
    await registry.registerRenderer(
      createMockRenderer('renderer-1', ['.md'], 'test-plugin'),
      'test-plugin'
    );
    await registry.registerRenderer(
      createMockRenderer('renderer-2', ['.html'], 'test-plugin'),
      'test-plugin'
    );

    expect(registry.rendererCount).toBe(2);
  });

  it('should return transformer count', async () => {
    const plugin = createMockPlugin(
      createMockManifest('test-plugin', 'Test Plugin', [])
    );

    await registry.register(plugin);
    await registry.registerTransformer(
      createMockTransformer('transformer-1', 'markdown', 'html', 'test-plugin'),
      'test-plugin'
    );
    await registry.registerTransformer(
      createMockTransformer('transformer-2', 'html', 'markdown', 'test-plugin'),
      'test-plugin'
    );

    expect(registry.transformerCount).toBe(2);
  });

  it('should return enabled plugin count', async () => {
    const plugin1 = createMockPlugin(
      createMockManifest('plugin-1', 'Plugin 1', [])
    );
    const plugin2 = createMockPlugin(
      createMockManifest('plugin-2', 'Plugin 2', [])
    );

    await registry.register(plugin1);
    await registry.register(plugin2, { enabled: false });

    expect(registry.enabledPluginCount).toBe(1);
  });
});

// =============================================================================
// 清空测试
// =============================================================================

describe('PluginRegistry - Clear', () => {
  it('should clear all registered items', async () => {
    const registry = new PluginRegistry();

    const plugin = createMockPlugin(
      createMockManifest('test-plugin', 'Test Plugin', [])
    );

    await registry.register(plugin);
    await registry.registerRenderer(
      createMockRenderer('test-renderer', ['.md'], 'test-plugin'),
      'test-plugin'
    );
    await registry.registerTransformer(
      createMockTransformer('test-transformer', 'markdown', 'html', 'test-plugin'),
      'test-plugin'
    );

    expect(registry.pluginCount).toBe(1);
    expect(registry.rendererCount).toBe(1);
    expect(registry.transformerCount).toBe(1);

    await registry.clear();

    expect(registry.pluginCount).toBe(0);
    expect(registry.rendererCount).toBe(0);
    expect(registry.transformerCount).toBe(0);
  });
});

// =============================================================================
// 工厂函数测试
// =============================================================================

describe('createPluginRegistry', () => {
  it('should create a plugin registry with default config', () => {
    const registry = createPluginRegistry();

    expect(registry).toBeInstanceOf(PluginRegistry);
    const config = registry.getConfig();
    expect(config.conflictResolution).toBe('error');
    expect(config.defaultPriority).toBe('normal');
  });

  it('should create a plugin registry with custom config', () => {
    const registry = createPluginRegistry({
      conflictResolution: 'override',
      defaultPriority: 'high',
      maxPlugins: 50,
    });

    const config = registry.getConfig();
    expect(config.conflictResolution).toBe('override');
    expect(config.defaultPriority).toBe('high');
    expect(config.maxPlugins).toBe(50);
  });
});

// =============================================================================
// 配置测试
// =============================================================================

describe('PluginRegistry - Configuration', () => {
  it('should get registry configuration', () => {
    const registry = new PluginRegistry({
      conflictResolution: 'override',
      defaultPriority: 'high',
      autoDetectConflicts: false,
      enablePlugins: false,
      maxPlugins: 10,
      allowOverride: true,
    });

    const config = registry.getConfig();

    expect(config.conflictResolution).toBe('override');
    expect(config.defaultPriority).toBe('high');
    expect(config.autoDetectConflicts).toBe(false);
    expect(config.enablePlugins).toBe(false);
    expect(config.maxPlugins).toBe(10);
    expect(config.allowOverride).toBe(true);
  });

  it('should allow renderer override when configured', async () => {
    const registry = new PluginRegistry({ allowOverride: true });

    const plugin = createMockPlugin(
      createMockManifest('test-plugin', 'Test Plugin', [])
    );

    await registry.register(plugin);
    await registry.registerRenderer(
      createMockRenderer('test-renderer', ['.md'], 'test-plugin'),
      'test-plugin'
    );

    const result = await registry.registerRenderer(
      createMockRenderer('test-renderer', ['.md'], 'test-plugin'),
      'test-plugin'
    );

    expect(result.success).toBe(true);
  });

  it('should allow transformer override when configured', async () => {
    const registry = new PluginRegistry({ allowOverride: true });

    const plugin = createMockPlugin(
      createMockManifest('test-plugin', 'Test Plugin', [])
    );

    await registry.register(plugin);
    await registry.registerTransformer(
      createMockTransformer('test-transformer', 'markdown', 'html', 'test-plugin'),
      'test-plugin'
    );

    const result = await registry.registerTransformer(
      createMockTransformer('test-transformer', 'markdown', 'html', 'test-plugin'),
      'test-plugin'
    );

    expect(result.success).toBe(true);
  });
});

// =============================================================================
// 集成测试
// =============================================================================

describe('PluginRegistry - Integration Tests', () => {
  it('should handle complete plugin lifecycle', async () => {
    const registry = new PluginRegistry();

    // 1. 注册插件
    const plugin = createMockPlugin(
      createMockManifest('lifecycle-test', 'Lifecycle Test Plugin', [
        { type: PluginCapabilityType.Renderer, name: 'md-renderer' },
        { type: PluginCapabilityType.Transformer, name: 'md-transformer' },
      ])
    );

    const registerResult = await registry.register(plugin, { priority: 'high' });
    expect(registerResult.success).toBe(true);

    // 2. 注册渲染器和转换器
    const renderer = createMockRenderer('md-renderer', ['.md'], 'lifecycle-test');
    const transformer = createMockTransformer(
      'md-transformer',
      'markdown',
      'html',
      'lifecycle-test'
    );

    const rendererResult = await registry.registerRenderer(renderer, 'lifecycle-test');
    const transformerResult = await registry.registerTransformer(transformer, 'lifecycle-test');

    expect(rendererResult.success).toBe(true);
    expect(transformerResult.success).toBe(true);

    // 3. 查询注册项
    expect(registry.hasPlugin('lifecycle-test')).toBe(true);
    expect(registry.hasRenderer('md-renderer')).toBe(true);
    expect(registry.hasTransformer('md-transformer')).toBe(true);

    // 4. 禁用插件
    registry.disablePlugin('lifecycle-test');
    expect(registry.isPluginEnabled('lifecycle-test')).toBe(false);
    expect(registry.getRenderer('md-renderer')).toBeUndefined();
    expect(registry.getTransformer('md-transformer')).toBeUndefined();

    // 5. 重新启用插件
    registry.enablePlugin('lifecycle-test');
    expect(registry.isPluginEnabled('lifecycle-test')).toBe(true);
    expect(registry.getRenderer('md-renderer')).toBeDefined();
    expect(registry.getTransformer('md-transformer')).toBeDefined();

    // 6. 注销插件
    const unregisterResult = await registry.unregister('lifecycle-test');
    expect(unregisterResult).toBe(true);
    expect(registry.hasPlugin('lifecycle-test')).toBe(false);
    expect(registry.hasRenderer('md-renderer')).toBe(false);
    expect(registry.hasTransformer('md-transformer')).toBe(false);
  });

  it('should handle multiple plugins with different priorities', async () => {
    const registry = new PluginRegistry();

    const highPlugin = createMockPlugin(
      createMockManifest('high', 'High Priority', [])
    );
    const normalPlugin = createMockPlugin(
      createMockManifest('normal', 'Normal Priority', [])
    );
    const lowPlugin = createMockPlugin(
      createMockManifest('low', 'Low Priority', [])
    );

    // 以非优先级顺序注册
    await registry.register(lowPlugin, { priority: 'low' });
    await registry.register(highPlugin, { priority: 'high' });
    await registry.register(normalPlugin, { priority: 'normal' });

    const sorted = registry.getPluginsByPriority();
    expect(sorted[0].id).toBe('high');
    expect(sorted[1].id).toBe('normal');
    expect(sorted[2].id).toBe('low');
  });

  it('should handle conflict resolution strategies correctly', async () => {
    // Error strategy (default)
    const errorRegistry = new PluginRegistry({ conflictResolution: 'error' });
    const plugin1 = createMockPlugin(
      createMockManifest('conflict', 'Plugin 1', [])
    );
    const plugin2 = createMockPlugin(
      createMockManifest('conflict', 'Plugin 2', [])
    );

    await errorRegistry.register(plugin1);
    const errorResult = await errorRegistry.register(plugin2);
    expect(errorResult.success).toBe(false);

    // Override strategy
    const overrideRegistry = new PluginRegistry({ conflictResolution: 'override' });
    await overrideRegistry.register(plugin1);
    const overrideResult = await overrideRegistry.register(plugin2);
    expect(overrideResult.success).toBe(true);
    expect(overrideRegistry.getPlugin('conflict')).toBe(plugin2);
  });
});