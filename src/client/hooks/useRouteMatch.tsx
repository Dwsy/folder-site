import { useMatch } from 'react-router-dom';

/**
 * Custom hook for checking if current route matches a pattern
 * @param pattern - Route pattern to match against
 * @returns Match object or null
 */
export function useRouteMatch(pattern: string) {
  return useMatch(pattern);
}

/**
 * Custom hook for checking if current route is active
 * @param pattern - Route pattern to check
 * @returns True if route matches
 */
export function useRouteActive(pattern: string): boolean {
  return useMatch(pattern) !== null;
}

/**
 * Custom hook for getting current route path info
 * @returns Object with path info
 */
export function useRouteInfo() {
  const match = useMatch('/:path*');
  const path = match?.params?.path || '';
  const segments = path.split('/').filter(Boolean);

  return {
    path,
    segments,
    depth: segments.length,
    isRoot: segments.length === 0,
  };
}