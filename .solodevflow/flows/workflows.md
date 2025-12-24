# Workflows - Execution Spec

> AI 执行规范：定义 AI 如何响应用户输入并维护状态

**需求文档**：[工作流需求文档](docs/requirements/flows/flow-workflows.md)

---

> AI 执行规范：定义 AI 如何响应用户输入并维护状态

**产出文件**：`.solodevflow/flows/workflows.md`（由 project-init 部署）

### 1 Intent Recognition <!-- id: exec_intent_recognition -->

AI 需识别人类输入类型，路由到对应流程：

| 意图类型 | 识别信号 | 路由目标 |
|----------|----------|----------|
| **需求交付** | 描述功能需求、想做什么 | → 需求交付流程（2.2） |
| **功能咨询** | 询问现有功能、怎么实现的 | → 功能咨询流程（2.4） |
| **变更请求** | 修改规范/PRD/模板 | → 变更影响流程（2.5） |
| **灵光想法** | 与当前任务无关的想法 | → 灵光处理流程（2.6） |
| **关联项目查询** | 询问关联项目状态 | → 关联项目查看流程（2.7） |
| **阶段不符** | 输入与当前阶段不符 | → 阶段引导（2.8） |

---

### 2 Flow Steps <!-- id: exec_flow_steps -->

#### 2.0 Flow Execution Principles <!-- id: exec_flow_principles -->

所有流程执行时 MUST 遵守的共享原则：

**P1: State-Driven Execution**
- MUST 首先读取 `.solodevflow/state.json` 作为唯一状态源
- MUST 基于 state.json 中的 `phase`、`status`、`activeFeatures` 做决策
- MUST NOT 维护其他状态文件或内存状态

**P2: Document-First Approach**
- MUST 在代码变更前先更新需求/设计文档
- MUST 在文档更新前加载对应规范（spec-requirements.md / spec-design.md）
- SHOULD 使用 `/write-*` 命令确保文档符合规范

**P3: Relationship Analysis**
- SHOULD 在新增 Feature 时分析与现有 Feature 的关系（扩展/依赖/影响）
- MUST 在变更规范时运行影响分析（`node scripts/analyze-impact.js`）
- SHOULD 在 state.json 中记录 Feature 依赖关系

**P4: Non-Interrupting Capture**
- MUST 将与当前任务无关的想法记录到 `spark-box.md`
- MUST NOT 打断当前任务去处理灵光
- SHOULD 在 Feature 完成或阶段切换时提示处理灵光

**P5: Change Processing Order**
- MUST 按顺序处理变更：规范变更 → 影响分析 → Feature 更新 → 代码实现
- MUST 在修改模板文件时运行影响分析
- SHOULD 生成 subtasks 逐个处理影响项

**P6: Error Handling Strategy**
- MUST 在遇到错误时先报告问题和原因
- SHOULD 提供建议解决方案
- MUST 等待用户确认后再执行修复（MUST NOT 自动修复 state.json）

**P7: Constraint Enforcement**
- MUST 使用 RFC 2119 关键词定义约束强度：
  - **MUST**: 必须执行，违反即为错误
  - **SHOULD**: 强烈建议，特殊情况可偏离
  - **MAY**: 可选，根据具体情况决定
- MUST 在步骤表的"Constraint"列明确标注约束级别

---

#### 2.1 Session Start Flow <!-- id: exec_session_start -->

**Metadata**:
- **触发条件**: User starts new conversation (any input without active context)
- **前置条件**: `.solodevflow/state.json` exists and is valid
- **后置条件**: State reported to user, AI awaiting next instruction

**Flow Diagram**:
```
[User Input] → [Read state.json] → [Validate Schema] → [Extract Info] → [Generate Report] → [Output & Wait]
```

**Detailed Steps**:

| Step | Action | Constraint | Output |
|------|--------|------------|--------|
| 1 | Read `.solodevflow/state.json` | MUST validate JSON schema first | `{state}` object |
| 2 | Extract current feature from `flow.activeFeatures[0]` | MUST handle empty array case | `{feature}` or `null` |
| 3 | Get feature metadata (phase, status, dependencies) | MUST include all metadata fields | `{metadata}` |
| 4 | Count pending sparks from `sparks.length` | SHOULD count array length | `{sparkCount}` |
| 5 | Generate structured status report | MUST use AI Output Template format | `{report}` JSON |
| 6 | Output report to user | MUST wait for user instruction | - |

**Error Handling**:

| Error | Cause | Solution |
|-------|-------|----------|
| state.json not found | Project not initialized | Suggest: `node scripts/init.js` to initialize project |
| Invalid JSON schema | Corrupted state file | Suggest: `node scripts/validate-state.js` to check schema |
| activeFeatures empty | No feature in progress | Report "No active feature, awaiting new task" |
| Missing required fields | Incomplete state.json | Report missing fields, suggest manual inspection |

**AI Output Template**:
```json
{
  "status": "success",
  "project": {
    "name": "string",
    "type": "backend | frontend | fullstack",
    "description": "string"
  },
  "currentFeature": "feature-name | null",
  "phase": "pending | in_progress | done",
  "status": "not_started | in_progress | completed",
  "pendingSparks": 0,
  "message": "等待指示"
}
```

**Example**:
```json
{
  "status": "success",
  "project": {
    "name": "SoloDevFlow 2.0",
    "type": "backend",
    "description": "为超级个体打造的自进化人机协作开发系统"
  },
  "currentFeature": "project-init",
  "phase": "pending",
  "status": "in_progress",
  "pendingSparks": 0,
  "message": "等待指示"
}
```

#### 2.2 Requirements Delivery Flow <!-- id: exec_requirements_delivery -->

**Metadata**:
- **触发条件**: User describes new feature requirements, changes to existing features, or bug fixes
- **前置条件**: state.json accessible, relevant specs loaded (spec-requirements.md)
- **后置条件**: Requirement document created/updated, validated, awaiting user approval

**Flow Diagram**:
```
[User Input] → [Clarity Check] → [Clear?] ─No→ [requirements-expert] → [Clarified]
                                    │                                      │
                                   Yes                                     │
                                    ↓                                      │
                            [Relationship Analysis] ←─────────────────────┘
                                    ↓
                            [Call /write-*] → [Generate Doc] → [Validate] → [Output]
```

**Detailed Steps**:

| Step | Action | Constraint | Output |
|------|--------|------------|--------|
| 1 | Assess requirement clarity | MUST check for ambiguous terms, missing scope, unclear acceptance criteria | `clarity: clear \| ambiguous` |
| 2 | If ambiguous, trigger `requirements-expert` skill | MUST invoke skill for clarification | `{clarifiedRequirement}` |
| 3 | Analyze relationship with existing features | SHOULD check: extends existing? depends on? impacts behavior? | `{relationshipReport}` |
| 4 | Determine document type (PRD/Feature/Capability/Flow) | MUST follow spec-requirements.md rules | `{docType}` |
| 5 | Call appropriate `/write-*` command | MUST use correct command based on doc type | `{docDraft}` |
| 6 | Run validation script | SHOULD execute `npm run validate:docs` | `{validationResult}` |
| 7 | Output for user review | MUST wait for user approval before committing | - |

**Error Handling**:

| Error | Cause | Solution |
|-------|-------|----------|
| requirements-expert not available | Skill not configured | Manually clarify with user questions |
| Invalid document structure | Wrong template used | Re-generate using correct `/write-*` command |
| Validation fails | Missing required sections | Show validation errors, guide user to fix |
| Conflicting feature relationship | Overlaps with existing feature | Report conflict, ask user to decide: merge or separate |

**Relationship Analysis Checklist**:
- Is this extending an existing feature? → Update existing Feature Spec
- Does this depend on other features? → Record in `dependencies` field
- Does this impact existing feature behavior? → Trigger Change Impact Flow (2.5)

**AI Output Template**:
```json
{
  "status": "success",
  "clarity": "clear | ambiguous",
  "documentType": "prd | feature | capability | flow",
  "relationships": {
    "extends": ["feature-name"],
    "dependsOn": ["feature-name"],
    "impacts": ["feature-name"]
  },
  "generatedDoc": "path/to/doc.md",
  "validationResult": "passed | failed",
  "nextAction": "awaiting_user_review"
}
```

**Example**:
```json
{
  "status": "success",
  "clarity": "clear",
  "documentType": "feature",
  "relationships": {
    "extends": [],
    "dependsOn": ["state-management"],
    "impacts": []
  },
  "generatedDoc": "docs/requirements/features/fea-new-feature.md",
  "validationResult": "passed",
  "nextAction": "awaiting_user_review"
}
```

#### 2.3 Design Phase Flow <!-- id: exec_design_phase -->

**Metadata**:
- **触发条件**: Feature Spec completed for code-type features (type: code in state.json)
- **前置条件**: Feature Spec exists, state.json shows feature phase = "in_progress"
- **后置条件**: Design decision recorded in state.json (`designDepth: none|required`), design doc created if required

**Flow Diagram**:
```
[Feature Spec Done] → [Assess Complexity] → [Design Depth?]
                                                │
                                    ┌───────────┴───────────┐
                                    ↓                       ↓
                                 [none]                [required]
                                    ↓                       ↓
                          [Update state.json]    [Call /write-design]
                          [Skip to Implementation]        ↓
                                                  [Generate Design Doc]
                                                           ↓
                                                  [Update state.json]
```

**Detailed Steps**:

| Step | Action | Constraint | Output |
|------|--------|------------|--------|
| 1 | Assess feature complexity | MUST evaluate: architectural decisions? multi-module? external integrations? | `{complexityReport}` |
| 2 | Determine `designDepth` level | MUST follow Design Depth criteria (see below) | `designDepth: none \| required` |
| 3 | Update state.json with `designDepth` | MUST record decision in feature metadata | Updated state.json |
| 4 | If `designDepth: required`, call `/write-design` | MUST generate design doc before coding | `{designDoc}` |
| 5 | If `designDepth: none`, proceed to implementation | MAY skip design phase | - |
| 6 | Update feature phase | SHOULD set phase = "in_progress" (design/code) | Updated state.json |

**Design Depth Criteria**:

| Level | Conditions (ANY match → use this level) | Outputs |
|-------|----------------------------------------|---------|
| `none` | Simple logic, clear boundaries, no architectural decisions, single file/module, standard patterns | No design doc, proceed to code |
| `required` | Architectural decisions needed, multi-module integration, external API design, data model changes, performance concerns, security implications | Design doc required (architecture, interfaces, data models) |

**Error Handling**:

| Error | Cause | Solution |
|-------|-------|----------|
| Feature Spec not found | Design triggered prematurely | Return to Requirements Delivery Flow (2.2) |
| Uncertain complexity | Ambiguous scope | Ask user: "Does this feature require architectural design?" |
| Design doc validation fails | Missing required sections | Show validation errors, regenerate with `/write-design` |

**AI Output Template**:
```json
{
  "status": "success",
  "feature": "feature-name",
  "designDepth": "none | required",
  "complexity": {
    "architecturalDecisions": false,
    "multiModule": false,
    "externalIntegration": false,
    "dataModelChanges": false
  },
  "designDoc": "path/to/design.md | null",
  "nextPhase": "implementation"
}
```

**Example** (Design Required):
```json
{
  "status": "success",
  "feature": "state-management",
  "designDepth": "required",
  "complexity": {
    "architecturalDecisions": true,
    "multiModule": true,
    "externalIntegration": false,
    "dataModelChanges": true
  },
  "designDoc": "docs/designs/features/des-state-management.md",
  "nextPhase": "implementation"
}
```

**Example** (Design Skipped):
```json
{
  "status": "success",
  "feature": "simple-util",
  "designDepth": "none",
  "complexity": {
    "architecturalDecisions": false,
    "multiModule": false,
    "externalIntegration": false,
    "dataModelChanges": false
  },
  "designDoc": null,
  "nextPhase": "implementation"
}
```

#### 2.4 Feature Inquiry Flow <!-- id: exec_feature_inquiry -->

**Metadata**:
- **触发条件**: User asks about existing features, capabilities, or product details
- **前置条件**: state.json exists, PRD accessible
- **后置条件**: Structured answer provided to user

**Flow Diagram**:
```
[User Question] → [Load PRD] → [Locate Feature] → [Get docPath from state.json] → [Read Docs] → [Answer]
                                                                ↓
                                                    [Improvement Found?] ─Yes→ [Suggest transition to Requirements Delivery]
```

**Detailed Steps**:

| Step | Action | Constraint | Output |
|------|--------|------------|--------|
| 1 | Load PRD to identify feature | MUST search PRD sections to locate feature | `{featureName}` |
| 2 | Query state.json for feature metadata | MUST extract `docPath`, `phase`, `status` | `{metadata}` |
| 3 | Read relevant documents (Feature Spec, Design Doc, Code) | SHOULD read all related docs for comprehensive answer | `{docContent}` |
| 4 | Generate structured answer | MUST include: current status, key capabilities, limitations | `{answer}` |
| 5 | Assess if improvement opportunities found | MAY suggest enhancements if gaps identified | `{suggestions}` |
| 6 | If improvements suggested, ask user transition to Requirements Delivery | SHOULD offer to create Feature Spec for enhancement | - |

**Error Handling**:

| Error | Cause | Solution |
|-------|-------|----------|
| Feature not found in PRD | Typo or non-existent feature | Search similar names, suggest available features |
| docPath missing in state.json | Feature not yet implemented | Report status: "Feature planned but not started" |
| Document file not found | File moved or deleted | Report issue, suggest checking git history |
| Ambiguous question | User intent unclear | Ask clarifying questions: "Are you asking about X or Y?" |

**AI Output Template**:
```json
{
  "status": "success",
  "feature": "feature-name",
  "currentStatus": {
    "phase": "pending | in_progress | done",
    "status": "not_started | in_progress | completed"
  },
  "answer": {
    "summary": "Brief overview",
    "capabilities": ["cap1", "cap2"],
    "limitations": ["limit1"],
    "relatedDocs": ["path/to/doc.md"]
  },
  "improvementSuggestions": ["suggestion1"],
  "nextAction": "answered | transition_to_requirements_delivery"
}
```

**Example**:
```json
{
  "status": "success",
  "feature": "state-management",
  "currentStatus": {
    "phase": "pending",
    "status": "not_started"
  },
  "answer": {
    "summary": "State management system with Schema validation and CLI tools",
    "capabilities": [
      "JSON Schema validation",
      "CLI for querying and updating state",
      "Concurrent modification protection"
    ],
    "limitations": [
      "Not yet implemented (planned)"
    ],
    "relatedDocs": [
      "docs/requirements/features/fea-state-management.md"
    ]
  },
  "improvementSuggestions": [],
  "nextAction": "answered"
}
```

#### 2.5 Change Impact Flow <!-- id: exec_change_impact -->

**Metadata**:
- **触发条件**: User requests changes to specs, PRD, templates, or other foundational documents
- **前置条件**: `node scripts/analyze-impact.js` script exists and functional
- **后置条件**: Impact analyzed, subtasks generated, changes applied in correct order (docs → design → code)

**Flow Diagram**:
```
[Change Request] → [Run analyze-impact.js] → [Generate Report] → [Present to User]
                                                                        ↓
                                                            [User Approves?] ─No→ [Abort]
                                                                        ↓
                                                                       Yes
                                                                        ↓
                                                            [Generate Subtasks] → [Process Sequentially] → [Resume Original Task]
```

**Detailed Steps**:

| Step | Action | Constraint | Output |
|------|--------|------------|--------|
| 1 | Detect change request (specs/PRD/template modification) | MUST recognize file paths in `docs/specs/`, `docs/requirements/prd.md`, `scripts/templates/` | `{changeType}` |
| 2 | Run `node scripts/analyze-impact.js <file>` | MUST execute before any changes | `{impactReport}` |
| 3 | Parse impact report (affected docs, code, dependencies) | MUST categorize: documents, design, code, tests | `{categorizedImpact}` |
| 4 | Present impact report to user | MUST show: file list, change scope, estimated effort | Report displayed |
| 5 | Wait for user approval | MUST NOT proceed without explicit confirmation | `approved \| rejected \| adjusted` |
| 6 | If approved, generate subtasks from impact list | MUST order: specifications → features → design → code → tests | `{subtasks}` array |
| 7 | Process subtasks sequentially | MUST complete each before starting next | Updated files |
| 8 | Resume original task | SHOULD restore context from before change flow | - |

**Processing Order** (MUST follow):
1. Specification documents (`docs/specs/*`)
2. Requirement documents (`docs/requirements/*`)
3. Design documents (`docs/designs/*`)
4. Source code (`src/*`)
5. Tests (`tests/*`, `src/**/*.test.js`)

**Error Handling**:

| Error | Cause | Solution |
|-------|-------|----------|
| analyze-impact.js not found | Script missing or renamed | Report error, suggest manual impact analysis |
| analyze-impact.js fails | Invalid file path or script bug | Show error output, suggest checking file path |
| User rejects impact | Scope too large or risky | Abort change flow, return to previous task |
| Subtask execution fails | File not found, merge conflict | Report failure, pause subtask processing, wait for user fix |

**AI Output Template**:
```json
{
  "status": "success",
  "changeRequest": {
    "file": "path/to/changed/file.md",
    "type": "spec | prd | template"
  },
  "impact": {
    "documents": ["path/to/doc1.md", "path/to/doc2.md"],
    "design": ["path/to/design.md"],
    "code": ["src/file1.js", "src/file2.js"],
    "tests": ["tests/test1.js"]
  },
  "subtasks": [
    {"id": 1, "type": "spec", "file": "path/to/doc1.md", "status": "pending"},
    {"id": 2, "type": "code", "file": "src/file1.js", "status": "pending"}
  ],
  "userApproval": "pending | approved | rejected",
  "nextAction": "awaiting_approval | processing_subtasks | aborted"
}
```

**Example**:
```json
{
  "status": "success",
  "changeRequest": {
    "file": "docs/specs/spec-requirements.md",
    "type": "spec"
  },
  "impact": {
    "documents": [
      "docs/requirements/prd.md",
      "docs/requirements/features/fea-state-management.md"
    ],
    "design": [],
    "code": [
      "scripts/validate-docs.js"
    ],
    "tests": []
  },
  "subtasks": [
    {"id": 1, "type": "spec", "file": "docs/requirements/prd.md", "status": "completed"},
    {"id": 2, "type": "spec", "file": "docs/requirements/features/fea-state-management.md", "status": "in_progress"},
    {"id": 3, "type": "code", "file": "scripts/validate-docs.js", "status": "pending"}
  ],
  "userApproval": "approved",
  "nextAction": "processing_subtasks"
}
```

#### 2.6 Spark Handling Flow <!-- id: exec_spark_handling -->

**Metadata**:
- **触发条件**:
  - **Capture Phase**: User mentions idea unrelated to current task (real-time)
  - **Processing Phase**: Feature completed, phase transition, or user explicitly requests
- **前置条件**: `.solodevflow/spark-box.md` exists (or create if missing)
- **后置条件**:
  - **Capture**: Spark recorded, current task continues uninterrupted
  - **Processing**: Sparks triaged (converted to requirements, archived, or discarded)

**Flow Diagram**:
```
=== Capture Phase (Real-time) ===
[Off-topic Idea] → [Detect "Spark"] → [Record to spark-box.md] → [Update state.json sparks array] → [Continue Current Task]

=== Processing Phase (Scheduled) ===
[Trigger: Feature Done / Phase Change / User Request] → [Read spark-box.md] → [Display Sparks]
                                                                                     ↓
                                                                        [User Choice for Each Spark]
                                                                                     ↓
                                                        ┌──────────────────────┬─────────────────┬────────────────┐
                                                        ↓                      ↓                 ↓                ↓
                                              [Convert to Requirement] [Archive to Processed] [Discard]  [Keep in Box]
                                                        ↓
                                              [Trigger Requirements Delivery (2.2)]
```

**Detailed Steps - Capture Phase**:

| Step | Action | Constraint | Output |
|------|--------|------------|--------|
| 1 | Detect off-topic idea in user input | MUST recognize: unrelated to current feature, future enhancement, tangential thought | `isSpark: true \| false` |
| 2 | Extract spark content | SHOULD capture: idea summary, context, timestamp | `{sparkContent}` |
| 3 | Append to `.solodevflow/spark-box.md` under "Pending Sparks" | MUST use format: `- [YYYY-MM-DD] idea description` | Updated spark-box.md |
| 4 | Update `state.json sparks` array | SHOULD add spark entry with id, timestamp, content | Updated state.json |
| 5 | Acknowledge capture to user | MUST confirm: "Idea captured in spark-box, continuing current task" | - |
| 6 | Resume current task without interruption | MUST NOT switch context | - |

**Detailed Steps - Processing Phase**:

| Step | Action | Constraint | Output |
|------|--------|------------|--------|
| 1 | Read `.solodevflow/spark-box.md` | MUST count pending sparks | `{sparkCount}` |
| 2 | If `sparkCount > 0`, prompt user | SHOULD use template: "X pending sparks. Process now? (yes/no)" | User choice |
| 3 | If user agrees, display sparks one by one | MUST show: id, date, description | Spark list |
| 4 | For each spark, ask user action | MUST offer: Convert to Requirement / Archive / Discard / Keep | `{action}` per spark |
| 5 | If "Convert to Requirement", trigger 6.2.2 | MUST pass spark content as initial requirement | Requirements Delivery Flow |
| 6 | If "Archive", move to "Processed Sparks" section | SHOULD append to bottom of spark-box.md | Updated spark-box.md |
| 7 | If "Discard", remove from spark-box.md | MUST delete entry completely | Updated spark-box.md |
| 8 | If "Keep", leave in "Pending Sparks" | MUST NOT modify entry | - |
| 9 | Update `state.json sparks` array | MUST reflect current pending count | Updated state.json |

**Error Handling**:

| Error | Cause | Solution |
|-------|-------|----------|
| spark-box.md not found | File deleted or never created | Create new spark-box.md with template structure |
| spark-box.md corrupted | Invalid markdown format | Report issue, suggest manual inspection |
| User unclear on spark triage | Doesn't understand options | Explain: Convert (make it a feature), Archive (save for later), Discard (delete) |

**AI Prompt Templates**:

**Capture Acknowledgment**:
```
✓ Idea captured in spark-box. Continuing with [current-task].
```

**Processing Prompt**:
```
You have {count} pending spark(s). Process them now?
1. Yes, process now
2. No, process later
```

**AI Output Template - Capture**:
```json
{
  "status": "captured",
  "spark": {
    "id": "spark-001",
    "timestamp": "2024-12-24T10:30:00Z",
    "content": "Consider adding dark mode support",
    "context": "During discussion of UI components"
  },
  "action": "recorded_to_spark_box",
  "nextAction": "resume_current_task"
}
```

**AI Output Template - Processing**:
```json
{
  "status": "processing",
  "pendingSparks": [
    {"id": "spark-001", "date": "2024-12-20", "content": "Add dark mode", "action": "convert_to_requirement"},
    {"id": "spark-002", "date": "2024-12-22", "content": "Performance optimization idea", "action": "archive"}
  ],
  "processedCount": 2,
  "remainingCount": 0,
  "nextAction": "requirements_delivery | continue"
}
```

**Example - Capture**:
```json
{
  "status": "captured",
  "spark": {
    "id": "spark-003",
    "timestamp": "2024-12-24T15:45:00Z",
    "content": "Add automated backup for state.json",
    "context": "Discussing state management implementation"
  },
  "action": "recorded_to_spark_box",
  "nextAction": "resume_current_task"
}
```

#### 2.7 Linked Projects Flow <!-- id: exec_linked_projects -->

**Metadata**:
- **触发条件**: User asks about linked projects status or cross-project information
- **前置条件**: CLAUDE.md contains "Linked Projects" configuration section
- **后置条件**: Project statuses displayed, no files modified (read-only)

**Flow Diagram**:
```
[User Query] → [Read CLAUDE.md] → [Extract Linked Projects List] → [For Each Project: Read state.json] → [Display Status Table]
```

**Detailed Steps**:

| Step | Action | Constraint | Output |
|------|--------|------------|--------|
| 1 | Read CLAUDE.md for "Linked Projects" section | MUST locate section 6.5.1 or equivalent | `{linkedProjects}` array |
| 2 | Extract project paths from configuration | MUST parse: project name, path, description | `{projectList}` |
| 3 | For each project, read `.solodevflow/state.json` | MUST handle missing files gracefully | `{projectState}` per project |
| 4 | Extract key info: name, current feature, phase, status | SHOULD get from `project`, `flow.activeFeatures`, `features[*].phase` | `{statusInfo}` |
| 5 | Format as status table | MUST use markdown table format | Status table |
| 6 | Output to user | MUST be read-only, no modifications | - |

**Error Handling**:

| Error | Cause | Solution |
|-------|-------|----------|
| CLAUDE.md missing Linked Projects | Section not configured | Report: "No linked projects configured in CLAUDE.md" |
| Project path not accessible | Invalid path or permissions | Show error for that project: "Path not accessible: {path}" |
| state.json not found | Project not initialized with SoloDevFlow | Report: "Project not using SoloDevFlow: {project}" |
| state.json invalid | Corrupted file | Report: "Invalid state.json for {project}, cannot read status" |

**Constraints**:
- **READ-ONLY**: MUST NOT modify any files in linked projects
- **NO EXECUTION**: MUST NOT run scripts or commands in linked projects
- **STATUS ONLY**: SHOULD only display current state, not historical data

**AI Output Template**:
```json
{
  "status": "success",
  "linkedProjects": [
    {
      "name": "ProjectA",
      "path": "/path/to/projectA",
      "accessible": true,
      "currentFeature": "feature-name | null",
      "phase": "pending | in_progress | done",
      "status": "not_started | in_progress | completed"
    },
    {
      "name": "ProjectB",
      "path": "/path/to/projectB",
      "accessible": false,
      "error": "state.json not found"
    }
  ],
  "summary": "2 linked projects, 1 accessible"
}
```

**Example**:
```json
{
  "status": "success",
  "linkedProjects": [
    {
      "name": "CVM_Demo2",
      "path": "d:\\github_projects\\CVM_Demo2",
      "accessible": true,
      "currentFeature": "user-authentication",
      "phase": "in_progress",
      "status": "in_progress",
      "description": "SoloDevFlow validation project"
    }
  ],
  "summary": "1 linked project, 1 accessible"
}
```

**Display Format**:
```markdown
关联项目状态：

| 项目 | 当前 Feature | 阶段 | 状态 | 说明 |
|------|-------------|------|------|------|
| CVM_Demo2 | user-authentication | in_progress | in_progress | SoloDevFlow 验证项目 |
```

#### 2.8 Phase Mismatch Handling <!-- id: exec_phase_mismatch -->

**Metadata**:
- **触发条件**: User request conflicts with current feature phase (e.g., asks to implement code during requirements phase)
- **前置条件**: state.json shows current feature phase, user intent detected
- **后置条件**: User decision executed (phase switch, spark capture, or request denied)

**Flow Diagram**:
```
[User Request] → [Detect Phase Mismatch] → [Explain Current Phase] → [Offer Options]
                                                                              ↓
                                                    ┌─────────────────────────┴─────────────────────┐
                                                    ↓                                               ↓
                                          [Option 1: Switch Phase]                    [Option 2: Capture as Spark]
                                                    ↓                                               ↓
                                          [Update state.json]                         [Trigger Spark Capture (2.6)]
                                                    ↓
                                          [Proceed with Request]
```

**Detailed Steps**:

| Step | Action | Constraint | Output |
|------|--------|------------|--------|
| 1 | Detect phase mismatch | MUST compare user intent vs current feature `phase` in state.json | `{mismatch}` detected |
| 2 | Identify current phase and user requested action | SHOULD extract: current = "requirements", user wants = "implement code" | `{currentPhase}`, `{requestedAction}` |
| 3 | Explain mismatch to user | MUST clarify: "Current phase is X, but you're requesting Y (which belongs to phase Z)" | Explanation |
| 4 | Offer options | MUST provide: Switch to phase Z / Capture idea as spark / Cancel request | Option list |
| 5 | Wait for user decision | MUST NOT auto-switch phases | `{userChoice}` |
| 6 | If "Switch Phase", update state.json | MUST update `features[current].phase` | Updated state.json |
| 7 | If "Capture as Spark", trigger 6.2.6 | MUST call Spark Handling Flow | Spark captured |
| 8 | If "Cancel", acknowledge and wait | SHOULD ask: "What would you like to do instead?" | - |
| 9 | Execute user's chosen path | MUST follow selected flow | - |

**Common Phase Mismatches**:

| Current Phase | User Request | Recommended Action |
|---------------|--------------|-------------------|
| pending (requirements) | "Implement feature X" | Offer: Complete requirements first, or switch to implementation phase |
| pending (requirements) | "Write design doc" | Offer: Switch to design phase (for code-type features) |
| in_progress (design) | "Add new requirement" | Offer: Return to requirements phase, or capture as enhancement spark |
| in_progress (implementation) | "Change feature scope" | Offer: Update requirements (triggers Change Impact Flow 6.2.5) |

**Error Handling**:

| Error | Cause | Solution |
|-------|-------|----------|
| Cannot determine phase | state.json missing phase field | Report error, suggest running `npm run validate:state` |
| User intent ambiguous | Request could fit multiple phases | Ask clarifying question: "Do you mean X (requirements) or Y (implementation)?" |
| Invalid phase transition | Skipping required phases | Explain phase order, recommend completing prerequisite phases first |

**AI Output Template**:
```json
{
  "status": "phase_mismatch_detected",
  "current": {
    "feature": "feature-name",
    "phase": "pending | in_progress | done",
    "allowedActions": ["write requirements", "clarify scope"]
  },
  "userRequest": {
    "intent": "implement code",
    "requiredPhase": "in_progress (implementation)"
  },
  "options": [
    {"id": 1, "action": "switch_phase", "description": "Switch to implementation phase"},
    {"id": 2, "action": "capture_spark", "description": "Save idea for later"},
    {"id": 3, "action": "cancel", "description": "Cancel request"}
  ],
  "recommendation": "Complete requirements documentation before implementation"
}
```

**Example**:
```json
{
  "status": "phase_mismatch_detected",
  "current": {
    "feature": "project-init",
    "phase": "pending",
    "allowedActions": ["write feature spec", "clarify requirements"]
  },
  "userRequest": {
    "intent": "add error handling to init.js",
    "requiredPhase": "in_progress (implementation)"
  },
  "options": [
    {"id": 1, "action": "switch_phase", "description": "Switch to implementation phase and add error handling"},
    {"id": 2, "action": "capture_spark", "description": "Save 'improve error handling' as future enhancement"},
    {"id": 3, "action": "cancel", "description": "Stay in requirements phase"}
  ],
  "recommendation": "Feature spec exists, safe to switch to implementation if needed"
}
```

**User Prompt Template**:
```markdown
⚠️ Phase Mismatch Detected

**Current Phase**: {phase} - {allowed_actions}
**Your Request**: {user_intent} (requires {required_phase})

**Options**:
1. Switch to {required_phase} and proceed with request
2. Capture idea as spark for later processing
3. Cancel and continue with current phase

Which would you prefer?
```

---

### 3 Tools Reference <!-- id: exec_tools_reference -->

流程执行中使用的工具索引。本节列出所有可用的命令、技能和脚本，并说明在哪些流程中使用。

#### 3.1 Commands

AI MUST 使用这些命令生成符合规范的文档：

| 命令 | 用途 | 使用流程 | 约束 |
|------|------|---------|------|
| `/write-prd` | 编写/更新 PRD | 6.2.2 Requirements Delivery | MUST load spec-requirements.md first |
| `/write-feature {name}` | 编写/更新独立 Feature Spec | 6.2.2 Requirements Delivery | MUST determine doc type first |
| `/write-feature {domain} {name}` | 编写/更新 Domain 内 Feature Spec | 6.2.2 Requirements Delivery | MUST verify domain exists |
| `/write-design {name}` | 编写/更新独立 Feature Design | 6.2.3 Design Phase | MUST check designDepth = required |
| `/write-design {domain} {name}` | 编写/更新 Domain 内 Feature Design | 6.2.3 Design Phase | MUST load spec-design.md first |
| `/write-capability {name}` | 编写/更新 Capability Spec | 6.2.2 Requirements Delivery | SHOULD use for cross-cutting concerns |
| `/write-flow {name}` | 编写/更新 Flow Spec | 6.2.2 Requirements Delivery | MUST include execution spec |
| `/write-req-spec` | 编写/更新需求文档规范 | 6.2.5 Change Impact | MUST run impact analysis first |
| `/write-design-spec` | 编写/更新设计文档规范 | 6.2.5 Change Impact | MUST run impact analysis first |

#### 3.2 Skills

AI SHOULD 调用这些技能处理复杂场景：

| 技能 | 触发场景 | 使用流程 | 约束 |
|------|---------|---------|------|
| `requirements-expert` | 需求模糊、需要澄清、不确定文档类型 | 6.2.2 Requirements Delivery | MUST invoke before document generation if ambiguous |

**Error Handling**: 如果技能不可用，AI MUST 手动询问用户澄清问题（参见 6.7.3）。

#### 3.3 Validation Scripts

AI SHOULD 在关键步骤后运行验证：

| 脚本 | 用途 | 使用流程 | 约束 |
|------|------|---------|------|
| `npm run status` | 显示状态摘要 | 6.2.1 Session Start | MAY run for quick status check |
| `npm run validate` | 校验 .solodevflow/ 格式 | All flows | SHOULD run before commit |
| `npm run validate:state` | 校验 state.json Schema | 6.2.1 Session Start, Error recovery | MUST run if state corruption suspected |
| `npm run validate:docs` | 校验文档规范 | 6.2.2 Requirements Delivery | SHOULD run after document generation |
| `node scripts/analyze-impact.js <file>` | 影响分析 | 6.2.5 Change Impact | MUST run before spec/template changes |

**JSON Schema Validation Example**:
```bash
# Validate state.json against schema
npm run validate:state

# Expected output (success):
✓ state.json is valid
✓ All features have required fields
✓ No orphaned dependencies

# Expected output (failure):
✗ state.json validation failed
  - Missing required field: features.project-init.phase
  - Invalid value: features.workflows.status = "invalid_status"
```

#### 3.4 State CLI

AI MUST 使用 State CLI 进行所有状态更新（避免直接编辑 state.json）：

**查询命令** (Read-only, safe to use anytime):
```bash
node scripts/state.js summary                  # 显示项目摘要
node scripts/state.js get-feature <name>       # 获取 Feature 详情
node scripts/state.js list-active              # 列出活跃 Features
node scripts/state.js get-domain <name>        # 获取 Domain 下所有 Features
```

**更新命令** (Write operations, use with caution):
```bash
# Feature 生命周期
node scripts/state.js update-feature <name> --phase=<phase> --status=<status>
node scripts/state.js complete-feature <name>

# Subtask 管理
node scripts/state.js add-subtask <feature> --desc="描述" --source=ai
node scripts/state.js complete-subtask <feature> <subtaskId>

# Git 集成
node scripts/state.js record-commit            # 记录最近一次 commit 到 metadata
```

**Constraints**:
- MUST use State CLI for updates (built-in concurrency locking)
- MUST NOT manually edit state.json (risk of corruption)
- SHOULD verify updates with `node scripts/state.js get-feature <name>`

**Flow Cross-Reference**:
- 6.2.1 Session Start: Uses `summary`, `get-feature`, `list-active`
- 6.2.2 Requirements Delivery: Uses `update-feature`, `add-subtask`
- 6.2.3 Design Phase: Uses `update-feature` to record designDepth
- 6.2.5 Change Impact: Uses `add-subtask` for impact items
- 6.2.6 Spark Handling: Updates `sparks` array (currently manual, consider CLI enhancement)
- 6.4 Auto-Commit: Uses `record-commit` after successful commit

---

### 4 Auto-Commit Flow <!-- id: exec_auto_commit -->

完成 subtask 或 feature 后，立即执行：

```bash
git add -A && git commit -m "feat(<feature-name>): <描述>"
node scripts/state.js record-commit
```

**Commit Message 格式**：
- Subtask 完成：`feat(<feature-name>): <subtask描述>`
- Feature 完成：`feat(<feature-name>): complete feature`

---

### 5 Project Configuration <!-- id: exec_project_config -->

#### 5.1 Linked Projects

使用 SoloDevFlow 的关联项目，AI 可在人类询问时查看其状态（只读）。

| 项目 | 路径 | 说明 |
|------|------|------|
| CVM_Demo2 | `d:\github_projects\CVM_Demo2` | SoloDevFlow 验证项目 |

#### 5.2 Bilingual Convention

- **文件名**：英文 kebab-case
- **标题/术语**：英文
- **描述/逻辑**：中文

#### 5.3 Spec Management (SoloDevFlow Only)

本项目是所有规范的源头，修改规范时：
1. **必须**运行影响分析：`node scripts/analyze-impact.js <file>`
2. 检查影响范围
3. 生成升级 subtasks
4. 更新规范文档
5. 提交变更

---

### 6 Do's and Don'ts <!-- id: exec_rules -->

#### 始终做

- 关键输入 → 记录到 `input-log.md`
- 灵光想法 → 记录到 `spark-box.md`，不打断当前任务
- 变更前 → 先做影响分析
- 输出 → 总分结构（先结论后细节）
- 编写文档前 → 加载对应规范
- 完成 subtask/feature 后 → 自动提交

#### 绝不做

- 需求阶段写代码
- 跳过影响分析直接执行变更
- 丢失人类的关键输入
- 修改关联项目的文件

---

### 7 Troubleshooting Guide <!-- id: exec_troubleshooting -->

常见错误和解决方案。

#### 7.1 State Management Errors

| Error | Symptoms | Root Cause | Solution |
|-------|----------|-----------|----------|
| `state.json not found` | Session start fails | Project not initialized | Run `node scripts/init.js` to initialize project |
| `Invalid JSON schema` | Validation errors on read | Corrupted state file, missing fields | Run `npm run validate:state` to check schema compliance |
| `activeFeatures array empty` | No current feature reported | Feature not activated | Check state.json, manually add feature to `flow.activeFeatures` if needed |
| `Feature not found in state.json` | Feature query fails | Feature key doesn't exist in `features` object | Verify feature name, check PRD for correct feature key |
| `Concurrent modification detected` | State update fails | Multiple processes editing state.json | Use `node scripts/state.js` CLI with built-in locking |

#### 7.2 Document Validation Errors

| Error | Symptoms | Root Cause | Solution |
|-------|----------|-----------|----------|
| `Missing required section` | Validation script fails | Document missing mandatory chapter | Compare with spec template, add missing sections |
| `Invalid anchor format` | Link validation fails | Anchor doesn't follow `<!-- id: prefix_name -->` pattern | Fix anchor: use lowercase, underscores, consistent prefix |
| `Broken document reference` | Link points to non-existent file | File moved, renamed, or deleted | Update reference path, use project absolute path |
| `Template variable not replaced` | `{{variable}}` appears in generated doc | Template rendering failed | Check init.js `renderTemplate()` function, ensure all vars defined |

#### 7.3 Flow Execution Errors

| Error | Symptoms | Root Cause | Solution |
|-------|----------|-----------|----------|
| `requirements-expert skill not available` | Requirement clarification fails | Skill not configured in .claude/skills/ | Manually ask user clarifying questions instead |
| `analyze-impact.js fails` | Change impact analysis crashes | Invalid file path or script bug | Check file path exists, run script manually to see error details |
| `/write-* command not found` | Document generation fails | Command not configured | Check .claude/commands/ directory, verify command files exist |
| `Validation script not executable` | npm run validate fails | Script missing or permissions issue | Check scripts/ directory, verify Node.js executable |

#### 7.4 Phase Transition Errors

| Error | Symptoms | Root Cause | Solution |
|-------|----------|-----------|----------|
| `Cannot switch to implementation without design` | Phase transition blocked | designDepth = required but design doc missing | Complete design phase first (2.3), generate design doc |
| `Phase mismatch warning ignored` | User proceeds despite warning | Phase guard bypassed | Stop execution, explain consequences, wait for explicit approval |
| `Feature stuck in pending phase` | No progress for extended time | Requirements unclear or incomplete | Review Feature Spec, identify blockers, trigger requirements-expert if needed |

#### 7.5 Integration Errors

| Error | Symptoms | Root Cause | Solution |
|-------|----------|-----------|----------|
| `Git commit fails` | Auto-commit doesn't work | Merge conflict, staged files issue | Resolve conflicts manually, then run `git add -A && git commit -m "..."` |
| `Linked project state.json unreadable` | Linked Projects Flow fails | Project path wrong or not using SoloDevFlow | Verify path in CLAUDE.md section 6.5.1, check if linked project initialized |
| `Spark-box.md corrupted` | Spark capture/processing fails | Invalid markdown format | Open spark-box.md, fix formatting, ensure "Pending Sparks" section exists |

#### 7.6 Debugging Checklist

When encountering errors, follow this checklist:

1. **Verify Prerequisites**:
   - [ ] `.solodevflow/state.json` exists and is valid JSON
   - [ ] Current working directory is project root
   - [ ] Node.js and npm are installed and accessible

2. **Check State Consistency**:
   - [ ] Run `npm run validate:state` to check state.json schema
   - [ ] Run `node scripts/state.js summary` to view current state
   - [ ] Verify `flow.activeFeatures` matches intended feature

3. **Inspect Logs**:
   - [ ] Check console output for error messages
   - [ ] Review recent git commits for context
   - [ ] Look for validation script output

4. **Test Tools Manually**:
   - [ ] Run validation scripts: `npm run validate:docs`, `npm run validate:state`
   - [ ] Test state CLI: `node scripts/state.js summary`
   - [ ] Try impact analysis: `node scripts/analyze-impact.js <file>`

5. **Consult Documentation**:
   - [ ] Review relevant spec: spec-meta.md, spec-requirements.md, spec-design.md
   - [ ] Check Flow documentation: docs/requirements/flows/flow-workflows.md
   - [ ] Verify command usage: .claude/commands/README.md (if exists)

**If issue persists**: Report minimal reproducible example with error output and state.json snapshot.

---

---

*Auto-extracted from flow-workflows.md Chapter 6*
*Last updated: 2025-12-24*
