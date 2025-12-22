# 编写设计文档规范

> **警告**: 此命令仅用于 SoloDevFlow 主项目。新项目不应修改规范文档。

编写或更新设计文档规范（design-doc-spec.md）。

## 参数

无必填参数。目标文件固定为 `docs/specs/design-doc-spec.md`。

## 加载文件

1. 元规范：`docs/specs/meta-spec.md`（了解文档身份规则）
2. 需求文档规范：`docs/specs/requirements-doc.spec.md`（确保设计类型与需求类型对应）
3. 现有规范：`docs/specs/design-doc-spec.md`

## 执行步骤

1. 读取 meta-spec，了解锚点格式等基础规则
2. 读取 requirements-doc.spec.md，获取需求文档类型列表
3. 读取现有 design-doc-spec.md 内容
4. **一致性检查**：
   - 每个需求文档类型应有对应的设计文档类型
   - 检查 Document Types 表格是否完整
5. 根据用户输入更新相应章节
6. 确保 Document Types 表格与需求文档规范保持一致
7. 输出更新后的文件

**最后（重要）**：
- 提示人类运行影响分析：`node scripts/analyze-impact.js docs/specs/design-doc-spec.md`
- 规范变更影响所有依赖文档，必须评估影响范围

## 一致性检查

设计文档类型必须与需求文档类型一一对应：

| 需求文档类型 | 对应设计文档类型 | 必须定义 |
|--------------|------------------|----------|
| prd | Architecture Design | Yes |
| domain-spec | Domain Design | Yes |
| feature-spec | Feature Design | Yes |
| capability-spec | Capability Design | Yes |
| flow-spec | Flow Design | Yes |

## 常见更新场景

| 场景 | 修改位置 |
|------|----------|
| 添加新的设计文档类型 | Section 3.1 Document Types + 新增 Section N Structure |
| 修改 Feature Design 结构 | Section 4 Feature Design Structure |
| 调整设计深度定义 | Section 2 Design Depth |
| 增加设计检查项 | Section X Design Review Checklist |

## 注意事项

- 设计文档类型必须与需求文档类型一一对应
- 每种设计文档类型应有对应的结构定义章节
- 更新时保留文档版本历史（末尾的 Version/Changes 信息）
- **规范文档变更影响大，务必运行影响分析后再处理后续任务**
