import { Message } from "../i18n";

export const zh: Message = {
    common: {
        settings: "设置",
        overview: {
            title: "工具包管理",
            description: "启停工具包，管理具体配置"
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
                noticeTimeout: "通知消失时间(ms)"
            }
        },
        back: "返回",
        toggle_toolkit: "启用/禁用工具包",
        confirm: "确认",
        cancel: "取消"
    },
    toolkit: {
        tableEnhancements: {
            title: "表格增强",
            description: "增强表格编辑，支持计算和格式化",
            editor_menu: {
                table_enhancements: "表格增强编辑"
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
                no_table_data: "没有表格数据"
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
                    PERCENTAGE: "计算选定列数值百分比",
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
                insert_option: "插入"
            }
        },
        frontmatterSorter: {
            title: "文档属性排序",
            description: "使用自定义规则自动排序文档属性",
            command: {
                sortCurrentFile: "排序当前文件",
                sortAllFiles: "排序所有文件"
            },
            notice: {
                ignore_folder: "在忽略文件夹 {0} 中",
                ignore_pattern: "匹配忽略规则 {0}",
                ignore_unknown: "在忽略列表中",
                sortAllFiles_completed: "已处理 {0} 个文件，已跳过 {1} 个文件",
                check_console: "请检查控制台以获取更多详细信息",
                file_ignored: "文件 {0} 被忽略，原因：{1}",
                file_sorted: "文件 {0} 已排序",
                sort_complete: "前置元数据排序完成：\n已处理 {0} 个文件，已跳过 {1} 个文件",
                sort_details: "前置元数据排序详细信息：\n已处理 {0} 个文件，已跳过 {1} 个文件\n跳过的文件：\n  {2}",
                confirm_sort_all: {
                    title: "批量排序确认",
                    message: "此操作将对所有 Markdown 文件的文档属性进行排序，是否继续？"
                }
            },
            settings: {
                sortOnSave: {
                    title: "保存时排序",
                    description: "保存文件时自动排序文档属性"
                },
                ignoreFolders: {
                    title: "忽略文件夹",
                    description: "忽略特定文件夹中的文档属性",
                    placeholder: "请输入忽略的文件夹"
                },
                ignoreFiles: {
                    title: "忽略文件",
                    description: "忽略特定文件中的文档属性",
                    placeholder: "请输入忽略的文件"
                },
                rules: {
                    title: "排序规则",
                    description: "配置排序行为和顺序",
                    priority: {
                        title: "优先排序组",
                        description: "优先排序的文档属性组，组内按字母排序",
                        placeholder: "请输入优先排序的文档属性"
                    },
                    ignoreKeys: {
                        title: "忽略排序组",
                        description: "忽略的文档属性组，组内保持原始相对顺序，放置在末尾",
                        placeholder: "请输入忽略的文档属性"
                    },
                    arraySort: {
                        title: "数组排序",
                        description: "对数组类型的文档属性中的值进行字母排序"
                    },
                    caseSensitive: {
                        title: "大小写敏感",
                        description: "启用后按 AA -> aa -> BB -> bb 排序，禁用则视为相同字母"
                    }
                }
            }
        },
        quickPath: {
            title: "快速路径",
            description: "快速复制文件夹或单(多)文件路径",
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
                    description: "在编辑器菜单中添加粘贴当前文件路径的选项"
                },
                absolutePath: {
                    title: "绝对路径",
                    description: "使用绝对路径，即从操作系统根目录开始的路径"
                },
                separator: {
                    title: "分隔符",
                    description: "多个路径的分隔符",
                    newline: "换行",
                    comma: "逗号",
                    semicolon: "分号",
                    space: "空格"
                }
            }
        },
        obReader: {
            title: "OBReader",
            description: "OBReader"
        },
        customIcons: {
            title: "自定义图标",
            description: "自定义图标"
        }
    }
}