#!/usr/bin/env node

/**
 * Document Contract Validation Script
 * Validates documents against their specification definitions
 *
 * Implements: meta-spec.md v1.0
 *
 * Usage:
 *   node scripts/validate-docs.js [doc-path]
 *   node scripts/validate-docs.js docs/prd.md
 *   node scripts/validate-docs.js  # validates all documents
 */

const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════════════════════════════
// META-SPEC v1.0 (硬编码，不从文档读取)
// ═══════════════════════════════════════════════════════════════════════════

const META_SPEC = {
  // 1. Document Identity
  frontmatter: {
    required: true,
    requiredFields: ['type', 'version']
  },

  // 2. Anchor Format
  anchor: {
    pattern: /<!--\s*id:\s*([a-z][a-z0-9_]*)\s*-->/g,
    identifierPattern: /^[a-z][a-z0-9_]*$/
  },

  // 3. Specification Mapping
  specMapping: {
    declarationPattern: /<!--\s*defines:\s*(\S+)\s*-->/,
    // 项目类型（用于推断文档类型）
    projectTypes: ['backend', 'web-app', 'cli-tool', 'library', 'api-service', 'mobile-app'],
    // 不验证的类型（规范文档本身）
    skipTypes: ['spec']
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════════

const DOCS_DIR = path.join(__dirname, '..', 'docs');
const SPEC_FILE = path.join(DOCS_DIR, 'specs', 'requirements-doc.spec.md');

// ═══════════════════════════════════════════════════════════════════════════
// Parsing Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Parse YAML frontmatter from document
 */
function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;

  const yaml = match[1];
  const result = {};

  // Simple YAML parsing (key: value)
  yaml.split('\n').forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim();
      let value = line.substring(colonIndex + 1).trim();
      // Remove quotes
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      result[key] = value;
    }
  });

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
 * Parse specification definitions from requirements-doc.spec.md
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
        definedAt: `requirements-doc.spec.md#${currentSection}`,
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
 * Infer document type from file path
 * Used when frontmatter.type is a project type (backend, web-app, etc.)
 */
function inferDocType(filePath, frontmatterType) {
  const relativePath = path.relative(DOCS_DIR, filePath).replace(/\\/g, '/');
  const basename = path.basename(filePath);

  // PRD
  if (basename === 'prd.md') {
    return 'prd';
  }

  // Domain Spec
  if (basename === '_domain.spec.md') {
    return 'domain-spec';
  }

  // Feature Spec (in domain directory or _features)
  if (basename.endsWith('.spec.md') && !basename.startsWith('_')) {
    if (relativePath.includes('_capabilities/')) {
      return 'capability-spec';
    }
    if (relativePath.includes('_flows/')) {
      return 'flow-spec';
    }
    // Default to feature-spec for other .spec.md files
    return 'feature-spec';
  }

  // If frontmatter type is a project type, we can't determine doc type
  if (META_SPEC.specMapping.projectTypes.includes(frontmatterType)) {
    return null; // Can't infer, skip validation
  }

  return frontmatterType;
}

// ═══════════════════════════════════════════════════════════════════════════
// Validation Functions
// ═══════════════════════════════════════════════════════════════════════════

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

  // 2. Infer actual document type
  const docType = inferDocType(filePath, frontmatterType);

  // 3. Check if this type should be validated
  if (!docType) {
    results.info.push(`Cannot infer document type for "${frontmatterType}", skipping validation`);
    return results;
  }

  if (META_SPEC.specMapping.skipTypes.includes(docType)) {
    results.info.push(`Type "${docType}" is not validated (spec type)`);
    return results;
  }

  // 4. Find specification definition for this type
  const specDef = specDefinitions.get(docType);
  if (!specDef) {
    results.warnings.push(`No specification found for type: ${docType}`);
    return results;
  }

  // 4. Parse anchors in document
  const docAnchors = parseAnchors(content);
  const docAnchorIds = new Set(docAnchors.map(a => a.id));
  const docName = getDocName(filePath);

  // 5. Validate required sections by checking anchors
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

  // 6. Validate anchor format
  for (const anchor of docAnchors) {
    if (!META_SPEC.anchor.identifierPattern.test(anchor.id)) {
      results.warnings.push(`Invalid anchor format: ${anchor.id} (should match ${META_SPEC.anchor.identifierPattern})`);
    }
  }

  return results;
}

/**
 * Find all documents to validate
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
  function scanDir(dir) {
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
        // Skip templates, specs, and referenceProducts directories
        if (!['templates', 'specs', 'referenceProducts'].includes(item)) {
          scanDir(fullPath);
        }
      } else if (item.endsWith('.md') && !item.startsWith('_archive')) {
        docs.push(fullPath);
      }
    }
  }

  scanDir(DOCS_DIR);

  return docs;
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
  console.log('Meta-Spec: v1.0 (hardcoded)');
  console.log(`Spec File: ${path.relative(process.cwd(), SPEC_FILE)}\n`);

  // Load specification definitions
  if (!fs.existsSync(SPEC_FILE)) {
    console.error('ERROR: requirements-doc.spec.md not found');
    process.exit(1);
  }

  const specContent = fs.readFileSync(SPEC_FILE, 'utf8');
  const specDefinitions = parseSpecDefinitions(specContent);

  console.log('Loaded specifications for types:');
  for (const [type, def] of specDefinitions) {
    console.log(`  - ${type}: ${def.sections.length} sections defined`);
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
