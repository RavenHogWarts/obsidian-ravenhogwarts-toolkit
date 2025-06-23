import { BaseMessage } from "../types";

const translations: BaseMessage = {
	common: {
		settings: "Settings",
		overview: {
			title: "Toolkit Management",
			description:
				"Welcome to the toolkit, check out the <a href='https://docs.ravenhogwarts.top/obsidian-ravenhogwarts-toolkit/' target='_blank'>wiki documentation</a> to learn more about its features",
			version_hint: "Continue clicking...",
		},
		general: {
			title: "General Settings",
			menu: {
				useSubMenu: "Use Submenu",
			},
		},
		toolkit: {
			title: "Tool Settings",
			description:
				"If errors occur after enabling/disabling tools, try restarting Obsidian to resolve them",
		},
		developer: {
			title: "Developer Settings",
			description:
				"Developer mode will be turned off when leaving the page, and needs to be re-enabled",
			logger: {
				level: "Log Level",
				showTimestamp: "Show Timestamp in Logs",
				showLevel: "Show Level in Logs",
				console: "Output Logs to Console",
				showNotifications: "Show Notifications",
				noticeTimeout: "Notification Timeout (ms)",
			},
		},
		back: "Back",
		toggle_toolkit: "Enable/Disable Toolkit",
		confirm: "Confirm",
		cancel: "Cancel",
	},
	notice: {
		update_success:
			"Plugin updated to version {{latestVersion}}, please restart Obsidian",
		downloading_file: "Downloading file: {{fileName}}",
		installing_update: "Installing update...",
		no_update_needed: "No updates available",
		checking_update: "Checking for updates...",
		update_completed: "Update completed",
		update_error: "Update failed",
	},
	toolkit: {
		tableEnhancements: {
			title: "Table Enhancements",
			description: "Better utilize markdown tables",
			editor_menu: {
				table_enhancements: "Table Enhancement Editor",
			},
			file_menu: {
				table_enhancements: "Table Enhancement Editor",
			},
			command: {
				table_enhancements: "Table Enhancement Editor",
			},
			formula: {
				output_type: "Output Type",
				output_value: "Output Value",
				add_calculation: "Add Formula Calculation",
				execute_all: "Execute All Formulas in Current Table",
				cancel: "Cancel",
				update: "Update",
				add: "Add",
				hide_calculator: "Hide Formula Editor",
				show_calculator: "Show Formula Editor",
				edit_calculation: "Edit Formula",
				remove_calculation: "Delete Formula",
				execute_calculation: "Execute Formula",
				edit_table: "Edit Table",
				save_changes: "Save Changes",
				no_table_data: "No table data",
			},
			formula_editor: {
				math: {
					COUNT: "Count items in selected column",
					count_modifier: "Count type",
					SUM: "Calculate sum of values in selected column",
					AVERAGE: "Calculate average of values in selected column",
					MIN: "Find minimum value in selected column",
					MAX: "Find maximum value in selected column",
					MEDIAN: "Calculate median of values in selected column",
					MODE: "Calculate mode of values in selected column",
					STDDEV: "Calculate standard deviation of values in selected column",
					VARIANCE: "Calculate variance of values in selected column",
				},
				time: {
					TIME_EARLIEST: "Find earliest date in selected column",
					TIME_LATEST: "Find latest date in selected column",
					TIME_SPAN: "Calculate date span in selected column",
					time_format: "Date format",
					time_unit: "Time unit",
				},
				table_columns: "Table Columns",
				input_placeholder: "Select a function or start typing...",
				function_name: "Formula Function",
				hint_syntax: "Syntax",
				hint_example: "Example",
				hint_parameters: "Parameters",
				parameter_optional: "Optional",
				parameter_options: "Options",
				insert_option: "Insert",
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
				copy_filePath: "Copy File Path",
				copy_folderPath: "Copy Folder Path",
				copy_filesPath: "Copy File Paths (Multiple Files)",
			},
			command: {
				copy_filePath: "Copy File Path",
				copy_folderPath: "Copy Folder Path",
			},
			status: {
				copy_success: "Path copied to clipboard",
				copy_failed: "Copy failed",
				no_parent_path: "Root directory files have no parent directory",
			},
			settings: {
				addEditorMenu: {
					title: "Add Editor Menu",
					description:
						"Add option to paste current file path in editor menu",
				},
				addFileMenu: {
					title: "Add File List Menu",
					description:
						"Add option to copy file/folder path in file list menu",
				},
				absolutePath: {
					title: "Absolute Path",
					description:
						"Use absolute path, starting from operating system root directory",
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
		readingProgress: {
			title: "TOC Navigation",
			description:
				"Floating display of current document's reading progress, table of contents, etc.",
			command: {
				insert_toc: "Insert Table of Contents",
				insert_reading_time: "Insert Estimated Reading Time",
				toggle_toc_expanded: "Toggle TOC Display State",
				jump_to_next_heading: "Jump to Next Heading",
				jump_to_prev_heading: "Jump to Previous Heading",
				toggle_all_headings: "Toggle All Headings Collapse State",
				scroll_to_top: "Scroll to Top",
				scroll_to_bottom: "Scroll to Bottom",
			},
			editor_menu: {
				insert_toc: "Insert Table of Contents",
				insert_reading_time: "Insert Estimated Reading Time",
			},
			return_button: {
				return_to_cursor: "Return to Cursor Position",
				return_to_top: "Return to Top",
				return_to_bottom: "Return to Bottom",
				jump_to_next_heading: "Jump to Next Heading",
				jump_to_prev_heading: "Jump to Previous Heading",
			},
			toolbar: {
				toggle_pin: "Pin/Unpin",
				toggle_position: "Toggle Position",
				move_left: "Move Left 1px",
				move_right: "Move Right 1px",
				copy_toc: "Copy Table of Contents",
				expand_all: "Expand All",
				collapse_all: "Collapse All",
			},
			settings: {
				segment: {
					general: "General Settings",
					toc: "Table of Contents",
					progress: "Progress",
				},
				showTOC: {
					title: "Floating TOC",
					description:
						"Display floating table of contents; use cssclasses show-rht-toc or hide-rht-toc to control TOC display for individual pages",
				},
				tocAlwaysExpanded: {
					title: "Always Expand Floating TOC",
					description:
						"Floating TOC always expanded, not changing with mouse hover state",
				},
				useHeadingNumber: {
					title: "Use Heading Numbers",
					description:
						"Hierarchical numbering, calculated based on relative depth; use cssclasses show-rht-heading-number or hide-rht-heading-number to control heading number display in TOC for individual pages",
				},
				skipH1: {
					title: "Skip H1",
					description:
						"When enabled, H1 is not numbered, and TOC is not displayed when only H1 exists",
				},
				showToolbar: {
					title: "Floating Toolbar",
					description: "Use floating toolbar",
				},
				progressStyle: {
					title: "Reading Progress Style",
					description:
						"Reading progress style, progress bar displays inside TOC, progress ring displays above TOC",
					bar: "Progress Bar",
					ring: "Progress Ring",
					none: "Don't Show",
					both: "Show Both",
				},
				position: {
					title: "Position",
					description: "Position of reading progress",
					left: "Left",
					right: "Right",
				},
				offset: {
					title: "Offset",
					description:
						"Offset of reading progress from the side, in px, default is 12px",
				},
				tocWidth: {
					title: "TOC Width",
					description:
						"Width of table of contents, in px, default is 240px",
				},
				progressBtn: {
					title: "Progress Buttons",
					description: "Progress buttons",
					returnToCursor: {
						title: "Return to Cursor Position",
						description:
							"Whether to use return to cursor position button, customize icon",
					},
					returnToTop: {
						title: "Return to Top",
						description:
							"Whether to use return to top button, customize icon",
					},
					returnToBottom: {
						title: "Return to Bottom",
						description:
							"Whether to use return to bottom button, customize icon",
					},
					jumpToNextHeading: {
						title: "Jump to Next Heading",
						description:
							"Whether to use jump to next heading button, customize icon",
					},
					jumpToPrevHeading: {
						title: "Jump to Previous Heading",
						description:
							"Whether to use jump to previous heading button, customize icon",
					},
				},
				renderMarkdown: {
					title: "Render Markdown Elements",
					description:
						"Whether to use Markdown rendering for TOC headings",
				},
			},
			estimatedReadingTime: {
				template: "Estimated reading time: {{time}}",
				wordCount: "Total word count: {{wordCount}}",
				chineseCount: "Chinese character count: {{chineseCount}}",
				englishCount: "English word count: {{englishCount}}",
				formatReadingTime: {
					lessThanOneMinute: "Less than 1 minute",
					lessThanOneHour: "About {{minutes}} minutes",
					moreThanOneHour:
						"About {{hours}} hours {{minutes}} minutes",
				},
			},
		},
	},
};

export default translations;
