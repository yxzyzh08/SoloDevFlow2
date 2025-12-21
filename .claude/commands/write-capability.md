# 编写 Capability Spec

编写或更新横向能力规格文档。

## 参数

- `name`：能力名称（必填）

## 加载文件

### 步骤0: 获取规范路径

1. 读取 `.flow/state.json` 获取:
   - `project.type`（项目类型：`backend` | `web-app` | `mobile-app`）
   - `solodevflow.sourcePath`（SoloDevFlow 源路径）

### 步骤1: 加载规范和模板

1. 规范文档：`{sourcePath}/docs/specs/requirements-doc.spec.md`
2. Capability 模板：`docs/templates/{projectType}/capability.spec.md`
3. 现有 Capability Spec：`docs/_capabilities/{name}.spec.md`（如存在）

**注意**: 规范文档来自 SoloDevFlow 源目录，为只读文件。

## 执行步骤

### 2. 前置检查

1. 检测 `docs/_capabilities/{name}.spec.md` 是否存在
2. 读取规范文档，了解 Capability Spec 结构要求（Section 6）

**如果不存在（新建模式）**：
3. 读取 Capability 模板，作为文档骨架
4. 根据用户提供的能力信息，填充模板内容
5. 按模板中的锚点要求添加锚点（替换 `{name}` 为实际能力名）
6. 输出到 `docs/_capabilities/{name}.spec.md`

**如果存在（更新模式）**：
3. 读取现有 Capability Spec 内容
4. 根据用户输入的需求，自动判断需要更新哪些章节
5. 保留未变更的章节，只修改相关部分
6. 确保锚点和结构完整
7. 输出更新后的文件

**最后**：
- 运行校验：`npm run validate:docs docs/_capabilities/{name}.spec.md`，确保符合规范

## 创建时机

满足以下任一条件时创建：
- 横向功能被 2 个以上 Feature 使用
- 横向功能有复杂需求需要独立描述
- 横向功能需要定义统一的使用规范

简单横向功能可在 PRD 的 Capability Roadmap 中一句话描述，不需要独立文档。

## 注意事项

- 必须包含：Capability Overview、Core Functions、Usage Guidelines
- 更新时保留文档版本历史（末尾的 Version/Changes 信息）
