/**
 * WorkHub 解析器使用示例
 */

import { WorkHubParser } from '../src/server/lib/workhub-parser';
import { join } from 'node:path';

async function main() {
  // 创建解析器实例
  const parser = new WorkHubParser(join(process.cwd(), 'docs'), {
    includeADRs: true,
    includeIssues: true,
    includePRs: true,
    parseContent: true,
    extractMetadata: true,
  });

  // 解析所有 WorkHub 文档
  const result = await parser.parse();

  console.log(`解析完成！`);
  console.log(`- ADRs: ${result.stats.totalADRs}`);
  console.log(`- Issues: ${result.stats.totalIssues}`);
  console.log(`- PRs: ${result.stats.totalPRs}`);
  console.log(`- 总耗时: ${result.stats.parseTime}ms`);

  // 仅解析 ADRs
  const adrs = await parser.parseADRs();
  console.log(`\nADRs 列表:`);
  adrs.forEach(adr => {
    console.log(`  - [${adr.status}] ${adr.title} (${adr.id})`);
  });

  // 仅解析 Issues
  const issues = await parser.parseIssues();
  console.log(`\nIssues 列表:`);
  issues.forEach(issue => {
    console.log(`  - [${issue.status}] ${issue.title} (${issue.id})`);
  });

  // 仅解析 PRs
  const prs = await parser.parsePRs();
  console.log(`\nPRs 列表:`);
  prs.forEach(pr => {
    console.log(`  - [${pr.status}] ${pr.title} (${pr.id})`);
  });
}

main().catch(console.error);
