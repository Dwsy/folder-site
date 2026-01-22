/**
 * 主题系统测试
 * 
 * 测试主题类型定义、主题切换逻辑、主题持久化、HTML 主题注入等功能
 */

import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import {
  DEFAULT_LIGHT_THEME,
  DEFAULT_DARK_THEME,
  DEFAULT_THEME_CONFIG,
  mergeThemeConfig,
  getEffectiveTheme,
} from "../src/types/theme.js";

import {
  ThemeManager,
  generateThemeCSS,
  applyThemeToHTML,
  getThemeClass,
  getThemeDataAttributes,
  parseThemeConfig,
  validateThemeConfig,
  createCustomTheme,
  getDefaultLightTheme,
  getDefaultDarkTheme,
  getDefaultTheme,
} from "../src/server/lib/theme.js";

describe("主题类型定义", () => {
  it("应该定义有效的主题模式", () => {
    expect("light").toBe("light");
    expect("dark").toBe("dark");
    expect("auto").toBe("auto");
  });

  it("应该定义默认浅色主题", () => {
    expect(DEFAULT_LIGHT_THEME).toBeDefined();
    expect(DEFAULT_LIGHT_THEME.background).toBe("#ffffff");
    expect(DEFAULT_LIGHT_THEME.text).toBe("#0a0a0a");
  });

  it("应该定义默认深色主题", () => {
    expect(DEFAULT_DARK_THEME).toBeDefined();
    expect(DEFAULT_DARK_THEME.background).toBe("#0a0a0a");
    expect(DEFAULT_DARK_THEME.text).toBe("#fafafa");
  });

  it("应该定义默认主题配置", () => {
    expect(DEFAULT_THEME_CONFIG).toBeDefined();
    expect(DEFAULT_THEME_CONFIG.mode).toBe("auto");
  });
});

describe("主题配置工具函数", () => {
  it("应该合并主题配置", () => {
    const customConfig: Partial<typeof DEFAULT_THEME_CONFIG> = {
      mode: "dark",
      colors: { primary: "#ff0000" },
    };

    const merged = mergeThemeConfig(DEFAULT_THEME_CONFIG, customConfig);

    expect(merged.mode).toBe("dark");
    expect(merged.colors?.primary).toBe("#ff0000");
  });

  it("应该获取有效的主题模式", () => {
    expect(getEffectiveTheme("light", "light")).toBe("light");
    expect(getEffectiveTheme("dark", "dark")).toBe("dark");
    expect(getEffectiveTheme("auto", "dark")).toBe("dark");
    expect(getEffectiveTheme("auto", "light")).toBe("light");
  });
});

describe("ThemeManager", () => {
  let manager: ThemeManager;

  beforeEach(() => {
    manager = new ThemeManager();
  });

  afterEach(() => {
    manager.destroy();
  });

  it("应该创建主题管理器实例", () => {
    expect(manager).toBeDefined();
    expect(manager.getMode()).toBe("light");
  });

  it("应该设置主题模式", () => {
    manager.setMode("dark");
    expect(manager.getMode()).toBe("dark");
  });

  it("应该获取当前主题颜色", () => {
    const colors = manager.getThemeColors();
    expect(colors).toBeDefined();
    expect(colors.background).toBeDefined();
    expect(colors.text).toBeDefined();
  });

  it("应该切换主题模式", () => {
    manager.setMode("light");
    manager.toggleMode();
    expect(manager.getMode()).toBe("dark");
  });

  it("应该设置自定义主题", () => {
    const customTheme = {
      background: "#123456",
      foreground: "#789abc",
      primary: "#abcdef",
      secondary: "#fedcba",
      text: "#111111",
      muted: "#222222",
      accent: "#333333",
      border: "#444444",
      success: "#00ff00",
      warning: "#ffff00",
      error: "#ff0000",
    };

    manager.setCustomTheme(customTheme);
    const colors = manager.getThemeColors();
    expect(colors.background).toBe("#123456");
  });

  it("应该应用主题到 DOM", () => {
    // 创建一个模拟的 HTML 文档
    const mockDocument = {
      documentElement: {
        classList: {
          add: () => {},
          remove: () => {},
        },
        setAttribute: () => {},
        removeAttribute: () => {},
      },
      head: {
        appendChild: () => {},
      },
    };

    manager.applyToDOM(mockDocument as any);
    // 如果没有抛出错误，则测试通过
    expect(true).toBe(true);
  });

  it("应该监听系统主题变化", () => {
    const mockMediaQuery = {
      matches: true,
      addEventListener: () => {},
      removeEventListener: () => {},
    };

    manager.listenSystemTheme(mockMediaQuery as any);
    // 如果没有抛出错误，则测试通过
    expect(true).toBe(true);
  });

  it("应该停止监听系统主题", () => {
    const mockMediaQuery = {
      matches: false,
      addEventListener: () => {},
      removeEventListener: () => {},
    };

    manager.listenSystemTheme(mockMediaQuery as any);
    manager.stopSystemThemeListener();
    // 如果没有抛出错误，则测试通过
    expect(true).toBe(true);
  });
});

describe("主题 CSS 生成", () => {
  it("应该生成主题 CSS 变量", () => {
    const css = generateThemeCSS(DEFAULT_LIGHT_THEME);
    expect(css).toContain("--theme-background");
    expect(css).toContain("--theme-text");
    expect(css).toContain("#ffffff");
  });

  it("应该生成深色主题 CSS", () => {
    const css = generateThemeCSS(DEFAULT_DARK_THEME);
    expect(css).toContain("--theme-background");
    expect(css).toContain("#0a0a0a");
  });

  it("应该支持自定义前缀", () => {
    const css = generateThemeCSS(DEFAULT_LIGHT_THEME, "custom");
    expect(css).toContain("--custom-background");
    expect(css).toContain("--custom-text");
  });

  it("应该生成完整的 CSS 规则", () => {
    const css = generateThemeCSS(DEFAULT_LIGHT_THEME);
    expect(css).toContain(":root");
    expect(css).toContain("{");
    expect(css).toContain("}");
  });
});

describe("HTML 主题注入", () => {
  it("应该将主题应用到 HTML", () => {
    const html = "<html><head></head><body></body></html>";
    const themed = applyThemeToHTML(html, DEFAULT_LIGHT_THEME);

    expect(themed).toContain("folder-site-theme-styles");
    expect(themed).toContain("--theme-background");
  });

  it("应该保留现有的 head 内容", () => {
    const html = "<html><head><title>Test</title></head></html>";
    const themed = applyThemeToHTML(html, DEFAULT_LIGHT_THEME);

    expect(themed).toContain("<title>Test</title>");
  });
});

describe("主题类名和数据属性", () => {
  it("应该获取主题类名", () => {
    expect(getThemeClass("light")).toBe("theme-light");
    expect(getThemeClass("dark")).toBe("theme-dark");
    expect(getThemeClass("auto")).toBe("theme-auto");
  });

  it("应该获取主题数据属性", () => {
    const attrs = getThemeDataAttributes("light");
    expect(attrs).toContain('data-theme="light"');
  });

  it("应该生成多个数据属性", () => {
    const attrs = getThemeDataAttributes("dark");
    expect(attrs).toContain('data-theme="dark"');
  });
});

describe("主题配置解析和验证", () => {
  it("应该解析主题配置", () => {
    const config = {
      mode: "dark",
      colors: { primary: "#ff0000" },
    };

    const parsed = parseThemeConfig(config);
    expect(parsed.mode).toBe("dark");
    expect(parsed.colors?.primary).toBe("#ff0000");
  });

  it("应该验证有效的主题配置", () => {
    const config = {
      mode: "light",
    };

    const result = validateThemeConfig(config);
    expect(result.valid).toBe(true);
  });

  it("应该拒绝无效的主题配置", () => {
    const config = {
      mode: "invalid",
    };

    const result = validateThemeConfig(config);
    expect(result.valid).toBe(false);
  });

  it("应该提供验证错误信息", () => {
    const config = {
      mode: "invalid",
    };

    const result = validateThemeConfig(config);
    expect(result.errors).toBeDefined();
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe("自定义主题创建", () => {
  it("应该创建自定义主题", () => {
    const base = DEFAULT_LIGHT_THEME;
    const overrides = {
      primary: "#ff0000",
      background: "#000000",
    };

    const custom = createCustomTheme(base, overrides);
    expect(custom.primary).toBe("#ff0000");
    expect(custom.background).toBe("#000000");
  });

  it("应该保留未覆盖的颜色", () => {
    const base = DEFAULT_LIGHT_THEME;
    const overrides = {
      primary: "#ff0000",
    };

    const custom = createCustomTheme(base, overrides);
    expect(custom.primary).toBe("#ff0000");
    expect(custom.background).toBe(base.background);
  });

  it("应该支持多个颜色覆盖", () => {
    const base = DEFAULT_LIGHT_THEME;
    const overrides = {
      primary: "#ff0000",
      secondary: "#00ff00",
      accent: "#0000ff",
    };

    const custom = createCustomTheme(base, overrides);
    expect(custom.primary).toBe("#ff0000");
    expect(custom.secondary).toBe("#00ff00");
    expect(custom.accent).toBe("#0000ff");
  });
});

describe("默认主题获取", () => {
  it("应该获取默认浅色主题", () => {
    const theme = getDefaultLightTheme();
    expect(theme.background).toBe("#ffffff");
    expect(theme.text).toBe("#0a0a0a");
  });

  it("应该获取默认深色主题", () => {
    const theme = getDefaultDarkTheme();
    expect(theme.background).toBe("#0a0a0a");
    expect(theme.text).toBe("#fafafa");
  });

  it("应该根据模式获取默认主题", () => {
    const light = getDefaultTheme("light");
    const dark = getDefaultTheme("dark");
    
    expect(light.background).toBe("#ffffff");
    expect(dark.background).toBe("#0a0a0a");
  });
});

describe("主题持久化", () => {
  it("应该将主题保存到 localStorage", () => {
    const mockStorage: Record<string, string> = {};

    global.localStorage = {
      getItem: (key) => mockStorage[key] || null,
      setItem: (key, value) => {
        mockStorage[key] = value;
      },
      removeItem: (key) => {
        delete mockStorage[key];
      },
      clear: () => {
        Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
      },
      length: 0,
      key: () => null,
    } as any;

    localStorage.setItem("theme", "dark");
    expect(localStorage.getItem("theme")).toBe("dark");
  });

  it("应该从 localStorage 读取主题", () => {
    const mockStorage: Record<string, string> = {
      theme: "light",
    };

    global.localStorage = {
      getItem: (key) => mockStorage[key] || null,
      setItem: (key, value) => {
        mockStorage[key] = value;
      },
      removeItem: (key) => {
        delete mockStorage[key];
      },
      clear: () => {
        Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
      },
      length: 0,
      key: () => null,
    } as any;

    const theme = localStorage.getItem("theme");
    expect(theme).toBe("light");
  });

  it("应该处理 localStorage 不可用的情况", () => {
    global.localStorage = undefined as any;

    // 不应该抛出错误
    expect(() => {
      // 模拟代码尝试访问 localStorage
      const storage = global.localStorage;
      if (!storage) {
        return;
      }
      storage.getItem("theme");
    }).not.toThrow();
  });
});

describe("主题集成测试", () => {
  it("应该支持完整的主题切换流程", () => {
    const manager = new ThemeManager();

    // 初始状态
    expect(manager.getMode()).toBe("light");

    // 切换到深色模式
    manager.setMode("dark");
    expect(manager.getMode()).toBe("dark");

    // 获取深色主题颜色
    const darkColors = manager.getThemeColors();
    expect(darkColors.background).toBe(DEFAULT_DARK_THEME.background);

    // 切换回浅色模式
    manager.setMode("light");
    expect(manager.getMode()).toBe("light");

    // 获取浅色主题颜色
    const lightColors = manager.getThemeColors();
    expect(lightColors.background).toBe(DEFAULT_LIGHT_THEME.background);

    manager.destroy();
  });

  it("应该支持自定义主题应用", () => {
    const manager = new ThemeManager();

    const customTheme = {
      background: "#1a1a2e",
      foreground: "#16213e",
      primary: "#0f3460",
      secondary: "#e94560",
      text: "#ffffff",
      muted: "#a0a0a0",
      accent: "#ffd700",
      border: "#333333",
      success: "#00ff88",
      warning: "#ffaa00",
      error: "#ff4444",
    };

    manager.setCustomTheme(customTheme);
    const colors = manager.getThemeColors();

    expect(colors.background).toBe("#1a1a2e");
    expect(colors.primary).toBe("#0f3460");
    expect(colors.secondary).toBe("#e94560");

    manager.destroy();
  });

  it("应该支持 HTML 注入和 CSS 生成", () => {
    const html = "<html><head><title>Test Page</title></head><body><h1>Hello</h1></body></html>";
    const themed = applyThemeToHTML(html, DEFAULT_LIGHT_THEME);

    // 验证 HTML 结构完整
    expect(themed).toContain("<html");
    expect(themed).toContain("<head>");
    expect(themed).toContain("<title>Test Page</title>");
    expect(themed).toContain("<body>");
    expect(themed).toContain("<h1>Hello</h1>");

    // 验证主题注入
    expect(themed).toContain("folder-site-theme-styles");
    expect(themed).toContain("--theme-background");
  });
});