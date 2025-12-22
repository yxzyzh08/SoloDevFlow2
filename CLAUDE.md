# SoloDevFlow 2.0

> 1人 + Claude Code 的人机协作流程控制器

## 启动指令

**每次对话开始必须执行**：

1. 读取 `.flow/state.json`
2. 汇报当前状态（Feature、阶段、待处理灵光数）
3. 等待人类指示

## 核心流程

**所有人类输入按此流程处理**：[docs/requirements/_flows/core-collaboration.spec.md](docs/requirements/_flows/core-collaboration.spec.md)

---

## 版本历史

### v5.1 (2025-01-22) - Documentation Separation
- **目录结构重构**: 需求与设计文档完全分离
  - `docs/requirements/` - 所有需求文档 (.spec.md, prd.md)
  - `docs/designs/` - 所有设计文档 (.design.md)
- **规范更新**: requirements-doc.spec v4.1, design-doc-spec v3.1
- **迁移工具**: 提供自动迁移脚本 `scripts/migrate-docs-separation.js`
- **详细指南**: 参考 `docs/specs/migration-v4.1-guide.md`

### v5.0 (Previous)
- 极简入口，流程定义集中于 core-collaboration.spec.md

---

*Current version: v5.1*
