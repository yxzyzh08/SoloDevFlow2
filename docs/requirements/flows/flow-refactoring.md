---
type: flow
id: refactoring
workMode: document
status: not_started
priority: P1
domain: process
version: "2.0"
---

# Flow: Refactoring <!-- id: flow_refactoring -->

> 文档架构重构工作流，将现有项目渐进式迁移至 SoloDevFlow 规范体系

**执行规范**：`.solodevflow/flows/refactoring.md`
> 执行规范由 AI 根据本需求文档生成，模板位于 `template/flows/refactoring.md`。

---

## 1. Intent <!-- id: flow_refactoring_intent -->

### 1.1 Problem

现有项目接入 SoloDevFlow 时，往往已有代码和零散文档。这些项目需要：
- 从代码中逆向理解系统架构（行业研究显示，团队花费 50% 时间在理解阶段）
- 重建符合规范的文档体系（PRD → Feature → Capability → Flow）
- 渐进式完成重构，不影响日常开发
- 建立安全网（测试覆盖），确保重构不破坏现有行为

### 1.2 Value

- **架构重建**：不是翻译文档，而是重建文档架构
- **渐进式迁移**：按阶段完成，可中断可恢复
- **代码驱动**：从真实代码理解系统，确保文档与代码一致
- **风险可控**：小步快跑，每个变更可独立验证和回滚
- **业务对齐**：重构目标与业务价值直接关联

---

## 2. Overview <!-- id: flow_refactoring_overview -->

### 2.1 Purpose

为已有代码和文档的项目提供渐进式重构流程：
- 从代码逆向理解系统架构
- 自顶向下重建文档体系
- 完成后无缝切换到正常工作流

### 2.2 Participants

| 参与方 | 角色 | 职责 |
|--------|------|------|
| 人类 | 决策者 | 确认理解、审核文档、阶段签收 |
| AI | 执行者 | 分析代码、编写文档、运行验证 |
| init.js | 入口检测 | 识别现有项目，引导进入重构模式 |
| validate-docs.js | 质量守卫 | 验证文档符合规范 |

### 2.3 与正常工作流的关系

```
┌─────────────────────────────────────────────────────────────┐
│                     项目生命周期                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  init.js 检测   ┌──────────────────┐   ┌──────────────────┐ │
│  现有项目  ───→ │ flow-refactoring │ → │ flow-workflows   │ │
│                │ (本流程)          │   │ (正常工作流)      │ │
│                └──────────────────┘   └──────────────────┘ │
│                        ↑                                    │
│                   重构完成后切换                             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Flow Phases <!-- id: flow_refactoring_phases -->

### 3.1 Phase Overview

```
Phase 1: UNDERSTAND（理解）
    ↓ 用户确认理解准确
Phase 2: PRD（PRD 重构）
    ↓ PRD 通过验证
Phase 3: REQUIREMENTS（需求分解）
    ↓ 所有需求文档编写完成
Phase 4: DESIGN（设计补全，可选）
    ↓ 设计文档完成或用户跳过
Phase 5: VALIDATE（验证完成）
    ↓ 验证通过 + 用户确认
[Exit] → 切换到 flow-workflows 正常工作流
```

### 3.2 Phase Details

#### Phase 1: UNDERSTAND（理解）

> 理解先于变更：在做任何改动之前，深入理解现有系统

**目标**：理解现有系统的架构和功能

**AI 行为**：

```
├─ Step 1.1: 代码结构扫描
│   ├─ 扫描目录结构，识别模块划分
│   ├─ 识别技术栈（框架、语言、构建工具）
│   └─ 识别项目类型（Web/CLI/Library/API）
│
├─ Step 1.2: 文档收集
│   ├─ 读取 README、现有文档
│   ├─ 提取关键信息（功能描述、架构图）
│   └─ 识别文档与代码的差异
│
├─ Step 1.3: 依赖分析
│   ├─ 分析 package.json/requirements.txt 等
│   ├─ 识别核心依赖 vs 开发依赖
│   └─ 标记过时或有安全风险的依赖
│
├─ Step 1.4: 系统边界确认
│   └─ 向用户确认：
│       ├─ 核心功能列表
│       ├─ 系统边界（什么在范围内/外）
│       └─ 主要用户群体
│
└─ Output: 系统理解报告（作为 PRD 输入）
```

**产出**：

```markdown
## 系统理解报告

### 项目概况
- 项目类型：[Web/CLI/Library/API]
- 技术栈：[框架、语言、构建工具]
- 代码规模：[文件数/行数估算]

### 核心模块
| 模块 | 路径 | 职责 | 复杂度 |
|------|------|------|--------|

### 现有文档
| 文档 | 状态 | 可复用性 |
|------|------|----------|

### 技术债务
| 问题 | 严重度 | 建议 |
|------|--------|------|

### 待确认项
- [ ] 确认项1
- [ ] 确认项2
```

**退出条件**：用户确认理解准确

---

#### Phase 2: PRD（PRD 重构）

> 定义产品愿景和架构边界

**目标**：编写符合规范的 PRD

**AI 行为**：

```
├─ Step 2.1: 收集 PRD 素材
│   ├─ 从理解报告提炼核心问题
│   ├─ 从现有文档提取产品描述
│   └─ 向用户确认目标用户和产品定位
│
├─ Step 2.2: 定义 Domains
│   ├─ 基于代码模块划分识别 Domain
│   ├─ 确保每个 Domain 职责清晰
│   └─ 向用户确认 Domain 划分
│
├─ Step 2.3: 编写 PRD
│   ├─ 使用 /write-prd 命令
│   ├─ 包含 Feature Roadmap（初步列表）
│   └─ 标记 Priority（P0/P1/P2）
│
├─ Step 2.4: 验证
│   └─ 运行 npm run validate:docs
│
└─ Output: docs/requirements/prd.md
```

**PRD 质量检查清单**：
- [ ] Product Vision 清晰表达产品价值
- [ ] Domains 划分合理，无重叠
- [ ] Feature Roadmap 覆盖现有功能
- [ ] Success Criteria 可量化验证

**退出条件**：PRD 通过验证 + 用户审核通过

---

#### Phase 3: REQUIREMENTS（需求分解）

> 增量式派生需求文档

**目标**：从 PRD 派生 Feature/Capability/Flow 文档

**AI 行为**：

```
├─ Step 3.1: 规划派生顺序
│   ├─ 读取 PRD Feature Roadmap
│   ├─ 按优先级排序（P0 先行）
│   └─ 识别依赖关系，确定编写顺序
│
├─ Step 3.2: 逐个编写 Feature Spec
│   ├─ 对每个 Feature：
│   │   ├─ 读取相关代码理解实现
│   │   ├─ 使用 /write-feature 命令
│   │   ├─ 确保 Dependencies 正确声明
│   │   └─ 运行验证
│   └─ 向用户汇报进度
│
├─ Step 3.3: 识别横切能力
│   ├─ 分析已完成的 Feature
│   ├─ 识别被多个 Feature 复用的能力
│   ├─ 使用 /write-capability 命令
│   └─ 更新相关 Feature 的 Dependencies
│
├─ Step 3.4: 定义关键流程
│   ├─ 识别跨 Feature 的业务流程
│   ├─ 使用 /write-flow 命令
│   └─ 确保 Participants 正确引用 Feature
│
└─ Output: 需求文档体系
```

**进度追踪**：

```json
{
  "phase": "requirements",
  "progress": {
    "features": { "total": 10, "done": 3 },
    "capabilities": { "total": 2, "done": 0 },
    "flows": { "total": 1, "done": 0 }
  }
}
```

**退出条件**：PRD 中列出的所有 Feature/Capability/Flow 都已编写

---

#### Phase 4: DESIGN（设计补全，可选）

> 为复杂 Feature 补充设计文档

**目标**：为 `design_depth: required` 的 Feature 补充设计

**AI 行为**：

```
├─ Step 4.1: 识别需要设计的 Feature
│   ├─ 扫描所有 Feature Spec
│   ├─ 筛选 design_depth: required
│   └─ 列出待补充设计的 Feature 清单
│
├─ Step 4.2: 逐个编写设计文档
│   ├─ 对每个需要设计的 Feature：
│   │   ├─ 读取 Feature Spec 理解需求
│   │   ├─ 分析现有代码实现
│   │   ├─ 使用 /write-design 命令
│   │   └─ 更新 Feature 的 Artifacts 章节
│   └─ 向用户汇报进度
│
├─ Step 4.3: 用户决策
│   └─ 用户可选择：
│       ├─ 继续完成所有设计
│       └─ 跳过，后续按需补充
│
└─ Output: 设计文档（或跳过标记）
```

**退出条件**：所有需要设计的 Feature 都已补充设计文档，或用户选择跳过

---

#### Phase 5: VALIDATE（验证完成）

> 确保文档一致性，准备退出重构模式

**目标**：验证文档体系完整性，退出重构模式

**AI 行为**：

```
├─ Step 5.1: 运行全量验证
│   ├─ 运行 npm run validate:docs
│   ├─ 检查所有文档通过验证
│   └─ 报告任何验证错误
│
├─ Step 5.2: 交叉引用检查
│   ├─ 检查 Dependencies 引用的文档存在
│   ├─ 检查 Artifacts 引用的文件存在
│   └─ 检查锚点引用有效
│
├─ Step 5.3: 代码覆盖检查
│   ├─ 对比 PRD Feature 与 index.json
│   ├─ 确保所有 PRD Feature 都有对应文档
│   └─ 报告遗漏的 Feature
│
├─ Step 5.4: 生成验证报告
│   └─ 包含：
│       ├─ 文档统计（数量、类型分布）
│       ├─ 验证结果（通过/失败）
│       └─ 遗留问题清单
│
├─ Step 5.5: 用户最终确认
│   └─ 展示报告，请求用户确认退出重构模式
│
└─ Output: 验证报告 + 重构完成状态
```

**验证报告格式**：

```markdown
## 重构验证报告

### 文档统计
| 类型 | 数量 | 状态 |
|------|------|------|
| PRD | 1 | ✓ |
| Feature | 10 | ✓ |
| Capability | 2 | ✓ |
| Flow | 1 | ✓ |
| Design | 3 | ✓ |

### 验证结果
- [x] npm run validate:docs 通过
- [x] 交叉引用完整
- [x] PRD Feature 全部覆盖

### 遗留问题
（无）

### 结论
重构完成，可切换到正常工作流。
```

**退出条件**：验证通过 + 用户确认 → 退出重构模式，切换到正常工作流

---

## 4. State Management <!-- id: flow_refactoring_state -->

> **注意**：正式实现时需同步更新 [fea-state-management.md](../features/fea-state-management.md)，
> 将 `project.refactoring` 字段添加到 state.json Schema 定义中。

### 4.1 状态结构

```json
{
  "project": {
    "refactoring": {
      "enabled": true,
      "phase": "understand | prd | requirements | design | validate | completed",
      "progress": {
        "prd": "not_started | in_progress | done",
        "features": { "total": 0, "done": 0 },
        "capabilities": { "total": 0, "done": 0 },
        "flows": { "total": 0, "done": 0 },
        "designs": { "total": 0, "done": 0, "skipped": false }
      },
      "startedAt": "2025-12-27",
      "completedAt": null
    }
  }
}
```

### 4.2 阶段转换

| 当前阶段 | 转换条件 | 下一阶段 |
|----------|----------|----------|
| understand | 用户确认理解准确 | prd |
| prd | PRD 编写完成并通过验证 | requirements |
| requirements | 所有需求文档编写完成 | design |
| design | 设计文档完成或用户跳过 | validate |
| validate | 验证通过 + 用户确认 | completed |
| completed | - | 退出重构模式，进入正常流程 |

---

## 5. Hook Integration <!-- id: flow_refactoring_hooks -->

### 5.1 SessionStart Hook

检测重构模式，注入上下文：

```
<workflow-context>
Project: MyProject
Mode: Refactoring
Phase: requirements (需求分解)
Progress: PRD done, Features 3/10, Capabilities 0/2
Next: 继续编写 Feature Spec
</workflow-context>
```

### 5.2 Phase Guard

重构模式下的阶段守卫（简化规则）：

| 当前阶段 | 允许操作 | 禁止操作 |
|----------|----------|----------|
| understand | 读取代码/文档、运行分析 | 写需求文档 |
| prd | 写 PRD | 写 Feature/Capability/Flow |
| requirements | 写需求文档 | 写设计文档 |
| design | 写设计文档 | - |
| validate | 运行验证 | 写新文档 |

---

## 6. Methodology Reference <!-- id: flow_refactoring_methodology -->

### 6.1 理解阶段方法论

基于 2025 行业最佳实践，理解阶段应遵循：

1. **代码考古**：像考古学家一样探索代码，寻找历史痕迹
2. **运行观察**：运行系统观察实际行为，而非依赖过时文档
3. **依赖图谱**：构建模块间依赖关系图，识别核心模块
4. **技术债务审计**：识别并记录技术债务，为后续决策提供依据

### 6.2 增量重构原则

| 原则 | 说明 |
|------|------|
| **小步快跑** | 每次只做一个可独立验证的变更 |
| **安全网先行** | 在重构前确保有足够的测试覆盖 |
| **版本控制** | 每个阶段完成后提交，便于回滚 |
| **业务对齐** | 重构目标与业务价值直接关联 |
| **风险分级** | 优先处理高价值、低风险的部分 |

### 6.3 文档派生顺序

```
PRD
 ├─ Feature (P0) → Feature (P1) → Feature (P2)
 │      ↓
 │   Capability（识别横切能力）
 │      ↓
 └─ Flow（识别跨 Feature 流程）
       ↓
    Design（按需补充）
```

### 6.4 常见问题处理

| 问题 | 处理方式 |
|------|----------|
| 现有文档与代码不一致 | 以代码为准，文档作为参考 |
| 无法确定 Feature 边界 | 按代码模块划分，后续可合并/拆分 |
| 依赖关系复杂 | 先完成无依赖的 Feature，逐步补充依赖 |
| 用户不确定需求 | 记录现状，标记待确认，继续推进 |

---

## 7. Entry Point <!-- id: flow_refactoring_entry -->

> init.js 检测现有项目，询问是否启用重构模式

### 7.1 检测逻辑

```javascript
function detectExistingProject() {
  // 非 SoloDevFlow 自身项目
  if (isSoloDevFlowItself()) return false;

  // 未安装过 SoloDevFlow
  if (hasSoloDevFlowInstalled()) return false;

  // 存在代码或文档
  const hasCode = existsAny(['src/', 'lib/', 'app/']);
  const hasDocs = existsAny(['docs/', 'README.md']);

  return hasCode || hasDocs;
}
```

### 7.2 用户选择

```
检测到现有项目内容：
  - src/ (代码目录)
  - docs/ (文档目录)
  - README.md

是否启用重构模式？
  1. 是，按重构流程迁移到 SoloDevFlow 规范
  2. 否，作为新项目初始化（保留现有文件）
```

---

## 8. Acceptance Criteria <!-- id: flow_refactoring_acceptance -->

| Item | Verification | Pass Criteria |
|------|--------------|---------------|
| 入口检测 | init.js 检测现有项目 | 正确识别并提示进入重构模式 |
| 阶段状态 | state.json | 正确记录当前阶段和进度 |
| SessionStart | Hook 输出 | 显示重构模式上下文 |
| PRD 生成 | /write-prd | 生成符合规范的 PRD |
| Feature 派生 | /write-feature | 从 PRD 正确派生 Feature |
| 验证通过 | npm run validate:docs | 所有文档通过验证 |
| 模式切换 | 重构完成后 | 正确切换到正常工作流 |

---

## 9. Dependencies <!-- id: flow_refactoring_dependencies -->

| Dependency | Type | 说明 |
|------------|------|------|
| project-init | hard | 扩展 init.js 检测逻辑 |
| state-management | hard | 扩展 state.json Schema（添加 project.refactoring） |
| write-commands | hard | 依赖 /write-* 命令生成文档 |
| hooks-integration | soft | SessionStart 显示重构状态 |
| cap-document-validation | soft | 验证阶段调用 validate-docs.js |

---

## 10. Artifacts <!-- id: flow_refactoring_artifacts -->

| Type | Path | Required | Description |
|------|------|----------|-------------|
| Design | docs/designs/des-refactoring.md | Yes | 详细设计（待细化） |
| Code | scripts/init.js | Yes | 扩展检测逻辑 |
| Template | template/flows/refactoring.md | Yes | 执行规范模板 |

**Design Depth**: required

---

*Version: v2.0*
*Created: 2025-12-27*
*Updated: 2025-12-28*

## Changelog

- **v2.0** (2025-12-28): 基于 2025 行业最佳实践全面增强：添加详细阶段行为、方法论参考、验收标准
- **v1.0** (2025-12-28): 合并 fea-project-refactor 内容，消除文档重复
