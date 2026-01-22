import { scanDirectoryDefault } from '../src/server/services/scanner.ts';

const result = await scanDirectoryDefault(process.cwd());

console.log('📁 文件扫描服务验证');
console.log('='.repeat(50));
console.log(`扫描根目录: ${result.rootPath}`);
console.log(`找到 ${result.stats.matchedFiles} 个匹配的文件`);
console.log(`扫描耗时: ${result.duration}ms`);
console.log(`总大小: ${(result.stats.totalSize / 1024).toFixed(2)} KB`);
console.log('');

console.log('文件列表（前10个）:');
result.files.filter(f => !f.isDirectory).slice(0, 10).forEach(file => {
  console.log(`  ✓ ${file.relativePath} (${file.size} bytes)`);
});

if (result.files.filter(f => !f.isDirectory).length > 10) {
  console.log(`  ... 还有 ${result.stats.matchedFiles - 10} 个文件`);
}

console.log('');
console.log('✅ 文件扫描服务工作正常！');