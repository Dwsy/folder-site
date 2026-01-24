/**
 * SVG 渲染器
 */

/**
 * 创建 SVG 渲染器
 */
export function createSvgRenderer() {
  return async (container: HTMLElement, theme: 'light' | 'dark') => {
    console.log('[SVG] Starting render...');
    const svgBlocks = container.querySelectorAll('code[data-svg="true"]');
    console.log('[SVG] Found blocks:', svgBlocks.length);
    
    if (svgBlocks.length === 0) return;

    for (const block of Array.from(svgBlocks)) {
      // 从 data-content 属性读取
      const code = (block as HTMLElement).getAttribute('data-content') || block.textContent || '';
      if (!code.trim()) continue;

      try {
        const preElement = block.closest('pre');
        if (preElement && preElement.parentNode) {
          // 创建容器
          const wrapper = document.createElement('div');
          wrapper.className = 'svg-wrapper';
          wrapper.style.cssText = 'width: 100%; margin: 1rem 0; text-align: center;';
          wrapper.innerHTML = code;

          // 替换原始 pre 元素
          preElement.parentNode.replaceChild(wrapper, preElement);

          console.log('[SVG] Rendered successfully');
        }
      } catch (error) {
        console.error('Failed to render SVG:', error);
        const preElement = block.closest('pre');
        if (preElement) {
          preElement.classList.add('svg-error');
          preElement.title = `SVG rendering error: ${error instanceof Error ? error.message : String(error)}`;
        }
      }
    }
  };
}
