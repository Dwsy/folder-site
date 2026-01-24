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
          'data-content': node.value,  // 保存原始内容
          ...(autoRender && { 'data-auto-render': 'true' }),
        };

        data.hProperties = hProperties;
      }
    });
  };
};

export default remarkSvg;
