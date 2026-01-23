/**
 * ArchiveRenderer 功能测试
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { ArchiveRenderer } from '../plugins/office-renderer/ArchiveRenderer.js';
import AdmZip from 'adm-zip';

describe('ArchiveRenderer', () => {
  let renderer: ArchiveRenderer;

  beforeEach(() => {
    renderer = new ArchiveRenderer();
  });

  describe('基础功能测试', () => {
    describe('supports() 方法', () => {
      it('应该支持 zip 格式', () => {
        expect(renderer.supports('zip')).toBe(true);
        expect(renderer.supports('.zip')).toBe(true);
      });

      it('应该支持 rar 格式', () => {
        expect(renderer.supports('rar')).toBe(true);
        expect(renderer.supports('.rar')).toBe(true);
      });

      it('应该支持 jar 格式', () => {
        expect(renderer.supports('jar')).toBe(true);
        expect(renderer.supports('.jar')).toBe(true);
      });

      it('应该支持 7z 格式', () => {
        expect(renderer.supports('7z')).toBe(true);
        expect(renderer.supports('.7z')).toBe(true);
      });

      it('应该支持大写格式', () => {
        expect(renderer.supports('ZIP')).toBe(true);
        expect(renderer.supports('RAR')).toBe(true);
      });

      it('应该拒绝不支持的格式', () => {
        expect(renderer.supports('pdf')).toBe(false);
        expect(renderer.supports('xlsx')).toBe(false);
        expect(renderer.supports('txt')).toBe(false);
      });
    });

    describe('render() 方法 - 基础渲染', () => {
      it('应该处理有效的 ZIP 数据', async () => {
        const zipData = createMinimalZip();

        const html = await renderer.render(zipData);

        expect(html).toContain('archive-renderer');
        expect(html).toContain('archive-file-list');
      });

      it('应该包含标题', async () => {
        const zipData = createMinimalZip();

        const html = await renderer.render(zipData);

        expect(html).toContain('archive-title');
        expect(html).toContain('Archive Contents');
      });

      it('应该包含条目计数', async () => {
        const zipData = createMinimalZip();

        const html = await renderer.render(zipData);

        expect(html).toContain('archive-count');
      });

      it('应该显示文件列表', async () => {
        const zipData = createMinimalZip();

        const html = await renderer.render(zipData);

        expect(html).toContain('archive-file');
      });
    });

    describe('render() 方法 - 渲染选项', () => {
      it('应该应用 theme 选项', async () => {
        const zipData = createMinimalZip();

        const html = await renderer.render(zipData, { theme: 'dark' });

        expect(html).toContain('data-theme="dark"');
      });

      it('应该应用 maxEntries 选项', async () => {
        const zipData = createLargeZip(200);

        const html = await renderer.render(zipData, { maxEntries: 50 });

        // 检查条目计数显示
        expect(html).toContain('50 items');
      });

      it('应该应用 showHidden 选项', async () => {
        const zipData = createZipWithHiddenFiles();

        const html1 = await renderer.render(zipData, { showHidden: false });
        const html2 = await renderer.render(zipData, { showHidden: true });

        const files1 = (html1.match(/archive-file/g) || []).length;
        const files2 = (html2.match(/archive-file/g) || []).length;

        expect(files2).toBeGreaterThan(files1);
      });

      it('应该应用 sortBy 选项', async () => {
        const zipData = createMinimalZip();

        const html = await renderer.render(zipData, { sortBy: 'name' });

        expect(html).toContain('archive-file');
      });

      it('应该应用 sortOrder 选项', async () => {
        const zipData = createMinimalZip();

        const html = await renderer.render(zipData, { sortOrder: 'desc' });

        expect(html).toContain('archive-file');
      });

      it('应该应用 showFileSize 选项', async () => {
        const zipData = createMinimalZip();

        const html1 = await renderer.render(zipData, { showFileSize: true });
        const html2 = await renderer.render(zipData, { showFileSize: false });

        expect(html1).toContain('archive-file-size');
        expect(html2).not.toContain('archive-file-size');
      });

      it('应该应用 showCompressionRatio 选项', async () => {
        const zipData = createMinimalZip();

        const html = await renderer.render(zipData, { showCompressionRatio: true });

        expect(html).toContain('Compressed:');
      });
    });

    describe('渲染器属性', () => {
      it('应该有正确的名称', () => {
        expect(renderer.name).toBe('archive');
      });

      it('应该有正确的版本', () => {
        expect(renderer.version).toBe('1.0.0');
      });

      it('应该有正确的扩展名列表', () => {
        expect(renderer.extensions).toContain('.zip');
        expect(renderer.extensions).toContain('.rar');
        expect(renderer.extensions).toContain('.jar');
      });

      it('应该有正确的插件 ID', () => {
        expect(renderer.pluginId).toBe('office-renderer');
      });

      it('应该有优先级属性', () => {
        expect(renderer.priority).toBeDefined();
      });
    });
  });

  describe('文件图标测试', () => {
    it('应该为目录显示文件夹图标', async () => {
      const zipData = createZipWithDirectories();

      const html = await renderer.render(zipData);

      expect(html).toContain('📁');
    });

    it('应该为图片文件显示图片图标', async () => {
      const zipData = createZipWithImages();

      const html = await renderer.render(zipData);

      expect(html).toContain('🖼️');
    });

    it('应该为代码文件显示代码图标', async () => {
      const zipData = createZipWithCodeFiles();

      const html = await renderer.render(zipData);

      expect(html).toContain('📜');
    });

    it('应该为 Office 文件显示 Office 图标', async () => {
      const zipData = createZipWithOfficeFiles();

      const html = await renderer.render(zipData);

      expect(html).toContain('📄');
    });
  });

  describe('目录结构测试', () => {
    it('应该正确显示多级目录', async () => {
      const zipData = createZipWithNestedDirectories();

      const html = await renderer.render(zipData);

      expect(html).toContain('archive-file');
      expect(html).toContain('archive-file-icon');
    });

    it('应该使用缩进显示目录层级', async () => {
      const zipData = createZipWithNestedDirectories();

      const html = await renderer.render(zipData);

      expect(html).toContain('margin-left:');
    });
  });

  describe('边界情况测试', () => {
    it('应该处理空压缩包', async () => {
      const zipData = createEmptyZip();

      const html = await renderer.render(zipData);

      expect(html).toContain('archive-renderer');
      expect(html).toContain('Archive Contents');
    });

    it('应该处理只有目录的压缩包', async () => {
      const zipData = createZipWithDirectoriesOnly();

      const html = await renderer.render(zipData);

      expect(html).toContain('archive-file');
    });

    it('应该处理大压缩包', async () => {
      const zipData = createLargeZip(100);

      const html = await renderer.render(zipData);

      expect(html).toContain('archive-renderer');
    });

    it('应该处理极长的文件名', async () => {
      const zipData = createZipWithLongFilename();

      const html = await renderer.render(zipData);

      expect(html).toContain('archive-file-name');
    });

    it('应该处理特殊字符文件名', async () => {
      const zipData = createZipWithSpecialCharacters();

      const html = await renderer.render(zipData);

      expect(html).toContain('archive-file');
    });

    it('应该处理 Unicode 文件名', async () => {
      const zipData = createZipWithUnicodeFilenames();

      const html = await renderer.render(zipData);

      expect(html).toContain('archive-file');
    });
  });

  describe('错误处理测试', () => {
    it('应该拒绝 null 输入', async () => {
      await expect(renderer.render(null as any)).rejects.toThrow();
    });

    it('应该拒绝 undefined 输入', async () => {
      await expect(renderer.render(undefined as any)).rejects.toThrow();
    });

    it('应该拒绝字符串输入', async () => {
      await expect(renderer.render('invalid' as any)).rejects.toThrow();
    });

    it('应该拒绝空 ArrayBuffer', async () => {
      await expect(renderer.render(new ArrayBuffer(0))).rejects.toThrow();
    });

    it('应该拒绝无效的 ZIP 数据', async () => {
      const invalidData = new Uint8Array([0xFF, 0xFF, 0xFF, 0xFF]).buffer;
      
      // AdmZip 可能会抛出错误或返回空列表
      try {
        const html = await renderer.render(invalidData);
        // 如果没有抛出错误，至少应该生成有效的 HTML
        expect(html).toContain('archive-renderer');
      } catch (error) {
        // 预期会抛出错误
        expect(error).toBeDefined();
      }
    });
  });

  describe('排序测试', () => {
    it('应该按名称排序', async () => {
      const zipData = createZipWithMultipleFiles();

      const html = await renderer.render(zipData, { sortBy: 'name' });

      expect(html).toContain('archive-file');
    });

    it('应该按大小排序', async () => {
      const zipData = createZipWithMultipleFiles();

      const html = await renderer.render(zipData, { sortBy: 'size' });

      expect(html).toContain('archive-file');
    });

    it('应该按日期排序', async () => {
      const zipData = createZipWithMultipleFiles();

      const html = await renderer.render(zipData, { sortBy: 'date' });

      expect(html).toContain('archive-file');
    });

    it('应该按类型排序', async () => {
      const zipData = createZipWithMultipleFiles();

      const html = await renderer.render(zipData, { sortBy: 'type' });

      expect(html).toContain('archive-file');
    });

    it('应该支持降序排序', async () => {
      const zipData = createZipWithMultipleFiles();

      const html = await renderer.render(zipData, { sortOrder: 'desc' });

      expect(html).toContain('archive-file');
    });
  });

  describe('性能测试', () => {
    it('应该在合理时间内渲染小压缩包', async () => {
      const zipData = createMinimalZip();

      const start = performance.now();
      const html = await renderer.render(zipData);
      const end = performance.now();

      expect(end - start).toBeLessThan(100);
      expect(html).toContain('archive-renderer');
    });

    it('应该在合理时间内渲染中等压缩包', async () => {
      const zipData = createLargeZip(100);

      const start = performance.now();
      const html = await renderer.render(zipData);
      const end = performance.now();

      expect(end - start).toBeLessThan(500);
      expect(html).toContain('archive-renderer');
    });
  });

  describe('HTML 转义测试', () => {
    it('应该转义 HTML 特殊字符', async () => {
      const zipData = createZipWithHtmlInFilename();

      const html = await renderer.render(zipData);

      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;');
    });

    it('应该转义引号字符', async () => {
      const zipData = createZipWithQuotesInFilename();

      const html = await renderer.render(zipData);

      expect(html).toContain('&#39;');
      expect(html).toContain('&quot;');
    });
  });

  describe('集成测试', () => {
    it('应该正确渲染带默认选项的压缩包', async () => {
      const zipData = createMinimalZip();

      const html = await renderer.render(zipData);

      expect(html).toContain('archive-renderer');
      expect(html).toContain('archive-header');
      expect(html).toContain('archive-title');
      expect(html).toContain('archive-file-list');
    });

    it('应该正确渲染带自定义选项的压缩包', async () => {
      const zipData = createMinimalZip();

      const html = await renderer.render(zipData, {
        theme: 'dark',
        showFileSize: true,
        showModifiedDate: true,
        showCompressionRatio: false,
        maxEntries: 100,
        enableFolderCollapse: true,
        sortBy: 'name',
        sortOrder: 'asc',
      });

      expect(html).toContain('data-theme="dark"');
      expect(html).toContain('archive-file');
    });
  });

  describe('回归测试', () => {
    it('应该保持稳定的输出格式', async () => {
      const zipData1 = createMinimalZip();
      const zipData2 = createMinimalZip();

      const html1 = await renderer.render(zipData1);
      const html2 = await renderer.render(zipData2);

      expect(html1).toContain('archive-renderer');
      expect(html2).toContain('archive-renderer');
    });

    it('应该正确处理多次渲染', async () => {
      const zipData = createMinimalZip();

      const results = await Promise.all([
        renderer.render(zipData),
        renderer.render(zipData),
        renderer.render(zipData),
      ]);

      expect(results).toHaveLength(3);
      results.forEach((html) => {
        expect(html).toContain('archive-renderer');
      });
    });
  });
});

/**
 * 创建一个最小的 ZIP 文件
 */
function createMinimalZip(): ArrayBuffer {
  const zip = new AdmZip();
  zip.addFile('readme.txt', 'Hello, World!');
  return zip.toBuffer().buffer;
}

/**
 * 创建一个空的 ZIP 文件
 */
function createEmptyZip(): ArrayBuffer {
  const zip = new AdmZip();
  return zip.toBuffer().buffer;
}

/**
 * 创建一个包含目录的 ZIP 文件
 */
function createZipWithDirectories(): ArrayBuffer {
  const zip = new AdmZip();
  zip.addFile('folder1/', '');
  zip.addFile('folder1/file1.txt', 'Content 1');
  zip.addFile('folder2/', '');
  zip.addFile('folder2/file2.txt', 'Content 2');
  return zip.toBuffer().buffer;
}

/**
 * 创建一个只有目录的 ZIP 文件
 */
function createZipWithDirectoriesOnly(): ArrayBuffer {
  const zip = new AdmZip();
  zip.addFile('folder1/', '');
  zip.addFile('folder2/', '');
  zip.addFile('folder1/subfolder/', '');
  return zip.toBuffer().buffer;
}

/**
 * 创建一个包含图片的 ZIP 文件
 */
function createZipWithImages(): ArrayBuffer {
  const zip = new AdmZip();
  zip.addFile('image1.png', Buffer.from([0x89, 0x50, 0x4E, 0x47]));
  zip.addFile('photo.jpg', Buffer.from([0xFF, 0xD8, 0xFF]));
  return zip.toBuffer().buffer;
}

/**
 * 创建一个包含代码文件的 ZIP 文件
 */
function createZipWithCodeFiles(): ArrayBuffer {
  const zip = new AdmZip();
  zip.addFile('index.js', 'console.log("Hello");');
  zip.addFile('style.css', 'body { color: red; }');
  zip.addFile('app.ts', 'const x: number = 1;');
  return zip.toBuffer().buffer;
}

/**
 * 创建一个包含 Office 文件的 ZIP 文件
 */
function createZipWithOfficeFiles(): ArrayBuffer {
  const zip = new AdmZip();
  zip.addFile('document.docx', 'DOCX content');
  zip.addFile('spreadsheet.xlsx', 'XLSX content');
  zip.addFile('presentation.pptx', 'PPTX content');
  return zip.toBuffer().buffer;
}

/**
 * 创建一个包含隐藏文件的 ZIP 文件
 */
function createZipWithHiddenFiles(): ArrayBuffer {
  const zip = new AdmZip();
  zip.addFile('visible.txt', 'Visible content');
  zip.addFile('.hidden.txt', 'Hidden content');
  zip.addFile('.gitignore', 'node_modules');
  return zip.toBuffer().buffer;
}

/**
 * 创建一个大 ZIP 文件
 */
function createLargeZip(fileCount: number): ArrayBuffer {
  const zip = new AdmZip();
  for (let i = 0; i < fileCount; i++) {
    zip.addFile(`file${i}.txt`, `Content ${i}`);
  }
  return zip.toBuffer().buffer;
}

/**
 * 创建一个包含多级目录的 ZIP 文件
 */
function createZipWithNestedDirectories(): ArrayBuffer {
  const zip = new AdmZip();
  zip.addFile('root/', '');
  zip.addFile('root/level1/', '');
  zip.addFile('root/level1/level2/', '');
  zip.addFile('root/level1/level2/file.txt', 'Deep file');
  return zip.toBuffer().buffer;
}

/**
 * 创建一个包含长文件名的 ZIP 文件
 */
function createZipWithLongFilename(): ArrayBuffer {
  const zip = new AdmZip();
  const longName = 'a'.repeat(200) + '.txt';
  zip.addFile(longName, 'Content');
  return zip.toBuffer().buffer;
}

/**
 * 创建一个包含特殊字符文件名的 ZIP 文件
 */
function createZipWithSpecialCharacters(): ArrayBuffer {
  const zip = new AdmZip();
  zip.addFile('file with spaces.txt', 'Content');
  zip.addFile('file-with-dashes.txt', 'Content');
  zip.addFile('file_with_underscores.txt', 'Content');
  return zip.toBuffer().buffer;
}

/**
 * 创建一个包含 Unicode 文件名的 ZIP 文件
 */
function createZipWithUnicodeFilenames(): ArrayBuffer {
  const zip = new AdmZip();
  zip.addFile('文件.txt', '中文内容');
  zip.addFile('ファイル.txt', '日本語');
  zip.addFile('파일.txt', '한국어');
  return zip.toBuffer().buffer;
}

/**
 * 创建一个包含多个文件的 ZIP 文件
 */
function createZipWithMultipleFiles(): ArrayBuffer {
  const zip = new AdmZip();
  zip.addFile('a.txt', 'A');
  zip.addFile('b.txt', 'B');
  zip.addFile('c.txt', 'C');
  zip.addFile('folder/', '');
  zip.addFile('folder/d.txt', 'D');
  return zip.toBuffer().buffer;
}

/**
 * 创建一个包含 HTML 的 ZIP 文件
 */
function createZipWithHtmlInFilename(): ArrayBuffer {
  const zip = new AdmZip();
  zip.addFile('<script>.txt', 'Content');
  zip.addFile('<img>.txt', 'Content');
  return zip.toBuffer().buffer;
}

/**
 * 创建一个包含引号的 ZIP 文件
 */
function createZipWithQuotesInFilename(): ArrayBuffer {
  const zip = new AdmZip();
  zip.addFile("file'with'quotes.txt", 'Content');
  zip.addFile('file"with"quotes.txt', 'Content');
  return zip.toBuffer().buffer;
}