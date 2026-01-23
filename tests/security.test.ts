/**
 * 安全模块测试
 */

import { describe, it, expect, beforeAll } from 'bun:test';
import {
  FileTypeValidator,
  MagicNumberValidator,
  XSSSanitizer,
  SecurityValidator,
  createFileTypeValidator,
  createMagicNumberValidator,
  createXSSSanitizer,
  createSecurityValidator,
} from '../src/security/index.js';

describe('FileTypeValidator', () => {
  let validator: FileTypeValidator;

  beforeAll(() => {
    validator = new FileTypeValidator();
  });

  describe('validate', () => {
    it('should validate valid file extensions', () => {
      const result = validator.validate('test.xlsx');
      expect(result.valid).toBe(true);
      expect(result.fileType).toBe('excel');
      expect(result.extension).toBe('.xlsx');
    });

    it('should reject invalid file extensions', () => {
      const result = validator.validate('test.exe');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject files without extension', () => {
      const result = validator.validate('testfile');
      expect(result.valid).toBe(false);
      expect(result.code).toBe('NO_EXTENSION');
    });

    it('should handle case-insensitive extensions', () => {
      const result1 = validator.validate('test.XLSX');
      const result2 = validator.validate('test.xlsx');
      expect(result1.valid).toBe(true);
      expect(result2.valid).toBe(true);
      expect(result1.fileType).toBe(result2.fileType);
    });
  });

  describe('getFileType', () => {
    it('should return correct file type', () => {
      expect(validator.getFileType('document.docx')).toBe('word');
      expect(validator.getFileType('spreadsheet.xlsx')).toBe('excel');
      expect(validator.getFileType('presentation.pptx')).toBe('powerpoint');
      expect(validator.getFileType('document.pdf')).toBe('pdf');
    });

    it('should return null for unknown extensions', () => {
      expect(validator.getFileType('file.exe')).toBeNull();
    });
  });

  describe('isSupported', () => {
    it('should return true for supported files', () => {
      expect(validator.isSupported('test.xlsx')).toBe(true);
      expect(validator.isSupported('test.pdf')).toBe(true);
    });

    it('should return false for unsupported files', () => {
      expect(validator.isSupported('test.exe')).toBe(false);
    });
  });

  describe('configuration', () => {
    it('should allow custom allowed types', () => {
      const customValidator = new FileTypeValidator({
        allowedTypes: ['excel'],
      });
      expect(customValidator.isSupported('test.xlsx')).toBe(true);
      expect(customValidator.isSupported('test.docx')).toBe(false);
    });

    it('should allow adding allowed types', () => {
      const customValidator = new FileTypeValidator({
        allowedTypes: ['excel'],
      });
      customValidator.addAllowedTypes('pdf');
      expect(customValidator.isSupported('test.pdf')).toBe(true);
    });
  });
});

describe('MagicNumberValidator', () => {
  let validator: MagicNumberValidator;

  beforeAll(() => {
    validator = new MagicNumberValidator(true);
  });

  describe('validate', () => {
    it('should validate PDF files', () => {
      const pdfBuffer = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34]);
      const result = validator.validate(pdfBuffer, '.pdf');
      expect(result.valid).toBe(true);
    });

    it('should validate ZIP files', () => {
      const zipBuffer = new Uint8Array([0x50, 0x4B, 0x03, 0x04, 0x14, 0x00, 0x00, 0x00]);
      const result = validator.validate(zipBuffer, '.zip');
      expect(result.valid).toBe(true);
    });

    it('should validate DOCX files (ZIP-based)', () => {
      const docxBuffer = new Uint8Array([0x50, 0x4B, 0x03, 0x04, 0x14, 0x00, 0x00, 0x00]);
      const result = validator.validate(docxBuffer, '.docx');
      expect(result.valid).toBe(true);
    });

    it('should reject mismatched magic numbers in strict mode', () => {
      // 创建一个伪装成 PDF 的 ZIP 文件
      const fakePdfBuffer = new Uint8Array([0x50, 0x4B, 0x03, 0x04, 0x14, 0x00, 0x00, 0x00]);
      const result = validator.validate(fakePdfBuffer, '.pdf');
      expect(result.valid).toBe(false);
      expect(result.code).toBe('MAGIC_NUMBER_MISMATCH');
    });

    it('should allow unknown magic numbers in non-strict mode', () => {
      const nonStrictValidator = new MagicNumberValidator(false);
      const randomBuffer = new Uint8Array([0x00, 0x01, 0x02, 0x03]);
      const result = nonStrictValidator.validate(randomBuffer, '.txt');
      expect(result.valid).toBe(true);
      expect(result.code).toBe('MAGIC_NUMBER_WARNING');
    });
  });

  describe('detectType', () => {
    it('should detect PDF files', () => {
      const pdfBuffer = new Uint8Array([0x25, 0x50, 0x44, 0x46]);
      const detected = validator.detectType(pdfBuffer);
      expect(detected).toContain('.pdf');
    });

    it('should detect ZIP files', () => {
      const zipBuffer = new Uint8Array([0x50, 0x4B, 0x03, 0x04]);
      const detected = validator.detectType(zipBuffer);
      expect(detected).toContain('.zip');
    });
  });
});

describe('XSSSanitizer', () => {
  let sanitizer: XSSSanitizer;

  beforeAll(() => {
    sanitizer = new XSSSanitizer({ strictMode: true });
  });

  describe('sanitize', () => {
    it('should remove dangerous scripts', () => {
      const dangerousHtml = '<p>Hello</p><script>alert("XSS")</script>';
      const result = sanitizer.sanitize(dangerousHtml);
      expect(result.clean).not.toContain('<script>');
      expect(result.clean).toContain('<p>Hello</p>');
      expect(result.wasModified).toBe(true);
    });

    it('should remove inline event handlers', () => {
      const dangerousHtml = '<div onclick="alert("XSS")">Click me</div>';
      const result = sanitizer.sanitize(dangerousHtml);
      expect(result.clean).not.toContain('onclick');
      expect(result.wasModified).toBe(true);
    });

    it('should preserve safe HTML', () => {
      const safeHtml = '<p>Hello <strong>world</strong></p>';
      const result = sanitizer.sanitize(safeHtml);
      expect(result.clean).toBe(safeHtml);
      expect(result.wasModified).toBe(false);
    });

    it('should preserve table HTML', () => {
      const tableHtml = '<table><tr><th>Header</th></tr><tr><td>Data</td></tr></table>';
      const result = sanitizer.sanitize(tableHtml);
      expect(result.clean).toContain('<table>');
      expect(result.clean).toContain('<tr>');
      expect(result.clean).toContain('<th>');
      expect(result.clean).toContain('<td>');
    });

    it('should handle JavaScript URLs', () => {
      const dangerousHtml = '<a href="javascript:alert("XSS")">Click</a>';
      const result = sanitizer.sanitize(dangerousHtml);
      expect(result.clean).not.toContain('javascript:');
      expect(result.wasModified).toBe(true);
    });

    it('should remove data URLs by default', () => {
      const dangerousHtml = '<iframe src="data:text/html,<script>alert("XSS")</script>"></iframe>';
      const result = sanitizer.sanitize(dangerousHtml);
      // data URLs should be removed
      expect(result.wasModified).toBe(true);
    });
  });

  describe('sanitizeToString', () => {
    it('should return clean HTML string', () => {
      const dangerousHtml = '<script>alert("XSS")</script><p>Safe content</p>';
      const clean = sanitizer.sanitizeToString(dangerousHtml);
      expect(clean).not.toContain('<script>');
      expect(clean).toContain('<p>Safe content</p>');
    });
  });

  describe('sanitizeMany', () => {
    it('should sanitize multiple HTML strings', () => {
      const htmlList = [
        '<script>alert("XSS1")</script><p>Safe1</p>',
        '<script>alert("XSS2")</script><p>Safe2</p>',
        '<script>alert("XSS3")</script><p>Safe3</p>',
      ];
      const results = sanitizer.sanitizeMany(htmlList);
      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result.clean).not.toContain('<script>');
        expect(result.wasModified).toBe(true);
      });
    });
  });

  describe('isUrlSafe', () => {
    it('should identify safe URLs', () => {
      expect(sanitizer.isUrlSafe('https://example.com')).toBe(true);
      expect(sanitizer.isUrlSafe('http://example.com')).toBe(true);
      expect(sanitizer.isUrlSafe('mailto:test@example.com')).toBe(true);
    });

    it('should identify dangerous URLs', () => {
      expect(sanitizer.isUrlSafe('javascript:alert("XSS")')).toBe(false);
      expect(sanitizer.isUrlSafe('data:text/html,<script>alert(1)</script>')).toBe(false);
      expect(sanitizer.isUrlSafe('vbscript:alert("XSS")')).toBe(false);
    });
  });

  describe('configuration', () => {
    it('should allow custom allowed tags', () => {
      const customSanitizer = new XSSSanitizer({
        allowedTags: ['p', 'strong'],
      });
      const html = '<p>Test</p><script>alert("XSS")</script>';
      const result = customSanitizer.sanitize(html);
      expect(result.clean).toContain('<p>');
      expect(result.clean).not.toContain('<script>');
    });

    it('should allow adding custom tags', () => {
      const customSanitizer = new XSSSanitizer();
      customSanitizer.addAllowedTags('custom-tag');
      const html = '<custom-tag>Content</custom-tag>';
      const result = customSanitizer.sanitize(html);
      expect(result.clean).toContain('<custom-tag>');
    });
  });
});

describe('SecurityValidator', () => {
  let validator: SecurityValidator;

  beforeAll(() => {
    validator = new SecurityValidator();
  });

  describe('validateFile', () => {
    it('should validate a valid file with extension only', async () => {
      const result = await validator.validateFile('test.xlsx');
      expect(result.valid).toBe(true);
      expect(result.safe).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate a file with extension and content', async () => {
      // 创建一个模拟的 Excel 文件（ZIP 格式）
      const excelContent = new Uint8Array([0x50, 0x4B, 0x03, 0x04, 0x14, 0x00, 0x00, 0x00]);
      const result = await validator.validateFile('test.xlsx', excelContent, 1024);
      expect(result.valid).toBe(true);
      expect(result.safe).toBe(true);
      expect(result.details.magicNumberValid).toBe(true);
    });

    it('should reject files with invalid extension', async () => {
      const result = await validator.validateFile('test.exe');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject files exceeding size limit', async () => {
      const largeFileSize = 20 * 1024 * 1024; // 20MB
      const result = await validator.validateFile('test.xlsx', undefined, largeFileSize);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('exceeds maximum'))).toBe(true);
    });

    it('should reject files with mismatched magic numbers', async () => {
      // 创建一个伪装成 Excel 的 PDF 文件
      const fakeExcelContent = new Uint8Array([0x25, 0x50, 0x44, 0x46]); // PDF magic number
      const result = await validator.validateFile('test.xlsx', fakeExcelContent, 1024);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('magic number'))).toBe(true);
    });
  });

  describe('sanitizeHtml', () => {
    it('should sanitize dangerous HTML', () => {
      const dangerousHtml = '<script>alert("XSS")</script><p>Safe content</p>';
      const result = validator.sanitizeHtml(dangerousHtml);
      expect(result.clean).not.toContain('<script>');
      expect(result.clean).toContain('<p>Safe content</p>');
      expect(result.wasModified).toBe(true);
    });

    it('should preserve safe HTML', () => {
      const safeHtml = '<p>Safe content</p><table><tr><td>Data</td></tr></table>';
      const result = validator.sanitizeHtml(safeHtml);
      // DOMPurify may add tbody tag to tables, which is valid HTML
      expect(result.clean).toContain('<p>Safe content</p>');
      expect(result.clean).toContain('<table>');
      expect(result.clean).toContain('<td>Data</td>');
      expect(result.clean).not.toContain('<script>');
    });
  });

  describe('validateAndSanitize', () => {
    it('should validate and sanitize HTML', () => {
      const html = '<script>alert("XSS")</script><p>Content</p>';
      const result = validator.validateAndSanitize(html);
      expect(result.valid).toBe(true);
      expect(result.safe).toBe(false); // Not safe because it was modified
      expect(result.cleanHtml).not.toContain('<script>');
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('getFileType', () => {
    it('should return correct file type', () => {
      expect(validator.getFileType('test.xlsx')).toBe('excel');
      expect(validator.getFileType('test.docx')).toBe('word');
      expect(validator.getFileType('test.pdf')).toBe('pdf');
    });

    it('should return null for unknown files', () => {
      expect(validator.getFileType('test.exe')).toBeNull();
    });
  });

  describe('isFileSupported', () => {
    it('should identify supported files', () => {
      expect(validator.isFileSupported('test.xlsx')).toBe(true);
      expect(validator.isFileSupported('test.pdf')).toBe(true);
    });

    it('should identify unsupported files', () => {
      expect(validator.isFileSupported('test.exe')).toBe(false);
    });
  });

  describe('updateConfig', () => {
    it('should update configuration', () => {
      validator.updateConfig({
        maxFileSize: 5 * 1024 * 1024, // 5MB
      });
      const config = validator.getConfig();
      expect(config.maxFileSize).toBe(5 * 1024 * 1024);
    });

    it('should update allowed types', () => {
      validator.updateConfig({
        allowedTypes: ['excel'],
      });
      expect(validator.isFileSupported('test.xlsx')).toBe(true);
      expect(validator.isFileSupported('test.docx')).toBe(false);
    });
  });

  describe('getStats', () => {
    it('should return statistics', () => {
      const stats = validator.getStats();
      expect(stats.fileTypeValidator).toBeDefined();
      expect(stats.magicNumberValidator).toBeDefined();
      expect(stats.xssSanitizer).toBeDefined();
    });
  });

  describe('reset', () => {
    it('should reset to default configuration', () => {
      validator.updateConfig({
        maxFileSize: 5 * 1024 * 1024,
        allowedTypes: ['excel'],
      });
      validator.reset();
      const config = validator.getConfig();
      expect(config.maxFileSize).toBe(10 * 1024 * 1024);
      expect(config.allowedTypes).toContain('word');
    });
  });
});

describe('Factory Functions', () => {
  it('should create FileTypeValidator using factory', () => {
    const validator = createFileTypeValidator();
    expect(validator).toBeInstanceOf(FileTypeValidator);
  });

  it('should create MagicNumberValidator using factory', () => {
    const validator = createMagicNumberValidator();
    expect(validator).toBeInstanceOf(MagicNumberValidator);
  });

  it('should create XSSSanitizer using factory', () => {
    const sanitizer = createXSSSanitizer();
    expect(sanitizer).toBeInstanceOf(XSSSanitizer);
  });

  it('should create SecurityValidator using factory', () => {
    const validator = createSecurityValidator();
    expect(validator).toBeInstanceOf(SecurityValidator);
  });
});

describe('Integration Tests', () => {
  it('should handle complete security validation workflow', async () => {
    const validator = new SecurityValidator({
      validateExtension: true,
      validateMagicNumber: true,
      validateFileSize: true,
      sanitizeHtml: true,
    });

    // 模拟一个 Excel 文件
    const excelContent = new Uint8Array([0x50, 0x4B, 0x03, 0x04, 0x14, 0x00, 0x00, 0x00]);
    const filePath = 'test.xlsx';
    const fileSize = 1024;

    // 1. 验证文件
    const fileValidation = await validator.validateFile(filePath, excelContent, fileSize);
    expect(fileValidation.valid).toBe(true);
    expect(fileValidation.safe).toBe(true);

    // 2. 清理 HTML
    const html = '<table><tr><td>Data</td></tr></table>';
    const sanitizeResult = validator.sanitizeHtml(html);
    expect(sanitizeResult.clean).toContain('<table>');
    expect(sanitizeResult.clean).toContain('<td>Data</td>');
    // DOMPurify may add tbody tag, which is valid HTML
  });

  it('should detect and block malicious files', async () => {
    const validator = new SecurityValidator({
      validateExtension: true,
      validateMagicNumber: true,
      strictMode: true,
    });

    // 模拟一个伪装成 Excel 的可执行文件
    const fakeExcelContent = new Uint8Array([0x4D, 0x5A, 0x90, 0x00]); // PE executable
    const filePath = 'malicious.xlsx';

    const result = await validator.validateFile(filePath, fakeExcelContent);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('magic number'))).toBe(true);
  });
});