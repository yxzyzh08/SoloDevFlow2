#!/usr/bin/env node

/**
 * PreToolUse Hook - 工具调用前的阶段守卫和文件保护
 *
 * Based on design: des-hooks-integration.md §4.3
 *
 * Input (stdin JSON):
 *   { session_id, cwd, hook_event_name: 'PreToolUse', tool_name, tool_input, tool_use_id }
 *
 * Output (stdout JSON):
 *   { decision: 'allow'|'block'|'ask', reason?: string }
 *
 * Exit codes:
 *   0 - Success
 *   1 - Hook error (use default behavior)
 */

const path = require('path');
const { readState, getActiveFeature, getPendingSubtasksForFeature } = require('./lib/state-reader');
const { formatBlockDecision, formatAllowDecision, formatAskDecision } = require('./lib/output');

// =============================================================================
// Pattern Matching Utilities
// =============================================================================

/**
 * 简单的 glob 模式匹配
 * 支持: *, **, ?
 */
function matchGlob(pattern, filePath) {
  // Normalize path separators
  const normalizedPath = filePath.replace(/\\/g, '/');
  const normalizedPattern = pattern.replace(/\\/g, '/');

  // Convert glob to regex
  let regex = normalizedPattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')  // Escape special chars except * and ?
    .replace(/\*\*/g, '{{DOUBLE_STAR}}')    // Placeholder for **
    .replace(/\*/g, '[^/]*')                 // * matches anything except /
    .replace(/\?/g, '.')                      // ? matches single char
    .replace(/\{\{DOUBLE_STAR\}\}/g, '.*');  // ** matches anything including /

  regex = `^${regex}$`;

  return new RegExp(regex).test(normalizedPath);
}

/**
 * 检查文件路径是否匹配任一模式
 */
function matchesAny(patterns, filePath) {
  return patterns.some(p => matchGlob(p, filePath));
}

// =============================================================================
// Rule Definitions
// =============================================================================

/**
 * 阶段守卫规则 (§4.3.1)
 * v12.3: 新增 feature_review 阶段
 * v6.8: 扩展 feature_requirements 阻止 scripts/*.js
 * v6.9: 新增 done 阶段变更守卫
 */
const PHASE_GUARD_RULES = {
  pending: {
    blockedTools: ['Write', 'Edit'],
    blockedPatterns: ['**/*'],  // All files
    reason: 'Cannot write/edit files in pending phase. Start a feature first.'
  },
  // done 状态的 feature 修改代码前需要进行根因分析
  done: {
    blockedTools: ['Write', 'Edit'],
    blockedPatterns: [
      'src/**/*.js', 'src/**/*.ts',
      'scripts/**/*.js',
      '.claude/hooks/**/*.js'
    ],
    decision: 'ask',  // 软性引导，而非硬性阻止
    reason: 'Feature is done. Before modifying code, perform ROOT CAUSE ANALYSIS:\n' +
            '  • Requirements issue → Update requirements doc first\n' +
            '  • Design issue → Update design doc first\n' +
            '  • Implementation issue → Proceed with code fix directly\n' +
            'Confirm you have analyzed the root cause?'
  },
  feature_requirements: {
    blockedTools: ['Write', 'Edit'],
    blockedPatterns: [
      'src/**/*.js', 'src/**/*.ts',  // 源代码
      'scripts/**/*.js',              // 脚本（v6.8 新增）
      '.claude/hooks/**/*.js',        // Hook 脚本（v6.8 新增）
      'tests/**/*'                    // 测试
    ],
    reason: 'Cannot write code/scripts during requirements phase. Update requirements doc first, then set phase to feature_review.'
  },
  feature_review: {
    blockedTools: ['Write', 'Edit'],
    blockedPatterns: [
      'docs/designs/**/*.md',   // Cannot enter design phase
      'src/**/*.js', 'src/**/*.ts', 'src/**/*',  // Cannot enter implementation
      'scripts/**/*.js',        // Cannot modify scripts
      '.claude/hooks/**/*.js',  // Cannot modify hooks
      'tests/**/*'              // Cannot write tests
    ],
    reason: 'Awaiting human review. Get requirements approved before proceeding to design.'
  },
  feature_design: {
    blockedTools: ['Write', 'Edit'],
    blockedPatterns: ['src/**/*.js', 'src/**/*.ts', 'scripts/**/*.js', 'tests/**/*'],
    reason: 'Cannot write code/tests during design phase. Get design approved first.'
  }
};

/**
 * 保护文件规则 (§4.3.2)
 */
const PROTECTED_FILES = [
  {
    patterns: ['.solodevflow/state.json', '**/.solodevflow/state.json'],
    decision: 'block',
    reason: 'Use "node scripts/state.js" to manage state, not direct editing.'
  },
  {
    patterns: ['.env', '**/.env', '*.key', '**/*.key', '*.pem', '**/*.pem'],
    decision: 'block',
    reason: 'Security-sensitive file. Manual editing required.'
  },
  {
    patterns: ['docs/specs/*.md', 'docs/specs/**/*.md'],
    decision: 'ask',
    reason: 'Modifying spec files may impact dependent documents. Consider running impact analysis first.'
  }
];

/**
 * 自动批准规则 (§4.3.3)
 */
const AUTO_APPROVE_RULES = [
  { tool: 'Read', patterns: ['*.md', '**/*.md', '*.json', '**/*.json', '*.txt', '**/*.txt'] },
  { tool: 'Read', patterns: ['docs/**/*'] },
  { tool: 'Glob', patterns: ['*', '**/*'] },
  { tool: 'Grep', patterns: ['*', '**/*'] }
];

// =============================================================================
// Decision Logic
// =============================================================================

/**
 * 获取文件路径（从工具输入中提取）
 */
function getFilePath(toolName, toolInput) {
  if (toolName === 'Write' || toolName === 'Edit' || toolName === 'Read') {
    return toolInput?.file_path || toolInput?.path || null;
  }
  if (toolName === 'Glob') {
    return toolInput?.pattern || null;
  }
  if (toolName === 'Grep') {
    return toolInput?.path || toolInput?.pattern || null;
  }
  if (toolName === 'Bash') {
    // For Bash, we can't easily extract file paths, return null
    return null;
  }
  return null;
}

/**
 * 检查自动批准规则
 */
function checkAutoApprove(toolName, filePath) {
  if (!filePath) return false;

  for (const rule of AUTO_APPROVE_RULES) {
    if (rule.tool === toolName && matchesAny(rule.patterns, filePath)) {
      return true;
    }
  }
  return false;
}

/**
 * 检查保护文件规则
 */
function checkProtectedFiles(toolName, filePath) {
  if (!filePath) return null;
  if (toolName !== 'Write' && toolName !== 'Edit') return null;

  for (const rule of PROTECTED_FILES) {
    if (matchesAny(rule.patterns, filePath)) {
      return {
        decision: rule.decision,
        reason: rule.reason
      };
    }
  }
  return null;
}

/**
 * 检查阶段守卫规则
 * @param {string} phase - 当前阶段
 * @param {string} status - 当前状态（用于检查 done 状态）
 * @param {string} toolName - 工具名称
 * @param {string} filePath - 文件路径
 */
function checkPhaseGuard(phase, status, toolName, filePath) {
  if (!filePath) return null;

  // 优先检查 status=done（即使 phase 为空）
  const effectivePhase = (status === 'done') ? 'done' : phase;
  if (!effectivePhase) return null;

  const rule = PHASE_GUARD_RULES[effectivePhase];
  if (!rule) return null;

  if (!rule.blockedTools.includes(toolName)) return null;

  if (matchesAny(rule.blockedPatterns, filePath)) {
    // 支持 ask 或 block 决策（默认 block）
    const decision = rule.decision || 'block';
    return {
      decision,
      reason: rule.reason
    };
  }

  return null;
}

/**
 * 检查 set-phase done 命令是否有未完成的 subtasks
 * v14.0: Updated to use "Work Item" terminology
 * @returns {{ shouldWarn: boolean, workitemId?: string, pendingCount?: number, pendingTasks?: Array }}
 */
function checkSetPhaseDone(toolName, toolInput, state) {
  if (toolName !== 'Bash') return { shouldWarn: false };

  const command = toolInput?.command || '';
  // 匹配: node scripts/state.js set-phase <id> done
  // 或: state.js set-phase <id> done
  const match = command.match(/set-phase\s+(\S+)\s+done/i);
  if (!match) return { shouldWarn: false };

  const workitemId = match[1];
  const pendingTasks = getPendingSubtasksForFeature(state, workitemId);

  if (pendingTasks.length > 0) {
    return {
      shouldWarn: true,
      workitemId,
      pendingCount: pendingTasks.length,
      pendingTasks
    };
  }

  return { shouldWarn: false };
}

/**
 * 主决策逻辑
 */
function makeDecision(toolName, toolInput, state) {
  const filePath = getFilePath(toolName, toolInput);
  const activeFeature = getActiveFeature(state);
  const phase = activeFeature?.phase || 'pending';
  const status = activeFeature?.status;

  // 0. 检查 set-phase done 是否有未完成的 subtasks（警告但不阻止）
  const setPhaseCheck = checkSetPhaseDone(toolName, toolInput, state);
  if (setPhaseCheck.shouldWarn) {
    const taskList = setPhaseCheck.pendingTasks
      .map(t => `  - ${t.description}`)
      .join('\n');
    return formatAskDecision(
      `Work item "${setPhaseCheck.workitemId}" has ${setPhaseCheck.pendingCount} pending subtask(s):\n${taskList}\n\nComplete or skip these subtasks before marking the work item as done.`
    );
  }

  // 1. 检查自动批准（最高优先级）
  if (checkAutoApprove(toolName, filePath)) {
    return formatAllowDecision();
  }

  // 2. 检查保护文件
  const protectedResult = checkProtectedFiles(toolName, filePath);
  if (protectedResult) {
    if (protectedResult.decision === 'block') {
      return formatBlockDecision(protectedResult.reason);
    }
    if (protectedResult.decision === 'ask') {
      return formatAskDecision(protectedResult.reason);
    }
  }

  // 3. 检查阶段守卫（包含 done 状态检查）
  const phaseResult = checkPhaseGuard(phase, status, toolName, filePath);
  if (phaseResult) {
    // 支持 ask 或 block 决策
    if (phaseResult.decision === 'ask') {
      return formatAskDecision(phaseResult.reason);
    }
    return formatBlockDecision(phaseResult.reason);
  }

  // 4. 默认：不干预（返回空对象让 Claude Code 使用默认行为）
  return {};
}

// =============================================================================
// Main
// =============================================================================

function main() {
  let input = '';

  process.stdin.setEncoding('utf-8');

  process.stdin.on('data', (chunk) => {
    input += chunk;
  });

  process.stdin.on('end', () => {
    try {
      const event = JSON.parse(input);
      const { tool_name, tool_input } = event;

      // Read state (graceful degradation if not found)
      const stateResult = readState();
      const state = stateResult.data || {};

      // Make decision
      const decision = makeDecision(tool_name, tool_input, state);

      // Output decision (only if we have one)
      if (decision && Object.keys(decision).length > 0) {
        console.log(JSON.stringify(decision));
      }

      process.exit(0);

    } catch (err) {
      console.error(`[SoloDevFlow] PreToolUse hook error: ${err.message}`);
      process.exit(1);
    }
  });
}

main();
