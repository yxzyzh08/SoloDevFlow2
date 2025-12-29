---
type: feature
id: input-capture
workMode: document
status: done
priority: P0
domain: process
version: "1.2"
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
- 关键输入识别规则（AI 原生能力）

### 2.2 Out of Scope

- 命令行记录工具（AI 直接编辑 input-log.md）
- session.pendingRequirements 集成（与 spark-box.md 功能重叠）
- 自动意图分类（依赖 Claude 原生能力）
- 输入内容的语义分析
- 多 Session 输入合并
- 输入日志的可视化展示

---

## 3. Core Functions <!-- id: feat_input_capture_functions -->

| ID | Function | 描述 |
|----|----------|------|
| I1 | 输入日志结构 | 定义 input-log.md 的格式和字段 |
| I2 | 关键输入识别 | 定义哪些输入需要记录（AI 原生能力） |

### 3.1 I1: 输入日志结构

**文件位置**：`.solodevflow/input-log.md`

**格式**：
```markdown
# 输入日志

> 记录人类所有关键输入，保留决策依据

---

## 记录

### {date} #{序号}

**原始输入**：
> {人类原话}

**类型**：{类别}

**阶段**：{当前流程阶段}

**归纳**：{AI 一句话总结}

---
```

**字段说明**：

| 字段 | 必填 | 说明 |
|------|------|------|
| date | 是 | 日期（YYYY-MM-DD） |
| 序号 | 是 | 当日序号（#1, #2, ...） |
| 原始输入 | 是 | 人类原话（blockquote 格式） |
| 类型 | 是 | 输入类别（见 3.2） |
| 阶段 | 是 | 当前流程阶段 |
| 归纳 | 是 | AI 一句话总结关键点 |

### 3.2 I2: 关键输入识别

**输入类别**：

| 类型 | 识别条件 | 示例 |
|------|----------|------|
| `需求` | 描述功能需求 | "登录页面需要支持手机号登录" |
| `决策` | 明确选择或决策 | "我们选择使用 JWT 而非 Session" |
| `反馈` | 对现有内容的反馈 | "这个方案太复杂了，简化一下" |
| `变更` | 修改已有内容 | "移除 Domain Spec 作为独立文档类型" |
| `灵光` | 突发想法或洞察 | "是不是可以用 MCP Server 来实现知识库" |

**识别规则**（AI 原生能力判断）：
1. 包含明确的需求描述 → 需求
2. 包含选择性词汇（"选择"、"使用"、"采用"、"同意"） → 决策
3. 包含评价词汇（"太复杂"、"不够"、"建议"） → 反馈
4. 包含修改词汇（"修改"、"删除"、"新增"、"移除"） → 变更
5. 包含探索词汇（"是不是可以"、"突然想到"） → 灵光

**记录方式**：AI 识别到关键输入后，直接编辑 `.solodevflow/input-log.md` 追加记录。

---

## 4. Acceptance Criteria <!-- id: feat_input_capture_acceptance -->

| Item | Verification | Pass Criteria |
|------|--------------|---------------|
| 日志文件结构 | 检查 `.solodevflow/input-log.md` | 符合定义的格式 |
| 关键输入识别 | AI 识别需求/决策/反馈/变更/灵光 | 正确分类并记录 |
| 记录持久化 | 检查 input-log.md | 关键输入已追加记录 |

---

## 5. Dependencies <!-- id: feat_input_capture_dependencies -->

| Dependency | Type | 说明 |
|------------|------|------|
| state-management | soft | 可选：从 state.json 读取当前阶段 |

---

## 6. Artifacts <!-- id: feat_input_capture_artifacts -->

| Type | Path | Description |
|------|------|-------------|
| Output | .solodevflow/input-log.md | 输入日志文件 |

**Design Depth**: None（规范型 Feature，无需设计文档）

---

## Changelog

- **v1.2** (2025-12-28): 简化需求，移除 log-input 命令和 pendingRequirements 集成，与实际实现对齐
- **v1.1** (2025-12-27): 初始版本

---

*Version: v1.2*
*Created: 2025-12-27*
*Updated: 2025-12-28*
