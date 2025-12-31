---
type: feature
id: hooks-integration
workMode: code
status: done
phase: done
priority: P0
domain: ai-config
version: "1.7"
---

# Feature: Hooks Integration <!-- id: feat_hooks_integration -->

> Claude Code Hooks 集成，实现工作流自动化和阶段守卫

---

## 1. Intent <!-- id: feat_hooks_integration_intent -->

### 1.1 Problem

- 每次对话开始时 AI 缺乏项目上下文，需要人工说明当前状态
- 用户输入时 AI 不知道当前正在做什么，无法智能关联
- 在错误的阶段可能执行不当操作（如需求阶段写代码）
- 敏感文件（state.json、.env）可能被意外修改
- 规范文档修改后缺乏影响分析提示

### 1.2 Value

- **自动上下文注入**：Session 启动时自动注入项目状态
- **智能关联**：用户输入时关联当前 Feature、文档状态
- **阶段守卫**：防止在错误阶段执行不当操作
- **文件保护**：保护敏感文件和状态文件
- **规范变更提示**：修改规范时提示运行影响分析

---

## 2. Scope <!-- id: feat_hooks_integration_scope -->

### 2.1 In Scope (MVP)

- SessionStart Hook：注入项目状态上下文
- UserPromptSubmit Hook：注入工作流上下文
- PreToolUse Hook：阶段守卫 + 文件保护
- PostToolUse Hook：文档验证触发（可选）

### 2.2 Out of Scope

- 复杂的自然语言意图识别（依赖 Claude 原生能力）
- 多 Session 协调（超出 Claude CLI 能力）
- 跨项目状态同步

---

## 3. Core Functions <!-- id: feat_hooks_integration_functions -->

| ID | Function | 描述 |
|----|----------|------|
| H1 | SessionStart 上下文注入 | 会话开始时读取 state.json + index.json，输出项目状态摘要 |
| H2 | UserPromptSubmit 上下文注入 | 用户输入时注入工作流上下文（当前 Feature、阶段、Session 模式） |
| H3 | PreToolUse 阶段守卫 | 基于当前阶段决定是否允许工具操作 |
| H4 | PreToolUse 文件保护 | 保护敏感文件，防止意外修改 |
| H5 | PostToolUse 验证触发 | 文档修改后触发验证脚本（可选） |
| H6 | PostToolUse TodoWrite 同步 | AI 使用 TodoWrite 时自动同步到 state.json subtasks |
| H7 | PreToolUse set-phase 守卫 | set-phase done 前检查是否有未完成的 subtasks |
| H8 | UserPromptSubmit 意图检测 | 检测用户输入中的结构性变更意图，提示走需求流程 |
| H9 | PreToolUse 模板保护 | 阻止直接修改 .solodevflow/flows/，引导修改 template/flows/ |

### 3.1 H1: SessionStart 上下文注入

**触发条件**：Session 启动时

**输出格式**：
```
<workflow-context>
Project: {project.name}
Active Feature: {activeFeature.id} ({activeFeature.phase})
Session Mode: {session.mode}
</workflow-context>
```

**数据来源**：
- `.solodevflow/state.json`：项目名、活跃 Feature、阶段、Session 模式
- `.solodevflow/index.json`：文档状态摘要

### 3.2 H2: UserPromptSubmit 上下文注入

**触发条件**：用户输入后

**输出格式**：
```json
{
  "hookSpecificOutput": {
    "hookEventName": "UserPromptSubmit",
    "additionalContext": "<workflow-context>...</workflow-context>"
  }
}
```

**上下文字段**（约 200 tokens）：
| Field | Source | Description |
|-------|--------|-------------|
| productName | state.json.project.name | 产品名称 |
| activeFeature | state.json.flow.activeFeatures[0] | 当前活跃 Feature |
| sessionMode | state.json.session.mode | idle/consulting/delivering |

### 3.3 H3: PreToolUse 阶段守卫

**文档层级定义**：

为了支持产品文档的独立创建，系统定义三层文档层级：

| 层级 | 文档类型 | 路径模式 | 是否需要 Work Item |
|------|---------|---------|-------------------|
| **Product Level** | 产品文档 | `docs/requirements/prd.md`<br/>`docs/requirements/specs/**/*.md`<br/>`README.md`<br/>`CONTRIBUTING.md`<br/>`docs/*.md` | ❌ 否 |
| **Work Item Level** | 功能文档 | `docs/requirements/features/**/*.md`<br/>`docs/requirements/capabilities/**/*.md`<br/>`docs/requirements/flows/**/*.md`<br/>`docs/designs/**/*.md` | ✅ 是 |
| **Implementation Level** | 实现产物 | `src/**/*`<br/>`scripts/**/*`<br/>`tests/**/*`<br/>`.claude/hooks/**/*` | ✅ 是 |

**阶段守卫规则**：

| 当前阶段 | 阻止操作 | 豁免（允许） | 原因 |
|----------|----------|-------------|------|
| `pending` | Write/Edit Work Item Level + Implementation Level 文件 | Product Level 文档 | 初始阶段可创建产品文档，但不能创建功能文档或代码 |
| `done` | Write/Edit `src/**/*.{js,ts}`, `scripts/**/*.js`, `.claude/hooks/**/*.js` | - | ask 确认 + 根因分析提示（软性引导） |
| `feature_requirements` | Write/Edit `src/**/*.{js,ts}`, `scripts/**/*.js`, `.claude/hooks/**/*.js`, `tests/**/*` | - | 需求阶段不应写代码 |
| `feature_review` | Write/Edit `docs/designs/**/*.md`, `src/**/*`, `scripts/**/*.js`, `.claude/hooks/**/*.js`, `tests/**/*` | - | 等待人工审核，批准后才能进入设计阶段 |
| `feature_design` | Write/Edit `src/**/*.{js,ts}`, `scripts/**/*.js`, `tests/**/*` | - | 设计阶段不应写代码 |
| 任意 | Edit `.solodevflow/state.json` | - | 使用 State CLI |

**pending 阶段具体规则**：
- **阻止**：Work Item Level 文档、Implementation Level 文件
- **允许**：Product Level 文档（PRD、Specs、README 等）
- **理由**：新项目启动时需要先编写 PRD，不应强制创建 Work Item

**注意**：`done` 状态通过 status 字段判断，优先级高于 phase 字段。

### 3.4 H4: PreToolUse 文件保护

**保护规则**：

| 文件模式 | 行为 | 原因 |
|----------|------|------|
| `.solodevflow/state.json` | block | 使用 `node scripts/state.cjs` |
| `.env`, `*.key`, `*.pem` | block | 安全敏感文件 |
| `docs/specs/*.md` | ask | 提示运行影响分析 |

### 3.5 H6: PostToolUse TodoWrite 同步

**触发条件**：AI 使用 TodoWrite 工具后

**行为**：
- 将 TodoWrite 中的任务自动同步到 state.json 的 subtasks
- 同步方向：TodoWrite → subtasks（单向）
- 冲突策略：只追加，不删除已有 subtasks
- 通过 description 字段匹配判断是否已存在

**featureId 分配**：
- 使用 `state.json.flow.activeFeatures[0]` 作为 featureId
- 如果没有活跃 Feature，标记为 `unassigned` 并输出警告

**状态映射**：
| TodoWrite status | Subtask status |
|------------------|----------------|
| pending | pending |
| in_progress | in_progress |
| completed | completed |

### 3.6 H7: PreToolUse set-phase 守卫

**触发条件**：执行 `node scripts/state.cjs set-phase <id> done` 命令时

**行为**：
- 检查该 Feature 是否有未完成的 subtasks（pending 或 in_progress）
- 如果有未完成任务，返回 `ask` 决策，列出所有未完成任务
- 用户可以选择继续或取消

**输出示例**：
```
Feature "xxx" has 3 pending subtask(s):
  - Task 1 description
  - Task 2 description
  - Task 3 description

Complete or skip these subtasks before marking the feature as done.
```

**注意**：此守卫仅在命令不在 `settings.local.json` 的 allow list 中时生效。

### 3.7 H8: UserPromptSubmit 结构性变更意图检测

**问题背景**：

当用户明确授权变更时（如"是的，请删除 byType"），AI 倾向于直接执行代码修改，跳过需求变更流程。这导致：
- 需求文档与实现不同步
- 人类失去审核机会
- 变更缺乏可追溯性

**设计思路**：

不能基于具体文件名检测（每个项目关键文件不同），应基于用户输入的**意图关键词**检测。

**触发条件**：UserPromptSubmit 时检测用户输入

**意图关键词**：

| 关键词 | 变更类型 | 示例 |
|--------|----------|------|
| 删除、移除、remove、delete | 删除功能 | "删除 byType"、"移除这个字段" |
| 添加、新增、add、create | 新增功能 | "添加新命令"、"新增验证规则" |
| 修改接口、改 API、change interface | 接口变更 | "修改返回格式" |
| 重构、refactor | 结构重构 | "重构状态管理" |

**检查逻辑**：

1. 检测用户输入是否包含意图关键词
2. 检查当前阶段是否为 `feature_requirements` 或 `feature_review`
3. 如果包含关键词且不在需求阶段，在 `additionalContext` 中注入提示：

```
[Input Analysis Reminder]
检测到可能的【{变更类型}】请求。
请先执行 Input Analysis (参考 .solodevflow/flows/workflows.md §2)：
1. 确认是否为需求变更（修改现有功能）
2. 如是，先设置阶段：set-phase <id> feature_requirements
3. 更新需求文档
4. 完成后：set-phase <id> feature_review
5. 等待人类审核批准后才能写代码
```

**设计原则**：
- 基于意图检测，不依赖具体文件名（通用性）
- 在 UserPromptSubmit 阶段提示（比 PreToolUse 更早）
- 软性引导，通过 additionalContext 注入提示
- 已在需求阶段时不重复提示

### 3.8 H9: PreToolUse 模板保护

**问题背景**：

AI 修改执行规范时，直接修改 `.solodevflow/flows/*.md`（项目实例），而应该修改 `template/flows/*.md`（模板源）。正确流程是：
1. 修改 `template/flows/*.md`（模板）
2. 审核通过
3. 人类通过升级脚本更新 `.solodevflow/flows/`

**触发条件**：PreToolUse，工具为 Write/Edit，目标路径匹配 `.solodevflow/flows/*.md`

**行为**：
- 返回 `block` 决策
- 提示信息引导 AI 修改 `template/flows/` 而不是 `.solodevflow/flows/`

**输出示例**：
```
[Template Protection]
不应直接修改 .solodevflow/flows/{filename}。

正确流程：
1. 修改 template/flows/{filename}（模板源）
2. 审核通过后，人类运行升级脚本更新项目实例

请改为修改: template/flows/{filename}
```

**配套措施**（方案 A）：

在 `template/flows/*.md` 文件头部添加注释，提醒 AI 这是模板源文件：

```markdown
<!--
  Template Source File
  修改此文件后，需要通过升级脚本同步到项目的 .solodevflow/flows/
  请勿直接修改 .solodevflow/flows/ 中的文件
-->
```

---

## 4. Acceptance Criteria <!-- id: feat_hooks_integration_acceptance -->

| Item | Verification | Pass Criteria |
|------|--------------|---------------|
| SessionStart 输出 | 启动 Claude Code | 显示 `<workflow-context>` 标签，包含详细 subtasks 列表 |
| UserPromptSubmit 输出 | 输入任意内容 | 上下文包含当前 Feature |
| 阶段守卫 - 需求阶段 | 在 `feature_requirements` 阶段尝试 Edit `src/test.js` | 操作被阻止 |
| 阶段守卫 - done 状态 | 在 `done` 状态尝试 Edit `src/*.js` | 显示 ask 确认，提示进行根因分析 |
| 文件保护 - state.json | 尝试 Edit `.solodevflow/state.json` | 操作被阻止，提示使用 CLI |
| 规范修改提示 | 修改 `docs/specs/*.md` | 显示 ask 确认 |
| TodoWrite 同步 | AI 使用 TodoWrite | 任务同步到 state.json subtasks |
| TodoWrite 警告 | 无活跃 Feature 时使用 TodoWrite | 输出警告，featureId 标记为 `unassigned` |
| set-phase done 守卫 | 有未完成 subtasks 时执行 set-phase done | 显示 ask 确认，列出未完成任务 |
| 意图检测 - 非需求阶段 | 在 `done` 状态下输入"删除 xxx" | additionalContext 包含 [Input Analysis Reminder] |
| 意图检测 - 需求阶段 | 在 `feature_requirements` 阶段输入"删除 xxx" | 不显示提示（已在流程中） |
| 模板保护 - 阻止修改实例 | 尝试 Edit `.solodevflow/flows/workflows.md` | 操作被阻止，提示修改 template/flows/ |
| 模板保护 - 允许修改模板 | 尝试 Edit `template/flows/workflows.md` | 操作允许 |

---

## 5. Artifacts <!-- id: feat_hooks_integration_artifacts -->

| Type | Path | Description |
|------|------|-------------|
| Design | docs/designs/des-hooks-integration.md | 技术设计文档 |
| Source | src/hooks/ | 源代码目录 |
| Runtime | .claude/hooks/ | 运行时目录（通过 init 部署） |
| Config | .claude/settings.json | Hooks 配置 |

**Design Depth**: Required（已完成）

---

## 6. Dependencies <!-- id: feat_hooks_integration_dependencies -->

| Dependency | Type | 说明 |
|------------|------|------|
| state-management | hard | 读取 state.json + index.json |
| project-init | soft | 通过 init 脚本部署 hooks |
| cap-document-validation | soft | PostToolUse 调用验证脚本 |

---

## 7. Implementation Notes <!-- id: feat_hooks_integration_impl -->

### 7.1 Related Files

| 文件 | 用途 |
|------|------|
| `src/hooks/lib/state-reader.js` | 读取 state.json + index.json |
| `src/hooks/lib/output.js` | 输出格式化 |
| `src/hooks/session-start.cjs` | SessionStart Hook |
| `src/hooks/user-prompt-submit.cjs` | UserPromptSubmit Hook |
| `src/hooks/pre-tool-use.cjs` | PreToolUse Hook |
| `src/hooks/post-tool-use.cjs` | PostToolUse Hook |
| `.claude/settings.json` | Hooks 配置 |

### 7.2 Configuration

`.claude/settings.json` 需包含 hooks 字段配置。

### 7.3 Error Handling

| 场景 | 处理方式 | Exit Code |
|------|----------|-----------|
| state.json 不存在 | stderr 提示初始化，继续 | 0 |
| state.json 解析失败 | stderr 显示错误，阻止启动 | 2 |
| index.json 不存在 | 优雅降级，运行 scripts/index.cjs | 0 |
| Hook 脚本异常 | stderr 显示错误，使用默认行为 | 1 |

---

*Version: v1.7*
*Created: 2025-12-27*
*Updated: 2025-12-30*

---

## Changelog

### v1.7 (2025-12-30)
- 新增 H9: PreToolUse 模板保护（阻止直接修改 .solodevflow/flows/，引导修改 template/flows/）
- 配套方案 A：模板文件头部添加注释提醒
- 解决执行规范修改流程问题：模板 → 升级脚本 → 实例

### v1.6 (2025-12-30)
- 新增文档层级定义：Product Level / Work Item Level / Implementation Level
- 修复 pending phase 守卫过于严格的问题：允许创建产品文档（PRD、Specs、README）
- 解决新项目启动时无法创建 PRD 的流程缺陷

### v1.5 (2025-12-29)
- 重新设计 H8: 从 PreToolUse 文件名检测改为 UserPromptSubmit 意图检测
- 基于用户输入的关键词检测变更意图（删除/添加/修改接口/重构）
- 不依赖具体文件名，适用于所有项目

### v1.4 (2025-12-29)
- 新增 H8: PreToolUse 结构性变更守卫（已废弃，被 v1.5 替代）
- 修复工作流设计缺陷：修改关键文件时提示走需求流程
- 软性引导（ask），不强制阻止，允许紧急情况跳过

### v1.3 (2025-12-28)
- `done` 状态守卫改为软性引导：block → ask
- 增加根因分析提示：需求问题/设计问题/实现问题
- 配合 workflows.md §7 Bug Fix Flow 使用

### v1.2 (2025-12-28)
- 新增 H6: PostToolUse TodoWrite 同步功能
- 新增 H7: PreToolUse set-phase done 守卫
- 扩展阶段守卫规则：添加 `done` 状态和 `feature_review` 阶段
- 扩展阶段守卫范围：`scripts/**/*.js`、`.claude/hooks/**/*.js`
- SessionStart 输出增强：详细列出所有 pending subtasks

### v1.1 (2025-12-27)
- 初始版本发布
