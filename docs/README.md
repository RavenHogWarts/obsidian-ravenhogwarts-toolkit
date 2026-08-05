# RavenHogwarts's Toolkit (OTK) — 技术文档

本目录包含 **RavenHogwarts's Toolkit** Obsidian 插件（又称 **OTK** / Obsidian Toolkit）的技术文档。

本插件采用**基于注册表的"插件中的插件"架构**：一个轻量宿主外壳（host shell）在运行时负责加载、管理、卸载一组相互独立的"工具"（tool）。每个工具通过装饰器自我注册，并遵循统一的生命周期、设置模型与 UI 契约。

## 文档索引

| 文档 | 适合读者 | 简介 |
| --- | --- | --- |
| [架构总览](./Architecture.md) | 所有开发者 | 全局视图：宿主外壳、工具注册表、生命周期、菜单聚合子系统、依赖关系与设计原则。**建议先读。** |
| [工具开发指南](./Toolkit-Development-Guide.md) | 工具作者 | 从零编写一个新工具的完整步骤：`@Toolkit` 装饰器、`BaseTool`、生命周期钩子、命令与菜单注册。 |
| [设置系统](./Settings-System.md) | 所有开发者 | 设置的存储、合并、更新机制；Obsidian 1.13 声明式设置 API；React "孤岛" 桥接。 |
| [工具详解：Folder Templates](./Tool-Folder-Templates.md) | 工具作者 / 维护者 | 最复杂工具的深度剖析：规则匹配、作用域、应用策略、变量引擎与受控表达式求值器。 |
| [构建与发布](./Build-and-Release.md) | 维护者 | esbuild 构建流水线、部署脚本、版本号管理、GitHub Actions 发布流程。 |
| [国际化指南](./i18n-Guide.md) | 所有贡献者 | `typesafe-i18n` 配置、语言包文件与同步工作流。 |
| [测试指南](./Testing-Guide.md) | 所有贡献者 | Jest 配置、测试约定、obsidian 运行时桩，以及 service 层"可测试性"设计模式。 |

## 当前工具一览

| 工具 | id | 简介 |
| --- | --- | --- |
| **Folder Templates** | `folder-templates` | 在指定文件夹创建新文件时自动套用模板，可选重命名与变量渲染。 |
| **Folder Scaffolder** | `folder-scaffolder` | 复制/粘贴文件夹结构、存为模板并一键克隆整套目录骨架。 |
| **Quick Path** | `quick-path` | 快速获取文件/文件夹路径，复制到剪贴板或粘贴到编辑器。 |

## 快速上手

如果时间有限，建议按顺序阅读：

1. **[架构总览](./Architecture.md)** —— 理解"宿主外壳 → 注册表 → 工具"三者关系。
2. **[工具开发指南](./Toolkit-Development-Guide.md)** —— 浏览一个最小工具的完整示例。

## 项目概览

| 项 | 说明 |
| --- | --- |
| **语言** | TypeScript（目标 `ES2017`，模块 `ESNext`）；React 孤岛使用 JSX |
| **运行时** | Obsidian ≥ 1.13（桌面端与移动端），打包为 CommonJS |
| **打包器** | esbuild（`scripts/esbuild.config.mjs`），PostCSS 处理嵌套 CSS |
| **包管理器** | pnpm（Node ≥ 22） |
| **UI 层** | Obsidian 1.13 声明式设置 + React 19 孤岛 |
| **国际化** | typesafe-i18n（`zh` 基准、`en`、`zh-TW`） |
| **许可证** | GPL-3.0-only |

## 约定

- 代码注释与源码级文档使用**中文**，与原作者风格一致。本 `docs/` 目录同为中文；如有出入，以代码为准。
- 全代码库使用路径别名 `@src/*` → `./src/*`、`@styles/*` → `./styles/*`。
- 贡献流程、提交规范与 PR 流程见根目录的 [`CONTRIBUTING.md`](../CONTRIBUTING.md)。
