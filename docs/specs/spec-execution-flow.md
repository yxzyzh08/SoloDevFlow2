---
type: execution-flow-spec
version: "1.0"
id: spec_execution_flow
status: in_progress
---

# Execution Flow Spec v1.0 <!-- id: spec_exec_flow -->

> 定义 `.solodevflow/flows/*.md` 执行规范文档的编写标准

---

**适用范围**：

- 本规范适用于 `.solodevflow/flows/` 目录下的执行规范文档
- 这些文档指导 AI 如何执行特定的工作流程

**参考来源**：

- [Claude Code: Best practices for agentic coding](https://www.anthropic.com/engineering/claude-code-best-practices)
- [Skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)
- [Prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-4-best-practices)

---

## 1. Core Principles <!-- id: spec_exec_principles -->

### 1.1 Conciseness is Key <!-- id: spec_exec_concise -->

上下文窗口是公共资源。Claude 的系统提示已包含约 50 条指令，用户指令空间有限。

**评估每条指令**：

| 问题 | 目的 |
|------|------|
| Claude 真的需要这个解释吗？ | 避免冗余 |
| 这个信息值得占用 token 成本吗？ | 控制成本 |
| 能否假设 Claude 已知这些内容？ | 精简内容 |

**规模建议**：

| 文档类型 | 建议行数 | 说明 |
|----------|----------|------|
| 主执行规范 | < 500 行 | `workflows.md` |
| 子流程规范 | < 300 行 | `requirements.md`, `design.md` 等 |

### 1.2 Progressive Disclosure <!-- id: spec_exec_progressive -->

主文档作为索引，详细内容放在子文档，按需加载。

**目录结构**：

```
.solodevflow/flows/
├── workflows.md        # 主流程（每次 Session 加载）
├── requirements.md     # 子流程（进入需求阶段时加载）
├── design.md          # 子流程（进入设计阶段时加载）
├── implementation.md  # 子流程（进入实现阶段时加载）
├── testing.md         # 子流程（进入测试阶段时加载）
├── bugfix.md          # 子流程（处理 Bug 时加载）
└── refactoring.md     # 子流程（重构模式时加载）
```

**加载策略**：

| 文档类型 | 加载时机 |
|----------|----------|
| 主流程 | 每次 Session 开始 |
| 子流程 | 进入对应阶段或触发条件时 |

### 1.3 Explicit Over Implicit <!-- id: spec_exec_explicit -->

Claude 4.x 模型对明确指令响应最佳。不要假设 Claude 会推断隐含意图。

**低效写法**：
```markdown
处理用户输入
```

**高效写法**：
```markdown
1. 读取用户输入
2. 判断输入类型：咨询 / 需求 / Bug
3. 路由到对应处理流程
```

---

## 2. Document Structure <!-- id: spec_exec_structure --> <!-- defines: execution-flow -->

执行规范文档的标准结构。

### 2.1 Required Sections

| Section | Required | Anchor | Description |
|---------|----------|--------|-------------|
| Header | Yes | `{name}` | 标题 + 一句话描述 + 需求文档链接 |
| Trigger/Entry | Yes | `{name}_trigger` | 何时触发此规范 |
| Flow Steps | Yes | `{name}_flow` | 执行步骤（编号序列） |
| Decision Points | Yes | `{name}_decision` | 分支逻辑和判断条件 |
| Execution Principles | Yes | `{name}_principles` | 始终做 / 绝不做 |
| Tools Reference | Yes | `{name}_tools` | 可用工具列表 |
| Changelog | Yes | - | 版本变更记录 |

### 2.2 Header Format <!-- id: spec_exec_header -->

```markdown
# [Name] - Execution Spec

> AI 执行规范：[一句话描述]

**需求文档**：[链接到需求文档]

---
```

**示例**：

```markdown
# Requirements Flow - Execution Spec

> AI 执行规范：需求处理阶段的执行流程

**需求文档**：[flow-requirements.md](../../docs/requirements/flows/flow-requirements.md)

---
```

### 2.3 Footer Format <!-- id: spec_exec_footer -->

```markdown
---

*Version: vX.Y*
*Aligned with: [需求文档] vA.B*
*Updated: YYYY-MM-DD*

---

## Changelog

### vX.Y (YYYY-MM-DD)
- [变更描述]
```

---

## 3. Flow Step Format <!-- id: spec_exec_step -->

### 3.1 Numbered Sequences <!-- id: spec_exec_numbered -->

使用编号序列描述流程。编号序列显著提高指令遵循度。

**推荐格式**：

```markdown
## X. [阶段名称]

1. 执行步骤 A
2. 执行步骤 B
3. 判断条件：
   - 条件 1 → 结果 A
   - 条件 2 → 结果 B
4. 执行步骤 C
```

**避免**：

```markdown
首先做 A，然后做 B，最后做 C
```

### 3.2 ASCII Flow Diagrams <!-- id: spec_exec_ascii -->

复杂分支使用 ASCII 流程图：

```markdown
用户输入
    ↓
意图识别
    ├─ 咨询 → §3 Consulting
    ├─ 需求 → §4 Requirements
    └─ Bug → §5 Bugfix
```

**符号约定**：

| 符号 | 含义 |
|------|------|
| `↓` | 顺序执行 |
| `├─` | 分支（非最后一个） |
| `└─` | 分支（最后一个） |
| `§N` | 引用本文档章节 |

### 3.3 Decision Tables <!-- id: spec_exec_table -->

使用表格明确决策逻辑：

```markdown
| 条件 | 判断标准 | 执行动作 |
|------|----------|----------|
| 新功能 | index.json 中无对应 Feature | 执行 Flow A |
| 变更 | index.json 中已有 Feature | 执行 Flow B |
```

---

## 4. Writing Guidelines <!-- id: spec_exec_writing -->

### 4.1 Third Person <!-- id: spec_exec_person -->

描述使用第三人称，因为规范会被注入系统提示。

**避免**：
- "我会帮你处理..."
- "你可以使用..."

**使用**：
- "AI 执行..."
- "系统检查..."
- "[动词]...（无主语）"

### 4.2 Consistent Terminology <!-- id: spec_exec_terminology -->

全文档使用一致术语。

**项目术语表**：

| 术语 | 含义 | 避免混用 |
|------|------|----------|
| Work Item | 独立的工作单元（Feature/Capability/Flow） | 任务、功能 |
| Phase | 工作项当前阶段 | 阶段、状态 |
| Subtask | 工作项的子任务 | 子步骤 |

### 4.3 No Time-Sensitive Information <!-- id: spec_exec_time -->

不要包含会过时的信息。

**避免**：
```markdown
2025 年 8 月前使用旧 API，之后使用新 API
```

**使用**：
```markdown
## 当前方法
使用 v2 API

## 历史方法（已弃用）
<details>
<summary>v1 API（2025-08 弃用）</summary>
旧的 v1 API 端点...
</details>
```

---

## 5. Flow Patterns <!-- id: spec_exec_patterns -->

### 5.1 Workflow Pattern <!-- id: spec_exec_workflow -->

复杂任务使用检查清单跟踪进度：

````markdown
## [任务名] 工作流

复制此清单并跟踪进度：

```
任务进度:
- [ ] 步骤 1: 分析输入
- [ ] 步骤 2: 执行处理
- [ ] 步骤 3: 验证结果
- [ ] 步骤 4: 生成输出
```

**步骤 1: 分析输入**
[详细说明]

**步骤 2: 执行处理**
[详细说明]
````

### 5.2 Feedback Loop Pattern <!-- id: spec_exec_feedback -->

验证 → 修复 → 重复：

```markdown
## 验证循环

1. 执行操作
2. **立即验证**: `node scripts/validate.js`
3. 如果验证失败:
   - 分析错误信息
   - 修复问题
   - **重新验证**
4. **仅当验证通过后**继续下一步
```

### 5.3 Conditional Routing Pattern <!-- id: spec_exec_routing -->

使用表格明确路由：

```markdown
## 路由逻辑

| 当前状态 | 用户输入 | 路由目标 |
|----------|----------|----------|
| `pending` | 任何 | §2 开始处理 |
| `feature_requirements` | 需求相关 | §3 需求流程 |
| `feature_review` | 批准 | §4 进入下一阶段 |
```

### 5.4 Guard Pattern <!-- id: spec_exec_guard -->

阶段守卫防止越权操作：

```markdown
## Phase Guards

| 阶段 | 阻止的操作 |
|------|------------|
| `feature_requirements` | 禁止 Write/Edit `src/**/*` |
| `feature_review` | 禁止 Write/Edit `docs/designs/**/*` |
```

---

## 6. Execution Principles Section <!-- id: spec_exec_principles_section -->

每个执行规范必须包含此章节。

### 6.1 Format

```markdown
## Execution Principles

### 始终做

- [必须执行的行为 1]
- [必须执行的行为 2]

### 绝不做

- [禁止的行为 1]
- [禁止的行为 2]
```

### 6.2 Guidelines

**始终做**：
- 每条应该是具体、可验证的行为
- 使用动词开头
- 按重要性排序

**绝不做**：
- 明确边界和红线
- 包含常见错误模式
- 防止 AI 越权

---

## 7. Tools Reference Section <!-- id: spec_exec_tools_section -->

列出规范中可用的工具。

```markdown
## Tools Reference

| 工具 | 用途 |
|------|------|
| `node scripts/state.js summary` | 获取状态摘要 |
| `node scripts/state.js set-phase <id> <phase>` | 更新阶段 |
| `/write-feature` | 生成 Feature 需求文档 |
```

---

## 8. Anti-Patterns <!-- id: spec_exec_antipatterns -->

### 8.1 Common Mistakes

| Anti-Pattern | 问题 | 改进 |
|--------------|------|------|
| 过度解释 | 浪费 token | 假设 Claude 已知基础知识 |
| 多选项并列 | 增加决策负担 | 提供默认选项 + 例外说明 |
| 嵌套引用 | Claude 可能部分读取 | 保持一层引用深度 |
| 模糊指令 | 执行不一致 | 使用明确、可验证的指令 |
| 时间条件 | 信息会过时 | 使用"当前"/"历史"章节 |
| 多层嵌套流程 | 难以跟踪 | 扁平化流程，使用章节引用 |

### 8.2 Path Convention

始终使用正斜杠（即使在 Windows 上）：

| 格式 | 示例 |
|------|------|
| 正确 | `scripts/helper.py` |
| 错误 | `scripts\helper.py` |

---

## 9. Degrees of Freedom <!-- id: spec_exec_freedom -->

根据任务的脆弱性和可变性，匹配指令的具体程度。

### 9.1 High Freedom

**适用场景**：多种方法都有效，需要根据上下文决策

```markdown
## 代码审查流程

1. 分析代码结构和组织
2. 检查潜在 bug 和边界情况
3. 建议可读性和可维护性改进
4. 验证是否符合项目约定
```

### 9.2 Medium Freedom

**适用场景**：有首选模式，但允许一定变化

````markdown
## 生成报告

使用此模板并根据需要自定义：

```python
def generate_report(data, format="markdown"):
    # 处理数据
    # 生成指定格式的输出
```
````

### 9.3 Low Freedom

**适用场景**：操作脆弱、易出错，必须严格遵循

````markdown
## 数据库迁移

严格执行此脚本：

```bash
python scripts/migrate.py --verify --backup
```

不要修改命令或添加额外参数。
````

---

## 10. Iteration & Testing <!-- id: spec_exec_iteration -->

### 10.1 Evaluation-Driven Development

1. **识别问题**：在没有规范的情况下执行任务，记录失败点
2. **创建评估**：构建测试场景覆盖这些问题
3. **建立基线**：测量无规范时的表现
4. **编写最小规范**：仅添加解决问题所需的内容
5. **迭代**：执行评估，对比基线，持续优化

### 10.2 Observe & Refine

观察 Claude 如何导航规范：

| 观察点 | 改进方向 |
|--------|----------|
| 意外的执行路径 | 调整流程结构 |
| 遗漏的引用 | 使链接更明显 |
| 过度依赖某章节 | 考虑移入主文档 |
| 从未访问的内容 | 考虑删除或重新组织 |

---

## 11. Checklist <!-- id: spec_exec_checklist -->

发布执行规范前验证：

### 核心质量
- [ ] 主文档 < 500 行
- [ ] 使用编号序列描述流程
- [ ] 术语一致
- [ ] 无时间敏感信息
- [ ] 包含 Execution Principles 章节
- [ ] 包含 Tools Reference 章节

### 结构
- [ ] 标准 Header 格式（标题 + 描述 + 需求文档链接）
- [ ] 决策点使用表格
- [ ] 复杂分支使用 ASCII 图
- [ ] 渐进式披露（详细内容在子文档）

### 可测试性
- [ ] 指令具体、可验证
- [ ] 禁止行为明确
- [ ] 工具用法清晰
- [ ] 路由逻辑无歧义

---

*Version: v1.0*
*Created: 2025-12-31*
*Updated: 2025-12-31*

---

## Changelog

### v1.0 (2025-12-31)
- 初始版本
- 基于 Anthropic 官方最佳实践、Claude 4.x 提示词工程指南、Skill 编写最佳实践编写
