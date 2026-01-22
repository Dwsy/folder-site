import { useState, useEffect } from 'react';
import { FaSun, FaMoon, FaDesktop } from 'react-icons/fa';
import { useTheme } from '../../hooks/useTheme.js';

/**
 * ThemeToggle Component
 *
 * 主题切换组件，支持三种主题模式：
 * - light: 浅色主题
 * - dark: 深色主题
 * - system: 跟随系统主题
 *
 * 功能特性：
 * - 主题持久化（localStorage）
 * - 平滑过渡动画
 * - 系统主题检测
 * - 视觉反馈（图标、标签、提示）
 * - 防止水合不匹配
 *
 * @example
 * ```tsx
 * <ThemeToggle />
 * ```
 */
export function ThemeToggle() {
  const { theme, setTheme, effectiveTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // 触发动画效果
  const triggerAnimation = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const cycleTheme = () => {
    triggerAnimation();
    // 只在 light 和 dark 之间切换
    setTheme(effectiveTheme === 'light' ? 'dark' : 'light');
  };

  const getIcon = () => {
    return effectiveTheme === 'dark' ? <FaMoon className="h-4 w-4" /> : <FaSun className="h-4 w-4" />;
  };

  const getLabel = () => {
    return effectiveTheme === 'dark' ? 'Dark' : 'Light';
  };

  const getDescription = () => {
    return effectiveTheme === 'dark' ? 'Dark mode' : 'Light mode';
  };

  // 防止水合不匹配的占位符
  if (!mounted) {
    return (
      <div className="h-9 w-24 rounded-md border border-border bg-background" />
    );
  }

  return (
    <button
      onClick={cycleTheme}
      className={`
        group relative flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm
        transition-all duration-300 ease-in-out
        hover:bg-muted
        focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
        ${isAnimating ? 'scale-95' : 'scale-100'}
      `}
      title={`Current: ${getDescription()}. Click to cycle themes.`}
      aria-label={`Theme toggle. Current theme: ${getLabel()}`}
    >
      {/* 图标 */}
      <span className={`
        relative flex items-center justify-center transition-transform duration-300
        ${isAnimating ? 'rotate-180' : 'rotate-0'}
      `}>
        {getIcon()}
      </span>

      {/* 标签文本 */}
      <span className="hidden sm:inline font-medium transition-colors duration-300 group-hover:text-primary">
        {getLabel()}
      </span>

      {/* 主题指示器 */}
      <span className={`
        absolute -bottom-0.5 left-1/2 h-0.5 w-0 rounded-full bg-primary
        transition-all duration-300 ease-out
        ${isAnimating ? 'w-8 -translate-x-1/2' : 'w-0'}
      `} />

      {/* 悬停时的提示 */}
      <span className={`
        absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 whitespace-nowrap
        rounded-md bg-foreground px-2 py-1 text-xs text-background
        opacity-0 transition-opacity duration-200 group-hover:opacity-100 sm:block
        ${isAnimating ? 'block' : ''}
      `}>
        {getDescription()}
        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 border-4 border-transparent border-t-foreground" />
      </span>
    </button>
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
    // 只在 light 和 dark 之间切换
    setTheme(effectiveTheme === 'light' ? 'dark' : 'light');
  };

  const getIcon = () => {
    return effectiveTheme === 'dark' ? <FaMoon className="h-5 w-5" /> : <FaSun className="h-5 w-5" />;
  };

  const getDescription = () => {
    return effectiveTheme === 'dark' ? 'Dark mode' : 'Light mode';
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