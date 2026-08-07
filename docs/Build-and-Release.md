# 构建与发布

本文档涵盖 OTK 的构建流水线、本地部署脚本、版本号管理，以及 GitHub Actions 的发布流程。

> 工具与维护者：包管理器为 **pnpm**（Node ≥ 22）。所有脚本定义在 `package.json`。

## 脚本一览

| 命令 | 作用 |
| --- | --- |
| `pnpm run dev` | 开发模式：先把 `dist/` 软链到目标 vault，再以 watch 模式构建（带 inline sourcemap）。 |
| `pnpm run build` | 生产构建：先 `tsc` 类型检查（不产出），再 esbuild 生产打包，最后复制产物到 vault。 |
| `pnpm run lint` | 对 `src/` 与 `styles/` 运行 ESLint。 |
| `pnpm test` / `pnpm run test:watch` | 运行 Jest 单元测试。 |
| `pnpm run i18n:typesafe` | 运行 typesafe-i18n 代码生成器（类型绑定）。 |
| `pnpm run i18n:sync` | 以基准语言同步各语言包的键结构。 |

> 版本升级、CHANGELOG、tag 与 Release 均由 **release-please** 自动完成（见下文），不再有手动的版本脚本。

## esbuild 配置

**文件：** `scripts/esbuild.config.mjs`

入口为 `src/main.ts`，输出到 `dist/`。关键点：

- **格式**：CommonJS（`format: "cjs"`），目标 `es2020`（`tsconfig` 的 `target` 是 `ES2017`，esbuild 在此进一步收窄输出）。
- **external**：`obsidian`、`electron`、所有 `@codemirror/*`、`@lezer/*` 以及 Node 内建模块均不打包（由 Obsidian 运行时提供）。
- **treeShaking** 开启；生产模式 `minify` 并 `drop: ["console"]`（开发模式保留 console 并输出 inline sourcemap）。
- **两个自定义插件**：
  - `cssReBuild`：对所有 `.css` 文件用 PostCSS + `postcss-nesting` 处理嵌套语法（类似 SCSS），再交给 esbuild 当 CSS 加载。这让源码可直接写原生嵌套 CSS。
  - `renamePlugin`：构建结束后把 `dist/main.css` 重命名为 `dist/styles.css`（Obsidian 要求样式文件名为 `styles.css`）。
- 构建完成后复制 `manifest.json` 到 `dist/`；开发模式还会监听 `manifest.json` 变化（带 100ms 防抖与内容比对）自动重复制。

## 本地部署

**文件：** `scripts/deploy.mjs`，配置在 `.env`（`VAULT_PATH`）。

两种模式：

### `link`（开发模式）

把 vault 中的 `<vault>/.obsidian/plugins/<pluginId>/` 建为指向项目 `dist/` 的符号链接（Windows 用 junction，类 Unix 用 symlink）。这样 esbuild watch 产出的变更会直接反映到 vault，配合热重载即可即时生效。

- 若目标已是正确软链 → 跳过。
- 若目标是非空目录（旧安装）→ 先把其中的 `data.json` 备份到 `.backup/`，再删除并重建软链，随后从 `.backup/` 恢复 `data.json` 到 `dist/`。
- `pluginId` 从 `manifest.json`（优先 `dist/manifest.json`）读取。

### `copy`（生产构建后）

把整个 `dist/` 递归复制到 vault 插件目录，并对用户的 `data.json` 做**双重保护**：内存暂存 + 备份到 `.backup/data.json`，复制完成后再恢复，避免覆盖用户设置。

`dev` 脚本会先跑 `deploy.mjs link`，`build` 脚本末尾跑 `deploy.mjs copy`。也可手动：`node scripts/deploy.mjs link|copy [--vault-path=...]`。

## 版本号管理

版本号发布完全交给 [release-please](https://github.com/googleapis/release-please)，基于 [Conventional Commits](https://www.conventionalcommits.org/) 自动推断（`feat` → minor，`fix` → patch，`feat!` / `BREAKING CHANGE` → major）。

**配置文件：** `release-please-config.json`、`.release-please-manifest.json`

版本号散落在 4 处，各自负责人：

| 文件 | 字段 | 由谁改 | 何时 |
| --- | --- | --- | --- |
| `package.json` | `version` | release-please | 合并 Release PR 时 |
| `manifest.json` | `version` | release-please（`extra-files` jsonpath） | 合并 Release PR 时 |
| `manifest.json` | `minAppVersion` | **维护者手动** | 需要提升最低 Obsidian 版本时（开发分支内改，随 PR 合入） |
| `versions.json` | `版本号 → minAppVersion` 映射 | CI 脚本 `sync-versions.mjs` | 发布后自动追加 |

> `minAppVersion` 是唯一需要手动维护的版本字段。只在真正用到新版本 Obsidian API 时修改，无变化则保持不动。release-please 的 jsonpath 精确匹配 `$.version`，不会碰它。

## CI / GitHub Actions

**目录：** `.github/workflows/`

### `release.yml` —— 发布

触发：push 到 `master`。采用单工作流两段式：

**job 1 `release-please`**：解析自上次发布以来的 commit，维护一个「Release PR」——PR 内含 `package.json` / `manifest.json` 版本号更新与 `CHANGELOG.md` 追加。只要不合并此 PR，就不会真正发版。

**job 2 `publish`**（仅当 Release PR 合并、Release 被创建时执行）：

1. Checkout `master`（此时版本号已是新值）。
2. Node 22 + pnpm 11，缓存 pnpm store。
3. `pnpm install --frozen-lockfile` + `pnpm run build`。
4. **同步 `versions.json`**：`node scripts/sync-versions.mjs` 读取 `manifest.json` 的 `version` 与 `minAppVersion` 追加映射，有变化则用 `github-actions[bot]` 提交并推回 `master`（`[skip ci]` 防递归）。
5. **生成构建产物溯源**（`actions/attest-build-provenance@v2`）。
6. `gh release upload` 把 `dist/main.js`、`dist/manifest.json`、`dist/styles.css` 上传到 Release。

### `pr-title.yml` —— PR 标题校验

触发：PR 开启 / 编辑 / 同步。用 `action-semantic-pull-request` 校验 PR 标题符合 Conventional Commits。因为采用 **squash merge**，合并后的 commit message 即 PR 标题，release-please 靠它推断版本，故标题必须规范。

### `pr-ci.yml` —— PR 检查

触发：面向 `master` 的 PR。跑 `lint` + `test` + `build`，在合并前暴露问题。

## 发布流程

1. 在 feature 分支开发；若用到新版本 Obsidian API，手动改 `manifest.json` 的 `minAppVersion`。
2. 开 PR（**标题遵循 Conventional Commits**），CI 通过后 **squash merge** 到 `master`。
3. release-please 自动开出/更新 Release PR（可连续合并多个功能 PR，累积到同一个 Release PR）。
4. 需要发版时，合并该 Release PR → 自动打 tag、创建 Release、构建上传三件套、回写 `versions.json`。

> tag 无 `v` 前缀（如 `2.1.0`），与历史一致。

## 产物结构

发布到 Release 的三个文件即 Obsidian 插件所需全部：

```
main.js          ← esbuild 打包产物（含 React、lucide-react、reflect-metadata 等）
manifest.json    ← 插件清单（id、版本、minAppVersion 等）
styles.css       ← PostCSS 处理后的样式
```

用户手动安装时，把三者放入 `<vault>/.obsidian/plugins/ravenhogwarts-toolkit/` 并在 Obsidian 中启用即可。
