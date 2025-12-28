---
description: 编写或更新设计文档
argument-hint: <name>
---

编写或更新技术设计文档（Design Doc）。设计文档定义技术方案、接口设计、数据模型，是需求到实现的桥梁。

## 参数

- `$1`：设计名称（必填），如 `user-auth`、`payment-api`、`system-architecture`

## 执行步骤

1. 检查参数：如 `$1` 缺失，提示用户提供设计名称后终止
2. 加载规范文档：@docs/specs/spec-design.md
3. 确定输出路径：`docs/designs/des-{$1}.md`
4. 检查目标文件是否存在
   - 不存在 → 新建模式
   - 存在 → 更新模式（保留未变更章节）
5. 根据 §3 Design Depth 判断设计深度（L1/L2/L3）
6. 确认输入需求（inputs 字段）
7. 根据用户输入编写/更新文档
8. 输出文件

## 输出要求

**Frontmatter**：

```yaml
---
type: design
version: "1.0"
inputs:
  - docs/requirements/features/fea-xxx.md#feat_xxx_intent
---
```

**必选章节**：

| Section | Anchor | Description |
|---------|--------|-------------|
| Input Requirements | `design_{name}_input` | 声明输入来源（需求文档引用） |
| Overview | `design_{name}_overview` | 设计目标、约束条件 |
| Technical Approach | `design_{name}_approach` | 技术方案、架构决策 |

**可选章节**：

| Section | Anchor | 适用场景 |
|---------|--------|----------|
| Interface Design | `design_{name}_interface` | 有接口定义 |
| Decision Record | `design_{name}_decisions` | 有多方案选择 |
| Implementation Plan | `design_{name}_impl` | 复杂场景 |
| Risks | `design_{name}_risks` | 高风险场景 |
| Dependencies | `design_{name}_dependencies` | 有外部依赖 |

**锚点格式**：`design_{name}_{section}`（`{name}` = `$1`）

## 注意事项

- 设计文档必须声明 inputs（需求来源）
- 设计与需求是多对多关系：一个 Feature 可能有多个设计，多个 Feature 可能共享一个设计
- Interface Design 需包含：函数签名、数据结构、错误码定义
- Decision Record 需记录：选择了什么、为什么这样选择
