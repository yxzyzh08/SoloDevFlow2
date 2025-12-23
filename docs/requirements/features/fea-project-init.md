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
| C1 | 目录初始化 | 创建 `.flow/` 目录和状态文件 |
| C2 | 命令安装 | 安装 `.claude/commands/` 命令集 |
| C3 | 规范复制 | 复制规范文档和模板到目标项目 |
| C4 | 配置生成 | 生成 `CLAUDE.md` 和更新 `package.json` |
| C5 | 版本记录 | 记录安装的 SoloDevFlow 版本 |

### 2.2 Capability Details

#### C1: 目录初始化

创建 SoloDevFlow 运行所需的目录结构和初始文件。

**输出**：
```
target-project/
├── .flow/
│   ├── state.json        # 初始状态（空 Feature 列表）
│   ├── input-log.md      # 空的输入日志
│   ├── spark-box.md      # 空的灵光收集箱
│   └── pending-docs.md   # 空的待处理文档
```

**规则**：
- 如果 `.flow/` 已存在，提示用户选择：覆盖 / 跳过 / 取消
- `state.json` 使用当前最新 Schema 版本

#### C2: 命令安装

复制 Claude Code 命令到目标项目。

**输出**：
```
target-project/
└── .claude/
    └── commands/
        ├── write-prd.md
        ├── write-feature.md
        ├── write-design.md
        ├── write-capability.md
        ├── write-flow.md
        └── ...
```

**规则**：
- 复制所有 `write-*.md` 命令
- 保留命令文件的原始内容

#### C3: 规范复制

复制规范文档和模板到目标项目。

**输出**：
```
target-project/
└── docs/
    ├── specs/
    │   ├── meta-spec.md
    │   ├── requirements-doc.spec.md
    │   └── design-doc-spec.md
    └── templates/
        └── backend/           # 根据项目类型选择
            ├── prd.md
            ├── feature.spec.md
            ├── feature.design.md
            └── ...
```

**规则**：
- 规范文档完整复制（作为项目的规范定义）
- 模板按项目类型复制（backend / web-app / cli-tool 等）

#### C4: 配置生成

生成 CLAUDE.md 和更新 package.json。

**CLAUDE.md 骨架**：
- 基于 SoloDevFlow 的 CLAUDE.md 模板生成
- 项目名称、路径等信息替换为目标项目

**package.json 更新**：
```json
{
  "scripts": {
    "status": "node scripts/status.js",
    "validate": "node scripts/validate-state.js"
  }
}
```

**规则**：
- 如果 `CLAUDE.md` 已存在，提示用户选择
- 如果 `package.json` 不存在，创建最小版本

#### C5: 版本记录

在 state.json 中记录安装信息。

```json
{
  "solodevflow": {
    "version": "2.0.0",
    "installedAt": "2025-12-21T00:00:00Z",
    "sourcePath": "/path/to/solodevflow"
  }
}
```

---

## 3. Acceptance Criteria <!-- id: feat_project_init_acceptance -->

| Item | Verification | Pass Criteria |
|------|--------------|---------------|
| 目录创建 | 检查目标项目 | `.flow/` 目录和 4 个文件存在 |
| 命令安装 | 检查目标项目 | `.claude/commands/` 包含所有 write-*.md |
| 规范复制 | 检查目标项目 | `docs/specs/` 包含核心规范 |
| 模板复制 | 检查目标项目 | `docs/templates/{type}/` 存在 |
| CLAUDE.md | 检查目标项目 | 文件存在且包含项目信息 |
| scripts | 运行 `npm run status` | 输出状态摘要 |
| 版本记录 | 检查 state.json | `solodevflow` 字段存在 |
| 幂等性 | 重复运行 | 提示已安装，不破坏现有数据 |

---

## 4. Artifacts <!-- id: feat_project_init_artifacts -->

> 记录 Feature 的下游产物，用于影响分析和变更追踪。

| Type | Path | Required | Description |
|------|------|----------|-------------|
| Design | docs/designs/tooling/project-init.design.md | required | 设计文档 |
| Code | scripts/init.js | Yes | 初始化脚本 |
| E2E Test | tests/e2e/project-init.test.js | Yes | E2E 测试 |

**Design Depth**: required

**选择理由**：
- 涉及多文件操作（目录创建、文件复制）
- 需要处理多种边界情况（文件已存在、权限问题）
- 需要定义清晰的接口（CLI 参数、配置选项）

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
