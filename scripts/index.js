#!/usr/bin/env node
/**
 * 文档索引生成器
 * 扫描 docs/ 目录，提取 frontmatter，生成 index.json
 *
 * 用法: node scripts/index.js
 * 输出: .solodevflow/index.json
 */

const fs = require('fs');
const path = require('path');
const { toBeijingISOString } = require('./lib/datetime');

const PROJECT_ROOT = process.cwd();
const DOCS_DIR = path.join(PROJECT_ROOT, 'docs');
const OUTPUT_FILE = path.join(PROJECT_ROOT, '.solodevflow', 'index.json');
const STATE_FILE = path.join(PROJECT_ROOT, '.solodevflow', 'state.json');

// 解析 frontmatter
function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;

  const frontmatter = {};
  const lines = match[1].split(/\r?\n/);
  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      let value = line.slice(colonIndex + 1).trim().replace(/\r$/, '');
      // 去除引号
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      frontmatter[key] = value;
    }
  }
  return frontmatter;
}

// 解析依赖表格
function parseDependencies(content) {
  const dependencies = [];

  // 查找 Dependencies 章节（支持多种格式）
  // 格式1: ## Dependencies 或 ### Dependencies
  // 格式2: ## N. Dependencies 或 ### N.N Dependencies
  const depSectionMatch = content.match(/#{2,4}\s+(?:\d+\.?\d*\s+)?(?:.*\s)?Dependencies[^\n]*\n([\s\S]*?)(?=\n#{2,4}\s|$)/i);
  if (!depSectionMatch) return dependencies;

  const section = depSectionMatch[1];

  // 匹配表格行：| dependency-id | hard/soft | description |
  const tableRowRegex = /\|\s*([a-z][a-z0-9_-]+)\s*\|\s*(hard|soft)\s*\|/gi;
  let match;

  while ((match = tableRowRegex.exec(section)) !== null) {
    const depId = match[1].toLowerCase();
    const depType = match[2].toLowerCase();

    // 排除表头
    if (depId !== 'dependency' && depId !== 'type') {
      dependencies.push({
        id: depId,
        type: depType
      });
    }
  }

  return dependencies;
}

// 提取文档标题
function extractTitle(content) {
  const match = content.match(/^#\s+(.+?)(?:\s*<!--.*-->)?$/m);
  return match ? match[1].replace(/^(Feature|Capability|Flow):\s*/, '') : null;
}

// 扫描目录
function scanDocs(dir, basePath = '') {
  const docs = [];

  if (!fs.existsSync(dir)) return docs;

  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const relativePath = path.join(basePath, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      docs.push(...scanDocs(fullPath, relativePath));
    } else if (item.endsWith('.md')) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const frontmatter = parseFrontmatter(content);

      if (frontmatter && frontmatter.type) {
        const dependencies = parseDependencies(content);
        const doc = {
          id: frontmatter.id || path.basename(item, '.md'),
          type: frontmatter.type,
          title: extractTitle(content),
          workMode: frontmatter.workMode || null,
          status: frontmatter.status || 'not_started',
          phase: frontmatter.phase || null,
          priority: frontmatter.priority || null,
          domain: frontmatter.domain || null,
          path: 'docs/' + relativePath.replace(/\\/g, '/')
        };

        // 只有有依赖时才添加 dependencies 字段
        if (dependencies.length > 0) {
          doc.dependencies = dependencies;
        }

        docs.push(doc);
      }
    }
  }

  return docs;
}

// 清理已完成的 subtasks
function cleanupSubtasks() {
  if (!fs.existsSync(STATE_FILE)) return { cleaned: 0 };

  try {
    const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
    if (!state.subtasks || state.subtasks.length === 0) return { cleaned: 0 };

    const before = state.subtasks.length;
    // 保留 pending 和 in_progress，清理 completed 和 skipped
    state.subtasks = state.subtasks.filter(s =>
      s.status === 'pending' || s.status === 'in_progress'
    );
    const cleaned = before - state.subtasks.length;

    if (cleaned > 0) {
      state.lastUpdated = toBeijingISOString();
      state.metadata.stateFileVersion = (state.metadata.stateFileVersion || 0) + 1;
      fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    }

    return { cleaned };
  } catch (e) {
    console.error('清理 subtasks 失败:', e.message);
    return { cleaned: 0, error: e.message };
  }
}

// 主函数
function main() {
  // 清理已完成的 subtasks
  const cleanupResult = cleanupSubtasks();

  const docs = scanDocs(DOCS_DIR);

  // 按状态分类统计
  const summary = {
    total: docs.length,
    done: docs.filter(d => d.status === 'done').length,
    in_progress: docs.filter(d => d.status === 'in_progress').length,
    not_started: docs.filter(d => d.status === 'not_started').length
  };

  // 找出当前聚焦的 work item（status = in_progress）
  // Note: This is for display purposes; actual activeWorkItems is in state.json
  const activeWorkItems = docs
    .filter(d => (d.type === 'feature' || d.type === 'capability' || d.type === 'flow') && d.status === 'in_progress')
    .map(d => d.id);

  const index = {
    generated: toBeijingISOString(),
    summary,
    activeWorkItems,
    documents: docs
  };

  // 确保输出目录存在
  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(index, null, 2));

  // 输出状态报告
  console.log('=== 文档索引生成完成 ===');
  console.log(`总计: ${summary.total} 个文档`);
  console.log(`  完成: ${summary.done}`);
  console.log(`  进行中: ${summary.in_progress}`);
  console.log(`  未开始: ${summary.not_started}`);
  console.log(`\n当前聚焦: ${activeWorkItems.length > 0 ? activeWorkItems.join(', ') : '无'}`);
  if (cleanupResult.cleaned > 0) {
    console.log(`\n已清理 ${cleanupResult.cleaned} 个已完成 subtasks`);
  }
  console.log(`\n输出: ${OUTPUT_FILE}`);
}

main();
