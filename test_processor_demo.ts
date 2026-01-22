import { processMarkdown } from './src/server/services/processor.ts';

const testMarkdown = `# Welcome to Folder-Site

This is a **unified processing pipeline** test.

## Features

- GitHub Flavored Markdown support
- Math expressions: $E = mc^2$
- Code highlighting:

\`\`\`typescript
const processor = createProcessor({ gfm: true, math: true });
const result = await processor.process(markdown);
\`\`\`

| Feature | Status |
|---------|--------|
| GFM     | ✓      |
| Math    | ✓      |
| Highlight | ✓    |
`;

const result = await processMarkdown(testMarkdown);
console.log('HTML Output:');
console.log(result.html);
console.log('\nMetadata:');
console.log(JSON.stringify(result.metadata, null, 2));