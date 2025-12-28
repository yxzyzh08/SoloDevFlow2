#!/usr/bin/env node

/**
 * SessionStart Hook - 会话启动时注入项目上下文
 *
 * Based on design: des-hooks-integration.md §4.1
 *
 * Input (stdin JSON):
 *   { session_id, cwd, hook_event_name: 'SessionStart', source: 'startup'|'resume'|'clear' }
 *
 * Output (stdout):
 *   <workflow-context>...</workflow-context>
 *
 * Exit codes:
 *   0 - Success, stdout injected as context
 *   2 - Block session start, stderr shown
 */

const { readState, getActiveFeature, getProject, getSubtasks, getPendingDocs } = require('./lib/state-reader');
const { formatWorkflowContext } = require('./lib/output');

function main() {
  let input = '';

  process.stdin.setEncoding('utf-8');

  process.stdin.on('data', (chunk) => {
    input += chunk;
  });

  process.stdin.on('end', () => {
    try {
      // Parse input (not strictly required for SessionStart, but good practice)
      // const event = JSON.parse(input);

      // Read state
      const result = readState();

      if (result.error === 'STATE_NOT_FOUND') {
        // Graceful degradation: hint user to initialize
        console.error('[SoloDevFlow] state.json not found. Run: solodevflow init');
        // Continue with minimal context
        console.log('<workflow-context>');
        console.log('Project: (not initialized)');
        console.log('Run "solodevflow init" to set up the project.');
        console.log('</workflow-context>');
        process.exit(0);
      }

      if (result.error === 'STATE_PARSE_ERROR') {
        // Block startup on parse error
        console.error(`[SoloDevFlow] Failed to parse state.json: ${result.message}`);
        process.exit(2);
      }

      const state = result.data;
      const project = getProject(state);
      const activeFeature = getActiveFeature(state);
      const subtasks = getSubtasks(state);
      const pendingDocs = getPendingDocs(state);

      // Generate context
      const context = formatWorkflowContext({
        projectName: project.name,
        activeFeature,
        subtasks,
        pendingDocs
      });

      console.log(context);
      process.exit(0);

    } catch (err) {
      console.error(`[SoloDevFlow] Hook error: ${err.message}`);
      process.exit(1);
    }
  });
}

main();
