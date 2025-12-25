---
type: design
version: "1.2"
inputs:
  - docs/requirements/flows/flow-workflows.md#flow_hooks
---

# Hooks Integration Design v1.2 <!-- id: design_hooks_integration -->

> Claude Code Hooks Integration - 工作流自动化技术设计

---

## 1. Input Requirements <!-- id: design_hooks_input -->

本设计基于以下需求：

| 来源 | 章节 | 说明 |
|------|------|------|
| [flow-workflows.md](../requirements/flows/flow-workflows.md#flow_hooks) | §9 Hooks Integration | Hook 架构、接口、验收标准 |
| [fea-knowledge-base.md](../requirements/features/fea-knowledge-base.md#feat_knowledge_base) | §5.4-5.5 | `searchByKeywords()`, `getContextForHook()` |
| [fea-state-management.md](../requirements/features/fea-state-management.md#feat_state_management) | §5-6 | state.json 结构、session 字段 |

---

## 2. Overview <!-- id: design_hooks_overview -->

### 2.1 Design Goals

1. **工作流自动化** — 通过 Claude Code Hooks 自动注入项目上下文
2. **阶段守卫** — 防止在错误阶段执行不当操作
3. **文件保护** — 保护敏感文件和状态文件
4. **知识库集成** — 自动提供相关文档上下文

### 2.2 Constraints

| 约束 | 说明 |
|------|------|
| Hook 无状态 | 每次调用都是独立进程，状态需持久化到 state.json |
| 快速响应 | Hook 应在 100ms 内完成（本地操作） |
| 错误容忍 | Hook 失败不应阻断 Claude Code 正常工作 |
| 最小依赖 | 仅依赖 Node.js 内置模块 + better-sqlite3 |

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
│                   │  state.json     │   │  knowledge.db   │    │
│                   │  (State)        │   │  (Knowledge)    │    │
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
│   ├── state-reader.js    # 读取 state.json
│   ├── kb-client.js       # 调用知识库 CLI
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
| `template/skills/` | `.claude/skills/` | 已有 |
| `scripts/*.js` | `.solodevflow/scripts/` | 已有 |
| `src/hooks/` | `.claude/hooks/` | **新增** |

### 3.3 Shared Utilities

共享工具模块位于 `src/hooks/lib/`：

| 模块 | 职责 |
|------|------|
| `state-reader.js` | 读取 state.json，提取 Feature/Session 信息 |
| `kb-client.js` | 调用知识库 CLI，查询相关文档 |
| `output.js` | 输出格式化，生成 `<workflow-context>` |

### 3.4 State Reader Design

```javascript
// src/hooks/lib/state-reader.js

const fs = require('fs');
const path = require('path');

const STATE_PATH = path.join(process.cwd(), '.solodevflow', 'state.json');

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

function getActiveFeature(state) {
  const activeId = state?.flow?.activeFeatures?.[0];
  if (!activeId || !state?.features?.[activeId]) {
    return null;
  }
  return {
    id: activeId,
    ...state.features[activeId]
  };
}

function getSession(state) {
  return state?.session || {
    mode: 'idle',
    pendingRequirements: []
  };
}

module.exports = { readState, getActiveFeature, getSession, STATE_PATH };
```

### 3.5 Knowledge Base Client Design

```javascript
// src/hooks/lib/kb-client.js

const { execFileSync } = require('child_process');
const path = require('path');

const KB_CLI = path.join(process.cwd(), 'src', 'cli', 'knowledge-base.js');

function searchByKeywords(keywords) {
  if (!keywords || keywords.length === 0) {
    return [];
  }

  try {
    // 使用 execFileSync 避免命令注入风险
    const result = execFileSync('node', [KB_CLI, 'search', ...keywords, '--json'], {
      encoding: 'utf-8',
      timeout: 2000
    });
    return JSON.parse(result);
  } catch (err) {
    // Graceful degradation
    return [];
  }
}

function getHookContext() {
  try {
    const result = execFileSync('node', [KB_CLI, 'hook-context', '--json'], {
      encoding: 'utf-8',
      timeout: 2000
    });
    return JSON.parse(result);
  } catch (err) {
    return null;
  }
}

module.exports = { searchByKeywords, getHookContext };
```

### 3.6 Keyword Extraction

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
Pending Sparks: {flow.pendingSparks.length}
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
| relevantDocs | knowledge-base search | Related documents (keyword match) |
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

基于需求 §9.4，阶段守卫规则如下：

| 当前阶段 | 阻止操作 | 原因 |
|----------|----------|------|
| `pending` | Write/Edit 任意文件（Read 除外） | 初始阶段，尚未开始工作 |
| `feature_requirements` | Write/Edit `src/**/*.{js,ts}`, `tests/**/*` | 需求阶段不应写代码/测试 |
| `feature_design` | Write/Edit `src/**/*.{js,ts}`, `tests/**/*` | 设计阶段不应写代码/测试 |
| 任意 | Edit `.solodevflow/state.json` | 使用 State CLI 而非直接编辑 |

#### 4.3.2 Protected File Rules

| 文件模式 | 保护行为 | 原因 |
|----------|----------|------|
| `.solodevflow/state.json` | block | 使用 `node scripts/state.js` 管理 |
| `.env`, `*.key`, `*.pem` | block | 安全敏感文件 |
| `docs/specs/*.md` | ask | 触发警告，提示运行影响分析 |

#### 4.3.3 Auto-Approve Rules

| 工具 | 文件模式 | 决策 |
|------|----------|------|
| Read | `*.md`, `*.json`, `*.txt` | allow |
| Read | `docs/**/*` | allow |
| Glob | `*` | allow |
| Grep | `*` | allow |

### 4.4 PostToolUse Hook (Optional)

**Input** (stdin JSON):
```typescript
interface PostToolUseInput {
  session_id: string;
  cwd: string;
  hook_event_name: 'PostToolUse';
  tool_name: 'Write' | 'Edit';
  tool_input: { file_path: string };
  tool_response: { success: boolean };
}
```

**Output** (stdout plain text):
Validation result message, injected as context.

#### 4.4.1 Validation Rules

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
| 知识库调用方式 | require 模块 / 调用 CLI | CLI (execFileSync) | 解耦、独立进程、避免状态污染、便于测试 |
| PreToolUse matcher | Write\|Edit / Write\|Edit\|Bash | +Bash | 危险 shell 命令（rm -rf, git push --force）也需要阶段守卫保护 |
| 关键词提取 | 复杂分词 / 简单空格分词 | 简单空格分词 | MVP 足够，未来可扩展 |
| input-log.md | 同步实现 / 延后实现 | 延后 (Phase 2) | 依赖 input-capture feature (soft dependency) |

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

### 6.2 Phase 2: Knowledge Integration (P2)

| Task | Description |
|------|-------------|
| 2.1 | Create `src/hooks/lib/kb-client.js` |
| 2.2 | Implement `src/hooks/user-prompt-submit.js` (含关键词提取) |
| 2.3 | Implement input-log.md recording (依赖 input-capture) |
| 2.4 | Test knowledge-base integration |

### 6.3 Phase 3: Optional Enhancement (P3)

| Task | Description |
|------|-------------|
| 3.1 | Implement `src/hooks/post-tool-use.js` (含验证规则) |
| 3.2 | Integration testing |

---

## 7. Dependencies <!-- id: design_hooks_dependencies -->

| Dependency | Type | Description |
|------------|------|-------------|
| feat_state_management | hard | Read state.json for project/feature/session info |
| feat_knowledge_base | hard | searchByKeywords(), getContextForHook() |
| feat_input_capture | soft | input-log.md recording (Phase 2) |
| cap_document_validation | soft | PostToolUse calls validation scripts |

---

## 8. Error Handling <!-- id: design_hooks_errors -->

Based on requirements §9.10:

| Scenario | Handling | Exit Code |
|----------|----------|-----------|
| state.json not found | stderr hint to initialize, continue | 0 |
| state.json parse error | stderr show error, block startup | 2 |
| knowledge.db not found | Graceful degradation, empty context | 0 |
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

*Version: v1.2*
*Created: 2025-12-25*
*Updated: 2025-12-25*
*Changes: v1.2 源代码与运行时分离（src/hooks/ vs .claude/hooks/），通过扩展现有 scripts/init.js 部署; v1.1 修复 Frontmatter 格式、补充详细规则表、使用 execFileSync 防注入、添加 Decision Record*
*Author: Claude Opus 4.5*
