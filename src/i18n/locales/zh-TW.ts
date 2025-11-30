import { BaseMessage } from "@src/i18n/types";

const translations: BaseMessage = {
	settings: {
		quick_path: {
			name: "快速路徑",
			desc: "快速獲取指定文件/文件夾的路徑",
			addEditorMenu: {
				name: "添加編輯器菜單",
				desc: "在編輯器菜單中添加粘貼當前文件路徑的選項",
			},
			addFileMenu: {
				name: "添加文件列表菜單",
				desc: "在文件列表菜單中添加複製文件/文件夾路徑的選項",
			},
			useAbsolutePath: {
				name: "絕對路徑",
				desc: "使用絕對路徑，即從操作系統根目錄開始的路徑",
			},
			separator: {
				name: "分隔符",
				desc: "多個路徑的分隔符",
				newline: "換行",
				comma: "逗號",
				semicolon: "分號",
				space: "空格",
			},
		},
	},
};

export default translations;
