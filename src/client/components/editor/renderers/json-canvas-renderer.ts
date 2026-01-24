/**
 * JSON Canvas 渲染器
 * 简单的 JSON Canvas 可视化
 */

interface CanvasNode {
  id: string;
  type: string;
  text?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
}

interface CanvasEdge {
  id: string;
  fromNode: string;
  toNode: string;
  fromSide?: string;
  toSide?: string;
  color?: string;
}

interface CanvasData {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

/**
 * 创建 JSON Canvas 渲染器
 */
export function createJsonCanvasRenderer() {
  return async (container: HTMLElement, theme: 'light' | 'dark') => {
    console.log('[JSON Canvas] Starting render...');
    console.log('[JSON Canvas] Container:', container);
    
    // 查找带有 data-json-canvas 属性的代码块
    const canvasBlocks = container.querySelectorAll('code[data-json-canvas="true"]');
    console.log('[JSON Canvas] Found blocks:', canvasBlocks.length);
    
    // 调试：列出所有 code 元素
    const allCodes = container.querySelectorAll('code');
    console.log('[JSON Canvas] All code elements:', allCodes.length);
    allCodes.forEach((code, i) => {
      console.log(`[JSON Canvas] Code ${i}:`, {
        className: code.className,
        hasDataAttr: code.hasAttribute('data-json-canvas'),
        dataContent: code.getAttribute('data-content')?.substring(0, 50)
      });
    });
    
    if (canvasBlocks.length === 0) return;

    for (const block of Array.from(canvasBlocks)) {
      const code = block.textContent || '';
      if (!code.trim()) continue;

      try {
        // 解析 JSON
        const data: CanvasData = JSON.parse(code);

        const preElement = block.closest('pre');
        if (preElement && preElement.parentNode) {
          // 计算画布大小
          let maxX = 0, maxY = 0;
          data.nodes.forEach(node => {
            maxX = Math.max(maxX, node.x + node.width);
            maxY = Math.max(maxY, node.y + node.height);
          });

          const canvasWidth = maxX + 50;
          const canvasHeight = maxY + 50;

          // 创建 SVG
          const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          svg.setAttribute('width', canvasWidth.toString());
          svg.setAttribute('height', canvasHeight.toString());
          svg.setAttribute('viewBox', `0 0 ${canvasWidth} ${canvasHeight}`);
          svg.style.cssText = 'border: 1px solid #ccc; background: white;';

          // 渲染边
          data.edges?.forEach(edge => {
            const fromNode = data.nodes.find(n => n.id === edge.fromNode);
            const toNode = data.nodes.find(n => n.id === edge.toNode);
            
            if (fromNode && toNode) {
              const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
              line.setAttribute('x1', (fromNode.x + fromNode.width / 2).toString());
              line.setAttribute('y1', (fromNode.y + fromNode.height / 2).toString());
              line.setAttribute('x2', (toNode.x + toNode.width / 2).toString());
              line.setAttribute('y2', (toNode.y + toNode.height / 2).toString());
              line.setAttribute('stroke', edge.color || '#666');
              line.setAttribute('stroke-width', '2');
              line.setAttribute('marker-end', 'url(#arrowhead)');
              svg.appendChild(line);
            }
          });

          // 添加箭头标记
          const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
          const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
          marker.setAttribute('id', 'arrowhead');
          marker.setAttribute('markerWidth', '10');
          marker.setAttribute('markerHeight', '10');
          marker.setAttribute('refX', '9');
          marker.setAttribute('refY', '3');
          marker.setAttribute('orient', 'auto');
          const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
          polygon.setAttribute('points', '0 0, 10 3, 0 6');
          polygon.setAttribute('fill', '#666');
          marker.appendChild(polygon);
          defs.appendChild(marker);
          svg.appendChild(defs);

          // 渲染节点
          data.nodes.forEach(node => {
            const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('x', node.x.toString());
            rect.setAttribute('y', node.y.toString());
            rect.setAttribute('width', node.width.toString());
            rect.setAttribute('height', node.height.toString());
            rect.setAttribute('fill', node.color || '#f0f0f0');
            rect.setAttribute('stroke', '#333');
            rect.setAttribute('stroke-width', '2');
            rect.setAttribute('rx', '5');
            g.appendChild(rect);

            if (node.text) {
              const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
              text.setAttribute('x', (node.x + node.width / 2).toString());
              text.setAttribute('y', (node.y + node.height / 2).toString());
              text.setAttribute('text-anchor', 'middle');
              text.setAttribute('dominant-baseline', 'middle');
              text.setAttribute('fill', '#000');
              text.textContent = node.text;
              g.appendChild(text);
            }

            svg.appendChild(g);
          });

          // 创建容器
          const wrapper = document.createElement('div');
          wrapper.className = 'json-canvas-wrapper';
          wrapper.style.cssText = 'width: 100%; margin: 1rem 0; overflow-x: auto;';
          wrapper.appendChild(svg);

          // 替换原始 pre 元素
          preElement.parentNode.replaceChild(wrapper, preElement);

          console.log('[JSON Canvas] Rendered successfully');
        }
      } catch (error) {
        console.error('Failed to render JSON Canvas:', error);
        const preElement = block.closest('pre');
        if (preElement) {
          preElement.classList.add('json-canvas-error');
          preElement.title = `JSON Canvas rendering error: ${error instanceof Error ? error.message : String(error)}`;
        }
      }
    }
  };
}
