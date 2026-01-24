import { Link } from 'react-router-dom';
import { FaHome, FaKeyboard, FaBook, FaSearch, FaQuestionCircle } from 'react-icons/fa';
import { cn } from '../utils/cn.js';
import { useTOC } from '../contexts/TOCContext.js';

export function Help() {
  const { hasTOC } = useTOC();

  return (
    <div className={cn('mx-auto p-6', hasTOC ? 'max-w-4xl' : 'max-w-full')}>
      <h1 className="mb-6 flex items-center gap-3 text-3xl font-bold">
        <FaQuestionCircle className="text-primary" />
        Help & Documentation
      </h1>

      <div className="space-y-8">
        {/* Quick Links */}
        <section>
          <h2 className="mb-4 text-2xl font-semibold">Quick Links</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              to="/"
              className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted"
            >
              <FaHome className="h-5 w-5 text-primary" />
              <div>
                <div className="font-medium">Home</div>
                <div className="text-sm text-muted-foreground">Return to the main page</div>
              </div>
            </Link>
            <Link
              to="/search"
              className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted"
            >
              <FaSearch className="h-5 w-5 text-primary" />
              <div>
                <div className="font-medium">Search</div>
                <div className="text-sm text-muted-foreground">Find content quickly</div>
              </div>
            </Link>
            <Link
              to="/docs"
              className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted"
            >
              <FaBook className="h-5 w-5 text-primary" />
              <div>
                <div className="font-medium">Documentation</div>
                <div className="text-sm text-muted-foreground">Full documentation</div>
              </div>
            </Link>
            <div className="flex items-center gap-3 rounded-lg border p-4">
              <FaKeyboard className="h-5 w-5 text-primary" />
              <div>
                <div className="font-medium">Keyboard Shortcuts</div>
                <div className="text-sm text-muted-foreground">See shortcuts below</div>
              </div>
            </div>
          </div>
        </section>

        {/* Keyboard Shortcuts */}
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-2xl font-semibold">
            <FaKeyboard className="text-primary" />
            Keyboard Shortcuts
          </h2>
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Shortcut</th>
                  <th className="px-4 py-3 text-left font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="px-4 py-3">
                    <kbd className="rounded border bg-muted px-2 py-1 text-sm">Ctrl</kbd> +{' '}
                    <kbd className="rounded border bg-muted px-2 py-1 text-sm">K</kbd>
                  </td>
                  <td className="px-4 py-3">Open search modal</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">
                    <kbd className="rounded border bg-muted px-2 py-1 text-sm">Esc</kbd>
                  </td>
                  <td className="px-4 py-3">Close modal / Return to previous</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">
                    <kbd className="rounded border bg-muted px-2 py-1 text-sm">/</kbd>
                  </td>
                  <td className="px-4 py-3">Focus search input</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">
                    <kbd className="rounded border bg-muted px-2 py-1 text-sm">↑</kbd> /{' '}
                    <kbd className="rounded border bg-muted px-2 py-1 text-sm">↓</kbd>
                  </td>
                  <td className="px-4 py-3">Navigate search results</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">
                    <kbd className="rounded border bg-muted px-2 py-1 text-sm">Enter</kbd>
                  </td>
                  <td className="px-4 py-3">Select search result</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* FAQ */}
        <section>
          <h2 className="mb-4 text-2xl font-semibold">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <details className="group rounded-lg border">
              <summary className="cursor-pointer px-4 py-3 font-medium transition-colors hover:bg-muted">
                How do I navigate to a specific file?
              </summary>
              <div className="px-4 pb-4 text-muted-foreground">
                Use the file tree in the sidebar to navigate through directories. Click on any file
                to view its contents. You can also use the search function to find files by name.
              </div>
            </details>
            <details className="group rounded-lg border">
              <summary className="cursor-pointer px-4 py-3 font-medium transition-colors hover:bg-muted">
                How do I search for content?
              </summary>
              <div className="px-4 pb-4 text-muted-foreground">
                Press <kbd className="rounded border bg-muted px-2 py-1 text-sm">Ctrl</kbd> +{' '}
                <kbd className="rounded border bg-muted px-2 py-1 text-sm">K</kbd> to open the search
                modal, or navigate to the Search page. You can search by file name, content, or
                tags.
              </div>
            </details>
            <details className="group rounded-lg border">
              <summary className="cursor-pointer px-4 py-3 font-medium transition-colors hover:bg-muted">
                Can I change the theme?
              </summary>
              <div className="px-4 pb-4 text-muted-foreground">
                Yes! Use the theme toggle button in the header to switch between light, dark, and
                system themes. Your preference is saved automatically.
              </div>
            </details>
            <details className="group rounded-lg border">
              <summary className="cursor-pointer px-4 py-3 font-medium transition-colors hover:bg-muted">
                How do I export content?
              </summary>
              <div className="px-4 pb-4 text-muted-foreground">
                Export functionality for PDF and HTML formats will be available soon. Check the
                documentation page for updates.
              </div>
            </details>
          </div>
        </section>

        {/* Getting Started */}
        <section>
          <h2 className="mb-4 text-2xl font-semibold">Getting Started</h2>
          <ol className="ml-6 list-decimal space-y-2 text-muted-foreground">
            <li>
              Navigate through the file tree in the sidebar to explore your documentation
            </li>
            <li>Click on any file to view its rendered content</li>
            <li>
              Use <kbd className="rounded border bg-muted px-2 py-1 text-sm">Ctrl</kbd> +{' '}
              <kbd className="rounded border bg-muted px-2 py-1 text-sm">K</kbd> to quickly search
              for files
            </li>
            <li>Toggle between light and dark themes using the theme button</li>
            <li>Check the Documentation page for detailed guides</li>
          </ol>
        </section>

        {/* Support */}
        <section>
          <h2 className="mb-4 text-2xl font-semibold">Need More Help?</h2>
          <div className="rounded-lg border bg-muted/50 p-6">
            <p className="mb-4 text-muted-foreground">
              If you need additional assistance or have questions about Folder-Site CLI, please
              refer to the official documentation or open an issue on GitHub.
            </p>
            <div className="flex gap-3">
              <Link
                to="/docs"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <FaBook className="h-4 w-4" />
                View Documentation
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}