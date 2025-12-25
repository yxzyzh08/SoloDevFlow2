---
type: feature
version: "1.0"
priority: P0
domain: ai-config
---

# Feature: Requirements Expert <!-- id: feat_requirements_expert -->

> 需求专家技能，解决需求处理全流程的问题：新增需求澄清、需求变更分析、规范变更影响评估

---

## 1. Intent <!-- id: feat_requirements_expert_intent -->

### 1.1 Problem

- **新增需求模糊**：用户描述的需求往往不够清晰，直接编写文档会导致质量低、返工多
- **新增需求缺乏影响分析**：新增功能可能需要老模块提供新接口，或者深入分析后发现其实是需求变更而非新增
- **需求变更缺乏影响分析**：修改现有需求时，不知道会影响哪些需求文档和设计文档
- **规范变更影响范围大**：修改规范文档后，不知道有多少文档需要同步更新
- **依赖关系未记录**：新增或修改 Feature 时，未分析和记录对其他 Feature 的依赖关系，导致开发阶段无法判断开发顺序
- **意图识别只是简单判断**：工作流中的意图识别是初步分类，深入需求分析后可能发现分类不准确（如"新增"实际是"变更"）
- **影响分析边界不清**：需求阶段应只分析到设计文档，代码影响分析是设计阶段的职责

### 1.2 Value

- **结构化澄清**：通过 3-5 轮对话，将模糊想法转化为清晰的结构化需求
- **智能分类**：自动判断变更类型和文档类型，选择正确的处理流程
- **深度分析可纠偏**：深入需求分析后，可发现初始分类错误并切换到正确流程（如发现"新增"实际是"变更"）
- **全流程影响分析**：新增、变更、规范变更都进行影响分析，展示对需求文档和设计文档的影响
- **依赖关系持久化**：分析并记录 Feature 间的依赖关系到文档 Dependencies 章节，为开发阶段提供依据
- **边界清晰**：需求阶段只分析到设计文档，代码影响留给设计阶段处理
- **流程闭环**：从澄清到编写/更新文档，再到影响处理，形成完整闭环

### 1.3 Scope Boundary

| Requirements Expert 职责 | 非 Requirements Expert 职责 |
|-------------------------|---------------------------|
| 澄清用户的变更意图 | 编写设计文档（由 design-expert 处理） |
| 判断变更类型（新增/变更/规范变更） | 编写代码（由开发流程处理） |
| 分析变更影响范围 | 编写测试（由测试流程处理） |
| 调用 write-* 命令生成文档 | 意图识别（由 CLAUDE.md 定义规则） |
| 生成 subtasks 处理影响 | 产品咨询回答（由知识库 + AI 处理） |

---

## 2. Core Capabilities <!-- id: feat_requirements_expert_capabilities -->

| ID | Capability | 描述 |
|----|------------|------|
| C1 | 变更类型分类 | 根据用户输入判断：新增需求 / 需求变更 / 规范变更 |
| C2 | 需求澄清 | 通过结构化对话澄清问题空间、方案空间、验证空间、上下文 |
| C3 | 文档类型判断 | 根据澄清结果判断应创建的文档类型（PRD/Feature/Capability/Flow） |
| C4 | 影响分析 | 分析变更对现有需求文档和设计文档的影响 |
| C5 | 依赖关系分析 | 分析 Feature 对其他 Feature/Capability 的依赖，保存到 Dependencies 章节 |
| C6 | 文档生成 | 调用 write-* 命令生成或更新规格文档（包含 Dependencies 章节） |
| C7 | Subtasks 生成 | 规范变更时生成处理清单，逐项处理受影响的文档 |

---

## 3. Workflow <!-- id: feat_requirements_expert_workflow -->

### 3.1 Phase 0: CLASSIFY_CHANGE（变更类型分类）

根据用户输入判断变更类型：

```
用户输入分析
    ├─ 描述新功能/新想法 → 新增需求
    ├─ 修改现有功能 → 需求变更
    │   └─ 信号：提到已有 Feature 名称、"修改"、"更新"、"调整"
    ├─ 修改规范文档 → 规范变更
    │   └─ 信号：提到 spec-*.md、"规范"、"标准"、"模板"
    └─ 无法判断 → 询问用户确认
```

**判断规则**：
1. 检查用户输入是否提及已有 Feature（通过知识库 `exists()` 查询）
2. 检查是否涉及 `docs/specs/` 目录下的文档
3. 根据关键词匹配（新增/修改/变更/规范）

### 3.2 Flow A: 新增需求

```
Phase 1: GATHER → 读取项目状态、产品上下文
Phase 2: CLARIFY → 3-5 轮结构化对话澄清需求
Phase 3: IMPACT（影响分析）
  ├─ 检查是否与现有 Feature 功能重叠
  ├─ 检查是否需要现有模块提供新接口/能力
  ├─ 检查是否实际是需求变更（现有功能可满足）
  └─ 如发现是需求变更 → 切换到 Flow B
Phase 4: DEPENDENCY（依赖关系分析）
  ├─ 分析新 Feature 依赖哪些现有 Feature/Capability
  ├─ 分析依赖类型（hard: 必须先完成 / soft: 可选增强）
  └─ 生成 Dependencies 章节内容
Phase 5: CLASSIFY → 判断文档类型（PRD/Feature/Capability/Flow）
Phase 6: STRUCTURE → EARS 格式结构化需求
Phase 7: ACTION → 确认后调用 /write-* 命令（包含 Dependencies 章节）
Phase 8: VERIFY → 验证文档完整性（包括依赖关系是否记录）
```

**说明**：意图识别阶段的分类是简单判断，需求专家在 CLARIFY 和 IMPACT 阶段会进行深入的需求分析，可能会发现初始分类不准确（如"新增需求"实际是"需求变更"），此时应切换到正确的处理流程。

**依赖关系用途**：开发阶段根据 Dependencies 章节判断开发顺序（hard 依赖必须先完成）。

### 3.3 Flow B: 需求变更

```
Phase 1b: GATHER
  ├─ 读取现有需求文档（通过知识库定位）
  ├─ 读取现有 Dependencies 章节
  ├─ 了解当前状态和历史上下文
  └─ 加载相关的设计文档（从 Artifacts 章节）

Phase 2b: CLARIFY
  ├─ 澄清变更内容（改什么）
  ├─ 澄清变更原因（为什么改）
  └─ 澄清变更范围（只改这个还是连带其他）

Phase 3b: IMPACT（影响分析）
  ├─ 检查是否有关联的设计文档 → 标记需要更新
  ├─ 检查是否有依赖此 Feature 的其他 Feature → 标记需要评估
  └─ 生成影响清单

Phase 4b: DEPENDENCY（依赖关系更新）
  ├─ 变更是否引入新的依赖？→ 添加到 Dependencies
  ├─ 变更是否移除某些依赖？→ 从 Dependencies 删除
  └─ 生成更新后的 Dependencies 章节

Phase 5b: CONFIRM
  ├─ 展示变更摘要
  ├─ 展示影响范围
  ├─ 展示依赖关系变化
  └─ 等待用户确认

Phase 6b: ACTION
  ├─ 调用 /write-feature 更新需求文档（包含更新后的 Dependencies）
  └─ 生成后续任务清单（更新设计文档）

Phase 7b: VERIFY
  └─ 验证文档更新完整性（包括依赖关系是否正确更新）
```

### 3.4 Flow C: 规范变更

```
Phase 1c: GATHER
  ├─ 读取目标规范文档
  └─ 理解规范的作用范围

Phase 2c: CLARIFY
  ├─ 澄清变更内容（改什么）
  ├─ 澄清变更原因（为什么改）
  └─ 澄清变更范围（新增章节/修改章节/删除章节）

Phase 3c: IMPACT（影响分析）
  ├─ 运行 `node scripts/analyze-impact.js <spec-file>`
  ├─ 获取所有受影响的文档列表
  │   ├─ 规范 → 需求文档（如 spec-requirements.md → 所有 Feature Spec）
  │   ├─ 规范 → 设计文档（如 spec-design.md → 所有 Design Doc）
  │   └─ 规范 → 代码（如有模板/生成器）
  └─ 生成处理清单（subtasks）

Phase 4c: CONFIRM & ACTION
  ├─ 展示影响范围和处理清单
  ├─ 用户确认后，逐项处理：
  │   ├─ 更新规范文档本身
  │   └─ 遍历 subtasks，对每个受影响文档：
  │       ├─ 评估是否需要修改
  │       ├─ 如需要，调用对应的 write-* 命令更新
  │       └─ 标记完成
  └─ 汇报处理结果
```

---

## 4. Impact Analysis <!-- id: feat_requirements_expert_impact -->

### 4.1 影响分析触发条件

| 变更类型 | 触发影响分析 | 触发依赖分析 | 分析方式 |
|----------|-------------|-------------|----------|
| 新增需求 | 必须 | 必须 | 检查与现有 Feature 的关系、是否需要老模块提供新能力、分析依赖关系 |
| 需求变更 | 必须 | 必须 | 检查关联的需求文档和设计文档、更新依赖关系 |
| 规范变更 | 必须 | 不适用 | 运行 analyze-impact.js 全量扫描 |

### 4.2 影响分析边界

**需求阶段的影响分析只分析到设计文档，不分析代码影响**。

| 分析范围 | 需求阶段 | 设计阶段 |
|----------|----------|----------|
| 需求文档（PRD/Feature/Capability/Flow） | ✅ 分析 | - |
| 设计文档（des-*.md） | ✅ 分析 | ✅ 分析 |
| 代码文件 | ❌ 不分析 | ✅ 分析 |
| 测试文件 | ❌ 不分析 | ✅ 分析 |

**例外情况**：当需求文档的 Artifacts 直接关联脚本（designDepth: None，无设计文档）时，影响分析会包含这些脚本文件。

```
Feature Spec (Artifacts)
  ├─ Design: des-xxx.md → 分析到此为止（正常情况）
  │     └─ Code: src/xxx.js → 设计阶段分析
  │
  └─ Code: scripts/xxx.js → 无设计文档，需求阶段分析（例外）
```

### 4.3 影响分析输出格式

```markdown
## 影响分析结果

### 变更文档
- {变更的文档路径}

### 需求层影响
| 文档 | 类型 | 影响原因 | 处理方式 |
|------|------|----------|----------|
| fea-xxx.md | Feature | 需要提供新接口 | 更新 Capabilities 章节 |
| fea-yyy.md | Feature | 功能边界调整 | 评估是否需要修改 |

### 设计层影响
| 文档 | 类型 | 影响原因 | 处理方式 |
|------|------|----------|----------|
| des-xxx.md | Design | 接口变更 | 设计阶段处理 |

### 直接关联脚本（无设计文档）
| 文件 | 关联需求 | 影响原因 |
|------|----------|----------|
| scripts/xxx.js | fea-yyy | 需要同步更新 |

### 处理清单
1. [ ] 更新 fea-xxx.md 的 Capabilities 章节
2. [ ] 评估 fea-yyy.md 是否需要修改
3. [ ] 标记 des-xxx.md 需要设计阶段处理
```

### 4.4 依赖关系分析

**依赖关系必须保存到文档的 Dependencies 章节**，供开发阶段使用。

#### 依赖类型

| 类型 | 含义 | 开发阶段影响 |
|------|------|-------------|
| `hard` | 必须先完成 | 被依赖的 Feature 必须先开发完成 |
| `soft` | 可选增强 | 可以并行开发，后续集成 |

#### 依赖分析输出格式

```markdown
## Dependencies <!-- id: feat_{name}_dependencies -->

| Dependency | Type | 说明 |
|------------|------|------|
| feat_auth | hard | 需要认证模块提供用户身份验证接口 |
| feat_logging | soft | 可选集成日志记录能力 |
| cap_cache | hard | 依赖缓存能力提升性能 |
```

#### 依赖变更检测（需求变更时）

```markdown
## 依赖关系变化

### 新增依赖
| Dependency | Type | 原因 |
|------------|------|------|
| feat_xxx | hard | 变更后需要 xxx 提供新接口 |

### 移除依赖
| Dependency | 原因 |
|------------|------|
| feat_yyy | 变更后不再需要 yyy 的能力 |
```

---

## 5. Acceptance Criteria <!-- id: feat_requirements_expert_acceptance -->

> 以下验收标准由人类在实际使用中验收，不支持自动化测试。

| Item | 人类验收方式 | 通过标准 |
|------|-------------|----------|
| 变更类型分类 | 人类观察 AI 对输入的分类结果 | AI 能区分新增需求、需求变更、规范变更，分类错误时人类可纠正 |
| 需求澄清质量 | 人类评估澄清对话的有效性 | 澄清问题切中要害，3-5 轮后需求明显比输入时清晰 |
| 影响分析完整性 | 人类审核影响分析结果 | 列出的影响范围与人类预期一致，无重大遗漏 |
| 依赖关系准确性 | 人类审核 Dependencies 章节 | 依赖关系符合实际，Type（hard/soft）判断合理 |
| 影响分析边界 | 人类检查分析结果 | 需求阶段只分析到设计文档，不越界分析代码（除非无设计文档） |
| 流程切换正确 | 人类观察流程切换时机 | 深入分析后发现分类错误时，AI 能主动切换到正确流程 |
| 文档生成质量 | 人类审核生成的文档 | 文档符合规范，包含完整的 Dependencies 章节 |
| Subtasks 可执行 | 人类审核处理清单 | 清单条目明确、可执行，覆盖所有受影响文档 |

---

## 6. Dependencies <!-- id: feat_requirements_expert_dependencies -->

| Dependency | Type | 说明 |
|------------|------|------|
| spec-requirements | hard | 依赖需求规范定义的文档结构 |
| feat_knowledge_base | hard | 依赖知识库判断 Feature 是否存在 |
| feat_change_impact_tracking | hard | 依赖影响分析脚本 |
| feat_write_commands | hard | 依赖 write-* 命令生成文档 |

---

## 7. Consumers <!-- id: feat_requirements_expert_consumers -->

| Consumer | 使用场景 |
|----------|----------|
| flow_workflows | 需求交付流程中调用需求专家澄清需求 |
| CLAUDE.md | 定义何时触发需求专家技能 |

---

## 8. Artifacts <!-- id: feat_requirements_expert_artifacts -->

| Type | Path | Description |
|------|------|-------------|
| Skill | .claude/skills/requirements-expert/SKILL.md | 技能定义文件 |
| Reference | .claude/skills/requirements-expert/reference/ | 参考资料（澄清清单、EARS 格式） |

**Design Depth**: None（文档型 Feature，无需设计文档）

---

## 9. Open Questions <!-- id: feat_requirements_expert_questions -->

| Question | Context | Impact |
|----------|---------|--------|
| 是否需要自动触发？ | 当前需要用户显式调用 /requirements-expert | 可在 CLAUDE.md 中定义智能触发规则 |
| 影响分析的深度？ | 当前仅分析直接依赖 | 可扩展为多层级联影响分析 |

---

*Version: v1.2*
*Created: 2025-12-25*
*Updated: 2025-12-25*
*Changes: v1.2 新增依赖关系分析能力（C5），依赖关系必须保存到文档 Dependencies 章节供开发阶段使用；v1.1 新增需求也需要影响分析（检查与现有模块的关系）；明确影响分析边界（只到设计文档，除非无设计直接关联代码）*
