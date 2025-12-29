#!/usr/bin/env node

/**
 * Document Contract Validation Script
 * Validates documents against their specification definitions
 *
 * Version: 1.4
 * Implements: cap-document-validation v1.1
 * Based on: spec-meta.md v2.7, spec-requirements.md v2.10, spec-design.md v2.6, spec-test.md v1.2
 *
 * Features:
 *   - Frontmatter validation (type, version, inputs with array support)
 *   - id/status field validation for requirements/design docs (v12.0.0)
 *   - workMode validation for feature/capability/flow (v12.1.0)
 *   - phase validation including feature_review (v12.3.0)
 *   - Required section validation
 *   - Anchor format and uniqueness validation
 *   - Reference validation (markdown links to files and anchors)
 *   - Spec file detection and skip
 *
 * Usage:
 *   node scripts/validate-docs.js [doc-path]
 *   node scripts/validate-docs.js docs/requirements/prd.md
 *   node scripts/validate-docs.js  # validates all documents
 */

const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════════════════════════════
// META-SPEC v2.7 (硬编码，不从文档读取)
// ═══════════════════════════════════════════════════════════════════════════

const META_SPEC = {
  version: '2.7',

  // 1. Document Identity (Section 3.1)
  frontmatter: {
    required: true,
    requiredFields: ['type', 'version'],
    recommendedFields: ['id', 'status'],  // v12.0.0: 推荐字段
    optionalFields: ['inputs', 'priority', 'domain', 'phase']  // Design 文档 inputs 必填
  },

  // 2. Status values (v12.0.0)
  validStatus: ['not_started', 'in_progress', 'done'],

  // 2.5 Phase values (v12.3.0, workMode: code only)
  validPhases: [
    'pending',
    'feature_requirements',
    'feature_review',      // v12.3: 新增审核阶段
    'feature_design',
    'feature_implementation',
    'feature_verification',
    'done'
  ],

  // 2.6 workMode values (v12.1.0)
  validWorkModes: ['code', 'document'],

  // 3. Anchor Format (Section 6)
  anchor: {
    pattern: /<!--\s*id:\s*([a-z][a-z0-9_]*)\s*-->/g,
    identifierPattern: /^[a-z][a-z0-9_]*$/
  },

  // 4. Document Type Registry (Section 2)
  // 基于元规范第2章定义的文档类型
  typeRegistry: {
    // Requirements Documents
    'prd': { prefix: null, dir: 'docs/requirements/', specFile: 'spec-requirements.md', inputRequired: false },
    'feature': { prefix: 'fea-', dir: 'docs/requirements/features/', specFile: 'spec-requirements.md', inputRequired: false },
    'capability': { prefix: 'cap-', dir: 'docs/requirements/capabilities/', specFile: 'spec-requirements.md', inputRequired: false },
    'flow': { prefix: 'flow-', dir: 'docs/requirements/flows/', specFile: 'spec-requirements.md', inputRequired: false },
    // Design Documents
    'design': { prefix: 'des-', dir: 'docs/designs/', specFile: 'spec-design.md', inputRequired: true },
    // Test Documents (spec-test.md v1.2)
    'test-e2e': { prefix: 'test-', dir: 'docs/tests/e2e/', specFile: 'spec-test.md', inputRequired: true },
    'test-performance': { prefix: 'test-', dir: 'docs/tests/performance/', specFile: 'spec-test.md', inputRequired: true },
    'test-destructive': { prefix: 'test-', dir: 'docs/tests/destructive/', specFile: 'spec-test.md', inputRequired: true },
    'test-security': { prefix: 'test-', dir: 'docs/tests/security/', specFile: 'spec-test.md', inputRequired: true },
    // Spec Documents (不验证结构)
    'meta-spec': { prefix: 'spec-', dir: 'docs/specs/', specFile: null, inputRequired: false },
  },

  // 5. Specification Mapping (Section 7)
  specMapping: {
    declarationPattern: /<!--\s*defines:\s*(\S+)\s*-->/,
    // 项目类型（用于推断文档类型）
    projectTypes: ['backend', 'web-app', 'cli-tool', 'library', 'api-service', 'mobile-app'],
    // 不验证的类型（规范文档本身）
    skipTypes: ['meta-spec', 'requirements-spec', 'design-spec', 'test-spec', 'backend-dev-spec', 'frontend-dev-spec']
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════════

const DOCS_DIR = path.join(__dirname, '..', 'docs');
const REQUIREMENTS_DIR = path.join(DOCS_DIR, 'requirements');
const DESIGNS_DIR = path.join(DOCS_DIR, 'designs');
const TESTS_DIR = path.join(DOCS_DIR, 'tests');
const SPECS_DIR = path.join(DOCS_DIR, 'specs');

// 规范文件映射（基于元规范第5.5节）
const SPEC_FILES = {
  'spec-requirements.md': path.join(SPECS_DIR, 'spec-requirements.md'),
  'spec-design.md': path.join(SPECS_DIR, 'spec-design.md'),
  'spec-test.md': path.join(SPECS_DIR, 'spec-test.md'),
};

// ═══════════════════════════════════════════════════════════════════════════
// Parsing Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Parse YAML frontmatter from document
 * Supports simple key: value and key: followed by array items (- item)
 */
function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;

  const yaml = match[1];
  const result = {};
  const lines = yaml.split('\n');

  let currentKey = null;
  let currentArray = null;

  for (const line of lines) {
    // Check for array item (starts with -)
    if (line.trim().startsWith('-') && currentKey) {
      const value = line.trim().substring(1).trim();
      if (!currentArray) {
        currentArray = [];
        result[currentKey] = currentArray;
      }
      currentArray.push(value);
      continue;
    }

    const colonIndex = line.indexOf(':');
    if (colonIndex > 0 && !line.trim().startsWith('-')) {
      const key = line.substring(0, colonIndex).trim();
      let value = line.substring(colonIndex + 1).trim();

      // Remove quotes
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      currentKey = key;
      currentArray = null;

      // If value is empty, this might be an array (next lines will be - items)
      if (value === '') {
        result[key] = []; // Will be populated by array items
        currentArray = result[key];
      } else {
        result[key] = value;
      }
    }
  }

  return result;
}

/**
 * Parse anchors from document
 */
function parseAnchors(content) {
  const anchors = [];
  const regex = new RegExp(META_SPEC.anchor.pattern.source, 'g');
  let match;

  while ((match = regex.exec(content)) !== null) {
    anchors.push({
      id: match[1],
      position: match.index
    });
  }

  return anchors;
}

/**
 * Parse markdown links from document
 * Returns array of { text, path, anchor, position }
 */
function parseMarkdownLinks(content) {
  const links = [];
  // Match [text](path) or [text](path#anchor)
  const linkRegex = /\[([^\]]*)\]\(([^)#\s]+)(?:#([^)\s]+))?\)/g;
  let match;

  // Remove code blocks to avoid false positives
  const contentWithoutCodeBlocks = content.replace(/```[\s\S]*?```/g, '');

  while ((match = linkRegex.exec(contentWithoutCodeBlocks)) !== null) {
    const linkPath = match[2];
    // Skip external URLs, anchors-only references, and generic placeholders
    if (linkPath.startsWith('http://') ||
        linkPath.startsWith('https://') ||
        linkPath.startsWith('#') ||
        linkPath === 'path' ||
        linkPath.includes('{') ||  // Skip template variables like {path}
        !linkPath.includes('/') && !linkPath.includes('.')) {  // Skip single words without extension
      continue;
    }
    links.push({
      text: match[1],
      path: linkPath,
      anchor: match[3] || null,
      position: match.index
    });
  }

  return links;
}

/**
 * Check anchor uniqueness in document
 * Returns array of duplicate anchor ids
 */
function findDuplicateAnchors(anchors) {
  const seen = new Map();
  const duplicates = [];

  for (const anchor of anchors) {
    if (seen.has(anchor.id)) {
      duplicates.push(anchor.id);
    } else {
      seen.set(anchor.id, anchor.position);
    }
  }

  return [...new Set(duplicates)];
}

/**
 * Validate markdown link references
 * Returns array of { link, error }
 */
function validateReferences(links, docPath, allAnchors = new Map()) {
  const errors = [];
  const docDir = path.dirname(docPath);

  for (const link of links) {
    // Resolve relative path
    let targetPath = path.resolve(docDir, link.path);

    // Handle trailing slash for directories
    if (link.path.endsWith('/')) {
      targetPath = targetPath.replace(/\/$/, '');
    }

    // Check if file or directory exists
    if (!fs.existsSync(targetPath)) {
      errors.push({
        link,
        error: `Referenced file not found: ${link.path}`
      });
      continue;
    }

    // Skip anchor check for directories
    const stat = fs.statSync(targetPath);
    if (stat.isDirectory()) {
      continue;
    }

    // Check if anchor exists in target file
    if (link.anchor) {
      // Read target file and check for anchor
      let targetAnchors = allAnchors.get(targetPath);
      if (!targetAnchors) {
        try {
          const targetContent = fs.readFileSync(targetPath, 'utf8');
          targetAnchors = new Set(parseAnchors(targetContent).map(a => a.id));
          allAnchors.set(targetPath, targetAnchors);
        } catch (e) {
          errors.push({
            link,
            error: `Cannot read referenced file: ${link.path}`
          });
          continue;
        }
      }

      if (!targetAnchors.has(link.anchor)) {
        errors.push({
          link,
          error: `Referenced anchor not found: ${link.path}#${link.anchor}`
        });
      }
    }
  }

  return errors;
}

/**
 * Parse specification definitions from spec files
 * Returns a map of docType -> { sections: [...], definedAt: string }
 */
function parseSpecDefinitions(specContent) {
  const definitions = new Map();
  const lines = specContent.split('\n');

  let currentDefines = null;
  let currentSection = null;
  let inTable = false;
  let inCodeBlock = false;
  let tableHeaders = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Track code blocks to ignore their content
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    // Check for <!-- defines: xxx --> declaration
    const definesMatch = line.match(META_SPEC.specMapping.declarationPattern);
    if (definesMatch) {
      currentDefines = definesMatch[1];
      currentSection = line.match(/^##\s+[\d.]*\s*(.+?)\s*<!--/)?.[1]?.trim() || 'Unknown';
      definitions.set(currentDefines, {
        definedAt: `spec-requirements.md#${currentSection}`,
        sections: []
      });
      continue;
    }

    // If we're in a defines block, look for Required/Optional Sections tables
    if (currentDefines) {
      // Detect table start (Required Sections or Optional Sections)
      if (line.includes('| Section') || line.includes('| 章节')) {
        inTable = true;
        // Parse header row to find column positions
        tableHeaders = line.split('|').map(h => h.trim().toLowerCase());
        continue;
      }

      // Skip separator row
      if (inTable && line.match(/^\|[\s-|]+\|$/)) {
        continue;
      }

      // Parse table rows
      if (inTable && line.startsWith('|') && line.includes('|')) {
        const cells = line.split('|').map(c => c.trim());

        // Find column indices
        const sectionIdx = tableHeaders.findIndex(h => h.includes('section') || h.includes('章节'));
        const anchorIdx = tableHeaders.findIndex(h => h.includes('anchor') || h.includes('锚点'));
        const requiredIdx = tableHeaders.findIndex(h => h.includes('required') || h.includes('必填'));

        if (sectionIdx >= 0 && cells[sectionIdx]) {
          const sectionName = cells[sectionIdx].replace(/\*\*/g, '').trim();
          let anchor = cells[anchorIdx]?.replace(/`/g, '').trim() || '';
          const requiredText = cells[requiredIdx]?.toLowerCase() || '';
          const required = requiredText.includes('yes') || requiredText.includes('是');

          if (sectionName && !sectionName.includes('---')) {
            definitions.get(currentDefines).sections.push({
              name: sectionName,
              anchor: anchor,
              required: required
            });
          }
        }
        continue;
      }

      // End of table
      if (inTable && !line.startsWith('|')) {
        inTable = false;
      }

      // New section starts (not a subsection)
      if (line.match(/^## \d/) && !line.includes('defines:')) {
        currentDefines = null;
        inTable = false;
      }
    }
  }

  return definitions;
}

/**
 * Extract document name from file path (for anchor variable substitution)
 */
function getDocName(filePath) {
  const basename = path.basename(filePath, '.md');
  return basename.replace('.spec', '').replace(/-/g, '_');
}

/**
 * Infer document type from file path and prefix
 * Based on meta-spec v2.1 Section 5.6.1 Naming Rules
 */
function inferDocType(filePath, frontmatterType) {
  const basename = path.basename(filePath);
  const normalizedPath = filePath.replace(/\\/g, '/');

  // 1. 如果 frontmatter.type 是有效的文档类型，直接使用
  if (META_SPEC.typeRegistry[frontmatterType]) {
    return frontmatterType;
  }

  // 2. 基于文件名前缀推断类型（元规范5.6.1节）
  if (basename === 'prd.md') {
    return 'prd';
  }
  if (basename.startsWith('fea-')) {
    return 'feature';
  }
  if (basename.startsWith('cap-')) {
    return 'capability';
  }
  if (basename.startsWith('flow-')) {
    return 'flow';
  }
  if (basename.startsWith('des-')) {
    return 'design';
  }
  if (basename.startsWith('test-')) {
    // 根据目录区分测试类型
    if (normalizedPath.includes('/tests/e2e/')) {
      return 'test-e2e';
    }
    if (normalizedPath.includes('/tests/performance/')) {
      return 'test-performance';
    }
    if (normalizedPath.includes('/tests/destructive/')) {
      return 'test-destructive';
    }
    if (normalizedPath.includes('/tests/security/')) {
      return 'test-security';
    }
    return 'test-e2e'; // 默认
  }
  if (basename.startsWith('spec-')) {
    return 'meta-spec'; // 所有规范文档归为此类，不验证结构
  }

  // 3. 基于目录路径推断
  if (normalizedPath.includes('/docs/designs/')) {
    return 'design';
  }
  if (normalizedPath.includes('/docs/specs/')) {
    return 'meta-spec';
  }

  // 4. 如果 frontmatter type 是项目类型，无法推断
  if (META_SPEC.specMapping.projectTypes.includes(frontmatterType)) {
    return null;
  }

  return frontmatterType;
}

// ═══════════════════════════════════════════════════════════════════════════
// Validation Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check if file is a specification document (skip frontmatter validation)
 * Spec files use <!-- defines: xxx --> instead of frontmatter
 */
function isSpecDocument(filePath) {
  const basename = path.basename(filePath);
  const normalizedPath = filePath.replace(/\\/g, '/');

  // Check by path (in docs/specs/ directory)
  if (normalizedPath.includes('/docs/specs/')) {
    return true;
  }

  // Check by filename prefix (spec-*.md)
  if (basename.startsWith('spec-')) {
    return true;
  }

  return false;
}

/**
 * Validate a single document
 */
function validateDocument(filePath, specDefinitions) {
  const results = {
    file: filePath,
    errors: [],
    warnings: [],
    info: []
  };

  // 0. Skip spec documents (they use <!-- defines: --> not frontmatter)
  if (isSpecDocument(filePath)) {
    results.info.push('Spec document - skipping frontmatter and structure validation');
    return results;
  }

  // Read file
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    results.errors.push(`Cannot read file: ${e.message}`);
    return results;
  }

  // 1. Validate frontmatter
  const frontmatter = parseFrontmatter(content);
  if (!frontmatter) {
    results.errors.push('Missing frontmatter');
    return results;
  }

  for (const field of META_SPEC.frontmatter.requiredFields) {
    if (!frontmatter[field]) {
      results.errors.push(`Missing required frontmatter field: ${field}`);
    }
  }

  const frontmatterType = frontmatter.type;
  if (!frontmatterType) {
    return results;
  }

  // 1.5 Check recommended fields (id, status) for requirements/design docs
  // Note: PRD is excluded as it's a unique document that doesn't need status tracking
  const needsIdStatus = ['feature', 'capability', 'flow', 'design'].includes(frontmatterType) ||
    (filePath.includes('/requirements/') && !filePath.endsWith('prd.md')) ||
    filePath.includes('/designs/');

  if (needsIdStatus) {
    for (const field of META_SPEC.frontmatter.recommendedFields) {
      if (!frontmatter[field]) {
        results.warnings.push(`Missing recommended frontmatter field: ${field} (v12.0.0)`);
      }
    }

    // Validate status value if present
    if (frontmatter.status && !META_SPEC.validStatus.includes(frontmatter.status)) {
      results.errors.push(`Invalid status value: "${frontmatter.status}". Expected: ${META_SPEC.validStatus.join(', ')}`);
    }

    // Validate workMode for feature/capability/flow (v12.1.0)
    const needsWorkMode = ['feature', 'capability', 'flow'].includes(frontmatterType);
    if (needsWorkMode) {
      if (!frontmatter.workMode) {
        results.warnings.push(`Missing required workMode field for type: ${frontmatterType} (v12.1.0)`);
      } else if (!META_SPEC.validWorkModes.includes(frontmatter.workMode)) {
        results.errors.push(`Invalid workMode value: "${frontmatter.workMode}". Expected: ${META_SPEC.validWorkModes.join(', ')}`);
      }

      // Validate phase for workMode: code (v12.3.0)
      if (frontmatter.workMode === 'code' && frontmatter.phase) {
        if (!META_SPEC.validPhases.includes(frontmatter.phase)) {
          results.errors.push(`Invalid phase value: "${frontmatter.phase}". Expected: ${META_SPEC.validPhases.join(', ')}`);
        }
      }

      // Phase should not exist for workMode: document
      if (frontmatter.workMode === 'document' && frontmatter.phase) {
        results.warnings.push(`phase field should not be used with workMode: document`);
      }
    }
  }

  // 2. Infer actual document type
  const docType = inferDocType(filePath, frontmatterType);

  // 3. Check if this type should be validated
  if (!docType) {
    results.info.push(`Cannot infer document type for "${frontmatterType}", skipping validation`);
    return results;
  }

  // 4. Check if this is a spec type (skip structure validation)
  if (META_SPEC.specMapping.skipTypes.includes(docType) || docType === 'meta-spec') {
    results.info.push(`Type "${docType}" is a spec type, skipping structure validation`);
    return results;
  }

  // 5. Check inputs field for types that require it
  const typeConfig = META_SPEC.typeRegistry[docType];
  if (typeConfig && typeConfig.inputRequired) {
    const inputs = frontmatter.inputs;
    // Check if inputs is missing, empty string, or empty array
    const hasInputs = inputs && (Array.isArray(inputs) ? inputs.length > 0 : inputs.length > 0);
    if (!hasInputs) {
      results.errors.push(`Missing required 'inputs' field for type: ${docType}`);
    }
  }

  // 6. Find specification definition for this type
  const specDef = specDefinitions.get(docType);
  if (!specDef) {
    results.warnings.push(`No specification found for type: ${docType}`);
    return results;
  }

  // 7. Parse anchors in document
  const docAnchors = parseAnchors(content);
  const docAnchorIds = new Set(docAnchors.map(a => a.id));
  const docName = getDocName(filePath);

  // 8. Validate required sections by checking anchors
  for (const section of specDef.sections) {
    if (!section.anchor) continue;

    // Substitute {name} variable
    const expectedAnchor = section.anchor.replace('{name}', docName);

    if (section.required) {
      // Check if anchor exists
      const hasAnchor = docAnchorIds.has(expectedAnchor) ||
                        // Also check with different name derivations
                        Array.from(docAnchorIds).some(a => a.startsWith(expectedAnchor.split('_')[0] + '_'));

      if (!hasAnchor && !content.includes(section.name)) {
        results.errors.push(`Missing required section: ${section.name} (anchor: ${expectedAnchor})`);
      }
    } else {
      // Optional section - just info
      if (!docAnchorIds.has(expectedAnchor) && !content.includes(section.name)) {
        results.info.push(`Optional section not present: ${section.name}`);
      }
    }
  }

  // 9. Validate anchor format
  for (const anchor of docAnchors) {
    if (!META_SPEC.anchor.identifierPattern.test(anchor.id)) {
      results.warnings.push(`Invalid anchor format: ${anchor.id} (should match ${META_SPEC.anchor.identifierPattern})`);
    }
  }

  // 10. Check anchor uniqueness
  const duplicateAnchors = findDuplicateAnchors(docAnchors);
  for (const dup of duplicateAnchors) {
    results.errors.push(`Duplicate anchor: ${dup}`);
  }

  // 11. Validate markdown link references
  const links = parseMarkdownLinks(content);
  const refErrors = validateReferences(links, filePath);
  for (const refError of refErrors) {
    results.errors.push(refError.error);
  }

  return results;
}

/**
 * Find all documents to validate
 * Based on meta-spec v2.1 Section 5 Directory Structure
 */
function findDocuments(targetPath) {
  const docs = [];

  if (targetPath) {
    // Validate specific file
    const fullPath = path.isAbsolute(targetPath)
      ? targetPath
      : path.join(process.cwd(), targetPath);
    if (fs.existsSync(fullPath)) {
      docs.push(fullPath);
    }
    return docs;
  }

  // Find all markdown files in docs/
  function scanDir(dir, skipDirs = []) {
    if (!fs.existsSync(dir)) {
      return;
    }

    let items;
    try {
      items = fs.readdirSync(dir);
    } catch (e) {
      return;
    }

    for (const item of items) {
      const fullPath = path.join(dir, item);
      let stat;
      try {
        stat = fs.statSync(fullPath);
      } catch (e) {
        continue;
      }

      if (stat.isDirectory()) {
        // Skip specified directories
        if (!skipDirs.includes(item)) {
          scanDir(fullPath, skipDirs);
        }
      } else if (item.endsWith('.md') && !item.startsWith('_archive')) {
        docs.push(fullPath);
      }
    }
  }

  // Scan all documentation directories (based on meta-spec v2.1 Section 5.1)
  // Skip templates, referenceProducts, but include specs for validation
  scanDir(REQUIREMENTS_DIR, ['templates', 'referenceProducts']);
  scanDir(DESIGNS_DIR, ['templates']);
  scanDir(TESTS_DIR, []);
  scanDir(SPECS_DIR, []);  // Include specs directory

  return docs;
}

/**
 * Load all specification definitions from multiple spec files
 */
function loadAllSpecDefinitions() {
  const allDefinitions = new Map();

  for (const [specName, specPath] of Object.entries(SPEC_FILES)) {
    if (fs.existsSync(specPath)) {
      const specContent = fs.readFileSync(specPath, 'utf8');
      const definitions = parseSpecDefinitions(specContent);

      for (const [type, def] of definitions) {
        allDefinitions.set(type, {
          ...def,
          sourceFile: specName
        });
      }
    }
  }

  return allDefinitions;
}

// ═══════════════════════════════════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════════════════════════════════

function main() {
  const args = process.argv.slice(2);
  // Filter out flags
  const targetPath = args.find(a => !a.startsWith('--'));
  const verbose = args.includes('--verbose');

  console.log('=== Document Contract Validation ===\n');
  console.log(`Meta-Spec: v${META_SPEC.version} (hardcoded)`);
  console.log(`Specs Directory: ${path.relative(process.cwd(), SPECS_DIR)}\n`);

  // Load specification definitions from all spec files
  const specDefinitions = loadAllSpecDefinitions();

  // Show loaded spec files
  console.log('Spec files checked:');
  for (const [specName, specPath] of Object.entries(SPEC_FILES)) {
    const exists = fs.existsSync(specPath);
    console.log(`  - ${specName}: ${exists ? '✓' : '✗ (not found)'}`);
  }
  console.log('');

  console.log('Loaded specifications for types:');
  for (const [type, def] of specDefinitions) {
    const source = def.sourceFile ? ` (from ${def.sourceFile})` : '';
    console.log(`  - ${type}: ${def.sections.length} sections defined${source}`);
  }
  console.log('');

  // Find documents to validate
  const documents = findDocuments(targetPath);

  if (documents.length === 0) {
    console.log('No documents to validate.');
    return;
  }

  console.log(`Validating ${documents.length} document(s)...\n`);

  // Validate each document
  let totalErrors = 0;
  let totalWarnings = 0;

  for (const doc of documents) {
    const relativePath = path.relative(process.cwd(), doc);
    const results = validateDocument(doc, specDefinitions);

    const hasIssues = results.errors.length > 0 || results.warnings.length > 0;

    if (hasIssues || verbose) {
      console.log(`--- ${relativePath} ---`);

      if (results.errors.length > 0) {
        console.log('  Errors:');
        results.errors.forEach(e => console.log(`    [ERROR] ${e}`));
        totalErrors += results.errors.length;
      }

      if (results.warnings.length > 0) {
        console.log('  Warnings:');
        results.warnings.forEach(w => console.log(`    [WARN] ${w}`));
        totalWarnings += results.warnings.length;
      }

      if (verbose && results.info.length > 0) {
        console.log('  Info:');
        results.info.forEach(i => console.log(`    [INFO] ${i}`));
      }

      console.log('');
    }
  }

  // Summary
  console.log('=== Validation Summary ===\n');
  console.log(`Documents: ${documents.length}`);
  console.log(`Errors: ${totalErrors}`);
  console.log(`Warnings: ${totalWarnings}`);

  if (totalErrors === 0 && totalWarnings === 0) {
    console.log('\n✓ All documents pass validation!');
  } else if (totalErrors === 0) {
    console.log('\n⚠ Validation passed with warnings.');
  } else {
    console.log('\n✗ Validation failed with errors.');
    process.exit(1);
  }
}

main();
