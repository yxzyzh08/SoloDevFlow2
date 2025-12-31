/**
 * Output - 输出格式化，生成 <workflow-context>
 *
 * Based on design: des-hooks-integration.md §3.3
 * Updated for v14.0.0: Renamed activeFeature to activeWorkItem in output
 *
 * Note: "Work Item" is the unified term for Feature/Capability/Flow
 */

/**
 * 生成 workflow-context 标签
 * @param {object} options
 * @param {string} options.projectName - 项目名称
 * @param {object} options.activeFeature - 当前活跃 Work Item (Feature/Capability/Flow)
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
    lines.push(`Active Work Item: ${activeFeature.id} (${activeFeature.status || 'unknown'})`);
  } else {
    lines.push('Active Work Item: (none)');
  }

  // 注入 in_progress 任务（当前正在进行的工作）
  const inProgressTasks = subtasks.filter(s => s.status === 'in_progress');
  if (inProgressTasks.length > 0) {
    lines.push(`In-Progress Tasks: ${inProgressTasks.length}`);
    for (const task of inProgressTasks) {
      lines.push(`  - [${task.workitemId}] ${task.description.substring(0, 60)}${task.description.length > 60 ? '...' : ''}`);
    }
  }

  // 注入 pending subtasks（详细列出，便于跨 Session 追踪）
  const pendingSubtasks = subtasks.filter(s => s.status === 'pending');
  if (pendingSubtasks.length > 0) {
    lines.push(`Pending Subtasks: ${pendingSubtasks.length}`);
    for (const task of pendingSubtasks) {
      lines.push(`  - [${task.workitemId}] ${task.description.substring(0, 60)}${task.description.length > 60 ? '...' : ''}`);
    }
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
 * @param {object} options.activeFeature - 当前活跃 Work Item (Feature/Capability/Flow)
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
    lines.push(`Current Work Item: ${activeFeature.id} (${activeFeature.status || 'unknown'})`);
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

/**
 * 生成重构模式上下文
 * @param {object} refactoring - 重构状态对象
 * @returns {string}
 */
function formatRefactoringContext(refactoring) {
  if (!refactoring?.enabled) {
    return '';
  }

  const phaseLabels = {
    understand: 'UNDERSTAND (理解系统)',
    prd: 'PRD (编写产品文档)',
    requirements: 'REQUIREMENTS (需求分解)',
    design: 'DESIGN (设计补全)',
    validate: 'VALIDATE (验证完成)',
    completed: 'COMPLETED (重构完成)'
  };

  const lines = [
    '<refactoring-context>',
    'Mode: Refactoring',
    `Phase: ${phaseLabels[refactoring.phase] || refactoring.phase}`
  ];

  // 进度信息
  const progress = refactoring.progress;
  const progressLines = [];

  if (progress.prd !== 'not_started') {
    progressLines.push(`PRD: ${progress.prd}`);
  }
  if (progress.features.total > 0) {
    progressLines.push(`Features: ${progress.features.done}/${progress.features.total}`);
  }
  if (progress.capabilities.total > 0) {
    progressLines.push(`Capabilities: ${progress.capabilities.done}/${progress.capabilities.total}`);
  }
  if (progress.flows.total > 0) {
    progressLines.push(`Flows: ${progress.flows.done}/${progress.flows.total}`);
  }
  if (progress.designs.total > 0) {
    const designStatus = progress.designs.skipped
      ? 'skipped'
      : `${progress.designs.done}/${progress.designs.total}`;
    progressLines.push(`Designs: ${designStatus}`);
  }

  if (progressLines.length > 0) {
    lines.push(`Progress: ${progressLines.join(', ')}`);
  }

  lines.push(`Started: ${refactoring.startedAt}`);
  lines.push('</refactoring-context>');

  return lines.join('\n');
}

module.exports = {
  formatWorkflowContext,
  formatUserPromptContext,
  formatRefactoringContext,
  formatBlockDecision,
  formatAllowDecision,
  formatAskDecision
};
