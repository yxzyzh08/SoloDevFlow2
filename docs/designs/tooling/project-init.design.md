---
type: spec
version: "1.0"
---

# Feature Design: project-init <!-- id: design_project_init -->

> 设计一个初始化脚本，将 SoloDevFlow 安装到目标项目

**Design Depth**: required

---

## 1. Overview <!-- id: design_project_init_overview -->

### 1.1 Design Goals

- **简单易用**：一条命令完成安装，无需复杂配置
- **幂等性**：重复运行不会破坏现有数据
- **可定制**：支持选择项目类型（backend/web-app/cli-tool）
- **可追溯**：记录安装版本，支持未来升级

### 1.2 Constraints

- 仅支持本地安装（从 SoloDevFlow 源目录复制）
- 不支持远程安装（npm registry）
- 目标项目必须是有效目录
- 需要文件系统写入权限

### 1.3 Related Spec

- Feature Spec: `docs/tooling/project-init.spec.md`

---

## 2. Technical Approach <!-- id: design_project_init_approach -->

### 2.1 Architecture Decision

**选择方案**：单文件 Node.js 脚本 + 交互式 CLI

**理由**：
- 无需额外依赖，Node.js 已是开发环境标配
- 单文件便于维护和分发
- 交互式提示改善用户体验

### 2.2 Key Components

```
┌─────────────────────────────────────────────────────────┐
│                      init.js                             │
├─────────────────────────────────────────────────────────┤
│  ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐  │
│  │ Checker │ → │ Copier  │ → │Generator│ → │Finalizer│  │
│  └─────────┘   └─────────┘   └─────────┘   └─────────┘  │
│       │             │             │             │        │
│   检查前置条件   复制文件     生成配置      完成收尾     │
└─────────────────────────────────────────────────────────┘
```

| 组件 | 职责 |
|------|------|
| **Checker** | 检查目标目录、Node 版本、已安装状态 |
| **Copier** | 复制 .flow/、commands/、specs/、templates/ |
| **Generator** | 生成 CLAUDE.md、更新 package.json |
| **Finalizer** | 记录版本、输出成功信息 |

---

## 3. Interface Design <!-- id: design_project_init_interface -->

### 3.1 CLI Interface

```bash
# 基本用法（交互模式）
node /path/to/solodevflow/scripts/init.js /path/to/target-project

# 指定项目类型（非交互）
node /path/to/solodevflow/scripts/init.js /path/to/target-project --type backend

# 强制覆盖
node /path/to/solodevflow/scripts/init.js /path/to/target-project --force

# 查看帮助
node /path/to/solodevflow/scripts/init.js --help
```

### 3.2 Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--type` | `-t` | 项目类型（见下表） | 交互选择 |
| `--force` | `-f` | 强制覆盖已存在文件 | false |
| `--skip-scripts` | | 不复制 scripts/ | false |
| `--help` | `-h` | 显示帮助 | - |

**支持的项目类型**：

| Type | 说明 | 模板路径 |
|------|------|----------|
| `backend` | 纯后端系统 | `docs/templates/backend/` |
| `web-app` | Web 应用（前端+后端） | `docs/templates/web-app/` |
| `mobile-app` | 移动应用 | `docs/templates/mobile-app/` |

### 3.3 Data Structures

```javascript
/**
 * 初始化配置
 */
const InitConfig = {
  targetPath: '/path/to/project',   // 目标项目路径
  projectType: 'backend',            // 项目类型
  force: false,                      // 是否强制覆盖
  skipScripts: false                 // 是否跳过脚本
};

/**
 * 安装清单
 */
const InstallManifest = {
  directories: ['.flow', '.claude/commands', 'docs/specs', 'docs/templates'],
  files: {
    '.flow/state.json': 'template',      // 从模板生成
    '.flow/input-log.md': 'template',
    '.flow/spark-box.md': 'template',
    '.flow/pending-docs.md': 'template',
    'CLAUDE.md': 'template',              // 从模板生成
    '.claude/commands/*': 'copy',         // 直接复制
    'docs/specs/*': 'copy',
    'docs/templates/{type}/*': 'copy',    // 根据类型复制
    'scripts/status.js': 'copy',
    'scripts/validate-state.js': 'copy',
    'scripts/state.js': 'copy'
  }
};

/**
 * UI 组件相关文件（web-app / mobile-app 专用）
 */
const UI_FILES = {
  'web-app': [
    { src: 'templates/shared/component-registry.md', dest: 'docs/ui/component-registry.md' }
  ],
  'mobile-app': [
    { src: 'templates/shared/component-registry.md', dest: 'docs/ui/component-registry.md' }
  ],
  'backend': []  // 无 UI 文件
};

/**
 * CLAUDE.md 项目类型规则（合并到目标 CLAUDE.md）
 */
const CLAUDE_RULES = {
  'web-app': 'templates/web-app/CLAUDE.md',
  'mobile-app': 'templates/mobile-app/CLAUDE.md',
  'backend': null
};
```

### 3.4 Error Handling

| 错误场景 | 处理方式 |
|----------|----------|
| 目标路径不存在 | 提示创建或退出 |
| 目标路径不是目录 | 报错退出 |
| 无写入权限 | 报错退出 |
| .flow/ 已存在 | 提示选择：覆盖/跳过/取消 |
| 复制失败 | 报错并回滚已复制文件 |

---

## 4. Implementation Plan <!-- id: design_project_init_impl -->

### 4.1 Steps

1. [ ] 创建 `scripts/init.js` 基础结构
2. [ ] 实现 Checker 组件（前置检查）
3. [ ] 实现 Copier 组件（文件复制）
4. [ ] 实现 Generator 组件（配置生成）
5. [ ] 实现 Finalizer 组件（收尾）
6. [ ] 添加交互式提示
7. [ ] 添加命令行参数解析
8. [ ] 编写 E2E 测试
9. [ ] 更新文档

### 4.2 Files to Create/Modify

| 文件 | 操作 | 说明 |
|------|------|------|
| `scripts/init.js` | 新建 | 初始化脚本主文件 |
| `scripts/templates/state.json.template` | 新建 | 初始 state.json 模板 |
| `scripts/templates/CLAUDE.md.template` | 新建 | CLAUDE.md 模板 |
| `tests/e2e/project-init.test.js` | 新建 | E2E 测试 |
| `package.json` | 修改 | 添加 init script |

### 4.3 UI 组件管理相关文件（已创建）

| 文件 | 用途 |
|------|------|
| `docs/templates/shared/component-registry.md` | 组件注册表模板 |
| `docs/templates/shared/capability-ui-component.spec.md` | UI 组件管理 Capability 模板 |
| `docs/templates/web-app/CLAUDE.md` | Web 项目 CLAUDE.md 规则片段 |
| `docs/templates/mobile-app/CLAUDE.md` | Mobile 项目 CLAUDE.md 规则片段 |

### 4.4 Key Implementation Details

#### state.json 模板

```json
{
  "schemaVersion": "9.0.0",
  "project": {
    "name": "{{projectName}}",
    "description": "",
    "type": "{{projectType}}",
    "createdAt": "{{createdAt}}",
    "updatedAt": "{{createdAt}}"
  },
  "flow": {
    "researchMethod": "bottom-up",
    "activeFeatures": []
  },
  "features": {},
  "domains": {},
  "sparks": [],
  "pendingDocs": [],
  "solodevflow": {
    "version": "{{version}}",
    "installedAt": "{{installedAt}}",
    "sourcePath": "{{sourcePath}}"
  },
  "metadata": {
    "stateFileVersion": 1,
    "totalStateChanges": 1
  },
  "lastUpdated": "{{createdAt}}"
}
```

#### 复制逻辑

```javascript
async function copyFiles(config) {
  const manifest = getInstallManifest(config.projectType);

  // 1. 复制基础文件
  for (const [dest, action] of Object.entries(manifest.files)) {
    const targetPath = path.join(config.targetPath, dest);

    if (action === 'copy') {
      await fs.copy(sourcePath, targetPath);
    } else if (action === 'template') {
      const content = renderTemplate(templatePath, config);
      await fs.writeFile(targetPath, content);
    }
  }

  // 2. 复制 UI 组件文件（web-app / mobile-app）
  const uiFiles = UI_FILES[config.projectType] || [];
  for (const { src, dest } of uiFiles) {
    const sourcePath = path.join(SOLODEVFLOW_ROOT, 'docs', src);
    const targetPath = path.join(config.targetPath, dest);
    await fs.ensureDir(path.dirname(targetPath));
    await fs.copy(sourcePath, targetPath);
  }

  // 3. 合并项目类型 CLAUDE.md 规则
  const claudeRulesPath = CLAUDE_RULES[config.projectType];
  if (claudeRulesPath) {
    const rulesContent = await fs.readFile(
      path.join(SOLODEVFLOW_ROOT, 'docs', claudeRulesPath),
      'utf-8'
    );
    await appendToClaudeMd(config.targetPath, rulesContent);
  }
}
```

---

## 5. Dependencies <!-- id: design_project_init_dependencies -->

| 依赖 | 类型 | 说明 |
|------|------|------|
| Node.js fs/path | hard | 文件系统操作 |
| state-management | hard | state.json Schema 定义 |
| write-commands | soft | 命令文件来源 |
| readline | soft | 交互式输入（Node.js 内置） |

---

## 6. Testing Strategy <!-- id: design_project_init_testing -->

### 6.1 E2E Test Cases

| Test Case | 验证点 |
|-----------|--------|
| 初始化空目录 | 所有文件正确创建 |
| 重复初始化 | 提示已安装，不破坏数据 |
| 指定项目类型 | 复制对应类型模板 |
| 强制覆盖 | 覆盖现有文件 |
| 无效路径 | 正确报错 |

### 6.2 Test Structure

```javascript
// tests/e2e/project-init.test.js
describe('project-init', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = fs.mkdtempSync('solodevflow-test-');
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true });
  });

  test('initializes empty directory', async () => {
    await runInit(tempDir);
    expect(fs.existsSync(path.join(tempDir, '.flow/state.json'))).toBe(true);
  });
});
```

---

*Version: v1.0*
*Created: 2025-12-21*
*Applies to: project-init*
