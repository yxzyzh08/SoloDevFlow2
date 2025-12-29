---
description: 编写或更新设计文档规范
---

编写或更新设计文档规范（spec-design.md）。此规范定义设计文档的结构、内容要素、编写标准。

## 参数

无参数。

## 执行步骤

1. 加载元规范：@docs/specs/spec-meta.md
2. 检查 `docs/specs/spec-design.md` 是否存在
   - 不存在 → 新建模式
   - 存在 → 更新模式（保留未变更章节）
3. 根据用户输入编写/更新文档
4. 输出文件

## 输出要求

**Frontmatter**：

```yaml
---
type: spec
id: design
version: "{version}"
---
```

**核心章节**：

| Section | Anchor | Description |
|---------|--------|-------------|
| Scope | `spec_design_scope` | 文档类型定义、设计原则 |
| Frontmatter | `spec_design_frontmatter` | 必填/可选字段定义（含 inputs） |
| Design Depth | `spec_design_depth` | 设计深度判断标准 |
| Design Structure | `spec_design_structure` | 设计文档章节结构 |
| Design Review Checklist | `spec_design_checklist` | 设计审核清单 |
| Project Type Guidelines | `spec_design_project_types` | 不同项目类型的设计关注点 |
| Change Management | `spec_design_change` | 变更处理原则 |

**锚点格式**：`spec_design_{section}`

## 注意事项

- 规范文档是"规范的规范"，修改需谨慎
- 修改后需运行影响分析：`node scripts/analyze-impact.js docs/specs/spec-design.md`
- 更新时保留版本历史
