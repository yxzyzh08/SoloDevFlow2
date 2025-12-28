#!/usr/bin/env node

/**
 * SoloDevFlow CLI
 *
 * 将 SoloDevFlow 安装到目标项目
 *
 * Usage:
 *   solodevflow init <path> [options]    初始化新项目
 *   solodevflow upgrade <path>           升级已有项目
 *   solodevflow --help                   显示帮助
 *
 * Options:
 *   --type, -t      项目类型 (backend|web-app|mobile-app)
 *   --force, -f     强制覆盖已存在文件
 *   --skip-scripts  不复制 scripts/
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { toBeijingISOString } = require('./lib/datetime');

// ============================================================================
// Constants
// ============================================================================

const SOLODEVFLOW_ROOT = path.resolve(__dirname, '..');
const VERSION = require(path.join(SOLODEVFLOW_ROOT, 'package.json')).version;

const PROJECT_TYPES = ['backend', 'web-app', 'mobile-app'];

// Note: Template layer has been eliminated (v2.4)
// AI commands now generate documents directly from spec-requirements.md
// Project type differences are handled via Condition column in spec

const CLAUDE_RULES = {
  'web-app': null,  // Rules now embedded in spec-requirements.md
  'mobile-app': null,
  'backend': null
};

// ============================================================================
// Utilities
// ============================================================================

function log(msg, type = 'info') {
  const prefix = {
    info: '\x1b[36m[INFO]\x1b[0m',
    success: '\x1b[32m[OK]\x1b[0m',
    warn: '\x1b[33m[WARN]\x1b[0m',
    error: '\x1b[31m[ERROR]\x1b[0m'
  };
  console.log(`${prefix[type] || ''} ${msg}`);
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function copyFile(src, dest) {
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

function copyDir(src, dest) {
  ensureDir(dest);
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      copyFile(srcPath, destPath);
    }
  }
}

function renderTemplate(templatePath, variables) {
  let content = fs.readFileSync(templatePath, 'utf-8');

  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    // 对于 JSON 文件中的路径，需要转义反斜杠
    const safeValue = typeof value === 'string' ? value.replace(/\\/g, '\\\\') : value;
    content = content.replace(regex, safeValue);
  }

  return content;
}

async function question(rl, prompt) {
  return new Promise(resolve => {
    rl.question(prompt, resolve);
  });
}

/**
 * 获取已安装的版本信息
 */
function getInstalledInfo(targetPath) {
  const stateFile = path.join(targetPath, '.solodevflow/state.json');
  if (!fs.existsSync(stateFile)) {
    return null;
  }

  try {
    const state = JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
    return {
      version: state.solodevflow?.version || 'unknown',
      projectType: state.project?.type || 'backend',
      projectName: state.project?.name || path.basename(targetPath),
      installedAt: state.solodevflow?.installedAt || 'unknown'
    };
  } catch (e) {
    return null;
  }
}

/**
 * 检测目标项目是否为 SoloDevFlow 自身
 */
function isSelfProject(targetPath) {
  try {
    const packagePath = path.join(targetPath, 'package.json');
    if (!fs.existsSync(packagePath)) {
      return false;
    }
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
    return packageJson.name === 'solodevflow';
  } catch (e) {
    return false;
  }
}

// ============================================================================
// Checker Component
// ============================================================================

async function checkPrerequisites(config, rl) {
  log('检查前置条件...');

  // Check target path exists
  if (!fs.existsSync(config.targetPath)) {
    if (config.upgrade) {
      throw new Error('升级模式要求目标目录已存在');
    }
    const answer = await question(rl, `目标目录不存在: ${config.targetPath}\n是否创建? (y/n): `);
    if (answer.toLowerCase() === 'y') {
      ensureDir(config.targetPath);
      log(`已创建目录: ${config.targetPath}`, 'success');
    } else {
      throw new Error('目标目录不存在，操作取消');
    }
  }

  // Check if target is a directory
  const stat = fs.statSync(config.targetPath);
  if (!stat.isDirectory()) {
    throw new Error('目标路径不是目录');
  }

  // Check if self project (bootstrap mode)
  if (isSelfProject(config.targetPath)) {
    config.bootstrap = true;
    config.projectType = 'backend'; // 固定为 backend
    log('检测到 SoloDevFlow 自身项目，启用自举模式', 'info');

    if (!config.upgrade && !config.force) {
      const answer = await question(rl, '自举模式将更新工具文件但保留项目数据，是否继续? (y/n): ');
      if (answer.toLowerCase() !== 'y') {
        throw new Error('操作取消');
      }
    }

    log('自举模式已启用', 'success');
    return true;
  }

  // Check if already initialized
  const installedInfo = getInstalledInfo(config.targetPath);

  if (installedInfo) {
    // Already installed
    console.log(`\n检测到 SoloDevFlow ${installedInfo.version} 已安装`);
    console.log(`  项目: ${installedInfo.projectName}`);
    console.log(`  类型: ${installedInfo.projectType}`);
    console.log(`  安装时间: ${installedInfo.installedAt}\n`);

    if (config.upgrade) {
      // Upgrade mode specified via CLI
      log(`将升级到 ${VERSION}`, 'info');
      config.projectType = installedInfo.projectType;
      config.existingInfo = installedInfo;
    } else if (config.force) {
      // Force mode - fresh install
      log('强制模式：将进行全新安装（覆盖所有文件）', 'warn');
    } else {
      // Interactive mode - ask user
      console.log('请选择操作:');
      console.log(`  1. 升级到 ${VERSION}（保留项目数据）`);
      console.log('  2. 全新安装（覆盖所有文件）');
      console.log('  3. 取消');

      const answer = await question(rl, '\n请输入选项 (1-3): ');

      switch (answer.trim()) {
        case '1':
          config.upgrade = true;
          config.projectType = installedInfo.projectType;
          config.existingInfo = installedInfo;
          log(`将升级到 ${VERSION}`, 'info');
          break;
        case '2':
          config.force = true;
          log('将进行全新安装', 'warn');
          break;
        case '3':
        default:
          throw new Error('操作取消');
      }
    }
  } else {
    // Not installed
    if (config.upgrade) {
      throw new Error('升级模式要求目标项目已安装 SoloDevFlow');
    }
  }

  log('前置条件检查通过', 'success');
  return true;
}

// ============================================================================
// Copier Component (Fresh Install)
// ============================================================================

async function copyFiles(config) {
  log('复制文件...');

  const targetPath = config.targetPath;

  // 1. Create .solodevflow directory and generate template files
  log('  创建 .solodevflow/ 目录...');
  ensureDir(path.join(targetPath, '.solodevflow'));

  const now = toBeijingISOString().split('T')[0];
  const projectName = path.basename(targetPath);

  const templateVars = {
    projectName,
    projectType: config.projectType,
    version: VERSION,
    createdAt: now,
    installedAt: now
  };

  // Generate .solodevflow files from templates
  const flowTemplates = [
    { template: 'state.json.template', dest: '.solodevflow/state.json' },
    { template: 'input-log.md.template', dest: '.solodevflow/input-log.md' },
    { template: 'pending-docs.md.template', dest: '.solodevflow/pending-docs.md' }
  ];

  for (const { template, dest } of flowTemplates) {
    const templatePath = path.join(SOLODEVFLOW_ROOT, 'scripts/templates', template);
    const destPath = path.join(targetPath, dest);
    const content = renderTemplate(templatePath, templateVars);
    ensureDir(path.dirname(destPath));
    fs.writeFileSync(destPath, content);
    log(`    ${dest}`, 'success');
  }

  // Copy tool files
  await copyToolFiles(config);

  log('文件复制完成', 'success');
}

// ============================================================================
// Upgrade Component
// ============================================================================

async function upgradeFiles(config) {
  log('升级文件...');

  const targetPath = config.targetPath;
  const now = toBeijingISOString().split('T')[0];

  // 1. Update state.json version info (preserve user data)
  log('  更新 state.json 版本信息...');
  const stateFile = path.join(targetPath, '.solodevflow/state.json');
  const state = JSON.parse(fs.readFileSync(stateFile, 'utf-8'));

  // Update solodevflow info
  state.solodevflow = {
    version: VERSION,
    installedAt: state.solodevflow?.installedAt || now,
    upgradedAt: now
  };
  state.lastUpdated = now;

  fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
  log('    .solodevflow/state.json（版本信息已更新，用户数据已保留）', 'success');

  // 2. Preserve other .solodevflow files (don't overwrite)
  log('  保留 .solodevflow/ 用户数据...', 'success');

  // 3. Copy tool files (overwrite)
  // Note: copyToolFiles() will update docs/specs/ and templates/ for regular projects
  await copyToolFiles(config);

  log('升级完成', 'success');
}

// ============================================================================
// Bootstrap Component
// ============================================================================

/**
 * 自举模式：更新工具文件，保留项目数据
 *
 * 自举模式特点：
 * - 只同步 template/ → 运行态目录
 * - 不复制 scripts/（使用源码）
 * - 不复制 docs/specs/（源码已存在）
 * - 不生成 CLAUDE.md（保留项目配置）
 */
async function bootstrapFiles(config) {
  log('自举模式：同步模板到运行态...');

  const targetPath = config.targetPath;
  const now = toBeijingISOString();

  // 1. 部分更新 state.json（只更新版本信息）
  log('  更新 .solodevflow/state.json 版本信息...');
  const stateFile = path.join(targetPath, '.solodevflow/state.json');

  if (fs.existsSync(stateFile)) {
    const state = JSON.parse(fs.readFileSync(stateFile, 'utf-8'));

    // ✅ 只更新版本信息
    state.solodevflow = state.solodevflow || {};
    state.solodevflow.version = VERSION;
    state.solodevflow.upgradedAt = now;
    state.lastUpdated = now;

    // ❌ 保留项目数据：domains, pendingDocs, metadata, subtasks 等

    fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
    log('    版本信息已更新，项目数据已保留', 'success');
  }

  // 2. 复制工具文件（flows, commands, skills）
  // copyToolFiles 会自动跳过 scripts 和 specs（因为 config.bootstrap = true）
  await copyToolFiles(config);

  // 3. 复制 hooks（src/hooks/ → .claude/hooks/）
  // 这已在 copyToolFiles 中处理

  log('自举模式同步完成', 'success');
}

/**
 * 复制工具文件（flows, commands, skills, scripts）
 */
async function copyToolFiles(config) {
  const targetPath = config.targetPath;

  // 1. Copy .solodevflow/flows/ (from template/flows/)
  log('  复制 .solodevflow/flows/...');
  const flowsSrc = path.join(SOLODEVFLOW_ROOT, 'template/flows');
  const flowsDest = path.join(targetPath, '.solodevflow/flows');
  if (fs.existsSync(flowsSrc)) {
    copyDir(flowsSrc, flowsDest);
    log('    .solodevflow/flows/', 'success');
  } else {
    log('    template/flows/ 不存在，跳过', 'warn');
  }

  // 2. Copy .claude/commands/ (from template/commands/)
  log('  复制 .claude/commands/...');
  const commandsSrc = path.join(SOLODEVFLOW_ROOT, 'template/commands');
  const commandsDest = path.join(targetPath, '.claude/commands');
  if (fs.existsSync(commandsSrc)) {
    copyDir(commandsSrc, commandsDest);
    log('    .claude/commands/', 'success');
  }

  // 3. Copy docs/specs/ (non-bootstrap mode only)
  if (!config.bootstrap) {
    log('  复制 docs/specs/（规范文档）...');
    const specsSrc = path.join(SOLODEVFLOW_ROOT, 'docs/specs');
    const specsDest = path.join(targetPath, 'docs/specs');
    ensureDir(specsDest);

    // 4.1 Generate spec-meta.md from template
    const specMetaTemplatePath = path.join(SOLODEVFLOW_ROOT, 'scripts/templates/spec-meta.md.template');
    if (fs.existsSync(specMetaTemplatePath)) {
      const specMetaContent = renderTemplate(specMetaTemplatePath, { version: VERSION });
      fs.writeFileSync(path.join(specsDest, 'spec-meta.md'), specMetaContent);
      log('    docs/specs/spec-meta.md（从模板生成）', 'success');
    }

    // 4.2 Copy other spec files
    const specFiles = ['spec-requirements.md', 'spec-design.md', 'spec-test.md', 'spec-backend-dev.md', 'spec-frontend-dev.md'];
    for (const specFile of specFiles) {
      const srcPath = path.join(specsSrc, specFile);
      const destPath = path.join(specsDest, specFile);
      if (fs.existsSync(srcPath)) {
        copyFile(srcPath, destPath);
        log(`    docs/specs/${specFile}`, 'success');
      }
    }
  }

  // Note: Template layer eliminated (v2.4)
  // AI commands now generate documents directly from spec-requirements.md
  // Project type differences are handled via Condition column in spec

  // 4. Copy scripts to .solodevflow/scripts/ (non-bootstrap mode only)
  // Bootstrap mode uses source scripts/ directly
  if (!config.bootstrap && !config.skipScripts) {
    log('  复制 .solodevflow/scripts/...');
    const scriptsToCopy = ['status.js', 'validate-state.js', 'state.js', 'validate-docs.js', 'analyze-impact.js', 'index.js'];
    ensureDir(path.join(targetPath, '.solodevflow/scripts'));

    for (const script of scriptsToCopy) {
      const srcPath = path.join(SOLODEVFLOW_ROOT, 'scripts', script);
      const destPath = path.join(targetPath, '.solodevflow/scripts', script);
      if (fs.existsSync(srcPath)) {
        copyFile(srcPath, destPath);
        log(`    .solodevflow/scripts/${script}`, 'success');
      }
    }

    // Copy scripts/lib/ directory
    const libSrc = path.join(SOLODEVFLOW_ROOT, 'scripts/lib');
    const libDest = path.join(targetPath, '.solodevflow/scripts/lib');
    if (fs.existsSync(libSrc)) {
      copyDir(libSrc, libDest);
      log('    .solodevflow/scripts/lib/', 'success');
    }
  } else if (config.bootstrap) {
    log('  跳过 .solodevflow/scripts/（自举模式使用源码）', 'info');
  }

  // 5. Copy src/hooks/ to .claude/hooks/ (non-bootstrap mode only)
  // Bootstrap mode uses src/hooks/ source directly
  if (!config.bootstrap) {
    log('  复制 .claude/hooks/...');
    const hooksSrc = path.join(SOLODEVFLOW_ROOT, 'src', 'hooks');
    const hooksDest = path.join(targetPath, '.claude', 'hooks');
    if (fs.existsSync(hooksSrc)) {
      copyDir(hooksSrc, hooksDest);
      log('    .claude/hooks/', 'success');
    }
  } else {
    log('  跳过 .claude/hooks/（自举模式使用源码）', 'info');
  }
}

// ============================================================================
// Generator Component
// ============================================================================

async function generateConfig(config) {
  log('生成配置文件...');

  const targetPath = config.targetPath;
  const projectName = config.existingInfo?.projectName || path.basename(targetPath);
  const now = toBeijingISOString().split('T')[0];

  const templateVars = {
    projectName,
    projectType: config.projectType,
    version: VERSION,
    createdAt: now,
    installedAt: config.existingInfo?.installedAt || now
  };

  // 1. Generate CLAUDE.md
  log('  生成 CLAUDE.md...');
  const claudeTemplatePath = path.join(SOLODEVFLOW_ROOT, 'scripts/templates/CLAUDE.md.template');
  let claudeContent = renderTemplate(claudeTemplatePath, templateVars);

  // 2. Append project-type specific rules
  const rulesPath = CLAUDE_RULES[config.projectType];
  if (rulesPath) {
    const rulesFullPath = path.join(SOLODEVFLOW_ROOT, rulesPath);
    if (fs.existsSync(rulesFullPath)) {
      const rulesContent = fs.readFileSync(rulesFullPath, 'utf-8');
      claudeContent += '\n\n---\n\n' + rulesContent;
      log('  合并项目类型规则...', 'success');
    }
  }

  fs.writeFileSync(path.join(targetPath, 'CLAUDE.md'), claudeContent);
  log('    CLAUDE.md', 'success');

  // 3. Create empty docs directories (if not exists)
  const docsDirs = [
    'docs/requirements/_features',
    'docs/requirements/_capabilities',
    'docs/requirements/_flows',
    'docs/designs/_features',
    'docs/designs/_capabilities',
    'docs/designs/_flows'
  ];
  for (const dir of docsDirs) {
    ensureDir(path.join(targetPath, dir));
  }
  log('  确保 docs/ 目录结构完整', 'success');

  log('配置生成完成', 'success');
}

// ============================================================================
// Finalizer Component
// ============================================================================

function finalize(config) {
  const projectName = config.existingInfo?.projectName || path.basename(config.targetPath);

  console.log('\n' + '='.repeat(60));

  if (config.bootstrap) {
    log(`SoloDevFlow ${VERSION} 自举更新成功!`, 'success');
  } else if (config.upgrade) {
    const oldVersion = config.existingInfo?.version || 'unknown';
    log(`SoloDevFlow ${oldVersion} → ${VERSION} 升级成功!`, 'success');
  } else {
    log(`SoloDevFlow ${VERSION} 安装成功!`, 'success');
  }

  console.log('='.repeat(60));

  if (config.bootstrap) {
    console.log(`
项目: ${projectName}
模式: 自举更新（Bootstrap）
路径: ${config.targetPath}

已同步:
  ✅ .solodevflow/flows/    ← template/flows/
  ✅ .claude/commands/      ← template/commands/

已跳过（使用源码）:
  ⏭️  .solodevflow/scripts/ （使用 scripts/ 源码）
  ⏭️  .claude/hooks/        （使用 src/hooks/ 源码）
  ⏭️  docs/specs/           （源码已存在）
  ⏭️  CLAUDE.md             （保留项目配置）

已保留:
  📦 .solodevflow/state.json（项目状态数据）

版本已更新至: ${VERSION}
`);
  } else if (config.upgrade) {
    console.log(`
项目: ${projectName}
类型: ${config.projectType}
路径: ${config.targetPath}

已更新:
  - .solodevflow/flows/（工作流文件）
  - .solodevflow/scripts/（运行时脚本）
  - .claude/commands/（命令文件）
  - .claude/hooks/（Hook 脚本）
  - docs/specs/（规范文档）
  - CLAUDE.md（流程控制器）

已保留:
  - .solodevflow/state.json（项目状态）
  - .solodevflow/input-log.md（输入记录）
  - .solodevflow/pending-docs.md（文档债务）
  - docs/requirements/（用户需求文档）

更多信息请查看 CLAUDE.md
`);
  } else {
    console.log(`
项目: ${projectName}
类型: ${config.projectType}
路径: ${config.targetPath}

下一步:
  1. cd ${config.targetPath}
  2. 使用 Claude Code 打开项目
  3. 输入需求，开始开发！

常用命令:
  /write-prd              编写产品 PRD
  /write-feature <name>   编写 Feature Spec
  /write-design <name>    编写 Feature Design

更多信息请查看 CLAUDE.md
`);
  }
}

// ============================================================================
// CLI
// ============================================================================

function parseArgs(args) {
  const config = {
    command: null,        // init | upgrade
    targetPath: null,
    projectType: null,
    force: false,
    skipScripts: false,
    help: false,
    version: false,
    existingInfo: null
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      config.help = true;
    } else if (arg === '--version' || arg === '-v') {
      config.version = true;
    } else if (arg === '--force' || arg === '-f') {
      config.force = true;
    } else if (arg === '--skip-scripts') {
      config.skipScripts = true;
    } else if (arg === '--type' || arg === '-t') {
      config.projectType = args[++i];
    } else if (!arg.startsWith('-')) {
      // 解析子命令和路径
      if (!config.command && (arg === 'init' || arg === 'upgrade')) {
        config.command = arg;
      } else if (!config.targetPath) {
        config.targetPath = path.resolve(arg);
      }
    }
  }

  return config;
}

function showHelp() {
  console.log(`
SoloDevFlow CLI v${VERSION}

Usage:
  solodevflow <command> <path> [options]

Commands:
  init <path>         初始化新项目
  upgrade <path>      升级已有项目（保留项目数据）

Options:
  --type, -t <type>   项目类型 (backend|web-app|mobile-app)
  --force, -f         强制覆盖已存在文件
  --skip-scripts      不复制 scripts/
  --help, -h          显示帮助
  --version, -v       显示版本

Examples:
  # 初始化新项目
  solodevflow init .
  solodevflow init . --type web-app
  solodevflow init ./my-project --type mobile-app

  # 升级已有项目
  solodevflow upgrade .
  solodevflow upgrade ./my-project

  # 强制重新初始化
  solodevflow init . --force
`);
}

async function selectProjectType(rl) {
  console.log('\n请选择项目类型:');
  console.log('  1. backend     - 纯后端系统');
  console.log('  2. web-app     - Web 应用（前端+后端）');
  console.log('  3. mobile-app  - 移动应用');

  const answer = await question(rl, '\n请输入选项 (1-3): ');
  const index = parseInt(answer) - 1;

  if (index >= 0 && index < PROJECT_TYPES.length) {
    return PROJECT_TYPES[index];
  }

  log('无效选项，使用默认类型: backend', 'warn');
  return 'backend';
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const config = parseArgs(args);

  // 显示版本
  if (config.version) {
    console.log(`SoloDevFlow v${VERSION}`);
    process.exit(0);
  }

  // 显示帮助
  if (config.help) {
    showHelp();
    process.exit(0);
  }

  // 检查子命令
  if (!config.command) {
    console.log('\x1b[31m错误: 请指定命令 (init 或 upgrade)\x1b[0m\n');
    showHelp();
    process.exit(1);
  }

  // 检查路径
  if (!config.targetPath) {
    console.log(`\x1b[31m错误: 请指定目标路径\x1b[0m\n`);
    console.log(`用法: solodevflow ${config.command} <path>\n`);
    process.exit(1);
  }

  // upgrade 命令设置升级标志
  if (config.command === 'upgrade') {
    config.upgrade = true;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  try {
    console.log('\n' + '='.repeat(60));
    console.log(`  SoloDevFlow CLI v${VERSION}`);
    console.log('='.repeat(60) + '\n');

    // Check prerequisites
    await checkPrerequisites(config, rl);

    // Select project type if not specified (and not upgrading or bootstrapping)
    if (!config.projectType && !config.bootstrap) {
      config.projectType = await selectProjectType(rl);
    } else if (config.projectType && !PROJECT_TYPES.includes(config.projectType)) {
      log(`无效的项目类型: ${config.projectType}`, 'error');
      log(`支持的类型: ${PROJECT_TYPES.join(', ')}`);
      process.exit(1);
    }

    if (!config.bootstrap) {
      log(`项目类型: ${config.projectType}`);
    }

    if (config.bootstrap) {
      // Bootstrap mode (self-project)
      await bootstrapFiles(config);
    } else if (config.upgrade) {
      // Upgrade mode
      await upgradeFiles(config);
    } else {
      // Fresh install mode
      await copyFiles(config);
    }

    // Generate config (skip for bootstrap mode)
    if (!config.bootstrap) {
      await generateConfig(config);
    }

    // Finalize
    finalize(config);

  } catch (error) {
    log(error.message, 'error');
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();
