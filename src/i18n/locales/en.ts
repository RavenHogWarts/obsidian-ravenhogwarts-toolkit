import { Message } from "../i18n";

export const en: Message = {
    common: {
        settings: "Settings",
        overview: {
            title: "Toolkit Management",
            description: `Welcome to the toolkit, view <a href="https://ravenhogwarts.github.io/docs/en/obsidian-ravenhogwarts-toolkit" target="_blank">wiki documentation</a> for more features`
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
            description: "Better utilization of markdown tables",
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
            description: "Automatically organize and sort document front matter content",
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
            description: "Quickly get the path of specified files/folders",
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
        readingProgress: {
            title: "Reading Progress",
            description: "Display reading progress and table of contents in a floating window",
            return_button: {
                return_to_cursor: "Return to Cursor",
                return_to_top: "Return to Top",
                return_to_bottom: "Return to Bottom"
            },
            progress_indicator: {
                reading_time: "Estimated reading time {0} minutes"
            },
            toolbar: {
                toggle_pin: "Toggle Pin",
                toggle_position: "Toggle Position",
                move_left: "Move Left 1px",
                move_right: "Move Right 1px",
                copy_toc: "Copy TOC"
            },
            settings: {
                showTOC: {
                    title: "Show TOC",
                    description: "Show  TOC"
                },
                tocAlwaysExpanded: {
                    title: "TOC Always Expanded",
                    description: "TOC always expanded, not affected by mouse hover state"
                },
                showProgress: {
                    title: "Show Progress",
                    description: "Show Progress"
                },
                showReadingTime: {
                    title: "Show Reading Time",
                    description: "Show estimated reading time, assume English reading speed is 200 words/minute, Chinese reading speed is 300 words/minute, the statistics of file content excludes front matter"
                },
                position: {
                    title: "Position",
                    description: "Reading progress bar position",
                    left: "Left",
                    right: "Right"
                },
                offset: {
                    title: "Offset",
                    description: "Reading progress bar offset, unit is px, default is 12px"
                },
                tocWidth: {
                    title: "TOC Width",
                    description: "TOC width, unit is px, default is 240px"
                }
            }
        }
    }
}