/**
 * Issue List Component
 *
 * Displays a list of Issues with:
 * - Filtering by status and priority
 * - Sorting options (date, priority, title)
 * - Search functionality
 * - Compact card view or detailed view
 * - Pagination support
 */

import { useState, useMemo } from 'react';
import { cn } from '../../utils/cn.js';
import type { IssueEntry, IssueStatus, IssuePriority } from '../../../types/workhub.js';
import { IssueCard, IssueDisplay } from './IssueDisplay.js';
import {
  FiSearch,
  FiFilter,
  FiGrid,
  FiList,
  FiChevronDown,
  FiCheck,
} from 'react-icons/fi';

/**
 * Sort options
 */
type SortOption =
  | 'date-desc'
  | 'date-asc'
  | 'priority-desc'
  | 'priority-asc'
  | 'title-asc'
  | 'title-desc';

/**
 * View mode
 */
type ViewMode = 'card' | 'list';



/**
 * Sort dropdown component
 */
function SortDropdown({
  value,
  onChange,
}: {
  value: SortOption;
  onChange: (value: SortOption) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const options: { value: SortOption; label: string }[] = [
    { value: 'date-desc', label: 'Newest first' },
    { value: 'date-asc', label: 'Oldest first' },
    { value: 'priority-desc', label: 'Highest priority' },
    { value: 'priority-asc', label: 'Lowest priority' },
    { value: 'title-asc', label: 'Title A-Z' },
    { value: 'title-desc', label: 'Title Z-A' },
  ];

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-sm hover:bg-accent"
      >
        <FiFilter className="h-4 w-4 text-muted-foreground" />
        <span>{selectedOption?.label}</span>
        <FiChevronDown
          className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')}
        />
      </button>

      {isOpen && (
        <>
          <div className="absolute inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-md border border-border bg-popover p-1 shadow-md">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={cn(
                  'flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent',
                  value === option.value && 'bg-accent'
                )}
              >
                <span>{option.label}</span>
                {value === option.value && (
                  <FiCheck className="h-4 w-4 text-primary" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Status filter dropdown component
 */
function StatusFilter({
  value,
  onChange,
}: {
  value: IssueStatus[];
  onChange: (value: IssueStatus[]) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const statuses: IssueStatus[] = ['todo', 'in_progress', 'done', 'blocked', 'paused'];

  const handleToggle = (status: IssueStatus) => {
    if (value.includes(status)) {
      onChange(value.filter((s) => s !== status));
    } else {
      onChange([...value, status]);
    }
  };

  const handleClear = () => {
    onChange([]);
  };

  const getLabel = () => {
    if (value.length === 0) return 'All statuses';
    if (value.length === 1) return value[0];
    return `${value.length} selected`;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors',
          value.length > 0
            ? 'border-primary bg-primary/10 text-primary'
            : 'border-border bg-background hover:bg-accent'
        )}
      >
        <FiFilter className="h-4 w-4" />
        <span>{getLabel()}</span>
        <FiChevronDown
          className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')}
        />
      </button>

      {isOpen && (
        <>
          <div className="absolute inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-md border border-border bg-popover p-1 shadow-md">
            <div className="space-y-1 p-1">
              {statuses.map((status) => (
                <label
                  key={status}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent"
                >
                  <input
                    type="checkbox"
                    checked={value.includes(status)}
                    onChange={() => handleToggle(status)}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  />
                  <span className="capitalize">{status.replace('_', ' ')}</span>
                </label>
              ))}
            </div>
            {value.length > 0 && (
              <div className="border-t border-border p-1">
                <button
                  onClick={() => {
                    handleClear();
                    setIsOpen(false);
                  }}
                  className="flex w-full items-center justify-center rounded-md px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Priority filter dropdown component
 */
function PriorityFilter({
  value,
  onChange,
}: {
  value: IssuePriority[];
  onChange: (value: IssuePriority[]) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const priorities: IssuePriority[] = ['p0', 'p1', 'p2', 'p3'];

  const handleToggle = (priority: IssuePriority) => {
    if (value.includes(priority)) {
      onChange(value.filter((p) => p !== priority));
    } else {
      onChange([...value, priority]);
    }
  };

  const handleClear = () => {
    onChange([]);
  };

  const getLabel = () => {
    if (value.length === 0) return 'All priorities';
    if (value.length === 1) return value[0];
    return `${value.length} selected`;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors',
          value.length > 0
            ? 'border-primary bg-primary/10 text-primary'
            : 'border-border bg-background hover:bg-accent'
        )}
      >
        <FiFilter className="h-4 w-4" />
        <span>{getLabel()}</span>
        <FiChevronDown
          className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')}
        />
      </button>

      {isOpen && (
        <>
          <div className="absolute inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-md border border-border bg-popover p-1 shadow-md">
            <div className="space-y-1 p-1">
              {priorities.map((priority) => (
                <label
                  key={priority}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent"
                >
                  <input
                    type="checkbox"
                    checked={value.includes(priority)}
                    onChange={() => handleToggle(priority)}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  />
                  <span className="uppercase">{priority}</span>
                </label>
              ))}
            </div>
            {value.length > 0 && (
              <div className="border-t border-border p-1">
                <button
                  onClick={() => {
                    handleClear();
                    setIsOpen(false);
                  }}
                  className="flex w-full items-center justify-center rounded-md px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Main Issue List Component
 */
export function IssueList({
  issues,
  viewMode: initialViewMode = 'card',
  showSearch = true,
  showFilters = true,
  showViewToggle = true,
  onIssueClick,
  className,
}: {
  issues: IssueEntry[];
  viewMode?: ViewMode;
  showSearch?: boolean;
  showFilters?: boolean;
  showViewToggle?: boolean;
  onIssueClick?: (issue: IssueEntry) => void;
  className?: string;
}) {
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<IssueStatus[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<IssuePriority[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('priority-desc');

  // Priority order for sorting
  const priorityOrder: Record<IssuePriority, number> = {
    p0: 0,
    p1: 1,
    p2: 2,
    p3: 3,
  };

  // Filter and sort issues
  const filteredAndSortedIssues = useMemo(() => {
    let result = [...issues];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (issue) =>
          issue.title.toLowerCase().includes(query) ||
          issue.id.toLowerCase().includes(query) ||
          issue.goal?.toLowerCase().includes(query) ||
          issue.background?.toLowerCase().includes(query) ||
          issue.category?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (selectedStatuses.length > 0) {
      result = result.filter((issue) => selectedStatuses.includes(issue.status));
    }

    // Apply priority filter
    if (selectedPriorities.length > 0) {
      result = result.filter((issue) =>
        selectedPriorities.includes(issue.priority)
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return b.createdAt.getTime() - a.createdAt.getTime();
        case 'date-asc':
          return a.createdAt.getTime() - b.createdAt.getTime();
        case 'priority-desc':
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        case 'priority-asc':
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'title-asc':
          return a.title.localeCompare(b.title);
        case 'title-desc':
          return b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });

    return result;
  }, [
    issues,
    searchQuery,
    selectedStatuses,
    selectedPriorities,
    sortBy,
    priorityOrder,
  ]);

  // Calculate statistics
  const stats = useMemo(() => {
    const byStatus: Record<IssueStatus, number> = {
      todo: 0,
      in_progress: 0,
      done: 0,
      blocked: 0,
      paused: 0,
    };
    const byPriority: Record<IssuePriority, number> = {
      p0: 0,
      p1: 0,
      p2: 0,
      p3: 0,
    };
    issues.forEach((issue) => {
      byStatus[issue.status]++;
      byPriority[issue.priority]++;
    });
    return {
      total: issues.length,
      filtered: filteredAndSortedIssues.length,
      byStatus,
      byPriority,
    };
  }, [issues, filteredAndSortedIssues.length]);

  return (
    <div className={cn('relative space-y-4', className)}>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Issues</h2>
          <p className="text-sm text-muted-foreground">
            {stats.total} total {stats.total === 1 ? 'issue' : 'issues'}
            {stats.filtered !== stats.total && ` (${stats.filtered} shown)`}
          </p>
        </div>

        {/* Controls */}
        <div className="relative flex flex-wrap items-center gap-2">
          {showSearch && (
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search issues..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-full min-w-[200px] rounded-md border border-border bg-background pl-9 pr-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
          )}

          {showFilters && (
            <>
              <StatusFilter
                value={selectedStatuses}
                onChange={setSelectedStatuses}
              />
              <PriorityFilter
                value={selectedPriorities}
                onChange={setSelectedPriorities}
              />
              <SortDropdown value={sortBy} onChange={setSortBy} />
            </>
          )}

          {showViewToggle && (
            <div className="flex items-center rounded-md border border-border bg-muted p-1">
              <button
                onClick={() => setViewMode('card')}
                className={cn(
                  'rounded px-2 py-1 transition-colors',
                  viewMode === 'card'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                title="Card view"
              >
                <FiGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'rounded px-2 py-1 transition-colors',
                  viewMode === 'list'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                title="List view"
              >
                <FiList className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Status and priority summary */}
      {showFilters && (
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="font-medium text-muted-foreground">Status:</span>
          {Object.entries(stats.byStatus).map(([status, count]) => (
            <span
              key={status}
              className={cn(
                'rounded-full px-2 py-1',
                count === 0
                  ? 'bg-muted text-muted-foreground'
                  : 'bg-primary/10 text-primary'
              )}
            >
              {status}: {count}
            </span>
          ))}
          <span className="mx-2 font-medium text-muted-foreground">|</span>
          <span className="font-medium text-muted-foreground">Priority:</span>
          {Object.entries(stats.byPriority).map(([priority, count]) => (
            <span
              key={priority}
              className={cn(
                'rounded-full px-2 py-1',
                count === 0
                  ? 'bg-muted text-muted-foreground'
                  : 'bg-primary/10 text-primary'
              )}
            >
              {priority}: {count}
            </span>
          ))}
        </div>
      )}

      {/* Issue list */}
      {filteredAndSortedIssues.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 py-12">
          <p className="text-lg font-medium text-muted-foreground">No issues found</p>
          <p className="text-sm text-muted-foreground">
            {searchQuery ||
            selectedStatuses.length > 0 ||
            selectedPriorities.length > 0
              ? 'Try adjusting your filters'
              : 'No issues have been created yet'}
          </p>
        </div>
      ) : (
        <div
          className={cn(
            viewMode === 'card'
              ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3'
              : 'space-y-3'
          )}
        >
          {filteredAndSortedIssues.map((issue) => {
            if (viewMode === 'card') {
              return (
                <IssueCard
                  key={issue.id}
                  issue={issue}
                  onClick={() => onIssueClick?.(issue)}
                />
              );
            }
            return (
              <IssueDisplay
                key={issue.id}
                issue={issue}
                showFullContent={false}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Issue List with Detail View Component
 *
 * Shows a list of issues and displays the selected issue in detail
 */
export function IssueListWithDetail({
  issues,
  className,
}: {
  issues: IssueEntry[];
  className?: string;
}) {
  const [selectedIssue, setSelectedIssue] = useState<IssueEntry | null>(null);

  if (selectedIssue) {
    return (
      <div className={cn('space-y-4', className)}>
        <button
          onClick={() => setSelectedIssue(null)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to list
        </button>
        <IssueDisplay issue={selectedIssue} showFullContent={true} />
      </div>
    );
  }

  return (
    <IssueList
      issues={issues}
      viewMode="card"
      onIssueClick={setSelectedIssue}
      className={className}
    />
  );
}