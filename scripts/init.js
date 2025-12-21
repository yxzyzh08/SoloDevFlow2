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

// ============================================================================
// Constants
// ============================================================================

const SOLODEVFLOW_ROOT = path.resolve(__dirname, '..');
const VERSION = require(path.join(SOLODEVFLOW_ROOT, 'package.json')).version;

const PROJECT_TYPES = ['backend', 'web-app', 'mobile-app'];

const UI_FILES = {
  'web-app': [
    { src: 'docs/templates/shared/component-registry.md', dest: 'docs/ui/component-registry.md' },
    { src: 'docs/templates/shared/capability-ui-component.spec.md', dest: 'docs/_capabilities/ui-component-management.spec.md' }
  ],
  'mobile-app': [
    { src: 'docs/templates/shared/component-registry.md', dest: 'docs/ui/component-registry.md' },
    { src: 'docs/templates/shared/capability-ui-component.spec.md', dest: 'docs/_capabilities/ui-component-management.spec.md' }
  ],
  'backend': []
};

const CLAUDE_RULES = {
  'web-app': 'docs/templates/web-app/CLAUDE.md',
  'mobile-app': 'docs/templates/mobile-app/CLAUDE.md',
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
  const stateFile = path.join(targetPath, '.flow/state.json');
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

  // 1. Create .flow directory and generate template files
  log('  创建 .flow/ 目录...');
  ensureDir(path.join(targetPath, '.flow'));

  const now = new Date().toISOString().split('T')[0];
  const projectName = path.basename(targetPath);

  const templateVars = {
    projectName,
    projectType: config.projectType,
    version: VERSION,
    createdAt: now,
    installedAt: now,
    sourcePath: SOLODEVFLOW_ROOT
  };

  // Generate .flow files from templates
  const flowTemplates = [
    { template: 'state.json.template', dest: '.flow/state.json' },
    { template: 'input-log.md.template', dest: '.flow/input-log.md' },
    { template: 'spark-box.md.template', dest: '.flow/spark-box.md' },
    { template: 'pending-docs.md.template', dest: '.flow/pending-docs.md' }
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
  const now = new Date().toISOString().split('T')[0];

  // 1. Update state.json version info (preserve user data)
  log('  更新 state.json 版本信息...');
  const stateFile = path.join(targetPath, '.flow/state.json');
  const state = JSON.parse(fs.readFileSync(stateFile, 'utf-8'));

  // Update solodevflow info
  state.solodevflow = {
    version: VERSION,
    installedAt: state.solodevflow?.installedAt || now,
    upgradedAt: now,
    sourcePath: SOLODEVFLOW_ROOT
  };
  state.lastUpdated = now;

  fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
  log('    .flow/state.json（版本信息已更新，用户数据已保留）', 'success');

  // 2. Preserve other .flow files (don't overwrite)
  log('  保留 .flow/ 用户数据...', 'success');

  // 3. Delete old specs directory (规范现在从源目录读取)
  const specsDir = path.join(targetPath, 'docs/specs');
  if (fs.existsSync(specsDir)) {
    log('  删除旧的 docs/specs/（规范现从源目录读取）...');
    fs.rmSync(specsDir, { recursive: true, force: true });
    log('    docs/specs/ 已删除', 'success');
  }

  // 4. Copy tool files (overwrite)
  await copyToolFiles(config);

  log('升级完成', 'success');
}

/**
 * 复制工具文件（commands, skills, templates, scripts）
 */
async function copyToolFiles(config) {
  const targetPath = config.targetPath;

  // 1. Copy .claude/commands
  log('  复制 .claude/commands/...');
  const commandsSrc = path.join(SOLODEVFLOW_ROOT, '.claude/commands');
  const commandsDest = path.join(targetPath, '.claude/commands');
  if (fs.existsSync(commandsSrc)) {
    copyDir(commandsSrc, commandsDest);
    log('    .claude/commands/', 'success');
  }

  // 2. Copy .claude/skills
  log('  复制 .claude/skills/...');
  const skillsSrc = path.join(SOLODEVFLOW_ROOT, '.claude/skills');
  const skillsDest = path.join(targetPath, '.claude/skills');
  if (fs.existsSync(skillsSrc)) {
    copyDir(skillsSrc, skillsDest);
    log('    .claude/skills/', 'success');
  }

  // 3. Copy project-type specific templates
  log(`  复制 docs/templates/${config.projectType}/...`);
  const templatesSrc = path.join(SOLODEVFLOW_ROOT, 'docs/templates', config.projectType);
  const templatesDest = path.join(targetPath, 'docs/templates');
  if (fs.existsSync(templatesSrc)) {
    copyDir(templatesSrc, templatesDest);
    log(`    docs/templates/`, 'success');
  }

  // 4. Copy scripts (if not skipped)
  if (!config.skipScripts) {
    log('  复制 scripts/...');
    const scriptsToCopy = ['status.js', 'validate-state.js', 'state.js', 'validate-docs.js'];
    ensureDir(path.join(targetPath, 'scripts'));

    for (const script of scriptsToCopy) {
      const srcPath = path.join(SOLODEVFLOW_ROOT, 'scripts', script);
      const destPath = path.join(targetPath, 'scripts', script);
      if (fs.existsSync(srcPath)) {
        copyFile(srcPath, destPath);
        log(`    scripts/${script}`, 'success');
      }
    }
  }

  // 5. Copy UI component files (web-app / mobile-app only)
  const uiFiles = UI_FILES[config.projectType] || [];
  if (uiFiles.length > 0) {
    log('  复制 UI 组件管理文件...');
    for (const { src, dest } of uiFiles) {
      const srcPath = path.join(SOLODEVFLOW_ROOT, src);
      const destPath = path.join(targetPath, dest);
      if (fs.existsSync(srcPath)) {
        ensureDir(path.dirname(destPath));
        copyFile(srcPath, destPath);
        log(`    ${dest}`, 'success');
      }
    }
  }
}

// ============================================================================
// Generator Component
// ============================================================================

async function generateConfig(config) {
  log('生成配置文件...');

  const targetPath = config.targetPath;
  const projectName = config.existingInfo?.projectName || path.basename(targetPath);
  const now = new Date().toISOString().split('T')[0];

  const templateVars = {
    projectName,
    projectType: config.projectType,
    version: VERSION,
    createdAt: now,
    installedAt: config.existingInfo?.installedAt || now,
    sourcePath: SOLODEVFLOW_ROOT
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
  const docsDirs = ['docs/_features', 'docs/_capabilities', 'docs/_flows'];
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

  if (config.upgrade) {
    const oldVersion = config.existingInfo?.version || 'unknown';
    log(`SoloDevFlow ${oldVersion} → ${VERSION} 升级成功!`, 'success');
  } else {
    log(`SoloDevFlow ${VERSION} 安装成功!`, 'success');
  }

  console.log('='.repeat(60));

  if (config.upgrade) {
    console.log(`
项目: ${projectName}
类型: ${config.projectType}
路径: ${config.targetPath}

已更新:
  - .claude/commands/（命令文件）
  - .claude/skills/（技能文件）
  - docs/templates/（模板文件）
  - scripts/（工具脚本）
  - CLAUDE.md（流程控制器）

已保留:
  - .flow/state.json（项目状态）
  - .flow/input-log.md（输入记录）
  - .flow/spark-box.md（灵光收集箱）
  - .flow/pending-docs.md（文档债务）
  - docs/（用户文档）

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

    // Select project type if not specified (and not upgrading)
    if (!config.projectType) {
      config.projectType = await selectProjectType(rl);
    } else if (!PROJECT_TYPES.includes(config.projectType)) {
      log(`无效的项目类型: ${config.projectType}`, 'error');
      log(`支持的类型: ${PROJECT_TYPES.join(', ')}`);
      process.exit(1);
    }

    log(`项目类型: ${config.projectType}`);

    if (config.upgrade) {
      // Upgrade mode
      await upgradeFiles(config);
    } else {
      // Fresh install mode
      await copyFiles(config);
    }

    // Generate config (always regenerate CLAUDE.md)
    await generateConfig(config);

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
