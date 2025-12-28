# Workflows - Execution Spec

> AI 执行规范：定义 AI 如何响应用户输入并维护状态

**需求文档**：[flow-workflows.md](../../docs/requirements/flows/flow-workflows.md)

---

## 1. Session Start

**每次对话开始执行**：

1. 读取 `.solodevflow/state.json` 和 `.solodevflow/index.json`
2. 汇报状态：项目名 / 当前 Feature / 阶段 / 进度
3. 设置 session.mode = `idle`
4. 等待用户指示

---

## 2. Input Analysis

**每次接收用户输入，首先判断类型**：

```
用户输入
    ↓
判断输入类型
    ├─ 直接执行 → 立即执行，不走流程
    ├─ 产品咨询 → 咨询流程 (§4)
    ├─ 新增需求 → 需求流程 (§5)
    ├─ 需求变更 → 需求流程 (§5) + 影响评估
    ├─ 规范变更 → 影响分析流程 (§6)
    └─ 无关想法 → 直接拒绝，建议创建新项目
```

### 2.1 判断标准

| 类型 | 识别信号 | 示例 |
|------|----------|------|
| **直接执行** | 简单明确、单步操作、不涉及设计变更 | "修复第42行空指针"、"运行测试" |
| **产品咨询** | 询问功能、进度、实现方式 | "这个功能怎么实现的？" |
| **新增需求** | 描述新功能、想做什么 | "我想加一个导出功能" |
| **需求变更** | 修改已有功能行为 | "把登录改成手机号验证" |
| **规范变更** | 修改 docs/specs/* 或模板 | "更新需求文档规范" |
| **无关想法** | 与本产品完全无关 | "帮我写个爬虫" |

### 2.2 边界判断

- "修复登录问题" → ❌ 不是直接执行（问题不明确，需先咨询）
- "修复 login.js 第42行空指针" → ✅ 直接执行
- 无法判断 → 向用户澄清

---

## 3. Session State

**三种模式**：

| 模式 | 说明 | 进入条件 | 退出条件 |
|------|------|----------|----------|
| `idle` | 空闲等待 | 对话开始 / 任务完成 | 接收到输入 |
| `consulting` | 咨询中 | 产品咨询输入 | 隐式/显式结束 |
| `delivering` | 需求交付中 | 需求输入 / 处理暂存需求 | 交付完成 |

### 3.1 混合输入处理

当咨询中检测到需求成分：

1. **提取需求** → 存入 `state.session.context.pendingRequirements`
2. **继续咨询** → 先回答咨询问题
3. **咨询结束后** → 提示："有 N 条暂存需求待处理，是否现在处理？"

**需求识别信号**：
- 意愿词："想要"、"需要"、"希望"、"能不能"
- 功能词："添加"、"实现"、"支持"、"开发"
- 变更词："修改"、"改成"、"换成"、"调整"

### 3.2 咨询结束判断

- **隐式**：用户开始描述纯需求
- **显式**：用户说"咨询完了"、"没问题了"

---

## 4. Consulting Flow（咨询流程）

```
[用户咨询]
    ↓
[检查是否包含需求成分] ─是→ [提取需求] → [存入 pendingRequirements]
    ↓
[搜索 index.json 定位相关文档]
    ↓
[加载相关文档]
    ↓
[生成回答]
    ↓
[检查 pendingRequirements]
    ├─ 有 → 附加提示："有暂存需求待处理"
    └─ 无 → 等待下一输入
```

**关联查询机制**：
- 精确匹配：id 或 title 完全匹配
- 模糊匹配：关键词出现在 title 中
- 无匹配：返回 PRD 作为兜底

---

## 5. Requirements Flow（需求流程）

> 方法论参考：[fea-requirements-expert.md](../../docs/requirements/features/fea-requirements-expert.md)

### 5.1 流程选择

| 场景 | 判断条件 | 执行流程 |
|------|----------|----------|
| 新增需求 | index.json 中无对应 Feature | §5.2 |
| 需求变更 | index.json 中已有 Feature | §5.3 |

### 5.2 新增需求流程

```
[需求输入]
    ↓
[GATHER] 读取 state.json、index.json、PRD
    ↓
[CLARIFY] 需求澄清（3-5轮对话）
    ├─ 问题空间：要解决什么问题？为什么现有方案不满足？预期效果？
    ├─ 方案空间：核心能力是什么？与现有功能如何协作？
    └─ 验证空间：如何验证达到预期？
    ↓
[IMPACT] 影响分析
    ├─ 搜索 index.json 查找相关 Feature
    ├─ 检查是否与现有 Feature 功能重叠
    └─ 如发现是变更 → 切换到 §5.3
    ↓
[DEPENDENCY] 依赖分析
    ├─ hard：必须先有 A 才能实现 B
    └─ soft：B 没有 A 也能工作，但功能受限
    ↓
[CLASSIFY] 判断文档类型
    ├─ Feature：独立业务功能
    ├─ Capability：跨 Feature 的公共能力
    └─ Flow：跨 Feature 的业务流程
    ↓
[GENERATE] 调用 /write-* 命令生成文档
    ↓
[VERIFY] 验证完整性
```

### 5.3 需求变更流程

```
[变更请求]
    ↓
[GATHER] 读取现有需求文档、Dependencies、关联设计文档
    ↓
[CLARIFY] 澄清变更
    ├─ 变更什么？
    ├─ 为什么改？
    └─ 影响范围？
    ↓
[IMPACT] 影响分析
    ├─ 搜索依赖此 Feature 的其他 Feature
    └─ 检查关联设计文档是否需要更新
    ↓
[DEPENDENCY] 依赖关系更新
    ↓
[CONFIRM] 展示变更摘要，等待用户确认
    ↓
[UPDATE] 调用 /write-feature 更新文档
```

### 5.4 阶段守卫

若用户请求与当前阶段不符（如需求阶段要求写代码），提供选项：
1. 切换到对应阶段
2. 取消请求

---

## 6. Change Impact Flow（影响分析流程）

**触发条件**：修改 `docs/specs/*`、PRD、或模板文件

```
[变更请求]
    ↓
[运行 node scripts/analyze-impact.js <file>]
    ↓
[展示影响范围]
    ↓
[等待用户确认]
    ├─ 确认 → 生成 subtasks，按顺序处理
    └─ 取消 → 中止
```

**处理顺序**：specs → requirements → designs → code → tests

---

## 7. Review Flow（审核流程）

> 需求完成后必须经人类审核批准才能进入设计

### 7.1 核心原则

- **文档是 Truth**：需求文档是后续设计/开发的唯一依据
- **人类审核必需**：AI 完成需求后自动进入 `feature_review` 阶段
- **显式批准退出**：必须人类说"批准"/"通过"/"approve"才能进入设计

### 7.2 审核流程

```
[AI 完成需求文档]
    ↓
[更新 phase → feature_review]
    ↓
[提示用户审核]
    ↓
[等待用户反馈]
    ├─ 批准 → phase → feature_design
    ├─ 修改 → AI 修改后重新审核
    └─ 拒绝 → 重新收集需求
```

### 7.3 阶段守卫

| 当前阶段 | 阻止操作 | 原因 |
|----------|----------|------|
| `feature_review` | Write/Edit `docs/designs/**/*.md` | 审核未通过 |
| `feature_review` | Write/Edit `src/**/*`, `tests/**/*` | 审核未通过 |

---

## 8. Pending Requirements

**处理暂存需求**：

触发：用户说"处理需求"，或咨询结束后自动提示

对每条暂存需求，询问用户：
- **转为正式需求** → 进入需求流程 (§5)
- **暂时保留** → 保持暂存
- **丢弃** → 移除

---

## 9. Execution Principles

### 始终做

- 每次输入 → 先判断输入类型（§2）
- 直接执行类型 → 立即执行，不走流程
- 咨询+需求混合 → 提取需求暂存，先回答咨询
- 咨询结束后 → 检查暂存需求，有则提示
- 编写文档前 → 加载对应规范（spec-requirements / spec-design）
- 状态更新 → 通过 `node scripts/state.js`，不直接编辑 state.json
- 需求完成后 → 进入 review 阶段，等待人类显式批准
- 审核批准后 → 才能进入设计阶段

### 绝不做

- 咨询过程中打断去处理需求
- 跳过输入分析直接执行（除非明确判断为"直接执行"类型）
- 丢失用户的暂存需求
- 将复杂问题错判为"直接执行"
- 需求阶段写代码
- 跳过影响分析直接执行规范变更
- 跳过 review 阶段直接进入设计
- 未经人类批准擅自更新 phase

---

## 10. Independent Flows（独立流程）

> 可由人类随时发起的独立流程，不受阶段限制

| 流程 | 触发方式 | 实现 | 说明 |
|------|----------|------|------|
| **审核协助** | "审核需求"、"review requirement" | review-assistant Subagent | 协助审核需求文档 |

### 10.1 审核协助流程

```
[人类请求审核]
    ↓
[启动 review-assistant Subagent（独立上下文）]
    ↓
[加载 PRD + 需求文档 + 规范]
    ↓
[搜索最佳实践]
    ↓
[多维度审核分析]
    ↓
[生成审核报告 → .solodevflow/reviews/{doc-id}-review.md]
```

---

## 11. Tools Reference

### 11.1 Commands（文档生成）

| 命令 | 用途 |
|------|------|
| `/write-prd` | 编写/更新 PRD |
| `/write-feature` | 编写/更新 Feature Spec |
| `/write-capability` | 编写/更新 Capability Spec |
| `/write-flow` | 编写/更新 Flow Spec |
| `/write-design` | 编写/更新 Design 文档 |

### 11.2 Scripts（状态管理）

| 脚本 | 用途 |
|------|------|
| `node scripts/state.js summary` | 显示状态摘要 |
| `node scripts/state.js activate-feature <id>` | 激活 Feature |
| `node scripts/state.js session-mode <mode>` | 设置会话模式 |
| `node scripts/validate-state.js` | 校验 state.json |
| `node scripts/analyze-impact.js <file>` | 影响分析 |

### 11.3 Subagents（独立 Agent）

| Agent | 用途 |
|-------|------|
| `review-assistant` | 审核需求文档，生成审核报告 |

---

*Version: v7.2*
*Aligned with: flow-workflows.md v6.0*
*Updated: 2025-12-28*
*Changes: v7.2 新增 §10 Independent Flows，支持审核协助 Subagent；v7.1 新增 §7 Review Flow*
