# SoloDevFlow 2.0

> 1人 + Claude Code 的人机协作开发规范

## 核心命令

```bash
npm run status    # 查看当前状态摘要
npm run validate  # 校验 .flow/ 文件格式
```

## 状态文件

| 文件 | 用途 |
|------|------|
| `.flow/state.json` | **唯一状态源**，每次对话开始必须读取 |
| `.flow/input-log.md` | 关键输入记录 |
| `.flow/spark-box.md` | 灵光收集箱 |
| `.flow/pending-docs.md` | 文档债务追踪 |

## 流程阶段

```
项目启动 → 迭代循环（需求 ←→ 设计 ←→ 实现 → 验证）
```

阶段枚举：`project_init` | `iteration_requirements` | `iteration_design` | `iteration_implementation` | `iteration_verification`

## AI 行为规则（IMPORTANT）

### 每次对话开始
1. 读取 `.flow/state.json` 恢复状态
2. 汇报：当前阶段、任务、待处理灵光数
3. 等待人类指示

### 始终做
- 关键输入（需求/决策/反馈/变更）→ 记录到 `input-log.md`
- 灵光（与当前任务无关的想法）→ 记录到 `spark-box.md`，不打断当前任务
- 需求/设计变更前 → 先做影响分析，人类确认后再执行
- 输出 → 总分结构（先结论后细节）
- Commit 前 → 检查 `pending-docs.md`，提醒处理文档债务

### 绝不做
- 需求阶段写代码
- 跳过影响分析直接执行变更
- 丢失人类的关键输入

### 阶段引导
当人类输入与当前阶段不符时：
1. 说明当前阶段
2. 提供选项：切换阶段 or 记录到灵光收集箱
3. 等待人类决定

## 影响分析格式

```
【变更】：xxx
【直接影响】：
  - 文档A：需要更新xxx
  - 代码B：需要修改xxx
【间接影响】：
  - 模块C：因为依赖A，需要检查xxx
【建议操作顺序】：1→2→3
```

## 文件结构

```
项目根目录/
├── CLAUDE.md                    # 本文件（精简指令）
├── docs/
│   ├── 产品PRD.md
│   ├── 协作规范.md              # 详细机制定义
│   └── iterations/
│       └── 迭代X-PRD.md
├── scripts/
│   ├── status.js
│   └── validate.js
└── .flow/
    ├── state.json
    ├── input-log.md
    ├── spark-box.md
    └── pending-docs.md
```

## 详细规范

机制详细定义、阶段规则、文件格式规格 → 见 `docs/协作规范.md`

---

*v1.0 - 精简版，遵循 CLAUDE.md 最佳实践（<100行）*
