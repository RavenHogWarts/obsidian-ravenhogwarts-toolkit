import { BaseMessage } from "@src/i18n/types";

const translations: BaseMessage = {
	settings: {
		folder_templates: {
			name: "文件夾模板",
			desc: "在指定文件夾下創建新文件時，無感知應用模板",
		},
		quick_path: {
			name: "快速路徑",
			desc: "快速獲取指定文件/文件夾的路徑",
			addEditorMenu: {
				name: "添加編輯器菜單",
				desc: "在編輯器菜單中添加粘貼當前文件路徑的選項",
			},
			addFileMenu: {
				name: "添加文件列表菜單",
				desc: "在文件列表菜單中添加複製文件/文件夾路徑的選項",
			},
			useAbsolutePath: {
				name: "絕對路徑",
				desc: "使用絕對路徑，即從操作系統根目錄開始的路徑",
			},
			separator: {
				name: "分隔符",
				desc: "多個路徑的分隔符",
				newline: "換行",
				comma: "逗號",
				semicolon: "分號",
				space: "空格",
			},
		},
	},
	command: {
		quick_path: {
			copy_current_file_path: "複製當前文件路徑",
			copy_current_folder_path: "複製當前目錄路徑",
		},
	},
	menu: {
		quick_path: {
			copy_file_path: "複製文件路徑",
			copy_files_path: "複製多個路徑",
			copy_folder_path: "複製目錄路徑",
			paste_current_file_path: "粘貼當前文件路徑",
			paste_current_folder_path: "粘貼當前目錄路徑",
		},
	},
	notice: {
		quick_path: {
			copy_success: "路徑已複製到剪貼板",
			copy_failure: "複製路徑失敗",
			root_path_warning: "當前文件位於根目錄，無法獲取上級文件夾路徑",
		},
	},
};

export default translations;
