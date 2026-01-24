/**
 * remark-json-canvas - 处理 JSON Canvas 代码块
 */

import type { Plugin } from 'unified';
import type { Root, Code } from 'mdast';
import { visit } from 'unist-util-visit';

export interface RemarkJsonCanvasOptions {
  className?: string;
  autoRender?: boolean;
}

export const remarkJsonCanvas: Plugin<[RemarkJsonCanvasOptions?], Root> = (options = {}) => {
  const { className = 'json-canvas', autoRender = true } = options;

  return (tree) => {
    visit(tree, 'code', (node: Code) => {
      if (node.lang === 'json-canvas' || node.lang === 'canvas') {
        const data = node.data || (node.data = {});
        
        const hProperties = {
          className: [className],
          'data-json-canvas': 'true',
          ...(autoRender && { 'data-auto-render': 'true' }),
        };

        (node as any).type = 'html';
        node.value = `<pre class="${className}"><code>${escapeHtml(node.value)}</code></pre>`;
        data.hProperties = hProperties;
      }
    });
  };
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export default remarkJsonCanvas;
