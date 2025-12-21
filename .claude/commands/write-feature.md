# 编写 Feature Spec

编写或更新功能规格文档。支持两种调用方式：

- `/write-feature {name}` - 独立 Feature（Bottom-Up 模式）
- `/write-feature {domain} {name}` - Domain 内 Feature

## 参数

**单参数调用**（独立 Feature）：
- `name`：功能名称（必填）

**双参数调用**（Domain 内 Feature）：
- `domain`：所属领域名称（必填）
- `name`：功能名称（必填）

## 输出位置

| 调用方式 | 输出位置 |
|----------|----------|
| `/write-feature {name}` | `docs/_features/{feature}.spec.md` |
| `/write-feature {domain} {name}` | `docs/{domain}/{feature}.spec.md` |

## 加载文件

1. 规范文档：`docs/specs/requirements-doc.spec.md`
2. Feature 模板：`docs/templates/backend/feature.spec.md`
3. Domain Spec：`docs/{domain}/_domain.spec.md`（仅双参数调用时，如存在）
4. 现有 Feature Spec：目标路径文件（如存在）

## 执行步骤

1. 判断参数数量，确定调用模式和输出路径
2. 检测目标文件是否存在
3. 读取规范文档，了解 Feature Spec 结构要求（Section 5）

**如果不存在（新建模式）**：
4. 读取 Feature 模板，作为文档骨架
5. 如为双参数调用且存在 Domain Spec，读取了解领域上下文
6. 根据用户提供的功能信息，填充模板内容
7. 按模板中的锚点要求添加锚点（替换 `{name}` 为实际功能名）
8. 输出到对应位置

**如果存在（更新模式）**：
4. 读取现有 Feature Spec 内容
5. 根据用户输入的需求，自动判断需要更新哪些章节
6. 保留未变更的章节，只修改相关部分
7. 确保锚点和结构完整
8. 输出更新后的文件

**最后**：
- 运行校验：`npm run validate:docs {输出文件路径}`，确保符合规范

## 注意事项

- 必须包含：Intent、Core Capabilities、Acceptance Criteria
- User Stories 为可选章节，需要详细描述用户场景时添加
- 参考 Appendix E 了解 User Story 与 User Scenario 的区别
- 独立 Feature 后续可迁移到 Domain 目录（当 Domain 确定时）
- 更新时保留文档版本历史（末尾的 Version/Changes 信息）
