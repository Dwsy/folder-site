# 🚀 Agent 立即执行指令

## 第一步：阅读核心文档（必须）

```bash
# 文档1：快速摘要（3分钟）
cat task/office-integration/VSCODE_OFFICE_INTEGRATION_SUMMARY.md

# 文档2：架构设计（重点阅读代码示例部分）
cat task/office-integration/vscode-office-integration-architecture.md

# 文档3：任务索引（了解整体结构）
cat task/office-integration/任务索引.md
```

## 第二步：查看当前任务

```bash
cat task/office-integration/当前任务.md
```

## 第三步：开始任务001

### 任务001 执行内容

1. **阅读方案文档**（已完成第一步）

2. **创建插件目录**
   ```bash
   mkdir -p plugins/office-renderer
   ```

3. **安装必需依赖**
   ```bash
   bun add xlsx
   bun add -D @types/xlsx
   ```

4. **创建基础文件结构**
   ```bash
   cd plugins/office-renderer
   touch manifest.json
   touch index.ts
   touch ExcelRenderer.ts
   ```

5. **验证环境**
   ```bash
   ls -la
   bun test  # 如果有测试
   ```

6. **完成任务001**
   - 编辑 `task/office-integration/任务001.md`
   - 更新状态为 `Done`
   - 添加完成记录（开始/完成时间、耗时）
   - 移动到 `completed/` 目录
   - 更新 `任务索引.md` 的统计

## 第四步：锁定任务002

任务001完成后:

1. 检查任务索引，确认任务002的依赖（任务001）已完成
2. 编辑 `任务002.md`:
   ```markdown
   状态: In Progress
   占用者: Agent A
   锁定时间: <当前时间>
   ```
3. 更新 `任务索引.md` 表格

## 参考代码（任务002 manifest.json）

```json
{
  "id": "office-renderer",
  "name": "Office Document Renderer",
  "version": "1.0.0",
  "description": "Render Excel, Word, PDF, and other office documents",
  "author": {
    "name": "Folder-Site Team"
  },
  "license": "MIT",
  "entry": "index.ts",
  "capabilities": [
    {
      "type": "renderer",
      "name": "excel",
      "version": "1.0.0",
      "constraints": {
        "supportedFormats": ["xlsx", "xlsm", "xls", "csv", "ods"],
        "supportsEditing": false
      }
    },
    {
      "type": "renderer", 
      "name": "word",
      "version": "1.0.0",
      "constraints": {
        "supportedFormats": ["docx", "dotx"],
        "supportsEditing": false
      }
    },
    {
      "type": "renderer",
      "name": "pdf", 
      "version": "1.0.0",
      "constraints": {
        "supportedFormats": ["pdf"],
        "supportsEditing": false,
        "supportsPagination": true
      }
    }
  ]
}
```

---

## 📚 完整文档目录

- `README.md` - 完整使用指南
- `TASK_GENERATION_REPORT.md` - 任务生成报告
- `OFFICE_INTEGRATION_README.md` - 文档索引和导航

## ❓ 遇到问题

1. 查看 README.md 的"工作流程示例"
2. 查看 任务索引.md 的"依赖关系图"
3. 在任务文件的【阻塞原因】中记录

---

**开始执行时间**: 现在即可
**预计任务001耗时**: 2小时
