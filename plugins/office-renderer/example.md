# Office Document 渲染器示例

本文档展示 Office 文档的渲染示例。

## Excel 示例

### 1. 基本表格 \```excel
| Name    | Age | City     | Country |
|---------|-----|----------|---------|
| Alice   | 28  | Beijing  | China   |
| Bob     | 32  | Shanghai | China   |
| Charlie | 25  | Tokyo    | Japan   |
| David   | 30  | Seoul    | Korea   |
\```

### 2. 财务数据表 \```excel
| Item        | Category    | Price | Quantity | Total   | Date       |
|-------------|-------------|-------|----------|---------|------------|
| Laptop      | Electronics | 999   | 5        | 4995    | 2024-01-15 |
| Mouse       | Electronics | 25    | 20       | 500     | 2024-01-16 |
| Keyboard    | Electronics | 75    | 15       | 1125    | 2024-01-17 |
| Monitor     | Electronics | 350   | 8        | 2800    | 2024-01-18 |
| Headphones  | Electronics | 150   | 12       | 1800    | 2024-01-19 |
\```

### 3. 销售统计 \```excel
| Region    | Q1 Sales | Q2 Sales | Q3 Sales | Q4 Sales | Total    |
|-----------|----------|----------|----------|----------|----------|
| North     | 12000    | 15000    | 18000    | 22000    | 67000    |
| South     | 8000     | 10000    | 12000    | 15000    | 45000    |
| East      | 15000    | 18000    | 21000    | 25000    | 79000    |
| West      | 10000    | 12000    | 14000    | 17000    | 53000    |
| **Total** | **45000** | **55000** | **65000** | **79000** | **244000** |
\```

## Word 示例

### 4. 简单文档 \```word
# Project Proposal

## Introduction
This document outlines the proposed project for developing a new software system.

## Objectives
- Develop a user-friendly interface
- Ensure data security
- Provide excellent performance
- Support multiple platforms

## Timeline
The project is expected to be completed within 6 months.
\```

### 5. 技术文档 \```word
# API Documentation

## Authentication
All API requests require authentication using an API key.

## Endpoints

### GET /api/users
Retrieve a list of users.

#### Parameters
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

#### Response
```json
{
  "users": [...],
  "total": 100,
  "page": 1
}
```

### POST /api/users
Create a new user.

#### Request Body
```json
{
  "name": "John Doe",
  "email": "john@example.com"
}
```
\```

## PDF 示例

### 6. 报告文档 \```pdf
# Annual Report 2024

## Executive Summary
This report presents the annual financial performance and key achievements of our company.

## Financial Highlights
- Total Revenue: $10.5M
- Net Profit: $2.3M
- Year-over-Year Growth: 15%
- Market Share: 22%

## Key Achievements
1. Launched three new products
2. Expanded to two new markets
3. Achieved ISO 27001 certification
4. Reduced operational costs by 10%

## Future Outlook
We expect continued growth in the coming year with plans for international expansion.
\```

### 7. 用户手册 \```pdf
# User Guide

## Getting Started

### Installation
1. Download the installation package
2. Run the installer
3. Follow the setup wizard
4. Complete the installation

### First Launch
After installation, launch the application and sign in with your credentials.

## Features

### Dashboard
The dashboard provides an overview of your data and recent activities.

### Reports
Generate detailed reports with custom filters and export options.

### Settings
Configure application settings to suit your preferences.
\```

## Archive 示例

### 8. 压缩包目录结构 \```archive
project-root/
├── src/
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── Sidebar.tsx
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── About.tsx
│   │   └── Contact.tsx
│   ├── App.tsx
│   └── index.tsx
├── public/
│   ├── favicon.ico
│   └── logo.svg
├── package.json
├── tsconfig.json
└── README.md
\```

### 9. 库文件结构 \```archive
library/
├── lib/
│   ├── math.js
│   ├── string.js
│   └── array.js
├── dist/
│   ├── library.min.js
│   └── library.css
├── docs/
│   ├── API.md
│   ├── GUIDE.md
│   └── CHANGELOG.md
├── tests/
│   ├── math.test.js
│   ├── string.test.js
│   └── array.test.js
├── package.json
└── README.md
\```

### 10. 配置文件归档 \```archive
config/
├── nginx/
│   ├── nginx.conf
│   └── sites-enabled/
│       ├── app.conf
│       └── api.conf
├── apache/
│   ├── httpd.conf
│   └── sites-available/
│       ├── app.conf
│       └── api.conf
├── ssl/
│   ├── server.crt
│   └── server.key
└── docker/
    ├── Dockerfile
    ├── docker-compose.yml
    └── .env
\```

## 支持的文件格式

### Excel
- `.xlsx` - Excel Workbook
- `.xlsm` - Excel Macro-Enabled Workbook
- `.xls` - Excel 97-2003 Workbook
- `.csv` - Comma Separated Values
- `.ods` - OpenDocument Spreadsheet

### Word
- `.docx` - Word Document
- `.dotx` - Word Template

### PDF
- `.pdf` - Portable Document Format

### Archive
- `.zip` - ZIP Archive
- `.rar` - RAR Archive
- `.jar` - Java Archive
- `.7z` - 7-Zip Archive

## 渲染选项

### Excel 选项
- `maxRows`: 最大行数（默认：1000）
- `maxCols`: 最大列数（默认：50）
- `showGridLines`: 显示网格线（默认：true）
- `showHeaders`: 显示表头（默认：true）
- `theme`: 主题（light/dark）

### PDF 选项
- `scale`: 缩放比例（默认：1.5，范围：0.5-3.0）
- `showPageNumbers`: 显示页码（默认：true）
- `theme`: 主题（light/dark）
- `enableTextExtraction`: 启用文本提取（默认：false）
- `maxPages`: 最大页面数（默认：100）

### Archive 选项
- `showHidden`: 显示隐藏文件（默认：false）
- `showFileSize`: 显示文件大小（默认：true）
- `showModifiedDate`: 显示修改日期（默认：true）
- `showCompressionRatio`: 显示压缩率（默认：false）
- `theme`: 主题（light/dark）
- `maxEntries`: 最大条目数（默认：1000）
- `sortBy`: 排序方式（name/size/date/type）
- `sortOrder`: 排序顺序（asc/desc）

## 使用说明

### 在 Markdown 中使用

使用代码块标记指定文档类型：

\```excel
Excel 表格内容
\```

\```word
Word 文档内容
\```

\```pdf
PDF 文档内容
\```

\```archive
压缩包目录结构
\```

### Excel 表格格式

使用 Markdown 表格语法：

```markdown
| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
```

### Word/PDF 文档格式

使用 Markdown 语法：

```markdown
# Heading 1
## Heading 2

- List item 1
- List item 2

**Bold** and *italic* text
```

### Archive 目录格式

使用树状结构语法：

```
root/
├── dir1/
│   ├── file1.txt
│   └── file2.txt
└── dir2/
    └── file3.txt
```

## 限制说明

- Excel: 最大文件大小 10MB
- Word: 最大文件大小 10MB
- PDF: 最大文件大小 50MB
- Archive: 最大文件大小 100MB

所有格式均只读，不支持编辑功能。