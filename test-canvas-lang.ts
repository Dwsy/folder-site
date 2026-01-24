import { MarkdownParser } from './src/parsers/markdown.js';

const parser = new MarkdownParser();
const markdown = `
\`\`\`canvas
{
  "nodes": [{"id": "1", "type": "text", "text": "Test", "x": 0, "y": 0, "width": 100, "height": 60}],
  "edges": []
}
\`\`\`
`;

const result = await parser.parse(markdown);
console.log('=== HTML Output ===');
console.log(result.html);
console.log('\n=== Checking ===');
console.log('Has data-json-canvas:', result.html.includes('data-json-canvas'));
console.log('Has class json-canvas:', result.html.includes('class="json-canvas"'));
