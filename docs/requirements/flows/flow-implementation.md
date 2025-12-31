---
type: flow
id: implementation-flow
workMode: document
status: done
priority: P0
domain: process
version: "1.0"
---

# Flow: Implementation <!-- id: flow_implementation -->

> 实现流程，将设计转化为可工作的代码

**Parent Flow**: [flow-workflows.md](flow-workflows.md) §6
**执行规范**：`.solodevflow/flows/implementation.md`
**编写规范**：[spec-execution-flow.md](../specs/spec-execution-flow.md)
> **重要**：AI 修改执行规范时，必须修改 `template/flows/implementation.md`（模板源），而非 `.solodevflow/flows/`（项目实例）。项目实例通过 `solodevflow upgrade .` 从模板同步。

---

## 1. Overview <!-- id: flow_implementation_overview -->

### 1.1 Purpose

将设计方案转化为高质量的代码实现：

| 职责 | 说明 |
|------|------|
| **代码编写** | 按设计文档实现功能 |
| **测试编写** | 编写单元测试和集成测试 |
| **持续集成** | 确保代码可构建、测试通过 |
| **代码质量** | 遵循编码规范、持续重构 |

### 1.2 Entry Criteria

| 条件 | 验证方式 |
|------|----------|
| 设计已批准（或跳过） | 人类在 `feature_review` 阶段显式批准（或 Design Depth: None） |
| phase 已转换 | `feature_design` → `feature_implementation` |
| 需求文档可用 | 有明确的 Acceptance Criteria |
| 设计文档可用（如需要） | Design Depth: Required 时 |

**Design Depth 判断标准**（详见 [flow-design.md#flow_design_steps](flow-design.md#flow_design_steps) §3.3）：

| Design Depth | 条件 | 进入实现方式 |
|--------------|------|-------------|
| **Required** | 涉及新模块、复杂算法、多子系统交互、NFR | 设计审批后进入 |
| **None** | 简单 CRUD、配置变更、复用现有模块 | 跳过设计直接进入 |

### 1.3 Exit Criteria

| 条件 | 验证方式 |
|------|----------|
| 功能实现完成 | 所有 Core Functions 已实现 |
| 测试通过 | 单元测试、集成测试通过 |
| 代码审查完成 | 人类审核代码质量 |
| phase 已更新 | phase = `feature_testing` |

---

## 2. Flow Diagram <!-- id: flow_implementation_diagram -->

```
[进入实现阶段]
    ↓
[PLAN] 拆分实现任务
    ↓
[IMPLEMENT] 循环实现
    │
    ├─ 选择任务
    │     ↓
    ├─ [TDD] 编写测试（Red）
    │     ↓
    ├─ 编写代码（Green）
    │     ↓
    ├─ 重构代码（Refactor）
    │     ↓
    ├─ 运行测试
    │     ↓
    └─ 标记完成 → 下一任务
    ↓
[INTEGRATE] 集成验证
    ↓
[REVIEW] 代码审查
    ↓
[phase → feature_testing]
```

---

## 3. Flow Steps <!-- id: flow_implementation_steps -->

### 3.1 Phase 1: PLAN（任务拆分）

**输入**：
- 需求文档（Core Functions）
- 设计文档（如有）

**动作**：
```
读取 Core Functions
    ↓
按依赖顺序拆分为子任务
    ↓
添加到 subtasks（source: ai）
    ↓
标记第一个任务为 in_progress
```

**拆分原则**：

| 原则 | 说明 |
|------|------|
| **依赖顺序** | 被依赖的模块先实现 |
| **最小增量** | 每个任务产出可验证的增量 |
| **风险前置** | 高风险任务优先 |
| **独立可测** | 每个任务可独立测试 |

### 3.2 Phase 2: IMPLEMENT（循环实现）

#### 3.2.1 TDD 循环（推荐）

```
[Red] 编写失败的测试
    ↓
[Green] 编写最小代码使测试通过
    ↓
[Refactor] 重构代码，保持测试通过
    ↓
提交代码
```

**TDD 最佳实践**：

| 实践 | 说明 |
|------|------|
| **小步增量** | 每次只关注一个行为 |
| **独立测试** | 测试之间不相互依赖 |
| **描述性命名** | 测试名称即文档 |
| **最小代码** | 只写通过测试所需的代码 |
| **持续重构** | 每个绿灯后考虑重构 |

#### 3.2.2 代码编写规范

| 规范 | 说明 |
|------|------|
| **遵循设计** | 按设计文档的接口和数据模型实现 |
| **编码标准** | 遵循 spec-dev.md 规范 |
| **错误处理** | 完善的错误处理和日志 |
| **安全意识** | 避免常见安全漏洞（OWASP Top 10） |

#### 3.2.3 提交规范

```
feat(module): 简短描述

- 详细说明1
- 详细说明2

Refs: #issue-number
```

**提交频率**：
- 每个小功能点一次提交
- 测试通过后立即提交
- 避免大范围变更的单次提交

### 3.3 Phase 3: INTEGRATE（集成验证）

**动作**：
```
运行完整测试套件
    ↓
检查代码覆盖率
    ↓
运行静态分析（如有）
    ↓
确认构建通过
```

**集成检查项**：

| 检查项 | 标准 |
|--------|------|
| 单元测试 | 全部通过 |
| 集成测试 | 全部通过 |
| 代码覆盖率 | 达到项目要求（如 80%） |
| 构建 | 无错误、无警告 |
| Lint | 无违规 |

### 3.4 CI/CD Integration

> 持续集成确保每次变更都能快速验证

| 触发点 | 自动化动作 | 说明 |
|--------|-----------|------|
| **代码提交** | 运行单元测试 | 快速反馈（< 5 分钟） |
| **PR 创建** | 完整测试套件 + Lint | 门禁检查 |
| **PR 合并** | 构建 + 部署到 staging | 验证集成 |
| **定时任务** | 完整回归测试 | 夜间运行 |

**Solo 开发者建议**：

| 项目规模 | CI/CD 策略 |
|----------|------------|
| Small | 手动运行测试即可 |
| Medium | 本地 pre-commit hook + 简单 CI |
| Large | 完整 CI/CD 流水线 |

### 3.5 Phase 4: REVIEW（代码审查）

**审查要点**：

| 维度 | 检查项 |
|------|--------|
| **正确性** | 是否符合需求和设计 |
| **可读性** | 代码是否清晰易懂 |
| **可维护性** | 是否易于修改和扩展 |
| **测试覆盖** | 关键路径是否有测试 |
| **安全性** | 是否有安全漏洞 |
| **性能** | 是否有明显性能问题 |

**审查结果**：
- **批准** → `set-phase <id> feature_testing`
- **修改** → 根据反馈修改代码
- **拒绝** → 重新设计或实现

---

## 4. Testing Strategy <!-- id: flow_implementation_testing -->

> **重要**：实现阶段负责**代码级测试**（单元测试、集成测试）。
> 系统级测试（E2E、性能、安全等）由 [flow-testing.md](flow-testing.md) 负责。

### 4.1 Test Scope

| 测试类型 | 阶段 | 规范来源 |
|----------|------|----------|
| **单元测试** | Implementation（本阶段） | spec-backend-dev / spec-frontend-dev |
| **集成测试** | Implementation（本阶段） | spec-backend-dev / spec-frontend-dev |
| E2E 测试 | Testing 阶段 | spec-test |
| 性能测试 | Testing 阶段 | spec-test |
| 安全测试 | Testing 阶段 | spec-test |

### 4.2 Test Pyramid（本阶段职责）

```
     /      \   Integration Tests（中等）
    /────────\
   /          \  Unit Tests（大量）
  /────────────\
```

### 4.3 Unit Testing

| 维度 | 说明 |
|------|------|
| **范围** | 单个函数/方法 |
| **目标** | 验证独立单元的正确性 |
| **特点** | 快速、独立、可重复 |
| **数量** | 大量（占总测试 70%+） |

**最佳实践**：
- 每个公开函数至少一个测试
- 测试边界条件和异常路径
- Mock 外部依赖
- 测试名称即文档

### 4.4 Integration Testing

| 维度 | 说明 |
|------|------|
| **范围** | 模块间交互 |
| **目标** | 验证模块协作正确性 |
| **特点** | 可能需要真实依赖（DB、API） |
| **数量** | 中等（占总测试 20%） |

**关注点**：
- API 契约正确性
- 数据库操作
- 外部服务集成
- 错误传播和处理

### 4.5 Test Coverage Guidelines

| 代码类型 | 覆盖要求 |
|----------|----------|
| 核心业务逻辑 | 100% |
| 工具函数 | 80%+ |
| 配置和胶水代码 | 可选 |

---

## 5. Solo Developer Considerations <!-- id: flow_implementation_solo -->

> 针对 Solo 开发者的实现流程优化

### 5.1 简化策略

| 场景 | 策略 |
|------|------|
| 小功能 | 直接实现，后补测试 |
| 中等功能 | TDD 核心路径，边缘后补 |
| 复杂功能 | 完整 TDD 流程 |

### 5.2 AI 协作

| AI 职责 | 人类职责 |
|---------|----------|
| 生成代码 | 审查代码质量 |
| 编写测试 | 验证测试覆盖 |
| 重构建议 | 确认重构方向 |
| 错误修复 | 验证修复正确性 |

### 5.3 自我监督

> "If nobody supervises you, you have to supervise yourself."

| 实践 | 说明 |
|------|------|
| **代码自审** | 提交前自我审查 |
| **测试先行** | 尽可能 TDD |
| **小步提交** | 频繁提交，易于回滚 |
| **持续集成** | 每次提交触发测试 |

### 5.4 AI Prompt Strategy

> 基于 [Anthropic Claude Code Best Practices](https://www.anthropic.com/engineering/claude-code-best-practices)

| 场景 | Prompt 策略 | 示例 |
|------|-------------|------|
| **新功能实现** | 一次一个函数，附带测试用例 | "实现 parseConfig 函数，包含边界测试" |
| **复杂逻辑** | 先让 AI 解释设计，再写代码 | "解释这个算法的设计思路，然后实现" |
| **Bug 修复** | 提供错误日志 + 相关代码上下文 | "这是错误日志和相关代码，定位并修复" |
| **重构** | 小步重构，每步运行测试 | "重构这个函数，保持测试通过" |

**最佳实践**：
- 将大任务拆分为小而聚焦的 prompt
- 一次只实现一个功能
- 使用 spec.md 保持上下文
- 让 AI 先解释再编码（复杂场景）

### 5.5 Self-Review Checklist

> Solo 开发者提交前自检清单

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

## 6. Error Handling <!-- id: flow_implementation_errors -->

### 6.1 常见问题

| 问题 | 应对策略 |
|------|----------|
| 测试失败 | 先修复测试再继续 |
| 设计不足 | 返回设计阶段补充 |
| 需求歧义 | 返回需求阶段澄清 |
| 技术障碍 | 记录到 Open Questions，寻求解决方案 |

### 6.2 中断恢复

```
Session 中断
    ↓
下次 Session 启动
    ↓
SessionStart Hook 显示 in_progress 的 subtasks
    ↓
继续未完成的任务
```

---

## 7. Participants <!-- id: flow_implementation_participants -->

| 参与方 | 职责 |
|--------|------|
| **User** | 审核代码、确认实现正确性 |
| **AI** | 编写代码、编写测试、重构 |
| **需求文档** | 验收标准来源 |
| **设计文档** | 实现依据 |
| **state.json** | 跟踪 subtasks |

---

## 8. Dependencies <!-- id: flow_implementation_dependencies -->

| Dependency | Type | 说明 |
|------------|------|------|
| flow-workflows | hard | 父流程，提供阶段路由 |
| flow-design | soft | 设计输入（如有） |
| flow-requirements | hard | 需求输入 |
| spec-dev | soft | 编码规范 |
| spec-test | soft | 测试规范 |

---

## 9. Acceptance Criteria <!-- id: flow_implementation_acceptance -->

| Item | Verification | Pass Criteria |
|------|--------------|---------------|
| 任务拆分 | 开始实现时 | 生成合理的 subtasks |
| TDD 循环 | 编写代码时 | Red-Green-Refactor 循环正确 |
| 测试覆盖 | 实现完成时 | 核心逻辑测试覆盖 |
| 集成验证 | 运行测试 | 全部测试通过 |
| 代码审查 | 人类审核 | 批准后 phase 正确转换 |
| 中断恢复 | Session 恢复 | 正确显示未完成任务 |

---

*Version: v1.5*
*Created: 2025-12-28*
*Updated: 2025-12-28*
*Changes: v1.5 添加执行规范引用；v1.4 添加 Design Depth 判断标准内联说明*
