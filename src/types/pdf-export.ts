/**
 * PDF Export Types
 * 
 * Type definitions for PDF export functionality
 */

import type { ThemeMode, ThemePalette } from './theme.js';

/**
 * PDF export options
 */
export interface PDFExportOptions {
  /** Document title */
  title?: string;
  /** Document author */
  author?: string;
  /** Document subject */
  subject?: string;
  /** Document keywords */
  keywords?: string[];
  /** Page format (default: 'a4') */
  format?: 'a4' | 'letter' | 'legal';
  /** Page orientation (default: 'portrait') */
  orientation?: 'portrait' | 'landscape';
  /** Theme mode for styling */
  theme?: ThemeMode;
  /** Custom theme palette */
  themePalette?: ThemePalette;
  /** Include table of contents */
  includeTOC?: boolean;
  /** Include page numbers */
  includePageNumbers?: boolean;
  /** Include header */
  includeHeader?: boolean;
  /** Include footer */
  includeFooter?: boolean;
  /** Header text */
  headerText?: string;
  /** Footer text */
  footerText?: string;
  /** Font family */
  fontFamily?: string;
  /** Font size (default: 12) */
  fontSize?: number;
  /** Line height (default: 1.5) */
  lineHeight?: number;
  /** Margin (in mm) */
  margin?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  /** Enable syntax highlighting for code blocks */
  enableCodeHighlight?: boolean;
  /** Enable math rendering */
  enableMath?: boolean;
  /** Enable GFM features */
  enableGfm?: boolean;
  /** Compress PDF */
  compress?: boolean;
}

/**
 * Default PDF export options
 */
export const DEFAULT_PDF_EXPORT_OPTIONS: Required<Omit<PDFExportOptions, 'title' | 'author' | 'subject' | 'keywords' | 'headerText' | 'footerText' | 'themePalette'>> = {
  format: 'a4',
  orientation: 'portrait',
  theme: 'light',
  includeTOC: false,
  includePageNumbers: true,
  includeHeader: false,
  includeFooter: true,
  fontFamily: 'helvetica',
  fontSize: 12,
  lineHeight: 1.5,
  margin: {
    top: 20,
    right: 20,
    bottom: 20,
    left: 20,
  },
  enableCodeHighlight: true,
  enableMath: true,
  enableGfm: true,
  compress: false,
};

/**
 * PDF export result
 */
export interface PDFExportResult {
  /** Success status */
  success: boolean;
  /** PDF blob (if successful) */
  blob?: Blob;
  /** PDF data URL (if successful) */
  dataUrl?: string;
  /** File size in bytes */
  size?: number;
  /** Number of pages */
  pageCount?: number;
  /** Error message (if failed) */
  error?: string;
  /** Export duration in milliseconds */
  duration?: number;
}

/**
 * PDF export state
 */
export type PDFExportState = 'idle' | 'preparing' | 'rendering' | 'generating' | 'complete' | 'error';

/**
 * PDF export progress
 */
export interface PDFExportProgress {
  /** Current state */
  state: PDFExportState;
  /** Progress percentage (0-100) */
  progress: number;
  /** Current step description */
  message?: string;
  /** Error (if any) */
  error?: Error;
}

/**
 * PDF content element types
 */
export type PDFContentElementType = 
  | 'heading'
  | 'paragraph'
  | 'code'
  | 'list'
  | 'table'
  | 'image'
  | 'blockquote'
  | 'hr'
  | 'link'
  | 'math';

/**
 * PDF content element
 */
export interface PDFContentElement {
  /** Element type */
  type: PDFContentElementType;
  /** Element content */
  content: string;
  /** Element level (for headings) */
  level?: number;
  /** Element language (for code blocks) */
  language?: string;
  /** Element metadata */
  metadata?: Record<string, any>;
  /** Child elements */
  children?: PDFContentElement[];
}

/**
 * PDF document structure
 */
export interface PDFDocumentStructure {
  /** Document title */
  title?: string;
  /** Document metadata */
  metadata?: {
    author?: string;
    subject?: string;
    keywords?: string[];
    creationDate?: Date;
  };
  /** Table of contents */
  toc?: PDFTOCEntry[];
  /** Content elements */
  content: PDFContentElement[];
}

/**
 * PDF table of contents entry
 */
export interface PDFTOCEntry {
  /** Entry title */
  title: string;
  /** Entry level (heading level) */
  level: number;
  /** Page number */
  page: number;
  /** Y position on page */
  y: number;
  /** Child entries */
  children?: PDFTOCEntry[];
}

/**
 * PDF style configuration
 */
export interface PDFStyleConfig {
  /** Font family */
  fontFamily: string;
  /** Font size */
  fontSize: number;
  /** Line height */
  lineHeight: number;
  /** Text color */
  textColor: string;
  /** Background color */
  backgroundColor: string;
  /** Primary color */
  primaryColor: string;
  /** Secondary color */
  secondaryColor: string;
  /** Border color */
  borderColor: string;
  /** Code background color */
  codeBackgroundColor: string;
  /** Code text color */
  codeTextColor: string;
  /** Link color */
  linkColor: string;
  /** Heading colors */
  headingColors: {
    h1: string;
    h2: string;
    h3: string;
    h4: string;
    h5: string;
    h6: string;
  };
}

/**
 * PDF page configuration
 */
export interface PDFPageConfig {
  /** Page format */
  format: 'a4' | 'letter' | 'legal';
  /** Page orientation */
  orientation: 'portrait' | 'landscape';
  /** Page width (in mm) */
  width: number;
  /** Page height (in mm) */
  height: number;
  /** Margins (in mm) */
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  /** Content area width */
  contentWidth: number;
  /** Content area height */
  contentHeight: number;
}

/**
 * PDF export error
 */
export interface PDFExportError {
  /** Error code */
  code: string;
  /** Error message */
  message: string;
  /** Original error */
  originalError?: Error;
  /** Timestamp */
  timestamp: number;
}

/**
 * PDF export statistics
 */
export interface PDFExportStatistics {
  /** Total pages */
  totalPages: number;
  /** Total elements */
  totalElements: number;
  /** Element counts by type */
  elementCounts: Record<PDFContentElementType, number>;
  /** File size in bytes */
  fileSize: number;
  /** Export duration in milliseconds */
  duration: number;
  /** Timestamp */
  timestamp: number;
}

/**
 * Get page dimensions for format
 */
export function getPageDimensions(
  format: 'a4' | 'letter' | 'legal',
  orientation: 'portrait' | 'landscape'
): { width: number; height: number } {
  const dimensions = {
    a4: { width: 210, height: 297 },
    letter: { width: 216, height: 279 },
    legal: { width: 216, height: 356 },
  };

  const { width, height } = dimensions[format];
  
  return orientation === 'landscape'
    ? { width: height, height: width }
    : { width, height };
}

/**
 * Calculate content area dimensions
 */
export function calculateContentArea(
  pageWidth: number,
  pageHeight: number,
  margins: { top: number; right: number; bottom: number; left: number }
): { width: number; height: number } {
  return {
    width: pageWidth - margins.left - margins.right,
    height: pageHeight - margins.top - margins.bottom,
  };
}

/**
 * Create PDF page configuration
 */
export function createPDFPageConfig(
  format: 'a4' | 'letter' | 'legal',
  orientation: 'portrait' | 'landscape',
  margins: { top: number; right: number; bottom: number; left: number }
): PDFPageConfig {
  const { width, height } = getPageDimensions(format, orientation);
  const contentArea = calculateContentArea(width, height, margins);

  return {
    format,
    orientation,
    width,
    height,
    margins,
    contentWidth: contentArea.width,
    contentHeight: contentArea.height,
  };
}

/**
 * Validate PDF export options
 */
export function validatePDFExportOptions(
  options: Partial<PDFExportOptions>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate format
  if (options.format && !['a4', 'letter', 'legal'].includes(options.format)) {
    errors.push(`Invalid format: ${options.format}. Must be one of: a4, letter, legal`);
  }

  // Validate orientation
  if (options.orientation && !['portrait', 'landscape'].includes(options.orientation)) {
    errors.push(`Invalid orientation: ${options.orientation}. Must be one of: portrait, landscape`);
  }

  // Validate font size
  if (options.fontSize !== undefined && (options.fontSize < 6 || options.fontSize > 72)) {
    errors.push(`Invalid fontSize: ${options.fontSize}. Must be between 6 and 72`);
  }

  // Validate line height
  if (options.lineHeight !== undefined && (options.lineHeight < 0.5 || options.lineHeight > 3)) {
    errors.push(`Invalid lineHeight: ${options.lineHeight}. Must be between 0.5 and 3`);
  }

  // Validate margins
  if (options.margin) {
    const { top, right, bottom, left } = options.margin;
    if (top !== undefined && (top < 0 || top > 100)) {
      errors.push(`Invalid margin.top: ${top}. Must be between 0 and 100`);
    }
    if (right !== undefined && (right < 0 || right > 100)) {
      errors.push(`Invalid margin.right: ${right}. Must be between 0 and 100`);
    }
    if (bottom !== undefined && (bottom < 0 || bottom > 100)) {
      errors.push(`Invalid margin.bottom: ${bottom}. Must be between 0 and 100`);
    }
    if (left !== undefined && (left < 0 || left > 100)) {
      errors.push(`Invalid margin.left: ${left}. Must be between 0 and 100`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
