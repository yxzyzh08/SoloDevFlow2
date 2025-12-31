---
type: feature
id: state-management
workMode: code
status: done
phase: done
priority: P0
domain: process
version: "16.0"
---

# Feature: State Management <!-- id: feat_state_management -->

> 项目状态的唯一真实来源，定义 state.json 的结构、校验规则、使用指南

---

## 1. Intent <!-- id: feat_state_management_intent -->

### 1.1 Problem

- 跨 Session 状态丢失，AI 每次对话需要重新了解项目状态
- 无法追踪 Feature 审批状态，不清楚哪些阶段已完成
- 手动维护状态容易出错，数据不一致
- 单任务跟踪限制，无法清晰表达并行处理的多个任务
- **AI 不清楚工具的可用命令和参数**，容易执行错误的命令（如 `create` 不存在）
- CLI 工具缺乏自文档化能力，AI 需要猜测命令语法

### 1.2 Value

- **单一状态源**：AI 每次对话可快速恢复上下文
- **阶段可追溯**：每个 Feature 的需求/设计/实现阶段状态清晰
- **自动化校验**：validate-state.js 脚本保证数据一致性
- **无冗余设计**：frontmatter 为唯一数据源，index.json 由程序派生
- **多任务并行**：activeWorkItems 支持同时跟踪多个活跃 Work Item
- **工具自描述**：AI 通过 `--schema` 获取所有命令定义，零猜测调用工具
- **文档永不过期**：工具输出的 schema 即是最新文档，自动同步

---

## 2. Scope <!-- id: feat_state_management_scope -->

### 2.1 In Scope

- state.json Schema 定义（结构、字段、枚举）
- 验证脚本（validate-state.js）
- 版本管理（semver）和迁移指南
- 使用规范（读取、更新、审批流程）

### 2.2 Out of Scope

- 状态同步到远程服务器
- 状态历史的独立存储（依赖 Git）
- 自动化状态迁移工具

---

## 3. Core Functions <!-- id: feat_state_management_functions -->

| ID | Function | 描述 |
|----|------------|------|
| C1 | Schema 定义 | 定义 state.json 的完整结构和字段类型 |
| C2 | 单一数据源 | frontmatter 为唯一数据源，index.json 由程序派生 |
| C3 | Work Mode | 支持 code（完整开发周期）和 document（简化周期）两种工作模式 |
| C4 | 版本管理 | semver 版本号，支持 Schema 演进和 Migration |
| C5 | 自动校验 | validate-state.js 脚本校验结构、枚举、引用完整性 |
| C6 | 多任务并行 | activeWorkItems 数组支持同时跟踪多个活跃 Work Item |
| C7 | 并发控制 | 文件锁机制防止多 Session 同时写入导致数据损坏 |
| C8 | **CLI 自文档化** | **通过 `--schema` 输出结构化 JSON，描述所有命令、参数、示例** |

---

## 4. Acceptance Criteria <!-- id: feat_state_management_acceptance -->

| Item | Verification | Pass Criteria |
|------|--------------|---------------|
| Schema 完整 | 检查文档 | 所有字段有定义、类型、说明 |
| 校验脚本 | `npm run validate:state` | 输出 "state.json is valid!" |
| 版本一致 | 对比 | 文档版本 = state.json schemaVersion |
| Work Mode | 检查 frontmatter | feature/capability/flow 有 workMode 字段 |
| 多任务支持 | 检查 state.json | activeWorkItems 为数组，支持多个 Work Item |
| 并发控制 | 检查 state.js | 写操作使用 acquireLock/releaseLock |
| **CLI Schema 输出** | **`node scripts/state.cjs --schema`** | **输出有效的 JSON，包含所有命令定义** |
| **Schema 完整性** | **检查 --schema 输出** | **包含：name, description, syntax, parameters, examples** |

---

## Dependencies <!-- id: feat_state_management_dependencies -->

| Dependency | Type | 说明 |
|------------|------|------|
| requirements-doc | hard | 状态管理需遵循 Feature Spec 结构定义 |

---

## 5. Design <!-- id: feat_state_management_design -->

### 5.1 Schema Version

当前版本：`14.0.0`

版本命名规则（semver）：
- MAJOR：结构性变更（字段增删、嵌套层级变化）
- MINOR：字段增加（向后兼容）
- PATCH：说明修正

**v14.0 术语统一变更**：
- `activeFeatures` 重命名为 `activeWorkItems`（更准确反映其可包含 Feature/Capability/Flow）
- `subtasks.{}.featureId` 重命名为 `subtasks.{}.workitemId`
- "Work Item" 作为 Feature/Capability/Flow 的统一术语
- CLI 命令更新：`activate-feature` → `activate`，`deactivate-feature` → `deactivate`
- 运行 `node scripts/state.cjs migrate-v14` 自动迁移

**v12.0 重大架构变更**：
- `features` 对象从 state.json 中**完全移除**
- Feature 状态（id, status, phase, priority, domain）存储在各文档的 **YAML frontmatter** 中
- `scripts/index.cjs` 扫描 docs/ 目录，提取 frontmatter，生成 `.solodevflow/index.json`
- 新增 `subtasks` 顶层字段，集中管理跨 Feature 的子任务

### 5.2 Work Mode（工作模式）

需求文档（Feature/Capability/Flow）通过 `workMode` 字段区分工作模式：

| workMode | 说明 | 主要产出物 | 工作流阶段 |
|----------|------|------------|------------|
| `code` | 代码型 | 代码 + 测试（可选设计文档） | pending → requirements → **review** → design → implementation → verification → done |
| `document` | 文档型 | Markdown 文档（可选辅助脚本） | not_started → in_progress → **review** → done |

**review 阶段说明**：
- **目的**：需求/文档完成后，必须经过人类审核才能进入下一阶段
- **触发**：AI 完成需求文档后自动进入 review
- **退出**：**人类显式批准**才能进入下一阶段（design 或 done）
- **核心原则**：文档是 Truth，需求的质量至关重要

**适用范围**：

| type | workMode | 说明 |
|------|----------|------|
| `prd` | ❌ 不需要 | 产品规划，无直接交付物 |
| `feature` | ✅ 必填 | 交付物可能是代码或文档 |
| `capability` | ✅ 必填 | 交付物可能是代码或文档 |
| `flow` | ✅ 必填 | 交付物可能是代码或文档 |
| `design` | ❌ 不需要 | 设计规划，服务于需求文档 |

**code 模式**：
- 主要产出是代码/应用程序
- 完整生命周期：需求 → **审核** → 设计 → 实现 → 验证
- 示例：
  - `state-management`（CLI 工具）
  - `document-validation`（验证脚本）

**document 模式**：
- 主要产出是文档内容
- 简化生命周期：起草 → **审核** → 完成
- 可包含辅助脚本，但脚本不是主要产出
- 示例：
  - `requirements-expert`（方法论文档）
  - `change-impact-tracking`（流程文档 + 辅助脚本 analyze-impact.js）

**判断标准**：
- 问：这个需求的**主要交付物**是什么？
- 代码/应用/工具 → `code`
- 文档/规范/流程 → `document`（即使有辅助脚本）

### 5.3 Top-Level Structure

```json
{
  "schemaVersion": "16.0.0",
  "project": { ... },
  "prd": { ... },
  "flow": { ... },
  "domains": { ... },
  "subtasks": [],
  "pendingDocs": [],
  "metadata": { ... },
  "lastUpdated": "2025-12-27T00:00:00Z"
}
```

**v14.0 架构设计**：
- `features` 已移除（v12.0），状态存储在文档 frontmatter 中
- `subtasks`：集中管理的子任务列表
- `domains`：只存储 domain 描述
- ~~`session`~~：v13.0 移除（设计过于理想化，实际未使用）

**Feature 状态获取**：
- 通过 `scripts/index.cjs` 扫描文档 frontmatter 生成 `.solodevflow/index.json`
- Hooks 和 CLI 读取 index.json 获取 Feature 信息

### 5.4 Field Definitions

#### schemaVersion (required)

| Field | Type | Description |
|-------|------|-------------|
| `schemaVersion` | string | Schema 版本号（semver 格式） |

#### project (required)

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | 项目名称 |
| `description` | string | 项目描述 |
| `type` | enum | 项目类型（见下方枚举） |
| `createdAt` | string | 创建时间（ISO 8601 日期或日期时间） |
| `updatedAt` | string | 更新时间（ISO 8601 日期或日期时间） |

**project.type 枚举**：
- `web-app` - Web 应用
- `cli-tool` - 命令行工具
- `backend` - 纯后端系统
- `library` - 库/SDK
- `api-service` - API 服务
- `mobile-app` - 移动应用

#### flow (required)

| Field | Type | Description |
|-------|------|-------------|
| `researchMethod` | enum | 需求调研方法（`top-down` / `bottom-up`） |
| `activeWorkItems` | string[] | 当前活跃的 Work Item 列表（支持并行任务） |

**v14.0 术语说明**：
- "Work Item" 是 Feature/Capability/Flow 的统一术语
- `activeWorkItems` 替代了 `activeFeatures`（v14.0 重命名）
- CLI 命令：`node scripts/state.cjs activate <id>` / `deactivate <id>`

**设计说明**：
- 支持多任务并行跟踪（可同时激活多个 Work Item）
- 数组顺序表示优先级（第一个是主要关注的 Work Item）
- 每个 Work Item 的阶段从其 frontmatter 的 `phase` 字段获取
- 每个 Work Item 的 Domain 从其 frontmatter 的 `domain` 字段获取

**使用示例**：
```json
{
  "activeWorkItems": [
    "state-management",        // type: feature
    "document-validation",     // type: capability
    "refactoring"              // type: flow
  ]
}
```

**历史字段演进**：
- v5.0：`currentFeature` → `activeFeatures`（支持多任务）
- v14.0：`activeFeatures` → `activeWorkItems`（术语统一）
- ~~`currentPhase`~~、~~`currentDomain`~~：v5.0 移除（冗余）

#### prd (v16.0 新增)

> PRD 层级生命周期管理，独立于 Work Item 层

| Field | Type | Description |
|-------|------|-------------|
| `phase` | enum | PRD 当前阶段（见下方枚举） |
| `scopeApprovedAt` | string | Scope 审核通过时间（ISO 8601，可选） |
| `decomposingStartedAt` | string | 进入分解阶段的时间（ISO 8601，可选） |
| `totalWorkItems` | number | Feature Roadmap 中的 Work Item 总数（可选） |
| `completedRequirements` | number | 已完成需求阶段的 Work Item 数量（可选） |

**prd.phase 枚举**：

| 值 | 说明 | 触发条件 |
|----|------|----------|
| `prd_draft` | PRD 初稿编写中 | 创建 PRD 时 |
| `prd_scope_review` | High-level scope 审核 | PRD 初稿完成后 |
| `prd_decomposing` | 需求分解阶段 | Scope 批准后，逐个调研 Feature/Capability/Flow |
| `prd_done` | PRD 关闭 | 所有 Work Items 需求阶段完成 |

**两层状态机设计**：
- **PRD 层**：管理产品整体 scope 和需求分解进度（`state.json → prd.phase`）
- **Work Item 层**：管理单个功能的完整生命周期（文档 frontmatter `phase`）

**使用示例**：
```json
{
  "prd": {
    "phase": "prd_decomposing",
    "scopeApprovedAt": "2025-01-01T00:00:00Z",
    "decomposingStartedAt": "2025-01-01T00:00:00Z",
    "totalWorkItems": 12,
    "completedRequirements": 5
  }
}
```

**CLI 命令**：
```bash
node scripts/state.cjs set-prd-phase <phase>     # 设置 PRD 阶段
node scripts/state.cjs get-prd-progress          # 获取 PRD 分解进度
```

**PRD 关闭条件**（详见 flow-workflows.md §10.5）：
- Feature Roadmap 中所有 Work Items 的 phase ≥ `feature_design`
- 人类显式确认 PRD 完整性

#### Document Metadata（存储在文档 frontmatter）

> v12.0 起，文档状态存储在各文档的 YAML frontmatter 中，而非 state.json。

**frontmatter 结构**：

```yaml
---
type: feature          # 文档类型：feature | capability | flow | design | prd
id: state-management   # 唯一标识符
workMode: code         # 工作模式（feature/capability/flow 必填）：code | document
status: in_progress    # 状态：not_started | in_progress | done
phase: implementation  # 开发阶段（仅 workMode: code 使用）
priority: P0           # 优先级（可选）：P0 | P1 | P2
domain: process        # 所属 Domain（可选）
version: "12.1"        # 文档版本
---
```

**workMode 枚举**（feature/capability/flow 必填）：

| 值 | 说明 | phase 字段 |
|----|------|------------|
| `code` | 主要产出是代码 | 可选，用于追踪开发阶段 |
| `document` | 主要产出是文档 | 不使用 |

**phase 枚举**（仅 workMode: code 使用）：

`pending` → `feature_requirements` → `feature_review` → `feature_design` → `feature_implementation` → `feature_verification` → `done`

> **feature_review**：需求文档完成后的人类审核阶段，必须人类显式批准才能进入 feature_design

**status 枚举**：`not_started` | `in_progress` | `done`

**index.json 生成**：

`scripts/index.cjs` 扫描 docs/ 目录，提取 frontmatter，生成 `.solodevflow/index.json`：

```json
{
  "generated": "2025-12-27T00:00:00Z",
  "summary": { "total": 16, "done": 5, "in_progress": 3, "not_started": 8 },
  "activeWorkItems": ["state-management"],
  "documents": [
    { "id": "state-management", "type": "feature", "status": "in_progress", "phase": "implementation", ... }
  ]
}
```

#### subtasks (required, v12.0 新增)

集中管理的任务列表，用于跟踪**所有正在进行和待完成的工作**。

> **核心用途**：记录 AI 当前正在做什么，确保任务切换或上下文丢失时不会遗忘工作进度。

```json
{
  "subtasks": [
    {
      "id": "st_1703145600000_001",
      "workitemId": "workflows",
      "description": "完善 flow-workflows.md §11 State Update Protocol",
      "status": "in_progress",
      "source": "ai",
      "createdAt": "2025-12-27T12:00:00.000Z"
    },
    {
      "id": "st_1703145600000_002",
      "workitemId": "change-impact-tracking",
      "description": "检查 feature.spec.md 模板是否需要更新",
      "target": "docs/templates/backend/feature.spec.md",
      "status": "pending",
      "source": "impact-analysis",
      "createdAt": "2025-12-27T12:00:00.000Z"
    }
  ]
}
```

**subtask 字段定义**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 唯一标识，格式 `st_{timestamp}_{index}` |
| `workitemId` | string | 是 | 关联的 Work Item ID (v14.0 从 featureId 重命名) |
| `description` | string | 是 | 任务描述（应包含足够上下文便于恢复） |
| `target` | string | 否 | 目标文件路径或锚点 |
| `status` | enum | 是 | 任务状态（见下表） |
| `source` | enum | 是 | 来源类型（见下表） |
| `createdAt` | string | 是 | ISO 8601 时间戳 |

**status 枚举**：

| 值 | 说明 | 使用场景 |
|----|------|----------|
| `pending` | 待处理 | 任务已创建，等待开始 |
| `in_progress` | **正在进行** | AI 当前正在处理的工作 |
| `completed` | 已完成 | 任务完成 |
| `skipped` | 已跳过 | 任务不再需要 |

**source 枚举**：

| 值 | 说明 | 触发场景 |
|----|------|----------|
| `impact-analysis` | 影响分析产生 | 规范变更时自动生成 |
| `user` | 用户手动添加 | 用户明确指示 |
| `ai` | AI 主动添加 | AI 开始处理新工作时 |
| `interrupted` | 被打断的任务 | 用户切换任务时，保留未完成的工作 |

**使用规则**：

| 时机 | 操作 | 命令 |
|------|------|------|
| 开始新任务 | 创建 subtask，状态 `in_progress` | `add-subtask --status=in_progress` |
| 完成任务 | 标记为 `completed` | `complete-subtask <id>` |
| 被打断/切换 | 保持 `in_progress`，不删除 | 无需操作 |
| Session 启动 | 检查 `in_progress` 的 subtasks | SessionStart Hook 自动提示 |

**并发支持**：
- 多个 subtasks 可以同时处于 `in_progress` 状态
- 支持多 Session 并行处理不同 Work Item 的任务
- 每个 subtask 通过 `workitemId` 区分所属 Work Item

**设计说明**：
- subtasks 集中存储在 state.json 顶层，便于跨 Feature 查看和操作
- `in_progress` 状态的 subtask 表示"当前正在进行的工作"
- 任务完成前不要删除，确保进度可追溯
- 定期清理已完成（`completed`）的 subtasks

#### domains (required)

**Domain 描述**：只存储每个 domain 的描述信息，树形视图由程序派生。

| Field | Type | Description |
|-------|------|-------------|
| `{domain}` | string | Domain 描述 |

**示例**：
```json
{
  "domains": {
    "specification": "规范文档（元规范/需求/设计/开发/测试）",
    "process": "协作流程（状态/输入/影响追踪）",
    "ai-config": "AI 协作配置（CLAUDE.md/命令/技能）"
  }
}
```

**树形视图派生**（程序实现，从 index.json 读取）：
```javascript
function buildDomainTree(state, index) {
  const tree = {};
  for (const doc of index.documents) {
    if (!doc.domain) continue;
    if (!tree[doc.domain]) {
      tree[doc.domain] = {
        description: state.domains[doc.domain] || '',
        documents: []
      };
    }
    tree[doc.domain].documents.push({
      id: doc.id,
      type: doc.type,
      workMode: doc.workMode,
      status: doc.status
    });
  }
  return tree;
}
```

#### pendingDocs / metadata / lastUpdated

| Field | Type | Description |
|-------|------|-------------|
| `pendingDocs` | array | 文档债务数组（Commit 前必须清空） |
| `metadata.stateFileVersion` | number | state.json 文件版本号（自增） |
| `metadata.totalStateChanges` | number | 总状态变更次数 |
| `metadata.lastGitCommit` | string\|null | 最后 Git commit SHA |
| `lastUpdated` | string | 最后更新时间（ISO 8601） |

**pendingDocs 格式**：

```json
{
  "pendingDocs": [
    {
      "id": "pd_1703123456789_001",
      "type": "design",
      "target": "docs/designs/des-xxx.md",
      "description": "需补充接口设计章节",
      "reason": "实现时发现需要新增 API",
      "createdAt": "2025-12-23T10:00:00Z"
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | 唯一标识（`pd_{timestamp}_{seq}`） |
| `type` | string | 文档类型：`design` / `feature` / `prd` |
| `target` | string | 目标文档路径 |
| `description` | string | 待补充的内容描述 |
| `reason` | string | 产生债务的原因 |
| `createdAt` | string | 创建时间（ISO 8601） |

**规则**：
- Commit 前必须清空 pendingDocs 数组
- 不允许跨 Commit 累积文档债务

### 5.5 Validation Rules

**Required Fields（state.json）**：
- `schemaVersion`、`project.name`、`project.type`、`project.createdAt`
- `flow.researchMethod`、`flow.activeWorkItems`
- `domains`、`subtasks`、`pendingDocs`
- `metadata.stateFileVersion`、`lastUpdated`

**Reference Integrity**：
- `flow.activeWorkItems` 中的每个 Work Item ID 必须在 index.json 中存在
- `subtasks.{}.workitemId` 必须在 index.json 中存在

**Subtasks Validation**：
- `subtasks` 必须是数组
- 每个 subtask 必须有 `id`、`workitemId`、`description`、`status`、`source`、`createdAt` 字段
- `subtasks.{}.status` 必须是 `pending` / `in_progress` / `completed` / `skipped` 之一

**Frontmatter Validation（文档）**：
- 所有需求/设计文档必须有 `type`、`id`、`status` 字段
- `type` 必须是 `prd` / `feature` / `capability` / `flow` / `design` 之一
- `status` 必须是 `not_started` / `in_progress` / `done` 之一
- `priority` 如存在，必须是 `P0` / `P1` / `P2` 之一
- `domain` 如存在，必须在 state.json 的 `domains` 中定义

**workMode Validation（v12.1 新增）**：
- `type` 为 `feature` / `capability` / `flow` 时，`workMode` 必填
- `workMode` 必须是 `code` / `document` 之一
- `type` 为 `prd` / `design` 时，`workMode` 应不存在
- `workMode: code` 时，`phase` 如存在，必须是有效阶段枚举
- `workMode: document` 时，`phase` 应不存在

### 5.6 Concurrency Control

state.json 使用文件锁机制防止多 Session 同时写入导致数据损坏。

#### 锁机制

| 配置项 | 值 | 说明 |
|--------|-----|------|
| 锁文件 | `.solodevflow/state.lock` | 存储持有锁的进程 PID |
| 超时时间 | 5000ms | 等待锁的最大时间 / 锁自动过期时间 |

#### 工作流程

```
Session A 写入:
1. acquireLock() - 检查锁文件是否存在
   - 不存在 → 创建锁文件，写入 PID
   - 存在 → 检查是否过期（>5秒自动释放）
   - 未过期 → 忙等待，超时则 exit(1)
2. 执行写操作
3. releaseLock() - 删除锁文件
```

#### 多 Session 场景

| 场景 | 行为 | 结果 |
|------|------|------|
| Session A 写入中，Session B 尝试写入 | B 等待最多 5 秒 | B 等待 A 完成后执行 |
| Session A 崩溃未释放锁 | 锁文件超过 5 秒自动过期 | B 可以获取锁 |
| 高频并发写入 | 忙等待（busy-wait） | 可能消耗 CPU |

#### 适用范围

- **锁保护的操作**：所有通过 `state.js` CLI 执行的写操作
- **无需锁保护**：只读操作（summary、list-active、get-session 等）
- **不受保护**：直接编辑 state.json 文件（应通过 CLI 操作）

#### 设计权衡

当前实现为**简化方案**，适用于 SoloDevFlow 的使用场景（单人 + AI，偶尔 2 个 Session）：

| 方面 | 当前实现 | 高级方案（未采用） |
|------|----------|-------------------|
| 锁类型 | 文件锁（简单） | 进程间锁 / 数据库锁 |
| 等待策略 | 忙等待 | 事件驱动 / 回退重试 |
| 竞态窗口 | 存在（检查与创建之间） | 原子操作 |
| 复杂度 | 低 | 高 |

**结论**：对于低并发的本地工具场景，当前实现已足够。

### 5.7 CLI Self-Documentation

#### 设计目标

为 state.js 添加 `--schema` 命令，输出结构化 JSON 描述所有命令，使 AI Agent 能够：
- 无需猜测即可正确调用命令
- 自动发现新增/修改的命令
- 获取参数类型、枚举值、示例

#### Schema 输出格式

```json
{
  "name": "state-manager",
  "version": "15.0.0",
  "commands": [
    {
      "name": "activate",
      "category": "Work Item Activation",
      "description": "激活工作项（Feature/Capability/Flow），添加到 activeWorkItems 列表",
      "syntax": "activate <id>",
      "parameters": [
        {
          "name": "id",
          "type": "string",
          "required": true,
          "description": "工作项 ID，必须在 index.json 中存在"
        }
      ],
      "examples": [
        "node scripts/state.cjs activate fea-auth",
        "node scripts/state.cjs activate cap-user-management"
      ]
    },
    {
      "name": "set-phase",
      "category": "Work Item Activation",
      "description": "设置工作项的开发阶段",
      "syntax": "set-phase <id> <phase>",
      "parameters": [
        {
          "name": "id",
          "type": "string",
          "required": true,
          "description": "工作项 ID"
        },
        {
          "name": "phase",
          "type": "enum",
          "required": true,
          "description": "开发阶段",
          "values": [
            "pending",
            "feature_requirements",
            "feature_review",
            "feature_design",
            "feature_implementation",
            "feature_testing",
            "done"
          ]
        }
      ],
      "examples": [
        "node scripts/state.cjs set-phase fea-auth feature_requirements"
      ]
    },
    {
      "name": "add-subtask",
      "category": "Subtask",
      "description": "添加子任务到指定工作项",
      "syntax": "add-subtask --workitem=<id> --desc=\"description\" [--source=ai|impact-analysis|user|interrupted] [--status=pending|in_progress]",
      "parameters": [
        {
          "name": "workitem",
          "type": "string",
          "required": true,
          "description": "工作项 ID",
          "format": "--workitem=<value>"
        },
        {
          "name": "desc",
          "type": "string",
          "required": true,
          "description": "任务描述",
          "format": "--desc=\"<value>\""
        },
        {
          "name": "source",
          "type": "enum",
          "required": false,
          "description": "任务来源",
          "values": ["ai", "impact-analysis", "user", "interrupted"],
          "default": "ai",
          "format": "--source=<value>"
        },
        {
          "name": "status",
          "type": "enum",
          "required": false,
          "description": "任务状态",
          "values": ["pending", "in_progress"],
          "default": "pending",
          "format": "--status=<value>"
        }
      ],
      "examples": [
        "node scripts/state.cjs add-subtask --workitem=fea-auth --desc=\"实现登录接口\" --source=ai --status=in_progress"
      ]
    }
  ],
  "commonErrors": [
    {
      "error": "Unknown: create",
      "reason": "state.js 没有 create 命令",
      "solution": "使用 activate <id> 激活工作项，工作项需先在文档中创建"
    }
  ]
}
```

#### Schema 字段定义

**顶层字段**：
| 字段 | 类型 | 说明 |
|------|------|------|
| `name` | string | 工具名称 |
| `version` | string | 工具版本（与 state.js 版本一致） |
| `commands` | array | 所有命令定义 |
| `commonErrors` | array | 常见错误和解决方案 |

**Command 字段**：
| 字段 | 类型 | 说明 |
|------|------|------|
| `name` | string | 命令名称 |
| `category` | string | 命令分类（如 "Query", "Work Item Activation"） |
| `description` | string | 命令描述 |
| `syntax` | string | 完整语法（包含必选/可选参数） |
| `parameters` | array | 参数定义 |
| `examples` | array | 使用示例（至少 1 个） |

**Parameter 字段**：
| 字段 | 类型 | 说明 |
|------|------|------|
| `name` | string | 参数名 |
| `type` | string | 类型：string / enum / number |
| `required` | boolean | 是否必填 |
| `description` | string | 参数说明 |
| `format` | string | 参数格式（如 `--name=<value>`） |
| `values` | array | 枚举值（仅 type=enum） |
| `default` | any | 默认值（可选） |

#### 实现要求

1. **命令完整性**：`--schema` 必须包含 `--help` 中的所有命令
2. **参数准确性**：枚举值必须与代码实现一致
3. **示例可执行**：examples 中的命令必须可直接复制执行
4. **错误预防**：在 `commonErrors` 中记录常见误用（如本次的 `create` 错误）
5. **版本同步**：schema 输出的 version 必须与 state.js 文件版本一致

#### AI 集成方式

**方式 1：SessionStart Hook 注入**（推荐）
```bash
# .claude/hooks/session-start.sh
node scripts/state.cjs --schema > /tmp/state-schema.json
echo "<tool-schema>"
cat /tmp/state-schema.json
echo "</tool-schema>"
```

**方式 2：CLAUDE.md 静态文档**（备选）
- 在 CLAUDE.md 或 workflows.md 中嵌入 schema
- 缺点：需要手动维护同步

**方式 3：未来 MCP 标准**（长期）
- 发布为 MCP 服务器
- AI 自动发现和调用

### 5.8 Migration History

| 版本 | 主要变更 |
|------|----------|
| v4.0 | 基础结构（features 扁平化 + approvals） |
| v4.1 | Feature 类型（code/document） |
| v4.2 | 双视图设计（domainTree） |
| v4.3 | 删除冗余 domains，添加 docPath |
| v4.4 | 删除 stateHistory，依赖 Git 追溯 |
| v4.5 | 新增 features.{}.description 可选字段 |
| v5.0 | 重构 flow：currentFeature → activeFeatures（支持多任务并行），移除冗余字段 |
| v6.0 | 移除 approvals（phase+status 足够），新增 scripts 可选字段 |
| v7.0 | 新增 subtasks 可选字段（影响分析子任务跟踪） |
| v8.0 | 移除 domainTree（冗余），新增 domains（只存描述），树形视图由程序派生 |
| v9.0 | 新增 designDepth 和 artifacts 字段（code 类型产物追踪，支持代码文件级别影响分析） |
| v10.0 | 简化 designDepth 为 2 级（none/required），移除 L0-L3 |
| v11.0 | 新增 session 字段（会话状态：mode + context + pendingRequirements） |
| v12.0 | **重大重构**：移除 features 对象，状态迁移到文档 frontmatter。新增 index.json 由 scripts/index.cjs 自动生成 |
| v12.1 | 新增 `workMode` 字段（code/document），明确需求文档的工作模式 |
| v12.2 | 新增 `pendingDocs` CLI 命令；补充并发控制（文件锁）文档 |
| v12.3 | 新增 `feature_review` 阶段，需求完成后必须人类审核才能进入设计 |
| v13.0 | **移除 session 结构**：session.mode/context/pendingRequirements 设计过于理想化，实际从未使用 |
| v14.0 | **术语统一**：`activeFeatures` → `activeWorkItems`，`featureId` → `workitemId`。"Work Item" 作为 Feature/Capability/Flow 的统一术语。CLI 命令简化：`activate-feature` → `activate`，`deactivate-feature` → `deactivate` |
| v15.0 | **CLI 自文档化**：新增 `--schema` 命令，输出结构化 JSON 描述所有命令、参数、枚举值和示例，解决 AI 调用工具时的命令猜测问题 |
| v16.0 | **PRD 层生命周期**：新增 `prd` 顶层字段（phase/scopeApprovedAt/decomposingStartedAt/totalWorkItems/completedRequirements），实现两层状态机设计（PRD 层 + Work Item 层），修复 PRD 完成后直接进入设计阶段的流程缺陷 |

**Schema 升级**：
- v16.0: 新增 `prd` 字段，需手动添加到 state.json
- v14.0: 运行 `node scripts/state.cjs migrate-v14` 自动迁移
- 其他版本：由 AI 直接编辑 state.json 执行

**v12.0.0 架构变更**：
- `features` 对象从 state.json 中完全移除
- Feature 状态（id, status, phase）存储在各文档的 YAML frontmatter 中
- `scripts/index.cjs` 扫描 docs/ 目录，提取 frontmatter，生成 `.solodevflow/index.json`
- Hooks 通过读取 index.json 获取 feature 信息

**v12.1.0 变更**：
- 新增 `workMode` 字段（code/document）区分工作模式
- feature/capability/flow 文档必须声明 workMode
- prd/design 文档不使用 workMode

---

## 6. Implementation Notes <!-- id: feat_state_management_impl -->

### 6.1 Related Files

| 文件 | 用途 |
|------|------|
| `.solodevflow/state.json` | 运行时状态（session、subtasks、pendingDocs） |
| `.solodevflow/index.json` | Feature 索引（由 index.js 生成） |
| `scripts/state.cjs` | 状态 CLI（查询/更新接口） |
| `scripts/index.cjs` | 索引生成脚本（扫描 frontmatter） |
| `scripts/validate-state.cjs` | Schema 校验脚本 |
| `scripts/status.cjs` | 状态摘要脚本 |

### 6.2 Usage

**v15.0 CLI 命令**：

```bash
# === 工具自描述 (v15.0 新增) ===
node scripts/state.cjs --schema               # 输出所有命令的 JSON Schema

# === 查询操作 ===
node scripts/state.cjs summary              # 状态摘要（JSON 格式）
node scripts/state.cjs list-active          # 列出活跃 Work Items

# === Work Item 激活操作 (v14.0 更新) ===
node scripts/state.cjs activate <id>        # 激活 Work Item（添加到 activeWorkItems）
node scripts/state.cjs deactivate <id>      # 停用 Work Item（从 activeWorkItems 移除）
node scripts/state.cjs set-phase <id> <phase>  # 设置 Work Item 阶段

# === Subtask 操作 (v14.0 使用 workitem 代替 feature) ===
node scripts/state.cjs add-subtask --workitem=<id> --desc="描述" --source=ai
node scripts/state.cjs list-subtasks             # 列出所有子任务
node scripts/state.cjs list-subtasks --workitem=<id>  # 列出指定 Work Item 的子任务
node scripts/state.cjs complete-subtask <subtaskId>
node scripts/state.cjs skip-subtask <subtaskId>

# === Pending Docs 操作 ===
node scripts/state.cjs add-pending-doc --type=<design|feature|prd> --target="path" --desc="描述" [--reason="原因"]
node scripts/state.cjs list-pending-docs        # 列出文档债务
node scripts/state.cjs clear-pending-docs       # 清空文档债务（处理完成后）

# === 索引 & 迁移操作 ===
node scripts/index.cjs                      # 重新生成 index.json
node scripts/state.cjs migrate-v14          # 从 v13 迁移到 v14
```

**Feature 状态更新**：

v12.0 起，Feature 状态存储在文档 frontmatter 中，直接编辑文档即可：

```yaml
---
type: feature
id: state-management
status: done          # 修改这里
phase: done           # 修改这里
---
```

然后运行 `node scripts/index.cjs` 更新索引。

**运行校验**：
```bash
npm run validate:state   # 校验 state.json
npm run validate:docs    # 校验文档格式
```

---

## Appendix: Complete Example <!-- id: feat_state_management_example -->

### state.json (v14.0)

```json
{
  "schemaVersion": "14.0.0",
  "project": {
    "name": "SoloDevFlow 2.0",
    "description": "为超级个体打造的自进化人机协作开发系统",
    "type": "backend",
    "createdAt": "2024-12-16",
    "updatedAt": "2025-12-27"
  },
  "flow": {
    "researchMethod": "bottom-up",
    "activeWorkItems": ["state-management"]
  },
  "domains": {
    "specification": "规范文档（元规范/需求/设计/开发/测试）",
    "process": "协作流程（状态/输入/影响追踪）",
    "tooling": "独立工具（项目初始化/分发安装）",
    "ai-config": "AI 协作配置（CLAUDE.md/命令/技能）"
  },
  "subtasks": [
    {
      "id": "st_1703145600000_001",
      "workitemId": "change-impact-tracking",
      "description": "检查 feature.spec.md 模板是否需要更新",
      "target": "docs/templates/backend/feature.spec.md",
      "status": "pending",
      "source": "impact-analysis",
      "createdAt": "2025-12-27T12:00:00.000Z"
    }
  ],
  "pendingDocs": [],
  "metadata": {
    "lastGitCommit": "",
    "lastGitCommitMessage": "",
    "lastGitCommitAt": "",
    "stateFileVersion": 21,
    "totalStateChanges": 21
  },
  "lastUpdated": "2025-12-27T00:00:00Z"
}
```

### 文档 frontmatter 示例

```yaml
---
type: feature
id: state-management
workMode: code
status: in_progress
phase: feature_implementation
priority: P0
domain: process
version: "12.1"
---

# Feature: State Management
...
```

### index.json（由 scripts/index.cjs 生成）

```json
{
  "generated": "2025-12-27T00:00:00Z",
  "summary": { "total": 16, "done": 5, "in_progress": 3, "not_started": 8 },
  "activeWorkItems": ["state-management"],
  "documents": [
    {
      "id": "state-management",
      "type": "feature",
      "title": "State Management",
      "workMode": "code",
      "status": "in_progress",
      "phase": "feature_implementation",
      "priority": "P0",
      "domain": "process",
      "path": "docs/requirements/features/fea-state-management.md"
    }
  ]
}
```

---

*Version: v16.0*
*Created: 2024-12-20*
*Updated: 2025-12-30*
*Changes: v16.0 新增 PRD 层生命周期管理（prd 字段），实现两层状态机设计，修复 PRD 完成后直接进入设计阶段的流程缺陷*
*Applies to: SoloDevFlow 2.0*
