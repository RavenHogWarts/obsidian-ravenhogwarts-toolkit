import { Message } from "../i18n";

export const en: Message = {
	common: {
		settings: "Settings",
		overview: {
			title: "Toolkit Management",
			description: `Welcome to the toolkit, view <a href="https://ravenhogwarts.github.io/docs/en/obsidian-ravenhogwarts-toolkit" target="_blank">wiki documentation</a> for more features`,
			version_hint: "Keep clicking...",
			auto_update: "Auto Update",
			check_beta: "Receive Beta",
			check_update: "Check Update",
			update_available: "Update Available: {0}",
		},
		general: {
			title: "General Settings",
			menu: {
				useSubMenu: "Use Sub Menu",
			},
		},
		toolkit: {
			title: "Toolkit Settings",
			description:
				"After enabling/disabling the tool, an error may occur, you can try to restart obsidian to solve it",
		},
		developer: {
			title: "Developer Settings",
			description:
				"Leave the page, the developer mode will be closed, and you need to re-enable it",
			logger: {
				level: "Logger Level",
				showTimestamp: "Show Timestamp",
				showLevel: "Show Level",
				console: "Log to Console",
				showNotifications: "Show Notifications",
				noticeTimeout: "Notice Timeout (ms)",
			},
		},
		back: "Back",
		toggle_toolkit: "Toggle Toolkit",
		confirm: "Confirm",
		cancel: "Cancel",
	},
	notice: {
		version_check: "Version check: current={0}, latest={1}, hasUpdate={2}",
		update_success:
			"Plugin updated to {0} version, please restart Obsidian",
		downloading_file: "Downloading file: {0}",
		installing_update: "Installing update...",
		no_update_needed: "No update available",
		checking_update: "Checking update...",
		update_completed: "Update completed",
		update_error: "Update failed",
	},
	toolkit: {
		tableEnhancements: {
			title: "Table Enhancements",
			description: "Better utilization of markdown tables",
			editor_menu: {
				table_enhancements: "Table Enhancements",
			},
			file_menu: {
				table_enhancements: "Table Enhancements",
			},
			command: {
				table_enhancements: "Table Enhancements",
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
				no_table_data: "No table data available",
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
					TIME_EARLIEST:
						"Calculate the earliest date in selected columns",
					TIME_LATEST:
						"Calculate the latest date in selected columns",
					TIME_SPAN:
						"Calculate the span of dates in selected columns",
					time_format: "Date format pattern",
					time_unit: "Unit of time span",
				},
				table_columns: "Table Columns",
				input_placeholder: "Select a function or start typing...",
				function_name: "Formula Functions",
				hint_syntax: "Syntax",
				hint_example: "Example",
				hint_parameters: "Parameters",
				parameter_optional: "Optional",
				parameter_options: "Options",
				insert_option: "Insert",
			},
		},
		frontmatterSorter: {
			title: "Frontmatter Sorter",
			description:
				"Automatically organize and sort document front matter content",
			command: {
				sortCurrentFile: "Sort frontmatter in current file",
				sortAllFiles: "Sort frontmatter in all files",
			},
			file_menu: {
				sort_folder: "Sort frontmatter in the folder",
			},
			notice: {
				ignore_folder: "In ignored folder {0}",
				ignore_pattern: "Match ignored pattern {0}",
				ignore_unknown: "In ignored list",
				sortAllFiles_completed:
					"Processed {0} files, skipped {1} files",
				check_console: "Please check the console for more details",
				file_ignored: "File {0} ignored, reason: {1}",
				file_sorted: "File {0} sorted",
				sort_complete:
					"Frontmatter sorted:\nProcessed {0} files, skipped {1} files",
				sort_details: {
					title: "Frontmatter sorting details:",
					success: "\n {0} files successfully sorted, files:",
					unchanged: "\n {0} files do not need to be sorted, files:",
					skipped: "\n {0} files in ignored rules, files:",
				},
				confirm_sort_all: {
					title: "Confirm Bulk Sort",
					message:
						"This will sort frontmatter in all Markdown files. Do you want to continue?",
				},
				confirm_sort_folder: {
					title: "Confirm Bulk Sort",
					message:
						"This will sort frontmatter in all Markdown files in the folder {0} (excluding subfolders). Do you want to continue?",
				},
			},

			settings: {
				segment: {
					general: "General Settings",
					ignore_rules: "Ignore Rules",
					sort_rules: "Sort Rules",
				},
				sortOnSave: {
					title: "Sort on Save",
					description: "Sort frontmatter on save",
				},
				ignoreFolders: {
					title: "Ignore Folders",
					description: "Ignore specific folders",
					placeholder: "Please enter the folders to ignore",
				},
				ignoreFiles: {
					title: "Ignore Files",
					description: "Ignore specific files",
					placeholder: "Please enter the files to ignore",
				},
				rules: {
					priority: {
						title: "Priority Sorting Group",
						description:
							"Priority sorting keys, sort within the group alphabetically",
						placeholder:
							"Please enter the keys to priority sorting",
					},
					ignoreKeys: {
						title: "Ignore Sorting Group",
						description:
							"Ignore specific keys, keep relative order, placed after all keys to be sorted",
						placeholder: "Please enter the keys to ignore",
					},
					arraySort: {
						title: "Array Sorting",
						description: "Sort array values in frontmatter",
					},
					caseSensitive: {
						title: "Case Sensitive",
						description:
							"When enabled, sorts as AA -> aa -> BB -> bb; otherwise treats cases as equal",
					},
				},
			},
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
					description:
						"Add an option to paste the current file path in the editor menu",
				},
				addFileMenu: {
					title: "Add File List Menu",
					description:
						"Add an option to copy the file/folder path in the file list menu.",
				},
				absolutePath: {
					title: "Absolute Path",
					description:
						"Use absolute path, starting from the root directory of the operating system",
				},
				separator: {
					title: "Separator",
					description: "Separator for multiple paths",
					newline: "Newline",
					comma: "Comma",
					semicolon: "Semicolon",
					space: "Space",
				},
			},
		},
		obReader: {
			title: "OBReader",
			description: "OBReader",
		},
		readingProgress: {
			title: "Table of Contents Navigation",
			description:
				"Display reading progress and table of contents in a floating window",
			command: {
				insert_toc: "Insert TOC",
				insert_reading_time: "Insert Reading Time",
				toggle_toc_expanded: "Toggle TOC Expanded",
				jump_to_next_heading: "Jump to Next Heading",
				jump_to_prev_heading: "Jump to Previous Heading",
				toggle_all_headings: "Toggle All Headings Collapsed",
				scroll_to_top: "Scroll to Top",
				scroll_to_bottom: "Scroll to Bottom",
			},
			editor_menu: {
				insert_toc: "Insert TOC",
				insert_reading_time: "Insert Reading Time",
			},
			return_button: {
				return_to_cursor: "Return to Cursor",
				return_to_top: "Return to Top",
				return_to_bottom: "Return to Bottom",
				jump_to_next_heading: "Jump to Next heading",
				jump_to_prev_heading: "Jump to Previous heading",
			},
			toolbar: {
				toggle_pin: "Toggle Pin",
				toggle_position: "Toggle Position",
				move_left: "Move Left 1px",
				move_right: "Move Right 1px",
				copy_toc: "Copy TOC",
				expand_all: "Expand All",
				collapse_all: "Collapse All",
			},
			settings: {
				segment: {
					general: "General Settings",
					toc: "TOC",
					progress: "Progress",
				},
				showTOC: {
					title: "Show TOC",
					description: "Show  TOC",
				},
				tocAlwaysExpanded: {
					title: "TOC Always Expanded",
					description:
						"TOC always expanded, not affected by mouse hover state",
				},
				useHeadingNumber: {
					title: "Use Heading Number",
					description:
						"Heading number, calculated based on relative depth",
				},
				skipH1: {
					title: "Ignore H1",
					description:
						"After opening, do not number h1, and do not display the table of contents when only h1 exists",
				},

				showToolbar: {
					title: "Toolbar",
					description: "Use toolbar",
				},
				progressStyle: {
					title: "Reading Progress Style",
					description:
						"Reading progress style, progress bar inside the TOC, progress ring above the TOC",
					bar: "Progress Bar",
					ring: "Progress Ring",
					none: "None",
					both: "Both",
				},
				position: {
					title: "Position",
					description: "Reading progress ring position",
					left: "Left",
					right: "Right",
				},
				offset: {
					title: "Offset",
					description:
						"Reading progress ring offset, unit is px, default is 12px",
				},
				tocWidth: {
					title: "TOC Width",
					description: "TOC width, unit is px, default is 240px",
				},
				progressBtn: {
					title: "Progress Button",
					description: "Progress button",
					returnToCursor: {
						title: "Return to Cursor",
						description: "Use return to cursor button, custom icon",
					},
					returnToTop: {
						title: "Return to Top",
						description: "Use return to top button, custom icon",
					},
					returnToBottom: {
						title: "Return to Bottom",
						description: "Use return to bottom button, custom icon",
					},
					jumpToNextHeading: {
						title: "Jump to Next Heading",
						description:
							"Use jump to next heading button, custom icon",
					},
					jumpToPrevHeading: {
						title: "Jump to Previous Heading",
						description:
							"Use jump to previous heading button, custom icon",
					},
				},
				renderMarkdown: {
					title: "Render Markdown Element",
					description: "Whether to use markdown to render the title",
				},
			},
			estimatedReadingTime: {
				template: "Estimated reading time: {{time}}",
				wordCount: "Total words: {0}",
				chineseCount: "Chinese words: {0}",
				englishCount: "English words: {0}",
				formatReadingTime: {
					lessThanOneMinute: "Less than 1 minute",
					lessThanOneHour: "About {0} minutes",
					moreThanOneHour: "About {0} hours {1} minutes",
				},
			},
		},
		codeEditor: {
			title: "Code Editor",
			description: "Edit code files in Obsidian",
			command: {
				createCodeFile: "Create Code File",
			},
			file_menu: {
				openInCodeEditor: "Open in Code Editor",
				createCodeFile: "Create Code File",
			},
			editor_menu: {
				editCodeBlock: "Edit Code Block",
			},
			modal: {
				header: "Create Code File",
				file_type: "File Type",
				file_type_placeholder: "Please select file type",
				file_name: "File Name",
				file_name_placeholder: "Please enter file name",

				file_name_with_extension: "File Name (with Extension)",
				file_name_with_extension_placeholder:
					"Please enter file name (with extension)",
				preview: "Preview",
				open_file_after_creation: "Open file after creation",
				create: "Create",
				cancel: "Cancel",
				edit_code_block: "Edit Code Block",
				save: "Save",
			},
			notice: {
				file_name_validate: "Please enter file name",
				file_name_with_extension_validate:
					"Custom filename must include file extension",
				file_already_exists: "File already exists",
				create_file_success: "File created successfully {0}",
				create_file_failed: "Create file failed {0}",
				no_code_block: "No code block found",
			},
			settings: {
				supportExtensions: {
					title: "Support Extensions",
					description:
						"Register file extensions, click the file to open it directly in the code editor, and restart Obsidian after modification",
				},
				theme: {
					title: "Theme",
					description: "Code editor theme",
				},
				lineNumbers: {
					title: "Line Numbers",
					description: "Show line numbers",
				},
				minimap: {
					title: "Minimap",
					description: "Show code minimap",
				},
				fontSize: {
					title: "Font Size",
					description: "Code editor font size",
				},
				fontFamily: {
					title: "Font",
					description: "Code editor font",
				},
				tabSize: {
					title: "Tab Size",
					description: "Tab size",
				},
				lineHeight: {
					title: "Line Height",
					description: "Code editor line height",
				},
				letterSpacing: {
					title: "Letter Spacing",
					description: "Code editor letter spacing",
				},
			},
		},
	},
};
