# Workflows - Execution Spec

> AI 执行规范：主工作流的执行流程

**需求文档**：[flow-workflows.md](../../docs/requirements/flows/flow-workflows.md)

---

## 1. Session Start

**每次对话开始**：

```
读取 state.json
    ↓
检查 project.refactoring.enabled
    ├─ true → 加载 refactoring.md（重构模式）
    └─ false → 继续正常工作流
            ↓
        检查 prd.phase（PRD 层状态）
            ├─ prd_draft → 提示继续编写 PRD
            ├─ prd_scope_review → 提示审核 PRD scope
            ├─ prd_decomposing → 汇报分解进度，继续调研 Work Items
            └─ prd_done → 正常模式
            ↓
        汇报状态
            ├─ PRD 阶段和进度（如在分解中）
            ├─ 当前聚焦 Work Item
            ├─ 当前 phase
            ├─ 进行中的 subtasks
            └─ 待处理文档（pendingDocs）
            ↓
        等待用户指示
```

**重构模式检测**：
- 如果 `project.refactoring.enabled = true`，切换到 `refactoring.md` 执行规范
- 重构完成后（`enabled = false`），自动回到本工作流

---

## 2. Input Analysis

**每次接收用户输入**：

```
用户输入
    ↓
意图识别
    ├─ 产品咨询 → §3 Consulting
    ├─ Bug 修复 → 加载 bugfix.md
    ├─ 需求处理 → 加载 requirements.md
    ├─ 设计处理 → 加载 design.md
    ├─ 实现处理 → 加载 implementation.md
    ├─ 测试处理 → 加载 testing.md
    ├─ 审核批准 → §4 Review Approval
    └─ 无关想法 → 直接拒绝
```

### 2.1 Must Follow Process Criteria

以下情况**必须**走需求变更流程，即使用户明确授权：

| 变更类型 | 示例 | 流程 |
|----------|------|------|
| 数据结构变更 | 修改 state.json/index.json schema | 需求 → 审核 → 实现 |
| API/命令接口变更 | 添加/删除/修改命令行参数 | 需求 → 审核 → 实现 |
| 删除现有功能 | 删除 byType、删除命令别名 | 需求 → 审核 → 实现 |
| 添加新功能 | 新增 Hook、新增验证规则 | 需求 → 审核 → 实现 |

**走 Bug 修复流程**：
| 变更类型 | 示例 |
|----------|------|
| Bug 修复 | 修复空指针、修复边界条件 → 加载 bugfix.md |
| 代码重构 | 重命名变量、提取函数（不改变行为）→ 加载 bugfix.md |

**无需流程**：
| 变更类型 | 示例 |
|----------|------|
| 文档更新 | 修复错别字、补充说明 |

### 2.2 Phase-Based Routing

| 当前 Phase | 默认路由 |
|------------|----------|
| `feature_requirements` | requirements.md |
| `feature_review` | §4 Review Approval |
| `feature_design` | design.md |
| `feature_implementation` | implementation.md |
| `feature_testing` | testing.md |

---

## 3. Consulting Flow

**咨询交付流程**：

```
用户咨询
    ↓
加载 PRD + 相关文档
    ↓
生成回答
    ↓
检查是否包含需求成分
    ├─ 是 → 询问是否处理需求
    └─ 否 → 等待下一输入
```

**混合输入处理**：
1. 先回答咨询
2. 再询问："刚才提到 xxx，是否现在处理这个需求？"
3. 用户选择 → 进入需求流程或继续等待

---

## 4. Review Approval Flow

**审核审批流程**：

```
AI 完成文档
    ↓
set-phase <id> feature_review
    ↓
提示用户审核
    ↓
等待反馈
    ├─ 批准 → set-phase <id> 下一阶段
    ├─ 修改 → AI 修改后重新审核
    └─ 拒绝 → 返回上一阶段
```

**PRD 审核特殊处理**：

```
PRD 文档审核通过（prd.phase = prd_draft）
    ↓
set-prd-phase prd_scope_review
    ↓
用户确认 scope 无误
    ↓
set-prd-phase prd_decomposing
    ↓
进入需求分解阶段
```

**批准语法**：

| 类型 | 关键词 |
|------|--------|
| 批准 | "批准"、"通过"、"同意"、"approve" |
| 修改 | "修改 xxx"、"补充 xxx" |
| 拒绝 | "重新来"、"需求不对" |

### 4.1 Review Assistance（可选）

人类可主动调用辅助工具进行深度审核：

| 辅助工具 | 用途 | 触发方式 |
|----------|------|----------|
| **review-assistant** | AI 辅助审核需求文档 | 人类主动调用 |

---

## 5. Two-Layer Lifecycle

> 工作流管理两个独立但相互关联的生命周期

```
┌─────────────────────────────────────────────────────────────────┐
│                        PRD Layer                                 │
│                                                                  │
│  prd_draft → prd_scope_review → prd_decomposing → prd_done      │
│                                       │               ↑          │
│                                       ↓               │          │
│  ┌────────────────────────────────────────────────────┐         │
│  │           Work Item Layer (每个独立运行)            │         │
│  │                                                     │         │
│  │  Feature 1: pending → requirements → review → ...  │─────────┘
│  │  Feature 2: pending → requirements → review → ...  │
│  │  ※ 所有 Work Items 需求阶段完成 → PRD 可关闭       │
│  └────────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────────────────┘
```

| 层级 | 职责 | 状态存储 |
|------|------|----------|
| **PRD Layer** | 产品 scope 管理、需求分解协调 | `state.json → prd.phase` |
| **Work Item Layer** | 单个功能的完整生命周期 | 文档 frontmatter `phase` |

---

## 6. PRD Lifecycle

### 6.1 PRD Phase Sequence

```
prd_draft → prd_scope_review → prd_decomposing → prd_done
```

| Phase | 说明 | AI 行为 |
|-------|------|---------|
| `prd_draft` | PRD 初稿编写中 | 调用 /write-prd 编写 |
| `prd_scope_review` | High-level scope 审核 | 提示用户审核，等待批准 |
| `prd_decomposing` | 需求分解阶段 | 加载 requirements.md §5 |
| `prd_done` | PRD 关闭 | 正常模式，Work Items 独立推进 |

### 6.2 PRD Decomposing Routing

> 分解阶段的执行细节定义在需求子流程中

**路由规则**：
- 当 `prd.phase = prd_decomposing` 时
- 加载 [requirements.md](requirements.md) §5 PRD Decomposing Flow
- 按该子流程执行需求分解

### 6.3 PRD Close Criteria

**关闭条件**：
- [ ] 所有 Work Items 的 phase ≥ `feature_design`
- [ ] 人类显式确认 PRD 完整性

**关闭命令**：
```bash
node scripts/state.js set-prd-phase prd_done
```

---

## 7. Work Item Phase Lifecycle

```
pending → feature_requirements → feature_review → feature_design → feature_implementation → feature_testing → done
```

| 阶段 | 主要职责 |
|------|----------|
| `feature_requirements` | 编写需求文档 |
| `feature_review` | 人类审核文档 |
| `feature_design` | 编写设计文档 |
| `feature_implementation` | 编写代码 + 单元测试 + 集成测试 |
| `feature_testing` | 系统级测试（E2E/性能/安全/回归） |

---

## 8. Phase Guards

| Phase | 阻止的操作 |
|-------|------------|
| `feature_requirements` | Write/Edit `src/**/*`, `tests/**/*` |
| `feature_review` | Write/Edit `docs/designs/**/*`, `src/**/*` |
| `feature_design` | Write/Edit `src/**/*`, `tests/**/*` |
| `done` | Write/Edit `src/**/*`, `scripts/**/*` (ask 确认) |

---

## 9. Subflow References

> 子流程独立文档，按需加载

| 子流程 | 文档 | 触发条件 |
|--------|------|----------|
| **需求流程** | [requirements.md](requirements.md) | `feature_requirements` 阶段 |
| **设计流程** | [design.md](design.md) | `feature_design` 阶段 |
| **实现流程** | [implementation.md](implementation.md) | `feature_implementation` 阶段 |
| **测试流程** | [testing.md](testing.md) | `feature_testing` 阶段 |
| **Bug 修复流程** | [bugfix.md](bugfix.md) | 报告/发现 Bug |
| **重构流程** | [refactoring.md](refactoring.md) | `project.refactoring.enabled = true` |

**加载策略**：
- 主流程（本文档）：每次 Session 加载
- 子流程：进入对应阶段或触发条件时按需加载

---

## 10. Execution Principles

### 始终做

- 每次输入 → 先分析输入类型，路由到对应流程
- 进入子流程 → 加载对应执行规范
- 状态更新 → 通过 State CLI
- 文档变更 → 运行 index.js
- Bug 修复 → 加载 bugfix.md 进行根因分析

### 绝不做

- 跳过输入分析
- 跳过 review 阶段
- 未经人类批准更新 phase
- 直接编辑 state.json
- 未走流程直接修改代码
- 跳过根因分析直接修复 done 状态的代码

---

## 11. Tools Reference

| 工具 | 用途 |
|------|------|
| `node scripts/state.js summary` | 获取状态摘要 |
| `node scripts/state.js set-phase <id> <phase>` | 更新阶段 |
| `node scripts/state.js activate <id>` | 激活 Work Item |
| `node scripts/state.js deactivate <id>` | 取消激活 Work Item |
| `node scripts/state.js set-prd-phase <phase>` | 设置 PRD 阶段 |
| `node scripts/state.js get-prd-progress` | 获取 PRD 分解进度 |
| `node scripts/index.js` | 更新索引 |

---

*Version: v2.2*
*Aligned with: flow-workflows.md v9.2, fea-state-management.md v16.0*
*Updated: 2025-12-30*