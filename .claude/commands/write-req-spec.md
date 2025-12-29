---
description: 编写或更新需求文档规范
---

编写或更新需求文档规范（spec-requirements.md）。此规范定义 PRD、Feature、Capability、Flow 的结构和编写标准。

## 参数

无参数。

## 执行步骤

1. 加载元规范：@docs/specs/spec-meta.md
2. 检查 `docs/specs/spec-requirements.md` 是否存在
   - 不存在 → 新建模式
   - 存在 → 更新模式（保留未变更章节）
3. 根据用户输入编写/更新文档
4. 输出文件

## 输出要求

**Frontmatter**：

```yaml
---
type: spec
id: requirements
version: "{version}"
---
```

**核心章节**：

| Section | Anchor | Description |
|---------|--------|-------------|
| Scope | `spec_req_scope` | 文档类型定义、目录命名、层次结构 |
| Frontmatter | `spec_req_frontmatter` | 必填/可选字段定义 |
| PRD Structure | `spec_req_prd` | PRD 章节结构 |
| Feature Spec Structure | `spec_req_feature` | Feature 章节结构 |
| Capability Spec Structure | `spec_req_capability` | Capability 章节结构 |
| Flow Spec Structure | `spec_req_flow` | Flow 章节结构 |
| Acceptance Criteria Guide | `spec_req_ac` | 验收标准编写指南 |
| Change Management | `spec_req_change` | 版本号、变更记录格式 |

**锚点格式**：`spec_req_{section}`

## 注意事项

- 规范文档是"规范的规范"，修改需谨慎
- 修改后需运行影响分析：`node scripts/analyze-impact.js docs/specs/spec-requirements.md`
- 更新时保留版本历史
