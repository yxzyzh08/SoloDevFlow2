#!/usr/bin/env node

/**
 * Documentation Separation Migration Script
 * Migrates from unified docs/ structure to separated docs/requirements/ and docs/designs/
 *
 * Implements: spec-meta.md v2.1 directory structure
 *
 * Usage:
 *   node scripts/migrate-docs-separation.js [options]
 *
 * Options:
 *   --dry-run              Preview changes without executing
 *   --rollback <path>      Rollback from backup
 *   --verbose              Show detailed output
 *
 * Safety Features:
 *   - Git clean check
 *   - Automatic backup with timestamp
 *   - Checksum verification
 *   - Rollback script generation
 *   - Dry-run mode
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

// ═══════════════════════════════════════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════════════════════════════════════

const PROJECT_ROOT = path.join(__dirname, '..');
const DOCS_DIR = path.join(PROJECT_ROOT, 'docs');
const REQUIREMENTS_DIR = path.join(PROJECT_ROOT, 'docs', 'requirements');
const DESIGNS_DIR = path.join(PROJECT_ROOT, 'docs', 'designs');
const STATE_FILE = path.join(PROJECT_ROOT, '.flow', 'state.json');
const BACKUP_DIR = path.join(PROJECT_ROOT, '.backups');

// Parse command line arguments
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const VERBOSE = args.includes('--verbose') || DRY_RUN;
const ROLLBACK_PATH = args.find((arg, i) => args[i - 1] === '--rollback');

// Migration state
const migrationState = {
  filesMoved: [],
  filesUpdated: [],
  errors: [],
  warnings: []
};

// ═══════════════════════════════════════════════════════════════════════════
// Utility Functions
// ═══════════════════════════════════════════════════════════════════════════

function log(msg, level = 'INFO') {
  const colors = {
    INFO: '\x1b[36m',
    SUCCESS: '\x1b[32m',
    WARN: '\x1b[33m',
    ERROR: '\x1b[31m',
    DRY: '\x1b[35m'
  };
  const prefix = DRY_RUN && level === 'INFO' ? 'DRY' : level;
  console.log(`${colors[prefix] || ''}[${prefix}]\x1b[0m ${msg}`);
}

function verbose(msg) {
  if (VERBOSE) {
    console.log(`  ${msg}`);
  }
}

function calculateChecksum(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('md5').update(content).digest('hex');
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    if (!DRY_RUN) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    verbose(`Created directory: ${path.relative(PROJECT_ROOT, dirPath)}`);
  }
}

function copyFile(src, dest) {
  ensureDir(path.dirname(dest));
  const checksumBefore = calculateChecksum(src);

  if (!DRY_RUN) {
    fs.copyFileSync(src, dest);
    const checksumAfter = calculateChecksum(dest);

    if (checksumBefore !== checksumAfter) {
      throw new Error(`Checksum mismatch for ${src} -> ${dest}`);
    }
  }

  return checksumBefore;
}

// ═══════════════════════════════════════════════════════════════════════════
// Stage 1: Validation
// ═══════════════════════════════════════════════════════════════════════════

function validatePreconditions() {
  log('Stage 1: Validating preconditions...');

  // Check if docs directory exists
  if (!fs.existsSync(DOCS_DIR)) {
    throw new Error('docs/ directory not found');
  }

  // Check if already migrated
  if (fs.existsSync(REQUIREMENTS_DIR) || fs.existsSync(DESIGNS_DIR)) {
    log('Migration directories already exist. This project may already be migrated.', 'WARN');
    log('If you want to re-migrate, please manually remove docs/requirements/ and docs/designs/ first.', 'WARN');
    throw new Error('Migration target directories already exist');
  }

  // Check git status (only if git is available)
  try {
    const gitStatus = execSync('git status --porcelain', { cwd: PROJECT_ROOT }).toString();
    if (gitStatus.trim() !== '') {
      log('Git working directory is not clean:', 'WARN');
      console.log(gitStatus);
      log('Recommendation: Commit or stash changes before migration', 'WARN');

      // Don't throw error, just warn
      migrationState.warnings.push('Git working directory not clean');
    }
  } catch (e) {
    verbose('Git not available or not a git repository');
  }

  // Check if state.json exists and is valid
  if (fs.existsSync(STATE_FILE)) {
    try {
      JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
      verbose('state.json is valid JSON');
    } catch (e) {
      throw new Error(`state.json is invalid: ${e.message}`);
    }
  }

  log('Validation passed ✓', 'SUCCESS');
}

// ═══════════════════════════════════════════════════════════════════════════
// Stage 2: Backup
// ═══════════════════════════════════════════════════════════════════════════

function createBackup() {
  log('Stage 2: Creating backup...');

  if (DRY_RUN) {
    log('Skipping backup in dry-run mode', 'DRY');
    return null;
  }

  ensureDir(BACKUP_DIR);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const backupName = `migration-v2.1-${timestamp}`;
  const backupPath = path.join(BACKUP_DIR, backupName);

  ensureDir(backupPath);

  // Copy docs/ directory
  log('Backing up docs/ directory...');
  execSync(`xcopy "${DOCS_DIR}" "${path.join(backupPath, 'docs')}" /E /I /H /Y`, { stdio: 'ignore' });

  // Copy state.json if exists
  if (fs.existsSync(STATE_FILE)) {
    log('Backing up state.json...');
    fs.copyFileSync(STATE_FILE, path.join(backupPath, 'state.json'));
  }

  // Generate rollback script
  const rollbackScript = generateRollbackScript(backupPath);
  fs.writeFileSync(path.join(backupPath, 'rollback.bat'), rollbackScript);

  log(`Backup created: ${backupName}`, 'SUCCESS');
  log(`Rollback: node scripts/migrate-docs-separation.js --rollback "${backupPath}"`, 'INFO');

  return backupPath;
}

function generateRollbackScript(backupPath) {
  return `@echo off
REM Rollback script generated by migrate-docs-separation.js
REM Backup location: ${backupPath}

echo Rolling back documentation structure migration...

REM Remove new directories
if exist "${REQUIREMENTS_DIR}" rmdir /S /Q "${REQUIREMENTS_DIR}"
if exist "${DESIGNS_DIR}" rmdir /S /Q "${DESIGNS_DIR}"

REM Restore from backup
xcopy "${path.join(backupPath, 'docs')}" "${DOCS_DIR}" /E /I /H /Y
if exist "${path.join(backupPath, 'state.json')}" copy /Y "${path.join(backupPath, 'state.json')}" "${STATE_FILE}"

echo Rollback completed!
pause
`;
}

// ═══════════════════════════════════════════════════════════════════════════
// Stage 3: Scan & Build Mapping
// ═══════════════════════════════════════════════════════════════════════════

function scanAndBuildMapping() {
  log('Stage 3: Scanning files and building migration map...');

  const fileMap = [];

  function scanDir(dir, relativePath = '') {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const relPath = path.join(relativePath, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        // Skip backup directories
        if (item === '.backups') continue;

        scanDir(fullPath, relPath);
      } else if (item.endsWith('.md')) {
        const mapping = remapPath(relPath);
        if (mapping) {
          fileMap.push({
            oldPath: fullPath,
            newPath: path.join(PROJECT_ROOT, mapping.newPath),
            relativePath: relPath,
            type: mapping.type,
            checksum: calculateChecksum(fullPath)
          });
        }
      }
    }
  }

  scanDir(DOCS_DIR);

  log(`Found ${fileMap.length} files to migrate`, 'SUCCESS');

  if (VERBOSE) {
    log('Migration map:', 'INFO');
    fileMap.forEach(m => {
      verbose(`  ${m.relativePath} -> ${path.relative(PROJECT_ROOT, m.newPath)} [${m.type}]`);
    });
  }

  return fileMap;
}

function remapPath(relativePath) {
  const normalized = relativePath.replace(/\\/g, '/');

  // PRD
  if (normalized === 'prd.md') {
    return { newPath: 'docs/requirements/prd.md', type: 'prd' };
  }

  // Specs directory -> requirements/specs/
  if (normalized.startsWith('specs/')) {
    return { newPath: `docs/requirements/${normalized}`, type: 'spec' };
  }

  // Templates directory -> requirements/templates/
  if (normalized.startsWith('templates/')) {
    return { newPath: `docs/requirements/${normalized}`, type: 'template' };
  }

  // Feature Specs (.spec.md) -> requirements/
  if (normalized.endsWith('.spec.md')) {
    return { newPath: `docs/requirements/${normalized}`, type: 'feature-spec' };
  }

  // Design Docs (.design.md) -> designs/
  if (normalized.endsWith('.design.md')) {
    return { newPath: `docs/designs/${normalized}`, type: 'design-doc' };
  }

  // Other markdown files -> requirements/ (default)
  return { newPath: `docs/requirements/${normalized}`, type: 'document' };
}

// ═══════════════════════════════════════════════════════════════════════════
// Stage 4: Migrate Files
// ═══════════════════════════════════════════════════════════════════════════

function migrateFiles(fileMap) {
  log('Stage 4: Migrating files...');

  let successCount = 0;
  let errorCount = 0;

  for (const mapping of fileMap) {
    try {
      verbose(`Migrating: ${mapping.relativePath}`);
      copyFile(mapping.oldPath, mapping.newPath);

      migrationState.filesMoved.push({
        from: mapping.relativePath,
        to: path.relative(PROJECT_ROOT, mapping.newPath)
      });

      successCount++;
    } catch (error) {
      log(`Failed to migrate ${mapping.relativePath}: ${error.message}`, 'ERROR');
      migrationState.errors.push(`Migration failed: ${mapping.relativePath}`);
      errorCount++;
    }
  }

  log(`Migrated ${successCount} files successfully`, 'SUCCESS');
  if (errorCount > 0) {
    log(`${errorCount} files failed to migrate`, 'ERROR');
  }

  if (errorCount > 0) {
    throw new Error('Migration failed for some files');
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Stage 5: Update References
// ═══════════════════════════════════════════════════════════════════════════

function updateReferences(fileMap) {
  log('Stage 5: Updating references...');

  // Update state.json paths
  if (fs.existsSync(STATE_FILE)) {
    updateStateJson(fileMap);
  }

  // Update cross-references in documents (future enhancement)
  // For now, we'll just log this as a TODO
  log('Note: Cross-reference updates in documents should be done manually or with a follow-up script', 'WARN');
  migrationState.warnings.push('Manual review of cross-references recommended');
}

function updateStateJson(fileMap) {
  log('Updating state.json...');

  if (DRY_RUN) {
    log('Skipping state.json update in dry-run mode', 'DRY');
    return;
  }

  const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  let updated = false;

  // Update feature docPaths
  if (state.features) {
    for (const [featureName, feature] of Object.entries(state.features)) {
      if (feature.docPath) {
        const oldPath = feature.docPath;
        const mapping = fileMap.find(m => m.relativePath.replace(/\\/g, '/') === oldPath.replace(/\\/g, '/'));

        if (mapping) {
          const newPath = path.relative(PROJECT_ROOT, mapping.newPath).replace(/\\/g, '/');
          feature.docPath = newPath;
          updated = true;
          verbose(`Updated feature ${featureName}: ${oldPath} -> ${newPath}`);
        }
      }
    }
  }

  if (updated) {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    log('state.json updated', 'SUCCESS');
    migrationState.filesUpdated.push('state.json');
  } else {
    verbose('No updates needed for state.json');
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Stage 6: Verify
// ═══════════════════════════════════════════════════════════════════════════

function verify(fileMap) {
  log('Stage 6: Verifying migration...');

  if (DRY_RUN) {
    log('Skipping file verification in dry-run mode', 'DRY');
    return;
  }

  // Verify all files exist
  let allExist = true;
  for (const mapping of fileMap) {
    if (!fs.existsSync(mapping.newPath)) {
      log(`Missing file: ${path.relative(PROJECT_ROOT, mapping.newPath)}`, 'ERROR');
      allExist = false;
    }
  }

  if (!allExist) {
    throw new Error('Some files are missing after migration');
  }

  log('All files verified ✓', 'SUCCESS');

  // Run validation scripts if available
  const validateScript = path.join(PROJECT_ROOT, 'scripts', 'validate-docs.js');
  if (fs.existsSync(validateScript)) {
    log('Running document validation...');
    try {
      execSync('npm run validate:docs', { cwd: PROJECT_ROOT, stdio: 'inherit' });
      log('Document validation passed ✓', 'SUCCESS');
    } catch (e) {
      log('Document validation failed', 'WARN');
      migrationState.warnings.push('Document validation failed - manual review recommended');
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Rollback Function
// ═══════════════════════════════════════════════════════════════════════════

function rollback(backupPath) {
  log('Starting rollback from backup...');

  if (!fs.existsSync(backupPath)) {
    throw new Error(`Backup not found: ${backupPath}`);
  }

  log(`Restoring from: ${backupPath}`);

  // Remove new directories
  if (fs.existsSync(REQUIREMENTS_DIR)) {
    fs.rmSync(REQUIREMENTS_DIR, { recursive: true, force: true });
    log('Removed docs/requirements/');
  }

  if (fs.existsSync(DESIGNS_DIR)) {
    fs.rmSync(DESIGNS_DIR, { recursive: true, force: true });
    log('Removed docs/designs/');
  }

  // Restore docs
  const backupDocs = path.join(backupPath, 'docs');
  if (fs.existsSync(backupDocs)) {
    execSync(`xcopy "${backupDocs}" "${DOCS_DIR}" /E /I /H /Y`);
    log('Restored docs/ directory');
  }

  // Restore state.json
  const backupState = path.join(backupPath, 'state.json');
  if (fs.existsSync(backupState)) {
    fs.copyFileSync(backupState, STATE_FILE);
    log('Restored state.json');
  }

  log('Rollback completed successfully!', 'SUCCESS');
}

// ═══════════════════════════════════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════════════════════════════════

function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Documentation Separation Migration (spec-meta v2.1)');
  console.log('═══════════════════════════════════════════════════════════\n');

  if (DRY_RUN) {
    log('Running in DRY-RUN mode - no changes will be made', 'DRY');
  }

  try {
    // Rollback mode
    if (ROLLBACK_PATH) {
      rollback(ROLLBACK_PATH);
      return;
    }

    // Normal migration flow
    validatePreconditions();
    const backupPath = createBackup();
    const fileMap = scanAndBuildMapping();
    migrateFiles(fileMap);
    updateReferences(fileMap);
    verify(fileMap);

    // Summary
    console.log('\n═══════════════════════════════════════════════════════════');
    log('Migration Summary', 'SUCCESS');
    console.log('═══════════════════════════════════════════════════════════\n');
    log(`Files moved: ${migrationState.filesMoved.length}`);
    log(`Files updated: ${migrationState.filesUpdated.length}`);
    log(`Warnings: ${migrationState.warnings.length}`);
    log(`Errors: ${migrationState.errors.length}`);

    if (migrationState.warnings.length > 0) {
      console.log('\nWarnings:');
      migrationState.warnings.forEach(w => log(`  - ${w}`, 'WARN'));
    }

    if (DRY_RUN) {
      console.log('\n');
      log('DRY-RUN completed. Run without --dry-run to execute migration.', 'DRY');
    } else {
      console.log('\n');
      log('Migration completed successfully! ✓', 'SUCCESS');
      log(`Backup location: ${backupPath}`, 'INFO');
      console.log('\nNext steps:');
      console.log('  1. Review the migrated files');
      console.log('  2. Run: npm run validate:docs');
      console.log('  3. Test your AI commands');
      console.log('  4. If everything works, commit the changes');
      console.log(`  5. If issues occur, rollback with: node scripts/migrate-docs-separation.js --rollback "${backupPath}"`);
    }

  } catch (error) {
    log(`\nMigration failed: ${error.message}`, 'ERROR');
    if (error.stack && VERBOSE) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();
