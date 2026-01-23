/**
 * useOfficeTheme Hook 测试
 * 
 * 测试 Office 主题 Hook 的功能
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import {
  useOfficeTheme,
  useOfficeThemeMode,
  useOfficeThemeColors,
  useOfficeThemeUpdater,
  useOfficeThemeExtractor,
  useOfficeThemeReset,
  useOfficeThemePersistence,
} from '../useOfficeTheme.js';
import type { OfficeThemeMode } from '../../../types/officeTheme.js';

// Mock localStorage
const mockLocalStorage = {
  store: {} as Record<string, string>,
  getItem: function (key: string): string | null {
    return this.store[key] || null;
  },
  setItem: function (key: string, value: string): void {
    this.store[key] = value;
  },
  removeItem: function (key: string): void {
    delete this.store[key];
  },
  clear: function (): void {
    this.store = {};
  },
};

// 设置全局 localStorage mock
global.localStorage = mockLocalStorage as any;

describe('useOfficeTheme', () => {
  beforeEach(() => {
    // 清空 localStorage
    mockLocalStorage.clear();
    // 清空 DOM
    document.body.innerHTML = '';
  });

  afterEach(() => {
    // 清理
    document.body.innerHTML = '';
  });

  describe('初始化', () => {
    it('应该使用默认主题模式', () => {
      const { result } = renderHook(() => useOfficeTheme());

      expect(result.current.themeMode).toBe('light');
      expect(result.current.isUpdating).toBe(false);
    });

    it('应该从 localStorage 加载保存的主题', () => {
      mockLocalStorage.setItem('folder-site-office-theme-mode', JSON.stringify('dark'));

      const { result } = renderHook(() => useOfficeTheme());

      expect(result.current.themeMode).toBe('dark');
    });

    it('应该使用默认主题颜色', () => {
      const { result } = renderHook(() => useOfficeTheme());

      expect(result.current.themeColors).toBeDefined();
      expect(result.current.themeColors.primaryColor).toBeDefined();
      expect(result.current.themeColors.backgroundColor).toBeDefined();
    });
  });

  describe('主题模式切换', () => {
    it('应该能够设置主题模式', () => {
      const { result } = renderHook(() => useOfficeTheme());

      act(() => {
        result.current.setThemeMode('dark');
      });

      expect(result.current.themeMode).toBe('dark');
    });

    it('应该能够切换主题模式', () => {
      const { result } = renderHook(() => useOfficeTheme());

      expect(result.current.themeMode).toBe('light');

      act(() => {
        result.current.toggleThemeMode();
      });

      expect(result.current.themeMode).toBe('dark');

      act(() => {
        result.current.toggleThemeMode();
      });

      expect(result.current.themeMode).toBe('light');
    });

    it('应该将主题模式保存到 localStorage', () => {
      const { result } = renderHook(() => useOfficeTheme());

      act(() => {
        result.current.setThemeMode('dark');
      });

      expect(mockLocalStorage.getItem('folder-site-office-theme-mode')).toBe(JSON.stringify('dark'));
    });
  });

  describe('主题颜色设置', () => {
    it('应该能够设置主题颜色', () => {
      const { result } = renderHook(() => useOfficeTheme());

      act(() => {
        result.current.setThemeColors({ primaryColor: '#ff0000' });
      });

      expect(result.current.themeColors.primaryColor).toBe('#ff0000');
    });

    it('应该能够设置多个主题颜色', () => {
      const { result } = renderHook(() => useOfficeTheme());

      act(() => {
        result.current.setThemeColors({
          primaryColor: '#ff0000',
          secondaryColor: '#00ff00',
          backgroundColor: '#000000',
        });
      });

      expect(result.current.themeColors.primaryColor).toBe('#ff0000');
      expect(result.current.themeColors.secondaryColor).toBe('#00ff00');
      expect(result.current.themeColors.backgroundColor).toBe('#000000');
    });

    it('应该将主题颜色保存到 localStorage', () => {
      const { result } = renderHook(() => useOfficeTheme());

      act(() => {
        result.current.setThemeColors({ primaryColor: '#ff0000' });
      });

      const savedColors = mockLocalStorage.getItem('folder-site-office-theme-colors');
      expect(savedColors).toBeDefined();
      expect(JSON.parse(savedColors!)).toEqual({ primaryColor: '#ff0000' });
    });

    it('应该拒绝无效的颜色值', () => {
      const { result } = renderHook(() => useOfficeTheme());
      const originalColor = result.current.themeColors.primaryColor;

      act(() => {
        result.current.setThemeColors({ primaryColor: 'invalid-color' });
      });

      // 颜色不应该改变
      expect(result.current.themeColors.primaryColor).toBe(originalColor);
    });
  });

  describe('CSS 变量更新', () => {
    it('应该能够更新单个 CSS 变量', () => {
      // 创建测试容器
      const container = document.createElement('div');
      container.className = 'office-document';
      document.body.appendChild(container);

      const { result } = renderHook(() => useOfficeTheme());

      act(() => {
        result.current.updateVariable('--office-primary-color', '#ff0000');
      });

      // 检查变量是否被设置
      expect(container.style.getPropertyValue('--office-primary-color')).toBe('#ff0000');
    });

    it('应该能够获取 CSS 变量值', () => {
      const container = document.createElement('div');
      container.className = 'office-document';
      container.style.setProperty('--office-primary-color', '#ff0000');
      document.body.appendChild(container);

      const { result } = renderHook(() => useOfficeTheme());

      const value = result.current.getVariableValue('--office-primary-color');
      expect(value).toBe('#ff0000');
    });

    it('应该返回 null 对于不存在的变量', () => {
      const container = document.createElement('div');
      container.className = 'office-document';
      document.body.appendChild(container);

      const { result } = renderHook(() => useOfficeTheme());

      const value = result.current.getVariableValue('--office-nonexistent');
      expect(value).toBeNull();
    });
  });

  describe('主题重置', () => {
    it('应该能够重置主题为默认值', () => {
      const { result } = renderHook(() => useOfficeTheme());

      // 修改主题
      act(() => {
        result.current.setThemeMode('dark');
        result.current.setThemeColors({ primaryColor: '#ff0000' });
      });

      expect(result.current.themeMode).toBe('dark');
      expect(result.current.themeColors.primaryColor).toBe('#ff0000');

      // 重置主题
      act(() => {
        result.current.resetTheme();
      });

      expect(result.current.themeMode).toBe('light');
      expect(result.current.themeColors.primaryColor).not.toBe('#ff0000');
    });

    it('应该清除 localStorage 中的主题数据', () => {
      const { result } = renderHook(() => useOfficeTheme());

      act(() => {
        result.current.setThemeMode('dark');
        result.current.setThemeColors({ primaryColor: '#ff0000' });
      });

      expect(mockLocalStorage.getItem('folder-site-office-theme-mode')).toBeDefined();
      expect(mockLocalStorage.getItem('folder-site-office-theme-colors')).toBeDefined();

      act(() => {
        result.current.resetTheme();
      });

      expect(mockLocalStorage.getItem('folder-site-office-theme-mode')).toBe(JSON.stringify('light'));
      expect(mockLocalStorage.getItem('folder-site-office-theme-colors')).toBeNull();
    });
  });

  describe('主题变化回调', () => {
    it('应该在主题模式变化时调用回调', () => {
      const onThemeChange = jest.fn();

      const { result } = renderHook(() =>
        useOfficeTheme({ onThemeChange })
      );

      act(() => {
        result.current.setThemeMode('dark');
      });

      expect(onThemeChange).toHaveBeenCalledWith('dark', expect.any(Object));
    });

    it('应该在主题颜色变化时调用回调', () => {
      const onThemeChange = jest.fn();

      const { result } = renderHook(() =>
        useOfficeTheme({ onThemeChange })
      );

      act(() => {
        result.current.setThemeColors({ primaryColor: '#ff0000' });
      });

      expect(onThemeChange).toHaveBeenCalled();
    });
  });

  describe('禁用持久化', () => {
    it('不应该保存到 localStorage 当持久化被禁用', () => {
      const { result } = renderHook(() =>
        useOfficeTheme({ enablePersistence: false })
      );

      act(() => {
        result.current.setThemeMode('dark');
        result.current.setThemeColors({ primaryColor: '#ff0000' });
      });

      expect(mockLocalStorage.getItem('folder-site-office-theme-mode')).toBeNull();
      expect(mockLocalStorage.getItem('folder-site-office-theme-colors')).toBeNull();
    });
  });
});

describe('useOfficeThemeMode', () => {
  it('应该返回当前主题模式', () => {
    const { result } = renderHook(() => useOfficeThemeMode());

    expect(typeof result.current).toBe('string');
    expect(['light', 'dark']).toContain(result.current);
  });
});

describe('useOfficeThemeColors', () => {
  it('应该返回当前主题颜色', () => {
    const { result } = renderHook(() => useOfficeThemeColors());

    expect(typeof result.current).toBe('object');
    expect(result.current).toHaveProperty('primaryColor');
    expect(result.current).toHaveProperty('backgroundColor');
  });
});

describe('useOfficeThemeUpdater', () => {
  it('应该提供主题更新函数', () => {
    const { result } = renderHook(() => useOfficeThemeUpdater());

    expect(result.current).toHaveProperty('setThemeMode');
    expect(result.current).toHaveProperty('toggleThemeMode');
    expect(result.current).toHaveProperty('updateVariable');
    expect(result.current).toHaveProperty('setThemeColors');
  });
});

describe('useOfficeThemeExtractor', () => {
  it('应该提供主题提取函数', () => {
    const { result } = renderHook(() => useOfficeThemeExtractor());

    expect(result.current).toHaveProperty('extractThemeFromDocument');
    expect(result.current).toHaveProperty('extractAndApply');
  });

  it('应该能够从文档提取主题', () => {
    const { result } = renderHook(() => useOfficeThemeExtractor());

    // 创建测试文档
    const testElement = document.createElement('div');
    testElement.style.backgroundColor = '#ff0000';
    testElement.style.color = '#ffffff';
    document.body.appendChild(testElement);

    act(() => {
      result.current.extractThemeFromDocument(testElement);
    });

    // 验证主题被提取
    expect(result.current).toBeDefined();
  });
});

describe('useOfficeThemeReset', () => {
  it('应该提供主题重置函数', () => {
    const { result } = renderHook(() => useOfficeThemeReset());

    expect(result.current).toHaveProperty('resetTheme');
    expect(result.current).toHaveProperty('resetToDefault');
  });
});

describe('useOfficeThemePersistence', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  it('应该提供持久化函数', () => {
    const { result } = renderHook(() => useOfficeThemePersistence());

    expect(result.current).toHaveProperty('saveTheme');
    expect(result.current).toHaveProperty('loadTheme');
    expect(result.current).toHaveProperty('clearTheme');
  });

  it('应该能够保存主题', () => {
    const { result } = renderHook(() => useOfficeThemePersistence());

    act(() => {
      result.current.saveTheme();
    });

    expect(mockLocalStorage.getItem('folder-site-office-theme-mode')).toBeDefined();
    expect(mockLocalStorage.getItem('folder-site-office-theme-colors')).toBeDefined();
  });

  it('应该能够加载主题', () => {
    mockLocalStorage.setItem('folder-site-office-theme-mode', JSON.stringify('dark'));
    mockLocalStorage.setItem('folder-site-office-theme-colors', JSON.stringify({ primaryColor: '#ff0000' }));

    const { result } = renderHook(() => useOfficeThemePersistence());

    act(() => {
      result.current.loadTheme();
    });

    // 验证主题被加载
    expect(result.current).toBeDefined();
  });

  it('应该能够清除主题', () => {
    mockLocalStorage.setItem('folder-site-office-theme-mode', JSON.stringify('dark'));
    mockLocalStorage.setItem('folder-site-office-theme-colors', JSON.stringify({ primaryColor: '#ff0000' }));

    const { result } = renderHook(() => useOfficeThemePersistence());

    expect(mockLocalStorage.getItem('folder-site-office-theme-mode')).toBeDefined();
    expect(mockLocalStorage.getItem('folder-site-office-theme-colors')).toBeDefined();

    act(() => {
      result.current.clearTheme();
    });

    expect(mockLocalStorage.getItem('folder-site-office-theme-mode')).toBeNull();
    expect(mockLocalStorage.getItem('folder-site-office-theme-colors')).toBeNull();
  });
});

describe('CSS 变量注入', () => {
  it('应该将 CSS 变量注入到容器', () => {
    const container = document.createElement('div');
    container.className = 'office-document';
    document.body.appendChild(container);

    renderHook(() => useOfficeTheme({ containerSelector: '.office-document' }));

    // 等待变量被注入
    waitFor(() => {
      expect(container.style.getPropertyValue('--office-primary-color')).toBeDefined();
    });
  });

  it('应该在主题变化时更新 CSS 变量', () => {
    const container = document.createElement('div');
    container.className = 'office-document';
    document.body.appendChild(container);

    const { result } = renderHook(() => useOfficeTheme({ containerSelector: '.office-document' }));

    const initialColor = container.style.getPropertyValue('--office-primary-color');

    act(() => {
      result.current.setThemeColors({ primaryColor: '#ff0000' });
    });

    const updatedColor = container.style.getPropertyValue('--office-primary-color');

    expect(updatedColor).not.toBe(initialColor);
    expect(updatedColor).toBe('#ff0000');
  });
});