/**
 * 文件系统类型定义
 */

/**
 * 文件信息
 */
export interface FileInfo {
  /** 文件名 */
  name: string;
  /** 完整路径 */
  path: string;
  /** 相对路径 */
  relativePath: string;
  /** 文件扩展名 */
  extension: string;
  /** MIME 类型 */
  mimeType?: string;
  /** 文件大小（字节） */
  size: number;
  /** 最后修改时间 */
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
 * 目录树节点
 */
export interface DirectoryTreeNode {
  /** 节点名称 */
  name: string;
  /** 完整路径 */
  path: string;
  /** 相对路径 */
  relativePath: string;
  /** 是否为目录 */
  isDirectory: boolean;
  /** 子节点 */
  children?: DirectoryTreeNode[];
  /** 文件信息 */
  fileInfo?: FileInfo;
  /** 元数据 */
  meta?: FileMeta;
}

/**
 * 文件元数据
 */
export interface FileMeta {
  /** 文件标题（从内容提取） */
  title?: string;
  /** 文件描述 */
  description?: string;
  /** 文件标签 */
  tags?: string[];
  /** 作者 */
  author?: string;
  /** 创建日期 */
  date?: string;
  /** 最后更新日期 */
  updated?: string;
  /** 排序权重 */
  weight?: number;
  /** 是否隐藏 */
  hidden?: boolean;
  /** 是否为草稿 */
  draft?: boolean;
  /** 自定义数据 */
  data?: Record<string, any>;
}

/**
 * 文件内容
 */
export interface FileContent {
  /** 文件信息 */
  info: FileInfo;
  /** 原始内容 */
  raw: string;
  /** 处理后的内容 */
  processed?: string;
  /** 文件元数据 */
  meta: FileMeta;
  /** 内容类型 */
  contentType: 'markdown' | 'html' | 'text' | 'binary' | 'code';
  /** 前置数据 */
  frontmatter?: Record<string, any>;
  /** 截图或缩略图 */
  thumbnail?: string;
}

/**
 * 文件系统操作选项
 */
export interface FileSystemOptions {
  /** 是否包含隐藏文件 */
  includeHidden?: boolean;
  /** 是否包含点文件 */
  includeDotFiles?: boolean;
  /** 文件过滤模式（glob） */
  include?: string[];
  /** 排除模式（glob） */
  exclude?: string[];
  /** 最大递归深度 */
  maxDepth?: number;
  /** 是否跟随符号链接 */
  followSymlinks?: boolean;
}

/**
 * 文件监听事件类型
 */
export type FileWatchEventType = 'add' | 'change' | 'unlink' | 'addDir' | 'unlinkDir';

/**
 * 文件监听事件
 */
export interface FileWatchEvent {
  /** 事件类型 */
  type: FileWatchEventType;
  /** 文件路径 */
  path: string;
  /** 文件信息 */
  stats?: {
    size: number;
    mtime: Date;
    ctime: Date;
  };
}

/**
 * 文件监听选项
 */
export interface FileWatchOptions {
  /** 忽略模式 */
  ignored?: string | RegExp | (string | RegExp)[] | ((path: string) => boolean);
  /** 是否忽略初始扫描 */
  ignoreInitial?: boolean;
  /** 是否使用轮询 */
  usePolling?: boolean;
  /** 轮询间隔（毫秒） */
  interval?: number;
  /** 防抖延迟（毫秒） */
  awaitWriteFinish?: {
    stabilityThreshold: number;
    pollInterval: number;
  };
  /** 监听根目录 */
  rootDir: string;
  /** 包含的文件扩展名 */
  extensions?: string[];
  /** 排除的目录名称 */
  excludeDirs?: string[];
  /** 防抖延迟 */
  debounceDelay?: number;
}

/**
 * 文件监听器状态
 */
export interface FileWatcherStatus {
  /** 是否正在监听 */
  isWatching: boolean;
  /** 监听的路径列表 */
  watchedPaths: string[];
}