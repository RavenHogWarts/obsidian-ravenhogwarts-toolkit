# 测试指南

本文档说明 OTK 的测试策略、Jest 配置、obsidian 运行时桩、测试约定，以及代码库中为"可测试性"而采用的设计模式。

## 命令

| 命令 | 作用 |
| --- | --- |
| `pnpm test` | 运行所有 Jest 单元测试。 |
| `pnpm run test:watch` | watch 模式，文件变更时重跑。 |

Jest 配置见 `jest.config.js`：预设 `ts-jest`，环境 `node`，匹配 `**/*.test.ts`（及 `__tests__`），并通过 `moduleNameMapper` 把 `@src/*` 映射到 `src/*`，覆盖率收集自 `src/**/*.ts`。

当前测试套件全部通过（7 个测试文件、73 个用例）。

## 测试范围

**OTK 只对纯逻辑做单元测试**，不直接测试 Obsidian 集成层（命令注册、事件处理、UI 渲染）。原因有二：

1. 这些层强依赖 Obsidian 运行时（`App`、`vault`、`workspace`），mocking 成本高、收益低。
2. 真正容易出 bug、最值得回归保护的是**规则匹配、应用策略、表达式求值、结构序列化、设置迁移**这类纯算法。

因此可测试性的核心原则是：**把逻辑从 Obsidian 集成中剥离，放进无依赖的纯函数 service 模块。**

## obsidian 运行时桩

**文件：** `test/__mocks__/obsidian.ts`

`obsidian` 这个 npm 包**仅含类型声明**（`package.json` 的 `main` 为空）。单元测试在 Node 环境运行时，无法解析该模块的运行时导入。为此在 `test/__mocks__/` 下放了一个手动桩，导出空壳：

```ts
// test/__mocks__/obsidian.ts
export {};
```

Jest 会自动把 `import { TFolder } from "obsidian"` 这类"仅类型用"的导入解析到这个空桩，使其在运行时不致解析失败。被测的纯逻辑刻意不依赖这些符号的运行时值——当 `TFolder` 等为 `undefined` 时，鸭子类型遍历仍可工作。

## 可测试性设计模式

### 模式一：纯 service，输入输出都是数据

复杂逻辑写成接收普通对象、返回普通对象的函数，**完全不导入 `obsidian`**（或仅导入类型）。这样测试无需任何运行时依赖。

典型例子 —— `src/toolkit/folderTemplates/service/RuleMatcher.ts`：

```ts
// 纯函数：运行时不依赖 obsidian
export function findMatchingRule(
    rules: readonly IFolderTemplateRule[],
    info: IFileInfo        // { parentPath, basename } —— 纯数据
): IFolderTemplateRule | null { ... }

// 把 normalizePath 重新实现成纯函数，避免运行时依赖 obsidian
export function normalize(path: string): string { ... }
```

测试 `test/folderTemplates/RuleMatcher.test.ts` 只需构造规则数组和文件信息，断言返回值——零运行时依赖。

### 模式二：注入谓词，解耦 vault

当 service 需要查询外部状态（如"某路径是否已存在"），不直接调用 `app.vault`，而是让调用方**注入谓词**。

典型例子 —— `src/toolkit/folderScaffolder/service/StructureBuilder.ts`：

```ts
export function filterNonExistent(
    targetPaths: string[],
    exists: (path: string) => boolean   // 注入谓词
): string[] { ... }
```

生产代码注入 `(p) => Boolean(app.vault.getAbstractFileByPath(p))`，测试注入 `(p) => stubSet.has(p)`。

### 模式三：导出测试专用钩子

纯树遍历逻辑若被 Obsidian 类型签名（如 `TFolder`）挡在测试门外，单独导出一个绕过运行时的入口。

典型例子 —— 同上文件：

```ts
/** 供单测直接驱动纯树遍历（绕过 obsidian 运行时） */
export const __walkForTest = walkSubPaths;
```

测试可手构 `TreeNode`（普通对象）直接驱动遍历，不依赖 `TFolder`。

### 模式四：用最小接口替代重型依赖

当逻辑确实需要某个 Obsidian 能力（如 `moment`），不要直接耦合整个 `App`。而是定义一个**最小接口**，让 service 接收它。

典型例子 —— `src/toolkit/folderTemplates/service/VariableEngine.ts`：

```ts
// 不依赖 obsidian 的 moment，而是定义 IMomentLike
export interface IMomentLike {
    format(fmt?: string): string;
}
// 测试时注入 { format: (f) => "fake-date" } 即可
```

### 模式五：失败可观测，而非抛异常

求值器、规则匹配器在遇到非法输入时**返回安全的兜底值**（`undefined`、`null`、不命中），而非抛异常。这让测试可以断言"非法正则 → 不命中""未知变量 → 保留占位符"等边界，行为确定且无副作用。

典型例子 —— `expressionEvaluator.ts` 的 `safeEvaluate`：语法越界、未知变量、运行时异常一律返回 `undefined`，由调用方决定兜底（原样保留 `${...}`）。

## 现有测试

```
test/
├── __mocks__/obsidian.ts                        # obsidian 运行时空桩
├── folderScaffolder/
│   ├── StructureBuilder.test.ts                 # 子路径收集、flat↔树转换、顺序保证
│   └── clipboardStructure.test.ts               # 围栏序列化/解析、非法字符、未识别返回 null
└── folderTemplates/
    ├── RuleMatcher.test.ts                      # 作用域匹配、AND 语义、顺序、非法正则
    ├── applyPolicy.test.ts                      # empty-only/prepend 在空/非空下的判定
    ├── VariableEngine.test.ts                   # 旧语法、${expr}、失败回退
    ├── migrate.test.ts                          # v0 → v1 转换、优先级、ignoredFolders
    └── types.test.ts                            # 工厂函数与类型守卫
```

## 测试约定

- **文件位置**：与被测模块对应，放 `test/<tool>/` 下；文件名 `<Subject>.test.ts`。
- **风格**：Jest 的 `describe` / `it` / `expect`；每个 `it` 只测一个行为，命名描述"应……"。
- **数据构造**：优先用模块导出的工厂函数（如 `createRule()`、`createScope()`、`createTemplate()`）构造测试夹具，保证与生产代码同构。
- **不测 Obsidian 集成**：命令/事件/UI 的正确性靠手动验证；若一定要测，通过 `IPluginContext` stub 注入。
- **边界优先**：重点测空数组、非法输入、优先级冲突、迁移兼容等容易回归的场景。

## 写一个新测试（示例）

假设你为某工具的 service 写了一个纯函数 `pickTemplate(rules, ctx)`：

```ts
// test/myTool/pickTemplate.test.ts
import { pickTemplate } from "@src/toolkit/myTool/service/pickTemplate";
import { createRule } from "@src/toolkit/myTool/types";

describe("pickTemplate", () => {
    it("returns null when no rules", () => {
        expect(pickTemplate([], { parentPath: "a/b", basename: "x" })).toBeNull();
    });

    it("returns the first matching enabled rule", () => {
        const r1 = createRule();
        const r2 = createRule();
        // ...设置 scopes...
        expect(pickTemplate([r1, r2], { parentPath: "a/b", basename: "x" })).toBe(r1);
    });
});
```

跑 `pnpm test` 即可。

## 何时该加测试

- 新增/修改了 `service/` 下的纯逻辑 → **必加**。
- 修改了设置迁移（`util/migrate.ts`） → **必加**，并覆盖老结构样本。
- Obsidian 集成层（`index.ts` 里的命令/事件） → 一般不加，除非逻辑较复杂可抽成纯函数。
