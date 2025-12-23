---
type: feature
version: "1.0"
---

# Feature: Project Init <!-- id: feat_project_init -->

> 将 SoloDevFlow 安装到其他项目，使其具备完整的人机协作开发能力

**Feature Type**: code

---

## 1. Intent <!-- id: feat_project_init_intent -->

### 1.1 Problem

SoloDevFlow 2.0 目前只能在自身项目中运行，无法被其他项目使用：
- 规范、模板、命令都存储在 SoloDevFlow 项目内
- 其他项目无法直接使用这些规范和工具
- 需要一种"安装"机制来分发 SoloDevFlow

### 1.2 Value

- **快速接入**：任何项目只需一条命令即可接入 SoloDevFlow
- **规范统一**：所有使用 SoloDevFlow 的项目遵循同一套规范
- **自举验证**：通过在其他项目中使用，验证和完善 SoloDevFlow 本身

---

## 2. Core Capabilities <!-- id: feat_project_init_capabilities -->

### 2.1 Capability List

| ID | Capability | 描述 |
|----|------------|------|
| C1 | 自身项目检测 | 检测目标项目是否为 SoloDevFlow 自身 |
| C2 | 目录初始化 | 创建 `.solodevflow/` 目录和状态文件 |
| C3 | 命令安装 | 安装 `.claude/commands/` 命令集 |
| C4 | 规范复制 | 复制规范文档和模板到目标项目 |
| C5 | 配置生成 | 生成 `CLAUDE.md` 和更新 `package.json` |
| C6 | 版本记录 | 记录安装的 SoloDevFlow 版本 |
| C7 | 自举模式 | 自身项目的特殊处理（只更新工具文件，保留项目状态） |

### 2.2 Capability Details

#### C1: 自身项目检测

检测目标项目是否为 SoloDevFlow 自身，以启用自举模式。

**检测方式**：
```javascript
const packageJson = require(path.join(targetPath, 'package.json'));
const isSelfProject = packageJson.name === 'solodevflow';
```

**行为**：
- 检测到自身项目 → 启用自举模式（C7）
- 非自身项目 → 常规安装/升级流程（C2-C6）

#### C2: 运行时目录初始化

创建 SoloDevFlow 运行所需的运行时目录结构和初始文件。

**输出**：
```
target-project/
├── .solodevflow/
│   ├── state.json        # 初始状态（空 Feature 列表 + sourcePath）
│   ├── input-log.md      # 空的输入日志
│   ├── spark-box.md      # 空的灵光收集箱
│   └── pending-docs.md   # 空的待处理文档
```

**规则**：
- 从 `scripts/templates/*.template` 生成初始文件
- 如果 `.solodevflow/` 已存在，提示用户选择：覆盖 / 跳过 / 取消
- 如果检测到遗留的 `.flow/` 目录，自动触发迁移
- `state.json` 使用当前最新 Schema 版本
- `state.json` 中 `solodevflow.sourcePath` 记录 SoloDevFlow 源目录路径

#### C3: 工作流安装

从 `template/flows/` 复制工作流规范到运行时目录。

**输出**：
```
target-project/
└── .solodevflow/
    └── flows/
        └── workflows.md      # AI 执行规范
```

**源路径**：`SoloDevFlow/template/flows/` → 目标项目 `.solodevflow/flows/`

**规则**：
- 直接复制，覆盖已存在的文件
- 工作流文件是运行时实例，可被升级更新

#### C4: 命令和技能安装

从 `template/` 复制命令和技能到 `.claude/` 目录。

**输出**：
```
target-project/
└── .claude/
    ├── commands/
    │   ├── write-prd.md
    │   ├── write-feature.md
    │   ├── write-capability.md
    │   ├── write-flow.md
    │   ├── write-design.md
    │   ├── write-design-spec.md
    │   └── write-req-spec.md
    └── skills/
        └── requirements-expert/
            ├── SKILL.md
            └── reference/
                ├── clarification-checklist.md
                └── ears-format-reference.md
```

**源路径**：
- `SoloDevFlow/template/commands/` → 目标项目 `.claude/commands/`
- `SoloDevFlow/template/skills/` → 目标项目 `.claude/skills/`

**规则**：
- 完整复制所有命令和技能文件
- 覆盖已存在的文件（升级场景）

#### C5: 规范复制（非自举模式）

复制规范文档到目标项目，作为项目的规范定义。

**输出**：
```
target-project/
└── docs/
    └── specs/
        ├── spec-meta.md
        ├── spec-requirements.md
        ├── spec-design.md
        ├── spec-backend-dev.md
        └── spec-test.md
```

**源路径**：`SoloDevFlow/docs/specs/` → 目标项目 `docs/specs/`

**规则**：
- **仅在非自举模式下复制**（其他项目需要规范文档）
- 自举模式跳过（SoloDevFlow 自身已有规范）
- 完整复制所有规范文件

#### C6: 模板复制（非自举模式）

按项目类型复制需求文档模板到目标项目。

**输出**：
```
target-project/
└── docs/
    └── requirements/
        └── templates/
            └── {projectType}/     # backend / web-app / mobile-app
                ├── prd.md
                ├── feature.spec.md
                ├── capability.spec.md
                ├── flow.spec.md
                ├── feature.design.md
                └── simple-feature.spec.md
```

**源路径**：`SoloDevFlow/template/requirements/{projectType}/` → 目标项目 `docs/requirements/templates/`

**规则**：
- **仅在非自举模式下复制**（其他项目需要模板）
- 自举模式跳过（SoloDevFlow 自身已有 `template/` 源）
- 根据项目类型选择对应模板子目录
- 对于 web-app 和 mobile-app，额外复制 shared 模板

#### C7: 脚本安装

复制运行时脚本到目标项目，使其能独立运行状态管理和验证。

**输出**：
```
target-project/
└── scripts/
    ├── state.js             # 状态管理 CLI
    ├── status.js            # 状态摘要显示
    ├── validate-state.js    # state.json 验证
    ├── validate-docs.js     # 文档验证
    └── analyze-impact.js    # 影响分析
```

**源路径**：`SoloDevFlow/scripts/` → 目标项目 `scripts/`

**规则**：
- 选择性复制运行时脚本（排除 init.js 等安装脚本）
- 复制的脚本列表：state.js, status.js, validate-state.js, validate-docs.js, analyze-impact.js
- 覆盖已存在的文件（升级场景）

#### C8: 配置生成

生成 CLAUDE.md 和更新 package.json。

**CLAUDE.md 生成**：
- 从 `scripts/templates/CLAUDE.md.template` 生成
- 替换项目名称、类型、路径等变量
- 自举模式：跳过生成（保留现有 CLAUDE.md）

**package.json 更新**：
```json
{
  "scripts": {
    "status": "node scripts/status.js",
    "validate": "node scripts/validate-state.js",
    "validate:state": "node scripts/validate-state.js",
    "validate:docs": "node scripts/validate-docs.js"
  }
}
```

**规则**：
- 如果 `CLAUDE.md` 已存在，提示用户选择：覆盖 / 跳过
- 如果 `package.json` 不存在，创建最小版本
- 如果 `package.json` 存在，合并 scripts（不覆盖已有脚本）

#### C9: 版本记录

在 state.json 中记录安装信息和源路径。

```json
{
  "solodevflow": {
    "version": "2.0.0",
    "installedAt": "2025-12-21T00:00:00Z",
    "sourcePath": "/absolute/path/to/solodevflow"
  }
}
```

**规则**：
- `version`: 当前安装的 SoloDevFlow 版本
- `installedAt`: 首次安装时间（升级时保留）
- `upgradedAt`: 最后升级时间（升级时更新）
- `sourcePath`: SoloDevFlow 源目录的绝对路径（用于引用模板和规范）

#### C10: 自举模式

当检测到目标项目为 SoloDevFlow 自身时，启用自举模式。

**使用场景**：
AI 开发完成新的产物（commands、skills、template、flows 等）后，人类审核通过，手动执行升级命令应用变更到运行态。

**操作范围**：

| 文件/目录 | 操作 | 说明 |
|----------|------|------|
| `.solodevflow/state.json` | 部分更新 | 只更新版本信息，保留项目数据 |
| `.solodevflow/flows/` | 覆盖 | 从 `template/flows/` 同步 |
| `.claude/commands/` | 覆盖 | 从 `template/commands/` 同步 |
| `.claude/skills/` | 覆盖 | 从 `template/skills/` 同步 |
| `docs/specs/` | **跳过** | 本项目已有规范，不复制 |
| `template/` | **跳过** | 本项目已有模板源，不复制 |
| `scripts/` | **跳过** | 本项目已有脚本，不复制 |

**state.json 更新规则**：
```javascript
// ✅ 只更新版本信息
state.solodevflow.version = newVersion;
state.solodevflow.upgradedAt = new Date().toISOString();
state.lastUpdated = new Date().toISOString();

// ❌ 保留不变
// state.features, state.domains, state.sparks, state.pendingDocs
// state.metadata (除版本信息外)
```

**命令示例**：
```bash
# 在 SoloDevFlow 项目根目录
solodevflow init .      # 自动识别为自举模式
solodevflow upgrade .   # 同样识别为自举模式
```

**核心差异**：
- 常规项目：复制所有需要的文件（规范、模板、命令、脚本）
- 自举模式：仅同步运行态文件（.solodevflow/flows/, .claude/），不复制源文件

---

## 3. Acceptance Criteria <!-- id: feat_project_init_acceptance -->

### 3.1 常规项目安装

| Item | Verification | Pass Criteria |
|------|--------------|---------------|
| 运行时目录 | 检查目标项目 | `.solodevflow/` 目录和 4 个文件存在 |
| 工作流安装 | 检查目标项目 | `.solodevflow/flows/workflows.md` 存在 |
| 命令安装 | 检查目标项目 | `.claude/commands/` 包含 7 个 write-*.md |
| 技能安装 | 检查目标项目 | `.claude/skills/requirements-expert/` 存在 |
| 规范复制 | 检查目标项目 | `docs/specs/` 包含 5 个规范文件 |
| 模板复制 | 检查目标项目 | `docs/requirements/templates/{type}/` 存在 |
| 脚本安装 | 检查目标项目 | `scripts/` 包含 5 个运行时脚本 |
| CLAUDE.md | 检查目标项目 | 文件存在且包含项目信息 |
| package.json | 检查目标项目 | scripts 字段包含状态管理命令 |
| 功能验证 | 运行 `npm run status` | 输出状态摘要 |
| 版本记录 | 检查 state.json | `solodevflow` 字段包含 version 和 sourcePath |
| 幂等性 | 重复运行 | 提示已安装，不破坏现有数据 |

### 3.2 自举模式

| Item | Verification | Pass Criteria |
|------|--------------|---------------|
| 自身检测 | 运行 `solodevflow init .` | 识别为自举模式 |
| 工作流更新 | 检查 `.solodevflow/flows/` | 从 `template/flows/` 同步 |
| 命令更新 | 检查 `.claude/commands/` | 从 `template/commands/` 同步 |
| 技能更新 | 检查 `.claude/skills/` | 从 `template/skills/` 同步 |
| 规范不复制 | 检查 `docs/specs/` | 保持不变（不从源复制） |
| 模板源不复制 | 检查 `template/` | 保持不变（不复制给自己） |
| 脚本不复制 | 检查 `scripts/` | 保持不变（不覆盖） |
| 状态保留 | 检查 state.json | `features`, `domains`, `sparks` 保持不变 |
| 版本更新 | 检查 state.json | `solodevflow.version` 已更新 |
| 幂等性 | 重复运行自举 | 可多次执行，不破坏项目数据 |

---

## 4. Artifacts <!-- id: feat_project_init_artifacts -->

> 记录 Feature 的下游产物，用于影响分析和变更追踪。

| Type | Path | Required | Description |
|------|------|----------|-------------|
| Design | null | none | 无需设计文档 |
| Code | scripts/init.js | Yes | 初始化脚本 |
| E2E Test | tests/e2e/project-init.test.js | Yes | E2E 测试 |

**Design Depth**: none

---

## Boundaries <!-- id: feat_project_init_boundaries -->

### In Scope

- 初始化 SoloDevFlow 到目标项目
- 复制规范、模板、命令
- 生成配置文件

### Out of Scope

- 升级已安装的 SoloDevFlow（未来 Feature）
- 卸载 SoloDevFlow（未来 Feature）
- 远程安装（从 npm registry）（未来 Feature）

---

## Dependencies <!-- id: feat_project_init_dependencies -->

| Dependency | Type | 说明 |
|------------|------|------|
| state-management | hard | 需要 state.json Schema 定义 |
| write-commands | soft | 命令文件来源 |
| meta-spec | soft | 规范文件来源 |

---

*Version: v1.0*
*Created: 2025-12-21*
