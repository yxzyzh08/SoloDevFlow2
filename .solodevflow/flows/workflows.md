# Workflows - Execution Spec

> AI 执行规范：定义 AI 如何响应用户输入并维护状态

**需求文档**：[flow-workflows.md](docs/requirements/flows/flow-workflows.md)

---

## 1. Session Start

**每次对话开始执行**：

1. 读取 `.solodevflow/state.json`
2. 汇报状态：项目名 / 当前 Feature / 阶段 / 状态
3. 设置 session.mode = `idle`
4. 等待用户指示

---

## 2. Input Analysis

**每次接收用户输入，首先判断类型**：

```
用户输入
    ↓
判断输入类型
    ├─ 直接执行 → 立即执行，不走流程
    ├─ 产品咨询 → 咨询流程 (§4.1)
    ├─ 新增需求 → 需求流程 (§4.2)
    ├─ 需求变更 → 需求流程 (§4.2) + 影响评估
    ├─ 规范变更 → 影响分析流程 (§4.3)
    └─ 无关想法 → 直接拒绝，建议创建新项目
```

### 2.1 判断标准

| 类型 | 识别信号 | 示例 |
|------|----------|------|
| **直接执行** | 简单明确、单步操作、不涉及设计变更 | "修复第42行空指针"、"运行测试"、"查看git日志" |
| **产品咨询** | 询问功能、进度、实现方式 | "这个功能怎么实现的？"、"当前进度？" |
| **新增需求** | 描述新功能、想做什么 | "我想加一个导出功能" |
| **需求变更** | 修改已有功能行为 | "把登录改成手机号验证" |
| **规范变更** | 修改 docs/specs/* 或模板 | "更新需求文档规范" |
| **无关想法** | 与本产品完全无关 | "帮我写个爬虫" |

### 2.2 边界判断

- "修复登录问题" → ❌ 不是直接执行（问题不明确，需先咨询）
- "修复 login.js 第42行空指针" → ✅ 直接执行
- 无法判断 → 向用户澄清

---

## 3. Session State

**三种模式**：

| 模式 | 说明 | 进入条件 | 退出条件 |
|------|------|----------|----------|
| `idle` | 空闲等待 | 对话开始 / 任务完成 | 接收到输入 |
| `consulting` | 咨询中 | 产品咨询输入 | 隐式/显式结束 |
| `delivering` | 需求交付中 | 需求输入 / 处理暂存需求 | 交付完成 |

### 3.1 混合输入处理

当咨询中检测到需求成分：

1. **提取需求** → 记录到 `pendingRequirements`（内存暂存）
2. **继续咨询** → 先回答咨询问题
3. **咨询结束后** → 提示："有 N 条暂存需求待处理，是否现在处理？"

### 3.2 咨询结束判断

- **隐式**：用户开始描述纯需求
- **显式**：用户说"咨询完了"、"没问题了"

---

## 4. Core Flows

### 4.1 Consulting Flow（咨询流程）

```
[用户咨询]
    ↓
[检查是否包含需求成分] ─是→ [提取需求] → [存入 pendingRequirements]
    ↓
[加载 PRD]
    ↓
[通过 state.json 的 docPath 定位相关文档]
    ↓
[生成回答]
    ↓
[检查 pendingRequirements]
    ├─ 有 → 附加提示："有暂存需求待处理"
    └─ 无 → 等待下一输入
```

**关联项目查询**：若用户询问关联项目，读取对应项目的 state.json（只读）。

### 4.2 Requirements Flow（需求流程）

```
[需求输入]
    ↓
[需求清晰度检查]
    ├─ 模糊 → 调用 /requirements-expert 澄清 → 返回
    └─ 清晰 → 继续
    ↓
[关系分析]
  - 扩展现有 Feature？→ 更新已有 Feature Spec
  - 依赖其他 Feature？→ 记录 dependencies
  - 影响现有行为？→ 触发影响分析 (§4.3)
    ↓
[确定文档类型：PRD / Feature / Capability / Flow]
    ↓
[调用对应 /write-* 命令]
    ↓
[等待用户审核]
```

**阶段守卫**：若用户请求与当前阶段不符（如需求阶段要求写代码），提供选项：
1. 切换到对应阶段
2. 取消请求

### 4.3 Change Impact Flow（影响分析流程）

**触发条件**：修改 `docs/specs/*`、PRD、或模板文件

```
[变更请求]
    ↓
[运行 node scripts/analyze-impact.js <file>]
    ↓
[展示影响范围：文档/设计/代码/测试]
    ↓
[等待用户确认]
    ├─ 确认 → 生成 subtasks，按顺序处理
    └─ 取消 → 中止
```

**处理顺序**：specs → requirements → designs → code → tests

---

## 5. Pending Requirements

**处理暂存需求**：

触发：用户说"处理需求"，或咨询结束后自动提示

对每条暂存需求，询问用户：
- **转为正式需求** → 进入需求流程 (§4.2)
- **暂时保留** → 保持暂存
- **丢弃** → 移除

---

## 6. Execution Principles

### 始终做

- 每次输入 → 先判断输入类型（§2）
- 直接执行类型 → 立即执行，不走流程
- 咨询+需求混合 → 提取需求暂存，先回答咨询
- 咨询结束后 → 检查暂存需求，有则提示
- 编写文档前 → 加载对应规范（spec-requirements / spec-design）
- 状态更新 → 通过 `node scripts/state.js`，不直接编辑 state.json
- 完成 subtask/feature 后 → git commit

### 绝不做

- 咨询过程中打断去处理需求
- 跳过输入分析直接执行（除非明确判断为"直接执行"类型）
- 丢失用户的暂存需求
- 将复杂问题错判为"直接执行"
- 需求阶段写代码
- 跳过影响分析直接执行规范变更
- 修改关联项目的文件

---

## 7. Tools Reference

### 7.1 Commands（文档生成）

| 命令 | 用途 |
|------|------|
| `/write-prd` | 编写/更新 PRD |
| `/write-feature` | 编写/更新 Feature Spec |
| `/write-capability` | 编写/更新 Capability Spec |
| `/write-flow` | 编写/更新 Flow Spec |
| `/write-design` | 编写/更新 Design 文档 |

### 7.2 Skills（智能辅助）

| 技能 | 触发场景 |
|------|----------|
| `/requirements-expert` | 需求模糊、需要澄清、不确定文档类型 |

### 7.3 Scripts（验证工具）

| 脚本 | 用途 |
|------|------|
| `node scripts/state.js summary` | 显示状态摘要 |
| `node scripts/state.js get-feature <name>` | 获取 Feature 详情 |
| `node scripts/validate-state.js` | 校验 state.json |
| `node scripts/analyze-impact.js <file>` | 影响分析 |

### 7.4 Auto-Commit

完成 subtask 或 feature 后：

```bash
git add -A && git commit -m "feat(<feature-name>): <描述>"
```

---

## 8. Project Config

### 8.1 Linked Projects

| 项目 | 路径 | 说明 |
|------|------|------|
| CVM_Demo2 | `d:\github_projects\CVM_Demo2` | SoloDevFlow 验证项目 |

---

*Version: v6.0 (Simplified)*
*Aligned with: flow-workflows.md v5.2*
*Updated: 2025-12-25*
