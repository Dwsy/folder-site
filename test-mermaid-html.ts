import { MarkdownParser } from './src/parsers/markdown.js';

const parser = new MarkdownParser();
const markdown = `
\`\`\`mermaid
graph LR
  A --> B
\`\`\`
`;

const result = await parser.parse(markdown);
console.log('=== Mermaid HTML ===');
console.log(result.html);
