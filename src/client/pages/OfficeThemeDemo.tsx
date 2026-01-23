/**
 * Office 主题演示页面
 *
 * 展示 Office 文档主题适配功能的使用
 */

import { useState, useEffect } from 'react';
import {
  OfficeThemeToggle,
  OfficeThemeToggleCompact,
  OfficeThemePicker,
} from '../components/office/index.js';
import {
  useOfficeTheme,
  useOfficeThemeColors,
  useOfficeThemeExtractor,
} from '../hooks/useOfficeTheme.js';

/**
 * Excel 表格演示组件
 */
function ExcelTableDemo() {
  const { themeColors } = useOfficeThemeColors();

  return (
    <div className="excel-workbook">
      <div className="excel-tabs">
        <button className="excel-tab active">Sheet1</button>
        <button className="excel-tab">Sheet2</button>
        <button className="excel-tab">Sheet3</button>
      </div>

      <div className="excel-sheet active">
        <table className="excel-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Age</th>
              <th>City</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Alice</td>
              <td className="excel-cell-number">28</td>
              <td>New York</td>
              <td className="excel-cell-number">95</td>
            </tr>
            <tr>
              <td>Bob</td>
              <td className="excel-cell-number">32</td>
              <td>London</td>
              <td className="excel-cell-number">87</td>
            </tr>
            <tr>
              <td>Charlie</td>
              <td className="excel-cell-number">25</td>
              <td>Tokyo</td>
              <td className="excel-cell-number">92</td>
            </tr>
          </tbody>
        </table>

        <div className="excel-metadata">
          <span>Rows: 3</span>
          <span>Columns: 4</span>
        </div>
      </div>
    </div>
  );
}

/**
 * PDF 查看器演示组件
 */
function PDFViewerDemo() {
  return (
    <div className="pdf-viewer">
      <div className="pdf-toolbar">
        <div className="pdf-toolbar-group">
          <button className="pdf-toolbar-btn">
            <svg className="pdf-toolbar-btn-icon" viewBox="0 0 24 24">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
            </svg>
            Previous
          </button>
          <input type="number" className="pdf-page-input" value="1" readOnly />
          <span className="pdf-page-count">/ 5</span>
          <button className="pdf-toolbar-btn">
            Next
            <svg className="pdf-toolbar-btn-icon" viewBox="0 0 24 24">
              <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
            </svg>
          </button>
        </div>

        <div className="pdf-toolbar-group">
          <select className="pdf-zoom-select">
            <option>100%</option>
            <option>125%</option>
            <option>150%</option>
            <option>200%</option>
          </select>
        </div>
      </div>

      <div className="pdf-content">
        <div className="pdf-page">
          <div style={{ width: '400px', height: '566px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
            <p style={{ color: '#666' }}>PDF Page 1</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Archive 列表演示组件
 */
function ArchiveListDemo() {
  const [items] = useState([
    { name: 'Documents', type: 'folder', size: '-', modified: '2024-01-15' },
    { name: 'Images', type: 'folder', size: '-', modified: '2024-01-14' },
    { name: 'report.pdf', type: 'file', size: '2.4 MB', modified: '2024-01-13' },
    { name: 'data.xlsx', type: 'file', size: '1.2 MB', modified: '2024-01-12' },
    { name: 'notes.txt', type: 'file', size: '12 KB', modified: '2024-01-11' },
  ]);

  return (
    <div className="archive-viewer">
      <div className="archive-toolbar">
        <span className="archive-toolbar-title">Archive Contents</span>
        <span className="archive-toolbar-info">5 items</span>
      </div>

      <div className="archive-list">
        {items.map((item, index) => (
          <div
            key={index}
            className="archive-item"
            data-type={item.type}
          >
            <div className="archive-item-expand">
              {item.type === 'folder' && (
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
                </svg>
              )}
            </div>
            <div className="archive-item-icon">
              {item.type === 'folder' ? (
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                </svg>
              )}
            </div>
            <span className="archive-item-name">{item.name}</span>
            <span className="archive-item-size">{item.size}</span>
            <span className="archive-item-modified">{item.modified}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 主题控制面板
 */
function ThemeControlPanel() {
  const {
    themeMode,
    themeColors,
    setThemeMode,
    setThemeColors,
    updateVariable,
    resetTheme,
  } = useOfficeTheme();

  const [customColor, setCustomColor] = useState(themeColors.primaryColor);

  useEffect(() => {
    setCustomColor(themeColors.primaryColor);
  }, [themeColors.primaryColor]);

  const handleColorChange = (colorKey: keyof typeof themeColors, value: string) => {
    setThemeColors({ [colorKey]: value });
  };

  return (
    <div className="theme-control-panel">
      <h3>Theme Controls</h3>

      <div className="control-group">
        <label>Theme Mode</label>
        <div className="button-group">
          <button
            className={themeMode === 'light' ? 'active' : ''}
            onClick={() => setThemeMode('light')}
          >
            Light
          </button>
          <button
            className={themeMode === 'dark' ? 'active' : ''}
            onClick={() => setThemeMode('dark')}
          >
            Dark
          </button>
        </div>
      </div>

      <div className="control-group">
        <label>Primary Color</label>
        <div className="color-input">
          <input
            type="color"
            value={customColor}
            onChange={(e) => setCustomColor(e.target.value)}
          />
          <input
            type="text"
            value={customColor}
            onChange={(e) => setCustomColor(e.target.value)}
            placeholder="#0066cc"
          />
          <button onClick={() => handleColorChange('primaryColor', customColor)}>
            Apply
          </button>
        </div>
      </div>

      <div className="control-group">
        <label>Background Color</label>
        <div className="color-input">
          <input
            type="color"
            value={themeColors.backgroundColor}
            onChange={(e) => handleColorChange('backgroundColor', e.target.value)}
          />
          <input
            type="text"
            value={themeColors.backgroundColor}
            onChange={(e) => handleColorChange('backgroundColor', e.target.value)}
          />
        </div>
      </div>

      <div className="control-group">
        <label>Border Color</label>
        <div className="color-input">
          <input
            type="color"
            value={themeColors.borderColor}
            onChange={(e) => handleColorChange('borderColor', e.target.value)}
          />
          <input
            type="text"
            value={themeColors.borderColor}
            onChange={(e) => handleColorChange('borderColor', e.target.value)}
          />
        </div>
      </div>

      <div className="control-group">
        <button className="reset-button" onClick={resetTheme}>
          Reset Theme
        </button>
      </div>
    </div>
  );
}

/**
 * 主页面
 */
export default function OfficeThemeDemo() {
  const { themeMode, themeColors } = useOfficeTheme();

  return (
    <div className="office-theme-demo">
      <div className="demo-header">
        <h1>Office 主题适配演示</h1>
        <p>展示 Office 文档样式主题适配功能</p>

        <div className="demo-toolbar">
          <OfficeThemeToggle showLabel={true} />
          <OfficeThemeToggleCompact />
          <OfficeThemePicker />
        </div>
      </div>

      <div className="demo-content">
        <div className="demo-sidebar">
          <ThemeControlPanel />
        </div>

        <div className="demo-main">
          <div className="demo-section">
            <h2>Excel 表格</h2>
            <ExcelTableDemo />
          </div>

          <div className="demo-section">
            <h2>PDF 查看器</h2>
            <PDFViewerDemo />
          </div>

          <div className="demo-section">
            <h2>Archive 列表</h2>
            <ArchiveListDemo />
          </div>
        </div>
      </div>

      <style>{`
        .office-theme-demo {
          min-height: 100vh;
          padding: 24px;
          font-family: var(--office-font-family);
        }

        .demo-header {
          margin-bottom: 32px;
        }

        .demo-header h1 {
          font-size: 32px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .demo-header p {
          color: var(--office-secondary-color);
          margin-bottom: 16px;
        }

        .demo-toolbar {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .demo-content {
          display: grid;
          grid-template-columns: 300px 1fr;
          gap: 24px;
        }

        @media (max-width: 1024px) {
          .demo-content {
            grid-template-columns: 1fr;
          }
        }

        .theme-control-panel {
          background: var(--office-cell-bg);
          border: 1px solid var(--office-border);
          border-radius: var(--office-border-radius);
          padding: 20px;
          position: sticky;
          top: 24px;
        }

        .theme-control-panel h3 {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 16px;
        }

        .control-group {
          margin-bottom: 20px;
        }

        .control-group label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 8px;
        }

        .button-group {
          display: flex;
          gap: 8px;
        }

        .button-group button {
          flex: 1;
          padding: 8px 16px;
          border: 1px solid var(--office-border);
          background: var(--office-cell-bg);
          border-radius: var(--office-border-radius);
          cursor: pointer;
          transition: all 0.2s;
        }

        .button-group button:hover {
          background: var(--office-hover-bg);
        }

        .button-group button.active {
          background: var(--office-selected-bg);
          color: var(--office-selected-text);
          border-color: var(--office-selected-bg);
        }

        .color-input {
          display: flex;
          gap: 8px;
        }

        .color-input input[type="color"] {
          width: 40px;
          height: 36px;
          border: 1px solid var(--office-border);
          border-radius: 4px;
          cursor: pointer;
        }

        .color-input input[type="text"] {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid var(--office-border);
          border-radius: 4px;
          background: var(--office-cell-bg);
          color: var(--office-text);
        }

        .color-input button {
          padding: 8px 16px;
          background: var(--office-selected-bg);
          color: var(--office-selected-text);
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .reset-button {
          width: 100%;
          padding: 10px;
          background: var(--office-error-color);
          color: white;
          border: none;
          border-radius: var(--office-border-radius);
          cursor: pointer;
          font-weight: 500;
        }

        .reset-button:hover {
          opacity: 0.9;
        }

        .demo-section {
          margin-bottom: 32px;
        }

        .demo-section h2 {
          font-size: 24px;
          font-weight: 600;
          margin-bottom: 16px;
        }
      `}</style>
    </div>
  );
}