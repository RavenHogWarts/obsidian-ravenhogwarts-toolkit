import { BaseMessage } from "@src/i18n/types";

const translations: BaseMessage = {
	settings: {
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
			separator: {
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
			copy_current_folder_path: "复制当前文件夹路径",
		},
	},
	menu: {
		quick_path: {
			copy_file_path: "复制文件路径",
			copy_files_path: "复制多个文件路径",
			copy_folder_path: "复制文件夹路径",
			paste_current_file_path: "粘贴当前文件路径",
			paste_current_folder_path: "粘贴当前文件夹路径",
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
