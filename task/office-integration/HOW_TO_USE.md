# 🚀 如何使用 Office 集成任务系统

## 快速开始（3步）

```bash
# 1️⃣ 查看快速摘要（3分钟）
cat task/office-integration/VSCODE_OFFICE_INTEGRATION_SUMMARY.md

# 2️⃣ 查看任务执行指令
cat task/office-integration/AGENT_START.md

# 3️⃣ 开始任务001
cat task/office-integration/当前任务.md
```

---

## 📖 完整使用流程

### 步骤 1: 阅读必要的文档

在执行任务前，Agent **必须**阅读：

```bash
# 必读（按顺序）
cat task/office-integration/VSCODE_OFFICE_INTEGRATION_SUMMARY.md    # 快速摘要
cat task/office-integration/vscode-office-integration-architecture.md  # 架构设计
```

**可选阅读**（按需）：
- `vscode-office-quickstart.md` - 详细代码示例
- `vscode-office-integration-analysis.md` - 深度技术分析

---

### 步骤 2: 查看任务状态

```bash
# 查看任务索引（所有任务概览）
cat task/office-integration/任务索引.md

# 查看当前待执行任务
cat task/office-integration/当前任务.md

# 查看特定任务
cat task/office-integration/任务001.md
```

**任务索引说明**：
- `Todo` - 待开始（依赖未完成）
- `In Progress` - 正在执行
- `Done` - 已完成
- `Locked` - 已被其他 Agent 锁定
- `Blocked` - 阻塞中

---

### 步骤 3: 锁定并开始任务

#### 锁定一个新任务

```bash
# 找到一个状态为 Todo 且依赖已完成的任务
# 例如：任务001（无依赖，可直接开始）

# 编辑任务文件
vim task/office-integration/任务001.md
# 或使用 cat 查看后手动编辑
cat task/office-integration/任务001.md
```

**更新任务文件**：

```markdown
# 任务001: 环境准备和依赖安装...

**状态**: In Progress    # 从 Locked 改为 In Progress
**占用者**: Agent A      # 添加你的标识
**锁定时间**: 2026-01-23 10:30:00  # 当前时间
```

**同时更新任务索引**：

```bash
vim task/office-integration/任务索引.md
```

找到任务001的行，更新：

```markdown
| 任务001 | 环境准备和依赖安装 | In Progress | High | 2h | - | Agent A | 2026-01-23 10:30:00 |
```

---

### 步骤 4: 执行任务

根据任务文件中的【实施步骤】执行：

```bash
# 任务001 示例
# 1. 阅读方案文档
cat task/office-integration/vscode-office-integration-architecture.md

# 2. 创建插件目录
mkdir -p plugins/office-renderer

# 3. 安装依赖
bun add xlsx
bun add -D @types/xlsx

# 4. 创建基础文件
cd plugins/office-renderer
touch manifest.json index.ts ExcelRenderer.ts

# 5. 验证
ls -la
```

---

### 步骤 5: 完成任务

完成所有【实施步骤】和【验收标准】后：

```bash
# 编辑任务文件
vim task/office-integration/任务001.md
```

```markdown
# 任务001: ...

**状态**: Done    # 更新为 Done

## 完成记录
- 开始时间: 2026-01-23 10:30:00
- 完成时间: 2026-01-23 11:45:00
- 耗时: 1小时15分钟
```

**移动任务到 completed 目录**：

```bash
mv task/office-integration/任务001.md task/office-integration/completed/
```

**更新任务索引**：

```bash
vim task/office-integration/任务索引.md
```

1. 更新统计数据：
```markdown
**总任务数**: 24
**已完成**: 1        # 从 0 改为 1
**进行中**: 0        # 保持
**待开始**: 22       # 从 23 改为 22
```

2. 更新任务行的状态：
```markdown
| 任务001 | 环境准备和依赖安装 | Done | High | 2h | - | - | - |
```

3. 更新进度：
```markdown
- 总体进度: 4%    # 1/24 ≈ 4.17%
```

---

### 步骤 6: 开始下一个任务

```bash
# 查看任务索引，找到下一个可执行的任务
cat task/office-integration/任务索引.md | grep "Todo"

# 检查依赖关系
# 例如：任务002依赖任务001（已完成）
#       任务011也依赖任务001（已完成）
```

**选择并锁定任务002**：

```bash
# 查看任务002详情
cat task/office-integration/任务002.md

# 锁定（重复步骤3和4）
```

---

## 🔄 完整工作流示例

```
┌─────────────────────────────────────────────┐
│ 1. 阅读文档                                │
│    ↓                                       │
│ 2. 查看任务索引                            │
│    ↓                                       │
│ 3. 锁定任务（状态: Todo → Locked → In Progress）│
│    ↓                                       │
│ 4. 执行任务                               │
│    ↓                                       │
│ 5. 完成任务（状态: In Progress → Done）   │
│    ↓                                       │
│ 6. 移动到 completed/                      │
│    ↓                                       │
│ 7. 更新任务索引                           │
│    ↓                                       │
│ 8. 返回步骤3，锁定下一个任务              │
└─────────────────────────────────────────────┘
```

---

## ⚡ 并行执行指南

### 识别可并行任务

查看【任务索引.md】的"可并行任务分组"章节：

```bash
cat task/office-integration/任务索引.md | grep "可并行任务分组" -A 20
```

**示例 - 批次3**：

```
批次 3（等待 批次2 完成）
- 任务003: 实现 ExcelRenderer (依赖: 任务002)
  - 任务005: 实现 WordRenderer (依赖: 任务002)
  - 任务006: 实现 PDFRenderer (依赖: 任务002)
  - 任务007: 实现 ArchiveRenderer (依赖: 任务002)
  ✅ 可并行执行
```

### 多 Agent 协作

**Agent A**:
```bash
# 锁定任务003
vim task/office-integration/任务003.md
# 状态: In Progress, 占用者: Agent A

# 执行 ExcelRenderer 实现
```

**Agent B** (同时):
```bash
# 锁定任务005
vim task/office-integration/任务005.md
# 状态: In Progress, 占用者: Agent B

# 执行 WordRenderer 实现
```

**注意**: 查看任务索引，确保任务状态为 `Todo` 且未被其他 Agent 锁定。

---

## ⚠️ 重要规则

### 1. 锁定规则

- 领用任务时必须立即锁定
- 更新任务文件和任务索引
- 标注占用者和锁定时间

### 2. 依赖检查

开始任务前，确认：
- 所有依赖任务状态 = `Done`
- 任务本身状态 = `Todo`
- 任务未被其他 Agent 锁定

### 3. 及时更新

- 任务状态变化时立即更新
- 方便其他 Agent 判断可执行任务
- 避免冲突

### 4. 阻塞处理

如果任务阻塞：

```bash
# 编辑任务文件
vim task/office-integration/任务00X.md
```

```markdown
## 阻塞原因
- 等待任务003完成（状态：In Progress）
- 等待 API 密钥审批

**状态**: Blocked   # 从 In Progress 改为 Blocked
**占用者**: -       # 清空
```

同时释放锁定并寻找其他可执行任务。

---

## 📊 进度跟踪

定期查看任务索引：

```bash
# 查看当前进度
cat task/office-integration/任务索引.md | head -20
```

关键指标：
- **已完成**: 已完成的任务数
- **进行中**: 当前执行的任务数
- **待开始**: 可开始的任务数
- **进度百分比**: 总体完成度

---

## 🆘 常见问题

### Q: 如何找到下一个可执行的任务？

```bash
# 方法1：查看任务索引的 Todo 任务
cat task/office-integration/任务索引.md | grep "Todo"

# 方法2：查看依赖图，找到依赖已完成的任务
cat task/office-integration/任务索引.md | grep "依赖关系图" -A 50

# 方法3：查看可并行任务分组
cat task/office-integration/任务索引.md | grep "批次" -A 30
```

### Q: 任务被其他 Agent 锁定了怎么办？

寻找下一个没有被锁定的任务：
```bash
cat task/office-integration/任务索引.md | grep "Todo"
```

### Q: 如何知道任务需要阅读哪些文档？

每个任务文件都有【实施步骤】，根据步骤阅读相关章节：
- **架构设计**: `vscode-office-integration-architecture.md`
- **快速入门**: `vscode-office-quickstart.md`
- **代码示例**: 两者都可以

### Q: 阻塞后如何继续？

1. 记录【阻塞原因】
2. 更新状态为 `Blocked`
3. 释放锁定
4. 认领其他可执行任务
5. 阻塞解除后重新锁定原任务

---

## 📚 快速参考

```bash
# 文件位置
task/office-integration/

# 核心文件
任务索引.md          # 所有任务总览
当前任务.md          # 当前的待执行任务
README.md            # 完整使用指南
AGENT_START.md       # 立即执行指令

# 参考文档
VSCODE_OFFICE_INTEGRATION_SUMMARY.md      # 快速摘要
vscode-office-integration-architecture.md # 架构设计
vscode-office-quickstart.md              # 代码教程

# 任务文件
任务001.md - 任务024.md    # 所有24个任务
completed/                 # 已完成的任务
```

---

## 🎯 立即开始

现在就可以执行任务001了！

```bash
cat task/office-integration/任务001.md
```

---

**文档版本**: 1.0  
**最后更新**: 2026-01-23  
**相关文档**: 
- README.md (使用指南)
- AGENT_START.md (快速启动)
- 任务索引.md (任务总览)
