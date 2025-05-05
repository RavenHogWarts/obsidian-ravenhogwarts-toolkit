import { BaseMessage } from "../types";

const translations: BaseMessage = {
	common: {
		settings: "設置",
		overview: {
			title: "工具包管理",
			description:
				"歡迎使用工具包，查看<a href='https://ravenhogwarts.github.io/docs/zh/obsidian-ravenhogwarts-toolkit' target='_blank'>wiki文檔</a>了解更多功能",
			version_hint: "繼續點擊...",
			auto_update: "自動更新",
			check_beta: "接收Beta",
			check_update: "檢查更新",
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
		frontmatterSorter: {
			title: "文檔屬性排序",
			description: "自動整理和排序文檔的文檔屬性內容",
			command: {
				sortCurrentFile: "排序當前文件",
				sortAllFiles: "排序所有文件",
			},
			file_menu: {
				sort_folder: "排序文件夾內文檔屬性",
			},
			notice: {
				ignore_folder: "在忽略文件夾 {{ignoredFolder}} 中",
				ignore_pattern: "匹配忽略規則 {{ignoredPattern}}",
				ignore_unknown: "在忽略列表中",
				check_console: "請檢查控制台以獲取更多詳細信息",
				file_ignored: "文件 {{filePath}} 被忽略，原因：{{reason}}",
				file_sorted: "文件 {{filePath}} 已排序",
				sort_complete:
					"前置元數據排序完成：\n已處理 {{processedFiles}} 個文件，已跳過 {{skippedFiles}} 個文件",
				sort_details: {
					title: "前置元數據排序詳細信息：",
					success: "\n {{successFiles}} 個文件成功排序，文件：",
					unchanged: "\n {{unchangedFiles}} 個文件無須排序，文件：",
					skipped: "\n {{skippedFiles}} 個文件在忽略規則中，文件：",
				},
				confirm_sort_all: {
					title: "批量排序確認",
					message:
						"此操作將對所有 Markdown 文件的文檔屬性進行排序，是否繼續？",
				},
				confirm_sort_folder: {
					title: "批量排序確認",
					message:
						"此操作將對文件夾中 {{folderPath}} (不包括子文件夾)的所有 Markdown 文件的文檔屬性進行排序，是否繼續？",
				},
			},
			settings: {
				segment: {
					general: "常規設置",
					ignore_rules: "忽略規則",
					sort_rules: "排序規則",
				},
				sortOnSave: {
					title: "保存時排序",
					description: "保存文件時自動排序文檔屬性",
				},
				ignoreFolders: {
					title: "忽略文件夾",
					description: "忽略特定文件夾中的文檔屬性",
					placeholder: "請輸入忽略的文件夾",
				},
				ignoreFiles: {
					title: "忽略文件",
					description: "忽略特定文件中的文檔屬性",
					placeholder: "請輸入忽略的文件",
				},
				rules: {
					priority: {
						title: "優先排序組",
						description: "優先排序的文檔屬性組，組內按字母排序",
						placeholder: "請輸入優先排序的文檔屬性",
					},
					ignoreKeys: {
						title: "忽略排序組",
						description:
							"忽略的文檔屬性組，組內保持原始相對順序，放置在末尾",
						placeholder: "請輸入忽略的文檔屬性",
					},
					arraySort: {
						title: "數組排序",
						description: "對數組類型的文檔屬性中的值進行字母排序",
					},
					caseSensitive: {
						title: "大小寫敏感",
						description:
							"啟用後按 AA -> aa -> BB -> bb 排序，禁用則視為相同字母",
					},
				},
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
		obReader: {
			title: "OBReader",
			description: "OBReader",
		},
		readingProgress: {
			title: "目錄導航",
			description: "懸浮顯示當前文檔的閱讀進度，目錄等",
			command: {
				insert_toc: "插入目錄",
				insert_reading_time: "插入預計閱讀時間",
				toggle_toc_expanded: "切換目錄顯示狀態",
				jump_to_next_heading: "跳轉至下一標題",
				jump_to_prev_heading: "跳轉至上一標題",
				toggle_all_headings: "切換所有標題折疊狀態",
				scroll_to_top: "滾動到頂部",
				scroll_to_bottom: "滾動到底部",
			},
			editor_menu: {
				insert_toc: "插入目錄",
				insert_reading_time: "插入預計閱讀時間",
			},
			return_button: {
				return_to_cursor: "返回光標位置",
				return_to_top: "返回頂部",
				return_to_bottom: "返回底部",
				jump_to_next_heading: "跳轉至下一個標題",
				jump_to_prev_heading: "跳轉至上一個標題",
			},
			toolbar: {
				toggle_pin: "固定/取消固定",
				toggle_position: "切換位置",
				move_left: "向左移動1px",
				move_right: "向右移動1px",
				copy_toc: "複製目錄",
				expand_all: "展開所有",
				collapse_all: "折疊所有",
			},
			settings: {
				segment: {
					general: "常規設置",
					toc: "目錄",
					progress: "進度",
				},
				showTOC: {
					title: "懸浮目錄",
					description:
						"顯示懸浮目錄；cssclasses使用show-rht-toc或hide-rht-toc可以單獨控制頁面的目錄顯示",
				},
				tocAlwaysExpanded: {
					title: "懸浮目錄始終展開",
					description: "懸浮目錄始終展開，不隨鼠標懸浮狀態變化",
				},
				useHeadingNumber: {
					title: "使用標題編號",
					description:
						"層級編號，根據相對深度計算；cssclasses使用show-rht-heading-number或hide-rht-heading-number可以單獨控制頁面的目錄中標題編號顯示",
				},
				skipH1: {
					title: "忽略h1",
					description: "開啟後，不對h1編號，且只存在h1時不顯示目錄",
				},
				showToolbar: {
					title: "懸浮工具欄",
					description: "使用懸浮工具欄",
				},
				progressStyle: {
					title: "閱讀進度樣式",
					description:
						"閱讀進度樣式，進度條顯示在目錄內部，進度環顯示在目錄上方",
					bar: "進度條",
					ring: "進度環",
					none: "不顯示",
					both: "都顯示",
				},
				position: {
					title: "位置",
					description: "閱讀進度的位置",
					left: "左側",
					right: "右側",
				},
				offset: {
					title: "偏移量",
					description: "閱讀進度與側邊的偏移量，單位為px，默認為12px",
				},
				tocWidth: {
					title: "目錄寬度",
					description: "目錄的寬度，單位為px，默認為240px",
				},
				progressBtn: {
					title: "進度按鈕",
					description: "進度按鈕",
					returnToCursor: {
						title: "返回光標位置",
						description: "是否使用返回光標位置按鈕，自定義圖標",
					},
					returnToTop: {
						title: "返回頂部",
						description: "是否使用返回頂部按鈕，自定義圖標",
					},
					returnToBottom: {
						title: "返回底部",
						description: "是否使用返回底部按鈕，自定義圖標",
					},
					jumpToNextHeading: {
						title: "跳轉至下一標題",
						description: "是否使用跳轉至下一標題按鈕，自定義圖標",
					},
					jumpToPrevHeading: {
						title: "跳轉至上一標題",
						description: "是否使用跳轉至上一標題按鈕，自定義圖標",
					},
				},
				renderMarkdown: {
					title: "渲染Markdown元素",
					description: "是否使用Markdown渲染目錄標題",
				},
			},
			estimatedReadingTime: {
				template: "預計閱讀時間：{{time}}",
				wordCount: "總字數：{{wordCount}}",
				chineseCount: "中文字數：{{chineseCount}}",
				englishCount: "英文字數：{{englishCount}}",
				formatReadingTime: {
					lessThanOneMinute: "小於 1 分鐘",
					lessThanOneHour: "約 {{minutes}} 分鐘",
					moreThanOneHour: "約 {{hours}} 小時 {{minutes}} 分鐘",
				},
			},
		},
	},
};

export default translations;
