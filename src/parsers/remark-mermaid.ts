/**
 * remark-mermaid - 处理 Markdown 中的 Mermaid 代码块
 * 
 * 将 ```mermaid 代码块转换为可渲染的 HTML 结构
 */

import type { Plugin } from 'unified';
import type { Root, Code } from 'mdast';
import { visit } from 'unist-util-visit';

export interface RemarkMermaidOptions {
  /** Mermaid 容器的 class 名称 */
  className?: string;
  /** 是否自动渲染 */
  autoRender?: boolean;
  /** Mermaid 配置 */
  mermaidConfig?: Record<string, unknown>;
}

/**
 * remark 插件：处理 mermaid 代码块
 */
export const remarkMermaid: Plugin<[RemarkMermaidOptions?], Root> = (options = {}) => {
  const {
    className = 'mermaid',
    autoRender = true,
    mermaidConfig = {},
  } = options;

  return (tree) => {
    visit(tree, 'code', (node: Code) => {
      // 检查是否是 mermaid 代码块
      if (node.lang === 'mermaid' || node.lang === 'mmd') {
        // 转换为 HTML 节点
        const data = node.data || (node.data = {});
        const hProperties = {
          className: [className],
          'data-mermaid': 'true',
          ...(autoRender && { 'data-auto-render': 'true' }),
          ...(Object.keys(mermaidConfig).length > 0 && {
            'data-config': JSON.stringify(mermaidConfig),
          }),
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

export default remarkMermaid;