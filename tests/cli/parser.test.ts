#!/usr/bin/env bun

import { describe, it, expect } from 'bun:test';
import { parseArgs, validateConfig, getDefaultConfig } from '../../src/cli/parser';

/**
 * CLI 解析器测试
 */

describe('CLI 参数解析', () => {
  describe('默认配置', () => {
    it('应该返回正确的默认配置', () => {
      const config = getDefaultConfig();
      expect(config).toEqual({
        port: 3000,
        help: false,
        version: false,
      });
    });
  });

  describe('端口验证', () => {
    it('应该接受有效的端口号', () => {
      const config = parseArgs(['node', 'cli', '--port', '8080']);
      expect(config.port).toBe(8080);
    });

    it('应该接受最小端口号 1', () => {
      const config = parseArgs(['node', 'cli', '--port', '1']);
      expect(config.port).toBe(1);
    });

    it('应该接受最大端口号 65535', () => {
      const config = parseArgs(['node', 'cli', '--port', '65535']);
      expect(config.port).toBe(65535);
    });

    it('应该拒绝超出范围的端口号', () => {
      expect(() => {
        parseArgs(['node', 'cli', '--port', '0']);
      }).toThrow();
    });

    it('应该拒绝超出范围的端口号（上限）', () => {
      expect(() => {
        parseArgs(['node', 'cli', '--port', '70000']);
      }).toThrow();
    });

    it('应该拒绝非数字端口号', () => {
      expect(() => {
        parseArgs(['node', 'cli', '--port', 'abc']);
      }).toThrow();
    });
  });

  describe('配置验证', () => {
    it('应该验证有效的配置', () => {
      const result = validateConfig({ port: 3000, help: false, version: false });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('应该拒绝无效的端口号', () => {
      const result = validateConfig({ port: -1, help: false, version: false });
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});