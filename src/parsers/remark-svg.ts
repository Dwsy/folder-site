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
        const data = node.data || (node.data = {});
        
        const hProperties = {
          className: [className],
          'data-svg': 'true',
          ...(autoRender && { 'data-auto-render': 'true' }),
        };

        // 直接输出 SVG（不转义）
        (node as any).type = 'html';
        node.value = `<div class="svg-wrapper">${node.value}</div>`;
        data.hProperties = hProperties;
      }
    });
  };
};

export default remarkSvg;
