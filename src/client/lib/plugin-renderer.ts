/**
 * 前端插件渲染器 v2
 * 保留所有现有功能，只自动化插件发现和调用
 */

export interface PluginFrontendConfig {
  enabled: boolean;
  codeBlockLang: string[];
  library: string;
  className: string;
  theme?: {
    light: string;
    dark: string;
  };
}

export interface PluginCapability {
  type: string;
  name: string;
  frontend?: PluginFrontendConfig;
}

export interface PluginManifest {
  id: string;
  name: string;
  capabilities: PluginCapability[];
}

// 渲染器函数类型
export type RendererFunction = (
  container: HTMLElement,
  theme: 'light' | 'dark'
) => Promise<void>;

export class PluginRenderer {
  private plugins: Map<string, PluginFrontendConfig> = new Map();
  private renderers: Map<string, RendererFunction> = new Map();

  /**
   * 注册自定义渲染器函数
   * 这样可以保留现有的复杂渲染逻辑
   */
  registerRenderer(pluginName: string, renderer: RendererFunction): void {
    this.renderers.set(pluginName, renderer);
  }

  /**
   * 加载所有插件配置
   */
  async loadPlugins(): Promise<void> {
    console.log('[PluginRenderer] Loading plugins...');
    const manifests = await this.fetchManifests();
    console.log('[PluginRenderer] Fetched manifests:', manifests.length);
    
    for (const manifest of manifests) {
      for (const capability of manifest.capabilities) {
        if (capability.frontend?.enabled) {
          console.log(`[PluginRenderer] Registering plugin: ${capability.name}`, capability.frontend);
          // 注册插件配置
          this.plugins.set(capability.name, capability.frontend);
        }
      }
    }
    
    console.log('[PluginRenderer] Loaded plugins:', Array.from(this.plugins.keys()));
    console.log('[PluginRenderer] Registered renderers:', Array.from(this.renderers.keys()));
  }

  /**
   * 从服务端获取插件清单
   */
  private async fetchManifests(): Promise<PluginManifest[]> {
    try {
      const response = await fetch('/api/plugins/manifests');
      if (!response.ok) {
        console.warn('Failed to fetch plugin manifests');
        return [];
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching plugin manifests:', error);
      return [];
    }
  }

  /**
   * 渲染所有已注册的插件
   */
  async renderAll(container: HTMLElement, theme: 'light' | 'dark' = 'light'): Promise<void> {
    console.log('[PluginRenderer] renderAll called, plugins:', Array.from(this.plugins.keys()));
    console.log('[PluginRenderer] renderers:', Array.from(this.renderers.keys()));
    
    // 收集所有需要渲染的插件名称（插件配置 + 自定义渲染器）
    const allPluginNames = new Set([
      ...Array.from(this.plugins.keys()),
      ...Array.from(this.renderers.keys())
    ]);
    
    console.log('[PluginRenderer] All plugin names to render:', Array.from(allPluginNames));
    
    for (const pluginName of allPluginNames) {
      console.log(`[PluginRenderer] Processing plugin: ${pluginName}`);
      // 检查是否有自定义渲染器
      const renderer = this.renderers.get(pluginName);
      if (renderer) {
        console.log(`[PluginRenderer] Using custom renderer for ${pluginName}`);
        // 使用自定义渲染器（保留所有现有功能）
        await renderer(container, theme);
      } else {
        console.log(`[PluginRenderer] Using default renderer for ${pluginName}`);
        // 使用默认渲染器（简单场景）
        const config = this.plugins.get(pluginName);
        if (config) {
          await this.renderPlugin(container, pluginName, config, theme);
        }
      }
    }
  }

  /**
   * 默认渲染器（用于简单插件）
   */
  private async renderPlugin(
    container: HTMLElement,
    pluginName: string,
    config: PluginFrontendConfig,
    theme: 'light' | 'dark'
  ): Promise<void> {
    const blocks = container.querySelectorAll(`pre.${config.className} code`);
    if (blocks.length === 0) return;

    console.log(`Rendering ${pluginName} with default renderer`);
    // 默认渲染逻辑...
  }

  /**
   * 获取已加载的插件列表
   */
  getLoadedPlugins(): string[] {
    return Array.from(this.plugins.keys());
  }

  /**
   * 检查插件是否已加载
   */
  hasPlugin(pluginName: string): boolean {
    return this.plugins.has(pluginName);
  }
}
