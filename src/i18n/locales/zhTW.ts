import { BaseMessage } from "../types";

const translations: BaseMessage = {
	common: {
		settings: "設置",
		overview: {
			title: "工具包管理",
			description:
				"歡迎使用工具包，查看<a href='https://docs.ravenhogwarts.top/obsidian-ravenhogwarts-toolkit/' target='_blank'>wiki文檔</a>了解更多功能",
			version_hint: "繼續點擊...",
		},
		general: {
			title: "常規設置",
			menu: {
				useSubMenu: "使用子選單",
			},
		},
		toolkit: {
			title: "工具設置",
			description: "工具啟用/禁止後發生報錯，可以嘗試重啟obsidian解決",
		},
		developer: {
			title: "開發者設置",
			description: "離開頁面，將關閉開發者模式，需要重新啟用",
			logger: {
				level: "日誌級別",
				showTimestamp: "日誌顯示時間戳",
				showLevel: "日誌顯示級別",
				console: "日誌輸出到控制台",
				showNotifications: "顯示通知",
				noticeTimeout: "通知消失時間(ms)",
			},
		},
		back: "返回",
		toggle_toolkit: "啟用/禁用工具包",
		confirm: "確認",
		cancel: "取消",
	},
	notice: {
		update_success: "插件更新到 {{latestVersion}} 版本，請重啟 Obsidian",
		downloading_file: "正在下載文件: {{fileName}}",
		installing_update: "正在安裝更新...",
		no_update_needed: "無可用更新",
		checking_update: "正在檢查更新...",
		update_completed: "更新完成",
		update_error: "更新失敗",
	},
	toolkit: {
		tableEnhancements: {
			title: "表格增強",
			description: "更好的利用markdown表格",
			editor_menu: {
				table_enhancements: "表格增強編輯",
			},
			file_menu: {
				table_enhancements: "表格增強編輯",
			},
			command: {
				table_enhancements: "表格增強編輯",
			},
			formula: {
				output_type: "輸出類型",
				output_value: "輸出值",
				add_calculation: "添加公式計算",
				execute_all: "執行當前表格所有公式",
				cancel: "取消",
				update: "更新",
				add: "添加",
				hide_calculator: "隱藏公式編輯",
				show_calculator: "顯示公式編輯",
				edit_calculation: "編輯公式",
				remove_calculation: "刪除公式",
				execute_calculation: "執行公式",
				edit_table: "編輯表格",
				save_changes: "保存更改",
				no_table_data: "沒有表格數據",
			},
			formula_editor: {
				math: {
					COUNT: "計算選定列數量",
					count_modifier: "計數類型",
					SUM: "計算選定列數值總和",
					AVERAGE: "計算選定列數值平均值",
					MIN: "計算選定列數值最小值",
					MAX: "計算選定列數值最大值",
					MEDIAN: "計算選定列數值中位數",
					MODE: "計算選定列數值眾數",
					STDDEV: "計算選定列數值標準差",
					VARIANCE: "計算選定列數值方差",
				},
				time: {
					TIME_EARLIEST: "計算選定列最早日期",
					TIME_LATEST: "計算選定列最晚日期",
					TIME_SPAN: "計算選定列日期跨度",
					time_format: "日期格式",
					time_unit: "時間單位",
				},
				table_columns: "表格列",
				input_placeholder: "選擇一個函數或開始輸入...",
				function_name: "公式函數",
				hint_syntax: "語法",
				hint_example: "示例",
				hint_parameters: "參數",
				parameter_optional: "可選",
				parameter_options: "選項",
				insert_option: "插入",
			},
		},
		quickPath: {
			title: "快速路徑",
			description: "快速獲取指定文件/文件夾的路徑",
			editor_menu: {
				paste_filePath: "粘貼文件路徑",
				paste_folderPath: "粘貼文件夾路徑",
			},
			file_menu: {
				copy_filePath: "複製文件路徑",
				copy_folderPath: "複製文件夾路徑",
				copy_filesPath: "複製文件路徑(多文件)",
			},
			command: {
				copy_filePath: "複製文件路徑",
				copy_folderPath: "複製文件夾路徑",
			},
			status: {
				copy_success: "路徑已複製到剪貼板",
				copy_failed: "複製失敗",
				no_parent_path: "根目錄文件沒有父目錄",
			},
			settings: {
				addEditorMenu: {
					title: "添加編輯器菜單",
					description: "在編輯器菜單中添加粘貼當前文件路徑的選項",
				},
				addFileMenu: {
					title: "添加文件列表菜單",
					description:
						"在文件列表菜單中添加複製文件/文件夾路徑的選項",
				},
				absolutePath: {
					title: "絕對路徑",
					description: "使用絕對路徑，即從操作系統根目錄開始的路徑",
				},
				separator: {
					title: "分隔符",
					description: "多個路徑的分隔符",
					newline: "換行",
					comma: "逗號",
					semicolon: "分號",
					space: "空格",
				},
			},
		},
		folderTemplates: {
			title: "文件夾模板",
			description: "在指定文件夾下創建新文件時，無感知應用模板",
			settings: {
				templatesFolderPath: {
					title: "模板文件夾路徑",
					description:
						"存放模板文件的文件夾路徑, 默認與官方模板位置相同",
				},
			},
		},
	},
};

export default translations;
