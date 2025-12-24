# 知识库需求文档评审报告

**评审对象**: `docs/requirements/features/fea-knowledge-base.md` v1.2
**评审日期**: 2025-12-25
**评审目标**: 检查格式符合性、需求清晰度、与 flow-workflows.md 的匹配程度

---

## 1. 格式符合性检查

### Frontmatter

```yaml
type: feature       # ✅
version: "1.2"      # ✅
priority: P0        # ✅ 可选
domain: process     # ✅ 可选
```

### 必选章节

| 章节 | 锚点 | 状态 |
|------|------|------|
| Intent | `feat_knowledge_base_intent` | ✅ |
| Core Capabilities | `feat_knowledge_base_capabilities` | ✅ |
| Acceptance Criteria | `feat_knowledge_base_acceptance` | ✅ |
| Artifacts | `feat_knowledge_base_artifacts` | ✅ |

### 可选章节

| 章节 | 状态 |
|------|------|
| Scope | ✅ (含 In/Out Scope) |
| Dependencies | ✅ |
| Open Questions | ✅ |

---

## 2. 与 flow-workflows.md 需求匹配分析

### 2.1 工作流对知识库的需求提取

| 流程 | 需要的知识库能力 | 来源章节 |
|------|-----------------|----------|
| **意图识别** | Feature 列表、关键词匹配、判断功能是否存在 | §3 Input Analysis |
| **咨询流程** | 加载 PRD、识别关联文档、加载相关文档 | §5 Consulting |
| **需求流程** | 关系分析（扩展/依赖/影响）、确定文档类型 | §6 Requirements |
| **需求变更** | 定位已有需求、评估影响 | §8 Other Flows |
| **规范变更** | 运行影响分析 | §8 Other Flows |
| **Hook 集成** | 提供上下文注入 | §9 Hooks |

### 2.2 能力覆盖检查

| 工作流需求 | 知识库能力 | 覆盖状态 |
|-----------|-----------|----------|
| 加载 PRD | C1 文档索引 + C4 `getProductOverview()` | ✅ 覆盖 |
| 识别关联文档 | C3 关键词索引 + C4 `findDocuments()` | ✅ 覆盖 |
| 加载相关文档 | C4 上下文查询 | ✅ 覆盖 |
| 关系分析（依赖/扩展） | C2 关系存储 + C4 `getRelations()` | ✅ 覆盖 |
| 判断功能是否存在 | C4 `findDocuments({ keyword })` | ⚠️ 隐含覆盖 |
| 影响分析（impacts） | C4 `getRelationChain()` | ⚠️ 需反向查询 |
| 意图类型判断 | C4 `loadContext()` | ❌ 类型不完整 |
| Hook 上下文注入 | 未定义 | ❌ 缺失 |

---

## 3. 发现的问题

### 问题 1：`loadContext()` 返回的 suggestedType 与工作流不匹配 ❌

**知识库定义**（§5.4）：
```
suggestedType: 'consult' | 'new_requirement' | 'change' | 'unknown'
```

**工作流需要**（flow-workflows §3.1）：
```
直接执行 | 产品咨询 | 新增需求 | 需求变更 | 规范变更 | 无关想法
```

**差距**：

| 工作流类型 | 知识库 suggestedType | 状态 |
|-----------|---------------------|------|
| 直接执行 | - | ❌ 缺失 |
| 产品咨询 | `consult` | ✅ |
| 新增需求 | `new_requirement` | ✅ |
| 需求变更 | `change` | ✅ |
| 规范变更 | - | ❌ 缺失 |
| 无关想法 | - | ❌ 缺失 |
| 无法判断 | `unknown` | ✅ |

**建议**：扩展 suggestedType 枚举值，或说明知识库只负责部分意图识别（咨询/需求/变更），其他由主 Agent 判断。

---

### 问题 2：缺少明确的 `exists()` API ⚠️

**工作流需求**：区分"新增需求"和"需求变更"需要判断功能是否已存在。

**当前状态**：可通过 `findDocuments({ keyword })` 实现，但不够直接。

**建议**：在 §5 Query Interfaces 中添加：
```
exists(name: string) → boolean
  判断指定名称的 Feature/Capability 是否已存在
```

---

### 问题 3：影响分析 API 不明确 ⚠️

**工作流需求**：
- 规范变更 → "运行影响分析"
- 需求变更 → "评估影响"

**当前状态**：
- 关系表有 `impacts` 类型，但说明是"影响分析计算"
- `getRelationChain()` 可以做反向查询，但没有专门的影响分析 API

**建议**：添加明确的影响分析接口：
```
getImpactedDocuments(docId: string) → Document[]
  返回受指定文档变更影响的所有文档（反向查询 depends/consumes）
```

---

### 问题 4：缺少与 Hook 集成的说明 ❌

**工作流需求**（§9）：
- `UserPromptSubmit` Hook 需要注入上下文

**当前状态**：知识库没有定义如何与 Hook 集成。

**建议**：在 §5 Query Interfaces 中添加：
```
getContextForHook() → {
  productOverview: Summary,
  featureList: [{ name, status }],
  currentFeature: Feature | null
}
  为 UserPromptSubmit Hook 提供精简上下文（~200 tokens）
```

---

### 问题 5：缺少 Consumers 说明 ⚠️

**当前状态**：Dependencies 章节列出了知识库依赖什么，但没有说明谁使用知识库。

**建议**：添加 Consumers 章节（虽然是 Feature 不是 Capability，但有助于理解）：
```markdown
## Consumers

| Consumer | 使用场景 |
|----------|----------|
| flow_workflows | 意图识别、咨询流程、需求流程 |
| feat_change_impact_tracking | 影响分析 |
| UserPromptSubmit Hook | 上下文注入 |
```

---

## 4. 清晰度评估

| 章节 | 评分 | 说明 |
|------|------|------|
| Intent | ✅ 95% | Problem/Value 清晰 |
| Scope | ✅ 90% | In/Out Scope 明确 |
| Core Capabilities | ✅ 90% | 6 个能力定义清晰 |
| Data Model | ✅ 95% | 表结构完整 |
| Query Interfaces | ⚠️ 75% | 缺少部分工作流需要的 API |
| Parsing Rules | ✅ 90% | 解析契约清晰 |
| Acceptance Criteria | ⚠️ 80% | 缺少意图识别、影响分析的验收条件 |

---

## 5. 评审结论

### 总体评价

| 维度 | 评分 | 说明 |
|------|------|------|
| 格式符合性 | ✅ 95% | 符合 Feature Spec 结构 |
| 需求清晰度 | ✅ 85% | 整体清晰，部分 API 定义不足 |
| 工作流覆盖 | ⚠️ 70% | 核心能力覆盖，但有 4 个缺口 |

### 需要修复的问题

| # | 问题 | 优先级 | 修复建议 |
|---|------|--------|----------|
| 1 | suggestedType 与工作流类型不匹配 | P0 | 扩展枚举值或明确职责边界 |
| 2 | 缺少 `exists()` API | P1 | 添加接口定义 |
| 3 | 影响分析 API 不明确 | P1 | 添加 `getImpactedDocuments()` |
| 4 | 缺少 Hook 集成说明 | P1 | 添加 `getContextForHook()` |
| 5 | 缺少 Consumers 说明 | P2 | 添加使用方列表 |

---

*Reviewed by: Claude*
*Date: 2025-12-25*
