import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeHighlight from 'rehype-highlight';
import rehypeStringify from 'rehype-stringify';
import { statSync } from 'fs';
import { resolve } from 'path';
import { CacheWrapper } from '../lib/render-cache.js';

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

  /**
   * Enable caching
   * @default true
   */
  enableCache?: boolean;

  /**
   * File path for cache invalidation
   */
  filePath?: string;
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

    /**
     * Whether the result was retrieved from cache
     */
    cached?: boolean;
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

/**
 * Global cache wrapper instance
 */
let globalCacheWrapper: CacheWrapper | undefined;

/**
 * Get or create the global cache wrapper
 * 
 * @returns Cache wrapper instance
 */
export function getGlobalCacheWrapper(): CacheWrapper {
  if (!globalCacheWrapper) {
    const { defaultCacheWrapper } = require('../lib/render-cache');
    globalCacheWrapper = defaultCacheWrapper;
  }
  return globalCacheWrapper!;
}

/**
 * Set the global cache wrapper
 * 
 * @param cache - Cache wrapper instance
 */
export function setGlobalCacheWrapper(cache: CacheWrapper): void {
  globalCacheWrapper = cache;
}

/**
 * Process markdown content with caching support
 * 
 * This function extends processMarkdown with automatic caching.
 * Cache is keyed by file path and processing options.
 * 
 * @param markdown - The markdown content to process
 * @param options - Processing options
 * @returns Processed HTML with metadata
 */
export async function processMarkdownWithCache(
  markdown: string,
  options: MarkdownProcessorOptions = {}
): Promise<ProcessResult> {
  const {
    enableCache = true,
    filePath,
    ...processorOptions
  } = options;

  // If caching is disabled or no file path provided, process directly
  if (!enableCache || !filePath) {
    return processMarkdown(markdown, processorOptions);
  }

  const cache = getGlobalCacheWrapper();

  try {
    // Get file modification time for cache validation
    const absolutePath = resolve(filePath);
    const fileMtime = statSync(absolutePath).mtimeMs;

    // Check cache
    const cachedEntry = cache.get(absolutePath, processorOptions);

    if (cachedEntry) {
      return {
        html: cachedEntry.html,
        metadata: {
          ...cachedEntry.metadata,
          processingTime: cachedEntry.metadata.processingTime,
          cached: true,
        },
      };
    }

    // Process markdown
    const result = await processMarkdown(markdown, processorOptions);

    // Cache the result
    cache.set(
      absolutePath,
      result.html,
      result.metadata,
      fileMtime,
      processorOptions
    );

    return {
      ...result,
      metadata: {
        ...result.metadata,
        cached: false,
      },
    };
  } catch (error) {
    // If cache fails, fall back to direct processing
    return processMarkdown(markdown, processorOptions);
  }
}

/**
 * Invalidate cache for a specific file
 * 
 * @param filePath - File path to invalidate
 * @returns Number of invalidated cache entries
 */
export function invalidateFileCache(filePath: string): number {
  const cache = getGlobalCacheWrapper();
  const absolutePath = resolve(filePath);
  return cache.invalidate(absolutePath);
}

/**
 * Invalidate all expired cache entries
 * 
 * @returns Number of invalidated cache entries
 */
export function invalidateExpiredCache(): number {
  const cache = getGlobalCacheWrapper();
  return cache.invalidateExpired();
}

/**
 * Clear all cache
 */
export function clearCache(): void {
  const cache = getGlobalCacheWrapper();
  cache.clear();
}

/**
 * Get cache statistics
 * 
 * @returns Cache statistics
 */
export function getCacheStatistics() {
  const cache = getGlobalCacheWrapper();
  return cache.getStatistics();
}