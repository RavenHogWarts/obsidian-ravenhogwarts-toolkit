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
            editor_menu: {
                table_enhancements: "Table Enhancements"
            }
        },
        frontmatterSorter: {
            title: "Frontmatter Sorter",
            description: "Auto sort frontmatter"
        },
        quickPath: {
            title: "Quick Path",
            description: "Quickly copy folder or single(multiple) file path",
            editor_menu: {
                paste_filePath: "Paste File Path",
                paste_folderPath: "Paste Folder Path",
            },
            file_menu: {
                copy_folderPath: "Copy Folder Path",
                copy_filePath: "Copy File Path",
                copy_filesPath: "Copy Multiple Files Path",
            },
            command: {
                copy_filePath: "Copy File Path",
                copy_folderPath: "Copy Folder Path",
            },
            status: {
                copy_success: "Copied to clipboard",
                copy_failed: "Copy Failed",
                no_parent_path: "Root directory file has no parent directory",
            },
            settings: {
                addEditorMenu: {
                    title: "Add Editor Menu",
                    description: "Add an option to paste the current file path in the editor menu"
                },
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