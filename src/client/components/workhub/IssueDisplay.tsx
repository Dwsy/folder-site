/**
 * Issue Display Component
 *
 * Displays a single Issue with:
 * - Metadata (ID, title, status, priority, assignee, estimated hours, tags)
 * - Content (goal, background, acceptance criteria, phases, decisions, errors)
 * - Status badge with color coding
 * - Priority badge with color coding
 * - Responsive design
 */

import { useMemo, useState } from 'react';
import { cn } from '../../utils/cn.js';
import type { IssueEntry, IssueStatus, IssuePriority } from '../../../types/workhub.js';
import {
  FiFlag,
  FiCalendar,
  FiUser,
  FiChevronDown,
  FiChevronUp,
  FiLink,
  FiCopy,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiPauseCircle,
  FiTarget,
  FiList,
  FiGitCommit,
  FiExternalLink,
  FiFileText,
} from 'react-icons/fi';

/**
 * Status badge configuration
 */
const STATUS_CONFIG: Record<
  IssueStatus,
  {
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  todo: {
    label: 'Todo',
    color: 'text-slate-700 dark:text-slate-300',
    bgColor: 'bg-slate-50 dark:bg-slate-950',
    borderColor: 'border-slate-200 dark:border-slate-800',
    icon: FiList,
  },
  in_progress: {
    label: 'In Progress',
    color: 'text-blue-700 dark:text-blue-300',
    bgColor: 'bg-blue-50 dark:bg-blue-950',
    borderColor: 'border-blue-200 dark:border-blue-800',
    icon: FiClock,
  },
  done: {
    label: 'Done',
    color: 'text-green-700 dark:text-green-300',
    bgColor: 'bg-green-50 dark:bg-green-950',
    borderColor: 'border-green-200 dark:border-green-800',
    icon: FiCheckCircle,
  },
  blocked: {
    label: 'Blocked',
    color: 'text-red-700 dark:text-red-300',
    bgColor: 'bg-red-50 dark:bg-red-950',
    borderColor: 'border-red-200 dark:border-red-800',
    icon: FiXCircle,
  },
  paused: {
    label: 'Paused',
    color: 'text-yellow-700 dark:text-yellow-300',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    icon: FiPauseCircle,
  },
};

/**
 * Priority badge configuration
 */
const PRIORITY_CONFIG: Record<
  IssuePriority,
  {
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
  }
> = {
  p0: {
    label: 'P0 - Critical',
    color: 'text-red-700 dark:text-red-300',
    bgColor: 'bg-red-50 dark:bg-red-950',
    borderColor: 'border-red-200 dark:border-red-800',
  },
  p1: {
    label: 'P1 - High',
    color: 'text-orange-700 dark:text-orange-300',
    bgColor: 'bg-orange-50 dark:bg-orange-950',
    borderColor: 'border-orange-200 dark:border-orange-800',
  },
  p2: {
    label: 'P2 - Medium',
    color: 'text-yellow-700 dark:text-yellow-300',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
  },
  p3: {
    label: 'P3 - Low',
    color: 'text-green-700 dark:text-green-300',
    bgColor: 'bg-green-50 dark:bg-green-950',
    borderColor: 'border-green-200 dark:border-green-800',
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
 * Status Badge Component
 */
function StatusBadge({ status }: { status: IssueStatus }) {
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
 * Priority Badge Component
 */
function PriorityBadge({ priority }: { priority: IssuePriority }) {
  const config = PRIORITY_CONFIG[priority];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        config.color,
        config.bgColor,
        config.borderColor
      )}
    >
      <FiFlag className="h-3 w-3" />
      {config.label}
    </span>
  );
}

/**
 * Issue Section Component
 */
function IssueSection({
  title,
  content,
  defaultOpen = false,
  icon: Icon,
}: {
  title: string;
  content?: string | string[] | Array<{ checked: boolean; text: string }>;
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
                {content.map((item, index) => {
                  if (typeof item === 'string') {
                    return (
                      <li key={index} className="text-sm text-muted-foreground">
                        {item}
                      </li>
                    );
                  }
                  if ('checked' in item && 'text' in item) {
                    return (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <span className={cn('mt-0.5', item.checked ? 'text-green-500' : 'text-muted-foreground')}>
                          {item.checked ? <FiCheckCircle className="h-4 w-4" /> : <FiXCircle className="h-4 w-4" />}
                        </span>
                        <span className={cn(item.checked ? 'text-foreground line-through' : 'text-muted-foreground')}>
                          {item.text}
                        </span>
                      </li>
                    );
                  }
                  return null;
                })}
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
 * Phase Section Component
 */
function PhaseSection({
  phases,
  defaultOpen = false,
}: {
  phases?: Array<{ name: string; tasks: string[] }>;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (!phases || phases.length === 0) return null;

  return (
    <div className="border-b border-border">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-accent"
      >
        <div className="flex items-center gap-2">
          <FiList className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-foreground">Implementation Phases</h3>
        </div>
        {isOpen ? (
          <FiChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <FiChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {isOpen && (
        <div className="px-4 pb-4 space-y-4">
          {phases.map((phase, phaseIndex) => (
            <div key={phaseIndex} className="rounded-lg border border-border bg-muted/30 p-4">
              <h4 className="mb-2 font-semibold text-foreground">{phase.name}</h4>
              <ul className="space-y-1">
                {phase.tasks.map((task, taskIndex) => (
                  <li key={taskIndex} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                    {task}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Key Decisions Section Component
 */
function KeyDecisionsSection({
  decisions,
  defaultOpen = false,
}: {
  decisions?: Array<{ decision: string; reason: string }>;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (!decisions || decisions.length === 0) return null;

  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-accent"
      >
        <div className="flex items-center gap-2">
          <FiGitCommit className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-foreground">Key Decisions</h3>
        </div>
        {isOpen ? (
          <FiChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <FiChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {isOpen && (
        <div className="px-4 pb-4">
          <div className="space-y-3">
            {decisions.map((decision, idx) => (
              <div key={idx} className="rounded-md bg-muted/50 p-3">
                <p className="font-medium text-foreground">{decision.decision}</p>
                <p className="mt-1 text-sm text-muted-foreground">{decision.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Errors Encountered Section Component
 */
function ErrorsSection({
  errors,
  defaultOpen = false,
}: {
  errors?: Array<{ date: string; error: string; solution: string }>;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (!errors || errors.length === 0) return null;

  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-accent"
      >
        <div className="flex items-center gap-2">
          <FiAlertCircle className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-foreground">Errors Encountered</h3>
        </div>
        {isOpen ? (
          <FiChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <FiChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {isOpen && (
        <div className="px-4 pb-4">
          <div className="space-y-3">
            {errors.map((error, idx) => (
              <div key={idx} className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{error.date}</span>
                </div>
                <p className="mt-1 font-medium text-destructive-foreground">{error.error}</p>
                <p className="mt-1 text-sm text-muted-foreground">Solution: {error.solution}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Related Resources Section Component
 */
function RelatedResourcesSection({
  resources,
  defaultOpen = false,
}: {
  resources?: Array<{ type: string; link: string }>;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (!resources || resources.length === 0) return null;

  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-accent"
      >
        <div className="flex items-center gap-2">
          <FiExternalLink className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-foreground">Related Resources</h3>
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
            {resources.map((resource, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {resource.type}
                </span>
                <a
                  href={resource.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 truncate text-primary hover:underline"
                >
                  {resource.link}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Status Log Section Component
 */
function StatusLogSection({
  statusLog,
  defaultOpen = false,
}: {
  statusLog?: Array<{ timestamp: string; status: string; note: string }>;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (!statusLog || statusLog.length === 0) return null;

  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-accent"
      >
        <div className="flex items-center gap-2">
          <FiGitCommit className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-foreground">Status Log</h3>
        </div>
        {isOpen ? (
          <FiChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <FiChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {isOpen && (
        <div className="px-4 pb-4">
          <div className="space-y-3">
            {statusLog.map((log, index) => (
              <div key={index} className="flex items-start gap-3 text-sm">
                <div className="flex flex-shrink-0 flex-col items-center">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  {index < statusLog.length - 1 && (
                    <div className="w-px flex-1 bg-border" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{log.status}</span>
                    <span className="text-xs text-muted-foreground">{log.timestamp}</span>
                  </div>
                  {log.note && (
                    <p className="mt-1 text-muted-foreground">{log.note}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Issue Metadata Row Component
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
 * Main Issue Display Component
 */
export function IssueDisplay({
  issue,
  showFullContent = false,
  className,
}: {
  issue: IssueEntry;
  showFullContent?: boolean;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  // Generate link to the Issue file
  const fileLink = useMemo(() => {
    return `/docs/${issue.path}`;
  }, [issue.path]);

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
              <FiAlertCircle className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-mono text-muted-foreground">
                  {issue.id}
                </span>
                <StatusBadge status={issue.status} />
                <PriorityBadge priority={issue.priority} />
                {issue.category && (
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    {issue.category}
                  </span>
                )}
              </div>
              <h2 className="mt-1 text-lg font-semibold text-foreground">
                {issue.title}
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
            value={formatDate(issue.createdAt)}
          />
          {issue.updatedAt.getTime() !== issue.createdAt.getTime() && (
            <MetadataRow
              icon={FiCalendar}
              label="Updated"
              value={formatDate(issue.updatedAt)}
            />
          )}
          {issue.assignee && (
            <MetadataRow
              icon={FiUser}
              label="Assignee"
              value={issue.assignee}
            />
          )}
          {issue.estimatedHours && (
            <MetadataRow
              icon={FiClock}
              label="Est. Hours"
              value={`${issue.estimatedHours}h`}
            />
          )}
        </div>
      </div>

      {/* Content Sections */}
      {(showFullContent || issue.goal || issue.background || issue.acceptanceCriteria || issue.phases || issue.decisions || issue.errors || issue.relatedResources || issue.notes || issue.statusLog) && (
        <div className="divide-y divide-border">
          <IssueSection
            title="Goal"
            content={issue.goal}
            defaultOpen={showFullContent}
            icon={FiTarget}
          />
          <IssueSection
            title="Background"
            content={issue.background}
            defaultOpen={false}
            icon={FiFileText}
          />
          <IssueSection
            title="Acceptance Criteria"
            content={issue.acceptanceCriteria}
            defaultOpen={showFullContent}
            icon={FiCheckCircle}
          />
          <PhaseSection
            phases={issue.phases}
            defaultOpen={false}
          />
          <KeyDecisionsSection
            decisions={issue.decisions}
            defaultOpen={false}
          />
          <ErrorsSection
            errors={issue.errors}
            defaultOpen={false}
          />
          <RelatedResourcesSection
            resources={issue.relatedResources}
            defaultOpen={false}
          />
          <IssueSection
            title="Notes"
            content={issue.notes}
            defaultOpen={false}
            icon={FiFileText}
          />
          <StatusLogSection
            statusLog={issue.statusLog}
            defaultOpen={false}
          />
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-border bg-muted/30 px-4 py-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{issue.path}</span>
          {issue.category && (
            <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5">
              {issue.category}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Compact Issue Card Component (for list view)
 */
export function IssueCard({
  issue,
  onClick,
  className,
}: {
  issue: IssueEntry;
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
        <FiAlertCircle className="h-5 w-5" />
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground">
            {issue.id}
          </span>
          <StatusBadge status={issue.status} />
          <PriorityBadge priority={issue.priority} />
          {issue.category && (
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {issue.category}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="truncate font-semibold text-foreground group-hover:text-primary transition-colors">
          {issue.title}
        </h3>

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <FiCalendar className="h-3 w-3" />
            {formatDate(issue.createdAt)}
          </span>
          {issue.assignee && (
            <span className="flex items-center gap-1">
              <FiUser className="h-3 w-3" />
              {issue.assignee}
            </span>
          )}
          {issue.estimatedHours && (
            <span className="flex items-center gap-1">
              <FiClock className="h-3 w-3" />
              {issue.estimatedHours}h
            </span>
          )}
        </div>
      </div>

      {/* Arrow indicator */}
      <div className="flex-shrink-0 self-center">
        <FiChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
}

/**
 * Chevron right icon (for IssueCard)
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