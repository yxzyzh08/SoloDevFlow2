# 编写 PRD

编写或更新产品需求文档（PRD）。

## 加载文件

### 步骤0: 获取规范路径

1. 读取 `.flow/state.json` 获取:
   - `project.type`（项目类型：`backend` | `web-app` | `mobile-app`）
   - `solodevflow.sourcePath`（SoloDevFlow 源路径）

### 步骤1: 加载规范和模板

1. 规范文档：`{sourcePath}/docs/requirements/specs/requirements-doc.spec.md`
2. PRD 模板：`docs/requirements/templates/{projectType}/prd.md`
3. 现有 PRD：`docs/requirements/prd.md`（如存在）

**注意**: 规范文档来自 SoloDevFlow 源目录，为只读文件。

## 执行步骤

### 2. 前置检查

1. 检测 `docs/requirements/prd.md` 是否存在
2. 读取规范文档，了解 PRD 结构要求（Section 3）

**如果不存在（新建模式）**：
3. 读取 PRD 模板，作为文档骨架
4. 根据用户提供的产品信息，填充模板内容
5. 按模板中的锚点要求添加锚点
6. 输出到 `docs/requirements/prd.md`

**如果存在（更新模式）**：
3. 读取现有 PRD 内容
4. 根据用户输入的需求，自动判断需要更新哪些章节
5. 保留未变更的章节，只修改相关部分
6. 确保锚点和结构完整
7. 输出更新后的 `docs/requirements/prd.md`

**最后**：
- 运行校验：`npm run validate:docs docs/requirements/prd.md`，确保符合规范

## 注意事项

- PRD 是唯一的产品级文档
- 必须包含：Product Vision、Target Users、Product Description、Feature Roadmap、Success Criteria
- Feature Roadmap 需按 Domain 分层展示
- 更新时保留文档版本历史（末尾的 Version/Changes 信息）
