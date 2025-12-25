---
type: feature
version: "1.7"
priority: P0
domain: process
---

# Feature: Knowledge Base <!-- id: feat_knowledge_base -->

> 产品知识库，提供文档索引、关系查询、上下文加载能力，为 AI 提供结构化产品知识

---

## 1. Intent <!-- id: feat_knowledge_base_intent -->

### 1.1 Problem

- AI 无法快速定位相关文档，每次需要重新搜索文件
- 文档间的依赖关系（depends/extends/impacts）没有结构化存储，影响分析靠人工判断
- AI 缺乏产品上下文，难以区分"新增需求"和"需求变更"
- 咨询类问题无法精准定位到相关 Feature/Capability/Flow

### 1.2 Value

- **快速上下文加载**：AI 启动时可获取产品概览，为 Claude 提供结构化产品知识
- **关系可查询**：支持正向（A 依赖什么）和反向（谁依赖 A）查询
- **存在性判断**：提供 `exists()` 接口，帮助 Claude 判断 Feature 是否已存在
- **无额外元数据**：基于现有规范解析文档内容，不要求增加 frontmatter

### 1.3 职责边界

> 知识库是**静态知识提供者**，不做意图判断

| 知识库职责 | 非知识库职责 |
|-----------|-------------|
| ✅ 提供产品结构（Features、Domains） | ❌ 理解用户意图 |
| ✅ 关键词搜索文档 | ❌ 语义相关性判断 |
| ✅ 查询文档关系（依赖/影响） | ❌ 判断"这是咨询还是需求" |
| ✅ 判断 Feature 是否存在 | ❌ 从混合输入提取需求 |

**意图识别由 Claude 主 Agent 根据 workflows.md 规则完成**，知识库仅提供数据支撑。

---

## 2. Scope <!-- id: feat_knowledge_base_scope -->

### 2.1 In Scope

- SQLite 存储结构定义（文档、关系、关键词索引）
- 文档解析规则（基于元规范和需求规范）
- 查询接口定义（按类型、按关键词、按关系）
- 与状态管理（state.json）的集成

### 2.2 Out of Scope

- 全文搜索引擎（使用 SQLite FTS 足够）
- 云端同步或远程知识库
- 代码文件级别的索引（仅文档）

---

## 3. Core Capabilities <!-- id: feat_knowledge_base_capabilities -->

| ID | Capability | 描述 |
|----|------------|------|
| C1 | 文档索引 | 扫描并解析 docs/ 目录下的规范文档，提取元数据入库 |
| C2 | 关系存储 | 解析 Dependencies/Consumers 章节，建立文档间关系图 |
| C3 | 关键词索引 | 从文档标题、章节标题、描述提取关键词，支持模糊匹配 |
| C4 | 上下文查询 | 提供 API：获取产品概览、查询相关文档、获取关系链 |
| C5 | 全量同步 | 每次同步清空并重建索引，简单可靠 |
| C6 | 规范解析 | 使用现有规范作为解析契约，无需额外 frontmatter |

---

## 4. Data Model <!-- id: feat_knowledge_base_data_model -->

### 4.1 Document Table

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | TEXT PK | 文档锚点 ID（如 `feat_state_management`） |
| `type` | TEXT | 文档类型：`prd`/`feature`/`capability`/`flow`/`spec`/`design` |
| `name` | TEXT | 文档名称（从标题提取） |
| `path` | TEXT | 文件路径（相对于项目根目录） |
| `summary` | TEXT | 摘要（从 Intent/Overview 提取） |
| `domain` | TEXT | 所属 Domain（可为 null） |

### 4.2 Relation Table

| 字段 | 类型 | 说明 |
|------|------|------|
| `source_id` | TEXT FK | 来源文档 ID |
| `target_id` | TEXT FK | 目标文档 ID |
| `type` | TEXT | 关系类型：`depends`/`extends`/`defines`/`consumes` |

**关系类型说明**：

| 类型 | 语义 | 解析来源 | 存储 |
|------|------|----------|------|
| `depends` | A 依赖 B（A 需要 B 先完成） | Dependencies 章节 | 是 |
| `extends` | A 扩展 B（A 是 B 的增强） | Dependencies 章节 | 是 |
| `defines` | 规范 A 定义文档类型 B | 元规范映射 | 是 |
| `consumes` | A 使用 Capability B | Consumers 章节 | 是 |

> **注**：`impacts`（影响关系）不存储在 relations 表中，而是通过 `getImpactedDocuments()` 反向查询 `depends`/`consumes` 关系计算得到。

### 4.3 Keyword Table

| 字段 | 类型 | 说明 |
|------|------|------|
| `doc_id` | TEXT FK | 文档 ID |
| `keyword` | TEXT | 关键词（小写） |
| `source` | TEXT | 来源：`title`/`section`/`description` |

> **简化说明**：不使用权重系统，通过 source 字段区分关键词来源即可满足查询需求。

---

## 5. Query Interfaces <!-- id: feat_knowledge_base_interfaces -->

### 5.1 产品概览

```
getProductOverview() → {
  prd: Document,
  domains: [{ name, description, features: [Document] }],
  capabilities: [Document],
  flows: [Document]
}
```

### 5.2 文档查询

```
findDocuments(query: {
  type?: DocType,
  domain?: string,
  keyword?: string
}) → Document[]

exists(name: string, type?: DocType) → boolean
  判断指定名称的 Feature/Capability/Flow 是否已存在
  用于区分"新增需求"和"需求变更"
```

### 5.3 关系查询

```
getRelations(docId: string, direction: 'outgoing' | 'incoming') → Relation[]

getRelationChain(docId: string, type: RelationType, depth?: number) → Graph

getImpactedDocuments(docId: string) → Document[]
  返回受指定文档变更影响的所有文档
  通过反向查询 depends/consumes 关系实现
  用于规范变更和需求变更的影响分析
```

### 5.4 关键词搜索（简化）

```
searchByKeywords(keywords: string[]) → Document[]
```

基于关键词返回匹配的文档列表。

**说明**：
- 从用户输入中提取关键词由调用方（Hook 或 Claude）完成
- 知识库只做简单的关键词匹配，不做语义理解
- 返回结果按匹配度排序（标题匹配 > 章节匹配 > 描述匹配）

> **已移除**：原 `loadContext()` 接口包含 `suggestedType` 意图建议，因意图识别需要语义理解能力，已改由 Claude 主 Agent 完成。

### 5.5 Hook 集成

```
getContextForHook() → {
  productOverview: {
    name: string,
    description: string,
    activeFeatures: string[]
  },
  featureList: [{ name: string, status: string, domain: string }],
  currentFeature: Feature | null
}
```

为 `UserPromptSubmit` Hook 提供精简上下文（~200 tokens），包含：
- 产品基本信息和当前活跃 Feature
- Feature 列表摘要（名称、状态、领域）
- 当前正在处理的 Feature（如有）

---

## 6. Parsing Rules <!-- id: feat_knowledge_base_parsing -->

### 6.1 基于规范的解析契约

| 文档类型 | 规范来源 | 提取内容 |
|----------|----------|----------|
| PRD | spec-requirements.md#3 | Vision、Domains、Feature 列表 |
| Feature | spec-requirements.md#4 | Intent、Capabilities、Dependencies |
| Capability | spec-requirements.md#5 | Intent、Consumers、Requirements |
| Flow | spec-requirements.md#6 | Overview、Participants、Steps |
| Spec | spec-meta.md | type、defines、锚点 |
| Design | spec-design.md | 待定（设计文档结构） |

### 6.2 ID 提取规则

从 Markdown 标题中的锚点提取：

```markdown
# Feature: State Management <!-- id: feat_state_management -->
```

提取结果：`feat_state_management`

### 6.3 关系提取规则

从 Dependencies/Consumers 章节提取：

```markdown
## Dependencies

| Dependency | Type | 说明 |
|------------|------|------|
| requirements-doc | hard | 状态管理需遵循 Feature Spec 结构定义 |
```

提取结果：`{ source: current_doc, target: "requirements-doc", type: "depends" }`

---

## 7. Acceptance Criteria <!-- id: feat_knowledge_base_acceptance -->

| Item | Verification | Pass Criteria |
|------|--------------|---------------|
| 文档索引 | 运行 `knowledge-base sync` | 所有 docs/ 下的 .md 文件被索引 |
| 关系存储 | 查询 relations 表 | Dependencies 章节正确解析为关系记录 |
| 关键词查询 | `findDocuments({ keyword: "状态" })` | 返回 state-management 相关文档 |
| 关键词搜索 | `searchByKeywords(["登录", "认证"])` | 返回相关文档列表，按匹配度排序 |
| 存在性检查 | `exists("state-management")` | 返回 true |
| 影响分析 | `getImpactedDocuments("spec-meta")` | 返回依赖该规范的文档列表 |
| Hook 上下文 | `getContextForHook()` | 返回精简上下文（< 200 tokens） |
| 全量同步 | 运行 `knowledge-base sync` | 清空并重建所有索引，输出同步报告 |
| 无额外元数据 | 检查文档 | 现有文档无需修改即可被解析 |

---

## 8. Dependencies <!-- id: feat_knowledge_base_dependencies -->

| Dependency | Type | 说明 |
|------------|------|------|
| spec-meta | hard | 依赖元规范定义的锚点和类型系统 |
| spec-requirements | hard | 依赖需求规范定义的文档结构 |
| cap-document-validation | hard | 解析前调用验证能力确保文档格式正确 |
| state-management | soft | 可与 state.json 的 features/domains 数据互补 |

---

## 9. Consumers <!-- id: feat_knowledge_base_consumers -->

| Consumer | 使用场景 |
|----------|----------|
| flow_workflows | 咨询流程、需求流程中的关系分析 |
| feat_change_impact_tracking | 变更影响分析，通过 `getImpactedDocuments()` |
| UserPromptSubmit Hook | 上下文注入，通过 `getContextForHook()` |
| requirements-expert | 需求澄清时判断 Feature 是否存在 |

---

## 10. Artifacts <!-- id: feat_knowledge_base_artifacts -->

| Type | Path | Description |
|------|------|-------------|
| Design | docs/designs/des-knowledge-base.md | 设计文档（设计阶段填写） |
| Code | src/cli/knowledge-base.js | 知识库 CLI（sync/query） |
| Code | src/lib/kb-parser.js | 文档解析器 |
| Code | src/lib/kb-store.js | SQLite 存储层 |
| Data | .solodevflow/knowledge.db | SQLite 数据库文件 |
| Test | tests/knowledge-base.test.js | 单元测试 |

**Design Depth**: Required（需要设计文档）

---

## 11. Open Questions <!-- id: feat_knowledge_base_questions -->

| Question | Context | Impact |
|----------|---------|--------|
| 是否需要支持代码文件索引？ | 当前仅索引文档，代码级别影响分析依赖 state.json artifacts | 可后续扩展 |
| 如何处理跨产品引用？ | 当前仅支持单项目 | 可通过 project scope 过滤 |

---

*Version: v1.7*
*Created: 2024-12-24*
*Updated: 2025-12-25*
*Changes: v1.7 明确职责边界（静态知识提供者），移除 loadContext 的 suggestedType（意图识别由 Claude 完成），简化为 searchByKeywords; v1.6 明确 impacts 为计算值（非存储），从 relations.type 中移除; v1.5 移除 mtime 字段（全量同步不需要）; v1.4 简化需求：C5 改为全量同步、移除关键词权重系统; v1.3 扩展 suggestedType、添加新 API、添加 Consumers 章节; v1.2 添加 cap-document-validation 依赖; v1.1 添加 frontmatter 可选字段*
