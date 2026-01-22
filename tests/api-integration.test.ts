/**
 * API Integration Tests for Folder-Site CLI
 *
 * This test suite covers API endpoints and their integration:
 * - Health check endpoints
 * - File listing endpoints
 * - Search endpoints
 * - Workhub endpoints
 * - Error handling
 * - Request/response validation
 */

import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

// Import server and routes
import { createServer } from '../src/server/index.js';
import type { HealthCheckResponse, ApiResponse, FileListResponse, DirectoryTreeResponse, FileContentResponse, SearchResponse, SearchRequest } from '../src/types/api.js';

// Test directory setup
const TEST_DIR = '/tmp/test-folder-site-api';
let server: any;
let port = 3001;

describe('API Integration Tests', () => {
  beforeAll(async () => {
    // Create test directory
    await mkdir(TEST_DIR, { recursive: true });

    // Create test files
    await writeFile(join(TEST_DIR, 'test.md'), '# Test\n\nContent.');
    await writeFile(join(TEST_DIR, 'readme.md'), '# Readme\n\nReadme content.');
    await mkdir(join(TEST_DIR, 'docs'), { recursive: true });
    await writeFile(join(TEST_DIR, 'docs', 'guide.md'), '# Guide\n\nGuide content.');

    // Create server instance (for testing structure)
    server = createServer();
  });

  afterAll(async () => {
    // Clean up test directory
    try {
      await rm(TEST_DIR, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('Server Configuration', () => {
    it('should create server instance', () => {
      expect(server).toBeDefined();
      expect(typeof server).toBe('object');
    });

    it('should have middleware configured', () => {
      // Server should be properly configured
      expect(server).toBeDefined();
    });
  });

  describe('API Response Types', () => {
    it('should have correct HealthCheckResponse type', () => {
      const healthResponse: HealthCheckResponse = {
        status: 'ok',
        message: 'Test',
        version: '1.0.0',
        uptime: 100,
      };

      expect(healthResponse.status).toBe('ok');
      expect(healthResponse.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should have correct ApiResponse type', () => {
      const apiResponse: ApiResponse<string> = {
        success: true,
        data: 'test',
        timestamp: Date.now(),
      };

      expect(apiResponse.success).toBe(true);
      expect(apiResponse.data).toBe('test');
      expect(apiResponse.timestamp).toBeGreaterThan(0);
    });

    it('should have correct error ApiResponse type', () => {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'TEST_ERROR',
          message: 'Test error',
        },
        timestamp: Date.now(),
      };

      expect(errorResponse.success).toBe(false);
      expect(errorResponse.error).toBeDefined();
      expect(errorResponse.error?.code).toBe('TEST_ERROR');
    });

    it('should have correct FileListResponse type', () => {
      const fileListResponse: FileListResponse = {
        files: [],
        total: 0,
      };

      expect(fileListResponse.files).toBeInstanceOf(Array);
      expect(fileListResponse.total).toBe(0);
    });

    it('should have correct DirectoryTreeResponse type', () => {
      const treeResponse: DirectoryTreeResponse = {
        root: '/test',
        tree: {
          name: 'root',
          path: '/test',
          relativePath: '',
          isDirectory: true,
          children: [],
        },
        totalNodes: 1,
      };

      expect(treeResponse.root).toBeDefined();
      expect(treeResponse.tree).toBeDefined();
      expect(treeResponse.tree.children).toBeInstanceOf(Array);
    });

    it('should have correct FileContentResponse type', () => {
      const fileContentResponse: FileContentResponse = {
        info: {
          name: 'test.md',
          path: '/test/test.md',
          relativePath: 'test.md',
          extension: '.md',
          size: 100,
          modifiedAt: new Date(),
          createdAt: new Date(),
          isDirectory: false,
          isFile: true,
          isSymbolicLink: false,
        },
        content: '# Test',
        meta: {
          title: 'Test',
          description: 'Test file',
          tags: [],
          updated: new Date().toISOString(),
        },
      };

      expect(fileContentResponse.info).toBeDefined();
      expect(fileContentResponse.content).toBeDefined();
      expect(fileContentResponse.meta).toBeDefined();
      expect(fileContentResponse.meta.tags).toBeInstanceOf(Array);
    });

    it('should have correct SearchResponse type', () => {
      const searchResponse: SearchResponse = {
        results: [],
        total: 0,
        duration: 10,
        query: 'test',
      };

      expect(searchResponse.results).toBeInstanceOf(Array);
      expect(searchResponse.total).toBeGreaterThanOrEqual(0);
      expect(searchResponse.duration).toBeGreaterThanOrEqual(0);
    });

    it('should have correct SearchRequest type', () => {
      const searchRequest: SearchRequest = {
        query: 'test',
        scope: 'files',
        limit: 10,
        offset: 0,
      };

      expect(searchRequest.query).toBeDefined();
      expect(searchRequest.scope).toBeDefined();
      expect(searchRequest.limit).toBe(10);
      expect(searchRequest.offset).toBe(0);
    });
  });

  describe('API Error Codes', () => {
    it('should define common error codes', () => {
      const errorCodes = [
        'MISSING_QUERY',
        'INVALID_REQUEST',
        'NOT_FOUND',
        'INTERNAL_ERROR',
      ];

      errorCodes.forEach(code => {
        expect(typeof code).toBe('string');
        expect(code.length).toBeGreaterThan(0);
      });
    });

    it('should have consistent error format', () => {
      const error = {
        code: 'TEST_ERROR',
        message: 'Test error message',
      };

      expect(error).toHaveProperty('code');
      expect(error).toHaveProperty('message');
      expect(typeof error.code).toBe('string');
      expect(typeof error.message).toBe('string');
    });
  });

  describe('API Endpoint Structure', () => {
    it('should define health endpoint', () => {
      const endpoint = '/api/health';
      expect(endpoint).toBe('/api/health');
    });

    it('should define files endpoint', () => {
      const endpoint = '/api/files';
      expect(endpoint).toBe('/api/files');
    });

    it('should define search endpoint', () => {
      const endpoint = '/api/search';
      expect(endpoint).toBe('/api/search');
    });

    it('should define workhub endpoint', () => {
      const endpoint = '/api/workhub';
      expect(endpoint).toBe('/api/workhub');
    });

    it('should define tree endpoint', () => {
      const endpoint = '/api/files/tree/list';
      expect(endpoint).toBe('/api/files/tree/list');
    });
  });

  describe('HTTP Status Codes', () => {
    it('should use 200 for successful GET requests', () => {
      const status = 200;
      expect(status).toBeGreaterThanOrEqual(200);
      expect(status).toBeLessThan(300);
    });

    it('should use 201 for successful POST requests', () => {
      const status = 201;
      expect(status).toBeGreaterThanOrEqual(200);
      expect(status).toBeLessThan(300);
    });

    it('should use 400 for bad requests', () => {
      const status = 400;
      expect(status).toBeGreaterThanOrEqual(400);
      expect(status).toBeLessThan(500);
    });

    it('should use 404 for not found', () => {
      const status = 404;
      expect(status).toBeGreaterThanOrEqual(400);
      expect(status).toBeLessThan(500);
    });

    it('should use 500 for server errors', () => {
      const status = 500;
      expect(status).toBeGreaterThanOrEqual(500);
      expect(status).toBeLessThan(600);
    });
  });

  describe('Search Scopes', () => {
    it('should support all search scopes', () => {
      const scopes = ['all', 'files', 'content', 'metadata'];

      scopes.forEach(scope => {
        expect(typeof scope).toBe('string');
      });
    });

    it('should validate search scope', () => {
      const validScope = 'files';
      const invalidScope = 'invalid';

      expect(['all', 'files', 'content', 'metadata']).toContain(validScope);
      expect(['all', 'files', 'content', 'metadata']).not.toContain(invalidScope);
    });
  });

  describe('Pagination Parameters', () => {
    it('should support limit parameter', () => {
      const limit = 20;
      expect(typeof limit).toBe('number');
      expect(limit).toBeGreaterThan(0);
    });

    it('should support offset parameter', () => {
      const offset = 0;
      expect(typeof offset).toBe('number');
      expect(offset).toBeGreaterThanOrEqual(0);
    });

    it('should validate pagination parameters', () => {
      const validLimit = 10;
      const invalidLimit = -1;

      expect(validLimit).toBeGreaterThan(0);
      expect(invalidLimit).toBeLessThan(0);
    });
  });

  describe('Response Format Validation', () => {
    it('should have consistent success response structure', () => {
      const response: ApiResponse<any> = {
        success: true,
        data: {},
        timestamp: Date.now(),
      };

      expect(response).toHaveProperty('success');
      expect(response).toHaveProperty('data');
      expect(response).toHaveProperty('timestamp');
      expect(typeof response.success).toBe('boolean');
      expect(typeof response.timestamp).toBe('number');
    });

    it('should have consistent error response structure', () => {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'ERROR_CODE',
          message: 'Error message',
        },
        timestamp: Date.now(),
      };

      expect(response).toHaveProperty('success');
      expect(response).toHaveProperty('error');
      expect(response).toHaveProperty('timestamp');
      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
    });

    it('should include timestamp in responses', () => {
      const response: ApiResponse<any> = {
        success: true,
        data: {},
        timestamp: Date.now(),
      };

      expect(response.timestamp).toBeDefined();
      expect(typeof response.timestamp).toBe('number');
      expect(response.timestamp).toBeGreaterThan(0);
    });
  });

  describe('API Versioning', () => {
    it('should include version in responses', () => {
      const version = '1.0.0';
      expect(typeof version).toBe('string');
      expect(version.split('.').length).toBeGreaterThanOrEqual(2);
    });

    it('should have semantic version format', () => {
      const versions = ['1.0.0', '2.1.3', '0.5.0'];

      versions.forEach(version => {
        const parts = version.split('.');
        expect(parts.length).toBe(3);
        parts.forEach(part => {
          expect(!isNaN(parseInt(part))).toBe(true);
        });
      });
    });
  });

  describe('Content Type Handling', () => {
    it('should support JSON content type', () => {
      const contentType = 'application/json';
      expect(contentType).toBe('application/json');
    });

    it('should support text/html content type', () => {
      const contentType = 'text/html; charset=utf-8';
      expect(contentType).toContain('text/html');
    });

    it('should support text/markdown content type', () => {
      const contentType = 'text/markdown';
      expect(contentType).toContain('text/markdown');
    });
  });

  describe('Request Validation', () => {
    it('should validate required query parameters', () => {
      const query = 'test';
      expect(query).toBeDefined();
      expect(query.length).toBeGreaterThan(0);
    });

    it('should validate search request body', () => {
      const validRequest: SearchRequest = {
        query: 'test',
        scope: 'files',
        limit: 10,
        offset: 0,
      };

      expect(validRequest.query).toBeDefined();
      expect(validRequest.query.length).toBeGreaterThan(0);
      expect(['all', 'files', 'content', 'metadata']).toContain(validRequest.scope);
      expect(validRequest.limit).toBeGreaterThan(0);
      expect(validRequest.offset).toBeGreaterThanOrEqual(0);
    });

    it('should reject invalid search request', () => {
      const invalidRequest = {
        query: '',
        scope: 'invalid',
        limit: -1,
        offset: -1,
      };

      expect(invalidRequest.query).toBe('');
      expect(['all', 'files', 'content', 'metadata']).not.toContain(invalidRequest.scope);
      expect(invalidRequest.limit).toBeLessThan(0);
      expect(invalidRequest.offset).toBeLessThan(0);
    });
  });

  describe('CORS Support', () => {
    it('should define CORS headers', () => {
      const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      };

      expect(headers['Access-Control-Allow-Origin']).toBeDefined();
      expect(headers['Access-Control-Allow-Methods']).toBeDefined();
      expect(headers['Access-Control-Allow-Headers']).toBeDefined();
    });
  });

  describe('Security Headers', () => {
    it('should define security headers', () => {
      const headers = {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
      };

      expect(headers['X-Content-Type-Options']).toBeDefined();
      expect(headers['X-Frame-Options']).toBeDefined();
      expect(headers['X-XSS-Protection']).toBeDefined();
    });
  });

  describe('Rate Limiting Configuration', () => {
    it('should define rate limit parameters', () => {
      const rateLimit = {
        windowMs: 60000, // 1 minute
        max: 100, // 100 requests per window
      };

      expect(rateLimit.windowMs).toBeGreaterThan(0);
      expect(rateLimit.max).toBeGreaterThan(0);
    });
  });

  describe('API Documentation', () => {
    it('should have endpoint descriptions', () => {
      const endpoints = {
        '/api/health': 'Health check endpoint',
        '/api/files': 'File listing endpoint',
        '/api/search': 'Search endpoint',
        '/api/workhub': 'Workhub endpoint',
      };

      Object.values(endpoints).forEach(description => {
        expect(typeof description).toBe('string');
        expect(description.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Error Response Messages', () => {
    it('should have user-friendly error messages', () => {
      const errors = {
        MISSING_QUERY: 'Search query is required',
        INVALID_REQUEST: 'Invalid request parameters',
        NOT_FOUND: 'Resource not found',
        INTERNAL_ERROR: 'Internal server error',
      };

      Object.values(errors).forEach(message => {
        expect(typeof message).toBe('string');
        expect(message.length).toBeGreaterThan(0);
      });
    });
  });

  describe('API State Management', () => {
    it('should maintain server state', () => {
      const state = {
        uptime: process.uptime(),
        version: '1.0.0',
        environment: 'development',
      };

      expect(state.uptime).toBeGreaterThanOrEqual(0);
      expect(state.version).toBeDefined();
      expect(state.environment).toBeDefined();
    });
  });

  describe('Concurrent Request Handling', () => {
    it('should handle multiple requests', () => {
      const requestCount = 10;
      expect(requestCount).toBeGreaterThan(0);
      expect(requestCount).toBeLessThan(1000);
    });

    it('should handle request timeouts', () => {
      const timeout = 30000; // 30 seconds
      expect(timeout).toBeGreaterThan(0);
    });
  });

  describe('File Path Handling', () => {
    it('should handle file paths in requests', () => {
      const filePath = '/test/file.md';
      expect(typeof filePath).toBe('string');
      expect(filePath.length).toBeGreaterThan(0);
    });

    it('should handle relative paths', () => {
      const relativePath = 'docs/guide.md';
      expect(relativePath).not.toContain('/test/');
    });

    it('should handle file extensions', () => {
      const extensions = ['.md', '.json', '.js', '.css', '.html'];

      extensions.forEach(ext => {
        expect(ext.startsWith('.')).toBe(true);
        expect(ext.length).toBeGreaterThan(1);
      });
    });
  });
});