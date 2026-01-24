/**
 * Search Service
 *
 * 使用 fd 和 rg 进行文件和内容搜索
 */

import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { ensureTool, getToolPath } from '../../utils/tools-manager.js';
import type { SearchOptions, SearchResult, ContentSearchResult } from '../../types/search.js';

/**
 * 执行命令并返回输出
 */
function execCommand(command: string, args: string[], cwd?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
      encoding: 'utf-8',
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => {
      stdout += data;
    });

    child.stderr?.on('data', (data) => {
      stderr += data;
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`Command failed with code ${code}: ${stderr}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * 文件名搜索（使用 fd）
 */
export async function searchFiles(
  query: string,
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  const fdPath = await ensureTool('fd', true);
  if (!fdPath) {
    throw new Error('fd is not available');
  }

  const {
    rootDir = process.cwd(),
    limit = 100,
    hidden = false,
    caseSensitive = false,
    extensions,
    excludeDirs = ['node_modules', '.git', 'dist', 'build'],
  } = options;

  const args: string[] = [
    '--color=never',
    '--max-results', String(limit),
  ];

  if (hidden) {
    args.push('--hidden');
  }

  if (!caseSensitive) {
    args.push('--ignore-case');
  }

  // 添加文件类型过滤
  if (extensions && extensions.length > 0) {
    args.push('--extension', extensions.join(','));
  }

  // 添加排除目录
  for (const dir of excludeDirs) {
    args.push('--exclude', dir);
  }

  // 添加查询
  args.push(query, rootDir);

  try {
    const output = await execCommand(fdPath, args);
    const lines = output.trim().split('\n').filter(line => line);

    return lines.map((path) => {
      const relativePath = path.replace(rootDir + '/', '');
      const name = path.split('/').pop() || path;

      return {
        path: relativePath,
        name,
        type: 'file',
        score: calculateScore(query, name),
      };
    });
  } catch (error) {
    console.error('File search error:', error);
    return [];
  }
}

/**
 * 内容搜索（使用 ripgrep）
 */
export async function searchContent(
  query: string,
  options: SearchOptions = {}
): Promise<ContentSearchResult[]> {
  const rgPath = await ensureTool('rg', true);
  if (!rgPath) {
    throw new Error('ripgrep (rg) is not available');
  }

  const {
    rootDir = process.cwd(),
    limit = 50,
    hidden = false,
    caseSensitive = false,
    context = 2,
    extensions,
    excludeDirs = ['node_modules', '.git', 'dist', 'build'],
  } = options;

  const args: string[] = [
    '--json',
    '--line-number',
    '--color=never',
    '--max-count', String(limit),
  ];

  if (hidden) {
    args.push('--hidden');
  }

  if (!caseSensitive) {
    args.push('--ignore-case');
  }

  if (context && context > 0) {
    args.push('--context', String(context));
  }

  // 添加文件类型过滤
  if (extensions && extensions.length > 0) {
    for (const ext of extensions) {
      args.push('--glob', `*${ext}`);
    }
  }

  // 添加排除目录
  for (const dir of excludeDirs) {
    args.push('--glob', `!${dir}/**`);
  }

  // 添加查询
  args.push(query, rootDir);

  try {
    const output = await execCommand(rgPath, args);
    const lines = output.trim().split('\n').filter(line => line);

    return parseRipgrepOutput(lines);
  } catch (error) {
    console.error('Content search error:', error);
    return [];
  }
}

/**
 * 解析 ripgrep JSON 输出
 */
function parseRipgrepOutput(lines: string[]): ContentSearchResult[] {
  const results: Map<string, ContentSearchResult> = new Map();

  for (const line of lines) {
    try {
      const data = JSON.parse(line);

      if (data.type === 'begin') {
        const path = data.data.path.text;
        results.set(path, {
          path,
          name: path.split('/').pop() || path,
          matches: [],
        });
      } else if (data.type === 'match') {
        const path = data.data.path.text;
        const result = results.get(path);
        if (result) {
          result.matches.push({
            lineNumber: data.data.line_number,
            line: data.data.lines.text,
            submatches: data.data.submatches.map((sm: any) => ({
              match: sm.match.text,
              start: sm.start,
              end: sm.end,
            })),
          });
        }
      }
    } catch {
      // 忽略解析错误
    }
  }

  return Array.from(results.values());
}

/**
 * 计算搜索得分（简单的模糊匹配）
 */
function calculateScore(query: string, text: string): number {
  const lowerQuery = query.toLowerCase();
  const lowerText = text.toLowerCase();

  // 完全匹配
  if (lowerText === lowerQuery) {
    return 1.0;
  }

  // 前缀匹配
  if (lowerText.startsWith(lowerQuery)) {
    return 0.8;
  }

  // 包含匹配
  if (lowerText.includes(lowerQuery)) {
    return 0.6;
  }

  // 字符序列匹配
  let queryIndex = 0;
  for (const char of lowerText) {
    if (char === lowerQuery[queryIndex]) {
      queryIndex++;
    }
    if (queryIndex === lowerQuery.length) {
      return 0.4;
    }
  }

  return 0.2;
}

/**
 * 混合搜索（文件名 + 内容）
 */
export async function search(
  query: string,
  options: SearchOptions = {}
): Promise<{ fileResults: SearchResult[]; contentResults: ContentSearchResult[] }> {
  // 并行执行文件名和内容搜索
  const [fileResults, contentResults] = await Promise.all([
    searchFiles(query, options),
    searchContent(query, options),
  ]);

  return {
    fileResults,
    contentResults,
  };
}

/**
 * 检查搜索工具是否可用
 */
export function isSearchAvailable(): { fd: boolean; rg: boolean } {
  return {
    fd: getToolPath('fd') !== null,
    rg: getToolPath('rg') !== null,
  };
}