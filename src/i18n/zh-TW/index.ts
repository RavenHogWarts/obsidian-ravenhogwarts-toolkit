import type { BaseTranslation } from "../i18n-types";

const zh_TW = {
	common: {
		enabled: "啟用",
		enabledDesc: "開啟或關閉此工具",
		noConfig: "此工具暫無可設定項",
		add: "新增",
		delete: "刪除",
		reset: "重設",
		moveUp: "上移",
		moveDown: "下移",
	},
	settings: {
		folder_templates: {
			name: "文件夾模板",
			desc: "在指定文件夾下創建新文件時，無感知應用模板",
			templatesFolderPath: {
				name: "模板文件夾位置",
				desc: "存放模板文件的文件夾；留空時跟隨官方模板插件配置",
			},
			rules: {
				name: "模板規則",
				unnamed: "新規則",
				enabledDesc: "開啟或關閉此規則",
				templateFile: {
					name: "模板文件",
					desc: "命中規則後應用的模板；支持日期、時間等變量表達式",
				},
				applyMode: {
					name: "應用方式",
					desc: "文件已有內容時的處理策略",
					emptyOnly: "僅空文件",
					prepend: "插入到開頭",
				},
				renameFormat: {
					name: "重命名模板",
					desc: "創建時按模板重命名文件，支持變量表達式；留空表示不重命名",
				},
			},
			scopes: {
				name: "匹配條件",
				empty: "無匹配條件時規則不會生效",
				typeFolder: "文件夾",
				typeExcludeFolder: "排除文件夾",
				typeFilenamePattern: "文件名正則",
				typeRoot: "根目錄",
				pathPlaceholder: "folder/path",
				patternPlaceholder: "^\\d+-\\d+",
				includeSubfolders: "包含子文件夾",
			},
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
			pathSeparator: {
				name: "分隔符",
				desc: "多個路徑的分隔符",
				newline: "換行",
				comma: "逗號",
				semicolon: "分號",
				space: "空格",
			},
		},
		table_calculator: {
			name: "表格計算器",
			desc: "為 markdown 表格數據提供持久化公式計算",
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
} satisfies BaseTranslation;

export default zh_TW;
