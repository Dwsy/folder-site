/**
 * 插件清单 API
 * 返回所有插件的 manifest.json
 */

import { Hono } from 'hono';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

const pluginsApi = new Hono();

/**
 * GET /api/plugins/manifests
 * 获取所有插件的清单
 */
pluginsApi.get('/manifests', async (c) => {
  try {
    const pluginsDir = join(process.cwd(), 'plugins');
    const manifests = [];

    // 读取 plugins 目录
    const entries = await readdir(pluginsDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const manifestPath = join(pluginsDir, entry.name, 'manifest.json');
        
        try {
          const content = await readFile(manifestPath, 'utf-8');
          const manifest = JSON.parse(content);
          manifests.push(manifest);
        } catch (error) {
          console.warn(`Failed to read manifest for ${entry.name}:`, error);
        }
      }
    }

    return c.json(manifests);
  } catch (error) {
    console.error('Error reading plugin manifests:', error);
    return c.json({ error: 'Failed to read plugin manifests' }, 500);
  }
});

export default pluginsApi;
