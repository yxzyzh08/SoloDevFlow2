---
type: capability
id: document-validation
workMode: code
status: done
priority: P0
domain: process
version: "1.1"
---

# Capability: Document Validation <!-- id: cap_document_validation -->

> 文档格式验证能力，确保需求/设计/测试文档符合规范定义的结构，支撑知识库解析和影响分析

---

## 1. Intent <!-- id: cap_document_validation_intent -->

### 1.1 Problem

- 文档格式不一致，导致知识库无法正确解析
- 影响分析无法区分"可能需要检查"和"确实不符合规范"
- 缺少统一的验证入口，各 Feature 各自实现验证逻辑
- 规范更新后，难以发现哪些现有文档不再符合新规范

### 1.2 Value

- **统一验证**：提供单一的文档验证能力，被多个 Feature 复用
- **精准判断**：从"可能有问题"到"确实不符合"的精确诊断
- **规范契约**：基于 spec-requirements.md / spec-design.md / spec-test.md 定义的结构验证
- **知识库支撑**：确保解析前文档格式正确，避免垃圾数据入库

---

## 2. Consumers <!-- id: cap_document_validation_consumers -->

| Consumer | Type | 使用场景 |
|----------|------|----------|
| feat_change_impact_tracking | feature | 判断受影响文档是否"确实不符合"规范 |
| feat_knowledge_base | feature | 解析文档前验证格式，确保数据质量 |
| feat_project_init | feature | 安装后验证目标项目文档（未来） |

---

## 3. Requirements <!-- id: cap_document_validation_requirements -->

### 3.1 验证类型

| 类型 | 说明 | 规范来源 |
|------|------|----------|
| Frontmatter Validation | 校验 YAML frontmatter 完整性和有效性 | spec-meta.md |
| Section Validation | 校验必选章节是否存在 | spec-requirements.md / spec-design.md |
| Anchor Validation | 校验锚点格式和唯一性 | spec-meta.md |
| Reference Validation | 校验引用文档和锚点存在性 | spec-meta.md |

### 3.2 支持的文档类型

| 文档类型 | 规范来源 | 必选章节 |
|----------|----------|----------|
| PRD | spec-requirements.md#3 | Vision, Users, Description, Roadmap, Success |
| Feature | spec-requirements.md#4 | Intent, Capabilities, Acceptance |
| Capability | spec-requirements.md#5 | Intent, Consumers, Requirements, Acceptance |
| Flow | spec-requirements.md#6 | Overview, Steps, Participants, Acceptance |
| Design | spec-design.md#4 | Input Requirements, Overview, Technical Approach |
| test-e2e | spec-test.md#4 | Scope, Prerequisites, Scenarios, Expected Results |
| test-performance | spec-test.md#5 | Objectives, Environment, Scenarios, Metrics |
| test-destructive | spec-test.md#6 | Failures, Recovery, Procedures, Rollback |
| test-security | spec-test.md#7 | Scope, Cases, Findings, Remediation |

### 3.3 Frontmatter 校验规则

```
WHEN frontmatter is missing
  THEN report "Missing frontmatter"

WHEN type field is missing
  THEN report "Missing required field: type"

WHEN type value is not in enum [prd, feature, capability, flow, design, test-*]
  THEN report "Invalid type: {value}"

WHEN version field is missing
  THEN report "Missing required field: version"

FOR design/test documents:
  WHEN inputs field is missing
    THEN report "Missing required field: inputs"
```

### 3.4 Section 校验规则

```
FOR each document type:
  Load required sections from spec
  FOR each required section:
    IF section heading not found
      THEN report "Missing required section: {section_name}"
    IF section anchor not found or malformed
      THEN report "Missing or invalid anchor for section: {section_name}"
```

### 3.5 Anchor 校验规则

```
THE anchor format SHALL be `<!-- id: {prefix}_{name} -->`

Prefix mapping:
  - PRD: prod_
  - Feature: feat_
  - Capability: cap_
  - Flow: flow_
  - Design: design_
  - Spec: spec_

WHEN anchor format is incorrect
  THEN report location and expected format

WHEN duplicate anchor found
  THEN report "Duplicate anchor: {anchor_id}"
```

### 3.6 Reference 校验规则

```
FOR each markdown link [text](path) or [text](path#anchor):
  IF path does not exist
    THEN report "Referenced file not found: {path}"
  IF anchor specified AND anchor not found in target file
    THEN report "Referenced anchor not found: {file}#{anchor}"
```

---

## 4. Acceptance Criteria <!-- id: cap_document_validation_acceptance -->

| Item | Verification | Pass Criteria |
|------|--------------|---------------|
| Frontmatter 检测 | 删除文档 frontmatter 后运行 | 报告 "Missing frontmatter" |
| Type 校验 | 设置无效 type 后运行 | 报告 "Invalid type: xxx" |
| 必选章节检测 | 删除 Intent 章节后运行 | 报告 "Missing required section: Intent" |
| 锚点格式校验 | 修改锚点为错误格式 | 报告锚点位置和正确格式 |
| 锚点唯一性 | 添加重复锚点 | 报告 "Duplicate anchor: xxx" |
| 文件引用校验 | 添加不存在的文件引用 | 报告 "Referenced file not found: xxx" |
| 锚点引用校验 | 添加不存在的锚点引用 | 报告 "Referenced anchor not found: xxx" |
| 多文档类型 | 验证 PRD/Feature/Capability/Flow | 各类型正确校验 |
| CLI 集成 | `npm run validate:docs` | 输出验证报告 |

---

## 5. Boundaries <!-- id: cap_document_validation_boundaries -->

### In Scope

- Frontmatter 结构验证
- 必选章节存在性验证
- 锚点格式和唯一性验证
- 文件和锚点引用有效性验证
- 所有需求/设计/测试文档类型支持

### Out of Scope

- 内容质量校验（语法、描述清晰度）
- 自动修复功能（仅提供诊断）
- 代码文件验证（仅文档）
- 跨项目引用验证

---

## 6. Constraints <!-- id: cap_document_validation_constraints -->

| 类型 | 约束 | 说明 |
|------|------|------|
| 性能 | 单文档验证 < 100ms | 支持批量验证场景 |
| 依赖 | 仅依赖 Node.js 标准库 | 无外部依赖 |
| 输出 | JSON 格式验证报告 | 支持程序化消费 |

---

## 7. Artifacts <!-- id: cap_document_validation_artifacts -->

| Type | Path | Description |
|------|------|-------------|
| Code | scripts/validate-docs.js | 文档验证 CLI（v1.2） |

---

*Version: v1.2*
*Created: 2025-12-24*
*Updated: 2025-12-25*
*Changes: v1.2 实现完整验证脚本（锚点唯一性、引用验证、数组 inputs 支持）；v1.1 修正测试文档必选章节；v1.0 初始版本*
