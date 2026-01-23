# Office 文档主题适配 - 使用指南

本文档介绍如何使用 Office 文档主题适配功能，包括 CSS 变量注入和主题切换。

## 功能概述

- ✅ CSS 变量动态注入
- ✅ 主题模式切换（亮色/暗色）
- ✅ 主题颜色自定义
- ✅ 主题持久化（localStorage）
- ✅ 实时变量更新
- ✅ 从 Office 文档提取主题
- ✅ 平滑过渡动画

## 快速开始

### 1. 使用 Hook

```tsx
import { useOfficeTheme } from '@/client/hooks/useOfficeTheme';

function MyOfficeViewer() {
  const {
    themeMode,
    themeColors,
    setThemeMode,
    toggleThemeMode,
    setThemeColors,
    updateVariable,
  } = useOfficeTheme({
    containerSelector: '.office-document',
    enablePersistence: true,
  });

  return (
    <div>
      <button onClick={toggleThemeMode}>
        切换主题 ({themeMode})
      </button>
      <div className="office-document">
        {/* Office 文档内容 */}
      </div>
    </div>
  );
}
```

### 2. 使用主题切换组件

```tsx
import { OfficeThemeToggle, OfficeThemePicker } from '@/client/components/office';

function MyToolbar() {
  return (
    <div className="toolbar">
      <OfficeThemeToggle size="md" showLabel={true} />
      <OfficeThemePicker />
    </div>
  );
}
```

## API 参考

### useOfficeTheme Hook

主要的 Office 主题 Hook。

```typescript
interface OfficeThemeContextValue {
  /** 当前主题模式 */
  themeMode: OfficeThemeMode;
  /** 当前主题颜色 */
  themeColors: OfficeThemeColors;
  /** 主题配置 */
  config: OfficeThemeConfig;
  /** 是否正在更新 */
  isUpdating: boolean;
  /** 设置主题模式 */
  setThemeMode: (mode: OfficeThemeMode) => void;
  /** 切换主题模式 */
  toggleThemeMode: () => void;
  /** 设置主题颜色 */
  setThemeColors: (colors: Partial<OfficeThemeColors>) => void;
  /** 更新单个 CSS 变量 */
  updateVariable: (variableName: string, value: string, options?: OfficeVariableUpdateOptions) => void;
  /** 从 Office 文档提取主题 */
  extractThemeFromDocument: (document: Document | Element) => void;
  /** 重置主题 */
  resetTheme: () => void;
  /** 获取当前 CSS 变量值 */
  getVariableValue: (variableName: string) => string | null;
}
```

#### 参数

```typescript
interface UseOfficeThemeOptions {
  /** 容器选择器 */
  containerSelector?: string;
  /** 是否启用自动提取 */
  enableAutoExtract?: boolean;
  /** 是否启用持久化 */
  enablePersistence?: boolean;
  /** localStorage 键名 */
  storageKey?: string;
  /** 初始主题配置 */
  initialConfig?: Partial<OfficeThemeConfig>;
  /** 主题变化回调 */
  onThemeChange?: (themeMode: OfficeThemeMode, colors: OfficeThemeColors) => void;
}
```

#### 示例

```tsx
// 基本用法
const { themeMode, setThemeMode } = useOfficeTheme();

// 自定义选项
const { themeMode, setThemeColors } = useOfficeTheme({
  containerSelector: '#my-office-viewer',
  enablePersistence: true,
  storageKey: 'my-custom-theme',
  onThemeChange: (mode, colors) => {
    console.log('Theme changed:', mode, colors);
  },
});
```

### 专用 Hooks

#### useOfficeThemeMode

获取当前主题模式。

```tsx
import { useOfficeThemeMode } from '@/client/hooks/useOfficeTheme';

function MyComponent() {
  const themeMode = useOfficeThemeMode();
  const isDark = themeMode === 'dark';

  return <div className={isDark ? 'dark-mode' : 'light-mode'} />;
}
```

#### useOfficeThemeColors

获取当前主题颜色。

```tsx
import { useOfficeThemeColors } from '@/client/hooks/useOfficeTheme';

function MyComponent() {
  const themeColors = useOfficeThemeColors();

  return (
    <div style={{ color: themeColors.primaryColor }}>
      使用主题颜色
    </div>
  );
}
```

#### useOfficeThemeUpdater

获取主题更新函数。

```tsx
import { useOfficeThemeUpdater } from '@/client/hooks/useOfficeTheme';

function MyComponent() {
  const { setThemeMode, toggleThemeMode, updateVariable } = useOfficeThemeUpdater();

  return (
    <div>
      <button onClick={toggleThemeMode}>切换主题</button>
      <button onClick={() => setThemeMode('dark')}>深色模式</button>
    </div>
  );
}
```

#### useOfficeThemeExtractor

提取 Office 文档主题。

```tsx
import { useOfficeThemeExtractor } from '@/client/hooks/useOfficeTheme';

function MyComponent() {
  const { extractAndApply } = useOfficeThemeExtractor();

  const handleDocumentLoad = (doc: Document) => {
    extractAndApply(doc);
  };

  return <div onLoad={handleDocumentLoad} />;
}
```

#### useOfficeThemeReset

重置主题。

```tsx
import { useOfficeThemeReset } from '@/client/hooks/useOfficeTheme';

function MyComponent() {
  const { resetTheme } = useOfficeThemeReset();

  return <button onClick={resetTheme}>重置主题</button>;
}
```

#### useOfficeThemePersistence

主题持久化管理。

```tsx
import { useOfficeThemePersistence } from '@/client/hooks/useOfficeTheme';

function MyComponent() {
  const { saveTheme, loadTheme, clearTheme } = useOfficeThemePersistence({
    storageKey: 'my-theme',
  });

  return (
    <div>
      <button onClick={saveTheme}>保存主题</button>
      <button onClick={loadTheme}>加载主题</button>
      <button onClick={clearTheme}>清除主题</button>
    </div>
  );
}
```

### 组件

#### OfficeThemeToggle

主题切换按钮。

```tsx
import { OfficeThemeToggle } from '@/client/components/office';

// 基本用法
<OfficeThemeToggle />

// 带标签
<OfficeThemeToggle showLabel={true} />

// 自定义尺寸
<OfficeThemeToggle size="lg" />

// 自定义变体
<OfficeThemeToggle variant="outline" />

// 禁用状态
<OfficeThemeToggle disabled={true} />

// 带回调
<OfficeThemeToggle
  onToggle={(mode) => console.log('Theme changed to:', mode)}
  onThemeChange={(mode, colors) => console.log('Theme:', mode, colors)}
/>
```

#### OfficeThemeToggleCompact

紧凑版主题切换按钮。

```tsx
import { OfficeThemeToggleCompact } from '@/client/components/office';

<OfficeThemeToggleCompact />
```

#### OfficeThemePicker

主题选择器。

```tsx
import { OfficeThemePicker } from '@/client/components/office';

<OfficeThemePicker />
```

## CSS 变量

### 主题颜色变量

```css
:root {
  --office-primary-color: #0066cc;
  --office-secondary-color: #6b7280;
  --office-success-color: #10b981;
  --office-warning-color: #f59e0b;
  --office-error-color: #ef4444;
  --office-info-color: #3b82f6;
  --office-bg: #ffffff;
  --office-text: #0a0a0a;
  --office-border: #d4d4d4;
  --office-header-bg: #f3f4f6;
  --office-header-text: #0a0a0a;
  --office-cell-bg: #ffffff;
  --office-cell-text: #0a0a0a;
  --office-hover-bg: #e0f2fe;
  --office-hover-text: #0a0a0a;
  --office-selected-bg: #0066cc;
  --office-selected-text: #ffffff;
  --office-grid-line: #e5e7eb;
  --office-toolbar-bg: #ffffff;
  --office-toolbar-border: #d4d4d4;
  --office-scrollbar-track: #f3f4f6;
  --office-scrollbar-thumb: rgba(107, 114, 128, 0.3);
  --office-folder-color: #0066cc;
  --office-file-color: #6b7280;
  --office-expand-color: #6b7280;
  --office-font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --office-border-radius: 6px;
  --office-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  --office-transition: 200ms;
}
```

### 使用 CSS 变量

```css
.my-custom-element {
  background-color: var(--office-bg);
  color: var(--office-text);
  border: 1px solid var(--office-border);
  border-radius: var(--office-border-radius);
  transition: all var(--office-transition) ease-in-out;
}

.my-button {
  background-color: var(--office-primary-color);
  color: var(--office-selected-text);
}

.my-button:hover {
  background-color: var(--office-hover-bg);
  color: var(--office-hover-text);
}
```

## 主题提取

### 从 Office 文档自动提取主题

```tsx
import { useOfficeThemeExtractor } from '@/client/hooks/useOfficeTheme';

function ExcelViewer({ fileContent }) {
  const { extractAndApply } = useOfficeThemeExtractor();

  useEffect(() => {
    const container = document.querySelector('.excel-workbook');
    if (container) {
      extractAndApply(container);
    }
  }, [fileContent]);

  return <div className="excel-workbook">{/* Excel 内容 */}</div>;
}
```

### 手动提取主题颜色

```tsx
import { extractOfficeThemeColors } from '@/client/lib/officeThemeInjector';

const colors = extractOfficeThemeColors(document.querySelector('.excel-workbook'));
console.log('Extracted colors:', colors);
```

## 主题预设

### 内置主题预设

```tsx
import { DEFAULT_OFFICE_THEME_COLORS, DARK_OFFICE_THEME_COLORS } from '@/types/officeTheme';

// 使用浅色主题
setThemeColors(DEFAULT_OFFICE_THEME_COLORS);

// 使用深色主题
setThemeColors(DARK_OFFICE_THEME_COLORS);
```

### 自定义主题预设

```tsx
const myCustomTheme = {
  primaryColor: '#8b5cf6',
  backgroundColor: '#faf5ff',
  foregroundColor: '#4c1d95',
  borderColor: '#d8b4fe',
  headerBackgroundColor: '#f3e8ff',
  headerTextColor: '#4c1d95',
  cellBackgroundColor: '#faf5ff',
  cellTextColor: '#4c1d95',
  hoverBackgroundColor: '#e9d5ff',
  hoverTextColor: '#4c1d95',
  selectedBackgroundColor: '#8b5cf6',
  selectedTextColor: '#ffffff',
  // ... 其他颜色
};

setThemeColors(myCustomTheme);
```

## 类型定义

### OfficeThemeMode

```typescript
type OfficeThemeMode = 'light' | 'dark';
```

### OfficeThemeColors

```typescript
interface OfficeThemeColors {
  primaryColor: string;
  secondaryColor: string;
  successColor: string;
  warningColor: string;
  errorColor: string;
  infoColor: string;
  backgroundColor: string;
  foregroundColor: string;
  borderColor: string;
  headerBackgroundColor: string;
  headerTextColor: string;
  cellBackgroundColor: string;
  cellTextColor: string;
  hoverBackgroundColor: string;
  hoverTextColor: string;
  selectedBackgroundColor: string;
  selectedTextColor: string;
  gridLineColor: string;
  toolbarBackgroundColor: string;
  toolbarBorderColor: string;
  scrollbarTrackColor: string;
  scrollbarThumbColor: string;
  folderIconColor: string;
  fileIconColor: string;
  expandIndicatorColor: string;
  fontFamily: string;
  borderRadius: string;
  shadow: string;
  transitionDuration: number;
}
```

## 最佳实践

### 1. 在应用根组件中使用 ThemeProvider

```tsx
import { ThemeProvider } from '@/client/hooks/useTheme';

function App() {
  return (
    <ThemeProvider>
      <YourApp />
    </ThemeProvider>
  );
}
```

### 2. 在 Office 文档容器中使用 useOfficeTheme

```tsx
function OfficeDocumentViewer({ filePath }) {
  const { themeMode, setThemeMode } = useOfficeTheme({
    containerSelector: '.office-document',
  });

  return (
    <div className="office-document">
      <OfficeThemeToggle />
      {/* Office 文档内容 */}
    </div>
  );
}
```

### 3. 响应式主题切换

```tsx
function ResponsiveOfficeViewer() {
  const { themeMode, setThemeMode } = useOfficeTheme();

  useEffect(() => {
    // 监听系统主题变化
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      setThemeMode(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [setThemeMode]);

  return <div className="office-document" />;
}
```

### 4. 主题过渡动画

```tsx
const { themeMode, setThemeMode } = useOfficeTheme({
  initialConfig: {
    transitions: true,
    transitionDuration: 300,
  },
});
```

### 5. 主题持久化

```tsx
const { themeMode, setThemeMode } = useOfficeTheme({
  enablePersistence: true,
  storageKey: 'my-office-theme',
});
```

## 故障排除

### 主题没有更新

确保：
1. 容器选择器正确
2. CSS 变量名正确
3. 没有其他样式覆盖

```tsx
// 检查变量是否被正确设置
const value = getVariableValue('--office-primary-color');
console.log('Variable value:', value);
```

### 主题没有保存到 localStorage

检查：
1. 是否启用了持久化
2. localStorage 是否可用
3. 存储键名是否正确

```tsx
const { saveTheme, loadTheme } = useOfficeThemePersistence({
  storageKey: 'my-theme',
});

// 手动保存
saveTheme();

// 手动加载
loadTheme();
```

### 动画没有生效

确保：
1. 启用了过渡动画
2. 设置了过渡持续时间
3. 浏览器支持 CSS transitions

```tsx
const { setThemeColors } = useOfficeTheme({
  initialConfig: {
    transitions: true,
    transitionDuration: 200,
  },
});
```

## 示例项目

查看完整示例：
- [Office 文档查看器](../examples/office-viewer/)
- [主题自定义示例](../examples/theme-customizer/)
- [主题提取示例](../examples/theme-extractor/)

## 相关文档

- [Office 样式文件](./office-styles.md)
- [Office 渲染器架构](./office-architecture.md)
- [Office 快速入门](./office-quickstart.md)