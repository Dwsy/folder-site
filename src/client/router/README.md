# Router Configuration

This directory contains the routing configuration for the Folder-Site CLI client application using React Router v7.

## File Structure

```
router/
├── index.tsx          # Main router configuration with route definitions
├── RouteGuard.tsx     # Route guard component for protecting routes
├── types.ts           # TypeScript type definitions for routing
├── navigation.ts      # Navigation utility functions
└── README.md          # This file
```

## Route Structure

### Main Routes (inside MainLayout)

| Path | Component | Description |
|------|-----------|-------------|
| `/` | `Home` | Home page |
| `/files/:path*` | `FileView` | File/directory browsing with nested path support |
| `/search` | `Search` | Search page with query parameters |
| `/help/:topic?` | `Help` | Help page with optional topic |
| `/docs` | `Docs` | Documentation page |
| `/features` | `Features` | Features page |
| `/about` | `About` | About page |
| `*` | `Navigate to /` | Catch-all route |

### Standalone Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/loading` | `Loading` | Loading page (outside MainLayout) |
| `/404` | `NotFound` | 404 error page (outside MainLayout) |

## Usage

### Importing the Router

```tsx
import { RouterProvider } from 'react-router-dom';
import { router } from './router/index.js';

function App() {
  return <RouterProvider router={router} />;
}
```

### Importing Utilities

```tsx
import {
  // Router
  router,

  // Route Guard
  RouteGuard,
  withGuard,

  // Types
  type RouteParams,
  type NavigationOptions,
  type FileRouteInfo,
  type SearchRouteParams,
  type HelpRouteParams,

  // Navigation utilities
  navigateToFile,
  navigateToParent,
  navigateToSearch,
  navigateToHelp,
  parseFilePath,
  buildFilePath,
  isFilePath,
  isDirectoryPath,
  normalizePath,
  getBreadcrumbs,
} from './router/index.js';
```

### Navigation Utilities

#### navigateToFile

Navigate to a file or directory:

```tsx
import { useNavigate } from 'react-router-dom';
import { navigateToFile } from './router/index.js';

function MyComponent() {
  const navigate = useNavigate();

  const handleClick = () => {
    navigateToFile(navigate, 'docs/guide/introduction');
  };

  return <button onClick={handleClick}>Open Guide</button>;
}
```

#### navigateToSearch

Navigate to search with query:

```tsx
import { useNavigate } from 'react-router-dom';
import { navigateToSearch } from './router/index.js';

function MyComponent() {
  const navigate = useNavigate();

  const handleSearch = (query: string) => {
    navigateToSearch(navigate, { q: query, type: 'content' });
  };

  return <input onChange={(e) => handleSearch(e.target.value)} />;
}
```

#### parseFilePath

Parse file path information:

```tsx
import { parseFilePath } from './router/index.js';

const info = parseFilePath('docs/guide/introduction.md');
// Returns: {
//   path: 'docs/guide/introduction.md',
//   name: 'introduction.md',
//   extension: 'md',
//   directory: 'docs/guide',
//   isDirectory: false
// }
```

#### getBreadcrumbs

Generate breadcrumb items from path:

```tsx
import { getBreadcrumbs } from './router/index.js';

const breadcrumbs = getBreadcrumbs('docs/guide/introduction');
// Returns: [
//   { label: 'Home', path: '/' },
//   { label: 'docs', path: '/docs' },
//   { label: 'guide', path: '/docs/guide' },
//   { label: 'introduction', path: '/docs/guide/introduction' }
// ]
```

### Route Guard

Protect routes with guards:

```tsx
import { RouteGuard } from './router/index.js';

// Basic usage
<RouteGuard requireAuth={true}>
  <ProtectedPage />
</RouteGuard>

// With custom validation
<RouteGuard
  validate={(pathname) => pathname.startsWith('/admin')}
  redirectPath="/unauthorized"
>
  <AdminPage />
</RouteGuard>

// Using HOC
import { withGuard } from './router/index.js';

const ProtectedComponent = withGuard(MyComponent, {
  requireAuth: true,
  redirectPath: '/login',
});
```

### Custom Hooks

#### useNavigation

Enhanced navigation hook:

```tsx
import { useNavigation } from './router/index.js';

function MyComponent() {
  const { navigateToFile, navigateToSearch, navigateToHelp } = useNavigation();

  return (
    <>
      <button onClick={() => navigateToFile('docs/guide')}>Go to Guide</button>
      <button onClick={() => navigateToSearch({ q: 'test' })}>Search</button>
      <button onClick={() => navigateToHelp('navigation')}>Help</button>
    </>
  );
}
```

#### useRouteParams

Enhanced route params hook:

```tsx
import { useRouteParams } from './router/index.js';

function FileView() {
  const { path, fileRouteInfo, searchParams, helpTopic } = useRouteParams();

  return (
    <div>
      <p>Path: {path}</p>
      <p>File: {fileRouteInfo?.name}</p>
    </div>
  );
}
```

## Route Parameters

### File Route (`/files/:path*`)

- `path*`: Any nested path (e.g., `docs/guide/introduction.md`)

### Search Route (`/search`)

Query parameters:
- `q`: Search query
- `type`: Search type (`file`, `content`, or `all`)
- `page`: Page number

Example: `/search?q=react&type=content&page=1`

### Help Route (`/help/:topic?`)

- `topic`: Optional help topic (e.g., `navigation`, `search`)

## Lazy Loading

Most routes use lazy loading for code splitting:

```tsx
{
  path: 'search',
  lazy: async () => {
    const { Search } = await import('../pages/Search.js');
    return { Component: Search };
  },
}
```

This improves initial load time by only loading route components when needed.

## Error Handling

- **404 Not Found**: Handled by `NotFound` component
- **Route Errors**: Handled by `errorElement` in router configuration
- **Global Errors**: Handled by `ErrorBoundary` in App.tsx

## Future Enhancements

- Authentication guards
- Permission-based routing
- Route transitions/animations
- Code splitting optimization
- Route preloading