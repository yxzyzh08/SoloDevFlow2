# 编写 Domain Spec

编写或更新领域规格文档。

## 参数

- `name`：领域名称（必填）

## 加载文件

1. 规范文档：`docs/specs/requirements-doc.spec.md`
2. Domain 模板：`docs/templates/backend/_domain.spec.md`
3. PRD：`docs/prd.md`（了解领域上下文）
4. 现有 Domain Spec：`docs/{domain}/_domain.spec.md`（如存在）

## 执行步骤

1. 检测 `docs/{domain}/_domain.spec.md` 是否存在
2. 读取规范文档，了解 Domain Spec 结构要求（Section 4）
3. 读取 PRD，了解该领域在产品中的定位

**如果不存在（新建模式）**：
4. 读取 Domain 模板，作为文档骨架
5. 根据用户提供的领域信息，填充模板内容
6. 按模板中的锚点要求添加锚点（替换 `{name}` 为实际领域名）
7. 输出到 `docs/{domain}/_domain.spec.md`

**如果存在（更新模式）**：
4. 读取现有 Domain Spec 内容
5. 根据用户输入的需求，自动判断需要更新哪些章节
6. 保留未变更的章节，只修改相关部分
7. 确保锚点和结构完整
8. 输出更新后的文件

**最后**：
- 运行校验：`npm run validate:docs docs/{domain}/_domain.spec.md`，确保符合规范

## 创建时机

满足以下任一条件时创建：
- 领域包含 3 个以上 Feature
- 领域有复杂业务规则需要统一定义
- 领域有跨 Feature 的公共概念

## 注意事项

- 必须包含：Domain Overview、Business Rules、Feature List
- 更新时保留文档版本历史（末尾的 Version/Changes 信息）
