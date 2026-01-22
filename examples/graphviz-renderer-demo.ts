/**
 * Graphviz 渲染器演示脚本
 * 
 * 展示如何使用 Graphviz 渲染器渲染各种类型的图表
 */

import { GraphvizRenderer } from '../plugins/graphviz-renderer/GraphvizRenderer.js';

// 创建渲染器实例
const renderer = new GraphvizRenderer();

// 示例 DOT 代码
const examples = {
  simple: `digraph G {
    A -> B;
    B -> C;
    C -> A;
  }`,

  flowchart: `digraph G {
    rankdir=LR;
    node [shape=box];
    start [label="开始"];
    process [label="处理"];
    decision [label="判断", shape=diamond];
    end [label="结束"];
    
    start -> process;
    process -> decision;
    decision -> end [label="成功"];
    decision -> process [label="重试"];
  }`,

  hierarchy: `digraph G {
    node [shape=box];
    CEO -> CTO;
    CEO -> CFO;
    CEO -> COO;
    
    CTO -> "Dev Lead";
    CTO -> "QA Lead";
    CFO -> "Accountant";
    COO -> "Ops Manager";
  }`,

  undirected: `graph G {
    A -- B;
    B -- C;
    C -- D;
    D -- A;
    A -- C;
    B -- D;
  }`,

  subgraph: `digraph G {
    subgraph cluster_frontend {
      label = "Frontend";
      style = filled;
      color = lightgrey;
      React;
      Vue;
      Angular;
    }
    
    subgraph cluster_backend {
      label = "Backend";
      style = filled;
      color = lightblue;
      Node;
      Python;
      Go;
    }
    
    React -> Node;
    Vue -> Python;
    Angular -> Go;
  }`,
};

// 渲染并保存示例
async function renderExamples() {
  console.log('Graphviz 渲染器演示\n');
  console.log('====================\n');

  // 获取渲染器状态
  console.log('渲染器状态:');
  const status = renderer.getStatus();
  console.log(`  初始化: ${status.initialized}`);
  console.log(`  支持的引擎: ${status.supportedEngines.join(', ')}`);
  console.log(`  支持的格式: ${status.supportedFormats.join(', ')}`);
  console.log(`  缓存大小: ${status.cacheSize}`);
  console.log();

  // 渲染每个示例
  for (const [name, dotCode] of Object.entries(examples)) {
    console.log(`渲染示例: ${name}`);
    console.log('---');
    
    try {
      const svg = await renderer.render(dotCode, {
        theme: 'light',
        engine: 'dot',
        fontSize: 14,
      });
      
      console.log(`  成功渲染 (${svg.length} 字符)`);
      console.log(`  SVG 前缀: ${svg.substring(0, 100)}...`);
      console.log();
    } catch (error) {
      console.error(`  渲染失败: ${error}`);
      console.log();
    }
  }

  // 测试不同的布局引擎
  console.log('测试不同的布局引擎:');
  console.log('---');
  const engines = renderer.getSupportedEngines();
  for (const engine of engines) {
    try {
      const svg = await renderer.render(examples.simple, { engine });
      console.log(`  ${engine}: 成功 (${svg.length} 字符)`);
    } catch (error) {
      console.log(`  ${engine}: 失败`);
    }
  }
  console.log();

  // 测试主题
  console.log('测试主题:');
  console.log('---');
  const themes = ['light', 'dark'] as const;
  for (const theme of themes) {
    try {
      const svg = await renderer.render(examples.flowchart, { theme });
      console.log(`  ${theme}: 成功 (${svg.length} 字符)`);
    } catch (error) {
      console.log(`  ${theme}: 失败`);
    }
  }
  console.log();

  // 缓存测试
  console.log('缓存测试:');
  console.log('---');
  const start1 = Date.now();
  await renderer.render(examples.simple, { cache: true });
  const time1 = Date.now() - start1;
  
  const start2 = Date.now();
  await renderer.render(examples.simple, { cache: true });
  const time2 = Date.now() - start2;
  
  console.log(`  首次渲染: ${time1}ms`);
  console.log(`  缓存渲染: ${time2}ms`);
  console.log(`  缓存大小: ${renderer.getCacheSize()}`);
  console.log();

  console.log('====================');
  console.log('演示完成！');
}

// 运行演示
renderExamples().catch(console.error);