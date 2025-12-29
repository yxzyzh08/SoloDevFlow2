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
  - Designs: done/total (或 skipped)

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

## 5. Phase: DESIGN（可选）

> 为复杂 Feature 补充设计文档

**AI 行为**：

```
Step 4.1: 识别需要设计的 Feature
    ├─ 扫描所有 Feature Spec
    ├─ 筛选 design_depth: required
    └─ 列出待补充设计的 Feature 清单

Step 4.2: 逐个编写设计文档
    ├─ 对每个需要设计的 Feature：
    │   ├─ 读取 Feature Spec 理解需求
    │   ├─ 分析现有代码实现
    │   ├─ 使用 /write-design 命令
    │   └─ 更新 Feature 的 Artifacts 章节
    └─ 向用户汇报进度

Step 4.3: 用户决策
    └─ 用户可选择：
        ├─ 继续完成所有设计
        └─ 跳过，后续按需补充

Output: 设计文档（或跳过标记）
```

**跳过设计**：

```
用户说"跳过设计"
    ↓
更新 state.json:
  project.refactoring.progress.designs.skipped = true
    ↓
进入 VALIDATE 阶段
```

**退出条件**：设计文档完成或用户跳过 → 进入 VALIDATE 阶段

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
| Design | X | ✓/skipped |

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
| `node scripts/state.js summary` | 获取状态摘要 |
| `/write-prd` | 编写 PRD |
| `/write-feature <name>` | 编写 Feature Spec |
| `/write-capability <name>` | 编写 Capability Spec |
| `/write-flow <name>` | 编写 Flow Spec |
| `/write-design <name>` | 编写 Design Doc |
| `npm run validate:docs` | 验证文档 |

---

## 10. Execution Principles

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

*Version: v1.0*
*Aligned with: flow-refactoring.md v2.3*
*Created: 2025-12-29*
