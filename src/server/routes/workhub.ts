/**
 * WorkHub API Routes
 *
 * Provides endpoints for accessing ADR, Issue, and PR data from the docs/ directory
 */

import { Hono } from 'hono';
import { parseWorkHub, type WorkHubResult } from '../lib/workhub-parser.js';
import type { ApiResponse } from '../../types/api.js';

const workhub = new Hono();

/**
 * Get all WorkHub data (ADRs, Issues, PRs)
 */
workhub.get('/', async (c) => {
  try {
    const docsDir = process.env.DOCS_DIR || './docs';
    const result = await parseWorkHub(docsDir, {
      includeADRs: true,
      includeIssues: true,
      includePRs: true,
      parseContent: true,
      extractMetadata: true,
    });

    return c.json<ApiResponse<WorkHubResult>>({
      success: true,
      data: result,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error parsing WorkHub data:', error);
    return c.json<ApiResponse<never>>(
      {
        success: false,
        error: 'Failed to parse WorkHub data',
        timestamp: Date.now(),
      },
      500
    );
  }
});

/**
 * Get all ADRs
 */
workhub.get('/adrs', async (c) => {
  try {
    const docsDir = process.env.DOCS_DIR || './docs';
    const { adrs, stats, errors } = await parseWorkHub(docsDir, {
      includeADRs: true,
      includeIssues: false,
      includePRs: true,
      parseContent: true,
      extractMetadata: true,
    });

    return c.json<ApiResponse<{ adrs: typeof adrs; stats: Pick<typeof stats, 'totalADRs' | 'parseTime'> }>>({
      success: true,
      data: {
        adrs,
        stats: {
          totalADRs: stats.totalADRs,
          parseTime: stats.parseTime,
        },
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error parsing ADRs:', error);
    return c.json<ApiResponse<never>>(
      {
        success: false,
        error: 'Failed to parse ADRs',
        timestamp: Date.now(),
      },
      500
    );
  }
});

/**
 * Get a specific ADR by ID
 */
workhub.get('/adrs/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const docsDir = process.env.DOCS_DIR || './docs';
    const { adrs } = await parseWorkHub(docsDir, {
      includeADRs: true,
      includeIssues: false,
      includePRs: false,
      parseContent: true,
      extractMetadata: true,
    });

    const adr = adrs.find((a) => a.id === id || a.path === `adr/${id}`);

    if (!adr) {
      return c.json<ApiResponse<never>>(
        {
          success: false,
          error: 'ADR not found',
          timestamp: Date.now(),
        },
        404
      );
    }

    return c.json<ApiResponse<typeof adr>>({
      success: true,
      data: adr,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error fetching ADR:', error);
    return c.json<ApiResponse<never>>(
      {
        success: false,
        error: 'Failed to fetch ADR',
        timestamp: Date.now(),
      },
      500
    );
  }
});

/**
 * Get all Issues
 */
workhub.get('/issues', async (c) => {
  try {
    const docsDir = process.env.DOCS_DIR || './docs';
    const { issues, stats } = await parseWorkHub(docsDir, {
      includeADRs: false,
      includeIssues: true,
      includePRs: false,
      parseContent: true,
      extractMetadata: true,
    });

    return c.json<ApiResponse<{ issues: typeof issues; stats: Pick<typeof stats, 'totalIssues' | 'parseTime'> }>>({
      success: true,
      data: {
        issues,
        stats: {
          totalIssues: stats.totalIssues,
          parseTime: stats.parseTime,
        },
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error parsing Issues:', error);
    return c.json<ApiResponse<never>>(
      {
        success: false,
        error: 'Failed to parse Issues',
        timestamp: Date.now(),
      },
      500
    );
  }
});

/**
 * Get a specific Issue by ID
 */
workhub.get('/issues/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const docsDir = process.env.DOCS_DIR || './docs';
    const { issues } = await parseWorkHub(docsDir, {
      includeADRs: false,
      includeIssues: true,
      includePRs: false,
      parseContent: true,
      extractMetadata: true,
    });

    const issue = issues.find((i) => i.id === id || i.path === `issues/${id}`);

    if (!issue) {
      return c.json<ApiResponse<never>>(
        {
          success: false,
          error: 'Issue not found',
          timestamp: Date.now(),
        },
        404
      );
    }

    return c.json<ApiResponse<typeof issue>>({
      success: true,
      data: issue,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error fetching Issue:', error);
    return c.json<ApiResponse<never>>(
      {
        success: false,
        error: 'Failed to fetch Issue',
        timestamp: Date.now(),
      },
      500
    );
  }
});

/**
 * Get all PRs
 */
workhub.get('/prs', async (c) => {
  try {
    const docsDir = process.env.DOCS_DIR || './docs';
    const { prs, stats } = await parseWorkHub(docsDir, {
      includeADRs: false,
      includeIssues: false,
      includePRs: true,
      parseContent: true,
      extractMetadata: true,
    });

    return c.json<ApiResponse<{ prs: typeof prs; stats: Pick<typeof stats, 'totalPRs' | 'parseTime'> }>>({
      success: true,
      data: {
        prs,
        stats: {
          totalPRs: stats.parseTime,
          parseTime: stats.parseTime,
        },
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error parsing PRs:', error);
    return c.json<ApiResponse<never>>(
      {
        success: false,
        error: 'Failed to parse PRs',
        timestamp: Date.now(),
      },
      500
    );
  }
});

/**
 * Get a specific PR by ID
 */
workhub.get('/prs/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const docsDir = process.env.DOCS_DIR || './docs';
    const { prs } = await parseWorkHub(docsDir, {
      includeADRs: false,
      includeIssues: false,
      includePRs: true,
      parseContent: true,
      extractMetadata: true,
    });

    const pr = prs.find((p) => p.id === id || p.path === `pr/${id}`);

    if (!pr) {
      return c.json<ApiResponse<never>>(
        {
          success: false,
          error: 'PR not found',
          timestamp: Date.now(),
        },
        404
      );
    }

    return c.json<ApiResponse<typeof pr>>({
      success: true,
      data: pr,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error fetching PR:', error);
    return c.json<ApiResponse<never>>(
      {
        success: false,
        error: 'Failed to fetch PR',
        timestamp: Date.now(),
      },
      500
    );
  }
});

export default workhub;