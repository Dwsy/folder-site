/**
 * WorkHub 解析器单元测试
 */

import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { WorkHubParser } from "../src/server/lib/workhub-parser";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type {
  ADREntry,
  IssueEntry,
  PREntry,
  WorkHubResult,
} from "../src/types/workhub";

describe("WorkHubParser", () => {
  let testDir: string;
  let parser: WorkHubParser;

  beforeAll(async () => {
    // 创建临时测试目录
    testDir = join(tmpdir(), `workhub-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });

    // 创建 docs 目录结构
    await mkdir(join(testDir, "docs", "adr"), { recursive: true });
    await mkdir(join(testDir, "docs", "issues", "frontend"), { recursive: true });
    await mkdir(join(testDir, "docs", "issues", "backend"), { recursive: true });
    await mkdir(join(testDir, "docs", "pr", "frontend"), { recursive: true });

    // 创建 ADR 文件
    await writeFile(
      join(testDir, "docs", "adr", "20250122-选择使用 TypeScript.md"),
      `---
id: "20250122-选择使用 TypeScript"
title: "选择使用 TypeScript"
status: "accepted"
date: "2025-01-22"
authors: ["Alice", "Bob"]
tags: ["language", "typing"]
---

# ADR: 选择使用 TypeScript

## Context and Problem Statement

项目需要选择一种编程语言，需要考虑类型安全、开发效率和生态系统。

## Considered Alternatives

1. **JavaScript**: 动态类型，灵活但容易出错
2. **TypeScript**: 静态类型，类型安全
3. **Flow**: Facebook 的类型检查方案

## Decision Outcome

选择使用 TypeScript 作为主要开发语言。

### Positive Consequences

- 类型安全
- 更好的 IDE 支持
- 代码可维护性提高

### Negative Consequences

- 学习曲线
- 编译时间增加
`
    );

    await writeFile(
      join(testDir, "docs", "adr", "20250123-使用 Bun 运行时.md"),
      `---
id: "20250123-使用 Bun 运行时"
title: "使用 Bun 运行时"
status: "proposed"
date: "2025-01-23"
authors: ["Charlie"]
---

# ADR: 使用 Bun 运行时

## Context and Problem Statement

需要选择一个 JavaScript 运行时。

## Decision Outcome

提议使用 Bun 运行时。
`
    );

    // 创建 Issue 文件
    await writeFile(
      join(testDir, "docs", "issues", "frontend", "20250122-添加深色模式.md"),
      `---
id: "20250122-添加深色模式"
title: "添加深色模式"
status: "todo"
created: "2025-01-22"
updated: "2025-01-22"
category: "frontend"
priority: "p1"
assignee: "Alice"
tags: ["workhub", "theme", "dark-mode"]
---

# Issue: 添加深色模式

## Goal

为应用添加深色主题支持，提升用户体验。

## 背景/问题

当前应用仅支持浅色主题，用户在夜间使用时体验不佳。

## 验收标准 (Acceptance Criteria)

- [ ] WHEN 用户点击主题切换按钮，系统 SHALL 切换到深色模式
- [ ] WHERE 应用处于深色模式，系统 SHALL 保存用户偏好
- [ ] IF 用户刷新页面，THEN 系统 SHALL 恢复之前保存的主题

## 实施阶段

### Phase 1: 规划和准备
- [ ] 分析需求和依赖
- [ ] 设计技术方案
- [ ] 确定实施计划

### Phase 2: 执行
- [ ] 实现主题切换组件
- [ ] 实现主题持久化
- [ ] 更新样式文件

### Phase 3: 验证
- [ ] 单元测试
- [ ] 集成测试
- [ ] 代码审查

### Phase 4: 交付
- [ ] 更新文档
- [ ] 创建 PR
- [ ] 合并主分支

## 关键决策

| 决策 | 理由 |
|------|------|
| 使用 CSS 变量 | 便于主题切换 |
| 保存到 localStorage | 无需后端支持 |

## 遇到的错误

| 日期 | 错误 | 解决方案 |
|------|------|---------|
| 2025-01-22 | 主题切换闪烁 | 添加过渡动画 |

## 相关资源

- [x] 相关文档: \`docs/architecture/theme.md\`
- [ ] 相关 Issue: \`docs/issues/ISSUE-xxx.md\`
- [ ] 参考资料: [链接]

## Notes

需要考虑系统主题自动切换功能。

---

## Status 更新日志

- **2025-01-22 10:00**: 状态变更 → todo，备注: 创建 Issue
`
    );

    await writeFile(
      join(testDir, "docs", "issues", "backend", "20250123-优化 API 响应时间.md"),
      `---
id: "20250123-优化 API 响应时间"
title: "优化 API 响应时间"
status: "in_progress"
created: "2025-01-23"
updated: "2025-01-23"
category: "backend"
priority: "p0"
assignee: "Bob"
tags: ["workhub", "performance", "api"]
---

# Issue: 优化 API 响应时间

## Goal

将 API 平均响应时间从 200ms 降低到 100ms 以下。

## 背景/问题

当前 API 响应时间较慢，影响用户体验。

## 验收标准 (Acceptance Criteria)

- [ ] WHEN 请求 API，响应时间 SHALL 小于 100ms
- [ ] WHERE 数据量较大，系统 SHALL 使用分页
- [ ] IF 缓存命中，THEN 响应时间 SHALL 小于 10ms

## 实施阶段

### Phase 1: 分析
- [ ] 性能分析
- [ ] 瓶颈定位

### Phase 2: 优化
- [ ] 添加缓存
- [ ] 优化数据库查询
- [ ] 使用 CDN

## Status 更新日志

- **2025-01-23 14:00**: 状态变更 → in_progress，备注: 开始优化
`
    );

    // 创建 PR 文件
    await writeFile(
      join(testDir, "docs", "pr", "frontend", "20250124-实现主题切换功能.md"),
      `---
id: "20250124-实现主题切换功能"
title: "实现主题切换功能"
status: "merged"
created: "2025-01-24"
updated: "2025-01-24"
category: "frontend"
tags: ["workhub", "pr", "theme", "dark-mode"]
mergedAt: "2025-01-24"
mergedBy: "Alice"
commitHash: "abc123"
deployStatus: "deployed"
---

# PR: 实现主题切换功能

> 为应用添加主题切换功能，支持浅色和深色模式

## 背景与目的 (Why)

用户需要在不同光照环境下使用应用，深色模式可以减少眼部疲劳。

## 变更内容概述 (What)

- 添加主题切换按钮
- 实现主题持久化
- 更新所有组件的深色样式

## 关联 Issue

- **Issues:** \`docs/issues/20250122-添加深色模式.md\`

## 测试与验证结果 (Test Result)

- [x] 单元测试通过
- [x] 集成测试验证
- [x] 手动回归测试通过

## 风险与影响评估 (Risk Assessment)

低风险，仅影响 UI 显示。

## 回滚方案 (Rollback Plan)

如需回滚，删除主题相关代码即可。

---

## 变更类型

- [x] ✨ New Feature
- [ ] 🐛 Bug Fix
- [ ] 📝 Documentation
- [ ] 🚀 Refactoring
- [ ] ⚡ Performance
- [ ] 🔒 Security
- [ ] 🧪 Testing

## 文件变更列表

| 文件 | 变更类型 | 描述 |
|------|---------|------|
| \`src/components/ThemeToggle.tsx\` | 新增 | 主题切换组件 |
| \`src/styles/theme.css\` | 修改 | 添加深色样式 |
| \`src/utils/theme.ts\` | 新增 | 主题工具函数 |

## 详细变更说明

### 1. 添加主题切换组件

**问题：** 用户无法切换主题

**方案：** 创建 ThemeToggle 组件

**影响范围：** 全局

### 2. 实现主题持久化

使用 localStorage 保存用户偏好。

## 破坏性变更

- [x] 否
- [ ] 是 - [描述破坏性变更及迁移指南]

## 性能影响

- [x] 无影响
- [ ] 提升 - [描述性能提升]
- [ ] 下降 - [描述性能下降及原因]

## 依赖变更

- [x] 否
- [ ] 是 - [列出新增依赖及理由]

## 安全考虑

- [x] 否
- [ ] 是 - [描述安全影响及缓解措施]

## 文档变更

- [x] 否
- [ ] 是 - [列出需要更新的文档]

## 代码审查检查清单

### 功能性
- [x] 代码实现了需求
- [x] 边界情况已处理
- [x] 错误处理完善

### 代码质量
- [x] 代码遵循项目规范
- [x] 变量命名清晰
- [x] 没有冗余代码

### 测试
- [x] 有对应的单元测试
- [x] 测试覆盖关键路径
- [x] 测试通过

## 审查日志

- **2025-01-24 10:00 Alice**: 代码看起来不错
  - [x] 建议 1: 考虑添加过渡动画

- **2025-01-24 11:00 Bob**: 已添加过渡动画
  - 已解决建议 1

## 最终状态

- **合并时间:** 2025-01-24 15:00
- **合并人:** Alice
- **Commit Hash:** abc123
- **部署状态:** 已部署
`
    );

    // 创建没有 frontmatter 的 ADR 文件（测试错误处理）
    await writeFile(
      join(testDir, "docs", "adr", "invalid-adr.md"),
      `# Invalid ADR

This ADR has no frontmatter.
`
    );

    // 初始化解析器
    parser = new WorkHubParser(join(testDir, "docs"));
  });

  afterAll(async () => {
    // 清理临时目录
    await rm(testDir, { recursive: true, force: true });
  });

  describe("parse", () => {
    it("应该成功解析所有 WorkHub 文档", async () => {
      const result = await parser.parse();

      expect(result.adrs.length).toBe(2);
      expect(result.issues.length).toBe(2);
      expect(result.prs.length).toBe(1);
      expect(result.stats.totalADRs).toBe(2);
      expect(result.stats.totalIssues).toBe(2);
      expect(result.stats.totalPRs).toBe(1);
      expect(result.stats.totalDocuments).toBe(5);
    });

    it("应该正确解析 ADR 元数据", async () => {
      const result = await parser.parse();
      const adr = result.adrs[0];

      expect(adr).toBeDefined();
      expect(adr?.id).toBe("20250122-选择使用 TypeScript");
      expect(adr?.title).toBe("选择使用 TypeScript");
      expect(adr?.status).toBe("accepted");
      expect(adr?.path).toBe("adr/20250122-选择使用 TypeScript.md");
      expect(adr?.content).toContain("Context and Problem Statement");
    });

    it("应该正确解析 Issue 元数据", async () => {
      const result = await parser.parse();
      const issue = result.issues[0];

      expect(issue).toBeDefined();
      expect(issue?.id).toBe("20250122-添加深色模式");
      expect(issue?.title).toBe("添加深色模式");
      expect(issue?.status).toBe("todo");
      expect(issue?.priority).toBe("p1");
      expect(issue?.path).toBe("issues/frontend/20250122-添加深色模式.md");
      expect(issue?.content).toContain("## Goal");
    });

    it("应该正确解析 PR 元数据", async () => {
      const result = await parser.parse();
      const pr = result.prs[0];

      expect(pr).toBeDefined();
      expect(pr?.id).toBe("20250124-实现主题切换功能");
      expect(pr?.title).toBe("实现主题切换功能");
      expect(pr?.status).toBe("merged");
      expect(pr?.path).toBe("pr/frontend/20250124-实现主题切换功能.md");
      expect(pr?.content).toContain("## 背景与目的");
      expect(pr?.linkedIssues).toContain("20250122-添加深色模式.md");
    });

    it("应该正确计算统计信息", async () => {
      const result = await parser.parse();

      expect(result.stats.totalADRs).toBe(2);
      expect(result.stats.totalIssues).toBe(2);
      expect(result.stats.totalPRs).toBe(1);
      expect(result.stats.totalDocuments).toBe(5);
      expect(result.stats.parseTime).toBeGreaterThan(0);
    });
  });

  describe("parseADRs", () => {
    it("应该成功解析所有 ADR 文件", async () => {
      const adrs = await parser.parseADRs();

      expect(adrs.length).toBe(2);
    });

    it("应该忽略没有 frontmatter 的 ADR 文件", async () => {
      const adrs = await parser.parseADRs();
      const invalidADR = adrs.find((a) => a.id === "invalid-adr");

      expect(invalidADR).toBeUndefined();
    });
  });

  describe("parseIssues", () => {
    it("应该成功解析所有 Issue 文件", async () => {
      const issues = await parser.parseIssues();

      expect(issues.length).toBe(2);
    });

    it("应该正确解析 Issue 的优先级", async () => {
      const issues = await parser.parseIssues();
      const issue = issues.find((i) => i.id === "20250123-优化 API 响应时间");

      expect(issue?.priority).toBe("p0");
    });

    it("应该正确解析 Issue 的负责人", async () => {
      const issues = await parser.parseIssues();
      const issue = issues.find((i) => i.id === "20250123-优化 API 响应时间");

      expect(issue?.assignee).toBe("Bob");
    });
  });

  describe("parsePRs", () => {
    it("应该成功解析所有 PR 文件", async () => {
      const prs = await parser.parsePRs();

      expect(prs.length).toBe(1);
    });

    it("应该正确提取关联的 Issues", async () => {
      const prs = await parser.parsePRs();
      const pr = prs[0];

      expect(pr?.linkedIssues).toEqual(["20250122-添加深色模式.md"]);
    });
  });

  describe("错误处理", () => {
    it("应该处理不存在的目录", async () => {
      const invalidParser = new WorkHubParser("/nonexistent/directory");

      await expect(invalidParser.parse()).rejects.toThrow();
    });

    it("应该处理损坏的文件", async () => {
      // 创建损坏的文件
      await writeFile(
        join(testDir, "docs", "issues", "corrupted.md"),
        `---
status: "invalid"
---
`,
      );

      const result = await parser.parse();
      // 解析器应该继续处理其他文件，即使有损坏的文件
      expect(result.stats.totalDocuments).toBeGreaterThan(0);
    });
  });
});