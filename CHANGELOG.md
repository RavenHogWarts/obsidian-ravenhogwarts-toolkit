## [1.4.1](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/compare/1.4.0...1.4.1) (2025-10-11)


### ♻️ Refactor

* 统一导入与整理前端数据处理函数 (#22) ([c0b884b](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/c0b884bcba951160dee40af6b1855a47163c0f7b)), closes [#22](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/issues/22)


### ✨ Features

* **folder-templates:** 添加忽略文件夹配置与判断 (#20) ([523e7b1](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/523e7b189413d5935c77e658c1886513da218d86)), closes [#20](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/issues/20)


### 🔨 Chore

* 精简构建与发布脚本配置 (#21) ([7755c0f](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/7755c0fe3056b51d132854d63662f4961d8f67b2)), closes [#21](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/issues/21)



# [1.4.0](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/compare/1.3.2...1.4.0) (2025-10-11)


### ✨ 新功能

* 添加文件夹模板工具 (#19) ([6f456e0](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/6f456e0f1a3ab9709c2331be3ca9bd793932c7a1)), closes [#19](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/issues/19)



## [1.3.2](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/compare/1.3.1...1.3.2) (2025-09-17)


### ✨ 新功能

* 移除阅读进度工具，功能拆分至https://github.com/RavenHogWarts/obsidian-next-toc (#18) ([135b224](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/135b224a1d6bffbf1a9e2d4b589e66f01ce4fbec))



## [1.3.1](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/compare/1.3.0...1.3.1) (2025-08-01)


### 🎨 样式

* 重构公式编辑器样式，提升代码可维护性 ([b43c764](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/b43c76414e73d8482157852b8ad0ed3787bf198a))


### 🐛 修复

* 新增阅读进度条动画修复弹窗位置问题 ([c7249d6](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/c7249d6d2d5c849ab7ab58ec121e52f1cd1739d3))
* **license:** 更新版权信息为 RavenHogwarts ([9807a0c](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/9807a0ccd226e9cb664f58eba36efc45dd39f09f))



# [1.3.0](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/compare/1.2.1...1.3.0) (2025-06-23)


### ♻️ 重构

* 移除 FrontMatterSorter 相关代码 ([8fffe9c](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/8fffe9c9e443db322036066046f89106008855b6))
* 移除前置元数据排序功能及相关代码 ([2b8bd0c](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/2b8bd0c3128cf95acae60bee69fcba877bbe787e))
* 移除自动更新相关代码，简化配置 ([d039c4a](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/d039c4adfd0b73a663efc40020370e01f4cc364a))


### ✨ 新功能

* 优化配置合并逻辑，增强toolkit配置验证 ([e519426](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/e519426cbba4cfb7f9f95fcd97faafd7dbdd83dd))


### 🐛 修复

* **i18n:** 修复语言设置逻辑并更新文档链接 ([1f707f6](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/1f707f627da1a7edb0cf895a554803b25062f9cf))



## [1.2.1](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/compare/1.2.0...1.2.1) (2025-05-28)


### 🐛 修复

* 修正估算阅读时间中词数参数名称错误 ([cb68f13](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/cb68f1331ea4563ffc2997209617ae662934bccc))
* 优化表格计算服务，统一修正浮点数精度问题 ([43087b0](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/43087b00608f9e0d1a76ef1758fd795114245253))



# [1.2.0](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/compare/1.1.0...1.2.0) (2025-05-05)


### ♻️ 重构

* 优化国际化调用并移除代码编辑器设置组件 ([8c019fa](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/8c019fa2cab67dc981fb50d7ebe1efa66d60dfb3))


### ✨ 新功能

* **i18n:** 优化翻译函数支持命名参数替换 ([5dbc6b8](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/5dbc6b8f4d29c31ac4b52ed6a12409b78f76b6dc))



# [1.1.0](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/compare/1.0.0-beta.35...1.1.0) (2025-03-31)



# [1.0.0-beta.35](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/compare/1.0.0-beta.34...1.0.0-beta.35) (2025-03-26)


### ✨ 新功能

* **base-manager:** 添加为插件注册功能区图标的方法 ([c501c21](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/c501c21a8238c8d91ab44d663582c8548746f84f))
* **code-editor:** 从Monaco迁移到Ace编辑器并增强代码片段管理 ([5f2b51a](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/5f2b51a3249502a340ed67c5b3112cc97d8131c1))
* **component:** 为Input组件添加前缀支持及相应样式 ([4a2a740](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/4a2a740aff3bfaba1db6c00b14ac0a8d0c1f9431))
* **env:** 添加dotenv支持并创建复制文件到保管库的脚本 ([c9f6f0f](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/c9f6f0f96afc614c4367621ca615d7ebde9c09fc))
* **update-manager:** 实现全面的更新机制，增强进度跟踪 ([7c1fa27](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/7c1fa27ebad310350ee2a9ded9e8df714c4fa4ed))



# [1.0.0-beta.34](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/compare/1.0.0-beta.33...1.0.0-beta.34) (2025-02-24)


### ✨ 新功能

* **reading-progress:** 为目录添加Markdown渲染选项 ([ff7d5a6](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/ff7d5a68aee7bcedb24c26a149360e119d19d9ae))
* **reading-progress:** 通过全面的Markdown解析增强标题文本清理 ([32c62d4](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/32c62d4432dedeb3b140c6ee9f5423f5b9dd45cb))


### 🐛 修复

* **reading-progress:** 优化标题文本清理中的Markdown语法解析 ([65ffd2a](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/65ffd2a742e5b6127062b9aab477bf7ab43f1b0d))



# [1.0.0-beta.33](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/compare/1.0.0-beta.32...1.0.0-beta.33) (2025-02-24)


### ✨ 新功能

* **reading-progress:** 添加平滑滚动的顶部/底部滚动命令 ([656f238](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/656f23897c1d63c2c91ec89dc56006ac721d17e8))


### 🐛 修复

* **reading-progress:** 改进标题检测的滚动位置计算 ([575458b](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/575458bd955d81276878900bff6311df1efc416c))
* **update-manager:** 有条件地记录版本检查通知 ([6c5e122](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/6c5e12244562045a6ae91ded4e7a7960dc1c8c35))
* **update-manager:** 简化更新检查和性能逻辑 ([481a466](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/481a4665dbc5e96f7285fe2c5645df99a7b4c352))



# [1.0.0-beta.32](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/compare/1.0.0-beta.31...1.0.0-beta.32) (2025-02-21)


### 🐛 修复

* **module-config:** 改进配置更新中的数组和对象处理 ([c178014](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/c17801494eeaa48494baa42d85a0b91575a6dc41))



# [1.0.0-beta.31](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/compare/1.0.0-beta.30...1.0.0-beta.31) (2025-02-18)


### ♻️ 重构

* **i18n:** 更新英文和中文本地化的导航按钮描述 ([7a023c2](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/7a023c2e3d1f20c09cc41d971220904bcb53a679))
* **release-workflow:** 改进基于标签的beta和稳定版本的更新日志生成 ([ddb4d3d](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/ddb4d3d628c1896fb26110806f75c3af200c0703))


### ✨ 新功能

* **i18n:** 为导航和进度按钮添加新的本地化条目 ([6b84ce3](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/6b84ce3af33e26c7aff856490de74ca1c3999858))
* **icon:** 添加IconPicker组件用于灵活的图标选择 ([63959fd](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/63959fd64a1506e63c6b1cd80e92de15ed6705a8))
* **reading-progress:** 通过新的交互功能增强导航和配置 ([f2bb83a](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/f2bb83abfd8e1c8d9ff5bb3fb5f22c3ba15d72bf))


### 🐛 修复

* **logger:** 增强通知日志记录并更新卡片边框样式 ([192e9d1](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/192e9d1ab13cf95b9242ff1beec3b2e8db1dec7e))
* **table-enhancements:** 防止在文件菜单中对文件夹显示菜单项 ([d947a73](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/d947a738dabbab6541270dad09028f28645a50f1))



# [1.0.0-beta.30](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/compare/1.0.0-beta.29...1.0.0-beta.30) (2025-02-16)


### ♻️ 重构

* **reading-progress:** 改进TOC链接渲染和交互 ([63c526c](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/63c526ce9b38974155e38b04e2df18b362ad4c6c))
* **settings:** 使用新的概览组件重构设置并改进配置管理 ([04da912](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/04da91203c28b83867db295e6d56a8613dd09326))


### ✨ 新功能

* **frontmatter-sorter:** 添加文件夹排序并改进批量排序详情 ([6d39ff6](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/6d39ff66f35140d23d7777dee5eb0ac048f02e44))
* **reading-progress:** 为阅读时间显示添加可自定义图标和备选方案 ([0c400cb](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/0c400cbddbd25bbdda188359497a116087dfb18c))
* **toolkit:** 为阅读进度和表格增强添加命令和菜单项 ([36bea5b](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/36bea5b660762615ff4bd2858ad033cf30b26eb3))


### 🐛 修复

* **reading-progress:** 将TOC菜单图标更新为list-tree ([2c170c4](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/2c170c4b17b074abc4d832180170f692dccd8f04))
* **styles:** 改进TOC项目悬停状态和光标交互 ([10a3503](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/10a35031bace984dc601939617bbb9a347c846de))



# [1.0.0-beta.29](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/compare/1.0.0-beta.28...1.0.0-beta.29) (2025-02-14)


### ✨ 新功能

* **reading-progress:** 增强代码块处理并改进TOC和阅读时间服务 ([7243102](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/7243102b5b60d5fc64c12137aabc7fe0ace07352))



# [1.0.0-beta.28](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/compare/1.0.0-beta.27...1.0.0-beta.28) (2025-02-13)


### ♻️ 重构

* **reading-progress:** 模块化TOC组件并提取实用函数 ([d028a47](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/d028a4755d6f20415602cc4570c19012d8d1f0ab))
* **reading-progress:** 简化渲染并改进阅读时间的图标处理 ([80bacaa](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/80bacaa15f475657154108ac557b715d3ed406e0))


### ✨ 新功能

* **code-editor:** 通过高级解析增强代码块提取 ([1f5309d](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/1f5309d1c8cdf10262c873f5531e3b414c958d67))


### 🐛 修复

* **reading-progress:** 通过深度感知的标题编号增强TOC生成 ([33d8359](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/33d8359b2d9c7e5281392b21ff2ba8f6873cf15b))



# [1.0.0-beta.27](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/compare/1.0.0-beta.26...1.0.0-beta.27) (2025-02-12)


### ♻️ 重构

* **reading-progress:** 优化活动标题检测和TOC渲染 ([3da9e3f](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/3da9e3f755e00f381862867f06f3fb6a4086e256))


### ✨ 新功能

* **reading-progress:** 实现阅读时间和目录服务 ([15a858c](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/15a858caa62f10d485a89ada3f33e699236ad08d))


### 🐛 修复

* **code-editor:** 移除已弃用的悬停链接源注销 ([e978213](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/e978213e2aee9c8142cc92543d077a94ca2d6d46))



# [1.0.0-beta.26](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/compare/1.0.0-beta.25...1.0.0-beta.26) (2025-02-09)


### 🐛 修复

* **reading-progress:** 转义标题选择器以防止CSS选择器解析错误 ([1b8ed9e](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/1b8ed9e3969b8c5c9f5473fd1adedf37cefc76e0))



# [1.0.0-beta.25](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/compare/1.0.0-beta.24...1.0.0-beta.25) (2025-02-08)


### ♻️ 重构

* **reading-progress:** 更新返回光标图标 ([eb9c4ce](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/eb9c4cede681032f845b185db51c154b8e35c682))


### ✨ 新功能

* **code-editor:** 添加内联代码块编辑按钮和Markdown后处理器 ([5bc4139](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/5bc413905b3d550b10eac76862315a917aeba0d9))


### 🐛 修复

* **code-editor:** 改进视图注册和错误处理 ([18605be](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/18605be6b64b1a35471c9ab3972d5e0e145a1a67))
* **code-editor:** 在代码块编辑中修剪尾随换行符 ([cb4a7bb](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/cb4a7bbdddaaca7d320448c12f193bf50191a997))
* **reading-progress:** 优化TOC模态样式和过渡效果 ([a5e8b56](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/a5e8b5672909515f1eb6f2d937369b0ee93268c5))
* **styles:** 移除代码块编辑模态的最大宽度限制 ([7e92922](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/7e92922555ac6691cb34cbbeb1c237b8ed778f48))



# [1.0.0-beta.24](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/compare/1.0.0-beta.23...1.0.0-beta.24) (2025-02-06)


### ✨ 新功能

* **code-editor:** 在文件上下文菜单中添加创建代码文件选项 ([6fa70ac](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/6fa70ac3cff5a030468d3d998d15abe9797872a7))
* **code-editor:** 添加编辑器内代码块编辑功能 ([25f17b6](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/25f17b6ab299d3189c9487ae06be6bc8e0f066b1))
* **reading-progress,i18n:** 增强TOC和代码编辑器本地化 ([c8612ab](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/c8612ab5bb904787099bad60c1c7997ebb6cb7b0))
* **reading-progress:** 增强H1处理和TOC显示 ([9cabfb9](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/9cabfb9df3b3f9e49aecdef74d6a7634b1571d38))


### 🐛 修复

* **code-editor:** 在文件创建逻辑中规范化文件夹路径 ([7f9b6fc](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/7f9b6fca6e3a85f0838faa819ee4b6a7dee64892))
* **i18n:** 将zh-TW语言代码标准化为zh ([991936d](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/991936dfb4e94f80d7f4cdfd0a17171f1ad29018))
* **reading-progress:** 调整模态最小高度以提高响应性 ([750946d](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/750946d05713351c42bc10fc4acdc36b40f2b091))
* **reading-progress:** 使用container-type改进模态窗口定位 ([1c467a4](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/1c467a4f43e83e43dc003554972cf2b34b356f0d))
* **toolkit:** 从工具包初始化中排除obReader ([d4f9df2](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/d4f9df27853e12a362cb92f1f7114d0a47dc455d))



# [1.0.0-beta.23](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/compare/1.0.0-beta.22...1.0.0-beta.23) (2025-02-03)


### ✨ 新功能

* 在README文件中添加预发布下载徽章 ([1545ff8](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/1545ff81d4c0f77946857642b8360e54bfc75c8a))
* **code-editor:** 添加Monaco编辑器键绑定和作用域管理 ([54b4833](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/54b48332306019df5b3654451208ba2f7e75f9f9))


### 🐛 修复

* **code-editor:** 在自动主题模式下根据Obsidian的深色/浅色模式动态更新编辑器主题 ([b64b9ef](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/b64b9eff5e1cc3550a85f7cd943a879e2720f22f))



# [1.0.0-beta.22](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/compare/1.0.0-beta.21...1.0.0-beta.22) (2025-02-01)


### ♻️ 重构

* **frontmatter-sorter:** 改进事件处理和配置管理 ([6878033](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/687803348a79b3f7289d04fe2dc53f90d3804a47))
* 用自定义基础组件替换原生HTML输入 ([ce5ef4a](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/ce5ef4ac50dd9104734174382b02f7db777011ae))


### ✨ 新功能

* 添加具有全面样式的基础UI组件 ([de7a00a](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/de7a00a655386691f2f77a532f69a233c7461be5))
* **code-editor:** 实现基于Monaco的代码编辑器，具有高级功能 ([0c5d863](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/0c5d86314ddf073c736a96e6afcc3e624c2b2d89))


### 🐛 修复

* **reading-progress:** 移除不必要的justify-content CSS规则 ([c7e95d2](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/c7e95d2fc62743bad0dfe96c97fe23432ecf25a0))



# [1.0.0-beta.21](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/compare/1.0.0-beta.20...1.0.0-beta.21) (2025-01-29)


### ♻️ 重构

* 整合和模块化组件样式 ([10572c8](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/10572c84e4138b9ffb562f070f9787d5026343c2))
* **reading-progress:** 增强标题深度计算和UI样式 ([d2f8772](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/d2f8772037614815a84089b5f2e3acdaf8e9bcfb))
* 移除obReader设置并添加组件特定的CSS导入 ([0703991](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/0703991b7fefd23af4f9cbe5efdb15a196aefa47))


### ✨ 新功能

* **updater:** 实现基于代理的下载策略和强大的版本解析 ([30334d0](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/30334d0ea431a585a5fa72a59a938d6ce6babf4b))


### 🐛 修复

* **reading-progress:** 为目录添加条件渲染 ([40b9c83](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/40b9c83138a7a372f2a17fdc0c62165103c0166b))



# [1.0.0-beta.20](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/compare/1.0.0-beta.19...1.0.0-beta.20) (2025-01-25)


### ✨ 新功能

* **reading-progress:** 在目录中添加跳过H1编号的选项 ([3c897c2](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/3c897c2591589067d8e29e14de67dd3f268f004b))
* **updater:** 添加全面的更新管理系统 ([0aecb92](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/0aecb923b81429c7438668abeb050e4da1e81871))


### 🎨 样式

* **reading-progress:** 居中对齐阅读进度容器 ([0ddb227](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/0ddb2277fa945be45c8a16c916db9fcf2f29ec45))


### 🐛 修复

* **reading-progress:** 通过动态可见性改进标题编号显示 ([2a4cf9d](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/2a4cf9df205983b6d9b15e8ac7498c56a444e72c))
* **reading-progress:** 当目录设置为固定时，没有目录的文档仍然显示进度条 ([243c479](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/243c47987e4b92c9ec0b2a065dfe01c116373083))



# [1.0.0-beta.19](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/compare/1.0.0-beta.18...1.0.0-beta.19) (2025-01-24)


### ♻️ 重构

* prettier ([37a0a2b](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/37a0a2b3857c517b31c2ea9ed12a09155f5f25fa))
* **reading-progress:** 增强进度样式配置和UI组件 ([aa2c6c3](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/aa2c6c3ca357dbe72beee001fe6519d88c006f23))
* **reading-progress:** 增强阅读时间估计和UI组件 ([e729694](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/e729694d71f090869469eae4d490fb5229a0fbdd))
* **release:** 为beta版本添加清单准备步骤 ([ba4a47b](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/ba4a47ba22cc3a4cc83c3aa5f50280993c257770))


### ✨ 新功能

* **quick-path:** 添加文件菜单选项以增强文件管理 ([80ff518](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/80ff51816cbc51448e15afb5e435923c9ec4e728))
* **reading-progress:** 为目录添加展开/折叠功能 ([025f1aa](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/025f1aa48ef13883ec54947067d8460ab4d1df58))
* **reading-progress:** 为目录添加标题编号功能 ([29bfd77](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/29bfd77a6860393448393ff01589ecc9715cf255))



# [1.0.0-beta.18](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/compare/1.0.0-beta.17...1.0.0-beta.18) (2025-01-16)


### ♻️ 重构

* **base-manager:** 简化模块管理并增强事件处理 ([3a63f22](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/3a63f22f048b73163a38ed5068734bece377a61b))


### 🐛 修复

* **table-enhancement:** 适配组件插件的样式 ([60d3249](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/60d3249f7581d53fc810319385d2a61393fa528c))



# [1.0.0-beta.17](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/compare/1.0.0-beta.16...1.0.0-beta.17) (2025-01-15)


### 🐛 修复

* **reading-progress:** 解决主题按钮图标消失问题 ([2915391](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/2915391da9fb15bc498a57efd3ef7791c1416a0a))



# [1.0.0-beta.16](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/compare/1.0.0-beta.15...1.0.0-beta.16) (2025-01-15)


### 🎨 样式

* **settings:** 更新版本显示并增强本地化 ([46e0b27](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/46e0b27289e20c6b743516cca04cab666330e671))



# [1.0.0-beta.15](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/compare/1.0.0-beta.14...1.0.0-beta.15) (2025-01-15)


### 🐛 修复

* **reading-progress:** 简化目录样式并改进渲染逻辑 ([93180a3](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/93180a39dea569cc700524ff9e293a19658a244f))



# [1.0.0-beta.14](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/compare/1.0.0-beta.13...1.0.0-beta.14) (2025-01-15)


### ✨ 新功能

* **i18n:** 增强设置本地化和结构 ([1f82ceb](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/1f82cebaa3c5d1ecbeec8657dcd38dcf7e5c8e2b))
* **settings:** 通过菜单配置增强开发者设置 ([2dd8ef0](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/2dd8ef0a7ccbd9c6216e796c2da8e7f74c3b14c6))


### 🎨 样式

* 增强表格和阅读进度样式 ([d07d463](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/d07d4635fb696ea5975b5b06b0fcd727fc93bab6))



# [1.0.0-beta.13](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/compare/1.0.0-beta.12...1.0.0-beta.13) (2025-01-12)


### ♻️ 重构

* **table-enhancements:** 从计算和本地化中移除百分比功能 ([7a56885](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/7a56885e7efa7583dd8e6024183bee88fd0e4260))


### ✨ 新功能

* 集成html-react-parser以增强描述渲染 ([cba027b](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/cba027b74835a58777d41938b5f4b83162ce0255))
* **reading-progress:** 添加工具栏可见性选项并更新本地化 ([e9399a2](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/e9399a29506ca45cea2adbbe1c9aa44475430458))


### 🐛 修复

* 更新README文件中的Wiki链接以改进文档访问 ([b843431](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/b843431a21fa5bfeeb37ba77d71d53d860dbec3c))



# [1.0.0-beta.12](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/compare/1.0.0-beta.11...1.0.0-beta.12) (2025-01-10)


### ✨ 新功能

* **reading-progress:** 增强tocGroup样式以改进布局和交互 ([4421339](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/44213397f6be7c71f35f4f22b49d0a8def67857c))
* **reading-progress:** 重构TOC处理并改进标题检测逻辑 ([665b763](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/665b76315b985b6459227e8900e0ed85edabdf49))



# [1.0.0-beta.11](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/compare/1.0.0-beta.10...1.0.0-beta.11) (2025-01-09)


### ✨ 新功能

* **reading-progress:** 为ReadingProgress组件添加水平内边距以扩大触摸区域，提升用户交互体验 ([3ef785b](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/3ef785b7f440c171f464715919e92214a8409097))


### 🎨 样式

* 更新TOC项目样式并调整ReadingProgress组件的背景颜色 ([efe0598](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/efe059824da781d5ed2d849b0fabea607522a8fa))



# [1.0.0-beta.10](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/compare/1.0.0-beta.9...1.0.0-beta.10) (2025-01-09)


### ✨ 新功能

* **reading-progress:** 添加"复制目录"功能并更新样式 ([d124768](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/d124768a485f3d8f34bc481c0458af5cfc6d9eee))
* **reading-progress:** 添加返回底部功能并增强返回按钮UI ([9d775b7](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/9d775b7e9d1642c7fbbd5b14f5e31bc384b68607))



# [1.0.0-beta.9](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/compare/1.0.0-beta.8...1.0.0-beta.9) (2025-01-09)


### ✨ 新功能

* **reading-progress:** 添加工具栏和拖拽功能以自定义目录 ([437895c](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/437895cc6673efe9f08119b66313617b1d68db94))


### 🐛 修复

* **reading-progress:** 更新返回光标图标并使光标位置在页面中央显示 ([4e3b74d](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/4e3b74d811571455a20bd50fe028fa2dfb344f51))



# [1.0.0-beta.8](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/compare/1.0.0-beta.7...1.0.0-beta.8) (2025-01-09)


### ♻️ 重构

* **estimatedReadingTime:** 优化阅读时间计算和内容清理 ([23054e2](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/23054e2591065c22a5e833639dd9838ce35e4e97))


### ✨ 新功能

* **reading-progress:** 增强阅读进度设置和UI ([4f9af45](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/4f9af458c1daff802194ec43f4e87d33b38ee5bb))



# [1.0.0-beta.7](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/compare/1.0.0-beta.6...1.0.0-beta.7) (2025-01-08)


### ✨ 新功能

* **reading-progress:** 引入阅读进度功能，包含设置和UI增强 ([3371dc6](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/3371dc64b883721debb13b93a4fbe7782e62f515))


### 🐛 修复

* **ReadingProgressManager:** 移除不必要的阅读时间内容日志记录 ([ede5677](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/ede5677f96f04a8e87f93d10c26187c1a4a62bcb))



# [1.0.0-beta.6](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/compare/1.0.0-beta.5...1.0.0-beta.6) (2025-01-08)


### ✨ 新功能

* **i18n:** 为阅读进度功能添加返回按钮翻译 ([7a5e1e8](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/7a5e1e89388ec07d6d68590c69e52a2256c9ea4e))
* **reading-progress:** 通过新的UI组件和功能增强阅读进度功能 ([03cbf2a](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/03cbf2ae1834647d7bd873c7cd1e87e9b1ecda84))



# [1.0.0-beta.5](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/compare/1.0.0-beta.4...1.0.0-beta.5) (2025-01-07)


### ✨ 新功能

* **reading-progress:** 实现带UI组件的阅读进度功能 ([a0baa2d](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/a0baa2d66c91eec51774ba98866895f130e802bf))
* **settings:** 通过日志集成和工具包切换功能增强ToolkitOverview ([f7930c3](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/f7930c31a5c68b292c852c0d6636d2f58a4fb8e5))



# [1.0.0-beta.4](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/compare/1.0.0-beta.3...1.0.0-beta.4) (2025-01-03)


### ♻️ 重构

* 项目结构重新配置 ([4bd1a87](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/4bd1a87758e8f4c4c65423f0cbbd0cfaad288c5b))



# [1.0.0-beta.3](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/compare/1.0.0-beta.2...1.0.0-beta.3) (2024-12-31)


### ♻️ 重构

* **menu:** 简化菜单项处理并改进工具包集成 ([4be3a62](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/4be3a6256947047d7b7b837f8f9a020d16d0ea61))
* 移除自定义图标支持并简化导入 ([8c5c599](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/8c5c599aa6175c9b8602aa1a3cf296f0a93b4025))


### ✨ 新功能

* **table-enhancements:** 添加前置元数据键替换功能 ([38e9206](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/38e92067adbd1bd1f8a5133b79f738fa5c10505c))
* **table-enhancements:** 增强公式编辑器和模态框以改进计算管理 ([a644f86](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/a644f8679236cf7055bcd8df69c8b44d53ecadc1))
* **table-enhancements:** 扩展公式功能并改进UI组件 ([bd4ad5c](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/bd4ad5c7ae202b84da33e7dc39014e28527e169c))
* **table-enhancements:** 实现用于计算管理的公式模态框 ([2a6c668](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/2a6c668b4989667537409bf7fc242037f5406f5b))



# [1.0.0-beta.2](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/compare/1.0.0-beta.1...1.0.0-beta.2) (2024-12-27)


### ♻️ 重构

* **quickPath:** 将命令注册重构为单独的方法以更好地组织代码 ([d6d46b8](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/d6d46b8f8e0bce0a2665f88b3ce3d4eee4807f56))
* **useToolkitSettings:** 简化工具包初始化和排序逻辑 ([dad750f](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/dad750f32fdce7dd72048046e6166390c8f645ae))


### ✨ 新功能

* 更新清单为beta版本并添加自定义图标和OBReader支持 ([11803d1](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/11803d196dd1d880b63ac89f0e8f20b0fd69d4c2))


### 🐛 修复

* **frontmatter:** 改进数组类型的前置元数据解析和写入 ([2d8fdad](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/2d8fdad7dcd31cc51e74d1ab77080303026bf087))



# [1.0.0-beta.1](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/compare/441c4a52566ad30048c75ef4bbb4da00de73137b...1.0.0-beta.1) (2024-12-26)


### ♻️ 重构

* **release:** 增强GitHub Actions中的更新日志生成逻辑 ([45d85d3](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/45d85d30eb9f77a087a1ef67cd3e91ea243c1100))
* **table-enhancements:** 重构表格计算功能的UI交互 ([3e5edf6](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/3e5edf6fab689d54ab05a289e460272f3bf61ad6))


### ⚡️ 性能优化

* **style:** 优化样式 ([726a8e4](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/726a8e43103dc7e642e4e8b6b3b0c74b2c8e33ab))


### ✨ 新功能

* **frontmatter-sorter:** 初步实现功能，设置页面待完善 ([9a7cea5](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/9a7cea55735b04078a9559788c7b2d7f5b5f00d0))
* **frontmatter-sorter:** 功能完成，设置界面添加完成 ([30632d7](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/30632d71a2edab2a6330a1efc457bb78355d002c))
* **manifest:** 添加初始manifest-beta ([a57700a](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/a57700aa15b7c8a6d9073c6f3c2ef369bde79a18))
* **quick-path:** 增加编辑器菜单 ([e82106b](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/e82106b53cd21b3161c9ee6dfe80a2a1744587bf))
* **quick-path:** 增加命令 ([b3a2868](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/b3a28680d3c7ed92167617e5333151222443ed0c))
* **quick-path:** 增加toolkit，快捷复制文件夹，文件路径 ([05b1c14](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/05b1c14c23d66cd764bb085837c332ae72e1e5aa))
* **release:** 优化发布流程和文档 ([2a5aab1](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/2a5aab125edca0689758e300eceaad908fa1c33d))
* **table-enhancements:** 使用AG Grid实现表格增强功能 ([441c4a5](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/441c4a52566ad30048c75ef4bbb4da00de73137b))


### 🎨 样式

* **table-enhancements:** 优化表格计算组件的布局和高度控制 ([cf92784](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/cf9278447dc4af70d1d92a64d8dc771d2cc3ad82))
* **table:** 优化表格计算组件的布局和交互 ([351d964](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/351d9645ff0f6ee5d6edd0a6881408660641d1c2))


### 🐛 修复

* **frontmatter-sorter:** 批量排序出错 ([475d680](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/475d680857f0f6c4c63b6bc25fb2769c386ba95b))
* **frontmatter-sorter:** 数组类型部分未保留源格式 ([c630d5f](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/c630d5f37e03c5396530fc691820705781a61f6e))
* **frontmatter-sorter:** 修复配置更改后不生效的问题 ([4d6e250](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/4d6e2503465a9d69330a011c5875cf9eb38f11c5))
* **i18n:** 翻译错误 ([e7e14be](https://github.com/RavenHogWarts/obsidian-ravenhogwarts-toolkit/commit/e7e14bec1d08ffd4aedcb71b11571b8a2702d122))


