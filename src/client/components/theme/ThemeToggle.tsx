import { useState, useEffect, useRef } from 'react';
import { FaSun, FaMoon, FaDesktop, FaChevronDown } from 'react-icons/fa';
import { useTheme } from '../../hooks/useTheme.js';
import { cn } from '../../utils/cn.js';

interface ThemeOption {
  mode: 'light' | 'dark' | 'auto';
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
}

const THEME_OPTIONS: ThemeOption[] = [
  { mode: 'light', icon: FaSun, label: 'Light', description: 'Light mode' },
  { mode: 'dark', icon: FaMoon, label: 'Dark', description: 'Dark mode' },
  { mode: 'auto', icon: FaDesktop, label: 'Auto', description: 'Follow system' },
];

/**
 * ThemeToggle Component
 *
 * 主题切换组件，支持三种主题模式：
 * - light: 浅色主题
 * - dark: 深色主题
 * - auto: 跟随系统主题
 *
 * 功能特性：
 * - 主题持久化（localStorage）
 * - 下拉菜单选择
 * - 系统主题检测
 * - 视觉反馈（图标、标签、提示）
 * - 防止水合不匹配
 * - 点击外部关闭菜单
 *
 * @example
 * ```tsx
 * <ThemeToggle />
 * ```
 */
export function ThemeToggle() {
  const { theme, setTheme, effectiveTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleSelectTheme = (mode: 'light' | 'dark' | 'auto') => {
    setTheme(mode);
    setIsOpen(false);
  };

  const getCurrentOption = () => THEME_OPTIONS.find(opt => opt.mode === theme) || THEME_OPTIONS[0];

  const getIcon = () => {
    if (theme === 'auto') {
      return effectiveTheme === 'dark' ? <FaDesktop className="h-4 w-4" /> : <FaDesktop className="h-4 w-4" />;
    }
    return effectiveTheme === 'dark' ? <FaMoon className="h-4 w-4" /> : <FaSun className="h-4 w-4" />;
  };

  const getLabel = () => {
    if (theme === 'auto') {
      return `System (${effectiveTheme})`;
    }
    return effectiveTheme === 'dark' ? 'Dark' : 'Light';
  };

  // 防止水合不匹配的占位符
  if (!mounted) {
    return (
      <div className="h-9 w-28 rounded-md border border-border bg-background" />
    );
  }

  const currentOption = getCurrentOption();

  return (
    <div ref={dropdownRef} className="relative">
      {/* 触发按钮 */}
      <button
        onClick={toggleDropdown}
        className={`
          group relative flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm
          transition-all duration-200 ease-in-out
          hover:bg-muted
          focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
          ${isOpen ? 'bg-muted' : ''}
        `}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={`Theme selector. Current: ${getLabel()}`}
      >
        {/* 图标 */}
        <span className="flex items-center justify-center text-foreground">
          {getIcon()}
        </span>

        {/* 标签文本 */}
        <span className="hidden sm:inline font-medium transition-colors duration-200 group-hover:text-primary">
          {getLabel()}
        </span>

        {/* 下拉箭头 */}
        <FaChevronDown
          className={cn(
            'h-3 w-3 text-muted-foreground transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* 下拉菜单 */}
      {isOpen && (
        <div
          className={`
            absolute top-full left-0 mt-2 z-50 min-w-[160px] rounded-lg border bg-background
            shadow-lg ring-1 ring-inset ring-border
            animate-in fade-in slide-in-from-top-2
          `}
          role="menu"
          aria-orientation="vertical"
          aria-label="Theme options"
        >
          {THEME_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isSelected = theme === option.mode;
            const isAutoEffective = option.mode === 'auto' ? effectiveTheme : null;

            return (
              <button
                key={option.mode}
                onClick={() => handleSelectTheme(option.mode)}
                role="menuitem"
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors',
                  'first:rounded-t-lg last:rounded-b-lg',
                  isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-foreground'
                )}
              >
                <Icon className={cn(
                  'h-4 w-4 flex-shrink-0',
                  isSelected ? 'text-primary' : 'text-muted-foreground'
                )} />
                <span className="flex-1 text-left font-medium">{option.label}</span>
                {option.mode === 'auto' && (
                  <span className="text-xs text-muted-foreground">
                    ({effectiveTheme})
                  </span>
                )}
                {isSelected && (
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * ThemeToggleCompact Component
 *
 * 紧凑版主题切换组件，仅显示图标
 *
 * @example
 * ```tsx
 * <ThemeToggleCompact />
 * ```
 */
export function ThemeToggleCompact() {
  const { theme, setTheme, effectiveTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const triggerAnimation = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const cycleTheme = () => {
    triggerAnimation();
    // 在 light、dark、auto 之间循环切换
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('auto');
    } else {
      setTheme('light');
    }
  };

  const getIcon = () => {
    if (theme === 'auto') {
      return effectiveTheme === 'dark' ? <FaDesktop className="h-5 w-5" /> : <FaDesktop className="h-5 w-5" />;
    }
    return effectiveTheme === 'dark' ? <FaMoon className="h-5 w-5" /> : <FaSun className="h-5 w-5" />;
  };

  const getDescription = () => {
    if (theme === 'light') {
      return 'Light mode';
    } else if (theme === 'dark') {
      return 'Dark mode';
    } else {
      return `System (${effectiveTheme} mode)`;
    }
  };

  if (!mounted) {
    return (
      <div className="h-10 w-10 rounded-full border border-border bg-background" />
    );
  }

  return (
    <button
      onClick={cycleTheme}
      className={`
        relative flex h-10 w-10 items-center justify-center rounded-full border
        transition-all duration-300 ease-in-out
        hover:bg-muted hover:scale-105
        focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
        ${isAnimating ? 'scale-95' : 'scale-100'}
      `}
      title={`Current: ${getDescription()}. Click to cycle themes.`}
      aria-label={`Theme toggle. Current theme: ${theme} (${effectiveTheme})`}
    >
      <span className={`
        relative flex items-center justify-center transition-transform duration-300
        ${isAnimating ? 'rotate-180' : 'rotate-0'}
      `}>
        {getIcon()}
      </span>

      {/* 主题指示器 */}
      <span className={`
        absolute -bottom-0.5 left-1/2 h-0.5 w-0 rounded-full bg-primary
        transition-all duration-300 ease-out
        ${isAnimating ? 'w-6 -translate-x-1/2' : 'w-0'}
      `} />
    </button>
  );
}