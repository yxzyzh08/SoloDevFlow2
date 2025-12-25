#!/usr/bin/env node

/**
 * UserPromptSubmit Hook - 用户提交输入时注入上下文
 *
 * Based on design: des-hooks-integration.md §4.2
 *
 * Input (stdin JSON):
 *   { session_id, cwd, hook_event_name: 'UserPromptSubmit', prompt }
 *
 * Output (stdout JSON):
 *   { hookSpecificOutput: { hookEventName: 'UserPromptSubmit', additionalContext: string } }
 *
 * Context Fields (~200 tokens):
 *   - productName: state.json.project.name
 *   - activeFeature: state.json.flow.activeFeatures[0]
 *   - relevantDocs: knowledge-base search results
 *   - sessionMode: state.json.session.mode
 *   - pendingCount: state.json.session.pendingRequirements.length
 */

const { readState, getActiveFeature, getProject, getSession } = require('./lib/state-reader');
const { searchByKeywords } = require('./lib/kb-client');
const { formatUserPromptContext } = require('./lib/output');

// =============================================================================
// Keyword Extraction (MVP: simple space tokenization)
// =============================================================================

/**
 * 停用词表（中英文常见词）
 */
const STOP_WORDS = new Set([
  // 中文
  '的', '是', '在', '了', '和', '与', '或', '不', '也', '就', '都', '而', '及',
  '着', '把', '被', '让', '给', '对', '向', '从', '到', '为', '以', '用', '于',
  '这', '那', '它', '他', '她', '我', '你', '我们', '你们', '他们', '什么', '怎么',
  '如何', '哪个', '哪些', '为什么', '请', '帮', '帮我', '帮忙', '需要', '想', '要',
  '可以', '能', '能否', '是否', '有没有', '一个', '一下', '一些',
  // 英文
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
  'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought', 'used',
  'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into',
  'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under',
  'and', 'but', 'or', 'nor', 'so', 'yet', 'both', 'either', 'neither',
  'not', 'only', 'own', 'same', 'than', 'too', 'very', 'just', 'also',
  'this', 'that', 'these', 'those', 'it', 'its', 'i', 'me', 'my', 'we', 'our',
  'you', 'your', 'he', 'him', 'his', 'she', 'her', 'they', 'them', 'their',
  'what', 'which', 'who', 'whom', 'how', 'when', 'where', 'why',
  'please', 'help', 'want', 'like', 'let', 'make'
]);

/**
 * 从用户输入提取关键词
 * @param {string} prompt - 用户输入
 * @returns {string[]} 关键词数组（最多5个）
 */
function extractKeywords(prompt) {
  if (!prompt || typeof prompt !== 'string') {
    return [];
  }

  // 1. 分词：按空格、标点符号分割
  //    对于中文，也按常见虚词分割
  const tokens = prompt
    .split(/[\s,，.。!！?？:：;；\n\r\t的是在了和与或不也就都而及着把被让给对向从到为以用于这那它他她我你]+/)
    .map(t => t.trim().toLowerCase())
    .filter(t => t.length >= 2);

  // 2. 过滤停用词
  const keywords = tokens.filter(t => !STOP_WORDS.has(t));

  // 3. 去重
  const unique = [...new Set(keywords)];

  // 4. 返回前5个
  return unique.slice(0, 5);
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
      const session = getSession(state);

      // 2. Extract keywords and search knowledge base
      const keywords = extractKeywords(prompt);
      const relevantDocs = keywords.length > 0 ? searchByKeywords(keywords) : [];

      // 3. Format context
      const context = formatUserPromptContext({
        productName: project.name,
        activeFeature,
        relevantDocs: relevantDocs.slice(0, 3), // 最多3个相关文档
        session
      });

      // 4. Output in required format
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
