# SoloDevFlow

> 1人 + Claude Code 的人机协作开发系统

## 安装

```bash
# 克隆项目
git clone https://github.com/your-repo/SoloDevFlow2.git
cd SoloDevFlow2

# 注册全局命令
npm link
```

## 使用

```bash
# 初始化新项目
solodevflow init <path> [--type <backend|web-app|mobile-app>]

# 示例
solodevflow init .                      # 交互式选择类型
solodevflow init . --type web-app       # 指定类型
solodevflow init ../my-project -t backend

# 升级已有项目
solodevflow upgrade .
solodevflow upgrade ../my-project

# 查看帮助
solodevflow --help
```
