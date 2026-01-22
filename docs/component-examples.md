# Component Examples

This document shows how to use the selected component libraries in Folder-Site CLI.

## File & Folder Icons (@react-symbols/icons)

### Basic Usage

```tsx
import { FileIcon, FolderIcon } from "@react-symbols/icons/utils";

// File icon
<FileIcon fileName="example.ts" width={16} height={16} />

// Folder icon
<FolderIcon folderName="src" width={16} height={16} />
```

### Auto-Assign for Special Files

```tsx
// Automatically assigns icon for known files like package.json, vite.config.js
<FileIcon fileName="package.json" autoAssign={true} />
```

### Custom Styling

```tsx
<FileIcon
  fileName="example.ts"
  width={20}
  height={20}
  className="text-blue-500"
/>
```

### Extending Icon Mappings

```tsx
import { Js } from "@react-symbols/icons/files";

<FileIcon
  fileName="customfile.ts"
  editFileExtensionData={{
    ts: Js,
  }}
/>
```

---

## UI Icons (RemixIcon)

### Basic Usage

```tsx
import { RiSearchLine, RiFileTextLine, RiMoonLine, RiSunLine } from "react-icons/ri";

// Search icon
<RiSearchLine size={20} />

// File icon
<RiFileTextLine size={20} />

// Theme icons
<RiMoonLine size={20} />  // Dark mode
<RiSunLine size={20} />   // Light mode
```

### With Tailwind Classes

```tsx
<RiSearchLine
  size={20}
  className="text-gray-500 hover:text-gray-700 transition-colors"
/>
```

---

## Radix UI Components

### Dialog (Cmd+P Search Modal)

```tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@radix-ui/react-dialog";

function SearchModal({ open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Quick Search</DialogTitle>
        </DialogHeader>
        <SearchInput />
        <SearchResults />
      </DialogContent>
    </Dialog>
  );
}
```

### Dropdown Menu (Context Menu)

```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@radix-ui/react-dropdown-menu";

function FileContextMenu({ file }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <RiMore2Fill size={16} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => openFile(file)}>
          Open
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => copyPath(file.path)}>
          Copy Path
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => renameFile(file)}>
          Rename
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### Switch (Theme Toggle)

```tsx
import { Switch } from "@radix-ui/react-switch";

function ThemeToggle({ isDark, onToggle }) {
  return (
    <div className="flex items-center gap-2">
      <RiSunLine size={16} />
      <Switch
        checked={isDark}
        onCheckedChange={onToggle}
        className="data-[state=checked]:bg-blue-500"
      />
      <RiMoonLine size={16} />
    </div>
  );
}
```

### Tooltip

```tsx
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@radix-ui/react-tooltip";

function TooltipExample() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon">
            <RiInformationLine size={16} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>This is a tooltip</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
```

### Command Palette (Alternative to Dialog for Search)

```tsx
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@radix-ui/react-command";

function CommandPalette({ open, onOpenChange }) {
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search files..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Files">
          <CommandItem onSelect={() => openFile("src/index.ts")}>
            <FileIcon fileName="index.ts" width={16} height={16} />
            <span>index.ts</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
```

---

## shadcn/ui Style Components

### Button

```tsx
import { cn } from "@/utils/cn";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
}

function Button({ variant = "default", size = "md", className, ...props }: ButtonProps) {
  const variants = {
    default: "bg-primary text-white hover:bg-primary-dark",
    ghost: "hover:bg-gray-100 dark:hover:bg-gray-800",
    outline: "border border-gray-300 hover:bg-gray-50",
  };

  const sizes = {
    sm: "h-8 px-3 text-sm",
    md: "h-10 px-4",
    lg: "h-12 px-6 text-lg",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md font-medium transition-colors",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}
```

### Card

```tsx
function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)}>
      {children}
    </div>
  );
}
```

---

## Complete Example: File Tree Item

```tsx
import { FileIcon, FolderIcon } from "@react-symbols/icons/utils";
import { RiChevronRightFill, RiChevronDownFill } from "react-icons/ri";
import { cn } from "@/utils/cn";

interface FileTreeItemProps {
  name: string;
  path: string;
  type: "file" | "folder";
  isOpen?: boolean;
  isExpanded?: boolean;
  onToggle?: () => void;
  onClick?: () => void;
  level?: number;
}

export function FileTreeItem({
  name,
  path,
  type,
  isOpen = false,
  isExpanded = false,
  onToggle,
  onClick,
  level = 0,
}: FileTreeItemProps) {
  const paddingLeft = `${level * 1.5}rem`;

  return (
    <div className="select-none">
      <div
        className={cn(
          "flex items-center gap-2 px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors",
          isOpen && "bg-blue-50 dark:bg-blue-900/20"
        )}
        style={{ paddingLeft }}
        onClick={type === "folder" ? onToggle : onClick}
      >
        {type === "folder" && (
          <>
            {isExpanded ? (
              <RiChevronDownFill size={16} className="text-gray-500" />
            ) : (
              <RiChevronRightFill size={16} className="text-gray-500" />
            )}
            <FolderIcon
              folderName={name}
              width={16}
              height={16}
              className={cn(
                "text-blue-500",
                isOpen && "text-blue-600"
              )}
            />
          </>
        )}

        {type === "file" && (
          <>
            <span className="w-4" />
            <FileIcon fileName={name} width={16} height={16} />
          </>
        )}

        <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
          {name}
        </span>
      </div>
    </div>
  );
}
```

---

## Complete Example: Search Modal

```tsx
import { useState, useEffect } from "react";
import { RiSearchLine, RiFileTextLine, RiFolderLine } from "react-icons/ri";
import { FileIcon, FolderIcon } from "@react-symbols/icons/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@radix-ui/react-dialog";
import { cn } from "@/utils/cn";

interface SearchResult {
  path: string;
  name: string;
  type: "file" | "folder";
  score: number;
}

export function SearchModal({ open, onOpenChange, onSelect }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (query.trim()) {
      // Simulate search
      const mockResults: SearchResult[] = [
        { path: "src/index.ts", name: "index.ts", type: "file", score: 100 },
        { path: "src/App.tsx", name: "App.tsx", type: "file", score: 90 },
        { path: "src/utils", name: "utils", type: "folder", score: 80 },
      ];
      setResults(mockResults);
    } else {
      setResults([]);
    }
  }, [query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      onSelect(results[selectedIndex]);
      onOpenChange(false);
    } else if (e.key === "Escape") {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[600px] p-0"
        onInteractOutside={(e) => e.preventDefault()}
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center border-b px-4 py-3">
          <RiSearchLine size={20} className="text-gray-500 mr-3" />
          <input
            type="text"
            placeholder="Search files... (Cmd+P)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm"
            autoFocus
          />
        </div>

        <div className="max-h-[400px] overflow-y-auto py-2">
          {results.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500 text-sm">
              {query ? "No results found" : "Type to search files..."}
            </div>
          ) : (
            results.map((result, index) => (
              <div
                key={result.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-2 cursor-pointer transition-colors",
                  index === selectedIndex
                    ? "bg-blue-50 dark:bg-blue-900/20"
                    : "hover:bg-gray-50 dark:hover:bg-gray-800"
                )}
                onClick={() => {
                  onSelect(result);
                  onOpenChange(false);
                }}
              >
                {result.type === "folder" ? (
                  <FolderIcon folderName={result.name} width={16} height={16} />
                ) : (
                  <FileIcon fileName={result.name} width={16} height={16} />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {result.name}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {result.path}
                  </div>
                </div>
                <kbd className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 rounded">
                  {index + 1}
                </kbd>
              </div>
            ))
          )}
        </div>

        <div className="border-t px-4 py-2 text-xs text-gray-500 flex justify-between">
          <span>
            <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded mr-1">↑↓</kbd>
            Navigate
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded mr-1">Enter</kbd>
            Open
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded mr-1">Esc</kbd>
            Close
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

## Complete Example: Theme Toggle

```tsx
import { useAtom } from "jotai";
import { RiMoonLine, RiSunLine } from "react-icons/ri";
import { Switch } from "@radix-ui/react-switch";
import { cn } from "@/utils/cn";

const themeAtom = atom<"light" | "dark">("light");

export function ThemeToggle() {
  const [theme, setTheme] = useAtom(themeAtom);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      document.documentElement.classList.toggle("dark", next === "dark");
      localStorage.setItem("theme", next);
      return next;
    });
  };

  return (
    <div className="flex items-center gap-2">
      <RiSunLine size={16} className="text-gray-600 dark:text-gray-400" />
      <Switch
        checked={theme === "dark"}
        onCheckedChange={toggleTheme}
        className={cn(
          "relative h-6 w-11 rounded-full transition-colors",
          "bg-gray-200 dark:bg-gray-700",
          "data-[state=checked]:bg-blue-500"
        )}
      >
        <Switch.Thumb
          className={cn(
            "block h-5 w-5 rounded-full bg-white shadow-lg transition-transform",
            "data-[state=checked]:translate-x-6",
            "data-[state=unchecked]:translate-x-0.5"
          )}
        />
      </Switch>
      <RiMoonLine size={16} className="text-gray-600 dark:text-gray-400" />
    </div>
  );
}
```

---

## Utility Functions

### cn() - Tailwind Class Merger

```tsx
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### Usage

```tsx
<div className={cn("base-class", isActive && "active-class", className)} />
```