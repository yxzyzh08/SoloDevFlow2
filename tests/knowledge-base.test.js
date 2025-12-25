/**
 * Knowledge Base 单元测试
 *
 * 使用 Node.js 内置测试运行器
 * 运行: node --test tests/knowledge-base.test.js
 */

const { test, describe, before, after, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

// 测试模块
const {
  scanDocs,
  parseDoc,
  parseFrontmatter,
  extractId,
  extractName,
  extractSummary,
  extractDependencies,
  extractConsumers,
  extractKeywords,
  detectTypeFromId
} = require('../src/lib/kb-parser');

const { KBStore } = require('../src/lib/kb-store');

// 测试数据库（每个测试使用唯一的数据库文件，在 afterEach 中清理）

// ============================================================================
// kb-parser.js 测试
// ============================================================================

describe('kb-parser', () => {

  describe('parseFrontmatter', () => {
    test('应解析标准 frontmatter', () => {
      const content = `---
type: feature
version: "1.0"
domain: process
---

# Title`;
      const result = parseFrontmatter(content);
      assert.strictEqual(result.type, 'feature');
      assert.strictEqual(result.version, '1.0');
      assert.strictEqual(result.domain, 'process');
    });

    test('无 frontmatter 时返回空对象', () => {
      const content = '# Just a title';
      const result = parseFrontmatter(content);
      assert.deepStrictEqual(result, {});
    });

    test('应处理带引号的值', () => {
      const content = `---
name: "Test Name"
desc: 'Single quoted'
---`;
      const result = parseFrontmatter(content);
      assert.strictEqual(result.name, 'Test Name');
      assert.strictEqual(result.desc, 'Single quoted');
    });
  });

  describe('extractId', () => {
    test('应从标题提取锚点 ID', () => {
      const content = '# Feature: Test <!-- id: feat_test -->\n\nContent here';
      const id = extractId(content);
      assert.strictEqual(id, 'feat_test');
    });

    test('应处理多级标题', () => {
      const content = '## Section <!-- id: section_id -->\n\nContent';
      const id = extractId(content);
      assert.strictEqual(id, 'section_id'); // 从任意级别标题提取
    });

    test('无锚点时返回 null', () => {
      const content = '# Title without anchor\n\nContent';
      const id = extractId(content);
      assert.strictEqual(id, null);
    });
  });

  describe('extractName', () => {
    test('应从标题提取名称', () => {
      const content = '# Feature: State Management <!-- id: feat_state -->';
      const name = extractName(content);
      assert.strictEqual(name, 'State Management');
    });

    test('应移除类型前缀', () => {
      const content = '# Capability: Document Validation <!-- id: cap_doc -->';
      const name = extractName(content);
      assert.strictEqual(name, 'Document Validation');
    });

    test('应处理无类型前缀的标题', () => {
      const content = '# Simple Title <!-- id: simple -->';
      const name = extractName(content);
      assert.strictEqual(name, 'Simple Title');
    });
  });

  describe('extractSummary', () => {
    test('应从引用块提取摘要', () => {
      const content = `# Title <!-- id: test -->

> This is the summary description

## Content`;
      const summary = extractSummary(content);
      assert.strictEqual(summary, 'This is the summary description');
    });

    test('应跳过带粗体的引用块', () => {
      const content = `# Title <!-- id: test -->

> **Note**: This is not a summary

> This is the real summary`;
      const summary = extractSummary(content);
      assert.strictEqual(summary, 'This is the real summary');
    });
  });

  describe('detectTypeFromId', () => {
    test('应检测 feature 类型', () => {
      assert.strictEqual(detectTypeFromId('feat_test'), 'feature');
    });

    test('应检测 capability 类型', () => {
      assert.strictEqual(detectTypeFromId('cap_test'), 'capability');
    });

    test('应检测 flow 类型', () => {
      assert.strictEqual(detectTypeFromId('flow_test'), 'flow');
    });

    test('应检测 spec 类型', () => {
      assert.strictEqual(detectTypeFromId('spec_test'), 'spec');
    });

    test('应检测 design 类型', () => {
      assert.strictEqual(detectTypeFromId('design_test'), 'design');
      assert.strictEqual(detectTypeFromId('des_test'), 'design');
    });

    test('应检测 prd 类型', () => {
      assert.strictEqual(detectTypeFromId('prd_test'), 'prd');
      assert.strictEqual(detectTypeFromId('prod_test'), 'prd');
    });

    test('应检测 meta 为 spec 类型', () => {
      assert.strictEqual(detectTypeFromId('meta_overview'), 'spec');
    });

    test('未知前缀返回 null', () => {
      assert.strictEqual(detectTypeFromId('unknown_test'), null);
    });
  });

  describe('extractDependencies', () => {
    test('应提取 Dependencies 表格', () => {
      const content = `# Test <!-- id: test_doc -->

## Dependencies

| Dependency | Type | 说明 |
|------------|------|------|
| spec-meta | hard | 依赖元规范 |
| feat-auth | soft | 可选认证 |

## Next Section`;
      const deps = extractDependencies(content, 'test_doc');
      assert.strictEqual(deps.length, 2);
      assert.strictEqual(deps[0].source_id, 'test_doc');
      assert.strictEqual(deps[0].target_id, 'spec_meta');
      assert.strictEqual(deps[0].type, 'depends');
      assert.strictEqual(deps[1].target_id, 'feat_auth');
      assert.strictEqual(deps[1].type, 'extends');
    });

    test('应跳过代码块中的 Dependencies', () => {
      const content = `# Test <!-- id: test_doc -->

\`\`\`markdown
## Dependencies

| Dependency | Type | 说明 |
|------------|------|------|
| fake-dep | hard | 不应解析 |
\`\`\`

## Real Section`;
      const deps = extractDependencies(content, 'test_doc');
      assert.strictEqual(deps.length, 0);
    });

    test('应只匹配 ## 级别标题', () => {
      const content = `# Test <!-- id: test_doc -->

### 4.6 Dependencies Section Format

这是说明文字，不是真正的 Dependencies 章节

| Dependency | Type | 说明 |
|------------|------|------|
| not-a-dep | hard | 不应解析 |`;
      const deps = extractDependencies(content, 'test_doc');
      assert.strictEqual(deps.length, 0);
    });
  });

  describe('extractConsumers', () => {
    test('应提取 Consumers 表格', () => {
      const content = `# Test <!-- id: cap_test -->

## Consumers

| Consumer | 使用场景 |
|----------|----------|
| feat_a | 场景 A |
| feat_b | 场景 B |

## Next`;
      const consumers = extractConsumers(content, 'cap_test');
      assert.strictEqual(consumers.length, 2);
      assert.strictEqual(consumers[0].source_id, 'feat_a');
      assert.strictEqual(consumers[0].target_id, 'cap_test');
      assert.strictEqual(consumers[0].type, 'consumes');
    });
  });

  describe('extractKeywords', () => {
    test('应从标题提取关键词', () => {
      const content = '# Feature: State Management <!-- id: feat_state -->';
      const keywords = extractKeywords(content, 'feat_state');
      const kwSet = new Set(keywords.map(k => k.keyword));
      assert.ok(kwSet.has('feature'));
      assert.ok(kwSet.has('state'));
      assert.ok(kwSet.has('management'));
    });

    test('应过滤停用词', () => {
      const content = '# The Feature is a Test <!-- id: test -->';
      const keywords = extractKeywords(content, 'test');
      const kwSet = new Set(keywords.map(k => k.keyword));
      assert.ok(!kwSet.has('the'));
      assert.ok(!kwSet.has('is'));
      assert.ok(!kwSet.has('a'));
    });

    test('应从引用块提取关键词', () => {
      const content = `# Test <!-- id: test -->

> Knowledge Base provides indexing`;
      const keywords = extractKeywords(content, 'test');
      const kwSet = new Set(keywords.map(k => k.keyword));
      // 中文不按空格分词，测试英文关键词提取
      assert.ok(kwSet.has('knowledge'));
      assert.ok(kwSet.has('base'));
      assert.ok(kwSet.has('provides'));
      assert.ok(kwSet.has('indexing'));
    });
  });

});

// ============================================================================
// kb-store.js 测试
// ============================================================================

describe('kb-store', () => {
  let store;
  let testDbCounter = 0;

  beforeEach(() => {
    // 每个测试使用唯一的数据库文件
    testDbCounter++;
    const dbPath = path.join(__dirname, `test-knowledge-${testDbCounter}.db`);
    store = new KBStore(dbPath);
    store.initDB();
  });

  afterEach(() => {
    // 每个测试后关闭并清理数据库
    if (store) {
      const dbPath = store.dbPath;
      store.close();
      store = null;
      if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath);
      }
    }
  });

  describe('initDB', () => {
    test('应创建所有表', () => {
      const tables = store.db.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
      ).all();
      const tableNames = tables.map(t => t.name);
      assert.ok(tableNames.includes('documents'));
      assert.ok(tableNames.includes('relations'));
      assert.ok(tableNames.includes('keywords'));
    });
  });

  describe('insertDocument & getDocument', () => {
    test('应插入并检索文档', () => {
      store.insertDocument({
        id: 'feat_test',
        type: 'feature',
        name: 'Test Feature',
        path: 'docs/test.md',
        summary: 'Test summary',
        domain: 'process',
        raw_content: '# Content'
      });

      const doc = store.getDocument('feat_test');
      assert.strictEqual(doc.id, 'feat_test');
      assert.strictEqual(doc.type, 'feature');
      assert.strictEqual(doc.name, 'Test Feature');
      assert.strictEqual(doc.domain, 'process');
    });
  });

  describe('insertRelation & getRelations', () => {
    test('应插入并检索关系', () => {
      // 先插入文档
      store.insertDocument({ id: 'doc_a', type: 'feature', name: 'A', path: 'a.md' });
      store.insertDocument({ id: 'doc_b', type: 'feature', name: 'B', path: 'b.md' });

      store.insertRelation({
        source_id: 'doc_a',
        target_id: 'doc_b',
        type: 'depends',
        description: 'A depends on B'
      });

      const outgoing = store.getRelations('doc_a', 'outgoing');
      assert.strictEqual(outgoing.length, 1);
      assert.strictEqual(outgoing[0].target_id, 'doc_b');
      assert.strictEqual(outgoing[0].type, 'depends');

      const incoming = store.getRelations('doc_b', 'incoming');
      assert.strictEqual(incoming.length, 1);
      assert.strictEqual(incoming[0].source_id, 'doc_a');
    });
  });

  describe('findDocuments', () => {
    test('应按类型过滤', () => {
      store.insertDocument({ id: 'feat_a', type: 'feature', name: 'Feature A', path: 'a.md', domain: 'process' });
      store.insertDocument({ id: 'feat_b', type: 'feature', name: 'Feature B', path: 'b.md', domain: 'tooling' });
      store.insertDocument({ id: 'cap_c', type: 'capability', name: 'Cap C', path: 'c.md', domain: 'process' });
      const docs = store.findDocuments({ type: 'feature' });
      assert.strictEqual(docs.length, 2);
    });

    test('应按领域过滤', () => {
      store.insertDocument({ id: 'feat_a', type: 'feature', name: 'Feature A', path: 'a.md', domain: 'process' });
      store.insertDocument({ id: 'feat_b', type: 'feature', name: 'Feature B', path: 'b.md', domain: 'tooling' });
      store.insertDocument({ id: 'cap_c', type: 'capability', name: 'Cap C', path: 'c.md', domain: 'process' });
      const docs = store.findDocuments({ domain: 'process' });
      assert.strictEqual(docs.length, 2);
    });

    test('应按关键词过滤', () => {
      store.insertDocument({ id: 'feat_a', type: 'feature', name: 'Feature A', path: 'a.md', domain: 'process' });
      store.insertKeyword({ doc_id: 'feat_a', keyword: 'auth', source: 'title' });
      const docs = store.findDocuments({ keyword: 'auth' });
      assert.strictEqual(docs.length, 1);
      assert.strictEqual(docs[0].id, 'feat_a');
    });

    test('应组合过滤', () => {
      store.insertDocument({ id: 'feat_a', type: 'feature', name: 'Feature A', path: 'a.md', domain: 'process' });
      store.insertDocument({ id: 'feat_b', type: 'feature', name: 'Feature B', path: 'b.md', domain: 'tooling' });
      const docs = store.findDocuments({ type: 'feature', domain: 'process' });
      assert.strictEqual(docs.length, 1);
      assert.strictEqual(docs[0].id, 'feat_a');
    });
  });

  describe('exists', () => {
    test('应通过 ID 查找', () => {
      store.insertDocument({ id: 'feat_state_management', type: 'feature', name: 'State Management', path: 'state.md' });
      assert.strictEqual(store.exists('state_management'), true);
      assert.strictEqual(store.exists('nonexistent'), false);
    });

    test('应通过名称查找', () => {
      store.insertDocument({ id: 'feat_state_management', type: 'feature', name: 'State Management', path: 'state.md' });
      assert.strictEqual(store.exists('State Management'), true);
    });

    test('应支持连字符格式', () => {
      store.insertDocument({ id: 'feat_state_management', type: 'feature', name: 'State Management', path: 'state.md' });
      assert.strictEqual(store.exists('state-management'), true);
    });

    test('应支持类型过滤', () => {
      store.insertDocument({ id: 'feat_state_management', type: 'feature', name: 'State Management', path: 'state.md' });
      assert.strictEqual(store.exists('state', 'feature'), true);
      assert.strictEqual(store.exists('state', 'capability'), false);
    });
  });

  describe('getImpactedDocuments', () => {
    test('应返回所有依赖该文档的文档', () => {
      store.insertDocument({ id: 'spec_meta', type: 'spec', name: 'Meta', path: 'meta.md' });
      store.insertDocument({ id: 'feat_a', type: 'feature', name: 'A', path: 'a.md' });
      store.insertDocument({ id: 'feat_b', type: 'feature', name: 'B', path: 'b.md' });
      store.insertRelation({ source_id: 'feat_a', target_id: 'spec_meta', type: 'depends' });
      store.insertRelation({ source_id: 'feat_b', target_id: 'spec_meta', type: 'consumes' });

      const impacted = store.getImpactedDocuments('spec_meta');
      assert.strictEqual(impacted.length, 2);
      const ids = impacted.map(d => d.id).sort();
      assert.deepStrictEqual(ids, ['feat_a', 'feat_b']);
    });
  });

  describe('getRelationChain', () => {
    test('应返回完整关系链', () => {
      store.insertDocument({ id: 'a', type: 'feature', name: 'A', path: 'a.md' });
      store.insertDocument({ id: 'b', type: 'feature', name: 'B', path: 'b.md' });
      store.insertDocument({ id: 'c', type: 'feature', name: 'C', path: 'c.md' });
      store.insertRelation({ source_id: 'a', target_id: 'b', type: 'depends' });
      store.insertRelation({ source_id: 'b', target_id: 'c', type: 'depends' });

      const chain = store.getRelationChain('a', null, 5);
      assert.strictEqual(chain.nodes.length, 3);
      assert.strictEqual(chain.edges.length, 2);
    });

    test('应按类型过滤', () => {
      store.insertDocument({ id: 'a', type: 'feature', name: 'A', path: 'a.md' });
      store.insertDocument({ id: 'b', type: 'feature', name: 'B', path: 'b.md' });
      store.insertDocument({ id: 'c', type: 'feature', name: 'C', path: 'c.md' });
      store.insertRelation({ source_id: 'a', target_id: 'b', type: 'depends' });
      store.insertRelation({ source_id: 'b', target_id: 'c', type: 'depends' });
      store.insertRelation({ source_id: 'a', target_id: 'c', type: 'extends' });

      const chain = store.getRelationChain('a', 'depends', 5);
      assert.strictEqual(chain.edges.filter(e => e.type === 'depends').length, 2);
      assert.strictEqual(chain.edges.filter(e => e.type === 'extends').length, 0);
    });

    test('应限制深度', () => {
      store.insertDocument({ id: 'a', type: 'feature', name: 'A', path: 'a.md' });
      store.insertDocument({ id: 'b', type: 'feature', name: 'B', path: 'b.md' });
      store.insertDocument({ id: 'c', type: 'feature', name: 'C', path: 'c.md' });
      store.insertRelation({ source_id: 'a', target_id: 'b', type: 'depends' });
      store.insertRelation({ source_id: 'b', target_id: 'c', type: 'depends' });

      const chain = store.getRelationChain('a', null, 1);
      assert.strictEqual(chain.nodes.length, 2); // a, b
      assert.strictEqual(chain.edges.length, 1); // a -> b
    });
  });

  describe('getProductOverview', () => {
    test('应返回产品概览', () => {
      store.insertDocument({ id: 'prd_main', type: 'prd', name: 'Product', path: 'prd.md' });
      store.insertDocument({ id: 'feat_a', type: 'feature', name: 'A', path: 'a.md', domain: 'core' });
      store.insertDocument({ id: 'cap_b', type: 'capability', name: 'B', path: 'b.md' });
      store.insertDocument({ id: 'flow_c', type: 'flow', name: 'C', path: 'c.md' });

      const overview = store.getProductOverview();
      assert.ok(overview.prd);
      assert.strictEqual(overview.prd.name, 'Product');
      assert.strictEqual(overview.capabilities.length, 1);
      assert.strictEqual(overview.flows.length, 1);
      assert.strictEqual(overview.domains.length, 1);
      assert.strictEqual(overview.domains[0].name, 'core');
    });
  });

  describe('getStats', () => {
    test('应返回统计信息', () => {
      store.insertDocument({ id: 'doc1', type: 'feature', name: 'D1', path: '1.md' });
      store.insertDocument({ id: 'doc2', type: 'feature', name: 'D2', path: '2.md' });
      store.insertRelation({ source_id: 'doc1', target_id: 'doc2', type: 'depends' });
      store.insertKeyword({ doc_id: 'doc1', keyword: 'test', source: 'title' });

      const stats = store.getStats();
      assert.strictEqual(stats.documents, 2);
      assert.strictEqual(stats.relations, 1);
      assert.strictEqual(stats.keywords, 1);
    });
  });

  describe('transactions', () => {
    test('应支持事务回滚', () => {
      store.beginTransaction();
      store.insertDocument({ id: 'trans_doc', type: 'feature', name: 'T', path: 't.md' });
      store.rollback();

      const doc = store.getDocument('trans_doc');
      assert.strictEqual(doc, undefined);
    });

    test('应支持事务提交', () => {
      store.beginTransaction();
      store.insertDocument({ id: 'trans_doc', type: 'feature', name: 'T', path: 't.md' });
      store.commit();

      const doc = store.getDocument('trans_doc');
      assert.ok(doc);
    });
  });

  describe('clearAll', () => {
    test('应清空所有表', () => {
      store.insertDocument({ id: 'doc1', type: 'feature', name: 'D1', path: '1.md' });
      store.insertRelation({ source_id: 'doc1', target_id: 'doc1', type: 'self' });
      store.insertKeyword({ doc_id: 'doc1', keyword: 'test', source: 'title' });

      store.clearAll();

      const stats = store.getStats();
      assert.strictEqual(stats.documents, 0);
      assert.strictEqual(stats.relations, 0);
      assert.strictEqual(stats.keywords, 0);
    });
  });
});

// ============================================================================
// 集成测试 - 完整解析流程
// ============================================================================

describe('Integration', () => {
  let store;
  const INTEGRATION_DB = path.join(__dirname, 'test-integration.db');

  before(() => {
    if (fs.existsSync(INTEGRATION_DB)) {
      fs.unlinkSync(INTEGRATION_DB);
    }
    store = new KBStore(INTEGRATION_DB);
    store.initDB();
  });

  after(() => {
    if (store) store.close();
    if (fs.existsSync(INTEGRATION_DB)) {
      fs.unlinkSync(INTEGRATION_DB);
    }
  });

  test('应完整解析并存储文档', () => {
    const content = `---
type: feature
domain: process
---

# Feature: Knowledge Base <!-- id: feat_knowledge_base -->

> 产品知识库，提供文档索引能力

## Dependencies

| Dependency | Type | 说明 |
|------------|------|------|
| spec-meta | hard | 依赖元规范 |

## Consumers

| Consumer | 使用场景 |
|----------|----------|
| flow_workflows | 意图识别 |
`;

    // 模拟 parseDoc 的行为
    const frontmatter = parseFrontmatter(content);
    const id = extractId(content);
    const name = extractName(content);
    const summary = extractSummary(content);
    const dependencies = extractDependencies(content, id);
    const consumers = extractConsumers(content, id);
    const keywords = extractKeywords(content, id);

    // 验证解析结果
    assert.strictEqual(id, 'feat_knowledge_base');
    assert.strictEqual(frontmatter.type, 'feature');
    assert.strictEqual(frontmatter.domain, 'process');
    assert.strictEqual(name, 'Knowledge Base');
    assert.ok(summary.includes('产品知识库'));
    assert.strictEqual(dependencies.length, 1);
    assert.strictEqual(dependencies[0].target_id, 'spec_meta');
    assert.strictEqual(consumers.length, 1);
    assert.strictEqual(consumers[0].source_id, 'flow_workflows');

    // 存储并验证
    store.insertDocument({
      id,
      type: frontmatter.type,
      name,
      path: 'test.md',
      summary,
      domain: frontmatter.domain,
      raw_content: content
    });

    for (const dep of dependencies) {
      store.insertRelation(dep);
    }
    for (const con of consumers) {
      store.insertRelation(con);
    }
    for (const kw of keywords) {
      store.insertKeyword(kw);
    }

    // 验证存储结果
    const doc = store.getDocument('feat_knowledge_base');
    assert.ok(doc);
    assert.strictEqual(doc.name, 'Knowledge Base');

    const rels = store.getRelations('feat_knowledge_base', 'outgoing');
    assert.ok(rels.some(r => r.target_id === 'spec_meta'));

    assert.strictEqual(store.exists('knowledge-base'), true);
  });
});

console.log('Running knowledge-base tests...\n');
