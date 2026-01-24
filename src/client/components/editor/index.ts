/**
 * Editor Components
 *
 * Main content display and code highlighting components for the Folder-Site project
 */

export { ContentDisplay } from './ContentDisplay.js';
export { CodeBlock } from './CodeBlock.js';
export { MarkdownRenderer } from './MarkdownRenderer.js';
export { MarkdownPreview } from './MarkdownPreview.js';
export { TOC, extractHeadings, useActiveHeading } from './TOC.js';
export { SplitMarkdownEditor, SimpleSplitEditor } from './SplitMarkdownEditor.js';

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

export type {
  MarkdownRendererProps,
  MarkdownRendererState,
} from './MarkdownRenderer.js';

export type {
  MarkdownPreviewProps,
  MarkdownPreviewState,
} from './MarkdownPreview.js';

export type {
  TOCItem,
  TOCProps,
} from './TOC.js';

export type {
  SplitMarkdownEditorProps,
  SplitMarkdownEditorState,
  SimpleSplitEditorProps,
} from './SplitMarkdownEditor.js';