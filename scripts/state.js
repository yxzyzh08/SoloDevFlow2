#!/usr/bin/env node

/**
 * state.json CLI - 状态管理接口
 *
 * 提供原子化的读写操作，解决：
 * 1. 大文件问题：只返回需要的数据
 * 2. 并发问题：文件锁机制
 * 3. 格式问题：脚本保证正确性
 *
 * Usage: node scripts/state.js <command> [options]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.join(__dirname, '..');
const LOCK_TIMEOUT = 5000; // 5 seconds

// 动态路径（支持向后兼容）
let STATE_FILE, LOCK_FILE, REPORT_FILE;

/**
 * 查找状态文件（支持遗留路径 .flow/）
 */
function findStateFile(projectPath) {
  const paths = [
    path.join(projectPath, '.solodevflow/state.json'),  // 新标准路径
    path.join(projectPath, '.flow/state.json')          // 遗留路径
  ];

  for (const p of paths) {
    if (fs.existsSync(p)) {
      // 静默迁移：如果在遗留路径，自动迁移到新路径
      if (p.includes('.flow/')) {
        console.log('检测到遗留的 .flow/ 目录，正在自动迁移到 .solodevflow/...');
        migrateFromLegacyFlow(projectPath);
        return path.join(projectPath, '.solodevflow/state.json');
      }
      return p;
    }
  }

  throw new Error('未找到 state.json 文件（检查了 .solodevflow/ 和 .flow/）');
}

/**
 * 从遗留的 .flow/ 迁移到 .solodevflow/
 */
function migrateFromLegacyFlow(projectPath) {
  const flowDir = path.join(projectPath, '.flow');
  const solodevflowDir = path.join(projectPath, '.solodevflow');

  // 创建 .solodevflow 目录
  if (!fs.existsSync(solodevflowDir)) {
    fs.mkdirSync(solodevflowDir, { recursive: true });
  }

  // 移动文件
  const files = ['state.json', 'input-log.md', 'spark-box.md', 'state.report.md', 'pending-docs.md'];
  for (const file of files) {
    const src = path.join(flowDir, file);
    const dest = path.join(solodevflowDir, file);
    if (fs.existsSync(src)) {
      fs.renameSync(src, dest);
      console.log(`  已迁移: .flow/${file} → .solodevflow/${file}`);
    }
  }

  // 复制 flows（如果存在）
  const flowsSrc = path.join(flowDir, 'flows');
  const flowsDest = path.join(solodevflowDir, 'flows');
  if (fs.existsSync(flowsSrc) && !fs.existsSync(flowsDest)) {
    copyDir(flowsSrc, flowsDest);
    console.log(`  已迁移: .flow/flows/ → .solodevflow/flows/`);
  }

  // 删除空的 .flow 目录
  try {
    const remaining = fs.readdirSync(flowDir);
    if (remaining.length === 0) {
      fs.rmdirSync(flowDir);
      console.log('  已删除空的 .flow/ 目录');
    } else {
      console.log(`  保留 .flow/ 目录（包含 ${remaining.length} 个文件）`);
    }
  } catch (e) {
    // 目录可能已被删除
  }

  console.log('✓ 迁移完成！');
}

/**
 * 复制目录
 */
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// 初始化路径
try {
  STATE_FILE = findStateFile(PROJECT_ROOT);
  const stateDir = path.dirname(STATE_FILE);
  LOCK_FILE = path.join(stateDir, 'state.lock');
  REPORT_FILE = path.join(stateDir, 'state.report.md');
} catch (e) {
  // 文件不存在时的默认路径
  STATE_FILE = path.join(PROJECT_ROOT, '.solodevflow/state.json');
  LOCK_FILE = path.join(PROJECT_ROOT, '.solodevflow/state.lock');
  REPORT_FILE = path.join(PROJECT_ROOT, '.solodevflow/state.report.md');
}

// ============ Lock Mechanism ============

function acquireLock(timeout = LOCK_TIMEOUT) {
  const startTime = Date.now();

  while (fs.existsSync(LOCK_FILE)) {
    // Check if lock is stale (older than timeout)
    try {
      const lockStat = fs.statSync(LOCK_FILE);
      if (Date.now() - lockStat.mtimeMs > LOCK_TIMEOUT) {
        // Stale lock, remove it
        fs.unlinkSync(LOCK_FILE);
        break;
      }
    } catch (e) {
      // Lock file was removed by another process
      break;
    }

    if (Date.now() - startTime > timeout) {
      console.error('Error: Could not acquire lock (timeout)');
      process.exit(1);
    }

    // Wait a bit before retrying
    const waitTime = 50;
    const waitUntil = Date.now() + waitTime;
    while (Date.now() < waitUntil) {
      // Busy wait (Node.js doesn't have sleep)
    }
  }

  // Create lock file
  fs.writeFileSync(LOCK_FILE, String(process.pid));
}

function releaseLock() {
  try {
    if (fs.existsSync(LOCK_FILE)) {
      fs.unlinkSync(LOCK_FILE);
    }
  } catch (e) {
    // Ignore errors when releasing lock
  }
}

// ============ State I/O ============

function readState() {
  if (!fs.existsSync(STATE_FILE)) {
    console.error(`Error: state.json not found at ${STATE_FILE}`);
    process.exit(1);
  }

  try {
    const content = fs.readFileSync(STATE_FILE, 'utf8');
    return JSON.parse(content);
  } catch (e) {
    console.error('Error: Failed to parse state.json:', e.message);
    process.exit(1);
  }
}

function writeState(state) {
  state.lastUpdated = new Date().toISOString();
  state.metadata.stateFileVersion = (state.metadata.stateFileVersion || 0) + 1;
  state.metadata.totalStateChanges = (state.metadata.totalStateChanges || 0) + 1;

  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  generateReport(state);
}

// ============ Report Generation ============

function getStatusIcon(status) {
  switch (status) {
    case 'completed': return '✅';
    case 'in_progress': return '🔄';
    case 'blocked': return '❌';
    case 'not_started': return '⬚';
    case 'skipped': return '⏭️';
    case 'pending': return '⬚';
    default: return '❓';
  }
}

function generateReport(state) {
  const lines = [];

  // Header
  lines.push('# State Report');
  lines.push('');
  lines.push('> 自动生成，请勿手动编辑');
  lines.push('');

  // Project Info
  lines.push('## Project');
  lines.push('');
  lines.push(`| 属性 | 值 |`);
  lines.push(`|------|-----|`);
  lines.push(`| Name | ${state.project.name} |`);
  lines.push(`| Schema | v${state.schemaVersion} |`);
  lines.push(`| Method | ${state.flow.researchMethod} |`);
  lines.push(`| Updated | ${state.lastUpdated} |`);
  lines.push('');

  // Active Features
  lines.push('## Active Features');
  lines.push('');
  if (state.flow.activeFeatures.length === 0) {
    lines.push('_None_');
  } else {
    lines.push('| Feature | Domain | Phase | Status |');
    lines.push('|---------|--------|-------|--------|');
    state.flow.activeFeatures.forEach(name => {
      const f = state.features[name];
      if (f) {
        lines.push(`| ${name} | ${f.domain || '-'} | ${f.phase} | ${getStatusIcon(f.status)} ${f.status} |`);
      }
    });
  }
  lines.push('');

  // Domain Tree
  lines.push('## Domain Tree');
  lines.push('');

  const domainTree = {};
  for (const [name, feature] of Object.entries(state.features)) {
    const domain = feature.domain || '_independent';
    if (!domainTree[domain]) {
      domainTree[domain] = [];
    }
    domainTree[domain].push({ name, ...feature });
  }

  for (const [domainName, features] of Object.entries(domainTree)) {
    const completed = features.filter(f => f.status === 'completed').length;
    const desc = state.domains[domainName] || '';
    lines.push(`### 📁 ${domainName} (${completed}/${features.length})`);
    if (desc) {
      lines.push(`> ${desc}`);
    }
    lines.push('');

    features.forEach(f => {
      const icon = getStatusIcon(f.status);
      const activeMarker = state.flow.activeFeatures.includes(f.name) ? ' **[ACTIVE]**' : '';
      lines.push(`- ${icon} **${f.name}** [${f.phase}]${activeMarker}`);
      if (f.description) {
        lines.push(`  - ${f.description}`);
      }
      if (f.subtasks && f.subtasks.length > 0) {
        const pendingSubtasks = f.subtasks.filter(s => s.status === 'pending' || s.status === 'in_progress');
        if (pendingSubtasks.length > 0) {
          lines.push(`  - Subtasks: ${pendingSubtasks.length} pending`);
        }
      }
    });
    lines.push('');
  }

  // Stats
  const total = Object.keys(state.features).length;
  const completed = Object.values(state.features).filter(f => f.status === 'completed').length;
  const inProgress = Object.values(state.features).filter(f => f.status === 'in_progress').length;
  const notStarted = total - completed - inProgress;

  lines.push('## Stats');
  lines.push('');
  lines.push(`| 指标 | 值 |`);
  lines.push(`|------|-----|`);
  lines.push(`| Total Features | ${total} |`);
  lines.push(`| Completed | ${completed} (${Math.round(completed/total*100)}%) |`);
  lines.push(`| In Progress | ${inProgress} |`);
  lines.push(`| Not Started | ${notStarted} |`);
  lines.push(`| Domains | ${Object.keys(state.domains).length} |`);
  lines.push(`| Sparks | ${state.sparks.length} |`);
  lines.push(`| Pending Docs | ${state.pendingDocs.length} |`);
  lines.push('');

  // Footer
  lines.push('---');
  lines.push(`*Generated at ${state.lastUpdated}*`);

  fs.writeFileSync(REPORT_FILE, lines.join('\n'));
}

// ============ Query Commands ============

function getFeature(name) {
  const state = readState();
  const feature = state.features[name];

  if (!feature) {
    console.error(`Error: Feature "${name}" not found`);
    process.exit(1);
  }

  console.log(JSON.stringify({
    name,
    ...feature,
    isActive: state.flow.activeFeatures.includes(name)
  }, null, 2));
}

function listActive() {
  const state = readState();
  const activeFeatures = state.flow.activeFeatures.map(name => ({
    name,
    ...state.features[name]
  }));

  console.log(JSON.stringify(activeFeatures, null, 2));
}

function listFeatures(domain = null) {
  const state = readState();
  let features = Object.entries(state.features).map(([name, f]) => ({
    name,
    ...f,
    isActive: state.flow.activeFeatures.includes(name)
  }));

  if (domain) {
    features = features.filter(f => f.domain === domain);
  }

  console.log(JSON.stringify(features, null, 2));
}

function getDomain(name) {
  const state = readState();

  if (!state.domains[name]) {
    console.error(`Error: Domain "${name}" not found`);
    process.exit(1);
  }

  const features = Object.entries(state.features)
    .filter(([_, f]) => f.domain === name)
    .map(([n, f]) => ({
      name: n,
      type: f.type,
      phase: f.phase,
      status: f.status
    }));

  console.log(JSON.stringify({
    name,
    description: state.domains[name],
    features
  }, null, 2));
}

function getProject() {
  const state = readState();
  console.log(JSON.stringify(state.project, null, 2));
}

function getFlow() {
  const state = readState();
  console.log(JSON.stringify(state.flow, null, 2));
}

function getSummary() {
  const state = readState();

  const totalFeatures = Object.keys(state.features).length;
  const completedFeatures = Object.values(state.features).filter(f => f.status === 'completed').length;
  const inProgressFeatures = Object.values(state.features).filter(f => f.status === 'in_progress').length;

  console.log(JSON.stringify({
    project: state.project.name,
    schemaVersion: state.schemaVersion,
    researchMethod: state.flow.researchMethod,
    activeFeatures: state.flow.activeFeatures,
    stats: {
      total: totalFeatures,
      completed: completedFeatures,
      inProgress: inProgressFeatures,
      notStarted: totalFeatures - completedFeatures - inProgressFeatures
    },
    domains: Object.keys(state.domains),
    sparksCount: state.sparks.length,
    pendingDocsCount: state.pendingDocs.length
  }, null, 2));
}

// ============ Update Commands ============

function updateFeature(name, options) {
  acquireLock();
  try {
    const state = readState();

    if (!state.features[name]) {
      console.error(`Error: Feature "${name}" not found`);
      process.exit(1);
    }

    const feature = state.features[name];

    if (options.phase) {
      feature.phase = options.phase;
    }
    if (options.status) {
      feature.status = options.status;
    }
    if (options.description) {
      feature.description = options.description;
    }
    if (options.docPath) {
      feature.docPath = options.docPath;
    }

    writeState(state);
    console.log(JSON.stringify({ success: true, feature: { name, ...feature } }, null, 2));
  } finally {
    releaseLock();
  }
}

function completeFeature(name) {
  acquireLock();
  try {
    const state = readState();

    if (!state.features[name]) {
      console.error(`Error: Feature "${name}" not found`);
      process.exit(1);
    }

    state.features[name].phase = 'done';
    state.features[name].status = 'completed';

    // Remove from activeFeatures
    state.flow.activeFeatures = state.flow.activeFeatures.filter(n => n !== name);

    writeState(state);
    console.log(JSON.stringify({ success: true, message: `Feature "${name}" completed` }, null, 2));
  } finally {
    releaseLock();
  }
}

function addFeature(name, options) {
  acquireLock();
  try {
    const state = readState();

    if (state.features[name]) {
      console.error(`Error: Feature "${name}" already exists`);
      process.exit(1);
    }

    if (!options.domain) {
      console.error('Error: --domain is required');
      process.exit(1);
    }

    if (!state.domains[options.domain]) {
      console.error(`Error: Domain "${options.domain}" not found`);
      process.exit(1);
    }

    const type = options.type || 'document';
    const phase = type === 'code' ? 'pending' : 'pending';

    state.features[name] = {
      type,
      domain: options.domain,
      docPath: options.docPath || null,
      phase,
      status: 'not_started'
    };

    if (options.description) {
      state.features[name].description = options.description;
    }

    // For code type, initialize designDepth and artifacts
    if (type === 'code') {
      state.features[name].designDepth = options.designDepth || 'required';
      state.features[name].artifacts = {
        design: null,
        code: [],
        tests: []
      };
    }

    writeState(state);
    console.log(JSON.stringify({ success: true, feature: { name, ...state.features[name] } }, null, 2));
  } finally {
    releaseLock();
  }
}

function removeFeature(name) {
  acquireLock();
  try {
    const state = readState();

    if (!state.features[name]) {
      console.error(`Error: Feature "${name}" not found`);
      process.exit(1);
    }

    delete state.features[name];
    state.flow.activeFeatures = state.flow.activeFeatures.filter(n => n !== name);

    writeState(state);
    console.log(JSON.stringify({ success: true, message: `Feature "${name}" removed` }, null, 2));
  } finally {
    releaseLock();
  }
}

function activateFeature(name) {
  acquireLock();
  try {
    const state = readState();

    if (!state.features[name]) {
      console.error(`Error: Feature "${name}" not found`);
      process.exit(1);
    }

    if (!state.flow.activeFeatures.includes(name)) {
      state.flow.activeFeatures.push(name);
    }

    // Update status to in_progress if not_started
    if (state.features[name].status === 'not_started') {
      state.features[name].status = 'in_progress';
    }

    writeState(state);
    console.log(JSON.stringify({ success: true, activeFeatures: state.flow.activeFeatures }, null, 2));
  } finally {
    releaseLock();
  }
}

function deactivateFeature(name) {
  acquireLock();
  try {
    const state = readState();

    state.flow.activeFeatures = state.flow.activeFeatures.filter(n => n !== name);

    writeState(state);
    console.log(JSON.stringify({ success: true, activeFeatures: state.flow.activeFeatures }, null, 2));
  } finally {
    releaseLock();
  }
}

function addSubtask(featureName, options) {
  acquireLock();
  try {
    const state = readState();

    if (!state.features[featureName]) {
      console.error(`Error: Feature "${featureName}" not found`);
      process.exit(1);
    }

    if (!options.description) {
      console.error('Error: --description is required');
      process.exit(1);
    }

    const feature = state.features[featureName];
    if (!feature.subtasks) {
      feature.subtasks = [];
    }

    const subtask = {
      id: `st_${Date.now()}_${String(feature.subtasks.length + 1).padStart(3, '0')}`,
      description: options.description,
      status: 'pending',
      createdAt: new Date().toISOString(),
      source: options.source || 'user'
    };

    if (options.target) {
      subtask.target = options.target;
    }

    feature.subtasks.push(subtask);

    writeState(state);
    console.log(JSON.stringify({ success: true, subtask }, null, 2));
  } finally {
    releaseLock();
  }
}

function completeSubtask(featureName, subtaskId) {
  acquireLock();
  try {
    const state = readState();

    if (!state.features[featureName]) {
      console.error(`Error: Feature "${featureName}" not found`);
      process.exit(1);
    }

    const feature = state.features[featureName];
    if (!feature.subtasks) {
      console.error(`Error: Feature "${featureName}" has no subtasks`);
      process.exit(1);
    }

    const subtask = feature.subtasks.find(s => s.id === subtaskId);
    if (!subtask) {
      console.error(`Error: Subtask "${subtaskId}" not found`);
      process.exit(1);
    }

    subtask.status = 'completed';

    writeState(state);
    console.log(JSON.stringify({ success: true, subtask }, null, 2));
  } finally {
    releaseLock();
  }
}

function skipSubtask(featureName, subtaskId) {
  acquireLock();
  try {
    const state = readState();

    if (!state.features[featureName]) {
      console.error(`Error: Feature "${featureName}" not found`);
      process.exit(1);
    }

    const feature = state.features[featureName];
    if (!feature.subtasks) {
      console.error(`Error: Feature "${featureName}" has no subtasks`);
      process.exit(1);
    }

    const subtask = feature.subtasks.find(s => s.id === subtaskId);
    if (!subtask) {
      console.error(`Error: Subtask "${subtaskId}" not found`);
      process.exit(1);
    }

    subtask.status = 'skipped';

    writeState(state);
    console.log(JSON.stringify({ success: true, subtask }, null, 2));
  } finally {
    releaseLock();
  }
}

function addDomain(name, options) {
  acquireLock();
  try {
    const state = readState();

    if (state.domains[name]) {
      console.error(`Error: Domain "${name}" already exists`);
      process.exit(1);
    }

    if (!options.description) {
      console.error('Error: --description is required');
      process.exit(1);
    }

    state.domains[name] = options.description;

    writeState(state);
    console.log(JSON.stringify({ success: true, domain: { name, description: options.description } }, null, 2));
  } finally {
    releaseLock();
  }
}

function recordCommit() {
  acquireLock();
  try {
    // Check if in git repo
    try {
      execSync('git rev-parse --git-dir', { stdio: 'pipe' });
    } catch (e) {
      console.error('Error: Not a git repository');
      process.exit(1);
    }

    // Get latest commit info
    let hash, message;
    try {
      hash = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
      message = execSync('git log -1 --format=%s', { encoding: 'utf8' }).trim();
    } catch (e) {
      console.error('Error: Failed to get git commit info:', e.message);
      process.exit(1);
    }

    const state = readState();

    // Update metadata
    state.metadata.lastGitCommit = hash;
    state.metadata.lastGitCommitMessage = message;
    state.metadata.lastGitCommitAt = new Date().toISOString();

    writeState(state);
    console.log(JSON.stringify({
      success: true,
      commit: {
        hash: hash.substring(0, 7),
        message
      }
    }, null, 2));
  } finally {
    releaseLock();
  }
}

function setArtifacts(featureName, options) {
  acquireLock();
  try {
    const state = readState();

    if (!state.features[featureName]) {
      console.error(`Error: Feature "${featureName}" not found`);
      process.exit(1);
    }

    const feature = state.features[featureName];

    if (feature.type !== 'code') {
      console.error(`Error: Feature "${featureName}" is not a code type feature`);
      process.exit(1);
    }

    // Update designDepth if provided
    if (options.designDepth) {
      const validDepths = ['none', 'required'];
      if (!validDepths.includes(options.designDepth)) {
        console.error(`Error: Invalid designDepth. Expected: ${validDepths.join(', ')}`);
        process.exit(1);
      }
      feature.designDepth = options.designDepth;
    }

    // Initialize artifacts if not exists
    if (!feature.artifacts) {
      feature.artifacts = { design: null, code: [], tests: [] };
    }

    // Update design path
    if (options.design !== undefined) {
      feature.artifacts.design = options.design || null;
    }

    // Update code paths (comma-separated)
    if (options.code) {
      feature.artifacts.code = options.code.split(',').map(s => s.trim());
    }

    // Update test paths (comma-separated)
    if (options.tests) {
      feature.artifacts.tests = options.tests.split(',').map(s => s.trim());
    }

    writeState(state);
    console.log(JSON.stringify({
      success: true,
      feature: {
        name: featureName,
        designDepth: feature.designDepth,
        artifacts: feature.artifacts
      }
    }, null, 2));
  } finally {
    releaseLock();
  }
}

function getArtifacts(featureName) {
  const state = readState();

  if (!state.features[featureName]) {
    console.error(`Error: Feature "${featureName}" not found`);
    process.exit(1);
  }

  const feature = state.features[featureName];

  if (feature.type !== 'code') {
    console.error(`Error: Feature "${featureName}" is not a code type feature`);
    process.exit(1);
  }

  console.log(JSON.stringify({
    name: featureName,
    designDepth: feature.designDepth || null,
    artifacts: feature.artifacts || null
  }, null, 2));
}

function listArtifacts() {
  const state = readState();

  const codeFeatures = Object.entries(state.features)
    .filter(([_, f]) => f.type === 'code')
    .map(([name, f]) => ({
      name,
      designDepth: f.designDepth || null,
      artifacts: f.artifacts || null,
      phase: f.phase,
      status: f.status
    }));

  console.log(JSON.stringify(codeFeatures, null, 2));
}

// ============ Session Commands (v11.0) ============

/**
 * 设置 session mode
 */
function sessionMode(mode) {
  const validModes = ['idle', 'consulting', 'delivering'];
  if (!validModes.includes(mode)) {
    console.error(`Error: Invalid mode. Expected: ${validModes.join(', ')}`);
    process.exit(1);
  }

  acquireLock();
  try {
    const state = readState();

    // 确保 session 结构存在
    if (!state.session) {
      state.session = {
        mode: 'idle',
        context: {
          topic: null,
          relatedFeatures: [],
          pendingRequirements: []
        }
      };
    }

    state.session.mode = mode;

    // 切换到 idle 时清空 topic
    if (mode === 'idle') {
      state.session.context.topic = null;
      state.session.context.relatedFeatures = [];
    }

    writeState(state);
    console.log(JSON.stringify({ success: true, session: state.session }, null, 2));
  } finally {
    releaseLock();
  }
}

/**
 * 设置 session topic
 */
function sessionTopic(topic) {
  acquireLock();
  try {
    const state = readState();

    // 确保 session 结构存在
    if (!state.session) {
      state.session = {
        mode: 'idle',
        context: {
          topic: null,
          relatedFeatures: [],
          pendingRequirements: []
        }
      };
    }

    state.session.context.topic = topic || null;

    writeState(state);
    console.log(JSON.stringify({ success: true, session: state.session }, null, 2));
  } finally {
    releaseLock();
  }
}

/**
 * 添加待处理需求
 */
function addPending(content, source = 'user') {
  if (!content) {
    console.error('Error: Content is required');
    process.exit(1);
  }

  acquireLock();
  try {
    const state = readState();

    // 确保 session 结构存在
    if (!state.session) {
      state.session = {
        mode: 'idle',
        context: {
          topic: null,
          relatedFeatures: [],
          pendingRequirements: []
        }
      };
    }
    if (!state.session.context) {
      state.session.context = {
        topic: null,
        relatedFeatures: [],
        pendingRequirements: []
      };
    }
    if (!state.session.context.pendingRequirements) {
      state.session.context.pendingRequirements = [];
    }

    const requirement = {
      id: `pr_${Date.now()}`,
      content,
      source,
      createdAt: new Date().toISOString()
    };

    state.session.context.pendingRequirements.push(requirement);

    writeState(state);
    console.log(JSON.stringify({ success: true, requirement }, null, 2));
  } finally {
    releaseLock();
  }
}

/**
 * 列出待处理需求
 */
function listPending() {
  const state = readState();

  const pending = state.session?.context?.pendingRequirements || [];

  console.log(JSON.stringify({
    count: pending.length,
    requirements: pending
  }, null, 2));
}

/**
 * 清空所有待处理需求
 */
function clearPending() {
  acquireLock();
  try {
    const state = readState();

    if (state.session?.context?.pendingRequirements) {
      const count = state.session.context.pendingRequirements.length;
      state.session.context.pendingRequirements = [];
      writeState(state);
      console.log(JSON.stringify({ success: true, cleared: count }, null, 2));
    } else {
      console.log(JSON.stringify({ success: true, cleared: 0 }, null, 2));
    }
  } finally {
    releaseLock();
  }
}

/**
 * 移除指定待处理需求
 */
function removePending(id) {
  if (!id) {
    console.error('Error: Requirement ID is required');
    process.exit(1);
  }

  acquireLock();
  try {
    const state = readState();

    if (!state.session?.context?.pendingRequirements) {
      console.error('Error: No pending requirements found');
      process.exit(1);
    }

    const idx = state.session.context.pendingRequirements.findIndex(r => r.id === id);
    if (idx === -1) {
      console.error(`Error: Requirement "${id}" not found`);
      process.exit(1);
    }

    const removed = state.session.context.pendingRequirements.splice(idx, 1)[0];
    writeState(state);
    console.log(JSON.stringify({ success: true, removed }, null, 2));
  } finally {
    releaseLock();
  }
}

/**
 * 获取当前 session 状态
 */
function getSession() {
  const state = readState();

  const session = state.session || {
    mode: 'idle',
    context: {
      topic: null,
      relatedFeatures: [],
      pendingRequirements: []
    }
  };

  console.log(JSON.stringify(session, null, 2));
}

// ============ CLI Parser ============

function parseArgs(args) {
  const options = {};
  let i = 0;

  while (i < args.length) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      const value = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true;
      options[key] = value;
      i += value === true ? 1 : 2;
    } else {
      i++;
    }
  }

  return options;
}

function printHelp() {
  console.log(`
state.js - State Management CLI

QUERY COMMANDS:
  get-feature <name>           Get feature details
  list-active                  List active features
  list-features [--domain x]   List all features (optional: filter by domain)
  get-domain <name>            Get domain with its features
  get-project                  Get project info
  get-flow                     Get flow info
  summary                      Get state summary
  get-artifacts <name>         Get artifacts for a code type feature
  list-artifacts               List all code type features with artifacts
  get-session                  Get current session state
  list-pending                 List pending requirements

UPDATE COMMANDS:
  update-feature <name> --phase <phase> [--status <status>]
  complete-feature <name>      Mark feature as done
  add-feature <name> --domain <domain> [--type code|document] [--description ...] [--designDepth none|required]
  remove-feature <name>        Remove feature
  activate-feature <name>      Add to activeFeatures
  deactivate-feature <name>    Remove from activeFeatures
  add-subtask <feature> --description <desc> [--target <path>] [--source <src>]
  complete-subtask <feature> <subtask-id>
  skip-subtask <feature> <subtask-id>
  add-domain <name> --description <desc>
  record-commit                Record latest git commit to metadata
  set-artifacts <name> [--designDepth none|required] [--design <path>] [--code <paths>] [--tests <paths>]

SESSION COMMANDS (v11.0):
  session-mode <mode>          Set session mode (idle|consulting|delivering)
  session-topic <topic>        Set session topic
  add-pending <content>        Add pending requirement [--source <src>]
  remove-pending <id>          Remove pending requirement by ID
  clear-pending                Clear all pending requirements

OPTIONS:
  --help                       Show this help

EXAMPLES:
  node scripts/state.js get-feature state-management
  node scripts/state.js list-active
  node scripts/state.js update-feature xxx --phase done --status completed
  node scripts/state.js complete-feature xxx
  node scripts/state.js add-subtask xxx --description "Check dependencies"
  node scripts/state.js set-artifacts xxx --designDepth required --design "docs/xxx.design.md" --code "src/xxx.js" --tests "tests/xxx.test.ts"
  node scripts/state.js session-mode consulting
  node scripts/state.js add-pending "需要添加用户认证功能"
  node scripts/state.js list-pending
`);
}

// ============ Main ============

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help') {
    printHelp();
    return;
  }

  const command = args[0];
  const restArgs = args.slice(1);
  const options = parseArgs(restArgs);

  switch (command) {
    // Query commands
    case 'get-feature':
      if (!restArgs[0] || restArgs[0].startsWith('--')) {
        console.error('Error: Feature name required');
        process.exit(1);
      }
      getFeature(restArgs[0]);
      break;

    case 'list-active':
      listActive();
      break;

    case 'list-features':
      listFeatures(options.domain);
      break;

    case 'get-domain':
      if (!restArgs[0] || restArgs[0].startsWith('--')) {
        console.error('Error: Domain name required');
        process.exit(1);
      }
      getDomain(restArgs[0]);
      break;

    case 'get-project':
      getProject();
      break;

    case 'get-flow':
      getFlow();
      break;

    case 'summary':
      getSummary();
      break;

    // Update commands
    case 'update-feature':
      if (!restArgs[0] || restArgs[0].startsWith('--')) {
        console.error('Error: Feature name required');
        process.exit(1);
      }
      updateFeature(restArgs[0], options);
      break;

    case 'complete-feature':
      if (!restArgs[0] || restArgs[0].startsWith('--')) {
        console.error('Error: Feature name required');
        process.exit(1);
      }
      completeFeature(restArgs[0]);
      break;

    case 'add-feature':
      if (!restArgs[0] || restArgs[0].startsWith('--')) {
        console.error('Error: Feature name required');
        process.exit(1);
      }
      addFeature(restArgs[0], options);
      break;

    case 'remove-feature':
      if (!restArgs[0] || restArgs[0].startsWith('--')) {
        console.error('Error: Feature name required');
        process.exit(1);
      }
      removeFeature(restArgs[0]);
      break;

    case 'activate-feature':
      if (!restArgs[0] || restArgs[0].startsWith('--')) {
        console.error('Error: Feature name required');
        process.exit(1);
      }
      activateFeature(restArgs[0]);
      break;

    case 'deactivate-feature':
      if (!restArgs[0] || restArgs[0].startsWith('--')) {
        console.error('Error: Feature name required');
        process.exit(1);
      }
      deactivateFeature(restArgs[0]);
      break;

    case 'add-subtask':
      if (!restArgs[0] || restArgs[0].startsWith('--')) {
        console.error('Error: Feature name required');
        process.exit(1);
      }
      addSubtask(restArgs[0], options);
      break;

    case 'complete-subtask':
      if (!restArgs[0] || restArgs[0].startsWith('--')) {
        console.error('Error: Feature name required');
        process.exit(1);
      }
      if (!restArgs[1] || restArgs[1].startsWith('--')) {
        console.error('Error: Subtask ID required');
        process.exit(1);
      }
      completeSubtask(restArgs[0], restArgs[1]);
      break;

    case 'skip-subtask':
      if (!restArgs[0] || restArgs[0].startsWith('--')) {
        console.error('Error: Feature name required');
        process.exit(1);
      }
      if (!restArgs[1] || restArgs[1].startsWith('--')) {
        console.error('Error: Subtask ID required');
        process.exit(1);
      }
      skipSubtask(restArgs[0], restArgs[1]);
      break;

    case 'add-domain':
      if (!restArgs[0] || restArgs[0].startsWith('--')) {
        console.error('Error: Domain name required');
        process.exit(1);
      }
      addDomain(restArgs[0], options);
      break;

    case 'record-commit':
      recordCommit();
      break;

    case 'set-artifacts':
      if (!restArgs[0] || restArgs[0].startsWith('--')) {
        console.error('Error: Feature name required');
        process.exit(1);
      }
      setArtifacts(restArgs[0], options);
      break;

    case 'get-artifacts':
      if (!restArgs[0] || restArgs[0].startsWith('--')) {
        console.error('Error: Feature name required');
        process.exit(1);
      }
      getArtifacts(restArgs[0]);
      break;

    case 'list-artifacts':
      listArtifacts();
      break;

    // Session commands (v11.0)
    case 'session-mode':
      if (!restArgs[0] || restArgs[0].startsWith('--')) {
        console.error('Error: Mode required (idle|consulting|delivering)');
        process.exit(1);
      }
      sessionMode(restArgs[0]);
      break;

    case 'session-topic':
      sessionTopic(restArgs[0] || null);
      break;

    case 'add-pending':
      if (!restArgs[0] || restArgs[0].startsWith('--')) {
        console.error('Error: Content required');
        process.exit(1);
      }
      addPending(restArgs[0], options.source || 'user');
      break;

    case 'list-pending':
      listPending();
      break;

    case 'remove-pending':
      if (!restArgs[0] || restArgs[0].startsWith('--')) {
        console.error('Error: Requirement ID required');
        process.exit(1);
      }
      removePending(restArgs[0]);
      break;

    case 'clear-pending':
      clearPending();
      break;

    case 'get-session':
      getSession();
      break;

    case 'help':
      printHelp();
      break;

    default:
      console.error(`Error: Unknown command "${command}"`);
      printHelp();
      process.exit(1);
  }
}

main();
