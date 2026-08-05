# 国际化指南

本文档讲解 OTK 的国际化（i18n）方案：基于 `typesafe-i18n`，提供类型安全的翻译函数，并通过自研同步脚本保证各语言包的键结构一致。

## 方案概览

- **库**：[`typesafe-i18n`](https://github.com/ivanhofer/typesafe-i18n)（生成强类型的翻译函数，编译期即可发现缺失/错误的键）。
- **React 适配**：`adapter: "react"`（见 `.typesafe-i18n.json`），生成 `i18n-react.tsx`。
- **基准语言**：**`zh`**（简体中文）——见 `.typesafe-i18n.json` 的 `baseLocale`。**所有新键先加在 `zh`，再同步到其他语言。**
- **支持语言**：`zh`、`en`、`zh-TW`。
- **运行时语言选择**：读取 Obsidian 的 `getLanguage()`；若不在支持列表则回退到 `en`。

> 注意：基准语言是 **`zh`**，不是 `en`。这与多数项目相反——开发时先写中文键。

## 文件结构

```
src/i18n/
├── i18n.ts                # I18n 单例：加载语言包、选语言、导出 LL
├── i18n-react.tsx         # 生成：React Provider/Context（adapter=react）
├── i18n-types.ts          # 生成：Locales / TranslationFunctions 类型
├── i18n-util.ts           # 生成：loadedLocales / loadedFormatters
├── i18n-util.async.ts     # 生成：异步加载器
├── i18n-util.sync.ts      # 生成：同步加载器（loadAllLocales）
├── formatters.ts          # 自定义格式化器（如有）
├── zh/index.ts            # ★ 基准语言（简体中文）
├── en/index.ts            # 英语
└── zh-TW/index.ts         # 繁体中文
```

标 ★ 的是**唯一需要手动维护语义**的文件。带"生成"标记的文件由 `pnpm run i18n:typesafe` 重新生成，**不要手改**。

## I18n 单例

**文件：** `src/i18n/i18n.ts`

```ts
class I18n {
    // 构造时：loadAllLocales() → 取 getLanguage() → 选 locale 或回退 "en"
    // → i18nObject(locale) 生成翻译函数对象
}
export const i18n = I18n.getInstance();
export const LL = i18n.L;   // 全局可用的翻译函数
```

在代码里直接 `import { LL } from "@src/i18n/i18n"` 即可：

```ts
@Toolkit({
    id: "my-tool",
    name: LL.settings.my_tool.name(),       // 调用即得当前语言的字符串
    description: LL.settings.my_tool.desc(),
})
```

`LL` 的结构就是基准语言对象的形状，因此键路径有完整类型提示，拼错键会在编译期报错。

带参数的翻译用函数调用传入参数，如 `LL.notice.folder_scaffolder.created({ count: 3 })`（typesafe-i18n 会按占位符生成参数签名）。

## 翻译键的组织约定

翻译对象按功能分块。当前顶层结构（`src/i18n/zh/index.ts`）：

```
LL
├─ common                                  通用按钮/状态文案（enabled, add, delete, reset …）
├─ settings                                各工具的设置文案
│  ├─ folder_templates                     { name, desc, templatesFolderPath, rules, scopes … }
│  ├─ folder_scaffolder                    { name, desc, templates(nameField/sourceField/structure) … }
│  └─ quick_path                           { name, desc, addEditorMenu, addFileMenu … }
├─ command                                 命令面板里的命令名
│  ├─ quick_path                           { copy_current_file_path, … }
│  └─ folder_scaffolder                    { create_from_template, paste_structure }
├─ menu                                    右键菜单项
│  ├─ quick_path                           { copy_file_path, copy_folder_path, … }
│  └─ folder_scaffolder                    { create_from_template, copy_structure, paste_structure, save_as_template }
├─ modal                                   Modal 弹窗文案
│  └─ folder_scaffolder                    { scaffold_title, select_template, target_parent, confirm, … }
├─ notice                                  Obsidian 通知条
│  ├─ quick_path                           { copy_success, copy_failure, root_path_warning }
│  └─ folder_scaffolder                    { copied, pasted, created, paste_invalid, … }
```

约定：

- 每个工具在 `settings.<tool_id>` 下放自身设置文案。
- 命令名放 `command.<tool_id>`，右键菜单项放 `menu.<tool_id>`，通知放 `notice.<tool_id>`，Modal 文案放 `modal.<tool_id>`。
- 键名用 camelCase；UI 文案遵循 Obsidian 的 [sentence case](https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines#Use+sentence+case+in+UI) 规范（英文首字母大写、其余小写）。

> 命令名由 `BaseTool.registerCommand` 自动加 `[工具名]` 前缀，因此 `command.<tool_id>` 里的值只需写业务动作本身，不要带工具名。

## 新增 / 修改翻译键的工作流

1. **先改基准语言** `src/i18n/zh/index.ts`，加入新键或修改值。
2. **同步其他语言**：`pnpm run i18n:sync`。
   - 该脚本以 `zh` 为基准，对 `en`、`zh-TW` 做**深度合并**：
     - 基准有的键、目标没有 → 补上，值填 `TODO: <基准值>`（提示译者待翻译）。
     - 目标有、基准没有的键 → 删除。
     - 两边都有的键 → 保留目标已有译文。
3. **翻译 `TODO:` 占位**：打开 `en/index.ts`、`zh-TW/index.ts`，把 `TODO:` 开头的值替换为对应语言译文。
4. **重新生成类型**：`pnpm run i18n:typesafe`，刷新 `i18n-types.ts` 等生成文件，让新键获得类型。

> `i18n:sync` 用正则解析 `const x = { ... } satisfies BaseTranslation` 并以 `new Function` 求值对象（仅本仓库自有文件，可信）。它保证键结构一致，但不做翻译——翻译仍需人工。

## 同步脚本细节

**文件：** `scripts/sync-i18n.mjs`

- 读取 `.typesafe-i18n.json` 的 `baseLocale` 确定基准。
- `extractTranslationObject`：从 TS 文件中正则提取翻译对象字面量并求值。
- `getKeys`：把对象扁平化为 `a.b.c` 键路径集合。
- `deepMerge(baseObj, targetObj)`：按基准结构重建对象；目标缺失则填 `TODO:`，多余则丢弃。
- 输出时重新序列化为带 `satisfies BaseTranslation` 的 TS 文件，保持格式统一。

## React 组件中的 i18n

复杂设置 UI（React 孤岛）若需要响应式语言切换，可使用生成的 React 绑定（`src/i18n/i18n-react.tsx`）：

```tsx
import TypesafeI18n, { useI18nContext } from "@src/i18n/i18n-react";
// 用 <TypesafeI18n locale={locale}> 包裹根节点，子树用 useI18nContext() 取 LL
```

不过 OTK 多数 React 孤岛在挂载时一次性读取 `LL`（因为语言切换时设置页通常会整体重建），所以直接 `import { LL }` 即可，无需 Provider。

## 常见坑

- **基准是 `zh`，不是 `en`。** 在 `zh` 里加键，否则同步脚本不会识别新键。
- **改完键务必跑 `i18n:sync` 再 `i18n:typesafe`。** 漏掉前者会导致其他语言缺键（运行时可能 `undefined`）；漏掉后者会导致 `LL` 类型不含新键（编译报错）。
- **别手改生成文件**（`i18n-types.ts`、`i18n-*.ts`、`i18n-react.tsx`），下次生成会被覆盖。
- **`TODO:` 占位是真实字符串**，会原样显示给用户，发布前务必清零。
- **sentence case**：英文 UI 文案遵循 Obsidian 规范，避免全大写或标题式大小写。
