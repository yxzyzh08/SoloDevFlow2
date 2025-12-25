---
type: design
version: "1.0"
inputs:
  - docs/requirements/features/fea-knowledge-base.md#feat_knowledge_base_intent
  - docs/requirements/capabilities/cap-document-validation.md#cap_document_validation_intent
---

# Design: Knowledge Base <!-- id: design_knowledge_base -->

> 产品知识库技术设计：SQLite 存储、Markdown 解析、查询接口

---

## 1. Input Requirements <!-- id: design_knowledge_base_input -->

本设计基于以下需求：

- [Feature - Knowledge Base](../requirements/features/fea-knowledge-base.md#feat_knowledge_base_intent) v1.4
- [Capability - Document Validation](../requirements/capabilities/cap-document-validation.md#cap_document_validation_intent) v1.2

**核心需求摘要**：

| 能力 | 说明 |
|------|------|
| C1 文档索引 | 扫描 docs/ 目录，提取元数据入库 |
| C2 关系存储 | 解析 Dependencies/Consumers 章节，建立关系图 |
| C3 关键词索引 | 从标题、章节、描述提取关键词 |
| C4 上下文查询 | 产品概览、文档查询、关系链 |
| C5 全量同步 | 每次同步清空并重建索引 |
| C6 规范解析 | 基于现有规范解析，无需额外 frontmatter |

---

## 2. Overview <!-- id: design_knowledge_base_overview -->

### 2.1 Design Goals

1. **简单可靠**：全量同步策略，避免复杂的增量逻辑
2. **零外部依赖**：仅使用 Node.js 内置模块 + better-sqlite3
3. **规范驱动**：基于 spec-meta/spec-requirements 定义的结构解析
4. **快速查询**：SQLite 索引优化，单查询 < 10ms

### 2.2 Constraints

| 约束 | 说明 |
|------|------|
| 运行环境 | Node.js 18+ |
| 数据库 | SQLite 3（通过 better-sqlite3） |
| 文件范围 | 仅索引 docs/ 目录下的 .md 文件 |
| 同步策略 | 全量同步（参考 devspec2 graph_sync.py） |

### 2.3 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    knowledge-base.js (CLI)                   │
│  Commands: sync | query | overview | context                │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  kb-parser.js   │  │  kb-store.js    │  │  kb-query.js    │
│  ─────────────  │  │  ─────────────  │  │  ─────────────  │
│  • scanDocs()   │  │  • initDB()     │  │  • findDocs()   │
│  • parseDoc()   │  │  • clearAll()   │  │  • getRelations()│
│  • extractID()  │  │  • insertDoc()  │  │  • loadContext()│
│  • extractRels()│  │  • insertRel()  │  │  • exists()     │
└─────────────────┘  └─────────────────┘  └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  knowledge.db   │
                    │  (SQLite)       │
                    └─────────────────┘
```

---

## 3. Technical Approach <!-- id: design_knowledge_base_approach -->

### 3.1 Data Model (SQLite Schema)

```sql
-- 1. 文档表
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,                    -- 锚点 ID: feat_xxx, cap_xxx
  type TEXT NOT NULL,                     -- prd/feature/capability/flow/spec/design
  name TEXT,                              -- 从标题提取
  path TEXT UNIQUE NOT NULL,              -- 相对路径: docs/requirements/features/fea-xxx.md
  summary TEXT,                           -- 从 Intent/Overview 提取
  domain TEXT,                            -- 所属领域（可为 null）
  raw_content TEXT,                       -- 原始 Markdown 内容
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 2. 关系表
CREATE TABLE IF NOT EXISTS relations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_id TEXT NOT NULL,                -- 来源文档 ID
  target_id TEXT NOT NULL,                -- 目标文档 ID
  type TEXT NOT NULL,                     -- depends/extends/consumes/defines
  description TEXT,                       -- 关系说明
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (source_id) REFERENCES documents(id),
  UNIQUE(source_id, target_id, type)
);

-- 3. 关键词表
CREATE TABLE IF NOT EXISTS keywords (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  doc_id TEXT NOT NULL,                   -- 文档 ID
  keyword TEXT NOT NULL,                  -- 关键词（小写）
  source TEXT NOT NULL,                   -- title/section/description
  FOREIGN KEY (doc_id) REFERENCES documents(id),
  UNIQUE(doc_id, keyword)
);

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);
CREATE INDEX IF NOT EXISTS idx_documents_domain ON documents(domain);
CREATE INDEX IF NOT EXISTS idx_relations_source ON relations(source_id);
CREATE INDEX IF NOT EXISTS idx_relations_target ON relations(target_id);
CREATE INDEX IF NOT EXISTS idx_relations_type ON relations(type);
CREATE INDEX IF NOT EXISTS idx_keywords_doc ON keywords(doc_id);
CREATE INDEX IF NOT EXISTS idx_keywords_keyword ON keywords(keyword);
```

### 3.2 Sync Strategy (Full Sync)

参考 devspec2 的 `graph_sync.py`，采用全量同步策略：

```
sync() 流程:
  1. 开始事务
  2. 清空所有表 (DELETE FROM keywords; DELETE FROM relations; DELETE FROM documents;)
  3. 扫描 docs/ 目录
  4. 对每个 .md 文件:
     a. 调用 validate-docs.js 验证格式
     b. 解析 frontmatter 获取 type
     c. 提取锚点 ID
     d. 提取 name、summary、domain
     e. 提取 Dependencies/Consumers 关系
     f. 提取关键词
     g. 插入 documents、relations、keywords 表
  5. 提交事务
  6. 输出 SyncReport
```

**SyncReport 结构**：

```javascript
{
  success: number,      // 成功索引的文档数
  failed: number,       // 失败的文档数
  relations: number,    // 提取的关系数
  keywords: number,     // 提取的关键词数
  duration_ms: number,  // 耗时
  errors: [{ path, error }]  // 错误详情
}
```

### 3.3 Parsing Rules

#### 3.3.1 ID 提取

```javascript
// 正则匹配 HTML 注释锚点
const ANCHOR_PATTERN = /<!--\s*id:\s*(\w+)\s*-->/;

// 从标题行提取
// # Feature: Knowledge Base <!-- id: feat_knowledge_base -->
// 结果: feat_knowledge_base
```

#### 3.3.2 类型检测

```javascript
// 从 ID 前缀检测类型
const TYPE_PREFIX_MAP = {
  'prod_': 'prd',
  'feat_': 'feature',
  'cap_': 'capability',
  'flow_': 'flow',
  'spec_': 'spec',
  'design_': 'design'
};

// 或从 frontmatter.type 获取
```

#### 3.3.3 关系提取

从 Dependencies 章节表格提取：

```markdown
## Dependencies
| Dependency | Type | 说明 |
|------------|------|------|
| spec-meta | hard | 依赖元规范 |
```

解析规则：
- `Type=hard` → 关系类型 `depends`
- `Type=soft` → 关系类型 `extends`
- Dependency 列为目标 ID（需转换为锚点格式）

从 Consumers 章节表格提取：

```markdown
## Consumers
| Consumer | 使用场景 |
|----------|----------|
| flow_workflows | 意图识别 |
```

解析规则：
- Consumer 列为来源 ID
- 当前文档为目标 ID
- 关系类型为 `consumes`

#### 3.3.4 关键词提取

```javascript
function extractKeywords(doc) {
  const keywords = [];

  // 1. 从标题提取 (source: title)
  // # Feature: Knowledge Base → ['knowledge', 'base']

  // 2. 从章节标题提取 (source: section)
  // ## Core Capabilities → ['core', 'capabilities']

  // 3. 从 frontmatter.domain 提取 (source: description)
  // domain: process → ['process']

  // 4. 从 summary/description 提取 (source: description)
  // > 产品知识库 → ['产品', '知识库']

  return dedup(keywords.map(k => k.toLowerCase()));
}
```

### 3.4 Query Implementation

#### 3.4.1 文档查询

```javascript
findDocuments({ type, domain, keyword }) {
  let sql = 'SELECT * FROM documents WHERE 1=1';
  const params = [];

  if (type) {
    sql += ' AND type = ?';
    params.push(type);
  }
  if (domain) {
    sql += ' AND domain = ?';
    params.push(domain);
  }
  if (keyword) {
    sql += ' AND id IN (SELECT doc_id FROM keywords WHERE keyword LIKE ?)';
    params.push(`%${keyword.toLowerCase()}%`);
  }

  return db.prepare(sql).all(...params);
}
```

#### 3.4.2 关系查询

```javascript
getRelations(docId, direction) {
  if (direction === 'outgoing') {
    return db.prepare(`
      SELECT r.*, d.name as target_name, d.type as target_type
      FROM relations r
      JOIN documents d ON r.target_id = d.id
      WHERE r.source_id = ?
    `).all(docId);
  } else {
    return db.prepare(`
      SELECT r.*, d.name as source_name, d.type as source_type
      FROM relations r
      JOIN documents d ON r.source_id = d.id
      WHERE r.target_id = ?
    `).all(docId);
  }
}

getImpactedDocuments(docId) {
  // 反向查询所有 depends/consumes 关系
  return db.prepare(`
    SELECT DISTINCT d.*
    FROM documents d
    JOIN relations r ON d.id = r.source_id
    WHERE r.target_id = ?
    AND r.type IN ('depends', 'consumes')
  `).all(docId);
}
```

#### 3.4.3 上下文加载

```javascript
loadContext(userInput) {
  // 1. 分词并提取关键词
  const inputKeywords = tokenize(userInput);

  // 2. 查询匹配的文档
  const matchedDocs = [];
  for (const kw of inputKeywords) {
    const docs = findDocuments({ keyword: kw });
    matchedDocs.push(...docs);
  }

  // 3. 去重并按匹配度排序
  const relevantDocs = dedup(matchedDocs).slice(0, 5);

  // 4. 判断 suggestedType
  const suggestedType = inferInputType(userInput, relevantDocs);

  return {
    relevantDocs,
    matchedKeywords: inputKeywords.filter(k => /* 有匹配 */),
    suggestedType
  };
}
```

---

## 4. Interface Design <!-- id: design_knowledge_base_interface -->

### 4.1 CLI Commands

```bash
# 全量同步
node scripts/knowledge-base.js sync
# 输出: SyncReport JSON

# 查询文档
node scripts/knowledge-base.js query --type=feature --domain=process
node scripts/knowledge-base.js query --keyword="状态"

# 产品概览
node scripts/knowledge-base.js overview
# 输出: ProductOverview JSON

# 上下文加载
node scripts/knowledge-base.js context "登录功能怎么实现的"
# 输出: ContextResult JSON

# 存在性检查
node scripts/knowledge-base.js exists "state-management"
# 输出: true/false

# 影响分析
node scripts/knowledge-base.js impact "spec-meta"
# 输出: Document[] JSON
```

### 4.2 Module API

```typescript
// kb-store.js
interface KBStore {
  initDB(): void;
  clearAll(): void;
  insertDocument(doc: Document): void;
  insertRelation(rel: Relation): void;
  insertKeyword(kw: Keyword): void;
  getDocument(id: string): Document | null;
  close(): void;
}

// kb-parser.js
interface KBParser {
  scanDocs(docsDir: string): string[];
  parseDoc(filePath: string): ParsedDoc;
  extractId(content: string): string | null;
  extractRelations(content: string, docId: string): Relation[];
  extractKeywords(content: string, docId: string): Keyword[];
}

// kb-query.js (knowledge-base.js 导出)
interface KnowledgeBase {
  sync(): SyncReport;
  findDocuments(query: QueryOptions): Document[];
  exists(name: string, type?: string): boolean;
  getRelations(docId: string, direction: 'outgoing' | 'incoming'): Relation[];
  getImpactedDocuments(docId: string): Document[];
  loadContext(userInput: string): ContextResult;
  getProductOverview(): ProductOverview;
  getContextForHook(): HookContext;
}
```

### 4.3 Data Structures

```typescript
interface Document {
  id: string;           // feat_xxx
  type: string;         // feature/capability/flow/...
  name: string;         // Knowledge Base
  path: string;         // docs/requirements/features/fea-knowledge-base.md
  summary: string;      // 产品知识库，提供文档索引...
  domain: string | null;// process
}

interface Relation {
  source_id: string;
  target_id: string;
  type: 'depends' | 'extends' | 'consumes' | 'defines';
  description?: string;
}

interface Keyword {
  doc_id: string;
  keyword: string;
  source: 'title' | 'section' | 'description';
}

interface SyncReport {
  success: number;
  failed: number;
  relations: number;
  keywords: number;
  duration_ms: number;
  errors: Array<{ path: string; error: string }>;
}

interface ContextResult {
  relevantDocs: Document[];
  matchedKeywords: string[];
  suggestedType: InputType;
}

type InputType =
  | 'direct_execute'
  | 'consult'
  | 'new_requirement'
  | 'requirement_change'
  | 'spec_change'
  | 'irrelevant'
  | 'unknown';
```

---

## 5. Decision Record <!-- id: design_knowledge_base_decisions -->

| Decision | Options | Choice | Rationale |
|----------|---------|--------|-----------|
| 数据库 | SQLite / LevelDB / JSON | **SQLite** | 支持复杂查询、索引优化、事务 |
| 同步策略 | 增量 / 全量 | **全量** | 简单可靠，参考 devspec2 实践 |
| SQLite 驱动 | better-sqlite3 / sql.js | **better-sqlite3** | 同步 API、性能更好 |
| 关键词权重 | 权重分数 / 简单来源标记 | **来源标记** | 简化实现，满足当前需求 |
| 原始内容存储 | 存储 / 不存储 | **存储** | 支持后续扩展（参考 devspec2 raw_yaml） |

---

## 6. Dependencies <!-- id: design_knowledge_base_dependencies -->

| Dependency | Type | 说明 |
|------------|------|------|
| cap_document_validation | hard | 同步前调用验证，确保文档格式正确 |
| spec_meta | hard | 锚点格式和 ID 前缀规则 |
| spec_requirements | hard | 文档结构和章节定义 |

---

## 7. Implementation Plan <!-- id: design_knowledge_base_impl -->

### Phase 1: 基础框架

1. 创建 `scripts/lib/kb-store.js` - SQLite 存储层
2. 创建 `scripts/lib/kb-parser.js` - Markdown 解析器
3. 创建 `scripts/knowledge-base.js` - CLI 入口

### Phase 2: 核心功能

4. 实现 `sync` 命令 - 全量同步
5. 实现 `query` 命令 - 文档查询
6. 实现 `overview` 命令 - 产品概览

### Phase 3: 高级功能

7. 实现 `context` 命令 - 上下文加载
8. 实现 `impact` 命令 - 影响分析
9. 实现 `getContextForHook()` - Hook 集成

### Phase 4: 测试与集成

10. 编写单元测试
11. 集成到工作流

---

*Version: v1.0*
*Created: 2025-12-25*
*Updated: 2025-12-25*
