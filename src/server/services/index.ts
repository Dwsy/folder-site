/**
 * 服务模块导出
 */

export { FileScanner, scanDirectory, scanFiles, scanDirectoryDefault } from './scanner.js';
export { FileWatcher } from './watcher.js';
export { FileIndexService, createFileIndexService } from './file-index.js';
export { IncrementalIndexer, createIncrementalIndexer } from './incremental-indexer.js';
export { FileIndexWatcherService, createFileIndexWatcherService } from './file-index-watcher.js';
export * from '../types/indexing.js';
export * from '../types/files.js';