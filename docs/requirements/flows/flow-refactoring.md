---
type: flow
id: refactoring
workMode: document
status: not_started
priority: P1
domain: process
version: "1.0"
---

# Flow: Refactoring <!-- id: flow_refactoring -->

> 文档架构重构工作流，将现有项目迁移至 SoloDevFlow 规范体系

---

## 1. Intent <!-- id: flow_refactoring_intent -->

### 1.1 Problem

现有项目接入 SoloDevFlow 时，往往已有代码和零散文档。这些项目需要：
- 从代码中逆向理解系统架构
- 重建符合规范的文档体系（PRD → Feature → Capability → Flow）
- 渐进式完成重构，不影响日常开发

### 1.2 Value

- **架构重建**：不是翻译文档，而是重建文档架构
- **渐进式迁移**：按阶段完成，可中断可恢复
- **代码驱动**：从真实代码理解系统，确保文档与代码一致

---

## 2. Overview <!-- id: flow_refactoring_overview -->

### 2.1 Purpose

为已有代码和文档的项目提供渐进式重构流程：
- 从代码逆向理解系统架构
- 自顶向下重建文档体系
- 完成后无缝切换到正常工作流

### 2.2 与正常工作流的关系

```
┌─────────────────────────────────────────────────────────────┐
│                     项目生命周期                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  init.js 检测   ┌──────────────────┐   ┌──────────────────┐ │
│  现有项目  ───→ │ flow-refactoring │ → │ flow-workflows   │ │
│                │ (本流程)          │   │ (正常工作流)      │ │
│                └──────────────────┘   └──────────────────┘ │
│                        ↑                                    │
│                   重构完成后切换                             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Flow Phases <!-- id: flow_refactoring_phases -->

```
┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│ Understanding│ → │ PRD Refactor│ → │ Requirements│ → │ Design      │ → │ Validation  │
│ 理解         │   │ PRD 重构    │   │ 需求分解    │   │ 设计补全    │   │ 验证完成    │
└─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘
      ↓                 ↓                 ↓                 ↓                 ↓
  扫描代码          编写 PRD        派生 Feature       补充 Design      验证一致性
  阅读文档          定义 Domain     Capability/Flow    （可选）         退出重构模式
  用户访谈
```

### 2.1 Phase: Understanding（理解）

**目标**：理解现有系统的架构和功能

**AI 行为**：
- 扫描代码目录结构，识别模块划分
- 阅读 README、现有文档，提取关键信息
- 向用户确认系统边界、核心功能

**产出**：系统理解（非正式，作为 PRD 输入）

**退出条件**：用户确认理解准确，进入 PRD 重构

### 2.2 Phase: PRD Refactor（PRD 重构）

**目标**：编写符合规范的 PRD

**AI 行为**：
- 使用 `/write-prd` 命令
- 从理解中提炼核心问题、目标用户、产品边界
- 定义 Domains 和初步 Feature 清单

**产出**：`docs/requirements/prd.md`

**退出条件**：PRD 通过验证，用户审核通过

### 2.3 Phase: Requirements（需求分解）

**目标**：从 PRD 派生需求文档

**AI 行为**：
- 使用 `/write-feature`、`/write-capability`、`/write-flow` 命令
- 逐个编写 Feature Spec
- 识别横切能力，编写 Capability Spec
- 定义关键流程，编写 Flow Spec

**产出**：需求文档体系

**退出条件**：PRD 中列出的所有 Feature/Capability/Flow 都已编写

### 2.4 Phase: Design（设计补全，可选）

**目标**：为复杂 Feature 补充设计文档

**AI 行为**：
- 识别 `design_depth: required` 的 Feature
- 使用 `/write-design` 命令编写设计文档

**产出**：设计文档

**退出条件**：所有需要设计的 Feature 都已补充设计文档，或用户选择跳过

### 2.5 Phase: Validation（验证完成）

**目标**：验证文档一致性，退出重构模式

**AI 行为**：
- 运行 `npm run validate:docs`
- 检查文档间引用一致性
- 检查代码与文档对应关系

**产出**：验证报告

**退出条件**：验证通过 + 用户确认 → 退出重构模式，切换到正常工作流

---

## 3. State Management <!-- id: flow_refactoring_state -->

> **注意**：本章节的状态结构为 **High Level 设计**。
> 正式实现时需同步更新 [fea-state-management.md](../features/fea-state-management.md)，
> 将 `project.refactoring` 字段添加到 state.json Schema 定义中。

### 3.1 状态结构

```json
{
  "project": {
    "refactoring": {
      "enabled": true,
      "phase": "understanding | prd | requirements | design | validation | completed",
      "progress": {
        "prd": "not_started | in_progress | done",
        "features": "not_started | in_progress | done",
        "capabilities": "not_started | in_progress | done",
        "flows": "not_started | in_progress | done",
        "designs": "not_started | in_progress | done | skipped"
      },
      "startedAt": "2025-12-27",
      "completedAt": null
    }
  }
}
```

### 3.2 阶段转换

| 当前阶段 | 转换条件 | 下一阶段 |
|----------|----------|----------|
| understanding | 用户确认理解准确 | prd |
| prd | PRD 编写完成并通过验证 | requirements |
| requirements | 所有需求文档编写完成 | design |
| design | 设计文档完成或用户跳过 | validation |
| validation | 验证通过 + 用户确认 | completed |
| completed | - | 退出重构模式，进入正常流程 |

---

## 4. Hook Integration <!-- id: flow_refactoring_hooks -->

### 4.1 SessionStart Hook

检测重构模式，注入上下文：

```
<workflow-context>
Project: MyProject
Mode: Refactoring
Phase: requirements (需求分解)
Progress: PRD done, Features 3/5, Capabilities 0/2
</workflow-context>
```

### 4.2 Phase Guard

重构模式下的阶段守卫（简化）：
- understanding/prd 阶段：禁止写需求文档
- requirements 阶段：允许写需求文档

---

## 5. Completion Criteria <!-- id: flow_refactoring_completion -->

重构完成的判定条件：

1. PRD 存在且通过验证
2. PRD 中列出的 Feature/Capability/Flow 都已编写
3. `npm run validate:docs` 通过
4. 用户显式确认完成

完成后：
- `state.project.refactoring.phase = "completed"`
- `state.project.refactoring.completedAt = now()`
- SessionStart Hook 不再显示重构状态
- 切换到 `flow-workflows.md` 正常工作流

---

## 6. Entry Point <!-- id: flow_refactoring_entry -->

> init.js 检测现有项目，询问是否启用重构模式

**检测逻辑**：
- 非 SoloDevFlow 自身项目
- 未安装过 SoloDevFlow
- 存在代码目录（src/, lib/, app/）或文档（docs/, README.md）

**用户选择**：
```
检测到现有项目内容：
  - src/ (代码目录)
  - docs/ (文档目录)
  - README.md

是否启用重构模式？
  1. 是，按重构流程迁移到 SoloDevFlow 规范
  2. 否，作为新项目初始化（保留现有文件）
```

---

## 7. Dependencies <!-- id: flow_refactoring_dependencies -->

| Dependency | Type | 说明 |
|------------|------|------|
| project-init | hard | 扩展 init.js 检测逻辑 |
| state-management | hard | 扩展 state.json Schema（添加 project.refactoring） |
| hooks-integration | soft | SessionStart 显示重构状态 |

---

## 8. Artifacts <!-- id: flow_refactoring_artifacts -->

| Type | Path | Required | Description |
|------|------|----------|-------------|
| Design | docs/designs/des-refactoring.md | Yes | 详细设计（待细化） |
| Code | scripts/init.js | Yes | 扩展检测逻辑 |

**Design Depth**: required

---

*Version: v1.0*
*Created: 2025-12-27*
*Updated: 2025-12-28*
*Changes: v1.0 合并 fea-project-refactor 内容，消除文档重复*
