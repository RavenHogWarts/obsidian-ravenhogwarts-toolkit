import { AbstractInputSuggest, App, TFile, TFolder } from "obsidian";

/** 归一化为 a/b/c 形式（去反斜杠、折叠重复斜杠、去首尾斜杠） */
function normalizeFolder(path: string): string {
	return path
		.replace(/\\/g, "/")
		.replace(/\/+/g, "/")
		.replace(/^\/|\/$/g, "");
}

export interface FileSuggestOptions {
	/** 仅联想满足该谓词的文件 */
	filter?: (file: TFile) => boolean;
	/** 若提供且非空，仅联想该文件夹（含子文件夹）下的文件；惰性求值以反映最新配置 */
	baseFolder?: () => string;
}

/**
 * 文件路径联想输入。命中后回传文件完整路径（含扩展名）。
 * 通过 `options.baseFolder` 可把候选限定在指定文件夹内。
 */
export class FileSuggest extends AbstractInputSuggest<TFile> {
	constructor(
		app: App,
		inputEl: HTMLInputElement,
		private readonly onSelectPath: (path: string) => void,
		private readonly options: FileSuggestOptions = {}
	) {
		super(app, inputEl);
	}

	protected getSuggestions(query: string): TFile[] {
		const q = query.toLowerCase();
		const base = this.options.baseFolder
			? normalizeFolder(this.options.baseFolder())
			: "";
		return this.app.vault
			.getFiles()
			.filter(
				(file) => !this.options.filter || this.options.filter(file)
			)
			.filter(
				(file) =>
					base === "" ||
					normalizeFolder(file.path).startsWith(base + "/")
			)
			.filter((file) => file.path.toLowerCase().includes(q));
	}

	renderSuggestion(file: TFile, el: HTMLElement): void {
		el.setText(file.path);
	}

	selectSuggestion(file: TFile): void {
		this.setValue(file.path);
		this.onSelectPath(file.path);
		this.close();
	}
}

export interface FolderSuggestOptions {
	/** 是否在联想中包含 vault 根目录；默认 true */
	includeRoot?: boolean;
}

/**
 * 文件夹路径联想输入。命中后回传文件夹路径。
 * 通过 `options.includeRoot: false` 可排除 vault 根目录（其 path 为 "/"，
 * 归一化后为空串）：FOLDER 作用域填根目录不会命中，整库范围应改用 ROOT 作用域，
 * 故不把根目录列入候选，避免两种写法语义重复。
 */
export class FolderSuggest extends AbstractInputSuggest<TFolder> {
	constructor(
		app: App,
		inputEl: HTMLInputElement,
		private readonly onSelectPath: (path: string) => void,
		private readonly options: FolderSuggestOptions = {}
	) {
		super(app, inputEl);
	}

	protected getSuggestions(query: string): TFolder[] {
		const q = query.toLowerCase();
		const includeRoot = this.options.includeRoot ?? true;
		return this.app.vault
			.getAllFolders(includeRoot)
			.filter((folder) => folder.path.toLowerCase().includes(q));
	}

	renderSuggestion(folder: TFolder, el: HTMLElement): void {
		el.setText(folder.path);
	}

	selectSuggestion(folder: TFolder): void {
		this.setValue(folder.path);
		this.onSelectPath(folder.path);
		this.close();
	}
}
