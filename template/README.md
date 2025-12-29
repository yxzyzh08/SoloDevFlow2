# SoloDevFlow 模板目录

本目录包含 SoloDevFlow 的所有可分发静态模板资源。

## 目录结构

```
template/
├── flows/                       # AI 执行规范模板
│   └── workflows.md            # 工作流执行规范
├── commands/                    # 文档编写命令模板
│   ├── write-prd.md            # 编写 PRD
│   ├── write-feature.md        # 编写 Feature
│   ├── write-capability.md     # 编写 Capability
│   ├── write-flow.md           # 编写 Flow
│   ├── write-design.md         # 编写 Design
│   ├── write-design-spec.md    # 编写设计规范
│   └── write-req-spec.md       # 编写需求规范
└── requirements/                # 需求文档模板
    ├── backend/                # 后端项目模板
    ├── web-app/                # Web应用模板
    ├── mobile-app/             # 移动应用模板
    └── shared/                 # 跨项目类型共享模板

## 用途

- **源码角色**：此目录中的文件是"源码"（静态模板）
- **分发机制**：通过 `scripts/init.js` 将模板复制到目标项目
- **运行时实例**：目标项目的 `.solodevflow/` 和 `.claude/` 目录包含从这里复制的"运行时实例"

## 安装流程

当运行 `solodevflow init <project>` 时：

1. `template/flows/` → 复制到目标项目的 `.solodevflow/flows/`
2. `template/commands/` → 复制到目标项目的 `.claude/commands/`
3. `template/requirements/` → 保留在 SoloDevFlow 源目录，通过 `sourcePath` 引用

## 升级流程

当运行 `solodevflow upgrade <project>` 时：

- 更新目标项目的 `.solodevflow/flows/`
- 更新目标项目的 `.claude/commands/`
- 保留目标项目的运行时状态（state.json, input-log.md 等）

## 维护指南

- **修改模板**：直接修改此目录中的文件
- **同步 .claude/**：修改后需手动同步到根目录 `.claude/` 目录（用于 SoloDevFlow 自身）
- **版本控制**：此目录所有文件纳入 Git 版本控制
