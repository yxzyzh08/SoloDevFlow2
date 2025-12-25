---
type: flow
version: "5.2"
priority: P0
domain: process
---

# Flow: Workflows <!-- id: flow_workflows -->

> 标准工作流，定义人机协作的输入处理和流程路由

**执行规范**：[.solodevflow/flows/workflows.md]
---

## 1. Overview <!-- id: flow_overview -->

### 1.1 Purpose

定义人机协作的标准流程框架：
- 输入分类：识别用户输入类型（咨询/需求/混合）
- 流程路由：将输入路由到对应的处理流程
- 状态管理：跨对话保持上下文
- 不打断原则：临时需求暂存，不中断当前流程

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
│  ┌─────────┐    ┌─────────────┐    ┌──────────────────┐     │
│  │ 读取    │ → │ 汇报状态    │ → │ 等待用户指示     │     │
│  │ state   │    │             │    │                  │     │
│  └─────────┘    └─────────────┘    └──────────────────┘     │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                   Input Analysis                             │
│                                                              │
│  ┌─────────────┐                                            │
│  │ 用户输入   │                                            │
│  └──────┬──────┘                                            │
│         ↓                                                    │
│  ┌─────────────┐                                            │
│  │ 意图识别   │                                            │
│  └──────┬──────┘                                            │
│         ↓                                                    │
│  ┌──────┴──────┬──────────┬──────────┬──────────┬────────┐ │
│  ↓             ↓          ↓          ↓          ↓        ↓ │
│ 直接执行   产品咨询   新增需求   需求变更   规范变更  无关想法│
│  ↓             ↓          ↓          ↓          ↓        ↓ │
│ 立即       咨询流程   需求流程   变更流程   影响分析   拒绝 │
│ 执行                   (阶段守卫) (阶段守卫)            ↓  │
│                                                    建议新项目│
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Input Analysis Flow <!-- id: flow_input_analysis -->

> 每次接收用户输入，首先进行输入分析

### 3.1 判断逻辑

```
Step 1: 判断输入类型
  ├─ 直接执行：简单明确的操作指令（简单 bug 修复、快速查询、单步操作）
  ├─ 产品咨询：询问功能、进度、实现方式、关联项目状态
  ├─ 新增需求：描述新功能需求、想做什么新东西
  ├─ 需求变更：修改已有功能的行为或描述
  ├─ 规范变更：修改文档规范、模板、写作规则
  ├─ 无关想法：与本产品完全无关的想法
  └─ 无法判断：向用户澄清

Step 2: 路由到对应流程
  ├─ 直接执行 → 立即执行，不走流程
  ├─ 产品咨询 → 产品咨询流程（含关联项目查询）
  ├─ 新增需求 → 新增需求流程
  ├─ 需求变更 → 需求变更流程
  ├─ 规范变更 → 规范变更流程
  └─ 无关想法 → 直接拒绝，建议创建新项目（不记录，避免污染上下文）
```

### 3.2 直接执行判断标准

| 类型 | 识别信号 | 示例 |
|------|----------|------|
| **简单 bug 修复** | 明确的代码问题 + 范围清晰 | "修复这个空指针"、"改正拼写错误" |
| **快速查询** | 查看/显示/检查 | "查看这个文件"、"显示 git 日志" |
| **简单操作** | 运行/执行/格式化 | "运行测试"、"格式化代码" |

**关键判断**：
- ✅ 不涉及设计或需求变更
- ✅ 不需要文档更新
- ✅ 单步操作可完成
- ✅ 范围明确、可直接定位

**边界场景**：
- "修复登录问题" → ❌ 不是直接执行（问题不明确，需要先咨询调查）
- "修复 login.js 第 42 行的空指针" → ✅ 直接执行（问题明确）

### 3.3 混合输入处理原则

- **咨询优先**：先回答咨询问题
- **需求暂存**：提取的需求存入 `session.pendingRequirements`
- **不打断**：不中断当前咨询去处理需求
- **自动提示**：咨询回答后，提示有临时需求待处理

---

## 4. Session State Management <!-- id: flow_session_state -->

> 跨对话保持上下文，支持咨询/需求混合场景

### 4.1 状态结构

```json
{
  "session": {
    "mode": "idle | consulting | delivering",
    "context": {
      "topic": "当前主题",
      "relatedFeatures": [],
      "pendingRequirements": []
    }
  }
}
```

### 4.2 模式定义

| 模式 | 说明 | 进入条件 | 退出条件 |
|------|------|----------|----------|
| `idle` | 空闲 | Session 开始 / 任务完成 | 接收到输入 |
| `consulting` | 咨询中 | 纯咨询或咨询+需求 | 隐式/显式结束 |
| `delivering` | 需求交付中 | 纯需求 / 处理临时需求 | 交付完成 |

### 4.3 咨询结束判断

- **隐式结束**：AI 判断用户开始描述纯需求
- **显式结束**：用户说"咨询完了"、"没问题了"
- **Hook 辅助**：`UserPromptSubmit` 注入当前状态，辅助判断

---

## 5. Consulting Delivery Flow <!-- id: flow_consulting -->

> 咨询交付流程：回答产品咨询，支持混合输入

### 5.1 流程步骤

```
[用户输入]
    ↓
[分析是否包含需求成分]
    ↓
   ┌─ 是 → [提取需求] → [存入 pendingRequirements]
   └─ 否 → [继续]
    ↓
[加载 PRD]
    ↓
[识别关联的 Feature/Flow/Capability]
    ↓
[加载相关文档]
    ↓
[生成回答]
    ↓
[检查 pendingRequirements]
    ↓
 ┌─ 有 → 附加提示
 └─ 无 → 等待下一输入
```

### 5.2 核心行为

- 加载 PRD，查询关联内容
- 通过 state.json 的 docPath 定位相关文档
- 回答后检查临时需求，有则提示

> **待细化**：需求提取的具体规则、PRD 关联查询机制

---

## 6. Requirements Delivery Flow <!-- id: flow_requirements -->

> 需求交付流程：处理功能需求

### 6.1 流程步骤

```
[需求输入]
    ↓
[需求清晰度检查]
    ↓
 ┌─ 模糊 → [requirements-expert 澄清] → [返回]
 └─ 清晰 → [继续]
    ↓
[关系分析：扩展/依赖/影响]
    ↓
[确定文档类型：PRD/Feature/Capability/Flow]
    ↓
[调用 /write-* 命令]
    ↓
[等待用户审核]
```

### 6.2 核心原则

- **Document-First**：先更新文档，后写代码
- **关系分析**：新需求与现有 Feature 的关系
- **规范遵循**：使用 /write-* 命令确保符合规范

---

## 7. Pending Requirements Processing <!-- id: flow_pending_requirements -->

> 处理咨询过程中积累的临时需求

### 7.1 触发条件

- 用户说"处理需求"、"看看临时需求"
- 咨询结束后自动提示

### 7.2 处理方式

| 选择 | 动作 |
|------|------|
| 转为正式需求 | → 需求交付流程 |
| 暂时保留 | 保持在 pendingRequirements |
| 丢弃 | 从列表移除 |

---

## 8. Other Flows (Reference) <!-- id: flow_others -->

> 流程索引，详细定义待细化

| 流程 | 触发条件 | 核心行为 |
|------|----------|----------|
| **Session Start** | 对话开始 | 读取状态、汇报、等待指示 |
| **产品咨询** | 询问功能/进度/实现/关联项目 | 加载 PRD 和相关文档，生成回答 |
| **新增需求** | 描述新功能需求 | 需求澄清 → 关系分析 → 文档生成 |
| **需求变更** | 修改已有功能 | 定位已有需求 → 评估影响 → 更新文档 |
| **规范变更** | 修改规范/模板 | 运行影响分析 → 生成 subtasks → 逐项更新 |

**守卫机制**（非独立流程）：

| 守卫 | 触发位置 | 核心行为 |
|------|----------|----------|
| **阶段守卫** | 新增需求/需求变更流程内 | 检测阶段不符 → 提供选项：切换/取消 |

**已移除**：

| 原流程 | 处理方式 |
|--------|----------|
| Spark Handling | 无关想法直接拒绝，不记录 |
| 关联项目查询 | 合并到产品咨询流程 |

---

## 9. Hooks Integration <!-- id: flow_hooks -->

> Claude Code Hooks 配置，实现工作流自动化

### 9.1 Hook 架构概览

```
┌──────────────────────────────────────────────────────────────────┐
│                        Claude Code Session                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  [SessionStart] ─────────────────────────────────────────────────┐│
│       ↓                                                          ││
│  加载 state.json → 注入产品状态 → 设置环境变量                   ││
│                                                                    │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  [UserPromptSubmit] ─────────────────────────────────────────────┐│
│       ↓                                                          ││
│  用户输入 → 知识库查询 → 注入上下文 + 相关文档                   ││
│                     ↓                                             ││
│              记录关键输入 → input-log.md                          ││
│                                                                    │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  [PreToolUse] ───────────────────────────────────────────────────┐│
│       ↓                                                          ││
│  工具调用 → 阶段守卫检查 → 保护关键文件 → 允许/阻止              ││
│                                                                    │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  [PostToolUse] (可选) ───────────────────────────────────────────┐│
│       ↓                                                          ││
│  Write/Edit 完成 → 文档验证 → 自动格式化                         ││
│                                                                    │
└──────────────────────────────────────────────────────────────────┘
```

**实现优先级**：

| 优先级 | Hook | 说明 | 依赖 |
|--------|------|------|------|
| P1 | SessionStart | 基础功能，注入产品状态 | state.json |
| P1 | PreToolUse | 安全守卫，阻止危险操作 | state.json |
| P2 | UserPromptSubmit | 核心功能，需知识库支持 | knowledge-base |
| P3 | PostToolUse | 可选增强，文档验证 | document-validation |

### 9.2 SessionStart Hook <!-- id: flow_hooks_session_start -->

**触发时机**：对话启动或恢复时（source: "startup" | "resume" | "clear"）

**职责**：
1. 读取 `.solodevflow/state.json`
2. 注入产品状态作为上下文
3. 设置环境变量（可选）

**输入**（stdin JSON）：
```json
{
  "session_id": "abc123",
  "cwd": "/path/to/project",
  "hook_event_name": "SessionStart",
  "source": "startup"
}
```

**输出**（stdout 纯文本，作为上下文注入）：
```
<workflow-context>
项目: SoloDevFlow 2.0
活跃 Feature: project-init (in_progress)
待处理灵光: 0
</workflow-context>
```

**实现要点**：
- 退出码 0：成功，stdout 注入上下文
- 退出码 2：阻止启动，stderr 显示错误
- 使用 `$CLAUDE_ENV_FILE` 设置持久化环境变量

**验收标准**：

| Item | Verification | Pass Criteria |
|------|--------------|---------------|
| 状态加载 | 启动 Claude Code | 自动显示项目状态 |
| 错误处理 | state.json 不存在时 | 提示初始化命令 |

### 9.3 UserPromptSubmit Hook <!-- id: flow_hooks_user_prompt_submit -->

**触发时机**：用户提交输入前，Claude 处理前

**职责**：
1. 调用知识库 `getContextForHook()` 获取精简上下文
2. 调用知识库 `searchByKeywords()` 查找相关文档
3. 记录关键输入到 `input-log.md`
4. 注入 session 状态（mode, pendingRequirements）

> **注**：意图识别由 Claude 主 Agent 根据 workflows.md 规则完成，Hook 只提供上下文数据。

**输入**（stdin JSON）：
```json
{
  "session_id": "abc123",
  "cwd": "/path/to/project",
  "hook_event_name": "UserPromptSubmit",
  "prompt": "用户的实际输入内容"
}
```

**输出**（stdout JSON，使用 additionalContext）：
```json
{
  "hookSpecificOutput": {
    "hookEventName": "UserPromptSubmit",
    "additionalContext": "<workflow-context>\n产品: SoloDevFlow 2.0\n活跃 Feature: project-init\n当前模式: idle\n暂存需求: 0\n相关文档: fea-project-init.md\n</workflow-context>"
  }
}
```

**上下文注入内容**（~200 tokens）：

| 字段 | 来源 | 说明 |
|------|------|------|
| `productName` | state.json | 产品名称 |
| `activeFeature` | state.json | 当前活跃 Feature |
| `relevantDocs` | knowledge-base | 相关文档列表（基于关键词匹配） |
| `sessionMode` | state.json.session | idle/consulting/delivering |
| `pendingCount` | state.json.session | 暂存需求数量 |

> **注**：session 状态（mode, pendingRequirements）存储在 `state.json.session` 字段，而非 Hook 进程内存。每次 Hook 调用都是独立进程，无法保持内存状态。

**关键输入记录规则**：

| 输入类型 | 是否记录 | 说明 |
|----------|----------|------|
| 需求描述 | ✅ | 包含"想要"、"需要"、"添加" |
| 决策确认 | ✅ | 包含"确认"、"同意"、"批准" |
| 变更请求 | ✅ | 包含"修改"、"更新"、"删除" |
| 简单查询 | ❌ | "查看"、"显示"、"运行" |
| 闲聊 | ❌ | 无业务关键词 |

**验收标准**：

| Item | Verification | Pass Criteria |
|------|--------------|---------------|
| 上下文注入 | 任意输入 | 返回 ~200 tokens 上下文 |
| 相关文档查询 | "登录功能怎么实现的" | relevantDocs 包含相关 Feature |
| 关键输入记录 | "我想添加导出功能" | 记录到 input-log.md |
| 普通输入忽略 | "查看 git 日志" | 不记录 |
| 模式注入 | 查看上下文 | 包含 sessionMode 和 pendingCount |

### 9.4 PreToolUse Hook <!-- id: flow_hooks_pre_tool_use -->

**触发时机**：Claude 调用工具前（参数已创建，执行前）

**职责**：
1. 阶段守卫：检测阶段不符操作
2. 保护关键文件：防止误操作
3. 自动批准安全操作

**输入**（stdin JSON）：
```json
{
  "session_id": "abc123",
  "cwd": "/path/to/project",
  "hook_event_name": "PreToolUse",
  "tool_name": "Write",
  "tool_input": {
    "file_path": "/path/to/file.js",
    "content": "..."
  },
  "tool_use_id": "toolu_01ABC123"
}
```

**输出决策**：

| 决策 | 输出格式 | 效果 |
|------|----------|------|
| 允许 | `{"decision": "allow"}` | 自动批准，跳过权限确认 |
| 阻止 | `{"decision": "block", "reason": "..."}` | 阻止执行，reason 反馈给 Claude |
| 询问 | `{"decision": "ask"}` | 请求用户确认 |
| 不干预 | 退出码 0，无输出 | 使用默认权限系统 |

**阶段守卫规则**：

> 阶段定义参考 fea-state-management §5.2：`pending` → `feature_requirements` → `feature_design` → `feature_implementation` → ...

| 当前阶段 | 阻止操作 | 原因 |
|----------|----------|------|
| `pending` | Write/Edit 任意文件（Read 除外） | 初始阶段，尚未开始工作 |
| `feature_requirements` | Write/Edit `src/**/*.{js,ts}`, `tests/**/*` | 需求阶段不应写代码/测试 |
| `feature_design` | Write/Edit `src/**/*.{js,ts}`, `tests/**/*` | 设计阶段不应写代码/测试 |
| 任意 | Edit `.solodevflow/state.json` | 使用 State CLI 而非直接编辑 |

**保护文件规则**：

| 文件模式 | 保护行为 |
|----------|----------|
| `.solodevflow/state.json` | 阻止直接 Edit，提示使用 `node scripts/state.js` |
| `.env`, `*.key`, `*.pem` | 阻止 Read/Write，安全保护 |
| `docs/specs/*.md` | 触发警告，提示运行影响分析 |

**自动批准规则**：

| 工具 | 文件模式 | 决策 |
|------|----------|------|
| Read | `*.md`, `*.json`, `*.txt` | allow |
| Read | `docs/**/*` | allow |
| Glob | `*` | allow |
| Grep | `*` | allow |

**验收标准**：

| Item | Verification | Pass Criteria |
|------|--------------|---------------|
| 阶段守卫 | pending 阶段写 src/*.js | 阻止并提示 |
| 文件保护 | 直接 Edit state.json | 阻止并建议 CLI |
| 规范警告 | Edit docs/specs/*.md | 显示警告 |
| 自动批准 | Read *.md | 无需确认 |

### 9.5 PostToolUse Hook（可选）<!-- id: flow_hooks_post_tool_use -->

**触发时机**：工具执行成功后

**职责**：
1. 文档变更后自动验证
2. 代码格式化（可选）

**输入**（stdin JSON）：
```json
{
  "session_id": "abc123",
  "hook_event_name": "PostToolUse",
  "tool_name": "Write",
  "tool_input": { "file_path": "docs/requirements/features/fea-xxx.md" },
  "tool_response": { "success": true }
}
```

**Matcher 配置**：

```json
{
  "matcher": "Write|Edit",
  "hooks": [...]
}
```

**验证规则**：

| 文件模式 | 验证动作 |
|----------|----------|
| `docs/requirements/**/*.md` | 运行 `npm run validate:docs` |
| `docs/specs/**/*.md` | 运行 `npm run validate:docs` |
| `.solodevflow/*.json` | 运行 `npm run validate:state` |

**验收标准**：

| Item | Verification | Pass Criteria |
|------|--------------|---------------|
| 文档验证 | Write docs/**/*.md 后 | 自动运行验证 |
| 验证失败 | 格式错误 | 显示错误信息 |

### 9.6 配置文件结构 <!-- id: flow_hooks_config -->

**配置路径**：`.claude/settings.json`

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
        "matcher": "Write|Edit",
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

### 9.7 Hook 脚本目录结构 <!-- id: flow_hooks_structure -->

```
.claude/
├── settings.json           # Hook 配置
└── hooks/
    ├── session-start.js    # SessionStart Hook
    ├── user-prompt-submit.js # UserPromptSubmit Hook
    ├── pre-tool-use.js     # PreToolUse Hook
    └── post-tool-use.js    # PostToolUse Hook (可选)
```

### 9.8 Dependencies <!-- id: flow_hooks_dependencies -->

| Dependency | Type | 说明 |
|------------|------|------|
| knowledge-base | hard | UserPromptSubmit 调用 `getContextForHook()` |
| state-management | hard | SessionStart 读取 state.json |
| input-capture | soft | UserPromptSubmit 记录关键输入 |
| document-validation | soft | PostToolUse 调用验证脚本 |

### 9.9 安全最佳实践 <!-- id: flow_hooks_security -->

**必须遵守**：
- ✅ 验证和清理 stdin JSON 输入
- ✅ 总是引用变量：`"$VAR"` 而非 `$VAR`
- ✅ 使用绝对路径
- ✅ 检查路径遍历：拒绝包含 `..` 的路径
- ✅ 跳过敏感文件：`.env`、密钥文件

**禁止**：
- ❌ 信任来自 Claude 的输入
- ❌ 将 Hook 作为代码执行
- ❌ 在 Hook 中执行危险命令

### 9.10 错误处理规范 <!-- id: flow_hooks_error_handling -->

| 场景 | 处理方式 | 退出码 |
|------|----------|--------|
| state.json 不存在 | stderr 提示初始化，继续执行 | 0 |
| state.json 解析失败 | stderr 显示错误，阻止启动 | 2 |
| knowledge.db 不存在 | 降级处理，返回空上下文 | 0 |
| 验证脚本失败 | 记录错误到 stderr，不阻止工具执行 | 0 |
| Hook 脚本异常 | stderr 显示错误，使用默认行为 | 1 |

---

## 10. Execution Principles <!-- id: flow_principles -->

### 始终做

- 每次输入 → 先分析输入类型（直接执行？咨询？需求？）
- 直接执行 → 简单 bug/查询/操作，立即执行不走流程
- 咨询+需求 → 提取需求暂存，先回答咨询
- 回答后 → 检查临时需求，有则提示
- 状态更新 → 通过 State CLI，不直接编辑

### 绝不做

- 咨询过程中打断去处理需求
- 跳过输入分析直接执行（除非明确判断为"直接执行"类型）
- 丢失用户的临时需求
- 将复杂问题错判为"直接执行"

---

*Version: v5.5*
*Created: 2024-12-20*
*Updated: 2025-12-25*
*Changes: v5.5 §9 Hooks 优化：统一标签命名、明确 session 状态存储位置、修正阶段守卫规则、添加实现优先级和错误处理规范; v5.4 移除 suggestedType（意图识别由 Claude 完成，知识库仅提供静态数据）; v5.3 细化 §9 Hooks Integration; v5.2 添加 frontmatter 可选字段; v5.1 新增"直接执行"路径*
