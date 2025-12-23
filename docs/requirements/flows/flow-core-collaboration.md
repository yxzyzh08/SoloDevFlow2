---
type: flow
version: "3.0"
---

# Flow: Core Collaboration <!-- id: flow_core_collaboration -->

> 人机协作的核心流程，定义 AI 如何响应用户输入并维护状态

**执行规范**：[.solodevflow/flows/core-collaboration.md](../../../.solodevflow/flows/workflows.md)

---

## 1. Flow Overview <!-- id: flow_core_collaboration_overview -->

### 1.1 Purpose

定义人机协作的标准流程，确保：
- 关键输入不丢失
- 灵光被捕获但不打断当前任务
- 状态始终可追溯
- 变更有影响分析
- 流程可重复、可追踪

### 1.2 Trigger

| 触发方式 | 说明 |
|----------|------|
| 用户输入 | 任何用户消息都触发此流程 |
| Session 开始 | AI 启动时读取状态恢复上下文 |

---

## 2. Participants <!-- id: flow_core_collaboration_participants -->

| Participant | Type | 职责 |
|-------------|------|------|
| User | External | 提供输入、审核、决策 |
| AI | System | 识别输入类型、记录、执行、更新状态 |
| state.json | Feature | 唯一状态源 |
| input-log.md | Feature | 关键输入记录 |
| spark-box.md | Feature | 灵光收集箱 |
| pending-docs.md | Capability | 文档债务追踪 |

---

## 3. Acceptance Criteria <!-- id: flow_core_collaboration_acceptance -->

| Item | Verification | Pass Criteria |
|------|--------------|---------------|
| Session 恢复 | 新 Session 开始 | 正确读取并汇报状态 |
| 意图识别 | 提供不同类型输入 | 正确路由到对应流程 |
| 关键输入识别 | 提供影响产品的输入 | 自动记录到 input-log.md |
| 灵光捕获 | 提供无关想法 | 记录到 spark-box.md，不打断任务 |
| 变更处理 | 请求变更 | 先做影响分析，等待确认 |
| 阶段引导 | 提供不符合阶段的请求 | 提供选项而非直接执行 |
| 自动提交 | 完成 subtask/feature | 自动执行 git commit |

---

## 4. Flow Diagram <!-- id: flow_core_collaboration_diagram -->

```
┌─────────────────────────────────────────────────────────────┐
│                     Session Start                            │
│  ┌─────────┐    ┌─────────────┐    ┌──────────────────┐     │
│  │ 读取    │ → │ 汇报状态    │ → │ 等待用户指示     │     │
│  │ state   │    │             │    │                  │     │
│  └─────────┘    └─────────────┘    └──────────────────┘     │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                     Intent Recognition                       │
│                                                              │
│  ┌─────────────┐                                            │
│  │ 用户输入   │                                            │
│  └──────┬──────┘                                            │
│         ↓                                                    │
│  ┌─────────────┐                                            │
│  │ 识别意图   │                                            │
│  └──────┬──────┘                                            │
│         ↓                                                    │
│  ┌──────┴──────┬──────────┬──────────┬──────────┐          │
│  ↓             ↓          ↓          ↓          ↓          │
│ 需求交付    功能咨询   变更请求    灵光      阶段不符      │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Constraints <!-- id: flow_core_collaboration_constraints -->

| Type | Constraint | 说明 |
|------|------------|------|
| Consistency | state.json 是唯一状态源 | 不维护其他状态文件 |
| Atomicity | Commit 前清空 pending-docs | 不允许跨 Commit 累积债务 |
| Order | 先文档后代码 | 变更时先更新文档 |
| Isolation | 关联项目只读 | 不修改其他项目文件 |

---

*Version: v3.0*
*Created: 2024-12-20*
*Updated: 2024-12-22*
*Changes: v3.0 拆分为需求文档和执行规范，执行规范移至 .solodevflow/flows/*
