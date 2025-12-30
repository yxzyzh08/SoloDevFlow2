#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { toBeijingISOString } = require('./lib/datetime');

// 自动检测项目根目录：
// - 如果在 .solodevflow/scripts/ 下（目标项目），回退两级
// - 如果在 scripts/ 下（源项目），回退一级
const isInstalledProject = __dirname.includes('.solodevflow');
const PROJECT_ROOT = isInstalledProject
  ? path.join(__dirname, '../..')
  : path.join(__dirname, '..');
const STATE_FILE = path.join(PROJECT_ROOT, '.solodevflow/state.json');
const INDEX_FILE = path.join(PROJECT_ROOT, '.solodevflow/index.json');
const LOCK_FILE = path.join(PROJECT_ROOT, '.solodevflow/state.lock');
const LOCK_TIMEOUT = 5000;

// === Refactoring Phase Constants ===
const REFACTORING_PHASES = [
  'understand',
  'prd',
  'requirements',
  'design',
  'validate',
  'completed'
];

function acquireLock() {
  const startTime = Date.now();
  while (fs.existsSync(LOCK_FILE)) {
    try {
      const lockStat = fs.statSync(LOCK_FILE);
      if (Date.now() - lockStat.mtimeMs > LOCK_TIMEOUT) { fs.unlinkSync(LOCK_FILE); break; }
    } catch (e) { break; }
    if (Date.now() - startTime > LOCK_TIMEOUT) { console.error('Lock timeout'); process.exit(1); }
  }
  fs.writeFileSync(LOCK_FILE, String(process.pid));
}

function releaseLock() { try { if (fs.existsSync(LOCK_FILE)) fs.unlinkSync(LOCK_FILE); } catch (e) {} }

function readState() {
  if (!fs.existsSync(STATE_FILE)) { console.error('state.json not found'); process.exit(1); }
  return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
}

function readIndex() {
  if (!fs.existsSync(INDEX_FILE)) return null;
  try { return JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8')); } catch (e) { return null; }
}

function writeState(state) {
  state.lastUpdated = toBeijingISOString();
  state.metadata.stateFileVersion = (state.metadata.stateFileVersion || 0) + 1;
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function getSummary() {
  const state = readState();
  const index = readIndex();
  console.log(JSON.stringify({
    project: state.project.name,
    schemaVersion: state.schemaVersion,
    activeWorkItems: state.flow.activeWorkItems,
    docs: index?.documents?.length || 0
  }, null, 2));
}

function listActive() {
  const state = readState();
  const index = readIndex();
  const active = state.flow.activeWorkItems.map(id => ({
    id, status: index?.documents?.find(d => d.id === id)?.status || 'unknown'
  }));
  console.log(JSON.stringify(active, null, 2));
}

function activate(id) {
  acquireLock();
  try {
    const state = readState();
    if (!state.flow.activeWorkItems.includes(id)) state.flow.activeWorkItems.push(id);
    writeState(state);
    console.log(JSON.stringify({ success: true, activeWorkItems: state.flow.activeWorkItems }, null, 2));
  } finally { releaseLock(); }
}

function deactivate(id) {
  acquireLock();
  try {
    const state = readState();
    state.flow.activeWorkItems = state.flow.activeWorkItems.filter(n => n !== id);
    writeState(state);
    console.log(JSON.stringify({ success: true }, null, 2));
  } finally { releaseLock(); }
}

function addSubtask(args) {
  const workitemMatch = args.find(a => a.startsWith('--workitem='));
  const featureMatch = args.find(a => a.startsWith('--feature=')); // backward compat
  const descMatch = args.find(a => a.startsWith('--desc='));
  const sourceMatch = args.find(a => a.startsWith('--source='));
  const statusMatch = args.find(a => a.startsWith('--status='));

  const idMatch = workitemMatch || featureMatch;
  if (!idMatch || !descMatch) {
    console.error('Usage: add-subtask --workitem=<id> --desc="description" [--source=ai|impact-analysis|user|interrupted] [--status=pending|in_progress]');
    process.exit(1);
  }
  const workitemId = idMatch.split('=')[1];
  const description = descMatch.split('=').slice(1).join('=');
  const source = sourceMatch ? sourceMatch.split('=')[1] : 'user';
  const status = statusMatch ? statusMatch.split('=')[1] : 'pending';

  acquireLock();
  try {
    const state = readState();
    if (!state.subtasks) state.subtasks = [];
    const id = `st_${Date.now()}_${String(state.subtasks.length + 1).padStart(3, '0')}`;
    state.subtasks.push({
      id, workitemId, description, status, source, createdAt: toBeijingISOString()
    });
    writeState(state);
    console.log(JSON.stringify({ success: true, id, status }, null, 2));
  } finally { releaseLock(); }
}

function listSubtasks(args) {
  const state = readState();
  let subtasks = state.subtasks || [];
  const workitemMatch = args.find(a => a.startsWith('--workitem='));
  const featureMatch = args.find(a => a.startsWith('--feature=')); // backward compat
  const idMatch = workitemMatch || featureMatch;
  if (idMatch) {
    const workitemId = idMatch.split('=')[1];
    subtasks = subtasks.filter(s => s.workitemId === workitemId);
  }
  console.log(JSON.stringify(subtasks, null, 2));
}

function completeSubtask(subtaskId) {
  acquireLock();
  try {
    const state = readState();
    const subtask = (state.subtasks || []).find(s => s.id === subtaskId);
    if (!subtask) { console.error('Subtask not found: ' + subtaskId); process.exit(1); }
    subtask.status = 'completed';
    subtask.completedAt = toBeijingISOString();
    writeState(state);
    console.log(JSON.stringify({ success: true }, null, 2));
  } finally { releaseLock(); }
}

function skipSubtask(subtaskId) {
  acquireLock();
  try {
    const state = readState();
    const subtask = (state.subtasks || []).find(s => s.id === subtaskId);
    if (!subtask) { console.error('Subtask not found: ' + subtaskId); process.exit(1); }
    subtask.status = 'skipped';
    subtask.skippedAt = toBeijingISOString();
    writeState(state);
    console.log(JSON.stringify({ success: true }, null, 2));
  } finally { releaseLock(); }
}

function addPendingDoc(args) {
  const typeMatch = args.find(a => a.startsWith('--type='));
  const targetMatch = args.find(a => a.startsWith('--target='));
  const descMatch = args.find(a => a.startsWith('--desc='));
  const reasonMatch = args.find(a => a.startsWith('--reason='));
  if (!typeMatch || !targetMatch || !descMatch) {
    console.error('Usage: add-pending-doc --type=<design|feature|prd> --target="path" --desc="description" [--reason="reason"]');
    process.exit(1);
  }
  const docType = typeMatch.split('=')[1];
  const target = targetMatch.split('=').slice(1).join('=');
  const description = descMatch.split('=').slice(1).join('=');
  const reason = reasonMatch ? reasonMatch.split('=').slice(1).join('=') : '';

  acquireLock();
  try {
    const state = readState();
    if (!state.pendingDocs) state.pendingDocs = [];
    const id = `pd_${Date.now()}_${String(state.pendingDocs.length + 1).padStart(3, '0')}`;
    state.pendingDocs.push({
      id, type: docType, target, description, reason, createdAt: toBeijingISOString()
    });
    writeState(state);
    console.log(JSON.stringify({ success: true, id, count: state.pendingDocs.length }, null, 2));
  } finally { releaseLock(); }
}

function listPendingDocs() {
  const state = readState();
  console.log(JSON.stringify(state.pendingDocs || [], null, 2));
}

function clearPendingDocs() {
  acquireLock();
  try {
    const state = readState();
    const count = (state.pendingDocs || []).length;
    state.pendingDocs = [];
    writeState(state);
    console.log(JSON.stringify({ success: true, cleared: count }, null, 2));
  } finally { releaseLock(); }
}

function setPhase(workitemId, phase) {
  // 验证 phase 值
  const validPhases = [
    'pending',
    'feature_requirements',
    'feature_review',
    'feature_design',
    'feature_implementation',
    'feature_testing',
    'done'
  ];
  if (!validPhases.includes(phase)) {
    console.error(`Invalid phase: ${phase}`);
    console.error(`Valid phases: ${validPhases.join(', ')}`);
    process.exit(1);
  }

  // phase → status 映射（Bug fix: 同步更新 status）
  const phaseToStatus = {
    'pending': 'not_started',
    'feature_requirements': 'in_progress',
    'feature_review': 'in_progress',
    'feature_design': 'in_progress',
    'feature_implementation': 'in_progress',
    'feature_testing': 'in_progress',
    'done': 'done'
  };
  const status = phaseToStatus[phase];

  // 查找文档路径
  const index = readIndex();
  if (!index) {
    console.error('index.json not found. Run: node scripts/index.js');
    process.exit(1);
  }
  const doc = index.documents?.find(d => d.id === workitemId);
  if (!doc) {
    console.error(`Work item not found: ${workitemId}`);
    process.exit(1);
  }

  // 读取并更新 frontmatter
  const docPath = path.join(PROJECT_ROOT, doc.path);
  if (!fs.existsSync(docPath)) {
    console.error(`Document file not found: ${docPath}`);
    process.exit(1);
  }

  let content = fs.readFileSync(docPath, 'utf8');
  const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!frontmatterMatch) {
    console.error('No frontmatter found in document');
    process.exit(1);
  }

  let newFrontmatter = frontmatterMatch[1];

  // 更新 status
  if (/^status:/m.test(newFrontmatter)) {
    newFrontmatter = newFrontmatter.replace(/^status:.*$/m, `status: ${status}`);
  }

  // 更新或添加 phase
  if (/^phase:/m.test(newFrontmatter)) {
    newFrontmatter = newFrontmatter.replace(/^phase:.*$/m, `phase: ${phase}`);
  } else {
    // 在 status 后面添加 phase
    newFrontmatter = newFrontmatter.replace(/^(status:.*)$/m, `$1\nphase: ${phase}`);
  }

  content = content.replace(frontmatterMatch[0], `---\n${newFrontmatter}\n---`);
  fs.writeFileSync(docPath, content);

  // 如果 phase 是 done，自动清理关联数据
  if (phase === 'done') {
    acquireLock();
    try {
      const state = readState();

      // 1. 自动完成该 work item 的所有 subtasks
      const subtasks = state.subtasks || [];
      let completedCount = 0;
      subtasks.forEach(st => {
        if (st.workitemId === workitemId && st.status !== 'completed') {
          st.status = 'completed';
          st.completedAt = toBeijingISOString();
          completedCount++;
        }
      });

      // 2. 自动从 activeWorkItems 中移除
      const wasActive = state.flow.activeWorkItems.includes(workitemId);
      state.flow.activeWorkItems = state.flow.activeWorkItems.filter(id => id !== workitemId);

      writeState(state);

      if (completedCount > 0 || wasActive) {
        console.error(`[Auto-cleanup] Completed ${completedCount} subtask(s), deactivated: ${wasActive}`);
      }
    } finally {
      releaseLock();
    }
  }

  // 重新生成 index
  execSync('node scripts/index.js', { cwd: PROJECT_ROOT, stdio: 'pipe' });

  console.log(JSON.stringify({ success: true, workitemId, phase, status }, null, 2));
}

// === Refactoring Mode Functions ===

/**
 * Get refactoring status
 * @returns {Object|null} Refactoring state or null if not enabled
 */
function getRefactoringStatus() {
  const state = readState();
  const refactoring = state.project?.refactoring;
  if (!refactoring?.enabled) {
    console.log(JSON.stringify({ enabled: false }));
    return null;
  }
  console.log(JSON.stringify(refactoring, null, 2));
  return refactoring;
}

/**
 * Set refactoring phase
 * @param {string} phase - Target phase
 */
function setRefactoringPhase(phase) {
  if (!REFACTORING_PHASES.includes(phase)) {
    console.error(`Invalid refactoring phase: ${phase}`);
    console.error(`Valid phases: ${REFACTORING_PHASES.join(', ')}`);
    process.exit(1);
  }

  acquireLock();
  try {
    const state = readState();

    if (!state.project?.refactoring?.enabled) {
      console.error('Refactoring mode is not enabled');
      process.exit(1);
    }

    const currentPhase = state.project.refactoring.phase;
    const currentIndex = REFACTORING_PHASES.indexOf(currentPhase);
    const targetIndex = REFACTORING_PHASES.indexOf(phase);

    // Only allow forward progression (one step at a time) or staying same
    if (targetIndex > currentIndex + 1) {
      console.error(`Cannot skip phases. Current: ${currentPhase}, Target: ${phase}`);
      console.error(`Next allowed: ${REFACTORING_PHASES[currentIndex + 1] || 'none'}`);
      process.exit(1);
    }

    state.project.refactoring.phase = phase;

    // Record completion time if completed
    if (phase === 'completed') {
      state.project.refactoring.completedAt = toBeijingISOString();
    }

    writeState(state);
    console.log(JSON.stringify({ success: true, phase }, null, 2));
  } finally {
    releaseLock();
  }
}

/**
 * Update refactoring progress
 * @param {string} type - Progress type (prd|features|capabilities|flows|designs)
 * @param {string|number} done - Done count or status (for prd)
 * @param {number} [total] - Total count (not needed for prd)
 */
function updateRefactoringProgress(type, done, total) {
  const validTypes = ['prd', 'features', 'capabilities', 'flows', 'designs'];
  if (!validTypes.includes(type)) {
    console.error(`Invalid progress type: ${type}`);
    console.error(`Valid types: ${validTypes.join(', ')}`);
    process.exit(1);
  }

  acquireLock();
  try {
    const state = readState();

    if (!state.project?.refactoring?.enabled) {
      console.error('Refactoring mode is not enabled');
      process.exit(1);
    }

    if (type === 'prd') {
      // prd is a status string
      const validStatuses = ['not_started', 'in_progress', 'done'];
      if (!validStatuses.includes(done)) {
        console.error(`Invalid prd status: ${done}`);
        console.error(`Valid statuses: ${validStatuses.join(', ')}`);
        process.exit(1);
      }
      state.project.refactoring.progress.prd = done;
    } else {
      // Others are {total, done} objects
      const doneNum = parseInt(done, 10);
      const totalNum = parseInt(total, 10);
      if (isNaN(doneNum) || isNaN(totalNum)) {
        console.error(`Usage: update-refactoring-progress ${type} <done> <total>`);
        process.exit(1);
      }
      state.project.refactoring.progress[type] = { total: totalNum, done: doneNum };
    }

    writeState(state);
    console.log(JSON.stringify({
      success: true,
      progress: state.project.refactoring.progress
    }, null, 2));
  } finally {
    releaseLock();
  }
}

/**
 * Enable refactoring mode (used by init.js)
 */
function enableRefactoringMode() {
  acquireLock();
  try {
    const state = readState();

    if (!state.project) state.project = {};

    state.project.refactoring = {
      enabled: true,
      phase: 'understand',
      progress: {
        prd: 'not_started',
        features: { total: 0, done: 0 },
        capabilities: { total: 0, done: 0 },
        flows: { total: 0, done: 0 },
        designs: { total: 0, done: 0, skipped: false }
      },
      startedAt: toBeijingISOString(),
      completedAt: null
    };

    writeState(state);
    console.log(JSON.stringify({
      success: true,
      message: 'Refactoring mode enabled',
      phase: 'understand'
    }, null, 2));
  } finally {
    releaseLock();
  }
}

/**
 * Disable refactoring mode (exit refactoring)
 */
function disableRefactoringMode() {
  acquireLock();
  try {
    const state = readState();

    if (state.project?.refactoring) {
      state.project.refactoring.enabled = false;
      state.project.refactoring.completedAt = toBeijingISOString();
    }

    writeState(state);
    console.log(JSON.stringify({
      success: true,
      message: 'Refactoring mode disabled'
    }, null, 2));
  } finally {
    releaseLock();
  }
}

// v14.0 Migration: Rename activeFeatures to activeWorkItems
function migrateV14() {
  acquireLock();
  try {
    const state = readState();

    // Check current version
    if (state.schemaVersion === '14.0.0') {
      console.log(JSON.stringify({ success: true, message: 'Already at v14.0.0' }));
      return;
    }

    // Rename activeFeatures to activeWorkItems
    if (state.flow.activeFeatures) {
      state.flow.activeWorkItems = state.flow.activeFeatures;
      delete state.flow.activeFeatures;
    } else if (!state.flow.activeWorkItems) {
      state.flow.activeWorkItems = [];
    }

    // Migrate subtasks: featureId -> workitemId
    if (state.subtasks) {
      state.subtasks = state.subtasks.map(st => {
        if (st.featureId && !st.workitemId) {
          return { ...st, workitemId: st.featureId, featureId: undefined };
        }
        return st;
      });
    }

    // Update schema version
    state.schemaVersion = '14.0.0';

    writeState(state);
    console.log(JSON.stringify({
      success: true,
      message: 'Migrated to v14.0.0: renamed activeFeatures to activeWorkItems',
      schemaVersion: '14.0.0',
      activeWorkItems: state.flow.activeWorkItems
    }, null, 2));
  } finally {
    releaseLock();
  }
}

function printHelp() {
  console.log(`state.js v15.0.0 - State Management CLI

Query:
  summary                  Status summary (JSON)
  list-active              List active work items

Work Item Activation:
  activate <id>            Activate work item (feature/capability/flow)
  deactivate <id>          Deactivate work item
  set-phase <id> <phase>   Set work item phase (updates frontmatter)
                           Phases: pending, feature_requirements, feature_review,
                                   feature_design, feature_implementation, feature_testing, done

Subtask:
  add-subtask --workitem=<id> --desc="desc" [--source=ai|impact-analysis|user|interrupted] [--status=pending|in_progress]
  list-subtasks [--workitem=<id>]
  complete-subtask <id>
  skip-subtask <id>

Pending Docs:
  add-pending-doc --type=<design|feature|prd> --target="path" --desc="desc" [--reason="reason"]
  list-pending-docs
  clear-pending-docs

Refactoring Mode:
  refactoring-status                           Get refactoring status
  enable-refactoring                           Enable refactoring mode
  disable-refactoring                          Disable refactoring mode
  set-refactoring-phase <phase>                Set refactoring phase
                                               Phases: understand, prd, requirements, design, validate, completed
  update-refactoring-progress <type> <done> [total]
                                               Update progress (type: prd|features|capabilities|flows|designs)
                                               For prd: done = not_started|in_progress|done
                                               For others: done = number, total = number

Migration:
  migrate-v14              Migrate to v14.0.0 (renames activeFeatures to activeWorkItems)

Terminology:
  "Work Item" is the unified term for Feature, Capability, and Flow.
  They are all trackable, deliverable work units in SoloDevFlow.`);
}

const args = process.argv.slice(2);
if (args.length === 0 || args[0] === '--help') { printHelp(); process.exit(0); }

switch (args[0]) {
  // Query
  case 'summary': getSummary(); break;
  case 'list-active': listActive(); break;
  // Work Item Activation
  case 'activate': activate(args[1]); break;
  case 'deactivate': deactivate(args[1]); break;
  case 'set-phase': setPhase(args[1], args[2]); break;
  // Subtask
  case 'add-subtask': addSubtask(args.slice(1)); break;
  case 'list-subtasks': listSubtasks(args.slice(1)); break;
  case 'complete-subtask': completeSubtask(args[1]); break;
  case 'skip-subtask': skipSubtask(args[1]); break;
  // Pending Docs
  case 'add-pending-doc': addPendingDoc(args.slice(1)); break;
  case 'list-pending-docs': listPendingDocs(); break;
  case 'clear-pending-docs': clearPendingDocs(); break;
  // Refactoring Mode
  case 'refactoring-status': getRefactoringStatus(); break;
  case 'enable-refactoring': enableRefactoringMode(); break;
  case 'disable-refactoring': disableRefactoringMode(); break;
  case 'set-refactoring-phase': setRefactoringPhase(args[1]); break;
  case 'update-refactoring-progress': updateRefactoringProgress(args[1], args[2], args[3]); break;
  // Migration
  case 'migrate-v14': migrateV14(); break;
  case 'migrate-v13': console.log('v13 migration no longer needed, use migrate-v14'); break;
  default: console.error('Unknown: ' + args[0]); process.exit(1);
}
