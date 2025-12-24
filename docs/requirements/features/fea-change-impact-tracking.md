---
type: feature
version: "1.4"
priority: P0
domain: process
---

# Feature: Change Impact Tracking <!-- id: feat_change_impact_tracking -->

> 变更影响追踪机制，自动分析文档变更影响、验证契约一致性、生成子任务

---

## 1. Intent <!-- id: feat_change_impact_tracking_intent -->

### 1.1 Problem

- 修改规范文档（requirements-doc.spec.md）或模板后，不知道哪些下游文档受影响
- 修改 PRD 后，难以追踪对 Feature Spec 的影响
- 影响分析依赖人工列举，容易遗漏
- 生成的影响项无法在 state.json 中跟踪执行
- 文档可能不符合规范定义的契约（缺少章节、锚点格式错误、引用失效）
- 规范变更后，难以发现哪些文档"确实不符合"而非"可能需要检查"

### 1.2 Value

- **自动化分析**：基于依赖图自动计算影响范围
- **契约验证**：验证文档是否符合规范定义的结构和引用
- **精准定位**：不只是"可能需要检查"，而是"确实不符合"
- **子任务追踪**：将影响项转为 state.json 中的 subtasks
- **标准化输出**：与 CLAUDE.md 影响分析格式一致
- **可追溯**：每个子任务记录来源，便于回溯

---

## 2. Scope <!-- id: feat_change_impact_tracking_scope -->

### 2.1 In Scope (MVP)

- 依赖图构建（按需扫描，不持久化）
- 影响分析算法（直接 + 间接影响）
- 子任务生成（写入 state.json）
- 影响分析脚本（analyze-impact.js）
- 调用 document-validation Capability 验证受影响文档

### 2.2 Out of Scope

- 变更检测（Git diff 集成）→ 后续迭代
- 任务跟踪命令（list/complete/skip）→ 后续迭代
- 依赖图持久化缓存 → 后续迭代
- AI Skill 智能分析 → 后续迭代

---

## 3. Core Capabilities <!-- id: feat_change_impact_tracking_capabilities -->

| ID | Capability | 描述 |
|----|------------|------|
| C1 | 依赖图构建 | 扫描文档构建节点和边，支持多种依赖来源 |
| C3 | 影响分析 | 基于依赖图计算变更影响范围 |
| C4 | 子任务生成 | 将影响项转为 state.json 中的 subtasks |

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

### 3.2 C3: 影响分析

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

### 3.3 C4: 子任务生成

**输入**：影响分析结果 + 目标 Feature

**输出**：state.json 中的 subtasks 数组

**规则**：
- 每个影响项生成一个 subtask
- ID 格式：`st_{timestamp}_{index}`
- 初始状态：`pending`
- source：`impact-analysis`
- 需人类确认后写入

### 3.4 与 document-validation 的集成

影响分析通过调用 `cap-document-validation` Capability 来精确判断文档状态：

```
1. 影响分析找到"可能受影响的文档"
       ↓
2. 调用 document-validation 验证这些文档
       ↓
3. 不符合的项目生成子任务（带具体错误信息）
```

> 详细验证规则见 [cap-document-validation.md](../capabilities/cap-document-validation.md)

---

## 4. Acceptance Criteria <!-- id: feat_change_impact_tracking_acceptance -->

| Item | Verification | Pass Criteria |
|------|--------------|---------------|
| Schema v7.0 | `npm run validate` | 输出 "state.json is valid!" |
| subtasks 结构 | 检查 state.json | 活跃 Feature 有 subtasks 字段 |
| 影响分析脚本 | `node scripts/analyze-impact.js docs/specs/spec-requirements.md` | 输出标准格式报告 |
| 依赖图构建 | 脚本输出 | 正确识别 Feature Dependencies |
| 子任务生成 | 脚本输出 | 输出建议子任务列表 |
| 验证集成 | 影响分析调用 document-validation | 不符合规范的文档生成带错误信息的子任务 |

---

## Dependencies <!-- id: feat_change_impact_tracking_dependencies -->

| Dependency | Type | 说明 |
|------------|------|------|
| state-management | hard | 需要扩展 state.json schema 到 v7.0 |
| cap-document-validation | hard | 调用文档验证能力判断文档是否符合规范 |
| spec-meta | soft | 依赖图构建基于元规范定义的锚点和引用系统 |

---

## 5. Design <!-- id: feat_change_impact_tracking_design -->

### 5.1 state.json v7.0 Schema 扩展

在 `features.{featureName}` 中新增 `subtasks` 字段：

```json
{
  "schemaVersion": "7.0.0",
  "features": {
    "{featureName}": {
      "type": "code|document",
      "domain": "...",
      "docPath": "...",
      "phase": "...",
      "status": "...",
      "subtasks": [
        {
          "id": "st_1703145600000_001",
          "description": "检查 feature.spec.md 模板是否需要更新",
          "target": "docs/templates/backend/feature.spec.md",
          "status": "pending",
          "createdAt": "2024-12-21T12:00:00.000Z",
          "source": "impact-analysis"
        }
      ]
    }
  }
}
```

### 5.2 subtask 字段定义

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 唯一标识，格式 `st_{timestamp}_{index}` |
| `description` | string | 是 | 任务描述 |
| `target` | string | 否 | 目标文件路径或锚点 |
| `status` | enum | 是 | `pending` / `in_progress` / `completed` / `skipped` |
| `createdAt` | string | 是 | ISO 8601 时间戳 |
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
| `docs/specs/spec-meta.md` | 元规范文档（锚点和引用系统） |
| `scripts/analyze-impact.js` | 影响分析脚本 |
| `docs/requirements/features/fea-state-management.md` | state.json Schema 文档 |
| `docs/requirements/capabilities/cap-document-validation.md` | 文档验证能力（被调用） |

### 6.2 Usage

```bash
# 分析规范文档变更的影响
node scripts/analyze-impact.js docs/specs/spec-requirements.md

# 分析 PRD 变更的影响
node scripts/analyze-impact.js docs/requirements/prd.md
```

### 6.3 Integration with CLAUDE.md

当修改以下文件时，AI 必须运行影响分析：
- 规范文档 (`docs/specs/*.spec.md`)
- 文档模板 (`docs/templates/**`)
- PRD (`docs/prd.md`)

流程：
1. 运行 `node scripts/analyze-impact.js {changed-file}`
2. 展示影响分析报告
3. 人类确认后，将建议子任务添加到 state.json
4. 按优先级处理子任务

---

*Version: v1.4*
*Created: 2024-12-21*
*Updated: 2025-12-24*
*Changes: v1.4 移除 C5 契约验证，改为依赖 cap-document-validation Capability; v1.3 添加 frontmatter 可选字段; v1.2 扩展支持代码文件级别依赖*
