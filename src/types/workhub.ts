/**
 * WorkHub 类型定义
 *
 * 定义 WorkHub 文档解析器相关的类型
 */

/**
 * WorkHub 条目类型
 */
export type WorkHubEntry = ADREntry | IssueEntry | PREntry;

/**
 * WorkHub 元数据
 */
export interface WorkHubMetadata {
  [key: string]: any;
}

/**
 * WorkHub 解析器选项
 */
export interface WorkHubParserOptions {
  /** 是否解析 ADR */
  includeADRs: boolean;
  /** 是否解析 Issues */
  includeIssues: boolean;
  /** 是否解析 PRs */
  includePRs: boolean;
  /** 是否解析文件内容 */
  parseContent: boolean;
  /** 是否提取元数据 */
  extractMetadata: boolean;
}

/**
 * WorkHub 解析结果
 */
export interface WorkHubResult {
  /** ADR 列表 */
  adrs: ADREntry[];
  /** Issue 列表 */
  issues: IssueEntry[];
  /** PR 列表 */
  prs: PREntry[];
  /** 统计信息 */
  stats: WorkHubStats;
  /** 解析错误 */
  errors: Error[];
  /** docs/ 目录路径 */
  docsDir: string;
}

/**
 * WorkHub 统计信息
 */
export interface WorkHubStats {
  /** ADR 总数 */
  totalADRs: number;
  /** Issue 总数 */
  totalIssues: number;
  /** PR 总数 */
  totalPRs: number;
  /** 文档总数 */
  totalDocuments: number;
  /** 错误数量 */
  errors: number;
  /** 解析耗时（毫秒） */
  parseTime: number;
}

/**
 * ADR 状态
 */
export type ADRStatus = 'proposed' | 'accepted' | 'rejected' | 'superseded' | 'deprecated';

/**
 * ADR 条目
 */
export interface ADREntry {
  /** 条目类型 */
  type: 'adr';
  /** ADR ID */
  id: string;
  /** 标题 */
  title: string;
  /** 状态 */
  status: ADRStatus;
  /** ADR 编号 */
  number?: number;
  /** 相对路径 */
  path: string;
  /** 绝对路径 */
  filePath: string;
  /** 文件内容 */
  content?: string;
  /** 元数据 */
  metadata: WorkHubMetadata;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
  /** 上下文 */
  context?: string;
  /** 决策 */
  decision?: string;
  /** 后果 */
  consequences?: string;
  /** 替代方案 */
  alternatives?: string;
}

/**
 * Issue 状态
 */
export type IssueStatus = 'todo' | 'in_progress' | 'done' | 'blocked' | 'paused';

/**
 * Issue 优先级
 */
export type IssuePriority = 'p0' | 'p1' | 'p2' | 'p3';

/**
 * Issue 条目
 */
export interface IssueEntry {
  /** 条目类型 */
  type: 'issue';
  /** Issue ID */
  id: string;
  /** 标题 */
  title: string;
  /** 状态 */
  status: IssueStatus;
  /** 优先级 */
  priority: IssuePriority;
  /** 分类 */
  category?: string;
  /** 相对路径 */
  path: string;
  /** 绝对路径 */
  filePath: string;
  /** 文件内容 */
  content?: string;
  /** 元数据 */
  metadata: WorkHubMetadata;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
  /** 目标 */
  goal?: string;
  /** 背景 */
  background?: string;
  /** 验收标准 */
  acceptanceCriteria?: Array<{ checked: boolean; text: string }>;
  /** 实施阶段 */
  phases?: Array<{ name: string; tasks: string[] }>;
  /** 关键决策 */
  decisions?: Array<{ decision: string; reason: string }>;
  /** 遇到的错误 */
  errors?: Array<{ date: string; error: string; solution: string }>;
  /** 相关资源 */
  relatedResources?: Array<{ type: string; link: string }>;
  /** 备注 */
  notes?: string;
  /** 状态更新日志 */
  statusLog?: Array<{ timestamp: string; status: string; note: string }>;
  /** 负责人 */
  assignee?: string;
  /** 预计工时 */
  estimatedHours?: number;
}

/**
 * PR 状态
 */
export type PRStatus = 'draft' | 'open' | 'merged' | 'closed';

/**
 * PR 条目
 */
export interface PREntry {
  /** 条目类型 */
  type: 'pr';
  /** PR ID */
  id: string;
  /** 标题 */
  title: string;
  /** 状态 */
  status: PRStatus;
  /** 分类 */
  category?: string;
  /** 相对路径 */
  path: string;
  /** 绝对路径 */
  filePath: string;
  /** 文件内容 */
  content?: string;
  /** 元数据 */
  metadata: WorkHubMetadata;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
  /** 背景 */
  background?: string;
  /** 变更内容 */
  changes?: string;
  /** 关联的 Issues */
  linkedIssues?: string[];
  /** 测试结果 */
  testResult?: Array<{ checked: boolean; text: string }>;
  /** 风险评估 */
  riskAssessment?: string;
  /** 回滚计划 */
  rollbackPlan?: string;
  /** 变更类型 */
  changeType?: string[];
  /** 文件变更 */
  fileChanges?: Array<{ file: string; type: string; description: string }>;
  /** 破坏性变更 */
  breakingChange?: boolean;
  /** 性能影响 */
  performanceImpact?: string;
  /** 依赖变更 */
  dependencyChanges?: boolean;
  /** 安全考虑 */
  securityConsiderations?: string;
  /** 代码审查检查清单 */
  reviewChecklist?: {
    functional?: string[];
    codeQuality?: string[];
    testing?: string[];
  };
  /** 审查日志 */
  reviewLog?: Array<{
    timestamp: string;
    reviewer: string;
    comments?: Array<{ type: string; description: string }>;
    response?: string;
  }>;
  /** 合并时间 */
  mergedAt?: Date;
  /** 合并者 */
  mergedBy?: string;
  /** Commit Hash */
  commitHash?: string;
  /** 部署状态 */
  deployStatus?: string;
}