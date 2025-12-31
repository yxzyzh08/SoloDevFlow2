---
type: feature
id: change-impact-tracking
workMode: code
status: done
phase: done
priority: P0
domain: process
version: "2.3"
---

# Feature: Change Impact Tracking <!-- id: feat_change_impact_tracking -->

> 变更影响追踪机制，自动分析文档变更影响并生成子任务，通过 Hook 实现自动化触发

---

## 1. Intent <!-- id: feat_change_impact_tracking_intent -->

### 1.1 Problem

- 修改规范文档（spec-requirements.md）或模板后，不知道哪些下游文档受影响
- 修改 PRD 后，难以追踪对 Feature Spec 的影响
- 影响分析依赖人工列举，容易遗漏
- 需要手动运行影响分析脚本，容易忘记
- 生成的影响项需要手动添加到 state.json

### 1.2 Value

- **自动化分析**：基于依赖图自动计算影响范围
- **Hook 自动触发**：规范文件修改后自动运行影响分析
- **子任务自动写入**：影响项直接写入 state.json subtasks
- **标准化输出**：与 CLAUDE.md 影响分析格式一致
- **可追溯**：每个子任务记录来源（impact-analysis），便于回溯

---

## 2. Scope <!-- id: feat_change_impact_tracking_scope -->

### 2.1 In Scope (MVP)

- 依赖图构建（按需扫描，不持久化）
- 影响分析算法（直接 + 间接影响）
- 影响分析脚本（analyze-impact.js）
- 子任务自动写入（`--write` 参数）
- PostToolUse Hook 自动触发

### 2.2 Out of Scope

- 变更检测（Git diff 集成）→ 后续迭代
- 依赖图持久化缓存 → 后续迭代
- document-validation 集成 → 保持独立 Capability，AI 按需调用

---

## 3. Core Functions <!-- id: feat_change_impact_tracking_functions -->

| ID | Function | 描述 |
|----|------------|------|
| C1 | 依赖图构建 | 扫描文档构建节点和边，支持多种依赖来源 |
| C2 | 影响分析 | 基于依赖图计算变更影响范围 |
| C3 | 子任务写入 | 通过 `--write` 参数将影响项写入 state.json |
| C4 | Hook 自动触发 | PostToolUse Hook 检测规范文件修改并自动触发分析 |

### 3.1 C1: 依赖图构建

**输入**：docs/ 目录下的 Markdown 文件

**输出**：内存中的依赖图（nodes + edges）

**依赖来源**：
1. Feature Spec Dependencies 章节（显式声明，`hard`/`soft` 类型）
2. Markdown 链接引用（`[text](path#anchor)` 格式）
3. PRD Roadmap → Feature 关系（defines 类型）

**节点类型**：
- `prd`：产品需求文档
- `spec`：规范文档（如 requirements-doc.spec.md）
- `feature-spec`：Feature 规范
- `template`：文档模板
- `design-doc`：设计文档（v1.2 新增）
- `code`：代码文件/目录（v1.2 新增）
- `test`：测试文件（v1.2 新增）

**边类型**：
- `defines`：A 定义 B（PRD 定义 Feature）
- `implements`：A 实现 B（模板实现规范）
- `depends`：A 依赖 B（Feature 依赖 Feature）
- `references`：A 引用 B（软链接）
- `produces`：A 产出 B（Feature 产出 Artifact，v1.2 新增）
- `tests`：A 测试 B（Test 测试 Code，v1.2 新增）

### 3.2 C2: 影响分析

**输入**：变更文件路径 + 依赖图

**输出**：影响分析报告

**算法**：
```
1. 在依赖图中找到变更节点
2. 获取所有 from=变更节点 的边（谁依赖我）
3. 对每条边：
   a. 将 target 加入直接影响
   b. 递归分析 target（深度限制：2）
4. 分类：
   - 直接影响：1 跳距离
   - 间接影响：2+ 跳距离
5. 按优先级排序：spec > template > feature-spec
```

**输出格式**：
```
【变更】：{文件路径}
【直接影响】：
  - {文档A}：{需要的操作}
【间接影响】：
  - {文档B}：因为依赖 {文档A}，需要 {操作}
【建议子任务】：
  1. {任务描述}
【建议操作顺序】：{顺序}
```

### 3.3 C3: 子任务写入

**命令**：
```bash
# 仅输出分析结果（默认）
node scripts/analyze-impact.cjs docs/specs/spec-requirements.md

# 输出并写入 state.json
node scripts/analyze-impact.cjs docs/specs/spec-requirements.md --write
```

**写入规则**：
- 每个影响项生成一个 subtask
- ID 格式：`st_{timestamp}_{index}`
- 初始状态：`pending`
- source：`impact-analysis`
- 写入前检查是否已存在相同 target 的 subtask，避免重复

**subtask 结构**：
```json
{
  "id": "st_1703145600000_001",
  "featureId": "current-active-feature",
  "description": "检查 fea-xxx.md 是否需要更新",
  "target": "docs/requirements/features/fea-xxx.md",
  "status": "pending",
  "source": "impact-analysis",
  "createdAt": "2024-12-21T12:00:00.000+08:00"
}
```

### 3.4 C4: Hook 自动触发

**触发条件**：PostToolUse Hook 检测到以下文件被修改时自动触发：

| 文件模式 | 说明 |
|----------|------|
| `docs/specs/*.md` | 规范文档 |
| `docs/requirements/prd.md` | PRD 文档 |
| `template/**/*.md` | 文档模板 |

**Hook 逻辑**：
```javascript
// PostToolUse Hook
if (toolName === 'Write' || toolName === 'Edit') {
  if (matchesSpecPattern(filePath)) {
    // 自动运行影响分析
    const result = exec(`node scripts/analyze-impact.cjs "${filePath}"`);
    // 将分析结果作为 additionalContext 返回给 Claude
    return {
      hookSpecificOutput: {
        additionalContext: result
      }
    };
  }
}
```

**输出**：影响分析结果作为上下文注入 Claude，由 AI 决定是否使用 `--write` 写入

---

## 4. Acceptance Criteria <!-- id: feat_change_impact_tracking_acceptance -->

| Item | Verification | Pass Criteria |
|------|--------------|---------------|
| 影响分析脚本 | `node scripts/analyze-impact.cjs docs/specs/spec-requirements.md` | 输出标准格式报告 |
| 依赖图构建 | 脚本输出 | 正确识别 Feature Dependencies |
| 子任务输出 | 脚本输出 | 输出建议子任务列表 |
| --write 参数 | `node scripts/analyze-impact.cjs <file> --write` | subtasks 写入 state.json |
| 重复检测 | 多次运行 --write | 相同 target 不重复添加 |
| Hook 自动触发 | 修改 docs/specs/*.md | PostToolUse 返回影响分析结果 |

---

## Dependencies <!-- id: feat_change_impact_tracking_dependencies -->

| Dependency | Type | 说明 |
|------------|------|------|
| state-management | hard | 依赖 state.json subtasks 字段（当前 schema v13.0.0） |
| hooks-integration | hard | C4 Hook 自动触发依赖 PostToolUse Hook |
| spec-meta | soft | 依赖图构建基于元规范定义的锚点和引用系统 |

---

## 5. Design <!-- id: feat_change_impact_tracking_design -->

### 5.1 state.json subtasks 结构（当前 schema v13.0.0）

subtasks 位于 state.json 根级别：

```json
{
  "schemaVersion": "13.0.0",
  "subtasks": [
    {
      "id": "st_1703145600000_001",
      "featureId": "change-impact-tracking",
      "description": "检查 fea-xxx.md 是否需要更新",
      "target": "docs/requirements/features/fea-xxx.md",
      "status": "pending",
      "createdAt": "2024-12-21T12:00:00.000+08:00",
      "source": "impact-analysis"
    }
  ]
}
```

### 5.2 subtask 字段定义

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 唯一标识，格式 `st_{timestamp}_{index}` |
| `featureId` | string | 是 | 关联的 Feature ID |
| `description` | string | 是 | 任务描述 |
| `target` | string | 否 | 目标文件路径（用于去重检测） |
| `status` | enum | 是 | `pending` / `in_progress` / `completed` |
| `createdAt` | string | 是 | ISO 8601 时间戳（北京时区） |
| `source` | string | 是 | 来源：`impact-analysis` / `user` / `ai` |

### 5.3 依赖图数据结构

```typescript
interface DependencyNode {
  type: 'prd' | 'spec' | 'feature-spec' | 'template' | 'design-doc' | 'code' | 'test';
  path: string;
  anchors: string[];
  featureName?: string;  // 关联的 Feature 名称（用于反向查找）
}

interface DependencyEdge {
  from: string;   // 被依赖方（文件路径或锚点）
  to: string;     // 依赖方
  type: 'defines' | 'implements' | 'depends' | 'references' | 'produces' | 'tests';
  description?: string;
}

interface DependencyGraph {
  nodes: Map<string, DependencyNode>;
  edges: DependencyEdge[];
}
```

### 5.4 依赖解析规则

**1. Feature Spec Dependencies 章节**：
```markdown
| Dependency | Type | 说明 |
|------------|------|------|
| requirements-doc | hard | 依赖需求规范 |
```
解析为边：`requirements-doc --depends--> current-feature`

**2. Markdown 链接引用**：
```markdown
参见 [requirements-doc.spec.md](./specs/requirements-doc.spec.md#spec_req_feature_spec)
```
解析为边：`requirements-doc.spec.md#spec_req_feature_spec --references--> current-doc`

**3. PRD Roadmap Feature 列表**：
Feature 名称出现在 PRD Feature Roadmap 表格中
解析为边：`prd.md --defines--> feature-name`

**4. state.json Artifacts**（v1.2 新增）：
从 `state.json` 读取 code 类型 Feature 的 `artifacts` 字段：
```json
{
  "artifacts": {
    "design": "docs/_features/xxx.design.md",
    "code": ["src/xxx.js"],
    "tests": ["tests/xxx.test.ts"]
  }
}
```
解析为边：
- `feature-spec --produces--> design-doc`
- `feature-spec --produces--> code`
- `feature-spec --produces--> test`
- `test --tests--> code`

---

## 6. Implementation Notes <!-- id: feat_change_impact_tracking_impl -->

### 6.1 Related Files

| 文件 | 用途 |
|------|------|
| `scripts/analyze-impact.cjs` | 影响分析脚本（需实现 --write 参数） |
| `src/hooks/post-tool-use.cjs` | PostToolUse Hook（需添加影响分析触发） |
| `docs/specs/spec-meta.md` | 元规范文档（锚点和引用系统） |
| `docs/requirements/features/fea-state-management.md` | state.json Schema 文档 |

### 6.2 Usage

```bash
# 分析规范文档变更的影响（仅输出）
node scripts/analyze-impact.cjs docs/specs/spec-requirements.md

# 分析并写入 state.json
node scripts/analyze-impact.cjs docs/specs/spec-requirements.md --write

# 输出 JSON 格式（用于程序调用）
node scripts/analyze-impact.cjs docs/specs/spec-requirements.md --json
```

### 6.3 自动化流程

通过 PostToolUse Hook 自动触发：

```
修改规范文件（Write/Edit）
    ↓
PostToolUse Hook 检测到 docs/specs/*.md 变更
    ↓
自动运行 analyze-impact.js
    ↓
影响分析结果作为 additionalContext 返回给 Claude
    ↓
Claude 根据结果决定下一步操作
    ├─ 直接处理影响项
    └─ 使用 --write 写入 subtasks 后逐项处理
```

---

## 7. Artifacts <!-- id: feat_change_impact_tracking_artifacts -->

| Type | Path | Description |
|------|------|-------------|
| Script | scripts/analyze-impact.cjs | 影响分析脚本（需实现 --write） |
| Hook | src/hooks/post-tool-use.cjs | PostToolUse Hook（需添加影响分析触发） |

**Design Depth**: None（增量实现，无需独立设计文档）

---

## Changelog

- **v2.3** (2025-12-28): 实现完成，适配 index.json，添加 --write/--depth 参数，Hook 自动触发
- **v2.2** (2025-12-28): 修复 Core Functions 编号（C1-C4 连续）
- **v2.1** (2025-12-28): 修改 workMode 为 code
- **v2.0** (2025-12-28): 重构需求，添加 --write 参数、Hook 自动触发，移除 document-validation 集成
- **v1.4** (2025-12-24): 移除契约验证，改为依赖 cap-document-validation Capability
- **v1.3**: 添加 frontmatter 可选字段
- **v1.2**: 扩展支持代码文件级别依赖

---

*Version: v2.3*
*Created: 2024-12-21*
*Updated: 2025-12-28*
