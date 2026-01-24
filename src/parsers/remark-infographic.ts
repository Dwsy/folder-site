/**
 * remark-infographic - 处理 Markdown 中的 Infographic 代码块
 * 
 * 将 ```infographic 代码块转换为可渲染的 HTML 结构
 */

import type { Plugin } from 'unified';
import type { Root, Code } from 'mdast';
import { visit } from 'unist-util-visit';

export interface RemarkInfographicOptions {
  /** Infographic 容器的 class 名称 */
  className?: string;
  /** 是否自动渲染 */
  autoRender?: boolean;
}

/**
 * remark 插件：处理 infographic 代码块
 */
export const remarkInfographic: Plugin<[RemarkInfographicOptions?], Root> = (options = {}) => {
  const {
    className = 'infographic',
    autoRender = true,
  } = options;

  return (tree) => {
    visit(tree, 'code', (node: Code) => {
      // 检查是否是 infographic 代码块
      if (node.lang === 'infographic') {
        // 转换为 HTML 节点
        const data = node.data || (node.data = {});
        const hProperties = {
          className: [className],
          'data-infographic': 'true',
          ...(autoRender && { 'data-auto-render': 'true' }),
        };

        // 替换为 HTML
        (node as any).type = 'html';
        node.value = `<pre class="${className}"><code>${escapeHtml(node.value)}</code></pre>`;
        data.hProperties = hProperties;
      }
    });
  };
};

/**
 * 转义 HTML
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export default remarkInfographic;
