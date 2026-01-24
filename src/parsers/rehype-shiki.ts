/**
 * Rehype plugin for Shiki syntax highlighting
 */

import type { Plugin } from 'unified';
import type { Root, Element } from 'hast';
import { visit } from 'unist-util-visit';
import { getHighlighter } from '../server/lib/highlighter.js';

export interface RehypeShikiOptions {
  /** Theme name (github-dark, github-light, monokai, etc.) */
  theme?: string;
  /** Language to use if none is specified */
  defaultLanguage?: string;
  /** Languages to skip (handled by other plugins) */
  skipLanguages?: string[];
}

interface CodeBlock {
  node: Element;
  lang: string;
  code: string;
}

// 默认跳过的语言（由其他插件处理）
const DEFAULT_SKIP_LANGUAGES = [
  'mermaid',
  'mmd',
  'vega',
  'vega-lite',
  'vl',
  'dot',
  'graphviz',
  'infographic',
  'svg',
  'html',
  'json-canvas',
  'canvas',
  'math',
  'latex',
  'tex',
];

/**
 * Rehype plugin to apply Shiki syntax highlighting to code blocks
 */
export const rehypeShiki: Plugin<[RehypeShikiOptions?], Root> = (options = {}) => {
  const { 
    theme = 'github-dark', 
    defaultLanguage = 'plaintext',
    skipLanguages = DEFAULT_SKIP_LANGUAGES,
  } = options;

  return async (tree) => {
    const highlighter = getHighlighter();
    
    // Collect all code blocks to highlight
    const codeBlocks: CodeBlock[] = [];
    
    visit(tree, 'element', (node: Element) => {
      if (node.tagName !== 'pre' || !node.children || node.children.length === 0) {
        return;
      }

      const codeNode = node.children[0];
      if (!codeNode || codeNode.type !== 'element' || codeNode.tagName !== 'code') {
        return;
      }

      // Get language from className
      const className = Array.isArray(codeNode.properties?.className)
        ? codeNode.properties.className
        : [];
      
      const langClass = className.find((c: string | number) => typeof c === 'string' && c.startsWith('language-'));
      const lang = langClass && typeof langClass === 'string' ? langClass.replace('language-', '') : defaultLanguage;

      // Skip languages handled by other plugins
      if (skipLanguages.includes(lang)) {
        console.log(`[rehype-shiki] Skipping language: ${lang} (handled by plugin)`);
        return;
      }

      // Get code text
      const codeText = codeNode.children
        .map((child: any) => (child.type === 'text' ? child.value : ''))
        .join('');

      codeBlocks.push({
        node,
        lang,
        code: codeText,
      });
    });

    // Highlight all code blocks in parallel
    const highlightResults = await Promise.all(
      codeBlocks.map(async ({ node, lang, code }) => {
        try {
          const html = await highlighter.codeToHtml(code, { lang: lang as any, theme: theme as any });
          return { node, html };
        } catch (err) {
          console.error(`Failed to highlight code (lang: ${lang}):`, err);
          // Return fallback HTML
          return { node, html: `<pre><code>${escapeHtml(code)}</code></pre>` };
        }
      })
    );

    // Update the tree with highlighted code
    for (const { node, html } of highlightResults) {
      // Replace the original pre element with the highlighted one
      node.children = [{
        type: 'element',
        tagName: 'div',
        properties: { className: ['shiki-wrapper'] },
        children: [{
          type: 'raw',
          value: html,
        }]
      }];
    }
  };
};

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export default rehypeShiki;