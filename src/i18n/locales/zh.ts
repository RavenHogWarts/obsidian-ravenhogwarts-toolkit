import { BaseMessage } from "@src/i18n/types";

const translations: BaseMessage = {
	settings: {
		quick_path: {
			name: "快速路径",
			desc: "快速获取指定文件/文件夹的路径",
			addEditorMenu: {
				name: "添加编辑器菜单",
				desc: "在编辑器菜单中添加粘贴当前文件路径的选项",
			},
			addFileMenu: {
				name: "添加文件列表菜单",
				desc: "在文件列表菜单中添加复制文件/文件夹路径的选项",
			},
			useAbsolutePath: {
				name: "绝对路径",
				desc: "使用绝对路径，即从操作系统根目录开始的路径",
			},
			separator: {
				name: "分隔符",
				desc: "多个路径的分隔符",
				newline: "换行",
				comma: "逗号",
				semicolon: "分号",
				space: "空格",
			},
		},
	},
};

export default translations;
