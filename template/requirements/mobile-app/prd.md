---
type: {project-type}
template: docs/templates/mobile-app/prd
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

## 4. Platform Support <!-- id: prod_platform -->

> 移动应用特有：平台支持说明

### 4.1 Target Platforms

| 平台 | 支持 | 最低版本 | 说明 |
|------|------|----------|------|
| iOS | Yes/No | iOS {版本} | {说明} |
| Android | Yes/No | Android {版本} (API {level}) | {说明} |

### 4.2 Development Approach

**选择方案**：{Native / Cross-platform / Hybrid}

| 方案 | 技术 | 说明 |
|------|------|------|
| Native | Swift (iOS) + Kotlin (Android) | 最佳性能，开发成本高 |
| Cross-platform | React Native / Flutter | 一套代码，接近原生体验 |
| Hybrid | Capacitor / Cordova | Web 技术，功能受限 |

**选择理由**：
- {理由1}
- {理由2}

### 4.3 Tech Stack

| 技术 | 选择 | 说明 |
|------|------|------|
| Framework | {React Native/Flutter/Swift/Kotlin/...} | {选择理由} |
| State Management | {Redux/Provider/Riverpod/...} | {选择理由} |
| Navigation | {React Navigation/GoRouter/...} | {选择理由} |
| Backend API | {REST/GraphQL/...} | {选择理由} |

---

## 5. Device Compatibility <!-- id: prod_device -->

> 移动应用特有：设备兼容性要求

### 5.1 Screen Sizes

| 设备类型 | 屏幕尺寸 | 支持 | 说明 |
|----------|----------|------|------|
| Phone (Small) | 4.7" - 5.4" | Yes/No | {说明} |
| Phone (Regular) | 5.5" - 6.1" | Yes | 主要目标设备 |
| Phone (Large) | 6.2" - 6.9" | Yes | {说明} |
| Tablet | 7" - 12.9" | Yes/No | {说明} |

### 5.2 Orientation Support

| 方向 | 支持 | 说明 |
|------|------|------|
| Portrait | Yes | 主要模式 |
| Landscape | Yes/No | {说明} |

### 5.3 Performance Requirements

| 指标 | 目标值 | 说明 |
|------|--------|------|
| App Size | < {x} MB | 安装包大小 |
| Cold Start | < {x} s | 冷启动时间 |
| Memory Usage | < {x} MB | 运行内存 |
| Battery | {描述} | 电池消耗要求 |

### 5.4 Offline Support

| 功能 | 离线支持 | 说明 |
|------|----------|------|
| {功能1} | Yes/Partial/No | {说明} |
| {功能2} | Yes/Partial/No | {说明} |

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

## App Store Requirements <!-- id: prod_app_store -->

> 应用商店发布要求

### iOS App Store

| 要求 | 状态 | 说明 |
|------|------|------|
| Apple Developer Account | {Ready/Pending} | {说明} |
| App Review Guidelines | {Compliant} | {说明} |

### Google Play Store

| 要求 | 状态 | 说明 |
|------|------|------|
| Developer Account | {Ready/Pending} | {说明} |
| Content Rating | {等级} | {说明} |

---

## Appendix <!-- id: prod_appendix -->

### Glossary

| Term | Definition |
|------|------------|
| {术语} | {定义} |

---

*Version: v1.0*
*Created: {date}*
*Template: mobile-app*
