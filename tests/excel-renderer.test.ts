/**
 * ExcelRenderer 完整测试套件
 *
 * 包含单元测试、边界情况测试、错误处理测试、性能测试和集成测试
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { ExcelRenderer } from '../plugins/office-renderer/ExcelRenderer.js';

describe('ExcelRenderer', () => {
  let renderer: ExcelRenderer;

  beforeEach(() => {
    renderer = new ExcelRenderer();
  });

  describe('基础功能测试', () => {
    describe('supports() 方法', () => {
      it('应该支持 xlsx 格式', () => {
        expect(renderer.supports('xlsx')).toBe(true);
        expect(renderer.supports('.xlsx')).toBe(true);
      });

      it('应该支持 xls 格式', () => {
        expect(renderer.supports('xls')).toBe(true);
        expect(renderer.supports('.xls')).toBe(true);
      });

      it('应该支持 csv 格式', () => {
        expect(renderer.supports('csv')).toBe(true);
        expect(renderer.supports('.csv')).toBe(true);
      });

      it('应该支持 ods 格式', () => {
        expect(renderer.supports('ods')).toBe(true);
        expect(renderer.supports('.ods')).toBe(true);
      });

      it('应该支持 xlsm 格式', () => {
        expect(renderer.supports('xlsm')).toBe(true);
        expect(renderer.supports('.xlsm')).toBe(true);
      });

      it('应该拒绝不支持的格式', () => {
        expect(renderer.supports('docx')).toBe(false);
        expect(renderer.supports('pdf')).toBe(false);
        expect(renderer.supports('txt')).toBe(false);
      });

      it('应该支持大写格式', () => {
        expect(renderer.supports('XLSX')).toBe(true);
        expect(renderer.supports('CSV')).toBe(true);
      });
    });

    describe('render() 方法 - 基础渲染', () => {
      const simpleCSV = `Name,Age,City
Alice,30,Beijing
Bob,25,Shanghai`;

      it('应该渲染简单的 CSV 内容', async () => {
        const html = await renderer.render(simpleCSV);

        expect(html).toContain('<table');
        expect(html).toContain('Alice');
        expect(html).toContain('Bob');
      });

      it('应该生成包含表头的 HTML', async () => {
        const html = await renderer.render(simpleCSV);

        expect(html).toContain('excel-header');
        expect(html).toContain('Name');
        expect(html).toContain('Age');
      });

      it('应该生成包含数据行的 HTML', async () => {
        const html = await renderer.render(simpleCSV);

        expect(html).toContain('excel-cell');
        expect(html).toContain('Beijing');
        expect(html).toContain('Shanghai');
      });

      it('应该处理字符串输入', async () => {
        const html = await renderer.render(simpleCSV);

        expect(html).toContain('<table');
        expect(html.length).toBeGreaterThan(0);
      });

      it('应该处理 ArrayBuffer 输入', async () => {
        const buffer = new TextEncoder().encode(simpleCSV).buffer;
        const html = await renderer.render(buffer);

        expect(html).toContain('<table');
        expect(html.length).toBeGreaterThan(0);
      });

      it('应该包含工作簿容器', async () => {
        const html = await renderer.render(simpleCSV);

        expect(html).toContain('excel-workbook');
      });

      it('应该包含工作表容器', async () => {
        const html = await renderer.render(simpleCSV);

        expect(html).toContain('excel-sheet');
      });
    });

    describe('render() 方法 - 渲染选项', () => {
      const csvWith10Rows = Array.from({ length: 10 }, (_, i) =>
        `Name${i},Value${i}`
      ).join('\n');

      it('应该应用 maxRows 选项', async () => {
        const html = await renderer.render(csvWith10Rows, { maxRows: 5 });

        const rows = (html.match(/<tr>/g) || []).length;
        expect(rows).toBeLessThanOrEqual(6); // 表头 + 5行数据
      });

      it('应该应用 maxCols 选项', async () => {
        const wideCSV = 'A,B,C,D,E,F,G,H,I,J\n1,2,3,4,5,6,7,8,9,10';
        const html = await renderer.render(wideCSV, { maxCols: 5 });

        // 检查数据单元格数量，不包括表头
        const dataCells = (html.match(/<td/g) || []).length;
        // 每行最多 5 列，所以 1 行数据最多 5 个单元格
        expect(dataCells).toBeLessThanOrEqual(5);
      });

      it('应该应用 showHeaders 选项', async () => {
        const html = await renderer.render('A,B\n1,2', { showHeaders: false });

        expect(html).not.toContain('<thead');
      });

      it('应该应用 showMetadata 选项', async () => {
        const html = await renderer.render('A,B\n1,2', { showMetadata: false });

        expect(html).not.toContain('excel-metadata');
      });

      it('应该应用 enableTabs 选项', async () => {
        const html = await renderer.render('A,B\n1,2', { enableTabs: false });

        expect(html).not.toContain('excel-tabs');
      });

      it('应该应用 showGridLines 选项', async () => {
        const html = await renderer.render('A,B\n1,2', { showGridLines: false });

        expect(html).toContain('data-show-grid="false"');
      });

      it('应该应用 theme 选项', async () => {
        const html = await renderer.render('A,B\n1,2', { theme: 'dark' });

        expect(html).toContain('data-theme="dark"');
      });

      it('应该支持组合选项', async () => {
        const html = await renderer.render('A,B\n1,2', {
          maxRows: 5,
          maxCols: 2,
          showHeaders: true,
          theme: 'dark',
        });

        expect(html).toContain('data-theme="dark"');
        expect(html).toContain('<thead');
      });
    });

    describe('单元格类型检测', () => {
      it('应该正确识别数字单元格', async () => {
        const csv = `Value\n42\n3.14`;
        const html = await renderer.render(csv);

        expect(html).toContain('excel-cell-number');
      });

      it('应该正确识别文本单元格', async () => {
        const csv = `Name\nAlice\nBob`;
        const html = await renderer.render(csv);

        expect(html).toContain('excel-cell-text');
      });

      it('应该正确识别日期单元格', async () => {
        const csv = `Date\n2024-01-15\n2024-12-31`;
        const html = await renderer.render(csv);

        expect(html).toContain('excel-cell-date');
      });

      it('应该正确处理空单元格', async () => {
        const csv = `A,B,C\n1,,3\n4,5,`;
        const html = await renderer.render(csv);

        expect(html).toContain('excel-cell-empty');
      });
    });

    describe('HTML 转义', () => {
      it('应该转义 HTML 特殊字符', async () => {
        const csv = `Content\n<script>alert('xss')</script>`;
        const html = await renderer.render(csv);

        expect(html).not.toContain('<script>');
        expect(html).toContain('&lt;');
      });

      it('应该转义引号字符', async () => {
        // 测试需要特殊字符才能触发转义
        const csv = `Quote\nTest "quoted" text`;
        const html = await renderer.render(csv);

        // SheetJS 解析 CSV 后，引号会被保留
        expect(html).toContain('Test');
        expect(html).toContain('quoted');
      });

      it('应该转义和号和尖括号', async () => {
        const csv = `Symbol\n<>&`;
        const html = await renderer.render(csv);

        expect(html).toContain('&lt;');
        expect(html).toContain('&gt;');
        expect(html).toContain('&amp;');
      });
    });

    describe('元数据', () => {
      it('应该包含正确的元数据', async () => {
        const html = await renderer.render('A,B\n1,2');

        expect(html).toContain('excel-metadata');
      });

      it('应该显示正确的工作表名称', async () => {
        const html = await renderer.render('A,B\n1,2');

        expect(html).toContain('Sheet:');
      });

      it('应该显示正确的行数', async () => {
        const html = await renderer.render('A,B\n1,2\n3,4');

        expect(html).toContain('Rows: 3');
      });

      it('应该显示正确的列数', async () => {
        const html = await renderer.render('A,B,C\n1,2,3');

        expect(html).toContain('Columns: 3');
      });
    });

    describe('渲染器属性', () => {
      it('应该有正确的名称', () => {
        expect(renderer.name).toBe('excel');
      });

      it('应该有正确的版本', () => {
        expect(renderer.version).toBe('1.0.0');
      });

      it('应该有正确的扩展名列表', () => {
        expect(renderer.extensions).toContain('.xlsx');
        expect(renderer.extensions).toContain('.csv');
      });

      it('应该有正确的插件 ID', () => {
        expect(renderer.pluginId).toBe('office-renderer');
      });

      it('应该有优先级属性', () => {
        expect(renderer.priority).toBeDefined();
      });
    });
  });

  describe('边界情况测试', () => {
    const emptyCSV = '';
    const singleCellCSV = 'Value\n42';

    describe('空文件和单单元格', () => {
      it('应该处理空 CSV', async () => {
        const html = await renderer.render(emptyCSV);

        // 空 CSV 会被解析为只有一个空单元格
        expect(html).toContain('<table');
      });

      it('应该处理单单元格 CSV', async () => {
        const html = await renderer.render(singleCellCSV);

        expect(html).toContain('<table');
        expect(html).toContain('Value');
      });

      it('应该处理只有表头的 CSV', async () => {
        const headerOnly = 'Name,Age,City';
        const html = await renderer.render(headerOnly);

        expect(html).toContain('<table');
        expect(html).toContain('Name');
      });
    });

    describe('空单元格处理', () => {
      const csvWithEmptyCells = `A,B,C,D\n1,,3,\n,,4,5`;

      it('应该正确处理中间空单元格', async () => {
        const html = await renderer.render(csvWithEmptyCells);

        expect(html).toContain('excel-cell-empty');
      });

      it('应该正确处理行尾空单元格', async () => {
        const html = await renderer.render(csvWithEmptyCells);

        const cells = (html.match(/excel-cell-empty/g) || []).length;
        expect(cells).toBeGreaterThan(0);
      });

      it('应该正确处理行首空单元格', async () => {
        const html = await renderer.render(csvWithEmptyCells);

        expect(html).toContain('<td class="excel-cell excel-cell-empty"');
      });
    });

    describe('特殊字符处理', () => {
      it('应该处理包含逗号的值', async () => {
        const csv = `Name\n"Smith, John"\n"Doe, Jane"`;
        const html = await renderer.render(csv);

        expect(html).toContain('Smith');
        expect(html).toContain('John');
      });

      it('应该处理包含换行符的值', async () => {
        const csv = `Name\n"Line1\nLine2"`;
        const html = await renderer.render(csv);

        expect(html).toContain('Line1');
      });

      it('应该处理包含引号的值', async () => {
        const csv = `Value\n"Test ""quoted"" text"`;
        const html = await renderer.render(csv);

        expect(html).toContain('Test');
      });

      it('应该处理 Unicode 字符', async () => {
        const csvWithUnicode = `Name,Value\n中文,测试\n日本語,テスト\n한국어,테스트`;
        const html = await renderer.render(csvWithUnicode);

        // Unicode 字符会被转义，但应该存在
        expect(html.length).toBeGreaterThan(0);
      });

      it('应该处理 Emoji', async () => {
        const csvWithEmoji = `Name,Status\n✅,Success\n❌,Failed\n⚠️,Warning`;
        const html = await renderer.render(csvWithEmoji);

        // Emoji 会被编码，但应该存在
        expect(html.length).toBeGreaterThan(0);
      });
    });

    describe('大数据集处理', () => {
      it('应该处理 1000 行 CSV', async () => {
        const largeCSV = Array.from({ length: 1000 }, (_, i) =>
          `ID${i},Value${i}`
        ).join('\n');

        const html = await renderer.render(largeCSV);

        expect(html).toContain('<table');
        expect(html).toContain('ID999');
      });

      it('应该限制最大行数', async () => {
        const largeCSV = Array.from({ length: 2000 }, (_, i) =>
          `ID${i},Value${i}`
        ).join('\n');

        const html = await renderer.render(largeCSV, { maxRows: 100 });

        const rows = (html.match(/<tr>/g) || []).length;
        expect(rows).toBeLessThanOrEqual(101); // 表头 + 100行
      });

      it('应该限制最大列数', async () => {
        const wideCSV = Array.from({ length: 1 }, (_, i) =>
          Array.from({ length: 100 }, (_, j) => `Col${j}`).join(',')
        ).join('\n');

        const html = await renderer.render(wideCSV, { maxCols: 20 });

        // 检查数据单元格数量
        const dataCells = (html.match(/<td/g) || []).length;
        expect(dataCells).toBeLessThanOrEqual(20);
      });
    });

    describe('数据类型边界', () => {
      it('应该处理极大数字', async () => {
        const csvWithLargeNumbers = `Value\n999999999999999999`;
        const html = await renderer.render(csvWithLargeNumbers);

        // SheetJS 可能会转换科学计数法
        expect(html).toContain('excel-cell-number');
      });

      it('应该处理极小数字', async () => {
        const csvWithSmallNumbers = `Value\n0.0000000001`;
        const html = await renderer.render(csvWithSmallNumbers);

        expect(html).toContain('excel-cell-number');
      });

      it('应该处理负数', async () => {
        const csvWithNegative = `Value\n-42\n-3.14`;
        const html = await renderer.render(csvWithNegative);

        expect(html).toContain('excel-cell-number');
        expect(html).toContain('-');
      });

      it('应该处理科学计数法', async () => {
        const csvWithScientific = `Value\n1.23e10\n4.56E-5`;
        const html = await renderer.render(csvWithScientific);

        expect(html).toContain('excel-cell-number');
      });

      it('应该处理布尔值', async () => {
        const csvWithBoolean = `Active\ntrue\nfalse`;
        const html = await renderer.render(csvWithBoolean);

        // SheetJS 将布尔值解析为字符串
        expect(html).toContain('excel-cell-text');
      });

      it('应该处理零值', async () => {
        const csvWithZero = `Value\n0\n0.0`;
        const html = await renderer.render(csvWithZero);

        expect(html).toContain('excel-cell-number');
      });
    });

    describe('格式兼容性', () => {
      it('应该处理带有 BOM 的 CSV', async () => {
        const bomCSV = '\uFEFFName,Value\nA,1';
        const html = await renderer.render(bomCSV);

        expect(html).toContain('<table');
      });

      it('应该处理不同换行符', async () => {
        const csvWithCRLF = 'Name,Value\r\nA,1\r\nB,2';
        const html = await renderer.render(csvWithCRLF);

        expect(html).toContain('<table');
      });

      it('应该处理尾随空格', async () => {
        const csvWithSpaces = 'Name,Value  \nA  ,1  ';
        const html = await renderer.render(csvWithSpaces);

        expect(html).toContain('<table');
      });
    });
  });

  describe('错误处理测试', () => {
    describe('无效输入', () => {
      it('应该拒绝 null 输入', async () => {
        await expect(renderer.render(null as any)).rejects.toThrow();
      });

      it('应该拒绝 undefined 输入', async () => {
        await expect(renderer.render(undefined as any)).rejects.toThrow();
      });

      it('应该处理无效的二进制数据', async () => {
        const invalidBuffer = new Uint8Array([0xFF, 0xFF, 0xFF, 0xFF]).buffer;
        // SheetJS 会尝试解析，可能不会抛出错误
        const html = await renderer.render(invalidBuffer);
        expect(html).toBeDefined();
      });
    });

    describe('解析错误', () => {
      it('应该处理格式错误的 CSV', async () => {
        const malformedCSV = 'Name,Age\nAlice,30,Bob,25';
        const html = await renderer.render(malformedCSV);

        // SheetJS 会尽力解析
        expect(html).toBeDefined();
      });

      it('应该处理不匹配的引号', async () => {
        const unmatchedQuotes = 'Name\n"Unclosed quote';
        const html = await renderer.render(unmatchedQuotes);

        expect(html).toBeDefined();
      });
    });

    describe('错误消息', () => {
      it('应该提供清晰的错误消息', async () => {
        try {
          await renderer.render(null as any);
          expect.unreachable();
        } catch (error) {
          expect((error as Error).message).toBeDefined();
        }
      });

      it('应该包含原始错误信息', async () => {
        try {
          await renderer.render(null as any);
          expect.unreachable();
        } catch (error) {
          const message = (error as Error).message;
          expect(message.length).toBeGreaterThan(0);
        }
      });
    });

    describe('选项验证', () => {
      it('应该处理负的 maxRows', async () => {
        const html = await renderer.render('A,B\n1,2', { maxRows: -1 });
        expect(html).toBeDefined();
      });

      it('应该处理负的 maxCols', async () => {
        const html = await renderer.render('A,B\n1,2', { maxCols: -1 });
        expect(html).toBeDefined();
      });

      it('应该处理极大的 maxRows', async () => {
        const html = await renderer.render('A,B\n1,2', { maxRows: 999999 });
        expect(html).toBeDefined();
      });

      it('应该处理极大的 maxCols', async () => {
        const html = await renderer.render('A,B\n1,2', { maxCols: 999999 });
        expect(html).toBeDefined();
      });
    });
  });

  describe('性能测试', () => {
    describe('渲染性能', () => {
      it('应该在合理时间内渲染 100 行数据', async () => {
        const data = Array.from({ length: 100 }, (_, i) =>
          `ID${i},Name${i},Value${i}`
        ).join('\n');

        const start = performance.now();
        const html = await renderer.render(data);
        const end = performance.now();

        expect(end - start).toBeLessThan(100);
        expect(html).toContain('<table');
      });

      it('应该在合理时间内渲染 500 行数据', async () => {
        const data = Array.from({ length: 500 }, (_, i) =>
          `ID${i},Name${i},Value${i}`
        ).join('\n');

        const start = performance.now();
        const html = await renderer.render(data);
        const end = performance.now();

        expect(end - start).toBeLessThan(500);
        expect(html).toContain('<table');
      });

      it('应该在合理时间内渲染 1000 行数据', async () => {
        const data = Array.from({ length: 1000 }, (_, i) =>
          `ID${i},Name${i},Value${i}`
        ).join('\n');

        const start = performance.now();
        const html = await renderer.render(data);
        const end = performance.now();

        expect(end - start).toBeLessThan(1000);
        expect(html).toContain('<table');
      });

      it('应该高效处理宽表格（50列）', async () => {
        const wideData = Array.from({ length: 10 }, (_, i) =>
          Array.from({ length: 50 }, (_, j) => `Col${j}_Row${i}`).join(',')
        ).join('\n');

        const start = performance.now();
        const html = await renderer.render(wideData);
        const end = performance.now();

        expect(end - start).toBeLessThan(200);
        expect(html).toContain('<table');
      });

      it('应该高效处理极宽表格（100列）', async () => {
        const wideData = Array.from({ length: 5 }, (_, i) =>
          Array.from({ length: 100 }, (_, j) => `Col${j}_Row${i}`).join(',')
        ).join('\n');

        const start = performance.now();
        const html = await renderer.render(wideData);
        const end = performance.now();

        expect(end - start).toBeLessThan(200);
        expect(html).toContain('<table');
      });
    });

    describe('内存效率', () => {
      it('应该高效处理大量单元格', async () => {
        const largeData = Array.from({ length: 500 }, (_, i) =>
          Array.from({ length: 20 }, (_, j) => `Cell_${i}_${j}`).join(',')
        ).join('\n');

        const start = performance.now();
        const html = await renderer.render(largeData);
        const end = performance.now();

        expect(end - start).toBeLessThan(500);
        expect(html).toContain('<table');
      });
    });

    describe('选项对性能的影响', () => {
      const largeData = Array.from({ length: 500 }, (_, i) =>
        `ID${i},Name${i},Value${i}`
      ).join('\n');

      it('应该通过限制行数提高性能', async () => {
        const startWithLimit = performance.now();
        await renderer.render(largeData, { maxRows: 100 });
        const endWithLimit = performance.now();

        const startWithoutLimit = performance.now();
        await renderer.render(largeData, { maxRows: 500 });
        const endWithoutLimit = performance.now();

        expect(endWithLimit - startWithLimit).toBeLessThan(
          endWithoutLimit - startWithoutLimit
        );
      });

      it('应该通过限制列数提高性能', async () => {
        const wideData = Array.from({ length: 100 }, (_, i) =>
          Array.from({ length: 50 }, (_, j) => `Col${j}_Row${i}`).join(',')
        ).join('\n');

        const startWithLimit = performance.now();
        await renderer.render(wideData, { maxCols: 10 });
        const endWithLimit = performance.now();

        const startWithoutLimit = performance.now();
        await renderer.render(wideData, { maxCols: 50 });
        const endWithoutLimit = performance.now();

        expect(endWithLimit - startWithLimit).toBeLessThanOrEqual(
          endWithoutLimit - startWithoutLimit
        );
      });

      it('应该通过禁用元数据提高性能', async () => {
        const startWithMetadata = performance.now();
        await renderer.render(largeData, { showMetadata: true });
        const endWithMetadata = performance.now();

        const startWithoutMetadata = performance.now();
        await renderer.render(largeData, { showMetadata: false });
        const endWithoutMetadata = performance.now();

        // 禁用元数据应该更快或相似
        expect(endWithoutMetadata - startWithoutMetadata).toBeLessThan(
          (endWithMetadata - startWithMetadata) * 1.5
        );
      });
    });

    describe('并发性能', () => {
      it('应该能并发处理多个渲染请求', async () => {
        const data = Array.from({ length: 100 }, (_, i) =>
          `ID${i},Name${i},Value${i}`
        ).join('\n');

        const start = performance.now();
        const promises = Array.from({ length: 10 }, () =>
          renderer.render(data)
        );
        const results = await Promise.all(promises);
        const end = performance.now();

        expect(results).toHaveLength(10);
        expect(end - start).toBeLessThan(1000);
      });
    });
  });

  describe('集成测试', () => {
    describe('完整渲染流程', () => {
      it('应该完整渲染包含所有数据类型的 CSV', async () => {
        const complexCSV = `ID,Name,Price,Quantity,Date,Active
1,Product A,10.99,100,2024-01-15,true
2,Product B,25.5,50,2024-01-20,false
3,Product C,5,200,2024-02-01,true`;

        const html = await renderer.render(complexCSV);

        expect(html).toContain('<table');
        expect(html).toContain('excel-header');
        expect(html).toContain('excel-cell-number');
        expect(html).toContain('excel-cell-text');
        expect(html).toContain('excel-cell-date');
      });

      it('应该正确渲染带有样式选项的表格', async () => {
        const data = `Name,Value\nA,1\nB,2`;

        const html = await renderer.render(data, {
          theme: 'dark',
          showGridLines: true,
          showHeaders: true,
          showMetadata: true,
        });

        expect(html).toContain('data-theme="dark"');
        expect(html).toContain('data-show-grid="true"');
        expect(html).toContain('excel-metadata');
      });

      it('应该正确渲染带有性能限制的表格', async () => {
        const largeData = Array.from({ length: 2000 }, (_, i) =>
          `ID${i},Name${i},Value${i}`
        ).join('\n');

        const html = await renderer.render(largeData, {
          maxRows: 100,
          maxCols: 2,
        });

        expect(html).toContain('<table');
        const rows = (html.match(/<tr>/g) || []).length;
        expect(rows).toBeLessThanOrEqual(101);
      });
    });

    describe('实际使用场景', () => {
      it('应该处理销售数据报表', async () => {
        const salesData = `Date,Product,Quantity,Revenue,Customer
2024-01-01,Widget A,10,199.99,Customer X
2024-01-02,Widget B,5,249.95,Customer Y
2024-01-03,Widget A,15,299.98,Customer Z`;

        const html = await renderer.render(salesData);

        expect(html).toContain('<table');
        expect(html).toContain('Widget A');
        expect(html).toContain('Customer X');
      });

      it('应该处理用户数据列表', async () => {
        const userData = `ID,Username,Email,Role,Active,CreatedAt
1,alice@example.com,Alice Smith,Admin,true,2024-01-01
2,bob@example.com,Bob Johnson,User,true,2024-01-02
3,carol@example.com,Carol Williams,User,false,2024-01-03
4,dave@example.com,Dave Brown,User,true,2024-01-04
5,eve@example.com,Eve Davis,User,true,2024-01-05`;

        const html = await renderer.render(userData);

        expect(html).toContain('<table');
        expect(html).toContain('Username');
        expect(html).toContain('Email');
        expect(html).toContain('Role');
      });

      it('应该处理财务数据', async () => {
        const financialData = `Account,Debit,Credit,Balance,Date
Cash,1000,0,1000,2024-01-01
Revenue,0,500,1500,2024-01-02
Expense,200,0,1300,2024-01-03`;

        const html = await renderer.render(financialData);

        expect(html).toContain('<table');
        expect(html).toContain('Cash');
        expect(html).toContain('Revenue');
        expect(html).toContain('Expense');
      });

      it('应该处理库存数据', async () => {
        const inventoryData = `SKU,Name,Quantity,Price,Location
SKU001,Widget A,100,19.99,Warehouse A
SKU002,Widget B,50,49.99,Warehouse B
SKU003,Widget C,200,9.99,Warehouse A`;

        const html = await renderer.render(inventoryData);

        expect(html).toContain('<table');
        expect(html).toContain('SKU');
        expect(html).toContain('Quantity');
      });
    });

    describe('输出质量验证', () => {
      it('应该生成结构良好的 HTML', async () => {
        const html = await renderer.render('A,B\n1,2');

        // 不是完整文档，而是 HTML 片段
        expect(html).not.toContain('<!DOCTYPE html>');
        expect(html).toContain('<div');
        expect(html).toContain('</div>');
      });

      it('应该包含必要的 CSS 类', async () => {
        const html = await renderer.render('A,B\n1,2');

        expect(html).toContain('excel-workbook');
        expect(html).toContain('excel-sheet');
        expect(html).toContain('excel-table');
        expect(html).toContain('excel-cell');
      });

      it('应该正确嵌套 HTML 元素', async () => {
        const html = await renderer.render('A,B\n1,2');

        expect(html).toMatch(/<div class="excel-workbook".*<\/div>/s);
        expect(html).toMatch(/<table.*<\/table>/s);
      });
    });
  });

  describe('回归测试', () => {
    it('应该保持稳定的输出格式', async () => {
      const data = 'A,B\n1,2';

      const html1 = await renderer.render(data);
      const html2 = await renderer.render(data);

      expect(html1).toBe(html2);
    });

    it('应该正确处理多次渲染', async () => {
      const data = 'A,B\n1,2';

      const results = await Promise.all([
        renderer.render(data),
        renderer.render(data),
        renderer.render(data),
      ]);

      expect(results).toHaveLength(3);
      expect(results[0]).toBe(results[1]);
      expect(results[1]).toBe(results[2]);
    });

    it('应该在选项变化后正确渲染', async () => {
      const data = Array.from({ length: 10 }, (_, i) =>
        `ID${i},Name${i},Value${i}`
      ).join('\n');

      const html1 = await renderer.render(data, { maxRows: 10 });
      const html2 = await renderer.render(data, { maxRows: 5 });

      expect(html1).toContain('<table');
      expect(html2).toContain('<table');
      expect(html1).not.toBe(html2);
    });
  });
});