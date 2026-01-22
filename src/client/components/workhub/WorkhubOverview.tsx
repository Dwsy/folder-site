/**
 * Workhub Overview Component
 *
 * Provides a dashboard view with:
 * - Statistics cards for ADRs, Issues, PRs
 * - Recent activity feed
 * - Quick access to important items
 * - Status distribution charts
 */

import { useMemo } from 'react';
import { cn } from '../../utils/cn.js';
import type { ADREntry, IssueEntry, PREntry, ADRStatus, IssueStatus, PRStatus } from '../../../types/workhub.js';
import {
  FiFileText,
  FiAlertCircle,
  FiGitPullRequest,
  FiCheckCircle,
  FiClock,
  FiTrendingUp,
  FiActivity,
  FiArrowRight,
} from 'react-icons/fi';

interface WorkhubOverviewProps {
  adrs: ADREntry[];
  issues: IssueEntry[];
  prs: PREntry[];
  className?: string;
  onNavigate?: (tab: 'adrs' | 'issues' | 'prs') => void;
}

/**
 * Stat card component
 */
function StatCard({
  title,
  value,
  change,
  icon: Icon,
  description,
  onClick,
}: {
  title: string;
  value: number;
  change?: { value: number; positive: boolean };
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  onClick?: () => void;
}) {
  return (
    <div
      className={cn(
        'relative rounded-lg border border-border bg-background p-6 transition-shadow hover:shadow-md',
        onClick && 'cursor-pointer'
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h3 className="text-3xl font-bold text-foreground">{value}</h3>
          {change && (
            <div className="flex items-center gap-1 text-xs">
              <FiTrendingUp
                className={cn(
                  'h-3 w-3',
                  change.positive ? 'text-green-500' : 'text-red-500'
                )}
              />
              <span
                className={cn(
                  change.positive ? 'text-green-500' : 'text-red-500'
                )}
              >
                {change.positive ? '+' : ''}
                {change.value}%
              </span>
              <span className="text-muted-foreground">vs last week</span>
            </div>
          )}
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="rounded-lg bg-primary/10 p-3">
          <Icon className="h-6 w-6 text-primary" />
        </div>
      </div>
    </div>
  );
}

/**
 * Status badge component
 */
function StatusBadge({
  status,
  type,
}: {
  status: string;
  type: 'adr' | 'issue' | 'pr';
}) {
  // Suppress unused param warning
  void type;
  const styles: Record<string, { bg: string; text: string }> = {
    // ADR statuses
    proposed: { bg: 'bg-yellow-500/10', text: 'text-yellow-500' },
    accepted: { bg: 'bg-green-500/10', text: 'text-green-500' },
    rejected: { bg: 'bg-red-500/10', text: 'text-red-500' },
    superseded: { bg: 'bg-purple-500/10', text: 'text-purple-500' },
    deprecated: { bg: 'bg-gray-500/10', text: 'text-gray-500' },
    // Issue statuses
    todo: { bg: 'bg-gray-500/10', text: 'text-gray-500' },
    in_progress: { bg: 'bg-blue-500/10', text: 'text-blue-500' },
    done: { bg: 'bg-green-500/10', text: 'text-green-500' },
    blocked: { bg: 'bg-red-500/10', text: 'text-red-500' },
    paused: { bg: 'bg-yellow-500/10', text: 'text-yellow-500' },
    // PR statuses
    draft: { bg: 'bg-gray-500/10', text: 'text-gray-500' },
    open: { bg: 'bg-blue-500/10', text: 'text-blue-500' },
    merged: { bg: 'bg-green-500/10', text: 'text-green-500' },
    closed: { bg: 'bg-red-500/10', text: 'text-red-500' },
  };

  const style = styles[status] || { bg: 'bg-muted', text: 'text-muted-foreground' };

  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-1 text-xs font-medium', style.bg, style.text)}>
      {status.replace('_', ' ')}
    </span>
  );
}

/**
 * Activity item component
 */
function ActivityItem({
  type,
  title,
  status,
  date,
  onClick,
}: {
  type: 'adr' | 'issue' | 'pr';
  title: string;
  status: string;
  date: Date;
  onClick?: () => void;
}) {
  // Suppress unused param warning
  void type;
  const icons = {
    adr: FiFileText,
    issue: FiAlertCircle,
    pr: FiGitPullRequest,
  };

  const Icon = icons[type];

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div
      className={cn('flex items-start gap-3 rounded-lg border border-border bg-background p-4 transition-colors hover:bg-accent', onClick && 'cursor-pointer')}
      onClick={onClick}
    >
      <div className="mt-0.5">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-muted-foreground uppercase">{type}</span>
          <span className="text-xs text-muted-foreground">{formatDate(date)}</span>
        </div>
        <p className="text-sm font-medium text-foreground line-clamp-1">{title}</p>
        <StatusBadge status={status} type={type} />
      </div>
    </div>
  );
}

/**
 * Status distribution bar component
 */
function StatusDistribution({
  data,
  type,
}: {
  data: Record<string, number>;
  type: 'adr' | 'issue' | 'pr';
}) {
  // Suppress unused param warning
  void type;
  const total = Object.values(data).reduce((sum, count) => sum + count, 0);

  if (total === 0) {
    return (
      <div className="flex h-2 w-full items-center justify-center rounded-full bg-muted">
        <span className="text-xs text-muted-foreground">No data</span>
      </div>
    );
  }

  const colors: Record<string, string> = {
    // ADR
    proposed: 'bg-yellow-500',
    accepted: 'bg-green-500',
    rejected: 'bg-red-500',
    superseded: 'bg-purple-500',
    deprecated: 'bg-gray-500',
    // Issue
    todo: 'bg-gray-500',
    in_progress: 'bg-blue-500',
    done: 'bg-green-500',
    blocked: 'bg-red-500',
    paused: 'bg-yellow-500',
    // PR
    draft: 'bg-gray-500',
    open: 'bg-blue-500',
    merged: 'bg-green-500',
    closed: 'bg-red-500',
  };

  return (
    <div className="flex h-2 w-full overflow-hidden rounded-full">
      {Object.entries(data).map(([status, count]) => {
        const percentage = (count / total) * 100;
        return (
          <div
            key={status}
            className={cn(colors[status] || 'bg-muted')}
            style={{ width: `${percentage}%` }}
            title={`${status}: ${count} (${percentage.toFixed(1)}%)`}
          />
        );
      })}
    </div>
  );
}

/**
 * Quick action button component
 */
function QuickActionButton({
  label,
  icon: Icon,
  onClick,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 rounded-lg border border-border bg-background p-4 text-center transition-colors hover:bg-accent hover:border-primary/50"
    >
      <Icon className="h-6 w-6 text-muted-foreground" />
      <span className="text-xs font-medium text-foreground">{label}</span>
    </button>
  );
}

/**
 * Main Workhub Overview Component
 */
export function WorkhubOverview({
  adrs,
  issues,
  prs,
  className,
  onNavigate,
}: WorkhubOverviewProps) {
  // Calculate statistics
  const stats = useMemo(() => {
    const adrByStatus: Record<ADRStatus, number> = {
      proposed: 0,
      accepted: 0,
      rejected: 0,
      superseded: 0,
      deprecated: 0,
    };
    adrs.forEach((adr) => adrByStatus[adr.status]++);

    const issueByStatus: Record<IssueStatus, number> = {
      todo: 0,
      in_progress: 0,
      done: 0,
      blocked: 0,
      paused: 0,
    };
    issues.forEach((issue) => issueByStatus[issue.status]++);

    const prByStatus: Record<PRStatus, number> = {
      draft: 0,
      open: 0,
      merged: 0,
      closed: 0,
    };
    prs.forEach((pr) => prByStatus[pr.status]++);

    return {
      adrs: {
        total: adrs.length,
        byStatus: adrByStatus,
        recent: adrs.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()).slice(0, 5),
      },
      issues: {
        total: issues.length,
        byStatus: issueByStatus,
        recent: issues.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()).slice(0, 5),
      },
      prs: {
        total: prs.length,
        byStatus: prByStatus,
        recent: prs.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()).slice(0, 5),
      },
    };
  }, [adrs, issues, prs]);

  // Get recent activity across all types
  const recentActivity = useMemo(() => {
    const allItems = [
      ...adrs.map((item) => ({ ...item, type: 'adr' as const })),
      ...issues.map((item) => ({ ...item, type: 'issue' as const })),
      ...prs.map((item) => ({ ...item, type: 'pr' as const })),
    ];

    return allItems
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, 10);
  }, [adrs, issues, prs]);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total ADRs"
          value={stats.adrs.total}
          icon={FiFileText}
          description="Architecture Decision Records"
          onClick={() => onNavigate?.('adrs')}
        />
        <StatCard
          title="Total Issues"
          value={stats.issues.total}
          icon={FiAlertCircle}
          description="Tasks and issues"
          onClick={() => onNavigate?.('issues')}
        />
        <StatCard
          title="Total PRs"
          value={stats.prs.total}
          icon={FiGitPullRequest}
          description="Pull requests"
          onClick={() => onNavigate?.('prs')}
        />
      </div>

      {/* Quick actions */}
      <div>
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <QuickActionButton
            label="New ADR"
            icon={FiFileText}
            onClick={() => onNavigate?.('adrs')}
          />
          <QuickActionButton
            label="New Issue"
            icon={FiAlertCircle}
            onClick={() => onNavigate?.('issues')}
          />
          <QuickActionButton
            label="New PR"
            icon={FiGitPullRequest}
            onClick={() => onNavigate?.('prs')}
          />
          <QuickActionButton
            label="View All"
            icon={FiActivity}
          />
        </div>
      </div>

      {/* Status distribution */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-border bg-background p-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-medium text-foreground">ADR Status</h4>
            <span className="text-xs text-muted-foreground">{stats.adrs.total} total</span>
          </div>
          <StatusDistribution data={stats.adrs.byStatus} type="adr" />
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {Object.entries(stats.adrs.byStatus).map(([status, count]) =>
              count > 0 ? (
                <span key={status} className="flex items-center gap-1 text-muted-foreground">
                  <span className="capitalize">{status}</span>
                  <span>{count}</span>
                </span>
              ) : null
            )}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-background p-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-medium text-foreground">Issue Status</h4>
            <span className="text-xs text-muted-foreground">{stats.issues.total} total</span>
          </div>
          <StatusDistribution data={stats.issues.byStatus} type="issue" />
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {Object.entries(stats.issues.byStatus).map(([status, count]) =>
              count > 0 ? (
                <span key={status} className="flex items-center gap-1 text-muted-foreground">
                  <span className="capitalize">{status.replace('_', ' ')}</span>
                  <span>{count}</span>
                </span>
              ) : null
            )}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-background p-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-medium text-foreground">PR Status</h4>
            <span className="text-xs text-muted-foreground">{stats.prs.total} total</span>
          </div>
          <StatusDistribution data={stats.prs.byStatus} type="pr" />
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {Object.entries(stats.prs.byStatus).map(([status, count]) =>
              count > 0 ? (
                <span key={status} className="flex items-center gap-1 text-muted-foreground">
                  <span className="capitalize">{status}</span>
                  <span>{count}</span>
                </span>
              ) : null
            )}
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">Recent Activity</h3>
          {recentActivity.length > 0 && (
            <button className="flex items-center gap-1 text-xs text-primary hover:text-primary/80">
              View all
              <FiArrowRight className="h-3 w-3" />
            </button>
          )}
        </div>

        {recentActivity.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 py-12">
            <FiClock className="mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentActivity.map((item) => (
              <ActivityItem
                key={`${item.type}-${item.id}`}
                type={item.type}
                title={item.title}
                status={item.status}
                date={item.updatedAt}
                onClick={() => onNavigate?.(`${item.type}s` as 'adrs' | 'issues' | 'prs')}
              />
            ))}
          </div>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Completed items */}
        <div className="rounded-lg border border-border bg-background p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-500/10 p-2">
              <FiCheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Completed</p>
              <p className="text-xs text-muted-foreground">
                {stats.issues.byStatus.done} issues, {stats.adrs.byStatus.accepted} ADRs
              </p>
            </div>
          </div>
        </div>

        {/* In progress */}
        <div className="rounded-lg border border-border bg-background p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-2">
              <FiActivity className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">In Progress</p>
              <p className="text-xs text-muted-foreground">
                {stats.issues.byStatus.in_progress} issues, {stats.prs.byStatus.open} PRs
              </p>
            </div>
          </div>
        </div>

        {/* Blocked items */}
        <div className="rounded-lg border border-border bg-background p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-red-500/10 p-2">
              <FiAlertCircle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Needs Attention</p>
              <p className="text-xs text-muted-foreground">
                {stats.issues.byStatus.blocked} blocked, {stats.adrs.byStatus.proposed} proposed
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}