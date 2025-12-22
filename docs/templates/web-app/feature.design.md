# Feature Design: {name} <!-- id: design_{name} -->

> {一句话描述设计目标}

**Design Depth**: L{1|2|3}（轻量/标准/详细）

---

## 1. Overview <!-- id: design_{name}_overview -->

### 1.1 Design Goals

- 目标1
- 目标2

### 1.2 Constraints

- 约束1
- 约束2

### 1.3 Related Spec

- Feature Spec: `docs/{domain}/{name}.spec.md`

---

<!-- 可选：复杂 Feature 包含此章节 -->
## 2. Technical Approach <!-- id: design_{name}_approach -->

### 2.1 Architecture Decision

**选择方案**：{方案名称}

**理由**：
- 理由1
- 理由2

### 2.2 Key Components

```
组件A ──> 组件B ──> 组件C
```

| 组件 | 职责 |
|------|------|
| 组件A | ... |
| 组件B | ... |

---

## 3. Frontend Architecture <!-- id: design_{name}_frontend -->

> Web 应用特有：前端架构设计

### 3.1 Component Structure

```
src/
├── components/          # 通用组件
│   ├── Button/
│   └── Modal/
├── features/            # Feature 组件
│   └── {name}/
│       ├── components/  # Feature 内部组件
│       ├── hooks/       # Feature 专用 hooks
│       ├── store/       # Feature 状态
│       └── index.tsx    # Feature 入口
├── pages/               # 页面组件
│   └── {name}/
└── layouts/             # 布局组件
```

### 3.2 State Management

| State | 位置 | 说明 |
|-------|------|------|
| {状态名} | Local / Global / Server | {状态描述} |

### 3.3 Routing

| Route | Component | 说明 |
|-------|-----------|------|
| `/{path}` | {PageComponent} | {页面描述} |

### 3.4 API Integration

| API | Method | Endpoint | 说明 |
|-----|--------|----------|------|
| {API名} | GET/POST | `/api/{path}` | {功能描述} |

---

## 4. UI Components <!-- id: design_{name}_ui_components -->

> **必选章节**（web-app 类型）
> 设计前必须查询组件注册表：`docs/ui/component-registry.md`

### 4.1 Component Analysis

| UI 需求 | 现有组件 | 决策 | 说明 |
|---------|----------|------|------|
| {需求描述} | {组件名/无} | 复用/新建 | {原因} |
| {需求描述} | {组件名/无} | 复用/新建 | {原因} |

### 4.2 Component Dependencies

```
Feature Component Tree
  ├── [复用] {ExistingComponent1}
  ├── [复用] {ExistingComponent2}
  └── [新建] {NewComponent}
```

### 4.3 New Components to Register

> 实现完成后，将新组件添加到 `docs/ui/component-registry.md`

| Component | Category | Path | Description |
|-----------|----------|------|-------------|
| {NewComponent} | {Atomic/Molecular/Organism/Template} | src/components/{path} | {描述} |

---

## 5. Interface Design <!-- id: design_{name}_interface -->

### 5.1 Data Structures

```typescript
interface Example {
  id: string;
  name: string;
}
```

### 5.2 API / Functions

```typescript
function doSomething(input: Input): Output {
  // ...
}
```

### 5.3 Error Handling

| 错误场景 | 处理方式 |
|----------|----------|
| 场景1 | 处理1 |

---

<!-- 可选：复杂 Feature 包含此章节 -->
## 6. Implementation Plan <!-- id: design_{name}_impl -->

### 6.1 Steps

1. [ ] 步骤1
2. [ ] 步骤2
3. [ ] 步骤3

### 6.2 Files to Create/Modify

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/xxx.ts` | 新建 | ... |

---

<!-- 可选：高风险 Feature 包含此章节 -->
## 7. Alternatives <!-- id: design_{name}_alternatives -->

| 方案 | 优点 | 缺点 | 结论 |
|------|------|------|------|
| 方案A | ... | ... | 选择 |
| 方案B | ... | ... | 放弃 |

---

<!-- 可选：有外部依赖时包含此章节 -->
## 8. Dependencies <!-- id: design_{name}_dependencies -->

| 依赖 | 类型 | 说明 |
|------|------|------|
| xxx | hard/soft | ... |

---

<!-- 可选：高风险 Feature 包含此章节 -->
## 9. Risks <!-- id: design_{name}_risks -->

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 风险1 | 高/中/低 | ... |

---

*Version: v1.0*
*Created: {date}*
*Applies to: {feature-name}*
