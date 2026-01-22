import { useEffect } from 'react';

function App() {
  useEffect(() => {
    // Initialize theme from localStorage or system preference
    const theme = localStorage.getItem('theme');
    if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex h-screen flex-col">
        {/* Header */}
        <header className="border-b bg-card">
          <div className="flex h-14 items-center px-4">
            <h1 className="text-lg font-semibold">Folder-Site CLI</h1>
            <p className="ml-4 text-sm text-muted-foreground">
              One-command local website generator
            </p>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="flex h-full">
            {/* Sidebar */}
            <aside className="w-64 border-r bg-card">
              <div className="p-4">
                <p className="text-sm text-muted-foreground">File Tree</p>
              </div>
            </aside>

            {/* Content Area */}
            <div className="flex-1 overflow-auto p-6">
              <div className="mx-auto max-w-4xl">
                <h2 className="mb-4 text-2xl font-semibold">Welcome to Folder-Site</h2>
                <p className="text-muted-foreground">
                  This is a placeholder. The full React application will be implemented in task017.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;