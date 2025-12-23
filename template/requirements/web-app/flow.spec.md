# Flow: {Flow Name} <!-- id: flow_{name} -->

> {一句话流程描述}

---

## 1. Flow Overview <!-- id: flow_{name}_overview -->

### 1.1 Purpose

{流程目的，解决什么业务问题}

### 1.2 Trigger

{流程触发条件}

| 触发方式 | 说明 |
|----------|------|
| {用户操作/系统事件/定时任务} | {触发条件描述} |

---

## 2. Participants <!-- id: flow_{name}_participants -->

| Participant | Type | 职责 |
|-------------|------|------|
| {domain/feature/external} | Domain/Feature/External | {在流程中的职责} |

---

## 3. Flow Steps <!-- id: flow_{name}_steps -->

### 3.1 Main Flow

```
{触发} → {步骤1} → {步骤2} → ... → {结果}
```

| Step | 执行者 | 动作 | 输出 |
|------|--------|------|------|
| 1 | {participant} | {动作描述} | {输出} |
| 2 | {participant} | {动作描述} | {输出} |

### 3.2 Branches

| 条件 | 分支流程 |
|------|----------|
| {条件描述} | {分支步骤} |

### 3.3 Exception Handling

| 异常 | 处理方式 |
|------|----------|
| {异常场景} | {处理方式} |

---

## 4. Acceptance Criteria <!-- id: flow_{name}_acceptance -->

| Item | Verification | Pass Criteria |
|------|--------------|---------------|
| {验收项} | {验证方式} | {通过标准} |

---

<!-- Optional Sections -->

## Flow Diagram <!-- id: flow_{name}_diagram -->

```
{流程图，使用 ASCII 或 Mermaid}
```

---

## Error Handling <!-- id: flow_{name}_errors -->

### Error 1: {Error Name}

**触发条件**：{条件}

**处理流程**：
1. {步骤1}
2. {步骤2}

**恢复策略**：{如何恢复}

---

## Constraints <!-- id: flow_{name}_constraints -->

| Type | Constraint | 说明 |
|------|------------|------|
| Performance | {约束} | {说明} |
| Timing | {约束} | {说明} |

---

*Version: v1.0*
*Created: {date}*
*Updated: {date}*
