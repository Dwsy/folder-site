/**
 * ADR Display Component
 *
 * Displays a single Architecture Decision Record (ADR) with:
 * - Metadata (title, status, date, author, number)
 * - Content (context, decision, consequences, alternatives)
 * - Status badge with color coding
 * - Responsive design
 */

import { useMemo, useState } from 'react';
import { cn } from '../../utils/cn.js';
import type { ADREntry, ADRStatus } from '../../../types/workhub.js';
import {
  FiFileText,
  FiCalendar,
  FiUser,
  FiChevronDown,
  FiChevronUp,
  FiLink,
  FiCopy,
} from 'react-icons/fi';

/**
 * Status badge configuration
 */
const STATUS_CONFIG: Record<
  ADRStatus,
  {
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
  }
> = {
  proposed: {
    label: 'Proposed',
    color: 'text-blue-700 dark:text-blue-300',
    bgColor: 'bg-blue-50 dark:bg-blue-950',
    borderColor: 'border-blue-200 dark:border-blue-800',
  },
  accepted: {
    label: 'Accepted',
    color: 'text-green-700 dark:text-green-300',
    bgColor: 'bg-green-50 dark:bg-green-950',
    borderColor: 'border-green-200 dark:border-green-800',
  },
  rejected: {
    label: 'Rejected',
    color: 'text-red-700 dark:text-red-300',
    bgColor: 'bg-red-50 dark:bg-red-950',
    borderColor: 'border-red-200 dark:border-red-800',
  },
  superseded: {
    label: 'Superseded',
    color: 'text-yellow-700 dark:text-yellow-300',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
  },
  deprecated: {
    label: 'Deprecated',
    color: 'text-gray-700 dark:text-gray-300',
    bgColor: 'bg-gray-50 dark:bg-gray-950',
    borderColor: 'border-gray-200 dark:border-gray-800',
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
function StatusBadge({ status }: { status: ADRStatus }) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        config.color,
        config.bgColor,
        config.borderColor
      )}
    >
      {config.label}
    </span>
  );
}

/**
 * ADR Section Component
 */
function ADRSection({
  title,
  content,
  defaultOpen = false,
}: {
  title: string;
  content?: string;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (!content) return null;

  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-accent"
      >
        <h3 className="font-semibold text-foreground">{title}</h3>
        {isOpen ? (
          <FiChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <FiChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {isOpen && (
        <div className="px-4 pb-4">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <div className="whitespace-pre-wrap text-sm text-muted-foreground">
              {content}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * ADR Metadata Row Component
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
 * Main ADR Display Component
 */
export function ADRDisplay({
  adr,
  showFullContent = false,
  className,
  onClick,
}: {
  adr: ADREntry;
  showFullContent?: boolean;
  className?: string;
  onClick?: () => void;
}) {
  const [copied, setCopied] = useState(false);

  // Generate link to the ADR file
  const fileLink = useMemo(() => {
    return `/docs/${adr.path}`;
  }, [adr.path]);

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
      onClick={onClick}
      className={cn(
        'overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm cursor-pointer hover:shadow-md transition-shadow',
        className
      )}
    >
      {/* Header */}
      <div className="border-b border-border bg-muted/50 px-4 py-3">
        <div className="flex items-start justify-between gap-4">
          {/* Title and number */}
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FiFileText className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                {adr.number && (
                  <span className="text-sm font-mono text-muted-foreground">
                    ADR-{adr.number.toString().padStart(3, '0')}
                  </span>
                )}
                <StatusBadge status={adr.status} />
              </div>
              <h2 className="mt-1 truncate text-lg font-semibold text-foreground">
                {adr.title}
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
            value={formatDate(adr.createdAt)}
          />
          {adr.updatedAt && (
            <MetadataRow
              icon={FiCalendar}
              label="Updated"
              value={formatDate(adr.updatedAt)}
            />
          )}
          {adr.metadata.author && (
            <MetadataRow
              icon={FiUser}
              label="Author"
              value={adr.metadata.author as string}
            />
          )}
        </div>
      </div>

      {/* Content Sections */}
      {(showFullContent || adr.context || adr.decision || adr.consequences || adr.alternatives) && (
        <div className="divide-y divide-border">
          <ADRSection
            title="Context"
            content={adr.context}
            defaultOpen={showFullContent}
          />
          <ADRSection
            title="Decision"
            content={adr.decision}
            defaultOpen={showFullContent}
          />
          <ADRSection
            title="Consequences"
            content={adr.consequences}
            defaultOpen={false}
          />
          <ADRSection
            title="Alternatives"
            content={adr.alternatives}
            defaultOpen={false}
          />
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-border bg-muted/30 px-4 py-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{adr.path}</span>
          {adr.metadata.date && (
            <span>Recorded: {adr.metadata.date as string}</span>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Compact ADR Card Component (for list view)
 */
export function ADRCard({
  adr,
  onClick,
  className,
}: {
  adr: ADREntry;
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
        <FiFileText className="h-5 w-5" />
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {/* Header */}
        <div className="flex items-center gap-2">
          {adr.number && (
            <span className="text-xs font-mono text-muted-foreground">
              ADR-{adr.number.toString().padStart(3, '0')}
            </span>
          )}
          <StatusBadge status={adr.status} />
        </div>

        {/* Title */}
        <h3 className="truncate font-semibold text-foreground group-hover:text-primary transition-colors">
          {adr.title}
        </h3>

        {/* Metadata */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <FiCalendar className="h-3 w-3" />
            {formatDate(adr.createdAt)}
          </span>
          {adr.metadata.author && (
            <span className="flex items-center gap-1">
              <FiUser className="h-3 w-3" />
              {adr.metadata.author as string}
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
 * Chevron right icon (for ADRCard)
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