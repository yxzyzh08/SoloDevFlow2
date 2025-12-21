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

<!-- L2/L3: 包含此章节 -->
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

## 3. Interface Design <!-- id: design_{name}_interface -->

### 3.1 Data Structures

```typescript
interface Example {
  id: string;
  name: string;
}
```

### 3.2 API / Functions

```typescript
function doSomething(input: Input): Output {
  // ...
}
```

### 3.3 Error Handling

| 错误场景 | 处理方式 |
|----------|----------|
| 场景1 | 处理1 |

---

<!-- L2/L3: 包含此章节 -->
## 4. Implementation Plan <!-- id: design_{name}_impl -->

### 4.1 Steps

1. [ ] 步骤1
2. [ ] 步骤2
3. [ ] 步骤3

### 4.2 Files to Create/Modify

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/xxx.ts` | 新建 | ... |

---

<!-- L3: 包含此章节 -->
## 5. Alternatives <!-- id: design_{name}_alternatives -->

| 方案 | 优点 | 缺点 | 结论 |
|------|------|------|------|
| 方案A | ... | ... | 选择 |
| 方案B | ... | ... | 放弃 |

---

<!-- L2/L3: 包含此章节 -->
## 6. Dependencies <!-- id: design_{name}_dependencies -->

| 依赖 | 类型 | 说明 |
|------|------|------|
| xxx | hard/soft | ... |

---

<!-- L3: 包含此章节 -->
## 7. Risks <!-- id: design_{name}_risks -->

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 风险1 | 高/中/低 | ... |

---

*Version: v1.0*
*Created: {date}*
*Applies to: {feature-name}*
