# Design Document Specification v2.6 <!-- id: spec_design -->

> 定义设计文档的结构、内容要素、编写标准

---

**重要声明**：

- 此规范定义设计文档的**具体章节结构**
- 元规范 `spec-meta.md` 定义文档类型和验证规则
- 需求文档规范见 `spec-requirements.md`
- **版本 v2.6**：消除与 spec-meta 的冗余，明确职责边界

---

## 1. Scope <!-- id: spec_design_scope -->

### 1.1 Document Type

本规范定义设计文档（`type: design`）的结构。

| Type | 说明 | 文件命名 | 目录 |
|------|------|----------|------|
| `design` | 技术设计文档 | `des-{descriptive-name}.md` | `docs/designs/` |

### 1.2 Design Document Principles

**按技术架构组织**，而不是镜像需求文档结构：
- 通过 `inputs` 字段关联需求，而不是通过目录结构
- 命名反映设计内容，而不是需求名称
- 粒度由技术需要决定，可以是系统级、模块级、组件级

### 1.3 Requirements-Design Relationship

设计文档与需求文档是**多对多关系**：

```
# 一个 Feature → 多个 Design
fea-payment.md
  → des-payment-architecture.md
  → des-payment-api.md
  → des-payment-data-model.md

# 多个 Feature → 一个 Design
fea-user-login.md  ┐
fea-user-register.md├→ des-user-module.md
cap-auth.md        ┘

# 一个 Design → 多个 Feature
des-system-architecture.md
  ← fea-api-gateway.md
  ← fea-service-mesh.md
  ← cap-logging.md
```

### 1.4 Directory & Naming

> 目录结构和命名规范见 [spec-meta.md §5](docs/specs/spec-meta.md#meta_directory)

---

## 2. Frontmatter <!-- id: spec_design_frontmatter -->

设计文档必须包含 YAML frontmatter：

```yaml
---
type: design
version: {version}
inputs:
  - docs/requirements/features/fea-user-login.md#feat_login_intent
  - docs/requirements/capabilities/cap-auth.md#cap_auth_intent
---
```

| 字段 | 必填 | 说明 |
|------|------|------|
| `type` | 是 | 固定为 `design` |
| `version` | 是 | 文档版本号 |
| `inputs` | 是 | 输入来源（需求文档锚点引用列表） |

---

## 3. Design Depth <!-- id: spec_design_depth -->

> 核心理念：**最小可行设计**（Minimum Viable Design）—— 够用就好，不要过度设计。

### 3.1 Binary Decision

设计深度只有两种：**需要设计文档** 或 **不需要设计文档**。

| 判断结果 | 说明 |
|----------|------|
| **Design Required** | 需要编写设计文档 |
| **No Design** | 不需要设计文档，直接实现 |

### 3.2 判断标准

**需要设计文档**（满足任一条件）：

| 条件 | 说明 |
|------|------|
| 新增 Feature | 新增一个完整的功能特性 |
| 新增数据模型 | 新增数据库表、API Schema |
| 新增核心实体 | 新增领域对象、业务实体 |
| 新增模块 | 新增模块或涉及跨模块协作 |
| 引入外部依赖 | 引入第三方服务、SDK、API |
| 架构变更 | 架构层面的调整 |
| 单模块内重构 | 影响多个代码文件 |

**不需要设计文档**：

| 场景 | 说明 |
|------|------|
| 简单工具脚本 | CLI 工具、脚手架等（逻辑直观、配置驱动、代码自解释） |
| 已有逻辑简单变更 | 在现有代码上做小改动 |
| 已有模型字段增减 | 不改变模型核心结构 |
| Bug 修复 | 修复缺陷 |
| 配置/文案修改 | 非逻辑变更 |
| UI 样式调整 | 纯展示层变更 |

### 3.3 判断流程

```
是否满足以下任一条件？
  □ 新增 Feature（完整功能特性）
  □ 新增数据模型（数据库表、API Schema）
  □ 新增核心实体（领域对象）
  □ 新增模块或跨模块协作
  □ 引入外部依赖（第三方服务、SDK）
  □ 架构层面变更
  □ 单模块内重构（影响多个代码文件）

→ 任一勾选 = Design Required（需要设计文档）
→ 全部未勾选 = No Design（不需要设计文档）
```

### 3.4 Design Depth Workflow

Design Depth 由设计阶段决定，而非需求阶段：

```
需求阶段                          设计阶段
    │                                │
    ▼                                ▼
Feature Spec                    设计 AI 评估
(Artifacts.designDepth = TBD)        │
    │                                ▼
    │                          判断是否需要设计文档
    │                                │
    │◄───────── 回填 ────────────────┤
    │                                │
    ▼                                ▼
Feature Spec                    No Design: 直接实现
(designDepth = Required/None)   Required: 编写设计文档
```

**设计 AI 职责**：
1. 读取 Feature Spec，按 3.2 标准判断
2. **回填** Feature Spec 的 `Artifacts.designDepth` 字段（`Required` 或 `None`）
3. 若 Required，编写设计文档

---

## 4. Design Structure <!-- id: spec_design_structure --> <!-- defines: design -->

| Section | Required | Anchor | Description |
|---------|----------|--------|-------------|
| Input Requirements | Yes | `design_{name}_input` | 声明输入来源（需求文档引用） |
| Overview | Yes | `design_{name}_overview` | 设计目标、约束条件 |
| Technical Approach | Yes | `design_{name}_approach` | 技术方案、架构决策 |
| Interface Design | No | `design_{name}_interface` | 接口定义、数据结构、错误码（有接口才需要） |
| Decision Record | No | `design_{name}_decisions` | 关键决策及其理由（有多方案选择时填写） |
| Implementation Plan | No | `design_{name}_impl` | 实现步骤（复杂场景可选） |
| Risks | No | `design_{name}_risks` | 技术风险及缓解措施（高风险可选） |
| Dependencies | No | `design_{name}_dependencies` | 外部依赖（有依赖时填写） |

### 4.1 Input Requirements Section

设计文档必须声明其需求来源：

```markdown
## Input Requirements <!-- id: design_{name}_input -->

本设计基于以下需求：
- [PRD - 用户登录模块](docs/requirements/prd.md#feat_login)
- [Feature - 认证能力](docs/requirements/capabilities/cap-auth.md#cap_auth_intent)
```

### 4.2 Interface Design Section

接口设计章节需包含以下要素：

| 要素 | Required | 说明 |
|------|:--------:|------|
| 函数签名 | Yes | 输入/输出类型定义 |
| 数据结构 | Yes | DTO/Entity/Schema 定义 |
| 错误码定义 | Yes | 业务错误枚举 |
| 状态流转 | No | 状态机（如有） |

```markdown
## Interface Design <!-- id: design_{name}_interface -->

### 函数签名

\`\`\`typescript
interface UserService {
  login(credentials: LoginDTO): Promise<AuthResult>;
  logout(userId: string): Promise<void>;
}
\`\`\`

### 数据结构

\`\`\`typescript
interface LoginDTO {
  email: string;
  password: string;
}
\`\`\`

### 错误码定义（L2+）

| Code | Name | Description |
|------|------|-------------|
| AUTH_001 | INVALID_CREDENTIALS | 用户名或密码错误 |
| AUTH_002 | ACCOUNT_LOCKED | 账户已锁定 |
```

### 4.3 Decision Record Section (ADR)

记录关键技术决策及其理由，遵循 ADR（Architecture Decision Records）最佳实践：

```markdown
## Decision Record <!-- id: design_{name}_decisions -->

| Decision | Options | Choice | Rationale |
|----------|---------|--------|-----------|
| 数据库选型 | PostgreSQL / MySQL / MongoDB | PostgreSQL | 需要复杂查询 + 事务支持 |
| 缓存策略 | Redis / Memcached / 本地缓存 | Redis | 需要持久化 + 分布式锁 |
| 认证方式 | JWT / Session / OAuth | JWT | 无状态、易于扩展 |
```

**Decision Record 要点**：
- 每个决策记录"选择了什么"和"为什么这样选择"
- 列出考虑过的备选方案
- 说明选择的关键理由

### 4.4 Risks Section

风险章节需包含缓解措施：

```markdown
## Risks <!-- id: design_{name}_risks -->

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| 第三方 API 不稳定 | High | Medium | 添加熔断 + 降级策略 |
| 数据量超预期 | Medium | Low | 分库分表预案 |
| 并发竞争条件 | High | Low | 分布式锁 + 乐观锁 |
```

### 4.5 Dependencies Section Format

Dependencies 章节声明设计的前置依赖，支持知识库关系提取：

```markdown
## Dependencies <!-- id: design_{name}_dependencies -->

| Dependency | Type | 说明 |
|------------|------|------|
| design_system_arch | hard | 依赖系统架构设计 |
| cap_auth | soft | 可选使用认证能力 |
```

| 列 | 必填 | 说明 |
|----|------|------|
| Dependency | 是 | 依赖项锚点 ID（设计文档用 `design_xxx`，能力用 `cap_xxx`） |
| Type | 是 | `hard`（必须）/ `soft`（可选增强） |
| 说明 | 否 | 依赖原因 |

**解析规则**：
- `Type=hard` → 关系类型 `depends`
- `Type=soft` → 关系类型 `extends`
- 方向：当前设计文档 → 依赖项

**与 inputs 的区别**：
- `inputs`：声明需求来源（需求 → 设计）
- `Dependencies`：声明设计依赖（设计 → 设计 / 设计 → 能力）

---

## 5. Design Review Checklist <!-- id: spec_design_checklist -->

**必选章节检查**：
- [ ] `inputs` 字段是否正确引用需求文档？
- [ ] Overview 是否清晰描述设计目标？
- [ ] Technical Approach 是否说明技术方案？

**可选章节检查**（按需）：
- [ ] 有多方案选择：是否有 Decision Record 记录决策理由？
- [ ] 有接口设计：Interface Design 是否包含函数签名、数据结构、错误码？
- [ ] 复杂场景：是否有 Implementation Plan？
- [ ] 高风险场景：是否识别 Risks 及缓解措施？
- [ ] 有外部依赖：是否列出 Dependencies？

---

## 6. Project Type Guidelines <!-- id: spec_design_project_types -->

不同项目类型的设计关注点：

### 6.1 Backend

| 关注点 | 说明 |
|--------|------|
| 分层架构 | Controller → Service → Repository |
| API 设计 | RESTful 规范、请求/响应格式 |
| 数据库设计 | ER图、索引策略 |
| 性能要求 | 响应时间、并发处理 |

### 6.2 Web App

| 关注点 | 说明 |
|--------|------|
| 组件架构 | Atomic Design 层级 |
| 状态管理 | Local / Global / Server State |
| 路由设计 | 路由结构、权限控制 |
| 响应式设计 | 断点定义、布局适配 |

### 6.3 Mobile App

| 关注点 | 说明 |
|--------|------|
| 平台适配 | iOS/Android 差异处理 |
| 屏幕适配 | 安全区域、横竖屏 |
| 性能设计 | 启动时间、内存管理 |
| 原生集成 | 权限、推送、后台任务 |

---

## 7. Change Management <!-- id: spec_design_change -->

### 7.1 Spec First Principle

文档定义系统的行为契约，代码是契约的实现。

| 变更类型 | 处理方式 |
|----------|----------|
| 需求变更 | 先改需求文档 → 检查设计文档 → 改代码 |
| 设计变更 | 检查需求 → 先改设计文档 → 改代码 |
| Bug 修复/重构 | 直接改代码（不影响契约） |

### 7.2 Pending Docs

允许在编码时暂时打破"先文档后代码"规则，通过 `state.json.pendingDocs` 记录待补充的文档任务。

**规则**：必须在当次 Commit 前清空，不允许跨 Commit 累积。

> 具体格式见 `docs/requirements/process/state-management.spec.md`

---

## Appendix: Quick Reference <!-- id: spec_design_appendix -->

### A. Naming & Anchor

> 命名规范和锚点前缀见 [spec-meta.md §5-6](docs/specs/spec-meta.md#meta_directory)

### B. Frontmatter Template

```yaml
---
type: design
version: 1.0
inputs:
  - docs/requirements/features/fea-xxx.md#feat_xxx_intent
---
```

---

*Version: v2.6*
*Created: 2024-12-20 (v1.0)*
*Updated: 2025-12-27 (v2.6)*
*Changes: v2.6 消除与 spec-meta 的冗余，目录/命名/锚点引用 spec-meta；v2.5 新增 Dependencies 章节格式*
