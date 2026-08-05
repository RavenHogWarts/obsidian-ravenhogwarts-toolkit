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
| `pnpm run version` | 构建后交互式选择并升级版本号（见下文）。 |

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

**文件：** `scripts/version-bump.mjs`，`MAKEFILE`

OTK 维护两套 manifest：

- `manifest.json` —— 正式版。
- `manifest-beta.json` —— Beta 版（BRAT 用户使用）。

`pnpm run version`（通常由 `npm version` 钩子触发）会先构建，再交互式选择版本类型（主版本 / 次版本 / 补丁 / 自定义 / Beta），随后同步更新：

1. `package.json` 的 `version`。
2. 对应的 `manifest.json` 或 `manifest-beta.json`。
3. （仅正式版）`versions.json` 追加 `版本号 → minAppVersion` 映射。

也支持直接传参：`node scripts/version-bump.mjs 1.5.0`。

**打 tag 与推送**用 `MAKEFILE`：

```bash
make release v=1.5.0        # 正式版：git tag + push
make beta   v=1.5.0-beta.1  # Beta 版
make del    v=1.5.0         # 删除某版本 tag
```

> tag 前缀已配置为空（`.npmrc` 中 `tag-version-prefix=""`）。

## CI / GitHub Actions

**目录：** `.github/workflows/`

### `release.yml` —— 发布

触发：推送形如 `1.0.0` 或 `1.0.0-beta.1` 的 tag。

1. Checkout（完整历史）。
2. Node 22 + pnpm 11，缓存 pnpm store。
3. **准备 manifest**：若 tag 含 `beta`，把 `manifest-beta.json` 复制为 `manifest.json`；否则用正式 manifest。
4. `pnpm install --frozen-lockfile` + `pnpm run build`。
5. **生成构建产物溯源**（`actions/attest-build-provenance@v2`），对 `dist/main.js`、`dist/manifest.json`、`dist/styles.css` 三个产物签名。
6. 用 `softprops/action-gh-release@v2` 创建 Release：
   - tag 含 `beta` → 标记为 prerelease。
   - 自动生成 release notes。
   - 附带上述三个产物文件。

### `precheck.yml` —— 版本发布前预检

触发：PR 被打上 `version-bump` 标签时。

执行与 release 一致的构建方式，然后校验：
- 构建成功；
- 三个必需产物（`dist/main.js`、`dist/manifest.json`、`dist/styles.css`）齐全；
- `package.json` 与 `dist/manifest.json` 的版本号一致。

结果以评论形式贴在 PR 上（成功/失败各一套模板），失败时 CI 退出码非零。

## 发布流程（正式版/Beta 版）

**正式版：**

1. 在分支上完成开发，PR 合入。
2. `pnpm run version` → 选择版本类型 → 脚本更新 `package.json`、`manifest.json`、`versions.json`。
3. 按脚本提示提交：`git add package.json manifest.json versions.json` → `git commit`。
4. `make release v=<版本号>` 推送 tag → 触发 `release.yml` 自动构建并发布 Release。

**Beta 版：**

1. `pnpm run version` → 选择 Beta（或自定义 `x.y.z-beta.n`）→ 更新 `package.json`、`manifest-beta.json`。
2. 提交：`git add package.json manifest-beta.json` → `git commit`。
3. `make beta v=<版本号>` 推送 tag → CI 检测到 `beta` 自动用 beta manifest 并标记 prerelease。

## 产物结构

发布到 Release 的三个文件即 Obsidian 插件所需全部：

```
main.js          ← esbuild 打包产物（含 React、lucide-react、reflect-metadata 等）
manifest.json    ← 插件清单（id、版本、minAppVersion 等）
styles.css       ← PostCSS 处理后的样式
```

用户手动安装时，把三者放入 `<vault>/.obsidian/plugins/ravenhogwarts-toolkit/` 并在 Obsidian 中启用即可；Beta 用户推荐通过 BRAT 安装。
