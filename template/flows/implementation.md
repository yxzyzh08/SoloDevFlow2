# Implementation Flow - Execution Spec

> AI 执行规范：实现阶段的执行流程

**需求文档**：[flow-implementation.md](../../docs/requirements/flows/flow-implementation.md)

---

## 1. Entry Check

**进入实现阶段前检查**：

```
检查 Entry Criteria
    ├─ 设计已批准（Design Depth: Required）
    │     └─ 人类在 feature_review 阶段显式批准设计
    ├─ 或设计已跳过（Design Depth: None）
    │     └─ 需求文档 Artifacts 章节记录 Design Depth: None
    ├─ phase 已转换
    │     └─ feature_design → feature_implementation
    └─ 需求文档可用
          └─ 有明确的 Acceptance Criteria
```

---

## 2. Implementation Flow

### 2.1 PLAN（任务拆分）

1. 读取需求文档 Core Functions
2. 读取设计文档（如有）
3. 按依赖顺序拆分为 subtasks
4. 添加到 state.json（source: ai）
5. 标记第一个任务为 in_progress

**拆分原则**：

| 原则 | 说明 |
|------|------|
| **依赖顺序** | 被依赖的模块先实现 |
| **最小增量** | 每个任务产出可验证的增量 |
| **风险前置** | 高风险任务优先 |
| **独立可测** | 每个任务可独立测试 |

### 2.2 IMPLEMENT（循环实现）

**TDD 循环（推荐）**：

```
[Red] 编写失败的测试
    ↓
[Green] 编写最小代码使测试通过
    ↓
[Refactor] 重构代码，保持测试通过
    ↓
提交代码
    ↓
标记任务完成 → 下一任务
```

**代码编写规范**：

| 规范 | 说明 |
|------|------|
| 遵循设计 | 按设计文档的接口和数据模型实现 |
| 编码标准 | 遵循 spec-dev.md 规范 |
| 错误处理 | 完善的错误处理和日志 |
| 安全意识 | 避免 OWASP Top 10 漏洞 |

**提交规范**：

```
feat(module): 简短描述

- 详细说明1
- 详细说明2

Refs: #issue-number
```

### 2.3 INTEGRATE（集成验证）

```
运行完整测试套件
    ↓
检查代码覆盖率
    ↓
运行静态分析（如有）
    ↓
确认构建通过
```

**检查项**：

| 检查项 | 标准 |
|--------|------|
| 单元测试 | 全部通过 |
| 集成测试 | 全部通过 |
| 代码覆盖率 | 达到项目要求 |
| 构建 | 无错误、无警告 |
| Lint | 无违规 |

### 2.4 REVIEW（代码审查）

```
[AI 完成实现]
    ↓
[提示用户审核代码]
    ↓
[等待反馈]
    ├─ 批准 → set-phase <id> feature_testing
    ├─ 修改 → 根据反馈修改代码
    └─ 拒绝 → 重新设计或实现
```

---

## 3. Testing Scope（本阶段职责）

> 实现阶段负责**代码级测试**，系统级测试由 testing.md 负责

| 测试类型 | 范围 | 数量占比 |
|----------|------|----------|
| **单元测试** | 单个函数/方法 | 70%+ |
| **集成测试** | 模块间交互 | 20% |

**单元测试最佳实践**：
- 每个公开函数至少一个测试
- 测试边界条件和异常路径
- Mock 外部依赖
- 测试名称即文档

**集成测试关注点**：
- API 契约正确性
- 数据库操作
- 外部服务集成
- 错误传播和处理

---

## 4. AI Prompt Strategy

> 基于 Anthropic Claude Code Best Practices

| 场景 | Prompt 策略 |
|------|-------------|
| **新功能实现** | 一次一个函数，附带测试用例 |
| **复杂逻辑** | 先让 AI 解释设计，再写代码 |
| **Bug 修复** | 提供错误日志 + 相关代码上下文 |
| **重构** | 小步重构，每步运行测试 |

**最佳实践**：
- 将大任务拆分为小而聚焦的 prompt
- 一次只实现一个功能
- 使用 spec.md 保持上下文
- 让 AI 先解释再编码（复杂场景）

---

## 5. Self-Review Checklist

> 提交前自检清单

**代码质量**：
- [ ] 代码符合设计文档
- [ ] 测试覆盖核心路径
- [ ] 无明显性能问题
- [ ] 错误处理完善
- [ ] 代码可读（无魔法数字、有意义的命名）

**安全检查**：
- [ ] 无硬编码密钥
- [ ] 输入已验证
- [ ] 无 SQL 注入风险

**AI 辅助审查**：
- [ ] 已运行 AI 代码审查
- [ ] AI 发现的问题已处理

---

## 6. Execution Principles

### 始终做

- 进入实现前拆分任务到 subtasks
- TDD 循环：Red → Green → Refactor
- 每个任务完成后立即标记
- 集成验证通过后才进入审查
- 等待人类显式批准才进入测试

### 绝不做

- 跳过任务拆分直接编码
- 写大量代码后才运行测试
- 未经审核批准直接进入测试
- 忽略 lint 或构建警告
- 提交包含硬编码密钥的代码

---

## 7. Tools Reference

| 工具 | 用途 |
|------|------|
| `node scripts/state.js add-subtask <id> <description>` | 添加子任务 |
| `node scripts/state.js complete-subtask <id> <index>` | 完成子任务 |
| `node scripts/state.js set-phase <id> feature_testing` | 进入测试阶段 |

---

*Version: v1.0*
*Aligned with: flow-implementation.md v1.5*
*Updated: 2025-12-28*
