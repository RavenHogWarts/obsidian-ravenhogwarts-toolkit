# Folder Templates 功能说明

Folder Templates 是一个用于在特定文件夹中创建文件时自动应用模板的功能模块。它模仿了 Obsidian 官方模板插件的机制，但提供了更加无缝的用户体验。

## 主要功能

### 1. 模板自动应用
- 当在配置了模板的文件夹中创建新文件时，可以自动应用对应的模板
- 支持文件夹路径的精确匹配和子路径匹配
- 支持模板变量替换

### 2. 模板变量支持
支持以下模板变量：
- `{{title}}` - 文件名
- `{{date}}` - 当前日期（YYYY-MM-DD）
- `{{time}}` - 当前时间（HH:MM:SS）
- `{{timestamp}}` - 完整时间戳
- `{{date:YYYY-MM-DD}}` - 自定义日期格式
- `{{date:MM-DD-YYYY}}` - 美式日期格式
- `{{date:DD/MM/YYYY}}` - 欧式日期格式
- `{{date:YYYY年MM月DD日}}` - 中文日期格式

### 3. 文件名规则
- 支持自定义文件名生成规则
- 可以使用模板变量来构建文件名
- 如果不指定规则，使用用户输入的文件名

## 使用方法

### 配置模板

1. 进入插件设置页面
2. 找到"文件夹模板"设置项
3. 配置模板文件夹路径（默认为 "Templates"）
4. 添加模板配置：
   - **目标文件夹**: 要应用模板的文件夹路径
   - **模板文件**: 模板文件的相对路径（相对于模板文件夹）
   - **文件名规则**: 可选，用于自动生成文件名

### 创建文件

#### 方法1: 通过命令
1. 使用命令面板 (Ctrl/Cmd + P)
2. 搜索 "Create file from folder template"
3. 选择目标文件夹和模板
4. 输入文件名并创建

#### 方法2: 通过右键菜单
1. 在文件资源管理器中右键点击配置了模板的文件夹
2. 选择 "Create file with template"
3. 输入文件名并创建

## 技术实现

### 核心服务 (FolderTemplatesService)

该服务负责：
- 模板文件的读取和管理
- 模板变量的替换处理
- 文件创建和模板应用
- 模板配置的验证

### 管理器 (FolderTemplatesManager)

该管理器负责：
- 插件生命周期管理
- 事件处理和命令注册
- 用户界面交互
- 配置数据管理

### 主要方法

#### FolderTemplatesService 主要方法：

- `getDefaultTemplatesFolderPath()` - 获取默认模板文件夹路径
- `getTemplateFiles(templatesFolderPath)` - 获取模板文件列表
- `findMatchingTemplate(folderPath, templates)` - 查找匹配的模板
- `createFileFromTemplate(...)` - 从模板创建文件
- `replaceTemplateVariables(content, variables)` - 替换模板变量
- `validateTemplate(template, templatesFolderPath)` - 验证模板配置

#### FolderTemplatesManager 主要方法：

- `showCreateFileModal(targetFolderPath)` - 显示创建文件对话框
- `handleFileMenu(menu, file)` - 处理文件右键菜单
- `getTemplatesService()` - 获取模板服务实例

## 示例配置

假设你有以下目录结构：
```
Templates/
  ├── daily-note.md
  ├── meeting-note.md
  └── project/
      └── task.md

Notes/
  ├── Daily/
  ├── Meetings/
  └── Projects/
```

可以配置以下模板规则：
1. **Daily 文件夹**: 使用 `daily-note.md` 模板，文件名规则: `{{date}}-daily`
2. **Meetings 文件夹**: 使用 `meeting-note.md` 模板
3. **Projects 文件夹**: 使用 `project/task.md` 模板，文件名规则: `{{date}}-{{title}}`

## 注意事项

1. 模板文件必须是 Markdown 格式 (.md)
2. 文件名规则中的非法字符会被替换为 `-`
3. 如果目标文件已存在，不会覆盖现有文件
4. 模板变量区分大小写
5. 支持嵌套文件夹的模板匹配（子文件夹会继承父文件夹的模板配置）