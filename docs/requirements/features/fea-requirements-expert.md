---
type: feature
id: requirements-expert
workMode: document
status: in_progress
priority: P0
domain: ai-config
version: "3.0"
---

# Feature: Requirements Expert <!-- id: feat_requirements_expert -->

> 需求处理领域的方法论定义，为 flow-requirements.md 子流程提供方法论基础

---

## 1. Intent <!-- id: feat_requirements_expert_intent -->

### 1.1 Problem

- **需求澄清缺乏方法论**：用户描述的需求往往模糊，直接编写文档质量低、返工多，缺乏系统化的澄清方法
- **影响分析边界不清**：不知道应该分析到什么层级（需求/设计/代码），输出格式不统一
- **依赖关系未规范**：依赖类型（hard/soft）的判断标准不明确，未持久化到文档中
- **文档类型判断随意**：何时用 Feature、何时用 Capability、何时用 Flow，缺乏明确判断规则
- **变更处理流程不一致**：新增需求、需求变更、规范变更的处理流程不统一

### 1.2 Value

- **结构化澄清方法**：提供 3-5 轮结构化对话框架（问题空间/方案空间/验证空间），将模糊想法转化为清晰需求
- **标准化分析规则**：定义影响分析边界（需求阶段只到设计文档）、依赖类型判断标准（hard/soft）
- **统一输出格式**：定义影响分析报告、依赖关系表格、subtasks 清单的标准格式
- **明确判断规则**：提供文档类型选择的决策树（Feature/Capability/Flow 的适用场景）
- **方法论可复用**：规则定义在本文档，由 flow-requirements.md 子流程调用

### 1.3 Scope Boundary

**requirements-expert 是方法论定义，不是执行能力提供者**

| Requirements Expert 职责（方法论定义） | 非 Requirements Expert 职责（由工作流/Claude CLI 提供） |
|--------------------------------------|-----------------------------------------------------|
| **定义需求澄清方法**（问什么问题、EARS 格式） | 实际执行澄清对话（flow-requirements.md） |
| **定义影响分析规则**（边界、深度、输出格式） | 运行影响分析脚本（Claude CLI） |
| **定义依赖分析规则**（类型判断标准） | 读取文件、查询索引（Claude CLI） |
| **定义文档生成规范**（调用 write-* 命令） | 路由决策、意图识别（flow-workflows.md） |

**架构关系**：

```
flow-workflows.md（主工作流）
    ↓ 识别需求处理意图
flow-requirements.md（子流程）
    ↓ 定义具体执行步骤
fea-requirements-expert.md（本文档）
    └─ 提供方法论规则（澄清方法、分析规则、格式规范）
```

---

## 2. Core Functions <!-- id: feat_requirements_expert_functions -->

| ID | Function | 描述 |
|----|------------|------|
| C1 | **需求澄清方法论** | 定义结构化澄清对话框架（问题空间/方案空间/验证空间）、EARS 格式 |
| C2 | **文档类型判断规则** | 定义 Feature/Capability/Flow 的选择决策树 |
| C3 | **影响分析规则** | 定义分析边界（需求阶段到设计文档）、分析深度、输出格式 |
| C4 | **依赖关系分析规则** | 定义依赖类型（hard/soft）判断标准、持久化格式 |
| C5 | **文档生成规范** | 定义文档结构（调用 write-* 命令）、必选章节 |
| C6 | **Subtasks 生成规范** | 定义 subtask 格式、处理流程、完成标准 |

---

## 3. Workflow <!-- id: feat_requirements_expert_workflow -->

> **执行流程**：详见 [flow-requirements.md](../flows/flow-requirements.md)
>
> 本章节仅保留方法论规则定义，具体执行步骤由子流程文档承载。

### 3.1 C1 需求澄清方法论

**3-5 轮结构化对话框架**：

| 空间 | 核心问题 | 目标 |
|------|----------|------|
| **问题空间** | 要解决什么问题？（用户痛点） | 明确 Problem |
| | 为什么现有方案不能满足？（gap 分析） | 明确 Gap |
| | 预期达到什么效果？（成功标准） | 明确 Success Criteria |
| **方案空间** | 核心能力是什么？（Capabilities 定义） | 明确 Scope |
| | 与现有功能如何协作？（集成点） | 明确 Integration |
| **验证空间** | 如何验证达到预期？（验收标准） | 明确 Acceptance Criteria |

**执行规则**：
- 不超过 5 轮对话
- 每轮聚焦一个空间
- 渐进式深入：问题 → 方案 → 验证

**EARS 格式**（结构化需求表达）：

| 模式 | 格式 | 示例 |
|------|------|------|
| **Ubiquitous** | The [system] shall [action] | The system shall log all errors |
| **Event-Driven** | When [event], the [system] shall [action] | When user clicks submit, the system shall validate input |
| **Conditional** | If [condition], the [system] shall [action] | If session expires, the system shall redirect to login |
| **Optional** | Where [feature], the [system] shall [action] | Where dark mode is enabled, the system shall use dark theme |

### 3.2 C3 影响分析规则

**分析边界**：
- 需求阶段只分析到设计文档，代码影响由设计阶段处理
- 例外：workMode: document 的 Feature，分析到直接关联的脚本

**输出格式**：

```markdown
## 影响分析结果

### 需求层影响
| 文档 | 类型 | 影响原因 | 处理方式 |
|------|------|----------|----------|

### 设计层影响
| 文档 | 类型 | 影响原因 | 处理方式 |
|------|------|----------|----------|

### 处理清单
- [ ] 任务1
- [ ] 任务2
```

### 3.3 C4 依赖分析规则

| 类型 | 判断标准 | 示例 |
|------|----------|------|
| **hard** | 必须先有 A 才能实现 B；A 的接口是 B 的核心功能基础 | 认证模块(A) → 用户管理(B) |
| **soft** | B 没有 A 也能工作，但功能受限；A 是 B 的增强而非基础 | 日志模块(A) → 大多数功能(B) |

### 3.4 C6 Subtasks 格式规范

```markdown
## Subtasks

- [ ] 更新 fea-xxx.md §2 Capabilities 章节
- [ ] 评估 fea-yyy.md 是否需要修改
- [ ] 标记 des-xxx.md 需要设计阶段处理
```

格式要求：
- 使用 Markdown checklist 格式
- 每个 subtask 明确操作对象和操作内容
- 区分"更新"（必须做）和"评估"（可能需要）

---

## 4. Dependencies <!-- id: feat_requirements_expert_dependencies -->

| Dependency | Type | 说明 |
|------------|------|------|
| flow-requirements | hard | 本文档的方法论由 flow-requirements.md 子流程执行 |
| spec-requirements | hard | 依赖需求规范定义的文档结构 |
| change-impact-tracking | soft | 规范变更时使用 analyze-impact.js |
| write-commands | hard | 依赖 /write-* 命令生成文档 |

---

## 5. Acceptance Criteria <!-- id: feat_requirements_expert_acceptance -->

> 以下验收标准由人类在实际使用中验收，不支持自动化测试。

| Item | 人类验收方式 | 通过标准 |
|------|-------------|----------|
| 需求澄清质量 | 人类评估澄清对话的有效性 | 澄清问题切中要害，3-5 轮后需求明显比输入时清晰 |
| EARS 格式应用 | 人类审核结构化需求 | 需求使用 EARS 格式表达，结构清晰 |
| 影响分析完整性 | 人类审核影响分析结果 | 列出的影响范围与人类预期一致，无重大遗漏 |
| 影响分析边界 | 人类检查分析结果 | 需求阶段只分析到设计文档，不越界分析代码（除非无设计文档） |
| 依赖关系准确性 | 人类审核 Dependencies 章节 | 依赖关系符合实际，Type（hard/soft）判断合理 |
| 文档类型判断 | 人类确认文档类型选择 | Feature/Capability/Flow 选择符合判断规则 |
| 文档生成质量 | 人类审核生成的文档 | 文档符合规范，包含完整的 Dependencies 章节 |
| Subtasks 可执行 | 人类审核处理清单 | 清单条目明确、可执行，覆盖所有受影响文档 |

---

## 6. Consumers <!-- id: feat_requirements_expert_consumers -->

| Consumer | 使用场景 |
|----------|----------|
| flow-requirements.md | 子流程引用本文档的方法论规则 |
| flow-workflows.md | 主工作流 §6 路由到需求处理子流程 |

---

## 7. Artifacts <!-- id: feat_requirements_expert_artifacts -->

| Type | Path | Description |
|------|------|-------------|
| Flow | docs/requirements/flows/flow-requirements.md | 需求处理子流程（执行本文档方法论） |

**Design Depth**: None（方法论定义型 Feature，无需设计文档）

---

## 8. Open Questions <!-- id: feat_requirements_expert_questions -->

| Question | Context | Impact |
|----------|---------|--------|
| EARS 格式是否强制？ | 当前定义为推荐格式 | 可在实践中调整为可选 |
| 影响分析深度是否可配置？ | 当前仅分析直接依赖 | 可扩展为多层级联影响分析 |

---

*Version: v3.0*
*Created: 2025-12-25*
*Updated: 2025-12-28*
*Changes: v3.0 架构重构：从 Skill 定位改为方法论定义文档，实际执行流程移至 flow-requirements.md 子流程；移除知识库 MCP 依赖（已废弃，改用 index.json）；简化 Artifacts 章节*
