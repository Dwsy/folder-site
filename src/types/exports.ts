/**
 * 类型定义统一导出
 */

// 导出所有类型，避免冲突
export type {
  // CLI
  CliCommand,
  CliOptions,
  CliCommandArgs,
  CommandResult,
  CliContext,
} from './cli.js';

export type {
  // Config
  SiteConfig,
  ThemeConfig,
  NavigationConfig,
  SearchConfig,
  ExportConfig,
  ConfigFile,
  // 将 config.js 中的 BuildConfig 重命名为 ConfigBuildConfig
  BuildConfig as ConfigBuildConfig,
} from './config.js';

export type {
  // Files
  FileInfo,
  DirectoryTreeNode,
  FileMeta,
  FileContent,
  FileSystemOptions,
  FileWatchEvent,
  FileWatchOptions,
} from './files.js';

export type {
  // API
  ApiResponse,
  ApiError,
  HealthCheckResponse,
  FileListResponse,
  FileContentResponse,
  DirectoryTreeResponse,
  SearchRequest,
  SearchResponse,
  ExportRequest,
  ExportResponse,
  WSMessage,
  FileChangeEvent,
} from './api.js';

export type {
  // Build
  BuildConfig as BuildSystemConfig,
  BuildMode,
  BuildResult,
  BuildFile,
  BuildMessage,
  BuildHooks,
  DevServerConfig,
  DevServerStatus,
} from './build.js';

export type {
  // Indexing
  FileIndexEntry,
  FileIndexEntryType,
  FileIndexStats,
  FileIndexServiceOptions,
  FileIndexSearchOptions,
  FileIndexSearchResult,
  FileIndexChange,
  FileIndexChangeType,
  FileIndexUpdateSummary,
} from './indexing.js';

export type {
  // Parser
  MarkdownParserOptions,
  ParseResult,
  FrontmatterData,
  ParseMetadata,
} from './parser.js';

export type {
  // Transformer
  TransformerOptions,
  TransformerPlugin,
  TransformerPluginContext,
  NodeTransformer,
} from './transformer.js';

export type {
  // Highlighter
  CodeHighlightOptions,
  HighlighterOptions,
  HighlightedCode,
  IHighlighter,
  HighlighterLanguage,
  HighlighterTheme,
} from './highlighter.js';

export type {
  // WorkHub
  ADREntry,
  IssueEntry,
  PREntry,
  WorkHubMetadata,
  WorkHubParserOptions,
  WorkHubResult,
  WorkHubStats,
  WorkHubEntry,
  IssueStatus,
  PRStatus,
  ADRStatus,
} from './workhub.js';

export type {
  // Render Cache
  CacheEntry,
  CacheStatistics,
  CacheConfig,
} from './render-cache.js';

// 导出工具类型
export type {
  DeepPartial,
  DeepReadonly,
  DeepRequired,
  PartialBy,
  RequiredBy,
  UnionToIntersection,
  Awaited,
} from './global.d.ts';