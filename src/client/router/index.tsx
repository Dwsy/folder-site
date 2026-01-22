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
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'docs',
        lazy: async () => {
          const { Docs } = await import('../pages/Docs.js');
          return { Component: Docs };
        },
      },
      {
        path: 'file/*',
        lazy: async () => {
          const { FileView } = await import('../pages/FileView.js');
          return { Component: FileView };
        },
      },
      {
        path: 'search',
        lazy: async () => {
          const { Search } = await import('../pages/Search.js');
          return { Component: Search };
        },
      },
      {
        path: 'features',
        element: (
          <div className="mx-auto max-w-4xl p-6">
            <h1 className="mb-4 text-3xl font-bold">Features</h1>
            <p className="text-muted-foreground">Feature list coming soon...</p>
          </div>
        ),
      },
      {
        path: 'about',
        element: (
          <div className="mx-auto max-w-4xl p-6">
            <h1 className="mb-4 text-3xl font-bold">About</h1>
            <p className="text-muted-foreground">About page coming soon...</p>
          </div>
        ),
      },
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
  {
    path: '/loading',
    element: <Loading />,
  },
]);
