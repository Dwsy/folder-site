/**
 * remark-dot - 处理 Markdown 中的 Graphviz DOT 代码块
 */

import type { Plugin } from 'unified';
import type { Root, Code } from 'mdast';
import { visit } from 'unist-util-visit';

export interface RemarkDotOptions {
  className?: string;
  autoRender?: boolean;
}

export const remarkDot: Plugin<[RemarkDotOptions?], Root> = (options = {}) => {
  const { className = 'dot', autoRender = true } = options;

  return (tree) => {
    visit(tree, 'code', (node: Code) => {
      if (node.lang === 'dot' || node.lang === 'graphviz') {
        const data = node.data || (node.data = {});
        
        const hProperties = {
          className: [className],
          'data-dot': 'true',
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

export default remarkDot;
