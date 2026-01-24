import { useState, useEffect } from 'react';
import { FaSun, FaMoon, FaTimes, FaFont, FaTextHeight, FaPalette, FaGithub, FaFileAlt } from 'react-icons/fa';
import { useTheme } from '../../hooks/useTheme.js';
import { cn } from '../../utils/cn.js';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  githubUrl?: string;
}

interface FontFamily {
  name: string;
  value: string;
  label: string;
}

interface FontSize {
  name: string;
  value: string;
  label: string;
}

interface MarkdownTheme {
  name: string;
  id: string;
  label: string;
  preview: string;
}

const FONT_FAMILIES: FontFamily[] = [
  { name: 'system', value: 'Inter, system-ui, sans-serif', label: 'System' },
  { name: 'serif', value: 'Georgia, serif', label: 'Serif' },
  { name: 'mono', value: 'JetBrains Mono, monospace', label: 'Monospace' },
  { name: 'cursive', value: 'Comic Sans MS, cursive', label: 'Cursive' },
];

const FONT_SIZES: FontSize[] = [
  { name: 'small', value: '14px', label: 'Small' },
  { name: 'medium', value: '16px', label: 'Medium' },
  { name: 'large', value: '18px', label: 'Large' },
  { name: 'xlarge', value: '20px', label: 'Extra Large' },
];

const MARKDOWN_THEMES: MarkdownTheme[] = [
  {
    name: 'github',
    id: 'github',
    label: 'GitHub',
    preview: 'Clean & minimal',
  },
  {
    name: 'vitesse',
    id: 'vitesse',
    label: 'Vitesse',
    preview: 'Modern & fast',
  },
  {
    name: 'nord',
    id: 'nord',
    label: 'Nord',
    preview: 'Arctic & calm',
  },
  {
    name: 'dracula',
    id: 'dracula',
    label: 'Dracula',
    preview: 'Dark & vibrant',
  },
  {
    name: 'one-dark',
    id: 'one-dark',
    label: 'One Dark',
    preview: 'Atom\'s classic',
  },
  {
    name: 'catppuccin',
    id: 'catppuccin',
    label: 'Catppuccin',
    preview: 'Pastel & cozy',
  },
];

const STORAGE_KEYS = {
  fontFamily: 'folder-site-font-family',
  fontSize: 'folder-site-font-size',
  markdownTheme: 'folder-site-markdown-theme-style',
};

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  githubUrl?: string;
}

export function SettingsPanel({ isOpen, onClose, githubUrl }: SettingsPanelProps) {
  const { theme, setTheme, effectiveTheme } = useTheme();
  const [markdownTheme, setMarkdownThemeState] = useState<'github' | 'vitesse' | 'nord' | 'dracula' | 'one-dark' | 'catppuccin'>(() => {
    if (typeof window === 'undefined') return 'github';
    const saved = localStorage.getItem(STORAGE_KEYS.markdownTheme);
    return (saved as any) || 'github';
  });
  const [fontFamily, setFontFamily] = useState(() => {
    if (typeof window === 'undefined') return FONT_FAMILIES[0]?.value || '';
    const saved = localStorage.getItem(STORAGE_KEYS.fontFamily);
    return saved || FONT_FAMILIES[0]?.value || '';
  });
  const [fontSize, setFontSize] = useState(() => {
    if (typeof window === 'undefined') return FONT_SIZES[1]?.value || '';
    const saved = localStorage.getItem(STORAGE_KEYS.fontSize);
    return saved || FONT_SIZES[1]?.value || '';
  });
  const [isVisible, setIsVisible] = useState(isOpen);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setIsAnimating(false);
      // 下一帧开始动画
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setIsAnimating(true));
      });
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    document.documentElement.style.setProperty('--font-family', fontFamily);
  }, [fontFamily]);

  useEffect(() => {
    document.documentElement.style.setProperty('--font-size', fontSize);
  }, [fontSize]);

  const handleFontFamilyChange = (value: string) => {
    setFontFamily(value);
    localStorage.setItem(STORAGE_KEYS.fontFamily, value);
  };

  const handleFontSizeChange = (value: string) => {
    setFontSize(value);
    localStorage.setItem(STORAGE_KEYS.fontSize, value);
  };

  const setMarkdownTheme = (theme: 'github' | 'vitesse' | 'nord' | 'dracula' | 'one-dark' | 'catppuccin') => {
    setMarkdownThemeState(theme);
    localStorage.setItem(STORAGE_KEYS.markdownTheme, theme);
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-50 transition-opacity duration-300',
          isAnimating ? 'bg-black/50 opacity-100' : 'bg-black/0 opacity-0'
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={cn(
          'fixed right-0 top-0 h-full w-full max-w-md z-50 bg-background shadow-2xl overflow-y-auto transition-all duration-300 ease-in-out',
          isAnimating ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-6 py-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <FaPalette className="text-primary" />
              Settings
            </h2>
            <button
              onClick={onClose}
              className="rounded-md p-2 hover:bg-muted transition-colors"
              aria-label="Close settings"
            >
              <FaTimes className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 px-6 py-6 space-y-8">
            {/* Theme Section */}
            <section>
              <h3 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
                <FaPalette className="h-4 w-4" />
                Theme
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { mode: 'light' as const, icon: FaSun, label: 'Light' },
                  { mode: 'dark' as const, icon: FaMoon, label: 'Dark' },
                  { mode: 'auto' as const, icon: FaDesktop, label: 'Auto' },
                ].map(({ mode, icon: Icon, label }) => (
                  <button
                    key={mode}
                    onClick={() => setTheme(mode)}
                    className={cn(
                      'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all',
                      'hover:border-primary/50',
                      theme === mode
                        ? 'border-primary bg-primary/5'
                        : 'border-border'
                    )}
                    aria-label={`Switch to ${label} theme`}
                    aria-pressed={theme === mode}
                  >
                    <Icon
                      className={cn(
                        'h-6 w-6',
                        theme === mode ? 'text-primary' : 'text-muted-foreground'
                      )}
                    />
                    <span
                      className={cn(
                        'text-sm font-medium',
                        theme === mode ? 'text-primary' : 'text-muted-foreground'
                      )}
                    >
                      {label}
                    </span>
                  </button>
                ))}
              </div>
              {theme === 'auto' && (
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Currently using {effectiveTheme} theme
                </p>
              )}
            </section>

            {/* Markdown Theme Section */}
            <section>
              <h3 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
                <FaFileAlt className="h-4 w-4" />
                Markdown Theme
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {MARKDOWN_THEMES.map((mdTheme) => (
                  <button
                    key={mdTheme.id}
                    onClick={() => setMarkdownTheme(mdTheme.id as any)}
                    className={cn(
                      'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all text-left',
                      'hover:border-primary/50',
                      markdownTheme === mdTheme.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border'
                    )}
                    aria-label={`Switch to ${mdTheme.label} markdown theme`}
                    aria-pressed={markdownTheme === mdTheme.id}
                  >
                    <div className="font-medium text-sm">{mdTheme.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {mdTheme.preview}
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* Font Family Section */}
            <section>
              <h3 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
                <FaFont className="h-4 w-4" />
                Font Family
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {FONT_FAMILIES.map((font) => (
                  <button
                    key={font.name}
                    onClick={() => handleFontFamilyChange(font.value)}
                    className={cn(
                      'p-4 rounded-lg border-2 transition-all text-left',
                      'hover:border-primary/50',
                      fontFamily === font.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border'
                    )}
                    style={{ fontFamily: font.value }}
                    aria-label={`Switch to ${font.label} font`}
                    aria-pressed={fontFamily === font.value}
                  >
                    <div className="font-medium text-sm">{font.label}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Aa Bb Cc
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* Font Size Section */}
            <section>
              <h3 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
                <FaTextHeight className="h-4 w-4" />
                Font Size
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {FONT_SIZES.map((size) => (
                  <button
                    key={size.name}
                    onClick={() => handleFontSizeChange(size.value)}
                    className={cn(
                      'p-4 rounded-lg border-2 transition-all text-left',
                      'hover:border-primary/50',
                      fontSize === size.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border'
                    )}
                    style={{ fontSize: size.value }}
                    aria-label={`Switch to ${size.label} font size`}
                    aria-pressed={fontSize === size.value}
                  >
                    <div className="font-medium">{size.label}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Sample text
                    </div>
                  </button>
                ))}
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="border-t px-6 py-4 bg-muted/30 space-y-3">
            {githubUrl && (
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-md bg-secondary text-foreground font-medium hover:bg-secondary/80 transition-colors"
              >
                <FaGithub className="h-4 w-4" />
                View on GitHub
              </a>
            )}
            <button
              onClick={() => {
                setTheme('light');
                setMarkdownTheme('github');
                handleFontFamilyChange(FONT_FAMILIES[0]?.value || '');
                handleFontSizeChange(FONT_SIZES[1]?.value || '');
              }}
              className="w-full py-2 px-4 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            >
              Reset to Defaults
            </button>
          </div>
        </div>
      </div>
    </>
  );
}