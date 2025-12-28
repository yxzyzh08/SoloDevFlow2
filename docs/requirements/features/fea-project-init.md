---
type: feature
id: project-init
workMode: code
status: in_progress
priority: P0
domain: tooling
version: "1.3"
---

# Feature: Project Init <!-- id: feat_project_init -->

> 提供安装器，将 SoloDevFlow 的规范、命令、工具分发到目标项目，支持常规项目安装和自身升级（自举模式）

**Feature Type**: code

---

## 1. Intent <!-- id: feat_project_init_intent -->

### 1.1 Problem

**核心问题**：SoloDevFlow 作为人机协作流程工具，需要能够被其他项目使用，但目前缺少分发机制。

**使用场景**：
1. **场景A：常规项目安装**
   - 用户有一个现有项目（backend / web-app / mobile-app），想接入 SoloDevFlow
   - 需要将规范文档、AI 命令、工作流等完整安装到目标项目
   - 目标项目获得独立运行的能力，无需依赖 SoloDevFlow 源目录

2. **场景B：自举模式（自身升级）**
   - 开发者在 SoloDevFlow 项目本身开发新功能（如新命令、新规范）
   - 开发完成后，需要将 `template/` 源码同步到运行态目录（`.solodevflow/`, `.claude/`）
   - 必须保留项目自身的状态数据（state.json 中的 domains, pendingDocs 等）

**核心挑战**：
- **源码与运行时分离**：`template/` 是源码（可分发），`.solodevflow/` 是运行时实例
- **两种模式差异处理**：
  - 常规项目：完整复制规范、命令、工具（目标项目需要独立副本）
  - 自举模式：仅同步运行态文件，跳过规范（源码已存在）
- **版本管理**：记录安装/升级版本，支持后续升级检测
- **向后兼容**：自动迁移遗留的 `.flow/` 路径到 `.solodevflow/`

> **注意**：v2.4 版本已消除模板层，AI 命令直接从规范生成文档，项目类型差异通过规范中的 Condition 列处理。

### 1.2 Value

**对其他项目**：
- **快速接入**：一条命令即可将 SoloDevFlow 安装到任何项目
- **规范统一**：所有接入项目使用相同的规范体系和协作流程
- **独立运行**：安装后，目标项目拥有完整副本，可独立运行

**对 SoloDevFlow 自身**：
- **自举能力**：可以用自己管理自己的开发流程
- **验证闭环**：通过在其他项目中使用，验证和完善自身设计
- **升级支持**：自举模式使开发的新功能能够方便地应用到运行态

---

## 2. Core Functions <!-- id: feat_project_init_functions -->

### 2.1 Function List

| ID | Function | 描述 |
|----|------------|------|
| C1 | 自身项目检测 | 检测目标项目是否为 SoloDevFlow 自身 |
| C2 | 目录初始化 | 创建 `.solodevflow/` 目录和状态文件 |
| C3 | 工作流安装 | 安装 `.solodevflow/flows/` 工作流 |
| C4 | 命令安装 | 安装 `.claude/commands/` 命令集 |
| C5 | 规范复制 | 复制规范文档到目标项目（非自举模式） |
| C6 | 脚本安装 | 复制运行时脚本（非自举模式） |
| C7 | 配置生成 | 生成 `CLAUDE.md` 和更新 `package.json` |
| C8 | 版本记录 | 记录安装的 SoloDevFlow 版本 |
| C9 | 操作模式 | 区分 init/upgrade/bootstrap 三种模式 |

> **已消除**：模板复制能力（v2.4）。AI 命令现在直接从 `spec-requirements.md` 生成文档。

### 2.2 Function Details

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

#### C4: 命令安装

从 `template/commands/` 复制写入命令到 `.claude/commands/` 目录。

**输出**：
```
target-project/
└── .claude/
    └── commands/
        ├── write-prd.md
        ├── write-feature.md
        ├── write-capability.md
        ├── write-flow.md
        ├── write-design.md
        ├── write-design-spec.md
        └── write-req-spec.md
```

**源路径**：
- `SoloDevFlow/template/commands/` → 目标项目 `.claude/commands/`

**规则**：
- 完整复制所有命令文件
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

#### C6: 脚本安装（非自举模式）

复制运行时脚本到目标项目的运行时目录，使其能独立运行状态管理和验证。

**输出**：
```
target-project/
└── .solodevflow/
    └── scripts/
        ├── state.js             # 状态管理 CLI
        ├── status.js            # 状态摘要显示
        ├── validate-state.js    # state.json 验证
        ├── validate-docs.js     # 文档验证
        └── analyze-impact.js    # 影响分析
```

**源路径**：`SoloDevFlow/scripts/` → 目标项目 `.solodevflow/scripts/`

**规则**：
- 选择性复制运行时脚本（排除 init.js 等安装脚本）
- 复制的脚本列表：state.js, status.js, validate-state.js, validate-docs.js, analyze-impact.js
- 覆盖已存在的文件（升级场景）

**自举模式特殊处理**：
- **跳过脚本复制**：SoloDevFlow 自身直接使用源码 `scripts/`
- **不创建 `.solodevflow/scripts/`**：避免源码与副本混淆
- **package.json 差异**：
  - 常规项目：`"status": "node .solodevflow/scripts/status.js"`
  - SoloDevFlow：`"status": "node scripts/status.js"`（使用源码）

#### C7: 配置生成

生成 CLAUDE.md 和更新 package.json。

**CLAUDE.md 生成**：
- 从 `scripts/templates/CLAUDE.md.template` 生成
- 替换项目名称、类型、路径等变量
- 自举模式：跳过生成（保留现有 CLAUDE.md）

**package.json 更新**：
```json
{
  "scripts": {
    "status": "node .solodevflow/scripts/status.js",
    "validate": "node .solodevflow/scripts/validate-state.js",
    "validate:state": "node .solodevflow/scripts/validate-state.js",
    "validate:docs": "node .solodevflow/scripts/validate-docs.js"
  }
}
```

**规则**：
- 如果 `CLAUDE.md` 已存在，提示用户选择：覆盖 / 跳过
- 如果 `package.json` 不存在，创建最小版本
- 如果 `package.json` 存在，合并 scripts（不覆盖已有脚本）

#### C8: 版本记录

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
- `sourcePath`: SoloDevFlow 源目录的绝对路径（用于引用规范）

#### C9: 操作模式

**三种操作模式**的差异：

##### 模式1：常规项目初次安装（`solodevflow init <path>`）

| 文件/目录 | 操作 | 说明 |
|----------|------|------|
| `.solodevflow/state.json` | **创建** | 从模板生成，空的 features 列表 |
| `.solodevflow/flows/` | **创建** | 从 `template/flows/` 复制 |
| `.solodevflow/scripts/` | **创建** | 从 `scripts/` 复制运行时脚本（5个） |
| `.claude/commands/` | **创建** | 从 `template/commands/` 复制 |
| `docs/specs/` | **创建** | 从 `docs/specs/` 复制（完整规范文档） |
| `CLAUDE.md` | **创建** | 从模板生成 |

**命令行为**：
- 如果目标项目已安装（`.solodevflow/` 存在）→ 报错提示使用 `upgrade`
- 支持 `--force` 覆盖已安装项目

##### 模式2：常规项目升级（`solodevflow upgrade <path>`）

| 文件/目录 | 操作 | 说明 |
|----------|------|------|
| `.solodevflow/state.json` | **部分更新** | 只更新版本信息，**保留用户数据** |
| `.solodevflow/flows/` | **覆盖** | 从 `template/flows/` 更新 |
| `.solodevflow/scripts/` | **覆盖** | 从 `scripts/` 更新运行时脚本 |
| `.claude/commands/` | **覆盖** | 从 `template/commands/` 更新 |
| `docs/specs/` | **覆盖** | 从 `docs/specs/` 更新（规范可能有变化） |
| `CLAUDE.md` | **覆盖** | 从模板重新生成 |

**命令行为**：
- 如果目标项目未安装 → 报错提示使用 `init`

**state.json 更新规则**：
```javascript
// ✅ 只更新版本信息
state.solodevflow.version = newVersion;
state.solodevflow.upgradedAt = new Date().toISOString();
state.solodevflow.sourcePath = SOLODEVFLOW_ROOT;

// ❌ 保留不变（用户数据）
// state.domains, state.pendingDocs, state.project
```

##### 模式3：自举模式（`solodevflow init . / upgrade .` 在 SoloDevFlow 自身）

**使用场景**：AI 开发完成新的产物（commands、template、flows 等）后，人类审核通过，手动执行命令应用变更到运行态。

| 文件/目录 | 操作 | 说明 |
|----------|------|------|
| `.solodevflow/state.json` | **部分更新** | 只更新版本信息，**保留项目数据** |
| `.solodevflow/flows/` | **覆盖** | 从 `template/flows/` 同步 |
| `.solodevflow/scripts/` | **不创建** | 使用根目录 `scripts/` 源码 |
| `.claude/commands/` | **覆盖** | 从 `template/commands/` 同步 |
| `docs/specs/` | **跳过** | 源码已存在，不复制给自己 |
| `scripts/` | **跳过** | 源码已存在，不覆盖 |
| `CLAUDE.md` | **跳过** | 保留项目自身的配置 |

**命令行为**：
```bash
# 两条命令在自举模式下等效
solodevflow init .      # 检测到自身 → 打印提示 → 执行 bootstrap
solodevflow upgrade .   # 检测到自身 → 执行 bootstrap
```

**自举后目录结构**：
```
SoloDevFlow/
├── scripts/              # 源码（直接使用，不复制）
├── template/
│   ├── flows/            # 源码
│   └── commands/         # 源码
├── .solodevflow/
│   ├── flows/            # ✅ 从 template/flows/ 同步
│   │   └── workflows.md
│   ├── state.json        # ✅ 保留项目数据
│   └── [无 scripts/]     # ❌ 不创建
└── .claude/
    └── commands/         # ✅ 从 template/commands/ 同步
```

**核心差异总结**：

| 操作 | 常规安装 | 常规升级 | 自举模式 |
|------|---------|---------|---------|
| `.solodevflow/flows/` | ✅ 创建 | ✅ 覆盖 | ✅ 同步 |
| `.solodevflow/scripts/` | ✅ 创建 | ✅ 覆盖 | ❌ 不创建 |
| `.claude/commands/` | ✅ 创建 | ✅ 覆盖 | ✅ 同步 |
| `docs/specs/` | ✅ 复制 | ✅ 覆盖 | ❌ 跳过 |
| `CLAUDE.md` | ✅ 生成 | ✅ 覆盖 | ❌ 跳过 |
| `state.json` | 创建空数据 | 保留数据 | 保留数据 |
| `init` 命令 | 首次安装 | 报错 | 等效 upgrade |
| `upgrade` 命令 | 报错 | 更新 | 执行 bootstrap |

---

## 3. Acceptance Criteria <!-- id: feat_project_init_acceptance -->

### 3.1 常规项目安装

| Item | Verification | Pass Criteria |
|------|--------------|---------------|
| 运行时目录 | 检查目标项目 | `.solodevflow/` 目录和 4 个文件存在 |
| 工作流安装 | 检查目标项目 | `.solodevflow/flows/workflows.md` 存在 |
| 脚本安装 | 检查目标项目 | `.solodevflow/scripts/` 包含 5 个运行时脚本 |
| 命令安装 | 检查目标项目 | `.claude/commands/` 包含 7 个 write-*.md |
| 规范复制 | 检查目标项目 | `docs/specs/` 包含规范文件 |
| CLAUDE.md | 检查目标项目 | 文件存在且包含项目信息 |
| package.json | 检查目标项目 | scripts 字段包含状态管理命令（指向 .solodevflow/scripts/） |
| 功能验证 | 运行 `npm run status` | 输出状态摘要 |
| 版本记录 | 检查 state.json | `solodevflow` 字段包含 version 和 sourcePath |
| 幂等性 | 重复运行 | 提示已安装，不破坏现有数据 |

### 3.2 自举模式

| Item | Verification | Pass Criteria |
|------|--------------|---------------|
| 自身检测 | 运行 `solodevflow init .` | 识别为自举模式，打印提示信息 |
| init/upgrade 等效 | 分别运行两条命令 | 行为一致，都执行 bootstrap |
| 工作流更新 | 检查 `.solodevflow/flows/` | 从 `template/flows/` 同步 |
| 命令更新 | 检查 `.claude/commands/` | 从 `template/commands/` 同步 |
| 规范不复制 | 检查 `docs/specs/` | 保持不变（源码不复制给自己） |
| 脚本不复制 | 检查根目录 `scripts/` | 保持不变（源码不覆盖） |
| 运行时脚本不创建 | 检查 `.solodevflow/scripts/` | 目录不存在（使用根目录源码） |
| package.json | 检查 scripts 字段 | 指向 `scripts/`（非 `.solodevflow/scripts/`）|
| 状态保留 | 检查 state.json | `domains`, `pendingDocs` 保持不变 |
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
- 复制规范、命令、工具
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

*Version: v1.4*
*Created: 2025-12-21*
*Updated: 2025-12-28*
*Changes: v1.4 澄清自举模式：脚本路径处理、目录结构、init/upgrade 命令行为；v1.3 函数编号修正；v1.2 添加 frontmatter 可选字段*
