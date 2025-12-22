# Design Document Specification <!-- id: spec_design_doc -->

> 定义设计文档的结构、内容要素、编写标准

---

## 1. Core Principles <!-- id: spec_design_principles -->

> 这三条原则是整个系统的根基，所有设计和实现必须遵循。

### 1.1 Principle 1: Spec First（文档即真理源）

**定义**：文档定义系统的行为契约，代码是契约的实现。

**文档类型**（按归属层级）：

| 归属 | 类型 | 描述 | 内容 |
|------|------|------|------|
| 产品级 | PRD | 产品是什么 | 愿景、用户、Domain/Feature 路线图 |
| 产品级 | Design Doc | 如何设计 | 架构原则、技术方案、接口定义 |
| Feature级 | Feature Spec | Feature 做什么 | 需求、验收标准 |
| Feature级 | Feature Design | Feature 怎么做 | 技术设计、接口、数据结构 |

**变更规则**：

| 变更类型 | PRD | Design Doc | Feature Spec | Feature Design | 代码 |
|----------|-----|------------|--------------|----------------|------|
| 产品需求变更 | 先改 | 检查 | 检查 | 检查 | 后改 |
| 架构设计变更 | 检查 | 先改 | 可能改 | 可能改 | 后改 |
| Feature需求变更 | - | - | 先改 | 可能改 | 后改 |
| Feature设计变更 | - | 检查 | 检查 | 先改 | 后改 |
| Bug修复/重构 | - | - | - | - | 直接改 |

**判断标准**：文档定义的内容变了吗？变了 → 先改对应层级文档。

**Pending Docs 机制**：

允许在编码实现过程中，暂时打破"先文档后代码"的规则，但在提交前必须还债。

| 场景 | 说明 | 示例 |
|------|------|------|
| 实现倒逼设计 | 编码时发现必须修改接口/数据结构才能跑通 | "这个接口必须加 token 参数" |
| 快速热修复 | 通过对话直接修改代码细节 | "把默认值改成 10" |

**规则**：
- 必须在当次 Commit 前清空，不允许跨 Commit 累积
- AI 在 Commit 前主动提醒："有 N 条 pending docs 待处理"

### 1.2 Principle 2: Three Views（三视图结构）

**定义**：项目采用三种互补视图完整描述系统结构。

#### View A: Vertical Decomposition（纵向分解）

**目的**：描述如何拆分为独立的功能单元

```
PRD（总）
  └── Domain（分/总）
        └── Feature（分）
```

**规则**：
- 最多3层：产品 → Domain → Feature
- 超过3层 → 拆分为独立产品

#### View B: Horizontal Flow（横向协作）

**目的**：描述 Feature 如何协作完成业务场景

```
【业务流程名称】
触发 → Feature A → Feature B → Feature C → 结果

依赖关系：
  Feature A → Feature B（调用原因）
```

**规则**：
- 核心业务流程必须显式描述（Flow Spec）
- Feature 依赖关系必须记录

#### View C: Cross-cutting Capabilities（横向能力）

**目的**：定义跨 Feature 的公共能力

```
【Capability 名称】（如：日志系统、状态管理）
  ├── 接口定义：标准接口规范
  ├── 调用规范：如何调用、何时调用
  └── 实现要求：可插拔、可替换
```

**规则**：
- Capability 必须定义标准接口
- Feature 通过接口调用，不依赖具体实现

### 1.3 Principle 3: Pluggable Capabilities（横向功能可插拔）

**定义**：跨 Feature 的横向功能，设计为可插拔的规范接口。

**规则**：
- Capability（日志、状态、验证等）定义标准接口规范
- Feature 通过接口调用，不依赖具体实现
- 接口可独立替换、升级、禁用

**YAGNI 原则**：
- 初期：Capability 用最简单方式实现
- 后续：根据实际替换需求再引入接口抽象

---

## 2. Design Depth <!-- id: spec_design_depth -->

> 核心理念：**最小可行设计**（Minimum Viable Design）—— 够用就好，不要过度设计。

### 2.1 Depth Levels

| 级别 | 名称 | 适用场景 | 文档内容 |
|------|------|----------|----------|
| L0 | **无设计** | 极简单功能、直接实现 | 无设计文档 |
| L1 | **轻量设计** | 简单功能、低风险、可快速验证 | Overview + 关键接口 |
| L2 | **标准设计** | 一般功能、中等复杂度 | 完整必选章节 |
| L3 | **详细设计** | 复杂功能、高风险、核心模块 | 完整必选 + 可选章节 |

### 2.2 Depth Selection Criteria

**选择 L0（无设计）当**：
- 功能极其简单，实现路径明确
- 不需要架构决策或技术选型
- 可在半天内完成实现
- 失败可即时重做，无需文档追溯

> **L0 说明**：L0 不需要创建设计文档。在 Feature Spec 的 Artifacts 章节中标记 `Design Depth: L0` 即可。

**选择 L1（轻量设计）当**：
- 功能逻辑简单、边界清晰
- 不涉及外部依赖或新技术
- 可在 1-2 天内完成实现
- 失败成本低，可快速重做

**选择 L2（标准设计）当**：
- 功能有一定复杂度
- 涉及多个模块协作
- 需要定义清晰接口
- 实现周期 3-7 天

**选择 L3（详细设计）当**：
- 功能复杂、有多种实现方案
- 涉及核心架构决策
- 有技术风险需要分析
- 失败成本高、难以回退

### 2.3 Anti-patterns（避免过度设计）

| 反模式 | 说明 | 正确做法 |
|--------|------|----------|
| 过早抽象 | 为假想的未来需求设计接口 | 等到真正需要时再抽象 |
| 过度分层 | 为简单功能设计多层架构 | 先用最简单方案，必要时重构 |
| 完美主义 | 追求"完美设计"而拖延实现 | 先跑通，再优化 |
| 文档膨胀 | L1 场景写 L3 级别文档 | 匹配实际复杂度 |

---

## 3. Scope & Directory Structure <!-- id: spec_design_scope -->

### 3.1 Document Types

| 文档类型 | 层级 | 说明 |
|----------|------|------|
| **Architecture Design** | 产品级 | 整体架构设计、技术选型 |
| **Domain Design** | 领域级（可选） | 领域内的技术设计 |
| **Feature Design** | Feature级 | Feature 的技术设计 |
| **Capability Design** | 能力级（可选） | Capability 的技术设计 |
| **Flow Design** | 流程级（可选） | 跨域业务流程的技术设计 |

### 3.2 Directory Structure

```
docs/
├── requirements/                    # 需求文档根目录
│   ├── prd.md                       # 产品 PRD
│   ├── specs/                       # 规范文档
│   │   ├── requirements-doc.spec.md # 需求文档规范
│   │   ├── design-doc-spec.md       # 本规范
│   │   └── meta-spec.md             # 元规范
│   ├── templates/                   # 文档模板
│   ├── _features/                   # 独立 Feature 需求
│   │   └── {feature}.spec.md
│   ├── {domain}/                    # Domain 需求
│   │   └── {feature}.spec.md
│   ├── _capabilities/               # Capability 需求
│   │   └── {name}.spec.md
│   └── _flows/                      # Flow 需求
│       └── {name}.spec.md
│
└── designs/                         # 设计文档根目录
    ├── architecture.design.md       # 产品级架构设计（可选）
    ├── _features/                   # 独立 Feature 设计
    │   └── {feature}.design.md
    ├── {domain}/                    # Domain 设计
    │   └── {feature}.design.md
    ├── _capabilities/               # Capability 设计
    │   └── {name}.design.md
    └── _flows/                      # Flow 设计
        └── {name}.design.md
```

**目录结构说明**：
- **requirements/** - 所有需求文档存放于此，包含规范、模板和各类需求文档
- **designs/** - 所有设计文档独立存放，与需求文档完全分离
- 设计文档与需求文档一一对应，通过相同的文件名关联（.spec.md vs .design.md）
- 设计文档的目录结构镜像需求文档的组织方式（_features/, {domain}/, _capabilities/, _flows/）

---

## 4. Feature Design Structure <!-- id: spec_design_feature -->

### 4.1 Required Sections

| 章节 | 锚点 | 内容 | L1 | L2 | L3 |
|------|------|------|:--:|:--:|:--:|
| **Overview** | `design_{name}_overview` | 设计目标、约束条件 | ✓ | ✓ | ✓ |
| **Technical Approach** | `design_{name}_approach` | 技术方案、架构决策 | - | ✓ | ✓ |
| **Interface Design** | `design_{name}_interface` | 接口定义、数据结构 | ✓ | ✓ | ✓ |
| **Implementation Plan** | `design_{name}_impl` | 实现步骤、关键代码 | - | ✓ | ✓ |

### 4.2 Optional Sections

| 章节 | 锚点 | 适用场景 | L1 | L2 | L3 |
|------|------|----------|:--:|:--:|:--:|
| **Alternatives** | `design_{name}_alternatives` | 有多个方案需要对比 | - | - | ✓ |
| **Risks** | `design_{name}_risks` | 有技术风险需要说明 | - | - | ✓ |
| **Dependencies** | `design_{name}_dependencies` | 有外部依赖 | - | ✓ | ✓ |

### 4.3 Template

**模板位置**：`docs/templates/{project-type}/feature.design.md`

---

## 5. Flow Design Structure <!-- id: spec_design_flow -->

> 跨域业务流程的技术设计，与 Flow Spec 对应。

### 5.1 Required Sections

| 章节 | 锚点 | 内容 | L1 | L2 | L3 |
|------|------|------|:--:|:--:|:--:|
| **Overview** | `design_{name}_overview` | 设计目标、流程概述 | ✓ | ✓ | ✓ |
| **Flow Architecture** | `design_{name}_architecture` | 流程架构、参与组件 | - | ✓ | ✓ |
| **Interface Design** | `design_{name}_interface` | 组件间接口定义 | ✓ | ✓ | ✓ |
| **Implementation Plan** | `design_{name}_impl` | 实现步骤、时序图 | - | ✓ | ✓ |

### 5.2 Optional Sections

| 章节 | 锚点 | 适用场景 | L1 | L2 | L3 |
|------|------|----------|:--:|:--:|:--:|
| **Error Handling** | `design_{name}_errors` | 复杂异常处理 | - | - | ✓ |
| **Performance** | `design_{name}_performance` | 有性能/时序要求 | - | - | ✓ |

### 5.3 Template

**模板位置**：`docs/templates/{project-type}/flow.design.md`

---

## 6. Design Review Checklist <!-- id: spec_design_checklist -->

**通用检查项**：
- [ ] 设计深度是否匹配功能复杂度？（避免过度设计）
- [ ] 是否符合三条核心原则？
- [ ] 是否有清晰的接口定义？
- [ ] 是否与需求文档一致？

**L2/L3 额外检查项**：
- [ ] 是否考虑了错误处理？
- [ ] 是否有实现步骤？
- [ ] 技术方案是否合理？

**L3 额外检查项**：
- [ ] 是否评估了替代方案？
- [ ] 是否识别了技术风险？

## 6. 项目类型特定设计规范

### 6.1 Backend 项目

#### 架构设计要求
- **分层架构**：Controller → Service → Repository
- **数据库设计**：ER图、索引策略、查询优化
- **API 设计**：RESTful 规范、请求/响应格式
- **缓存策略**：缓存层级、失效策略

#### 性能要求
- **响应时间指标**：API 响应时间 < 200ms (P95)
- **并发处理能力**：QPS 要求、负载评估
- **数据库查询优化**：索引设计、查询计划分析

#### 安全设计
- **认证授权**：JWT/Session 机制
- **数据验证**：输入校验、SQL 注入防护
- **敏感数据**：加密存储、传输安全

### 6.2 Web App 项目

#### 前端架构设计
- **组件层级**：遵循 Atomic Design（Atomic → Molecular → Organism → Template）
- **状态管理**：
  - Local State：组件内部状态
  - Global State：跨组件共享状态（Context/Redux）
  - Server State：API 数据缓存
- **路由设计**：路由结构、权限控制、懒加载
- **API 集成**：接口定义、错误处理、重试机制

#### UI 组件设计
**前置要求**: 设计前必须查询 `docs/ui/component-registry.md`

| UI 需求 | 现有组件 | 决策 | 说明 |
|---------|----------|------|------|
| 用户输入 | Input (Atomic) | 复用 | 支持 validation |
| 表单提交 | Form (Molecular) | 复用 | 包含错误处理 |
| 新功能X | - | 新建 | 需求独特，无法复用 |

**组件分类**:
- **Atomic**: Button, Input, Icon, Label
- **Molecular**: Form, Card, Modal, Dropdown
- **Organism**: Header, Sidebar, DataTable
- **Template**: PageLayout, FormLayout

**设计决策流程**:
1. 查询组件注册表
2. 评估现有组件是否满足需求
3. 优先复用，必要时新建
4. 新建组件需在 Design Doc 中声明

#### 响应式设计
- **断点定义**：
  - Mobile: < 768px
  - Tablet: 768px - 1024px
  - Desktop: > 1024px
- **布局适配策略**：Flexbox/Grid 布局、媒体查询
- **性能优化**：懒加载、代码分割、图片优化

#### 样式规范
- **设计系统**：使用 CSS 变量 / 主题 token
- **统一性**：遵循项目的设计语言
- **可访问性**：WCAG 2.1 AA 标准（颜色对比度、键盘导航、ARIA 标签）

### 6.3 Mobile App 项目

#### 平台适配设计
- **iOS/Android 差异处理**：平台特定 UI 模式、导航方式
- **原生 API 集成**：权限管理、推送通知、后台任务
- **平台特定组件**：选择器、日期选择、导航栏

#### 屏幕适配
- **安全区域处理**：刘海屏、底部手势条、状态栏
- **横竖屏支持**：布局自适应、方向锁定
- **不同屏幕尺寸适配**：
  - 小屏（< 5.5"）：单列布局
  - 中屏（5.5" - 6.5"）：标准布局
  - 大屏（> 6.5"）：利用额外空间

#### 性能设计
- **启动时间优化**：< 2s 冷启动、< 1s 热启动
- **内存管理**：
  - 图片懒加载
  - 列表虚拟化
  - 组件卸载时清理
- **电池消耗控制**：
  - 限制后台任务
  - 优化网络请求
  - 合理使用定位服务
- **离线数据策略**：本地缓存、同步机制、冲突解决

#### 原生集成

| 功能 | iOS API | Android API | 设计考量 |
|------|---------|-------------|---------|
| 权限管理 | Info.plist | AndroidManifest | 运行时请求、降级策略 |
| 推送通知 | APNs | FCM | 统一接口封装、消息格式 |
| 后台任务 | Background Modes | WorkManager | 平台限制、执行时机 |
| 生物识别 | Face ID/Touch ID | BiometricPrompt | 回退机制、安全存储 |

## 7. 设计深度与项目类型映射

| 设计深度 | Backend | Web App | Mobile App |
|---------|---------|---------|------------|
| L0 | 简单CRUD | 静态页面 | 单屏展示 |
| L1 | 基础API、单表操作 | 简单交互、无状态管理 | 基础导航、本地数据 |
| L2 | 多模块API、复杂查询 | 状态管理、多组件交互 | 原生集成、网络数据 |
| L3 | 分布式系统、微服务 | 复杂状态、实时数据 | 跨平台架构、复杂同步 |

---

*Version: v3.1*
*Created: 2024-12-20*
*Updated: 2025-01-22*
*Changes: v2.1 新增 L0 级别; v2.2 新增 Flow Design 类型; v3.0 新增项目类型特定设计规范（Backend/Web App/Mobile App）; v3.1 设计文档与需求文档完全分离到 docs/designs/ 和 docs/requirements/ 两个独立目录*
*Applies to: SoloDevFlow 2.0*
