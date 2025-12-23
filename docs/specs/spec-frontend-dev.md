# Frontend Development Specification v2.0 <!-- id: spec_frontend_dev -->

> 定义前端代码的开发原则、组件设计、质量标准（技术栈无关）

---

**重要声明**：

- 此规范定义前端开发的**通用原则**，不绑定具体技术栈
- 具体实现细节（框架、工具、库）由项目自行定义
- 元规范 `spec-meta.md` 定义文档类型和验证规则
- 设计文档规范见 `spec-design.md`

---

## 1. Scope <!-- id: spec_frontend_scope -->

### 1.1 Applicable Project Types

| 类型 | 说明 |
|------|------|
| `web-app` | Web 应用（SPA / SSR / SSG） |
| `mobile-app` | 移动应用（跨平台框架） |
| `desktop-app` | 桌面应用（Electron 等） |
| `component-library` | 组件库 |

### 1.2 Technology Agnostic

本规范适用于任何前端技术栈，包括但不限于：
- React / Next.js
- Vue / Nuxt
- Angular
- Svelte / SvelteKit
- React Native / Flutter
- Electron / Tauri

---

## 2. Directory Structure Principles <!-- id: spec_frontend_directory -->

### 2.1 Recommended Layout

```
project/
├── src/
│   ├── components/           # 可复用组件
│   │   ├── common/           # 通用组件
│   │   └── domain/           # 业务组件
│   ├── pages/                # 页面组件
│   ├── layouts/              # 布局组件
│   ├── hooks/                # 自定义 Hooks / Composables
│   ├── services/             # API 服务层
│   ├── stores/               # 状态管理
│   ├── types/                # 类型定义
│   ├── utils/                # 工具函数
│   ├── styles/               # 全局样式
│   └── assets/               # 静态资源
├── tests/                    # 测试代码
├── public/                   # 公共资源
├── docs/                     # 文档
└── README.md
```

### 2.2 Naming Principles

| 原则 | 说明 |
|------|------|
| 组件命名 | PascalCase，与文件名一致 |
| 工具函数 | camelCase |
| 常量 | UPPER_SNAKE_CASE |
| 样式文件 | 与组件名对应 |
| 测试文件 | 与被测文件名对应 |

---

## 3. Component Design <!-- id: spec_frontend_component -->

### 3.1 Component Hierarchy (Atomic Design)

| 层级 | 说明 | 示例 |
|------|------|------|
| Atoms | 最小 UI 单元 | Button, Input, Icon |
| Molecules | 原子组合 | SearchBar, FormField |
| Organisms | 复杂功能块 | Header, Sidebar, DataTable |
| Templates | 页面布局 | MainLayout, AuthLayout |
| Pages | 完整页面 | HomePage, UserPage |

### 3.2 Component Principles

| 原则 | 说明 |
|------|------|
| 单一职责 | 一个组件只做一件事 |
| 可组合性 | 通过组合构建复杂 UI |
| 可复用性 | 抽离通用逻辑 |
| 可测试性 | 便于单独测试 |

### 3.3 Component Best Practices

| Do | Don't |
|-----|-------|
| 保持组件小而专注 | 一个组件做太多事情 |
| 明确定义 Props 类型 | 使用 any 类型 |
| 使用组合而非继承 | 过度嵌套组件 |
| 提取可复用逻辑 | 在组件中写复杂业务逻辑 |
| Props 只读 | 直接修改 Props |

### 3.4 Component Organization

```
ComponentName/
├── index.{ext}           # 主组件
├── ComponentName.{style} # 样式
├── ComponentName.test.{ext} # 测试
├── types.{ext}           # 类型定义
└── hooks.{ext}           # 组件专用 Hooks（可选）
```

---

## 4. State Management <!-- id: spec_frontend_state -->

### 4.1 State Types

| 类型 | 存储位置 | 示例 |
|------|----------|------|
| Local State | 组件内部 | 表单输入、UI 状态 |
| Shared State | 全局 Store | 用户信息、主题 |
| Server State | 数据缓存层 | API 数据、缓存 |
| URL State | 路由参数 | 分页、筛选条件 |

### 4.2 State Selection Guide

```
这个状态需要跨组件共享吗？
  │
  ├─ No → Local State（组件内部）
  │
  └─ Yes → 这个状态来自服务端吗？
              │
              ├─ Yes → Server State（数据缓存层）
              │
              └─ No → 状态变化频繁吗？
                        │
                        ├─ Yes → Global Store
                        │
                        └─ No → Context / Provider
```

### 4.3 State Management Principles

| 原则 | 说明 |
|------|------|
| 最小化状态 | 只存储必要的状态 |
| 单一数据源 | 避免状态重复 |
| 状态下沉 | 状态放在最近的共同祖先 |
| 派生状态 | 可计算的值不要存储 |

---

## 5. Styling <!-- id: spec_frontend_styling -->

### 5.1 Styling Approaches

| 方案 | 适用场景 |
|------|----------|
| CSS Modules | 组件样式隔离 |
| Utility CSS | 快速开发、原子化 |
| CSS-in-JS | 动态样式、主题切换 |
| Scoped CSS | 框架原生支持 |

### 5.2 Design Tokens

使用设计变量统一设计系统：

| 类型 | 示例 |
|------|------|
| Colors | primary, secondary, error, success |
| Spacing | xs, sm, md, lg, xl |
| Typography | font-size, line-height, font-weight |
| Border Radius | sm, md, lg |
| Shadows | sm, md, lg |

### 5.3 Responsive Design

| 断点 | 典型宽度 | 设备 |
|------|----------|------|
| `sm` | ~640px | 手机横屏 |
| `md` | ~768px | 平板 |
| `lg` | ~1024px | 桌面 |
| `xl` | ~1280px | 大屏 |

### 5.4 Styling Best Practices

| Do | Don't |
|-----|-------|
| 使用设计变量 | 硬编码颜色值 |
| 移动端优先 | 只考虑桌面端 |
| 样式与逻辑分离 | 内联样式过多 |
| 语义化类名 | 无意义的类名 |

---

## 6. API Integration <!-- id: spec_frontend_api -->

### 6.1 Service Layer

将 API 调用封装在 Service 层：

| 职责 | 说明 |
|------|------|
| 请求封装 | 统一请求配置、拦截器 |
| 错误处理 | 统一错误转换 |
| 类型安全 | 定义请求/响应类型 |
| 缓存策略 | 配置缓存行为 |

### 6.2 Data Fetching Principles

| 原则 | 说明 |
|------|------|
| 声明式获取 | 使用数据获取库，而非手动管理 |
| 缓存优先 | 合理使用缓存减少请求 |
| 乐观更新 | 提升用户体验 |
| 错误边界 | 优雅处理加载/错误状态 |

### 6.3 Loading States

| 状态 | UI 表现 |
|------|---------|
| Loading | Skeleton / Spinner |
| Error | 错误提示 + 重试按钮 |
| Empty | 空状态提示 |
| Success | 数据展示 |

---

## 7. Error Handling <!-- id: spec_frontend_error -->

### 7.1 Error Types

| 类型 | 处理方式 |
|------|----------|
| 渲染错误 | Error Boundary 捕获 |
| API 错误 | 统一错误处理 |
| 用户输入错误 | 表单验证提示 |
| 网络错误 | 重试机制 + 离线提示 |

### 7.2 Error Boundary

| 原则 | 说明 |
|------|------|
| 粒度控制 | 在适当层级放置错误边界 |
| 降级 UI | 提供友好的错误界面 |
| 错误上报 | 将错误发送到监控服务 |
| 恢复机制 | 提供重试或返回选项 |

### 7.3 API Error Handling

| 错误码 | 处理方式 |
|--------|----------|
| 401 | 跳转登录页 |
| 403 | 显示无权限提示 |
| 404 | 显示资源不存在 |
| 500+ | 显示服务器错误，可重试 |

---

## 8. Testing <!-- id: spec_frontend_testing -->

### 8.1 Test Types

| 类型 | 范围 | 目标 |
|------|------|------|
| 单元测试 | 工具函数、Hooks | 快速、隔离 |
| 组件测试 | 组件渲染、交互 | 用户视角 |
| E2E 测试 | 完整用户流程 | 端到端验证 |

### 8.2 Testing Principles

| 原则 | 说明 |
|------|------|
| 测试行为，非实现 | 关注用户能看到/做到的 |
| 用户视角 | 通过可访问属性查询元素 |
| 避免 Mock 过度 | 只 Mock 外部依赖 |
| 保持独立 | 测试之间不共享状态 |

### 8.3 Query Priority

测试时查询元素的优先级：

| 优先级 | 查询方式 | 说明 |
|--------|----------|------|
| 1 | 角色（Role） | 最接近用户感知 |
| 2 | 文本内容 | 用户可见文本 |
| 3 | 表单标签 | Label 关联 |
| 4 | Test ID | 最后手段 |

### 8.4 Coverage Requirements

| 指标 | 最低要求 |
|------|----------|
| 语句覆盖率 | 70% |
| 分支覆盖率 | 60% |
| 组件覆盖率 | 核心组件 100% |

---

## 9. Performance <!-- id: spec_frontend_performance -->

### 9.1 Core Web Vitals

| 指标 | 目标 | 说明 |
|------|------|------|
| LCP | < 2.5s | 最大内容绘制 |
| FID / INP | < 100ms | 首次输入延迟 / 交互延迟 |
| CLS | < 0.1 | 累积布局偏移 |
| TTI | < 3.8s | 可交互时间 |

### 9.2 Optimization Checklist

| 优化项 | 方法 |
|--------|------|
| 代码分割 | 路由级别懒加载 |
| 图片优化 | 现代格式、懒加载、响应式 |
| 缓存 | Service Worker、HTTP Cache |
| 减少重渲染 | 组件记忆化、状态优化 |
| 虚拟列表 | 长列表虚拟化 |
| 预加载 | 关键资源预加载 |

### 9.3 Bundle Size

| 原则 | 说明 |
|------|------|
| Tree Shaking | 移除未使用代码 |
| 按需加载 | 只加载需要的模块 |
| 依赖分析 | 定期检查依赖大小 |
| 代码分割 | 分离 vendor 和业务代码 |

---

## 10. Accessibility (a11y) <!-- id: spec_frontend_a11y -->

### 10.1 WCAG Requirements

| 级别 | 要求 |
|------|------|
| A | 基础可访问性（必须） |
| AA | 增强可访问性（推荐） |

### 10.2 Accessibility Checklist

| 检查项 | 说明 |
|--------|------|
| 语义化 HTML | 使用正确的 HTML 元素 |
| ARIA 标签 | 为复杂组件添加 aria-* 属性 |
| 键盘导航 | 所有交互元素可通过键盘访问 |
| 颜色对比度 | 文字与背景对比度 >= 4.5:1 |
| 焦点可见 | 焦点状态清晰可见 |
| 图片 alt | 所有图片有描述性 alt 文本 |
| 表单标签 | 表单控件有关联的 label |

### 10.3 Accessibility Principles

| 原则 | 说明 |
|------|------|
| 可感知 | 信息可被所有用户感知 |
| 可操作 | 界面可被所有用户操作 |
| 可理解 | 内容和操作可被理解 |
| 健壮性 | 兼容辅助技术 |

---

## 11. Security <!-- id: spec_frontend_security -->

### 11.1 Security Checklist

| 检查项 | 防护措施 |
|--------|----------|
| XSS | 转义用户输入、避免 innerHTML |
| CSRF | 使用 CSRF Token |
| 敏感数据 | 不在前端存储敏感信息 |
| 依赖安全 | 定期更新、审计依赖 |
| HTTPS | 生产环境强制 HTTPS |
| CSP | 配置内容安全策略 |

### 11.2 Data Handling

| Do | Don't |
|-----|-------|
| 最小化存储数据 | 存储密码、Token 在 localStorage |
| 使用 HttpOnly Cookie | 将敏感信息暴露给 JS |
| 验证所有输入 | 信任客户端数据 |
| 审计第三方脚本 | 随意引入外部脚本 |

---

## Appendix: Checklist <!-- id: spec_frontend_appendix -->

### A. Component Review Checklist

- [ ] 符合单一职责原则
- [ ] Props 类型已定义
- [ ] 处理了 Loading/Error/Empty 状态
- [ ] 可访问性已考虑
- [ ] 响应式设计已实现
- [ ] 有对应测试用例

### B. Performance Checklist

- [ ] 图片已优化
- [ ] 关键路径资源已优化
- [ ] 代码已分割
- [ ] 无内存泄漏
- [ ] Core Web Vitals 达标

### C. Accessibility Checklist

- [ ] 键盘可导航
- [ ] 屏幕阅读器可用
- [ ] 颜色对比度达标
- [ ] 焦点状态可见
- [ ] ARIA 标签正确

---

*Version: v2.0*
*Created: 2025-12-23*
*Updated: 2025-12-23*
*Changes: v2.0 重构为技术栈无关的通用原则版本*
