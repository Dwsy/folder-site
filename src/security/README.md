# 安全验证模块

安全验证模块为 VSCode Office 集成项目提供全面的安全防护功能，包括文件类型验证、魔数检查、XSS 防护和文件大小限制。

## 功能特性

### 1. 文件类型验证 (FileTypeValidator)

根据文件扩展名验证文件类型，支持可配置的允许文件类型列表（白名单机制）。

**支持的文件类型：**
- Office 文档：.docx, .xlsx, .pptx, .pdf
- 文本文件：.txt, .md, .json, .xml, .html
- 压缩文件：.zip, .rar, .7z, .tar, .gz

**用法示例：**
```typescript
import { FileTypeValidator, createFileTypeValidator } from './security/index.js';

// 使用默认配置
const validator = new FileTypeValidator();
const result = validator.validate('test.xlsx');
console.log(result.valid); // true
console.log(result.fileType); // 'excel'

// 自定义配置
const customValidator = new FileTypeValidator({
  allowedTypes: ['excel', 'pdf'],
  allowedExtensions: ['.xlsx', '.pdf'],
});

// 添加允许的类型
customValidator.addAllowedTypes('word');
```

### 2. 魔数检查 (MagicNumberValidator)

读取文件头部字节验证真实文件类型，防止文件扩展名伪造攻击。

**支持的魔数：**
- PDF: `25 50 44 46` (%PDF)
- ZIP (docx/xlsx/pptx): `50 4B 03 04` (PK..)
- OLE2 (doc/xls/ppt): `D0 CF 11 E0`
- RAR: `52 61 72 21` (Rar!)
- 7z: `37 7A BC AF 27 1C`
- GZIP: `1F 8B`

**用法示例：**
```typescript
import { MagicNumberValidator, createMagicNumberValidator } from './security/index.js';

const validator = new MagicNumberValidator(true); // 严格模式
const fileContent = new Uint8Array([0x25, 0x50, 0x44, 0x46]); // PDF magic number
const result = validator.validate(fileContent, '.pdf');
console.log(result.valid); // true

// 检测文件类型
const detected = validator.detectType(fileContent);
console.log(detected); // ['.pdf']
```

### 3. XSS 防护 (XSSSanitizer)

使用 DOMPurify 清理 HTML 内容，防止 XSS 攻击。

**功能：**
- 移除危险脚本标签
- 移除内联事件处理器
- 过滤危险的 URL 协议
- 可配置的允许标签和属性

**用法示例：**
```typescript
import { XSSSanitizer, createXSSSanitizer, sanitizeHtml } from './security/index.js';

// 使用默认配置
const sanitizer = new XSSSanitizer();
const dangerousHtml = '<script>alert("XSS")</script><p>Safe content</p>';
const result = sanitizer.sanitize(dangerousHtml);
console.log(result.clean); // '<p>Safe content</p>'
console.log(result.wasModified); // true

// 便捷函数
const clean = sanitizeHtml('<div onclick="alert(1)">Click</div>');

// 自定义配置
const customSanitizer = new XSSSanitizer({
  allowedTags: ['p', 'strong', 'em'],
  strictMode: true,
});
```

### 4. 安全验证器 (SecurityValidator)

一站式安全验证，整合所有安全功能。

**用法示例：**
```typescript
import { SecurityValidator, createSecurityValidator } from './security/index.js';

// 使用默认配置
const validator = new SecurityValidator();

// 验证文件
const fileContent = new Uint8Array([0x50, 0x4B, 0x03, 0x04]);
const result = await validator.validateFile('test.xlsx', fileContent, 1024);
console.log(result.valid); // true
console.log(result.safe); // true

// 清理 HTML
const cleanResult = validator.sanitizeHtml('<script>alert("XSS")</script><p>Content</p>');
console.log(cleanResult.clean); // '<p>Content</p>'

// 自定义配置
const customValidator = new SecurityValidator({
  validateExtension: true,
  validateMagicNumber: true,
  validateFileSize: true,
  sanitizeHtml: true,
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['excel', 'pdf'],
  strictMode: true,
});
```

## 配置选项

### SecurityValidationOptions

```typescript
interface SecurityValidationOptions {
  // 文件类型验证
  validateExtension?: boolean;      // 是否验证文件扩展名（默认 true）
  validateMagicNumber?: boolean;    // 是否验证魔数（默认 true）
  validateFileSize?: boolean;       // 是否验证文件大小（默认 true）
  maxFileSize?: number;             // 最大文件大小（字节，默认 10MB）
  
  // XSS 防护
  sanitizeHtml?: boolean;           // 是否清理 HTML（默认 true）
  strictMode?: boolean;             // 是否启用严格模式（默认 true）
  
  // 文件类型
  allowedTypes?: FileType[];        // 允许的文件类型
  allowedExtensions?: FileExtension[]; // 允许的文件扩展名
  customFileTypes?: Record<FileExtension, FileType>; // 自定义文件类型
  
  // 魔数验证
  strictMagicNumberCheck?: boolean; // 是否启用严格魔数检查（默认 true）
  
  // XSS 清理选项
  sanitizeOptions?: SanitizeOptions;
}
```

### SanitizeOptions

```typescript
interface SanitizeOptions {
  strictMode?: boolean;             // 是否启用严格模式
  allowedTags?: string[];           // 允许的标签
  allowedAttributes?: Record<string, string[]>; // 允许的属性
  allowedProtocols?: string[];      // 允许的 URL 协议
  allowComments?: boolean;          // 是否允许注释
  keepContent?: boolean;            // 是否保留内容
  useProfile?: DOMPurify.UseProfiles; // DOMPurify 配置文件
  forceBody?: boolean;              // 是否强制 body 标签
  allowUnknownProtocols?: boolean;  // 是否允许未知协议
  addAttr?: string[];               // 添加允许的属性
  addTags?: string[];               // 添加允许的标签
  forbidAttr?: string[];            // 禁止的属性
  forbidTags?: string[];            // 禁止的标签
}
```

## 集成到渲染器

### ExcelRenderer 示例

```typescript
import { SecurityValidator } from '../../src/security/index.js';

export class ExcelRenderer {
  private securityValidator: SecurityValidator;

  constructor() {
    this.securityValidator = new SecurityValidator({
      validateExtension: true,
      validateMagicNumber: true,
      sanitizeHtml: true,
      allowedTypes: ['excel'],
    });
  }

  async render(
    content: string | ArrayBuffer,
    options?: ExcelRendererOptions & { filePath?: string; fileSize?: number }
  ): Promise<string> {
    // 安全验证
    if (options?.filePath) {
      const buffer = typeof content === 'string'
        ? new TextEncoder().encode(content).buffer
        : content;
      
      const validationResult = await this.securityValidator.validateFile(
        options.filePath,
        buffer,
        options.fileSize
      );
      
      if (!validationResult.valid) {
        throw new Error(`Security validation failed: ${validationResult.errors.join(', ')}`);
      }
    }

    // 渲染内容
    const html = await this.renderInternal(content, options);

    // XSS 防护
    const sanitizeResult = this.securityValidator.sanitizeHtml(html);
    return sanitizeResult.clean;
  }
}
```

## 安全最佳实践

1. **始终验证用户输入**
   - 使用文件类型验证和魔数检查
   - 不要只依赖文件扩展名

2. **使用白名单而非黑名单**
   - 明确指定允许的文件类型
   - 明确指定允许的 HTML 标签和属性

3. **多层防御**
   - 文件扩展名 + 魔数 + 文件大小 + XSS 防护
   - 每一层都有独立的验证机制

4. **及时更新依赖**
   - 定期更新 DOMPurify 版本
   - 关注安全漏洞公告

5. **记录安全验证日志**
   - 记录验证失败的事件
   - 便于审计和问题排查

6. **提供清晰的错误信息**
   - 告诉用户为什么文件被拒绝
   - 避免泄露敏感信息

## 测试

运行测试：

```bash
bun test tests/security.test.ts
```

测试覆盖：
- 文件类型验证
- 魔数检查
- XSS 防护
- 集成测试
- 边界情况处理

## API 参考

### 类

- `FileTypeValidator` - 文件类型验证器
- `MagicNumberValidator` - 魔数验证器
- `XSSSanitizer` - XSS 清理器
- `SecurityValidator` - 安全验证器（主类）

### 工厂函数

- `createFileTypeValidator(options?)` - 创建文件类型验证器
- `createMagicNumberValidator(strictMode?)` - 创建魔数验证器
- `createXSSSanitizer(options?)` - 创建 XSS 清理器
- `createSecurityValidator(options?)` - 创建安全验证器

### 便捷函数

- `validateFile(filePath, content?, fileSize?)` - 验证文件
- `sanitizeHtml(html)` - 清理 HTML

## 许可证

MIT