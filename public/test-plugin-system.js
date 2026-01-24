// 浏览器控制台测试脚本
// 复制粘贴到浏览器控制台运行

console.log('=== Plugin System Test ===');

// 1. 测试 API
console.log('\n1. Testing API endpoint...');
fetch('/api/plugins/manifests')
  .then(res => res.json())
  .then(data => {
    console.log('✅ API works! Manifests:', data.length);
    console.log('Mermaid plugin:', data.find(m => m.id === 'mermaid-renderer'));
  })
  .catch(err => console.error('❌ API failed:', err));

// 2. 检查 DOM
console.log('\n2. Checking DOM...');
const mermaidBlocks = document.querySelectorAll('pre.mermaid code');
console.log(`Found ${mermaidBlocks.length} mermaid blocks`);
if (mermaidBlocks.length > 0) {
  console.log('First block:', mermaidBlocks[0].textContent.substring(0, 50));
}

// 3. 检查渲染结果
const mermaidWrappers = document.querySelectorAll('.mermaid-wrapper');
console.log(`Found ${mermaidWrappers.length} rendered mermaid diagrams`);

// 4. 手动测试 Mermaid
console.log('\n3. Testing Mermaid library...');
import('mermaid').then(async ({ default: mermaid }) => {
  console.log('✅ Mermaid loaded');
  mermaid.initialize({ startOnLoad: false, theme: 'default' });
  
  const testCode = 'graph TD\n  A-->B';
  try {
    const { svg } = await mermaid.render('test-id', testCode);
    console.log('✅ Mermaid render works! SVG length:', svg.length);
  } catch (err) {
    console.error('❌ Mermaid render failed:', err);
  }
}).catch(err => console.error('❌ Failed to load Mermaid:', err));

// 5. 检查插件渲染器
console.log('\n4. Checking PluginRenderer...');
setTimeout(() => {
  const container = document.querySelector('.markdown-content');
  if (container) {
    console.log('✅ Found markdown container');
    console.log('Container has ref:', container.__reactFiber$ ? 'yes' : 'no');
  } else {
    console.log('❌ No markdown container found');
  }
}, 1000);
