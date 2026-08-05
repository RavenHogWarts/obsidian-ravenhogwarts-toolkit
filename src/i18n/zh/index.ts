import type { BaseTranslation } from "../i18n-types";

const zh = {
	common: {
		enabled: "启用",
		enabledDesc: "开启或关闭此工具",
		noConfig: "此工具暂无可配置项",
		add: "添加",
		delete: "删除",
		reset: "重置",
		moveUp: "上移",
		moveDown: "下移",
	},
	settings: {
		folder_templates: {
			name: "文件夹模板",
			desc: "在指定文件夹下创建新文件时，无感知应用模板",
			templatesFolderPath: {
				name: "模板文件夹位置",
				desc: "存放模板文件的文件夹；留空时跟随官方模板插件配置",
			},
			rules: {
				name: "模板规则",
				unnamed: "新规则",
				enabledDesc: "开启或关闭此规则",
				addFirst: "创建第一条规则",
				scopesUnit: "个条件",
				warnNoTemplate: "此规则未设置模板文件",
				renamePreview: "预览：",
				templateFile: {
					name: "模板文件",
					desc: "命中规则后应用的模板；支持日期、时间等变量表达式",
				},
				applyMode: {
					name: "应用方式",
					desc: "文件已有内容时的处理策略",
					emptyOnly: "仅空文件",
					prepend: "插入到开头",
				},
				renameFormat: {
					name: "重命名模板",
					desc: "创建时按模板重命名文件，支持变量表达式；留空表示不重命名",
				},
			},
			scopes: {
				name: "匹配条件",
				empty: "无匹配条件时规则不会生效",
				typeFolder: "文件夹",
				typeExcludeFolder: "排除文件夹",
				typeFilenamePattern: "文件名正则",
				typeRoot: "根目录",
				pathPlaceholder: "folder/path",
				patternPlaceholder: "^\\d+-\\d+",
				patternInvalid: "无效的正则表达式",
				includeSubfolders: "包含子文件夹",
			},
			variables: {
				title: "可用变量",
				legacy: "仍兼容旧版 {date} / {time} 语法。",
				clickToCopy: "点击复制",
				copied: "已复制",
				notename: "笔记名",
				folder: "上级文件夹名",
				folderPath: "上级文件夹路径",
				date: "当前日期（YYYY-MM-DD）",
				time: "当前时间（HH:mm）",
				year: "当前年份",
				yearMonth: "年月（YYYYMM）",
				timestamp: "毫秒时间戳",
				now: "自定义 moment 格式",
				frontmatter: "frontmatter 字段值",
			},
		},
		quick_path: {
			name: "快速路径",
			desc: "快速获取指定文件/文件夹的路径",
			addEditorMenu: {
				name: "添加编辑器菜单",
				desc: "在编辑器菜单中添加粘贴当前文件路径的选项",
			},
			addFileMenu: {
				name: "添加文件列表菜单",
				desc: "在文件列表菜单中添加复制文件/文件夹路径的选项",
			},
			useAbsolutePath: {
				name: "绝对路径",
				desc: "使用绝对路径，即从操作系统根目录开始的路径",
			},
			pathSeparator: {
				name: "分隔符",
				desc: "多个路径的分隔符",
				newline: "换行",
				comma: "逗号",
				semicolon: "分号",
				space: "空格",
			},
		},
	},
	command: {
		quick_path: {
			copy_current_file_path: "复制当前文件路径",
			copy_current_folder_path: "复制当前目录路径",
		},
	},
	menu: {
		quick_path: {
			copy_file_path: "复制文件路径",
			copy_files_path: "复制多个路径",
			copy_folder_path: "复制目录路径",
			paste_current_file_path: "粘贴当前文件路径",
			paste_current_folder_path: "粘贴当前目录路径",
		},
	},
	notice: {
		quick_path: {
			copy_success: "路径已复制到剪贴板",
			copy_failure: "复制路径失败",
			root_path_warning: "当前文件位于根目录，无法获取上级文件夹路径",
		},
	},
} satisfies BaseTranslation;

export default zh;
