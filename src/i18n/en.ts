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
            description: "Auto sort frontmatter",
            command: {
                sortCurrentFile: "Sort frontmatter in current file",
                sortAllFiles: "Sort frontmatter in all files"
            },
            notice: {
                ignore_folder: "In ignored folder {0}",
                ignore_pattern: "Match ignored pattern {0}",
                ignore_unknown: "In ignored list",
                sortAllFiles_completed: "Processed {0} files, skipped {1} files",
                check_console: "Please check the console for more details",
                file_ignored: "File {0} ignored, reason: {1}",
                file_sorted: "File {0} sorted",
                sort_complete: "Frontmatter sorted:\nProcessed {0} files, skipped {1} files",
                sort_details: "Frontmatter sorting details:\nProcessed {0} files, skipped {1} files\nSkipped files:\n  {2}"
            },

            settings: {
                sortOnSave: {
                    title: "Sort on Save",
                    description: "Sort frontmatter on save"
                },
                ignoreFolders: {
                    title: "Ignore Folders",
                    description: "Ignore specific folders",
                    placeholder: "Please enter the folders to ignore"
                },
                ignoreFiles: {
                    title: "Ignore Files",
                    description: "Ignore specific files",
                    placeholder: "Please enter the files to ignore"
                },
                rules: {
                    title: "Sorting Rules",
                    description: "Custom sorting rules",
                    priority: {
                        title: "Priority Sorting",
                        description: "Priority sorting keys",
                        placeholder: "Please enter the keys to priority sorting"
                    },
                    customOrder: {
                        title: "Custom Sorting",
                        description: "Custom sorting keys"
                    },
                    ignoreKeys: {
                        title: "Ignore Keys",
                        description: "Ignore keys",
                        placeholder: "Please enter the keys to ignore"
                    },
                    arraySort: {
                        title: "Array Sorting",
                        description: "Sort array values in frontmatter"
                    },
                    caseSensitive: {
                        title: "Case Sensitive",
                        description: "Case sensitive for English letters"
                    }
                }

            }
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