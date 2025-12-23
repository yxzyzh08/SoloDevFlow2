#!/usr/bin/env node

/**
 * Project Status Script
 * Shows current state summary with domain tree view
 *
 * Usage: npm run status
 */

const fs = require('fs');
const path = require('path');

const STATE_FILE = path.join(__dirname, '..', '.solodevflow', 'state.json');

/**
 * Build domain tree from features (v8.0 派生逻辑)
 */
function buildDomainTree(state) {
  const tree = {};

  for (const [name, feature] of Object.entries(state.features)) {
    const domain = feature.domain;
    if (!tree[domain]) {
      tree[domain] = {
        description: state.domains[domain] || '',
        features: {}
      };
    }
    tree[domain].features[name] = {
      type: feature.type,
      phase: feature.phase,
      status: feature.status
    };
  }

  return tree;
}

/**
 * Get status emoji
 */
function getStatusEmoji(status) {
  switch (status) {
    case 'completed': return '✓';
    case 'in_progress': return '◐';
    case 'blocked': return '✗';
    case 'not_started': return '○';
    default: return '?';
  }
}

/**
 * Main function
 */
function main() {
  // Check if state file exists
  if (!fs.existsSync(STATE_FILE)) {
    console.error('Error: .solodevflow/state.json not found');
    process.exit(1);
  }

  // Read state
  let state;
  try {
    const content = fs.readFileSync(STATE_FILE, 'utf8');
    state = JSON.parse(content);
  } catch (e) {
    console.error('Error: Failed to parse state.json:', e.message);
    process.exit(1);
  }

  // Header
  console.log('=== SoloDevFlow Status ===\n');
  console.log(`Project: ${state.project.name}`);
  console.log(`Schema: v${state.schemaVersion}`);
  console.log(`Method: ${state.flow.researchMethod}`);
  console.log('');

  // Active features
  console.log('=== Active Features ===\n');
  if (state.flow.activeFeatures.length === 0) {
    console.log('  (none)');
  } else {
    state.flow.activeFeatures.forEach((name, index) => {
      const feature = state.features[name];
      if (feature) {
        console.log(`  ${index + 1}. ${name}`);
        console.log(`     Phase: ${feature.phase} | Status: ${feature.status}`);
        console.log(`     Domain: ${feature.domain}`);
      }
    });
  }
  console.log('');

  // Domain tree (派生自 features)
  console.log('=== Domain Tree (derived) ===\n');
  const domainTree = buildDomainTree(state);

  for (const [domainName, domain] of Object.entries(domainTree)) {
    const featureCount = Object.keys(domain.features).length;
    const completedCount = Object.values(domain.features).filter(f => f.status === 'completed').length;

    console.log(`📁 ${domainName} (${completedCount}/${featureCount})`);
    console.log(`   ${domain.description}`);

    for (const [featureName, feature] of Object.entries(domain.features)) {
      const emoji = getStatusEmoji(feature.status);
      console.log(`   ${emoji} ${featureName} [${feature.phase}]`);
    }
    console.log('');
  }

  // Summary
  const totalFeatures = Object.keys(state.features).length;
  const completedFeatures = Object.values(state.features).filter(f => f.status === 'completed').length;
  const inProgressFeatures = Object.values(state.features).filter(f => f.status === 'in_progress').length;

  console.log('=== Summary ===\n');
  console.log(`Features: ${completedFeatures}/${totalFeatures} completed, ${inProgressFeatures} in progress`);
  console.log(`Domains: ${Object.keys(state.domains).length}`);
  console.log(`Sparks: ${state.sparks.length}`);
  console.log(`Pending Docs: ${state.pendingDocs.length}`);
}

main();
