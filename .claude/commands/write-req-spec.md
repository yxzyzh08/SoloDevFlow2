# 编写需求文档规范

编写或更新需求文档规范（requirements-doc.spec.md）。

## 参数

无必填参数。目标文件固定为 `docs/specs/requirements-doc.spec.md`。

## 加载文件

1. 元规范：`docs/specs/meta-spec.md`（规范文档的规范）
2. 现有规范：`docs/specs/requirements-doc.spec.md`

## 执行步骤

1. 读取 meta-spec，了解规范文档必须遵循的结构
2. 读取现有 requirements-doc.spec.md 内容
3. 根据用户输入的需求，自动判断需要更新哪些章节：
   - 添加新文档类型 → 新增 Section + Structure Table + `<!-- defines: xxx -->`
   - 修改现有结构 → 更新对应 Section 的 Structure Table
   - 调整通用规则 → 更新 General Rules 或 Appendix
4. 保留未变更的章节，只修改相关部分
5. 确保每个文档类型 Section 都有正确的 `<!-- defines: xxx -->` 声明
6. 输出更新后的文件
7. 运行校验：`npm run validate:docs docs/specs/requirements-doc.spec.md`

**最后（重要）**：
- 提示人类运行影响分析：`node scripts/analyze-impact.js docs/specs/requirements-doc.spec.md`
- 规范变更影响所有依赖文档，必须评估影响范围

## 常见更新场景

| 场景 | 修改位置 |
|------|----------|
| 给 Feature Spec 增加必选章节 | Section 5 Structure Table |
| 添加新的 Spec 类型 | 新增 Section N + defines 声明 |
| 修改锚点命名规则 | Section 2 Anchor Guidelines |
| 增加 Appendix 说明 | Appendix 章节 |

## 注意事项

- 必须遵循 meta-spec 定义的三公理（文档身份/锚点格式/规范映射）
- 每个文档类型 Section 必须包含 `<!-- defines: {type} -->` 声明
- Structure Table 的 Section 列必须与对应模板文件一致
- 修改 Required 字段会影响所有现有文档的校验结果
- 更新时保留文档版本历史（末尾的 Version/Changes 信息）
- **规范文档变更影响大，务必运行影响分析后再处理后续任务**
