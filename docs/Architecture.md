# 架构总览

本文档描述 RavenHogwarts's Toolkit（OTK）插件的运行时架构，是其他所有文档的基础。

## 一句话概览

OTK 是一种**"插件中的插件"**（host shell）架构。它没有采用单一庞大的插件类，而是由一个轻量 `Plugin` 子类作为宿主，持有 **`ToolkitManager`**，在运行时动态发现、注册、加载、卸载一组相互独立的**工具**（tool）。工具在模块导入时通过 `@Toolkit` 装饰器自我登记到一个进程级单例 **`ToolkitRegistry`**。宿主在启动时遍历该注册表，实例化每个工具，并把它们挂进 Obsidian 的 `Component` 树，从而自动获得生命周期管理。

```
                 ┌───────────────────────────────────────────────┐
                 │              RHTPlugin（宿主外壳）             │
                 │  extends obsidian.Plugin                       │
                 │                                               │
                 │  settingsStore ──► PluginSettingTab           │
                 │  pluginContext ──► ToolkitManager             │
                 └───────────────────────┬───────────────────────┘
                                         │ 读取
                                         ▼
       导入副作用触发               ToolkitRegistry（单例）
   ┌──────────┬──────────┐          Map<id, ToolClass>
   │ @Toolkit │ │ @Toolkit │  ◄────── @Toolkit 装饰器在此写入
   └────┬─────┴────┬─────┘
        │          │  实例化 + initialize(ctx)
        ▼          ▼
  ┌────────────┐ ┌──────────────┐
  │ QuickPath  │ │ FolderTpl …  │  各自 extends BaseTool extends Component
  └────────────┘ └──────────────┘
```

## 核心概念

### 1. 宿主外壳 —— `RHTPlugin`

**文件：** `src/main.ts`

`RHTPlugin` 刻意保持精简，只持有三个协作者，并在 `onload()` 中依次编排：

```ts
async onload() {
    await this.settingsStore.loadSettings();          // 1. 加载持久化设置
    this.pluginContext = new PluginContext(this);     // 2. 构建共享上下文
    this.toolkitManager = new ToolkitManager(this.pluginContext);
    await this.registerToolkit();                     // 3. 发现并初始化所有工具
    await this.toolkitManager.loadEnabledToolkit();   // 4. 激活已启用的工具
    this.settingTab = new PluginSettingTab(this);     // 5. 注册设置 UI
    this.addSettingTab(this.settingTab);
}
```

宿主**不直接引用任何具体工具**，只导入 `@src/toolkit`（触发注册的桶文件），并通过 `ITool` 接口与工具交互。这正是外壳解耦、可扩展的关键。

### 2. 注册表 —— `ToolkitRegistry`

**文件：** `src/model/manager/ToolkitRegistry.ts`

一个经典的**单例注册表**，把工具 `id` 映射到其构造函数（`new () => ITool`）。注册发生在**导入工具模块的副作用**中——`@Toolkit` 装饰器在类定义时即调用 `registry.register(...)`。

```
src/toolkit/index.ts        ← 桶文件；导入它 = 导入所有工具
  ├─ import "folderTemplates"   → @Toolkit 执行 → registry.register("folder-templates", …)
  ├─ import "folderScaffolder"  → @Toolkit 执行 → registry.register("folder-scaffolder", …)
  └─ import "quickPath"         → @Toolkit 执行 → registry.register("quick-path", …)
```

> **新增工具无需改动宿主或管理器。** 只需创建带 `@Toolkit` 装饰器的工具类，并在 `src/toolkit/index.ts` 加一行 import 即可。详见[工具开发指南](./Toolkit-Development-Guide.md)。

注册表是**类**的编译期目录，而**运行时**状态（已加载/未加载、错误、启用与否）保存在管理器中。

### 3. 装饰器 —— `@Toolkit`

**文件：** `src/model/manager/Decorators.ts`

`@Toolkit(info: IToolInfo)` 类装饰器做四件事：

1. **校验** `info.id` 与 `info.name` 必须存在。
2. **存储元数据**，通过 `Reflect.defineMetadata(...)`（键为 `Symbol.for("toolkit:meta")`），使实例随后能读取自身的 `IToolInfo`（`id`、`name`、`icon`、`version`、`description`）。
3. **注册类**到 `ToolkitRegistry`（id 重复会抛错）。
4. **在原型上定义只读的 `id`/`name`/`icon`/`version`/`description`**，使每个实例都能以普通属性暴露其元信息。

这依赖 `experimentalDecorators` + `emitDecoratorMetadata`（见 `tsconfig.json`）以及 `reflect-metadata` 运行时垫片（在 `Decorators.ts` 中导入）。

### 4. 管理器 —— `ToolkitManager`

**文件：** `src/model/manager/ToolkitManager.ts`

持有所有工具的**运行时**状态：两个 `Map`——`ITool` 实例表与 `IToolState`（`{ loaded, errors }`）表。它是唯一负责工具状态切换的地方：

| 方法 | 作用 |
| --- | --- |
| `registerTool(tool)` | 记录实例与一个全新的 `IToolState`。 |
| `loadTool(id)` | 若 `settings.enabled` 为真，将工具作为插件的**子 `Component`** 挂载 → 触发其 `onload()`。幂等。 |
| `unloadTool(id)` | 调用 `tool.onunload()` 并 `removeChild`。幂等。 |
| `enableTool(id)` / `disableTool(id)` | 先持久化 `enabled` 标志，**再**加载/卸载。 |
| `loadEnabledToolkit()` | 遍历 `settings.toolkit`，加载所有 `enabled === true` 的工具。错误按工具捕获，绝不影响外壳。 |
| `unloadToolkit()` | 全部卸载（在 `RHTPlugin.onunload` 中调用）。 |

关键设计要点：

- **父子组件关系。** `plugin.addChild(tool)` / `plugin.removeChild(tool)` 让每个工具获得 Obsidian 的自动生命周期管理（通过 `registerEvent` 注册的事件、子组件、定时器等都会在卸载时自动清理）。
- **故障隔离。** `loadEnabledToolkit()` 为每个 `loadTool` 包了 try/catch 并把错误记到该工具的状态上；一个工具崩溃不会阻止其他工具加载。

### 5. 上下文 —— `PluginContext` / `IPluginContext`

**文件：** `src/model/manager/PluginContext.ts`、`src/model/toolkit/IPluginContext.ts`

工具**不得**直接回头访问宿主插件。取而代之，它们在 `initialize()` 时收到一个 `IPluginContext`——对宿主的一层稳定、收窄的门面：

```ts
interface IPluginContext {
    readonly _app: App;                 // Obsidian App
    readonly _plugin: RHTPlugin;        // 宿主（用于 addCommand 等）
    readonly _settingsStore: SettingsStore;
    readonly _settings: IPluginSettings;
    notice(message: string): void;
    refreshSettingTab(): void;
    getToolkitSubmenu(menu, section?): Menu;         // 见 §"菜单聚合子系统"
    addToolkitMenuItem(menu, toolId, configure, section?): void;
    log(level, message, id?, ...args): void;
}
```

这层间接让工具可测试（可 stub 上下文），也让工具与宿主的私有表面解耦。

### 6. 工具契约 —— `ITool` / `BaseTool`

**文件：** `src/model/toolkit/ITool.ts`、`src/model/manager/BaseTool.ts`

`ITool` 是每个工具实现的接口；`BaseTool` 是抽象基类，提供了大量样板代码：

```
ITool（接口）                    BaseTool（抽象类，extends Component）
  info: IToolInfo        ◄────    通过 @Toolkit 的 Reflect 元数据读取
  settings: TSettings    ◄────    按 info.id 从 SettingsStore 获取
  initialize(ctx)        ◄────    保存 ctx + 加载/合并默认设置
  onload() / onunload()  ◄────    切换 enabled（同步）；super 调用管理生命周期
  getDefaultSettings()        抽象方法 —— 工具自定义默认值
  getSettingItems()           可重写 —— 返回声明式设置行
  isEnabled()                 综合运行时标志 + 持久化设置
```

> **生命周期签名是同步的**：`onload(): void`、`onunload(): void`（详见 [工具开发指南](./Toolkit-Development-Guide.md) §生命周期）。

`BaseTool` 还封装了两个工具高频使用的辅助方法：

- **`registerCommand(command)`** —— 注册一条命令，自动把 id 作用域化为 `<工具id>-<命令id>`、把命令名加 `[工具名]` 前缀，并记录 id 供 `unregisterCommands()` 统一移除。工具只需写业务本身的 `id`/`name`，无需手拼前缀。
- **`addToolkitMenuItem(menu, configure, section?)`** —— 向右键菜单添加一条归属于本工具的菜单项，自动聚合到统一子菜单（见下）。

因为 `BaseTool extends Component`，工具可直接使用 Obsidian 标准的 `registerEvent(...)` / `registerInterval(...)` / `registerDomEvent(...)` 辅助方法，并在卸载时自动清理。

### 7. 菜单聚合子系统

**文件：** `PluginContext.ts` 的 `getToolkitSubmenu` / `addToolkitMenuItem`

当多个工具都想往 Obsidian 右键菜单（`file-menu` 等）贡献条目时，若各自直接 `menu.addItem`，条目会散落在原生菜单里造成污染。OTK 的做法：

- `getToolkitSubmenu(menu)` 为每个 `Menu` 实例缓存一个**以插件名为标题的子菜单**（标题取自 `manifest.name`，图标 `wand`），所有工具的菜单项都添加到这个子菜单里。
- `addToolkitMenuItem(menu, toolId, configure, section)` 在子菜单内**按工具分组**：同一工具的连续条目紧挨在一起；切换到另一工具时先插一条分割线，使不同工具视觉分隔。
- 缓存用 `WeakMap<Menu, ...>` 承载——菜单是一次性对象（关闭即弃），被 GC 时自动清理，无需手动失效。

工具侧只需调用 `this.addToolkitMenuItem(menu, item => { item.setTitle(...); ... })`，无需感知子菜单与分组细节。

### 8. 设置模型

**文件：** `src/settings/IPluginSettings.ts`、`src/model/toolkit/IToolSettings.ts`

```
IPluginSettings
└─ toolkit: Record<toolId, IToolSettings>
                      ├─ enabled: boolean
                      ├─ config: Record<string, any>   ← 工具专属选项
                      └─ data?:   Record<string, any>  ← 工具专属运行时数据
```

`config` 与 `data` 在接口层刻意保持为松类型；每个工具用自己的 `ISettings extends IToolSettings` 收窄类型。合并语义与声明式 UI API 见[设置系统](./Settings-System.md)。

## 生命周期

```
loadSettings() ──► new PluginContext ──► new ToolkitManager
                                                      │
                              registerToolkit() ◄─────┤  遍历每个已注册类：
                                                      │    new tool()
                                                      │    tool.initialize(ctx)  // 合并默认值
                                                      ▼
                          loadEnabledToolkit() ─── 遍历每个已启用工具：
                                                      │    plugin.addChild(tool)  → tool.onload()
                                                      ▼
                                  new PluginSettingTab ── addSettingTab
                                                      │
                                                 [运行中]
                                                      │
                              用户切换某工具      ───┤  enableTool/disableTool
                                                      │
                                          onunload()  │  unloadToolkit()
                                                      ▼
                                          遍历每个工具：tool.onunload() + removeChild
```

## 设计原则

1. **对扩展开放，对修改关闭。** 新增工具无需改动宿主。注册表 + 装饰器让外壳的工具清单变成数据驱动。
2. **工具自我封闭。** 一个工具拥有自己的命令、事件处理、设置 schema 与 UI 行。外壳只负责编排生命周期与共享服务。
3. **故障隔离。** 加载一个工具不会拖垮其他工具。错误被捕获并对外暴露（`tool.getErrors()`、日志），而非向上抛给宿主。
4. **以组合复用生命周期，而非重新实现。** 复用 Obsidian 的 `Component` 父子树，意味着事件、定时器、DOM 监听的自动清理——无需手工维护销毁账本。
5. **稳定、收窄的上下文。** 工具依赖 `IPluginContext`，而非 `RHTPlugin` 内部，因此宿主演进不会破坏工具。
6. **可测试的 service 层。** 复杂逻辑（规则匹配、表达式求值、结构序列化）放在无框架依赖的纯函数 service 模块里，输入输出都是纯数据，因此无需 Obsidian 即可单元测试。见[测试指南](./Testing-Guide.md)。

## 运行时依赖关系

```
RHTPlugin
 ├── SettingsStore ──►（读写）plugin.settings（持久化 data.json）
 ├── PluginContext ──►（RHTPlugin + SettingsStore 的门面；含菜单聚合子系统）
 ├── ToolkitManager ──►（使用 PluginContext）
 │      ├── ITool 实例（BaseTool 子类）
 │      │      ├── PluginSettingTab.getSettingDefinitions() 读取 tool.getSettingItems()
 │      │      └── 每个工具通过 context._settingsStore 读取自身设置
 └── PluginSettingTab ──► getSettingDefinitions() / getControlValue() / setControlValue()
```

## 核心文件地图

```
src/
├─ main.ts                         # RHTPlugin 宿主外壳
├─ model/
│  ├─ manager/
│  │  ├─ ToolkitRegistry.ts        # 工具类的单例目录
│  │  ├─ ToolkitManager.ts         # 运行时工具状态机
│  │  ├─ BaseTool.ts               # 工具抽象基类（含命令/菜单辅助方法）
│  │  ├─ Decorators.ts             # @Toolkit 装饰器
│  │  └─ PluginContext.ts          # IPluginContext 实现（含菜单聚合）
│  └─ toolkit/
│     ├─ ITool.ts                  # 工具契约
│     ├─ IToolInfo.ts              # 工具元信息
│     ├─ IToolSettings.ts          # 单工具设置形状
│     └─ IPluginContext.ts         # 上下文门面接口
├─ settings/
│  ├─ IPluginSettings.ts           # 根设置形状
│  ├─ SettingsStore.ts             # 加载/合并/更新 + 外部 store
│  ├─ PluginSettingTab.ts          # Obsidian 1.13 声明式设置页
│  ├─ reactSetting.tsx             # React ↔ Obsidian 设置桥接
│  └─ suggest.ts                   # 用于文件夹/文件选择的 AbstractInputSuggest
├─ toolkit/                        # 具体工具
│  ├─ index.ts                     # 桶文件：导入所有工具（触发注册）
│  ├─ folderTemplates/             # @Toolkit("folder-templates")
│  ├─ folderScaffolder/            # @Toolkit("folder-scaffolder")
│  └─ quickPath/                   # @Toolkit("quick-path")
├─ util/                           # 通用工具函数（Objects、Strings）
└─ i18n/                           # typesafe-i18n 生成代码 + 语言包
```

各子系统的深入剖析见其余文档。
