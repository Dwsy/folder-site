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
        
        // 保存原始内容到 data 属性
        const hProperties = {
          className: [className],
          'data-json-canvas': 'true',
          'data-content': node.value,  // 保存原始内容
          ...(autoRender && { 'data-auto-render': 'true' }),
        };

        data.hProperties = hProperties;
        
        // 不转换为 HTML，保持为 code 节点
        // 让 rehype 处理时应用 hProperties
      }
    });
  };
};

export default remarkJsonCanvas;
