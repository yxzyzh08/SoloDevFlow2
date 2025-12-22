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

## 5. Design <!-- id: feat_{name}_design -->

### 5.1 {设计主题}

{技术设计内容}

---

## 6. Implementation Notes <!-- id: feat_{name}_impl -->

### 6.1 Related Files

| 文件 | 用途 |
|------|------|
| {文件路径} | {文件说明} |

### 6.2 Usage

{使用说明}

---

## 7. Artifacts <!-- id: feat_{name}_artifacts -->

> 记录 Feature 的下游产物，用于影响分析和变更追踪。
> 对于 code 类型为必选，document 类型为可选。
> **与 state.json 同步**：此处定义的产物路径需同步到 `state.json` 的 `artifacts` 字段。

| Type | Path | Required | Description |
|------|------|----------|-------------|
| Design | (内联于 Section 5) | required 时必填 | 设计内容（对应 `artifacts.design`） |
| Code | src/{module}/ | Yes | 代码目录（对应 `artifacts.code[]`） |
| Scripts | scripts/{name}.js | Optional | 脚本（document 类型用 `scripts` 字段） |
| E2E Test | tests/e2e/{name}.test.ts | Yes | E2E 测试（对应 `artifacts.tests[]`） |

**state.json 示例（code 类型）**：
```json
{
  "designDepth": "none",
  "artifacts": {
    "design": null,
    "code": ["src/{module}/"],
    "tests": ["tests/e2e/{name}.test.ts"]
  }
}
```

---

*Version: v1.0*
*Created: {date}*
*Updated: {date}*
