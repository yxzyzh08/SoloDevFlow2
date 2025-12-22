# SoloDevFlow 2.0

> 1人 + Claude Code 的人机协作流程控制器

## 启动指令

**每次对话开始必须执行**：

1. 读取 `.flow/state.json`
2. 汇报当前状态（Feature、阶段、待处理灵光数）
3. 等待人类指示

## 核心流程

**所有人类输入按此流程处理**：[docs/_flows/core-collaboration.spec.md](docs/_flows/core-collaboration.spec.md)

---

*v5.0 - 极简入口，流程定义集中于 core-collaboration.spec.md*
