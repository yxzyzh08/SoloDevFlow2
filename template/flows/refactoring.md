<!--
  Template Source File
  修改此文件后，需要通过升级脚本同步到项目的 .solodevflow/flows/
  请勿直接修改 .solodevflow/flows/ 中的文件
-->

# Refactoring - Execution Spec

> AI 执行规范：重构模式的执行流程

**需求文档**：[flow-refactoring.md](../../docs/requirements/flows/flow-refactoring.md)

---

## 1. Session Start (Refactoring Mode)

**重构模式下每次对话开始**：

```
读取 state.json
    ↓
检查 project.refactoring.enabled
    ├─ true → 进入重构模式
    └─ false → 退出，使用 workflows.md
    ↓
汇报重构状态
    ├─ 当前 Phase
    ├─ 进度统计
    └─ 下一步建议
    ↓
等待用户指示
```

**状态汇报模板**：

```
当前模式：重构模式
阶段：[understand|prd|requirements|design|validate]
进度：
  - PRD: [not_started|in_progress|done]
  - Features: done/total
  - Capabilities: done/total
  - Flows: done/total
  - Designs: done/total

下一步：[具体建议]
```

---

## 2. Phase: UNDERSTAND

> 理解先于变更：深入理解现有系统

**AI 行为**：

```
Step 1.1: 代码结构扫描
    ├─ 扫描目录结构，识别模块划分
    ├─ 识别技术栈（框架、语言、构建工具）
    └─ 识别项目类型（Web/CLI/Library/API）

Step 1.2: 文档收集
    ├─ 读取 README、现有文档
    ├─ 提取关键信息（功能描述、架构图）
    └─ 识别文档与代码的差异

Step 1.3: 依赖分析
    ├─ 分析 package.json/requirements.txt 等
    ├─ 识别核心依赖 vs 开发依赖
    └─ 标记过时或有安全风险的依赖

Step 1.4: 系统边界确认
    └─ 向用户确认：
        ├─ 核心功能列表
        ├─ 系统边界（什么在范围内/外）
        └─ 主要用户群体

Output: 系统理解报告
```

**产出格式**：

```markdown
## 系统理解报告

### 项目概况
- 项目类型：[Web/CLI/Library/API]
- 技术栈：[框架、语言、构建工具]
- 代码规模：[文件数/行数估算]

### 核心模块
| 模块 | 路径 | 职责 | 复杂度 |
|------|------|------|--------|

### 现有文档
| 文档 | 状态 | 可复用性 |
|------|------|----------|

### 技术债务
| 问题 | 严重度 | 建议 |
|------|--------|------|

### 待确认项
- [ ] 确认项1
- [ ] 确认项2
```

**退出条件**：用户确认理解准确 → 进入 PRD 阶段

---

## 3. Phase: PRD

> 定义产品愿景和架构边界

**AI 行为**：

```
Step 2.1: 收集 PRD 素材
    ├─ 从理解报告提炼核心问题
    ├─ 从现有文档提取产品描述
    └─ 向用户确认目标用户和产品定位

Step 2.2: 定义 Domains
    ├─ 基于代码模块划分识别 Domain
    ├─ 确保每个 Domain 职责清晰
    └─ 向用户确认 Domain 划分

Step 2.3: 编写 PRD
    ├─ 使用 /write-prd 命令
    ├─ 包含 Feature Roadmap（初步列表）
    └─ 标记 Priority（P0/P1/P2）

Step 2.4: 验证
    └─ 运行 npm run validate:docs

Output: docs/requirements/prd.md
```

**PRD 质量检查清单**：
- [ ] Product Vision 清晰表达产品价值
- [ ] Domains 划分合理，无重叠
- [ ] Feature Roadmap 覆盖现有功能
- [ ] Success Criteria 可量化验证

**退出条件**：PRD 通过验证 + 用户审核通过 → 进入 REQUIREMENTS 阶段

---

## 4. Phase: REQUIREMENTS

> 增量式派生需求文档

**AI 行为**：

```
Step 3.1: 规划派生顺序
    ├─ 读取 PRD Feature Roadmap
    ├─ 按优先级排序（P0 先行）
    └─ 识别依赖关系，确定编写顺序

Step 3.2: 逐个编写 Feature Spec
    ├─ 对每个 Feature：
    │   ├─ 读取相关代码理解实现
    │   ├─ 使用 /write-feature 命令
    │   ├─ 确保 Dependencies 正确声明
    │   └─ 运行验证
    └─ 向用户汇报进度

Step 3.3: 识别横切能力
    ├─ 分析已完成的 Feature
    ├─ 识别被多个 Feature 复用的能力
    ├─ 使用 /write-capability 命令
    └─ 更新相关 Feature 的 Dependencies

Step 3.4: 定义关键流程
    ├─ 识别跨 Feature 的业务流程
    ├─ 使用 /write-flow 命令
    └─ 确保 Participants 正确引用 Feature

Output: 需求文档体系
```

**进度追踪**：

```
更新 state.json:
  project.refactoring.progress.features.done++
  project.refactoring.progress.capabilities.done++
  project.refactoring.progress.flows.done++
```

**退出条件**：PRD 中列出的所有文档都已编写 → 进入 DESIGN 阶段

---

## 5. Phase: DESIGN（强制）

> 按设计规范重构所有设计文档

**核心原则**：
- **强制执行**：无论原项目是否有设计文档，都进入设计重构阶段
- **结构重构优先**：聚焦文档组织和结构的标准化，不做内容的重大变更
- **参考原有内容**：充分复用原设计文档的有效内容

**AI 行为**：

```
Step 4.1: 识别现有设计文档
    ├─ 扫描项目中的设计相关文档
    │   ├─ docs/ 目录下的架构/设计文档
    │   ├─ 文件名含 design/architecture/spec 的文档
    │   └─ README 中的技术架构章节
    └─ 列出待重构的设计文档清单

Step 4.2: 匹配 Feature 与设计需求
    ├─ 扫描所有 Feature Spec
    ├─ 为每个 Feature 确定设计需求：
    │   ├─ design_depth: required → 必须有独立设计文档
    │   └─ design_depth: optional → 参考原有内容决定
    └─ 生成设计文档编写清单

Step 4.3: 逐个重构设计文档
    ├─ 对每个需要设计的 Feature：
    │   ├─ 读取对应的原设计文档（如有）
    │   ├─ 读取 Feature Spec 理解需求
    │   ├─ 使用 /write-design 命令（参考原内容）
    │   ├─ 确保符合设计规范结构
    │   └─ 更新 Feature 的 Artifacts 章节
    └─ 向用户汇报进度

Step 4.4: 归档原设计文档
    └─ 将原设计文档移至 docs/legacy/（见 §10）

Output: 符合规范的设计文档体系
```

**退出条件**：所有需要设计的 Feature 都已完成设计文档重构 → 进入 VALIDATE 阶段

---

## 6. Phase: VALIDATE

> 确保文档一致性，准备退出重构模式

**AI 行为**：

```
Step 5.1: 运行全量验证
    ├─ 运行 npm run validate:docs
    ├─ 检查所有文档通过验证
    └─ 报告任何验证错误

Step 5.2: 交叉引用检查
    ├─ 检查 Dependencies 引用的文档存在
    ├─ 检查 Artifacts 引用的文件存在
    └─ 检查锚点引用有效

Step 5.3: 代码覆盖检查
    ├─ 对比 PRD Feature 与 index.json
    ├─ 确保所有 PRD Feature 都有对应文档
    └─ 报告遗漏的 Feature

Step 5.4: 生成验证报告
    └─ 包含：
        ├─ 文档统计（数量、类型分布）
        ├─ 验证结果（通过/失败）
        └─ 遗留问题清单

Step 5.5: 用户最终确认
    └─ 展示报告，请求用户确认退出重构模式

Output: 验证报告 + 重构完成状态
```

**验证报告格式**：

```markdown
## 重构验证报告

### 文档统计
| 类型 | 数量 | 状态 |
|------|------|------|
| PRD | 1 | ✓ |
| Feature | X | ✓ |
| Capability | X | ✓ |
| Flow | X | ✓ |
| Design | X | ✓ |

### 验证结果
- [x] npm run validate:docs 通过
- [x] 交叉引用完整
- [x] PRD Feature 全部覆盖

### 遗留问题
（无）

### 结论
重构完成，可切换到正常工作流。
```

**退出条件**：验证通过 + 用户确认 → 退出重构模式

---

## 7. Exit Refactoring Mode

**用户确认后**：

```
更新 state.json:
  project.refactoring.enabled = false
  project.refactoring.phase = "completed"
  project.refactoring.completedAt = <timestamp>
    ↓
切换到 workflows.md 正常工作流
    ↓
提示用户："重构完成，已切换到正常工作流"
```

---

## 8. Phase Guards (Refactoring Mode)

| 当前阶段 | 允许操作 | 禁止操作 |
|----------|----------|----------|
| understand | 读取代码/文档、运行分析 | 写需求文档 |
| prd | 写 PRD | 写 Feature/Capability/Flow |
| requirements | 写需求文档 | 写设计文档 |
| design | 写设计文档 | - |
| validate | 运行验证 | 写新文档 |

---

## 9. Tools Reference

| 工具 | 用途 |
|------|------|
| `node scripts/state.cjs summary` | 获取状态摘要 |
| `/write-prd` | 编写 PRD |
| `/write-feature <name>` | 编写 Feature Spec |
| `/write-capability <name>` | 编写 Capability Spec |
| `/write-flow <name>` | 编写 Flow Spec |
| `/write-design <name>` | 编写 Design Doc |
| `npm run validate:docs` | 验证文档 |

---

## 10. Legacy Document Archiving

> 老项目文档识别与归档执行指导

### 归档规则

| 规则 | 内容 |
|------|------|
| **归档目录** | `docs/legacy/` |
| **归档时机** | 对应新文档编写完成后立即归档 |
| **版本控制** | 归档目录纳入 Git |
| **强制执行** | 重构完成前，所有识别到的老文档必须归档 |

### 老项目文档识别规则

> AI 必须主动识别并归档老项目文档

**识别范围**：

| 文档类型 | 识别规则 | 示例 |
|----------|----------|------|
| 需求文档 | 文件名含 requirement/spec/需求/功能 | `requirements.md`, `功能说明.md` |
| 设计文档 | 文件名含 design/architecture/架构/设计 | `architecture.md`, `系统设计.md` |
| 测试文档 | 文件名含 test/测试/qa | `test-plan.md`, `测试用例.md` |
| API 文档 | 文件名含 api/接口 | `api.md`, `接口文档.md` |
| 产品文档 | 文件名含 prd/product/产品 | `prd.md`, `产品说明.md` |

**识别位置**：

```
项目根目录/
├─ docs/                    # 主要扫描目录
│   ├─ *.md                 # 所有 markdown 文件
│   └─ */                   # 所有子目录
├─ *.md                     # 根目录 markdown 文件
└─ doc/                     # 备选文档目录
```

**识别排除**：

| 排除项 | 原因 |
|--------|------|
| `docs/requirements/` | SoloDevFlow 标准目录 |
| `docs/designs/` | SoloDevFlow 标准目录 |
| `docs/legacy/` | 已归档目录 |
| `.solodevflow/` | 系统目录 |

### 归档流程

```
新文档编写完成
    ↓
验证通过
    ↓
扫描并识别对应的老文档
    ├─ 按文档类型匹配
    ├─ 按功能模块匹配
    └─ 按文件内容关键词匹配
    ↓
执行归档：
    mv <老文档> docs/legacy/
    ├─ 保持原文件名
    ├─ 如有冲突，添加日期后缀（如 readme-20251230.md）
    └─ 保留目录结构（如 docs/legacy/api/）
    ↓
向用户汇报归档结果
```

### 各阶段归档时机

| 阶段 | 触发条件 | 归档内容 |
|------|----------|----------|
| PRD | 新 PRD 完成 | README 中的产品说明、老产品文档 |
| REQUIREMENTS | 每个 Feature Spec 完成 | 对应功能的老需求文档 |
| DESIGN | 每个 Design Doc 完成 | 对应模块的老架构/设计文档 |
| VALIDATE | 全量验证通过 | **强制归档剩余所有老文档** |

### VALIDATE 阶段强制归档

```
全量验证通过
    ↓
执行最终归档扫描
    ├─ 扫描所有文档目录
    ├─ 识别未归档的老文档
    └─ 列出待归档清单
    ↓
批量归档剩余老文档
    ↓
生成归档报告
    └─ 包含：已归档文档列表、归档前后路径映射
```

### 不归档的文档

- README.md（更新而非归档）
- LICENSE
- CHANGELOG.md
- 配置文件（.gitignore 等）
- 代码注释/内联文档

---

## 11. Execution Principles

### 始终做

- 每次对话开始 → 汇报重构进度
- 完成每个文档 → 更新进度统计
- 阶段切换前 → 确认退出条件满足
- 遇到不确定 → 向用户确认

### 绝不做

- 跳过 UNDERSTAND 阶段直接写文档
- 未完成前一阶段就进入下一阶段
- 未经用户确认就退出重构模式
- 在 validate 阶段写新文档

---

*Version: v1.2*
*Aligned with: flow-refactoring.md v2.5*
*Created: 2025-12-29*
*Updated: 2025-12-30*

## Changelog

- **v1.2** (2025-12-30): §5 DESIGN 从"可选"改为"强制"；§10 增强老项目文档识别规则（识别范围、识别位置、排除规则、VALIDATE 阶段强制归档）
- **v1.1** (2025-12-30): 添加 §10 Legacy Document Archiving，同步需求文档 v2.4 的归档策略
- **v1.0** (2025-12-29): 初始版本
