/**
 * PDF Exporter Service
 * 
 * Core service for exporting Markdown content to PDF format.
 * Supports:
 * - Markdown to PDF conversion
 * - Theme support
 * - Code syntax highlighting
 * - Tables, lists, and other GFM features
 * - Custom styling
 */

import jsPDF from 'jspdf';
import type {
  PDFExportOptions,
  PDFExportResult,
  PDFExportProgress,
  PDFDocumentStructure,
  PDFContentElement,
  PDFStyleConfig,
  PDFPageConfig,
  PDFExportState,
} from '../../types/pdf-export.js';
import {
  DEFAULT_PDF_EXPORT_OPTIONS,
  createPDFPageConfig,
  validatePDFExportOptions,
} from '../../types/pdf-export.js';
import { getDefaultTheme } from './theme.js';

/**
 * PDF Exporter Class
 * 
 * Main class for PDF export functionality
 */
export class PDFExporter {
  private options: Required<PDFExportOptions>;
  private doc: jsPDF | null = null;
  private pageConfig: PDFPageConfig;
  private styleConfig: PDFStyleConfig;
  private currentY: number = 0;
  private currentPage: number = 1;
  private progressCallback?: (progress: PDFExportProgress) => void;

  constructor(options: Partial<PDFExportOptions> = {}) {
    // Validate options
    const validation = validatePDFExportOptions(options);
    if (!validation.valid) {
      throw new Error(`Invalid PDF export options: ${validation.errors.join(', ')}`);
    }

    // Merge with defaults
    this.options = {
      ...DEFAULT_PDF_EXPORT_OPTIONS,
      ...options,
      margin: {
        top: options.margin?.top ?? DEFAULT_PDF_EXPORT_OPTIONS.margin.top,
        right: options.margin?.right ?? DEFAULT_PDF_EXPORT_OPTIONS.margin.right,
        bottom: options.margin?.bottom ?? DEFAULT_PDF_EXPORT_OPTIONS.margin.bottom,
        left: options.margin?.left ?? DEFAULT_PDF_EXPORT_OPTIONS.margin.left,
      },
    } as Required<PDFExportOptions>;

    // Create page configuration
    this.pageConfig = createPDFPageConfig(
      this.options.format,
      this.options.orientation,
      {
        top: this.options.margin.top,
        right: this.options.margin.right,
        bottom: this.options.margin.bottom,
        left: this.options.margin.left,
      }
    );

    // Create style configuration
    this.styleConfig = this.createStyleConfig();
  }

  /**
   * Set progress callback
   */
  onProgress(callback: (progress: PDFExportProgress) => void): void {
    this.progressCallback = callback;
  }

  /**
   * Report progress
   */
  private reportProgress(state: PDFExportState, progress: number, message?: string): void {
    if (this.progressCallback) {
      this.progressCallback({ state, progress, message });
    }
  }

  /**
   * Export Markdown content to PDF
   */
  async exportMarkdown(
    content: string,
    filename?: string
  ): Promise<PDFExportResult> {
    const startTime = Date.now();

    try {
      this.reportProgress('preparing', 0, 'Preparing document...');

      // Initialize PDF document
      this.initializeDocument();

      this.reportProgress('rendering', 20, 'Parsing markdown...');

      // Parse markdown to document structure
      const structure = this.parseMarkdownToStructure(content);

      this.reportProgress('rendering', 40, 'Rendering content...');

      // Render document structure to PDF
      await this.renderDocumentStructure(structure);

      this.reportProgress('generating', 80, 'Generating PDF...');

      // Generate PDF blob
      const blob = this.doc!.output('blob');
      const dataUrl = this.doc!.output('dataurlstring');

      this.reportProgress('complete', 100, 'Export complete');

      const duration = Date.now() - startTime;

      return {
        success: true,
        blob,
        dataUrl,
        size: blob.size,
        pageCount: this.currentPage,
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
   * Download PDF
   */
  async downloadPDF(content: string, filename: string = 'document.pdf'): Promise<void> {
    const result = await this.exportMarkdown(content, filename);

    if (!result.success || !result.blob) {
      throw new Error(result.error || 'Failed to generate PDF');
    }

    // Create download link
    const url = URL.createObjectURL(result.blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Initialize PDF document
   */
  private initializeDocument(): void {
    this.doc = new jsPDF({
      orientation: this.options.orientation,
      unit: 'mm',
      format: this.options.format,
      compress: this.options.compress,
    });

    // Set document properties
    if (this.options.title) {
      this.doc.setProperties({ title: this.options.title });
    }
    if (this.options.author) {
      this.doc.setProperties({ author: this.options.author });
    }
    if (this.options.subject) {
      this.doc.setProperties({ subject: this.options.subject });
    }
    if (this.options.keywords) {
      this.doc.setProperties({ keywords: this.options.keywords.join(', ') });
    }

    // Set initial position
    this.currentY = this.pageConfig.margins.top;
    this.currentPage = 1;
  }

  /**
   * Create style configuration from theme
   */
  private createStyleConfig(): PDFStyleConfig {
    const theme = this.options.themePalette || getDefaultTheme(this.options.theme);

    return {
      fontFamily: this.options.fontFamily,
      fontSize: this.options.fontSize,
      lineHeight: this.options.lineHeight,
      textColor: theme.text,
      backgroundColor: theme.background,
      primaryColor: theme.primary,
      secondaryColor: theme.secondary,
      borderColor: theme.border,
      codeBackgroundColor: theme.muted,
      codeTextColor: theme.text,
      linkColor: theme.primary,
      headingColors: {
        h1: theme.primary,
        h2: theme.primary,
        h3: theme.text,
        h4: theme.text,
        h5: theme.text,
        h6: theme.text,
      },
    };
  }

  /**
   * Parse Markdown to document structure
   */
  private parseMarkdownToStructure(content: string): PDFDocumentStructure {
    const elements: PDFContentElement[] = [];
    const lines = content.split('\n');
    let currentElement: PDFContentElement | null = null;
    let inCodeBlock = false;
    let codeBlockContent: string[] = [];
    let codeBlockLanguage = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Code block detection
      if (line.startsWith('```')) {
        if (!inCodeBlock) {
          // Start code block
          inCodeBlock = true;
          codeBlockLanguage = line.slice(3).trim();
          codeBlockContent = [];
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
        elements.push({
          type: 'heading',
          content: headingMatch[2],
          level: headingMatch[1].length,
        });
        continue;
      }

      // Horizontal rule
      if (line.match(/^(-{3,}|\*{3,}|_{3,})$/)) {
        elements.push({
          type: 'hr',
          content: '',
        });
        continue;
      }

      // Blockquote
      if (line.startsWith('> ')) {
        elements.push({
          type: 'blockquote',
          content: line.slice(2),
        });
        continue;
      }

      // List item
      if (line.match(/^[\s]*[-*+]\s+/) || line.match(/^[\s]*\d+\.\s+/)) {
        elements.push({
          type: 'list',
          content: line.trim(),
        });
        continue;
      }

      // Empty line
      if (line.trim() === '') {
        continue;
      }

      // Regular paragraph
      elements.push({
        type: 'paragraph',
        content: line,
      });
    }

    return {
      title: this.options.title,
      metadata: {
        author: this.options.author,
        subject: this.options.subject,
        keywords: this.options.keywords,
        creationDate: new Date(),
      },
      content: elements,
    };
  }

  /**
   * Render document structure to PDF
   */
  private async renderDocumentStructure(structure: PDFDocumentStructure): Promise<void> {
    if (!this.doc) {
      throw new Error('PDF document not initialized');
    }

    // Render title if present
    if (structure.title) {
      this.renderTitle(structure.title);
    }

    // Render content elements
    for (const element of structure.content) {
      await this.renderElement(element);
    }

    // Add page numbers if enabled
    if (this.options.includePageNumbers) {
      this.addPageNumbers();
    }

    // Add footer if enabled
    if (this.options.includeFooter) {
      this.addFooter();
    }
  }

  /**
   * Render title
   */
  private renderTitle(title: string): void {
    if (!this.doc) return;

    this.doc.setFontSize(24);
    this.doc.setFont(this.styleConfig.fontFamily, 'bold');
    this.doc.setTextColor(this.styleConfig.headingColors.h1);

    const titleLines = this.doc.splitTextToSize(title, this.pageConfig.contentWidth);
    this.doc.text(titleLines, this.pageConfig.margins.left, this.currentY);

    this.currentY += titleLines.length * 10 + 10;
    this.checkPageBreak(20);
  }

  /**
   * Render content element
   */
  private async renderElement(element: PDFContentElement): Promise<void> {
    switch (element.type) {
      case 'heading':
        this.renderHeading(element);
        break;
      case 'paragraph':
        this.renderParagraph(element);
        break;
      case 'code':
        this.renderCodeBlock(element);
        break;
      case 'list':
        this.renderListItem(element);
        break;
      case 'blockquote':
        this.renderBlockquote(element);
        break;
      case 'hr':
        this.renderHorizontalRule();
        break;
      default:
        // Skip unknown elements
        break;
    }
  }

  /**
   * Render heading
   */
  private renderHeading(element: PDFContentElement): void {
    if (!this.doc) return;

    const level = element.level || 1;
    const fontSize = Math.max(20 - (level - 1) * 2, 12);
    const color = this.styleConfig.headingColors[`h${level}` as keyof typeof this.styleConfig.headingColors];

    this.checkPageBreak(fontSize + 10);

    this.doc.setFontSize(fontSize);
    this.doc.setFont(this.styleConfig.fontFamily, 'bold');
    this.doc.setTextColor(color);

    const lines = this.doc.splitTextToSize(element.content, this.pageConfig.contentWidth);
    this.doc.text(lines, this.pageConfig.margins.left, this.currentY);

    this.currentY += lines.length * (fontSize * 0.35) + 5;
  }

  /**
   * Render paragraph
   */
  private renderParagraph(element: PDFContentElement): void {
    if (!this.doc) return;

    this.checkPageBreak(20);

    this.doc.setFontSize(this.styleConfig.fontSize);
    this.doc.setFont(this.styleConfig.fontFamily, 'normal');
    this.doc.setTextColor(this.styleConfig.textColor);

    const lines = this.doc.splitTextToSize(element.content, this.pageConfig.contentWidth);
    this.doc.text(lines, this.pageConfig.margins.left, this.currentY);

    this.currentY += lines.length * (this.styleConfig.fontSize * 0.35 * this.styleConfig.lineHeight) + 3;
  }

  /**
   * Render code block
   */
  private renderCodeBlock(element: PDFContentElement): void {
    if (!this.doc) return;

    const codeLines = element.content.split('\n');
    const lineHeight = this.styleConfig.fontSize * 0.35;
    const blockHeight = codeLines.length * lineHeight + 10;

    this.checkPageBreak(blockHeight);

    // Draw background
    this.doc.setFillColor(this.styleConfig.codeBackgroundColor);
    this.doc.rect(
      this.pageConfig.margins.left,
      this.currentY - 5,
      this.pageConfig.contentWidth,
      blockHeight,
      'F'
    );

    // Draw border
    this.doc.setDrawColor(this.styleConfig.borderColor);
    this.doc.rect(
      this.pageConfig.margins.left,
      this.currentY - 5,
      this.pageConfig.contentWidth,
      blockHeight
    );

    // Render code
    this.doc.setFontSize(this.styleConfig.fontSize - 1);
    this.doc.setFont('courier', 'normal');
    this.doc.setTextColor(this.styleConfig.codeTextColor);

    let y = this.currentY;
    for (const line of codeLines) {
      const truncatedLine = line.length > 100 ? line.slice(0, 100) + '...' : line;
      this.doc.text(truncatedLine, this.pageConfig.margins.left + 3, y);
      y += lineHeight;
    }

    this.currentY += blockHeight + 5;
  }

  /**
   * Render list item
   */
  private renderListItem(element: PDFContentElement): void {
    if (!this.doc) return;

    this.checkPageBreak(15);

    this.doc.setFontSize(this.styleConfig.fontSize);
    this.doc.setFont(this.styleConfig.fontFamily, 'normal');
    this.doc.setTextColor(this.styleConfig.textColor);

    const lines = this.doc.splitTextToSize(element.content, this.pageConfig.contentWidth - 5);
    this.doc.text(lines, this.pageConfig.margins.left + 5, this.currentY);

    this.currentY += lines.length * (this.styleConfig.fontSize * 0.35 * this.styleConfig.lineHeight) + 2;
  }

  /**
   * Render blockquote
   */
  private renderBlockquote(element: PDFContentElement): void {
    if (!this.doc) return;

    this.checkPageBreak(20);

    // Draw left border
    this.doc.setDrawColor(this.styleConfig.primaryColor);
    this.doc.setLineWidth(1);
    this.doc.line(
      this.pageConfig.margins.left,
      this.currentY - 3,
      this.pageConfig.margins.left,
      this.currentY + 10
    );

    this.doc.setFontSize(this.styleConfig.fontSize);
    this.doc.setFont(this.styleConfig.fontFamily, 'italic');
    this.doc.setTextColor(this.styleConfig.secondaryColor);

    const lines = this.doc.splitTextToSize(element.content, this.pageConfig.contentWidth - 10);
    this.doc.text(lines, this.pageConfig.margins.left + 5, this.currentY);

    this.currentY += lines.length * (this.styleConfig.fontSize * 0.35 * this.styleConfig.lineHeight) + 5;
  }

  /**
   * Render horizontal rule
   */
  private renderHorizontalRule(): void {
    if (!this.doc) return;

    this.checkPageBreak(10);

    this.doc.setDrawColor(this.styleConfig.borderColor);
    this.doc.setLineWidth(0.5);
    this.doc.line(
      this.pageConfig.margins.left,
      this.currentY,
      this.pageConfig.margins.left + this.pageConfig.contentWidth,
      this.currentY
    );

    this.currentY += 10;
  }

  /**
   * Check if page break is needed
   */
  private checkPageBreak(requiredSpace: number): void {
    if (!this.doc) return;

    const maxY = this.pageConfig.height - this.pageConfig.margins.bottom;

    if (this.currentY + requiredSpace > maxY) {
      this.doc.addPage();
      this.currentPage++;
      this.currentY = this.pageConfig.margins.top;
    }
  }

  /**
   * Add page numbers
   */
  private addPageNumbers(): void {
    if (!this.doc) return;

    const pageCount = this.doc.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      this.doc.setFontSize(10);
      this.doc.setFont(this.styleConfig.fontFamily, 'normal');
      this.doc.setTextColor(this.styleConfig.secondaryColor);

      const pageText = `Page ${i} of ${pageCount}`;
      const textWidth = this.doc.getTextWidth(pageText);
      const x = (this.pageConfig.width - textWidth) / 2;
      const y = this.pageConfig.height - 10;

      this.doc.text(pageText, x, y);
    }
  }

  /**
   * Add footer
   */
  private addFooter(): void {
    if (!this.doc || !this.options.footerText) return;

    const pageCount = this.doc.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      this.doc.setFontSize(9);
      this.doc.setFont(this.styleConfig.fontFamily, 'normal');
      this.doc.setTextColor(this.styleConfig.secondaryColor);

      const y = this.pageConfig.height - 15;
      this.doc.text(this.options.footerText, this.pageConfig.margins.left, y);
    }
  }
}

/**
 * Export Markdown to PDF (convenience function)
 */
export async function exportMarkdownToPDF(
  content: string,
  options: Partial<PDFExportOptions> = {}
): Promise<PDFExportResult> {
  const exporter = new PDFExporter(options);
  return exporter.exportMarkdown(content);
}

/**
 * Download Markdown as PDF (convenience function)
 */
export async function downloadMarkdownAsPDF(
  content: string,
  filename: string = 'document.pdf',
  options: Partial<PDFExportOptions> = {}
): Promise<void> {
  const exporter = new PDFExporter(options);
  return exporter.downloadPDF(content, filename);
}
