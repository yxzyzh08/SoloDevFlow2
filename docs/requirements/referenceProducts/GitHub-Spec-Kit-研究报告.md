# GitHub Spec-Kit 深度研究报告

> **研究日期**: 2024-12-20
> **研究对象**: [github/spec-kit](https://github.com/github/spec-kit)
> **研究目的**: 提取核心架构、工作流程、最佳实践，为 SoloDevFlow 2.0 提供借鉴

---

## 一、项目概述

### 1.1 基本信息

| 项目 | 内容 |
|------|------|
| **名称** | GitHub Spec-Kit |
| **定位** | Spec-Driven Development (SDD) 工具包 |
| **开源协议** | MIT |
| **发布时间** | 2025年9月2日 |
| **当前版本** | v0.0.30+ (快速迭代中) |
| **核心贡献者** | John Lam (GitHub研究团队) |
| **支持的 AI 工具** | Copilot, Claude Code, Gemini CLI, Cursor, Windsurf 等 15+ 工具 |

### 1.2 核心价值主张

**传统开发问题**：
- 规范文档在项目启动后被遗忘，逐渐与代码脱节
- AI 编码助手缺乏上下文，生成代码质量参差不齐
- "氛围式编码"(Vibe Coding)：开发者凭感觉引导 AI，缺乏系统性

**Spec-Kit 的解决方案**：
```
规范成为可执行文档 → AI 基于规范生成代码 → 规范与代码同步演进
          ↑                                              ↓
     Constitution 约束                              Living Documentation
```

**核心承诺**：
1. 规范作为一等公民（First-Class Citizen）
2. 早期错误预防（Shift-Left Testing）
3. 跨团队协作的单一数据源（Single Source of Truth）
4. 6个月→6周的交付时间压缩（理想情况）

---

## 二、核心架构分析

### 2.1 目录结构

```
项目根目录/
├── .specify/                        # Spec-Kit 核心目录
│   ├── memory/
│   │   └── constitution.md          # 项目宪法(不可变原则)
│   ├── scripts/
│   │   ├── bash/                    # Unix/Linux/macOS 脚本
│   │   └── powershell/              # Windows 脚本
│   ├── specs/
│   │   └── NNN-feature-name/        # 自动递增编号
│   │       ├── spec.md              # 功能规范
│   │       ├── plan.md              # 技术计划
│   │       ├── research.md          # Phase 0: 技术调研
│   │       ├── data-model.md        # Phase 1: 数据模型
│   │       ├── quickstart.md        # Phase 1: 快速开始
│   │       ├── contracts/           # Phase 1: API 契约
│   │       └── tasks.md             # Phase 2: 任务分解
│   └── templates/
│       ├── spec-template.md
│       ├── plan-template.md
│       ├── tasks-template.md
│       └── commands/                # Slash 命令模板
└── .github/
    └── [AI-agent-specific]/         # AI 工具专用 prompts
```

### 2.2 Constitution（宪法）机制

**定位**：项目的"架构DNA"，定义不可变的开发原则

**核心特性**：
- 位置：`.specify/memory/constitution.md`
- 作用范围：影响所有后续的规范、计划、代码生成
- 版本管理：语义化版本（MAJOR.MINOR.PATCH）

**模板结构**：
```markdown
---
version: 1.0.0
ratification_date: 2025-12-20
last_amended_date: 2025-12-20
---

# Project Constitution

## Article I: Core Principles
- [PRINCIPLE_1]: Every feature must begin as a standalone library
- [PRINCIPLE_2]: Observability Over Opacity
- [PRINCIPLE_3]: Simplicity Over Cleverness

## Article II: Technical Standards
- Language: [LANGUAGE_VERSION]
- Testing: [TESTING_FRAMEWORK]
- Documentation: spec.md (product perspective) vs plan.md (engineering perspective)

## Article III: Commit Strategy
- Every task (T001, T002) requires its own commit
```

### 2.3 分阶段工作流（Phased Workflow）

```
Phase -1: Constitution
   /speckit.constitution → constitution.md
   ↓
Phase 0: Specify
   /speckit.specify → spec.md (产品视角)
   ↓ (optional)
Phase 0.5: Clarify
   /speckit.clarify → 消除歧义
   ↓
Phase 1: Plan
   /speckit.plan → plan.md, research.md, data-model.md, contracts/, quickstart.md
   ↓ (quality gates)
Phase 1.5: Validate
   /speckit.analyze → 跨文档一致性检查
   /speckit.checklist → 领域质量清单
   ↓
Phase 2: Tasks
   /speckit.tasks → tasks.md (T001, T002...)
   ↓
Phase 3: Implement
   /speckit.implement → 代码生成 + 逐任务 Commit
```

---

## 三、规范文件格式详解

### 3.1 Spec.md - 功能规范

**用途**：产品视角的功能说明（What & Why）

**核心原则**：
- 技术中立：不提及具体技术栈
- 面向用户：描述用户价值而非实现细节
- 可验收：包含明确的验收标准

**模板结构**：
```markdown
# [Feature Name]

## Overview
[1-2句话说明这个功能是什么]

## Problem Statement
**Who**: [用户角色]
**Pain Point**: [当前痛点]
**Goal**: [期望达成的目标]

## User Stories
- As a [角色], I want to [动作], so that [价值]

## Acceptance Criteria
- [ ] Given [前置条件], when [操作], then [期望结果]

## Success Metrics
- [可量化的成功指标]

## Out of Scope (本次不做)
- [明确不包含的功能]
```

### 3.2 Plan.md - 技术计划

**用途**：工程视角的实现方案（How）

**模板结构**：
```markdown
# Technical Plan: [Feature Name]

## Tech Stack
- **Language/Version**: [e.g., Python 3.11]
- **Primary Dependencies**: [e.g., FastAPI]
- **Storage**: [e.g., PostgreSQL]
- **Testing**: [e.g., pytest]

## Architecture Overview
[高层架构图或描述]

## Module Breakdown
1. **[Module A]**: [职责描述]
2. **[Module B]**: [职责描述]

## Data Flow
[用户操作 → 系统响应的完整流程]

## Risk & Mitigation
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
```

### 3.3 Tasks.md - 任务分解

**核心设计**：
- 原子化：每个任务独立可测试
- 编号系统：T001, T002, T003...（严格递增）
- 并行标记：`[P]` 表示可与前一任务并行
- TDD 优先：测试任务先于实现任务

**格式规范**：
```markdown
# Tasks: [Feature Name]

## Phase 3.1: Setup
- **T001**: Create project structure
  - Files: `/src`, `/tests`, `/config`
  - Dependencies: None
  - Validation: Directory structure matches plan

- **T002**: Initialize project
  - Dependencies: T001 (sequential)

- **T003 [P]**: Configure linting
  - Dependencies: None (parallel with T002)

## Phase 3.2: Tests First (TDD)
- **T005 [P]**: Contract test for GET /health endpoint
  - Validation: Test fails (no implementation yet)

## Phase 3.3: Core Implementation
- **T007**: Implement health endpoint
  - Dependencies: T005, T006 (tests must exist first)
  - Validation: T005, T006 tests pass
```

---

## 四、Slash Commands 完整清单

| 命令 | 阶段 | 输入 | 输出 |
|------|------|------|------|
| `/speckit.constitution` | Phase -1 | 项目原则描述 | `constitution.md` |
| `/speckit.specify` | Phase 0 | 功能描述（What & Why） | `spec.md` + 自动创建分支 |
| `/speckit.clarify` | Phase 0.5 | （可选）规范消歧 | 更新 `spec.md` |
| `/speckit.plan` | Phase 1 | 技术方向 | `plan.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md` |
| `/speckit.analyze` | Phase 1.5 | 跨文档分析 | 一致性报告 |
| `/speckit.checklist` | Phase 1.5 | 领域清单（UX/安全/性能） | 领域检查清单 |
| `/speckit.tasks` | Phase 2 | spec.md + plan.md | `tasks.md` |
| `/speckit.implement` | Phase 3 | tasks.md | 代码 + 逐任务 Commit |

---

## 五、最佳实践总结（重点）

### 5.1 Constitution 设计

**DO**：
- 定义可验证的原则（如"所有 API 必须有契约测试"）
- 包含 Enforcement 章节说明如何执行
- 区分"必须"（MUST）和"应该"（SHOULD）

**DON'T**：
- 过于抽象（如"代码要优雅"）
- 无法验证的原则（如"尽量简洁"）
- 技术栈锁定（应留给 plan.md）

### 5.2 Spec.md 编写

**黄金规则**："如果一个前端开发和一个后端开发读 spec.md 理解不同，说明写得不够清楚"

**DO**：
- 使用 Given-When-Then 格式验收标准
- 明确 Out of Scope（边界很重要）
- 量化成功指标（如"登录成功率 >99%"）

**DON'T**：
- 提及具体技术（React, PostgreSQL 等）
- 假设读者有技术背景
- 遗漏边界情况（如错误处理、超时）

### 5.3 验证节点

**关键检查点**：
1. **Specify 后**：产品经理审查 spec.md
2. **Plan 后**：架构师审查 plan.md + Constitution 合规性
3. **Tasks 后**：技术负责人审查任务分解合理性
4. **每 5-10 个 Task 后**：代码审查 + 测试验证

### 5.4 适用场景

| 场景 | 适合度 | 说明 |
|------|--------|------|
| 新项目从零开发 | ⭐⭐⭐⭐⭐ | 最佳场景 |
| 功能扩展（已有代码库 + 新功能） | ⭐⭐⭐⭐ | 适合 |
| 遗留系统重构 | ⭐⭐⭐ | 需要先人工分析 |
| 小型 Bug 修复 | ⭐ | 不适合（过度工程） |
| 探索性编程 | ⭐ | 不适合 |
| 复杂既有代码库 | ⭐ | AI 容易忽略现有代码 |

### 5.5 代码保留率期望

| 项目类型 | 代码保留率 | 人工调整 |
|----------|-----------|----------|
| 新项目（简单） | 80-90% | 10-20% |
| 新项目（复杂） | 60-70% | 30-40% |
| 既有代码扩展 | 50-60% | 40-50% |
| 既有代码重构 | 30-50% | 50-70% |

### 5.6 实战技巧

**技巧1：渐进式 Clarify**
```
第一轮 Specify → 粗略 spec.md
↓
Clarify (3-5 轮对话) → 消除 80% 歧义
↓
第二轮 Specify → 精确 spec.md
```

**技巧2：Task 粒度控制**
- 单个任务 < 200 行代码
- 单个任务 < 2 小时工作量
- 失败后可以 Git revert 单个 Commit

**技巧3：Parallel Task 优化**
```markdown
## 错误示例(伪并行)
- T001: Create file A
- T002 [P]: Modify file A  ← 错误!依赖 T001

## 正确示例
- T001: Create file A
- T002 [P]: Create file B  ← 正确!不同文件
- T003: Integrate A and B
```

---

## 六、与主流 AI 工具的集成方式

### 6.1 Agent-Agnostic 设计

**核心理念**：Spec-Kit 本身不是 AI，而是"AI 的操作系统"

```
Specify CLI (Python)
       ↓
Templates (Markdown + YAML)
       ↓
Agent-Specific Prompts (.github/)
       ↓
AI Coding Assistants (执行 Slash Commands)
```

### 6.2 Claude Code 集成

```bash
# 初始化
specify init my-project --ai claude

# 生成的 .github/claude/ 结构
.github/claude/
├── specify.prompt.md
├── plan.prompt.md
├── tasks.prompt.md
├── implement.prompt.md
├── analyze.prompt.md
└── checklist.prompt.md
```

---

## 七、与 SoloDevFlow 的对比

### 7.1 核心设计对比

| 维度 | GitHub Spec-Kit | SoloDevFlow 2.0 |
|------|-----------------|-----------------|
| **定位** | 规范驱动开发工具包 | 人机协作流程规范 |
| **核心文件** | Constitution + Spec + Plan + Tasks | state.json + input-log + spark-box + CLAUDE.md |
| **状态管理** | 文件分散（多个 .md 文件） | 集中式（state.json） |
| **AI 角色** | 被动执行命令 | 主动引导流程 |
| **阶段划分** | Phase 0-3 | 5阶段循环 |
| **人类输入捕获** | 无专门机制 | input-log.md 强制记录 |
| **灵光管理** | 无 | spark-box.md |
| **文档债务** | 无追踪 | pending-docs.md |
| **影响分析** | 依赖 AI 自觉 | 变更前强制分析 |
| **工具校验** | 无（依赖人工） | npm run validate |

### 7.2 可借鉴设计

#### 7.2.1 Constitution 机制

**建议**：为 SoloDevFlow 增加 `.flow/constitution.md`

**用途**：
- 定义项目不可变原则
- 作为 CLAUDE.md 的补充（流程规范 + 质量原则）

#### 7.2.2 分阶段文档

**Spec-Kit 的多文档策略**：
```
spec.md         → 产品视角(What & Why)
plan.md         → 工程视角(How)
data-model.md   → 数据结构
contracts/      → API 契约
```

**SoloDevFlow 改进建议**：
```
docs/iterations/迭代1/
├── PRD.md              # 产品需求
├── 设计.md             # 技术方案
├── 数据模型.md         # 数据结构
└── 契约/               # API 契约
```

#### 7.2.3 任务分解模板

**建议**：增加 tasks.md

```markdown
# 迭代 1 - 任务分解

## Phase 1: Setup
- [ ] **T001**: 创建项目结构
  - 依赖: 无
  - 验证: 目录结构符合设计

## Phase 2: Tests (TDD)
- [ ] **T002 [P]**: 登录 API 契约测试
  - 依赖: T001
  - 验证: 测试失败(未实现)

## Phase 3: Implementation
- [ ] **T003**: 实现登录 API
  - 依赖: T002
  - 验证: T002 测试通过
```

#### 7.2.4 质量门命令

**建议**：增加校验命令

```bash
npm run validate:consistency  # 检查文档一致性
npm run validate:security     # 检查安全性
```

### 7.3 不建议借鉴

| 部分 | 原因 |
|------|------|
| 分支编号系统 | 多人协作冲突，分支名与目录名强耦合 |
| 过多的 Slash 命令 | SoloDevFlow 理念是"人类用自然语言，AI 主动引导" |
| 模板占位符系统 | 人类可读性差 |

---

## 八、局限性与挑战

### 8.1 技术局限

| 问题 | 描述 |
|------|------|
| 工具锁定 | 初始化后无法切换 AI 工具 |
| 既有代码支持弱 | AI 倾向创建新代码，不重用现有模块 |
| Python 依赖 | Specify CLI 需要 Python 3.11+ |
| 代码质量不稳定 | 同一任务多次执行结果差异大 |

### 8.2 "回到瀑布模型"争议

**批评**：
> "Spec-Kit 让我们回到了 20 年前的瀑布模型"

**真相**：
- 对小型项目：确实有"大炮打蚊子"的感觉
- 对中大型项目：规范先行降低返工成本
- 关键：是否允许迭代

### 8.3 实现不遵守计划

**问题**：AI 生成的代码经常偏离 plan.md

**缓解措施**：
- 在 Constitution 中明确约束
- 每 5 个任务审查一次代码

---

## 九、关键链接

### 官方资源
- [GitHub Spec-Kit 仓库](https://github.com/github/spec-kit)
- [GitHub 官方博客：Spec-Driven Development with AI](https://github.blog/ai-and-ml/generative-ai/spec-driven-development-with-ai-get-started-with-a-new-open-source-toolkit/)

### 深度分析
- [Microsoft 开发者博客：深入 Spec-Kit](https://developer.microsoft.com/blog/spec-driven-development-spec-kit)
- [Martin Fowler：理解 SDD](https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html)
- [Scott Logic：Spec-Kit 实测](https://blog.scottlogic.com/2025/11/26/putting-spec-kit-through-its-paces-radical-idea-or-reinvented-waterfall.html)

### 实战案例
- [从 PRD 到生产：我的 Spec-Kit 工作流](https://steviee.medium.com/from-prd-to-production-my-spec-kit-workflow-for-structured-development-d9bf6631d647)
- [EPAM：用 Spec-Kit 探索既有代码库](https://www.epam.com/insights/ai/blogs/using-spec-kit-for-brownfield-codebase)

---

## 十、总结

### 核心价值

Spec-Kit 解决的核心问题：
1. **AI 编程的"氛围式编码"问题**：通过结构化规范约束 AI
2. **文档与代码脱节**：通过"规范作为一等公民"保持同步
3. **团队协作的模糊地带**：通过 Constitution 和 Spec 对齐理解

### 对 SoloDevFlow 的启示

| 维度 | 启示 |
|------|------|
| **Constitution** | 引入项目不可变原则文件 |
| **文档分离** | 产品视角（PRD）与技术视角（设计）分离 |
| **任务原子化** | 强制 TDD、并行标记、独立可回滚 |
| **质量门** | 自动化一致性检查 |

### 下一步行动建议

**立即行动**：
1. 设计 Constitution 机制
2. 拆分 PRD 为多个文档

**中期规划**：
1. 实现 validate 命令
2. 任务分解模板

---

**研究报告完成时间**：2024-12-20
**版本**：v1.0
