import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

/**
 * Route guard options
 */
export interface RouteGuardOptions {
  /**
   * Whether authentication is required
   */
  requireAuth?: boolean;
  /**
   * Whether to redirect to root if no path is provided
   */
  redirectOnRoot?: boolean;
  /**
   * Custom validation function
   */
  validate?: (pathname: string) => boolean;
  /**
   * Redirect path if validation fails
   */
  redirectPath?: string;
}

/**
 * Route guard component for protecting routes
 */
export function RouteGuard({
  requireAuth = false,
  redirectOnRoot = false,
  validate,
  redirectPath = '/',
}: RouteGuardOptions) {
  const location = useLocation();

  // Redirect to root if path is empty
  useEffect(() => {
    if (redirectOnRoot && location.pathname === '/') {
      // Will be handled by Navigate component
    }
  }, [location.pathname, redirectOnRoot]);

  // Check custom validation
  if (validate && !validate(location.pathname)) {
    return <Navigate to={redirectPath} replace />;
  }

  // Authentication check (placeholder for future auth implementation)
  if (requireAuth) {
    // TODO: Implement actual authentication check
    // const isAuthenticated = checkAuth();
    // if (!isAuthenticated) {
    //   return <Navigate to="/login" state={{ from: location }} replace />;
    // }
  }

  return <Outlet />;
}

/**
 * Higher-order component for wrapping routes with guards
 */
export function withGuard<P extends object>(
  Component: React.ComponentType<P>,
  guardOptions: RouteGuardOptions
) {
  return function GuardedComponent(props: P) {
    return (
      <RouteGuard {...guardOptions}>
        <Component {...props} />
      </RouteGuard>
    );
  };
}