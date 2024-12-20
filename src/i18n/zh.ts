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
            context_menu: "表格增强编辑"
        },
        frontmatterSorter: {
            title: "文档属性排序",
            description: "自动排序文档属性"
        },
        quickPath: {
            title: "快速路径",
            description: "快速复制文件夹或单(多)文件路径",
            copy_path: "复制路径",
            copy_parent_path: "复制父目录路径",
            no_parent_path: "没有父目录路径",
            copy_folder_path: "复制文件夹路径",
            copy_file_path: "复制文件路径",
            copy_multiple_files_path: "复制多个文件路径",
            copy_success: "路径已复制到剪贴板",
            copy_failed: "复制失败",
            settings: {
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