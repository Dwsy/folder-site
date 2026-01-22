/**
 * PR Display Component
 *
 * Displays a single PR with:
 * - Metadata (ID, title, status, category, author, dates, commit hash)
 * - Content (background, changes, linked issues, test results, etc.)
 * - Status badge with color coding
 * - Change type badges
 * - Responsive design
 */

import { useMemo, useState } from 'react';
import { cn } from '../../utils/cn.js';
import type { PREntry, PRStatus } from '../../../types/workhub.js';
import {
  FiGitPullRequest,
  FiCalendar,
  FiUser,
  FiChevronDown,
  FiChevronUp,
  FiLink,
  FiCopy,
  FiCheckCircle,
  FiXCircle,
  FiFileText,
  FiGitCommit,
  FiExternalLink,
  FiAlertTriangle,
  FiActivity,
  FiRefreshCw,
  FiShield,
  FiCode,
  FiCheckSquare,
  FiMessageSquare,
} from 'react-icons/fi';

/**
 * Status badge configuration
 */
const STATUS_CONFIG: Record<
  PRStatus,
  {
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  draft: {
    label: 'Draft',
    color: 'text-slate-700 dark:text-slate-300',
    bgColor: 'bg-slate-50 dark:bg-slate-950',
    borderColor: 'border-slate-200 dark:border-slate-800',
    icon: FiFileText,
  },
  open: {
    label: 'Open',
    color: 'text-green-700 dark:text-green-300',
    bgColor: 'bg-green-50 dark:bg-green-950',
    borderColor: 'border-green-200 dark:border-green-800',
    icon: FiGitPullRequest,
  },
  merged: {
    label: 'Merged',
    color: 'text-purple-700 dark:text-purple-300',
    bgColor: 'bg-purple-50 dark:bg-purple-950',
    borderColor: 'border-purple-200 dark:border-purple-800',
    icon: FiGitCommit,
  },
  closed: {
    label: 'Closed',
    color: 'text-red-700 dark:text-red-300',
    bgColor: 'bg-red-50 dark:bg-red-950',
    borderColor: 'border-red-200 dark:border-red-800',
    icon: FiXCircle,
  },
};

/**
 * Format date to locale string
 */
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

/**
 * Format date to locale string with time
 */
function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Status Badge Component
 */
function StatusBadge({ status }: { status: PRStatus }) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        config.color,
        config.bgColor,
        config.borderColor
      )}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}

/**
 * PR Section Component
 */
function PRSection({
  title,
  content,
  defaultOpen = false,
  icon: Icon,
}: {
  title: string;
  content?: string | string[];
  defaultOpen?: boolean;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (!content) return null;

  const hasContent = Array.isArray(content) ? content.length > 0 : Boolean(content);

  if (!hasContent) return null;

  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-accent"
      >
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-foreground">{title}</h3>
        </div>
        {isOpen ? (
          <FiChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <FiChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {isOpen && (
        <div className="px-4 pb-4">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {Array.isArray(content) ? (
              <ul className="space-y-2">
                {content.map((item, index) => (
                  <li key={index} className="text-sm text-muted-foreground">
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="whitespace-pre-wrap text-sm text-muted-foreground">
                {content}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Linked Issues Section Component
 */
function LinkedIssuesSection({
  linkedIssues,
  defaultOpen = false,
}: {
  linkedIssues?: string[];
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (!linkedIssues || linkedIssues.length === 0) return null;

  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-accent"
      >
        <div className="flex items-center gap-2">
          <FiLink className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-foreground">Linked Issues</h3>
        </div>
        {isOpen ? (
          <FiChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <FiChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {isOpen && (
        <div className="px-4 pb-4">
          <ul className="space-y-2">
            {linkedIssues.map((issue, index) => (
              <li key={index} className="flex items-center gap-2 text-sm">
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {issue}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Test Results Section Component
 */
function TestResultsSection({
  testResult,
  defaultOpen = false,
}: {
  testResult?: Array<{ checked: boolean; text: string }>;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (!testResult || testResult.length === 0) return null;

  const passedCount = testResult.filter((t) => t.checked).length;
  const totalCount = testResult.length;

  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-accent"
      >
        <div className="flex items-center gap-2">
          <FiCheckSquare className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-foreground">
            Test Results ({passedCount}/{totalCount})
          </h3>
        </div>
        {isOpen ? (
          <FiChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <FiChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {isOpen && (
        <div className="px-4 pb-4">
          <ul className="space-y-2">
            {testResult.map((test, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <span className={cn('mt-0.5', test.checked ? 'text-green-500' : 'text-muted-foreground')}>
                  {test.checked ? <FiCheckCircle className="h-4 w-4" /> : <FiXCircle className="h-4 w-4" />}
                </span>
                <span className={cn(test.checked ? 'text-foreground' : 'text-muted-foreground')}>
                  {test.text}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * File Changes Section Component
 */
function FileChangesSection({
  fileChanges,
  defaultOpen = false,
}: {
  fileChanges?: Array<{ file: string; type: string; description: string }>;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (!fileChanges || fileChanges.length === 0) return null;

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'added':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950';
      case 'modified':
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950';
      case 'deleted':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950';
      case 'renamed':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-accent"
      >
        <div className="flex items-center gap-2">
          <FiFileText className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-foreground">
            File Changes ({fileChanges.length})
          </h3>
        </div>
        {isOpen ? (
          <FiChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <FiChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {isOpen && (
        <div className="px-4 pb-4">
          <ul className="space-y-2">
            {fileChanges.map((change, index) => (
              <li key={index} className="rounded-md border border-border bg-muted/30 p-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="flex-1 truncate font-mono text-sm text-foreground">
                    {change.file}
                  </span>
                  <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', getTypeColor(change.type))}>
                    {change.type}
                  </span>
                </div>
                {change.description && (
                  <p className="mt-1 text-xs text-muted-foreground">{change.description}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Review Checklist Section Component
 */
function ReviewChecklistSection({
  reviewChecklist,
  defaultOpen = false,
}: {
  reviewChecklist?: {
    functional?: string[];
    codeQuality?: string[];
    testing?: string[];
  };
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (!reviewChecklist) return null;

  const hasContent = (reviewChecklist.functional?.length || 0) +
    (reviewChecklist.codeQuality?.length || 0) +
    (reviewChecklist.testing?.length || 0) > 0;

  if (!hasContent) return null;

  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-accent"
      >
        <div className="flex items-center gap-2">
          <FiCheckSquare className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-foreground">Review Checklist</h3>
        </div>
        {isOpen ? (
          <FiChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <FiChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {isOpen && (
        <div className="px-4 pb-4 space-y-4">
          {reviewChecklist.functional && reviewChecklist.functional.length > 0 && (
            <div>
              <h4 className="mb-2 text-sm font-medium text-foreground">Functional</h4>
              <ul className="space-y-1">
                {reviewChecklist.functional.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {reviewChecklist.codeQuality && reviewChecklist.codeQuality.length > 0 && (
            <div>
              <h4 className="mb-2 text-sm font-medium text-foreground">Code Quality</h4>
              <ul className="space-y-1">
                {reviewChecklist.codeQuality.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {reviewChecklist.testing && reviewChecklist.testing.length > 0 && (
            <div>
              <h4 className="mb-2 text-sm font-medium text-foreground">Testing</h4>
              <ul className="space-y-1">
                {reviewChecklist.testing.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Review Log Section Component
 */
function ReviewLogSection({
  reviewLog,
  defaultOpen = false,
}: {
  reviewLog?: Array<{
    timestamp: string;
    reviewer: string;
    comments?: Array<{ type: string; description: string }>;
    response?: string;
  }>;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (!reviewLog || reviewLog.length === 0) return null;

  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-accent"
      >
        <div className="flex items-center gap-2">
          <FiMessageSquare className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-foreground">Review Log</h3>
        </div>
        {isOpen ? (
          <FiChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <FiChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {isOpen && (
        <div className="px-4 pb-4 space-y-4">
          {reviewLog.map((log, index) => (
            <div key={index} className="rounded-lg border border-border bg-muted/30 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-medium text-foreground">{log.reviewer}</span>
                <span className="text-xs text-muted-foreground">{log.timestamp}</span>
              </div>
              {log.comments && log.comments.length > 0 && (
                <div className="mb-2 space-y-2">
                  {log.comments.map((comment, commentIndex) => (
                    <div key={commentIndex} className="rounded-md bg-background p-2">
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {comment.type}
                      </span>
                      <p className="mt-1 text-sm text-muted-foreground">{comment.description}</p>
                    </div>
                  ))}
                </div>
              )}
              {log.response && (
                <div className="rounded-md bg-primary/5 p-2">
                  <p className="text-sm text-foreground">{log.response}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Metadata Row Component
 */
function MetadataRow({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number | undefined;
  className?: string;
}) {
  if (!value) return null;

  return (
    <div className={cn('flex items-center gap-2 text-sm', className)}>
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

/**
 * Main PR Display Component
 */
export function PRDisplay({
  pr,
  showFullContent = false,
  className,
}: {
  pr: PREntry;
  showFullContent?: boolean;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  // Generate link to the PR file
  const fileLink = useMemo(() => {
    return `/docs/${pr.path}`;
  }, [pr.path]);

  // Handle copy link
  const handleCopyLink = async () => {
    try {
      const link = window.location.origin + fileLink;
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm',
        className
      )}
    >
      {/* Header */}
      <div className="border-b border-border bg-muted/50 px-4 py-3">
        <div className="flex items-start justify-between gap-4">
          {/* Title and badges */}
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FiGitPullRequest className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-mono text-muted-foreground">
                  {pr.id}
                </span>
                <StatusBadge status={pr.status} />
                {pr.category && (
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    {pr.category}
                  </span>
                )}
                {pr.breakingChange && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">
                    <FiAlertTriangle className="h-3 w-3" />
                    Breaking
                  </span>
                )}
              </div>
              <h2 className="mt-1 text-lg font-semibold text-foreground">
                {pr.title}
              </h2>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <a
              href={fileLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              title="Open file"
            >
              <FiLink className="h-4 w-4" />
            </a>
            <button
              onClick={handleCopyLink}
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              title={copied ? 'Copied!' : 'Copy link'}
            >
              <FiCopy className={cn('h-4 w-4', copied && 'text-green-500')} />
            </button>
          </div>
        </div>

        {/* Metadata */}
        <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <MetadataRow
            icon={FiCalendar}
            label="Created"
            value={formatDate(pr.createdAt)}
          />
          {pr.updatedAt.getTime() !== pr.createdAt.getTime() && (
            <MetadataRow
              icon={FiCalendar}
              label="Updated"
              value={formatDate(pr.updatedAt)}
            />
          )}
          {pr.mergedAt && (
            <MetadataRow
              icon={FiGitCommit}
              label="Merged"
              value={formatDate(pr.mergedAt)}
            />
          )}
          {pr.mergedBy && (
            <MetadataRow
              icon={FiUser}
              label="Merged by"
              value={pr.mergedBy}
            />
          )}
          {pr.commitHash && (
            <MetadataRow
              icon={FiGitCommit}
              label="Commit"
              value={pr.commitHash.slice(0, 7)}
            />
          )}
          {pr.deployStatus && (
            <MetadataRow
              icon={FiActivity}
              label="Deploy"
              value={pr.deployStatus}
            />
          )}
        </div>

        {/* Change Type Badges */}
        {pr.changeType && pr.changeType.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {pr.changeType.map((type, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground"
              >
                <FiCode className="h-3 w-3" />
                {type}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Content Sections */}
      {(showFullContent || pr.background || pr.changes || pr.linkedIssues || pr.testResult || pr.riskAssessment || pr.rollbackPlan || pr.fileChanges || pr.performanceImpact || pr.securityConsiderations || pr.reviewChecklist || pr.reviewLog) && (
        <div className="divide-y divide-border">
          <PRSection
            title="Background"
            content={pr.background}
            defaultOpen={showFullContent}
            icon={FiFileText}
          />
          <PRSection
            title="Changes"
            content={pr.changes}
            defaultOpen={showFullContent}
            icon={FiCode}
          />
          <LinkedIssuesSection
            linkedIssues={pr.linkedIssues}
            defaultOpen={false}
          />
          <TestResultsSection
            testResult={pr.testResult}
            defaultOpen={showFullContent}
          />
          <PRSection
            title="Risk Assessment"
            content={pr.riskAssessment}
            defaultOpen={false}
            icon={FiAlertTriangle}
          />
          <PRSection
            title="Rollback Plan"
            content={pr.rollbackPlan}
            defaultOpen={false}
            icon={FiRefreshCw}
          />
          <FileChangesSection
            fileChanges={pr.fileChanges}
            defaultOpen={false}
          />
          <PRSection
            title="Performance Impact"
            content={pr.performanceImpact}
            defaultOpen={false}
            icon={FiActivity}
          />
          {pr.dependencyChanges && (
            <PRSection
              title="Dependency Changes"
              content="This PR includes dependency updates"
              defaultOpen={false}
              icon={FiExternalLink}
            />
          )}
          <PRSection
            title="Security Considerations"
            content={pr.securityConsiderations}
            defaultOpen={false}
            icon={FiShield}
          />
          <ReviewChecklistSection
            reviewChecklist={pr.reviewChecklist}
            defaultOpen={false}
          />
          <ReviewLogSection
            reviewLog={pr.reviewLog}
            defaultOpen={false}
          />
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-border bg-muted/30 px-4 py-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{pr.path}</span>
          {pr.category && (
            <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5">
              {pr.category}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Compact PR Card Component (for list view)
 */
export function PRCard({
  pr,
  onClick,
  className,
}: {
  pr: PREntry;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'group flex cursor-pointer items-start gap-3 rounded-lg border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-md',
        className
      )}
    >
      {/* Icon */}
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
        <FiGitPullRequest className="h-5 w-5" />
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground">
            {pr.id}
          </span>
          <StatusBadge status={pr.status} />
          {pr.category && (
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {pr.category}
            </span>
          )}
          {pr.breakingChange && (
            <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
              <FiAlertTriangle className="h-3 w-3" />
              Breaking
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="truncate font-semibold text-foreground group-hover:text-primary transition-colors">
          {pr.title}
        </h3>

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <FiCalendar className="h-3 w-3" />
            {formatDate(pr.createdAt)}
          </span>
          {pr.mergedAt && (
            <span className="flex items-center gap-1">
              <FiGitCommit className="h-3 w-3" />
              {formatDate(pr.mergedAt)}
            </span>
          )}
          {pr.mergedBy && (
            <span className="flex items-center gap-1">
              <FiUser className="h-3 w-3" />
              {pr.mergedBy}
            </span>
          )}
          {pr.commitHash && (
            <span className="flex items-center gap-1 font-mono">
              <FiGitCommit className="h-3 w-3" />
              {pr.commitHash.slice(0, 7)}
            </span>
          )}
        </div>

        {/* Change Type Badges */}
        {pr.changeType && pr.changeType.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {pr.changeType.slice(0, 3).map((type, index) => (
              <span
                key={index}
                className="inline-flex items-center rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground"
              >
                {type}
              </span>
            ))}
            {pr.changeType.length > 3 && (
              <span className="text-xs text-muted-foreground">
                +{pr.changeType.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Arrow indicator */}
      <div className="flex-shrink-0 self-center">
        <FiChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
}

/**
 * Chevron right icon (for PRCard)
 */
function FiChevronRight({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}