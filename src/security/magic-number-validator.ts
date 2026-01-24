/**
 * 魔数（Magic Number）验证模块
 * 
 * 功能：
 * - 读取文件头部字节验证真实文件类型
 * - 防止文件扩展名伪造攻击
 * - 支持多种文件类型的魔数检测
 */

import type {
  FileExtension,
  FileValidationResult as ValidationResult,
} from './types.js';

/**
 * 魔数模式
 */
interface MagicNumberPattern {
  /** 签名字节序列 */
  signature: number[];
  
  /** 偏移量 */
  offset: number;
  
  /** 描述 */
  description: string;
}

/**
 * 文件魔数配置
 * 
 * 魔数是文件开头的特定字节序列，用于标识文件的真实类型
 */
const MAGIC_NUMBERS: Record<string, MagicNumberPattern[]> = {
  // PDF 文件
  '.pdf': [
    {
      signature: [0x25, 0x50, 0x44, 0x46], // %PDF
      offset: 0,
      description: 'PDF document',
    },
  ],

  // ZIP 文件（包括 .docx, .xlsx, .pptx 等 Office 格式）
  '.zip': [
    {
      signature: [0x50, 0x4B, 0x03, 0x04], // PK..
      offset: 0,
      description: 'ZIP archive',
    },
    {
      signature: [0x50, 0x4B, 0x05, 0x06], // 空的 ZIP 文件
      offset: 0,
      description: 'Empty ZIP archive',
    },
    {
      signature: [0x50, 0x4B, 0x07, 0x08], // 跨区 ZIP 文件
      offset: 0,
      description: 'Spanned ZIP archive',
    },
  ],

  // DOCX 文件（实际上是 ZIP）
  '.docx': [
    {
      signature: [0x50, 0x4B, 0x03, 0x04], // PK..
      offset: 0,
      description: 'DOCX (ZIP-based)',
    },
  ],

  // XLSX 文件（实际上是 ZIP）
  '.xlsx': [
    {
      signature: [0x50, 0x4B, 0x03, 0x04], // PK..
      offset: 0,
      description: 'XLSX (ZIP-based)',
    },
  ],

  // PPTX 文件（实际上是 ZIP）
  '.pptx': [
    {
      signature: [0x50, 0x4B, 0x03, 0x04], // PK..
      offset: 0,
      description: 'PPTX (ZIP-based)',
    },
  ],

  // XLS 文件（旧版 Excel）
  '.xls': [
    {
      signature: [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1],
      offset: 0,
      description: 'Legacy Excel (OLE2)',
    },
  ],

  // DOC 文件（旧版 Word）
  '.doc': [
    {
      signature: [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1],
      offset: 0,
      description: 'Legacy Word (OLE2)',
    },
  ],

  // PPT 文件（旧版 PowerPoint）
  '.ppt': [
    {
      signature: [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1],
      offset: 0,
      description: 'Legacy PowerPoint (OLE2)',
    },
  ],

  // RAR 文件
  '.rar': [
    {
      signature: [0x52, 0x61, 0x72, 0x21], // Rar!
      offset: 0,
      description: 'RAR archive',
    },
  ],

  // 7z 文件
  '.7z': [
    {
      signature: [0x37, 0x7A, 0xBC, 0xAF, 0x27, 0x1C], // 7z¼¯'
      offset: 0,
      description: '7z archive',
    },
  ],

  // TAR 文件
  '.tar': [
    {
      signature: [0x75, 0x73, 0x74, 0x61, 0x72], // ustar
      offset: 257,
      description: 'TAR archive',
    },
  ],

  // GZ 文件
  '.gz': [
    {
      signature: [0x1F, 0x8B], // GZIP
      offset: 0,
      description: 'GZIP archive',
    },
  ],

  // PNG 图片
  '.png': [
    {
      signature: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
      offset: 0,
      description: 'PNG image',
    },
  ],

  // JPEG 图片
  '.jpg': [
    {
      signature: [0xFF, 0xD8, 0xFF],
      offset: 0,
      description: 'JPEG image',
    },
  ],

  '.jpeg': [
    {
      signature: [0xFF, 0xD8, 0xFF],
      offset: 0,
      description: 'JPEG image',
    },
  ],

  // GIF 图片
  '.gif': [
    {
      signature: [0x47, 0x49, 0x46, 0x38], // GIF8
      offset: 0,
      description: 'GIF image',
    },
  ],

  // WebP 图片
  '.webp': [
    {
      signature: [0x52, 0x49, 0x46, 0x46], // RIFF
      offset: 0,
      description: 'WebP image',
    },
  ],
};

/**
 * 魔数验证器
 */
export class MagicNumberValidator {
  /** 魔数映射 */
  private magicNumbers: Record<FileExtension, MagicNumberPattern[]>;

  /** 是否启用严格模式（不匹配时拒绝） */
  private strictMode: boolean;

  /**
   * 创建魔数验证器
   *
   * @param strictMode - 是否启用严格模式（默认 true）
   */
  constructor(strictMode: boolean = true) {
    this.magicNumbers = MAGIC_NUMBERS;
    this.strictMode = strictMode;
  }

  /**
   * 验证文件魔数
   *
   * @param buffer - 文件内容（ArrayBuffer 或 Uint8Array）
   * @param expectedExtension - 期望的文件扩展名
   * @returns 验证结果
   */
  validate(
    buffer: ArrayBuffer | Uint8Array,
    expectedExtension: string
  ): ValidationResult {
    // 标准化扩展名
    const ext = expectedExtension.toLowerCase().startsWith('.')
      ? (expectedExtension.toLowerCase() as FileExtension)
      : (`.${expectedExtension.toLowerCase()}` as FileExtension);

    // 检查是否有该扩展名的魔数定义
    const patterns = this.magicNumbers[ext];

    if (!patterns || patterns.length === 0) {
      // 没有魔数定义的文件类型（如 .txt, .csv）
      if (this.strictMode) {
        return {
          valid: true,
          errorCode: 'file_empty',
          message: 'No magic number defined for this file type',
        };
      } else {
        return {
          valid: true,
          errorCode: 'unknown_error',
          message: 'No magic number defined for this file type',
        };
      }
    }

    // 转换为 Uint8Array
    const uint8Array = buffer instanceof ArrayBuffer
      ? new Uint8Array(buffer)
      : buffer;

    // 检查所有可能的魔数模式
    for (const pattern of patterns) {
      if (this.matchPattern(uint8Array, pattern)) {
        return {
          valid: true,
          errorCode: 'magic_number_invalid',
          message: `Magic number matched: ${pattern.description}`,
        };
      }
    }

    // 严格模式下，魔数不匹配则拒绝
    if (this.strictMode) {
      return {
        valid: false,
        error: 'File magic number does not match the expected file type',
        errorCode: 'magic_number_invalid',
        details: {
          expectedExtension: ext,
          expectedPatterns: patterns.map((p) => p.description),
        },
      };
    }

    // 非严格模式下，返回警告
    return {
      valid: true,
      errorCode: 'unknown_error',
      message: 'File magic number could not be verified',
    };
  }

  /**
   * 检测文件的真实类型
   *
   * @param buffer - 文件内容
   * @returns 检测到的文件扩展名列表
   */
  detectType(buffer: ArrayBuffer | Uint8Array): FileExtension[] {
    const uint8Array = buffer instanceof ArrayBuffer
      ? new Uint8Array(buffer)
      : buffer;

    const detected: FileExtension[] = [];

    // 遍历所有扩展名的魔数
    for (const [ext, patterns] of Object.entries(this.magicNumbers)) {
      for (const pattern of patterns) {
        if (this.matchPattern(uint8Array, pattern)) {
          detected.push(ext as FileExtension);
          break; // 找到一个匹配即可
        }
      }
    }

    return detected;
  }

  /**
   * 匹配魔数模式
   *
   * @param buffer - 文件内容
   * @param pattern - 魔数模式
   * @returns 是否匹配
   */
  private matchPattern(buffer: Uint8Array, pattern: MagicNumberPattern): boolean {
    const { signature, offset } = pattern;

    // 检查缓冲区是否足够长
    if (buffer.length < offset + signature.length) {
      return false;
    }

    // 逐字节比较
    for (let i = 0; i < signature.length; i++) {
      if (buffer[offset + i] !== signature[i]) {
        return false;
      }
    }

    return true;
  }

  /**
   * 添加自定义魔数
   *
   * @param extension - 文件扩展名
   * @param pattern - 魔数模式
   */
  addMagicNumber(extension: FileExtension, pattern: MagicNumberPattern): void {
    if (!this.magicNumbers[extension]) {
      this.magicNumbers[extension] = [];
    }
    this.magicNumbers[extension].push(pattern);
  }

  /**
   * 设置严格模式
   *
   * @param strict - 是否启用严格模式
   */
  setStrictMode(strict: boolean): void {
    this.strictMode = strict;
  }

  /**
   * 获取所有支持的文件扩展名
   *
   * @returns 文件扩展名数组
   */
  getSupportedExtensions(): FileExtension[] {
    return Object.keys(this.magicNumbers) as FileExtension[];
  }
}

/**
 * 创建默认的魔数验证器
 *
 * @param strictMode - 是否启用严格模式（默认 true）
 * @returns 魔数验证器实例
 */
export function createMagicNumberValidator(strictMode?: boolean): MagicNumberValidator {
  return new MagicNumberValidator(strictMode);
}

/**
 * 默认的魔数验证器实例
 */
export const defaultMagicNumberValidator = new MagicNumberValidator(true);