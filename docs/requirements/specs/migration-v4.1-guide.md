# Migration Guide: Documentation Separation (v4.1)

> 从统一 docs/ 结构迁移到分离的 requirements/designs/ 结构

---

## 概述

**版本**: v4.0 → v4.1
**迁移日期**: 2025-01-22
**影响范围**: 目录结构、所有脚本、AI命令

### 变更原因

requirements-doc.spec.md 和 design-doc-spec.md 之间存在矛盾：
- requirements-doc.spec Line 49 (v4.0): "需求目录只存放需求文档"
- design-doc-spec 却显示需求和设计文档混合存储

v4.1 解决了这个矛盾，实现了需求与设计的完全分离。

---

## 新目录结构

### 变更前 (v4.0)
```
docs/
├── prd.md
├── specs/
├── templates/
├── _features/
│   ├── *.spec.md        # 需求
│   └── *.design.md      # 设计（混合）
├── {domain}/
│   ├── *.spec.md
│   └── *.design.md
├── _capabilities/
└── _flows/
```

### 变更后 (v4.1)
```
docs/
├── requirements/              # ✨ 需求文档树
│   ├── prd.md
│   ├── specs/
│   ├── templates/
│   ├── _features/
│   │   └── *.spec.md
│   ├── {domain}/
│   │   └── *.spec.md
│   ├── _capabilities/
│   └── _flows/
│
└── designs/                   # ✨ 设计文档树
    ├── _features/
    │   └── *.design.md
    ├── {domain}/
    │   └── *.design.md
    ├── _capabilities/
    └── _flows/
```

### 关键变化

1. **完全分离**: 需求 (.spec.md) 和设计 (.design.md) 在不同的顶层目录
2. **镜像结构**: designs/ 镜像 requirements/ 的子目录结构
3. **规范位置**: specs/ 和 templates/ 归属于 requirements/

---

## 迁移步骤

### 前提条件

1. ✅ 已备份项目
2. ✅ Git工作区干净（建议）
3. ✅ 已更新 SoloDevFlow 到 v2.1+

### 自动迁移（推荐）

#### 1. 预览迁移

```bash
node scripts/migrate-docs-separation.js --dry-run
```

这会显示：
- 将要移动的文件列表
- 目标位置
- 不会实际修改任何文件

#### 2. 执行迁移

```bash
node scripts/migrate-docs-separation.js
```

脚本会自动:
- ✓ 创建带时间戳的备份
- ✓ 迁移所有文档到新结构
- ✓ 更新 state.json 中的路径
- ✓ 验证文件完整性（checksum）
- ✓ 生成 rollback 脚本

#### 3. 验证

```bash
npm run validate:docs
npm run validate:state
```

#### 4. 测试 AI 命令

```bash
# 测试写需求
/write-feature test-feature

# 测试写设计
/write-design test-feature
```

检查输出路径是否正确：
- Feature Spec → `docs/requirements/_features/`
- Design Doc → `docs/designs/_features/`

### 如果出现问题

#### 回滚

```bash
node scripts/migrate-docs-separation.js --rollback ".backups/migration-v4.1-YYYYMMDD-HHMMSS"
```

或执行备份目录中的 `rollback.bat`

---

## 手动迁移（不推荐）

如果必须手动迁移：

### 1. 创建新目录

```bash
mkdir docs/requirements
mkdir docs/designs
```

### 2. 移动文件

```bash
# PRD
move docs/prd.md docs/requirements/

# 规范和模板
move docs/specs docs/requirements/
move docs/templates docs/requirements/

# 需求文档 (.spec.md)
move docs/_features docs/requirements/
move docs/{domain} docs/requirements/{domain}
move docs/_capabilities docs/requirements/
move docs/_flows docs/requirements/

# 设计文档 (.design.md)
mkdir docs/designs/_features
mkdir docs/designs/{domain}
move docs/_features/*.design.md docs/designs/_features/
move docs/{domain}/*.design.md docs/designs/{domain}/
```

### 3. 更新 state.json

查找所有 `docPath` 并更新：
```json
{
  "features": {
    "my-feature": {
      "docPath": "docs/requirements/_features/my-feature.spec.md"
    }
  }
}
```

### 4. 手动验证

逐个检查文件是否在正确位置。

---

## 路径映射表

| 旧路径 (v4.0) | 新路径 (v4.1) | 类型 |
|--------------|-------------|------|
| `docs/prd.md` | `docs/requirements/prd.md` | 需求 |
| `docs/specs/*` | `docs/requirements/specs/*` | 规范 |
| `docs/templates/*` | `docs/requirements/templates/*` | 模板 |
| `docs/_features/*.spec.md` | `docs/requirements/_features/*.spec.md` | 需求 |
| `docs/_features/*.design.md` | `docs/designs/_features/*.design.md` | 设计 |
| `docs/{domain}/*.spec.md` | `docs/requirements/{domain}/*.spec.md` | 需求 |
| `docs/{domain}/*.design.md` | `docs/designs/{domain}/*.design.md` | 设计 |
| `docs/_capabilities/*.spec.md` | `docs/requirements/_capabilities/*.spec.md` | 需求 |
| `docs/_flows/*.spec.md` | `docs/requirements/_flows/*.spec.md` | 需求 |

---

## 影响的文件和工具

### 已自动更新（SoloDevFlow v2.1+）

✅ `scripts/validate-docs.js`
✅ `scripts/analyze-impact.js`
✅ `scripts/init.js`
✅ `.claude/commands/write-prd.md`
✅ `.claude/commands/write-feature.md`
✅ `.claude/commands/write-design.md`
✅ `.claude/commands/write-flow.md`
✅ `.claude/commands/write-capability.md`
✅ `.claude/skills/requirements-expert/SKILL.md`

### 需要手动更新

如果你在项目中有自定义脚本或配置引用了旧路径，需要手动更新。

常见位置：
- 自定义 npm scripts
- CI/CD 配置
- 文档中的相对链接
- 自定义 Claude 命令

---

## 常见问题

### Q: 我必须迁移吗？

**A**: 不强制，但强烈推荐：
- v4.0 结构与规范定义不一致
- 新项目将默认使用 v4.1 结构
- 未来版本将逐步淘汰 v4.0 支持

### Q: 迁移会破坏现有的 git 历史吗？

**A**: 不会。迁移脚本使用复制而非移动，保留原始文件历史。建议迁移后创建一个清晰的 commit。

### Q: Feature Spec 的 Artifacts 表怎么办？

**A**: Artifacts 表中的设计文档路径会自动指向新的 `docs/designs/` 位置：

```markdown
| Type | Path | Required |
|------|------|----------|
| Design | docs/designs/{domain}/{name}.design.md | Yes |
```

### Q: 我可以只迁移部分文件吗？

**A**: 不建议。部分迁移会导致结构混乱和验证失败。

### Q: 迁移后 claude-code 找不到文件？

**A**: 确保你使用的是 SoloDevFlow v2.1+，所有命令已更新路径。

### Q: 回滚会丢失数据吗？

**A**: 不会。迁移脚本会创建完整备份，回滚会恢复所有文件。

---

## 验收清单

迁移完成后，检查以下项：

- [ ] 运行 `npm run validate:docs` 无错误
- [ ] 运行 `npm run validate:state` 通过
- [ ] `/write-feature test` 输出到 `docs/requirements/_features/`
- [ ] `/write-design test` 输出到 `docs/designs/_features/`
- [ ] `node scripts/analyze-impact.js docs/requirements/prd.md` 正常工作
- [ ] 所有现有功能的 docPath 在 state.json 中正确
- [ ] Git 工作区干净，可以提交
- [ ] 备份文件存在于 `.backups/` 目录

---

## 获取帮助

### 迁移脚本帮助

```bash
node scripts/migrate-docs-separation.js --help
```

### 报告问题

如果遇到迁移问题，请提供：
1. 错误消息
2. 迁移脚本输出（使用 `--verbose`）
3. `npm run validate:docs` 输出
4. 你的项目类型和结构

GitHub Issue: https://github.com/your-repo/issues

---

## 变更记录

### v4.1 (2025-01-22)
- 完全分离需求和设计文档到独立目录树
- 添加自动迁移脚本
- 更新所有工具和命令以支持新结构
- 修正规范矛盾

### v4.0 (2025-01-21)
- 移除 Domain Spec 作为独立文档类型
- 引入 Feature anchor system

---

**迁移脚本版本**: v1.0
**文档版本**: v1.0
**最后更新**: 2025-01-22
