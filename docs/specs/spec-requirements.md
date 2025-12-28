# Requirements Document Specification v2.11 <!-- id: spec_requirements -->

> 定义需求文档（PRD、Feature、Capability、Flow）的结构和编写标准

---

**重要声明**：

- 此规范定义需求文档的**具体章节结构**
- 元规范 `spec-meta.md` 定义文档类型和验证规则
- 设计文档规范见 `spec-design.md`
- **版本 v2.11**：Feature 章节 Core Capabilities → Core Functions，避免与 Capability Spec 混淆
- **模板已消除**：AI 直接从本规范生成文档，不再使用 `template/requirements/` 模板

---

## 1. Scope <!-- id: spec_req_scope -->

### 1.0 Core Concepts <!-- id: spec_req_concepts -->

#### 1.0.1 Terminology

| 术语 | 定义 | 核心特征 |
|------|------|----------|
| **Feature** | 纵向业务功能切片 | 面向用户价值、端到端可交付、可独立验收 |
| **Capability** | 横向技术能力 | 被多个 Feature 复用、基础设施性质 |
| **Flow** | 跨域协作流程 | 编排多个 Feature/系统、有时序和状态转换 |

#### 1.0.2 Feature vs Capability vs Flow

| 维度 | Feature | Capability | Flow |
|------|---------|------------|------|
| **方向** | 纵向（业务切片） | 横向（技术复用） | 跨域（协作编排） |
| **服务对象** | 用户/业务目标 | 其他 Feature | 多个参与方 |
| **独立性** | 可独立交付验收 | 被依赖调用 | 编排协调多方 |
| **生命周期** | 有明确开始和结束 | 持续存在 | 事件驱动 |
| **示例** | 用户登录、商品搜索、订单创建 | 认证、缓存、日志、通知 | 订单履行、支付流程、注册激活 |

#### 1.0.3 Document Type Decision Tree

```
这个需求...

├─ 直接服务于用户/业务目标？
│  ├─ Yes → 是否需要详细设计？
│  │         ├─ Yes → 独立 Feature Spec
│  │         └─ No  → PRD 章节即可
│  └─ No ↓
│
├─ 被 2+ Feature 复用的基础能力？
│  ├─ Yes → 是否需要独立描述？
│  │         ├─ Yes → 独立 Capability Spec
│  │         └─ No  → PRD 章节即可
│  └─ No ↓
│
└─ 跨 Feature/系统的协作流程？
   ├─ Yes → 流程是否复杂？
   │         ├─ Yes → 独立 Flow Spec
   │         └─ No  → PRD Core Flow 章节
   └─ No  → 重新分析需求边界
```

### 1.1 Document Types

本规范定义以下需求文档类型的结构：

| Type | 定义 | 文件命名 | 目录 |
|------|------|----------|------|
| `prd` | 产品需求文档（产品愿景、整体规划） | `prd.md`（固定） | `docs/requirements/` |
| `feature` | 纵向业务功能（面向用户价值、可独立交付） | `fea-{name}.md` | `docs/requirements/features/` |
| `capability` | 横向技术能力（被多 Feature 复用） | `cap-{name}.md` | `docs/requirements/capabilities/` |
| `flow` | 跨域协作流程（编排多方协作） | `flow-{name}.md` | `docs/requirements/flows/` |

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

### 1.3 Directory & Naming

> 目录结构和命名规范见 [spec-meta.md §5](docs/specs/spec-meta.md#meta_directory)

### 1.4 Requirements Research Methods

| 方法 | 描述 | 适用场景 |
|------|------|----------|
| **Top-Down** | PRD → Domain → Feature | 领域边界清晰、有完整规划 |
| **Bottom-Up** | PRD → Feature → Domain | 探索性开发、边做边发现领域 |

方法选择记录在 `.solodevflow/state.json` 的 `flow.researchMethod` 字段。

### 1.5 Summary Extraction Rule

文档索引（index.js）从以下位置提取文档摘要（Summary）：

| 文档类型 | 摘要来源 | 提取规则 |
|----------|----------|----------|
| PRD | Product Vision 章节 | 第一段（Core Value 之前） |
| Feature | 标题后 `>` 引用 | 或 Intent 章节 Problem/Value 首段 |
| Capability | Intent 章节 | 首段 |
| Flow | Flow Overview 章节 | 首段 |

**提取规则**：
1. 定位目标章节（按优先级）
2. 提取首个非空段落（排除标题、表格、代码块）
3. 截取前 200 字符作为摘要

**示例**：

```markdown
# Feature: State Management <!-- id: feat_state_management -->

> 项目状态的唯一真实来源，定义 state.json 的结构、校验规则、使用指南
```

摘要提取结果：`项目状态的唯一真实来源，定义 state.json 的结构、校验规则、使用指南`

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

### 2.1 Optional Frontmatter Fields

以下字段为可选，用于增强文档索引（index.json）：

```yaml
---
type: feature
version: "1.0"
id: state-management   # 推荐：文档唯一标识
status: in_progress    # 推荐：文档状态
priority: P0           # 可选：优先级
domain: process        # 可选：所属 Domain
---
```

| 字段 | 必填 | 说明 |
|------|------|------|
| `id` | 推荐 | 文档唯一标识，用于 index.json 和 state.json 关联 |
| `status` | 推荐 | 文档状态：`not_started` / `in_progress` / `done` |
| `priority` | 否 | 优先级：`P0` / `P1` / `P2` |
| `domain` | 否 | 所属 Domain 名称（与 PRD 中的 Domain 对应） |

**说明**：
- `id` 和 `status` 是 v12.0.0 架构的核心字段，强烈推荐填写
- 这些字段由 `scripts/index.js` 解析并生成 `.solodevflow/index.json`
- 解析器应容错处理缺失情况

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
| Constraints & Assumptions | No | `prod_constraints` | 技术/业务/法规约束，前提假设 |
| Non-Functional Requirements | No | `prod_nfr` | 性能、安全、可用性等质量属性 |
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
- **Feature**: [链接到 Feature Spec 文档]（如有独立文档）
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

### 3.3 Constraints & Assumptions (Optional)

当产品有明确的约束条件或前提假设时，添加此章节：

```markdown
## Constraints & Assumptions <!-- id: prod_constraints -->

### Constraints（约束）

| 类型 | 约束内容 | 影响范围 |
|------|----------|----------|
| 技术约束 | 必须使用 Node.js 18+ | 所有后端服务 |
| 业务约束 | 仅支持中国大陆地区 | 支付、物流 |
| 法规约束 | 需符合 GDPR | 用户数据处理 |
| 资源约束 | 团队仅 2 人 | 功能优先级 |

### Assumptions（假设）

| 假设 | 若不成立的影响 |
|------|----------------|
| 用户有基础开发经验 | 需增加新手引导 |
| 网络环境稳定 | 需增加离线支持 |
```

### 3.4 Non-Functional Requirements (Optional)

当产品有特定质量属性要求时，添加此章节：

```markdown
## Non-Functional Requirements <!-- id: prod_nfr -->

### Performance（性能）

| 指标 | 目标值 | 测量方法 |
|------|--------|----------|
| 页面加载时间 | < 2s | Lighthouse |
| API 响应时间 | P95 < 500ms | APM 监控 |

### Security（安全）

| 要求 | 说明 |
|------|------|
| 认证方式 | JWT + Refresh Token |
| 数据加密 | 敏感数据 AES-256 加密存储 |

### Availability（可用性）

| 指标 | 目标值 |
|------|--------|
| SLA | 99.9% |
| RTO | < 4 小时 |
| RPO | < 1 小时 |
```

---

## 4. Feature Spec Structure <!-- id: spec_req_feature --> <!-- defines: feature -->

| Section | Required | Anchor | Description | Condition |
|---------|----------|--------|-------------|-----------|
| Intent | Yes | `feat_{name}_intent` | 解决什么问题（Why） | - |
| Core Functions | Yes | `feat_{name}_functions` | 提供什么功能（What） | - |
| Acceptance Criteria | Yes | `feat_{name}_acceptance` | 可验证的完成条件 | - |
| Artifacts | code 类型必填 | `feat_{name}_artifacts` | 产物记录（设计/代码/测试路径） | - |
| UI Components | Yes | `feat_{name}_ui_components` | 涉及的 UI 组件（复用/新建） | projectType: web-app |
| User Stories | No | `feat_{name}_stories` | 需要详细描述用户场景 | - |
| Boundaries | No | `feat_{name}_boundaries` | 需要明确排除项 | - |
| Dependencies | No | `feat_{name}_dependencies` | 有前置依赖 | - |
| Non-Functional Requirements | No | `feat_{name}_nfr` | 性能、安全等质量属性（Feature 级） | - |

### 4.0 Condition Column

`Condition` 列用于标注章节的适用条件：

| 条件格式 | 说明 | 示例 |
|----------|------|------|
| `-` | 无条件，适用于所有项目类型 | Intent、Acceptance Criteria |
| `projectType: {type}` | 仅适用于指定项目类型 | `projectType: web-app` |

**支持的项目类型**：
- `backend`: 后端服务项目
- `web-app`: Web 前端应用
- `mobile-app`: 移动端应用

AI 在生成文档时，根据 `state.json` 的 `project.type` 字段判断是否包含条件章节。

### 4.1 Feature Types

| 类型 | 说明 | 产出物 |
|------|------|--------|
| `code` | 代码型 | 代码 + 测试 + 设计文档（可选） |
| `document` | 文档型 | Markdown 文档（可选脚本） |

### 4.2 Artifacts Section

Artifacts 章节记录 Feature 的产出物位置：

```markdown
## Artifacts <!-- id: feat_{name}_artifacts -->

| Type | Path | Description |
|------|------|-------------|
| Design | docs/designs/des-{name}.md | 设计文档（设计阶段填写） |
| Code | src/{module}/ | 代码目录 |
| Test | tests/e2e/{name}.test.ts | E2E 测试 |

**Design Depth**: TBD（由设计阶段确定）
```

**Design Depth 工作流**：
1. 需求阶段：Artifacts 章节标记 `Design Depth: TBD`
2. 设计阶段：设计 AI 按判断标准评估
3. 设计 AI 回填 `Design Depth` 字段（`Required` 或 `None`）
4. 若 Required，编写设计文档

> Design Depth 判断标准见 `spec-design.md` 第 3 节

### 4.3 Non-Functional Requirements (Optional)

当 Feature 有特定的质量属性要求（超出 PRD 级别的通用要求）时，添加此章节：

```markdown
## Non-Functional Requirements <!-- id: feat_{name}_nfr -->

| 类别 | 要求 | 验收标准 |
|------|------|----------|
| 性能 | 搜索响应时间 | P95 < 200ms |
| 安全 | 输入校验 | 防止 XSS/SQL 注入 |
| 可用性 | 降级策略 | 外部服务不可用时返回缓存 |
```

**使用场景**：
- Feature 有比 PRD 更严格的性能要求
- Feature 涉及敏感数据，有额外安全要求
- Feature 是核心链路，需要高可用保障

### 4.5 UI Components Section (web-app only)

> 此章节仅适用于 `projectType: web-app` 的项目

列出 Feature 涉及的 UI 组件，标注复用现有组件还是新建：

```markdown
## UI Components <!-- id: feat_{name}_ui_components -->

| Component | 描述 | 复用/新建 |
|-----------|------|-----------|
| {组件名} | {组件功能} | 复用现有 / 新建 |

### Component Dependencies

```
PageComponent
  ├── HeaderComponent
  ├── ContentComponent
  │   ├── FormComponent
  │   └── TableComponent
  └── FooterComponent
```
```

**规则**：
- 先查询 `docs/ui/component-registry.md`（如存在）
- 优先复用现有组件
- 新建组件实现后需更新组件注册表

### 4.6 Dependencies Section Format

Dependencies 章节声明 Feature 的前置依赖，支持文档索引关系提取：

```markdown
## Dependencies <!-- id: feat_{name}_dependencies -->

| Dependency | Type | 说明 |
|------------|------|------|
| spec-meta | hard | 依赖元规范锚点系统 |
| feat_auth | soft | 可选依赖认证功能 |
```

| 列 | 必填 | 说明 |
|----|------|------|
| Dependency | 是 | 依赖项锚点 ID 或文档名（不含路径后缀） |
| Type | 是 | `hard`（必须先完成）/ `soft`（可选增强） |
| 说明 | 否 | 依赖原因 |

**解析规则**：
- `Type=hard` → 关系类型 `depends`
- `Type=soft` → 关系类型 `extends`
- 方向：当前文档 → 依赖项

**使用场景**：
- 声明需求依赖（如 Feature A 需要 Feature B 先完成）
- 声明规范依赖（如 Feature 依赖某个规范定义）
- 声明能力依赖（如 Feature 使用某个 Capability）

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
| Artifacts | No | `cap_{name}_artifacts` | 产物记录（代码/测试路径） |

### 5.1 Creation Criteria

满足以下任一条件时创建独立 Capability Spec：
- 横向功能被 2 个以上 Feature 使用
- 横向功能有复杂需求需要独立描述
- 横向功能需要定义统一的使用规范

### 5.2 Consumers Section Format

Consumers 章节声明哪些 Feature/Domain 使用该 Capability，支持文档索引关系提取：

```markdown
## Consumers <!-- id: cap_{name}_consumers -->

| Consumer | Type | 使用场景 |
|----------|------|----------|
| feat_user_login | feature | 用户登录时调用认证能力 |
| feat_user_register | feature | 注册后自动登录 |
| domain_payment | domain | 支付前验证用户身份 |
```

| 列 | 必填 | 说明 |
|----|------|------|
| Consumer | 是 | 消费者锚点 ID（Feature 用 `feat_xxx`，Domain 用 `domain_xxx`） |
| Type | 是 | 消费者类型：`feature` / `domain` / `flow` |
| 使用场景 | 否 | 描述如何使用该能力 |

**解析规则**：
- Consumer 列 → 关系来源（谁使用）
- 当前 Capability → 关系目标（被使用）
- 关系类型：`consumes`
- 方向：Consumer → Capability

**与 Dependencies 的区别**：
- Dependencies：声明"我依赖谁"（在 Feature 中声明）
- Consumers：声明"谁使用我"（在 Capability 中声明）

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

### B. Anchor & Naming

> 锚点前缀和命名规范见 [spec-meta.md §5-6](docs/specs/spec-meta.md#meta_directory)

---

*Version: v2.11*
*Created: 2024-12-20 (v1.0)*
*Updated: 2025-12-27 (v2.11)*
*Changes: v2.11 Feature 章节 Core Capabilities → Core Functions；v2.10 消除冗余；v2.9 新增 Core Concepts*
