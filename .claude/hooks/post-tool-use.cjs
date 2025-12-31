#!/usr/bin/env node

/**
 * PostToolUse Hook - 工具执行成功后的文档验证 + TodoWrite 同步
 *
 * Based on design: des-hooks-integration.md §4.4
 *
 * Input (stdin JSON):
 *   { session_id, cwd, hook_event_name: 'PostToolUse', tool_name, tool_input, tool_response }
 *
 * Output (stdout):
 *   Validation result message (plain text, injected as context)
 *
 * Exit codes:
 *   0 - Success (validation passed or skipped)
 *   1 - Hook error (use default behavior)
 *
 * Note: Validation failures are logged to stderr but don't block the tool execution
 *
 * TodoWrite Sync (v6.6):
 *   When AI uses TodoWrite, automatically sync to state.json subtasks
 *   - Direction: TodoWrite → subtasks (one-way)
 *   - Conflict: Append only, never delete existing subtasks
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { toBeijingISOString } = require('./lib/datetime.cjs');

const STATE_FILE = path.join(process.cwd(), '.solodevflow', 'state.json');
const INDEX_FILE = path.join(process.cwd(), '.solodevflow', 'index.json');

// =============================================================================
// Impact Analysis Patterns (§3.4 C4)
// =============================================================================

/**
 * 触发影响分析的文件模式
 */
const IMPACT_ANALYSIS_PATTERNS = [
  'docs/specs/*.md',           // 规范文档
  'docs/requirements/prd.md',  // PRD 文档
  'template/**/*.md'           // 文档模板
];

// =============================================================================
// Validation Rules (§4.4.1)
// =============================================================================

/**
 * 验证规则配置
 */
const VALIDATION_RULES = [
  {
    patterns: ['docs/requirements/*.md', 'docs/requirements/**/*.md'],
    command: 'npm run validate:docs',
    description: 'Validating requirements document'
  },
  {
    patterns: ['docs/specs/*.md', 'docs/specs/**/*.md'],
    command: 'npm run validate:docs',
    description: 'Validating spec document'
  },
  {
    patterns: ['.solodevflow/*.json', '.solodevflow/**/*.json'],
    command: 'npm run validate:state',
    description: 'Validating state file'
  }
];

// =============================================================================
// Pattern Matching
// =============================================================================

/**
 * 简单的 glob 模式匹配
 */
function matchGlob(pattern, filePath) {
  const normalizedPath = filePath.replace(/\\/g, '/');
  const normalizedPattern = pattern.replace(/\\/g, '/');

  let regex = normalizedPattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '{{DOUBLE_STAR}}')
    .replace(/\*/g, '[^/]*')
    .replace(/\?/g, '.')
    .replace(/\{\{DOUBLE_STAR\}\}/g, '.*');

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
// Impact Analysis Logic (§3.4 C4)
// =============================================================================

/**
 * 检查文件是否触发影响分析
 */
function shouldTriggerImpactAnalysis(filePath) {
  if (!filePath) return false;
  return matchesAny(IMPACT_ANALYSIS_PATTERNS, filePath);
}

/**
 * 运行影响分析脚本
 * 返回分析结果作为 additionalContext
 */
function runImpactAnalysis(filePath) {
  try {
    const scriptPath = path.join(process.cwd(), 'scripts', 'analyze-impact.js');
    if (!fs.existsSync(scriptPath)) {
      console.error('[Impact] analyze-impact.js not found');
      return null;
    }

    const result = execSync(`node "${scriptPath}" "${filePath}"`, {
      encoding: 'utf-8',
      timeout: 30000,
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe']
    });

    return result.trim();
  } catch (err) {
    console.error(`[Impact] Analysis failed: ${err.message}`);
    return null;
  }
}

// =============================================================================
// Validation Logic
// =============================================================================

/**
 * 获取适用的验证规则
 */
function getValidationRule(filePath) {
  if (!filePath) return null;

  for (const rule of VALIDATION_RULES) {
    if (matchesAny(rule.patterns, filePath)) {
      return rule;
    }
  }
  return null;
}

/**
 * 执行验证命令
 */
function runValidation(rule, filePath) {
  try {
    execSync(rule.command, {
      encoding: 'utf-8',
      timeout: 30000, // 30秒超时
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe']
    });

    return {
      success: true,
      message: `${rule.description}: PASSED`
    };
  } catch (err) {
    // 验证失败，但不阻止工具执行
    const stderr = err.stderr || err.message;
    return {
      success: false,
      message: `${rule.description}: FAILED\n${stderr}`
    };
  }
}

// =============================================================================
// TodoWrite Sync Logic (v6.6)
// =============================================================================

/**
 * 获取当前活跃的 Work Item ID
 * 返回 'unknown' 如果没有活跃的 Work Item（后续会警告）
 * v14.0: Work Item = Feature/Capability/Flow
 */
function getActiveWorkItemId() {
  try {
    if (!fs.existsSync(STATE_FILE)) return 'unknown';
    const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
    const activeId = state?.flow?.activeWorkItems?.[0];
    return activeId || 'unassigned';
  } catch (e) {
    return 'unknown';
  }
}

/**
 * 同步 TodoWrite 到 subtasks
 * - 只追加，不删除
 * - 通过 description 匹配判断是否已存在
 * - 如果没有 activeWorkItem，输出警告但继续同步（使用 'unassigned'）
 * v14.0: Uses workitemId instead of featureId
 */
function syncTodoWriteToSubtasks(todos) {
  if (!fs.existsSync(STATE_FILE)) {
    console.error('[TodoSync] state.json not found, skipping sync');
    return { synced: 0 };
  }

  try {
    const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
    if (!state.subtasks) state.subtasks = [];

    const workitemId = getActiveWorkItemId();

    // 警告：没有活跃的 Work Item
    if (workitemId === 'unassigned' || workitemId === 'unknown') {
      console.error('[TodoSync] Warning: No active work item. Subtasks will be marked as "unassigned". Activate a work item first with: node scripts/state.cjs activate <id>');
    }
    let addedCount = 0;
    let updatedCount = 0;

    for (const todo of todos) {
      const description = todo.content || todo.description || '';
      if (!description) continue;

      // 查找是否已存在（通过 description 匹配）
      const existing = state.subtasks.find(s =>
        s.description === description && s.source === 'ai'
      );

      if (existing) {
        // 更新 status（如果变化）
        const newStatus = mapTodoStatus(todo.status);
        if (existing.status !== newStatus && newStatus !== 'completed') {
          existing.status = newStatus;
          existing.updatedAt = toBeijingISOString();
          updatedCount++;
        }
        // 如果 todo 是 completed，标记 subtask 为 completed
        if (todo.status === 'completed' && existing.status !== 'completed') {
          existing.status = 'completed';
          existing.completedAt = toBeijingISOString();
          updatedCount++;
        }
      } else {
        // 添加新 subtask (v14.0: uses workitemId)
        const id = `st_${Date.now()}_${String(state.subtasks.length + 1).padStart(3, '0')}`;
        state.subtasks.push({
          id,
          workitemId,
          description,
          status: mapTodoStatus(todo.status),
          source: 'ai',
          createdAt: toBeijingISOString()
        });
        addedCount++;
      }
    }

    // 保存 state
    if (addedCount > 0 || updatedCount > 0) {
      state.lastUpdated = toBeijingISOString();
      state.metadata.stateFileVersion = (state.metadata.stateFileVersion || 0) + 1;
      fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    }

    return { added: addedCount, updated: updatedCount };
  } catch (e) {
    console.error(`[TodoSync] Error: ${e.message}`);
    return { error: e.message };
  }
}

/**
 * 映射 TodoWrite status 到 subtask status
 */
function mapTodoStatus(todoStatus) {
  const mapping = {
    'pending': 'pending',
    'in_progress': 'in_progress',
    'completed': 'completed'
  };
  return mapping[todoStatus] || 'pending';
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
      const { tool_name, tool_input, tool_response } = event;

      // 处理 TodoWrite 同步
      if (tool_name === 'TodoWrite') {
        const todos = tool_input?.todos || [];
        if (todos.length > 0) {
          const result = syncTodoWriteToSubtasks(todos);
          if (result.added > 0 || result.updated > 0) {
            console.log(`[TodoSync] Synced: ${result.added} added, ${result.updated} updated`);
          }
        }
        process.exit(0);
      }

      // 只处理成功的 Write/Edit 操作
      if (!tool_response?.success) {
        process.exit(0);
      }

      // 获取文件路径
      const filePath = tool_input?.file_path || tool_input?.path;
      if (!filePath) {
        process.exit(0);
      }

      // 只处理 Write/Edit 工具
      if (tool_name !== 'Write' && tool_name !== 'Edit') {
        process.exit(0);
      }

      // 检查是否需要验证
      const rule = getValidationRule(filePath);
      let validationOutput = '';

      if (rule) {
        // 执行验证
        const result = runValidation(rule, filePath);

        if (result.success) {
          validationOutput = `[Validation] ${result.message}`;
        } else {
          console.error(`[Validation Warning] ${result.message}`);
          validationOutput = `[Validation] ${rule.description}: Issues found, see above for details.`;
        }
      }

      // 检查是否需要运行影响分析 (§3.4 C4)
      let impactOutput = '';

      if (shouldTriggerImpactAnalysis(filePath)) {
        const analysis = runImpactAnalysis(filePath);
        if (analysis) {
          impactOutput = `\n\n[Impact Analysis]\n${analysis}`;
        }
      }

      // 输出结果
      if (validationOutput || impactOutput) {
        console.log(validationOutput + impactOutput);
      }

      process.exit(0);

    } catch (err) {
      console.error(`[SoloDevFlow] PostToolUse hook error: ${err.message}`);
      process.exit(1);
    }
  });
}

main();
