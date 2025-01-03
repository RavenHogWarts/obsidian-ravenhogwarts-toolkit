import { Message } from "../i18n";

export const en: Message = {
    common: {
        settings: "Settings",
        overview: {
            title: "Toolkit Management",
            description: "Start/Stop Toolkit, Manage Specific Configurations"
        },
        developer: {
            title: "Developer Settings",
            description: "Leave the page, the developer mode will be closed, and you need to re-enable it",
            logger: {
                level: "Logger Level",
                showTimestamp: "Show Timestamp",
                showLevel: "Show Level",
                console: "Log to Console",
                showNotifications: "Show Notifications",
                noticeTimeout: "Notice Timeout (ms)"
            }
        },
        back: "Back",
        toggle_toolkit: "Toggle Toolkit",
        confirm: "Confirm",
        cancel: "Cancel"
    },
    toolkit: {
        tableEnhancements: {
            title: "Table Enhancements",
            description: "Table Enhancements",
            editor_menu: {
                table_enhancements: "Table Enhancements"
            },
            formula: {
                output_type: "Output Type",
                output_value: "Output Value",
                add_calculation: "Add Calculation",
                execute_all: "Execute All",
                cancel: "Cancel",
                update: "Update",
                add: "Add",
                hide_calculator: "Hide Calculator",
                show_calculator: "Show Calculator",
                edit_calculation: "Edit Calculation",
                remove_calculation: "Remove Calculation",
                execute_calculation: "Execute Calculation",
                edit_table: "Edit Table",
                save_changes: "Save Changes",
                no_table_data: "No table data available"
            },
            formula_editor: {
                math: {
                    COUNT: "Count values in selected columns",
                    count_modifier: "Type of counting",
                    SUM: "Sum up values in selected columns",
                    AVERAGE: "Calculate average of values",
                    MIN: "Calculate the minimum value in selected columns",
                    MAX: "Calculate the maximum value in selected columns",
                    MEDIAN: "Calculate the median value in selected columns",
                    MODE: "Calculate the mode value in selected columns",
                    STDDEV: "Calculate standard deviation of values",
                    VARIANCE: "Calculate variance of values",
                    PERCENTAGE: "Calculate percentage of values",
                },
                time: {
                    TIME_EARLIEST: "Calculate the earliest date in selected columns",
                    TIME_LATEST: "Calculate the latest date in selected columns",
                    TIME_SPAN: "Calculate the span of dates in selected columns",
                    time_format: "Date format pattern",
                    time_unit: "Unit of time span"
                },
                table_columns: "Table Columns",
                input_placeholder: "Select a function or start typing...",
                function_name: "Formula Functions",
                hint_syntax: "Syntax",
                hint_example: "Example",
                hint_parameters: "Parameters",
                parameter_optional: "Optional",
                parameter_options: "Options",
                insert_option: "Insert"
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
                sort_details: "Frontmatter sorting details:\nProcessed {0} files, skipped {1} files\nSkipped files:\n  {2}",
                confirm_sort_all: {
                    title: "Confirm Bulk Sort",
                    message: "This will sort frontmatter in all Markdown files. Do you want to continue?"
                }
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
                        title: "Priority Sorting Group",
                        description: "Priority sorting keys, sort within the group alphabetically",
                        placeholder: "Please enter the keys to priority sorting"
                    },
                    ignoreKeys: {
                        title: "Ignore Sorting Group",
                        description: "Ignore specific keys, keep relative order, placed after all keys to be sorted",
                        placeholder: "Please enter the keys to ignore"
                    },
                    arraySort: {
                        title: "Array Sorting",
                        description: "Sort array values in frontmatter"
                    },
                    caseSensitive: {
                        title: "Case Sensitive",
                        description: "When enabled, sorts as AA -> aa -> BB -> bb; otherwise treats cases as equal"
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
        },
        obReader: {
            title: "OBReader",
            description: "OBReader"
        },
        customIcons: {
            title: "Custom Icons",
            description: "Custom icons"
        }
    }
}