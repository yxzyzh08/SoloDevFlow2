---
type: feature
id: input-capture
workMode: document
status: not_started
priority: P0
domain: process
version: "1.1"
---

# Feature: Input Capture <!-- id: feat_input_capture -->

> 输入捕获机制，记录人类的关键输入和决策，防止需求变更时丢失上下文

---

## 1. Intent <!-- id: feat_input_capture_intent -->

### 1.1 Problem

- 人类在对话中提供的关键决策和澄清容易被遗忘
- Session 结束后，重要的输入信息难以追溯
- 需求变更时缺乏历史决策记录，无法了解"为什么这样设计"
- AI 无法主动记录人类的重要输入，依赖人工整理

### 1.2 Value

- **决策追溯**：记录关键决策，便于后续回顾
- **上下文保持**：跨 Session 保持重要信息
- **变更支持**：需求变更时可查阅历史决策
- **自动记录**：AI 主动识别并记录重要输入

---

## 2. Scope <!-- id: feat_input_capture_scope -->

### 2.1 In Scope (MVP)

- 输入日志文件结构定义（input-log.md）
- 关键输入识别规则
- 手动记录命令
- 与 state.json session 字段集成

### 2.2 Out of Scope

- 自动意图分类（依赖 Claude 原生能力）
- 输入内容的语义分析
- 多 Session 输入合并
- 输入日志的可视化展示

---

## 3. Core Functions <!-- id: feat_input_capture_functions -->

| ID | Function | 描述 |
|----|----------|------|
| I1 | 输入日志结构 | 定义 input-log.md 的格式和字段 |
| I2 | 关键输入识别 | 定义哪些输入需要记录 |
| I3 | 记录命令 | 提供手动记录输入的命令 |
| I4 | Session 集成 | 与 state.json session.pendingRequirements 集成 |

### 3.1 I1: 输入日志结构

**文件位置**：`.solodevflow/input-log.md`

**格式**：
```markdown
# Input Log

## {date}

### {timestamp} - {category}

**Context**: {当前 Feature / Session 模式}

**Input**:
{人类输入内容}

**Decision**:
{提取的关键决策}

**Tags**: {标签}
```

**字段说明**：

| 字段 | 必填 | 说明 |
|------|------|------|
| date | 是 | 日期分组（YYYY-MM-DD） |
| timestamp | 是 | 精确时间（HH:mm:ss） |
| category | 是 | 输入类别（见 3.2） |
| Context | 是 | 当前工作上下文 |
| Input | 是 | 原始输入内容 |
| Decision | 否 | 提取的关键决策点 |
| Tags | 否 | 便于搜索的标签 |

### 3.2 I2: 关键输入识别

**输入类别**：

| Category | 识别条件 | 示例 |
|----------|----------|------|
| `requirement` | 描述功能需求 | "登录页面需要支持手机号登录" |
| `decision` | 明确选择或决策 | "我们选择使用 JWT 而非 Session" |
| `clarification` | 澄清或补充说明 | "这里的用户是指注册用户，不包括游客" |
| `constraint` | 限制条件 | "必须在 2 秒内响应" |
| `feedback` | 对现有内容的反馈 | "这个方案太复杂了，简化一下" |

**识别规则**（AI 判断）：
1. 包含明确的需求描述
2. 包含选择性决策（"选择"、"使用"、"采用"）
3. 包含澄清词汇（"是指"、"不包括"、"具体来说"）
4. 包含约束词汇（"必须"、"不能"、"限制"）

### 3.3 I3: 记录命令

**Skill 触发**：当 AI 识别到关键输入时，自动记录

**手动记录**（可选）：
```bash
# 通过 state.js 记录
node scripts/state.js log-input "{category}" "{content}"
```

### 3.4 I4: Session 集成

**state.json session 字段**：

```json
{
  "session": {
    "mode": "delivering",
    "pendingRequirements": [
      {
        "id": "req_1703145600000",
        "content": "登录页面需要支持手机号登录",
        "category": "requirement",
        "capturedAt": "2024-12-21T12:00:00.000Z",
        "status": "pending"
      }
    ]
  }
}
```

**状态流转**：
- `pending`：待处理
- `processing`：正在处理
- `done`：已处理

---

## 4. Acceptance Criteria <!-- id: feat_input_capture_acceptance -->

| Item | Verification | Pass Criteria |
|------|--------------|---------------|
| 日志文件结构 | 检查 `.solodevflow/input-log.md` | 符合定义的格式 |
| 关键输入识别 | AI 识别需求输入 | 正确分类并记录 |
| 手动记录 | 运行 log-input 命令 | 记录写入日志文件 |
| Session 集成 | 检查 state.json | pendingRequirements 正确更新 |

---

## 5. Dependencies <!-- id: feat_input_capture_dependencies -->

| Dependency | Type | 说明 |
|------------|------|------|
| state-management | hard | 需要 state.json session 字段支持 |
| hooks-integration | soft | 可通过 UserPromptSubmit Hook 触发记录 |

---

## 6. Artifacts <!-- id: feat_input_capture_artifacts -->

| Type | Path | Description |
|------|------|-------------|
| Output | .solodevflow/input-log.md | 输入日志文件 |
| CLI | scripts/state.js log-input | 记录命令 |

**Design Depth**: None（规范型 Feature，无需设计文档）

---

*Version: v1.0*
*Created: 2025-12-27*
*Updated: 2025-12-27*
