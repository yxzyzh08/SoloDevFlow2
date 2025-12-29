---
type: feature
version: "1.0"
id: review-assistant
status: done
priority: P0
domain: ai-config
---

# Feature: Review Assistant <!-- id: feat_review_assistant -->

> 需求审核助手 Subagent，协助人类审核需求文档，生成结构化审核报告

---

## 1. Intent <!-- id: feat_review_assistant_intent -->

### Problem

人类审核需求文档时面临的挑战：
- 需要同时理解 PRD 全局和具体需求细节
- 缺乏行业最佳实践参考
- 容易遗漏关键问题（边界条件、依赖冲突、验收标准）
- 审核深度和一致性难以保证

### Value

提供 AI 辅助的需求审核能力：
- 自动加载 PRD 和需求文档上下文
- 搜索行业最佳实践作为参考
- 生成结构化审核报告，覆盖关键检查维度
- 独立上下文，不干扰主对话流程

---

## 2. Core Functions <!-- id: feat_review_assistant_functions -->

### 2.1 Context Loading

| 功能 | 说明 |
|------|------|
| 加载 PRD | 读取 `docs/requirements/prd.md`，理解产品全局 |
| 加载需求文档 | 读取指定的需求文档（Feature/Capability/Flow） |
| 加载相关规范 | 读取 `docs/specs/spec-requirements.md`，作为审核依据 |
| 加载索引 | 读取 `.solodevflow/index.json`，了解文档关系 |

### 2.2 Best Practices Search

| 功能 | 说明 |
|------|------|
| 关键词提取 | 从需求文档提取核心关键词 |
| 行业搜索 | 使用 WebSearch 搜索相关最佳实践 |
| 结果筛选 | 筛选高质量、相关性强的参考资料 |

### 2.3 Review Analysis

| 检查维度 | 检查内容 |
|----------|----------|
| 完整性 | 必选章节是否齐全、内容是否充分 |
| 清晰度 | 描述是否明确、无歧义 |
| 可验证性 | 验收标准是否可测试、可量化 |
| 一致性 | 与 PRD 愿景是否一致、术语是否统一 |
| 依赖合理性 | 依赖关系是否正确、有无循环依赖 |
| 边界明确性 | 范围是否清晰、排除项是否明确 |
| 最佳实践对齐 | 与行业惯例的差异、改进建议 |

### 2.4 Report Generation

输出格式：`.solodevflow/reviews/{doc-id}-review.md`

报告结构：

```markdown
# Review Report: {document-title}

## Summary
- 文档类型：{type}
- 审核时间：{timestamp}
- 总体评估：{pass/needs-revision/reject}

## Checklist
| 维度 | 状态 | 说明 |
|------|------|------|

## Findings
### Critical Issues
### Recommendations

## Best Practices Reference
### Industry Standards
### Suggested Improvements

## Conclusion
```

---

## 3. User Stories <!-- id: feat_review_assistant_stories -->

### Story 1: 需求审核

**As** 产品负责人
**I want** AI 帮我审核需求文档
**So that** 发现潜在问题，提高需求质量

**Scenario**:
1. 人类输入：`审核 fea-state-management.md`
2. Review Assistant 启动，加载上下文
3. 搜索状态管理相关最佳实践
4. 生成审核报告
5. 人类阅读报告，决定是否批准

---

## 4. Acceptance Criteria <!-- id: feat_review_assistant_acceptance -->

| Item | Verification | Pass Criteria |
|------|--------------|---------------|
| 上下文加载 | 手动测试 | 成功加载 PRD、需求文档、规范 |
| 最佳实践搜索 | 手动测试 | 返回相关搜索结果 |
| 报告生成 | 检查输出 | 生成符合格式的 .md 文件 |
| 独立上下文 | 确认行为 | 不影响主对话上下文 |
| 覆盖全部维度 | 检查报告 | 包含所有检查维度的评估 |

---

## 5. Dependencies <!-- id: feat_review_assistant_dependencies -->

| Dependency | Type | 说明 |
|------------|------|------|
| spec-requirements | hard | 审核依据来源 |
| prd | hard | 需要 PRD 作为全局上下文 |
| index.json | soft | 了解文档关系 |

---

## 6. Boundaries <!-- id: feat_review_assistant_boundaries -->

### In Scope

- 审核需求文档（Feature/Capability/Flow）
- 生成结构化审核报告
- 搜索最佳实践参考

### Out of Scope

- 审核设计文档（需另建 design-review-assistant）
- 自动修改需求文档
- 替代人类做出批准/拒绝决策

---

## 7. Artifacts <!-- id: feat_review_assistant_artifacts -->

| Type | Path | Description |
|------|------|-------------|
| Agent | .claude/agents/review-assistant/AGENT.md | Subagent 定义 |
| Output | .solodevflow/reviews/*.md | 审核报告输出目录 |

**Design Depth**: None（使用 Claude CLI Subagent 机制，无需额外设计）

---

*Version: v1.0*
*Created: 2025-12-28*
*Updated: 2025-12-28*
