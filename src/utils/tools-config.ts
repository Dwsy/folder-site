/**
 * External Tools Configuration
 *
 * Configuration for managing external tools (fd, rg) with automatic download
 */

import type { Platform, Architecture } from './tools-manager.js';

/**
 * Tool version
 */
export const TOOL_VERSIONS = {
  fd: 'v10.1.0',
  rg: '14.1.0',
} as const;

/**
 * Tool asset name generator
 */
export interface AssetNameGenerator {
  (version: string, platform: Platform, architecture: Architecture): string | null;
}

/**
 * Tool configuration
 */
export interface ToolConfig {
  /** Tool name */
  name: string;
  /** GitHub repository (owner/repo) */
  repo: string;
  /** Binary name */
  binaryName: string;
  /** Version tag prefix (e.g., 'v' for fd, '' for rg) */
  tagPrefix: string;
  /** Function to generate asset name for download */
  getAssetName: AssetNameGenerator;
  /** Binary executable name in archive */
  binaryPath?: string;
}

/**
 * Tool configurations
 */
export const TOOLS: Record<string, ToolConfig> = {
  fd: {
    name: 'fd',
    repo: 'sharkdp/fd',
    binaryName: 'fd',
    tagPrefix: 'v',
    getAssetName: (version, platform, architecture) => {
      const archStr = architecture === 'arm64' ? 'aarch64' : 'x86_64';

      if (platform === 'darwin') {
        return `fd-${version}-${archStr}-apple-darwin.tar.gz`;
      } else if (platform === 'linux') {
        return `fd-${version}-${archStr}-unknown-linux-gnu.tar.gz`;
      } else if (platform === 'win32') {
        return `fd-${version}-${archStr}-pc-windows-msvc.zip`;
      }

      return null;
    },
    binaryPath: 'fd',
  },
  rg: {
    name: 'ripgrep',
    repo: 'BurntSushi/ripgrep',
    binaryName: 'rg',
    tagPrefix: '',
    getAssetName: (version, platform, architecture) => {
      const archStr = architecture === 'arm64' ? 'aarch64' : 'x86_64';

      if (platform === 'darwin') {
        return `ripgrep-${version}-${archStr}-apple-darwin.tar.gz`;
      } else if (platform === 'linux') {
        if (architecture === 'arm64') {
          return `ripgrep-${version}-aarch64-unknown-linux-gnu.tar.gz`;
        }
        return `ripgrep-${version}-x86_64-unknown-linux-musl.tar.gz`;
      } else if (platform === 'win32') {
        return `ripgrep-${version}-${archStr}-pc-windows-msvc.zip`;
      }

      return null;
    },
    binaryPath: 'rg',
  },
};

/**
 * Get tool configuration
 */
export function getToolConfig(tool: string): ToolConfig | undefined {
  return TOOLS[tool];
}

/**
 * Get all tool names
 */
export function getToolNames(): string[] {
  return Object.keys(TOOLS);
}

/**
 * Check if tool is supported
 */
export function isToolSupported(tool: string): boolean {
  return tool in TOOLS;
}