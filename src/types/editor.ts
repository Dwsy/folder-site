/**
 * Editor component types
 * 
 * Type definitions for content display and editor components
 */

/**
 * Content display state
 */
export type ContentDisplayState = 'loading' | 'loaded' | 'error' | 'empty';

/**
 * Display mode for content
 */
export type DisplayMode = 'code' | 'preview' | 'raw';

/**
 * File content type
 */
export type FileContentType = 
  | 'text' 
  | 'markdown' 
  | 'code' 
  | 'image' 
  | 'video' 
  | 'audio' 
  | 'pdf' 
  | 'binary' 
  | 'unknown';

/**
 * Code language for syntax highlighting
 */
export type CodeLanguage = 
  | 'javascript' 
  | 'typescript' 
  | 'python' 
  | 'java' 
  | 'cpp' 
  | 'c' 
  | 'csharp' 
  | 'go' 
  | 'rust' 
  | 'php' 
  | 'ruby' 
  | 'swift' 
  | 'kotlin' 
  | 'scala' 
  | 'html' 
  | 'css' 
  | 'scss' 
  | 'json' 
  | 'xml' 
  | 'yaml' 
  | 'toml' 
  | 'sql' 
  | 'bash' 
  | 'shell' 
  | 'powershell' 
  | 'markdown' 
  | 'dockerfile' 
  | 'makefile' 
  | 'diff'
  | 'txt'
  | 'text'
  | 'unknown';

/**
 * Code block display options
 */
export interface CodeBlockOptions {
  /** Show line numbers */
  showLineNumbers?: boolean;
  /** Enable syntax highlighting */
  enableHighlighting?: boolean;
  /** Highlight theme */
  highlightTheme?: string;
  /** Show copy button */
  showCopyButton?: boolean;
  /** Show language indicator */
  showLanguage?: boolean;
  /** Maximum height (with scroll) */
  maxHeight?: string | number;
  /** Wrap long lines */
  wrapLines?: boolean;
}

/**
 * Code block state
 */
export type CodeBlockState = 'idle' | 'loading' | 'highlighting' | 'ready' | 'error';

/**
 * Syntax highlight result
 */
export interface SyntaxHighlightResult {
  /** Highlighted HTML */
  html: string;
  /** Language used */
  language: string;
  /** Theme used */
  theme: string;
  /** Number of lines */
  lines: number;
}

/**
 * Content display options
 */
export interface ContentDisplayOptions {
  /** Maximum content length to display */
  maxLength?: number;
  /** Truncate content if too long */
  truncate?: boolean;
  /** Show file metadata */
  showMetadata?: boolean;
  /** Enable search in content */
  enableSearch?: boolean;
  /** Enable word wrap */
  wordWrap?: boolean;
  /** Show loading skeleton */
  showSkeleton?: boolean;
}

/**
 * Content display error
 */
export interface ContentDisplayError {
  /** Error message */
  message: string;
  /** Error code */
  code?: string;
  /** Original error */
  originalError?: Error;
  /** Timestamp */
  timestamp: number;
}

/**
 * File content data
 */
export interface FileContentData {
  /** File path */
  path: string;
  /** File name */
  name: string;
  /** Content type */
  contentType: FileContentType;
  /** Content (text or base64 for binary) */
  content: string;
  /** File size in bytes */
  size: number;
  /** Last modified timestamp */
  lastModified: number;
  /** Language (for code files) */
  language?: CodeLanguage;
  /** Encoding */
  encoding?: string;
}

/**
 * Content display props
 */
export interface ContentDisplayProps {
  /** File content data */
  data: FileContentData | null;
  /** Current state */
  state: ContentDisplayState;
  /** Error (if any) */
  error?: ContentDisplayError | null;
  /** Display options */
  options?: ContentDisplayOptions;
  /** Custom error message */
  errorMessage?: string;
  /** Custom loading message */
  loadingMessage?: string;
  /** Custom empty state message */
  emptyMessage?: string;
  /** Additional CSS classes */
  className?: string;
  /** Callback when content is copied */
  onCopy?: (content: string) => void;
  /** Callback when content is downloaded */
  onDownload?: (data: FileContentData) => void;
}

/**
 * Simplified content display props for direct use
 */
export interface ContentDisplaySimpleProps {
  /** Content string */
  content?: string;
  /** Language (for syntax highlighting) */
  language?: CodeLanguage | string;
  /** Filename */
  filename?: string;
  /** Loading state */
  loading?: boolean;
  /** Error */
  error?: Error | null;
  /** Display mode */
  displayMode?: DisplayMode;
  /** Show line numbers */
  showLineNumbers?: boolean;
  /** Show copy button */
  showCopyButton?: boolean;
  /** Maximum height */
  maxHeight?: string | number;
  /** Wrap lines */
  wrapLines?: boolean;
  /** Theme */
  theme?: string;
  /** On retry callback */
  onRetry?: () => void;
  /** Custom render function */
  renderCustom?: (content: string) => React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Code block props
 */
export interface CodeBlockProps {
  /** Code content */
  code: string;
  /** Language */
  language?: CodeLanguage | string;
  /** Filename */
  filename?: string;
  /** Show line numbers */
  showLineNumbers?: boolean;
  /** Show copy button */
  showCopyButton?: boolean;
  /** Maximum height */
  maxHeight?: string | number;
  /** Wrap lines */
  wrapLines?: boolean;
  /** Start line number */
  startLineNumber?: number;
  /** Theme */
  theme?: string;
  /** Display options */
  options?: CodeBlockOptions;
  /** Additional CSS classes */
  className?: string;
  /** Callback when code is copied */
  onCopy?: (code: string) => void;
}

/**
 * Metadata display props
 */
export interface MetadataDisplayProps {
  /** File content data */
  data: FileContentData;
  /** Show specific fields */
  fields?: Array<'path' | 'name' | 'size' | 'type' | 'encoding' | 'modified'>;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Loading skeleton props
 */
export interface LoadingSkeletonProps {
  /** Number of lines to show */
  lines?: number;
  /** Show as code block */
  asCodeBlock?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Empty state props
 */
export interface EmptyStateProps {
  /** Message to display */
  message?: string;
  /** Icon */
  icon?: React.ReactNode;
  /** Action button */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Additional CSS classes */
  className?: string;
}

/**
 * Error state props
 */
export interface ErrorStateProps {
  /** Error object */
  error: ContentDisplayError;
  /** Custom message */
  message?: string;
  /** Show retry button */
  showRetry?: boolean;
  /** Retry callback */
  onRetry?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Copy button props
 */
export interface CopyButtonProps {
  /** Content to copy */
  content: string;
  /** Button label */
  label?: string;
  /** Copied label */
  copiedLabel?: string;
  /** Show tooltip */
  showTooltip?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Callback on copy */
  onCopy?: (content: string) => void;
}

/**
 * Line number props
 */
export interface LineNumberProps {
  /** Line number */
  number: number;
  /** Is active line */
  active?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * File content (deprecated, use FileContentData)
 */
export interface FileContent {
  content: string;
  language?: string;
  filename?: string;
}

/**
 * Content type (deprecated, use FileContentType)
 */
export type ContentType = FileContentType;

/**
 * Content error (deprecated, use ContentDisplayError)
 */
export type ContentError = ContentDisplayError;

/**
 * Loading state (deprecated, use ContentDisplayState)
 */
export type LoadingState = ContentDisplayState;

/**
 * File metadata props
 */
export interface FileMetadataProps {
  /** Filename */
  filename?: string;
  /** File size */
  size?: number;
  /** Language */
  language?: string;
  /** Line count */
  lineCount?: number;
  /** Last modified */
  lastModified?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Language mapping from file extension to CodeLanguage
 */
export const LANGUAGE_MAP: Record<string, CodeLanguage> = {
  // JavaScript/TypeScript
  'js': 'javascript',
  'jsx': 'javascript',
  'ts': 'typescript',
  'tsx': 'typescript',
  'mjs': 'javascript',
  'cjs': 'javascript',
  'mts': 'typescript',
  'cts': 'typescript',
  
  // Python
  'py': 'python',
  'pyw': 'python',
  'pyi': 'python',
  
  // Java
  'java': 'java',
  
  // C/C++
  'c': 'c',
  'h': 'c',
  'cpp': 'cpp',
  'hpp': 'cpp',
  'cc': 'cpp',
  'cxx': 'cpp',
  'hxx': 'cpp',
  
  // C#
  'cs': 'csharp',
  
  // Go
  'go': 'go',
  
  // Rust
  'rs': 'rust',
  
  // PHP
  'php': 'php',
  'phtml': 'php',
  
  // Ruby
  'rb': 'ruby',
  'gemspec': 'ruby',
  
  // Swift
  'swift': 'swift',
  
  // Kotlin
  'kt': 'kotlin',
  'kts': 'kotlin',
  
  // Scala
  'scala': 'scala',
  'sc': 'scala',
  
  // Web
  'html': 'html',
  'htm': 'html',
  'css': 'css',
  'scss': 'scss',
  'sass': 'scss',
  'less': 'css',
  'json': 'json',
  'xml': 'xml',
  'svg': 'xml',
  
  // Config
  'yaml': 'yaml',
  'yml': 'yaml',
  'toml': 'toml',
  'ini': 'unknown',
  'cfg': 'unknown',
  'conf': 'unknown',
  
  // SQL
  'sql': 'sql',
  
  // Shell
  'sh': 'bash',
  'bash': 'bash',
  'zsh': 'bash',
  'fish': 'bash',
  'ps1': 'powershell',
  'psm1': 'powershell',
  
  // Markdown
  'md': 'markdown',
  'markdown': 'markdown',
  
  // Docker
  'dockerfile': 'dockerfile',
  'dockerfile.win': 'dockerfile',
  
  // Make
  'makefile': 'makefile',
  'make': 'makefile',
  'mk': 'makefile',
};

/**
 * Get code language from file extension
 * 
 * @param filename - File name or extension
 * @returns Code language
 */
export function getLanguageFromFile(filename: string): CodeLanguage {
  const ext = filename.includes('.') 
    ? filename.split('.').pop()?.toLowerCase() 
    : filename.toLowerCase();
  
  return ext ? (LANGUAGE_MAP[ext] || 'unknown') : 'unknown';
}

/**
 * Get content type from file extension
 * 
 * @param filename - File name or extension
 * @returns Content type
 */
export function getContentTypeFromFile(filename: string): FileContentType {
  const ext = filename.includes('.') 
    ? filename.split('.').pop()?.toLowerCase() 
    : filename.toLowerCase();
  
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'ico'];
  const videoExts = ['mp4', 'webm', 'mov', 'avi', 'mkv'];
  const audioExts = ['mp3', 'wav', 'ogg', 'flac', 'aac'];
  const pdfExts = ['pdf'];
  const markdownExts = ['md', 'markdown'];
  
  if (ext && imageExts.includes(ext)) return 'image';
  if (ext && videoExts.includes(ext)) return 'video';
  if (ext && audioExts.includes(ext)) return 'audio';
  if (ext && pdfExts.includes(ext)) return 'pdf';
  if (ext && markdownExts.includes(ext)) return 'markdown';
  if (ext && LANGUAGE_MAP[ext]) return 'code';
  
  return 'text';
}

/**
 * Format file size for display
 * 
 * @param bytes - Size in bytes
 * @returns Formatted size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Format timestamp for display
 * 
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted date string
 */
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString();
}