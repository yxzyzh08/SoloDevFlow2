/**
 * Knowledge Base Parser - Markdown 解析器
 *
 * 基于设计文档 des-knowledge-base.md v1.1 §3.3
 */

const fs = require('fs');
const path = require('path');

// 锚点正则（匹配 <!-- id: xxx -->）
const ANCHOR_PATTERN = /<!--\s*id:\s*(\w+)\s*-->/;

// 类型前缀映射
const TYPE_PREFIX_MAP = {
  'prod_': 'prd',
  'prd_': 'prd',
  'feat_': 'feature',
  'cap_': 'capability',
  'flow_': 'flow',
  'spec_': 'spec',
  'meta_': 'spec',     // meta-spec 也是 spec 类型
  'design_': 'design',
  'des_': 'design'     // 支持 des_ 前缀
};

// Frontmatter 正则
const FRONTMATTER_PATTERN = /^---\s*\n([\s\S]*?)\n---/;

/**
 * 扫描文档目录
 */
function scanDocs(docsDir = 'docs') {
  const results = [];

  function walk(dir) {
    if (!fs.existsSync(dir)) return;

    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        walk(filePath);
      } else if (file.endsWith('.md')) {
        results.push(filePath);
      }
    }
  }

  walk(docsDir);
  return results;
}

/**
 * 解析 Frontmatter
 */
function parseFrontmatter(content) {
  const match = content.match(FRONTMATTER_PATTERN);
  if (!match) return {};

  const yamlContent = match[1];
  const result = {};

  // 简单的 YAML 解析（支持基础键值对）
  const lines = yamlContent.split('\n');
  for (const line of lines) {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      const key = line.substring(0, colonIdx).trim();
      let value = line.substring(colonIdx + 1).trim();

      // 移除引号
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      result[key] = value;
    }
  }

  return result;
}

/**
 * 从内容中提取锚点 ID
 */
function extractId(content) {
  // 从标题行提取主锚点
  const lines = content.split('\n');
  for (const line of lines) {
    if (line.startsWith('#')) {
      const match = line.match(ANCHOR_PATTERN);
      if (match) {
        return match[1];
      }
    }
  }
  return null;
}

/**
 * 从 ID 前缀检测类型
 */
function detectTypeFromId(id) {
  for (const [prefix, type] of Object.entries(TYPE_PREFIX_MAP)) {
    if (id.startsWith(prefix)) {
      return type;
    }
  }
  return null;
}

/**
 * 提取文档名称（从标题）
 */
function extractName(content) {
  const lines = content.split('\n');
  for (const line of lines) {
    if (line.startsWith('# ')) {
      // 移除锚点注释
      let name = line.replace(ANCHOR_PATTERN, '').trim();
      // 移除 # 前缀
      name = name.replace(/^#\s*/, '');
      // 移除类型前缀（如 "Feature: "）
      name = name.replace(/^(Feature|Capability|Flow|Design|Spec):\s*/i, '');
      return name.trim();
    }
  }
  return null;
}

/**
 * 提取摘要（从 > 引用或 Intent 章节）
 */
function extractSummary(content) {
  const lines = content.split('\n');

  // 方式1：从文档开头的 > 引用提取
  for (let i = 0; i < Math.min(lines.length, 20); i++) {
    const line = lines[i];
    if (line.startsWith('> ') && !line.includes('**')) {
      return line.substring(2).trim();
    }
  }

  // 方式2：从 Intent 章节的 Problem 或 Value 提取
  let inIntent = false;
  for (const line of lines) {
    if (line.includes('## 1. Intent') || line.includes('### 1.1 Problem')) {
      inIntent = true;
      continue;
    }
    if (inIntent && line.startsWith('- ')) {
      return line.substring(2).trim();
    }
    if (inIntent && line.startsWith('## 2')) {
      break;
    }
  }

  return null;
}

/**
 * 提取 Dependencies 关系
 */
function extractDependencies(content, docId) {
  const relations = [];
  const lines = content.split('\n');

  let inDependencies = false;
  let inTable = false;
  let inCodeBlock = false;

  for (const line of lines) {
    // 跳过代码块
    if (line.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;
    // 检测 Dependencies 章节（仅匹配 ## 级别的标题）
    if (line.startsWith('## ') && line.toLowerCase().includes('dependencies')) {
      inDependencies = true;
      continue;
    }

    // 离开 Dependencies 章节（遇到下一个 ## 级别标题）
    if (inDependencies && line.startsWith('## ') && !line.toLowerCase().includes('dependencies')) {
      break;
    }

    // 检测表格
    if (inDependencies && line.includes('|') && line.includes('Dependency')) {
      inTable = true;
      continue;
    }

    // 跳过表头分隔符（如 |------|------|）
    if (inTable && line.match(/^\|[-\s|:]+\|?$/)) {
      continue;
    }

    // 解析表格行
    if (inTable && line.startsWith('|')) {
      const cells = line.split('|').map(c => c.trim()).filter(c => c);
      if (cells.length >= 2) {
        const dependency = cells[0];
        const depType = cells[1].toLowerCase();

        // 转换依赖名称为 ID 格式
        let targetId = dependency.replace(/-/g, '_');
        if (!targetId.includes('_')) {
          // 尝试添加前缀
          targetId = `spec_${targetId}`;
        }

        relations.push({
          source_id: docId,
          target_id: targetId,
          type: depType === 'hard' ? 'depends' : 'extends',
          description: cells[2] || null
        });
      }
    }
  }

  return relations;
}

/**
 * 提取 Consumers 关系
 */
function extractConsumers(content, docId) {
  const relations = [];
  const lines = content.split('\n');

  let inConsumers = false;
  let inTable = false;
  let inCodeBlock = false;

  for (const line of lines) {
    // 跳过代码块
    if (line.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;
    // 检测 Consumers 章节（仅匹配 ## 级别的标题）
    if (line.startsWith('## ') && line.toLowerCase().includes('consumers')) {
      inConsumers = true;
      continue;
    }

    // 离开 Consumers 章节（遇到下一个 ## 级别标题）
    if (inConsumers && line.startsWith('## ') && !line.toLowerCase().includes('consumers')) {
      break;
    }

    // 检测表格
    if (inConsumers && line.includes('|') && line.includes('Consumer')) {
      inTable = true;
      continue;
    }

    // 跳过表头分隔符（如 |------|------|）
    if (inTable && line.match(/^\|[-\s|:]+\|?$/)) {
      continue;
    }

    // 解析表格行
    if (inTable && line.startsWith('|')) {
      const cells = line.split('|').map(c => c.trim()).filter(c => c);
      if (cells.length >= 1) {
        const consumer = cells[0];

        // Consumer → 当前文档（consumes 关系）
        relations.push({
          source_id: consumer.replace(/-/g, '_'),
          target_id: docId,
          type: 'consumes',
          description: cells[1] || null
        });
      }
    }
  }

  return relations;
}

/**
 * 提取关键词
 */
function extractKeywords(content, docId) {
  const keywords = [];
  const seen = new Set();

  function addKeyword(word, source) {
    const kw = word.toLowerCase().trim();
    if (kw.length < 2 || seen.has(kw)) return;
    // 过滤常见停用词
    const stopWords = ['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
                       'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
                       'would', 'could', 'should', 'may', 'might', 'must', 'shall',
                       'and', 'or', 'but', 'if', 'then', 'else', 'when', 'where',
                       'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more',
                       'most', 'other', 'some', 'such', 'no', 'not', 'only', 'own',
                       'same', 'so', 'than', 'too', 'very', 'just', 'also', 'now',
                       'of', 'to', 'in', 'for', 'on', 'with', 'at', 'by', 'from',
                       'as', 'into', 'through', 'during', 'before', 'after',
                       'above', 'below', 'between', 'under', 'again', 'further',
                       'id', 'type', 'version', 'table', 'field'];
    if (stopWords.includes(kw)) return;
    seen.add(kw);
    keywords.push({ doc_id: docId, keyword: kw, source });
  }

  const lines = content.split('\n');

  for (const line of lines) {
    // 1. 从标题提取 (source: title)
    if (line.startsWith('# ')) {
      const title = line.replace(ANCHOR_PATTERN, '').replace(/^#\s*/, '').trim();
      const words = title.split(/[\s:,\-_]+/);
      for (const word of words) {
        if (word.length >= 2) addKeyword(word, 'title');
      }
    }

    // 2. 从章节标题提取 (source: section)
    if (line.startsWith('## ') || line.startsWith('### ')) {
      const section = line.replace(ANCHOR_PATTERN, '').replace(/^#+\s*/, '').trim();
      // 移除数字编号
      const cleanSection = section.replace(/^\d+(\.\d+)*\.?\s*/, '');
      const words = cleanSection.split(/[\s:,\-_]+/);
      for (const word of words) {
        if (word.length >= 2) addKeyword(word, 'section');
      }
    }

    // 3. 从引用描述提取 (source: description)
    if (line.startsWith('> ')) {
      const desc = line.substring(2).trim();
      const words = desc.split(/[\s:,\-_，。、]+/);
      for (const word of words) {
        if (word.length >= 2) addKeyword(word, 'description');
      }
    }
  }

  // 4. 从 frontmatter.domain 提取
  const frontmatter = parseFrontmatter(content);
  if (frontmatter.domain) {
    addKeyword(frontmatter.domain, 'description');
  }

  return keywords;
}

/**
 * 解析单个文档
 */
function parseDoc(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const frontmatter = parseFrontmatter(content);

  // 提取 ID
  const id = extractId(content);
  if (!id) {
    return { error: `No anchor ID found in ${filePath}` };
  }

  // 确定类型（优先使用 frontmatter，其次从 ID 推断）
  let type = frontmatter.type || detectTypeFromId(id);
  if (!type) {
    return { error: `Cannot determine type for ${filePath}` };
  }

  // 提取其他信息
  const name = extractName(content);
  const summary = extractSummary(content);
  const domain = frontmatter.domain || null;

  // 提取关系
  const dependencies = extractDependencies(content, id);
  const consumers = extractConsumers(content, id);
  const relations = [...dependencies, ...consumers];

  // 提取关键词
  const keywords = extractKeywords(content, id);

  return {
    document: {
      id,
      type,
      name,
      path: filePath.replace(/\\/g, '/'),  // 统一使用 /
      summary,
      domain,
      raw_content: content
    },
    relations,
    keywords
  };
}

module.exports = {
  scanDocs,
  parseDoc,
  parseFrontmatter,
  extractId,
  extractName,
  extractSummary,
  extractDependencies,
  extractConsumers,
  extractKeywords,
  detectTypeFromId
};
