import { BaseMessage } from "@src/i18n/types";

const translations: BaseMessage = {
	settings: {
		folder_templates: {
			name: "文件夹模板",
			desc: "在指定文件夹下创建新文件时，无感知应用模板",
			templatesFolderPath: {
				name: "模板文件夹位置",
				desc: "存放模板文件的文件夹, 默认与官方模板位置相同",
			},
			ignoredFolders: {
				name: "忽略文件夹",
				desc: "在这些文件夹（包括子文件夹）中创建文件时不会自动应用模板",
			},
			folderTemplates: {
				name: "模板配置",
				desc: "",
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
		table_calculator: {
			name: "表格计算器",
			desc: "为 markdown 表格数据提供持久化公式计算",
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
};

export default translations;
