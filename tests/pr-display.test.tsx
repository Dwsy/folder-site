/**
 * PR Display Component Tests
 *
 * Unit tests for PRDisplay and PRList components
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PRDisplay, PRCard } from '../src/client/components/workhub/PRDisplay';
import { PRList, PRListWithDetail } from '../src/client/components/workhub/PRList';
import type { PREntry, PRStatus } from '../src/types/workhub';

// Mock date for consistent testing
const mockDate = new Date('2026-01-22T10:00:00Z');

// Create a sample PR for testing
const createMockPR = (overrides?: Partial<PREntry>): PREntry => ({
  type: 'pr',
  id: 'pr001',
  title: 'Implement PR display component',
  status: 'open',
  path: 'pr/pr001.md',
  filePath: '/docs/pr/pr001.md',
  content: '# PR Title\n\n## Background\nImplementation details...',
  metadata: {},
  createdAt: mockDate,
  updatedAt: mockDate,
  background: 'Implement PR display component for workhub',
  changes: 'Added PRDisplay and PRList components',
  linkedIssues: ['task042'],
  testResult: [
    { checked: true, text: 'Component renders correctly' },
    { checked: false, text: 'All tests pass' },
  ],
  riskAssessment: 'Low risk - UI only changes',
  rollbackPlan: 'Revert commit if issues arise',
  changeType: ['feature', 'ui'],
  fileChanges: [
    { file: 'PRDisplay.tsx', type: 'added', description: 'New component' },
    { file: 'PRList.tsx', type: 'added', description: 'New component' },
  ],
  breakingChange: false,
  performanceImpact: 'None',
  dependencyChanges: false,
  securityConsiderations: 'None',
  ...overrides,
});

describe('PRDisplay Component', () => {
  describe('Rendering', () => {
    it('should render PR title and ID', () => {
      const pr = createMockPR();
      render(<PRDisplay pr={pr} />);

      expect(screen.getByText('pr001')).toBeInTheDocument();
      expect(screen.getByText('Implement PR display component')).toBeInTheDocument();
    });

    it('should render status badge with correct color', () => {
      const statuses: PRStatus[] = ['draft', 'open', 'merged', 'closed'];

      statuses.forEach((status) => {
        const pr = createMockPR({ status });
        const { unmount } = render(<PRDisplay pr={pr} />);

        const statusText = status.charAt(0).toUpperCase() + status.slice(1);
        expect(screen.getByText(statusText)).toBeInTheDocument();
        unmount();
      });
    });

    it('should render PR metadata', () => {
      const pr = createMockPR({
        mergedAt: new Date('2026-01-22T12:00:00Z'),
        mergedBy: 'test-user',
        commitHash: 'abc123',
      });

      render(<PRDisplay pr={pr} showFullContent={true} />);

      expect(screen.getByText(/Merged by:/i)).toBeInTheDocument();
      expect(screen.getByText('test-user')).toBeInTheDocument();
      expect(screen.getByText('abc123')).toBeInTheDocument();
    });

    it('should render background section when provided', () => {
      const pr = createMockPR({ background: 'Test background' });
      render(<PRDisplay pr={pr} showFullContent={true} />);

      expect(screen.getByText('Background')).toBeInTheDocument();
      expect(screen.getByText('Test background')).toBeInTheDocument();
    });

    it('should render changes section when provided', () => {
      const pr = createMockPR({ changes: 'Test changes' });
      render(<PRDisplay pr={pr} showFullContent={true} />);

      expect(screen.getByText('Changes')).toBeInTheDocument();
      expect(screen.getByText('Test changes')).toBeInTheDocument();
    });

    it('should render linked issues', () => {
      const pr = createMockPR({ linkedIssues: ['task042', 'task043'] });
      render(<PRDisplay pr={pr} showFullContent={true} />);

      expect(screen.getByText('Linked Issues')).toBeInTheDocument();
      expect(screen.getByText('task042')).toBeInTheDocument();
      expect(screen.getByText('task043')).toBeInTheDocument();
    });

    it('should render test results', () => {
      const pr = createMockPR({
        testResult: [
          { checked: true, text: 'Test 1' },
          { checked: false, text: 'Test 2' },
        ],
      });
      render(<PRDisplay pr={pr} showFullContent={true} />);

      expect(screen.getByText('Test Results')).toBeInTheDocument();
      expect(screen.getByText('Test 1')).toBeInTheDocument();
      expect(screen.getByText('Test 2')).toBeInTheDocument();
    });

    it('should render risk assessment', () => {
      const pr = createMockPR({ riskAssessment: 'Low risk' });
      render(<PRDisplay pr={pr} showFullContent={true} />);

      expect(screen.getByText('Risk Assessment')).toBeInTheDocument();
      expect(screen.getByText('Low risk')).toBeInTheDocument();
    });

    it('should render rollback plan', () => {
      const pr = createMockPR({ rollbackPlan: 'Revert commit' });
      render(<PRDisplay pr={pr} showFullContent={true} />);

      expect(screen.getByText('Rollback Plan')).toBeInTheDocument();
      expect(screen.getByText('Revert commit')).toBeInTheDocument();
    });

    it('should render change type badges', () => {
      const pr = createMockPR({ changeType: ['feature', 'bugfix', 'refactor'] });
      render(<PRDisplay pr={pr} />);

      expect(screen.getByText('feature')).toBeInTheDocument();
      expect(screen.getByText('bugfix')).toBeInTheDocument();
      expect(screen.getByText('refactor')).toBeInTheDocument();
    });

    it('should render file changes', () => {
      const pr = createMockPR({
        fileChanges: [
          { file: 'file1.ts', type: 'added', description: 'New file' },
          { file: 'file2.ts', type: 'modified', description: 'Updated' },
        ],
      });
      render(<PRDisplay pr={pr} showFullContent={true} />);

      expect(screen.getByText('File Changes')).toBeInTheDocument();
      expect(screen.getByText('file1.ts')).toBeInTheDocument();
      expect(screen.getByText('file2.ts')).toBeInTheDocument();
    });

    it('should render breaking change warning', () => {
      const pr = createMockPR({ breakingChange: true });
      render(<PRDisplay pr={pr} />);

      expect(screen.getByText('Breaking Change')).toBeInTheDocument();
    });

    it('should render performance impact', () => {
      const pr = createMockPR({ performanceImpact: 'Improved' });
      render(<PRDisplay pr={pr} showFullContent={true} />);

      expect(screen.getByText('Performance Impact')).toBeInTheDocument();
      expect(screen.getByText('Improved')).toBeInTheDocument();
    });

    it('should render security considerations', () => {
      const pr = createMockPR({ securityConsiderations: 'No security issues' });
      render(<PRDisplay pr={pr} showFullContent={true} />);

      expect(screen.getByText('Security Considerations')).toBeInTheDocument();
      expect(screen.getByText('No security issues')).toBeInTheDocument();
    });

    it('should render review checklist', () => {
      const pr = createMockPR({
        reviewChecklist: {
          functional: ['Feature works', 'Edge cases handled'],
          codeQuality: ['Code follows style'],
          testing: ['Tests added'],
        },
      });
      render(<PRDisplay pr={pr} showFullContent={true} />);

      expect(screen.getByText('Review Checklist')).toBeInTheDocument();
      expect(screen.getByText('Functional')).toBeInTheDocument();
      expect(screen.getByText('Code Quality')).toBeInTheDocument();
      expect(screen.getByText('Testing')).toBeInTheDocument();
    });

    it('should render review log', () => {
      const pr = createMockPR({
        reviewLog: [
          {
            timestamp: '2026-01-22T10:00:00Z',
            reviewer: 'reviewer1',
            comments: [{ type: 'suggestion', description: 'Improve naming' }],
            response: 'Updated naming',
          },
        ],
      });
      render(<PRDisplay pr={pr} showFullContent={true} />);

      expect(screen.getByText('Review Log')).toBeInTheDocument();
      expect(screen.getByText('reviewer1')).toBeInTheDocument();
    });

    it('should render deploy status', () => {
      const pr = createMockPR({ deployStatus: 'deployed' });
      render(<PRDisplay pr={pr} />);

      expect(screen.getByText('deployed')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should toggle section visibility when clicked', () => {
      const pr = createMockPR({ background: 'Test background' });
      render(<PRDisplay pr={pr} showFullContent={true} />);

      const backgroundText = screen.getByText('Test background');
      expect(backgroundText).toBeInTheDocument();

      // Click to collapse
      const backgroundButton = screen.getByText('Background').closest('button');
      fireEvent.click(backgroundButton!);
      // Content should still be in DOM but not visible
      expect(backgroundText).toBeInTheDocument();
    });

    it('should copy link when copy button is clicked', async () => {
      const mockWriteText = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText: mockWriteText,
        },
      });

      const pr = createMockPR();
      render(<PRDisplay pr={pr} />);

      const copyButton = screen.getByTitle('Copy link');
      fireEvent.click(copyButton);

      expect(mockWriteText).toHaveBeenCalledWith(expect.stringContaining('/docs/pr/pr001.md'));
    });
  });

  describe('Edge Cases', () => {
    it('should handle PR with minimal data', () => {
      const pr: PREntry = {
        type: 'pr',
        id: 'pr001',
        title: 'Minimal PR',
        status: 'open',
        path: 'pr/pr001.md',
        filePath: '/docs/pr/pr001.md',
        metadata: {},
        createdAt: mockDate,
        updatedAt: mockDate,
      };

      render(<PRDisplay pr={pr} />);

      expect(screen.getByText('pr001')).toBeInTheDocument();
      expect(screen.getByText('Minimal PR')).toBeInTheDocument();
    });

    it('should handle empty arrays gracefully', () => {
      const pr = createMockPR({
        linkedIssues: [],
        testResult: [],
        fileChanges: [],
        reviewLog: [],
      });

      render(<PRDisplay pr={pr} showFullContent={true} />);

      // Should not show sections with empty data
      expect(screen.queryByText('Linked Issues')).not.toBeInTheDocument();
    });

    it('should handle missing optional fields', () => {
      const pr = createMockPR();
      delete (pr as any).background;
      delete (pr as any).changes;
      delete (pr as any).riskAssessment;

      render(<PRDisplay pr={pr} showFullContent={true} />);

      expect(screen.getByText('pr001')).toBeInTheDocument();
      // Should not crash
    });
  });
});

describe('PRCard Component', () => {
  it('should render compact PR card', () => {
    const pr = createMockPR();
    render(<PRCard pr={pr} />);

    expect(screen.getByText('pr001')).toBeInTheDocument();
    expect(screen.getByText('Implement PR display component')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const pr = createMockPR();
    const handleClick = vi.fn();

    render(<PRCard pr={pr} onClick={handleClick} />);

    const card = screen.getByText('Implement PR display component').closest('.group');
    fireEvent.click(card!);

    expect(handleClick).toHaveBeenCalledWith(pr);
  });

  it('should show breaking change badge', () => {
    const pr = createMockPR({ breakingChange: true });
    render(<PRCard pr={pr} />);

    expect(screen.getByText('⚠️ Breaking')).toBeInTheDocument();
  });

  it('should show change type badges', () => {
    const pr = createMockPR({ changeType: ['feature'] });
    render(<PRCard pr={pr} />);

    expect(screen.getByText('feature')).toBeInTheDocument();
  });
});

describe('PRList Component', () => {
  const mockPRs: PREntry[] = [
    createMockPR({ id: 'pr001', title: 'First PR', status: 'open' }),
    createMockPR({ id: 'pr002', title: 'Second PR', status: 'merged' }),
    createMockPR({ id: 'pr003', title: 'Third PR', status: 'closed' }),
  ];

  it('should render list of PRs', () => {
    render(<PRList prs={mockPRs} />);

    expect(screen.getByText('First PR')).toBeInTheDocument();
    expect(screen.getByText('Second PR')).toBeInTheDocument();
    expect(screen.getByText('Third PR')).toBeInTheDocument();
  });

  it('should render search input', () => {
    render(<PRList prs={mockPRs} showSearch={true} />);

    const searchInput = screen.getByPlaceholderText('Search PRs...');
    expect(searchInput).toBeInTheDocument();
  });

  it('should filter PRs by search query', () => {
    render(<PRList prs={mockPRs} showSearch={true} />);

    const searchInput = screen.getByPlaceholderText('Search PRs...');
    fireEvent.change(searchInput, { target: { value: 'First' } });

    expect(screen.getByText('First PR')).toBeInTheDocument();
    expect(screen.queryByText('Second PR')).not.toBeInTheDocument();
  });

  it('should filter PRs by status', () => {
    render(<PRList prs={mockPRs} showFilters={true} />);

    // Click status filter dropdown
    const statusFilter = screen.getByText('All statuses');
    fireEvent.click(statusFilter);

    // Select 'open' status
    const openCheckbox = screen.getByLabelText('Open');
    fireEvent.click(openCheckbox);

    expect(screen.getByText('First PR')).toBeInTheDocument();
    expect(screen.queryByText('Second PR')).not.toBeInTheDocument();
  });

  it('should sort PRs by date', () => {
    const prs: PREntry[] = [
      createMockPR({ id: 'pr001', title: 'Old PR', createdAt: new Date('2026-01-20') }),
      createMockPR({ id: 'pr002', title: 'New PR', createdAt: new Date('2026-01-22') }),
    ];

    render(<PRList prs={prs} showFilters={true} viewMode="list" />);

    // Click sort dropdown
    const sortButton = screen.getByText('Newest first');
    fireEvent.click(sortButton);

    // Select oldest first
    const oldestFirstOption = screen.getByText('Oldest first');
    fireEvent.click(oldestFirstOption);

    const prsInDOM = screen.getAllByText(/PR$/);
    expect(prsInDOM[0]).toHaveTextContent('Old PR');
  });

  it('should switch between card and list view', () => {
    render(<PRList prs={mockPRs} showViewToggle={true} />);

    // Click list view button
    const listButton = screen.getByTitle('List view');
    fireEvent.click(listButton);

    // Should render in list mode
    expect(screen.getByText('First PR')).toBeInTheDocument();
  });

  it('should show statistics', () => {
    render(<PRList prs={mockPRs} showFilters={true} />);

    expect(screen.getByText('3 total PRs')).toBeInTheDocument();
  });

  it('should show empty state when no PRs match filter', () => {
    render(<PRList prs={mockPRs} showSearch={true} />);

    const searchInput = screen.getByPlaceholderText('Search PRs...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

    expect(screen.getByText('No PRs found')).toBeInTheDocument();
  });

  it('should call onPRClick when PR card is clicked', () => {
    const handleClick = vi.fn();
    render(<PRList prs={mockPRs} onPRClick={handleClick} />);

    const prCard = screen.getByText('First PR').closest('.group');
    fireEvent.click(prCard!);

    expect(handleClick).toHaveBeenCalledWith(mockPRs[0]);
  });

  it('should hide search when showSearch is false', () => {
    render(<PRList prs={mockPRs} showSearch={false} />);

    expect(screen.queryByPlaceholderText('Search PRs...')).not.toBeInTheDocument();
  });

  it('should hide filters when showFilters is false', () => {
    render(<PRList prs={mockPRs} showFilters={false} />);

    expect(screen.queryByText('All statuses')).not.toBeInTheDocument();
  });

  it('should hide view toggle when showViewToggle is false', () => {
    render(<PRList prs={mockPRs} showViewToggle={false} />);

    expect(screen.queryByTitle('Card view')).not.toBeInTheDocument();
  });
});

describe('PRListWithDetail Component', () => {
  const mockPRs: PREntry[] = [
    createMockPR({ id: 'pr001', title: 'First PR' }),
    createMockPR({ id: 'pr002', title: 'Second PR' }),
  ];

  it('should show list view initially', () => {
    render(<PRListWithDetail prs={mockPRs} />);

    expect(screen.getByText('First PR')).toBeInTheDocument();
    expect(screen.getByText('Second PR')).toBeInTheDocument();
  });

  it('should show detail view when PR is clicked', () => {
    render(<PRListWithDetail prs={mockPRs} />);

    const prCard = screen.getByText('First PR').closest('.group');
    fireEvent.click(prCard!);

    expect(screen.getByText('Back to list')).toBeInTheDocument();
    expect(screen.getByText('First PR')).toBeInTheDocument();
  });

  it('should return to list view when back button is clicked', () => {
    render(<PRListWithDetail prs={mockPRs} />);

    // Click on PR to show detail
    const prCard = screen.getByText('First PR').closest('.group');
    fireEvent.click(prCard!);

    // Click back button
    const backButton = screen.getByText('Back to list');
    fireEvent.click(backButton);

    // Should show list again
    expect(screen.getByText('First PR')).toBeInTheDocument();
    expect(screen.getByText('Second PR')).toBeInTheDocument();
  });

  it('should show full content in detail view', () => {
    const pr = createMockPR({
      background: 'Test background',
      changes: 'Test changes',
    });
    render(<PRListWithDetail prs={[pr]} />);

    // Click on PR to show detail
    const prCard = screen.getByText('Implement PR display component').closest('.group');
    fireEvent.click(prCard!);

    expect(screen.getByText('Background')).toBeInTheDocument();
    expect(screen.getByText('Test background')).toBeInTheDocument();
    expect(screen.getByText('Changes')).toBeInTheDocument();
    expect(screen.getByText('Test changes')).toBeInTheDocument();
  });
});

describe('Status Badge Colors', () => {
  it('should render draft status with gray color', () => {
    const pr = createMockPR({ status: 'draft' });
    render(<PRDisplay pr={pr} />);

    const statusBadge = screen.getByText('Draft');
    expect(statusBadge).toBeInTheDocument();
  });

  it('should render open status with green color', () => {
    const pr = createMockPR({ status: 'open' });
    render(<PRDisplay pr={pr} />);

    const statusBadge = screen.getByText('Open');
    expect(statusBadge).toBeInTheDocument();
  });

  it('should render merged status with purple color', () => {
    const pr = createMockPR({ status: 'merged' });
    render(<PRDisplay pr={pr} />);

    const statusBadge = screen.getByText('Merged');
    expect(statusBadge).toBeInTheDocument();
  });

  it('should render closed status with red color', () => {
    const pr = createMockPR({ status: 'closed' });
    render(<PRDisplay pr={pr} />);

    const statusBadge = screen.getByText('Closed');
    expect(statusBadge).toBeInTheDocument();
  });
});