/**
 * 安全验证主模块
 * 
 * 整合所有安全验证功能：
 * - 文件类型验证
 * - 魔数检查
 * - XSS 防护
 * - 文件大小检查
 */

import type {
  FileValidationOptions,
  FileValidationResult,
  XSSSanitizeOptions as SanitizeOptions,
} from './types.js';
import { FileTypeValidator } from './file-type-validator.js';
import { MagicNumberValidator } from './magic-number-validator.js';
import { XSSSanitizer } from './xss-sanitizer.js';

/**
 * 安全验证选项
 */
interface SecurityValidationOptions extends FileValidationOptions {
  validateExtension?: boolean;
  validateMagicNumber?: boolean;
  validateFileSize?: number;
  sanitizeHtml?: boolean;
  strictMagicNumberCheck?: boolean;
  strictMode?: boolean;
  sanitizeOptions?: SanitizeOptions;
}

/**
 * 安全验证结果
 */
interface SecurityValidationResult {
  valid: boolean;
  safe: boolean;
  errors: string[];
  warnings: string[];
  details: Record<string, unknown>;
}

/**
 * 默认安全配置
 */
const DEFAULT_SECURITY_CONFIG: SecurityValidationOptions = {
  // 文件类型验证
  validateExtension: true,
  validateMagicNumber: true,
  validateFileSize: 10 * 1024 * 1024, // 10MB
  
  // XSS 防护
  sanitizeHtml: true,
  strictMode: true,
  
  // 魔数验证
  strictMagicNumberCheck: true,
  
  // 文件类型
  allowedTypes: ['word', 'excel', 'powerpoint', 'pdf', 'text', 'archive'],
  allowedExtensions: undefined, // 使用默认值
};

/**
 * 安全验证器
 * 
 * 提供一站式的文件和内容安全验证
 */
export class SecurityValidator {
  /** 文件类型验证器 */
  private fileTypeValidator: FileTypeValidator;

  /** 魔数验证器 */
  private magicNumberValidator: MagicNumberValidator;

  /** XSS 清理器 */
  private xssSanitizer: XSSSanitizer;

  /** 安全配置 */
  private config: SecurityValidationOptions;

  /**
   * 创建安全验证器
   *
   * @param options - 安全验证选项
   */
  constructor(options?: SecurityValidationOptions) {
    // 合并配置
    this.config = {
      ...DEFAULT_SECURITY_CONFIG,
      ...options,
    };

    // 初始化子验证器
    this.fileTypeValidator = new FileTypeValidator({
      allowedTypes: this.config.allowedTypes,
      allowedExtensions: this.config.allowedExtensions,
      customFileTypes: this.config.customFileTypes,
    });

    this.magicNumberValidator = new MagicNumberValidator(
      this.config.strictMagicNumberCheck
    );

    this.xssSanitizer = new XSSSanitizer({
      strictMode: this.config.strictMode,
      ...this.config.sanitizeOptions,
    });
  }

  /**
   * 验证文件
   *
   * @param filePath - 文件路径
   * @param content - 文件内容（可选，用于魔数验证）
   * @param fileSize - 文件大小（可选，字节）
   * @returns 验证结果
   */
  async validateFile(
    filePath: string,
    content?: ArrayBuffer | Uint8Array,
    fileSize?: number
  ): Promise<SecurityValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const details: Record<string, unknown> = {};

    // 1. 验证文件扩展名
    if (this.config.validateExtension) {
      const extensionResult = this.fileTypeValidator.validate(filePath);
      
      if (!extensionResult.valid) {
        errors.push(extensionResult.error || 'File extension validation failed');
      } else {
        details.fileType = extensionResult.fileType;
        details.extension = extensionResult.extension;
      }
    }

    // 2. 验证文件大小
    if (this.config.validateFileSize && fileSize !== undefined) {
      const sizeResult = this.validateFileSize(fileSize);
      
      if (!sizeResult.valid) {
        errors.push(sizeResult.error || 'File size validation failed');
      }
      details.fileSize = fileSize;
    }

    // 3. 验证魔数
    if (this.config.validateMagicNumber && content) {
      const extension = this.fileTypeValidator['getExtension'](filePath);
      
      if (extension) {
        const magicResult = this.magicNumberValidator.validate(content, extension);
        
        if (!magicResult.valid) {
          errors.push(magicResult.error || 'Magic number validation failed');
        } else if (magicResult.errorCode === 'unknown_error') {
          warnings.push(magicResult.message || 'Magic number warning');
        }
        details.magicNumberValid = magicResult.valid;
      }
    }

    // 返回验证结果
    return {
      valid: errors.length === 0,
      safe: errors.length === 0 && warnings.length === 0,
      errors,
      warnings,
      details,
    };
  }

  /**
   * 清理 HTML 内容
   *
   * @param html - 待清理的 HTML
   * @returns 清理结果
   */
  sanitizeHtml(html: string): ReturnType<XSSSanitizer['sanitize']> {
    if (!this.config.sanitizeHtml) {
      // 如果未启用清理，返回原始内容
      return {
        clean: html,
        modified: false,
        originalLength: html.length,
        cleanLength: html.length,
        removedLength: 0,
      };
    }

    return this.xssSanitizer.sanitize(html);
  }

  /**
   * 验证并清理 HTML内容
   *
   * @param html - 待验证和清理的 HTML
   * @returns 验证和清理结果
   */
  validateAndSanitize(html: string): SecurityValidationResult & { cleanHtml: string } {
    const sanitizeResult = this.sanitizeHtml(html);
    
    return {
      valid: true,
      safe: !sanitizeResult.wasModified,
      cleanHtml: sanitizeResult.clean,
      errors: [],
      warnings: sanitizeResult.wasModified ? ['HTML content was modified during sanitization'] : [],
      details: {
        originalLength: sanitizeResult.originalLength,
        cleanLength: sanitizeResult.cleanLength,
        removedLength: sanitizeResult.removedLength,
      },
    };
  }

  /**
   * 验证文件大小
   *
   * @param fileSize - 文件大小（字节）
   * @returns 验证结果
   */
  private validateFileSize(fileSize: number): { valid: boolean; error?: string } {
    const maxSize = this.config.maxFileSize || DEFAULT_SECURITY_CONFIG.maxFileSize!;
    
    if (fileSize > maxSize) {
      return {
        valid: false,
        error: `File size (${this.formatFileSize(fileSize)}) exceeds maximum allowed size (${this.formatFileSize(maxSize)})`,
      };
    }

    return { valid: true };
  }

  /**
   * 格式化文件大小
   *
   * @param bytes - 字节数
   * @returns 格式化后的字符串
   */
  private formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  /**
   * 获取文件类型
   *
   * @param filePath - 文件路径
   * @returns 文件类型
   */
  getFileType(filePath: string): string | null {
    return this.fileTypeValidator.getFileType(filePath);
  }

  /**
   * 检查文件是否支持
   *
   * @param filePath - 文件路径
   * @returns 是否支持
   */
  isFileSupported(filePath: string): boolean {
    return this.fileTypeValidator.isSupported(filePath);
  }

  /**
   * 更新配置
   *
   * @param options - 新的配置选项
   */
  updateConfig(options: Partial<SecurityValidationOptions>): void {
    this.config = {
      ...this.config,
      ...options,
    };

    // 更新子验证器配置
    if (options.allowedTypes || options.allowedExtensions || options.customFileTypes) {
      this.fileTypeValidator = new FileTypeValidator({
        allowedTypes: this.config.allowedTypes,
        allowedExtensions: this.config.allowedExtensions,
        customFileTypes: this.config.customFileTypes,
      });
    }

    if (options.strictMagicNumberCheck !== undefined) {
      this.magicNumberValidator.setStrictMode(this.config.strictMagicNumberCheck!);
    }

    if (options.strictMode !== undefined || options.sanitizeOptions) {
      this.xssSanitizer = new XSSSanitizer({
        strictMode: this.config.strictMode,
        ...this.config.sanitizeOptions,
      });
    }
  }

  /**
   * 获取当前配置
   *
   * @returns 当前配置
   */
  getConfig(): SecurityValidationOptions {
    return { ...this.config };
  }

  /**
   * 获取统计信息
   *
   * @returns 统计信息
   */
  getStats() {
    return {
      fileTypeValidator: {
        allowedTypes: this.fileTypeValidator.getAllowedTypes(),
        allowedExtensions: this.fileTypeValidator.getAllowedExtensions(),
      },
      magicNumberValidator: {
        supportedExtensions: this.magicNumberValidator.getSupportedExtensions(),
      },
      xssSanitizer: this.xssSanitizer.getStats(),
    };
  }

  /**
   * 重置为默认配置
   */
  reset(): void {
    this.config = { ...DEFAULT_SECURITY_CONFIG };
    this.fileTypeValidator.reset();
    this.magicNumberValidator.setStrictMode(true);
    this.xssSanitizer = new XSSSanitizer({ strictMode: true });
  }
}

/**
 * 创建默认的安全验证器
 *
 * @param options - 安全验证选项
 * @returns 安全验证器实例
 */
export function createSecurityValidator(options?: SecurityValidationOptions): SecurityValidator {
  return new SecurityValidator(options);
}

/**
 * 默认的安全验证器实例
 */
export const defaultSecurityValidator = new SecurityValidator();

/**
 * 便捷函数：验证文件
 *
 * @param filePath - 文件路径
 * @param content - 文件内容（可选）
 * @param fileSize - 文件大小（可选）
 * @returns 验证结果
 */
export async function validateFile(
  filePath: string,
  content?: ArrayBuffer | Uint8Array,
  fileSize?: number
): Promise<SecurityValidationResult> {
  return defaultSecurityValidator.validateFile(filePath, content, fileSize);
}

/**
 * 便捷函数：清理 HTML
 *
 * @param html - 待清理的 HTML
 * @returns 清理后的 HTML
 */
export function sanitizeHtml(html: string): string {
  return defaultSecurityValidator.sanitizeHtml(html).clean;
}

// 导出所有模块
export { FileTypeValidator, createFileTypeValidator } from './file-type-validator.js';
export { MagicNumberValidator, createMagicNumberValidator } from './magic-number-validator.js';
export { XSSSanitizer, createXSSSanitizer, sanitizeHtml as sanitizeHtmlFn } from './xss-sanitizer.js';
export * from './types.js';