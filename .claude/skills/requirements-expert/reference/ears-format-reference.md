# EARS Format Reference

> EARS (Easy Approach to Requirements Syntax) 需求格式参考

---

## Overview

EARS 是一种结构化的需求编写方法，通过固定语法模式消除需求歧义，使需求可测试、可验证。

---

## 1. Five Patterns（五种模式）

### 1.1 Ubiquitous（始终成立）

**语法**：
```
THE {system} SHALL {action}
```

**适用场景**：系统始终满足的要求，无触发条件

**示例**：
- THE system SHALL encrypt all user passwords
- THE system SHALL log all API requests
- THE system SHALL validate input before processing

---

### 1.2 Event-Driven（事件驱动）

**语法**：
```
WHEN {trigger} THE {system} SHALL {action}
```

**适用场景**：由特定事件触发的行为

**示例**：
- WHEN user clicks submit button THE system SHALL validate the form
- WHEN session expires THE system SHALL redirect to login page
- WHEN file upload completes THE system SHALL send confirmation email

---

### 1.3 Conditional（条件触发）

**语法**：
```
IF {condition} THEN THE {system} SHALL {action}
```

**适用场景**：在特定条件下的行为

**示例**：
- IF user is admin THEN THE system SHALL show admin panel
- IF cart total exceeds $100 THEN THE system SHALL apply free shipping
- IF password is incorrect 3 times THEN THE system SHALL lock account

---

### 1.4 State-Driven（状态驱动）

**语法**：
```
WHILE {state} THE {system} SHALL {action}
```

**适用场景**：在特定状态持续期间的行为

**示例**：
- WHILE connection is lost THE system SHALL queue messages locally
- WHILE user is editing THE system SHALL auto-save every 30 seconds
- WHILE system is in maintenance mode THE system SHALL reject new requests

---

### 1.5 Complex（复合条件）

**语法**：
```
WHEN {trigger} IF {condition} THEN THE {system} SHALL {action}
```

**适用场景**：事件触发 + 条件判断的组合

**示例**：
- WHEN user submits form IF all fields are valid THEN THE system SHALL save data
- WHEN payment is received IF order is pending THEN THE system SHALL update order status
- WHEN user requests data IF user has permission THEN THE system SHALL return data

---

## 2. Keywords Reference（关键词参考）

| 关键词 | 含义 | 用法 |
|--------|------|------|
| **SHALL** | 必须（强制要求） | 核心功能需求 |
| **SHOULD** | 应该（建议要求） | 非核心但重要 |
| **MAY** | 可以（可选要求） | 可选功能 |
| **WHEN** | 当...时（事件触发） | 事件驱动模式 |
| **IF** | 如果（条件） | 条件/复合模式 |
| **WHILE** | 当...期间（状态） | 状态驱动模式 |
| **THEN** | 那么（结果） | 条件/复合模式 |

---

## 3. Anti-patterns（反模式）

| 错误写法 | 问题 | 正确写法 |
|----------|------|----------|
| "System should be fast" | 模糊，无法验证 | "System SHALL respond within 2 seconds" |
| "User-friendly interface" | 主观，无标准 | "System SHALL follow design spec v1.2" |
| "Support various formats" | 不明确 | "System SHALL support JSON, XML, CSV formats" |
| "Handle errors gracefully" | 不具体 | "WHEN error occurs THE system SHALL log error and show user-friendly message" |
| "System should be secure" | 太泛 | "System SHALL encrypt data using AES-256" |

---

## 4. Quality Checklist（质量检查）

每条需求应满足：

- [ ] **Singular**：一条需求描述一件事
- [ ] **Verifiable**：可以测试验证
- [ ] **Complete**：条件/触发器完整
- [ ] **Consistent**：与其他需求无冲突
- [ ] **Unambiguous**：只有一种理解方式
- [ ] **Traceable**：可追溯到业务目标

---

## 5. Conversion Examples（转换示例）

### 自然语言 → EARS 格式

**原始需求**："用户登录后应该能看到仪表盘"

**分析**：
- 触发条件：用户登录成功
- 行为：显示仪表盘

**EARS 格式**：
```
WHEN user login succeeds THE system SHALL display the dashboard
```

---

**原始需求**："管理员可以删除用户"

**分析**：
- 条件：用户是管理员
- 行为：允许删除用户

**EARS 格式**：
```
IF user role is admin THEN THE system SHALL allow user deletion
```

---

**原始需求**："离线时应该保存数据到本地"

**分析**：
- 状态：离线
- 行为：本地保存

**EARS 格式**：
```
WHILE device is offline THE system SHALL save data to local storage
```

---

## 6. Integration with Acceptance Criteria（与验收标准集成）

EARS 需求可直接转换为 Given-When-Then 验收标准：

**EARS 需求**：
```
WHEN user submits form IF all fields are valid THEN THE system SHALL save data
```

**验收标准**：
```
Given user has filled all required fields correctly
When user clicks submit button
Then system saves the data to database
And system shows success message
```

---

## 7. Template for SoloDevFlow

在 Feature Spec 中使用 EARS 格式：

```markdown
## Core Requirements

### Functional Requirements

| ID | Requirement (EARS Format) | Priority |
|----|---------------------------|----------|
| FR-001 | WHEN user clicks login THE system SHALL validate credentials | P0 |
| FR-002 | IF credentials are valid THEN THE system SHALL create session | P0 |
| FR-003 | IF credentials are invalid THEN THE system SHALL show error message | P0 |

### Non-Functional Requirements

| ID | Requirement (EARS Format) | Priority |
|----|---------------------------|----------|
| NFR-001 | THE system SHALL respond to login request within 2 seconds | P1 |
| NFR-002 | THE system SHALL encrypt password using bcrypt | P0 |
```
