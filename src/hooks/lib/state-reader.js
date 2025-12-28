/**
 * State Reader - 读取 state.json + index.json，提取 Feature 信息
 *
 * Based on design: des-hooks-integration.md §3.4
 * Updated for v12.0.0: Features moved to index.json
 * Updated for v13.0.0: Removed session structure
 */

const fs = require('fs');
const path = require('path');

const STATE_PATH = path.join(process.cwd(), '.solodevflow', 'state.json');
const INDEX_PATH = path.join(process.cwd(), '.solodevflow', 'index.json');

/**
 * 读取 state.json
 * @returns {{ data?: object, error?: string, message?: string }}
 */
function readState() {
  if (!fs.existsSync(STATE_PATH)) {
    return { error: 'STATE_NOT_FOUND' };
  }

  try {
    const content = fs.readFileSync(STATE_PATH, 'utf-8');
    return { data: JSON.parse(content) };
  } catch (err) {
    return { error: 'STATE_PARSE_ERROR', message: err.message };
  }
}

/**
 * 读取 index.json
 * @returns {{ data?: object, error?: string }}
 */
function readIndex() {
  if (!fs.existsSync(INDEX_PATH)) {
    return { error: 'INDEX_NOT_FOUND' };
  }

  try {
    const content = fs.readFileSync(INDEX_PATH, 'utf-8');
    return { data: JSON.parse(content) };
  } catch (err) {
    return { error: 'INDEX_PARSE_ERROR', message: err.message };
  }
}

/**
 * 获取当前活跃的 Feature
 * @param {object} state - state.json 数据
 * @returns {object|null}
 */
function getActiveFeature(state) {
  const activeId = state?.flow?.activeFeatures?.[0];
  if (!activeId) {
    return null;
  }

  // 从 index.json 获取 feature 信息
  const indexResult = readIndex();
  if (indexResult.error || !indexResult.data?.documents) {
    return { id: activeId, phase: 'feature_implementation' };
  }

  // 查找匹配的 feature
  const feature = indexResult.data.documents.find(doc => doc.id === activeId);
  if (!feature) {
    return { id: activeId, phase: 'feature_implementation' };
  }

  // 优先使用 frontmatter 中的 phase（如果存在）
  // 只有当 phase 未设置时，才用 status 推导
  let phase = feature.phase;

  if (!phase) {
    // 仅作为 fallback：用 status 推导 phase
    const statusToPhase = {
      'not_started': 'pending',
      'in_progress': 'feature_requirements',  // 默认进入需求阶段，而非直接跳到实现
      'done': 'done',
      'deprecated': 'done'
    };
    phase = statusToPhase[feature.status] || 'feature_requirements';
  }

  return {
    id: activeId,
    phase: phase,
    status: feature.status,
    path: feature.path
  };
}

/**
 * 获取项目信息
 * @param {object} state - state.json 数据
 * @returns {object}
 */
function getProject(state) {
  return state?.project || {
    name: 'Unknown',
    description: ''
  };
}

/**
 * 获取子任务列表
 * @param {object} state - state.json 数据
 * @returns {Array}
 */
function getSubtasks(state) {
  return state?.subtasks || [];
}

/**
 * 获取指定 Feature 的未完成子任务
 * @param {object} state - state.json 数据
 * @param {string} featureId - Feature ID
 * @returns {Array}
 */
function getPendingSubtasksForFeature(state, featureId) {
  const subtasks = state?.subtasks || [];
  return subtasks.filter(s =>
    s.featureId === featureId &&
    (s.status === 'pending' || s.status === 'in_progress')
  );
}

/**
 * 获取文档债务列表
 * @param {object} state - state.json 数据
 * @returns {Array}
 */
function getPendingDocs(state) {
  return state?.pendingDocs || [];
}

module.exports = {
  readState,
  readIndex,
  getActiveFeature,
  getProject,
  getSubtasks,
  getPendingSubtasksForFeature,
  getPendingDocs,
  STATE_PATH,
  INDEX_PATH
};
