# 前端插件自动化实现方案

## 第一步：扩展 manifest.json

在每个插件的 manifest.json 中添加 frontend 配置：

```json
{
  "id": "mermaid-renderer",
  "capabilities": [{
    "type": "renderer",
    "name": "mermaid",
    "frontend": {
      "codeBlockLang": ["mermaid", "mmd"],
      "library": "mermaid",
      "initFunction": "initialize",
      "renderFunction": "render",
      "theme": {
        "light": "default",
        "dark": "dark"
      }
    }
  }]
}
```

## 第二步：创建通用渲染器

文件：`src/client/lib/plugin-renderer.ts`

```typescript
export class PluginRenderer {
  private plugins: Map<string, PluginConfig> = new Map();
  
  async loadPlugins() {
    // 读取所有 manifest.json
    const manifests = await this.discoverManifests();
    
    // 注册插件
    for (const manifest of manifests) {
      this.registerPlugin(manifest);
    }
  }
  
  async renderAll(container: HTMLElement) {
    // 自动渲染所有代码块
    for (const [lang, plugin] of this.plugins) {
      await this.renderPlugin(container, lang, plugin);
    }
  }
}
```

## 第三步：简化 MarkdownRenderer

```typescript
// 之前：手动集成每个库
const renderMermaidDiagrams = async () => { /* ... */ };
const renderVegaDiagrams = async () => { /* ... */ };

// 之后：自动加载
const pluginRenderer = new PluginRenderer();
await pluginRenderer.loadPlugins();
await pluginRenderer.renderAll(container);
```

## 优势

1. **添加新插件**：只需创建 manifest.json
2. **配置统一**：前端和服务端共享配置
3. **代码简洁**：无需手动集成每个库
