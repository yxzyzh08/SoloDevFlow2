---
type: flow-spec
version: "2.0"
---

# Flow: Core Collaboration <!-- id: flow_core_collaboration -->

> 人机协作的核心流程，定义 AI 如何响应用户输入并维护状态

---

## 1. Flow Overview <!-- id: flow_core_collaboration_overview -->

### 1.1 Purpose

定义人机协作的标准流程，确保：
- 关键输入不丢失
- 灵光被捕获但不打断当前任务
- 状态始终可追溯
- 变更有影响分析
- 流程可重复、可追踪

### 1.2 Trigger

| 触发方式 | 说明 |
|----------|------|
| 用户输入 | 任何用户消息都触发此流程 |
| Session 开始 | AI 启动时读取状态恢复上下文 |

---

## 2. Participants <!-- id: flow_core_collaboration_participants -->

| Participant | Type | 职责 |
|-------------|------|------|
| User | External | 提供输入、审核、决策 |
| AI | System | 识别输入类型、记录、执行、更新状态 |
| state.json | Feature | 唯一状态源 |
| input-log.md | Feature | 关键输入记录 |
| spark-box.md | Feature | 灵光收集箱 |
| pending-docs.md | Capability | 文档债务追踪 |

---

## 3. Intent Recognition <!-- id: flow_core_collaboration_intent -->

AI 需识别人类输入类型，路由到对应流程：

| 意图类型 | 识别信号 | 路由目标 |
|----------|----------|----------|
| **需求交付** | 描述功能需求、想做什么 | → 需求交付流程（3.2） |
| **功能咨询** | 询问现有功能、怎么实现的 | → 功能咨询流程（3.3） |
| **变更请求** | 修改规范/PRD/模板 | → 变更影响流程（3.4） |
| **灵光想法** | 与当前任务无关的想法 | → 灵光处理流程（3.5） |
| **关联项目查询** | 询问关联项目状态 | → 关联项目查看流程（3.6） |
| **阶段不符** | 输入与当前阶段不符 | → 阶段引导（3.7） |

---

## 4. Flow Steps <!-- id: flow_core_collaboration_steps -->

### 4.1 Session Start Flow <!-- id: flow_session_start -->

每次对话开始**必须**执行：

```
Session 开始
  → AI 读取 .flow/state.json
  → AI 汇报：当前 Feature、阶段、待处理灵光数
  → 等待用户指示
```

| Step | 执行者 | 动作 | 输出 |
|------|--------|------|------|
| 1 | AI | 读取 state.json | 恢复项目状态 |
| 2 | AI | 汇报状态 | 当前阶段、活跃 Feature、灵光数 |
| 3 | AI | 等待指示 | 准备接收用户输入 |

### 4.2 Requirements Delivery Flow <!-- id: flow_requirements_delivery -->

需求交付流程（用户描述功能需求时触发）：

```
需求模糊？ ─是→ 触发 requirements-expert（自动澄清）
    │
    否
    ↓
需求清晰 → 关联分析 → 调用 /write-* → 输出文档 → 校验
```

**关联分析**：新增 Feature 时，检查与现有 Feature 的关系：
- 是否扩展现有 Feature？
- 是否依赖现有 Feature？
- 是否影响现有 Feature 的行为？

| Step | 执行者 | 动作 | 输出 |
|------|--------|------|------|
| 1 | AI | 判断需求清晰度 | 清晰 / 模糊 |
| 2 | AI | 若模糊，触发 requirements-expert | 澄清后的需求 |
| 3 | AI | 分析与现有 Feature 关联 | 关联报告 |
| 4 | AI | 调用 /write-* 命令 | 文档初稿 |
| 5 | User | 审核文档 | 确认 / 修改意见 |
| 6 | AI | 运行校验 | 校验结果 |

### 4.3 Design Phase Flow <!-- id: flow_design_phase -->

设计阶段流程（code 类型 Feature 专用）：

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

### 4.4 Feature Inquiry Flow <!-- id: flow_feature_inquiry -->

功能咨询流程（用户询问现有功能时触发）：

```
加载 PRD → 定位 Feature → 查 state.json 获取 docPath → 读取文档 → 回答
```

| Step | 执行者 | 动作 | 输出 |
|------|--------|------|------|
| 1 | AI | 加载 PRD 定位 Feature | Feature 名称 |
| 2 | AI | 查询 state.json | docPath 路径 |
| 3 | AI | 读取相关文档 | 文档内容 |
| 4 | AI | 整理回答 | 结构化答案 |

### 4.5 Change Impact Flow <!-- id: flow_change_impact -->

变更影响流程（修改规范/PRD/模板时触发）：

```
识别到变更请求
  → 运行 analyze-impact.js
  → 展示影响报告
  → 人类审批
  → 生成 subtasks
  → 逐个处理
```

| Step | 执行者 | 动作 | 输出 |
|------|--------|------|------|
| 1 | AI | 运行影响分析脚本 | 影响清单 |
| 2 | AI | 展示影响报告 | 文档/代码/依赖影响 |
| 3 | User | 审批影响清单 | 确认 / 调整 / 拒绝 |
| 4 | AI | 生成 subtasks | 待处理任务列表 |
| 5 | AI | 逐个处理 subtasks | 更新文档和代码 |
| 6 | AI | 恢复原任务 | 继续之前的工作 |

**处理顺序**：文档 → 设计 → 代码

### 4.6 Spark Handling Flow <!-- id: flow_spark_handling -->

灵光处理流程：

**捕获阶段**（实时）：
```
用户输入与当前任务无关的想法
  → AI 识别为"灵光"
  → 记录到 spark-box.md
  → 继续当前任务（不打断）
```

**处理阶段**（触发时机：Feature 完成 / 阶段切换 / 人类主动）：
```
读取 spark-box.md
  → 逐个展示待处理灵光
  → 人类选择处理方式
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

### 4.7 Linked Projects Flow <!-- id: flow_linked_projects -->

关联项目查看流程（人类询问关联项目状态时触发）：

```
读取 CLAUDE.md 中"关联项目"列表
  → 逐个读取项目的 .flow/state.json
  → 输出项目名和当前阶段
```

**输出格式**：
```
关联项目状态：
| 项目 | 当前阶段 |
|------|----------|
| ProjectA | 需求阶段 |
```

**注意**：仅读取，不修改关联项目的任何文件。

### 4.8 Phase Mismatch Handling <!-- id: flow_phase_mismatch -->

阶段引导流程（用户输入与当前阶段不符时触发）：

```
识别到阶段不符
  → 说明当前阶段
  → 提供选项：切换阶段 or 记录到灵光收集箱
  → 等待用户决定
```

| Step | 执行者 | 动作 | 输出 |
|------|--------|------|------|
| 1 | AI | 识别阶段不符 | 当前阶段 vs 用户意图 |
| 2 | AI | 说明情况 | 当前阶段说明 |
| 3 | AI | 提供选项 | 切换 / 记录灵光 |
| 4 | User | 做出决定 | 选择路径 |

---

## 5. Tools Reference <!-- id: flow_tools_reference -->

流程执行中使用的工具索引。

### 5.1 Commands

| 命令 | 用途 |
|------|------|
| `/write-prd` | 编写/更新 PRD |
| `/write-feature {name}` | 编写/更新独立 Feature Spec |
| `/write-feature {domain} {name}` | 编写/更新 Domain 内 Feature Spec |
| `/write-design {name}` | 编写/更新独立 Feature Design |
| `/write-design {domain} {name}` | 编写/更新 Domain 内 Feature Design |
| `/write-capability {name}` | 编写/更新 Capability Spec |
| `/write-flow {name}` | 编写/更新 Flow Spec |
| `/write-req-spec` | 编写/更新需求文档规范 |
| `/write-design-spec` | 编写/更新设计文档规范 |

### 5.2 Skills

| 技能 | 触发场景 |
|------|----------|
| `requirements-expert` | 需求模糊、需要澄清、不确定文档类型 |

### 5.3 Scripts

```bash
npm run status           # 状态摘要
npm run validate         # 校验 .flow/ 格式
npm run validate:state   # 校验 state.json Schema
npm run validate:docs    # 校验文档规范
node scripts/analyze-impact.js <file>  # 影响分析
```

### 5.4 State CLI

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

## 6. Auto-Commit Flow <!-- id: flow_auto_commit -->

完成 subtask 或 feature 后，立即执行：

```bash
git add -A && git commit -m "feat(<feature-name>): <描述>"
node scripts/state.js record-commit
```

**Commit Message 格式**：
- Subtask 完成：`feat(<feature-name>): <subtask描述>`
- Feature 完成：`feat(<feature-name>): complete feature`

---

## 7. Acceptance Criteria <!-- id: flow_core_collaboration_acceptance -->

| Item | Verification | Pass Criteria |
|------|--------------|---------------|
| Session 恢复 | 新 Session 开始 | 正确读取并汇报状态 |
| 意图识别 | 提供不同类型输入 | 正确路由到对应流程 |
| 关键输入识别 | 提供影响产品的输入 | 自动记录到 input-log.md |
| 灵光捕获 | 提供无关想法 | 记录到 spark-box.md，不打断任务 |
| 变更处理 | 请求变更 | 先做影响分析，等待确认 |
| 阶段引导 | 提供不符合阶段的请求 | 提供选项而非直接执行 |
| 自动提交 | 完成 subtask/feature | 自动执行 git commit |

---

## 8. Flow Diagram <!-- id: flow_core_collaboration_diagram -->

```
┌─────────────────────────────────────────────────────────────┐
│                     Session Start                            │
│  ┌─────────┐    ┌─────────────┐    ┌──────────────────┐     │
│  │ 读取    │ → │ 汇报状态    │ → │ 等待用户指示     │     │
│  │ state   │    │             │    │                  │     │
│  └─────────┘    └─────────────┘    └──────────────────┘     │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                     Intent Recognition                       │
│                                                              │
│  ┌─────────────┐                                            │
│  │ 用户输入   │                                            │
│  └──────┬──────┘                                            │
│         ↓                                                    │
│  ┌─────────────┐                                            │
│  │ 识别意图   │                                            │
│  └──────┬──────┘                                            │
│         ↓                                                    │
│  ┌──────┴──────┬──────────┬──────────┬──────────┐          │
│  ↓             ↓          ↓          ↓          ↓          │
│ 需求交付    功能咨询   变更请求    灵光      阶段不符      │
│  ↓             ↓          ↓          ↓          ↓          │
│ 4.2          4.4        4.5        4.6        4.8          │
└─────────────────────────────────────────────────────────────┘
```

---

## 9. Constraints <!-- id: flow_core_collaboration_constraints -->

| Type | Constraint | 说明 |
|------|------------|------|
| Consistency | state.json 是唯一状态源 | 不维护其他状态文件 |
| Atomicity | Commit 前清空 pending-docs | 不允许跨 Commit 累积债务 |
| Order | 先文档后代码 | 变更时先更新文档 |
| Isolation | 关联项目只读 | 不修改其他项目文件 |

---

## 10. Project Configuration <!-- id: flow_project_config -->

### 10.1 Linked Projects

使用 SoloDevFlow 的关联项目，AI 可在人类询问时查看其状态（只读）。

| 项目 | 路径 | 说明 |
|------|------|------|
| CVM_Demo2 | `d:\github_projects\CVM_Demo2` | SoloDevFlow 验证项目 |

### 10.2 Bilingual Convention

- **文件名**：英文 kebab-case
- **标题/术语**：英文
- **描述/逻辑**：中文

### 10.3 Spec Management (SoloDevFlow Only)

本项目是所有规范的源头，修改规范时：
1. **必须**运行影响分析：`node scripts/analyze-impact.js <file>`
2. 检查影响范围
3. 生成升级 subtasks
4. 更新规范文档
5. 提交变更

---

## 11. Do's and Don'ts <!-- id: flow_core_collaboration_rules -->

### 始终做

- 关键输入 → 记录到 `input-log.md`
- 灵光想法 → 记录到 `spark-box.md`，不打断当前任务
- 变更前 → 先做影响分析
- 输出 → 总分结构（先结论后细节）
- 编写文档前 → 加载对应规范
- 完成 subtask/feature 后 → 自动提交

### 绝不做

- 需求阶段写代码
- 跳过影响分析直接执行变更
- 丢失人类的关键输入
- 修改关联项目的文件

---

*Version: v3.0*
*Created: 2024-12-20*
*Updated: 2024-12-22*
*Changes: v3.0 完全整合 CLAUDE.md 内容，新增 Tools Reference 和 Project Configuration，成为唯一完整流程文档*
