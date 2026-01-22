# 错误边界组件文档

## 概述

错误边界（Error Boundary）是 React 组件，用于捕获其子组件树中任何位置的 JavaScript 错误，记录这些错误，并显示回退 UI，而不是让整个应用崩溃。

## 组件

### ErrorBoundary

主要的错误边界组件，使用 React Class 组件实现。

#### Props

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `children` | `ReactNode` | - | 要包裹的子组件 |
| `fallback` | `ReactNode` | - | 自定义的错误回退 UI |
| `onError` | `(error: Error, errorInfo: ErrorInfo) => void` | - | 错误发生时的回调函数 |
| `showDetails` | `boolean` | `true` | 是否显示错误详情 |
| `enableLogging` | `boolean` | `true` | 是否启用错误日志记录 |

#### 基本用法

```tsx
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <YourComponent />
    </ErrorBoundary>
  );
}
```

#### 自定义错误处理

```tsx
function App() {
  const handleError = (error: Error, errorInfo: ErrorInfo) => {
    // 发送错误到日志服务
    logErrorToService(error, errorInfo);
  };

  return (
    <ErrorBoundary onError={handleError}>
      <YourComponent />
    </ErrorBoundary>
  );
}
```

#### 自定义回退 UI

```tsx
function App() {
  const CustomFallback = () => (
    <div>
      <h1>出错了</h1>
      <button onClick={() => window.location.reload()}>刷新页面</button>
    </div>
  );

  return (
    <ErrorBoundary fallback={<CustomFallback />}>
      <YourComponent />
    </ErrorBoundary>
  );
}
```

### ErrorFallback

默认的错误回退 UI 组件，提供友好的错误提示和恢复选项。

#### Props

| 属性 | 类型 | 描述 |
|------|------|------|
| `error` | `Error \| null` | 错误对象 |
| `errorInfo` | `ErrorInfo \| null` | React 错误信息 |
| `errorId` | `string` | 唯一错误 ID |
| `showDetails` | `boolean` | 是否显示错误详情 |
| `onReset` | `() => void` | 重试回调 |
| `onReload` | `() => void` | 刷新页面回调 |
| `onGoHome` | `() => void` | 返回首页回调 |
| `onCopyError` | `() => void` | 复制错误信息回调 |

#### 自定义 ErrorFallback

```tsx
import { ErrorFallback, type ErrorFallbackProps } from './components/ErrorFallback';

function MyErrorFallback(props: ErrorFallbackProps) {
  return (
    <div className="custom-error">
      <h1>自定义错误页面</h1>
      <ErrorFallback {...props} />
    </div>
  );
}
```

### useErrorHandler Hook

用于在组件内部主动抛出错误的 Hook。

```tsx
import { useErrorHandler } from './components/ErrorBoundary';

function MyComponent() {
  const handleError = useErrorHandler();

  const handleClick = () => {
    try {
      // 一些可能出错的操作
      riskyOperation();
    } catch (error) {
      handleError(error);
    }
  };

  return <button onClick={handleClick}>执行操作</button>;
}
```

## 功能特性

### 1. 错误捕获

- 捕获子组件树中的任何 JavaScript 错误
- 捕获渲染错误、生命周期方法错误
- 自动生成唯一的错误 ID 用于追踪

### 2. 错误日志

- 记录错误消息和堆栈信息
- 记录组件堆栈（component stack）
- 记录时间戳和用户上下文
- 可选的远程日志服务集成

### 3. 错误恢复

- **重试**：重新渲染子组件
- **刷新页面**：重新加载整个应用
- **返回首页**：导航到根路径
- **复制错误**：便于用户反馈

### 4. 错误详情

- 可展开/折叠的错误详情
- 显示错误堆栈
- 显示组件堆栈
- 诊断信息（URL、时间等）

### 5. 响应式设计

- 适配移动设备和桌面设备
- 友好的错误提示 UI
- 清晰的操作按钮

## 最佳实践

### 1. 错误边界位置

将错误边界放在应用的最外层，包裹整个应用：

```tsx
function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          {/* 所有路由 */}
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}
```

### 2. 多层错误边界

对于关键功能，可以添加多层错误边界：

```tsx
function App() {
  return (
    <ErrorBoundary fallback={<GlobalError />}>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="dashboard" element={
              <ErrorBoundary fallback={<DashboardError />}>
                <Dashboard />
              </ErrorBoundary>
            } />
          </Route>
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}
```

### 3. 错误上报

集成错误上报服务：

```tsx
function App() {
  const handleError = (error: Error, errorInfo: ErrorInfo) => {
    // 发送到 Sentry
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    });

    // 发送到自定义日志服务
    fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        url: window.location.href,
      }),
    });
  };

  return (
    <ErrorBoundary onError={handleError}>
      {/* ... */}
    </ErrorBoundary>
  );
}
```

### 4. 生产环境配置

在生产环境中，考虑隐藏敏感信息：

```tsx
const isProduction = import.meta.env.PROD;

function App() {
  return (
    <ErrorBoundary
      showDetails={!isProduction}
      enableLogging={true}
      onError={handleError}
    >
      {/* ... */}
    </ErrorBoundary>
  );
}
```

## 限制

错误边界无法捕获以下类型的错误：

1. **事件处理器中的错误**
   ```tsx
   // ❌ 不会被捕获
   <button onClick={() => throw new Error()}>Click</button>
   ```

2. **异步代码中的错误**
   ```tsx
   // ❌ 不会被捕获
   useEffect(() => {
     fetch('/api').then(() => {
       throw new Error(); // 不会被捕获
     });
   }, []);
   ```

3. **服务端渲染中的错误**
   ```tsx
   // ❌ SSR 错误需要特殊处理
   ```

4. **错误边界自身的错误**
   ```tsx
   // ❌ 错误边界自身的渲染错误不会被捕获
   ```

## 测试

错误边界组件包含完整的单元测试，覆盖以下场景：

- 基本功能（正常渲染、错误捕获、错误 ID 生成）
- 错误处理（null 错误、undefined 错误、特殊字符）
- 错误日志（控制台记录、详细错误信息、禁用日志、自定义回调）
- 恢复功能（重试、刷新页面、返回首页）
- 错误详情（显示/隐藏、展开/折叠）
- 复制错误信息
- 自定义 fallback
- 嵌套错误边界
- 状态管理
- 无障碍性

运行测试：

```bash
bun test tests/error-boundary.test.tsx
```

## TypeScript 类型

所有组件都包含完整的 TypeScript 类型定义：

```typescript
import type { ErrorBoundaryProps, ErrorBoundaryState } from './components/ErrorBoundary';
import type { ErrorFallbackProps } from './components/ErrorFallback';
```

## 浏览器支持

- Chrome/Edge（最新版本）
- Firefox（最新版本）
- Safari（最新版本）
- 移动浏览器（iOS Safari、Chrome Mobile）

## 相关链接

- [React Error Boundaries 官方文档](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [Vercel 设计指南](https://vercel.com/design)
- [项目测试目录](../tests/error-boundary.test.tsx)