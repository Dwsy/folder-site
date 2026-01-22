/**
 * SearchInput Component
 * 
 * 搜索输入框组件，支持键盘快捷键和自动聚焦
 */

import { useRef, useEffect, useCallback, forwardRef } from 'react';
import { FaSearch, FaTimes } from 'react-icons/fa';
import { cn } from '../../utils/cn.js';

/**
 * 搜索输入框属性
 */
export interface SearchInputProps {
  /** 当前搜索查询 */
  value: string;
  /** 搜索查询变化回调 */
  onChange: (value: string) => void;
  /** 占位符文本 */
  placeholder?: string;
  /** 是否自动聚焦 */
  autoFocus?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
  /** 清除按钮回调 */
  onClear?: () => void;
  /** 自定义样式类名 */
  className?: string;
  /** 输入框变化时的回调（可用于防抖） */
  onInput?: (value: string) => void;
  /** 键盘事件处理 */
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

/**
 * 搜索输入框组件
 */
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      value,
      onChange,
      placeholder = 'Search files...',
      autoFocus = true,
      disabled = false,
      onClear,
      className,
      onInput,
      onKeyDown,
    },
    ref
  ) => {
    const internalRef = useRef<HTMLInputElement>(null);
    const inputRef = (ref as React.RefObject<HTMLInputElement>) || internalRef;

    // 自动聚焦
    useEffect(() => {
      if (autoFocus && inputRef.current && !disabled) {
        inputRef.current.focus({ preventScroll: true });
      }
    }, [autoFocus, disabled, inputRef]);

    // 处理输入变化
    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        onChange(newValue);
        onInput?.(newValue);
      },
      [onChange, onInput]
    );

    // 处理清除操作
    const handleClear = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onChange('');
        onClear?.();
        // 清除后重新聚焦
        setTimeout(() => {
          inputRef.current?.focus();
        }, 0);
      },
      [onChange, onClear, inputRef]
    );

    // 处理键盘事件
    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        onKeyDown?.(e);
      },
      [onKeyDown]
    );

    return (
      <div className={cn('relative flex items-center', className)}>
        {/* 搜索图标 */}
        <div className="absolute left-3 flex h-5 w-5 items-center justify-center text-muted-foreground pointer-events-none">
          <FaSearch className="h-4 w-4" />
        </div>

        {/* 输入框 */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'w-full rounded-lg border border-input bg-background pl-10 pr-10 py-2.5',
            'text-sm placeholder:text-muted-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'transition-all duration-200'
          )}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          aria-label="Search files"
          role="searchbox"
        />

        {/* 清除按钮 */}
        {value.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            disabled={disabled}
            className={cn(
              'absolute right-3 flex h-5 w-5 items-center justify-center',
              'rounded-full text-muted-foreground transition-colors',
              'hover:text-foreground hover:bg-muted',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50'
            )}
            aria-label="Clear search"
            tabIndex={-1}
          >
            <FaTimes className="h-3 w-3" />
          </button>
        )}
      </div>
    );
  }
);

// 添加 displayName 以便于调试
SearchInput.displayName = 'SearchInput';