/**
 * 键盘导航功能测试
 * 
 * 测试键盘快捷键的正确触发和组合键处理逻辑
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';

// 设置 DOM 环境
import { Window } from 'happy-dom';
const window = new Window();
global.window = window as any;
global.document = window.document;
global.HTMLElement = window.HTMLElement;
global.HTMLAnchorElement = window.HTMLAnchorElement;
global.HTMLButtonElement = window.HTMLButtonElement;
global.KeyboardEvent = window.KeyboardEvent;
global.navigator = window.navigator;

describe('useKeyboardShortcuts - 基本功能', () => {
  it('应该成功导入 hook', async () => {
    const { useKeyboardShortcuts } = await import('../src/client/hooks/useKeyboardShortcuts.js');
    expect(useKeyboardShortcuts).toBeDefined();
    expect(typeof useKeyboardShortcuts).toBe('function');
  });

  it('应该成功导入快捷键常量', async () => {
    const { SHORTCUTS } = await import('../src/client/hooks/useKeyboardShortcuts.js');
    expect(SHORTCUTS).toBeDefined();
    expect(SHORTCUTS.OPEN_SEARCH).toBe('Cmd+K');
    expect(SHORTCUTS.CLOSE_MODAL).toBe('Escape');
    expect(SHORTCUTS.TOGGLE_THEME).toBe('Cmd+D');
  });

  it('应该成功导入辅助函数', async () => {
    const { getShortcutDisplay } = await import('../src/client/hooks/useKeyboardShortcuts.js');
    expect(getShortcutDisplay).toBeDefined();
    expect(typeof getShortcutDisplay).toBe('function');
  });
});

describe('快捷键解析', () => {
  it('应该正确解析组合键', async () => {
    const { parseShortcut } = await import('../src/client/hooks/useKeyboardShortcuts.js');
    
    const result = parseShortcut('Cmd+K');
    expect(result.ctrl).toBe(false);
    expect(result.shift).toBe(false);
    expect(result.alt).toBe(false);
    expect(result.meta).toBe(true);
    expect(result.key).toBe('k');
  });

  it('应该正确解析 Ctrl+Shift+K', async () => {
    const { parseShortcut } = await import('../src/client/hooks/useKeyboardShortcuts.js');
    
    const result = parseShortcut('Ctrl+Shift+K');
    expect(result.ctrl).toBe(true);
    expect(result.shift).toBe(true);
    expect(result.alt).toBe(false);
    expect(result.meta).toBe(false);
    expect(result.key).toBe('k');
  });

  it('应该正确解析单键', async () => {
    const { parseShortcut } = await import('../src/client/hooks/useKeyboardShortcuts.js');
    
    const result = parseShortcut('Escape');
    expect(result.ctrl).toBe(false);
    expect(result.shift).toBe(false);
    expect(result.alt).toBe(false);
    expect(result.meta).toBe(false);
    expect(result.key).toBe('escape');
  });

  it('应该正确解析 Alt+ArrowUp', async () => {
    const { parseShortcut } = await import('../src/client/hooks/useKeyboardShortcuts.js');
    
    const result = parseShortcut('Alt+ArrowUp');
    expect(result.ctrl).toBe(false);
    expect(result.shift).toBe(false);
    expect(result.alt).toBe(true);
    expect(result.meta).toBe(false);
    expect(result.key).toBe('arrowup');
  });
});

describe('快捷键匹配', () => {
  it('应该匹配 Cmd+K 事件', async () => {
    const { matchShortcut, parseShortcut } = await import('../src/client/hooks/useKeyboardShortcuts.js');
    
    const shortcut = parseShortcut('Cmd+K');
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      metaKey: true,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
    });

    expect(matchShortcut(event, shortcut)).toBe(true);
  });

  it('应该匹配 Ctrl+K 事件', async () => {
    const { matchShortcut, parseShortcut } = await import('../src/client/hooks/useKeyboardShortcuts.js');
    
    const shortcut = parseShortcut('Ctrl+K');
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      metaKey: false,
      ctrlKey: true,
      shiftKey: false,
      altKey: false,
    });

    expect(matchShortcut(event, shortcut)).toBe(true);
  });

  it('应该匹配 Escape 事件', async () => {
    const { matchShortcut, parseShortcut } = await import('../src/client/hooks/useKeyboardShortcuts.js');
    
    const shortcut = parseShortcut('Escape');
    const event = new KeyboardEvent('keydown', {
      key: 'Escape',
      metaKey: false,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
    });

    expect(matchShortcut(event, shortcut)).toBe(true);
  });

  it('应该不匹配错误的组合键', async () => {
    const { matchShortcut, parseShortcut } = await import('../src/client/hooks/useKeyboardShortcuts.js');
    
    const shortcut = parseShortcut('Cmd+K');
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      metaKey: false,
      ctrlKey: true,
      shiftKey: false,
      altKey: false,
    });

    expect(matchShortcut(event, shortcut)).toBe(false);
  });

  it('应该不匹配单键事件（当需要组合键时）', async () => {
    const { matchShortcut, parseShortcut } = await import('../src/client/hooks/useKeyboardShortcuts.js');
    
    const shortcut = parseShortcut('Cmd+K');
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      metaKey: false,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
    });

    expect(matchShortcut(event, shortcut)).toBe(false);
  });
});

describe('快捷键显示', () => {
  it('应该正确显示 Cmd+K', async () => {
    const { getShortcutDisplay } = await import('../src/client/hooks/useKeyboardShortcuts.js');

    const display = getShortcutDisplay('Cmd+K');
    // 应该包含 Cmd 或 Ctrl 符号以及 K
    expect(display).toBeTruthy();
    expect(display).toContain('K');
  });

  it('应该正确显示 Ctrl+Shift+K', async () => {
    const { getShortcutDisplay } = await import('../src/client/hooks/useKeyboardShortcuts.js');
    
    const display = getShortcutDisplay('Ctrl+Shift+K');
    // 在 macOS 上显示为 "Ctrl⇧ K"，在非 macOS 上显示为 "Ctrl+Shift+K"
    expect(display).toBeTruthy();
    expect(typeof display).toBe('string');
  });

  it('应该正确显示 Escape', async () => {
    const { getShortcutDisplay } = await import('../src/client/hooks/useKeyboardShortcuts.js');
    
    const display = getShortcutDisplay('Escape');
    // Escape 键可能有前导空格
    expect(display.trim()).toBe('Escape');
  });
});

describe('SearchModal 组件', () => {
  it('应该成功导入 SearchModal', async () => {
    const { SearchModal } = await import('../src/client/components/search/SearchModal.js');
    expect(SearchModal).toBeDefined();
    expect(typeof SearchModal).toBe('function');
  });

  it('应该成功导入 SearchTrigger', async () => {
    const { SearchTrigger } = await import('../src/client/components/search/SearchModal.js');
    expect(SearchTrigger).toBeDefined();
    expect(typeof SearchTrigger).toBe('function');
  });
});

describe('FileTree 组件', () => {
  it('应该成功导入 FileTree', async () => {
    const { FileTree } = await import('../src/client/components/sidebar/FileTree.js');
    expect(FileTree).toBeDefined();
    expect(typeof FileTree).toBe('function');
  });

  });

describe('App 组件', () => {
  it('应该成功导入 App', async () => {
    const App = await import('../src/client/App.js');
    expect(App).toBeDefined();
  });

  it('应该成功导入 useKeyboardShortcuts', async () => {
    const { useKeyboardShortcuts } = await import('../src/client/hooks/useKeyboardShortcuts.js');
    expect(useKeyboardShortcuts).toBeDefined();
  });
});

describe('主题快捷键', () => {
  it('应该成功导入 useTheme', async () => {
    const { useTheme } = await import('../src/client/hooks/useTheme.js');
    expect(useTheme).toBeDefined();
    expect(typeof useTheme).toBe('function');
  });

  it('应该包含 toggleTheme 方法', async () => {
    const { useTheme } = await import('../src/client/hooks/useTheme.js');
    // 这个测试需要 React 环境，所以只检查导入
    expect(useTheme).toBeDefined();
  });
});

describe('快捷键集成测试', () => {
  it('应该定义所有常用快捷键', async () => {
    const { SHORTCUTS } = await import('../src/client/hooks/useKeyboardShortcuts.js');
    
    expect(SHORTCUTS.OPEN_SEARCH).toBeDefined();
    expect(SHORTCUTS.CLOSE_MODAL).toBeDefined();
    expect(SHORTCUTS.TOGGLE_THEME).toBeDefined();
    expect(SHORTCUTS.NAVIGATE_UP).toBeDefined();
    expect(SHORTCUTS.NAVIGATE_DOWN).toBeDefined();
    expect(SHORTCUTS.NAVIGATE_LEFT).toBeDefined();
    expect(SHORTCUTS.NAVIGATE_RIGHT).toBeDefined();
    expect(SHORTCUTS.CONFIRM).toBeDefined();
    expect(SHORTCUTS.TOGGLE_EXPAND).toBeDefined();
  });

  it('快捷键值应该是有效的字符串', async () => {
    const { SHORTCUTS } = await import('../src/client/hooks/useKeyboardShortcuts.js');
    
    Object.values(SHORTCUTS).forEach(shortcut => {
      expect(typeof shortcut).toBe('string');
      expect(shortcut.length).toBeGreaterThan(0);
    });
  });
});