---
description: 编写或更新 Feature Spec 文档
argument-hint: <name> [domain]
---

编写或更新功能规格文档（Feature Spec）。Feature 是纵向业务功能切片，面向用户价值，可独立交付验收。

## 参数

- `$1`：功能名称（必填），如 `login`、`state-management`
- `$2`：所属 Domain（可选），如 `auth`、`process`

## 执行步骤

1. 检查参数：如 `$1` 缺失，提示用户提供功能名称后终止
2. 加载规范文档：@docs/specs/spec-requirements.md（§4 Feature Spec Structure）
3. 确定输出路径：`docs/requirements/features/fea-{$1}.md`
4. 检查目标文件是否存在
   - 不存在 → 新建模式
   - 存在 → 更新模式（保留未变更章节）
5. 如提供 `$2`（domain），填入 frontmatter 的 domain 字段
6. 根据用户输入编写/更新文档
7. 输出文件

## 输出要求

**Frontmatter**：

```yaml
---
type: feature
id: {$1}
workMode: {code|document}
status: not_started
priority: {P0|P1|P2}
domain: {$2}  # 如提供
version: "1.0"
---
```

**必选章节**：

| Section | Anchor | Description |
|---------|--------|-------------|
| Intent | `feat_{name}_intent` | 解决什么问题（Why） |
| Core Functions | `feat_{name}_functions` | 提供什么功能（What） |
| Acceptance Criteria | `feat_{name}_acceptance` | 可验证的完成条件 |

**条件必选**：
- `Artifacts`：workMode=code 时必填

**可选章节**：User Stories、Boundaries、Dependencies、Non-Functional Requirements

**锚点格式**：`feat_{name}_{section}`（`{name}` = `$1`）

## 注意事项

- 确认 Feature 类型：code（代码产出）或 document（文档产出）
- code 类型必须包含 Artifacts 章节，记录 Design Depth
- 更新时保留文档版本历史
