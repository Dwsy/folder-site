/**
 * Infographic 渲染器
 * 使用 AntV Infographic 渲染信息图
 */

/**
 * 创建 Infographic 渲染器
 */
export function createInfographicRenderer() {
  return async (container: HTMLElement, theme: 'light' | 'dark') => {
    console.log('[Infographic] Starting render...');
    const infographicBlocks = container.querySelectorAll('pre.infographic code');
    console.log('[Infographic] Found blocks:', infographicBlocks.length);
    
    if (infographicBlocks.length === 0) return;

    // 动态导入 Infographic
    const { Infographic } = await import('@antv/infographic');

    for (const block of Array.from(infographicBlocks)) {
      const code = block.textContent || '';
      if (!code.trim()) continue;

      try {
        const preElement = block.closest('pre');
        if (preElement && preElement.parentNode) {
          // 创建临时容器（离屏渲染）
          const tempContainer = document.createElement('div');
          tempContainer.style.cssText = 'position: absolute; left: -9999px; width: 900px; height: 600px;';
          document.body.appendChild(tempContainer);

          try {
            // 创建 Infographic 实例
            const infographic = new Infographic({
              container: tempContainer,
              width: 900,
              height: 600,
              padding: 24,
            });

            // 等待渲染完成（使用事件驱动）
            await new Promise<void>((resolve, reject) => {
              const timeout = setTimeout(() => {
                reject(new Error('Infographic render timeout after 10s'));
              }, 10000);

              infographic.on('rendered', () => {
                clearTimeout(timeout);
                resolve();
              });

              infographic.on('error', (err: unknown) => {
                clearTimeout(timeout);
                let errorMessage: string;
                
                if (Array.isArray(err)) {
                  const parseErrors = err.map((e: any) => 
                    `Line ${e.line || '?'}: ${e.message || 'Unknown error'}`
                  ).join('\n');
                  errorMessage = `Syntax error:\n${parseErrors}`;
                } else if (err instanceof Error) {
                  errorMessage = err.message;
                } else {
                  errorMessage = String(err);
                }
                
                reject(new Error(errorMessage));
              });

              // 开始渲染
              try {
                infographic.render(code);
              } catch (e) {
                clearTimeout(timeout);
                reject(e);
              }
            });

            // 获取 SVG 数据
            const svgDataUrl = await infographic.toDataURL({ type: 'svg', embedResources: true });
            
            // 创建显示容器
            const wrapper = document.createElement('div');
            wrapper.className = 'infographic-wrapper';
            wrapper.style.cssText = 'width: 100%; margin: 1rem 0;';

            // 创建 img 元素显示 SVG
            const img = document.createElement('img');
            img.src = svgDataUrl;
            img.style.cssText = 'max-width: 100%; height: auto;';
            wrapper.appendChild(img);

            // 替换原始 pre 元素
            preElement.parentNode.replaceChild(wrapper, preElement);

            // 清理
            infographic.destroy();
            console.log('[Infographic] Rendered successfully');
          } finally {
            // 移除临时容器
            document.body.removeChild(tempContainer);
          }
        }
      } catch (error) {
        console.error('Failed to render Infographic:', error);
        const preElement = block.closest('pre');
        if (preElement) {
          preElement.classList.add('infographic-error');
          preElement.title = `Infographic rendering error: ${error instanceof Error ? error.message : String(error)}`;
        }
      }
    }
  };
}
