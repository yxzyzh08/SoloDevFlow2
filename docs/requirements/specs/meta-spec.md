# Meta-Spec v1.0 <!-- 元规范 -->

> 定义文档系统的基础规则，是验证系统的"公理层"

---

**重要声明**：

- 此文档是验证系统的"根"，**不被程序验证**
- 变更此文档需同步更新 `scripts/validate-docs.js`
- 变更历史通过 Git 追踪

---

## 1. Document Identity <!-- id: meta_identity -->

每个文档必须能被系统识别其类型。

### 1.1 Frontmatter

所有文档必须包含 YAML frontmatter：

```yaml
---
type: {doc_type}
version: {version}
---
```

| 字段 | 必填 | 说明 |
|------|------|------|
| `type` | 是 | 文档类型标识 |
| `version` | 是 | 文档版本号 |

### 1.2 Document Types

| Type | 说明 | 验证规则来源 |
|------|------|--------------|
| `prd` | 产品需求文档 | requirements-doc.spec.md Section 3 |
| `domain-spec` | 领域规范 | requirements-doc.spec.md Section 4 |
| `feature-spec` | Feature 规范 | requirements-doc.spec.md Section 5 |
| `capability-spec` | Capability 规范 | requirements-doc.spec.md Section 6 |
| `flow-spec` | Flow 规范 | requirements-doc.spec.md Section 7 |
| `spec` | 规范文档本身 | 不验证（定义者） |

---

## 2. Anchor Format <!-- id: meta_anchor -->

锚点用于文档内定位和跨文档引用。

### 2.1 Format

```markdown
## Section Title <!-- id: {identifier} -->
```

### 2.2 Rules

| 规则 | 说明 |
|------|------|
| 格式 | `<!-- id: {identifier} -->` |
| 标识符 | `[a-z][a-z0-9_]*`（小写字母开头，只含小写字母、数字、下划线） |
| 唯一性 | 文档内唯一 |
| 引用格式 | `文件路径#锚点` |

---

## 3. Specification Mapping <!-- id: meta_mapping -->

规范文档如何声明它定义了哪种文档的结构。

### 3.1 Declaration Format

规范文档使用特殊注释声明它定义的文档类型：

```markdown
## Section Title <!-- defines: {doc_type} -->
```

**示例**：
```markdown
## 3. PRD Structure <!-- defines: prd -->
```

表示此章节定义了 `type=prd` 文档的结构要求。

### 3.2 Structure Definition Table

声明后必须包含结构定义表格，列：

| 列名 | 必填 | 说明 |
|------|------|------|
| Section | 是 | 章节名称 |
| Anchor | 是 | 锚点标识（支持 `{name}` 变量） |
| Required | 否 | 是否必填（Yes/No） |
| Description | 否 | 章节描述 |

**示例**：
```markdown
## 3. PRD Structure <!-- defines: prd -->

| Section | Required | Anchor |
|---------|----------|--------|
| Product Vision | Yes | `prod_vision` |
| Target Users | Yes | `prod_users` |
```

### 3.3 Anchor Variables

锚点中可使用变量，验证时替换为实际值：

| 变量 | 说明 | 示例 |
|------|------|------|
| `{name}` | 文档名称（从文件名推断） | `feat_{name}_intent` → `feat_login_intent` |

---

## 4. Validation Behavior <!-- id: meta_validation -->

验证器的行为规则。

### 4.1 Validation Scope

| 文档类型 | 验证行为 |
|----------|----------|
| `type: spec` | 不验证结构（规范文档是定义者） |
| 其他类型 | 按对应规范验证 |

### 4.2 Validation Process

```
1. 读取文档 frontmatter.type
2. 在规范文档中查找 <!-- defines: {type} --> 声明
3. 解析结构定义表格
4. 验证文档是否符合定义
5. 输出验证结果
```

### 4.3 Error Levels

| Level | 说明 | 示例 |
|-------|------|------|
| ERROR | 必须修复 | 缺少必填章节 |
| WARNING | 建议修复 | 锚点格式不规范 |
| INFO | 仅提示 | 可选章节缺失 |

---

## 5. Change Management <!-- id: meta_change -->

元规范变更是"宪法级"事件。

### 5.1 Change Criteria

元规范应极少变更，仅在以下情况考虑：
- 发现根本性设计缺陷
- 需要支持全新的文档类型
- 外部依赖变化（如 Markdown 规范变更）

### 5.2 Change Process

1. 在 input-log.md 记录变更原因
2. 评估对整个文档系统的影响
3. 更新 meta-spec.md
4. 同步更新 validate-docs.js
5. 更新所有受影响的规范文档
6. 人类审核确认

---

## Implementation <!-- id: meta_impl -->

元规范的代码实现。

| 文件 | 用途 |
|------|------|
| `scripts/validate-docs.js` | 验证器实现 |
| `docs/specs/requirements-doc.spec.md` | 业务文档规范（遵循元规范） |

---

*Version: v1.0*
*Created: 2024-12-21*
*Status: Stable (极少变更)*
