/**
 * 安全验证模块类型定义
 */

/**
 * 支持的文件类型
 */
export const SUPPORTED_FILE_TYPES = {
  // Office 文档
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  doc: 'application/msword',
  dotx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.template',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  xls: 'application/vnd.ms-excel',
  xlsm: 'application/vnd.ms-excel.sheet.macroEnabled.12',
  csv: 'text/csv',
  ods: 'application/vnd.oasis.opendocument.spreadsheet',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ppt: 'application/vnd.ms-powerpoint',
  // PDF
  pdf: 'application/pdf',
  // 文本文件
  txt: 'text/plain',
  md: 'text/markdown',
  // 压缩文件
  zip: 'application/zip',
  rar: 'application/vnd.rar',
  '7z': 'application/x-7z-compressed',
} as const;

/**
 * 文件类型映射
 */
export type FileExtension = keyof typeof SUPPORTED_FILE_TYPES;

/**
 * 文件魔数（Magic Number）
 * 用于验证文件的真实类型，防止扩展名伪造攻击
 */
export const FILE_MAGIC_NUMBERS: Record<string, number[]> = {
  // ZIP 格式（docx, xlsx, pptx 等都是 ZIP 格式）
  zip: [0x50, 0x4b, 0x03, 0x04], // PK..
  // PDF
  pdf: [0x25, 0x50, 0x44, 0x46], // %PDF
  // 老版本 Office 文档（OLE2 复合文档格式）
  doc: [0xd0, 0xcf, 0x11, 0xe0],
  xls: [0xd0, 0xcf, 0x11, 0xe0],
  ppt: [0xd0, 0xcf, 0x11, 0xe0],
  // 7z
  '7z': [0x37, 0x7a, 0xbc, 0xaf],
  // RAR (RAR4)
  rar: [0x52, 0x61, 0x72, 0x21],
  // RAR5
  rar5: [0x52, 0x61, 0x72, 0x21, 0x1a, 0x07],
} as const;

/**
 * 允许的文件扩展名列表（白名单）
 */
export const ALLOWED_EXTENSIONS: FileExtension[] = [
  // Office 文档
  'docx',
  'doc',
  'dotx',
  'xlsx',
  'xls',
  'xlsm',
  'csv',
  'ods',
  'pptx',
  'ppt',
  // PDF
  'pdf',
  // 文本文件
  'txt',
  'md',
  // 压缩文件
  'zip',
  'rar',
  '7z',
];

/**
 * 文件验证结果
 */
export interface FileValidationResult {
  /** 是否验证通过 */
  valid: boolean;

  /** 错误信息（如果验证失败） */
  error?: string;

  /** 错误代码 */
  errorCode?: FileValidationErrorCode;

  /** 验证通过的扩展名 */
  extension?: string;

  /** 验证通过的 MIME 类型 */
  mimeType?: string;

  /** 魔数检查结果 */
  magicNumberValid?: boolean;

  /** 文件类型 */
  fileType?: string;

  /** 错误代码（旧版，兼容性） */
  code?: string;

  /** 消息 */
  message?: string;

  /** 验证详情 */
  details?: Record<string, unknown>;
}

/**
 * 文件验证错误代码
 */
export const FileValidationErrorCode = {
  /** 文件扩展名不允许 */
  EXTENSION_NOT_ALLOWED: 'extension_not_allowed',

  /** 文件类型不匹配 */
  TYPE_MISMATCH: 'type_mismatch',

  /** 魔数检查失败 */
  MAGIC_NUMBER_INVALID: 'magic_number_invalid',

  /** 文件大小超出限制 */
  FILE_TOO_LARGE: 'file_too_large',

  /** 文件为空 */
  FILE_EMPTY: 'file_empty',

  /** 文件读取失败 */
  FILE_READ_FAILED: 'file_read_failed',

  /** 未知错误 */
  UNKNOWN_ERROR: 'unknown_error',
} as const;

/**
 * 文件验证错误代码类型
 */
export type FileValidationErrorCode = typeof FileValidationErrorCode[keyof typeof FileValidationErrorCode];

/**
 * 文件验证选项
 */
export interface FileValidationOptions {
  /** 允许的扩展名列表（默认使用白名单） */
  allowedExtensions?: FileExtension[];

  /** 最大文件大小（字节，默认 10MB） */
  maxFileSize?: number;

  /** 是否启用魔数检查（默认 true） */
  enableMagicNumberCheck?: boolean;

  /** 是否允许空的文件（默认 false） */
  allowEmpty?: boolean;

  /** 自定义验证器 */
  customValidators?: Array<(file: File | Buffer) => FileValidationResult>;

  /** 是否验证扩展名 */
  validateExtension?: boolean;

  /** 是否验证文件大小 */
  validateFileSize?: number;

  /** 是否验证魔数 */
  validateMagicNumber?: boolean;

  /** 是否启用严格魔数检查 */
  strictMagicNumberCheck?: boolean;

  /** 是否清理 HTML */
  sanitizeHtml?: boolean;

  /** 是否启用严格模式 */
  strictMode?: boolean;

  /** 允许的文件类型 */
  allowedTypes?: string[];

  /** 自定义文件类型 */
  customFileTypes?: Record<string, string>;

  /** 清理选项 */
  sanitizeOptions?: XSSSanitizeOptions;
}

/**
 * 文件信息
 */
export interface FileInfo {
  /** 文件名 */
  name: string;

  /** 文件大小（字节） */
  size: number;

  /** 文件类型（MIME 类型） */
  type?: string;

  /** 最后修改时间 */
  lastModified?: number;
}

/**
 * XSS 防护选项
 */
export interface XSSSanitizeOptions {
  /** 允许的 HTML 标签 */
  allowedTags?: string[];

  /** 允许的 HTML 属性 */
  allowedAttributes?: Record<string, string[]>;

  /** 是否允许自定义协议（如 javascript:） */
  allowCustomProtocols?: boolean;

  /** 允许的 URI 协议 */
  allowedURISchemes?: string[];

  /** 是否移除注释 */
  removeComments?: boolean;

  /** 是否移除空标签 */
  removeEmptyElements?: boolean;

  /** 最大 HTML 长度（防止超大 HTML 攻击） */
  maxLength?: number;

  /** 是否启用严格模式 */
  strictMode?: boolean;

  /** 是否保留内容 */
  keepContent?: boolean;

  /** 是否允许注释 */
  allowComments?: boolean;

  /** 使用配置文件 */
  useProfile?: 'html' | 'svg' | 'svgFilters';

  /** 是否强制 body 标签 */
  forceBody?: boolean;

  /** 是否允许未知协议 */
  allowUnknownProtocols?: boolean;

  /** 添加允许的属性 */
  addAttr?: string[];

  /** 添加允许的标签 */
  addTags?: string[];

  /** 禁止的属性 */
  forbidAttr?: string[];

  /** 禁止的标签 */
  forbidTags?: string[];
}

/**
 * 默认允许的 HTML 标签（用于 Office 文档渲染）
 */
export const DEFAULT_ALLOWED_TAGS = [
  // 文档结构
  'div', 'span', 'p', 'br', 'hr',
  // 标题
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  // 列表
  'ul', 'ol', 'li',
  // 表格
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
  // 文本格式
  'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'sub', 'sup',
  // 引用
  'blockquote', 'q', 'cite',
  // 代码
  'code', 'pre',
  // 图片和媒体
  'img', 'video', 'audio', 'source',
  // 链接
  'a',
  // 其他
  'small', 'big', 'mark', 'del', 'ins',
] as const;

/**
 * 默认允许的 HTML 属性
 */
export const DEFAULT_ALLOWED_ATTRIBUTES = {
  // 全局属性
  '*': ['id', 'class', 'style', 'title', 'lang', 'dir'],
  // 链接属性
  'a': ['href', 'target', 'rel', 'download'],
  // 图片属性
  'img': ['src', 'alt', 'width', 'height', 'loading'],
  // 表格属性
  'table': ['border', 'cellpadding', 'cellspacing'],
  'td': ['colspan', 'rowspan', 'align', 'valign'],
  'th': ['colspan', 'rowspan', 'align', 'valign'],
  // 媒体属性
  'video': ['controls', 'autoplay', 'loop', 'muted', 'poster'],
  'audio': ['controls', 'autoplay', 'loop', 'muted'],
  'source': ['src', 'type'],
} as const;

/**
 * 默认允许的 URI 协议
 */
export const DEFAULT_ALLOWED_URI_SCHEMES = [
  'http:',
  'https:',
  'mailto:',
  'tel:',
  'data:',
] as const;

/**
 * 安全配置
 */
export interface SecurityConfig {
  /** 文件验证配置 */
  fileValidation: FileValidationOptions;

  /** XSS 防护配置 */
  xssSanitize: XSSSanitizeOptions;

  /** 是否启用安全日志 */
  enableLogging?: boolean;

  /** 是否启用严格模式（更严格的验证） */
  strictMode?: boolean;
}

/**
 * 安全验证日志
 */
export interface SecurityLog {
  /** 时间戳 */
  timestamp: number;

  /** 日志级别 */
  level: 'info' | 'warn' | 'error';

  /** 日志类型 */
  type: 'file_validation' | 'xss_sanitization' | 'magic_number_check';

  /** 消息 */
  message: string;

  /** 相关数据 */
  data?: Record<string, unknown>;
}

/**
 * 安全验证统计
 */
export interface SecurityStats {
  /** 总验证次数 */
  totalValidations: number;

  /** 成功次数 */
  successCount: number;

  /** 失败次数 */
  failureCount: number;

  /** 按错误类型统计 */
  errorsByType: Record<FileValidationErrorCode, number>;
}