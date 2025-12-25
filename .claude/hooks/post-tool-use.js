#!/usr/bin/env node

/**
 * PostToolUse Hook - 工具执行成功后的文档验证
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
 */

const { execSync } = require('child_process');
const path = require('path');

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

      // 只处理成功的 Write/Edit 操作
      if (!tool_response?.success) {
        process.exit(0);
      }

      // 获取文件路径
      const filePath = tool_input?.file_path || tool_input?.path;
      if (!filePath) {
        process.exit(0);
      }

      // 检查是否需要验证
      const rule = getValidationRule(filePath);
      if (!rule) {
        process.exit(0);
      }

      // 执行验证
      const result = runValidation(rule, filePath);

      if (result.success) {
        // 验证通过，输出简短消息
        console.log(`[Validation] ${result.message}`);
      } else {
        // 验证失败，输出详细信息到 stderr，简短消息到 stdout
        console.error(`[Validation Warning] ${result.message}`);
        console.log(`[Validation] ${rule.description}: Issues found, see above for details.`);
      }

      process.exit(0);

    } catch (err) {
      console.error(`[SoloDevFlow] PostToolUse hook error: ${err.message}`);
      process.exit(1);
    }
  });
}

main();
