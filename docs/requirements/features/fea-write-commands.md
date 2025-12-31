---
type: feature
id: write-commands
workMode: document
status: done
priority: P0
domain: ai-config
version: "2.2"
---

# Feature: Write Commands <!-- id: feat_write_commands -->

> 文档编写命令集，提供结构化的文档编写指令，自动加载规范，确保输出符合规范

---

## 1. Intent <!-- id: feat_write_commands_intent -->

### 1.1 Problem

- 手动编写规范文档容易遗漏必要章节
- 不同文档类型的结构要求不同，难以记忆
- 规范文档需要人工查阅和理解
- 输出文档可能不符合规范要求

### 1.2 Value

- **规范驱动**：自动加载对应规范（spec-requirements.md / spec-design.md）
- **结构一致**：确保输出文档符合规范定义的章节结构
- **效率提升**：减少人工查阅规范的时间
- **模式区分**：新建模式从零开始，更新模式保留未变更内容

---

## 2. Scope <!-- id: feat_write_commands_scope -->

### 2.1 In Scope (MVP)

| 命令 | 用途 |
|------|------|
| `/write-prd` | 编写产品需求文档 |
| `/write-feature` | 编写 Feature Spec |
| `/write-capability` | 编写 Capability Spec |
| `/write-flow` | 编写 Flow Spec |
| `/write-design` | 编写 Design Doc |
| `/write-req-spec` | 编写需求文档规范 |
| `/write-design-spec` | 编写设计文档规范 |

### 2.2 Out of Scope

- 文档自动生成（需要人类输入需求）
- 多文档批量编写
- 文档版本对比

---

## 3. Core Functions <!-- id: feat_write_commands_functions -->

### 3.1 Command Overview

| ID | Command | 参数 | 输出位置 | 加载规范 |
|----|---------|------|----------|----------|
| W1 | `/write-prd` | - | `docs/requirements/prd.md` | spec-requirements.md §3 |
| W2 | `/write-feature {name} [domain]` | $1=name, $2=domain | `docs/requirements/features/fea-{name}.md` | spec-requirements.md §4 |
| W3 | `/write-capability {name}` | $1=name | `docs/requirements/capabilities/cap-{name}.md` | spec-requirements.md §5 |
| W4 | `/write-flow {name}` | $1=name | `docs/requirements/flows/flow-{name}.md` | spec-requirements.md §6 |
| W5 | `/write-design {name}` | $1=name | `docs/designs/des-{name}.md` | spec-design.md §4 |
| W6 | `/write-req-spec` | - | `docs/specs/spec-requirements.md` | spec-meta.md |
| W7 | `/write-design-spec` | - | `docs/specs/spec-design.md` | spec-meta.md |

**参数说明**：
- 使用 `$1`, `$2`, `$3` 编号参数（Claude Code 标准）
- `[]` 表示可选参数
- 示例：`/write-feature login auth` → `$1=login`, `$2=auth`

### 3.2 Execution Flow

```
1. 解析命令参数
2. 确定输出路径
3. 加载对应规范文档
4. 检查目标文件是否存在
   ├── 存在 → 更新模式（保留未变更章节）
   └── 不存在 → 新建模式（按规范结构生成）
5. 根据用户输入编写/更新文档
6. 添加锚点和 Frontmatter
7. 运行验证（如配置）
8. 输出文件
```

### 3.3 New vs Update Mode

| 模式 | 触发条件 | 行为 |
|------|----------|------|
| 新建 | 目标文件不存在 | 按规范结构生成完整文档 |
| 更新 | 目标文件存在 | 读取现有内容，只修改相关章节 |

**更新模式规则**：
- 保留未变更的章节内容
- 保留文档版本历史（末尾的 Version/Changes）
- 确保锚点格式正确
- 更新 frontmatter 版本号

### 3.4 Specification Loading

**规范文件路径**：

| 规范 | 路径 |
|------|------|
| spec-requirements | `docs/specs/spec-requirements.md` |
| spec-design | `docs/specs/spec-design.md` |
| spec-meta | `docs/specs/spec-meta.md` |

**加载内容**：
- Required/Optional 章节列表
- 章节锚点格式
- Frontmatter 字段要求

### 3.5 Frontmatter Generation

**需求文档 Frontmatter**（spec-requirements.md §2）：

```yaml
---
type: {prd|feature|capability|flow}
id: {document-id}          # 推荐
status: {not_started|in_progress|done}  # 推荐
priority: {P0|P1|P2}       # 可选
domain: {domain-name}      # 可选
version: "{version}"
---
```

**设计文档 Frontmatter**（spec-design.md §2）：

```yaml
---
type: design
version: "{version}"
inputs:
  - {requirement-doc-path}#{anchor}
---
```

### 3.6 Anchor Generation

锚点格式遵循 spec-meta.md 规范：

| 文档类型 | 锚点前缀 | 示例 |
|----------|----------|------|
| PRD | `prod_` | `prod_vision`, `prod_roadmap` |
| Feature | `feat_{name}_` | `feat_login_intent` |
| Capability | `cap_{name}_` | `cap_auth_consumers` |
| Flow | `flow_{name}_` | `flow_order_steps` |
| Design | `design_{name}_` | `design_auth_overview` |

---

## 4. Acceptance Criteria <!-- id: feat_write_commands_acceptance -->

### 4.1 正常场景

| Item | Verification | Pass Criteria |
|------|--------------|---------------|
| PRD 命令 | 运行 `/write-prd` | 生成符合 spec-requirements.md §3 结构的 PRD |
| Feature 命令 | 运行 `/write-feature test` | 生成 `fea-test.md`，包含 Intent/Core Functions/Acceptance Criteria |
| Feature 多参数 | 运行 `/write-feature login auth` | 正确解析 $1=login, $2=auth，domain 填入 frontmatter |
| Capability 命令 | 运行 `/write-capability auth` | 生成 `cap-auth.md`，包含 Intent/Consumers/Requirements |
| Flow 命令 | 运行 `/write-flow order` | 生成 `flow-order.md`，包含 Overview/Steps/Participants |
| Design 命令 | 运行 `/write-design user-auth` | 生成 `des-user-auth.md`，包含 inputs/Overview/Technical Approach |
| 规范加载 | 检查命令执行过程 | 自动读取对应规范文档 |
| 锚点生成 | 检查输出文档 | 包含正确格式的锚点 |
| 更新模式 | 对已存在文件运行命令 | 保留未变更章节和版本历史 |

### 4.2 异常场景

| Item | Verification | Pass Criteria |
|------|--------------|---------------|
| 缺少必填参数 | 运行 `/write-feature`（无参数） | 提示用户提供 name 参数 |
| 规范文件缺失 | 删除 spec-requirements.md 后运行命令 | 提示规范文件缺失，终止执行 |
| 目标目录不存在 | 目标目录不存在时运行命令 | 自动创建目录或提示用户 |

---

## 5. Artifacts <!-- id: feat_write_commands_artifacts -->

| Type | Path | Description |
|------|------|-------------|
| Template | `template/commands/*.md` | 命令模板（源文件） |
| Deployed | `.claude/commands/*.md` | 部署后的命令文件（运行态） |

**Command Files**：
- `write-prd.md`
- `write-feature.md`
- `write-capability.md`
- `write-flow.md`
- `write-design.md`
- `write-req-spec.md`
- `write-design-spec.md`

**部署方式**：通过 `project-init` 从 `template/commands/` 复制到 `.claude/commands/`

**Design Depth**: None（规范型 Feature，无需设计文档）

---

## 6. Dependencies <!-- id: feat_write_commands_dependencies -->

| Dependency | Type | 说明 |
|------------|------|------|
| spec-requirements | hard | PRD/Feature/Capability/Flow 结构定义 |
| spec-design | hard | Design Doc 结构定义 |
| spec-meta | soft | 锚点和命名规范 |
| cap-document-validation | soft | 输出验证（可选） |

---

## 7. Implementation Notes <!-- id: feat_write_commands_impl -->

### 7.1 Command File Format

每个命令文件遵循 **Claude Code Slash Commands** 格式：

**Frontmatter**（必须）：

```yaml
---
description: {命令简短描述，显示在命令列表中}
---
```

**命令内容**：

```markdown
{命令详细描述，说明命令的用途和预期行为}

## 参数

- `$1`：{第一个参数说明}（必填/可选）
- `$2`：{第二个参数说明}（可选）

## 执行步骤

1. 加载规范文档：@{规范文件路径}
2. 检查目标文件是否存在
3. 按规范结构生成/更新文档
4. 输出到指定位置

## 输出要求

- 必选章节：{章节列表}
- 锚点格式：{锚点规范}
- Frontmatter：{字段要求}
```

**格式要点**：
- `description` 字段必填（Claude Code 命令列表依赖此字段）
- 使用 `$1`, `$2`, `$3` 编号参数（而非 `$ARGUMENTS`）
- 使用 `@` 语法引用规范文件
- 命令文件直接是 prompt，无需 `# 标题`

### 7.2 Specification Reference

命令执行时，通过 `@` 语法加载规范文件：
- `@docs/specs/spec-requirements.md`
- `@docs/specs/spec-design.md`
- `@docs/specs/spec-meta.md`

### 7.3 Key Differences from v1.x

| 变更点 | v1.x | v2.0 |
|--------|------|------|
| 状态文件路径 | `.flow/state.json` | `.solodevflow/state.json` |
| 规范文件路径 | `docs/requirements/specs/` | `docs/specs/` |
| 模板依赖 | 依赖模板文件 | 直接从规范生成（模板已废弃） |
| Feature 章节 | Core Capabilities | Core Functions |
| 输出路径前缀 | `{name}.spec.md` | `fea-{name}.md` / `cap-{name}.md` |

### 7.4 No Template Dependency

> **重要**：v2.0 不再依赖模板文件。

AI 直接从规范文档（spec-requirements.md / spec-design.md）理解：
- 必选/可选章节
- 章节顺序
- 锚点格式
- Frontmatter 结构

这简化了维护成本，避免规范和模板不一致的问题。

### 7.5 Command Naming Convention

命令命名采用两种风格：

| 风格 | 命令 | 说明 |
|------|------|------|
| **实体命名** | `/write-prd`, `/write-feature` | 直接使用文档类型名称 |
| **规范命名** | `/write-req-spec`, `/write-design-spec` | 使用缩写（req=requirements） |

**保持现状的理由**：
- `/write-req-spec` 比 `/write-spec-requirements` 更简洁
- 常用命令（PRD/Feature/Flow）使用完整名称，易于记忆
- 低频命令（规范文档）使用缩写，减少输入

---

*Version: v2.2*
*Created: 2025-12-27*
*Updated: 2025-12-28*
*Changes: v2.2 采纳审核建议：多参数支持($1/$2)、异常场景AC、description frontmatter、命名规范说明；v2.1 模板放置于 template/commands/；v2.0 重构路径规范*
