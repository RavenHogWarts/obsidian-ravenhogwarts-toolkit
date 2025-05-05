import { BaseMessage } from "../types";

const translations: BaseMessage = {
	common: {
		settings: "设置",
		overview: {
			title: "工具包管理",
			description:
				"欢迎使用工具包，查看<a href='https://ravenhogwarts.github.io/docs/zh/obsidian-ravenhogwarts-toolkit' target='_blank'>wiki文档</a>了解更多功能",
			version_hint: "继续点击...",
			auto_update: "自动更新",
			check_beta: "接收Beta",
			check_update: "检查更新",
		},
		general: {
			title: "常规设置",
			menu: {
				useSubMenu: "使用子菜单",
			},
		},
		toolkit: {
			title: "工具设置",
			description: "工具启用/禁止后发生报错，可以尝试重启obsidian解决",
		},
		developer: {
			title: "开发者设置",
			description: "离开页面，将关闭开发者模式，需要重新启用",
			logger: {
				level: "日志级别",
				showTimestamp: "日志显示时间戳",
				showLevel: "日志显示级别",
				console: "日志输出到控制台",
				showNotifications: "显示通知",
				noticeTimeout: "通知消失时间(ms)",
			},
		},
		back: "返回",
		toggle_toolkit: "启用/禁用工具包",
		confirm: "确认",
		cancel: "取消",
	},
	notice: {
		update_success: "插件更新到 {{latestVersion}} 版本，请重启 Obsidian",
		downloading_file: "正在下载文件: {{fileName}}",
		installing_update: "正在安装更新...",
		no_update_needed: "无可用更新",
		checking_update: "正在检查更新...",
		update_completed: "更新完成",
		update_error: "更新失败",
	},
	toolkit: {
		tableEnhancements: {
			title: "表格增强",
			description: "更好的利用markdown表格",
			editor_menu: {
				table_enhancements: "表格增强编辑",
			},
			file_menu: {
				table_enhancements: "表格增强编辑",
			},
			command: {
				table_enhancements: "表格增强编辑",
			},
			formula: {
				output_type: "输出类型",
				output_value: "输出值",
				add_calculation: "添加公式计算",
				execute_all: "执行当前表格所有公式",
				cancel: "取消",
				update: "更新",
				add: "添加",
				hide_calculator: "隐藏公式编辑",
				show_calculator: "显示公式编辑",
				edit_calculation: "编辑公式",
				remove_calculation: "删除公式",
				execute_calculation: "执行公式",
				edit_table: "编辑表格",
				save_changes: "保存更改",
				no_table_data: "没有表格数据",
			},
			formula_editor: {
				math: {
					COUNT: "计算选定列数量",
					count_modifier: "计数类型",
					SUM: "计算选定列数值总和",
					AVERAGE: "计算选定列数值平均值",
					MIN: "计算选定列数值最小值",
					MAX: "计算选定列数值最大值",
					MEDIAN: "计算选定列数值中位数",
					MODE: "计算选定列数值众数",
					STDDEV: "计算选定列数值标准差",
					VARIANCE: "计算选定列数值方差",
				},
				time: {
					TIME_EARLIEST: "计算选定列最早日期",
					TIME_LATEST: "计算选定列最晚日期",
					TIME_SPAN: "计算选定列日期跨度",
					time_format: "日期格式",
					time_unit: "时间单位",
				},
				table_columns: "表格列",
				input_placeholder: "选择一个函数或开始输入...",
				function_name: "公式函数",
				hint_syntax: "语法",
				hint_example: "示例",
				hint_parameters: "参数",
				parameter_optional: "可选",
				parameter_options: "选项",
				insert_option: "插入",
			},
		},
		frontmatterSorter: {
			title: "文档属性排序",
			description: "自动整理和排序文档的文档属性内容",
			command: {
				sortCurrentFile: "排序当前文件",
				sortAllFiles: "排序所有文件",
			},
			file_menu: {
				sort_folder: "排序文件夹内文档属性",
			},
			notice: {
				ignore_folder: "在忽略文件夹 {{ignoredFolder}} 中",
				ignore_pattern: "匹配忽略规则 {{ignoredPattern}}",
				ignore_unknown: "在忽略列表中",
				check_console: "请检查控制台以获取更多详细信息",
				file_ignored: "文件 {{filePath}} 被忽略，原因：{{reason}}",
				file_sorted: "文件 {{filePath}} 已排序",
				sort_complete:
					"前置元数据排序完成：\n已处理 {{processedFiles}} 个文件，已跳过 {{skippedFiles}} 个文件",
				sort_details: {
					title: "前置元数据排序详细信息：",
					success: "\n {{successFiles}} 个文件成功排序，文件：",
					unchanged: "\n {{unchangedFiles}} 个文件无须排序，文件：",
					skipped: "\n {{skippedFiles}} 个文件在忽略规则中，文件：",
				},
				confirm_sort_all: {
					title: "批量排序确认",
					message:
						"此操作将对所有 Markdown 文件的文档属性进行排序，是否继续？",
				},
				confirm_sort_folder: {
					title: "批量排序确认",
					message:
						"此操作将对文件夹中 {{folderPath}} (不包括子文件夹)的所有 Markdown 文件的文档属性进行排序，是否继续？",
				},
			},
			settings: {
				segment: {
					general: "常规设置",
					ignore_rules: "忽略规则",
					sort_rules: "排序规则",
				},
				sortOnSave: {
					title: "保存时排序",
					description: "保存文件时自动排序文档属性",
				},
				ignoreFolders: {
					title: "忽略文件夹",
					description: "忽略特定文件夹中的文档属性",
					placeholder: "请输入忽略的文件夹",
				},
				ignoreFiles: {
					title: "忽略文件",
					description: "忽略特定文件中的文档属性",
					placeholder: "请输入忽略的文件",
				},
				rules: {
					priority: {
						title: "优先排序组",
						description: "优先排序的文档属性组，组内按字母排序",
						placeholder: "请输入优先排序的文档属性",
					},
					ignoreKeys: {
						title: "忽略排序组",
						description:
							"忽略的文档属性组，组内保持原始相对顺序，放置在末尾",
						placeholder: "请输入忽略的文档属性",
					},
					arraySort: {
						title: "数组排序",
						description: "对数组类型的文档属性中的值进行字母排序",
					},
					caseSensitive: {
						title: "大小写敏感",
						description:
							"启用后按 AA -> aa -> BB -> bb 排序，禁用则视为相同字母",
					},
				},
			},
		},
		quickPath: {
			title: "快速路径",
			description: "快速获取指定文件/文件夹的路径",
			editor_menu: {
				paste_filePath: "粘贴文件路径",
				paste_folderPath: "粘贴文件夹路径",
			},
			file_menu: {
				copy_filePath: "复制文件路径",
				copy_folderPath: "复制文件夹路径",
				copy_filesPath: "复制文件路径(多文件)",
			},
			command: {
				copy_filePath: "复制文件路径",
				copy_folderPath: "复制文件夹路径",
			},
			status: {
				copy_success: "路径已复制到剪贴板",
				copy_failed: "复制失败",
				no_parent_path: "根目录文件没有父目录",
			},
			settings: {
				addEditorMenu: {
					title: "添加编辑器菜单",
					description: "在编辑器菜单中添加粘贴当前文件路径的选项",
				},
				addFileMenu: {
					title: "添加文件列表菜单",
					description:
						"在文件列表菜单中添加复制文件/文件夹路径的选项",
				},
				absolutePath: {
					title: "绝对路径",
					description: "使用绝对路径，即从操作系统根目录开始的路径",
				},
				separator: {
					title: "分隔符",
					description: "多个路径的分隔符",
					newline: "换行",
					comma: "逗号",
					semicolon: "分号",
					space: "空格",
				},
			},
		},
		obReader: {
			title: "OBReader",
			description: "OBReader",
		},
		readingProgress: {
			title: "目录导航",
			description: "悬浮显示当前文档的阅读进度，目录等",
			command: {
				insert_toc: "插入目录",
				insert_reading_time: "插入预计阅读时间",
				toggle_toc_expanded: "切换目录显示状态",
				jump_to_next_heading: "跳转至下一标题",
				jump_to_prev_heading: "跳转至上一标题",
				toggle_all_headings: "切换所有标题折叠状态",
				scroll_to_top: "滚动到顶部",
				scroll_to_bottom: "滚动到底部",
			},
			editor_menu: {
				insert_toc: "插入目录",
				insert_reading_time: "插入预计阅读时间",
			},
			return_button: {
				return_to_cursor: "返回光标位置",
				return_to_top: "返回顶部",
				return_to_bottom: "返回底部",
				jump_to_next_heading: "跳转至下一个标题",
				jump_to_prev_heading: "跳转至上一个标题",
			},
			toolbar: {
				toggle_pin: "固定/取消固定",
				toggle_position: "切换位置",
				move_left: "向左移动1px",
				move_right: "向右移动1px",
				copy_toc: "复制目录",
				expand_all: "展开所有",
				collapse_all: "折叠所有",
			},
			settings: {
				segment: {
					general: "常规设置",
					toc: "目录",
					progress: "进度",
				},
				showTOC: {
					title: "悬浮目录",
					description:
						"显示悬浮目录；cssclasses使用show-rht-toc或hide-rht-toc可以单独控制页面的目录显示",
				},
				tocAlwaysExpanded: {
					title: "悬浮目录始终展开",
					description: "悬浮目录始终展开，不随鼠标悬浮状态变化",
				},
				useHeadingNumber: {
					title: "使用标题编号",
					description:
						"层级编号，根据相对深度计算；cssclasses使用show-rht-heading-number或hide-rht-heading-number可以单独控制页面的目录中标题编号显示",
				},
				skipH1: {
					title: "忽略h1",
					description: "开启后，不对h1编号，且只存在h1时不显示目录",
				},
				showToolbar: {
					title: "悬浮工具栏",
					description: "使用悬浮工具栏",
				},
				progressStyle: {
					title: "阅读进度样式",
					description:
						"阅读进度样式，进度条显示在目录内部，进度环显示在目录上方",
					bar: "进度条",
					ring: "进度环",
					none: "不显示",
					both: "都显示",
				},
				position: {
					title: "位置",
					description: "阅读进度的位置",
					left: "左侧",
					right: "右侧",
				},
				offset: {
					title: "偏移量",
					description: "阅读进度与侧边的偏移量，单位为px，默认为12px",
				},
				tocWidth: {
					title: "目录宽度",
					description: "目录的宽度，单位为px，默认为240px",
				},
				progressBtn: {
					title: "进度按钮",
					description: "进度按钮",
					returnToCursor: {
						title: "返回光标位置",
						description: "是否使用返回光标位置按钮，自定义图标",
					},
					returnToTop: {
						title: "返回顶部",
						description: "是否使用返回顶部按钮，自定义图标",
					},
					returnToBottom: {
						title: "返回底部",
						description: "是否使用返回底部按钮，自定义图标",
					},
					jumpToNextHeading: {
						title: "跳转至下一标题",
						description: "是否使用跳转至下一标题按钮，自定义图标",
					},
					jumpToPrevHeading: {
						title: "跳转至上一标题",
						description: "是否使用跳转至上一标题按钮，自定义图标",
					},
				},
				renderMarkdown: {
					title: "渲染Markdown元素",
					description: "是否使用Markdown渲染目录标题",
				},
			},
			estimatedReadingTime: {
				template: "预计阅读时间：{{time}}",
				wordCount: "总字数：{{wordCount}}",
				chineseCount: "中文字数：{{chineseCount}}",
				englishCount: "英文字数：{{englishCount}}",
				formatReadingTime: {
					lessThanOneMinute: "小于 1 分钟",
					lessThanOneHour: "约 {{minutes}} 分钟",
					moreThanOneHour: "约 {{hours}} 小时 {{minutes}} 分钟",
				},
			},
		},
	},
};

export default translations;
