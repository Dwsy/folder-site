import { useState, useEffect } from 'react';
import { FaSun, FaMoon, FaDesktop, FaTimes, FaFont, FaTextHeight, FaPalette } from 'react-icons/fa';
import { useTheme } from '../../hooks/useTheme.js';
import { cn } from '../../utils/cn.js';

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

const STORAGE_KEYS = {
  fontFamily: 'folder-site-font-family',
  fontSize: 'folder-site-font-size',
};

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const { theme, setTheme, effectiveTheme } = useTheme();
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

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md z-50 bg-background shadow-2xl transition-transform duration-300 ease-in-out overflow-y-auto">
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
          <div className="border-t px-6 py-4 bg-muted/30">
            <button
              onClick={() => {
                setTheme('light');
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