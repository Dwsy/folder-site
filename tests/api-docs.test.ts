/**
 * API 文档验证测试
 *
 * 验证 API 文档的完整性和准确性
 */

import { describe, it, expect } from 'bun:test';
import { readFileSync } from 'fs';
import { join } from 'path';

// 读取 API 文档
const apiDocPath = join(process.cwd(), 'docs/API.md');
const apiDocContent = readFileSync(apiDocPath, 'utf-8');

// 读取插件 API 文档
const pluginApiDocPath = join(process.cwd(), 'docs/PLUGIN_API.md');
const pluginApiDocContent = readFileSync(pluginApiDocPath, 'utf-8');

// 读取插件开发指南
const pluginDevDocPath = join(process.cwd(), 'docs/PLUGIN_DEVELOPMENT.md');
const pluginDevDocContent = readFileSync(pluginDevDocPath, 'utf-8');

describe('API 文档验证', () => {
  describe('API.md 文档完整性', () => {
    it('应包含目录部分', () => {
      expect(apiDocContent).toContain('## 目录');
    });

    it('应包含 API 概览部分', () => {
      expect(apiDocContent).toContain('## API 概览');
    });

    it('应包含通用响应格式部分', () => {
      expect(apiDocContent).toContain('## 通用响应格式');
    });

    it('应包含认证部分', () => {
      expect(apiDocContent).toContain('## 认证');
    });

    it('应包含速率限制部分', () => {
      expect(apiDocContent).toContain('## 速率限制');
    });

    it('应包含端点说明部分', () => {
      expect(apiDocContent).toContain('## 端点说明');
    });

    it('应包含类型定义部分', () => {
      expect(apiDocContent).toContain('## 类型定义');
    });

    it('应包含代码示例部分', () => {
      expect(apiDocContent).toContain('## 代码示例');
    });

    it('应包含错误处理部分', () => {
      expect(apiDocContent).toContain('## 错误处理');
    });

    it('应包含最佳实践部分', () => {
      expect(apiDocContent).toContain('## 最佳实践');
    });

    it('应包含下一步部分', () => {
      expect(apiDocContent).toContain('## 下一步');
    });
  });

  describe('API 端点文档完整性', () => {
    it('应包含健康检查端点文档', () => {
      expect(apiDocContent).toContain('### 1. 健康检查');
      expect(apiDocContent).toContain('GET /api/health');
    });

    it('应包含 API 信息端点文档', () => {
      expect(apiDocContent).toContain('### 2. API 信息');
      expect(apiDocContent).toContain('GET /api');
    });

    it('应包含获取文件列表端点文档', () => {
      expect(apiDocContent).toContain('### 3. 获取文件列表');
      expect(apiDocContent).toContain('GET /api/files');
    });

    it('应包含获取目录树端点文档', () => {
      expect(apiDocContent).toContain('### 4. 获取目录树');
      expect(apiDocContent).toContain('GET /api/files/tree/list');
    });

    it('应包含获取文件内容端点文档', () => {
      expect(apiDocContent).toContain('### 5. 获取文件内容');
      expect(apiDocContent).toContain('GET /api/files/:path');
    });

    it('应包含搜索（GET）端点文档', () => {
      expect(apiDocContent).toContain('### 6. 搜索（GET）');
      expect(apiDocContent).toContain('GET /api/search');
    });

    it('应包含搜索（POST）端点文档', () => {
      expect(apiDocContent).toContain('### 7. 搜索（POST）');
      expect(apiDocContent).toContain('POST /api/search');
    });

    it('应包含 Workhub 端点文档', () => {
      expect(apiDocContent).toContain('### 8. 获取 Workhub 数据');
      expect(apiDocContent).toContain('GET /api/workhub');
    });

    it('应包含 Workhub ADR 子端点文档', () => {
      expect(apiDocContent).toContain('### 8.1 获取所有 ADR');
      expect(apiDocContent).toContain('GET /api/workhub/adrs');
      expect(apiDocContent).toContain('### 8.2 获取指定 ADR');
      expect(apiDocContent).toContain('GET /api/workhub/adrs/:id');
    });

    it('应包含 Workhub Issues 子端点文档', () => {
      expect(apiDocContent).toContain('### 8.3 获取所有 Issues');
      expect(apiDocContent).toContain('GET /api/workhub/issues');
      expect(apiDocContent).toContain('### 8.4 获取指定 Issue');
      expect(apiDocContent).toContain('GET /api/workhub/issues/:id');
    });

    it('应包含 Workhub PRs 子端点文档', () => {
      expect(apiDocContent).toContain('### 8.5 获取所有 PRs');
      expect(apiDocContent).toContain('GET /api/workhub/prs');
      expect(apiDocContent).toContain('### 8.6 获取指定 PR');
      expect(apiDocContent).toContain('GET /api/workhub/prs/:id');
    });

    it('应包含导出文件端点文档', () => {
      expect(apiDocContent).toContain('### 9. 导出文件');
      expect(apiDocContent).toContain('POST /api/export');
    });
  });

  describe('每个端点应包含请求示例', () => {
    const endpoints = [
      '健康检查',
      'API 信息',
      '获取文件列表',
      '获取目录树',
      '获取文件内容',
      '搜索（GET）',
      '搜索（POST）',
      '获取 Workhub 数据',
      '获取所有 ADR',
      '获取指定 ADR',
      '获取所有 Issues',
      '获取指定 Issue',
      '获取所有 PRs',
      '获取指定 PR',
      '导出文件'
    ];

    endpoints.forEach(endpoint => {
      it(`${endpoint} 应包含请求示例`, () => {
        const regex = new RegExp(`### .*${endpoint}.*[\\s\\S]*?请求示例`, 'i');
        expect(apiDocContent).toMatch(regex);
      });
    });
  });

  describe('每个端点应包含响应示例', () => {
    const endpoints = [
      '健康检查',
      'API 信息',
      '获取文件列表',
      '获取目录树',
      '获取文件内容',
      '搜索（GET）',
      '搜索（POST）',
      '获取 Workhub 数据',
      '获取所有 ADR',
      '获取指定 ADR',
      '获取所有 Issues',
      '获取指定 Issue',
      '获取所有 PRs',
      '获取指定 PR',
      '导出文件'
    ];

    endpoints.forEach(endpoint => {
      it(`${endpoint} 应包含响应示例`, () => {
        const regex = new RegExp(`### .*${endpoint}.*[\\s\\S]*?响应示例`, 'i');
        expect(apiDocContent).toMatch(regex);
      });
    });
  });

  describe('认证和速率限制文档', () => {
    it('认证部分应包含认证方式说明', () => {
      expect(apiDocContent).toContain('API Key');
      expect(apiDocContent).toContain('JWT Token');
    });

    it('认证部分应包含认证头格式示例', () => {
      expect(apiDocContent).toContain('Authorization: Bearer');
    });

    it('认证部分应包含认证错误响应示例', () => {
      expect(apiDocContent).toContain('UNAUTHORIZED');
    });

    it('速率限制部分应包含推荐请求频率', () => {
      expect(apiDocContent).toContain('推荐请求频率');
    });

    it('速率限制部分应包含未来速率限制策略', () => {
      expect(apiDocContent).toContain('未来速率限制策略');
    });

    it('速率限制部分应包含速率限制响应头说明', () => {
      expect(apiDocContent).toContain('X-RateLimit-Limit');
      expect(apiDocContent).toContain('X-RateLimit-Remaining');
      expect(apiDocContent).toContain('X-RateLimit-Reset');
    });

    it('速率限制部分应包含速率限制错误响应示例', () => {
      expect(apiDocContent).toContain('RATE_LIMIT_EXCEEDED');
    });

    it('速率限制部分应包含客户端请求节流示例代码', () => {
      expect(apiDocContent).toContain('RateLimitedClient');
    });
  });

  describe('错误处理文档', () => {
    it('应包含错误代码列表', () => {
      expect(apiDocContent).toContain('INVALID_PARAMS');
      expect(apiDocContent).toContain('FILE_NOT_FOUND');
      expect(apiDocContent).toContain('DIRECTORY_NOT_FOUND');
      expect(apiDocContent).toContain('MISSING_QUERY');
      expect(apiDocContent).toContain('INVALID_FORMAT');
      expect(apiDocContent).toContain('INTERNAL_ERROR');
    });

    it('应包含错误响应示例', () => {
      expect(apiDocContent).toContain('```json');
      expect(apiDocContent).toContain('"success": false');
      expect(apiDocContent).toContain('"error"');
    });
  });

  describe('类型定义文档', () => {
    it('应包含 ApiError 类型定义', () => {
      expect(apiDocContent).toContain('interface ApiError');
    });

    it('应包含 ApiResponse 类型定义', () => {
      expect(apiDocContent).toContain('interface ApiResponse');
    });

    it('应包含 FileInfo 类型定义', () => {
      expect(apiDocContent).toContain('interface FileInfo');
    });

    it('应包含 DirectoryTreeNode 类型定义', () => {
      expect(apiDocContent).toContain('interface DirectoryTreeNode');
    });

    it('应包含 FileMeta 类型定义', () => {
      expect(apiDocContent).toContain('interface FileMeta');
    });

    it('应包含 SearchRequest 类型定义', () => {
      expect(apiDocContent).toContain('interface SearchRequest');
    });

    it('应包含 ExportRequest 类型定义', () => {
      expect(apiDocContent).toContain('interface ExportRequest');
    });
  });

  describe('代码示例文档', () => {
    it('应包含 JavaScript/TypeScript 示例', () => {
      expect(apiDocContent).toContain('### JavaScript / TypeScript');
      expect(apiDocContent).toContain('async function healthCheck()');
    });

    it('应包含 Python 示例', () => {
      expect(apiDocContent).toContain('### Python');
      expect(apiDocContent).toContain('def health_check()');
    });

    it('应包含 curl 示例', () => {
      expect(apiDocContent).toContain('### curl');
      expect(apiDocContent).toContain('curl http://localhost:3000/api/health');
    });
  });

  describe('最佳实践文档', () => {
    it('应包含错误处理最佳实践', () => {
      expect(apiDocContent).toContain('### 1. 错误处理');
    });

    it('应包含请求节流最佳实践', () => {
      expect(apiDocContent).toContain('### 2. 请求节流');
    });

    it('应包含缓存响应最佳实践', () => {
      expect(apiDocContent).toContain('### 3. 缓存响应');
    });

    it('应包含分页处理最佳实践', () => {
      expect(apiDocContent).toContain('### 4. 分页处理');
    });

    it('应包含重试策略最佳实践', () => {
      expect(apiDocContent).toContain('### 5. 重试策略');
    });

    it('应包含类型安全最佳实践', () => {
      expect(apiDocContent).toContain('### 6. 类型安全');
    });

    it('应包含请求超时最佳实践', () => {
      expect(apiDocContent).toContain('### 7. 请求超时');
    });

    it('应包含监控和日志最佳实践', () => {
      expect(apiDocContent).toContain('### 8. 监控和日志');
    });
  });
});

describe('插件 API 文档验证', () => {
  describe('PLUGIN_API.md 文档完整性', () => {
    it('应包含目录部分', () => {
      expect(pluginApiDocContent).toContain('## 目录');
    });

    it('应包含插件系统概览部分', () => {
      expect(pluginApiDocContent).toContain('## 插件系统概览');
    });

    it('应包含插件清单部分', () => {
      expect(pluginApiDocContent).toContain('## 插件清单');
    });

    it('应包含插件接口部分', () => {
      expect(pluginApiDocContent).toContain('## 插件接口');
    });

    it('应包含插件上下文部分', () => {
      expect(pluginApiDocContent).toContain('## 插件上下文');
    });

    it('应包含生命周期部分', () => {
      expect(pluginApiDocContent).toContain('## 生命周期');
    });

    it('应包含事件系统部分', () => {
      expect(pluginApiDocContent).toContain('## 事件系统');
    });

    it('应包含可用服务部分', () => {
      expect(pluginApiDocContent).toContain('## 可用服务');
    });

    it('应包含能力类型部分', () => {
      expect(pluginApiDocContent).toContain('## 能力类型');
    });

    it('应包含类型定义部分', () => {
      expect(pluginApiDocContent).toContain('## 类型定义');
    });

    it('应包含示例插件部分', () => {
      expect(pluginApiDocContent).toContain('## 示例插件');
    });
  });

  describe('插件清单文档', () => {
    it('应包含插件清单 JSON 示例', () => {
      expect(pluginApiDocContent).toContain('"id":');
      expect(pluginApiDocContent).toContain('"name":');
      expect(pluginApiDocContent).toContain('"version":');
    });

    it('应包含字段说明表格', () => {
      expect(pluginApiDocContent).toContain('字段说明');
    });
  });

  describe('插件接口文档', () => {
    it('应包含 Plugin 接口定义', () => {
      expect(pluginApiDocContent).toContain('interface Plugin');
    });

    it('应包含插件类示例', () => {
      expect(pluginApiDocContent).toContain('class MyPlugin implements Plugin');
    });
  });

  describe('插件上下文文档', () => {
    it('应包含 PluginContext 接口定义', () => {
      expect(pluginApiDocContent).toContain('interface PluginContext');
    });

    it('应包含使用示例', () => {
      expect(pluginApiDocContent).toContain('async function initialize');
    });
  });

  describe('生命周期文档', () => {
    it('应包含状态图', () => {
      expect(pluginApiDocContent).toContain('discovered');
      expect(pluginApiDocContent).toContain('validated');
      expect(pluginApiDocContent).toContain('active');
    });

    it('应包含状态说明表格', () => {
      expect(pluginApiDocContent).toContain('状态说明');
    });

    it('应包含生命周期事件列表', () => {
      expect(pluginApiDocContent).toContain('plugin:discover');
      expect(pluginApiDocContent).toContain('plugin:load');
      expect(pluginApiDocContent).toContain('plugin:activate');
    });
  });

  describe('事件系统文档', () => {
    it('应包含 PluginEventEmitter 接口定义', () => {
      expect(pluginApiDocContent).toContain('interface PluginEventEmitter');
    });

    it('应包含使用示例', () => {
      expect(pluginApiDocContent).toContain('context.events.on');
      expect(pluginApiDocContent).toContain('context.events.emit');
    });

    it('应包含系统事件列表', () => {
      expect(pluginApiDocContent).toContain('file:changed');
      expect(pluginApiDocContent).toContain('search:started');
      expect(pluginApiDocContent).toContain('render:completed');
    });
  });

  describe('可用服务文档', () => {
    it('应包含文件服务接口定义', () => {
      expect(pluginApiDocContent).toContain('interface FileService');
    });

    it('应包含索引服务接口定义', () => {
      expect(pluginApiDocContent).toContain('interface IndexService');
    });

    it('应包含转换服务接口定义', () => {
      expect(pluginApiDocContent).toContain('interface TransformService');
    });

    it('应包含渲染服务接口定义', () => {
      expect(pluginApiDocContent).toContain('interface RenderService');
    });

    it('应包含导出服务接口定义', () => {
      expect(pluginApiDocContent).toContain('interface ExportService');
    });
  });

  describe('能力类型文档', () => {
    it('应包含渲染器能力示例', () => {
      expect(pluginApiDocContent).toContain('interface Renderer');
      expect(pluginApiDocContent).toContain('class MermaidRenderer');
    });

    it('应包含转换器能力示例', () => {
      expect(pluginApiDocContent).toContain('interface Transformer');
      expect(pluginApiDocContent).toContain('class MarkdownTransformer');
    });

    it('应包含导出器能力示例', () => {
      expect(pluginApiDocContent).toContain('interface Exporter');
      expect(pluginApiDocContent).toContain('class PDFExporter');
    });
  });
});

describe('插件开发指南验证', () => {
  describe('PLUGIN_DEVELOPMENT.md 文档完整性', () => {
    it('应包含目录部分', () => {
      expect(pluginDevDocContent).toContain('## 目录');
    });

    it('应包含快速开始部分', () => {
      expect(pluginDevDocContent).toContain('## 快速开始');
    });

    it('应包含项目结构部分', () => {
      expect(pluginDevDocContent).toContain('## 项目结构');
    });

    it('应包含开发环境部分', () => {
      expect(pluginDevDocContent).toContain('## 开发环境');
    });

    it('应包含创建插件部分', () => {
      expect(pluginDevDocContent).toContain('## 创建插件');
    });

    it('应包含插件清单部分', () => {
      expect(pluginDevDocContent).toContain('## 插件清单');
    });

    it('应包含实现插件部分', () => {
      expect(pluginDevDocContent).toContain('## 实现插件');
    });

    it('应包含测试插件部分', () => {
      expect(pluginDevDocContent).toContain('## 测试插件');
    });

    it('应包含发布插件部分', () => {
      expect(pluginDevDocContent).toContain('## 发布插件');
    });

    it('应包含最佳实践部分', () => {
      expect(pluginDevDocContent).toContain('## 最佳实践');
    });

    it('应包含故障排查部分', () => {
      expect(pluginDevDocContent).toContain('## 故障排查');
    });

    it('应包含示例项目部分', () => {
      expect(pluginDevDocContent).toContain('## 示例项目');
    });
  });

  describe('插件类型示例', () => {
    it('应包含渲染器插件示例', () => {
      expect(pluginDevDocContent).toContain('### 类型 1: 渲染器插件');
      expect(pluginDevDocContent).toContain('class MyRenderer implements Renderer');
    });

    it('应包含转换器插件示例', () => {
      expect(pluginDevDocContent).toContain('### 类型 2: 转换器插件');
      expect(pluginDevDocContent).toContain('class MyTransformer implements Transformer');
    });

    it('应包含导出器插件示例', () => {
      expect(pluginDevDocContent).toContain('### 类型 3: 导出器插件');
      expect(pluginDevDocContent).toContain('class MyExporter implements Exporter');
    });

    it('应包含事件监听插件示例', () => {
      expect(pluginDevDocContent).toContain('### 类型 4: 事件监听插件');
      expect(pluginDevDocContent).toContain('class EventListenerPlugin');
    });
  });

  describe('配置文件示例', () => {
    it('应包含 TypeScript 配置示例', () => {
      expect(pluginDevDocContent).toContain('tsconfig.json');
    });

    it('应包含 package.json 配置示例', () => {
      expect(pluginDevDocContent).toContain('package.json');
    });
  });

  describe('测试文档', () => {
    it('应包含单元测试示例', () => {
      expect(pluginDevDocContent).toContain('describe(');
      expect(pluginDevDocContent).toContain('it(');
    });
  });

  describe('最佳实践文档', () => {
    it('应包含错误处理最佳实践', () => {
      expect(pluginDevDocContent).toContain('### 1. 错误处理');
    });

    it('应包含资源清理最佳实践', () => {
      expect(pluginDevDocContent).toContain('### 2. 资源清理');
    });

    it('应包含配置管理最佳实践', () => {
      expect(pluginDevDocContent).toContain('### 3. 配置管理');
    });

    it('应包含日志记录最佳实践', () => {
      expect(pluginDevDocContent).toContain('### 4. 日志记录');
    });

    it('应包含类型安全最佳实践', () => {
      expect(pluginDevDocContent).toContain('### 5. 类型安全');
    });

    it('应包含性能优化最佳实践', () => {
      expect(pluginDevDocContent).toContain('### 6. 性能优化');
    });
  });

  describe('故障排查文档', () => {
    it('应包含常见问题', () => {
      expect(pluginDevDocContent).toContain('### 常见问题');
    });

    it('应包含调试技巧', () => {
      expect(pluginDevDocContent).toContain('### 调试技巧');
    });
  });
});

describe('文档格式验证', () => {
  it('API.md 应使用正确的 Markdown 语法', () => {
    // 检查标题层级
    expect(apiDocContent).toMatch(/^# .+/m);
    expect(apiDocContent).toMatch(/^## .+/m);
    expect(apiDocContent).toMatch(/^### .+/m);

    // 检查代码块
    expect(apiDocContent).toMatch(/```json/);
    expect(apiDocContent).toMatch(/```typescript/);
    expect(apiDocContent).toMatch(/```bash/);
    expect(apiDocContent).toMatch(/```python/);

    // 检查表格
    expect(apiDocContent).toMatch(/\|.+\|.+\|/);
  });

  it('PLUGIN_API.md 应使用正确的 Markdown 语法', () => {
    expect(pluginApiDocContent).toMatch(/^# .+/m);
    expect(pluginApiDocContent).toMatch(/^## .+/m);
    expect(pluginApiDocContent).toMatch(/```typescript/);
    expect(pluginApiDocContent).toMatch(/```json/);
  });

  it('PLUGIN_DEVELOPMENT.md 应使用正确的 Markdown 语法', () => {
    expect(pluginDevDocContent).toMatch(/^# .+/m);
    expect(pluginDevDocContent).toMatch(/^## .+/m);
    expect(pluginDevDocContent).toMatch(/```typescript/);
    expect(pluginDevDocContent).toMatch(/```json/);
    expect(pluginDevDocContent).toMatch(/```bash/);
  });
});

describe('文档一致性验证', () => {
  it('所有文档应使用一致的术语', () => {
    // 检查关键术语的一致性
    expect(apiDocContent).toContain('Folder-Site CLI');
    expect(pluginApiDocContent).toContain('Folder-Site CLI');
    expect(pluginDevDocContent).toContain('Folder-Site CLI');
  });

  it('API 文档中的端点列表应与实际端点一致', () => {
    // 验证端点文档中提到的所有端点
    const expectedEndpoints = [
      '/api/health',
      '/api',
      '/api/files',
      '/api/files/tree/list',
      '/api/files/:path',
      '/api/search',
      '/api/workhub',
      '/api/workhub/adrs',
      '/api/workhub/adrs/:id',
      '/api/workhub/issues',
      '/api/workhub/issues/:id',
      '/api/workhub/prs',
      '/api/workhub/prs/:id',
      '/api/export'
    ];

    expectedEndpoints.forEach(endpoint => {
      expect(apiDocContent).toContain(endpoint);
    });
  });
});