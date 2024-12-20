import { Message } from "./i18n";

export const en: Message = {
    common: {
        settings: "Settings",
        overview: {
            title: "Toolkit Management",
            description: "Start/Stop Toolkit, Manage Specific Configurations"
        },
        back: "Back",
        toggle_toolkit: "Toggle Toolkit"
    },
    toolkit: {
        tableEnhancements: {
            title: "Table Enhancements",
            description: "Table Enhancements",
            context_menu: "Table Enhancements"
        },
        frontmatterSorter: {
            title: "Frontmatter Sorter",
            description: "Auto sort frontmatter"
        },
        quickPath: {
            title: "Quick Path",
            description: "Quickly copy folder or single(multiple) file path",
            copy_path: "Copy Path",
            copy_parent_path: "Copy Parent Path",
            no_parent_path: "No Parent Path",
            copy_folder_path: "Copy Folder Path",
            copy_file_path: "Copy File Path",
            copy_multiple_files_path: "Copy Multiple Files Path",
            copy_success: "Copied to clipboard",
            copy_failed: "Copy Failed",
            settings: {
                absolutePath: {
                    title: "Absolute Path",
                    description: "Use absolute path, starting from the root directory of the operating system"
                },
                separator: {
                    title: "Separator",
                    description: "Separator for multiple paths",
                    newline: "Newline",
                    comma: "Comma",
                    semicolon: "Semicolon",
                    space: "Space"
                }
            }
        }
    }
}