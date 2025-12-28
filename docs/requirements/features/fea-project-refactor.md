---
type: feature
id: project-refactor
workMode: document
status: not_started
priority: P1
domain: process
version: "0.2"
---

# Feature: Project Refactor <!-- id: feat_project_refactor -->

> 为现有项目提供文档架构重构能力，将已有代码和文档迁移至 SoloDevFlow 规范体系

**Feature Type**: process

**Design Depth**: required

---

## 1. Intent <!-- id: feat_project_refactor_intent -->

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

## 2. Core Concept <!-- id: feat_project_refactor_concept -->

### 2.1 重构流程（High Level）

```
Phase 1: Understanding（理解）
  扫描代码 + 阅读现有文档 + 用户访谈 → 系统理解

Phase 2: PRD Refactor（PRD 重构）
  从系统理解中提炼 → 符合规范的 PRD

Phase 3: Requirements Decomposition（需求分解）
  从 PRD 派生 → Features / Capabilities / Flows

Phase 4: Design Completion（设计补全，可选）
  为复杂 Feature 补充设计文档

Phase 5: Validation & Completion（验证完成）
  文档一致性验证 → 退出重构模式 → 进入正常流程
```

### 2.2 与正常流程的关系

```
┌──────────────────┐   完成后   ┌──────────────────┐
│ flow-refactoring │ ────────→ │ flow-workflows   │
│ (重构工作流)      │   切换    │ (正常工作流)      │
└──────────────────┘           └──────────────────┘
```

---

## 3. State Extension <!-- id: feat_project_refactor_state -->

> 扩展 state.json，追踪重构进度

```json
{
  "project": {
    "refactoring": {
      "enabled": true,
      "phase": "understanding",
      "progress": {
        "prd": "not_started",
        "features": "not_started",
        "capabilities": "not_started",
        "flows": "not_started",
        "designs": "not_started"
      },
      "startedAt": "2025-12-27"
    }
  }
}
```

---

## 4. Entry Point <!-- id: feat_project_refactor_entry -->

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

## 5. Dependencies <!-- id: feat_project_refactor_dependencies -->

| Dependency | Type | 说明 |
|------------|------|------|
| project-init | hard | 扩展 init.js 检测逻辑 |
| state-management | hard | 扩展 state.json Schema |
| flow-refactoring | hard | 重构工作流定义 |
| hooks-integration | soft | SessionStart 显示重构状态 |

---

## 6. Artifacts <!-- id: feat_project_refactor_artifacts -->

| Type | Path | Required | Description |
|------|------|----------|-------------|
| Flow | docs/requirements/flows/flow-refactoring.md | Yes | 重构工作流定义 |
| Design | docs/designs/des-project-refactor.md | Yes | 详细设计（待细化） |
| Code | scripts/init.js | Yes | 扩展检测逻辑 |

---

*Version: v0.1 (High Level)*
*Created: 2025-12-27*
*Note: 等待主流程完成后细化*
