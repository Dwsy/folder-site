/**
 * Markdown Parser 使用示例
 */

import {
  MarkdownParser,
  parseMarkdown,
  markdownToHTML,
  defaultMarkdownParser,
} from '../src/parsers/index.js';

// 示例 1: 基本使用
console.log('=== 示例 1: 基本使用 ===');
const basicMarkdown = '# Hello World\n\nThis is **bold** and *italic* text.';
const basicResult = parseMarkdown(basicMarkdown);
console.log('HTML:', basicResult.html);
console.log('AST:', JSON.stringify(basicResult.ast, null, 2));
console.log('');

// 示例 2: 带有 frontmatter 的 Markdown
console.log('=== 示例 2: 带有 frontmatter ===');
const markdownWithFrontmatter = `---
title: My Document
description: A test document
author: John Doe
tags: [markdown, parser]
---

# Document Title

This is a document with frontmatter.
`;
const frontmatterResult = parseMarkdown(markdownWithFrontmatter);
console.log('Frontmatter:', frontmatterResult.frontmatter);
console.log('');

// 示例 3: GFM 支持
console.log('=== 示例 3: GFM 支持 ===');
const gfmMarkdown = `| Feature | Status |
|---------|--------|
| Tables  | ✅      |
| Strikethrough | ~~removed~~ |
| Task List | - [x] Done
             | - [ ] Todo |`;
const gfmResult = parseMarkdown(gfmMarkdown);
console.log('HTML:', gfmResult.html);
console.log('');

// 示例 4: 数学公式
console.log('=== 示例 4: 数学公式 ===');
const mathMarkdown = `# Math Examples

Inline formula: $E = mc^2$

Block formula:
$$
\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}
$$`;
const mathResult = parseMarkdown(mathMarkdown);
console.log('HTML:', mathResult.html);
console.log('Math expressions count:', mathResult.metadata.mathExpressions);
console.log('');

// 示例 5: 代码块
console.log('=== 示例 5: 代码块 ===');
const codeMarkdown = `\`\`\`typescript
interface User {
  name: string;
  age: number;
}

const user: User = { name: 'Alice', age: 30 };
\`\`\``;
const codeResult = parseMarkdown(codeMarkdown);
console.log('HTML:', codeResult.html);
console.log('Code blocks count:', codeResult.metadata.codeBlocks);
console.log('');

// 示例 6: 自定义选项
console.log('=== 示例 6: 自定义选项 ===');
const customParser = new MarkdownParser({
  gfm: false,
  math: false,
  highlight: false,
});
const customMarkdown = '~~strikethrough~~ and $math$';
const customResult = customParser.parse(customMarkdown);
console.log('HTML (GFM disabled):', customResult.html);
console.log('');

// 示例 7: 异步解析
console.log('=== 示例 7: 异步解析 ===');
async function asyncExample() {
  const asyncMarkdown = '# Async\n\nThis is parsed asynchronously.';
  const asyncResult = await parseMarkdown(asyncMarkdown);
  console.log('HTML:', asyncResult.html);
  console.log('Parse time:', asyncResult.metadata.parseTime, 'ms');
}
asyncExample();
console.log('');

// 示例 8: 只获取 HTML
console.log('=== 示例 8: 只获取 HTML ===');
const htmlOnly = markdownToHTML('# Quick HTML\n\nJust need HTML output.');
console.log('HTML:', htmlOnly);
console.log('');

// 示例 9: 完整元数据
console.log('=== 示例 9: 完整元数据 ===');
const fullMarkdown = `---
title: Full Example
---

# Full Metadata

This document has:
- Code blocks: \`\`\`js\nconst x = 1;\n\`\`\`
- Links: [GitHub](https://github.com)
- Images: ![Alt](image.png)
- Tables: | A | B |\n|---|---|\n| 1 | 2 |
- Math: $x^2$
- Task list: - [x] Done
`;
const fullResult = parseMarkdown(fullMarkdown);
console.log('Metadata:', fullResult.metadata);
console.log('');

// 示例 10: 默认解析器
console.log('=== 示例 10: 默认解析器 ===');
const defaultResult = defaultMarkdownParser.parse('# Default Parser\n\nUsing default settings.');
console.log('HTML:', defaultResult.html);
console.log('Options:', defaultMarkdownParser.getOptions());