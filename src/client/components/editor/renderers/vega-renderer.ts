/**
 * Vega/Vega-Lite 渲染器
 */

/**
 * 创建 Vega/Vega-Lite 渲染器
 */
export function createVegaRenderer() {
  return async (container: HTMLElement, theme: 'light' | 'dark') => {
    console.log('[Vega] Starting render...');
    
    // 处理 vega 和 vega-lite 两种类型
    const vegaBlocks = container.querySelectorAll('pre.vega code, pre.vega-lite code');
    console.log('[Vega] Found blocks:', vegaBlocks.length);
    
    if (vegaBlocks.length === 0) return;

    // 动态导入 vega-embed
    const embed = (await import('vega-embed')).default;

    for (const block of Array.from(vegaBlocks)) {
      const code = block.textContent || '';
      if (!code.trim()) continue;

      try {
        // 解析 JSON 规范
        const spec = JSON.parse(code);

        const preElement = block.closest('pre');
        if (preElement && preElement.parentNode) {
          // 创建容器
          const wrapper = document.createElement('div');
          wrapper.className = 'vega-wrapper';
          wrapper.style.cssText = 'width: 100%; margin: 1rem 0;';

          // 替换原始 pre 元素
          preElement.parentNode.replaceChild(wrapper, preElement);

          // 渲染 Vega
          const result = await embed(wrapper, spec, {
            mode: preElement.classList.contains('vega') ? 'vega' : 'vega-lite',
            theme: theme === 'dark' ? 'dark' : undefined,
            actions: false,
            renderer: 'canvas',
          });

          console.log('[Vega] Rendered successfully');
        }
      } catch (error) {
        console.error('Failed to render Vega:', error);
        const preElement = block.closest('pre');
        if (preElement) {
          preElement.classList.add('vega-error');
          preElement.title = `Vega rendering error: ${error instanceof Error ? error.message : String(error)}`;
        }
      }
    }
  };
}
