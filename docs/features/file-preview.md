# 文件预览功能

## 功能概述

文件预览功能允许用户通过 Alt+点击文件节点来查看文件的详细信息，包括文件大小、创建时间、修改时间等元数据。

## 功能特性

- **触发方式**: Alt+点击文件节点
- **显示内容**:
  - 文件名称和路径
  - 文件图标预览
  - 文件大小（自动格式化为 B/KB/MB/GB/TB）
  - 创建时间
  - 修改时间
  - 文件类型
  - 文件扩展名
- **交互体验**:
  - 流畅的弹出动画（缩放+淡入+滑动）
  - ESC 键关闭
  - 点击遮罩层关闭
  - 加载状态显示

## 使用方法

1. 在文件树中找到要查看的文件
2. 按住 Alt 键的同时点击文件名
3. 文件预览模态框将弹出，显示文件信息

## 技术实现

### 组件结构

```
src/client/components/file-preview/
├── FilePreviewModal.tsx  # 主模态框组件
└── index.ts              # 导出文件
```

### API 端点

使用现有的 `/api/files/content` 端点获取文件元数据：

```typescript
GET /api/files/content?path={filePath}
```

响应数据：
```typescript
{
  success: true,
  data: {
    info: {
      name: string;
      path: string;
      relativePath: string;
      extension: string;
      size: number;
      modifiedAt: Date;
      createdAt: Date;
      isDirectory: boolean;
      isFile: boolean;
      isSymbolicLink: boolean;
    },
    content: string;
    meta: { ... }
  },
  timestamp: number
}
```

### 修改的文件

1. `src/client/components/sidebar/Sidebar.tsx`
   - 添加文件预览状态管理
   - 添加 `handleFileAltClick` 回调函数
   - 传递 `onFileAltClick` 到 `FileTreeNode` 组件
   - 渲染 `FilePreviewModal` 组件

2. `src/client/components/sidebar/Sidebar.tsx` (FileTreeNode 组件)
   - 修改 `handleFileClick` 支持 Alt+点击检测
   - 添加 `onFileAltClick` 到 props 接口
   - 递归传递 `onFileAltClick` 到子节点

### 动画效果

使用 Radix UI Dialog 的动画类实现流畅的弹出效果：

```css
/* 遮罩层动画 */
data-[state=open]:animate-in data-[state=closed]:animate-out
data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0

/* 内容动画 */
data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95
data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]
data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]
```

## 示例代码

### 基本使用

```tsx
import { FilePreviewModal } from './components/file-preview';

function App() {
  const [open, setOpen] = useState(false);
  const [filePath, setFilePath] = useState('');

  const handleFileAltClick = (path: string) => {
    setFilePath(path);
    setOpen(true);
  };

  return (
    <FilePreviewModal
      open={open}
      onOpenChange={setOpen}
      filePath={filePath}
    />
  );
}
```

### 自定义样式

```tsx
<FilePreviewModal
  open={open}
  onOpenChange={setOpen}
  filePath={filePath}
  className="max-w-2xl"
/>
```

## 注意事项

1. 文件路径必须相对于项目根目录
2. 如果文件不存在，将显示错误信息
3. 模态框会阻止页面滚动
4. 支持键盘导航（ESC 关闭）

## 未来改进

- [ ] 添加文件内容预览（文本/图片）
- [ ] 支持批量文件预览
- [ ] 添加文件权限信息
- [ ] 支持文件操作（复制路径、打开所在目录等）
- [ ] 添加文件对比功能