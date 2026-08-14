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
				addFirst: "創建第一條規則",
				scopesUnit: "個條件",
				warnNoTemplate: "此規則未設置模板文件",
				renamePreview: "預覽：",
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
				typeRoot: "根目錄（含所有子資料夾）",
				rootHint: "整庫生效，僅被排除條件收窄；作為兜底建議放在規則清單末尾",
				pathPlaceholder: "folder/path",
				patternPlaceholder: "^\\d+-\\d+",
				patternInvalid: "無效的正則表達式",
				includeSubfolders: "包含子文件夾",
			},
			variables: {
				title: "可用變量",
				legacy: "仍兼容舊版 {date} / {time} 語法。",
				clickToCopy: "點擊複製",
				copied: "已複製",
				notename: "筆記名",
				folder: "上級文件夾名",
				folderPath: "上級文件夾路徑",
				date: "當前日期（YYYY-MM-DD）",
				time: "當前時間（HH:mm）",
				year: "當前年份",
				yearMonth: "年月（YYYYMM）",
				timestamp: "毫秒時間戳",
				now: "自定義 moment 格式",
				frontmatter: "frontmatter 字段值",
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
		folder_scaffolder: {
			name: "目錄框架克隆",
			desc: "複製資料夾的目錄結構，支援臨時複製/貼上與儲存為範本",
			templates: {
				name: "結構範本",
			},
			templateCard: {
				unnamed: "未命名範本",
				enabledDesc: "開啟或關閉此範本",
				addFirst: "建立第一個範本",
				nameField: {
					name: "名稱",
					desc: "在命令與選單中顯示",
				},
				sourceField: {
					name: "來源資料夾",
					desc: "快照來源（僅展示/刷新用）",
				},
				refresh: "刷新快照",
				refreshed: "已從來源刷新 {count} 個子目錄",
				sourceNotFound: "來源資料夾不存在，無法刷新",
				subDirs: "{count} 個子目錄",
				structure: {
					name: "資料夾結構",
					empty: "還沒有資料夾，點擊「新增根資料夾」開始搭建",
				},
				addRootFolder: "新增根資料夾",
				addFolder: "新增子資料夾",
				newFolderName: "新增資料夾",
				indent: "縮排",
				outdent: "取消縮排",
				renameHint: "雙擊重新命名",
				dragHint: "用按鈕或 Tab / Shift+Tab / Alt+↑↓ 調整層級與順序",
				collapse: "收起",
				expand: "展開",
				importFromVault: "從 vault 匯入",
				importFromVaultDesc:
					"選填：從一個現有資料夾讀取結構填入下方（不影響手動編輯）",
			},
		},
	},
	command: {
		quick_path: {
			copy_current_file_path: "複製當前文件路徑",
			copy_current_folder_path: "複製當前目錄路徑",
		},
		folder_scaffolder: {
			create_from_template: "從範本建立結構",
			paste_structure: "貼上結構到當前目錄",
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
		folder_scaffolder: {
			create_from_template: "從範本建立結構",
			copy_structure: "複製此資料夾結構",
			paste_structure: "貼上資料夾結構",
			save_as_template: "將此結構儲存為範本",
		},
	},
	modal: {
		folder_scaffolder: {
			scaffold_title: "從範本建立結構",
			select_template: "選擇範本",
			target_parent: "目標位置",
			target_parent_desc: "結構將複製到此資料夾下",
			new_folder_name: "包裝資料夾（可選）",
			new_folder_name_desc: "在結構外層再加一層資料夾",
			confirm: "建立",
			save_template_title: "儲存為範本",
			template_name: "範本名稱",
			save: "儲存",
		},
	},
	notice: {
		quick_path: {
			copy_success: "路徑已複製到剪貼板",
			copy_failure: "複製路徑失敗",
			root_path_warning: "當前文件位於根目錄，無法獲取上級文件夾路徑",
		},
		folder_scaffolder: {
			no_template: "沒有可用的範本，請先在設定中新增",
			copied: "已複製 {count} 個子目錄到剪貼簿",
			clipboard_empty: "剪貼簿為空，請先複製一個資料夾結構",
			empty_structure: "此資料夾沒有子目錄，無需儲存為範本",
			template_saved: "已儲存為範本",
			created: "已建立 {count} 個資料夾",
			create_failed: "建立結構失敗",
			paste_invalid: "剪貼簿中未找到可辨識的資料夾結構",
			pasted: "已貼上 {count} 個資料夾",
		},
	},
} satisfies BaseTranslation;

export default zh_TW;
