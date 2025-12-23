# 编写 Flow Spec

编写或更新跨域业务流程规格文档。

## 参数

- `name`：流程名称（必填）

## 输出位置

`docs/requirements/flows/flow-{name}.md`

## 加载文件

### 步骤0: 获取项目信息

读取 `.solodevflow/state.json` 获取:
- `project.type`（项目类型：`backend` | `web-app` | `mobile-app`）

### 步骤1: 加载规范

1. 规范文档：`docs/specs/spec-requirements.md`（Section 6: Flow Spec Structure）
2. 现有 Flow Spec：`docs/requirements/flows/flow-{name}.md`（如存在）

**注意**: 直接从规范生成文档，不使用模板。

## 执行步骤

### 2. 前置检查

1. 检测目标文件是否存在
2. 读取规范文档 Section 6，了解 Flow Spec 结构要求

**如果不存在（新建模式）**：

1. 根据规范 Section 6 的表格，生成文档结构
2. 必选章节（Required=Yes）必须包含
3. 替换锚点中的 `{name}` 为实际流程名
4. 根据用户提供的流程信息填充内容
5. 输出到目标位置

**如果存在（更新模式）**：

1. 读取现有 Flow Spec 内容
2. 根据用户输入的需求，自动判断需要更新哪些章节
3. 保留未变更的章节，只修改相关部分
4. 确保锚点和结构完整
5. 输出更新后的文件

**最后**：
- 运行校验：`npm run validate:docs {输出文件路径}`，确保符合规范

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
