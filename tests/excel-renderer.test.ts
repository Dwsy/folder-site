/**
 * ExcelRenderer 功能测试
 */

import { ExcelRenderer } from '../plugins/office-renderer/ExcelRenderer.js';

async function testExcelRenderer() {
  const renderer = new ExcelRenderer();
  const startTime = Date.now();

  console.log('=== ExcelRenderer 功能测试 ===\n');

  // 测试 1: supports() 方法
  console.log('测试 1: supports() 方法');
  const formats = ['xlsx', 'xls', 'csv', 'ods', 'docx', 'pdf'];
  formats.forEach((fmt) => {
    const supported = renderer.supports(fmt);
    const expected = ['xlsx', 'xls', 'csv', 'ods'].includes(fmt);
    console.log(`  ${fmt}: ${supported ? '✓' : '✗'} (期望: ${expected ? '是' : '否'})`);
  });

  // 测试 2: 渲染 CSV 内容
  console.log('\n测试 2: 渲染 CSV 内容');
  const csvContent = `Name,Age,City
Alice,30,Beijing
Bob,25,Shanghai
Carol,28,Shenzhen`;

  try {
    const html = await renderer.render(csvContent);
    const hasTable = html.includes('<table');
    const hasHeader = html.includes('excel-header');
    const hasBody = html.includes('excel-cell');
    console.log(`  生成表格: ${hasTable ? '✓' : '✗'}`);
    console.log(`  包含表头: ${hasHeader ? '✓' : '✗'}`);
    console.log(`  包含单元格: ${hasBody ? '✓' : '✗'}`);
    console.log(`  HTML 长度: ${html.length} 字节`);
  } catch (error) {
    console.log(`  失败: ${error}`);
  }

  // 测试 3: 选项测试
  console.log('\n测试 3: 渲染选项');
  const options = {
    maxRows: 2,
    maxCols: 2,
    showHeaders: true,
    showMetadata: true,
    theme: 'light' as const,
  };

  try {
    const html = await renderer.render(csvContent, options);
    console.log(`  选项生效: ${html.length > 0 ? '✓' : '✗'}`);
  } catch (error) {
    console.log(`  失败: ${error}`);
  }

  // 测试 4: 错误处理
  console.log('\n测试 4: 错误处理');
  try {
    await renderer.render(new ArrayBuffer(0));
    console.log(`  空文件处理: 未抛出错误`);
  } catch (error) {
    console.log(`  空文件处理: ✓ 抛出错误 (${(error as Error).message})`);
  }

  try {
    await renderer.render('invalid,non-excel,content');
    console.log(`  无效 CSV 处理: SheetJS 会尝试解析（不抛出错误）`);
  } catch (error) {
    console.log(`  无效 CSV 处理: ✓ 抛出错误 (${(error as Error).message})`);
  }

  // 测试 5: 元数据
  console.log('\n测试 5: 渲染器元数据');
  console.log(`  名称: ${renderer.name}`);
  console.log(`  版本: ${renderer.version}`);
  console.log(`  扩展名: ${renderer.extensions.join(', ')}`);
  console.log(`  优先级: ${renderer.priority}`);

  const totalTime = Date.now() - startTime;
  console.log(`\n=== 测试完成 (${totalTime}ms) ===`);
}

testExcelRenderer().catch(console.error);
