/**
 * Graphviz DOT 渲染器
 */

/**
 * 创建 Graphviz DOT 渲染器
 */
export function createGraphvizRenderer() {
  return async (container: HTMLElement, theme: 'light' | 'dark') => {
    console.log('[Graphviz] Starting render...');
    const dotBlocks = container.querySelectorAll('pre.dot code');
    console.log('[Graphviz] Found blocks:', dotBlocks.length);
    
    if (dotBlocks.length === 0) return;

    // 动态导入 @viz-js/viz
    const { instance } = await import('@viz-js/viz');
    const viz = await instance();

    for (const block of Array.from(dotBlocks)) {
      const code = block.textContent || '';
      if (!code.trim()) continue;

      try {
        const preElement = block.closest('pre');
        if (preElement && preElement.parentNode) {
          // 渲染 DOT 为 SVG
          const svg = viz.renderSVGElement(code);

          // 创建容器
          const wrapper = document.createElement('div');
          wrapper.className = 'graphviz-wrapper';
          wrapper.style.cssText = 'width: 100%; margin: 1rem 0; text-align: center;';
          wrapper.appendChild(svg);

          // 替换原始 pre 元素
          preElement.parentNode.replaceChild(wrapper, preElement);

          console.log('[Graphviz] Rendered successfully');
        }
      } catch (error) {
        console.error('Failed to render Graphviz:', error);
        const preElement = block.closest('pre');
        if (preElement) {
          preElement.classList.add('graphviz-error');
          preElement.title = `Graphviz rendering error: ${error instanceof Error ? error.message : String(error)}`;
        }
      }
    }
  };
}
