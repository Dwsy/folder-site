/**
 * 文件扫描服务使用示例
 */

import { FileScanner, scanDirectory, scanFiles, scanDirectoryDefault } from '../src/server/services/scanner';
import { join } from 'node:path';

// 示例 1: 使用默认配置扫描当前目录
async function example1() {
  console.log('=== 示例 1: 使用默认配置 ===');
  const result = await scanDirectoryDefault(process.cwd());

  console.log(`扫描根目录: ${result.rootPath}`);
  console.log(`找到 ${result.stats.matchedFiles} 个匹配的文件`);
  console.log(`扫描耗时: ${result.duration}ms`);
  console.log(`文件列表:`);
  result.files.filter(f => !f.isDirectory).forEach(file => {
    console.log(`  - ${file.relativePath} (${file.size} bytes)`);
  });
}

// 示例 2: 自定义扫描选项
async function example2() {
  console.log('\n=== 示例 2: 自定义扫描选项 ===');
  const options = {
    rootDir: process.cwd(),
    extensions: ['.md', '.mmd'], // 只扫描 Markdown 和 Mermaid 文件
    excludeDirs: ['node_modules', '.git', 'dist'],
    maxDepth: 3, // 最多扫描 3 层深度
    strategy: 'depth' as const, // 深度优先扫描
  };

  const result = await scanDirectory(options);

  console.log(`扫描根目录: ${result.rootPath}`);
  console.log(`找到 ${result.stats.matchedFiles} 个文件`);
  console.log(`总大小: ${result.stats.totalSize} bytes`);
}

// 示例 3: 使用 FileScanner 类
async function example3() {
  console.log('\n=== 示例 3: 使用 FileScanner 类 ===');
  const scanner = new FileScanner({
    rootDir: join(process.cwd(), 'docs'),
    extensions: ['.md'],
    maxDepth: 2,
  });

  const result = await scanner.scan();

  console.log(`扫描根目录: ${result.rootPath}`);
  console.log(`找到 ${result.stats.matchedFiles} 个 Markdown 文件`);

  // 获取文件详细信息
  result.files.filter(f => !f.isDirectory).forEach(file => {
    console.log(`\n文件: ${file.name}`);
    console.log(`  路径: ${file.path}`);
    console.log(`  相对路径: ${file.relativePath}`);
    console.log(`  大小: ${file.size} bytes`);
    console.log(`  修改时间: ${file.modifiedAt.toISOString()}`);
  });

  // 检查是否有错误
  const errors = scanner.getErrors();
  if (errors.length > 0) {
    console.log(`\n遇到 ${errors.length} 个错误:`);
    errors.forEach(error => console.log(`  - ${error.message}`));
  }
}

// 示例 4: 只获取文件列表（不包含目录）
async function example4() {
  console.log('\n=== 示例 4: 只获取文件列表 ===');
  const files = await scanFiles({
    rootDir: process.cwd(),
    extensions: ['.ts', '.tsx'],
    excludeDirs: ['node_modules', 'dist'],
  });

  console.log(`找到 ${files.length} 个 TypeScript 文件:`);
  files.forEach(file => {
    console.log(`  - ${file.relativePath}`);
  });
}

// 示例 5: 广度优先扫描
async function example5() {
  console.log('\n=== 示例 5: 广度优先扫描 ===');
  const scanner = new FileScanner({
    rootDir: process.cwd(),
    extensions: ['.md', '.json'],
    strategy: 'breadth', // 广度优先
  });

  const result = await scanner.scan();

  console.log(`扫描根目录: ${result.rootPath}`);
  console.log(`找到 ${result.stats.matchedFiles} 个文件`);
  console.log(`扫描耗时: ${result.duration}ms`);
}

// 运行所有示例
async function runExamples() {
  try {
    await example1();
    await example2();
    await example3();
    await example4();
    await example5();
    console.log('\n✅ 所有示例运行完成');
  } catch (error) {
    console.error('❌ 运行示例时出错:', error);
  }
}

// 如果直接运行此文件
if (import.meta.main) {
  runExamples();
}

export { runExamples };