# Meta-Spec v2.7 <!-- 元规范 -->

> 定义文档系统的基础规则，是验证系统的"宪法层"

---

**重要声明**：

- 此文档是验证系统的"根"，**不被程序验证**
- 变更此文档需同步更新 `scripts/validate-docs.js`
- 变更历史通过 Git 追踪

---

## 1. Document System Overview <!-- id: meta_overview -->

### 1.1 Documentation Philosophy

文档系统遵循**研发全生命周期**原则：

```
需求阶段 → 设计阶段 → 开发阶段 → 测试阶段
    ↓          ↓          ↓          ↓
   需求文档   设计文档    代码+规范   测试文档
```

### 1.2 Document Lifecycle

| 阶段 | 产出 | 受众 |
|------|------|------|
| **需求** | PRD, Feature Spec, Capability Spec, Flow Spec | 产品、设计、研发 |
| **设计** | Design Doc（架构、接口、功能、数据模型） | 研发、测试 |
| **开发** | 代码 + 单元测试 + 集成测试 + 开发规范 | 研发 |
| **测试** | E2E 测试文档 + 性能测试 + 破坏性测试 | 测试、研发 |
| **规范** | 元规范 + 各阶段规范文档 | AI + 人类 |

---

## 2. Document Types <!-- id: meta_types -->

**元规范的职责**：
- 定义文档类型（Type）及其对应的验证规范文档
- **不定义具体的章节结构**（章节号、章节名称等由各规范文档自行定义）
- 例如：元规范规定 `prd` 由 `spec-requirements.md` 验证，但 PRD 的具体章节由 `spec-requirements.md` 定义

### 2.1 Requirements Documents （需求文档）

| Type | 验证规则来源 |
|------|--------------|
| `prd` | spec-requirements.md |
| `feature` | spec-requirements.md |
| `capability` | spec-requirements.md |
| `flow` | spec-requirements.md |

> **详细定义**：Feature/Capability/Flow 的定义、对比、独立性判断见 [spec-requirements.md §1.0 Core Concepts](docs/specs/spec-requirements.md#spec_req_concepts)

### 2.2 Design Documents （设计文档）

| Type | 说明 | 输入来源 | 验证规则来源 |
|------|------|----------|--------------|
| `design` | 技术设计文档（架构、接口、功能、数据模型） | PRD + Feature/Capability/Flow | spec-design.md |

**设计文档必须声明输入来源**（使用文档引用语法）：
```markdown
## Input Requirements <!-- id: design_input -->

本设计基于以下需求：
- [PRD - 用户登录模块](docs/requirements/prd.md#feat_login)
- [Feature - 认证能力](docs/requirements/capabilities/fea-auth.md#cap_auth_intent)
```

### 2.3 Test Documents （测试文档）

| Type | 说明 | 范围 | 验证规则来源 |
|------|------|------|--------------|
| `test-e2e` | 端到端测试文档 | 用户场景测试 | spec-test.md |
| `test-performance` | 性能测试文档 | 性能基准、压测 | spec-test.md |
| `test-destructive` | 破坏性测试文档 | 容错、灾难恢复 | spec-test.md |
| `test-security` | 安全测试文档 | 安全审计 | spec-test.md |

**测试粒度**：
- **代码级测试**：单元测试、集成测试（在代码中，不单独成文档）
- **系统级测试**：E2E、性能、破坏性、安全测试（独立测试文档）

### 2.4 Specification Documents （规范文档）

| Type | 说明 | 作用域 | 验证规则来源 |
|------|------|--------|--------------|
| `meta-spec` | 元规范（本文档） | 整个文档系统 | 不被验证（定义者） |
| `requirements-spec` | 需求文档规范 | 所有需求文档 | spec-meta.md |
| `design-spec` | 设计文档规范 | 所有设计文档 | spec-meta.md |
| `test-spec` | 测试文档规范 | 所有测试文档 | spec-meta.md |
| `backend-dev-spec` | 后端开发规范 | 后端代码 | spec-meta.md |
| `frontend-dev-spec` | 前端开发规范 | 前端代码 | spec-meta.md |

**规范文档层级**：
- `spec-meta.md`（宪法级）定义规范文档的格式和验证规则
- 各专项规范遵循 `meta-spec` 定义的格式

**开发规范包含**：
- 代码风格和命名约定（Linting 规则）
- 架构模式和设计模式
- 目录结构和模块组织
- 错误处理和日志规范
- 安全和性能最佳实践

---

## 3. Document Identity <!-- id: meta_identity -->

每个文档必须能被系统识别其类型。

### 3.1 Frontmatter

所有文档必须包含 YAML frontmatter：

```yaml
---
type: {doc_type}
version: {version}
# 可选字段（用于文档索引）
id: {unique_id}                   # 文档唯一标识
status: {status}                  # 文档状态
inputs: [path/to/doc.md#anchor]   # Design 文档必填
---
```

| 字段 | 必填 | 适用文档 | 说明 |
|------|------|----------|------|
| `type` | 是 | 所有文档 | 文档类型标识 |
| `version` | 是 | 所有文档 | 文档版本号 |
| `id` | 推荐 | 需求/设计文档 | 文档唯一标识，用于 index.json 索引 |
| `status` | 推荐 | 需求/设计文档 | 文档状态：`not_started` / `in_progress` / `done` |
| `inputs` | 设计文档必填 | design-doc | 输入来源（需求文档引用） |

### 3.2 Document Reference Syntax

文档之间使用锚点引用建立关联。

#### 3.2.1 引用格式

```markdown
[描述性文字](项目绝对路径#anchor_id)
```

**路径规范**：
- **项目绝对路径**：从项目根目录起始的路径（如 `docs/requirements/prd.md`）
- **不使用相对路径**：避免 `../../` 等相对路径表示法
- **显示文字**：使用描述性文字，而非路径本身

#### 3.2.2 示例

| 场景 | 引用格式 | 说明 |
|------|----------|------|
| 引用 PRD 章节 | `[PRD 用户管理模块](docs/requirements/prd.md#domain_user_management)` | 显示文字清晰表达引用内容 |
| 引用 Feature | `[用户登录功能](docs/requirements/features/fea-user-login.md#feat_login_intent)` | 用功能名而非文件名 |
| 引用设计文档 | `[用户模块架构设计](docs/designs/user-module/des-architecture.md)` | 用设计主题而非文件路径 |
| 引用执行规范 | `[工作流执行规范](.solodevflow/flows/workflows.md)` | 用规范名称而非路径 |

#### 3.2.3 反例

❌ **错误做法**：
```markdown
<!-- 使用相对路径 -->
[执行规范](../../../.solodevflow/flows/workflows.md)

<!-- 显示文字是路径 -->
[docs/requirements/prd.md](docs/requirements/prd.md)

<!-- 路径冗余 -->
[docs/requirements/prd.md](../../requirements/prd.md)
```

✅ **正确做法**：
```markdown
[工作流执行规范](.solodevflow/flows/workflows.md)
```

#### 3.2.4 Reference Parsing Rules (for Document Index)

文档索引（index.js）解析 Markdown 链接时使用以下规则：

**链接格式**：
```
[display_text](path)
[display_text](path#anchor)
```

**解析规则**：

| 组成部分 | 提取方法 | 示例 |
|----------|----------|------|
| 目标路径 | 括号内 `#` 之前的部分 | `docs/requirements/prd.md` |
| 锚点 ID | `#` 之后的部分（可选） | `prod_vision` |
| 完整引用 | `path#anchor` | `docs/requirements/prd.md#prod_vision` |

**路径规范化**：
1. 相对路径转换为项目绝对路径
2. 移除 `./` 前缀
3. 移除 `../` 并计算实际路径

**关系类型判断**：

| 上下文 | 关系类型 | 说明 |
|--------|----------|------|
| Dependencies 表格 | `depends` / `extends` | 根据 Type 列判断 |
| Consumers 表格 | `consumes` | Capability 消费关系 |
| inputs frontmatter | `references` | 设计文档输入来源 |
| 其他位置 | `references` | 一般引用关系 |

**特殊关系类型**：

| 关系类型 | 来源 | 说明 |
|----------|------|------|
| `impacts` | 影响分析工具计算 | 非文档声明，由 `analyze-impact.js` 基于依赖图反向计算 |
| `defines` | `<!-- defines: xxx -->` 注释 | 规范文档声明其定义的文档类型 |

---

## 4. Document Structure <!-- id: meta_structure -->

### 4.1 Domain Concept

**Domain 不是文档类型**，而是 PRD 中的**目录组织方式**：

```markdown
## Domain: User Management <!-- id: domain_user_management -->

### Feature: User Registration <!-- id: feat_user_registration -->
### Feature: User Login <!-- id: feat_user_login -->
```

**Domain 的作用**：
- 在 PRD 中对相关 Feature 进行分组
- 提供业务领域的视角（如 `user-management`、`payment`）
- 不影响文件系统目录结构

### 4.2 Flow Specification

Flow（跨域流程）可以：
- 在 PRD 中作为章节描述
- 独立成文档（`docs/requirements/flows/{name}.md`）

---

## 5. Directory Structure <!-- id: meta_directory -->

### 5.1 Directory Principles

| 目录 | 用途 | 受众 |
|------|------|------|
| `docs/requirements/` | 需求文档（PRD, Feature, Capability, Flow） | 产品、设计、研发 |
| `docs/designs/` | 设计文档（架构、接口、功能、数据模型） | 研发、测试 |
| `docs/tests/` | 测试文档（E2E、性能、破坏性） | 测试、研发 |
| `docs/specs/` | 规范文档（meta-spec, *-spec.md） | AI + 人类 |
| `src/` | 源代码 + 单元测试 + 集成测试 | 研发 |
| `scripts/` | 本项目的自动化脚本（含 index.js 索引生成器） | 开发者 / CI |
| `template/` | 可分发的静态模板（flows, commands, requirements, skills） | AI + 开发者 |
| `.solodevflow/` | 运行时目录（state.json, index.json, flows实例） | AI 执行 |
| `.claude/` | Claude CLI 配置（从 template/ 同步） | Claude CLI |

### 5.2 Requirements Directory

```
docs/requirements/
├── prd.md                    # 产品需求文档（必须，固定名称）
├── features/                 # 独立 Feature（复杂场景）
│   ├── fea-user-login.md     # Feature 文档使用 fea- 前缀
│   └── fea-payment-gateway.md
├── capabilities/             # 横向能力 Capability（复杂场景）
│   ├── cap-auth.md           # Capability 文档使用 cap- 前缀
│   └── cap-logging.md
└── flows/                    # 跨域流程 Flow（复杂场景）
    └── flow-order-fulfillment.md  # Flow 文档使用 flow- 前缀
```

### 5.3 Design Directory

> 设计原则和需求-设计关系见 [spec-design.md §1](docs/specs/spec-design.md#spec_design_scope)

```
docs/designs/
├── des-system-architecture.md    # 系统级架构设计
├── user-module/                   # 按模块组织
│   ├── des-architecture.md
│   ├── des-api.md
│   └── des-data-model.md
├── payment-module/
│   └── des-payment-gateway.md
└── des-auth-capability.md         # 横向能力设计
```

### 5.4 Test Directory

```
docs/tests/
├── e2e/                      # E2E 测试文档
│   ├── test-user-flows.md    # 测试文档使用 test- 前缀
│   └── test-checkout-process.md
├── performance/              # 性能测试文档，可选
│   └── test-load-testing.md
└── destructive/              # 破坏性测试文档，可选
    └── test-disaster-recovery.md
```

### 5.5 Specs Directory

```
docs/specs/
├── spec-meta.md              # 元规范（本文档），规范文档使用 spec- 前缀
├── spec-requirements.md  # 需求文档规范
├── spec-design.md        # 设计文档规范
├── spec-test.md          # 测试文档规范
├── spec-backend-dev.md       # 后端开发规范
└── spec-frontend-dev.md      # 前端开发规范，可选
```

### 5.6 Document Naming Convention <!-- id: meta_naming -->

文档命名使用**前缀标识**文档类型，不使用 `.spec` 或 `.doc` 后缀。

#### 5.6.1 Naming Rules

| 文档类型 | 前缀 | 格式 | 示例 |
|---------|------|------|------|
| **PRD** | 无 | `prd.md` | `prd.md`（固定名称） |
| **Feature** | `fea-` | `fea-{name}.md` | `fea-user-login.md` |
| **Capability** | `cap-` | `cap-{name}.md` | `cap-auth.md` |
| **Flow** | `flow-` | `flow-{name}.md` | `flow-order-fulfillment.md` |
| **Design** | `des-` | `des-{descriptive-name}.md` | `des-system-architecture.md` |
| **Test** | `test-` | `test-{name}.md` | `test-user-flows.md` |
| **Spec** | `spec-` | `spec-{name}.md` | `spec-meta.md` |

**命名规则**：
- `{name}` 使用 **kebab-case**（全小写，连字符分隔）
- **不使用** `.spec`、`.doc`、`.design` 等后缀
- **Feature**（纵向功能）：`fea-` 前缀
- **Capability**（横向能力）：`cap-` 前缀
- **Flow**（跨域流程）：`flow-` 前缀
- **Design**（设计文档）：`des-` 前缀，命名反映设计内容而非需求名称
- **Test**（测试文档）：`test-` 前缀
- **Spec**（规范文档）：`spec-` 前缀
- 文档类型通过前缀标识，与目录位置无关

---

## 6. Anchor Format <!-- id: meta_anchor -->

锚点用于文档内定位和跨文档引用。

### 6.1 Format

```markdown
## Section Title <!-- id: {identifier} -->
```

### 6.2 Rules

| 规则 | 说明 |
|------|------|
| 格式 | `<!-- id: {identifier} -->` |
| 标识符 | `[a-z][a-z0-9_]*`（小写字母开头，只含小写字母、数字、下划线） |
| 唯一性 | 文档内唯一 |
| 引用格式 |  `绝对路径#锚点` |

### 6.3 Naming Conventions

| 前缀 | 用途 | 示例 |
|------|------|------|
| `prod_` | PRD 相关章节 | `prod_vision`, `prod_users` |
| `domain_` | Domain 章节 | `domain_user_management` |
| `feat_` | Feature 章节 | `feat_login_intent`, `feat_login_acceptance` |
| `cap_` | Capability 章节 | `cap_auth_intent` |
| `flow_` | Flow 章节 | `flow_checkout_steps` |
| `design_` | Design 章节 | `design_architecture`, `design_api` |
| `test_` | Test 章节 | `test_e2e_scenarios` |
| `meta_` | Meta-spec 章节 | `meta_identity`, `meta_anchor` |

---

## 7. Specification Mapping <!-- id: meta_mapping -->

规范文档如何声明它定义了哪种文档的结构。

**重要原则**：
- 元规范（本文档）只定义**由哪个规范文档负责验证某类文档**
- 元规范**不预先规定具体的章节结构**（章节号、章节名称等）
- 具体的章节结构由各专项规范文档自行定义

**示例**：
- 元规范规定：`prd` 类型文档由 `spec-requirements.md` 验证
- `spec-requirements.md` 自行定义：PRD 必须包含哪些章节（如 Product Vision、Target Users 等）

### 7.1 Declaration Format

规范文档使用特殊注释声明它定义的文档类型：

```markdown
## Section Title <!-- defines: {doc_type} -->
```

**示例**：
```markdown
## 3. PRD Structure <!-- defines: prd -->
```

表示此章节定义了 `type=prd` 文档的结构要求。

### 7.2 Structure Definition Table

声明后必须包含结构定义表格：

| 列名 | 必填 | 说明 |
|------|------|------|
| Section | 是 | 章节名称 |
| Anchor | 是 | 锚点标识（支持 `{name}` 变量） |
| Required | 是 | 是否必填（Yes/No） |
| Description | 否 | 章节描述 |

**示例**（仅展示格式，具体章节由各规范文档定义）：
```markdown
## X. {Type} Structure <!-- defines: {type} -->

| Section | Required | Anchor | Description |
|---------|----------|--------|-------------|
| {章节名} | Yes/No | `{anchor}` | {描述} |
| ... | ... | ... | ... |
```

### 7.3 Anchor Variables

锚点中可使用变量，验证时替换为实际值：

| 变量 | 说明 | 示例 |
|------|------|------|
| `{name}` | 文档名称（从文件名推断） | `feat_{name}_intent` → `feat_login_intent` |
| `{domain}` | Domain 名称 | `domain_{domain}` → `domain_user_management` |

### 7.4 Defines Relation Extraction

`<!-- defines: {type} -->` 声明用于建立规范到文档类型的映射关系。

**声明格式**：
```markdown
## 3. PRD Structure <!-- id: spec_req_prd --> <!-- defines: prd -->
```

**解析规则**：
- 扫描所有规范文档中的 `<!-- defines: xxx -->` 注释
- 提取 `type` 值作为被定义的文档类型
- 生成关系记录

**关系结构**：

| 字段 | 值 |
|------|------|
| source_id | 规范文档锚点（如 `spec_req_prd`） |
| target_type | 被定义的文档类型（如 `prd`） |
| relation_type | `defines` |

**示例**：
- `spec-requirements.md#spec_req_prd` → defines → `prd`
- `spec-requirements.md#spec_req_feature` → defines → `feature`
- `spec-test.md#spec_test_e2e` → defines → `test-e2e`

**用途**：
- 文档索引可查询"哪个规范定义了某类文档"
- 验证器可定位结构定义位置

---

## 8. Validation Behavior <!-- id: meta_validation -->

验证器的行为规则。

### 8.1 Validation Scope

| 文档类型 | 验证行为 |
|----------|----------|
| `type: meta-spec` | 不验证结构（元规范是根） |
| `type: *-spec` | 不验证结构（规范文档是定义者） |
| 其他类型 | 按对应规范验证 |

### 8.2 Validation Process

```
1. 读取文档 frontmatter.type
2. 在规范文档中查找 <!-- defines: {type} --> 声明
3. 解析结构定义表格
4. 验证文档是否符合定义
5. 检查锚点格式和唯一性
6. 验证文档引用的有效性（如 Design 文档的 inputs）
7. 输出验证结果
```

### 8.3 Error Levels

| Level | 说明 | 示例 |
|-------|------|------|
| ERROR | 必须修复 | 缺少必填章节、frontmatter 格式错误 |
| WARNING | 建议修复 | 锚点格式不规范、引用路径不存在 |
| INFO | 仅提示 | 可选章节缺失、文档建议 |

---

## 9. Change Management <!-- id: meta_change -->

元规范变更是"宪法级"事件。

### 9.1 Change Criteria

元规范应极少变更，仅在以下情况考虑：
- 发现根本性设计缺陷
- 需要支持全新的文档类型
- 需要支持全新的研发流程阶段
- 外部依赖变化（如 Markdown 规范变更）

### 9.2 Change Process

1. 在 `.solodevflow/input-log.md` 记录变更原因
2. 评估对整个文档系统的影响
3. 更新 `spec-meta.md`（递增主版本号）
4. 同步更新 `scripts/validate-docs.js`
5. 更新所有受影响的规范文档（`*-spec.md`）
6. 更新所有受影响的业务文档
7. 人类审核确认
8. Git 提交并标记版本

### 9.3 Version History

| Version | Date | Changes |
|---------|------|---------|
| v1.0 | 2024-12-21 | 初始版本（需求文档系统） |
| v2.0 | 2025-12-22 | 重构：增加设计、开发、测试文档；明确文档流转关系 |
| v2.1 | 2025-12-23 | 精简：删除冗余章节，统一规范文件名引用 |
| v2.2 | 2025-12-23 | 补充：新增 test-security 测试文档类型 |
| v2.3 | 2025-12-24 | 新增知识库解析支持（链接解析规则、defines 关系提取） |
| v2.4 | 2025-12-24 | 补充 impacts/defines 特殊关系类型说明 |
| v2.5 | 2025-12-27 | 适配 v12.0.0：frontmatter 增加 id/status，知识库→文档索引，Appendix A 重写 |
| v2.6 | 2025-12-27 | 消除与 spec-requirements 的冗余，§2.1 简化为类型→规范映射 |
| v2.7 | 2025-12-27 | 消除与 spec-design 的冗余，§5.3 精简设计目录，设计原则引用 spec-design |

---

## 10. Implementation <!-- id: meta_impl -->

元规范的代码实现。

### 10.1 Validation Scripts

| 文件 | 用途 |
|------|------|
| `scripts/validate-docs.js` | 文档结构验证器（遵循本规范） |
| `scripts/validate-refs.js` | 文档引用完整性检查 |

---

## Appendix A: Document Index Schema <!-- id: meta_index_schema -->

文档索引（`.solodevflow/index.json`）由 `scripts/index.js` 自动生成。

### A.1 Index Structure

```json
{
  "generated": "ISO-8601 timestamp",
  "summary": {
    "total": 11,
    "done": 3,
    "in_progress": 3,
    "not_started": 5
  },
  "activeFeatures": ["feature-id-1", "feature-id-2"],
  "documents": [
    {
      "id": "unique-doc-id",
      "type": "feature | capability | flow | design | prd",
      "title": "Document Title",
      "status": "not_started | in_progress | done",
      "phase": "design | implementation | testing | null",
      "priority": "P0 | P1 | P2 | null",
      "domain": "domain-name | null",
      "path": "docs/requirements/features/fea-xxx.md"
    }
  ],
  "byType": { ... }
}
```

### A.2 Frontmatter Extraction

index.js 从文档 frontmatter 提取以下字段：

| Frontmatter 字段 | Index 字段 | 必填 |
|------------------|------------|------|
| `id` | `id` | 推荐 |
| `type` | `type` | 是 |
| `status` | `status` | 推荐 |
| `phase` | `phase` | 否 |
| `priority` | `priority` | 否 |
| `domain` | `domain` | 否 |

**标题提取规则**：
- 从文档首行 `# Title` 提取
- 若无 H1，使用文件名

### A.3 Usage

```bash
# 生成/更新索引
node scripts/index.js

# 验证 index.json
npm run validate:state
```

**自动触发**：
- Claude CLI Hook 在对话开始时读取 index.json
- 手动运行 `node scripts/index.js` 可强制刷新

---

*Version: v2.7*
*Created: 2024-12-21 (v1.0)*
*Updated: 2025-12-27 (v2.7)*
*Changes: v2.7 消除与 spec-design 的冗余，§5.3 精简；v2.6 消除与 spec-requirements 的冗余*
