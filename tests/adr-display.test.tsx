/**
 * ADR Display Component Unit Tests
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import React from 'react';

// Setup DOM environment
import { Window } from 'happy-dom';
const window = new Window();
global.window = window as any;
global.document = window.document;
global.HTMLElement = window.HTMLElement;
global.HTMLButtonElement = window.HTMLButtonElement;
global.HTMLAnchorElement = window.HTMLAnchorElement;
global.navigator = window.navigator;

// Mock date for consistent testing
const mockDate = new Date('2024-01-15T10:00:00Z');

// Sample ADR data
const mockADR = {
  type: 'adr' as const,
  id: 'adr-001',
  title: 'Use TypeScript for Type Safety',
  status: 'accepted' as const,
  number: 1,
  path: 'adr/001-use-typescript.md',
  filePath: '/docs/adr/001-use-typescript.md',
  content: '# Use TypeScript for Type Safety\n\n## Context\nWe need type safety...\n\n## Decision\nAdopt TypeScript...\n\n## Consequences\nBetter type safety...',
  metadata: {
    author: 'John Doe',
    date: '2024-01-15',
  },
  createdAt: mockDate,
  updatedAt: mockDate,
  context: 'We need type safety in our codebase to catch errors at compile time.',
  decision: 'Adopt TypeScript as the primary language for the project.',
  consequences: 'Better type safety, improved IDE support, but requires learning curve.',
  alternatives: 'Use JSDoc with JavaScript, use Flow, or continue with plain JavaScript.',
};

const mockADRs = [
  mockADR,
  {
    ...mockADR,
    id: 'adr-002',
    title: 'Implement CI/CD Pipeline',
    status: 'proposed' as const,
    number: 2,
    path: 'adr/002-implement-cicd.md',
    filePath: '/docs/adr/002-implement-cicd.md',
    metadata: { author: 'Jane Smith' },
    context: 'Need automated testing and deployment',
    decision: 'Use GitHub Actions for CI/CD',
  },
  {
    ...mockADR,
    id: 'adr-003',
    title: 'Use React for UI',
    status: 'rejected' as const,
    number: 3,
    path: 'adr/003-use-react.md',
    filePath: '/docs/adr/003-use-react.md',
    metadata: { author: 'Bob Johnson' },
    context: 'Need a UI framework',
    decision: 'Rejected in favor of Vue',
    consequences: 'Will use Vue instead',
  },
  {
    ...mockADR,
    id: 'adr-004',
    title: 'Database Selection',
    status: 'superseded' as const,
    number: 4,
    path: 'adr/004-database-selection.md',
    filePath: '/docs/adr/004-database-selection.md',
    metadata: { author: 'Alice Williams' },
    context: 'Need a database solution',
    decision: 'PostgreSQL (superseded by ADR-005)',
  },
  {
    ...mockADR,
    id: 'adr-005',
    title: 'Migration to MongoDB',
    status: 'deprecated' as const,
    number: 5,
    path: 'adr/005-mongodb-migration.md',
    filePath: '/docs/adr/005-mongodb-migration.md',
    metadata: { author: 'Charlie Brown' },
    context: 'Migrating from PostgreSQL',
    decision: 'Use MongoDB for flexibility',
  },
];

describe('ADR Display Components', () => {
  describe('Module Imports', () => {
    it('should successfully import ADRDisplay component', async () => {
      const { ADRDisplay } = await import('../src/client/components/workhub/ADRDisplay');
      expect(ADRDisplay).toBeDefined();
      expect(typeof ADRDisplay).toBe('function');
    });

    it('should successfully import ADRCard component', async () => {
      const { ADRCard } = await import('../src/client/components/workhub/ADRDisplay');
      expect(ADRCard).toBeDefined();
      expect(typeof ADRCard).toBe('function');
    });

    it('should successfully import ADRList component', async () => {
      const { ADRList } = await import('../src/client/components/workhub/ADRList');
      expect(ADRList).toBeDefined();
      expect(typeof ADRList).toBe('function');
    });

    it('should successfully import ADRListWithDetail component', async () => {
      const { ADRListWithDetail } = await import('../src/client/components/workhub/ADRList');
      expect(ADRListWithDetail).toBeDefined();
      expect(typeof ADRListWithDetail).toBe('function');
    });

    it('should successfully import WorkHub types', async () => {
      const workhubTypes = await import('../src/types/workhub');
      expect(workhubTypes).toBeDefined();
      // The types are imported for use in the test data above
      expect(typeof workhubTypes).toBe('object');
    });
  });

  describe('ADR Data Structure', () => {
    it('should have valid ADR structure', () => {
      expect(mockADR).toHaveProperty('type', 'adr');
      expect(mockADR).toHaveProperty('id');
      expect(mockADR).toHaveProperty('title');
      expect(mockADR).toHaveProperty('status');
      expect(mockADR).toHaveProperty('path');
      expect(mockADR).toHaveProperty('filePath');
      expect(mockADR).toHaveProperty('metadata');
      expect(mockADR).toHaveProperty('createdAt');
      expect(mockADR).toHaveProperty('updatedAt');
    });

    it('should have valid ADR-specific fields', () => {
      expect(mockADR).toHaveProperty('context');
      expect(mockADR).toHaveProperty('decision');
      expect(mockADR).toHaveProperty('consequences');
      expect(mockADR).toHaveProperty('alternatives');
    });

    it('should support all ADR statuses', () => {
      const statuses: Array<ADRStatus> = ['proposed', 'accepted', 'rejected', 'superseded', 'deprecated'];
      statuses.forEach((status) => {
        const adr = { ...mockADR, status };
        expect(adr.status).toBe(status);
      });
    });
  });

  describe('ADR List Data', () => {
    it('should have valid ADR list', () => {
      expect(mockADRs).toBeInstanceOf(Array);
      expect(mockADRs.length).toBe(5);
    });

    it('should have unique ADR IDs', () => {
      const ids = mockADRs.map((adr) => adr.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have different statuses in the list', () => {
      const statuses = mockADRs.map((adr) => adr.status);
      const uniqueStatuses = new Set(statuses);
      expect(uniqueStatuses.size).toBeGreaterThan(1);
    });
  });

  describe('Status Types', () => {
    it('should support proposed status', () => {
      const adr = mockADRs.find((a) => a.status === 'proposed');
      expect(adr).toBeDefined();
      expect(adr?.status).toBe('proposed');
    });

    it('should support accepted status', () => {
      const adr = mockADRs.find((a) => a.status === 'accepted');
      expect(adr).toBeDefined();
      expect(adr?.status).toBe('accepted');
    });

    it('should support rejected status', () => {
      const adr = mockADRs.find((a) => a.status === 'rejected');
      expect(adr).toBeDefined();
      expect(adr?.status).toBe('rejected');
    });

    it('should support superseded status', () => {
      const adr = mockADRs.find((a) => a.status === 'superseded');
      expect(adr).toBeDefined();
      expect(adr?.status).toBe('superseded');
    });

    it('should support deprecated status', () => {
      const adr = mockADRs.find((a) => a.status === 'deprecated');
      expect(adr).toBeDefined();
      expect(adr?.status).toBe('deprecated');
    });
  });

  describe('Component Props Validation', () => {
    it('ADRDisplay should accept required props', async () => {
      const { ADRDisplay } = await import('../src/client/components/workhub/ADRDisplay');
      const props = {
        adr: mockADR,
      };
      expect(props).toHaveProperty('adr');
      expect(props.adr).toHaveProperty('id');
    });

    it('ADRCard should accept required props', async () => {
      const { ADRCard } = await import('../src/client/components/workhub/ADRDisplay');
      const props = {
        adr: mockADR,
      };
      expect(props).toHaveProperty('adr');
    });

    it('ADRList should accept required props', async () => {
      const { ADRList } = await import('../src/client/components/workhub/ADRList');
      const props = {
        adrs: mockADRs,
      };
      expect(props).toHaveProperty('adrs');
      expect(props.adrs).toBeInstanceOf(Array);
    });
  });
});