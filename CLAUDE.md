# SoloDevFlow 2.0

> 1人 + Claude Code 的人机协作流程控制器

## 启动指令

**每次对话开始必须执行**：

1. 读取 `.solodevflow/state.json`
2. 汇报当前状态（Feature、阶段、待处理灵光数）
3. 等待人类指示

## 核心流程

**所有人类输入按此流程处理**：[.solodevflow/flows/workflows.md]

---

## 元规则 (Meta Rules)

### Bilingual Convention

项目全局遵循以下双语约定：

- **文件名 (Filenames)**: 英文
- **标题和术语 (Titles & Terms)**: 英文
- **描述和逻辑 (Descriptions & Logic)**: 中文

此规则适用于所有文档、代码注释和规范文件，无需在单个文档中重复声明。

---


