# Claude CLI Platform Capabilities <!-- id: ref_claude_cli -->

> SoloDevFlow 运行时平台能力参考 | AI 决策依据 | 需求设计基础

---

## Quick Reference <!-- id: ref_quick -->

### Capability Matrix

| 系统 | 用途 | 触发方式 | 配置位置 |
|------|------|----------|----------|
| **Skills** | 自动化专业能力 | 语义匹配（自动） | `.claude/skills/*/SKILL.md` |
| **Commands** | 快捷提示模板 | `/command`（显式） | `.claude/commands/*.md` |
| **Subagents** | 专业化独立 Agent | 自动委托/显式调用 | `.claude/agents/*/AGENT.md` |
| **MCP** | 外部工具协议 | 工具调用 | `.mcp.json` |
| **Hooks** | 生命周期拦截 | 事件触发（自动） | `settings.json` |

### Tool Selection Matrix

| 需求场景 | 推荐工具 | 避免使用 |
|----------|----------|----------|
| 读取文件内容 | `Read` | `Bash(cat)` |
| 搜索文件名 | `Glob` | `Bash(find)` |
| 搜索文件内容 | `Grep` | `Bash(grep/rg)` |
| 修改现有文件 | `Edit` | `Bash(sed)` |
| 创建新文件 | `Write` | `Bash(echo >)` |
| 执行命令 | `Bash` | - |
| 多文件探索 | `Task(Explore)` | 逐个 Grep |
| 复杂任务委托 | `Task(general-purpose)` | 手动多步 |

### Capability Boundaries

| 能力 | ✓ 支持 | ✗ 不支持 |
|------|--------|----------|
| 文件操作 | 读/写/编辑/搜索 | 二进制文件编辑 |
| 命令执行 | 任意 shell 命令 | 交互式命令 (vim, less) |
| 网络访问 | WebFetch, WebSearch, MCP | 直接 HTTP 请求 |
| 状态持久化 | 文件系统 | 内存跨会话 |
| 并行执行 | 多工具并行调用 | 后台进程管理 |
| 外部集成 | MCP 服务器 | 原生 SDK 调用 |

---

## 1. Core Tools <!-- id: ref_tools -->

### 1.1 File Operations

| Tool | 用途 | 关键参数 | 限制 |
|------|------|----------|------|
| `Read` | 读取文件 | `file_path`, `offset?`, `limit?` | 单次 2000 行 |
| `Write` | 创建/覆盖文件 | `file_path`, `content` | 必须先 Read |
| `Edit` | 精确替换 | `file_path`, `old_string`, `new_string` | old_string 必须唯一 |
| `Glob` | 文件名搜索 | `pattern`, `path?` | glob 语法 |
| `Grep` | 内容搜索 | `pattern`, `path?`, `glob?`, `output_mode?` | regex 语法 |

#### 决策规则

```
文件读取：
  < 2000 行 → Read（无 offset/limit）
  > 2000 行 → Grep 定位 + Read 分段

文件修改：
  精确替换 → Edit（old_string 唯一）
  全局替换 → Edit（replace_all: true）
  新建文件 → Write

文件搜索：
  找文件名 → Glob
  找内容 → Grep
  开放探索 → Task(Explore)
```

### 1.2 Command Execution

```typescript
interface BashInput {
  command: string;
  timeout?: number;           // 默认 120000ms，最大 600000ms
  run_in_background?: boolean;
}
```

**使用规则**：

| 场景 | 用 Bash | 用专用工具 |
|------|---------|-----------|
| 读/写/搜文件 | ✗ | Read/Write/Edit/Glob/Grep |
| git 操作 | ✓ | - |
| npm/node 命令 | ✓ | - |
| 自定义脚本 | ✓ | - |

### 1.3 Web Access

| Tool | 用途 | 限制 |
|------|------|------|
| `WebFetch` | 获取网页内容 | 需要 prompt 处理内容 |
| `WebSearch` | 搜索引擎查询 | 仅美国可用 |

---

## 2. Skills System <!-- id: ref_skills -->

### 2.1 概念

**Skills** = 自动发现的专业能力扩展

```
工作流：
1. Discovery → 启动时加载名称+描述
2. Activation → 语义匹配用户请求
3. Execution → 加载完整 SKILL.md 执行
```

### 2.2 目录结构

```
.claude/skills/           # 项目级
~/.claude/skills/         # 用户级

my-skill/
├── SKILL.md              # 必需（< 500 行）
├── reference.md          # 详细文档（按需加载）
├── examples.md           # 使用示例
└── scripts/
    └── validate.py       # 辅助脚本
```

### 2.3 SKILL.md 格式

```yaml
---
name: skill-identifier          # 必需，小写+连字符
description: |                  # 必需，≤1024 字符
  清晰描述功能和触发关键词。
  包含用户会说的词汇（重要！）
allowed-tools: Read, Grep, Bash # 可选，工具白名单
model: sonnet                   # 可选，指定模型
---

# Skill 标题

## 核心指导
[执行说明]

## 验证清单
[质量检查项]
```

### 2.4 vs Commands 对比

| 维度 | Skills | Commands |
|------|--------|----------|
| 触发 | 自动（语义匹配） | 显式（`/command`） |
| 复杂度 | 多文件、脚本链 | 单文件模板 |
| 用途 | 复杂工作流 | 快速重复任务 |

---

## 3. Commands System <!-- id: ref_commands -->

### 3.1 概念

**Slash Commands** = 显式调用的提示模板

### 3.2 目录结构

```
.claude/commands/          # 项目级
~/.claude/commands/        # 用户级

commands/
├── fix-issue.md
├── review-pr.md
└── frontend/              # 子目录分组
    └── component.md
```

### 3.3 Command 格式

```yaml
---
allowed-tools: Bash(git:*), Read, Grep   # 可选
argument-hint: [message] [branch]        # 参数提示
description: 创建 git 提交                # 描述
model: sonnet                            # 可选
---

# 提交辅助

## 上下文
当前分支：!`git branch --show-current`
暂存变更：!`git diff --cached`

## 任务
基于变更创建提交信息。

## 参数
- $1：提交标题
- $2：目标分支（可选）
```

### 3.4 特殊语法

| 语法 | 用途 | 示例 |
|------|------|------|
| `$ARGUMENTS` | 所有参数 | `/cmd arg1 arg2` → `"arg1 arg2"` |
| `$1`, `$2`... | 单个参数 | `/cmd v1 v2` → `$1="v1"` |
| `!`command`` | 执行 Bash | `!`git status`` |
| `@path` | 引用文件 | `@src/index.ts` |

---

## 4. Subagents System <!-- id: ref_subagents -->

### 4.1 概念

**Subagents** = 独立上下文的专业化 AI 助手

```
特点：
- 独立上下文窗口
- 专属工具权限
- 自定义系统提示
- 可恢复对话
```

### 4.2 内置 Subagents

| Agent | 模型 | 用途 | 工具 |
|-------|------|------|------|
| `Explore` | Haiku | 快速代码搜索 | Glob, Grep, Read |
| `Plan` | Sonnet | 规划模式研究 | 全部（只读） |
| `general-purpose` | Sonnet | 复杂多步任务 | 全部 |

### 4.3 自定义 Subagent

```yaml
# .claude/agents/code-reviewer/AGENT.md
---
name: code-reviewer
description: |
  资深代码审查专家。代码修改后自动使用。
  Use proactively。
tools: Read, Grep, Glob, Bash
model: opus
permissionMode: default
skills: code-review-standards
---

# 代码审查 Agent

您是资深代码审查专家。

## 调用时
1. 运行 `git diff` 查看改动
2. 关注修改的文件
3. 立即开始审查

## 审查清单
- 安全漏洞
- 性能问题
- 代码风格
```

### 4.4 AGENT.md 字段

| 字段 | 必需 | 说明 |
|------|------|------|
| `name` | 是 | 唯一标识符 |
| `description` | 是 | 含 "Use proactively" 可自动触发 |
| `tools` | 否 | 工具白名单 |
| `model` | 否 | `sonnet`/`opus`/`haiku`/`inherit` |
| `permissionMode` | 否 | `default`/`acceptEdits`/`bypassPermissions` |
| `skills` | 否 | 预加载的 Skills |

---

## 5. MCP System <!-- id: ref_mcp -->

### 5.1 概念

**MCP (Model Context Protocol)** = 外部工具标准协议

```
类型：
- HTTP Server → 云服务（GitHub, Sentry, Notion）
- Stdio Server → 本地进程（数据库, 脚本）
```

### 5.2 配置命令

```bash
# HTTP 服务器
claude mcp add --transport http github https://api.githubcopilot.com/mcp/

# Stdio 服务器
claude mcp add --transport stdio postgres \
  --env DATABASE_URL=postgresql://localhost/db \
  -- npx @bytebase/dbhub

# 管理
claude mcp list
claude mcp remove <name>
```

### 5.3 作用域

| 作用域 | 位置 | 共享 | 优先级 |
|--------|------|------|--------|
| Local | `~/.claude.json`（项目目录） | 个人 | 最高 |
| Project | `.mcp.json` | 团队 | 中 |
| User | `~/.claude.json`（用户目录） | 个人 | 最低 |

### 5.4 .mcp.json 格式

```json
{
  "mcpServers": {
    "github": {
      "type": "http",
      "url": "https://api.githubcopilot.com/mcp/",
      "headers": {
        "Authorization": "Bearer ${GITHUB_TOKEN}"
      }
    },
    "postgres": {
      "type": "stdio",
      "command": "npx",
      "args": ["@bytebase/dbhub"],
      "env": {
        "DATABASE_URL": "${DB_URL}"
      }
    }
  }
}
```

### 5.5 MCP 工具命名

```
格式：mcp__<server>__<tool>

示例：
mcp__github__search_repositories
mcp__postgres__query

匹配：
mcp__github__*     # GitHub 所有工具
mcp__*__write*     # 所有 write 工具
```

---

## 6. Hooks System <!-- id: ref_hooks -->

### 6.1 Hook 事件

| Hook | 触发时机 | 用途 | 输出 |
|------|----------|------|------|
| `SessionStart` | 会话开始 | 初始化上下文 | stdout text |
| `UserPromptSubmit` | 用户输入后 | 注入上下文 | JSON |
| `PreToolUse` | 工具执行前 | 拦截/修改/批准 | JSON decision |
| `PostToolUse` | 工具执行后 | 验证/记录 | stdout text |
| `Stop` | Claude 停止 | 强制继续 | JSON |
| `SubagentStop` | Subagent 停止 | 评估完成度 | JSON |
| `Notification` | 通知事件 | 外部通知 | - |

### 6.2 Hook 配置

```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Bash|Edit|Write",
      "hooks": [{
        "type": "command",
        "command": "node .claude/hooks/pre-tool-use.cjs",
        "timeout": 30
      }]
    }],
    "UserPromptSubmit": [{
      "hooks": [{
        "type": "command",
        "command": "node .claude/hooks/user-prompt-submit.cjs"
      }]
    }],
    "SessionStart": [{
      "matcher": "startup",
      "hooks": [{
        "type": "command",
        "command": "bash .claude/hooks/setup.sh"
      }]
    }]
  }
}
```

### 6.3 Hook 输入 Schema

```typescript
// 通用字段
interface HookInput {
  session_id: string;
  cwd: string;
  hook_event_name: string;
}

// PreToolUse
interface PreToolUseInput extends HookInput {
  tool_name: string;
  tool_input: Record<string, any>;
  tool_use_id: string;
}

// UserPromptSubmit
interface UserPromptSubmitInput extends HookInput {
  prompt: string;
}
```

### 6.4 Hook 输出 Schema

```typescript
// PreToolUse
{
  "decision": "allow" | "block" | "ask",
  "reason": "string (required when block)",
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "updatedInput": { /* 修改后的参数 */ }
  }
}

// UserPromptSubmit
{
  "hookSpecificOutput": {
    "hookEventName": "UserPromptSubmit",
    "additionalContext": "<context>...</context>"
  }
}
```

### 6.5 Exit Codes

| Code | 含义 | 效果 |
|------|------|------|
| 0 | 成功 | stdout 注入为上下文 |
| 1 | 错误 | stderr 显示，继续执行 |
| 2 | 阻止 | 阻止操作，stderr 显示 |

### 6.6 Matcher 语法

```
单工具：Write
多工具：Bash|Edit|Write
前缀：Bash*
正则：^(Bash|Write).*
MCP：mcp__github__*
全部：* 或 ""
```

---

## 7. Configuration System <!-- id: ref_config -->

### 7.1 配置优先级

```
Enterprise (最高) > Command Line > Local > Project > User (最低)
```

### 7.2 文件位置

| 用途 | 位置 | 作用域 |
|------|------|--------|
| 项目设置 | `.claude/settings.json` | 团队共享 |
| 本地设置 | `.claude/settings.local.json` | 个人本地 |
| 用户设置 | `~/.claude/settings.json` | 个人全局 |
| 项目内存 | `./CLAUDE.md` | 团队共享 |
| 本地内存 | `./CLAUDE.local.md` | 个人本地 |
| 用户内存 | `~/.claude/CLAUDE.md` | 个人全局 |
| 规则目录 | `.claude/rules/*.md` | 模块化规则 |

### 7.3 settings.json 核心字段

```json
{
  "model": "opus|sonnet|haiku|default",

  "permissions": {
    "allow": ["Bash(npm:*)", "Read(./src/**)"],
    "ask": ["Bash(git push:*)"],
    "deny": ["WebFetch", "Read(.env*)"],
    "defaultMode": "default|acceptEdits|bypassPermissions"
  },

  "hooks": { /* Hook 配置 */ },

  "env": {
    "NODE_ENV": "production"
  }
}
```

### 7.4 关键环境变量

| 变量 | 用途 |
|------|------|
| `ANTHROPIC_MODEL` | 默认模型 |
| `ANTHROPIC_API_KEY` | API 密钥 |
| `BASH_DEFAULT_TIMEOUT_MS` | Bash 超时 |
| `MCP_TIMEOUT` | MCP 超时 |
| `DISABLE_PROMPT_CACHING` | 禁用缓存 |

---

## 8. Context Management <!-- id: ref_context -->

### 8.1 上下文来源

| 来源 | 加载时机 | 优先级 |
|------|----------|--------|
| `CLAUDE.md` | 会话开始 | 高 |
| Hook stdout | 每次触发 | 中 |
| Tool results | 工具调用后 | 低 |

### 8.2 上下文限制

| 限制 | 值 |
|------|------|
| 输入上下文 | ~200K tokens |
| 单次输出 | ~8K tokens |
| 工具结果截断 | 30000 chars |

### 8.3 压缩命令

```bash
/compact                    # 自动压缩
/compact 保持代码修改上下文   # 带焦点压缩
```

---

## 9. Design Implications <!-- id: ref_design -->

### 9.1 Native vs Custom

| 场景 | 使用原生能力 | 自建实现 |
|------|--------------|----------|
| 文件搜索 | Glob, Grep | - |
| 内容索引 | Grep + Read | index.json 摘要 |
| 状态持久化 | 文件读写 | state.json 结构 |
| 工作流控制 | Hooks | 自定义脚本 |
| 文档关系 | - | 锚点 + 引用规范 |
| 外部服务 | MCP | - |
| 专业能力 | Skills | 自定义规范 |

### 9.2 SoloDevFlow 架构决策

| 决策 | 选择 | 原因 |
|------|------|------|
| 知识库 | index.json | 利用原生 Glob/Grep，零依赖 |
| 状态管理 | JSON 文件 | 原生 Read/Edit 可操作 |
| 工作流 | Hooks + 规范 | 利用上下文注入 |
| 文档验证 | Node.js 脚本 | Bash 可调用 |
| 专业能力 | Skills 扩展 | 自动发现，模块化 |

### 9.3 Anti-Patterns

| 反模式 | 问题 | 正确做法 |
|--------|------|----------|
| `Bash(cat file)` | 无行号 | `Read` |
| `Bash(grep -r)` | 格式不一致 | `Grep` |
| 交互式命令 | 无法输入 | 非交互替代 |
| 轮询等待 | 阻塞超时 | 异步 + TaskOutput |
| 手动多步搜索 | 效率低 | Task(Explore) |

---

## 10. Common Commands <!-- id: ref_commands_list -->

| 命令 | 用途 |
|------|------|
| `/config` | 打开设置 |
| `/agents` | 管理 Subagents |
| `/mcp` | 管理 MCP 服务器 |
| `/hooks` | 配置 Hooks |
| `/memory` | 编辑 CLAUDE.md |
| `/model <alias>` | 切换模型 |
| `/cost` | 查看成本 |
| `/context` | 上下文可视化 |
| `/compact` | 压缩对话 |
| `/resume` | 恢复会话 |

---

*Document: claude-cli-capabilities.md*
*Version: v2.0*
*Created: 2025-12-27*
*Updated: 2025-12-27*
*Purpose: AI 决策参考，需求设计依据*
*Source: Claude Code Official Documentation*
