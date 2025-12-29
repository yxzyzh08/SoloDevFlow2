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

### 2.2 Must Follow Process Criteria

以下情况**必须**走需求变更流程，即使用户明确授权：

| 变更类型 | 示例 | 流程 |
|----------|------|------|
| 数据结构变更 | 修改 state.json/index.json schema | 需求 → 审核 → 实现 |
| API/命令接口变更 | 添加/删除/修改命令行参数 | 需求 → 审核 → 实现 |
| 删除现有功能 | 删除 byType、删除命令别名 | 需求 → 审核 → 实现 |
| 添加新功能 | 新增 Hook、新增验证规则 | 需求 → 审核 → 实现 |

**不需要走流程**：
| 变更类型 | 示例 |
|----------|------|
| Bug 修复 | 修复空指针、修复边界条件 |
| 代码重构 | 重命名变量、提取函数（不改变行为）|
| 文档更新 | 修复错别字、补充说明 |

**关键判断**：
```
用户说"删除 X" → 是否改变系统行为/接口？
  ├─ 是 → 必须走流程（即使用户明确授权）
  └─ 否 → 可以直接执行
```

### 2.3 Phase-Based Routing

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
| `done` | Write/Edit `src/**/*`, `scripts/**/*` (ask 确认) |

---

## 7. Bug Fix Flow

**Bug 修复流程**（适用于 status=done 的 Feature）：

```
发现 Bug
    ↓
根因分析（Root Cause Analysis）
    ↓
判断根因类型
    ├─ 需求问题 → 修改需求文档 → feature_requirements → feature_review
    ├─ 设计问题 → 修改设计文档 → feature_design → feature_review
    └─ 实现问题 → 直接修复代码（无需修改文档）
```

### 7.1 根因类型判断

| 根因类型 | 特征 | 处理方式 |
|----------|------|----------|
| **需求问题** | 需求描述不清、遗漏、矛盾 | 先更新需求文档 |
| **设计问题** | 设计方案有缺陷、接口定义错误 | 先更新设计文档 |
| **实现问题** | 代码逻辑错误，但需求和设计正确 | 直接修复代码 |

### 7.2 示例

| Bug | 根因分析 | 处理 |
|-----|----------|------|
| "用户名可以为空" | 需求未规定非空验证 → 需求问题 | 更新需求文档 |
| "API 返回格式不一致" | 设计文档接口定义有歧义 → 设计问题 | 更新设计文档 |
| "数组越界" | 代码边界条件处理错误 → 实现问题 | 直接修复代码 |

### 7.3 Hook 行为

当修改 done 状态 Feature 的代码时，PreToolUse Hook 会弹出确认：
- 提醒进行根因分析
- 用户确认后允许修改
- 这是软性引导，不强制阻止

---

## 8. Execution Principles

### 始终做

- 每次输入 → 先分析输入类型
- 直接执行 → 立即执行，不走流程
- 进入子流程 → 加载对应执行规范
- 状态更新 → 通过 State CLI
- 文档变更 → 运行 index.js
- Bug 修复 → 先进行根因分析

### 绝不做

- 跳过输入分析直接执行
- 将复杂问题错判为"直接执行"
- 跳过 review 阶段
- 未经人类批准更新 phase
- 直接编辑 state.json
- 跳过根因分析直接修复 done 状态的代码

---

## 9. Tools Reference

| 工具 | 用途 |
|------|------|
| `node scripts/state.js summary` | 获取状态摘要 |
| `node scripts/state.js set-phase <id> <phase>` | 更新阶段 |
| `node scripts/state.js activate <id>` | 激活 Work Item (v14.0) |
| `node scripts/state.js deactivate <id>` | 取消激活 Work Item (v14.0) |
| `node scripts/index.js` | 更新索引 |

---

*Version: v1.2.1*
*Aligned with: flow-workflows.md v8.2, fea-hooks-integration.md v1.5*
*Updated: 2025-12-29*

---

## Changelog

### v1.2.1 (2025-12-29)
- 对齐 fea-hooks-integration v1.5：意图检测机制通过 UserPromptSubmit Hook 实现
- §2.2 定义"什么需要走流程"，H8 实现"如何检测"

### v1.2 (2025-12-29)
- 新增 §2.2 Must Follow Process Criteria：明确定义必须走流程的变更类型
- 修复工作流设计缺陷：防止 AI 在用户明确授权时跳过需求流程

### v1.1 (2025-12-28)
- 新增 §7 Bug Fix Flow：根因分析流程
- 更新 §6 Phase Guards：添加 done 状态守卫
- 更新 §8 Execution Principles：添加根因分析相关原则

### v1.0 (2025-12-28)
- 初始版本
