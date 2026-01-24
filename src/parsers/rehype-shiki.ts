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
          // Extract only the inner content, remove outer <pre> tag
          const match = html.match(/<pre[^>]*>([\s\S]*)<\/pre>/);
          const innerHtml = match ? match[1] : html;
          return { node, html: innerHtml, lang, code };
        } catch (err) {
          console.error(`Failed to highlight code (lang: ${lang}):`, err);
          // Return fallback HTML without pre tag
          return { node, html: `<code>${escapeHtml(code)}</code>`, lang, code };
        }
      })
    );

    // Update the tree with highlighted code
    for (let i = 0; i < highlightResults.length; i++) {
      const { node, html, lang, code } = highlightResults[i];
      
      // Create wrapper with language badge and copy button
      const wrapperHtml = `<div class="code-block-wrapper group relative rounded-lg overflow-hidden border bg-muted/30" data-language="${escapeHtml(lang)}">
  <div class="code-block-header flex items-center justify-between gap-2 px-4 py-2 border-b bg-muted/50">
    <div class="flex items-center gap-2 min-w-0">${lang && lang !== 'plaintext' && lang !== 'text' ? `
      <div class="code-language-badge flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 text-primary border border-primary/20">
        <span class="code-language-icon flex items-center justify-center" data-lang="${escapeHtml(lang)}" style="width: 16px; height: 16px;"></span>
        <span class="text-xs font-mono font-medium uppercase whitespace-nowrap">${escapeHtml(lang)}</span>
      </div>` : ''}
    </div>
    <button class="code-copy-button flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm transition-all hover:bg-background border shrink-0" data-code="${escapeHtml(code).replace(/"/g, '&quot;')}" onclick="const btn=this;const code=btn.getAttribute('data-code');const unescapeHtml=(str)=>{const textarea=document.createElement('textarea');textarea.innerHTML=str;return textarea.value;};navigator.clipboard.writeText(unescapeHtml(code)).then(()=>{btn.classList.add('copied');btn.innerHTML='<svg class=\\'h-4 w-4\\' fill=\\'none\\' viewBox=\\'0 0 24 24\\' stroke=\\'currentColor\\'><path stroke-linecap=\\'round\\' stroke-linejoin=\\'round\\' stroke-width=\\'2\\' d=\\'M5 13l4 4L19 7\\'/></svg><span class=\\'hidden sm:inline whitespace-nowrap\\'>已复制</span>';setTimeout(()=>{btn.classList.remove('copied');btn.innerHTML='<svg class=\\'h-4 w-4\\' fill=\\'none\\' viewBox=\\'0 0 24 24\\' stroke=\\'currentColor\\'><path stroke-linecap=\\'round\\' stroke-linejoin=\\'round\\' stroke-width=\\'2\\' d=\\'M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z\\'/></svg><span class=\\'hidden sm:inline whitespace-nowrap\\'>复制</span>';},2000);}).catch(err=>{console.error('复制失败:',err);});" title="复制代码">
      <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
      <span class="hidden sm:inline whitespace-nowrap">复制</span>
    </button>
  </div>
  <pre class="code-block-content">${html}</pre>
</div>`;
      
      // Replace the original pre element with the enhanced wrapper
      node.children = [{
        type: 'raw',
        value: wrapperHtml,
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