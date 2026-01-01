# Requirements Flow - Execution Spec

> AI 执行规范：需求处理阶段的执行流程



---

## TL;DR

**需求阶段核心步骤**：

| 步骤 | 动作 | 产出 |
|------|------|------|
| **1. GATHER** | 读取 state.json + PRD + index.json | 上下文 |
| **2. CLARIFY** | 3-5 轮对话（问题→方案→验证） | 需求理解 |
| **3. IMPACT** | 检查是否影响现有 Feature | 影响分析 |
| **4. CLASSIFY** | 判断 Feature/Capability/Flow | 类型决策 |
| **5. STRUCTURE** | 使用 EARS 格式编写需求 | 结构化需求 |
| **6. GENERATE** | 调用 /write-* 命令 | 需求文档 |
| **7. REVIEW** | set-phase feature_review | 等待批准 |

**流程选择**：
- **新功能** → §2 Flow A
- **修改功能** → §3 Flow B
- **修改规范** → §4 Flow C
- **PRD 分解** → §5 Flow D

---

## 1. Flow Selection

**进入需求处理时，先判断流程类型**：

| 用户输入 | 判断条件 | 执行流程 |
|----------|----------|----------|
| 新功能描述 | index.json 中无对应 Feature | §2 Flow A |
| 修改现有功能 | index.json 中已有 Feature | §3 Flow B |
| 修改规范文档 | 目标是 docs/specs/*.md | §4 Flow C |

---

## 2. Flow A: New Requirement

### 2.1 GATHER（收集上下文）

```
读取 state.json（当前产品状态）
    ↓
读取 index.json（文档索引）
    ↓
读取 PRD（产品结构）
    ↓
读取相关规范文档
```

### 2.2 CLARIFY（需求澄清）

**3-5 轮结构化对话**：

| 空间 | 核心问题 | 目标 |
|------|----------|------|
| **问题空间** | 要解决什么问题？ | 明确 Problem |
| | 为什么现有方案不能满足？ | 明确 Gap |
| | 预期达到什么效果？ | 明确 Success Criteria |
| **方案空间** | 核心能力是什么？ | 明确 Scope |
| | 与现有功能如何协作？ | 明确 Integration |
| **验证空间** | 如何验证达到预期？ | 明确 Acceptance Criteria |

**执行规则**：
- 不超过 5 轮对话
- 每轮聚焦一个空间
- 渐进式深入：问题 → 方案 → 验证

### 2.3 IMPACT（影响分析）

```
搜索 index.json 查找相关 Feature
    ↓
检查是否与现有 Feature 功能重叠
    ↓
检查是否需要现有模块提供新接口
    ↓
如发现实际是"需求变更" → 切换到 §3 Flow B
    ↓
【关键】评估是否涉及多个独立领域 → §3.7 Multi Work Item Decomposition
    ↓
生成影响分析报告
```

**多领域检测信号**：
- 需求涉及不同的功能领域（如同时涉及 workflow 和 state-management）
- 可以分开独立交付和验收
- 需求描述中有"和"/"以及"等并列词

### 2.4 DEPENDENCY（依赖分析）

| 依赖类型 | 判断标准 |
|----------|----------|
| **hard** | 必须先有 A 才能实现 B |
| **soft** | B 没有 A 也能工作，但功能受限 |

### 2.5 CLASSIFY（文档类型判断）

| 类型 | 判断标准 |
|------|----------|
| **Feature** | 独立业务功能，有完整生命周期 |
| **Capability** | 跨 Feature 的横向公共能力 |
| **Flow** | 跨 Feature 的业务流程 |

### 2.6 STRUCTURE（结构化需求）

使用 EARS 格式结构化需求：

| 模式 | 格式 |
|------|------|
| Ubiquitous | The [system] shall [action] |
| Event-Driven | When [event], the [system] shall [action] |
| Conditional | If [condition], the [system] shall [action] |

### 2.7 GENERATE（文档生成）

```
调用对应的 /write-* 命令：
    ├─ Feature → /write-feature
    ├─ Capability → /write-capability
    └─ Flow → /write-flow
```

### 2.8 VERIFY（验证完整性）

```
检查必选章节是否完整
    ↓
检查依赖关系是否记录
    ↓
set-phase <id> feature_review
```

---

## 3. Flow B: Requirement Change

### 3.1 GATHER（收集现有信息）

```
读取现有需求文档
    ↓
读取现有 Dependencies 章节
    ↓
读取关联的设计文档（从 Artifacts 章节）
    ↓
了解历史上下文（从文档 Changes 记录）
```

### 3.2 CLARIFY（澄清变更内容）

| 问题 | 目标 |
|------|------|
| 变更什么？ | 明确具体改动点 |
| 为什么改？ | 明确变更原因 |
| 影响范围？ | 只改这个还是连带其他 |

### 3.3 IMPACT（影响分析）

```
搜索 index.json 查找依赖此 Feature 的其他 Feature
    ↓
检查关联的设计文档是否需要更新
    ↓
生成影响分析报告
```

### 3.4 DEPENDENCY（依赖关系更新）

```
变更是否引入新依赖？→ 添加到 Dependencies
    ↓
变更是否移除某些依赖？→ 从 Dependencies 删除
```

### 3.5 CONFIRM（变更确认）

```
展示变更摘要
    ↓
展示影响范围
    ↓
展示依赖关系变化
    ↓
等待用户确认
```

### 3.6 UPDATE（文档更新）

```
调用 /write-feature 更新需求文档
    ↓
生成后续任务清单（更新设计文档）
    ↓
set-phase <id> feature_review
```

### 3.7 Multi Work Item Decomposition

> 当需求涉及多个独立领域时，分解为多个 Work Item

#### 触发条件

| 信号 | 说明 |
|------|------|
| 跨多个 Domain | 需求涉及不同的功能领域 |
| 多个独立交付物 | 可以分开独立交付和验收 |
| 不同的文档类型 | 同时需要 Feature + Flow + Capability |

#### 执行流程

```
[检测到多领域]
    ↓
[DECOMPOSE] 分解分析
    ├─ 识别涉及的所有领域
    ├─ 对每个领域判断：已存在 or 需新建
    ├─ 分析依赖关系
    └─ 按依赖排序
    ↓
[PROPOSE] 生成分解方案并展示给用户：

    ## 多 Work Item 分解方案

    | 序号 | 类型 | ID | 状态 | 说明 |
    |------|------|-----|------|------|
    | 1 | Feature | xxx | 需新建 | ... |
    | 2 | Flow | yyy | 已存在 | ... |

    依赖关系: [1] → [2]

    请确认是否按此方案分解？

    ↓
[HUMAN CONFIRM] 等待用户确认
    ├─ 批准 → 执行分解
    ├─ 修改 → 调整后重新确认
    └─ 拒绝 → 作为单一 Work Item 处理
    ↓
[EXECUTE] 执行分解
    ├─ 为"需新建"的 Work Item 调用 /write-* 创建需求文档
    ├─ 为"需变更"的 Work Item 更新需求文档
    ├─ 运行 index.js 更新索引
    └─ 按依赖顺序激活 Work Items
```

#### Work Item vs Subtask 判断

| 创建新 Work Item | 添加 Subtask |
|------------------|--------------|
| 可独立交付和验收 | 当前 Work Item 的子步骤 |
| 需要独立的需求/设计文档 | 不需要独立文档 |
| 属于不同的功能领域 | 属于同一功能领域 |

---

## 4. Flow C: Spec Change

### 4.1 GATHER（读取规范）

```
读取目标规范文档
    ↓
理解规范的作用范围
```

### 4.2 CLARIFY（澄清变更）

| 问题 | 目标 |
|------|------|
| 改什么？ | 新增/修改/删除章节 |
| 为什么改？ | 变更原因 |
| 影响范围？ | 哪些文档依赖此规范 |

### 4.3 IMPACT（影响分析）

```
运行 node scripts/analyze-impact.cjs <spec-file>
    ↓
获取所有受影响的文档列表
    ↓
生成处理清单（subtasks）
```

### 4.4 CONFIRM & EXECUTE（确认并执行）

```
展示影响范围和处理清单
    ↓
用户确认后，逐项处理：
    ├─ 更新规范文档本身
    └─ 遍历 subtasks，对每个受影响文档：
        ├─ 评估是否需要修改
        ├─ 如需要，调用对应的 /write-* 命令更新
        └─ 标记完成
    ↓
汇报处理结果
```

---

## 5. Flow D: PRD Decomposing

> PRD 分解阶段的执行流程，由 workflows.md §6.2 路由到此

### 5.1 Trigger Condition

当 `state.json → prd.phase = prd_decomposing` 时触发此流程。

### 5.2 Decomposing Flow

```
[PRD scope 批准]
    ↓
[读取 PRD Feature Roadmap]
    ↓
[按优先级排序 Work Items]
    ↓
┌─────────────────────────────────────────────────────────┐
│  循环处理每个 Work Item:                                  │
│                                                          │
│  1. activate <id>                                        │
│  2. set-phase <id> feature_requirements                  │
│  3. 判断 Work Item 类型:                                 │
│     ├─ 新功能 → 调用 §2 Flow A                           │
│     └─ 已有变更 → 调用 §3 Flow B                         │
│  4. set-phase <id> feature_review                        │
│  5. 等待人类审核                                         │
│     ├─ 批准 → Work Item 需求阶段完成                      │
│     │         → 【重要】update-prd-progress 更新进度     │
│     ├─ 需要修改 PRD → §5.3 PRD 回溯修改                  │
│     └─ 发现新 Work Item → §5.4 动态添加                  │
│  6. 继续下一个 Work Item                                  │
│                                                          │
│  ※ Work Items 可并行调研（多个同时激活）                   │
│  ※ 调研顺序按依赖关系和优先级决定                         │
└─────────────────────────────────────────────────────────┘
    ↓
[所有 Work Items 需求阶段完成]
    ↓
[PRD 最终审核]
    ↓
[set-prd-phase prd_done]
```

### 5.3 PRD Backtrack Modification

> 在需求调研过程中，可能发现需要修改 PRD

**允许的修改**：

| 修改类型 | 说明 | 执行方式 |
|----------|------|----------|
| 添加新 Domain | 发现需要新的领域划分 | 直接修改 PRD → 添加新 Work Items |
| 添加新 Feature | 发现需要新功能 | 直接修改 PRD → 激活新 Work Item 调研 |
| 修改 Feature 描述 | 调研后发现 scope 需调整 | 直接修改 PRD 章节 |
| 调整优先级 | 根据调研结果重排 | 直接修改 PRD |
| 删除 Feature | 调研后发现不需要 | 修改 PRD → 标记 Work Item 为 skipped |

**不允许的修改**：
- 根本性改变产品愿景（需重新走 PRD draft 流程）

### 5.4 Dynamic Work Item Addition

**发现新 Work Item 时**：
1. 暂停当前调研
2. 修改 PRD，添加新 Feature/Capability/Flow 到 Feature Roadmap
3. 运行 `node scripts/index.cjs` 更新索引
4. 决定是否立即调研新 Work Item（根据依赖关系）
5. 继续原调研或切换到新 Work Item

### 5.5 Decomposing Progress Tracking

**每个 Work Item 需求阶段完成后**：
```bash
# 更新 PRD 分解进度（done = 已完成数量, total = 总数量）
node scripts/state.cjs update-prd-progress <done> <total>
```

### 5.6 Decomposing Completion Check

**完成条件**：
- [ ] Feature Roadmap 中所有 Work Items 的 phase ≥ `feature_design`
- [ ] 没有遗漏的 Work Items
- [ ] 人类显式确认 PRD 完整性

**完成后**：
```bash
node scripts/state.cjs set-prd-phase prd_done
```

---

## 6. Execution Principles

### 始终做

- 进入需求处理前先判断流程类型
- 需求澄清不超过 5 轮对话
- 使用 EARS 格式结构化需求
- 完成后进入 feature_review 阶段
- 等待人类审核批准

### 绝不做

- 跳过需求澄清直接写文档
- 遗漏依赖关系分析
- 未经用户确认就执行变更
- 漏掉影响分析

---

## 7. Tools Reference

| 工具 | 用途 |
|------|------|
| `/write-feature` | 生成 Feature 需求文档 |
| `/write-capability` | 生成 Capability 需求文档 |
| `/write-flow` | 生成 Flow 需求文档 |
| `node scripts/analyze-impact.cjs <file>` | 分析变更影响 |
| `node scripts/state.cjs set-phase <id> feature_review` | 进入审核阶段 |

---

*Version: v2.4*
*Aligned with: flow-requirements.md v2.1*
*Updated: 2025-12-31*