import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeHighlight from 'rehype-highlight';
import rehypeStringify from 'rehype-stringify';

/**
 * Markdown processing options
 */
export interface MarkdownProcessorOptions {
  /**
   * Enable GitHub Flavored Markdown
   * @default true
   */
  gfm?: boolean;

  /**
   * Enable Math support
   * @default true
   */
  math?: boolean;

  /**
   * Enable syntax highlighting
   * @default true
   */
  highlight?: boolean;

  /**
   * Custom Shiki theme for code highlighting
   * @default 'github-dark'
   */
  highlightTheme?: string;
}

/**
 * Processing result
 */
export interface ProcessResult {
  /**
   * Generated HTML
   */
  html: string;

  /**
   * Processing metadata
   */
  metadata: {
    /**
     * Number of code blocks found
     */
    codeBlocks: number;

    /**
     * Number of math expressions found
     */
    mathExpressions: number;

    /**
     * Processing time in milliseconds
     */
    processingTime: number;
  };
}

/**
 * Process markdown content to HTML
 *
 * @param markdown - The markdown content to process
 * @param options - Processing options
 * @returns Processed HTML with metadata
 */
export async function processMarkdown(
  markdown: string,
  options: MarkdownProcessorOptions = {}
): Promise<ProcessResult> {
  const startTime = performance.now();

  const {
    gfm = true,
    math = true,
    highlight = true,
  } = options;

  const processor = unified()
    .use(remarkParse);

  if (gfm) {
    processor.use(remarkGfm);
  }

  if (math) {
    processor.use(remarkMath);
  }

  processor
    .use(remarkRehype, { allowDangerousHtml: true });

  if (highlight) {
    processor.use(rehypeHighlight);
  }

  processor.use(rehypeStringify, { allowDangerousHtml: true });

  try {
    const result = await processor.process(markdown);
    const html = String(result);

    // Count code blocks and math expressions
    const codeBlocks = (markdown.match(/```[\s\S]*?```/g) || []).length;
    const mathExpressions = (markdown.match(/\$\$[\s\S]*?\$\$|\$[^$\n]+?\$/g) || []).length;

    const processingTime = performance.now() - startTime;

    return {
      html,
      metadata: {
        codeBlocks,
        mathExpressions,
        processingTime,
      },
    };
  } catch (error) {
    throw new Error(`Failed to process markdown: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Create a reusable processor instance
 *
 * @param options - Processing options
 * @returns A processor function
 */
export function createMarkdownProcessor(options: MarkdownProcessorOptions = {}) {
  const opts = { gfm: true, math: true, highlight: true, ...options };

  return async (markdown: string): Promise<ProcessResult> => {
    const startTime = performance.now();

    const processor = unified()
      .use(remarkParse);

    if (opts.gfm) {
      processor.use(remarkGfm);
    }

    if (opts.math) {
      processor.use(remarkMath);
    }

    processor
      .use(remarkRehype, { allowDangerousHtml: true });

    if (opts.highlight) {
      processor.use(rehypeHighlight);
    }

    processor.use(rehypeStringify, { allowDangerousHtml: true });

    try {
      const result = await processor.process(markdown);
      const html = String(result);

      const codeBlocks = (markdown.match(/```[\s\S]*?```/g) || []).length;
      const mathExpressions = (markdown.match(/\$\$[\s\S]*?\$\$|\$[^$\n]+?\$/g) || []).length;

      const processingTime = performance.now() - startTime;

      return {
        html,
        metadata: {
          codeBlocks,
          mathExpressions,
          processingTime,
        },
      };
    } catch (error) {
      throw new Error(`Failed to process markdown: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
}

/**
 * Default processor with common plugins enabled
 */
export const defaultProcessor = createMarkdownProcessor({
  gfm: true,
  math: true,
  highlight: true,
});