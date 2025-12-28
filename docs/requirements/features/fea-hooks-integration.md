---
type: feature
id: hooks-integration
workMode: code
status: done
priority: P0
domain: ai-config
version: "1.1"
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

**阶段守卫规则**：

| 当前阶段 | 阻止操作 | 原因 |
|----------|----------|------|
| `pending` | Write/Edit 任意文件 | 初始阶段，尚未开始工作 |
| `feature_requirements` | Write/Edit `src/**/*.{js,ts}`, `tests/**/*` | 需求阶段不应写代码 |
| `feature_design` | Write/Edit `src/**/*.{js,ts}`, `tests/**/*` | 设计阶段不应写代码 |
| 任意 | Edit `.solodevflow/state.json` | 使用 State CLI |

### 3.4 H4: PreToolUse 文件保护

**保护规则**：

| 文件模式 | 行为 | 原因 |
|----------|------|------|
| `.solodevflow/state.json` | block | 使用 `node scripts/state.js` |
| `.env`, `*.key`, `*.pem` | block | 安全敏感文件 |
| `docs/specs/*.md` | ask | 提示运行影响分析 |

---

## 4. Acceptance Criteria <!-- id: feat_hooks_integration_acceptance -->

| Item | Verification | Pass Criteria |
|------|--------------|---------------|
| SessionStart 输出 | 启动 Claude Code | 显示 `<workflow-context>` 标签 |
| UserPromptSubmit 输出 | 输入任意内容 | 上下文包含当前 Feature |
| 阶段守卫 - 需求阶段 | 在 `feature_requirements` 阶段尝试 Edit `src/test.js` | 操作被阻止 |
| 文件保护 - state.json | 尝试 Edit `.solodevflow/state.json` | 操作被阻止，提示使用 CLI |
| 规范修改提示 | 修改 `docs/specs/*.md` | 显示 ask 确认 |

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
| `src/hooks/session-start.js` | SessionStart Hook |
| `src/hooks/user-prompt-submit.js` | UserPromptSubmit Hook |
| `src/hooks/pre-tool-use.js` | PreToolUse Hook |
| `src/hooks/post-tool-use.js` | PostToolUse Hook |
| `.claude/settings.json` | Hooks 配置 |

### 7.2 Configuration

`.claude/settings.json` 需包含 hooks 字段配置。

### 7.3 Error Handling

| 场景 | 处理方式 | Exit Code |
|------|----------|-----------|
| state.json 不存在 | stderr 提示初始化，继续 | 0 |
| state.json 解析失败 | stderr 显示错误，阻止启动 | 2 |
| index.json 不存在 | 优雅降级，运行 scripts/index.js | 0 |
| Hook 脚本异常 | stderr 显示错误，使用默认行为 | 1 |

---

*Version: v1.0*
*Created: 2025-12-27*
*Updated: 2025-12-27*
