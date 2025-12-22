# SoloDevFlow 2.0

> 1人 + Claude Code 的人机协作流程控制器

---

## 核心概念

### 文档层级

| 层级 | 文档类型 | 说明 |
|------|----------|------|
| **产品级** | PRD | Product Requirements Document，产品需求文档 |
| **领域级** | Domain Spec | 领域规格，组织相关 Feature 的业务领域 |
| **功能级** | Feature Spec | 功能规格，定义单个功能的意图、能力、验收标准 |
| **横向能力** | Capability Spec | 跨多个 Feature 的通用能力 |
| **跨域流程** | Flow Spec | 跨多个 Domain/Feature 的业务流程 |
| **设计级** | Design Doc | 技术设计文档（仅 code 类型 Feature） |

### Feature 类型

| 类型 | 产出 | 是否需要设计 |
|------|------|-------------|
| `code` | 代码 + 测试 | 视复杂度（none/required） |
| `document` | Markdown 文档 | 否 |

### Design Depth

| 级别 | 适用场景 | 产出 |
|------|----------|------|
| `none` | 简单、边界清晰、无架构决策 | 无设计文档 |
| `required` | 需要架构决策、涉及多模块 | 设计文档 |

---

## 协作流程

**所有流程定义详见**：[docs/_flows/core-collaboration.spec.md](docs/_flows/core-collaboration.spec.md)

### 对话启动

每次对话开始**必须**执行：读取 `.flow/state.json` → 汇报状态 → 等待指示

### 意图路由

| 意图类型 | 路由目标 |
|----------|----------|
| 需求交付 | [需求交付流程](docs/_flows/core-collaboration.spec.md#flow_requirements_delivery) |
| 功能咨询 | [功能咨询流程](docs/_flows/core-collaboration.spec.md#flow_feature_inquiry) |
| 变更请求 | [变更影响流程](docs/_flows/core-collaboration.spec.md#flow_change_impact) |
| 灵光想法 | [灵光处理流程](docs/_flows/core-collaboration.spec.md#flow_spark_handling) |
| 关联项目查询 | [关联项目流程](docs/_flows/core-collaboration.spec.md#flow_linked_projects) |
| 阶段不符 | [阶段引导](docs/_flows/core-collaboration.spec.md#flow_phase_mismatch) |

---

## 状态管理

| 文件 | 用途 |
|------|------|
| `.flow/state.json` | **唯一状态源**（详见 `docs/process/state-management.spec.md`） |
| `.flow/input-log.md` | 关键输入记录 |
| `.flow/spark-box.md` | 灵光收集箱 |
| `.flow/pending-docs.md` | 文档债务追踪 |

---

## 工具索引

### 命令

| 命令 | 用途 |
|------|------|
| `/write-prd` | 编写/更新 PRD |
| `/write-domain {name}` | 编写/更新 Domain Spec |
| `/write-feature {name}` | 编写/更新独立 Feature Spec |
| `/write-feature {domain} {name}` | 编写/更新 Domain 内 Feature Spec |
| `/write-design {name}` | 编写/更新独立 Feature Design |
| `/write-design {domain} {name}` | 编写/更新 Domain 内 Feature Design |
| `/write-capability {name}` | 编写/更新 Capability Spec |
| `/write-flow {name}` | 编写/更新 Flow Spec |
| `/write-req-spec` | 编写/更新需求文档规范 |

### 技能

| 技能 | 触发场景 |
|------|----------|
| `requirements-expert` | 需求模糊、需要澄清、不确定文档类型 |

### 脚本

```bash
npm run status           # 状态摘要
npm run validate         # 校验 .flow/ 格式
npm run validate:state   # 校验 state.json Schema
npm run validate:docs    # 校验文档规范
node scripts/analyze-impact.js <file>  # 影响分析
```

### 状态 CLI

```bash
# 查询
node scripts/state.js summary
node scripts/state.js get-feature <name>
node scripts/state.js list-active
node scripts/state.js get-domain <name>

# 更新（带并发锁）
node scripts/state.js update-feature <name> --phase=<phase> --status=<status>
node scripts/state.js complete-feature <name>
node scripts/state.js add-subtask <feature> --desc="描述" --source=ai
node scripts/state.js complete-subtask <feature> <subtaskId>
node scripts/state.js record-commit
```

---

## 文件结构

```
项目根目录/
├── CLAUDE.md              # 本文件（索引）
├── .claude/
│   ├── commands/          # 文档编写命令
│   └── skills/            # 智能技能
├── docs/
│   ├── prd.md             # 产品 PRD
│   ├── specs/             # 规范文档
│   ├── templates/         # 模板文件
│   ├── {domain}/          # Domain 目录
│   ├── _features/         # 独立 Feature
│   ├── _capabilities/     # 横向能力
│   └── _flows/            # 跨域流程（含 core-collaboration.spec.md）
├── scripts/               # 工具脚本
└── .flow/                 # 状态文件
```

---

## 关联项目

使用 SoloDevFlow 的关联项目，AI 可在人类询问时查看其状态（只读）。

| 项目 | 路径 | 说明 |
|------|------|------|
| CVM_Demo2 | `d:\github_projects\CVM_Demo2` | SoloDevFlow 验证项目 |

---

## 双语规范

- **文件名**：英文 kebab-case
- **标题/术语**：英文
- **描述/逻辑**：中文

---

## 规范管理（仅 SoloDevFlow 主项目）

本项目是所有规范的源头，修改规范时：
1. **必须**运行影响分析：`node scripts/analyze-impact.js <file>`
2. 检查影响范围
3. 生成升级 subtasks
4. 更新规范文档
5. 提交变更

---

*v4.0 - 重构为索引文件，流程定义迁移至 core-collaboration.spec.md*
