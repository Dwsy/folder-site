import { useParams, useSearchParams } from 'react-router-dom';
import { useMemo } from 'react';

/**
 * Enhanced route params hook with type-safe access
 * Provides typed access to route parameters and search params
 */

/**
 * Type-safe access to route parameters
 */
export function useRouteParams() {
  const params = useParams();

  return {
    /**
     * File path from /file/* route
     * Returns undefined if not on a file route
     */
    filePath: params['*'],

    /**
     * All route parameters
     */
    params,
  };
}

/**
 * Type-safe access to URL search parameters
 */
export function useSearchParamsTyped() {
  const [searchParams, setSearchParams] = useSearchParams();

  return {
    /**
     * Get a search parameter value
     * @param key - Parameter name
     * @returns Parameter value or empty string
     */
    get: (key: string): string => searchParams.get(key) || '',

    /**
     * Get a search parameter as a number
     * @param key - Parameter name
     * @returns Parameter value as number or NaN
     */
    getNumber: (key: string): number => {
      const value = searchParams.get(key);
      return value ? Number.parseFloat(value) : NaN;
    },

    /**
     * Get a search parameter as a boolean
     * @param key - Parameter name
     * @returns Parameter value as boolean
     */
    getBoolean: (key: string): boolean => {
      const value = searchParams.get(key);
      return value === 'true' || value === '1';
    },

    /**
     * Get all search parameters as an object
     * @returns Object with all search parameters
     */
    getAll: () => {
      const result: Record<string, string> = {};
      searchParams.forEach((value, key) => {
        result[key] = value;
      });
      return result;
    },

    /**
     * Set a search parameter
     * @param key - Parameter name
     * @param value - Parameter value
     */
    set: (key: string, value: string) => {
      setSearchParams((prev) => {
        const newParams = new URLSearchParams(prev);
        newParams.set(key, value);
        return newParams;
      });
    },

    /**
     * Set multiple search parameters
     * @param params - Object with parameters to set
     */
    setMultiple: (params: Record<string, string>) => {
      setSearchParams((prev) => {
        const newParams = new URLSearchParams(prev);
        Object.entries(params).forEach(([key, value]) => {
          newParams.set(key, value);
        });
        return newParams;
      });
    },

    /**
     * Delete a search parameter
     * @param key - Parameter name
     */
    delete: (key: string) => {
      setSearchParams((prev) => {
        const newParams = new URLSearchParams(prev);
        newParams.delete(key);
        return newParams;
      });
    },

    /**
     * Clear all search parameters
     */
    clear: () => {
      setSearchParams({});
    },

    /**
     * Raw search params object
     */
    searchParams,
  };
}

/**
 * Combined hook for both route params and search params
 */
export function useAllRouteParams() {
  const routeParams = useRouteParams();
  const searchParams = useSearchParamsTyped();

  return {
    ...routeParams,
    ...searchParams,
  };
}

/**
 * Extract search query from URL
 * Common utility for search functionality
 */
export function useSearchQuery() {
  const { get } = useSearchParamsTyped();
  const query = useMemo(() => get('q'), [get]);

  return {
    query,
    hasQuery: query.length > 0,
  };
}