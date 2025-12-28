---
type: flow
id: workflows
workMode: document
status: in_progress
phase: feature_implementation
priority: P0
domain: process
version: "7.0"
---

# Flow: Workflows <!-- id: flow_workflows -->

> 标准工作流，定义人机协作的输入处理和流程路由

**执行规范**：[.solodevflow/flows/workflows.md](../../.solodevflow/flows/workflows.md)

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
│  ┌──────┴────┬────────┬────────┬────────┬────────┬────────┬────────┐│
│  ↓           ↓        ↓        ↓        ↓        ↓        ↓        ↓│
│ 直接执行  产品咨询  新增需求  需求变更  规范变更  审核批准  审核协助  无关│
│  ↓           ↓        ↓        ↓        ↓        ↓        ↓        ↓│
│ 立即执行  咨询流程  需求流程  变更流程  影响分析  审核流程  独立流程  拒绝│
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
  ├─ 审核批准：批准/通过需求文档（仅 review 阶段有效）
  ├─ 审核协助：请求帮助审核文档
  ├─ 无关想法：与本产品完全无关的想法
  └─ 无法判断：向用户澄清

Step 2: 路由到对应流程
  ├─ 直接执行 → 立即执行，不走流程
  ├─ 产品咨询 → 产品咨询流程（含关联项目查询）
  ├─ 新增需求 → 新增需求流程
  ├─ 需求变更 → 需求变更流程
  ├─ 规范变更 → 规范变更流程
  ├─ 审核批准 → 审核流程 (§7)
  ├─ 审核协助 → 独立流程 (§9.4)
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

### 3.3 审核输入判断标准

| 类型 | 识别信号 | 示例 | 前置条件 |
|------|----------|------|----------|
| **审核批准** | 批准/通过/同意/approve | "批准"、"通过"、"可以进入设计了" | 当前处于 `feature_review` 阶段 |
| **审核协助** | 请求帮助审核 | "帮我审核这个需求"、"review requirement" | 无（任意时刻可发起） |

**边界场景**：
- "批准" + 非 review 阶段 → 无效，提示当前不在审核阶段
- "审核一下" + 无目标文档 → 询问要审核哪个文档

### 3.4 需求变更处理规则（v6.8）

> 需求变更必须先更新文档，审核通过后才能写代码

**识别到需求变更后的强制流程**：

```
识别为"需求变更"
    ↓
set-phase <feature-id> feature_requirements  ← 立即设置！
    ↓
阶段守卫自动生效（阻止写代码/脚本）
    ↓
更新需求文档
    ↓
set-phase <feature-id> feature_review
    ↓
等待人类审核批准
    ↓
set-phase <feature-id> feature_design（或 feature_implementation）
    ↓
才能开始写代码
```

**UserPromptSubmit 自动检测**：

Hook 检测到需求变更信号（如"修改"、"新增功能"）时，会注入提醒：
```
[Input Analysis Reminder]
检测到可能的【需求变更】请求...
```

**阶段守卫规则**：

| 阶段 | 阻止的文件 |
|------|------------|
| `feature_requirements` | `src/**/*.js`, `scripts/**/*.js`, `.claude/hooks/**/*.js`, `tests/**/*` |
| `feature_review` | 同上 + `docs/designs/**/*.md` |

### 3.5 混合输入处理原则

- **咨询优先**：先回答咨询问题
- **不打断**：不中断当前咨询去处理需求
- **顺序处理**：咨询回答后，询问是否处理需求部分

---

## 4. Context Management <!-- id: flow_context_management -->

> v7.0: 简化状态管理，移除 session 结构

### 4.1 跨对话上下文

**状态持久化**：
- `flow.activeFeatures`：当前活跃的 Feature 列表
- `subtasks`：进行中的任务列表
- 文档 frontmatter：Feature 的 phase/status

**上下文恢复**（SessionStart）：
1. 读取 `state.json` 和 `index.json`
2. 显示活跃 Feature 和 phase
3. 显示进行中的 subtasks

### 4.2 设计说明（v7.0 变更）

**移除 session 结构的原因**：
- `session.mode`（idle/consulting/delivering）从未自动切换
- `pendingRequirements` 从未被实际填充
- 模式切换需要 AI 主动调用命令，但缺乏强制机制

**替代方案**：
- 依赖 AI 的自然语言理解判断输入类型
- 通过 subtasks 跟踪进行中的工作
- 通过 phase 守卫控制阶段行为

---

## 5. Consulting Delivery Flow <!-- id: flow_consulting -->

> 咨询交付流程：回答产品咨询，支持混合输入

### 5.1 流程步骤

```
[用户输入]
    ↓
[分析是否包含需求成分]
    ↓
   ┌─ 是（混合输入）→ [先回答咨询，再询问是否处理需求]
   └─ 否（纯咨询）→ [继续]
    ↓
[加载 PRD]
    ↓
[识别关联的 Feature/Flow/Capability]
    ↓
[加载相关文档]
    ↓
[生成回答]
    ↓
[等待下一输入]
```

### 5.2 核心行为

- 加载 PRD，查询关联内容
- 通过 index.json 的 documents 定位相关文档
- 混合输入时先回答咨询，再询问是否处理需求部分

### 5.3 需求提取规则

> 从混合输入中识别和提取需求成分

**识别信号**：

| 信号类型 | 关键词 | 示例 |
|----------|--------|------|
| 意愿词 | "想要"、"需要"、"希望"、"能不能"、"可以吗" | "我想要一个导出功能" |
| 功能词 | "添加"、"实现"、"支持"、"开发"、"做一个" | "能支持批量操作吗" |
| 变更词 | "修改"、"改成"、"换成"、"调整"、"优化" | "把按钮改成蓝色" |

**处理规则**：

```
用户输入："状态管理怎么实现的？顺便说一下，我想加个版本号字段"
                                    ↓
识别到意愿词"想"+ 功能词"加" → 包含需求成分
                                    ↓
1. 先回答咨询：解释状态管理实现方式
2. 再询问：刚才提到想加版本号字段，是否现在处理这个需求？
```

**判断原则**：
- 纯疑问句："状态管理有版本号吗？"（只是询问，不是需求）
- 假设句："如果有版本号就好了"（表达愿望但不明确）
- 不确定时：向用户确认是咨询还是需求

### 5.4 PRD 关联查询机制

> 根据用户输入找到相关的 Feature/Capability/Flow

**查询流程**：

```
用户输入
    ↓
提取关键词（去除停用词）
    ↓
搜索 index.json.documents[]
    ↓
匹配 title / id / path
    ↓
返回相关文档路径列表
    ↓
加载文档内容作为回答上下文
```

**匹配策略**：

| 查询类型 | 匹配方式 | 示例 |
|----------|----------|------|
| 精确匹配 | id 或 title 完全匹配 | "状态管理" → `state-management` |
| 模糊匹配 | 关键词出现在 title 中 | "登录" → 匹配 "用户认证"、"auth" |
| 路径匹配 | 用户提到文件名 | "fea-xxx" → 直接定位 |
| 无匹配 | 返回 PRD 作为兜底 | 加载 prd.md 提供全局视角 |

**查询示例**：

```javascript
// 用户问："项目初始化是怎么工作的？"
// 提取关键词：["项目", "初始化"]
// 搜索 index.json：
documents.filter(d =>
  d.title.includes("初始化") ||
  d.id.includes("init") ||
  d.title.includes("项目")
)
// 返回：["docs/requirements/features/fea-project-init.md"]
```

---

## 6. Requirements Delivery Flow <!-- id: flow_requirements -->

> 需求交付流程：处理功能需求

**详细流程定义**：[flow-requirements.md](flow-requirements.md)

### 6.1 流程选择

| 场景 | 判断条件 | 执行流程 |
|------|----------|----------|
| 新增需求 | index.json 中无对应 Feature | flow-requirements.md §2 |
| 需求变更 | index.json 中已有 Feature | flow-requirements.md §3 |
| 规范变更 | 目标是 docs/specs/*.md | flow-requirements.md §4 |

### 6.2 流程概览

```
[需求输入]
    ↓
[场景判断：新增/变更/规范]
    ↓
[执行对应子流程]
    ├─ 新增需求 → GATHER → CLARIFY → IMPACT → DEPENDENCY → CLASSIFY → GENERATE → VERIFY
    ├─ 需求变更 → GATHER → CLARIFY → IMPACT → DEPENDENCY → CONFIRM → UPDATE → VERIFY
    └─ 规范变更 → GATHER → CLARIFY → IMPACT → CONFIRM & EXECUTE
    ↓
[等待用户审核]
```

### 6.3 核心原则

- **Document-First**：先更新文档，后写代码
- **结构化澄清**：3-5 轮对话，问题空间 → 方案空间 → 验证空间
- **影响分析**：需求阶段只分析到设计文档
- **规范遵循**：使用 /write-* 命令确保符合规范

---

## 7. Review Approval Flow <!-- id: flow_review -->

> 审核审批流程：人类审核需求文档，批准后进入下一阶段

### 7.1 核心原则

- **文档是 Truth**：需求文档是后续设计/开发的唯一依据
- **人类审核必需**：AI 生成的需求必须经人类审核批准
- **显式批准退出**：必须人类显式说"批准"、"通过"才能进入下一阶段

### 7.2 触发条件

| 场景 | 触发条件 | 进入 phase |
|------|----------|------------|
| code 模式 | AI 完成需求文档（`/write-feature` 等） | `feature_review` |
| document 模式 | AI 完成文档草稿 | `review`（status 层面） |

### 7.3 审核流程

```
[AI 完成需求文档]
    ↓
[自动更新 phase → feature_review]
    ↓
[提示用户审核]
    ├─ 展示文档摘要
    ├─ 高亮关键决策点
    └─ 列出验收标准
    ↓
[等待用户反馈]
    ↓
   ┌─ 批准 → [更新 phase → feature_design] → 进入设计阶段
   ├─ 修改 → [AI 根据反馈修改] → 重新提交审核
   └─ 拒绝 → [记录原因] → 重新收集需求
```

### 7.4 审核要点清单

| 维度 | 检查项 | 说明 |
|------|--------|------|
| **完整性** | 是否覆盖所有功能点 | Intent/Scope/Behaviors 是否完整 |
| **清晰性** | 是否无歧义 | AI 和人类理解是否一致 |
| **可验证性** | 验收标准是否可测 | 能否通过测试验证 |
| **依赖性** | 依赖是否明确 | hard/soft 依赖是否标注 |
| **优先级** | P0/P1/P2 是否合理 | 与产品规划是否一致 |

### 7.5 阶段守卫

> PreToolUse Hook 在 review 阶段额外守护

| 当前阶段 | 阻止操作 | 原因 |
|----------|----------|------|
| `feature_review` | Write/Edit `docs/designs/**/*.md` | 审核未通过，不能进入设计 |
| `feature_review` | Write/Edit `src/**/*`, `tests/**/*` | 审核未通过，不能进入实现 |
| `feature_review` | 只允许修改当前需求文档 | 响应审核反馈 |

### 7.6 批准语法

**显式批准**（触发阶段推进）：
- "批准"、"通过"、"同意"、"approve"
- "可以进入设计了"
- "需求没问题，开始设计"

**修改请求**（不推进阶段）：
- "修改一下 xxx"
- "补充 xxx 部分"
- "xxx 不清楚，请澄清"

**拒绝**（返回需求阶段）：
- "重新来"
- "需求不对"
- "推翻重做"

---

## 8. Mixed Input Processing <!-- id: flow_mixed_input -->

> v7.0: 简化混合输入处理，移除 pendingRequirements

### 8.1 处理流程

混合输入（咨询+需求）时：

```
[混合输入]
    ↓
[先回答咨询部分]
    ↓
[询问用户]："刚才提到 xxx，是否现在处理这个需求？"
    ↓
   ┌─ 是 → 进入需求流程
   └─ 否/稍后 → 继续等待输入
```

### 8.2 设计说明

**不再暂存需求的原因**：
- 暂存机制需要 AI 主动执行，实际从未被使用
- 简化为即时询问用户，更直接有效
- 减少状态管理复杂度

---

## 9. Flow Index <!-- id: flow_index -->

> 流程快速索引，详细定义见各章节

### 9.1 核心流程

| 流程 | 触发条件 | 详细定义 |
|------|----------|----------|
| **Session Start** | 对话开始 | [§10.2 SessionStart Hook](#102-sessionstart-hook) |
| **Input Analysis** | 每次用户输入 | [§3 Input Analysis Flow](#3-input-analysis-flow) |
| **产品咨询** | 询问功能/进度/实现 | [§5 Consulting Delivery Flow](#5-consulting-delivery-flow) |
| **新增需求** | 描述新功能需求 | [flow-requirements.md §2](flow-requirements.md) |
| **需求变更** | 修改已有功能 | [flow-requirements.md §3](flow-requirements.md) |
| **规范变更** | 修改规范/模板 | [flow-requirements.md §4](flow-requirements.md) |
| **需求审核** | AI 完成需求文档后 | [§7 Review Approval Flow](#7-review-approval-flow) |
| **混合输入处理** | 咨询+需求混合 | [§8 Mixed Input Processing](#8-mixed-input-processing) |
| **审核协助** | 人类主动发起 | [§9.4 独立流程](#94-独立流程) |

### 9.2 守卫机制

| 守卫 | 触发位置 | 详细定义 |
|------|----------|----------|
| **阶段守卫** | Write/Edit 操作前 | [§10.4 PreToolUse Hook](#104-pretooluse-hook) |
| **审核守卫** | review 阶段阻止前进 | [§7.5 阶段守卫](#75-阶段守卫) |
| **文件保护** | 敏感文件操作前 | [§10.4 PreToolUse Hook](#104-pretooluse-hook) |

### 9.3 已简化处理

| 场景 | 处理方式 | 理由 |
|------|----------|------|
| 无关想法 | 直接拒绝，建议创建新项目 | 避免污染上下文 |
| 关联项目查询 | 合并到产品咨询流程 | 本质是咨询行为 |

### 9.4 独立流程 <!-- id: flow_independent -->

> 可由人类随时发起的独立流程，不受阶段限制

| 流程 | 触发方式 | 实现机制 | 说明 |
|------|----------|----------|------|
| **审核协助** | "审核需求"、"review requirement" | Subagent: review-assistant | 协助人类审核需求文档，生成审核报告 |

**审核协助流程**：

```
[人类请求审核]
    ↓
[启动 review-assistant Subagent（独立上下文）]
    ↓
[加载 PRD + 目标需求文档 + 规范]
    ↓
[搜索相关最佳实践（WebSearch）]
    ↓
[执行多维度审核分析]
    ↓
[生成审核报告 → .solodevflow/reviews/{doc-id}-review.md]
    ↓
[返回给人类，人类决定是否批准]
```

**与 Review Approval Flow 的区别**：

| 维度 | Review Approval Flow (§7) | 审核协助 (独立流程) |
|------|---------------------------|---------------------|
| 触发时机 | AI 完成需求后自动进入 | 人类随时主动发起 |
| 角色 | AI 等待人类批准 | AI 协助人类审核 |
| 产出 | 阶段推进决策 | 审核报告 (.md) |
| 实现 | 主 Agent + 阶段守卫 | 独立 Subagent |
| 上下文 | 共享主对话上下文 | 独立上下文 |

**Feature 详情**：[fea-review-assistant.md](../features/fea-review-assistant.md)

---

## 10. Hooks Integration <!-- id: flow_hooks -->

> Claude Code Hooks 配置，实现工作流自动化

### 10.1 Hook 架构概览

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
| P1 | UserPromptSubmit | 核心功能，注入上下文 | state.json, index.json |
| P3 | PostToolUse | 可选增强，文档验证 | document-validation |

### 10.2 SessionStart Hook <!-- id: flow_hooks_session_start -->

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

### 10.3 UserPromptSubmit Hook <!-- id: flow_hooks_user_prompt_submit -->

**触发时机**：用户提交输入前，Claude 处理前

**职责**：
1. 读取 state.json 获取项目状态
2. 读取 index.json 获取活跃 Feature 和文档索引
3. 记录关键输入到 `input-log.md`（可选）
4. 注入上下文（产品状态、活跃 Feature、phase）

> **注**：意图识别由 Claude 主 Agent 根据 workflows.md 规则完成，Hook 只提供上下文数据。相关文档搜索由 Claude 使用 Glob/Grep 工具完成。

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
    "additionalContext": "<workflow-context>\n产品: SoloDevFlow 2.0\n活跃 Feature: project-init (feature_implementation)\n进行中任务: 2\n</workflow-context>"
  }
}
```

**上下文注入内容**（~150 tokens）：

| 字段 | 来源 | 说明 |
|------|------|------|
| `productName` | state.json | 产品名称 |
| `activeFeature` | index.json | 当前活跃 Feature（从 activeFeatures[0]） |
| `featurePhase` | index.json | 活跃 Feature 的阶段 |
| `subtasksCount` | state.json | 进行中的 subtasks 数量 |

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
| 上下文注入 | 任意输入 | 返回 ~150 tokens 上下文 |
| 相关文档查询 | "登录功能怎么实现的" | relevantDocs 包含相关 Feature |
| 关键输入记录 | "我想添加导出功能" | 记录到 input-log.md |
| 普通输入忽略 | "查看 git 日志" | 不记录 |
| 阶段注入 | 查看上下文 | 包含 featurePhase 和 subtasksCount |

### 10.4 PreToolUse Hook <!-- id: flow_hooks_pre_tool_use -->

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

> 阶段定义参考 fea-state-management §5.2：`pending` → `feature_requirements` → `feature_review` → `feature_design` → `feature_implementation` → ...

| 当前阶段 | 阻止操作 | 原因 |
|----------|----------|------|
| `pending` | Write/Edit 任意文件（Read 除外） | 初始阶段，尚未开始工作 |
| `feature_requirements` | Write/Edit `src/**/*.{js,ts}`, `tests/**/*` | 需求阶段不应写代码/测试 |
| `feature_review` | Write/Edit `docs/designs/**/*.md` | 审核未通过，不能进入设计 |
| `feature_review` | Write/Edit `src/**/*`, `tests/**/*` | 审核未通过，不能进入实现 |
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

### 10.5 PostToolUse Hook（可选）<!-- id: flow_hooks_post_tool_use -->

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

### 10.6 配置文件结构 <!-- id: flow_hooks_config -->

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

### 10.7 Hook 脚本目录结构 <!-- id: flow_hooks_structure -->

```
.claude/
├── settings.json           # Hook 配置
└── hooks/
    ├── session-start.js    # SessionStart Hook
    ├── user-prompt-submit.js # UserPromptSubmit Hook
    ├── pre-tool-use.js     # PreToolUse Hook
    └── post-tool-use.js    # PostToolUse Hook (可选)
```

### 10.8 Dependencies <!-- id: flow_hooks_dependencies -->

| Dependency | Type | 说明 |
|------------|------|------|
| state-management | hard | SessionStart/UserPromptSubmit 读取 state.json |
| index.json | hard | UserPromptSubmit 读取文档索引（由 scripts/index.js 生成） |
| input-capture | soft | UserPromptSubmit 记录关键输入（可选） |
| document-validation | soft | PostToolUse 调用验证脚本 |

### 10.9 安全最佳实践 <!-- id: flow_hooks_security -->

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

### 10.10 错误处理规范 <!-- id: flow_hooks_error_handling -->

| 场景 | 处理方式 | 退出码 |
|------|----------|--------|
| state.json 不存在 | stderr 提示初始化，继续执行 | 0 |
| state.json 解析失败 | stderr 显示错误，阻止启动 | 2 |
| index.json 不存在 | 降级处理，返回基础上下文 | 0 |
| 验证脚本失败 | 记录错误到 stderr，不阻止工具执行 | 0 |
| Hook 脚本异常 | stderr 显示错误，使用默认行为 | 1 |

---

## 11. State Update Protocol <!-- id: flow_state_update -->

> 明确定义状态更新的时机和责任方

### 11.1 index.json 更新规则

| 触发事件 | 执行命令 | 执行者 | 说明 |
|----------|----------|--------|------|
| 文档 frontmatter 变更 | `node scripts/index.js` | AI | 修改 status/phase/priority 后立即执行 |
| 新建需求文档 | `node scripts/index.js` | AI | /write-* 命令完成后执行 |
| Session 启动（过期检测） | `node scripts/index.js` | SessionStart Hook | index.json 超过 1 小时未更新时 |

**附带行为**：index.js 执行时自动清理 `completed` 和 `skipped` 状态的 subtasks

**AI 执行时机**：
```
[修改文档 frontmatter]
    ↓
[立即运行 node scripts/index.js]
    ↓
[确认 index.json 已更新]
```

### 11.2 state.json 更新规则

#### Feature 激活

| 触发事件 | 执行命令 |
|----------|----------|
| 开始处理某 Feature | `node scripts/state.js activate-feature <id>` |
| 完成某 Feature | `node scripts/state.js deactivate-feature <id>` |

#### Phase 生命周期

> phase 控制阶段守卫，阻止跨阶段操作（如需求阶段写代码）

**code 模式生命周期**：
```
pending → feature_requirements → feature_review → feature_design → feature_implementation → done
```

**阶段转换命令**：

| 触发事件 | 执行命令 |
|----------|----------|
| 开始编写需求 | `node scripts/state.js set-phase <id> feature_requirements` |
| **需求完成，进入审核** | `node scripts/state.js set-phase <id> feature_review` |
| **人类批准，进入设计** | `node scripts/state.js set-phase <id> feature_design` |
| 设计完成，开始实现 | `node scripts/state.js set-phase <id> feature_implementation` |
| 功能完成 | `node scripts/state.js set-phase <id> done` |

**关键规则**：
- **AI 完成需求文档后必须设置 phase 为 `feature_review`**
- 只有人类显式批准后，才能设置 phase 为 `feature_design`
- 阶段守卫会阻止跨阶段操作（如 requirements 阶段写 src/ 代码）

#### Subtask 管理

> subtasks 用于跟踪**所有正在进行和待完成的工作**，确保任务不会因切换或上下文丢失而遗忘。

**自动同步机制（v6.7）**：

AI 使用 Claude Code 内置的 TodoWrite 工具时，PostToolUse Hook 自动同步到 subtasks：
- **同步方向**：TodoWrite → subtasks（单向）
- **冲突处理**：只追加，不删除现有 subtasks
- **匹配规则**：通过 `description` 匹配判断是否已存在

```
AI 使用 TodoWrite
       ↓
PostToolUse Hook 捕获
       ↓
同步到 state.json.subtasks (source: 'ai')
       ↓
SessionStart 时显示 in_progress 任务
```

**手动命令**（用于 impact-analysis 等场景）：

| 触发事件 | 执行命令 |
|----------|----------|
| 影响分析产生子任务 | `node scripts/state.js add-subtask --feature=<id> --desc="描述" --source=impact-analysis` |
| **完成任务** | `node scripts/state.js complete-subtask <subtaskId>` |
| 跳过任务 | `node scripts/state.js skip-subtask <subtaskId>` |

**任务生命周期**：

```
开始新工作
  ↓
add-subtask --status=in_progress  ← 记录"正在做什么"
  ↓
[工作进行中...]
  ↓
 ┌─ 完成 → complete-subtask → status: completed ─┐
 ├─ 被打断 → 保持 in_progress（下次 Session 提示恢复）  │
 └─ 不再需要 → skip-subtask → status: skipped ──────┤
                                                    ↓
                              index.js 执行时自动清理
```

**并发支持**：

多个 Session 可以同时处理不同任务：
```
Session A: subtask st_1 (feature-x) → in_progress
Session B: subtask st_2 (feature-y) → in_progress
```

**Session 启动时检查**：

SessionStart Hook 自动检查 `in_progress` 的 subtasks 并提示：
```
<workflow-context>
...
In-Progress Tasks: 2
  - [workflows] 完善 flow-workflows.md §11
  - [project-init] 实现 init.js 交互式输入
</workflow-context>
```

### 11.3 执行者职责

| 执行者 | 职责 | 不可做 |
|--------|------|--------|
| **AI** | 调用 State CLI 更新状态 | 直接编辑 state.json |
| **Hooks** | 读取状态、注入上下文、过期检测 | 修改状态 |
| **Human** | 审批决策、直接编辑 frontmatter | - |

---

## 12. Execution Principles <!-- id: flow_principles -->

### 始终做

- 每次输入 → 先分析输入类型（直接执行？咨询？需求？）
- 直接执行 → 简单 bug/查询/操作，立即执行不走流程
- 咨询+需求 → 先回答咨询，再询问是否处理需求
- 状态更新 → 通过 State CLI，不直接编辑
- **文档变更 → 立即运行 index.js**
- 需求完成后 → 进入 review 阶段，等待人类显式批准
- 审核批准后 → 才能进入设计阶段

### 绝不做

- 咨询过程中打断去处理需求
- 跳过输入分析直接执行（除非明确判断为"直接执行"类型）
- 将复杂问题错判为"直接执行"
- 跳过 review 阶段直接进入设计
- 未经人类批准擅自更新 phase
- **修改 frontmatter 后不更新 index.json**

---

*Version: v7.0*
*Created: 2024-12-20*
*Updated: 2025-12-28*
*Changes: v7.0 移除 session 结构（mode/context/pendingRequirements）- 设计过于理想化，实际从未使用；简化混合输入处理*
