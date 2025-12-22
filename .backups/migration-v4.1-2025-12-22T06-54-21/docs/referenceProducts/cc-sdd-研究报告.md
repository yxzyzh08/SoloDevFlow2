# gotalab/cc-sdd 深度研究报告

> **研究日期**: 2024-12-20
> **研究对象**: [gotalab/cc-sdd](https://github.com/gotalab/cc-sdd)
> **研究目的**: 提取核心架构、工作流程、最佳实践，为 SoloDevFlow 2.0 提供借鉴

---

## 一、项目概述

### 1.1 基本信息

| 项目 | 信息 |
|------|------|
| **项目名称** | cc-sdd (Claude Code Spec-Driven Development) |
| **作者** | gotalab (日本团队) |
| **GitHub Star** | 2.1k+ |
| **GitHub Fork** | 171 |
| **主要语言** | JavaScript/TypeScript (npx 工具) |
| **开发状态** | 活跃维护中 |
| **兼容工具** | Claude Code, Cursor, Gemini CLI, Codex CLI, GitHub Copilot, Qwen Code, Windsurf (7种) |
| **语言支持** | 12种语言（含中日英） |

### 1.2 核心定位

**cc-sdd** 是 AWS Kiro IDE 方法论的开源替代方案，将 Kiro 风格的规范驱动开发（Spec-Driven Development, SDD）引入到多个 AI 编码工具中。

**核心价值主张**：
- 跨平台 SDD 框架，支持 7 种主流 AI 工具
- 与 AWS Kiro 规范格式兼容，可无缝迁移
- 30 秒安装，一条命令部署
- 专为 AI-DLC (AI-Driven Development Lifecycle) 设计

---

## 二、核心架构分析

### 2.1 目录结构

```
project/
├── .claude/
│   └── commands/
│       └── kiro/              # 11-12 个 slash 命令
├── .codex/prompts/            # Codex CLI 支持
├── .github/prompts/           # GitHub Copilot 支持
├── .kiro/
│   ├── steering/              # 项目记忆系统（核心创新）
│   │   ├── product.md         # 产品上下文
│   │   ├── tech.md            # 技术栈
│   │   └── structure.md       # 代码组织规范
│   ├── settings/
│   │   ├── templates/         # 可定制的文档模板
│   │   └── rules/             # 领域特定规则
│   └── specs/
│       └── <feature-name>/
│           ├── spec.json      # 元数据 & 审批状态
│           ├── README.md      # 功能概述
│           ├── requirements.md # EARS 语法需求
│           ├── usecase.md     # 用例 & 测试数据
│           ├── sequence.md    # 时序图
│           ├── schema.md      # 数据库设计
│           ├── api.md         # API 规范
│           ├── interfaces.md  # 类型定义
│           ├── tests-red.md   # TDD 测试用例
│           ├── design.md      # 技术设计
│           └── tasks.md       # 实施任务分解
└── CLAUDE.md                  # 项目配置
```

### 2.2 三层架构设计

```
┌──────────────────────────────────────────┐
│         命令层 (Commands)                │
│  11 个 Kiro 风格 slash 命令              │
│  /kiro:steering, /kiro:spec-init, etc.  │
└──────────────────────────────────────────┘
              ↓
┌──────────────────────────────────────────┐
│      工作流引擎 (Workflow Engine)        │
│  - 阶段验证 (spec.json 状态机)          │
│  - 审批门控 (Quality Gates)             │
│  - 影响分析 (validate-* 命令)           │
└──────────────────────────────────────────┘
              ↓
┌──────────────────────────────────────────┐
│      记忆系统 (Steering System)          │
│  - 持久化项目知识 (product/tech/structure)│
│  - 跨会话上下文保持                      │
│  - AI Agent 一致性保障                   │
└──────────────────────────────────────────┘
```

### 2.3 项目记忆系统（Steering System）

**核心创新**：解决 AI 跨会话记忆丢失问题

**三维记忆模型**：
| 文件 | 职责 | 内容 |
|------|------|------|
| `product.md` | 产品记忆 | 产品愿景、业务规则、用户场景 |
| `tech.md` | 技术记忆 | 技术栈、架构模式、技术约束 |
| `structure.md` | 组织规范 | 目录规范、命名约定、代码组织 |

**特点**：
- 自动生成 + 手动定制
- 跨 Session 持久化
- 所有 Agent 共享

---

## 三、工作流程详解

### 3.1 完整工作流

```
┌─────────────┐
│   Steering  │ ← 项目记忆初始化（一次性）
│  (项目记忆)  │
└─────────────┘
      ↓
┌─────────────┐
│  spec-init  │ ← 初始化功能规范
└─────────────┘
      ↓
┌─────────────┐
│validate-gap │ ← [可选] Brownfield 项目专用
│(差异分析)    │   分析现有代码 vs 需求差异
└─────────────┘
      ↓
┌─────────────┐
│spec-design  │ ← 设计阶段
└─────────────┘
      ↓
┌─────────────┐
│validate-    │ ← [可选] 设计验证
│ design      │   检查设计与现有架构兼容性
└─────────────┘
      ↓
┌─────────────┐
│ spec-tasks  │ ← 任务分解（支持并行）
└─────────────┘
      ↓
┌─────────────┐
│  spec-impl  │ ← 实现 + TDD
└─────────────┘
      ↓
┌─────────────┐
│validate-impl│ ← [可选] 实现验证
└─────────────┘
```

### 3.2 核心命令详解

| 命令 | 功能 | 输入 | 输出 |
|------|------|------|------|
| `/kiro:steering` | 初始化项目记忆 | 现有代码库 | product.md, tech.md, structure.md |
| `/kiro:steering-custom` | 添加领域知识 | 自定义规则 | 更新 steering files |
| `/kiro:spec-init` | 创建功能规范 | 功能描述 | specs/<feature>/README.md |
| `/kiro:spec-requirements` | 需求文档化 | AI 澄清式提问 | requirements.md (EARS 格式) |
| `/kiro:validate-gap` | 差异分析 | requirements.md | Gap 报告 (Brownfield 专用) |
| `/kiro:spec-design` | 技术设计 | requirements.md | design.md, schema.md, api.md |
| `/kiro:validate-design` | 设计验证 | design.md | 兼容性报告 |
| `/kiro:spec-tasks` | 任务分解 | design.md | tasks.md (DAG 结构) |
| `/kiro:spec-impl` | 实施 | tasks.md | 代码 + 测试 |
| `/kiro:spec-status` | 状态查询 | spec.json | 进度报告 |
| `/kiro:validate-impl` | 实现验证 | 代码 + 设计 | 一致性报告 |

### 3.3 spec.json 状态机

```json
{
  "phase": "design-generated",
  "approvals": {
    "requirements": {
      "approved": true,
      "approvedBy": "human",
      "approvedAt": "2024-12-20T10:00:00Z"
    },
    "design": {
      "approved": false
    }
  },
  "tasks": {
    "total": 0,
    "completed": 0,
    "dependencies": {}
  }
}
```

**状态转换规则**：
- `init` → `requirements-generated` → `design-generated` → `tasks-generated` → `implementation-complete`
- 每个状态需审批后才能进入下一阶段

---

## 四、最佳实践总结（重点）

### 4.1 项目记忆系统最佳实践

**初始化时机**：
- 项目启动时立即运行 `/kiro:steering`
- 架构变更后重新运行
- 定期 review（每季度）

**定制化**：
- 用 `/kiro:steering-custom` 添加领域特定知识
- 例如：API 规范、安全标准、测试约定

### 4.2 质量门控（Quality Gates）

**三级验证体系**：

| 验证命令 | 场景 | 检查内容 | 输出 |
|----------|------|----------|------|
| `validate-gap` | Brownfield 项目 | 现有功能 vs 新需求的差异 | 缺失功能清单、冲突点 |
| `validate-design` | 复杂系统集成 | 设计与现有架构兼容性 | 接口冲突、依赖问题 |
| `validate-impl` | 实现完成后 | 代码 vs 设计一致性 | 偏离设计的部分 |

**使用建议**：
- Greenfield 项目：可选（加速开发）
- Brownfield 项目：强制使用（安全保障）
- 关键功能：全部启用

### 4.3 并行执行（Parallel Execution）

**任务分解策略**：
```markdown
## Task 1: Database Schema (independent)
- Dependencies: none

## Task 2: API Endpoints (depends on Task 1)
- Dependencies: [Task 1]

## Task 3: Frontend Components (independent)
- Dependencies: none
- Can run in parallel with Task 1
```

**规则**：
- 不同文件 → 可并行
- 相同文件 → 必须串行
- 依赖图必须是 DAG（无环有向图）

### 4.4 Brownfield vs Greenfield

| 维度 | Greenfield | Brownfield |
|------|------------|------------|
| 工作流 | spec-init → spec-design → spec-tasks → spec-impl | spec-init → **validate-gap** → spec-design → **validate-design** → spec-tasks → spec-impl |
| 风险 | 低（无历史包袱） | 高（需兼容现有系统） |
| 速度 | 快（跳过验证） | 慢（多次验证） |

### 4.5 AI-DLC 方法论

**核心理念**：
- AI 执行，人类验证（Mob Elaboration/Construction）
- 压缩周期：周 → 小时/天（Bolts 而非 Sprints）
- 结构化对话：AI 澄清式提问 → 人类批准

**效果**：
- 功能规划从天到小时
- 保持人类决策权
- 适合小团队/个人开发者

---

## 五、创新点分析

### 5.1 核心创新

| 创新点 | 说明 | 价值 |
|--------|------|------|
| **项目记忆系统** | 三维记忆模型（product/tech/structure） | 解决 AI 的"金鱼记忆"问题 |
| **Spec-First Guarantees** | 强制审批流程 + spec.json 状态机 | 消除"AI 自由发挥"风险 |
| **AI-DLC 落地** | 压缩周期 + 结构化对话 | 提速同时保持控制 |
| **跨 AI 工具统一** | 同一套 .kiro/ 结构，不同工具适配层 | 降低工具锁定风险 |

### 5.2 相比 Kiro 的优势

| 维度 | Kiro (AWS) | cc-sdd (开源) |
|------|-----------|---------------|
| 可用性 | Preview 阶段，需申请 | 立即可用（npx 安装） |
| 模型灵活性 | 限定模型 | 支持任意模型 |
| 平台支持 | 独立 IDE | 7 种 AI 工具 |
| 定制化 | 有限 | 完全开放 |
| 语言支持 | 英语为主 | 12 种语言 |

---

## 六、与 SoloDevFlow 的对比

### 6.1 对比总结

| 维度 | cc-sdd | SoloDevFlow 2.0 |
|------|--------|-----------------|
| **核心定位** | 规范驱动开发工具 | 人机协作开发规范 |
| **状态管理** | spec.json + steering/ | state.json（单一状态源） |
| **项目记忆** | product/tech/structure.md（三维模型） | 无专门机制 |
| **灵光机制** | 无 | spark-box.md |
| **影响分析** | validate-* 命令 | 影响分析模板 |
| **并行执行** | tasks.md DAG | 无 |
| **回退机制** | 不明确 | 明确回退规则 |
| **多 AI 支持** | 7 种工具 | 仅 Claude Code |

### 6.2 可借鉴点

**必须借鉴**：
1. **项目记忆系统**：新增 `.flow/memory/` 目录
2. **并行任务分解**：设计阶段输出 tasks.md
3. **质量门控**：增加 validate 命令

**可选借鉴**：
1. **spec.json 状态机**：state.json 添加 approvals 字段
2. **模板化文档生成**：.flow/templates/ 目录
3. **Brownfield 工作流**：项目类型标识

**不建议借鉴**：
1. 多 AI 工具支持（维护成本高）
2. 复杂的命令系统（11 个命令对个人开发者过重）
3. 过细的规范文档（11 个文档文件难以维护）

---

## 七、关键链接

### 官方资源
- [GitHub - gotalab/cc-sdd](https://github.com/gotalab/cc-sdd)
- [GIGAZINE 评测（英文）](https://gigazine.net/gsc_news/en/20251108-cc-sdd/)

### AWS Kiro 参考
- [Kiro Official Docs](https://kiro.dev/docs/specs/)
- [Kiro Best Practices](https://kiro.dev/docs/specs/best-practices/)
- [Kiro Steering Guide](https://kiro.directory/tips/steering-setup)

### AI-DLC 方法论
- [AWS: AI-Driven Development Life Cycle](https://aws.amazon.com/blogs/devops/ai-driven-development-life-cycle/)
- [Open-Sourcing Adaptive Workflows for AI-DLC](https://aws.amazon.com/blogs/devops/open-sourcing-adaptive-workflows-for-ai-driven-development-life-cycle-ai-dlc/)
- [Martin Fowler: Understanding SDD](https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html)

---

## 八、总结

### 核心价值

cc-sdd 的核心价值在于：

1. **方法论创新**：将 AWS AI-DLC 方法论工具化
2. **记忆系统**：解决 AI 跨会话遗忘问题
3. **强制流程**：通过工具保证规范执行
4. **跨平台统一**：7 种 AI 工具统一工作流

### 对 SoloDevFlow 的启示

| 维度 | 启示 |
|------|------|
| **项目记忆** | 引入三维记忆模型（product/tech/structure） |
| **并行执行** | 任务分解支持 DAG 依赖图 |
| **质量门控** | 增加自动化验证命令 |
| **Brownfield 支持** | 区分新项目与既有项目的工作流 |

### 下一步行动建议

**立即行动**：
1. 设计 `.flow/memory/` 结构
2. 在设计阶段增加 tasks.md 输出

**中期规划**：
1. 实现 validate 命令系列
2. 设计 Brownfield 工作流

---

**研究报告完成时间**：2024-12-20
**版本**：v1.0
