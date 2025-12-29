# Test Specification v1.2 <!-- id: spec_test -->

> 定义系统级测试的文档结构、测试类型、质量标准（不包含单元测试和集成测试）

---

**重要声明**：

- 此规范定义**系统级测试**，不包含代码级测试
- **单元测试、集成测试**属于开发规范范畴（见 `spec-backend-dev.md`、`spec-frontend-dev.md`）
- 元规范 `spec-meta.md` 定义文档类型和验证规则
- 设计文档规范见 `spec-design.md`

---

## 1. Project Scale <!-- id: spec_test_scale -->

> 核心理念：**规模决定测试深度**——小项目手动验证，大项目自动化全覆盖。

### 1.1 Scale Definition

| 规模 | 用户量 | 团队 | 典型场景 |
|------|--------|------|----------|
| **Small** | < 100 | 1-2 人 | 内部工具、原型、MVP |
| **Medium** | 100-10000 | 2-5 人 | 标准业务系统、B端产品 |
| **Large** | > 10000 | 5+ 人 | C端产品、核心系统、平台 |

### 1.2 Test Type Applicability

| 测试类型 | Small | Medium | Large |
|----------|:-----:|:------:|:-----:|
| E2E 测试 | 手动 Checklist | 核心流程自动化 | 全面自动化 |
| 性能测试 | 不需要 | 基准测试 | 完整压测 |
| 破坏性测试 | 不需要 | 按需 | 必须 |
| 安全测试 | 基础检查 | 推荐 | 必须 |
| 兼容性测试 | 主流环境 | 标准矩阵 | 完整矩阵 |

### 1.3 Small Project Testing

小项目推荐使用**手动测试 Checklist**，无需编写测试文档：

```markdown
## 发布前检查清单

- [ ] 核心功能可用
- [ ] 登录/注销正常
- [ ] 主要页面无报错
- [ ] 移动端基本可用
```

**Small 项目可以省略**：
- E2E 自动化测试
- 性能测试文档
- 破坏性测试文档
- 完整的测试报告

---

## 2. Scope <!-- id: spec_test_scope -->

### 2.1 Test Scope Definition

| 测试层级 | 负责规范 | 说明 |
|----------|----------|------|
| 单元测试 | 开发规范 | 代码级，开发者负责 |
| 集成测试 | 开发规范 | 模块级，开发者负责 |
| **E2E 测试** | **本规范** | 系统级，用户视角 |
| **性能测试** | **本规范** | 系统级，性能基准 |
| **破坏性测试** | **本规范** | 系统级，容错验证 |
| **安全测试** | **本规范** | 系统级，安全审计 |

### 2.2 Test Document Types

| Type | 说明 | 文件命名 | 目录 |
|------|------|----------|------|
| `test-e2e` | 端到端测试 | `test-{name}.md` | `docs/tests/e2e/` |
| `test-performance` | 性能测试 | `test-{name}.md` | `docs/tests/performance/` |
| `test-destructive` | 破坏性测试 | `test-{name}.md` | `docs/tests/destructive/` |
| `test-security` | 安全测试 | `test-{name}.md` | `docs/tests/security/` |

---

## 3. Frontmatter <!-- id: spec_test_frontmatter -->

所有测试文档必须包含 YAML frontmatter：

```yaml
---
type: {test_type}
version: {version}
inputs:
  - docs/designs/des-xxx.md#design_xxx
  - docs/requirements/features/fea-xxx.md#feat_xxx_acceptance
---
```

| 字段 | 必填 | 说明 |
|------|------|------|
| `type` | 是 | 测试类型：`test-e2e`, `test-performance`, `test-destructive`, `test-security` |
| `version` | 是 | 文档版本号 |
| `inputs` | 是 | 输入来源列表（设计文档、需求文档锚点引用） |

### 3.1 inputs 字段说明

`inputs` 字段建立测试 → 设计 → 需求的追溯链路：

| 用途 | 说明 |
|------|------|
| **追溯性** | 明确测试覆盖哪些设计/需求 |
| **影响分析** | 设计变更时定位相关测试 |
| **知识库关系** | 解析为 `references` 关系 |

**格式规则**：
- `path#anchor`：引用特定章节（推荐）
- `path`：引用整个文档

**示例**：

```yaml
inputs:
  - docs/designs/des-user-auth.md#design_auth_interface
  - docs/requirements/features/fea-user-login.md#feat_user_login_acceptance
  - docs/requirements/features/fea-user-register.md
```

---

## 4. E2E Testing <!-- id: spec_test_e2e --> <!-- defines: test-e2e -->

### 4.1 E2E Test Document Structure

| Section | Required | Anchor | Description |
|---------|----------|--------|-------------|
| Test Scope | Yes | `test_{name}_scope` | 测试范围和目标 |
| Prerequisites | Yes | `test_{name}_prereq` | 前置条件 |
| Test Scenarios | Yes | `test_{name}_scenarios` | 测试场景列表 |
| Test Data | No | `test_{name}_data` | 测试数据要求 |
| Expected Results | Yes | `test_{name}_expected` | 预期结果 |

### 4.2 Test Scenario Format

每个测试场景应包含：

```markdown
### Scenario: {场景名称} <!-- id: test_{name}_scenario_{n} -->

**前置条件**：
- 用户已登录
- 购物车有商品

**测试步骤**：
1. 进入购物车页面
2. 点击"结算"按钮
3. 选择支付方式
4. 确认订单

**预期结果**：
- 订单创建成功
- 跳转到支付页面
- 库存已扣减

**优先级**：P0 / P1 / P2
```

### 4.3 Test Priority

| 优先级 | 说明 | 执行频率 |
|--------|------|----------|
| **P0** | 核心流程，必须通过 | 每次发布 |
| **P1** | 重要功能，应该通过 | 每次发布 |
| **P2** | 次要功能，建议通过 | 按需执行 |

### 4.4 E2E Test Coverage by Scale

| 规模 | P0 覆盖 | P1 覆盖 | P2 覆盖 | 自动化率 |
|------|---------|---------|---------|----------|
| Small | 手动验证 | - | - | 0% |
| Medium | 100% | 80% | 按需 | 50%+ |
| Large | 100% | 100% | 80% | 80%+ |

### 4.5 Regression Testing Strategy

| 策略 | 说明 | 执行时机 |
|------|------|----------|
| **完整回归** | 所有 E2E 用例 | 发布前 |
| **冒烟测试** | P0 场景 | 每次部署 |
| **增量回归** | 影响范围内的用例 | PR 合并后 |
| **随机采样** | 定期抽样执行 | 定时任务 |

**回归触发条件**：

| 变更类型 | 回归范围 |
|----------|----------|
| 核心模块变更 | 完整回归 |
| 单一功能变更 | 相关模块回归 |
| UI 样式变更 | 视觉回归 |
| 配置变更 | 冒烟测试 |
| 依赖升级 | 完整回归 |

---

## 5. Performance Testing <!-- id: spec_test_performance --> <!-- defines: test-performance -->

### 5.1 Performance Test Document Structure

| Section | Required | Anchor | Description |
|---------|----------|--------|-------------|
| Test Objectives | Yes | `test_{name}_objectives` | 性能目标 |
| Test Environment | Yes | `test_{name}_env` | 测试环境配置 |
| Test Scenarios | Yes | `test_{name}_scenarios` | 性能测试场景 |
| Metrics | Yes | `test_{name}_metrics` | 关键指标定义 |
| Baseline | No | `test_{name}_baseline` | 性能基准 |
| Results | No | `test_{name}_results` | 测试结果 |

### 5.2 Performance Metrics

| 指标类别 | 指标 | 说明 |
|----------|------|------|
| **响应时间** | P50 / P95 / P99 | 百分位响应时间 |
| **吞吐量** | RPS / TPS | 每秒请求/事务数 |
| **并发** | Concurrent Users | 并发用户数 |
| **资源** | CPU / Memory / Disk | 资源使用率 |
| **错误率** | Error Rate | 请求失败比例 |

### 5.3 Performance Test Types

| 类型 | 目的 | 适用规模 |
|------|------|----------|
| **基准测试** | 建立性能基线 | Medium+ |
| **负载测试** | 验证预期负载下的性能 | Medium+ |
| **压力测试** | 找到系统极限 | Large |
| **浸泡测试** | 验证长时间运行稳定性 | Large |
| **峰值测试** | 验证突发流量处理能力 | Large |

### 5.4 Performance Targets by Scale

| 指标 | Medium | Large |
|------|--------|-------|
| API P95 响应时间 | < 500ms | < 200ms |
| 页面加载时间 | < 3s | < 2s |
| 错误率 | < 1% | < 0.1% |
| 并发用户 | 100+ | 1000+ |

---

## 6. Destructive Testing <!-- id: spec_test_destructive --> <!-- defines: test-destructive -->

### 6.1 Destructive Test Document Structure

| Section | Required | Anchor | Description |
|---------|----------|--------|-------------|
| Failure Scenarios | Yes | `test_{name}_failures` | 故障场景定义 |
| Recovery Expectations | Yes | `test_{name}_recovery` | 恢复预期 |
| Test Procedures | Yes | `test_{name}_procedures` | 测试步骤 |
| Rollback Plan | Yes | `test_{name}_rollback` | 回滚方案 |

### 6.2 Failure Scenario Types

| 类型 | 场景 | 验证目标 |
|------|------|----------|
| **服务故障** | 服务宕机、重启 | 服务发现、自动恢复 |
| **网络故障** | 网络分区、延迟 | 超时处理、重试机制 |
| **数据库故障** | 主库宕机、连接池耗尽 | 主从切换、降级策略 |
| **依赖故障** | 第三方服务不可用 | 熔断、降级、缓存 |
| **资源耗尽** | 磁盘满、内存溢出 | 监控告警、自动扩容 |

### 6.3 Recovery Metrics

| 指标 | 说明 | 目标 |
|------|------|------|
| **MTTR** | 平均恢复时间 | < 5 分钟 |
| **RTO** | 恢复时间目标 | 根据 SLA 定义 |
| **RPO** | 恢复点目标 | 根据 SLA 定义 |
| **数据完整性** | 故障后数据一致性 | 100% |

### 6.4 Destructive Test Applicability

| 规模 | 服务故障 | 网络故障 | 数据库故障 | 依赖故障 |
|------|----------|----------|------------|----------|
| Small | 不需要 | 不需要 | 不需要 | 不需要 |
| Medium | 推荐 | 按需 | 推荐 | 按需 |
| Large | 必须 | 必须 | 必须 | 必须 |

---

## 7. Security Testing <!-- id: spec_test_security --> <!-- defines: test-security -->

### 7.1 Security Test Document Structure

| Section | Required | Anchor | Description |
|---------|----------|--------|-------------|
| Test Scope | Yes | `test_{name}_scope` | 安全测试范围 |
| Threat Model | No | `test_{name}_threats` | 威胁建模 |
| Test Cases | Yes | `test_{name}_cases` | 安全测试用例 |
| Findings | Yes | `test_{name}_findings` | 发现的问题 |
| Remediation | Yes | `test_{name}_remediation` | 修复建议 |

### 7.2 Security Test Types

| 类型 | 说明 | 适用规模 |
|------|------|----------|
| **SAST** | 静态代码安全扫描 | Medium+ |
| **DAST** | 动态应用安全测试 | Medium+ |
| **依赖审计** | 第三方依赖漏洞扫描 | All |
| **渗透测试** | 模拟攻击测试 | Large |
| **安全审计** | 全面安全评估 | Large |

### 7.3 Security Checklist

| 检查项 | Small | Medium | Large |
|--------|:-----:|:------:|:-----:|
| 依赖漏洞扫描 | ✓ | ✓ | ✓ |
| OWASP Top 10 检查 | 基础 | 标准 | 完整 |
| 认证/授权测试 | 手动 | 自动化 | 自动化 |
| 敏感数据保护 | ✓ | ✓ | ✓ |
| API 安全测试 | - | ✓ | ✓ |
| 渗透测试 | - | 按需 | 定期 |

### 7.4 OWASP Top 10 Verification

| 风险 | 测试方法 |
|------|----------|
| 注入攻击 | SQL/NoSQL/命令注入测试 |
| 认证失效 | 暴力破解、会话管理测试 |
| 敏感数据泄露 | 加密验证、传输安全测试 |
| XXE | XML 外部实体注入测试 |
| 访问控制失效 | 越权访问测试 |
| 安全配置错误 | 配置审计 |
| XSS | 跨站脚本测试 |
| 不安全反序列化 | 反序列化漏洞测试 |
| 使用含漏洞组件 | 依赖扫描 |
| 日志监控不足 | 日志审计 |

---

## 8. Compatibility Testing <!-- id: spec_test_compatibility -->

### 8.1 Browser Compatibility (Web)

| 规模 | 覆盖范围 |
|------|----------|
| Small | Chrome 最新版 |
| Medium | Chrome, Firefox, Safari, Edge (最新2个版本) |
| Large | 完整浏览器矩阵 + IE11（如需） |

### 8.2 Device Compatibility (Mobile)

| 规模 | 覆盖范围 |
|------|----------|
| Small | iOS 最新版 + Android 主流机型 |
| Medium | iOS 最新2版 + Android 6.0+ |
| Large | 完整设备矩阵 + 低端机型 |

### 8.3 API Compatibility

| 检查项 | 说明 |
|--------|------|
| 版本兼容 | 新版本 API 向后兼容 |
| 字段兼容 | 新增字段不影响旧客户端 |
| 废弃策略 | 废弃 API 有足够过渡期 |

---

## 9. Test Environment <!-- id: spec_test_environment -->

### 9.1 Environment Types

| 环境 | 用途 | 数据 |
|------|------|------|
| **开发环境** | 开发自测 | Mock / 测试数据 |
| **测试环境** | 功能测试 | 测试数据 |
| **预发环境** | 预发布验证 | 生产数据脱敏副本 |
| **生产环境** | 正式运行 | 真实数据 |

### 9.2 Test Data Management

| 策略 | 说明 |
|------|------|
| **数据隔离** | 测试数据与生产数据隔离 |
| **数据脱敏** | 使用生产数据时脱敏处理 |
| **数据重置** | 测试后可恢复初始状态 |
| **数据版本** | 测试数据版本化管理 |

### 9.3 Test Data Generation

| 策略 | 用途 | 说明 |
|------|------|------|
| **Factory** | 动态生成 | 按需创建测试对象，支持覆盖默认值 |
| **Fixture** | 固定数据集 | 预定义的测试场景，可复用 |
| **Seed** | 数据库初始化 | 环境重置时使用，保证一致性 |
| **生产采样** | 真实场景 | 脱敏后的生产数据，覆盖边缘情况 |

**数据生成原则**：

| 原则 | 说明 |
|------|------|
| 可重复 | 相同输入产生相同数据 |
| 隔离 | 测试之间数据不互相影响 |
| 最小化 | 只生成测试所需的最小数据集 |
| 真实性 | 数据格式和分布接近生产环境 |

---

## 10. Test Reporting <!-- id: spec_test_reporting -->

### 10.1 Test Report Structure

| Section | 说明 |
|---------|------|
| 执行摘要 | 测试范围、时间、结论 |
| 测试结果 | 通过/失败/跳过统计 |
| 缺陷列表 | 发现的问题及严重程度 |
| 覆盖率 | 场景覆盖、代码覆盖 |
| 建议 | 改进建议 |

### 10.2 Defect Severity

| 级别 | 说明 | 处理要求 |
|------|------|----------|
| **Critical** | 系统不可用 | 立即修复 |
| **Major** | 核心功能受损 | 发布前修复 |
| **Minor** | 次要功能问题 | 计划修复 |
| **Trivial** | 轻微问题 | 按需修复 |

---

## 11. Test Automation <!-- id: spec_test_automation -->

### 11.1 Automation Strategy

| 规模 | 自动化策略 |
|------|------------|
| Small | 不需要自动化 |
| Medium | 核心流程自动化（P0 场景） |
| Large | 全面自动化 + CI/CD 集成 |

### 11.2 Automation Best Practices

| 原则 | 说明 |
|------|------|
| 稳定性优先 | 避免 Flaky Tests |
| 独立性 | 测试之间无依赖 |
| 可维护性 | Page Object 等设计模式 |
| 快速反馈 | 并行执行、合理分层 |
| 可读性 | 清晰的命名和结构 |

### 11.3 CI/CD Integration

| 阶段 | 执行的测试 |
|------|------------|
| **PR 检查** | 冒烟测试（< 5 分钟） |
| **合并后** | 完整 E2E 测试 |
| **定时任务** | 性能测试、安全扫描 |
| **发布前** | 全量回归测试 |

### 11.4 Test Failure Handling

| 场景 | 策略 | 说明 |
|------|------|------|
| **P0 测试失败** | 阻止发布 | 必须修复后才能继续 |
| **P1 测试失败** | 告警 + 人工评估 | 评估影响后决定是否发布 |
| **Flaky Test** | 标记 + 重试 + 跟踪 | 自动重试 2-3 次，记录不稳定用例 |
| **环境问题** | 自动重试 + 通知 | 区分环境问题和代码问题 |

**Flaky Test 处理流程**：

```
测试失败
    │
    ▼
自动重试（2-3 次）
    │
    ├─ 重试通过 → 标记为 Flaky，记录到跟踪列表
    │
    └─ 仍然失败 → 判断是否为已知 Flaky Test
                    │
                    ├─ 是 → 跳过，不阻塞流水线
                    │
                    └─ 否 → 真实失败，阻塞流水线
```

---

## Appendix: Checklist <!-- id: spec_test_appendix -->

### A. E2E Test Review Checklist

- [ ] 测试场景覆盖核心用户流程
- [ ] 前置条件明确
- [ ] 测试步骤可复现
- [ ] 预期结果明确
- [ ] 优先级标注正确

### B. Performance Test Checklist

- [ ] 性能目标明确
- [ ] 测试环境与生产相似
- [ ] 测试数据量合理
- [ ] 指标采集完整
- [ ] 基准数据记录

### C. Release Testing Checklist

- [ ] P0 场景全部通过
- [ ] P1 场景通过率 > 95%
- [ ] 无 Critical/Major 缺陷
- [ ] 性能指标达标
- [ ] 安全扫描通过

### D. Small Project Quick Checklist

发布前快速检查（适用于 Small 项目）：

- [ ] 核心功能正常
- [ ] 无控制台错误
- [ ] 主流程可完成
- [ ] 无明显 UI 问题
- [ ] 移动端可用（如适用）

---

*Version: v1.2*
*Created: 2025-12-23*
*Updated: 2025-12-24*
*Changes: v1.2 新增 Frontmatter 章节，定义 inputs 字段建立测试→设计→需求追溯链路；v1.1 补充安全测试文档结构、回归测试策略、测试数据生成策略、测试失败处理策略*
