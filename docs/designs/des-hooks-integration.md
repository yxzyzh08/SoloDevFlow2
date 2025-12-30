---
type: design
id: design-hooks-integration
status: done
version: "1.6"
inputs:
  - docs/requirements/flows/flow-workflows.md#flow_hooks
  - docs/requirements/features/fea-hooks-integration.md
---

# Hooks Integration Design v1.6 <!-- id: design_hooks_integration -->

> Claude Code Hooks Integration - 工作流自动化技术设计

---

## 1. Input Requirements <!-- id: design_hooks_input -->

本设计基于以下需求：

| 来源 | 章节 | 说明 |
|------|------|------|
| [flow-workflows.md](../requirements/flows/flow-workflows.md#flow_hooks) | §9 Hooks Integration | Hook 架构、接口、验收标准 |
| [fea-state-management.md](../requirements/features/fea-state-management.md#feat_state_management) | §5-6 | state.json 结构、session 字段、index.json 文档索引 |

---

## 2. Overview <!-- id: design_hooks_overview -->

### 2.1 Design Goals

1. **工作流自动化** — 通过 Claude Code Hooks 自动注入项目上下文
2. **阶段守卫** — 防止在错误阶段执行不当操作
3. **文件保护** — 保护敏感文件和状态文件
4. **文档索引集成** — 通过 index.json 提供文档状态上下文

### 2.2 Constraints

| 约束 | 说明 |
|------|------|
| Hook 无状态 | 每次调用都是独立进程，状态需持久化到 state.json |
| 快速响应 | Hook 应在 100ms 内完成（本地操作） |
| 错误容忍 | Hook 失败不应阻断 Claude Code 正常工作 |
| 最小依赖 | 仅依赖 Node.js 内置模块（零外部依赖） |

### 2.3 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Claude Code Runtime                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│   ┌─────────────┐  stdin   ┌─────────────────────────────────┐  │
│   │ Hook Event  │─────────▶│         Hook Scripts             │  │
│   │ (JSON)      │          │  .claude/hooks/*.js              │  │
│   └─────────────┘          └───────────┬─────────────────────┘  │
│                                        │                         │
│                            ┌───────────┴───────────┐            │
│                            ▼                       ▼            │
│                   ┌─────────────────┐   ┌─────────────────┐    │
│                   │  state.json     │   │  index.json     │    │
│                   │  (State)        │   │  (Doc Index)    │    │
│                   └─────────────────┘   └─────────────────┘    │
│                                                                   │
│   stdout ◀──────────────────────────────────────────────────────│
│   (Context/Decision)                                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Technical Approach <!-- id: design_hooks_approach -->

### 3.1 Directory Structure

采用**源代码与运行时分离**的架构：

| 目录 | 用途 | 版本控制 |
|------|------|----------|
| `src/hooks/` | 源代码，统一管理 | ✅ Git 管理 |
| `.claude/hooks/` | 运行时，通过安装脚本部署 | ❌ .gitignore |

**源代码目录** (`src/hooks/`)：

```
src/hooks/
├── lib/
│   ├── state-reader.js    # 读取 state.json + index.json
│   └── output.js          # 输出格式化
├── session-start.js       # SessionStart Hook
├── user-prompt-submit.js  # UserPromptSubmit Hook
├── pre-tool-use.js        # PreToolUse Hook
└── post-tool-use.js       # PostToolUse Hook (optional)
```

**运行时目录** (`.claude/hooks/`)：

```
.claude/
├── settings.json          # Hook 配置（需包含 hooks 字段）
└── hooks/                  # 通过安装脚本从 src/hooks/ 复制
    ├── lib/
    ├── session-start.js
    ├── user-prompt-submit.js
    ├── pre-tool-use.js
    └── post-tool-use.js
```

### 3.2 Deployment via Project Init

Hook 部署通过现有的 `scripts/init.js` 安装机制完成，扩展 `copyToolFiles()` 函数：

```javascript
// scripts/init.js - copyToolFiles() 函数扩展

async function copyToolFiles(config) {
  // ... 现有代码 ...

  // 6. Copy src/hooks/ to .claude/hooks/ (NEW)
  log('  复制 .claude/hooks/...');
  const hooksSrc = path.join(SOLODEVFLOW_ROOT, 'src', 'hooks');
  const hooksDest = path.join(targetPath, '.claude', 'hooks');
  if (fs.existsSync(hooksSrc)) {
    copyDir(hooksSrc, hooksDest);
    log('    .claude/hooks/', 'success');
  }
}
```

**安装方式**（复用现有机制）：
- 初始化：`solodevflow init <path>`
- 升级：`solodevflow upgrade <path>`
- 自举：`solodevflow init .`（SoloDevFlow 自身）

**与现有机制一致**：
| 源目录 | 目标目录 | 说明 |
|--------|----------|------|
| `template/commands/` | `.claude/commands/` | 已有 |
| `scripts/*.js` | `.solodevflow/scripts/` | 已有 |
| `src/hooks/` | `.claude/hooks/` | **新增** |

### 3.3 Shared Utilities

共享工具模块位于 `src/hooks/lib/`：

| 模块 | 职责 |
|------|------|
| `state-reader.js` | 读取 state.json + index.json，提取 Feature/Session/文档状态 |
| `output.js` | 输出格式化，生成 `<workflow-context>` |

### 3.4 State Reader Design

```javascript
// src/hooks/lib/state-reader.js

const fs = require('fs');
const path = require('path');

const STATE_PATH = path.join(process.cwd(), '.solodevflow', 'state.json');
const INDEX_PATH = path.join(process.cwd(), '.solodevflow', 'index.json');

function readState() {
  if (!fs.existsSync(STATE_PATH)) {
    return { error: 'STATE_NOT_FOUND' };
  }
  try {
    const content = fs.readFileSync(STATE_PATH, 'utf-8');
    return { data: JSON.parse(content) };
  } catch (err) {
    return { error: 'STATE_PARSE_ERROR', message: err.message };
  }
}

function readIndex() {
  if (!fs.existsSync(INDEX_PATH)) {
    return { error: 'INDEX_NOT_FOUND' };
  }
  try {
    const content = fs.readFileSync(INDEX_PATH, 'utf-8');
    return { data: JSON.parse(content) };
  } catch (err) {
    return { error: 'INDEX_PARSE_ERROR', message: err.message };
  }
}

function getActiveFeature(state) {
  const activeId = state?.flow?.activeFeatures?.[0];
  if (!activeId) return null;

  // 从 index.json 获取 feature 信息（包含 phase 和 status）
  const indexResult = readIndex();
  if (indexResult.error) {
    return { id: activeId, phase: 'feature_implementation' };
  }

  const feature = indexResult.data?.documents?.find(doc => doc.id === activeId);
  return feature ? {
    id: activeId,
    phase: feature.phase || 'feature_implementation',
    status: feature.status,
    path: feature.path
  } : { id: activeId, phase: 'feature_implementation' };
}

function getSubtasks(state) {
  return state?.subtasks || [];
}

// v1.2 新增：获取指定 Feature 的未完成 subtasks
function getPendingSubtasksForFeature(state, featureId) {
  const subtasks = state?.subtasks || [];
  return subtasks.filter(s =>
    s.featureId === featureId &&
    (s.status === 'pending' || s.status === 'in_progress')
  );
}

module.exports = {
  readState, readIndex, getActiveFeature,
  getSubtasks, getPendingSubtasksForFeature,
  STATE_PATH, INDEX_PATH
};
```

### 3.5 Keyword Extraction

关键词提取由 `user-prompt-submit.js` 负责，采用简单空格分词策略：

```javascript
function extractKeywords(prompt) {
  // 简单空格分词，过滤短词和停用词
  const stopWords = new Set(['的', '是', '在', '了', '和', 'the', 'a', 'is', 'to', 'and']);
  return prompt
    .split(/\s+/)
    .map(w => w.trim().toLowerCase())
    .filter(w => w.length >= 2 && !stopWords.has(w))
    .slice(0, 5);  // 最多取 5 个关键词
}
```

> **Note**: 这是 MVP 实现。未来可引入中文分词库（如 jieba）提升准确性。

---

## 4. Interface Design <!-- id: design_hooks_interface -->

### 4.1 SessionStart Hook

**Input** (stdin JSON):
```typescript
interface SessionStartInput {
  session_id: string;
  cwd: string;
  hook_event_name: 'SessionStart';
  source: 'startup' | 'resume' | 'clear';
}
```

**Output** (stdout plain text):
```
<workflow-context>
Project: {project.name}
Active Feature: {activeFeature.id} ({activeFeature.phase})
Session Mode: {session.mode}
</workflow-context>
```

**Exit Codes**:
| Code | Meaning |
|------|---------|
| 0 | Success, stdout injected as context |
| 2 | Block session start, stderr shown |

### 4.2 UserPromptSubmit Hook

**Input** (stdin JSON):
```typescript
interface UserPromptSubmitInput {
  session_id: string;
  cwd: string;
  hook_event_name: 'UserPromptSubmit';
  prompt: string;
}
```

**Output** (stdout JSON):
```typescript
interface UserPromptSubmitOutput {
  hookSpecificOutput: {
    hookEventName: 'UserPromptSubmit';
    additionalContext: string;  // <workflow-context>...</workflow-context>
  };
}
```

**Context Fields** (~200 tokens):
| Field | Source | Description |
|-------|--------|-------------|
| productName | state.json.project.name | Product name |
| activeFeature | state.json.flow.activeFeatures[0] | Current active feature |
| docStatus | index.json.summary | Document completion summary (done/in_progress/not_started) |
| sessionMode | state.json.session.mode | idle/consulting/delivering |
| pendingCount | state.json.session.pendingRequirements.length | Pending requirements count |

### 4.3 PreToolUse Hook

**Input** (stdin JSON):
```typescript
interface PreToolUseInput {
  session_id: string;
  cwd: string;
  hook_event_name: 'PreToolUse';
  tool_name: string;
  tool_input: Record<string, any>;
  tool_use_id: string;
}
```

**Output** (stdout JSON):
```typescript
interface PreToolUseOutput {
  decision: 'allow' | 'block' | 'ask';
  reason?: string;  // Required when decision is 'block'
}
```

#### 4.3.1 Phase Guard Rules

基于需求文档 v1.6，系统定义了三层文档层级：

**文档层级定义**：

| 层级 | 文档类型 | 路径模式 | 是否需要 Work Item |
|------|---------|---------|-------------------|
| **Product Level** | 产品文档 | `docs/requirements/prd.md`<br/>`docs/requirements/specs/**/*.md`<br/>`README.md`, `CONTRIBUTING.md`<br/>`docs/*.md` | ❌ 否 |
| **Work Item Level** | 功能文档 | `docs/requirements/features/**/*.md`<br/>`docs/requirements/capabilities/**/*.md`<br/>`docs/requirements/flows/**/*.md`<br/>`docs/designs/**/*.md` | ✅ 是 |
| **Implementation Level** | 实现产物 | `src/**/*`<br/>`scripts/**/*`<br/>`tests/**/*`<br/>`.claude/hooks/**/*` | ✅ 是 |

**阶段守卫规则**：

| 当前阶段 | 阻止操作 | 豁免（允许） | 决策 | 原因 |
|----------|----------|-------------|------|------|
| `pending` | Write/Edit Work Item Level + Implementation Level | Product Level 文档 | block | 初始阶段可创建产品文档，但不能创建功能文档或代码 |
| `done` | Write/Edit `src/**/*.{js,ts}`, `scripts/**/*.js`, `.claude/hooks/**/*.js` | - | **ask** | 软性引导：提示进行根因分析 |
| `feature_requirements` | Write/Edit `src/**/*.{js,ts}`, `scripts/**/*.js`, `.claude/hooks/**/*.js`, `tests/**/*` | - | block | 需求阶段不应写代码/测试 |
| `feature_review` | Write/Edit `docs/designs/**/*.md`, `src/**/*`, `scripts/**/*.js`, `.claude/hooks/**/*.js`, `tests/**/*` | - | block | 等待人工审核 |
| `feature_design` | Write/Edit `src/**/*.{js,ts}`, `scripts/**/*.js`, `tests/**/*` | - | block | 设计阶段不应写代码/测试 |
| 任意 | Edit `.solodevflow/state.json` | - | block | 使用 State CLI 而非直接编辑 |

**v1.5 变更**：添加文档层级定义，pending 阶段允许创建产品文档（PRD、Specs、README）。
**v1.4 变更**：`done` 状态从 `block` 改为 `ask`，配合根因分析流程使用。

#### 4.3.2 Done Status Root Cause Analysis

当修改 `done` 状态 Feature 的代码时，Hook 显示 ask 确认，提示进行根因分析：

```
Feature is done. Before modifying code, perform ROOT CAUSE ANALYSIS:
  • Requirements issue → Update requirements doc first
  • Design issue → Update design doc first
  • Implementation issue → Proceed with code fix directly
Confirm you have analyzed the root cause?
```

详见 `workflows.md §7 Bug Fix Flow`。

#### 4.3.3 Set-Phase Done Guard

执行 `node scripts/state.js set-phase <id> done` 命令时，检查是否有未完成的 subtasks：
- 如有未完成任务 → 返回 `ask` 决策，列出所有未完成任务
- 用户确认后允许执行

#### 4.3.4 Protected File Rules

| 文件模式 | 保护行为 | 原因 |
|----------|----------|------|
| `.solodevflow/state.json` | block | 使用 `node scripts/state.js` 管理 |
| `.env`, `*.key`, `*.pem` | block | 安全敏感文件 |
| `docs/specs/*.md` | ask | 触发警告，提示运行影响分析 |

#### 4.3.5 Template Protection Rules (H9)

阻止直接修改 `.solodevflow/flows/` 中的执行规范实例文件，引导 AI 修改 `template/flows/` 模板源。

**保护规则**：

| 文件模式 | 保护行为 | 原因 |
|----------|----------|------|
| `.solodevflow/flows/*.md` | block | 执行规范实例，应修改模板源 |
| `template/flows/*.md` | allow | 模板源文件，允许修改 |

**输出消息**：

```
[Template Protection]
不应直接修改 .solodevflow/flows/{filename}。

正确流程：
1. 修改 template/flows/{filename}（模板源）
2. 审核通过后，人类运行升级脚本更新项目实例

请改为修改: template/flows/{filename}
```

**实现位置**：`pre-tool-use.js` 的 `checkTemplateProtection()` 函数。

#### 4.3.6 Auto-Approve Rules

| 工具 | 文件模式 | 决策 |
|------|----------|------|
| Read | `*.md`, `*.json`, `*.txt` | allow |
| Read | `docs/**/*` | allow |
| Glob | `*` | allow |
| Grep | `*` | allow |

### 4.4 PostToolUse Hook

**Input** (stdin JSON):
```typescript
interface PostToolUseInput {
  session_id: string;
  cwd: string;
  hook_event_name: 'PostToolUse';
  tool_name: 'Write' | 'Edit' | 'TodoWrite';
  tool_input: { file_path?: string; todos?: Todo[] };
  tool_response: { success: boolean };
}

interface Todo {
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
}
```

**Output** (stdout plain text):
Validation result message or sync status, injected as context.

#### 4.4.1 TodoWrite Sync (v1.2 新增)

当 AI 使用 TodoWrite 工具时，自动同步到 state.json 的 subtasks：

| 行为 | 说明 |
|------|------|
| 同步方向 | TodoWrite → subtasks（单向） |
| 冲突策略 | 只追加，不删除已有 subtasks |
| 匹配方式 | 通过 description 字段判断是否已存在 |
| featureId | 使用当前活跃 Feature，无则标记为 `unassigned` |

**状态映射**：
| TodoWrite status | Subtask status |
|------------------|----------------|
| pending | pending |
| in_progress | in_progress |
| completed | completed |

**输出示例**：
```
[TodoSync] Synced: 3 added, 1 updated
```

**警告情况**：
```
[TodoSync] Warning: No active feature. Subtasks will be marked as "unassigned".
```

#### 4.4.2 Validation Rules

| 文件模式 | 验证动作 |
|----------|----------|
| `docs/requirements/**/*.md` | `npm run validate:docs` |
| `docs/specs/**/*.md` | `npm run validate:docs` |
| `.solodevflow/*.json` | `npm run validate:state` |

---

## 5. Decision Record <!-- id: design_hooks_decisions -->

| Decision | Options | Choice | Rationale |
|----------|---------|--------|-----------|
| 源代码目录 | `.claude/hooks/` / `src/hooks/` | `src/hooks/` | 统一管理，与其他模块（cli, lib）一致，便于版本控制和维护 |
| 运行时部署 | 独立脚本 / 扩展现有 init | 扩展 `scripts/init.js` | 复用现有 copyToolFiles() 机制，与 commands/skills/scripts 部署方式一致 |
| 文档索引方式 | SQLite 知识库 / JSON 索引 | JSON (index.json) | v12.0.0 决策：利用 Claude CLI 原生 Glob/Grep，零外部依赖 |
| PreToolUse matcher | Write\|Edit / Write\|Edit\|Bash | +Bash | 危险 shell 命令（rm -rf, git push --force）也需要阶段守卫保护 |
| input-log.md | 同步实现 / 延后实现 | 延后 (Phase 2) | 依赖 input-capture feature (soft dependency) |
| TodoWrite 同步 | 双向同步 / 单向同步 | 单向 (TodoWrite→subtasks) | 简化实现，避免冲突；AI 主导任务创建 |
| done 状态守卫 | block / ask | **ask** | 软性引导，配合根因分析流程，允许实现层 bug 直接修复 |
| 阶段守卫范围扩展 | 仅 src / +scripts +hooks | +scripts +hooks | 脚本和 hooks 也是代码，需要同等保护 |

---

## 6. Implementation Plan <!-- id: design_hooks_impl -->

### 6.1 Phase 1: Core Hooks (P1)

| Task | Description |
|------|-------------|
| 1.1 | Create `src/hooks/lib/state-reader.js` |
| 1.2 | Create `src/hooks/lib/output.js` |
| 1.3 | Implement `src/hooks/session-start.js` |
| 1.4 | Implement `src/hooks/pre-tool-use.js` (含详细规则) |
| 1.5 | Extend `scripts/init.js` copyToolFiles() to copy hooks |
| 1.6 | Update `.claude/settings.json` with hooks config |
| 1.7 | Test Phase 1 Hooks |

### 6.2 Phase 2: Index Integration (P2)

| Task | Description |
|------|-------------|
| 2.1 | Extend state-reader.js to read index.json |
| 2.2 | Implement `src/hooks/user-prompt-submit.js` (含文档状态上下文) |
| 2.3 | Implement input-log.md recording (依赖 input-capture) |
| 2.4 | Test index.json integration |

### 6.3 Phase 3: Optional Enhancement (P3)

| Task | Description |
|------|-------------|
| 3.1 | Implement `src/hooks/post-tool-use.js` (含验证规则) |
| 3.2 | Integration testing |

---

## 7. Dependencies <!-- id: design_hooks_dependencies -->

| Dependency | Type | Description |
|------------|------|-------------|
| feat_state_management | hard | Read state.json + index.json for project/feature/session/doc info |
| feat_input_capture | soft | input-log.md recording (Phase 2) |
| cap_document_validation | soft | PostToolUse calls validation scripts |

---

## 8. Error Handling <!-- id: design_hooks_errors -->

Based on requirements §9.10:

| Scenario | Handling | Exit Code |
|----------|----------|-----------|
| state.json not found | stderr hint to initialize, continue | 0 |
| state.json parse error | stderr show error, block startup | 2 |
| index.json not found | Graceful degradation, run scripts/index.js | 0 |
| Validation script failed | Log to stderr, don't block | 0 |
| Hook script exception | stderr show error, use default | 1 |

---

## 9. Configuration <!-- id: design_hooks_config -->

### 9.1 Claude Settings

`.claude/settings.json`:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node .claude/hooks/session-start.js"
          }
        ]
      }
    ],
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node .claude/hooks/user-prompt-submit.js"
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Write|Edit|Bash",
        "hooks": [
          {
            "type": "command",
            "command": "node .claude/hooks/pre-tool-use.js"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "node .claude/hooks/post-tool-use.js"
          }
        ]
      }
    ]
  }
}
```

---

*Version: v1.6*
*Created: 2025-12-25*
*Updated: 2025-12-30*
*Author: Claude Sonnet 4.5*

---

## Changelog

### v1.6 (2025-12-30)
- 新增 §4.3.5 Template Protection Rules (H9)：阻止直接修改 .solodevflow/flows/，引导修改 template/flows/
- 重新编号 §4.3.5 → §4.3.6 Auto-Approve Rules

### v1.5 (2025-12-30)
- 新增文档层级定义：Product Level / Work Item Level / Implementation Level
- 更新 §4.3.1 Phase Guard Rules：pending 阶段允许创建产品文档
- 修复新项目无法创建 PRD 的设计缺陷

### v1.4 (2025-12-28)
- `done` 状态守卫改为软性引导（ask），配合根因分析流程
- 新增 §4.3.2 Done Status Root Cause Analysis
- 新增 §4.3.3 Set-Phase Done Guard
- 扩展阶段守卫范围：`scripts/**/*.js`、`.claude/hooks/**/*.js`
- 新增 `feature_review` 阶段守卫规则
- 更新 §3.4 State Reader Design：添加新函数
- 更新 §5 Decision Record：添加新决策

### v1.3 (2025-12-27)
- 适配 v12.0.0：移除知识库依赖，改用 index.json 文档索引

### v1.2 (2025-12-26)
- 新增 §4.4.1 TodoWrite Sync：AI 任务自动同步到 subtasks
- 源代码与运行时分离架构

### v1.1 (2025-12-25)
- 初始版本
