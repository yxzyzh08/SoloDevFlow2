#!/usr/bin/env node

/**
 * Change Impact Analysis Script
 * Analyzes the impact of changes to specification documents and templates
 *
 * Usage: node scripts/analyze-impact.js <changed-file>
 * Example: node scripts/analyze-impact.js docs/specs/requirements-doc.spec.md
 */

const fs = require('fs');
const path = require('path');

const DOCS_DIR = path.join(__dirname, '..', 'docs');
const STATE_FILE = path.join(__dirname, '..', '.flow', 'state.json');

// Document type detection
function getDocType(filePath) {
  if (filePath.includes('/templates/')) return 'template';
  if (filePath.endsWith('.spec.md') && filePath.includes('/specs/')) return 'spec';
  if (filePath.endsWith('.spec.md')) return 'feature-spec';
  if (filePath.endsWith('.design.md')) return 'design-doc';
  if (filePath.includes('prd.md')) return 'prd';
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

  // Read state.json for feature information
  let state = null;
  try {
    state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch (e) {
    console.error('Warning: Could not read state.json');
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

  scanDir(DOCS_DIR);

  // Add PRD Feature reference edges from state.json
  // Parse feat_ref_ anchors in PRD to create precise relationships
  if (state && state.features) {
    const prdPath = 'docs/prd.md';
    const prdNode = nodes.get(prdPath);

    if (prdNode && prdNode.anchors) {
      // Create edges from feat_ref_ anchors to Feature Specs
      for (const [featureName, feature] of Object.entries(state.features)) {
        if (feature.docPath) {
          // Look for matching feat_ref_ anchor
          const featureRefAnchor = `feat_ref_${featureName.replace(/-/g, '_')}`;
          const anchorPath = `${prdPath}#${featureRefAnchor}`;

          if (prdNode.anchors.includes(featureRefAnchor)) {
            // Create a virtual node for the feature reference
            nodes.set(anchorPath, {
              type: 'prd-feature-ref',
              path: anchorPath,
              anchors: [featureRefAnchor],
              featureName
            });

            // Edge: feat_ref anchor -> Feature Spec
            edges.push({
              from: anchorPath,
              to: feature.docPath,
              type: 'defines',
              featureName
            });
          } else {
            // Fallback: if no feat_ref_ anchor found, use whole PRD
            edges.push({
              from: prdPath,
              to: feature.docPath,
              type: 'defines',
              featureName
            });
          }
        }
      }
    } else {
      // Fallback: if PRD not parsed, create edges from whole PRD
      for (const [featureName, feature] of Object.entries(state.features)) {
        if (feature.docPath) {
          edges.push({
            from: 'docs/prd.md',
            to: feature.docPath,
            type: 'defines',
            featureName
          });
        }
      }
    }

    // Add artifacts edges for code type features (v1.2)
    for (const [featureName, feature] of Object.entries(state.features)) {
      if (feature.type === 'code' && feature.artifacts) {
        const featureDocPath = feature.docPath;

        // Design doc edge
        if (feature.artifacts.design) {
          const designPath = feature.artifacts.design;
          // Add design doc node if not exists
          if (!nodes.has(designPath)) {
            nodes.set(designPath, {
              type: 'design-doc',
              path: designPath,
              anchors: [],
              featureName
            });
          }
          edges.push({
            from: featureDocPath,
            to: designPath,
            type: 'produces',
            featureName
          });
        }

        // Code edges
        if (feature.artifacts.code) {
          for (const codePath of feature.artifacts.code) {
            // Add code node if not exists
            if (!nodes.has(codePath)) {
              nodes.set(codePath, {
                type: 'code',
                path: codePath,
                anchors: [],
                featureName
              });
            }
            edges.push({
              from: featureDocPath,
              to: codePath,
              type: 'produces',
              featureName
            });
          }
        }

        // Test edges
        if (feature.artifacts.tests) {
          for (const testPath of feature.artifacts.tests) {
            // Add test node if not exists
            if (!nodes.has(testPath)) {
              nodes.set(testPath, {
                type: 'test',
                path: testPath,
                anchors: [],
                featureName
              });
            }
            edges.push({
              from: featureDocPath,
              to: testPath,
              type: 'produces',
              featureName
            });

            // Test -> Code edges
            if (feature.artifacts.code) {
              for (const codePath of feature.artifacts.code) {
                edges.push({
                  from: testPath,
                  to: codePath,
                  type: 'tests',
                  featureName
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
      createdAt: new Date().toISOString(),
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
      createdAt: new Date().toISOString(),
      source: 'impact-analysis'
    });
  });

  return subtasks;
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

// Main
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: node scripts/analyze-impact.js <changed-file>[#anchor]');
    console.log('');
    console.log('Examples:');
    console.log('  node scripts/analyze-impact.js docs/specs/requirements-doc.spec.md');
    console.log('  node scripts/analyze-impact.js docs/templates/backend/feature.spec.md');
    console.log('  node scripts/analyze-impact.js "docs/prd.md#feat_ref_change_impact_tracking"');
    process.exit(0);
  }

  const changedFile = args[0];
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

  const { directImpacts, indirectImpacts } = findImpactedDocuments(graph, analysisTarget);
  const subtasks = generateSubtasks(directImpacts, indirectImpacts, changedFile);

  console.log('=== Analysis Result ===\n');
  console.log(formatOutput(changedFile, directImpacts, indirectImpacts, subtasks));

  // Output subtasks as JSON for programmatic use
  if (args.includes('--json')) {
    console.log('\n=== Subtasks JSON ===\n');
    console.log(JSON.stringify(subtasks, null, 2));
  }
}

main();
