---
type: design
status: done
version: "1.0"
inputs:
  - docs/requirements/flows/flow-refactoring.md#flow_refactoring
  - docs/requirements/flows/flow-refactoring.md#flow_refactoring_module_impact
---

# Design: Refactoring Flow <!-- id: design_refactoring -->

> Refactoring Flow 技术设计 - 现有项目迁移至 SoloDevFlow 规范体系

---

## 1. Input Requirements <!-- id: design_refactoring_input -->

本设计基于以下需求：
- [Flow: Refactoring](../requirements/flows/flow-refactoring.md#flow_refactoring) - 重构流程需求
- [Module Impact Specifications](../requirements/flows/flow-refactoring.md#flow_refactoring_module_impact) - 模块变更规范

**核心需求点**：
1. **project-init 扩展**：检测现有项目，支持重构模式初始化
2. **state-management 扩展**：扩展 Schema 支持重构状态追踪
3. **hooks 增强**：SessionStart 显示重构模式上下文

---

## 2. Overview <!-- id: design_refactoring_overview -->

### 2.1 Design Goals

| 目标 | 说明 |
|------|------|
| **渐进式迁移** | 支持按阶段完成重构，可中断可恢复 |
| **状态可追踪** | 重构进度持久化，跨会话保持 |
| **低侵入性** | 最小化对现有模块的改动 |
| **向后兼容** | 非重构模式下行为不变 |

### 2.2 Constraints

| 约束 | 说明 |
|------|------|
| 复用现有 CLI | 通过扩展现有命令实现，不新增独立脚本 |
| state.json 兼容 | 新增字段可选，不破坏现有结构 |
| 阶段不可跳过 | 重构阶段必须按顺序执行 |

---

## 3. Technical Approach <!-- id: design_refactoring_approach -->

### 3.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Entry Point                               │
│                                                                  │
│  npm run init                                                    │
│       │                                                          │
│       ▼                                                          │
│  ┌─────────────┐    ┌──────────────────┐    ┌────────────────┐  │
│  │  init.js    │───▶│ detectExisting   │───▶│ User Choice    │  │
│  │             │    │ Project()        │    │                │  │
│  └─────────────┘    └──────────────────┘    └───────┬────────┘  │
│                                                      │           │
│                     ┌────────────────────────────────┼───────┐   │
│                     │                                ▼       │   │
│                     │  Yes: Refactoring Mode                 │   │
│                     │       │                                │   │
│                     │       ▼                                │   │
│                     │  initRefactoringMode()                 │   │
│                     │       │                                │   │
│                     │       ▼                                │   │
│                     │  state.json.project.refactoring        │   │
│                     │       │                                │   │
│                     │       ▼                                │   │
│                     │  SessionStart Hook                     │   │
│                     │  (显示重构上下文)                       │   │
│                     └────────────────────────────────────────┘   │
│                                                                  │
│                     ┌────────────────────────────────────────┐   │
│                     │  No: Normal Init                       │   │
│                     │  (现有逻辑，无变化)                      │   │
│                     └────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Module Changes

| 模块 | 变更类型 | 说明 |
|------|----------|------|
| scripts/init.js | 扩展 | 添加现有项目检测和重构模式初始化 |
| scripts/state.js | 扩展 | 添加重构状态管理命令 |
| src/hooks/session-start.js | 扩展 | 检测并显示重构模式上下文 |
| scripts/templates/state.json.template | 更新 | 添加 project.refactoring 字段 |

---

## 4. Interface Design <!-- id: design_refactoring_interface -->

### 4.1 init.js 扩展

```javascript
/**
 * 检测是否为现有项目（需要重构模式）
 * @returns {Object} { isExisting: boolean, indicators: string[] }
 */
function detectExistingProject() {
  // 检测条件
  const indicators = [];

  // 1. 已有 SoloDevFlow 安装 → 不是现有项目
  if (fs.existsSync('.solodevflow/')) {
    return { isExisting: false, indicators: [] };
  }

  // 2. 是 SoloDevFlow 自身 → 不是现有项目
  if (isSoloDevFlowItself()) {
    return { isExisting: false, indicators: [] };
  }

  // 3. 检测代码和文档存在
  const codeIndicators = ['src/', 'lib/', 'app/', 'packages/'];
  const docIndicators = ['docs/', 'README.md', 'CHANGELOG.md'];

  codeIndicators.forEach(dir => {
    if (fs.existsSync(dir)) indicators.push(dir);
  });

  docIndicators.forEach(file => {
    if (fs.existsSync(file)) indicators.push(file);
  });

  return {
    isExisting: indicators.length > 0,
    indicators
  };
}

/**
 * 初始化重构模式
 * @param {Object} options
 * @param {string[]} options.indicators - 检测到的现有内容
 */
async function initRefactoringMode(options) {
  // 1. 创建基础目录结构
  createDirectoryStructure();

  // 2. 创建 state.json 并启用重构模式
  const state = createInitialState();
  state.project.refactoring = {
    enabled: true,
    phase: 'understand',
    progress: {
      prd: 'not_started',
      features: { total: 0, done: 0 },
      capabilities: { total: 0, done: 0 },
      flows: { total: 0, done: 0 },
      designs: { total: 0, done: 0, skipped: false }
    },
    startedAt: toBeijingISOString(),
    completedAt: null
  };

  writeState(state);

  // 3. 输出初始化信息
  console.log('Refactoring mode initialized.');
  console.log('Next: Run Claude Code to start UNDERSTAND phase.');
}
```

### 4.2 state.js 扩展

```javascript
// === 重构阶段常量 ===
const REFACTORING_PHASES = [
  'understand',
  'prd',
  'requirements',
  'design',
  'validate',
  'completed'
];

/**
 * 设置重构阶段
 * @param {string} phase - 目标阶段
 * @returns {Object} { success: boolean, phase: string }
 */
function setRefactoringPhase(phase) {
  if (!REFACTORING_PHASES.includes(phase)) {
    throw new Error(`Invalid refactoring phase: ${phase}. Valid: ${REFACTORING_PHASES.join(', ')}`);
  }

  const state = readState();

  if (!state.project?.refactoring?.enabled) {
    throw new Error('Refactoring mode is not enabled');
  }

  const currentPhase = state.project.refactoring.phase;
  const currentIndex = REFACTORING_PHASES.indexOf(currentPhase);
  const targetIndex = REFACTORING_PHASES.indexOf(phase);

  // 只允许前进一步或保持不变（不允许跳过或回退）
  if (targetIndex > currentIndex + 1) {
    throw new Error(`Cannot skip phases. Current: ${currentPhase}, Target: ${phase}`);
  }

  state.project.refactoring.phase = phase;

  // 如果完成，记录完成时间
  if (phase === 'completed') {
    state.project.refactoring.completedAt = toBeijingISOString();
  }

  writeState(state);

  return { success: true, phase };
}

/**
 * 更新重构进度
 * @param {string} type - 类型 (prd|features|capabilities|flows|designs)
 * @param {number} done - 已完成数量
 * @param {number} total - 总数量
 * @returns {Object} { success: boolean, progress: Object }
 */
function updateRefactoringProgress(type, done, total) {
  const validTypes = ['prd', 'features', 'capabilities', 'flows', 'designs'];
  if (!validTypes.includes(type)) {
    throw new Error(`Invalid progress type: ${type}. Valid: ${validTypes.join(', ')}`);
  }

  const state = readState();

  if (!state.project?.refactoring?.enabled) {
    throw new Error('Refactoring mode is not enabled');
  }

  if (type === 'prd') {
    // prd 是状态字符串
    const validStatuses = ['not_started', 'in_progress', 'done'];
    if (!validStatuses.includes(done)) {
      throw new Error(`Invalid prd status: ${done}. Valid: ${validStatuses.join(', ')}`);
    }
    state.project.refactoring.progress.prd = done;
  } else {
    // 其他是 {total, done} 对象
    state.project.refactoring.progress[type] = { total, done };
  }

  writeState(state);

  return { success: true, progress: state.project.refactoring.progress };
}

/**
 * 获取重构状态
 * @returns {Object|null} 重构状态或 null（未启用）
 */
function getRefactoringStatus() {
  const state = readState();
  return state.project?.refactoring?.enabled ? state.project.refactoring : null;
}
```

**CLI 命令扩展**：

```bash
# 设置重构阶段
node scripts/state.js set-refactoring-phase <phase>

# 更新重构进度
node scripts/state.js update-refactoring-progress <type> <done> [total]

# 示例
node scripts/state.js set-refactoring-phase prd
node scripts/state.js update-refactoring-progress prd in_progress
node scripts/state.js update-refactoring-progress features 3 10
```

### 4.3 SessionStart Hook 扩展

```javascript
// src/hooks/session-start.js

function generateRefactoringContext(state) {
  const refactoring = state.project?.refactoring;
  if (!refactoring?.enabled) return null;

  const phaseLabels = {
    understand: 'UNDERSTAND (理解系统)',
    prd: 'PRD (编写产品文档)',
    requirements: 'REQUIREMENTS (需求分解)',
    design: 'DESIGN (设计补全)',
    validate: 'VALIDATE (验证完成)',
    completed: 'COMPLETED (重构完成)'
  };

  const progress = refactoring.progress;
  const progressLines = [];

  if (progress.prd !== 'not_started') {
    progressLines.push(`PRD: ${progress.prd}`);
  }
  if (progress.features.total > 0) {
    progressLines.push(`Features: ${progress.features.done}/${progress.features.total}`);
  }
  if (progress.capabilities.total > 0) {
    progressLines.push(`Capabilities: ${progress.capabilities.done}/${progress.capabilities.total}`);
  }
  if (progress.flows.total > 0) {
    progressLines.push(`Flows: ${progress.flows.done}/${progress.flows.total}`);
  }
  if (progress.designs.total > 0) {
    const designStatus = progress.designs.skipped
      ? 'skipped'
      : `${progress.designs.done}/${progress.designs.total}`;
    progressLines.push(`Designs: ${designStatus}`);
  }

  return `<refactoring-context>
Mode: Refactoring
Phase: ${phaseLabels[refactoring.phase] || refactoring.phase}
${progressLines.length > 0 ? 'Progress: ' + progressLines.join(', ') : ''}
Started: ${refactoring.startedAt}
</refactoring-context>`;
}
```

### 4.4 state.json Schema 扩展

```json
{
  "project": {
    "name": "string",
    "refactoring": {
      "enabled": "boolean (default: false)",
      "phase": "understand | prd | requirements | design | validate | completed",
      "progress": {
        "prd": "not_started | in_progress | done",
        "features": { "total": "number", "done": "number" },
        "capabilities": { "total": "number", "done": "number" },
        "flows": { "total": "number", "done": "number" },
        "designs": { "total": "number", "done": "number", "skipped": "boolean" }
      },
      "startedAt": "ISO date string",
      "completedAt": "ISO date string | null"
    }
  }
}
```

---

## 5. Implementation Plan <!-- id: design_refactoring_impl -->

### 5.1 Phase 1: State Management 扩展

| Step | Task | File |
|------|------|------|
| 1.1 | 添加 REFACTORING_PHASES 常量 | scripts/state.js |
| 1.2 | 实现 setRefactoringPhase 函数 | scripts/state.js |
| 1.3 | 实现 updateRefactoringProgress 函数 | scripts/state.js |
| 1.4 | 实现 getRefactoringStatus 函数 | scripts/state.js |
| 1.5 | 添加 CLI 命令解析 | scripts/state.js |
| 1.6 | 更新 state.json.template | scripts/templates/ |

### 5.2 Phase 2: Init 扩展

| Step | Task | File |
|------|------|------|
| 2.1 | 实现 detectExistingProject 函数 | scripts/init.js |
| 2.2 | 实现 initRefactoringMode 函数 | scripts/init.js |
| 2.3 | 修改 init 主流程添加重构模式分支 | scripts/init.js |
| 2.4 | 添加用户交互提示 | scripts/init.js |

### 5.3 Phase 3: Hooks 扩展

| Step | Task | File |
|------|------|------|
| 3.1 | 实现 generateRefactoringContext 函数 | src/hooks/session-start.js |
| 3.2 | 修改 SessionStart hook 输出逻辑 | src/hooks/session-start.js |
| 3.3 | 同步到 .claude/hooks/ | - |

### 5.4 Phase 4: 验证与测试

| Step | Task |
|------|------|
| 4.1 | 单元测试：state.js 新增函数 |
| 4.2 | 集成测试：init.js 重构模式初始化 |
| 4.3 | E2E 测试：完整重构流程模拟 |

---

## 6. Decision Record <!-- id: design_refactoring_decisions -->

| Decision | Options | Choice | Rationale |
|----------|---------|--------|-----------|
| 阶段跳过策略 | 允许跳过 / 严格顺序 | 严格顺序 | 确保重构质量，避免遗漏步骤 |
| 进度存储位置 | 独立文件 / state.json | state.json | 与现有状态管理统一，减少复杂度 |
| 用户交互方式 | CLI 选项 / 交互式 | 交互式 | 更友好，减少误操作 |
| 重构模式标识 | 独立字段 / 枚举状态 | 独立字段 | `project.refactoring.enabled` 更明确 |

---

## 7. Dependencies <!-- id: design_refactoring_dependencies -->

| Dependency | Type | 说明 |
|------------|------|------|
| design_hooks_integration | hard | 依赖 hooks 架构 |
| design_system_architecture | soft | 遵循系统架构约定 |

---

*Version: v1.0*
*Created: 2025-12-29*
*Updated: 2025-12-29*
