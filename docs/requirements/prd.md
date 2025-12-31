---
type: prd
status: done
version: "4.3"
---

# SoloDevFlow 2.0 <!-- id: prod_solodevflow -->

> 为超级个体打造的自进化人机协作开发系统

---

## 1. Product Vision <!-- id: prod_vision -->

### 1.1 Core Value

**为超级个体提供从需求到部署的完整人机协作开发闭环的规范+工具。**

解决的核心问题：
- 人类输入零散，注意力易分散
- AI 不按流程执行，直接响应字面需求
- 变更影响感知差，改了 A 忘了 B
- 状态管理混乱，无法掌控全局
- 产品文档结构复杂，不容易阅读和掌控
### 1.2 Target State

一个 **Self-Evolving Life Form**（自我进化的生命体）：
- 由自己构建（自举）
- 随使用者习惯不断进化，随着AI能力进化而进化
- 规范引导 + 工具辅助

### 1.3 Core Characteristics

| 特征 | 说明 |
|------|------|
| **规范+工具** | 方法论引导 + 脚本辅助 / AI 遵循 Prompt 规范 |
| **自举** | 用自己来构建自己，吃自己的狗粮 |
| **元流程** | 通过结构化流程持续优化规范 |

### 1.4 Human-AI Collaboration <!-- id: prod_collaboration -->

**核心原则：AI 写，人审**

| 角色 | 职责 |
|------|------|
| **人类** | 输入需求、咨询产品、审核、决策 |
| **AI** | 分析上下文、澄清需求、编写文档、执行实现、反馈细节 |

**主要协作场景**：

1. **咨询交付**：处理产品咨询，支持咨询+需求混合输入
   - AI 快速定位相关文档
   - 提取混合输入中的需求成分，暂存到临时需求列表
   - 咨询优先，不打断当前流程

2. **需求交付**：处理新功能开发、功能变更、问题修复
   - AI 主动加载上下文、识别需求模糊点、主动澄清
   - 文档先行：先更新规格文档，后实现代码
   - 可从临时需求列表转化而来

3. **变更管理**：处理规范/PRD/模板修改
   - 运行影响分析，展示影响范围
   - 生成 subtasks 逐个处理

**详细执行规范**：参见 [workflows](flows/flow-workflows.md)

### 1.5 Design Principles <!-- id: prod_design_principles -->

**核心原则：集成而非重造**

SoloDevFlow 2.0 基于 **Claude Code CLI** 构建，核心价值是**规范+方法论**，而非重新实现 Claude CLI 已有的基础能力。

#### 能力分层

| 层级 | 提供者 | 职责 | 示例 |
|------|--------|------|------|
| **基础能力层** | Claude Code CLI | 语言理解、工具调用、MCP 集成、上下文管理 | 理解用户意图、Read/Grep/WebSearch、知识库 MCP Server、Session 管理 |
| **规范引导层** | SoloDevFlow | 文档规范、流程定义、状态管理 | Feature Spec 结构、workflows 流程、state.json schema |
| **方法论层** | SoloDevFlow | 领域专业方法、分析规则、输出标准 | 需求澄清方法（EARS）、影响分析规则、依赖类型定义 |

#### 设计决策指南

**当设计新 Feature 时，遵循以下原则**：

| 能力类型 | ✅ 利用 Claude CLI | ❌ 不要重造 | SoloDevFlow 的职责 |
|---------|------------------|------------|-------------------|
| **意图理解** | Claude 的语言理解能力 | 不要实现意图识别系统 | 通过 CLAUDE.md/Skill 引导理解方向 |
| **知识查询** | MCP Server 集成 | 不要在 Skill 内部实现查询逻辑 | 定义知识库 Schema（文档结构、关系类型） |
| **文件操作** | Read/Grep/Glob/Edit/Write 工具 | 不要用 Bash cat/grep 替代 | 定义何时读取哪些文件（规范、模板） |
| **网络搜索** | WebSearch 工具 | 不要实现搜索 API 调用 | 定义何时需要搜索外部知识 |
| **上下文管理** | Session 机制、对话历史 | 不要重复管理上下文 | 定义持久化状态（state.json） |
| **需求澄清** | - | - | ✅ 定义澄清方法论（问什么问题、EARS 格式） |
| **影响分析** | - | - | ✅ 定义分析规则（边界、深度、输出格式） |
| **文档生成** | - | - | ✅ 定义文档结构和模板（PRD/Feature/Design） |
| **状态追踪** | - | - | ✅ 定义状态机制（state.json schema） |

#### 典型反例

**❌ 错误示例**：在 Skill 中实现知识库查询
```markdown
Skill 内部逻辑：
  1. 连接 SQLite 数据库
  2. 执行 SQL 查询
  3. 解析结果返回
```
**问题**：重复实现了 MCP Server 应该提供的能力。

**✅ 正确示例**：通过 MCP 集成知识库
```markdown
知识库作为 MCP Server：
  - 提供标准 MCP 接口（query/search/exists）
  - Claude CLI 通过 MCP 调用

Skill 职责：
  - 定义何时查询知识库
  - 定义如何使用查询结果（判断新增 vs 变更）
```

---

## 2. Target Users <!-- id: prod_users -->

### 2.1 User Profile

| 属性 | 描述 |
|------|------|
| 角色 | 超级个体开发者 |
| 特征 | 1人完成产品全流程（需求→部署），使用 Claude Code 作为 AI 协作伙伴 |
| 痛点 | 输入零散、AI 不按流程、变更感知差、状态混乱 |

### 2.2 User Needs

- 需要一个一致的协作框架，引导 AI 行为
- 需要状态管理，跨 Session 保持上下文
- 需要变更追踪，不丢失关键输入
- 需要灵活性，支持咨询+需求混合输入

---

## 3. Product Description <!-- id: prod_description -->

### 3.1 High Level Overview

SoloDevFlow 2.0 是一套**规范 + 工具**的组合：

| 组成部分 | 说明 |
|----------|------|
| **规范文档** | 定义需求、设计、开发、测试的文档结构和编写标准 |
| **协作流程** | 定义人机协作的工作流、状态管理、输入捕获机制 |
| **辅助工具** | 状态查看、格式校验、自动化脚本 |
| **智能技能** | Claude 自动触发的智能助手（需求专家等） |


### 3.2 Domain Structure

| Domain | 说明 | Feature 数量 |
|--------|------|--------------|
| **specification** | 规范文档（元规范/需求/设计/开发/测试/执行流程） | 6 |
| **process** | 协作流程（核心流程/状态管理/输入捕获/影响追踪/文档验证/项目重构） | 6 |
| **tooling** | 独立工具（项目初始化） | 1 |
| **ai-config** | AI 协作配置（Hooks/CLAUDE.md/命令/审核/架构演进） | 4 |

---

## 4. Feature Roadmap <!-- id: prod_roadmap -->

> Feature 状态由 state.json 统一管理，PRD 不记录状态。Feature 之间的依赖关系定义在各 Feature 的 Dependencies 章节.

### 4.1 Domain: specification <!-- id: domain_specification -->

规范文档系统，定义各阶段的文档结构和编写标准。

#### meta <!-- id: feat_ref_meta -->

文档系统元规范，定义文档身份识别、锚点系统、规范映射机制，为文档验证和影响分析提供元数据支持。

**元信息**：
- **Priority**: P0
- **Type**: document
- **Feature**: [spec-meta.md](../specs/spec-meta.md)

#### requirements <!-- id: feat_ref_requirements -->

需求文档规范，定义 PRD、Feature、Capability、Flow 的结构、内容要素、编写标准。

**元信息**：
- **Priority**: P0
- **Type**: document
- **Feature**: [spec-requirements.md](../specs/spec-requirements.md)

#### design <!-- id: feat_ref_design -->

设计文档规范，定义架构设计、接口设计、数据模型的文档结构和编写标准。

**元信息**：
- **Priority**: P0
- **Type**: document
- **Feature**: [spec-design.md](../specs/spec-design.md)

#### development <!-- id: feat_ref_development -->

开发规范，定义代码结构、命名约定、注释标准，保证代码质量和一致性。

**元信息**：
- **Priority**: P1
- **Type**: document
- **Feature**: [spec-backend-dev.md](../specs/spec-backend-dev.md), [spec-frontend-dev.md](../specs/spec-frontend-dev.md)

#### testing <!-- id: feat_ref_testing -->

测试规范，定义单元测试、集成测试、验收测试的编写标准和覆盖率要求。

**元信息**：
- **Priority**: P1
- **Type**: document
- **Feature**: [spec-test.md](../specs/spec-test.md)

#### execution-flow <!-- id: feat_ref_execution_flow -->

工作流执行规范，定义 `.solodevflow/flows/*.md` 执行规范文档的编写标准。基于 Claude Code 最佳实践，规范化 AI 执行规范的结构、格式、指令编写原则。

**元信息**：
- **Priority**: P1
- **Type**: document
- **Feature**: [spec-execution-flow.md](../specs/spec-execution-flow.md)

### 4.2 Domain: process <!-- id: domain_process -->

协作流程系统，定义人机协作的机制和状态管理。

#### workflows <!-- id: flow_ref_workflows -->

标准工作流，定义人机协作的标准流程。基于 [1.4 Human-AI Collaboration](#prod_collaboration) 章节的协作原则，提供完整的执行规范：意图路由（识别输入类型）、阶段流转（Feature 生命周期）、交付流程（需求澄清/设计/实现/验收）。

**元信息**：
- **Priority**: P0
- **Type**: document
- **Flow**: [flow-workflows.md](flows/flow-workflows.md)

#### state-management <!-- id: feat_ref_state_management -->

状态管理机制，解决跨 Session 状态丢失、无法掌控全局的问题。定义 state.json 作为唯一状态源，记录 Feature 状态、subtasks、灵光想法、文档债务等。

**元信息**：
- **Priority**: P0
- **Type**: document
- **Feature**: [fea-state-management.md](features/fea-state-management.md)

#### change-impact-tracking <!-- id: feat_ref_change_impact_tracking -->

变更影响追踪机制，解决修改规范/PRD/Feature 时遗漏关联影响的问题。基于依赖图分析变更影响范围，通过 Hook 自动触发并生成子任务。

**元信息**：
- **Priority**: P0
- **Type**: code
- **Feature**: [fea-change-impact-tracking.md](features/fea-change-impact-tracking.md)
- **Artifact**: [scripts/analyze-impact.js](../../scripts/analyze-impact.js)

#### input-capture <!-- id: feat_ref_input_capture -->

输入捕获机制，记录人类的关键输入和决策到 input-log.md，防止需求变更时丢失上下文。

**元信息**：
- **Priority**: P0
- **Type**: document
- **Feature**: [fea-input-capture.md](features/fea-input-capture.md)

#### document-validation <!-- id: cap_ref_document_validation -->

文档格式验证能力，确保需求/设计/测试文档符合规范定义的结构。验证 Frontmatter、必选章节、锚点格式、引用有效性。被 change-impact-tracking 消费。

**元信息**：
- **Priority**: P0
- **Type**: code
- **Capability**: [cap-document-validation.md](capabilities/cap-document-validation.md)

#### project-refactor <!-- id: feat_ref_project_refactor -->

项目重构能力，为现有项目提供文档架构重构流程。通过逆向理解代码和现有文档，自顶向下重建符合 SoloDevFlow 规范的文档体系（PRD → Feature → Capability → Flow）。完成后自动切换到正常工作流。

**元信息**：
- **Priority**: P1
- **Type**: process
- **Flow**: [flow-refactoring.md](flows/flow-refactoring.md)

> Note: Feature 需求已合并到 Flow 文档中

### 4.3 Domain: tooling <!-- id: domain_tooling -->

独立工具系统，提供不依附于其他 Feature 的独立工具。

> **注**：与 Feature 强相关的工具脚本已整合至对应 Feature（如 validate-state.js → state-management，analyze-impact.js → change-impact-tracking）。本 Domain 管理**独立工具**。

#### project-init <!-- id: feat_ref_project_init -->

项目初始化工具，解决 SoloDevFlow 无法在其他项目中使用的问题。初始化 .flow/ 目录、安装命令集、复制规范文档和模板、生成 CLAUDE.md 骨架。

**元信息**：
- **Priority**: P0
- **Type**: code
- **Feature**: [fea-project-init.md](features/fea-project-init.md)

### 4.4 Domain: ai-config <!-- id: domain_ai_config -->

AI 协作配置系统，定义 Claude 的行为规范、命令、技能和 Hooks 集成。

#### hooks-integration <!-- id: feat_ref_hooks_integration -->

Claude Code Hooks 集成，解决 AI 对话缺乏项目上下文的问题。通过 SessionStart/UserPromptSubmit/PreToolUse Hooks 实现工作流自动化：自动注入项目状态、阶段守卫、文件保护。

**元信息**：
- **Priority**: P0
- **Type**: code
- **Feature**: [fea-hooks-integration.md](features/fea-hooks-integration.md)
- **Artifact**: [.claude/hooks/](../../.claude/hooks/)

#### claude-md <!-- id: feat_ref_claude_md -->

AI 行为入口，解决 AI 对话启动时缺乏上下文和导航的问题。对话开始时读取 state.json 汇报状态，指向 flow-workflows.md 获取具体流程定义。

**元信息**：
- **Priority**: P0
- **Type**: document
- **Feature**: [CLAUDE.md](../../CLAUDE.md)

#### write-commands <!-- id: feat_ref_write_commands -->

文档编写命令，解决文档编写效率和规范一致性问题。提供结构化的文档编写指令（/write-prd, /write-feature 等），自动加载规范和模板，输出后触发校验。

**元信息**：
- **Priority**: P0
- **Type**: document
- **Feature**: [fea-write-commands.md](features/fea-write-commands.md)
- **Artifact**: [.claude/commands/](../../.claude/commands/)

#### review-assistant <!-- id: feat_ref_review_assistant -->

需求审核助手 Subagent，协助人类审核需求文档。自动加载 PRD 和需求文档上下文，搜索行业最佳实践，生成结构化审核报告。作为独立流程，人类可随时发起。

**元信息**：
- **Priority**: P0
- **Type**: code
- **Feature**: [fea-review-assistant.md](features/fea-review-assistant.md)

---

## 5. Success Criteria <!-- id: prod_success -->

| Criteria | Metric | Target |
|----------|--------|--------|
| 规范可用 | 规范文档完整可读 | 4 个规范文档完成 |
| 工具可用 | 脚本可运行无报错 | status + validate 可用 |
| 自举验证 | 用 SoloDevFlow 开发 SoloDevFlow | 完成自举 |
| AI 一致性 | AI 按规范执行 | 持续优化 CLAUDE.md |

---

## Non-Goals <!-- id: prod_non_goals -->

- **不做 IDE 插件**：当前阶段聚焦规范和 CLI 工具
- **不做多人协作**：专为 Solo 开发者设计
- **不做强制执行**：规范是引导而非强制，AI 行为依赖 Prompt

---

## Appendix <!-- id: prod_appendix -->

### Glossary

#### 核心概念

| Term | Definition |
|------|------------|
| **Domain** | 业务领域，组织相关的 Feature/Capability/Flow |
| **Spec** | 规格文档（需求或设计） |

#### 需求文档类型

| 类型 | 定义 | 主要用途 | 状态管理 |
|------|------|----------|----------|
| **Feature** | 独立的业务功能单元 | 交付完整的业务能力（代码或文档） | 支持 workMode、phase 跟踪 |
| **Capability** | 跨 Feature 的横向公共能力 | 被多个 Feature 复用的基础能力 | 支持 workMode、phase 跟踪 |
| **Flow** | 跨 Feature 的业务流程 | 定义涉及多个 Feature 的端到端流程 | 支持 workMode、phase 跟踪 |

**三者关系**：
- 在**文档结构**上平等：都有 frontmatter、都在 index.json 中统一管理
- 在**状态管理**上平等：都可通过 `flow.activeWorkItems` 激活和跟踪
- 区别在于**语义**：Feature 是垂直功能单元，Capability 是横向复用能力，Flow 是业务流程
- 示例：
  - Feature: `state-management`（状态管理功能）
  - Capability: `document-validation`（文档验证能力，被多个 Feature 使用）
  - Flow: `refactoring`（重构流程，涉及多个阶段和文档）

### Key Files

| 文件 | 用途 |
|------|------|
| `CLAUDE.md` | AI 行为规范（精简版） |
| `.solodevflow/state.json` | 唯一状态源 |
| `docs/specs/` | 规范文档 |
| `docs/templates/` | 文档模板 |

### Design Principles

- **产品级设计原则**：参见 [§1.5 Design Principles](#prod_design_principles)（集成而非重造）
- **技术级设计原则**：参见 [spec-design.md](../specs/spec-design.md)（架构、接口、数据模型设计原则）

---

*Version: v4.3*
*Created: 2024-12-16*
*Updated: 2025-12-31*
*Changes: v4.3 Domain: specification 新增 execution-flow（工作流执行规范）*
