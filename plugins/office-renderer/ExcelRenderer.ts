/**
 * Excel 渲染器
 * 使用 SheetJS (xlsx) 解析 Excel 文件并渲染为 HTML 表格
 *
 * 功能特性：
 * - 支持 .xlsx, .xlsm, .xls, .csv, .ods 格式
 * - 多工作表支持（带标签页切换）
 * - 单元格样式处理（边框、背景色、字体）
 * - 单元格类型检测（数字、布尔值、日期、文本）
 * - 支持行数和列数限制
 * - HTML 转义防止 XSS 攻击
 * - 主题适配（亮色/暗色）
 * - 集成安全验证模块（文件类型、魔数检查、XSS 防护）
 */

import * as XLSX from 'xlsx';
import { SecurityValidator } from '../../src/security/index.js';

/**
 * Excel 渲染器配置选项
 */
export interface ExcelRendererOptions {
  /** 最大行数（默认 1000） */
  maxRows?: number;

  /** 最大列数（默认 50） */
  maxCols?: number;

  /** 是否显示网格线（默认 true） */
  showGridLines?: boolean;

  /** 是否显示表头（默认 true） */
  showHeaders?: boolean;

  /** 主题（默认 'light'） */
  theme?: 'light' | 'dark';

  /** 是否显示元数据（默认 true） */
  showMetadata?: boolean;

  /** 是否启用工作表切换（默认 true） */
  enableTabs?: boolean;
}

/**
 * 单元格信息
 */
interface CellInfo {
  value: unknown;
  type: 'text' | 'number' | 'boolean' | 'date' | 'empty';
  style?: {
    background?: string;
    color?: string;
    bold?: boolean;
    italic?: boolean;
    textAlign?: string;
  };
}

/**
 * 工作表元数据
 */
interface SheetMetadata {
  name: string;
  rowCount: number;
  colCount: number;
}

/**
 * 渲染结果元数据
 */
export interface RenderMetadata {
  sheetCount: number;
  sheets: SheetMetadata[];
  totalCells: number;
  renderTime: number;
}

export class ExcelRenderer {
  /** 渲染器名称 */
  name = 'excel';

  /** 渲染器版本 */
  version = '1.0.0';

  /** 支持的文件扩展名 */
  extensions = ['.xlsx', '.xlsm', '.xls', '.csv', '.ods'];

  /** 插件 ID */
  pluginId = 'office-renderer';

  /** 优先级 */
  priority: number = 50;

  /** 安全验证器 */
  private securityValidator: SecurityValidator;

  /**
   * 构造函数
   */
  constructor() {
    // 初始化安全验证器
    this.securityValidator = new SecurityValidator({
      validateExtension: true,
      validateMagicNumber: true,
      validateFileSize: 10 * 1024 * 1024, // 10MB
      sanitizeHtml: true,
      strictMode: true,
      allowedTypes: ['excel'],
    });
  }

  /**
   * 渲染 Excel 文件内容
   *
   * @param content - 文件内容（字符串或 ArrayBuffer）
   * @param options - 渲染选项
   * @returns HTML 字符串
   */
  async render(
    content: string | ArrayBuffer,
    options?: ExcelRendererOptions & { filePath?: string; fileSize?: number }
  ): Promise<string> {
    const startTime = Date.now();

    // 合并默认选项
    const opts: Required<ExcelRendererOptions> = {
      maxRows: 1000,
      maxCols: 50,
      showGridLines: true,
      showHeaders: true,
      theme: 'light',
      showMetadata: true,
      enableTabs: true,
      ...options,
    };

    try {
      // 安全验证：检查文件类型和魔数
      if (options?.filePath) {
        const buffer = typeof content === 'string'
          ? new TextEncoder().encode(content).buffer
          : content;
        
        const validationResult = await this.securityValidator.validateFile(
          options.filePath,
          buffer,
          options.fileSize
        );
        
        if (!validationResult.valid) {
          const errorMsg = validationResult.errors.join(', ');
          throw new Error(`Security validation failed: ${errorMsg}`);
        }
      }

      // 读取工作簿
      const workbook = this.parseWorkbook(content);

      // 渲染工作簿
      const { html, metadata } = this.renderWorkbook(workbook, opts);

      // XSS 防护：清理 HTML
      const sanitizeResult = this.securityValidator.sanitizeHtml(html);
      
      // 添加渲染时间
      metadata.renderTime = Date.now() - startTime;

      // 返回清理后的 HTML
      return sanitizeResult.clean;
    } catch (error) {
      throw new Error(
        `Failed to render Excel file: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * 检查文件格式是否支持
   *
   * @param format - 文件格式（扩展名，支持带点和不带点）
   * @returns 是否支持
   */
  supports(format: string): boolean {
    const normalizedFormat = format.toLowerCase();
    // 支持带点和不带点的格式
    const formatWithDot = normalizedFormat.startsWith('.') ? normalizedFormat : `.${normalizedFormat}`;
    return this.extensions.some((ext) => ext === formatWithDot);
  }

  /**
   * 解析工作簿
   *
   * @param content - 文件内容
   * @returns 工作簿对象
   */
  private parseWorkbook(content: string | ArrayBuffer): XLSX.WorkBook {
    let buffer: ArrayBuffer;

    // 转换内容为 ArrayBuffer
    if (typeof content === 'string') {
      buffer = new TextEncoder().encode(content).buffer;
    } else {
      buffer = content;
    }

    // 使用 SheetJS 读取工作簿
    return XLSX.read(buffer, {
      type: 'array',
      cellStyles: true,
      cellDates: true,
    });
  }

  /**
   * 渲染工作簿为 HTML
   *
   * @param workbook - 工作簿对象
   * @param options - 渲染选项
   * @returns HTML 字符串和元数据
   */
  private renderWorkbook(
    workbook: XLSX.WorkBook,
    options: Required<ExcelRendererOptions>
  ): { html: string; metadata: RenderMetadata } {
    const sheetNames = workbook.SheetNames;
    const metadata: RenderMetadata = {
      sheetCount: sheetNames.length,
      sheets: [],
      totalCells: 0,
      renderTime: 0,
    };

    let html = `<div class="excel-workbook" data-theme="${options.theme}">`;

    // 添加工作表标签
    if (options.enableTabs && sheetNames.length > 1) {
      html += '<div class="excel-tabs">';
      sheetNames.forEach((name, index) => {
        const isActive = index === 0 ? 'active' : '';
        html += `<button class="excel-tab ${isActive}" data-sheet="${index}">
          ${this.escapeHtml(name)}
        </button>`;
      });
      html += '</div>';
    }

    // 渲染所有工作表
    sheetNames.forEach((name, index) => {
      const worksheet = workbook.Sheets[name];
      const { html: sheetHtml, sheetMetadata } = this.renderWorksheet(
        worksheet,
        name,
        options
      );

      html += `<div class="excel-sheet ${index === 0 ? 'active' : ''}" data-sheet="${index}">`;
      html += sheetHtml;
      html += '</div>';

      metadata.sheets.push(sheetMetadata);
      metadata.totalCells += sheetMetadata.rowCount * sheetMetadata.colCount;
    });

    html += '</div>';

    return { html, metadata };
  }

  /**
   * 渲染单个工作表为 HTML 表格
   *
   * @param worksheet - 工作表对象
   * @param sheetName - 工作表名称
   * @param options - 渲染选项
   * @returns HTML 字符串和元数据
   */
  private renderWorksheet(
    worksheet: XLSX.WorkSheet,
    sheetName: string,
    options: Required<ExcelRendererOptions>
  ): { html: string; sheetMetadata: SheetMetadata } {
    // 将工作表转换为 JSON 数组
    const data = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: '', // 空单元格默认值
    }) as unknown[][];

    // 检查是否为空工作表
    if (!data || data.length === 0) {
      return {
        html: '<div class="excel-empty">Empty sheet</div>',
        sheetMetadata: {
          name: sheetName,
          rowCount: 0,
          colCount: 0,
        },
      };
    }

    // 限制行数和列数
    const rows = data.slice(0, options.maxRows);
    const colCount = Math.min(
      Math.max(...rows.map((row) => row.length)),
      options.maxCols
    );

    // 获取单元格样式信息
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
    const cellStyles = this.extractCellStyles(worksheet, range, colCount);

    let html = `<table class="excel-table" data-show-grid="${options.showGridLines}">`;

    // 渲染表头
    if (options.showHeaders) {
      html += '<thead><tr>';
      const headerRow = rows[0];
      for (let i = 0; i < colCount; i++) {
        const cell = headerRow[i] ?? '';
        const cellInfo = this.getCellInfo(cell);
        const style = cellStyles[`${0}-${i}`] || {};
        html += `<th class="excel-header excel-cell-${cellInfo.type}"${this.getCellStyle(style)}>
          ${this.escapeHtml(String(cell))}
        </th>`;
      }
      html += '</tr></thead>';
    }

    // 渲染数据行
    html += '<tbody>';
    const startRowIndex = options.showHeaders ? 1 : 0;

    for (let r = startRowIndex; r < rows.length; r++) {
      const row = rows[r];
      html += '<tr>';

      for (let c = 0; c < colCount; c++) {
        const cell = row[c] ?? '';
        const cellInfo = this.getCellInfo(cell);
        const style = cellStyles[`${r}-${c}`] || {};
        html += `<td class="excel-cell excel-cell-${cellInfo.type}"${this.getCellStyle(style)}>
          ${this.escapeHtml(String(cell))}
        </td>`;
      }

      html += '</tr>';
    }

    html += '</tbody></table>';

    // 添加元数据
    if (options.showMetadata) {
      html += `
        <div class="excel-metadata">
          <span class="metadata-item">Sheet: ${this.escapeHtml(sheetName)}</span>
          <span class="metadata-item">Rows: ${rows.length}</span>
          <span class="metadata-item">Columns: ${colCount}</span>
        </div>
      `;
    }

    return {
      html,
      sheetMetadata: {
        name: sheetName,
        rowCount: rows.length,
        colCount,
      },
    };
  }

  /**
   * 提取单元格样式
   *
   * @param worksheet - 工作表对象
   * @param range - 单元格范围
   * @param maxCols - 最大列数
   * @returns 样式映射
   */
  private extractCellStyles(
    worksheet: XLSX.WorkSheet,
    range: XLSX.Range,
    maxCols: number
  ): Record<string, CellInfo['style']> {
    const styles: Record<string, CellInfo['style']> = {};

    for (let r = range.s.r; r <= range.e.r; r++) {
      for (let c = range.s.c; c <= Math.min(range.e.c, maxCols - 1); c++) {
        const cellAddress = XLSX.utils.encode_cell({ r, c });
        const cell = worksheet[cellAddress];

        if (cell && cell.s) {
          const style: CellInfo['style'] = {};

          // 背景色
          if (cell.s.fgColor) {
            const bgColor = this.getRgbColor(cell.s.fgColor);
            if (bgColor) {
              style.background = bgColor;
            }
          }

          // 字体颜色
          if (cell.s.font && cell.s.font.color) {
            const textColor = this.getRgbColor(cell.s.font.color);
            if (textColor) {
              style.color = textColor;
            }
          }

          // 字体粗细
          if (cell.s.font && cell.s.font.bold) {
            style.bold = true;
          }

          // 字体斜体
          if (cell.s.font && cell.s.font.italic) {
            style.italic = true;
          }

          // 文本对齐
          if (cell.s.alignment && cell.s.alignment.horizontal) {
            style.textAlign = cell.s.alignment.horizontal;
          }

          styles[`${r}-${c}`] = style;
        }
      }
    }

    return styles;
  }

  /**
   * 获取单元格信息
   *
   * @param cell - 单元格值
   * @returns 单元格信息
   */
  private getCellInfo(cell: unknown): CellInfo {
    if (cell === null || cell === undefined || cell === '') {
      return { value: '', type: 'empty' };
    }

    if (typeof cell === 'number') {
      return { value: cell, type: 'number' };
    }

    if (typeof cell === 'boolean') {
      return { value: cell, type: 'boolean' };
    }

    // 检查是否为日期
    if (cell instanceof Date) {
      return { value: cell, type: 'date' };
    }

    // 尝试解析日期字符串
    if (typeof cell === 'string' && !isNaN(Date.parse(cell))) {
      return { value: cell, type: 'date' };
    }

    return { value: cell, type: 'text' };
  }

  /**
   * 获取单元格样式 HTML 属性
   *
   * @param style - 样式对象
   * @returns HTML 样式属性字符串
   */
  private getCellStyle(style: CellInfo['style']): string {
    if (!style) {
      return '';
    }

    const styles: string[] = [];

    if (style.background) {
      styles.push(`background-color: ${style.background}`);
    }

    if (style.color) {
      styles.push(`color: ${style.color}`);
    }

    if (style.bold) {
      styles.push('font-weight: bold');
    }

    if (style.italic) {
      styles.push('font-style: italic');
    }

    if (style.textAlign) {
      styles.push(`text-align: ${style.textAlign}`);
    }

    return styles.length > 0 ? ` style="${styles.join('; ')}"` : '';
  }

  /**
   * 将 Excel 颜色对象转换为 RGB 字符串
   *
   * @param color - Excel 颜色对象
   * @returns RGB 颜色字符串
   */
  private getRgbColor(color: { rgb?: string; theme?: number }): string | null {
    if (color.rgb) {
      // Excel 颜色格式：AABBGGRR 或 BBGGRR
      let rgb = color.rgb;
      if (rgb.length === 8) {
        // AABBGGRR -> RRGGBB
        rgb = rgb.slice(2, 4) + rgb.slice(0, 2);
      }
      return `#${rgb}`;
    }

    if (color.theme !== undefined) {
      // 主题颜色（简化处理）
      const themeColors = [
        '#FFFFFF', '#000000', '#EEECE1', '#1F497D',
        '#4F81BD', '#C0504D', '#9BBB59', '#8064A2',
        '#4BACC6', '#F79646', '#0000FF', '#800080',
      ];
      return themeColors[color.theme % themeColors.length] || null;
    }

    return null;
  }

  /**
   * 转义 HTML 特殊字符
   *
   * @param text - 待转义的文本
   * @returns 转义后的文本
   */
  private escapeHtml(text: string): string {
    const htmlEntities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };

    return text.replace(/[&<>"']/g, (char) => htmlEntities[char]);
  }
}

export default ExcelRenderer;