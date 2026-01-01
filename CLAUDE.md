# SoloDevFlow 2.0

> 1人 + Claude Code 的人机协作流程控制器

---

## Quick Start

**Session 开始时**：
1. 读取 `.solodevflow/state.json` 获取当前状态
2. 检查 `project.refactoring.enabled` 判断是否为重构模式
3. 汇报当前 Work Item、phase、进行中的 subtasks
4. 等待用户指示

**执行规范入口**：
@.solodevflow/flows/workflows.md

---

## Core Principles

| 原则 | 说明 | 违反后果 |
|------|------|----------|
| **Document First** | 先更新文档，再写代码 | 代码与设计不一致，变更难追踪 |
| **Phase Guards** | 按阶段限制文件操作 | requirements 阶段禁止改 src/ |
| **State-Driven** | 通过 state.json 管理全局状态 | 状态混乱，跨 Session 丢失上下文 |
| **Human Approval** | 阶段转换需人类批准 | 未经审核直接进入下一阶段 |

---

## File Locations

| 类别 | 路径 | 用途 |
|------|------|------|
| **状态** | `.solodevflow/state.json` | 唯一状态源 |
| **索引** | `.solodevflow/index.json` | 文档索引（自动生成） |
| **执行流程** | `.solodevflow/flows/*.md` | 各阶段执行规范 |
| **需求文档** | `docs/requirements/` | PRD、Feature、Capability、Flow |
| **设计文档** | `docs/designs/` | 架构设计、接口设计 |
| **规范文档** | `docs/specs/` | 元规范、需求规范、设计规范 |

---

## Commands & Tools

### State CLI

| 命令 | 用途 |
|------|------|
| `node scripts/state.cjs summary` | 获取状态摘要 |
| `node scripts/state.cjs set-phase <id> <phase>` | 更新 Work Item 阶段 |
| `node scripts/state.cjs activate <id>` | 激活 Work Item |
| `node scripts/state.cjs set-prd-phase <phase>` | 设置 PRD 阶段 |

### Document Commands

| 命令 | 用途 |
|------|------|
| `/write-prd` | 编写产品需求文档 |
| `/write-feature` | 编写 Feature 需求 |
| `/write-design` | 编写设计文档 |
| `node scripts/index.cjs` | 更新文档索引 |

---

## Context Management

### 子流程加载策略

| 触发条件 | 加载文档 |
|----------|----------|
| `feature_requirements` 阶段 | `requirements.md` |
| `feature_design` 阶段 | `design.md` |
| `feature_implementation` 阶段 | `implementation.md` |
| `feature_testing` 阶段 | `testing.md` |
| 报告 Bug | `bugfix.md` |
| `refactoring.enabled = true` | `refactoring.md` |

### 上下文优先级

1. **必须加载**：`state.json` + 当前阶段执行规范
2. **按需加载**：相关 Feature/Capability 需求文档
3. **可选参考**：PRD、设计文档、规范文档

---

## Meta Rules

### Bilingual Convention

项目全局遵循以下双语约定：

| 元素 | 语言 |
|------|------|
| 文件名 (Filenames) | 英文 |
| 标题和术语 (Titles & Terms) | 英文 |
| 描述和逻辑 (Descriptions & Logic) | 中文 |

此规则适用于所有文档、代码注释和规范文件。

---

*Version: v2.0*
*Updated: 2025-12-31*
