/**
 * PR List Component
 *
 * Displays a list of Pull Requests with:
 * - Filtering by status and deployment status
 * - Sorting options (date, status, title)
 * - Search functionality
 * - Compact card view or detailed view
 * - Statistics display
 */

import { useState, useMemo } from 'react';
import { cn } from '../../utils/cn.js';
import type { PREntry, PRStatus } from '../../../types/workhub.js';
import { PRCard, PRDisplay } from './PRDisplay.js';
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
  | 'status-asc'
  | 'status-desc'
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
    { value: 'status-asc', label: 'Status (Draft→Merged)' },
    { value: 'status-desc', label: 'Status (Merged→Draft)' },
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
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-md border border-border bg-popover p-1 shadow-md">
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
  value: PRStatus[];
  onChange: (value: PRStatus[]) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const statuses: PRStatus[] = ['draft', 'open', 'merged', 'closed'];

  const handleToggle = (status: PRStatus) => {
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
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full z-20 mt-1 w-56 rounded-md border border-border bg-popover p-1 shadow-md">
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
                  <span className="capitalize">{status}</span>
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
 * Main PR List Component
 */
export function PRList({
  prs,
  viewMode: initialViewMode = 'card',
  showSearch = true,
  showFilters = true,
  showViewToggle = true,
  onPRClick,
  className,
}: {
  prs: PREntry[];
  viewMode?: ViewMode;
  showSearch?: boolean;
  showFilters?: boolean;
  showViewToggle?: boolean;
  onPRClick?: (pr: PREntry) => void;
  className?: string;
}) {
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<PRStatus[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');

  // Status order for sorting (draft -> open -> merged -> closed)
  const statusOrder: Record<PRStatus, number> = {
    draft: 0,
    open: 1,
    merged: 2,
    closed: 3,
  };

  // Filter and sort PRs
  const filteredAndSortedPRs = useMemo(() => {
    let result = [...prs];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (pr) =>
          pr.title.toLowerCase().includes(query) ||
          pr.id.toLowerCase().includes(query) ||
          pr.changes?.toLowerCase().includes(query) ||
          pr.background?.toLowerCase().includes(query) ||
          pr.category?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (selectedStatuses.length > 0) {
      result = result.filter((pr) => selectedStatuses.includes(pr.status));
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return b.createdAt.getTime() - a.createdAt.getTime();
        case 'date-asc':
          return a.createdAt.getTime() - b.createdAt.getTime();
        case 'status-asc':
          return statusOrder[a.status] - statusOrder[b.status];
        case 'status-desc':
          return statusOrder[b.status] - statusOrder[a.status];
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
    prs,
    searchQuery,
    selectedStatuses,
    sortBy,
    statusOrder,
  ]);

  // Calculate statistics
  const stats = useMemo(() => {
    const byStatus: Record<PRStatus, number> = {
      draft: 0,
      open: 0,
      merged: 0,
      closed: 0,
    };
    const withBreakingChanges = prs.filter((pr) => pr.breakingChange).length;
    const withDependencyChanges = prs.filter((pr) => pr.dependencyChanges).length;

    prs.forEach((pr) => {
      byStatus[pr.status]++;
    });
    return {
      total: prs.length,
      filtered: filteredAndSortedPRs.length,
      byStatus,
      withBreakingChanges,
      withDependencyChanges,
    };
  }, [prs, filteredAndSortedPRs.length]);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Pull Requests</h2>
          <p className="text-sm text-muted-foreground">
            {stats.total} total {stats.total === 1 ? 'PR' : 'PRs'}
            {stats.filtered !== stats.total && ` (${stats.filtered} shown)`}
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {showSearch && (
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search PRs..."
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

      {/* Status summary */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
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
          {stats.withBreakingChanges > 0 && (
            <>
              <span className="mx-2 font-medium text-muted-foreground">|</span>
              <span className="rounded-full bg-destructive/10 px-2 py-1 text-destructive">
                Breaking: {stats.withBreakingChanges}
              </span>
            </>
          )}
          {stats.withDependencyChanges > 0 && (
            <>
              <span className="mx-2 font-medium text-muted-foreground">|</span>
              <span className="rounded-full bg-orange-500/10 px-2 py-1 text-orange-500">
                Dep Changes: {stats.withDependencyChanges}
              </span>
            </>
          )}
        </div>
      )}

      {/* PR list */}
      {filteredAndSortedPRs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 py-12">
          <p className="text-lg font-medium text-muted-foreground">No PRs found</p>
          <p className="text-sm text-muted-foreground">
            {searchQuery || selectedStatuses.length > 0
              ? 'Try adjusting your filters'
              : 'No PRs have been created yet'}
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
          {filteredAndSortedPRs.map((pr) => {
            if (viewMode === 'card') {
              return (
                <PRCard
                  key={pr.id}
                  pr={pr}
                  onClick={() => onPRClick?.(pr)}
                />
              );
            }
            return (
              <PRDisplay
                key={pr.id}
                pr={pr}
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
 * PR List with Detail View Component
 *
 * Shows a list of PRs and displays the selected PR in detail
 */
export function PRListWithDetail({
  prs,
  className,
}: {
  prs: PREntry[];
  className?: string;
}) {
  const [selectedPR, setSelectedPR] = useState<PREntry | null>(null);

  if (selectedPR) {
    return (
      <div className={cn('space-y-4', className)}>
        <button
          onClick={() => setSelectedPR(null)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to list
        </button>
        <PRDisplay pr={selectedPR} showFullContent={true} />
      </div>
    );
  }

  return (
    <PRList
      prs={prs}
      viewMode="card"
      onPRClick={setSelectedPR}
      className={className}
    />
  );
}