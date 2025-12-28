#!/usr/bin/env node

/**
 * Change Impact Analysis Script
 * Analyzes the impact of changes to specification documents and templates
 *
 * Usage: node scripts/analyze-impact.js <changed-file> [options]
 * Options:
 *   --write       Write subtasks to state.json
 *   --depth=N     Set max analysis depth (default: 2)
 *   --json        Output subtasks as JSON
 *
 * Examples:
 *   node scripts/analyze-impact.js docs/specs/spec-requirements.md
 *   node scripts/analyze-impact.js docs/specs/spec-requirements.md --write
 *   node scripts/analyze-impact.js docs/specs/spec-requirements.md --depth=3
 */

const fs = require('fs');
const path = require('path');
const { toBeijingISOString } = require('./lib/datetime');

const REQUIREMENTS_DIR = path.join(__dirname, '..', 'docs', 'requirements');
const DESIGNS_DIR = path.join(__dirname, '..', 'docs', 'designs');
const STATE_FILE = path.join(__dirname, '..', '.solodevflow', 'state.json');
const INDEX_FILE = path.join(__dirname, '..', '.solodevflow', 'index.json');

// Document type detection
function getDocType(filePath) {
  // Detect which directory tree
  const inRequirements = filePath.includes('/requirements/') || filePath.includes('\\requirements\\');
  const inDesigns = filePath.includes('/designs/') || filePath.includes('\\designs\\');

  if (filePath.includes('/templates/')) return 'template';
  if (filePath.endsWith('.spec.md') && filePath.includes('/specs/')) return 'spec';

  // Requirements documents
  if (inRequirements && filePath.endsWith('.spec.md')) return 'feature-spec';
  if (inRequirements && filePath.includes('prd.md')) return 'prd';

  // Design documents
  if (inDesigns || filePath.endsWith('.design.md')) return 'design-doc';

  // Code and tests
  if (filePath.startsWith('src/') || filePath.includes('/src/')) return 'code';
  if (filePath.startsWith('tests/') || filePath.includes('/tests/')) return 'test';
  if (filePath.endsWith('.js') || filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
    if (filePath.includes('test') || filePath.includes('spec')) return 'test';
    return 'code';
  }
  return 'document';
}

// Parse Dependencies table from Feature Spec
function parseDependencies(content) {
  const deps = [];
  const tableRegex = /\|\s*([^|]+)\s*\|\s*(hard|soft)\s*\|\s*([^|]*)\s*\|/gi;
  const matches = content.matchAll(tableRegex);

  for (const match of matches) {
    const dep = match[1].trim();
    const type = match[2].trim().toLowerCase();
    const desc = match[3].trim();

    // Skip header row
    if (dep === 'Dependency' || dep.includes('---')) continue;

    deps.push({ name: dep, type, description: desc });
  }

  return deps;
}

// Parse markdown links to find references
function parseReferences(content, currentFile) {
  const refs = [];
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const matches = content.matchAll(linkRegex);

  for (const match of matches) {
    const text = match[1];
    const href = match[2];

    // Skip external links
    if (href.startsWith('http://') || href.startsWith('https://')) continue;

    // Parse path and anchor
    const [refPath, anchor] = href.split('#');
    if (refPath) {
      refs.push({
        text,
        path: refPath,
        anchor: anchor || null,
        fullRef: href
      });
    }
  }

  return refs;
}

// Build dependency graph by scanning documents
function buildDependencyGraph() {
  const nodes = new Map();
  const edges = [];

  // Read index.json for document information
  let index = null;
  try {
    index = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
  } catch (e) {
    console.error('Warning: Could not read index.json');
  }

  // Scan docs directory recursively
  function scanDir(dir) {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        scanDir(fullPath);
      } else if (item.endsWith('.md')) {
        const relativePath = path.relative(path.join(__dirname, '..'), fullPath).replace(/\\/g, '/');
        const content = fs.readFileSync(fullPath, 'utf8');
        const docType = getDocType(relativePath);

        // Extract anchors
        const anchors = [];
        const anchorRegex = /<!--\s*id:\s*(\w+)\s*-->/g;
        let anchorMatch;
        while ((anchorMatch = anchorRegex.exec(content)) !== null) {
          anchors.push(anchorMatch[1]);
        }

        // Add node
        nodes.set(relativePath, {
          type: docType,
          path: relativePath,
          anchors
        });

        // Parse dependencies (from Feature Spec Dependencies section)
        const deps = parseDependencies(content);
        for (const dep of deps) {
          edges.push({
            from: dep.name,
            to: relativePath,
            type: 'depends',
            dependencyType: dep.type,
            description: dep.description
          });
        }

        // Parse references
        const refs = parseReferences(content, relativePath);
        for (const ref of refs) {
          edges.push({
            from: ref.path,
            to: relativePath,
            type: 'references',
            anchor: ref.anchor
          });
        }
      }
    }
  }

  // Scan both requirements and designs directories
  scanDir(REQUIREMENTS_DIR);
  scanDir(DESIGNS_DIR);

  // Add document edges from index.json
  if (index && index.documents) {
    const prdPath = 'docs/requirements/prd.md';
    const prdNode = nodes.get(prdPath);

    for (const doc of index.documents) {
      // Skip if no path
      if (!doc.path) continue;

      // Add PRD -> Feature/Flow/Capability edges
      if (doc.type === 'feature' || doc.type === 'flow' || doc.type === 'capability') {
        // Look for matching feat_ref_ anchor in PRD
        const featureRefAnchor = `feat_ref_${doc.id.replace(/-/g, '_')}`;
        const anchorPath = `${prdPath}#${featureRefAnchor}`;

        if (prdNode && prdNode.anchors && prdNode.anchors.includes(featureRefAnchor)) {
          // Create a virtual node for the feature reference
          nodes.set(anchorPath, {
            type: 'prd-feature-ref',
            path: anchorPath,
            anchors: [featureRefAnchor],
            featureName: doc.id
          });

          // Edge: feat_ref anchor -> Document
          edges.push({
            from: anchorPath,
            to: doc.path,
            type: 'defines',
            featureName: doc.id
          });
        } else {
          // Fallback: use whole PRD
          edges.push({
            from: prdPath,
            to: doc.path,
            type: 'defines',
            featureName: doc.id
          });
        }
      }

      // Add dependency edges from document's dependencies array
      if (doc.dependencies && Array.isArray(doc.dependencies)) {
        for (const dep of doc.dependencies) {
          edges.push({
            from: dep.id,
            to: doc.path,
            type: 'depends',
            dependencyType: dep.type,
            featureName: doc.id
          });
        }
      }

      // Add artifacts edges for code type features
      if (doc.workMode === 'code' && doc.artifacts) {
        const featureDocPath = doc.path;

        // Design doc edge
        if (doc.artifacts.design) {
          const designPath = doc.artifacts.design;
          if (!nodes.has(designPath)) {
            nodes.set(designPath, {
              type: 'design-doc',
              path: designPath,
              anchors: [],
              featureName: doc.id
            });
          }
          edges.push({
            from: featureDocPath,
            to: designPath,
            type: 'produces',
            featureName: doc.id
          });
        }

        // Code edges
        if (doc.artifacts.code) {
          for (const codePath of doc.artifacts.code) {
            if (!nodes.has(codePath)) {
              nodes.set(codePath, {
                type: 'code',
                path: codePath,
                anchors: [],
                featureName: doc.id
              });
            }
            edges.push({
              from: featureDocPath,
              to: codePath,
              type: 'produces',
              featureName: doc.id
            });
          }
        }

        // Test edges
        if (doc.artifacts.tests) {
          for (const testPath of doc.artifacts.tests) {
            if (!nodes.has(testPath)) {
              nodes.set(testPath, {
                type: 'test',
                path: testPath,
                anchors: [],
                featureName: doc.id
              });
            }
            edges.push({
              from: featureDocPath,
              to: testPath,
              type: 'produces',
              featureName: doc.id
            });

            // Test -> Code edges
            if (doc.artifacts.code) {
              for (const codePath of doc.artifacts.code) {
                edges.push({
                  from: testPath,
                  to: codePath,
                  type: 'tests',
                  featureName: doc.id
                });
              }
            }
          }
        }
      }
    }
  }

  return { nodes, edges };
}

// Find all documents that depend on the changed file
function findImpactedDocuments(graph, changedFile, maxDepth = 2) {
  const directImpacts = [];
  const indirectImpacts = [];
  const visited = new Set();

  // Normalize path
  const normalizedChangedFile = changedFile.replace(/\\/g, '/');

  // Find feature name from path (for matching dependencies)
  const changedFileName = path.basename(normalizedChangedFile, '.spec.md')
    .replace('.md', '')
    .replace(/-/g, '-');

  function findDependents(targetFile, depth, parentPath) {
    if (depth > maxDepth) return;
    if (visited.has(targetFile + ':' + depth)) return;
    visited.add(targetFile + ':' + depth);

    for (const edge of graph.edges) {
      // Check if this edge points FROM the changed file TO another
      const fromMatches = edge.from === targetFile ||
                          edge.from === changedFileName ||
                          edge.from.includes(changedFileName);

      if (fromMatches && edge.to !== targetFile) {
        const impact = {
          path: edge.to,
          type: edge.type,
          reason: getImpactReason(edge, targetFile),
          depth
        };

        if (depth === 1) {
          if (!directImpacts.find(i => i.path === impact.path)) {
            directImpacts.push(impact);
          }
        } else {
          if (!indirectImpacts.find(i => i.path === impact.path) &&
              !directImpacts.find(i => i.path === impact.path)) {
            impact.via = parentPath;
            indirectImpacts.push(impact);
          }
        }

        // Recurse
        findDependents(edge.to, depth + 1, edge.to);
      }
    }
  }

  findDependents(normalizedChangedFile, 1, null);

  return { directImpacts, indirectImpacts };
}

function getImpactReason(edge, sourceFile) {
  switch (edge.type) {
    case 'depends':
      return `依赖 ${edge.from}${edge.dependencyType === 'hard' ? '（硬依赖）' : '（软依赖）'}`;
    case 'references':
      return `引用了 ${edge.from}${edge.anchor ? '#' + edge.anchor : ''}`;
    case 'defines':
      return `由 PRD 定义`;
    case 'implements':
      return `实现了规范`;
    case 'produces':
      return `由 Feature Spec 产出`;
    case 'tests':
      return `测试覆盖`;
    default:
      return `关联于 ${edge.from}`;
  }
}

// Generate suggested subtasks from impacts
function generateSubtasks(directImpacts, indirectImpacts, changedFile) {
  const subtasks = [];
  const timestamp = Date.now();

  // Direct impacts first
  directImpacts.forEach((impact, index) => {
    subtasks.push({
      id: `st_${timestamp}_${String(index + 1).padStart(3, '0')}`,
      description: `检查 ${path.basename(impact.path)} 是否需要更新`,
      target: impact.path,
      status: 'pending',
      createdAt: toBeijingISOString(),
      source: 'impact-analysis'
    });
  });

  // Then indirect impacts
  indirectImpacts.forEach((impact, index) => {
    subtasks.push({
      id: `st_${timestamp}_${String(directImpacts.length + index + 1).padStart(3, '0')}`,
      description: `检查 ${path.basename(impact.path)} 是否受间接影响`,
      target: impact.path,
      status: 'pending',
      createdAt: toBeijingISOString(),
      source: 'impact-analysis'
    });
  });

  return subtasks;
}

// Write subtasks to state.json (with deduplication)
function writeSubtasksToState(subtasks, activeFeatureId) {
  let state = null;
  try {
    state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch (e) {
    console.error('Error: Could not read state.json');
    return { added: 0, skipped: 0 };
  }

  // Ensure subtasks array exists
  if (!state.subtasks) {
    state.subtasks = [];
  }

  // Get existing targets for deduplication
  const existingTargets = new Set(
    state.subtasks
      .filter(st => st.target)
      .map(st => st.target)
  );

  let added = 0;
  let skipped = 0;

  for (const subtask of subtasks) {
    // Check if subtask with same target already exists
    if (subtask.target && existingTargets.has(subtask.target)) {
      skipped++;
      continue;
    }

    // Add featureId from active feature or first active feature
    const featureId = activeFeatureId ||
      (state.flow && state.flow.activeFeatures && state.flow.activeFeatures[0]) ||
      'unknown';

    state.subtasks.push({
      ...subtask,
      featureId
    });
    added++;

    // Track for deduplication
    if (subtask.target) {
      existingTargets.add(subtask.target);
    }
  }

  // Update metadata
  state.lastUpdated = toBeijingISOString();
  if (state.metadata) {
    state.metadata.stateFileVersion = (state.metadata.stateFileVersion || 0) + 1;
  }

  // Write back to state.json
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');

  return { added, skipped };
}

// Format output in standard format
function formatOutput(changedFile, directImpacts, indirectImpacts, subtasks) {
  const lines = [];

  lines.push(`【变更】：${changedFile}`);
  lines.push('');

  if (directImpacts.length > 0) {
    lines.push('【直接影响】：');
    for (const impact of directImpacts) {
      lines.push(`  - ${impact.path}：${impact.reason}`);
    }
    lines.push('');
  } else {
    lines.push('【直接影响】：无');
    lines.push('');
  }

  if (indirectImpacts.length > 0) {
    lines.push('【间接影响】：');
    for (const impact of indirectImpacts) {
      lines.push(`  - ${impact.path}：因为依赖 ${impact.via}，需要检查`);
    }
    lines.push('');
  }

  if (subtasks.length > 0) {
    lines.push('【建议子任务】：');
    subtasks.forEach((task, index) => {
      lines.push(`  ${index + 1}. ${task.description}`);
    });
    lines.push('');
  }

  // Suggest operation order
  if (directImpacts.length > 0 || indirectImpacts.length > 0) {
    const order = [];
    const specs = directImpacts.filter(i => i.path.includes('/specs/'));
    const templates = directImpacts.filter(i => i.path.includes('/templates/'));
    const designDocs = directImpacts.filter(i => i.path.endsWith('.design.md'));
    const code = directImpacts.filter(i => i.path.startsWith('src/') || i.path.includes('/src/'));
    const tests = directImpacts.filter(i => i.path.startsWith('tests/') || i.path.includes('/tests/'));
    const others = directImpacts.filter(i =>
      !i.path.includes('/specs/') &&
      !i.path.includes('/templates/') &&
      !i.path.endsWith('.design.md') &&
      !i.path.startsWith('src/') &&
      !i.path.includes('/src/') &&
      !i.path.startsWith('tests/') &&
      !i.path.includes('/tests/')
    );

    if (templates.length > 0) order.push('模板');
    if (specs.length > 0) order.push('规范');
    if (designDocs.length > 0) order.push('设计文档');
    if (code.length > 0) order.push('代码');
    if (tests.length > 0) order.push('测试');
    if (others.length > 0) order.push('其他文档');
    if (indirectImpacts.length > 0) order.push('间接影响项');

    lines.push(`【建议操作顺序】：${order.join(' → ')}`);
  }

  return lines.join('\n');
}

// Parse command line options
function parseOptions(args) {
  const options = {
    write: false,
    depth: 2,
    json: false,
    file: null
  };

  for (const arg of args) {
    if (arg === '--write') {
      options.write = true;
    } else if (arg === '--json') {
      options.json = true;
    } else if (arg.startsWith('--depth=')) {
      const depthVal = parseInt(arg.split('=')[1], 10);
      if (!isNaN(depthVal) && depthVal > 0) {
        options.depth = depthVal;
      }
    } else if (!arg.startsWith('--')) {
      options.file = arg;
    }
  }

  return options;
}

// Main
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: node scripts/analyze-impact.js <changed-file> [options]');
    console.log('');
    console.log('Options:');
    console.log('  --write       Write subtasks to state.json');
    console.log('  --depth=N     Set max analysis depth (default: 2)');
    console.log('  --json        Output subtasks as JSON');
    console.log('');
    console.log('Examples:');
    console.log('  node scripts/analyze-impact.js docs/specs/spec-requirements.md');
    console.log('  node scripts/analyze-impact.js docs/specs/spec-requirements.md --write');
    console.log('  node scripts/analyze-impact.js docs/specs/spec-requirements.md --depth=3');
    process.exit(0);
  }

  const options = parseOptions(args);

  if (!options.file) {
    console.error('Error: No file specified');
    process.exit(1);
  }

  const changedFile = options.file;
  let changedPath = changedFile;
  let changedAnchor = null;

  // Parse anchor if provided
  if (changedFile.includes('#')) {
    const parts = changedFile.split('#');
    changedPath = parts[0];
    changedAnchor = parts[1];
  }

  // Check if file exists
  const fullPath = path.join(__dirname, '..', changedPath);
  if (!fs.existsSync(fullPath)) {
    console.error(`Error: File not found: ${changedPath}`);
    process.exit(1);
  }

  console.log('=== Change Impact Analysis ===\n');
  console.log('Building dependency graph...');

  const graph = buildDependencyGraph();
  console.log(`Found ${graph.nodes.size} documents, ${graph.edges.length} dependencies\n`);

  // If anchor is specified, use the anchor path for analysis
  const analysisTarget = changedAnchor ? `${changedPath}#${changedAnchor}` : changedPath;

  const { directImpacts, indirectImpacts } = findImpactedDocuments(graph, analysisTarget, options.depth);
  const subtasks = generateSubtasks(directImpacts, indirectImpacts, changedFile);

  console.log('=== Analysis Result ===\n');
  console.log(formatOutput(changedFile, directImpacts, indirectImpacts, subtasks));

  // Write subtasks to state.json if --write is specified
  if (options.write && subtasks.length > 0) {
    console.log('\n=== Writing Subtasks ===\n');
    const result = writeSubtasksToState(subtasks);
    console.log(`Added ${result.added} subtask(s), skipped ${result.skipped} duplicate(s)`);
  }

  // Output subtasks as JSON for programmatic use
  if (options.json) {
    console.log('\n=== Subtasks JSON ===\n');
    console.log(JSON.stringify(subtasks, null, 2));
  }
}

main();
