/**
 * 使用插件渲染器的 React Hook
 * 支持注册自定义渲染器，保留所有现有功能
 */

import { useEffect, useRef, useState } from 'react';
import { PluginRenderer, type RendererFunction } from '../lib/plugin-renderer.js';

export function usePluginRenderer(
  html: string | null,
  theme: 'light' | 'dark' | 'auto',
  customRenderers?: Record<string, RendererFunction>
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<PluginRenderer | null>(null);
  const [pluginsLoaded, setPluginsLoaded] = useState(false);

  useEffect(() => {
    // 初始化渲染器（只初始化一次）
    if (!rendererRef.current) {
      console.log('[usePluginRenderer] Initializing renderer...');
      rendererRef.current = new PluginRenderer();
      
      // 加载插件配置
      rendererRef.current.loadPlugins()
        .then(() => {
          console.log('[usePluginRenderer] Plugins loaded successfully');
          setPluginsLoaded(true);
        })
        .catch(console.error);
    }
    
    // 注册自定义渲染器（每次 customRenderers 变化时更新）
    if (rendererRef.current && customRenderers) {
      console.log('[usePluginRenderer] Registering custom renderers:', Object.keys(customRenderers));
      for (const [name, renderer] of Object.entries(customRenderers)) {
        rendererRef.current.registerRenderer(name, renderer);
      }
    }
  }, [customRenderers]);

  useEffect(() => {
    if (!html || !containerRef.current || !rendererRef.current || !pluginsLoaded) {
      console.log('[usePluginRenderer] Skipping render:', { 
        hasHtml: !!html, 
        hasContainer: !!containerRef.current, 
        hasRenderer: !!rendererRef.current,
        pluginsLoaded 
      });
      return;
    }

    console.log('[usePluginRenderer] Rendering plugins...');

    // 确定主题
    const effectiveTheme = theme === 'auto'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme;

    // 渲染所有插件
    rendererRef.current.renderAll(containerRef.current, effectiveTheme).catch(console.error);
  }, [html, theme, pluginsLoaded]);

  return containerRef;
}
