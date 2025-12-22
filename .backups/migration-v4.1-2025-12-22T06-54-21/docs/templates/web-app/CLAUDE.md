# Web App Project Rules

> 本文件为 web-app 项目类型的 CLAUDE.md 模板片段，安装时合并到目标项目

---

## UI 组件管理规范（IMPORTANT）

### 设计阶段必须

1. **查询组件注册表**：`docs/ui/component-registry.md`
2. **在 Feature Design 的 "UI Components" 章节记录**：
   - 每个 UI 需求是否有现有组件可复用
   - 需要新建的组件及原因
3. **优先复用现有组件**

### 实现阶段必须

1. **复用组件**：直接引用，不做重复开发
2. **新建组件**：
   - 先实现组件
   - 实现完成后，更新 `docs/ui/component-registry.md`
3. **提交前检查**：所有新组件已注册

### 绝不做

- 跳过组件查询直接开发
- 重复实现已存在的组件
- 实现新组件但不注册

**说明**：组件开发、状态管理、样式规范等技术细节请参考 `{sourcePath}/docs/specs/design-doc-spec.md` 的 "6.2 Web App 项目" 章节。

---

*Template Version: v2.0*
*Updated: 2025-12-21*
*Changes: 移除技术规范（已迁移至 design-doc-spec.md），保留流程规范*
*Applies to: web-app projects*
