/**
 * Dynamic Import Utilities
 *
 * Provides utilities for lazy loading components and modules
 * with loading states and error handling
 */

import { lazy, ComponentType, Suspense, useState, useCallback } from 'react';

/**
 * Lazy load a component with loading fallback
 */
export function lazyLoad<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
) {
  const LazyComponent = lazy(importFn);
  
  return function LazyLoadWrapper(props: React.ComponentProps<T>) {
    return (
      <Suspense fallback={fallback || <DefaultFallback />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

/**
 * Default loading fallback component
 */
function DefaultFallback() {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

/**
 * Lazy load a module with error handling
 */
export async function lazyImport<T>(
  importFn: () => Promise<T>,
  retries = 3
): Promise<T> {
  try {
    return await importFn();
  } catch (error) {
    if (retries > 0) {
      console.warn(`Import failed, retrying... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return lazyImport(importFn, retries - 1);
    }
    throw error;
  }
}

/**
 * Prefetch a module for future use
 */
export function prefetchModule(importFn: () => Promise<any>) {
  // Start loading the module in the background
  importFn().catch(error => {
    console.warn('Prefetch failed:', error);
  });
}

/**
 * Create a lazy-loaded component with prefetch support
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options?: {
    fallback?: React.ReactNode;
    prefetch?: boolean;
  }
) {
  const LazyComponent = lazy(importFn);
  
  // Prefetch if requested
  if (options?.prefetch) {
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(() => prefetchModule(importFn));
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => prefetchModule(importFn), 2000);
    }
  }
  
  return function LazyLoadWrapper(props: React.ComponentProps<T>) {
    return (
      <Suspense fallback={options?.fallback || <DefaultFallback />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

/**
 * Dynamic import with loading state hook
 */
export function useDynamicImport<T>(
  importFn: () => Promise<T>
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await importFn();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [importFn]);

  return { data, loading, error, load };
}