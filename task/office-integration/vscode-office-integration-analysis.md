# Folder-Site 与 vscode-office 能力融合方案

## 项目概览

### Folder-Site 当前能力

Folder-Site 是一个文档和知识库的本地网站生成器，具有以下核心特性：

1. **插件系统架构**
   - 基于清单（manifest）的插件注册机制
   - 支持渲染器（Renderer）和转换器（Transformer）能力
   - 优先级系统和冲突检测
   - 生命周期钩子管理

2. **现有插件**
   - `mermaid-renderer`: Mermaid 图表渲染（SVG/PNG）
   - `json-canvas-renderer`: JSON Canvas 可视化
   - `vega-renderer`: Vega/Vega-Lite 数据可视化
   - `graphviz-renderer`: Graphviz DOT 图表渲染

3. **文件查看系统**
   - Markdown 预览（代码视图和预览视图）
   - 代码高亮支持
   - 主题切换（亮色/暗色）
   - 文件树导航

### vscode-office 能力分析

vscode-office 是一个 VS Code 扩展，支持多种非代码文件的查看和编辑：

| 文档类型 | 支持格式 | 核心库 | 编辑支持 |
|---------|---------|--------|---------|
| **Excel** | .xlsx, .xlsm, .xls, .csv, .ods | SheetJS + x-spreadsheet | ✅ 是 |
| **Word** | .docx, .dotx | docxjs | ❌ 否 |
| **PDF** | .pdf | pdf.js | ❌ 否 |
| **字体** | .ttf, .otf, .woff, .woff2 | opentype.js | ❌ 否 |
| **压缩包** | .zip, .jar, .vsix, .rar, .apk | adm-zip, node-unrar-js | ❌ 否 |
| **Markdown** | .md, .markdown | Vditor | ✅ 是 |
| **HTML** | .html, .htm | 原生浏览器能力 | ❌ 否 |

## 融合方案设计

### 方案一：插件化集成（推荐）

将 vscode-office 的核心能力封装为标准的 Folder-Site 插件。

#### 优势
- ✅ 符合现有插件架构
- ✅ 模块化设计，易于维护
- ✅ 可独立启用/禁用
- ✅ 优先级和冲突检测机制内置
- ✅ 生命周期管理完善

#### 架构设计

```
plugins/
├── office-renderer/          # Office 文档渲染器插件
│   ├── manifest.json
│   ├── index.ts
│   ├── ExcelRenderer.ts      # Excel 渲染器（基于 SheetJS + x-spreadsheet）
│   ├── WordRenderer.ts       # Word 渲染器（基于 docxjs）
│   ├── PDFRenderer.ts        # PDF 渲染器（基于 pdf.js）
│   ├── ArchiveRenderer.ts    # 压缩包渲染器（基于 adm-zip）
│   └── FontRenderer.ts       # 字体预览渲染器
├── markdown-enhanced/        # Markdown 增强插件（可选）
│   ├── manifest.json
│   ├── index.ts
│   ├── VditorMarkdown.ts     # Vditor Markdown 编辑器
│   └── MarkdownExporter.ts   # PDF/HTML 导出器
```

#### 实现步骤

**阶段 1: 基础插件框架**

1. 创建 `office-renderer` 插件结构
2. 定义插件 manifest（声明 renderer 能力）
3. 实现插件生命周期管理

```typescript
// plugins/office-renderer/manifest.json
{
  "id": "office-renderer",
  "name": "Office Document Renderer",
  "version": "1.0.0",
  "description": "Render Excel, Word, PDF, and other office documents",
  "author": { "name": "Folder-Site Team" },
  "license": "MIT",
  "entry": "index.ts",
  "capabilities": [
    {
      "type": "renderer",
      "name": "excel",
      "version": "1.0.0",
      "constraints": {
        "supportedFormats": ["xlsx", "xlsm", "xls", "csv", "ods"],
        "supportsEditing": true
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
        "supportsEditing": false
      }
    },
    {
      "type": "renderer",
      "name": "archive",
      "version": "1.0.0",
      "constraints": {
        "supportedFormats": ["zip", "jar", "rar", "apk"],
        "supportsEditing": false
      }
    }
  ],
  "options": {
    "type": "object",
    "properties": {
      "maxFileSize": {
        "type": "number",
        "description": "Maximum file size to render (MB)",
        "default": 10
      },
      "enableEditing": {
        "type": "boolean",
        "description": "Enable editing for supported formats",
        "default": false
      }
    }
  }
}
```

**阶段 2: Excel 渲染器实现**

参考 vscode-office 的 Excel viewer 实现：

```typescript
// plugins/office-renderer/ExcelRenderer.ts
import * as XLSX from 'xlsx';
import type { RendererPlugin } from '../../types/plugin.js';

export class ExcelRenderer implements RendererPlugin {
  name = 'excel';
  extensions = ['.xlsx', '.xlsm', '.xls', '.csv', '.ods'];
  version = '1.0.0';
  pluginId = 'office-renderer';

  async render(content: string, options?: Record<string, unknown>): Promise<string> {
    // 使用 SheetJS 解析 Excel 文件
    const workbook = XLSX.read(content, { type: 'binary' });
    
    // 转换为 HTML 表格或交互式组件
    // 这里可以集成 x-spreadsheet 或使用自定义表格组件
    
    return this.renderToHTML(workbook, options);
  }

  private renderToHTML(workbook: XLSX.WorkBook, options?: Record<string, unknown>): string {
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    // 生成 HTML 表格
    let html = '<table class="excel-table">';
    
    // 添加表头
    if (data.length > 0) {
      const headers = Object.keys(data[0]);
      html += '<thead><tr>';
      headers.forEach(h => html += `<th>${h}</th>`);
      html += '</tr></thead>';
    }

    // 添加数据行
    html += '<tbody>';
    data.forEach(row => {
      html += '<tr>';
      Object.values(row).forEach(v => html += `<td>${v}</td>`);
      html += '</tr>';
    });
    html += '</tbody></table>';

    return html;
  }
}
```

**阶段 3: Word 渲染器实现**

```typescript
// plugins/office-renderer/WordRenderer.ts
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { loadDocument } from 'docx-preview';

export class WordRenderer implements RendererPlugin {
  name = 'word';
  extensions = ['.docx', '.dotx'];
  version = '1.0.0';
  pluginId = 'office-renderer';

  async render(content: ArrayBuffer, options?: Record<string, unknown>): Promise<string> {
    // 使用 docxjs 渲染 Word 文档
    const container = document.createElement('div');
    
    await loadDocument(
      content,
      container,
      null,
      {
        inWrapper: true, // 使用包装器
        ignoreWidth: false,
        ignoreHeight: false,
        ignoreFonts: false,
        breakPages: true,
        experimental: false,
        useBase64URL: true,
      }
    );

    return container.outerHTML;
  }
}
```

**阶段 4: PDF 渲染器实现**

```typescript
// plugins/office-renderer/PDFRenderer.ts
import * as pdfjsLib from 'pdfjs-dist';

export class PDFRenderer implements RendererPlugin {
  name = 'pdf';
  extensions = ['.pdf'];
  version = '1.0.0';
  pluginId = 'office-renderer';

  async render(content: ArrayBuffer, options?: Record<string, unknown>): Promise<string> {
    const loadingTask = pdfjsLib.getDocument({
      data: content,
      workerSrc: pdfjsLib.GlobalWorkerOptions.workerSrc,
    });

    const pdf = await loadingTask.promise;
    
    let html = '<div class="pdf-document">';
    
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.5 });
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise;
      
      html += `<div class="pdf-page" data-page="${pageNum}">
        <img src="${canvas.toDataURL()}" alt="Page ${pageNum}" />
      </div>`;
    }
    
    html += '</div>';
    return html;
  }
}
```

**阶段 5: 压缩包渲染器实现**

```typescript
// plugins/office-renderer/ArchiveRenderer.ts
import * as admZip from 'adm-zip';

export class ArchiveRenderer implements RendererPlugin {
  name = 'archive';
  extensions = ['.zip', '.jar', '.apk'];
  version = '1.0.0';
  pluginId = 'office-renderer';

  async render(content: string, options?: Record<string, unknown>): Promise<string> {
    const zip = new admZip(Buffer.from(content, 'base64'));
    const entries = zip.getEntries();

    let html = '<div class="archive-contents">';
    html += '<h2>Archive Contents</h2>';
    html += '<ul class="archive-list">';
    
    entries.forEach(entry => {
      const isDirectory = entry.isDirectory;
      const size = entry.header.size;
      const name = entry.entryName;
      
      html += `<li class="archive-item ${isDirectory ? 'directory' : 'file'}">
        <span class="name">${name}</span>
        <span class="size">${formatBytes(size)}</span>
      </li>`;
    });
    
    html += '</ul></div>';
    return html;
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
```

**阶段 6: 前端集成**

修改 `FileView.tsx` 以支持多种渲染器：

```typescript
// src/client/pages/FileView.tsx
import { useRenderer } from '../hooks/useRenderer.js';

export function FileView() {
  const { renderContent, isOfficeFile, isLoading } = useRenderer();
  
  // 根据文件类型选择渲染器
  if (isOfficeFile(filePath)) {
    // 使用 office-renderer 插件
    return <OfficeRendererView filePath={filePath} />;
  }

  // 现有的代码视图和 Markdown 预览
  return <StandardFileView />;
}

// src/client/components/OfficeRendererView.tsx
export function OfficeRendererView({ filePath }: { filePath: string }) {
  const [renderedContent, setRenderedContent] = useState<string>('');
  
  useEffect(() => {
    const render = async () => {
      const content = await fetchFileContent(filePath);
      const ext = getExtension(filePath);
      const renderer = registry.getRenderer(ext);
      
      if (renderer) {
        const html = await renderer.render(content);
        setRenderedContent(html);
      }
    };
    
    render();
  }, [filePath]);
  
  return (
    <div 
      className="office-document" 
      dangerouslySetInnerHTML={{ __html: renderedContent }}
    />
  );
}
```

### 方案二：原生集成

直接将 vscode-office 的核心库集成到 Folder-Site 主代码库中。

#### 优势
- ✅ 更紧密的集成
- ✅ 性能更好（无插件开销）
- ✅ 统一的版本管理

#### 劣势
- ❌ 增加主代码库体积
- ❌ 降低模块化程度
- ❌ 难以独立更新维护

#### 适用场景
- Office 查看功能是核心需求
- 要求最优性能
- 不需要模块化能力

### 方案三：混合方案

核心 Office 渲染器作为内置插件，其他功能（如 Markdown 增强）作为可选插件。

#### 优势
- 平衡性能和模块化
- 核心功能稳定可靠
- 扩展功能灵活可选

## 依赖库分析

### 需要集成的核心库

| 库名 | 用途 | 包大小 | 许可证 |
|-----|------|--------|--------|
| sheetjs | Excel 解析 | ~500KB | Apache-2.0 |
| x-spreadsheet | Excel 交互式表格 | ~200KB | Apache-2.0 |
| docxjs | Word 渲染 | ~100KB | MIT |
| pdfjs-dist | PDF 渲染 | ~500KB | Apache-2.0 |
| adm-zip | ZIP 处理 | ~50KB | MIT |
| node-unrar-js | RAR 处理 | ~100KB | MIT |
| opentype.js | 字体预览 | ~150KB | MIT |

### 建议的依赖策略

**最小化依赖（推荐）**
- 仅集成最常用的格式：Excel、Word、PDF
- 使用懒加载减少初始包体积
- 按需引入（dynamic import）

**完整集成**
- 支持所有格式
- 体积较大（约 1.5MB gzipped）
- 适合离线使用场景

## 技术实现细节

### 1. 文件路由增强

在 `FileView.tsx` 中添加渲染器选择逻辑：

```typescript
const rendererMap: Record<string, string> = {
  'xlsx': 'excel',
  'xlsm': 'excel',
  'xls': 'excel',
  'csv': 'excel',
  'ods': 'excel',
  'docx': 'word',
  'dotx': 'word',
  'pdf': 'pdf',
  'zip': 'archive',
  'jar': 'archive',
  'rar': 'archive',
};

const getRendererForFile = (filePath: string): string | null => {
  const ext = filePath.split('.').pop()?.toLowerCase();
  return rendererMap[ext || ''] || null;
};
```

### 2. 插件注册

在插件管理器中注册 office-renderer：

```typescript
import { PluginRegistry } from './lib/plugin-registry.js';

const registry = new PluginRegistry();

// 自动发现并加载 office-renderer
await registry.discoverAndLoad('./plugins');

// 或手动注册特定插件
import { OfficeRendererPlugin } from './plugins/office-renderer/index.js';
await registry.register(new OfficeRendererPlugin());
```

### 3. 缓存策略

为大型 Office 文档实现缓存：

```typescript
interface CacheEntry {
  content: string;
  timestamp: number;
  size: number;
}

const officeCache = new Map<string, CacheEntry>();

async function renderWithCache(
  filePath: string,
  renderer: RendererPlugin
): Promise<string> {
  const cacheKey = `${filePath}-${renderer.name}`;
  const cached = officeCache.get(cacheKey);
  
  // 检查缓存有效性（5分钟有效期）
  if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
    return cached.content;
  }
  
  // 渲染新的内容
  const content = await fetchFileContent(filePath);
  const rendered = await renderer.render(content);
  
  // 缓存结果
  officeCache.set(cacheKey, {
    content: rendered,
    timestamp: Date.now(),
    size: rendered.length,
  });
  
  return rendered;
}
```

### 4. 安全性考虑

- **文档清理**: 使用 DOMPurify 清理渲染的 HTML
- **文件大小限制**: 限制最大文件大小（默认 10MB）
- **沙箱隔离**: 插件在沙箱中运行
- **XSS 防护**: 严格的 CSP 策略

```typescript
import DOMPurify from 'dompurify';

export function sanitizeOfficeContent(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['table', 'thead', 'tbody', 'tr', 'th', 'td', 'div', 'span', 'img', 'canvas'],
    ALLOWED_ATTR: ['class', 'src', 'width', 'height', 'data-*'],
  });
}
```

## 实施路线图

### Phase 1: 基础框架（第 1 周）
- [ ] 创建 `office-renderer` 插件结构
- [ ] 实现 Excel 渲染器（仅只读）
- [ ] 文件路由集成
- [ ] 基础缓存机制

### Phase 2: 核心渲染器（第 2-3 周）
- [ ] Word 渲染器实现
- [ ] PDF 渲染器实现
- [ ] 压缩包渲染器实现
- [ ] 样式适配和主题支持

### Phase 3: 高级功能（第 4 周）
- [ ] Excel 编辑支持
- [ ] 搜索和过滤功能
- [ ] 导出功能（表格、图表）
- [ ] 打印优化

### Phase 4: 优化和测试（第 5 周）
- [ ] 性能优化（懒加载、虚拟滚动）
- [ ] 大文件处理优化
- [ ] 跨浏览器测试
- [ ] 安全审计

### Phase 5: 文档和发布（第 6 周）
- [ ] 用户文档编写
- [ ] 开发者指南
- [ ] 示例和教程
- [ ] 版本发布

## 预期成果

### 功能性指标
- ✅ 支持 `.xlsx`, `.xls`, `.csv`, `.ods` 查看
- ✅ 支持 `.docx`, `.dotx` 查看
- ✅ 支持 `.pdf` 查看（分页、导航）
- ✅ 支持 `.zip`, `.jar`, `.rar` 内容浏览
- ✅ Excel 编辑支持（可选）
- ✅ 主题适配（亮色/暗色）

### 性能指标
- 小文件（< 1MB）: 渲染时间 < 1s
- 中等文件（1-10MB）: 渲染时间 < 3s
- 大文件（10-50MB）: 渲染时间 < 10s
- 缓存命中率 > 80%

### 兼容性
- Chrome/Edge: 完全支持
- Firefox: 完全支持（部分功能需要 polyfill）
- Safari: 部分支持（PDF 功能可能受限）
- 移动浏览器: 基础支持

## 风险和挑战

### 技术风险

| 风险 | 影响 | 缓解措施 |
|-----|------|---------|
| 大文件内存溢出 | 高 | 流式处理、分块渲染、内存限制 |
| PDF 渲染兼容性 | 中 | 降级方案、浏览器 PDF viewer 回退 |
| 安全漏洞（XSS） | 高 | 严格的 HTML 清理、CSP 策略 |
| 浏览器兼容性 | 中 | Polyfill、特性检测、渐进增强 |

### 实施挑战

1. **依赖体积**: Office 渲染库体积较大，需要优化打包策略
2. **性能**: 大型 Excel 和 PDF 文件响应慢，需要缓存和优化
3. **编辑功能**: Excel 编辑复杂，可能需要分阶段实现
4. **主题适配**: Office 文档样式与主题系统适配

## 总结

**推荐方案**: 采用方案一（插件化集成）作为主要实施路径，理由如下：

1. **架构一致性**: 符合 Folder-Site 现有插件系统设计
2. **灵活性高**: 可独立启用/禁用，易于维护和更新
3. **模块化**: 降低主代码库复杂度
4. **可扩展性**: 便于未来添加新的文档类型

**优先级建议**:
- **P0（必须）**: Excel 查看器、Word 查看器、PDF 查看器
- **P1（重要）**: 压缩包浏览、Excel 编辑
- **P2（可选）**: 字体预览、高级导出功能

此方案将显著扩展 Folder-Site 的文档处理能力，使其成为一个更完整的知识和文档管理平台。
