# Markdown Parser

基于 unified 生态的 Markdown 解析器，支持 GFM、frontmatter、代码高亮和 LaTeX 数学公式。

## 功能特性

- ✅ **GFM 支持**: 表格、删除线、任务列表、自动链接等
- ✅ **Frontmatter 解析**: 提取 YAML 元数据
- ✅ **代码块高亮**: 支持多语言语法高亮
- ✅ **LaTeX 支持**: 行内公式 ($ formula $) 和块级公式 ($$ formula $$)
- ✅ **AST 输出**: 返回完整的 MDAST 结构
- ✅ **HTML 输出**: 可选的 HTML 渲染输出
- ✅ **元数据统计**: 代码块、数学公式、表格、链接、图片等统计
- ✅ **同步和异步 API**: 灵活的 API 设计

## 安装

```bash
bun add unified remark-parse remark-gfm remark-frontmatter remark-math remark-rehype rehype-highlight rehype-katex rehype-stringify
```

## 快速开始

### 基本使用

```typescript
import { parseMarkdown } from './src/parsers/index.js';

const markdown = '# Hello World\n\nThis is **bold** text.';
const result = parseMarkdown(markdown);

console.log(result.html); // <h1>Hello World</h1>\n<p>This is <strong>bold</strong> text.</p>
console.log(result.ast); // MDAST 根节点
```

### 带有 Frontmatter

```typescript
const markdown = `---
title: My Document
description: A test document
---

# Document Title

This is a document with frontmatter.
`;

const result = parseMarkdown(markdown);
console.log(result.frontmatter); // { title: 'My Document', description: 'A test document' }
```

### GFM 支持

```typescript
const markdown = `| Feature | Status |
|---------|--------|
| Tables  | ✅      |
| Task List | - [x] Done
             | - [ ] Todo |`;

const result = parseMarkdown(markdown);
console.log(result.html); // 包含表格和任务列表的 HTML
```

### 数学公式

```typescript
const markdown = `# Math Examples

Inline formula: $E = mc^2$

Block formula:
$$
\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}
$$`;

const result = parseMarkdown(markdown);
console.log(result.html); // 包含数学公式的 HTML
console.log(result.metadata.mathExpressions); // 2
```

## API

### MarkdownParser 类

```typescript
class MarkdownParser {
  constructor(options?: MarkdownParserOptions);
  
  // 解析 Markdown（同步）
  parse(markdown: string): ParseResult;
  
  // 解析 Markdown（异步）
  parseAsync(markdown: string): Promise<ParseResult>;
  
  // 解析为 MDAST
  parseToAST(markdown: string): Root;
  
  // 转换为 HTML
  parseToHTML(markdown: string): string;
  parseToHTMLAsync(markdown: string): Promise<string>;
  
  // 更新选项
  updateOptions(options: Partial<MarkdownParserOptions>): void;
  
  // 获取当前选项
  getOptions(): Readonly<Required<MarkdownParserOptions>>;
}
```

### 配置选项

```typescript
interface MarkdownParserOptions {
  // 是否启用 GFM (默认: true)
  gfm?: boolean;
  
  // 是否解析 frontmatter (默认: true)
  frontmatter?: boolean;
  
  // 是否启用代码高亮 (默认: true)
  highlight?: boolean;
  
  // 是否支持 LaTeX 公式 (默认: true)
  math?: boolean;
  
  // 代码高亮主题 (默认: 'github')
  highlightTheme?: string;
  
  // 是否保留原始内容 (默认: true)
  preserveContent?: boolean;
  
  // 是否生成 HTML 输出 (默认: true)
  generateHTML?: boolean;
}
```

### 解析结果

```typescript
interface ParseResult {
  // 解析后的 MDAST
  ast: Root;
  
  // 提取的 frontmatter 数据
  frontmatter?: Record<string, any>;
  
  // 渲染后的 HTML
  html: string;
  
  // 原始 Markdown 内容
  content: string;
  
  // 解析元数据
  metadata: {
    codeBlocks: number;
    mathExpressions: number;
    tables: number;
    taskListItems: number;
    links: number;
    images: number;
    parseTime: number;
    hasFrontmatter: boolean;
  };
}
```

### 快捷函数

```typescript
// 解析 Markdown
parseMarkdown(markdown: string, options?: MarkdownParserOptions): ParseResult;
parseMarkdownAsync(markdown: string, options?: MarkdownParserOptions): Promise<ParseResult>;

// 转换为 HTML
markdownToHTML(markdown: string, options?: MarkdownParserOptions): string;
markdownToHTMLAsync(markdown: string, options?: MarkdownParserOptions): Promise<string>;
```

## 高级用法

### 自定义选项

```typescript
import { MarkdownParser } from './src/parsers/index.js';

// 创建自定义配置的解析器
const parser = new MarkdownParser({
  gfm: false,
  math: false,
  highlight: true,
});

const result = parser.parse('# Title');
```

### 动态更新选项

```typescript
const parser = new MarkdownParser();

// 更新选项（会重新构建处理器）
parser.updateOptions({ gfm: false });

const result = parser.parse('~~strikethrough~~');
```

### 默认解析器

```typescript
import { defaultMarkdownParser } from './src/parsers/index.js';

// 使用默认配置的解析器
const result = defaultMarkdownParser.parse('# Title');
```

## 测试

```bash
bun test tests/parser.test.ts
```

## 示例

查看 `examples/markdown-parser-example.ts` 获取更多使用示例。

## 依赖

- `unified` - 统一的文本处理框架
- `remark-parse` - Markdown 解析器
- `remark-gfm` - GitHub Flavored Markdown 支持
- `remark-frontmatter` - Frontmatter 解析
- `remark-math` - 数学公式支持
- `remark-rehype` - MDAST 到 HAST 转换
- `rehype-highlight` - 代码高亮
- `rehype-katex` - KaTeX 数学渲染
- `rehype-stringify` - HAST 到 HTML 转换

## 相关任务

- [任务013](../task/folder-site/任务013.md) - 配置 unified 处理管道
- [任务015](../task/folder-site/任务015.md) - 实现 AST 转换器（待完成）