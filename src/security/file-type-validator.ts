/**
 * 文件类型验证模块
 * 
 * 功能：
 * - 根据文件扩展名验证文件类型
 * - 支持可配置的允许文件类型列表
 * - 提供白名单机制
 */

import type {
  FileExtension,
  FileValidationResult as ValidationResult,
  FileValidationOptions,
} from './types.js';

// 定义文件类型
type FileType = 'word' | 'excel' | 'powerpoint' | 'pdf' | 'text' | 'html' | 'archive';

/**
 * 默认支持的文件类型配置
 */
const DEFAULT_FILE_TYPES: Record<FileExtension, FileType> = {
  // Office 文档
  docx: 'word',
  dotx: 'word',
  doc: 'word',
  xlsx: 'excel',
  xlsm: 'excel',
  xls: 'excel',
  csv: 'excel',
  ods: 'excel',
  pptx: 'powerpoint',
  ppt: 'powerpoint',
  pdf: 'pdf',
  
  // 文本文件
  txt: 'text',
  md: 'text',
  
  // 压缩文件
  zip: 'archive',
  rar: 'archive',
  '7z': 'archive',
};

/**
 * 文件类型验证器
 */
export class FileTypeValidator {
  /** 允许的文件类型列表（白名单） */
  private allowedTypes: Set<FileType>;

  /** 允许的文件扩展名列表 */
  private allowedExtensions: Set<FileExtension>;

  /** 文件类型映射 */
  private fileTypes: Record<FileExtension, FileType>;

  /**
   * 创建文件类型验证器
   *
   * @param options - 验证选项
   */
  constructor(options?: FileValidationOptions) {
    this.fileTypes = { ...DEFAULT_FILE_TYPES };

    // 合并自定义文件类型
    if (options?.customFileTypes) {
      this.fileTypes = { ...this.fileTypes, ...options.customFileTypes };
    }

    // 设置允许的文件类型
    if (options?.allowedTypes) {
      this.allowedTypes = new Set(options.allowedTypes as FileType[]);
    } else {
      // 默认允许所有类型
      this.allowedTypes = new Set(
        Object.values(this.fileTypes).filter((v, i, a) => a.indexOf(v) === i) as FileType[]
      );
    }

    // 设置允许的文件扩展名
    if (options?.allowedExtensions) {
      this.allowedExtensions = new Set(options.allowedExtensions);
    } else {
      // 根据允许的类型生成扩展名列表
      this.allowedExtensions = new Set(
        Object.entries(this.fileTypes)
          .filter(([_, type]) => this.allowedTypes.has(type))
          .map(([ext]) => ext as FileExtension)
      );
    }
  }

  /**
   * 验证文件类型
   *
   * @param filePath - 文件路径
   * @param options - 验证选项（可选）
   * @returns 验证结果
   */
  validate(filePath: string, options?: FileValidationOptions): ValidationResult {
    const extension = this.getExtension(filePath);
    
    // 检查是否有扩展名
    if (!extension) {
      return {
        valid: false,
        error: 'File has no extension',
        errorCode: 'file_empty',
      };
    }

    // 检查扩展名是否在允许列表中
    if (!this.allowedExtensions.has(extension)) {
      return {
        valid: false,
        error: `File extension "${extension}" is not allowed`,
        errorCode: 'extension_not_allowed',
        details: {
          extension,
          allowedExtensions: Array.from(this.allowedExtensions),
        },
      };
    }

    // 获取文件类型
    const fileType = this.fileTypes[extension as FileExtension];

    // 检查文件类型是否在允许列表中
    if (!this.allowedTypes.has(fileType)) {
      return {
        valid: false,
        error: `File type "${fileType}" is not allowed`,
        errorCode: 'type_mismatch',
        details: {
          fileType,
          allowedTypes: Array.from(this.allowedTypes),
        },
      };
    }

    return {
      valid: true,
      fileType,
      extension,
    };
  }

  /**
   * 获取文件扩展名
   *
   * @param filePath - 文件路径
   * @returns 文件扩展名（带点，如 ".txt"）
   */
  public getExtension(filePath: string): FileExtension | null {
    const lastDotIndex = filePath.lastIndexOf('.');
    
    if (lastDotIndex === -1 || lastDotIndex === filePath.length - 1) {
      return null;
    }

    const ext = filePath.slice(lastDotIndex).toLowerCase() as FileExtension;
    return ext;
  }

  /**
   * 获取文件类型
   *
   * @param filePath - 文件路径
   * @returns 文件类型
   */
  getFileType(filePath: string): FileType | null {
    const extension = this.getExtension(filePath);
    return extension ? this.fileTypes[extension] || null : null;
  }

  /**
   * 检查文件是否支持
   *
   * @param filePath - 文件路径
   * @returns 是否支持
   */
  isSupported(filePath: string): boolean {
    return this.validate(filePath).valid;
  }

  /**
   * 添加允许的文件类型
   *
   * @param types - 文件类型列表
   */
  addAllowedTypes(...types: FileType[]): void {
    types.forEach((type) => this.allowedTypes.add(type));
    this.updateAllowedExtensions();
  }

  /**
   * 移除允许的文件类型
   *
   * @param types - 文件类型列表
   */
  removeAllowedTypes(...types: FileType[]): void {
    types.forEach((type) => this.allowedTypes.delete(type));
    this.updateAllowedExtensions();
  }

  /**
   * 添加允许的文件扩展名
   *
   * @param extensions - 文件扩展名列表
   */
  addAllowedExtensions(...extensions: FileExtension[]): void {
    extensions.forEach((ext) => this.allowedExtensions.add(ext));
  }

  /**
   * 移除允许的文件扩展名
   *
   * @param extensions - 文件扩展名列表
   */
  removeAllowedExtensions(...extensions: FileExtension[]): void {
    extensions.forEach((ext) => this.allowedExtensions.delete(ext));
  }

  /**
   * 更新允许的扩展名列表
   */
  private updateAllowedExtensions(): void {
    this.allowedExtensions = new Set(
      Object.entries(this.fileTypes)
        .filter(([_, type]) => this.allowedTypes.has(type))
        .map(([ext]) => ext as FileExtension)
    );
  }

  /**
   * 获取所有允许的文件类型
   *
   * @returns 文件类型数组
   */
  getAllowedTypes(): FileType[] {
    return Array.from(this.allowedTypes);
  }

  /**
   * 获取所有允许的文件扩展名
   *
   * @returns 文件扩展名数组
   */
  getAllowedExtensions(): FileExtension[] {
    return Array.from(this.allowedExtensions);
  }

  /**
   * 重置为默认配置
   */
  reset(): void {
    this.allowedTypes = new Set(
      Object.values(DEFAULT_FILE_TYPES).filter((v, i, a) => a.indexOf(v) === i)
    );
    this.allowedExtensions = new Set(
      Object.keys(DEFAULT_FILE_TYPES) as FileExtension[]
    );
  }
}

/**
 * 创建默认的文件类型验证器
 *
 * @returns 文件类型验证器实例
 */
export function createFileTypeValidator(options?: FileValidationOptions): FileTypeValidator {
  return new FileTypeValidator(options);
}

/**
 * 默认的文件类型验证器实例
 */
export const defaultFileTypeValidator = new FileTypeValidator();