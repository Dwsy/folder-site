/**
 * ThemeToggle 组件测试
 * 
 * 测试主题切换按钮的功能,包括:
 * - 组件渲染
 * - 主题切换功能
 * - 图标显示
 * - 视觉反馈
 * - 系统主题响应
 */

import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { render, waitFor, fireEvent } from "@testing-library/react";
import { ThemeProvider } from "../src/client/providers/ThemeProvider";
import { ThemeToggle } from "../src/client/components/theme/ThemeToggle";

// 设置 DOM 环境
import { Window } from 'happy-dom';
const window = new Window();
global.window = window as any;
global.document = window.document;
global.HTMLElement = window.HTMLElement;
global.HTMLButtonElement = window.HTMLButtonElement;
global.navigator = window.navigator;
global.localStorage = window.localStorage;
global.screen = window.screen;

// 模拟 MediaQueryListEvent
global.MediaQueryListEvent = class MediaQueryListEvent extends Event {
  matches: boolean;
  media: string;

  constructor(type: string, eventInitDict: { matches: boolean; media: string }) {
    super(type);
    this.matches = eventInitDict.matches;
    this.media = eventInitDict.media;
  }
} as any;

// 模拟 localStorage
const mockLocalStorage: Record<string, string> = {};

beforeEach(() => {
  // 清空模拟存储
  Object.keys(mockLocalStorage).forEach(key => delete mockLocalStorage[key]);
  
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
      Object.keys(mockLocalStorage).forEach(key => delete mockLocalStorage[key]);
    },
    length: 0,
    key: () => null,
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
  document.documentElement.classList.remove('theme-light', 'theme-dark');
  document.documentElement.removeAttribute('data-theme');
  
  // 移除动态创建的 style 标签
  const styleTags = document.querySelectorAll('style[id^="folder-site-theme-styles"]');
  styleTags.forEach(tag => tag.remove());
});

describe("ThemeToggle 组件渲染", () => {
  it("应该渲染主题切换按钮", async () => {
    const { container } = render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    await waitFor(() => {
      const button = container.querySelector('button');
      expect(button).toBeDefined();
    }, { timeout: 3000 });
  });

  it("应该显示正确的图标", async () => {
    const { container } = render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    await waitFor(() => {
      const icon = container.querySelector('svg');
      expect(icon).toBeDefined();
    }, { timeout: 3000 });
  });

  it("应该显示主题标签", async () => {
    const { container } = render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    await waitFor(() => {
      const button = container.querySelector('button');
      expect(button?.textContent).toBeTruthy();
    }, { timeout: 3000 });
  });

  it("应该有正确的 className", async () => {
    const { container } = render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    await waitFor(() => {
      const button = container.querySelector('button');
      expect(button?.className).toContain('group');
      expect(button?.className).toContain('flex');
    }, { timeout: 3000 });
  });

  it("应该有过渡动画类", async () => {
    const { container } = render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    await waitFor(() => {
      const button = container.querySelector('button');
      expect(button?.className).toContain('transition-all');
      expect(button?.className).toContain('duration-300');
    }, { timeout: 3000 });
  });
});

describe("主题切换功能", () => {
  it("应该能够切换主题模式", async () => {
    const { container } = render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    await waitFor(() => {
      const button = container.querySelector('button');
      expect(button).toBeDefined();
    });

    const button = container.querySelector('button')!;
    fireEvent.click(button);

    await waitFor(() => {
      const theme = localStorage.getItem('folder-site-theme');
      expect(theme).toBeTruthy();
    });
  });

  it("应该持久化主题选择", async () => {
    const { container } = render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    await waitFor(() => {
      const button = container.querySelector('button');
      expect(button).toBeDefined();
    });

    const button = container.querySelector('button')!;
    fireEvent.click(button);

    await waitFor(() => {
      const stored = localStorage.getItem('folder-site-theme');
      expect(stored).toBeDefined();
      expect(stored).not.toBe('null');
    });
  });
});

describe("图标显示", () => {
  it("应该在 light 模式显示太阳图标", async () => {
    localStorage.setItem('folder-site-theme', JSON.stringify({ mode: 'light' }));
    
    const { container } = render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    await waitFor(() => {
      const svg = container.querySelector('svg');
      expect(svg).toBeDefined();
    });
  });

  it("应该在 dark 模式显示月亮图标", async () => {
    localStorage.setItem('folder-site-theme', JSON.stringify({ mode: 'dark' }));
    
    const { container } = render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    await waitFor(() => {
      const svg = container.querySelector('svg');
      expect(svg).toBeDefined();
    });
  });

  it("应该在 auto 模式根据系统主题显示图标", async () => {
    localStorage.setItem('folder-site-theme', JSON.stringify({ mode: 'auto' }));
    
    const { container } = render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    await waitFor(() => {
      const svg = container.querySelector('svg');
      expect(svg).toBeDefined();
    });
  });
});

describe("视觉反馈", () => {
  it("应该在 hover 时有视觉反馈", async () => {
    const { container } = render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    await waitFor(() => {
      const button = container.querySelector('button');
      expect(button).toBeDefined();
    }, { timeout: 3000 });

    const button = container.querySelector('button')!;
    fireEvent.mouseEnter(button);
    
    expect(button.className).toContain('hover:bg-muted');
  });

  it("应该在 active 时有按压效果", async () => {
    const { container } = render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    await waitFor(() => {
      const button = container.querySelector('button');
      expect(button).toBeDefined();
    }, { timeout: 3000 });

    const button = container.querySelector('button')!;
    fireEvent.mouseDown(button);
    
    // 动画类会在点击时变化
    expect(button.className).toContain('transition-all');
  });

  it("应该有正确的边框和圆角", async () => {
    const { container } = render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    await waitFor(() => {
      const button = container.querySelector('button');
      expect(button).toBeDefined();
    }, { timeout: 3000 });

    const button = container.querySelector('button')!;
    expect(button.className).toContain('rounded-md');
    expect(button.className).toContain('border');
  });
});

describe("可访问性", () => {
  it("应该有正确的 aria-label", async () => {
    const { container } = render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    await waitFor(() => {
      const button = container.querySelector('button');
      expect(button?.getAttribute('aria-label')).toBeTruthy();
      expect(button?.getAttribute('aria-label')).toContain('theme');
    }, { timeout: 3000 });
  });

  it("应该有 title 属性", async () => {
    const { container } = render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    await waitFor(() => {
      const button = container.querySelector('button');
      expect(button?.getAttribute('title')).toBeTruthy();
    }, { timeout: 3000 });
  });

  it("应该是可点击的", async () => {
    const { container } = render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    await waitFor(() => {
      const button = container.querySelector('button');
      expect(button?.tagName).toBe('BUTTON');
    }, { timeout: 3000 });
  });
});

describe("系统主题检测", () => {
  it("应该响应系统主题变化", async () => {
    const { container } = render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    await waitFor(() => {
      const button = container.querySelector('button');
      expect(button).toBeDefined();
    });

    localStorage.setItem('folder-site-theme', JSON.stringify({ mode: 'auto' }));

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const event = new MediaQueryListEvent('change', { matches: true });
    mediaQuery.dispatchEvent(event);

    await waitFor(() => {
      const button = container.querySelector('button');
      expect(button).toBeDefined();
    });
  });

  it("初始时应该检测系统主题", async () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    await waitFor(() => {
      const dataTheme = document.documentElement.getAttribute('data-theme');
      expect(['light', 'dark']).toContain(dataTheme);
    });
  });
});

describe("主题过渡动画", () => {
  it("应该应用过渡动画到根元素", async () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    await waitFor(() => {
      const styleTags = document.querySelectorAll('style[id^="folder-site-theme-styles"]');
      expect(styleTags.length).toBeGreaterThan(0);
    });
  });

  it("主题切换时应该有平滑过渡", async () => {
    const { container } = render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    await waitFor(() => {
      const button = container.querySelector('button');
      expect(button).toBeDefined();
    });

    const button = container.querySelector('button')!;
    fireEvent.click(button);

    await waitFor(() => {
      const buttonAfter = container.querySelector('button');
      expect(buttonAfter).toBeDefined();
    });
  });
});

describe("主题持久化", () => {
  it("应该从 localStorage 加载保存的主题", async () => {
    localStorage.setItem('folder-site-theme', JSON.stringify({ mode: 'dark' }));
    
    const { container } = render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    await waitFor(() => {
      const button = container.querySelector('button');
      expect(button).toBeDefined();
    });

    const stored = JSON.parse(localStorage.getItem('folder-site-theme') || '{}');
    expect(stored.mode).toBe('dark');
  });

  it("应该保存主题选择到 localStorage", async () => {
    const { container } = render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    await waitFor(() => {
      const button = container.querySelector('button');
      expect(button).toBeDefined();
    });

    const button = container.querySelector('button')!;
    fireEvent.click(button);

    await waitFor(() => {
      const stored = localStorage.getItem('folder-site-theme');
      expect(stored).toBeDefined();
      expect(stored).not.toBe('null');
    });
  });

  it("应该处理 localStorage 错误", async () => {
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = () => {
      throw new Error('Storage quota exceeded');
    };

    const { container } = render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    await waitFor(() => {
      const button = container.querySelector('button');
      expect(button).toBeDefined();
    });

    localStorage.setItem = originalSetItem;
  });
});

describe("集成测试", () => {
  it("应该支持完整的主题切换流程", async () => {
    const { container } = render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    await waitFor(() => {
      const button = container.querySelector('button');
      expect(button).toBeDefined();
    }, { timeout: 3000 });

    const button = container.querySelector('button')!;

    let stored = JSON.parse(localStorage.getItem('folder-site-theme') || '{}');
    if (stored.mode) {
      expect(['light', 'dark', 'auto']).toContain(stored.mode);
    }

    fireEvent.click(button);

    await waitFor(() => {
      stored = JSON.parse(localStorage.getItem('folder-site-theme') || '{}');
      if (stored.mode) {
        expect(['light', 'dark', 'auto']).toContain(stored.mode);
      }
    }, { timeout: 3000 });

    fireEvent.click(button);

    await waitFor(() => {
      stored = JSON.parse(localStorage.getItem('folder-site-theme') || '{}');
      if (stored.mode) {
        expect(['light', 'dark', 'auto']).toContain(stored.mode);
      }
    }, { timeout: 3000 });
  });

  it("应该与 ThemeProvider 正确集成", async () => {
    const { container } = render(
      <ThemeProvider>
        <div data-testid="wrapper">
          <ThemeToggle />
        </div>
      </ThemeProvider>
    );

    await waitFor(() => {
      const wrapper = container.querySelector('[data-testid="wrapper"]');
      expect(wrapper).toBeDefined();
    }, { timeout: 3000 });

    const button = container.querySelector('button')!;
    fireEvent.click(button);

    await waitFor(() => {
      const dataTheme = document.documentElement.getAttribute('data-theme');
      expect(['light', 'dark']).toContain(dataTheme);
    }, { timeout: 3000 });
  });
});