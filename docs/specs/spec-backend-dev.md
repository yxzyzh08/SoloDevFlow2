# Backend Development Specification v2.2 <!-- id: spec_backend_dev -->

> 定义后端代码的开发原则、架构模式、质量标准（技术栈无关）

---

**重要声明**：

- 此规范定义后端开发的**通用原则**，不绑定具体技术栈
- 具体实现细节（语言、框架、工具）由项目自行定义
- **版本 v2.2**：新增项目规模分级，避免小项目过度设计
- 元规范 `spec-meta.md` 定义文档类型和验证规则

---

## 1. Project Scale <!-- id: spec_backend_scale -->

> 核心理念：**规模决定规范**——小项目轻装上阵，大项目严格把控。

### 1.1 Scale Definition

| 规模 | 代码量 | 团队 | 典型场景 |
|------|--------|------|----------|
| **Small** | < 2000 行 | 1-2 人 | CLI 工具、原型、内部脚本、简单 API |
| **Medium** | 2000-10000 行 | 2-5 人 | 标准业务系统、微服务 |
| **Large** | > 10000 行 | 5+ 人 | 核心系统、平台级产品 |

### 1.2 Section Applicability

| 章节 | Small | Medium | Large |
|------|:-----:|:------:|:-----:|
| Directory Structure | 简化版 | 标准版 | 标准版 |
| Architecture Patterns | 可选 | 推荐 | 必须 |
| Configuration | 基础 | 标准 | 标准 |
| Error Handling | 基础 | 标准 | 标准 |
| Logging | console 即可 | 结构化 | 结构化 |
| API Design | 推荐 | 必须 | 必须 |
| Database | 按需 | 标准 | 标准 |
| Security | 基础 | 标准 | 标准 |
| Testing | 关键路径 | 标准覆盖率 | 高覆盖率 |
| Health Check | 不需要 | 推荐 | 必须 |
| Async Processing | 不需要 | 按需 | 按需 |
| Performance | 按需 | 推荐 | 必须 |

### 1.3 Small Project Simplified Structure

小项目推荐的精简目录结构：

```
project/
├── src/
│   ├── index.{ext}       # 入口
│   ├── api.{ext}         # 路由/接口（可选）
│   ├── db.{ext}          # 数据访问（可选）
│   └── utils.{ext}       # 工具函数（可选）
├── tests/
│   └── main.test.{ext}   # 测试（关键路径）
├── .env.example
└── README.md
```

**Small 项目可以省略**：
- 分层架构（Controller/Service/Repository）
- 依赖注入
- DTO 分离
- 结构化日志
- Health Check
- 复杂的测试分层

---

## 2. Scope <!-- id: spec_backend_scope -->

### 2.1 Applicable Project Types

| 类型 | 说明 |
|------|------|
| `api-service` | RESTful / GraphQL API 服务 |
| `cli-tool` | 命令行工具 |
| `background-job` | 后台任务、定时任务 |
| `library` | 库 / SDK |

### 2.2 Technology Agnostic

本规范适用于任何后端技术栈，包括但不限于：
- Node.js / TypeScript
- Python / Django / FastAPI
- Go / Gin / Echo
- Java / Spring Boot
- Rust / Actix
- .NET / C#

---

## 2. Directory Structure Principles <!-- id: spec_backend_directory -->

### 2.1 Recommended Layout

```
project/
├── src/                      # 源代码
│   ├── controllers/          # 请求处理层
│   ├── services/             # 业务逻辑层
│   ├── repositories/         # 数据访问层
│   ├── models/               # 数据模型
│   ├── types/                # 类型定义
│   ├── utils/                # 工具函数
│   ├── config/               # 配置管理
│   └── middlewares/          # 中间件
├── tests/                    # 测试代码
│   ├── unit/                 # 单元测试
│   └── integration/          # 集成测试
├── migrations/               # 数据库迁移
├── scripts/                  # 自动化脚本
├── docs/                     # 文档
└── README.md
```

### 2.2 Layer Responsibilities

| 层级 | 职责 | 依赖方向 |
|------|------|----------|
| Controller | 处理请求/响应，参数校验 | → Service |
| Service | 业务逻辑，事务管理 | → Repository |
| Repository | 数据访问，持久化操作 | → Database |
| Model | 数据结构定义 | 无依赖 |

**原则**：依赖只能向下，不能向上或横向。

### 2.3 Naming Principles

| 原则 | 说明 |
|------|------|
| 一致性 | 整个项目使用统一的命名风格 |
| 可读性 | 名称应清晰表达用途 |
| 分层标识 | 文件名或类名应体现所属层级 |

---

## 3. Architecture Patterns <!-- id: spec_backend_architecture -->

### 3.1 Layered Architecture

```
HTTP Request
    │
    ▼
┌─────────────┐
│ Controller  │  ← 参数校验、响应格式化
└─────────────┘
    │
    ▼
┌─────────────┐
│  Service    │  ← 业务逻辑、事务管理
└─────────────┘
    │
    ▼
┌─────────────┐
│ Repository  │  ← 数据访问
└─────────────┘
    │
    ▼
  Database
```

### 3.2 Dependency Injection

| 原则 | 说明 |
|------|------|
| 面向接口 | 依赖抽象接口，不依赖具体实现 |
| 构造函数注入 | 通过构造函数传入依赖 |
| 可测试性 | 便于 Mock 替换依赖 |

### 3.3 DTO Pattern

| 类型 | 用途 |
|------|------|
| Request DTO | 外部输入数据结构 |
| Response DTO | 外部输出数据结构 |
| Entity | 内部数据模型（不直接暴露） |

**原则**：内外部数据结构分离，避免暴露内部实现细节。

---

## 4. Configuration Management <!-- id: spec_backend_config -->

### 4.1 Configuration Hierarchy

优先级（高 → 低）：

| 优先级 | 来源 | 用途 |
|--------|------|------|
| 1 | 环境变量 | 生产/敏感配置 |
| 2 | 配置文件 | 环境特定配置 |
| 3 | 默认值 | 代码内置默认 |

### 4.2 Configuration Principles

| Do | Don't |
|-----|-------|
| 使用环境变量存储敏感信息 | 硬编码密码、API Key |
| 启动时验证配置完整性 | 运行时才发现配置缺失 |
| 提供配置模板文件 | 提交敏感配置到版本控制 |
| 按环境分离配置 | 在代码中写死环境判断 |

### 4.3 12-Factor App Config

遵循 [12-Factor App](https://12factor.net/config) 配置原则：
- 配置与代码严格分离
- 配置存储在环境变量中
- 不区分"环境"，只区分配置值

---

## 5. Error Handling <!-- id: spec_backend_error -->

### 5.1 Error Classification

| 类型 | HTTP Status | 处理方式 |
|------|-------------|----------|
| 客户端错误 | 4xx | 返回明确错误信息 |
| 服务端错误 | 5xx | 记录日志，返回通用错误 |
| 业务错误 | 4xx | 返回业务错误码和消息 |

### 5.2 Error Response Format

统一错误响应结构：

```
{
  "error": {
    "code": "<ERROR_CODE>",
    "message": "<Human readable message>",
    "details": { ... }  // 可选，额外信息
  }
}
```

### 5.3 Error Handling Principles

| 层级 | 职责 |
|------|------|
| Controller | 捕获异常，转换为 HTTP 响应 |
| Service | 抛出业务异常 |
| Repository | 抛出数据访问异常 |
| Global Handler | 兜底处理未捕获异常 |

### 5.4 Global Error Handling

| 场景 | 处理策略 |
|------|----------|
| 未捕获异常 | 记录日志 → 退出进程（让进程管理器重启） |
| 未处理 Promise Rejection | 记录日志 → 可选退出或继续 |
| 优雅关闭信号 | 停止接收请求 → 完成进行中请求 → 关闭连接 |

---

## 6. Logging <!-- id: spec_backend_logging -->

### 6.1 Log Levels

| Level | 用途 |
|-------|------|
| `error` | 错误，需要立即关注 |
| `warn` | 警告，潜在问题 |
| `info` | 重要业务事件 |
| `debug` | 调试信息（生产环境关闭） |

### 6.2 Structured Logging

推荐使用结构化日志（JSON 格式）：

```
{
  "timestamp": "<ISO8601>",
  "level": "<log_level>",
  "message": "<log message>",
  "context": { ... },
  "traceId": "<trace_id>"
}
```

### 6.3 Logging Best Practices

| Do | Don't |
|-----|-------|
| 记录业务关键事件 | 记录敏感信息（密码、token） |
| 包含上下文（userId、traceId） | 在生产环境使用 debug 日志 |
| 使用结构化日志 | 记录过多无用信息 |
| 统一日志格式 | 不同模块使用不同格式 |

---

## 7. API Design <!-- id: spec_backend_api -->

### 7.1 RESTful Conventions

| 操作 | HTTP Method | URL Pattern |
|------|-------------|-------------|
| 列表 | GET | `/resources` |
| 详情 | GET | `/resources/:id` |
| 创建 | POST | `/resources` |
| 全量更新 | PUT | `/resources/:id` |
| 部分更新 | PATCH | `/resources/:id` |
| 删除 | DELETE | `/resources/:id` |

### 7.2 Response Format

成功响应：

```
{
  "data": { ... },
  "meta": {           // 可选，分页等元信息
    "total": 100,
    "page": 1,
    "pageSize": 20
  }
}
```

### 7.3 Status Codes

| Code | 用途 |
|------|------|
| 200 | 成功 |
| 201 | 创建成功 |
| 204 | 成功，无返回内容 |
| 400 | 请求参数错误 |
| 401 | 未认证 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 409 | 资源冲突 |
| 500 | 服务器内部错误 |

---

## 8. Database <!-- id: spec_backend_database -->

### 8.1 Migration Principles

| 原则 | 说明 |
|------|------|
| 版本化 | 每次变更有唯一版本号 |
| 可回滚 | 提供 up 和 down 操作 |
| 幂等性 | 同一迁移多次执行结果相同 |
| 原子性 | 单次迁移在事务中完成 |

### 8.2 Naming Conventions

| 类型 | 规则 |
|------|------|
| 表名 | 复数形式，snake_case |
| 列名 | snake_case |
| 主键 | `id` |
| 外键 | `{referenced_table}_id` |
| 索引 | `idx_{table}_{columns}` |
| 唯一约束 | `uniq_{table}_{columns}` |

### 8.3 Query Best Practices

| Do | Don't |
|-----|-------|
| 使用参数化查询 | 字符串拼接 SQL |
| 使用索引覆盖常用查询 | 全表扫描 |
| 批量操作使用事务 | 逐条操作无事务 |
| 只查询必要字段 | SELECT * |
| 使用连接池 | 每次请求新建连接 |

---

## 9. Security <!-- id: spec_backend_security -->

### 9.1 Input Validation

| 原则 | 说明 |
|------|------|
| 白名单验证 | 只接受预期格式的输入 |
| 边界检查 | 验证长度、范围、格式 |
| 类型强制 | 强制转换为预期类型 |
| 早期失败 | 在 Controller 层立即验证 |

### 9.2 Security Checklist

| 检查项 | 防护措施 |
|--------|----------|
| SQL 注入 | 参数化查询 / ORM |
| XSS | 输出转义 |
| CSRF | CSRF Token |
| 敏感数据 | 加密存储、传输 |
| 认证 | 安全的密码哈希算法 |
| 授权 | 最小权限原则 |
| 速率限制 | 防止暴力攻击 |
| HTTPS | 生产环境强制 |

### 9.3 Secrets Management

| Do | Don't |
|-----|-------|
| 使用环境变量 | 硬编码密钥 |
| 使用密钥管理服务 | 明文存储密码 |
| 定期轮换密钥 | 在日志中打印密钥 |
| 最小权限访问 | 共享密钥 |

---

## 10. Testing <!-- id: spec_backend_testing -->

### 10.1 Test Scope

开发规范只涵盖**单元测试**和**集成测试**，E2E 测试属于测试规范范畴。

```
       ┌───────────┐
       │Integration│  ← 适量，验证模块协作
      ┌┴───────────┴┐
      │    Unit     │  ← 大量，验证单个函数/类
      └─────────────┘
```

### 10.2 Test Types

| 类型 | 范围 | 目标 |
|------|------|------|
| 单元测试 | 单个函数/类 | 快速、隔离 |
| 集成测试 | 多模块协作 | 验证交互 |

### 10.3 Coverage Requirements

按项目规模设定不同的覆盖率要求：

| 指标 | Small | Medium | Large |
|------|-------|--------|-------|
| 语句覆盖率 | 关键路径 | 70% | 80% |
| 分支覆盖率 | - | 60% | 70% |
| 函数覆盖率 | - | 70% | 80% |

**Small 项目**：只需覆盖关键业务路径，不强制覆盖率指标。

### 10.4 Mock Strategy

| 依赖类型 | Mock 方式 |
|----------|----------|
| 数据库 | 内存数据库 / Repository Mock |
| 外部 API | HTTP Mock |
| 时间 | 时间 Mock |
| 文件系统 | 内存文件系统 |

### 10.5 Test Data Management

| 策略 | 用途 |
|------|------|
| Factory | 动态生成测试对象 |
| Fixture | 固定测试数据文件 |
| Seed | 数据库种子数据 |

---

## 11. Health Check <!-- id: spec_backend_health -->

### 11.1 Health Check Types

| 类型 | 用途 | 检查内容 |
|------|------|----------|
| Liveness | 进程是否存活 | 进程响应 |
| Readiness | 是否可接收流量 | 依赖服务状态 |
| Startup | 启动是否完成 | 初始化完成 |

### 11.2 Health Check Endpoints

| Endpoint | 用途 |
|----------|------|
| `/health/live` | Liveness 探针 |
| `/health/ready` | Readiness 探针 |

### 11.3 Health Response Format

```
{
  "status": "ok | degraded | unhealthy",
  "checks": {
    "<dependency_name>": {
      "healthy": true | false,
      "latency": <ms>
    }
  }
}
```

---

## 12. Async Processing <!-- id: spec_backend_async -->

### 12.1 When to Use Async

| 同步 | 异步 |
|------|------|
| 响应时间 < 200ms | 响应时间 > 200ms |
| 必须立即返回结果 | 可延迟处理 |
| 无外部依赖 | 依赖不稳定外部服务 |
| 简单 CRUD | 复杂业务流程 |

### 12.2 Common Async Patterns

| 模式 | 用途 | 适用场景 |
|------|------|----------|
| 消息队列 | 解耦、削峰、异步通知 | 订单处理、邮件发送 |
| 定时任务 | 周期性批处理 | 报表生成、数据清理 |
| 事件驱动 | 松耦合组件通信 | 领域事件、状态变更 |
| 后台作业 | 长时间运行任务 | 文件处理、数据导入 |

### 12.3 Async Best Practices

| Do | Don't |
|-----|-------|
| 任务幂等设计 | 假设任务只执行一次 |
| 实现重试机制 | 失败后静默丢弃 |
| 记录任务状态 | 无法追踪任务进度 |
| 设置超时时间 | 任务无限期运行 |
| 死信队列处理 | 忽略失败任务 |

### 12.4 Task Status Tracking

| 状态 | 说明 |
|------|------|
| `pending` | 等待处理 |
| `processing` | 处理中 |
| `completed` | 处理完成 |
| `failed` | 处理失败 |
| `cancelled` | 已取消 |

---

## 13. Performance <!-- id: spec_backend_performance -->

### 13.1 Performance Targets

| 指标 | 目标 |
|------|------|
| API 响应时间 | P95 < 200ms |
| 数据库查询 | 单次 < 50ms |
| 启动时间 | < 10s |

### 13.2 Optimization Checklist

| 检查项 | 说明 |
|--------|------|
| 数据库索引 | 查询字段建立索引 |
| N+1 问题 | 使用 JOIN 或批量查询 |
| 缓存 | 热点数据使用缓存 |
| 连接池 | 数据库/缓存使用连接池 |
| 分页 | 列表接口必须分页 |
| 异步处理 | 耗时操作异步化 |

---

## Appendix: Checklist <!-- id: spec_backend_appendix -->

### A. Code Review Checklist

- [ ] 符合分层架构原则
- [ ] 依赖注入，便于测试
- [ ] 输入已验证
- [ ] 错误已正确处理
- [ ] 日志记录充分
- [ ] 无硬编码配置
- [ ] 有对应测试用例
- [ ] 无安全漏洞

### B. Deployment Checklist

- [ ] 环境变量已配置
- [ ] 数据库迁移已执行
- [ ] 健康检查端点可用
- [ ] 日志收集已配置
- [ ] 监控告警已设置

### C. New Developer Onboarding

新成员入职时应完成：

- [ ] 阅读本规范文档
- [ ] 了解项目目录结构
- [ ] 配置本地开发环境
- [ ] 运行测试套件
- [ ] 完成一个小任务熟悉流程

---

*Version: v2.2*
*Created: 2025-12-23*
*Updated: 2025-12-23*
*Changes: v2.0 技术栈无关; v2.1 新增 Async Processing; v2.2 新增项目规模分级（Small/Medium/Large），避免小项目过度设计*
