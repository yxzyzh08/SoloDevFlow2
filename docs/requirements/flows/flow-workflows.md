---
type: flow
id: workflows
workMode: document
status: done
priority: P0
domain: process
version: "8.0"
---

# Flow: Workflows <!-- id: flow_workflows -->

> 标准工作流，定义人机协作的输入处理和流程路由

**执行规范**：[.solodevflow/flows/workflows.md](../../.solodevflow/flows/workflows.md)
> 执行规范由 AI 根据本需求文档生成。需求变更后需重新生成执行规范。

---

## 1. Overview <!-- id: flow_overview -->

### 1.1 Purpose

定义人机协作的主工作流框架：

| 职责 | 说明 |
|------|------|
| **意图路由** | 识别用户输入类型，路由到对应子流程 |
| **阶段流转** | 管理 Feature 生命周期（pending → done） |
| **上下文管理** | 跨对话保持状态 |

**设计原则**：
- **按需加载**：主流程精简，子流程按需加载
- **单一职责**：每个子流程独立管理

### 1.2 Core Participants

| 角色 | 职责 |
|------|------|
| User | 提供输入（咨询/需求/混合） |
| AI | 分析输入、路由流程、执行交付 |
| state.json | 唯一状态源，保持跨对话上下文 |

---

## 2. Flow Diagram <!-- id: flow_diagram -->

```
┌─────────────────────────────────────────────────────────────┐
│                     Session Start                            │
│  读取 state.json / index.json → 汇报状态 → 等待用户指示      │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                   Input Analysis                             │
│                                                              │
│  用户输入 → 意图识别 → 路由到子流程                          │
│                                                              │
│  ┌────────┬────────┬────────┬────────┬────────┬────────┐   │
│  ↓        ↓        ↓        ↓        ↓        ↓        ↓   │
│ 直接    产品    需求    设计    实现    验收    无关     │
│ 执行    咨询    流程    流程    流程    流程    拒绝     │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Input Analysis <!-- id: flow_input_analysis -->

> 每次接收用户输入，首先进行意图识别和路由

### 3.1 Input Types

| 类型 | 识别信号 | 路由目标 |
|------|----------|----------|
| **直接执行** | 简单明确、单步操作 | 立即执行，不走流程 |
| **产品咨询** | 询问功能、进度、实现 | §4 Consulting Flow |
| **需求处理** | 新功能、变更、规范修改 | [flow-requirements.md](flow-requirements.md) |
| **设计处理** | 进入设计阶段 | [flow-design.md](flow-design.md) |
| **实现处理** | 进入实现阶段 | [flow-implementation.md](flow-implementation.md) |
| **测试处理** | 进入测试阶段 | [flow-testing.md](flow-testing.md) |
| **审核批准** | 批准/通过（review 阶段） | §5 Review Approval |
| **无关想法** | 与本产品完全无关 | 直接拒绝 |

### 3.2 Direct Execution Criteria

直接执行类型的判断标准：

| 条件 | 说明 |
|------|------|
| ✅ 范围明确 | 单步操作可完成 |
| ✅ 不涉及设计变更 | 无需更新文档 |
| ✅ 可直接定位 | 问题明确（如"修复第42行空指针"） |

**边界场景**：
- "修复登录问题" → ❌ 不是直接执行（问题不明确）
- "修复 login.js 第42行空指针" → ✅ 直接执行

### 3.3 Phase-Based Routing

根据当前 Feature 的 phase 自动路由：

| 当前 Phase | 默认路由 |
|------------|----------|
| `feature_requirements` | flow-requirements.md |
| `feature_review` | §5 Review Approval |
| `feature_design` | flow-design.md |
| `feature_implementation` | flow-implementation.md |
| `feature_testing` | flow-testing.md |

---

## 4. Consulting Flow <!-- id: flow_consulting -->

> 咨询交付流程：回答产品咨询

### 4.1 Flow Steps

```
[用户咨询]
    ↓
[加载 PRD + 相关文档]
    ↓
[生成回答]
    ↓
[检查是否包含需求成分]
    ├─ 是 → 询问是否处理需求
    └─ 否 → 等待下一输入
```

### 4.2 Mixed Input Handling

混合输入（咨询+需求）处理：
1. **先回答咨询**
2. **再询问**："刚才提到 xxx，是否现在处理这个需求？"
3. **用户选择** → 进入需求流程或继续等待

### 4.3 Document Query Mechanism

通过 index.json 定位相关文档：

| 匹配方式 | 说明 |
|----------|------|
| 精确匹配 | id 或 title 完全匹配 |
| 模糊匹配 | 关键词出现在 title 中 |
| 无匹配 | 返回 PRD 作为兜底 |

---

## 5. Review Approval Flow <!-- id: flow_review -->

> 审核审批流程：人类审核文档，批准后进入下一阶段

### 5.1 Core Principles

| 原则 | 说明 |
|------|------|
| **文档是 Truth** | 需求文档是后续阶段的唯一依据 |
| **人类审核必需** | AI 生成的文档必须经人类审核 |
| **显式批准** | 必须说"批准"/"通过"才能进入下一阶段 |

### 5.2 Review Flow

```
[AI 完成文档]
    ↓
[phase → feature_review]
    ↓
[提示用户审核]
    ↓
[等待反馈]
    ├─ 批准 → phase → 下一阶段
    ├─ 修改 → AI 修改后重新审核
    └─ 拒绝 → 返回上一阶段
```

### 5.3 Approval Syntax

| 类型 | 关键词 |
|------|--------|
| **批准** | "批准"、"通过"、"同意"、"approve" |
| **修改** | "修改 xxx"、"补充 xxx" |
| **拒绝** | "重新来"、"需求不对" |

### 5.4 Review Assistance（可选）

> 人类可主动调用辅助工具进行深度审核

| 辅助工具 | 用途 | 触发方式 |
|----------|------|----------|
| **review-assistant** | AI 辅助审核需求文档 | 人类主动调用（非自动触发） |

**适用场景**：
- 复杂需求文档的深度审核
- 需要行业最佳实践参考
- 希望生成结构化审核报告

**输出**：`.solodevflow/reviews/{doc-id}-review.md`

详见 [fea-review-assistant.md](../features/fea-review-assistant.md)

---

## 6. Subflow References <!-- id: flow_subflows -->

> 子流程独立文档，按需加载

| 子流程 | 文档 | 触发阶段 |
|--------|------|----------|
| **需求流程** | [flow-requirements.md](flow-requirements.md) | `feature_requirements` |
| **设计流程** | [flow-design.md](flow-design.md) | `feature_design` |
| **实现流程** | [flow-implementation.md](flow-implementation.md) | `feature_implementation` |
| **测试流程** | [flow-testing.md](flow-testing.md) | `feature_testing` |

**加载策略**：
- 主流程（本文档）：每次 Session 加载
- 子流程：进入对应阶段时按需加载

---

## 7. Context Management <!-- id: flow_context -->

### 7.1 State Persistence

| 状态 | 存储位置 | 说明 |
|------|----------|------|
| activeFeatures | state.json | 当前活跃的 Feature 列表 |
| subtasks | state.json | 进行中的任务列表 |
| phase | 文档 frontmatter | Feature 的当前阶段 |

### 7.2 Session Start

每次对话开始：
1. 读取 `state.json` 和 `index.json`
2. 显示活跃 Feature 和 phase
3. 显示进行中的 subtasks
4. 等待用户指示

---

## 8. Phase Lifecycle <!-- id: flow_phase -->

### 8.1 Phase Sequence

```
pending → feature_requirements → feature_review → feature_design → feature_implementation → feature_testing → done
```

**阶段职责**：

| 阶段 | 主要职责 |
|------|----------|
| `feature_requirements` | 编写需求文档 |
| `feature_review` | 人类审核文档 |
| `feature_design` | 编写设计文档 |
| `feature_implementation` | 编写代码 + 单元测试 + 集成测试 |
| `feature_testing` | 系统级测试（E2E/性能/安全/回归） |

### 8.2 Phase Transitions

| 转换 | 触发条件 | 命令 |
|------|----------|------|
| → requirements | 开始处理需求 | `set-phase <id> feature_requirements` |
| → review | AI 完成文档 | `set-phase <id> feature_review` |
| → design | 人类批准需求 | `set-phase <id> feature_design` |
| → implementation | 设计完成 | `set-phase <id> feature_implementation` |
| → testing | 实现完成 | `set-phase <id> feature_testing` |
| → done | 测试通过 | `set-phase <id> done` |

### 8.3 Phase Guards

| Phase | 阻止的操作 |
|-------|------------|
| `feature_requirements` | Write/Edit `src/**/*`, `tests/**/*` |
| `feature_review` | Write/Edit `docs/designs/**/*`, `src/**/*` |
| `feature_design` | Write/Edit `src/**/*`, `tests/**/*` |

---

## 9. Hooks Integration <!-- id: flow_hooks -->

> Hooks 实现工作流自动化，详见 [fea-hooks-integration.md](../features/fea-hooks-integration.md)

| Hook | 职责 |
|------|------|
| **SessionStart** | 注入产品状态 |
| **UserPromptSubmit** | 注入上下文、检测需求变更 |
| **PreToolUse** | 阶段守卫、文件保护 |
| **PostToolUse** | 文档验证（可选） |

---

## 10. Execution Principles <!-- id: flow_principles -->

### 始终做

- 每次输入 → 先分析输入类型
- 直接执行 → 立即执行，不走流程
- 进入子流程 → 加载对应子流程文档
- 状态更新 → 通过 State CLI
- 文档变更 → 运行 index.js

### 绝不做

- 跳过输入分析直接执行
- 将复杂问题错判为"直接执行"
- 跳过 review 阶段
- 未经人类批准更新 phase
- 直接编辑 state.json

---

## 11. Dependencies <!-- id: flow_dependencies -->

| Dependency | Type | 说明 |
|------------|------|------|
| state-management | hard | 状态存储和读取 |
| hooks-integration | soft | 工作流自动化 |
| document-validation | soft | 文档验证 |

---

## 12. Acceptance Criteria <!-- id: flow_acceptance -->

| Item | Verification | Pass Criteria |
|------|--------------|---------------|
| 意图识别 | 测试各类输入 | 正确路由到对应流程 |
| 阶段路由 | 切换 phase | 自动加载对应子流程 |
| 审核流程 | 提交文档后 | 进入 review 阶段 |
| 批准语法 | 说"批准" | phase 正确转换 |
| 按需加载 | 进入子流程 | 只加载对应文档 |

---

*Version: v8.2*
*Created: 2024-12-20*
*Updated: 2025-12-28*
*Changes: v8.2 添加 §5.4 Review Assistance，集成 review-assistant 作为人类可选审核辅助工具*
