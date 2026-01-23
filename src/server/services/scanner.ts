/**
 * 文件扫描服务
 *
 * 使用 fast-glob 进行高性能文件扫描，支持 .gitignore 规则
 */

import fg from 'fast-glob';
import { stat } from 'node:fs/promises';
import { join, relative, normalize } from 'node:path';

// 支持的文件扩展名
const SUPPORTED_EXTENSIONS = ['.md', '.mmd', '.txt', '.json', '.yml', '.yaml', '.ts', '.tsx', '.js', '.jsx'];

// 默认排除的目录（fast-glob 会自动读取 .gitignore）
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
  /** 是否使用 .gitignore */
  useGitignore?: boolean;
  /** 白名单模式：只显示指定的文件夹和文件（glob 模式） */
  whitelist?: string[];
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
      useGitignore: options.useGitignore ?? true,
      whitelist: options.whitelist,
    };
  }

  /**
   * 执行扫描
   */
  async scan(): Promise<ScanResult> {
    const startTime = Date.now();
    const files: FileInfo[] = [];
    const directories: FileInfo[] = [];

    // 确定使用白名单还是扩展名模式
    const useWhitelist = this.options.whitelist && this.options.whitelist.length > 0;

    let patterns: string[];
    if (useWhitelist) {
      // 白名单模式：使用用户指定的 glob 模式
      patterns = this.options.whitelist;
    } else {
      // 默认模式：基于扩展名扫描
      const extPatterns = this.options.extensions.map(ext => `**/*${ext}`);
      patterns = this.options.includeHidden || this.options.includeDotFiles
        ? extPatterns
        : extPatterns.filter(p => !p.includes('/.')).filter(Boolean);
    }

    // 构建 ignore 模式（仅在非白名单模式下使用）
    const ignorePatterns = useWhitelist ? [] : [...this.options.excludeDirs];
    if (!useWhitelist && !this.options.includeHidden && !this.options.includeDotFiles) {
      ignorePatterns.push('.*');
      ignorePatterns.push('**/.*');
    }

    // fast-glob 选项
    const globOptions = {
      cwd: this.options.rootDir,
      ignore: ignorePatterns,
      onlyFiles: true,
      absolute: true,
      dot: this.options.includeHidden || this.options.includeDotFiles,
      followSymbolicLinks: this.options.followSymlinks,
      deep: this.options.maxDepth || Number.POSITIVE_INFINITY,
      unique: true,
      gitignore: useWhitelist ? false : this.options.useGitignore,
      objectMode: false,
    };

    try {
      // 使用 fast-glob 扫描文件
      const filePaths = await fg(patterns, globOptions);

      // 获取文件信息
      for (const filePath of filePaths) {
        try {
          const stats = await stat(filePath);
          const relativePath = relative(this.options.rootDir, filePath);
          const extension = this.getExtension(filePath);

          files.push({
            name: filePath.split('/').pop() || '',
            path: normalize(filePath),
            relativePath,
            extension,
            size: stats.size,
            modifiedAt: stats.mtime,
            createdAt: stats.ctime,
            isDirectory: stats.isDirectory(),
            isFile: stats.isFile(),
            isSymbolicLink: stats.isSymbolicLink(),
          });
        } catch (error) {
          this.errors.push(new Error(`Failed to stat ${filePath}: ${error}`));
        }
      }

      // 扫描目录（基于文件路径提取父目录）
      const dirSet = new Set<string>();
      for (const file of files) {
        const parts = file.relativePath.split('/');
        for (let i = 0; i < parts.length - 1; i++) {
          const dirPath = parts.slice(0, i + 1).join('/');
          const fullPath = join(this.options.rootDir, dirPath);
          dirSet.add(fullPath);
        }
      }

      for (const dirPath of dirSet) {
        try {
          const stats = await stat(dirPath);
          const relativePath = relative(this.options.rootDir, dirPath);

          directories.push({
            name: dirPath.split('/').pop() || '',
            path: normalize(dirPath),
            relativePath,
            extension: '',
            size: 0,
            modifiedAt: stats.mtime,
            createdAt: stats.ctime,
            isDirectory: true,
            isFile: false,
            isSymbolicLink: stats.isSymbolicLink(),
          });
        } catch (error) {
          this.errors.push(new Error(`Failed to stat dir ${dirPath}: ${error}`));
        }
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
   * 获取文件扩展名（包含点号）
   */
  private getExtension(filename: string): string {
    const parts = filename.split('.');
    if (parts.length < 2) return '';
    return `.${parts.pop()}`;
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
