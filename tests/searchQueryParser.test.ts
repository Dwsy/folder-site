/**
 * Search Query Parser Tests
 *
 * 测试逻辑查询解析器的各种场景
 */

import { describe, it, expect } from 'bun:test';
import {
  parseSearchQuery,
  evaluateQuery,
  extractTerms,
  queryNodeToString,
  type QueryNode,
} from '../src/utils/searchQueryParser';

describe('parseSearchQuery', () => {
  describe('基本搜索', () => {
    it('应该解析简单的搜索词', () => {
      const result = parseSearchQuery('markdown');
      expect(result.isLogicalQuery).toBe(false);
      expect(result.ast).toEqual({ type: 'term', value: 'markdown' });
      expect(result.terms).toEqual(['markdown']);
    });

    it('应该解析精确匹配（引号）', () => {
      const result = parseSearchQuery('"exact match"');
      expect(result.isLogicalQuery).toBe(false);
      expect(result.ast).toEqual({
        type: 'term',
        value: 'exact match',
        exact: true,
      });
    });

    it('应该处理空查询', () => {
      const result = parseSearchQuery('');
      expect(result.ast).toBeNull();
      expect(result.isLogicalQuery).toBe(false);
      expect(result.terms).toEqual([]);
    });
  });

  describe('AND 运算', () => {
    it('应该解析 AND 运算', () => {
      const result = parseSearchQuery('react AND test');
      expect(result.isLogicalQuery).toBe(true);
      expect(result.ast).toEqual({
        type: 'and',
        left: { type: 'term', value: 'react' },
        right: { type: 'term', value: 'test' },
      });
      expect(result.terms).toEqual(['react', 'test']);
    });

    it('应该支持多个 AND', () => {
      const result = parseSearchQuery('a AND b AND c');
      expect(result.isLogicalQuery).toBe(true);
      expect(result.terms).toEqual(['a', 'b', 'c']);
    });

    it('应该支持小写 and', () => {
      const result = parseSearchQuery('react and test');
      expect(result.isLogicalQuery).toBe(true);
      expect(result.ast?.type).toBe('and');
    });
  });

  describe('OR 运算', () => {
    it('应该解析 OR 运算', () => {
      const result = parseSearchQuery('vue OR react');
      expect(result.isLogicalQuery).toBe(true);
      expect(result.ast).toEqual({
        type: 'or',
        left: { type: 'term', value: 'vue' },
        right: { type: 'term', value: 'react' },
      });
      expect(result.terms).toEqual(['vue', 'react']);
    });

    it('应该支持多个 OR', () => {
      const result = parseSearchQuery('a OR b OR c');
      expect(result.isLogicalQuery).toBe(true);
      expect(result.terms).toEqual(['a', 'b', 'c']);
    });
  });

  describe('NOT 运算', () => {
    it('应该解析 NOT 运算', () => {
      const result = parseSearchQuery('code AND NOT test');
      expect(result.isLogicalQuery).toBe(true);
      expect(result.ast).toEqual({
        type: 'and',
        left: { type: 'term', value: 'code' },
        right: { type: 'not', operand: { type: 'term', value: 'test' } },
      });
    });

    it('应该支持单独的 NOT', () => {
      const result = parseSearchQuery('NOT test');
      expect(result.isLogicalQuery).toBe(true);
      expect(result.ast).toEqual({
        type: 'not',
        operand: { type: 'term', value: 'test' },
      });
    });
  });

  describe('括号分组', () => {
    it('应该解析括号分组', () => {
      const result = parseSearchQuery('(react OR vue) AND tutorial');
      expect(result.isLogicalQuery).toBe(true);
      expect(result.ast).toEqual({
        type: 'and',
        left: {
          type: 'or',
          left: { type: 'term', value: 'react' },
          right: { type: 'term', value: 'vue' },
        },
        right: { type: 'term', value: 'tutorial' },
      });
    });

    it('应该支持嵌套括号', () => {
      const result = parseSearchQuery('((a OR b) AND c)');
      expect(result.isLogicalQuery).toBe(true);
      expect(result.terms).toEqual(['a', 'b', 'c']);
    });
  });

  describe('复杂查询', () => {
    it('应该解析复杂的逻辑表达式', () => {
      const result = parseSearchQuery('markdown AND (guide OR tutorial) AND NOT draft');
      expect(result.isLogicalQuery).toBe(true);
      expect(result.terms).toEqual(['markdown', 'guide', 'tutorial', 'draft']);
    });

    it('应该处理精确匹配和逻辑运算的组合', () => {
      const result = parseSearchQuery('"exact term" AND fuzzy');
      expect(result.isLogicalQuery).toBe(true);
      const ast = result.ast as any;
      expect(ast.left.exact).toBe(true);
      expect(ast.right.exact).toBeUndefined();
    });
  });

  describe('错误处理', () => {
    it('应该降级处理无效的逻辑表达式', () => {
      const result = parseSearchQuery('AND OR NOT');
      expect(result.isLogicalQuery).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('应该降级处理不匹配的括号', () => {
      const result = parseSearchQuery('(react AND');
      expect(result.isLogicalQuery).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});

describe('evaluateQuery', () => {
  // 模拟文件对象
  const mockFile = {
    name: 'react-tutorial.md',
    path: '/docs/react-tutorial.md',
    content: 'This is a React tutorial for beginners',
  };

  // 简单的模糊匹配函数
  const fuzzyMatcher = (term: string, item: any, exact?: boolean): boolean => {
    const searchText = `${item.name} ${item.path} ${item.content}`.toLowerCase();
    const termLower = term.toLowerCase();

    if (exact) {
      return searchText.includes(termLower);
    }

    // 简单的模糊匹配：检查是否包含所有字符（按顺序）
    let pos = 0;
    for (const char of termLower) {
      pos = searchText.indexOf(char, pos);
      if (pos === -1) return false;
      pos++;
    }
    return true;
  };

  it('应该评估简单的 term', () => {
    const node: QueryNode = { type: 'term', value: 'react' };
    expect(evaluateQuery(node, mockFile, fuzzyMatcher)).toBe(true);
  });

  it('应该评估 AND 运算', () => {
    const node: QueryNode = {
      type: 'and',
      left: { type: 'term', value: 'react' },
      right: { type: 'term', value: 'tutorial' },
    };
    expect(evaluateQuery(node, mockFile, fuzzyMatcher)).toBe(true);
  });

  it('应该评估 OR 运算', () => {
    const node: QueryNode = {
      type: 'or',
      left: { type: 'term', value: 'vue' },
      right: { type: 'term', value: 'react' },
    };
    expect(evaluateQuery(node, mockFile, fuzzyMatcher)).toBe(true);
  });

  it('应该评估 NOT 运算', () => {
    const node: QueryNode = {
      type: 'not',
      operand: { type: 'term', value: 'angular' },
    };
    expect(evaluateQuery(node, mockFile, fuzzyMatcher)).toBe(true);
  });

  it('应该评估复杂表达式', () => {
    const node: QueryNode = {
      type: 'and',
      left: {
        type: 'or',
        left: { type: 'term', value: 'react' },
        right: { type: 'term', value: 'vue' },
      },
      right: {
        type: 'not',
        operand: { type: 'term', value: 'angular' },
      },
    };
    expect(evaluateQuery(node, mockFile, fuzzyMatcher)).toBe(true);
  });
});

describe('extractTerms', () => {
  it('应该提取简单 term', () => {
    const node: QueryNode = { type: 'term', value: 'react' };
    expect(extractTerms(node)).toEqual(['react']);
  });

  it('应该提取 AND 表达式中的所有 terms', () => {
    const node: QueryNode = {
      type: 'and',
      left: { type: 'term', value: 'react' },
      right: { type: 'term', value: 'test' },
    };
    expect(extractTerms(node)).toEqual(['react', 'test']);
  });

  it('应该提取复杂表达式中的所有 terms', () => {
    const node: QueryNode = {
      type: 'and',
      left: {
        type: 'or',
        left: { type: 'term', value: 'a' },
        right: { type: 'term', value: 'b' },
      },
      right: {
        type: 'not',
        operand: { type: 'term', value: 'c' },
      },
    };
    expect(extractTerms(node)).toEqual(['a', 'b', 'c']);
  });
});

describe('queryNodeToString', () => {
  it('应该转换简单 term', () => {
    const node: QueryNode = { type: 'term', value: 'react' };
    expect(queryNodeToString(node)).toBe('react');
  });

  it('应该转换精确匹配 term', () => {
    const node: QueryNode = { type: 'term', value: 'exact match', exact: true };
    expect(queryNodeToString(node)).toBe('"exact match"');
  });

  it('应该转换 AND 表达式', () => {
    const node: QueryNode = {
      type: 'and',
      left: { type: 'term', value: 'react' },
      right: { type: 'term', value: 'test' },
    };
    expect(queryNodeToString(node)).toBe('(react AND test)');
  });

  it('应该转换复杂表达式', () => {
    const node: QueryNode = {
      type: 'and',
      left: {
        type: 'or',
        left: { type: 'term', value: 'react' },
        right: { type: 'term', value: 'vue' },
      },
      right: {
        type: 'not',
        operand: { type: 'term', value: 'test' },
      },
    };
    expect(queryNodeToString(node)).toBe('((react OR vue) AND NOT test)');
  });
});
