# SoloDevFlow 2.0

> 1人 + Claude Code 的人机协作流程控制器

## 1. 核心概念

### 文档层级

| 层级 | 文档类型 | 说明 |
|------|----------|------|
| **产品级** | PRD | Product Requirements Document，产品需求文档，定义产品愿景、目标用户、功能路线图 |
| **领域级** | Domain Spec | 领域规格，组织相关 Feature 的业务领域（如 `user-management`、`payment`） |
| **功能级** | Feature Spec | 功能规格，定义单个功能的意图、能力、验收标准 |
| **横向能力** | Capability Spec | 跨多个 Feature 的通用能力（如 `logging`、`auth`） |
| **跨域流程** | Flow Spec | 跨多个 Domain/Feature 的业务流程 |
| **设计级** | Design Doc | 技术设计文档，定义实现方案（仅 code 类型 Feature） |

### Feature 类型

| 类型 | 产出 | 是否需要设计 |
|------|------|-------------|
| `code` | 代码 + 测试 | 视复杂度（none/required） |
| `document` | Markdown 文档 | 否 |

### Design Depth (设计深度)

| 级别 | 适用场景 | 产出 |
|------|----------|------|
| `none` | 简单、边界清晰、无架构决策 | 无设计文档，直接实现 |
| `required` | 需要架构决策、涉及多模块 | 设计文档（深度由设计规范指导） |

## 2. 对话启动

每次对话开始**必须**执行：

1. 读取 `.flow/state.json` 恢复状态
2. 汇报：当前 Feature、阶段、待处理灵光数
3. 等待人类指示

## 3. 意图识别与流程路由（核心）

识别人类输入类型，路由到对应流程：

| 意图类型 | 识别信号 | 路由 |
|----------|----------|------|
| **需求交付** | 描述功能需求、想做什么 | → 需求交付流程 |
| **功能咨询** | 询问现有功能、怎么实现的 | → 功能咨询流程 |
| **变更请求** | 修改规范/PRD/模板 | → 变更影响流程 |
| **灵光想法** | 与当前任务无关的想法 | → 记录到 `spark-box.md` |
| **关联项目查询** | 询问关联项目状态、查看其他项目 | → 关联项目查看流程 |
| **阶段不符** | 输入与当前阶段不符 | → 阶段引导 |

## 4. 流程定义

### 4.1 需求交付流程

```
需求模糊？ ─是→ 触发 requirements-expert（自动澄清）
    │
    否
    ↓
需求清晰 → 关联分析（与现有 Feature 的关系）→ 调用 /write-* → 输出文档 → 校验
```

**关联分析**：新增 Feature 时，检查与现有 Feature 的关系：
- 是否扩展现有 Feature？（如 auto-commit 扩展 state-management）
- 是否依赖现有 Feature？
- 是否影响现有 Feature 的行为？

### 4.2 设计阶段流程（code 类型 Feature）

```
Feature Spec 完成 → 评估 Design Depth → none? ─是→ 直接进入实现
                                           │
                                           否
                                           ↓
                                  required → 调用 /write-design → 输出设计文档
```

**Design Depth 判断标准**：

| 级别 | 条件 | 产出 |
|------|------|------|
| `none` | 简单、边界清晰、无架构决策 | 无设计文档 |
| `required` | 需要架构决策、涉及多模块 | 设计文档 |

### 4.3 功能咨询流程

```
加载 PRD → 定位 Feature → 查 state.json 获取 docPath → 读取文档 → 回答
```

### 4.4 变更影响流程

修改规范文档/PRD/模板时**必须**执行：

```
运行 analyze-impact.js → 展示影响报告 → 人类确认 → 生成 subtasks → 逐个处理
```

### 4.5 阶段引导

当输入与当前阶段不符：
1. 说明当前阶段
2. 提供选项：切换阶段 / 记录到灵光收集箱
3. 等待人类决定

### 4.6 灵光处理流程

**触发时机**（AI 主动提示）：
- Feature 完成时
- 阶段切换时
- 人类主动要求

**处理流程**：
```
读取 spark-box.md → 逐个展示待处理灵光 → 人类选择处理方式
                                              ├── 转需求 → 触发需求交付流程
                                              ├── 归档 → 移至"已处理灵光"
                                              └── 丢弃 → 删除该灵光
```

**AI 提示模板**：
```
有 N 个待处理灵光，是否现在处理？
1. 处理灵光
2. 稍后处理
```

### 4.7 关联项目查看流程

**触发时机**：人类询问关联项目状态

**处理流程**：
```
读取下方"关联项目"列表 → 逐个读取项目的 .flow/state.json → 输出项目名和当前阶段
```

**输出格式**：
```
关联项目状态：
| 项目 | 当前阶段 |
|------|----------|
| CVM_Demo2 | 需求阶段 |
```

**注意**：仅读取，不修改关联项目的任何文件。

## 5. 状态管理

| 文件 | 用途 |
|------|------|
| `.flow/state.json` | **唯一状态源**（Schema v8.0，详见 `docs/process/state-management.spec.md`） |
| `.flow/input-log.md` | 关键输入记录（需求/决策/反馈/变更） |
| `.flow/spark-box.md` | 灵光收集箱 |
| `.flow/pending-docs.md` | 文档债务追踪 |

## 6. 工具索引

### 命令（用户 `/命令` 调用）

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

### 技能（AI 自动触发）

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

### 状态 CLI（state.js）

**重要**：当 state.json 文件过大或需要原子操作时，使用 state.js 代替直接读写。

```bash
# 查询操作
node scripts/state.js summary                    # 状态摘要
node scripts/state.js get-feature <name>         # 获取单个 Feature
node scripts/state.js list-active                # 列出活跃 Features
node scripts/state.js get-domain <name>          # 获取 Domain 信息

# 更新操作（带并发锁）
node scripts/state.js update-feature <name> --phase=<phase> --status=<status>
node scripts/state.js complete-feature <name>    # 标记完成
node scripts/state.js add-subtask <feature> --desc="任务描述" --source=ai
node scripts/state.js complete-subtask <feature> <subtaskId>
node scripts/state.js record-commit              # 记录最新 commit 到 metadata
```

## 7. 约束规则

### 始终做

- 关键输入 → 记录到 `input-log.md`
- 灵光想法 → 记录到 `spark-box.md`，不打断当前任务
- 变更前 → 先做影响分析
- 输出 → 总分结构（先结论后细节）
- 编写文档前 → 加载对应规范
- **完成 subtask/feature 后 → 自动提交**（见下方规则）

### 自动提交规则

完成 subtask 或 feature 后，立即执行：

```bash
git add -A && git commit -m "feat(<feature-name>): <描述>"
node scripts/state.js record-commit
```

**Commit Message 格式**：
- Subtask 完成：`feat(<feature-name>): <subtask描述>`
- Feature 完成：`feat(<feature-name>): complete feature`

### 绝不做

- 需求阶段写代码
- 跳过影响分析直接执行变更
- 丢失人类的关键输入

### 双语规范

- **文件名**：英文 kebab-case
- **标题/术语**：英文
- **描述/逻辑**：中文

### 规范管理（仅 SoloDevFlow 主项目）

本项目是所有规范的源头，修改规范时：
1. **必须**运行影响分析：`node scripts/analyze-impact.js <file>`
2. 检查影响范围（所有引用此规范的项目）
3. 生成升级 subtasks
4. 使用 `/write-req-spec` 或 `/write-design-spec` 更新规范
5. 提交后，所有使用此规范的项目将自动获取更新（通过 `solodevflow.sourcePath`）

## 8. 文件结构

```
项目根目录/
├── CLAUDE.md              # 本文件（流程控制器）
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
│   └── _flows/            # 跨域流程
├── scripts/               # 工具脚本
└── .flow/                 # 状态文件
```

## 9. 关联项目

使用 SoloDevFlow 的关联项目，AI 可在人类询问时查看其状态（只读）。

| 项目 | 路径 | 说明 |
|------|------|------|
| CVM_Demo2 | `d:\github_projects\CVM_Demo2` | SoloDevFlow 验证项目 |

---

*v3.2 - 简化 Design Depth 为 2 级（none/required）*
