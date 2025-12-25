---
type: design
version: "1.2"
inputs:
  - docs/requirements/features/fea-knowledge-base.md#feat_knowledge_base_intent
  - docs/requirements/capabilities/cap-document-validation.md#cap_document_validation_intent
---

# Design: Knowledge Base <!-- id: design_knowledge_base -->

> 产品知识库技术设计：SQLite 存储、Markdown 解析、查询接口

---

## 1. Input Requirements <!-- id: design_knowledge_base_input -->

本设计基于以下需求：

- [Feature - Knowledge Base](../requirements/features/fea-knowledge-base.md#feat_knowledge_base_intent) v1.7
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

**职责边界**（v1.7 明确）：

知识库是**静态知识提供者**，不做意图判断。意图识别由 Claude 主 Agent 完成。

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
│  Commands: sync | query | search | overview | hook-context  │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  kb-parser.js   │  │  kb-store.js    │  │  (integrated)   │
│  ─────────────  │  │  ─────────────  │  │  ─────────────  │
│  • scanDocs()   │  │  • initDB()     │  │  • findDocs()   │
│  • parseDoc()   │  │  • clearAll()   │  │  • getRelations()│
│  • extractID()  │  │  • insertDoc()  │  │  • searchByKw() │
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
  // 反向查询所有 depends/consumes 关系（计算 impacts）
  return db.prepare(`
    SELECT DISTINCT d.*
    FROM documents d
    JOIN relations r ON d.id = r.source_id
    WHERE r.target_id = ?
    AND r.type IN ('depends', 'consumes')
  `).all(docId);
}

getRelationChain(docId, relationType, maxDepth = 5) {
  // 使用 BFS 查找关系链（参考 devspec2 的 find_path 实现）
  const visited = new Set([docId]);
  const queue = [{ id: docId, path: [docId], depth: 0 }];
  const result = { nodes: [], edges: [] };

  while (queue.length > 0) {
    const { id, path, depth } = queue.shift();

    if (depth >= maxDepth) continue;

    // 获取指定类型的出边关系
    const relations = db.prepare(`
      SELECT target_id, type FROM relations
      WHERE source_id = ? AND (? IS NULL OR type = ?)
    `).all(id, relationType, relationType);

    for (const rel of relations) {
      result.edges.push({ source: id, target: rel.target_id, type: rel.type });

      if (!visited.has(rel.target_id)) {
        visited.add(rel.target_id);
        result.nodes.push(rel.target_id);
        queue.push({
          id: rel.target_id,
          path: [...path, rel.target_id],
          depth: depth + 1
        });
      }
    }
  }

  return result;  // { nodes: string[], edges: Edge[] }
}
```

#### 3.4.3 产品概览

```javascript
getProductOverview() {
  // 1. 获取 PRD 文档（type='prd'）
  const prd = db.prepare('SELECT * FROM documents WHERE type = ?').get('prd');

  // 2. 获取所有 domains（从 state.json 读取或从文档 domain 字段聚合）
  const domains = db.prepare(`
    SELECT DISTINCT domain FROM documents WHERE domain IS NOT NULL
  `).all().map(row => {
    const features = db.prepare(`
      SELECT * FROM documents WHERE domain = ? AND type = 'feature'
    `).all(row.domain);
    return { name: row.domain, features };
  });

  // 3. 获取所有 capabilities
  const capabilities = db.prepare('SELECT * FROM documents WHERE type = ?').all('capability');

  // 4. 获取所有 flows
  const flows = db.prepare('SELECT * FROM documents WHERE type = ?').all('flow');

  return { prd, domains, capabilities, flows };
}
```

#### 3.4.4 关键词搜索

> **简化设计**（v1.2）：移除意图推断职责，仅提供关键词匹配能力。意图识别由 Claude 完成。

```javascript
/**
 * 基于关键词搜索文档
 * @param {string[]} keywords - 关键词数组
 * @returns {Document[]} - 匹配的文档列表，按匹配度排序
 */
searchByKeywords(keywords) {
  if (!keywords || keywords.length === 0) {
    return [];
  }

  // 1. 查询每个关键词匹配的文档
  const matchCounts = new Map(); // docId -> { doc, count, sources }

  for (const kw of keywords) {
    const keyword = kw.toLowerCase().trim();
    if (!keyword) continue;

    // 查询匹配的关键词记录
    const matches = db.prepare(`
      SELECT k.doc_id, k.source, d.*
      FROM keywords k
      JOIN documents d ON k.doc_id = d.id
      WHERE k.keyword LIKE ?
    `).all(`%${keyword}%`);

    for (const match of matches) {
      const existing = matchCounts.get(match.doc_id);
      if (existing) {
        existing.count++;
        existing.sources.add(match.source);
      } else {
        matchCounts.set(match.doc_id, {
          doc: {
            id: match.id,
            type: match.type,
            name: match.name,
            path: match.path,
            summary: match.summary,
            domain: match.domain
          },
          count: 1,
          sources: new Set([match.source])
        });
      }
    }
  }

  // 2. 按匹配度排序（标题匹配 > 章节匹配 > 描述匹配）
  const results = Array.from(matchCounts.values())
    .map(item => ({
      ...item.doc,
      matchCount: item.count,
      matchSources: Array.from(item.sources)
    }))
    .sort((a, b) => {
      // 优先级：title > section > description
      const sourceScore = (sources) => {
        if (sources.includes('title')) return 3;
        if (sources.includes('section')) return 2;
        return 1;
      };
      const scoreA = sourceScore(a.matchSources);
      const scoreB = sourceScore(b.matchSources);
      if (scoreA !== scoreB) return scoreB - scoreA;
      return b.matchCount - a.matchCount;
    });

  // 3. 返回前 10 条结果
  return results.slice(0, 10);
}
```

**说明**：
- 关键词由调用方（Hook 或 Claude）从用户输入中提取
- 知识库只做简单的关键词匹配，不做语义理解
- 返回结果按匹配度排序：标题匹配优先于章节匹配，章节匹配优先于描述匹配

#### 3.4.5 Hook 上下文

```javascript
getContextForHook() {
  // 从 state.json 读取活跃状态（与 state-management 集成）
  const state = JSON.parse(fs.readFileSync('.solodevflow/state.json', 'utf-8'));

  // 1. 产品概览（精简版）
  const productOverview = {
    name: state.project.name,
    description: state.project.description,
    activeFeatures: state.flow.activeFeatures || []
  };

  // 2. Feature 列表摘要
  const featureList = Object.entries(state.features)
    .filter(([_, f]) => f.type === 'code' || f.type === 'document')
    .map(([id, f]) => ({
      name: id,
      status: f.status,
      domain: f.domain
    }));

  // 3. 当前 Feature（取 activeFeatures 的第一个）
  const currentFeatureId = state.flow.activeFeatures?.[0];
  const currentFeature = currentFeatureId ? state.features[currentFeatureId] : null;

  return { productOverview, featureList, currentFeature };
}
```

---

## 4. Interface Design <!-- id: design_knowledge_base_interface -->

### 4.1 CLI Commands

```bash
# 全量同步
node src/cli/knowledge-base.js sync
# 输出: SyncReport JSON

# 查询文档
node src/cli/knowledge-base.js query --type=feature --domain=process
node src/cli/knowledge-base.js query --keyword="状态"

# 关键词搜索（v1.2 新增）
node src/cli/knowledge-base.js search "登录" "认证" "用户"
node src/cli/knowledge-base.js search "登录" --json
# 输出: Document[] JSON（按匹配度排序）

# 产品概览
node src/cli/knowledge-base.js overview
# 输出: ProductOverview JSON

# 存在性检查
node src/cli/knowledge-base.js exists "state-management"
# 输出: true/false

# 影响分析
node src/cli/knowledge-base.js impact "spec-meta"
# 输出: Document[] JSON

# 关系链查询
node src/cli/knowledge-base.js chain "feat_knowledge_base" --type=depends --depth=3
# 输出: Graph JSON { nodes, edges }

# Hook 上下文
node src/cli/knowledge-base.js hook-context
# 输出: HookContext JSON

# 统计信息
node src/cli/knowledge-base.js stats
# 输出: { documents, relations, keywords }
```

> **已移除**：`context` 命令（原返回 suggestedType），因意图识别由 Claude 完成，改为 `search` 命令仅返回匹配文档。

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
  findDocuments(query: QueryOptions): Document[];
  exists(name: string, type?: string): boolean;
  searchByKeywords(keywords: string[]): SearchResult[];  // v1.2 新增
  getRelations(docId: string, direction: 'outgoing' | 'incoming'): Relation[];
  getImpactedDocuments(docId: string): Document[];
  getRelationChain(docId: string, type?: string, depth?: number): Graph;
  getProductOverview(): ProductOverview;
  getStats(): Stats;
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

// knowledge-base.js (CLI 导出)
interface KnowledgeBaseCLI {
  sync(): SyncReport;
  query(options: QueryOptions): Document[];
  search(keywords: string[]): SearchResult[];  // v1.2 新增
  overview(): ProductOverview;
  exists(name: string, type?: string): boolean;
  impact(docId: string): Document[];
  chain(docId: string, options?: ChainOptions): Graph;
  hookContext(): HookContext;
  stats(): Stats;
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

// v1.2 新增：关键词搜索结果
interface SearchResult extends Document {
  matchCount: number;           // 匹配的关键词数量
  matchSources: string[];       // 匹配来源：['title', 'section', 'description']
}

interface Stats {
  documents: number;
  relations: number;
  keywords: number;
}

interface HookContext {
  productOverview: {
    name: string;
    description: string;
    activeFeatures: string[];
  };
  featureList: Array<{
    name: string;
    status: string;
    domain: string;
  }>;
  currentFeature: Feature | null;
}
```

> **已移除**：`ContextResult` 和 `InputType`（v1.1 定义），因意图识别职责已移交给 Claude。

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

### Phase 1: 基础框架 ✅

1. 创建 `src/lib/kb-store.js` - SQLite 存储层
2. 创建 `src/lib/kb-parser.js` - Markdown 解析器
3. 创建 `src/cli/knowledge-base.js` - CLI 入口

### Phase 2: 核心功能 ✅

4. 实现 `sync` 命令 - 全量同步
5. 实现 `query` 命令 - 文档查询
6. 实现 `overview` 命令 - 产品概览
7. 实现 `exists` 命令 - 存在性检查

### Phase 3: 高级功能 ✅

8. 实现 `impact` 命令 - 影响分析
9. 实现 `chain` 命令 - 关系链查询（BFS）
10. 实现 `hook-context` 命令 - Hook 上下文（集成 state.json）
11. 实现 `stats` 命令 - 统计信息

### Phase 4: v1.2 更新

12. 实现 `search` 命令 - 关键词搜索（替代原 context 命令）
13. 更新单元测试

### Phase 5: 集成

14. 与 UserPromptSubmit Hook 集成

---

*Version: v1.2*
*Created: 2025-12-25*
*Updated: 2025-12-25*
*Changes: v1.2 根据需求 v1.7 更新：移除意图识别职责（suggestedType），将 loadContext 简化为 searchByKeywords，更新 CLI 命令和接口定义；v1.1 根据评审修复：添加 getRelationChain() BFS 实现、补充 getProductOverview()/loadContext()/getContextForHook() 实现逻辑、明确 state.json 集成方式、新增 chain/hook-context CLI 命令*
