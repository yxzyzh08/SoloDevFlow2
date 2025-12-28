---
type: feature
id: agent-architecture
workMode: document
status: not_started
priority: P2
domain: ai-config
version: "1.1"
---

# Feature: Agent Architecture <!-- id: feat_agent_architecture -->

> 从单 Agent 演进到专业化 Subagent 架构，支持多窗口并行工作和专业化分工

---

## 1. Intent <!-- id: feat_agent_architecture_intent -->

### 1.1 Problem

- 当前单 Agent 加载全部规范，context 长度大，影响性能
- 不同阶段（需求/设计/开发/测试）需要的上下文差异大
- 用户开多窗口时，每个窗口都是"全能型"，缺乏专业化

### 1.2 Value

- **专业化**：每个 Agent 只加载必要上下文，更精简高效
- **并行工作**：支持多窗口同时处理不同 Feature 的不同阶段
- **模型灵活性**：可为不同 Agent 选择不同模型（如 Opus 做设计，Sonnet 做编码）

---

## 2. Scope <!-- id: feat_agent_architecture_scope -->

### 2.1 In Scope

- 定义演进阶段和每阶段目标
- 定义各专业 Agent 的职责边界
- 设计 Agent 间状态同步机制

### 2.2 Out of Scope

- 多人协作（仅支持单人多窗口）
- 自动 Agent 调度（用户手动选择 Agent）

---

## 3. Evolution Phases <!-- id: feat_agent_architecture_phases -->

### Phase 1: 单 Agent + 工作流（当前）

| 状态 | 描述 |
|------|------|
| **结构** | 1 个 CLAUDE.md + workflows.md |
| **能力** | 全能型，处理所有阶段 |
| **目标** | 验证工作流正确性 |

### Phase 2: Profile 模式切换

| 状态 | 描述 |
|------|------|
| **结构** | 1 个 CLAUDE.md + 多个 Profile 定义 |
| **能力** | 用户声明模式，动态加载对应规范 |
| **触发** | "进入需求分析模式"、"进入开发模式" |
| **目标** | 低成本实现专业化 |

### Phase 3: 物理拆分多 Agent

| 状态 | 描述 |
|------|------|
| **结构** | 多个独立 Agent CLAUDE.md |
| **能力** | 启动即专业，无需切换 |
| **启动方式** | 待定（目录切换/启动参数/命令选择） |
| **目标** | 真正的专业化隔离 |

### Phase 4: Orchestrator 自动调度（远期）

| 状态 | 描述 |
|------|------|
| **结构** | Orchestrator + 多个 Subagent |
| **能力** | 自动识别任务类型，调度合适 Agent |
| **目标** | 智能化协作 |

---

## 4. Agent Definitions <!-- id: feat_agent_architecture_agents -->

> Phase 3+ 实现时细化

### 4.1 预定义 Agent 类型

| Agent | 职责 | 加载规范 |
|-------|------|----------|
| **requirements-agent** | 需求分析、澄清、文档编写 | spec-requirements, PRD, 知识库 |
| **design-agent** | 架构设计、接口定义 | spec-design, Feature Spec |
| **backend-agent** | 后端开发、API 实现 | spec-backend-dev, Design Doc |
| **frontend-agent** | 前端开发、UI 实现 | spec-frontend-dev, Design Doc |
| **testing-agent** | 测试用例、质量保证 | spec-test, Feature Spec |
| **consulting-agent** | 产品咨询、知识查询 | PRD, 知识库 |

### 4.2 Agent 启动方式（待定）

| 方案 | 描述 | 优点 | 缺点 |
|------|------|------|------|
| 目录切换 | 在 Agent 目录启动 Claude | 简单 | 需要 cd |
| 启动参数 | `claude --agent=requirements` | 优雅 | 需要 CLI 支持 |
| 命令选择 | `/agent requirements` | 无需重启 | 同会话切换有残留 |

---

## 5. State Synchronization <!-- id: feat_agent_architecture_sync -->

> 多 Agent 如何共享状态

### 5.1 共享机制

| 机制 | 描述 |
|------|------|
| **state.json** | 唯一状态源，所有 Agent 读写 |
| **knowledge.db** | 知识库，只读查询 |
| **文档系统** | docs/ 目录，通过 Git 同步 |

### 5.2 冲突处理

| 场景 | 处理方式 |
|------|----------|
| 同时写 state.json | 使用 state.js CLI（内置锁） |
| 同时修改同一文档 | Git 冲突，手动解决 |
| 不同 Feature 并行 | 无冲突（独立文档） |

---

## 6. Acceptance Criteria <!-- id: feat_agent_architecture_acceptance -->

| Phase | Item | Verification | Pass Criteria |
|-------|------|--------------|---------------|
| Phase 2 | Profile 切换 | 手动测试 | 声明模式后加载对应规范 |
| Phase 3 | Agent 隔离 | 手动测试 | 不同窗口启动不同 Agent |
| Phase 3 | 状态同步 | 并发测试 | 多 Agent 写 state.json 无冲突 |

---

## 7. Dependencies <!-- id: feat_agent_architecture_dependencies -->

| Dependency | Type | 说明 |
|------------|------|------|
| workflows | hard | 需先完成单 Agent 工作流验证 |
| knowledge-base | soft | Agent 可查询知识库 |
| state-management | hard | 多 Agent 共享状态 |

---

## 8. Open Questions <!-- id: feat_agent_architecture_questions -->

| Question | Context | Impact |
|----------|---------|--------|
| Agent 启动方式如何实现？ | 需要 Claude Code 支持或 Workaround | 影响 Phase 3 实现 |
| 是否需要 Agent 间通信？ | 当前仅共享文件系统 | 复杂协作场景 |
| Phase 4 是否真的需要？ | 可能过度设计 | 可按需决定 |

---

## 9. Artifacts <!-- id: feat_agent_architecture_artifacts -->

| Type | Path | Description |
|------|------|-------------|
| Design | docs/designs/des-agent-architecture.md | 设计文档（Phase 3 前填写） |
| Config | .claude/agents/ | Agent CLAUDE.md 目录（Phase 3） |

**Design Depth**: TBD（Phase 2 后评估）

---

*Version: v1.0*
*Created: 2025-12-25*
*Updated: 2025-12-25*
