/**
 * Vega Renderer Plugin
 */

import type { Plugin, PluginContext, PluginManifest, PluginStatus } from '../../src/types/plugin.js';
import { VegaRenderer } from './VegaRenderer.js';

export class VegaRendererPlugin implements Plugin {
  readonly id = 'vega-renderer';
  readonly name = 'Vega Renderer';
  readonly version = '1.0.0';
  readonly manifest: PluginManifest;
  
  status: PluginStatus = 'inactive';
  error?: Error;
  
  private context?: PluginContext;
  private vegaRenderer?: VegaRenderer;
  private vegaLiteRenderer?: VegaRenderer;

  constructor(manifest?: PluginManifest) {
    this.manifest = manifest || {} as PluginManifest;
  }

  async initialize(context: PluginContext): Promise<void> {
    this.context = context;
    this.vegaRenderer = new VegaRenderer('vega');
    this.vegaLiteRenderer = new VegaRenderer('vega-lite');
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

export default VegaRendererPlugin;
