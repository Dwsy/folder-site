/**
 * OfficeThemeToggle Component
 * 
 * Office 文档主题切换组件
 * 
 * 功能特性：
 * - 主题模式切换（亮色/暗色）
 * - 实时预览
 * - 平滑过渡动画
 * - 主题持久化
 * - 可自定义样式
 * 
 * @example
 * ```tsx
 * <OfficeThemeToggle />
 * 
 * // 带自定义选项
 * <OfficeThemeToggle
 *   size="sm"
 *   variant="pill"
 *   showLabel={true}
 * />
 * ```
 */

import { useState, useEffect } from 'react';
import { FaSun, FaMoon, FaPalette } from 'react-icons/fa';
import { useOfficeTheme } from '../../hooks/useOfficeTheme.js';

/**
 * 组件尺寸
 */
type ComponentSize = 'sm' | 'md' | 'lg';

/**
 * 组件变体
 */
type ComponentVariant = 'default' | 'pill' | 'outline' | 'ghost';

/**
 * OfficeThemeToggle 组件属性
 */
export interface OfficeThemeToggleProps {
  /** 组件尺寸 */
  size?: ComponentSize;
  /** 组件变体 */
  variant?: ComponentVariant;
  /** 是否显示标签 */
  showLabel?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 切换回调 */
  onToggle?: (mode: 'light' | 'dark') => void;
  /** 主题变化回调 */
  onThemeChange?: (mode: 'light' | 'dark', colors: any) => void;
}

/**
 * 尺寸配置
 */
const SIZE_CONFIG: Record<ComponentSize, { iconSize: string; padding: string; fontSize: string }> = {
  sm: { iconSize: 'w-4 h-4', padding: 'px-2 py-1', fontSize: 'text-xs' },
  md: { iconSize: 'w-5 h-5', padding: 'px-3 py-1.5', fontSize: 'text-sm' },
  lg: { iconSize: 'w-6 h-6', padding: 'px-4 py-2', fontSize: 'text-base' },
};

/**
 * 变体样式
 */
const VARIANT_STYLES: Record<ComponentVariant, string> = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90',
  pill: 'bg-muted hover:bg-muted/80 rounded-full',
  outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
  ghost: 'hover:bg-accent hover:text-accent-foreground',
};

/**
 * OfficeThemeToggle 组件
 */
export function OfficeThemeToggle({
  size = 'md',
  variant = 'default',
  showLabel = false,
  className = '',
  disabled = false,
  onToggle,
  onThemeChange,
}: OfficeThemeToggleProps) {
  const { themeMode, toggleThemeMode, themeColors, isUpdating } = useOfficeTheme();
  const [mounted, setMounted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // 防止水合不匹配
  useEffect(() => {
    setMounted(true);
  }, []);

  // 触发动画效果
  const triggerAnimation = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
  };

  // 处理点击
  const handleClick = () => {
    if (disabled || isUpdating) {
      return;
    }

    triggerAnimation();
    toggleThemeMode();

    const newMode = themeMode === 'light' ? 'dark' : 'light';
    onToggle?.(newMode);
  };

  // 主题变化回调
  useEffect(() => {
    onThemeChange?.(themeMode, themeColors);
  }, [themeMode, themeColors, onThemeChange]);

  const { iconSize, padding, fontSize } = SIZE_CONFIG[size];
  const variantStyle = VARIANT_STYLES[variant];

  // 获取图标
  const getIcon = () => {
    if (themeMode === 'dark') {
      return <FaMoon className={`${iconSize} ${isAnimating ? 'rotate-180' : 'rotate-0'} transition-transform duration-300`} />;
    }
    return <FaSun className={`${iconSize} ${isAnimating ? 'rotate-180' : 'rotate-0'} transition-transform duration-300`} />;
  };

  // 获取标签
  const getLabel = () => {
    return themeMode === 'dark' ? 'Dark' : 'Light';
  };

  // 防止水合不匹配的占位符
  if (!mounted) {
    return (
      <div className={`inline-flex items-center gap-2 ${padding} rounded-md bg-muted`} />
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isUpdating}
      className={`
        inline-flex items-center gap-2 ${padding} ${fontSize}
        font-medium transition-all duration-300 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${isAnimating ? 'scale-95' : 'scale-100'}
        ${variantStyle}
        ${className}
      `}
      title={`Switch to ${themeMode === 'light' ? 'dark' : 'light'} theme`}
      aria-label={`Office theme toggle. Current: ${getLabel()} mode`}
    >
      {/* 图标 */}
      <span className="flex items-center justify-center">
        {getIcon()}
      </span>

      {/* 标签 */}
      {showLabel && <span>{getLabel()}</span>}

      {/* 加载指示器 */}
      {isUpdating && (
        <span className="ml-1">
          <svg className={`animate-spin ${iconSize}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </span>
      )}
    </button>
  );
}

/**
 * OfficeThemeToggleCompact Component
 * 
 * 紧凑版 Office 主题切换组件
 */
export function OfficeThemeToggleCompact({
  className = '',
  disabled = false,
  onToggle,
}: Pick<OfficeThemeToggleProps, 'className' | 'disabled' | 'onToggle'>) {
  const { themeMode, toggleThemeMode, isUpdating } = useOfficeTheme();
  const [mounted, setMounted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const triggerAnimation = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const handleClick = () => {
    if (disabled || isUpdating) {
      return;
    }

    triggerAnimation();
    toggleThemeMode();

    const newMode = themeMode === 'light' ? 'dark' : 'light';
    onToggle?.(newMode);
  };

  // 防止水合不匹配的占位符
  if (!mounted) {
    return (
      <div className="h-8 w-8 rounded-full bg-muted" />
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isUpdating}
      className={`
        relative flex h-8 w-8 items-center justify-center rounded-full border
        transition-all duration-300 ease-in-out
        hover:bg-muted hover:scale-105
        focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${isAnimating ? 'scale-95' : 'scale-100'}
        ${className}
      `}
      title={`Switch to ${themeMode === 'light' ? 'dark' : 'light'} theme`}
      aria-label={`Office theme toggle. Current: ${themeMode} mode`}
    >
      <span className={`flex items-center justify-center ${isAnimating ? 'rotate-180' : 'rotate-0'} transition-transform duration-300`}>
        {themeMode === 'dark' ? (
          <FaMoon className="h-4 w-4" />
        ) : (
          <FaSun className="h-4 w-4" />
        )}
      </span>

      {/* 加载指示器 */}
      {isUpdating && (
        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-background/50">
          <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </span>
      )}
    </button>
  );
}

/**
 * OfficeThemePicker Component
 * 
 * Office 主题选择器，支持选择不同的主题预设
 */
export function OfficeThemePicker({
  className = '',
  disabled = false,
}: { className?: string; disabled?: boolean }) {
  const { themeMode, setThemeMode, themeColors, setThemeColors } = useOfficeTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 主题预设
  const themePresets = [
    {
      name: 'Light',
      mode: 'light' as const,
      colors: {
        primaryColor: '#0066cc',
        backgroundColor: '#ffffff',
        foregroundColor: '#0a0a0a',
      },
    },
    {
      name: 'Dark',
      mode: 'dark' as const,
      colors: {
        primaryColor: '#3b82f6',
        backgroundColor: '#1f2937',
        foregroundColor: '#f3f4f6',
      },
    },
    {
      name: 'Blue',
      mode: 'light' as const,
      colors: {
        primaryColor: '#2563eb',
        backgroundColor: '#eff6ff',
        foregroundColor: '#1e3a8a',
      },
    },
    {
      name: 'Green',
      mode: 'light' as const,
      colors: {
        primaryColor: '#059669',
        backgroundColor: '#f0fdf4',
        foregroundColor: '#064e3b',
      },
    },
    {
      name: 'Purple',
      mode: 'light' as const,
      colors: {
        primaryColor: '#7c3aed',
        backgroundColor: '#faf5ff',
        foregroundColor: '#4c1d95',
      },
    },
  ];

  const handleSelectPreset = (preset: typeof themePresets[0]) => {
    setThemeMode(preset.mode);
    setThemeColors(preset.colors);
    setIsOpen(false);
  };

  // 防止水合不匹配的占位符
  if (!mounted) {
    return (
      <div className="h-9 w-32 rounded-md border border-border bg-muted" />
    );
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium
          border rounded-md transition-all duration-200
          hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
        aria-label="Open theme picker"
        aria-expanded={isOpen}
      >
        <FaPalette className="h-4 w-4" />
        <span>Theme</span>
      </button>

      {isOpen && (
        <>
          {/* 遮罩层 */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* 下拉菜单 */}
          <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-md border bg-popover shadow-lg">
            <div className="p-1">
              {themePresets.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => handleSelectPreset(preset)}
                  className={`
                    w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md
                    transition-colors hover:bg-accent hover:text-accent-foreground
                    ${themeMode === preset.mode ? 'bg-accent' : ''}
                  `}
                  aria-label={`Select ${preset.name} theme`}
                >
                  {/* 颜色预览 */}
                  <div className="flex gap-1">
                    <div
                      className="w-3 h-3 rounded-full border"
                      style={{ backgroundColor: preset.colors.primaryColor }}
                    />
                    <div
                      className="w-3 h-3 rounded-full border"
                      style={{ backgroundColor: preset.colors.backgroundColor }}
                    />
                  </div>
                  <span>{preset.name}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}