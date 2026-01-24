# 变更记录：文件预览功能

## 日期
2025-01-23

## 描述
添加文件预览功能，允许用户通过 Alt+点击文件节点查看文件元数据信息。

## 变更类型
- ✨ 新功能

## 变更详情

### 新增文件

1. **src/client/components/file-preview/FilePreviewModal.tsx**
   - 文件预览模态框组件
   - 显示文件元数据（名称、大小、创建时间、修改时间等）
   - 流畅的弹出动画（缩放+淡入+滑动）
   - 支持 ESC 键关闭
   - 加载状态和错误处理

2. **src/client/components/file-preview/index.ts**
   - 导出 FilePreviewModal 组件和相关类型

3. **docs/features/file-preview.md**
   - 功能文档
   - 使用说明
   - 技术实现细节

### 修改文件

1. **src/client/components/sidebar/Sidebar.tsx**
   - 导入 FilePreviewModal 组件
   - 添加状态：
     - `previewOpen`: 控制预览模态框打开/关闭
     - `previewFilePath`: 存储当前预览的文件路径
   - 添加 `handleFileAltClick` 回调函数
   - 修改 `FileTreeNode` 组件调用，传递 `onFileAltClick`
   - 渲染 `FilePreviewModal` 组件

2. **src/client/components/sidebar/Sidebar.tsx** (FileTreeNode 组件)
   - 修改 `FileTreeNodeProps` 接口，添加 `onFileAltClick` 回调
   - 修改 `handleFileClick` 函数，检测 Alt+点击事件
   - 递归传递 `onFileAltClick` 到子节点

## 功能特性

### 用户交互
- **触发方式**: Alt+点击文件节点
- **关闭方式**: ESC 键或点击遮罩层
- **动画效果**: 流畅的缩放+淡入+滑动弹出动画

### 显示信息
- 文件名称
- 文件路径
- 文件图标
- 文件大小（自动格式化）
- 创建时间
- 修改时间
- 文件类型
- 文件扩展名

### 技术特点
- 使用 Radix UI Dialog 组件
- 调用现有 API 端点 `/api/files/content`
- 响应式设计
- 加载状态显示
- 错误处理

## 依赖项

- `@radix-ui/react-dialog` (已存在)
- `@react-symbols/icons/utils` (已存在)
- `react-icons/fa` (已存在)

## 测试建议

1. 测试 Alt+点击文件节点是否正确打开模态框
2. 测试 ESC 键是否能关闭模态框
3. 测试点击遮罩层是否能关闭模态框
4. 测试加载状态是否正确显示
5. 测试错误处理（不存在的文件）
6. 测试动画效果是否流畅
7. 测试不同文件类型的显示

## 兼容性

- ✅ 与现有文件树功能兼容
- ✅ 不影响正常的文件点击导航
- ✅ 支持键盘导航
- ✅ 响应式设计

## 已知问题

无

## 未来改进

- [ ] 添加文件内容预览（文本/图片）
- [ ] 支持批量文件预览
- [ ] 添加文件权限信息
- [ ] 支持文件操作（复制路径、打开所在目录等）
- [ ] 添加文件对比功能

## 相关 Issue

无（新功能）

## 审核

- [ ] 代码审查
- [ ] 功能测试
- [ ] 文档更新