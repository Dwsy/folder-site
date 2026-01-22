/**
 * 主题持久化测试
 * 
 * 测试主题持久化功能，包括：
 * - localStorage 持久化
 * - 跨标签页同步
 * - 主题数据迁移
 * - 错误处理
 * - 存储事件监听
 */

import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import { render, waitFor, act } from "@testing-library/react";
import { ThemeProvider, useTheme } from "../src/client/hooks/useTheme";

// 设置 DOM 环境
import { Window } from 'happy-dom';
const window = new Window();
global.window = window as any;
global.document = window.document;
global.HTMLElement = window.HTMLElement;
global.navigator = window.navigator;
global.screen = window.screen;

// 模拟 StorageEvent
if (!global.StorageEvent) {
  global.StorageEvent = class StorageEvent extends Event {
    key: string | null;
    newValue: string | null;
    oldValue: string | null;
    storageArea: Storage | null;
    url: string;

    constructor(type: string, eventInitDict?: StorageEventInit) {
      super(type);
      this.key = eventInitDict?.key || null;
      this.newValue = eventInitDict?.newValue || null;
      this.oldValue = eventInitDict?.oldValue || null;
      this.storageArea = eventInitDict?.storageArea || null;
      this.url = eventInitDict?.url || '';
    }
  } as any;
}

// 模拟 localStorage
let mockLocalStorage: Record<string, string> = {};

beforeEach(() => {
  // 清空模拟存储
  mockLocalStorage = {};
  
  // 模拟 localStorage
  global.localStorage = {
    getItem: (key: string) => mockLocalStorage[key] || null,
    setItem: (key: string, value: string) => {
      mockLocalStorage[key] = value;
    },
    removeItem: (key: string) => {
      delete mockLocalStorage[key];
    },
    clear: () => {
      mockLocalStorage = {};
    },
    length: Object.keys(mockLocalStorage).length,
    key: (index: number) => Object.keys(mockLocalStorage)[index] || null,
  } as Storage;
  
  // 模拟 matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => true,
    }),
  });
});

afterEach(() => {
  // 清理
  mockLocalStorage = {};
});

describe("localStorage 持久化", () => {
  it("应该将主题保存到 localStorage", async () => {
    let capturedSetTheme: ((mode: 'light' | 'dark' | 'auto') => void) | null = null;

    function TestComponent() {
      const { setTheme } = useTheme();
      capturedSetTheme = setTheme;
      return null;
    }

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(capturedSetTheme).not.toBeNull();
    });

    act(() => {
      capturedSetTheme!('dark');
    });

    await waitFor(() => {
      const stored = localStorage.getItem('folder-site-theme');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.mode).toBe('dark');
    });
  });

  it("应该从 localStorage 加载主题", async () => {
    localStorage.setItem('folder-site-theme', JSON.stringify({ mode: 'dark' }));

    let capturedTheme: string | null = null;

    function TestComponent() {
      const { theme } = useTheme();
      capturedTheme = theme;
      return null;
    }

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(capturedTheme).toBe('dark');
    });
  });

  it("应该保存自定义颜色到 localStorage", async () => {
    let capturedSetColors: ((colors: any) => void) | null = null;

    function TestComponent() {
      const { setColors } = useTheme();
      capturedSetColors = setColors;
      return null;
    }

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(capturedSetColors).not.toBeNull();
    });

    act(() => {
      capturedSetColors!({ primary: '#ff0000' });
    });

    await waitFor(() => {
      const stored = localStorage.getItem('folder-site-theme-colors');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.primary).toBe('#ff0000');
    });
  });

  it("应该从 localStorage 加载自定义颜色", async () => {
    localStorage.setItem('folder-site-theme-colors', JSON.stringify({ primary: '#00ff00' }));

    let capturedColors: any = null;

    function TestComponent() {
      const { colors } = useTheme();
      capturedColors = colors;
      return null;
    }

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(capturedColors).toBeTruthy();
      expect(capturedColors.primary).toBe('#00ff00');
    });
  });

  it("应该处理 localStorage 不可用的情况", async () => {
    // 模拟 localStorage 不可用
    const originalLocalStorage = global.localStorage;
    (global as any).localStorage = undefined;

    let capturedTheme: string | null = null;

    function TestComponent() {
      const { theme } = useTheme();
      capturedTheme = theme;
      return null;
    }

    // 不应该抛出错误
    expect(() => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );
    }).not.toThrow();

    await waitFor(() => {
      expect(capturedTheme).toBeTruthy();
    });

    // 恢复 localStorage
    global.localStorage = originalLocalStorage;
  });

  it("应该处理 localStorage.setItem 错误", async () => {
    // 模拟 setItem 抛出错误（例如存储配额已满）
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = () => {
      throw new Error('QuotaExceededError');
    };

    let capturedSetTheme: ((mode: 'light' | 'dark' | 'auto') => void) | null = null;

    function TestComponent() {
      const { setTheme } = useTheme();
      capturedSetTheme = setTheme;
      return null;
    }

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(capturedSetTheme).not.toBeNull();
    });

    // 不应该抛出错误
    expect(() => {
      act(() => {
        capturedSetTheme!('dark');
      });
    }).not.toThrow();

    // 恢复 setItem
    localStorage.setItem = originalSetItem;
  });

  it("应该处理 localStorage.getItem 错误", async () => {
    // 模拟 getItem 抛出错误
    const originalGetItem = localStorage.getItem;
    localStorage.getItem = () => {
      throw new Error('SecurityError');
    };

    let capturedTheme: string | null = null;

    function TestComponent() {
      const { theme } = useTheme();
      capturedTheme = theme;
      return null;
    }

    // 不应该抛出错误，应该使用默认值
    expect(() => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );
    }).not.toThrow();

    await waitFor(() => {
      expect(capturedTheme).toBeTruthy();
    });

    // 恢复 getItem
    localStorage.getItem = originalGetItem;
  });
});

describe("主题数据迁移", () => {
  it("应该迁移旧格式1: { theme: 'light' }", async () => {
    localStorage.setItem('folder-site-theme', JSON.stringify({ theme: 'light' }));

    let capturedTheme: string | null = null;

    function TestComponent() {
      const { theme } = useTheme();
      capturedTheme = theme;
      return null;
    }

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(capturedTheme).toBe('light');
    });

    // 验证已迁移到新格式
    const stored = localStorage.getItem('folder-site-theme');
    const parsed = JSON.parse(stored!);
    expect(parsed.mode).toBe('light');
  });

  it("应该迁移旧格式2: 直接存储字符串 'dark'", async () => {
    localStorage.setItem('folder-site-theme', '"dark"');

    let capturedTheme: string | null = null;

    function TestComponent() {
      const { theme } = useTheme();
      capturedTheme = theme;
      return null;
    }

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(capturedTheme).toBe('dark');
    });

    // 验证已迁移到新格式
    const stored = localStorage.getItem('folder-site-theme');
    const parsed = JSON.parse(stored!);
    expect(parsed.mode).toBe('dark');
  });

  it("应该迁移旧格式3: 不带引号的字符串", async () => {
    localStorage.setItem('folder-site-theme', 'light');

    let capturedTheme: string | null = null;

    function TestComponent() {
      const { theme } = useTheme();
      capturedTheme = theme;
      return null;
    }

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(capturedTheme).toBe('light');
    });
  });

  it("应该处理无效的主题数据", async () => {
    localStorage.setItem('folder-site-theme', 'invalid-data');

    let capturedTheme: string | null = null;

    function TestComponent() {
      const { theme } = useTheme();
      capturedTheme = theme;
      return null;
    }

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      // 应该使用默认值
      expect(capturedTheme).toBeTruthy();
      expect(['light', 'dark', 'auto']).toContain(capturedTheme);
    });
  });

  it("应该处理损坏的 JSON 数据", async () => {
    localStorage.setItem('folder-site-theme', '{ invalid json }');

    let capturedTheme: string | null = null;

    function TestComponent() {
      const { theme } = useTheme();
      capturedTheme = theme;
      return null;
    }

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      // 应该使用默认值
      expect(capturedTheme).toBeTruthy();
      expect(['light', 'dark', 'auto']).toContain(capturedTheme);
    });
  });

  it("应该保留新格式的数据", async () => {
    localStorage.setItem('folder-site-theme', JSON.stringify({ mode: 'auto' }));

    let capturedTheme: string | null = null;

    function TestComponent() {
      const { theme } = useTheme();
      capturedTheme = theme;
      return null;
    }

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(capturedTheme).toBe('auto');
    });

    // 验证格式未改变
    const stored = localStorage.getItem('folder-site-theme');
    const parsed = JSON.parse(stored!);
    expect(parsed.mode).toBe('auto');
  });
});

describe("跨标签页同步", () => {
  it("应该监听 storage 事件", async () => {
    let capturedTheme: string | null = null;

    function TestComponent() {
      const { theme } = useTheme();
      capturedTheme = theme;
      return null;
    }

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(capturedTheme).toBeTruthy();
    });

    const initialTheme = capturedTheme;

    // 模拟另一个标签页修改了主题
    const newTheme = initialTheme === 'light' ? 'dark' : 'light';
    const storageEvent = new StorageEvent('storage', {
      key: 'folder-site-theme',
      newValue: JSON.stringify({ mode: newTheme }),
      oldValue: JSON.stringify({ mode: initialTheme }),
      storageArea: localStorage,
      url: window.location.href,
    });

    act(() => {
      window.dispatchEvent(storageEvent);
    });

    await waitFor(() => {
      expect(capturedTheme).toBe(newTheme);
    });
  });

  it("应该同步自定义颜色", async () => {
    let capturedColors: any = null;

    function TestComponent() {
      const { colors } = useTheme();
      capturedColors = colors;
      return null;
    }

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(capturedColors).toBeTruthy();
    });

    // 模拟另一个标签页修改了颜色
    const storageEvent = new StorageEvent('storage', {
      key: 'folder-site-theme-colors',
      newValue: JSON.stringify({ primary: '#ff00ff' }),
      oldValue: null,
      storageArea: localStorage,
      url: window.location.href,
    });

    act(() => {
      window.dispatchEvent(storageEvent);
    });

    await waitFor(() => {
      expect(capturedColors.primary).toBe('#ff00ff');
    });
  });

  it("应该忽略无关的 storage 事件", async () => {
    let capturedTheme: string | null = null;

    function TestComponent() {
      const { theme } = useTheme();
      capturedTheme = theme;
      return null;
    }

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(capturedTheme).toBeTruthy();
    });

    const initialTheme = capturedTheme;

    // 模拟其他键的 storage 事件
    const storageEvent = new StorageEvent('storage', {
      key: 'other-key',
      newValue: 'some-value',
      oldValue: null,
      storageArea: localStorage,
      url: window.location.href,
    });

    act(() => {
      window.dispatchEvent(storageEvent);
    });

    await waitFor(() => {
      // 主题不应该改变
      expect(capturedTheme).toBe(initialTheme);
    });
  });

  it("应该处理无效的 storage 事件数据", async () => {
    let capturedTheme: string | null = null;

    function TestComponent() {
      const { theme } = useTheme();
      capturedTheme = theme;
      return null;
    }

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(capturedTheme).toBeTruthy();
    });

    const initialTheme = capturedTheme;

    // 模拟无效的 storage 事件
    const storageEvent = new StorageEvent('storage', {
      key: 'folder-site-theme',
      newValue: 'invalid json',
      oldValue: null,
      storageArea: localStorage,
      url: window.location.href,
    });

    // 不应该抛出错误
    expect(() => {
      act(() => {
        window.dispatchEvent(storageEvent);
      });
    }).not.toThrow();

    await waitFor(() => {
      // 主题不应该改变
      expect(capturedTheme).toBe(initialTheme);
    });
  });

  it("应该在组件卸载时清理事件监听器", async () => {
    const removeEventListenerSpy = mock(() => {});
    const originalRemoveEventListener = window.removeEventListener;
    window.removeEventListener = removeEventListenerSpy as any;

    function TestComponent() {
      useTheme();
      return null;
    }

    const { unmount } = render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(true).toBe(true);
    });

    unmount();

    await waitFor(() => {
      // 验证 removeEventListener 被调用
      expect(removeEventListenerSpy).toHaveBeenCalled();
    });

    // 恢复原始方法
    window.removeEventListener = originalRemoveEventListener;
  });
});

describe("持久化集成测试", () => {
  it("应该支持完整的持久化流程", async () => {
    let capturedSetTheme: ((mode: 'light' | 'dark' | 'auto') => void) | null = null;
    let capturedTheme: string | null = null;

    function TestComponent() {
      const { theme, setTheme } = useTheme();
      capturedSetTheme = setTheme;
      capturedTheme = theme;
      return null;
    }

    // 第一次渲染
    const { unmount } = render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(capturedTheme).toBeTruthy();
    });

    // 切换主题
    act(() => {
      capturedSetTheme!('dark');
    });

    await waitFor(() => {
      expect(capturedTheme).toBe('dark');
    });

    // 验证已保存
    const stored = localStorage.getItem('folder-site-theme');
    expect(stored).toBeTruthy();

    // 卸载组件
    unmount();

    // 重新渲染，应该加载保存的主题
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(capturedTheme).toBe('dark');
    });
  });

  it("应该支持跨标签页同步和持久化", async () => {
    let capturedTheme: string | null = null;

    function TestComponent() {
      const { theme } = useTheme();
      capturedTheme = theme;
      return null;
    }

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(capturedTheme).toBeTruthy();
    });

    // 模拟另一个标签页修改主题
    localStorage.setItem('folder-site-theme', JSON.stringify({ mode: 'auto' }));
    
    const storageEvent = new StorageEvent('storage', {
      key: 'folder-site-theme',
      newValue: JSON.stringify({ mode: 'auto' }),
      oldValue: JSON.stringify({ mode: capturedTheme }),
      storageArea: localStorage,
      url: window.location.href,
    });

    act(() => {
      window.dispatchEvent(storageEvent);
    });

    await waitFor(() => {
      expect(capturedTheme).toBe('auto');
    });

    // 验证 localStorage 已更新
    const stored = localStorage.getItem('folder-site-theme');
    const parsed = JSON.parse(stored!);
    expect(parsed.mode).toBe('auto');
  });

  it("应该支持主题迁移和持久化", async () => {
    // 设置旧格式的主题数据
    localStorage.setItem('folder-site-theme', JSON.stringify({ theme: 'dark' }));

    let capturedTheme: string | null = null;

    function TestComponent() {
      const { theme } = useTheme();
      capturedTheme = theme;
      return null;
    }

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(capturedTheme).toBe('dark');
    });

    // 验证已迁移到新格式
    const stored = localStorage.getItem('folder-site-theme');
    const parsed = JSON.parse(stored!);
    expect(parsed.mode).toBe('dark');
    expect(parsed.theme).toBeUndefined();
  });
});

describe("错误恢复", () => {
  it("应该在持久化失败后继续工作", async () => {
    // 模拟 setItem 失败
    const originalSetItem = localStorage.setItem;
    let setItemCallCount = 0;
    localStorage.setItem = () => {
      setItemCallCount++;
      if (setItemCallCount === 1) {
        throw new Error('QuotaExceededError');
      }
      originalSetItem.apply(localStorage, arguments as any);
    };

    let capturedSetTheme: ((mode: 'light' | 'dark' | 'auto') => void) | null = null;
    let capturedTheme: string | null = null;

    function TestComponent() {
      const { theme, setTheme } = useTheme();
      capturedSetTheme = setTheme;
      capturedTheme = theme;
      return null;
    }

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(capturedTheme).toBeTruthy();
    });

    // 第一次调用会失败
    act(() => {
      capturedSetTheme!('dark');
    });

    await waitFor(() => {
      // 主题应该在内存中更新
      expect(capturedTheme).toBe('dark');
    });

    // 第二次调用应该成功
    act(() => {
      capturedSetTheme!('light');
    });

    await waitFor(() => {
      expect(capturedTheme).toBe('light');
    });

    // 恢复原始方法
    localStorage.setItem = originalSetItem;
  });

  it("应该在读取失败后使用默认值", async () => {
    // 模拟 getItem 失败
    const originalGetItem = localStorage.getItem;
    localStorage.getItem = () => {
      throw new Error('SecurityError');
    };

    let capturedTheme: string | null = null;

    function TestComponent() {
      const { theme } = useTheme();
      capturedTheme = theme;
      return null;
    }

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      // 应该使用默认值
      expect(capturedTheme).toBeTruthy();
      expect(['light', 'dark', 'auto']).toContain(capturedTheme);
    });

    // 恢复原始方法
    localStorage.getItem = originalGetItem;
  });
});
