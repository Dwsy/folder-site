/**
 * 文件扫描服务
 *
 * 提供递归目录扫描、文件扩展名过滤和文件元数据生成功能
 */

import { readdir, stat } from 'node:fs/promises';
import { join, relative, normalize } from 'node:path';

// 支持的文件扩展名
const SUPPORTED_EXTENSIONS = ['.md', '.mmd', '.txt', '.json', '.yml', '.yaml'];

// 默认排除的目录
const DEFAULT_EXCLUDE_DIRS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  '.next',
  '.nuxt',
  'target',
  '__pycache__',
  'venv',
  'env',
  '.env',
];

/**
 * 文件扫描选项
 */
export interface ScanOptions {
  /** 扫描根目录（绝对路径） */
  rootDir: string;
  /** 包含的文件扩展名 */
  extensions?: string[];
  /** 排除的目录名称 */
  excludeDirs?: string[];
  /** 最大递归深度（0 表示不限制） */
  maxDepth?: number;
  /** 是否包含隐藏文件 */
  includeHidden?: boolean;
  /** 是否包含点文件 */
  includeDotFiles?: boolean;
  /** 是否跟随符号链接 */
  followSymlinks?: boolean;
  /** 扫描策略：'depth'（深度优先）或 'breadth'（广度优先） */
  strategy?: 'depth' | 'breadth';
}

/**
 * 文件扫描结果
 */
export interface ScanResult {
  /** 扫描根目录 */
  rootPath: string;
  /** 扫描的文件列表 */
  files: FileInfo[];
  /** 扫描的目录列表 */
  directories: FileInfo[];
  /** 扫描的总统计 */
  stats: ScanStats;
  /** 扫描耗时（毫秒） */
  duration: number;
}

/**
 * 文件信息
 */
export interface FileInfo {
  /** 文件名 */
  name: string;
  /** 绝对路径 */
  path: string;
  /** 相对路径（相对于扫描根目录） */
  relativePath: string;
  /** 文件扩展名 */
  extension: string;
  /** 文件大小（字节） */
  size: number;
  /** 修改时间 */
  modifiedAt: Date;
  /** 创建时间 */
  createdAt: Date;
  /** 是否为目录 */
  isDirectory: boolean;
  /** 是否为文件 */
  isFile: boolean;
  /** 是否为符号链接 */
  isSymbolicLink: boolean;
}

/**
 * 扫描统计信息
 */
export interface ScanStats {
  /** 扫描的文件总数 */
  totalFiles: number;
  /** 扫描的目录总数 */
  totalDirectories: number;
  /** 匹配的文件数（符合扩展名过滤） */
  matchedFiles: number;
  /** 跳过的文件数（不符合扩展名过滤） */
  skippedFiles: number;
  /** 错误数量 */
  errors: number;
  /** 总文件大小（字节） */
  totalSize: number;
}

/**
 * 文件扫描服务类
 */
export class FileScanner {
  private options: Required<ScanOptions>;
  private errors: Error[] = [];

  constructor(options: ScanOptions) {
    this.options = {
      rootDir: normalize(options.rootDir),
      extensions: options.extensions || SUPPORTED_EXTENSIONS,
      excludeDirs: options.excludeDirs || DEFAULT_EXCLUDE_DIRS,
      maxDepth: options.maxDepth ?? 0,
      includeHidden: options.includeHidden ?? false,
      includeDotFiles: options.includeDotFiles ?? false,
      followSymlinks: options.followSymlinks ?? false,
      strategy: options.strategy || 'depth',
    };
  }

  /**
   * 执行扫描
   */
  async scan(): Promise<ScanResult> {
    const startTime = Date.now();
    const files: FileInfo[] = [];
    const directories: FileInfo[] = [];
    this.errors = [];

    // 验证根目录
    try {
      const rootStats = await stat(this.options.rootDir);
      if (!rootStats.isDirectory()) {
        throw new Error(`Path is not a directory: ${this.options.rootDir}`);
      }
    } catch (error) {
      throw new Error(`Failed to access root directory ${this.options.rootDir}: ${error}`);
    }

    try {
      if (this.options.strategy === 'depth') {
        await this.scanDepthFirst(this.options.rootDir, 0, files, directories);
      } else {
        await this.scanBreadthFirst(files, directories);
      }
    } catch (error) {
      this.errors.push(error as Error);
    }

    const duration = Date.now() - startTime;
    const matchedFiles = files.filter((f) => !f.isDirectory).length;

    const stats: ScanStats = {
      totalFiles: files.filter((f) => !f.isDirectory).length,
      totalDirectories: directories.length,
      matchedFiles,
      skippedFiles: files.length - matchedFiles,
      errors: this.errors.length,
      totalSize: files.reduce((sum, f) => sum + f.size, 0),
    };

    return {
      rootPath: this.options.rootDir,
      files,
      directories,
      stats,
      duration,
    };
  }

  /**
   * 深度优先扫描
   */
  private async scanDepthFirst(
    dirPath: string,
    currentDepth: number,
    files: FileInfo[],
    directories: FileInfo[]
  ): Promise<void> {
    // 检查最大深度
    if (this.options.maxDepth > 0 && currentDepth > this.options.maxDepth) {
      return;
    }

    try {
      const entries = await readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dirPath, entry.name);

        // 跳过隐藏文件（如果不包含）
        if (!this.options.includeHidden && entry.name.startsWith('.')) {
          continue;
        }

        // 跳过排除的目录
        if (entry.isDirectory() && this.options.excludeDirs.includes(entry.name)) {
          continue;
        }

        try {
          const stats = await stat(fullPath);
          const fileInfo = this.createFileInfo(fullPath, stats, entry);

          if (entry.isDirectory()) {
            directories.push(fileInfo);
            // 递归扫描子目录
            await this.scanDepthFirst(fullPath, currentDepth + 1, files, directories);
          } else if (entry.isFile()) {
            // 检查文件扩展名
            if (this.matchesExtension(entry.name)) {
              files.push(fileInfo);
            }
          } else if (entry.isSymbolicLink()) {
            if (!this.options.followSymlinks) {
              continue;
            }
            // 跟随符号链接（需要额外处理）
            const targetStats = await stat(fullPath);
            if (targetStats.isDirectory()) {
              directories.push({ ...fileInfo, isDirectory: true });
              await this.scanDepthFirst(fullPath, currentDepth + 1, files, directories);
            } else if (targetStats.isFile()) {
              if (this.matchesExtension(entry.name)) {
                files.push(fileInfo);
              }
            }
          }
        } catch (error) {
          this.errors.push(new Error(`Failed to stat ${fullPath}: ${error}`));
          continue;
        }
      }
    } catch (error) {
      this.errors.push(new Error(`Failed to read directory ${dirPath}: ${error}`));
    }
  }

  /**
   * 广度优先扫描
   */
  private async scanBreadthFirst(
    files: FileInfo[],
    directories: FileInfo[]
  ): Promise<void> {
    const queue: Array<{ path: string; depth: number }> = [
      { path: this.options.rootDir, depth: 0 },
    ];

    while (queue.length > 0) {
      const { path: dirPath, depth } = queue.shift()!;

      // 检查最大深度
      if (this.options.maxDepth > 0 && depth > this.options.maxDepth) {
        continue;
      }

      try {
        const entries = await readdir(dirPath, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = join(dirPath, entry.name);

          // 跳过隐藏文件（如果不包含）
          if (!this.options.includeHidden && entry.name.startsWith('.')) {
            continue;
          }

          // 跳过排除的目录
          if (entry.isDirectory() && this.options.excludeDirs.includes(entry.name)) {
            continue;
          }

          try {
            const stats = await stat(fullPath);
            const fileInfo = this.createFileInfo(fullPath, stats, entry);

            if (entry.isDirectory()) {
              directories.push(fileInfo);
              queue.push({ path: fullPath, depth: depth + 1 });
            } else if (entry.isFile()) {
              if (this.matchesExtension(entry.name)) {
                files.push(fileInfo);
              }
            } else if (entry.isSymbolicLink()) {
              if (!this.options.followSymlinks) {
                continue;
              }
              const targetStats = await stat(fullPath);
              if (targetStats.isDirectory()) {
                directories.push({ ...fileInfo, isDirectory: true });
                queue.push({ path: fullPath, depth: depth + 1 });
              } else if (targetStats.isFile()) {
                if (this.matchesExtension(entry.name)) {
                  files.push(fileInfo);
                }
              }
            }
          } catch (error) {
            this.errors.push(new Error(`Failed to stat ${fullPath}: ${error}`));
            continue;
          }
        }
      } catch (error) {
        this.errors.push(new Error(`Failed to read directory ${dirPath}: ${error}`));
      }
    }
  }

  /**
   * 创建文件信息对象
   */
  private createFileInfo(
    fullPath: string,
    stats: {
      size: number;
      mtime: Date;
      ctime: Date;
      isDirectory: () => boolean;
      isFile: () => boolean;
      isSymbolicLink: () => boolean;
    },
    entry: { name: string; isDirectory: () => boolean; isFile: () => boolean; isSymbolicLink: () => boolean }
  ): FileInfo {
    const normalizedPath = normalize(fullPath);
    const relativePath = relative(this.options.rootDir, normalizedPath);
    const extension = this.getExtension(entry.name);

    return {
      name: entry.name,
      path: normalizedPath,
      relativePath,
      extension,
      size: stats.size,
      modifiedAt: stats.mtime,
      createdAt: stats.ctime,
      isDirectory: entry.isDirectory(),
      isFile: entry.isFile(),
      isSymbolicLink: entry.isSymbolicLink(),
    };
  }

  /**
   * 检查文件扩展名是否匹配
   */
  private matchesExtension(filename: string): boolean {
    const ext = this.getExtension(filename);
    return this.options.extensions.includes(ext);
  }

  /**
   * 获取文件扩展名（包含点号）
   */
  private getExtension(filename: string): string {
    const ext = filename.split('.').pop();
    return ext ? `.${ext}` : '';
  }

  /**
   * 获取扫描过程中遇到的错误
   */
  getErrors(): Error[] {
    return [...this.errors];
  }
}

/**
 * 便捷函数：扫描目录
 */
export async function scanDirectory(options: ScanOptions): Promise<ScanResult> {
  const scanner = new FileScanner(options);
  return scanner.scan();
}

/**
 * 便捷函数：扫描目录并只返回文件列表
 */
export async function scanFiles(options: ScanOptions): Promise<FileInfo[]> {
  const result = await scanDirectory(options);
  return result.files.filter((f) => !f.isDirectory);
}

/**
 * 便捷函数：使用默认配置扫描目录
 */
export async function scanDirectoryDefault(rootDir: string): Promise<ScanResult> {
  return scanDirectory({
    rootDir,
    extensions: SUPPORTED_EXTENSIONS,
    excludeDirs: DEFAULT_EXCLUDE_DIRS,
  });
}