# Infographic 实现总结（修正版）

## 问题分析

### 原始错误
```
SyntaxError: Unexpected token 'i', "infographi"... is not valid JSON
```

### 根本原因
1. ❌ **错误的库**：使用了 `@antv/g2`（图表库），应该使用 `@antv/infographic`（信息图库）
2. ❌ **错误的格式**：尝试解析 JSON，但实际是 Infographic DSL 语法

### Infographic DSL 语法示例
```
infographic list-sector-plain-text
data
  title 目标用户群体
  desc 核心用户及其典型场景
  items
    - label 技术文档作者
      desc 架构设计、API 文档
```

这是一种类似 YAML 的自定义语法，**不是 JSON**！

## 解决方案

### 1. 安装正确的包 ✅
```bash
bun add @antv/infographic
```

### 2. 更新渲染器 ✅
```typescript
// 之前（错误）
const { Chart } = await import('@antv/g2');
const spec = JSON.parse(code);  // ❌ 尝试解析 JSON
chart.options(spec);

// 之后（正确）
const { Infographic } = await import('@antv/infographic');
const infographic = new Infographic({
  container: wrapper,
  width: 800,
  height: 600,
  theme: theme === 'dark' ? 'dark' : 'light',
});
infographic.setOptions({ spec: code });  // ✅ 直接传递 DSL 字符串
await infographic.render();
```

### 3. 更新 manifest.json ✅
```json
{
  "library": "@antv/infographic",  // 之前是 "@antv/g2"
  "theme": {
    "light": "light",  // 之前是 "classic"
    "dark": "dark"     // 之前是 "classicDark"
  }
}
```

## Infographic 支持的类型

根据 AntV Infographic 文档，支持以下类型：

### 列表类
- `list-sector-plain-text` - 扇形列表（纯文本）
- `list-grid-badge-card` - 网格徽章卡片
- `list-grid-icon-card` - 网格图标卡片
- `list-horizontal-card` - 横向卡片列表

### 时间线类
- `timeline-horizontal` - 横向时间线
- `timeline-vertical` - 纵向时间线

### 图表类
- `chart-bar` - 柱状图
- `chart-line` - 折线图
- `chart-pie` - 饼图
- `chart-radar` - 雷达图

### 其他
- `process-flow` - 流程图
- `comparison-table` - 对比表格
- `statistic-card` - 统计卡片

## 测试

### 1. 测试文件
`test-infographic.md` - 包含多种 Infographic 类型

### 2. 预期结果
- 信息图正常渲染
- 支持亮色/暗色主题
- 自动适应容器宽度

### 3. 检查控制台
应该看到：
```
[Infographic] Starting render...
[Infographic] Found blocks: X
[Infographic] Processing block: ...
[Infographic] Rendered successfully
```

## 与 G2 的区别

| 特性 | @antv/g2 | @antv/infographic |
|------|----------|-------------------|
| 用途 | 数据可视化图表 | 信息图设计 |
| 输入格式 | JSON (图表配置) | DSL (信息图描述) |
| 适用场景 | 数据分析、统计图表 | 文档、演示、报告 |
| 交互性 | 高（缩放、筛选等） | 低（主要用于展示） |
| 示例 | 柱状图、折线图、散点图 | 列表、时间线、流程图 |

## 如果需要 G2 图表

如果确实需要 G2 的数据可视化功能，可以：

1. **创建单独的插件**
   - `plugins/g2-renderer/` - 用于 G2 图表
   - 使用 `vega` 或 `chart` 作为代码块语言

2. **使用 JSON 格式**
   ```json
   {
     "type": "interval",
     "data": [...],
     "encode": {...}
   }
   ```

3. **注册到插件系统**
   ```typescript
   const customRenderers = useMemo(() => ({
     'mermaid': createMermaidRenderer(mermaidTheme),
     'infographic': createInfographicRenderer(),
     'chart': createG2Renderer(),  // 新增
   }), [mermaidTheme]);
   ```

## 文件清单

### 修改的文件
- ✅ `src/client/components/editor/MarkdownRenderer.tsx` - 使用正确的 API
- ✅ `plugins/infographic-renderer/manifest.json` - 更新库名称
- ✅ `package.json` - 添加 @antv/infographic 依赖
- ✅ `test-infographic.md` - 使用正确的 DSL 语法

### 保持不变
- ✅ `src/parsers/remark-infographic.ts` - 处理代码块
- ✅ `src/parsers/rehype-shiki.ts` - 跳过 infographic
- ✅ `src/parsers/markdown.ts` - 注册插件

## 参考资源

- [AntV Infographic 官方文档](https://infographic.antv.antgroup.com/)
- [AntV Infographic GitHub](https://github.com/antvis/Infographic)
- [示例画廊](https://infographic.antv.antgroup.com/examples)
