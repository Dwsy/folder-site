/**
 * Editor Components
 * 
 * Main content display and code highlighting components for the Folder-Site project
 */

export { ContentDisplay } from './ContentDisplay.js';
export { CodeBlock } from './CodeBlock.js';

export type {
  ContentDisplayProps,
  ContentDisplaySimpleProps,
  ContentDisplayState,
  DisplayMode,
  CodeBlockProps,
  CodeBlockState,
  SyntaxHighlightResult,
  LineNumberProps,
  CopyButtonProps,
  FileMetadataProps,
  ErrorStateProps,
  EmptyStateProps,
  FileContent,
  FileContentType,
  ContentError,
  LoadingState,
} from '../../../types/editor.js';