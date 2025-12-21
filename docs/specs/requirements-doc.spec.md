# Requirements Document Specification <!-- id: spec_requirements_doc -->

> 定义需求文档的结构、内容要素、编写标准（Feature 驱动模式）

---

## 1. Scope & Directory Structure <!-- id: spec_req_scope -->

### 1.1 Document Types

| 文档类型 | 层级 | 说明 |
|----------|------|------|
| **PRD** | 产品级 | 定义产品愿景、用户、领域划分、Feature/Capability 路线图 |
| **Domain Spec** | 领域级（可选） | 定义领域的业务规则、用户场景、Feature 清单 |
| **Feature Spec** | Feature级 | 定义纵向业务功能的完整需求、验收标准 |
| **Capability Spec** | 能力级（可选） | 定义横向功能的需求（日志、权限、缓存等） |
| **Flow Spec** | 流程级（可选） | 定义跨 Domain/Feature 的复杂业务流程 |

### 1.2 Document Hierarchy

```
PRD (1个)
  ├── Domain Spec (可选，按领域)
  │     └── Feature Spec (该领域的 Feature)
  ├── Capability Spec (横向功能，可选)
  └── Flow Spec (跨域业务流程，可选)
```

**纵向 vs 横向**：
| 类型 | 特点 | 文档 |
|------|------|------|
| **纵向 Feature** | 独立业务功能 | Feature Spec |
| **横向 Capability** | 跨 Feature 的公共能力 | Capability Spec |
| **横向 Flow** | 跨 Domain/Feature 的业务流程 | Flow Spec |

**Domain Spec 创建时机**：
- 领域包含 3 个以上 Feature
- 领域有复杂业务规则需要统一定义
- 领域需要跨 Feature 复用规则

**Capability Spec 创建时机**：
- 横向功能被 2 个以上 Feature 使用
- 横向功能有复杂需求需要独立描述
- 简单横向功能可在 PRD 中一句话描述

**Flow Spec 创建时机**：
- 业务流程跨越 2 个以上 Domain/Feature
- 流程复杂度超出 PRD Core Flow 章节承载范围
- 简单流程可在 PRD 的 Core Flow 章节描述

**说明**：设计文档（Design Doc）属于设计阶段产出，见设计文档规范。需求目录只存放需求文档。

### 1.3 Directory Structure & Naming

```
docs/
├── prd.md                          # 产品 PRD（唯一）
│
├── _features/                      # 独立 Feature（Bottom-Up 模式）
│   ├── prd-validator.spec.md       # 尚未归入 Domain 的 Feature
│   └── status-script.spec.md
│
├── payment/                        # Domain 目录（已确定领域）
│   ├── _domain.spec.md             # Domain Spec（下划线前缀表示元信息）
│   ├── checkout.spec.md            # Feature Spec
│   └── refund.spec.md
│
├── user/                           # Domain 目录
│   ├── _domain.spec.md
│   ├── login.spec.md
│   └── register.spec.md
│
├── _capabilities/                  # Capability 目录（下划线前缀表示横向）
│   ├── logging.spec.md
│   └── permission.spec.md
│
└── _flows/                         # Flow 目录（下划线前缀表示横向）
    ├── order-process.spec.md
    └── payment-process.spec.md
```

**Naming Convention**：
- PRD：`prd.md`（固定名称）
- 独立 Feature Spec：`_features/{feature}.spec.md`（下划线前缀目录，Bottom-Up 模式）
- Domain Spec：`{domain}/_domain.spec.md`（下划线前缀）
- Domain 内 Feature Spec：`{domain}/{feature}.spec.md`（在 Domain 目录下）
- Capability Spec：`_capabilities/{name}.spec.md`（下划线前缀目录）
- Flow Spec：`_flows/{name}.spec.md`（下划线前缀目录）
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
3. 当 3+ 个 Feature 可归入同一领域时，创建 Domain Spec
4. 将相关 Feature 迁移到 Domain 目录下

**方法选择**：由用户在项目启动时指定，记录在 `.flow/state.json` 的 `flow.researchMethod` 字段中（值为 `top-down` 或 `bottom-up`）。

**Feature 迁移**（Bottom-Up → Domain）：
当独立 Feature 归入 Domain 时：
1. 将 `_features/{feature}.spec.md` 移动到 `{domain}/{feature}.spec.md`
2. 更新文档内的引用路径
3. 在 Domain Spec 的 Feature List 中添加该 Feature

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
| **Feature Roadmap** | `prod_roadmap` | 按 Domain 分层的 Feature 优先级排序、依赖关系 |
| **Success Criteria** | `prod_success` | 可验证的成功指标 |

### 3.2 Optional Sections

| 章节 | 锚点 | 适用场景 |
|------|------|----------|
| **Non-Goals** | `prod_non_goals` | 需要明确排除的范围 |
| **Core Flow** | `prod_flow` | 有复杂业务流程时 |
| **Appendix** | `prod_appendix` | 速查表、术语表 |

### 3.3 Template

**模板位置**：`docs/templates/{project-type}/prd.md`

当前项目模板：`docs/templates/backend/prd.md`

---

## 4. Domain Spec Structure <!-- id: spec_req_domain_spec --> <!-- defines: domain-spec -->

### 4.1 Creation Criteria

满足以下任一条件时创建 Domain Spec：
- 领域包含 3 个以上 Feature
- 领域有复杂业务规则需要统一定义
- 领域有跨 Feature 的公共概念

### 4.2 Required Sections

| 章节 | 锚点 | 内容 |
|------|------|------|
| **Domain Overview** | `domain_{name}_overview` | 领域职责、边界 |
| **Feature List** | `domain_{name}_features` | 该领域的 Feature 清单 |

### 4.3 Optional Sections

| 章节 | 锚点 | 适用场景 |
|------|------|----------|
| **Business Rules** | `domain_{name}_rules` | 有跨 Feature 的业务规则 |
| **User Scenarios** | `domain_{name}_scenarios` | 有典型用户场景 |
| **Glossary** | `domain_{name}_glossary` | 有领域特定术语 |

### 4.4 Template

**模板位置**：`docs/templates/{project-type}/_domain.spec.md`

当前项目模板：`docs/templates/backend/_domain.spec.md`

---

## 5. Feature Spec Structure <!-- id: spec_req_feature_spec --> <!-- defines: feature-spec -->

### 5.1 Required Sections

| 章节 | 锚点 | 内容 |
|------|------|------|
| **Intent** | `feat_{name}_intent` | 解决什么问题（Why） |
| **Core Capabilities** | `feat_{name}_capabilities` | 提供什么能力（What） |
| **Acceptance Criteria** | `feat_{name}_acceptance` | 可验证的完成条件 |

### 5.2 Optional Sections

| 章节 | 锚点 | 适用场景 |
|------|------|----------|
| **User Stories** | `feat_{name}_stories` | 需要详细描述用户场景 |
| **Boundaries** | `feat_{name}_boundaries` | 需要明确排除项 |
| **Dependencies** | `feat_{name}_dependencies` | 有前置依赖 |

### 5.3 Template

**模板位置**：`docs/templates/{project-type}/feature.spec.md`

当前项目模板：`docs/templates/backend/feature.spec.md`

### 5.4 Simple Feature Spec（含设计）

对于简单、独立的 Feature，可将需求和设计合并到一个文档中。

**适用条件**（满足全部）：
- Feature 边界清晰，不依赖其他 Feature
- 设计方案明确，无需单独设计文档
- 技术实现相对简单

**文档结构**：
- 保留标准 Feature Spec 章节（Intent、Core Capabilities、Acceptance Criteria）
- 新增 Scope 章节，明确边界
- 新增 Design 章节，包含技术设计内容
- 可选：Implementation Notes（实现说明、辅助脚本等）

**模板位置**：`docs/templates/{project-type}/simple-feature.spec.md`

当前项目模板：`docs/templates/backend/simple-feature.spec.md`

**示例**：state-management（状态管理规范 + Schema 设计）

---

## 6. Capability Spec Structure <!-- id: spec_req_capability_spec --> <!-- defines: capability-spec -->

### 6.1 Creation Criteria

满足以下任一条件时创建 Capability Spec：
- 横向功能被 2 个以上 Feature 使用
- 横向功能有复杂需求需要独立描述
- 横向功能需要定义统一的使用规范

**简单横向功能**：可在 PRD 的 Capability Roadmap 中一句话描述，不需要独立文档。

### 6.2 Required Sections

| 章节 | 锚点 | 内容 |
|------|------|------|
| **Intent** | `cap_{name}_intent` | 为什么需要这个能力 |
| **Consumers** | `cap_{name}_consumers` | 哪些 Feature/Domain 使用 |
| **Requirements** | `cap_{name}_requirements` | 功能需求（不涉及实现） |
| **Acceptance Criteria** | `cap_{name}_acceptance` | 可验证的完成条件 |

### 6.3 Optional Sections

| 章节 | 锚点 | 适用场景 |
|------|------|----------|
| **Boundaries** | `cap_{name}_boundaries` | 需要明确排除项 |
| **Constraints** | `cap_{name}_constraints` | 有性能/安全等约束 |

### 6.4 Template

**模板位置**：`docs/templates/{project-type}/capability.spec.md`

当前项目模板：`docs/templates/backend/capability.spec.md`

---

## 7. Flow Spec Structure <!-- id: spec_req_flow_spec --> <!-- defines: flow-spec -->

### 7.1 Creation Criteria

满足以下任一条件时创建 Flow Spec：
- 业务流程跨越 2 个以上 Domain/Feature
- 流程复杂度超出 PRD Core Flow 章节承载范围
- 流程涉及多个系统或外部集成

**简单流程**：可在 PRD 的 Core Flow 章节描述，不需要独立文档。

### 7.2 Required Sections

| 章节 | 锚点 | 内容 |
|------|------|------|
| **Flow Overview** | `flow_{name}_overview` | 流程目的、触发条件、参与方 |
| **Flow Steps** | `flow_{name}_steps` | 流程步骤、分支、异常处理 |
| **Participants** | `flow_{name}_participants` | 涉及的 Domain/Feature/外部系统 |
| **Acceptance Criteria** | `flow_{name}_acceptance` | 可验证的完成条件 |

### 7.3 Optional Sections

| 章节 | 锚点 | 适用场景 |
|------|------|----------|
| **Flow Diagram** | `flow_{name}_diagram` | 流程复杂需要可视化 |
| **Error Handling** | `flow_{name}_errors` | 有复杂异常场景 |
| **Constraints** | `flow_{name}_constraints` | 有性能/时序等约束 |

### 7.4 Template

**模板位置**：`docs/templates/{project-type}/flow.spec.md`

当前项目模板：`docs/templates/backend/flow.spec.md`

---

## 8. Acceptance Criteria Guide <!-- id: spec_req_acceptance -->

### 8.1 Principles

- **Verifiable**: 必须能通过测试或检查确认
- **Specific**: 避免模糊表述（"用户体验好"）
- **Independent**: 每条标准独立可验证

### 8.2 Formats

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

### 8.3 Anti-patterns

| Bad | Problem | Improvement |
|-----|---------|-------------|
| "登录要快" | 不可量化 | "登录响应时间 < 2秒" |
| "界面美观" | 主观 | "符合设计稿" |
| "功能正常" | 模糊 | 列出具体功能点 |

---

## 9. Change Management <!-- id: spec_req_change -->

### 9.1 Version Number

```
v{major}.{minor}

major: 结构性变更（增删章节）
minor: 内容更新（修改描述）
```

示例：`v1.0` → `v1.1`（内容更新） → `v2.0`（结构变更）

### 9.2 Change Log Format

在文档末尾维护变更记录：

```markdown
---

*Version: v1.2*
*Created: 2024-12-16*
*Updated: 2024-12-20*
*Changes: v1.1 added XX section; v1.2 modified XX content*
```

### 9.3 Major Change Handling

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
| 这个领域有哪些 Feature？ | 看 Domain Spec |
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

```
Feature A: 需求 → 设计 → 实现 → 验证 ✓
Feature B: 需求 → 设计 → 实现 → 验证 ← 当前
Capability X: 需求 → 设计 → 实现 → 验证 (并行)
Feature C: 待开始
```

### E. User Story vs User Scenario vs Flow Spec

**概念对比**：

| 维度 | User Story | User Scenario | Flow Spec |
|------|------------|---------------|-----------|
| **所属文档** | Feature Spec | Domain Spec | 独立文档 |
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
| 描述领域内多个 Feature 如何协作 | User Scenario（Domain Spec） |
| 描述跨域的复杂业务流程，需详细步骤/异常/约束 | Flow Spec（独立文档） |
| 简单跨域流程，无需详细定义 | PRD Core Flow 章节 |

**边界判断**：

```
单 Feature 内的用户需求 → User Story
        ↓ 涉及多个 Feature
单 Domain 内的业务场景 → User Scenario
        ↓ 跨多个 Domain 或需要详细定义
跨域复杂流程 → Flow Spec
```

---

*Version: v2.9*
*Created: 2024-12-20*
*Updated: 2024-12-21*
*Changes: v2.9 添加 defines 声明，支持规范映射（遵循 meta-spec.md）*
*Applies to: SoloDevFlow 2.0*
