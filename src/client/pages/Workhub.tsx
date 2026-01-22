/**
 * Workhub Page
 *
 * Main Workhub page that provides a comprehensive view of ADRs, Issues, and PRs
 * with overview statistics, navigation, and integrated display components.
 */

import { useState, useEffect } from 'react';
import { WorkhubLayout } from '../components/workhub/WorkhubLayout.js';
import { WorkhubOverview } from '../components/workhub/WorkhubOverview.js';
import { ADRListWithDetail } from '../components/workhub/ADRList.js';
import { IssueListWithDetail } from '../components/workhub/IssueList.js';
import { PRListWithDetail } from '../components/workhub/PRList.js';
import type { ADREntry, IssueEntry, PREntry } from '../../types/workhub.js';

interface WorkHubResponse {
  success: boolean;
  data: {
    adrs: ADREntry[];
    issues?: IssueEntry[];
    prs?: PREntry[];
    stats: {
      totalADRs: number;
      totalIssues?: number;
      totalPRs?: number;
      parseTime: number;
    };
  };
  timestamp: number;
  error?: string;
}

type ViewType = 'overview' | 'adrs' | 'issues' | 'prs';

export function Workhub({ className }: { className?: string }) {
  const [view, setView] = useState<ViewType>('overview');
  const [adrs, setADRs] = useState<ADREntry[]>([]);
  const [issues, setIssues] = useState<IssueEntry[]>([]);
  const [prs, setPRs] = useState<PREntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Suppress unused variable warning
  void refreshing;

  // Fetch all Workhub data
  const fetchData = async (showRefreshing = false) => {
    if (showRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      // Fetch ADRs
      const adrResponse = await fetch('/api/workhub/adrs');
      if (!adrResponse.ok) {
        throw new Error(`Failed to fetch ADRs: ${adrResponse.statusText}`);
      }
      const adrResult: WorkHubResponse = await adrResponse.json();
      if (adrResult.success && adrResult.data) {
        setADRs(adrResult.data.adrs);
      }

      // Fetch Issues
      const issueResponse = await fetch('/api/workhub/issues');
      if (!issueResponse.ok) {
        throw new Error(`Failed to fetch Issues: ${issueResponse.statusText}`);
      }
      const issueResult: WorkHubResponse = await issueResponse.json();
      if (issueResult.success && issueResult.data) {
        setIssues(issueResult.data.issues || []);
      }

      // Fetch PRs
      const prResponse = await fetch('/api/workhub/prs');
      if (!prResponse.ok) {
        throw new Error(`Failed to fetch PRs: ${prResponse.statusText}`);
      }
      const prResult: WorkHubResponse = await prResponse.json();
      if (prResult.success && prResult.data) {
        setPRs(prResult.data.prs || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load Workhub data'));
      console.error('Error fetching Workhub data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, []);

  // Handle view change
  const handleViewChange = (newView: ViewType) => {
    setView(newView);
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchData(true);
  };

  return (
    <WorkhubLayout
      onRefresh={handleRefresh}
      loading={loading}
      className={className}
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-4 text-muted-foreground">Loading Workhub...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-destructive/50 bg-destructive/10 py-12 text-center">
          <svg
            className="mb-4 h-12 w-12 text-destructive"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h2 className="mb-2 text-xl font-semibold text-foreground">Error Loading Workhub</h2>
          <p className="mb-4 max-w-md text-muted-foreground">{error.message}</p>
          <button
            onClick={handleRefresh}
            className="rounded-md bg-destructive px-4 py-2 text-destructive-foreground transition-colors hover:bg-destructive/90"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          {view === 'overview' && (
            <WorkhubOverview
              adrs={adrs}
              issues={issues}
              prs={prs}
              onNavigate={handleViewChange}
            />
          )}

          {view === 'adrs' && (
            <ADRListWithDetail adrs={adrs} />
          )}

          {view === 'issues' && (
            <IssueListWithDetail issues={issues} />
          )}

          {view === 'prs' && (
            <PRListWithDetail prs={prs} />
          )}
        </>
      )}
    </WorkhubLayout>
  );
}