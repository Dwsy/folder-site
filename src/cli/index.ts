#!/usr/bin/env bun

// @ts-nocheck - Bun 的 fetch 函数签名与 TypeScript 标准不同，暂时禁用类型检查
import { parseArgsOrExit, type CliConfig } from "./parser.js";

/**
 * Folder-Site CLI 主入口
 * 负责启动 Hono 服务器
 */

/**
 * 启动服务器
 * @param config - CLI 配置
 */
async function startServer(config: CliConfig): Promise<void> {
  const { createServer } = await import('../server/index.js');
  const app = createServer();

  const port = config.port;
  const dir = config.dir;

  // 切换到指定目录
  process.chdir(dir);

  console.log(`🚀 Folder-Site CLI v${getVersion()}`);
  console.log(`🌐 Running at http://localhost:${port}`);
  console.log(`📁 Serving directory: ${process.cwd()}`);

  // 显示白名单配置（如果有）
  if (config.whitelist) {
    console.log(`🔒 Whitelist mode: ${config.whitelist}`);
  }

  console.log('');
  console.log('📚 API endpoints:');
  console.log('   - GET  /api/health  - Health check');
  console.log('   - GET  /api/        - API information');
  console.log('   - GET  /api/files   - File operations');
  console.log('   - GET  /api/search  - Search operations');
  console.log('');
  console.log('Press Ctrl+C to stop');

  // 设置环境变量
  process.env.PORT = port.toString();
  process.env.SERVE_DIR = dir;

  // 传递白名单配置
  if (config.whitelist) {
    process.env.WHITELIST = config.whitelist;
  }

  // 读取配置文件中的白名单
  const { loadConfig } = await import('../server/lib/config-loader.js');
  const fileConfig = loadConfig(process.cwd());
  if (fileConfig.build?.whitelist) {
    process.env.FILE_WHITELIST = JSON.stringify(fileConfig.build.whitelist);
  }

  // 启动 Bun 服务器
  const server = Bun.serve({
    port,
    fetch: app.fetch,
  });

  console.log(`✅ Server started successfully on port ${port}`);
}

/**
 * 获取版本信息
 * @returns 版本号
 */
function getVersion(): string {
  const { version } = require('../../package.json');
  return version;
}

/**
 * CLI 主函数
 */
async function main(): Promise<void> {
  try {
    // 解析命令行参数
    const config = parseArgsOrExit();

    // 启动服务器
    await startServer(config);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`❌ 启动失败: ${error.message}`);
      process.exit(1);
    } else {
      console.error('❌ 启动失败: 未知错误');
      process.exit(1);
    }
  }
}

// 执行主函数
main();

// 保持进程运行
setInterval(() => {}, 1000);