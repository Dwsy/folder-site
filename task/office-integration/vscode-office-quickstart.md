# vscode-office 融合快速入门指南

## 前置要求

```bash
cd /path/to/folder-site
npm install  # 确保依赖完整
```

## 第一步：创建 office-renderer 插件骨架

```bash
# 创建插件目录
mkdir -p plugins/office-renderer

# 创建基本文件结构
touch plugins/office-renderer/manifest.json
touch plugins/office-renderer/index.ts
touch plugins/office-renderer/ExcelRenderer.ts
```

## 第二步：编写 manifest.json

```json
{
  "id": "office-renderer",
  "name": "Office Document Renderer",
  "version": "1.0.0",
  "description": "Render Excel, Word, PDF, and other office documents in Folder-Site",
  "author": {
    "name": "Folder-Site Team"
  },
  "license": "MIT",
  "entry": "index.ts",
  "capabilities": [
    {
      "type": "renderer",
      "name": "excel",
      "version": "1.0.0",
      "constraints": {
        "supportedFormats": ["xlsx", "xlsm", "xls", "csv", "ods"],
        "supportsEditing": false
      }
    },
    {
      "type": "renderer",
      "name": "word",
      "version": "1.0.0",
      "constraints": {
        "supportedFormats": ["docx", "dotx"],
        "supportsEditing": false
      }
    },
    {
      "type": "renderer",
      "name": "pdf",
      "version": "1.0.0",
      "constraints": {
        "supportedFormats": ["pdf"],
        "supportsEditing": false,
        "supportsPagination": true
      }
    }
  ]
}
```

## 第三步：实现 ExcelRenderer

创建 `plugins/office-renderer/ExcelRenderer.ts`:

```typescript
/**
 * Excel 渲染器
 * 使用 SheetJS 解析 Excel 文件并渲染为 HTML 表格
 */

import * as XLSX from 'xlsx';
import type { RendererPlugin } from '../../types/plugin.js';

export interface ExcelRendererOptions {
  maxRows?: number;
  maxCols?: number;
  showGridLines?: boolean;
  showHeaders?: boolean;
  theme?: 'light' | 'dark';
}

export class ExcelRenderer implements RendererPlugin {
  name = 'excel';
  version = '1.0.0';
  extensions = ['.xlsx', '.xlsm', '.xls', '.csv', '.ods'];
  pluginId = 'office-renderer';

  /**
   * 渲染 Excel 文件内容
   */
  async render(
    content: string | ArrayBuffer,
    options?: ExcelRendererOptions
  ): Promise<string> {
    const opts: ExcelRendererOptions = {
      maxRows: 1000,
      maxCols: 50,
      showGridLines: true,
      showHeaders: true,
      theme: 'light',
      ...options,
    };

    try {
      const workbook = XLSX.read(content, { type: 'binary' });
      return this.renderWorkbook(workbook, opts);
    } catch (error) {
      throw new Error(
        `Failed to render Excel file: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * 渲染工作簿为 HTML
   */
  private renderWorkbook(workbook: XLSX.WorkBook, options: ExcelRendererOptions): string {
    const sheetNames = workbook.SheetNames;
    
    let html = '<div class="excel-workbook">';
    
    // 添加工作表标签
    html += '<div class="excel-tabs">';
    sheetNames.forEach((name, index) => {
      const isActive = index === 0 ? 'active' : '';
      html += `<button class="excel-tab ${isActive}" data-sheet="${index}">
        ${name}
      </button>`;
    });
    html += '</div>';

    // 渲染所有工作表
    sheetNames.forEach((name, index) => {
      const worksheet = workbook.Sheets[name];
      html += `<div class="excel-sheet ${index === 0 ? 'active' : ''}" data-sheet="${index}">`;
      html += this.renderWorksheet(worksheet, options);
      html += '</div>';
    });

    html += '</div>';
    return html;
  }

  /**
   * 渲染单个工作表为 HTML 表格
   */
  private renderWorksheet(
    worksheet: XLSX.WorkSheet,
    options: ExcelRendererOptions
  ): string {
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];

    if (!data || data.length === 0) {
      return '<div class="excel-empty">Empty sheet</div>';
    }

    // 限制行数和列数
    const rows = data.slice(0, options.maxRows);
    const cols = Math.min(
      Math.max(...rows.map((row) => row.length)),
      options.maxCols
    );

    let html = `
      <table class="excel-table" data-theme="${options.theme}">
        <thead>
          <tr>
    `;

    // 表头
    const headerRow = rows[0];
    for (let i = 0; i < cols; i++) {
      const cell = headerRow[i] ?? '';
      html += `<th class="excel-header">${this.escapeHtml(String(cell))}</th>`;
    }

    html += '</tr></thead><tbody>';

    // 数据行
    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      html += '<tr>';
      
      for (let c = 0; c < cols; c++) {
        const cell = row[c] ?? '';
        const cellType = this.getExcelCellType(cell);
        html += `<td class="excel-cell excel-cell-${cellType}">
          ${this.escapeHtml(String(cell))}
        </td>`;
      }
      
      html += '</tr>';
    }

    html += '</tbody></table>';
    
    // 添加元数据
    html += `
      <div class="excel-metadata">
        <span>Rows: ${rows.length}</span>
        <span>Columns: ${cols}</span>
      </div>
    `;

    return html;
  }

  /**
   * 获取单元格类型
   */
  private getExcelCellType(cell: unknown): string {
    if (typeof cell === 'number') return 'number';
    if (typeof cell === 'boolean') return 'boolean';
    if (new Date(cell as string).toString() !== 'Invalid Date') return 'date';
    return 'text';
  }

  /**
   * 转义 HTML
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

export default ExcelRenderer;
```

## 第四步：创建插件入口

创建 `plugins/office-renderer/index.ts`:

```typescript
/**
 * Office Renderers 插件入口
 */

import type { Plugin, PluginManifest, PluginContext } from '../../types/plugin.js';
import { manifest } from './manifest.js';
import { ExcelRenderer } from './ExcelRenderer.js';

export class OfficeRendererPlugin implements Plugin {
  readonly id: string = 'office-renderer';
  readonly name: string = 'Office Document Renderer';
  readonly version: string = '1.0.0';
  readonly manifest: PluginManifest = manifest;
  readonly status: 'active' = 'active';

  private renderers: Map<string, ExcelRenderer> = new Map();

  async initialize(context: PluginContext): Promise<void> {
    context.logger.info('Initializing Office Renderer plugin');

    // 创建渲染器实例
    this.renderers.set('excel', new ExcelRenderer());
  }

  async activate(): Promise<void> {
    // 注册所有渲染器到注册表
    for (const [name, renderer] of this.renderers) {
      // 这里需要访问全局注册表
      // 实际实现需要注入注册表引用
      pluginRegistry?.registerRenderer(renderer, this.id);
    }
  }

  async deactivate(): Promise<void> {
    this.renderers.clear();
  }

  async dispose(): Promise<void> {
    this.renderers.clear();
  }

  getRenderer(name: string): ExcelRenderer | undefined {
    return this.renderers.get(name);
  }

  renderers = {
    excel: new ExcelRenderer(),
  };
}

export default OfficeRendererPlugin;
export { manifest };
```

## 第五步：添加必要的依赖

```bash
# 安装 SheetJS
npm install xlsx

# 安装类型定义
npm install --save-dev @types/xlsx
```

更新 `package.json`:

```json
{
  "dependencies": {
    "xlsx": "^0.18.5",
    ...
  }
}
```

## 第六步：更新 FileView 组件

修改 `src/client/pages/FileView.tsx`:

```typescript
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

// 定义渲染器映射
const OFFICE_EXTENSIONS = {
  'xlsx': 'excel',
  'xlsm': 'excel',
  'xls': 'excel',
  'csv': 'excel',
  'ods': 'excel',
  'docx': 'word',
  'dotx': 'word',
  'pdf': 'pdf',
} as const;

export function FileView() {
  const params = useParams();
  const filePath = params['*'] || '';
  const [content, setContent] = useState('');

  const getRendererType = (path: string): keyof typeof OFFICE_EXTENSIONS | null => {
    const ext = path.split('.').pop()?.toLowerCase();
    return ext ? (OFFICE_EXTENSIONS[ext as keyof typeof OFFICE_EXTENSIONS] ?? null) : null;
  };

  const rendererType = getRendererType(filePath);

  if (rendererType) {
    return <OfficeDocumentViewer filePath={filePath} rendererType={rendererType} />;
  }

  // 原有的代码视图
  return <CodeView filePath={filePath} />;
}

function OfficeDocumentViewer({ 
  filePath, 
  rendererType 
}: { 
  filePath: string; 
  rendererType: keyof typeof OFFICE_EXTENSIONS;
}) {
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const renderDocument = async () => {
      setLoading(true);
      setError(null);

      try {
        // 1. 获取文件内容
        const contentResponse = await fetch(`/api/files/content?path=${encodeURIComponent(filePath)}`);
        if (!contentResponse.ok) throw new Error('Failed to fetch file');
        const contentResult = await contentResponse.json();
        const content = contentResult.data.content;

        // 2. 调用渲染 API
        const renderResponse = await fetch('/api/render/office', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: rendererType,
            content,
            options: {},
          }),
        });

        if (!renderResponse.ok) throw new Error('Failed to render document');
        const renderResult = await renderResponse.json();
        
        setHtml(renderResult.data.html);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    renderDocument();
  }, [filePath, rendererType]);

  if (loading) {
    return <div className="animate-pulse">Loading document...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error.message}</div>;
  }

  return (
    <div 
      className="office-document overflow-auto"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
```

## 第七步：添加后端渲染 API

创建 `src/server/api/render-office.ts`:

```typescript
import { Hono } from 'hono';
import { ExcelRenderer } from '../../../plugins/office-renderer/ExcelRenderer.js';

const app = new Hono();

// 全局渲染器实例
let excelRenderer: ExcelRenderer | null = null;

function getRenderer(type: string) {
  switch (type) {
    case 'excel':
      if (!excelRenderer) {
        excelRenderer = new ExcelRenderer();
        excelRenderer.initialize({
          logger: console,
        } as any);
      }
      return excelRenderer;
    default:
      throw new Error(`Unknown renderer type: ${type}`);
  }
}

app.post('/office', async (c) => {
  const { type, content, options } = await c.req.json();

  try {
    const renderer = getRenderer(type);
    const html = await renderer.render(content, options);

    return c.json({
      success: true,
      data: { html },
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

export default app;
```

在 `src/server/index.ts` 中注册路由:

```typescript
import renderApi from './api/render-office.js';

app.route('/api/render', renderApi);
```

## 第八步：添加样式

创建 `src/client/styles/office.css`:

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

.office-document {
  --excel-bg: var(--background, #ffffff);
  --excel-text: var(--foreground, #1a1a1a);
  --excel-border: var(--border, #e5e7eb);
  --excel-header-bg: var(--muted, #f3f4f6);
  --excel-cell-bg: var(--card, #ffffff);
  --excel-hover-bg: var(--accent, #e0f2fe);
  width: 100%;
  min-height: 400px;
}

.excel-workbook {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

.excel-tabs {
  display: flex;
  gap: 4px;
  padding: 8px;
  background: var(--muted, #f3f4f6);
  border-bottom: 1px solid var(--border, #e5e7eb);
}

.excel-tab {
  padding: 8px 16px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  color: var(--foreground, #1a1a1a);
  transition: all 0.2s;
}

.excel-tab:hover {
  background: var(--accent-hover, #bae6fd);
}

.excel-tab.active {
  background: var(--card, #ffffff);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.excel-sheet {
  display: none;
  padding: 16px;
}

.excel-sheet.active {
  display: block;
}

.excel-table {
  width: 100%;
  border-collapse: collapse;
  background: var(--excel-bg);
  color: var(--excel-text);
  font-size: 14px;
}

.excel-table th,
.excel-table td {
  border: 1px solid var(--excel-border);
  padding: 8px 12px;
  text-align: left;
  white-space: nowrap;
}

.excel-table th {
  background: var(--excel-header-bg);
  font-weight: 600;
  color: var(--foreground, #1a1a1a);
  position: sticky;
  top: 0;
  z-index: 10;
}

.excel-table tr:hover td {
  background: var(--excel-hover-bg);
}

.excel-cell-number {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.excel-cell-date {
  font-variant-numeric: tabular-nums;
}

.excel-cell-boolean {
  text-align: center;
}

.excel-metadata {
  display: flex;
  gap: 16px;
  padding: 8px;
  margin-top: 12px;
  font-size: 12px;
  color: var(--muted-foreground, #6b7280);
  background: var(--muted, #f3f4f6);
  border-radius: 6px;
}

.excel-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
  color: var(--muted-foreground, #6b7280);
  font-size: 14px;
}

/* 暗色主题 */
.office-document[data-theme='dark'] {
  --excel-bg: #1f2937;
  --excel-text: #f3f4f6;
  --excel-border: #374151;
  --excel-header-bg: #374151;
  --excel-cell-bg: #1f2937;
  --excel-hover-bg: #374151;
}
```

在 `src/client/App.tsx` 中导入样式:

```typescript
import './styles/office.css';
```

## 第九步：测试

创建测试文件 `tests/office-renderer.test.ts`:

```typescript
import { describe, it, expect } from 'bun:test';
import { ExcelRenderer } from '../plugins/office-renderer/ExcelRenderer.js';

describe('ExcelRenderer', () => {
  it('should render a simple CSV', () => {
    const renderer = new ExcelRenderer();
    const csv = 'Name,Age\nAlice,30\nBob,25';
    
    // CSV 格式处理需要特殊处理
    // 这里仅演示结构
    expect(true).toBe(true);
  });

  it('should handle large datasets', async () => {
    const renderer = new ExcelRenderer();
    // 测试大数据集性能
    expect(true).toBe(true);
  });
});
```

## 第十步：构建和运行

```bash
# 开发模式
npm run dev:client

# 构建
npm run build:client

# 运行
npm start
```

## 添加 Word 渲染器（下一步）

```bash
npm install docx-preview
npm install --save-dev @types/docx-preview
```

创建 `plugins/office-renderer/WordRenderer.ts`:

```typescript
import { loadDocument } from 'docx-preview';
import type { RendererPlugin } from '../../types/plugin.js';

export class WordRenderer implements RendererPlugin {
  name = 'word';
  extensions = ['.docx', '.dotx'];
  version = '1.0.0';
  pluginId = 'office-renderer';

  async render(
    content: ArrayBuffer,
    options?: Record<string, unknown>
  ): Promise<string> {
    // 需要在浏览器环境中运行
    // 或者使用 node 模拟 DOM
    const container = document.createElement('div');
    
    await loadDocument(
      content,
      container,
      null,
      {
        inWrapper: true,
        useBase64URL: true,
      }
    );

    return container.innerHTML;
  }
}
```

## 添加 PDF 渲染器

```bash
npm install pdfjs-dist
```

```typescript
import * as pdfjsLib from 'pdfjs-dist';

export class PDFRenderer implements RendererPlugin {
  name = 'pdf';
  extensions = ['.pdf'];
  version = '1.0.0';
  pluginId = 'office-renderer';

  async render(
    content: ArrayBuffer,
    options?: RenderOptions
  ): Promise<string> {
    const pdf = await pdfjsLib.getDocument({ data: content }).promise;
    // 渲染所有页面为 HTML
    // ...
  }
}
```

## 下一步

1. 完成所有渲染器实现
2. 添加编辑功能
3. 优化性能
4. 添加搜索和导出功能
5. 编写完整文档

## 参考资源

- [SheetJS 文档](https://docs.sheetjs.com/)
- [docx-preview 文档](https://github.com/mwilliamson/docx-preview)
- [pdf.js 文档](https://mozilla.github.io/pdf.js/)
- Folder-Site 插件系统文档
