import { Message } from "./i18n";

export const zh: Message = {
    common: {
        settings: "设置",
        overview: {
            title: "工具包管理",
            description: "启停工具包，管理具体配置"
        },
        back: "返回",
        toggle_toolkit: "启用/禁用工具包"
    },
    toolkit: {
        tableEnhancements: {
            title: "表格增强编辑",
            description: "表格增强编辑",
            editor_menu: {
                table_enhancements: "表格增强编辑"
            }
        },
        frontmatterSorter: {
            title: "文档属性排序",
            description: "自动排序文档属性",
            settings: {
                sortOnSave: {
                    title: "保存时排序",
                    description: "保存时自动排序文档属性"
                },
                ignoreFolders: {
                    title: "忽略文件夹",
                    description: "忽略特定文件夹中的文档属性"
                },
                ignoreFiles: {
                    title: "忽略文件",
                    description: "忽略特定文件中的文档属性"
                },
                rules: {
                    title: "排序规则",
                    description: "自定义排序规则",
                    priority: {
                        title: "优先排序",
                        description: "优先排序的文档属性"
                    },
                    customOrder: {
                        title: "自定义排序",
                        description: "自定义排序的文档属性"
                    },
                    ignoreKeys: {
                        title: "忽略键",
                        description: "忽略的文档属性"
                    },
                    arraySort: {
                        title: "数组排序",
                        description: "是否对数组类型的值进行排序"
                    },
                    caseSensitive: {
                        title: "区分大小写",
                        description: "英文字母大小写是否敏感"
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
        }
    }
}