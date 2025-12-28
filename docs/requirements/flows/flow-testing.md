---
type: flow
id: testing-flow
workMode: document
status: not_started
priority: P0
domain: process
version: "1.0"
---

# Flow: Testing <!-- id: flow_testing -->

> 测试流程，执行系统级测试验证实现是否满足需求和验收标准

**Parent Flow**: [flow-workflows.md](flow-workflows.md) §6
**Test Specification**: [spec-test.md](../../specs/spec-test.md)
**执行规范**：`.solodevflow/flows/testing.md`
> 执行规范由 AI 根据本需求文档生成，模板位于 `template/flows/testing.md`。

---

## 1. Overview <!-- id: flow_testing_overview -->

### 1.1 Purpose

执行**系统级测试**，验证实现满足需求和验收标准：

| 职责 | 说明 |
|------|------|
| **E2E 测试** | 端到端用户场景验证 |
| **性能测试** | 性能指标验证（按项目规模） |
| **安全测试** | 安全漏洞扫描和验证 |
| **回归测试** | 确保变更未破坏已有功能 |
| **最终验收** | 人类确认功能可发布 |

> **重要**：单元测试和集成测试属于 [flow-implementation.md](flow-implementation.md)（实现阶段）职责，
> 本阶段仅负责系统级测试。详见 [spec-test.md](../../specs/spec-test.md) §2.1。

### 1.2 Entry Criteria

| 条件 | 验证方式 |
|------|----------|
| 实现已完成 | 代码审查通过，所有 Core Functions 已实现 |
| phase 已转换 | `feature_implementation` → `feature_testing` |
| 代码级测试已通过 | 单元测试、集成测试通过（implementation 阶段产出） |

### 1.3 Exit Criteria

| 条件 | 验证方式 |
|------|----------|
| 所有验收标准满足 | Acceptance Criteria 全部通过 |
| 人类确认通过 | 显式确认 |
| phase 已更新 | phase = `done` |
| Feature 已 deactivate | 从 activeFeatures 移除 |

---

## 2. Flow Diagram <!-- id: flow_testing_diagram -->

```
[进入验收阶段]
    ↓
[PREPARE] 准备验收清单
    ↓
[EXECUTE] 执行验收测试
    │
    ├─ 功能验收（Core Functions）
    ├─ 标准验收（Acceptance Criteria）
    └─ 质量检查（文档、代码）
    ↓
[REPORT] 生成验收报告
    ↓
[CONFIRM] 人类确认
    ├─ 通过 → [phase → done] → 完成
    └─ 不通过 → 返回实现修复
```

---

## 3. Flow Steps <!-- id: flow_testing_steps -->

### 3.1 Phase 1: PREPARE（准备验收清单）

**输入**：
- 需求文档（Acceptance Criteria）
- 实现代码
- 测试结果

**动作**：
```
读取需求文档 Acceptance Criteria
    ↓
生成验收清单
    ↓
准备测试环境（如需要）
```

**测试环境策略**：

| 规模 | 策略 | 说明 |
|------|------|------|
| Small | 本地或共享测试环境 | 手动部署即可 |
| Medium | Preview 环境（按需创建） | PR 自动创建临时环境 |
| Large | Ephemeral 环境 + IaC | 基础设施即代码，完全隔离 |

**验收清单格式**：

```markdown
## 验收清单

### 功能验收
- [ ] Core Function 1: {描述}
- [ ] Core Function 2: {描述}

### 标准验收
- [ ] AC 1: {验收标准}
- [ ] AC 2: {验收标准}

### 质量检查
- [ ] 文档完整性
- [ ] 代码规范
- [ ] 测试覆盖
```

### 3.2 Phase 2: EXECUTE（执行验收测试）

#### 3.2.1 功能验收

| 检查项 | 说明 |
|--------|------|
| **Core Functions** | 逐一验证每个功能 |
| **正常路径** | Happy path 测试 |
| **异常路径** | 错误处理、边界情况 |
| **集成点** | 与其他模块的交互 |

#### 3.2.2 标准验收

按 Acceptance Criteria 逐条验证：

| 格式 | 验证方式 |
|------|----------|
| **Checklist** | 逐项手动验证 |
| **Given-When-Then** | 按场景执行验证 |

**验证记录**：

```markdown
| AC | 描述 | 验证方式 | 结果 | 备注 |
|----|------|----------|------|------|
| AC1 | xxx | 手动测试 | ✅ | - |
| AC2 | xxx | 自动测试 | ✅ | - |
| AC3 | xxx | 手动测试 | ❌ | 需修复 |
```

#### 3.2.3 质量检查

| 检查项 | 标准 |
|--------|------|
| **文档完整性** | Artifacts 章节已填写 |
| **代码规范** | 无 lint 错误 |
| **测试覆盖** | 达到覆盖率要求 |
| **无遗留问题** | Open Questions 已关闭 |

### 3.3 Phase 3: REPORT（生成验收报告）

**报告结构**：

```markdown
## 验收报告

### 概述
- Feature: {feature-id}
- 验收日期: {date}
- 验收人: {user}

### 功能验收结果
| 功能 | 结果 | 备注 |
|------|------|------|

### 标准验收结果
| 标准 | 结果 | 备注 |
|------|------|------|

### 质量检查结果
| 检查项 | 结果 | 备注 |
|----------|------|------|

### 总结
- 通过项: X/Y
- 未通过项: Z（如有）
- 建议: {通过/待修复}
```

### 3.4 Phase 4: CONFIRM（人类确认）

**确认选项**：

| 选项 | 触发条件 | 后续动作 |
|------|----------|----------|
| **通过** | 所有验收标准满足 | phase → done，deactivate Feature |
| **条件通过** | 小问题，不影响使用 | 记录问题，phase → done |
| **不通过** | 有关键问题 | 记录问题，返回实现阶段修复 |

---

## 4. System-Level Testing Types <!-- id: flow_testing_types -->

> 详细规范见 [spec-test.md](../../specs/spec-test.md)

### 4.1 E2E Testing（端到端测试）

| 维度 | 说明 |
|------|------|
| **范围** | 完整用户场景，从 UI 到后端 |
| **视角** | 用户视角，验证业务流程 |
| **优先级** | P0（核心流程）必须通过 |

**测试策略（按项目规模）**：

| 规模 | 策略 |
|------|------|
| Small | 手动 Checklist |
| Medium | 核心流程自动化 |
| Large | 全面自动化 |

### 4.2 Performance Testing（性能测试）

| 类型 | 目的 | 适用规模 |
|------|------|----------|
| **基准测试** | 建立性能基线 | Medium+ |
| **负载测试** | 验证预期负载下性能 | Medium+ |
| **压力测试** | 找到系统极限 | Large |
| **浸泡测试** | 长时间运行稳定性 | Large |

### 4.3 Security Testing（安全测试）

| 类型 | 说明 | 适用规模 |
|------|------|----------|
| **依赖审计** | 第三方依赖漏洞扫描 | All |
| **SAST** | 静态代码安全扫描 | Medium+ |
| **DAST** | 动态应用安全测试 | Medium+ |
| **渗透测试** | 模拟攻击测试 | Large |

### 4.4 Regression Testing（回归测试）

| 策略 | 说明 | 执行时机 |
|------|------|----------|
| **完整回归** | 所有 E2E 用例 | 发布前 |
| **冒烟测试** | P0 场景 | 每次部署 |
| **增量回归** | 影响范围内的用例 | PR 合并后 |

### 4.5 Destructive Testing（破坏性测试）

| 类型 | 验证目标 | 适用规模 |
|------|----------|----------|
| **服务故障** | 服务发现、自动恢复 | Medium+ |
| **网络故障** | 超时处理、重试机制 | Large |
| **数据库故障** | 主从切换、降级策略 | Large |

### 4.6 Acceptance Dimensions（验收维度）

除系统级测试外，验收还包括：

| 维度 | 说明 |
|------|------|
| **功能完整性** | 所有 Core Functions 实现 |
| **文档完整性** | Artifacts 章节已更新 |
| **需求符合性** | Acceptance Criteria 全部满足 |

### 4.7 CI/CD Integration

> 系统级测试的持续集成策略

| 阶段 | 执行测试 | 阻塞策略 |
|------|----------|----------|
| **PR 检查** | 冒烟测试（P0 场景） | 失败阻塞合并 |
| **合并后** | 完整 E2E 测试 | 失败发送告警 |
| **发布前** | 全量回归 + 性能 + 安全 | 失败阻塞发布 |
| **定时任务** | 安全扫描、性能基准 | 失败发送告警 |

**自动化测试触发**：

| 触发条件 | 测试范围 | 说明 |
|----------|----------|------|
| PR 创建/更新 | P0 冒烟测试 | 快速反馈（< 10 分钟） |
| 合并到主分支 | 完整 E2E | 验证集成正确性 |
| 发布标签 | 全量测试套件 | 包含性能和安全测试 |
| 每日定时 | 回归 + 安全扫描 | 持续监控 |

---

## 5. Solo Developer Considerations <!-- id: flow_testing_solo -->

> 针对 Solo 开发者的验收流程优化

### 5.1 简化策略

| 场景 | 策略 |
|------|------|
| 小功能 | 快速验收，重点检查 |
| 中等功能 | 标准验收流程 |
| 复杂功能 | 完整验收 + 详细报告 |

### 5.2 AI 协作

| AI 职责 | 人类职责 |
|---------|----------|
| 生成验收清单 | 确认清单完整性 |
| 执行自动化测试 | 执行手动验证 |
| 生成验收报告 | 最终确认 |

### 5.3 自验收原则

| 原则 | 说明 |
|------|------|
| **客观标准** | 依据 Acceptance Criteria，避免主观判断 |
| **完整覆盖** | 不跳过任何验收项 |
| **诚实记录** | 问题如实记录，不自欺欺人 |
| **适时发布** | 验收通过即发布，不过度追求完美 |

---

## 6. Completion Actions <!-- id: flow_testing_completion -->

### 6.1 验收通过后

```
确认通过
    ↓
set-phase <id> done
    ↓
deactivate-feature <id>
    ↓
更新需求文档 Artifacts 章节（如需要）
    ↓
运行 index.js 更新索引
    ↓
Feature 完成
```

### 6.2 文档更新

| 文档 | 更新内容 |
|------|----------|
| **需求文档** | Artifacts 章节填写实际路径 |
| **设计文档** | 标记 status: done |
| **index.json** | 自动更新状态 |

---

## 7. Error Handling <!-- id: flow_testing_errors -->

### 7.1 验收失败处理

| 问题类型 | 处理方式 |
|----------|----------|
| **功能缺失** | 返回实现阶段补充 |
| **功能错误** | 返回实现阶段修复 |
| **性能问题** | 评估影响，决定修复或接受 |
| **需求歧义** | 返回需求阶段澄清 |

### 7.2 验收中断恢复

```
Session 中断
    ↓
下次 Session 启动
    ↓
显示验收进度
    ↓
继续未完成的验收项
```

---

## 8. Participants <!-- id: flow_testing_participants -->

| 参与方 | 职责 |
|--------|------|
| **User** | 执行手动验证、最终确认 |
| **AI** | 生成验收清单、执行自动测试、生成报告 |
| **需求文档** | 验收标准来源 |
| **测试套件** | 自动化验证 |

---

## 9. Dependencies <!-- id: flow_testing_dependencies -->

| Dependency | Type | 说明 |
|------------|------|------|
| flow-workflows | hard | 父流程，提供阶段路由 |
| flow-implementation | hard | 实现输入 |
| flow-requirements | hard | 验收标准来源 |
| spec-test | soft | 测试规范 |

---

## 10. Acceptance Criteria <!-- id: flow_testing_acceptance -->

| Item | Verification | Pass Criteria |
|------|--------------|---------------|
| 验收清单生成 | 进入验收阶段 | 自动生成完整清单 |
| 功能验收 | 逐项验证 | 所有功能正常 |
| 标准验收 | 逐项验证 | 所有 AC 满足 |
| 验收报告 | 验收完成 | 生成结构化报告 |
| 通过处理 | 确认通过 | phase → done，Feature deactivate |
| 失败处理 | 确认不通过 | 正确返回实现阶段 |

---

*Version: v1.4*
*Created: 2025-12-28*
*Updated: 2025-12-28*
*Changes: v1.4 添加执行规范引用；v1.3 添加测试环境策略、CI/CD Integration 章节*
