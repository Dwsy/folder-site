/**
 * remark-svg - 处理 Markdown 中的 SVG 代码块
 */

import type { Plugin } from 'unified';
import type { Root, Code } from 'mdast';
import { visit } from 'unist-util-visit';

export interface RemarkSvgOptions {
  className?: string;
  autoRender?: boolean;
}

export const remarkSvg: Plugin<[RemarkSvgOptions?], Root> = (options = {}) => {
  const { className = 'svg', autoRender = true } = options;

  return (tree) => {
    visit(tree, 'code', (node: Code) => {
      if (node.lang === 'svg') {
        // 转换为 HTML 节点（像 Mermaid 一样）
        (node as any).type = 'html';
        node.value = `<pre class="${className}" data-svg="true" data-content="${escapeAttr(node.value)}"><code>${escapeHtml(node.value)}</code></pre>`;
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

function escapeAttr(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '&#10;')
    .replace(/\r/g, '&#13;');
}

export default remarkSvg;
