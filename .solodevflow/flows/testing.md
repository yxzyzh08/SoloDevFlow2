# Testing Flow - Execution Spec

> AI 执行规范：测试阶段的执行流程

**需求文档**：[flow-testing.md](../../docs/requirements/flows/flow-testing.md)

---

## 1. Entry Check

**进入测试阶段前检查**：

```
检查 Entry Criteria
    ├─ 实现已完成
    │     └─ 代码审查通过，所有 Core Functions 已实现
    ├─ phase 已转换
    │     └─ feature_implementation → feature_testing
    └─ 代码级测试已通过
          └─ 单元测试、集成测试通过（implementation 阶段产出）
```

---

## 2. Testing Flow

### 2.1 PREPARE（准备验收清单）

1. 读取需求文档 Acceptance Criteria
2. 生成验收清单
3. 准备测试环境（如需要）

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

**测试环境策略**：

| 规模 | 策略 |
|------|------|
| Small | 本地或共享测试环境 |
| Medium | Preview 环境（按需创建） |
| Large | Ephemeral 环境 + IaC |

### 2.2 EXECUTE（执行验收测试）

**功能验收**：
- 逐一验证每个 Core Function
- 正常路径（Happy path）测试
- 异常路径（错误处理、边界情况）
- 集成点验证

**标准验收**：

| AC 格式 | 验证方式 |
|---------|----------|
| Checklist | 逐项手动验证 |
| Given-When-Then | 按场景执行验证 |

**验证记录**：

```markdown
| AC | 描述 | 验证方式 | 结果 | 备注 |
|----|------|----------|------|------|
| AC1 | xxx | 手动测试 | ✅ | - |
| AC2 | xxx | 自动测试 | ✅ | - |
| AC3 | xxx | 手动测试 | ❌ | 需修复 |
```

**质量检查**：

| 检查项 | 标准 |
|--------|------|
| 文档完整性 | Artifacts 章节已填写 |
| 代码规范 | 无 lint 错误 |
| 测试覆盖 | 达到覆盖率要求 |
| 无遗留问题 | Open Questions 已关闭 |

### 2.3 REPORT（生成验收报告）

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

### 2.4 CONFIRM（人类确认）

```
[验收报告生成]
    ↓
[提示用户确认]
    ↓
[等待反馈]
    ├─ 通过 → set-phase <id> done + deactivate-feature
    ├─ 条件通过 → 记录问题，set-phase <id> done
    └─ 不通过 → 记录问题，返回实现阶段修复
```

---

## 3. System-Level Testing Types

> 本阶段负责系统级测试，代码级测试由 implementation 阶段完成

### 3.1 E2E Testing

| 规模 | 策略 |
|------|------|
| Small | 手动 Checklist |
| Medium | 核心流程自动化 |
| Large | 全面自动化 |

### 3.2 Performance Testing

| 类型 | 目的 | 适用规模 |
|------|------|----------|
| 基准测试 | 建立性能基线 | Medium+ |
| 负载测试 | 验证预期负载下性能 | Medium+ |
| 压力测试 | 找到系统极限 | Large |
| 浸泡测试 | 长时间运行稳定性 | Large |

### 3.3 Security Testing

| 类型 | 说明 | 适用规模 |
|------|------|----------|
| 依赖审计 | 第三方依赖漏洞扫描 | All |
| SAST | 静态代码安全扫描 | Medium+ |
| DAST | 动态应用安全测试 | Medium+ |
| 渗透测试 | 模拟攻击测试 | Large |

### 3.4 Regression Testing

| 策略 | 执行时机 |
|------|----------|
| 完整回归 | 发布前 |
| 冒烟测试 | 每次部署 |
| 增量回归 | PR 合并后 |

---

## 4. CI/CD Integration

| 阶段 | 执行测试 | 阻塞策略 |
|------|----------|----------|
| PR 检查 | 冒烟测试（P0 场景） | 失败阻塞合并 |
| 合并后 | 完整 E2E 测试 | 失败发送告警 |
| 发布前 | 全量回归 + 性能 + 安全 | 失败阻塞发布 |
| 定时任务 | 安全扫描、性能基准 | 失败发送告警 |

---

## 5. Completion Actions

**验收通过后**：

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

---

## 6. Error Handling

**验收失败处理**：

| 问题类型 | 处理方式 |
|----------|----------|
| 功能缺失 | 返回实现阶段补充 |
| 功能错误 | 返回实现阶段修复 |
| 性能问题 | 评估影响，决定修复或接受 |
| 需求歧义 | 返回需求阶段澄清 |

---

## 7. Execution Principles

### 始终做

- 进入测试前生成完整验收清单
- 逐项验证所有 Acceptance Criteria
- 生成结构化验收报告
- 等待人类显式确认才进入 done
- 完成后 deactivate Feature

### 绝不做

- 跳过验收清单生成
- 遗漏任何验收标准
- 未经人类确认标记为 done
- 验收失败时直接进入 done
- 忘记 deactivate Feature

---

## 8. Tools Reference

| 工具 | 用途 |
|------|------|
| `node scripts/state.cjs set-phase <id> done` | 标记完成 |
| `node scripts/state.cjs deactivate-feature <id>` | 取消激活 Feature |
| `node scripts/index.cjs` | 更新索引 |

---

*Version: v1.1*
*Aligned with: flow-testing.md v1.4*
*Updated: 2025-12-31*