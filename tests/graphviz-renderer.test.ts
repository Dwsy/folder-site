/**
 * Graphviz 渲染器插件单元测试
 * 
 * 测试覆盖：
 * - 插件初始化和激活
 * - 各种图表类型渲染
 * - 布局引擎配置
 * - 主题配置
 * - 错误处理
 * - 缓存功能
 * - 输出格式
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { GraphvizRenderer } from '../plugins/graphviz-renderer/GraphvizRenderer.js';
import { GraphvizRendererPlugin } from '../plugins/graphviz-renderer/index.js';

// =============================================================================
// 测试数据
// =============================================================================

const TEST_GRAPHS = {
  digraph: `digraph G {
    A -> B;
    B -> C;
    C -> A;
    A -> D;
    D -> E;
  }`,

  graph: `graph G {
    A -- B;
    B -- C;
    C -- A;
    A -- D;
    D -- E;
  }`,

  complex: `digraph G {
    rankdir=LR;
    node [shape=box];
    start [label="Start"];
    process [label="Process"];
    decision [label="Decision", shape=diamond];
    end [label="End"];
    
    start -> process;
    process -> decision;
    decision -> end [label="Yes"];
    decision -> process [label="No"];
  }`,

  subgraph: `digraph G {
    subgraph cluster_0 {
      label = "Group A";
      A -> B;
      B -> C;
    }
    subgraph cluster_1 {
      label = "Group B";
      D -> E;
      E -> F;
    }
    C -> D;
  }`,

  styled: `digraph G {
    node [shape=circle, fillcolor=lightblue, style=filled];
    edge [color=blue];
    A -> B;
    B -> C;
    C -> A;
  }`,

  large: `digraph G {
    A -> B; A -> C; A -> D;
    B -> E; B -> F;
    C -> G; C -> H;
    D -> I; D -> J;
    E -> K; F -> K;
    G -> L; H -> L;
    I -> M; J -> M;
  }`,
};

const INVALID_GRAPHS = {
  empty: '',
  invalidSyntax: `digraph G {
    A -> B
    B -> C
    // Missing closing brace
  `,
  unbalancedBraces: `digraph G {
    A -> B;
    B -> C;
    C -> D;`,
  noKeyword: `A -> B;
    B -> C;`,
};

// =============================================================================
// 测试套件
// =============================================================================

describe('GraphvizRendererPlugin', () => {
  let plugin: GraphvizRendererPlugin;

  beforeEach(() => {
    plugin = new GraphvizRendererPlugin();
  });

  afterEach(() => {
    // 清理
  });

  describe('插件基本信息', () => {
    it('应该有正确的插件 ID', () => {
      expect(plugin.id).toBe('graphviz-renderer');
    });

    it('应该有正确的插件名称', () => {
      expect(plugin.name).toBe('Graphviz Renderer');
    });

    it('应该有正确的版本号', () => {
      expect(plugin.version).toBe('1.0.0');
    });

    it('应该有正确的清单', () => {
      expect(plugin.manifest.id).toBe('graphviz-renderer');
      expect(plugin.manifest.name).toBe('Graphviz Renderer');
      expect(plugin.manifest.version).toBe('1.0.0');
      expect(plugin.manifest.capabilities).toHaveLength(1);
      expect(plugin.manifest.capabilities[0].type).toBe('renderer');
      expect(plugin.manifest.capabilities[0].name).toBe('graphviz');
    });

    it('应该有正确的初始状态', () => {
      expect(plugin.status).toBe('discovered');
    });
  });

  describe('插件生命周期', () => {
    it('应该能够初始化插件', async () => {
      const mockContext = {
        app: { version: '0.1.0', environment: 'test', rootPath: '/test', configPath: '/test/config.json' },
        services: {},
        events: { on: () => ({ dispose: () => {} }), once: () => ({ dispose: () => {} }), emit: () => {}, off: () => {}, onAny: () => ({ dispose: () => {} }) },
        logger: { debug: () => {}, info: () => {}, warn: () => {}, error: () => {} },
        storage: { get: () => undefined, set: () => {}, remove: () => {}, clear: () => {}, has: () => false, keys: () => [], size: 0 },
        utils: {},
        config: { get: () => undefined, set: () => {}, getAll: () => ({}), onChange: () => ({ dispose: () => {} }) },
      };

      await plugin.initialize(mockContext);
      expect(plugin.status).toBe('loaded');
    });

    it('应该能够激活插件', async () => {
      const mockContext = {
        app: { version: '0.1.0', environment: 'test', rootPath: '/test', configPath: '/test/config.json' },
        services: {},
        events: { on: () => ({ dispose: () => {} }), once: () => ({ dispose: () => {} }), emit: () => {}, off: () => {}, onAny: () => ({ dispose: () => {} }) },
        logger: { debug: () => {}, info: () => {}, warn: () => {}, error: () => {} },
        storage: { get: () => undefined, set: () => {}, remove: () => {}, clear: () => {}, has: () => false, keys: () => [], size: 0 },
        utils: {},
        config: { get: () => undefined, set: () => {}, getAll: () => ({}), onChange: () => ({ dispose: () => {} }) },
      };

      await plugin.initialize(mockContext);
      await plugin.activate();
      expect(plugin.status).toBe('active');
    });

    it('应该能够停用插件', async () => {
      const mockContext = {
        app: { version: '0.1.0', environment: 'test', rootPath: '/test', configPath: '/test/config.json' },
        services: {},
        events: { on: () => ({ dispose: () => {} }), once: () => ({ dispose: () => {} }), emit: () => {}, off: () => {}, onAny: () => ({ dispose: () => {} }) },
        logger: { debug: () => {}, info: () => {}, warn: () => {}, error: () => {} },
        storage: { get: () => undefined, set: () => {}, remove: () => {}, clear: () => {}, has: () => false, keys: () => [], size: 0 },
        utils: {},
        config: { get: () => undefined, set: () => {}, getAll: () => ({}), onChange: () => ({ dispose: () => {} }) },
      };

      await plugin.initialize(mockContext);
      await plugin.activate();
      await plugin.deactivate();
      expect(plugin.status).toBe('inactive');
    });

    it('应该能够销毁插件', async () => {
      const mockContext = {
        app: { version: '0.1.0', environment: 'test', rootPath: '/test', configPath: '/test/config.json' },
        services: {},
        events: { on: () => ({ dispose: () => {} }), once: () => ({ dispose: () => {} }), emit: () => {}, off: () => {}, onAny: () => ({ dispose: () => {} }) },
        logger: { debug: () => {}, info: () => {}, warn: () => {}, error: () => {} },
        storage: { get: () => undefined, set: () => {}, remove: () => {}, clear: () => {}, has: () => false, keys: () => [], size: 0 },
        utils: {},
        config: { get: () => undefined, set: () => {}, getAll: () => ({}), onChange: () => ({ dispose: () => {} }) },
      };

      await plugin.initialize(mockContext);
      await plugin.dispose();
      expect(plugin.status).toBe('inactive');
      expect(plugin.getRenderer()).toBeUndefined();
    });

    it('应该能够获取渲染器实例', async () => {
      const mockContext = {
        app: { version: '0.1.0', environment: 'test', rootPath: '/test', configPath: '/test/config.json' },
        services: {},
        events: { on: () => ({ dispose: () => {} }), once: () => ({ dispose: () => {} }), emit: () => {}, off: () => {}, onAny: () => ({ dispose: () => {} }) },
        logger: { debug: () => {}, info: () => {}, warn: () => {}, error: () => {} },
        storage: { get: () => undefined, set: () => {}, remove: () => {}, clear: () => {}, has: () => false, keys: () => [], size: 0 },
        utils: {},
        config: { get: () => undefined, set: () => {}, getAll: () => ({}), onChange: () => ({ dispose: () => {} }) },
      };

      await plugin.initialize(mockContext);
      const renderer = plugin.getRenderer();
      expect(renderer).toBeInstanceOf(GraphvizRenderer);
    });
  });
});

describe('GraphvizRenderer', () => {
  let renderer: GraphvizRenderer;

  beforeEach(() => {
    renderer = new GraphvizRenderer();
  });

  afterEach(() => {
    renderer.clearCache();
  });

  describe('渲染器基本信息', () => {
    it('应该有正确的渲染器名称', () => {
      expect(renderer.name).toBe('graphviz');
    });

    it('应该有正确的文件扩展名支持', () => {
      expect(renderer.extensions).toContain('.dot');
      expect(renderer.extensions).toContain('.gv');
      expect(renderer.extensions).toContain('.graphviz');
    });

    it('应该有正确的版本号', () => {
      expect(renderer.version).toBe('1.0.0');
    });

    it('应该有正确的插件 ID', () => {
      expect(renderer.pluginId).toBe('graphviz-renderer');
    });
  });

  describe('解析功能', () => {
    it('应该能够解析有向图', () => {
      const result = renderer.parse(TEST_GRAPHS.digraph);
      expect(result.success).toBe(true);
      expect(result.graphType).toBe('digraph');
    });

    it('应该能够解析无向图', () => {
      const result = renderer.parse(TEST_GRAPHS.graph);
      expect(result.success).toBe(true);
      expect(result.graphType).toBe('graph');
    });

    it('应该能够解析复杂图表', () => {
      const result = renderer.parse(TEST_GRAPHS.complex);
      expect(result.success).toBe(true);
      expect(result.graphType).toBe('digraph');
    });

    it('应该能够解析子图', () => {
      const result = renderer.parse(TEST_GRAPHS.subgraph);
      expect(result.success).toBe(true);
      expect(result.graphType).toBe('digraph');
    });

    it('应该能够检测推荐的布局引擎', () => {
      const result = renderer.parse(TEST_GRAPHS.digraph);
      expect(result.success).toBe(true);
      expect(result.detectedEngine).toBeDefined();
    });

    it('应该拒绝空代码', () => {
      const result = renderer.parse(INVALID_GRAPHS.empty);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('应该拒绝无效的语法', () => {
      const result = renderer.parse(INVALID_GRAPHS.unbalancedBraces);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('应该拒绝没有关键字的代码', () => {
      const result = renderer.parse(INVALID_GRAPHS.noKeyword);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('渲染功能', () => {
    it('应该能够渲染有向图', async () => {
      const result = await renderer.render(TEST_GRAPHS.digraph);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toContain('<svg');
    });

    it('应该能够渲染无向图', async () => {
      const result = await renderer.render(TEST_GRAPHS.graph, { engine: 'neato' });
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toContain('<svg');
    });

    it('应该能够渲染复杂图表', async () => {
      const result = await renderer.render(TEST_GRAPHS.complex);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toContain('<svg');
    });

    it('应该能够渲染子图', async () => {
      const result = await renderer.render(TEST_GRAPHS.subgraph);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toContain('<svg');
    });

    it('应该能够渲染大型图表', async () => {
      const result = await renderer.render(TEST_GRAPHS.large);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toContain('<svg');
    });

    it('应该能够渲染 SVG 格式', async () => {
      const result = await renderer.render(TEST_GRAPHS.digraph, { format: 'svg' });
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toContain('<svg');
    });
  });

  describe('布局引擎', () => {
    it('应该支持 dot 引擎', async () => {
      const result = await renderer.render(TEST_GRAPHS.digraph, { engine: 'dot' });
      expect(result).toBeDefined();
      expect(result).toContain('<svg');
    });

    it('应该支持 neato 引擎', async () => {
      const result = await renderer.render(TEST_GRAPHS.graph, { engine: 'neato' });
      expect(result).toBeDefined();
      expect(result).toContain('<svg');
    });

    it('应该支持 fdp 引擎', async () => {
      const result = await renderer.render(TEST_GRAPHS.graph, { engine: 'fdp' });
      expect(result).toBeDefined();
      expect(result).toContain('<svg');
    });

    it('应该支持 sfdp 引擎', async () => {
      const result = await renderer.render(TEST_GRAPHS.large, { engine: 'sfdp' });
      expect(result).toBeDefined();
      expect(result).toContain('<svg');
    });

    it('应该支持 twopi 引擎', async () => {
      const result = await renderer.render(TEST_GRAPHS.digraph, { engine: 'twopi' });
      expect(result).toBeDefined();
      expect(result).toContain('<svg');
    });

    it('应该支持 circo 引擎', async () => {
      const result = await renderer.render(TEST_GRAPHS.digraph, { engine: 'circo' });
      expect(result).toBeDefined();
      expect(result).toContain('<svg');
    });

    it('应该能够获取支持的引擎列表', () => {
      const engines = renderer.getSupportedEngines();
      expect(engines).toContain('dot');
      expect(engines).toContain('neato');
      expect(engines).toContain('fdp');
      expect(engines).toContain('sfdp');
      expect(engines).toContain('twopi');
      expect(engines).toContain('circo');
      expect(engines).toHaveLength(6);
    });

    it('应该能够检查引擎是否支持', () => {
      expect(renderer.isEngineSupported('dot')).toBe(true);
      expect(renderer.isEngineSupported('neato')).toBe(true);
      expect(renderer.isEngineSupported('invalid')).toBe(false);
    });
  });

  describe('主题配置', () => {
    it('应该支持 light 主题', async () => {
      const result = await renderer.render(TEST_GRAPHS.digraph, { theme: 'light' });
      expect(result).toBeDefined();
      expect(result).toContain('<svg');
    });

    it('应该支持 dark 主题', async () => {
      const result = await renderer.render(TEST_GRAPHS.digraph, { theme: 'dark' });
      expect(result).toBeDefined();
      expect(result).toContain('<svg');
    });

    it('应该支持自定义字体大小', async () => {
      const result = await renderer.render(TEST_GRAPHS.digraph, { fontSize: 20 });
      expect(result).toBeDefined();
      expect(result).toContain('<svg');
    });

    it('应该支持自定义字体家族', async () => {
      const result = await renderer.render(TEST_GRAPHS.digraph, { fontFamily: 'Arial' });
      expect(result).toBeDefined();
      expect(result).toContain('<svg');
    });

    it('应该支持自定义背景颜色', async () => {
      const result = await renderer.render(TEST_GRAPHS.digraph, { backgroundColor: '#ffffff' });
      expect(result).toBeDefined();
      expect(result).toContain('background-color');
    });

    it('应该支持自定义节点颜色', async () => {
      const result = await renderer.render(TEST_GRAPHS.digraph, { nodeColor: '#ff0000' });
      expect(result).toBeDefined();
      expect(result).toContain('<svg');
    });

    it('应该支持自定义边颜色', async () => {
      const result = await renderer.render(TEST_GRAPHS.digraph, { edgeColor: '#0000ff' });
      expect(result).toBeDefined();
      expect(result).toContain('<svg');
    });

    it('应该支持自定义字体颜色', async () => {
      const result = await renderer.render(TEST_GRAPHS.digraph, { fontColor: '#00ff00' });
      expect(result).toBeDefined();
      expect(result).toContain('<svg');
    });
  });

  describe('错误处理', () => {
    it('应该抛出错误当渲染空代码', async () => {
      await expect(renderer.render(INVALID_GRAPHS.empty)).rejects.toThrow();
    });

    it('应该抛出错误当渲染无效语法', async () => {
      await expect(renderer.render(INVALID_GRAPHS.unbalancedBraces)).rejects.toThrow();
    });

    it('应该提供清晰的错误信息', async () => {
      try {
        await renderer.render(INVALID_GRAPHS.empty);
        expect(true).toBe(false); // 不应该到达这里
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBeDefined();
      }
    });
  });

  describe('缓存功能', () => {
    it('应该默认启用缓存', async () => {
      await renderer.render(TEST_GRAPHS.digraph);
      const cacheSize = renderer.getCacheSize();
      expect(cacheSize).toBeGreaterThan(0);
    });

    it('应该能够禁用缓存', async () => {
      await renderer.render(TEST_GRAPHS.digraph, { cache: false });
      const cacheSize = renderer.getCacheSize();
      expect(cacheSize).toBe(0);
    });

    it('应该能够清空缓存', async () => {
      await renderer.render(TEST_GRAPHS.digraph);
      expect(renderer.getCacheSize()).toBeGreaterThan(0);
      renderer.clearCache();
      expect(renderer.getCacheSize()).toBe(0);
    });

    it('应该能够获取缓存大小', async () => {
      expect(renderer.getCacheSize()).toBe(0);
      await renderer.render(TEST_GRAPHS.digraph);
      expect(renderer.getCacheSize()).toBeGreaterThan(0);
    });

    it('应该能够清理过期缓存', () => {
      renderer.cleanExpiredCache();
      const cacheSize = renderer.getCacheSize();
      expect(cacheSize).toBeGreaterThanOrEqual(0);
    });
  });

  describe('SVG 处理', () => {
    it('应该能够包含 XML 声明', async () => {
      const result = await renderer.render(TEST_GRAPHS.digraph, { svgOptions: { includeXmlDeclaration: true } });
      expect(result).toContain('<?xml');
    });

    it('应该能够排除 XML 声明', async () => {
      const result = await renderer.render(TEST_GRAPHS.digraph, { svgOptions: { includeXmlDeclaration: false } });
      expect(result).not.toContain('<?xml');
    });

    it('应该能够压缩 SVG', async () => {
      const result = await renderer.render(TEST_GRAPHS.digraph, { svgOptions: { compress: true } });
      expect(result).toBeDefined();
      expect(result).toContain('<svg');
    });
  });

  describe('渲染器状态', () => {
    it('应该能够获取渲染器状态', async () => {
      await renderer.render(TEST_GRAPHS.digraph);
      const status = renderer.getStatus();
      expect(status.initialized).toBe(true);
      expect(status.cacheSize).toBeGreaterThan(0);
      expect(status.supportedEngines).toHaveLength(6);
      expect(status.supportedFormats).toContain('svg');
      expect(status.supportedFormats).toHaveLength(1);
    });

    it('应该报告初始化状态', async () => {
      const status = renderer.getStatus();
      expect(status.initialized).toBe(false);
      await renderer.render(TEST_GRAPHS.digraph);
      const newStatus = renderer.getStatus();
      expect(newStatus.initialized).toBe(true);
    });
  });

  describe('自定义属性', () => {
    it('应该支持自定义图形属性', async () => {
      const result = await renderer.render(TEST_GRAPHS.digraph, {
        graphAttributes: { rankdir: 'TB' },
      });
      expect(result).toBeDefined();
      expect(result).toContain('<svg');
    });

    it('应该支持自定义节点属性', async () => {
      const result = await renderer.render(TEST_GRAPHS.digraph, {
        nodeAttributes: { shape: 'box' },
      });
      expect(result).toBeDefined();
      expect(result).toContain('<svg');
    });

    it('应该支持自定义边属性', async () => {
      const result = await renderer.render(TEST_GRAPHS.digraph, {
        edgeAttributes: { style: 'dashed' },
      });
      expect(result).toBeDefined();
      expect(result).toContain('<svg');
    });
  });

  describe('边界情况', () => {
    it('应该能够处理最小图表', async () => {
      const minimalGraph = 'digraph G { A; }';
      const result = await renderer.render(minimalGraph);
      expect(result).toBeDefined();
      expect(result).toContain('<svg');
    });

    it('应该能够处理单节点', async () => {
      const singleNode = 'digraph G { A [label="Single"]; }';
      const result = await renderer.render(singleNode);
      expect(result).toBeDefined();
      expect(result).toContain('<svg');
    });

    it('应该能够处理自环', async () => {
      const selfLoop = 'digraph G { A -> A; }';
      const result = await renderer.render(selfLoop);
      expect(result).toBeDefined();
      expect(result).toContain('<svg');
    });

    it('应该能够处理多边', async () => {
      const multiEdge = 'digraph G { A -> B; A -> B; }';
      const result = await renderer.render(multiEdge);
      expect(result).toBeDefined();
      expect(result).toContain('<svg');
    });
  });
});