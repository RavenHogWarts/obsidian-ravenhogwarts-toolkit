# 设置系统

本文档讲解 OTK 如何存储设置、如何为老用户合并默认值、Obsidian 1.13 声明式设置 API（含全部控件类型），以及复杂设置 UI 所用的 React "孤岛"桥接。

> 设置的数据形状见 [架构总览](./Architecture.md) §设置模型。本文聚焦"机制"。

## 存储形状

设置由 Obsidian 以单个 JSON 对象持久化在 `data.json`（插件的 `loadData`/`saveData`）。形状如下：

```jsonc
{
  "toolkit": {
    "folder-templates": {
      "enabled": true,
      "config": { "version": 1, "templatesFolderPath": "" },
      "data":   { "rules": [ /* … */ ] }
    },
    "quick-path": {
      "enabled": true,
      "config": { "addEditorMenu": true, /* … */ }
    }
    // … 每个工具一条
  }
}
```

根为 `IPluginSettings { toolkit: Record<toolId, IToolSettings> }`。每个工具条目有固定三件套：

| 键 | 含义 |
| --- | --- |
| `enabled` | 工具是否已加载（驱动 `loadTool`/`unloadTool`）。 |
| `config` | 用户可配置选项（渲染为设置行）。 |
| `data` | 可选的持久化运行时/派生状态（如保存的规则列表、结构模板）。 |

## SettingsStore

**文件：** `src/settings/SettingsStore.ts`

`SettingsStore` 是 `plugin.settings` 读写的唯一所有者。其他所有代码都**通过它**读写——绝不直接改 `plugin.settings`。

### 加载 + 合并默认值

`loadSettings()` 读取持久化数据并按 `DEFAULT_SETTINGS` 深合并，让新键对老用户自动出现。合并是**以默认值形状驱动**的：

```js
#mergeWithDefaults(saved, defaults)
  若 defaults 是普通对象（非数组）：
    遍历 defaults 的每个键：        // ← 只处理 DEFAULTS 中存在的键
      result[key] = mergeWithDefaults(saved?.[key], defaults[key])
    return result
  // 否则（基元或数组）：
  若 saved 缺失 或 类型不匹配 或 数组与非数组冲突：
    return defaults                 // 回退到默认值
  return saved
```

由此带来的影响：

- **新增 config 键**：只需在工具的 `DefaultSettings.config` 里加上；老用户自动得到默认值。
- **删除某键**：会被静默丢弃（默认值里没有）。
- **数组按整体对待** —— 整个已保存数组原样保留；合并不会深入合并数组元素。这对 folder-templates 这类 `data.rules` 是数组的工具很重要——其演进需用显式迁移管理（见下文）。
- 顶层 `toolkit` 对象按已保存数据原样取用（新注册的工具会懒加载自身——见下文）。

### 单工具加载

`loadToolSettings(id, defaults)` 由每个工具的 `BaseTool.initialize()` 调用。它对该工具已保存的条目执行同样的 `#mergeWithDefaults`，所以即便某工具尚未出现在已保存的 `toolkit` 映射里，也会遵循其自身默认值。

### 更新值

| 方法 | 用途 |
| --- | --- |
| `updateSettings(settings)` | 替换整个对象（少用）。 |
| `updateSettingByPath(path, value)` | 按点分路径设值，如 `"toolkit.quick-path.config.useAbsolutePath"`。逐段校验存在性，路径非法会抛错。改前先深拷贝。 |
| `updateToolSettingByPath(id, path, value)` | `updateSettingByPath(\`toolkit.${id}.${path}\`, value)` 的快捷方式。被 `BaseTool.updateConfig` / `updateData` 使用。 |
| `getToolSettings(id)` | 读取某工具（已合并）的设置。 |

每次写入都会走 `plugin.saveSettings()`（落盘），随后通知订阅者。

### 外部 store（供 React 19 的 `useSyncExternalStore`）

`SettingsStore` 通过 `store` 暴露一个最小外部 store：

```ts
store = {
  subscribe(callback): () => void   // 返回取消订阅
  getSnapshot(): IPluginSettings    // 返回 plugin.settings（未变更前引用不变）
}
```

这使使用 `useSyncExternalStore` 的 React 组件在设置变更时重渲染。插件每次写入都产生**新的对象引用**（`Object.assign({}, …)`），从而快照身份变化、触发订阅者。

## 声明式设置页

**文件：** `src/settings/PluginSettingTab.ts`

`PluginSettingTab` 继承 Obsidian 1.13 的 `PluginSettingTab`，实现框架会调用的三个方法：

### `getSettingDefinitions() → SettingDefinitionItem[] | SettingDefinitionPage[]`

构建设置页结构。OTK 为每个工具生成一个**页面**：

```
getSettingDefinitions()
  → 对每个工具：buildToolPage(tool)
      → SettingDefinitionPage {
          type: "page",
          name: tool.info.name,
          desc:  tool.info.description,
          status: () => tool.isEnabled() ? null : "warning",
          items: [
            { "Enabled" 开关 (key: toolkit.<id>.enabled) },   // 自动前置
            ...tool.getSettingItems()                          // 工具自身行
          ]
        }
```

未启用的工具会显示 `warning` 状态徽标。"Enabled" 开关由中心统一注入——工具**不应**自行声明。

### `getControlValue(key) → unknown`

按点分 key 在 `plugin.settings` 中遍历并返回当前值（供渲染控件）。

### `setControlValue(key, value)`

两种情形：

1. **`toolkit.<id>.enabled`** → 路由到 `toolkitManager.enableTool(id)` / `disableTool(id)`（既持久化**又**加载/卸载工具），随后 `this.update()` 重渲染。
2. **其他任意键** → 统一路由到 `settingsStore.updateSettingByPath(key, value)`（持久化**并通知订阅者**；非 enabled 的配置无需重载工具）。工具可通过 `settingsStore.store.subscribe` 感知设置页的修改（plugin-order 的"配置变更自动 enforce"依赖此行为）。

## 控件类型（`SettingControl`）

声明式设置行的核心是 `control` 字段。Obsidian 1.13 提供 9 种控件类型，每种都继承自 `SettingControlBase<V, K>`：

| `type` | 值类型 | 适用 |
| --- | --- | --- |
| `toggle` | `boolean` | 开关。 |
| `text` | `string` | 单行文本。 |
| `textarea` | `string` | 多行文本。 |
| `number` | `number` | 数字。 |
| `dropdown` | `string` | 下拉，配合 `options: Record<value, label>`。 |
| `file` | `string` | 文件路径（带联想选择器）。 |
| `folder` | `string` | 文件夹路径（带联想选择器）。 |
| `slider` | `number` | 滑块。 |
| `color` | `HexString` | 颜色。 |

`SettingControlBase` 的通用字段：

| 字段 | 说明 |
| --- | --- |
| `key` | 点分存储路径，传给设置页的 `getControlValue` / `setControlValue`。 |
| `defaultValue?` | 解析器返回 undefined/null 时的回退值。 |
| `validate?` | `(value: V) => string \| void \| Promise<...>`；返回非空字符串即拒绝改动，并在设置行下方以内联错误提示展示；返回 void/空表示接受。控件在挂载时也会跑一次校验并展示已存非法值的错误（但不会改动已存值）。 |
| `disabled?` | `boolean \| (() => boolean)`；禁用控件，每次渲染求值（函数形式可反映运行时状态，如另一插件是否安装）。改后需调设置页 `update()` 重新求值。 |

> 控件还有三种非 `control` 变体（`SettingDefinition` 的并集成员）：`render`（自定义渲染，见下文 React 孤岛）、`action`（按钮动作）、`empty`（纯展示占位）。OTK 当前主要用 `control` 与 `render`。

### 设置项形状

一个 `SettingDefinitionItem` 形如：

```ts
{
  name: string,                       // 显示名（渲染 + 搜索）
  desc?: string | DocumentFragment,   // 描述（可选；文本内容参与搜索）
  aliases?: string[],                 // 额外搜索词
  searchable?: boolean | (() => boolean),  // 是否参与搜索，默认 true
  visible?: boolean | (() => boolean),     // 是否渲染，默认 true；每次渲染求值
  control: { type, key, defaultValue?, validate?, disabled?, options? },
}
```

工具从 `getSettingItems()` 返回这些项。示例见[工具开发指南](./Toolkit-Development-Guide.md) §第四步。

## React "孤岛"

**文件：** `src/settings/reactSetting.tsx`

有些设置 UI 对声明式控件而言过于复杂（规则编辑器、结构树编辑器、拖拽列表、实时联想）。OTK 通过 `reactSetting()` 把任意 React 组件桥接进声明式设置，对应 `SettingDefinitionRender`：

```ts
import { reactSetting } from "@src/settings/reactSetting";

// 在某工具的 getSettingItems() 内：
reactSetting("Template rules", () =>
    createElement(RulesEditor, {
        app: this.context._app,
        initialRules: this.settings.data.rules,
        getTemplatesBasePath: () => this.getTemplatesBasePath(),
        persist: (rules) => {
            void this.context._settingsStore.updateToolSettingByPath(
                this.info.id, "data.rules", rules
            );
        },
    })
);
```

### 桥接如何工作

`reactSetting(name, node)` 返回一个 `SettingDefinitionRender`：

1. `render(setting)` 时：清空该设置行的 `settingEl`，添加 `rht-react-host` 类，用 `createRoot` 创建 React root，并渲染 `node()`。
2. 一个 `WeakMap<host, Root>` 防止框架在调用清理函数前重渲染导致的重复挂载。
3. 返回的清理函数会调用 `root.unmount()`。

### 为什么 React 孤岛独立持久化

这是一个刻意且重要的设计决策（代码注释中有记录）：

> React 组件自行管理本地状态并**异步落盘**，刻意**不**调用 `settingTab.update()`。这避免了整页重渲染，否则会把用户从当前子页面弹出（增删作用域、选模板文件、改匹配条件若触发整页重渲染，会把用户从规则编辑器里弹出）。

因此 React 孤岛只接收一次 `initialX` props，并通过 `persist` 回调写回 store——它**不**订阅 store 快照。这种取舍以牺牲响应性换取了嵌套设置的 UX 稳定性。

## 迁移（单工具）

当工具的数据模型发生不兼容变更时，在 `initialize()` 中、**先于** `super.initialize()` 执行迁移（后者会合并默认值，可能丢弃无法识别的键）。

参考模式 —— `src/toolkit/folderTemplates/index.ts`：

```ts
async initialize(context: IPluginContext): Promise<void> {
    const raw = context._settingsStore.getToolSettings("folder-templates");
    if (raw && needsMigration(raw)) {
        await context._settingsStore.updateSettingByPath(
            "toolkit.folder-templates",
            migrateSettings(raw)
        );
    }
    await super.initialize(context);   // 在迁移后的形状上合并默认值
}
```

完整的迁移案例（带 `version` 守卫的 v0 → v1）见[工具详解：Folder Templates](./Tool-Folder-Templates.md)。

## 常见坑

- **别直接改 `plugin.settings`。** 一律走 `SettingsStore`；否则订阅者（React）不会收到通知、也不会落盘。
- **保持 `DefaultSettings` 完整。** 合并只填充默认值中存在的键；漏掉一个键，老用户就拿不到。
- **不要在 `getSettingItems()` 里加 "Enabled" 行。** 设置页会自动加并接好加载/卸载。
- **React 孤岛不应调用 `settingTab.update()`。** 通过 store 回调持久化即可，否则会触发整页重渲染、丢失用户当前位置。
- **`updateSettingByPath` 要求路径存在。** 中间段缺失会抛错。先用 `loadToolSettings` 初始化（`BaseTool` 已替你做了）。
