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
 * @param {number} options.pendingSparks - 待处理 Sparks 数量
 * @param {object} options.session - Session 状态
 * @returns {string}
 */
function formatWorkflowContext(options) {
  const {
    projectName = 'Unknown',
    activeFeature,
    pendingSparks = 0,
    session
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

  lines.push(`Pending Sparks: ${pendingSparks}`);

  if (session) {
    lines.push(`Session Mode: ${session.mode || 'idle'}`);
    const pendingCount = session.pendingRequirements?.length || 0;
    if (pendingCount > 0) {
      lines.push(`Pending Requirements: ${pendingCount}`);
    }
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
 * @param {object} options.session - Session 状态
 * @returns {string}
 */
function formatUserPromptContext(options) {
  const {
    productName = 'Unknown',
    activeFeature,
    relevantDocs = [],
    session
  } = options;

  const lines = [
    '<workflow-context>'
  ];

  lines.push(`Product: ${productName}`);

  if (activeFeature) {
    lines.push(`Current Feature: ${activeFeature.id} (${activeFeature.phase || 'unknown'})`);
  }

  if (session) {
    lines.push(`Session: ${session.mode || 'idle'}`);
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
