# 编写 Flow Spec

编写或更新跨域业务流程规格文档。

## 参数

- `name`：流程名称（必填）

## 加载文件

### 步骤0: 获取规范路径

1. 读取 `.solodevflow/state.json` 获取:
   - `project.type`（项目类型：`backend` | `web-app` | `mobile-app`）
   - `solodevflow.sourcePath`（SoloDevFlow 源路径）

### 步骤1: 加载规范和模板

1. 规范文档：`{sourcePath}/docs/specs/spec-requirements.md`
2. Flow 模板：`{sourcePath}/template/requirements/{projectType}/flow.spec.md`
3. 现有 Flow Spec：`docs/requirements/_flows/{name}.spec.md`（如存在）

**注意**: 规范文档来自 SoloDevFlow 源目录，为只读文件。

## 执行步骤

### 2. 前置检查

1. 检测 `docs/requirements/_flows/{name}.spec.md` 是否存在
2. 读取规范文档，了解 Flow Spec 结构要求（Section 7）

**如果不存在（新建模式）**：
3. 读取 Flow 模板，作为文档骨架
4. 根据用户提供的流程信息，填充模板内容
5. 按模板中的锚点要求添加锚点（替换 `{name}` 为实际流程名）
6. 输出到 `docs/requirements/_flows/{name}.spec.md`

**如果存在（更新模式）**：
3. 读取现有 Flow Spec 内容
4. 根据用户输入的需求，自动判断需要更新哪些章节
5. 保留未变更的章节，只修改相关部分
6. 确保锚点和结构完整
7. 输出更新后的文件

**最后**：
- 运行校验：`npm run validate:docs docs/requirements/_flows/{name}.spec.md`，确保符合规范

## 创建时机

满足以下任一条件时创建：
- 业务流程跨越 2 个以上 Domain/Feature
- 流程复杂度超出 PRD Core Flow 章节承载范围
- 流程涉及多个系统或外部集成

简单流程可在 PRD 的 Core Flow 章节描述，不需要独立文档。

## 注意事项

- 必须包含：Flow Overview、Flow Steps、Participants、Acceptance Criteria
- 参考 Appendix E 了解 Flow Spec 与 User Scenario 的区别
- Flow Spec 关注系统视角（步骤/分支/异常），User Scenario 关注用户视角
- 更新时保留文档版本历史（末尾的 Version/Changes 信息）
