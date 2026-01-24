/**
 * JSON Canvas Renderer Plugin
 */

import type { Plugin, PluginContext, PluginManifest, PluginStatus } from '../../src/types/plugin.js';
import { JSONCanvasRenderer } from './JSONCanvasRenderer.js';

export class JSONCanvasRendererPlugin implements Plugin {
  readonly id = 'json-canvas-renderer';
  readonly name = 'JSON Canvas Renderer';
  readonly version = '1.0.0';
  readonly manifest: PluginManifest;
  
  status: PluginStatus = 'inactive';
  error?: Error;
  
  private context?: PluginContext;
  private renderer?: JSONCanvasRenderer;

  constructor(manifest?: PluginManifest) {
    this.manifest = manifest || {} as PluginManifest;
  }

  async initialize(context: PluginContext): Promise<void> {
    this.context = context;
    this.renderer = new JSONCanvasRenderer();
    this.status = 'inactive';
  }

  async activate(): Promise<void> {
    this.status = 'active';
  }

  async deactivate(): Promise<void> {
    this.status = 'inactive';
  }

  async dispose(): Promise<void> {
    this.context = undefined;
  }
}

export default JSONCanvasRendererPlugin;
