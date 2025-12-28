---
description: 编写或更新 Capability Spec 文档
argument-hint: <name>
---

编写或更新能力规格文档（Capability Spec）。Capability 是横向技术能力，被多个 Feature 复用，具有基础设施性质。

## 参数

- `$1`：能力名称（必填），如 `auth`、`logging`、`cache`

## 执行步骤

1. 检查参数：如 `$1` 缺失，提示用户提供能力名称后终止
2. 加载规范文档：@docs/specs/spec-requirements.md（§5 Capability Spec Structure）
3. 确定输出路径：`docs/requirements/capabilities/cap-{$1}.md`
4. 检查目标文件是否存在
   - 不存在 → 新建模式
   - 存在 → 更新模式（保留未变更章节）
5. 根据用户输入编写/更新文档
6. 输出文件

## 输出要求

**Frontmatter**：

```yaml
---
type: capability
id: {$1}
workMode: code
status: not_started
priority: {P0|P1|P2}
version: "1.0"
---
```

**必选章节**：

| Section | Anchor | Description |
|---------|--------|-------------|
| Intent | `cap_{name}_intent` | 为什么需要这个能力 |
| Consumers | `cap_{name}_consumers` | 哪些 Feature/Domain 使用 |
| Requirements | `cap_{name}_requirements` | 功能需求（不涉及实现） |
| Acceptance Criteria | `cap_{name}_acceptance` | 可验证的完成条件 |

**可选章节**：Boundaries、Constraints、Artifacts

**锚点格式**：`cap_{name}_{section}`（`{name}` = `$1`）

## 注意事项

- Capability 需要列出 Consumers（谁使用这个能力）
- Consumers 表格格式：| Consumer | Type | 使用场景 |
- 创建条件：被 2+ Feature 使用，或有复杂需求需独立描述
