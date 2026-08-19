import { AbstractInputSuggest, App } from "obsidian";
import type { IInstalledPluginEntry } from "../types";

export interface PluginSuggestOptions {
	/** 惰性取值：候选源为已安装插件缓存（每次查询重新取，反映最新缓存） */
	getCandidates: () => IInstalledPluginEntry[];
	/** 惰性取值：候选须排除已在优先列表中的 id（反映最新列表状态） */
	excludeIds: () => Set<string>;
}

/**
 * 已安装插件联想输入（候选来自本工具的已安装插件缓存，无论是否启用）。
 * 联想条目按 name 呈现（id 作次要信息），选中后回传 **id**——显示用 name、存储用 id。
 */
export class PluginSuggest extends AbstractInputSuggest<IInstalledPluginEntry> {
	constructor(
		app: App,
		inputEl: HTMLInputElement,
		private readonly onSelectId: (id: string) => void,
		private readonly options: PluginSuggestOptions
	) {
		super(app, inputEl);
	}

	protected getSuggestions(query: string): IInstalledPluginEntry[] {
		const q = query.toLowerCase();
		const excluded = this.options.excludeIds();
		return this.options
			.getCandidates()
			.filter((entry) => !excluded.has(entry.id))
			.filter(
				(entry) =>
					entry.id.toLowerCase().includes(q) ||
					entry.name.toLowerCase().includes(q)
			);
	}

	renderSuggestion(entry: IInstalledPluginEntry, el: HTMLElement): void {
		el.createSpan({ cls: "rht-po-suggest-name" }).setText(entry.name);
		el.createSpan({ cls: "rht-po-suggest-id" }).setText(entry.id);
	}

	selectSuggestion(entry: IInstalledPluginEntry): void {
		this.setValue("");
		this.onSelectId(entry.id);
		this.close();
	}
}
