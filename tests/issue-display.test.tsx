/**
 * Issue Display Component Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { IssueDisplay, IssueCard } from '../src/client/components/workhub/IssueDisplay';
import { IssueList, IssueListWithDetail } from '../src/client/components/workhub/IssueList';
import type { IssueEntry } from '../src/types/workhub';

// Mock react-icons
vi.mock('react-icons/fi', () => ({
  FiAlertCircle: () => <span data-testid="alert-icon">AlertIcon</span>,
  FiCalendar: () => <span data-testid="calendar-icon">CalendarIcon</span>,
  FiUser: () => <span data-testid="user-icon">UserIcon</span>,
  FiClock: () => <span data-testid="clock-icon">ClockIcon</span>,
  FiChevronDown: () => <span data-testid="chevron-down">ChevronDown</span>,
  FiChevronUp: () => <span data-testid="chevron-up">ChevronUp</span>,
  FiSearch: () => <span data-testid="search-icon">SearchIcon</span>,
  FiFilter: () => <span data-testid="filter-icon">FilterIcon</span>,
  FiGrid: () => <span data-testid="grid-icon">GridIcon</span>,
  FiList: () => <span data-testid="list-icon">ListIcon</span>,
  FiCheck: () => <span data-testid="check-icon">CheckIcon</span>,
  FiChevronRight: () => <span data-testid="chevron-right">ChevronRight</span>,
  FiLink: () => <span data-testid="link-icon">LinkIcon</span>,
  FiCopy: () => <span data-testid="copy-icon">CopyIcon</span>,
}));

// Mock clipboard API
const mockClipboard = {
  writeText: vi.fn().mockResolvedValue(undefined),
};
Object.assign(navigator, { clipboard: mockClipboard });

describe('IssueDisplay Component', () => {
  const mockIssue: IssueEntry = {
    type: 'issue',
    id: 'issue-001',
    title: 'Implement Issue Display Component',
    status: 'in_progress',
    priority: 'p1',
    category: 'Feature',
    path: 'docs/issues/issue-001.md',
    filePath: '/absolute/path/to/docs/issues/issue-001.md',
    content: 'Issue content',
    metadata: {
      author: 'John Doe',
      labels: ['frontend', 'workhub'],
    },
    createdAt: new Date('2026-01-22'),
    updatedAt: new Date('2026-01-23'),
    goal: 'Create Issue display component',
    background: 'Need to display issues in the docs page',
    acceptanceCriteria: [
      { checked: true, text: 'Create IssueDisplay component' },
      { checked: false, text: 'Create IssueList component' },
    ],
    assignee: 'Jane Smith',
    estimatedHours: 4,
  };

  describe('IssueDisplay', () => {
    it('should render issue metadata correctly', () => {
      render(<IssueDisplay issue={mockIssue} />);

      expect(screen.getByText('Implement Issue Display Component')).toBeInTheDocument();
      expect(screen.getByText('issue-001')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('4h')).toBeInTheDocument();
    });

    it('should render status badge with correct color', () => {
      render(<IssueDisplay issue={mockIssue} />);

      const statusBadge = screen.getByText('In Progress');
      expect(statusBadge).toBeInTheDocument();
      expect(statusBadge).toHaveClass('text-blue-700');
    });

    it('should render priority badge with correct color', () => {
      render(<IssueDisplay issue={mockIssue} />);

      const priorityBadge = screen.getByText('P1');
      expect(priorityBadge).toBeInTheDocument();
      expect(priorityBadge).toHaveClass('text-orange-700');
    });

    it('should render category when provided', () => {
      render(<IssueDisplay issue={mockIssue} />);

      expect(screen.getByText('Feature')).toBeInTheDocument();
    });

    it('should render dates correctly', () => {
      render(<IssueDisplay issue={mockIssue} />);

      expect(screen.getByText(/Jan 22, 2026/)).toBeInTheDocument();
      expect(screen.getByText(/Jan 23, 2026/)).toBeInTheDocument();
    });

    it('should render acceptance criteria', () => {
      render(<IssueDisplay issue={mockIssue} showFullContent={true} />);

      expect(screen.getByText('Create IssueDisplay component')).toBeInTheDocument();
      expect(screen.getByText('Create IssueList component')).toBeInTheDocument();
    });

    it('should handle missing optional fields', () => {
      const minimalIssue: IssueEntry = {
        ...mockIssue,
        assignee: undefined,
        estimatedHours: undefined,
        category: undefined,
        acceptanceCriteria: undefined,
      };

      render(<IssueDisplay issue={minimalIssue} />);

      expect(screen.getByText('Implement Issue Display Component')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
      expect(screen.queryByText('4h')).not.toBeInTheDocument();
    });

    it('should render goal section when provided', () => {
      render(<IssueDisplay issue={mockIssue} showFullContent={true} />);

      expect(screen.getByText('Goal')).toBeInTheDocument();
      expect(screen.getByText('Create Issue display component')).toBeInTheDocument();
    });

    it('should render background section when provided', () => {
      render(<IssueDisplay issue={mockIssue} showFullContent={true} />);

      expect(screen.getByText('Background')).toBeInTheDocument();
      expect(screen.getByText('Need to display issues in the docs page')).toBeInTheDocument();
    });

    it('should render labels when provided', () => {
      render(<IssueDisplay issue={mockIssue} />);

      expect(screen.getByText('frontend')).toBeInTheDocument();
      expect(screen.getByText('workhub')).toBeInTheDocument();
    });

    it('should copy link to clipboard', async () => {
      render(<IssueDisplay issue={mockIssue} />);

      const copyButton = screen.getByTestId('copy-icon').closest('button');
      fireEvent.click(copyButton!);

      await waitFor(() => {
        expect(mockClipboard.writeText).toHaveBeenCalledWith(
          expect.stringContaining('/docs/issues/issue-001.md')
        );
      });
    });
  });

  describe('IssueCard', () => {
    it('should render card in compact view', () => {
      const handleClick = vi.fn();
      render(<IssueCard issue={mockIssue} onClick={handleClick} />);

      expect(screen.getByText('Implement Issue Display Component')).toBeInTheDocument();
      expect(screen.getByText('issue-001')).toBeInTheDocument();
      expect(screen.getByText('In Progress')).toBeInTheDocument();
      expect(screen.getByText('P1')).toBeInTheDocument();
    });

    it('should call onClick when clicked', () => {
      const handleClick = vi.fn();
      render(<IssueCard issue={mockIssue} onClick={handleClick} />);

      const card = screen.getByText('Implement Issue Display Component').closest('div');
      fireEvent.click(card!);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should render assignee in card', () => {
      render(<IssueCard issue={mockIssue} />);

      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    it('should render priority in card', () => {
      render(<IssueCard issue={mockIssue} />);

      expect(screen.getByText('P1')).toBeInTheDocument();
    });
  });

  describe('Status badges', () => {
    it('should render todo status', () => {
      const issue = { ...mockIssue, status: 'todo' as const };
      render(<IssueDisplay issue={issue} />);

      const statusBadge = screen.getByText('Todo');
      expect(statusBadge).toBeInTheDocument();
    });

    it('should render done status', () => {
      const issue = { ...mockIssue, status: 'done' as const };
      render(<IssueDisplay issue={issue} />);

      const statusBadge = screen.getByText('Done');
      expect(statusBadge).toBeInTheDocument();
    });

    it('should render blocked status', () => {
      const issue = { ...mockIssue, status: 'blocked' as const };
      render(<IssueDisplay issue={issue} />);

      const statusBadge = screen.getByText('Blocked');
      expect(statusBadge).toBeInTheDocument();
    });

    it('should render paused status', () => {
      const issue = { ...mockIssue, status: 'paused' as const };
      render(<IssueDisplay issue={issue} />);

      const statusBadge = screen.getByText('Paused');
      expect(statusBadge).toBeInTheDocument();
    });
  });

  describe('Priority badges', () => {
    it('should render P0 priority', () => {
      const issue = { ...mockIssue, priority: 'p0' as const };
      render(<IssueDisplay issue={issue} />);

      const priorityBadge = screen.getByText('P0');
      expect(priorityBadge).toBeInTheDocument();
    });

    it('should render P2 priority', () => {
      const issue = { ...mockIssue, priority: 'p2' as const };
      render(<IssueDisplay issue={issue} />);

      const priorityBadge = screen.getByText('P2');
      expect(priorityBadge).toBeInTheDocument();
    });

    it('should render P3 priority', () => {
      const issue = { ...mockIssue, priority: 'p3' as const };
      render(<IssueDisplay issue={issue} />);

      const priorityBadge = screen.getByText('P3');
      expect(priorityBadge).toBeInTheDocument();
    });
  });
});

describe('IssueList Component', () => {
  const mockIssues: IssueEntry[] = [
    {
      type: 'issue',
      id: 'issue-001',
      title: 'First Issue',
      status: 'todo',
      priority: 'p0',
      path: 'issues/001.md',
      filePath: '/path/001.md',
      metadata: {},
      createdAt: new Date('2026-01-20'),
      updatedAt: new Date('2026-01-20'),
    },
    {
      type: 'issue',
      id: 'issue-002',
      title: 'Second Issue',
      status: 'in_progress',
      priority: 'p1',
      path: 'issues/002.md',
      filePath: '/path/002.md',
      metadata: {},
      createdAt: new Date('2026-01-21'),
      updatedAt: new Date('2026-01-21'),
    },
    {
      type: 'issue',
      id: 'issue-003',
      title: 'Third Issue',
      status: 'done',
      priority: 'p2',
      path: 'issues/003.md',
      filePath: '/path/003.md',
      metadata: {},
      createdAt: new Date('2026-01-22'),
      updatedAt: new Date('2026-01-22'),
    },
  ];

  describe('IssueList', () => {
    it('should render list of issues', () => {
      render(<IssueList issues={mockIssues} />);

      expect(screen.getByText('First Issue')).toBeInTheDocument();
      expect(screen.getByText('Second Issue')).toBeInTheDocument();
      expect(screen.getByText('Third Issue')).toBeInTheDocument();
    });

    it('should show total count', () => {
      render(<IssueList issues={mockIssues} />);

      expect(screen.getByText('3 total Issues')).toBeInTheDocument();
    });

    it('should filter by search query', () => {
      render(<IssueList issues={mockIssues} />);

      const searchInput = screen.getByPlaceholderText('Search Issues...');
      fireEvent.change(searchInput, { target: { value: 'First' } });

      expect(screen.getByText('First Issue')).toBeInTheDocument();
      expect(screen.queryByText('Second Issue')).not.toBeInTheDocument();
      expect(screen.queryByText('Third Issue')).not.toBeInTheDocument();
    });

    it('should filter by status', () => {
      render(<IssueList issues={mockIssues} />);

      // Click status filter button
      const filterButton = screen.getByText('All statuses');
      fireEvent.click(filterButton);

      // Select 'todo' status
      const todoCheckbox = screen.getByLabelText(/todo/i);
      fireEvent.click(todoCheckbox);

      // Close dropdown
      fireEvent.click(document.body);

      expect(screen.getByText('First Issue')).toBeInTheDocument();
      expect(screen.queryByText('Second Issue')).not.toBeInTheDocument();
    });

    it('should sort by date', () => {
      render(<IssueList issues={mockIssues} />);

      const sortButton = screen.getByText('Newest first');
      fireEvent.click(sortButton);

      // Select oldest first
      const oldestOption = screen.getByText('Oldest first');
      fireEvent.click(oldestOption);

      const issues = screen.getAllByText(/Issue/);
      expect(issues[0]).toHaveTextContent('First Issue');
    });

    it('should show empty state when no issues match filter', () => {
      render(<IssueList issues={mockIssues} />);

      const searchInput = screen.getByPlaceholderText('Search Issues...');
      fireEvent.change(searchInput, { target: { value: 'NonExistent' } });

      expect(screen.getByText('No Issues found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your filters')).toBeInTheDocument();
    });

    it('should show empty state when no issues provided', () => {
      render(<IssueList issues={[]} />);

      expect(screen.getByText('No Issues found')).toBeInTheDocument();
      expect(screen.getByText('No Issues have been created yet')).toBeInTheDocument();
    });

    it('should toggle between card and list view', () => {
      render(<IssueList issues={mockIssues} />);

      const listButton = screen.getByTestId('list-icon').closest('button');
      fireEvent.click(listButton!);

      expect(screen.getByText('First Issue')).toBeInTheDocument();
    });

    it('should display status statistics', () => {
      render(<IssueList issues={mockIssues} />);

      // Check that status counts are displayed
      expect(screen.getByText(/todo: 1/i)).toBeInTheDocument();
      expect(screen.getByText(/in_progress: 1/i)).toBeInTheDocument();
      expect(screen.getByText(/done: 1/i)).toBeInTheDocument();
    });

    it('should call onIssueClick when issue card is clicked', () => {
      const handleClick = vi.fn();
      render(<IssueList issues={mockIssues} onIssueClick={handleClick} />);

      const firstIssue = screen.getByText('First Issue').closest('div');
      fireEvent.click(firstIssue!);

      expect(handleClick).toHaveBeenCalledWith(mockIssues[0]);
    });

    it('should hide search when showSearch is false', () => {
      render(<IssueList issues={mockIssues} showSearch={false} />);

      expect(screen.queryByPlaceholderText('Search Issues...')).not.toBeInTheDocument();
    });

    it('should hide filters when showFilters is false', () => {
      render(<IssueList issues={mockIssues} showFilters={false} />);

      expect(screen.queryByText('All statuses')).not.toBeInTheDocument();
    });

    it('should hide view toggle when showViewToggle is false', () => {
      render(<IssueList issues={mockIssues} showViewToggle={false} />);

      expect(screen.queryByTestId('grid-icon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('list-icon')).not.toBeInTheDocument();
    });
  });

  describe('IssueListWithDetail', () => {
    it('should show list initially', () => {
      render(<IssueListWithDetail issues={mockIssues} />);

      expect(screen.getByText('First Issue')).toBeInTheDocument();
      expect(screen.getByText('Second Issue')).toBeInTheDocument();
      expect(screen.getByText('Third Issue')).toBeInTheDocument();
    });

    it('should show detail view when issue is clicked', () => {
      render(<IssueListWithDetail issues={mockIssues} />);

      const firstIssue = screen.getByText('First Issue').closest('div');
      fireEvent.click(firstIssue!);

      expect(screen.getByText('First Issue')).toBeInTheDocument();
      expect(screen.getByText('← Back to list')).toBeInTheDocument();
    });

    it('should return to list when back button is clicked', () => {
      render(<IssueListWithDetail issues={mockIssues} />);

      // Click first issue
      const firstIssue = screen.getByText('First Issue').closest('div');
      fireEvent.click(firstIssue!);

      // Click back button
      const backButton = screen.getByText('← Back to list');
      fireEvent.click(backButton);

      expect(screen.getByText('First Issue')).toBeInTheDocument();
      expect(screen.getByText('Second Issue')).toBeInTheDocument();
    });

    it('should show full content in detail view', () => {
      render(<IssueListWithDetail issues={mockIssues} />);

      const firstIssue = screen.getByText('First Issue').closest('div');
      fireEvent.click(firstIssue!);

      expect(screen.getByText('← Back to list')).toBeInTheDocument();
    });
  });

  describe('Filtering behavior', () => {
    it('should apply multiple filters together', () => {
      render(<IssueList issues={mockIssues} />);

      // Search for "Issue"
      const searchInput = screen.getByPlaceholderText('Search Issues...');
      fireEvent.change(searchInput, { target: { value: 'Issue' } });

      // All issues should match
      expect(screen.getByText('3 total Issues (3 shown)')).toBeInTheDocument();
    });

    it('should clear filters when clear button is clicked', () => {
      render(<IssueList issues={mockIssues} />);

      // Open status filter
      const filterButton = screen.getByText('All statuses');
      fireEvent.click(filterButton);

      // Select a status
      const todoCheckbox = screen.getByLabelText(/todo/i);
      fireEvent.click(todoCheckbox);

      // Click clear all
      const clearButton = screen.getByText('Clear all filters');
      fireEvent.click(clearButton);

      // Should return to showing all issues
      expect(screen.getByText('3 total Issues (3 shown)')).toBeInTheDocument();
    });

    it('should update filtered count when filters change', () => {
      render(<IssueList issues={mockIssues} />);

      const searchInput = screen.getByPlaceholderText('Search Issues...');
      fireEvent.change(searchInput, { target: { value: 'First' } });

      expect(screen.getByText('3 total Issues (1 shown)')).toBeInTheDocument();
    });
  });

  describe('Sorting behavior', () => {
    it('should sort by priority', () => {
      const issues: IssueEntry[] = [
        {
          type: 'issue',
          id: 'issue-001',
          title: 'Low Priority',
          status: 'todo',
          priority: 'p3',
          path: 'issues/001.md',
          filePath: '/path/001.md',
          metadata: {},
          createdAt: new Date('2026-01-20'),
          updatedAt: new Date('2026-01-20'),
        },
        {
          type: 'issue',
          id: 'issue-002',
          title: 'High Priority',
          status: 'todo',
          priority: 'p0',
          path: 'issues/002.md',
          filePath: '/path/002.md',
          metadata: {},
          createdAt: new Date('2026-01-21'),
          updatedAt: new Date('2026-01-21'),
        },
      ];

      render(<IssueList issues={issues} />);

      // Sort by priority (highest first)
      const sortButton = screen.getByText('Newest first');
      fireEvent.click(sortButton);

      const highPriorityOption = screen.getByText(/highest priority/i);
      fireEvent.click(highPriorityOption);

      expect(screen.getByText('High Priority')).toBeInTheDocument();
    });

    it('should sort by title', () => {
      render(<IssueList issues={mockIssues} />);

      const sortButton = screen.getByText('Newest first');
      fireEvent.click(sortButton);

      const titleOption = screen.getByText('Title A-Z');
      fireEvent.click(titleOption);

      const issues = screen.getAllByText(/Issue/);
      expect(issues[0]).toHaveTextContent('First Issue');
    });
  });

  describe('Responsive design', () => {
    it('should render correctly on mobile', () => {
      // Mock mobile viewport
      global.innerWidth = 375;
      window.dispatchEvent(new Event('resize'));

      render(<IssueList issues={mockIssues} />);

      expect(screen.getByText('First Issue')).toBeInTheDocument();
    });

    it('should render correctly on desktop', () => {
      // Mock desktop viewport
      global.innerWidth = 1920;
      window.dispatchEvent(new Event('resize'));

      render(<IssueList issues={mockIssues} />);

      expect(screen.getByText('First Issue')).toBeInTheDocument();
    });
  });
});

describe('Accessibility', () => {
  const mockIssue: IssueEntry = {
    type: 'issue',
    id: 'issue-001',
    title: 'Test Issue',
    status: 'todo',
    priority: 'p1',
    path: 'issues/001.md',
    filePath: '/path/001.md',
    metadata: {},
    createdAt: new Date('2026-01-20'),
    updatedAt: new Date('2026-01-20'),
  };

  it('should have proper ARIA labels', () => {
    render(<IssueDisplay issue={mockIssue} />);

    const statusBadge = screen.getByText('Todo');
    expect(statusBadge).toBeInTheDocument();
  });

  it('should be keyboard navigable', () => {
    const handleClick = vi.fn();
    render(<IssueCard issue={mockIssue} onClick={handleClick} />);

    const card = screen.getByText('Test Issue').closest('div');
    card?.focus();

    fireEvent.keyDown(card!, { key: 'Enter', code: 'Enter' });
    expect(handleClick).toHaveBeenCalled();
  });
});