#!/usr/bin/env node

/**
 * UserPromptSubmit Hook - 用户提交输入时注入上下文
 *
 * Based on design: des-hooks-integration.md §4.2
 * v6.8: 新增需求变更检测，提醒 AI 走正确流程
 * v14.0: Updated to use activeWorkItems terminology
 * v14.1: H8 意图检测 - 检测结构性变更意图，提示走需求流程
 *
 * Input (stdin JSON):
 *   { session_id, cwd, hook_event_name: 'UserPromptSubmit', prompt }
 *
 * Output (stdout JSON):
 *   { hookSpecificOutput: { hookEventName: 'UserPromptSubmit', additionalContext: string } }
 *
 * Context Fields:
 *   - productName: state.json.project.name
 *   - activeWorkItem: state.json.flow.activeWorkItems[0] (Feature/Capability/Flow)
 */

const { readState, getActiveFeature, getProject, getSubtasks, getPendingDocs } = require('./lib/state-reader.cjs');
const { formatUserPromptContext } = require('./lib/output.cjs');

// =============================================================================
// Requirement Change Detection (v6.8)
// =============================================================================

/**
 * 需求变更信号词
 */
const REQUIREMENT_CHANGE_SIGNALS = {
  // 新增需求信号
  newFeature: ['新增', '添加', '实现', '开发', '做一个', '加一个', '想要', '需要', '希望'],
  // 变更信号
  change: ['修改', '改成', '调整', '优化', '重构', '更新', '变更', '改为'],
  // 功能词
  feature: ['功能', '特性', 'feature', '需求', '能力']
};

/**
 * 检测用户输入是否可能是需求变更
 */
function detectRequirementChange(prompt) {
  if (!prompt) return null;

  const lowerPrompt = prompt.toLowerCase();

  // 检测新增需求
  const hasNewSignal = REQUIREMENT_CHANGE_SIGNALS.newFeature.some(s => prompt.includes(s));
  const hasChangeSignal = REQUIREMENT_CHANGE_SIGNALS.change.some(s => prompt.includes(s));
  const hasFeatureWord = REQUIREMENT_CHANGE_SIGNALS.feature.some(s => lowerPrompt.includes(s));

  if (hasNewSignal && hasFeatureWord) {
    return 'new_requirement';
  }
  if (hasChangeSignal) {
    return 'requirement_change';
  }

  return null;
}

/**
 * 生成需求变更提醒
 */
function generateRequirementReminder(type, activeFeature) {
  const featureId = activeFeature?.id || '<feature-id>';
  const phase = activeFeature?.phase || 'unknown';

  // 如果已经在 requirements 阶段，不需要提醒
  if (phase === 'feature_requirements') {
    return null;
  }

  if (type === 'new_requirement') {
    return `
[Input Analysis Reminder]
检测到可能的【新增需求】请求。
请先执行 Input Analysis (参考 .solodevflow/flows/workflows.md §2)：
1. 确认是否为新增需求
2. 如是，走需求流程：GATHER → CLARIFY → IMPACT → GENERATE
3. 生成需求文档后：set-phase ${featureId} feature_review
4. 等待人类审核批准`;
  }

  if (type === 'requirement_change') {
    return `
[Input Analysis Reminder]
检测到可能的【需求变更】请求。
请先执行 Input Analysis (参考 .solodevflow/flows/workflows.md §2)：
1. 确认是否为需求变更（修改现有功能）
2. 如是，先设置阶段：set-phase ${featureId} feature_requirements
3. 更新需求文档
4. 完成后：set-phase ${featureId} feature_review
5. 等待人类审核批准后才能写代码`;
  }

  return null;
}

// =============================================================================
// H8: Structural Change Intent Detection (v14.1)
// Based on: fea-hooks-integration.md §3.7
// =============================================================================

/**
 * 结构性变更意图关键词
 * 检测用户输入中是否包含结构性变更意图
 */
const STRUCTURAL_CHANGE_INTENTS = [
  {
    keywords: ['删除', '移除', 'remove', 'delete'],
    type: '删除功能',
    examples: '删除 byType、移除这个字段'
  },
  {
    keywords: ['添加', '新增', 'add', 'create'],
    type: '新增功能',
    examples: '添加新命令、新增验证规则'
  },
  {
    keywords: ['修改接口', '改 API', '改API', 'change interface', '变更接口'],
    type: '接口变更',
    examples: '修改返回格式、变更 API 参数'
  },
  {
    keywords: ['重构', 'refactor'],
    type: '结构重构',
    examples: '重构状态管理、重构架构'
  }
];

/**
 * 检测结构性变更意图
 * @param {string} prompt - 用户输入
 * @returns {{ detected: boolean, type?: string, examples?: string }}
 */
function detectStructuralChangeIntent(prompt) {
  if (!prompt) return { detected: false };

  const lowerPrompt = prompt.toLowerCase();

  for (const intent of STRUCTURAL_CHANGE_INTENTS) {
    for (const keyword of intent.keywords) {
      if (prompt.includes(keyword) || lowerPrompt.includes(keyword.toLowerCase())) {
        return {
          detected: true,
          type: intent.type,
          examples: intent.examples
        };
      }
    }
  }

  return { detected: false };
}

/**
 * 生成结构性变更提醒 (H8)
 * 只在非需求阶段触发
 */
function generateStructuralChangeReminder(intent, activeFeature) {
  if (!intent.detected) return null;

  const phase = activeFeature?.phase;
  const status = activeFeature?.status;
  const featureId = activeFeature?.id || '<work-item-id>';

  // 如果已在需求阶段或审核阶段，不提示（已在流程中）
  if (phase === 'feature_requirements' || phase === 'feature_review') {
    return null;
  }

  return `
[Input Analysis Reminder]
检测到可能的【${intent.type}】请求。
请先执行 Input Analysis (参考 .solodevflow/flows/workflows.md §2)：
1. 确认是否为需求变更（修改现有功能）
2. 如是，先设置阶段：set-phase ${featureId} feature_requirements
3. 更新需求文档
4. 完成后：set-phase ${featureId} feature_review
5. 等待人类审核批准后才能写代码`;
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
      const { prompt } = event;

      // 1. Read state (graceful degradation)
      const stateResult = readState();
      const state = stateResult.data || {};

      const project = getProject(state);
      const activeFeature = getActiveFeature(state);
      const subtasks = getSubtasks(state);
      const pendingDocs = getPendingDocs(state);

      // 2. Detect requirement change (v6.8)
      const requirementType = detectRequirementChange(prompt);
      const requirementReminder = requirementType
        ? generateRequirementReminder(requirementType, activeFeature)
        : null;

      // 3. Detect structural change intent (H8 v14.1)
      const structuralIntent = detectStructuralChangeIntent(prompt);
      const structuralReminder = generateStructuralChangeReminder(structuralIntent, activeFeature);

      // 4. Format context
      let context = formatUserPromptContext({
        productName: project.name,
        activeFeature,
        relevantDocs: [],
        subtasks,
        pendingDocs
      });

      // 5. Append reminders if detected (H8 takes priority over v6.8)
      if (structuralReminder) {
        context += '\n' + structuralReminder;
      } else if (requirementReminder) {
        context += '\n' + requirementReminder;
      }

      // 6. Output in required format
      const output = {
        hookSpecificOutput: {
          hookEventName: 'UserPromptSubmit',
          additionalContext: context
        }
      };

      console.log(JSON.stringify(output));
      process.exit(0);

    } catch (err) {
      // Error handling: log to stderr, exit with error code
      console.error(`[SoloDevFlow] UserPromptSubmit hook error: ${err.message}`);
      process.exit(1);
    }
  });
}

main();
