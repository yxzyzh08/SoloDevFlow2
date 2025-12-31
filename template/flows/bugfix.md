<!--
  Template Source File
  修改此文件后，需要通过升级脚本同步到项目的 .solodevflow/flows/
  请勿直接修改 .solodevflow/flows/ 中的文件
-->

# Bug Fix Flow - Execution Spec

> AI 执行规范：Bug 修复流程（代码优先，后补文档）

**需求文档**：[flow-workflows.md §5](../../docs/requirements/flows/flow-workflows.md#5-bug-fix-flow----id-flow_bugfix--)

---

## 1. Bug Source Classification

| 来源 | 特征 | 处理优先级 |
|------|------|------------|
| **开发中发现** | 在 implementation/testing 阶段发现 | 立即处理，不切换 Work Item |
| **已完成功能** | status=done 的 Work Item 出现问题 | 修复代码 → 补充文档 |
| **用户报告** | 外部用户反馈的问题 | 创建新 Work Item 或关联现有 |

---

## 2. Bug Fix Decision Flow

```
[报告/发现 Bug]
    ↓
[问题定位]
    ├─ 能直接定位（文件+行号明确）→ 直接修复（§3）
    └─ 不能直接定位（问题模糊）
            ↓
        [分析问题，明确范围]
            ↓
        [判断影响范围]
            ├─ 单文件/局部 → 直接修复（§3）
            └─ 跨模块/系统性 → 需求变更流程
```

---

## 3. Code-First Fix Flow

> 核心原则：先修复代码，再补充文档

```
Step 1: 问题复现
    └─ 明确触发条件和错误现象

Step 2: 定位问题代码
    └─ 确定出错的文件和函数

Step 3: 修复代码
    └─ 编写修复代码 + 验证测试

Step 4: 文档同步（§4）
    └─ 分析是否需要更新设计/需求文档
```

---

## 4. Post-Fix Documentation Sync

> 代码修复后，分析是否需要同步文档

### 4.1 Decision Flow

```
[代码修复完成]
    ↓
[分析：是否需要更新设计文档？]
    ├─ 是（接口变更、架构调整）→ 直接更新设计文档
    └─ 否 → 继续
    ↓
[分析：是否需要更新需求文档？]
    ├─ 是（功能变更、新增约束）→ 走需求变更流程
    └─ 否 → 完成
```

### 4.2 Document Update Criteria

| 文档类型 | 需要更新的情况 | 处理方式 |
|----------|----------------|----------|
| **设计文档** | 接口定义变更、数据结构调整、架构修改 | 直接更新 |
| **需求文档** | 功能行为变更、新增业务规则、删除功能 | 需求变更流程 |

### 4.3 Examples

| Bug 修复 | 设计文档 | 需求文档 |
|----------|----------|----------|
| 修复空指针异常 | 不需要 | 不需要 |
| 修复 API 返回格式 | 需要（接口定义） | 不需要 |
| 添加非空验证 | 不需要 | 需要（新增约束） |
| 修复边界条件 | 不需要 | 不需要 |

---

## 5. Quick Fix Criteria

以下情况可**直接修复**，无需文档同步：

| 条件 | 示例 |
|------|------|
| ✅ 纯实现问题 | 边界条件、空指针、类型错误 |
| ✅ 不影响接口 | 内部实现修正，API 不变 |
| ✅ 不影响行为 | 性能优化、代码重构 |
| ✅ 开发中发现 | Work Item 仍在 implementation 阶段 |

---

## 6. Phase Guards Behavior

当修改 `status=done` 的 Work Item 代码时：

- PreToolUse Hook 弹出 `ask` 确认（非强制阻止）
- 提醒检查文档同步需求
- 用户确认后允许修改

---

## 7. Execution Principles

### 始终做

- 收到 Bug 报告 → 先定位问题
- 定位明确 → 先修复代码
- 代码修复后 → 检查文档同步需求
- 需要更新设计 → 直接更新
- 需要更新需求 → 走需求变更流程

### 绝不做

- 跳过代码修复先改文档
- 忽略文档同步检查
- 将需求变更当作设计变更处理

---

## 8. Tools Reference

| 工具 | 用途 |
|------|------|
| `node scripts/state.cjs set-phase <id> <phase>` | 更新阶段 |
| `/write-feature` | 需求变更时更新 Feature 文档 |
| `/write-design` | 直接更新设计文档 |

---

*Version: v1.2*
*Aligned with: flow-workflows.md v9.2 §5*
*Updated: 2025-12-31*

---

## Changelog

### v1.2 (2025-12-31)
- 添加 §8 Tools Reference
- 对齐 flow-workflows.md v9.2
- 符合 spec-execution-flow.md v1.0 标准

### v1.1 (2025-12-30)
- 重构为"代码优先"流程：先修复代码，再补充文档
- §3 改为 Code-First Fix Flow
- 新增 §4 Post-Fix Documentation Sync：定义文档同步决策流程
- 设计文档：直接更新；需求文档：走需求变更流程

### v1.0 (2025-12-30)
- 初始版本
