---
type: prd
version: "3.0"
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
| **specification** | 规范文档（元规范/需求/设计/开发/测试） | 5 |
| **process** | 协作流程（核心流程/状态管理/输入捕获/影响追踪/知识库/文档验证） | 6 |
| **tooling** | 独立工具（项目初始化） | 1 |
| **ai-config** | AI 协作配置（CLAUDE.md/命令/技能/架构演进） | 4 |

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

变更影响追踪机制，解决修改规范/PRD/Feature 时遗漏关联影响的问题。基于依赖图分析变更影响范围，通过锚点精确定位到具体 Feature。

**元信息**：
- **Priority**: P0
- **Type**: document
- **Feature**: [fea-change-impact-tracking.md](features/fea-change-impact-tracking.md)

#### input-capture <!-- id: feat_ref_input_capture -->

输入捕获机制，记录人类的关键输入和决策到 input-log.md，防止需求变更时丢失上下文。

**元信息**：
- **Priority**: P0
- **Type**: document
- **Feature**: [input-log.md](../../.solodevflow/input-log.md)

#### knowledge-base <!-- id: feat_ref_knowledge_base -->

产品知识库，提供文档索引、关系查询、上下文加载能力。解决 AI 无法快速定位相关文档、文档间关系无法查询、意图识别缺乏上下文的问题。基于现有规范解析文档，使用 SQLite 存储，支持关键词搜索和关系查询。

**元信息**：
- **Priority**: P0
- **Type**: code
- **Feature**: [fea-knowledge-base.md](features/fea-knowledge-base.md)

#### document-validation <!-- id: cap_ref_document_validation -->

文档格式验证能力，确保需求/设计/测试文档符合规范定义的结构。验证 Frontmatter、必选章节、锚点格式、引用有效性。被 change-impact-tracking 和 knowledge-base 消费。

**元信息**：
- **Priority**: P0
- **Type**: code
- **Capability**: [cap-document-validation.md](capabilities/cap-document-validation.md)

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

AI 协作配置系统，定义 Claude 的行为规范、命令和技能。

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
- **Feature**: [.claude/commands/](../../.claude/commands/)

#### requirements-expert <!-- id: feat_ref_requirements_expert -->

需求专家技能，解决需求模糊导致文档质量低的问题。通过 3-5 轮结构化对话澄清需求，自动判断文档类型，将模糊想法转化为符合规范的规格文档。

**元信息**：
- **Priority**: P0
- **Type**: document
- **Feature**: [.claude/skills/requirements-expert/](../../.claude/skills/requirements-expert/)

#### agent-architecture <!-- id: feat_ref_agent_architecture -->

Agent 架构演进，从单 Agent 演进到专业化 Subagent 架构。支持多窗口并行工作，每个 Agent 专注特定阶段（需求/设计/开发/测试），实现上下文精简和专业化分工。

**元信息**：
- **Priority**: P2
- **Type**: document
- **Feature**: [fea-agent-architecture.md](features/fea-agent-architecture.md)

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

| Term | Definition |
|------|------------|
| Feature | 独立的业务功能单元，按 Domain 组织 |
| Domain | 业务领域，包含多个相关 Feature |
| Capability | 跨 Feature 的横向公共能力 |
| Spec | 规格文档（需求或设计） |

### Key Files

| 文件 | 用途 |
|------|------|
| `CLAUDE.md` | AI 行为规范（精简版） |
| `.solodevflow/state.json` | 唯一状态源 |
| `docs/specs/` | 规范文档 |
| `docs/templates/` | 文档模板 |

### Design Principles

核心设计原则定义在设计文档规范中：[spec-design.md](../specs/spec-design.md)

---

*Version: v3.3*
*Created: 2024-12-16*
*Updated: 2025-12-25*
*Changes: v3.3 修复引用路径错误；v3.2 新增 document-validation Capability（文档验证能力）；v3.1 新增 knowledge-base Feature；v3.0 删除 spark-box，改为临时需求机制*
