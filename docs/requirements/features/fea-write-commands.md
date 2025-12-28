---
type: feature
id: write-commands
workMode: document
status: done
priority: P0
domain: ai-config
version: "1.1"
---

# Feature: Write Commands <!-- id: feat_write_commands -->

> 文档编写命令集，提供结构化的文档编写指令，自动加载规范和模板，确保输出符合规范

---

## 1. Intent <!-- id: feat_write_commands_intent -->

### 1.1 Problem

- 手动编写规范文档容易遗漏必要章节
- 不同文档类型的结构要求不同，难以记忆
- 模板加载和规范查阅需要人工操作
- 输出文档可能不符合规范要求

### 1.2 Value

- **结构化编写**：通过命令明确指定文档类型和参数
- **自动加载**：自动加载对应规范和模板
- **规范一致性**：确保输出文档符合规范结构
- **效率提升**：减少人工查阅规范的时间

---

## 2. Scope <!-- id: feat_write_commands_scope -->

### 2.1 In Scope (MVP)

- PRD 编写命令（/write-prd）
- Feature Spec 编写命令（/write-feature）
- Capability Spec 编写命令（/write-capability）
- Flow Spec 编写命令（/write-flow）
- Design Doc 编写命令（/write-design）
- 规范编写命令（/write-req-spec, /write-design-spec）

### 2.2 Out of Scope

- 文档自动生成（需要人类输入需求）
- 多文档批量编写
- 文档版本对比

---

## 3. Core Functions <!-- id: feat_write_commands_functions -->

| ID | Function | 描述 |
|----|----------|------|
| W1 | PRD 编写 | `/write-prd` 编写产品需求文档 |
| W2 | Feature Spec 编写 | `/write-feature {name}` 编写功能规格 |
| W3 | Capability Spec 编写 | `/write-capability {name}` 编写能力规格 |
| W4 | Flow Spec 编写 | `/write-flow {name}` 编写流程规格 |
| W5 | Design Doc 编写 | `/write-design {feature}` 编写设计文档 |
| W6 | 规范编写 | `/write-req-spec`, `/write-design-spec` 编写规范文档 |

### 3.1 命令列表

| 命令 | 参数 | 输出位置 | 加载规范 |
|------|------|----------|----------|
| `/write-prd` | - | `docs/requirements/prd.md` | spec-requirements.md §3 |
| `/write-feature {name}` | name | `docs/requirements/features/fea-{name}.md` | spec-requirements.md §4 |
| `/write-capability {name}` | name | `docs/requirements/capabilities/cap-{name}.md` | spec-requirements.md §5 |
| `/write-flow {name}` | name | `docs/requirements/flows/flow-{name}.md` | spec-requirements.md §6 |
| `/write-design {feature}` | feature | `docs/designs/des-{feature}.md` | spec-design.md |
| `/write-req-spec` | - | `docs/specs/spec-requirements.md` | spec-meta.md |
| `/write-design-spec` | - | `docs/specs/spec-design.md` | spec-meta.md |

### 3.2 执行流程

```
1. 解析命令参数
2. 确定输出路径
3. 加载对应规范文档
4. 检查目标文件是否存在
   ├── 存在 → 更新模式（保留未变更章节）
   └── 不存在 → 新建模式（使用模板）
5. 根据用户输入编写/更新文档
6. 添加锚点和 Frontmatter
7. 运行 `npm run validate:docs {path}` 验证
8. 输出文件
```

### 3.3 新建 vs 更新模式

| 模式 | 触发条件 | 行为 |
|------|----------|------|
| 新建 | 目标文件不存在 | 使用模板骨架，填充用户输入 |
| 更新 | 目标文件存在 | 读取现有内容，只修改相关章节 |

**更新模式规则**：
- 保留未变更的章节
- 保留文档版本历史
- 确保锚点和结构完整

---

## 4. Acceptance Criteria <!-- id: feat_write_commands_acceptance -->

| Item | Verification | Pass Criteria |
|------|--------------|---------------|
| PRD 命令 | 运行 `/write-prd` | 生成符合 §3 结构的 PRD |
| Feature 命令 | 运行 `/write-feature test` | 生成 `fea-test.md` |
| 规范加载 | 检查命令执行过程 | 自动读取对应规范文档 |
| 锚点生成 | 检查输出文档 | 包含正确格式的锚点 |
| 验证执行 | 命令执行完成后 | 运行 validate:docs |
| 更新模式 | 对已存在文件运行命令 | 保留未变更章节 |

---

## 5. Artifacts <!-- id: feat_write_commands_artifacts -->

| Type | Path | Description |
|------|------|-------------|
| Commands | .claude/commands/*.md | 命令定义文件 |

**Command Files**：
- `write-prd.md`
- `write-feature.md`
- `write-capability.md`
- `write-flow.md`
- `write-design.md`
- `write-req-spec.md`
- `write-design-spec.md`

**Design Depth**: None（规范型 Feature）

---

## 6. Dependencies <!-- id: feat_write_commands_dependencies -->

| Dependency | Type | 说明 |
|------------|------|------|
| spec-requirements | hard | PRD/Feature/Capability/Flow 结构定义 |
| spec-design | hard | Design Doc 结构定义 |
| spec-meta | soft | 锚点和命名规范 |
| cap-document-validation | soft | 输出验证 |

---

## 7. Implementation Notes <!-- id: feat_write_commands_impl -->

### 7.1 Command Format

每个命令文件遵循 Claude CLI Command 格式：

```markdown
# 命令标题

描述

## 参数

参数说明

## 加载文件

步骤说明

## 执行步骤

详细步骤

## 注意事项

规范要求
```

### 7.2 规范引用

命令执行时，通过 `@` 语法引用规范文件：
- `@docs/specs/spec-requirements.md`
- `@docs/specs/spec-design.md`

### 7.3 验证集成

命令执行完成后，自动运行：
```bash
npm run validate:docs {output-path}
```

---

*Version: v1.0*
*Created: 2025-12-27*
*Updated: 2025-12-27*
