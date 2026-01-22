/**
 * Docs Page
 *
 * Displays WorkHub documentation including ADRs, Issues, and PRs
 */

import { useState, useEffect } from 'react';
import { ADRListWithDetail } from '../components/workhub/ADRList.js';
import { cn } from '../utils/cn.js';
import { FiFileText, FiRefreshCw, FiAlertCircle } from 'react-icons/fi';
import type { ADREntry } from '../../types/workhub.js';

interface WorkHubResponse {
  success: boolean;
  data: {
    adrs: ADREntry[];
    stats: {
      totalADRs: number;
      parseTime: number;
    };
  };
  timestamp: number;
  error?: string;
}

type TabType = 'adrs' | 'issues' | 'prs' | 'all';

export function Docs({ className }: { className?: string }) {
  const [activeTab, setActiveTab] = useState<TabType>('adrs');
  const [adrs, setADRs] = useState<ADREntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch ADRs
  useEffect(() => {
    const fetchADRs = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/workhub/adrs');

        if (!response.ok) {
          throw new Error(`Failed to fetch ADRs: ${response.statusText}`);
        }

        const result: WorkHubResponse = await response.json();

        if (result.success && result.data) {
          setADRs(result.data.adrs);
        } else {
          throw new Error(result.error || 'Failed to parse ADRs');
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load ADRs'));
        console.error('Error fetching ADRs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchADRs();
  }, []);

  // Handle retry
  const handleRetry = () => {
    setError(null);
    setLoading(true);
    // The useEffect will re-trigger
  };

  // Tab configuration
  const tabs: { id: TabType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'adrs', label: 'ADRs', icon: FiFileText },
    { id: 'issues', label: 'Issues', icon: FiAlertCircle },
    { id: 'prs', label: 'PRs', icon: FiFileText },
    { id: 'all', label: 'All', icon: FiFileText },
  ];

  return (
    <div className={cn('mx-auto max-w-7xl p-6', className)}>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Documentation</h1>
          <p className="text-sm text-muted-foreground">
            Architecture Decision Records, Issues, and Pull Requests
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {error && (
            <button
              onClick={handleRetry}
              className="flex items-center gap-2 rounded-md bg-secondary px-3 py-1.5 text-sm font-medium transition-colors hover:bg-secondary/80"
              aria-label="Retry loading"
            >
              <FiRefreshCw className="h-4 w-4" />
              Retry
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-border">
        <nav className="-mb-px flex gap-4" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 border-b-2 px-1 py-2 text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
              role="tab"
              aria-selected={activeTab === tab.id}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <FiRefreshCw className="mb-4 h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading documentation...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-destructive/50 bg-destructive/10 py-12 text-center">
            <FiAlertCircle className="mb-4 h-12 w-12 text-destructive" />
            <h2 className="mb-2 text-xl font-semibold text-foreground">Error Loading Documentation</h2>
            <p className="mb-4 max-w-md text-muted-foreground">{error.message}</p>
            <button
              onClick={handleRetry}
              className="flex items-center gap-2 rounded-md bg-destructive px-4 py-2 text-destructive-foreground transition-colors hover:bg-destructive/90"
            >
              <FiRefreshCw className="h-4 w-4" />
              Retry
            </button>
          </div>
        ) : (
          <>
            {activeTab === 'adrs' && (
              <ADRListWithDetail adrs={adrs} />
            )}
            {activeTab === 'issues' && (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 py-12 text-center">
                <FiAlertCircle className="mb-4 h-12 w-12 text-muted-foreground" />
                <h2 className="mb-2 text-xl font-semibold text-foreground">Issues Coming Soon</h2>
                <p className="text-sm text-muted-foreground">
                  Issue display functionality will be implemented in task 041.
                </p>
              </div>
            )}
            {activeTab === 'prs' && (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 py-12 text-center">
                <FiFileText className="mb-4 h-12 w-12 text-muted-foreground" />
                <h2 className="mb-2 text-xl font-semibold text-foreground">PRs Coming Soon</h2>
                <p className="text-sm text-muted-foreground">
                  PR display functionality will be implemented in task 042.
                </p>
              </div>
            )}
            {activeTab === 'all' && (
              <div className="space-y-8">
                <div>
                  <h2 className="mb-4 text-xl font-semibold text-foreground">Architecture Decision Records</h2>
                  <ADRListWithDetail adrs={adrs} />
                </div>
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 py-12 text-center">
                  <FiAlertCircle className="mb-4 h-12 w-12 text-muted-foreground" />
                  <h2 className="mb-2 text-xl font-semibold text-foreground">More Content Coming Soon</h2>
                  <p className="text-sm text-muted-foreground">
                    Issues and PRs will be displayed here in upcoming tasks.
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer Info */}
      {!loading && !error && adrs.length > 0 && (
        <div className="mt-6 border-t border-border pt-4 text-sm text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>Total ADRs: <span className="font-medium text-foreground">{adrs.length}</span></span>
            <span className="text-xs">Last updated: Just now</span>
          </div>
        </div>
      )}
    </div>
  );
}