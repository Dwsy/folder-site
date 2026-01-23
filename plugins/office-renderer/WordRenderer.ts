import { renderAsync } from 'docx-preview';
import type { RendererPlugin } from '../../types/plugin.js';

export interface WordRendererOptions {
  inWrapper?: boolean;
  useBase64URL?: boolean;
  showChanges?: boolean;
  ignoreFonts?: boolean;
  ignoreWidths?: boolean;
  breakPages?: boolean;
  experimental?: boolean;
  className?: string;
  trimXmlDeclaration?: boolean;
  useMathMLPolyfill?: boolean;
  showBorders?: boolean;
  ignoreLastRenderedPageBreak?: boolean;
  renderChanges?: boolean;
  renderHeaders?: boolean;
  renderFooters?: boolean;
  renderFootnotes?: boolean;
  renderEndnotes?: boolean;
}

export class WordRenderer implements RendererPlugin {
  name = 'word';
  version = '1.0.0';
  extensions = ['.docx', '.dotx'];
  pluginId = 'office-renderer';

  supports(extension: string): boolean {
    return this.extensions.includes(extension.toLowerCase());
  }

  async render(
    content: string | ArrayBuffer,
    options?: WordRendererOptions
  ): Promise<string> {
    const opts: WordRendererOptions = {
      inWrapper: true,
      useBase64URL: true,
      showChanges: false,
      ignoreFonts: false,
      ignoreWidths: false,
      breakPages: true,
      experimental: false,
      className: 'docx-wrapper',
      trimXmlDeclaration: true,
      useMathMLPolyfill: false,
      showBorders: false,
      ignoreLastRenderedPageBreak: false,
      renderChanges: false,
      renderHeaders: true,
      renderFooters: true,
      renderFootnotes: true,
      renderEndnotes: true,
      ...options,
    };

    let buffer: ArrayBuffer;

    if (typeof content === 'string') {
      try {
        buffer = Uint8Array.from(atob(content), (c) => c.charCodeAt(0)).buffer;
      } catch (error) {
        throw new Error(`Invalid base64 content: ${error instanceof Error ? error.message : String(error)}`);
      }
    } else {
      buffer = content;
    }

    try {
      const container = document.createElement('div');
      container.className = opts.className || 'docx-wrapper';

      await renderAsync(buffer, container, null, {
        inWrapper: opts.inWrapper,
        useBase64URL: opts.useBase64URL,
        showChanges: opts.showChanges,
        experimental: opts.experimental,
        trimXmlDeclaration: opts.trimXmlDeclaration,
        useMathMLPolyfill: opts.useMathMLPolyfill,
        renderChanges: opts.renderChanges,
        renderHeaders: opts.renderHeaders,
        renderFooters: opts.renderFooters,
        renderFootnotes: opts.renderFootnotes,
        renderEndnotes: opts.renderEndnotes,
      });

      return this.addContainerStyles(container.innerHTML);
    } catch (error) {
      throw new Error(
        `Failed to render Word document: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private addContainerStyles(html: string): string {
    return `<div class="word-document">${html}</div>`;
  }
}

export default WordRenderer;