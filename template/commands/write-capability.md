# 编写 Capability Spec

编写或更新横向能力规格文档。

## 参数

- `name`：能力名称（必填）

## 输出位置

`docs/requirements/capabilities/cap-{name}.md`

## 加载文件

### 步骤0: 获取项目信息

读取 `.solodevflow/state.json` 获取:
- `project.type`（项目类型：`backend` | `web-app` | `mobile-app`）

### 步骤1: 加载规范

1. 规范文档：`docs/specs/spec-requirements.md`（Section 5: Capability Spec Structure）
2. 现有 Capability Spec：`docs/requirements/capabilities/cap-{name}.md`（如存在）

**注意**: 直接从规范生成文档，不使用模板。

## 执行步骤

### 2. 前置检查

1. 检测目标文件是否存在
2. 读取规范文档 Section 5，了解 Capability Spec 结构要求

**如果不存在（新建模式）**：

1. 根据规范 Section 5 的表格，生成文档结构
2. 必选章节（Required=Yes）必须包含
3. 替换锚点中的 `{name}` 为实际能力名
4. 根据用户提供的能力信息填充内容
5. 输出到目标位置

**如果存在（更新模式）**：

1. 读取现有 Capability Spec 内容
2. 根据用户输入的需求，自动判断需要更新哪些章节
3. 保留未变更的章节，只修改相关部分
4. 确保锚点和结构完整
5. 输出更新后的文件

**最后**：
- 运行校验：`npm run validate:docs {输出文件路径}`，确保符合规范

## 创建时机

满足以下任一条件时创建：
- 横向功能被 2 个以上 Feature 使用
- 横向功能有复杂需求需要独立描述
- 横向功能需要定义统一的使用规范

简单横向功能可在 PRD 的 Capability Roadmap 中一句话描述，不需要独立文档。

## 注意事项

- 必须包含：Intent、Consumers、Requirements、Acceptance Criteria
- 更新时保留文档版本历史（末尾的 Version/Changes 信息）
