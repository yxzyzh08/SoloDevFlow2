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

// === PRD Phase Constants (v16.0) ===
const PRD_PHASES = [
  'prd_draft',
  'prd_scope_review',
  'prd_decomposing',
  'prd_done'
];

// === PRD Layer Functions (v16.0) ===

/**
 * Initialize PRD field in state (for migration)
 */
function initPrd() {
  acquireLock();
  try {
    const state = readState();

    if (state.prd) {
      console.log(JSON.stringify({ success: true, message: 'PRD field already exists', prd: state.prd }));
      return;
    }

    state.prd = {
      phase: null,
      decomposingProgress: {
        total: 0,
        done: 0
      }
    };

    writeState(state);
    console.log(JSON.stringify({ success: true, message: 'PRD field initialized', prd: state.prd }, null, 2));
  } finally {
    releaseLock();
  }
}

/**
 * Get PRD status
 */
function getPrdStatus() {
  const state = readState();
  const prd = state.prd || { phase: null, decomposingProgress: { total: 0, done: 0 } };
  console.log(JSON.stringify(prd, null, 2));
  return prd;
}

/**
 * Set PRD phase
 * @param {string|null} phase - Target phase or null to clear
 */
function setPrdPhase(phase) {
  // Allow null to clear phase
  if (phase !== 'null' && phase !== null && !PRD_PHASES.includes(phase)) {
    console.error(`Invalid PRD phase: ${phase}`);
    console.error(`Valid phases: ${PRD_PHASES.join(', ')}, null`);
    process.exit(1);
  }

  const actualPhase = (phase === 'null' || phase === null) ? null : phase;

  acquireLock();
  try {
    const state = readState();

    // Initialize prd if not exists
    if (!state.prd) {
      state.prd = {
        phase: null,
        decomposingProgress: { total: 0, done: 0 }
      };
    }

    state.prd.phase = actualPhase;

    // Reset progress when entering prd_decomposing
    if (actualPhase === 'prd_decomposing') {
      // Keep existing progress, don't reset
    }

    // Clear progress when phase is null or prd_done
    if (actualPhase === null || actualPhase === 'prd_done') {
      state.prd.decomposingProgress = { total: 0, done: 0 };
    }

    writeState(state);
    console.log(JSON.stringify({ success: true, phase: actualPhase }, null, 2));
  } finally {
    releaseLock();
  }
}

/**
 * Update PRD decomposing progress
 * @param {number} done - Done count
 * @param {number} total - Total count
 */
function updatePrdProgress(done, total) {
  const doneNum = parseInt(done, 10);
  const totalNum = parseInt(total, 10);

  if (isNaN(doneNum) || isNaN(totalNum)) {
    console.error('Usage: update-prd-progress <done> <total>');
    process.exit(1);
  }

  acquireLock();
  try {
    const state = readState();

    if (!state.prd) {
      state.prd = {
        phase: null,
        decomposingProgress: { total: 0, done: 0 }
      };
    }

    state.prd.decomposingProgress = { total: totalNum, done: doneNum };

    writeState(state);
    console.log(JSON.stringify({
      success: true,
      decomposingProgress: state.prd.decomposingProgress
    }, null, 2));
  } finally {
    releaseLock();
  }
}

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
    const indexScriptPath = path.join(__dirname, 'index.js');
    console.error(`index.json not found. Run: node "${indexScriptPath}"`);
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

  // 重新生成 index（使用动态路径，支持源项目和安装项目）
  const indexScriptPath = path.join(__dirname, 'index.js');
  execSync(`node "${indexScriptPath}"`, { cwd: PROJECT_ROOT, stdio: 'pipe' });

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

// v16.0 Migration: Add PRD field
function migrateV16() {
  acquireLock();
  try {
    const state = readState();

    // Check current version
    if (state.schemaVersion === '16.0.0') {
      console.log(JSON.stringify({ success: true, message: 'Already at v16.0.0' }));
      return;
    }

    // Add PRD field if not exists
    if (!state.prd) {
      state.prd = {
        phase: null,
        decomposingProgress: { total: 0, done: 0 }
      };
    }

    // Update schema version
    state.schemaVersion = '16.0.0';

    writeState(state);
    console.log(JSON.stringify({
      success: true,
      message: 'Migrated to v16.0.0: added PRD layer support',
      schemaVersion: '16.0.0',
      prd: state.prd
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

function getSchema() {
  const schema = {
    name: "state-manager",
    version: "16.0.0",
    commands: [
      {
        name: "summary",
        category: "Query",
        description: "获取项目状态摘要（JSON 格式）",
        syntax: "summary",
        parameters: [],
        examples: [
          "node scripts/state.js summary"
        ]
      },
      {
        name: "list-active",
        category: "Query",
        description: "列出所有活跃的 Work Items",
        syntax: "list-active",
        parameters: [],
        examples: [
          "node scripts/state.js list-active"
        ]
      },
      {
        name: "activate",
        category: "Work Item Activation",
        description: "激活工作项（Feature/Capability/Flow），添加到 activeWorkItems 列表",
        syntax: "activate <id>",
        parameters: [
          {
            name: "id",
            type: "string",
            required: true,
            description: "工作项 ID，必须在 index.json 中存在"
          }
        ],
        examples: [
          "node scripts/state.js activate state-management",
          "node scripts/state.js activate hooks-integration"
        ]
      },
      {
        name: "deactivate",
        category: "Work Item Activation",
        description: "停用工作项，从 activeWorkItems 列表中移除",
        syntax: "deactivate <id>",
        parameters: [
          {
            name: "id",
            type: "string",
            required: true,
            description: "工作项 ID"
          }
        ],
        examples: [
          "node scripts/state.js deactivate state-management"
        ]
      },
      {
        name: "set-phase",
        category: "Work Item Activation",
        description: "设置工作项的开发阶段（自动更新文档 frontmatter）",
        syntax: "set-phase <id> <phase>",
        parameters: [
          {
            name: "id",
            type: "string",
            required: true,
            description: "工作项 ID"
          },
          {
            name: "phase",
            type: "enum",
            required: true,
            description: "开发阶段",
            values: [
              "pending",
              "feature_requirements",
              "feature_review",
              "feature_design",
              "feature_implementation",
              "feature_testing",
              "done"
            ]
          }
        ],
        examples: [
          "node scripts/state.js set-phase state-management feature_requirements",
          "node scripts/state.js set-phase hooks-integration feature_design"
        ]
      },
      {
        name: "add-subtask",
        category: "Subtask",
        description: "添加子任务到指定工作项",
        syntax: "add-subtask --workitem=<id> --desc=\"description\" [--source=ai|impact-analysis|user|interrupted] [--status=pending|in_progress]",
        parameters: [
          {
            name: "workitem",
            type: "string",
            required: true,
            description: "工作项 ID",
            format: "--workitem=<value>"
          },
          {
            name: "desc",
            type: "string",
            required: true,
            description: "任务描述",
            format: "--desc=\"<value>\""
          },
          {
            name: "source",
            type: "enum",
            required: false,
            description: "任务来源",
            values: ["ai", "impact-analysis", "user", "interrupted"],
            default: "user",
            format: "--source=<value>"
          },
          {
            name: "status",
            type: "enum",
            required: false,
            description: "任务状态",
            values: ["pending", "in_progress"],
            default: "pending",
            format: "--status=<value>"
          }
        ],
        examples: [
          "node scripts/state.js add-subtask --workitem=state-management --desc=\"实现 --schema 命令\" --source=ai --status=in_progress",
          "node scripts/state.js add-subtask --workitem=hooks-integration --desc=\"修复 Hook 错误处理\""
        ]
      },
      {
        name: "list-subtasks",
        category: "Subtask",
        description: "列出所有子任务或指定工作项的子任务",
        syntax: "list-subtasks [--workitem=<id>]",
        parameters: [
          {
            name: "workitem",
            type: "string",
            required: false,
            description: "工作项 ID（可选，省略则列出所有子任务）",
            format: "--workitem=<value>"
          }
        ],
        examples: [
          "node scripts/state.js list-subtasks",
          "node scripts/state.js list-subtasks --workitem=state-management"
        ]
      },
      {
        name: "complete-subtask",
        category: "Subtask",
        description: "标记子任务为已完成",
        syntax: "complete-subtask <id>",
        parameters: [
          {
            name: "id",
            type: "string",
            required: true,
            description: "子任务 ID（格式：st_timestamp_序号）"
          }
        ],
        examples: [
          "node scripts/state.js complete-subtask st_1703145600000_001"
        ]
      },
      {
        name: "skip-subtask",
        category: "Subtask",
        description: "跳过子任务（标记为 skipped）",
        syntax: "skip-subtask <id>",
        parameters: [
          {
            name: "id",
            type: "string",
            required: true,
            description: "子任务 ID"
          }
        ],
        examples: [
          "node scripts/state.js skip-subtask st_1703145600000_002"
        ]
      },
      {
        name: "add-pending-doc",
        category: "Pending Docs",
        description: "添加待补充的文档（文档债务）",
        syntax: "add-pending-doc --type=<design|feature|prd> --target=\"path\" --desc=\"description\" [--reason=\"reason\"]",
        parameters: [
          {
            name: "type",
            type: "enum",
            required: true,
            description: "文档类型",
            values: ["design", "feature", "prd"],
            format: "--type=<value>"
          },
          {
            name: "target",
            type: "string",
            required: true,
            description: "目标文档路径",
            format: "--target=\"<value>\""
          },
          {
            name: "desc",
            type: "string",
            required: true,
            description: "待补充内容的描述",
            format: "--desc=\"<value>\""
          },
          {
            name: "reason",
            type: "string",
            required: false,
            description: "产生债务的原因",
            format: "--reason=\"<value>\""
          }
        ],
        examples: [
          "node scripts/state.js add-pending-doc --type=design --target=\"docs/designs/des-xxx.md\" --desc=\"需补充接口设计\" --reason=\"实现时发现需要新增 API\""
        ]
      },
      {
        name: "list-pending-docs",
        category: "Pending Docs",
        description: "列出所有待补充的文档",
        syntax: "list-pending-docs",
        parameters: [],
        examples: [
          "node scripts/state.js list-pending-docs"
        ]
      },
      {
        name: "clear-pending-docs",
        category: "Pending Docs",
        description: "清空所有待补充文档（处理完成后调用）",
        syntax: "clear-pending-docs",
        parameters: [],
        examples: [
          "node scripts/state.js clear-pending-docs"
        ]
      },
      {
        name: "refactoring-status",
        category: "Refactoring Mode",
        description: "获取重构模式的状态",
        syntax: "refactoring-status",
        parameters: [],
        examples: [
          "node scripts/state.js refactoring-status"
        ]
      },
      {
        name: "enable-refactoring",
        category: "Refactoring Mode",
        description: "启用重构模式",
        syntax: "enable-refactoring",
        parameters: [],
        examples: [
          "node scripts/state.js enable-refactoring"
        ]
      },
      {
        name: "disable-refactoring",
        category: "Refactoring Mode",
        description: "禁用重构模式（退出重构）",
        syntax: "disable-refactoring",
        parameters: [],
        examples: [
          "node scripts/state.js disable-refactoring"
        ]
      },
      {
        name: "set-refactoring-phase",
        category: "Refactoring Mode",
        description: "设置重构阶段",
        syntax: "set-refactoring-phase <phase>",
        parameters: [
          {
            name: "phase",
            type: "enum",
            required: true,
            description: "重构阶段",
            values: ["understand", "prd", "requirements", "design", "validate", "completed"]
          }
        ],
        examples: [
          "node scripts/state.js set-refactoring-phase requirements"
        ]
      },
      {
        name: "update-refactoring-progress",
        category: "Refactoring Mode",
        description: "更新重构进度",
        syntax: "update-refactoring-progress <type> <done> [total]",
        parameters: [
          {
            name: "type",
            type: "enum",
            required: true,
            description: "进度类型",
            values: ["prd", "features", "capabilities", "flows", "designs"]
          },
          {
            name: "done",
            type: "string",
            required: true,
            description: "完成数量或状态（prd: not_started|in_progress|done，其他: 数字）"
          },
          {
            name: "total",
            type: "number",
            required: false,
            description: "总数（仅非 prd 类型需要）"
          }
        ],
        examples: [
          "node scripts/state.js update-refactoring-progress prd done",
          "node scripts/state.js update-refactoring-progress features 5 10"
        ]
      },
      {
        name: "init-prd",
        category: "PRD Layer",
        description: "初始化 PRD 字段（用于迁移）",
        syntax: "init-prd",
        parameters: [],
        examples: [
          "node scripts/state.js init-prd"
        ]
      },
      {
        name: "prd-status",
        category: "PRD Layer",
        description: "获取 PRD 层状态",
        syntax: "prd-status",
        parameters: [],
        examples: [
          "node scripts/state.js prd-status"
        ]
      },
      {
        name: "set-prd-phase",
        category: "PRD Layer",
        description: "设置 PRD 阶段",
        syntax: "set-prd-phase <phase>",
        parameters: [
          {
            name: "phase",
            type: "enum",
            required: true,
            description: "PRD 阶段",
            values: ["prd_draft", "prd_scope_review", "prd_decomposing", "prd_done", "null"]
          }
        ],
        examples: [
          "node scripts/state.js set-prd-phase prd_draft",
          "node scripts/state.js set-prd-phase prd_decomposing",
          "node scripts/state.js set-prd-phase null"
        ]
      },
      {
        name: "update-prd-progress",
        category: "PRD Layer",
        description: "更新 PRD 分解进度",
        syntax: "update-prd-progress <done> <total>",
        parameters: [
          {
            name: "done",
            type: "number",
            required: true,
            description: "已完成的 Work Item 数量"
          },
          {
            name: "total",
            type: "number",
            required: true,
            description: "Work Item 总数"
          }
        ],
        examples: [
          "node scripts/state.js update-prd-progress 3 10"
        ]
      },
      {
        name: "migrate-v16",
        category: "Migration",
        description: "从 v14 迁移到 v16（添加 PRD 层支持）",
        syntax: "migrate-v16",
        parameters: [],
        examples: [
          "node scripts/state.js migrate-v16"
        ]
      },
      {
        name: "migrate-v14",
        category: "Migration",
        description: "从 v13 迁移到 v14（重命名 activeFeatures 为 activeWorkItems）",
        syntax: "migrate-v14",
        parameters: [],
        examples: [
          "node scripts/state.js migrate-v14"
        ]
      }
    ],
    commonErrors: [
      {
        error: "Unknown: create",
        reason: "state.js 没有 create 命令",
        solution: "工作项需先在文档中创建（使用模板），然后使用 activate <id> 激活"
      },
      {
        error: "Unknown: update",
        reason: "state.js 没有 update 命令",
        solution: "使用 set-phase 更新阶段，或直接编辑文档 frontmatter 后运行索引脚本"
      }
    ]
  };

  console.log(JSON.stringify(schema, null, 2));
}

function printHelp() {
  console.log(`state.js v16.0.0 - State Management CLI

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

PRD Layer (Two-Layer Lifecycle):
  init-prd                 Initialize PRD field in state (for migration)
  prd-status               Get PRD layer status
  set-prd-phase <phase>    Set PRD phase
                           Phases: prd_draft, prd_scope_review, prd_decomposing, prd_done, null
  update-prd-progress <done> <total>
                           Update PRD decomposing progress

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
  migrate-v16              Migrate to v16.0.0 (adds PRD layer support)
  migrate-v14              Migrate to v14.0.0 (renames activeFeatures to activeWorkItems)

Terminology:
  "Work Item" is the unified term for Feature, Capability, and Flow.
  They are all trackable, deliverable work units in SoloDevFlow.`);
}

const args = process.argv.slice(2);
if (args.length === 0 || args[0] === '--help') { printHelp(); process.exit(0); }
if (args[0] === '--schema') { getSchema(); process.exit(0); }

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
  // PRD Layer (v16.0)
  case 'init-prd': initPrd(); break;
  case 'prd-status': getPrdStatus(); break;
  case 'set-prd-phase': setPrdPhase(args[1]); break;
  case 'update-prd-progress': updatePrdProgress(args[1], args[2]); break;
  // Migration
  case 'migrate-v16': migrateV16(); break;
  case 'migrate-v14': migrateV14(); break;
  case 'migrate-v13': console.log('v13 migration no longer needed, use migrate-v16'); break;
  default: console.error('Unknown: ' + args[0]); process.exit(1);
}
