/**
 * Route configuration types
 */

/**
 * Route path parameters
 */
export interface RouteParams {
  path?: string;
  '*': string;
}

/**
 * Navigation action types
 */
export type NavigationAction =
  | 'push'
  | 'replace'
  | 'go'
  | 'goBack'
  | 'goForward';

/**
 * Navigation options
 */
export interface NavigationOptions {
  /**
   * Navigation action
   */
  action?: NavigationAction;
  /**
   * State to pass with navigation
   */
  state?: unknown;
  /**
   * Whether to replace current history entry
   */
  replace?: boolean;
}

/**
 * File route information
 */
export interface FileRouteInfo {
  /**
   * Full file path
   */
  path: string;
  /**
   * File name
   */
  name: string;
  /**
   * File extension
   */
  extension?: string;
  /**
   * Directory path (parent)
   */
  directory?: string;
  /**
   * Whether path is a directory
   */
  isDirectory: boolean;
}

/**
 * Search route parameters
 */
export interface SearchRouteParams {
  /**
   * Search query
   */
  q?: string;
  /**
   * Search type (file, content, all)
   */
  type?: 'file' | 'content' | 'all';
  /**
   * Current page number
   */
  page?: number;
}

/**
 * Help route parameters
 */
export interface HelpRouteParams {
  /**
   * Help topic
   */
  topic?: string;
}