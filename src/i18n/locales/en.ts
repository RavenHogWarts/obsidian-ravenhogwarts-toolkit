import { BaseMessage } from "@src/i18n/types";

// Remember [use sentence case in UI](https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines#Use+sentence+case+in+UI)
const translations: BaseMessage = {
	settings: {
		folder_templates: {
			name: "Folder Templates",
			desc: "Apply templates seamlessly when creating new files in specified folders",
		},
		quick_path: {
			name: "Quick Path",
			desc: "Quickly get the path of a specified file/folder",
			addEditorMenu: {
				name: "Add Editor Menu",
				desc: "Add an option to paste the current file path in the editor menu",
			},
			addFileMenu: {
				name: "Add File List Menu",
				desc: "Add an option to copy the file/folder path in the file list menu",
			},
			useAbsolutePath: {
				name: "Absolute Path",
				desc: "Use absolute path, starting from the root directory of the operating system",
			},
			separator: {
				name: "Separator",
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
			root_path_warning:
				"The current file is in the root directory, unable to get the parent folder path",
		},
	},
};

export default translations;
