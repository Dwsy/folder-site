import * as XLSX from 'xlsx';

export default class ExcelRenderer {
  private supportedFormats = ['xlsx', 'xls'];

  /**
   * 渲染 Excel 文件为 HTML 格式
   * @param file - 文件对象
   * @returns Promise<HTML string>
   */
  async render(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });

    let html = '<div class="excel-renderer">';

    workbook.SheetNames.forEach(sheetName => {
      const sheet = workbook.Sheets[sheetName];
      html += `<div class="excel-sheet" data-sheet="${sheetName}">`;
      html += `<h3 class="excel-sheet-title">${sheetName}</h3>`;
      html += XLSX.utils.sheet_to_html(sheet, { editable: false });
      html += '</div>';
    });

    html += '</div>';
    return html;
  }

  /**
   * 检查文件格式是否支持
   */
  supports(format: string): boolean {
    return this.supportedFormats.includes(format.toLowerCase());
  }
}
