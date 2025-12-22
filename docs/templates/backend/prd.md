---
type: {project-type}
template: docs/templates/backend/prd
version: 1.0
---

<!--
Project Types (项目类型枚举):
  - web-app: Web 应用
  - cli-tool: 命令行工具
  - backend: 纯后端系统
  - library: 库/SDK
  - api-service: API 服务
  - mobile-app: 移动应用
-->

# {Product Name} <!-- id: prod_{name} -->

> {一句话产品定义}

---

## 1. Product Vision <!-- id: prod_vision -->

### 1.1 Core Value

{产品解决什么问题，为谁创造什么价值}

### 1.2 Target State

{产品最终要达到的状态}

### 1.3 Core Characteristics <!-- optional -->

| 特征 | 说明 |
|------|------|
| {特征1} | {描述} |
| {特征2} | {描述} |

<!-- 可根据产品特性添加自定义章节，如：
     - Human-AI Collaboration（人机协作产品）
     - Platform Architecture（平台类产品）
     - Integration Model（集成类产品）
-->

---

## 2. Target Users <!-- id: prod_users -->

### 2.1 User Profile

| 属性 | 描述 |
|------|------|
| 角色 | {用户角色} |
| 特征 | {关键特征} |
| 痛点 | {核心痛点} |

### 2.2 User Needs

{用户需要什么}

---

## 3. Product Description <!-- id: prod_description -->

### 3.1 High Level Overview

{产品功能概述}

### 3.2 Domain Structure

| Domain | 职责 | 包含 Feature |
|--------|------|--------------|
| {domain-name} | {职责描述} | {Feature 列表} |

---

## 4. Feature Roadmap <!-- id: prod_roadmap -->

> Feature 状态由 state.json 统一管理，PRD 不记录状态。Feature 之间的依赖关系定义在各 Feature Spec 的 Dependencies 章节。

### 4.1 Domain: {domain-name} <!-- id: domain_{domain_name} -->

{Domain 简述（1-2 句话）}

#### {feature-name} <!-- id: feat_ref_{feature_name} -->

{Feature 高层次描述（2-3 句话），解释核心价值和解决的问题}

**元信息**：
- **Priority**: P0/P1/P2
- **Type**: code / document
- **Feature Spec**: [{feature-name}.spec.md](docs/{domain}/{feature-name}.spec.md)

#### {another-feature} <!-- id: feat_ref_{another_feature} -->

{Feature 高层次描述}

**元信息**：
- **Priority**: P0/P1/P2
- **Type**: code / document
- **Feature Spec**: [{another-feature}.spec.md](docs/{domain}/{another-feature}.spec.md)

### 4.2 Domain: {domain-name} <!-- id: domain_{another_domain} -->

{Domain 简述}

#### {feature-name} <!-- id: feat_ref_{feature_name} -->

{Feature 高层次描述}

**元信息**：
- **Priority**: P0
- **Type**: code / document
- **Feature Spec**: [{feature-name}.spec.md](docs/{domain}/{feature-name}.spec.md)

### 4.3 Capabilities

横向能力，跨多个 Feature 的公共功能。

| Capability | 说明 | 使用者 |
|------------|------|--------|
| {capability-name} | {一句话描述} | {Feature 列表} |

---

## 5. Success Criteria <!-- id: prod_success -->

| Criteria | Metric | Target |
|----------|--------|--------|
| {成功标准} | {度量方式} | {目标值} |

---

<!-- Optional Sections -->

## Non-Goals <!-- id: prod_non_goals -->

{明确不做什么}

---

## Core Flow <!-- id: prod_flow -->

```
{核心业务流程图}
```

---

## Appendix <!-- id: prod_appendix -->

### Glossary

| Term | Definition |
|------|------------|
| {术语} | {定义} |

---

*Version: v1.2*
*Created: {date}*
*Updated: {date}*
*Changes: v1.1 移除状态列，添加 Type 列（状态由 state.json 管理）; v1.2 Feature Roadmap 改为子章节形式，每个 Feature 有独立锚点（feat_ref_前缀）*
