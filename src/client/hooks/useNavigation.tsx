import { useNavigate, useLocation } from 'react-router-dom';
import { useCallback } from 'react';

/**
 * Enhanced navigation hook with convenience methods
 * Provides typed navigation utilities for common routing scenarios
 */

export function useNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  /**
   * Navigate to the home page
   */
  const goToHome = useCallback(() => {
    navigate('/');
  }, [navigate]);

  /**
   * Navigate to a file path
   * @param path - File path (e.g., 'docs/guide/getting-started.md')
   */
  const goToPath = useCallback(
    (path: string) => {
      navigate(`/file/${path}`);
    },
    [navigate],
  );

  /**
   * Navigate to search page
   * @param query - Optional search query
   */
  const goToSearch = useCallback(
    (query?: string) => {
      navigate(query ? `/search?q=${encodeURIComponent(query)}` : '/search');
    },
    [navigate],
  );

  /**
   * Navigate to help page
   */
  const goToHelp = useCallback(() => {
    navigate('/help');
  }, [navigate]);

  /**
   * Navigate to docs page
   */
  const goToDocs = useCallback(() => {
    navigate('/docs');
  }, [navigate]);

  /**
   * Navigate back in history
   */
  const goBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  /**
   * Navigate forward in history
   */
  const goForward = useCallback(() => {
    navigate(1);
  }, [navigate]);

  /**
   * Replace the current URL (prevents going back)
   * @param path - Target path
   */
  const replace = useCallback(
    (path: string) => {
      navigate(path, { replace: true });
    },
    [navigate],
  );

  return {
    navigate,
    location,
    goToHome,
    goToPath,
    goToSearch,
    goToHelp,
    goToDocs,
    goBack,
    goForward,
    replace,
  };
}