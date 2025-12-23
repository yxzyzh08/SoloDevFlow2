# Requirements Document Specification v2.0 <!-- id: spec_requirements -->

> 定义需求文档（PRD、Feature、Capability、Flow）的结构和编写标准

---

**重要声明**：

- 此规范定义需求文档的**具体章节结构**
- 元规范 `spec-meta.md` 定义文档类型和验证规则
- 设计文档规范见 `spec-design.md`
- **版本 v2.0**：与 spec-meta.md v2.1 对齐，采用前缀命名规范

---

## 1. Scope <!-- id: spec_req_scope -->

### 1.1 Document Types

本规范定义以下需求文档类型的结构：

| Type | 说明 | 文件命名 | 目录 |
|------|------|----------|------|
| `prd` | 产品需求文档 | `prd.md`（固定） | `docs/requirements/` |
| `feature` | 功能文档 | `fea-{name}.md` | `docs/requirements/features/` |
| `capability` | 横向能力文档 | `cap-{name}.md` | `docs/requirements/capabilities/` |
| `flow` | 跨域流程文档 | `flow-{name}.md` | `docs/requirements/flows/` |

### 1.2 Document Hierarchy

```
PRD (1个，必须)
  ├── Feature Spec (按复杂度决定是否独立)
  ├── Capability Spec (横向能力，可选)
  └── Flow Spec (跨域流程，可选)
```

**独立性判断**：
- **简单场景**：Feature/Capability/Flow 仅在 PRD 中描述（作为章节）
- **复杂场景**：需要详细设计文档时，独立成文档
- **判断标准**：是否需要详细设计、是否跨产品复用、章节内容是否超过 500 行

### 1.3 Directory Structure

```
docs/requirements/
├── prd.md                    # 产品需求文档（必须，固定名称）
├── features/                 # 独立 Feature（复杂场景）
│   ├── fea-user-login.md
│   └── fea-payment-gateway.md
├── capabilities/             # 横向能力（复杂场景）
│   ├── cap-auth.md
│   └── cap-logging.md
└── flows/                    # 跨域流程（复杂场景）
    └── flow-order-fulfillment.md
```

### 1.4 Requirements Research Methods

| 方法 | 描述 | 适用场景 |
|------|------|----------|
| **Top-Down** | PRD → Domain → Feature | 领域边界清晰、有完整规划 |
| **Bottom-Up** | PRD → Feature → Domain | 探索性开发、边做边发现领域 |

方法选择记录在 `.solodevflow/state.json` 的 `flow.researchMethod` 字段。

---

## 2. Frontmatter <!-- id: spec_req_frontmatter -->

所有需求文档必须包含 YAML frontmatter：

```yaml
---
type: {doc_type}
version: {version}
---
```

| 字段 | 必填 | 说明 |
|------|------|------|
| `type` | 是 | 文档类型：`prd`, `feature`, `capability`, `flow` |
| `version` | 是 | 文档版本号 |

---

## 3. PRD Structure <!-- id: spec_req_prd --> <!-- defines: prd -->

| Section | Required | Anchor | Description |
|---------|----------|--------|-------------|
| Product Vision | Yes | `prod_vision` | 一句话定义 + 核心价值 |
| Target Users | Yes | `prod_users` | 用户画像、痛点 |
| Product Description | Yes | `prod_description` | High Level 功能概述 |
| Feature Roadmap | Yes | `prod_roadmap` | 按 Domain 分组的 Feature 列表 |
| Success Criteria | Yes | `prod_success` | 可验证的成功指标 |
| Non-Goals | No | `prod_non_goals` | 明确排除的范围 |
| Core Flow | No | `prod_flow` | 有复杂业务流程时 |
| Appendix | No | `prod_appendix` | 速查表、术语表 |

### 3.1 Feature Roadmap Structure

Feature Roadmap 按 Domain 组织，每个 Feature 以子章节形式呈现：

```markdown
## Feature Roadmap <!-- id: prod_roadmap -->

### Domain: {domain-name} <!-- id: domain_{name} -->

{Domain 简述}

#### {feature-name} <!-- id: feat_ref_{name} -->

{Feature 高层次描述（2-3 句话）}

**元信息**：
- **Priority**: P0/P1/P2
- **Type**: code / document
- **Spec**: [链接到 Feature Spec 文档]（如有独立文档）
```

### 3.2 Domain Collaboration (Optional)

当 Domain 有复杂的跨 Feature 交互时，可添加 Domain Collaboration 子章节：

```markdown
### Domain: {domain-name} <!-- id: domain_{name} -->

#### Domain Collaboration <!-- id: domain_{name}_collaboration -->

**Feature Interactions**:
- Feature A ↔ Feature B: {交互说明}

**Shared Concepts**:
| Concept | Definition | Used by |
|---------|------------|---------|
| {概念} | {定义} | Feature A, B |

**Business Rules**:
1. **Rule Name**: {规则描述}
```

---

## 4. Feature Spec Structure <!-- id: spec_req_feature --> <!-- defines: feature -->

| Section | Required | Anchor | Description |
|---------|----------|--------|-------------|
| Intent | Yes | `feat_{name}_intent` | 解决什么问题（Why） |
| Core Capabilities | Yes | `feat_{name}_capabilities` | 提供什么能力（What） |
| Acceptance Criteria | Yes | `feat_{name}_acceptance` | 可验证的完成条件 |
| Artifacts | code 类型必填 | `feat_{name}_artifacts` | 产物记录（设计/代码/测试路径） |
| User Stories | No | `feat_{name}_stories` | 需要详细描述用户场景 |
| Boundaries | No | `feat_{name}_boundaries` | 需要明确排除项 |
| Dependencies | No | `feat_{name}_dependencies` | 有前置依赖 |

### 4.1 Feature Types

| 类型 | 说明 | 产出物 |
|------|------|--------|
| `code` | 代码型 | 代码 + 测试 + 设计文档（可选） |
| `document` | 文档型 | Markdown 文档（可选脚本） |

### 4.2 Design Depth

code 类型 Feature 需声明设计深度：

| 级别 | 名称 | 设计文档 | 适用场景 |
|------|------|----------|----------|
| L0 | 无设计 | 不需要 | 极简单功能，直接实现 |
| L1 | 轻量设计 | 需要 | 简单功能，低风险 |
| L2 | 标准设计 | 需要 | 一般功能，中等复杂度 |
| L3 | 详细设计 | 需要 | 复杂功能，高风险 |

---

## 5. Capability Spec Structure <!-- id: spec_req_capability --> <!-- defines: capability -->

| Section | Required | Anchor | Description |
|---------|----------|--------|-------------|
| Intent | Yes | `cap_{name}_intent` | 为什么需要这个能力 |
| Consumers | Yes | `cap_{name}_consumers` | 哪些 Feature/Domain 使用 |
| Requirements | Yes | `cap_{name}_requirements` | 功能需求（不涉及实现） |
| Acceptance Criteria | Yes | `cap_{name}_acceptance` | 可验证的完成条件 |
| Boundaries | No | `cap_{name}_boundaries` | 需要明确排除项 |
| Constraints | No | `cap_{name}_constraints` | 有性能/安全等约束 |

### 5.1 Creation Criteria

满足以下任一条件时创建独立 Capability Spec：
- 横向功能被 2 个以上 Feature 使用
- 横向功能有复杂需求需要独立描述
- 横向功能需要定义统一的使用规范

---

## 6. Flow Spec Structure <!-- id: spec_req_flow --> <!-- defines: flow -->

| Section | Required | Anchor | Description |
|---------|----------|--------|-------------|
| Flow Overview | Yes | `flow_{name}_overview` | 流程目的、触发条件、参与方 |
| Flow Steps | Yes | `flow_{name}_steps` | 流程步骤、分支、异常处理 |
| Participants | Yes | `flow_{name}_participants` | 涉及的 Domain/Feature/外部系统 |
| Acceptance Criteria | Yes | `flow_{name}_acceptance` | 可验证的完成条件 |
| Flow Diagram | No | `flow_{name}_diagram` | 流程复杂需要可视化 |
| Error Handling | No | `flow_{name}_errors` | 有复杂异常场景 |
| Constraints | No | `flow_{name}_constraints` | 有性能/时序等约束 |

### 6.1 Creation Criteria

满足以下任一条件时创建独立 Flow Spec：
- 业务流程跨越 2 个以上 Domain/Feature
- 流程复杂度超出 PRD Core Flow 章节承载范围
- 流程涉及多个系统或外部集成

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

### 8.2 Change Log Format

在文档末尾维护变更记录：

```markdown
---

*Version: v1.2*
*Created: 2024-12-16*
*Updated: 2024-12-20*
```

---

## Appendix: Quick Reference <!-- id: spec_req_appendix -->

### A. Document Type Decision

| Question | Document |
|----------|----------|
| 产品愿景和整体规划？ | PRD |
| 某个业务功能的完整需求？ | Feature Spec |
| 跨功能的公共能力需求？ | Capability Spec |
| 跨域的业务流程？ | Flow Spec |

### B. Anchor Prefix

| Prefix | Type | Example |
|--------|------|---------|
| `prod_` | PRD | `prod_vision`, `prod_roadmap` |
| `domain_` | Domain | `domain_user_management` |
| `feat_` | Feature | `feat_login_intent` |
| `cap_` | Capability | `cap_auth_intent` |
| `flow_` | Flow | `flow_checkout_steps` |

### C. Naming Convention

| Type | Prefix | Example |
|------|--------|---------|
| PRD | 无 | `prd.md` |
| Feature | `fea-` | `fea-user-login.md` |
| Capability | `cap-` | `cap-auth.md` |
| Flow | `flow-` | `flow-order-fulfillment.md` |

---

*Version: v2.0*
*Created: 2024-12-20 (v1.0)*
*Updated: 2025-12-23 (v2.0)*
*Changes: v2.0 与 spec-meta.md v2.1 对齐，采用前缀命名规范，简化冗余章节*
