/**
 * Main router configuration for Folder-Site CLI
 *
 * Route structure:
 * - / - Home page
 * - /files/:path* - File/directory browsing (supports nested paths)
 * - /search - Search page with query parameters
 * - /help/:topic? - Help page with optional topic
 * - /docs - Documentation page
 * - /features - Features page
 * - /about - About page
 * - /loading - Loading page (standalone)
 * - * - 404 Not Found
 */
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout.js';
import { Home } from '../pages/Home.js';
import { NotFound } from '../pages/NotFound.js';
import { Loading } from '../pages/Loading.js';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    errorElement: <NotFound />,
    children: [
      // Home page
      {
        index: true,
        element: <Home />,
      },

      // File/directory browsing route
      // Supports nested paths like /files/docs/guide or /files/src
      {
        path: 'files/:path*',
        lazy: async () => {
          const { FileView } = await import('../pages/FileView.js');
          return { Component: FileView };
        },
      },

      // Redirect /file/* to /files/* for consistency
      {
        path: 'file/*',
        element: <Navigate to="/files/*" replace />,
      },

      // Search page with query parameters
      // Supports ?q=query&type=file|content|all&page=1
      {
        path: 'search',
        lazy: async () => {
          const { Search } = await import('../pages/Search.js');
          return { Component: Search };
        },
      },

      // Help page with optional topic
      // Supports /help or /help/navigation
      {
        path: 'help/:topic?',
        lazy: async () => {
          const { Help } = await import('../pages/Help.js');
          return { Component: Help };
        },
      },

      // Documentation page
      {
        path: 'docs',
        lazy: async () => {
          const { Docs } = await import('../pages/Docs.js');
          return { Component: Docs };
        },
      },

      // Features page
      {
        path: 'features',
        element: (
          <div className="mx-auto max-w-4xl p-6">
            <h1 className="mb-4 text-3xl font-bold">Features</h1>
            <p className="text-muted-foreground">Feature list coming soon...</p>
          </div>
        ),
      },

      // About page
      {
        path: 'about',
        element: (
          <div className="mx-auto max-w-4xl p-6">
            <h1 className="mb-4 text-3xl font-bold">About</h1>
            <p className="text-muted-foreground">About page coming soon...</p>
          </div>
        ),
      },

      // Catch-all route - redirect to home
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },

  // Standalone loading page (outside MainLayout)
  {
    path: '/loading',
    element: <Loading />,
  },

  // Standalone 404 page (outside MainLayout)
  {
    path: '/404',
    element: <NotFound />,
  },
]);

// Re-export router utilities for convenience
export { RouteGuard, withGuard } from './RouteGuard.js';
export * from './types.js';
export * from './navigation.js';