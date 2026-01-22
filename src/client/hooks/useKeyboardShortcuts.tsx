/**
 * useKeyboardShortcuts Hook
 *
 * 全局键盘快捷键管理 Hook
 *
 * 功能特性：
 * - 支持组合键（如 Cmd/Ctrl + K）
 * - 支持单键快捷键（如 Escape）
 * - 防止浏览器默认行为
 * - 自动清理事件监听器
 * - 支持跨平台（macOS 用 metaKey，其他用 ctrlKey）
 * - 支持条件触发（如仅在特定元素聚焦时）
 * - TypeScript 类型安全
 */

import { useEffect, useCallback, useRef } from 'react';

/**
 * 快捷键配置
 */
export interface ShortcutConfig {
  /** 快捷键描述（用于调试） */
  description?: string;
  /** 是否阻止默认行为 */
  preventDefault?: boolean;
  /** 触发条件函数 */
  when?: () => boolean;
  /** 是否在输入框中触发 */
  allowInInput?: boolean;
}

/**
 * 快捷键定义
 *
 * 支持的格式：
 * - 单键：'Escape', 'Enter', 'Space'
 * - 组合键：'Cmd+K', 'Ctrl+K', 'Ctrl+Shift+K', 'Alt+ArrowUp'
 * - 特殊键：'Meta+K' (macOS Cmd 键)
 */
export type ShortcutKey = string;

/**
 * 快捷键映射配置
 */
export interface ShortcutMap {
  /** 快捷键 */
  key: ShortcutKey;
  /** 回调函数 */
  callback: (event: KeyboardEvent) => void;
  /** 快捷键配置 */
  config?: ShortcutConfig;
}

/**
 * 解析快捷键字符串
 *
 * @param shortcut 快捷键字符串（如 'Cmd+K', 'Ctrl+Shift+K'）
 * @returns 解析后的快捷键信息
 */
export function parseShortcut(shortcut: ShortcutKey): {
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
  meta: boolean;
  key: string;
} {
  const parts = shortcut.toLowerCase().split('+');
  const modifiers = parts.slice(0, -1);
  const key = parts[parts.length - 1];

  return {
    ctrl: modifiers.includes('ctrl'),
    shift: modifiers.includes('shift'),
    alt: modifiers.includes('alt'),
    meta: modifiers.includes('meta') || modifiers.includes('cmd'),
    key: normalizeKey(key),
  };
}

/**
 * 规范化按键名称
 *
 * @param key 按键名称
 * @returns 规范化后的按键名称
 */
function normalizeKey(key: string): string {
  const normalized = key.toLowerCase();

  // 特殊键映射
  const specialKeys: Record<string, string> = {
    ' ': ' ',
    'space': ' ',
    'arrowup': 'arrowup',
    'arrowdown': 'arrowdown',
    'arrowleft': 'arrowleft',
    'arrowright': 'arrowright',
    'enter': 'enter',
    'escape': 'escape',
    'tab': 'tab',
    'backspace': 'backspace',
    'delete': 'delete',
    'insert': 'insert',
    'home': 'home',
    'end': 'end',
    'pageup': 'pageup',
    'pagedown': 'pagedown',
  };

  return specialKeys[normalized] || normalized;
}

/**
 * 判断键盘事件是否匹配快捷键
 *
 * @param event 键盘事件
 * @param shortcut 快捷键配置
 * @returns 是否匹配
 */
export function matchShortcut(event: KeyboardEvent, shortcut: {
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
  meta: boolean;
  key: string;
}): boolean {
  // 跨平台：macOS 上 Cmd 键对应 metaKey，其他平台 Ctrl 键对应 ctrlKey
  const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  const usesMeta = isMac && shortcut.meta;
  const usesCtrl = !isMac && shortcut.ctrl;

  // 检查修饰键
  const ctrlMatch = shortcut.ctrl ? event.ctrlKey : !event.ctrlKey;
  const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
  const altMatch = shortcut.alt ? event.altKey : !event.altKey;
  const metaMatch = shortcut.meta ? event.metaKey : !event.metaKey;

  // 检查按键
  const keyMatch = normalizeKey(event.key) === shortcut.key;

  // 特殊处理：跨平台 Cmd/Ctrl
  const modifierMatch = usesMeta ? event.metaKey : usesCtrl ? event.ctrlKey : true;

  return (
    ctrlMatch &&
    shiftMatch &&
    altMatch &&
    metaMatch &&
    keyMatch &&
    modifierMatch
  );
}

/**
 * 判断是否在输入元素中
 *
 * @param event 键盘事件
 * @returns 是否在输入元素中
 */
function isInInputElement(event: KeyboardEvent): boolean {
  const target = event.target as HTMLElement;
  const tagName = target?.tagName?.toLowerCase();

  const inputTags = ['input', 'textarea', 'select'];
  const editableElements = document.querySelectorAll('[contenteditable="true"]');

  return (
    inputTags.includes(tagName) ||
    Array.from(editableElements).includes(target)
  );
}

/**
 * useKeyboardShortcuts Hook
 *
 * @param shortcuts 快捷键映射数组
 * @param deps 依赖项数组
 *
 * @example
 * ```tsx
 * useKeyboardShortcuts([
 *   {
 *     key: 'Cmd+K',
 *     callback: () => setSearchOpen(true),
 *     config: { description: 'Open search', preventDefault: true }
 *   },
 *   {
 *     key: 'Escape',
 *     callback: () => setSearchOpen(false),
 *     config: { description: 'Close modal' }
 *   },
 *   {
 *     key: 'Cmd+D',
 *     callback: () => toggleTheme(),
 *     config: { description: 'Toggle theme' }
 *   }
 * ]);
 * ```
 */
export function useKeyboardShortcuts(
  shortcuts: ShortcutMap[],
  deps: any[] = []
): void {
  const shortcutsRef = useRef(shortcuts);

  // 更新 ref 以保持最新值
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const currentShortcuts = shortcutsRef.current;

    for (const shortcut of currentShortcuts) {
      const parsed = parseShortcut(shortcut.key);

      // 检查是否匹配快捷键
      if (!matchShortcut(event, parsed)) {
        continue;
      }

      // 检查触发条件
      if (shortcut.config?.when && !shortcut.config.when()) {
        continue;
      }

      // 检查是否在输入元素中
      if (!shortcut.config?.allowInInput && isInInputElement(event)) {
        continue;
      }

      // 执行回调
      shortcut.callback(event);

      // 阻止默认行为
      if (shortcut.config?.preventDefault !== false) {
        event.preventDefault();
      }

      // 只执行第一个匹配的快捷键
      break;
    }
  }, []);

  useEffect(() => {
    // 添加事件监听器
    window.addEventListener('keydown', handleKeyDown, { passive: false });

    // 清理函数
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, deps]);
}

/**
 * useKey Hook
 *
 * 监听单个按键
 *
 * @param key 按键名称
 * @param callback 回调函数
 * @param options 配置选项
 * @param deps 依赖项数组
 *
 * @example
 * ```tsx
 * useKey('Escape', () => closeModal(), { preventDefault: true });
 * useKey('ArrowDown', () => selectNext());
 * ```
 */
export function useKey(
  key: string,
  callback: (event: KeyboardEvent) => void,
  options?: Partial<ShortcutConfig>,
  deps: any[] = []
): void {
  useKeyboardShortcuts(
    [
      {
        key,
        callback,
        config: options,
      },
    ],
    deps
  );
}

/**
 * useKeyCombo Hook
 *
 * 监听组合键
 *
 * @param combo 组合键（如 'Cmd+K', 'Ctrl+Shift+K'）
 * @param callback 回调函数
 * @param options 配置选项
 * @param deps 依赖项数组
 *
 * @example
 * ```tsx
 * useKeyCombo('Cmd+K', () => setSearchOpen(true));
 * useKeyCombo('Ctrl+Shift+N', () => createNewFile());
 * ```
 */
export function useKeyCombo(
  combo: string,
  callback: (event: KeyboardEvent) => void,
  options?: Partial<ShortcutConfig>,
  deps: any[] = []
): void {
  useKeyboardShortcuts(
    [
      {
        key: combo,
        callback,
        config: options,
      },
    ],
    deps
  );
}

/**
 * 获取快捷键显示文本
 *
 * @param shortcut 快捷键字符串
 * @returns 格式化的快捷键显示文本
 *
 * @example
 * ```tsx
 * getShortcutDisplay('Cmd+K') // '⌘ K' (macOS) / 'Ctrl+K' (Windows/Linux)
 * getShortcutDisplay('Ctrl+Shift+K') // '⇧⌘ K' (macOS) / 'Ctrl+Shift+K' (Windows/Linux)
 * ```
 */
export function getShortcutDisplay(shortcut: string): string {
  const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  const parts = shortcut.toLowerCase().split('+');
  const modifiers = parts.slice(0, -1);
  const key = parts[parts.length - 1];

  const displayModifiers: string[] = [];

  if (modifiers.includes('meta') || modifiers.includes('cmd')) {
    displayModifiers.push(isMac ? '⌘' : 'Ctrl');
  } else if (modifiers.includes('ctrl')) {
    displayModifiers.push('Ctrl');
  }

  if (modifiers.includes('shift')) {
    displayModifiers.push(isMac ? '⇧' : 'Shift');
  }

  if (modifiers.includes('alt')) {
    displayModifiers.push(isMac ? '⌥' : 'Alt');
  }

  // 格式化主键
  const displayKey = key.charAt(0).toUpperCase() + key.slice(1);

  if (isMac) {
    return displayModifiers.join('') + ' ' + displayKey;
  } else {
    return [...displayModifiers, displayKey].join('+');
  }
}

/**
 * 常用快捷键常量
 */
export const SHORTCUTS = {
  /** 打开搜索 */
  OPEN_SEARCH: 'Cmd+K',
  /** 关闭模态框 */
  CLOSE_MODAL: 'Escape',
  /** 切换主题 */
  TOGGLE_THEME: 'Cmd+D',
  /** 向上导航 */
  NAVIGATE_UP: 'ArrowUp',
  /** 向下导航 */
  NAVIGATE_DOWN: 'ArrowDown',
  /** 向左导航 */
  NAVIGATE_LEFT: 'ArrowLeft',
  /** 向右导航 */
  NAVIGATE_RIGHT: 'ArrowRight',
  /** 确认选择 */
  CONFIRM: 'Enter',
  /** 展开/折叠 */
  TOGGLE_EXPAND: 'Space',
  /** 新建文件 */
  NEW_FILE: 'Cmd+N',
  /** 保存文件 */
  SAVE: 'Cmd+S',
  /** 查找 */
  FIND: 'Cmd+F',
} as const;

/**
 * 快捷键类型
 */
export type ShortcutKeyConstant = typeof SHORTCUTS[keyof typeof SHORTCUTS];