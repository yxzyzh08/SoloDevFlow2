
# Requirements Document Specification <!-- id: spec_requirements_doc -->

> 定义需求文档的结构、内容要素、编写标准（Feature 驱动模式）

---

## 1. Scope & Directory Structure <!-- id: spec_req_scope -->

### 1.1 Document Types

| 文档类型 | 层级 | 说明 |
|----------|------|------|
| **PRD** | 产品级 | 定义产品愿景、用户、领域划分、Feature/Capability 路线图 |
| **Feature Spec** | Feature级 | 定义纵向业务功能的完整需求、验收标准 |
| **Capability Spec** | 能力级（可选） | 定义横向功能的需求（日志、权限、缓存等） |
| **Flow Spec** | 流程级（可选） | 定义跨 Domain/Feature 的复杂业务流程 |

### 1.2 Document Hierarchy

```
PRD (1个)
  ├── Feature Spec (按 Domain 组织)
  ├── Capability Spec (横向功能，可选)
  └── Flow Spec (跨域业务流程，可选)
```

**Domain 组织方式**：
- Domain 作为 PRD 中的组织概念，在 Feature Roadmap 章节下按 Domain 分组
- 每个 Domain 可选择性添加 "Domain Collaboration" 子章节（见 3.5）
- Domain 不需要独立的规格文档

**纵向 vs 横向**：
| 类型 | 特点 | 文档 |
|------|------|------|
| **纵向 Feature** | 独立业务功能 | Feature Spec |
| **横向 Capability** | 跨 Feature 的公共能力 | Capability Spec |
| **横向 Flow** | 跨 Domain/Feature 的业务流程 | Flow Spec |

**Capability Spec 创建时机**：
- 横向功能被 2 个以上 Feature 使用
- 横向功能有复杂需求需要独立描述
- 简单横向功能可在 PRD 中一句话描述

**Flow Spec 创建时机**：
- 业务流程跨越 2 个以上 Domain/Feature
- 流程复杂度超出 PRD Core Flow 章节承载范围
- 简单流程可在 PRD 的 Core Flow 章节描述

**说明**：设计文档（Design Doc）存放于 `docs/designs/` 目录，与需求文档完全分离。需求文档统一存放于 `docs/requirements/` 目录。

### 1.3 Directory Structure & Naming

```
docs/
├── requirements/                    # 需求文档根目录
│   ├── prd.md                       # 产品 PRD（唯一）
│   │
│   ├── specs/                       # 规范文档
│   │   ├── requirements-doc.spec.md # 需求文档规范
│   │   ├── design-doc-spec.md       # 设计文档规范
│   │   └── meta-spec.md             # 元规范
│   │
│   ├── templates/                   # 文档模板
│   │   ├── backend/                 # 后端项目模板
│   │   ├── web-app/                 # Web应用模板
│   │   └── mobile-app/              # 移动应用模板
│   │
│   ├── _features/                   # 独立 Feature（Bottom-Up 模式）
│   │   ├── prd-validator.spec.md    # 尚未归入 Domain 的 Feature
│   │   └── status-script.spec.md
│   │
│   ├── payment/                     # Domain 目录（仅作为文件组织）
│   │   ├── checkout.spec.md         # Feature Spec
│   │   └── refund.spec.md
│   │
│   ├── user/                        # Domain 目录
│   │   ├── login.spec.md
│   │   └── register.spec.md
│   │
│   ├── _capabilities/               # Capability 目录（下划线前缀表示横向）
│   │   ├── logging.spec.md
│   │   └── permission.spec.md
│   │
│   └── _flows/                      # Flow 目录（下划线前缀表示横向）
│       ├── order-process.spec.md
│       └── payment-process.spec.md
│
└── designs/                         # 设计文档根目录
    ├── _features/                   # 独立 Feature 设计
    │   └── {feature}.design.md
    │
    ├── payment/                     # Domain 设计
    │   ├── checkout.design.md
    │   └── refund.design.md
    │
    ├── _capabilities/               # Capability 设计
    │   └── {name}.design.md
    │
    └── _flows/                      # Flow 设计
        └── {name}.design.md
```

**目录结构说明**：
- **requirements/** - 所有需求文档的根目录，包含 PRD、规范、模板和各类需求文档
- **designs/** - 所有设计文档的根目录，与需求文档完全分离
- **Domain 目录** - 仅作为文件组织手段，在两个根目录下都可能存在
- 不再需要 `_domain.spec.md` 文件
- Domain 的业务规则、共享概念等信息在 PRD 的 Domain Collaboration 子章节中描述（可选）

**Naming Convention**：
- PRD：`docs/requirements/prd.md`（固定路径）
- 独立 Feature Spec：`docs/requirements/_features/{feature}.spec.md`（Bottom-Up 模式）
- Domain 内 Feature Spec：`docs/requirements/{domain}/{feature}.spec.md`
- Capability Spec：`docs/requirements/_capabilities/{name}.spec.md`
- Flow Spec：`docs/requirements/_flows/{name}.spec.md`
- 独立 Feature Design：`docs/designs/_features/{feature}.design.md`
- Domain 内 Feature Design：`docs/designs/{domain}/{feature}.design.md`
- Capability Design：`docs/designs/_capabilities/{name}.design.md`
- Flow Design：`docs/designs/_flows/{name}.design.md`
- 目录名/文件名：kebab-case

### 1.4 Requirements Research Methods

项目可选择两种需求调研方法：

| 方法 | 描述 | 适用场景 |
|------|------|----------|
| **Top-Down** | PRD → Domain Spec → Feature Spec | 领域边界清晰、有完整规划 |
| **Bottom-Up** | PRD → Feature Spec → Domain Spec | 探索性开发、边做边发现领域 |

**Top-Down 工作流程**：
1. 编写 PRD，定义领域划分
2. 为每个领域创建 Domain Spec
3. 在 Domain 下编写 Feature Spec

**Bottom-Up 工作流程**：
1. 编写 PRD（领域划分可为空或待定）
2. Feature 放入 `_features/` 目录（独立 Feature）
3. 当 3+ 个 Feature 可归入同一领域时：
   - 在 PRD 中新增 Domain 章节
   - 可选：添加 Domain Collaboration 子章节（如有共享业务规则）
   - 将相关 Feature 迁移到 Domain 目录下

**方法选择**：由用户在项目启动时指定，记录在 `.flow/state.json` 的 `flow.researchMethod` 字段中（值为 `top-down` 或 `bottom-up`）。

**Feature 迁移**（Bottom-Up → Domain）：
当独立 Feature 归入 Domain 时：
1. 将 `_features/{feature}.spec.md` 移动到 `{domain}/{feature}.spec.md`
2. 更新文档内的引用路径
3. 在 PRD 的对应 Domain 章节下添加该 Feature 引用
4. 如需要，在 PRD Domain Collaboration 子章节中描述共享规则

---

## 2. Anchor Specification <!-- id: spec_req_anchor -->

锚点用于文档追踪和未来自动化分析。

### 2.1 Anchor Format

```markdown
## Section Title <!-- id: {prefix}_{name} -->
```

### 2.2 Anchor Prefix

| 前缀 | 用途 | 示例 |
|------|------|------|
| `prod_` | 产品级概念 | `prod_vision`, `prod_roadmap` |
| `domain_` | 领域级概念 | `domain_payment`, `domain_user` |
| `feat_` | Feature（纵向） | `feat_login`, `feat_register` |
| `cap_` | Capability（横向） | `cap_logging`, `cap_permission` |
| `flow_` | Flow（横向） | `flow_order_process`, `flow_payment` |

### 2.3 Anchor Rules

- 按项目模板中定义的锚点添加（模板有锚点的章节必须添加）
- 模板位置：`docs/templates/{project-type}/`
- 锚点名使用 snake_case
- 锚点在文档内唯一
- 跨文档引用格式：`文件名#锚点`

---

## 3. PRD Structure <!-- id: spec_req_prd --> <!-- defines: prd -->

### 3.0 Frontmatter（必须）

所有需求文档必须包含 YAML frontmatter，用于标识文档类型和校验。

```yaml
---
type: {project-type}
template: docs/templates/{project-type}/prd
version: {doc-version}
---
```

| 字段 | 必填 | 说明 |
|------|------|------|
| `type` | 是 | 项目类型，见下方枚举 |
| `template` | 是 | 使用的模板完整路径（与 type 对应） |
| `version` | 是 | 文档版本号 |

**项目类型枚举**：

| Type | 说明 | 模板路径 |
|------|------|----------|
| `web-app` | Web 应用 | `docs/templates/web-app/prd` |
| `cli-tool` | 命令行工具 | `docs/templates/cli-tool/prd` |
| `backend` | 纯后端系统 | `docs/templates/backend/prd` |
| `library` | 库/SDK | `docs/templates/library/prd` |
| `api-service` | API 服务 | `docs/templates/api-service/prd` |
| `mobile-app` | 移动应用 | `docs/templates/mobile-app/prd` |

### 3.1 Required Sections

| 章节 | 锚点 | 内容 |
|------|------|------|
| **Product Vision** | `prod_vision` | 一句话定义 + 核心价值 |
| **Target Users** | `prod_users` | 用户画像、痛点 |
| **Product Description** | `prod_description` | High Level 功能概述 + 领域划分（可选） |
| **Feature Roadmap** | `prod_roadmap` | 按 Domain 分层的 Feature 子章节，每个 Feature 有独立锚点 |
| **Success Criteria** | `prod_success` | 可验证的成功指标 |

### 3.2 Optional Sections

| 章节 | 锚点 | 适用场景 |
|------|------|----------|
| **Non-Goals** | `prod_non_goals` | 需要明确排除的范围 |
| **Core Flow** | `prod_flow` | 有复杂业务流程时 |
| **Appendix** | `prod_appendix` | 速查表、术语表 |

### 3.3 Feature Roadmap Structure

Feature Roadmap 章节按 Domain 组织，每个 Domain 下的 Feature 以**子章节**形式呈现。

**结构层级**：
```
## 4. Feature Roadmap <!-- id: prod_roadmap -->

### 4.1 Domain: {domain-name} <!-- id: domain_{domain_name} -->

{Domain 简述}

#### {feature-name} <!-- id: feat_ref_{feature_name} -->

{Feature 高层次描述（2-3 句话）}

**元信息**：
- **Priority**: P0/P1/P2
- **Type**: code / document
- **Feature Spec**: [链接到 Feature Spec 文档]

#### {另一个 feature-name} <!-- id: feat_ref_{another_feature} -->
...
```

**锚点规范**：
- Domain 锚点：`domain_{domain_name}`（全小写，下划线分隔）
- Feature 引用锚点：`feat_ref_{feature_name}`（前缀 `feat_ref_` 区分 PRD 引用和 Feature Spec 本体）

**内容原则**：
- Feature 描述：仅 2-3 句话的 high level 总结，解释核心价值
- 详细内容：见对应的 Feature Spec 文档
- 元信息：提供 Priority、Type、Feature Spec 链接，便于快速索引

**示例**：

```markdown
### 4.2 Domain: process <!-- id: domain_process -->

协作流程系统，定义人机协作的机制和状态管理。

#### core-collaboration <!-- id: feat_ref_core_collaboration -->

核心协作流程，解决 AI 不按流程执行、直接响应字面需求的问题。提供意图路由、阶段流转、交付流程三大能力。

**元信息**：
- **Priority**: P0
- **Type**: document
- **Feature Spec**: [core-collaboration.spec.md](docs/_flows/core-collaboration.spec.md)

#### state-management <!-- id: feat_ref_state_management -->

状态管理机制，解决跨 Session 状态丢失、无法掌控全局的问题。定义 state.json 作为唯一状态源。

**元信息**：
- **Priority**: P0
- **Type**: document
- **Feature Spec**: [state-management.spec.md](docs/process/state-management.spec.md)
```

**影响分析支持**：
- 修改某个 Feature 子章节时，`analyze-impact.js` 可通过锚点精确定位影响范围
- 只影响对应的 Feature Spec，而非所有 Features

### 3.4 Template

**模板位置**：`docs/templates/{project-type}/prd.md`

当前项目模板：`docs/templates/backend/prd.md`

### 3.5 Domain Collaboration Subsection (Optional) <!-- id: spec_req_domain_collaboration -->

**Purpose**: When a Domain has complex inter-feature interactions, shared concepts, or business rules, add a "Domain Collaboration" subsection under the Domain heading in PRD Feature Roadmap.

**Creation Criteria** (any of):
- Domain has 3+ Features with shared business rules
- Domain has cross-feature concepts that need unified definition
- Domain has complex feature interactions that need documentation

**Standard Structure**:

```markdown
### 4.X Domain: {domain-name} <!-- id: domain_{domain_name} -->

{Domain 简述}

#### Domain Collaboration <!-- id: domain_{domain_name}_collaboration -->

**Feature Interactions**:
- Feature A ↔ Feature B: {交互说明}
- Feature C → Feature D: {依赖说明}

**Shared Concepts**:
| Concept | Definition | Used by |
|---------|------------|---------|
| {概念} | {定义} | Feature A, Feature B |

**Business Rules**:
1. **Rule Name**: {规则描述}
   - Applicable: Feature A, Feature C
   - Constraints: {约束条件}

#### {feature-name} <!-- id: feat_ref_{feature_name} -->
[...Feature 描述...]
```

**When to Split into Sub-Product**:

If a Domain grows beyond **10 Features**, consider splitting it into a separate product with its own PRD. Indicators:
- Domain has independent business value and can be deployed separately
- Domain has dedicated team or ownership
- Domain complexity justifies separate planning and roadmap

**Migration Path** (when splitting):
1. Create new project repository
2. Extract Domain Features to new PRD
3. Update original PRD to reference external dependency
4. Document integration points in Flow Spec

**Example** (from SoloDevFlow):

```markdown
### 4.2 Domain: process <!-- id: domain_process -->

协作流程系统，定义人机协作的机制和状态管理。

#### Domain Collaboration <!-- id: domain_process_collaboration -->

**Feature Interactions**:
- core-collaboration ↔ state-management: 核心流程依赖状态管理提供持久化
- state-management → input-capture: 状态变更触发关键输入记录
- change-impact-tracking ↔ state-management: 影响分析生成 subtasks 写入 state

**Shared Concepts**:
| Concept | Definition | Used by |
|---------|------------|---------|
| Session | AI 对话会话，从启动到结束 | core-collaboration, state-management |
| Phase | Feature 生命周期阶段 | core-collaboration, state-management |

**Business Rules**:
1. **唯一状态源原则**: 所有状态必须通过 state.json 维护，不允许分散存储
   - Applicable: 所有 process domain Features
   - Constraints: 修改状态必须验证 Schema

#### core-collaboration <!-- id: feat_ref_core_collaboration -->
[...Feature 描述...]
```

---

## 4. Feature Spec Structure <!-- id: spec_req_feature_spec --> <!-- defines: feature-spec -->

### 4.1 Feature Types

Feature 分为两种类型，工作流和产出物不同：

| 类型 | 说明 | 产出物 | 工作流 |
|------|------|--------|--------|
| `code` | 代码型 | 代码 + 测试 + 设计文档（可选） | 需求 → 设计（可选） → 实现 → 验证 |
| `document` | 文档型 | Markdown 文档（可选脚本） | 起草 → 完成 |

**code 类型**：
- 必须有代码产出
- 必须有 E2E 测试验证
- 设计文档可选（通过 Design Depth 控制）

**document 类型**：
- 产出为 Markdown 文档
- 可包含辅助脚本
- 无需 E2E 测试

### 4.2 Required Sections

**通用必选章节**（所有 Feature）：

| 章节 | 锚点 | 内容 |
|------|------|------|
| **Intent** | `feat_{name}_intent` | 解决什么问题（Why） |
| **Core Capabilities** | `feat_{name}_capabilities` | 提供什么能力（What） |
| **Acceptance Criteria** | `feat_{name}_acceptance` | 可验证的完成条件 |

**code 类型额外必选章节**：

| 章节 | 锚点 | 内容 |
|------|------|------|
| **Artifacts** | `feat_{name}_artifacts` | 产物记录（设计/代码/测试路径） |

### 4.3 Optional Sections

| 章节 | 锚点 | 适用场景 |
|------|------|----------|
| **User Stories** | `feat_{name}_stories` | 需要详细描述用户场景 |
| **Boundaries** | `feat_{name}_boundaries` | 需要明确排除项 |
| **Dependencies** | `feat_{name}_dependencies` | 有前置依赖 |
| **Artifacts** | `feat_{name}_artifacts` | document 类型记录产物（可选） |

### 4.4 Artifacts Section（产物记录）

**用途**：记录 Feature 的下游产物位置，支持影响分析和变更追踪。

**结构**：

```markdown
## Artifacts <!-- feat_{name}_artifacts -->

| Type | Path | Required | Description |
|------|------|----------|-------------|
| Design | docs/{domain}/{name}.design.md | L1+ | 设计文档 |
| Code | src/{module}/ | Yes | 代码目录 |
| E2E Test | tests/e2e/{name}.test.ts | Yes | E2E 测试 |

**Design Depth**: L0 / L1 / L2 / L3
```

**Design Depth 说明**：

| 级别 | 名称 | 设计文档 | 适用场景 |
|------|------|----------|----------|
| L0 | 无设计 | 不需要 | 极简单功能，直接实现 |
| L1 | 轻量设计 | 需要 | 简单功能，低风险 |
| L2 | 标准设计 | 需要 | 一般功能，中等复杂度 |
| L3 | 详细设计 | 需要 | 复杂功能，高风险 |

**L0 适用条件**（满足全部）：
- 功能逻辑简单、边界清晰
- 不涉及外部依赖或新技术
- 可在 1 天内完成实现
- 失败成本低，可快速重做

### 4.5 Template

**模板位置**：`docs/templates/{project-type}/feature.spec.md`

当前项目模板：`docs/templates/backend/feature.spec.md`

### 4.6 Simple Feature Spec（含设计）

对于简单、独立的 Feature，可将需求和设计合并到一个文档中。

**适用条件**（满足全部）：
- Feature 边界清晰，不依赖其他 Feature
- 设计方案明确，无需单独设计文档（L0 或 L1）
- 技术实现相对简单

**文档结构**：
- 保留标准 Feature Spec 章节（Intent、Core Capabilities、Acceptance Criteria）
- 新增 Scope 章节，明确边界
- 新增 Design 章节，包含技术设计内容（L1 内联）
- 新增 Artifacts 章节，记录产物位置
- 可选：Implementation Notes（实现说明、辅助脚本等）

**模板位置**：`docs/templates/{project-type}/simple-feature.spec.md`

当前项目模板：`docs/templates/backend/simple-feature.spec.md`

**示例**：state-management（状态管理规范 + Schema 设计）

---

## 5. Capability Spec Structure <!-- id: spec_req_capability_spec --> <!-- defines: capability-spec -->

### 5.1 Creation Criteria

满足以下任一条件时创建 Capability Spec：
- 横向功能被 2 个以上 Feature 使用
- 横向功能有复杂需求需要独立描述
- 横向功能需要定义统一的使用规范

**简单横向功能**：可在 PRD 的 Capability Roadmap 中一句话描述，不需要独立文档。

### 5.2 Required Sections

| 章节 | 锚点 | 内容 |
|------|------|------|
| **Intent** | `cap_{name}_intent` | 为什么需要这个能力 |
| **Consumers** | `cap_{name}_consumers` | 哪些 Feature/Domain 使用 |
| **Requirements** | `cap_{name}_requirements` | 功能需求（不涉及实现） |
| **Acceptance Criteria** | `cap_{name}_acceptance` | 可验证的完成条件 |

### 5.3 Optional Sections

| 章节 | 锚点 | 适用场景 |
|------|------|----------|
| **Boundaries** | `cap_{name}_boundaries` | 需要明确排除项 |
| **Constraints** | `cap_{name}_constraints` | 有性能/安全等约束 |

### 5.4 Template

**模板位置**：`docs/templates/{project-type}/capability.spec.md`

当前项目模板：`docs/templates/backend/capability.spec.md`

---

## 6. Flow Spec Structure <!-- id: spec_req_flow_spec --> <!-- defines: flow-spec -->

### 6.1 Creation Criteria

满足以下任一条件时创建 Flow Spec：
- 业务流程跨越 2 个以上 Domain/Feature
- 流程复杂度超出 PRD Core Flow 章节承载范围
- 流程涉及多个系统或外部集成

**简单流程**：可在 PRD 的 Core Flow 章节描述，不需要独立文档。

### 6.2 Required Sections

| 章节 | 锚点 | 内容 |
|------|------|------|
| **Flow Overview** | `flow_{name}_overview` | 流程目的、触发条件、参与方 |
| **Flow Steps** | `flow_{name}_steps` | 流程步骤、分支、异常处理 |
| **Participants** | `flow_{name}_participants` | 涉及的 Domain/Feature/外部系统 |
| **Acceptance Criteria** | `flow_{name}_acceptance` | 可验证的完成条件 |

### 6.3 Optional Sections

| 章节 | 锚点 | 适用场景 |
|------|------|----------|
| **Flow Diagram** | `flow_{name}_diagram` | 流程复杂需要可视化 |
| **Error Handling** | `flow_{name}_errors` | 有复杂异常场景 |
| **Constraints** | `flow_{name}_constraints` | 有性能/时序等约束 |

### 6.4 Template

**模板位置**：`docs/templates/{project-type}/flow.spec.md`

当前项目模板：`docs/templates/backend/flow.spec.md`

---

## 7. Acceptance Criteria Guide <!-- id: spec_req_acceptance -->

### 7.1 Principles

- **Verifiable**: 必须能通过测试或检查确认
- **Specific**: 避免模糊表述（"用户体验好"）
- **Independent**: 每条标准独立可验证

### 7.2 Formats

**Format A: Checklist**（推荐）

```markdown
| Item | Verification | Pass Criteria |
|------|--------------|---------------|
| 登录功能 | 手动测试 | 正确账号密码可登录 |
| 错误提示 | 手动测试 | 错误密码显示明确提示 |
```

**Format B: Given-When-Then**（复杂场景）

```markdown
**Scenario**: 用户使用正确密码登录

- **Given**: 用户已注册，账号为 test@example.com
- **When**: 输入正确密码并点击登录
- **Then**: 跳转到首页，显示用户名
```

### 7.3 Anti-patterns

| Bad | Problem | Improvement |
|-----|---------|-------------|
| "登录要快" | 不可量化 | "登录响应时间 < 2秒" |
| "界面美观" | 主观 | "符合设计稿" |
| "功能正常" | 模糊 | 列出具体功能点 |

---

## 8. Change Management <!-- id: spec_req_change -->

### 8.1 Version Number

```
v{major}.{minor}

major: 结构性变更（增删章节）
minor: 内容更新（修改描述）
```

示例：`v1.0` → `v1.1`（内容更新） → `v2.0`（结构变更）

### 8.2 Change Log Format

在文档末尾维护变更记录：

```markdown
---

*Version: v1.2*
*Created: 2024-12-16*
*Updated: 2024-12-20*
*Changes: v1.1 added XX section; v1.2 modified XX content*
```

### 8.3 Major Change Handling

重大变更（影响已实现功能）需要：
1. 在 input-log 记录变更原因
2. 进行影响分析
3. 人类确认后执行

---

## Appendix: Quick Reference <!-- id: spec_req_appendix -->

### A. Document Type Reference

| Question | Answer |
|----------|--------|
| 产品愿景变了？ | 改 PRD |
| 这个领域有哪些 Feature？ | 看 PRD Feature Roadmap |
| 这个 Feature 要做什么？ | 看 Feature Spec |
| 这个横向功能要做什么？ | 看 Capability Spec |
| 这个业务流程怎么运转？ | 看 Flow Spec |
| 怎么设计实现？ | 看 Design Doc（设计文档） |

### B. Anchor Prefix Reference

| Prefix | Level | Type |
|--------|-------|------|
| `prod_` | Product | - |
| `domain_` | Domain | - |
| `feat_` | Feature | 纵向 |
| `cap_` | Capability | 横向 |
| `flow_` | Flow | 横向 |

### C. Document Checklist

**Feature Spec**:
- [ ] Has Intent (Why)
- [ ] Has Core Capabilities (What)
- [ ] Has Acceptance Criteria (How to verify)
- [ ] Has Anchor ID

**Capability Spec**:
- [ ] Has Intent (Why)
- [ ] Has Consumers (Who uses)
- [ ] Has Requirements (What)
- [ ] Has Acceptance Criteria (How to verify)
- [ ] Has Anchor ID

**Flow Spec**:
- [ ] Has Flow Overview (Purpose, trigger)
- [ ] Has Flow Steps (Steps, branches, exceptions)
- [ ] Has Participants (Domains, Features, external systems)
- [ ] Has Acceptance Criteria (How to verify)
- [ ] Has Anchor ID

### D. Feature Driven Workflow

**code 类型 Feature**（设计可选）：
```
Feature A (L0): 需求 → 实现 → 验证 ✓
Feature B (L2): 需求 → 设计 → 实现 → 验证 ← 当前
Feature C: 待开始
```

**document 类型 Feature**：
```
Feature X: 起草 → 完成 ✓
```

### E. User Story vs User Scenario vs Flow Spec

**概念对比**：

| 维度 | User Story | User Scenario | Flow Spec |
|------|------------|---------------|-----------|
| **所属文档** | Feature Spec | PRD Domain Collaboration | 独立文档 |
| **范围** | 单个 Feature 内 | 单个 Domain 内（可跨 Feature） | 跨多个 Domain |
| **视角** | 用户视角 | 用户视角 | 系统视角 |
| **粒度** | 细（单一功能点） | 中（业务场景） | 粗（端到端流程） |
| **详细度** | 简略（As a/I want/So that） | 简略（步骤描述） | 详细（步骤/分支/异常/约束） |
| **示例** | "用户使用密码登录" | "新用户注册并首次登录" | "订单处理流程" |

**层级关系**：

```
Flow Spec: 订单处理流程
  │
  ├── Domain: User
  │   └── User Scenario: 用户下单
  │       ├── Feature: cart → User Story: 添加商品到购物车
  │       └── Feature: checkout → User Story: 提交订单
  │
  ├── Domain: Payment
  │   └── User Scenario: 用户支付
  │       └── Feature: pay → User Story: 使用微信支付
  │
  └── Domain: Logistics
      └── User Scenario: 订单发货
          └── Feature: shipping → User Story: 查看物流状态
```

**选择指南**：

| 场景 | 使用 |
|------|------|
| 描述单个功能的用户需求 | User Story（Feature Spec） |
| 描述领域内多个 Feature 如何协作 | User Scenario（PRD Domain Collaboration） |
| 描述跨域的复杂业务流程，需详细步骤/异常/约束 | Flow Spec（独立文档） |
| 简单跨域流程，无需详细定义 | PRD Core Flow 章节 |

**边界判断**：

```
单 Feature 内的用户需求 → User Story
        ↓ 涉及多个 Feature
单 Domain 内的业务场景 → User Scenario（PRD Domain Collaboration）
        ↓ 跨多个 Domain 或需要详细定义
跨域复杂流程 → Flow Spec
```

---

*Version: v4.1*
*Created: 2024-12-20*
*Updated: 2025-01-22*
*Changes: v3.0 Feature Spec 增加 Artifacts 章节（产物记录），增加 Design Depth（L0-L3），code 类型必须有 E2E 测试; v3.1 PRD Feature Roadmap 改为子章节形式，每个 Feature 有独立锚点（feat_ref_前缀）; v4.0 移除 Domain Spec 作为独立文档类型，Domain 作为 PRD 组织概念，新增 Domain Collaboration 子章节（可选），更新文档层级和引用; v4.1 需求文档和设计文档完全分离到 docs/requirements/ 和 docs/designs/ 两个独立目录*
*Applies to: SoloDevFlow 2.0*
