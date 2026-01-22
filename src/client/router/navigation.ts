import { NavigateFunction } from 'react-router-dom';
import type { FileRouteInfo, NavigationOptions, SearchRouteParams } from './types.js';

/**
 * Navigation utilities for common routing scenarios
 */

/**
 * Navigate to a file or directory
 * @param navigate - React Router navigate function
 * @param path - File or directory path
 * @param options - Navigation options
 */
export function navigateToFile(
  navigate: NavigateFunction,
  path: string,
  options?: NavigationOptions
) {
  const routePath = path.startsWith('/') ? path : `/${path}`;
  navigate(routePath, options);
}

/**
 * Navigate to parent directory
 * @param navigate - React Router navigate function
 * @param currentPath - Current file/directory path
 */
export function navigateToParent(navigate: NavigateFunction, currentPath: string) {
  const segments = currentPath.split('/').filter(Boolean);
  if (segments.length > 0) {
    segments.pop();
    const parentPath = segments.length > 0 ? `/${segments.join('/')}` : '/';
    navigate(parentPath);
  }
}

/**
 * Navigate to search page with query
 * @param navigate - React Router navigate function
 * @param params - Search parameters
 */
export function navigateToSearch(
  navigate: NavigateFunction,
  params: SearchRouteParams
) {
  const searchParams = new URLSearchParams();
  if (params.q) searchParams.set('q', params.q);
  if (params.type) searchParams.set('type', params.type);
  if (params.page) searchParams.set('page', params.page.toString());

  navigate(`/search?${searchParams.toString()}`);
}

/**
 * Navigate to help page with topic
 * @param navigate - React Router navigate function
 * @param topic - Help topic (optional)
 */
export function navigateToHelp(navigate: NavigateFunction, topic?: string) {
  navigate(topic ? `/help/${topic}` : '/help');
}

/**
 * Parse file path from route
 * @param pathParam - Route path parameter
 * @returns File route information
 */
export function parseFilePath(pathParam: string): FileRouteInfo {
  const segments = pathParam.split('/').filter(Boolean);
  const name = segments[segments.length - 1] || '';
  const extension = name.includes('.') ? name.split('.').pop() : undefined;
  const directory = segments.length > 1 ? segments.slice(0, -1).join('/') : undefined;

  return {
    path: pathParam,
    name,
    extension,
    directory,
    isDirectory: !extension,
  };
}

/**
 * Build file path from segments
 * @param segments - Path segments
 * @returns Full file path
 */
export function buildFilePath(...segments: (string | undefined)[]): string {
  return segments
    .filter(Boolean)
    .join('/')
    .replace(/\/+/g, '/');
}

/**
 * Check if path is a file (has extension)
 * @param path - File path
 * @returns True if path appears to be a file
 */
export function isFilePath(path: string): boolean {
  const name = path.split('/').pop() || '';
  return name.includes('.');
}

/**
 * Check if path is a directory
 * @param path - Directory path
 * @returns True if path appears to be a directory
 */
export function isDirectoryPath(path: string): boolean {
  return !isFilePath(path);
}

/**
 * Normalize path (remove leading/trailing slashes, etc.)
 * @param path - Path to normalize
 * @returns Normalized path
 */
export function normalizePath(path: string): string {
  return path
    .replace(/\/+/g, '/')
    .replace(/^\//, '')
    .replace(/\/$/, '');
}

/**
 * Get breadcrumb items from path
 * @param path - File/directory path
 * @returns Array of breadcrumb items
 */
export interface BreadcrumbItem {
  label: string;
  path: string;
}

export function getBreadcrumbs(path: string): BreadcrumbItem[] {
  const segments = path.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', path: '/' },
  ];

  let currentPath = '';
  for (const segment of segments) {
    currentPath += `/${segment}`;
    breadcrumbs.push({
      label: segment,
      path: currentPath,
    });
  }

  return breadcrumbs;
}