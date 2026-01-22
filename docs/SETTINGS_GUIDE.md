# Settings 功能测试指南

## 功能概述

在底栏添加了设置按钮（⚙️），点击后可以打开设置面板，支持以下功能：

1. **主题切换**: Light（浅色）、Dark（深色）、Auto（跟随系统）
2. **字体切换**: System（系统字体）、Serif（衬线字体）、Monospace（等宽字体）、Cursive（手写字体）
3. **字体大小**: Small（小）、Medium（中）、Large（大）、Extra Large（特大）
4. **重置默认**: 一键恢复所有设置到默认值

## 如何测试

### 1. 启动开发服务器

```bash
bun run dev:client
```

服务器将在 `http://localhost:3011/` 启动。

### 2. 打开浏览器

访问 `http://localhost:3011/`。

### 3. 测试主题切换

1. 点击页面底部的设置按钮（⚙️）
2. 在设置面板中，点击 "Light" 按钮
3. 观察页面是否切换到浅色主题
4. 点击 "Dark" 按钮
5. 观察页面是否切换到深色主题
6. 点击 "Auto" 按钮
7. 观察页面是否跟随系统主题

### 4. 测试字体切换

1. 在设置面板中，找到 "Font Family" 部分
2. 点击 "System" 按钮
3. 观察页面字体是否变为系统字体
4. 点击 "Serif" 按钮
5. 观察页面字体是否变为衬线字体
6. 点击 "Monospace" 按钮
7. 观察页面字体是否变为等宽字体
8. 点击 "Cursive" 按钮
9. 观察页面字体是否变为手写字体

### 5. 测试字体大小

1. 在设置面板中，找到 "Font Size" 部分
2. 点击 "Small" 按钮
3. 观察页面文字是否变小
4. 点击 "Medium" 按钮
5. 观察页面文字是否变为中等大小
6. 点击 "Large" 按钮
7. 观察页面文字是否变大
8. 点击 "Extra Large" 按钮
9. 观察页面文字是否变得更大

### 6. 测试重置默认

1. 修改主题、字体和字体大小
2. 点击设置面板底部的 "Reset to Defaults" 按钮
3. 观察所有设置是否恢复到默认值（Light 主题、System 字体、Medium 字体大小）

### 7. 测试持久化

1. 修改主题、字体和字体大小
2. 关闭浏览器标签页
3. 重新打开 `http://localhost:3011/`
4. 观察设置是否保持之前的值

## 技术实现

### 文件结构

```
src/client/
├── components/
│   └── settings/
│       ├── SettingsPanel.tsx    # 设置面板组件
│       ├── SettingsButton.tsx   # 设置按钮组件
│       └── index.ts             # 导出文件
├── layouts/
│   └── MainLayout.tsx           # 主布局（包含底栏和设置面板）
└── styles/
    └── globals.css              # 全局样式（包含字体变量）
```

### 功能特性

1. **响应式设计**: 设置面板在移动端和桌面端都能正常显示
2. **动画效果**: 面板打开/关闭有平滑的过渡动画
3. **无障碍支持**: 
   - 所有按钮都有 `aria-label` 和 `aria-pressed` 属性
   - 支持键盘导航
   - 支持屏幕阅读器
4. **状态持久化**: 所有设置都保存到 `localStorage`
5. **跨标签页同步**: 使用 `storage` 事件实现跨标签页设置同步

### CSS 变量

设置功能使用以下 CSS 变量：

```css
--font-family: Inter, system-ui, sans-serif;
--font-size: 16px;
```

### localStorage 键名

- `folder-site-theme`: 主题设置
- `folder-site-font-family`: 字体设置
- `folder-site-font-size`: 字体大小设置

## 已知问题

1. 部分字体可能需要从 Google Fonts 或其他 CDN 加载
2. 在某些浏览器中，字体切换可能有短暂的延迟
3. 移动端设置面板可能需要额外的优化

## 未来改进

1. 添加更多字体选项
2. 添加字体粗细调节
3. 添加行高调节
4. 添加自定义颜色主题
5. 添加导出/导入设置功能
6. 添加预设主题配置

## 贡献

如果你发现任何问题或有改进建议，请提交 Issue 或 Pull Request。