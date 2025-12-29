#!/usr/bin/env node

/**
 * state.json Validation Script
 * Validates state.json against v14.0 schema
 *
 * v12.0.0: Features removed, status tracked in document frontmatter
 * v12.1.0: Added subtasks field for cross-feature task tracking
 * v13.0.0: Removed session structure (never used in practice)
 * v14.0.0: Renamed activeFeatures to activeWorkItems, featureId to workitemId
 *
 * Usage: node scripts/validate-state.js
 */

const fs = require('fs');
const path = require('path');

const STATE_FILE = path.join(__dirname, '..', '.solodevflow', 'state.json');
const INDEX_FILE = path.join(__dirname, '..', '.solodevflow', 'index.json');

// Schema version
const EXPECTED_SCHEMA_VERSION = "14.0.0";

// Enums
const PROJECT_TYPES = ['web-app', 'cli-tool', 'backend', 'library', 'api-service', 'mobile-app'];
const RESEARCH_METHODS = ['top-down', 'bottom-up'];
const SUBTASK_STATUSES = ['pending', 'completed', 'skipped', 'in_progress'];
const SUBTASK_SOURCES = ['ai', 'impact-analysis', 'user', 'interrupted'];

let errors = [];
let warnings = [];

function error(message) {
  errors.push(`ERROR: ${message}`);
}

function warn(message) {
  warnings.push(`WARNING: ${message}`);
}

function validateRequired(obj, field, path) {
  if (obj[field] === undefined || obj[field] === null) {
    error(`Missing required field: ${path}.${field}`);
    return false;
  }
  return true;
}

function validateEnum(value, enumValues, path) {
  if (!enumValues.includes(value)) {
    error(`Invalid enum value at ${path}: "${value}". Expected one of: ${enumValues.join(', ')}`);
    return false;
  }
  return true;
}

function validateState(state) {
  console.log('Validating state.json...\n');

  // Schema version
  if (!validateRequired(state, 'schemaVersion', 'root')) return;
  if (state.schemaVersion !== EXPECTED_SCHEMA_VERSION) {
    if (state.schemaVersion === '13.0.0') {
      warn(`Schema version mismatch: expected "${EXPECTED_SCHEMA_VERSION}", got "${state.schemaVersion}". Run: node scripts/state.js migrate-v14`);
    } else {
      warn(`Schema version mismatch: expected "${EXPECTED_SCHEMA_VERSION}", got "${state.schemaVersion}"`);
    }
  }

  // Project
  if (validateRequired(state, 'project', 'root')) {
    validateRequired(state.project, 'name', 'project');
    validateRequired(state.project, 'type', 'project');
    if (state.project.type) {
      validateEnum(state.project.type, PROJECT_TYPES, 'project.type');
    }
    validateRequired(state.project, 'createdAt', 'project');
  }

  // Flow
  if (validateRequired(state, 'flow', 'root')) {
    validateRequired(state.flow, 'researchMethod', 'flow');
    if (state.flow.researchMethod) {
      validateEnum(state.flow.researchMethod, RESEARCH_METHODS, 'flow.researchMethod');
    }

    // Reject deprecated activeFeatures (v14.0: no backward compat)
    if (state.flow.activeFeatures !== undefined) {
      error('flow.activeFeatures is no longer supported. Use activeWorkItems instead.');
    }

    // activeWorkItems
    if (validateRequired(state.flow, 'activeWorkItems', 'flow')) {
      if (!Array.isArray(state.flow.activeWorkItems)) {
        error('flow.activeWorkItems must be an array');
      } else {
        // Load index to validate references
        let index = null;
        if (fs.existsSync(INDEX_FILE)) {
          try {
            index = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
          } catch (e) {
            warn('Could not read index.json for activeWorkItems validation');
          }
        }

        state.flow.activeWorkItems.forEach((workitemId, i) => {
          if (typeof workitemId !== 'string') {
            error(`flow.activeWorkItems[${i}] must be a string`);
          } else if (index) {
            const doc = index.documents?.find(d => d.id === workitemId);
            if (!doc) {
              warn(`flow.activeWorkItems references "${workitemId}" not found in index.json`);
            }
          }
        });
      }
    }
  }

  // v13.0: session removed (was never used in practice)
  if (state.session !== undefined) {
    warn('session is deprecated in v13.0. Run: node scripts/state.js migrate-v14');
  }

  // Domains
  if (validateRequired(state, 'domains', 'root')) {
    if (typeof state.domains !== 'object' || Array.isArray(state.domains)) {
      error('domains must be an object');
    } else {
      for (const [domainName, description] of Object.entries(state.domains)) {
        if (typeof description !== 'string') {
          error(`domains.${domainName} must be a string (domain description)`);
        }
      }
    }
  }

  // PendingDocs
  if (!Array.isArray(state.pendingDocs)) {
    error('pendingDocs must be an array');
  }

  // Metadata
  if (validateRequired(state, 'metadata', 'root')) {
    validateRequired(state.metadata, 'stateFileVersion', 'metadata');
  }

  // Subtasks
  if (validateRequired(state, 'subtasks', 'root')) {
    if (!Array.isArray(state.subtasks)) {
      error('subtasks must be an array');
    } else {
      state.subtasks.forEach((subtask, i) => {
        const prefix = `subtasks[${i}]`;
        validateRequired(subtask, 'id', prefix);
        // workitemId is required (v14.0: no backward compat for featureId)
        if (!subtask.workitemId) {
          error(`${prefix} must have workitemId`);
        }
        if (subtask.featureId !== undefined) {
          error(`${prefix}.featureId is no longer supported. Use workitemId instead.`);
        }
        validateRequired(subtask, 'description', prefix);
        validateRequired(subtask, 'status', prefix);
        if (subtask.status) {
          validateEnum(subtask.status, SUBTASK_STATUSES, `${prefix}.status`);
        }
        if (subtask.source) {
          validateEnum(subtask.source, SUBTASK_SOURCES, `${prefix}.source`);
        }
        validateRequired(subtask, 'createdAt', prefix);
      });
    }
  }

  // lastUpdated
  validateRequired(state, 'lastUpdated', 'root');

  // v12.0: features should NOT exist
  if (state.features !== undefined) {
    warn('features object is deprecated in v12.0. Use document frontmatter instead.');
  }
}

function main() {
  console.log('=== state.json Validation (v14.0) ===\n');

  // Check if file exists
  if (!fs.existsSync(STATE_FILE)) {
    console.error('ERROR: .solodevflow/state.json not found');
    process.exit(1);
  }

  // Read and parse
  let state;
  try {
    const content = fs.readFileSync(STATE_FILE, 'utf8');
    state = JSON.parse(content);
  } catch (e) {
    console.error('ERROR: Failed to parse state.json:', e.message);
    process.exit(1);
  }

  // Validate
  validateState(state);

  // Report
  console.log('=== Validation Results ===\n');

  if (errors.length === 0 && warnings.length === 0) {
    console.log('✓ state.json is valid!\n');
    console.log(`Schema version: ${state.schemaVersion}`);
    const activeItems = state.flow.activeWorkItems || [];
    console.log(`Active work items: ${activeItems.length} (${activeItems.join(', ') || 'none'})`);
    console.log(`Domains: ${Object.keys(state.domains).length}`);
    console.log(`Subtasks: ${state.subtasks?.length || 0} (${state.subtasks?.filter(s => s.status === 'pending').length || 0} pending)`);
    process.exit(0);
  }

  if (warnings.length > 0) {
    console.log('Warnings:');
    warnings.forEach(w => console.log(`  ${w}`));
    console.log('');
  }

  if (errors.length > 0) {
    console.log('Errors:');
    errors.forEach(e => console.log(`  ${e}`));
    console.log('');
    process.exit(1);
  }

  process.exit(0);
}

main();
