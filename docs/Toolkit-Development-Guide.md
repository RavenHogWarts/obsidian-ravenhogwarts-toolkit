# 工具开发指南

本指南讲解如何为 OTK 新增一个**工具**。工具是一个自包含的功能单元（命令、菜单、事件处理、设置），由宿主外壳在运行时加载/卸载。得益于注册表模式，新增工具**完全不需要改动宿主**——只需创建文件并加一行 import。

> 前置阅读：先读 [架构总览](./Architecture.md)，理解宿主外壳、注册表、`BaseTool` 生命周期与菜单聚合子系统。

## 五个步骤

1. 在 `src/toolkit/<yourTool>/` 下创建工具目录。
2. 定义带类型的 `ISettings` 与 `DefaultSettings`。
3. 编写工具类，继承 `BaseTool<ISettings>` 并加 `@Toolkit` 装饰器。
4.（可选）通过 `getSettingItems()` 提供设置行，或通过 `reactSetting()` 提供 React 孤岛。
5. 在 `src/toolkit/index.ts` 加一行 import 完成注册。

仅此而已。外壳会在下次加载时自动发现它。

## 第一步 —— 目录结构

遵循现有约定：

```
src/toolkit/<yourTool>/
├── index.ts        # 工具类（入口）
├── types.ts        # ISettings、枚举、默认设置
├── service/        #（可选）纯函数、可测试逻辑
├── settings/       #（可选）设置 UI 的 React 组件
└── util/           #（可选）辅助函数、迁移
```

让 `index.ts` 专注于 Obsidian 集成（接事件/命令）；把所有非平凡逻辑下沉到 `service/` 作为纯函数——这正是工具可单元测试的关键。见[测试指南](./Testing-Guide.md)。

## 第二步 —— 定义设置

**文件：** `src/toolkit/<yourTool>/types.ts`

每个工具的设置都继承 `IToolSettings`，并拆分为三个固定键：`enabled`、`config`、`data`。

```ts
import { IToolSettings } from "@src/model/toolkit/IToolSettings";

export interface ISettings extends IToolSettings {
    config: {
        // 用户可配置的选项放这里
        greeting: string;
        repeatCount: number;
    };
    // data 可选；用于需要持久化的派生/运行时状态
}

export const DefaultSettings: ISettings = {
    enabled: false,            // 工具默认禁用，由用户主动开启
    config: {
        greeting: "Hello",
        repeatCount: 1,
    },
};
```

> 设置合并逻辑（见[设置系统](./Settings-System.md)）按 **`DefaultSettings` 的形状**递归。务必提供完整的默认对象，以便老用户能自动补上新键。

## 第三步 —— 编写工具类

**文件：** `src/toolkit/<yourTool>/index.ts`

```ts
import { LL } from "@src/i18n/i18n";
import { BaseTool } from "@src/model/manager/BaseTool";
import { Toolkit } from "@src/model/manager/Decorators";
import type { SettingDefinitionItem } from "obsidian";
import { DefaultSettings, ISettings } from "./types";

@Toolkit({
    id: "my-tool",                 // 必须唯一、kebab-case；用作设置键
    name: LL.settings.my_tool.name(),
    icon: "wrench",                // Lucide 图标名
    version: "1.0.0",
    description: LL.settings.my_tool.desc(),
})
export class MyTool extends BaseTool<ISettings> {
    getDefaultSettings(): ISettings {
        return DefaultSettings;
    }

    onload(): void {
        super.onload();                  // 永远先调 super；它会置 enabled=true
        this.registerCommands();         // 注册命令、事件、菜单
    }

    onunload(): void {
        this.unregisterCommands();       // 统一移除本工具注册的命令
        super.onunload();                // 永远最后调 super；它会置 enabled=false
    }

    private registerCommands(): void {
        // 命令 id 自动作用域化为 "my-tool-do"，名称自动加 "[工具名] " 前缀
        this.registerCommand({
            id: "do",
            name: "Do the thing",
            callback: () => {
                const { greeting, repeatCount } = this.settings.config;
                this.context.notice(`${greeting} `.repeat(repeatCount).trim());
            },
        });
    }
}
```

### 生命周期钩子

| 钩子 | 签名 / 触发时机 | super 调用 |
| --- | --- | --- |
| `initialize(ctx)` | `async initialize(ctx): Promise<void>`；构造后、任何加载前各执行一次。`BaseTool` 保存 `ctx` 并合并默认设置。仅在需于 `super.initialize()` 之前做迁移时才重写。 | 调用 `super.initialize(ctx)` |
| `onload()` | **同步** `onload(): void`；工具被启用时（`enableTool` / `loadEnabledToolkit`）。在此注册命令、事件、菜单。 | **先**调 `super.onload()` |
| `onunload()` | **同步** `onunload(): void`；被禁用或插件卸载时。 | **后**调 `super.onunload()` |
| `getSettingItems()` | 懒加载，构建设置页时。返回声明式设置行。 | 无 |

> `onload`/`onunload` 是**同步**的（`void`，非 `Promise`）。这是 `ITool` 契约的当前定义。若 `onload` 内部有异步工作，自行 `void` 掉或用 `.then(...)`/`async` IIFE 即可，但不要把钩子本身声明为 `async`（与基类签名不符）。

### `BaseTool` 提供的能力

核心访问：

- `this.context` —— `IPluginContext`（app、plugin、settingsStore、notice、log、菜单聚合方法……）。
- `this.settings` —— 你的强类型 `ISettings`，直接从 store 读取。
- `this.info` —— 装饰器写入的 `{ id, name, icon, version, description }`。

命令与菜单（封装好的便捷方法）：

- `this.registerCommand(command)` —— 注册命令；自动把 id 作用域化为 `<工具id>-<command.id>`，名称加 `[工具名]` 前缀，并记账以便统一移除。
- `this.unregisterCommands()` —— 移除本工具通过 `registerCommand` 注册的全部命令。在 `onunload` 调用一次即可。
- `this.addToolkitMenuItem(menu, configure, section?)` —— 向右键菜单添加一条本工具的菜单项，自动聚合到统一子菜单、按工具分组（切换工具插分割线）。见 [架构总览](./Architecture.md) §菜单聚合子系统。

Obsidian `Component` 自动清理：

- `this.registerEvent(ref)` / `this.registerInterval(id)` / `this.registerDomEvent(...)` —— Obsidian 标准辅助方法；**卸载时自动清理**，这类注册通常无需在 `onunload` 里手动撤销。

数据写入：

- `this.updateConfig(key, value)` / `this.updateData(key, value)` —— 持久化到 `config.*` / `data.*` 并通知。
- `this.addError(err)` / `this.getErrors()` —— 上报非致命错误。

## 第四步 —— 声明式设置行

**文件：** 同 `index.ts`，重写 `getSettingItems()`。

OTK 使用 Obsidian 1.13 的**声明式设置 API**。每一行是一个 `SettingDefinitionItem`，带一个点分 `key`，指向 `settings.toolkit.<id>.<path>`。设置页会自动读写这些键。

```ts
getSettingItems(): SettingDefinitionItem[] {
    const id = this.info.id;
    return [
        {
            name: "Greeting",
            desc: "The text to show",
            control: {
                type: "text" as const,
                key: `toolkit.${id}.config.greeting`,   // 指向设置的点分路径
                defaultValue: DefaultSettings.config.greeting,
            },
        },
        {
            name: "Repeat count",
            desc: "How many times to repeat",
            control: {
                type: "dropdown" as const,
                key: `toolkit.${id}.config.repeatCount`,
                defaultValue: 1,
                options: { "1": "Once", "2": "Twice", "3": "Thrice" },
            },
        },
    ];
}
```

control 的 `type` 共有 9 种：`toggle`、`text`、`textarea`、`number`、`dropdown`、`file`、`folder`、`slider`、`color`；此外还有 `validate`（校验）与 `disabled`（禁用）可选字段，以及用于任意 React UI 的 `reactSetting(...)`。完整清单与字段语义见[设置系统](./Settings-System.md)。

> 设置页会**自动为每个工具前置**一个 "Enabled" 开关——不要自己加。切换它会调用 `manager.enableTool`/`disableTool`，进而加载/卸载工具。

## 第五步 —— 注册工具

**文件：** `src/toolkit/index.ts`

只加一行 import。导入这个模块时即执行 `@Toolkit` 装饰器，把类注册进 `ToolkitRegistry`。

```ts
import "@src/toolkit/folderTemplates";
import "@src/toolkit/folderScaffolder";
import "@src/toolkit/quickPath";
import "@src/toolkit/myTool";          // ← 加这一行
```

到此完成。下次插件加载时，`RHTPlugin.registerToolkit()` 会实例化并初始化你的工具，它会出现在设置页里。

## 国际化

绝不硬编码用户可见字符串。在每个语言包文件（`src/i18n/zh`、`en`、`zh-TW`）的 `LL.settings.<your_tool>` 与 `LL.command.<your_tool>` 下添加键。见[国际化指南](./i18n-Guide.md)。随后重新生成类型绑定。

## 新工具自检清单

- [ ] `src/toolkit/<tool>/types.ts` 含 `ISettings extends IToolSettings` 与完整的 `DefaultSettings`。
- [ ] `src/toolkit/<tool>/index.ts` 含一个 `@Toolkit` 装饰、继承 `BaseTool<ISettings>` 的类。
- [ ] `getDefaultSettings()` 返回 `DefaultSettings`。
- [ ] `onload()` 先调 `super.onload()`，再注册命令/事件/菜单。
- [ ] `onunload()` 撤销命令注册后，再调 `super.onunload()`。
- [ ] `getSettingItems()` 返回声明式行（键前缀 `toolkit.<id>.config.*`）。
- [ ] 已在 `src/toolkit/index.ts` 加 import。
- [ ] 已在三个语言包加 i18n 键并重新生成类型。
- [ ] 纯逻辑已抽到 `service/` 并配单元测试。
- [ ] `pnpm run lint` 与 `pnpm test` 通过。

## 参考实现

- **`quickPath`**（`src/toolkit/quickPath/`）—— 规范的简单范例：`registerCommand` + `registerEvent` 接 `file-menu`/`editor-menu` + 几个 toggle/dropdown 设置。优先读它。
- **`folderScaffolder`**（`src/toolkit/folderScaffolder/`）—— 命令 + 右键菜单聚合（`addToolkitMenuItem`）+ Modal + 持久化模板的范例；其 service 层（结构收集、剪贴板序列化）是纯函数化的典范。
- **`folderTemplates`**（`src/toolkit/folderTemplates/`）—— 全功能范例：复杂的强类型设置、React 设置孤岛、迁移步骤、纯 service、`${...}` 变量渲染。见[工具详解：Folder Templates](./Tool-Folder-Templates.md)。
