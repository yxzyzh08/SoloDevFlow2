---
description: 编写或更新产品需求文档（PRD）
---

编写或更新产品需求文档（PRD）。PRD 是产品的顶层需求文档，定义产品愿景、目标用户、功能规划。

## 参数

无参数。PRD 是唯一的产品级文档。

## 执行步骤

1. 加载规范文档：@docs/specs/spec-requirements.md（§3 PRD Structure）
2. 检查 `docs/requirements/prd.md` 是否存在
   - 不存在 → 新建模式
   - 存在 → 更新模式（保留未变更章节）
3. 根据用户输入编写/更新文档
4. 输出到 `docs/requirements/prd.md`

## 输出要求

**Frontmatter**：

```yaml
---
type: prd
version: "{version}"
---
```

**必选章节**：

| Section | Anchor | Description |
|---------|--------|-------------|
| Product Vision | `prod_vision` | 一句话定义 + 核心价值 |
| Target Users | `prod_users` | 用户画像、痛点 |
| Product Description | `prod_description` | High Level 功能概述 |
| Feature Roadmap | `prod_roadmap` | 按 Domain 分组的 Feature 列表 |
| Success Criteria | `prod_success` | 可验证的成功指标 |

**可选章节**：Non-Goals、Constraints & Assumptions、Non-Functional Requirements、Core Flow、Appendix

**锚点格式**：`prod_{section}`

## 注意事项

- PRD 是唯一的产品级文档
- Feature Roadmap 需按 Domain 分层展示
- 更新时保留文档版本历史（末尾的 Version/Changes）
