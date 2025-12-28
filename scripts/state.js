#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { toBeijingISOString } = require('./lib/datetime');

const PROJECT_ROOT = path.join(__dirname, '..');
const STATE_FILE = path.join(PROJECT_ROOT, '.solodevflow/state.json');
const INDEX_FILE = path.join(PROJECT_ROOT, '.solodevflow/index.json');
const LOCK_FILE = path.join(PROJECT_ROOT, '.solodevflow/state.lock');
const LOCK_TIMEOUT = 5000;

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
    activeFeatures: state.flow.activeFeatures,
    docs: index?.documents?.length || 0
  }, null, 2));
}

function listActive() {
  const state = readState();
  const index = readIndex();
  const active = state.flow.activeFeatures.map(id => ({
    id, status: index?.documents?.find(d => d.id === id)?.status || 'unknown'
  }));
  console.log(JSON.stringify(active, null, 2));
}

function activateFeature(id) {
  acquireLock();
  try {
    const state = readState();
    if (!state.flow.activeFeatures.includes(id)) state.flow.activeFeatures.push(id);
    writeState(state);
    console.log(JSON.stringify({ success: true, activeFeatures: state.flow.activeFeatures }, null, 2));
  } finally { releaseLock(); }
}

function deactivateFeature(id) {
  acquireLock();
  try {
    const state = readState();
    state.flow.activeFeatures = state.flow.activeFeatures.filter(n => n !== id);
    writeState(state);
    console.log(JSON.stringify({ success: true }, null, 2));
  } finally { releaseLock(); }
}

function addSubtask(args) {
  const featureMatch = args.find(a => a.startsWith('--feature='));
  const descMatch = args.find(a => a.startsWith('--desc='));
  const sourceMatch = args.find(a => a.startsWith('--source='));
  const statusMatch = args.find(a => a.startsWith('--status='));
  if (!featureMatch || !descMatch) {
    console.error('Usage: add-subtask --feature=<id> --desc="description" [--source=ai|impact-analysis|user|interrupted] [--status=pending|in_progress]');
    process.exit(1);
  }
  const featureId = featureMatch.split('=')[1];
  const description = descMatch.split('=').slice(1).join('=');
  const source = sourceMatch ? sourceMatch.split('=')[1] : 'user';
  const status = statusMatch ? statusMatch.split('=')[1] : 'pending';

  acquireLock();
  try {
    const state = readState();
    if (!state.subtasks) state.subtasks = [];
    const id = `st_${Date.now()}_${String(state.subtasks.length + 1).padStart(3, '0')}`;
    state.subtasks.push({
      id, featureId, description, status, source, createdAt: toBeijingISOString()
    });
    writeState(state);
    console.log(JSON.stringify({ success: true, id, status }, null, 2));
  } finally { releaseLock(); }
}

function listSubtasks(args) {
  const state = readState();
  let subtasks = state.subtasks || [];
  const featureMatch = args.find(a => a.startsWith('--feature='));
  if (featureMatch) {
    const featureId = featureMatch.split('=')[1];
    subtasks = subtasks.filter(s => s.featureId === featureId);
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

function setPhase(featureId, phase) {
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
  const doc = index.documents?.find(d => d.id === featureId);
  if (!doc) {
    console.error(`Feature not found: ${featureId}`);
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

  // 重新生成 index
  execSync('node scripts/index.js', { cwd: PROJECT_ROOT, stdio: 'pipe' });

  console.log(JSON.stringify({ success: true, featureId, phase, status }, null, 2));
}

// v13.0 Migration: Remove session structure
function migrateV13() {
  acquireLock();
  try {
    const state = readState();

    // Check current version
    if (state.schemaVersion === '13.0.0') {
      console.log(JSON.stringify({ success: true, message: 'Already at v13.0.0' }));
      return;
    }

    // Remove session field
    delete state.session;

    // Update schema version
    state.schemaVersion = '13.0.0';

    writeState(state);
    console.log(JSON.stringify({
      success: true,
      message: 'Migrated to v13.0.0: removed session structure',
      schemaVersion: '13.0.0'
    }, null, 2));
  } finally {
    releaseLock();
  }
}

function printHelp() {
  console.log(`state.js v13.0.0 - State Management CLI

Query:
  summary                  Status summary (JSON)
  list-active              List active Features

Feature:
  activate-feature <id>    Activate Feature
  deactivate-feature <id>  Deactivate Feature
  set-phase <id> <phase>   Set Feature phase (updates frontmatter)
                           Phases: pending, feature_requirements, feature_review,
                                   feature_design, feature_implementation, feature_testing, done

Subtask:
  add-subtask --feature=<id> --desc="desc" [--source=ai|impact-analysis|user|interrupted] [--status=pending|in_progress]
  list-subtasks [--feature=<id>]
  complete-subtask <id>
  skip-subtask <id>

Pending Docs:
  add-pending-doc --type=<design|feature|prd> --target="path" --desc="desc" [--reason="reason"]
  list-pending-docs
  clear-pending-docs

Migration:
  migrate-v13              Migrate to v13.0.0 (removes session structure)`);
}

const args = process.argv.slice(2);
if (args.length === 0 || args[0] === '--help') { printHelp(); process.exit(0); }

switch (args[0]) {
  // Query
  case 'summary': getSummary(); break;
  case 'list-active': listActive(); break;
  // Feature
  case 'activate-feature': activateFeature(args[1]); break;
  case 'deactivate-feature': deactivateFeature(args[1]); break;
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
  // Migration
  case 'migrate-v13': migrateV13(); break;
  default: console.error('Unknown: ' + args[0]); process.exit(1);
}
