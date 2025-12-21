---
type: backend
template: docs/templates/backend/prd
version: "2.4"
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

### 1.4 Human-AI Collaboration

**核心原则：AI 写，人审**

| 角色 | 职责 |
|------|------|
| **人类** | 输入需求、审核、决策 |
| **AI** | 结构化、编写、执行 |

```
人类口述需求/变更 → AI 更新文档 → 人类审核确认 → AI 执行实现
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
- 需要灵活性，支持"灵光一闪"的想法捕获

---

## 3. Product Description <!-- id: prod_description -->

### 3.1 High Level Overview

SoloDevFlow 2.0 是一套**规范 + 工具**的组合：

| 组成部分 | 说明 |
|----------|------|
| **规范文档** | 定义需求、设计、开发、测试的文档结构和编写标准 |
| **协作流程** | 定义人机协作的阶段、状态管理、输入捕获机制 |
| **辅助工具** | 状态查看、格式校验、自动化脚本 |
| **智能技能** | Claude 自动触发的智能助手（需求专家等） |

**核心工作流**：
```
人类描述需求 → AI 结构化为文档 → 人类审核 → AI 执行实现 → 人类验收
```

### 3.2 Domain Structure

| Domain | 说明 | Feature 数量 |
|--------|------|--------------|
| **specification** | 规范文档（元规范/需求/设计/开发/测试） | 5 |
| **process** | 协作流程（状态管理/输入捕获/灵光收集/影响追踪） | 4 |
| **tooling** | 辅助工具（已整合至 process 域） | 0 |
| **ai-config** | AI 协作配置（CLAUDE.md/命令/技能） | 3 |

---

## 4. Feature Roadmap <!-- id: prod_roadmap -->

> Feature 之间的依赖关系定义在各 Feature Spec 的 Dependencies 章节，参见 [requirements-doc.spec.md](./specs/requirements-doc.spec.md#spec_req_optional_sections)。

### 4.1 Domain: specification

规范文档系统，定义各阶段的文档结构和编写标准。

| Priority | Feature | Type | 说明 |
|----------|---------|------|------|
| P0 | meta-spec | document | 文档系统元规范（文档身份/锚点/规范映射） |
| P0 | requirements-doc | document | 需求文档规范（PRD/Domain/Feature/Capability/Flow） |
| P0 | design-doc-spec | document | 设计文档规范（架构/接口/数据模型） |
| P1 | development-spec | document | 开发规范（代码结构/命名/注释） |
| P1 | testing-spec | document | 测试规范（单元/集成/验收测试） |

### 4.2 Domain: process

协作流程系统，定义人机协作的机制和状态管理。

| Priority | Feature | Type | 说明 |
|----------|---------|------|------|
| P0 | state-management | document | 状态管理机制（state.json Schema） |
| P0 | change-impact-tracking | document | 影响分析机制（变更追踪 + 新增关联） |
| P0 | input-capture | document | 输入捕获机制（input-log.md） |
| P0 | spark-box | document | 灵光收集与处理机制（spark-box.md） |

**change-impact-tracking**：解决变更或新增时遗漏关联影响的问题。核心能力：
- 变更影响：修改规范/PRD/模板时分析影响范围
- 新增关联：新增 Feature 时分析与现有 Feature 的关系

**spark-box**：解决"灵光一闪"想法丢失或打断当前任务的问题。核心能力：
- 灵光捕获：识别与当前任务无关的想法，记录到 spark-box.md
- 灵光处理：在合适时机（任务完成/阶段切换/人类主动）提示处理
- 灵光转化：评审后转为正式需求、归档、或丢弃

### 4.3 Domain: tooling

辅助工具系统。

> **注**：工具脚本已整合至对应 Feature：
> - `validate-state.js`、`migrate-state.js` → `state-management`
> - `analyze-impact.js`、`validate-docs.js` → `change-impact-tracking`
>
> 不再作为独立 Feature 管理。

### 4.4 Domain: ai-config

AI 协作配置系统，定义 Claude 的行为规范、命令和技能。

| Priority | Feature | Type | 说明 |
|----------|---------|------|------|
| P0 | claude-md | document | AI 流程控制器（意图识别/流程路由/状态管理） |
| P0 | write-commands | document | 文档编写命令（/write-prd, /write-feature 等） |
| P0 | requirements-expert | document | 需求专家技能（需求澄清/文档分类/调研方法） |

**claude-md**：解决 AI 无法识别人类意图和执行正确流程的问题。核心能力：
- 意图识别：判断输入类型（需求/咨询/灵光）
- 流程路由：需求 → 需求交付流程；咨询 → 功能咨询流程
- 状态管理：对话开始恢复状态，过程中记录关键输入
- 阶段引导：输入与阶段不符时，引导人类选择

**write-commands**：解决文档编写效率和规范一致性问题。提供结构化的文档编写指令（/write-prd, /write-feature 等），自动加载规范和模板，输出后触发校验。

**requirements-expert**：解决需求模糊导致文档质量低的问题。通过 3-5 轮结构化对话澄清需求，自动判断文档类型，将模糊想法转化为符合规范的规格文档。

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

## Core Flow <!-- id: prod_flow -->

```
项目启动 → Feature 循环（需求 ←→ 设计 ←→ 实现 → 验证）
                         ↑__________↑__________↑
                              (可回退)
```

详细流程定义：[core-collaboration.spec.md](./_flows/core-collaboration.spec.md)

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
| `.flow/state.json` | 唯一状态源 |
| `docs/specs/` | 规范文档 |
| `docs/templates/` | 文档模板 |

### Design Principles

核心设计原则定义在设计文档规范中：[design-doc-spec.md](./specs/design-doc-spec.md#spec_design_principles)

---

*Version: v2.5*
*Created: 2024-12-16*
*Updated: 2024-12-20*
*Changes: v2.5 移除 Feature Roadmap 表格中的状态列（状态由 state.json 统一管理）*
