import { BaseMessage } from "../types";

const translations: BaseMessage = {
	common: {
		settings: "设置",
		overview: {
			title: "工具包管理",
			description:
				"欢迎使用工具包，查看<a href='https://docs.ravenhogwarts.top/obsidian-ravenhogwarts-toolkit/' target='_blank'>wiki文档</a>了解更多功能",
			version_hint: "继续点击...",
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
		folderTemplates: {
			title: "文件夹模板",
			description: "在指定文件夹下创建新文件时，无感知应用模板",
			settings: {
				templatesFolderPath: {
					title: "模板文件夹路径",
					description:
						"存放模板文件的文件夹路径, 默认与官方模板位置相同",
				},
			},
		},
	},
};

export default translations;
