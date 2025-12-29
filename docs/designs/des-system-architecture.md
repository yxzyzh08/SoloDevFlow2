---
type: design
id: design-system-architecture
status: done
version: "1.0"
inputs:
  - docs/requirements/prd.md#prod_solodevflow
  - docs/requirements/flows/flow-workflows.md#flow_workflows
---

# System Architecture - SoloDevFlow 2.0 <!-- id: design_system_arch -->

> High Level Architecture Design - 以工作流程为核心的人机协作系统

---

## 1. Input Requirements <!-- id: design_system_arch_input -->

本设计基于以下需求：
- [PRD - SoloDevFlow 2.0](../requirements/prd.md#prod_solodevflow)
- [Flow - Workflows](../requirements/flows/flow-workflows.md#flow_workflows)

---

## 2. Overview <!-- id: design_system_arch_overview -->

### 2.1 Design Goal

设计一个**以工作流程为核心**的人机协作系统，实现：
- 准确识别用户意图，路由到正确流程
- 维护产品知识，支撑意图识别和流程执行
- 跨会话状态管理，保持上下文连续性
- 最小化上下文污染，提高 AI 效率

### 2.2 Core Insight

**工作流程是系统的心脏，其他模块为其服务**

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│                     工作流程（核心）                              │
│                                                                  │
│    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    │
│    │  意图   │ →  │  流程   │ →  │  阶段   │ →  │  流程   │    │
│    │  识别   │    │  路由   │    │  守卫   │    │  执行   │    │
│    └────┬────┘    └────┬────┘    └────┬────┘    └────┬────┘    │
│         │              │              │              │          │
│         ↓              ↓              ↓              ↓          │
│    ┌─────────────────────────────────────────────────────┐     │
│    │                    知识层                            │     │
│    │  ┌────────────────────────────┐  ┌──────────┐       │     │
│    │  │ 产品知识库（含规范）        │  │ 状态管理 │       │     │
│    │  └────────────────────────────┘  └──────────┘       │     │
│    └─────────────────────────────────────────────────────┘     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 Key Constraints

| 约束 | 说明 | 影响 |
|------|------|------|
| Claude Code 环境 | 运行在 Claude Code CLI 中 | 只能通过 Hooks、CLAUDE.md、Skills 扩展 |
| 无持久进程 | 每次会话独立 | 必须依赖文件系统持久化状态 |
| Token 限制 | 上下文窗口有限 | 必须精简注入的上下文 |
| 单人使用 | 超级个体开发者 | 无需考虑多用户并发 |

---

## 3. Layered Architecture <!-- id: design_system_arch_layers -->

### 3.1 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      Layer 0: Human-AI Interface                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                     Claude Code CLI                         ││
│  │  ┌─────────┐  ┌─────────────────┐  ┌───────────────────┐   ││
│  │  │ 用户输入 │→ │ UserPromptSubmit │→ │ 主 Agent 处理     │   ││
│  │  │         │  │ Hook（上下文注入）│  │                   │   ││
│  │  └─────────┘  └─────────────────┘  └───────────────────┘   ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   Layer 1: Flow Control (Core)                   │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ 意图识别模块 │→ │ 流程路由模块 │→ │ 流程执行模块 │          │
│  │              │  │              │  │              │          │
│  │ • 分类判断   │  │ • 路由决策   │  │ • 咨询流程   │          │
│  │ • 置信度评估 │  │ • 阶段守卫   │  │ • 需求流程   │          │
│  │ • 降级策略   │  │ • 异常处理   │  │ • 变更流程   │          │
│  └──────┬───────┘  └──────────────┘  └──────┬───────┘          │
│         │                                    │                  │
│         ↓ 查询                               ↓ 更新             │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Layer 2: Knowledge                       ││
│  │                                                             ││
│  │  ┌──────────────────────────────┐  ┌────────────────┐        ││
│  │  │        产品知识库            │  │   状态管理     │        ││
│  │  │                              │  │                │        ││
│  │  │ • features (功能)            │  │ • Feature 状态 │        ││
│  │  │ • capabilities (能力)        │  │ • 阶段信息     │        ││
│  │  │ • flows (流程)               │  │ • 活跃任务     │        ││
│  │  │ • specifications (规范)      │  │ • 历史记录     │        ││
│  │  │ • relationships (关系)       │  │                │        ││
│  │  │ • boundaries (产品边界)      │  │                │        ││
│  │  └──────────────────────────────┘  └────────────────┘        ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   Layer 3: Infrastructure                        │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐    │
│  │  Hooks   │  │   CLI    │  │  Files   │  │   Scripts    │    │
│  │          │  │          │  │          │  │              │    │
│  │ • Session│  │ • state  │  │ • state  │  │ • validate   │    │
│  │ • Prompt │  │ • know   │  │ • know   │  │ • sync       │    │
│  │ • Tool   │  │ • status │  │ • docs   │  │ • analyze    │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Layer Responsibilities

| Layer | 职责 | 核心模块 |
|-------|------|----------|
| **L0: Interface** | 人机交互入口 | Claude Code CLI, Hooks |
| **L1: Flow Control** | 意图识别、路由、执行 | Intent, Router, Executor |
| **L2: Knowledge** | 产品知识（含规范）、状态 | Knowledge Base, State |
| **L3: Infrastructure** | 底层工具和存储 | CLI Tools, File System |

### 3.3 Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        主数据流                                  │
│                                                                  │
│  用户输入 → Hook注入上下文 → 意图识别 → 路由决策 → 流程执行     │
│                 ↑                ↑           ↑          │       │
│                 │                │           │          ↓       │
│           知识库.context   知识库.query  状态.check   状态.update│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      知识同步流                                  │
│                                                                  │
│  文档变更 → 触发同步 → 解析文档 → 更新知识库 → 验证一致性       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Module Design <!-- id: design_system_arch_modules -->

### 4.1 Module Overview

| 模块 | 层级 | 职责 | 依赖 | 被依赖 |
|------|------|------|------|--------|
| **Intent Recognition** | L1 | 识别用户意图 | Knowledge Base | Router |
| **Flow Router** | L1 | 路由决策 + 阶段守卫 | State, Intent | Executor |
| **Flow Executor** | L1 | 执行具体流程 | Knowledge Base, State | - |
| **Knowledge Base** | L2 | 产品知识存储和查询（含规范） | Files | Intent, Router, Executor |
| **State Management** | L2 | 运行时状态持久化 | Files | Router, Executor |

### 4.2 Module: Intent Recognition

**职责**：识别用户输入的意图类型

```
┌─────────────────────────────────────────────────────────────────┐
│                     Intent Recognition                           │
│                                                                  │
│  输入: 用户文本 + 上下文                                         │
│  输出: { intent, confidence, reasoning }                        │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                     处理流程                                 ││
│  │                                                              ││
│  │  用户输入 → 规则预判 → LLM分类 → 置信度评估 → 输出          ││
│  │               ↓           ↓                                  ││
│  │          快速路径     知识库查询                             ││
│  │          (高置信)    (低置信时)                              ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  意图类型:                                                       │
│  • 产品咨询 - 只读查询                                          │
│  • 新增需求 - 添加新功能                                        │
│  • 需求变更 - 修改已有功能                                      │
│  • 规范变更 - 修改规则/模板                                     │
│  • 无关想法 - 拒绝处理                                          │
│  • 直接执行 - 简单操作（绕过流程）                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**依赖接口**：
- `KnowledgeBase.getContext()` - 获取意图识别上下文
- `KnowledgeBase.exists(keyword)` - 判断功能是否存在
- `KnowledgeBase.search(query)` - 模糊搜索

### 4.3 Module: Knowledge Base

**职责**：存储和查询产品知识

```
┌─────────────────────────────────────────────────────────────────┐
│                      Knowledge Base                              │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    存储                                      ││
│  │                                                              ││
│  │  knowledge.db (SQLite)                                       ││
│  │  ├── 节点数据 (features, capabilities, flows, specs)        ││
│  │  ├── 关系数据 (depends, extends, impacts, defines)          ││
│  │  └── 全文索引 (支持关键词搜索)                               ││
│  │                                                              ││
│  │  特点: 关系查询、全文搜索、单文件便携、派生数据可重建        ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    接口定义                                  ││
│  │                                                              ││
│  │  查询接口:                                                   ││
│  │  • getContext() → 意图识别上下文（精简）                     ││
│  │  • exists(name) → 功能是否存在                              ││
│  │  • query(id) → 节点详情                                     ││
│  │  • search(keyword) → 匹配节点列表                           ││
│  │  • related(id, type) → 关联节点                             ││
│  │                                                              ││
│  │  同步接口:                                                   ││
│  │  • sync() → 从文档重建知识库                                ││
│  │  • validate() → 验证一致性                                  ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  数据来源:                                                       │
│  • PRD → features, capabilities, flows                          │
│  • Feature Specs → 详细信息, keywords                           │
│  • state.json → status, phase                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**关键设计决策**：
- 知识库是**派生数据**，从文档生成，非权威源
- 权威源是：PRD + Feature Specs + state.json
- 同步机制确保一致性

### 4.4 Module: State Management

**职责**：管理运行时状态

```
┌─────────────────────────────────────────────────────────────────┐
│                     State Management                             │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    数据模型                                  ││
│  │                                                              ││
│  │  state.json (已有)                                          ││
│  │  ├── project: { name, type }                                ││
│  │  ├── flow: { activeFeatures }                               ││
│  │  ├── features: { [id]: { phase, status, subtasks } }        ││
│  │  └── metadata: { lastCommit, lastSync }                     ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  接口: (已有 CLI)                                               │
│  • summary() → 状态摘要                                         │
│  • get-feature(id) → Feature 详情                              │
│  • update-feature(id, data) → 更新状态                         │
│  • context() → 流程控制上下文（新增）                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.5 Module: Flow Router

**职责**：路由决策 + 阶段守卫

```
┌─────────────────────────────────────────────────────────────────┐
│                       Flow Router                                │
│                                                                  │
│  输入: intent + state context                                   │
│  输出: target flow + guards result                              │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    路由表                                    ││
│  │                                                              ││
│  │  Intent          → Flow              Guards                  ││
│  │  ─────────────────────────────────────────────              ││
│  │  产品咨询         → ConsultingFlow    -                      ││
│  │  新增需求         → NewRequirementFlow PhaseGuard            ││
│  │  需求变更         → ChangeRequirementFlow PhaseGuard         ││
│  │  规范变更         → SpecChangeFlow    ImpactAnalysis         ││
│  │  无关想法         → RejectFlow        -                      ││
│  │  直接执行         → DirectExecution   -                      ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  阶段守卫:                                                       │
│  • 检查当前 Feature 阶段                                        │
│  • 阶段不符时 → 提供选项（切换/取消）                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.6 Module Dependency Graph

```
                    ┌───────────────┐
                    │  User Input   │
                    └───────┬───────┘
                            ↓
┌───────────────────────────────────────────────────────────────┐
│                      L1: Flow Control                          │
│                                                                │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    │
│  │    Intent    │───→│    Router    │───→│   Executor   │    │
│  │  Recognition │    │              │    │              │    │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘    │
│         │                   │                   │             │
└─────────┼───────────────────┼───────────────────┼─────────────┘
          ↓                   ↓                   ↓
┌─────────────────────────────────────────────────────────────────┐
│                       L2: Knowledge                              │
│                                                                  │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐      │
│  │ Knowledge Base │←─┤     State      │  │    Specs     │      │
│  │                │  │   Management   │  │              │      │
│  └────────┬───────┘  └────────┬───────┘  └──────┬───────┘      │
│           │                   │                  │              │
└───────────┼───────────────────┼──────────────────┼──────────────┘
            ↓                   ↓                  ↓
┌─────────────────────────────────────────────────────────────────┐
│                      L3: Infrastructure                          │
│                                                                  │
│          ┌──────────────────────────────────────┐               │
│          │            File System               │               │
│          │  state.json | knowledge.json | docs  │               │
│          └──────────────────────────────────────┘               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Integration Points <!-- id: design_system_arch_integration -->

### 5.1 Hook Integration

```
┌─────────────────────────────────────────────────────────────────┐
│                     Hook Integration                             │
│                                                                  │
│  SessionStart Hook                                              │
│  ├─ 触发: 对话开始                                              │
│  ├─ 动作: 读取 state.json, 汇报状态                             │
│  └─ 输出: additionalContext                                     │
│                                                                  │
│  UserPromptSubmit Hook                                          │
│  ├─ 触发: 用户提交输入                                          │
│  ├─ 动作:                                                       │
│  │   1. 调用 knowledge.js context                               │
│  │   2. 调用 state.js context                                   │
│  │   3. 组装意图识别上下文                                      │
│  └─ 输出: additionalContext（注入主 Agent）                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Sub Agent Integration

```
┌─────────────────────────────────────────────────────────────────┐
│                   Sub Agent Integration                          │
│                                                                  │
│  场景: 意图识别置信度 < 0.8                                      │
│                                                                  │
│  主 Agent                     Sub Agent (intent-analyzer)       │
│     │                              │                             │
│     │──── 调用 Task tool ─────────→│                             │
│     │     (用户输入 + 上下文)       │                             │
│     │                              │                             │
│     │                         读取 PRD                           │
│     │                         读取 Feature Specs                 │
│     │                         查询 Knowledge Base                │
│     │                              │                             │
│     │←──── 返回判断结果 ───────────│                             │
│     │     { intent, confidence,    │                             │
│     │       reasoning }            │                             │
│     ↓                              ↓                             │
│  路由决策                    上下文销毁（不污染主 Agent）        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 CLI Integration

```bash
# 知识库 CLI
node scripts/knowledge.js context          # 意图识别上下文
node scripts/knowledge.js exists <name>    # 功能是否存在
node scripts/knowledge.js query <id>       # 查询节点
node scripts/knowledge.js search <keyword> # 搜索
node scripts/knowledge.js sync             # 同步知识库

# 状态 CLI（已有 + 扩展）
node scripts/state.js summary              # 状态摘要
node scripts/state.js context              # 流程控制上下文（新增）
node scripts/state.js get-feature <id>     # Feature 详情
```

---

## 6. Data Architecture <!-- id: design_system_arch_data -->

### 6.1 Data Ownership

| 数据 | 权威源 | 派生存储 | 同步机制 |
|------|--------|----------|----------|
| 产品定义 | PRD, Feature Specs | knowledge.db | 文档变更时同步 |
| 文档规范 | docs/specs/*.md | knowledge.db | 文档变更时同步 |
| Feature 状态 | state.json | knowledge.db | 状态变更时同步 |
| 运行时状态 | state.json | - | CLI 直接操作 |

### 6.2 File Structure

```
.solodevflow/
├── state.json           # 运行时状态（权威源）
├── knowledge.db         # 产品知识库（SQLite，派生数据）
├── flows/
│   └── workflows.md     # 工作流程执行规范
└── input-log.md         # 输入日志

docs/
├── requirements/
│   ├── prd.md           # 产品需求文档（权威源）
│   ├── features/        # Feature Specs（权威源）
│   ├── capabilities/
│   └── flows/
├── specs/               # 文档规范
└── designs/             # 设计文档

scripts/
├── state.js             # 状态 CLI
├── knowledge.js         # 知识库 CLI（新增）
├── validate-state.js    # 状态验证
└── sync-knowledge.js    # 知识库同步（新增）
```

---

## 7. Technical Approach <!-- id: design_system_arch_approach -->

### 7.1 Intent Recognition Strategy

**策略: Few-shot Prompting + 置信度 + Sub Agent 降级**

```
┌─────────────────────────────────────────────────────────────────┐
│                 Intent Recognition Strategy                      │
│                                                                  │
│  Stage 1: 轻量判断（主 Agent）                                   │
│  ├─ 输入: 用户文本 + Hook 注入的上下文                          │
│  ├─ 方法: Few-shot prompting（5 类意图各 3 个示例）             │
│  ├─ 输出: { intent, confidence }                                │
│  └─ 分支:                                                       │
│      ├─ confidence ≥ 0.8 → 直接路由                             │
│      ├─ confidence 0.5-0.8 → 向用户确认                         │
│      └─ confidence < 0.5 → Stage 2                              │
│                                                                  │
│  Stage 2: 深度分析（Sub Agent）                                  │
│  ├─ 输入: 用户文本 + 完整上下文                                 │
│  ├─ 方法: 读取 PRD、Feature Specs、Knowledge Base               │
│  ├─ 输出: { intent, confidence, reasoning }                     │
│  └─ 分支:                                                       │
│      ├─ confidence ≥ 0.6 → 路由                                 │
│      └─ confidence < 0.6 → 要求用户重新表述                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Knowledge Base Strategy

**策略: 派生数据 + 按需同步 + 分层查询**

```
┌─────────────────────────────────────────────────────────────────┐
│                  Knowledge Base Strategy                         │
│                                                                  │
│  数据生成:                                                       │
│  ├─ 触发: npm run sync:knowledge                                │
│  ├─ 来源: PRD frontmatter + Feature Specs metadata              │
│  └─ 输出: knowledge.json                                        │
│                                                                  │
│  查询分层:                                                       │
│  ├─ Layer 1: getContext() → 精简索引（~200 tokens）             │
│  │   用于: Hook 注入，每次输入                                  │
│  │                                                              │
│  ├─ Layer 2: exists() / search() → 快速查询                     │
│  │   用于: 意图识别判断"新增 vs 变更"                           │
│  │                                                              │
│  └─ Layer 3: query() / related() → 详细信息                     │
│      用于: Sub Agent 深度分析                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 7.3 Context Injection Strategy

**策略: 分层注入 + 最小化 Token**

```
┌─────────────────────────────────────────────────────────────────┐
│                Context Injection Strategy                        │
│                                                                  │
│  Layer 1: 始终注入（via UserPromptSubmit Hook）                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 【当前状态】                                                │ │
│  │ Feature: workflows (pending)                               │ │
│  │                                                            │ │
│  │ 【功能索引】                                                │ │
│  │ - project-init (done)                                      │ │
│  │ - state-management (pending)                               │ │
│  │ - workflows (in_progress)                                  │ │
│  │                                                            │ │
│  │ 【产品边界】                                                │ │
│  │ 人机协作流程控制器：需求管理、状态跟踪、文档规范             │ │
│  └────────────────────────────────────────────────────────────┘ │
│  Token 预算: ~200                                               │
│                                                                  │
│  Layer 2: 按需加载（via Sub Agent）                             │
│  ├─ PRD 相关章节                                                │
│  ├─ Feature Spec 详情                                           │
│  └─ Token 预算: ~2000                                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. Decision Record <!-- id: design_system_arch_decisions -->

| Decision | Options | Choice | Rationale |
|----------|---------|--------|-----------|
| 知识库存储 | 图数据库 / JSON文件 / SQLite | SQLite | 关系查询能力强、支持全文搜索、单文件便携 |
| 意图识别 | Fine-tuned / Few-shot / Zero-shot | Few-shot + 降级 | 平衡准确率和复杂度 |
| 上下文注入 | 全量加载 / 分层加载 | 分层加载 | 节省 Token，提高效率 |
| Sub Agent 调用 | 每次 / 按需 | 按需（低置信度时） | 减少延迟和成本 |
| 知识库同步 | 实时 / 按需 / 定时 | 按需（文档变更时） | 简单可靠 |

---

## 9. Implementation Phases <!-- id: design_system_arch_phases -->

### Phase 1: 基础框架

| 模块 | 交付物 | 依赖 |
|------|--------|------|
| 知识库数据模型 | knowledge.json schema | - |
| 知识库 CLI | scripts/knowledge.js | schema |
| 同步脚本 | scripts/sync-knowledge.js | CLI |

### Phase 2: 意图识别

| 模块 | 交付物 | 依赖 |
|------|--------|------|
| Few-shot 示例 | workflows.md 更新 | - |
| Hook 脚本 | scripts/intent-context.js | 知识库 CLI |
| Hook 配置 | .claude/settings.json | Hook 脚本 |

### Phase 3: 流程集成

| 模块 | 交付物 | 依赖 |
|------|--------|------|
| 路由逻辑 | workflows.md 更新 | 意图识别 |
| Sub Agent 定义 | intent-analyzer agent | 知识库 |
| 阶段守卫 | workflows.md 更新 | 状态管理 |

---

## 10. Open Questions <!-- id: design_system_arch_questions -->

| Question | Context | Options |
|----------|---------|---------|
| 知识库同步时机 | 文档变更如何触发同步？ | pre-commit hook / 手动 / Session Start 检查 |
| PRD 结构约束 | PRD 需要什么结构便于解析？ | YAML frontmatter / 独立 index 文件 |
| Sub Agent 模型 | intent-analyzer 用什么模型？ | haiku（快）/ sonnet（准）|
| 多意图处理 | 用户输入包含多个意图？ | 拆分 / 只处理第一个 / 拒绝 |

---

*Version: v1.0*
*Created: 2024-12-24*
*Status: Draft - Awaiting Review*
