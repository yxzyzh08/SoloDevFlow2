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

## 3. Native Integration <!-- id: design_{name}_native -->

> 移动应用特有：原生平台集成设计

### 3.1 Platform APIs

| API | iOS | Android | 用途 |
|-----|-----|---------|------|
| {API名} | {iOS API} | {Android API} | {用途说明} |
| Camera | AVFoundation | CameraX | 拍照/录像 |
| Location | CoreLocation | FusedLocationProvider | 位置服务 |
| Push | APNs | FCM | 推送通知 |

### 3.2 Permissions

| 权限 | iOS | Android | 用途 | 必选 |
|------|-----|---------|------|------|
| {权限名} | {iOS 权限} | {Android 权限} | {用途} | Yes/No |
| Camera | NSCameraUsageDescription | CAMERA | 拍照 | Yes |
| Location | NSLocationWhenInUseUsageDescription | ACCESS_FINE_LOCATION | 定位 | No |

### 3.3 Background Tasks

| 任务 | iOS | Android | 说明 |
|------|-----|---------|------|
| {任务名} | {BGTaskScheduler/...} | {WorkManager/...} | {说明} |

### 3.4 Deep Links

| Link | 格式 | 目标 |
|------|------|------|
| {链接类型} | `{scheme}://{host}/{path}` | {目标页面} |

---

## 4. UI Components <!-- id: design_{name}_ui_components -->

> **必选章节**（mobile-app 类型）
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

<!-- L2/L3: 包含此章节 -->
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

<!-- L3: 包含此章节 -->
## 7. Alternatives <!-- id: design_{name}_alternatives -->

| 方案 | 优点 | 缺点 | 结论 |
|------|------|------|------|
| 方案A | ... | ... | 选择 |
| 方案B | ... | ... | 放弃 |

---

<!-- L2/L3: 包含此章节 -->
## 8. Dependencies <!-- id: design_{name}_dependencies -->

| 依赖 | 类型 | 说明 |
|------|------|------|
| xxx | hard/soft | ... |

---

<!-- L3: 包含此章节 -->
## 9. Risks <!-- id: design_{name}_risks -->

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 风险1 | 高/中/低 | ... |

---

*Version: v1.0*
*Created: {date}*
*Applies to: {feature-name}*
