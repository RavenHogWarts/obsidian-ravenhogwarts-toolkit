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
		folderTemplates: {
			title: "Folder Templates",
			description:
				"Automatically apply templates when creating new files in specified folders",
			settings: {
				templatesFolderPath: {
					title: "Templates Folder Path",
					description:
						"Path to the folder where template files are stored, defaults to the official template location",
					placeholder: "Please enable core Templates plugin",
					enablePlugin: "Please enable core Templates plugin",
				},
				templateManagement: {
					title: "Template Configuration",
					addTemplate: "Add Template",
					editTemplate: "Edit Template",
					deleteTemplate: "Delete",
					saveTemplate: "Save",
					cancel: "Cancel",
					emptyState:
						'No templates configured yet. Click "Add Template" to get started.',
					enablePluginFirst:
						"Please enable core Templates plugin first",
				},
				templateForm: {
					title: "Template Configuration",
					targetFolder: "Target Folder",
					templateFile: "Template File",
					fileNameRule: "File Name Rule",
					fileNameRulePlaceholder: "e.g.: {{date}}-{{title}}",
					addNewTemplate: "Add New Template",
					editTemplateConfig: "Edit Template Configuration",
					noTemplateSelected: "No template selected",
					optional: "(Optional)",
					targetFolderPlaceholder: "Select or enter folder path",
					templateFilePlaceholder: "Select template file",
				},
				actions: {
					edit: "Edit",
					delete: "Delete",
					save: "Save",
					cancel: "Cancel",
				},
				emptyState: {
					title: "No templates configured",
					description:
						'Click the "Add Template" button above to get started',
				},
			},
		},
	},
};

export default translations;
