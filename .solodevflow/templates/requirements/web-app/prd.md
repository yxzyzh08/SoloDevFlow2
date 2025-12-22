---
type: {project-type}
template: docs/templates/web-app/prd
version: 1.0
---

<!--
Project Types (项目类型枚举):
  - web-app: Web 应用（前端+后端）
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

## 4. Tech Stack <!-- id: prod_tech_stack -->

> Web 应用的技术选型

### 4.1 Frontend

| 技术 | 选择 | 说明 |
|------|------|------|
| Framework | {React/Vue/Angular/Svelte/...} | {选择理由} |
| State Management | {Redux/Vuex/Pinia/Zustand/...} | {选择理由} |
| Build Tool | {Vite/Webpack/Turbopack/...} | {选择理由} |
| UI Library | {Ant Design/Element/Tailwind/...} | {选择理由} |
| Language | {TypeScript/JavaScript} | {选择理由} |

### 4.2 Backend

| 技术 | 选择 | 说明 |
|------|------|------|
| Runtime | {Node.js/Python/Go/...} | {选择理由} |
| Framework | {Express/NestJS/FastAPI/Gin/...} | {选择理由} |
| Database | {PostgreSQL/MySQL/MongoDB/...} | {选择理由} |
| Cache | {Redis/Memcached/...} | {选择理由} |

### 4.3 Infrastructure

| 技术 | 选择 | 说明 |
|------|------|------|
| Hosting | {Vercel/AWS/Azure/...} | {选择理由} |
| CI/CD | {GitHub Actions/GitLab CI/...} | {选择理由} |

---

## 5. UI/UX Overview <!-- id: prod_ui_ux -->

> 用户界面和体验设计概述

### 5.1 Design System

| 元素 | 规范 |
|------|------|
| Primary Color | {#hex} |
| Font Family | {字体} |
| Spacing Unit | {8px/4px/...} |
| Border Radius | {4px/8px/...} |

### 5.2 Key Screens

| Screen | 描述 | 优先级 |
|--------|------|--------|
| {页面名} | {功能描述} | P0/P1/P2 |
| {页面名} | {功能描述} | P0/P1/P2 |

### 5.3 Responsive Breakpoints

| Breakpoint | Width | 说明 |
|------------|-------|------|
| Mobile | < 768px | 移动端适配 |
| Tablet | 768px - 1024px | 平板适配 |
| Desktop | > 1024px | 桌面端 |

### 5.4 Interaction Patterns

{交互规范说明：动画、过渡、反馈等}

---

## 6. Feature Roadmap <!-- id: prod_roadmap -->

<!-- 注意：Feature 状态由 state.json 统一管理，PRD 不记录状态 -->

### 6.1 Domain: {domain-name}

| Priority | Feature | Type | 说明 |
|----------|---------|------|------|
| P0 | {feature-name} | code/document | {功能描述} |
| P1 | {feature-name} | code/document | {功能描述} |

### 6.2 Domain: {domain-name}

| Priority | Feature | Type | 说明 |
|----------|---------|------|------|
| P0 | {feature-name} | code/document | {功能描述} |

### 6.3 Capabilities

| Capability | 说明 | 使用者 |
|------------|------|--------|
| {capability-name} | {一句话描述} | {Feature 列表} |

---

## 7. Success Criteria <!-- id: prod_success -->

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

*Version: v1.0*
*Created: {date}*
*Template: web-app*
