---
type: feature
version: "10.0"
priority: P0
domain: process
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

### 1.2 Value

- **单一状态源**：AI 每次对话可快速恢复上下文
- **审批可追溯**：每个 Feature 的需求/设计/实现审批状态清晰
- **自动化校验**：validate-state.js 脚本保证数据一致性
- **无冗余设计**：features 为唯一数据源，树形视图由程序派生
- **多任务并行**：activeFeatures 支持同时跟踪多个活跃任务

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

## 3. Core Capabilities <!-- id: feat_state_management_capabilities -->

| ID | Capability | 描述 |
|----|------------|------|
| C1 | Schema 定义 | 定义 state.json 的完整结构和字段类型 |
| C2 | 单一数据源 | features 为唯一数据源，domains 只存描述，树形视图由程序派生 |
| C3 | Feature 类型 | 支持 code（3 阶段审批）和 document（1 阶段审批）|
| C4 | 版本管理 | semver 版本号，支持 Schema 演进和 Migration |
| C5 | 自动校验 | validate-state.js 脚本校验结构、枚举、引用完整性 |
| C6 | 多任务并行 | activeFeatures 数组支持同时跟踪多个活跃任务 |

---

## 4. Acceptance Criteria <!-- id: feat_state_management_acceptance -->

| Item | Verification | Pass Criteria |
|------|--------------|---------------|
| Schema 完整 | 检查文档 | 所有字段有定义、类型、说明 |
| 校验脚本 | `npm run validate` | 输出 "state.json is valid!" |
| 版本一致 | 对比 | 文档版本 = state.json schemaVersion |
| Feature 类型 | 检查 state.json | code/document 类型有对应审批结构 |
| 多任务支持 | 检查 state.json | activeFeatures 为数组，支持多个 Feature |

---

## Dependencies <!-- id: feat_state_management_dependencies -->

| Dependency | Type | 说明 |
|------------|------|------|
| requirements-doc | hard | 状态管理需遵循 Feature Spec 结构定义 |

---

## 5. Design <!-- id: feat_state_management_design -->

### 5.1 Schema Version

当前版本：`11.0.0`

版本命名规则（semver）：
- MAJOR：结构性变更（字段增删、嵌套层级变化）
- MINOR：字段增加（向后兼容）
- PATCH：说明修正

### 5.2 Feature Types

Feature 分为两种类型，工作流不同：

| 类型 | 说明 | 产出物 | 工作流阶段 |
|------|------|--------|------------|
| `code` | 代码型 | 代码 + 测试 + 设计文档（通过 `artifacts` 字段追踪） | pending → requirements → design → implementation → verification → done |
| `document` | 文档型 | Markdown 文档（可选脚本，通过 `scripts` 字段追踪） | pending → drafting → done |

**code 类型**：
- 完整生命周期：需求 → 设计 → 实现 → 验证
- 有代码、测试、设计文档（根据 `designDepth` 决定是否需要设计文档）
- 示例：
  - 需要设计：prd-validator（designDepth: required）
  - 无需设计：state-management（designDepth: none，简单 CLI 工具）

**document 类型**：
- 简化生命周期：起草 → 完成
- Markdown 内容，可选包含辅助脚本（通过 `scripts` 字段记录）
- 示例：
  - 纯文档：requirements-doc、requirements-expert
  - 文档+脚本：change-impact-tracking（含 analyze-impact.js）

### 5.3 Top-Level Structure

```json
{
  "schemaVersion": "11.0.0",
  "project": { ... },
  "flow": { ... },
  "session": { ... },
  "features": { ... },
  "domains": { ... },
  "sparks": [],
  "pendingDocs": [],
  "metadata": { ... },
  "lastUpdated": "2024-12-20T22:00:00Z"
}
```

**单一数据源设计**（v8.0）：
- `features`：扁平结构，唯一数据源，包含完整数据
- `domains`：只存储 domain 描述，树形视图由程序从 `features.{}.domain` 派生

**会话状态**（v11.0）：
- `session`：跨对话保持的临时状态，支持咨询/需求混合场景

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
| `activeFeatures` | string[] | 当前活跃的 Feature 列表（支持并行任务） |

**设计说明**：
- `activeFeatures` 支持多任务并行跟踪
- 数组顺序表示优先级（第一个是主要关注的 Feature）
- 每个 Feature 的阶段从 `features.{}.phase` 获取，无需全局 `currentPhase`
- 每个 Feature 的 Domain 从 `features.{}.domain` 获取，无需全局 `currentDomain`

**v5.0 移除的字段**（冗余）：
- ~~`currentPhase`~~：每个 Feature 已有 `phase` 字段
- ~~`currentFeature`~~：改为 `activeFeatures` 数组
- ~~`currentDomain`~~：可从 `features[name].domain` 派生

#### session (required, v11.0 新增)

跨对话保持的会话状态，支持咨询/需求混合场景。

| Field | Type | Description |
|-------|------|-------------|
| `mode` | enum | 当前会话模式 |
| `context` | object | 会话上下文 |

**session.mode 枚举**：

| 值 | 说明 | 进入条件 | 退出条件 |
|----|------|----------|----------|
| `idle` | 空闲 | Session 开始 / 任务完成 | 接收到输入 |
| `consulting` | 咨询中 | 纯咨询或咨询+需求 | 隐式/显式结束 |
| `delivering` | 需求交付中 | 纯需求 / 处理临时需求 | 交付完成 |

**session.context 字段**：

| Field | Type | Description |
|-------|------|-------------|
| `topic` | string\|null | 当前咨询/交付主题 |
| `relatedFeatures` | string[] | 关联的 Feature 列表 |
| `pendingRequirements` | array | 暂存的临时需求（咨询中提取） |

**session.context.pendingRequirements 元素格式**：

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | 唯一标识（`pr_{timestamp}_{seq}`） |
| `content` | string | 需求内容描述 |
| `extractedAt` | string | 提取时间（ISO 8601） |
| `source` | string | 来源输入的摘要 |

**示例**：
```json
{
  "session": {
    "mode": "consulting",
    "context": {
      "topic": "登录功能实现方式",
      "relatedFeatures": ["user-auth"],
      "pendingRequirements": [
        {
          "id": "pr_1703123456789_001",
          "content": "添加记住密码功能",
          "extractedAt": "2025-12-25T10:00:00Z",
          "source": "用户说：顺便加个记住密码"
        }
      ]
    }
  }
}
```

**设计说明**：
- `pendingRequirements` 在咨询过程中由 AI 提取并暂存
- 咨询结束后提示用户处理暂存需求
- `pendingCount` 不存储，由 `pendingRequirements.length` 计算得出

#### features (required)

Feature 扁平化存储，key 为 Feature 名称。

| Field | Type | Description |
|-------|------|-------------|
| `type` | enum | Feature 类型（`code` 或 `document`） |
| `description` | string | （可选）Feature 简要描述 |
| `domain` | string\|null | 所属 Domain（null 表示独立 Feature） |
| `docPath` | string\|null | 文档路径（直接定位 Feature 相关文档） |
| `scripts` | string[] | （可选）脚本产物路径数组（仅 document 类型） |
| `designDepth` | enum | （code 类型必填）设计深度：`none` / `required` |
| `artifacts` | object | （code 类型必填）产物路径，用于影响分析和变更追踪 |
| `subtasks` | array | （可选）子任务数组，用于跟踪细粒度工作项 |
| `phase` | enum | Feature 阶段（根据类型不同） |
| `status` | enum | Feature 状态 |

**features.{}.phase 枚举**：

code 类型：`pending` → `feature_requirements` → `feature_design` → `feature_implementation` → `feature_verification` → `done`

document 类型：`pending` → `drafting` → `done`

**features.{}.status 枚举**：`not_started` | `in_progress` | `blocked` | `completed`

**features.{}.scripts 说明**：

用于记录 document 类型 Feature 的脚本产物：
```json
"state-management": {
  "type": "document",
  "scripts": ["scripts/validate-state.js", "scripts/migrate-state.js"],
  ...
}
```

**features.{}.designDepth 说明**（v9.0 新增，v10.0 简化）：

用于 code 类型 Feature，表示是否需要设计文档：

| 级别 | 条件 | Design Doc |
|------|------|------------|
| `none` | 简单、边界清晰、无架构决策 | 不需要 |
| `required` | 需要架构决策、涉及多模块 | 需要（深度由设计规范指导） |

**features.{}.artifacts 说明**（v9.0 新增）：

用于 code 类型 Feature，记录产物文件路径，支持影响分析和变更追踪：

```json
"prd-validator": {
  "type": "code",
  "designDepth": "required",
  "artifacts": {
    "design": "docs/_features/prd-validator.design.md",
    "code": ["src/validators/prd-validator.js"],
    "tests": ["tests/e2e/prd-validator.test.ts"]
  },
  ...
}
```

**artifacts 字段定义**：

| 字段 | 类型 | 必填条件 | 说明 |
|------|------|----------|------|
| `design` | string\|null | required 时必填 | 设计文档路径 |
| `code` | string[] | 必填 | 代码文件/目录路径数组 |
| `tests` | string[] | 必填 | 测试文件路径数组 |

**校验规则**：
- `designDepth: none` → `artifacts.design` 可为 null
- `designDepth: required` → `artifacts.design` 必须有值
- `artifacts.code` 和 `artifacts.tests` 不能为空数组

**features.{}.subtasks 说明**（v7.0 新增）：

用于跟踪 Feature 内的细粒度工作项，支持影响分析生成的子任务：
```json
"change-impact-tracking": {
  "type": "document",
  "subtasks": [
    {
      "id": "st_1703145600000_001",
      "description": "检查 feature.spec.md 模板是否需要更新",
      "target": "docs/templates/backend/feature.spec.md",
      "status": "pending",
      "createdAt": "2024-12-21T12:00:00.000Z",
      "source": "impact-analysis"
    }
  ],
  ...
}
```

**subtask 字段定义**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 唯一标识，格式 `st_{timestamp}_{index}` |
| `description` | string | 是 | 任务描述 |
| `target` | string | 否 | 目标文件路径或锚点 |
| `status` | enum | 是 | `pending` / `in_progress` / `completed` / `skipped` |
| `createdAt` | string | 是 | ISO 8601 时间戳 |
| `source` | string | 是 | 来源：`impact-analysis` / `user` / `ai` |

**v6.0 移除的字段**：
- ~~`approvals`~~：`phase: done` + `status: completed` 已足够表达完成状态

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
    "process": "协作流程（状态/输入/灵光/影响追踪）",
    "ai-config": "AI 协作配置（CLAUDE.md/命令/技能）"
  }
}
```

**树形视图派生**（程序实现）：
```javascript
function buildDomainTree(state) {
  const tree = {};
  for (const [name, feature] of Object.entries(state.features)) {
    const domain = feature.domain;
    if (!tree[domain]) {
      tree[domain] = {
        description: state.domains[domain] || '',
        features: {}
      };
    }
    tree[domain].features[name] = {
      type: feature.type,
      phase: feature.phase,
      status: feature.status
    };
  }
  return tree;
}
```

#### sparks / pendingDocs / metadata / lastUpdated

| Field | Type | Description |
|-------|------|-------------|
| `sparks` | array | 灵光数组，从 `.flow/spark-box.md` 同步 |
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

**Required Fields**：
- `schemaVersion`、`project.name`、`project.type`、`project.createdAt`
- `flow.researchMethod`、`flow.activeFeatures`
- `session.mode`、`session.context`
- `features`、`domains`、`sparks`、`pendingDocs`
- `metadata.stateFileVersion`、`lastUpdated`

**Reference Integrity**：
- `features.{}.domain` 如果不为 null，必须在 `domains` 中存在
- `flow.activeFeatures` 中的每个 Feature 必须在 `features` 中存在

**State Consistency**：
- 当 `features.{}.phase` 为 `done` 时，`status` 应为 `completed`
- `flow.activeFeatures` 中的 Feature 的 `status` 应为 `in_progress` 或 `blocked`（警告级别）
- `features.{}.scripts` 如存在，每个路径对应的文件应存在（警告级别）

**Session Validation**（v11.0 新增）：
- `session.mode` 必须是 `idle` / `consulting` / `delivering` 之一
- `session.context.relatedFeatures` 中的每个 Feature 必须在 `features` 中存在
- `session.context.pendingRequirements` 中的每个元素必须有 `id`、`content`、`extractedAt` 字段

**Artifacts Validation**（v9.0 新增，v10.0 简化）：
- `type: code` 的 Feature 必须有 `designDepth` 和 `artifacts` 字段
- `designDepth` 必须是 `none` / `required` 之一
- `designDepth: required` 时，`artifacts.design` 不能为 null
- `artifacts.code` 和 `artifacts.tests` 必须是非空数组
- `artifacts` 中的路径对应的文件应存在（警告级别）

### 5.6 Migration History

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

**Schema 升级**：由 AI 直接编辑 state.json 执行，无需迁移脚本。

---

## 6. Implementation Notes <!-- id: feat_state_management_impl -->

### 6.1 Related Files

| 文件 | 用途 |
|------|------|
| `.flow/state.json` | 状态数据文件（唯一状态源） |
| `scripts/state.js` | 状态 CLI（查询/更新接口，含并发锁） |
| `scripts/validate-state.js` | Schema 校验脚本 |
| `scripts/status.js` | 状态摘要脚本（含 Domain Tree 派生） |

### 6.2 Usage

**推荐方式：使用 state.js CLI**

当 state.json 文件过大或需要并发安全操作时，使用 CLI 接口：

```bash
# 查询操作
node scripts/state.js summary                    # 状态摘要（JSON 格式）
node scripts/state.js get-feature <name>         # 获取单个 Feature
node scripts/state.js list-active                # 列出活跃 Features
node scripts/state.js get-domain <name>          # 获取 Domain 及其 Features

# 更新操作（自动加锁，防止并发冲突）
node scripts/state.js update-feature <name> --phase=<phase> --status=<status>
node scripts/state.js complete-feature <name>    # 标记 Feature 完成
node scripts/state.js add-subtask <feature> --desc="任务描述" --source=ai
node scripts/state.js complete-subtask <feature> <subtaskId>
node scripts/state.js skip-subtask <feature> <subtaskId>
node scripts/state.js record-commit              # 记录最新 git commit 到 metadata

# Session 操作（v11.0 新增）
node scripts/state.js session-mode <mode>        # 设置会话模式 (idle/consulting/delivering)
node scripts/state.js session-topic <topic>      # 设置当前主题
node scripts/state.js add-pending "<content>"    # 添加暂存需求
node scripts/state.js clear-pending              # 清空暂存需求
node scripts/state.js list-pending               # 列出暂存需求
```

**直接读取**（适用于小型项目或简单场景）：
```javascript
const state = JSON.parse(fs.readFileSync('.flow/state.json'));

// 获取当前活跃的 Features
const activeFeatures = state.flow.activeFeatures;
console.log(`活跃任务: ${activeFeatures.join(', ')}`);

// 获取每个 Feature 的阶段和状态
activeFeatures.forEach(name => {
  const feature = state.features[name];
  console.log(`  ${name}: ${feature.phase} (${feature.status})`);
});
```

**运行校验**：
```bash
npm run validate
# 或
node scripts/validate-state.js
```

**状态流转**：
```
code 类型：pending → requirements → design → implementation → verification → done
document 类型：pending → drafting → done

完成标志：phase = done + status = completed
```

---

## Appendix: Complete Example <!-- id: feat_state_management_example -->

```json
{
  "schemaVersion": "11.0.0",
  "project": {
    "name": "SoloDevFlow 2.0",
    "description": "为超级个体打造的自进化人机协作开发系统",
    "type": "backend",
    "createdAt": "2024-12-16",
    "updatedAt": "2024-12-21"
  },
  "flow": {
    "researchMethod": "bottom-up",
    "activeFeatures": ["prd-validator", "state-management"]
  },
  "session": {
    "mode": "idle",
    "context": {
      "topic": null,
      "relatedFeatures": [],
      "pendingRequirements": []
    }
  },
  "features": {
    "prd-validator": {
      "type": "code",
      "description": "PRD 格式校验器",
      "domain": "specification",
      "docPath": "docs/_features/prd-validator.spec.md",
      "designDepth": "required",
      "artifacts": {
        "design": "docs/_features/prd-validator.design.md",
        "code": ["src/validators/prd-validator.js"],
        "tests": ["tests/e2e/prd-validator.test.ts"]
      },
      "phase": "implementation",
      "status": "in_progress"
    },
    "state-management": {
      "type": "code",
      "description": "状态管理系统（Schema + CLI 工具）",
      "domain": "process",
      "docPath": "docs/requirements/features/fea-state-management.md",
      "designDepth": "none",
      "artifacts": {
        "design": null,
        "code": ["scripts/validate-state.js", "scripts/state.js", "scripts/status.js"],
        "tests": []
      },
      "phase": "implementation",
      "status": "in_progress"
    },
    "requirements-doc": {
      "type": "document",
      "domain": "specification",
      "docPath": "docs/specs/requirements-doc.spec.md",
      "phase": "done",
      "status": "completed"
    }
  },
  "domains": {
    "process": "协作流程（状态/输入/灵光/影响追踪）",
    "specification": "规范文档（元规范/需求/设计/开发/测试）"
  },
  "sparks": [],
  "pendingDocs": [],
  "metadata": {
    "lastGitCommit": null,
    "lastGitCommitMessage": null,
    "lastGitCommitAt": null,
    "stateFileVersion": 9,
    "totalStateChanges": 9
  },
  "lastUpdated": "2024-12-21T00:00:00Z"
}
```

---

*Version: v10.0*
*Created: 2024-12-20*
*Updated: 2025-12-25*
*Changes: v10.0 新增 session 字段（会话状态管理），支持工作流咨询/交付模式切换和临时需求暂存; v9.1 添加 frontmatter 可选字段（priority, domain）符合 spec-requirements v2.5*
*Applies to: SoloDevFlow 2.0*
