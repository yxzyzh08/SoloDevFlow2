/**
 * State Reader - 读取 state.json，提取 Feature/Session 信息
 *
 * Based on design: des-hooks-integration.md §3.4
 */

const fs = require('fs');
const path = require('path');

const STATE_PATH = path.join(process.cwd(), '.solodevflow', 'state.json');

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
 * 获取当前活跃的 Feature
 * @param {object} state - state.json 数据
 * @returns {object|null}
 */
function getActiveFeature(state) {
  const activeId = state?.flow?.activeFeatures?.[0];
  if (!activeId || !state?.features?.[activeId]) {
    return null;
  }
  return {
    id: activeId,
    ...state.features[activeId]
  };
}

/**
 * 获取 Session 状态
 * @param {object} state - state.json 数据
 * @returns {object}
 */
function getSession(state) {
  const session = state?.session || {
    mode: 'idle',
    context: {
      topic: null,
      relatedFeatures: [],
      pendingRequirements: []
    }
  };

  // 兼容性：确保 context 存在
  if (!session.context) {
    session.context = {
      topic: null,
      relatedFeatures: [],
      pendingRequirements: []
    };
  }

  return session;
}

/**
 * 获取暂存需求数量（从 session.context.pendingRequirements 计算）
 * @param {object} state - state.json 数据
 * @returns {number}
 */
function getPendingRequirementsCount(state) {
  return state?.session?.context?.pendingRequirements?.length || 0;
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
 * 获取 Pending Sparks 数量
 * @param {object} state - state.json 数据
 * @returns {number}
 */
function getPendingSparksCount(state) {
  return state?.flow?.pendingSparks?.length || 0;
}

module.exports = {
  readState,
  getActiveFeature,
  getSession,
  getProject,
  getPendingSparksCount,
  getPendingRequirementsCount,
  STATE_PATH
};
