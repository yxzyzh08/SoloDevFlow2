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
| `/write-feature {name}` | `docs/requirements/features/fea-{feature}.md` |
| `/write-feature {domain} {name}` | `docs/requirements/{domain}/fea-{feature}.md` |

## 加载文件

### 步骤0: 获取项目信息

读取 `.solodevflow/state.json` 获取:
- `project.type`（项目类型：`backend` | `web-app` | `mobile-app`）

### 步骤1: 加载规范

1. 规范文档：`docs/specs/spec-requirements.md`（Section 4: Feature Spec Structure）
2. 现有 Feature Spec：目标路径文件（如存在）

**注意**: 直接从规范生成文档，不使用模板。

## 执行步骤

### 2. 参数解析

1. 判断参数数量，确定调用模式和输出路径
2. 检测目标文件是否存在
3. 读取规范文档 Section 4，了解 Feature Spec 结构要求

### 3. 文档编写

**如果不存在（新建模式）**：

1. 根据规范 Section 4 的表格，生成文档结构
2. 必选章节（Required=Yes）必须包含
3. **检查 Condition 列**：
   - 若当前 `project.type` 匹配条件，包含该章节
   - 例如：`projectType: web-app` 时包含 UI Components 章节
4. 替换锚点中的 `{name}` 为实际功能名
5. 根据用户提供的功能信息填充内容
6. 输出到对应位置

**如果存在（更新模式）**：

1. 读取现有 Feature Spec 内容
2. 根据用户输入的需求，自动判断需要更新哪些章节
3. 保留未变更的章节，只修改相关部分
4. 确保锚点和结构完整
5. 输出更新后的文件

**最后**：
- 运行校验：`npm run validate:docs {输出文件路径}`，确保符合规范

## 项目类型条件章节

根据 `project.type` 包含条件章节：

| 项目类型 | 额外章节 |
|----------|----------|
| `backend` | 无 |
| `web-app` | UI Components（必选） |
| `mobile-app` | 无 |

### UI Components 章节格式（web-app）

```markdown
## UI Components <!-- id: feat_{name}_ui_components -->

| Component | 描述 | 复用/新建 |
|-----------|------|-----------|
| {组件名} | {组件功能} | 复用现有 / 新建 |

### Component Dependencies

```
PageComponent
  ├── HeaderComponent
  └── ContentComponent
```
```

**规则**：
- 先查询 `docs/ui/component-registry.md`（如存在）
- 优先复用现有组件
- 新建组件实现后需更新组件注册表

## Feature 类型与 Artifacts

### Feature 类型判断

在编写前确认 Feature 类型：

| 类型 | 判断标准 | Artifacts 章节 |
|------|----------|----------------|
| `code` | 产出为代码 + 测试 | **必选** |
| `document` | 产出为 Markdown 文档 | 可选 |

### Artifacts 章节（code 类型必选）

```markdown
## Artifacts <!-- id: feat_{name}_artifacts -->

| Type | Path | Description |
|------|------|-------------|
| Design | docs/designs/des-{name}.md | 设计文档（设计阶段填写） |
| Code | src/{module}/ | 代码目录 |
| Test | tests/e2e/{name}.test.ts | E2E 测试 |

**Design Depth**: TBD
```

### Design Depth 初步评估

在编写 Feature Spec 时，根据功能复杂度初步评估 Design Depth：

| 级别 | 条件 |
|------|------|
| None | 简单、边界清晰、无架构决策，无需设计文档 |
| Required | 需要架构决策、涉及多模块，需要设计文档 |

## 注意事项

- 必须包含：Intent、Core Capabilities、Acceptance Criteria
- **code 类型必须包含 Artifacts 章节**
- **web-app 项目必须包含 UI Components 章节**
- User Stories 为可选章节，需要详细描述用户场景时添加
- 独立 Feature 后续可迁移到 Domain 目录（当 Domain 确定时）
- 更新时保留文档版本历史（末尾的 Version/Changes 信息）
