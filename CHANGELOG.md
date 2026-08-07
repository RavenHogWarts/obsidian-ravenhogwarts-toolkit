# 更新日志

本项目的重要变更记录。

格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循 [SemVer](https://semver.org/lang/zh-CN/)。

## [2.0.1](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/compare/2.0.0...2.0.1) (2026-08-07)


### 🐛 问题修复 (Bug Fixes)

* error or any typed value ([b3a73b6](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/b3a73b60070a7413c9cca53f80178491dd25ffb7))
* Unexpected browser feature "css-display-contents" ([d00772f](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/d00772f770b3e4067acce807537c065193a3ff10))


### 📝 文档 (Documentation)

* 补充版本变动记录文档 ([1c1bf4a](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/1c1bf4ab038cee8eee00da6fe92b0227824381ac))

## [未发布]

## [2.0.0] - 2026-08-07

> ⚠️ 这是一个**破坏性重构版本**。插件几乎被完全重写，架构、工具系统、设置界面与国际化均重新设计。请仔细阅读下方说明后再升级。

### 💥 破坏性变更（Breaking Changes）

- **插件主类重命名**：`CPlugin` / `AceCodeEditorPlugin` → `RHTPlugin`，并统一主模块导出。
- **源码目录结构重组**：废弃 `src/components`、`src/core`、`src/lib` 三层，重组为 `src/model`（管理器与接口）、`src/settings`（设置存储与设置页）、`src/util`（工具函数）、`src/toolkit`（各功能工具）。
- **`tableEnhancements` 工具被完全移除**：包括表格增强管理器、Markdown 表格解析器、公式引擎及 ag-grid 相关代码。
- **设置接口变更**：`IPluginSettings` 移至 `settings/IPluginSettings.ts`，新增 `toolkit` 字段（`Record<string, IToolSettings>`）；删除 `IToolSettings.version` 字段。
- **内部事件总线移除**：删除自定义 `EventBus`，`IPluginContext` 不再暴露 `emit/on/addCommand`。
- **国际化调用方式变更**：`t()` → `LL()`。
- **最低 Obsidian 版本提升**：`1.8.0` → `1.13.0`。
- **赞助链接变更**：微信/支付宝二维码 → [Ko-fi](https://ko-fi.com/ravenhogwarts)。

### 🚀 新增功能（Added）

#### 工具系统框架（核心）
- 引入全新的**工具注册与管理框架**，作为后续功能模块的基石：
  - `ToolkitRegistry` 单例：提供工具的注册、查询（`getAll`）、注销与清空。
  - `BaseTool` 抽象类：继承 Obsidian `Component`，封装初始化、加载/卸载、设置管理、启用状态与错误收集，减少各工具重复实现。
  - `@Toolkit` 装饰器：基于 `reflect-metadata`，在类上声明 `id/name/version/description/icon` 元信息并**自动注册**到注册表。
  - `ToolkitManager`：与插件生命周期深度集成，加载 `addChild` / 卸载 `removeChild`，单个工具失败不中断其他工具加载。
  - `PluginContext`：统一管理插件实例、设置存储与日志上下文。

#### 文件夹脚手架（Folder Scaffolder）— 新工具
- 全新工具，支持基于模板**批量生成文件夹结构**。
- 提供结构树编辑器、模板编辑器、剪贴板结构导入、文件夹建议输入等组件。

#### 文件夹模板（Folder Templates）— 大幅增强
- 重构为**基于规则（Rule）的模板匹配系统**：
  - `RuleMatcher`：按路径长度降序匹配，支持完全匹配、子目录匹配与根目录回退。
  - `VariableEngine` + `expressionEvaluator` + `variableContext`：支持模板变量与表达式求值（`{{date}}`、`{{time}}`、`{{title}}` 等）。
  - `applyPolicy`：模板应用策略。
  - `migrate`：旧配置自动迁移。
- 通过 `workspace.onLayoutReady` 延迟注册 `create` 事件，兼容 Obsidian UI 生命周期。

#### 快速路径（Quick Path）— 增强
- 新增**复制文件夹路径**命令与菜单项。
- 文件菜单（`file-menu`）、多选文件菜单（`files-menu`）、编辑器菜单（`editor-menu`）完整支持。
- 编辑器中可将当前文件/文件夹路径**粘贴**到光标处。
- 路径分隔符改为枚举（换行 / 逗号 / 分号 / 空格），新增独立设置界面（Toggle + Dropdown）。

#### React 化的设置界面
- 全新基于 React 19 的设置页，采用网格布局（`ObsidianSetting.Container`）。
- `ObsidianSetting` 组件：将 Obsidian 原生 Setting 封装为可组合的 React 组件，支持 `ColorComponent`、`ProgressBarComponent`、`SearchComponent`、`SliderComponent`、`TextAreaComponent` 等控件及 `className/disabled/cta/warning/tooltip/visible` 等属性。
- 每个工具渲染图标、版本号、描述，并提供独立「额外设置」入口。
- 新增通用设置布局组件 `ToolSettingsLayout`。

#### 国际化（i18n）系统重构
- 迁移到 [typesafe-i18n](https://github.com/ivanhofer/typesafe-i18n) 库，翻译调用具备完整类型约束。
- 支持简体中文 / 繁体中文 / 英文三语。
- 统一术语：「文件夹 / 文件夾」统一改为「目录 / 目錄」。

#### 工具函数库与 Obsidian 集成组件
- `Strings`：字符串判空、默认值、邮箱校验、前缀匹配、安全小写转换。
- `Objects`：`exists`、`isNullOrUndefined` 空值判断。
- `processObTemplate` / `TemplateProcessEngine`：Obsidian 模板占位符替换引擎。
- `ObsidianAppContext` + `useObsidianApp` Hook：在 React 树中安全注入 Obsidian App 实例。
- `MarkdownFileSuggestInput`、`FolderSuggestInput`、`FolderSuggest`、`FileListControl`：文件 / 文件夹建议输入与选择列表控件。

#### 测试与文档
- 新增 Jest 测试套件，覆盖 `folderScaffolder`（StructureBuilder、clipboardStructure）、`folderTemplates`（RuleMatcher、VariableEngine、applyPolicy、migrate、types）。
- 新增完整 `docs/` 文档目录：架构、工具开发指南、设置系统、文件夹模板、国际化指南、测试指南、构建与发布。

### 🔄 变更（Changed）

- 构建脚本重构：CSS 改用 PostCSS + postcss-nesting 处理，支持更灵活的构建模式参数解析。
- 迁移到 pnpm workspace 管理（新增 `pnpm-workspace.yaml`）。
- 去除第三方依赖：`fs-extra` → `node:fs`、`builtin-modules` → `builtinModules`、`ensureDirSync` → `mkdirSync`、`dotenv` → 直接读取环境变量。
- 增强 GitHub Actions 发布工作流，添加构件证明（artifact attestations）生成。
- 启用 TypeScript 实验性装饰器与 `emitDecoratorMetadata`。

### 🐛 修复（Fixed）

- **修复文件夹模板的创建时延问题**：插件加载时 vault 中已存在文件会触发批量 `create` 事件，导致模板被误套用。改为按 `stat.ctime` 时间窗（5 秒阈值）过滤与短时去重（10 秒 TTL），并修复重命名后同名文件复用导致的漏处理问题。
- 修复 `scripts/link-data.mjs` 中构建目标路径变量名（`rootDir` → `projectRoot`）指向错误的问题。
- 修复 `EventBus` 导入路径大小写导致的模块解析问题。

### 🗑️ 移除（Removed）

- 整个 `tableEnhancements` 工具模块（表格增强 / 公式 / ag-grid，约 −3,000 行）。
- `src/components`、`src/core`、`src/lib`、`types/types.ts` 等旧目录与文件。
- `main.ts` 中的样板示例代码（ribbon 图标、状态栏、示例命令、模态、定时器等）。
- 旧的 `.eslintrc`、`.eslintignore`、`MAKEFILE`、`assets` 目录。
- `package-lock.json`（改用 `pnpm-lock.yaml`）。
- `obsidian-extend.d.ts`（改由 `obsidian-typings` 提供）。

### 📦 依赖（Dependencies）

- **新增**：`react` / `react-dom` ^19.2.7、`reflect-metadata` ^0.2.2、`@tanstack/react-virtual`、`radix-ui`、`uuid`。
- **开发依赖新增**：`jest`、`ts-jest`、`typesafe-i18n`、`postcss`、`postcss-nesting`、`eslint-plugin-obsidianmd` 等。
- **环境要求**：Node.js ≥ 22.x，Obsidian ≥ 1.13.0。

### ⬆️ 升级须知

- 本次为破坏性重构，**升级前请务必备份配置**。
- 升级到 Obsidian ≥ 1.13.0。
- 若依赖 `tableEnhancements`（表格增强）功能，请暂缓升级或寻找替代方案。
- `folderTemplates` 用户的旧配置会通过 `migrate` 自动迁移，建议升级后在设置页检查。
- 升级后需在设置页重新启用所需工具。

---

## 历史

版本 `1.0.0` ~ `1.4.1`（对应 Obsidian `1.6.7` / `1.8.0`）为本项目的早期阶段，未单独维护更新日志。

[未发布]: #
[2.0.0]: https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/releases/tag/2.0.0
