/**
 * Plugin Loader
 *
 * Lazy loads heavy third-party libraries on demand
 * to reduce initial bundle size and improve load times
 */

let shikiHighlighter: any = null;
let docxPreview: any = null;
let antvG2: any = null;
let antvInfographic: any = null;
let vizJs: any = null;

/**
 * Load Shiki highlighter on demand
 */
export async function loadShiki() {
  if (shikiHighlighter) {
    return shikiHighlighter;
  }

  try {
    const { getHighlighter } = await import('../../../server/lib/highlighter.js');
    shikiHighlighter = getHighlighter();
    return shikiHighlighter;
  } catch (error) {
    console.error('Failed to load Shiki:', error);
    throw error;
  }
}

/**
 * Load docx-preview on demand
 */
export async function loadDocxPreview() {
  if (docxPreview) {
    return docxPreview;
  }

  try {
    const docxPreviewModule = await import('docx-preview');
    docxPreview = docxPreviewModule.default || docxPreviewModule;
    return docxPreview;
  } catch (error) {
    console.error('Failed to load docx-preview:', error);
    throw error;
  }
}

/**
 * Load @antv/g2 on demand
 */
export async function loadAntvG2() {
  if (antvG2) {
    return antvG2;
  }

  try {
    const g2 = await import('@antv/g2');
    antvG2 = g2;
    return g2;
  } catch (error) {
    console.error('Failed to load @antv/g2:', error);
    throw error;
  }
}

/**
 * Load @antv/infographic on demand
 */
export async function loadAntvInfographic() {
  if (antvInfographic) {
    return antvInfographic;
  }

  try {
    const infographic = await import('@antv/infographic');
    antvInfographic = infographic;
    return infographic;
  } catch (error) {
    console.error('Failed to load @antv/infographic:', error);
    throw error;
  }
}

/**
 * Load @viz-js/viz on demand
 */
export async function loadVizJs() {
  if (vizJs) {
    return vizJs;
  }

  try {
    const viz = await import('@viz-js/viz');
    vizJs = viz;
    return viz;
  } catch (error) {
    console.error('Failed to load @viz-js/viz:', error);
    throw error;
  }
}

/**
 * Prefetch commonly used libraries
 * Call this during idle time to pre-warm the cache
 */
export function prefetchCommonLibraries() {
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(() => {
      // Prefetch Shiki (commonly used)
      loadShiki().catch(() => {
        // Silently fail prefetch
      });
    });
  }
}

/**
 * Get loading status of libraries
 */
export function getLibraryLoadingStatus() {
  return {
    shiki: !!shikiHighlighter,
    docxPreview: !!docxPreview,
    antvG2: !!antvG2,
    antvInfographic: !!antvInfographic,
    vizJs: !!vizJs,
  };
}

/**
 * Clear cached libraries (useful for testing or memory management)
 */
export function clearLibraryCache() {
  shikiHighlighter = null;
  docxPreview = null;
  antvG2 = null;
  antvInfographic = null;
  vizJs = null;
}