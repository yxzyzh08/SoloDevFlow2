---
type: flow
id: requirements-flow
workMode: document
status: done
priority: P0
domain: process
version: "2.0"
---

# Flow: Requirements Processing <!-- id: flow_requirements -->

> 需求处理子流程，定义新增需求、需求变更、规范变更的处理方法论

**Parent Flow**: [flow-workflows.md](flow-workflows.md) §6
**执行规范**：`.solodevflow/flows/requirements.md`
> **重要**：AI 修改执行规范时，必须修改 `template/flows/requirements.md`（模板源），而非 `.solodevflow/flows/`（项目实例）。项目实例通过 `solodevflow upgrade .` 从模板同步。

---

## 1. Overview <!-- id: flow_requirements_overview -->

### 1.1 Purpose

定义需求处理的结构化方法论：
- **需求澄清**：3-5 轮对话框架，将模糊想法转化为清晰需求
- **影响分析**：分析边界、深度、输出格式
- **依赖分析**：依赖类型判断标准（hard/soft）
- **文档生成**：调用 /write-* 命令生成规范文档

### 1.2 Flow Selection

| 用户输入 | 判断条件 | 执行流程 |
|----------|----------|----------|
| 新功能描述 | index.json 中无对应 Feature | §2 新增需求流程 |
| 修改现有功能 | index.json 中已有 Feature | §3 需求变更流程 |
| 修改规范文档 | 目标是 docs/specs/*.md | §4 规范变更流程 |

---

## 2. Flow A: New Requirement <!-- id: flow_new_requirement -->

> 新增需求处理流程

### 2.1 Phase Overview

```
Phase 1: GATHER（收集上下文）
    ↓
Phase 2: CLARIFY（需求澄清）
    ↓
Phase 3: IMPACT（影响分析）
    ↓
Phase 4: DEPENDENCY（依赖分析）
    ↓
Phase 5: CLASSIFY（文档类型判断）
    ↓
Phase 6: STRUCTURE（结构化需求）
    ↓
Phase 7: GENERATE（文档生成）
    ↓
Phase 8: VERIFY（验证完整性）
```

### 2.2 Phase Details

#### Phase 1: GATHER（收集上下文）

```
├─ 读取 state.json（当前产品状态）
├─ 读取 index.json（文档索引）
├─ 读取 PRD（产品结构）
└─ 读取相关规范文档
```

#### Phase 2: CLARIFY（需求澄清）

**方法论：3-5 轮结构化对话**

| 空间 | 核心问题 | 目标 |
|------|----------|------|
| **问题空间** | 要解决什么问题？（用户痛点） | 明确 Problem |
| | 为什么现有方案不能满足？（gap 分析） | 明确 Gap |
| | 预期达到什么效果？（成功标准） | 明确 Success Criteria |
| **方案空间** | 核心能力是什么？（Capabilities 定义） | 明确 Scope |
| | 与现有功能如何协作？（集成点） | 明确 Integration |
| **验证空间** | 如何验证达到预期？（验收标准） | 明确 Acceptance Criteria |

**执行规则**：
- 不超过 5 轮对话
- 每轮聚焦一个空间
- 渐进式深入：问题 → 方案 → 验证

#### Phase 3: IMPACT（影响分析）

```
├─ 搜索 index.json 查找相关 Feature
├─ 检查是否与现有 Feature 功能重叠
├─ 检查是否需要现有模块提供新接口
├─ 如发现实际是"需求变更" → 切换到 §3 Flow B
└─ 生成影响分析报告（标准格式）
```

**影响分析规则**：
- **分析边界**：需求阶段只分析到设计文档，代码影响由设计阶段处理
- **例外情况**：workMode: document 的 Feature，分析到直接关联的脚本

#### Phase 4: DEPENDENCY（依赖分析）

```
├─ 识别新 Feature 依赖的现有 Feature/Capability
├─ 判断依赖类型（见 §5.2 依赖判断规则）
└─ 生成 Dependencies 章节内容
```

#### Phase 5: CLASSIFY（文档类型判断）

| 类型 | 判断标准 |
|------|----------|
| **Feature** | 独立业务功能，有完整生命周期 |
| **Capability** | 跨 Feature 的横向公共能力 |
| **Flow** | 跨 Feature 的业务流程 |

#### Phase 6: STRUCTURE（结构化需求）

使用 EARS 格式结构化需求：

```
When [condition], the [system] shall [action].
```

确认所有章节内容完整。

#### Phase 7: GENERATE（文档生成）

```
├─ 调用对应的 /write-* 命令：
│   ├─ Feature → /write-feature
│   ├─ Capability → /write-capability
│   └─ Flow → /write-flow
└─ 确保包含完整的 Dependencies 章节
```

#### Phase 8: VERIFY（验证完整性）

```
└─ 检查必选章节、依赖关系是否记录
```

---

## 3. Flow B: Requirement Change <!-- id: flow_requirement_change -->

> 需求变更处理流程

### 3.1 Phase Overview

```
Phase 1b: GATHER（收集现有信息）
    ↓
Phase 2b: CLARIFY（澄清变更内容）
    ↓
Phase 3b: IMPACT（影响分析）
    ↓
Phase 4b: DEPENDENCY（依赖关系更新）
    ↓
Phase 5b: CONFIRM（变更确认）
    ↓
Phase 6b: UPDATE（文档更新）
    ↓
Phase 7b: VERIFY（验证完整性）
```

### 3.2 Phase Details

#### Phase 1b: GATHER（收集现有信息）

```
├─ 读取现有需求文档
├─ 读取现有 Dependencies 章节
├─ 读取关联的设计文档（从 Artifacts 章节）
└─ 了解历史上下文（从文档 Changes 记录）
```

#### Phase 2b: CLARIFY（澄清变更内容）

| 问题 | 目标 |
|------|------|
| 变更什么？ | 明确具体改动点 |
| 为什么改？ | 明确变更原因 |
| 影响范围？ | 只改这个还是连带其他 |

#### Phase 3b: IMPACT（影响分析）

```
├─ 搜索 index.json 查找依赖此 Feature 的其他 Feature
├─ 检查关联的设计文档是否需要更新
└─ 生成影响分析报告
```

#### Phase 4b: DEPENDENCY（依赖关系更新）

```
├─ 变更是否引入新依赖？→ 添加到 Dependencies
├─ 变更是否移除某些依赖？→ 从 Dependencies 删除
└─ 生成更新后的 Dependencies 章节
```

#### Phase 5b: CONFIRM（变更确认）

```
├─ 展示变更摘要
├─ 展示影响范围
├─ 展示依赖关系变化
└─ 等待用户确认
```

#### Phase 6b: UPDATE（文档更新）

```
├─ 调用 /write-feature 更新需求文档
└─ 生成后续任务清单（更新设计文档）
```

#### Phase 7b: VERIFY（验证完整性）

```
└─ 验证依赖关系是否正确更新
```

---

## 4. Flow C: Spec Change <!-- id: flow_spec_change -->

> 规范变更处理流程

### 4.1 Phase Overview

```
Phase 1c: GATHER（读取规范）
    ↓
Phase 2c: CLARIFY（澄清变更）
    ↓
Phase 3c: IMPACT（影响分析）
    ↓
Phase 4c: CONFIRM & EXECUTE（确认并执行）
```

### 4.2 Phase Details

#### Phase 1c: GATHER（读取规范）

```
├─ 读取目标规范文档
└─ 理解规范的作用范围
```

#### Phase 2c: CLARIFY（澄清变更）

| 问题 | 目标 |
|------|------|
| 改什么？ | 新增/修改/删除章节 |
| 为什么改？ | 变更原因 |
| 影响范围？ | 哪些文档依赖此规范 |

#### Phase 3c: IMPACT（影响分析）

```
├─ 运行 node scripts/analyze-impact.js <spec-file>
├─ 获取所有受影响的文档列表
└─ 生成处理清单（subtasks）
```

#### Phase 4c: CONFIRM & EXECUTE（确认并执行）

```
├─ 展示影响范围和处理清单
├─ 用户确认后，逐项处理：
│   ├─ 更新规范文档本身
│   └─ 遍历 subtasks，对每个受影响文档：
│       ├─ 评估是否需要修改
│       ├─ 如需要，调用对应的 /write-* 命令更新
│       └─ 标记完成
└─ 汇报处理结果
```

---

## 5. Flow D: PRD Decomposing <!-- id: flow_prd_decomposing -->

> PRD 分解阶段的执行流程，由 flow-workflows.md §10.3 路由到此

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
3. 运行 `node scripts/index.js` 更新索引
4. 决定是否立即调研新 Work Item（根据依赖关系）
5. 继续原调研或切换到新 Work Item

### 5.5 Decomposing Completion Check

**完成条件**：
- [ ] Feature Roadmap 中所有 Work Items 的 phase ≥ `feature_design`
- [ ] 没有遗漏的 Work Items
- [ ] 人类显式确认 PRD 完整性

**完成后**：
```bash
node scripts/state.js set-prd-phase prd_done
```

---

## 6. Methodology Reference <!-- id: flow_requirements_methodology -->

### 6.1 Impact Analysis Output Format

```markdown
## 影响分析结果

### 需求层影响
| 文档 | 类型 | 影响原因 | 处理方式 |
|------|------|----------|----------|

### 设计层影响
| 文档 | 类型 | 影响原因 | 处理方式 |
|------|------|----------|----------|

### 处理清单
- [ ] 任务1
- [ ] 任务2
```

### 6.2 Dependency Type Rules

| 类型 | 判断标准 | 示例 |
|------|----------|------|
| **hard** | 必须先有 A 才能实现 B；A 的接口是 B 的核心功能基础 | 认证模块(A) → 用户管理(B) |
| **soft** | B 没有 A 也能工作，但功能受限；A 是 B 的增强而非基础 | 日志模块(A) → 大多数功能(B) |

### 6.3 Subtasks Format

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

### 6.4 EARS Format

结构化需求表达格式：

| 模式 | 格式 | 示例 |
|------|------|------|
| **Ubiquitous** | The [system] shall [action] | The system shall log all errors |
| **Event-Driven** | When [event], the [system] shall [action] | When user clicks submit, the system shall validate input |
| **Conditional** | If [condition], the [system] shall [action] | If session expires, the system shall redirect to login |
| **Optional** | Where [feature], the [system] shall [action] | Where dark mode is enabled, the system shall use dark theme |

---

## 7. Dependencies <!-- id: flow_requirements_dependencies -->

| Dependency | Type | 说明 |
|------------|------|------|
| flow-workflows | hard | 父流程，提供意图识别和路由 |
| write-commands | hard | 依赖 /write-* 命令生成文档 |
| change-impact-tracking | soft | 规范变更时调用 analyze-impact.js |
| spec-requirements | hard | 依赖需求规范定义的文档结构 |

---

*Version: v2.0*
*Created: 2025-12-28*
*Updated: 2025-12-30*
*Changes: v2.0 新增 §5 Flow D: PRD Decomposing（PRD 分解执行流程，从 flow-workflows.md 迁移）；v1.1 添加执行规范引用*
