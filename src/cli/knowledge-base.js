#!/usr/bin/env node

/**
 * Knowledge Base CLI - 产品知识库命令行工具
 *
 * 基于设计文档 des-knowledge-base.md v1.2
 *
 * Commands:
 *   sync              全量同步文档到知识库
 *   query             查询文档
 *   search <keywords> 关键词搜索文档（v1.2 新增）
 *   overview          获取产品概览
 *   exists <name>     检查文档是否存在
 *   impact <id>       获取受影响的文档
 *   chain <id>        获取关系链
 *   hook-context      获取 Hook 上下文
 *   stats             获取统计信息
 */

const fs = require('fs');
const path = require('path');
const { KBStore } = require('../lib/kb-store');
const { scanDocs, parseDoc } = require('../lib/kb-parser');

// ============================================================================
// Commands
// ============================================================================

/**
 * sync - 全量同步
 */
async function cmdSync(options = {}) {
  const startTime = Date.now();
  const store = new KBStore();
  await store.initDB();

  const report = {
    success: 0,
    failed: 0,
    relations: 0,
    keywords: 0,
    duration_ms: 0,
    errors: []
  };

  try {
    store.beginTransaction();
    store.clearAll();

    // 扫描文档
    const docsDir = options.docsDir || 'docs';
    const files = scanDocs(docsDir);

    console.log(`Found ${files.length} markdown files in ${docsDir}/`);

    for (const filePath of files) {
      try {
        const result = parseDoc(filePath);

        if (result.error) {
          report.failed++;
          report.errors.push({ path: filePath, error: result.error });
          continue;
        }

        // 插入文档
        store.insertDocument(result.document);

        // 插入关系
        for (const rel of result.relations) {
          store.insertRelation(rel);
          report.relations++;
        }

        // 插入关键词
        for (const kw of result.keywords) {
          store.insertKeyword(kw);
          report.keywords++;
        }

        report.success++;
      } catch (err) {
        report.failed++;
        report.errors.push({ path: filePath, error: err.message });
      }
    }

    store.commit();
  } catch (err) {
    store.rollback();
    throw err;
  } finally {
    store.close();
  }

  report.duration_ms = Date.now() - startTime;

  console.log('\n=== Sync Report ===');
  console.log(`Success: ${report.success}`);
  console.log(`Failed: ${report.failed}`);
  console.log(`Relations: ${report.relations}`);
  console.log(`Keywords: ${report.keywords}`);
  console.log(`Duration: ${report.duration_ms}ms`);

  if (report.errors.length > 0) {
    console.log('\nErrors:');
    for (const err of report.errors) {
      console.log(`  - ${err.path}: ${err.error}`);
    }
  }

  if (options.json) {
    console.log('\n' + JSON.stringify(report, null, 2));
  }

  return report;
}

/**
 * query - 查询文档
 */
async function cmdQuery(options = {}) {
  const store = new KBStore();
  await store.initDB();

  try {
    const docs = store.findDocuments({
      type: options.type,
      domain: options.domain,
      keyword: options.keyword
    });

    if (options.json) {
      console.log(JSON.stringify(docs, null, 2));
    } else {
      console.log(`Found ${docs.length} documents:\n`);
      for (const doc of docs) {
        console.log(`  [${doc.type}] ${doc.id}`);
        console.log(`    Name: ${doc.name || '(no name)'}`);
        console.log(`    Path: ${doc.path}`);
        if (doc.domain) console.log(`    Domain: ${doc.domain}`);
        console.log('');
      }
    }

    return docs;
  } finally {
    store.close();
  }
}

/**
 * search - 关键词搜索（v1.2 新增）
 */
async function cmdSearch(keywords, options = {}) {
  if (!keywords || keywords.length === 0) {
    console.error('Error: search command requires at least one keyword');
    process.exit(1);
  }

  const store = new KBStore();
  await store.initDB();

  try {
    const results = store.searchByKeywords(keywords);

    if (options.json) {
      console.log(JSON.stringify(results, null, 2));
    } else {
      console.log(`Found ${results.length} documents matching: ${keywords.join(', ')}\n`);
      for (const doc of results) {
        console.log(`  [${doc.type}] ${doc.id}`);
        console.log(`    Name: ${doc.name || '(no name)'}`);
        console.log(`    Path: ${doc.path}`);
        console.log(`    Match: ${doc.matchCount} keyword(s) in ${doc.matchSources.join(', ')}`);
        if (doc.domain) console.log(`    Domain: ${doc.domain}`);
        console.log('');
      }
    }

    return results;
  } finally {
    store.close();
  }
}

/**
 * overview - 产品概览
 */
async function cmdOverview(options = {}) {
  const store = new KBStore();
  await store.initDB();

  try {
    const overview = store.getProductOverview();

    if (options.json) {
      console.log(JSON.stringify(overview, null, 2));
    } else {
      console.log('=== Product Overview ===\n');

      if (overview.prd) {
        console.log(`PRD: ${overview.prd.name || overview.prd.id}`);
        console.log(`  Path: ${overview.prd.path}`);
        console.log('');
      }

      console.log(`Domains (${overview.domains.length}):`);
      for (const domain of overview.domains) {
        console.log(`  - ${domain.name} (${domain.features.length} features)`);
        for (const feat of domain.features) {
          console.log(`      [feature] ${feat.id}: ${feat.name || '(no name)'}`);
        }
      }
      console.log('');

      console.log(`Capabilities (${overview.capabilities.length}):`);
      for (const cap of overview.capabilities) {
        console.log(`  - ${cap.id}: ${cap.name || '(no name)'}`);
      }
      console.log('');

      console.log(`Flows (${overview.flows.length}):`);
      for (const flow of overview.flows) {
        console.log(`  - ${flow.id}: ${flow.name || '(no name)'}`);
      }
    }

    return overview;
  } finally {
    store.close();
  }
}

/**
 * exists - 检查文档是否存在
 */
async function cmdExists(name, options = {}) {
  const store = new KBStore();
  await store.initDB();

  try {
    const exists = store.exists(name, options.type);

    if (options.json) {
      console.log(JSON.stringify({ exists }));
    } else {
      console.log(exists ? 'true' : 'false');
    }

    return exists;
  } finally {
    store.close();
  }
}

/**
 * impact - 获取受影响的文档
 */
async function cmdImpact(docId, options = {}) {
  const store = new KBStore();
  await store.initDB();

  try {
    const docs = store.getImpactedDocuments(docId);

    if (options.json) {
      console.log(JSON.stringify(docs, null, 2));
    } else {
      console.log(`Documents impacted by "${docId}":\n`);
      if (docs.length === 0) {
        console.log('  (none)');
      } else {
        for (const doc of docs) {
          console.log(`  [${doc.type}] ${doc.id}: ${doc.name || '(no name)'}`);
        }
      }
    }

    return docs;
  } finally {
    store.close();
  }
}

/**
 * chain - 获取关系链
 */
async function cmdChain(docId, options = {}) {
  const store = new KBStore();
  await store.initDB();

  try {
    const chain = store.getRelationChain(
      docId,
      options.type || null,
      parseInt(options.depth) || 5
    );

    if (options.json) {
      console.log(JSON.stringify(chain, null, 2));
    } else {
      console.log(`Relation chain for "${docId}":\n`);
      console.log(`Nodes (${chain.nodes.length}):`);
      for (const node of chain.nodes) {
        console.log(`  - ${node}`);
      }
      console.log(`\nEdges (${chain.edges.length}):`);
      for (const edge of chain.edges) {
        console.log(`  ${edge.source} --[${edge.type}]--> ${edge.target}`);
      }
    }

    return chain;
  } finally {
    store.close();
  }
}

/**
 * hook-context - 获取 Hook 上下文
 */
function cmdHookContext(options = {}) {
  // 从 state.json 读取
  const statePath = path.join(process.cwd(), '.solodevflow', 'state.json');

  if (!fs.existsSync(statePath)) {
    console.error('Error: state.json not found');
    process.exit(1);
  }

  const state = JSON.parse(fs.readFileSync(statePath, 'utf-8'));

  const context = {
    productOverview: {
      name: state.project?.name || 'Unknown',
      description: state.project?.description || '',
      activeFeatures: state.flow?.activeFeatures || []
    },
    featureList: Object.entries(state.features || {})
      .filter(([_, f]) => f.type === 'code' || f.type === 'document')
      .map(([id, f]) => ({
        name: id,
        status: f.status,
        domain: f.domain
      })),
    currentFeature: null
  };

  // 获取当前 Feature
  const currentId = state.flow?.activeFeatures?.[0];
  if (currentId && state.features?.[currentId]) {
    context.currentFeature = {
      id: currentId,
      ...state.features[currentId]
    };
  }

  if (options.json) {
    console.log(JSON.stringify(context, null, 2));
  } else {
    console.log('=== Hook Context ===\n');
    console.log(`Product: ${context.productOverview.name}`);
    console.log(`Active Features: ${context.productOverview.activeFeatures.join(', ') || '(none)'}`);
    console.log(`\nFeature List (${context.featureList.length}):`);
    for (const f of context.featureList) {
      console.log(`  [${f.status}] ${f.name} (${f.domain})`);
    }
    if (context.currentFeature) {
      console.log(`\nCurrent Feature: ${context.currentFeature.id}`);
    }
  }

  return context;
}

/**
 * stats - 获取统计信息
 */
async function cmdStats(options = {}) {
  const store = new KBStore();
  await store.initDB();

  try {
    const stats = store.getStats();

    if (options.json) {
      console.log(JSON.stringify(stats, null, 2));
    } else {
      console.log('=== Knowledge Base Stats ===');
      console.log(`Documents: ${stats.documents}`);
      console.log(`Relations: ${stats.relations}`);
      console.log(`Keywords: ${stats.keywords}`);
    }

    return stats;
  } finally {
    store.close();
  }
}

// ============================================================================
// CLI Entry Point
// ============================================================================

function parseArgs(args) {
  const result = { command: null, args: [], options: {} };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg.startsWith('--')) {
      const eqIdx = arg.indexOf('=');
      if (eqIdx > 0) {
        const key = arg.substring(2, eqIdx);
        const value = arg.substring(eqIdx + 1);
        result.options[key] = value;
      } else {
        const key = arg.substring(2);
        result.options[key] = true;
      }
    } else if (!result.command) {
      result.command = arg;
    } else {
      result.args.push(arg);
    }
  }

  return result;
}

function printHelp() {
  console.log(`
Knowledge Base CLI - 产品知识库命令行工具

Usage: node src/cli/knowledge-base.js <command> [options]

Commands:
  sync                    全量同步文档到知识库
  query                   查询文档
  search <keywords...>    关键词搜索文档（v1.2 新增）
  overview                获取产品概览
  exists <name>           检查文档是否存在
  impact <id>             获取受影响的文档
  chain <id>              获取关系链
  hook-context            获取 Hook 上下文
  stats                   获取统计信息

Options:
  --json                  输出 JSON 格式
  --type=<type>           按类型过滤 (feature/capability/flow/...)
  --domain=<domain>       按领域过滤
  --keyword=<keyword>     按关键词搜索
  --depth=<n>             关系链深度 (默认 5)

Examples:
  node src/cli/knowledge-base.js sync
  node src/cli/knowledge-base.js query --type=feature --domain=process
  node src/cli/knowledge-base.js search "知识库" "文档"
  node src/cli/knowledge-base.js search 登录 认证 --json
  node src/cli/knowledge-base.js exists state-management
  node src/cli/knowledge-base.js impact spec_meta
  node src/cli/knowledge-base.js chain feat_knowledge_base --type=depends
`);
}

async function main() {
  const { command, args, options } = parseArgs(process.argv.slice(2));

  if (!command || command === 'help' || options.help) {
    printHelp();
    process.exit(0);
  }

  try {
    switch (command) {
      case 'sync':
        await cmdSync(options);
        break;
      case 'query':
        await cmdQuery(options);
        break;
      case 'search':
        if (args.length < 1) {
          console.error('Error: search command requires at least one keyword');
          process.exit(1);
        }
        await cmdSearch(args, options);
        break;
      case 'overview':
        await cmdOverview(options);
        break;
      case 'exists':
        if (args.length < 1) {
          console.error('Error: exists command requires a name argument');
          process.exit(1);
        }
        await cmdExists(args[0], options);
        break;
      case 'impact':
        if (args.length < 1) {
          console.error('Error: impact command requires a document ID');
          process.exit(1);
        }
        await cmdImpact(args[0], options);
        break;
      case 'chain':
        if (args.length < 1) {
          console.error('Error: chain command requires a document ID');
          process.exit(1);
        }
        await cmdChain(args[0], options);
        break;
      case 'hook-context':
        cmdHookContext(options);
        break;
      case 'stats':
        await cmdStats(options);
        break;
      default:
        console.error(`Unknown command: ${command}`);
        printHelp();
        process.exit(1);
    }
  } catch (err) {
    console.error(`Error: ${err.message}`);
    if (options.debug) {
      console.error(err.stack);
    }
    process.exit(1);
  }
}

// 导出供其他模块使用
module.exports = {
  sync: cmdSync,
  query: cmdQuery,
  search: cmdSearch,
  overview: cmdOverview,
  exists: cmdExists,
  impact: cmdImpact,
  chain: cmdChain,
  hookContext: cmdHookContext,
  stats: cmdStats
};

// CLI 入口
if (require.main === module) {
  main();
}
