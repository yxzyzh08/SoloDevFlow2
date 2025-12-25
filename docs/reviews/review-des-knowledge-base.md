# Knowledge Base 设计文档评审报告

**评审对象**: `docs/designs/des-knowledge-base.md` v1.0
**评审日期**: 2025-12-25
**评审规范**: `docs/specs/spec-design.md` v2.5
**需求来源**: `docs/requirements/features/fea-knowledge-base.md` v1.4

---

## 1. 格式符合性检查

### 1.1 Frontmatter

```yaml
type: design       # ✅ 正确
version: "1.0"     # ✅ 有版本号
inputs:            # ✅ 声明了输入来源
  - docs/requirements/features/fea-knowledge-base.md#feat_knowledge_base_intent
  - docs/requirements/capabilities/cap-document-validation.md#cap_document_validation_intent
```

| 字段 | 状态 | 说明 |
|------|------|------|
| type | ✅ | 正确为 `design` |
| version | ✅ | 有版本号 |
| inputs | ✅ | 正确引用需求文档锚点 |

### 1.2 必选章节

| 章节 | 锚点 | 状态 | 说明 |
|------|------|------|------|
| Input Requirements | `design_knowledge_base_input` | ✅ | 明确声明需求来源 |
| Overview | `design_knowledge_base_overview` | ✅ | 包含 Goals、Constraints、Architecture |
| Technical Approach | `design_knowledge_base_approach` | ✅ | 包含 Data Model、Sync、Parsing、Query |

### 1.3 可选章节

| 章节 | 锚点 | 状态 | 说明 |
|------|------|------|------|
| Interface Design | `design_knowledge_base_interface` | ✅ | CLI、API、数据结构完整 |
| Decision Record | `design_knowledge_base_decisions` | ✅ | 5 个关键决策有记录 |
| Implementation Plan | `design_knowledge_base_impl` | ✅ | 4 阶段 11 步 |
| Dependencies | `design_knowledge_base_dependencies` | ✅ | 3 个依赖项 |
| Risks | - | ❌ | 缺失 |

---

## 2. 需求覆盖检查

### 2.1 核心能力覆盖

| 能力 ID | 需求描述 | 设计覆盖 | 状态 |
|---------|----------|----------|------|
| C1 | 文档索引（扫描 docs/ 提取元数据） | sync() + scanDocs() + parseDoc() | ✅ 完全覆盖 |
| C2 | 关系存储（Dependencies/Consumers 章节） | extractRelations() + relations 表 | ✅ 完全覆盖 |
| C3 | 关键词索引（标题/章节/描述） | extractKeywords() + keywords 表 | ✅ 完全覆盖 |
| C4 | 上下文查询（概览/查询/关系链） | findDocuments() + getRelations() + loadContext() | ⚠️ 部分覆盖 |
| C5 | 全量同步（清空重建） | §3.2 Sync Strategy | ✅ 完全覆盖 |
| C6 | 规范解析（无需额外 frontmatter） | §3.3 Parsing Rules | ✅ 完全覆盖 |

### 2.2 API 覆盖检查

| 需求 API | 设计实现 | 状态 | 说明 |
|----------|----------|------|------|
| `getProductOverview()` | CLI: overview 命令 | ⚠️ | 接口声明有，实现逻辑未详述 |
| `findDocuments()` | §3.4.1 文档查询 | ✅ | SQL 实现清晰 |
| `exists()` | CLI: exists 命令 | ✅ | 有命令，但实现逻辑未详述 |
| `getRelations()` | §3.4.2 关系查询 | ✅ | SQL 实现清晰 |
| `getRelationChain()` | - | ❌ | 未实现 |
| `getImpactedDocuments()` | §3.4.2 关系查询 | ✅ | SQL 实现清晰 |
| `loadContext()` | §3.4.3 上下文加载 | ⚠️ | 算法骨架有，细节不足 |
| `getContextForHook()` | §4.2 Module API | ⚠️ | 接口声明有，实现逻辑未详述 |

### 2.3 数据模型对比

**Documents 表**：

| 需求字段 | 设计字段 | 状态 | 说明 |
|----------|----------|------|------|
| id | id | ✅ | 一致 |
| type | type | ✅ | 一致 |
| name | name | ✅ | 一致 |
| path | path | ✅ | 一致 |
| summary | summary | ✅ | 一致 |
| domain | domain | ✅ | 一致 |
| mtime | - | ❌ | 设计用 created_at/updated_at 替代 |
| - | raw_content | ➕ | 设计扩展（存储原始内容） |

**Relations 表**：

| 需求关系类型 | 设计关系类型 | 状态 | 说明 |
|--------------|--------------|------|------|
| depends | depends | ✅ | 一致 |
| extends | extends | ✅ | 一致 |
| impacts | - | ⚠️ | 设计说明通过反向查询计算，非存储 |
| defines | defines | ✅ | 一致 |
| consumes | consumes | ✅ | 一致 |

---

## 3. 发现的问题

### 问题 1：缺少 `getRelationChain()` 实现 ❌

**需求定义**（fea-knowledge-base §5.3）：
```
getRelationChain(docId: string, type: RelationType, depth?: number) → Graph
```

**设计现状**：未提供任何实现说明。

**影响**：需求 API 不完整，可能影响深层关系分析场景。

**建议**：
1. 在 §3.4 Query Implementation 添加 `getRelationChain()` 实现
2. 或在 Decision Record 说明暂不实现的理由

---

### 问题 2：`loadContext()` 实现细节不足 ⚠️

**设计现状**（§3.4.3）：
```javascript
loadContext(userInput) {
  // 1. 分词并提取关键词
  const inputKeywords = tokenize(userInput);
  // ...
  // 4. 判断 suggestedType
  const suggestedType = inferInputType(userInput, relevantDocs);
}
```

**问题**：
- `tokenize()` 函数未定义（中英文分词？依赖库？）
- `inferInputType()` 的判断逻辑未说明
- 如何处理 7 种 InputType 的判断规则？

**建议**：补充 `tokenize()` 和 `inferInputType()` 的实现策略，或标记为 Phase 3 待细化。

---

### 问题 3：`getProductOverview()` 输出结构未明确 ⚠️

**需求定义**（fea-knowledge-base §5.1）：
```typescript
getProductOverview() → {
  prd: Document,
  domains: [{ name, description, features: [Document] }],
  capabilities: [Document],
  flows: [Document]
}
```

**设计现状**：§4.1 CLI Commands 中有 `overview` 命令，但未说明如何生成上述结构。

**问题**：
- 如何识别 PRD 文档？（type=prd？固定路径？）
- domains 信息来源？（state.json？还是从文档提取？）
- 如何区分 capabilities 和 flows？

**建议**：在 §3.4 Query Implementation 添加 `getProductOverview()` 的实现逻辑。

---

### 问题 4：`getContextForHook()` 实现逻辑缺失 ⚠️

**需求定义**（fea-knowledge-base §5.5）：
```typescript
getContextForHook() → {
  productOverview: { name, description, activeFeatures },
  featureList: [{ name, status, domain }],
  currentFeature: Feature | null
}
```

**设计现状**：§4.2 Module API 声明了接口签名，但未说明：
- 如何获取 `activeFeatures`？（state.json）
- 如何获取 `status`？（state.json）
- `currentFeature` 的判断逻辑？

**建议**：明确与 state.json 的集成方式，或在 Dependencies 中添加 state-management 依赖。

---

### 问题 5：`mtime` 字段被替换为 `created_at/updated_at` ⚠️

**需求定义**：documents 表有 `mtime` 字段（Unix timestamp）。

**设计实现**：使用 `created_at`、`updated_at` 两个 TEXT 字段。

**问题**：语义和类型都有变化，需确认：
- 需求的 `mtime` 是文件修改时间还是记录时间？
- 设计的 updated_at 是否能满足增量同步需求（如果以后需要）？

**建议**：
1. 保持与需求一致，使用 `mtime INTEGER`
2. 或在 Decision Record 说明变更理由

---

### 问题 6：缺少 Risks 章节 ⚠️

**规范说明**：Risks 是可选章节，但本设计引入了外部依赖 `better-sqlite3`。

**潜在风险**：
- better-sqlite3 需要 native 编译，跨平台可能有问题
- 依赖 cap_document_validation，验证失败时如何处理？

**建议**：添加 Risks 章节，评估 native 模块依赖风险。

---

### 问题 7：`impacts` 关系类型处理不明确 ⚠️

**需求定义**（fea-knowledge-base §4.2）：
```
impacts: A 变更影响 B | 影响分析计算
```

**设计现状**：
- Relations 表类型列表中没有 `impacts`
- `getImpactedDocuments()` 通过反向查询 `depends/consumes` 实现

**问题**：设计选择"计算得到"而非"存储"，这是合理的决策，但需明确：
- 这是设计决策还是需求变更？
- 需求文档是否需要同步更新？

**建议**：在 Decision Record 添加此决策说明。

---

## 4. 设计质量评估

### 4.1 架构清晰度

| 维度 | 评分 | 说明 |
|------|------|------|
| 模块划分 | ✅ 95% | kb-parser / kb-store / kb-query 职责清晰 |
| 依赖关系 | ✅ 90% | 层次分明，CLI → lib modules → SQLite |
| 数据流 | ✅ 90% | sync 流程描述清晰 |

### 4.2 技术方案合理性

| 维度 | 评分 | 说明 |
|------|------|------|
| 数据库选型 | ✅ 95% | SQLite 合适，Decision Record 有说明 |
| 同步策略 | ✅ 95% | 全量同步简单可靠 |
| 解析规则 | ✅ 90% | 基于规范解析，契约明确 |
| 查询实现 | ⚠️ 80% | 基础查询清晰，高级查询（关系链、上下文）不够详细 |

### 4.3 接口完整度

| 维度 | 评分 | 说明 |
|------|------|------|
| CLI 命令 | ✅ 90% | 6 个命令覆盖主要场景 |
| Module API | ⚠️ 75% | 接口签名完整，但实现逻辑有缺失 |
| 数据结构 | ✅ 90% | TypeScript 定义清晰 |

---

## 5. 评审结论

### 5.1 总体评价

| 维度 | 评分 | 说明 |
|------|------|------|
| 格式符合性 | ✅ 90% | 符合 spec-design 结构，缺 Risks 章节 |
| 需求覆盖度 | ⚠️ 80% | 核心能力覆盖，部分 API 实现细节不足 |
| 技术方案 | ✅ 85% | 架构合理，基础实现清晰 |
| 可实现性 | ✅ 90% | Implementation Plan 分阶段合理 |

**整体评分**：85%（通过，需修复关键问题后可进入开发阶段）

### 5.2 必须修复的问题（Blocker）

| # | 问题 | 优先级 | 修复建议 |
|---|------|--------|----------|
| 1 | 缺少 `getRelationChain()` 实现 | P0 | 添加实现或在 Decision Record 说明暂不支持 |
| 2 | `loadContext()` 实现细节不足 | P1 | 补充 tokenize/inferInputType 策略 |

### 5.3 建议修复的问题（Should Fix）

| # | 问题 | 优先级 | 修复建议 |
|---|------|--------|----------|
| 3 | `getProductOverview()` 实现逻辑缺失 | P1 | 添加 PRD 识别和 domains 组装逻辑 |
| 4 | `getContextForHook()` 与 state.json 集成不明确 | P1 | 明确数据来源 |
| 5 | `mtime` 字段变更未说明 | P2 | 在 Decision Record 补充说明 |
| 6 | 缺少 Risks 章节 | P2 | 评估 better-sqlite3 跨平台风险 |
| 7 | `impacts` 处理策略未记录 | P2 | 在 Decision Record 补充说明 |

### 5.4 评审建议

1. **优先修复 P0 问题**：`getRelationChain()` 是需求定义的 API，需明确处理方式
2. **细化 Phase 3 实现**：loadContext、getProductOverview、getContextForHook 是高级功能，建议在 Implementation Plan 中标注待细化
3. **补充 Decision Record**：mtime 字段变更、impacts 处理策略等设计决策应记录在案
4. **考虑添加 Risks**：better-sqlite3 的 native 依赖可能在某些环境下有问题

---

## 6. 设计亮点

1. **架构图清晰**：§2.3 的 ASCII 架构图直观展示了模块关系
2. **SQL Schema 完整**：§3.1 的 CREATE TABLE 语句可直接使用
3. **参考 devspec2**：借鉴成熟项目的全量同步策略，降低复杂度
4. **Decision Record 完善**：5 个关键决策都有记录，便于后续维护
5. **Implementation Plan 分阶段**：4 阶段 11 步，渐进式实现

---

*Reviewed by: Claude Opus 4.5*
*Date: 2025-12-25*
