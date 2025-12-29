---
description: 编写或更新 Flow Spec 文档
argument-hint: <name>
---

编写或更新流程规格文档（Flow Spec）。Flow 是跨域协作流程，编排多个 Feature/系统，有时序和状态转换。

## 参数

- `$1`：流程名称（必填），如 `order`、`payment`、`requirements`

## 执行步骤

1. 检查参数：如 `$1` 缺失，提示用户提供流程名称后终止
2. 加载规范文档：@docs/specs/spec-requirements.md（§6 Flow Spec Structure）
3. 确定输出路径：`docs/requirements/flows/flow-{$1}.md`
4. 检查目标文件是否存在
   - 不存在 → 新建模式
   - 存在 → 更新模式（保留未变更章节）
5. 根据用户输入编写/更新文档
6. 输出文件

## 输出要求

**Frontmatter**：

```yaml
---
type: flow
id: {$1}
workMode: document
status: not_started
priority: {P0|P1|P2}
domain: process
version: "1.0"
---
```

**必选章节**：

| Section | Anchor | Description |
|---------|--------|-------------|
| Flow Overview | `flow_{name}_overview` | 流程目的、触发条件、参与方 |
| Flow Steps | `flow_{name}_steps` | 流程步骤、分支、异常处理 |
| Participants | `flow_{name}_participants` | 涉及的 Domain/Feature/外部系统 |
| Acceptance Criteria | `flow_{name}_acceptance` | 可验证的完成条件 |

**可选章节**：Flow Diagram、Error Handling、Constraints

**锚点格式**：`flow_{name}_{section}`（`{name}` = `$1`）

## 注意事项

- Flow 需要明确 Participants（参与方）
- 流程图（Flow Diagram）推荐使用 ASCII 或 Mermaid
- 创建条件：跨 2+ Domain/Feature，或流程复杂度超出 PRD 承载
