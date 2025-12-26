---
type: feature
version: "2.0"
priority: P0
domain: ai-config
---

# Feature: Requirements Expert <!-- id: feat_requirements_expert -->

> 需求处理领域的方法论专家，提供需求澄清、影响分析、依赖分析的结构化方法

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
- **方法论可复用**：流程和规则定义在 Skill 中，可持续优化和演进

### 1.3 Scope Boundary

**requirements-expert 是方法论专家，不是基础能力提供者**

| Requirements Expert 职责 | 非 Requirements Expert 职责（由 Claude CLI 提供） |
|-------------------------|-----------------------------------------------|
| **定义需求澄清方法**（问什么问题、EARS 格式） | 理解用户输入（语言理解能力） |
| **定义影响分析规则**（边界、深度、输出格式） | 查询知识库（通过 MCP Server） |
| **定义依赖分析规则**（类型判断标准） | 读取文件（Read/Grep 工具） |
| **定义文档结构**（调用 write-* 命令） | 网络搜索（WebSearch 工具） |
| **定义处理流程**（Flow A/B/C） | 路由决策（Claude 根据规范判断） |

**与 Claude CLI 的协作模式**：

```
用户输入："给状态管理加个版本号字段"
    ↓
[Claude CLI] 理解输入 → 判断涉及需求处理
    ↓
[Claude CLI] 通过 MCP 查询知识库 → 确认 state-management 存在
    ↓
[Claude CLI] 调用 requirements-expert Skill
    ↓
[requirements-expert] 提供方法论指导：
    - 这是"需求变更"（Feature 已存在）
    - 使用 Flow B 处理
    - 执行澄清方法（问影响范围、变更原因）
    - 执行影响分析规则（检查关联设计文档）
    - 执行依赖分析规则（检查依赖关系变化）
    - 调用 /write-feature 更新文档
```

---

## 2. Core Capabilities <!-- id: feat_requirements_expert_capabilities -->

| ID | Capability | 描述 |
|----|------------|------|
| C1 | **需求澄清方法论** | 定义结构化澄清对话框架（问题空间/方案空间/验证空间）、EARS 格式 |
| C2 | **文档类型判断规则** | 定义 Feature/Capability/Flow 的选择决策树 |
| C3 | **影响分析规则** | 定义分析边界（需求阶段到设计文档）、分析深度、输出格式 |
| C4 | **依赖关系分析规则** | 定义依赖类型（hard/soft）判断标准、持久化格式 |
| C5 | **文档生成规范** | 定义文档结构（调用 write-* 命令）、必选章节 |
| C6 | **Subtasks 生成规范** | 定义 subtask 格式、处理流程、完成标准 |

---

## 3. Workflow <!-- id: feat_requirements_expert_workflow -->

### 3.1 Flow A: 新增需求处理

> **前提**：Claude CLI 已通过 MCP 确认 Feature 不存在，判断为"新增需求"，调用 requirements-expert

```
Phase 1: GATHER（收集上下文）
  ├─ Claude 读取 state.json（当前产品状态）
  ├─ Claude 通过 MCP 查询 productOverview（产品结构）
  └─ Claude 读取相关规范文档

Phase 2: CLARIFY（需求澄清 - C1 方法论）
  ├─ 问题空间（3 个核心问题）：
  │   - 要解决什么问题？（用户痛点）
  │   - 为什么现有方案不能满足？（gap 分析）
  │   - 预期达到什么效果？（成功标准）
  │
  ├─ 方案空间（2 个核心问题）：
  │   - 核心能力是什么？（Capabilities 定义）
  │   - 与现有功能如何协作？（集成点）
  │
  └─ 验证空间（1 个核心问题）：
      - 如何验证达到预期？（验收标准）

Phase 3: IMPACT（影响分析 - C3 规则）
  ├─ Claude 通过 MCP 查询相关 Feature
  ├─ 检查是否与现有 Feature 功能重叠
  ├─ 检查是否需要现有模块提供新接口
  ├─ 如发现实际是"需求变更" → 切换到 Flow B
  └─ 生成影响分析报告（标准格式）

Phase 4: DEPENDENCY（依赖分析 - C4 规则）
  ├─ 识别新 Feature 依赖的现有 Feature/Capability
  ├─ 判断依赖类型：
  │   - hard: 必须先完成（阻塞性依赖）
  │   - soft: 可选增强（非阻塞）
  └─ 生成 Dependencies 章节内容

Phase 5: CLASSIFY（文档类型判断 - C2 规则）
  ├─ Feature：独立业务功能，有完整生命周期
  ├─ Capability：跨 Feature 的横向公共能力
  └─ Flow：跨 Feature 的业务流程

Phase 6: STRUCTURE（结构化需求 - C1 方法论）
  ├─ 使用 EARS 格式结构化需求
  └─ 确认所有章节内容完整

Phase 7: GENERATE（文档生成 - C5 规范）
  ├─ 调用对应的 write-* 命令
  └─ 包含完整的 Dependencies 章节

Phase 8: VERIFY（验证完整性）
  └─ 检查必选章节、依赖关系是否记录
```

**C1 需求澄清方法论细节**：

- **3-5 轮对话**：不超过 5 轮，每轮聚焦一个空间
- **渐进式深入**：从问题 → 方案 → 验证，逐步明确
- **EARS 格式**：结构化表达（When [condition], the [system] shall [action]）

**C3 影响分析规则细节**：

- **分析边界**：需求阶段只分析到设计文档，代码影响由设计阶段处理
- **例外情况**：designDepth: None 的 Feature，分析到直接关联的脚本
- **输出格式**：
  ```markdown
  ## 影响分析结果

  ### 需求层影响
  | 文档 | 类型 | 影响原因 | 处理方式 |

  ### 设计层影响
  | 文档 | 类型 | 影响原因 | 处理方式 |

  ### 处理清单
  - [ ] 任务1
  - [ ] 任务2
  ```

**C4 依赖关系分析规则细节**：

- **hard 依赖判断标准**：
  - 必须先有 A 才能实现 B
  - A 的接口是 B 的核心功能基础
  - 示例：认证模块（A）是用户管理（B）的 hard 依赖

- **soft 依赖判断标准**：
  - B 没有 A 也能工作，但功能受限
  - A 是 B 的增强而非基础
  - 示例：日志模块（A）是大多数功能（B）的 soft 依赖

### 3.2 Flow B: 需求变更处理

> **前提**：Claude CLI 已通过 MCP 确认 Feature 存在，判断为"需求变更"，调用 requirements-expert

```
Phase 1b: GATHER（收集现有信息）
  ├─ Claude 通过 MCP 查询现有需求文档
  ├─ Claude 读取现有 Dependencies 章节
  ├─ Claude 读取关联的设计文档（从 Artifacts 章节）
  └─ Claude 了解历史上下文（从文档 Changes 记录）

Phase 2b: CLARIFY（澄清变更内容 - C1 方法论）
  ├─ 变更什么？（具体改动点）
  ├─ 为什么改？（变更原因）
  └─ 影响范围？（只改这个还是连带其他）

Phase 3b: IMPACT（影响分析 - C3 规则）
  ├─ Claude 通过 MCP 查询依赖此 Feature 的其他 Feature
  ├─ 检查关联的设计文档是否需要更新
  └─ 生成影响分析报告

Phase 4b: DEPENDENCY（依赖关系更新 - C4 规则）
  ├─ 变更是否引入新依赖？→ 添加到 Dependencies
  ├─ 变更是否移除某些依赖？→ 从 Dependencies 删除
  └─ 生成更新后的 Dependencies 章节

Phase 5b: CONFIRM（变更确认）
  ├─ 展示变更摘要
  ├─ 展示影响范围
  ├─ 展示依赖关系变化
  └─ 等待用户确认

Phase 6b: UPDATE（文档更新 - C5 规范）
  ├─ 调用 /write-feature 更新需求文档
  └─ 生成后续任务清单（更新设计文档）

Phase 7b: VERIFY（验证完整性）
  └─ 验证依赖关系是否正确更新
```

### 3.3 Flow C: 规范变更处理

> **前提**：Claude CLI 识别到用户要修改规范文档（spec-*.md），调用 requirements-expert

```
Phase 1c: GATHER（读取规范）
  ├─ Claude 读取目标规范文档
  └─ 理解规范的作用范围

Phase 2c: CLARIFY（澄清变更 - C1 方法论）
  ├─ 改什么？（新增/修改/删除章节）
  ├─ 为什么改？（变更原因）
  └─ 影响范围？（哪些文档依赖此规范）

Phase 3c: IMPACT（影响分析 - C3 规则）
  ├─ 运行 analyze-impact.js <spec-file>
  ├─ 获取所有受影响的文档列表
  └─ 生成处理清单（subtasks - C6 规范）

Phase 4c: CONFIRM & EXECUTE（确认并执行）
  ├─ 展示影响范围和处理清单
  ├─ 用户确认后，逐项处理：
  │   ├─ 更新规范文档本身
  │   └─ 遍历 subtasks，对每个受影响文档：
  │       ├─ 评估是否需要修改
  │       ├─ 如需要，调用对应的 write-* 命令更新
  │       └─ 标记完成
  └─ 汇报处理结果
```

**C6 Subtasks 生成规范细节**：

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
| spec-requirements | hard | 依赖需求规范定义的文档结构 |
| feat_knowledge_base | hard | **通过 MCP Server 集成**，提供 Feature 存在性查询、相关文档搜索、产品概览 |
| feat_change_impact_tracking | hard | 依赖影响分析脚本（analyze-impact.js） |
| feat_write_commands | hard | 依赖 write-* 命令生成文档 |

**重要说明**：
- knowledge_base 应作为 **MCP Server** 实现，而不是 Skill 内部能力
- requirements-expert 通过 Claude CLI 的 MCP 集成访问知识库
- 不在 Skill 内部实现知识库查询逻辑

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
| CLAUDE.md | 定义何时触发 requirements-expert Skill |
| flow_workflows | 需求交付流程中调用需求专家 |

---

## 7. Artifacts <!-- id: feat_requirements_expert_artifacts -->

| Type | Path | Description |
|------|------|-------------|
| Skill | .claude/skills/requirements-expert/SKILL.md | 技能定义文件 |
| Reference | .claude/skills/requirements-expert/reference/clarify-checklist.md | 澄清问题清单 |
| Reference | .claude/skills/requirements-expert/reference/ears-format.md | EARS 格式说明 |
| Reference | .claude/skills/requirements-expert/reference/impact-analysis-template.md | 影响分析报告模板 |
| Reference | .claude/skills/requirements-expert/reference/dependency-rules.md | 依赖类型判断规则 |

**Design Depth**: None（文档型 Feature，无需设计文档）

---

## 8. Open Questions <!-- id: feat_requirements_expert_questions -->

| Question | Context | Impact |
|----------|---------|--------|
| 知识库 MCP Server 何时实现？ | requirements-expert 依赖知识库查询 | 在知识库 MCP 实现前，需要临时方案（Read/Grep） |
| EARS 格式是否强制？ | 当前定义为推荐格式 | 可在实践中调整为可选 |
| 影响分析深度是否可配置？ | 当前仅分析直接依赖 | 可扩展为多层级联影响分析 |

---

*Version: v2.0*
*Created: 2025-12-25*
*Updated: 2025-12-25*
*Changes: v2.0 重大重构：基于"集成而非重造"原则，删除与 Claude CLI 重复的能力（C1/C2/C10/C11、Flow D/M），专注于需求处理领域的方法论（澄清方法、影响分析规则、依赖分析规则、文档生成规范）；明确知识库应作为 MCP Server 实现*
