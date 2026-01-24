import { markdownToHTML } from './src/parsers/index.js';

const markdown = `
# Test

\`\`\`infographic
{
  "type": "interval",
  "data": [
    { "genre": "Sports", "sold": 275 }
  ],
  "encode": {
    "x": "genre",
    "y": "sold"
  }
}
\`\`\`
`;

const html = await markdownToHTML(markdown, {
  gfm: true,
  frontmatter: false,
  highlight: true,
  math: false,
  mermaid: false,
});

console.log('HTML:', html);
console.log('\nHas infographic class:', html.includes('class="infographic"'));

// 提取 code 标签内容
const match = html.match(/<code[^>]*>([\s\S]*?)<\/code>/);
if (match) {
  console.log('\nCode content:', match[1].substring(0, 100));
}
