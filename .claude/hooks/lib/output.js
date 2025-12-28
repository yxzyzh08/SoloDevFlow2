/**
 * Output - 输出格式化，生成 <workflow-context>
 *
 * Based on design: des-hooks-integration.md §3.3
 */

/**
 * 生成 workflow-context 标签
 * @param {object} options
 * @param {string} options.projectName - 项目名称
 * @param {object} options.activeFeature - 当前活跃 Feature
 * @param {Array} options.subtasks - 子任务列表
 * @param {Array} options.pendingDocs - 文档债务列表
 * @returns {string}
 */
function formatWorkflowContext(options) {
  const {
    projectName = 'Unknown',
    activeFeature,
    subtasks = [],
    pendingDocs = []
  } = options;

  const lines = [
    '<workflow-context>',
    `Project: ${projectName}`
  ];

  if (activeFeature) {
    lines.push(`Active Feature: ${activeFeature.id} (${activeFeature.phase || 'unknown'})`);
  } else {
    lines.push('Active Feature: (none)');
  }

  // 注入 in_progress 任务（当前正在进行的工作）
  const inProgressTasks = subtasks.filter(s => s.status === 'in_progress');
  if (inProgressTasks.length > 0) {
    lines.push(`In-Progress Tasks: ${inProgressTasks.length}`);
    for (const task of inProgressTasks.slice(0, 3)) {
      lines.push(`  - [${task.featureId}] ${task.description.substring(0, 50)}${task.description.length > 50 ? '...' : ''}`);
    }
  }

  // 注入 pending subtasks 数量
  const pendingSubtasks = subtasks.filter(s => s.status === 'pending');
  if (pendingSubtasks.length > 0) {
    lines.push(`Pending Subtasks: ${pendingSubtasks.length}`);
  }

  // 注入 pendingDocs 数量
  if (pendingDocs.length > 0) {
    lines.push(`Pending Docs: ${pendingDocs.length}`);
  }

  lines.push('</workflow-context>');

  return lines.join('\n');
}

/**
 * 生成 UserPromptSubmit 的 additionalContext
 * @param {object} options
 * @param {string} options.productName - 产品名称
 * @param {object} options.activeFeature - 当前活跃 Feature
 * @param {Array} options.relevantDocs - 相关文档列表
 * @param {Array} options.subtasks - 子任务列表
 * @param {Array} options.pendingDocs - 文档债务列表
 * @returns {string}
 */
function formatUserPromptContext(options) {
  const {
    productName = 'Unknown',
    activeFeature,
    relevantDocs = [],
    subtasks = [],
    pendingDocs = []
  } = options;

  const lines = [
    '<workflow-context>'
  ];

  lines.push(`Product: ${productName}`);

  if (activeFeature) {
    lines.push(`Current Feature: ${activeFeature.id} (${activeFeature.phase || 'unknown'})`);
  }

  // 注入 in_progress 任务
  const inProgressTasks = subtasks.filter(s => s.status === 'in_progress');
  if (inProgressTasks.length > 0) {
    lines.push(`In-Progress Tasks: ${inProgressTasks.length}`);
  }

  // 注入 pending subtasks 数量
  const pendingSubtasks = subtasks.filter(s => s.status === 'pending');
  if (pendingSubtasks.length > 0) {
    lines.push(`Pending Subtasks: ${pendingSubtasks.length}`);
  }

  // 注入 pendingDocs 数量
  if (pendingDocs.length > 0) {
    lines.push(`Pending Docs: ${pendingDocs.length}`);
  }

  if (relevantDocs.length > 0) {
    lines.push('Related Docs:');
    for (const doc of relevantDocs.slice(0, 3)) {
      lines.push(`  - ${doc.id || doc.path}`);
    }
  }

  lines.push('</workflow-context>');

  return lines.join('\n');
}

/**
 * 生成 PreToolUse block 决策输出
 * @param {string} reason - 阻止原因
 * @returns {object}
 */
function formatBlockDecision(reason) {
  return {
    decision: 'block',
    reason
  };
}

/**
 * 生成 PreToolUse allow 决策输出
 * @returns {object}
 */
function formatAllowDecision() {
  return {
    decision: 'allow'
  };
}

/**
 * 生成 PreToolUse ask 决策输出
 * @param {string} reason - 询问原因
 * @returns {object}
 */
function formatAskDecision(reason) {
  return {
    decision: 'ask',
    reason
  };
}

module.exports = {
  formatWorkflowContext,
  formatUserPromptContext,
  formatBlockDecision,
  formatAllowDecision,
  formatAskDecision
};
