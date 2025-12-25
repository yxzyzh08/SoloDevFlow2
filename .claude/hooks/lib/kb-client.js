/**
 * Knowledge Base Client - 调用知识库 CLI，查询相关文档
 *
 * Based on design: des-hooks-integration.md §3.5
 */

const { execFileSync } = require('child_process');
const path = require('path');

const KB_CLI = path.join(process.cwd(), 'src', 'cli', 'knowledge-base.js');

/**
 * 按关键词搜索文档
 * @param {string[]} keywords - 关键词数组
 * @returns {Array} 匹配的文档列表
 */
function searchByKeywords(keywords) {
  if (!keywords || keywords.length === 0) {
    return [];
  }

  try {
    // 使用 execFileSync 避免命令注入风险
    const result = execFileSync('node', [KB_CLI, 'search', ...keywords, '--json'], {
      encoding: 'utf-8',
      timeout: 2000,
      cwd: process.cwd()
    });
    return JSON.parse(result);
  } catch (err) {
    // Graceful degradation - 知识库不可用时返回空数组
    return [];
  }
}

/**
 * 获取 Hook 上下文（产品概览、Feature 列表等）
 * @returns {object|null}
 */
function getHookContext() {
  try {
    const result = execFileSync('node', [KB_CLI, 'hook-context', '--json'], {
      encoding: 'utf-8',
      timeout: 2000,
      cwd: process.cwd()
    });
    return JSON.parse(result);
  } catch (err) {
    // Graceful degradation
    return null;
  }
}

/**
 * 获取产品概览
 * @returns {object|null}
 */
function getProductOverview() {
  try {
    const result = execFileSync('node', [KB_CLI, 'overview', '--json'], {
      encoding: 'utf-8',
      timeout: 2000,
      cwd: process.cwd()
    });
    return JSON.parse(result);
  } catch (err) {
    return null;
  }
}

module.exports = {
  searchByKeywords,
  getHookContext,
  getProductOverview
};
