# Feature: {Feature Name} <!-- id: feat_{name} -->

> {一句话功能描述}

**Feature Type**: code | document
**Design Depth**: none | required（适用于简单 Feature）

---

## 1. Intent <!-- id: feat_{name}_intent -->

### 1.1 Problem

{解决什么问题}

### 1.2 Value

{为用户带来什么价值}

---

## 2. Scope <!-- id: feat_{name}_scope -->

### 2.1 In Scope

- {包含内容}

### 2.2 Out of Scope

- {不包含内容}

---

## 3. Core Capabilities <!-- id: feat_{name}_capabilities -->

| ID | Capability | 描述 |
|----|------------|------|
| C1 | {能力名称} | {能力描述} |
| C2 | {能力名称} | {能力描述} |

---

## 4. Acceptance Criteria <!-- id: feat_{name}_acceptance -->

| Item | Verification | Pass Criteria |
|------|--------------|---------------|
| {验收项} | {验证方式} | {通过标准} |

---

## Dependencies <!-- id: feat_{name}_dependencies -->（可选）

| Dependency | Type | 说明 |
|------------|------|------|
| {Feature/Capability/资源} | {hard/soft} | {依赖原因} |

**依赖类型**：
- `hard`：必须先完成，阻塞当前 Feature
- `soft`：建议参考，不阻塞

---

## 5. Screen Adaptation <!-- id: feat_{name}_screen -->（可选）

> 移动应用特有：屏幕适配要求

| 设备类型 | 支持 | 特殊处理 |
|----------|------|----------|
| Phone | Yes | 基准设计 |
| Tablet | Yes/No | {说明} |

---

## 6. Design <!-- id: feat_{name}_design -->

### 6.1 {设计主题}

{技术设计内容}

---

## 7. Implementation Notes <!-- id: feat_{name}_impl -->

### 7.1 Related Files

| 文件 | 用途 |
|------|------|
| {文件路径} | {文件说明} |

### 7.2 Usage

{使用说明}

---

## 8. Artifacts <!-- id: feat_{name}_artifacts -->

> 记录 Feature 的下游产物，用于影响分析和变更追踪。
> 对于 code 类型为必选，document 类型为可选。

| Type | Path | Required | Description |
|------|------|----------|-------------|
| Design | (内联于 Section 6) | required 时必填 | 设计内容 |
| Code | src/{module}/ | Yes | 代码目录（code 类型） |
| Scripts | scripts/{name}.js | Optional | 脚本（document 类型） |
| E2E Test | tests/e2e/{name}.test.ts | Yes | E2E 测试（code 类型） |

---

*Version: v1.0*
*Created: {date}*
*Updated: {date}*
