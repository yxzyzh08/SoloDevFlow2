# Design Flow - Execution Spec

> AI 执行规范：设计阶段的执行流程

**需求文档**：[flow-design.md](../../docs/requirements/flows/flow-design.md)

---

## 1. Entry Check

**进入设计阶段前检查**：

```
检查是否存在设计文档
    ├─ 不存在 → Initial Design
    │     ↓
    │   检查相关需求文档状态
    │     ├─ 有 status != done → BLOCK
    │     │   提示："请先完成所有相关需求文档，才能进行初始设计"
    │     └─ 全部 done → 继续
    │
    └─ 存在 → Iterative Design → 继续
```

---

## 2. Design Flow

### 2.1 GATHER（收集上下文）

1. 读取需求文档（Feature/Capability/Flow Spec）
2. 提取 Core Functions 和 Acceptance Criteria
3. 读取现有架构文档（如有）
4. 加载设计规范 `docs/specs/spec-design.md`

### 2.2 ASSESS（评估设计深度）

| Design Depth | 条件 | 后续 |
|--------------|------|------|
| **Required** | 涉及新模块、复杂算法、多子系统交互、NFR | 继续设计流程 |
| **None** | 简单 CRUD、配置变更、复用现有模块 | 跳过设计，直接进入实现 |

**输出**：在需求文档 Artifacts 章节记录 Design Depth

### 2.3 DESIGN（编写设计）

**调用 `/write-design` 命令生成设计文档**

设计内容包括：
- 技术选型（成熟度、团队熟悉度、社区支持）
- 接口设计（API/模块接口）
- 数据模型
- 实现策略

### 2.4 REVIEW（设计审核）

```
[AI 完成设计文档]
    ↓
[phase → feature_review]
    ↓
[提示用户审核]
    ↓
[等待反馈]
    ├─ 批准 → phase → feature_implementation
    ├─ 修改 → AI 修改后重新审核
    └─ 拒绝 → 返回需求阶段
```

---

## 3. Skip Design（跳过设计）

当 Design Depth = None 时：

1. 在需求文档 Artifacts 章节记录 `Design Depth: None`
2. 执行 `node scripts/state.js set-phase <id> feature_implementation`
3. 加载 implementation.md 流程

---

## 4. Execution Principles

### 始终做

- 进入设计前检查设计模式（Initial/Iterative）
- Initial Design 必须等所有相关需求完成
- 设计前加载 spec-design.md 规范
- 设计完成后进入 review 阶段
- 等待人类显式批准才进入实现

### 绝不做

- 需求未完成就开始初始设计
- 跳过设计深度评估
- 未经审核批准直接写代码
- Initial Design 时遗漏全局架构考虑

---

## 5. Tools Reference

| 工具 | 用途 |
|------|------|
| `/write-design` | 生成设计文档 |
| `node scripts/state.js set-phase <id> <phase>` | 更新阶段 |
| `spec-design.md` | 设计文档规范 |

---

*Version: v1.0*
*Aligned with: flow-design.md v1.4*
*Updated: 2025-12-28*
