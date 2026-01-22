/**
 * ADR List Component
 *
 * Displays a list of Architecture Decision Records (ADRs) with:
 * - Filtering by status
 * - Sorting options (date, number, title)
 * - Search functionality
 * - Compact card view or detailed view
 * - Pagination support
 */

import { useState, useMemo } from 'react';
import { cn } from '../../utils/cn.js';
import type { ADREntry, ADRStatus } from '../../../types/workhub.js';
import { ADRCard, ADRDisplay } from './ADRDisplay.js';
import { FiSearch, FiFilter, FiGrid, FiList, FiChevronDown, FiCheck } from 'react-icons/fi';

/**
 * Sort options
 */
type SortOption = 'date-desc' | 'date-asc' | 'number-desc' | 'number-asc' | 'title-asc' | 'title-desc';

/**
 * View mode
 */
type ViewMode = 'card' | 'list';

/**
 * Filter configuration
 */
interface FilterConfig {
  status?: ADRStatus[];
  searchQuery?: string;
}

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
    { value: 'number-desc', label: 'Highest number' },
    { value: 'number-asc', label: 'Lowest number' },
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
        <FiChevronDown className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
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
                {value === option.value && <FiCheck className="h-4 w-4 text-primary" />}
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
  value: ADRStatus[];
  onChange: (value: ADRStatus[]) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const statuses: ADRStatus[] = ['proposed', 'accepted', 'rejected', 'superseded', 'deprecated'];

  const handleToggle = (status: ADRStatus) => {
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
        <FiChevronDown className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
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
 * Main ADR List Component
 */
export function ADRList({
  adrs,
  viewMode: initialViewMode = 'card',
  showSearch = true,
  showFilters = true,
  showViewToggle = true,
  onADRClick,
  className,
}: {
  adrs: ADREntry[];
  viewMode?: ViewMode;
  showSearch?: boolean;
  showFilters?: boolean;
  showViewToggle?: boolean;
  onADRClick?: (adr: ADREntry) => void;
  className?: string;
}) {
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<ADRStatus[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');

  // Filter and sort ADRs
  const filteredAndSortedADRs = useMemo(() => {
    let result = [...adrs];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (adr) =>
          adr.title.toLowerCase().includes(query) ||
          adr.id.toLowerCase().includes(query) ||
          adr.context?.toLowerCase().includes(query) ||
          adr.decision?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (selectedStatuses.length > 0) {
      result = result.filter((adr) => selectedStatuses.includes(adr.status));
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return b.createdAt.getTime() - a.createdAt.getTime();
        case 'date-asc':
          return a.createdAt.getTime() - b.createdAt.getTime();
        case 'number-desc':
          return (b.number ?? 0) - (a.number ?? 0);
        case 'number-asc':
          return (a.number ?? 0) - (b.number ?? 0);
        case 'title-asc':
          return a.title.localeCompare(b.title);
        case 'title-desc':
          return b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });

    return result;
  }, [adrs, searchQuery, selectedStatuses, sortBy]);

  // Calculate statistics
  const stats = useMemo(() => {
    const byStatus: Record<ADRStatus, number> = {
      proposed: 0,
      accepted: 0,
      rejected: 0,
      superseded: 0,
      deprecated: 0,
    };
    adrs.forEach((adr) => {
      byStatus[adr.status]++;
    });
    return {
      total: adrs.length,
      filtered: filteredAndSortedADRs.length,
      byStatus,
    };
  }, [adrs, filteredAndSortedADRs.length]);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Architecture Decision Records
          </h2>
          <p className="text-sm text-muted-foreground">
            {stats.total} total {stats.total === 1 ? 'ADR' : 'ADRs'}
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
                placeholder="Search ADRs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-full min-w-[200px] rounded-md border border-border bg-background pl-9 pr-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
          )}

          {showFilters && (
            <>
              <StatusFilter value={selectedStatuses} onChange={setSelectedStatuses} />
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
        <div className="flex flex-wrap gap-2 text-xs">
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
        </div>
      )}

      {/* ADR list */}
      {filteredAndSortedADRs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 py-12">
          <p className="text-lg font-medium text-muted-foreground">No ADRs found</p>
          <p className="text-sm text-muted-foreground">
            {searchQuery || selectedStatuses.length > 0
              ? 'Try adjusting your filters'
              : 'No ADRs have been created yet'}
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
          {filteredAndSortedADRs.map((adr) => {
            if (viewMode === 'card') {
              return (
                <ADRCard
                  key={adr.id}
                  adr={adr}
                  onClick={() => onADRClick?.(adr)}
                />
              );
            }
            return (
              <ADRDisplay
                key={adr.id}
                adr={adr}
                showFullContent={false}
                onClick={() => onADRClick?.(adr)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * ADR List with Detail View Component
 *
 * Shows a list of ADRs and displays the selected ADR in detail
 */
export function ADRListWithDetail({
  adrs,
  className,
}: {
  adrs: ADREntry[];
  className?: string;
}) {
  const [selectedADR, setSelectedADR] = useState<ADREntry | null>(null);

  if (selectedADR) {
    return (
      <div className={cn('space-y-4', className)}>
        <button
          onClick={() => setSelectedADR(null)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to list
        </button>
        <ADRDisplay adr={selectedADR} showFullContent={true} />
      </div>
    );
  }

  return (
    <ADRList
      adrs={adrs}
      viewMode="card"
      onADRClick={setSelectedADR}
      className={className}
    />
  );
}