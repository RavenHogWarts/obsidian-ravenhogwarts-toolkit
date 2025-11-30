import { BaseMessage } from "@src/i18n/types";

// Remember [use sentence case in UI](https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines#Use+sentence+case+in+UI)
const translations: BaseMessage = {
	settings: {
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
};

export default translations;
