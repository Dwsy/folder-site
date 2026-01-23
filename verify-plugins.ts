#!/usr/bin/env bun
/**
 * 插件验证脚本
 * 快速验证所有插件是否正常工作
 */

console.log('🧪 开始验证插件...\n');

// 测试 VegaRenderer
async function testVegaRenderer() {
  console.log('📊 测试 VegaRenderer...');
  try {
    const { VegaRenderer } = await import('./plugins/vega-renderer/VegaRenderer.ts');
    
    const renderer = new VegaRenderer('vega-lite');
    const spec = JSON.stringify({
      mark: 'bar',
      data: { values: [{ a: 'A', b: 28 }] },
      encoding: {
        x: { field: 'a', type: 'nominal' },
        y: { field: 'b', type: 'quantitative' }
      }
    });

    const svg = await renderer.render(spec, { theme: 'light' });
    
    if (svg.startsWith('<svg') && svg.length > 100) {
      console.log('  ✅ VegaRenderer 工作正常');
      console.log(`  📏 SVG 长度: ${svg.length} 字符\n`);
      return true;
    } else {
      console.log('  ❌ VegaRenderer 输出异常\n');
      return false;
    }
  } catch (error: any) {
    console.log(`  ❌ VegaRenderer 错误: ${error.message}\n`);
    return false;
  }
}

// 测试 JSONCanvasRenderer
async function testJSONCanvasRenderer() {
  console.log('🎨 测试 JSONCanvasRenderer...');
  try {
    const { JSONCanvasRenderer } = await import('./plugins/json-canvas-renderer/JSONCanvasRenderer.ts');
    
    const renderer = new JSONCanvasRenderer();
    const canvas = JSON.stringify({
      nodes: [
        { id: "1", type: "text", x: 0, y: 0, width: 150, height: 80, text: "Hello" }
      ],
      edges: []
    });

    const svg = await renderer.render(canvas, { theme: 'light' });
    
    if (svg.startsWith('<svg') && svg.includes('Hello')) {
      console.log('  ✅ JSONCanvasRenderer 工作正常');
      console.log(`  📏 SVG 长度: ${svg.length} 字符\n`);
      return true;
    } else {
      console.log('  ❌ JSONCanvasRenderer 输出异常\n');
      return false;
    }
  } catch (error: any) {
    console.log(`  ❌ JSONCanvasRenderer 错误: ${error.message}\n`);
    return false;
  }
}

// 测试 highlighter
async function testHighlighter() {
  console.log('💻 测试 highlighter...');
  try {
    const { getHighlighter } = await import('./src/server/lib/highlighter.js');
    
    const highlighter = getHighlighter();
    await highlighter.ensureInitialized();
    
    const themes = highlighter.getLoadedThemes();
    const html = await highlighter.codeToHtml('const x = 1;', {
      lang: 'javascript',
      theme: 'github-dark',
    });
    
    if (themes.length >= 27 && html.includes('<pre')) {
      console.log('  ✅ highlighter 工作正常');
      console.log(`  🎨 主题数量: ${themes.length}\n`);
      return true;
    } else {
      console.log('  ❌ highlighter 输出异常\n');
      return false;
    }
  } catch (error: any) {
    console.log(`  ❌ highlighter 错误: ${error.message}\n`);
    return false;
  }
}

// 运行所有测试
async function main() {
  const results = {
    vega: await testVegaRenderer(),
    jsonCanvas: await testJSONCanvasRenderer(),
    highlighter: await testHighlighter(),
  };

  console.log('═══════════════════════════════════════════════════════════');
  console.log('📊 验证总结\n');
  
  const passed = Object.values(results).filter(r => r).length;
  const total = Object.keys(results).length;
  
  console.log(`✅ 通过: ${passed}/${total}`);
  console.log(`❌ 失败: ${total - passed}/${total}`);
  console.log(`📈 成功率: ${Math.round(passed/total * 100)}%\n`);
  
  if (passed === total) {
    console.log('🎉 所有插件工作正常！');
    process.exit(0);
  } else {
    console.log('⚠️  部分插件需要修复');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('💥 验证失败:', error);
  process.exit(1);
});
