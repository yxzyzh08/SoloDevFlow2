---
type: flow
id: refactoring
workMode: code
status: done
phase: done
priority: P1
domain: process
version: "2.5"
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
Phase 4: DESIGN（设计重构）
    ↓ 设计文档重构完成
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

#### Phase 4: DESIGN（设计重构）

> 按设计规范重构所有设计文档

**目标**：按 SoloDevFlow 设计规范重构设计文档（参考原有内容，聚焦文档结构重构）

**核心原则**：
- **强制执行**：无论原项目是否有设计文档，都进入设计重构阶段
- **结构重构优先**：聚焦文档组织和结构的标准化，不做内容的重大变更
- **参考原有内容**：充分复用原设计文档的有效内容

**AI 行为**：

```
├─ Step 4.1: 识别现有设计文档
│   ├─ 扫描项目中的设计相关文档
│   │   ├─ docs/ 目录下的架构/设计文档
│   │   ├─ 文件名含 design/architecture/spec 的文档
│   │   └─ README 中的技术架构章节
│   └─ 列出待重构的设计文档清单
│
├─ Step 4.2: 匹配 Feature 与设计需求
│   ├─ 扫描所有 Feature Spec
│   ├─ 为每个 Feature 确定设计需求：
│   │   ├─ design_depth: required → 必须有独立设计文档
│   │   └─ design_depth: optional → 参考原有内容决定
│   └─ 生成设计文档编写清单
│
├─ Step 4.3: 逐个重构设计文档
│   ├─ 对每个需要设计的 Feature：
│   │   ├─ 读取对应的原设计文档（如有）
│   │   ├─ 读取 Feature Spec 理解需求
│   │   ├─ 使用 /write-design 命令（参考原内容）
│   │   ├─ 确保符合设计规范结构
│   │   └─ 更新 Feature 的 Artifacts 章节
│   └─ 向用户汇报进度
│
├─ Step 4.4: 归档原设计文档
│   └─ 将原设计文档移至 docs/legacy/（见 §6.6）
│
└─ Output: 符合规范的设计文档体系
```

**退出条件**：所有需要设计的 Feature 都已完成设计文档重构

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
| design | 设计文档重构完成 | validate |
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

### 6.5 Rollback 策略

| 场景 | 策略 | 命令 |
|------|------|------|
| 阶段内回滚 | 撤销当前阶段的变更 | `git revert <commit>` |
| 跨阶段回滚 | 回退到上一阶段检查点 | `git reset --hard <checkpoint>` |
| 完全回滚 | 恢复到重构前状态 | `git checkout refactor-backup` |

**建议**：每个阶段完成后创建标签 `refactor-phase-<n>`，便于精确回滚。

### 6.6 Legacy Document Archiving

> 老项目文档的识别与归档处理策略

#### 归档规则

| 规则 | 内容 |
|------|------|
| **归档目录** | `docs/legacy/` |
| **归档时机** | 对应新文档编写完成后立即归档 |
| **版本控制** | 归档目录纳入 Git 版本控制 |
| **强制执行** | 重构完成前，所有识别到的老文档必须归档 |

#### 老项目文档识别规则

> AI 必须主动识别并归档老项目文档

**识别范围**：

| 文档类型 | 识别规则 | 示例 |
|----------|----------|------|
| **需求文档** | 文件名含 requirement/spec/需求/功能 | `requirements.md`, `功能说明.md` |
| **设计文档** | 文件名含 design/architecture/架构/设计 | `architecture.md`, `系统设计.md` |
| **测试文档** | 文件名含 test/测试/qa | `test-plan.md`, `测试用例.md` |
| **API 文档** | 文件名含 api/接口 | `api.md`, `接口文档.md` |
| **产品文档** | 文件名含 prd/product/产品 | `prd.md`, `产品说明.md` |

**识别位置**：

```
项目根目录/
├─ docs/                    # 主要扫描目录
│   ├─ *.md                 # 所有 markdown 文件
│   └─ */                   # 所有子目录
├─ *.md                     # 根目录 markdown 文件
└─ doc/                     # 备选文档目录
```

**识别排除**：

| 排除项 | 原因 |
|--------|------|
| `docs/requirements/` | SoloDevFlow 标准目录 |
| `docs/designs/` | SoloDevFlow 标准目录 |
| `docs/legacy/` | 已归档目录 |
| `.solodevflow/` | 系统目录 |

#### 归档流程

```
[每完成一个新文档]
    ↓
[扫描并识别对应的老文档]
    ├─ 按文档类型匹配
    ├─ 按功能模块匹配
    └─ 按文件内容关键词匹配
    ↓
[移动老文档到 docs/legacy/]
    ├─ 保持原文件名
    ├─ 如有冲突，添加日期后缀
    └─ 保留目录结构（如 docs/legacy/api/）
    ↓
[继续下一个文档]
```

#### 阶段归档详解

| 阶段 | 触发条件 | 归档内容 |
|------|----------|----------|
| PRD | 新 PRD 编写完成 | 老项目的产品说明、功能概述文档 |
| REQUIREMENTS | 每个 Feature Spec 完成 | 对应功能的老需求文档 |
| DESIGN | 每个 Design Doc 完成 | 对应模块的老架构/设计文档 |
| VALIDATE | 全量验证通过 | **强制归档剩余所有老文档** |

**VALIDATE 阶段强制归档**：
```
[全量验证通过]
    ↓
[执行最终归档扫描]
    ├─ 扫描所有文档目录
    ├─ 识别未归档的老文档
    └─ 列出待归档清单
    ↓
[批量归档剩余老文档]
    ↓
[生成归档报告]
    └─ 包含：已归档文档列表、归档前后路径映射
```

#### 不归档的文档

| 文档类型 | 处理方式 |
|----------|----------|
| README.md | 更新而非归档（项目入口） |
| LICENSE | 保留原位 |
| CHANGELOG.md | 保留原位，持续更新 |
| .gitignore 等配置 | 保留原位 |
| 代码注释/内联文档 | 不处理 |

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

## 10. Module Impact Specifications <!-- id: flow_refactoring_module_impact -->

> Flow (workMode=code) 专属章节：定义每个依赖模块的具体变更需求

### [Module: project-init]

**变更概述**：扩展 init.js 支持现有项目检测和重构模式初始化

**接口变更**：

| 变更类型 | 描述 |
|----------|------|
| 新增函数 | `detectExistingProject(): boolean` - 检测是否为现有项目 |
| 新增函数 | `initRefactoringMode(): void` - 初始化重构模式 |
| 修改函数 | `init()` - 添加重构模式分支 |

**实现要点**：
1. 检测条件：存在 src/ 或 docs/ 但无 .solodevflow/
2. 用户交互：询问是否启用重构模式
3. 初始化：创建 state.json 并设置 `project.refactoring.enabled = true`

**验收标准**：
- [ ] 正确检测现有项目（有代码/文档但无 .solodevflow）
- [ ] 用户选择重构模式后正确初始化状态
- [ ] 用户选择普通模式后正常初始化

**审批状态**：✅ 已审批 (2025-12-29)

---

### [Module: state-management]

**变更概述**：扩展 state.json Schema 支持重构状态追踪

**接口变更**：

| 变更类型 | 描述 |
|----------|------|
| Schema 扩展 | 添加 `project.refactoring` 字段 |
| 新增命令 | `set-refactoring-phase <phase>` |
| 新增命令 | `update-refactoring-progress <type> <done> <total>` |

**Schema 定义**：
```json
{
  "project.refactoring": {
    "enabled": "boolean",
    "phase": "understand | prd | requirements | design | validate | completed",
    "progress": {
      "prd": "not_started | in_progress | done",
      "features": { "total": "number", "done": "number" },
      "capabilities": { "total": "number", "done": "number" },
      "flows": { "total": "number", "done": "number" },
      "designs": { "total": "number", "done": "number", "skipped": "boolean" }
    },
    "startedAt": "ISO date string",
    "completedAt": "ISO date string | null"
  }
}
```

**验收标准**：
- [ ] state.json 支持 refactoring 字段读写
- [ ] set-refactoring-phase 正确更新阶段
- [ ] update-refactoring-progress 正确更新进度
- [ ] 阶段转换验证（不允许跳过阶段）

**审批状态**：✅ 已审批 (2025-12-29)

---

### [Module: write-commands]

**变更概述**：无代码变更，仅声明依赖关系

**说明**：Refactoring Flow 使用现有的 /write-* 命令（/write-prd, /write-feature, /write-capability, /write-flow, /write-design）生成文档，无需修改这些命令。

**依赖方式**：纯消费依赖（调用现有接口）

**验收标准**：
- [ ] /write-prd 可在重构模式下正常使用
- [ ] /write-feature 可在重构模式下正常使用

**审批状态**：✅ 无需变更（纯消费）

---

## 11. Artifacts <!-- id: flow_refactoring_artifacts -->

| Type | Path | Required | Description |
|------|------|----------|-------------|
| Design | docs/designs/des-refactoring.md | Yes | 详细设计（待细化） |
| Code | scripts/init.js | Yes | 扩展检测逻辑 |
| Template | template/flows/refactoring.md | Yes | 执行规范模板 |

**Design Depth**: required

---

*Version: v2.5*
*Created: 2025-12-27*
*Updated: 2025-12-30*

## Changelog

- **v2.5** (2025-12-30): Phase 4 DESIGN 从"可选"改为"强制"（无论原项目是否有设计文档，都按规范重构）；§6.6 增强老项目文档识别规则（识别范围、识别位置、排除规则、VALIDATE 阶段强制归档）
- **v2.4** (2025-12-30): 添加 §6.6 Legacy Document Archiving，定义老项目文档归档策略（归档目录 docs/legacy/，归档时机为新文档完成后）
- **v2.3** (2025-12-29): 添加 §10 Module Impact Specifications（Flow workMode=code 专属章节示例）
- **v2.2** (2025-12-29): 修正 workMode: document → code（此 Flow 需要代码实现）
- **v2.1** (2025-12-29): 添加 §6.5 Rollback 策略，明确阶段内/跨阶段/完全回滚的操作指南
- **v2.0** (2025-12-28): 基于 2025 行业最佳实践全面增强：添加详细阶段行为、方法论参考、验收标准
- **v1.0** (2025-12-28): 合并 fea-project-refactor 内容，消除文档重复
