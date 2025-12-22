# Feature: {Feature Name} <!-- id: feat_{name} -->

> {一句话功能描述}

---

## 1. Intent <!-- id: feat_{name}_intent -->

### 1.1 Problem

{解决什么问题}

### 1.2 Value

{为用户带来什么价值}

---

## 2. Core Capabilities <!-- id: feat_{name}_capabilities -->

### 2.1 Capability List

| ID | Capability | 描述 |
|----|------------|------|
| C1 | {能力名称} | {能力描述} |
| C2 | {能力名称} | {能力描述} |

### 2.2 Capability Details

#### C1: {Capability Name}

{详细描述}

**输入**：{输入说明}

**输出**：{输出说明}

**规则**：
- {规则1}
- {规则2}

---

## 3. Acceptance Criteria <!-- id: feat_{name}_acceptance -->

| Item | Verification | Pass Criteria |
|------|--------------|---------------|
| {验收项} | {验证方式} | {通过标准} |

---

## 4. Artifacts <!-- id: feat_{name}_artifacts -->

> 记录 Feature 的下游产物，用于影响分析和变更追踪。
> **注意**：此章节对于 code 类型 Feature 为必选，document 类型为可选。

| Type | Path | Required | Description |
|------|------|----------|-------------|
| Design | docs/{domain}/{name}.design.md | required 时必填 | 设计文档 |
| Code | src/{module}/ | Yes | 代码目录 |
| E2E Test | tests/e2e/{name}.test.ts | Yes | E2E 测试 |

**Design Depth**: none | required

- none: 简单、边界清晰、无架构决策，无需设计文档
- required: 需要架构决策、涉及多模块，需要设计文档（深度由设计规范指导）

---

<!-- Optional Sections -->

## UI Components <!-- id: feat_{name}_ui_components -->

> Web 应用特有：列出此 Feature 涉及的 UI 组件

| Component | 描述 | 复用/新建 |
|-----------|------|-----------|
| {组件名} | {组件功能} | 复用现有 / 新建 |
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

---

## User Stories <!-- id: feat_{name}_stories -->

### Story 1: {Story Title}

**As a** {用户角色}
**I want to** {期望行为}
**So that** {期望结果}

**Scenario**: {场景名}
- **Given**: {前置条件}
- **When**: {触发动作}
- **Then**: {期望结果}

---

## Boundaries <!-- id: feat_{name}_boundaries -->

### In Scope

- {包含内容}

### Out of Scope

- {不包含内容}

---

## Dependencies <!-- id: feat_{name}_dependencies -->

| Dependency | Type | 说明 |
|------------|------|------|
| {Feature/Capability} | {hard/soft} | {依赖说明} |

---

*Version: v1.0*
*Created: {date}*
*Updated: {date}*
