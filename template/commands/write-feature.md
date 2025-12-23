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
| `/write-feature {name}` | `docs/requirements/_features/{feature}.spec.md` |
| `/write-feature {domain} {name}` | `docs/requirements/{domain}/{feature}.spec.md` |

## 加载文件

### 步骤0: 获取规范路径

1. 读取 `.flow/state.json` 获取:
   - `project.type`（项目类型：`backend` | `web-app` | `mobile-app`）
   - `solodevflow.sourcePath`（SoloDevFlow 源路径）

### 步骤1: 加载规范和模板

1. 规范文档：`{sourcePath}/docs/requirements/specs/requirements-doc.spec.md`
2. Feature 模板：`docs/requirements/templates/{projectType}/feature.spec.md`
3. 现有 Feature Spec：目标路径文件（如存在）

**注意**: 规范文档来自 SoloDevFlow 源目录，为只读文件。

## 执行步骤

### 2. 参数解析

1. 判断参数数量，确定调用模式和输出路径
2. 检测目标文件是否存在
3. 读取规范文档，了解 Feature Spec 结构要求（Section 5）

### 3. 文档编写

**如果不存在（新建模式）**：
4. 读取 Feature 模板，作为文档骨架
5. 根据用户提供的功能信息，填充模板内容
6. 按模板中的锚点要求添加锚点（替换 `{name}` 为实际功能名）
7. 输出到对应位置

**如果存在（更新模式）**：
4. 读取现有 Feature Spec 内容
5. 根据用户输入的需求，自动判断需要更新哪些章节
6. 保留未变更的章节，只修改相关部分
7. 确保锚点和结构完整
8. 输出更新后的文件

**最后**：
- 运行校验：`npm run validate:docs {输出文件路径}`，确保符合规范

## Feature 类型与 Artifacts

### Feature 类型判断

在编写前确认 Feature 类型：

| 类型 | 判断标准 | Artifacts 章节 |
|------|----------|----------------|
| `code` | 产出为代码 + 测试 | **必选** |
| `document` | 产出为 Markdown 文档 | 可选 |

### Artifacts 章节（code 类型必选）

```markdown
## Artifacts <!-- feat_{name}_artifacts -->

| Type | Path | Required | Description |
|------|------|----------|-------------|
| Design | docs/designs/{domain}/{name}.design.md | required 时必填 | 设计文档 |
| Code | src/{module}/ | Yes | 代码目录 |
| E2E Test | tests/e2e/{name}.test.ts | Yes | E2E 测试 |

**Design Depth**: none | required
```

### Design Depth 初步评估

在编写 Feature Spec 时，根据功能复杂度初步评估 Design Depth：

| 级别 | 条件 |
|------|------|
| none | 简单、边界清晰、无架构决策，无需设计文档 |
| required | 需要架构决策、涉及多模块，需要设计文档 |

## 注意事项

- 必须包含：Intent、Core Capabilities、Acceptance Criteria
- **code 类型必须包含 Artifacts 章节**
- User Stories 为可选章节，需要详细描述用户场景时添加
- 参考 Appendix E 了解 User Story 与 User Scenario 的区别
- 独立 Feature 后续可迁移到 Domain 目录（当 Domain 确定时）
- 更新时保留文档版本历史（末尾的 Version/Changes 信息）
