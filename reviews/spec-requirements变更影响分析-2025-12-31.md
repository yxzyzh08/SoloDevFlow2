# spec-requirements.md 变更影响分析报告

**文档版本**：1.0
**生成日期**：2025-12-31
**变更范围**：docs/specs/spec-requirements.md v2.13 → v2.14
**分析对象**：SoloDevFlow 2.0 项目

---

## 1. 变更概述

### 1.1 变更背景

为支持**前端 Demo 演示项目**的需求文档编写，需要简化文档结构：
- 不需要 Flow 文档（跨域协作流程）
- 可省略 Non-Functional Requirements（非功能性需求）
- 强调用户场景（User Scenarios）

### 1.2 变更摘要

| 变更类型 | 变更内容 | 影响范围 |
|---------|---------|---------|
| **新增章节** | §1.6 Project Type Adaptations | 规范层面 |
| **新增章节** | §4.4 User Scenarios Section | Feature 文档结构 |
| **表结构变更** | PRD Structure 表新增 Condition 列 | 验证逻辑 + 文档 |
| **表结构变更** | Feature Structure 表新增 Condition 列 | 验证逻辑 + 文档 |
| **版本更新** | v2.13 → v2.14 | 全局引用 |

---

## 2. 变更内容详细说明

### 2.1 新增章节：§1.6 Project Type Adaptations

```markdown
### 1.6 Project Type Adaptations <!-- id: spec_req_project_types -->

#### 1.6.1 Frontend Demo Projects

**Special Rules**:
- 无需编写 Flow 文档
- 可简化或省略 Non-Functional Requirements
- 强调 User Scenarios（用户场景）

**适用范围**：
- 演示型前端项目
- POC (Proof of Concept) 项目
- UI/UX 原型验证项目
```

**影响**：
- 定义了新的项目类型分类规则
- 为条件验证提供依据

### 2.2 新增章节：§4.4 User Scenarios Section

```markdown
### 4.4 User Scenarios Section (Optional, Recommended for Demo Projects)

**Anchor**: `feat_{name}_scenarios`

**Template**:
- 场景名称
- 前置条件
- 操作步骤
- 预期结果
- 交互设计要点
```

**影响**：
- Feature 文档新增可选章节
- validate-docs.cjs 需要识别此章节定义

### 2.3 表结构变更：Condition 列

#### PRD Structure 表变更

| Section | Required | Anchor | Description | **Condition** |
|---------|----------|--------|-------------|--------------|
| Non-Functional Requirements | No | `prod_nfr` | 性能、安全、可用性等质量属性 | **可省略**：demoProject: true |
| Core Flow | No | `prod_flow` | 有复杂业务流程时 | **可省略**：demoProject: true |

#### Feature Structure 表变更

| Section | Required | Anchor | Description | **Condition** |
|---------|----------|--------|-------------|--------------|
| UI Components | Yes | `feat_{name}_ui_components` | 涉及的 UI 组件（复用/新建） | projectType: web-app |
| User Scenarios | No | `feat_{name}_scenarios` | 用户场景详细描述 | **推荐**：demoProject: true |
| Non-Functional Requirements | No | `feat_{name}_nfr` | 性能、安全等质量属性 | **可省略**：demoProject: true |

**Condition 列的语义**：

| 条件格式 | 含义 | 验证逻辑 |
|---------|------|---------|
| `可省略：demoProject: true` | demo 项目可以不包含此章节 | 如果是 demo 项目，不报错 |
| `推荐：demoProject: true` | demo 项目推荐包含此章节 | 缺失时警告，不报错 |
| `projectType: web-app` | 仅 web-app 项目需要 | 其他项目类型可跳过 |

---

## 3. 代码影响分析

### 3.1 scripts/validate-docs.cjs

#### 3.1.1 当前版本

```javascript
// Line 1-2
// validate-docs.cjs
// Based on spec-requirements.md v2.10 ← 过期，应为 v2.14
```

#### 3.1.2 问题分析

**问题 1：版本号过期**
- 当前基于 v2.10
- 应更新为 v2.14

**问题 2：parseSpecDefinitions 函数不支持 Condition 列**

```javascript
// Line 368-370
const sectionIdx = tableHeaders.findIndex(h => h.includes('section') || h.includes('章节'));
const anchorIdx = tableHeaders.findIndex(h => h.includes('anchor') || h.includes('锚点'));
const requiredIdx = tableHeaders.findIndex(h => h.includes('required') || h.includes('必填'));
// ❌ 缺少 Condition 列的解析
```

**问题 3：validateDocument 函数不支持条件验证**

```javascript
// Line 626-648
for (const section of specDef.sections) {
  if (section.required) {
    // 只检查 required 字段，不考虑项目类型条件
    if (!hasAnchor && !content.includes(section.name)) {
      results.errors.push(`Missing required section: ${section.name}`);
    }
  }
}
// ❌ 没有根据文档的 projectType 或 demoProject 属性调整验证逻辑
```

#### 3.1.3 需要的修改

**修改 1：更新版本引用**
```javascript
// Line 1-2
// validate-docs.cjs
// Based on spec-requirements.md v2.14
```

**修改 2：解析 Condition 列**
```javascript
// Line 368-371（新增）
const sectionIdx = tableHeaders.findIndex(h => h.includes('section') || h.includes('章节'));
const anchorIdx = tableHeaders.findIndex(h => h.includes('anchor') || h.includes('锚点'));
const requiredIdx = tableHeaders.findIndex(h => h.includes('required') || h.includes('必填'));
const conditionIdx = tableHeaders.findIndex(h => h.includes('condition') || h.includes('条件'));

// Line 378-385（修改）
definitions.get(currentDefines).sections.push({
  name: sectionName,
  anchor: anchor,
  required: required,
  condition: cells[conditionIdx]?.trim() || null  // 新增
});
```

**修改 3：实现条件验证逻辑**
```javascript
// Line 626-650（修改）
for (const section of specDef.sections) {
  if (!section.anchor) continue;

  const expectedAnchor = section.anchor.replace('{name}', docName);

  // 新增：解析条件并判断是否应跳过验证
  const shouldValidate = shouldValidateSection(section, frontmatter);

  if (section.required && shouldValidate) {
    const hasAnchor = docAnchorIds.has(expectedAnchor) ||
                      Array.from(docAnchorIds).some(a => a.startsWith(expectedAnchor.split('_')[0] + '_'));

    if (!hasAnchor && !content.includes(section.name)) {
      results.errors.push(`Missing required section: ${section.name}`);
    }
  } else if (!section.required && section.condition?.includes('推荐')) {
    // 推荐章节缺失时发出警告
    if (!docAnchorIds.has(expectedAnchor) && !content.includes(section.name)) {
      results.warnings.push(`Recommended section not present: ${section.name}`);
    }
  }
}

// 新增辅助函数
function shouldValidateSection(section, frontmatter) {
  if (!section.condition) return true;

  // 解析条件：可省略：demoProject: true
  if (section.condition.includes('可省略') && section.condition.includes('demoProject')) {
    return frontmatter.projectType !== 'demo';
  }

  // 解析条件：projectType: web-app
  const match = section.condition.match(/projectType:\s*(\S+)/);
  if (match) {
    return frontmatter.projectType === match[1];
  }

  return true;
}
```

**修改 4：META_SPEC 配置更新**
```javascript
// 需要定义 projectType 的有效值
const META_SPEC = {
  // ...existing config
  validProjectTypes: ['demo', 'web-app', 'library', 'tool'],  // 新增
  // ...
};
```

#### 3.1.4 风险评估

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| 条件解析逻辑错误 | 验证失效或误报 | 充分的单元测试 |
| 向后兼容性破坏 | 现有文档验证失败 | 条件为空时保持原有逻辑 |
| projectType 未定义 | 验证逻辑异常 | 默认按非 demo 项目处理 |

### 3.2 其他代码文件

#### scripts/index.cjs
- **影响**：无（仅索引文档元数据，不解析规范）
- **操作**：无需修改

#### scripts/state.cjs
- **影响**：无（状态管理不涉及文档结构验证）
- **操作**：无需修改

---

## 4. 文档影响分析

### 4.1 直接影响（硬依赖）

#### 4.1.1 fea-review-assistant.md
- **依赖类型**：硬依赖 spec-requirements
- **影响评估**：Review Assistant 需要理解新的 Condition 规则来审核文档
- **需要更新**：✅ 是
- **更新内容**：
  - 在审核检查点中新增"条件章节验证"
  - 更新示例以包含 demoProject 场景

#### 4.1.2 fea-write-commands.md
- **依赖类型**：硬依赖 spec-requirements
- **影响评估**：Write Commands 生成文档时需要支持新的章节类型
- **需要更新**：✅ 是
- **更新内容**：
  - `/write-prd` 命令需要支持 projectType 参数
  - `/write-feature` 命令需要支持生成 User Scenarios 章节
  - 模板中新增条件章节的处理逻辑

#### 4.1.3 flow-requirements.md
- **依赖类型**：硬依赖 spec-requirements
- **影响评估**：需求流程需要引导用户选择项目类型
- **需要更新**：✅ 是
- **更新内容**：
  - 在 PRD 阶段新增项目类型选择步骤
  - 根据项目类型调整文档模板

#### 4.1.4 prd.md
- **依赖类型**：文档引用 spec-requirements
- **影响评估**：PRD 文档本身无需调整（除非它是 demo 项目）
- **需要更新**：❌ 否
- **说明**：仅需确认引用的规范版本正确

### 4.2 间接影响

以下文档通过依赖链间接受影响，但由于它们不直接消费 spec-requirements 的结构定义，仅需**确认无异常**：

| 文档 | 依赖链 | 需要更新 |
|------|--------|---------|
| cap-document-validation.md | → prd.md → spec-requirements | ❌ 确认即可 |
| flow-design.md | → prd.md → spec-requirements | ❌ 确认即可 |
| flow-implementation.md | → prd.md → spec-requirements | ❌ 确认即可 |
| flow-refactoring.md | → prd.md → spec-requirements | ❌ 确认即可 |
| flow-testing.md | → prd.md → spec-requirements | ❌ 确认即可 |
| flow-workflows.md | → prd.md → spec-requirements | ❌ 确认即可 |

### 4.3 模板文件

需要检查 `template/` 目录下的模板文件是否需要更新：

```bash
# 查找包含 spec-requirements 引用的模板
grep -r "spec-requirements" template/
```

**预期影响**：
- PRD 模板可能需要新增 projectType 字段
- Feature 模板可能需要新增 User Scenarios 章节模板

---

## 5. 测试影响分析

### 5.1 需要新增的测试用例

#### validate-docs.cjs 单元测试

**测试场景 1：Condition 列解析**
```javascript
test('parseSpecDefinitions should parse Condition column', () => {
  const spec = `
| Section | Required | Anchor | Condition |
|---------|----------|--------|-----------|
| NFR | No | prod_nfr | 可省略：demoProject: true |
  `;
  const result = parseSpecDefinitions(spec);
  expect(result.get('test').sections[0].condition).toBe('可省略：demoProject: true');
});
```

**测试场景 2：demo 项目跳过可选章节验证**
```javascript
test('validateDocument should skip optional sections for demo projects', () => {
  const content = `
---
type: prd
projectType: demo
---
# Demo Project
<!-- No NFR section -->
  `;
  const results = validateDocument('test.md', specDefs);
  expect(results.errors).not.toContain(expect.stringContaining('NFR'));
});
```

**测试场景 3：推荐章节缺失时警告**
```javascript
test('validateDocument should warn for missing recommended sections', () => {
  const content = `
---
type: feature
projectType: demo
---
# Demo Feature
<!-- No User Scenarios section -->
  `;
  const results = validateDocument('test.md', specDefs);
  expect(results.warnings).toContain(expect.stringContaining('User Scenarios'));
});
```

### 5.2 集成测试

**测试场景 4：完整 demo 项目验证流程**
1. 创建 demo 项目 PRD（无 NFR 章节）
2. 运行 `npm run validate`
3. 确认验证通过，无报错

---

## 6. 风险评估

### 6.1 高风险项

| 风险项 | 影响范围 | 概率 | 影响程度 | 缓解措施 |
|--------|---------|------|---------|---------|
| **条件验证逻辑缺陷** | 所有文档验证 | 中 | 高 | 充分单元测试 + 人工审核 |
| **向后兼容性破坏** | 现有所有文档 | 低 | 高 | 保留原有验证逻辑作为默认行为 |
| **projectType 字段缺失** | demo 项目验证 | 高 | 中 | 提供默认值处理逻辑 |

### 6.2 中风险项

| 风险项 | 影响范围 | 概率 | 影响程度 | 缓解措施 |
|--------|---------|------|---------|---------|
| **Write Commands 未及时更新** | 新文档生成 | 中 | 中 | 在规范更新后立即更新命令 |
| **模板文件遗漏更新** | 手动创建文档 | 中 | 低 | 检查并更新所有模板文件 |

### 6.3 低风险项

| 风险项 | 影响范围 | 概率 | 影响程度 | 缓解措施 |
|--------|---------|------|---------|---------|
| **文档引用版本号错误** | 可追溯性 | 低 | 低 | 批量更新版本引用 |

---

## 7. 修改计划

### 7.1 修改优先级

```
P0 - 必须完成（阻塞功能）
├─ validate-docs.cjs 更新（支持 Condition 列）
└─ fea-write-commands.md 更新（生成新章节）

P1 - 应该完成（影响体验）
├─ fea-review-assistant.md 更新
├─ flow-requirements.md 更新
└─ 单元测试编写

P2 - 可以完成（优化项）
├─ 模板文件更新
└─ 间接影响文档确认
```

### 7.2 建议修改顺序

```
阶段 1：核心代码更新
  1. 更新 validate-docs.cjs
     - 解析 Condition 列
     - 实现条件验证逻辑
     - 更新版本引用
  2. 编写单元测试
  3. 运行验证确保向后兼容

阶段 2：文档更新
  4. 更新 fea-write-commands.md
     - 新增 projectType 参数说明
     - 新增 User Scenarios 章节说明
  5. 更新 fea-review-assistant.md
     - 新增条件章节审核检查点
  6. 更新 flow-requirements.md
     - 新增项目类型选择步骤

阶段 3：模板和间接影响
  7. 更新模板文件（template/）
  8. 确认间接影响文档无异常
  9. 更新所有文档中的规范版本引用
```

### 7.3 验收标准

**代码更新验收**：
- [ ] validate-docs.cjs 可正确解析 Condition 列
- [ ] demo 项目缺失 NFR 章节时验证通过
- [ ] 非 demo 项目缺失 NFR 章节时验证失败
- [ ] 推荐章节缺失时发出警告（非错误）
- [ ] 所有单元测试通过
- [ ] 现有文档验证无回归问题

**文档更新验收**：
- [ ] Write Commands 可生成带 projectType 的文档
- [ ] Review Assistant 可审核条件章节
- [ ] Requirements Flow 包含项目类型选择
- [ ] 所有模板文件已更新
- [ ] 间接影响文档已确认

---

## 8. 关键决策点

### 8.1 projectType 字段定义位置

**决策**：在文档 frontmatter 中定义 `projectType` 字段

**理由**：
- 文档自描述，验证逻辑可直接读取
- 与现有 frontmatter 模式一致
- 便于 State Management 系统索引

**schema 定义**：
```yaml
projectType: demo | web-app | library | tool | null
```

### 8.2 向后兼容策略

**决策**：当 `projectType` 未定义时，默认按非 demo 项目处理

**理由**：
- 现有文档无 projectType 字段
- 保持严格验证不会降低文档质量
- 新项目可显式声明类型获得简化规则

### 8.3 条件语法规范

**当前使用的语法**：
```
可省略：demoProject: true
推荐：demoProject: true
projectType: web-app
```

**建议标准化为**：
```
optional-if: projectType=demo
recommended-if: projectType=demo
required-if: projectType=web-app
```

**决策**：暂时保持当前语法，未来可重构

---

## 9. 后续工作建议

### 9.1 短期（本次修改）
1. 完成 validate-docs.cjs 更新
2. 更新直接影响的 3 个文档
3. 编写并通过单元测试

### 9.2 中期（下一迭代）
1. 标准化条件语法
2. 为 projectType 提供自动检测机制
3. 在 State Management 中索引 projectType

### 9.3 长期（未来优化）
1. 支持更复杂的条件表达式（AND/OR 逻辑）
2. 提供条件验证规则的可视化配置
3. 支持自定义项目类型扩展

---

## 10. 结论

### 10.1 影响总结

| 影响层级 | 受影响项 | 修改必要性 |
|---------|---------|-----------|
| **规范层** | spec-requirements.md | ✅ 已完成 |
| **代码层** | validate-docs.cjs | ⚠️ 必须修改（P0） |
| **文档层** | 3 个直接依赖文档 | ⚠️ 应该修改（P1） |
| **模板层** | template/ 文件 | ⚙️ 可选修改（P2） |

### 10.2 总体风险评级

**🟡 中等风险**

- 核心验证逻辑需要修改，但影响范围可控
- 充分测试可确保向后兼容
- 修改后可显著提升 demo 项目的文档编写效率

### 10.3 建议行动

1. **立即执行**：更新 validate-docs.cjs（P0）
2. **本周完成**：更新直接依赖文档（P1）
3. **下周完成**：模板更新和间接影响确认（P2）

---

**报告生成者**：Claude Sonnet 4.5
**审核状态**：待人工审核
**下一步**：等待批准后开始修改计划
