# Workflows - Execution Spec

> AI 执行规范：主工作流的执行流程

**需求文档**：[flow-workflows.md](../../docs/requirements/flows/flow-workflows.md)

---

## 1. Session Start

**每次对话开始**：

```
读取 state.json / index.json
    ↓
汇报状态
    ├─ 当前聚焦 Feature
    ├─ 当前 phase
    ├─ 进行中的 subtasks
    └─ 待处理文档（pendingDocs）
    ↓
等待用户指示
```

---

## 2. Input Analysis

**每次接收用户输入**：

```
用户输入
    ↓
意图识别
    ├─ 直接执行 → 立即执行，不走流程
    ├─ 产品咨询 → §3 Consulting
    ├─ 需求处理 → 加载 requirements.md
    ├─ 设计处理 → 加载 design.md
    ├─ 实现处理 → 加载 implementation.md
    ├─ 测试处理 → 加载 testing.md
    ├─ 审核批准 → §4 Review Approval
    └─ 无关想法 → 直接拒绝
```

### 2.1 Direct Execution Criteria

| 条件 | 说明 |
|------|------|
| ✅ 范围明确 | 单步操作可完成 |
| ✅ 不涉及设计变更 | 无需更新文档 |
| ✅ 可直接定位 | 问题明确（如"修复第42行空指针"） |

**边界场景**：
- "修复登录问题" → ❌ 不是直接执行（问题不明确）
- "修复 login.js 第42行空指针" → ✅ 直接执行

### 2.2 Phase-Based Routing

| 当前 Phase | 默认路由 |
|------------|----------|
| `feature_requirements` | requirements.md |
| `feature_review` | §4 Review Approval |
| `feature_design` | design.md |
| `feature_implementation` | implementation.md |
| `feature_testing` | testing.md |

---

## 3. Consulting Flow

**咨询交付流程**：

```
用户咨询
    ↓
加载 PRD + 相关文档
    ↓
生成回答
    ↓
检查是否包含需求成分
    ├─ 是 → 询问是否处理需求
    └─ 否 → 等待下一输入
```

**混合输入处理**：
1. 先回答咨询
2. 再询问："刚才提到 xxx，是否现在处理这个需求？"
3. 用户选择 → 进入需求流程或继续等待

---

## 4. Review Approval Flow

**审核审批流程**：

```
AI 完成文档
    ↓
set-phase <id> feature_review
    ↓
提示用户审核
    ↓
等待反馈
    ├─ 批准 → set-phase <id> 下一阶段
    ├─ 修改 → AI 修改后重新审核
    └─ 拒绝 → 返回上一阶段
```

**批准语法**：

| 类型 | 关键词 |
|------|--------|
| 批准 | "批准"、"通过"、"同意"、"approve" |
| 修改 | "修改 xxx"、"补充 xxx" |
| 拒绝 | "重新来"、"需求不对" |

### 4.1 Review Assistance（可选）

人类可主动调用辅助工具进行深度审核：

| 辅助工具 | 用途 | 触发方式 |
|----------|------|----------|
| **review-assistant** | AI 辅助审核需求文档 | 人类主动调用 |

---

## 5. Phase Lifecycle

```
pending → feature_requirements → feature_review → feature_design → feature_implementation → feature_testing → done
```

| 阶段 | 主要职责 |
|------|----------|
| `feature_requirements` | 编写需求文档 |
| `feature_review` | 人类审核文档 |
| `feature_design` | 编写设计文档 |
| `feature_implementation` | 编写代码 + 单元测试 + 集成测试 |
| `feature_testing` | 系统级测试（E2E/性能/安全/回归） |

---

## 6. Phase Guards

| Phase | 阻止的操作 |
|-------|------------|
| `feature_requirements` | Write/Edit `src/**/*`, `tests/**/*` |
| `feature_review` | Write/Edit `docs/designs/**/*`, `src/**/*` |
| `feature_design` | Write/Edit `src/**/*`, `tests/**/*` |

---

## 7. Execution Principles

### 始终做

- 每次输入 → 先分析输入类型
- 直接执行 → 立即执行，不走流程
- 进入子流程 → 加载对应执行规范
- 状态更新 → 通过 State CLI
- 文档变更 → 运行 index.js

### 绝不做

- 跳过输入分析直接执行
- 将复杂问题错判为"直接执行"
- 跳过 review 阶段
- 未经人类批准更新 phase
- 直接编辑 state.json

---

## 8. Tools Reference

| 工具 | 用途 |
|------|------|
| `node scripts/state.js summary` | 获取状态摘要 |
| `node scripts/state.js set-phase <id> <phase>` | 更新阶段 |
| `node scripts/state.js activate-feature <id>` | 激活 Feature |
| `node scripts/state.js deactivate-feature <id>` | 取消激活 Feature |
| `node scripts/index.js` | 更新索引 |

---

*Version: v1.0*
*Aligned with: flow-workflows.md v8.2*
*Updated: 2025-12-28*
