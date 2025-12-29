---
type: flow
id: design-flow
workMode: document
status: done
priority: P0
domain: process
version: "1.0"
---

# Flow: Design <!-- id: flow_design -->

> 设计流程，将需求转化为可实现的技术方案

**Parent Flow**: [flow-workflows.md](flow-workflows.md) §6
**执行规范**：`.solodevflow/flows/design.md`
> 执行规范由 AI 根据本需求文档生成，模板位于 `template/flows/design.md`。

---

## 1. Overview <!-- id: flow_design_overview -->

### 1.1 Purpose

将已批准的需求文档转化为技术设计方案：

| 职责 | 说明 |
|------|------|
| **技术决策** | 选择技术栈、架构模式 |
| **接口设计** | 定义模块边界和 API |
| **数据建模** | 设计数据结构和存储 |
| **风险评估** | 识别技术风险和应对策略 |

### 1.2 Design Modes

> **核心原则**：初始设计需要全局视角，必须等所有需求确定后才能进行架构决策。

| 模式 | 说明 | 触发条件 |
|------|------|----------|
| **Initial Design** | 首次全局架构设计 | 无设计文档，需从零开始 |
| **Iterative Design** | 增量迭代设计 | 已有设计初稿，针对需求变更或评审意见 |

### 1.3 Entry Criteria

#### Initial Design（初始设计）

| 条件 | 验证方式 |
|------|----------|
| **所有相关需求已完成** | 相关 Feature 文档 status = `done` 或 phase 已过 `feature_review` |
| 无现有设计文档 | 设计目录下无对应文档 |
| 可进行全局架构决策 | 所有功能边界清晰 |

#### Iterative Design（迭代设计）

| 条件 | 验证方式 |
|------|----------|
| 已有设计初稿 | 存在设计文档（任意版本） |
| 需求变更或评审反馈 | 需求文档有更新 或 收到设计评审意见 |
| phase 已转换 | `feature_review` → `feature_design` |

### 1.4 Exit Criteria

| 条件 | 验证方式 |
|------|----------|
| 设计文档完成 | 符合 [spec-design.md#spec_design_structure](../../specs/spec-design.md#spec_design_structure) 规范 |
| 人类审核通过 | 显式批准 |
| phase 已更新 | phase = `feature_implementation` |

### 1.5 Boundaries

| 类型 | 内容 |
|------|------|
| **In Scope** | 技术架构设计、接口设计、数据建模、技术选型、风险评估 |
| **Out of Scope** | 代码实现、单元测试编写、集成测试编写、部署配置、系统测试 |

---

## 2. Flow Diagram <!-- id: flow_design_diagram -->

```
[进入设计阶段]
    ↓
[MODE] 判断设计模式
    ├─ Initial Design（无设计文档）
    │     ↓
    │   检查所有相关需求是否完成
    │     ├─ 未完成 → ❌ 阻止，提示完成需求
    │     └─ 已完成 ↓
    │
    └─ Iterative Design（已有设计文档）
          ↓
        可直接进入设计
    ↓
[GATHER] 读取需求文档 + 现有架构
    ↓
[ASSESS] 评估设计深度（Required / None）
    ↓
   ┌─ None → 跳过设计，直接进入实现
   └─ Required ↓
    ↓
[DESIGN] 编写设计文档
    ├─ Initial: 全局架构 + 模块划分 + 技术栈
    └─ Iterative: 局部修改 + 影响分析
    ↓
[REVIEW] 设计审核
    ↓
[phase → feature_implementation]
```

---

## 3. Flow Steps <!-- id: flow_design_steps -->

### 3.1 Phase 0: MODE（判断设计模式）

**判断逻辑**：

```
检查是否存在设计文档
    ├─ 不存在 → Initial Design
    │     ↓
    │   检查相关需求文档状态
    │     ├─ 有 status != done → ❌ 阻止
    │     │   提示："请先完成所有相关需求文档，才能进行初始设计"
    │     └─ 全部 done → ✅ 继续
    │
    └─ 存在 → Iterative Design → ✅ 继续
```

**Initial Design 守卫**：

| 检查项 | 说明 |
|--------|------|
| 所有相关需求完成 | 避免设计时需求还在变动 |
| 功能边界清晰 | 可进行模块划分 |
| 无遗留 Open Questions | 关键问题已澄清 |

**设计模式输出**：
- `Design Mode: Initial` → 进行全局架构设计
- `Design Mode: Iterative` → 进行增量修改

### 3.2 Phase 1: GATHER（收集上下文）

**输入**：
- 需求文档（Feature/Capability/Flow Spec）
- 现有系统架构（如有）
- 相关设计规范（[spec-design.md](../../specs/spec-design.md)）

**动作**：
```
读取需求文档
    ↓
提取 Core Functions 和 Acceptance Criteria
    ↓
读取现有架构文档（如有）
    ↓
加载设计规范
```

### 3.3 Phase 2: ASSESS（评估设计深度）

**判断标准**（来自 [spec-design.md#spec_design_depth](../../specs/spec-design.md#spec_design_depth)）：

| 条件 | Design Depth |
|------|--------------|
| 涉及新模块/组件 | Required |
| 有复杂算法或数据结构 | Required |
| 有多个子系统交互 | Required |
| 有非功能需求（性能/安全） | Required |
| 简单 CRUD 或配置变更 | None |
| 复用现有模块，无接口变更 | None |

**输出**：
- `Design Depth: Required` → 继续设计流程
- `Design Depth: None` → 跳过设计，回填需求文档 Artifacts 章节

### 3.4 Phase 3: DESIGN（编写设计）

#### 3.4.1 技术选型

| 考虑维度 | 说明 |
|----------|------|
| **成熟度** | 优先选择成熟稳定的技术 |
| **团队熟悉度** | Solo 开发者自身的技术储备 |
| **社区支持** | 文档完善、问题易解决 |
| **与现有技术栈兼容** | 减少集成成本 |

#### 3.4.2 接口设计

```markdown
## Interface Design

### API Endpoints（如适用）

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/xxx | 获取资源 |
| POST | /api/xxx | 创建资源 |

### Module Interface（如适用）

| Module | Export | Description |
|--------|--------|-------------|
| moduleA | functionX | 功能说明 |
```

#### 3.4.3 数据模型

```markdown
## Data Model

### Entity: {EntityName}

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes | 唯一标识 |
| name | string | Yes | 名称 |
```

#### 3.4.4 实现策略

| 策略类型 | 说明 |
|----------|------|
| **分步实现** | 按依赖顺序实现各模块 |
| **风险前置** | 先验证高风险部分 |
| **增量交付** | 可工作的最小增量 |

### 3.5 Phase 4: REVIEW（设计审核）

**审核要点**：

| 维度 | 检查项 |
|------|--------|
| **完整性** | 是否覆盖所有需求功能点 |
| **可行性** | 技术方案是否可实现 |
| **一致性** | 与现有架构是否一致 |
| **可测试性** | 设计是否支持测试 |
| **安全性** | 是否考虑安全风险 |

**审核结果**：
- **批准** → `set-phase <id> feature_implementation`
- **修改** → 根据反馈修改设计
- **拒绝** → 返回需求阶段

---

## 4. Design Document Structure <!-- id: flow_design_structure -->

> 设计文档结构遵循 [spec-design.md#spec_design_structure](../../specs/spec-design.md#spec_design_structure) 规范

### 4.1 必选章节

| 章节 | 说明 |
|------|------|
| Overview | 设计目标和范围 |
| Architecture | 系统架构和模块划分 |
| Interface Design | 接口定义（API/模块接口） |
| Data Model | 数据结构定义 |
| Implementation Notes | 实现注意事项 |

### 4.2 可选章节

| 章节 | 适用场景 |
|------|----------|
| Security Considerations | 涉及敏感数据或安全风险 |
| Performance Considerations | 有性能要求 |
| Migration Plan | 涉及数据迁移或系统升级 |
| Dependencies | 有外部依赖 |

---

## 5. Design Principles <!-- id: flow_design_principles -->

### 5.1 Best Practices

| 原则 | 说明 | 来源 |
|------|------|------|
| **Document-First** | 先设计后编码 | SDLC Best Practice |
| **简单优先** | 选择最简单可行的方案 | KISS Principle |
| **模块化** | 清晰的模块边界 | Software Design |
| **可测试性** | 设计时考虑测试 | TDD Philosophy |

### 5.2 Anti-patterns

| 反模式 | 问题 | 改进 |
|--------|------|------|
| 过度设计 | 增加复杂度 | 只设计当前需要的 |
| 跳过设计 | 实现时返工 | 先评估设计深度 |
| 技术驱动 | 偏离业务需求 | 需求驱动设计 |

---

## 6. Solo Developer Considerations <!-- id: flow_design_solo -->

> 针对 Solo 开发者的设计流程优化

### 6.1 简化策略

| 场景 | 策略 |
|------|------|
| 小功能 | Design Depth: None，直接实现 |
| 中等功能 | 简化设计文档，只写关键决策 |
| 复杂功能 | 完整设计文档 |

### 6.2 AI 协作

| AI 职责 | 人类职责 |
|---------|----------|
| 生成设计草案 | 审核技术决策 |
| 分析技术选型 | 确认架构方向 |
| 输出设计文档 | 验证可行性 |

---

## 7. Participants <!-- id: flow_design_participants -->

| 参与方 | 职责 |
|--------|------|
| **User** | 审核设计、确认技术决策 |
| **AI** | 生成设计文档、分析技术方案 |
| **需求文档** | 设计的输入依据 |
| **设计规范** | [spec-design.md](../../specs/spec-design.md) |

---

## 8. Dependencies <!-- id: flow_design_dependencies -->

| Dependency | Type | 说明 |
|------------|------|------|
| flow-workflows | hard | 父流程，提供阶段路由 |
| [spec-design](../../specs/spec-design.md) | hard | 设计文档规范 |
| flow-requirements | hard | 设计的输入来源 |

---

## 9. Acceptance Criteria <!-- id: flow_design_acceptance -->

| Item | Verification | Pass Criteria |
|------|--------------|---------------|
| 设计深度评估 | 简单功能 | 正确判断为 None |
| 设计深度评估 | 复杂功能 | 正确判断为 Required |
| 设计文档生成 | 调用 /write-design | 符合 [spec-design.md](../../specs/spec-design.md#spec_design_structure) 规范 |
| 设计审核 | 人类审核 | 批准后 phase 正确转换 |
| 跳过设计 | None 判断后 | 直接进入实现阶段 |

---

*Version: v1.4*
*Created: 2025-12-28*
*Updated: 2025-12-28*
*Changes: v1.4 添加执行规范引用；v1.3 添加 Design Modes（Initial/Iterative）*
