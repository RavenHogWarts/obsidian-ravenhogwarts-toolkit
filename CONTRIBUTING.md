# Contributing to RavenHogwarts Toolkit — English Version

Thank you for your interest in contributing to **RavenHogwarts Toolkit** (OTK)! This document provides guidelines and instructions for contributing to this project.

> For the full technical picture (architecture, tools, build/release), see [`docs/`](./docs/README.md). The build & release pipeline — including the version-management and release-please permission model — is documented in [Build & Release](./docs/Build-and-Release.md).

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Commit & PR Title Guidelines](#commit--pr-title-guidelines)
- [Reporting Bugs](#reporting-bugs)
- [Feature Requests](#feature-requests)

## Code of Conduct

By participating in this project, you are expected to uphold our Code of Conduct:

- Use welcoming and inclusive language
- Be respectful of differing viewpoints and experiences
- Gracefully accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

## Getting Started

This project uses **pnpm** (Node ≥ 22). Install pnpm first if you don't have it: `npm install -g pnpm` (or via [Corepack](https://pnpm.io/installation#using-corepack)).

1. **Fork the repository** on GitHub
2. **Clone your fork** locally
   ```bash
   git clone https://github.com/your-username/obsidian-ravenhogwarts-toolkit.git
   cd obsidian-ravenhogwarts-toolkit
   ```
3. **Install dependencies**
   ```bash
   pnpm install
   ```
4. **Set up your development vault**
   - Create a `.env` file at the repo root pointing at a test vault:
     ```dotenv
     VAULT_PATH=/path/to/your/test-vault
     ```
   - `.env` is optional — the `dev`/`build` scripts read it if present (`--env-file-if-exists`). Without it, the deploy step is skipped and artifacts stay in `dist/`.

## Development Workflow

1. **Create a branch** for your feature or bugfix:
   ```bash
   git checkout -b feat/your-feature-name
   # or
   git checkout -b fix/issue-you-are-fixing
   ```

2. **Start dev mode** — symlinks `dist/` into your vault, then rebuilds on change (inline sourcemap):
   ```bash
   pnpm run dev
   ```

3. **Make your changes** and test them in Obsidian (enable the plugin, use hot-reload).

4. **Run the checks** before committing (see [Coding Standards](#coding-standards)).

5. **Commit your changes** following the [commit guidelines](#commit--pr-title-guidelines).

### Available scripts

| Command | What it does |
| --- | --- |
| `pnpm run dev` | Symlink `dist/` into the vault, then esbuild watch build (inline sourcemap). |
| `pnpm run build` | `tsc` type-check → esbuild production bundle → copy artifacts to the vault. |
| `pnpm run lint` | Run ESLint over `src/` and `styles/`. |
| `pnpm test` / `pnpm run test:watch` | Run the Jest unit tests. |
| `pnpm run i18n:typesafe` | Run the typesafe-i18n code generator (type bindings). |
| `pnpm run i18n:sync` | Sync each locale's key structure against the base language. |

## Pull Request Process

1. **Update documentation** if your change affects behavior, build, or the public surface.
2. **Ensure the checks pass** locally: `pnpm run lint`, `pnpm test`, and `pnpm run build`.
3. **Push your branch** to your fork:
   ```bash
   git push origin feat/your-feature-name
   ```
4. **Open a Pull Request** against the `master` branch of the original repository.
5. **Give the PR a Conventional-Commits title** — it is validated by the `pr-title.yml` workflow and, because we **squash merge**, the PR title becomes the commit message that release-please uses to compute the next version. See [Commit & PR Title Guidelines](#commit--pr-title-guidelines).
6. **Describe your changes** in detail, referencing any related issues.

> Releases are fully automated by **release-please**: once your PR is squash-merged, it is folded into a Release PR; merging that Release PR tags, publishes, and uploads the build. You do **not** bump versions by hand. The one exception is `manifest.json`'s `minAppVersion`, which a maintainer edits manually only when a newer Obsidian API is actually required. Details in [Build & Release](./docs/Build-and-Release.md).

## Coding Standards

- Follow the existing code style in the project.
- Use TypeScript for type safety.
- Comments and source-level docs are written in **Chinese**, matching the original author's style.
- Use the path aliases `@src/*` → `./src/*` and `@styles/*` → `./styles/*`.
- Write clear, descriptive variable and function names.
- Fix any lint errors before submitting (the rules `no-explicit-any` / `no-unused-vars` / `no-non-null-assertion` may be ignored):
  ```bash
  pnpm run lint
  ```

## Commit & PR Title Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/). Because merges are **squash merges**, the **PR title** is what matters most — it is linted by CI and drives automated versioning:

```
<type>(<scope>): <description>
```

Common types:

- `feat`: A new feature → bumps the **minor** version
- `fix`: A bug fix → bumps the **patch** version
- `feat!` or a `BREAKING CHANGE:` footer → bumps the **major** version
- `perf`: Performance improvement
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `docs`: Documentation only
- `style`: Formatting / code style
- `test`: Adding or updating tests
- `chore` / `build` / `ci`: Tooling, build, or CI changes

How each type shows up in `CHANGELOG.md` (and whether it's hidden) is configured in `release-please-config.json`.

## Reporting Bugs

When reporting bugs, please include:

- A clear, descriptive title
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Screenshots if applicable
- Your environment (OS, Obsidian version, plugin version)

## Feature Requests

Feature requests are welcome. Please provide:

- A clear description of the feature
- Why this feature would be beneficial
- Any implementation ideas you might have

---

# 贡献指南 — 中文版本

感谢您有兴趣为 **RavenHogwarts Toolkit**（OTK）做出贡献！本文档提供了为该项目做出贡献的指南和说明。

> 完整技术资料（架构、工具、构建与发布）见 [`docs/`](./docs/README.md)。构建与发布流水线——包括版本管理与 release-please 的权限模型——见[构建与发布](./docs/Build-and-Release.md)。

## 目录

- [行为准则](#行为准则)
- [入门指南](#入门指南)
- [开发工作流程](#开发工作流程)
- [拉取请求流程](#拉取请求流程)
- [编码标准](#编码标准)
- [提交与 PR 标题规范](#提交与-pr-标题规范)
- [报告错误](#报告错误)
- [功能请求](#功能请求)

## 行为准则

通过参与此项目，您应当遵守我们的行为准则：

- 使用友好和包容的语言
- 尊重不同的观点和经验
- 优雅地接受建设性批评
- 关注对社区最有利的事情
- 对其他社区成员表示同理心

## 入门指南

本项目使用 **pnpm**（Node ≥ 22）。若尚未安装 pnpm，先执行 `npm install -g pnpm`（或通过 [Corepack](https://pnpm.io/installation#using-corepack)）。

1. **在 GitHub 上 Fork 仓库**
2. **在本地克隆您的 Fork**
   ```bash
   git clone https://github.com/your-username/obsidian-ravenhogwarts-toolkit.git
   cd obsidian-ravenhogwarts-toolkit
   ```
3. **安装依赖**
   ```bash
   pnpm install
   ```
4. **配置开发用 vault**
   - 在仓库根目录创建 `.env`，指向一个测试用 vault：
     ```dotenv
     VAULT_PATH=/path/to/your/test-vault
     ```
   - `.env` 是可选的——`dev`/`build` 脚本会在其存在时读取（`--env-file-if-exists`）。若没有，则跳过部署步骤，产物保留在 `dist/`。

## 开发工作流程

1. **为您的功能或错误修复创建分支**：
   ```bash
   git checkout -b feat/您的功能名称
   # 或
   git checkout -b fix/您要修复的问题
   ```

2. **启动开发模式**——把 `dist/` 软链到 vault，然后以 watch 模式重建（inline sourcemap）：
   ```bash
   pnpm run dev
   ```

3. **进行更改** 并在 Obsidian 中测试（启用插件，使用热重载）。

4. **在提交前运行检查**（见[编码标准](#编码标准)）。

5. **提交您的更改**，遵循[提交规范](#提交与-pr-标题规范)。

### 可用脚本

| 命令 | 作用 |
| --- | --- |
| `pnpm run dev` | 把 `dist/` 软链到 vault，再以 watch 模式构建（inline sourcemap）。 |
| `pnpm run build` | `tsc` 类型检查 → esbuild 生产打包 → 复制产物到 vault。 |
| `pnpm run lint` | 对 `src/` 与 `styles/` 运行 ESLint。 |
| `pnpm test` / `pnpm run test:watch` | 运行 Jest 单元测试。 |
| `pnpm run i18n:typesafe` | 运行 typesafe-i18n 代码生成器（类型绑定）。 |
| `pnpm run i18n:sync` | 以基准语言同步各语言包的键结构。 |

## 拉取请求流程

1. **必要时更新文档**（当更改影响行为、构建或对外接口时）。
2. **确保本地检查通过**：`pnpm run lint`、`pnpm test`、`pnpm run build`。
3. **将您的分支推送**到您的 Fork：
   ```bash
   git push origin feat/您的功能名称
   ```
4. **对原始仓库的 `master` 分支创建拉取请求**。
5. **为 PR 取一个符合 Conventional Commits 的标题**——它会被 `pr-title.yml` 工作流校验；由于采用 **squash merge**，PR 标题即合并后的 commit message，release-please 据此推断下一个版本号。见[提交与 PR 标题规范](#提交与-pr-标题规范)。
6. **详细描述您的更改**，引用任何相关问题。

> 发布完全由 **release-please** 自动完成：您的 PR 被 squash merge 后会汇入一个 Release PR；合并该 Release PR 即自动打 tag、发布并上传产物。**无需手动升级版本号**。唯一例外是 `manifest.json` 的 `minAppVersion`，仅当确实需要更新的 Obsidian API 时才由维护者手动修改。详见[构建与发布](./docs/Build-and-Release.md)。

## 编码标准

- 遵循项目中现有的代码风格。
- 使用 TypeScript 确保类型安全。
- 注释与源码级文档使用**中文**，与原作者风格一致。
- 使用路径别名 `@src/*` → `./src/*`、`@styles/*` → `./styles/*`。
- 编写清晰、描述性的变量和函数名。
- 在提交前修复任何 lint 错误（`no-explicit-any` / `no-unused-vars` / `no-non-null-assertion` 可以忽略）：
  ```bash
  pnpm run lint
  ```

## 提交与 PR 标题规范

我们遵循 [Conventional Commits](https://www.conventionalcommits.org/)。由于采用 **squash merge**，最关键的是 **PR 标题**——它会被 CI 校验并驱动自动版本推断：

```
<类型>(<范围>): <描述>
```

常见类型：

- `feat`: 新功能 → 提升 **minor** 版本
- `fix`: 错误修复 → 提升 **patch** 版本
- `feat!` 或带 `BREAKING CHANGE:` 页脚 → 提升 **major** 版本
- `perf`: 性能改进
- `refactor`: 既不修复错误也不添加功能的代码变更
- `docs`: 仅文档变更
- `style`: 格式化 / 代码风格
- `test`: 添加或更新测试
- `chore` / `build` / `ci`: 工具链、构建或 CI 变更

各类型在 `CHANGELOG.md` 中如何呈现（以及是否隐藏）由 `release-please-config.json` 配置。

## 报告错误

报告错误时，请包括：

- 清晰、描述性的标题
- 重现问题的步骤
- 预期行为
- 实际行为
- 截图（如适用）
- 您的环境（操作系统、Obsidian 版本、插件版本）

## 功能请求

欢迎功能请求。请提供：

- 功能的清晰描述
- 为什么这个功能会有益
- 您可能有的任何实现想法
