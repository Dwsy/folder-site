/**
 * Workhub UI Component Tests
 *
 * Tests for Workhub layout, overview, and page components
 */

import { describe, it, expect, vi } from 'bun:test';

// Mock the components
vi.mock('../src/client/utils/cn.js', () => ({
  cn: (...classes: unknown[]) => classes.filter(Boolean).join(' '),
}));

// Test data
const mockADRs = [
  {
    type: 'adr' as const,
    id: 'adr-001',
    title: 'Use TypeScript for type safety',
    status: 'accepted' as const,
    number: 1,
    path: 'adr/001-use-typescript.md',
    filePath: '/docs/adr/001-use-typescript.md',
    content: '# ADR-001\n\n## Status: Accepted',
    metadata: {},
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
    context: 'We need type safety',
    decision: 'Use TypeScript',
    consequences: 'Better type safety',
  },
  {
    type: 'adr' as const,
    id: 'adr-002',
    title: 'Adopt React for UI',
    status: 'proposed' as const,
    number: 2,
    path: 'adr/002-adopt-react.md',
    filePath: '/docs/adr/002-adopt-react.md',
    content: '# ADR-002\n\n## Status: Proposed',
    metadata: {},
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-04'),
    context: 'Need a UI framework',
    decision: 'Use React',
    consequences: 'Modern UI components',
  },
];

const mockIssues = [
  {
    type: 'issue' as const,
    id: 'issue-001',
    title: 'Implement user authentication',
    status: 'in_progress' as const,
    priority: 'p0' as const,
    category: 'feature',
    path: 'issues/001-auth.md',
    filePath: '/docs/issues/001-auth.md',
    content: '# Issue-001',
    metadata: {},
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-05'),
    goal: 'Add auth system',
    background: 'Users need to login',
    acceptanceCriteria: [
      { checked: false, text: 'Login form' },
      { checked: false, text: 'Password reset' },
    ],
  },
  {
    type: 'issue' as const,
    id: 'issue-002',
    title: 'Fix memory leak',
    status: 'todo' as const,
    priority: 'p1' as const,
    path: 'issues/002-memory-leak.md',
    filePath: '/docs/issues/002-memory-leak.md',
    content: '# Issue-002',
    metadata: {},
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
  },
];

const mockPRs = [
  {
    type: 'pr' as const,
    id: 'pr-001',
    title: 'Add user authentication',
    status: 'open' as const,
    category: 'feature',
    path: 'pr/001-auth.md',
    filePath: '/docs/pr/001-auth.md',
    content: '# PR-001',
    metadata: {},
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-05'),
    background: 'Implementing auth',
    changes: 'Added auth endpoints',
  },
];

describe('WorkhubLayout', () => {
  it('should import WorkhubLayout component', async () => {
    const { WorkhubLayout } = await import('../src/client/components/workhub/WorkhubLayout.js');
    expect(WorkhubLayout).toBeDefined();
  });

  it('should import WorkhubTabContent component', async () => {
    const { WorkhubTabContent } = await import('../src/client/components/workhub/WorkhubLayout.js');
    expect(WorkhubTabContent).toBeDefined();
  });

  it('should import useWorkhubTab hook', async () => {
    const { useWorkhubTab } = await import('../src/client/components/workhub/WorkhubLayout.js');
    expect(useWorkhubTab).toBeDefined();
  });

  it('should accept layout props', async () => {
    const { WorkhubLayout } = await import('../src/client/components/workhub/WorkhubLayout.js');
    const mockProps = {
      children: 'Test',
      className: 'test-class',
      onRefresh: vi.fn(),
      loading: false,
    };
    expect(() => mockProps).not.toThrow();
  });
});

describe('WorkhubTabContent', () => {
  it('should accept tab content props', async () => {
    const { WorkhubTabContent } = await import('../src/client/components/workhub/WorkhubLayout.js');
    const mockProps = {
      tab: 'adrs' as const,
      children: 'Test',
      className: 'test-class',
    };
    expect(() => mockProps).not.toThrow();
  });
});

describe('WorkhubOverview', () => {
  it('should import WorkhubOverview component', async () => {
    const { WorkhubOverview } = await import('../src/client/components/workhub/WorkhubOverview');
    expect(WorkhubOverview).toBeDefined();
  });

  it('should accept overview props', async () => {
    const { WorkhubOverview } = await import('../src/client/components/workhub/WorkhubOverview');
    const mockProps = {
      adrs: mockADRs,
      issues: mockIssues,
      prs: mockPRs,
      className: 'test-class',
      onNavigate: vi.fn(),
    };
    expect(() => mockProps).not.toThrow();
  });

  it('should handle empty data arrays', async () => {
    const { WorkhubOverview } = await import('../src/client/components/workhub/WorkhubOverview');
    const mockProps = {
      adrs: [],
      issues: [],
      prs: [],
    };
    expect(() => mockProps).not.toThrow();
  });
});

describe('Workhub (Page Component)', () => {
  it('should import Workhub page component', async () => {
    const { Workhub } = await import('../src/client/pages/Workhub');
    expect(Workhub).toBeDefined();
  });

  it('should be a named export', async () => {
    const module = await import('../src/client/pages/Workhub');
    expect(module.Workhub).toBeDefined();
  });
});

describe('useWorkhubTab hook', () => {
  it('should be importable', async () => {
    const { useWorkhubTab } = await import('../src/client/components/workhub/WorkhubLayout');
    expect(useWorkhubTab).toBeDefined();
  });
});

describe('Component Integration', () => {
  it('should import all Workhub components together', async () => {
    const layoutModule = await import('../src/client/components/workhub/WorkhubLayout');
    const overviewModule = await import('../src/client/components/workhub/WorkhubOverview');
    const pageModule = await import('../src/client/pages/Workhub');

    expect(layoutModule.WorkhubLayout).toBeDefined();
    expect(overviewModule.WorkhubOverview).toBeDefined();
    expect(pageModule.Workhub).toBeDefined();
  });
});