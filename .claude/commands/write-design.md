# 编写 Feature Design

编写或更新功能设计文档。

## 调用方式

- `/write-design {name}` - 独立 Feature 的设计文档
- `/write-design {domain} {name}` - Domain 内 Feature 的设计文档

## 参数

**单参数调用**（独立 Feature）：
- `name`：功能名称（必填）

**双参数调用**（Domain 内 Feature）：
- `domain`：所属领域名称（必填）
- `name`：功能名称（必填）

## 输出位置

| 调用方式 | 输出位置 |
|----------|----------|
| `/write-design {name}` | `docs/_features/{name}.design.md` |
| `/write-design {domain} {name}` | `docs/{domain}/{name}.design.md` |

## 加载文件

### 步骤0: 获取规范路径

1. 读取 `.flow/state.json` 获取:
   - `project.type`（项目类型：`backend` | `web-app` | `mobile-app`）
   - `solodevflow.sourcePath`（SoloDevFlow 源路径）

### 步骤1: 加载规范和模板

1. 设计规范：`{sourcePath}/docs/specs/design-doc-spec.md`
2. 设计模板：`docs/templates/{projectType}/feature.design.md`
3. Feature Spec：对应的 `{name}.spec.md`（必须存在）
4. 现有 Design Doc：目标路径文件（如存在）

**注意**: 规范文档来自 SoloDevFlow 源目录，为只读文件。

## 执行步骤

### 2. 前置检查

1. 判断参数数量，确定调用模式和输出路径
2. **检查 Feature Spec 是否存在**（必须先有需求才能设计）
3. 检测目标设计文档是否存在
4. 读取设计规范，了解结构要求

### 3. 确定设计深度

根据功能复杂度选择设计深度：

| 级别 | 名称 | 适用场景 | 产出 |
|------|------|----------|------|
| L0 | 无设计 | 极简单，半天内完成 | **不创建设计文档** |
| L1 | 轻量设计 | 简单功能、低风险 | Overview + Interface |
| L2 | 标准设计 | 中等复杂度 | 完整必选章节 |
| L3 | 详细设计 | 复杂、高风险 | 完整必选 + 可选章节 |

**L0 处理**：
- 如果 Feature Spec 中 Design Depth 为 L0，直接返回提示：
  > "此 Feature 为 L0（无设计），无需创建设计文档。请直接进入实现阶段。"
- 不创建 .design.md 文件

**深度判断依据**（参考 design-doc-spec Section 2.2）：
- 功能复杂度
- 外部依赖数量
- 失败成本
- 实现周期

**如不确定，询问用户选择深度。**

### 3. 生成/更新设计文档

**如果不存在（新建模式）**：
1. 读取设计模板
2. 读取 Feature Spec，提取需求信息
3. 根据设计深度，填充对应章节：
   - L1：Overview + Interface Design
   - L2：+ Technical Approach + Implementation Plan + Dependencies
   - L3：+ Alternatives + Risks
4. 替换模板中的 `{name}` 为实际功能名
5. 输出到对应位置

**如果存在（更新模式）**：
1. 读取现有设计文档
2. 根据用户输入，自动判断需要更新的章节
3. 保留未变更的章节
4. 确保锚点和结构完整
5. 输出更新后的文件

### 4. 验证

- 运行校验确保符合规范
- 检查与 Feature Spec 的一致性

## 设计深度与章节对照

| 章节 | L1 | L2 | L3 |
|------|:--:|:--:|:--:|
| Overview | 必选 | 必选 | 必选 |
| Technical Approach | - | 必选 | 必选 |
| Interface Design | 必选 | 必选 | 必选 |
| Implementation Plan | - | 必选 | 必选 |
| Alternatives | - | - | 必选 |
| Dependencies | - | 可选 | 必选 |
| Risks | - | - | 必选 |

## 注意事项

- **必须先有 Feature Spec**，设计文档依赖需求定义
- 避免过度设计：选择匹配复杂度的设计深度
- L1 设计可随时升级为 L2/L3（需求变复杂时）
- 更新时保留文档版本历史
- 设计决策应记录理由，便于后续回顾
