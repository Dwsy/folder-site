/**
 * HTML Exporter Service
 * 
 * Core service for exporting Markdown content to HTML format.
 * Supports:
 * - Markdown to HTML conversion
 * - Theme support
 * - Code syntax highlighting
 * - Tables, lists, and other GFM features
 * - Custom styling
 * - Table of contents generation
 */

import type {
  HTMLExportOptions,
  HTMLExportResult,
  HTMLExportProgress,
  HTMLExportState,
  HTMLDocumentStructure,
  HTMLContentElement,
  HTMLStyleConfig,
  HTMLTOCEntry,
} from '../../types/html-export.js';
import {
  DEFAULT_HTML_EXPORT_OPTIONS,
  validateHTMLExportOptions,
  createDefaultHTMLStyleConfig,
  generateHeadingId,
  escapeHTML,
  minifyHTML,
} from '../../types/html-export.js';
import { getDefaultTheme } from './theme.js';

/**
 * HTML Exporter Class
 * 
 * Main class for HTML export functionality
 */
export class HTMLExporter {
  private options: Required<HTMLExportOptions>;
  private styleConfig: HTMLStyleConfig;
  private progressCallback?: (progress: HTMLExportProgress) => void;

  constructor(options: Partial<HTMLExportOptions> = {}) {
    // Validate options
    const validation = validateHTMLExportOptions(options);
    if (!validation.valid) {
      throw new Error(`Invalid HTML export options: ${validation.errors.join(', ')}`);
    }

    // Merge with defaults
    this.options = {
      ...DEFAULT_HTML_EXPORT_OPTIONS,
      ...options,
      themePalette: options.themePalette ?? getDefaultTheme(options.theme ?? 'light'),
    } as Required<HTMLExportOptions>;

    // Create style configuration
    this.styleConfig = createDefaultHTMLStyleConfig(
      this.options.theme,
      this.options.themePalette
    );
  }

  /**
   * Set progress callback
   */
  onProgress(callback: (progress: HTMLExportProgress) => void): void {
    this.progressCallback = callback;
  }

  /**
   * Report progress
   */
  private reportProgress(state: HTMLExportState, progress: number, message?: string): void {
    if (this.progressCallback) {
      this.progressCallback({ state, progress, message });
    }
  }

  /**
   * Export Markdown content to HTML
   */
  async exportMarkdown(
    content: string,
    _filename?: string
  ): Promise<HTMLExportResult> {
    const startTime = Date.now();

    try {
      this.reportProgress('preparing', 0, 'Preparing document...');

      // Parse markdown to document structure
      this.reportProgress('preparing', 20, 'Parsing markdown...');
      const structure = this.parseMarkdownToStructure(content);

      this.reportProgress('rendering', 40, 'Generating HTML...');

      // Generate HTML content
      const htmlContent = await this.generateHTML(structure);

      this.reportProgress('generating', 80, 'Building document...');

      // Wrap in complete HTML document
      const fullHTML = this.wrapInDocument(htmlContent, structure);

      // Minify if enabled
      const finalHTML = this.options.minify ? minifyHTML(fullHTML) : fullHTML;

      this.reportProgress('complete', 100, 'Export complete');

      const duration = Date.now() - startTime;
      const size = new Blob([finalHTML]).size;

      return {
        success: true,
        content: finalHTML,
        size,
        duration,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.reportProgress('error', 0, errorMessage);

      return {
        success: false,
        error: errorMessage,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Export as downloadable HTML blob
   */
  async exportAsBlob(
    content: string,
    filename?: string
  ): Promise<{ blob: Blob; url: string; filename: string }> {
    const result = await this.exportMarkdown(content, filename);

    if (!result.success || !result.content) {
      throw new Error(result.error || 'Failed to generate HTML');
    }

    const blob = new Blob([result.content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const defaultFilename = filename || 'document.html';

    return {
      blob,
      url,
      filename: defaultFilename,
    };
  }

  /**
   * Download HTML
   */
  async downloadHTML(content: string, filename: string = 'document.html'): Promise<void> {
    const result = await this.exportMarkdown(content, filename);

    if (!result.success || !result.content) {
      throw new Error(result.error || 'Failed to generate HTML');
    }

    // Create download link
    const blob = new Blob([result.content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Parse Markdown to document structure
   */
  private parseMarkdownToStructure(content: string): HTMLDocumentStructure {
    const elements: HTMLContentElement[] = [];
    const lines = content.split('\n');
    let currentElement: HTMLContentElement | null = null;
    let inCodeBlock = false;
    let codeBlockContent: string[] = [];
    let codeBlockLanguage = '';
    let inList = false;
    let listItems: HTMLContentElement[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;

      // Code block detection
      if (line.startsWith('```')) {
        if (!inCodeBlock) {
          // Start code block
          if (currentElement) {
            elements.push(currentElement);
          }
          inCodeBlock = true;
          codeBlockLanguage = line.slice(3).trim();
          codeBlockContent = [];
          currentElement = null;
        } else {
          // End code block
          inCodeBlock = false;
          elements.push({
            type: 'code',
            content: codeBlockContent.join('\n'),
            language: codeBlockLanguage || 'text',
          });
          codeBlockContent = [];
          codeBlockLanguage = '';
        }
        continue;
      }

      if (inCodeBlock) {
        codeBlockContent.push(line);
        continue;
      }

      // Heading detection
      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch) {
        if (currentElement) {
          elements.push(currentElement);
        }
        elements.push({
          type: 'heading',
          content: headingMatch[2] || '',
          level: headingMatch[1]?.length || 1,
        });
        currentElement = null;
        continue;
      }

      // Horizontal rule
      if (line.match(/^(-{3,}|\*{3,}|_{3,})$/)) {
        if (currentElement) {
          elements.push(currentElement);
        }
        elements.push({
          type: 'hr',
          content: '',
        });
        currentElement = null;
        continue;
      }

      // Blockquote
      if (line.startsWith('> ')) {
        if (currentElement) {
          elements.push(currentElement);
        }
        elements.push({
          type: 'blockquote',
          content: line.slice(2),
        });
        currentElement = null;
        continue;
      }

      // List item
      const listMatch = line.match(/^[\s]*[-*+]\s+(.+)$/);
      const numberedMatch = line.match(/^[\s]*\d+\.\s+(.+)$/);
      if (listMatch || numberedMatch) {
        const listContent = (listMatch ? listMatch[1] : numberedMatch?.[1]) || '';
        if (currentElement) {
          elements.push(currentElement);
        }
        listItems.push({
          type: 'list',
          content: listContent,
          attributes: {
            ordered: numberedMatch ? 'true' : 'false',
          },
        });
        currentElement = null;
        inList = true;
        continue;
      }

      // Empty line
      if (line.trim() === '') {
        if (inList && listItems.length > 0) {
          elements.push({
            type: 'list',
            content: '',
            children: listItems,
          });
          listItems = [];
          inList = false;
        }
        if (currentElement) {
          elements.push(currentElement);
        }
        currentElement = null;
        continue;
      }

      // Regular paragraph
      if (currentElement) {
        elements.push(currentElement);
      }
      currentElement = {
        type: 'paragraph',
        content: line,
      };
    }

    // Handle remaining elements
    if (inList && listItems.length > 0) {
      elements.push({
        type: 'list',
        content: '',
        children: listItems,
      });
    }
    if (currentElement) {
      elements.push(currentElement);
    }

    // Extract title from first heading or content
    const title = this.extractTitle(elements, content);

    // Generate TOC if enabled
    let toc: HTMLTOCEntry[] = [];
    if (this.options.includeTOC) {
      toc = this.generateTOC(elements);
    }

    return {
      title,
      lang: this.options.lang || 'en',
      metadata: {
        creationDate: new Date(),
      },
      toc,
      content: elements,
    };
  }

  /**
   * Extract title from content
   */
  private extractTitle(elements: HTMLContentElement[], content: string): string {
    // First H1 takes precedence
    const firstH1 = elements.find(el => el.type === 'heading' && el.level === 1);
    if (firstH1) {
      return firstH1.content;
    }

    // First line of content
    const firstLine = content.split('\n').find(line => line.trim());
    if (firstLine) {
      return firstLine.slice(0, 100);
    }

    // Default
    return 'Untitled Document';
  }

  /**
   * Generate table of contents
   */
  private generateTOC(elements: HTMLContentElement[]): HTMLTOCEntry[] {
    const toc: HTMLTOCEntry[] = [];
    const stack: HTMLTOCEntry[] = [];

    for (const element of elements) {
      if (element.type === 'heading' && (element.level || 0) <= this.options.tocMaxDepth) {
        const entry: HTMLTOCEntry = {
          title: element.content,
          level: element.level || 1,
          id: generateHeadingId(element.content),
        };

        // Handle nested structure
        while (stack.length > 0 && (stack[stack.length - 1]?.level || 0) >= entry.level) {
          stack.pop();
        }

        if (stack.length === 0) {
          toc.push(entry);
        } else {
          const parent = stack[stack.length - 1];
          if (parent) {
            if (!parent.children) {
              parent.children = [];
            }
            parent.children.push(entry);
          }
        }

        stack.push(entry);
      }
    }

    return toc;
  }

  /**
   * Generate HTML content from structure
   */
  private async generateHTML(structure: HTMLDocumentStructure): Promise<string> {
    const parts: string[] = [];

    // Generate TOC if present
    if (structure.toc && structure.toc.length > 0) {
      parts.push(this.generateTOCHTML(structure.toc));
    }

    // Generate content
    for (const element of structure.content) {
      parts.push(this.renderElement(element));
    }

    return parts.join('\n');
  }

  /**
   * Generate TOC HTML
   */
  private generateTOCHTML(toc: HTMLTOCEntry[]): string {
    const renderEntry = (entry: HTMLTOCEntry): string => {
      const children = entry.children && entry.children.length > 0;
      const indent = (entry.level - 1) * 20;

      let html = `<li class="${this.options.cssPrefix}toc-item" style="margin-left: ${indent}px">
        <a href="#${entry.id}" class="${this.options.cssPrefix}toc-link">${escapeHTML(entry.title)}</a>`;

      if (children && entry.children) {
        html += `\n<ul class="${this.options.cssPrefix}toc-list">`;
        for (const child of entry.children) {
          html += '\n' + renderEntry(child);
        }
        html += '\n</ul>';
      }

      html += '</li>';
      return html;
    };

    return `<nav class="${this.options.cssPrefix}toc" aria-label="Table of contents">
  <h2 class="${this.options.cssPrefix}toc-title">Table of Contents</h2>
  <ul class="${this.options.cssPrefix}toc-list">
${toc.map(entry => '  ' + renderEntry(entry)).join('\n')}
  </ul>
</nav>`;
  }

  /**
   * Render a content element to HTML
   */
  private renderElement(element: HTMLContentElement): string {
    switch (element.type) {
      case 'heading':
        return this.renderHeading(element);
      case 'paragraph':
        return this.renderParagraph(element);
      case 'code':
        return this.renderCodeBlock(element);
      case 'list':
        return this.renderList(element);
      case 'blockquote':
        return this.renderBlockquote(element);
      case 'hr':
        return this.renderHorizontalRule();
      default:
        return this.renderParagraph(element);
    }
  }

  /**
   * Render heading
   */
  private renderHeading(element: HTMLContentElement): string {
    const level = element.level || 1;
    const id = generateHeadingId(element.content);
    const styles = this.styleConfig.headingStyles[`h${level}` as keyof typeof this.styleConfig.headingStyles];

    const style = this.options.inlineStyles
      ? `style="font-size: ${styles.fontSize}; color: ${styles.color}; margin: ${styles.margin};"`
      : `class="${this.options.cssPrefix}heading-${level}"`;

    return `<h${level} id="${id}" ${style}>${escapeHTML(element.content)}</h${level}>`;
  }

  /**
   * Render paragraph
   */
  private renderParagraph(element: HTMLContentElement): string {
    return `<p>${this.renderInlineContent(element.content)}</p>`;
  }

  /**
   * Render inline content (with inline elements)
   */
  private renderInlineContent(content: string): string {
    // Escape first
    let result = escapeHTML(content);

    // Code inline
    result = result.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Bold
    result = result.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    result = result.replace(/__([^_]+)__/g, '<strong>$1</strong>');

    // Italic
    result = result.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    result = result.replace(/_([^_]+)_/g, '<em>$1</em>');

    // Strikethrough
    result = result.replace(/~~([^~]+)~~/g, '<del>$1</del>');

    // Links
    result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="${this.options.cssPrefix}link">$1</a>');

    return result;
  }

  /**
   * Render code block
   */
  private renderCodeBlock(element: HTMLContentElement): string {
    const language = element.language || 'text';
    const lineNumbers = this.options.includeLineNumbers ? 'line-numbers' : '';
    const style = this.options.inlineStyles
      ? `style="background-color: ${this.styleConfig.codeStyles.backgroundColor}; color: ${this.styleConfig.codeStyles.textColor}; font-family: ${this.styleConfig.codeStyles.fontFamily}; font-size: ${this.styleConfig.codeStyles.fontSize}; padding: ${this.styleConfig.codeStyles.padding}; border-radius: ${this.styleConfig.codeStyles.borderRadius};"`
      : `class="${this.options.cssPrefix}code-block ${lineNumbers}"`;

    return `<pre ${style}><code class="language-${language}">${escapeHTML(element.content)}</code></pre>`;
  }

  /**
   * Render list
   */
  private renderList(element: HTMLContentElement): string {
    // Check if it's an ordered list using attributes or content check
    const isOrdered = element.attributes?.ordered === 'true' || /^\d+\.\s/.test(element.content);
    const Tag = isOrdered ? 'ol' : 'ul';
    const style = this.options.inlineStyles
      ? `style="padding-left: ${this.styleConfig.listStyles.paddingLeft};"`
      : `class="${this.options.cssPrefix}list"`;

    if (element.children && element.children.length > 0) {
      return `<${Tag} ${style}>
${element.children.map(child => `  <li>${this.renderInlineContent(child.content)}</li>`).join('\n')}
</${Tag}>`;
    }

    return `<${Tag} ${style}><li>${this.renderInlineContent(element.content)}</li></${Tag}>`;
  }

  /**
   * Render blockquote
   */
  private renderBlockquote(element: HTMLContentElement): string {
    const style = this.options.inlineStyles
      ? `style="border-left: ${this.styleConfig.blockquoteStyles.borderLeft}; padding-left: ${this.styleConfig.blockquoteStyles.paddingLeft}; color: ${this.styleConfig.blockquoteStyles.color}; font-style: ${this.styleConfig.blockquoteStyles.fontStyle};"`
      : `class="${this.options.cssPrefix}blockquote"`;

    return `<blockquote ${style}>${this.renderInlineContent(element.content)}</blockquote>`;
  }

  /**
   * Render horizontal rule
   */
  private renderHorizontalRule(): string {
    return '<hr class="' + this.options.cssPrefix + 'hr" />';
  }

  /**
   * Wrap content in complete HTML document
   */
  private wrapInDocument(content: string, structure: HTMLDocumentStructure): string {
    // Priority: options.title > structure.title > 'Untitled Document'
    const title = this.options.title || structure.title || 'Untitled Document';
    const lang = structure.lang || this.options.lang || 'en';

    // Generate theme CSS
    const themeCSS = this.options.includeThemeStyles
      ? this.generateThemeCSS()
      : '';

    // Generate code styles
    const codeCSS = this.options.includeCodeStyles
      ? this.generateCodeCSS()
      : '';

    // Combine CSS
    const css = [themeCSS, codeCSS, this.options.additionalCSS || '']
      .filter(Boolean)
      .join('\n');

    // Build head
    const head = `<meta charset="${this.options.encoding}">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHTML(title)}</title>
${structure.metadata?.author ? `<meta name="author" content="${escapeHTML(structure.metadata.author)}">` : ''}
${structure.metadata?.description ? `<meta name="description" content="${escapeHTML(structure.metadata.description)}">` : ''}
${structure.metadata?.keywords?.length ? `<meta name="keywords" content="${structure.metadata.keywords.join(', ')}">` : ''}
<style>
${css}
</style>
${this.options.enableMath ? '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">' : ''}
${this.options.enableDownloadLinks ? this.generateDownloadScript() : ''}`;

    // Build body
    const body = `<main class="${this.options.cssPrefix}container">
${content}
</main>`;

    // Build complete document
    return `<!DOCTYPE html>
<html lang="${lang}">
<head>
${head}
</head>
<body class="${this.options.cssPrefix}body">
${body}
</body>
</html>`;
  }

  /**
   * Generate theme CSS
   */
  private generateThemeCSS(): string {
    const p = this.styleConfig.themePalette;
    const prefix = this.options.cssPrefix;

    return `/* Theme: ${this.options.theme} */
:root {
  --${prefix}background: ${p.background};
  --${prefix}foreground: ${p.foreground};
  --${prefix}primary: ${p.primary};
  --${prefix}secondary: ${p.secondary};
  --${prefix}text: ${p.text};
  --${prefix}muted: ${p.muted};
  --${prefix}accent: ${p.accent};
  --${prefix}border: ${p.border};
  --${prefix}success: ${p.success};
  --${prefix}warning: ${p.warning};
  --${prefix}error: ${p.error};
}

.${prefix}body {
  background-color: var(--${prefix}background);
  color: var(--${prefix}text);
  font-family: ${this.styleConfig.bodyStyles.fontFamily};
  font-size: ${this.styleConfig.bodyStyles.fontSize};
  line-height: ${this.styleConfig.bodyStyles.lineHeight};
  margin: ${this.styleConfig.bodyStyles.margin};
  padding: ${this.styleConfig.bodyStyles.padding};
}

.${prefix}container {
  max-width: 800px;
  margin: 0 auto;
}

.${prefix}heading-1 { font-size: ${this.styleConfig.headingStyles.h1.fontSize}; color: ${this.styleConfig.headingStyles.h1.color}; margin: ${this.styleConfig.headingStyles.h1.margin}; }
.${prefix}heading-2 { font-size: ${this.styleConfig.headingStyles.h2.fontSize}; color: ${this.styleConfig.headingStyles.h2.color}; margin: ${this.styleConfig.headingStyles.h2.margin}; }
.${prefix}heading-3 { font-size: ${this.styleConfig.headingStyles.h3.fontSize}; color: ${this.styleConfig.headingStyles.h3.color}; margin: ${this.styleConfig.headingStyles.h3.margin}; }
.${prefix}heading-4 { font-size: ${this.styleConfig.headingStyles.h4.fontSize}; color: ${this.styleConfig.headingStyles.h4.color}; margin: ${this.styleConfig.headingStyles.h4.margin}; }
.${prefix}heading-5 { font-size: ${this.styleConfig.headingStyles.h5.fontSize}; color: ${this.styleConfig.headingStyles.h5.color}; margin: ${this.styleConfig.headingStyles.h5.margin}; }
.${prefix}heading-6 { font-size: ${this.styleConfig.headingStyles.h6.fontSize}; color: ${this.styleConfig.headingStyles.h6.color}; margin: ${this.styleConfig.headingStyles.h6.margin}; }

.${prefix}p {
  margin: 1em 0;
}

.${prefix}link {
  color: var(--${prefix}primary);
  text-decoration: none;
}

.${prefix}link:hover {
  text-decoration: underline;
}

.${prefix}blockquote {
  border-left: 4px solid var(--${prefix}primary);
  padding-left: 1rem;
  color: var(--${prefix}secondary);
  font-style: italic;
  margin: 1em 0;
}

.${prefix}hr {
  border: none;
  border-top: 1px solid var(--${prefix}border);
  margin: 2em 0;
}

.${prefix}list {
  padding-left: 2rem;
  margin: 1em 0;
}

.${prefix}toc {
  background: var(--${prefix}muted);
  padding: 1rem;
  border-radius: 4px;
  margin: 1em 0;
}

.${prefix}toc-title {
  margin: 0 0 1rem;
  font-size: 1.2em;
}

.${prefix}toc-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.${prefix}toc-item {
  margin: 0.5em 0;
}

.${prefix}toc-link {
  color: var(--${prefix}text);
  text-decoration: none;
}

.${prefix}toc-link:hover {
  color: var(--${prefix}primary);
}`;
  }

  /**
   * Generate code block CSS
   */
  private generateCodeCSS(): string {
    const prefix = this.options.cssPrefix;
    const cs = this.styleConfig.codeStyles;

    return `/* Code Block Styles */
.${prefix}code-block {
  background-color: ${cs.backgroundColor};
  color: ${cs.textColor};
  font-family: ${cs.fontFamily};
  font-size: ${cs.fontSize};
  padding: ${cs.padding};
  border-radius: ${cs.borderRadius};
  overflow-x: auto;
  margin: 1em 0;
}

.${prefix}code-block code {
  font-family: inherit;
  background: none;
  padding: 0;
}

.${prefix}code-block.line-numbers {
  counter-reset: line;
}

.${prefix}code-block.line-numbers code::before {
  counter-increment: line;
  content: counter(line);
  display: inline-block;
  width: 2em;
  margin-right: 1em;
  text-align: right;
  color: var(--${prefix}muted);
}`;
  }

  /**
   * Generate download script for enabling download links
   */
  private generateDownloadScript(): string {
    return `<script>
(function() {
  document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      var target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
})();
</script>`;
  }
}

/**
 * Export Markdown to HTML (convenience function)
 */
export async function exportMarkdownToHTML(
  content: string,
  options: Partial<HTMLExportOptions> = {}
): Promise<HTMLExportResult> {
  const exporter = new HTMLExporter(options);
  return exporter.exportMarkdown(content);
}

/**
 * Download Markdown as HTML (convenience function)
 */
export async function downloadMarkdownAsHTML(
  content: string,
  filename: string = 'document.html',
  options: Partial<HTMLExportOptions> = {}
): Promise<void> {
  const exporter = new HTMLExporter(options);
  return exporter.downloadHTML(content, filename);
}

/**
 * Export Markdown as HTML blob (convenience function)
 */
export async function exportMarkdownAsBlob(
  content: string,
  options: Partial<HTMLExportOptions> = {}
): Promise<{ blob: Blob; url: string; filename: string }> {
  const exporter = new HTMLExporter(options);
  return exporter.exportAsBlob(content);
}
