# Design Document Specification v2.1 <!-- id: spec_design -->

> 定义设计文档的结构、内容要素、编写标准

---

**重要声明**：

- 此规范定义设计文档的**具体章节结构**
- 元规范 `spec-meta.md` 定义文档类型和验证规则
- 需求文档规范见 `spec-requirements.md`
- **版本 v2.1**：Design Depth 为设计规范独有，由设计阶段决定并回填 Feature Spec

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

### 1.4 Directory Structure

```
docs/designs/
├── des-system-architecture.md    # 系统级架构设计
│
├── user-module/                   # 按模块组织
│   ├── des-architecture.md        # 用户模块架构
│   ├── des-api.md                 # 用户模块 API
│   └── des-data-model.md          # 用户数据模型
│
├── payment-module/                # 按模块组织
│   ├── des-architecture.md        # 支付模块架构
│   └── des-payment-gateway.md     # 支付网关设计
│
├── des-auth-capability.md         # 横向能力设计
│
└── des-order-fulfillment-flow.md  # 流程设计
```

**命名规范**：
- 系统级：`des-{descriptive-name}.md`
- 模块级：`{module}/des-{aspect}.md`
- 自由命名：反映设计的实际内容，不必与需求文档名称对应

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

### 3.1 Depth Levels

| 级别 | 名称 | 适用场景 | 文档内容 |
|------|------|----------|----------|
| L0 | 无设计 | 极简单功能，直接实现 | 无设计文档 |
| L1 | 轻量设计 | 简单功能，低风险 | Overview + 关键接口 |
| L2 | 标准设计 | 一般功能，中等复杂度 | 完整必选章节 |
| L3 | 详细设计 | 复杂功能，高风险 | 完整必选 + 可选章节 |

### 3.2 Depth Selection Criteria

**L0（无设计）**：功能极简单，可在半天内完成，失败可即时重做

**L1（轻量设计）**：功能逻辑简单，边界清晰，1-2 天完成

**L2（标准设计）**：有一定复杂度，涉及多模块协作，3-7 天完成

**L3（详细设计）**：功能复杂，有多种实现方案，涉及核心架构决策

### 3.3 Anti-patterns

| 反模式 | 说明 | 正确做法 |
|--------|------|----------|
| 过早抽象 | 为假想的未来需求设计接口 | 等到真正需要时再抽象 |
| 过度分层 | 为简单功能设计多层架构 | 先用最简单方案，必要时重构 |
| 文档膨胀 | L1 场景写 L3 级别文档 | 匹配实际复杂度 |

### 3.4 Design Depth Workflow

Design Depth 由设计阶段决定，而非需求阶段：

```
需求阶段                          设计阶段
    │                                │
    ▼                                ▼
Feature Spec                    设计 AI 评估复杂度
(Artifacts.designDepth = TBD)        │
    │                                ▼
    │                          决定 L0/L1/L2/L3
    │                                │
    │◄───────── 回填 ────────────────┤
    │                                │
    ▼                                ▼
Feature Spec                    编写设计文档
(Artifacts.designDepth = L2)    (按级别选择章节)
```

**设计 AI 职责**：
1. 读取 Feature Spec，分析功能复杂度
2. 根据 3.2 选择标准，决定 Design Depth
3. **回填** Feature Spec 的 `Artifacts.designDepth` 字段
4. 根据级别编写相应深度的设计文档

---

## 4. Design Structure <!-- id: spec_design_structure --> <!-- defines: design -->

| Section | Required | Anchor | Description |
|---------|----------|--------|-------------|
| Input Requirements | Yes | `design_{name}_input` | 声明输入来源（需求文档引用） |
| Overview | Yes | `design_{name}_overview` | 设计目标、约束条件 |
| Technical Approach | L2+ | `design_{name}_approach` | 技术方案、架构决策 |
| Interface Design | Yes | `design_{name}_interface` | 接口定义、数据结构 |
| Implementation Plan | L2+ | `design_{name}_impl` | 实现步骤、关键代码 |
| Alternatives | L3 | `design_{name}_alternatives` | 方案对比 |
| Risks | L3 | `design_{name}_risks` | 技术风险 |
| Dependencies | No | `design_{name}_dependencies` | 外部依赖 |

### 4.1 Input Requirements Section

设计文档必须声明其需求来源：

```markdown
## Input Requirements <!-- id: design_{name}_input -->

本设计基于以下需求：
- [PRD - 用户登录模块](docs/requirements/prd.md#feat_login)
- [Feature - 认证能力](docs/requirements/capabilities/cap-auth.md#cap_auth_intent)
```

### 4.2 Section Requirements by Depth

| Section | L1 | L2 | L3 |
|---------|:--:|:--:|:--:|
| Input Requirements | Yes | Yes | Yes |
| Overview | Yes | Yes | Yes |
| Technical Approach | - | Yes | Yes |
| Interface Design | Yes | Yes | Yes |
| Implementation Plan | - | Yes | Yes |
| Alternatives | - | - | Yes |
| Risks | - | - | Yes |

---

## 5. Design Review Checklist <!-- id: spec_design_checklist -->

**通用检查项**：
- [ ] 设计深度是否匹配功能复杂度？
- [ ] 是否有清晰的接口定义？
- [ ] 是否与需求文档一致？
- [ ] `inputs` 字段是否正确引用需求文档？

**L2/L3 额外检查项**：
- [ ] 是否考虑了错误处理？
- [ ] 是否有实现步骤？
- [ ] 技术方案是否合理？

**L3 额外检查项**：
- [ ] 是否评估了替代方案？
- [ ] 是否识别了技术风险？

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

### 6.4 Depth by Project Type

| 设计深度 | Backend | Web App | Mobile App |
|---------|---------|---------|------------|
| L0 | 简单 CRUD | 静态页面 | 单屏展示 |
| L1 | 基础 API | 简单交互 | 基础导航 |
| L2 | 多模块 API | 状态管理 | 原生集成 |
| L3 | 分布式系统 | 复杂状态 | 跨平台架构 |

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

允许在编码时暂时打破"先文档后代码"规则，但必须在 Commit 前清空：

| 场景 | 说明 |
|------|------|
| 实现倒逼设计 | 编码时发现必须修改接口才能跑通 |
| 快速热修复 | 通过对话直接修改代码细节 |

**规则**：必须在当次 Commit 前清空，不允许跨 Commit 累积。

---

## Appendix: Quick Reference <!-- id: spec_design_appendix -->

### A. Naming Convention

| 场景 | 格式 | 示例 |
|------|------|------|
| 系统级 | `des-{name}.md` | `des-system-architecture.md` |
| 模块级 | `{module}/des-{aspect}.md` | `user-module/des-api.md` |

### B. Anchor Prefix

| Prefix | Example |
|--------|---------|
| `design_` | `design_overview`, `design_api` |

### C. Frontmatter Template

```yaml
---
type: design
version: 1.0
inputs:
  - docs/requirements/features/fea-xxx.md#feat_xxx_intent
---
```

---

*Version: v2.1*
*Created: 2024-12-20 (v1.0)*
*Updated: 2025-12-23 (v2.1)*
*Changes: v2.0 与 spec-meta.md v2.1 对齐; v2.1 新增 Design Depth Workflow，明确设计阶段回填 Feature Spec*
