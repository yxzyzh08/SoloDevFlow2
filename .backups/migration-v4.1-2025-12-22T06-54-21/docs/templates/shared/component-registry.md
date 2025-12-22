# UI Component Registry <!-- id: ui_component_registry -->

> 项目 UI 组件注册表，用于组件查询和复用管理

---

## 1. Component Categories <!-- id: ui_component_categories -->

| Category | Description | 示例 |
|----------|-------------|------|
| Atomic | 原子组件，最小可复用单元 | Button, Input, Icon, Label |
| Molecular | 分子组件，由原子组件组合 | Form, Card, SearchBox, MenuItem |
| Organism | 有机体组件，复杂功能单元 | Header, Sidebar, Footer, DataTable |
| Template | 模板组件，页面布局框架 | PageLayout, FormLayout, DashboardLayout |

---

## 2. Registered Components <!-- id: ui_component_list -->

> 按类别组织，每个组件记录：名称、路径、描述、版本

### 2.1 Atomic Components

| Component | Path | Description | Since |
|-----------|------|-------------|-------|
| Button | src/components/Button | 基础按钮（primary/secondary/danger） | v1.0 |
| Input | src/components/Input | 输入框（text/password/number） | v1.0 |
| Icon | src/components/Icon | 图标组件 | v1.0 |
| Label | src/components/Label | 标签文本 | v1.0 |
| Badge | src/components/Badge | 徽章/标记 | v1.0 |
| Avatar | src/components/Avatar | 头像展示 | v1.0 |
| Spinner | src/components/Spinner | 加载指示器 | v1.0 |

### 2.2 Molecular Components

| Component | Path | Description | Since |
|-----------|------|-------------|-------|
| Form | src/components/Form | 表单容器 | v1.0 |
| Card | src/components/Card | 卡片容器 | v1.0 |
| Modal | src/components/Modal | 模态对话框 | v1.0 |
| Dropdown | src/components/Dropdown | 下拉菜单 | v1.0 |
| Tabs | src/components/Tabs | 标签页切换 | v1.0 |
| SearchBox | src/components/SearchBox | 搜索框 | v1.0 |
| Pagination | src/components/Pagination | 分页控件 | v1.0 |

### 2.3 Organism Components

| Component | Path | Description | Since |
|-----------|------|-------------|-------|
| Header | src/components/Header | 页面头部 | v1.0 |
| Sidebar | src/components/Sidebar | 侧边导航 | v1.0 |
| Footer | src/components/Footer | 页面底部 | v1.0 |
| DataTable | src/components/DataTable | 数据表格（排序/筛选/分页） | v1.0 |
| NavMenu | src/components/NavMenu | 导航菜单 | v1.0 |

### 2.4 Template Components

| Component | Path | Description | Since |
|-----------|------|-------------|-------|
| PageLayout | src/layouts/PageLayout | 标准页面布局 | v1.0 |
| FormLayout | src/layouts/FormLayout | 表单页面布局 | v1.0 |
| DashboardLayout | src/layouts/DashboardLayout | 仪表盘布局 | v1.0 |
| AuthLayout | src/layouts/AuthLayout | 认证页面布局 | v1.0 |

---

## 3. Registration Guidelines <!-- id: ui_component_guidelines -->

### 3.1 何时注册

- 新组件开发完成并测试通过
- 组件可被其他 Feature 复用
- 组件符合项目设计规范

### 3.2 注册信息

| 字段 | 说明 | 格式 |
|------|------|------|
| Component | 组件名 | PascalCase |
| Path | 代码路径 | 相对于项目根目录 |
| Description | 一句话描述 | 简洁明了 |
| Since | 引入版本 | vX.Y |

### 3.3 命名规范

- 使用 PascalCase（如 `DataTable`，不是 `dataTable`）
- 名称应描述组件功能（如 `SearchBox`，不是 `Box1`）
- 避免过于通用的名称（如 `Component`）

---

## 4. Component Query Flow <!-- id: ui_component_query -->

**设计阶段执行**：

```
1. 列出 Feature 涉及的 UI 需求
2. 查询本文档的 Registered Components
3. 对每个需求标记：
   - 复用：引用现有组件名
   - 新建：说明原因（无现有组件 / 需求差异大）
4. 记录到 Feature Design 的 UI Components 章节
```

---

## 5. Update History <!-- id: ui_component_history -->

| Date | Component | Action | Feature |
|------|-----------|--------|---------|
| {date} | Initial | 创建初始组件集 | 项目初始化 |

---

*Updated: {date}*
