#!/usr/bin/env node

/**
 * Project Status Script
 * Shows current state summary with document tree view
 *
 * v12.0.0: Uses index.json for document status
 * v14.0.0: Renamed activeFeatures to activeWorkItems
 *
 * Usage: npm run status
 */

const fs = require('fs');
const path = require('path');

// 自动检测项目根目录
const isInstalledProject = __dirname.includes('.solodevflow');
const PROJECT_ROOT = isInstalledProject
  ? path.join(__dirname, '../..')
  : path.join(__dirname, '..');
const STATE_FILE = path.join(PROJECT_ROOT, '.solodevflow', 'state.json');
const INDEX_FILE = path.join(PROJECT_ROOT, '.solodevflow', 'index.json');

/**
 * Read JSON file safely
 */
function readJSON(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    return null;
  }
}

/**
 * Build document tree from index.json
 */
function buildDocumentTree(index) {
  const tree = {};

  for (const doc of index.documents) {
    // 从路径提取类型
    let type = 'other';
    if (doc.path.includes('/features/')) type = 'feature';
    else if (doc.path.includes('/capabilities/')) type = 'capability';
    else if (doc.path.includes('/flows/')) type = 'flow';
    else if (doc.path.includes('/designs/')) type = 'design';

    if (!tree[type]) {
      tree[type] = [];
    }
    tree[type].push(doc);
  }

  return tree;
}

/**
 * Get status emoji
 */
function getStatusEmoji(status) {
  switch (status) {
    case 'done': return '✓';
    case 'in_progress': return '◐';
    case 'not_started': return '○';
    case 'deprecated': return '✗';
    default: return '?';
  }
}

/**
 * Main function
 */
function main() {
  // Read state
  const state = readJSON(STATE_FILE);
  if (!state) {
    console.error('Error: .solodevflow/state.json not found or invalid');
    process.exit(1);
  }

  // Read index
  const index = readJSON(INDEX_FILE);
  if (!index) {
    console.error('Error: .solodevflow/index.json not found. Run: npm run index');
    process.exit(1);
  }

  // Header
  console.log('=== SoloDevFlow Status ===\n');
  console.log(`Project: ${state.project.name}`);
  console.log(`Schema: v${state.schemaVersion}`);
  console.log(`Method: ${state.flow.researchMethod}`);
  console.log('');

  // Active work items
  const activeWorkItems = state.flow.activeWorkItems || [];
  console.log('=== Active Work Items ===\n');
  if (activeWorkItems.length === 0) {
    console.log('  (none)');
  } else {
    activeWorkItems.forEach((id, i) => {
      const doc = index.documents.find(d => d.id === id);
      if (doc) {
        console.log(`  ${i + 1}. ${id} [${doc.type}]`);
        console.log(`     Status: ${doc.status} | Path: ${doc.path}`);
      } else {
        console.log(`  ${i + 1}. ${id} (not in index)`);
      }
    });
  }
  console.log('');

  // Document tree
  console.log('=== Document Tree ===\n');
  const docTree = buildDocumentTree(index);
  const typeLabels = {
    feature: 'Features',
    capability: 'Capabilities',
    flow: 'Flows',
    design: 'Designs',
    other: 'Other'
  };

  for (const [type, docs] of Object.entries(docTree)) {
    const completedCount = docs.filter(d => d.status === 'done').length;
    console.log(`📁 ${typeLabels[type] || type} (${completedCount}/${docs.length})`);

    for (const doc of docs) {
      const emoji = getStatusEmoji(doc.status);
      console.log(`   ${emoji} ${doc.id}`);
    }
    console.log('');
  }

  // Summary
  const totalDocs = index.documents.length;
  const completedDocs = index.documents.filter(d => d.status === 'done').length;
  const inProgressDocs = index.documents.filter(d => d.status === 'in_progress').length;

  console.log('=== Summary ===\n');
  console.log(`Documents: ${completedDocs}/${totalDocs} completed, ${inProgressDocs} in progress`);
  console.log(`Domains: ${Object.keys(state.domains).length}`);
  console.log(`Pending Docs: ${state.pendingDocs.length}`);
}

main();
