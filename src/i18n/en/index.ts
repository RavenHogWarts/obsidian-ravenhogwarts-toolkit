import type { BaseTranslation } from '../i18n-types'

const en = {
	common: {
		enabled: "Enabled",
		enabledDesc: "Turn this tool on or off",
		noConfig: "This tool has no configurable options",
		add: "Add",
		delete: "Delete",
		reset: "Reset",
		moveUp: "Move up",
		moveDown: "Move down",
	},
	settings: {
		folder_templates: {
			name: "Folder templates",
			desc: "Apply templates seamlessly when creating new files in specified folders",
			templatesFolderPath: {
				name: "Templates folder path",
				desc: "The folder where template files are stored; leave empty to follow the official templates plugin configuration",
			},
			rules: {
				name: "Template rules",
				unnamed: "New rule",
				enabledDesc: "Turn this rule on or off",
				templateFile: {
					name: "Template file",
					desc: "Template applied when the rule matches; supports date, time and variable expressions",
				},
				applyMode: {
					name: "Apply mode",
					desc: "What to do when the file already has content",
					emptyOnly: "Empty files only",
					prepend: "Prepend to content",
				},
				renameFormat: {
					name: "Rename format",
					desc: "Rename the file on creation using this template, supports variable expressions; leave empty to disable",
				},
			},
			scopes: {
				name: "Match conditions",
				empty: "The rule will not take effect without match conditions",
				typeFolder: "Folder",
				typeExcludeFolder: "Exclude folder",
				typeFilenamePattern: "Filename regex",
				typeRoot: "Vault root",
				pathPlaceholder: "folder/path",
				patternPlaceholder: "^\\d+-\\d+",
				includeSubfolders: "Include subfolders",
			},
		},
		quick_path: {
			name: "Quick path",
			desc: "Quickly get the path of a specified file/folder",
			addEditorMenu: {
				name: "Add editor menu",
				desc: "Add an option to paste the current file path in the editor menu",
			},
			addFileMenu: {
				name: "Add file list menu",
				desc: "Add an option to copy the file/folder path in the file list menu",
			},
			useAbsolutePath: {
				name: "Absolute path",
				desc: "Use absolute path, starting from the root directory of the operating system",
			},
			pathSeparator: {
				name: "Path separator",
				desc: "Separator for multiple paths",
				newline: "Newline",
				comma: "Comma",
				semicolon: "Semicolon",
				space: "Space",
			},
		},
	},
	command: {
		quick_path: {
			copy_current_file_path: "Copy current file path",
			copy_current_folder_path: "Copy current folder path",
		},
	},
	menu: {
		quick_path: {
			copy_file_path: "Copy file path",
			copy_files_path: "Copy multiple paths",
			copy_folder_path: "Copy folder path",
			paste_current_file_path: "Paste current file path",
			paste_current_folder_path: "Paste current folder path",
		},
	},
	notice: {
		quick_path: {
			copy_success: "Path copied to clipboard",
			copy_failure: "Failed to copy path",
			root_path_warning: "The current file is in the root directory, unable to get the parent folder path",
		},
	},
} satisfies BaseTranslation;

export default en;
