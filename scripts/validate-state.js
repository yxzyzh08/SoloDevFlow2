#!/usr/bin/env node

/**
 * state.json Validation Script
 * Validates state.json against v10.0 schema
 *
 * Usage: node scripts/validate-state.js
 */

const fs = require('fs');
const path = require('path');

const STATE_FILE = path.join(__dirname, '..', '.solodevflow', 'state.json');

// Schema version
const EXPECTED_SCHEMA_VERSION = "10.0.0";

// Enums
const PROJECT_TYPES = ['web-app', 'cli-tool', 'backend', 'library', 'api-service', 'mobile-app'];
const RESEARCH_METHODS = ['top-down', 'bottom-up'];
const FEATURE_TYPES = ['code', 'document'];
const CODE_PHASES = ['pending', 'feature_requirements', 'feature_design', 'feature_implementation', 'feature_verification', 'done'];
const DOCUMENT_PHASES = ['pending', 'drafting', 'done'];
const FEATURE_STATUSES = ['not_started', 'in_progress', 'blocked', 'completed'];
const SUBTASK_STATUSES = ['pending', 'in_progress', 'completed', 'skipped'];
const SUBTASK_SOURCES = ['impact-analysis', 'user', 'ai'];
const DESIGN_DEPTHS = ['none', 'required'];

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
    warn(`Schema version mismatch: expected "${EXPECTED_SCHEMA_VERSION}", got "${state.schemaVersion}"`);
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

    // activeFeatures (v5.0+)
    if (validateRequired(state.flow, 'activeFeatures', 'flow')) {
      if (!Array.isArray(state.flow.activeFeatures)) {
        error('flow.activeFeatures must be an array');
      } else {
        // Validate each active feature exists and check status
        state.flow.activeFeatures.forEach((featureName, index) => {
          if (typeof featureName !== 'string') {
            error(`flow.activeFeatures[${index}] must be a string`);
          } else if (state.features && !state.features[featureName]) {
            error(`flow.activeFeatures references non-existent feature: "${featureName}"`);
          } else if (state.features && state.features[featureName]) {
            const status = state.features[featureName].status;
            if (status !== 'in_progress' && status !== 'blocked') {
              warn(`flow.activeFeatures contains "${featureName}" with status "${status}" (expected in_progress or blocked)`);
            }
          }
        });
      }
    }
  }

  // Features
  if (validateRequired(state, 'features', 'root')) {
    for (const [featureName, feature] of Object.entries(state.features)) {
      const featurePath = `features.${featureName}`;

      // Type (required)
      if (!validateRequired(feature, 'type', featurePath)) continue;
      if (!validateEnum(feature.type, FEATURE_TYPES, `${featurePath}.type`)) continue;

      const isCode = feature.type === 'code';
      const isDocument = feature.type === 'document';

      // Description (optional)
      if (feature.description !== undefined && typeof feature.description !== 'string') {
        error(`${featurePath}.description must be a string`);
      }

      // Domain (required)
      validateRequired(feature, 'domain', featurePath);

      // DocPath (optional, can be null)
      if (feature.docPath !== undefined && feature.docPath !== null) {
        if (typeof feature.docPath !== 'string') {
          error(`${featurePath}.docPath must be a string or null`);
        }
      }

      // Scripts (optional, only for document type, must be array of strings)
      if (feature.scripts !== undefined) {
        if (!Array.isArray(feature.scripts)) {
          error(`${featurePath}.scripts must be an array`);
        } else {
          feature.scripts.forEach((script, index) => {
            if (typeof script !== 'string') {
              error(`${featurePath}.scripts[${index}] must be a string`);
            } else {
              // Check if script file exists (warning level)
              const scriptPath = path.join(__dirname, '..', script);
              if (!fs.existsSync(scriptPath)) {
                warn(`${featurePath}.scripts[${index}]: file not found "${script}"`);
              }
            }
          });
        }
      }

      // Subtasks (optional, v7.0+, must be array of objects)
      if (feature.subtasks !== undefined) {
        if (!Array.isArray(feature.subtasks)) {
          error(`${featurePath}.subtasks must be an array`);
        } else {
          feature.subtasks.forEach((subtask, index) => {
            const subtaskPath = `${featurePath}.subtasks[${index}]`;

            // Required fields
            if (!subtask.id || typeof subtask.id !== 'string') {
              error(`${subtaskPath}.id is required and must be a string`);
            }
            if (!subtask.description || typeof subtask.description !== 'string') {
              error(`${subtaskPath}.description is required and must be a string`);
            }
            if (!subtask.status) {
              error(`${subtaskPath}.status is required`);
            } else if (!SUBTASK_STATUSES.includes(subtask.status)) {
              error(`${subtaskPath}.status "${subtask.status}" is invalid. Expected: ${SUBTASK_STATUSES.join(', ')}`);
            }
            if (!subtask.createdAt || typeof subtask.createdAt !== 'string') {
              error(`${subtaskPath}.createdAt is required and must be a string`);
            }
            if (!subtask.source) {
              error(`${subtaskPath}.source is required`);
            } else if (!SUBTASK_SOURCES.includes(subtask.source)) {
              error(`${subtaskPath}.source "${subtask.source}" is invalid. Expected: ${SUBTASK_SOURCES.join(', ')}`);
            }

            // Optional fields type check
            if (subtask.target !== undefined && typeof subtask.target !== 'string') {
              error(`${subtaskPath}.target must be a string`);
            }
          });
        }
      }

      // designDepth and artifacts (v9.0+, required for code type)
      if (isCode) {
        // designDepth is required for code type
        if (!feature.designDepth) {
          error(`${featurePath}.designDepth is required for code type feature`);
        } else if (!DESIGN_DEPTHS.includes(feature.designDepth)) {
          error(`${featurePath}.designDepth "${feature.designDepth}" is invalid. Expected: ${DESIGN_DEPTHS.join(', ')}`);
        }

        // artifacts is required for code type
        if (!feature.artifacts) {
          error(`${featurePath}.artifacts is required for code type feature`);
        } else if (typeof feature.artifacts !== 'object' || Array.isArray(feature.artifacts)) {
          error(`${featurePath}.artifacts must be an object`);
        } else {
          const artifacts = feature.artifacts;
          const artifactsPath = `${featurePath}.artifacts`;

          // design: required when designDepth is 'required', can be null for 'none'
          if (feature.designDepth && feature.designDepth === 'required') {
            if (!artifacts.design) {
              error(`${artifactsPath}.design is required when designDepth is ${feature.designDepth}`);
            } else if (typeof artifacts.design !== 'string') {
              error(`${artifactsPath}.design must be a string`);
            } else {
              // Check if design file exists (warning level)
              const designPath = path.join(__dirname, '..', artifacts.design);
              if (!fs.existsSync(designPath)) {
                warn(`${artifactsPath}.design: file not found "${artifacts.design}"`);
              }
            }
          } else if (artifacts.design !== undefined && artifacts.design !== null && typeof artifacts.design !== 'string') {
            error(`${artifactsPath}.design must be a string or null`);
          }

          // code: required, must be non-empty array
          if (!artifacts.code) {
            error(`${artifactsPath}.code is required`);
          } else if (!Array.isArray(artifacts.code)) {
            error(`${artifactsPath}.code must be an array`);
          } else if (artifacts.code.length === 0) {
            error(`${artifactsPath}.code cannot be empty`);
          } else {
            artifacts.code.forEach((codePath, index) => {
              if (typeof codePath !== 'string') {
                error(`${artifactsPath}.code[${index}] must be a string`);
              } else {
                // Check if code path exists (warning level)
                const fullPath = path.join(__dirname, '..', codePath);
                if (!fs.existsSync(fullPath)) {
                  warn(`${artifactsPath}.code[${index}]: path not found "${codePath}"`);
                }
              }
            });
          }

          // tests: required, must be array (empty array allowed but warned)
          if (!artifacts.tests) {
            error(`${artifactsPath}.tests is required`);
          } else if (!Array.isArray(artifacts.tests)) {
            error(`${artifactsPath}.tests must be an array`);
          } else if (artifacts.tests.length === 0) {
            warn(`${artifactsPath}.tests is empty - consider adding tests for code quality`);
          } else {
            artifacts.tests.forEach((testPath, index) => {
              if (typeof testPath !== 'string') {
                error(`${artifactsPath}.tests[${index}] must be a string`);
              } else {
                // Check if test path exists (warning level)
                const fullPath = path.join(__dirname, '..', testPath);
                if (!fs.existsSync(fullPath)) {
                  warn(`${artifactsPath}.tests[${index}]: path not found "${testPath}"`);
                }
              }
            });
          }
        }
      }

      // Phase - validate based on type
      if (validateRequired(feature, 'phase', featurePath)) {
        const validPhases = isCode ? CODE_PHASES : DOCUMENT_PHASES;
        validateEnum(feature.phase, validPhases, `${featurePath}.phase`);
      }

      // Status
      if (validateRequired(feature, 'status', featurePath)) {
        validateEnum(feature.status, FEATURE_STATUSES, `${featurePath}.status`);
      }

      // Domain reference check (domain must exist in domains)
      if (feature.domain && state.domains && !state.domains[feature.domain]) {
        error(`Feature "${featureName}" references non-existent domain: "${feature.domain}"`);
      }

      // State consistency check
      if (feature.phase === 'done' && feature.status !== 'completed') {
        warn(`Feature "${featureName}" phase is done but status is "${feature.status}" (expected completed)`);
      }
    }
  }

  // Domains (v8.0+, simplified from domainTree)
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

  // Sparks
  if (!Array.isArray(state.sparks)) {
    error('sparks must be an array');
  }

  // PendingDocs
  if (!Array.isArray(state.pendingDocs)) {
    error('pendingDocs must be an array');
  }

  // Metadata
  if (validateRequired(state, 'metadata', 'root')) {
    validateRequired(state.metadata, 'stateFileVersion', 'metadata');
  }

  // lastUpdated
  validateRequired(state, 'lastUpdated', 'root');

  // Note: flow.activeFeatures reference check is done in the Flow section above
}

function main() {
  console.log('=== state.json Validation ===\n');

  // Check if file exists
  if (!fs.existsSync(STATE_FILE)) {
    console.error('ERROR: .flow/state.json not found');
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
    console.log(`Active features: ${state.flow.activeFeatures.length} (${state.flow.activeFeatures.join(', ')})`);
    console.log(`Features: ${Object.keys(state.features).length}`);
    const codeFeatures = Object.values(state.features).filter(f => f.type === 'code');
    const docFeatures = Object.values(state.features).filter(f => f.type === 'document');
    console.log(`  - Code: ${codeFeatures.length}`);
    console.log(`  - Document: ${docFeatures.length}`);
    const withScripts = docFeatures.filter(f => f.scripts && f.scripts.length > 0).length;
    if (withScripts > 0) {
      console.log(`  - With scripts: ${withScripts}`);
    }
    const withArtifacts = codeFeatures.filter(f => f.artifacts).length;
    if (withArtifacts > 0) {
      console.log(`  - With artifacts: ${withArtifacts}`);
    }
    console.log(`Domains: ${Object.keys(state.domains).length}`);
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
