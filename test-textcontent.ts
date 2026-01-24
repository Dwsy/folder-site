const html = `<code>{
  &quot;type&quot;: &quot;interval&quot;,
  &quot;data&quot;: [
    { &quot;genre&quot;: &quot;Sports&quot;, &quot;sold&quot;: 275 }
  ]
}</code>`;

// 模拟浏览器环境
const { JSDOM } = await import('jsdom');
const dom = new JSDOM(html);
const code = dom.window.document.querySelector('code');

console.log('textContent:', code.textContent);
console.log('\nCan parse JSON:', (() => {
  try {
    JSON.parse(code.textContent);
    return 'YES';
  } catch (e) {
    return 'NO: ' + e.message;
  }
})());
