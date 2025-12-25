/**
 * Knowledge Base Store - SQLite 存储层
 *
 * 基于设计文档 des-knowledge-base.md v1.1 §3.1
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(process.cwd(), '.solodevflow', 'knowledge.db');

class KBStore {
  constructor(dbPath = DB_PATH) {
    this.dbPath = dbPath;
    this.db = null;
  }

  /**
   * 初始化数据库连接和表结构
   */
  initDB() {
    // 确保目录存在
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db = new Database(this.dbPath);

    // 创建表结构（基于设计文档 §3.1）
    this.db.exec(`
      -- 1. 文档表
      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        name TEXT,
        path TEXT UNIQUE NOT NULL,
        summary TEXT,
        domain TEXT,
        raw_content TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      -- 2. 关系表
      CREATE TABLE IF NOT EXISTS relations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source_id TEXT NOT NULL,
        target_id TEXT NOT NULL,
        type TEXT NOT NULL,
        description TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(source_id, target_id, type)
      );

      -- 3. 关键词表
      CREATE TABLE IF NOT EXISTS keywords (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        doc_id TEXT NOT NULL,
        keyword TEXT NOT NULL,
        source TEXT NOT NULL,
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
    `);

    return this;
  }

  /**
   * 清空所有表（全量同步前调用）
   */
  clearAll() {
    this.db.exec(`
      DELETE FROM keywords;
      DELETE FROM relations;
      DELETE FROM documents;
    `);
  }

  /**
   * 插入文档
   */
  insertDocument(doc) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO documents (id, type, name, path, summary, domain, raw_content, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    stmt.run(doc.id, doc.type, doc.name, doc.path, doc.summary, doc.domain, doc.raw_content);
  }

  /**
   * 插入关系
   */
  insertRelation(rel) {
    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO relations (source_id, target_id, type, description)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(rel.source_id, rel.target_id, rel.type, rel.description);
  }

  /**
   * 插入关键词
   */
  insertKeyword(kw) {
    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO keywords (doc_id, keyword, source)
      VALUES (?, ?, ?)
    `);
    stmt.run(kw.doc_id, kw.keyword, kw.source);
  }

  /**
   * 获取单个文档
   */
  getDocument(id) {
    return this.db.prepare('SELECT * FROM documents WHERE id = ?').get(id);
  }

  /**
   * 查询文档（支持 type, domain, keyword 过滤）
   */
  findDocuments({ type, domain, keyword } = {}) {
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

    return this.db.prepare(sql).all(...params);
  }

  /**
   * 检查文档是否存在
   * 支持连字符和下划线两种格式（state-management 和 state_management）
   */
  exists(name, type = null) {
    // 同时搜索原始名称和转换后的名称（连字符<->下划线）
    const nameUnderscore = name.replace(/-/g, '_');
    const nameHyphen = name.replace(/_/g, '-');

    let sql = 'SELECT COUNT(*) as count FROM documents WHERE (id LIKE ? OR id LIKE ? OR name LIKE ?)';
    const params = [`%${nameUnderscore}%`, `%${nameHyphen}%`, `%${name}%`];

    if (type) {
      sql += ' AND type = ?';
      params.push(type);
    }

    const result = this.db.prepare(sql).get(...params);
    return result.count > 0;
  }

  /**
   * 获取关系（出边或入边）
   */
  getRelations(docId, direction = 'outgoing') {
    if (direction === 'outgoing') {
      return this.db.prepare(`
        SELECT r.*, d.name as target_name, d.type as target_type
        FROM relations r
        LEFT JOIN documents d ON r.target_id = d.id
        WHERE r.source_id = ?
      `).all(docId);
    } else {
      return this.db.prepare(`
        SELECT r.*, d.name as source_name, d.type as source_type
        FROM relations r
        LEFT JOIN documents d ON r.source_id = d.id
        WHERE r.target_id = ?
      `).all(docId);
    }
  }

  /**
   * 获取受影响的文档（反向查询 depends/consumes）
   */
  getImpactedDocuments(docId) {
    return this.db.prepare(`
      SELECT DISTINCT d.*
      FROM documents d
      JOIN relations r ON d.id = r.source_id
      WHERE r.target_id = ?
      AND r.type IN ('depends', 'consumes')
    `).all(docId);
  }

  /**
   * 获取关系链（BFS）
   */
  getRelationChain(docId, relationType = null, maxDepth = 5) {
    const visited = new Set([docId]);
    const queue = [{ id: docId, depth: 0 }];
    const result = { nodes: [docId], edges: [] };

    while (queue.length > 0) {
      const { id, depth } = queue.shift();
      if (depth >= maxDepth) continue;

      let sql = 'SELECT target_id, type FROM relations WHERE source_id = ?';
      const params = [id];

      if (relationType) {
        sql += ' AND type = ?';
        params.push(relationType);
      }

      const relations = this.db.prepare(sql).all(...params);

      for (const rel of relations) {
        result.edges.push({ source: id, target: rel.target_id, type: rel.type });

        if (!visited.has(rel.target_id)) {
          visited.add(rel.target_id);
          result.nodes.push(rel.target_id);
          queue.push({ id: rel.target_id, depth: depth + 1 });
        }
      }
    }

    return result;
  }

  /**
   * 获取产品概览
   */
  getProductOverview() {
    const prd = this.db.prepare('SELECT * FROM documents WHERE type = ?').get('prd');

    const domainRows = this.db.prepare(
      'SELECT DISTINCT domain FROM documents WHERE domain IS NOT NULL'
    ).all();

    const domains = domainRows.map(row => {
      const features = this.db.prepare(
        'SELECT * FROM documents WHERE domain = ? AND type = ?'
      ).all(row.domain, 'feature');
      return { name: row.domain, features };
    });

    const capabilities = this.db.prepare('SELECT * FROM documents WHERE type = ?').all('capability');
    const flows = this.db.prepare('SELECT * FROM documents WHERE type = ?').all('flow');

    return { prd, domains, capabilities, flows };
  }

  /**
   * 基于关键词搜索文档
   * @param {string[]} keywords - 关键词数组
   * @returns {Object[]} - 匹配的文档列表，按匹配度排序
   */
  searchByKeywords(keywords) {
    if (!keywords || keywords.length === 0) {
      return [];
    }

    // 1. 查询每个关键词匹配的文档
    const matchCounts = new Map(); // docId -> { doc, count, sources }

    for (const kw of keywords) {
      const keyword = (kw || '').toLowerCase().trim();
      if (!keyword) continue;

      // 查询匹配的关键词记录
      const matches = this.db.prepare(`
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

  /**
   * 获取统计信息
   */
  getStats() {
    const docs = this.db.prepare('SELECT COUNT(*) as count FROM documents').get();
    const rels = this.db.prepare('SELECT COUNT(*) as count FROM relations').get();
    const kws = this.db.prepare('SELECT COUNT(*) as count FROM keywords').get();
    return {
      documents: docs.count,
      relations: rels.count,
      keywords: kws.count
    };
  }

  /**
   * 开始事务
   */
  beginTransaction() {
    this.db.exec('BEGIN TRANSACTION');
  }

  /**
   * 提交事务
   */
  commit() {
    this.db.exec('COMMIT');
  }

  /**
   * 回滚事务
   */
  rollback() {
    this.db.exec('ROLLBACK');
  }

  /**
   * 关闭数据库连接
   */
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

module.exports = { KBStore, DB_PATH };
