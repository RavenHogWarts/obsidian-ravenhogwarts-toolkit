# 工具详解：Folder Templates

对 **`folder-templates`** 工具的深度剖析——它是 OTK 中功能最丰富的工具之一，也是构建复杂工具的最佳参考。它在新建文件落入匹配位置时自动应用模板，可选地重命名并渲染变量。

**源码：** `src/toolkit/folderTemplates/`

```
src/toolkit/folderTemplates/
├── index.ts                       # 工具类（Obsidian 集成）
├── types.ts                       # ISettings、规则/作用域判别联合、工厂函数
├── service/
│   ├── RuleMatcher.ts             # 纯函数：首个命中即返回的规则引擎
│   ├── applyPolicy.ts             # 纯函数：判定命中规则是否应作用于该文件
│   ├── VariableEngine.ts          # 纯函数：渲染 {{legacy}} 与 ${expr} 占位符
│   ├── expressionEvaluator.ts     # 纯函数：受控的沙箱表达式求值器
│   └── variableContext.ts         # 从 TFile 构建变量映射
├── settings/
│   ├── RulesEditor.tsx            # React 孤岛：规则列表编辑器
│   ├── RuleCard.tsx               # 单条规则编辑器
│   ├── ScopeRow.tsx               # 单个匹配条件行
│   ├── SuggestInput.tsx           # 带 Obsidian 联想的输入框
│   ├── VariableHint.tsx           # 变量语法提示
│   ├── VariableToken.tsx          # 变量令牌渲染
│   ├── Icon.tsx                   # 图标选择辅助
│   └── folderTemplates.css
└── util/
    └── migrate.ts                 # v0 → v1 设置迁移
```

## 它做什么

1. 监听 `vault.on("create")`（在 `onLayoutReady` 之后注册，避开启动时的批量 create 事件）。
2. 对每个新建 `.md` 文件，先用 `processedPaths` 去重，再找到**首个启用的、所有作用域都匹配**的规则。
3. 用 `applyPolicy` 判定整条规则是否应作用于该文件。
4. 可选地**重命名**文件（按文件上下文渲染 `${...}` 格式），随后用渲染好的模板**填充**。

顺序——先重命名后填充——是刻意的，使模板内的 `${notename}` 反映**新**文件名。

## 数据模型

**文件：** `types.ts`

```ts
ISettings extends IToolSettings {
  config: { version: number; templatesFolderPath: string };
  data:   { rules: IFolderTemplateRule[] };
}

interface IFolderTemplateRule {
  id: string;
  enabled: boolean;
  scopes: TemplateScope[];      // 逻辑与组合；空数组 → 永不命中
  templateFile: string;         // 相对路径，或含 "/" 时视为 vault 绝对路径
  renameFormat: string;         // ${...} 格式；"" → 不重命名
  applyMode: "empty-only" | "prepend";
}
```

### 作用域（判别联合）

一条规则有一个或多个**作用域**，须全部命中（逻辑与）。作用域的 `type` 是判别标识：

| `type` | 命中条件 | 字段 |
| --- | --- | --- |
| `FOLDER` | 文件父目录等于 `path`，或（`includeSubfolders` 时）位于其下 | `path`、`includeSubfolders` |
| `EXCLUDE_FOLDER` | 文件**不在** `path` 之下（空 path = 永不排除） | `path` |
| `FILENAME_PATTERN` | 文件 basename 匹配 JS 正则 `pattern`（非法正则 → 不命中、不抛错） | `pattern` |
| `ROOT` | 恒命中（整库兜底）：vault 内任意位置的新建文件都算命中，靠同规则内的 `EXCLUDE_FOLDER` / `FILENAME_PATTERN` 收窄 | — |

> **`FOLDER` 的 path 不接受根目录。** 空 path（或 `/`，`normalize` 后同为 `""`）永不命中——整库范围应当用 `ROOT` 表达，故文件夹联想（`FolderSuggest`，`includeRoot: false`）不再列出根目录，避免两种写法语义重复。

`types.ts` 提供 `createScope(type)` / `createRule()` 工厂函数，使设置 UI 在用户新增一行时能构造出结构完备的空对象。

## 规则匹配

**文件：** `service/RuleMatcher.ts`（纯函数，已完全单元测试）

`findMatchingRule(rules, { parentPath, basename })`：

1. 按数组顺序遍历规则。
2. 跳过未启用、无作用域、无 `templateFile` 的规则。
3. 返回首个 `scopes.every(matchScope)` 为真的规则。
4. 无命中返回 `null`。

> **顺序很重要。** 由于首个命中即返回，规则顺序就是用户的优先级手段。迁移（见下）会排序规则，以保留旧的"文件夹路径长者优先、根目录最后"的先后次序。

`normalize(path)` 是 Obsidian `normalizePath` 的纯实现（折叠斜杠、去首尾），让匹配器可脱离 Obsidian 进行单元测试。

## 应用策略

**文件：** `service/applyPolicy.ts`（纯函数）

命中规则后，`shouldApplyRule(applyMode, isEmpty)` 决定**整条规则**是否作用于该文件：

| `applyMode` | 行为 |
| --- | --- |
| `empty-only` | 仅当文件为空时返回 `true`；**非空文件完全不动**——既不套模板也不重命名。 |
| `prepend` | 一律返回 `true`（把模板前置到现有内容之上）。 |

这条约束的关键意义：`empty-only` 模式下非空文件应**完全不动**，避免出现"改了名却没套模板"的割裂行为。判定发生在重命名与填充**之前**，是规则级开关。

## 去重保护

工具在实例上维护 `processedPaths: Set<string>`：

- 每次处理某文件前，若其路径已在集合中，直接跳过——避免重复 `create` 事件或重入导致的反复套用。
- 处理时把路径加入集合；**重命名后**把新路径也加入，避免重命名触发的事件再次处理同一文件。
- 卸载时 `clear()`。

这是会话级的内存保护，不持久化。

## 变量渲染

**文件：** `service/VariableEngine.ts`、`service/expressionEvaluator.ts`、`service/variableContext.ts`

### 上下文

`buildVariableContext(app, file)` 产出可用变量的普通对象：

| 变量 | 值 |
| --- | --- |
| `notename` | 文件 basename（不含扩展名） |
| `folder` | 父文件夹名 |
| `folderPath` | 父文件夹完整路径 |
| `now` | Obsidian `moment` 对象（可调用 `.format(...)`) |
| `date` / `time` / `year` / `yearMonth` | 预格式化的日期字符串 |
| `timestamp` | `Date.now()` |
| `frontmatter` | 解析出的 frontmatter（新文件通常为空） |

### 两套语法，一次扫描

`VariableEngine.render(input)` 走两个阶段：

1. **旧语法** —— `{{date}}`、`{{time}}`、`{{date:FMT}}`、`{{time:FMT}}`、`{{title}}`。为兼容既有模板文件而保留。`{{title}}` → `notename`。
2. **表达式** —— `${...}` 占位符，由下方受控求值器计算。失败时**原样保留**占位符。

### 受控表达式求值器

**文件：** `service/expressionEvaluator.ts` —— 安全攸关的核心。

它替代了 `eval`/`Function` 来解析 `${...}`，刻意**只支持**两种构造：

1. 属性访问：`a.b.c`
2. 带字面量参数的方法调用：`a.b('x')`、`a.b().c(1, true)`

方法参数只允许**字符串 / 数字 / 布尔字面量**。其余一切 JS 语法（运算符、下标访问、模板字符串、`new`、分号、赋值等）都会在词法或语法阶段被拒绝，占位符原样保留。

纵深防御：

- **词法器拒绝未知字符**（`tokenize` 在 token 之间出现任何间隙时返回 `null`）。
- **屏蔽属性**：`__proto__`、`constructor`、`prototype` 不可访问——阻断原型链逃逸，如 `file.constructor.constructor('return this')()`。
- **根变量必须是自有属性**：`${constructor}` 会失败，因为 `constructor` 不是上下文对象的自有可枚举键——阻断继承属性攻击。
- **运行时失败**（调用非函数等）返回 `undefined` → 占位符保留。

示例：`${now.format('YYYY-MM-DD')}` → `2026-08-06`。`${window}` → 保留为 `${window}`（未知变量）。

## 模板路径解析

`getTemplatesBasePath()` 决定相对模板路径的基准：

1. 若 `config.templatesFolderPath` 非空 → 用它。
2. 否则读取**官方 Templates 核心插件**配置的文件夹（`app.internalPlugins.getEnabledPluginById("templates").options.folder`）。
3. 否则回退到 `"templates"`。

`resolveTemplateFile(path)`：若 `path` 含 `/`，视为 vault 绝对路径；否则与基准路径拼接。

## 重命名

`applyRename(file, format)`：

1. 用 `VariableEngine` 渲染 `format`。
2. 去除非法文件名字符（`[\\/:*?"<>|#^[\]]`）。
3. 若结果与当前 basename 相同 → 无操作。
4. 若目标已存在同名文件，追加 `-01`、`-02`……直到空闲。
5. `fileManager.renameFile(file, target)`。

## 迁移（v0 → v1）

**文件：** `util/migrate.ts`

该工具从扁平的 `folderTemplates[]` 列表演进而为规则/作用域模型。`needsMigration(saved)` 检查 `config.version`（v0 中缺失）。`migrateSettings()`：

- 把每条旧 `{ folder, templateFile, fileNameRule }` 转为一条规则：
  - 空/`/` 文件夹 → `ROOT` 作用域（v0 中 `/` 模板即对所有文件夹生效的兜底项，`ROOT` 与之语义一致）；否则 `FOLDER`（含子文件夹）。
  - `config.ignoredFolders`（此前是无效配置）→ 作为 `EXCLUDE_FOLDER` 作用域追加到每条规则，使其终于生效。
  - `fileNameRule` → `renameFormat`。
- **按文件夹路径长度降序排序规则**（根目录最后），复现旧优先级，因为新匹配器是按数组顺序首个命中即返回。
- 打上 `config.version = SETTINGS_VERSION`，确保不再重复迁移。

迁移在 `initialize()` 中、**先于** `super.initialize()` 执行，使默认值合并不至于丢弃无法识别的旧键。见[设置系统](./Settings-System.md) §迁移。

## 设置 UI

该工具暴露：

- 一个声明式**文件夹选择器**（`folder` 控件），用于 `templatesFolderPath`。
- 一个 **React 孤岛**（`RulesEditor`）管理规则列表——通过 `reactSetting()`。这是"为何 React 孤岛独立于 `settingTab.update()` 持久化"的规范示例（增删作用域、选模板文件、改匹配条件若触发整页重渲染，会把用户从规则编辑器里弹出）。规则编辑器内还集成了变量语法提示与令牌渲染组件。

孤岛只接收一次 `initialRules` 与一个 `persist(rules)` 回调来回写；它从不调用 `settingTab.update()`。见[设置系统](./Settings-System.md) §React 孤岛。

## 测试

该工具的纯 service 都有单元测试，位于 `test/folderTemplates/`：

- `RuleMatcher.test.ts` —— 作用域匹配、逻辑与语义、顺序、非法正则。
- `applyPolicy.test.ts` —— `empty-only`/`prepend` 在空/非空文件下的判定。
- `VariableEngine.test.ts` —— 旧语法、表达式语法、失败回退。
- `migrate.test.ts` —— v0 → v1 转换、优先级保留、ignoredFolders。
- `types.test.ts` —— 工厂函数与类型守卫。

见[测试指南](./Testing-Guide.md)。
