/**
 * remark-vega - 处理 Markdown 中的 Vega/Vega-Lite 代码块
 */

import type { Plugin } from 'unified';
import type { Root, Code } from 'mdast';
import { visit } from 'unist-util-visit';

export interface RemarkVegaOptions {
  className?: string;
  autoRender?: boolean;
}

export const remarkVega: Plugin<[RemarkVegaOptions?], Root> = (options = {}) => {
  const { className = 'vega', autoRender = true } = options;

  return (tree) => {
    visit(tree, 'code', (node: Code) => {
      if (node.lang === 'vega' || node.lang === 'vega-lite' || node.lang === 'vl') {
        const data = node.data || (node.data = {});
        const actualClassName = node.lang === 'vega' ? 'vega' : 'vega-lite';
        
        const hProperties = {
          className: [actualClassName],
          'data-vega': 'true',
          ...(autoRender && { 'data-auto-render': 'true' }),
        };

        (node as any).type = 'html';
        node.value = `<pre class="${actualClassName}"><code>${escapeHtml(node.value)}</code></pre>`;
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

export default remarkVega;
