/**
 * Search Query Parser
 *
 * 解析搜索查询，支持逻辑运算符（AND、OR、NOT）和括号分组
 *
 * 语法示例：
 * - 基本搜索: "markdown"
 * - 精确匹配: "\"exact match\""
 * - AND 运算: "react AND test"
 * - OR 运算: "vue OR react"
 * - NOT 运算: "code NOT test"
 * - 括号分组: "(react OR vue) AND tutorial"
 * - 复杂查询: "markdown AND (guide OR tutorial) NOT draft"
 */

/**
 * 查询节点类型
 */
export type QueryNode =
  | { type: 'term'; value: string; exact?: boolean }
  | { type: 'and'; left: QueryNode; right: QueryNode }
  | { type: 'or'; left: QueryNode; right: QueryNode }
  | { type: 'not'; operand: QueryNode };

/**
 * 解析结果
 */
export interface ParseResult {
  /** 抽象语法树 */
  ast: QueryNode | null;
  /** 是否为逻辑查询 */
  isLogicalQuery: boolean;
  /** 提取的所有搜索词 */
  terms: string[];
  /** 解析错误信息 */
  error?: string;
}

/**
 * Token 类型
 */
enum TokenType {
  TERM = 'TERM',
  AND = 'AND',
  OR = 'OR',
  NOT = 'NOT',
  LPAREN = 'LPAREN',
  RPAREN = 'RPAREN',
  EOF = 'EOF',
}

/**
 * Token
 */
interface Token {
  type: TokenType;
  value: string;
  exact?: boolean;
}

/**
 * 词法分析器
 */
class Lexer {
  private input: string;
  private position: number = 0;
  private currentChar: string | null;

  constructor(input: string) {
    this.input = input.trim();
    this.currentChar = this.input.length > 0 ? this.input[0] : null;
  }

  /**
   * 前进一个字符
   */
  private advance(): void {
    this.position++;
    this.currentChar =
      this.position < this.input.length ? this.input[this.position] : null;
  }

  /**
   * 跳过空白字符
   */
  private skipWhitespace(): void {
    while (this.currentChar !== null && /\s/.test(this.currentChar)) {
      this.advance();
    }
  }

  /**
   * 读取引号内的精确匹配词
   */
  private readQuotedTerm(): string {
    let result = '';
    this.advance(); // 跳过开始的引号

    while (this.currentChar !== null && this.currentChar !== '"') {
      if (this.currentChar === '\\' && this.position + 1 < this.input.length) {
        // 处理转义字符
        this.advance();
        result += this.currentChar;
      } else {
        result += this.currentChar;
      }
      this.advance();
    }

    if (this.currentChar === '"') {
      this.advance(); // 跳过结束的引号
    }

    return result;
  }

  /**
   * 读取普通词
   */
  private readTerm(): string {
    let result = '';

    while (
      this.currentChar !== null &&
      !/[\s()"]/.test(this.currentChar)
    ) {
      result += this.currentChar;
      this.advance();
    }

    return result;
  }

  /**
   * 获取下一个 Token
   */
  public getNextToken(): Token {
    while (this.currentChar !== null) {
      // 跳过空白
      if (/\s/.test(this.currentChar)) {
        this.skipWhitespace();
        continue;
      }

      // 左括号
      if (this.currentChar === '(') {
        this.advance();
        return { type: TokenType.LPAREN, value: '(' };
      }

      // 右括号
      if (this.currentChar === ')') {
        this.advance();
        return { type: TokenType.RPAREN, value: ')' };
      }

      // 引号（精确匹配）
      if (this.currentChar === '"') {
        const term = this.readQuotedTerm();
        return { type: TokenType.TERM, value: term, exact: true };
      }

      // 普通词或运算符
      const term = this.readTerm();

      // 检查是否为运算符
      const upperTerm = term.toUpperCase();
      if (upperTerm === 'AND') {
        return { type: TokenType.AND, value: term };
      }
      if (upperTerm === 'OR') {
        return { type: TokenType.OR, value: term };
      }
      if (upperTerm === 'NOT') {
        return { type: TokenType.NOT, value: term };
      }

      // 普通搜索词
      return { type: TokenType.TERM, value: term };
    }

    return { type: TokenType.EOF, value: '' };
  }
}

/**
 * 语法分析器
 */
class Parser {
  private lexer: Lexer;
  private currentToken: Token;
  private terms: string[] = [];

  constructor(input: string) {
    this.lexer = new Lexer(input);
    this.currentToken = this.lexer.getNextToken();
  }

  /**
   * 消费当前 Token
   */
  private eat(tokenType: TokenType): void {
    if (this.currentToken.type === tokenType) {
      this.currentToken = this.lexer.getNextToken();
    } else {
      throw new Error(
        `Unexpected token: expected ${tokenType}, got ${this.currentToken.type}`
      );
    }
  }

  /**
   * 解析表达式
   * expression: orExpression
   */
  private expression(): QueryNode {
    return this.orExpression();
  }

  /**
   * 解析 OR 表达式
   * orExpression: andExpression (OR andExpression)*
   */
  private orExpression(): QueryNode {
    let node = this.andExpression();

    while (this.currentToken.type === TokenType.OR) {
      this.eat(TokenType.OR);
      const right = this.andExpression();
      node = { type: 'or', left: node, right };
    }

    return node;
  }

  /**
   * 解析 AND 表达式
   * andExpression: notExpression (AND notExpression)*
   */
  private andExpression(): QueryNode {
    let node = this.notExpression();

    while (this.currentToken.type === TokenType.AND) {
      this.eat(TokenType.AND);
      const right = this.notExpression();
      node = { type: 'and', left: node, right };
    }

    return node;
  }

  /**
   * 解析 NOT 表达式
   * notExpression: NOT? primaryExpression
   */
  private notExpression(): QueryNode {
    if (this.currentToken.type === TokenType.NOT) {
      this.eat(TokenType.NOT);
      const operand = this.primaryExpression();
      return { type: 'not', operand };
    }

    return this.primaryExpression();
  }

  /**
   * 解析基本表达式
   * primaryExpression: TERM | LPAREN expression RPAREN
   */
  private primaryExpression(): QueryNode {
    const token = this.currentToken;

    if (token.type === TokenType.TERM) {
      this.eat(TokenType.TERM);
      this.terms.push(token.value);
      return {
        type: 'term',
        value: token.value,
        exact: token.exact,
      };
    }

    if (token.type === TokenType.LPAREN) {
      this.eat(TokenType.LPAREN);
      const node = this.expression();
      this.eat(TokenType.RPAREN);
      return node;
    }

    throw new Error(`Unexpected token: ${token.type}`);
  }

  /**
   * 解析查询
   */
  public parse(): { ast: QueryNode; terms: string[] } {
    const token = this.currentToken;
    if (token.type === TokenType.EOF) {
      throw new Error('Empty query');
    }

    const ast = this.expression();

    const endToken = this.currentToken;
    if (endToken.type !== TokenType.EOF) {
      throw new Error('Unexpected tokens after expression');
    }

    return { ast, terms: this.terms };
  }
}

/**
 * 解析搜索查询
 *
 * @param query - 搜索查询字符串
 * @returns 解析结果
 */
export function parseSearchQuery(query: string): ParseResult {
  if (!query || !query.trim()) {
    return {
      ast: null,
      isLogicalQuery: false,
      terms: [],
    };
  }

  const trimmedQuery = query.trim();

  // 检查是否包含逻辑运算符
  const hasLogicalOperators = /\b(AND|OR|NOT)\b/i.test(trimmedQuery);

  // 如果没有逻辑运算符，检查是否为精确匹配
  if (!hasLogicalOperators) {
    // 检查是否为引号包裹的精确匹配
    if (trimmedQuery.startsWith('"') && trimmedQuery.endsWith('"')) {
      const exactValue = trimmedQuery.slice(1, -1);
      return {
        ast: { type: 'term', value: exactValue, exact: true },
        isLogicalQuery: false,
        terms: [exactValue],
      };
    }

    return {
      ast: { type: 'term', value: trimmedQuery },
      isLogicalQuery: false,
      terms: [trimmedQuery],
    };
  }

  // 尝试解析逻辑查询
  try {
    const parser = new Parser(trimmedQuery);
    const { ast, terms } = parser.parse();

    return {
      ast,
      isLogicalQuery: true,
      terms,
    };
  } catch (error) {
    // 解析失败，降级为普通搜索
    return {
      ast: { type: 'term', value: trimmedQuery },
      isLogicalQuery: false,
      terms: [trimmedQuery],
      error: error instanceof Error ? error.message : 'Parse error',
    };
  }
}

/**
 * 评估查询节点
 *
 * @param node - 查询节点
 * @param item - 要匹配的项目
 * @param fuzzyMatcher - 模糊匹配函数 (term: string, item: any) => boolean
 * @returns 是否匹配
 */
export function evaluateQuery(
  node: QueryNode,
  item: any,
  fuzzyMatcher: (term: string, item: any, exact?: boolean) => boolean
): boolean {
  switch (node.type) {
    case 'term':
      return fuzzyMatcher(node.value, item, node.exact);

    case 'and':
      return (
        evaluateQuery(node.left, item, fuzzyMatcher) &&
        evaluateQuery(node.right, item, fuzzyMatcher)
      );

    case 'or':
      return (
        evaluateQuery(node.left, item, fuzzyMatcher) ||
        evaluateQuery(node.right, item, fuzzyMatcher)
      );

    case 'not':
      return !evaluateQuery(node.operand, item, fuzzyMatcher);

    default:
      return false;
  }
}

/**
 * 提取查询中的所有搜索词
 *
 * @param node - 查询节点
 * @returns 搜索词数组
 */
export function extractTerms(node: QueryNode): string[] {
  const terms: string[] = [];

  function traverse(n: QueryNode): void {
    switch (n.type) {
      case 'term':
        terms.push(n.value);
        break;
      case 'and':
      case 'or':
        traverse(n.left);
        traverse(n.right);
        break;
      case 'not':
        traverse(n.operand);
        break;
    }
  }

  traverse(node);
  return terms;
}

/**
 * 将查询节点转换为可读字符串（用于调试）
 *
 * @param node - 查询节点
 * @returns 字符串表示
 */
export function queryNodeToString(node: QueryNode): string {
  switch (node.type) {
    case 'term':
      return node.exact ? `"${node.value}"` : node.value;
    case 'and':
      return `(${queryNodeToString(node.left)} AND ${queryNodeToString(node.right)})`;
    case 'or':
      return `(${queryNodeToString(node.left)} OR ${queryNodeToString(node.right)})`;
    case 'not':
      return `NOT ${queryNodeToString(node.operand)}`;
  }
}
