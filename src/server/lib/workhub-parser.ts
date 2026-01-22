/**
 * WorkHub 文档解析器
 *
 * 解析 docs/ 目录结构，支持 ADR、Issue 和 PR 文档的解析
 * 依赖文件扫描服务 (src/server/services/scanner.ts)
 */

import { readFile } from 'node:fs/promises';
import { scanFiles, type FileInfo } from '../services/scanner.js';
import type {
  WorkHubResult,
  ADREntry,
  IssueEntry,
  PREntry,
  WorkHubMetadata,
  WorkHubParserOptions,
  WorkHubStats,
  ADRStatus,
} from '../../types/workhub.js';

/**
 * WorkHub 解析器类
 */
export class WorkHubParser {
  private docsDir: string;
  private options: WorkHubParserOptions;

  /**
   * 构造函数
   * @param docsDir docs/ 目录路径
   * @param options 解析选项
   */
  constructor(docsDir: string, options: Partial<WorkHubParserOptions> = {}) {
    this.docsDir = docsDir;
    this.options = {
      includeADRs: options.includeADRs ?? true,
      includeIssues: options.includeIssues ?? true,
      includePRs: options.includePRs ?? true,
      parseContent: options.parseContent ?? true,
      extractMetadata: options.extractMetadata ?? true,
    };
  }

  /**
   * 解析整个 docs/ 目录
   * @returns 解析结果
   */
  async parse(): Promise<WorkHubResult> {
    const startTime = Date.now();
    const adrs: ADREntry[] = [];
    const issues: IssueEntry[] = [];
    const prs: PREntry[] = [];
    const errors: Error[] = [];

    // 扫描 docs/ 目录
    const files = await this.scanDocsDirectory();

    // 解析各类文档
    for (const file of files) {
      try {
        if (this.options.includeADRs && file.relativePath.startsWith('adr/')) {
          const adr = await this.parseADR(file);
          if (adr) adrs.push(adr);
        } else if (this.options.includeIssues && file.relativePath.startsWith('issues/')) {
          const issue = await this.parseIssue(file);
          if (issue) issues.push(issue);
        } else if (this.options.includePRs && file.relativePath.startsWith('pr/')) {
          const pr = await this.parsePR(file);
          if (pr) prs.push(pr);
        }
      } catch (error) {
        errors.push(error as Error);
      }
    }

    // 生成统计信息
    const stats: WorkHubStats = {
      totalADRs: adrs.length,
      totalIssues: issues.length,
      totalPRs: prs.length,
      totalDocuments: adrs.length + issues.length + prs.length,
      errors: errors.length,
      parseTime: Date.now() - startTime,
    };

    return {
      adrs,
      issues,
      prs,
      stats,
      errors,
      docsDir: this.docsDir,
    };
  }

  /**
   * 扫描 docs/ 目录
   * @returns 文件列表
   */
  private async scanDocsDirectory(): Promise<FileInfo[]> {
    const result = await scanFiles({
      rootDir: this.docsDir,
      extensions: ['.md'],
      excludeDirs: ['node_modules', '.git', 'dist', 'build'],
    });
    return result;
  }

  /**
   * 解析 ADR 文件
   * @param file 文件信息
   * @returns ADR 条目
   */
  private async parseADR(file: FileInfo): Promise<ADREntry | null> {
    const content = await readFile(file.path, 'utf-8');
    const metadata = this.extractFrontmatter(content);

    // 如果没有有效的 frontmatter，返回 null
    if (!metadata.id && !metadata.title) {
      return null;
    }

    // 提取 ADR 编号 (例如: adr/001-use-typescript.md)
    const match = file.name.match(/^(\d+)-(.+)\.md$/);
    const number = match ? parseInt(match[1], 10) : undefined;
    const title = match ? match[2].replace(/-/g, ' ') : file.name.replace('.md', '');

    const status = metadata.status as ADRStatus || 'proposed';

    return {
      type: 'adr',
      id: metadata.id || file.relativePath,
      title: metadata.title || title,
      status,
      number,
      path: file.relativePath,
      filePath: file.path,
      content: this.options.parseContent ? content : undefined,
      metadata,
      createdAt: (metadata.date || metadata.created) ? new Date(metadata.date || metadata.created as string) : file.createdAt,
      updatedAt: metadata.updated ? new Date(metadata.updated as string) : file.modifiedAt,
      // ADR 特有字段
      context: this.extractSection(content, 'Context|背景'),
      decision: this.extractSection(content, 'Decision|决策'),
      consequences: this.extractSection(content, 'Consequences|后果'),
      alternatives: this.extractSection(content, 'Alternatives| alternatives'),
    };
  }

  /**
   * 解析 Issue 文件
   * @param file 文件信息
   * @returns Issue 条目
   */
  private async parseIssue(file: FileInfo): Promise<IssueEntry | null> {
    const content = await readFile(file.path, 'utf-8');
    const metadata = this.extractFrontmatter(content);

    // 提取 Issue 标题
    const titleMatch = content.match(/^# Issue:\s*(.+)$/m);
    const title = metadata.title || titleMatch?.[1] || file.name.replace('.md', '');

    // 提取状态
    const status = this.parseIssueStatus(content, metadata);

    // 提取优先级
    const priority = metadata.priority || this.extractPriority(content);

    return {
      type: 'issue',
      id: metadata.id || file.relativePath,
      title,
      status,
      priority,
      category: metadata.category || this.extractCategory(file.relativePath),
      path: file.relativePath,
      filePath: file.path,
      content: this.options.parseContent ? content : undefined,
      metadata,
      createdAt: metadata.created ? new Date(metadata.created) : file.createdAt,
      updatedAt: metadata.updated ? new Date(metadata.updated) : file.modifiedAt,
      // Issue 特有字段
      goal: this.extractSection(content, 'Goal'),
      background: this.extractSection(content, '背景|问题|Background'),
      acceptanceCriteria: this.extractChecklist(content, '验收标准|Acceptance Criteria'),
      phases: this.extractPhases(content),
      decisions: this.extractTable(content, '关键决策|Decisions'),
      errors: this.extractTable(content, '遇到的错误|Errors'),
      relatedResources: this.extractRelatedResources(content),
      notes: this.extractSection(content, 'Notes|备注'),
      statusLog: this.extractStatusLog(content),
      assignee: metadata.assignee,
      estimatedHours: metadata.estimatedHours,
    };
  }

  /**
   * 解析 PR 文件
   * @param file 文件信息
   * @returns PR 条目
   */
  private async parsePR(file: FileInfo): Promise<PREntry | null> {
    const content = await readFile(file.path, 'utf-8');
    const metadata = this.extractFrontmatter(content);

    // 提取 PR 标题
    const titleMatch = content.match(/^# (?!Issue)(.+)$/m);
    const title = metadata.title || titleMatch?.[1] || file.name.replace('.md', '');

    // 提取状态
    const status = this.parsePRStatus(content, metadata);

    return {
      type: 'pr',
      id: metadata.id || file.relativePath,
      title,
      status,
      category: metadata.category || this.extractCategory(file.relativePath),
      path: file.relativePath,
      filePath: file.path,
      content: this.options.parseContent ? content : undefined,
      metadata,
      createdAt: metadata.created ? new Date(metadata.created) : file.createdAt,
      updatedAt: metadata.updated ? new Date(metadata.updated) : file.modifiedAt,
      // PR 特有字段
      background: this.extractSection(content, '背景与目的|Why|Background'),
      changes: this.extractSection(content, '变更内容概述|What|Changes'),
      linkedIssues: this.extractLinkedIssues(content),
      testResult: this.extractChecklist(content, '测试与验证结果|Test Result'),
      riskAssessment: this.extractSection(content, '风险与影响评估|Risk Assessment'),
      rollbackPlan: this.extractSection(content, '回滚方案|Rollback Plan'),
      changeType: this.extractChangeType(content),
      fileChanges: this.extractTable(content, '文件变更列表|File Changes'),
      breakingChange: this.extractBreakingChange(content),
      performanceImpact: this.extractPerformanceImpact(content),
      dependencyChanges: this.extractDependencyChanges(content),
      securityConsiderations: this.extractSection(content, '安全考虑|Security'),
      reviewChecklist: this.extractChecklist(content, '代码审查检查清单|Review Checklist'),
      reviewLog: this.extractReviewLog(content),
      mergedAt: metadata.mergedAt ? new Date(metadata.mergedAt) : undefined,
      mergedBy: metadata.mergedBy,
      commitHash: metadata.commitHash,
      deployStatus: metadata.deployStatus,
    };
  }

  /**
   * 提取 frontmatter 元数据
   * @param content Markdown 内容
   * @returns 元数据对象
   */
  private extractFrontmatter(content: string): WorkHubMetadata {
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) return {};

    const metadata: WorkHubMetadata = {};
    const lines = frontmatterMatch[1].split('\n');

    for (const line of lines) {
      const match = line.match(/^(\w+):\s*(.*)$/);
      if (match) {
        const [, key, value] = match;
        // 去除引号
        const cleanValue = value.trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');

        // 解析数组类型
        if (cleanValue.startsWith('[') && cleanValue.endsWith(']')) {
          try {
            metadata[key] = JSON.parse(cleanValue.replace(/'/g, '"'));
          } catch {
            metadata[key] = cleanValue;
          }
        } else if (cleanValue === 'true' || cleanValue === 'false') {
          metadata[key] = cleanValue === 'true';
        } else {
          metadata[key] = cleanValue;
        }
      }
    }

    return metadata;
  }

  /**
   * 提取指定章节内容
   * @param content Markdown 内容
   * @param pattern 章节名称模式
   * @returns 章节内容
   */
  private extractSection(content: string, pattern: string): string | undefined {
    const regex = new RegExp(`##\\s*(${pattern})\\s*\\n([\\s\\S]*?)(?=\\n##|\\n---|$)`, 'im');
    const match = content.match(regex);
    if (!match) return undefined;

    return match[2].trim();
  }

  /**
   * 提取检查列表
   * @param content Markdown 内容
   * @param pattern 章节名称模式
   * @returns 检查项数组
   */
  private extractChecklist(content: string, pattern: string): Array<{ checked: boolean; text: string }> | undefined {
    const section = this.extractSection(content, pattern);
    if (!section) return undefined;

    const checklist: Array<{ checked: boolean; text: string }> = [];
    const lines = section.split('\n');

    for (const line of lines) {
      const match = line.match(/^\s*-\s*\[([ x])\]\s*(.+)$/);
      if (match) {
        checklist.push({
          checked: match[1] === 'x',
          text: match[2].trim(),
        });
      }
    }

    return checklist.length > 0 ? checklist : undefined;
  }

  /**
   * 提取表格内容
   * @param content Markdown 内容
   * @param pattern 章节名称模式
   * @returns 表格数据数组
   */
  private extractTable(content: string, pattern: string): Record<string, string>[] | undefined {
    const section = this.extractSection(content, pattern);
    if (!section) return undefined;

    const lines = section.split('\n').filter((line) => line.trim());
    if (lines.length < 2) return undefined;

    // 提取表头
    const headerMatch = lines[0].match(/^\|(.+)\|$/);
    if (!headerMatch) return undefined;

    const headers = headerMatch[1]
      .split('|')
      .map((h) => h.trim())
      .filter((h) => h);

    // 跳过分隔行
    const dataLines = lines.slice(2);
    const result: Record<string, string>[] = [];

    for (const line of dataLines) {
      const rowMatch = line.match(/^\|(.+)\|$/);
      if (rowMatch) {
        const values = rowMatch[1].split('|').map((v) => v.trim());
        const row: Record<string, string> = {};
        headers.forEach((header, index) => {
          if (index < values.length) {
            row[header] = values[index] || '';
          }
        });
        result.push(row);
      }
    }

    return result.length > 0 ? result : undefined;
  }

  /**
   * 提取实施阶段
   * @param content Markdown 内容
   * @returns 阶段数组
   */
  private extractPhases(content: string): Array<{ name: string; tasks: string[] }> | undefined {
    const phasesSection = this.extractSection(content, '实施阶段|Phases');
    if (!phasesSection) return undefined;

    const phases: Array<{ name: string; tasks: string[] }> = [];
    const phaseMatches = phasesSection.matchAll(/^###\s*(.+)\s*$/gm);

    for (const match of phaseMatches) {
      const phaseName = match[1].trim();
      const phaseStart = match.index! + match[0].length;
      const nextPhaseMatch = phasesSection.slice(phaseStart).match(/^###\s/m);
      const phaseEnd = nextPhaseMatch ? phaseStart + nextPhaseMatch.index! : phasesSection.length;

      const phaseContent = phasesSection.slice(phaseStart, phaseEnd);
      const tasks: string[] = [];

      const taskMatches = phaseContent.matchAll(/-\s*\[([ x])\]\s*(.+)/g);
      for (const taskMatch of taskMatches) {
        tasks.push(taskMatch[2].trim());
      }

      phases.push({ name: phaseName, tasks });
    }

    return phases.length > 0 ? phases : undefined;
  }

  /**
   * 提取关联资源
   * @param content Markdown 内容
   * @returns 关联资源数组
   */
  private extractRelatedResources(content: string): Array<{ type: string; link: string }> | undefined {
    const section = this.extractSection(content, '相关资源|Related Resources');
    if (!section) return undefined;

    const resources: Array<{ type: string; link: string }> = [];
    const matches = section.matchAll(/-\s*\[([ x])\]\s*(.+?):\s*`(.+?)`/g);

    for (const match of matches) {
      resources.push({
        type: match[2].trim(),
        link: match[3].trim(),
      });
    }

    return resources.length > 0 ? resources : undefined;
  }

  /**
   * 提取状态更新日志
   * @param content Markdown 内容
   * @returns 状态日志数组
   */
  private extractStatusLog(content: string): Array<{ date: Date; status: string; note: string }> | undefined {
    const section = this.extractSection(content, 'Status 更新日志|Status Log');
    if (!section) return undefined;

    const logs: Array<{ date: Date; status: string; note: string }> = [];
    const matches = section.matchAll(/-\s*\*\*(.+?)\*\*:\s*状态变更\s*→\s*(.+?)，\s*备注:\s*(.+)/g);

    for (const match of matches) {
      try {
        logs.push({
          date: new Date(match[1].trim()),
          status: match[2].trim(),
          note: match[3].trim(),
        });
      } catch {
        // 忽略日期解析错误
      }
    }

    return logs.length > 0 ? logs : undefined;
  }

  /**
   * 解析 Issue 状态
   * @param content Markdown 内容
   * @param metadata 元数据
   * @returns 状态
   */
  private parseIssueStatus(content: string, metadata: WorkHubMetadata): IssueEntry['status'] {
    // 从元数据中读取状态
    if (metadata.status) {
      const statusMap: Record<string, IssueEntry['status']> = {
        todo: 'todo',
        in_progress: 'in_progress',
        done: 'done',
        blocked: 'blocked',
        paused: 'paused',
      };
      return statusMap[metadata.status as string] || 'todo';
    }

    // 从内容中提取状态（使用 emoji）
    const statusMatch = content.match(/状态[:：]\s*([📝🚧✅⏸️❌])/);
    const emojiMap: Record<string, IssueEntry['status']> = {
      '📝': 'todo',
      '🚧': 'in_progress',
      '✅': 'done',
      '⏸️': 'paused',
      '❌': 'blocked',
    };
    return statusMatch ? emojiMap[statusMatch[1]] || 'todo' : 'todo';
  }

  /**
   * 解析 PR 状态
   * @param content Markdown 内容
   * @param metadata 元数据
   * @returns 状态
   */
  private parsePRStatus(content: string, metadata: WorkHubMetadata): PREntry['status'] {
    if (metadata.status) {
      const statusMap: Record<string, PREntry['status']> = {
        draft: 'draft',
        open: 'open',
        merged: 'merged',
        closed: 'closed',
      };
      return statusMap[metadata.status as string] || 'draft';
    }

    // 从内容中提取状态（使用 emoji）
    const statusMatch = content.match(/状态[:：]\s*([📝🚧✅⏸️❌])/);
    const emojiMap: Record<string, PREntry['status']> = {
      '📝': 'draft',
      '🚧': 'open',
      '✅': 'merged',
      '⏸️': 'closed',
      '❌': 'closed',
    };
    return statusMatch ? emojiMap[statusMatch[1]] || 'draft' : 'draft';
  }

  /**
   * 提取优先级
   * @param content Markdown 内容
   * @returns 优先级
   */
  private extractPriority(content: string): IssueEntry['priority'] {
    const match = content.match(/优先级[:：]\s*([🔴🟠🟡🟢])/);
    const priorityMap: Record<string, IssueEntry['priority']> = {
      '🔴': 'p0',
      '🟠': 'p1',
      '🟡': 'p2',
      '🟢': 'p3',
    };
    return match ? priorityMap[match[1]] : 'p2';
  }

  /**
   * 提取分类
   * @param relativePath 相对路径
   * @returns 分类
   */
  private extractCategory(relativePath: string): string | undefined {
    // 从路径中提取分类，例如: docs/frontend/xxx.md -> frontend
    const match = relativePath.match(/^(issues|pr)\/([^\/]+)\//);
    return match ? match[2] : undefined;
  }

  /**
   * 提取关联的 Issues
   * @param content Markdown 内容
   * @returns 关联 Issue 路径数组
   */
  private extractLinkedIssues(content: string): string[] | undefined {
    const section = this.extractSection(content, '关联 Issue|Linked Issues');
    if (!section) return undefined;

    const matches = section.matchAll(/`docs\/issues\/([^`]+)`/g);
    const issues: string[] = [];
    for (const match of matches) {
      issues.push(match[1]);
    }
    return issues.length > 0 ? issues : undefined;
  }

  /**
   * 提取变更类型
   * @param content Markdown 内容
   * @returns 变更类型数组
   */
  private extractChangeType(content: string): string[] | undefined {
    const section = this.extractSection(content, '变更类型|Change Type');
    if (!section) return undefined;

    const types: string[] = [];
    const matches = section.matchAll(/-\s*\[([ x])\]\s*(.+)/g);
    for (const match of matches) {
      if (match[1] === 'x') {
        types.push(match[2].trim().replace(/^[🐛✨📝🚀⚡🔒🧪]\s*/, ''));
      }
    }
    return types.length > 0 ? types : undefined;
  }

  /**
   * 提取破坏性变更
   * @param content Markdown 内容
   * @returns 是否有破坏性变更
   */
  private extractBreakingChange(content: string): boolean | undefined {
    const section = this.extractSection(content, '破坏性变更|Breaking Change');
    if (!section) return undefined;

    const match = section.match(/-\s*\[([ x])\]\s*是/);
    return match ? match[1] === 'x' : false;
  }

  /**
   * 提取性能影响
   * @param content Markdown 内容
   * @returns 性能影响描述
   */
  private extractPerformanceImpact(content: string): string | undefined {
    const section = this.extractSection(content, '性能影响|Performance Impact');
    if (!section) return undefined;

    const match = section.match(/-\s*\[([ x])\]\s*(.+)/);
    return match ? match[2].trim() : undefined;
  }

  /**
   * 提取依赖变更
   * @param content Markdown 内容
   * @returns 是否引入新依赖
   */
  private extractDependencyChanges(content: string): boolean | undefined {
    const section = this.extractSection(content, '依赖变更|Dependency Changes');
    if (!section) return undefined;

    const match = section.match(/-\s*\[([ x])\]\s*是/);
    return match ? match[1] === 'x' : false;
  }

  /**
   * 提取审查日志
   * @param content Markdown 内容
   * @returns 审查日志数组
   */
  private extractReviewLog(content: string): Array<{ date: Date; reviewer: string; comments: string[] }> | undefined {
    const section = this.extractSection(content, '审查日志|Review Log');
    if (!section) return undefined;

    const logs: Array<{ date: Date; reviewer: string; comments: string[] }> = [];
    const matches = section.matchAll(/-\s*\*\*(.+?)\*\*\s*\[([^\]]+)\]:\s*(.+)/g);

    for (const match of matches) {
      try {
        const comments = match[3]
          .split(/-\s*\[x?\]\s*/)
          .filter((c) => c.trim())
          .map((c) => c.trim());

        logs.push({
          date: new Date(match[1].trim()),
          reviewer: match[2].trim(),
          comments,
        });
      } catch {
        // 忽略解析错误
      }
    }

    return logs.length > 0 ? logs : undefined;
  }

  /**
   * 仅解析 ADR 文件
   * @returns ADR 条目数组
   */
  async parseADRs(): Promise<ADREntry[]> {
    const result = await this.parse();
    return result.adrs;
  }

  /**
   * 仅解析 Issue 文件
   * @returns Issue 条目数组
   */
  async parseIssues(): Promise<IssueEntry[]> {
    const result = await this.parse();
    return result.issues;
  }

  /**
   * 仅解析 PR 文件
   * @returns PR 条目数组
   */
  async parsePRs(): Promise<PREntry[]> {
    const result = await this.parse();
    return result.prs;
  }
}

/**
 * 便捷函数：解析 WorkHub 文档
 * @param docsDir docs/ 目录路径
 * @param options 解析选项
 * @returns 解析结果
 */
export async function parseWorkHub(
  docsDir: string,
  options?: Partial<WorkHubParserOptions>
): Promise<WorkHubResult> {
  const parser = new WorkHubParser(docsDir, options);
  return parser.parse();
}

/**
 * 便捷函数：仅解析 ADR
 * @param docsDir docs/ 目录路径
 * @returns ADR 条目数组
 */
export async function parseADRs(docsDir: string): Promise<ADREntry[]> {
  const parser = new WorkHubParser(docsDir, { includeADRs: true, includeIssues: false, includePRs: false });
  return parser.parseADRs();
}

/**
 * 便捷函数：仅解析 Issues
 * @param docsDir docs/ 目录路径
 * @returns Issue 条目数组
 */
export async function parseIssues(docsDir: string): Promise<IssueEntry[]> {
  const parser = new WorkHubParser(docsDir, { includeADRs: false, includeIssues: true, includePRs: false });
  return parser.parseIssues();
}

/**
 * 便捷函数：仅解析 PRs
 * @param docsDir docs/ 目录路径
 * @returns PR 条目数组
 */
export async function parsePRs(docsDir: string): Promise<PREntry[]> {
  const parser = new WorkHubParser(docsDir, { includeADRs: false, includeIssues: false, includePRs: true });
  return parser.parsePRs();
}